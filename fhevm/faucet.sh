#!/bin/bash


cd /home/garcia/fhevm-hardhat-template

for i in {1..500}
do
   pnpm fhevm:faucet:alice
   
done
