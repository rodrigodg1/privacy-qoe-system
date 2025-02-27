"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInstance = void 0;
const fhevmjs_1 = require("fhevmjs");
const hardhat_1 = require("hardhat");
const constants_1 = require("./constants");
const fhevmjsMocked_1 = require("./fhevmjsMocked");
const kmsAdd = constants_1.KMSVERIFIER_ADDRESS;
const aclAdd = constants_1.ACL_ADDRESS;
const createInstance = async () => {
    if (hardhat_1.network.name === "hardhat") {
        const instance = {
            reencrypt: fhevmjsMocked_1.reencryptRequestMocked,
            createEncryptedInput: fhevmjsMocked_1.createEncryptedInputMocked,
            getPublicKey: () => "0xFFAA44433",
            generateKeypair: fhevmjs_1.generateKeypair,
            createEIP712: (0, fhevmjs_1.createEIP712)(hardhat_1.network.config.chainId),
        };
        return instance;
    }
    else {
        const instance = await (0, fhevmjs_1.createInstance)({
            kmsContractAddress: kmsAdd,
            aclContractAddress: aclAdd,
            networkUrl: hardhat_1.network.config.url,
            gatewayUrl: constants_1.GATEWAY_URL,
        });
        return instance;
    }
};
exports.createInstance = createInstance;
//# sourceMappingURL=instance.js.map