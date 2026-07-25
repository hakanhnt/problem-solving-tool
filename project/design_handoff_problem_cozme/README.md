# Handoff: Türkçe İnteraktif Problem Çözüm Aracı ("Problem Çözme Akışı")

## Overview
YZ destekli, rehberli bir problem çözme çalışma aracı. Kullanıcıyı 7 adımlık bir metodolojiden geçirir:
1. **Problem Tanımı** (statement + boyutlar + KPI farkı, canlı kalite kontrolü)
2. **Business Driver Haritalama**
3. **Driver Analizi** (alt bileşenler + SIPOC)
4. **Problem Bulguları** (veriye dayalı, kanıtlı sapmalar)
5. **Kök Neden Analizi** (5 Neden + balık kılçığı + kurum prensipleri eşleştirme)
6. **Karşı Önlemler ve Karar** (alternatifler + ağırlıklı karar matrisi + YZ karar önerisi)
7. **Çalışma Raporu** (derlenmiş, yazdırılabilir rapor + YZ yönetici özeti)

Her adımda bir **YZ Rehber** kullanıcının problem tanımına göre aday girdiler üretir ("Forma ekle" ile tek tıkla aktarılır), doğrulama soruları sorar; ayrıca serbest **YZ Asistan sohbeti** vardır. Hedef ortam: Netlify'de statik yayın + serverless YZ köprüsü.

## About the Design Files
Bu paketteki `Problem Çözme Akışı.dc.html` bir **HTML tasarım referansı / çalışan prototiptir** — özel bir tasarım-bileşeni çalışma zamanına (`support.js`, `<x-dc>` şablonu + `DCLogic` sınıfı) dayanır ve bu haliyle üretim kodu DEĞİLDİR. Görev: bu tasarımı ve davranışı hedef ortamda (öneri: React + Vite, ya da tercih edilen framework) yeniden oluşturmak. `netlify/functions/ai.js` ve `netlify.toml` ise doğrudan kullanılabilir üretim dosyalarıdır.

Dosya yapısı (prototip):
- `<x-dc>…</x-dc>` içi: HTML şablon; `{{ path }}` delikleri, `<sc-if value>` koşulları, `<sc-for list as>` döngüleri, inline stiller
- `<script data-dc-script>` içi: `class Component extends DCLogic` — tüm state, YZ çağrıları ve `renderVals()` (şablona giden tüm değerler/handler'lar). React'e çeviri: `renderVals()` çıktısı ≈ props/derived state; `sc-if/sc-for` ≈ JSX koşul/map.

## Fidelity
**High-fidelity.** Renkler, tipografi, boşluklar ve etkileşimler nihaidir; birebir uygulanmalıdır.

## Design Tokens
- Arka plan: `#efedea` (sayfa), `#fff` (kartlar), `#fbfaf8` (iç kartlar), `#f7f6f3` (yöntem kutuları)
- Metin: `#26241f` (ana), `#57534b` / `#6d6860` (ikincil), `#8a857c` / `#a9a49b` (soluk)
- Vurgu (lacivert): `#35506e`, hover `#2a4159`; açık zemin `#eef2f7`, `#f2f6fb`, `#e3ecf5`; kenarlık `#c9d4e2`, `#b9cbe0`, `#d8e2ee`
- Uyarı/negatif: `#8c4a35`, zemin `#f6e9e5`, kenar `#e5c8bf`; kehribar bilgi: `#7a6f57` / `#f6f1e7` / `#e8ddc7`
- Pozitif: `#4a6741` / `#3d5a3d`, zemin `#eef4ee`, kenar `#cfe0cf`
- Kenarlıklar: `#e3e0da`, `#e8e5df`, `#eceae5`, `#d6d3ce`
- Font: Helvetica/Arial; kart başlıkları 700 15px; gövde 13px/1.45–1.6; etiketler 600 12px; mikro başlıklar 700 10.5px letter-spacing .8px UPPERCASE
- Radius: kartlar 10px, iç kartlar/girdiler 6–8px, çipler 20px; focus: kenar `#35506e` + `0 0 0 2px rgba(53,80,110,.12)`
- Animasyonlar: spinner `pcxspin .8s linear infinite` (border-top renkli daire), `pcxpulse 1.6s` opaklık

## Layout
- Sol sabit kenar çubuğu 288px (beyaz, sağ kenarlık): başlık, ÇALIŞMALAR listesi (+ Yeni / ✎ / ×), silinen için "Geri al" şeridi, 7 adımlı nav (aktif: `#eef2f7` zemin, lacivert numara), altta "Örnek çalışmayı sıfırla", "⚙ Ayarlar", kalıcılık notu
- Ana içerik: max-width 880px, padding 34px 44px 90px; başlıkta "ADIM n / 7 · Çalışma adı"
- Yazdırmada (`@media print`): `[data-noprint]` gizlenir, yalnız rapor çıkar

## Core Behaviors (State Management)
Tek state ağacı (localStorage `pcx_workbook_v1`e her değişimde yazılır):
```
{ activeCase, step (1-7), trash{key,data,name}|null,
  principles: string[] (varsayılan 20 kurum prensibi — düzenlenebilir),
  reportCfg: { company, sections{tanim,driver,analiz,bulgu,kok,karar} },
  aiSettings: { provider:'auto'|'minimax'|'openai'|'anthropic', apiKey, model, baseUrl,
                level:'ogreten'|'dengeli'|'hizli', auto:bool, context,
                length:'kisa'|'detayli', tone:'resmi'|'samimi', critic:'nazik'|'sert' },
  cases: { <id>: CASE } }
CASE = { name, problem{statement,geo,time,brand,kpiName,target,actual},
  drivers[{name,note}], driverAnalysis[{driver,component,issue}], sipoc[{s,i,p,o,c}],
  findings[{text,evidence}], whys[5], fishbone{insan,metot,sistem,girdi,olcum,cevre},
  rootCauses[{text,principles[int],competency}], alternatives[{name,method,note}],
  criteria[{name,weight}], scores{'ai_ci':val}, decision{choice,rationale},
  ai{step:[{role,content}]}, coach{step:{status,intro,items,questions,errMsg}},
  decisionCoach{status,choice,rationale}, report{status,text} }
```
Önemli kurallar:
- `ornek` vakası salt-örnek: silinemez/yeniden adlandırılamaz; "sıfırla" ile ilk haline döner
- Adım 1'de problem ifadesi boşken sonraki adıma geçiş engellenir (alert)
- Vaka silme: `trash`e alınır, kenar çubuğunda kalıcı "Geri al" şeridi (sayfa yenilense de durur)
- Karar matrisi: puan 0-5, ağırlıklı toplam otomatik; en yüksek puan "Matris önerisi" olarak gösterilir
- Adım 1 canlı kalite çipleri (heuristik): sayı var mı, çözüm dili (regex: malıyız|yapılmalı|çözüm…), neden dili (çünkü|nedeniyle…), uzunluk ≥40, hedef+gerçekleşen dolu

## YZ Mimarisi
Tek giriş noktası `complete({system, messages, max_tokens}) -> text`:
- provider `auto`: yerleşik `window.claude.complete` varsa onu, yoksa `/.netlify/functions/ai` (sunucuda `MINIMAX_API_KEY`) kullanır
- `minimax`/`openai`: OpenAI-uyumlu chat/completions (MiniMax: `https://api.minimax.io/v1/text/chatcompletion_v2`, model `MiniMax-Text-01`); `anthropic`: Messages API + `anthropic-dangerous-direct-browser-access` başlığı; kullanıcı anahtarı yalnızca tarayıcıda saklanır

Üç YZ akışı (hepsi `buildSystem(step, case)` sistem talimatını paylaşır — adım odağı + tüm çalışma verisi JSON + aiSettings'ten seviye/üslup/bağlam ekleri):
1. **Rehber (coach)**: adıma girişte otomatik (form boşsa ve `auto` açıksa) ya da düğmeyle; adım başına katı JSON şeması ister (kod içinde `buildCoachTask`), yanıtı ayrıştırıp "Forma ekle" kartlarına çevirir. `ogreten` seviyesinde öneri yerine yalnız Sokratik sorular. JSON ayrıştırma: ``` temizle, ilk `{` … son `}`; hata mesajı panelde gösterilir
2. **Karar önerisi** (Adım 6 Karar kartı) ve **Yönetici özeti** (Adım 7): tek atımlık çağrılar
3. **Sohbet asistanı**: adım başına mesaj geçmişi vakada saklanır

## Rapor (Adım 7)
Girdilerden derlenen tek sayfalık rapor; araç çubuğunda (yazdırmada gizli) "Yazdır/PDF", "YZ yönetici özeti", RAPORA DAHİL bölüm çipleri, şirket/birim adı. Başlık meta satırı: "Şirket · Çalışma Adı · tarih". Boş bölümler otomatik gizlenir.

## Ayarlar Paneli (modal)
YZ SAĞLAYICI (4 seçenek + anahtar/model/URL) → YZ REHBER AYARLARI (seviye 3'lü, otomatik aç/kapa, alan bağlamı, uzunluk/ton/eleştirellik 2'li segmentler) → KURUM PRENSİPLERİ (düzenle/sil/ekle/varsayılana dön; prensip silinince kök neden eşleştirme indeksleri kaydırılır) → alt bar: JSON dışa/içe aktar (içe aktarma çakışan vakaları "(içe aktarılan)" adıyla ekler)

## Deployment (mevcut, çalışır)
- `netlify.toml`: publish ".", functions "netlify/functions"
- `netlify/functions/ai.js`: MiniMax köprüsü; env: `MINIMAX_API_KEY` (zorunlu), `MINIMAX_MODEL`, `MINIMAX_BASE_URL` (isteğe bağlı); CORS + OPTIONS destekli; max_tokens 6000 ile sınırlı

## Suggested Claude Code Roadmap
1. Vite + React'e taşı (tek sayfa, bileşen ağacı: Sidebar / StepView / CoachPanel / AssistantChat / ReportView / SettingsModal)
2. localStorage katmanını koru (aynı anahtar/format — mevcut kullanıcı verisi taşınır)
3. Netlify function'ı olduğu gibi kullan; `window.claude` dalını kaldır (yalnız bu prototip ortamına özgüydü)
4. Sonraki faz: Supabase ile kurumsal kayıt/kimlik (plan: konuşmada kararlaştırıldı)

## Files
- `Problem Çözme Akışı.dc.html` — tam prototip (şablon + logic sınıfı; tüm metinler/promptlar burada)
- `support.js` — prototip çalışma zamanı (üretime taşınmaz, yalnız referans)
- `netlify.toml`, `netlify/functions/ai.js` — üretimde doğrudan kullanılabilir
