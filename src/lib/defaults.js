// Varsayılan veriler: kurum prensipleri, boş çalışma, örnek çalışma ve adım tanımları.
// Prototipteki (Problem Çözme Akışı.dc.html) içerikle birebir aynıdır.

export const STORAGE_KEY = 'pcx_workbook_v1';

export function defaultPrinciples(lang) {
  if (lang === 'en') {
    return [
      'We set strategic priorities correctly',
      'Strategic goals and activities are consistent',
      'Clarity in the definition of success / operational clarity / owning outcomes',
      'We volunteer for the hard problems and set the bar high',
      'Flat / agile organization, little hierarchy',
      'Olympic-level competence in critical positions',
      'Innovative ideas; act fast, fail fast',
      'We research and adapt best practices',
      'We are customer-obsessed',
      'We work cross-functionally with stakeholders',
      'We master technical detail with curiosity and passion',
      'We use the right thinking / analysis tools effectively',
      'We pair the domain expert with the developer',
      'We go to the Gemba — where the work happens',
      'We create meaning, energize and mobilize people',
      'We look for the root cause in ourselves first',
      'We keep meetings productive',
      'We empathize and listen closely',
      'Support departments understand the business too',
      'We build trust through virtuous behavior and expertise'
    ];
  }
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

export function blankCase(name, lang) {
  if (lang === 'en') {
    const c = blankCase(name || 'My Case');
    c.criteria = [
      { name: 'Impact (potential to close the gap)', weight: '40', yon: 'yuksek', d1: 'Reduces the gap by less than 10%', d3: 'Closes about half of the gap', d5: 'Closes most of the gap (80%+)', source: '' },
      { name: 'Speed of implementation', weight: '25', yon: 'yuksek', d1: 'Takes longer than 6 months', d3: 'Live in 1-3 months', d5: 'Live within 2 weeks', source: '' },
      { name: 'Cost / resource need', weight: '20', yon: 'dusuk', d1: 'Requires major budget / new headcount', d3: 'Moderate budget or partial resources', d5: 'Done with current resources, no extra budget', source: '' },
      { name: 'Risk / feasibility', weight: '15', yon: 'dusuk', d1: 'High risk, many external dependencies', d3: 'Manageable risks', d5: 'Low risk, fully under our control', source: '' }
    ];
    return c;
  }
  return {
    name: name || 'Benim Çalışmam',
    mode: 'full',
    triage: { cost: '', benefit: '', urgency: '' },
    timing: { reversal: '', window: '', stopSignal: '' },
    problem: { statement: '', geo: '', time: '', brand: '', kpiName: '', target: '', actual: '', direction: '', unit: '', targetHigh: '' },
    drivers: [], driverAnalysis: [], sipoc: [], findings: [],
    whys: ['', '', '', '', ''],
    whyChains: [],
    fishbone: { insan: '', metot: '', sistem: '', girdi: '', olcum: '', cevre: '' },
    rootCauses: [], alternatives: [], criteria: [
      { name: 'Etki (sapmayı azaltma potansiyeli)', weight: '40', yon: 'yuksek', d1: 'Sapmayı %10\'dan az azaltır', d3: 'Sapmanın yaklaşık yarısını giderir', d5: 'Sapmanın büyük bölümünü (%80+) giderir', source: '' },
      { name: 'Uygulama hızı', weight: '25', yon: 'yuksek', d1: '6 aydan uzun sürer', d3: '1-3 ayda devreye alınır', d5: '2 hafta içinde devreye alınır', source: '' },
      { name: 'Maliyet / kaynak ihtiyacı', weight: '20', yon: 'dusuk', d1: 'Yüksek bütçe / yeni kadro gerektirir', d3: 'Orta düzey bütçe veya kısmi kaynak', d5: 'Mevcut kaynakla, ek bütçesiz yapılır', source: '' },
      { name: 'Risk / uygulanabilirlik', weight: '15', yon: 'dusuk', d1: 'Yüksek riskli, dış bağımlılığı çok', d3: 'Yönetilebilir riskler var', d5: 'Düşük riskli, kontrolümüzde', source: '' }
    ], scores: {},
    decision: { choice: '', rationale: '', secondOrder: '', outsideView: '', redTeam: '', redTeamReply: '' },
    tripwires: [],
    thinking: { assume: '', alt: '', cost: '' },
    spec: { nerede: { v: '', y: '' }, zaman: { v: '', y: '' }, kirilim: { v: '', y: '' }, buyukluk: { v: '', y: '' }, degisiklik: '' },
    containment: { action: '', owner: '', until: '', removed: false },
    actions: [], tracking: [], retro: { valid: '', worked: '', process: '', lessons: '' }
  };
}

export function exampleCase(lang) {
  if (lang === 'en') return exampleCaseEn();
  return {
    name: 'Örnek Çalışma',
    problem: {
      statement: "İthalat uçtan uca yol süresi hedefi (Uzakdoğu'daki üreticiden Türkiye'de antrepo teslime kadar) 45 gün olmasına rağmen, gerçekleşen ortalama 65 gün olmuştur. 20 günlük sapma stok devir hızını ve mağaza bulunurluğunu olumsuz etkilemektedir.",
      geo: "Uzakdoğu menşei (Çin, Bangladeş) → Türkiye; en yüksek sapma Bangladeş çıkışlı yüklemelerde",
      time: "2026 Q1–Q2 gemi yüklemeleri",
      brand: "Tüm markalar; en belirgin sapma temel hazır giyim kategorisinde",
      kpiName: "Uçtan uca yol süresi (gün)", target: "45", actual: "65",
      direction: "dusuk", unit: "gün", targetHigh: ""
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
      { text: "Booking → gemiye yükleme ortalama 12 gün (hedef 5 gün); +7 gün sapma.", evidence: "Forwarder milestone raporu, son 30 yükleme", share: "7" },
      { text: "Evrak setinin ilk seferde eksiksiz gelme oranı %38; düzeltme turları ortalama +4 gün ekliyor.", evidence: "Gümrük müşaviri evrak kayıtları, Q1–Q2", share: "4" },
      { text: "Varış → beyanname açılışı ortalama 6 gün (hedef 2 gün); +4 gün sapma.", evidence: "Gümrük sistemi zaman damgaları", share: "4" },
      { text: "Deniz transit süresi 28 gün (plan 30 gün); sapma yok.", evidence: "Hat tarifesi vs. gerçekleşen karşılaştırması", share: "0" }
    ],
    whys: [
      "Evrak seti ilk seferde eksiksiz gelmediği için yükleme ve beyanname adımları düzeltme turlarıyla gecikiyor.",
      "Üreticiye net bir evrak kontrol listesi ve örnek şablon verilmemiş; beklenti tanımlı değil.",
      "Evrak süreci uçtan uca bir sahip tarafından yönetilmiyor; her paydaş yalnızca kendi adımına bakıyor.",
      "Yol süresi sadece uçtan uca ölçülüyor; ara adımlar (booking→yükleme, varış→beyan) hedeflenip ölçülmüyor.",
      "Süreci Gemba'da gözlemleyip ara metriklerle yönetme yetkinliğimizi bu sürece uygulamamışız; sorunu dış paydaşta aramışız."
    ],
    whyChains: [
      {
        label: "Alternatif dal: forwarder performansı",
        whys: [
          "Booking → yükleme gecikmesi tek bir forwarder'da yoğunlaşıyor olabilir.",
          "Forwarder kırılımında veri incelendi: gecikme iki forwarder'da da benzer (11-13 gün).",
          "Bu dal veriyle desteklenmedi — gecikme forwarder'a değil evrak hazırlığına bağlı; dal elendi.",
          "", ""
        ]
      }
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
      {
        text: "Uçtan uca süreç sahipliği kurulmamış; ara milestone hedefleri ve metrikleri tanımlanmamış (operational clarity eksikliği).",
        principles: [2, 11], competency: "Süreç yönetimi ve 'önemli olanı ölç' yetkinliği; hedefleri ara adımlara indirgeme",
        status: "dogrulandi", findings: [0, 2],
        evidence: "Süreç dokümanları tarandı: hiçbir dokümanda ara adım hedefi ve süreç sahibi tanımı yok; milestone verisi yalnızca uçtan uca ölçülüyor.",
        explainsSpec: "Evet — sahipsizlik her menşeide var; sapmanın Bangladeş'te patlaması yeni üretici değişkeniyle (KN3) birleşince açıklanıyor.",
        testPlan: "Ara hedefler tanımlanıp haftalık izlemeye alınırsa booking→yükleme ve varış→beyan sürelerinin kısalması beklenir.",
        testResult: "Kontrol kulesi kurulan ilk ayda booking→yükleme 12→8 güne indi; ilişki doğrulandı.",
        kpiExpected: "Booking→yükleme 12→5 gün, varış→beyan 6→2 gün; uçtan uca −11 gün"
      },
      {
        text: "Sorun dış paydaşta (üretici/gümrük) aranmış; evrak süreci yerinde gözlemlenmemiş, kök neden önce kendimizde aranmamış.",
        principles: [13, 15], competency: "Gemba kültürü; başarısızlığı sahiplenme ve öz-değerlendirme",
        status: "destekleniyor", findings: [1],
        evidence: "Q1-Q2 yazışmaları: sorun hep üreticiye eskale edilmiş, evrak beklentisi yazılı iletilmemiş; yerinde gözlem kaydı yok.",
        explainsSpec: "Kısmen — davranış her yerde aynı; VAR/YOK farkını tek başına açıklamaz, KN3 ile birlikte açıklar.",
        testPlan: "Üretici ziyareti + evrak sürecinin yerinde gözlemi; beklenti yazılı iletildiğinde ilk seferde doğruluğun artması beklenir.",
        testResult: "",
        kpiExpected: "İlk seferde eksiksiz evrak oranı %38 → %80+"
      },
      {
        text: "Basit best practice'ler (checklist, şablon, emir tekrarı) araştırılıp sürece adapte edilmemiş.",
        principles: [7, 10], competency: "Best practice araştırma ve işe adapte etme disiplini",
        status: "test-edildi", findings: [1],
        evidence: "Üreticiye gönderilmiş bir evrak kontrol listesi ya da şablon bulunamadı; yeni üretici onboarding'inde evrak eğitimi yok.",
        explainsSpec: "Evet — checklist'i hiç almayan iki yeni Bangladeş üreticisi VAR tarafında; köklü Çin üreticileri YOK tarafında.",
        testPlan: "Checklist + şablon ilk 10 yüklemede pilot uygulanır; ilk seferde doğruluk oranı izlenir.",
        testResult: "Pilotta ilk seferde doğruluk %38 → %79; düzeltme turu ortalaması 4 → 1 güne indi.",
        kpiExpected: "Evrak kaynaklı gecikme −4 gün (B2)"
      }
    ],
    alternatives: [
      { name: "Evrak kontrol listesi + şablon seti + emir tekrarı ile üretici evrak sürecini standardize et", method: "Best practice adaptasyonu", note: "Checklist Manifesto yaklaşımı; üretici onboarding'ine evrak eğitimi eklenir. Düşük maliyet, hemen başlanabilir." },
      { name: "Ara milestone KPI'ları + haftalık kontrol kulesi (booking→yükleme, varış→beyan hedefleri)", method: "Sistem düşüncesi", note: "Süreç sahibi atanır; sapmalar haftalık görünür kılınır, eskalasyon kuralı tanımlanır." },
      { name: "Beyanname öncesi dijital evrak akışı / ön-beyan otomasyonu (e-konşimento)", method: "Algoritmik düşünce", note: "Orijinal evrak beklemeden dijital setle ön hazırlık; BT ve gümrük müşaviri ile pilot gerekir, orta vadeli." }
    ],
    criteria: [
      { name: "Etki (sapmayı azaltma potansiyeli)", weight: "40", yon: "yuksek", d1: "Sapmayı 2 günden az azaltır", d3: "Sapmayı 5-10 gün azaltır", d5: "Sapmayı 10+ gün azaltır", source: "Pareto katkı tahminleri (B1-B3) ve pilot sonuçları" },
      { name: "Uygulama hızı", weight: "25", yon: "yuksek", d1: "6+ ay (BT projesi gerektirir)", d3: "1-3 ayda devrede", d5: "2 hafta içinde devrede", source: "Ekip kapasite planı ve BT yol haritası" },
      { name: "Maliyet / kaynak ihtiyacı", weight: "20", yon: "dusuk", d1: "Yeni sistem/kadro yatırımı", d3: "Kısmi danışmanlık/BT eforu", d5: "Mevcut ekiple, ek bütçesiz", source: "Kaba efor tahmini (iş analisti)" },
      { name: "Risk / uygulanabilirlik", weight: "15", yon: "dusuk", d1: "Dış paydaş onayına tam bağımlı", d3: "Paydaş uyumu gerektirir, yönetilebilir", d5: "Tamamen kendi kontrolümüzde", source: "Paydaş analizi (SIPOC)" }
    ],
    scores: { '0_0': '4', '0_1': '5', '0_2': '5', '0_3': '5', '1_0': '5', '1_1': '4', '1_2': '4', '1_3': '4', '2_0': '4', '2_1': '2', '2_2': '2', '2_3': '3' },
    actions: [
      { text: "Üretici evrak kontrol listesi ve şablon setini hazırlayıp ilk 10 yüklemede pilot uygula", owner: "İthalat operasyon uzmanı", startDate: "2026-06-15", dueDate: "2026-06-30", due: "", etki: "5", efor: "2", status: "tamam", rcIdx: "2", findingIdx: "1", successCriteria: "İlk seferde eksiksiz evrak oranı ≥ %75 (pilot 10 yükleme)", evidence: "Pilot raporu: %79 — hedef aşıldı", delayReason: "", priority: "yuksek" },
      { text: "Ara milestone KPI'larını (booking→yükleme, varış→beyan) tanımla; süreç sahibini ata ve haftalık kontrol kulesi toplantısını başlat", owner: "Lojistik müdürü", startDate: "2026-07-01", dueDate: "2026-08-10", due: "", etki: "5", efor: "3", status: "devam", rcIdx: "0", findingIdx: "0", successCriteria: "Booking→yükleme ≤ 5 gün, varış→beyan ≤ 2 gün (4 haftalık ortalama)", evidence: "", delayReason: "", priority: "yuksek" },
      { text: "Dijital evrak akışı / e-konşimento için BT ve gümrük müşaviriyle fizibilite çalışması yap", owner: "BT iş analisti", startDate: "2026-08-01", dueDate: "2026-10-30", due: "", etki: "4", efor: "4", status: "bekliyor", rcIdx: "2", findingIdx: "2", successCriteria: "Fizibilite raporu ve pilot kararı", evidence: "", delayReason: "", priority: "orta" },
      { text: "İki yeni Bangladeş üreticisinde evrak hazırlama sürecini yerinde gözlemle (Gemba); bulguları ekip içinde paylaş", owner: "İthalat operasyon müdürü", startDate: "2026-07-20", dueDate: "2026-09-15", due: "", etki: "3", efor: "2", status: "bekliyor", rcIdx: "1", findingIdx: "1", successCriteria: "İki üreticide gözlem tamamlanır; en az 3 somut süreç bulgusu raporlanır", evidence: "", delayReason: "", priority: "orta" }
    ],
    tracking: [
      { label: "Q2 (başlangıç)", value: "65" },
      { label: "Temmuz", value: "58" },
      { label: "Ağustos", value: "52" }
    ],
    retro: { valid: "", worked: "", lessons: "" },
    spec: {
      nerede: { v: "Bangladeş çıkışlı yüklemeler (sapma +26 gün)", y: "Çin çıkışlı yüklemeler (sapma +9 gün)" },
      zaman: { v: "2026 Q1'den itibaren", y: "2025 Q4 ve öncesi (ortalama 47 gün)" },
      kirilim: { v: "Temel hazır giyim (yüksek adetli, çok evraklı siparişler)", y: "Aksesuar ve ayakkabı (az kalemli siparişler)" },
      buyukluk: { v: "Ortalama +20 gün; en kötü yüklemede +38 gün", y: "Hiçbir yüklemede erken varış yok" }
    ,
      degisiklik: "Q1'de Bangladeş'te iki yeni üreticiyle çalışılmaya başlandı ve sipariş kalem sayısı arttı; evrak beklentisi yeni üreticilere hiç aktarılmadı."
    },
    containment: {
      action: "Stok riski doğan temel giyim siparişlerinde kısmi hava kargo + kritik yüklemelerde evrak setinin gemiden 5 gün önce manuel ön kontrolü",
      owner: "İthalat operasyon uzmanı",
      until: "Checklist + kontrol kulesi devreye girene kadar",
      removed: false
    },
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

/** Örnek vakanın İngilizce sürümü — içerik TR örnekle birebir aynı senaryodur. */
function exampleCaseEn() {
  return {
    name: 'Example Case',
    problem: {
      statement: "The end-to-end import lead time target (from the manufacturer in the Far East to bonded-warehouse delivery in Türkiye) is 45 days, but the realized average is 65 days. The 20-day gap is hurting stock turnover and store availability.",
      geo: "Far East origin (China, Bangladesh) → Türkiye; the largest gap is on shipments departing Bangladesh",
      time: "2026 Q1–Q2 vessel loadings",
      brand: "All brands; the gap is most pronounced in basic apparel",
      kpiName: "End-to-end lead time (days)", target: "45", actual: "65",
      direction: "dusuk", unit: "days", targetHigh: ""
    },
    drivers: [
      { name: "Manufacturer exit time (production finish → vessel loading)", note: "Covers booking, document preparation and consolidation; runs jointly with the manufacturer and the forwarder." },
      { name: "Ocean transit time", note: "Depends on lane/route choice and number of transshipments; forwarder's responsibility." },
      { name: "Arrival port and customs process", note: "Delivery order, declaration opening, inspection; runs with the customs broker." },
      { name: "Bonded-warehouse delivery process", note: "Port exit → warehouse goods receipt; carrier and warehouse operations." }
    ],
    driverAnalysis: [
      { driver: "Manufacturer exit time", component: "Document preparation and approval (invoice, packing list, B/L instructions)", issue: "Documents arrive from the manufacturer incomplete or incorrect; back-and-forth correction rounds cause the loading window to be missed." },
      { driver: "Arrival port and customs", component: "Pre-declaration document completion", issue: "The declaration opens late because the original document set is awaited." },
      { driver: "Ocean transit", component: "Route / transshipment", issue: "Transit time matches plan; no meaningful deviation found." }
    ],
    sipoc: [
      { s: "Manufacturer", i: "Commercial invoice, packing list, B/L instructions", p: "Preparation and approval of shipping documents", o: "Approved, complete document set", c: "Forwarder / Customs broker" },
      { s: "Forwarder", i: "Booking, container plan, approved documents", p: "Consolidation and vessel loading", o: "Loaded container + bill of lading", c: "Import operations team" },
      { s: "Customs broker", i: "Document set, delivery order", p: "Declaration opening and customs clearance", o: "Closed declaration", c: "Bonded warehouse / depot operations" }
    ],
    findings: [
      { text: "Booking → vessel loading averages 12 days (target 5 days); +7 days deviation.", evidence: "Forwarder milestone report, last 30 shipments", share: "7" },
      { text: "Only 38% of document sets arrive complete on the first pass; correction rounds add +4 days on average.", evidence: "Customs broker document records, Q1–Q2", share: "4" },
      { text: "Arrival → declaration opening averages 6 days (target 2 days); +4 days deviation.", evidence: "Customs system timestamps", share: "4" },
      { text: "Ocean transit is 28 days (plan 30 days); no deviation.", evidence: "Line schedule vs. actual comparison", share: "0" }
    ],
    whys: [
      "Because the document set does not arrive complete on the first pass, loading and declaration steps are delayed by correction rounds.",
      "The manufacturer was never given a clear document checklist or sample template; the expectation is undefined.",
      "The document process has no end-to-end owner; each stakeholder only looks at their own step.",
      "Lead time is measured only end-to-end; intermediate steps (booking→loading, arrival→declaration) have no targets or measurements.",
      "We never applied our Gemba-observation and metric-driven management capability to this process; we looked for the problem in external parties."
    ],
    whyChains: [
      {
        label: "Alternative branch: forwarder performance",
        whys: [
          "The booking → loading delay might be concentrated at a single forwarder.",
          "Data was examined by forwarder: the delay is similar at both forwarders (11-13 days).",
          "This branch was not supported by data — the delay is tied to document preparation, not the forwarder; branch eliminated.",
          "", ""
        ]
      }
    ],
    fishbone: {
      insan: "The manufacturer's documentation team has weak command of formats/language; no process owner assigned on the import team.",
      metot: "No document checklist, template or read-back routine; standard workflow undefined.",
      sistem: "Document tracking runs over e-mail; no milestone tracking system or intermediate-metric dashboard.",
      girdi: "Document sets from the manufacturer are incomplete/incorrect (38% first-pass accuracy).",
      olcum: "Only the end-to-end time is measured; intermediate step targets are undefined.",
      cevre: "Port congestion occurred in Q1; impact limited (≈2 days)."
    },
    rootCauses: [
      {
        text: "End-to-end process ownership was never established; intermediate milestone targets and metrics are undefined (lack of operational clarity).",
        principles: [2, 11], competency: "Process management and 'measure what matters'; cascading targets to intermediate steps",
        status: "dogrulandi", findings: [0, 2],
        evidence: "Process documents were scanned: no document defines intermediate targets or a process owner; milestone data is only measured end-to-end.",
        explainsSpec: "Yes — the ownership gap exists for every origin; the spike in Bangladesh is explained when combined with the new-manufacturer variable (RC3).",
        testPlan: "If intermediate targets are defined and tracked weekly, booking→loading and arrival→declaration times are expected to shorten.",
        testResult: "In the first month with the control tower, booking→loading dropped from 12 to 8 days; the relationship was confirmed.",
        kpiExpected: "Booking→loading 12→5 days, arrival→declaration 6→2 days; end-to-end −11 days"
      },
      {
        text: "The problem was blamed on external parties (manufacturer/customs); the document process was never observed on site, and the root cause was not sought in ourselves first.",
        principles: [13, 15], competency: "Gemba culture; owning failure and self-assessment",
        status: "destekleniyor", findings: [1],
        evidence: "Q1-Q2 correspondence: the issue was always escalated to the manufacturer, document expectations were never communicated in writing; no on-site observation records.",
        explainsSpec: "Partly — the behavior is the same everywhere; it does not explain the IS / IS-NOT contrast on its own, only together with RC3.",
        testPlan: "Manufacturer visit + on-site observation of the document process; first-pass accuracy is expected to rise once expectations are communicated in writing.",
        testResult: "",
        kpiExpected: "First-pass complete document rate 38% → 80%+"
      },
      {
        text: "Simple best practices (checklist, template, read-back) were never researched and adapted into the process.",
        principles: [7, 10], competency: "The discipline of researching best practices and adapting them to the work",
        status: "test-edildi", findings: [1],
        evidence: "No document checklist or template ever sent to a manufacturer could be found; new-manufacturer onboarding has no documentation training.",
        explainsSpec: "Yes — the two new Bangladesh manufacturers who never received a checklist are on the IS side; established Chinese manufacturers are on the IS-NOT side.",
        testPlan: "Checklist + template piloted on the first 10 shipments; first-pass accuracy tracked.",
        testResult: "In the pilot, first-pass accuracy rose from 38% to 79%; average correction rounds fell from 4 to 1 day.",
        kpiExpected: "Document-driven delay −4 days (F2)"
      }
    ],
    alternatives: [
      { name: "Standardize the manufacturer document process with a checklist + template set + read-back", method: "Best-practice adaptation", note: "Checklist Manifesto approach; documentation training added to manufacturer onboarding. Low cost, can start immediately." },
      { name: "Intermediate milestone KPIs + weekly control tower (booking→loading, arrival→declaration targets)", method: "Systems thinking", note: "A process owner is assigned; deviations become visible weekly, an escalation rule is defined." },
      { name: "Digital document flow / pre-declaration automation before the declaration (e-B/L)", method: "Algorithmic thinking", note: "Preparation starts with the digital set without waiting for originals; needs a pilot with IT and the customs broker, medium term." }
    ],
    criteria: [
      { name: "Impact (potential to close the gap)", weight: "40", yon: "yuksek", d1: "Reduces the gap by less than 2 days", d3: "Reduces the gap by 5-10 days", d5: "Reduces the gap by 10+ days", source: "Pareto contribution estimates (F1-F3) and pilot results" },
      { name: "Speed of implementation", weight: "25", yon: "yuksek", d1: "6+ months (requires an IT project)", d3: "Live in 1-3 months", d5: "Live within 2 weeks", source: "Team capacity plan and IT roadmap" },
      { name: "Cost / resource need", weight: "20", yon: "dusuk", d1: "New system/headcount investment", d3: "Partial consulting/IT effort", d5: "Current team, no extra budget", source: "Rough effort estimate (business analyst)" },
      { name: "Risk / feasibility", weight: "15", yon: "dusuk", d1: "Fully dependent on external approval", d3: "Needs stakeholder alignment, manageable", d5: "Fully under our control", source: "Stakeholder analysis (SIPOC)" }
    ],
    scores: { '0_0': '4', '0_1': '5', '0_2': '5', '0_3': '5', '1_0': '5', '1_1': '4', '1_2': '4', '1_3': '4', '2_0': '4', '2_1': '2', '2_2': '2', '2_3': '3' },
    actions: [
      { text: "Prepare the manufacturer document checklist and template set; pilot on the first 10 shipments", owner: "Import operations specialist", startDate: "2026-06-15", dueDate: "2026-06-30", due: "", etki: "5", efor: "2", status: "tamam", rcIdx: "2", findingIdx: "1", successCriteria: "First-pass complete document rate ≥ 75% (10-shipment pilot)", evidence: "Pilot report: 79% — target exceeded", delayReason: "", priority: "yuksek" },
      { text: "Define the intermediate milestone KPIs (booking→loading, arrival→declaration); assign the process owner and start the weekly control tower meeting", owner: "Logistics manager", startDate: "2026-07-01", dueDate: "2026-08-10", due: "", etki: "5", efor: "3", status: "devam", rcIdx: "0", findingIdx: "0", successCriteria: "Booking→loading ≤ 5 days, arrival→declaration ≤ 2 days (4-week average)", evidence: "", delayReason: "", priority: "yuksek" },
      { text: "Run a feasibility study with IT and the customs broker for digital document flow / e-B/L", owner: "IT business analyst", startDate: "2026-08-01", dueDate: "2026-10-30", due: "", etki: "4", efor: "4", status: "bekliyor", rcIdx: "2", findingIdx: "2", successCriteria: "Feasibility report and pilot decision", evidence: "", delayReason: "", priority: "orta" },
      { text: "Observe the document preparation process on site at the two new Bangladesh manufacturers (Gemba); share findings with the team", owner: "Import operations manager", startDate: "2026-07-20", dueDate: "2026-09-15", due: "", etki: "3", efor: "2", status: "bekliyor", rcIdx: "1", findingIdx: "1", successCriteria: "Observation completed at both manufacturers; at least 3 concrete process findings reported", evidence: "", delayReason: "", priority: "orta" }
    ],
    tracking: [
      { label: "Q2 (baseline)", value: "65" },
      { label: "July", value: "58" },
      { label: "August", value: "52" }
    ],
    retro: { valid: "", worked: "", lessons: "" },
    spec: {
      nerede: { v: "Shipments departing Bangladesh (deviation +26 days)", y: "Shipments departing China (deviation +9 days)" },
      zaman: { v: "Since 2026 Q1", y: "2025 Q4 and earlier (average 47 days)" },
      kirilim: { v: "Basic apparel (high-volume, document-heavy orders)", y: "Accessories and footwear (few-line orders)" },
      buyukluk: { v: "Average +20 days; worst shipment +38 days", y: "No shipment ever arrives early" }
    ,
      degisiklik: "In Q1 we started working with two new manufacturers in Bangladesh and order line counts increased; document expectations were never communicated to the new manufacturers."
    },
    containment: {
      action: "Partial air freight for basic-apparel orders at stock risk + manual pre-check of the document set 5 days before vessel departure on critical shipments",
      owner: "Import operations specialist",
      until: "Until the checklist + control tower are live",
      removed: false
    },
    thinking: {
      assume: "We assume document quality is about the manufacturer's capability, yet we never defined the expectation in writing. Second assumption: transit time is stable — we measured this one; confirmed.",
      alt: "The source of the delay could be our own booking and approval loop rather than the manufacturer; or a single forwarder's performance could be skewing the average. Both should be tested by segment.",
      cost: "The import operations team pays the checklist's cost in the first month (extra checking); if the control tower is not built, the customer pays it two quarters later as store availability."
    },
    decision: {
      choice: "A1 and A2 are implemented together: the document checklist + read-back go live immediately; intermediate milestone KPIs and the weekly control tower are set up within a month. A3 (digital document flow) is planned as a medium-term pilot.",
      rationale: "The first two alternatives score highest on the weighted matrix, are low cost and complement each other: the checklist directly fixes the input-quality problem in finding F2, and the control tower closes the measurement/ownership gap in root cause RC1. Goal: bring lead time under 50 days within two quarters, then down to 45."
    }
  };
}


/** İkinci örnek vaka: antrepo GDA stok uyum problemi (gerçek bir doğrulama
 * setinden damıtılmıştır; kişi adları rollerle, kuruma özgü sistem adları
 * jenerik karşılıklarıyla değiştirilmiştir). */
export function exampleCase2() {
  return {
    name: 'Örnek Çalışma 2 — GDA Stok Uyumu',
    mode: 'full',
    triage: { cost: 'yuksek', benefit: 'yuksek', urgency: 'yuksek' },
    timing: {
      reversal: 'yuksek',
      window: 'Gümrük denetim dönemi öncesi kalıcı kontroller devrede olmalı; her geçen ay ~1.850 adet yeni uyumsuzluk birikiyor.',
      stopSignal: 'Kök nedenler bulgularla doğrulanıp zorunlu GDA kontrol noktası pilotu test edildiğinde bilgi toplamayı bırakıp kararı uygula.'
    },
    problem: {
      statement: "Antrepo operasyonlarında GDA (gümrük denetimindeki alan) stok uyumu hedefi sıfır uyumsuzluk olmasına rağmen, WMS geçişi sonrasında aylık ortalama 1.850 adet üründe beyanname-stok uyumsuzluğu (GDA fazlası/eksiği) tespit edilmektedir. Uyumsuzluklar gümrük uyum riski doğurmakta; tek bir barkodun analizi 45 dakika sürmekte ve düzeltme çalışmaları operasyonu yavaşlatmaktadır.",
      geo: "İki antrepo tesisi (A ve B); en yüksek yoğunluk çift WMS kullanılan A tesisinde",
      time: "WMS (Faz-2) geçişinden bu yana — 2026 Q1–Q3",
      brand: "Çoklu beyannameli ve asortili ürünlerde yoğun; açık adet ürünlerde seyrek",
      kpiName: "GDA uyumsuz stok (adet/ay)", target: "0", actual: "1850",
      direction: "dusuk", unit: "adet", targetHigh: ""
    },
    drivers: [
      { name: "Depo operasyon yürütmesi (toplama, adresleme, sorter)", note: "Operatör hataları, statü takibi ve istisna ürün yönetimi; antrepo yönetimi ile yürür." },
      { name: "WMS ve entegrasyon mimarisi", note: "Çift WMS yapısı, GDA sayacı, entegrasyon job'ları ve izleme/alarm mekanizmaları; IT ile yürür." },
      { name: "İthalat / gümrük süreci", note: "Dosya-beyanname ilişkisi, sevk onayı, redrese ve Tareks statüleri; ithalat ekibi ve YGM ile yürür." },
      { name: "Üretici / tedarik kalitesi", note: "Koli içi iç barkod ve asorti doğruluğu, menşei ülke kontrolleri; tedarik zinciri ile yürür." },
      { name: "Organizasyon ve yönetişim", note: "Süreç/domain sahipliği, kadrolar (takım lideri, eğitmen), önceliklendirme; üst yönetim ile yürür." }
    ],
    driverAnalysis: [
      { driver: "WMS ve entegrasyon", component: "Çift WMS arasındaki senkronizasyon job'ları", issue: "Job'lar zaman zaman (2 günde bir) çalışmıyor; izleme ve alarm olmadığından adres stoğu sistemsel çoğalıyor." },
      { driver: "Depo operasyonu", component: "El terminali toplama kontrolü", issue: "GDA'sı sıfırlanan/rezervesi olmaması gereken ürünler terminalde görünmüyor; sistem toplamaya izin veriyor." },
      { driver: "İthalat / gümrük", component: "Dosya-beyanname ilişkilendirme", issue: "Sistem dosya adedinden fazla adede ilişki kurmaya izin veriyor; GDA kalan adedi ekranda görünmüyor." },
      { driver: "Üretici / tedarik", component: "Koli içi iç barkod doğruluğu", issue: "Asorti barkodu doğru, koli içi iç barkodlar hatalı gelebiliyor; menşei ülkede doğrulama sistemi yok." }
    ],
    sipoc: [
      { s: "Üretici", i: "Koliler, asorti/iç barkodlar, çeki listesi", p: "Yükleme ve menşei ülke çıkış kontrolü", o: "Doğru barkodlu, beyana uygun koli", c: "Antrepo ürün kabul" },
      { s: "İthalat ekibi / YGM", i: "Beyanname, dosya, GDA sayacı", p: "Dosya-beyanname ilişkilendirme ve sevk onayı", o: "GDA'ya uygun sevk kararı", c: "Depo operasyonu / müşteri" },
      { s: "IT / entegrasyon", i: "WMS-gümrük sistemi hareket verisi", p: "Sayaç ve stok senkronizasyonu", o: "Tutarlı envanter-beyanname kaydı", c: "Operasyon, uyum ve stok ekipleri" }
    ],
    findings: [
      { text: "Operatör kaynaklı toplama/adresleme hataları (fazla/eksik/yanlış ürün) aylık ~620 adet uyumsuzluk üretiyor.", evidence: "Aylık hata kayıtları + sorter reject verisi, son 3 ay", share: "620" },
      { text: "Çift WMS entegrasyon job'larının izlenmeden durması aylık ~430 adet sistemsel stok çoğalması/uyuşmazlığı yaratıyor.", evidence: "Entegrasyon hata logları ve stok mutabakat kayıtları", share: "430" },
      { text: "Çoklu beyannameli ürünlerde hatalı dosya-beyanname eşleştirmesi aylık ~380 adet GDA fazlası oluşturuyor.", evidence: "GDA raporu ile beyanname kalemlerinin manuel karşılaştırması (barkod başına 45 dk)", share: "380" },
      { text: "Üretici kaynaklı koli içi iç barkod/asorti hataları aylık ~170 adet uyumsuzluk olarak ürün kabule yansıyor.", evidence: "Ürün kabul tutanakları ve şahit numune kontrol kayıtları", share: "170" }
    ],
    whys: [
      "GDA onayı tamamlanmadan stok oluşturulup rezerveye ve sevke konu olabiliyor; sistem bunu engellemiyor.",
      "WMS'te GDA kontrolü zorunlu bir kontrol noktası olarak tasarlanmamış; karantina/ayrıştırma mekanizması yok.",
      "Sistem yalnızca operasyon ihtiyacına göre geliştirilmiş; GDA analiz gereksinimleri tasarıma hiç dahil edilmemiş.",
      "GDA uyum çalışması etkin proje yönetişimi ve önceliklendirmeyle yönetilmemiş; gereksinimler netleşmeden dedike ekip başka projelere kaydırılmış.",
      "Uçtan uca süreç sahipliği ve fonksiyonlar arası yönetişim kurulmamış; her ekip (IT, ithalat, operasyon, uyum) yalnızca kendi adımına bakmış."
    ],
    whyChains: [
      {
        label: "Dal: operatör hataları neden bu kadar yüksek?",
        whys: [
          "Eğitim/farkındalık eksik; turnover yüksek, kişi bazlı performans geri bildirimi yok.",
          "Takım lideri ve operasyon eğitmeni kadroları boş; yetkin aday havuzu yetersiz.",
          "Örgüt şeması ihtiyacı karşılamıyor; ek kadro tanımlanamadı.",
          "Organizasyon ve İK arasında örgüt şeması konusunda üst yönetim hizalanması yapılamadı.",
          ""
        ]
      },
      {
        label: "Dal: üretici kaynaklı hatalar neden depoya kadar geliyor?",
        whys: [
          "Koli içi iç barkod ve asorti dağılımı hatalı gelebiliyor; ürün kabul kontrolü yakalayamıyor.",
          "Menşei ülkede yükleme öncesi doğrulama/early-warning sistemi yok; şahit numune sıklığı yetersiz.",
          "Kaynakta (üretici tarafında) önleyici kalite güvence sistemi hiç kurulmamış.",
          "", ""
        ]
      }
    ],
    fishbone: {
      insan: "GDA eğitimi ve risk farkındalığı eksik; takım lideri/eğitmen kadroları boş; turnover ve multiskill zorunluluğu hata üretiyor.",
      metot: "Uçtan uca süreç, RACI ve SLA tanımsız; karantina, redrese, transfer ve palet otel istisna süreçleri tasarlanmamış.",
      sistem: "GDA onayı zorunlu değil; el terminali GDA'sı sıfır ürünü gösteriyor; çift WMS job'ları izlenmiyor; barkod bazlı GDA takibi yok.",
      girdi: "Üreticiden koli içi iç barkod/asorti hatalı gelebiliyor; menşei ülke doğrulaması ve yeterli şahit numune yok.",
      olcum: "Uçtan uca hatalı ürün raporu/panosu yok; sayaç-beyanname karşılaştırması manuel (barkod başına 45 dk).",
      cevre: "Tarım/Tareks gibi bakanlık süreçleri uzun sürüyor; yasak ülke kararları ve mevzuat değişimleri statüleri karmaşıklaştırıyor."
    },
    rootCauses: [
      {
        text: "Uçtan uca GDA süreç tasarımı ve yönetişimi yok: kontrol noktaları, RACI, SLA ve istisna süreçleri (karantina, redrese, transfer) tanımlanmamış.",
        principles: [2, 11], competency: "Uçtan uca süreç tasarımı ve 'önemli olanı ölç' disiplini",
        status: "dogrulandi", findings: [0, 2],
        evidence: "Süreç dokümantasyonu tarandı: GDA kontrolü tamamlanmadan stok oluşturulmasını engelleyen hiçbir süreç standardı, RACI ya da SLA kaydı yok.",
        explainsSpec: "Evet — tasarımsızlık her tesiste var; uyumsuzluğun çoklu beyannameli ürünlerde yoğunlaşmasını KN2 ve KN3 ile birlikte açıklıyor.",
        testPlan: "Uçtan uca süreç çizilip kontrol noktaları tanımlandığında operatör ve eşleştirme kaynaklı uyumsuzluğun düşmesi beklenir.",
        testResult: "",
        kpiExpected: "B1+B3 kaynaklı uyumsuzlukta belirgin azalma"
      },
      {
        text: "Önleyici kontrol (poka-yoke) tasarlanmamış: GDA onayı zorunlu değil, karantina mekanizması yok, el terminali GDA'sı sıfır ürünün toplanmasına izin veriyor.",
        principles: [11, 7], competency: "Hata önleyici sistem tasarımı (poka-yoke) yetkinliği",
        status: "dogrulandi", findings: [0],
        evidence: "Sistem incelemesi: WMS'te GDA onayı iş kuralı olarak tanımlı değil; GDA'sı sıfırlanan ürünler terminalde görünmüyor ve toplama engellenmiyor — canlıda doğrulandı.",
        explainsSpec: "Evet — kontrolün olmadığı her akışta hata oluşabiliyor; açık adet ürünlerde az görülmesi eşleştirme karmaşıklığının düşüklüğüyle tutarlı.",
        testPlan: "Zorunlu GDA kontrol noktası pilotu: onaysız stok oluşturma/rezerve denemelerinin sistemce bloklanma oranı izlenir.",
        testResult: "",
        kpiExpected: "Operatör kaynaklı uyumsuzluk (B1) 620 → 200 adet/ay altına"
      },
      {
        text: "Ana veri ve entegrasyon mimarisi eksik tasarlanmış: çift WMS yapısı, senkronizasyon-izleme-alarm mekanizması ve barkod bazlı GDA-envanter bağı yok.",
        principles: [11], competency: "Kurumsal entegrasyon yönetimi (izleme, alarm, mutabakat)",
        status: "destekleniyor", findings: [1, 2],
        evidence: "Entegrasyon logları: job'lar ortalama 2 günde bir sessizce duruyor; hiçbir alarm üretilmiyor. GDA raporunda barkod bağı olmadığından tek barkod analizi 45 dk sürüyor.",
        explainsSpec: "Evet — çift WMS kullanılan A tesisinde yoğunlaşmayı doğrudan açıklıyor.",
        testPlan: "Job izleme + alarm devreye alınıp bir ay izlenir; sistemsel çoğalma adedinin düşmesi beklenir.",
        testResult: "",
        kpiExpected: "Entegrasyon kaynaklı uyumsuzluk (B2) 430 → 100 adet/ay altına"
      },
      {
        text: "Fonksiyonlar arası yönetişim ve organizasyon eksik: GDA'nın süreç/domain sahibi yok; takım lideri ve eğitmen kadroları üst yönetim hizalanması yapılamadığı için boş.",
        principles: [4, 9], competency: "Fonksiyonlar arası yönetişim kurma ve örgütsel kabiliyet planlama",
        status: "destekleniyor", findings: [0],
        evidence: "Organizasyon şeması ve kadro kayıtları: GDA sorumlusu head-count yok; iki tesiste takım lideri ve operasyon eğitmeni pozisyonları açık; ortak karar yapısı kurulmamış.",
        explainsSpec: "Kısmen — sahipsizlik her yerde aynı; tek başına dağılımı açıklamaz, KN1-KN3 ile birlikte açıklar.",
        testPlan: "GDA Program Ofisi ve tek yönetici sahip atandıktan sonra aksiyon kapanma hızının ve tekrarlayan hataların izlenmesi.",
        testResult: "",
        kpiExpected: "Aksiyon kapanma süresi ve tekrarlayan hata oranında ölçülebilir düşüş"
      },
      {
        text: "Kurumsal talep ve proje yönetişimi eksikliği: GDA Faz-2 önceliklendirilmedi, kaynak ve risk planında GDA yer almadı, dedike ekip dağıtıldı.",
        principles: [0, 1], competency: "Proje yönetişimi, kaynak ve risk planlama",
        status: "hipotez", findings: [1],
        evidence: "Proje kayıtları: Faz-2 gereksinimleri netleşmeden dedike geliştirme ekibi başka projelere kaydırılmış; risk planında GDA maddesi bulunmuyor.",
        explainsSpec: "Evet — uyumsuzluğun Faz-2 geçişi sonrasında başlaması bu kökle zaman olarak örtüşüyor.",
        testPlan: "Faz-2 tek yol haritasında yeniden başlatılıp haftalık yönlendirme komitesiyle izlendiğinde geliştirme teslimatlarının hızlanması beklenir.",
        testResult: "",
        kpiExpected: "Kritik IT taleplerinin teslim süresinde kısalma; B2 ve B3'te dolaylı azalma"
      },
      {
        text: "Kaynakta (üretici tarafında) kalite güvence sistemi yok: menşei ülke doğrulaması, early-warning/RFID ve yeterli şahit numune kontrolü kurulmamış.",
        principles: [7, 9], competency: "Tedarikçi kalite güvence sistemi kurma",
        status: "hipotez", findings: [3],
        evidence: "Ürün kabul tutanakları: iç barkod/asorti hataları düzenli tekrar ediyor; üreticiye tanımlı bir GDA süreci, kontrol noktası ya da RACI bulunamadı.",
        explainsSpec: "Kısmen — üretici hatası tüm tesislere aynı oranda yansıyor; tesis kırılımını değil B4 payını açıklıyor.",
        testPlan: "Hata oranı yüksek üreticilerde QC sıklaştırma pilotu; ürün kabulde yakalanan hata adedinin değişimi izlenir.",
        testResult: "",
        kpiExpected: "Üretici kaynaklı uyumsuzluk (B4) 170 → 60 adet/ay altına"
      }
    ],
    alternatives: [
      { name: "GDA Program Ofisi: tek yönetici sahip, fonksiyonlar arası yönetişim ve haftalık yönlendirme komitesi", method: "Sistem düşüncesi", note: "IT, ithalat, operasyon, uyum ve stok ekiplerini tek yönetişim altında toplar; sahiplik dağınıklığını kökten çözer. Düşük maliyet, üst yönetim kararı gerektirir." },
      { name: "WMS'e önleyici kontroller paketi: zorunlu GDA onay noktası, otomatik karantina, sayaç-beyanname otomatik mutabakatı, barkod bazlı GDA raporu", method: "Algoritmik düşünce", note: "Hataları oluşmadan engeller (poka-yoke); IT geliştirme kapasitesi ve Faz-2 önceliklendirmesi gerektirir." },
      { name: "RFID ve dijital izlenebilirlik yatırımı: statü takibi otomasyonu, menşei ülke yükleme doğrulaması", method: "Best practice adaptasyonu", note: "Manuel takibi kökten kaldırır; yüksek yatırım ve uzun devreye alma süresi (12+ ay), orta vadeli." }
    ],
    criteria: [
      { name: "Etki (uyumsuzluğu azaltma potansiyeli)", weight: "40", yon: "yuksek", d1: "Uyumsuzluğu %10'dan az azaltır", d3: "Uyumsuzluğu yarıya indirir", d5: "Uyumsuzluğu %80+ azaltır", source: "Bulgu payları (B1-B4) ve kök neden beklenen etkileri" },
      { name: "Uygulama hızı", weight: "25", yon: "yuksek", d1: "12+ ay (yatırım projesi)", d3: "1 çeyrekte devrede", d5: "1 ay içinde devrede", source: "IT yol haritası ve kadro planı" },
      { name: "Maliyet / kaynak ihtiyacı", weight: "20", yon: "dusuk", d1: "Büyük yatırım (donanım + altyapı)", d3: "Belirgin IT geliştirme eforu", d5: "Mevcut kadroyla, ek bütçesiz", source: "Kaba efor tahmini (IT + PMO)" },
      { name: "Gümrük uyum riskini düşürme", weight: "15", yon: "yuksek", d1: "Riski dolaylı etkiler", d3: "Riskin bir bölümünü kapatır", d5: "Riski doğrudan ve kalıcı kapatır", source: "Uyum ekibi risk değerlendirmesi" }
    ],
    scores: { '0_0': '4', '0_1': '4', '0_2': '4', '0_3': '4', '1_0': '5', '1_1': '3', '1_2': '3', '1_3': '5', '2_0': '4', '2_1': '1', '2_2': '1', '2_3': '4' },
    decision: {
      choice: "A1 ve A2 birlikte uygulanır: GDA Program Ofisi ve tek yönetici sahip hemen atanır; önleyici kontroller paketi, yeniden başlatılan Faz-2 yol haritasının ilk teslimatı olarak devreye alınır. A3 (RFID) orta vadeli yatırım olarak planlanır.",
      rationale: "Matris A1 ile A2'yi başa baş gösteriyor ve sonuç 'uygulama hızı' kriterine duyarlı — bu tam da iki alternatifin birbirini tamamladığının işareti: yönetişim (A1) olmadan kontroller paketi (A2) önceliklendirilemiyor; kontroller olmadan yönetişim hatayı fiziksel olarak engelleyemiyor. Karar KN1-KN5'i birlikte adresler; KN6 (üretici) için tedarik tarafı aksiyonu ayrıca yürütülür. Hedef: aylık uyumsuzluğu 2 çeyrekte 500 adedin altına, ardından sıfıra indirmek.",
      secondOrder: "Zorunlu GDA kontrol noktası ilk aylarda toplama/sevk hızını düşürür → yoğun dönemde operasyon bypass baskısı oluşur (FMEA'da adreslendi: bypass loglama). Program Ofisi'nin yaptırım gücü diğer projelerin kaynağını çekebilir → PMO ile tek yol haritasında çakışma yönetimi gerekir. Kontroller devreye girince mevcut kirli stokun temizliği ayrı bir iş yükü olarak ortaya çıkar — geçiş planına dahil edildi.",
      outsideView: "Kurumdaki önceki WMS geçişi de plandan ~2 kat uzun sürmüştü; sektörde entegrasyon programlarının çoğunluğu ilk terminini aşıyor. Bu yüzden Faz-2 teslimat hedefi tek seferde değil, aylık ara teslimatlarla planlandı ve KPI hedefi 2 çeyreğe yayıldı.",
      redTeam: "⚑ Karar, IT kapasitesinin açılacağı varsayımına yaslanıyor: A2'nin tamamı Faz-2 geliştirmesine bağlı; KN5 (proje yönetişimi eksikliği) hâlâ hipotez durumunda — aynı örgütsel dinamik yol haritasını yine kaydırabilir. Gereken kanıt: yönlendirme komitesinin ilk 4 haftada kaynak tahsisini yazılı taahhüde bağlaması.\n\nMatris A1 ile A2'yi başa baş gösteriyor ve sonuç tek kritere duyarlı: 'birlikte uygulama' kararı matristen değil yorumdan geliyor; iki programı aynı anda yürütecek yönetim kapasitesi sorgulanmadı. Gereken kanıt: iki iş akışının tek program planında çakışmasız gösterilmesi.\n\nB4 (üretici kaynaklı 170 adet/ay) bu kararla hiç azalmıyor; 'ayrıca yürütülür' denilen tedarik aksiyonu sahipsiz kalırsa sıfır hedefi yapısal olarak imkânsız. Gereken kanıt: tedarik kalite aksiyonunun ayrı sahip ve terminle plana bağlanması.",
      redTeamReply: "İlk itiraz haklı ve tetik çizgisine bağlandı: kaynak taahhüdü 4 hafta içinde yazılı hale gelmezse yönlendirme komitesi eskalasyon uygular. İkinci itiraz için A1 ve A2 tek program planında birleştirildi ve Program Ofisi'nin ilk çıktısı bu çakışma analizi olacak. Üçüncü itiraz kabul edildi: B4 için tedarik zinciri kalite aksiyonu (8. aksiyon) ayrı sahip ve terminle plana eklendi; sıfır hedefi bu aksiyonun kapanmasına bağlı."
    },
    tripwires: [
      { condition: "Aylık uyumsuzluk 2 ay üst üste 1.500 adedin altına inmezse", response: "Yönlendirme komitesi kapsamı daraltır: yalnız çoklu beyannameli ürün akışına odaklanılır ve A3 (RFID) fizibilitesi öne çekilir.", checkDate: "2026-10-15", status: "" },
      { condition: "Zorunlu GDA kontrolü bypass oranı haftalık %5'i aşarsa", response: "Operasyon durdurma yetkisi devreye girer; bypass gerektiren istisna akışlar 1 hafta içinde sistemde tanımlanır.", checkDate: "2026-09-15", status: "" }
    ],
    thinking: {
      assume: "Hataların çoğunun operatörden kaynaklandığını varsayıyorduk; barkod bazlı analiz önemli bir bölümün sistem/entegrasyon kaynaklı olduğunu gösterdi. İkinci varsayım: sayaç bozulmaları nadirdir — hareket geçmişi analiziyle test edilmeli.",
      alt: "Uyumsuzluk operatör hatası değil, çift WMS senkron kayıplarının birikimi olabilir; ya da üretici kaynaklı iç barkod hataları ürün kabulde görünmezleşiyor olabilir. İkisi de kırılım bazında ölçülmeli.",
      cost: "Önleyici kontroller kurulmazsa bedeli gümrük uyum riski ve olası cezalar olarak şirket öder; kurulursa ilk aylarda ek kontrol adımları nedeniyle operasyon hızından feragat edilir — bu bedeli operasyon ekibi öder."
    },
    spec: {
      nerede: { v: "Antrepo tesisleri; en yoğun çift WMS kullanılan A tesisi", y: "GDA'ya konu olmayan milli depo operasyonları" },
      zaman: { v: "WMS Faz-2 geçişinden bu yana (2026 Q1+)", y: "Geçiş öncesi dönem — hatalar manuel süreçle sınırlı ve düşüktü" },
      kirilim: { v: "Çoklu beyannameli ve asortili ürünler", y: "Tek beyannameli açık adet ürünler" },
      buyukluk: { v: "Aylık ~1.850 adet; tek barkod analizi 45 dk", y: "Hiçbir ayda sıfır uyumsuzluk görülmüyor" },
      degisiklik: "Faz-2 geçişiyle çift WMS yapısına geçildi ve GDA kontrolleri devreye alınmadan canlıya çıkıldı; gereksinimler netleşmeden dedike IT ekibi başka projelere kaydırıldı."
    },
    containment: {
      action: "Sevk onayı öncesi kritik dosyalarda manuel sayaç-beyanname karşılaştırması + GDA'sı sıfır ürünlerin haftalık taranıp ayrı depo koduna çekilmesi",
      owner: "Antrepo yönetimi + uyum ekibi",
      until: "Zorunlu GDA kontrol noktası ve tek WMS entegrasyonu devreye girene kadar",
      removed: false
    },
    precheck: { p1: true, p2: true, p3: false },
    fmea: [
      { mode: "Program Ofisi kurulur ama yaptırım gücü olmaz", effect: "Kararlar yine ekipler arasında sürüncemede kalır", cause: "Yönetici sahibe eskalasyon/veto yetkisi tanımlanmaz", s: "8", o: "5", d: "4", onlem: "Yönetici sahibe yazılı eskalasyon ve operasyon durdurma yetkisi tanımlanması" },
      { mode: "Zorunlu GDA kontrolü operasyonu yavaşlatınca bypass edilir", effect: "Kontrol kâğıt üzerinde kalır, uyumsuzluk sürer", cause: "Yoğun dönemde hız baskısı", s: "7", o: "5", d: "3", onlem: "Bypass işlemlerinin loglanıp haftalık yönlendirme komitesine raporlanması" }
    ],
    forcefield: {
      driving: [
        { text: "Gümrük uyum ve ceza riski baskısı", strength: "5" },
        { text: "Üst yönetim görünürlüğü (yönetici özeti gündemi)", strength: "4" },
        { text: "Operasyonun manuel düzeltme yükünden kurtulma isteği", strength: "3" }
      ],
      restraining: [
        { text: "IT kaynak darlığı ve rakip proje öncelikleri", strength: "4", azaltma: "Faz-2'nin tek yol haritasında üst yönetim kararıyla önceliklendirilmesi" },
        { text: "Ek kontrol adımlarının operasyonu yavaşlatma endişesi", strength: "3", azaltma: "Kontrollerin akışa gömülmesi ve otomasyonla hızlandırılması" },
        { text: "Ekiplerin mevcut çalışma alışkanlıkları", strength: "2", azaltma: "Eğitim programı ve one-point-lesson uygulamaları" }
      ]
    },
    actions: [
      { text: "Hatalı dosya ilişkilerinin IT ile birlikte düzeltilmesi; GDA raporuna barkod bağı eklenerek hatalı ürün adedinin net tespiti", owner: "Stok yönetimi + IT geliştirme", startDate: "2026-07-01", dueDate: "2026-08-15", due: "", etki: "4", efor: "3", status: "devam", rcIdx: "2", findingIdx: "2", successCriteria: "Uyumsuz barkod listesi sıfırlanır; GDA raporu barkod bazında bakiye gösterir", evidence: "", delayReason: "", priority: "yuksek" },
      { text: "GDA Program Ofisi kurulması ve tek yönetici sahip atanması; haftalık yönlendirme komitesinin başlatılması", owner: "Üst yönetim", startDate: "2026-08-05", dueDate: "2026-09-01", due: "", etki: "5", efor: "2", status: "bekliyor", rcIdx: "3", findingIdx: "0", successCriteria: "Yönetici sahip atanır; komite 4 hafta üst üste toplanır", evidence: "", delayReason: "", priority: "yuksek" },
      { text: "WMS'te zorunlu GDA onay kontrol noktası ve otomatik karantina iş kuralının devreye alınması (IT talebi)", owner: "İthalat sistem sorumlusu + IT", startDate: "2026-08-05", dueDate: "2026-09-01", due: "", etki: "5", efor: "3", status: "devam", rcIdx: "1", findingIdx: "0", successCriteria: "GDA onayı olmadan stok oluşturulamaz ve rezerve edilemez", evidence: "", delayReason: "", priority: "yuksek" },
      { text: "Çift WMS entegrasyonunun teke indirilmesi; senkronizasyon izleme ve alarm mekanizmasının kurulması", owner: "IT mimari ekibi", startDate: "2026-08-10", dueDate: "2026-10-01", due: "", etki: "5", efor: "4", status: "bekliyor", rcIdx: "2", findingIdx: "1", successCriteria: "Job duruşları 15 dk içinde alarma dönüşür; sistemsel çoğalma sıfırlanır", evidence: "", delayReason: "", priority: "yuksek" },
      { text: "Uçtan uca GDA işletim modelinin tasarlanması: süreç, RACI, SLA ve istisna süreçleri (karantina, redrese, transfer, palet otel)", owner: "Kurumsal süreç yönetimi", startDate: "2026-08-10", dueDate: "2026-09-15", due: "", etki: "4", efor: "3", status: "bekliyor", rcIdx: "0", findingIdx: "0", successCriteria: "Onaylı süreç dokümanı + RACI + SLA yayınlanır ve iki tesiste uygulanır", evidence: "", delayReason: "", priority: "orta" },
      { text: "GDA Faz-2 geliştirme taleplerinin tek yol haritasında toplanması, önceliklendirilmesi ve haftalık takibi", owner: "PMO + lojistik sistem sorumlusu", startDate: "2026-08-05", dueDate: "2026-08-20", due: "", etki: "4", efor: "2", status: "devam", rcIdx: "4", findingIdx: "1", successCriteria: "Tüm kritik talepler tek yol haritasında; ilk teslimat tarihi kesinleşir", evidence: "", delayReason: "", priority: "yuksek" },
      { text: "Tüm antrepolarda GDA eğitim programı: işbaşı eğitimi, one-point-lesson, eğitim kayıtları ve pozitif disiplin takibi", owner: "İK + akademi + operasyon", startDate: "2026-08-15", dueDate: "2026-09-15", due: "", etki: "3", efor: "2", status: "bekliyor", rcIdx: "3", findingIdx: "0", successCriteria: "Tüm depo personeli eğitimi tamamlar; kayıtlar imzalı tutulur", evidence: "", delayReason: "", priority: "orta" },
      { text: "Hata oranı yüksek üreticilerde QC sıklaştırma ve reklamasyon süreci; üretici GDA eğitimleri", owner: "Tedarik zinciri kalite", startDate: "2026-09-01", dueDate: "2026-10-15", due: "", etki: "3", efor: "3", status: "bekliyor", rcIdx: "5", findingIdx: "3", successCriteria: "Üretici bazlı hata panosu kurulur; en kötü 5 üreticide plan devrede", evidence: "", delayReason: "", priority: "orta" }
    ],
    tracking: [
      { label: "Temmuz (baz)", value: "1850" }
    ],
    retro: { valid: "", worked: "", lessons: "" }
  };
}

/** "+ Yeni" ekranındaki vaka şablonları — blankCase üzerine uygulanan kısmi ön dolgular. */
export const CASE_TEMPLATES = [
  {
    key: 'bos', ad: 'Boş çalışma', desc: 'Hiçbir ön dolgu yok; her alanı kendiniz yazarsınız.',
    fill: null
  },
  {
    key: 'operasyon', ad: 'Operasyonel sapma', desc: 'Süre, verimlilik ya da maliyet KPI\'ında hedeften sapma (üretim, lojistik, hizmet operasyonu).',
    fill: {
      problem: { kpiName: 'Süreç süresi / verimlilik KPI\'ı' },
      drivers: [
        { name: 'Süreç adımları ve el değiştirmeler', note: 'Hangi adımda bekleme/tekrar var? İşi yapanlarla ve süreç metrikleriyle doğrulayın.' },
        { name: 'Girdi kalitesi', note: 'Sürece giren malzeme/veri/evrak ilk seferde doğru mu? SIPOC ile inceleyin.' },
        { name: 'Kapasite ve kaynak planlama', note: 'Darboğaz kaynak hangisi; talep dalgalanmasıyla uyumlu mu?' },
        { name: 'Dış paydaş performansı', note: 'Tedarikçi/taşeron/servis sağlayıcı adımları — ama kök nedeni önce kendi sürecinizde arayın.' }
      ]
    }
  },
  {
    key: 'musteri', ad: 'Müşteri şikâyeti / memnuniyet düşüşü', desc: 'Şikâyet adedi, NPS ya da memnuniyet skorunda bozulma.',
    fill: {
      problem: { kpiName: 'Şikâyet adedi / NPS' },
      drivers: [
        { name: 'Ürün / hizmet kalitesi', note: 'Şikâyet kategorilerine kırın; en büyük iki kategori neyi işaret ediyor?' },
        { name: 'Hizmet ve çözüm süreci', note: 'İlk temas çözüm oranı, çözüm süresi, tekrar arama oranı.' },
        { name: 'İletişim ve beklenti yönetimi', note: 'Vaat edilen ile yaşatılan arasındaki fark; bilgilendirme anları.' },
        { name: 'Fiyat / değer algısı', note: 'Rakip karşılaştırması ve segment bazlı algı — varsayım değil veri.' }
      ],
      criteria: [
        { name: 'Etki (şikâyeti azaltma potansiyeli)', weight: '35' },
        { name: 'Uygulama hızı', weight: '25' },
        { name: 'Maliyet / kaynak ihtiyacı', weight: '20' },
        { name: 'Müşteri deneyimi riski', weight: '20' }
      ]
    }
  },
  {
    key: 'proje', ad: 'Proje gecikmesi', desc: 'Kilometre taşı ya da teslim tarihinde plandan sapma.',
    fill: {
      problem: { kpiName: 'Plandan sapma (gün)' },
      drivers: [
        { name: 'Kapsam netliği ve değişiklikler', note: 'Kapsam ne kadar değişti; değişiklik talepleri nasıl yönetiliyor?' },
        { name: 'Kaynak planlama ve tahsis', note: 'Kritik yol üzerindeki işlerde kaynak çakışması var mı?' },
        { name: 'Bağımlılıklar ve paydaşlar', note: 'Dış bağımlılıklar (onay, tedarik, başka ekip) planda görünür mü?' },
        { name: 'Karar ve onay süreçleri', note: 'Kararlar kaç günde alınıyor; bekleyen karar sayısı.' }
      ]
    }
  },
  {
    key: 'kalite', ad: 'Kalite problemi / hata oranı', desc: 'Hata, iade, yeniden işleme ya da fire oranında artış.',
    fill: {
      problem: { kpiName: 'Hata oranı (%)' },
      drivers: [
        { name: 'Girdi / malzeme kalitesi', note: 'Girdi partileriyle hata oranı korelasyonu; SIPOC ile inceleyin.' },
        { name: 'Yöntem ve standart iş', note: 'Standart tanımlı mı, güncel mi, gerçekten uygulanıyor mu (Gemba)?' },
        { name: 'Ekipman / sistem', note: 'Bakım kayıtları, kalibrasyon, sistem kaynaklı hatalar.' },
        { name: 'İnsan / yetkinlik', note: 'Eğitim ve deneyim kırılımında hata dağılımı — kişiyi değil sistemi sorgulayın.' },
        { name: 'Ölçüm sistemi', note: 'Hata tanımı net mi; ölçüm kendisi güvenilir mi?' }
      ]
    }
  }
];

export const STEPS = [
  { title: 'Problem Tanımı', sub: 'Problem ifadesi + kapsam + KPI farkı', desc: '"Ne oldu?" sorusunun cevabını, sapmanın hangi kırılımda oluştuğunu ve ölçülmüş KPI farkını netleştirin. Çözüm ve neden bu adıma girmez.' },
  { title: 'İş Sürücüsü Haritalama', sub: 'Ana etkenler ve süreçler', desc: 'Sonucu sürükleyen ana iş sürücülerini (business driver) ve ilgili süreçleri haritalayın. İşi yapanlara sorun, mümkünse yerinde gözlem yapın.' },
  { title: 'İş Sürücüsü Analizi', sub: 'Alt bileşenler + SIPOC', desc: 'Etkisi en büyük iş sürücülerinin hangi alt bileşeninde sorun olduğunu, SIPOC (tedarikçi-girdi-süreç-çıktı-müşteri) analiziyle girdi kalitesini de kontrol ederek belirleyin.' },
  { title: 'Problem Bulguları', sub: 'Veriye dayalı sapmalar', desc: 'Varsayımları bırakıp veriye dayalı, ölçülmüş ve doğrulanmış spesifik sapmaları (alt problemleri) ortaya koyun.' },
  { title: 'Kök Neden Analizi', sub: '5 Neden + kılçık + prensipler', desc: 'Sapmaların neden oluştuğunu 5 Neden ve balık kılçığı ile analiz edin; kök nedeni dışarıda değil önce kendi yetkinlik ve prensiplerimizdeki gelişim alanlarında arayın.' },
  { title: 'Karşı Önlemler ve Karar', sub: 'Alternatifler + karar matrisi', desc: 'Doğru düşünme yöntemleriyle alternatif çözümler üretin, karar kriterlerine göre yarıştırın ve akıl yürüterek en doğru çözümü önerin.' },
  { title: 'İzleme ve Retrospektif', sub: 'Aksiyon durumu + KPI trendi', desc: "Döngüyü kapatın: aksiyonların ilerlemesini ve KPI'ın hedefe kapanışını izleyin; kök neden ve karşı önlem doğru muydu — retrospektifle değerlendirin." },
  { title: 'Çalışma Raporu', sub: 'Özet + yazdır / PDF', desc: 'Tüm çalışmanız tek bir raporda derlendi. İsterseniz YZ ile yönetici özeti ekleyin, ardından yazdırın ya da PDF olarak kaydedip paydaşlarınızla paylaşın.' }
];

export const AGENT_TITLES = [
  'Problem Tanımlama Koçu', 'İş Sürücüsü Haritalama Uzmanı', 'Süreç Analizi Uzmanı (SIPOC)', 'Bulgu Doğrulama Uzmanı',
  'Kök Neden Analizi Koçu', 'Karar Analizi Uzmanı', 'İzleme ve Retrospektif Koçu', 'Rapor Editörü'
];

export const AGENT_INTROS = [
  'Probleminiz hangi alanda olursa olsun (lojistik, pazarlama, teknoloji, operasyon, İK, finans…) ifadenizi birlikte netleştirelim: çözüm ya da neden içeriyor mu, ölçülebilir mi, kapsamı doğru mu — değerlendirmemi isteyin ya da soru sorun.',
  'İş sürücüsü haritanızı eksiksizlik (MECE — birbirini dışlayan, bütünü kapsayan) açısından değerlendirir, gözden kaçmış olabilecek etkenleri ve kime ne sormanız gerektiğini öneririm.',
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

// ---- İngilizce arayüz varyantları -------------------------------------------
// Veri şeması (key'ler) iki dilde de aynıdır; yalnız görünen metinler değişir.

export const STEPS_EN = [
  { title: 'Problem Definition', sub: 'Problem statement + scope + KPI gap', desc: 'Clarify the answer to "What happened?", which segment the deviation occurs in, and the measured KPI gap. Solutions and causes do not belong in this step.' },
  { title: 'Business Driver Mapping', sub: 'Key drivers and processes', desc: 'Map the main business drivers behind the outcome and the related processes. Ask the people doing the work; observe on site if possible.' },
  { title: 'Business Driver Analysis', sub: 'Subcomponents + SIPOC', desc: 'Determine which subcomponent of the highest-impact drivers is failing, checking input quality with a SIPOC (supplier-input-process-output-customer) analysis.' },
  { title: 'Problem Findings', sub: 'Data-based deviations', desc: 'Drop the assumptions and lay out specific, measured and verified deviations (sub-problems) based on data.' },
  { title: 'Root Cause Analysis', sub: '5 Whys + fishbone + principles', desc: 'Analyze why the deviations occur with 5 Whys and a fishbone; look for the root cause first in your own competencies and principles, not outside.' },
  { title: 'Countermeasures and Decision', sub: 'Alternatives + decision matrix', desc: 'Generate alternative solutions with sound thinking methods, score them against decision criteria, and reason your way to the best solution.' },
  { title: 'Tracking and Retrospective', sub: 'Action status + KPI trend', desc: "Close the loop: track action progress and the KPI's convergence to target; were the root cause and countermeasure right — evaluate with a retrospective." },
  { title: 'Case Report', sub: 'Summary + print / PDF', desc: 'Your entire case is compiled into a single report. Optionally add an AI executive summary, then print or save as PDF and share with stakeholders.' }
];

export const AGENT_TITLES_EN = [
  'Problem Definition Coach', 'Business Driver Mapping Expert', 'Process Analysis Expert (SIPOC)', 'Finding Verification Expert',
  'Root Cause Analysis Coach', 'Decision Analysis Expert', 'Tracking and Retrospective Coach', 'Report Editor'
];

export const AGENT_INTROS_EN = [
  'Whatever your problem domain (logistics, marketing, technology, operations, HR, finance…), let\'s sharpen your statement together: does it contain a solution or a cause, is it measurable, is the scope right — ask for my assessment or ask a question.',
  'I evaluate your driver map for completeness (MECE — mutually exclusive, collectively exhaustive), and suggest drivers you may have missed and who to ask what.',
  'I review your subcomponent and SIPOC analysis and suggest which metrics and input-quality checks to look at.',
  'I audit whether your findings are measured and evidenced, and flag what is still an assumption.',
  'I check the consistency of your 5 Whys chain and help you match the root cause to company principles and competency gaps.',
  'I evaluate your alternatives, criteria and scoring, and challenge whether your decision rationale actually eliminates the root cause.',
  'I evaluate your action progress and KPI trend; I warn early if the countermeasure is not working and ask the questions that deepen your retrospective.',
  'I evaluate the overall consistency of your report, flag missing or weak sections, and give suggestions for presenting/sharing.'
];

export const FISHBONE_CATS_EN = [
  { key: 'insan', title: 'People / Skills', ph: 'Competence, training, ownership...' },
  { key: 'metot', title: 'Method / Process', ph: 'Standards, checklists, workflow...' },
  { key: 'sistem', title: 'Machine / System', ph: 'Tools, software, tracking systems...' },
  { key: 'girdi', title: 'Material / Input', ph: 'Input quality, documents, data...' },
  { key: 'olcum', title: 'Measurement', ph: 'Metrics, targets, visibility...' },
  { key: 'cevre', title: 'Environment / External', ph: 'Market, seasonality, external conditions...' }
];

export const THINKING_METHODS_EN = [
  'First-principles thinking', 'Critical thinking', 'Lateral thinking', 'Design thinking',
  'Systems thinking', 'Algorithmic thinking', 'Second-order thinking', 'Best-practice adaptation'
];

export const WHY_PLACEHOLDERS_EN = [
  'Why does the finding occur?', 'Why does that answer occur?', 'Why?', 'Why?', 'Why? (the answer closest to the root cause)'
];

export const CASE_TEMPLATES_EN = [
  {
    key: 'bos', ad: 'Blank case', desc: 'No pre-fill; you write every field yourself.',
    fill: null
  },
  {
    key: 'operasyon', ad: 'Operational deviation', desc: 'A gap from target in a time, productivity or cost KPI (manufacturing, logistics, service operations).',
    fill: {
      problem: { kpiName: 'Process time / productivity KPI' },
      drivers: [
        { name: 'Process steps and handovers', note: 'Which step has waiting/rework? Verify with the people doing the work and with process metrics.' },
        { name: 'Input quality', note: 'Do materials/data/documents enter the process right the first time? Examine with SIPOC.' },
        { name: 'Capacity and resource planning', note: 'Which resource is the bottleneck; does it match demand fluctuation?' },
        { name: 'External stakeholder performance', note: 'Supplier/subcontractor/service-provider steps — but look for the root cause in your own process first.' }
      ]
    }
  },
  {
    key: 'musteri', ad: 'Customer complaints / satisfaction drop', desc: 'Deterioration in complaint count, NPS or satisfaction score.',
    fill: {
      problem: { kpiName: 'Complaint count / NPS' },
      drivers: [
        { name: 'Product / service quality', note: 'Break complaints into categories; what do the top two categories point to?' },
        { name: 'Service and resolution process', note: 'First-contact resolution rate, resolution time, repeat-call rate.' },
        { name: 'Communication and expectation management', note: 'The gap between what is promised and what is experienced; notification moments.' },
        { name: 'Price / value perception', note: 'Competitor comparison and perception by segment — data, not assumption.' }
      ],
      criteria: [
        { name: 'Impact (potential to reduce complaints)', weight: '35' },
        { name: 'Speed of implementation', weight: '25' },
        { name: 'Cost / resource need', weight: '20' },
        { name: 'Customer experience risk', weight: '20' }
      ]
    }
  },
  {
    key: 'proje', ad: 'Project delay', desc: 'Deviation from plan on a milestone or delivery date.',
    fill: {
      problem: { kpiName: 'Deviation from plan (days)' },
      drivers: [
        { name: 'Scope clarity and changes', note: 'How much has scope changed; how are change requests managed?' },
        { name: 'Resource planning and allocation', note: 'Any resource conflicts on critical-path work?' },
        { name: 'Dependencies and stakeholders', note: 'Are external dependencies (approvals, procurement, other teams) visible in the plan?' },
        { name: 'Decision and approval processes', note: 'How many days do decisions take; how many decisions are pending?' }
      ]
    }
  },
  {
    key: 'kalite', ad: 'Quality problem / defect rate', desc: 'An increase in defects, returns, rework or scrap.',
    fill: {
      problem: { kpiName: 'Defect rate (%)' },
      drivers: [
        { name: 'Input / material quality', note: 'Correlation of defect rate with input batches; examine with SIPOC.' },
        { name: 'Method and standard work', note: 'Is the standard defined, current, and actually followed (Gemba)?' },
        { name: 'Equipment / system', note: 'Maintenance records, calibration, system-driven defects.' },
        { name: 'People / skills', note: 'Defect distribution by training and experience — question the system, not the person.' },
        { name: 'Measurement system', note: 'Is the defect definition clear; is the measurement itself reliable?' }
      ]
    }
  }
];

export const stepsFor = lang => (lang === 'en' ? STEPS_EN : STEPS);
export const agentTitlesFor = lang => (lang === 'en' ? AGENT_TITLES_EN : AGENT_TITLES);
export const agentIntrosFor = lang => (lang === 'en' ? AGENT_INTROS_EN : AGENT_INTROS);
export const fishboneCatsFor = lang => (lang === 'en' ? FISHBONE_CATS_EN : FISHBONE_CATS);
export const thinkingMethodsFor = lang => (lang === 'en' ? THINKING_METHODS_EN : THINKING_METHODS);
export const whyPlaceholdersFor = lang => (lang === 'en' ? WHY_PLACEHOLDERS_EN : WHY_PLACEHOLDERS);
export const caseTemplatesFor = lang => (lang === 'en' ? CASE_TEMPLATES_EN : CASE_TEMPLATES);
