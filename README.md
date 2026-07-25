# Problem Çözme Akışı

YZ destekli, rehberli problem çözme ve karar verme çalışma aracı. Kullanıcıyı 8 adımlık bir
metodolojiden geçirir: problem tanımı → driver haritalama → driver analizi → bulgular →
kök neden → karşı önlemler ve karar → izleme/retrospektif → çalışma raporu.

Bu depo, Claude Design'da hazırlanan `Problem Çözme Akışı.dc.html` prototipinin React + Vite ile
üretim uygulamasına taşınmış halidir. Prototip ve tasarım sohbetleri referans olarak
`project/` ve `chats/` klasörlerinde durur.

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/
npm run preview    # üretim çıktısını yerelde dener
```

> `npm run dev` ile yerelde YZ "Otomatik" modu çalışmaz (Netlify fonksiyonları yok).
> Yerelde denemek için ya `netlify dev` kullanın ya da Ayarlar → YZ Sağlayıcı'dan
> kendi API anahtarınızı girin.

## Netlify yayını

`netlify.toml` hazırdır: `npm run build` → `dist` yayınlanır, `netlify/functions` sunucu
fonksiyonu olarak kurulur.

Site ayarlarında tanımlanacak ortam değişkenleri:

| Değişken | Zorunlu | Açıklama |
| --- | --- | --- |
| `MINIMAX_API_KEY` | evet | "Otomatik" modda kullanılan anahtar; tarayıcıya hiç inmez |
| `MINIMAX_MODEL` | hayır | varsayılan `MiniMax-Text-01` |
| `MINIMAX_BASE_URL` | hayır | varsayılan MiniMax chat/completions ucu |

Fonksiyonlar:

- `netlify/edge-functions/ai.js` → **`/api/ai`** — asıl YZ köprüsü. Sağlayıcıyı `stream: true`
  ile çağırıp SSE akışını olduğu gibi iletir; ilk bayt saniyeler içinde gittiği için
  serverless fonksiyonların 10 sn'lik senkron sınırı devreye girmez.
- `netlify/functions/ai.js` — akışsız yedek köprü. "Otomatik" mod önce `/api/ai`'yi dener,
  ulaşılamazsa (eski deploy, edge kapalı) buraya düşer. Sağlayıcıyı 9 sn'de keserek
  gövdesiz 502 yerine anlaşılır bir 504 mesajı döndürür.
- `netlify/functions/fetch-ref.js` — referans linki okuyucu (SSRF korumalı, 8 sn timeout, ilk 20.000 karakter)

> Fonksiyonlar **ESM** yazılmalıdır (`export const handler = …`). Kökteki `package.json`
> `"type": "module"` olduğu için `exports.handler` kullanan bir fonksiyon Netlify'da
> `exports is not defined in ES module scope` ile çöker ve istemciye gövdesiz 502 döner.

## Mimari

```
src/
  App.jsx                 sayfa iskeleti, adım geçişleri, doğrulama uyarıları
  lib/
    store.jsx             tek state ağacı + localStorage + tüm YZ akışları (Context)
    ai.js                 sağlayıcı katmanı (complete) + sistem talimatı/görev şemaları
    defaults.js           kurum prensipleri, boş/örnek çalışma, adım metinleri
    derive.js             KPI farkı, ifade kalite kontrolü, karar matrisi, trend/harita
  components/             Sidebar · CoachPanel · AssistantChat · SettingsModal
  steps/                  Step1…Step8
  ui/primitives.jsx       tasarım token'ları ve ortak öğeler (hover/focus davranışı dahil)
public/rehber.html        kullanım rehberi (kenar çubuğundaki "📖 Kullanım Rehberi")
```

### Veri modeli

Tüm durum tek bir ağaçta tutulur ve her değişimde `localStorage` anahtarı
**`pcx_workbook_v1`** altına yazılır (prototiple aynı anahtar ve şema — mevcut kullanıcı
verisi olduğu gibi açılır).

```
{ activeCase, step (1-8), trash{key,data,name}|null,
  principles: string[],                       // düzenlenebilir kurum prensipleri
  reportCfg: { company, sections{tanim,driver,analiz,bulgu,kok,karar,referans} },
  aiSettings: { provider:'auto'|'minimax'|'openai'|'anthropic', apiKey, model, baseUrl,
                level:'ogreten'|'dengeli'|'hizli', auto, context,
                length:'kisa'|'detayli', tone:'resmi'|'samimi', critic:'nazik'|'sert' },
  cases: { <id>: CASE } }

CASE = { name, problem{statement,geo,time,brand,kpiName,target,actual},
  drivers[{name,note,src?,verified?}], driverAnalysis[{driver,component,issue,…}],
  sipoc[{s,i,p,o,c}], findings[{text,evidence,…}], whys[5],
  fishbone{insan,metot,sistem,girdi,olcum,cevre},
  rootCauses[{text,principles[int],competency,…}], alternatives[{name,method,note}],
  criteria[{name,weight}], scores{'ai_ci':val}, decision{choice,rationale},
  actions[{text,owner,due,etki,efor,status}], tracking[{label,value}],
  retro{valid,worked,lessons}, references[{id,title,type,url,text,summary,…}],
  ai{step:[msg]}, coach{step:{status,intro,items,questions,errMsg}},
  decisionCoach{…}, actionCoach{…}, audit{…}, report{…} }
```

Kurallar: `ornek` vakası silinemez/yeniden adlandırılamaz ("sıfırla" ile ilk haline döner);
silinen vaka `trash`e alınır ve kenar çubuğundaki "Geri al" şeridiyle kurtarılır;
Adım 1'de problem ifadesi boşken sonraki adıma geçilemez; rehberden eklenen kayıtlar
`src:'yz', verified:false` ile işaretlenir ve doğrulanmadan ilerlenirse uyarı çıkar.

### YZ akışları

Hepsi `buildSystem(step, case)` sistem talimatını paylaşır (adım odağı + tüm çalışma verisi
JSON + ayarlardan seviye/üslup/bağlam ekleri + referans bloğu):

1. **Rehber (coach)** — adım 1-6; adıma girişte form boşsa ve otomatik öneri açıksa kendiliğinden,
   yoksa düğmeyle. Adım başına katı JSON şeması ister, "Forma ekle" kartlarına çevirir.
   "Öğreten" seviyesinde öneri yerine yalnız Sokratik sorular üretir.
2. **Karar önerisi** ve **aksiyon planı önerisi** (Adım 6), **tutarlılık denetimi** ve
   **yönetici özeti** (Adım 8) — tek atımlık çağrılar.
3. **Sohbet asistanı** — adım başına mesaj geçmişi vakada saklanır; alan yanındaki `YZ`
   düğmeleri o alana özel yardım ister.
4. **Referans özetleme** — 4.000 karakteri aşan referanslar bir kez özetlenir; hem ham metin
   hem özet saklanır, sistem talimatına ~8.000 karakterlik bütçeyle girer.

## Prototipe göre farklar

- Prototipe özgü `window.claude` dalı kaldırıldı; "Otomatik" mod doğrudan
  `/.netlify/functions/ai` köprüsünü kullanır (devir README'sinin önerisi).
- Görsel editörden gelen sabit piksel ölçüler (Adım 6 Karar kartı 800×1357px, 807px genişlik
  textarea'lar vb.) akışkan genişliğe çevrildi; karar/gerekçe alanlarının büyütülmüş
  yükseklikleri korundu.
- Tasarım aracına özgü `showGuidance` / `showExample` editör anahtarları kaldırıldı
  (ikisi de varsayılan davranış: açık).

## Referans dosyalar

- `project/Problem Çözme Akışı.dc.html` — kaynak prototip
- `project/design_handoff_problem_cozme/README.md` — tasarım devir notları
- `chats/` — tasarım sohbet dökümleri
