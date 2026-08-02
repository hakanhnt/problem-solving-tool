import React, { useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { buildShareHash } from '../lib/share.js';
import ReportBody from '../components/ReportBody.jsx';
import A3Body from '../components/A3Body.jsx';
import { HButton, Spinner, S } from '../ui/primitives.jsx';

const SECTION_CHIPS = t => [
  { key: 'tanim', label: t('Problem tanımı', 'Problem definition') },
  { key: 'driver', label: t('İş sürücüsü haritası', 'Business driver map') },
  { key: 'analiz', label: t('İş sürücüsü analizi', 'Business driver analysis') },
  { key: 'bulgu', label: t('Bulgular', 'Findings') },
  { key: 'kok', label: t('Kök neden', 'Root cause') },
  { key: 'karar', label: t('Alternatifler + karar', 'Alternatives + decision') },
  { key: 'benzer', label: t('Benzer vakalar (YZ)', 'Similar cases (AI)') },
  { key: 'dusunme', label: t('Düşünme kontrolü', 'Thinking check') },
  { key: 'izleme', label: t('İzleme + retrospektif', 'Tracking + retrospective') },
  { key: 'referans', label: t('Referanslar', 'References') }
];

export default function Step8Report() {
  const { state, c, principles, upd, runReportSummary, runAudit, updC, t, lang } = useStore();
  const cfg = state.reportCfg;
  const [shareMsg, setShareMsg] = useState('');

  const report = c.report;
  const audit = c.audit;
  const rsIdle = !report || report.status === 'idle' || report.status === 'done' || report.status === 'error';
  const auditIdle = !audit || audit.status === 'idle' || audit.status === 'error' || audit.status === 'done';

  const shareLink = async () => {
    const onay = confirm(t(
      'Paylaşım linki nasıl çalışır?\n\n'
      + '• Çalışmanızın TÜM içeriği sıkıştırılıp linkin kendisine gömülür; sunucuya yüklenmez.\n'
      + '• Link kimde varsa raporun tamamını görebilir — şifre ya da erişim kontrolü yoktur.\n'
      + '• Linki geri çekemez, sonradan iptal edemezsiniz.\n'
      + '• Uzun linkler e-posta/mesajlaşma geçmişinde ve tarayıcı kayıtlarında kalabilir.\n\n'
      + 'Ticari sır, kişisel veri ya da gizli bilgi içeriyorsa link yerine PDF paylaşmayı tercih edin.\n\n'
      + 'Linki yine de oluşturmak istiyor musunuz?',
      'How does the share link work?\n\n'
      + '• The ENTIRE content of your case is compressed and embedded in the link itself; nothing is uploaded to a server.\n'
      + '• Anyone who has the link can see the full report — there is no password or access control.\n'
      + '• You cannot recall or revoke the link afterwards.\n'
      + '• Long links may persist in email/messaging history and browser records.\n\n'
      + 'If it contains trade secrets, personal data or confidential information, prefer sharing a PDF instead of a link.\n\n'
      + 'Do you still want to create the link?'
    ));
    if (!onay) return;
    const hash = buildShareHash(c, principles, cfg.company);
    const url = location.origin + location.pathname + hash;
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg(t('Link kopyalandı (', 'Link copied (') + Math.round(url.length / 1024) + t(' KB) — veriler linkin içinde taşınır, alıcı salt-okunur raporu görür', ' KB) — the data travels inside the link; the recipient sees a read-only report'));
    } catch (e) {
      prompt(t('Linki kopyalayın:', 'Copy the link:'), url);
      setShareMsg('');
    }
    setTimeout(() => setShareMsg(''), 9000);
  };

  return (
    <div>
      {/* Araç çubuğu — yazdırmada gizli */}
      <div data-noprint="1" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '0 0 18px' }}>
        <HButton
          onClick={() => window.print()}
          style={{ padding: '10px 16px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 13px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
          hover={S.primaryHover}
        >{t('Yazdır / PDF olarak kaydet', 'Print / Save as PDF')}</HButton>

        <HButton
          onClick={shareLink}
          style={{ padding: '10px 16px', border: '1px solid var(--pri-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--pri)', font: '600 13px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
          hover={S.ghostHover}
        >{t('🔗 Paylaşım linki kopyala', '🔗 Copy share link')}</HButton>

        {rsIdle ? (
          <HButton
            onClick={runReportSummary}
            style={{ padding: '10px 16px', border: '1px solid var(--pri-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--pri)', font: '600 13px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={S.ghostHover}
          >{t('YZ ile yönetici özeti oluştur', 'Generate executive summary with AI')}</HButton>
        ) : null}
        {report && report.status === 'busy' ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Spinner size={14} /><div style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--pri)' }}>{t('Yönetici özeti hazırlanıyor…', 'Preparing executive summary…')}</div>
          </div>
        ) : null}
        {report && report.status === 'error' ? (
          <div style={{ font: '12px Helvetica,Arial,sans-serif', color: 'var(--alert)' }}>{t('Özet oluşturulamadı', 'Summary generation failed')}{report && report.errMsg ? ' (' + report.errMsg + ')' : ''}{t(' — tekrar deneyin.', ' — try again.')}</div>
        ) : null}

        {auditIdle ? (
          <HButton
            onClick={runAudit}
            style={{ padding: '10px 16px', border: '1px solid var(--alert)', borderRadius: 8, background: 'var(--surface)', color: 'var(--alert)', font: '600 13px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--alert-soft)' }}
          >{t('🔎 Tutarlılık denetimi', '🔎 Consistency audit')}</HButton>
        ) : null}
        {audit && audit.status === 'busy' ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Spinner size={14} track="var(--alert-border)" color="var(--alert)" />
            <div style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--alert)' }}>{t('Denetçi tüm vakayı uçtan uca inceliyor…', 'The auditor is reviewing the entire case end to end…')}</div>
          </div>
        ) : null}
        {audit && audit.status === 'error' ? (
          <div style={{ font: '12px Helvetica,Arial,sans-serif', color: 'var(--alert)' }}>{t('Denetim yapılamadı', 'Audit failed')}{audit && audit.errMsg ? ' (' + audit.errMsg + ')' : ''}{t(' — tekrar deneyin.', ' — try again.')}</div>
        ) : null}
      </div>

      {shareMsg ? (
        <div data-noprint="1" style={{ background: 'var(--ok-soft)', border: '1px solid var(--ok-border)', borderRadius: 8, padding: '9px 13px', margin: '0 0 14px', font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--ok-ink)' }}>✓ {shareMsg}</div>
      ) : null}

      {audit && audit.status === 'done' && (audit.text || '').trim() ? (
        <div data-noprint="1" style={{ background: 'var(--alert-soft-2)', border: '1px solid var(--alert-border)', borderRadius: 10, padding: '16px 18px', margin: '0 0 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 10px' }}>
            <div style={{ font: '700 12px Helvetica,Arial,sans-serif', color: 'var(--alert)', letterSpacing: '.6px' }}>{t('🔎 TUTARLILIK DENETİM RAPORU', '🔎 CONSISTENCY AUDIT REPORT')}</div>
            <HButton onClick={runAudit} style={{ marginLeft: 'auto', padding: '5px 10px', border: '1px solid var(--alert-border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--alert)', font: '600 11px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ background: 'var(--alert-soft)' }}>{t('Yeniden denetle', 'Re-audit')}</HButton>
            <HButton onClick={() => updC(cc => { delete cc.audit; })} style={{ border: 'none', background: 'transparent', color: 'var(--muted-2)', font: '700 14px/1 Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ color: 'var(--ink-3)' }}>×</HButton>
          </div>
          <div style={{ font: '13px/1.65 Helvetica,Arial,sans-serif', color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>{audit.text}</div>
        </div>
      ) : null}

      <div data-noprint="1" style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 16px', margin: '0 0 18px' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.6px', marginRight: 2 }}>{t('GÖRÜNÜM:', 'VIEW:')}</div>
          {[['full', t('Tam rapor', 'Full report')], ['a3', t('A3 özeti', 'A3 summary')]].map(([k, lb]) => (
            <button
              key={k}
              onClick={() => upd(n => { n.reportCfg.view = k; })}
              aria-pressed={cfg.view === k}
              title={k === 'a3' ? t('Tek sayfalık Toyota A3 düzeni — A3 yatay yazdırılır', 'One-page Toyota A3 layout — prints on A3 landscape') : t('Tüm bölümleriyle ayrıntılı rapor', 'Detailed report with all sections')}
              style={{
                padding: '6px 12px', borderRadius: 20,
                border: '1px solid ' + (cfg.view === k ? 'var(--pri)' : 'var(--field-border)'),
                background: cfg.view === k ? 'var(--pri)' : 'var(--surface)',
                color: cfg.view === k ? 'var(--on-pri)' : 'var(--ink-3)',
                font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer'
              }}
            >{lb}</button>
          ))}
          <span style={{ width: 10 }} />
          {cfg.view === 'full' ? <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.6px', marginRight: 2 }}>{t('RAPORA DAHİL:', 'INCLUDED IN REPORT:')}</div> : null}
          {cfg.view === 'full' ? SECTION_CHIPS(t).map(s => {
            const active = cfg.sections[s.key] !== false;
            return (
              <button
                key={s.key}
                onClick={() => upd(n => { n.reportCfg.sections[s.key] = !(n.reportCfg.sections[s.key] !== false); })}
                style={{
                  padding: '6px 11px', borderRadius: 20,
                  border: '1px solid ' + (active ? 'var(--pri)' : 'var(--field-border)'),
                  background: active ? 'var(--pri)' : 'var(--surface)',
                  color: active ? 'var(--on-pri)' : 'var(--muted)',
                  font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer'
                }}
              >{s.label}</button>
            );
          }) : <span style={{ font: '11.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{t('A3 özeti sabit tek sayfa düzenidir; A3 yatay kâğıda yazdırın.', 'The A3 summary is a fixed one-page layout; print on A3 landscape paper.')}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, minWidth: 240 }}>
          <label style={{ flex: 'none', font: '600 11.5px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{t('Şirket / birim:', 'Company / unit:')}</label>
          <input
            className="pcx-field-sm" value={cfg.company || ''}
            onChange={e => upd(n => { n.reportCfg.company = e.target.value; })}
            placeholder={t('Rapor başlığında görünür', 'Shown in the report header')}
            style={{ flex: 1, boxSizing: 'border-box', padding: '7px 10px', border: '1px solid var(--field-border)', borderRadius: 6, font: '12.5px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
          />
        </div>
      </div>

      {cfg.view === 'a3' ? (
        <>
          {/* A3 yatay sayfa — yalnız A3 görünümü aktifken */}
          <style>{'@media print { @page { size: A3 landscape; margin: 10mm } }'}</style>
          <A3Body c={c} companyName={cfg.company} lang={lang} />
        </>
      ) : (
        <ReportBody c={c} principles={principles} sections={cfg.sections} companyName={cfg.company} lang={lang} />
      )}
    </div>
  );
}
