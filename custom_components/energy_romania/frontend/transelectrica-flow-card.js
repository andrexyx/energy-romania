class TranselectricaFlowCard extends HTMLElement {
  static getStubConfig() {
    return { title: "Fluxuri transfrontaliere România" };
  }

  setConfig(config) {
    this.config = config || {};
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  getCardSize() { return 6; }

  entity(country, kind) {
    return this.config[`${country}_${kind}`] || `sensor.energy_romania_${country}_${kind}`;
  }

  value(country, kind) {
    const state = this._hass?.states[this.entity(country, kind)];
    const value = Number(state?.state);
    return Number.isFinite(value) ? value : null;
  }

  border(country) {
    const imported = this.value(country, "import");
    const exported = this.value(country, "export");
    const net = this.value(country, "net");
    return { imported, exported, net, direction: net > 0 ? "import" : net < 0 ? "export" : "idle" };
  }

  render() {
    if (!this._hass || !this.shadowRoot) return;
    const countries = {
      hungary: { label: "Ungaria", x: 126, y: 48, rx: 220, ry: 188 },
      ukraine: { label: "Ucraina", x: 510, y: 48, rx: 405, ry: 174 },
      moldova: { label: "Moldova", x: 635, y: 210, rx: 464, ry: 226 },
      bulgaria: { label: "Bulgaria", x: 430, y: 430, rx: 380, ry: 320 },
      serbia: { label: "Serbia", x: 70, y: 350, rx: 235, ry: 292 },
    };
    const totals = this.border("total");
    const flows = Object.entries(countries).map(([key, pos]) => ({ key, ...pos, ...this.border(key) }));
    const fmt = value => value === null ? "—" : `${Math.abs(value).toLocaleString("ro-RO", { maximumFractionDigits: 1 })} MW`;
    const paths = flows.map(flow => {
      const reverse = flow.direction === "export";
      const x1 = reverse ? flow.rx : flow.x, y1 = reverse ? flow.ry : flow.y;
      const x2 = reverse ? flow.x : flow.rx, y2 = reverse ? flow.y : flow.ry;
      const strength = Math.max(flow.imported || 0, flow.exported || 0);
      const width = Math.min(10, 2.5 + strength / 250);
      return `<path class="flow ${flow.direction}" d="M ${x1} ${y1} Q ${(x1+x2)/2} ${(y1+y2)/2-18} ${x2} ${y2}" style="--flow-width:${width}px" marker-end="url(#arrow-${flow.direction})"/>`;
    }).join("");
    const labels = flows.map(flow => `<button class="country ${flow.direction}" style="left:${flow.x}px;top:${flow.y}px" data-entity="${this.entity(flow.key, "net")}"><b>${flow.label}</b><span>${flow.direction === "import" ? "Import" : flow.direction === "export" ? "Export" : "Echilibru"} ${fmt(flow.net)}</span><small>↓ ${fmt(flow.imported)} · ↑ ${fmt(flow.exported)}</small></button>`).join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block} ha-card{overflow:hidden;padding:16px;background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}
        .title{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.title h2{font-size:20px;margin:0}.title small{color:var(--secondary-text-color)}
        .totals{display:flex;gap:16px;flex-wrap:wrap;margin:8px 0 2px}.totals b{font-size:18px}.imp{color:var(--error-color,#ef5350)}.exp{color:var(--success-color,#43a047)}
        .map{position:relative;width:700px;max-width:100%;height:470px;margin:0 auto;transform-origin:top left}
        svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}.romania{fill:var(--primary-color);fill-opacity:.22;stroke:var(--primary-color);stroke-width:3}
        .tower{fill:none;stroke:var(--primary-text-color);stroke-width:4;stroke-linecap:round;stroke-linejoin:round;opacity:.88}
        .flow{fill:none;stroke-width:var(--flow-width);stroke-linecap:round;stroke-dasharray:10 9;animation:move 1.1s linear infinite}.flow.import{stroke:var(--error-color,#ef5350)}.flow.export{stroke:var(--success-color,#43a047)}.flow.idle{stroke:var(--disabled-text-color);animation:none}
        @keyframes move{to{stroke-dashoffset:-38}}
        .country{position:absolute;transform:translate(-50%,-50%);border:1px solid var(--divider-color);border-radius:12px;background:var(--card-background-color);color:var(--primary-text-color);padding:8px 10px;min-width:128px;box-shadow:0 2px 8px rgba(0,0,0,.16);cursor:pointer;text-align:center}.country b,.country span,.country small{display:block}.country span{font-size:13px}.country small{font-size:11px;color:var(--secondary-text-color);white-space:nowrap}
        .ro-label{font-weight:700;font-size:18px;fill:var(--primary-text-color);text-anchor:middle}.timestamp{text-align:right;color:var(--secondary-text-color);font-size:11px}
        @media(max-width:600px){.map{transform:scale(.7);width:700px;margin-bottom:-140px}.title{display:block}.country{min-width:118px}}
        @media(prefers-reduced-motion:reduce){.flow{animation:none}}
      </style>
      <ha-card>
        <div class="title"><div><h2>${this.config.title || "Fluxuri transfrontaliere România"}</h2><small>Valori fizice instantanee Transelectrica</small></div></div>
        <div class="totals"><span>Import total <b class="imp">${fmt(totals.imported)}</b></span><span>Export total <b class="exp">${fmt(totals.exported)}</b></span><span>Sold <b>${totals.net === null ? "—" : (totals.net > 0 ? "+" : "") + totals.net.toLocaleString("ro-RO") + " MW"}</b></span></div>
        <div class="map">
          <svg viewBox="0 0 700 470" role="img" aria-label="Harta fluxurilor de energie dintre România și statele vecine">
            <defs>
              <marker id="arrow-import" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="var(--error-color,#ef5350)"/></marker>
              <marker id="arrow-export" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="var(--success-color,#43a047)"/></marker>
              <marker id="arrow-idle" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="var(--disabled-text-color)"/></marker>
            </defs>
            <path class="romania" d="M230 185 L265 150 318 158 350 132 405 148 448 177 480 218 458 253 470 289 430 320 382 338 335 326 296 340 252 315 224 278 210 234 Z"/>
            ${paths}
            <path class="tower" d="M345 190 L310 310 M345 190 L388 310 M324 260 L373 260 M317 282 L381 282 M300 310 L400 310 M306 222 L387 222 M324 202 L370 202"/>
            <text class="ro-label" x="350" y="245">ROMÂNIA</text>
          </svg>
          ${labels}
        </div>
      </ha-card>`;
    this.shadowRoot.querySelectorAll(".country").forEach(button => button.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: button.dataset.entity } }));
    }));
  }
}

customElements.define("transelectrica-flow-card", TranselectricaFlowCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "transelectrica-flow-card",
  name: "Energy Romania Flow Map",
  preview: true,
  description: "Hartă animată a fluxurilor transfrontaliere ale României",
});
