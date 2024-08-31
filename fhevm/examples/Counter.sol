// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "../lib/TFHE.sol";  // Ensure this is the correct path to your TFHE library

contract Counter {
    euint8 public counter;

    // This function adds an encrypted value to the current counter
    function add(einput valueInput, bytes calldata inputProof) public {
        // Convert the encrypted input into an euint32 type using the TFHE library
        euint8 value = TFHE.asEuint8(valueInput, inputProof);
        
        // Add the encrypted value to the current counter
        counter = TFHE.add(counter, value);
        
        // Allow the smart contract to operate on the encrypted counter value
        TFHE.allow(counter, address(this));
    }

    // Optional: Function to get the current encrypted counter (for debugging/verification)
    function getCounter() public view returns (euint8) {
        return counter;
    }
}
