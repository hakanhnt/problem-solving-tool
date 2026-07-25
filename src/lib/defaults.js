// Varsayılan veriler: kurum prensipleri, boş çalışma, örnek çalışma ve adım tanımları.
// Prototipteki (Problem Çözme Akışı.dc.html) içerikle birebir aynıdır.

export const STORAGE_KEY = 'pcx_workbook_v1';

export function defaultPrinciples() {
  return [
    'Stratejik öncelikleri doğru belirleriz',
    'Stratejik amaçlar ile faaliyetler tutarlıdır',
    'Başarı tanımında netlik / operational clarity / sonuçları sahiplenme',
    'Zora talip olur, çıtayı yükseğe koyarız',
    'Yatay / çevik örgüt yapısı, az hiyerarşi',
    'Kritik pozisyonlarda olimpiyat vizyonuna uygun yeterlilik',
    'İnovatif fikirler; act fast, fail fast',
    "Best practice'leri araştırıp adapte ederiz",
    'Müşteri takıntılıyız',
    'Paydaşlarla cross-functional çalışırız',
    'Merak ve tutkuyla teknik ayrıntıya kadar uzmanlaşırız',
    'Doğru düşünme / analiz araçlarını etkin kullanırız',
    "İşi bilen ile developer'ı yan yana çalıştırırız",
    "Gemba'da — işin yapıldığı yerde oluruz",
    'Anlam buldurur, energize eder, harekete geçiririz',
    'Kök nedeni önce kendimizde ararız',
    'Toplantı verimliliğini artırırız',
    'Empati kurar, can kulağıyla dinleriz',
    'Destek departmanları da işten anlar',
    'Erdemli davranış ve uzmanlıkla güven yaratırız'
  ];
}

export function blankCase(name) {
  return {
    name: name || 'Benim Çalışmam',
    problem: { statement: '', geo: '', time: '', brand: '', kpiName: '', target: '', actual: '' },
    drivers: [], driverAnalysis: [], sipoc: [], findings: [],
    whys: ['', '', '', '', ''],
    fishbone: { insan: '', metot: '', sistem: '', girdi: '', olcum: '', cevre: '' },
    rootCauses: [], alternatives: [], criteria: [
      { name: 'Etki (sapmayı azaltma potansiyeli)', weight: '40' },
      { name: 'Uygulama hızı', weight: '25' },
      { name: 'Maliyet / kaynak ihtiyacı', weight: '20' },
      { name: 'Risk / uygulanabilirlik', weight: '15' }
    ], scores: {},
    decision: { choice: '', rationale: '' },
    thinking: { assume: '', alt: '', cost: '' },
    actions: [], tracking: [], retro: { valid: '', worked: '', lessons: '' }
  };
}

export function exampleCase() {
  return {
    name: 'Örnek Çalışma',
    problem: {
      statement: "İthalat uçtan uca yol süresi hedefi (Uzakdoğu'daki üreticiden Türkiye'de antrepo teslime kadar) 45 gün olmasına rağmen, gerçekleşen ortalama 65 gün olmuştur. 20 günlük sapma stok devir hızını ve mağaza bulunurluğunu olumsuz etkilemektedir.",
      geo: "Uzakdoğu menşei (Çin, Bangladeş) → Türkiye; en yüksek sapma Bangladeş çıkışlı yüklemelerde",
      time: "2026 Q1–Q2 gemi yüklemeleri",
      brand: "Tüm markalar; en belirgin sapma temel hazır giyim kategorisinde",
      kpiName: "Uçtan uca yol süresi (gün)", target: "45", actual: "65"
    },
    drivers: [
      { name: "Üretici çıkış süresi (üretim bitişi → gemiye yükleme)", note: "Booking, evrak hazırlığı ve konsolidasyon adımlarını içerir; üretici ve forwarder ile birlikte yürür." },
      { name: "Denizyolu transit süresi", note: "Hat/rota seçimi ve aktarma sayısına bağlı; forwarder sorumluluğunda." },
      { name: "Varış limanı ve gümrük süreci", note: "Ordino, beyanname açılışı, muayene; gümrük müşaviri ile yürür." },
      { name: "Antrepo teslim süreci", note: "Liman çıkışı → antrepo mal kabul; nakliyeci ve antrepo operasyonu." }
    ],
    driverAnalysis: [
      { driver: "Üretici çıkış süresi", component: "Evrak hazırlama ve onay (fatura, çeki listesi, konşimento talimatı)", issue: "Evraklar üreticiden eksik/hatalı geliyor; gidiş-dönüş düzeltme turları yükleme penceresini kaçırtıyor." },
      { driver: "Varış limanı ve gümrük", component: "Beyanname öncesi evrak tamamlama", issue: "Orijinal evrak seti beklendiği için beyanname geç açılıyor." },
      { driver: "Denizyolu transit", component: "Rota / aktarma", issue: "Transit süre plana uygun; anlamlı sapma tespit edilmedi." }
    ],
    sipoc: [
      { s: "Üretici", i: "Ticari fatura, çeki listesi, konşimento talimatı", p: "Yükleme evraklarının hazırlanması ve onayı", o: "Onaylı, eksiksiz evrak seti", c: "Forwarder / Gümrük müşaviri" },
      { s: "Forwarder", i: "Booking, konteyner planı, onaylı evrak", p: "Konsolidasyon ve gemiye yükleme", o: "Yüklenmiş konteyner + konşimento", c: "İthalat operasyon ekibi" },
      { s: "Gümrük müşaviri", i: "Evrak seti, ordino", p: "Beyanname açılışı ve gümrük işlemleri", o: "Kapanmış beyanname", c: "Antrepo / depo operasyonu" }
    ],
    findings: [
      { text: "Booking → gemiye yükleme ortalama 12 gün (hedef 5 gün); +7 gün sapma.", evidence: "Forwarder milestone raporu, son 30 yükleme" },
      { text: "Evrak setinin ilk seferde eksiksiz gelme oranı %38; düzeltme turları ortalama +4 gün ekliyor.", evidence: "Gümrük müşaviri evrak kayıtları, Q1–Q2" },
      { text: "Varış → beyanname açılışı ortalama 6 gün (hedef 2 gün); +4 gün sapma.", evidence: "Gümrük sistemi zaman damgaları" },
      { text: "Deniz transit süresi 28 gün (plan 30 gün); sapma yok.", evidence: "Hat tarifesi vs. gerçekleşen karşılaştırması" }
    ],
    whys: [
      "Evrak seti ilk seferde eksiksiz gelmediği için yükleme ve beyanname adımları düzeltme turlarıyla gecikiyor.",
      "Üreticiye net bir evrak kontrol listesi ve örnek şablon verilmemiş; beklenti tanımlı değil.",
      "Evrak süreci uçtan uca bir sahip tarafından yönetilmiyor; her paydaş yalnızca kendi adımına bakıyor.",
      "Yol süresi sadece uçtan uca ölçülüyor; ara adımlar (booking→yükleme, varış→beyan) hedeflenip ölçülmüyor.",
      "Süreci Gemba'da gözlemleyip ara metriklerle yönetme yetkinliğimizi bu sürece uygulamamışız; sorunu dış paydaşta aramışız."
    ],
    fishbone: {
      insan: "Üretici evrak ekibinin format/dil hâkimiyeti düşük; ithalat ekibinde süreç sahibi atanmamış.",
      metot: "Evrak kontrol listesi, şablon ve emir tekrarı yok; standart iş akışı tanımsız.",
      sistem: "Evrak takibi e-posta ile yürüyor; milestone takip sistemi ve ara metrik panosu yok.",
      girdi: "Üreticiden gelen evrak setleri eksik/hatalı (ilk seferde doğruluk %38).",
      olcum: "Sadece uçtan uca süre ölçülüyor; ara adım hedefleri tanımsız.",
      cevre: "Q1'de liman yoğunluğu yaşandı; etkisi sınırlı (≈2 gün)."
    },
    rootCauses: [
      { text: "Uçtan uca süreç sahipliği kurulmamış; ara milestone hedefleri ve metrikleri tanımlanmamış (operational clarity eksikliği).", principles: [2, 11], competency: "Süreç yönetimi ve 'önemli olanı ölç' yetkinliği; hedefleri ara adımlara indirgeme" },
      { text: "Sorun dış paydaşta (üretici/gümrük) aranmış; evrak süreci yerinde gözlemlenmemiş, kök neden önce kendimizde aranmamış.", principles: [13, 15], competency: "Gemba kültürü; başarısızlığı sahiplenme ve öz-değerlendirme" },
      { text: "Basit best practice'ler (checklist, şablon, emir tekrarı) araştırılıp sürece adapte edilmemiş.", principles: [7, 10], competency: "Best practice araştırma ve işe adapte etme disiplini" }
    ],
    alternatives: [
      { name: "Evrak kontrol listesi + şablon seti + emir tekrarı ile üretici evrak sürecini standardize et", method: "Best practice adaptasyonu", note: "Checklist Manifesto yaklaşımı; üretici onboarding'ine evrak eğitimi eklenir. Düşük maliyet, hemen başlanabilir." },
      { name: "Ara milestone KPI'ları + haftalık kontrol kulesi (booking→yükleme, varış→beyan hedefleri)", method: "Sistem düşüncesi", note: "Süreç sahibi atanır; sapmalar haftalık görünür kılınır, eskalasyon kuralı tanımlanır." },
      { name: "Beyanname öncesi dijital evrak akışı / ön-beyan otomasyonu (e-konşimento)", method: "Algoritmik düşünce", note: "Orijinal evrak beklemeden dijital setle ön hazırlık; BT ve gümrük müşaviri ile pilot gerekir, orta vadeli." }
    ],
    criteria: [
      { name: "Etki (sapmayı azaltma potansiyeli)", weight: "40" },
      { name: "Uygulama hızı", weight: "25" },
      { name: "Maliyet / kaynak ihtiyacı", weight: "20" },
      { name: "Risk / uygulanabilirlik", weight: "15" }
    ],
    scores: { '0_0': '4', '0_1': '5', '0_2': '5', '0_3': '5', '1_0': '5', '1_1': '4', '1_2': '4', '1_3': '4', '2_0': '4', '2_1': '2', '2_2': '2', '2_3': '3' },
    actions: [
      { text: "Üretici evrak kontrol listesi ve şablon setini hazırlayıp ilk 10 yüklemede pilot uygula", owner: "İthalat operasyon uzmanı", due: "2 hafta", etki: "5", efor: "2", status: "tamam" },
      { text: "Ara milestone KPI'larını (booking→yükleme, varış→beyan) tanımla; süreç sahibini ata ve haftalık kontrol kulesi toplantısını başlat", owner: "Lojistik müdürü", due: "1 ay", etki: "5", efor: "3", status: "devam" },
      { text: "Dijital evrak akışı / e-konşimento için BT ve gümrük müşaviriyle fizibilite çalışması yap", owner: "BT iş analisti", due: "1 çeyrek", etki: "4", efor: "4", status: "bekliyor" }
    ],
    tracking: [
      { label: "Q2 (başlangıç)", value: "65" },
      { label: "Temmuz", value: "58" },
      { label: "Ağustos", value: "52" }
    ],
    retro: { valid: "", worked: "", lessons: "" },
    thinking: {
      assume: "Evrak kalitesinin üreticinin kapasitesiyle ilgili olduğunu varsayıyoruz; oysa beklentiyi hiç yazılı tanımlamadık. İkinci varsayım: transit süre sabit — bunu ölçtük, doğrulandı.",
      alt: "Gecikmenin kaynağı üretici değil, bizim booking ve onay döngümüz olabilir; ya da tek bir forwarder'ın performansı ortalamayı bozuyor olabilir. İkisi de kırılım bazında test edilmeli.",
      cost: "Checklist'in bedelini ilk ay ithalat operasyon ekibi (ek kontrol yükü) öder; kontrol kulesi kurulmazsa bedeli 2 çeyrek sonra mağaza bulunurluğu olarak müşteri öder."
    },
    decision: {
      choice: "A1 ve A2 birlikte uygulanır: evrak checklist'i + emir tekrarı hemen devreye alınır; ara milestone KPI'ları ve haftalık kontrol kulesi 1 ay içinde kurulur. A3 (dijital evrak akışı) orta vadeli pilot olarak planlanır.",
      rationale: "İlk iki alternatif en yüksek ağırlıklı puanı alıyor, düşük maliyetli ve birbirini tamamlıyor: checklist bulgu B2'deki girdi kalitesi sorununu, kontrol kulesi ise kök neden KN1'deki ölçüm/sahiplik boşluğunu doğrudan gideriyor. Hedef: yol süresini 2 çeyrek içinde 50 günün altına, ardından 45 güne indirmek."
    }
  };
}

export const STEPS = [
  { title: 'Problem Tanımı', sub: 'Statement + kapsam + KPI farkı', desc: '"Ne oldu?" sorusunun cevabını, sapmanın hangi kırılımda oluştuğunu ve ölçülmüş KPI farkını netleştirin. Çözüm ve neden bu adıma girmez.' },
  { title: 'Business Driver Haritalama', sub: 'Ana etkenler ve süreçler', desc: 'Sonucu sürükleyen ana iş sürücülerini ve ilgili süreçleri haritalayın. İşi yapanlara sorun, mümkünse yerinde gözlem yapın.' },
  { title: 'Driver Analizi', sub: 'Alt bileşenler + SIPOC', desc: "Etkisi en büyük driver'ların hangi alt bileşeninde sorun olduğunu, SIPOC analiziyle girdi kalitesini de kontrol ederek belirleyin." },
  { title: 'Problem Bulguları', sub: 'Veriye dayalı sapmalar', desc: 'Varsayımları bırakıp veriye dayalı, ölçülmüş ve doğrulanmış spesifik sapmaları (alt problemleri) ortaya koyun.' },
  { title: 'Kök Neden Analizi', sub: '5 Neden + kılçık + prensipler', desc: 'Sapmaların neden oluştuğunu 5 Neden ve balık kılçığı ile analiz edin; kök nedeni dışarıda değil önce kendi yetkinlik ve prensiplerimizdeki gelişim alanlarında arayın.' },
  { title: 'Karşı Önlemler ve Karar', sub: 'Alternatifler + karar matrisi', desc: 'Doğru düşünme yöntemleriyle alternatif çözümler üretin, karar kriterlerine göre yarıştırın ve akıl yürüterek en doğru çözümü önerin.' },
  { title: 'İzleme ve Retrospektif', sub: 'Aksiyon durumu + KPI trendi', desc: "Döngüyü kapatın: aksiyonların ilerlemesini ve KPI'ın hedefe kapanışını izleyin; kök neden ve karşı önlem doğru muydu — retrospektifle değerlendirin." },
  { title: 'Çalışma Raporu', sub: 'Özet + yazdır / PDF', desc: 'Tüm çalışmanız tek bir raporda derlendi. İsterseniz YZ ile yönetici özeti ekleyin, ardından yazdırın ya da PDF olarak kaydedip paydaşlarınızla paylaşın.' }
];

export const AGENT_TITLES = [
  'Problem Tanımlama Koçu', 'Driver Haritalama Uzmanı', 'Süreç Analizi Uzmanı (SIPOC)', 'Bulgu Doğrulama Uzmanı',
  'Kök Neden Analizi Koçu', 'Karar Analizi Uzmanı', 'İzleme ve Retrospektif Koçu', 'Rapor Editörü'
];

export const AGENT_INTROS = [
  'Probleminiz hangi alanda olursa olsun (lojistik, pazarlama, teknoloji, operasyon, İK, finans…) ifadenizi birlikte netleştirelim: çözüm ya da neden içeriyor mu, ölçülebilir mi, kapsamı doğru mu — değerlendirmemi isteyin ya da soru sorun.',
  'Driver haritanızı eksiksizlik (MECE) açısından değerlendirir, gözden kaçmış olabilecek etkenleri ve kime ne sormanız gerektiğini öneririm.',
  'Alt bileşen ve SIPOC analizinizi inceler, hangi metriklere ve girdi kalitesine bakmanız gerektiğini öneririm.',
  'Bulgularınızın ölçülmüş ve kanıtlı olup olmadığını denetler, varsayım kalan yerleri işaretlerim.',
  '5 Neden zincirinizin tutarlılığını denetler, kök nedeni kurum prensipleri ve yetkinlik gelişim alanlarıyla eşleştirmenize yardım ederim.',
  'Alternatiflerinizi, kriterlerinizi ve puanlamanızı değerlendirir, karar gerekçenizin kök nedeni giderip gidermediğini sorgularım.',
  'Aksiyon ilerlemenizi ve KPI trendinizi değerlendirir; karşı önlem işe yaramıyorsa erken uyarır, retrospektifinizi derinleştirecek soruları sorarım.',
  'Raporunuzun bütünsel tutarlılığını değerlendirir, eksik ya da zayıf bölümleri işaretler, sunum/paylaşım için öneriler veririm.'
];

export const FISHBONE_CATS = [
  { key: 'insan', title: 'İnsan / Yetkinlik', ph: 'Yetkinlik, eğitim, sahiplik...' },
  { key: 'metot', title: 'Metot / Süreç', ph: 'Standart, kontrol listesi, iş akışı...' },
  { key: 'sistem', title: 'Makine / Sistem', ph: 'Araçlar, yazılım, takip sistemleri...' },
  { key: 'girdi', title: 'Malzeme / Girdi', ph: 'Girdi kalitesi, evrak, veri...' },
  { key: 'olcum', title: 'Ölçüm', ph: 'Metrikler, hedefler, görünürlük...' },
  { key: 'cevre', title: 'Çevre / Dış Etken', ph: 'Pazar, mevsimsellik, dış koşullar...' }
];

export const THINKING_METHODS = [
  'İlk ilkeler düşüncesi', 'Eleştirel düşünce', 'Yanal düşünce', 'Tasarım odaklı düşünce',
  'Sistem düşüncesi', 'Algoritmik düşünce', 'İkinci düzey düşünce', 'Best practice adaptasyonu'
];

export const WHY_PLACEHOLDERS = [
  'Bulgu neden oluşuyor?', 'Bu cevap neden oluşuyor?', 'Neden?', 'Neden?', 'Neden? (kök nedene en yakın cevap)'
];
