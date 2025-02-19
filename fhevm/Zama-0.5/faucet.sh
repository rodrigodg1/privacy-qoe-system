#!/bin/bash

# Define the command to be run in each terminal
CMD="cd /home/garcia/fhevm-hardhat-template && for i in {1..50}; do pnpm fhevm:faucet:alice; done"

# Open 5 separate terminals, each running the command
for n in {1..5}; do
    gnome-terminal -- bash -c "$CMD; exec bash"
done
