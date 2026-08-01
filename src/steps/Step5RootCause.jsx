import React from 'react';
import { useStore, verMeta } from '../lib/store.jsx';
import { fishboneCatsFor, whyPlaceholdersFor } from '../lib/defaults.js';
import { rcStatusesFor } from '../lib/derive.js';
import { Card, GuidanceBox, MethodBox, AddButton, RemoveButton, VerifyBadge, YZButton, Badge, AdvancedSection, S, useNarrow } from '../ui/primitives.jsx';

const STATUS_COLORS = {
  hipotez: { bg: 'var(--warn-soft)', border: 'var(--warn-border)', ink: 'var(--warn-ink)' },
  destekleniyor: { bg: 'var(--pri-soft)', border: 'var(--pri-border-5)', ink: 'var(--pri-ink)' },
  'test-planlandi': { bg: 'var(--pri-soft)', border: 'var(--pri-border-5)', ink: 'var(--pri-ink)' },
  'test-edildi': { bg: 'var(--pri-soft)', border: 'var(--pri-border-5)', ink: 'var(--pri-ink)' },
  dogrulandi: { bg: 'var(--ok-soft)', border: 'var(--ok-border)', ink: 'var(--ok-ink)' },
  elendi: { bg: 'var(--surface-4)', border: 'var(--line-2)', ink: 'var(--muted)' }
};

const questionsFor = t => [
  t('Bu sapmalar neden oluşuyor? (5 kez "neden?" sordum mu?)', 'Why do these deviations occur? (Did I ask "why?" five times?)'),
  t('Kök nedeni dışarıda, paydaşta, ekipte aramak yerine önce kendimizde aradık mı?', 'Did we look for the root cause in ourselves first, rather than in outsiders, stakeholders or the team?'),
  t('Ben neyi farklı yapsaydım bu sonuç olmazdı?', 'What could I have done differently to prevent this outcome?'),
  t('Bu sonuç hangi liderlik/mesleki yetkinlik eksikliğimizden ya da hangi kabul, varsayım veya inancımızdan kaynaklanmış olabilir?', 'Which gap in our leadership/professional competence, or which acceptance, assumption or belief, may have caused this outcome?'),
  t('Hangi kurum prensibinde gelişim alanımız var?', 'Which company principle do we have room to grow in?'),
  t('Bu sonucu tek bir nedene ya da tek bir kişiye bağlayarak neyi gizliyorum? (aşırı basitleştirme)', 'What am I hiding by attributing this outcome to a single cause or a single person? (oversimplification)'),
  t('En kolay hatırladığım olay gerçekten en yaygın olan mı, yoksa en akılda kalan mı? (mevcudiyet yanlılığı)', 'Is the event I recall most easily really the most common one, or just the most memorable? (availability bias)')
];

export default function Step5RootCause() {
  const { c, principles, updC, inp, fieldHelp, removeC, t, lang } = useStore();
  const aiReady = (c.problem.statement || '').trim().length > 0;
  const narrow = useNarrow();
  const fishboneCats = fishboneCatsFor(lang);
  const whyPlaceholders = whyPlaceholdersFor(lang);
  const rcStatuses = rcStatusesFor(lang);
  const fbTop = fishboneCats.slice(0, 3);
  const fbBottom = fishboneCats.slice(3);
  const hasFbDiagram = Object.values(c.fishbone).some(v => (v || '').trim());

  return (
    <div>
      <GuidanceBox items={questionsFor(t)} />

      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>{t('5 Neden Analizi', '5 Whys analysis')}</div>
        <div style={S.cardSub}>{t('En kritik bulgudan başlayın; her cevaba tekrar "neden?" diye sorun.', 'Start with the most critical finding; ask "why?" again for each answer.')}</div>
        <MethodBox margin="0 0 14px">{t('5 Neden — bir bulguya art arda "neden?" diye sorarak belirtiden sistemik nedene inersiniz. Zincir kişi suçlayarak değil; süreç, sistem ya da yetkinlik eksiğinde bitmelidir.', '5 Whys — by repeatedly asking "why?" about a finding, you move from symptom to systemic cause. The chain must not end by blaming a person; it should end at a process, system or competence gap.')}</MethodBox>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {c.whys.map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ flex: 'none', width: 64, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start', paddingTop: 10 }}>
                <div style={{ font: '700 12px/1.3 Helvetica,Arial,sans-serif', color: 'var(--pri)' }}>{t((i + 1) + '. Neden?', 'Why ' + (i + 1) + '?')}</div>
                {aiReady ? <YZButton onClick={() => fieldHelp(t((i + 1) + '. Neden sorusu (5 Neden zinciri)', 'Why question ' + (i + 1) + ' (5 Whys chain)'), w)} title={t("YZ'den bu soru için yardım al", 'Get AI help for this question')} /> : null}
              </div>
              <textarea
                className="pcx-field" value={w} onChange={inp('whys', i)} placeholder={whyPlaceholders[i]}
                style={{ ...S.textarea, flex: 1, width: 'auto', minHeight: 46 }}
              />
            </div>
          ))}
        </div>

        {(c.whyChains || []).map((ch, ci) => (
          <div key={ci} style={{ marginTop: 14, border: '1px dashed var(--pri-border-4)', borderRadius: 10, padding: '12px 14px', background: 'var(--pri-soft-2)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '0 0 10px' }}>
              <input
                className="pcx-field-sm" value={ch.label || ''}
                onChange={inp('whyChains', ci, 'label')}
                placeholder={t('Dal ' + (ci + 1) + ' — hangi hipotezi izliyor? Örn. forwarder performansı', 'Branch ' + (ci + 1) + ' — which hypothesis does it follow? E.g. forwarder performance')}
                aria-label={t('Alternatif neden zinciri ' + (ci + 1) + ' başlığı', 'Alternative cause chain ' + (ci + 1) + ' label')}
                style={{ flex: 1, boxSizing: 'border-box', padding: '7px 10px', border: '1px solid var(--field-border)', borderRadius: 6, font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
              />
              <RemoveButton onClick={() => removeC(t('neden dalı', 'cause branch'), cc => cc.whyChains.splice(ci, 1))} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(ch.whys || []).map((w, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ flex: 'none', width: 64, paddingTop: 9, font: '700 11.5px/1.3 Helvetica,Arial,sans-serif', color: 'var(--pri)' }}>{t((i + 1) + '. Neden?', 'Why ' + (i + 1) + '?')}</div>
                  <textarea
                    className="pcx-field" value={w}
                    onChange={e => updC(cc => { cc.whyChains[ci].whys[i] = e.target.value; })}
                    placeholder={whyPlaceholders[i]}
                    style={{ ...S.textarea, flex: 1, width: 'auto', minHeight: 40, font: '12.5px/1.45 Helvetica,Arial,sans-serif' }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 12 }}>
          <AddButton onClick={() => updC(cc => { cc.whyChains.push({ label: '', whys: ['', '', '', '', ''] }); })}>{t('+ Alternatif neden dalı ekle', '+ Add alternative cause branch')}</AddButton>
          <div style={{ marginTop: 6, font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>
            {t('Neden zinciri her zaman tek çizgide ilerlemez — bir cevabın birden fazla olası nedeni varsa her hipotez için ayrı dal açın; veriyle desteklenmeyen dalı "elendi" diye kapatın.', 'A why chain does not always run in a single line — if an answer has more than one possible cause, open a separate branch for each hypothesis; close any branch not supported by data as "eliminated".')}
          </div>
        </div>
      </Card>

      <AdvancedSection
        id="s5"
        title={t('İleri analiz — Balık kılçığı (Ishikawa)', 'Advanced analysis — Fishbone (Ishikawa)')}
        sub={t('5 Neden tek bir zinciri derinleştirir; balık kılçığı olası nedenleri kategorilere yayarak gözden kaçanı yakalar. İkisi birbirini tamamlar.', '5 Whys deepens a single chain; the fishbone spreads possible causes across categories to catch what was missed. The two complement each other.')}
      >
      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>{t('Balık Kılçığı (Ishikawa)', 'Fishbone (Ishikawa)')}</div>
        <div style={S.cardSub}>{t('Olası nedenleri kategorilere göre listeleyin.', 'List possible causes by category.')}</div>
        <MethodBox margin="0 0 14px">{t('Ishikawa (balık kılçığı) diyagramı olası nedenleri kategorilere ayırarak beyin fırtınasını yapılandırır; 5 Neden analiziyle birlikte kullanılır.', 'The Ishikawa (fishbone) diagram structures brainstorming by grouping possible causes into categories; it is used together with 5 Whys analysis.')}</MethodBox>
        <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr', gap: 12 }}>
          {fishboneCats.map(f => (
            <div key={f.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 6px' }}>
                <label style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{f.title}</label>
                {aiReady ? <YZButton small onClick={() => fieldHelp(t('Balık kılçığı — ', 'Fishbone — ') + f.title, c.fishbone[f.key])} title={t("YZ'den bu kategori için yardım al", 'Get AI help for this category')} /> : null}
              </div>
              <textarea
                className="pcx-field" value={c.fishbone[f.key]} onChange={inp('fishbone', f.key)} placeholder={f.ph}
                style={{ ...S.textarea, font: '12.5px/1.45 Helvetica,Arial,sans-serif', minHeight: 64, height: 124 }}
              />
            </div>
          ))}
        </div>
      </Card>

      {hasFbDiagram ? (
        <Card>
          <div style={{ ...S.cardTitle, margin: '0 0 14px' }}>{t('Balık Kılçığı', 'Fishbone')} <span style={{ font: '400 12px Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{t('— diyagram', '— diagram')}</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 150px', gap: 10, alignItems: 'center' }}>
            {fbTop.map(f => (
              <div key={f.key} style={{ alignSelf: 'end', border: '1px solid var(--pri-border-2)', borderRadius: 8, background: 'var(--pri-soft-2)', padding: '9px 11px', minHeight: 64 }}>
                <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri)', letterSpacing: '.4px', margin: '0 0 4px' }}>{f.title}</div>
                <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{(c.fishbone[f.key] || '').trim() || '—'}</div>
                <div style={{ width: 2, height: 14, background: 'var(--pri-border)', margin: '8px auto -23px' }} />
              </div>
            ))}
            <div />
            <div style={{ gridColumn: '1 / 4', height: 0, borderTop: '3px solid var(--pri)', position: 'relative' }}>
              <div style={{ position: 'absolute', right: -12, top: -8, font: '700 14px Helvetica,Arial,sans-serif', color: 'var(--pri)' }}>▶</div>
            </div>
            <div style={{ background: 'var(--alert)', color: 'var(--on-pri)', borderRadius: 9, padding: '12px 13px', font: '700 12px/1.4 Helvetica,Arial,sans-serif', textAlign: 'center' }}>
              {(c.problem.kpiName || '').trim() || t('Problem', 'Problem')}
            </div>
            {fbBottom.map(f => (
              <div key={f.key} style={{ alignSelf: 'start', border: '1px solid var(--pri-border-2)', borderRadius: 8, background: 'var(--pri-soft-2)', padding: '9px 11px', minHeight: 64 }}>
                <div style={{ width: 2, height: 14, background: 'var(--pri-border)', margin: '-23px auto 8px' }} />
                <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri)', letterSpacing: '.4px', margin: '0 0 4px' }}>{f.title}</div>
                <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{(c.fishbone[f.key] || '').trim() || '—'}</div>
              </div>
            ))}
            <div />
          </div>
        </Card>
      ) : null}
      </AdvancedSection>

      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>{t('Kök Nedenler + Prensip / Yetkinlik Eşleştirme', 'Root causes + principle / competency mapping')}</div>
        <div style={S.cardSub}>{t('Her kök nedeni yazın; hangi kurum prensibiyle ve hangi yetkinlik gelişim alanıyla ilişkili olduğunu işaretleyin.', 'Write each root cause; mark which company principle and which competency development area it relates to.')}</div>
        <MethodBox margin="0 0 14px">{t('Kök neden, giderildiğinde sapmanın tekrarını engelleyen nedendir. Prensip 16 gereği kök nedeni dışarıda değil, önce kendi yetkinlik, kabul ve davranışlarımızda ararız.', 'A root cause is the cause whose removal prevents the deviation from recurring. Per Principle 16, we look for the root cause not outside, but first in our own competences, acceptances and behaviors.')}</MethodBox>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {c.rootCauses.map((rc, i) => {
            const vm = verMeta(rc);
            return (
              <div key={i} style={{ ...S.itemCard, gap: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Badge bg="var(--alert)">{t('KN', 'RC')}{i + 1}</Badge>
                  <textarea
                    className="pcx-field" value={rc.text} onChange={inp('rootCauses', i, 'text')}
                    placeholder={t('Kök neden — sapmanın altında yatan sistemik sebep', 'Root cause — the systemic reason underlying the deviation')}
                    style={{ ...S.textarea, flex: 1, width: 'auto', minHeight: 52 }}
                  />
                  {aiReady ? <YZButton onClick={() => fieldHelp(t('Kök neden KN', 'Root cause RC') + (i + 1), (rc.text || '') + (rc.competency ? t(' | Yetkinlik gelişim alanı: ', ' | Competency development area: ') + rc.competency : ''))} title={t("YZ'den bu kök neden için yardım al", 'Get AI help for this root cause')} /> : null}
                  <RemoveButton onClick={() => removeC(t('kök neden', 'root cause'), cc => cc.rootCauses.splice(i, 1))} />
                </div>

                <div>
                  <div style={{ font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 8px' }}>{t('İLGİLİ KURUM PRENSİPLERİ', 'RELATED COMPANY PRINCIPLES')}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {principles.map((p, pi) => {
                      const sel = (rc.principles || []).includes(pi);
                      const label = (pi + 1) + '. ' + p;
                      return (
                        <button
                          key={pi}
                          title={label}
                          onClick={() => updC(cc => {
                            const arr = cc.rootCauses[i].principles;
                            const k = arr.indexOf(pi);
                            if (k >= 0) arr.splice(k, 1); else arr.push(pi);
                          })}
                          style={{
                            padding: '5px 9px', borderRadius: 20,
                            border: '1px solid ' + (sel ? 'var(--pri)' : 'var(--field-border)'),
                            background: sel ? 'var(--pri)' : 'var(--surface)',
                            color: sel ? 'var(--on-pri)' : 'var(--ink-3)',
                            font: '12px/1.3 Helvetica,Arial,sans-serif', cursor: 'pointer', textAlign: 'left'
                          }}
                        >{label}</button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div style={{ font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 8px' }}>{t('DOĞRULAMA DURUMU', 'VERIFICATION STATUS')}</div>
                  <div role="radiogroup" aria-label={t('KN', 'RC') + (i + 1) + t(' doğrulama durumu', ' verification status')} style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {rcStatuses.map(st => {
                      const sel = (rc.status || 'hipotez') === st.key;
                      const col = STATUS_COLORS[st.key];
                      return (
                        <button
                          key={st.key} type="button" role="radio" aria-checked={sel}
                          onClick={() => updC(cc => { cc.rootCauses[i].status = st.key; })}
                          style={{
                            padding: '5px 11px', borderRadius: 20, cursor: 'pointer',
                            border: '1px solid ' + (sel ? col.ink : 'var(--field-border)'),
                            background: sel ? col.bg : 'var(--surface)',
                            color: sel ? col.ink : 'var(--muted)',
                            font: (sel ? '700' : '400') + ' 11.5px/1.3 Helvetica,Arial,sans-serif'
                          }}
                        >{st.label}</button>
                      );
                    })}
                  </div>
                  {(rc.status || 'hipotez') === 'hipotez' ? (
                    <div style={{ marginTop: 6, font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)' }}>
                      {t('Bu kök neden henüz bir ', 'This root cause is still a ')}<strong>{t('hipotez', 'hypothesis')}</strong>{t(' — raporda da böyle etiketlenir. Veriyle destekleyin ya da test edin.', ' — it is labeled as such in the report, too. Support it with data or test it.')}
                    </div>
                  ) : null}
                </div>

                <div>
                  <div style={{ font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 8px' }}>{t('HANGİ BULGULARI AÇIKLIYOR?', 'WHICH FINDINGS DOES IT EXPLAIN?')}</div>
                  {(c.findings || []).filter(f => (f.text || '').trim()).length ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {c.findings.map((f, fi) => {
                        if (!(f.text || '').trim()) return null;
                        const sel = (rc.findings || []).includes(fi);
                        return (
                          <button
                            key={fi} type="button" aria-pressed={sel}
                            title={f.text}
                            onClick={() => updC(cc => {
                              const arr = cc.rootCauses[i].findings;
                              const k = arr.indexOf(fi);
                              if (k >= 0) arr.splice(k, 1); else arr.push(fi);
                            })}
                            style={{
                              padding: '5px 10px', borderRadius: 20, cursor: 'pointer',
                              border: '1px solid ' + (sel ? 'var(--pri)' : 'var(--field-border)'),
                              background: sel ? 'var(--pri)' : 'var(--surface)',
                              color: sel ? 'var(--on-pri)' : 'var(--ink-3)',
                              font: '600 11.5px/1.3 Helvetica,Arial,sans-serif', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                            }}
                          >{t('B', 'F')}{fi + 1} — {f.text.slice(0, 34)}{f.text.length > 34 ? '…' : ''}</button>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{t("Adım 4'te henüz bulgu yok — kök nedenler bulgulara bağlanmalıdır.", 'No findings in Step 4 yet — root causes must be linked to findings.')}</div>
                  )}
                  {!(rc.findings || []).length && (rc.text || '').trim() ? (
                    <div style={{ marginTop: 6, font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)' }}>{t('Hiçbir bulguya bağlı değil — izlenebilirlik denetiminde "desteklenmeyen kök neden" olarak görünür.', 'Not linked to any finding — it appears as an "unsupported root cause" in the traceability audit.')}</div>
                  ) : null}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 6px' }}>{t('KANIT / VERİ KAYNAĞI', 'EVIDENCE / DATA SOURCE')}</label>
                    <textarea
                      className="pcx-field" value={rc.evidence || ''} onChange={inp('rootCauses', i, 'evidence')}
                      placeholder={t('Bu nedeni destekleyen veri — rapor, kayıt, gözlem…', 'Data supporting this cause — report, record, observation…')}
                      style={{ ...S.textarea, font: '12.5px/1.45 Helvetica,Arial,sans-serif', minHeight: 44 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 6px' }}>{t('VAR/YOK DESENİNİ AÇIKLIYOR MU?', 'DOES IT EXPLAIN THE IS / IS-NOT PATTERN?')}</label>
                    <textarea
                      className="pcx-field" value={rc.explainsSpec || ''} onChange={inp('rootCauses', i, 'explainsSpec')}
                      placeholder={t("Gerçek kök neden hem VAR'ı hem YOK'u açıklamalı (Adım 1 belirtimi)", 'A true root cause must explain both the IS and the IS-NOT (Step 1 specification)')}
                      style={{ ...S.textarea, font: '12.5px/1.45 Helvetica,Arial,sans-serif', minHeight: 44 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 6px' }}>{t('NASIL TEST EDİLDİ / EDİLECEK?', 'HOW WAS / WILL IT BE TESTED?')}</label>
                    <textarea
                      className="pcx-field" value={rc.testPlan || ''} onChange={inp('rootCauses', i, 'testPlan')}
                      placeholder={t('Örn. pilot uygulama, kırılım analizi, yerinde gözlem…', 'E.g. pilot run, breakdown analysis, on-site observation…')}
                      style={{ ...S.textarea, font: '12.5px/1.45 Helvetica,Arial,sans-serif', minHeight: 44 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 6px' }}>{t('TEST SONUCU', 'TEST RESULT')}</label>
                    <textarea
                      className="pcx-field" value={rc.testResult || ''} onChange={inp('rootCauses', i, 'testResult')}
                      placeholder={t('Test yapıldıysa sonucu — hipotezi destekledi mi, çürüttü mü?', 'If tested, the outcome — did it support or refute the hypothesis?')}
                      style={{ ...S.textarea, font: '12.5px/1.45 Helvetica,Arial,sans-serif', minHeight: 44 }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 6px' }}>{t('GİDERİLİRSE HANGİ KPI / ARA METRİK DÜZELMELİ?', 'IF RESOLVED, WHICH KPI / INTERMEDIATE METRIC SHOULD IMPROVE?')}</label>
                  <input
                    className="pcx-field" value={rc.kpiExpected || ''} onChange={inp('rootCauses', i, 'kpiExpected')}
                    placeholder={t('Örn. booking→yükleme 12→5 gün; ilk seferde eksiksiz evrak %38→%80', 'E.g. booking→loading 12→5 days; right-first-time documents 38%→80%')}
                    style={S.input}
                  />
                </div>

                <VerifyBadge meta={vm} onClick={() => updC(cc => { cc.rootCauses[i].verified = !cc.rootCauses[i].verified; })} />

                <div>
                  <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 6px' }}>{t('YETKİNLİK GELİŞİM ALANI', 'COMPETENCY DEVELOPMENT AREA')}</label>
                  <textarea
                    className="pcx-field" value={rc.competency} onChange={inp('rootCauses', i, 'competency')}
                    placeholder={t("Örn. süreç yönetimi ve 'önemli olanı ölç' yetkinliği", "E.g. process management and the 'measure what matters' competency")}
                    style={{ ...S.textarea, minHeight: 44 }}
                  />
                </div>
              </div>
            );
          })}
          <AddButton onClick={() => updC(cc => cc.rootCauses.push({ text: '', principles: [], competency: '', status: 'hipotez', findings: [], evidence: '', explainsSpec: '', testPlan: '', testResult: '', kpiExpected: '' }))}>{t('+ Kök neden ekle', '+ Add root cause')}</AddButton>
        </div>
      </Card>
    </div>
  );
}
