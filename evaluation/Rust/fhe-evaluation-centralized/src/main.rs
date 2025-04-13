use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tfhe::{generate_keys, set_server_key, ConfigBuilder, FheUint8};
use tfhe::prelude::*;
use tokio::task;

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

#[derive(Clone)]
struct AppState {
    client_key: Arc<tfhe::ClientKey>,
    server_keys: Arc<tfhe::ServerKey>,
}

async fn compute(
    req: web::Json<ComputeRequest>,
    data: web::Data<AppState>,
) -> impl Responder {
    let client_key = data.client_key.clone();
    let server_keys = data.server_keys.clone();
    let request_data = req.into_inner();

    let result = task::spawn_blocking(move || {
        set_server_key(server_keys.as_ref().clone());

        let encrypted_operand1 = FheUint8::try_encrypt(request_data.operand1, client_key.as_ref())
            .map_err(|_| "Encryption failed")?;
        let encrypted_operand2 = FheUint8::try_encrypt(request_data.operand2, client_key.as_ref())
            .map_err(|_| "Encryption failed")?;

        let encrypted_result = match request_data.op.as_str() {
            "add" => &encrypted_operand1 + &encrypted_operand2,
            "sub" => &encrypted_operand1 - &encrypted_operand2,
            "mul" => &encrypted_operand1 * &encrypted_operand2,
            "bitAnd" => &encrypted_operand1 & &encrypted_operand2,
            _ => return Err("Unsupported operation"),
        };

        Ok(encrypted_result.decrypt(client_key.as_ref()))
    })
    .await;

    match result {
        Ok(Ok(value)) => HttpResponse::Ok().json(ComputeResponse { result: value }),
        Ok(Err(msg)) => HttpResponse::BadRequest().body(msg),
        Err(_) => HttpResponse::InternalServerError().body("Internal server error"),
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let config = ConfigBuilder::default().build();
    let (client_key, server_keys) = generate_keys(config);
    set_server_key(server_keys.clone());

    let client_key = Arc::new(client_key);
    let server_keys = Arc::new(server_keys);

    let app_state = web::Data::new(AppState {
        client_key,
        server_keys,
    });

    HttpServer::new(move || {
        App::new()
            .app_data(app_state.clone())
            .route("/compute", web::post().to(compute))
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
