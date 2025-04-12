// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";
import { SepoliaZamaFHEVMConfig } from "fhevm/config/ZamaFHEVMConfig.sol";

contract add_QoEEvaluatorITEMS is SepoliaZamaFHEVMConfig {
    struct QoEData {
        euint8 qosType;
        euint8 qodModel;
        euint8 qodOSVersion;
        euint8 qosOperator;
        euint8 mos;
    }

    // EncryptedInput struct is no longer needed for addData
    // struct EncryptedInput {
    //     einput value;
    //     bytes proof;
    // }

    QoEData[] private dataEntries;
    euint32 private totalMOS;
    euint32 private totalQosType;
    euint32 private totalQodModel;
    euint32 private totalQodOSVersion;
    euint32 private totalQosOperator;

    /**
     * @notice Adds new QoE data entry. Accepts plaintext uint8 values and encrypts them internally.
     * @param _qosType Plaintext QoS type (uint8).
     * @param _qodModel Plaintext QoD model (uint8).
     * @param _qodOSVersion Plaintext QoD OS version (uint8).
     * @param _qosOperator Plaintext QoS operator (uint8).
     * @param _mos Plaintext MOS value (uint8).
     */
    function addData(
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

        // Store the encrypted data
        dataEntries.push(QoEData({
            qosType: qosTypeValueEncrypted,
            qodModel: qodModelValueEncrypted,
            qodOSVersion: qodOSVersionValueEncrypted,
            qosOperator: qosOperatorValueEncrypted,
            mos: mosValueEncrypted
        }));

        // Update all totals using the encrypted values (casting euint8 to euint32)
        totalMOS = TFHE.add(totalMOS, TFHE.asEuint32(mosValueEncrypted));
        totalQosType = TFHE.add(totalQosType, TFHE.asEuint32(qosTypeValueEncrypted));
        totalQodModel = TFHE.add(totalQodModel, TFHE.asEuint32(qodModelValueEncrypted));
        totalQodOSVersion = TFHE.add(totalQodOSVersion, TFHE.asEuint32(qodOSVersionValueEncrypted));
        totalQosOperator = TFHE.add(totalQosOperator, TFHE.asEuint32(qosOperatorValueEncrypted));

        // Allow the contract itself to operate on all updated encrypted totals
        // Using TFHE.allowThis is a shorthand for TFHE.allow(value, address(this))
        TFHE.allowThis(totalMOS);
        TFHE.allowThis(totalQosType);
        TFHE.allowThis(totalQodModel);
        TFHE.allowThis(totalQodOSVersion);
        TFHE.allowThis(totalQosOperator);
    }

    function getDataCount() public view returns (uint256) {
        return dataEntries.length;
    }

    // Returns the struct containing encrypted handles
    function getData(uint256 index) public view returns (QoEData memory) {
        require(index < dataEntries.length, "Index out of bounds");
        return dataEntries[index];
    }

    // --- Getter functions for totals (return encrypted handles) ---
    function getTotalMOS() public view returns (euint32) {
        return totalMOS;
    }

    function getTotalQosType() public view returns (euint32) {
        return totalQosType;
    }

    function getTotalQodModel() public view returns (euint32) {
        return totalQodModel;
    }

    function getTotalQodOSVersion() public view returns (euint32) {
        return totalQodOSVersion;
    }

    function getTotalQosOperator() public view returns (euint32) {
        return totalQosOperator;
    }

    // --- Functions to add external *already encrypted* values to totals ---
    // These remain unchanged as they serve a different purpose: adding values
    // that were encrypted off-chain and sent with a proof.

    function addToTotalMOS(einput valueInput, bytes calldata inputProof) public {
        euint32 value = TFHE.asEuint32(valueInput, inputProof);
        totalMOS = TFHE.add(totalMOS, value);
        TFHE.allowThis(totalMOS); // Use allowThis for consistency
    }

    function addToTotalQosType(einput valueInput, bytes calldata inputProof) public {
        euint32 value = TFHE.asEuint32(valueInput, inputProof);
        totalQosType = TFHE.add(totalQosType, value);
        TFHE.allowThis(totalQosType); // Use allowThis
    }

    function addToTotalQodModel(einput valueInput, bytes calldata inputProof) public {
        euint32 value = TFHE.asEuint32(valueInput, inputProof);
        totalQodModel = TFHE.add(totalQodModel, value);
        TFHE.allowThis(totalQodModel); // Use allowThis
    }

    function addToTotalQodOSVersion(einput valueInput, bytes calldata inputProof) public {
        euint32 value = TFHE.asEuint32(valueInput, inputProof);
        totalQodOSVersion = TFHE.add(totalQodOSVersion, value);
        TFHE.allowThis(totalQodOSVersion); // Use allowThis
    }

    function addToTotalQosOperator(einput valueInput, bytes calldata inputProof) public {
        euint32 value = TFHE.asEuint32(valueInput, inputProof);
        totalQosOperator = TFHE.add(totalQosOperator, value);
        TFHE.allowThis(totalQosOperator); // Use allowThis
    }
}