import React from 'react';
import { useStore } from '../lib/store.jsx';
import { gapInfo, statementChecks } from '../lib/derive.js';
import { Card, CardHead, GuidanceBox, MethodBox, HButton, RemoveButton, S, YZButton } from '../ui/primitives.jsx';
import WelcomeCard from '../components/WelcomeCard.jsx';

const QUESTIONS = [
  'Ne oldu? Hedef neydi, gerçekleşen ne?',
  'Sapma nerede oluşuyor — hangi coğrafyada, ülkede, mağazada, depoda, departmanda, sistemde ya da kanalda?',
  'Hangi zaman aralığında ya da dönemde?',
  'Hangi kırılımda — marka/kategori, müşteri segmenti, süreç, proje ya da kampanya?',
  'Problemi çözüm içermeden, ölçülebilir bir KPI farkı olarak ifade ettim mi?',
  'Biz aslında neyi çözmeye çalışıyoruz — problem gerçekten bu mu? (statüko yanlılığına karşı yeniden tanımlama)'
];

export default function Step1Problem() {
  const { state, c, upd, updC, inp, fieldHelp, addReference } = useStore();
  const p = c.problem;
  const aiReady = (p.statement || '').trim().length > 0;
  const { hasGap, kpiGapText } = gapInfo(p);
  const refs = c.references || [];
  const form = state.refForm;

  const dims = [
    { key: 'geo', label: 'Yer / Birim — coğrafya, cluster, ülke, mağaza, depo, departman, sistem/kanal', ph: 'Sapma nerede oluşuyor? Örn. Bangladeş çıkışlı yüklemeler / X deposu / mobil uygulama / Y departmanı', helpLabel: 'Problem boyutu — Yer / Birim (coğrafya, mağaza, depo, departman, sistem, kanal)' },
    { key: 'time', label: 'Zaman aralığı / Dönem', ph: 'Hangi dönemde? Örn. 2026 Q1, kampanya haftaları, gece vardiyası', helpLabel: 'Problem boyutu — Zaman aralığı / Dönem' },
    { key: 'brand', label: 'Segment / Kırılım — marka, kategori, müşteri segmenti, süreç, proje, kampanya', ph: 'Hangi kırılımda? Örn. temel giyim / yeni müşteriler / iade süreci / X projesi', helpLabel: 'Problem boyutu — Segment / Kırılım (marka, kategori, müşteri segmenti, süreç, proje)' }
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
    el.type = 'file'; el.accept = '.txt,.md,text/plain,text/markdown';
    el.onchange = () => {
      const f = el.files && el.files[0];
      if (!f) return;
      if (!/\.(txt|md)$/i.test(f.name)) { alert('Şimdilik .txt / .md destekleniyor — diğer türlerde metni kopyalayıp "Not ekle" ile yapıştırın.'); return; }
      const rd = new FileReader();
      rd.onload = () => addReference({ type: 'dosya', title: f.name, url: '', text: String(rd.result || '') });
      rd.readAsText(f);
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
            <div style={{ font: '700 10px Helvetica,Arial,sans-serif', color: '#8a857c', letterSpacing: '.8px', margin: '0 0 6px' }}>İFADE KALİTE KONTROLÜ</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {statementChecks(p).map((pc, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', background: pc.bg, border: '1px solid ' + pc.border, borderRadius: 20, padding: '5px 11px 5px 8px' }}>
                  <div style={{ flex: 'none', width: 15, height: 15, borderRadius: '50%', background: pc.color, color: '#fff', font: '700 9px/15px Helvetica,Arial,sans-serif', textAlign: 'center' }}>{pc.icon}</div>
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
                <label style={{ font: '600 12px Helvetica,Arial,sans-serif', color: '#57534b' }}>{d.label}</label>
                {aiReady ? <YZButton small onClick={() => fieldHelp(d.helpLabel, p[d.key])} /> : null}
              </div>
              <input className="pcx-field" value={p[d.key]} onChange={inp('problem', d.key)} placeholder={d.ph} style={S.input} />
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
        <MethodBox>KPI farkı = gerçekleşen − hedef. Problemi sayısallaştırmak hem büyüklüğünü gösterir hem de çözümün başarısını ölçülebilir kılar.</MethodBox>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={S.label}>KPI adı</label>
            <input className="pcx-field" value={p.kpiName} onChange={inp('problem', 'kpiName')} placeholder="Örn. Uçtan uca yol süresi (gün)" style={S.input} />
          </div>
          <div>
            <label style={S.label}>Hedef</label>
            <input className="pcx-field" value={p.target} onChange={inp('problem', 'target')} placeholder="45" style={S.input} />
          </div>
          <div>
            <label style={S.label}>Gerçekleşen</label>
            <input className="pcx-field" value={p.actual} onChange={inp('problem', 'actual')} placeholder="65" style={S.input} />
          </div>
        </div>
        {hasGap ? (
          <div style={{ marginTop: 14, display: 'inline-block', background: '#f6e9e5', border: '1px solid #e5c8bf', borderRadius: 6, padding: '7px 12px', font: '600 13px Helvetica,Arial,sans-serif', color: '#8c4a35' }}>{kpiGapText}</div>
        ) : null}
      </Card>

      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>Referanslar <span style={{ font: '400 12px Helvetica,Arial,sans-serif', color: '#8a857c' }}>— YZ bağlamı</span></div>
        <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: '#8a857c', margin: '0 0 12px' }}>Rapor, veri, e-posta alıntısı, link ya da dosya ekleyin — rehber ve asistan tüm adımlarda bunlardan yararlanır ve R1, R2 biçiminde atıf yapar.</div>

        {refs.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '0 0 12px' }}>
            {refs.map((r, i) => {
              const meta = [
                r.summarizing ? 'özetleniyor…' : (r.summary ? 'özetlendi' : ''),
                r.fetchFailed ? 'içerik alınamadı (yalnız URL kullanılır)' : ((r.text || '').trim() ? (r.text.length + ' karakter') : ''),
                r.url || ''
              ].filter(Boolean).join(' · ');
              return (
                <div key={r.id || i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', border: '1px solid #e8e5df', borderRadius: 8, padding: '10px 12px', background: '#fbfaf8' }}>
                  <div style={{ flex: 'none', background: '#35506e', color: '#fff', borderRadius: 5, font: '700 10px/1 Helvetica,Arial,sans-serif', padding: '4px 7px', marginTop: 2 }}>R{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ flex: 'none', font: '700 9.5px Helvetica,Arial,sans-serif', letterSpacing: '.6px', color: '#5f7897', background: '#e8eef6', borderRadius: 4, padding: '3px 6px' }}>{(r.type || 'not').toUpperCase()}</span>
                      <span style={{ font: '600 13px/1.4 Helvetica,Arial,sans-serif', color: '#26241f', overflowWrap: 'anywhere' }}>{r.title || r.url || 'Referans'}</span>
                    </div>
                    <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: '#8a857c', marginTop: 3, overflowWrap: 'anywhere' }}>{meta}</div>
                  </div>
                  <RemoveButton onClick={() => { if (confirm('"' + (r.title || 'Referans') + '" silinsin mi?')) updC(cc => cc.references.splice(i, 1)); }} />
                </div>
              );
            })}
          </div>
        ) : null}

        {form ? (
          <div style={{ border: '1px solid #d8e2ee', borderRadius: 8, padding: '12px 14px', background: '#f2f6fb', display: 'flex', flexDirection: 'column', gap: 8, margin: '0 0 12px' }}>
            <input
              className="pcx-field-sm" value={form.title || ''}
              onChange={e => upd(n => { if (n.refForm) n.refForm.title = e.target.value; })}
              placeholder="Başlık — örn. Q2 lojistik raporu"
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid #d6d3ce', borderRadius: 6, font: '13px/1.4 Helvetica,Arial,sans-serif', color: '#26241f', background: '#fff', outline: 'none' }}
            />
            {form.type === 'link' ? (
              <input
                className="pcx-field-sm" value={form.url || ''}
                onChange={e => upd(n => { if (n.refForm) n.refForm.url = e.target.value; })}
                placeholder="https://… (içerik sunucu üzerinden okunur)"
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid #d6d3ce', borderRadius: 6, font: '13px/1.4 Helvetica,Arial,sans-serif', color: '#26241f', background: '#fff', outline: 'none' }}
              />
            ) : null}
            {form.type === 'not' ? (
              <textarea
                className="pcx-field-sm" value={form.text || ''}
                onChange={e => upd(n => { if (n.refForm) n.refForm.text = e.target.value; })}
                placeholder="Referans metnini buraya yapıştırın — rapor özeti, veri, e-posta alıntısı…"
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid #d6d3ce', borderRadius: 6, font: '13px/1.45 Helvetica,Arial,sans-serif', color: '#26241f', background: '#fff', outline: 'none', resize: 'vertical', minHeight: 90 }}
              />
            ) : null}
            <div style={{ display: 'flex', gap: 8 }}>
              <HButton onClick={saveRef} style={{ padding: '8px 14px', border: '1px solid #35506e', borderRadius: 7, background: '#35506e', color: '#fff', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ background: '#2a4159' }}>Kaydet</HButton>
              <HButton onClick={() => upd(n => { n.refForm = null; })} style={{ padding: '8px 14px', border: '1px solid #d6d3ce', borderRadius: 7, background: '#fff', color: '#57534b', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ background: '#f1efeb' }}>Vazgeç</HButton>
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: '+ Not / alıntı', onClick: () => upd(n => { n.refForm = { type: 'not', title: '', url: '', text: '' }; }) },
            { label: '+ Link', onClick: () => upd(n => { n.refForm = { type: 'link', title: '', url: '', text: '' }; }) },
            { label: '+ Dosya (.txt / .md)', onClick: addRefFile }
          ].map(b => (
            <HButton
              key={b.label} onClick={b.onClick}
              style={{ padding: '9px 14px', border: '1px dashed #b9b4ab', borderRadius: 8, background: 'transparent', color: '#57534b', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
              hover={{ background: '#f1efeb' }}
            >{b.label}</HButton>
          ))}
        </div>
      </Card>
    </div>
  );
}
