"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
const coprocessorUtils_1 = require("../coprocessorUtils");
const instance_1 = require("../instance");
const signers_1 = require("../signers");
const ConfidentialERC20_fixture_1 = require("./ConfidentialERC20.fixture");
describe("ConfidentialERC20:FHEGas", function () {
    before(async function () {
        await (0, signers_1.initSigners)();
        this.signers = await (0, signers_1.getSigners)();
    });
    beforeEach(async function () {
        const contract = await (0, ConfidentialERC20_fixture_1.deployConfidentialERC20Fixture)();
        this.contractAddress = await contract.getAddress();
        this.erc20 = contract;
        this.fhevm = await (0, instance_1.createInstance)();
    });
    it("gas consumed during transfer", async function () {
        const transaction = await this.erc20.mint(this.signers.alice, 10000);
        const t1 = await transaction.wait();
        (0, chai_1.expect)(t1?.status).to.eq(1);
        const input = this.fhevm.createEncryptedInput(this.contractAddress, this.signers.alice.address);
        input.add64(1337);
        const encryptedTransferAmount = await input.encrypt();
        const tx = await this.erc20["transfer(address,bytes32,bytes)"](this.signers.bob, encryptedTransferAmount.handles[0], encryptedTransferAmount.inputProof);
        const t2 = await tx.wait();
        (0, chai_1.expect)(t2?.status).to.eq(1);
        if (hardhat_1.network.name === "hardhat") {
            const FHEGasConsumedTransfer = (0, coprocessorUtils_1.getFHEGasFromTxReceipt)(t2);
            console.log("FHEGas Consumed during transfer", FHEGasConsumedTransfer);
        }
        console.log("Native Gas Consumed during transfer", t2.gasUsed);
    });
    it("gas consumed during transferFrom", async function () {
        const transaction = await this.erc20.mint(this.signers.alice, 10000);
        await transaction.wait();
        const inputAlice = this.fhevm.createEncryptedInput(this.contractAddress, this.signers.alice.address);
        inputAlice.add64(1337);
        const encryptedAllowanceAmount = await inputAlice.encrypt();
        const tx = await this.erc20["approve(address,bytes32,bytes)"](this.signers.bob, encryptedAllowanceAmount.handles[0], encryptedAllowanceAmount.inputProof);
        await tx.wait();
        const bobErc20 = this.erc20.connect(this.signers.bob);
        const inputBob2 = this.fhevm.createEncryptedInput(this.contractAddress, this.signers.bob.address);
        inputBob2.add64(1337);
        const encryptedTransferAmount2 = await inputBob2.encrypt();
        const tx3 = await bobErc20["transferFrom(address,address,bytes32,bytes)"](this.signers.alice, this.signers.bob, encryptedTransferAmount2.handles[0], encryptedTransferAmount2.inputProof);
        const t3 = await tx3.wait();
        if (hardhat_1.network.name === "hardhat") {
            const FHEGasConsumedTransferFrom = (0, coprocessorUtils_1.getFHEGasFromTxReceipt)(t3);
            console.log("FHEGas Consumed during transferFrom", FHEGasConsumedTransferFrom);
        }
        console.log("Native Gas Consumed during transferFrom", t3.gasUsed);
    });
});
//# sourceMappingURL=ConfidentialERC20.FHEGas.js.map