// Paylaşım linkinden açılan salt-okunur görünüm: yalnız raporu gösterir.
// Alıcı isterse çalışmayı kendi listesine kopyalayıp düzenlemeye devam eder.

import React from 'react';
import { useStore } from '../lib/store.jsx';
import ReportBody from './ReportBody.jsx';
import A3Body from './A3Body.jsx';
import CaseMap from './CaseMap.jsx';
import { HButton } from '../ui/primitives.jsx';

export default function SharedView({ payload, onExit }) {
  const { upd, lang, t } = useStore();
  const [view, setView] = React.useState('full');

  const copyToMine = () => {
    const id = 'c' + Date.now();
    upd(n => {
      const copy = structuredClone(payload.c);
      copy.name = (copy.name || t('Çalışma', 'Case')) + t(' (paylaşılan kopya)', ' (shared copy)');
      n.cases[id] = copy;
      n.activeCase = id;
      n.step = 1;
      if (Array.isArray(payload.principles) && payload.principles.length && (!Array.isArray(n.principles) || !n.principles.length)) {
        n.principles = payload.principles;
      }
    });
    onExit();
  };

  return (
    <div data-app-root="1" style={{ minHeight: '100vh', background: 'var(--bg)', overflow: 'auto' }} data-main="1">
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '26px 24px 90px' }}>
        <div data-noprint="1" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', background: 'var(--pri-soft)', border: '1px solid var(--pri-border-5)', borderRadius: 10, padding: '12px 16px', margin: '0 0 18px' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ font: '700 13px Helvetica,Arial,sans-serif', color: 'var(--pri-ink)' }}>{t('🔗 Paylaşılan çalışma — salt okunur', '🔗 Shared case — read only')}</div>
            <div style={{ font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', marginTop: 2 }}>
              {t('Bu rapor bir paylaşım linkinden görüntüleniyor; veri yalnızca linkin içindedir, sunucuda tutulmaz.', 'This report is viewed via a share link; the data lives only in the link and is not stored on any server.')}
            </div>
          </div>
          <HButton
            onClick={() => window.print()}
            style={{ flex: 'none', padding: '9px 14px', border: '1px solid var(--pri-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--pri)', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--pri-soft-hover)' }}
          >{t('Yazdır / PDF', 'Print / PDF')}</HButton>
          <HButton
            onClick={copyToMine}
            style={{ flex: 'none', padding: '9px 14px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: 'var(--pri-hover)' }}
          >{t('Çalışmalarıma kopyala ve düzenle', 'Copy to my cases and edit')}</HButton>
          <HButton
            onClick={onExit}
            title={t('Paylaşımı kapatıp kendi çalışmalarınıza dönün', 'Close the shared view and return to your own cases')}
            style={{ flex: 'none', padding: '9px 12px', border: 'none', background: 'transparent', color: 'var(--muted)', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ color: 'var(--ink-3)' }}
          >{t('Kapat ×', 'Close ×')}</HButton>
        </div>

        <div data-noprint="1" style={{ display: 'flex', gap: 6, margin: '0 0 12px' }}>
          {[['full', t('Tam rapor', 'Full report')], ['a3', t('A3 özeti', 'A3 summary')], ['map', t('Vaka haritası', 'Case map')]].map(([k, lb]) => (
            <button key={k} onClick={() => setView(k)} aria-pressed={view === k}
              style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid ' + (view === k ? 'var(--pri)' : 'var(--field-border)'), background: view === k ? 'var(--pri)' : 'var(--surface)', color: view === k ? 'var(--on-pri)' : 'var(--ink-3)', font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            >{lb}</button>
          ))}
        </div>
        {view === 'a3' ? (
          <>
            <style>{'@media print { @page { size: A3 landscape; margin: 10mm } }'}</style>
            <A3Body c={payload.c} companyName={payload.company} lang={lang} />
          </>
        ) : view === 'map' ? (
          <CaseMap c={payload.c} lang={lang} />
        ) : (
          <ReportBody c={payload.c} principles={payload.principles} companyName={payload.company} lang={lang} />
        )}
      </div>
    </div>
  );
}
