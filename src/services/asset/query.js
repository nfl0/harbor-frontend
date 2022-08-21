import { QueryClientImpl } from "comdex-codec/build/comdex/asset/v1beta1/query";
import Long from "long";
import { createQueryClient } from "../helper";




let myClient = null;

export const getQueryService = (callback) => {
  if (myClient) {
    const queryService = new QueryClientImpl(myClient);

    return callback(null, queryService);
  } else {
    createQueryClient((error, client) => {
      if (error) {
        callback(error);
      }
      myClient = client;
      const queryService = new QueryClientImpl(client);

      return callback(null, queryService);
    });
  }
};



export const queryPairs = (offset, limit, countTotal, reverse, callback) => {
  getQueryService((error, queryService) => {
    if (error) {
      callback(error);
      return;
    }

    queryService
      .QueryPairs({
        pagination: {
          key: "",
          offset: Long.fromNumber(offset),
          limit: Long.fromNumber(limit),
          countTotal: countTotal,
          reverse: reverse,
        },
      })
      .then((result) => {
        callback(null, result);
      })
      .catch((error) => {
        callback(error?.message);
      });
  });
};
// export const queryPairs = (offset, limit, countTotal, reverse, callback) => {
//   createQueryClient((error, rpcClient) => {
//     if (error) {
//       callback(error);
//       return;
//     }

//     new QueryClientImpl(rpcClient)
//       .QueryPairs({
//         pagination: {
//           key: "",
//           offset: Long.fromNumber(offset),
//           limit: Long.fromNumber(limit),
//           countTotal: countTotal,
//           reverse: reverse,
//         },
//       })
//       .then((result) => {
//         callback(null, result);
//       })
//       .catch((error) => {
//         callback(error?.message);
//       });
//   });
// };

export const queryAssets = (offset, limit, countTotal, reverse, callback) => {
  getQueryService((error, queryService) => {
    if (error) {
      callback(error);
      return;
    }
    queryService
      .QueryAssets({
        pagination: {
          key: "",
          offset: Long.fromNumber(offset),
          limit: Long.fromNumber(limit),
          countTotal: countTotal,
          reverse: reverse,
        },
      })
      .then((result) => {
        callback(null, result);
      })
      .catch((error) => {
        callback(error?.message);
      });
  });
};

// export const queryAssets = (offset, limit, countTotal, reverse, callback) => {
//   createQueryClient((error, rpcClient) => {
//     if (error) {
//       callback(error);
//       return;
//     }
//     new QueryClientImpl(rpcClient)
//       .QueryAssets({
//         pagination: {
//           key: "",
//           offset: Long.fromNumber(offset),
//           limit: Long.fromNumber(limit),
//           countTotal: countTotal,
//           reverse: reverse,
//         },
//       })
//       .then((result) => {
//         callback(null, result);
//       })
//       .catch((error) => {
//         callback(error?.message);
//       });
//   });
// };

export const queryPair = (pairId, callback) => {
  getQueryService((error, queryService) => {
    if (error) {
      callback(error);
      return;
    }

    queryService
      .QueryPair({
        id: Long.fromNumber(pairId),
      })
      .then((result) => {
        callback(null, result);
      })
      .catch((error) => {
        callback(error?.message);
      });
  });
};

// export const queryPair = (pairId, callback) => {
//   createQueryClient((error, rpcClient) => {
//     if (error) {
//       callback(error);
//       return;
//     }

//     new QueryClientImpl(rpcClient)
//       .QueryPair({
//         id: Long.fromNumber(pairId),
//       })
//       .then((result) => {
//         callback(null, result);
//       })
//       .catch((error) => {
//         callback(error?.message);
//       });
//   });

export const queryExtendedPairVaultById = (productId, callback) => {
  getQueryService((error, queryService) => {
    if (error) {
      callback(error);
      return;
    }
    queryService
      .QueryAllExtendedPairVaultsByApp({
        appId: Long.fromNumber(productId),
      })
      .then((result) => {
        callback(null, result);
      })
      .catch((error) => {
        callback(error?.message);
      });
  });
};
// };


// export const queryExtendedPairVaultById = (productId, callback) => {
//   createQueryClient((error, rpcClient) => {
//     if (error) {
//       callback(error);
//       return;
//     }
//     new QueryClientImpl(rpcClient)
//       .QueryAllExtendedPairVaultsByApp({
//         appId: Long.fromNumber(productId),
//       })
//       .then((result) => {
//         callback(null, result);
//       })
//       .catch((error) => {
//         callback(error?.message);
//       });
//   });
// };

export const queryPairVault = (pairId, callback) => {
  getQueryService((error, queryService) => {
    if (error) {
      callback(error);
      return;
    }
    queryService
      .QueryExtendedPairVault({
        id: Long.fromNumber(pairId),
      })
      .then((result) => {
        callback(null, result);
      })
      .catch((error) => {
        callback(error?.message);
      });
  });
};

// export const queryPairVault = (pairId, callback) => {
//   createQueryClient((error, rpcClient) => {
//     if (error) {
//       callback(error);
//       return;
//     }
//     new QueryClientImpl(rpcClient)
//       .QueryExtendedPairVault({
//         id: Long.fromNumber(pairId),
//       })
//       .then((result) => {
//         callback(null, result);
//       })
//       .catch((error) => {
//         callback(error?.message);
//       });
//   });
// };


export const queryPairVaults = (callback) => {
  getQueryService((error, queryService) => {
    if (error) {
      callback(error);
      return;
    }

    queryService
      .QueryAllExtendedPairVaultsByApp({
        appId: Long.fromNumber(1),
      })
      .then((result) => {
        callback(null, result);
      })
      .catch((error) => {
        callback(error?.message);
      });
  });
};

// export const queryPairVaults = (callback) => {
//   createQueryClient((error, rpcClient) => {
//     if (error) {
//       callback(error);
//       return;
//     }

//     new QueryClientImpl(rpcClient)
//       .QueryAllExtendedPairVaultsByApp({
//         appId: Long.fromNumber(1),
//       })
//       .then((result) => {
//         callback(null, result);
//       })
//       .catch((error) => {
//         callback(error?.message);
//       });
//   });
// };

export const queryAsset = (id, callback) => {
  getQueryService((error, queryService) => {
    if (error) {
      callback(error);
      return;
    }

    queryService
      .QueryAsset({
        id: Long.fromNumber(id),
      })
      .then((result) => {
        callback(null, result);
      })
      .catch((error) => {
        callback(error?.message);
      });
  });
};

// export const queryAsset = (id, callback) => {
//   createQueryClient((error, rpcClient) => {
//     if (error) {
//       callback(error);
//       return;
//     }

//     new QueryClientImpl(rpcClient)
//       .QueryAsset({
//         id: Long.fromNumber(id),
//       })
//       .then((result) => {
//         callback(null, result);
//       })
//       .catch((error) => {
//         callback(error?.message);
//       });
//   });
// };