use csv::ReaderBuilder;
use csv::Writer;
use std::fs::File;
use std::time::Instant;
use tfhe::prelude::*;
use tfhe::{generate_keys, set_server_key, ConfigBuilder, FheUint8};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Basic configuration to use homomorphic integers
    let config = ConfigBuilder::default().build();

    // Key generation
    let (client_key, server_keys) = generate_keys(config);

    // Open the input CSV file
    let file = File::open("pokemon_encoded.csv")?;
    let mut rdr = ReaderBuilder::new().has_headers(false).from_reader(file);

    // Vector to store the rows
    let mut results = Vec::new();

    // Read the CSV file into memory
    for result in rdr.records() {
        let record = result?;
        results.push(record);
    }

    println!("Finished reading CSV file. Total rows: {}", results.len());

    // Set the server key for homomorphic operations
    set_server_key(server_keys);

    // Create a CSV writer for encryption times
    let mut wtr = Writer::from_path("encryption_times.csv")?;
    // Write header for the encryption times CSV file
    wtr.write_record(&["row", "encryption_time_ms"])?;

    // Process each row
    for (i, row) in results.iter().enumerate() {
        println!("Processing row {}", i + 1);

        // Extract each column and convert to u8
        let columns: Vec<u8> = row
            .iter()
            .map(|s| s.parse().unwrap_or(0)) // Convert to u8, default to 0 if parsing fails
            .collect();

        // Print the parsed values for debugging
        println!("Parsed values: {:?}", columns);

        // Ensure there are at least 5 columns in the row
        if columns.len() < 5 {
            eprintln!("Row {} has fewer than 5 columns. Skipping this row.", i + 1);
            continue;
        }

        // Assign values to variables
        let qos_type = columns[0];
        let qod_model = columns[1];
        let qod_os_version = columns[2];
        let qos_operator = columns[3];
        let mos = columns[4];

        println!(
            "QoS Type: {}, QoD Model: {}, QoD OS Version: {}, QoS Operator: {}, MOS: {}",
            qos_type, qod_model, qod_os_version, qos_operator, mos
        );

        // Start timing the encryption process
        let start_time = Instant::now();

        // Encrypt the fields using the client key
        let _encrypted_qos_type = FheUint8::try_encrypt(qos_type, &client_key)?;
        let _encrypted_qod_model = FheUint8::try_encrypt(qod_model, &client_key)?;
        let _encrypted_qod_os_version = FheUint8::try_encrypt(qod_os_version, &client_key)?;
        let _encrypted_qos_operator = FheUint8::try_encrypt(qos_operator, &client_key)?;
        let _encrypted_mos = FheUint8::try_encrypt(mos, &client_key)?;

        // Calculate encryption time in milliseconds
        let encryption_time = start_time.elapsed().as_millis();

        println!("Row {} processed successfully.", i + 1);
        println!("Encryption Time All Items: {} ms", encryption_time);

        // Write the encryption time for this row into the CSV file
        wtr.write_record(&[(i + 1).to_string(), encryption_time.to_string()])?;
    }

    // Flush the writer to ensure all data is written
    wtr.flush()?;

    println!("All rows processed. Encryption times saved to encryption_times.csv.");
    Ok(())
}
