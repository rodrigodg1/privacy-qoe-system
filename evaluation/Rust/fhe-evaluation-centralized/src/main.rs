use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tfhe::prelude::*;
use tfhe::{generate_keys, set_server_key, ConfigBuilder, FheUint8};

/// Application state holding both the client key and the server keys.
#[derive(Clone)]
struct AppState {
    client_key: Arc<tfhe::ClientKey>,  // Adjust if your TFHE library uses a different type.
    server_keys: Arc<tfhe::ServerKey>,  // Adjust the type as needed.
}

#[derive(Deserialize)]
struct ComputeRequest {
    op: String,
    operand1: u8,
    operand2: u8,
}

#[derive(Serialize)]
struct ComputeResponse {
    result: u8,
}

/// Handler for the /compute endpoint.
/// It ensures that the current thread's global state is initialized by setting the server key,
/// encrypts the operands, performs the requested operation on the encrypted data,
/// decrypts the result, and returns it as JSON.
async fn compute(
    req: web::Json<ComputeRequest>,
    data: web::Data<AppState>,
) -> impl Responder {
    // Set the server key in the current thread.
    set_server_key(data.server_keys.as_ref().clone());

    let client_key = &data.client_key;

    // Encrypt the operands.
    let encrypted_operand1 = match FheUint8::try_encrypt(req.operand1, client_key.as_ref()) {
        Ok(enc) => enc,
        Err(_) => return HttpResponse::InternalServerError().body("Encryption failed"),
    };

    let encrypted_operand2 = match FheUint8::try_encrypt(req.operand2, client_key.as_ref()) {
        Ok(enc) => enc,
        Err(_) => return HttpResponse::InternalServerError().body("Encryption failed"),
    };

    // Perform the requested operation on the encrypted values.
    let encrypted_result = match req.op.as_str() {
        "add" => &encrypted_operand1 + &encrypted_operand2,
        "sub" => &encrypted_operand1 - &encrypted_operand2,
        "mul" => &encrypted_operand1 * &encrypted_operand2,
        "bitAnd" => &encrypted_operand1 & &encrypted_operand2,
        _ => return HttpResponse::BadRequest().body("Unsupported operation"),
    };

    // Decrypt the result.
    let result: u8 = encrypted_result.decrypt(client_key.as_ref());

    HttpResponse::Ok().json(ComputeResponse { result })
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Basic configuration for homomorphic integers.
    let config = ConfigBuilder::default().build();

    // Key generation.
    let (client_key, server_keys) = generate_keys(config);
    // Set the server key in the main thread.
    set_server_key(server_keys.clone());
    let client_key = Arc::new(client_key);
    let server_keys = Arc::new(server_keys);

    // Create shared application state.
    let app_state = web::Data::new(AppState {
        client_key: client_key.clone(),
        server_keys: server_keys.clone(),
    });

    // Launch the web server with the /compute endpoint.
    HttpServer::new(move || {
        App::new()
            .app_data(app_state.clone())
            .route("/compute", web::post().to(compute))
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
