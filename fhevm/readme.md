
# Instructions




## Local Dev-Node

```bash
docker run -i -p 8545:8545 -p 8546:8546 --rm --name fhevm ghcr.io/zama-ai/ethermint-dev-node:v0.4.2
```

Type | URL
------- | --------
JSON-RPC | http://127.0.0.1:8545
Websocket | http://127.0.0.1:8546

However, we advise developers to use directly `pnpm fhevm:start` or `npm run fhevm:start` commands available within the hardhat template, instead of the previous command, as this will launch a bash script which will also deploy automatically the gateway contract and launch the gateway relayer service, which are needed for asynchronous decryption requests.

**WARNING**: > GatewayCaller.sol must be imported at least once in one of your smart contracts if you wish to use the recommended `fhevm:start` command, or else the bash script will emit an error and decryptions would fail. This is needed because hardhat needs to compile the gateway predeploy contract before your initial deployment. This can be done simply by adding the following import at the top of any of the smart contracts used in your project: `import "fhevm/gateway/GatewayCaller.sol";`

Faucet
If you need to get coins for a specific wallet, you can use the faucet as follow:

```bash
docker exec -i fhevm faucet 0xa5e1defb98EFe38EBb2D958CEe052410247F4c80
```
