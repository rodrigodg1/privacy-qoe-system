"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyType = verifyType;
exports.reencryptEbool = reencryptEbool;
exports.reencryptEuint4 = reencryptEuint4;
exports.reencryptEuint8 = reencryptEuint8;
exports.reencryptEuint16 = reencryptEuint16;
exports.reencryptEuint32 = reencryptEuint32;
exports.reencryptEuint64 = reencryptEuint64;
exports.reencryptEuint128 = reencryptEuint128;
exports.reencryptEaddress = reencryptEaddress;
exports.reencryptEuint256 = reencryptEuint256;
exports.reencryptEbytes64 = reencryptEbytes64;
exports.reencryptEbytes128 = reencryptEbytes128;
exports.reencryptEbytes256 = reencryptEbytes256;
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
async function reencryptEbool(signer, instance, handle, contractAddress) {
    verifyType(handle, EBOOL_T);
    return (await reencryptHandle(signer, instance, handle, contractAddress)) === 1n;
}
async function reencryptEuint4(signer, instance, handle, contractAddress) {
    verifyType(handle, EUINT4_T);
    return reencryptHandle(signer, instance, handle, contractAddress);
}
async function reencryptEuint8(signer, instance, handle, contractAddress) {
    verifyType(handle, EUINT8_T);
    return reencryptHandle(signer, instance, handle, contractAddress);
}
async function reencryptEuint16(signer, instance, handle, contractAddress) {
    verifyType(handle, EUINT16_T);
    return reencryptHandle(signer, instance, handle, contractAddress);
}
async function reencryptEuint32(signer, instance, handle, contractAddress) {
    verifyType(handle, EUINT32_T);
    return reencryptHandle(signer, instance, handle, contractAddress);
}
async function reencryptEuint64(signer, instance, handle, contractAddress) {
    verifyType(handle, EUINT64_T);
    return reencryptHandle(signer, instance, handle, contractAddress);
}
async function reencryptEuint128(signer, instance, handle, contractAddress) {
    verifyType(handle, EUINT128_T);
    return reencryptHandle(signer, instance, handle, contractAddress);
}
async function reencryptEaddress(signer, instance, handle, contractAddress) {
    verifyType(handle, EUINT160_T);
    const addressAsUint160 = await reencryptHandle(signer, instance, handle, contractAddress);
    const handleStr = "0x" + addressAsUint160.toString(16).padStart(40, "0");
    return handleStr;
}
async function reencryptEuint256(signer, instance, handle, contractAddress) {
    verifyType(handle, EUINT256_T);
    return reencryptHandle(signer, instance, handle, contractAddress);
}
async function reencryptEbytes64(signer, instance, handle, contractAddress) {
    verifyType(handle, EBYTES64_T);
    return reencryptHandle(signer, instance, handle, contractAddress);
}
async function reencryptEbytes128(signer, instance, handle, contractAddress) {
    verifyType(handle, EBYTES128_T);
    return reencryptHandle(signer, instance, handle, contractAddress);
}
async function reencryptEbytes256(signer, instance, handle, contractAddress) {
    verifyType(handle, EBYTES256_T);
    return reencryptHandle(signer, instance, handle, contractAddress);
}
async function reencryptHandle(signer, instance, handle, contractAddress) {
    const { publicKey: publicKey, privateKey: privateKey } = instance.generateKeypair();
    const eip712 = instance.createEIP712(publicKey, contractAddress);
    const signature = await signer.signTypedData(eip712.domain, { Reencrypt: eip712.types.Reencrypt }, eip712.message);
    const reencryptedHandle = await instance.reencrypt(handle, privateKey, publicKey, signature.replace("0x", ""), contractAddress, await signer.getAddress());
    return reencryptedHandle;
}
//# sourceMappingURL=reencrypt.js.map