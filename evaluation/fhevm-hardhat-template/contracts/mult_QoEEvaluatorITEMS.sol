// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";
import { SepoliaZamaFHEVMConfig } from "fhevm/config/ZamaFHEVMConfig.sol";

// Contract renamed to reflect multiplication
contract Multiplying_QoEEvaluatorITEMS is SepoliaZamaFHEVMConfig {

    // Removed QoEData struct and dataEntries array

    // State variables for running products (encrypted)
    // MUST be initialized to encrypted 1 for multiplication
    euint32 private productMOS;
    euint32 private productQosType;
    euint32 private productQodModel;
    euint32 private productQodOSVersion;
    euint32 private productQosOperator;

    // Counter for the number of times data has been multiplied
    uint256 private entryCount;

    /**
     * @notice Constructor to initialize product totals to encrypted 1.
     */
    constructor() {
        // Initialize all product state variables to the trivial encryption of 1
        euint32 encryptedOne = TFHE.asEuint32(1); // Trivial encrypt 1 as euint32
        productMOS = encryptedOne;
        productQosType = encryptedOne;
        productQodModel = encryptedOne;
        productQodOSVersion = encryptedOne;
        productQosOperator = encryptedOne;

        // Allow the contract to modify these initial values
        TFHE.allowThis(productMOS);
        TFHE.allowThis(productQosType);
        TFHE.allowThis(productQodModel);
        TFHE.allowThis(productQodOSVersion);
        TFHE.allowThis(productQosOperator);
    }

    /**
     * @notice Accepts plaintext QoE values, encrypts them, and multiplies them into running products.
     * @param _qosType Plaintext QoS type (uint8). Must not be zero for meaningful multiplication.
     * @param _qodModel Plaintext QoD model (uint8). Must not be zero.
     * @param _qodOSVersion Plaintext QoD OS version (uint8). Must not be zero.
     * @param _qosOperator Plaintext QoS operator (uint8). Must not be zero.
     * @param _mos Plaintext MOS value (uint8). Must not be zero.
     */
    function multiplyData( // Renamed function for clarity
        uint8 _qosType,
        uint8 _qodModel,
        uint8 _qodOSVersion,
        uint8 _qosOperator,
        uint8 _mos
    ) public {
        // Consider adding requires for non-zero inputs if multiplying by zero is undesirable
        // require(_qosType != 0, "QoS Type cannot be zero for multiplication");
        // require(_mos != 0, "MOS cannot be zero for multiplication");
        // ... etc.

        // Perform trivial encryption on the plaintext inputs
        euint8 qosTypeValueEncrypted = TFHE.asEuint8(_qosType);
        euint8 qodModelValueEncrypted = TFHE.asEuint8(_qodModel);
        euint8 qodOSVersionValueEncrypted = TFHE.asEuint8(_qodOSVersion);
        euint8 qosOperatorValueEncrypted = TFHE.asEuint8(_qosOperator);
        euint8 mosValueEncrypted = TFHE.asEuint8(_mos);

        // Update all products using the encrypted values (casting euint8 to euint32)
        productMOS = TFHE.mul(productMOS, TFHE.asEuint32(mosValueEncrypted));
        productQosType = TFHE.mul(productQosType, TFHE.asEuint32(qosTypeValueEncrypted));
        productQodModel = TFHE.mul(productQodModel, TFHE.asEuint32(qodModelValueEncrypted));
        productQodOSVersion = TFHE.mul(productQodOSVersion, TFHE.asEuint32(qodOSVersionValueEncrypted));
        productQosOperator = TFHE.mul(productQosOperator, TFHE.asEuint32(qosOperatorValueEncrypted));

        // Increment the counter
        entryCount++;

        // Allow the contract itself to operate on all updated encrypted products
        TFHE.allowThis(productMOS);
        TFHE.allowThis(productQosType);
        TFHE.allowThis(productQodModel);
        TFHE.allowThis(productQodOSVersion);
        TFHE.allowThis(productQosOperator);
    }

    /**
     * @notice Gets the number of times multiplyData has been called.
     */
    function getEntryCount() public view returns (uint256) {
        return entryCount;
    }

    // --- Getter functions for products (return encrypted handles) ---
    function getProductMOS() public view returns (euint32) { return productMOS; }
    function getProductQosType() public view returns (euint32) { return productQosType; }
    function getProductQodModel() public view returns (euint32) { return productQodModel; }
    function getProductQodOSVersion() public view returns (euint32) { return productQodOSVersion; }
    function getProductQosOperator() public view returns (euint32) { return productQosOperator; }

    // --- Functions to multiply external *already encrypted* values into totals ---
    // These are updated to use TFHE.mul and renamed for clarity.

    function multiplyIntoProductMOS(einput valueInput, bytes calldata inputProof) public {
        euint32 value = TFHE.asEuint32(valueInput, inputProof);
        // Consider require(TFHE.ne(value, TFHE.asEuint32(0)), "Cannot multiply by zero");
        productMOS = TFHE.mul(productMOS, value);
        TFHE.allowThis(productMOS);
    }

    function multiplyIntoProductQosType(einput valueInput, bytes calldata inputProof) public {
        euint32 value = TFHE.asEuint32(valueInput, inputProof);
        productQosType = TFHE.mul(productQosType, value);
        TFHE.allowThis(productQosType);
    }

    function multiplyIntoProductQodModel(einput valueInput, bytes calldata inputProof) public {
        euint32 value = TFHE.asEuint32(valueInput, inputProof);
        productQodModel = TFHE.mul(productQodModel, value);
        TFHE.allowThis(productQodModel);
    }

    function multiplyIntoProductQodOSVersion(einput valueInput, bytes calldata inputProof) public {
        euint32 value = TFHE.asEuint32(valueInput, inputProof);
        productQodOSVersion = TFHE.mul(productQodOSVersion, value);
        TFHE.allowThis(productQodOSVersion);
    }

    function multiplyIntoProductQosOperator(einput valueInput, bytes calldata inputProof) public {
        euint32 value = TFHE.asEuint32(valueInput, inputProof);
        productQosOperator = TFHE.mul(productQosOperator, value);
        TFHE.allowThis(productQosOperator);
    }
}