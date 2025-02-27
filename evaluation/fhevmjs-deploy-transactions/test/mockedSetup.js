"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCodeMocked = setCodeMocked;
exports.impersonateAddress = impersonateAddress;
const ethers_1 = require("ethers");
const constants_1 = require("./constants");
const OneAddress = "0x0000000000000000000000000000000000000001";
async function setCodeMocked(hre) {
    const aclArtifact = require("fhevm-core-contracts/artifacts/contracts/ACL.sol/ACL.json");
    const aclBytecode = aclArtifact.deployedBytecode;
    await hre.network.provider.send("hardhat_setCode", [constants_1.ACL_ADDRESS, aclBytecode]);
    const execArtifact = require("fhevm-core-contracts/artifacts/contracts/TFHEExecutorWithEvents.sol/TFHEExecutorWithEvents.json");
    const execBytecode = execArtifact.deployedBytecode;
    await hre.network.provider.send("hardhat_setCode", [constants_1.TFHEEXECUTOR_ADDRESS, execBytecode]);
    const kmsArtifact = require("fhevm-core-contracts/artifacts/contracts/KMSVerifier.sol/KMSVerifier.json");
    const kmsBytecode = kmsArtifact.deployedBytecode;
    await hre.network.provider.send("hardhat_setCode", [constants_1.KMSVERIFIER_ADDRESS, kmsBytecode]);
    const inputArtifact = require("fhevm-core-contracts/artifacts/contracts/InputVerifier.coprocessor.sol/InputVerifier.json");
    const inputBytecode = inputArtifact.deployedBytecode;
    await hre.network.provider.send("hardhat_setCode", [constants_1.INPUTVERIFIER_ADDRESS, inputBytecode]);
    const fhepaymentArtifact = require("fhevm-core-contracts/artifacts/contracts/FHEPayment.sol/FHEPayment.json");
    const fhepaymentBytecode = fhepaymentArtifact.deployedBytecode;
    await hre.network.provider.send("hardhat_setCode", [constants_1.FHEPAYMENT_ADDRESS, fhepaymentBytecode]);
    const gatewayArtifact = require("fhevm-core-contracts/artifacts/gateway/GatewayContract.sol/GatewayContract.json");
    const gatewayBytecode = gatewayArtifact.deployedBytecode;
    await hre.network.provider.send("hardhat_setCode", [constants_1.GATEWAYCONTRACT_ADDRESS, gatewayBytecode]);
    const zero = await impersonateAddress(hre, ethers_1.ZeroAddress, hre.ethers.parseEther("100"));
    const one = await impersonateAddress(hre, OneAddress, hre.ethers.parseEther("100"));
    const kmsSigner = new hre.ethers.Wallet(constants_1.PRIVATE_KEY_KMS_SIGNER);
    const kms = await hre.ethers.getContractAt(kmsArtifact.abi, constants_1.KMSVERIFIER_ADDRESS);
    await kms.connect(zero).initialize(OneAddress);
    await kms.connect(one).addSigner(kmsSigner);
    const input = await hre.ethers.getContractAt(inputArtifact.abi, constants_1.INPUTVERIFIER_ADDRESS);
    await input.connect(zero).initialize(OneAddress);
    const gateway = await hre.ethers.getContractAt(gatewayArtifact.abi, constants_1.GATEWAYCONTRACT_ADDRESS);
    await gateway.connect(zero).addRelayer(ethers_1.ZeroAddress);
}
async function impersonateAddress(hre, address, amount) {
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address],
    });
    await hre.network.provider.send("hardhat_setBalance", [address, hre.ethers.toBeHex(amount)]);
    const impersonatedSigner = await hre.ethers.getSigner(address);
    return impersonatedSigner;
}
//# sourceMappingURL=mockedSetup.js.map