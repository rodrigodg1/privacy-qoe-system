export declare const reencryptRequestMocked: (handle: bigint, privateKey: string, publicKey: string, signature: string, contractAddress: string, userAddress: string) => Promise<bigint>;
export declare const createEncryptedInputMocked: (contractAddress: string, userAddress: string) => {
    addBool(value: boolean | number | bigint): any;
    add4(value: number | bigint): any;
    add8(value: number | bigint): any;
    add16(value: number | bigint): any;
    add32(value: number | bigint): any;
    add64(value: number | bigint): any;
    add128(value: number | bigint): any;
    addAddress(value: string): any;
    add256(value: number | bigint): any;
    addBytes64(value: Uint8Array): any;
    addBytes128(value: Uint8Array): any;
    addBytes256(value: Uint8Array): any;
    getValues(): bigint[];
    getBits(): (2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 160)[];
    resetValues(): any;
    encrypt(): Promise<{
        handles: Uint8Array<ArrayBuffer>[];
        inputProof: string;
    }>;
};
export declare const ENCRYPTION_TYPES: {
    2: number;
    4: number;
    8: number;
    16: number;
    32: number;
    64: number;
    128: number;
    160: number;
    256: number;
    512: number;
    1024: number;
    2048: number;
};
//# sourceMappingURL=fhevmjsMocked.d.ts.map