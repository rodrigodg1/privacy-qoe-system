"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("@nomicfoundation/hardhat-toolbox");
const dotenv_1 = __importDefault(require("dotenv"));
require("hardhat-deploy");
require("hardhat-ignore-warnings");
const config_1 = require("hardhat/config");
const config_2 = require("hardhat/config");
const CustomProvider_1 = __importDefault(require("./CustomProvider"));
require("./tasks/accounts");
require("./tasks/etherscanVerify");
require("./tasks/interactionMyConfidentialERC20");
const mockedSetup_1 = require("./test/mockedSetup");
(0, config_1.extendProvider)(async (provider) => {
    const newProvider = new CustomProvider_1.default(provider);
    return newProvider;
});
dotenv_1.default.config();
const mnemonic = process.env.MNEMONIC;
const chainIds = {
    zama: 8009,
    local: 9000,
    localCoprocessor: 12345,
    sepolia: 11155111,
};
function getChainConfig(chain) {
    let jsonRpcUrl;
    switch (chain) {
        case "local":
            jsonRpcUrl = "http://localhost:8545";
            break;
        case "localCoprocessor":
            jsonRpcUrl = "http://localhost:8745";
            break;
        case "zama":
            jsonRpcUrl = "https://devnet.zama.ai";
            break;
        case "sepolia":
            jsonRpcUrl = process.env.SEPOLIA_RPC_URL;
    }
    return {
        accounts: {
            count: 10,
            mnemonic,
            path: "m/44'/60'/0'/0",
        },
        chainId: chainIds[chain],
        url: jsonRpcUrl,
    };
}
(0, config_2.task)("coverage").setAction(async (taskArgs, hre, runSuper) => {
    hre.config.networks.hardhat.allowUnlimitedContractSize = true;
    hre.config.networks.hardhat.blockGasLimit = 1099511627775;
    await runSuper(taskArgs);
});
(0, config_2.task)("test", async (_taskArgs, hre, runSuper) => {
    if (hre.network.name === "hardhat") {
        await (0, mockedSetup_1.setCodeMocked)(hre);
    }
    await runSuper();
});
const config = {
    defaultNetwork: "hardhat",
    namedAccounts: {
        deployer: 0,
    },
    mocha: {
        timeout: 500000,
    },
    gasReporter: {
        currency: "USD",
        enabled: process.env.REPORT_GAS ? true : false,
        excludeContracts: [],
        src: "./contracts",
    },
    networks: {
        hardhat: {
            accounts: {
                count: 10,
                mnemonic,
                path: "m/44'/60'/0'/0",
            },
        },
        sepolia: getChainConfig("sepolia"),
        zama: getChainConfig("zama"),
        localDev: getChainConfig("local"),
        local: getChainConfig("local"),
        localCoprocessor: getChainConfig("localCoprocessor"),
    },
    paths: {
        artifacts: "./artifacts",
        cache: "./cache",
        sources: "./contracts",
        tests: "./test",
    },
    solidity: {
        version: "0.8.24",
        settings: {
            metadata: {
                bytecodeHash: "none",
            },
            optimizer: {
                enabled: true,
                runs: 800,
            },
            evmVersion: "cancun",
        },
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
    warnings: {
        "*": {
            "transient-storage": false,
        },
    },
    typechain: {
        outDir: "types",
        target: "ethers-v6",
    },
};
exports.default = config;
//# sourceMappingURL=hardhat.config.js.map