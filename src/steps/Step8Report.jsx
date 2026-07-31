import React, { useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { buildShareHash } from '../lib/share.js';
import ReportBody from '../components/ReportBody.jsx';
import { HButton, Spinner, S } from '../ui/primitives.jsx';

const SECTION_CHIPS = [
  { key: 'tanim', label: 'Problem tanımı' },
  { key: 'driver', label: 'İş sürücüsü haritası' },
  { key: 'analiz', label: 'İş sürücüsü analizi' },
  { key: 'bulgu', label: 'Bulgular' },
  { key: 'kok', label: 'Kök neden' },
  { key: 'karar', label: 'Alternatifler + karar' },
  { key: 'dusunme', label: 'Düşünme kontrolü' },
  { key: 'izleme', label: 'İzleme + retrospektif' },
  { key: 'referans', label: 'Referanslar' }
];

export default function Step8Report() {
  const { state, c, principles, upd, runReportSummary, runAudit, updC } = useStore();
  const cfg = state.reportCfg;
  const [shareMsg, setShareMsg] = useState('');

  const report = c.report;
  const audit = c.audit;
  const rsIdle = !report || report.status === 'idle' || report.status === 'done' || report.status === 'error';
  const auditIdle = !audit || audit.status === 'idle' || audit.status === 'error' || audit.status === 'done';

  const shareLink = async () => {
    const onay = confirm(
      'Paylaşım linki nasıl çalışır?\n\n'
      + '• Çalışmanızın TÜM içeriği sıkıştırılıp linkin kendisine gömülür; sunucuya yüklenmez.\n'
      + '• Link kimde varsa raporun tamamını görebilir — şifre ya da erişim kontrolü yoktur.\n'
      + '• Linki geri çekemez, sonradan iptal edemezsiniz.\n'
      + '• Uzun linkler e-posta/mesajlaşma geçmişinde ve tarayıcı kayıtlarında kalabilir.\n\n'
      + 'Ticari sır, kişisel veri ya da gizli bilgi içeriyorsa link yerine PDF paylaşmayı tercih edin.\n\n'
      + 'Linki yine de oluşturmak istiyor musunuz?'
    );
    if (!onay) return;
    const hash = buildShareHash(c, principles, cfg.company);
    const url = location.origin + location.pathname + hash;
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg('Link kopyalandı (' + Math.round(url.length / 1024) + ' KB) — veriler linkin içinde taşınır, alıcı salt-okunur raporu görür');
    } catch (e) {
      prompt('Linki kopyalayın:', url);
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
        >Yazdır / PDF olarak kaydet</HButton>

        <HButton
          onClick={shareLink}
          style={{ padding: '10px 16px', border: '1px solid var(--pri-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--pri)', font: '600 13px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
          hover={S.ghostHover}
        >🔗 Paylaşım linki kopyala</HButton>

        {rsIdle ? (
          <HButton
            onClick={runReportSummary}
            style={{ padding: '10px 16px', border: '1px solid var(--pri-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--pri)', font: '600 13px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={S.ghostHover}
          >YZ ile yönetici özeti oluştur</HButton>
        ) : null}
        {report && report.status === 'busy' ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Spinner size={14} /><div style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--pri)' }}>Yönetici özeti hazırlanıyor…</div>
          </div>
        ) : null}
        {report && report.status === 'error' ? (
          <div style={{ font: '12px Helvetica,Arial,sans-serif', color: 'var(--alert)' }}>Özet oluşturulamadı{report && report.errMsg ? ' (' + report.errMsg + ')' : ''} — tekrar deneyin.</div>
        ) : null}

        {auditIdle ? (
          <HButton
            onClick={runAudit}
            style={{ padding: '10px 16px', border: '1px solid var(--alert)', borderRadius: 8, background: 'var(--surface)', color: 'var(--alert)', font: '600 13px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--alert-soft)' }}
          >🔎 Tutarlılık denetimi</HButton>
        ) : null}
        {audit && audit.status === 'busy' ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Spinner size={14} track="var(--alert-border)" color="var(--alert)" />
            <div style={{ font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--alert)' }}>Denetçi tüm vakayı uçtan uca inceliyor…</div>
          </div>
        ) : null}
        {audit && audit.status === 'error' ? (
          <div style={{ font: '12px Helvetica,Arial,sans-serif', color: 'var(--alert)' }}>Denetim yapılamadı{audit && audit.errMsg ? ' (' + audit.errMsg + ')' : ''} — tekrar deneyin.</div>
        ) : null}
      </div>

      {shareMsg ? (
        <div data-noprint="1" style={{ background: 'var(--ok-soft)', border: '1px solid var(--ok-border)', borderRadius: 8, padding: '9px 13px', margin: '0 0 14px', font: '600 12.5px Helvetica,Arial,sans-serif', color: 'var(--ok-ink)' }}>✓ {shareMsg}</div>
      ) : null}

      {audit && audit.status === 'done' && (audit.text || '').trim() ? (
        <div data-noprint="1" style={{ background: 'var(--alert-soft-2)', border: '1px solid var(--alert-border)', borderRadius: 10, padding: '16px 18px', margin: '0 0 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 10px' }}>
            <div style={{ font: '700 12px Helvetica,Arial,sans-serif', color: 'var(--alert)', letterSpacing: '.6px' }}>🔎 TUTARLILIK DENETİM RAPORU</div>
            <HButton onClick={runAudit} style={{ marginLeft: 'auto', padding: '5px 10px', border: '1px solid var(--alert-border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--alert)', font: '600 11px Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ background: 'var(--alert-soft)' }}>Yeniden denetle</HButton>
            <HButton onClick={() => updC(cc => { delete cc.audit; })} style={{ border: 'none', background: 'transparent', color: 'var(--muted-2)', font: '700 14px/1 Helvetica,Arial,sans-serif', cursor: 'pointer' }} hover={{ color: 'var(--ink-3)' }}>×</HButton>
          </div>
          <div style={{ font: '13px/1.65 Helvetica,Arial,sans-serif', color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>{audit.text}</div>
        </div>
      ) : null}

      <div data-noprint="1" style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 16px', margin: '0 0 18px' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.6px', marginRight: 2 }}>RAPORA DAHİL:</div>
          {SECTION_CHIPS.map(s => {
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
          })}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, minWidth: 240 }}>
          <label style={{ flex: 'none', font: '600 11.5px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>Şirket / birim:</label>
          <input
            className="pcx-field-sm" value={cfg.company || ''}
            onChange={e => upd(n => { n.reportCfg.company = e.target.value; })}
            placeholder="Rapor başlığında görünür"
            style={{ flex: 1, boxSizing: 'border-box', padding: '7px 10px', border: '1px solid var(--field-border)', borderRadius: 6, font: '12.5px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
          />
        </div>
      </div>

      <ReportBody c={c} principles={principles} sections={cfg.sections} companyName={cfg.company} />
    </div>
  );
}
