import {
  AbstractMinimumFeeNetwork,
  ErgoBoxWrapper,
} from '@rosen-bridge/minimum-fee';
import JsonBigInt from '@rosen-bridge/json-bigint';
import rateLimitedAxios, {
  AxiosAdapter,
  AxiosInstance,
} from '@rosen-clients/rate-limited-axios';

// Defensive BCH read ceilings, not protocol limits. The empty terminal page
// counts toward 20 requests per batch, allowing at most 950 rows for one NFT.
const PAGE_SIZE = 50;
const MAX_PAGES = 20;
const MAX_PAGE_BYTES = 1024 * 1024;
const MAX_BATCH_BYTES = 8 * MAX_PAGE_BYTES;

type Batch = {
  controller: AbortController;
  deadline: number;
  bytes: number;
  requests: number;
  failure?: Error;
  reads: Map<string, Promise<ErgoBoxWrapper[]>>;
};

/** Keeps transport failures safe for the minimum-fee library's error logger. */
class MinimumFeeReadError extends Error {
  /** Constructs only a local fixed message, never a transport error or body. */
  constructor(reason: string) {
    super(`Bitcoin Cash minimum-fee ${reason}`);
  }
}
const failure = (reason: string) => new MinimumFeeReadError(reason);

/** Preserves integer strings accepted by Ergo clients without a Number round-trip. */
const amount = (value: unknown): bigint => {
  // Twenty decimal digits cover Ergo amounts while bounding conversion work.
  if (typeof value === 'bigint' && value >= 0n && value.toString().length <= 20)
    return value;
  if (typeof value === 'string' && /^[0-9]{1,20}$/.test(value))
    return BigInt(value);
  throw failure('invalid response');
};

/** An Ergo read port with one deadline and cancellation owner per BCH batch. */
export class BitcoinCashMinimumFeeNetwork extends AbstractMinimumFeeNetwork {
  private client: AxiosInstance;
  private batch?: Batch;

  /** Creates an isolated client; the optional adapter is a deterministic test seam. */
  constructor(
    url: string,
    private readonly kind: 'node' | 'explorer',
    adapter?: AxiosAdapter
  ) {
    super();
    this.client = rateLimitedAxios.create({
      baseURL: url,
      ...(adapter ? { adapter } : {}),
      responseType: 'text',
      transformResponse: [(data: string) => data],
      maxContentLength: MAX_PAGE_BYTES,
      maxRedirects: 0,
    });
  }

  /** Aborts the currently owned batch, including active HTTP and queued requests. */
  cancel = () => this.batch?.controller.abort();

  /**
   * Runs one batch. Overlap is rejected rather than rebinding active reads.
   * A new invocation gets a fresh controller, NFT cache and byte budget.
   */
  run = async <T>(deadline: number, work: () => Promise<T>): Promise<T> => {
    if (this.batch) throw failure('batch already active');
    const remaining = deadline - Date.now();
    if (
      !Number.isSafeInteger(remaining) ||
      remaining <= 0 ||
      remaining > 0x7fffffff
    )
      throw failure('deadline exceeded');
    const batch: Batch = {
      controller: new AbortController(),
      deadline,
      bytes: 0,
      requests: 0,
      reads: new Map(),
    };
    this.batch = batch;
    const cancelled = new Promise<never>((_, reject) => {
      batch.controller.signal.addEventListener(
        'abort',
        () => {
          reject(
            batch.failure ??
              failure(
                Date.now() >= deadline ? 'deadline exceeded' : 'batch cancelled'
              )
          );
        },
        { once: true }
      );
    });
    const timer = setTimeout(() => batch.controller.abort(), remaining);
    try {
      const result = await Promise.race([
        Promise.resolve().then(work),
        cancelled,
      ]);
      this.assertActive(batch);
      return result;
    } finally {
      clearTimeout(timer);
      batch.controller.abort();
      this.batch = undefined;
    }
  };

  /** Refuses both new pages and responses that arrived after the batch expired. */
  private assertActive = (batch: Batch) => {
    if (Date.now() >= batch.deadline) throw failure('deadline exceeded');
    if (batch.controller.signal.aborted) throw failure('batch cancelled');
  };

  /** Shares one complete NFT lookup among every fee box in the same batch. */
  getBoxesByTokenId = (tokenId: string): Promise<ErgoBoxWrapper[]> => {
    const batch = this.batch;
    if (!batch) return Promise.reject(failure('batch is not active'));
    try {
      this.assertActive(batch);
    } catch (error) {
      return Promise.reject(error);
    }
    let read = batch.reads.get(tokenId);
    if (!read) {
      read = this.fetchPages(batch, tokenId);
      batch.reads.set(tokenId, read);
    }
    return read;
  };

  /** Reads only bounded unspent-box pages and preserves lossless Ergo amounts. */
  private fetchPages = async (batch: Batch, tokenId: string) => {
    const boxes: ErgoBoxWrapper[] = [];
    try {
      for (let page = 0; page < MAX_PAGES; page++) {
        this.assertActive(batch);
        if (batch.requests >= MAX_PAGES)
          throw failure('request limit exceeded');
        batch.requests++;
        const prefix =
          this.kind === 'node' ? '/blockchain/box' : '/api/v1/boxes';
        const response = await this.client.get<string>(
          `${prefix}/unspent/byTokenId/${encodeURIComponent(tokenId)}`,
          {
            params: { offset: page * PAGE_SIZE, limit: PAGE_SIZE },
            timeout: batch.deadline - Date.now(),
            signal: batch.controller.signal,
          }
        );
        this.assertActive(batch);
        if (typeof response.data !== 'string')
          throw failure('invalid response');
        const bytes = Buffer.byteLength(response.data, 'utf8');
        batch.bytes += bytes;
        if (bytes > MAX_PAGE_BYTES || batch.bytes > MAX_BATCH_BYTES)
          throw failure('response size limit exceeded');
        const decoded = JsonBigInt.parse(response.data);
        this.assertActive(batch);
        const rows: unknown = this.kind === 'node' ? decoded : decoded?.items;
        if (!Array.isArray(rows) || rows.length > PAGE_SIZE)
          throw failure('invalid response');
        if (rows.length === 0) return boxes;
        boxes.push(...rows.map((box) => this.wrapBox(box)));
      }
      throw failure('page limit exceeded');
    } catch (error) {
      // Never propagate endpoint credentials, response bodies or Axios config.
      this.assertActive(batch);
      batch.failure =
        error instanceof MinimumFeeReadError ? error : failure('read failed');
      batch.controller.abort();
      throw batch.failure;
    }
  };

  /** Adapts the same node/explorer register shapes accepted by minimum-fee. */
  private wrapBox = (value: unknown): ErgoBoxWrapper => {
    if (!value || typeof value !== 'object') throw failure('invalid response');
    const box = value as Omit<ErgoBoxWrapper, 'additionalRegisters'> & {
      transactionId?: string;
      additionalRegisters?: Record<
        string,
        string | { serializedValue: string }
      >;
    };
    if (
      !Array.isArray(box.assets) ||
      typeof box.ergoTree !== 'string' ||
      !box.additionalRegisters ||
      box.assets.some((asset) => typeof asset.tokenId !== 'string')
    )
      throw failure('invalid response');
    const registers: NonNullable<ErgoBoxWrapper['additionalRegisters']> = {};
    for (const key of ['R4', 'R5', 'R6', 'R7', 'R8', 'R9'] as const) {
      const register = box.additionalRegisters[key];
      if (
        this.kind === 'explorer' &&
        register !== undefined &&
        (!register || typeof register !== 'object')
      )
        throw failure('invalid response');
      const serialized =
        this.kind === 'node'
          ? register
          : (register as { serializedValue?: string } | undefined)
              ?.serializedValue;
      if (serialized !== undefined && typeof serialized !== 'string')
        throw failure('invalid response');
      registers[key] = serialized ?? '';
    }
    return {
      boxId: box.boxId ?? '',
      txId: box.transactionId ?? '',
      address: box.address,
      index: Number(box.index ?? 0),
      value: amount(box.value),
      creationHeight: Number(box.creationHeight),
      assets: box.assets.map((asset) => ({
        tokenId: asset.tokenId,
        amount: amount(asset.amount),
      })),
      additionalRegisters: registers,
      ergoTree: box.ergoTree,
      globalIndex: box.globalIndex,
      spentTransactionId: box.spentTransactionId,
    };
  };
}
