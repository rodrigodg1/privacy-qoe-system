from web3 import Web3
import json

# Initialize a Web3 instance (replace with your RPC node URL)
w3 = Web3(Web3.HTTPProvider('https://devnet.zama.ai'))

# Check if the connection is successful
if not w3.is_connected():
    raise Exception('Failed to connect to the blockchain.')

# MetaMask private key (with 0x prefix)
private_key = '0x7afdf33a1523bf6fb353261ab6d51884d0d1b2aa2c9c7e67bbd4f7fe0adae361'

# Validate the private key
if len(private_key) != 66 or not private_key.startswith('0x') or not all(c in '0123456789abcdefABCDEF' for c in private_key[2:]):
    raise ValueError('Invalid Private Key: Ensure it is 64 hex characters with 0x prefix.')

# Derive the account from the private key
account = w3.eth.account.from_key(private_key)
print(f'Deploying from account: {account.address}')

# Load the contract's ABI and bytecode (Adjust the path to your JSON file)
with open('./artifacts/examples/Rand.sol/Rand.json', 'r') as file:
    contract_json = json.load(file)
    abi = contract_json['abi']
    bytecode = contract_json['bytecode']

# Set up the contract object
Contract = w3.eth.contract(abi=abi, bytecode=bytecode)

# Estimate gas required for deployment
gas_estimate = Contract.constructor().estimate_gas()
print(f'Estimated Gas: {gas_estimate}')

# Get the latest transaction nonce for the account
nonce = w3.eth.get_transaction_count(account.address)

# Build the transaction
transaction = Contract.constructor().build_transaction({
    'chainId': w3.eth.chain_id,
    'gas': gas_estimate,
    'gasPrice': w3.to_wei('20', 'gwei'),
    'nonce': nonce,
})

# Sign the transaction with the private key
signed_txn = w3.eth.account.sign_transaction(transaction, private_key=private_key)

# Send the transaction to the blockchain
txn_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)

# Wait for the transaction receipt
txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
print(f'Contract deployed at address: {txn_receipt.contractAddress}')
