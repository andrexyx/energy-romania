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

  getCardSize() {
    return 6;
  }

  entity(country, kind) {
    const configured = this.config[`${country}_${kind}`];
    if (configured) return configured;

    const expected = `sensor.energy_romania_${country}_${kind}`;
    if (this._hass?.states[expected]) return expected;

    const countryNames = {
      hungary: "Hungary",
      ukraine: "Ukraine",
      moldova: "Moldova",
      bulgaria: "Bulgaria",
      serbia: "Serbia",
      total: "All Borders",
    };

    const wantedCountry = countryNames[country];
    const wantedKind = kind.toLowerCase();

    const match = Object.entries(this._hass?.states || {}).find(
      ([entityId, state]) => {
        if (!entityId.startsWith("sensor.")) return false;

        const friendly = String(
          state.attributes?.friendly_name || ""
        ).toLowerCase();

        const attrCountry = String(
          state.attributes?.country || ""
        ).toLowerCase();

        const idMatch = entityId.endsWith(`_${country}_${kind}`);

        const countryMatch =
          attrCountry === wantedCountry.toLowerCase() ||
          friendly.includes(wantedCountry.toLowerCase());

        return idMatch || (
          countryMatch &&
          friendly.includes(wantedKind)
        );
      }
    );

    return match?.[0] || expected;
  }

  value(country, kind) {
    const state = this._hass?.states[
      this.entity(country, kind)
    ];

    const value = Number(state?.state);

    return Number.isFinite(value) ? value : null;
  }

  border(country) {
    const imported = this.value(country, "import");
    const exported = this.value(country, "export");
    const net = this.value(country, "net");

    return {
      imported,
      exported,
      net,
      direction:
        net > 0
          ? "import"
          : net < 0
            ? "export"
            : "idle",
    };
  }

  render() {
    if (!this._hass || !this.shadowRoot) return;

    const countries = {
      hungary: {
        label: "Ungaria",
        flag: "hu",
        x: 105,
        y: 70,
        sx: 190,
        sy: 115,
        rx: 280,
        ry: 205,
      },

      ukraine: {
        label: "Ucraina",
        flag: "ua",
        x: 350,
        y: 70,
        sx: 350,
        sy: 130,
        rx: 350,

        // săgeata verticală este acum mai lungă
        ry: 194,
      },

      moldova: {
        label: "Moldova",
        flag: "md",
        x: 595,
        y: 70,
        sx: 510,
        sy: 115,
        rx: 420,
        ry: 205,
      },

      bulgaria: {
        label: "Bulgaria",
        flag: "bg",
        x: 595,
        y: 400,
        sx: 510,
        sy: 355,
        rx: 420,
        ry: 290,
      },

      serbia: {
        label: "Serbia",
        flag: "rs",
        x: 105,
        y: 400,
        sx: 190,
        sy: 355,
        rx: 280,
        ry: 290,
      },
    };

    const totals = this.border("total");

    const flows = Object.entries(countries).map(
      ([key, pos]) => ({
        key,
        ...pos,
        ...this.border(key),
      })
    );

    const fmt = value =>
      value === null
        ? "—"
        : `${Math.abs(value).toLocaleString(
            "ro-RO",
            { maximumFractionDigits: 1 }
          )} MW`;

    const paths = flows
      .map(flow => {
        const reverse = flow.direction === "export";

        const x1 = reverse ? flow.rx : flow.sx;
        const y1 = reverse ? flow.ry : flow.sy;

        const x2 = reverse ? flow.sx : flow.rx;
        const y2 = reverse ? flow.sy : flow.ry;

        const strength = Math.max(
          flow.imported || 0,
          flow.exported || 0
        );

        const width = Math.min(
          6,
          2 + strength / 450
        );

        return `
          <path
            class="flow ${flow.direction}"
            d="M ${x1} ${y1} L ${x2} ${y2}"
            style="--flow-width:${width}px"
            marker-end="url(#arrow-${flow.direction})"
          />
        `;
      })
      .join("");

    /*
     * Am eliminat complet:
     *
     * Import în România
     * Export din România
     *
     * din interiorul cardurilor.
     *
     * În partea de jos rămân doar
     * valorile Import / Export,
     * fiecare pe rândul său.
     */

    const labels = flows
      .map(
        flow => `
          <button
            class="country ${flow.direction}"
            style="
              left:${flow.x / 7}%;
              top:${flow.y / 4.7}%;
            "
            data-entity="${this.entity(
              flow.key,
              "net"
            )}"
            title="Deschide detaliile pentru ${flow.label}"
          >

            <span
              class="flag flag-${flow.flag}"
              aria-hidden="true"
            ></span>

            <span class="country-copy">

              <b>${flow.label}</b>

              <strong>
                ${fmt(flow.net)}
              </strong>

              <small class="exchange">

                <span>
                  Import ${fmt(flow.imported)}
                </span>

                <span>
                  Export ${fmt(flow.exported)}
                </span>

              </small>

            </span>

          </button>
        `
      )
      .join("");

    this.shadowRoot.innerHTML = `
      <style>

        :host {
          display: block;
        }

        ha-card {
          overflow: hidden;
          padding: 18px;

          background:
            radial-gradient(
              circle at 50% 48%,
              color-mix(
                in srgb,
                var(--primary-color) 10%,
                transparent
              ),
              transparent 42%
            ),
            var(
              --ha-card-background,
              var(--card-background-color)
            );

          color: var(--primary-text-color);
        }


        /* =========================
           TITLU
           ========================= */

        .title {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .title h2 {
          font-size: 21px;
          margin: 0 0 3px;
        }

        .title small {
          color: var(--secondary-text-color);
        }


        /* =========================
           TOTALURI
           ========================= */

        .totals {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(110px, 1fr));

          gap: 8px;
          margin: 13px 0 4px;
        }

        .total {
          border:
            1px solid var(--divider-color);

          border-radius: 12px;

          padding: 9px 11px;

          background:
            color-mix(
              in srgb,
              var(--card-background-color) 88%,
              transparent
            );
        }

        .totals small,
        .totals b {
          display: block;
        }

        .totals small {
          color: var(--secondary-text-color);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .04em;
        }

        .totals b {
          font-size: 18px;
          margin-top: 2px;
        }

        .imp {
          color: var(--error-color, #ef5350);
        }

        .exp {
          color: var(--success-color, #43a047);
        }


        /* =========================
           LEGENDĂ
           ========================= */

        .legend {
          display: flex;
          justify-content: center;
          gap: 18px;
          margin: 10px 0 -2px;
          color: var(--secondary-text-color);
          font-size: 11px;
        }

        .dot {
          display: inline-block;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          margin-right: 5px;
        }

        .dot.imp {
          background:
            var(--error-color, #ef5350);
        }

        .dot.exp {
          background:
            var(--success-color, #43a047);
        }


        /* =========================
           HARTĂ
           ========================= */

        .map {
          position: relative;
          isolation: isolate;

          width: min(100%, 760px);

          aspect-ratio: 700 / 470;

          margin: 4px auto 0;
        }

        svg {
          position: absolute;
          z-index: 10;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
          pointer-events: none;
        }


        /* =========================
           FLUXURI
           ========================= */

        .flow {
          fill: none;

          stroke-width:
            var(--flow-width);

          stroke-linecap: round;

          stroke-dasharray:
            10 9;

          animation:
            move 1.1s linear infinite;
        }

        .flow.import {
          stroke:
            var(--error-color, #ef5350);
        }

        .flow.export {
          stroke:
            var(--success-color, #43a047);
        }

        .flow.idle {
          stroke:
            var(--disabled-text-color);

          animation: none;
        }

        @keyframes move {
          to {
            stroke-dashoffset: -38;
          }
        }


        /* =========================
           CARDURI ȚĂRI
           ========================= */

        .country {
          z-index: 5;

          position: absolute;

          transform:
            translate(-50%, -50%);

          display: flex;

          align-items: center;

          gap: 8px;

          border:
            1px solid var(--divider-color);

          border-radius: 15px;

          background:
            color-mix(
              in srgb,
              var(--card-background-color) 96%,
              transparent
            );

          color:
            var(--primary-text-color);

          padding:
            8px 10px;

          /*
           * Puțin mai late decât înainte.
           * Era max. 156px.
           */
          width:
            clamp(136px, 23%, 176px);

          box-sizing:
            border-box;

          box-shadow:
            0 5px 18px rgba(0,0,0,.18);

          cursor:
            pointer;

          text-align:
            left;

          transition:
            transform .18s ease,
            box-shadow .18s ease,
            border-color .18s ease;
        }

        .country:hover,
        .country:focus-visible {

          transform:
            translate(-50%, -50%)
            scale(1.045);

          box-shadow:
            0 8px 24px rgba(0,0,0,.25);

          border-color:
            var(--primary-color);

          outline:
            none;
        }

        .country.import {
          border-left:
            4px solid
            var(--error-color, #ef5350);
        }

        .country.export {
          border-left:
            4px solid
            var(--success-color, #43a047);
        }


        /* =========================
           STEAGURI
           ========================= */

        .flag {
          display: block;

          flex:
            0 0 30px;

          width:
            30px;

          height:
            21px;

          border-radius:
            3px;

          box-shadow:
            0 1px 3px rgba(0,0,0,.35);
        }

        .flag-hu {
          background:
            linear-gradient(
              #ce2939 0 33.3%,
              #fff 33.3% 66.6%,
              #477050 66.6%
            );
        }

        .flag-ua {
          background:
            linear-gradient(
              #005bbb 0 50%,
              #ffd500 50%
            );
        }

        .flag-md {
          background:
            linear-gradient(
              90deg,
              #0046ae 0 33.3%,
              #ffd200 33.3% 66.6%,
              #cc092f 66.6%
            );
        }

        .flag-bg {
          background:
            linear-gradient(
              #fff 0 33.3%,
              #00966e 33.3% 66.6%,
              #d62612 66.6%
            );
        }

        .flag-rs {
          background:
            linear-gradient(
              #c6363c 0 33.3%,
              #0c4076 33.3% 66.6%,
              #fff 66.6%
            );
        }


        /* =========================
           TEXT CARD ȚARĂ
           ========================= */

        .country-copy {
          display: block;
          min-width: 0;
          flex: 1;
          overflow: hidden;
        }

        .country-copy > * {
          display: block;
          min-width: 0;
        }

        .country b {
          font-size: 14px;
          line-height: 1.05;
        }

        .country strong {
          font-size: 14px;
          line-height: 1.05;

          margin-top: 2px;

          /*
           * Soldul nu mai sare
           * pe două rânduri.
           */
          white-space: nowrap;
        }


        /* =========================
           IMPORT / EXPORT
           ========================= */

        .country .exchange {
          font-size: 8.5px;

          line-height: 1.15;

          color:
            var(--secondary-text-color);

          margin-top: 4px;

          white-space: normal;
        }

        .country .exchange span {
          display: block;

          white-space:
            nowrap;

          overflow:
            hidden;

          text-overflow:
            clip;
        }


        /* =========================
           ROMÂNIA
           ========================= */

        .ro-badge {
          filter:
            drop-shadow(
              0 3px 6px rgba(0,0,0,.24)
            );
        }

        .ro-flag-shape {
          fill:
            url(#roFlag);

          stroke:
            var(--card-background-color);

          stroke-width:
            2;
        }

        .ro-label {
          font-weight:
            800;

          font-size:
            17px;

          fill:
            var(--primary-text-color);

          text-anchor:
            middle;

          letter-spacing:
            .08em;
        }

        .ro-sub {
          font-size:
            24px;

          fill:
            var(--secondary-text-color);

          text-anchor:
            middle;

          letter-spacing:
            .04em;
        }


        /* =========================
           MOBIL
           ========================= */

        @media(max-width:600px) {

          ha-card {
            padding: 12px;
          }

          .title h2 {
            font-size: 18px;
          }

          .totals {
            grid-template-columns:
              repeat(3,1fr);

            gap: 5px;
          }

          .total {
            padding: 7px;
          }

          .totals b {
            font-size: 14px;
          }

          .totals small {
            font-size: 8px;
          }

          .legend {
            font-size: 9px;
            gap: 10px;
          }

          .country {
            width: 25%;
            padding: 5px;
            gap: 5px;
            border-radius: 10px;
          }

          .flag {
            flex-basis: 21px;
            width: 21px;
            height: 15px;
          }

          .country b {
            font-size: 10px;
          }

          .country strong {
            font-size: 10px;
          }

          .country .exchange {
            font-size: 6.8px;
            margin-top: 2px;
          }

          .ro-sub {
            display: none;
          }
        }


        @media(
          prefers-reduced-motion: reduce
        ) {
          .flow {
            animation: none;
          }
        }

      </style>


      <ha-card>

        <div class="title">

          <div>

            <h2>
              ${this.config.title ||
              "Fluxuri transfrontaliere România"}
            </h2>


          </div>

        </div>


        <div class="totals">

          <span class="total">

            <small>
              Import total
            </small>

            <b class="imp">
              ${fmt(totals.imported)}
            </b>

          </span>


          <span class="total">

            <small>
              Export total
            </small>

            <b class="exp">
              ${fmt(totals.exported)}
            </b>

          </span>


          <span class="total">

            <small>
              Sold național
            </small>

            <b>
              ${
                totals.net === null
                  ? "—"
                  : (
                      totals.net > 0
                        ? "+"
                        : ""
                    ) +
                    totals.net.toLocaleString(
                      "ro-RO"
                    ) +
                    " MW"
              }
            </b>

          </span>

        </div>


        <div class="legend">

          <span>
            <i class="dot imp"></i>
            Import în România
          </span>

          <span>
            <i class="dot exp"></i>
            Export din România
          </span>

        </div>


        <div class="map">

          <svg
            viewBox="0 0 700 470"
            role="img"
            aria-label="Harta fluxurilor de energie dintre România și statele vecine"
          >

            <defs>

              <marker
                id="arrow-import"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto"
              >
                <path
                  d="M0 0L10 5L0 10Z"
                  fill="var(--error-color,#ef5350)"
                />
              </marker>


              <marker
                id="arrow-export"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto"
              >
                <path
                  d="M0 0L10 5L0 10Z"
                  fill="var(--success-color,#43a047)"
                />
              </marker>


              <marker
                id="arrow-idle"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto"
              >
                <path
                  d="M0 0L10 5L0 10Z"
                  fill="var(--disabled-text-color)"
                />
              </marker>


              <linearGradient id="roFlag">

                <stop
                  offset="0"
                  stop-color="#002b7f"
                />

                <stop
                  offset="33.3%"
                  stop-color="#002b7f"
                />

                <stop
                  offset="33.3%"
                  stop-color="#fcd116"
                />

                <stop
                  offset="66.6%"
                  stop-color="#fcd116"
                />

                <stop
                  offset="66.6%"
                  stop-color="#ce1126"
                />

              </linearGradient>

            </defs>


            <!--
              Harta era la y=174.
              Acum este coborâtă la y=190.
            -->

            <image
              class="romania-map"
              href="/energy_romania_static/romania-map.svg?v=1.1.2"
              x="250"
              y="190"
              width="200"
              height="143"
              preserveAspectRatio="xMidYMid meet"
            />


            ${paths}


            <!--
              Steagul și textul României
              sunt coborâte împreună cu harta.
            -->

            <g class="ro-badge">

              <rect
                class="ro-flag-shape"
                x="330"
                y="220"
                width="40"
                height="27"
                rx="4"
              />

              <text
                class="ro-label"
                x="350"
                y="272"
              >
                ROMÂNIA
              </text>

              <text
                class="ro-sub"
                x="350"
                y="297"
              >
                ⚡
              </text>

            </g>

          </svg>


          ${labels}

        </div>

      </ha-card>
    `;


    this.shadowRoot
      .querySelectorAll(".country")
      .forEach(button =>
        button.addEventListener(
          "click",
          () => {

            this.dispatchEvent(
              new CustomEvent(
                "hass-more-info",
                {
                  bubbles: true,
                  composed: true,
                  detail: {
                    entityId:
                      button.dataset.entity,
                  },
                }
              )
            );

          }
        )
      );
  }
}


window.customCards =
  window.customCards || [];


if (
  !window.customCards.some(
    card =>
      card.type ===
      "transelectrica-flow-card"
  )
) {
  window.customCards.push({
    type: "transelectrica-flow-card",
    name: "Energy Romania Flow Map",
    preview: true,
    description:
      "Hartă animată a fluxurilor transfrontaliere ale României",
    documentationURL:
      "https://github.com/andrexyx/energy-romania",
  });
}


if (
  !customElements.get(
    "transelectrica-flow-card"
  )
) {
  customElements.define(
    "transelectrica-flow-card",
    TranselectricaFlowCard
  );
}
