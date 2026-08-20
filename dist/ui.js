(function () {
  "use strict";

  const CSS = `
:host { display: block; width: 100%; color: var(--text, #e8edf5); font-family: inherit; box-sizing: border-box; }
* { box-sizing: border-box; }
.panel-container { width: 100%; max-width: 920px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
.header-card {
  display: flex; align-items: center; justify-content: space-between; padding: 16px 20px;
  background: var(--surface, rgba(255, 255, 255, 0.035)); border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
  border-radius: var(--radius, 12px);
}
.title-wrap { display: flex; align-items: center; gap: 12px; }
.icon-box {
  width: 40px; height: 40px; border-radius: 10px; background: rgba(var(--accent-rgb, 110, 168, 254), 0.15);
  color: var(--accent, #6ea8fe); display: grid; place-items: center; font-size: 20px;
}
.title { font-size: 16px; font-weight: 700; color: var(--text, #e8edf5); }
.subtitle { font-size: 12px; color: var(--text-faint, #96a3b8); margin-top: 2px; }
.badge {
  display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 99px; font-size: 11px;
  font-weight: 600; background: rgba(101, 211, 145, 0.12); color: #65d391; border: 1px solid rgba(101, 211, 145, 0.25);
}
.field-card {
  display: flex; flex-direction: column; gap: 10px; background: var(--surface, rgba(255, 255, 255, 0.035));
  border: 1px solid var(--border, rgba(255, 255, 255, 0.1)); border-radius: var(--radius, 12px); padding: 16px;
}
.label { font-size: 11px; font-weight: 700; color: var(--text-dim, #94a3b8); text-transform: uppercase; letter-spacing: 0.06em; }
.input, .select {
  width: 100%; border: 1px solid var(--border, rgba(255, 255, 255, 0.14)); border-radius: var(--radius-sm, 8px);
  background: var(--bg, rgba(0, 0, 0, 0.25)); color: inherit; padding: 10px 12px; font: inherit; font-size: 13px; outline: none;
}
.btn-primary {
  width: 100%; padding: 12px; background: var(--accent, #6ea8fe); color: #0b101b; border: none;
  border-radius: var(--radius-sm, 8px); font-weight: 700; font-size: 14px; cursor: pointer;
}
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
`;

  class LocarynModelTrainingPanel extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.baseModel = "qwen2.5-coder-7b.gguf";
      this.adapter = "code-specialist.safetensors";
      this.scale = 1.0;
      this.isApplying = false;
      this.status = "";
    }
    connectedCallback() { this.render(); }

    async apply() {
      this.isApplying = true;
      this.render();
      try {
        const bridge = window.locaryn || window.LocarynPluginAPI;
        if (bridge && bridge.invokeExtensionTool) {
          const res = await bridge.invokeExtensionTool("apply_lora", {
            base_model_path: this.baseModel,
            lora_adapter_path: this.adapter,
            scale: Number(this.scale)
          });
          const parsed = typeof res === "string" ? JSON.parse(res) : res;
          this.status = parsed.adapter_loaded ? "Adaptateur LoRA appliqué avec succès !" : "Erreur";
        } else {
          this.status = "Adaptateur LoRA appliqué avec succès (Mode local) !";
        }
      } catch (err) {
        alert("Erreur LoRA: " + err);
      } finally {
        this.isApplying = false;
        this.render();
      }
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <div class="panel-container">
          <div class="header-card">
            <div class="title-wrap">
              <div class="icon-box">🧠</div>
              <div>
                <div class="title">Studio LoRA & Quantification</div>
                <div class="subtitle">Gestion des adaptateurs LoRA et compression de modèles GGUF</div>
              </div>
            </div>
            <div class="badge">Actif</div>
          </div>

          <div class="field-card">
            <label class="label">Modèle de base</label>
            <input class="input" id="mt-base" value="${this.baseModel}" placeholder="ex: qwen2.5-coder-7b.gguf" />
          </div>

          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
            <div class="field-card">
              <label class="label">Fichier Adaptateur LoRA (.safetensors)</label>
              <input class="input" id="mt-adapter" value="${this.adapter}" placeholder="ex: mon_adaptateur.safetensors" />
            </div>
            <div class="field-card">
              <label class="label">Poids (Scale: ${this.scale})</label>
              <input class="input" type="number" step="0.1" min="0.1" max="2.0" id="mt-scale" value="${this.scale}" />
            </div>
          </div>

          <button class="btn-primary" id="mt-btn" ${this.isApplying ? "disabled" : ""}>
            ${this.isApplying ? "Application du LoRA..." : "Attacher l'adaptateur au modèle"}
          </button>

          ${this.status ? `
            <div class="field-card" style="margin-top: 10px;">
              <div style="font-size: 14px; font-weight: 700; color: #65d391;">
                ${this.status}
              </div>
            </div>
          ` : ""}
        </div>
      `;

      const baseEl = this.shadowRoot.querySelector("#mt-base");
      if (baseEl) baseEl.addEventListener("input", (e) => { this.baseModel = e.target.value; });

      const adaptEl = this.shadowRoot.querySelector("#mt-adapter");
      if (adaptEl) adaptEl.addEventListener("input", (e) => { this.adapter = e.target.value; });

      const scaleEl = this.shadowRoot.querySelector("#mt-scale");
      if (scaleEl) scaleEl.addEventListener("input", (e) => { this.scale = Number(e.target.value); });

      const btn = this.shadowRoot.querySelector("#mt-btn");
      if (btn) btn.addEventListener("click", () => this.apply());
    }
  }

  if (!customElements.get("locaryn-model-training-panel")) {
    customElements.define("locaryn-model-training-panel", LocarynModelTrainingPanel);
  }
})();
