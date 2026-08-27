/**
 * Le panneau d'entraînement, tel que l'application l'affiche.
 *
 * Light DOM et classes de l'hôte : pas de shadow root, pas de feuille de style
 * à soi. Une extension qui se peint elle-même finit toujours par diverger de
 * l'application — mauvaise police, mauvais rayon, mauvais vert. Ici les
 * classes `locaryn-*` et les jetons `--*` font le travail, et le panneau suit
 * le thème (sombre, clair, accent choisi) sans rien savoir de lui.
 */
(function () {
  "use strict";

  const TAG = "locaryn-model-training-panel";

  /** Le pont de l'hôte, quand il est là. Absent : mode local, rien n'est lancé. */
  function bridge() {
    return window.locaryn || window.LocarynPluginAPI || null;
  }

  class LocarynModelTrainingPanel extends HTMLElement {
    constructor() {
      super();
      this.baseModel = "";
      this.adapter = "";
      this.scale = 1;
      this.applying = false;
      this.status = null;
      this.error = null;
    }

    connectedCallback() {
      this.render();
    }

    async apply() {
      if (this.applying) return;
      this.applying = true;
      this.error = null;
      this.status = null;
      this.render();
      try {
        const api = bridge();
        if (!api || !api.invokeExtensionTool) {
          throw new Error(
            "L'hôte n'expose pas d'outil d'extension : l'adaptateur ne peut pas être appliqué.",
          );
        }
        const raw = await api.invokeExtensionTool("apply_lora", {
          base_model_path: this.baseModel,
          lora_adapter_path: this.adapter,
          scale: Number(this.scale),
        });
        const res = typeof raw === "string" ? JSON.parse(raw) : raw;
        this.status = res && res.adapter_loaded
          ? "Adaptateur attaché au modèle."
          : "Le moteur n'a pas confirmé le chargement de l'adaptateur.";
      } catch (err) {
        // Jamais d'alert() : l'erreur reste dans le panneau, à côté de ce qui
        // l'a produite, et se relit.
        this.error = err && err.message ? err.message : String(err);
      } finally {
        this.applying = false;
        this.render();
      }
    }

    render() {
      const pret = this.baseModel.trim() && this.adapter.trim() && !this.applying;
      this.innerHTML = `
        <div class="locaryn-card">
          <h3>Adaptateur LoRA</h3>
          <p class="locaryn-field-hint">
            Attacher un adaptateur déjà entraîné à un modèle de base. L'entraînement lui-même
            passe par le serveur MCP de cette extension.
          </p>

          <div class="locaryn-field">
            <label class="locaryn-field-label" for="mt-base">Modèle de base</label>
            <input class="locaryn-input" id="mt-base" value="${escape(this.baseModel)}"
                   placeholder="qwen2.5-coder-7b.gguf" />
          </div>

          <div class="locaryn-field">
            <label class="locaryn-field-label" for="mt-adapter">Fichier de l'adaptateur</label>
            <input class="locaryn-input" id="mt-adapter" value="${escape(this.adapter)}"
                   placeholder="mon-adaptateur.safetensors" />
          </div>

          <div class="locaryn-field">
            <label class="locaryn-field-label" for="mt-scale">Poids</label>
            <input class="locaryn-input" id="mt-scale" type="number" step="0.1" min="0.1" max="2"
                   value="${this.scale}" />
            <p class="locaryn-field-hint">1,0 applique l'adaptateur tel qu'il a été entraîné.</p>
          </div>

          <div class="locaryn-field-actions">
            <button type="button" class="locaryn-btn-primary" id="mt-apply" ${pret ? "" : "disabled"}>
              ${this.applying ? "Application…" : "Attacher l'adaptateur"}
            </button>
          </div>

          ${this.status ? `<p class="locaryn-field-hint">${escape(this.status)}</p>` : ""}
          ${this.error ? `<div class="locaryn-vp-error">${escape(this.error)}</div>` : ""}
        </div>
      `;

      const bind = (id, handler) => {
        const el = this.querySelector(id);
        if (el) el.addEventListener("input", handler);
      };
      bind("#mt-base", (e) => {
        this.baseModel = e.target.value;
        this.refreshButton();
      });
      bind("#mt-adapter", (e) => {
        this.adapter = e.target.value;
        this.refreshButton();
      });
      bind("#mt-scale", (e) => {
        this.scale = Number(e.target.value);
      });

      const btn = this.querySelector("#mt-apply");
      if (btn) btn.addEventListener("click", () => this.apply());
    }

    /** Réactiver le bouton sans réécrire le panneau : sinon la saisie perd le curseur. */
    refreshButton() {
      const btn = this.querySelector("#mt-apply");
      if (btn) btn.disabled = !(this.baseModel.trim() && this.adapter.trim()) || this.applying;
    }
  }

  function escape(value) {
    return String(value == null ? "" : value).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  }

  if (!customElements.get(TAG)) {
    customElements.define(TAG, LocarynModelTrainingPanel);
  }
})();
