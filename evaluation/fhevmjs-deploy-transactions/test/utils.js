"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debug = exports.produceDummyTransactions = exports.waitNBlocks = exports.bigIntToBytes256 = exports.bigIntToBytes128 = exports.bigIntToBytes64 = exports.mineNBlocks = void 0;
const bigint_buffer_1 = require("bigint-buffer");
const hardhat_1 = require("hardhat");
const coprocessorUtils_1 = require("./coprocessorUtils");
const mineNBlocks = async (n) => {
    for (let index = 0; index < n; index++) {
        await hardhat_1.ethers.provider.send("evm_mine");
    }
};
exports.mineNBlocks = mineNBlocks;
const bigIntToBytes64 = (value) => {
    return new Uint8Array((0, bigint_buffer_1.toBufferBE)(value, 64));
};
exports.bigIntToBytes64 = bigIntToBytes64;
const bigIntToBytes128 = (value) => {
    return new Uint8Array((0, bigint_buffer_1.toBufferBE)(value, 128));
};
exports.bigIntToBytes128 = bigIntToBytes128;
const bigIntToBytes256 = (value) => {
    return new Uint8Array((0, bigint_buffer_1.toBufferBE)(value, 256));
};
exports.bigIntToBytes256 = bigIntToBytes256;
const waitNBlocks = async (Nblocks) => {
    const currentBlock = await hardhat_1.ethers.provider.getBlockNumber();
    if (hardhat_1.network.name === "hardhat") {
        await (0, exports.produceDummyTransactions)(Nblocks);
    }
    await waitForBlock(currentBlock + Nblocks);
};
exports.waitNBlocks = waitNBlocks;
const produceDummyTransactions = async (blockCount) => {
    let counter = blockCount;
    while (counter >= 0) {
        counter--;
        const [signer] = await hardhat_1.ethers.getSigners();
        const nullAddress = "0x0000000000000000000000000000000000000000";
        const tx = {
            to: nullAddress,
            value: 0n,
        };
        const receipt = await signer.sendTransaction(tx);
        await receipt.wait();
    }
};
exports.produceDummyTransactions = produceDummyTransactions;
const waitForBlock = (blockNumber) => {
    return new Promise((resolve, reject) => {
        const waitBlock = async (currentBlock) => {
            if (blockNumber <= BigInt(currentBlock)) {
                await hardhat_1.ethers.provider.off("block", waitBlock);
                resolve(blockNumber);
            }
        };
        hardhat_1.ethers.provider.on("block", waitBlock).catch((err) => {
            reject(err);
        });
    });
};
const EBOOL_T = 0;
const EUINT4_T = 1;
const EUINT8_T = 2;
const EUINT16_T = 3;
const EUINT32_T = 4;
const EUINT64_T = 5;
const EUINT128_T = 6;
const EUINT160_T = 7;
const EUINT256_T = 8;
const EBYTES64_T = 9;
const EBYTES128_T = 10;
const EBYTES256_T = 11;
function verifyType(handle, expectedType) {
    if (handle === 0n) {
        throw "Handle is not initialized";
    }
    if (handle.toString(2).length > 256) {
        throw "Handle is not a bytes32";
    }
    const typeCt = handle >> 8n;
    if (Number(typeCt % 256n) !== expectedType) {
        throw "Wrong encrypted type for the handle";
    }
}
exports.debug = {
    decryptBool: async (handle) => {
        verifyType(handle, EBOOL_T);
        if (hardhat_1.network.name === "hardhat") {
            await (0, coprocessorUtils_1.awaitCoprocessor)();
            return (await (0, coprocessorUtils_1.getClearText)(handle)) === "1";
        }
        else {
            throw Error("The debug.decryptBool function can only be called in mocked mode");
        }
    },
    decrypt4: async (handle) => {
        verifyType(handle, EUINT4_T);
        if (hardhat_1.network.name === "hardhat") {
            await (0, coprocessorUtils_1.awaitCoprocessor)();
            return BigInt(await (0, coprocessorUtils_1.getClearText)(handle));
        }
        else {
            throw Error("The debug.decrypt4 function can only be called in mocked mode");
        }
    },
    decrypt8: async (handle) => {
        verifyType(handle, EUINT8_T);
        if (hardhat_1.network.name === "hardhat") {
            await (0, coprocessorUtils_1.awaitCoprocessor)();
            return BigInt(await (0, coprocessorUtils_1.getClearText)(handle));
        }
        else {
            throw Error("The debug.decrypt8 function can only be called in mocked mode");
        }
    },
    decrypt16: async (handle) => {
        verifyType(handle, EUINT16_T);
        if (hardhat_1.network.name === "hardhat") {
            await (0, coprocessorUtils_1.awaitCoprocessor)();
            return BigInt(await (0, coprocessorUtils_1.getClearText)(handle));
        }
        else {
            throw Error("The debug.decrypt16 function can only be called in mocked mode");
        }
    },
    decrypt32: async (handle) => {
        verifyType(handle, EUINT32_T);
        if (hardhat_1.network.name === "hardhat") {
            await (0, coprocessorUtils_1.awaitCoprocessor)();
            return BigInt(await (0, coprocessorUtils_1.getClearText)(handle));
        }
        else {
            throw Error("The debug.decrypt32 function can only be called in mocked mode");
        }
    },
    decrypt64: async (handle) => {
        verifyType(handle, EUINT64_T);
        if (hardhat_1.network.name === "hardhat") {
            await (0, coprocessorUtils_1.awaitCoprocessor)();
            return BigInt(await (0, coprocessorUtils_1.getClearText)(handle));
        }
        else {
            throw Error("The debug.decrypt64 function can only be called in mocked mode");
        }
    },
    decrypt128: async (handle) => {
        verifyType(handle, EUINT128_T);
        if (hardhat_1.network.name === "hardhat") {
            await (0, coprocessorUtils_1.awaitCoprocessor)();
            return BigInt(await (0, coprocessorUtils_1.getClearText)(handle));
        }
        else {
            throw Error("The debug.decrypt128 function can only be called in mocked mode");
        }
    },
    decrypt256: async (handle) => {
        verifyType(handle, EUINT256_T);
        if (hardhat_1.network.name === "hardhat") {
            await (0, coprocessorUtils_1.awaitCoprocessor)();
            return BigInt(await (0, coprocessorUtils_1.getClearText)(handle));
        }
        else {
            throw Error("The debug.decrypt256 function can only be called in mocked mode");
        }
    },
    decryptAddress: async (handle) => {
        verifyType(handle, EUINT160_T);
        if (hardhat_1.network.name === "hardhat") {
            await (0, coprocessorUtils_1.awaitCoprocessor)();
            const bigintAdd = BigInt(await (0, coprocessorUtils_1.getClearText)(handle));
            const handleStr = "0x" + bigintAdd.toString(16).padStart(40, "0");
            return handleStr;
        }
        else {
            throw Error("The debug.decryptAddress function can only be called in mocked mode");
        }
    },
    decryptEbytes64: async (handle) => {
        verifyType(handle, EBYTES64_T);
        if (hardhat_1.network.name === "hardhat") {
            await (0, coprocessorUtils_1.awaitCoprocessor)();
            return hardhat_1.ethers.toBeHex(await (0, coprocessorUtils_1.getClearText)(handle), 64);
        }
        else {
            throw Error("The debug.decryptEbytes64 function can only be called in mocked mode");
        }
    },
    decryptEbytes128: async (handle) => {
        verifyType(handle, EBYTES128_T);
        if (hardhat_1.network.name === "hardhat") {
            await (0, coprocessorUtils_1.awaitCoprocessor)();
            return hardhat_1.ethers.toBeHex(await (0, coprocessorUtils_1.getClearText)(handle), 128);
        }
        else {
            throw Error("The debug.decryptEbytes128 function can only be called in mocked mode");
        }
    },
    decryptEbytes256: async (handle) => {
        verifyType(handle, EBYTES256_T);
        if (hardhat_1.network.name === "hardhat") {
            await (0, coprocessorUtils_1.awaitCoprocessor)();
            return hardhat_1.ethers.toBeHex(await (0, coprocessorUtils_1.getClearText)(handle), 256);
        }
        else {
            throw Error("The debug.decryptEbytes256 function can only be called in mocked mode");
        }
    },
};
//# sourceMappingURL=utils.js.map