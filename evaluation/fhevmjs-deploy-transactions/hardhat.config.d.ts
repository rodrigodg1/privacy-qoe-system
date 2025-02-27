import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "hardhat-ignore-warnings";
import { HardhatUserConfig } from "hardhat/config";
import "./tasks/accounts";
import "./tasks/etherscanVerify";
import "./tasks/interactionMyConfidentialERC20";
declare const config: HardhatUserConfig;
export default config;
//# sourceMappingURL=hardhat.config.d.ts.map