import { Signer } from "ethers";
import { FhevmInstance } from "fhevmjs/node";
export declare function verifyType(handle: bigint, expectedType: number): void;
export declare function reencryptEbool(signer: Signer, instance: FhevmInstance, handle: bigint, contractAddress: string): Promise<boolean>;
export declare function reencryptEuint4(signer: Signer, instance: FhevmInstance, handle: bigint, contractAddress: string): Promise<bigint>;
export declare function reencryptEuint8(signer: Signer, instance: FhevmInstance, handle: bigint, contractAddress: string): Promise<bigint>;
export declare function reencryptEuint16(signer: Signer, instance: FhevmInstance, handle: bigint, contractAddress: string): Promise<bigint>;
export declare function reencryptEuint32(signer: Signer, instance: FhevmInstance, handle: bigint, contractAddress: string): Promise<bigint>;
export declare function reencryptEuint64(signer: Signer, instance: FhevmInstance, handle: bigint, contractAddress: string): Promise<bigint>;
export declare function reencryptEuint128(signer: Signer, instance: FhevmInstance, handle: bigint, contractAddress: string): Promise<bigint>;
export declare function reencryptEaddress(signer: Signer, instance: FhevmInstance, handle: bigint, contractAddress: string): Promise<string>;
export declare function reencryptEuint256(signer: Signer, instance: FhevmInstance, handle: bigint, contractAddress: string): Promise<bigint>;
export declare function reencryptEbytes64(signer: Signer, instance: FhevmInstance, handle: bigint, contractAddress: string): Promise<bigint>;
export declare function reencryptEbytes128(signer: Signer, instance: FhevmInstance, handle: bigint, contractAddress: string): Promise<bigint>;
export declare function reencryptEbytes256(signer: Signer, instance: FhevmInstance, handle: bigint, contractAddress: string): Promise<bigint>;
//# sourceMappingURL=reencrypt.d.ts.map