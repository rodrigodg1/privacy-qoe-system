export declare const mineNBlocks: (n: number) => Promise<void>;
export declare const bigIntToBytes64: (value: bigint) => Uint8Array<ArrayBuffer>;
export declare const bigIntToBytes128: (value: bigint) => Uint8Array<ArrayBuffer>;
export declare const bigIntToBytes256: (value: bigint) => Uint8Array<ArrayBuffer>;
export declare const waitNBlocks: (Nblocks: number) => Promise<void>;
export declare const produceDummyTransactions: (blockCount: number) => Promise<void>;
export declare const debug: {
    decryptBool: (handle: bigint) => Promise<boolean>;
    decrypt4: (handle: bigint) => Promise<bigint>;
    decrypt8: (handle: bigint) => Promise<bigint>;
    decrypt16: (handle: bigint) => Promise<bigint>;
    decrypt32: (handle: bigint) => Promise<bigint>;
    decrypt64: (handle: bigint) => Promise<bigint>;
    decrypt128: (handle: bigint) => Promise<bigint>;
    decrypt256: (handle: bigint) => Promise<bigint>;
    decryptAddress: (handle: bigint) => Promise<string>;
    decryptEbytes64: (handle: bigint) => Promise<string>;
    decryptEbytes128: (handle: bigint) => Promise<string>;
    decryptEbytes256: (handle: bigint) => Promise<string>;
};
//# sourceMappingURL=utils.d.ts.map