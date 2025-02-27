"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInstance = void 0;
const fhevmjs_1 = require("fhevmjs");
const constants_1 = require("../test/constants");
const kmsAdd = constants_1.KMSVERIFIER_ADDRESS;
const aclAdd = constants_1.ACL_ADDRESS;
const createInstance = async (hre) => {
    const instance = await (0, fhevmjs_1.createInstance)({
        kmsContractAddress: kmsAdd,
        aclContractAddress: aclAdd,
        networkUrl: hre.network.config.url,
        gatewayUrl: constants_1.GATEWAY_URL,
    });
    return instance;
};
exports.createInstance = createInstance;
//# sourceMappingURL=instance.js.map