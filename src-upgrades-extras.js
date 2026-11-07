
/* ===========================================================================
   STB — Upgrades & Extras for the Download Pricing Estimate
   ---------------------------------------------------------------------------
   Lets the closer add the upgrade line items a client is actually getting, so
   the generated estimate PDF totals and lists them. Written in readable JS and
   appended to the bundle; `s` is the JSX runtime and `ie` is React, both
   module-scope in this build.
   =========================================================================== */
function stbPerSqft(label) {
  const m = String(label).match(/\+\s*\$\s*(\d+(?:\.\d+)?)[^\/]*\/\s*(?:sq\s*ft|pie\s*cuadrado)/i);
  return m ? Number(m[1]) : null;
}
function stbCleanLabel(label) {
  return String(label).replace(/\s*(?:→|->).*$/, "").trim();
}
function stbExtrasTotal(items) {
  return (Array.isArray(items) ? items : [])
    .reduce((n, it) => n + (Number(it && it.amount) || 0), 0);
}
function stbMoney(n) {
  return "$" + Math.round(Number(n) || 0).toLocaleString("en-US");
}

function StbExtras({ lang, items, onChange, sqft, pkg }) {
  const t = lang === "en" ? {
    head: "Upgrades & Extras Included in This Package",
    sub: "Add the upgrades this client is getting. They are added to the estimate total and listed on the PDF.",
    quick: "Quick add from this package's upgrades",
    desc: "Description (e.g. Brick exterior wall)",
    add: "+ Add line item",
    none: "No upgrades added yet — the estimate will show the base package only.",
    remove: "Remove", total: "Upgrades subtotal"
  } : {
    head: "Mejoras y Extras Incluidos en Este Paquete",
    sub: "Agrega las mejoras que lleva este cliente. Se suman al total del estimado y aparecen en el PDF.",
    quick: "Agregar rápido desde las mejoras de este paquete",
    desc: "Descripción (ej. Muro exterior de ladrillo)",
    add: "+ Agregar partida",
    none: "Aún no hay mejoras agregadas — el estimado mostrará solo el paquete base.",
    remove: "Quitar", total: "Subtotal de mejoras"
  };

  const list = Array.isArray(items) ? items : [];
  const setAt = (i, patch) => onChange(list.map((it, n) => (n === i ? { ...it, ...patch } : it)));
  const removeAt = (i) => onChange(list.filter((ignored, n) => n !== i));
  const append = (label, amount) => onChange(list.concat([{ label: label || "", amount: amount == null ? "" : amount }]));

  const source = (lang === "en" ? pkg.upgrades : (pkg.upgradesES || pkg.upgrades)) || [];
  const subtotal = stbExtrasTotal(list);

  return s.jsxs("div", { className: "stb-extras", children: [
    s.jsx("div", { className: "stb-extras-head", children: t.head }),
    s.jsx("p", { className: "stb-extras-sub", children: t.sub }),

    source.length ? s.jsxs("div", { className: "stb-extras-quick", children: [
      s.jsx("div", { className: "stb-extras-quick-label", children: t.quick }),
      s.jsx("div", { className: "stb-extras-chips", children: source.map((u, i) => {
        const per = stbPerSqft(u);
        return s.jsxs("button", {
          type: "button",
          className: "stb-extras-chip",
          onClick: () => append(stbCleanLabel(u), per != null ? Math.round(per * sqft) : ""),
          children: [
            s.jsx("span", { className: "stb-extras-chip-name", children: stbCleanLabel(u) }),
            s.jsx("span", { className: "stb-extras-chip-amt",
              children: per != null ? "+" + stbMoney(per * sqft) : "+$?" })
          ]
        }, i);
      }) })
    ] }) : null,

    s.jsx("div", { className: "stb-extras-rows", children: list.length
      ? list.map((it, i) => s.jsxs("div", { className: "stb-extras-row", children: [
          s.jsx("input", {
            type: "text", className: "stb-extras-desc", placeholder: t.desc,
            value: it.label, onChange: (e) => setAt(i, { label: e.target.value })
          }),
          s.jsxs("div", { className: "stb-extras-amt-wrap", children: [
            s.jsx("span", { className: "stb-extras-dollar", children: "$" }),
            s.jsx("input", {
              type: "number", className: "stb-extras-amt", placeholder: "0", min: 0, step: 50,
              value: it.amount,
              onChange: (e) => setAt(i, { amount: e.target.value === "" ? "" : Number(e.target.value) })
            })
          ] }),
          s.jsx("button", {
            type: "button", className: "stb-extras-del", title: t.remove,
            "aria-label": t.remove, onClick: () => removeAt(i), children: "×"
          })
        ] }, i))
      : s.jsx("div", { className: "stb-extras-empty", children: t.none }) }),

    s.jsxs("div", { className: "stb-extras-foot", children: [
      s.jsx("button", { type: "button", className: "stb-extras-add",
        onClick: () => append("", ""), children: t.add }),
      subtotal > 0 ? s.jsxs("div", { className: "stb-extras-subtotal", children: [
        s.jsx("span", { children: t.total }), " ", s.jsx("strong", { children: stbMoney(subtotal) })
      ] }) : null
    ] })
  ] });
}

function StbEstimatePreview({ lang, sqft, rate, extras, color }) {
  if (!rate) {
    return s.jsx("div", {
      className: "value-pdf-preview",
      style: { textAlign: "center", color: "var(--text-muted)", padding: "16px" },
      children: lang === "en"
        ? "Enter a custom $/sq ft rate above to see your estimate."
        : "Ingresa un precio por pie cuadrado arriba para ver tu estimado."
    });
  }
  const base = sqft * rate;
  const extra = stbExtrasTotal(extras);
  const total = base + extra;
  return s.jsxs("div", { className: "value-pdf-preview", children: [
    s.jsx("div", { className: "value-pdf-preview-label",
      children: lang === "en" ? "Approximate Total" : "Total Aproximado" }),
    s.jsx("div", { className: "value-pdf-preview-total", style: { color: color },
      children: stbMoney(total) }),
    extra > 0 ? s.jsxs("div", { className: "stb-extras-breakdown", children: [
      s.jsxs("span", { children: [
        lang === "en" ? "Base " : "Base ",
        sqft.toLocaleString("en-US"), " sq ft × $", rate, " = ", stbMoney(base)
      ] }),
      s.jsx("span", { className: "stb-extras-breakdown-plus",
        children: "+ " + stbMoney(extra) + (lang === "en" ? " upgrades & extras" : " mejoras y extras") })
    ] }) : null,
    s.jsxs("div", { className: "value-pdf-preview-range", children: [
      lang === "en" ? "Range: " : "Rango: ",
      stbMoney(total * 0.95), " – ", stbMoney(total * 1.05)
    ] }),
    s.jsx("div", { className: "value-pdf-preview-note",
      children: lang === "en"
        ? "⚠️ Approximate estimate only. Final price determined at contract signing with Exhibit A."
        : "⚠️ Solo estimado aproximado. Precio final determinado al firmar contrato con Anexo A." })
  ] });
}
