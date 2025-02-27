"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("hardhat/config");
const reencrypt_1 = require("../test/reencrypt");
const instance_1 = require("./instance");
(0, config_1.task)("mint")
    .addParam("amount", "Tokens to mint")
    .addParam("to", "Recipient address")
    .setAction(async function (taskArguments, hre) {
    try {
        const { ethers, deployments } = hre;
        const amount = Number(taskArguments.amount);
        if (isNaN(amount) || amount <= 0) {
            throw new Error("Amount must be a positive number");
        }
        if (!ethers.isAddress(taskArguments.to)) {
            throw new Error("Invalid recipient address format");
        }
        const ERC20 = await deployments.get("MyConfidentialERC20");
        const signer = await ethers.provider.getSigner();
        const erc20 = (await ethers.getContractAt("MyConfidentialERC20", ERC20.address, signer));
        console.info("Starting mint process...");
        console.info(`Contract address: ${ERC20.address}`);
        console.info(`Minting ${amount} tokens to address: ${taskArguments.to}`);
        const tx = await erc20.mint(taskArguments.to, amount);
        console.info("Transaction submitted, waiting for confirmation...");
        const rcpt = await tx.wait();
        console.info("✅ Mint transaction successful!");
        console.info("Transaction hash:", rcpt.hash);
        console.info(`${amount} tokens were minted to ${taskArguments.to}`);
    }
    catch (error) {
        console.error("❌ Mint failed:");
        console.error(error instanceof Error ? error.message : error);
        throw error;
    }
});
(0, config_1.task)("totalSupply").setAction(async function (taskArguments, hre) {
    try {
        const { ethers, deployments } = hre;
        const ERC20 = await deployments.get("MyConfidentialERC20");
        const erc20 = (await ethers.getContractAt("MyConfidentialERC20", ERC20.address));
        const totalSupply = await erc20.totalSupply();
        console.info("✅ Retrieved total supply successfully");
        console.info("----------------------------------------");
        console.info(`Total Supply: ${totalSupply.toString()} tokens`);
        console.info("----------------------------------------");
    }
    catch (error) {
        console.error("❌ Total supply check failed:");
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    }
});
(0, config_1.task)("balance")
    .addParam("privatekey", "Private key of the address to check balance for")
    .setAction(async function (taskArguments, hre) {
    try {
        const { ethers, deployments } = hre;
        const wallet = new ethers.Wallet(taskArguments.privatekey);
        const address = wallet.address;
        console.info("Checking balance for address:", address);
        const ERC20 = await deployments.get("MyConfidentialERC20");
        const erc20 = (await ethers.getContractAt("MyConfidentialERC20", ERC20.address));
        const fhevm = await (0, instance_1.createInstance)(hre);
        const balanceHandle = await erc20.balanceOf(address);
        console.info("✅ Retrieved balance handle successfully");
        let balance;
        if (balanceHandle === 0n) {
            balance = 0n;
        }
        else {
            balance = await (0, reencrypt_1.reencryptEuint64)(wallet, fhevm, balanceHandle, ERC20.address);
        }
        console.info("----------------------------------------");
        console.info(`Address: ${address}`);
        console.info(`Balance: ${balance.toString()} tokens`);
        console.info("----------------------------------------");
    }
    catch (error) {
        console.error("❌ Balance check failed:");
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    }
});
(0, config_1.task)("transfer")
    .addParam("privatekey", "Private key of the address from which we are sending the tokens")
    .addParam("to", "Recipient address")
    .addParam("amount", "Amount to transfer")
    .setAction(async function (taskArguments, hre) {
    try {
        const { ethers, deployments } = hre;
        if (!ethers.isAddress(taskArguments.to)) {
            throw new Error("Invalid recipient address format");
        }
        const amount = Number(taskArguments.amount);
        if (isNaN(amount) || amount <= 0) {
            throw new Error("Amount must be a positive number");
        }
        console.info("Starting transfer process...");
        const wallet = new ethers.Wallet(taskArguments.privatekey, ethers.provider);
        const address = wallet.address;
        const ERC20 = await deployments.get("MyConfidentialERC20");
        const erc20 = (await ethers.getContractAt("MyConfidentialERC20", ERC20.address));
        console.info(`Contract address: ${ERC20.address}`);
        console.info(`From: ${address}`);
        console.info(`To: ${taskArguments.to}`);
        console.info(`Amount: ${amount} tokens`);
        const instance = await (0, instance_1.createInstance)(hre);
        const input = instance.createEncryptedInput(ERC20.address, address);
        input.add64(amount);
        const encryptedAmount = await input.encrypt();
        console.info("Submitting transfer transaction...");
        const tx = await erc20
            .connect(wallet)["transfer(address,bytes32,bytes)"](taskArguments.to, encryptedAmount.handles[0], encryptedAmount.inputProof);
        console.info("Waiting for confirmation...");
        const rcpt = await tx.wait();
        console.info("----------------------------------------");
        console.info("✅ Transfer successful!");
        console.info("Transaction hash:", rcpt.hash);
        console.info(`Transferred ${amount} tokens to ${taskArguments.to}`);
        console.info("----------------------------------------");
    }
    catch (error) {
        console.error("❌ Transfer failed:");
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    }
});
//# sourceMappingURL=interactionMyConfidentialERC20.js.map