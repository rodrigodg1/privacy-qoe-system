"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.awaitAllDecryptionResults = exports.initGateway = void 0;
const ethers_1 = require("ethers");
const GatewayContract_json_1 = __importDefault(require("fhevm-core-contracts/artifacts/gateway/GatewayContract.sol/GatewayContract.json"));
const hardhat_1 = require("hardhat");
const constants_1 = require("./constants");
const coprocessorUtils_1 = require("./coprocessorUtils");
const mockedSetup_1 = require("./mockedSetup");
const utils_1 = require("./utils");
const networkName = hardhat_1.network.name;
const aclAdd = constants_1.ACL_ADDRESS;
const CiphertextType = {
    0: "bool",
    1: "uint8",
    2: "uint8",
    3: "uint16",
    4: "uint32",
    5: "uint64",
    6: "uint128",
    7: "address",
    8: "uint256",
    9: "bytes",
    10: "bytes",
    11: "bytes",
};
const currentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { hour12: true, hour: "numeric", minute: "numeric", second: "numeric" });
};
const argEvents = "(uint256 indexed requestID, uint256[] cts, address contractCaller, bytes4 callbackSelector, uint256 msgValue, uint256 maxTimestamp, bool passSignaturesToCaller)";
const ifaceEventDecryption = new hardhat_1.ethers.Interface(["event EventDecryption" + argEvents]);
const argEvents2 = "(uint256 indexed requestID, bool success, bytes result)";
const ifaceResultCallback = new hardhat_1.ethers.Interface(["event ResultCallback" + argEvents2]);
let gateway;
let firstBlockListening;
let lastBlockSnapshotForDecrypt;
const initGateway = async () => {
    firstBlockListening = await hardhat_1.ethers.provider.getBlockNumber();
    if (networkName === "hardhat" && hre.__SOLIDITY_COVERAGE_RUNNING !== true) {
        await hardhat_1.ethers.provider.send("set_lastBlockSnapshotForDecrypt", [firstBlockListening]);
    }
    gateway = await hardhat_1.ethers.getContractAt(GatewayContract_json_1.default.abi, constants_1.GATEWAYCONTRACT_ADDRESS);
    gateway.on("EventDecryption", async (requestID, cts, contractCaller, callbackSelector, msgValue, maxTimestamp, eventData) => {
        const blockNumber = eventData.log.blockNumber;
        console.log(`${await currentTime()} - Requested decrypt on block ${blockNumber} (requestID ${requestID})`);
    });
    gateway.on("ResultCallback", async (requestID, success, result, eventData) => {
        const blockNumber = eventData.log.blockNumber;
        console.log(`${await currentTime()} - Fulfilled decrypt on block ${blockNumber} (requestID ${requestID})`);
    });
};
exports.initGateway = initGateway;
const awaitAllDecryptionResults = async () => {
    gateway = await hardhat_1.ethers.getContractAt(GatewayContract_json_1.default.abi, constants_1.GATEWAYCONTRACT_ADDRESS);
    const provider = hardhat_1.ethers.provider;
    if (networkName === "hardhat" && hre.__SOLIDITY_COVERAGE_RUNNING !== true) {
        lastBlockSnapshotForDecrypt = await provider.send("get_lastBlockSnapshotForDecrypt");
        if (lastBlockSnapshotForDecrypt < firstBlockListening) {
            firstBlockListening = lastBlockSnapshotForDecrypt + 1;
        }
    }
    await fulfillAllPastRequestsIds(networkName === "hardhat");
    firstBlockListening = (await hardhat_1.ethers.provider.getBlockNumber()) + 1;
    if (networkName === "hardhat" && hre.__SOLIDITY_COVERAGE_RUNNING !== true) {
        await provider.send("set_lastBlockSnapshotForDecrypt", [firstBlockListening]);
    }
};
exports.awaitAllDecryptionResults = awaitAllDecryptionResults;
const getAlreadyFulfilledDecryptions = async () => {
    let results = [];
    const eventDecryptionResult = await gateway.filters.ResultCallback().getTopicFilter();
    const filterDecryptionResult = {
        address: constants_1.GATEWAYCONTRACT_ADDRESS,
        fromBlock: firstBlockListening,
        toBlock: "latest",
        topics: eventDecryptionResult,
    };
    const pastResults = await hardhat_1.ethers.provider.getLogs(filterDecryptionResult);
    results = results.concat(pastResults.map((result) => ifaceResultCallback.parseLog(result).args[0]));
    return results;
};
const allTrue = (arr, fn = Boolean) => arr.every(fn);
const fulfillAllPastRequestsIds = async (mocked) => {
    const eventDecryption = await gateway.filters.EventDecryption().getTopicFilter();
    const results = await getAlreadyFulfilledDecryptions();
    const filterDecryption = {
        address: constants_1.GATEWAYCONTRACT_ADDRESS,
        fromBlock: firstBlockListening,
        toBlock: "latest",
        topics: eventDecryption,
    };
    const pastRequests = await hardhat_1.ethers.provider.getLogs(filterDecryption);
    for (const request of pastRequests) {
        const event = ifaceEventDecryption.parseLog(request);
        const requestID = event.args[0];
        const handles = event.args[1];
        const typesList = handles.map((handle) => parseInt(handle.toString(16).slice(-4, -2), 16));
        const msgValue = event.args[4];
        if (!results.includes(requestID)) {
            if (mocked) {
                await (0, coprocessorUtils_1.awaitCoprocessor)();
                const aclArtifact = require("fhevm-core-contracts/artifacts/contracts/ACL.sol/ACL.json");
                const acl = await hardhat_1.ethers.getContractAt(aclArtifact.abi, constants_1.ACL_ADDRESS);
                const isAllowedForDec = await Promise.all(handles.map(async (handle) => acl.isAllowedForDecryption(handle)));
                if (!allTrue(isAllowedForDec)) {
                    throw new Error("Some handle is not authorized for decryption");
                }
                const types = typesList.map((num) => CiphertextType[num]);
                const values = await Promise.all(handles.map(async (handle) => BigInt(await (0, coprocessorUtils_1.getClearText)(handle))));
                const valuesFormatted = values.map((value, index) => types[index] === "address" ? "0x" + value.toString(16).padStart(40, "0") : value);
                const valuesFormatted2 = valuesFormatted.map((value, index) => typesList[index] === 9 ? "0x" + value.toString(16).padStart(128, "0") : value);
                const valuesFormatted3 = valuesFormatted2.map((value, index) => typesList[index] === 10 ? "0x" + value.toString(16).padStart(256, "0") : value);
                const valuesFormatted4 = valuesFormatted3.map((value, index) => typesList[index] === 11 ? "0x" + value.toString(16).padStart(512, "0") : value);
                const abiCoder = new hardhat_1.ethers.AbiCoder();
                let encodedData;
                let calldata;
                encodedData = abiCoder.encode(["uint256", ...types], [31, ...valuesFormatted4]);
                calldata = "0x" + encodedData.slice(66);
                const numSigners = 1;
                const decryptResultsEIP712signatures = await computeDecryptSignatures(handles, calldata, numSigners);
                const relayer = await (0, mockedSetup_1.impersonateAddress)(hre, ethers_1.ZeroAddress, hardhat_1.ethers.parseEther("100"));
                await gateway
                    .connect(relayer)
                    .fulfillRequest(requestID, calldata, decryptResultsEIP712signatures, { value: msgValue });
            }
            else {
                await (0, utils_1.waitNBlocks)(1);
                await fulfillAllPastRequestsIds(mocked);
            }
        }
    }
};
async function computeDecryptSignatures(handlesList, decryptedResult, numSigners) {
    const signatures = [];
    for (let idx = 0; idx < numSigners; idx++) {
        const privKeySigner = constants_1.PRIVATE_KEY_KMS_SIGNER;
        if (privKeySigner) {
            const kmsSigner = new hardhat_1.ethers.Wallet(privKeySigner).connect(hardhat_1.ethers.provider);
            const signature = await kmsSign(handlesList, decryptedResult, kmsSigner);
            signatures.push(signature);
        }
        else {
            throw new Error(`Private key for signer ${idx} not found in environment variables`);
        }
    }
    return signatures;
}
async function kmsSign(handlesList, decryptedResult, kmsSigner) {
    const kmsAdd = constants_1.KMSVERIFIER_ADDRESS;
    const chainId = (await hardhat_1.ethers.provider.getNetwork()).chainId;
    const domain = {
        name: "KMSVerifier",
        version: "1",
        chainId: chainId,
        verifyingContract: kmsAdd,
    };
    const types = {
        DecryptionResult: [
            {
                name: "aclAddress",
                type: "address",
            },
            {
                name: "handlesList",
                type: "uint256[]",
            },
            {
                name: "decryptedResult",
                type: "bytes",
            },
        ],
    };
    const message = {
        aclAddress: aclAdd,
        handlesList: handlesList,
        decryptedResult: decryptedResult,
    };
    const signature = await kmsSigner.signTypedData(domain, types, message);
    const sigRSV = hardhat_1.ethers.Signature.from(signature);
    const v = 27 + sigRSV.yParity;
    const r = sigRSV.r;
    const s = sigRSV.s;
    const result = r + s.substring(2) + v.toString(16);
    return result;
}
//# sourceMappingURL=asyncDecrypt.js.map