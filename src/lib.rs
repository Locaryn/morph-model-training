//! Locaryn Model Training Plugin
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoraApplyRequest {
    pub base_model_path: String,
    pub lora_adapter_path: String,
    pub scale: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoraApplyResult {
    pub success: bool,
    pub adapter_loaded: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuantizeRequest {
    pub model_path: String,
    pub quant_type: String, // "q4_k_m", "q8_0"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuantizeResult {
    pub output_path: String,
    pub original_size_gb: f32,
    pub quantized_size_gb: f32,
}

/// Non implemente. La signature est conservee pour que l'interface et le
/// serveur MCP gardent leur forme, mais l'appel echoue franchement plutot
/// que de fabriquer un resultat.
pub async fn apply_lora(_req: LoraApplyRequest) -> Result<LoraApplyResult, String> {
    Err("L'application d'un adaptateur LoRA n'est pas implementee : ce morph ne charge aucun poids.".into())
}

/// Non implemente. La signature est conservee pour que l'interface et le
/// serveur MCP gardent leur forme, mais l'appel echoue franchement plutot
/// que de fabriquer un resultat.
pub async fn quantize_model(_req: QuantizeRequest) -> Result<QuantizeResult, String> {
    Err(
        "La quantification n'est pas implementee : ce morph n'embarque aucun quantificateur."
            .into(),
    )
}
