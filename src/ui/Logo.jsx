// ProblemLab marka öğeleri.
//
// İşaret: bir deney şişesi (Erlenmeyer). Uygulamanın çekirdek fikri —
// kök nedeni tahmin etmek değil hipotez kurup VERİYLE TEST ETMEK — laboratuvar
// metaforuyla anlatılır. Şişenin içindeki sıvı ve yükselen kabarcıklar
// "analiz sürüyor"u; şişenin yukarıdan aşağıya daralmadan geniş tabana oturan
// gövdesi ise dağınık belirtilerden tek bir sonuca varmayı temsil eder.
//
// Renkler token'lardan gelir (tema uyumlu); favicon için birebir aynı biçimin
// sabit renkli sürümü public/favicon.svg dosyasındadır.

import React from 'react';

/**
 * Şişe biçimi — dolu siluet olarak çizilir (ince kontur yerine), böylece
 * 16 pikselde favicon olarak da okunaklı kalır.
 */
export function LogoGlyph({ size = 21, body = 'var(--on-pri)', liquid = 'var(--pri-bar)', bubble = 'var(--pri)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      {/* ağız */}
      <rect x="7.6" y="2.6" width="8.8" height="2" rx="1" fill={body} />
      {/* gövde */}
      <path
        d="M9.6 4.6h4.8v4.4l5.3 9.8c.9 1.7-.3 3.3-2.2 3.3H6.5c-1.9 0-3.1-1.6-2.2-3.3L9.6 9V4.6Z"
        fill={body}
      />
      {/* sıvı — analiz edilen örnek */}
      <path
        d="M6.1 15.5h11.8l1.8 3.3c.9 1.7-.3 3.3-2.2 3.3H6.5c-1.9 0-3.1-1.6-2.2-3.3l1.8-3.3Z"
        fill={liquid}
      />
      {/* kabarcıklar — deney sürüyor */}
      <circle cx="10" cy="18.6" r="1.05" fill={bubble} />
      <circle cx="13.6" cy="19.9" r="0.75" fill={bubble} />
    </svg>
  );
}

/** Yuvarlatılmış kare zemine oturmuş işaret — uygulama ikonu. */
export function LogoMark({ size = 38 }) {
  return (
    <div
      style={{
        flex: 'none', width: size, height: size, borderRadius: Math.round(size * 0.26),
        background: 'var(--pri)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 1px 3px rgba(53,80,110,.35)'
      }}
    >
      <LogoGlyph size={Math.round(size * 0.55)} />
    </div>
  );
}

/** Kelime işareti: "Problem" nötr, "Lab" vurgu renginde. */
export function Wordmark({ size = 16 }) {
  return (
    <span style={{ font: '700 ' + size + 'px/1.25 Helvetica,Arial,sans-serif', letterSpacing: '-.3px', whiteSpace: 'nowrap' }}>
      <span style={{ color: 'var(--ink)' }}>Problem</span>
      <span style={{ color: 'var(--pri)' }}>Lab</span>
    </span>
  );
}

/** İşaret + ad (+ isteğe bağlı alt başlık) — site adının yanında gösterilen tam logo. */
export default function Logo({ size = 38, wordSize = 16, sub }) {
  return (
    <div style={{ display: 'flex', gap: 11, alignItems: 'center', minWidth: 0 }}>
      <LogoMark size={size} />
      <div style={{ minWidth: 0 }}>
        <Wordmark size={wordSize} />
        {sub ? (
          <div style={{ font: '11.5px/1.4 Helvetica,Arial,sans-serif', color: 'var(--pri-soft-ink)', marginTop: 2 }}>{sub}</div>
        ) : null}
      </div>
    </div>
  );
}
