## Start Local FHEVM Node

Run the following commands to start the node and access its endpoints:

```bash
docker run -i -p 8545:8545 -p 8546:8546 --rm --name fhevm ghcr.io/zama-ai/ethermint-dev-node:v0.4.2
```

**JSON-RPC**  
[http://127.0.0.1:8545](http://127.0.0.1:8545)

**Websocket**  
[http://127.0.0.1:8546](http://127.0.0.1:8546)

To request tokens from the faucet:

```bash
docker exec -i fhevm faucet 0xa5e1defb98EFe38EBb2D958CEe052410247F4c80
```fauce