export declare function insertSQL(handle: string, clearText: bigint, replace?: boolean): void;
export declare const getClearText: (handle: bigint) => Promise<string>;
export declare function numberToEvenHexString(num: number): string;
export declare const awaitCoprocessor: () => Promise<void>;
export declare function getFHEGasFromTxReceipt(receipt: ethers.TransactionReceipt): number;
//# sourceMappingURL=coprocessorUtils.d.ts.map