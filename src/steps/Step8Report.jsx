import React from 'react';
import { useStore, prioMeta } from '../lib/store.jsx';
import { gapInfo, decisionMatrix } from '../lib/derive.js';
import { HButton, Spinner, S } from '../ui/primitives.jsx';

const SECTION_CHIPS = [
  { key: 'tanim', label: 'Problem tanımı' },
  { key: 'driver', label: 'Driver haritası' },
  { key: 'analiz', label: 'Driver analizi' },
  { key: 'bulgu', label: 'Bulgular' },
  { key: 'kok', label: 'Kök neden' },
  { key: 'karar', label: 'Alternatifler + karar' },
  { key: 'referans', label: 'Referanslar' }
];

const secTitle = { font: '700 12px Helvetica,Arial,sans-serif', color: '#35506e', letterSpacing: '.6px', borderBottom: '1px solid #eceae5', paddingBottom: 5, margin: '0 0 8px' };
const body = { font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: '#26241f' };

export default function Step8Report() {
  const { state, c, principles, upd, runReportSummary, runAudit, updC } = useStore();
  const cfg = state.reportCfg;
  const on = k => cfg.sections[k] !== false;
  const { hasGap, kpiGapText } = gapInfo(c.problem);
  const M = decisionMatrix(c);

  const report = c.report;
  const audit = c.audit;
  const rsIdle = !report || report.status === 'idle' || report.status === 'done' || report.status === 'error';
  const auditIdle = !audit || audit.status === 'idle' || audit.status === 'error' || audit.status === 'done';

  const metaParts = [(cfg.company || '').trim(), (c.name || '').trim()].filter(Boolean);
  const metaLine = metaParts.length ? metaParts.join(' · ') + ' · ' : '';
  const reportDate = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  const dims = [
    { label: 'Yer / Birim', value: c.problem.geo },
    { label: 'Dönem', value: c.problem.time },
    { label: 'Segment / Kırılım', value: c.problem.brand }
  ].filter(d => (d.value || '').trim());

  const drivers = c.drivers.filter(d => (d.name || '').trim());
  const da = c.driverAnalysis.filter(d => (d.driver || '').trim() || (d.component || '').trim());
  const findings = c.findings.filter(f => (f.text || '').trim());
  const whys = c.whys.map((w, i) => ({ n: (i + 1) + '.', text: w || '' })).filter(w => w.text.trim());
  const rootCauses = c.rootCauses.filter(r => (r.text || '').trim());
  const alts = c.alternatives.filter(a => (a.name || '').trim());
  const actions = (c.actions || []).filter(a => (a.text || '').trim());
  const refs = c.references || [];

  return (
    <div>
      {/* Araç çubuğu — yazdırmada gizli */}
      <div data-noprint="1" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '0 0 18px' }}>
        <HButton
          onClick={() => window.print()}
          style={{ padding: '10px 16px', border: '1px solid #35506e', borderRadius: 8, background: '#35506e', color: '#fff', font: '600 13px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
          hover={S.primaryHover}
        >Yazdır / PDF olarak kaydet</HButton>

        {rsIdle ? (
          <HButton
            onClick={runReportSummary}
            style={{ padding: '10px 16px', border: '1px solid #b9cbe0', borderRadius: 8, background: '#fff', color: '#35506e', font: '600 13px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={S.ghostHover}
          >YZ ile yönetici özeti oluştur</HButton>
        ) : null}
        {report && report.status === 'busy' ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Spinner size={14} /><div style={{ font: '600 12px Helvetica,Arial,sans-serif', color: '#35506e' }}>Yönetici özeti hazırlanıyor…</div>
          </div>
        ) : null}
        {report && report.status === 'error' ? (
          <div style={{ font: '12px Helvetica,Arial,sans-serif', color: '#8c4a35' }}>Özet oluşturulamadı — tekrar deneyin.</div>
        ) : null}

        {auditIdle ? (
          <HButton
            onClick={runAudit}
            style={{ padding: '10px 16px', border: '1px solid #8c4a35', borderRadius: 8, background: '#fff', color: '#8c4a35', font: '600 13px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: '#f6e9e5' }}
          >🔎 Tutarlılık denetimi</HButton>
        ) : null}
        {audit && audit.status === 'busy' ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Spinner size={14} track="#e5c8bf" color="#8c4a35" />
            <div style={{ font: '600 12px Helvetica,Arial,sans-serif', color: '#8c4a35' }}>Denetçi tüm vakayı uçtan uca inceliyor…</div>
          </div>
        ) : null}
        {audit && audit.status === 'error' ? (
          <div style={{ font: '12px Helvetica,Arial,sans-serif', color: '#8c4a35' }}>Denetim yapılamadı — tekrar deneyin.</div>
        ) : null}
      </div>

      {audit && audit.status === 'done' && (audit.text || '').trim() ? (
        <div data-noprint="1" style={{ background: '#fdf9f5', border: '1px solid #e5c8bf', borderRadius: 10, padding: '16px 18px', margin: '0 0 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 10px' }}>
            <div style={{ font: '700 12px Helvetica,Arial,sans-serif', color: '#8c4a35', letterSpacing: '.6px' }}>🔎 TUTARLILIK DENETİM RAPORU</div>
            <HButton onClick={runAudit} style={{ marginLeft: 'auto', padding: '5px 10px', border: '1px solid #e5c8bf', borderRadius: 6, background: '#fff', color: '#8c4a35', font: '600 11px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ background: '#f6e9e5' }}>Yeniden denetle</HButton>
            <HButton onClick={() => updC(cc => { delete cc.audit; })} style={{ border: 'none', background: 'transparent', color: '#a9a49b', font: '700 14px/1 Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ color: '#57534b' }}>×</HButton>
          </div>
          <div style={{ font: '13px/1.65 Helvetica,Arial,sans-serif', color: '#26241f', whiteSpace: 'pre-wrap' }}>{audit.text}</div>
        </div>
      ) : null}

      <div data-noprint="1" style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', background: '#fff', border: '1px solid #e3e0da', borderRadius: 10, padding: '12px 16px', margin: '0 0 18px' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: '#8a857c', letterSpacing: '.6px', marginRight: 2 }}>RAPORA DAHİL:</div>
          {SECTION_CHIPS.map(s => {
            const active = on(s.key);
            return (
              <button
                key={s.key}
                onClick={() => upd(n => { n.reportCfg.sections[s.key] = !(n.reportCfg.sections[s.key] !== false); })}
                style={{
                  padding: '6px 11px', borderRadius: 20,
                  border: '1px solid ' + (active ? '#35506e' : '#d6d3ce'),
                  background: active ? '#35506e' : '#fff',
                  color: active ? '#fff' : '#8a857c',
                  font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer'
                }}
              >{s.label}</button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, minWidth: 240 }}>
          <label style={{ flex: 'none', font: '600 11.5px Helvetica,Arial,sans-serif', color: '#57534b' }}>Şirket / birim:</label>
          <input
            className="pcx-field-sm" value={cfg.company || ''}
            onChange={e => upd(n => { n.reportCfg.company = e.target.value; })}
            placeholder="Rapor başlığında görünür"
            style={{ flex: 1, boxSizing: 'border-box', padding: '7px 10px', border: '1px solid #d6d3ce', borderRadius: 6, font: '12.5px/1.4 Helvetica,Arial,sans-serif', color: '#26241f', background: '#fff', outline: 'none' }}
          />
        </div>
      </div>

      {/* Rapor */}
      <div style={{ background: '#fff', border: '1px solid #e3e0da', borderRadius: 10, padding: '34px 40px' }}>
        <div style={{ borderBottom: '2px solid #35506e', paddingBottom: 14, margin: '0 0 20px' }}>
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: '#5f7897', letterSpacing: '1.2px', margin: '0 0 6px' }}>PROBLEM ÇÖZME ÇALIŞMA RAPORU</div>
          <div style={{ font: '700 21px/1.3 Helvetica,Arial,sans-serif', color: '#26241f' }}>{(c.problem.kpiName || '').trim() || 'Problem Çözme Çalışması'}</div>
          <div style={{ font: '12px Helvetica,Arial,sans-serif', color: '#8a857c', marginTop: 5 }}>{metaLine}{reportDate}</div>
        </div>

        {report && report.status === 'done' && (report.text || '').trim() ? (
          <div style={{ background: '#f2f6fb', border: '1px solid #d8e2ee', borderRadius: 8, padding: '14px 16px', margin: '0 0 20px' }}>
            <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: '#5f7897', letterSpacing: '.8px', margin: '0 0 6px' }}>YÖNETİCİ ÖZETİ</div>
            <div style={{ font: '13px/1.65 Helvetica,Arial,sans-serif', color: '#26241f', whiteSpace: 'pre-wrap' }}>{report.text}</div>
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {on('tanim') ? (
            <div>
              <div style={secTitle}>1 · PROBLEM TANIMI</div>
              <div style={{ font: '13.5px/1.6 Helvetica,Arial,sans-serif', color: '#26241f' }}>{(c.problem.statement || '').trim() || '—'}</div>
              {dims.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 8 }}>
                  {dims.map(d => <div key={d.label} style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: '#57534b' }}><strong>{d.label}:</strong> {d.value}</div>)}
                </div>
              ) : null}
              {hasGap ? (
                <div style={{ marginTop: 10, display: 'inline-block', background: '#f6e9e5', border: '1px solid #e5c8bf', borderRadius: 6, padding: '6px 11px', font: '600 12.5px Helvetica,Arial,sans-serif', color: '#8c4a35' }}>
                  {(c.problem.kpiName || 'KPI') + ': hedef ' + (c.problem.target || '—') + ' / gerçekleşen ' + (c.problem.actual || '—')} · {kpiGapText}
                </div>
              ) : null}
            </div>
          ) : null}

          {drivers.length && on('driver') ? (
            <div>
              <div style={secTitle}>2 · DRIVER HARİTASI</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {drivers.map((d, i) => (
                  <div key={i} style={body}><strong>{d.name}</strong>{(d.note || '').trim() ? <span style={{ color: '#6d6860' }}> — {d.note}</span> : null}</div>
                ))}
              </div>
            </div>
          ) : null}

          {da.length && on('analiz') ? (
            <div>
              <div style={secTitle}>3 · DRIVER ANALİZİ</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {da.map((d, i) => (
                  <div key={i} style={body}>
                    <strong>{(d.driver ? d.driver + ' → ' : '') + (d.component || '')}</strong>
                    {(d.issue || '').trim() ? <span style={{ color: '#6d6860' }}> — {d.issue}</span> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {findings.length && on('bulgu') ? (
            <div>
              <div style={secTitle}>4 · DOĞRULANMIŞ BULGULAR</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {findings.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <div style={{ flex: 'none', background: '#35506e', color: '#fff', borderRadius: 4, font: '700 10px/1 Helvetica,Arial,sans-serif', padding: '4px 6px', marginTop: 2 }}>B{i + 1}</div>
                    <div style={body}>{f.text}{(f.evidence || '').trim() ? <span style={{ color: '#8a857c' }}> (Kanıt: {f.evidence})</span> : null}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {whys.length && on('kok') ? (
            <div>
              <div style={secTitle}>5 · KÖK NEDEN ANALİZİ (5 NEDEN)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {whys.map((w, i) => <div key={i} style={body}><strong style={{ color: '#5f7897' }}>{w.n}</strong> {w.text}</div>)}
              </div>
            </div>
          ) : null}

          {rootCauses.length && on('kok') ? (
            <div>
              <div style={secTitle}>KÖK NEDENLER VE GELİŞİM ALANLARI</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rootCauses.map((rc, i) => (
                  <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <div style={{ flex: 'none', background: '#8c4a35', color: '#fff', borderRadius: 4, font: '700 10px/1 Helvetica,Arial,sans-serif', padding: '4px 6px', marginTop: 2 }}>KN{i + 1}</div>
                    <div>
                      <div style={body}>{rc.text}</div>
                      {(rc.principles || []).length ? (
                        <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: '#5f7897', marginTop: 3 }}>
                          Prensipler: {(rc.principles || []).map(pi => (pi + 1) + '. ' + (principles[pi] || '')).join(' · ')}
                        </div>
                      ) : null}
                      {(rc.competency || '').trim() ? (
                        <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: '#8a857c', marginTop: 2 }}>Yetkinlik gelişim alanı: {rc.competency}</div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {alts.length && on('karar') ? (
            <div>
              <div style={secTitle}>6 · ALTERNATİFLER VE KARAR</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '0 0 12px' }}>
                {alts.map((a, i) => {
                  const score = M.rows[i] ? M.rows[i].total : '—';
                  const meta = [a.method, score !== '—' ? 'puan ' + score : ''].filter(Boolean).join(' · ');
                  return (
                    <div key={i} style={body}><strong>A{i + 1}</strong> · {a.name}{meta ? <span style={{ color: '#8a857c' }}> ({meta})</span> : null}</div>
                  );
                })}
              </div>
              {(c.decision.choice || '').trim() ? (
                <div style={{ background: '#eef4ee', border: '1px solid #cfe0cf', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: '#4a6741', letterSpacing: '.8px', margin: '0 0 6px' }}>KARAR</div>
                  <div style={{ font: '600 13px/1.55 Helvetica,Arial,sans-serif', color: '#26241f' }}>{c.decision.choice}</div>
                  {(c.decision.rationale || '').trim() ? <div style={{ font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: '#3d5a3d', marginTop: 6 }}>{c.decision.rationale}</div> : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {actions.length && on('karar') ? (
            <div>
              <div style={secTitle}>AKSİYON PLANI</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {actions.map((a, i) => {
                  const p = prioMeta(a);
                  const meta = [a.owner, a.due, p.score > -100 ? p.label : ''].filter(Boolean).join(' · ');
                  return (
                    <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                      <div style={{ flex: 'none', background: '#35506e', color: '#fff', borderRadius: 4, font: '700 10px/1 Helvetica,Arial,sans-serif', padding: '4px 6px', marginTop: 2 }}>{i + 1}</div>
                      <div style={body}>{a.text}{meta ? <span style={{ color: '#8a857c' }}> ({meta})</span> : null}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {refs.length && on('referans') ? (
            <div>
              <div style={secTitle}>REFERANSLAR</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {refs.map((r, i) => (
                  <div key={r.id || i} style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: '#57534b' }}>
                    <strong style={{ color: '#5f7897' }}>R{i + 1}</strong> · {r.title || 'Referans'}
                    {(r.url || '').trim() ? <span style={{ color: '#8a857c' }}> — {r.url}</span> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
