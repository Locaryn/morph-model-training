//! Stdio MCP server shipped by morph-model-training.
use locaryn_plugin_model_training::{
    apply_lora, quantize_model, LoraApplyRequest, QuantizeRequest,
};
use serde_json::{json, Value};
use std::io::Write;
use tokio::io::{AsyncBufReadExt, BufReader};

const VERSION: &str = "1.1.0";

#[tokio::main]
async fn main() {
    let mut lines = BufReader::new(tokio::io::stdin()).lines();
    while let Ok(Some(line)) = lines.next_line().await {
        if line.trim().is_empty() {
            continue;
        }
        let response = match serde_json::from_str::<Value>(&line) {
            Ok(request) => handle_request(request).await,
            Err(error) => error_response(Value::Null, -32700, format!("JSON invalide : {error}")),
        };
        if let Ok(serialized) = serde_json::to_string(&response) {
            println!("{serialized}");
            let _ = std::io::stdout().flush();
        }
    }
}

async fn handle_request(request: Value) -> Value {
    let id = request.get("id").cloned().unwrap_or(Value::Null);
    let method = request
        .get("method")
        .and_then(Value::as_str)
        .unwrap_or_default();
    match method {
        "initialize" => success(
            id,
            json!({
                "protocolVersion": "2025-06-18",
                "capabilities": { "tools": {} },
                "serverInfo": { "name": "morph-model-training", "version": VERSION }
            }),
        ),
        "tools/list" => success(id, tools_list()),
        "tools/call" => {
            let params = request.get("params").cloned().unwrap_or_else(|| json!({}));
            let name = params
                .get("name")
                .and_then(Value::as_str)
                .unwrap_or_default();
            let args = params
                .get("arguments")
                .cloned()
                .unwrap_or_else(|| json!({}));
            match call_tool(name, args).await {
                Ok(value) => success(id, text_content(value)),
                Err(error) => error_response(id, -32000, error),
            }
        }
        notification if notification.starts_with("notifications/") => Value::Null,
        _ => error_response(id, -32601, format!("méthode MCP inconnue : {method}")),
    }
}

fn tools_list() -> Value {
    json!({
        "tools": [
            {
                "name": "apply_lora",
                "description": "Applique un adaptateur LoRA sur un modèle de base.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "base_model_path": { "type": "string", "description": "Chemin du modèle de base" },
                        "lora_adapter_path": { "type": "string", "description": "Chemin de l'adaptateur LoRA" },
                        "scale": { "type": "number", "description": "Poids de l'adaptateur (0.0 à 2.0, défaut: 1.0)" }
                    },
                    "required": ["base_model_path", "lora_adapter_path"]
                }
            },
            {
                "name": "quantize_model",
                "description": "Quantifie un modèle FP16/FP32 vers un format compact GGUF (Q4_K_M, Q8_0).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "model_path": { "type": "string", "description": "Chemin du modèle source" },
                        "quant_type": { "type": "string", "enum": ["q4_k_m", "q8_0", "q5_k_m"], "description": "Format de quantification cible" }
                    },
                    "required": ["model_path", "quant_type"]
                }
            }
        ]
    })
}

async fn call_tool(name: &str, args: Value) -> Result<Value, String> {
    match name {
        "apply_lora" => {
            let req: LoraApplyRequest =
                serde_json::from_value(args).map_err(|e| format!("Paramètres invalides: {e}"))?;
            let res = apply_lora(req).await?;
            Ok(json!(res))
        }
        "quantize_model" => {
            let req: QuantizeRequest =
                serde_json::from_value(args).map_err(|e| format!("Paramètres invalides: {e}"))?;
            let res = quantize_model(req).await?;
            Ok(json!(res))
        }
        _ => Err(format!("Outil entraînement inconnu : {name}")),
    }
}

fn text_content(value: Value) -> Value {
    json!({ "content": [{ "type": "text", "text": serde_json::to_string(&value).unwrap_or_else(|_| "{}".into()) }] })
}
fn success(id: Value, result: Value) -> Value {
    json!({ "jsonrpc": "2.0", "id": id, "result": result })
}
fn error_response(id: Value, code: i64, message: String) -> Value {
    json!({ "jsonrpc": "2.0", "id": id, "error": { "code": code, "message": message } })
}
