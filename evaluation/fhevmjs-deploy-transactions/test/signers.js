"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSigners = exports.initSigners = void 0;
const hardhat_1 = require("hardhat");
const constants_1 = require("./constants");
const signers = {};
const initSigners = async () => {
    if (Object.entries(signers).length === 0) {
        const eSigners = await hardhat_1.ethers.getSigners();
        for (let index = 0; index < constants_1.ACCOUNT_NAMES.length; index++) {
            const name = constants_1.ACCOUNT_NAMES[index];
            signers[name] = eSigners[index];
        }
    }
};
exports.initSigners = initSigners;
const getSigners = async () => {
    return signers;
};
exports.getSigners = getSigners;
//# sourceMappingURL=signers.js.map