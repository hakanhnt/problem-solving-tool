import React from 'react';
import { useStore, verMeta } from '../lib/store.jsx';
import { FISHBONE_CATS, WHY_PLACEHOLDERS } from '../lib/defaults.js';
import { RC_STATUSES } from '../lib/derive.js';
import { Card, GuidanceBox, MethodBox, AddButton, RemoveButton, VerifyBadge, YZButton, Badge, S, useNarrow } from '../ui/primitives.jsx';

const STATUS_COLORS = {
  hipotez: { bg: 'var(--warn-soft)', border: 'var(--warn-border)', ink: 'var(--warn-ink)' },
  destekleniyor: { bg: 'var(--pri-soft)', border: 'var(--pri-border-5)', ink: 'var(--pri-ink)' },
  'test-planlandi': { bg: 'var(--pri-soft)', border: 'var(--pri-border-5)', ink: 'var(--pri-ink)' },
  'test-edildi': { bg: 'var(--pri-soft)', border: 'var(--pri-border-5)', ink: 'var(--pri-ink)' },
  dogrulandi: { bg: 'var(--ok-soft)', border: 'var(--ok-border)', ink: 'var(--ok-ink)' },
  elendi: { bg: 'var(--surface-4)', border: 'var(--line-2)', ink: 'var(--muted)' }
};

const QUESTIONS = [
  'Bu sapmalar neden oluşuyor? (5 kez "neden?" sordum mu?)',
  'Kök nedeni dışarıda, paydaşta, ekipte aramak yerine önce kendimizde aradık mı?',
  'Ben neyi farklı yapsaydım bu sonuç olmazdı?',
  'Bu sonuç hangi liderlik/mesleki yetkinlik eksikliğimizden ya da hangi kabul, varsayım veya inancımızdan kaynaklanmış olabilir?',
  'Hangi kurum prensibinde gelişim alanımız var?',
  'Bu sonucu tek bir nedene ya da tek bir kişiye bağlayarak neyi gizliyorum? (aşırı basitleştirme)',
  'En kolay hatırladığım olay gerçekten en yaygın olan mı, yoksa en akılda kalan mı? (mevcudiyet yanlılığı)'
];

export default function Step5RootCause() {
  const { c, principles, updC, inp, fieldHelp, removeC } = useStore();
  const aiReady = (c.problem.statement || '').trim().length > 0;
  const narrow = useNarrow();
  const fbTop = FISHBONE_CATS.slice(0, 3);
  const fbBottom = FISHBONE_CATS.slice(3);
  const hasFbDiagram = Object.values(c.fishbone).some(v => (v || '').trim());

  return (
    <div>
      <GuidanceBox items={QUESTIONS} />

      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>5 Neden Analizi</div>
        <div style={S.cardSub}>En kritik bulgudan başlayın; her cevaba tekrar "neden?" diye sorun.</div>
        <MethodBox margin="0 0 14px">5 Neden — bir bulguya art arda "neden?" diye sorarak belirtiden sistemik nedene inersiniz. Zincir kişi suçlayarak değil; süreç, sistem ya da yetkinlik eksiğinde bitmelidir.</MethodBox>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {c.whys.map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ flex: 'none', width: 64, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start', paddingTop: 10 }}>
                <div style={{ font: '700 12px/1.3 Helvetica,Arial,sans-serif', color: 'var(--pri)' }}>{i + 1}. Neden?</div>
                {aiReady ? <YZButton onClick={() => fieldHelp((i + 1) + '. Neden sorusu (5 Neden zinciri)', w)} title="YZ'den bu soru için yardım al" /> : null}
              </div>
              <textarea
                className="pcx-field" value={w} onChange={inp('whys', i)} placeholder={WHY_PLACEHOLDERS[i]}
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
                placeholder={'Dal ' + (ci + 1) + ' — hangi hipotezi izliyor? Örn. forwarder performansı'}
                aria-label={'Alternatif neden zinciri ' + (ci + 1) + ' başlığı'}
                style={{ flex: 1, boxSizing: 'border-box', padding: '7px 10px', border: '1px solid var(--field-border)', borderRadius: 6, font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
              />
              <RemoveButton onClick={() => removeC('neden dalı', cc => cc.whyChains.splice(ci, 1))} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(ch.whys || []).map((w, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ flex: 'none', width: 64, paddingTop: 9, font: '700 11.5px/1.3 Helvetica,Arial,sans-serif', color: 'var(--pri)' }}>{i + 1}. Neden?</div>
                  <textarea
                    className="pcx-field" value={w}
                    onChange={e => updC(cc => { cc.whyChains[ci].whys[i] = e.target.value; })}
                    placeholder={WHY_PLACEHOLDERS[i]}
                    style={{ ...S.textarea, flex: 1, width: 'auto', minHeight: 40, font: '12.5px/1.45 Helvetica,Arial,sans-serif' }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 12 }}>
          <AddButton onClick={() => updC(cc => { cc.whyChains.push({ label: '', whys: ['', '', '', '', ''] }); })}>+ Alternatif neden dalı ekle</AddButton>
          <div style={{ marginTop: 6, font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>
            Neden zinciri her zaman tek çizgide ilerlemez — bir cevabın birden fazla olası nedeni varsa her hipotez için ayrı dal açın; veriyle desteklenmeyen dalı "elendi" diye kapatın.
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>Balık Kılçığı (Ishikawa)</div>
        <div style={S.cardSub}>Olası nedenleri kategorilere göre listeleyin.</div>
        <MethodBox margin="0 0 14px">Ishikawa (balık kılçığı) diyagramı olası nedenleri kategorilere ayırarak beyin fırtınasını yapılandırır; 5 Neden analiziyle birlikte kullanılır.</MethodBox>
        <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr', gap: 12 }}>
          {FISHBONE_CATS.map(f => (
            <div key={f.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 6px' }}>
                <label style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{f.title}</label>
                {aiReady ? <YZButton small onClick={() => fieldHelp('Balık kılçığı — ' + f.title, c.fishbone[f.key])} title="YZ'den bu kategori için yardım al" /> : null}
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
          <div style={{ ...S.cardTitle, margin: '0 0 14px' }}>Balık Kılçığı <span style={{ font: '400 12px Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>— diyagram</span></div>
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
              {(c.problem.kpiName || '').trim() || 'Problem'}
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

      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>Kök Nedenler + Prensip / Yetkinlik Eşleştirme</div>
        <div style={S.cardSub}>Her kök nedeni yazın; hangi kurum prensibiyle ve hangi yetkinlik gelişim alanıyla ilişkili olduğunu işaretleyin.</div>
        <MethodBox margin="0 0 14px">Kök neden, giderildiğinde sapmanın tekrarını engelleyen nedendir. Prensip 16 gereği kök nedeni dışarıda değil, önce kendi yetkinlik, kabul ve davranışlarımızda ararız.</MethodBox>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {c.rootCauses.map((rc, i) => {
            const vm = verMeta(rc);
            return (
              <div key={i} style={{ ...S.itemCard, gap: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Badge bg="var(--alert)">KN{i + 1}</Badge>
                  <textarea
                    className="pcx-field" value={rc.text} onChange={inp('rootCauses', i, 'text')}
                    placeholder="Kök neden — sapmanın altında yatan sistemik sebep"
                    style={{ ...S.textarea, flex: 1, width: 'auto', minHeight: 52 }}
                  />
                  {aiReady ? <YZButton onClick={() => fieldHelp('Kök neden KN' + (i + 1), (rc.text || '') + (rc.competency ? ' | Yetkinlik gelişim alanı: ' + rc.competency : ''))} title="YZ'den bu kök neden için yardım al" /> : null}
                  <RemoveButton onClick={() => removeC('kök neden', cc => cc.rootCauses.splice(i, 1))} />
                </div>

                <div>
                  <div style={{ font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 8px' }}>İLGİLİ KURUM PRENSİPLERİ</div>
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
                  <div style={{ font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 8px' }}>DOĞRULAMA DURUMU</div>
                  <div role="radiogroup" aria-label={'KN' + (i + 1) + ' doğrulama durumu'} style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {RC_STATUSES.map(st => {
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
                      Bu kök neden henüz bir <strong>hipotez</strong> — raporda da böyle etiketlenir. Veriyle destekleyin ya da test edin.
                    </div>
                  ) : null}
                </div>

                <div>
                  <div style={{ font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 8px' }}>HANGİ BULGULARI AÇIKLIYOR?</div>
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
                          >B{fi + 1} — {f.text.slice(0, 34)}{f.text.length > 34 ? '…' : ''}</button>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>Adım 4'te henüz bulgu yok — kök nedenler bulgulara bağlanmalıdır.</div>
                  )}
                  {!(rc.findings || []).length && (rc.text || '').trim() ? (
                    <div style={{ marginTop: 6, font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)' }}>Hiçbir bulguya bağlı değil — izlenebilirlik denetiminde "desteklenmeyen kök neden" olarak görünür.</div>
                  ) : null}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 6px' }}>KANIT / VERİ KAYNAĞI</label>
                    <textarea
                      className="pcx-field" value={rc.evidence || ''} onChange={inp('rootCauses', i, 'evidence')}
                      placeholder="Bu nedeni destekleyen veri — rapor, kayıt, gözlem…"
                      style={{ ...S.textarea, font: '12.5px/1.45 Helvetica,Arial,sans-serif', minHeight: 44 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 6px' }}>VAR/YOK DESENİNİ AÇIKLIYOR MU?</label>
                    <textarea
                      className="pcx-field" value={rc.explainsSpec || ''} onChange={inp('rootCauses', i, 'explainsSpec')}
                      placeholder="Gerçek kök neden hem VAR'ı hem YOK'u açıklamalı (Adım 1 belirtimi)"
                      style={{ ...S.textarea, font: '12.5px/1.45 Helvetica,Arial,sans-serif', minHeight: 44 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 6px' }}>NASIL TEST EDİLDİ / EDİLECEK?</label>
                    <textarea
                      className="pcx-field" value={rc.testPlan || ''} onChange={inp('rootCauses', i, 'testPlan')}
                      placeholder="Örn. pilot uygulama, kırılım analizi, yerinde gözlem…"
                      style={{ ...S.textarea, font: '12.5px/1.45 Helvetica,Arial,sans-serif', minHeight: 44 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 6px' }}>TEST SONUCU</label>
                    <textarea
                      className="pcx-field" value={rc.testResult || ''} onChange={inp('rootCauses', i, 'testResult')}
                      placeholder="Test yapıldıysa sonucu — hipotezi destekledi mi, çürüttü mü?"
                      style={{ ...S.textarea, font: '12.5px/1.45 Helvetica,Arial,sans-serif', minHeight: 44 }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 6px' }}>GİDERİLİRSE HANGİ KPI / ARA METRİK DÜZELMELİ?</label>
                  <input
                    className="pcx-field" value={rc.kpiExpected || ''} onChange={inp('rootCauses', i, 'kpiExpected')}
                    placeholder="Örn. booking→yükleme 12→5 gün; ilk seferde eksiksiz evrak %38→%80"
                    style={S.input}
                  />
                </div>

                <VerifyBadge meta={vm} onClick={() => updC(cc => { cc.rootCauses[i].verified = !cc.rootCauses[i].verified; })} />

                <div>
                  <label style={{ display: 'block', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', letterSpacing: '.4px', margin: '0 0 6px' }}>YETKİNLİK GELİŞİM ALANI</label>
                  <textarea
                    className="pcx-field" value={rc.competency} onChange={inp('rootCauses', i, 'competency')}
                    placeholder="Örn. süreç yönetimi ve 'önemli olanı ölç' yetkinliği"
                    style={{ ...S.textarea, minHeight: 44 }}
                  />
                </div>
              </div>
            );
          })}
          <AddButton onClick={() => updC(cc => cc.rootCauses.push({ text: '', principles: [], competency: '', status: 'hipotez', findings: [], evidence: '', explainsSpec: '', testPlan: '', testResult: '', kpiExpected: '' }))}>+ Kök neden ekle</AddButton>
        </div>
      </Card>
    </div>
  );
}
