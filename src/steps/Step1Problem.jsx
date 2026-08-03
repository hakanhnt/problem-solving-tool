import React from 'react';
import { useStore } from '../lib/store.jsx';
import { gapInfo, statementChecks } from '../lib/derive.js';
import { Card, CardHead, GuidanceBox, MethodBox, HButton, RemoveButton, S, YZButton, AdvancedSection, useNarrow } from '../ui/primitives.jsx';
import WelcomeCard from '../components/WelcomeCard.jsx';
import { extractFileText } from '../lib/extract.js';

const specRowsFor = t => [
  { key: 'nerede', label: t('Nerede', 'Where'), phV: t('Hangi birim/bölge/hat/kanalda görülüyor?', 'In which unit/region/line/channel is it seen?'), phV2: '', phY: t('Benzer olduğu hâlde görülmeyen yer?', 'A similar place where it is not seen?') },
  { key: 'zaman', label: t('Ne zaman', 'When'), phV: t('Ne zamandan beri, hangi dönemlerde?', 'Since when, and in which periods?'), phY: t('Öncesinde / hangi dönemlerde yoktu?', 'Before / in which periods was it absent?') },
  { key: 'kirilim', label: t('Kırılımda', 'Breakdown'), phV: t('Hangi ürün/segment/süreçte görülüyor?', 'In which product/segment/process is it seen?'), phY: t('Hangi ürün/segment/süreçte görülmüyor?', 'In which product/segment/process is it not seen?') },
  { key: 'buyukluk', label: t('Büyüklük', 'Magnitude'), phV: t('Ne kadar büyük, kaç adet/gün/%?', 'How big — how many units/days/%?'), phY: t('Olabileceği hâlde olmayan büyüklük?', 'A magnitude that could occur but does not?') }
];

const questionsFor = t => [
  t('Ne oldu? Hedef neydi, gerçekleşen ne?', 'What happened? What was the target, and what is the actual?'),
  t('Sapma nerede oluşuyor — hangi coğrafyada, ülkede, mağazada, depoda, departmanda, sistemde ya da kanalda?', 'Where does the deviation occur — in which geography, country, store, warehouse, department, system, or channel?'),
  t('Hangi zaman aralığında ya da dönemde?', 'In which time range or period?'),
  t('Hangi kırılımda — marka/kategori, müşteri segmenti, süreç, proje ya da kampanya?', 'In which breakdown — brand/category, customer segment, process, project, or campaign?'),
  t('Problemi çözüm içermeden, ölçülebilir bir KPI farkı olarak ifade ettim mi?', 'Did I state the problem as a measurable KPI gap, without embedding a solution?'),
  t('Biz aslında neyi çözmeye çalışıyoruz — problem gerçekten bu mu? (statüko yanlılığına karşı yeniden tanımlama)', 'What are we actually trying to solve — is this really the problem? (reframing against status-quo bias)')
];

export default function Step1Problem() {
  const { state, c, upd, updC, inp, fieldHelp, addReference, removeC, runSpecCoach, applySpecCoach, t, lang } = useStore();
  const p = c.problem;
  const sc = c.specCoach;
  const aiReady = (p.statement || '').trim().length > 0;
  const g = gapInfo(p, lang);
  const { hasGap, kpiGapText } = g;
  const refs = c.references || [];
  const form = state.refForm;
  const [extracting, setExtracting] = React.useState('');
  const narrow = useNarrow();
  const specRows = specRowsFor(t);

  const dims = [
    { key: 'geo', aria: t('Yer / Birim boyutu', 'Location / Unit dimension'), label: t('Yer / Birim — coğrafya, cluster, ülke, mağaza, depo, departman, sistem/kanal', 'Location / Unit — geography, cluster, country, store, warehouse, department, system/channel'), ph: t('Sapma nerede oluşuyor? Örn. Bangladeş çıkışlı yüklemeler / X deposu / mobil uygulama / Y departmanı', 'Where does the deviation occur? E.g. shipments from Bangladesh / warehouse X / mobile app / department Y'), helpLabel: t('Problem boyutu — Yer / Birim (coğrafya, mağaza, depo, departman, sistem, kanal)', 'Problem dimension — Location / Unit (geography, store, warehouse, department, system, channel)') },
    { key: 'time', aria: t('Zaman aralığı / Dönem boyutu', 'Time range / Period dimension'), label: t('Zaman aralığı / Dönem', 'Time range / Period'), ph: t('Hangi dönemde? Örn. 2026 Q1, kampanya haftaları, gece vardiyası', 'In which period? E.g. Q1 2026, campaign weeks, night shift'), helpLabel: t('Problem boyutu — Zaman aralığı / Dönem', 'Problem dimension — Time range / Period') },
    { key: 'brand', aria: t('Segment / Kırılım boyutu', 'Segment / Breakdown dimension'), label: t('Segment / Kırılım — marka, kategori, müşteri segmenti, süreç, proje, kampanya', 'Segment / Breakdown — brand, category, customer segment, process, project, campaign'), ph: t('Hangi kırılımda? Örn. temel giyim / yeni müşteriler / iade süreci / X projesi', 'In which breakdown? E.g. basic apparel / new customers / returns process / project X'), helpLabel: t('Problem boyutu — Segment / Kırılım (marka, kategori, müşteri segmenti, süreç, proje)', 'Problem dimension — Segment / Breakdown (brand, category, customer segment, process, project)') }
  ];

  const saveRef = () => {
    if (!form) return;
    if (form.type === 'link' && !(form.url || '').trim()) { alert(t('Lütfen URL girin.', 'Please enter a URL.')); return; }
    if (form.type === 'not' && !(form.text || '').trim()) { alert(t('Lütfen referans metnini yapıştırın.', 'Please paste the reference text.')); return; }
    addReference({ type: form.type, title: (form.title || '').trim(), url: (form.url || '').trim(), text: (form.text || '').trim() });
    upd(n => { n.refForm = null; });
  };

  const addRefFile = () => {
    const el = document.createElement('input');
    el.type = 'file'; el.accept = '.txt,.md,.csv,.pdf,.docx,.xlsx,.xls';
    el.onchange = async () => {
      const f = el.files && el.files[0];
      if (!f) return;
      if (!/\.(txt|md|csv|pdf|docx|xlsx|xls)$/i.test(f.name)) {
        alert(t('.txt, .md, .csv, .pdf, .docx ve .xlsx destekleniyor — diğer türlerde metni kopyalayıp "Not ekle" ile yapıştırın.', '.txt, .md, .csv, .pdf, .docx and .xlsx are supported — for other types, copy the text and paste it via "Add note".'));
        return;
      }
      setExtracting(f.name);
      try {
        const text = await extractFileText(f);
        if (!(text || '').trim()) {
          alert(t('"' + f.name + '" içinden metin çıkarılamadı. Belge taranmış görüntüden oluşuyorsa (OCR gerekir) metni kopyalayıp "Not ekle" ile yapıştırın.', 'Could not extract text from "' + f.name + '". If the document is a scanned image (OCR needed), copy the text and paste it via "Add note".'));
        } else {
          addReference({ type: 'dosya', title: f.name, url: '', text });
        }
      } catch (e) {
        alert(t('Dosya okunamadı: ', 'Could not read the file: ') + ((e && e.message) || e));
      } finally {
        setExtracting('');
      }
    };
    el.click();
  };

  return (
    <div>
      <WelcomeCard />
      <GuidanceBox items={questionsFor(t)} />

      <Card>
        <CardHead
          title={t('Problem İfadesi', 'Problem Statement')}
          sub={t('"Ne oldu?" sorusunun cevabı — çözüm ya da neden içermeyen, ölçülebilir bir ifade.', 'The answer to "What happened?" — a measurable statement that contains no solution or cause.')}
          aiReady={aiReady}
          onHelp={() => fieldHelp(t('Problem ifadesi', 'Problem statement'), p.statement)}
        />
        <MethodBox>{t('İyi bir problem ifadesi "ne oldu?" sorusunu cevaplar; hedef ile gerçekleşen arasındaki ölçülmüş farkı belirtir. Çözüm, neden ya da suçlama içermez — bunlar sonraki adımların işidir.', 'A good problem statement answers "what happened?"; it states the measured gap between target and actual. It contains no solution, cause, or blame — those belong to later steps.')}</MethodBox>
        <textarea
          className="pcx-field"
          value={p.statement}
          onChange={inp('problem', 'statement')}
          placeholder={t('Örn. ... hedefi 45 gün olmasına rağmen, gerçekleşen 65 gün olmuştur.', 'E.g. Although the target for ... was 45 days, the actual came in at 65 days.')}
          style={{ ...S.textarea, font: '14px/1.45 Helvetica,Arial,sans-serif', minHeight: 76 }}
        />
        {aiReady ? (
          <div style={{ marginTop: 10 }}>
            <div style={{ font: '700 10px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px', margin: '0 0 6px' }}>{t('İFADE KALİTE KONTROLÜ', 'STATEMENT QUALITY CHECK')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {statementChecks(p, lang).map((pc, i) => (
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
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>{t('Problem Boyutları', 'Problem Dimensions')}</div>
        <div style={S.cardSub}>{t('Nerede, hangi kırılımda oluşuyor?', 'Where, and in which breakdown, does it occur?')}</div>
        <MethodBox>{t('Sapmayı kırılımlara bölmek (nerede, ne zaman, hangi segmentte) problemi daraltır ve analizin odağını netleştirir (stratifikasyon). Bu akış her alan için geçerlidir: lojistik, pazarlama, teknoloji, operasyon, İK, finans, mağazacılık…', 'Splitting the deviation into breakdowns (where, when, which segment) narrows the problem and sharpens the focus of the analysis (stratification). This flow applies to every domain: logistics, marketing, technology, operations, HR, finance, retail…')}</MethodBox>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {dims.map(d => (
            <div key={d.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 6px' }}>
                <label htmlFor={'pcx-dim-' + d.key} style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{d.label}</label>
                {aiReady ? <YZButton small title={t("YZ'den " + d.aria + ' için yardım al', 'Get AI help for the ' + d.aria)} onClick={() => fieldHelp(d.helpLabel, p[d.key])} /> : null}
              </div>
              <input id={'pcx-dim-' + d.key} className="pcx-field" value={p[d.key]} onChange={inp('problem', d.key)} placeholder={d.ph} style={S.input} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHead
          title={t('KPI Farkı', 'KPI Gap')}
          sub={t('Hedef ile gerçekleşen arasındaki ölçülmüş fark.', 'The measured gap between target and actual.')}
          aiReady={aiReady}
          onHelp={() => fieldHelp(t('KPI farkı (hedef vs gerçekleşen)', 'KPI gap (target vs actual)'), (p.kpiName || '') + t(' | hedef: ', ' | target: ') + p.target + t(' | gerçekleşen: ', ' | actual: ') + p.actual)}
        />
        <MethodBox>{t("KPI farkı = gerçekleşen − hedef. Problemi sayısallaştırmak hem büyüklüğünü gösterir hem de çözümün başarısını ölçülebilir kılar. Sapmanın olumlu mu olumsuz mu olduğu ", 'KPI gap = actual − target. Quantifying the problem both shows its magnitude and makes the success of the solution measurable. Whether the deviation is good or bad depends on the ')}<strong>{t("KPI'ın yönüne", 'direction of the KPI')}</strong>{t(' bağlıdır — yönü mutlaka seçin.', ' — be sure to select the direction.')}</MethodBox>
        <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr 1fr' : '2fr 1fr 1fr 1fr', gap: 12 }}>
          <div style={narrow ? { gridColumn: '1 / -1' } : null}>
            <label htmlFor="pcx-kpi-name" style={S.label}>{t('KPI adı', 'KPI name')}</label>
            <input id="pcx-kpi-name" className="pcx-field" value={p.kpiName} onChange={inp('problem', 'kpiName')} placeholder={t('Örn. Uçtan uca yol süresi (gün)', 'E.g. End-to-end lead time (days)')} style={S.input} />
          </div>
          <div>
            <label htmlFor="pcx-kpi-target" style={S.label}>{g.direction === 'aralik' ? t('Hedef (alt sınır)', 'Target (lower bound)') : t('Hedef', 'Target')}</label>
            <input id="pcx-kpi-target" className="pcx-field" value={p.target} onChange={inp('problem', 'target')} placeholder="45" style={S.input} />
          </div>
          {g.direction === 'aralik' ? (
            <div>
              <label htmlFor="pcx-kpi-target-high" style={S.label}>{t('Hedef (üst sınır)', 'Target (upper bound)')}</label>
              <input id="pcx-kpi-target-high" className="pcx-field" value={p.targetHigh || ''} onChange={inp('problem', 'targetHigh')} placeholder="55" style={S.input} />
            </div>
          ) : null}
          <div>
            <label htmlFor="pcx-kpi-actual" style={S.label}>{t('Gerçekleşen', 'Actual')}</label>
            <input id="pcx-kpi-actual" className="pcx-field" value={p.actual} onChange={inp('problem', 'actual')} placeholder="65" style={S.input} />
          </div>
          <div>
            <label htmlFor="pcx-kpi-unit" style={S.label}>{t('Birim', 'Unit')}</label>
            <input id="pcx-kpi-unit" className="pcx-field" value={p.unit || ''} onChange={inp('problem', 'unit')} placeholder={t('gün, %, adet, TL…', 'days, %, units, TRY…')} style={S.input} title={t("Adım 4'teki sapmaya katkılar da bu birimde girilmelidir", 'Contributions to the deviation in Step 4 must also be entered in this unit')} />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={S.label}>{t('KPI yönü — hangi değer başarıdır?', 'KPI direction — which value means success?')}</label>
          <div role="radiogroup" aria-label={t('KPI yönü', 'KPI direction')} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { k: 'dusuk', t: t('Düşük değer iyidir', 'Lower is better'), d: t('süre, maliyet, hata, şikâyet…', 'time, cost, defects, complaints…') },
              { k: 'yuksek', t: t('Yüksek değer iyidir', 'Higher is better'), d: t('satış, NPS, verimlilik, oran…', 'sales, NPS, productivity, rates…') },
              { k: 'aralik', t: t('Hedef aralıkta kalmalı', 'Should stay within a target range'), d: t('stok gün, doluluk, sıcaklık…', 'days of stock, occupancy, temperature…') }
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
              {t('Yön seçilmedi — şimdilik "', 'No direction selected — for now "')}{g.direction === 'dusuk' ? t('düşük iyidir', 'lower is better') : t('yüksek iyidir', 'higher is better')}{t('" varsayıldı. Doğru değilse yukarıdan seçin.', '" is assumed. If that is not right, select above.')}
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
        title={t('İleri analiz — VAR/YOK belirtimi ve referanslar', 'Advanced analysis — IS / IS-NOT specification and references')}
        sub={t('İsteğe bağlı ama kök neden analizini en çok güçlendiren bölüm. Temel alanları doldurduktan sonra açın.', 'Optional, but the section that strengthens root cause analysis the most. Open it after filling in the basic fields.')}
      >
      <Card>
        <CardHead
          title={t('VAR / YOK Belirtimi', 'IS / IS-NOT Specification')}
          sub={t('Problemin sınırlarını çizin: nerede/ne zaman VAR, nerede/ne zaman olabilirdi ama YOK? (isteğe bağlı ama kök neden analizini en çok güçlendiren adım)', 'Draw the boundaries of the problem: where/when it IS, and where/when it could be but IS NOT? (optional, but the step that strengthens root cause analysis the most)')}
          aiReady={aiReady}
          onHelp={() => fieldHelp(t('VAR/YOK belirtimi (Kepner-Tregoe)', 'IS / IS-NOT specification (Kepner-Tregoe)'), JSON.stringify(c.spec))}
          helpTitle={t("YZ'den VAR/YOK belirtimi için yardım al", 'Get AI help with the IS / IS-NOT specification')}
        />
        <MethodBox>{t('Kepner-Tregoe belirtimi — problemin görüldüğü yer ile görülebileceği hâlde görülmediği yer arasındaki ', 'Kepner-Tregoe specification — the ')}<strong>{t('fark', 'difference')}</strong>{t(", kök neden adaylarını üretir ve test eder: gerçek kök neden hem VAR'ı hem YOK'u açıklamak zorundadır.", ' between where the problem is seen and where it could be seen but is not generates and tests root cause candidates: the true root cause must explain both the IS and the IS-NOT.')}</MethodBox>

        {/* Rehberden VAR/YOK taslağı — üretilen tablo önizlenir, yalnız boş alanlara aktarılır */}
        {aiReady ? (
          <div style={{ background: 'var(--pri-soft-2)', border: '1px solid var(--pri-border)', borderRadius: 8, padding: '12px 14px', margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!sc || sc.status === 'error' ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)', flex: 1, minWidth: 220 }}>
                  {t('Rehber; problem ifadenize, boyutlarınıza ve varsa bulgularınıza bakarak VAR/YOK tablosu için bir taslak hazırlayabilir. Bilmediği hücreleri "[doldurun: …]" diye işaretler.', 'The Coach can prepare a draft for the IS / IS-NOT table based on your problem statement, dimensions, and any findings. Cells it does not know are marked "[fill in: …]".')}
                  {sc && sc.status === 'error' ? <span style={{ color: 'var(--alert)' }}> {t('Taslak hazırlanamadı', 'The draft could not be prepared')}{sc.errMsg ? ' (' + sc.errMsg + ')' : ''}{t(' — tekrar deneyin.', ' — try again.')}</span> : null}
                </div>
                <HButton onClick={runSpecCoach} style={{ flex: 'none', padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ background: 'var(--pri-hover)' }}>{t('Rehberden VAR/YOK taslağı al', 'Get an IS / IS-NOT draft from the Coach')}</HButton>
              </div>
            ) : null}

            {sc && sc.status === 'busy' ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ width: 16, height: 16, border: '2px solid var(--spinner-track)', borderTopColor: 'var(--pri)', borderRadius: '50%', display: 'inline-block', animation: 'pcxspin .8s linear infinite' }} />
                <div style={{ font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>{t('VAR/YOK taslağı hazırlanıyor…', 'Preparing the IS / IS-NOT draft…')}</div>
              </div>
            ) : null}

            {sc && sc.status === 'done' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', letterSpacing: '.8px' }}>{t('REHBERİN VAR/YOK TASLAĞI — hipotezdir, veriyle doğrulayın', "COACH'S IS / IS-NOT DRAFT — a hypothesis, verify with data")}</div>
                {sc.giris ? <div style={{ font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{sc.giris}</div> : null}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%', background: 'var(--surface)', borderRadius: 6 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '6px 9px', border: '1px solid var(--line)', font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)', background: 'var(--pri-soft)', textAlign: 'left' }}> </th>
                        <th style={{ padding: '6px 9px', border: '1px solid var(--line)', font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--ok-ink)', background: 'var(--pri-soft)', textAlign: 'left' }}>{t('VAR', 'IS')}</th>
                        <th style={{ padding: '6px 9px', border: '1px solid var(--line)', font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--alert)', background: 'var(--pri-soft)', textAlign: 'left' }}>{t('YOK', 'IS NOT')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {specRows.map(row => {
                        const r = (sc.belirtim || {})[row.key] || {};
                        return (
                          <tr key={row.key}>
                            <td style={{ padding: '6px 9px', border: '1px solid var(--line)', font: '700 11.5px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{row.label}</td>
                            <td style={{ padding: '6px 9px', border: '1px solid var(--line)', font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{r.v || '—'}</td>
                            <td style={{ padding: '6px 9px', border: '1px solid var(--line)', font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink)' }}>{r.y || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {sc.degisiklik ? <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}><strong>{t('Değişiklik taslağı:', 'Change analysis draft:')}</strong> {sc.degisiklik}</div> : null}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <HButton
                    onClick={applySpecCoach}
                    disabled={sc.applied}
                    style={{ padding: '8px 14px', border: '1px solid ' + (sc.applied ? 'var(--ok-border)' : 'var(--pri)'), borderRadius: 8, background: sc.applied ? 'var(--ok-soft)' : 'var(--pri)', color: sc.applied ? 'var(--ok)' : 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: sc.applied ? 'default' : 'pointer' }}
                    hover={sc.applied ? {} : { background: 'var(--pri-hover)' }}
                  >{sc.applied ? t('Aktarıldı ✓', 'Applied ✓') : t('Boş alanlara aktar', 'Apply to empty fields')}</HButton>
                  <HButton onClick={runSpecCoach} style={{ padding: '8px 14px', border: '1px solid var(--pri-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={S.ghostHover}>{t('Yeniden öner', 'Suggest again')}</HButton>
                  <HButton onClick={() => updC(cc => { delete cc.specCoach; })} style={{ padding: '8px 14px', border: 'none', background: 'transparent', color: 'var(--muted)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ color: 'var(--ink-3)' }}>{t('Kapat', 'Close')}</HButton>
                </div>
                {(sc.sorular || []).length ? (
                  <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {sc.sorular.map((q, i) => <li key={i} style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{q}</li>)}
                  </ul>
                ) : null}
                <div style={{ font: '11px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{t('Aktarım yalnız boş hücrelere yapılır — yazdıklarınız ezilmez. "[doldurun: …]" işaretli yerleri kendi verinizle değiştirin; özellikle YOK tarafını paydaşlarınızla doğrulayın.', 'Only empty cells are filled — nothing you wrote is overwritten. Replace the "[fill in: …]" markers with your own data; verify the IS-NOT side with your stakeholders in particular.')}</div>
              </div>
            ) : null}
          </div>
        ) : null}
        <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '90px 1fr 1fr', gap: 10, alignItems: 'start' }}>
          {!narrow ? (
            <>
              <div />
              <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--ok-ink)', letterSpacing: '.6px' }}>{t('VAR — nerede görülüyor?', 'IS — where is it seen?')}</div>
              <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--alert)', letterSpacing: '.6px' }}>{t('YOK — görülebilirdi ama görülmüyor', 'IS NOT — could be seen but is not')}</div>
            </>
          ) : null}
          {specRows.map(row => (
            <React.Fragment key={row.key}>
              <div style={{ font: '600 12px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink-3)', paddingTop: 9 }}>{row.label}</div>
              <textarea
                className="pcx-field-sm" value={(c.spec[row.key] || {}).v || ''} onChange={inp('spec', row.key, 'v')}
                placeholder={narrow ? t('VAR — ', 'IS — ') + row.phV : row.phV}
                style={{ ...S.textarea, font: '12.5px/1.45 Helvetica,Arial,sans-serif', minHeight: 44 }}
              />
              <textarea
                className="pcx-field-sm" value={(c.spec[row.key] || {}).y || ''} onChange={inp('spec', row.key, 'y')}
                placeholder={narrow ? t('YOK — ', 'IS NOT — ') + row.phY : row.phY}
                style={{ ...S.textarea, font: '12.5px/1.45 Helvetica,Arial,sans-serif', minHeight: 44 }}
              />
            </React.Fragment>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap', margin: '0 0 6px' }}>
            <label style={{ ...S.label, margin: 0 }}>{t('Değişiklik analizi — sapma başladığı dönemde ne değişti?', 'Change analysis — what changed when the deviation began?')}</label>
            <span style={{ font: '11px Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', borderRadius: 20, padding: '2px 8px' }}>{t('sapma problemlerinin klasik anahtarı', 'the classic key to deviation problems')}</span>
          </div>
          <textarea
            className="pcx-field" value={c.spec.degisiklik || ''} onChange={inp('spec', 'degisiklik')}
            placeholder={t('Yeni tedarikçi, sistem geçişi, süreç/organizasyon değişikliği, hacim artışı, personel değişimi…', 'New supplier, system migration, process/organization change, volume increase, staff turnover…')}
            style={{ ...S.textarea, minHeight: 48 }}
          />
        </div>
      </Card>

      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>{t('Referanslar', 'References')} <span style={{ font: '400 12px Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{t('— YZ bağlamı', '— AI context')}</span></div>
        <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', margin: '0 0 12px' }}>{t('Rapor, veri, e-posta alıntısı, link ya da dosya ekleyin — rehber ve asistan tüm adımlarda bunlardan yararlanır ve R1, R2 biçiminde atıf yapar.', 'Add a report, data, an email excerpt, a link, or a file — the coach and assistant use them across all steps and cite them as R1, R2.')}</div>

        {refs.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '0 0 12px' }}>
            {refs.map((r, i) => {
              const meta = [
                r.summarizing ? t('özetleniyor…', 'summarizing…') : (r.summary ? t('özetlendi', 'summarized') : ''),
                r.fetchFailed ? t('içerik alınamadı (yalnız URL kullanılır)', 'content could not be fetched (only the URL is used)') : ((r.text || '').trim() ? (r.text.length + t(' karakter', ' characters')) : ''),
                r.url || ''
              ].filter(Boolean).join(' · ');
              const typeLabel = { not: t('NOT', 'NOTE'), link: 'LINK', dosya: t('DOSYA', 'FILE') }[r.type || 'not'] || (r.type || 'not').toUpperCase();
              return (
                <div key={r.id || i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', border: '1px solid var(--line-2)', borderRadius: 8, padding: '10px 12px', background: 'var(--surface-2)' }}>
                  <div style={{ flex: 'none', background: 'var(--pri)', color: 'var(--on-pri)', borderRadius: 5, font: '700 10px/1 Helvetica,Arial,sans-serif', padding: '4px 7px', marginTop: 2 }}>R{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ flex: 'none', font: '700 9.5px Helvetica,Arial,sans-serif', letterSpacing: '.6px', color: 'var(--pri-soft-ink)', background: 'var(--tag-bg)', borderRadius: 4, padding: '3px 6px' }}>{typeLabel}</span>
                      <span style={{ font: '600 13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', overflowWrap: 'anywhere' }}>{r.title || r.url || t('Referans', 'Reference')}</span>
                    </div>
                    <div style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', marginTop: 3, overflowWrap: 'anywhere' }}>{meta}</div>
                  </div>
                  <RemoveButton onClick={() => removeC(t('referans', 'reference'), cc => cc.references.splice(i, 1))} />
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
              placeholder={t('Başlık — örn. Q2 lojistik raporu', 'Title — e.g. Q2 logistics report')}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
            />
            {form.type === 'link' ? (
              <input
                className="pcx-field-sm" value={form.url || ''}
                onChange={e => upd(n => { if (n.refForm) n.refForm.url = e.target.value; })}
                placeholder={t('https://… (içerik sunucu üzerinden okunur)', 'https://… (content is read via the server)')}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
              />
            ) : null}
            {form.type === 'not' ? (
              <textarea
                className="pcx-field-sm" value={form.text || ''}
                onChange={e => upd(n => { if (n.refForm) n.refForm.text = e.target.value; })}
                placeholder={t('Referans metnini buraya yapıştırın — rapor özeti, veri, e-posta alıntısı…', 'Paste the reference text here — report summary, data, email excerpt…')}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px/1.45 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none', resize: 'vertical', minHeight: 90 }}
              />
            ) : null}
            <div style={{ display: 'flex', gap: 8 }}>
              <HButton onClick={saveRef} style={{ padding: '8px 14px', border: '1px solid var(--pri)', borderRadius: 7, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ background: 'var(--pri-hover)' }}>{t('Kaydet', 'Save')}</HButton>
              <HButton onClick={() => upd(n => { n.refForm = null; })} style={{ padding: '8px 14px', border: '1px solid var(--field-border)', borderRadius: 7, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ background: 'var(--surface-4)' }}>{t('Vazgeç', 'Cancel')}</HButton>
            </div>
          </div>
        ) : null}

        {extracting ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '0 0 10px', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--pri)' }}>
            <span style={{ width: 13, height: 13, border: '2px solid var(--spinner-track)', borderTopColor: 'var(--pri)', borderRadius: '50%', display: 'inline-block', animation: 'pcxspin .8s linear infinite' }} />
            {t('"' + extracting + '" içinden metin çıkarılıyor…', 'Extracting text from "' + extracting + '"…')}
          </div>
        ) : null}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: t('+ Not / alıntı', '+ Note / excerpt'), onClick: () => upd(n => { n.refForm = { type: 'not', title: '', url: '', text: '' }; }) },
            { label: t('+ Link', '+ Link'), onClick: () => upd(n => { n.refForm = { type: 'link', title: '', url: '', text: '' }; }) },
            { label: t('+ Dosya (.pdf / .docx / .xlsx / .csv / .txt)', '+ File (.pdf / .docx / .xlsx / .csv / .txt)'), onClick: addRefFile }
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
