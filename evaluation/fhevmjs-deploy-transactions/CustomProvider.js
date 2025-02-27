"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plugins_1 = require("hardhat/plugins");
class CustomProvider extends plugins_1.ProviderWrapper {
    constructor(_wrappedProvider) {
        super(_wrappedProvider);
        this._wrappedProvider = _wrappedProvider;
        this.lastBlockSnapshot = 0;
        this.lastCounterRand = 0;
        this.lastBlockSnapshotForDecrypt = 0;
    }
    async request(args) {
        if (args.method === "evm_revert") {
            const result = await this._wrappedProvider.request(args);
            const blockNumberHex = (await this._wrappedProvider.request({ method: "eth_blockNumber" }));
            this.lastBlockSnapshot = parseInt(blockNumberHex);
            this.lastBlockSnapshotForDecrypt = parseInt(blockNumberHex);
            const callData = {
                to: "0x000000000000000000000000000000000000005d",
                data: "0x1f20d85c",
            };
            this.lastCounterRand = (await this._wrappedProvider.request({
                method: "eth_call",
                params: [callData, "latest"],
            }));
            return result;
        }
        if (args.method === "get_lastBlockSnapshot") {
            return [this.lastBlockSnapshot, this.lastCounterRand];
        }
        if (args.method === "get_lastBlockSnapshotForDecrypt") {
            return this.lastBlockSnapshotForDecrypt;
        }
        if (args.method === "set_lastBlockSnapshot") {
            this.lastBlockSnapshot = Array.isArray(args.params) && args.params[0];
            return this.lastBlockSnapshot;
        }
        if (args.method === "set_lastBlockSnapshotForDecrypt") {
            this.lastBlockSnapshotForDecrypt = Array.isArray(args.params) && args.params[0];
            return this.lastBlockSnapshotForDecrypt;
        }
        const result = this._wrappedProvider.request(args);
        return result;
    }
}
exports.default = CustomProvider;
//# sourceMappingURL=CustomProvider.js.map