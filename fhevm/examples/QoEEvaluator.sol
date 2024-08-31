// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "../lib/TFHE.sol";

contract QoEEvaluator {
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
    euint32 private totalMOS; // New variable to store the sum of MOS values

    function addData(
        EncryptedInput memory qosType,
        EncryptedInput memory qodModel,
        EncryptedInput memory qodOSVersion,
        EncryptedInput memory qosOperator,
        EncryptedInput memory mos
    ) public {
        euint8 mosValue = TFHE.asEuint8(mos.value, mos.proof);
        
        dataEntries.push(QoEData({
            qosType: TFHE.asEuint8(qosType.value, qosType.proof),
            qodModel: TFHE.asEuint8(qodModel.value, qodModel.proof),
            qodOSVersion: TFHE.asEuint8(qodOSVersion.value, qodOSVersion.proof),
            qosOperator: TFHE.asEuint8(qosOperator.value, qosOperator.proof),
            mos: mosValue
        }));

        // Update the total MOS
        //totalMOS = TFHE.add(totalMOS, TFHE.asEuint32(mosValue));
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
}