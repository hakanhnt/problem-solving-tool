// Ortak görsel öğeler ve stil sabitleri.
// Değerler prototipteki inline stillerle birebir aynıdır (tasarım token'ları).

import React, { useState } from 'react';

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
  card: { background: '#fff', border: '1px solid #e3e0da', borderRadius: 10, padding: '18px 20px', margin: '0 0 16px' },
  cardTitle: { font: '700 15px Helvetica,Arial,sans-serif', color: '#26241f' },
  cardSub: { font: '12px/1.5 Helvetica,Arial,sans-serif', color: '#8a857c', margin: '0 0 8px' },
  label: { display: 'block', font: '600 12px Helvetica,Arial,sans-serif', color: '#57534b', margin: '0 0 6px' },
  microLabel: { font: '700 10.5px Helvetica,Arial,sans-serif', color: '#8a857c', letterSpacing: '.8px' },
  input: { width: '100%', boxSizing: 'border-box', padding: '9px 11px', border: '1px solid #d6d3ce', borderRadius: 6, font: '14px/1.45 Helvetica,Arial,sans-serif', color: '#26241f', background: '#fff', outline: 'none' },
  inputSm: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #d6d3ce', borderRadius: 6, font: '12.5px/1.4 Helvetica,Arial,sans-serif', color: '#26241f', background: '#fff', outline: 'none' },
  textarea: { width: '100%', boxSizing: 'border-box', padding: '9px 11px', border: '1px solid #d6d3ce', borderRadius: 6, font: '13px/1.45 Helvetica,Arial,sans-serif', color: '#26241f', background: '#fff', outline: 'none', resize: 'vertical' },
  select: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #d6d3ce', borderRadius: 6, font: '12.5px Helvetica,Arial,sans-serif', color: '#26241f', background: '#fff', outline: 'none' },
  itemCard: { border: '1px solid #e8e5df', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, background: '#fbfaf8' },
  primaryBtn: { padding: '9px 16px', border: '1px solid #35506e', borderRadius: 8, background: '#35506e', color: '#fff', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' },
  primaryHover: { background: '#2a4159' },
  ghostBtn: { padding: '8px 14px', border: '1px solid #b9cbe0', borderRadius: 8, background: '#fff', color: '#35506e', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' },
  ghostHover: { background: '#eef2f7' },
  neutralBtn: { padding: '9px 14px', border: '1px solid #d6d3ce', borderRadius: 8, background: '#fff', color: '#57534b', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: 'pointer' },
  neutralHover: { background: '#f1efeb' }
};

/* ---------- bileşenler ---------- */

export function Card({ style, children, ...rest }) {
  return <div style={{ ...S.card, ...style }} {...rest}>{children}</div>;
}

/** Kart başlığı; opsiyonel YZ yardım düğmesiyle. */
export function CardHead({ title, sub, onHelp, helpTitle, aiReady }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 4px' }}>
        <div style={S.cardTitle}>{title}</div>
        {aiReady && onHelp ? <YZButton onClick={onHelp} title={helpTitle || "YZ'den bu alan için yardım al"} /> : null}
      </div>
      {sub ? <div style={S.cardSub}>{sub}</div> : null}
    </>
  );
}

export function YZButton({ onClick, title, small }) {
  const size = small ? 20 : 24;
  return (
    <HButton
      onClick={onClick}
      title={title || "YZ'den bu alan için yardım al"}
      style={{ flex: 'none', width: size, height: size, borderRadius: '50%', border: '1px solid #c9d4e2', background: '#eef2f7', color: '#35506e', font: (small ? '700 8px/1' : '700 9px/1') + ' Helvetica,Arial,sans-serif', cursor: 'pointer' }}
      hover={{ background: '#35506e', color: '#fff' }}
    >YZ</HButton>
  );
}

/** Gri "Yöntem:" bilgilendirme kutusu. */
export function MethodBox({ children, margin }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#f7f6f3', border: '1px solid #e8e5df', borderRadius: 6, padding: '9px 11px', margin: margin || '0 0 12px' }}>
      <div style={{ flex: 'none', width: 16, height: 16, borderRadius: '50%', background: '#d9d5cd', color: '#57534b', font: '700 10px/16px Georgia,serif', textAlign: 'center' }}>i</div>
      <div style={{ font: '12px/1.55 Helvetica,Arial,sans-serif', color: '#6d6860' }}><strong>Yöntem:</strong> {children}</div>
    </div>
  );
}

/** Mavi "KENDİNİZE / PAYDAŞLARINIZA SORUN" kutusu. */
export function GuidanceBox({ items, margin }) {
  return (
    <div style={{ background: '#eef2f7', border: '1px solid #d3dce8', borderRadius: 10, padding: '16px 18px', margin: margin || '0 0 20px' }}>
      <div style={{ font: '700 11px Helvetica,Arial,sans-serif', color: '#35506e', letterSpacing: '.8px', margin: '0 0 8px' }}>KENDİNİZE / PAYDAŞLARINIZA SORUN</div>
      <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map((t, i) => <li key={i} style={{ font: '13px/1.5 Helvetica,Arial,sans-serif', color: '#3e4a5a' }}>{t}</li>)}
      </ul>
    </div>
  );
}

export function AddButton({ onClick, children, style }) {
  return (
    <HButton
      onClick={onClick}
      style={{ padding: '10px 14px', border: '1px dashed #b9b4ab', borderRadius: 8, background: 'transparent', color: '#57534b', font: '600 13px Helvetica,Arial,sans-serif', cursor: 'pointer', width: '100%', ...style }}
      hover={{ background: '#f1efeb' }}
    >{children}</HButton>
  );
}

export function RemoveButton({ onClick, children, style }) {
  return (
    <HButton
      onClick={onClick}
      style={{ border: 'none', background: 'transparent', color: '#a9a49b', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer', flex: 'none', ...style }}
      hover={{ color: '#b3432f' }}
    >{children || 'Kaldır'}</HButton>
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

export function Spinner({ size = 16, border = 2, track = '#dbe6f1', color = '#35506e', style }) {
  return <div style={{ flex: 'none', width: size, height: size, border: border + 'px solid ' + track, borderTopColor: color, borderRadius: '50%', animation: 'pcxspin .8s linear infinite', ...style }} />;
}

export function Badge({ children, bg = '#35506e', color = '#fff', style }) {
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
        border: '1px solid ' + (active ? '#35506e' : '#d6d3ce'),
        background: active ? '#35506e' : '#fff',
        color: active ? '#fff' : '#8a857c',
        font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer', ...style
      }}
    >{children}</button>
  );
}
