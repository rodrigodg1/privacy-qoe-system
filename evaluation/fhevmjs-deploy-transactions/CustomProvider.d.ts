import { ProviderWrapper } from "hardhat/plugins";
import type { EIP1193Provider, RequestArguments } from "hardhat/types";
interface Test {
    request: EIP1193Provider["request"];
}
declare class CustomProvider extends ProviderWrapper implements Test {
    protected readonly _wrappedProvider: EIP1193Provider;
    lastBlockSnapshot: number;
    lastCounterRand: number;
    lastBlockSnapshotForDecrypt: number;
    constructor(_wrappedProvider: EIP1193Provider);
    request(args: RequestArguments): ReturnType<EIP1193Provider["request"]>;
}
export default CustomProvider;
//# sourceMappingURL=CustomProvider.d.ts.map