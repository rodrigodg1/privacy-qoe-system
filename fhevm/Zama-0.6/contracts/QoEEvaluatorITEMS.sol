// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "../lib/TFHE.sol";

contract QoEEvaluatorITEMS {
    struct QoEData {
        euint8 qosType;
        euint8 qodModel;
        euint8 qodOSVersion;
        euint8 qosOperator;
        euint8 mos;
    }

    struct EncryptedInput {
        einput value;
        bytes proof;
    }

    QoEData[] private dataEntries;
    euint32 private totalMOS;
    euint32 private totalQosType;
    euint32 private totalQodModel;
    euint32 private totalQodOSVersion;
    euint32 private totalQosOperator;

    function addData(
        EncryptedInput memory qosType,
        EncryptedInput memory qodModel,
        EncryptedInput memory qodOSVersion,
        EncryptedInput memory qosOperator,
        EncryptedInput memory mos
    ) public {
        euint8 qosTypeValue = TFHE.asEuint8(qosType.value, qosType.proof);
        euint8 qodModelValue = TFHE.asEuint8(qodModel.value, qodModel.proof);
        euint8 qodOSVersionValue = TFHE.asEuint8(qodOSVersion.value, qodOSVersion.proof);
        euint8 qosOperatorValue = TFHE.asEuint8(qosOperator.value, qosOperator.proof);
        euint8 mosValue = TFHE.asEuint8(mos.value, mos.proof);
        
        dataEntries.push(QoEData({
            qosType: qosTypeValue,
            qodModel: qodModelValue,
            qodOSVersion: qodOSVersionValue,
            qosOperator: qosOperatorValue,
            mos: mosValue
        }));

        // Update all totals
        totalMOS = TFHE.add(totalMOS, TFHE.asEuint32(mosValue));
        totalQosType = TFHE.add(totalQosType, TFHE.asEuint32(qosTypeValue));
        totalQodModel = TFHE.add(totalQodModel, TFHE.asEuint32(qodModelValue));
        totalQodOSVersion = TFHE.add(totalQodOSVersion, TFHE.asEuint32(qodOSVersionValue));
        totalQosOperator = TFHE.add(totalQosOperator, TFHE.asEuint32(qosOperatorValue));
        
        // Allow the contract to operate on all encrypted totals
        TFHE.allow(totalMOS, address(this));
        TFHE.allow(totalQosType, address(this));
        TFHE.allow(totalQodModel, address(this));
        TFHE.allow(totalQodOSVersion, address(this));
        TFHE.allow(totalQosOperator, address(this));
    }

    function getDataCount() public view returns (uint256) {
        return dataEntries.length;
    }

    function getData(uint256 index) public view returns (QoEData memory) {
        require(index < dataEntries.length, "Index out of bounds");
        return dataEntries[index];
    }

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

    // Functions to add external values to totals
    function addToTotalMOS(einput valueInput, bytes calldata inputProof) public {
        euint32 value = TFHE.asEuint32(valueInput, inputProof);
        totalMOS = TFHE.add(totalMOS, value);
        TFHE.allow(totalMOS, address(this));
    }

    function addToTotalQosType(einput valueInput, bytes calldata inputProof) public {
        euint32 value = TFHE.asEuint32(valueInput, inputProof);
        totalQosType = TFHE.add(totalQosType, value);
        TFHE.allow(totalQosType, address(this));
    }

    function addToTotalQodModel(einput valueInput, bytes calldata inputProof) public {
        euint32 value = TFHE.asEuint32(valueInput, inputProof);
        totalQodModel = TFHE.add(totalQodModel, value);
        TFHE.allow(totalQodModel, address(this));
    }

    function addToTotalQodOSVersion(einput valueInput, bytes calldata inputProof) public {
        euint32 value = TFHE.asEuint32(valueInput, inputProof);
        totalQodOSVersion = TFHE.add(totalQodOSVersion, value);
        TFHE.allow(totalQodOSVersion, address(this));
    }

    function addToTotalQosOperator(einput valueInput, bytes calldata inputProof) public {
        euint32 value = TFHE.asEuint32(valueInput, inputProof);
        totalQosOperator = TFHE.add(totalQosOperator, value);
        TFHE.allow(totalQosOperator, address(this));
    }
}