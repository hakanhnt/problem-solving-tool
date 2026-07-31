// Yöntem Danışmanı — ekranın sağından açılan serbest sohbet paneli.
//
// Adım asistanından (AssistantChat) farkı: vaka verisine bakmaz; metodolojiyi,
// yöntemleri ve uygulamanın kullanımını ÖĞRETİR. Geçmişi vakadan bağımsızdır
// ve tarayıcıda saklanır. Yüzen şişe düğmesiyle açılır, Escape ile kapanır.

import React from 'react';
import { useStore } from '../lib/store.jsx';
import { HButton, Spinner, useNarrow } from '../ui/primitives.jsx';
import { LogoGlyph } from '../ui/Logo.jsx';

const STARTERS = [
  'İş Sürücüsü Haritalama nedir, nasıl yapılır?',
  'İş Sürücüsü Analizi nedir, nasıl yapılır?',
  'Problem, bulgu ve kök neden arasındaki fark nedir?',
  'Karar matrisini nasıl puanlarım, ağırlıkları nasıl belirlerim?',
  'VAR/YOK belirtimi ne işe yarar?',
  '5 Neden zincirini nerede durdurmalıyım?'
];

export default function HelpChat() {
  const { state, upd, askHelp } = useStore();
  const narrow = useNarrow();
  const [draft, setDraft] = React.useState('');
  const open = !!state.helpOpen;
  const busy = !!state.helpBusy;
  const messages = state.helpChat || [];
  const listRef = React.useRef(null);
  const inputRef = React.useRef(null);

  const toggle = () => upd(n => { n.helpOpen = !n.helpOpen; });

  // Açılınca giriş alanına odaklan; Escape ile kapan.
  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 60);
    const onKey = e => { if (e.key === 'Escape') upd(n => { n.helpOpen = false; }); };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); };
  }, [open, upd]);

  // Yeni mesajda listeyi sona kaydır.
  React.useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, busy, messages.length ? messages[messages.length - 1].content : '']);

  const send = text => {
    const q = (text != null ? text : draft).trim();
    if (!q) return;
    setDraft('');
    askHelp(q);
  };

  return (
    <>
      {/* Yüzen açma düğmesi — alt eylem çubuğunun üstünde durur */}
      {!open ? (
        <button
          type="button"
          onClick={toggle}
          aria-label="Yöntem Danışmanını aç — metodoloji ve uygulama hakkında serbest soru sorun"
          title="Yöntem Danışmanı — serbest soru sorun"
          data-noprint="1"
          style={{
            position: 'fixed', right: 18, bottom: 74, zIndex: 44,
            width: 52, height: 52, borderRadius: '50%', border: '1px solid var(--pri)',
            background: 'var(--pri)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(53,80,110,.4)'
          }}
        >
          <LogoGlyph size={26} />
          <span aria-hidden="true" style={{
            position: 'absolute', top: -3, right: -3, width: 16, height: 16, borderRadius: '50%',
            background: 'var(--ok-dot)', border: '2px solid var(--surface)',
            font: '700 9px/13px Helvetica,Arial,sans-serif', color: 'var(--ink)', textAlign: 'center'
          }}>?</span>
        </button>
      ) : null}

      {/* Sağdan açılan panel */}
      {open ? (
        <div
          data-noprint="1"
          role="dialog" aria-modal={narrow ? 'true' : undefined} aria-label="Yöntem Danışmanı"
          style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 48,
            width: narrow ? '100%' : 400, maxWidth: '100vw',
            background: 'var(--surface)', borderLeft: '1px solid var(--line-strong)',
            boxShadow: '-8px 0 30px rgba(0,0,0,.18)',
            display: 'flex', flexDirection: 'column'
          }}
        >
          <div style={{ flex: 'none', display: 'flex', gap: 10, alignItems: 'center', padding: '13px 16px', background: 'var(--pri)' }}>
            <LogoGlyph size={20} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: '700 13.5px Helvetica,Arial,sans-serif', color: 'var(--on-pri)' }}>Yöntem Danışmanı</div>
              <div style={{ font: '10.5px/1.35 Helvetica,Arial,sans-serif', color: 'var(--on-pri-muted)' }}>Metodoloji ve uygulama hakkında serbest sorular</div>
            </div>
            {messages.length ? (
              <HButton
                onClick={() => { if (confirm('Sohbet geçmişi silinsin mi?')) upd(n => { n.helpChat = []; }); }}
                aria-label="Sohbet geçmişini temizle"
                style={{ flex: 'none', border: 'none', background: 'transparent', color: 'var(--on-pri-muted)', font: '600 11.5px Helvetica,Arial,sans-serif', cursor: 'pointer', padding: '4px 6px' }}
                hover={{ color: 'var(--on-pri)' }}
              >Temizle</HButton>
            ) : null}
            <HButton
              onClick={toggle}
              aria-label="Yöntem Danışmanını kapat"
              style={{ flex: 'none', width: 28, height: 28, border: 'none', borderRadius: 6, background: 'transparent', color: 'var(--on-pri-muted)', font: '700 16px/1 Helvetica,Arial,sans-serif', cursor: 'pointer' }}
              hover={{ color: 'var(--on-pri)' }}
            >×</HButton>
          </div>

          <div ref={listRef} style={{ flex: 1, overflow: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!messages.length ? (
              <>
                <div style={{ font: '12.5px/1.6 Helvetica,Arial,sans-serif', color: 'var(--ink-4)' }}>
                  Metodoloji, yöntemler ya da uygulamanın kullanımı hakkında istediğinizi sorun.
                  Çalışmanızdaki girdileri değerlendirmem gerekiyorsa, ilgili adım sayfasının altındaki <strong>YZ Asistan</strong>'ı kullanın — ben girdilerinizi görmem, yöntemi öğretirim.
                </div>
                <div style={{ font: '700 10.5px Helvetica,Arial,sans-serif', color: 'var(--muted)', letterSpacing: '.6px', marginTop: 4 }}>ÖRNEK SORULAR</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {STARTERS.map(q => (
                    <HButton
                      key={q}
                      onClick={() => send(q)}
                      style={{ textAlign: 'left', padding: '9px 12px', border: '1px solid var(--pri-border-5)', borderRadius: 9, background: 'var(--pri-soft-2)', color: 'var(--pri-ink)', font: '12.5px/1.45 Helvetica,Arial,sans-serif', cursor: 'pointer' }}
                      hover={{ background: 'var(--pri-soft)' }}
                    >{q}</HButton>
                  ))}
                </div>
              </>
            ) : null}

            {messages.map((m, i) => {
              const u = m.role === 'user';
              return (
                <div key={i} style={{
                  alignSelf: u ? 'flex-end' : 'flex-start', maxWidth: '90%',
                  background: u ? 'var(--pri)' : 'var(--chat-bubble)', color: u ? 'var(--on-pri)' : 'var(--ink)',
                  border: '1px solid ' + (u ? 'var(--pri)' : 'var(--pri-border-7)'),
                  borderRadius: 10, padding: '9px 12px', font: '12.5px/1.55 Helvetica,Arial,sans-serif', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'
                }}>{m.content}{m.live ? <span style={{ display: 'inline-block', width: 7, height: 12, background: 'var(--pri)', marginLeft: 3, verticalAlign: 'text-bottom', animation: 'pcxpulse 1s ease-in-out infinite' }} /> : null}</div>
              );
            })}

            {busy && !messages.some(m => m.live) ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', font: 'italic 12px Helvetica,Arial,sans-serif', color: 'var(--muted)' }}>
                <Spinner size={13} border={2} />Danışman düşünüyor…
              </div>
            ) : null}
          </div>

          {/* Ekran okuyucuya cevap durumu */}
          <div className="pcx-sr-only" role="status" aria-live="polite">
            {busy ? 'Danışman cevap yazıyor.' : (messages.length && messages[messages.length - 1].role === 'assistant' ? 'Cevap hazır.' : '')}
          </div>

          <div style={{ flex: 'none', display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid var(--line-3)', background: 'var(--surface-2)' }}>
            <textarea
              ref={inputRef}
              className="pcx-field"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Sorunuzu yazın — Enter ile gönderin"
              aria-label="Yöntem Danışmanına sorunuz"
              rows={2}
              style={{ flex: 1, boxSizing: 'border-box', padding: '9px 11px', border: '1px solid var(--field-border)', borderRadius: 8, font: '12.5px/1.5 Helvetica,Arial,sans-serif', color: 'var(--ink)', background: 'var(--surface)', outline: 'none', resize: 'none' }}
            />
            <HButton
              onClick={() => send()}
              aria-label="Soruyu gönder"
              style={{ flex: 'none', alignSelf: 'flex-end', padding: '9px 16px', border: '1px solid var(--pri)', borderRadius: 8, background: busy ? 'var(--pri-bar)' : 'var(--pri)', color: 'var(--on-pri)', font: '600 12.5px Helvetica,Arial,sans-serif', cursor: busy ? 'default' : 'pointer' }}
              hover={busy ? {} : { background: 'var(--pri-hover)' }}
            >Gönder</HButton>
          </div>
        </div>
      ) : null}
    </>
  );
}
