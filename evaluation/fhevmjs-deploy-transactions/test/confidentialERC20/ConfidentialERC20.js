"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
const instance_1 = require("../instance");
const reencrypt_1 = require("../reencrypt");
const signers_1 = require("../signers");
const utils_1 = require("../utils");
const ConfidentialERC20_fixture_1 = require("./ConfidentialERC20.fixture");
describe("ConfidentialERC20", function () {
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
    it("should mint the contract", async function () {
        const transaction = await this.erc20.mint(this.signers.alice, 1000);
        await transaction.wait();
        const balanceHandleAlice = await this.erc20.balanceOf(this.signers.alice);
        const balanceAlice = await (0, reencrypt_1.reencryptEuint64)(this.signers.alice, this.fhevm, balanceHandleAlice, this.contractAddress);
        (0, chai_1.expect)(balanceAlice).to.equal(1000);
        const totalSupply = await this.erc20.totalSupply();
        (0, chai_1.expect)(totalSupply).to.equal(1000);
    });
    it("should transfer tokens between two users", async function () {
        const transaction = await this.erc20.mint(this.signers.alice, 10000);
        const t1 = await transaction.wait();
        (0, chai_1.expect)(t1?.status).to.eq(1);
        const input = this.fhevm.createEncryptedInput(this.contractAddress, this.signers.alice.address);
        input.add64(1337);
        const encryptedTransferAmount = await input.encrypt();
        const tx = await this.erc20["transfer(address,bytes32,bytes)"](this.signers.bob, encryptedTransferAmount.handles[0], encryptedTransferAmount.inputProof);
        const t2 = await tx.wait();
        (0, chai_1.expect)(t2?.status).to.eq(1);
        const balanceHandleAlice = await this.erc20.balanceOf(this.signers.alice);
        const balanceAlice = await (0, reencrypt_1.reencryptEuint64)(this.signers.alice, this.fhevm, balanceHandleAlice, this.contractAddress);
        (0, chai_1.expect)(balanceAlice).to.equal(10000 - 1337);
        const balanceHandleBob = await this.erc20.balanceOf(this.signers.bob);
        const balanceBob = await (0, reencrypt_1.reencryptEuint64)(this.signers.bob, this.fhevm, balanceHandleBob, this.contractAddress);
        (0, chai_1.expect)(balanceBob).to.equal(1337);
        await (0, chai_1.expect)((0, reencrypt_1.reencryptEuint64)(this.signers.bob, this.fhevm, balanceHandleAlice, this.contractAddress)).to.be.rejectedWith("User is not authorized to reencrypt this handle!");
        await (0, chai_1.expect)((0, reencrypt_1.reencryptEuint64)(this.signers.alice, this.fhevm, balanceHandleAlice, this.signers.alice.address)).to.be.rejectedWith("userAddress should not be equal to contractAddress when requesting reencryption!");
    });
    it("should not transfer tokens between two users", async function () {
        const transaction = await this.erc20.mint(this.signers.alice, 1000);
        await transaction.wait();
        const input = this.fhevm.createEncryptedInput(this.contractAddress, this.signers.alice.address);
        input.add64(1337);
        const encryptedTransferAmount = await input.encrypt();
        const tx = await this.erc20["transfer(address,bytes32,bytes)"](this.signers.bob, encryptedTransferAmount.handles[0], encryptedTransferAmount.inputProof);
        await tx.wait();
        const balanceHandleAlice = await this.erc20.balanceOf(this.signers.alice);
        const balanceAlice = await (0, reencrypt_1.reencryptEuint64)(this.signers.alice, this.fhevm, balanceHandleAlice, this.contractAddress);
        (0, chai_1.expect)(balanceAlice).to.equal(1000);
        const balanceHandleBob = await this.erc20.balanceOf(this.signers.bob);
        const balanceBob = await (0, reencrypt_1.reencryptEuint64)(this.signers.bob, this.fhevm, balanceHandleBob, this.contractAddress);
        (0, chai_1.expect)(balanceBob).to.equal(0);
    });
    it("should be able to transferFrom only if allowance is sufficient", async function () {
        const transaction = await this.erc20.mint(this.signers.alice, 10000);
        await transaction.wait();
        const inputAlice = this.fhevm.createEncryptedInput(this.contractAddress, this.signers.alice.address);
        inputAlice.add64(1337);
        const encryptedAllowanceAmount = await inputAlice.encrypt();
        const tx = await this.erc20["approve(address,bytes32,bytes)"](this.signers.bob, encryptedAllowanceAmount.handles[0], encryptedAllowanceAmount.inputProof);
        await tx.wait();
        const bobErc20 = this.erc20.connect(this.signers.bob);
        const inputBob1 = this.fhevm.createEncryptedInput(this.contractAddress, this.signers.bob.address);
        inputBob1.add64(1338);
        const encryptedTransferAmount = await inputBob1.encrypt();
        const tx2 = await bobErc20["transferFrom(address,address,bytes32,bytes)"](this.signers.alice, this.signers.bob, encryptedTransferAmount.handles[0], encryptedTransferAmount.inputProof);
        await tx2.wait();
        const balanceHandleAlice = await this.erc20.balanceOf(this.signers.alice);
        const balanceAlice = await (0, reencrypt_1.reencryptEuint64)(this.signers.alice, this.fhevm, balanceHandleAlice, this.contractAddress);
        (0, chai_1.expect)(balanceAlice).to.equal(10000);
        const balanceHandleBob = await this.erc20.balanceOf(this.signers.bob);
        const balanceBob = await (0, reencrypt_1.reencryptEuint64)(this.signers.bob, this.fhevm, balanceHandleBob, this.contractAddress);
        (0, chai_1.expect)(balanceBob).to.equal(0);
        const inputBob2 = this.fhevm.createEncryptedInput(this.contractAddress, this.signers.bob.address);
        inputBob2.add64(1337);
        const encryptedTransferAmount2 = await inputBob2.encrypt();
        const tx3 = await bobErc20["transferFrom(address,address,bytes32,bytes)"](this.signers.alice, this.signers.bob, encryptedTransferAmount2.handles[0], encryptedTransferAmount2.inputProof);
        await tx3.wait();
        const balanceHandleAlice2 = await this.erc20.balanceOf(this.signers.alice);
        const balanceAlice2 = await (0, reencrypt_1.reencryptEuint64)(this.signers.alice, this.fhevm, balanceHandleAlice2, this.contractAddress);
        (0, chai_1.expect)(balanceAlice2).to.equal(10000 - 1337);
        const balanceHandleBob2 = await this.erc20.balanceOf(this.signers.bob);
        const balanceBob2 = await (0, reencrypt_1.reencryptEuint64)(this.signers.bob, this.fhevm, balanceHandleBob2, this.contractAddress);
        (0, chai_1.expect)(balanceBob2).to.equal(1337);
    });
    it("DEBUG - using debug.decrypt64 for debugging transfer", async function () {
        if (hardhat_1.network.name === "hardhat") {
            const transaction = await this.erc20.mint(this.signers.alice, 1000);
            await transaction.wait();
            const input = this.fhevm.createEncryptedInput(this.contractAddress, this.signers.alice.address);
            input.add64(1337);
            const encryptedTransferAmount = await input.encrypt();
            const tx = await this.erc20["transfer(address,bytes32,bytes)"](this.signers.bob, encryptedTransferAmount.handles[0], encryptedTransferAmount.inputProof);
            await tx.wait();
            const balanceHandleAlice = await this.erc20.balanceOf(this.signers.alice);
            const balanceAlice = await utils_1.debug.decrypt64(balanceHandleAlice);
            (0, chai_1.expect)(balanceAlice).to.equal(1000);
            const balanceHandleBob = await this.erc20.balanceOf(this.signers.bob);
            const balanceBob = await utils_1.debug.decrypt64(balanceHandleBob);
            (0, chai_1.expect)(balanceBob).to.equal(0);
        }
    });
});
//# sourceMappingURL=ConfidentialERC20.js.map