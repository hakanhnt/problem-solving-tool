import React from 'react';
import { useStore, verMeta } from '../lib/store.jsx';
import { Card, GuidanceBox, MethodBox, AddButton, RemoveButton, VerifyBadge, YZButton, Badge, S } from '../ui/primitives.jsx';
import { paretoData } from '../lib/derive.js';
import { fmtNum } from '../lib/i18n.js';

const questionsFor = t => [
  t('Ölçülmüş, kanıtlı sapmalar neler?', 'What are the measured, evidenced deviations?'),
  t('Ölçülmüş ve doğrulanmış problem bulguları neler?', 'What are the measured and verified problem findings?'),
  t('Hangi sapmalar verilerle doğrulandı?', 'Which deviations were verified with data?'),
  t('Varsayımları bıraktım mı — her bulgunun bir verisi/kanıtı var mı?', 'Have I let go of assumptions — does every finding have data/evidence?'),
  t('Fikrimi doğrulayan veriyi mi topladım, yoksa çürütebilecek veriye de baktım mı? (onaylama yanlılığı)', 'Did I collect only data that confirms my idea, or did I also look at data that could refute it? (confirmation bias)'),
  t('Bulguyu "bence" ile mi yazdım, "gördüğüm/ölçtüğüm veri şu" ile mi? (gözlem yapmadan yorum yapmama)', 'Did I write the finding as "I think", or as "here is the data I observed/measured"? (no interpretation without observation)')
];

export default function Step4Findings() {
  const { c, updC, inp, fieldHelp, removeC, t, lang } = useStore();
  const aiReady = (c.problem.statement || '').trim().length > 0;
  const pareto = paretoData(c, lang);
  const pct = v => t('%' + v, v + '%');
  const num = v => fmtNum(lang, v);

  return (
    <div>
      <GuidanceBox items={questionsFor(t)} margin="0 0 16px" />

      <div style={{ background: 'var(--warn-soft-2)', border: '1px solid var(--warn-border-2)', borderRadius: 8, padding: '12px 14px', margin: '0 0 16px', font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--warn-ink-3)' }}>
        <strong>{t('Unutmayın:', 'Remember:')}</strong> {t('Problem başka şeydir, problem bulgusu başka şeydir, kök neden başka şeydir. Bulgu, veriye dayalı ölçülmüş spesifik bir sapmadır; kök neden bu sapmanın altında yatan sebeptir.', 'The problem, the problem finding, and the root cause are different things. A finding is a specific, measured, data-based deviation; the root cause is the reason underlying that deviation.')}
      </div>

      <Card>
        <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>{t('Doğrulanmış Bulgular / Alt Problemler', 'Verified findings / sub-problems')}</div>
        <div style={S.cardSub}>{t('Her bulguyu ölçülmüş sapma olarak yazın ve kanıtını belirtin.', 'Write each finding as a measured deviation and cite its evidence.')}</div>
        <MethodBox margin="0 0 14px">{t('Bulgu = veriyle doğrulanmış, ölçülmüş spesifik sapma. "Bence, galiba" ile başlayan ifadeler bulgu değildir; her bulgunun kaynağı yazılmalıdır.', 'Finding = a specific, measured deviation verified with data. Statements starting with "I think, maybe" are not findings; every finding must cite its source.')}</MethodBox>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {c.findings.map((f, i) => {
            const vm = verMeta(f);
            return (
              <div key={i} style={S.itemCard}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Badge>{t('B', 'F')}{i + 1}</Badge>
                  <textarea
                    className="pcx-field" value={f.text} onChange={inp('findings', i, 'text')}
                    placeholder={t('Ölçülmüş sapma — örn. Booking → yükleme ort. 12 gün (hedef 5); +7 gün sapma', 'Measured deviation — e.g. booking → loading avg. 12 days (target 5); +7 days deviation')}
                    style={{ ...S.textarea, flex: 1, width: 'auto', minHeight: 52 }}
                  />
                  {aiReady ? <YZButton onClick={() => fieldHelp(t('Problem bulgusu B', 'Problem finding F') + (i + 1), (f.text || '') + (f.evidence ? t(' (Kanıt: ', ' (Evidence: ') + f.evidence + ')' : ''))} title={t("YZ'den bu bulgu için yardım al", 'Get AI help for this finding')} /> : null}
                  <RemoveButton onClick={() => removeC(t('bulgu', 'finding'), cc => cc.findings.splice(i, 1))} />
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <textarea
                    className="pcx-field" value={f.evidence} onChange={inp('findings', i, 'evidence')}
                    placeholder={t('Veri / kanıt kaynağı — örn. forwarder milestone raporu, son 30 yükleme', 'Data / evidence source — e.g. forwarder milestone report, last 30 shipments')}
                    style={{ ...S.textarea, flex: 1, width: 'auto', minWidth: 220, font: '12.5px/1.45 Helvetica,Arial,sans-serif', color: 'var(--ink-3)', minHeight: 40 }}
                  />
                  <div style={{ flex: 'none' }}>
                    <label htmlFor={'pcx-share-' + i} style={{ display: 'block', font: '600 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.4px', margin: '0 0 3px' }}>
                      {t('SAPMAYA KATKI', 'CONTRIBUTION TO GAP')}{(c.problem.unit || '').trim() ? ' (' + c.problem.unit.trim() + ')' : ''}
                    </label>
                    <input
                      id={'pcx-share-' + i}
                      className="pcx-field-sm" type="number" min="0" step="any" value={f.share || ''} onChange={inp('findings', i, 'share')}
                      placeholder={t('örn. 7', 'e.g. 7')}
                      title={t('Bu bulgunun KPI sapmasına katkısı — KPI ile AYNI birimde girin', "This finding's contribution to the KPI gap — enter it in the SAME unit as the KPI") + ((c.problem.unit || '').trim() ? ' (' + c.problem.unit.trim() + ')' : '') + t('. En az 2 bulguda girilirse Pareto analizi çizilir.', '. If entered for at least 2 findings, a Pareto analysis is drawn.')}
                      style={{ width: 100, boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--field-border)', borderRadius: 6, font: '12.5px Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
                    />
                  </div>
                </div>
                <VerifyBadge meta={vm} onClick={() => updC(cc => { cc.findings[i].verified = !cc.findings[i].verified; })} />
              </div>
            );
          })}
          <AddButton onClick={() => updC(cc => cc.findings.push({ text: '', evidence: '', share: '' }))}>{t('+ Bulgu ekle', '+ Add finding')}</AddButton>
        </div>
      </Card>

      {pareto ? (
        <Card>
          <div style={{ ...S.cardTitle, margin: '0 0 4px' }}>
            {t('Pareto Önceliklendirme', 'Pareto prioritization')} <span style={{ font: '400 12px Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>
              — {pareto.mode === 'kpi' ? t('KPI sapmasına göre', 'by KPI gap') : t('bulguların kendi içindeki dağılımı', 'distribution among the findings themselves')}
            </span>
          </div>
          <MethodBox margin="10px 0 14px">{t('Pareto ilkesi — sapmanın büyük bölümü genellikle az sayıda bulgudan gelir. Katkıları KPI ile ', 'Pareto principle — most of the gap usually comes from a small number of findings. Enter contributions in the ')}<strong>{t('aynı birimde', 'same unit')}</strong>{t(' girin; paylar KPI sapmasının kendisine göre hesaplanır, bulgu toplamı %100 sayılmaz. Kök neden analizine (Adım 5) en büyük katkılı bulgudan başlayın.', ' as the KPI; shares are computed against the KPI gap itself, so the findings are not assumed to sum to 100%. Start root cause analysis (Step 5) with the highest-contribution finding.')}</MethodBox>

          {pareto.mode === 'kpi' ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '0 0 12px', font: '12px Helvetica,Arial,sans-serif' }}>
              <span style={{ background: 'var(--surface-2)', border: '1px solid var(--line-2)', borderRadius: 20, padding: '4px 11px', color: 'var(--ink-3)' }}>
                {t('KPI sapması:', 'KPI gap:')} <strong>{num(pareto.gap)}{pareto.unit ? ' ' + pareto.unit : ''}</strong>
              </span>
              <span style={{ background: 'var(--ok-soft)', border: '1px solid var(--ok-border)', borderRadius: 20, padding: '4px 11px', color: 'var(--ok-ink)' }}>
                {t('Bulgularla açıklanan:', 'Explained by findings:')} <strong>{num(pareto.explained)}{pareto.unit ? ' ' + pareto.unit : ''} ({pct(pareto.explainedPct)})</strong>
              </span>
              {pareto.unexplained > 0 ? (
                <span style={{ background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', borderRadius: 20, padding: '4px 11px', color: 'var(--warn-ink)' }}>
                  {t('Açıklanamayan:', 'Unexplained:')} <strong>{num(pareto.unexplained)}{pareto.unit ? ' ' + pareto.unit : ''} ({pct(pareto.unexplainedPct)})</strong>
                </span>
              ) : null}
            </div>
          ) : (
            <div style={{ margin: '0 0 12px', font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', background: 'var(--warn-soft)', border: '1px solid var(--warn-border)', borderRadius: 8, padding: '8px 12px' }}>
              {t("Adım 1'de ölçülmüş bir KPI sapması olmadığı için yalnızca bulguların ", 'Since Step 1 has no measured KPI gap, only the distribution of the findings ')}<strong>{t('kendi içindeki', 'among themselves')}</strong>{t(' dağılımı gösteriliyor. KPI hedef/gerçekleşen girildiğinde paylar sapmaya göre hesaplanır.', ' is shown. Once KPI target/actual are entered, shares are computed against the gap.')}
            </div>
          )}

          {pareto.overflow > 0 ? (
            <div role="alert" style={{ margin: '0 0 12px', font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--alert)', background: 'var(--alert-soft)', border: '1px solid var(--alert-border)', borderRadius: 8, padding: '10px 12px' }}>
              <strong>{t('⚠ Tutarlılık uyarısı:', '⚠ Consistency warning:')}</strong> {t('Bulgu katkılarının toplamı (', 'The sum of finding contributions (')}{num(pareto.explained)}{pareto.unit ? ' ' + pareto.unit : ''}{t(') KPI sapmasından (', ') exceeds the KPI gap (')}{num(pareto.gap)}{pareto.unit ? ' ' + pareto.unit : ''}) <strong>{t('', 'by ')}{num(pareto.overflow)}{pareto.unit ? ' ' + pareto.unit : ''}{t(' fazla', '')}</strong>. {t('Katkılar çakışıyor (aynı gecikme iki bulguda sayılmış), farklı birimde girilmiş ya da abartılı olabilir — verileri gözden geçirin.', 'Contributions may overlap (the same delay counted in two findings), be in a different unit, or be overstated — review the data.')}
            </div>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pareto.bars.map(bar => (
              <div key={bar.label} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ flex: 'none', width: 30, font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--pri)' }}>{bar.label}</div>
                <div style={{ flex: 1, height: 20, background: 'var(--surface-4)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: bar.w + '%', height: '100%', background: pareto.vital.includes(bar.label) ? 'var(--pri)' : 'var(--pri-bar)', borderRadius: 5 }} />
                </div>
                <div style={{ flex: 'none', width: 170, font: '11.5px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', textAlign: 'right' }}>
                  {num(bar.v)}{pareto.unit ? ' ' + pareto.unit : ''}
                  {bar.pctOfGap !== null ? <> · {t('sapmanın %' + bar.pctOfGap, bar.pctOfGap + '% of gap')}</> : <> · {pct(bar.pctInternal)}</>}
                  <span style={{ color: 'var(--muted)' }}> {t('(küm. %' + bar.cumInternal + ')', '(cum. ' + bar.cumInternal + '%)')}</span>
                </div>
              </div>
            ))}
            {pareto.mode === 'kpi' && pareto.unexplained > 0 ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ flex: 'none', width: 30, font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--warn-ink)' }}>?</div>
                <div style={{ flex: 1, height: 20, background: 'var(--surface-4)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: Math.max(3, Math.round(pareto.unexplained / Math.max(pareto.gap, pareto.explained) * 100)) + '%', height: '100%', background: 'repeating-linear-gradient(45deg, var(--warn-border), var(--warn-border) 6px, var(--warn-soft) 6px, var(--warn-soft) 12px)', borderRadius: 5 }} />
                </div>
                <div style={{ flex: 'none', width: 170, font: '11.5px Helvetica,Arial,sans-serif', color: 'var(--warn-ink)', textAlign: 'right' }}>
                  {t('Açıklanamayan', 'Unexplained')} · {num(pareto.unexplained)}{pareto.unit ? ' ' + pareto.unit : ''} ({pct(pareto.unexplainedPct)})
                </div>
              </div>
            ) : null}
          </div>

          <div style={{ marginTop: 12, display: 'inline-block', background: 'var(--pri-soft)', border: '1px solid var(--pri-border-5)', borderRadius: 8, padding: '8px 12px', font: '600 12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>
            {pareto.vital.join(' + ')} → {pareto.mode === 'kpi'
              ? <>{t('KPI sapmasındaki pay ', 'Share of KPI gap ')}{pct(Math.min(100, Math.round(pareto.bars.slice(0, pareto.vital.length).reduce((a, b) => a + b.v, 0) / pareto.gap * 100)))}{t(' · açıklanan bölümdeki pay ', ' · share of explained portion ')}{pct(pareto.vitalPct)}.</>
              : <>{t('girilen katkılardaki kümülatif pay ', 'cumulative share of entered contributions ')}{pct(pareto.vitalPct)}.</>}{t(" Adım 5'e ", ' Start Step 5 with ')}{pareto.bars[0].label}{t(' ile başlayın.', '.')}
          </div>
          {pareto.mode === 'kpi' && pareto.unexplained > 0 && pareto.unexplainedPct >= 30 ? (
            <div style={{ marginTop: 8, font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>
              {t("Sapmada bulgularla açıklanmayan pay %" + pareto.unexplainedPct + " — Adım 2-3'e dönüp eksik sürücü/alt bileşen olup olmadığını kontrol etmek isteyebilirsiniz.", pareto.unexplainedPct + '% of the gap is not explained by findings — you may want to revisit Steps 2-3 to check for a missing driver/sub-component.')}
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
