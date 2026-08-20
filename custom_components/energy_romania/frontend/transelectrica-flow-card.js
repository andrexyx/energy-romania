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
      hungary: { label: "Ungaria", flag: "🇭🇺", x: 126, y: 48, rx: 220, ry: 188 },
      ukraine: { label: "Ucraina", flag: "🇺🇦", x: 510, y: 48, rx: 405, ry: 174 },
      moldova: { label: "Moldova", flag: "🇲🇩", x: 635, y: 210, rx: 464, ry: 226 },
      bulgaria: { label: "Bulgaria", flag: "🇧🇬", x: 430, y: 430, rx: 380, ry: 320 },
      serbia: { label: "Serbia", flag: "🇷🇸", x: 70, y: 350, rx: 235, ry: 292 },
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
    const labels = flows.map(flow => `<button class="country ${flow.direction}" style="left:${flow.x}px;top:${flow.y}px" data-entity="${this.entity(flow.key, "net")}" title="Deschide detaliile pentru ${flow.label}"><span class="flag" aria-hidden="true">${flow.flag}</span><span class="country-copy"><b>${flow.label}</b><span class="direction">${flow.direction === "import" ? "Import în România" : flow.direction === "export" ? "Export din România" : "Echilibru"}</span><strong>${fmt(flow.net)}</strong><small>Import ${fmt(flow.imported)} · Export ${fmt(flow.exported)}</small></span></button>`).join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block} ha-card{overflow:hidden;padding:18px;background:radial-gradient(circle at 50% 48%,color-mix(in srgb,var(--primary-color) 10%,transparent),transparent 42%),var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color)}
        .title{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.title h2{font-size:21px;margin:0 0 3px}.title small{color:var(--secondary-text-color)}
        .totals{display:grid;grid-template-columns:repeat(3,minmax(110px,1fr));gap:8px;margin:13px 0 4px}.total{border:1px solid var(--divider-color);border-radius:12px;padding:9px 11px;background:color-mix(in srgb,var(--card-background-color) 88%,transparent)}.totals small,.totals b{display:block}.totals small{color:var(--secondary-text-color);font-size:11px;text-transform:uppercase;letter-spacing:.04em}.totals b{font-size:18px;margin-top:2px}.imp{color:var(--error-color,#ef5350)}.exp{color:var(--success-color,#43a047)}
        .legend{display:flex;justify-content:center;gap:18px;margin:10px 0 -2px;color:var(--secondary-text-color);font-size:11px}.dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px}.dot.imp{background:var(--error-color,#ef5350)}.dot.exp{background:var(--success-color,#43a047)}
        .map{position:relative;width:700px;max-width:100%;height:470px;margin:0 auto;transform-origin:top left}
        svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}.romania{fill:var(--primary-color);fill-opacity:.18;stroke:var(--primary-color);stroke-width:3;filter:drop-shadow(0 5px 12px color-mix(in srgb,var(--primary-color) 25%,transparent))}
        .tower{fill:none;stroke:var(--primary-text-color);stroke-width:4;stroke-linecap:round;stroke-linejoin:round;opacity:.88}
        .flow{fill:none;stroke-width:var(--flow-width);stroke-linecap:round;stroke-dasharray:10 9;animation:move 1.1s linear infinite}.flow.import{stroke:var(--error-color,#ef5350)}.flow.export{stroke:var(--success-color,#43a047)}.flow.idle{stroke:var(--disabled-text-color);animation:none}
        @keyframes move{to{stroke-dashoffset:-38}}
        .country{position:absolute;transform:translate(-50%,-50%);display:flex;align-items:center;gap:8px;border:1px solid var(--divider-color);border-radius:15px;background:color-mix(in srgb,var(--card-background-color) 94%,transparent);color:var(--primary-text-color);padding:8px 10px;min-width:150px;box-shadow:0 5px 18px rgba(0,0,0,.18);cursor:pointer;text-align:left;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}.country:hover,.country:focus-visible{transform:translate(-50%,-50%) scale(1.055);box-shadow:0 8px 24px rgba(0,0,0,.25);border-color:var(--primary-color);outline:none}.country.import{border-left:4px solid var(--error-color,#ef5350)}.country.export{border-left:4px solid var(--success-color,#43a047)}.flag{font-size:27px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.25))}.country-copy,.country-copy>*{display:block}.country b{font-size:14px}.country .direction{font-size:10px;color:var(--secondary-text-color)}.country strong{font-size:14px;margin-top:1px}.country small{font-size:9px;color:var(--secondary-text-color);white-space:nowrap;margin-top:2px}
        .ro-badge{filter:drop-shadow(0 3px 6px rgba(0,0,0,.24))}.ro-flag{font-size:30px;text-anchor:middle}.ro-label{font-weight:800;font-size:18px;fill:var(--primary-text-color);text-anchor:middle;letter-spacing:.08em}.ro-sub{font-size:10px;fill:var(--secondary-text-color);text-anchor:middle;letter-spacing:.05em}.timestamp{text-align:right;color:var(--secondary-text-color);font-size:11px}
        @media(max-width:600px){ha-card{padding:14px}.map{transform:scale(.7);width:700px;margin-bottom:-140px;margin-left:calc((100% - 490px)/2)}.title{display:block}.totals{grid-template-columns:1fr}.country{min-width:142px}.legend{margin-bottom:4px}}
        @media(prefers-reduced-motion:reduce){.flow{animation:none}}
      </style>
      <ha-card>
        <div class="title"><div><h2>${this.config.title || "Fluxuri transfrontaliere România"}</h2><small>Valori fizice instantanee Transelectrica</small></div></div>
        <div class="totals"><span class="total"><small>Import total</small><b class="imp">${fmt(totals.imported)}</b></span><span class="total"><small>Export total</small><b class="exp">${fmt(totals.exported)}</b></span><span class="total"><small>Sold național</small><b>${totals.net === null ? "—" : (totals.net > 0 ? "+" : "") + totals.net.toLocaleString("ro-RO") + " MW"}</b></span></div>
        <div class="legend"><span><i class="dot imp"></i>Import în România</span><span><i class="dot exp"></i>Export din România</span></div>
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
            <g class="ro-badge"><text class="ro-flag" x="350" y="226">🇷🇴</text><text class="ro-label" x="350" y="252">ROMÂNIA</text><text class="ro-sub" x="350" y="269">SISTEM ENERGETIC NAȚIONAL</text></g>
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
