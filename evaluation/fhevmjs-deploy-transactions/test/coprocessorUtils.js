"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.awaitCoprocessor = exports.getClearText = void 0;
exports.insertSQL = insertSQL;
exports.numberToEvenHexString = numberToEvenHexString;
exports.getFHEGasFromTxReceipt = getFHEGasFromTxReceipt;
const extra_bigint_1 = require("extra-bigint");
const hardhat_1 = require("hardhat");
const hardhat_2 = __importDefault(require("hardhat"));
const sqlite3_1 = require("sqlite3");
const constants_1 = require("./constants");
const operatorPrices_json_1 = __importDefault(require("./operatorPrices.json"));
const executorAddress = constants_1.TFHEEXECUTOR_ADDRESS;
let firstBlockListening = 0;
let lastBlockSnapshot = 0;
let lastCounterRand = 0;
let counterRand = 0;
const db = new sqlite3_1.Database(":memory:");
function insertSQL(handle, clearText, replace = false) {
    if (replace) {
        db.run("INSERT OR REPLACE INTO ciphertexts (handle, clearText) VALUES (?, ?)", [handle, clearText.toString()]);
    }
    else {
        db.run("INSERT OR IGNORE INTO ciphertexts (handle, clearText) VALUES (?, ?)", [handle, clearText.toString()]);
    }
}
const getClearText = async (handle) => {
    const handleStr = "0x" + handle.toString(16).padStart(64, "0");
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxRetries = 100;
        function executeQuery() {
            db.get("SELECT clearText FROM ciphertexts WHERE handle = ?", [handleStr], (err, row) => {
                if (err) {
                    reject(new Error(`Error querying database: ${err.message}`));
                }
                else if (row) {
                    resolve(row.clearText);
                }
                else if (attempts < maxRetries) {
                    attempts++;
                    executeQuery();
                }
                else {
                    reject(new Error("No record found after maximum retries"));
                }
            });
        }
        executeQuery();
    });
};
exports.getClearText = getClearText;
db.serialize(() => db.run("CREATE TABLE IF NOT EXISTS ciphertexts (handle BINARY PRIMARY KEY,clearText TEXT)"));
const NumBits = {
    0: 1n,
    1: 4n,
    2: 8n,
    3: 16n,
    4: 32n,
    5: 64n,
    6: 128n,
    7: 160n,
    8: 256n,
    9: 512n,
    10: 1024n,
    11: 2048n,
};
function numberToEvenHexString(num) {
    if (typeof num !== "number" || num < 0) {
        throw new Error("Input should be a non-negative number.");
    }
    let hexString = num.toString(16);
    if (hexString.length % 2 !== 0) {
        hexString = "0" + hexString;
    }
    return hexString;
}
function getRandomBigInt(numBits) {
    if (numBits <= 0) {
        throw new Error("Number of bits must be greater than 0");
    }
    const numBytes = Math.ceil(numBits / 8);
    const randomBytes = new Uint8Array(numBytes);
    crypto.getRandomValues(randomBytes);
    let randomBigInt = BigInt(0);
    for (let i = 0; i < numBytes; i++) {
        randomBigInt = (randomBigInt << BigInt(8)) | BigInt(randomBytes[i]);
    }
    const mask = (BigInt(1) << BigInt(numBits)) - BigInt(1);
    randomBigInt = randomBigInt & mask;
    return randomBigInt;
}
function bitwiseNotUintBits(value, numBits) {
    if (typeof value !== "bigint") {
        throw new TypeError("The input value must be a BigInt.");
    }
    if (typeof numBits !== "number" || numBits <= 0) {
        throw new TypeError("The numBits parameter must be a positive integer.");
    }
    const BIT_MASK = (BigInt(1) << BigInt(numBits)) - BigInt(1);
    return ~value & BIT_MASK;
}
const awaitCoprocessor = async () => {
    await processAllPastTFHEExecutorEvents();
};
exports.awaitCoprocessor = awaitCoprocessor;
const abi = [
    "event FheAdd(uint256 lhs, uint256 rhs, bytes1 scalarByte, uint256 result)",
    "event FheSub(uint256 lhs, uint256 rhs, bytes1 scalarByte, uint256 result)",
    "event FheMul(uint256 lhs, uint256 rhs, bytes1 scalarByte, uint256 result)",
    "event FheDiv(uint256 lhs, uint256 rhs, bytes1 scalarByte, uint256 result)",
    "event FheRem(uint256 lhs, uint256 rhs, bytes1 scalarByte, uint256 result)",
    "event FheBitAnd(uint256 lhs, uint256 rhs, bytes1 scalarByte, uint256 result)",
    "event FheBitOr(uint256 lhs, uint256 rhs, bytes1 scalarByte, uint256 result)",
    "event FheBitXor(uint256 lhs, uint256 rhs, bytes1 scalarByte, uint256 result)",
    "event FheShl(uint256 lhs, uint256 rhs, bytes1 scalarByte, uint256 result)",
    "event FheShr(uint256 lhs, uint256 rhs, bytes1 scalarByte, uint256 result)",
    "event FheRotl(uint256 lhs, uint256 rhs, bytes1 scalarByte, uint256 result)",
    "event FheRotr(uint256 lhs, uint256 rhs, bytes1 scalarByte, uint256 result)",
    "event FheEq(uint256 lhs, uint256 rhs, bytes1 scalarByte, uint256 result)",
    "event FheEqBytes(uint256 lhs, bytes rhs, bytes1 scalarByte, uint256 result)",
    "event FheNe(uint256 lhs, uint256 rhs, bytes1 scalarByte, uint256 result)",
    "event FheNeBytes(uint256 lhs, bytes rhs, bytes1 scalarByte, uint256 result)",
    "event FheGe(uint256 lhs, uint256 rhs, bytes1 scalarByte, uint256 result)",
    "event FheGt(uint256 lhs, uint256 rhs, bytes1 scalarByte, uint256 result)",
    "event FheLe(uint256 lhs, uint256 rhs, bytes1 scalarByte, uint256 result)",
    "event FheLt(uint256 lhs, uint256 rhs, bytes1 scalarByte, uint256 result)",
    "event FheMin(uint256 lhs, uint256 rhs, bytes1 scalarByte, uint256 result)",
    "event FheMax(uint256 lhs, uint256 rhs, bytes1 scalarByte, uint256 result)",
    "event FheNeg(uint256 ct, uint256 result)",
    "event FheNot(uint256 ct, uint256 result)",
    "event VerifyCiphertext(bytes32 inputHandle,address userAddress,bytes inputProof,bytes1 inputType,uint256 result)",
    "event Cast(uint256 ct, bytes1 toType, uint256 result)",
    "event TrivialEncrypt(uint256 pt, bytes1 toType, uint256 result)",
    "event TrivialEncryptBytes(bytes pt, bytes1 toType, uint256 result)",
    "event FheIfThenElse(uint256 control, uint256 ifTrue, uint256 ifFalse, uint256 result)",
    "event FheRand(bytes1 randType, uint256 result)",
    "event FheRandBounded(uint256 upperBound, bytes1 randType, uint256 result)",
];
async function processAllPastTFHEExecutorEvents() {
    const provider = hardhat_1.ethers.provider;
    const latestBlockNumber = await provider.getBlockNumber();
    if (hardhat_2.default.__SOLIDITY_COVERAGE_RUNNING !== true) {
        [lastBlockSnapshot, lastCounterRand] = await provider.send("get_lastBlockSnapshot");
        if (lastBlockSnapshot < firstBlockListening) {
            firstBlockListening = lastBlockSnapshot + 1;
            counterRand = Number(lastCounterRand);
        }
    }
    const contract = new hardhat_1.ethers.Contract(executorAddress, abi, provider);
    const filter = {
        address: executorAddress,
        fromBlock: firstBlockListening,
        toBlock: latestBlockNumber,
    };
    const logs = await provider.getLogs(filter);
    const events = logs
        .map((log) => {
        try {
            const parsedLog = contract.interface.parseLog(log);
            return {
                eventName: parsedLog.name,
                args: parsedLog.args,
            };
        }
        catch (e) {
            return null;
        }
    })
        .filter((event) => event !== null);
    firstBlockListening = latestBlockNumber + 1;
    if (hardhat_2.default.__SOLIDITY_COVERAGE_RUNNING !== true) {
        await provider.send("set_lastBlockSnapshot", [firstBlockListening]);
    }
    events.map(async (event) => await insertHandleFromEvent(event));
}
async function insertHandleFromEvent(event) {
    let handle;
    let clearText;
    let clearLHS;
    let clearRHS;
    let resultType;
    let shift;
    switch (event.eventName) {
        case "TrivialEncrypt":
            clearText = event.args[0];
            handle = hardhat_1.ethers.toBeHex(event.args[2], 32);
            insertSQL(handle, clearText);
            break;
        case "TrivialEncryptBytes":
            clearText = event.args[0];
            handle = hardhat_1.ethers.toBeHex(event.args[2], 32);
            insertSQL(handle, clearText);
            break;
        case "FheAdd":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearLHS = await (0, exports.getClearText)(event.args[0]);
            if (event.args[2] === "0x01") {
                clearText = BigInt(clearLHS) + event.args[1];
                clearText = clearText % 2n ** NumBits[resultType];
            }
            else {
                clearRHS = await (0, exports.getClearText)(event.args[1]);
                clearText = BigInt(clearLHS) + BigInt(clearRHS);
                clearText = clearText % 2n ** NumBits[resultType];
            }
            insertSQL(hardhat_1.ethers.toBeHex(handle, 32), clearText);
            break;
        case "FheSub":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearLHS = await (0, exports.getClearText)(event.args[0]);
            if (event.args[2] === "0x01") {
                clearText = BigInt(clearLHS) - event.args[1];
                if (clearText < 0n)
                    clearText = clearText + 2n ** NumBits[resultType];
                clearText = clearText % 2n ** NumBits[resultType];
            }
            else {
                clearRHS = await (0, exports.getClearText)(event.args[1]);
                clearText = BigInt(clearLHS) - BigInt(clearRHS);
                if (clearText < 0n)
                    clearText = clearText + 2n ** NumBits[resultType];
                clearText = clearText % 2n ** NumBits[resultType];
            }
            insertSQL(handle, clearText);
            break;
        case "FheMul":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearLHS = await (0, exports.getClearText)(event.args[0]);
            if (event.args[2] === "0x01") {
                clearText = BigInt(clearLHS) * event.args[1];
                clearText = clearText % 2n ** NumBits[resultType];
            }
            else {
                clearRHS = await (0, exports.getClearText)(event.args[1]);
                clearText = BigInt(clearLHS) * BigInt(clearRHS);
                clearText = clearText % 2n ** NumBits[resultType];
            }
            insertSQL(handle, clearText);
            break;
        case "FheDiv":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearLHS = await (0, exports.getClearText)(event.args[0]);
            if (event.args[2] === "0x01") {
                clearText = BigInt(clearLHS) / event.args[1];
            }
            else {
                throw new Error("Non-scalar div not implemented yet");
            }
            insertSQL(handle, clearText);
            break;
        case "FheRem":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearLHS = await (0, exports.getClearText)(event.args[0]);
            if (event.args[2] === "0x01") {
                clearText = BigInt(clearLHS) % event.args[1];
            }
            else {
                throw new Error("Non-scalar rem not implemented yet");
            }
            insertSQL(handle, clearText);
            break;
        case "FheBitAnd":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearLHS = await (0, exports.getClearText)(event.args[0]);
            if (event.args[2] === "0x01") {
                clearText = BigInt(clearLHS) & event.args[1];
                clearText = clearText % 2n ** NumBits[resultType];
            }
            else {
                clearRHS = await (0, exports.getClearText)(event.args[1]);
                clearText = BigInt(clearLHS) & BigInt(clearRHS);
                clearText = clearText % 2n ** NumBits[resultType];
            }
            insertSQL(handle, clearText);
            break;
        case "FheBitOr":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearLHS = await (0, exports.getClearText)(event.args[0]);
            if (event.args[2] === "0x01") {
                clearText = BigInt(clearLHS) | event.args[1];
                clearText = clearText % 2n ** NumBits[resultType];
            }
            else {
                clearRHS = await (0, exports.getClearText)(event.args[1]);
                clearText = BigInt(clearLHS) | BigInt(clearRHS);
                clearText = clearText % 2n ** NumBits[resultType];
            }
            insertSQL(handle, clearText);
            break;
        case "FheBitXor":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearLHS = await (0, exports.getClearText)(event.args[0]);
            if (event.args[2] === "0x01") {
                clearText = BigInt(clearLHS) ^ event.args[1];
                clearText = clearText % 2n ** NumBits[resultType];
            }
            else {
                clearRHS = await (0, exports.getClearText)(event.args[1]);
                clearText = BigInt(clearLHS) ^ BigInt(clearRHS);
                clearText = clearText % 2n ** NumBits[resultType];
            }
            insertSQL(handle, clearText);
            break;
        case "FheShl":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearLHS = await (0, exports.getClearText)(event.args[0]);
            if (event.args[2] === "0x01") {
                clearText = BigInt(clearLHS) << event.args[1] % NumBits[resultType];
                clearText = clearText % 2n ** NumBits[resultType];
            }
            else {
                clearRHS = await (0, exports.getClearText)(event.args[1]);
                clearText = BigInt(clearLHS) << BigInt(clearRHS) % NumBits[resultType];
                clearText = clearText % 2n ** NumBits[resultType];
            }
            insertSQL(handle, clearText);
            break;
        case "FheShr":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearLHS = await (0, exports.getClearText)(event.args[0]);
            if (event.args[2] === "0x01") {
                clearText = BigInt(clearLHS) >> event.args[1] % NumBits[resultType];
                clearText = clearText % 2n ** NumBits[resultType];
            }
            else {
                clearRHS = await (0, exports.getClearText)(event.args[1]);
                clearText = BigInt(clearLHS) >> BigInt(clearRHS) % NumBits[resultType];
                clearText = clearText % 2n ** NumBits[resultType];
            }
            insertSQL(handle, clearText);
            break;
        case "FheRotl":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearLHS = await (0, exports.getClearText)(event.args[0]);
            if (event.args[2] === "0x01") {
                shift = event.args[1] % NumBits[resultType];
                clearText = (BigInt(clearLHS) << shift) | (BigInt(clearLHS) >> (NumBits[resultType] - shift));
                clearText = clearText % 2n ** NumBits[resultType];
            }
            else {
                clearRHS = await (0, exports.getClearText)(event.args[1]);
                shift = BigInt(clearRHS) % NumBits[resultType];
                clearText = (BigInt(clearLHS) << shift) | (BigInt(clearLHS) >> (NumBits[resultType] - shift));
                clearText = clearText % 2n ** NumBits[resultType];
            }
            insertSQL(handle, clearText);
            break;
        case "FheRotr":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearLHS = await (0, exports.getClearText)(event.args[0]);
            if (event.args[2] === "0x01") {
                shift = event.args[1] % NumBits[resultType];
                clearText = (BigInt(clearLHS) >> shift) | (BigInt(clearLHS) << (NumBits[resultType] - shift));
                clearText = clearText % 2n ** NumBits[resultType];
            }
            else {
                clearRHS = await (0, exports.getClearText)(event.args[1]);
                shift = BigInt(clearRHS) % NumBits[resultType];
                clearText = (BigInt(clearLHS) >> shift) | (BigInt(clearLHS) << (NumBits[resultType] - shift));
                clearText = clearText % 2n ** NumBits[resultType];
            }
            insertSQL(handle, clearText);
            break;
        case "FheEq":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearLHS = await (0, exports.getClearText)(event.args[0]);
            if (event.args[2] === "0x01") {
                clearText = BigInt(clearLHS) === event.args[1] ? 1n : 0n;
            }
            else {
                clearRHS = await (0, exports.getClearText)(event.args[1]);
                clearText = BigInt(clearLHS) === BigInt(clearRHS) ? 1n : 0n;
            }
            insertSQL(handle, clearText);
            break;
        case "FheEqBytes":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearLHS = await (0, exports.getClearText)(event.args[0]);
            if (event.args[2] === "0x01") {
                clearText = BigInt(clearLHS) === BigInt(event.args[1]) ? 1n : 0n;
            }
            else {
                clearRHS = await (0, exports.getClearText)(event.args[1]);
                clearText = BigInt(clearLHS) === BigInt(clearRHS) ? 1n : 0n;
            }
            insertSQL(handle, clearText);
            break;
        case "FheNe":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearLHS = await (0, exports.getClearText)(event.args[0]);
            if (event.args[2] === "0x01") {
                clearText = BigInt(clearLHS) !== event.args[1] ? 1n : 0n;
            }
            else {
                clearRHS = await (0, exports.getClearText)(event.args[1]);
                clearText = BigInt(clearLHS) !== BigInt(clearRHS) ? 1n : 0n;
            }
            insertSQL(handle, clearText);
            break;
        case "FheNeBytes":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearLHS = await (0, exports.getClearText)(event.args[0]);
            if (event.args[2] === "0x01") {
                clearText = BigInt(clearLHS) !== BigInt(event.args[1]) ? 1n : 0n;
            }
            else {
                clearRHS = await (0, exports.getClearText)(event.args[1]);
                clearText = BigInt(clearLHS) !== BigInt(clearRHS) ? 1n : 0n;
            }
            insertSQL(handle, clearText);
            break;
        case "FheGe":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearLHS = await (0, exports.getClearText)(event.args[0]);
            if (event.args[2] === "0x01") {
                clearText = BigInt(clearLHS) >= event.args[1] ? 1n : 0n;
            }
            else {
                clearRHS = await (0, exports.getClearText)(event.args[1]);
                clearText = BigInt(clearLHS) >= BigInt(clearRHS) ? 1n : 0n;
            }
            insertSQL(handle, clearText);
            break;
        case "FheGt":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearLHS = await (0, exports.getClearText)(event.args[0]);
            if (event.args[2] === "0x01") {
                clearText = BigInt(clearLHS) > event.args[1] ? 1n : 0n;
            }
            else {
                clearRHS = await (0, exports.getClearText)(event.args[1]);
                clearText = BigInt(clearLHS) > BigInt(clearRHS) ? 1n : 0n;
            }
            insertSQL(handle, clearText);
            break;
        case "FheLe":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearLHS = await (0, exports.getClearText)(event.args[0]);
            if (event.args[2] === "0x01") {
                clearText = BigInt(clearLHS) <= event.args[1] ? 1n : 0n;
            }
            else {
                clearRHS = await (0, exports.getClearText)(event.args[1]);
                clearText = BigInt(clearLHS) <= BigInt(clearRHS) ? 1n : 0n;
            }
            insertSQL(handle, clearText);
            break;
        case "FheLt":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearLHS = await (0, exports.getClearText)(event.args[0]);
            if (event.args[2] === "0x01") {
                clearText = BigInt(clearLHS) < event.args[1] ? 1n : 0n;
            }
            else {
                clearRHS = await (0, exports.getClearText)(event.args[1]);
                clearText = BigInt(clearLHS) < BigInt(clearRHS) ? 1n : 0n;
            }
            insertSQL(handle, clearText);
            break;
        case "FheMax":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearLHS = await (0, exports.getClearText)(event.args[0]);
            if (event.args[2] === "0x01") {
                clearText = BigInt(clearLHS) > event.args[1] ? clearLHS : event.args[1];
            }
            else {
                clearRHS = await (0, exports.getClearText)(event.args[1]);
                clearText = BigInt(clearLHS) > BigInt(clearRHS) ? clearLHS : clearRHS;
            }
            insertSQL(handle, clearText);
            break;
        case "FheMin":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearLHS = await (0, exports.getClearText)(event.args[0]);
            if (event.args[2] === "0x01") {
                clearText = BigInt(clearLHS) < event.args[1] ? clearLHS : event.args[1];
            }
            else {
                clearRHS = await (0, exports.getClearText)(event.args[1]);
                clearText = BigInt(clearLHS) < BigInt(clearRHS) ? clearLHS : clearRHS;
            }
            insertSQL(handle, clearText);
            break;
        case "Cast":
            resultType = parseInt(event.args[1]);
            handle = hardhat_1.ethers.toBeHex(event.args[2], 32);
            clearText = BigInt(await (0, exports.getClearText)(event.args[0])) % 2n ** NumBits[resultType];
            insertSQL(handle, clearText);
            break;
        case "FheNot":
            handle = hardhat_1.ethers.toBeHex(event.args[1], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearText = BigInt(await (0, exports.getClearText)(event.args[0]));
            clearText = bitwiseNotUintBits(clearText, Number(NumBits[resultType]));
            insertSQL(handle, clearText);
            break;
        case "FheNeg":
            handle = hardhat_1.ethers.toBeHex(event.args[1], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            clearText = BigInt(await (0, exports.getClearText)(event.args[0]));
            clearText = bitwiseNotUintBits(clearText, Number(NumBits[resultType]));
            clearText = (clearText + 1n) % 2n ** NumBits[resultType];
            insertSQL(handle, clearText);
            break;
        case "VerifyCiphertext":
            handle = event.args[0];
            try {
                await (0, exports.getClearText)(BigInt(handle));
            }
            catch {
                throw Error("User input was not found in DB");
            }
            break;
        case "FheIfThenElse":
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            resultType = parseInt(handle.slice(-4, -2), 16);
            handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
            const clearControl = BigInt(await (0, exports.getClearText)(event.args[0]));
            const clearIfTrue = BigInt(await (0, exports.getClearText)(event.args[1]));
            const clearIfFalse = BigInt(await (0, exports.getClearText)(event.args[2]));
            if (clearControl === 1n) {
                clearText = clearIfTrue;
            }
            else {
                clearText = clearIfFalse;
            }
            insertSQL(handle, clearText);
            break;
        case "FheRand":
            resultType = parseInt(event.args[0], 16);
            handle = hardhat_1.ethers.toBeHex(event.args[1], 32);
            clearText = getRandomBigInt(Number(NumBits[resultType]));
            insertSQL(handle, clearText, true);
            counterRand++;
            break;
        case "FheRandBounded":
            resultType = parseInt(event.args[1], 16);
            handle = hardhat_1.ethers.toBeHex(event.args[2], 32);
            clearText = getRandomBigInt(Number((0, extra_bigint_1.log2)(BigInt(event.args[0]))));
            insertSQL(handle, clearText, true);
            counterRand++;
            break;
    }
}
function getFHEGasFromTxReceipt(receipt) {
    if (hardhat_2.default.network.name !== "hardhat") {
        throw Error("FHEGas tracking is currently implemented only in mocked mode");
    }
    if (receipt.status === 0) {
        throw new Error("Transaction reverted");
    }
    const contract = new hardhat_1.ethers.Contract(executorAddress, abi, hardhat_1.ethers.provider);
    const relevantLogs = receipt.logs.filter((log) => {
        if (log.address.toLowerCase() !== executorAddress.toLowerCase()) {
            return false;
        }
        try {
            const parsedLog = contract.interface.parseLog({
                topics: log.topics,
                data: log.data,
            });
            return abi.some((item) => item.startsWith(`event ${parsedLog.name}`) && parsedLog.name !== "VerifyCiphertext");
        }
        catch {
            return false;
        }
    });
    const FHELogs = relevantLogs.map((log) => {
        const parsedLog = contract.interface.parseLog({
            topics: log.topics,
            data: log.data,
        });
        return {
            name: parsedLog.name,
            args: parsedLog.args,
        };
    });
    let FHEGasConsumed = 0;
    for (const event of FHELogs) {
        let type;
        let handle;
        switch (event.name) {
            case "TrivialEncrypt":
                type = parseInt(event.args[1], 16);
                FHEGasConsumed += operatorPrices_json_1.default["trivialEncrypt"].types[type];
                break;
            case "TrivialEncryptBytes":
                type = parseInt(event.args[1], 16);
                FHEGasConsumed += operatorPrices_json_1.default["trivialEncrypt"].types[type];
                break;
            case "FheAdd":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                if (event.args[2] === "0x01") {
                    FHEGasConsumed += operatorPrices_json_1.default["fheAdd"].scalar[type];
                }
                else {
                    FHEGasConsumed += operatorPrices_json_1.default["fheAdd"].nonScalar[type];
                }
                break;
            case "FheSub":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                if (event.args[2] === "0x01") {
                    FHEGasConsumed += operatorPrices_json_1.default["fheSub"].scalar[type];
                }
                else {
                    FHEGasConsumed += operatorPrices_json_1.default["fheSub"].nonScalar[type];
                }
                break;
            case "FheMul":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                if (event.args[2] === "0x01") {
                    FHEGasConsumed += operatorPrices_json_1.default["fheMul"].scalar[type];
                }
                else {
                    FHEGasConsumed += operatorPrices_json_1.default["fheMul"].nonScalar[type];
                }
                break;
            case "FheDiv":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                if (event.args[2] === "0x01") {
                    FHEGasConsumed += operatorPrices_json_1.default["fheDiv"].scalar[type];
                }
                else {
                    throw new Error("Non-scalar div not implemented yet");
                }
                break;
            case "FheRem":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                if (event.args[2] === "0x01") {
                    FHEGasConsumed += operatorPrices_json_1.default["fheRem"].scalar[type];
                }
                else {
                    throw new Error("Non-scalar rem not implemented yet");
                }
                break;
            case "FheBitAnd":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                if (event.args[2] === "0x01") {
                    FHEGasConsumed += operatorPrices_json_1.default["fheBitAnd"].scalar[type];
                }
                else {
                    FHEGasConsumed += operatorPrices_json_1.default["fheBitAnd"].nonScalar[type];
                }
                break;
            case "FheBitOr":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                if (event.args[2] === "0x01") {
                    FHEGasConsumed += operatorPrices_json_1.default["fheBitOr"].scalar[type];
                }
                else {
                    FHEGasConsumed += operatorPrices_json_1.default["fheBitOr"].nonScalar[type];
                }
                break;
            case "FheBitXor":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                if (event.args[2] === "0x01") {
                    FHEGasConsumed += operatorPrices_json_1.default["fheBitXor"].scalar[type];
                }
                else {
                    FHEGasConsumed += operatorPrices_json_1.default["fheBitXor"].nonScalar[type];
                }
                break;
            case "FheShl":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                if (event.args[2] === "0x01") {
                    FHEGasConsumed += operatorPrices_json_1.default["fheBitShl"].scalar[type];
                }
                else {
                    FHEGasConsumed += operatorPrices_json_1.default["fheBitShl"].nonScalar[type];
                }
                break;
            case "FheShr":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                if (event.args[2] === "0x01") {
                    FHEGasConsumed += operatorPrices_json_1.default["fheBitShr"].scalar[type];
                }
                else {
                    FHEGasConsumed += operatorPrices_json_1.default["fheBitShr"].nonScalar[type];
                }
                break;
            case "FheRotl":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                if (event.args[2] === "0x01") {
                    FHEGasConsumed += operatorPrices_json_1.default["fheRotl"].scalar[type];
                }
                else {
                    FHEGasConsumed += operatorPrices_json_1.default["fheRotl"].nonScalar[type];
                }
                break;
            case "FheRotr":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                if (event.args[2] === "0x01") {
                    FHEGasConsumed += operatorPrices_json_1.default["fheRotr"].scalar[type];
                }
                else {
                    FHEGasConsumed += operatorPrices_json_1.default["fheRotr"].nonScalar[type];
                }
                break;
            case "FheEq":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                if (event.args[2] === "0x01") {
                    FHEGasConsumed += operatorPrices_json_1.default["fheEq"].scalar[type];
                }
                else {
                    FHEGasConsumed += operatorPrices_json_1.default["fheEq"].nonScalar[type];
                }
                break;
            case "FheEqBytes":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                if (event.args[2] === "0x01") {
                    FHEGasConsumed += operatorPrices_json_1.default["fheEq"].scalar[type];
                }
                else {
                    FHEGasConsumed += operatorPrices_json_1.default["fheEq"].nonScalar[type];
                }
            case "FheNe":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                if (event.args[2] === "0x01") {
                    FHEGasConsumed += operatorPrices_json_1.default["fheNe"].scalar[type];
                }
                else {
                    FHEGasConsumed += operatorPrices_json_1.default["fheNe"].nonScalar[type];
                }
                break;
            case "FheNeBytes":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                if (event.args[2] === "0x01") {
                    FHEGasConsumed += operatorPrices_json_1.default["fheNe"].scalar[type];
                }
                else {
                    FHEGasConsumed += operatorPrices_json_1.default["fheNe"].nonScalar[type];
                }
                break;
            case "FheGe":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                if (event.args[2] === "0x01") {
                    FHEGasConsumed += operatorPrices_json_1.default["fheGe"].scalar[type];
                }
                else {
                    FHEGasConsumed += operatorPrices_json_1.default["fheGe"].nonScalar[type];
                }
                break;
            case "FheGt":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                if (event.args[2] === "0x01") {
                    FHEGasConsumed += operatorPrices_json_1.default["fheGt"].scalar[type];
                }
                else {
                    FHEGasConsumed += operatorPrices_json_1.default["fheGt"].nonScalar[type];
                }
                break;
            case "FheLe":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                if (event.args[2] === "0x01") {
                    FHEGasConsumed += operatorPrices_json_1.default["fheLe"].scalar[type];
                }
                else {
                    FHEGasConsumed += operatorPrices_json_1.default["fheLe"].nonScalar[type];
                }
                break;
            case "FheLt":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                if (event.args[2] === "0x01") {
                    FHEGasConsumed += operatorPrices_json_1.default["fheLt"].scalar[type];
                }
                else {
                    FHEGasConsumed += operatorPrices_json_1.default["fheLt"].nonScalar[type];
                }
                break;
            case "FheMax":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                if (event.args[2] === "0x01") {
                    FHEGasConsumed += operatorPrices_json_1.default["fheMax"].scalar[type];
                }
                else {
                    FHEGasConsumed += operatorPrices_json_1.default["fheMax"].nonScalar[type];
                }
                break;
            case "FheMin":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                if (event.args[2] === "0x01") {
                    FHEGasConsumed += operatorPrices_json_1.default["fheMin"].scalar[type];
                }
                else {
                    FHEGasConsumed += operatorPrices_json_1.default["fheMin"].nonScalar[type];
                }
                break;
            case "Cast":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                FHEGasConsumed += operatorPrices_json_1.default["cast"].types[type];
                break;
            case "FheNot":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                FHEGasConsumed += operatorPrices_json_1.default["fheNot"].types[type];
                break;
            case "FheNeg":
                handle = hardhat_1.ethers.toBeHex(event.args[0], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                FHEGasConsumed += operatorPrices_json_1.default["fheNeg"].types[type];
                break;
            case "FheIfThenElse":
                handle = hardhat_1.ethers.toBeHex(event.args[3], 32);
                type = parseInt(handle.slice(-4, -2), 16);
                FHEGasConsumed += operatorPrices_json_1.default["ifThenElse"].types[type];
                break;
            case "FheRand":
                type = parseInt(event.args[0], 16);
                FHEGasConsumed += operatorPrices_json_1.default["fheRand"].types[type];
                break;
            case "FheRandBounded":
                type = parseInt(event.args[1], 16);
                FHEGasConsumed += operatorPrices_json_1.default["fheRandBounded"].types[type];
                break;
        }
    }
    return FHEGasConsumed;
}
//# sourceMappingURL=coprocessorUtils.js.map