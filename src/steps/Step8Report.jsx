import React, { useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { buildShareHash } from '../lib/share.js';
import { buildReportDoc, reportFileName } from '../lib/reportDoc.js';
import { buildReportDocx, reportFileNameDocx } from '../lib/reportDocx.js';
import { downloadFile } from '../lib/download.js';
import ReportBody from '../components/ReportBody.jsx';
import A3Body from '../components/A3Body.jsx';
import CaseMap from '../components/CaseMap.jsx';
import { Spinner } from '../ui/primitives.jsx';

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
  const { state, c, principles, upd, runReportSummary, runAudit, updC, t, lang, goStep } = useStore();
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

  const sectionChips = SECTION_CHIPS(t);
  const includedCount = sectionChips.filter(x => cfg.sections[x.key] !== false).length;
  const hasStatement = !!((c.problem || {}).statement || '').trim();
  const hasRootCause = (c.rootCauses || []).some(r => (r.text || '').trim());
  const thin = !hasStatement || !hasRootCause;

  const downloadDocx = async () => {
    const blob = await buildReportDocx(c, { principles, sections: cfg.sections, companyName: cfg.company, lang });
    downloadFile(reportFileNameDocx(c, cfg.company) + '.docx', blob);
  };
  const downloadHtml = () => {
    const html = buildReportDoc(c, { principles, sections: cfg.sections, companyName: cfg.company, lang, format: 'html' });
    downloadFile(reportFileName(c, cfg.company) + '.html', html, 'text/html;charset=utf-8');
  };

  const VIEWS = [
    ['full', t('Tam rapor', 'Full report'), t('Tüm bölümleriyle ayrıntılı rapor', 'Detailed report with all sections')],
    ['a3', t('A3 özeti', 'A3 summary'), t('Tek sayfalık Toyota A3 düzeni; A3 yatay yazdırılır', 'One-page Toyota A3 layout; prints on A3 landscape')],
    ['map', t('Vaka haritası', 'Case map'), t('Verilerinizden türetilen bağlantı grafiği; kopuk düğümleri gösterir', 'Connection graph derived from your data; shows disconnected nodes')]
  ];

  return (
    <div>
      {thin ? (
        <div data-noprint="1" className="pcx-rep-empty">
          <div className="pcx-rep-empty-title">{t('Rapor henüz boş görünecek', 'The report will look empty for now')}</div>
          <p>{t('Anlamlı bir rapor için en az bir problem ifadesi ve bir kök neden gerekiyor. Eksik olanları tamamladıkça rapor kendiliğinden dolar.', 'A meaningful report needs at least a problem statement and one root cause. As you fill in what is missing, the report fills itself.')}</p>
          <div className="pcx-rep-row">
            {!hasStatement ? <button type="button" className="pcx-rep-btn is-pri" onClick={() => goStep(1)}>{t('Adım 1: Problemi tanımla', 'Step 1: Define the problem')}</button> : null}
            {!hasRootCause ? <button type="button" className={'pcx-rep-btn' + (hasStatement ? ' is-pri' : '')} onClick={() => goStep(5)}>{t('Adım 5: Kök nedeni yaz', 'Step 5: Write the root cause')}</button> : null}
          </div>
        </div>
      ) : null}

      {/* Görünüm + çıktılar — yazdırmada gizli */}
      <div data-noprint="1" className="pcx-rep-bar">
        <div role="group" aria-label={t('Rapor görünümü', 'Report view')} className="pcx-rep-seg">
          {VIEWS.map(([k, lb, tip]) => (
            <button key={k} type="button" title={tip} aria-pressed={cfg.view === k} onClick={() => upd(n => { n.reportCfg.view = k; })}>{lb}</button>
          ))}
        </div>
        <div className="pcx-rep-row">
          <button type="button" className="pcx-rep-btn is-pri" onClick={() => window.print()}>{t('Yazdır / PDF', 'Print / PDF')}</button>
          <button type="button" className="pcx-rep-btn" onClick={downloadDocx}>{t('Word indir', 'Download Word')}</button>
          <button type="button" className="pcx-rep-btn" onClick={downloadHtml}>{t('HTML indir', 'Download HTML')}</button>
          <button type="button" className="pcx-rep-btn" onClick={shareLink}>{t('Paylaşım linki', 'Share link')}</button>
        </div>
      </div>

      {shareMsg ? (
        <div data-noprint="1" role="status" className="pcx-rep-toast">✓ {shareMsg}</div>
      ) : null}

      {/* YZ araçları */}
      <section data-noprint="1" className="pcx-rep-tools" aria-label={t('Raporu güçlendir', 'Strengthen the report')}>
        <div className="pcx-rep-tool">
          <div>
            <b>{t('Yönetici özeti', 'Executive summary')}</b>
            <span>{t('YZ, çalışmanızdan raporun başına konacak kısa bir özet yazar.', 'AI writes a short summary of your case for the top of the report.')}</span>
          </div>
          {report && report.status === 'busy' ? (
            <span className="pcx-rep-busy"><Spinner size={14} />{t('Hazırlanıyor…', 'Preparing…')}</span>
          ) : rsIdle ? (
            <button type="button" className="pcx-rep-btn" onClick={runReportSummary}>{report && report.status === 'done' ? t('Yeniden oluştur', 'Regenerate') : t('Özet oluştur', 'Generate summary')}</button>
          ) : null}
          {report && report.status === 'error' ? <span className="pcx-rep-err">{t('Özet oluşturulamadı', 'Summary failed')}{report.errMsg ? ' (' + report.errMsg + ')' : ''}{t('; tekrar deneyin.', '; try again.')}</span> : null}
        </div>
        <div className="pcx-rep-tool">
          <div>
            <b>{t('Tutarlılık denetimi', 'Consistency audit')}</b>
            <span>{t('YZ, adımlar arasındaki çelişkileri ve kopuk halkaları bulur; paylaşmadan önce çalıştırın.', 'AI finds contradictions and broken links between steps; run it before sharing.')}</span>
          </div>
          {audit && audit.status === 'busy' ? (
            <span className="pcx-rep-busy"><Spinner size={14} />{t('İnceleniyor…', 'Reviewing…')}</span>
          ) : auditIdle ? (
            <button type="button" className="pcx-rep-btn" onClick={runAudit}>{audit && audit.status === 'done' ? t('Yeniden denetle', 'Re-audit') : t('Denetle', 'Run audit')}</button>
          ) : null}
          {audit && audit.status === 'error' ? <span className="pcx-rep-err">{t('Denetim yapılamadı', 'Audit failed')}{audit.errMsg ? ' (' + audit.errMsg + ')' : ''}{t('; tekrar deneyin.', '; try again.')}</span> : null}
        </div>
      </section>

      {audit && audit.status === 'done' && (audit.text || '').trim() ? (
        <section data-noprint="1" className="pcx-rep-audit">
          <div className="pcx-rep-audit-head">
            <b>{t('Tutarlılık denetimi sonucu', 'Consistency audit result')}</b>
            <button type="button" className="pcx-rep-x" aria-label={t('Denetim sonucunu kapat', 'Dismiss audit result')} onClick={() => updC(cc => { delete cc.audit; })}>×</button>
          </div>
          <div className="pcx-rep-audit-body">{audit.text}</div>
        </section>
      ) : null}

      {/* Rapor içeriği — yalnız tam raporda; varsayılan kapalı */}
      {cfg.view === 'full' ? (
        <details data-noprint="1" className="pcx-rep-config">
          <summary>
            <b>{t('Rapor içeriği', 'Report contents')}</b>
            <span>{includedCount}/{sectionChips.length}{t(' bölüm dahil', ' sections included')}{cfg.company ? ' · ' + cfg.company : ''}</span>
          </summary>
          <div className="pcx-rep-config-body">
            <div className="pcx-rep-checks">
              {sectionChips.map(x => (
                <label key={x.key}>
                  <input type="checkbox" checked={cfg.sections[x.key] !== false} onChange={() => upd(n => { n.reportCfg.sections[x.key] = !(n.reportCfg.sections[x.key] !== false); })} />
                  {x.label}
                </label>
              ))}
            </div>
            <label className="pcx-rep-company">
              <span>{t('Şirket / birim (rapor başlığında görünür)', 'Company / unit (shown in the report header)')}</span>
              <input className="pcx-field-sm" value={cfg.company || ''} onChange={e => upd(n => { n.reportCfg.company = e.target.value; })} placeholder={t('Örn. Lojistik Direktörlüğü', 'E.g. Logistics Directorate')} />
            </label>
          </div>
        </details>
      ) : (
        <p data-noprint="1" className="pcx-rep-hint">{cfg.view === 'a3' ? t('A3 özeti sabit tek sayfa düzenidir; A3 yatay kâğıda yazdırın.', 'The A3 summary is a fixed one-page layout; print on A3 landscape paper.') : t('Vaka haritası verilerinizden otomatik türetilir; bir düğüme tıklayınca ilgili adım açılır.', 'The case map is derived automatically from your data; click a node to open the related step.')}</p>
      )}

      {cfg.view === 'a3' ? (
        <>
          {/* A3 yatay sayfa — yalnız A3 görünümü aktifken */}
          <style>{'@media print { @page { size: A3 landscape; margin: 10mm } }'}</style>
          <A3Body c={c} companyName={cfg.company} lang={lang} />
        </>
      ) : cfg.view === 'map' ? (
        <>
          <style>{'@media print { @page { size: A4 landscape; margin: 10mm } }'}</style>
          <CaseMap c={c} lang={lang} onNavigate={goStep} />
        </>
      ) : (
        <ReportBody c={c} principles={principles} sections={cfg.sections} companyName={cfg.company} lang={lang} />
      )}
    </div>
  );
}
