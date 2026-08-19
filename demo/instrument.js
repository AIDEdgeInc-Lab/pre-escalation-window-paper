var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// site/instrument-src/state.ts
var Store = class {
  constructor(initial) {
    __publicField(this, "state");
    __publicField(this, "listeners", []);
    this.state = initial;
  }
  get() {
    return this.state;
  }
  set(patch) {
    this.state = { ...this.state, ...patch };
    for (const l of this.listeners) l(this.state);
  }
  subscribe(fn) {
    this.listeners.push(fn);
  }
};
function findEntry(data, domain, scenario, configId) {
  return data.entries.find((e) => e.domain === domain && e.scenario === scenario && e.config_id === configId) ?? null;
}
function scenariosForDomain(data, domain) {
  const set = new Set(data.entries.filter((e) => e.domain === domain).map((e) => e.scenario));
  return [...set].sort();
}
function defaultConfig(data) {
  const c = data.comparator_configs.find((c2) => c2.is_default);
  if (!c) throw new Error("no default comparator config in instrument.json");
  return c;
}
function initialState(data) {
  return {
    domain: data.meta.default_selection.domain,
    scenario: data.meta.default_selection.scenario,
    configId: defaultConfig(data).id,
    highlightedSeed: null
  };
}

// site/instrument-src/header.ts
var SCENARIO_LABEL = {
  mw_rain_cell: "Rain cell (self-clearing)",
  mw_directional_hardware: "Directional hardware fault",
  mw_hidden_in_storm: "Hardware fault hidden in storm",
  mw_interference: "Interference",
  mw_config_change: "Configuration change",
  leo_gateway_side: "Gateway-side impairment",
  leo_ground_rain: "Ground-station rain fade (self-clearing)",
  leo_hidden_in_rain: "RF subsystem fault hidden in rain",
  leo_low_elevation: "Low-elevation geometry (self-clearing, no fault)",
  leo_pointing: "Pointing / attitude drift",
  leo_rf_subsystem: "RF subsystem fault"
};
function renderHeader(container, data, store) {
  container.innerHTML = "";
  container.className = "instrument-header";
  const left = document.createElement("div");
  left.className = "header-left";
  const wordmark = document.createElement("p");
  wordmark.className = "header-wordmark";
  wordmark.textContent = "The Pre-Escalation Window";
  left.appendChild(wordmark);
  const badge = document.createElement("span");
  badge.className = "header-modelled-badge";
  badge.textContent = "MODELLED";
  badge.title = "Simulated networks. Ground truth known by construction.";
  left.appendChild(badge);
  const paperLink = document.createElement("a");
  paperLink.className = "header-paper-link";
  paperLink.href = "/article/";
  paperLink.textContent = "Read the paper";
  left.appendChild(paperLink);
  const right = document.createElement("div");
  right.className = "header-right";
  const domainGroup = document.createElement("div");
  domainGroup.className = "header-domain-toggle";
  domainGroup.setAttribute("role", "radiogroup");
  domainGroup.setAttribute("aria-label", "Domain");
  for (const dom of ["microwave", "leo_ntn"]) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "header-domain-btn";
    btn.textContent = dom === "microwave" ? "MICROWAVE" : "LEO/NTN";
    btn.setAttribute("role", "radio");
    btn.setAttribute("data-focus-key", `domain:${dom}`);
    const selected = store.get().domain === dom;
    btn.setAttribute("aria-checked", String(selected));
    if (selected) btn.classList.add("is-selected");
    btn.addEventListener("click", () => {
      if (store.get().domain === dom) return;
      const scenarios = scenariosForDomain(data, dom);
      store.set({ domain: dom, scenario: scenarios[0], highlightedSeed: null });
    });
    domainGroup.appendChild(btn);
  }
  right.appendChild(domainGroup);
  const scenarioSelect = document.createElement("select");
  scenarioSelect.className = "header-scenario-select";
  scenarioSelect.setAttribute("aria-label", "Scenario");
  scenarioSelect.setAttribute("data-focus-key", "scenario-select");
  for (const scen of scenariosForDomain(data, store.get().domain)) {
    const opt = document.createElement("option");
    opt.value = scen;
    opt.textContent = SCENARIO_LABEL[scen] ?? scen;
    if (scen === store.get().scenario) opt.selected = true;
    scenarioSelect.appendChild(opt);
  }
  scenarioSelect.addEventListener("change", () => {
    store.set({ scenario: scenarioSelect.value, highlightedSeed: null });
  });
  right.appendChild(scenarioSelect);
  container.appendChild(left);
  container.appendChild(right);
}

// site/instrument-src/rail.ts
var AXIS_LABEL = {
  smoothing_window: "Smoothing window",
  persistence: "Persistence (M-of-N)",
  escalation_delay_min: "Escalation delay"
};
function axisConfigs(configs, axis) {
  return configs.filter((c) => c.sweep_axes.includes(axis)).sort((a, b) => {
    if (axis === "smoothing_window") return a.smoothing_window - b.smoothing_window;
    if (axis === "escalation_delay_min") return a.escalation_delay_min - b.escalation_delay_min;
    return a.persistence_m - b.persistence_m;
  });
}
function paramText(c, axis) {
  if (axis === "smoothing_window") return `${c.smoothing_window}`;
  if (axis === "escalation_delay_min") return `${c.escalation_delay_min} min`;
  return `${c.persistence_m}/${c.persistence_n}`;
}
function renderRail(container, data, store) {
  container.innerHTML = "";
  container.setAttribute("aria-label", "Comparator configuration");
  const heading = document.createElement("p");
  heading.className = "rail-heading";
  heading.textContent = "Comparator configuration";
  container.appendChild(heading);
  const note = document.createElement("p");
  note.className = "rail-note";
  note.textContent = "One factor at a time, around a shared default \u2014 not three independent sliders. Changing one resets the others to default, because that is the only combination this sweep actually ran.";
  container.appendChild(note);
  const axes = ["smoothing_window", "persistence", "escalation_delay_min"];
  const defaultCfg = data.comparator_configs.find((c) => c.is_default);
  const degenerateCfg = data.comparator_configs.find((c) => c.is_degenerate);
  for (const axis of axes) {
    const group = document.createElement("fieldset");
    group.className = "rail-group";
    const legend = document.createElement("legend");
    legend.textContent = AXIS_LABEL[axis];
    group.appendChild(legend);
    const btnRow = document.createElement("div");
    btnRow.className = "rail-btn-row";
    btnRow.setAttribute("role", "radiogroup");
    btnRow.setAttribute("aria-label", AXIS_LABEL[axis]);
    for (const cfg of axisConfigs(data.comparator_configs, axis)) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rail-btn";
      btn.textContent = paramText(cfg, axis);
      btn.setAttribute("role", "radio");
      btn.setAttribute("data-focus-key", `axis:${axis}:${cfg.id}`);
      const isSelected = store.get().configId === cfg.id;
      btn.setAttribute("aria-checked", String(isSelected));
      if (isSelected) btn.classList.add("is-selected");
      if (cfg.is_default) btn.classList.add("is-default-value");
      btn.addEventListener("click", () => store.set({ configId: cfg.id }));
      btnRow.appendChild(btn);
    }
    group.appendChild(btnRow);
    container.appendChild(group);
  }
  const presetRow = document.createElement("div");
  presetRow.className = "rail-preset-row";
  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "rail-preset-btn";
  resetBtn.setAttribute("data-focus-key", "preset:reset");
  if (store.get().configId === defaultCfg.id) resetBtn.classList.add("is-selected");
  resetBtn.textContent = "Reset to default";
  resetBtn.addEventListener("click", () => store.set({ configId: defaultCfg.id }));
  presetRow.appendChild(resetBtn);
  const degenBtn = document.createElement("button");
  degenBtn.type = "button";
  degenBtn.className = "rail-preset-btn rail-preset-degenerate";
  degenBtn.setAttribute("data-focus-key", "preset:degenerate");
  if (store.get().configId === degenerateCfg.id) degenBtn.classList.add("is-selected");
  degenBtn.textContent = "Degenerate preset";
  degenBtn.title = "A perfect, instantaneous, unsmoothed threshold monitor \u2014 better than any real NMS";
  degenBtn.addEventListener("click", () => store.set({ configId: degenerateCfg.id }));
  presetRow.appendChild(degenBtn);
  container.appendChild(presetRow);
  const currentCfg = data.comparator_configs.find((c) => c.id === store.get().configId);
  const currentLabel = document.createElement("p");
  currentLabel.className = "rail-current";
  if (currentCfg) {
    currentLabel.textContent = currentCfg.is_degenerate ? "Current: degenerate (perfect, instantaneous, unsmoothed)" : currentCfg.is_default ? "Current: default" : `Current: ${AXIS_LABEL[currentCfg.sweep_axes[0]] ?? currentCfg.sweep_axes[0]} = ${paramText(currentCfg, currentCfg.sweep_axes[0])}`;
  }
  container.appendChild(currentLabel);
}

// node_modules/d3-array/src/ascending.js
function ascending(a, b) {
  return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

// node_modules/d3-array/src/descending.js
function descending(a, b) {
  return a == null || b == null ? NaN : b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
}

// node_modules/d3-array/src/bisector.js
function bisector(f) {
  let compare1, compare2, delta;
  if (f.length !== 2) {
    compare1 = ascending;
    compare2 = (d, x) => ascending(f(d), x);
    delta = (d, x) => f(d) - x;
  } else {
    compare1 = f === ascending || f === descending ? f : zero;
    compare2 = f;
    delta = f;
  }
  function left(a, x, lo = 0, hi = a.length) {
    if (lo < hi) {
      if (compare1(x, x) !== 0) return hi;
      do {
        const mid = lo + hi >>> 1;
        if (compare2(a[mid], x) < 0) lo = mid + 1;
        else hi = mid;
      } while (lo < hi);
    }
    return lo;
  }
  function right(a, x, lo = 0, hi = a.length) {
    if (lo < hi) {
      if (compare1(x, x) !== 0) return hi;
      do {
        const mid = lo + hi >>> 1;
        if (compare2(a[mid], x) <= 0) lo = mid + 1;
        else hi = mid;
      } while (lo < hi);
    }
    return lo;
  }
  function center(a, x, lo = 0, hi = a.length) {
    const i = left(a, x, lo, hi - 1);
    return i > lo && delta(a[i - 1], x) > -delta(a[i], x) ? i - 1 : i;
  }
  return { left, center, right };
}
function zero() {
  return 0;
}

// node_modules/d3-array/src/number.js
function number(x) {
  return x === null ? NaN : +x;
}

// node_modules/d3-array/src/bisect.js
var ascendingBisect = bisector(ascending);
var bisectRight = ascendingBisect.right;
var bisectLeft = ascendingBisect.left;
var bisectCenter = bisector(number).center;
var bisect_default = bisectRight;

// node_modules/d3-array/src/ticks.js
var e10 = Math.sqrt(50);
var e5 = Math.sqrt(10);
var e2 = Math.sqrt(2);
function tickSpec(start, stop, count) {
  const step = (stop - start) / Math.max(0, count), power = Math.floor(Math.log10(step)), error = step / Math.pow(10, power), factor = error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1;
  let i1, i2, inc;
  if (power < 0) {
    inc = Math.pow(10, -power) / factor;
    i1 = Math.round(start * inc);
    i2 = Math.round(stop * inc);
    if (i1 / inc < start) ++i1;
    if (i2 / inc > stop) --i2;
    inc = -inc;
  } else {
    inc = Math.pow(10, power) * factor;
    i1 = Math.round(start / inc);
    i2 = Math.round(stop / inc);
    if (i1 * inc < start) ++i1;
    if (i2 * inc > stop) --i2;
  }
  if (i2 < i1 && 0.5 <= count && count < 2) return tickSpec(start, stop, count * 2);
  return [i1, i2, inc];
}
function ticks(start, stop, count) {
  stop = +stop, start = +start, count = +count;
  if (!(count > 0)) return [];
  if (start === stop) return [start];
  const reverse = stop < start, [i1, i2, inc] = reverse ? tickSpec(stop, start, count) : tickSpec(start, stop, count);
  if (!(i2 >= i1)) return [];
  const n = i2 - i1 + 1, ticks2 = new Array(n);
  if (reverse) {
    if (inc < 0) for (let i = 0; i < n; ++i) ticks2[i] = (i2 - i) / -inc;
    else for (let i = 0; i < n; ++i) ticks2[i] = (i2 - i) * inc;
  } else {
    if (inc < 0) for (let i = 0; i < n; ++i) ticks2[i] = (i1 + i) / -inc;
    else for (let i = 0; i < n; ++i) ticks2[i] = (i1 + i) * inc;
  }
  return ticks2;
}
function tickIncrement(start, stop, count) {
  stop = +stop, start = +start, count = +count;
  return tickSpec(start, stop, count)[2];
}
function tickStep(start, stop, count) {
  stop = +stop, start = +start, count = +count;
  const reverse = stop < start, inc = reverse ? tickIncrement(stop, start, count) : tickIncrement(start, stop, count);
  return (reverse ? -1 : 1) * (inc < 0 ? 1 / -inc : inc);
}

// node_modules/d3-scale/src/init.js
function initRange(domain, range) {
  switch (arguments.length) {
    case 0:
      break;
    case 1:
      this.range(domain);
      break;
    default:
      this.range(range).domain(domain);
      break;
  }
  return this;
}

// node_modules/d3-color/src/define.js
function define_default(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}
function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) prototype[key] = definition[key];
  return prototype;
}

// node_modules/d3-color/src/color.js
function Color() {
}
var darker = 0.7;
var brighter = 1 / darker;
var reI = "\\s*([+-]?\\d+)\\s*";
var reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex = /^#([0-9a-f]{3,8})$/;
var reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`);
var reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`);
var reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`);
var reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`);
var reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`);
var reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);
var named = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074
};
define_default(Color, color, {
  copy(channels) {
    return Object.assign(new this.constructor(), this, channels);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: color_formatHex,
  // Deprecated! Use color.formatHex.
  formatHex: color_formatHex,
  formatHex8: color_formatHex8,
  formatHsl: color_formatHsl,
  formatRgb: color_formatRgb,
  toString: color_formatRgb
});
function color_formatHex() {
  return this.rgb().formatHex();
}
function color_formatHex8() {
  return this.rgb().formatHex8();
}
function color_formatHsl() {
  return hslConvert(this).formatHsl();
}
function color_formatRgb() {
  return this.rgb().formatRgb();
}
function color(format2) {
  var m, l;
  format2 = (format2 + "").trim().toLowerCase();
  return (m = reHex.exec(format2)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) : l === 3 ? new Rgb(m >> 8 & 15 | m >> 4 & 240, m >> 4 & 15 | m & 240, (m & 15) << 4 | m & 15, 1) : l === 8 ? rgba(m >> 24 & 255, m >> 16 & 255, m >> 8 & 255, (m & 255) / 255) : l === 4 ? rgba(m >> 12 & 15 | m >> 8 & 240, m >> 8 & 15 | m >> 4 & 240, m >> 4 & 15 | m & 240, ((m & 15) << 4 | m & 15) / 255) : null) : (m = reRgbInteger.exec(format2)) ? new Rgb(m[1], m[2], m[3], 1) : (m = reRgbPercent.exec(format2)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) : (m = reRgbaInteger.exec(format2)) ? rgba(m[1], m[2], m[3], m[4]) : (m = reRgbaPercent.exec(format2)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) : (m = reHslPercent.exec(format2)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) : (m = reHslaPercent.exec(format2)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) : named.hasOwnProperty(format2) ? rgbn(named[format2]) : format2 === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
}
function rgbn(n) {
  return new Rgb(n >> 16 & 255, n >> 8 & 255, n & 255, 1);
}
function rgba(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb(r, g, b, a);
}
function rgbConvert(o) {
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Rgb();
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}
function rgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}
function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}
define_default(Rgb, rgb, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
  },
  displayable() {
    return -0.5 <= this.r && this.r < 255.5 && (-0.5 <= this.g && this.g < 255.5) && (-0.5 <= this.b && this.b < 255.5) && (0 <= this.opacity && this.opacity <= 1);
  },
  hex: rgb_formatHex,
  // Deprecated! Use color.formatHex.
  formatHex: rgb_formatHex,
  formatHex8: rgb_formatHex8,
  formatRgb: rgb_formatRgb,
  toString: rgb_formatRgb
}));
function rgb_formatHex() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
}
function rgb_formatHex8() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function rgb_formatRgb() {
  const a = clampa(this.opacity);
  return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
}
function clampa(opacity) {
  return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
}
function clampi(value) {
  return Math.max(0, Math.min(255, Math.round(value) || 0));
}
function hex(value) {
  value = clampi(value);
  return (value < 16 ? "0" : "") + value.toString(16);
}
function hsla(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;
  else if (l <= 0 || l >= 1) h = s = NaN;
  else if (s <= 0) h = NaN;
  return new Hsl(h, s, l, a);
}
function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Hsl();
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r = o.r / 255, g = o.g / 255, b = o.b / 255, min = Math.min(r, g, b), max = Math.max(r, g, b), h = NaN, s = max - min, l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;
    else if (g === max) h = (b - r) / s + 2;
    else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}
function hsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}
function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}
define_default(Hsl, hsl, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb() {
    var h = this.h % 360 + (this.h < 0) * 360, s = isNaN(h) || isNaN(this.s) ? 0 : this.s, l = this.l, m2 = l + (l < 0.5 ? l : 1 - l) * s, m1 = 2 * l - m2;
    return new Rgb(
      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
      hsl2rgb(h, m1, m2),
      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
      this.opacity
    );
  },
  clamp() {
    return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && (0 <= this.l && this.l <= 1) && (0 <= this.opacity && this.opacity <= 1);
  },
  formatHsl() {
    const a = clampa(this.opacity);
    return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
  }
}));
function clamph(value) {
  value = (value || 0) % 360;
  return value < 0 ? value + 360 : value;
}
function clampt(value) {
  return Math.max(0, Math.min(1, value || 0));
}
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60 : h < 180 ? m2 : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60 : m1) * 255;
}

// node_modules/d3-interpolate/src/basis.js
function basis(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1, t3 = t2 * t1;
  return ((1 - 3 * t1 + 3 * t2 - t3) * v0 + (4 - 6 * t2 + 3 * t3) * v1 + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2 + t3 * v3) / 6;
}
function basis_default(values) {
  var n = values.length - 1;
  return function(t) {
    var i = t <= 0 ? t = 0 : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n), v1 = values[i], v2 = values[i + 1], v0 = i > 0 ? values[i - 1] : 2 * v1 - v2, v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
}

// node_modules/d3-interpolate/src/basisClosed.js
function basisClosed_default(values) {
  var n = values.length;
  return function(t) {
    var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n), v0 = values[(i + n - 1) % n], v1 = values[i % n], v2 = values[(i + 1) % n], v3 = values[(i + 2) % n];
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
}

// node_modules/d3-interpolate/src/constant.js
var constant_default = (x) => () => x;

// node_modules/d3-interpolate/src/color.js
function linear(a, d) {
  return function(t) {
    return a + t * d;
  };
}
function exponential(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
    return Math.pow(a + t * b, y);
  };
}
function gamma(y) {
  return (y = +y) === 1 ? nogamma : function(a, b) {
    return b - a ? exponential(a, b, y) : constant_default(isNaN(a) ? b : a);
  };
}
function nogamma(a, b) {
  var d = b - a;
  return d ? linear(a, d) : constant_default(isNaN(a) ? b : a);
}

// node_modules/d3-interpolate/src/rgb.js
var rgb_default = (function rgbGamma(y) {
  var color2 = gamma(y);
  function rgb2(start, end) {
    var r = color2((start = rgb(start)).r, (end = rgb(end)).r), g = color2(start.g, end.g), b = color2(start.b, end.b), opacity = nogamma(start.opacity, end.opacity);
    return function(t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }
  rgb2.gamma = rgbGamma;
  return rgb2;
})(1);
function rgbSpline(spline) {
  return function(colors) {
    var n = colors.length, r = new Array(n), g = new Array(n), b = new Array(n), i, color2;
    for (i = 0; i < n; ++i) {
      color2 = rgb(colors[i]);
      r[i] = color2.r || 0;
      g[i] = color2.g || 0;
      b[i] = color2.b || 0;
    }
    r = spline(r);
    g = spline(g);
    b = spline(b);
    color2.opacity = 1;
    return function(t) {
      color2.r = r(t);
      color2.g = g(t);
      color2.b = b(t);
      return color2 + "";
    };
  };
}
var rgbBasis = rgbSpline(basis_default);
var rgbBasisClosed = rgbSpline(basisClosed_default);

// node_modules/d3-interpolate/src/numberArray.js
function numberArray_default(a, b) {
  if (!b) b = [];
  var n = a ? Math.min(b.length, a.length) : 0, c = b.slice(), i;
  return function(t) {
    for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
    return c;
  };
}
function isNumberArray(x) {
  return ArrayBuffer.isView(x) && !(x instanceof DataView);
}

// node_modules/d3-interpolate/src/array.js
function genericArray(a, b) {
  var nb = b ? b.length : 0, na = a ? Math.min(nb, a.length) : 0, x = new Array(na), c = new Array(nb), i;
  for (i = 0; i < na; ++i) x[i] = value_default(a[i], b[i]);
  for (; i < nb; ++i) c[i] = b[i];
  return function(t) {
    for (i = 0; i < na; ++i) c[i] = x[i](t);
    return c;
  };
}

// node_modules/d3-interpolate/src/date.js
function date_default(a, b) {
  var d = /* @__PURE__ */ new Date();
  return a = +a, b = +b, function(t) {
    return d.setTime(a * (1 - t) + b * t), d;
  };
}

// node_modules/d3-interpolate/src/number.js
function number_default(a, b) {
  return a = +a, b = +b, function(t) {
    return a * (1 - t) + b * t;
  };
}

// node_modules/d3-interpolate/src/object.js
function object_default(a, b) {
  var i = {}, c = {}, k;
  if (a === null || typeof a !== "object") a = {};
  if (b === null || typeof b !== "object") b = {};
  for (k in b) {
    if (k in a) {
      i[k] = value_default(a[k], b[k]);
    } else {
      c[k] = b[k];
    }
  }
  return function(t) {
    for (k in i) c[k] = i[k](t);
    return c;
  };
}

// node_modules/d3-interpolate/src/string.js
var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB = new RegExp(reA.source, "g");
function zero2(b) {
  return function() {
    return b;
  };
}
function one(b) {
  return function(t) {
    return b(t) + "";
  };
}
function string_default(a, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0, am, bm, bs, i = -1, s = [], q = [];
  a = a + "", b = b + "";
  while ((am = reA.exec(a)) && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) {
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs;
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) {
      if (s[i]) s[i] += bm;
      else s[++i] = bm;
    } else {
      s[++i] = null;
      q.push({ i, x: number_default(am, bm) });
    }
    bi = reB.lastIndex;
  }
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs;
    else s[++i] = bs;
  }
  return s.length < 2 ? q[0] ? one(q[0].x) : zero2(b) : (b = q.length, function(t) {
    for (var i2 = 0, o; i2 < b; ++i2) s[(o = q[i2]).i] = o.x(t);
    return s.join("");
  });
}

// node_modules/d3-interpolate/src/value.js
function value_default(a, b) {
  var t = typeof b, c;
  return b == null || t === "boolean" ? constant_default(b) : (t === "number" ? number_default : t === "string" ? (c = color(b)) ? (b = c, rgb_default) : string_default : b instanceof color ? rgb_default : b instanceof Date ? date_default : isNumberArray(b) ? numberArray_default : Array.isArray(b) ? genericArray : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object_default : number_default)(a, b);
}

// node_modules/d3-interpolate/src/round.js
function round_default(a, b) {
  return a = +a, b = +b, function(t) {
    return Math.round(a * (1 - t) + b * t);
  };
}

// node_modules/d3-scale/src/constant.js
function constants(x) {
  return function() {
    return x;
  };
}

// node_modules/d3-scale/src/number.js
function number2(x) {
  return +x;
}

// node_modules/d3-scale/src/continuous.js
var unit = [0, 1];
function identity(x) {
  return x;
}
function normalize(a, b) {
  return (b -= a = +a) ? function(x) {
    return (x - a) / b;
  } : constants(isNaN(b) ? NaN : 0.5);
}
function clamper(a, b) {
  var t;
  if (a > b) t = a, a = b, b = t;
  return function(x) {
    return Math.max(a, Math.min(b, x));
  };
}
function bimap(domain, range, interpolate) {
  var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
  if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate(r1, r0);
  else d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
  return function(x) {
    return r0(d0(x));
  };
}
function polymap(domain, range, interpolate) {
  var j = Math.min(domain.length, range.length) - 1, d = new Array(j), r = new Array(j), i = -1;
  if (domain[j] < domain[0]) {
    domain = domain.slice().reverse();
    range = range.slice().reverse();
  }
  while (++i < j) {
    d[i] = normalize(domain[i], domain[i + 1]);
    r[i] = interpolate(range[i], range[i + 1]);
  }
  return function(x) {
    var i2 = bisect_default(domain, x, 1, j) - 1;
    return r[i2](d[i2](x));
  };
}
function copy(source, target) {
  return target.domain(source.domain()).range(source.range()).interpolate(source.interpolate()).clamp(source.clamp()).unknown(source.unknown());
}
function transformer() {
  var domain = unit, range = unit, interpolate = value_default, transform, untransform, unknown, clamp = identity, piecewise, output, input;
  function rescale() {
    var n = Math.min(domain.length, range.length);
    if (clamp !== identity) clamp = clamper(domain[0], domain[n - 1]);
    piecewise = n > 2 ? polymap : bimap;
    output = input = null;
    return scale;
  }
  function scale(x) {
    return x == null || isNaN(x = +x) ? unknown : (output || (output = piecewise(domain.map(transform), range, interpolate)))(transform(clamp(x)));
  }
  scale.invert = function(y) {
    return clamp(untransform((input || (input = piecewise(range, domain.map(transform), number_default)))(y)));
  };
  scale.domain = function(_) {
    return arguments.length ? (domain = Array.from(_, number2), rescale()) : domain.slice();
  };
  scale.range = function(_) {
    return arguments.length ? (range = Array.from(_), rescale()) : range.slice();
  };
  scale.rangeRound = function(_) {
    return range = Array.from(_), interpolate = round_default, rescale();
  };
  scale.clamp = function(_) {
    return arguments.length ? (clamp = _ ? true : identity, rescale()) : clamp !== identity;
  };
  scale.interpolate = function(_) {
    return arguments.length ? (interpolate = _, rescale()) : interpolate;
  };
  scale.unknown = function(_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };
  return function(t, u) {
    transform = t, untransform = u;
    return rescale();
  };
}
function continuous() {
  return transformer()(identity, identity);
}

// node_modules/d3-format/src/formatDecimal.js
function formatDecimal_default(x) {
  return Math.abs(x = Math.round(x)) >= 1e21 ? x.toLocaleString("en").replace(/,/g, "") : x.toString(10);
}
function formatDecimalParts(x, p) {
  if (!isFinite(x) || x === 0) return null;
  var i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e"), coefficient = x.slice(0, i);
  return [
    coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
    +x.slice(i + 1)
  ];
}

// node_modules/d3-format/src/exponent.js
function exponent_default(x) {
  return x = formatDecimalParts(Math.abs(x)), x ? x[1] : NaN;
}

// node_modules/d3-format/src/formatGroup.js
function formatGroup_default(grouping, thousands) {
  return function(value, width) {
    var i = value.length, t = [], j = 0, g = grouping[0], length = 0;
    while (i > 0 && g > 0) {
      if (length + g + 1 > width) g = Math.max(1, width - length);
      t.push(value.substring(i -= g, i + g));
      if ((length += g + 1) > width) break;
      g = grouping[j = (j + 1) % grouping.length];
    }
    return t.reverse().join(thousands);
  };
}

// node_modules/d3-format/src/formatNumerals.js
function formatNumerals_default(numerals) {
  return function(value) {
    return value.replace(/[0-9]/g, function(i) {
      return numerals[+i];
    });
  };
}

// node_modules/d3-format/src/formatSpecifier.js
var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;
function formatSpecifier(specifier) {
  if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
  var match;
  return new FormatSpecifier({
    fill: match[1],
    align: match[2],
    sign: match[3],
    symbol: match[4],
    zero: match[5],
    width: match[6],
    comma: match[7],
    precision: match[8] && match[8].slice(1),
    trim: match[9],
    type: match[10]
  });
}
formatSpecifier.prototype = FormatSpecifier.prototype;
function FormatSpecifier(specifier) {
  this.fill = specifier.fill === void 0 ? " " : specifier.fill + "";
  this.align = specifier.align === void 0 ? ">" : specifier.align + "";
  this.sign = specifier.sign === void 0 ? "-" : specifier.sign + "";
  this.symbol = specifier.symbol === void 0 ? "" : specifier.symbol + "";
  this.zero = !!specifier.zero;
  this.width = specifier.width === void 0 ? void 0 : +specifier.width;
  this.comma = !!specifier.comma;
  this.precision = specifier.precision === void 0 ? void 0 : +specifier.precision;
  this.trim = !!specifier.trim;
  this.type = specifier.type === void 0 ? "" : specifier.type + "";
}
FormatSpecifier.prototype.toString = function() {
  return this.fill + this.align + this.sign + this.symbol + (this.zero ? "0" : "") + (this.width === void 0 ? "" : Math.max(1, this.width | 0)) + (this.comma ? "," : "") + (this.precision === void 0 ? "" : "." + Math.max(0, this.precision | 0)) + (this.trim ? "~" : "") + this.type;
};

// node_modules/d3-format/src/formatTrim.js
function formatTrim_default(s) {
  out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
    switch (s[i]) {
      case ".":
        i0 = i1 = i;
        break;
      case "0":
        if (i0 === 0) i0 = i;
        i1 = i;
        break;
      default:
        if (!+s[i]) break out;
        if (i0 > 0) i0 = 0;
        break;
    }
  }
  return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
}

// node_modules/d3-format/src/formatPrefixAuto.js
var prefixExponent;
function formatPrefixAuto_default(x, p) {
  var d = formatDecimalParts(x, p);
  if (!d) return prefixExponent = void 0, x.toPrecision(p);
  var coefficient = d[0], exponent = d[1], i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1, n = coefficient.length;
  return i === n ? coefficient : i > n ? coefficient + new Array(i - n + 1).join("0") : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i) : "0." + new Array(1 - i).join("0") + formatDecimalParts(x, Math.max(0, p + i - 1))[0];
}

// node_modules/d3-format/src/formatRounded.js
function formatRounded_default(x, p) {
  var d = formatDecimalParts(x, p);
  if (!d) return x + "";
  var coefficient = d[0], exponent = d[1];
  return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1) : coefficient + new Array(exponent - coefficient.length + 2).join("0");
}

// node_modules/d3-format/src/formatTypes.js
var formatTypes_default = {
  "%": (x, p) => (x * 100).toFixed(p),
  "b": (x) => Math.round(x).toString(2),
  "c": (x) => x + "",
  "d": formatDecimal_default,
  "e": (x, p) => x.toExponential(p),
  "f": (x, p) => x.toFixed(p),
  "g": (x, p) => x.toPrecision(p),
  "o": (x) => Math.round(x).toString(8),
  "p": (x, p) => formatRounded_default(x * 100, p),
  "r": formatRounded_default,
  "s": formatPrefixAuto_default,
  "X": (x) => Math.round(x).toString(16).toUpperCase(),
  "x": (x) => Math.round(x).toString(16)
};

// node_modules/d3-format/src/identity.js
function identity_default(x) {
  return x;
}

// node_modules/d3-format/src/locale.js
var map = Array.prototype.map;
var prefixes = ["y", "z", "a", "f", "p", "n", "\xB5", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y"];
function locale_default(locale2) {
  var group = locale2.grouping === void 0 || locale2.thousands === void 0 ? identity_default : formatGroup_default(map.call(locale2.grouping, Number), locale2.thousands + ""), currencyPrefix = locale2.currency === void 0 ? "" : locale2.currency[0] + "", currencySuffix = locale2.currency === void 0 ? "" : locale2.currency[1] + "", decimal = locale2.decimal === void 0 ? "." : locale2.decimal + "", numerals = locale2.numerals === void 0 ? identity_default : formatNumerals_default(map.call(locale2.numerals, String)), percent = locale2.percent === void 0 ? "%" : locale2.percent + "", minus = locale2.minus === void 0 ? "\u2212" : locale2.minus + "", nan = locale2.nan === void 0 ? "NaN" : locale2.nan + "";
  function newFormat(specifier, options) {
    specifier = formatSpecifier(specifier);
    var fill = specifier.fill, align = specifier.align, sign = specifier.sign, symbol = specifier.symbol, zero3 = specifier.zero, width = specifier.width, comma = specifier.comma, precision = specifier.precision, trim = specifier.trim, type = specifier.type;
    if (type === "n") comma = true, type = "g";
    else if (!formatTypes_default[type]) precision === void 0 && (precision = 12), trim = true, type = "g";
    if (zero3 || fill === "0" && align === "=") zero3 = true, fill = "0", align = "=";
    var prefix = (options && options.prefix !== void 0 ? options.prefix : "") + (symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : ""), suffix = (symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "") + (options && options.suffix !== void 0 ? options.suffix : "");
    var formatType = formatTypes_default[type], maybeSuffix = /[defgprs%]/.test(type);
    precision = precision === void 0 ? 6 : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision)) : Math.max(0, Math.min(20, precision));
    function format2(value) {
      var valuePrefix = prefix, valueSuffix = suffix, i, n, c;
      if (type === "c") {
        valueSuffix = formatType(value) + valueSuffix;
        value = "";
      } else {
        value = +value;
        var valueNegative = value < 0 || 1 / value < 0;
        value = isNaN(value) ? nan : formatType(Math.abs(value), precision);
        if (trim) value = formatTrim_default(value);
        if (valueNegative && +value === 0 && sign !== "+") valueNegative = false;
        valuePrefix = (valueNegative ? sign === "(" ? sign : minus : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
        valueSuffix = (type === "s" && !isNaN(value) && prefixExponent !== void 0 ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");
        if (maybeSuffix) {
          i = -1, n = value.length;
          while (++i < n) {
            if (c = value.charCodeAt(i), 48 > c || c > 57) {
              valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
              value = value.slice(0, i);
              break;
            }
          }
        }
      }
      if (comma && !zero3) value = group(value, Infinity);
      var length = valuePrefix.length + value.length + valueSuffix.length, padding = length < width ? new Array(width - length + 1).join(fill) : "";
      if (comma && zero3) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";
      switch (align) {
        case "<":
          value = valuePrefix + value + valueSuffix + padding;
          break;
        case "=":
          value = valuePrefix + padding + value + valueSuffix;
          break;
        case "^":
          value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
          break;
        default:
          value = padding + valuePrefix + value + valueSuffix;
          break;
      }
      return numerals(value);
    }
    format2.toString = function() {
      return specifier + "";
    };
    return format2;
  }
  function formatPrefix2(specifier, value) {
    var e = Math.max(-8, Math.min(8, Math.floor(exponent_default(value) / 3))) * 3, k = Math.pow(10, -e), f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier), { suffix: prefixes[8 + e / 3] });
    return function(value2) {
      return f(k * value2);
    };
  }
  return {
    format: newFormat,
    formatPrefix: formatPrefix2
  };
}

// node_modules/d3-format/src/defaultLocale.js
var locale;
var format;
var formatPrefix;
defaultLocale({
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});
function defaultLocale(definition) {
  locale = locale_default(definition);
  format = locale.format;
  formatPrefix = locale.formatPrefix;
  return locale;
}

// node_modules/d3-format/src/precisionFixed.js
function precisionFixed_default(step) {
  return Math.max(0, -exponent_default(Math.abs(step)));
}

// node_modules/d3-format/src/precisionPrefix.js
function precisionPrefix_default(step, value) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent_default(value) / 3))) * 3 - exponent_default(Math.abs(step)));
}

// node_modules/d3-format/src/precisionRound.js
function precisionRound_default(step, max) {
  step = Math.abs(step), max = Math.abs(max) - step;
  return Math.max(0, exponent_default(max) - exponent_default(step)) + 1;
}

// node_modules/d3-scale/src/tickFormat.js
function tickFormat(start, stop, count, specifier) {
  var step = tickStep(start, stop, count), precision;
  specifier = formatSpecifier(specifier == null ? ",f" : specifier);
  switch (specifier.type) {
    case "s": {
      var value = Math.max(Math.abs(start), Math.abs(stop));
      if (specifier.precision == null && !isNaN(precision = precisionPrefix_default(step, value))) specifier.precision = precision;
      return formatPrefix(specifier, value);
    }
    case "":
    case "e":
    case "g":
    case "p":
    case "r": {
      if (specifier.precision == null && !isNaN(precision = precisionRound_default(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
      break;
    }
    case "f":
    case "%": {
      if (specifier.precision == null && !isNaN(precision = precisionFixed_default(step))) specifier.precision = precision - (specifier.type === "%") * 2;
      break;
    }
  }
  return format(specifier);
}

// node_modules/d3-scale/src/linear.js
function linearish(scale) {
  var domain = scale.domain;
  scale.ticks = function(count) {
    var d = domain();
    return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
  };
  scale.tickFormat = function(count, specifier) {
    var d = domain();
    return tickFormat(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
  };
  scale.nice = function(count) {
    if (count == null) count = 10;
    var d = domain();
    var i0 = 0;
    var i1 = d.length - 1;
    var start = d[i0];
    var stop = d[i1];
    var prestep;
    var step;
    var maxIter = 10;
    if (stop < start) {
      step = start, start = stop, stop = step;
      step = i0, i0 = i1, i1 = step;
    }
    while (maxIter-- > 0) {
      step = tickIncrement(start, stop, count);
      if (step === prestep) {
        d[i0] = start;
        d[i1] = stop;
        return domain(d);
      } else if (step > 0) {
        start = Math.floor(start / step) * step;
        stop = Math.ceil(stop / step) * step;
      } else if (step < 0) {
        start = Math.ceil(start * step) / step;
        stop = Math.floor(stop * step) / step;
      } else {
        break;
      }
      prestep = step;
    }
    return scale;
  };
  return scale;
}
function linear2() {
  var scale = continuous();
  scale.copy = function() {
    return copy(scale, linear2());
  };
  initRange.apply(scale, arguments);
  return linearish(scale);
}

// site/instrument-src/types.ts
var MARK_ORDER = [
  "fault_onset",
  "first_detectable",
  "layer_actionable",
  "conv_escalation",
  "ticket",
  "service_impact",
  "recovery"
];
var MARK_CATEGORY = {
  fault_onset: "ground_truth",
  first_detectable: "decision_layer",
  layer_actionable: "decision_layer",
  conv_escalation: "conventional",
  ticket: "conventional",
  service_impact: "ground_truth",
  recovery: "ground_truth"
};
var MARK_LABEL = {
  fault_onset: "fault onset",
  first_detectable: "first detectable",
  layer_actionable: "decision-layer actionable",
  conv_escalation: "conventional escalation",
  ticket: "ticket exists",
  service_impact: "service impact",
  recovery: "recovery"
};

// site/instrument-src/timeline.ts
var SVG_NS = "http://www.w3.org/2000/svg";
var CATEGORY_COLOR = {
  ground_truth: "var(--text-0)",
  decision_layer: "var(--color-noc-decision)",
  conventional: "var(--color-noc-conventional)"
};
var CATEGORY_SHAPE = {
  ground_truth: "square",
  decision_layer: "diamond",
  conventional: "circle"
};
function el(tag, attrs = {}) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}
function shapeEl(shape, cx, cy, size, attrs = {}) {
  if (shape === "circle") return el("circle", { cx, cy, r: size / 2, ...attrs });
  if (shape === "square") {
    return el("rect", { x: cx - size / 2, y: cy - size / 2, width: size, height: size, rx: 1, ...attrs });
  }
  const r = size / 2 + 1;
  const points = `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
  return el("polygon", { points, ...attrs });
}
var GAP_BREAK_THRESHOLD_MIN = 40;
var BREAK_SYMBOL_WIDTH_PX = 26;
var FAR_SEGMENT_SHARE = 0.17;
function buildTimeScale(present, entry, pixelStart, pixelEnd, breakWidth = BREAK_SYMBOL_WIDTH_PX, farShare = FAR_SEGMENT_SHARE) {
  const p50s = present.map((k) => entry.marks[k].p50).filter((v) => v !== null).sort((a, b) => a - b);
  let splitIndex = -1;
  let maxGap = 0;
  for (let i = 1; i < p50s.length; i++) {
    const gap = p50s[i] - p50s[i - 1];
    if (gap > maxGap) {
      maxGap = gap;
      splitIndex = i;
    }
  }
  let lowP50s = [];
  let highP50s = p50s;
  if (splitIndex > 0 && maxGap > GAP_BREAK_THRESHOLD_MIN) {
    lowP50s = p50s.slice(0, splitIndex);
    highP50s = p50s.slice(splitIndex);
  }
  let coreP50s;
  let farP50s;
  let farSide;
  if (lowP50s.length === 0) {
    coreP50s = highP50s;
    farP50s = [];
    farSide = null;
  } else if (lowP50s.length >= highP50s.length) {
    coreP50s = lowP50s;
    farP50s = highP50s;
    farSide = "high";
  } else {
    coreP50s = highP50s;
    farP50s = lowP50s;
    farSide = "low";
  }
  const coreRawMin = Math.min(...coreP50s);
  const coreRawMax = Math.max(...coreP50s);
  const corePad = Math.max((coreRawMax - coreRawMin) * 0.25, 6);
  const coreMin = coreRawMin - corePad;
  const coreMax = coreRawMax + corePad;
  const totalPixels = pixelEnd - pixelStart;
  if (farSide === null) {
    const scale = linear2().domain([coreMin, coreMax]).range([pixelStart, pixelEnd]);
    const segments2 = [{ domain: [coreMin, coreMax], pixelRange: [pixelStart, pixelEnd] }];
    return {
      toPixel: (v) => scale(v),
      isOutOfRange: (v) => v < coreMin || v > coreMax,
      segments: segments2,
      breaks: [],
      coreDomain: [coreMin, coreMax]
    };
  }
  const farRawMin = Math.min(...farP50s);
  const farRawMax = Math.max(...farP50s);
  const farPad = Math.max((farRawMax - farRawMin) * 0.25, 4);
  const farDomain = farSide === "low" ? [farRawMin - farPad, Math.min(farRawMax + farPad, coreMin - 0.01)] : [Math.max(farRawMin - farPad, coreMax + 0.01), farRawMax + farPad];
  const farWidth = totalPixels * farShare;
  const coreWidth = totalPixels - farWidth - breakWidth;
  const segments = [];
  const breaks = [];
  let cursor = pixelStart;
  if (farSide === "low") {
    segments.push({ domain: farDomain, pixelRange: [cursor, cursor + farWidth] });
    cursor += farWidth;
    breaks.push({ side: "low", gapMin: coreMin - farDomain[1], pixelCenter: cursor + breakWidth / 2 });
    cursor += breakWidth;
    segments.push({ domain: [coreMin, coreMax], pixelRange: [cursor, cursor + coreWidth] });
  } else {
    segments.push({ domain: [coreMin, coreMax], pixelRange: [cursor, cursor + coreWidth] });
    cursor += coreWidth;
    breaks.push({ side: "high", gapMin: farDomain[0] - coreMax, pixelCenter: cursor + breakWidth / 2 });
    cursor += breakWidth;
    segments.push({ domain: farDomain, pixelRange: [cursor, cursor + farWidth] });
  }
  function toPixel(value) {
    for (const seg of segments) {
      if (value >= seg.domain[0] - 1e-6 && value <= seg.domain[1] + 1e-6) {
        const [d0, d1] = seg.domain;
        const [p0, p1] = seg.pixelRange;
        if (d1 === d0) return (p0 + p1) / 2;
        return p0 + (value - d0) / (d1 - d0) * (p1 - p0);
      }
    }
    if (value < segments[0].domain[0]) return segments[0].pixelRange[0];
    return segments[segments.length - 1].pixelRange[1];
  }
  function isOutOfRange(value) {
    return !segments.some((seg) => value >= seg.domain[0] - 1e-6 && value <= seg.domain[1] + 1e-6);
  }
  return { toPixel, isOutOfRange, segments, breaks, coreDomain: [coreMin, coreMax] };
}
var TIME_TIE_PX = 6;
function estimateLabelWidth(cluster, sameTime) {
  const CHAR_PX = 7.8;
  const timeText = "t=000 min";
  let width = sameTime ? timeText.length * CHAR_PX : 0;
  for (const k of cluster) {
    const nameW = MARK_LABEL[k].length * CHAR_PX;
    const rowW = sameTime ? nameW : Math.max(timeText.length * CHAR_PX, nameW);
    width = Math.max(width, rowW);
  }
  return width + 14;
}
function layoutLabels(points) {
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const merged = [];
  for (const p of sorted) {
    const last = merged.at(-1);
    if (last && p.x - last.x < TIME_TIE_PX) {
      last.keys.push(p.key);
      last.x = (last.x * (last.keys.length - 1) + p.x) / last.keys.length;
    } else {
      merged.push({ keys: [p.key], x: p.x, widthPx: 0, lane: 0 });
    }
  }
  for (const c of merged) c.widthPx = estimateLabelWidth(c.keys, c.keys.length > 1);
  const laneRightEdge = [];
  for (const c of merged) {
    const left = c.x - c.widthPx / 2;
    const right = c.x + c.widthPx / 2;
    let placed = false;
    for (let lane = 0; lane < laneRightEdge.length; lane++) {
      if (left > (laneRightEdge[lane] ?? -Infinity)) {
        c.lane = lane;
        laneRightEdge[lane] = right;
        placed = true;
        break;
      }
    }
    if (!placed) {
      c.lane = laneRightEdge.length;
      laneRightEdge.push(right);
    }
  }
  return merged;
}
function renderTimeline(container, entry, options) {
  container.innerHTML = "";
  container.setAttribute("role", "img");
  container.setAttribute(
    "aria-label",
    `Incident timeline for ${entry.domain} / ${entry.scenario}. An accessible data table with the same values follows this figure.`
  );
  const present = MARK_ORDER.filter((k) => entry.marks[k].n > 0);
  const absent = MARK_ORDER.filter((k) => entry.marks[k].n === 0);
  if (present.length === 0) {
    const p = document.createElement("p");
    p.className = "tl-empty-state";
    p.textContent = "No marks recorded for this (domain, scenario, configuration) combination.";
    container.appendChild(p);
    return;
  }
  if (options.orientation === "vertical") {
    renderVertical(container, entry, present, absent, options);
  } else {
    renderHorizontal(container, entry, present, absent, options);
  }
  container.appendChild(buildAccessibleTable(entry, present, absent));
}
function windowBandInfo(entry) {
  const la = entry.marks.layer_actionable;
  const ce = entry.marks.conv_escalation;
  if (la.p50 === null || ce.p50 === null) return null;
  const inverted = ce.p50 < la.p50;
  return {
    start: Math.min(la.p50, ce.p50),
    end: Math.max(la.p50, ce.p50),
    inverted,
    durationMin: entry.window_min.p50 ?? ce.p50 - la.p50,
    n: entry.window_min.n
  };
}
function renderHorizontal(container, entry, present, absent, options) {
  const width = 920;
  const trackY = 150;
  const marginX = 90;
  const height = 320;
  const scale = buildTimeScale(present, entry, marginX, width - marginX);
  const x = (v) => scale.toPixel(v);
  const svg = el("svg", { viewBox: `0 0 ${width} ${height}`, width: "100%", role: "presentation" });
  svg.style.overflow = "visible";
  svg.style.display = "block";
  const band = windowBandInfo(entry);
  if (band) {
    const bx1 = x(band.start);
    const bx2 = x(band.end);
    const rect = el("rect", {
      x: Math.min(bx1, bx2),
      y: trackY - 34,
      width: Math.max(Math.abs(bx2 - bx1), 1),
      height: 68,
      fill: band.inverted ? "rgba(199, 107, 107, 0.14)" : "rgba(53, 198, 222, 0.10)",
      stroke: band.inverted ? "rgba(199, 107, 107, 0.55)" : "rgba(53, 198, 222, 0.45)",
      "stroke-width": 1,
      "stroke-dasharray": band.inverted ? "3 3" : ""
    });
    svg.appendChild(rect);
    const labelY = trackY - 46;
    const label = el("text", {
      x: (bx1 + bx2) / 2,
      y: labelY,
      "text-anchor": "middle",
      class: "tl-window-label tl-anchor-middle"
    });
    const durLine = document.createElementNS(SVG_NS, "tspan");
    durLine.setAttribute("x", String((bx1 + bx2) / 2));
    durLine.textContent = band.inverted ? `INVERTED \u2014 conventional escalated ${Math.abs(band.durationMin)} min before the decision layer was actionable` : `pre-escalation window: ${band.durationMin} min`;
    durLine.setAttribute("class", "tl-window-label-main");
    label.appendChild(durLine);
    const nLine = document.createElementNS(SVG_NS, "tspan");
    nLine.setAttribute("x", String((bx1 + bx2) / 2));
    nLine.setAttribute("dy", "13");
    nLine.setAttribute("class", "tl-window-label-n");
    nLine.textContent = `n=${band.n} of ${entry.seeds.length} runs`;
    label.appendChild(nLine);
    svg.appendChild(label);
  } else {
    const note = el("text", { x: width / 2, y: trackY - 40, class: "tl-window-label-main tl-anchor-middle" });
    note.textContent = "pre-escalation window: not computable \u2014 decision-layer-actionable or conventional-escalation mark absent";
    svg.appendChild(note);
  }
  for (const seg of scale.segments) {
    svg.appendChild(el("line", { x1: seg.pixelRange[0], x2: seg.pixelRange[1], y1: trackY, y2: trackY, stroke: "var(--border-strong)", "stroke-width": 1 }));
  }
  for (const brk of scale.breaks) {
    const bx = brk.pixelCenter;
    for (const dx of [-4, 4]) {
      svg.appendChild(el("line", { x1: bx + dx - 3, x2: bx + dx + 3, y1: trackY + 6, y2: trackY - 6, stroke: "var(--plane-0)", "stroke-width": 3 }));
      svg.appendChild(el("line", { x1: bx + dx - 3, x2: bx + dx + 3, y1: trackY + 6, y2: trackY - 6, stroke: "var(--text-1)", "stroke-width": 1.4 }));
    }
    const gapLabel = el("text", { x: bx, y: trackY + 20, class: "tl-break-label tl-anchor-middle" });
    gapLabel.textContent = `${Math.round(brk.gapMin)} min compressed`;
    svg.appendChild(gapLabel);
  }
  for (const key of present) {
    for (const s of entry.seeds) {
      const v = s.marks[key];
      if (v === null) continue;
      const isHighlighted = options.highlightedSeed === s.seed;
      const tick = el("line", {
        x1: x(v),
        x2: x(v),
        y1: trackY - 5,
        y2: trackY + 5,
        stroke: isHighlighted ? CATEGORY_COLOR[MARK_CATEGORY[key]] ?? "var(--text-1)" : "var(--text-2)",
        "stroke-width": isHighlighted ? 1.5 : 0.6,
        opacity: isHighlighted ? 0.9 : 0.18,
        class: "tl-seed-tick",
        "data-seed": String(s.seed)
      });
      svg.appendChild(tick);
    }
  }
  const points = present.map((key) => ({ key, x: x(entry.marks[key].p50) }));
  for (const key of present) {
    const q = entry.marks[key];
    const cat = MARK_CATEGORY[key];
    const color2 = CATEGORY_COLOR[cat] ?? "var(--text-1)";
    const cx = x(q.p50);
    if (q.p25 !== null && q.p75 !== null && q.p25 !== q.p75) {
      const STUB_PX = 22;
      const p25Out = scale.isOutOfRange(q.p25);
      const p75Out = scale.isOutOfRange(q.p75);
      const lineX1 = p25Out ? cx - STUB_PX : x(q.p25);
      const lineX2 = p75Out ? cx + STUB_PX : x(q.p75);
      svg.appendChild(
        el("line", { x1: lineX1, x2: lineX2, y1: trackY, y2: trackY, stroke: color2, "stroke-width": 4, opacity: 0.28, "stroke-linecap": "round" })
      );
      for (const [val, isHigh, outOfRange] of [[q.p25, false, p25Out], [q.p75, true, p75Out]]) {
        if (!outOfRange) continue;
        const stubEnd = isHigh ? cx + STUB_PX : cx - STUB_PX;
        const dir = isHigh ? 1 : -1;
        svg.appendChild(el("polygon", { points: `${stubEnd},${trackY - 5} ${stubEnd},${trackY + 5} ${stubEnd + dir * 7},${trackY}`, fill: color2, opacity: 0.7 }));
        const tailLabel = el("text", { x: stubEnd, y: trackY - 16, class: "tl-tail-label tl-anchor-middle", fill: color2 });
        tailLabel.textContent = `${isHigh ? "p75" : "p25"}: ${Math.round(val)} min`;
        svg.appendChild(tailLabel);
      }
    }
    const marker = shapeEl(CATEGORY_SHAPE[cat] ?? "circle", cx, trackY, 11, { fill: color2, stroke: "var(--plane-0)", "stroke-width": 2 });
    marker.setAttribute("data-mark", key);
    svg.appendChild(marker);
  }
  const LANE_HEIGHT = 54;
  const clusters = layoutLabels(points);
  const maxLane = Math.max(0, ...clusters.map((c) => c.lane));
  for (const cluster of clusters) {
    const sameTime = cluster.keys.length > 1;
    const baseY = trackY + 30 + cluster.lane * LANE_HEIGHT;
    if (cluster.lane > 0) {
      svg.appendChild(el("line", { x1: cluster.x, x2: cluster.x, y1: trackY + 7, y2: baseY - 9, stroke: "var(--border-strong)", "stroke-width": 1, "stroke-dasharray": "2 2" }));
    }
    let ty = baseY;
    if (sameTime) {
      const t = el("text", { x: cluster.x, y: ty, class: "tl-mark-time tl-anchor-middle" });
      t.textContent = `t=${Math.round(entry.marks[cluster.keys[0]].p50)} min`;
      svg.appendChild(t);
      ty += 15;
    }
    for (const key of cluster.keys) {
      const cat = MARK_CATEGORY[key];
      const color2 = CATEGORY_COLOR[cat] ?? "var(--text-1)";
      if (!sameTime) {
        const t = el("text", { x: cluster.x, y: ty, class: "tl-mark-time tl-anchor-middle" });
        t.textContent = `t=${Math.round(entry.marks[key].p50)} min`;
        svg.appendChild(t);
        ty += 15;
      }
      const label = el("text", { x: cluster.x, y: ty, class: "tl-mark-name tl-anchor-middle", fill: color2 });
      label.textContent = MARK_LABEL[key];
      svg.appendChild(label);
      ty += 14;
    }
  }
  svg.setAttribute("viewBox", `0 0 ${width} ${Math.max(height, trackY + 40 + (maxLane + 1) * LANE_HEIGHT)}`);
  container.appendChild(svg);
  container.appendChild(buildLegend());
  if (absent.length > 0) container.appendChild(buildAbsenceNote(entry, absent));
  if (options.onSeedClick) {
    svg.addEventListener("click", (ev) => {
      const target = ev.target;
      const seedAttr = target.getAttribute("data-seed");
      options.onSeedClick(seedAttr ? Number(seedAttr) : null);
    });
  }
}
function renderVertical(container, entry, present, absent, options) {
  const rowHeight = 62;
  const microScaleW = 70;
  const height = present.length * rowHeight + 30;
  const width = 340;
  const microX = width - microScaleW - 16;
  const scale = buildTimeScale(present, entry, 0, microScaleW);
  const [microDomainMin, microDomainMax] = scale.coreDomain;
  const micro = linear2().domain([microDomainMin, microDomainMax]).range([0, microScaleW]).clamp(true);
  const svg = el("svg", { viewBox: `0 0 ${width} ${height}`, width: "100%", role: "presentation" });
  svg.style.display = "block";
  const rowY = (key) => 24 + present.indexOf(key) * rowHeight;
  const band = windowBandInfo(entry);
  if (band && present.includes("layer_actionable") && present.includes("conv_escalation")) {
    const y1 = rowY("layer_actionable");
    const y2 = rowY("conv_escalation");
    svg.appendChild(
      el("rect", {
        x: 8,
        y: Math.min(y1, y2) - 14,
        width: width - 16,
        height: Math.abs(y2 - y1) + 28,
        fill: band.inverted ? "rgba(199, 107, 107, 0.10)" : "rgba(53, 198, 222, 0.07)",
        stroke: band.inverted ? "rgba(199, 107, 107, 0.5)" : "rgba(53, 198, 222, 0.4)",
        "stroke-width": 1,
        "stroke-dasharray": band.inverted ? "3 3" : "",
        rx: 6
      })
    );
  }
  for (const key of present) {
    const q = entry.marks[key];
    const cat = MARK_CATEGORY[key];
    const color2 = CATEGORY_COLOR[cat] ?? "var(--text-1)";
    const cy = rowY(key);
    svg.appendChild(shapeEl(CATEGORY_SHAPE[cat] ?? "circle", 24, cy, 12, { fill: color2, stroke: "var(--plane-0)", "stroke-width": 2 }));
    const t1 = el("text", { x: 46, y: cy - 4, class: "tl-mark-time tl-anchor-start" });
    t1.textContent = `t=${Math.round(q.p50)} min`;
    svg.appendChild(t1);
    const t2 = el("text", { x: 46, y: cy + 12, class: "tl-mark-name tl-anchor-start", fill: color2 });
    t2.textContent = MARK_LABEL[key];
    svg.appendChild(t2);
    svg.appendChild(el("line", { x1: microX, x2: microX + microScaleW, y1: cy, y2: cy, stroke: "var(--border-recessed)", "stroke-width": 1 }));
    for (const s of entry.seeds) {
      const v = s.marks[key];
      if (v === null) continue;
      const isHighlighted = options.highlightedSeed === s.seed;
      svg.appendChild(
        el("line", {
          x1: microX + micro(v),
          x2: microX + micro(v),
          y1: cy - 4,
          y2: cy + 4,
          stroke: isHighlighted ? color2 : "var(--text-2)",
          "stroke-width": isHighlighted ? 1.3 : 0.6,
          opacity: isHighlighted ? 0.9 : 0.22,
          class: "tl-seed-tick",
          "data-seed": String(s.seed)
        })
      );
    }
    if (q.p25 !== null && q.p75 !== null && q.p25 !== q.p75) {
      svg.appendChild(
        el("line", { x1: microX + micro(q.p25), x2: microX + micro(q.p75), y1: cy, y2: cy, stroke: color2, "stroke-width": 3, opacity: 0.35, "stroke-linecap": "round" })
      );
    }
    svg.appendChild(el("circle", { cx: microX + micro(q.p50), cy, r: 2.5, fill: color2 }));
    if (present.indexOf(key) < present.length - 1) {
      svg.appendChild(el("line", { x1: 8, x2: width - 8, y1: cy + rowHeight / 2, y2: cy + rowHeight / 2, stroke: "var(--border-recessed)", "stroke-width": 1 }));
    }
  }
  container.appendChild(svg);
  if (band) {
    const bandLabel = document.createElement("p");
    bandLabel.className = band.inverted ? "tl-window-label-main tl-inverted" : "tl-window-label-main";
    bandLabel.textContent = band.inverted ? `INVERTED \u2014 conventional escalated ${Math.abs(band.durationMin)} min before the decision layer was actionable (n=${band.n})` : `Pre-escalation window: ${band.durationMin} min (n=${band.n} of ${entry.seeds.length} runs)`;
    container.insertBefore(bandLabel, svg);
  }
  container.appendChild(buildLegend());
  if (absent.length > 0) container.appendChild(buildAbsenceNote(entry, absent));
}
function buildLegend() {
  const wrap = document.createElement("div");
  wrap.className = "tl-legend";
  wrap.setAttribute("role", "note");
  const items = [
    { cat: "ground_truth", label: "ground truth (fault onset, service impact, recovery)" },
    { cat: "decision_layer", label: "decision layer (first detectable, actionable)" },
    { cat: "conventional", label: "conventional (escalation, ticket)" }
  ];
  for (const { cat, label } of items) {
    const span = document.createElement("span");
    span.className = "tl-legend-item";
    const swatch = document.createElement("span");
    swatch.className = `tl-legend-swatch tl-shape-${CATEGORY_SHAPE[cat]}`;
    swatch.style.background = CATEGORY_COLOR[cat] ?? "";
    span.appendChild(swatch);
    span.appendChild(document.createTextNode(label));
    wrap.appendChild(span);
  }
  return wrap;
}
function buildAbsenceNote(entry, absent) {
  const wrap = document.createElement("div");
  wrap.className = "tl-absence-note";
  for (const key of absent) {
    const p = document.createElement("p");
    p.textContent = `${MARK_LABEL[key]}: not recorded in any of ${entry.seeds.length} runs at this configuration.`;
    wrap.appendChild(p);
  }
  return wrap;
}
function buildAccessibleTable(entry, present, absent) {
  const details = document.createElement("details");
  details.className = "tl-table-details";
  const summary = document.createElement("summary");
  summary.textContent = "Accessible data table (same values as the timeline above)";
  details.appendChild(summary);
  const table = document.createElement("table");
  table.className = "tl-table";
  const caption = document.createElement("caption");
  caption.textContent = `Timeline marks \u2014 ${entry.domain} / ${entry.scenario}, ${entry.seeds.length} seeds`;
  table.appendChild(caption);
  const thead = document.createElement("thead");
  thead.innerHTML = '<tr><th scope="col">Mark</th><th scope="col">Category</th><th scope="col">Median (min)</th><th scope="col">IQR (min)</th><th scope="col">n</th></tr>';
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  for (const key of MARK_ORDER) {
    const q = entry.marks[key];
    const tr = document.createElement("tr");
    const cat = MARK_CATEGORY[key].replace("_", " ");
    if (q.n === 0) {
      tr.innerHTML = `<th scope="row">${MARK_LABEL[key]}</th><td>${cat}</td><td colspan="2">not recorded in any of ${entry.seeds.length} runs</td><td>0</td>`;
    } else {
      tr.innerHTML = `<th scope="row">${MARK_LABEL[key]}</th><td>${cat}</td><td>${q.p50}</td><td>${q.p25}\u2013${q.p75}</td><td>${q.n}</td>`;
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  const scrollWrap = document.createElement("div");
  scrollWrap.className = "tl-table-scroll";
  scrollWrap.appendChild(table);
  details.appendChild(scrollWrap);
  const band = windowBandInfo(entry);
  const bandP = document.createElement("p");
  bandP.className = "tl-table-window";
  if (band) {
    bandP.textContent = band.inverted ? `Pre-escalation window: INVERTED. Conventional escalation preceded decision-layer-actionable by ${Math.abs(band.durationMin)} min (n=${band.n} of ${entry.seeds.length} runs).` : `Pre-escalation window: ${band.durationMin} min (n=${band.n} of ${entry.seeds.length} runs).`;
  } else {
    bandP.textContent = "Pre-escalation window: not computable at this configuration.";
  }
  details.appendChild(bandP);
  void absent;
  return details;
}

// site/instrument-src/sensitivityCurve.ts
var SVG_NS2 = "http://www.w3.org/2000/svg";
function el2(tag, attrs = {}) {
  const e = document.createElementNS(SVG_NS2, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}
function renderSensitivityCurve(container, data, domain) {
  container.innerHTML = "";
  const selfClearingScenarios = new Set(
    data.entries.filter((e) => e.domain === domain && e.rates.conv_unnecessary_escalation.scope === "self_clearing").map((e) => e.scenario)
  );
  if (selfClearingScenarios.size === 0) {
    const p = document.createElement("p");
    p.className = "sc-empty";
    p.textContent = `No self-clearing scenario in ${domain} for this axis.`;
    container.appendChild(p);
    return;
  }
  const byConfig = /* @__PURE__ */ new Map();
  for (const e of data.entries) {
    if (e.domain !== domain || !selfClearingScenarios.has(e.scenario)) continue;
    const cur = byConfig.get(e.config_id) ?? { convNum: 0, layerNum: 0, n: 0, window: [] };
    const n = e.rates.conv_unnecessary_escalation.n;
    cur.convNum += e.rates.conv_unnecessary_escalation.value * n;
    cur.layerNum += e.rates.layer_unnecessary_escalation.value * n;
    cur.n += n;
    if (e.window_min.p50 !== null) cur.window.push(e.window_min.p50);
    byConfig.set(e.config_id, cur);
  }
  const points = [...byConfig.entries()].map(([configId, v]) => {
    const cfg = data.comparator_configs.find((c) => c.id === configId);
    return {
      configId,
      convRate: v.convNum / v.n,
      layerRate: v.layerNum / v.n,
      n: v.n,
      window: v.window.length ? v.window.reduce((a, b) => a + b, 0) / v.window.length : null,
      isDefault: cfg.is_default,
      isDegenerate: cfg.is_degenerate
    };
  }).filter((p) => p.window !== null);
  const spread = Math.max(...points.map((p) => p.convRate)) - Math.min(...points.map((p) => p.convRate));
  const width = 520, height = 260, marginL = 46, marginR = 16, marginT = 16, marginB = 34;
  const x = linear2().domain([0, 1]).range([marginL, width - marginR]);
  const yVals = points.map((p) => p.window);
  const yMin = Math.min(0, ...yVals), yMax = Math.max(0, ...yVals);
  const yPad = (yMax - yMin) * 0.1 || 5;
  const y = linear2().domain([yMin - yPad, yMax + yPad]).range([height - marginB, marginT]);
  const svg = el2("svg", { viewBox: `0 0 ${width} ${height}`, width: "100%", role: "img", "aria-label": `Sensitivity curve, ${domain}: unnecessary escalation rate vs pre-escalation window across ${points.length} comparator configurations` });
  svg.style.display = "block";
  for (const tick of [0, 0.25, 0.5, 0.75, 1]) {
    svg.appendChild(el2("line", { x1: x(tick), x2: x(tick), y1: marginT, y2: height - marginB, stroke: "var(--border-recessed)", "stroke-width": 1 }));
    const t = el2("text", { x: x(tick), y: height - marginB + 16, class: "sc-axis-label tl-anchor-middle" });
    t.textContent = `${Math.round(tick * 100)}%`;
    svg.appendChild(t);
  }
  const xLabel = el2("text", { x: (marginL + width - marginR) / 2, y: height - 4, class: "sc-axis-title tl-anchor-middle" });
  xLabel.textContent = "unnecessary escalation rate (self-clearing scenarios)";
  svg.appendChild(xLabel);
  svg.appendChild(el2("line", { x1: marginL, x2: width - marginR, y1: y(0), y2: y(0), stroke: "var(--text-2)", "stroke-width": 1, "stroke-dasharray": "2 3" }));
  const zeroLabel = el2("text", { x: marginL - 6, y: y(0) + 3, class: "sc-axis-label", "text-anchor": "end" });
  zeroLabel.textContent = "0";
  svg.appendChild(zeroLabel);
  const sorted = [...points].sort((a, b) => a.convRate - b.convRate);
  const pathD = sorted.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.convRate)},${y(p.window)}`).join(" ");
  svg.appendChild(el2("path", { d: pathD, fill: "none", stroke: "var(--color-noc-conventional)", "stroke-width": 1.5 }));
  for (const p of sorted) {
    svg.appendChild(el2("circle", { cx: x(p.convRate), cy: y(p.window), r: p.isDefault || p.isDegenerate ? 5 : 3.5, fill: "var(--color-noc-conventional)", stroke: "var(--plane-0)", "stroke-width": 1.5 }));
  }
  for (const p of sorted) {
    svg.appendChild(el2("polygon", {
      points: `${x(p.layerRate)},${y(p.window) - 5} ${x(p.layerRate) + 5},${y(p.window)} ${x(p.layerRate)},${y(p.window) + 5} ${x(p.layerRate) - 5},${y(p.window)}`,
      fill: "var(--color-noc-decision)"
    }));
  }
  container.appendChild(svg);
  const legend = document.createElement("div");
  legend.className = "sc-legend";
  legend.innerHTML = `
    <span class="sc-legend-item"><span class="sc-swatch sc-swatch-line"></span>conventional (varies with tuning)</span>
    <span class="sc-legend-item"><span class="sc-swatch sc-swatch-diamond"></span>decision layer (does not move)</span>
  `;
  container.appendChild(legend);
  const caption = document.createElement("p");
  caption.className = "sc-caption";
  caption.textContent = `${domain}: n=${points[0]?.n ?? 0} self-clearing runs per configuration, ${points.length} configurations. Spread: ${(spread * 100).toFixed(1)} percentage points.`;
  container.appendChild(caption);
}

// site/instrument-src/dualPath.ts
function renderDualPath(container, data) {
  container.innerHTML = "";
  const entry = data.entries.find((e) => e.domain === "microwave" && e.scenario === "mw_rain_cell" && data.comparator_configs.find((c) => c.id === e.config_id)?.is_default);
  if (!entry) {
    container.innerHTML = '<p class="dp-empty">No illustrative self-clearing entry found.</p>';
    return;
  }
  const wrap = document.createElement("div");
  wrap.className = "dp-wrap";
  const convTrack = document.createElement("div");
  convTrack.className = "dp-track dp-track-conv";
  convTrack.innerHTML = `
    <p class="dp-track-label">Conventional monitoring</p>
    <div class="dp-steps">
      <span class="dp-step">condition appears</span>
      <span class="dp-arrow">&rarr;</span>
      <span class="dp-step dp-step-conv">escalates</span>
      <span class="dp-arrow">&rarr;</span>
      <span class="dp-step dp-step-conv">operational action taken</span>
      <span class="dp-arrow">&rarr;</span>
      <span class="dp-step">condition clears</span>
    </div>
  `;
  const layerTrack = document.createElement("div");
  layerTrack.className = "dp-track dp-track-layer";
  layerTrack.innerHTML = `
    <p class="dp-track-label">Decision layer</p>
    <div class="dp-steps">
      <span class="dp-step">condition appears</span>
      <span class="dp-arrow">&rarr;</span>
      <span class="dp-step dp-step-layer">holds</span>
      <span class="dp-arrow">&rarr;</span>
      <span class="dp-step dp-step-layer">no action</span>
      <span class="dp-arrow">&rarr;</span>
      <span class="dp-step">condition clears</span>
    </div>
  `;
  wrap.appendChild(convTrack);
  wrap.appendChild(layerTrack);
  container.appendChild(wrap);
  const outcome = document.createElement("p");
  outcome.className = "dp-outcome";
  outcome.textContent = "The outcome is identical in both paths \u2014 the condition clears either way. The difference is the operational action taken, not whether the network recovers. This does not show an outage prevented; the simulation does not demonstrate that.";
  container.appendChild(outcome);
  const defaultId = data.comparator_configs.find((c) => c.is_default).id;
  const selfClearingEntries = data.entries.filter((e) => e.config_id === defaultId && e.rates.conv_unnecessary_escalation.scope === "self_clearing");
  const totalN = selfClearingEntries.reduce((s, e) => s + e.rates.conv_unnecessary_escalation.n, 0);
  const convPooled = selfClearingEntries.reduce((s, e) => s + e.rates.conv_unnecessary_escalation.value * e.rates.conv_unnecessary_escalation.n, 0) / totalN;
  const layerPooled = selfClearingEntries.reduce((s, e) => s + e.rates.layer_unnecessary_escalation.value * e.rates.layer_unnecessary_escalation.n, 0) / totalN;
  const aggregate = document.createElement("div");
  aggregate.className = "dp-aggregate";
  const thisEntryConv = entry.rates.conv_unnecessary_escalation;
  const thisEntryLayer = entry.rates.layer_unnecessary_escalation;
  aggregate.innerHTML = `
    <p class="dp-aggregate-label">This scenario alone (n=${thisEntryConv.n}): conventional ${(thisEntryConv.value * 100).toFixed(1)}%, decision layer ${(thisEntryLayer.value * 100).toFixed(1)}%.</p>
    <p class="dp-aggregate-label">Pooled across all ${selfClearingEntries.length} self-clearing scenarios (n=${totalN}, default comparator):</p>
    <div class="dp-aggregate-rates">
      <span><span class="dp-swatch dp-swatch-conv"></span>conventional: ${(convPooled * 100).toFixed(1)}% (n=${totalN})</span>
      <span><span class="dp-swatch dp-swatch-layer"></span>decision layer: ${(layerPooled * 100).toFixed(1)}% (n=${totalN})</span>
    </div>
  `;
  container.appendChild(aggregate);
}

// site/instrument-src/pairedMetric.ts
function renderPairedMetric(container, props) {
  const block = document.createElement("div");
  block.className = "pm-block";
  const label = document.createElement("p");
  label.className = "pm-label";
  label.textContent = props.label;
  block.appendChild(label);
  const bars = document.createElement("div");
  bars.className = "pm-bars";
  const maxVal = Math.max(props.conventional.value, props.decisionLayer.value, 1e-3);
  for (const [key, arm, cls] of [["conventional", props.conventional, "pm-bar-conv"], ["decision layer", props.decisionLayer, "pm-bar-layer"]]) {
    const row = document.createElement("div");
    row.className = "pm-bar-row";
    const rowLabel = document.createElement("span");
    rowLabel.className = "pm-bar-name";
    rowLabel.textContent = key;
    const track = document.createElement("div");
    track.className = "pm-bar-track";
    const fill = document.createElement("div");
    fill.className = `pm-bar-fill ${cls}`;
    fill.style.width = `${Math.max(arm.value / maxVal * 100, 2)}%`;
    track.appendChild(fill);
    const val = document.createElement("span");
    val.className = "pm-bar-value";
    val.textContent = `${(arm.value * 100).toFixed(1)}${props.unit} (n=${arm.n})`;
    row.appendChild(rowLabel);
    row.appendChild(track);
    row.appendChild(val);
    bars.appendChild(row);
  }
  block.appendChild(bars);
  container.appendChild(block);
}

// site/instrument-src/actIV.ts
function renderActIV(container, data) {
  container.innerHTML = "";
  for (const which of ["default", "degenerate"]) {
    const cfg = data.comparator_configs.find((c) => which === "default" ? c.is_default : c.is_degenerate);
    const entries = data.entries.filter((e) => e.config_id === cfg.id && e.rates.conv_unnecessary_escalation.scope === "self_clearing");
    const totalN = entries.reduce((s, e) => s + e.rates.conv_unnecessary_escalation.n, 0);
    const convPooled = entries.reduce((s, e) => s + e.rates.conv_unnecessary_escalation.value * e.rates.conv_unnecessary_escalation.n, 0) / totalN;
    const layerPooled = entries.reduce((s, e) => s + e.rates.layer_unnecessary_escalation.value * e.rates.layer_unnecessary_escalation.n, 0) / totalN;
    renderPairedMetric(container, {
      label: which === "default" ? "Default comparator" : "Degenerate comparator (perfect, instantaneous, unsmoothed)",
      conventional: { value: convPooled, n: totalN },
      decisionLayer: { value: layerPooled, n: totalN },
      unit: "% unnecessary escalation"
    });
  }
  const note = document.createElement("p");
  note.className = "act4-note";
  note.textContent = "Escalating on a self-clearing condition is a truck roll that buys nothing. The conventional rate rises sharply under the degenerate comparator; the decision layer's does not move \u2014 this is the durable result, invariant to how the comparator is tuned.";
  container.appendChild(note);
}

// site/instrument-src/domainComparison.ts
function renderDomainComparison(container, props) {
  container.innerHTML = "";
  const table = document.createElement("table");
  table.className = "dc-table";
  const thead = document.createElement("thead");
  thead.innerHTML = `<tr><th scope="col">Metric</th><th scope="col">Microwave</th><th scope="col">LEO/NTN</th></tr>`;
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  for (const row of props.rows) {
    const tr = document.createElement("tr");
    const metricLabel = row.metric.replace(/_/g, " ");
    tr.innerHTML = `<th scope="row">${metricLabel}</th><td>${row.microwave}</td><td>${row.leo_ntn}</td>`;
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  const scrollWrap = document.createElement("div");
  scrollWrap.className = "dc-table-scroll";
  scrollWrap.appendChild(table);
  container.appendChild(scrollWrap);
  const notes = document.createElement("div");
  notes.className = "dc-notes";
  for (const n of props.notes) {
    const p = document.createElement("p");
    p.textContent = n;
    notes.appendChild(p);
  }
  container.appendChild(notes);
}
function renderTopology(container) {
  container.innerHTML = "";
  const details = document.createElement("details");
  details.className = "topo-details";
  const summary = document.createElement("summary");
  summary.textContent = "Topology (collapsed by default)";
  details.appendChild(summary);
  const grid = document.createElement("div");
  grid.className = "topo-grid";
  grid.innerHTML = `
    <div class="topo-col">
      <p class="topo-col-label">Microwave</p>
      <p class="topo-desc">Simulated point-to-point topology: a set of terrestrial hops, each an independent link. The affected link in a given scenario is one hop among the set; the decision layer's peer-group correlation compares it against its neighbours.</p>
    </div>
    <div class="topo-col">
      <p class="topo-col-label">LEO/NTN</p>
      <p class="topo-desc">Satellite &rarr; beam &rarr; service relationship: one serving satellite and one serving gateway per terminal, each pass geometry-dependent. Statistics are conditioned on the serving satellite \u2014 without that conditioning, a spacecraft-side fault is smeared across the pass schedule and becomes statistically invisible.</p>
    </div>
  `;
  details.appendChild(grid);
  container.appendChild(details);
}

// site/instrument-src/crossDomainDecision.ts
function buildCrossDomainRows(data) {
  const defaultCfg = data.comparator_configs.find((c) => c.is_default);
  const degenerateCfg = data.comparator_configs.find((c) => c.is_degenerate);
  function poolWindow(domain, configId) {
    const raw = [];
    for (const e of data.entries) {
      if (e.domain !== domain || e.config_id !== configId) continue;
      for (const s of e.seeds) {
        if (s.window_min !== null) raw.push(s.window_min);
      }
    }
    raw.sort((a, b) => a - b);
    const mid = Math.floor(raw.length / 2);
    const median = raw.length % 2 ? raw[mid] : (raw[mid - 1] + raw[mid]) / 2;
    return { median, n: raw.length };
  }
  const mwDefault = poolWindow("microwave", defaultCfg.id);
  const mwDegenerate = poolWindow("microwave", degenerateCfg.id);
  const leoDefault = poolWindow("leo_ntn", defaultCfg.id);
  const leoDegenerate = poolWindow("leo_ntn", degenerateCfg.id);
  const warmupIncluded = data.warmup["a_as_run_600min"].by_domain;
  const warmupExcluded = data.warmup["b_warmup_excluded"].by_domain;
  const selfClearingDefault = data.entries.filter((e) => e.config_id === defaultCfg.id && e.rates.conv_unnecessary_escalation.scope === "self_clearing");
  const totalN = selfClearingDefault.reduce((s, e) => s + e.rates.conv_unnecessary_escalation.n, 0);
  const convPooled = selfClearingDefault.reduce((s, e) => s + e.rates.conv_unnecessary_escalation.value * e.rates.conv_unnecessary_escalation.n, 0) / totalN;
  const layerPooled = selfClearingDefault.reduce((s, e) => s + e.rates.layer_unnecessary_escalation.value * e.rates.layer_unnecessary_escalation.n, 0) / totalN;
  return [
    {
      kind: "per_domain",
      metric: "Decision pipeline & metric set",
      microwave: "shared (one pipeline, one metric set)",
      leo_ntn: "shared (one pipeline, one metric set)",
      scope: "architecture",
      source: "docs/EXPERIMENT_MATRIX.md"
    },
    {
      kind: "per_domain",
      metric: "Scenarios swept",
      microwave: "5",
      leo_ntn: "6",
      scope: "per-domain, count of scenario rows",
      source: "docs/EXPERIMENT_MATRIX.md"
    },
    {
      kind: "per_domain",
      metric: "Self-clearing scenarios (of the above)",
      microwave: "1 (mw_rain_cell)",
      leo_ntn: "2 (leo_ground_rain, leo_low_elevation)",
      scope: "per-domain",
      source: "docs/EXPERIMENT_MATRIX.md"
    },
    {
      kind: "per_domain",
      metric: "Pre-escalation window, default comparator",
      microwave: `${mwDefault.median} min (n=${mwDefault.n})`,
      leo_ntn: `${leoDefault.median} min (n=${leoDefault.n})`,
      scope: "per-domain, pooled over that domain's scenarios & seeds",
      source: "sensitivity_comparator.csv, pre_escalation_window_min"
    },
    {
      kind: "per_domain",
      metric: "Pre-escalation window, degenerate comparator",
      microwave: `${mwDegenerate.median} min (n=${mwDegenerate.n})`,
      leo_ntn: `${leoDegenerate.median} min (n=${leoDegenerate.n})`,
      scope: "per-domain, pooled over that domain's scenarios & seeds",
      source: "sensitivity_comparator.csv, pre_escalation_window_min"
    },
    {
      kind: "per_domain",
      metric: "Degenerate comparator: warm-up included \u2192 excluded",
      microwave: `${warmupIncluded.microwave.p50} min (n=${warmupIncluded.microwave.n}) \u2192 ${warmupExcluded.microwave.p50} min (n=${warmupExcluded.microwave.n})`,
      leo_ntn: `${warmupIncluded.leo_ntn.p50} min (n=${warmupIncluded.leo_ntn.n}) \u2192 ${warmupExcluded.leo_ntn.p50} min (n=${warmupExcluded.leo_ntn.n})`,
      scope: "per-domain, degenerate comparator only",
      source: "sensitivity_warmup.csv, pre_escalation_window_min"
    },
    {
      kind: "pooled",
      metric: "Unnecessary-escalation rate, self-clearing scenarios (default comparator)",
      value: `conventional ${(convPooled * 100).toFixed(1)}% \xB7 decision layer ${(layerPooled * 100).toFixed(1)}% (n=${totalN})`,
      scope: "POOLED across both domains' self-clearing scenarios",
      source: "sensitivity_comparator.csv, conv_/layer_unnecessary_dispatch"
    },
    {
      kind: "per_domain",
      metric: "Escalation F1, with \u2192 without context conditioning",
      microwave: "NOT MEASURED (no serving-satellite analog in this domain)",
      leo_ntn: "0.94 \u2192 0.05 (single-scenario ablation: leo_rf_subsystem)",
      scope: "single-scenario ablation, not a domain-pooled figure",
      source: "docs/RESEARCH_HYPOTHESES.md, H5 \u2014 not in instrument.json"
    }
  ];
}
function renderCrossDomainTable(container, rows) {
  container.innerHTML = "";
  const table = document.createElement("table");
  table.className = "dc-table cdd-table";
  const thead = document.createElement("thead");
  thead.innerHTML = `<tr><th scope="col">What</th><th scope="col">Microwave</th><th scope="col">LEO/NTN</th></tr>`;
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  for (const row of rows) {
    const tr = document.createElement("tr");
    if (row.kind === "pooled") {
      tr.innerHTML = `<th scope="row">${row.metric}</th><td colspan="2" class="cdd-pooled-cell"><span class="cdd-pooled-tag">POOLED</span> ${row.value}</td>`;
    } else {
      tr.innerHTML = `<th scope="row">${row.metric}</th><td>${row.microwave}</td><td>${row.leo_ntn}</td>`;
    }
    tr.title = `scope: ${row.scope} \u2014 source: ${row.source}`;
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  const scrollWrap = document.createElement("div");
  scrollWrap.className = "dc-table-scroll";
  scrollWrap.appendChild(table);
  container.appendChild(scrollWrap);
  const details = document.createElement("details");
  details.className = "cdd-provenance-details";
  const summary = document.createElement("summary");
  summary.textContent = "Row-by-row scope & source";
  details.appendChild(summary);
  const list = document.createElement("dl");
  list.className = "cdd-provenance-list";
  for (const row of rows) {
    const dt = document.createElement("dt");
    dt.textContent = row.metric;
    const dd = document.createElement("dd");
    dd.textContent = `scope: ${row.scope} \u2014 source: ${row.source}`;
    list.appendChild(dt);
    list.appendChild(dd);
  }
  details.appendChild(list);
  container.appendChild(details);
}

// site/instrument-src/drawer.ts
var CATEGORY_ORDER = ["fundamental", "physics", "method", "economics", "scope"];
var CATEGORY_TITLE = {
  fundamental: "Fundamental",
  physics: "Physics",
  method: "Method",
  economics: "Economics",
  scope: "Scope"
};
function renderDrawer(container, data) {
  container.innerHTML = "";
  const details = document.createElement("details");
  details.className = "drawer-details";
  details.id = "method-drawer";
  const summary = document.createElement("summary");
  summary.textContent = "Method \xB7 Assumptions \xB7 Limitations";
  details.appendChild(summary);
  const methodP = document.createElement("p");
  methodP.className = "drawer-method-note";
  methodP.innerHTML = `Full method description, hypothesis cards, and the complete write-up live at <a href="/method">/method</a>. The full research paper \u2014 problem, both domains, results, what failed, what survived \u2014 is at <a href="/article/">/article</a>. This drawer surfaces the limitations that bound every figure on this page.`;
  details.appendChild(methodP);
  for (const cat of CATEGORY_ORDER) {
    const items = data.limitations.filter((l) => l.category === cat);
    if (items.length === 0) continue;
    const section = document.createElement("div");
    section.className = "drawer-category";
    const h = document.createElement("h4");
    h.textContent = CATEGORY_TITLE[cat];
    section.appendChild(h);
    const list = document.createElement("ol");
    for (const item of items) {
      const li = document.createElement("li");
      const strong = document.createElement("strong");
      strong.textContent = item.title + ". ";
      li.appendChild(strong);
      li.appendChild(document.createTextNode(item.detail));
      list.appendChild(li);
    }
    section.appendChild(list);
    details.appendChild(section);
  }
  const banner = document.createElement("p");
  banner.className = "drawer-banner";
  banner.textContent = "Simulated networks. Ground truth known by construction. No operator data. The simulation engine is not published; this interface replays published results.";
  details.insertBefore(banner, details.firstChild.nextSibling);
  container.appendChild(details);
}

// site/instrument-src/operationalView.ts
function renderOperationalView(container) {
  container.innerHTML = "";
  const chain = document.createElement("div");
  chain.className = "opview-chain";
  const steps = ["DETECT", "DECIDE", "ESCALATE", "DISPATCH", "REPAIR", "RECOVER"];
  for (let i = 0; i < steps.length; i++) {
    const step = document.createElement("span");
    step.className = "opview-step";
    step.textContent = steps[i];
    chain.appendChild(step);
    if (i < steps.length - 1) {
      const arrow = document.createElement("span");
      arrow.className = "opview-arrow";
      arrow.textContent = "\u2192";
      chain.appendChild(arrow);
    }
  }
  container.appendChild(chain);
  const branchLabel = document.createElement("p");
  branchLabel.className = "opview-branch-label";
  branchLabel.textContent = "For self-clearing events, the branch that matters:";
  container.appendChild(branchLabel);
  const branch = document.createElement("div");
  branch.className = "opview-chain opview-branch";
  for (const [i, label] of ["ESCALATE", "operational action taken", "condition clears anyway"].entries()) {
    const step = document.createElement("span");
    step.className = "opview-step opview-step-branch";
    step.textContent = label;
    branch.appendChild(step);
    if (i < 2) {
      const arrow = document.createElement("span");
      arrow.className = "opview-arrow";
      arrow.textContent = "\u2192";
      branch.appendChild(arrow);
    }
  }
  container.appendChild(branch);
  const note = document.createElement("p");
  note.className = "opview-note";
  note.textContent = "This is a conceptual chain, not a cost calculator. No monetary figure is shown here: this build does not carry the economics model's ILLUSTRATIVE provenance string end to end, and a figure without its provenance is not displayed. The simulation does not represent an operator's actual financial loss, and does not demonstrate that an outage was prevented.";
  container.appendChild(note);
}

// site/instrument-src/loadStates.ts
function renderLoadingSkeleton(container) {
  container.innerHTML = "";
  const skel = document.createElement("div");
  skel.className = "skel-timeline";
  skel.setAttribute("aria-busy", "true");
  skel.setAttribute("aria-label", "Loading incident timeline");
  const track = document.createElement("div");
  track.className = "skel-track";
  skel.appendChild(track);
  for (let i = 0; i < 7; i++) {
    const mark = document.createElement("div");
    mark.className = "skel-mark";
    mark.style.left = `${8 + i * 12.5}%`;
    skel.appendChild(mark);
  }
  container.appendChild(skel);
}
function renderLoadError(container, detail) {
  container.innerHTML = "";
  const box = document.createElement("div");
  box.className = "load-error";
  box.setAttribute("role", "alert");
  const h = document.createElement("p");
  h.className = "load-error-title";
  h.textContent = "Could not load the instrument's data.";
  const p = document.createElement("p");
  p.className = "load-error-detail";
  p.textContent = detail;
  box.appendChild(h);
  box.appendChild(p);
  container.appendChild(box);
}
function renderStaleBanner(container, generatedAt, newestSourceMtime) {
  const generated = new Date(generatedAt).getTime();
  const newest = new Date(newestSourceMtime).getTime();
  if (newest <= generated) return;
  container.innerHTML = "";
  const p = document.createElement("p");
  p.className = "stale-banner";
  p.textContent = `Build-time warning: this build (generated ${generatedAt}) is older than its newest source file (${newestSourceMtime}). Regenerate before publishing.`;
  container.appendChild(p);
}
function validateSchema(data) {
  if (typeof data !== "object" || data === null) return "instrument.json is not an object.";
  const d = data;
  for (const key of ["meta", "comparator_configs", "entries", "warmup", "severity", "coverage", "limitations"]) {
    if (!(key in d)) return `instrument.json is missing required top-level key "${key}".`;
  }
  if (!Array.isArray(d.entries) || d.entries.length === 0) return "instrument.json's entries[] is empty or not an array.";
  if (!Array.isArray(d.comparator_configs) || d.comparator_configs.length !== 11) return `instrument.json's comparator_configs[] should have 11 entries, has ${Array.isArray(d.comparator_configs) ? d.comparator_configs.length : "none"}.`;
  if (!Array.isArray(d.limitations) || d.limitations.length !== 21) return `instrument.json's limitations[] should have 21 entries, has ${Array.isArray(d.limitations) ? d.limitations.length : "none"}.`;
  return null;
}

// site/instrument-src/focusUtil.ts
function withFocusPreserved(container, rebuild) {
  const active = document.activeElement;
  const wasFocusedHere = !!active && container.contains(active);
  const focusKey = wasFocusedHere ? active.getAttribute("data-focus-key") : null;
  rebuild();
  if (focusKey) {
    const match = container.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`);
    match?.focus();
  }
}

// site/instrument-src/app.ts
function mobileOrientation() {
  return window.matchMedia("(max-width: 640px)").matches ? "vertical" : "horizontal";
}
function buildShell(root2) {
  root2.innerHTML = `
    <div id="stale-banner-slot"></div>
    <header id="instrument-header"></header>
    <div class="instrument-body">
      <aside id="comparator-rail" class="rail-sticky"></aside>
      <main class="instrument-main">
        <section class="act" id="act-1">
          <p class="act-eyebrow">Act I &middot; The Window</p>
          <h1 class="act-title">The outage did not begin when the ticket was created</h1>
          <p class="act-copy">The reference incident's decision window is a duration, not a verdict \u2014 and a duration means nothing without stating what it was measured against. This is that measurement, shown for the current scenario at its default comparator.</p>
          <div class="instrument-panel is-modelled" id="act1-timeline"></div>
        </section>

        <section class="act" id="act-2">
          <p class="act-eyebrow">Act II &middot; What Moves</p>
          <h2 class="act-title">The same timeline, under rail control</h2>
          <p class="act-copy">Use the rail to change the comparator's tuning. The conventional marker moves along this same timeline; the decision layer's marks do not. The shaded band shrinks as the comparator is tuned more aggressively \u2014 and for several LEO/NTN scenarios, the degenerate preset inverts it entirely. Switch scenario above to see it invert; this effect is concentrated in LEO/NTN and largely absent from microwave.</p>
          <div class="instrument-panel is-modelled" id="act2-timeline"></div>
          <h3 class="act-subtitle">Sensitivity curve, per domain</h3>
          <p class="act-copy-small">x = unnecessary escalation rate on self-clearing scenarios (not false-positive rate \u2014 that axis collapses for microwave). y = pre-escalation window. Neither domain's decision-layer points sit on the conventional curve.</p>
          <div class="sc-grid">
            <div class="instrument-panel is-modelled"><p class="panel-header">Microwave</p><div id="sc-microwave"></div></div>
            <div class="instrument-panel is-modelled"><p class="panel-header">LEO/NTN</p><div id="sc-leo"></div></div>
          </div>
        </section>

        <section class="act" id="act-3">
          <p class="act-eyebrow">Act III &middot; The Self-Clearing Story</p>
          <h2 class="act-title">Two paths, one outcome</h2>
          <div class="instrument-panel is-modelled" id="act3-dualpath"></div>
        </section>

        <section class="act" id="act-4">
          <p class="act-eyebrow">Act IV &middot; What Doesn't Move</p>
          <h2 class="act-title">The decision layer's invariance</h2>
          <div class="instrument-panel is-modelled" id="act4-paired"></div>
        </section>

        <section class="act" id="act-5">
          <p class="act-eyebrow">Act V &middot; Across Domains</p>
          <h2 class="act-title">Microwave vs. LEO/NTN</h2>

          <h3 class="act-subtitle">What differs, what stays the same</h3>
          <p class="act-copy">One decision pipeline, one feature extractor, one metric set \u2014 applied unmodified to both domains. What differs is not the method but the physics: what degrades, and how the same instrumentation observes it. The clearest divergence in the whole study: tune the conventional comparator aggressively and the microwave window barely moves, while the LEO/NTN window inverts \u2014 driven by warm-up dynamics interacting with LEO's longer, pass-scale timescales, not by one domain being less suited to the method.</p>
          <div class="instrument-panel" id="act5-crossdomain"></div>
          <p class="act-copy" id="act5-context-conditioning"></p>
          <p class="act-copy-small" id="act5-context-note"></p>

          <h3 class="act-subtitle">Infrastructure &amp; coverage</h3>
          <p class="act-copy">Geographic coverage, service coverage, capacity and availability are reported separately below and must not be collapsed into a single ratio.</p>
          <div class="instrument-panel" id="act5-domain"></div>
          <div id="act5-topology"></div>
        </section>

        <section class="act" id="act-opview">
          <p class="act-eyebrow">Operational Consequence</p>
          <div class="instrument-panel" id="opview"></div>
        </section>

        <div id="method-drawer-slot"></div>
      </main>
    </div>
  `;
  return {
    header: root2.querySelector("#instrument-header"),
    rail: root2.querySelector("#comparator-rail"),
    act1: root2.querySelector("#act1-timeline"),
    act2: root2.querySelector("#act2-timeline"),
    scMicrowave: root2.querySelector("#sc-microwave"),
    scLeo: root2.querySelector("#sc-leo"),
    act3: root2.querySelector("#act3-dualpath"),
    act4: root2.querySelector("#act4-paired"),
    act5CrossDomain: root2.querySelector("#act5-crossdomain"),
    act5ContextConditioning: root2.querySelector("#act5-context-conditioning"),
    act5ContextNote: root2.querySelector("#act5-context-note"),
    act5Domain: root2.querySelector("#act5-domain"),
    act5Topology: root2.querySelector("#act5-topology"),
    opview: root2.querySelector("#opview"),
    drawerSlot: root2.querySelector("#method-drawer-slot"),
    staleSlot: root2.querySelector("#stale-banner-slot")
  };
}
async function initApp(root2) {
  renderLoadingSkeleton(root2);
  let data;
  try {
    const res = await fetch("./data/instrument.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const schemaError = validateSchema(json);
    if (schemaError) {
      renderLoadError(root2, schemaError);
      return;
    }
    data = json;
  } catch (err) {
    renderLoadError(root2, err instanceof Error ? err.message : String(err));
    return;
  }
  const els = buildShell(root2);
  renderStaleBanner(els.staleSlot, data.meta.generated_at, data.meta.newest_source_mtime);
  const store = new Store(initialState(data));
  function renderReactive() {
    const s = store.get();
    withFocusPreserved(els.header, () => renderHeader(els.header, data, store));
    withFocusPreserved(els.rail, () => renderRail(els.rail, data, store));
    const entry = findEntry(data, s.domain, s.scenario, s.configId);
    if (entry) {
      renderTimeline(els.act2, entry, {
        orientation: mobileOrientation(),
        highlightedSeed: s.highlightedSeed,
        onSeedClick: (seed) => store.set({ highlightedSeed: seed })
      });
    } else {
      els.act2.innerHTML = '<p class="tl-empty-state">No data for this combination.</p>';
    }
  }
  store.subscribe(renderReactive);
  window.addEventListener("resize", () => renderReactive());
  const heroEntry = findEntry(data, data.meta.default_selection.domain, data.meta.default_selection.scenario, data.comparator_configs.find((c) => c.is_default).id);
  if (heroEntry) renderTimeline(els.act1, heroEntry, { orientation: mobileOrientation() });
  renderReactive();
  renderSensitivityCurve(els.scMicrowave, data, "microwave");
  renderSensitivityCurve(els.scLeo, data, "leo_ntn");
  renderDualPath(els.act3, data);
  renderActIV(els.act4, data);
  renderCrossDomainTable(els.act5CrossDomain, buildCrossDomainRows(data));
  els.act5ContextConditioning.textContent = "In LEO a terminal changes serving satellite every few minutes. The decision layer was tested both with and without conditioning each element's statistical baseline on its serving satellite. Without it, a spacecraft-side fault is smeared across the pass schedule and becomes statistically invisible: escalation F1 falls from 0.94 to 0.05, on the leo_rf_subsystem scenario. This was a design decision that was tested, not an emergent finding \u2014 and the operational consequence is direct: aggregate satellite telemetry can hide the state that actually matters.";
  els.act5ContextNote.textContent = "Source: docs/RESEARCH_HYPOTHESES.md, H5 \u2014 a single-scenario ablation already published there. Not derived from instrument.json; no equivalent ablation exists for microwave, which has no serving-satellite analog.";
  renderDomainComparison(els.act5Domain, data.coverage);
  renderTopology(els.act5Topology);
  renderOperationalView(els.opview);
  renderDrawer(els.drawerSlot, data);
}

// site/instrument-src/main.ts
var root = document.getElementById("instrument-root");
if (!root) throw new Error("#instrument-root not found");
initApp(root).catch((err) => {
  console.error(err);
  root.innerHTML = `<p class="load-error-detail">Unexpected error: ${err instanceof Error ? err.message : String(err)}</p>`;
});
