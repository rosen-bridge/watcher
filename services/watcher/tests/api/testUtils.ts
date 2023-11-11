import { ObservationEntity } from '@rosen-bridge/observation-extractor';
import { EventTriggerEntity } from '@rosen-bridge/watcher-data-extractor';
import { ErgoUtils } from '../../src/ergo/utils';

const addLockTokenInfo = (
  items: Array<EventTriggerEntity | ObservationEntity>
) => {
  return items.map((item) => ({
    ...item,
    lockToken: ErgoUtils.tokenDetailByTokenMap(item.sourceChainTokenId, 'ergo'),
  }));
};

export { addLockTokenInfo };
