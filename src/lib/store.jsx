// Uygulama durumu (tek state ağacı), localStorage kalıcılığı ve tüm YZ akışları.
// Veri şeması prototiple aynıdır: localStorage anahtarı `pcx_workbook_v1`.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { STORAGE_KEY, blankCase, exampleCase, defaultPrinciples } from './defaults.js';
import {
  complete, buildSystem, buildCoachTask, coachItems, parseJsonReply,
  COACH_JSON_RULE, COACH_TEACH_TASK, COACH_FAST_SUFFIX, COACH_DEPTH_SUFFIX, ACTION_COACH_TASK,
  DECISION_COACH_TASK, AUDIT_TASK, BIAS_SCAN_TASK, REPORT_SUMMARY_TASK, REF_SUMMARY_SYSTEM
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
  s.reportCfg = Object.assign({ company: '', sections: {} }, s.reportCfg || {});
  s.reportCfg.sections = Object.assign({ tanim: true, driver: true, analiz: true, bulgu: true, kok: true, karar: true, dusunme: true, referans: true }, s.reportCfg.sections);
  s.aiSettings = Object.assign({
    provider: 'auto', apiKey: '', model: '', baseUrl: '',
    level: 'dengeli', auto: true, context: '',
    length: 'kisa', tone: 'resmi', critic: 'nazik',
    temperature: 0.6, topP: '', depth: 'standart',
    headerName: '', headerPrefix: 'Bearer ', extraHeaders: ''
  }, s.aiSettings || {});
  if (!Array.isArray(s.principles) || !s.principles.length) s.principles = defaultPrinciples();
  Object.keys(s.cases).forEach(k => {
    const cc = s.cases[k];
    if (!cc.name) cc.name = k === 'ornek' ? 'Örnek Çalışma' : (k === 'benim' ? 'Benim Çalışmam' : 'Çalışma');
    if (!Array.isArray(cc.actions)) cc.actions = [];
    if (!Array.isArray(cc.tracking)) cc.tracking = [];
    if (!Array.isArray(cc.references)) cc.references = [];
    if (!cc.retro) cc.retro = { valid: '', worked: '', lessons: '' };
    if (!cc.thinking) cc.thinking = { assume: '', alt: '', cost: '' };
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
  if (!e || !f) return { label: 'Puanlayın', bg: '#f1efeb', color: '#8a857c', border: '#e0ddd7', score: -100 };
  if (e >= 4 && f <= 2) return { label: 'Hızlı kazanım', bg: '#eef4ee', color: '#3d5a3d', border: '#cfe0cf', score: e * 2 - f + 20 };
  if (e >= 4) return { label: 'Stratejik', bg: '#eef2f7', color: '#35506e', border: '#c9d4e2', score: e * 2 - f + 10 };
  if (f <= 2) return { label: 'Ara kazanım', bg: '#faf3e3', color: '#8c6a35', border: '#eaddb8', score: e * 2 - f };
  return { label: 'Sorgulanmalı', bg: '#f6e9e5', color: '#8c4a35', border: '#e5c8bf', score: e * 2 - f - 10 };
}

/** YZ önerisiyle eklenen kayıtların doğrulama rozeti. */
export function verMeta(x) {
  if (!x || x.src !== 'yz') return { hasVer: false, verLabel: '', verBg: '', verColor: '', verBorder: '' };
  return x.verified
    ? { hasVer: true, verLabel: '✓ Doğrulandı', verBg: '#eef4ee', verColor: '#3d5a3d', verBorder: '#cfe0cf' }
    : { hasVer: true, verLabel: '⚠ YZ önerisi — doğrulanmadı · doğruladıysanız tıklayın', verBg: '#faf3e3', verColor: '#8c6a35', verBorder: '#eaddb8' };
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
        const reply = await callAi({
          max_tokens: 4600,
          system: systemFor(step, c) + COACH_JSON_RULE + task,
          messages: [{ role: 'user', content: 'Problem tanımıma ve önceki adımlardaki çalışmama göre bu adım için önerilerini JSON olarak üret.' }]
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
        const reply = await callAi({ max_tokens: 2500, system: systemFor(step, c), messages });
        upd(n => {
          const cc = n.cases[eff];
          cc.ai = cc.ai || {}; cc.ai[step] = cc.ai[step] || [];
          cc.ai[step].push({ role: 'assistant', content: reply });
          n.aiBusy = false;
        });
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
    upd, updC, setC, inp, goStep,
    ensureCoach, runCoach, applyCoachItem, coachRefresh,
    runDecisionCoach, runActionCoach, runAudit, runBiasScan, runReportSummary,
    askAi, fieldHelp, addReference
  }), [state, eff, upd, updC, setC, inp, goStep, ensureCoach, runCoach, applyCoachItem, coachRefresh, runDecisionCoach, runActionCoach, runAudit, runBiasScan, runReportSummary, askAi, fieldHelp, addReference]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
