/* ---- BODY//TIME simplified physiology model ---- */
const PROFILES = {
  adult: { name: 'Typical adult', hr0: 65, contr: 1, baro: 1, symMax: 1.1, pp: 1, sweat: 1, pool: 1 },
  athlete: { name: 'Trained athlete', hr0: 52, contr: 1.3, baro: 1, symMax: 1.1, pp: 1.15, sweat: 1.15, pool: 0.9 },
  older: { name: 'Older adult (70s)', hr0: 68, contr: 0.92, baro: 0.35, symMax: 0.8, pp: 1.55, sweat: 0.7, pool: 1.4 }
};
let P = PROFILES.adult;
let R0 = 93 / (P.hr0 * 75 * P.contr / 1000);
function setProfile(id) { P = PROFILES[id] || PROFILES.adult; R0 = 93 / (P.hr0 * 75 * P.contr / 1000); }
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function newState() {
  return { eA: 0, eV: 0, eM: 0, eO: 0, eS: 0, kS: 0, pool: 0, holdR: 0, sym: 0, mapS: 93, mset: 93, map: 93,
    pco2: 40, pao2: 100, temp: 37, sweatL: 0, skinVD: 0.35, ve: 1, hr: 65, sv: 75, co: 4.875,
    tone: 1, sbp: 119.7, dbp: 79.7, spo2: 97, vo2: 1, sweat: 0, shiver: 0, sTot: 0, bv: 1, svRel: 1, perf: 1 };
}

function step(S, inp, dt) {
  const e = inp.exert || 0, k = inp.stress || 0, stand = inp.stand ? 1 : 0, hold = inp.hold ? 1 : 0;
  const bleed = inp.bleed || 0, sp = 37 + (inp.fever || 0), H = inp.heat || 0;
  const fio2 = inp.fio2 || 0.21, contr = inp.contr == null ? 1 : inp.contr, vessel = inp.vessel || 0;
  const fluid = inp.fluid || 0;

  // central command, muscle and metabolic lags
  S.eA += (e - S.eA) / 2.5 * dt;
  S.eV += (e - S.eV) / 5 * dt;
  S.eM += (e - S.eM) / 12 * dt;
  S.eO += (e - S.eO) / 20 * dt;
  S.eS += (e - S.eS) / 90 * dt;
  S.kS += (k - S.kS) / 2.5 * dt;
  S.pool += (stand - S.pool) / 1.4 * dt;
  S.holdR += (hold - S.holdR) / 6 * dt;

  // thermoregulation effectors
  const err = S.temp - sp;
  S.skinVD = clamp(0.35 + 1.2 * err, 0, 1);
  const vcon = clamp(-1.2 * err - 0.2, 0, 1);
  S.shiver = clamp(-1.0 * err - 0.4, 0, 1);
  S.sweat = 1.5 * P.sweat * clamp(err / 1.5, 0, 1.6);

  // metabolism
  S.vo2 = 1 + 8 * S.eO + 0.12 * (S.temp - 37) + 0.4 * Math.max(k, 0) + 1.5 * S.shiver;

  // blood volume and venous return
  S.bv = 1 - bleed - 0.05 * (S.sweatL + fluid);
  const sPos = Math.max(S.sym, 0);
  const dcomp = clamp((S.bv - 0.62) / 0.13, 0, 1);   // reflex reserve fades with very large volume loss
  const pumpFail = clamp((S.bv - 0.5) / 0.15, 0.3, 1);
  const vr = S.bv * (1 - 0.16 * P.pool * S.pool) + 0.18 * S.eM + 0.2 * sPos * dcomp - 0.07 * (S.skinVD - 0.35);

  // autonomic control
  S.mset += (93 + 25 * S.eA + 22 * k - S.mset) / 5 * dt;
  const mapSet = S.mset;
  const baro = clamp(0.03 * P.baro * (mapSet - S.mapS), -0.6, 1.2);
  const chemo = 0.03 * Math.max(0, S.pco2 - 41) + 0.012 * Math.max(0, 88 - S.pao2);
  const volDrive = 1.8 * Math.max(0, 1 - S.bv);
  const target = clamp(baro + 0.45 * k + chemo + volDrive + 0.2 * S.shiver + 0.25 * vcon, -0.3, 1.2);
  S.sym += (target - S.sym) / 2 * dt;
  S.sTot = clamp(S.sym + 0.75 * (0.55 * S.eA + 0.45 * S.eS) + 0.4 * S.kS, -0.3, P.symMax);

  // heart
  let hr = P.hr0 + 105 * S.sTot + 10 * Math.max(0, S.temp - 37) - 12 * S.holdR;
  hr = clamp(hr, 35, 195);
  if (inp.hrOver) hr = inp.hrOver;
  let svRel = Math.pow(clamp(vr, 0.25, 1.5), 1.8) * (1 + 0.25 * Math.max(S.sTot, 0)) * contr * P.contr * pumpFail;
  svRel /= 1 + Math.max(0, hr - 120) / 250;
  const sv = 75 * svRel;
  const co = hr * sv / 1000;

  // vessels and pressure
  let tone = 1 + 0.9 * S.sym * dcomp + 0.15 * S.eA + 0.35 * S.holdR - 0.85 * S.eM - 0.45 * (S.skinVD - 0.35) + 0.15 * vcon * 0;
  tone *= Math.pow(1 + 0.25 * vessel, -3);
  tone = Math.max(tone, 0.25);
  const map = co * R0 * tone;
  const pp = 40 * P.pp * svRel / P.contr;
  S.hr = hr; S.sv = sv; S.svRel = svRel; S.co = co; S.tone = tone; S.map = map;
  S.sbp = map + 0.667 * pp; S.dbp = map - 0.333 * pp;
  S.mapS += (map - S.mapS) / 1.0 * dt;
  S.perf = clamp((map - 45) / 48, 0, 1.2);

  // breathing and gases
  const PIO2 = 713 * fio2;
  const hyp = Math.max(0, 75 - S.pao2);
  let ve = 1 + 1.3 * (S.pco2 - 40) + 6.8 * S.eV + 0.5 * Math.max(k, 0) + 0.04 * hyp + 0.5 * Math.max(0, S.temp - 37);
  ve = Math.max(0.3, ve);
  if (inp.rrOver) ve = Math.pow(inp.rrOver / 14, 2);
  if (hold) ve = 0;
  S.ve = ve;
  S.pco2 += (40 * S.vo2 - ve * S.pco2) / 300 * dt;
  S.pao2 += (ve * (PIO2 - S.pao2) / 77 - S.vo2 * 0.65) * dt;
  S.pco2 = clamp(S.pco2, 8, 90);
  S.pao2 = clamp(S.pao2, 15, 160);
  const pa = Math.max(1, S.pao2 - 4);
  S.spo2 = 100 / (1 + Math.pow(26.8 / pa, 2.7));

  // temperature
  const Hprod = 80 * S.vo2;
  const Henv = 230 * H;
  const Hloss = 47 * (1 + 2 * S.skinVD) * (1 - 0.5 * vcon) + S.sweat * 675 * 0.7 * (1 - 0.5 * Math.max(H, 0));
  S.temp += (Hprod + Henv - Hloss) / 150000 * dt;
  S.sweatL += S.sweat / 3600 * dt;
}

function snapshot(S) {
  return {
    sym: 25 + 70 * S.sTot,
    hr: S.hr, sbp: S.sbp, dbp: S.dbp, map: S.map, co: S.co,
    width: 100 * Math.pow(S.tone, -0.25),
    bv: 5 * S.bv,
    rr: S.ve > 0.01 ? 14 * Math.sqrt(S.ve) : 0,
    spo2: S.spo2, pco2: S.pco2, temp: S.temp,
    // hidden helpers for the body figure
    pool: S.pool, perf: S.perf, sweat: S.sweat, shiver: S.shiver, eM: S.eM, sv: S.sv
  };
}

/* ---- scenarios: inputs over time ---- */
const SCENARIOS = {
  stand: { duration: 30, inputs: t => ({ stand: t >= 1 }) },
  exercise: { duration: 720, inputs: t => ({ exert: (t >= 20 && t < 480) ? 0.75 : 0 }) },
  hold: { duration: 110, inputs: t => ({ hold: t >= 10 && t < 65 }) },
  stress: { duration: 180, inputs: t => ({ stress: t < 10 ? 0 : t < 14 ? 0.9 * (t - 10) / 4 : t < 70 ? 0.9 : t < 130 ? -0.25 : 0 }) },
  bleed: { duration: 480, inputs: t => ({ bleed: t < 20 ? 0 : t < 140 ? 0.2 * (t - 20) / 120 : 0.2 }) },
  heat: { duration: 7200, inputs: t => (t < 300 ? {} : { heat: 0.9, exert: 0.3 }) },
  cold: { duration: 2400, inputs: t => (t < 240 ? {} : { heat: -0.6 }) },
  fever: { duration: 14400, inputs: t => ({ fever: (t >= 600 && t < 7200) ? 2 : 0 }) }
};

function runScenario(id, N = 600, prof = 'adult') {
  const prevP = P; setProfile(prof);
  const sc = SCENARIOS[id];
  const S = newState();
  const first = sc.inputs(0);
  // warm-up at initial inputs
  for (let i = 0; i < 240; i++) step(S, first, 0.25);
  S.sweatL = 0;
  const sampleDt = sc.duration / N;
  const dt = Math.min(0.25, sampleDt);
  const series = [];
  let t = 0, nextSample = 0;
  while (series.length <= N) {
    if (t >= nextSample - 1e-9) { series.push(snapshot(S)); nextSample += sampleDt; }
    step(S, sc.inputs(t), dt);
    t += dt;
  }
  P = prevP; R0 = 93 / (P.hr0 * 75 * P.contr / 1000);
  return { id, duration: sc.duration, sampleDt, series, N };
}

if (typeof module !== 'undefined') module.exports = { PROFILES, setProfile, runScenario, SCENARIOS, newState, step, snapshot };

/* ---- helpers shared with the app ---- */
const THR = { sym: 4, hr: 4, bp: 4, co: 0.4, width: 1.5, bv: 0.15, rr: 3, spo2: 1, pco2: 1, temp: 0.15 };
const KEY = { bp: 'map' };
function firstChanges(res, ids, after) {
  const ai = Math.round(after / res.sampleDt);
  const out = ids.map(id => {
    const k = KEY[id] || id, b = res.series[ai][k];
    for (let i = ai; i <= res.N; i++) if (Math.abs(res.series[i][k] - b) >= THR[id]) return { id, t: i * res.sampleDt };
    return { id, t: Infinity };
  });
  out.sort((a, b) => a.t - b.t);
  return out;
}
if (typeof module !== 'undefined') module.exports.firstChanges = firstChanges;

/* ---- dose-response sweep (steady state after a hold time) ---- */
function runSweep(key, vals, horizon, prof, extra) {
  const prevP = P; setProfile(prof || 'adult');
  const out = [];
  vals.forEach(v => {
    const S = newState(); for (let i = 0; i < 240; i++) step(S, {}, 0.25);
    S.sweatL = 0;
    const inp = Object.assign({}, extra || {}); inp[key] = v;
    const dt = horizon > 1500 ? 1 : 0.5;
    for (let t = 0; t < horizon; t += dt) step(S, inp, dt);
    out.push(snapshot(S));
  });
  P = prevP; R0 = 93 / (P.hr0 * 75 * P.contr / 1000);
  return out;
}
if (typeof module !== 'undefined') module.exports.runSweep = runSweep;
