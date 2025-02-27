// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";


contract teste {
   euint8 amount;

  function myExample(
    einput encryptedAmount,
    bytes calldata inputProof
  ) public {
    // Validate and convert the encrypted inputs
    amount = TFHE.asEuint8(encryptedAmount, inputProof);
  }

  // Function to retrieve a user's encrypted balance
  function getEncryptedBalance() public view returns (euint8) {
    return amount;
  }
}