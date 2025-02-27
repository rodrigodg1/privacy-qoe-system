const { createInstance } = require("fhevmjs");

const createFhevmInstance = async () => {
  return createInstance({
    chainId: 9000,
    networkUrl: "http://localhost:8545",
    kmsContractAddress: "0x12B064FB845C1cc05e9493856a1D637a73e944bE",
    aclContractAddress: "0x2Fb4341027eb1d2aD8B5D9708187df8633cAFA92",
    gatewayUrl: 'http://localhost:7077'

});
};
createFhevmInstance().then((instance) => {
  console.log(instance);
});