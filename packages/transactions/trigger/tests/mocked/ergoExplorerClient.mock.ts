import { rwtRepoAddress, sampleRwtRepoboxInfo } from '../triggerTxTestData';

export function mockedErgoExplorerClientFactory(
  url: string,
  boxInfo: any = sampleRwtRepoboxInfo,
  repoAddress: string = rwtRepoAddress
) {
  return {
    v1: {
      async getApiV1BoxesUnspentByaddressP1(p1: string) {
        if (p1 === repoAddress) {
          return {
            items: [boxInfo],
            total: 1,
          };
        }
        return {
          items: [],
          total: 0,
        };
      },
      async getApiV1BoxesP1(boxId: string) {
        if (boxId === boxInfo.boxId) {
          return boxInfo;
        }
        throw new Error('no boxes with this id were found');
      },
    },
  };
}
