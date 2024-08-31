#!/bin/bash

for i in {1..100}
do
   docker exec -i fhevm faucet 0x3b31fC0b4B81184078AFB1835810A6C732Fcd9E1
   sleep 3
done
