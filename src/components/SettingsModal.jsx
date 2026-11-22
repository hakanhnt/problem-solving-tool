// Ayarlar penceresi: dört sekme — Rehber, Yapay zekâ bağlantısı, Kurum
// prensipleri, Veri ve yedek. Değişiklikler anında kaydedilir. Pencere
// `state.showSettings` ile açılır; değer bir sekme anahtarıysa ('veri' gibi)
// o sekmede açılır. Esc ya da arka plana tıklama kapatır.

import React, { useEffect, useRef, useState } from 'react';
import './SettingsModal.css';
import { useStore } from '../lib/store.jsx';
import { defaultPrinciples } from '../lib/defaults.js';
import { CoachSettings, ConnectionSettings } from './SettingsAI.jsx';

const TABS = t => [
  { key: 'rehber', label: t('Rehber', 'Coach'), sub: t('Rehberin nasıl yardım edeceği', 'How the coach helps') },
  { key: 'baglanti', label: t('Yapay zekâ bağlantısı', 'AI connection'), sub: t('Sağlayıcı, anahtar, model', 'Provider, key, model') },
  { key: 'prensip', label: t('Kurum prensipleri', 'Organization principles'), sub: t('Kök neden eşleştirmesi için', 'For root cause mapping') },
  { key: 'veri', label: t('Veri ve yedek', 'Data and backup'), sub: t('Dışa ve içe aktarma', 'Export and import') }
];

function PrinciplesTab() {
  const { principles, upd, t } = useStore();
  const remove = i => {
    if (!confirm(t((i + 1) + '. prensip silinecek; kök nedenlerdeki eşleştirmeler güncellenecek. Emin misiniz?', 'Principle ' + (i + 1) + ' will be deleted; mappings in root causes will be updated. Are you sure?'))) return;
    upd(n => {
      n.principles.splice(i, 1);
      Object.values(n.cases).forEach(cc => (cc.rootCauses || []).forEach(rc => {
        rc.principles = (rc.principles || []).filter(pi => pi !== i).map(pi => (pi > i ? pi - 1 : pi));
      }));
    });
  };
  return (
    <section className="pcx-set-sec">
      <p className="pcx-set-help" style={{ marginTop: 0 }}>{t('Bu liste kök neden eşleştirmesinde, rehber önerilerinde ve raporda kullanılır. Kendi kurumunuzun prensiplerini ya da değerlerini yazabilirsiniz.', "This list is used in root cause mapping, coach suggestions and the report. You can write your own organization's principles or values.")}</p>
      <ol className="pcx-set-principles">
        {principles.map((p, i) => (
          <li key={i}>
            <span className="pcx-set-num" aria-hidden="true">{i + 1}</span>
            <input className="pcx-field pcx-set-input" value={p} aria-label={t('Prensip ', 'Principle ') + (i + 1)} onChange={e => upd(n => { n.principles[i] = e.target.value; })} placeholder={t('Prensip metni', 'Principle text')} />
            <button type="button" className="pcx-set-x" title={t('Prensibi sil', 'Delete principle')} aria-label={t((i + 1) + '. prensibi sil', 'Delete principle ' + (i + 1))} onClick={() => remove(i)}>×</button>
          </li>
        ))}
      </ol>
      <div className="pcx-set-actions">
        <button type="button" className="pcx-set-btn is-dashed" onClick={() => upd(n => { n.principles.push(''); })}>{t('+ Prensip ekle', '+ Add principle')}</button>
        <button type="button" className="pcx-set-btn is-quiet" onClick={() => { if (confirm(t('Prensip listesi varsayılan 20 kurum prensibine döndürülecek. Emin misiniz?', 'The principle list will be reset to the default 20 organization principles. Are you sure?'))) upd(n => { n.principles = defaultPrinciples(); }); }}>{t('Varsayılanlara dön', 'Reset to defaults')}</button>
      </div>
    </section>
  );
}

function DataTab() {
  const { state, upd, t, lang } = useStore();
  const locale = lang === 'en' ? 'en-US' : 'tr-TR';
  const fmt = iso => { try { return new Date(iso).toLocaleString(locale, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return '—'; } };
  const days = iso => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  const stale = !state.lastBackup || days(state.lastBackup) >= 7;

  const exportData = () => {
    const now = new Date();
    const data = JSON.stringify({ app: 'pcx', version: 1, exportedAt: now.toISOString(), principles: state.principles, cases: state.cases }, null, 2);
    const b = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'problem-cozme-calismalari-' + now.toISOString().slice(0, 10) + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    upd(n => { n.lastBackup = now.toISOString(); });
  };

  const importData = () => {
    const el = document.createElement('input');
    el.type = 'file'; el.accept = '.json,application/json';
    el.onchange = () => {
      const f = el.files && el.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const j = JSON.parse(r.result);
          if (!j || !j.cases || typeof j.cases !== 'object') throw new Error('bad');
          const imported = [];
          upd(n => {
            Object.keys(j.cases).forEach(k => {
              if (k === 'ornek') return;
              const cc = j.cases[k];
              if (!cc || !cc.problem) return;
              const key = n.cases[k] ? 'c' + Date.now() + '_' + Math.floor(Math.random() * 1e4) : k;
              if (n.cases[k]) cc.name = (cc.name || 'Çalışma') + ' (içe aktarılan)';
              n.cases[key] = cc;
              imported.push(cc.name || key);
            });
            if (Array.isArray(j.principles) && j.principles.length && confirm(t('Dosyadaki prensip listesi de içe aktarılsın mı? (Mevcut prensip listenizin yerine geçer)', 'Import the principle list from the file too? (It will replace your current principle list)'))) n.principles = j.principles;
          });
          alert(imported.length ? t('İçe aktarılan çalışmalar: ', 'Imported cases: ') + imported.join(', ') : t('Dosyada içe aktarılacak çalışma bulunamadı.', 'No cases to import were found in the file.'));
        } catch (e) {
          alert(t('Dosya okunamadı; geçerli bir yedek JSON dosyası değil.', 'Could not read the file; it is not a valid backup JSON file.'));
        }
      };
      r.readAsText(f);
    };
    el.click();
  };

  return (
    <>
      <section className="pcx-set-sec">
        <div className="pcx-set-warn is-soft">
          <span><strong>{t('Çalışmalarınız yalnızca bu tarayıcıda saklanır.', 'Your cases are stored only in this browser.')}</strong>{' '}{t('Hiçbir sunucuya gönderilmez ve otomatik yedeği yoktur. Tarayıcı verilerini temizlerseniz, gizli sekme kullanırsanız ya da başka bir cihaza geçerseniz çalışmalarınıza erişemezsiniz.', 'Nothing is sent to any server and there is no automatic backup. If you clear browser data, use a private tab or switch to another device, you will lose access to your cases.')}</span>
        </div>
        {state.saveError ? <div role="alert" className="pcx-set-warn is-alert"><span><strong>{t('Kaydedilemedi:', 'Could not save:')}</strong> {state.saveError}</span></div> : null}
        <dl className="pcx-set-status">
          <div><dt>{t('Son kayıt', 'Last saved')}</dt><dd>{state.lastSaved ? fmt(state.lastSaved) : t('Henüz kaydedilmedi', 'Not saved yet')}</dd></div>
          <div><dt>{t('Son yedek', 'Last backup')}</dt><dd className={stale ? 'is-warn' : ''}>{state.lastBackup ? fmt(state.lastBackup) : t('Hiç alınmadı', 'Never taken')}{stale ? t('; yedek almanız önerilir', '; a backup is recommended') : ''}</dd></div>
        </dl>
      </section>
      <section className="pcx-set-sec pcx-set-inline">
        <div>
          <h3>{t('Yedek al', 'Back up')}</h3>
          <p className="pcx-set-help">{t('Tüm çalışmalarınızı ve prensiplerinizi tek bir JSON dosyası olarak indirir.', 'Downloads all your cases and principles as a single JSON file.')}</p>
        </div>
        <button type="button" className="pcx-set-btn is-pri" onClick={exportData}>{t('Yedeği indir', 'Download backup')}</button>
      </section>
      <section className="pcx-set-sec pcx-set-inline">
        <div>
          <h3>{t('Yedekten geri yükle', 'Restore from backup')}</h3>
          <p className="pcx-set-help">{t('Bir yedek dosyasını ya da bir meslektaşınızın dosyasını ekler; mevcut çalışmalarınız silinmez.', "Adds a backup file or a colleague's file; your existing cases are not deleted.")}</p>
        </div>
        <button type="button" className="pcx-set-btn" onClick={importData}>{t('Dosya seç', 'Choose file')}</button>
      </section>
    </>
  );
}

export default function SettingsModal() {
  const { state, upd, t } = useStore();
  const open = !!state.showSettings;
  const [tab, setTab] = useState('rehber');
  const dialogRef = useRef(null);
  const close = () => upd(n => { n.showSettings = false; });

  useEffect(() => {
    if (!open) return undefined;
    setTab(typeof state.showSettings === 'string' ? state.showSettings : 'rehber');
    const prev = document.activeElement;
    setTimeout(() => { if (dialogRef.current) dialogRef.current.focus(); }, 0);
    const onKey = e => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); if (prev && prev.focus) prev.focus(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;
  const tabs = TABS(t);

  return (
    <div data-noprint="1" className="pcx-set-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="pcx-set-title" className="pcx-set">
        <header className="pcx-set-head">
          <h2 id="pcx-set-title" className="pcx-display">{t('Ayarlar', 'Settings')}</h2>
          <button type="button" className="pcx-set-x" aria-label={t('Kapat', 'Close')} onClick={close}>×</button>
        </header>
        <div className="pcx-set-main">
          <nav className="pcx-set-tabs" role="tablist" aria-label={t('Ayar bölümleri', 'Settings sections')}>
            {tabs.map(x => (
              <button key={x.key} type="button" role="tab" id={'pcx-set-tab-' + x.key} aria-selected={tab === x.key} aria-controls="pcx-set-panel" onClick={() => setTab(x.key)}>
                <b>{x.label}</b><span>{x.sub}</span>
              </button>
            ))}
          </nav>
          <div id="pcx-set-panel" role="tabpanel" aria-labelledby={'pcx-set-tab-' + tab} className="pcx-set-panel">
            {tab === 'rehber' ? <CoachSettings /> : null}
            {tab === 'baglanti' ? <ConnectionSettings /> : null}
            {tab === 'prensip' ? <PrinciplesTab /> : null}
            {tab === 'veri' ? <DataTab /> : null}
          </div>
        </div>
        <footer className="pcx-set-foot">
          <span>{t('Değişiklikler otomatik kaydedilir.', 'Changes are saved automatically.')}</span>
          <button type="button" className="pcx-set-btn is-pri" onClick={close}>{t('Kapat', 'Close')}</button>
        </footer>
      </div>
    </div>
  );
}
