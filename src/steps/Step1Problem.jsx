import React from 'react';
import { useStore } from '../lib/store.jsx';
import { gapInfo, statementChecks } from '../lib/derive.js';
import { Card, CardHead, GuidanceBox, MethodBox, HButton, RemoveButton, S, YZButton, AdvancedSection, useNarrow } from '../ui/primitives.jsx';
import WelcomeCard from '../components/WelcomeCard.jsx';
import { extractFileText } from '../lib/extract.js';

const SPEC_ROWS = [
  { key: 'nerede', label: 'Nerede', phV: 'Hangi birim/bölge/hat/kanalda görülüyor?', phV2: '', phY: 'Benzer olduğu hâlde görülmeyen yer?' },
  { key: 'zaman', label: 'Ne zaman', phV: 'Ne zamandan beri, hangi dönemlerde?', phY: 'Öncesinde / hangi dönemlerde yoktu?' },
  { key: 'kirilim', label: 'Kırılımda', phV: 'Hangi ürün/segment/süreçte görülüyor?', phY: 'Hangi ürün/segment/süreçte görülmüyor?' },
  { key: 'buyukluk', label: 'Büyüklük', phV: 'Ne kadar büyük, kaç adet/gün/%?', phY: 'Olabileceği hâlde olmayan büyüklük?' }
];

const QUESTIONS = [
  'Ne oldu? Hedef neydi, gerçekleşen ne?',
  'Sapma nerede oluşuyor — hangi coğrafyada, ülkede, mağazada, depoda, departmanda, sistemde ya da kanalda?',
  'Hangi zaman aralığında ya da dönemde?',
  'Hangi kırılımda — marka/kategori, müşteri segmenti, süreç, proje ya da kampanya?',
  'Problemi çözüm içermeden, ölçülebilir bir KPI farkı olarak ifade ettim mi?',
  'Biz aslında neyi çözmeye çalışıyoruz — problem gerçekten bu mu? (statüko yanlılığına karşı yeniden tanımlama)'
];

export default function Step1Problem() {
  const { state, c, upd, updC, inp, fieldHelp, addReference, removeC } = useStore();
  const p = c.problem;
  const aiReady = (p.statement || '').trim().length > 0;
  const g = gapInfo(p);
  const { hasGap, kpiGapText } = g;
  const refs = c.references || [];
  const form = state.refForm;
  const [extracting, setExtracting] = React.useState('');
  const narrow = useNarrow();

  const dims = [
    { key: 'geo', aria: 'Yer / Birim boyutu', label: 'Yer / Birim — coğrafya, cluster, ülke, mağaza, depo, departman, sistem/kanal', ph: 'Sapma nerede oluşuyor? Örn. Bangladeş çıkışlı yüklemeler / X deposu / mobil uygulama / Y departmanı', helpLabel: 'Problem boyutu — Yer / Birim (coğrafya, mağaza, depo, departman, sistem, kanal)' },
    { key: 'time', aria: 'Zaman aralığı / Dönem boyutu', label: 'Zaman aralığı / Dönem', ph: 'Hangi dönemde? Örn. 2026 Q1, kampanya haftaları, gece vardiyası', helpLabel: 'Problem boyutu — Zaman aralığı / Dönem' },
    { key: 'brand', aria: 'Segment / Kırılım boyutu', label: 'Segment / Kırılım — marka, kategori, müşteri segmenti, süreç, proje, kampanya', ph: 'Hangi kırılımda? Örn. temel giyim / yeni müşteriler / iade süreci / X projesi', helpLabel: 'Problem boyutu — Segment / Kırılım (marka, kategori, müşteri segmenti, süreç, proje)' }
  ];

  const saveRef = () => {
    if (!form) return;
    if (form.type === 'link' && !(form.url || '').trim()) { alert('Lütfen URL girin.'); return; }
    if (form.type === 'not' && !(form.text || '').trim()) { alert('Lütfen referans metnini yapıştırın.'); return; }
    addReference({ type: form.type, title: (form.title || '').trim(), url: (form.url || '').trim(), text: (form.text || '').trim() });
    upd(n => { n.refForm = null; });
  };

  const addRefFile = () => {
    const el = document.createElement('input');
    el.type = 'file'; el.accept = '.txt,.md,.pdf,.docx';
    el.onchange = async () => {
      const f = el.files && el.files[0];
      if (!f) return;
      if (!/\.(txt|md|pdf|docx)$/i.test(f.name)) {
        alert('.txt, .md, .pdf ve .docx destekleniyor — diğer türlerde metni kopyalayıp "Not ekle" ile yapıştırın.');
        return;
      }
      setExtracting(f.name);
      try {
        const text = await extractFileText(f);
        if (!(text || '').trim()) {
          alert('"' + f.name + '" içinden metin çıkarılamadı. Belge taranmış görüntüden oluşuyorsa (OCR gerekir) metni kopyalayıp "Not ekle" ile yapıştırın.');
        } else {
          addReference({ type: 'dosya', title: f.name, url: '', text });
        }
      } catch (e) {
        alert('Dosya okunamadı: ' + ((e && e.message) || e));
      } finally {
        setExtracting('');
      }
    };
    el.click();
  };

  return (
    <div>
      <WelcomeCard />
      <GuidanceBox items={QUESTIONS} />

      <Card>
        <CardHead
          title="Problem İfadesi"
          sub={'"Ne oldu?" sorusunun cevabı — çözüm ya da neden içermeyen, ölçülebilir bir ifade.'}
          aiReady={aiReady}
          onHelp={() => fieldHelp('Problem ifadesi', p.statement)}
        />
        <MethodBox>İyi bir problem ifadesi "ne oldu?" sorusunu cevaplar; hedef ile gerçekleşen arasındaki ölçülmüş farkı belirtir. Çözüm, neden ya da suçlama içermez — bunlar sonraki adımların işidir.</MethodBox>
        <textarea
          className="pcx-field"
          value={p.statement}
          onChange={inp('problem', 'statement')}
          placeholder="Örn. ... hedefi 45 gün olmasına rağmen, gerçekleşen 65 gün olmuştur."
          style={{ ...S.textarea, font: '14px/1.45 Helvetica,Arial,sans-serif', minHeight: 76 }}
        />
        {aiReady ? (
          <div style={{ marginTop: 10 }}>
            <div style={{ font: '700 10px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px', margin: '0 0 6px' }}>İFADE KALİTE KONTROLÜ</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {statementChecks(p).map((pc, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', background: pc.bg, border: '1px solid ' + pc.border, borderRadius: 20, padding: '5px 11px 5px 8px' }}>
                  <div style={{ flex: 'none', width: 15, height: 15, borderRadius: '50%', background: pc.color, color: 'var(--on-pri)', font: '700 9px/15px Helvetica,Arial,sans-serif', textAlign: 'center' }}>{pc.icon}</div>
                  <div style={{ font: '600 11.5px/1.3 Helvetica,Arial,sans-serif', color: pc.color }}>{pc.text}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>Problem Boyutları</div>
        <div style={S.cardSub}>Nerede, hangi kırılımda oluşuyor?</div>
        <MethodBox>Sapmayı kırılımlara bölmek (nerede, ne zaman, hangi segmentte) problemi daraltır ve analizin odağını netleştirir (stratifikasyon). Bu akış her alan için geçerlidir: lojistik, pazarlama, teknoloji, operasyon, İK, finans, mağazacılık…</MethodBox>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {dims.map(d => (
            <div key={d.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 6px' }}>
                <label htmlFor={'pcx-dim-' + d.key} style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{d.label}</label>
                {aiReady ? <YZButton small title={"YZ'den " + d.aria + " için yardım al"} onClick={() => fieldHelp(d.helpLabel, p[d.key])} /> : null}
              </div>
              <input id={'pcx-dim-' + d.key} className="pcx-field" value={p[d.key]} onChange={inp('problem', d.key)} placeholder={d.ph} style={S.input} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHead
          title="KPI Farkı (Gap)"
          sub="Hedef ile gerçekleşen arasındaki ölçülmüş fark."
          aiReady={aiReady}
          onHelp={() => fieldHelp('KPI farkı (hedef vs gerçekleşen)', (p.kpiName || '') + ' | hedef: ' + p.target + ' | gerçekleşen: ' + p.actual)}
        />
        <MethodBox>KPI farkı = gerçekleşen − hedef. Problemi sayısallaştırmak hem büyüklüğünü gösterir hem de çözümün başarısını ölçülebilir kılar. Sapmanın olumlu mu olumsuz mu olduğu <strong>KPI'ın yönüne</strong> bağlıdır — yönü mutlaka seçin.</MethodBox>
        <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr 1fr' : '2fr 1fr 1fr 1fr', gap: 12 }}>
          <div style={narrow ? { gridColumn: '1 / -1' } : null}>
            <label htmlFor="pcx-kpi-name" style={S.label}>KPI adı</label>
            <input id="pcx-kpi-name" className="pcx-field" value={p.kpiName} onChange={inp('problem', 'kpiName')} placeholder="Örn. Uçtan uca yol süresi (gün)" style={S.input} />
          </div>
          <div>
            <label htmlFor="pcx-kpi-target" style={S.label}>{g.direction === 'aralik' ? 'Hedef (alt sınır)' : 'Hedef'}</label>
            <input id="pcx-kpi-target" className="pcx-field" value={p.target} onChange={inp('problem', 'target')} placeholder="45" style={S.input} />
          </div>
          {g.direction === 'aralik' ? (
            <div>
              <label htmlFor="pcx-kpi-target-high" style={S.label}>Hedef (üst sınır)</label>
              <input id="pcx-kpi-target-high" className="pcx-field" value={p.targetHigh || ''} onChange={inp('problem', 'targetHigh')} placeholder="55" style={S.input} />
            </div>
          ) : null}
          <div>
            <label htmlFor="pcx-kpi-actual" style={S.label}>Gerçekleşen</label>
            <input id="pcx-kpi-actual" className="pcx-field" value={p.actual} onChange={inp('problem', 'actual')} placeholder="65" style={S.input} />
          </div>
          <div>
            <label htmlFor="pcx-kpi-unit" style={S.label}>Birim</label>
            <input id="pcx-kpi-unit" className="pcx-field" value={p.unit || ''} onChange={inp('problem', 'unit')} placeholder="gün, %, adet, TL…" style={S.input} title="Adım 4'teki sapmaya katkılar da bu birimde girilmelidir" />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={S.label}>KPI yönü — hangi değer başarıdır?</label>
          <div role="radiogroup" aria-label="KPI yönü" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { k: 'dusuk', t: 'Düşük değer iyidir', d: 'süre, maliyet, hata, şikâyet…' },
              { k: 'yuksek', t: 'Yüksek değer iyidir', d: 'satış, NPS, verimlilik, oran…' },
              { k: 'aralik', t: 'Hedef aralıkta kalmalı', d: 'stok gün, doluluk, sıcaklık…' }
            ].map(o => {
              const sel = (p.direction || '') === o.k;
              return (
                <button
                  key={o.k} type="button" role="radio" aria-checked={sel}
                  onClick={() => updC(cc => { cc.problem.direction = o.k; })}
                  style={{
                    cursor: 'pointer', textAlign: 'left', borderRadius: 8, padding: '8px 12px',
                    border: '1px solid ' + (sel ? 'var(--pri)' : 'var(--field-border)'),
                    background: sel ? 'var(--pri-soft)' : 'var(--surface)',
                    color: sel ? 'var(--pri-ink)' : 'var(--ink-3)', font: '600 12px/1.4 Helvetica,Arial,sans-serif'
                  }}
                >
                  {o.t}
                  <span style={{ display: 'block', font: '400 10.5px/1.4 Helvetica,Arial,sans-serif', color: sel ? 'var(--pri-soft-ink)' : 'var(--muted)' }}>{o.d}</span>
                </button>
              );
            })}
          </div>
          {!(p.direction || '') && hasGap ? (
            <div style={{ marginTop: 8, font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)' }}>
              Yön seçilmedi — şimdilik "{g.direction === 'dusuk' ? 'düşük iyidir' : 'yüksek iyidir'}" varsayıldı. Doğru değilse yukarıdan seçin.
            </div>
          ) : null}
        </div>
        {hasGap ? (
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{
              display: 'inline-block', borderRadius: 6, padding: '7px 12px', font: '600 13px Helvetica,Arial,sans-serif',
              background: g.good ? 'var(--ok-soft)' : 'var(--alert-soft)',
              border: '1px solid ' + (g.good ? 'var(--ok-border)' : 'var(--alert-border)'),
              color: g.good ? 'var(--ok-ink)' : 'var(--alert)'
            }}>{kpiGapText}</div>
            {g.remainText ? <div style={{ font: '12.5px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{g.remainText}</div> : null}
            {g.zeroTargetNote ? <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', width: '100%' }}>{g.zeroTargetNote}</div> : null}
          </div>
        ) : null}
      </Card>

      <AdvancedSection
        id="s1"
        title="İleri analiz — VAR/YOK belirtimi ve referanslar"
        sub="İsteğe bağlı ama kök neden analizini en çok güçlendiren bölüm. Temel alanları doldurduktan sonra açın."
      >
      <Card>
        <CardHead
          title="VAR / YOK Belirtimi"
          sub="Problemin sınırlarını çizin: nerede/ne zaman VAR, nerede/ne zaman olabilirdi ama YOK? (isteğe bağlı ama kök neden analizini en çok güçlendiren adım)"
          aiReady={aiReady}
          onHelp={() => fieldHelp('VAR/YOK belirtimi (Kepner-Tregoe)', JSON.stringify(c.spec))}
          helpTitle="YZ'den VAR/YOK belirtimi için yardım al"
        />
        <MethodBox>Kepner-Tregoe belirtimi — problemin görüldüğü yer ile görülebileceği hâlde görülmediği yer arasındaki <strong>fark</strong>, kök neden adaylarını üretir ve test eder: gerçek kök neden hem VAR'ı hem YOK'u açıklamak zorundadır.</MethodBox>
        <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '90px 1fr 1fr', gap: 10, alignItems: 'start' }}>
          {!narrow ? (
            <>
              <div />
              <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--ok-ink)', letterSpacing: '.6px' }}>VAR — nerede görülüyor?</div>
              <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--alert)', letterSpacing: '.6px' }}>YOK — görülebilirdi ama görülmüyor</div>
            </>
          ) : null}
          {SPEC_ROWS.map(row => (
            <React.Fragment key={row.key}>
              <div style={{ font: '600 12px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink-3)', paddingTop: 9 }}>{row.label}</div>
              <textarea
                className="pcx-field-sm" value={(c.spec[row.key] || {}).v || ''} onChange={inp('spec', row.key, 'v')}
                placeholder={narrow ? 'VAR — ' + row.phV : row.phV}
                style={{ ...S.textarea, font: '12.5px/1.45 Helvetica,Arial,sans-serif', minHeight: 44 }}
              />
              <textarea
                className="pcx-field-sm" value={(c.spec[row.key] || {}).y || ''} onChange={inp('spec', row.key, 'y')}
                placeholder={narrow ? 'YOK — ' + row.phY : row.phY}
                style={{ ...S.textarea, font: '12.5px/1.45 Helvetica,Arial,sans-serif', minHeight: 44 }}
              />
            </React.Fragment>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap', margin: '0 0 6px' }}>
            <label style={{ ...S.label, margin: 0 }}>Değişiklik analizi — sapma başladığı dönemde ne değişti?</label>
            <span style={{ font: '11px Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', borderRadius: 20, padding: '2px 8px' }}>sapma problemlerinin klasik anahtarı</span>
          </div>
          <textarea
            className="pcx-field" value={c.spec.degisiklik || ''} onChange={inp('spec', 'degisiklik')}
            placeholder="Yeni tedarikçi, sistem geçişi, süreç/organizasyon değişikliği, hacim artışı, personel değişimi…"
            style={{ ...S.textarea, minHeight: 48 }}
          />
        </div>
      </Card>

      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>Referanslar <span style={{ font: '400 12px Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>— YZ bağlamı</span></div>
        <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', margin: '0 0 12px' }}>Rapor, veri, e-posta alıntısı, link ya da dosya ekleyin — rehber ve asistan tüm adımlarda bunlardan yararlanır ve R1, R2 biçiminde atıf yapar.</div>

        {refs.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '0 0 12px' }}>
            {refs.map((r, i) => {
              const meta = [
                r.summarizing ? 'özetleniyor…' : (r.summary ? 'özetlendi' : ''),
                r.fetchFailed ? 'içerik alınamadı (yalnız URL kullanılır)' : ((r.text || '').trim() ? (r.text.length + ' karakter') : ''),
                r.url || ''
              ].filter(Boolean).join(' · ');
              return (
                <div key={r.id || i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', border: '1px solid var(--line-2)', borderRadius: 8, padding: '10px 12px', background: 'var(--surface-2)' }}>
                  <div style={{ flex: 'none', background: 'var(--pri)', color: 'var(--on-pri)', borderRadius: 5, font: '700 10px/1 Helvetica,Arial,sans-serif', padding: '4px 7px', marginTop: 2 }}>R{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ flex: 'none', font: '700 9.5px Helvetica,Arial,sans-serif', letterSpacing: '.6px', color: 'var(--pri-soft-ink)', background: 'var(--tag-bg)', borderRadius: 4, padding: '3px 6px' }}>{(r.type || 'not').toUpperCase()}</span>
                      <span style={{ font: '600 13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', overflowWrap: 'anywhere' }}>{r.title || r.url || 'Referans'}</span>
                    </div>
                    <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', marginTop: 3, overflowWrap: 'anywhere' }}>{meta}</div>
                  </div>
                  <RemoveButton onClick={() => removeC('referans', cc => cc.references.splice(i, 1))} />
                </div>
              );
            })}
          </div>
        ) : null}

        {form ? (
          <div style={{ border: '1px solid var(--pri-border-4)', borderRadius: 8, padding: '12px 14px', background: 'var(--pri-soft-2)', display: 'flex', flexDirection: 'column', gap: 8, margin: '0 0 12px' }}>
            <input
              className="pcx-field-sm" value={form.title || ''}
              onChange={e => upd(n => { if (n.refForm) n.refForm.title = e.target.value; })}
              placeholder="Başlık — örn. Q2 lojistik raporu"
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
            />
            {form.type === 'link' ? (
              <input
                className="pcx-field-sm" value={form.url || ''}
                onChange={e => upd(n => { if (n.refForm) n.refForm.url = e.target.value; })}
                placeholder="https://… (içerik sunucu üzerinden okunur)"
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
              />
            ) : null}
            {form.type === 'not' ? (
              <textarea
                className="pcx-field-sm" value={form.text || ''}
                onChange={e => upd(n => { if (n.refForm) n.refForm.text = e.target.value; })}
                placeholder="Referans metnini buraya yapıştırın — rapor özeti, veri, e-posta alıntısı…"
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px/1.45 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none', resize: 'vertical', minHeight: 90 }}
              />
            ) : null}
            <div style={{ display: 'flex', gap: 8 }}>
              <HButton onClick={saveRef} style={{ padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 7, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ background: 'var(--pri-hover)' }}>Kaydet</HButton>
              <HButton onClick={() => upd(n => { n.refForm = null; })} style={{ padding: '8px 14px', border: '1px solid var(--field-border)', borderRadius: 7, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ background: 'var(--surface-4)' }}>Vazgeç</HButton>
            </div>
          </div>
        ) : null}

        {extracting ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '0 0 10px', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--pri)' }}>
            <span style={{ width: 13, height: 13, border: '2px solid var(--spinner-track)', borderTopColor: 'var(--pri)', borderRadius: '50%', display: 'inline-block', animation: 'pcxspin .8s linear infinite' }} />
            "{extracting}" içinden metin çıkarılıyor…
          </div>
        ) : null}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: '+ Not / alıntı', onClick: () => upd(n => { n.refForm = { type: 'not', title: '', url: '', text: '' }; }) },
            { label: '+ Link', onClick: () => upd(n => { n.refForm = { type: 'link', title: '', url: '', text: '' }; }) },
            { label: '+ Dosya (.txt / .md / .pdf / .docx)', onClick: addRefFile }
          ].map(b => (
            <HButton
              key={b.label} onClick={b.onClick}
              style={{ padding: '9px 14px', border: '1px dashed var(--dash-border)', borderRadius: 8, background: 'transparent', color: 'var(--ink-3)', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
              hover={{ background: 'var(--surface-4)' }}
            >{b.label}</HButton>
          ))}
        </div>
      </Card>
      </AdvancedSection>
    </div>
  );
}
