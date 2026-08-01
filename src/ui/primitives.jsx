// Ortak görsel öğeler ve stil sabitleri.
// Değerler prototipteki inline stillerle birebir aynıdır (tasarım token'ları).

import React, { useState, useEffect } from 'react';
import { useStore } from '../lib/store.jsx';

/** Dar ekran (mobil/tablet) algısı — mobil düzen bu eşiğe göre değişir. */
export function useNarrow(px = 920) {
  const [narrow, setNarrow] = useState(() => typeof matchMedia === 'function' && matchMedia('(max-width: ' + px + 'px)').matches);
  useEffect(() => {
    const mq = matchMedia('(max-width: ' + px + 'px)');
    const fn = e => setNarrow(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [px]);
  return narrow;
}

/* ---------- hover destekli temel öğeler (prototipteki style-hover karşılığı) ---------- */

export function HButton({ style, hover, children, ...rest }) {
  const [h, setH] = useState(false);
  return (
    <button
      {...rest}
      style={{ ...style, ...(h && hover ? hover : null) }}
      onMouseEnter={e => { setH(true); rest.onMouseEnter && rest.onMouseEnter(e); }}
      onMouseLeave={e => { setH(false); rest.onMouseLeave && rest.onMouseLeave(e); }}
    >{children}</button>
  );
}

export function HA({ style, hover, children, ...rest }) {
  const [h, setH] = useState(false);
  return (
    <a
      {...rest}
      style={{ ...style, ...(h && hover ? hover : null) }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
    >{children}</a>
  );
}

export function HDiv({ style, hover, children, ...rest }) {
  const [h, setH] = useState(false);
  return (
    <div
      {...rest}
      style={{ ...style, ...(h && hover ? hover : null) }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
    >{children}</div>
  );
}

/* ---------- stil sabitleri ---------- */

export const S = {
  card: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '18px 20px', margin: '0 0 16px' },
  cardTitle: { font: '700 15px Helvetica,Arial,sans-serif', color: 'var(--ink)' },
  cardSub: { font: '12px/1.5 Helvetica,Arial,sans-serif', color: 'var(--muted)', margin: '0 0 8px' },
  label: { display: 'block', font: '600 12px Helvetica,Arial,sans-serif', color: 'var(--ink-3)', margin: '0 0 6px' },
  microLabel: { font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.8px' },
  input: { width: '100%', boxSizing: 'border-box', padding: '9px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '14px/1.45 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' },
  inputSm: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--field-border)', borderRadius: 6, font: '12.5px/1.4 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' },
  textarea: { width: '100%', boxSizing: 'border-box', padding: '9px 11px', border: '1px solid var(--field-border)', borderRadius: 6, font: '13px/1.45 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none', resize: 'vertical' },
  select: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--field-border)', borderRadius: 6, font: '12.5px Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none' },
  itemCard: { border: '1px solid var(--line-2)', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--surface-2)' },
  primaryBtn: { padding: '9px 16px', border: '1px solid var(--pri)', borderRadius: 8, background: 'var(--pri)', color: 'var(--on-pri)', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' },
  primaryHover: { background: 'var(--pri-hover)' },
  ghostBtn: { padding: '8px 14px', border: '1px solid var(--pri-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--pri)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' },
  ghostHover: { background: 'var(--pri-soft)' },
  neutralBtn: { padding: '9px 14px', border: '1px solid var(--field-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink-3)', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' },
  neutralHover: { background: 'var(--surface-4)' }
};

/* ---------- bileşenler ---------- */

export function Card({ style, children, ...rest }) {
  return <div style={{ ...S.card, ...style }} {...rest}>{children}</div>;
}

/** Kart başlığı; opsiyonel YZ yardım düğmesiyle. */
export function CardHead({ title, sub, onHelp, helpTitle, aiReady }) {
  const { t } = useStore();
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 4px' }}>
        <div style={S.cardTitle}>{title}</div>
        {aiReady && onHelp ? <YZButton onClick={onHelp} title={helpTitle || t("YZ'den \"" + title + "\" için yardım al", 'Get AI help for "' + title + '"')} /> : null}
      </div>
      {sub ? <div style={S.cardSub}>{sub}</div> : null}
    </>
  );
}

export function YZButton({ onClick, title, small }) {
  const { t } = useStore();
  const size = small ? 20 : 24;
  const fallback = t("YZ'den bu alan için yardım al", 'Get AI help for this field');
  return (
    <HButton
      onClick={onClick}
      title={title || fallback}
      aria-label={title || fallback}
      style={{ flex: 'none', width: size, height: size, borderRadius: '50%', border: '1px solid var(--pri-border-2)', background: 'var(--pri-soft)', color: 'var(--pri)', font: (small ? '700 8px/1' : '700 9px/1') + ' Helvetica,Arial,sans-serif', cursor: 'pointer' }}
      hover={{ background: 'var(--pri)', color: 'var(--on-pri)' }}
    >{t('YZ', 'AI')}</HButton>
  );
}

/**
 * Gri "Yöntem:" bilgilendirme kutusu — katlanabilir.
 * Uzun formlarda yöntem açıklamaları varsayılan olarak kapalıdır; kullanıcı
 * tercihi (açık/kapalı) tarayıcıda saklanır, böylece her adımda tekrar
 * kapatmak gerekmez.
 */
const METHOD_PREF_KEY = 'pcx_method_open';

export function MethodBox({ children, margin }) {
  const { t } = useStore();
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(METHOD_PREF_KEY) !== '0'; } catch (e) { return true; }
  });
  const toggle = () => setOpen(o => {
    const v = !o;
    try { localStorage.setItem(METHOD_PREF_KEY, v ? '1' : '0'); } catch (e) { /* yoksay */ }
    return v;
  });
  return (
    <div style={{ background: 'var(--surface-3)', border: '1px solid var(--line-2)', borderRadius: 6, padding: '7px 11px', margin: margin || '0 0 12px' }}>
      <button
        type="button" onClick={toggle} aria-expanded={open}
        style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left' }}
      >
        <span aria-hidden="true" style={{ flex: 'none', width: 16, height: 16, borderRadius: '50%', background: 'var(--chip-neutral)', color: 'var(--ink-3)', font: '700 10px/16px Georgia,serif', textAlign: 'center' }}>i</span>
        <span style={{ flex: 1, font: '600 11.5px Helvetica,Arial,sans-serif', color: 'var(--ink-4)' }}>{t('Yöntem açıklaması', 'Method note')}</span>
        <span aria-hidden="true" style={{ flex: 'none', font: '10px Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{open ? t('▲ gizle', '▲ hide') : t('▼ göster', '▼ show')}</span>
      </button>
      {open ? (
        <div style={{ font: '12px/1.55 Helvetica,Arial,sans-serif', color: 'var(--ink-4)', padding: '6px 0 2px 24px' }}>{children}</div>
      ) : null}
    </div>
  );
}

/**
 * "İleri analiz" bölümü — adımın temel alanlarından sonra gelen, isteğe bağlı
 * derinleşme kartlarını gruplar. Varsayılan kapalıdır; tercih adım bazında saklanır.
 */
export function AdvancedSection({ id, title, sub, children, defaultOpen }) {
  const { t } = useStore();
  const key = 'pcx_adv_' + id;
  const [open, setOpen] = useState(() => {
    try { const v = localStorage.getItem(key); return v === null ? !!defaultOpen : v === '1'; } catch (e) { return !!defaultOpen; }
  });
  const toggle = () => setOpen(o => {
    const v = !o;
    try { localStorage.setItem(key, v ? '1' : '0'); } catch (e) { /* yoksay */ }
    return v;
  });
  return (
    <div style={{ margin: '18px 0 0' }}>
      <button
        type="button" onClick={toggle} aria-expanded={open}
        style={{
          display: 'flex', gap: 10, alignItems: 'center', width: '100%', cursor: 'pointer', textAlign: 'left',
          border: '1px dashed var(--dash-border)', borderRadius: 9, background: 'transparent', padding: '10px 14px'
        }}
      >
        <span aria-hidden="true" style={{ flex: 'none', font: '11px Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>{open ? '▲' : '▼'}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', font: '700 12.5px Helvetica,Arial,sans-serif', color: 'var(--ink-3)' }}>{title}</span>
          {sub ? <span style={{ display: 'block', font: '11.5px/1.45 Helvetica,Arial,sans-serif', color: 'var(--muted)', marginTop: 2 }}>{sub}</span> : null}
        </span>
        <span style={{ flex: 'none', font: '600 11px Helvetica,Arial,sans-serif', color: 'var(--pri)' }}>{open ? t('Gizle', 'Hide') : t('Aç', 'Open')}</span>
      </button>
      {open ? <div style={{ marginTop: 14 }}>{children}</div> : null}
    </div>
  );
}

/** Mavi "KENDİNİZE / PAYDAŞLARINIZA SORUN" kutusu. */
export function GuidanceBox({ items, margin }) {
  const { t } = useStore();
  return (
    <div style={{ background: 'var(--pri-soft)', border: '1px solid var(--pri-border-6)', borderRadius: 10, padding: '16px 18px', margin: margin || '0 0 20px' }}>
      <div style={{ font: '700 11px Helvetica,Arial,sans-serif', color: 'var(--pri)', letterSpacing: '.8px', margin: '0 0 8px' }}>{t('KENDİNİZE / PAYDAŞLARINIZA SORUN', 'ASK YOURSELF / YOUR STAKEHOLDERS')}</div>
      <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map((t, i) => <li key={i} style={{ font: '13px/1.5 Helvetica,Arial,sans-serif', color: 'var(--pri-ink-2)' }}>{t}</li>)}
      </ul>
    </div>
  );
}

export function AddButton({ onClick, children, style }) {
  return (
    <HButton
      onClick={onClick}
      style={{ padding: '10px 14px', border: '1px dashed var(--dash-border)', borderRadius: 8, background: 'transparent', color: 'var(--ink-3)', font: '600 13px Helvetica,Arial,sans-serif', cursor: 'pointer', width: '100%', ...style }}
      hover={{ background: 'var(--surface-4)' }}
    >{children}</HButton>
  );
}

export function RemoveButton({ onClick, children, style }) {
  const { t } = useStore();
  return (
    <HButton
      onClick={onClick}
      aria-label={t('Kaldır', 'Remove')}
      style={{ border: 'none', background: 'transparent', color: 'var(--muted-2)', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer', flex: 'none', ...style }}
      hover={{ color: 'var(--danger)' }}
    >{children || t('Kaldır', 'Remove')}</HButton>
  );
}

/** YZ önerisi doğrulama rozeti (turuncu → yeşil). */
export function VerifyBadge({ meta, onClick }) {
  if (!meta.hasVer) return null;
  return (
    <button
      onClick={onClick}
      style={{ alignSelf: 'flex-start', padding: '5px 10px', borderRadius: 20, border: '1px solid ' + meta.verBorder, background: meta.verBg, color: meta.verColor, font: '600 11px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
    >{meta.verLabel}</button>
  );
}

export function Spinner({ size = 16, border = 2, track = 'var(--spinner-track)', color = 'var(--pri)', style }) {
  return <div style={{ flex: 'none', width: size, height: size, border: border + 'px solid ' + track, borderTopColor: color, borderRadius: '50%', animation: 'pcxspin .8s linear infinite', ...style }} />;
}

export function Badge({ children, bg = 'var(--pri)', color = 'var(--on-pri)', style }) {
  return <div style={{ flex: 'none', background: bg, color, borderRadius: 5, font: '700 11px/1 Helvetica,Arial,sans-serif', padding: '5px 8px', marginTop: 2, ...style }}>{children}</div>;
}

/** Seçili/seçilmemiz çip düğmesi (prensipler, rapor bölümleri, ayar segmentleri). */
export function ChipButton({ active, onClick, children, title, style }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '6px 11px', borderRadius: 20,
        border: '1px solid ' + (active ? 'var(--pri)' : 'var(--field-border)'),
        background: active ? 'var(--pri)' : 'var(--surface)',
        color: active ? 'var(--on-pri)' : 'var(--muted)',
        font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer', ...style
      }}
    >{children}</button>
  );
}
