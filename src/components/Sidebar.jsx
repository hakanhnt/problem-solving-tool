import React from 'react';
import { useStore } from '../lib/store.jsx';
import { blankCase, exampleCase, exampleCase2, stepsFor, caseTemplatesFor } from '../lib/defaults.js';
import { stepChecklist, caseMaturity, triageAdvice } from '../lib/derive.js';
import { HButton, HA } from '../ui/primitives.jsx';
import Logo from '../ui/Logo.jsx';

/** Aktif çalışmanın hangi adımlarında içerik var — ilerleme göstergesi için. */
function stepDone(c, n) {
  if (n === 1) return !!(c.problem.statement || '').trim();
  if (n === 2) return c.drivers.some(d => (d.name || '').trim());
  if (n === 3) return c.driverAnalysis.length > 0 || c.sipoc.length > 0;
  if (n === 4) return c.findings.some(f => (f.text || '').trim());
  if (n === 5) return c.whys.some(w => (w || '').trim()) || c.rootCauses.length > 0;
  if (n === 6) return c.alternatives.length > 0 || !!(c.decision.choice || '').trim();
  if (n === 7) return (c.tracking || []).length > 0 || Object.values(c.retro || {}).some(v => (v || '').trim()) || (c.actions || []).some(a => a.status);
  // Rapor adımı: yönetici özeti üretildiyse ya da tutarlılık denetimi çalıştırıldıysa
  return !!((c.report && (c.report.text || '').trim()) || (c.audit && (c.audit.text || '').trim()));
}

export default function Sidebar({ onNavigate }) {
  const { state, eff, c, step, upd, goStep, ensureCoach, toggleTheme, lang, setLang, t } = useStore();
  const steps = stepsFor(lang);
  const doneSteps = [1, 2, 3, 4, 5, 6, 7, 8].filter(n => stepDone(c, n));
  const doneCount = doneSteps.length;
  const maturity = caseMaturity(c, lang);
  // Hiç yedek alınmadıysa ya da üzerinden bir haftadan fazla geçtiyse hatırlat.
  const backupStale = !state.lastBackup || (Date.now() - new Date(state.lastBackup).getTime()) > 7 * 86400000;

  const caseKeys = Object.keys(state.cases);
  const caseRank = k => (k === 'ornek' ? 0 : k === 'ornek2' ? 1 : 2);
  caseKeys.sort((a, b) => caseRank(a) - caseRank(b));

  const selectCase = k => { upd(n => { n.activeCase = k; }); setTimeout(() => ensureCoach(), 60); if (onNavigate) onNavigate(); };

  const renameCase = k => {
    const name = prompt(t('Çalışmanın yeni adı:', 'New name for the case:'), state.cases[k].name || '');
    if (name && name.trim()) upd(n => { n.cases[k].name = name.trim(); });
  };

  const deleteCase = k => {
    if (!confirm(t('"' + (state.cases[k].name || k) + '" çalışması silinecek. Silme sonrası "Geri al" ile kurtarabilirsiniz. Emin misiniz?', 'The case "' + (state.cases[k].name || k) + '" will be deleted. You can recover it with "Undo" afterwards. Are you sure?'))) return;
    upd(n => {
      n.trash = { key: k, data: n.cases[k], name: n.cases[k].name || k };
      delete n.cases[k];
      if (!Object.keys(n.cases).some(x => x !== 'ornek' && x !== 'ornek2')) n.cases['c' + Date.now()] = blankCase(undefined, n.lang);
      if (n.activeCase === k) { n.activeCase = Object.keys(n.cases).find(x => x !== 'ornek' && x !== 'ornek2') || Object.keys(n.cases)[0]; n.step = 1; }
    });
  };

  const [tplOpen, setTplOpen] = React.useState(false);
  const [tplName, setTplName] = React.useState('');
  const [triage, setTriage] = React.useState({ cost: '', benefit: '', urgency: '' });

  const closeTpl = () => { setTplOpen(false); setTplName(''); setTriage({ cost: '', benefit: '', urgency: '' }); };

  const createCase = (tpl, mode) => {
    const id = 'c' + Date.now();
    upd(n => {
      const nc = blankCase((tplName || '').trim() || (mode === 'quick' ? (n.lang === 'en' ? 'Quick Solve' : 'Hızlı Çözüm') : (!tpl || tpl.key === 'bos' ? (n.lang === 'en' ? 'New Case' : 'Yeni Çalışma') : tpl.ad)), n.lang);
      if (mode === 'quick') nc.mode = 'quick';
      nc.triage = { ...triage };
      if (tpl && tpl.fill) {
        if (tpl.fill.problem) Object.assign(nc.problem, tpl.fill.problem);
        if (tpl.fill.drivers) nc.drivers = structuredClone(tpl.fill.drivers);
        if (tpl.fill.criteria) nc.criteria = structuredClone(tpl.fill.criteria);
      }
      n.cases[id] = nc;
      n.activeCase = id;
      n.step = 1;
    });
    closeTpl();
  };

  return (
    <aside data-noprint="1" style={{ width: 288, flex: 'none', background: 'var(--surface)', borderRight: '1px solid var(--line-strong)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid var(--line-3)', background: 'linear-gradient(180deg,var(--brand-grad) 0%,var(--surface) 100%)' }}>
        <Logo sub={t('Problemi tanımlayın, kök nedeni doğrulayın, doğru kararı uygulayın.', 'Define the problem, verify the root cause, execute the right decision.')} />
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 11 }}>
          {[t('8 adımlık akış', '8-step flow'), t('YZ destekli', 'AI-assisted'), t('Alan bağımsız', 'Domain-agnostic')].map(chip => (
            <span key={chip} style={{ font: '600 10px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', background: 'var(--pri-soft)', border: '1px solid var(--pri-border-5)', borderRadius: 20, padding: '3px 8px' }}>{chip}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 6px' }}>
        <div style={{ flex: 1, font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px' }}>{t('ÇALIŞMALAR', 'CASES')}</div>
        <HButton
          onClick={() => { upd(n => { n.dashOpen = true; }); if (onNavigate) onNavigate(); }}
          title={t('Vaka panosu — tüm çalışmaların durumu tek ekranda', 'Case dashboard — status of all cases on one screen')}
          style={{ flex: 'none', padding: '5px 10px', border: '1px solid var(--pri-border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--pri)', font: '600 11px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
          hover={{ background: 'var(--pri-soft)' }}
        >📊 {t('Pano', 'Dashboard')}</HButton>
        <HButton
          onClick={() => setTplOpen(true)}
          style={{ flex: 'none', padding: '5px 10px', border: '1px solid var(--pri)', borderRadius: 6, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 11px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
          hover={{ background: 'var(--pri-hover)' }}
        >+ {t('Yeni', 'New')}</HButton>
      </div>

      <div style={{ padding: '2px 12px 8px', display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 190, overflow: 'auto', borderBottom: '1px solid var(--line-3)' }}>
        {caseKeys.map(k => {
          const act = eff === k;
          return (
            <div key={k} style={{ display: 'flex', gap: 4, alignItems: 'center', borderRadius: 7, background: act ? 'var(--pri-soft)' : 'transparent', padding: '7px 6px 7px 10px' }}>
              <button
                type="button"
                onClick={() => selectCase(k)}
                aria-current={act ? 'true' : undefined}
                aria-label={t('Çalışmayı aç: ', 'Open case: ') + (state.cases[k].name || k) + (act ? t(' (açık)', ' (open)') : '')}
                style={{ flex: 1, minWidth: 0, cursor: 'pointer', border: 'none', background: 'transparent', textAlign: 'left', padding: 0, font: '600 12.5px/1.3 Helvetica,Arial,sans-serif', color: act ? 'var(--pri)' : 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >{state.cases[k].name || k}</button>
              {k !== 'ornek' && k !== 'ornek2' ? (
                <>
                  <HButton
                    onClick={() => renameCase(k)} title={t('Yeniden adlandır', 'Rename')}
                    aria-label={t('"' + (state.cases[k].name || k) + '" çalışmasını yeniden adlandır', 'Rename case "' + (state.cases[k].name || k) + '"')}
                    style={{ flex: 'none', width: 22, height: 22, border: 'none', borderRadius: 5, background: 'transparent', color: 'var(--muted-2)', font: '12px/1 Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                    hover={{ background: 'var(--line-3)', color: 'var(--ink-3)' }}
                  >✎</HButton>
                  <HButton
                    onClick={() => deleteCase(k)} title={t('Çalışmayı sil', 'Delete case')}
                    aria-label={t('"' + (state.cases[k].name || k) + '" çalışmasını sil', 'Delete case "' + (state.cases[k].name || k) + '"')}
                    style={{ flex: 'none', width: 22, height: 22, border: 'none', borderRadius: 5, background: 'transparent', color: 'var(--muted-2)', font: '700 13px/1 Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                    hover={{ background: 'var(--alert-soft)', color: 'var(--danger)' }}
                  >×</HButton>
                </>
              ) : null}
            </div>
          );
        })}
      </div>

      {state.trash ? (
        <div style={{ margin: '8px 12px 0', background: 'var(--warn-soft-2)', border: '1px solid var(--warn-border-2)', borderRadius: 8, padding: '9px 11px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0, font: '12px/1.4 Helvetica,Arial,sans-serif', color: 'var(--warn-ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t('"' + state.trash.name + '" silindi', '"' + state.trash.name + '" deleted')}</div>
          <HButton
            onClick={() => upd(n => { if (!n.trash) return; n.cases[n.trash.key] = n.trash.data; n.activeCase = n.trash.key; n.trash = null; })}
            style={{ flex: 'none', padding: '5px 10px', border: '1px solid var(--pri)', borderRadius: 6, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 11px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--pri-hover)' }}
          >{t('Geri al', 'Undo')}</HButton>
          <HButton
            onClick={() => upd(n => { n.trash = null; })} title={t('Kalıcı olarak kaldır', 'Remove permanently')}
            style={{ flex: 'none', width: 20, height: 20, border: 'none', background: 'transparent', color: 'var(--muted-2)', font: '700 12px/1 Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ color: 'var(--ink-3)' }}
          >×</HButton>
        </div>
      ) : null}

      {c.mode === 'quick' ? (
        <div style={{ padding: '12px 16px', flex: 1, overflow: 'auto' }}>
          <div style={{ background: 'var(--pri-soft)', border: '1px solid var(--pri-border-5)', borderRadius: 9, padding: '11px 13px' }}>
            <div style={{ font: '700 12px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>⚡ {t('Hızlı çözüm modu', 'Quick solve mode')}</div>
            <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', marginTop: 3 }}>{t('Bu çalışma tek ekranlık hızlı akışta. Sorun derinleşirse ekrandaki düğmeyle 8 adımlık tam akışa geçirebilirsiniz — girilenler taşınır.', 'This case is in the one-screen quick flow. If the problem runs deeper, promote it to the 8-step full flow with the on-screen button — your entries carry over.')}</div>
          </div>
        </div>
      ) : (<>
      <div style={{ padding: '12px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '0 0 6px' }}>
          <div style={{ flex: 1, font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px' }}>{t('ÇALIŞMA İLERLEMESİ', 'CASE PROGRESS')}</div>
          <div style={{ font: '700 11px Helvetica,Arial,sans-serif', color: doneCount === 8 ? 'var(--ok-ink)' : 'var(--pri)' }}>{doneCount}/8</div>
        </div>
        <div style={{ display: 'flex', gap: 3 }} role="img" aria-label={t('8 adımdan ' + doneCount + ' adımda içerik var', 'Content in ' + doneCount + ' of 8 steps')}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => {
            const ck = stepChecklist(c, n, lang);
            return (
              <div
                key={n}
                title={n + '. ' + steps[n - 1].title + ' — ' + (ck.missing === 0 ? t('tamamlanma ölçütleri karşılandı', 'completion criteria met') : ck.missing + t(' ölçüt eksik: ', ' criteria missing: ') + ck.items.filter(x => !x.ok).map(x => x.label).join(', '))}
                style={{ flex: 1, height: 4, borderRadius: 2, background: ck.missing === 0 ? 'var(--ok)' : (doneSteps.includes(n) ? 'var(--pri)' : 'var(--line)') }}
              />
            );
          })}
        </div>
        <div
          title={t('Alan doluluğu değil, metodolojik olgunluk: kanıt, doğrulama ve KPI ile teyit durumunu gösterir.', 'Methodological maturity, not field completion: shows the status of evidence, verification and KPI confirmation.')}
          style={{ marginTop: 8, display: 'inline-block', font: '600 10.5px Helvetica,Arial,sans-serif', letterSpacing: '.3px', borderRadius: 20, padding: '3px 9px', color: maturity.key === 'dogrulandi' ? 'var(--ok-ink)' : 'var(--pri-ink)', background: maturity.key === 'dogrulandi' ? 'var(--ok-soft)' : 'var(--pri-soft)', border: '1px solid ' + (maturity.key === 'dogrulandi' ? 'var(--ok-border)' : 'var(--pri-border-5)') }}
        >{t('Olgunluk: ', 'Maturity: ')}{maturity.label}</div>
      </div>

      <nav aria-label={t('Çalışma adımları', 'Case steps')} style={{ padding: '2px 12px 8px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflow: 'auto' }}>
        {steps.map((s, i) => {
          const n = i + 1, active = step === n, done = doneSteps.includes(n);
          const ck = stepChecklist(c, n, lang);
          return (
            <button
              key={n} type="button"
              aria-current={active ? 'step' : undefined}
              aria-label={t(n + '. adım: ', 'Step ' + n + ': ') + s.title + ' — ' + (ck.missing === 0 ? t('tamamlandı', 'completed') : ck.missing + t(' ölçüt eksik', ' criteria missing'))}
              onClick={() => { goStep(n); if (onNavigate) onNavigate(); }}
              style={{
                display: 'flex', gap: 10, alignItems: 'flex-start', padding: 10, borderRadius: 8, cursor: 'pointer',
                background: active ? 'var(--pri-soft)' : 'transparent', border: 'none', textAlign: 'left', width: '100%', font: 'inherit'
              }}
            >
              <div aria-hidden="true" style={{
                width: 22, height: 22, flex: 'none', borderRadius: '50%',
                background: active ? 'var(--pri)' : (ck.missing === 0 ? 'var(--ok-soft-2)' : (done ? 'var(--pri-soft)' : 'var(--line-2)')),
                color: active ? 'var(--on-pri)' : (ck.missing === 0 ? 'var(--ok)' : (done ? 'var(--pri)' : 'var(--ink-4)')),
                font: '700 11px/22px Helvetica,Arial,sans-serif', textAlign: 'center'
              }}>{!active && ck.missing === 0 ? '✓' : n}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '600 13px/1.35 Helvetica,Arial,sans-serif', color: active ? 'var(--pri)' : 'var(--ink-2)' }}>{s.title}</div>
                <div style={{ font: '11px/1.4 Helvetica,Arial,sans-serif', color: active ? 'var(--pri-soft-ink)' : 'var(--muted-3)', marginTop: 1 }}>
                  {ck.missing > 0 && done ? ck.missing + t(' ölçüt eksik', ' criteria missing') : s.sub}
                </div>
              </div>
            </button>
          );
        })}
      </nav>
      </>)}

      {tplOpen ? (
        <div data-noprint="1" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 24 }} onClick={closeTpl}>
          <div style={{ background: 'var(--surface)', borderRadius: 12, width: 520, maxWidth: '94vw', maxHeight: '84vh', overflow: 'auto', padding: '18px 20px', boxShadow: '0 18px 50px rgba(0,0,0,.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ font: '700 15px Helvetica,Arial,sans-serif', color: 'var(--ink)', margin: '0 0 4px' }}>{t('Yeni çalışma', 'New case')}</div>
            <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', margin: '0 0 12px' }}>{t('Her sorun aynı derinliği hak etmez: önce kısa bir fayda/maliyet triyajı yapın, sonra tam akış ya da hızlı çözüm seçin.', 'Not every problem deserves the same depth: run a short benefit/cost triage first, then choose the full flow or a quick solve.')}</div>
            <input
              className="pcx-field" value={tplName} onChange={e => setTplName(e.target.value)}
              placeholder={t('Çalışma adı (boşsa şablon adı kullanılır)', 'Case name (template name used if blank)')}
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none', margin: '0 0 12px' }}
            />

            {/* Triyaj kapısı — fayda/maliyet/aciliyet → akış önerisi */}
            <div data-triage="1" style={{ background: 'var(--surface-4)', border: '1px solid var(--line-strong)', borderRadius: 9, padding: '11px 13px', margin: '0 0 12px' }}>
              <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.6px', margin: '0 0 8px' }}>{t('TRİYAJ — BU SORUN HANGİ AKIŞI HAK EDİYOR? (isteğe bağlı)', 'TRIAGE — WHICH FLOW DOES THIS PROBLEM DESERVE? (optional)')}</div>
              {[
                { k: 'cost', q: t('Kökten çözüm için gereken analiz süresi/kaynağı?', 'Analysis time/resources needed for a root-cause fix?'), opts: [['dusuk', t('Kısa — dakikalar/saatler', 'Short — minutes/hours')], ['orta', t('Orta — günler', 'Moderate — days')], ['yuksek', t('Yüksek — haftalar / ek kaynak', 'High — weeks / extra resources')]] },
                { k: 'benefit', q: t('Kökten çözümün sağlayacağı fayda?', 'Benefit of a root-cause fix?'), opts: [['dusuk', t('Düşük', 'Low')], ['orta', t('Orta', 'Moderate')], ['yuksek', t('Yüksek', 'High')]] },
                { k: 'urgency', q: t('Zaman kısıtı / fırsat penceresi?', 'Time pressure / opportunity window?'), opts: [['dusuk', t('Acele yok', 'No rush')], ['orta', t('Orta', 'Moderate')], ['yuksek', t('Çok acil', 'Very urgent')]] }
              ].map(row => (
                <label key={row.k} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', margin: '0 0 6px' }}>
                  <span style={{ flex: '1 1 200px', font: '600 11.5px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{row.q}</span>
                  <select
                    className="pcx-field" value={triage[row.k]}
                    onChange={e => setTriage(x => ({ ...x, [row.k]: e.target.value }))}
                    style={{ flex: '1 1 170px', padding: '6px 8px', border: '1px solid var(--field-border)', borderRadius: 6, font: '12px Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)' }}
                  >
                    <option value="">{t('— seçin —', '— select —')}</option>
                    {row.opts.map(([v, lb]) => <option key={v} value={v}>{lb}</option>)}
                  </select>
                </label>
              ))}
              {(() => {
                const adv = triageAdvice(triage, lang);
                if (!adv) return null;
                const warn = adv.key === 'beklet' || adv.key === 'delege';
                return (
                  <div role="status" style={{ marginTop: 4, background: warn ? 'var(--warn-soft)' : adv.key === 'hizli' ? 'var(--pri-soft)' : 'var(--ok-soft)', border: '1px solid ' + (warn ? 'var(--warn-border)' : adv.key === 'hizli' ? 'var(--pri-border-5)' : 'var(--ok-border)'), borderRadius: 7, padding: '8px 11px' }}>
                    <div style={{ font: '700 11.5px Helvetica,Arial,sans-serif', color: warn ? 'var(--warn-ink)' : adv.key === 'hizli' ? 'var(--pri-ink)' : 'var(--ok-ink)' }}>{adv.label}</div>
                    <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: warn ? 'var(--warn-ink)' : adv.key === 'hizli' ? 'var(--pri-ink)' : 'var(--ok-ink)', marginTop: 2 }}>{adv.text}</div>
                    {adv.urgencyNote ? <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', marginTop: 3 }}>{adv.urgencyNote}</div> : null}
                  </div>
                );
              })()}
            </div>

            {/* Hızlı çözüm modu */}
            <HButton
              onClick={() => createCase(null, 'quick')}
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', textAlign: 'left', padding: '11px 13px', border: '1px solid var(--pri-border)', borderRadius: 9, background: 'var(--pri-soft)', cursor: 'pointer', margin: '0 0 12px' }}
              hover={{ background: 'var(--pri-soft-hover)' }}
            >
              <div style={{ font: '700 13px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>⚡ {t('Hızlı çözüm oluştur', 'Create a quick solve')}</div>
              <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', marginTop: 2 }}>{t('15-20 dakikalık sorunlar için tek ekran: tanım, sürücü, birkaç "neden", önlem ve sorumlu. Derinleşirse tek tıkla tam akışa geçer.', 'One screen for 15-20 minute problems: definition, driver, a few whys, countermeasure and owner. Promotes to the full flow with one click if it runs deeper.')}</div>
            </HButton>

            <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.6px', margin: '0 0 8px' }}>{t('TAM AKIŞ (8 ADIM) — ŞABLON SEÇİN', 'FULL FLOW (8 STEPS) — PICK A TEMPLATE')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {caseTemplatesFor(lang).map(tpl => (
                <HButton
                  key={tpl.key} onClick={() => createCase(tpl)}
                  style={{ textAlign: 'left', padding: '11px 13px', border: '1px solid ' + (tpl.key === 'bos' ? 'var(--field-border)' : 'var(--pri-border-2)'), borderRadius: 9, background: tpl.key === 'bos' ? 'var(--surface)' : 'var(--pri-soft-2)', cursor: 'pointer' }}
                  hover={{ background: 'var(--pri-soft)' }}
                >
                  <div style={{ font: '700 13px Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{tpl.ad}</div>
                  <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', marginTop: 2 }}>{tpl.desc}</div>
                </HButton>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <HButton
                onClick={closeTpl}
                style={{ padding: '8px 14px', border: '1px solid var(--field-border)', borderRadius: 7, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                hover={{ background: 'var(--surface-4)' }}
              >{t('Vazgeç', 'Cancel')}</HButton>
            </div>
          </div>
        </div>
      ) : null}

      <div style={{ padding: '14px 16px', borderTop: '1px solid var(--line-3)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {eff === 'ornek' || eff === 'ornek2' ? (
          <HButton
            onClick={() => { if (confirm(t('Örnek çalışma ilk haline döndürülecek. Emin misiniz?', 'The example case will be reset to its original state. Are you sure?'))) upd(n => { if (eff === 'ornek2') n.cases.ornek2 = exampleCase2(); else n.cases.ornek = exampleCase(n.lang); }); }}
            style={{ padding: '8px 10px', border: '1px solid var(--field-border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--surface-4)' }}
          >{t('Örnek çalışmayı sıfırla', 'Reset example case')}</HButton>
        ) : null}
        <HA
          href={'/rehber.html' + (state.theme === 'dark' ? '?tema=koyu' : '')} target="_blank" rel="noreferrer"
          style={{ display: 'block', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--field-border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 12px Helvetica,Arial,sans-serif', textDecoration: 'none', textAlign: 'left' }}
          hover={{ background: 'var(--surface-4)' }}
        >📖 {t('Kullanım Rehberi', 'User Guide')}</HA>
        <HButton
          onClick={() => { try { localStorage.removeItem('pcx_intro_v1'); } catch (e) { /* gizli mod */ } location.reload(); }}
          style={{ padding: '8px 10px', border: '1px solid var(--field-border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer', textAlign: 'left' }}
          hover={{ background: 'var(--surface-4)' }}
        >{t('🏠 Tanıtım ekranı', '🏠 Intro screen')}</HButton>
        <div role="group" aria-label="Dil / Language" style={{ display: 'flex', gap: 0, border: '1px solid var(--field-border)', borderRadius: 6, overflow: 'hidden' }}>
          {[['tr', 'Türkçe'], ['en', 'English']].map(([k, lb]) => (
            <button
              key={k} type="button"
              onClick={() => setLang(k)}
              aria-pressed={lang === k}
              style={{
                flex: 1, padding: '7px 10px', border: 'none', cursor: 'pointer',
                background: lang === k ? 'var(--pri)' : 'var(--surface)',
                color: lang === k ? 'var(--on-pri)' : 'var(--ink-3)',
                font: '600 12px Helvetica,Arial,sans-serif'
              }}
            >{lb}</button>
          ))}
        </div>
        <HButton
          onClick={toggleTheme}
          title={state.theme === 'dark' ? t('Aydınlık temaya geç', 'Switch to light theme') : t('Karanlık temaya geç', 'Switch to dark theme')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid var(--field-border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer', textAlign: 'left' }}
          hover={{ background: 'var(--surface-4)' }}
        >
          <span style={{ flex: 'none', font: '13px/1 Helvetica,Arial,sans-serif' }}>{state.theme === 'dark' ? '☀' : '☾'}</span>
          <span style={{ flex: 1 }}>{state.theme === 'dark' ? t('Aydınlık tema', 'Light theme') : t('Karanlık tema', 'Dark theme')}</span>
          <span style={{ flex: 'none', display: 'flex', alignItems: 'center', width: 30, height: 16, borderRadius: 20, background: state.theme === 'dark' ? 'var(--pri)' : 'var(--line-strong)', padding: 2, boxSizing: 'border-box', transition: 'background .15s' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: state.theme === 'dark' ? 'var(--on-pri)' : 'var(--surface)', marginLeft: state.theme === 'dark' ? 14 : 0, transition: 'margin-left .15s' }} />
          </span>
        </HButton>
        <HButton
          onClick={() => { upd(n => { n.showSettings = true; }); if (onNavigate) onNavigate(); }}
          style={{ padding: '8px 10px', border: '1px solid var(--field-border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer', textAlign: 'left' }}
          hover={{ background: 'var(--surface-4)' }}
        >⚙ {t('Ayarlar · Kurum prensipleri', 'Settings · Company principles')}</HButton>
        {state.saveError ? (
          <div role="alert" style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--alert)', background: 'var(--alert-soft)', border: '1px solid var(--alert-border)', borderRadius: 6, padding: '7px 9px' }}>
            ⚠ {state.saveError}
          </div>
        ) : null}
        <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted-2)' }}>
          {t('Girdileriniz ', 'Your inputs are stored ')}<strong>{t('yalnızca bu tarayıcıda', 'only in this browser')}</strong>{t(' saklanır — sunucuya gönderilmez, otomatik yedeği yoktur.', ' — nothing is sent to a server, and there is no automatic backup.')}
          {backupStale ? <span style={{ color: 'var(--warn-ink)' }}>{t(" Yedek almadınız; Ayarlar'dan JSON yedeği indirin.", ' No backup yet; download a JSON backup from Settings.')}</span> : null}
        </div>
      </div>
    </aside>
  );
}
