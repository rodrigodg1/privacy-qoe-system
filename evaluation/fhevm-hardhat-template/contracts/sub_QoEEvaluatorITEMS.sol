// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";
import { SepoliaZamaFHEVMConfig } from "fhevm/config/ZamaFHEVMConfig.sol";

// Contract renamed to reflect subtraction
contract Subtracting_QoEEvaluatorITEMS is SepoliaZamaFHEVMConfig {

    // Removed QoEData struct and dataEntries array

    // State variables for running differences (encrypted)
    // Initialized implicitly to encrypted 0
    euint32 private runningDifferenceMOS;
    euint32 private runningDifferenceQosType;
    euint32 private runningDifferenceQodModel;
    euint32 private runningDifferenceQodOSVersion;
    euint32 private runningDifferenceQosOperator;

    // Counter for the number of times data has been subtracted
    uint256 private entryCount;

    // Constructor is implicitly called (state variables default to encrypted 0)
    // If you needed to start from a specific value X:
    // constructor() {
    //     euint32 initialValue = TFHE.asEuint32(X);
    //     runningDifferenceMOS = initialValue;
    //     // ... initialize others ...
    //     TFHE.allowThis(runningDifferenceMOS);
    //     // ... allow others ...
    // }


    /**
     * @notice Accepts plaintext QoE values, encrypts them, and subtracts them from running differences.
     * @param _qosType Plaintext QoS type (uint8).
     * @param _qodModel Plaintext QoD model (uint8).
     * @param _qodOSVersion Plaintext QoD OS version (uint8).
     * @param _qosOperator Plaintext QoS operator (uint8).
     * @param _mos Plaintext MOS value (uint8).
     */
    function subtractData( // Renamed function for clarity
        uint8 _qosType,
        uint8 _qodModel,
        uint8 _qodOSVersion,
        uint8 _qosOperator,
        uint8 _mos
    ) public {
        // Perform trivial encryption on the plaintext inputs
        euint8 qosTypeValueEncrypted = TFHE.asEuint8(_qosType);
        euint8 qodModelValueEncrypted = TFHE.asEuint8(_qodModel);
        euint8 qodOSVersionValueEncrypted = TFHE.asEuint8(_qodOSVersion);
        euint8 qosOperatorValueEncrypted = TFHE.asEuint8(_qosOperator);
        euint8 mosValueEncrypted = TFHE.asEuint8(_mos);

        // Update all running differences using the encrypted values (casting euint8 to euint32)
        // result = current_difference - encrypted_value
        runningDifferenceMOS = TFHE.sub(runningDifferenceMOS, TFHE.asEuint32(mosValueEncrypted));
        runningDifferenceQosType = TFHE.sub(runningDifferenceQosType, TFHE.asEuint32(qosTypeValueEncrypted));
        runningDifferenceQodModel = TFHE.sub(runningDifferenceQodModel, TFHE.asEuint32(qodModelValueEncrypted));
        runningDifferenceQodOSVersion = TFHE.sub(runningDifferenceQodOSVersion, TFHE.asEuint32(qodOSVersionValueEncrypted));
        runningDifferenceQosOperator = TFHE.sub(runningDifferenceQosOperator, TFHE.asEuint32(qosOperatorValueEncrypted));

        // Increment the counter
        entryCount++;

        // Allow the contract itself to operate on all updated encrypted differences
        TFHE.allowThis(runningDifferenceMOS);
        TFHE.allowThis(runningDifferenceQosType);
        TFHE.allowThis(runningDifferenceQodModel);
        TFHE.allowThis(runningDifferenceQodOSVersion);
        TFHE.allowThis(runningDifferenceQosOperator);
    }

    /**
     * @notice Gets the number of times subtractData has been called.
     */
    function getEntryCount() public view returns (uint256) {
        return entryCount;
    }

    // --- Getter functions for running differences (return encrypted handles) ---
    function getRunningDifferenceMOS() public view returns (euint32) { return runningDifferenceMOS; }
    function getRunningDifferenceQosType() public view returns (euint32) { return runningDifferenceQosType; }
    function getRunningDifferenceQodModel() public view returns (euint32) { return runningDifferenceQodModel; }
    function getRunningDifferenceQodOSVersion() public view returns (euint32) { return runningDifferenceQodOSVersion; }
    function getRunningDifferenceQosOperator() public view returns (euint32) { return runningDifferenceQosOperator; }

    // --- Functions to subtract external *already encrypted* values from totals ---
    // These are updated to use TFHE.sub and renamed for clarity.

    function subtractFromDifferenceMOS(einput valueInput, bytes calldata inputProof) public {
        euint32 value = TFHE.asEuint32(valueInput, inputProof);
        runningDifferenceMOS = TFHE.sub(runningDifferenceMOS, value);
        TFHE.allowThis(runningDifferenceMOS);
    }

    function subtractFromDifferenceQosType(einput valueInput, bytes calldata inputProof) public {
        euint32 value = TFHE.asEuint32(valueInput, inputProof);
        runningDifferenceQosType = TFHE.sub(runningDifferenceQosType, value);
        TFHE.allowThis(runningDifferenceQosType);
    }

    function subtractFromDifferenceQodModel(einput valueInput, bytes calldata inputProof) public {
        euint32 value = TFHE.asEuint32(valueInput, inputProof);
        runningDifferenceQodModel = TFHE.sub(runningDifferenceQodModel, value);
        TFHE.allowThis(runningDifferenceQodModel);
    }

    function subtractFromDifferenceQodOSVersion(einput valueInput, bytes calldata inputProof) public {
        euint32 value = TFHE.asEuint32(valueInput, inputProof);
        runningDifferenceQodOSVersion = TFHE.sub(runningDifferenceQodOSVersion, value);
        TFHE.allowThis(runningDifferenceQodOSVersion);
    }

    function subtractFromDifferenceQosOperator(einput valueInput, bytes calldata inputProof) public {
        euint32 value = TFHE.asEuint32(valueInput, inputProof);
        runningDifferenceQosOperator = TFHE.sub(runningDifferenceQosOperator, value);
        TFHE.allowThis(runningDifferenceQosOperator);
    }
}