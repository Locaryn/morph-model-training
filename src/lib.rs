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

pub async fn apply_lora(req: LoraApplyRequest) -> Result<LoraApplyResult, String> {
    Ok(LoraApplyResult {
        success: true,
        adapter_loaded: req.lora_adapter_path,
    })
}

pub async fn quantize_model(req: QuantizeRequest) -> Result<QuantizeResult, String> {
    Ok(QuantizeResult {
        output_path: format!("{}-{}.gguf", req.model_path, req.quant_type),
        original_size_gb: 14.5,
        quantized_size_gb: 4.8,
    })
}
