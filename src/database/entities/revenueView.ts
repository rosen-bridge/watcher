import { ViewEntity, ViewColumn } from 'typeorm';
import { DOING_STATUS, DONE_STATUS } from '../../config/constants';

@ViewEntity({
  name: 'revenue_view',
  expression: (connection) =>
    connection
      .createQueryBuilder()
      .select('pe.id', 'id')
      .addSelect('pe."boxSerialized"', 'boxSerialized')
      .addSelect('pe."txId"', 'permitTxId')
      .addSelect('ete."eventId"', 'eventId')
      .addSelect('ete.height', 'lockHeight')
      .addSelect('ete."fromChain"', 'fromChain')
      .addSelect('ete."toChain"', 'toChain')
      .addSelect('ete."fromAddress"', 'fromAddress')
      .addSelect('ete."toAddress"', 'toAddress')
      .addSelect('ete."amount"', 'amount')
      .addSelect('ete."bridgeFee"', 'bridgeFee')
      .addSelect('ete."networkFee"', 'networkFee')
      .addSelect('ete."sourceChainTokenId"', 'tokenId')
      .addSelect('ete."sourceTxId"', 'lockTxId')
      .addSelect('be.height', 'height')
      .addSelect('be.timestamp', 'timestamp')
      .addSelect(
        `CASE WHEN "ete"."spendTxId" IS NULL THEN '${DOING_STATUS}' ELSE '${DONE_STATUS}' END`,
        'status'
      )
      .from('permit_entity', 'pe')
      .leftJoin('event_trigger_entity', 'ete', 'pe."txId" = ete."txId"')
      .leftJoin('block_entity', 'be', 'pe.block = be.hash'),
})
export class RevenueView {
  @ViewColumn()
  id!: number;

  @ViewColumn()
  boxSerialized!: string;

  @ViewColumn()
  permitTxId!: string;

  @ViewColumn()
  eventId!: string;

  @ViewColumn()
  lockHeight!: number;

  @ViewColumn()
  fromChain!: string;

  @ViewColumn()
  toChain!: string;

  @ViewColumn()
  fromAddress!: string;

  @ViewColumn()
  toAddress!: string;

  @ViewColumn()
  amount!: string;

  @ViewColumn()
  bridgeFee!: string;

  @ViewColumn()
  networkFee!: string;

  @ViewColumn()
  tokenId!: string;

  @ViewColumn()
  lockTxId!: string;

  @ViewColumn()
  height!: number;

  @ViewColumn()
  timestamp!: number;

  @ViewColumn()
  status!: string;
}
