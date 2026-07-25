import React from 'react';
import { useStore } from '../lib/store.jsx';
import { AGENT_TITLES, AGENT_INTROS } from '../lib/defaults.js';
import { HButton, Spinner } from '../ui/primitives.jsx';

export default function AssistantChat() {
  const { state, c, step, upd, updC, askAi } = useStore();
  const messages = (c.ai && c.ai[step]) || [];

  return (
    <div data-noprint="1" style={{ background: '#fff', border: '1px solid #c9d4e2', borderRadius: 10, marginTop: 24, overflow: 'hidden' }}>
      <div style={{ background: '#35506e', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8fd0a0', flex: 'none' }} />
        <div style={{ font: '700 13px Helvetica,Arial,sans-serif', color: '#fff' }}>YZ Asistan · {AGENT_TITLES[step - 1]}</div>
        {messages.length ? (
          <HButton
            onClick={() => updC(cc => { if (cc.ai) cc.ai[step] = []; })}
            style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: '#a9bdd6', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ color: '#fff' }}
          >Sohbeti temizle</HButton>
        ) : null}
      </div>

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ font: '12.5px/1.55 Helvetica,Arial,sans-serif', color: '#6d6860' }}>{AGENT_INTROS[step - 1]}</div>

        {messages.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflow: 'auto', padding: 2 }}>
            {messages.map((m, i) => {
              const u = m.role === 'user';
              return (
                <div key={i} style={{
                  alignSelf: u ? 'flex-end' : 'flex-start', maxWidth: '88%',
                  background: u ? '#35506e' : '#f1f4f8', color: u ? '#fff' : '#26241f',
                  border: '1px solid ' + (u ? '#35506e' : '#dde4ec'),
                  borderRadius: 10, padding: '10px 13px', font: '13px/1.55 Helvetica,Arial,sans-serif', whiteSpace: 'pre-wrap'
                }}>{m.content}</div>
              );
            })}
          </div>
        ) : null}

        {state.aiBusy ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', font: 'italic 12.5px Helvetica,Arial,sans-serif', color: '#8a857c' }}>
            <Spinner size={13} border={2} />Asistan değerlendiriyor…
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <HButton
            onClick={() => askAi('Bu adımdaki girdilerimi metodolojiye göre değerlendir: eksikleri, karışıklıkları (problem / bulgu / kök neden ayrımı) ve iyileştirme önerilerini belirt.')}
            style={{ padding: '8px 13px', border: '1px solid #35506e', borderRadius: 20, background: '#eef2f7', color: '#35506e', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: '#dfe7f0' }}
          >Bu adımdaki girdilerimi değerlendir</HButton>
          <HButton
            onClick={() => askAi('Bu adım için mevcut verime dayanarak somut öneriler üret ve kendime ya da paydaşlarıma sormam gereken doğru soruları listele.')}
            style={{ padding: '8px 13px', border: '1px solid #35506e', borderRadius: 20, background: '#eef2f7', color: '#35506e', font: '600 12px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: '#dfe7f0' }}
          >Öneri ve doğru sorular üret</HButton>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="pcx-field"
            value={state.aiInput || ''}
            onChange={e => upd(n => { n.aiInput = e.target.value; })}
            onKeyDown={e => { if (e.key === 'Enter') askAi(state.aiInput); }}
            placeholder="Asistana soru sorun — örn. Problem ifadem çözüm içeriyor mu?"
            style={{ flex: 1, boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #d6d3ce', borderRadius: 8, font: '13px/1.45 Helvetica,Arial,sans-serif', color: '#26241f', background: '#fff', outline: 'none' }}
          />
          <HButton
            onClick={() => askAi(state.aiInput)}
            style={{ flex: 'none', padding: '10px 18px', border: '1px solid #35506e', borderRadius: 8, background: '#35506e', color: '#fff', font: '600 13px Helvetica,Arial,sans-serif', cursor: 'pointer' }}
            hover={{ background: '#2a4159' }}
          >Gönder</HButton>
        </div>
      </div>
    </div>
  );
}
