// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../lib/TFHE.sol";  // Adjust the import path according to your setup

contract BoolReceiver {

    // State variable to store the encrypted boolean
    ebool public encryptedBool;

    // Function to receive the encrypted boolean value
    function receiveEncryptedBool(einput valueInput, bytes calldata inputProof) public {
        // Convert the encrypted input into an ebool type using the TFHE library
        ebool value = TFHE.asEbool(valueInput, inputProof);
        
        // Store the encrypted boolean in the contract's state
        encryptedBool = value;

        // Optionally, allow the smart contract to use the stored encrypted boolean
        TFHE.allow(encryptedBool, address(this));
    }
}
