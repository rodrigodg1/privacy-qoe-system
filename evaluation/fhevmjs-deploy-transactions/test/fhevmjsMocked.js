"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENCRYPTION_TYPES = exports.createEncryptedInputMocked = exports.reencryptRequestMocked = void 0;
const bigint_buffer_1 = require("bigint-buffer");
const crypto_1 = __importDefault(require("crypto"));
const ethers_1 = require("ethers");
const hardhat_1 = __importDefault(require("hardhat"));
const sha3_1 = require("sha3");
const web3_validator_1 = require("web3-validator");
const constants_1 = require("./constants");
const coprocessorUtils_1 = require("./coprocessorUtils");
const coprocessorUtils_2 = require("./coprocessorUtils");
var Types;
(function (Types) {
    Types[Types["ebool"] = 0] = "ebool";
    Types[Types["euint4"] = 1] = "euint4";
    Types[Types["euint8"] = 2] = "euint8";
    Types[Types["euint16"] = 3] = "euint16";
    Types[Types["euint32"] = 4] = "euint32";
    Types[Types["euint64"] = 5] = "euint64";
    Types[Types["euint128"] = 6] = "euint128";
    Types[Types["eaddress"] = 7] = "eaddress";
    Types[Types["euint256"] = 8] = "euint256";
    Types[Types["ebytes64"] = 9] = "ebytes64";
    Types[Types["ebytes128"] = 10] = "ebytes128";
    Types[Types["ebytes256"] = 11] = "ebytes256";
})(Types || (Types = {}));
const sum = (arr) => arr.reduce((acc, val) => acc + val, 0);
function bytesToBigInt(byteArray) {
    if (!byteArray || byteArray?.length === 0) {
        return BigInt(0);
    }
    const buffer = Buffer.from(byteArray);
    const result = (0, bigint_buffer_1.toBigIntBE)(buffer);
    return result;
}
function createUintToUint8ArrayFunction(numBits) {
    const numBytes = Math.ceil(numBits / 8);
    return function (uint) {
        const buffer = (0, bigint_buffer_1.toBufferBE)(BigInt(uint), numBytes);
        const randomBytes = crypto_1.default.randomBytes(32);
        const combinedBuffer = Buffer.concat([buffer, randomBytes]);
        let byteBuffer;
        let totalBuffer;
        switch (numBits) {
            case 2:
                byteBuffer = Buffer.from([Types.ebool]);
                totalBuffer = Buffer.concat([byteBuffer, combinedBuffer]);
                break;
            case 4:
                byteBuffer = Buffer.from([Types.euint4]);
                totalBuffer = Buffer.concat([byteBuffer, combinedBuffer]);
                break;
            case 8:
                byteBuffer = Buffer.from([Types.euint8]);
                totalBuffer = Buffer.concat([byteBuffer, combinedBuffer]);
                break;
            case 16:
                byteBuffer = Buffer.from([Types.euint16]);
                totalBuffer = Buffer.concat([byteBuffer, combinedBuffer]);
                break;
            case 32:
                byteBuffer = Buffer.from([Types.euint32]);
                totalBuffer = Buffer.concat([byteBuffer, combinedBuffer]);
                break;
            case 64:
                byteBuffer = Buffer.from([Types.euint64]);
                totalBuffer = Buffer.concat([byteBuffer, combinedBuffer]);
                break;
            case 128:
                byteBuffer = Buffer.from([Types.euint128]);
                totalBuffer = Buffer.concat([byteBuffer, combinedBuffer]);
                break;
            case 160:
                byteBuffer = Buffer.from([Types.eaddress]);
                totalBuffer = Buffer.concat([byteBuffer, combinedBuffer]);
                break;
            case 256:
                byteBuffer = Buffer.from([Types.euint256]);
                totalBuffer = Buffer.concat([byteBuffer, combinedBuffer]);
                break;
            case 512:
                byteBuffer = Buffer.from([Types.ebytes64]);
                totalBuffer = Buffer.concat([byteBuffer, combinedBuffer]);
                break;
            case 1024:
                byteBuffer = Buffer.from([Types.ebytes128]);
                totalBuffer = Buffer.concat([byteBuffer, combinedBuffer]);
                break;
            case 2048:
                byteBuffer = Buffer.from([Types.ebytes256]);
                totalBuffer = Buffer.concat([byteBuffer, combinedBuffer]);
                break;
            default:
                throw Error("Non-supported numBits");
        }
        return totalBuffer;
    };
}
const reencryptRequestMocked = async (handle, privateKey, publicKey, signature, contractAddress, userAddress) => {
    const domain = {
        name: "Authorization token",
        version: "1",
        chainId: hardhat_1.default.network.config.chainId,
        verifyingContract: contractAddress,
    };
    const types = {
        Reencrypt: [{ name: "publicKey", type: "bytes" }],
    };
    const value = {
        publicKey: `0x${publicKey}`,
    };
    const signerAddress = ethers_1.ethers.verifyTypedData(domain, types, value, `0x${signature}`);
    const normalizedSignerAddress = ethers_1.ethers.getAddress(signerAddress);
    const normalizedUserAddress = ethers_1.ethers.getAddress(userAddress);
    if (normalizedSignerAddress !== normalizedUserAddress) {
        throw new Error("Invalid EIP-712 signature!");
    }
    const aclArtifact = require("fhevm-core-contracts/artifacts/contracts/ACL.sol/ACL.json");
    const acl = await hardhat_1.default.ethers.getContractAt(aclArtifact.abi, constants_1.ACL_ADDRESS);
    const userAllowed = await acl.persistAllowed(handle, userAddress);
    const contractAllowed = await acl.persistAllowed(handle, contractAddress);
    if (!userAllowed) {
        throw new Error("User is not authorized to reencrypt this handle!");
    }
    if (!contractAllowed) {
        throw new Error("dApp contract is not authorized to reencrypt this handle!");
    }
    if (userAddress === contractAddress) {
        throw new Error("userAddress should not be equal to contractAddress when requesting reencryption!");
    }
    await (0, coprocessorUtils_2.awaitCoprocessor)();
    return BigInt(await (0, coprocessorUtils_2.getClearText)(handle));
};
exports.reencryptRequestMocked = reencryptRequestMocked;
const createEncryptedInputMocked = (contractAddress, userAddress) => {
    if (!(0, web3_validator_1.isAddress)(contractAddress)) {
        throw new Error("Contract address is not a valid address.");
    }
    if (!(0, web3_validator_1.isAddress)(userAddress)) {
        throw new Error("User address is not a valid address.");
    }
    const values = [];
    const bits = [];
    return {
        addBool(value) {
            if (value == null)
                throw new Error("Missing value");
            if (typeof value !== "boolean" && typeof value !== "number" && typeof value !== "bigint")
                throw new Error("The value must be a boolean, a number or a bigint.");
            if ((typeof value !== "bigint" || typeof value !== "number") && Number(value) > 1)
                throw new Error("The value must be 1 or 0.");
            values.push(BigInt(value));
            bits.push(2);
            if (sum(bits) > 2048)
                throw Error("Packing more than 2048 bits in a single input ciphertext is unsupported");
            if (bits.length > 256)
                throw Error("Packing more than 256 variables in a single input ciphertext is unsupported");
            return this;
        },
        add4(value) {
            checkEncryptedValue(value, 4);
            values.push(BigInt(value));
            bits.push(4);
            if (sum(bits) > 2048)
                throw Error("Packing more than 2048 bits in a single input ciphertext is unsupported");
            if (bits.length > 256)
                throw Error("Packing more than 256 variables in a single input ciphertext is unsupported");
            return this;
        },
        add8(value) {
            checkEncryptedValue(value, 8);
            values.push(BigInt(value));
            bits.push(8);
            if (sum(bits) > 2048)
                throw Error("Packing more than 2048 bits in a single input ciphertext is unsupported");
            if (bits.length > 256)
                throw Error("Packing more than 256 variables in a single input ciphertext is unsupported");
            return this;
        },
        add16(value) {
            checkEncryptedValue(value, 16);
            values.push(BigInt(value));
            bits.push(16);
            if (sum(bits) > 2048)
                throw Error("Packing more than 2048 bits in a single input ciphertext is unsupported");
            if (bits.length > 256)
                throw Error("Packing more than 256 variables in a single input ciphertext is unsupported");
            return this;
        },
        add32(value) {
            checkEncryptedValue(value, 32);
            values.push(BigInt(value));
            bits.push(32);
            if (sum(bits) > 2048)
                throw Error("Packing more than 2048 bits in a single input ciphertext is unsupported");
            if (bits.length > 256)
                throw Error("Packing more than 256 variables in a single input ciphertext is unsupported");
            return this;
        },
        add64(value) {
            checkEncryptedValue(value, 64);
            values.push(BigInt(value));
            bits.push(64);
            if (sum(bits) > 2048)
                throw Error("Packing more than 2048 bits in a single input ciphertext is unsupported");
            if (bits.length > 256)
                throw Error("Packing more than 256 variables in a single input ciphertext is unsupported");
            return this;
        },
        add128(value) {
            checkEncryptedValue(value, 128);
            values.push(BigInt(value));
            bits.push(128);
            if (sum(bits) > 2048)
                throw Error("Packing more than 2048 bits in a single input ciphertext is unsupported");
            if (bits.length > 256)
                throw Error("Packing more than 256 variables in a single input ciphertext is unsupported");
            return this;
        },
        addAddress(value) {
            if (!(0, web3_validator_1.isAddress)(value)) {
                throw new Error("The value must be a valid address.");
            }
            values.push(BigInt(value));
            bits.push(160);
            if (sum(bits) > 2048)
                throw Error("Packing more than 2048 bits in a single input ciphertext is unsupported");
            if (bits.length > 256)
                throw Error("Packing more than 256 variables in a single input ciphertext is unsupported");
            return this;
        },
        add256(value) {
            checkEncryptedValue(value, 256);
            values.push(BigInt(value));
            bits.push(256);
            if (sum(bits) > 2048)
                throw Error("Packing more than 2048 bits in a single input ciphertext is unsupported");
            if (bits.length > 256)
                throw Error("Packing more than 256 variables in a single input ciphertext is unsupported");
            return this;
        },
        addBytes64(value) {
            if (value.length !== 64)
                throw Error("Uncorrect length of input Uint8Array, should be 64 for an ebytes64");
            const bigIntValue = bytesToBigInt(value);
            checkEncryptedValue(bigIntValue, 512);
            values.push(bigIntValue);
            bits.push(512);
            if (sum(bits) > 2048)
                throw Error("Packing more than 2048 bits in a single input ciphertext is unsupported");
            if (bits.length > 256)
                throw Error("Packing more than 256 variables in a single input ciphertext is unsupported");
            return this;
        },
        addBytes128(value) {
            if (value.length !== 128)
                throw Error("Uncorrect length of input Uint8Array, should be 128 for an ebytes128");
            const bigIntValue = bytesToBigInt(value);
            checkEncryptedValue(bigIntValue, 1024);
            values.push(bigIntValue);
            bits.push(1024);
            if (sum(bits) > 2048)
                throw Error("Packing more than 2048 bits in a single input ciphertext is unsupported");
            if (bits.length > 256)
                throw Error("Packing more than 256 variables in a single input ciphertext is unsupported");
            return this;
        },
        addBytes256(value) {
            if (value.length !== 256)
                throw Error("Uncorrect length of input Uint8Array, should be 256 for an ebytes256");
            const bigIntValue = bytesToBigInt(value);
            checkEncryptedValue(bigIntValue, 2048);
            values.push(bigIntValue);
            bits.push(2048);
            if (sum(bits) > 2048)
                throw Error("Packing more than 2048 bits in a single input ciphertext is unsupported");
            if (bits.length > 256)
                throw Error("Packing more than 256 variables in a single input ciphertext is unsupported");
            return this;
        },
        getValues() {
            return values;
        },
        getBits() {
            return bits;
        },
        resetValues() {
            values.length = 0;
            bits.length = 0;
            return this;
        },
        async encrypt() {
            let encrypted = Buffer.alloc(0);
            bits.map((v, i) => {
                encrypted = Buffer.concat([encrypted, createUintToUint8ArrayFunction(v)(values[i])]);
            });
            const encryptedArray = new Uint8Array(encrypted);
            const hash = new sha3_1.Keccak(256).update(Buffer.from(encryptedArray)).digest();
            const handles = bits.map((v, i) => {
                const dataWithIndex = new Uint8Array(hash.length + 1);
                dataWithIndex.set(hash, 0);
                dataWithIndex.set([i], hash.length);
                const finalHash = new sha3_1.Keccak(256).update(Buffer.from(dataWithIndex)).digest();
                const dataInput = new Uint8Array(32);
                dataInput.set(finalHash, 0);
                dataInput.set([i, exports.ENCRYPTION_TYPES[v], 0], 29);
                return dataInput;
            });
            let inputProof = "0x" + numberToHex(handles.length);
            const numSigners = 1;
            inputProof += numberToHex(numSigners);
            inputProof += hash.toString("hex");
            const listHandlesStr = handles.map((i) => uint8ArrayToHexString(i));
            listHandlesStr.map((handle) => (inputProof += handle));
            const listHandles = listHandlesStr.map((i) => BigInt("0x" + i));
            const sigCoproc = await computeInputSignatureCopro("0x" + hash.toString("hex"), listHandles, userAddress, contractAddress);
            inputProof += sigCoproc.slice(2);
            const signaturesKMS = await computeInputSignaturesKMS("0x" + hash.toString("hex"), userAddress, contractAddress);
            signaturesKMS.map((sigKMS) => (inputProof += sigKMS.slice(2)));
            listHandlesStr.map((handle, i) => (0, coprocessorUtils_1.insertSQL)("0x" + handle, values[i]));
            return {
                handles,
                inputProof,
            };
        },
    };
};
exports.createEncryptedInputMocked = createEncryptedInputMocked;
function uint8ArrayToHexString(uint8Array) {
    return Array.from(uint8Array)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}
function numberToHex(num) {
    const hex = num.toString(16);
    return hex.length % 2 ? "0" + hex : hex;
}
const checkEncryptedValue = (value, bits) => {
    if (value == null)
        throw new Error("Missing value");
    let limit;
    if (bits >= 8) {
        limit = BigInt(`0x${new Array(bits / 8).fill(null).reduce((v) => `${v}ff`, "")}`);
    }
    else {
        limit = BigInt(2 ** bits - 1);
    }
    if (typeof value !== "number" && typeof value !== "bigint")
        throw new Error("Value must be a number or a bigint.");
    if (value > limit) {
        throw new Error(`The value exceeds the limit for ${bits}bits integer (${limit.toString()}).`);
    }
};
exports.ENCRYPTION_TYPES = {
    2: 0,
    4: 1,
    8: 2,
    16: 3,
    32: 4,
    64: 5,
    128: 6,
    160: 7,
    256: 8,
    512: 9,
    1024: 10,
    2048: 11,
};
async function computeInputSignatureCopro(hash, handlesList, userAddress, contractAddress) {
    const privKeySigner = constants_1.PRIVATE_KEY_COPROCESSOR_ACCOUNT;
    const coprocSigner = new ethers_1.Wallet(privKeySigner).connect(ethers_1.ethers.provider);
    const signature = await coprocSign(hash, handlesList, userAddress, contractAddress, coprocSigner);
    return signature;
}
async function computeInputSignaturesKMS(hash, userAddress, contractAddress) {
    const signatures = [];
    const numSigners = 1;
    for (let idx = 0; idx < numSigners; idx++) {
        const privKeySigner = constants_1.PRIVATE_KEY_KMS_SIGNER;
        const kmsSigner = new ethers_1.ethers.Wallet(privKeySigner).connect(ethers_1.ethers.provider);
        const signature = await kmsSign(hash, userAddress, contractAddress, kmsSigner);
        signatures.push(signature);
    }
    return signatures;
}
async function coprocSign(hashOfCiphertext, handlesList, userAddress, contractAddress, signer) {
    const inputAdd = constants_1.INPUTVERIFIER_ADDRESS;
    const chainId = hardhat_1.default.__SOLIDITY_COVERAGE_RUNNING ? 31337 : network.config.chainId;
    const aclAdd = constants_1.ACL_ADDRESS;
    const domain = {
        name: "InputVerifier",
        version: "1",
        chainId: chainId,
        verifyingContract: inputAdd,
    };
    const types = {
        CiphertextVerificationForCopro: [
            {
                name: "aclAddress",
                type: "address",
            },
            {
                name: "hashOfCiphertext",
                type: "bytes32",
            },
            {
                name: "handlesList",
                type: "uint256[]",
            },
            {
                name: "userAddress",
                type: "address",
            },
            {
                name: "contractAddress",
                type: "address",
            },
        ],
    };
    const message = {
        aclAddress: aclAdd,
        hashOfCiphertext: hashOfCiphertext,
        handlesList: handlesList,
        userAddress: userAddress,
        contractAddress: contractAddress,
    };
    const signature = await signer.signTypedData(domain, types, message);
    const sigRSV = ethers_1.ethers.Signature.from(signature);
    const v = 27 + sigRSV.yParity;
    const r = sigRSV.r;
    const s = sigRSV.s;
    const result = r + s.substring(2) + v.toString(16);
    return result;
}
async function kmsSign(hashOfCiphertext, userAddress, contractAddress, signer) {
    const kmsVerifierAdd = constants_1.KMSVERIFIER_ADDRESS;
    const chainId = hardhat_1.default.__SOLIDITY_COVERAGE_RUNNING ? 31337 : network.config.chainId;
    const aclAdd = constants_1.ACL_ADDRESS;
    const domain = {
        name: "KMSVerifier",
        version: "1",
        chainId: chainId,
        verifyingContract: kmsVerifierAdd,
    };
    const types = {
        CiphertextVerificationForKMS: [
            {
                name: "aclAddress",
                type: "address",
            },
            {
                name: "hashOfCiphertext",
                type: "bytes32",
            },
            {
                name: "userAddress",
                type: "address",
            },
            {
                name: "contractAddress",
                type: "address",
            },
        ],
    };
    const message = {
        aclAddress: aclAdd,
        hashOfCiphertext: hashOfCiphertext,
        userAddress: userAddress,
        contractAddress: contractAddress,
    };
    const signature = await signer.signTypedData(domain, types, message);
    const sigRSV = ethers_1.ethers.Signature.from(signature);
    const v = 27 + sigRSV.yParity;
    const r = sigRSV.r;
    const s = sigRSV.s;
    const result = r + s.substring(2) + v.toString(16);
    return result;
}
//# sourceMappingURL=fhevmjsMocked.js.map