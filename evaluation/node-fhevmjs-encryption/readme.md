# Local Node FHEVMJS Evaluation

This project uses the FHEVMJS@V0.4.0 node library, along with ethers.js, to interact with a blockchain and perform encrypted calculations on CSV data.

## Prerequisites

- Node.js (v12+)
- npm
- A local Ethereum JSON-RPC provider running at `http://localhost:8545` just run `docker-compose up --build` it contains a Tendermint node.
- A CSV file named `pokemon_encoded.csv` in the project root directory

## Installation


```bash
npm install 
```



## Running the Script

1. **Start the Server**  
   Open a terminal and run:
   ```bash
   node server.js
   ```

2. **Benchmark scripto**
    In other terminal:
    ```bash
   node load.js
   ```




The script will:
- Create a FHEVM instance using public key data from the blockchain.
- Read the CSV file (`pokemon_encoded.csv`).
- Process each row by encrypting specific fields.
- Log processing details including encryption time and simulated CPU usage.

## Code Structure

- **src.js**: Contains the main logic for:
    - Initializing the blockchain provider and FHEVM instance.
    - Reading the CSV file and processing each row.
    - Encrypting data fields from CSV rows.
    - Logs processing times and resource usage metrics.

