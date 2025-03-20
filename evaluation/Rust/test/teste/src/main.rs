use std::time::Instant;
use tfhe::prelude::*;
use tfhe::{generate_keys, set_server_key, ConfigBuilder, FheUint32, FheUint8};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Basic configuration to use homomorphic integers.
    let config = ConfigBuilder::default().build();

    // Key generation.
    let (client_key, server_keys) = generate_keys(config);

    let clear_a = 15u8;
    let clear_b = 5u8;

    // Encrypt the input data using the (private) client key.
    // Here we encrypt as FheUint32.
    let mut encrypted_a = FheUint8::try_encrypt(clear_a, &client_key)?;
    let encrypted_b = FheUint8::try_encrypt(clear_b, &client_key)?;

    // On the server side, set the server key.
    set_server_key(server_keys);

    // Measure the time for the homomorphic operation.
    let start_time = Instant::now();
    // Perform homomorphic addition.
    let encrypted_res = &encrypted_a + &encrypted_b;
    let duration = start_time.elapsed();

    println!("Homomorphic computation time: {:?}", duration);

    Ok(())
}
