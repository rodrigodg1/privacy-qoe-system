# Decentralized QoE Privacy Architecture 

## Overview
This system combines Quality of Experience (QoE) measurements with privacy-preserving blockchain technology using homomorphic encryption via fhEVM (Fully Homomorphic Encryption Virtual Machine).

## Dataset
The experiments use the PoQeMoN dataset located in the `poqemon` directory. This dataset contains:
- QoE Influence Factors (QoE IFs)
- Subjective Mean Opinion Scores (MOS) ranging from 1-5
- User demographic data
- Network conditions and device information

## Privacy Implementation
The system uses fhEVM for privacy-preserving computations:

### Key Components
- **Encryption**: MOS values are encrypted using homomorphic encryption as shown in `encryption.js`
- **Smart Contract Integration**: Private data is processed using fhEVM's confidential smart contracts
- **End-to-end Encryption**: All QoE data remains encrypted while stored on-chain

### Features
Based on fhEVM's capabilities:
- Full end-to-end encryption of QoE metrics
- Homomorphic computations on encrypted MOS values
- Data remains confidential while allowing statistical analysis
- No decryption needed for data processing
- Compatible with EVM-based blockchains

## Experiment Results
Encryption performance metrics are collected including:
- Encryption time per MOS value
- Size of encrypted data
- Processing overhead for homomorphic operations

Results are saved in CSV format for analysis.

## Resources
- [fhEVM Documentation](https://docs.zama.ai/fhevm)
- [PoQeMoN QoE Dataset Repository](https://github.com/Lamyne/Poqemon-QoE-Dataset)

