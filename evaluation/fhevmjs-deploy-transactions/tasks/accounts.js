"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("hardhat/config");
const constants_1 = require("../test/constants");
(0, config_1.task)("get-accounts", "Prints the list of accounts")
    .addParam("numAccounts", "Number of accounts to return (1-10)", 3, config_1.types.int)
    .setAction(async ({ numAccounts }, hre) => {
    if (numAccounts < 1 || numAccounts > 10) {
        throw new Error("Number of accounts must be between 1 and 10");
    }
    const signers = await hre.ethers.getSigners();
    const accounts = [];
    const { mnemonic } = hre.network.config.accounts;
    for (let i = 0; i < numAccounts && i < signers.length; i++) {
        const signer = signers[i];
        const address = await signer.getAddress();
        const phrase = hre.ethers.Mnemonic.fromPhrase(mnemonic);
        const pathDeployer = "m/44'/60'/0'/0/" + i;
        const privateKey = hre.ethers.HDNodeWallet.fromMnemonic(phrase, pathDeployer).privateKey;
        accounts.push({
            index: i,
            privateKey: privateKey,
            address: address,
        });
    }
    console.info("\nAccount Details:");
    console.info("================");
    accounts.forEach(({ index, privateKey, address }) => {
        console.info(`\nAccount ${index}: (${constants_1.ACCOUNT_NAMES[index]})`);
        console.info(`Address:     ${address}`);
        console.info(`Private Key: ${privateKey}`);
    });
});
//# sourceMappingURL=accounts.js.map