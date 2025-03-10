// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";

contract teste {
    euint8 public amount;


   constructor() {
        amount = TFHE.asEuint8(0); // Initialize to encrypted zero
    }


    function myExample(
        einput encryptedAmount,
        bytes calldata inputProof
    ) public {
        // Decrypt the encrypted input into an euint8 value.
        euint8 value = TFHE.asEuint8(encryptedAmount, inputProof);
        // Add the value to the current encrypted balance.
        amount = TFHE.add(amount, value);
        // Update allowed decryption; assign the returned encrypted value.
        TFHE.allow(amount, address(this));
    }

    // Function to retrieve the encrypted balance.
    function getEncryptedBalance() public view returns (euint8) {
        return amount;
    }
}
