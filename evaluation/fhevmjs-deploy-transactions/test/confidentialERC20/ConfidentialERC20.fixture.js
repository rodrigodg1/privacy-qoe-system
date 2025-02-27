"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployConfidentialERC20Fixture = deployConfidentialERC20Fixture;
const hardhat_1 = require("hardhat");
const signers_1 = require("../signers");
async function deployConfidentialERC20Fixture() {
    const signers = await (0, signers_1.getSigners)();
    const contractFactory = await hardhat_1.ethers.getContractFactory("MyConfidentialERC20");
    const contract = await contractFactory.connect(signers.alice).deploy("Naraggara", "NARA");
    await contract.waitForDeployment();
    return contract;
}
//# sourceMappingURL=ConfidentialERC20.fixture.js.map