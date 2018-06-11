// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  aerumProvider:"ws://127.0.0.1:7546",
  rinkebyProvider:"ws://127.0.0.1:7546",
  accountAliasses:"anyalias,radek.aer",
  swapEventListener:true,
  AtomicSwapERC20:"0x3d9d45c0411652442d7d66b55e8f6f8f1e746f70",
  AtomicSwapEtherAddress:"0x28451827cff55b66fb02edaf7612b5f80d927f04",
  returnUrl: "http://rinkeby.aerum.net:4200/success",
  returnUrlFailed:"http://rinkeby.aerum.net:4200/failed",
  MongoConn:"mongodb://paddy:UK4L6z4cXWvh@ds147420.mlab.com:47420/aerbase",
  walletURL:"http://dev.aerum.net",
  middlewareURL:"http://rinkeby.aerum.net:3001"
};

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
