// Uygulama durumu (tek state ağacı), localStorage kalıcılığı ve tüm YZ akışları.
// Veri şeması prototiple aynıdır: localStorage anahtarı `pcx_workbook_v1`.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { STORAGE_KEY, blankCase, exampleCase, defaultPrinciples } from './defaults.js';
import {
  complete, buildSystem, buildCoachTask, coachItems, parseJsonReply,
  COACH_JSON_RULE, COACH_TEACH_TASK, COACH_FAST_SUFFIX, COACH_DEPTH_SUFFIX, ACTION_COACH_TASK,
  DECISION_COACH_TASK, AUDIT_TASK, BIAS_SCAN_TASK, PREMORTEM_TASK, REPORT_SUMMARY_TASK, REF_SUMMARY_SYSTEM
} from './ai.js';

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

/** Ayarlardaki analiz derinliğinin token bütçesi çarpanı. */
const DEPTH_MULT = { standart: 1, genis: 1.6, derin: 2.5 };

function normalize(state) {
  const s = state;
  s.aiBusy = false;
  s.aiInput = '';
  s.showSettings = false;
  s.refForm = null;
  s.undoToast = null;
  s.reportCfg = Object.assign({ company: '', sections: {} }, s.reportCfg || {});
  s.reportCfg.sections = Object.assign({ tanim: true, driver: true, analiz: true, bulgu: true, kok: true, karar: true, izleme: true, dusunme: true, referans: true }, s.reportCfg.sections);
  s.aiSettings = Object.assign({
    provider: 'auto', apiKey: '', model: '', baseUrl: '',
    level: 'dengeli', auto: true, context: '',
    length: 'kisa', tone: 'resmi', critic: 'nazik',
    temperature: 0.6, topP: '', depth: 'standart',
    headerName: '', headerPrefix: 'Bearer ', extraHeaders: ''
  }, s.aiSettings || {});
  if (s.theme !== 'light' && s.theme !== 'dark') {
    const prefersDark = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
    s.theme = prefersDark ? 'dark' : 'light';
  }
  if (!Array.isArray(s.principles) || !s.principles.length) s.principles = defaultPrinciples();
  Object.keys(s.cases).forEach(k => {
    const cc = s.cases[k];
    if (!cc.name) cc.name = k === 'ornek' ? 'Örnek Çalışma' : (k === 'benim' ? 'Benim Çalışmam' : 'Çalışma');
    if (!Array.isArray(cc.actions)) cc.actions = [];
    if (!Array.isArray(cc.tracking)) cc.tracking = [];
    if (!Array.isArray(cc.references)) cc.references = [];
    if (!cc.retro) cc.retro = { valid: '', worked: '', process: '', lessons: '' };
    if (!cc.thinking) cc.thinking = { assume: '', alt: '', cost: '' };
    if (!cc.spec) cc.spec = { nerede: { v: '', y: '' }, zaman: { v: '', y: '' }, kirilim: { v: '', y: '' }, buyukluk: { v: '', y: '' }, degisiklik: '' };
    if (!cc.containment) cc.containment = { action: '', owner: '', until: '', removed: false };
    // Yeni veri modeli (KPI yönü, kök neden doğrulama, izlenebilirlik) — eski kayıtlar kayıpsız taşınır.
    if (!cc.problem) cc.problem = { statement: '', geo: '', time: '', brand: '', kpiName: '', target: '', actual: '' };
    if (cc.problem.direction === undefined) cc.problem.direction = '';
    if (cc.problem.unit === undefined) cc.problem.unit = '';
    if (cc.problem.targetHigh === undefined) cc.problem.targetHigh = '';
    if (!Array.isArray(cc.whyChains)) cc.whyChains = [];
    (cc.criteria || []).forEach(cr => {
      if (cr.yon !== 'dusuk' && cr.yon !== 'yuksek') cr.yon = 'yuksek';
      ['d1', 'd3', 'd5', 'source'].forEach(k => { if (cr[k] === undefined) cr[k] = ''; });
    });
    (cc.rootCauses || []).forEach(rc => {
      if (!rc.status) rc.status = 'hipotez';
      if (!Array.isArray(rc.findings)) rc.findings = [];
      ['evidence', 'explainsSpec', 'testPlan', 'testResult', 'kpiExpected'].forEach(k => { if (rc[k] === undefined) rc[k] = ''; });
    });
    (cc.actions || []).forEach(a => {
      ['startDate', 'dueDate', 'rcIdx', 'findingIdx', 'successCriteria', 'evidence', 'delayReason', 'priority'].forEach(k => { if (a[k] === undefined) a[k] = ''; });
    });
  });
  return s;
}

function loadState() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (e) { /* bozuk kayıt */ }
  const base = (saved && saved.cases && saved.cases.ornek && saved.cases.benim)
    ? saved
    : { activeCase: 'ornek', step: 1, cases: { ornek: exampleCase(), benim: blankCase() } };
  return normalize(base);
}

function persist(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* kota dolu olabilir */ }
}

/** Etki/efor puanlarından öncelik rozeti. */
export function prioMeta(a) {
  const e = parseInt(a.etki, 10) || 0, f = parseInt(a.efor, 10) || 0;
  if (!e || !f) return { label: 'Puanlayın', bg: 'var(--surface-4)', color: 'var(--muted)', border: 'var(--line-strong)', score: -100 };
  if (e >= 4 && f <= 2) return { label: 'Hızlı kazanım', bg: 'var(--ok-soft)', color: 'var(--ok-ink)', border: 'var(--ok-border)', score: e * 2 - f + 20 };
  if (e >= 4) return { label: 'Stratejik', bg: 'var(--pri-soft)', color: 'var(--pri)', border: 'var(--pri-border-2)', score: e * 2 - f + 10 };
  if (f <= 2) return { label: 'Ara kazanım', bg: 'var(--warn-soft)', color: 'var(--warn-ink)', border: 'var(--warn-border)', score: e * 2 - f };
  return { label: 'Sorgulanmalı', bg: 'var(--alert-soft)', color: 'var(--alert)', border: 'var(--alert-border)', score: e * 2 - f - 10 };
}

/** YZ önerisiyle eklenen kayıtların doğrulama rozeti. */
export function verMeta(x) {
  if (!x || x.src !== 'yz') return { hasVer: false, verLabel: '', verBg: '', verColor: '', verBorder: '' };
  return x.verified
    ? { hasVer: true, verLabel: '✓ Doğrulandı', verBg: 'var(--ok-soft)', verColor: 'var(--ok-ink)', verBorder: 'var(--ok-border)' }
    : { hasVer: true, verLabel: '⚠ YZ önerisi — doğrulanmadı · doğruladıysanız tıklayın', verBg: 'var(--warn-soft)', verColor: 'var(--warn-ink)', verBorder: 'var(--warn-border)' };
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(loadState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const mainRef = useRef(null);

  // Güncellemeler stateRef üzerinden zincirlenir: aynı tick içindeki ardışık upd()
  // çağrıları birbirinin üzerine yazmaz, setState güncelleyicisi de yan etkisiz kalır.
  const upd = useCallback(fn => {
    const n = structuredClone(stateRef.current);
    fn(n);
    stateRef.current = n;
    persist(n);
    setState(n);
  }, []);

  const effCase = useCallback(s => {
    const keys = Object.keys(s.cases);
    let k = s.activeCase;
    if (!s.cases[k]) k = keys.find(x => x !== 'ornek') || keys[0];
    return k;
  }, []);

  const updC = useCallback(fn => upd(n => fn(n.cases[effCase(n)])), [upd, effCase]);

  const setC = useCallback((path, val) => {
    updC(c => {
      let o = c;
      for (let i = 0; i < path.length - 1; i++) o = o[path[i]];
      o[path[path.length - 1]] = val;
    });
  }, [updC]);

  const inp = useCallback((...path) => e => setC(path, e.target.value), [setC]);

  // ---- Geri al (undo) -------------------------------------------------------
  // Yıkıcı işlemler (silme, üzerine yazma) öncesinde vakanın anlık görüntüsü alınır.
  // Yığın oturuma özgüdür (kalıcı değildir); Ctrl+Z ya da alttaki bildirim geri alır.

  const undoRef = useRef([]);
  const toastTimer = useRef(null);

  const removeC = useCallback((label, fn) => {
    const s = stateRef.current;
    const eff = effCase(s);
    undoRef.current.push({ eff, label, snap: structuredClone(s.cases[eff]) });
    if (undoRef.current.length > 15) undoRef.current.shift();
    upd(n => { fn(n.cases[effCase(n)]); n.undoToast = { label, id: Date.now() }; });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      upd(n => { n.undoToast = null; });
    }, 6000);
  }, [upd, effCase]);

  const undoLast = useCallback(() => {
    const entry = undoRef.current.pop();
    if (!entry) return;
    clearTimeout(toastTimer.current);
    upd(n => {
      if (n.cases[entry.eff]) n.cases[entry.eff] = entry.snap;
      n.undoToast = null;
    });
  }, [upd]);

  const canUndo = useCallback(() => undoRef.current.length > 0, []);

  const principlesOf = s => (Array.isArray(s.principles) && s.principles.length) ? s.principles : defaultPrinciples();

  // Analiz derinliği token bütçesini ölçekler; üst sınır köprünün kabul ettiği tavandır.
  const callAi = useCallback(opts => {
    const S = stateRef.current.aiSettings || {};
    const mult = DEPTH_MULT[S.depth] || 1;
    const max = Math.min(Math.round((opts.max_tokens || 2000) * mult), 16000);
    return complete(S, { ...opts, max_tokens: max });
  }, []);

  const systemFor = useCallback((step, c) => {
    const s = stateRef.current;
    return buildSystem(step, c, s.aiSettings, principlesOf(s));
  }, []);

  // ---- Rehber (coach) -------------------------------------------------------

  const runCoach = useCallback(step => {
    const s0 = stateRef.current;
    const eff = effCase(s0);
    upd(n => {
      const cc = n.cases[eff];
      cc.coach = cc.coach || {};
      cc.coach[step] = { status: 'busy', intro: '', items: [], questions: [] };
    });
    (async () => {
      try {
        const s = stateRef.current;
        const c = s.cases[eff];
        const level = (s.aiSettings || {}).level;
        const task = level === 'ogreten'
          ? COACH_TEACH_TASK
          : buildCoachTask(step, principlesOf(s))
            + (level === 'hizli' ? COACH_FAST_SUFFIX : '')
            + (COACH_DEPTH_SUFFIX[(s.aiSettings || {}).depth] || '');
        let lastTick = 0;
        const reply = await callAi({
          max_tokens: 4600,
          system: systemFor(step, c) + COACH_JSON_RULE + task,
          messages: [{ role: 'user', content: 'Problem tanımıma ve önceki adımlardaki çalışmama göre bu adım için önerilerini JSON olarak üret.' }],
          onDelta: text => {
            const now = Date.now();
            if (now - lastTick < 400) return;
            lastTick = now;
            upd(n => {
              const ck = n.cases[eff].coach && n.cases[eff].coach[step];
              if (ck && ck.status === 'busy') ck.chars = text.length;
            });
          }
        });
        const j = parseJsonReply(reply);
        const items = coachItems(step, j, principlesOf(stateRef.current));
        upd(n => {
          const cc = n.cases[eff];
          cc.coach = cc.coach || {};
          cc.coach[step] = { status: 'done', intro: j.giris || '', items, questions: Array.isArray(j.sorular) ? j.sorular.map(String) : [] };
        });
      } catch (e) {
        upd(n => {
          const cc = n.cases[eff];
          cc.coach = cc.coach || {};
          cc.coach[step] = { status: 'error', intro: '', items: [], questions: [], errMsg: (e && e.message) ? String(e.message).slice(0, 200) : 'bilinmeyen hata' };
        });
      }
    })();
  }, [upd, effCase, callAi, systemFor]);

  const stepFormEmpty = (step, c) => {
    if (step === 2) return c.drivers.length === 0;
    if (step === 3) return c.driverAnalysis.length === 0 && c.sipoc.length === 0;
    if (step === 4) return c.findings.length === 0;
    if (step === 5) return !c.whys.some(w => (w || '').trim()) && c.rootCauses.length === 0;
    if (step === 6) return c.alternatives.length === 0;
    return false;
  };

  const ensureCoach = useCallback(force => {
    const st = stateRef.current;
    const step = st.step;
    if (step < 1 || step > 6) return;
    const c = st.cases[effCase(st)];
    if (!((c.problem.statement || '').trim())) return;
    const ck = c.coach && c.coach[step];
    if (ck && (ck.status === 'busy' || ck.status === 'done' || ck.status === 'error')) return;
    if (!force && (st.aiSettings && st.aiSettings.auto === false)) return;
    if (!force && !stepFormEmpty(step, c)) return;
    runCoach(step);
  }, [effCase, runCoach]);

  const applyCoachItem = useCallback((step, idx) => {
    // Üzerine yazan öneriler (ifade / karar) geri alınabilsin
    const s0 = stateRef.current;
    const eff0 = effCase(s0);
    const cur = s0.cases[eff0];
    const it0 = cur.coach && cur.coach[step] && cur.coach[step].items[idx];
    if (it0 && !it0.added) {
      const overwritesStatement = it0.kind === 'statement' && (cur.problem.statement || '').trim();
      const overwritesDecision = it0.kind === 'decision' && ((cur.decision.choice || '').trim() || (cur.decision.rationale || '').trim());
      if (overwritesStatement || overwritesDecision) {
        undoRef.current.push({ eff: eff0, label: overwritesStatement ? 'önceki problem ifadesi' : 'önceki karar taslağı', snap: structuredClone(cur) });
        if (undoRef.current.length > 15) undoRef.current.shift();
      }
    }
    updC(cc => {
      const it = cc.coach && cc.coach[step] && cc.coach[step].items[idx];
      if (!it || it.added) return;
      if (it.kind === 'driver' || it.kind === 'da' || it.kind === 'finding' || it.kind === 'rootcause') { it.payload.src = 'yz'; it.payload.verified = false; }
      if (it.kind === 'statement') cc.problem.statement = it.payload;
      else if (it.kind === 'dim') cc.problem[it.payload.key] = it.payload.value;
      else if (it.kind === 'kpi') {
        if (it.payload.kpiName) cc.problem.kpiName = it.payload.kpiName;
        if (it.payload.target) cc.problem.target = it.payload.target;
        if (it.payload.actual) cc.problem.actual = it.payload.actual;
      }
      else if (it.kind === 'driver') cc.drivers.push(it.payload);
      else if (it.kind === 'da') cc.driverAnalysis.push(it.payload);
      else if (it.kind === 'sipoc') cc.sipoc.push(it.payload);
      else if (it.kind === 'finding') cc.findings.push(it.payload);
      else if (it.kind === 'whys') it.payload.forEach((w, i) => { if (i < 5 && !(cc.whys[i] || '').trim()) cc.whys[i] = w; });
      else if (it.kind === 'fishbone') Object.keys(cc.fishbone).forEach(k => { if (!(cc.fishbone[k] || '').trim() && it.payload[k]) cc.fishbone[k] = String(it.payload[k]); });
      else if (it.kind === 'rootcause') cc.rootCauses.push(it.payload);
      else if (it.kind === 'alt') cc.alternatives.push(it.payload);
      else if (it.kind === 'criterion') cc.criteria.push(it.payload);
      else if (it.kind === 'decision') {
        if (!(cc.decision.choice || '').trim()) cc.decision.choice = it.payload.choice;
        if (!(cc.decision.rationale || '').trim()) cc.decision.rationale = it.payload.rationale;
      }
      it.added = true;
    });
  }, [updC]);

  const coachRefresh = useCallback(step => {
    updC(cc => { if (cc.coach) delete cc.coach[step]; });
    setTimeout(() => ensureCoach(true), 60);
  }, [updC, ensureCoach]);

  // ---- Karar / aksiyon / denetim / rapor ------------------------------------

  const runDecisionCoach = useCallback(() => {
    const s0 = stateRef.current;
    const eff = effCase(s0);
    if (s0.cases[eff].decisionCoach && s0.cases[eff].decisionCoach.status === 'busy') return;
    upd(n => { n.cases[eff].decisionCoach = { status: 'busy', choice: '', rationale: '' }; });
    (async () => {
      try {
        const c = stateRef.current.cases[eff];
        const reply = await callAi({
          max_tokens: 1800,
          system: systemFor(6, c) + DECISION_COACH_TASK,
          messages: [{ role: 'user', content: 'Alternatiflerime, kriterlerime ve matris puanlarıma göre karar önerini JSON olarak üret.' }]
        });
        const j = parseJsonReply(reply);
        upd(n => { n.cases[eff].decisionCoach = { status: 'done', choice: String(j.oneri || ''), rationale: String(j.gerekce || '') }; });
      } catch (e) {
        upd(n => { n.cases[eff].decisionCoach = { status: 'error', choice: '', rationale: '' }; });
      }
    })();
  }, [upd, effCase, callAi, systemFor]);

  const runActionCoach = useCallback(() => {
    const s0 = stateRef.current;
    const eff = effCase(s0);
    if (s0.cases[eff].actionCoach && s0.cases[eff].actionCoach.status === 'busy') return;
    upd(n => { n.cases[eff].actionCoach = { status: 'busy', items: [] }; });
    (async () => {
      try {
        const c = stateRef.current.cases[eff];
        const reply = await callAi({
          max_tokens: 2400,
          system: systemFor(6, c) + ACTION_COACH_TASK,
          messages: [{ role: 'user', content: 'Kararıma ve kök nedenlerime göre önceliklendirilmiş aksiyon planı öner.' }]
        });
        const j = parseJsonReply(reply);
        const items = (Array.isArray(j.aksiyonlar) ? j.aksiyonlar : []).map(x => ({
          aksiyon: String(x.aksiyon || ''), sorumluRol: String(x.sorumluRol || ''), sure: String(x.sure || ''),
          etki: String(x.etki || ''), efor: String(x.efor || ''), gerekce: String(x.gerekce || ''), added: false
        })).filter(x => x.aksiyon);
        upd(n => { n.cases[eff].actionCoach = { status: 'done', items }; });
      } catch (e) {
        upd(n => { n.cases[eff].actionCoach = { status: 'error', items: [] }; });
      }
    })();
  }, [upd, effCase, callAi, systemFor]);

  const runBiasScan = useCallback(() => {
    const s0 = stateRef.current;
    const eff = effCase(s0);
    if (s0.cases[eff].biasScan && s0.cases[eff].biasScan.status === 'busy') return;
    upd(n => { n.cases[eff].biasScan = { status: 'busy', ozet: '', items: [] }; });
    (async () => {
      try {
        const c = stateRef.current.cases[eff];
        const reply = await callAi({
          max_tokens: 2200,
          system: systemFor(6, c) + BIAS_SCAN_TASK,
          messages: [{ role: 'user', content: 'Çalışmamda hangi düşünme yanılgılarının izi var? Kendi metnimden kanıtlarla göster.' }]
        });
        const j = parseJsonReply(reply);
        const items = (Array.isArray(j.yanilgilar) ? j.yanilgilar : []).map(x => ({
          yanilgi: String(x.yanilgi || ''), kanit: String(x.kanit || ''), risk: String(x.risk || ''),
          yontem: String(x.yontem || ''), soru: String(x.soru || ''), ciddiyet: String(x.ciddiyet || 'orta')
        })).filter(x => x.yanilgi);
        upd(n => { n.cases[eff].biasScan = { status: 'done', ozet: String(j.ozet || ''), items }; });
      } catch (e) {
        upd(n => { n.cases[eff].biasScan = { status: 'error', ozet: '', items: [] }; });
      }
    })();
  }, [upd, effCase, callAi, systemFor]);

  const runPremortem = useCallback(() => {
    const s0 = stateRef.current;
    const eff = effCase(s0);
    if (s0.cases[eff].premortem && s0.cases[eff].premortem.status === 'busy') return;
    upd(n => { n.cases[eff].premortem = { status: 'busy', giris: '', items: [] }; });
    (async () => {
      try {
        const c = stateRef.current.cases[eff];
        const reply = await callAi({
          max_tokens: 2600,
          system: systemFor(6, c) + PREMORTEM_TASK,
          messages: [{ role: 'user', content: 'Kararım uygulandı ve 6 ay sonra başarısız oldu. Pre-mortem senaryolarını üret.' }]
        });
        const j = parseJsonReply(reply);
        const items = (Array.isArray(j.senaryolar) ? j.senaryolar : []).map(x => ({
          baslik: String(x.baslik || ''), hikaye: String(x.hikaye || ''),
          sinyal: String(x.erkenSinyal || ''), onlem: String(x.onleyiciTedbir || ''), added: false
        })).filter(x => x.baslik || x.hikaye);
        upd(n => { n.cases[eff].premortem = { status: 'done', giris: String(j.giris || ''), items }; });
      } catch (e) {
        upd(n => { n.cases[eff].premortem = { status: 'error', giris: '', items: [] }; });
      }
    })();
  }, [upd, effCase, callAi, systemFor]);

  const runAudit = useCallback(() => {
    const s0 = stateRef.current;
    const eff = effCase(s0);
    if (s0.cases[eff].audit && s0.cases[eff].audit.status === 'busy') return;
    upd(n => { n.cases[eff].audit = { status: 'busy', text: '' }; });
    (async () => {
      try {
        const c = stateRef.current.cases[eff];
        const reply = await callAi({
          max_tokens: 2200,
          system: systemFor(8, c) + AUDIT_TASK,
          messages: [{ role: 'user', content: 'Çalışmamın uçtan uca tutarlılık denetimini yap.' }]
        });
        upd(n => { n.cases[eff].audit = { status: 'done', text: String(reply || '').trim() }; });
      } catch (e) {
        upd(n => { n.cases[eff].audit = { status: 'error', text: '' }; });
      }
    })();
  }, [upd, effCase, callAi, systemFor]);

  const runReportSummary = useCallback(() => {
    const s0 = stateRef.current;
    const eff = effCase(s0);
    const prev = s0.cases[eff].report;
    if (prev && prev.status === 'busy') return;
    upd(n => { n.cases[eff].report = { status: 'busy', text: (prev && prev.text) || '' }; });
    (async () => {
      try {
        const c = stateRef.current.cases[eff];
        const reply = await callAi({
          max_tokens: 1200,
          system: systemFor(7, c) + REPORT_SUMMARY_TASK,
          messages: [{ role: 'user', content: 'Çalışmamın yönetici özetini yaz.' }]
        });
        upd(n => { n.cases[eff].report = { status: 'done', text: String(reply || '').trim() }; });
      } catch (e) {
        upd(n => { n.cases[eff].report = { status: 'error', text: '' }; });
      }
    })();
  }, [upd, effCase, callAi, systemFor]);

  // ---- Sohbet asistanı ------------------------------------------------------

  const askAi = useCallback(prompt => {
    const text = (prompt || '').trim();
    const s0 = stateRef.current;
    if (!text || s0.aiBusy) return;
    const step = s0.step;
    const eff = effCase(s0);
    upd(n => {
      const cc = n.cases[eff];
      cc.ai = cc.ai || {};
      cc.ai[step] = cc.ai[step] || [];
      cc.ai[step].push({ role: 'user', content: text });
      n.aiBusy = true;
      n.aiInput = '';
    });
    setTimeout(() => { const el = mainRef.current; if (el) el.scrollTop = el.scrollHeight; }, 80);
    (async () => {
      try {
        const c = stateRef.current.cases[eff];
        const messages = ((c.ai && c.ai[step]) || []).map(m => ({ role: m.role, content: m.content }));
        // Akış için yer tutucu mesaj: delta'lar geldikçe son mesajın içine yazılır.
        let placed = false;
        let lastTick = 0;
        const writeLive = (content, done) => {
          upd(n => {
            const cc = n.cases[eff];
            cc.ai = cc.ai || {}; cc.ai[step] = cc.ai[step] || [];
            const arr = cc.ai[step];
            if (!placed) { arr.push({ role: 'assistant', content, live: !done }); placed = true; }
            else {
              const last = arr[arr.length - 1];
              last.content = content;
              if (done) delete last.live; else last.live = true;
            }
            if (done) n.aiBusy = false;
          });
        };
        const reply = await callAi({
          max_tokens: 2500, system: systemFor(step, c), messages,
          onDelta: text => {
            const now = Date.now();
            if (now - lastTick < 250 || !text.trim()) return;
            lastTick = now;
            writeLive(text, false);
          }
        });
        writeLive(reply, true);
      } catch (e) {
        upd(n => {
          const cc = n.cases[eff];
          cc.ai = cc.ai || {}; cc.ai[step] = cc.ai[step] || [];
          cc.ai[step].push({ role: 'assistant', content: 'Üzgünüm, bir hata oluştu: ' + ((e && e.message) || e) + '\nLütfen tekrar deneyin.' });
          n.aiBusy = false;
        });
      }
    })();
  }, [upd, effCase, callAi, systemFor]);

  const fieldHelp = useCallback((label, value) => {
    const v = value && String(value).trim() ? '"' + value + '"' : '(henüz boş)';
    askAi('"' + label + '" alanı için yardım istiyorum. Mevcut içeriğim: ' + v + '. Bu alanı metodolojiye uygun doldurmam için: (1) ne yazmalıyım, nelere dikkat etmeliyim, (2) mevcut içerikte eksik ya da hatalı ne var, (3) örnek bir taslak öner.');
  }, [askAi]);

  // ---- Referanslar ----------------------------------------------------------

  const setRefField = useCallback((eff, id, k, v) => {
    upd(n => { const r = ((n.cases[eff] || {}).references || []).find(x => x.id === id); if (r) r[k] = v; });
  }, [upd]);

  const maybeSummarizeRef = useCallback((eff, id) => {
    const r = ((stateRef.current.cases[eff] || {}).references || []).find(x => x.id === id);
    if (!r || !(r.text || '').trim() || r.text.length <= 4000 || r.summary) return;
    setRefField(eff, id, 'summarizing', true);
    (async () => {
      try {
        const s = await callAi({
          max_tokens: 900,
          system: REF_SUMMARY_SYSTEM,
          messages: [{ role: 'user', content: r.text.slice(0, 30000) }]
        });
        setRefField(eff, id, 'summary', String(s).trim());
      } catch (e) { /* özet başarısız — ham metin kullanılır */ }
      setRefField(eff, id, 'summarizing', false);
    })();
  }, [callAi, setRefField]);

  const addReference = useCallback(ref => {
    const eff = effCase(stateRef.current);
    const r = { ...ref, id: 'r' + Date.now(), addedAt: new Date().toISOString() };
    upd(n => { const cc = n.cases[eff]; cc.references = cc.references || []; cc.references.push(r); });
    if (r.type === 'link' && r.url) {
      (async () => {
        try {
          const res = await fetch('/.netlify/functions/fetch-ref', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ url: r.url })
          });
          const j = await res.json();
          if (res.ok && j.text) setRefField(eff, r.id, 'text', j.text);
          else throw new Error((j && j.error) || 'içerik yok');
        } catch (e) {
          setRefField(eff, r.id, 'fetchFailed', true);
        }
        maybeSummarizeRef(eff, r.id);
      })();
    } else maybeSummarizeRef(eff, r.id);
  }, [upd, effCase, setRefField, maybeSummarizeRef]);

  // ---- Gezinme --------------------------------------------------------------

  const goStep = useCallback(n => {
    upd(s => { s.step = n; });
    if (mainRef.current) mainRef.current.scrollTop = 0;
    setTimeout(() => ensureCoach(), 60);
  }, [upd, ensureCoach]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme === 'dark' ? 'dark' : 'light');
  }, [state.theme]);

  const toggleTheme = useCallback(() => {
    upd(n => { n.theme = n.theme === 'dark' ? 'light' : 'dark'; });
  }, [upd]);

  useEffect(() => {
    const t = setTimeout(() => ensureCoach(), 60);
    return () => clearTimeout(t);
    // yalnızca ilk yüklemede
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eff = effCase(state);
  const value = useMemo(() => ({
    state, eff, c: state.cases[eff], step: state.step,
    principles: principlesOf(state),
    mainRef,
    upd, updC, setC, inp, goStep, toggleTheme, removeC, undoLast, canUndo,
    ensureCoach, runCoach, applyCoachItem, coachRefresh,
    runDecisionCoach, runActionCoach, runAudit, runBiasScan, runPremortem, runReportSummary,
    askAi, fieldHelp, addReference
  }), [state, eff, upd, updC, setC, inp, goStep, toggleTheme, removeC, undoLast, canUndo, ensureCoach, runCoach, applyCoachItem, coachRefresh, runDecisionCoach, runActionCoach, runAudit, runBiasScan, runPremortem, runReportSummary, askAi, fieldHelp, addReference]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
