"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const func = async function (hre) {
    const { deployer } = await hre.getNamedAccounts();
    const { deploy } = hre.deployments;
    const deployed = await deploy("MyConfidentialERC20", {
        from: deployer,
        args: ["Naraggara", "NARA"],
        log: true,
    });
    console.log(`MyConfidentialERC20 contract: `, deployed.address);
};
exports.default = func;
func.id = "deploy_confidentialERC20";
func.tags = ["MyConfidentialERC20"];
//# sourceMappingURL=deploy.js.map