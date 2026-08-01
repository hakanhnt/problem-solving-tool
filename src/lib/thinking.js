// Düşünme yöntemleri ↔ bilişsel yanılgılar bilgi tabanı.
// Kaynak: "Düşünme Yöntemlerine Göre Güçlü Ekip Soruları" ve "Düşünme Yanılgıları
// (Cognitive Bias)" kurum dokümanları. Her yöntem belirli bir yanılgıya karşı
// denge mekanizmasıdır; sorular toplantıda ekibe yöneltilmek üzere yazılmıştır.

export const THINKING_METHOD_INFO = {
  'Eleştirel düşünce': {
    bias: 'Onaylama yanlılığı',
    amac: 'Varsayımları görünür kılmak ve düşünmeyi sorgulamak',
    sorular: [
      'Şu an doğru kabul ettiğimiz ama test etmediğimiz şey ne?',
      'Bu fikrin yanlış olduğunu kanıtlamaya çalışsak ne bulurduk?',
      'Bu sonuca neden inanıyoruz?',
      'Bu kararın arkasındaki en kritik varsayım ne?',
      'Bu varsayım yanlışsa tüm karar nasıl çöker?'
    ]
  },
  'İlk ilkeler düşüncesi': {
    bias: 'Statüko yanlılığı & batık maliyet yanılgısı',
    amac: 'Problemi alışkanlıklardan ve geçmiş kararların etkisinden çıkarıp özüne indirmek',
    sorular: [
      'Bu işi bugün sıfırdan kursak nasıl yapardık?',
      'Burada doğru kabul ettiğimiz ama hiç sorgulamadığımız şey ne?',
      'Geçmişte verdiğimiz kararlar düşüncemizi etkiliyor olabilir mi?',
      'Bu işin en temel (gerçek) hali ne?',
      'Tüm varsayımları kaldırırsak geriye ne kalır?'
    ]
  },
  'Tasarım odaklı düşünce': {
    bias: 'Temsil yanlılığı',
    amac: 'Varsayım yerine gerçek kullanıcı / saha üzerinden düşünmek',
    sorular: [
      'Bunu gerçekten gözlemledik mi, yoksa varsayıyor muyuz?',
      'Müşteri bu kararı görse ne derdi?',
      'Sahaya gitsek bu karar ayakta kalır mı?',
      'Gerçek davranış ile bizim düşündüğümüz aynı mı?',
      'Bu karar veri mi, yorum mu?'
    ]
  },
  'Yanal düşünce': {
    bias: 'Aşırı güven yanlılığı',
    amac: 'Alternatif üretmek ve zihinsel esnekliği artırmak',
    sorular: [
      'Bunun tamamen farklı bir çözümü ne olabilir?',
      'Tam tersini yapsak ne olurdu?',
      'Başka bir sektör bunu nasıl çözerdi?',
      'Şu an düşünmediğimiz en radikal alternatif ne?',
      'Bu problem için "imkânsız" dediğimiz çözüm ne?'
    ]
  },
  'İkinci düzey düşünce': {
    bias: 'Kısa vadecilik & sonuç yanlılığı',
    amac: 'Uzun vadeli ve dolaylı etkileri görmek',
    sorular: [
      'Bu karar bugün iyi, peki yarın neyi bozacak?',
      '3 ay sonra en olası sonuç ne olur?',
      '1 yıl sonra hangi etkiler ortaya çıkar?',
      'Bu karar zincirleme olarak neyi tetikler?',
      'Kısa vadede kazandığımız şey uzun vadede ne kaybettiriyor?'
    ]
  },
  'Sistem düşüncesi': {
    bias: 'Mevcudiyet yanlılığı & aşırı basitleştirme',
    amac: 'Tekil neden yerine sistemin tamamını görmek',
    sorular: [
      'Bu sonucun arkasında hangi sistem çalışıyor?',
      'Biz sebebi mi çözüyoruz, sonucu mu?',
      'Bu problem başka nerelerde ortaya çıkıyor?',
      'Bu sistem bu sonucu üretmeye nasıl devam eder?',
      'Bu problemi bir kişiye bağlamak neyi gizliyor?'
    ]
  },
  'Algoritmik düşünce': {
    bias: 'Çapa etkisi & sezgisel kısayollar',
    amac: 'Karar mantığını görünür ve tekrarlanabilir yapmak',
    sorular: [
      'Bu kararı hangi mantıkla alıyoruz?',
      'Kriterlerimiz net mi, yoksa sezgisel mi?',
      'Bu süreci adım adım tanımlayabilir miyiz?',
      'Aynı durumda tekrar aynı kararı alır mıyız?',
      'Dışarıdan biri bu karar sürecini anlayabilir mi?'
    ]
  },
  // Dokümanda karşılığı yok; uygulamadaki yöntem listesi eksik kalmasın diye
  // kurum prensibi "Best practice'leri araştırıp adapte ederiz" temel alınarak yazıldı.
  'Best practice adaptasyonu': {
    bias: 'Bağlamı yok sayma (kopyala-yapıştır)',
    amac: 'Kanıtlanmış çözümü kendi bağlamımıza uyarlayarak almak',
    sorular: [
      'Bu uygulama hangi bağlamda işe yaradı; bizim bağlamımız ne kadar benziyor?',
      'Çözümün hangi parçası özünde, hangi parçası o kuruma özgü?',
      'Uyarlarken neyi değiştirmemiz, neyi aynen korumamız gerekiyor?',
      'Bunu bizden önce deneyip vazgeçen oldu mu, neden vazgeçmiş?',
      'Küçük bir pilotla test edebileceğimiz en küçük hali ne?'
    ]
  }
};

/** Meta katman: yöntemlerden önce gelen düşünme farkındalığı soruları. */
export const META_QUESTIONS = [
  'Şu an hızlı mı düşünüyoruz, yoksa gerçekten analiz mi ediyoruz?',
  'Bu kararı hangi koşullar altında alıyoruz? (zaman baskısı, belirsizlik…)',
  'Şu an bizi en çok etkileyen zihinsel eğilim ne olabilir?',
  'Fazla mı eminiz?',
  'Otomatik pilotta mıyız, yoksa bilinçli düşünmeye geçmemiz gereken kritik bir noktada mıyız?'
];

/** Karar öncesi üç soru — dokümandaki pratik rehberin çekirdeği. */
export const PRE_DECISION_QUESTIONS = [
  {
    key: 'assume',
    title: 'Ben şu an neyi varsayıyorum?',
    against: 'Onaylama yanlılığına karşı',
    hint: 'Bu doğru olduğuna neden inanıyorum? Yanlışsa ne değişir?',
    ph: 'Kararın dayandığı, henüz veriyle kanıtlanmamış varsayımlar…'
  },
  {
    key: 'alt',
    title: 'Başka hangi açıklama mümkün?',
    against: 'Temsil yanlılığı ve aşırı güvene karşı',
    hint: 'İlk açıklama genelde en doğru değil, en hızlı olandır. Ben olmasam bu durumu nasıl yorumlardım?',
    ph: 'Aynı bulguları açıklayabilecek rakip yorumlar…'
  },
  {
    key: 'cost',
    title: 'Bu kararın bedelini kim ve ne zaman ödeyecek?',
    against: 'Kısa vadecilik ve sonuç yanlılığına karşı',
    hint: '3 ay sonra ne olur? 1 yıl sonra neyi tetikler?',
    ph: 'Bedeli üstlenecek taraf, ortaya çıkma zamanı ve ikinci düzey etkiler…'
  }
];

/** YZ taramasında ve arayüzde kullanılan yanılgı kataloğu. */
export const BIASES = [
  { ad: 'Onaylama yanlılığı', panzehir: 'Eleştirel düşünce', belirti: 'Fikri destekleyen veri toplanır, çelişen veri değersizleştirilir.' },
  { ad: 'Statüko yanlılığı', panzehir: 'İlk ilkeler düşüncesi', belirti: 'Daha iyi seçenek yerine daha tanıdık olan seçilir.' },
  { ad: 'Batık maliyet yanılgısı', panzehir: 'İlk ilkeler düşüncesi', belirti: '"Bu kadar yatırım yaptık, vazgeçemeyiz" mantığı.' },
  { ad: 'Temsil yanlılığı', panzehir: 'Tasarım odaklı düşünce', belirti: 'Saha gözlemi yerine zihindeki kalıba benzerlik esas alınır.' },
  { ad: 'Aşırı güven yanlılığı', panzehir: 'Yanal düşünce', belirti: 'Tek çözüm doğru kabul edilir, alternatif üretilmez.' },
  { ad: 'Sonuç yanlılığı', panzehir: 'İkinci düzey düşünce', belirti: 'Kararın kalitesi sürecine değil, sonucuna bakılarak ölçülür.' },
  { ad: 'Kısa vadecilik', panzehir: 'İkinci düzey düşünce', belirti: 'Uzun vadeli etkiler göz ardı edilir, anlık hedef belirler.' },
  { ad: 'Mevcudiyet yanlılığı', panzehir: 'Sistem düşüncesi', belirti: 'Kolay hatırlanan olay yaygın sanılır; karar anekdota dayanır.' },
  { ad: 'Aşırı basitleştirme', panzehir: 'Sistem düşüncesi', belirti: 'Çok katmanlı yapı "bu oldu çünkü şu oldu"ya indirgenir.' },
  { ad: 'Çapa etkisi', panzehir: 'Algoritmik düşünce', belirti: 'İlk duyulan sayı/fikir sonraki tüm değerlendirmeyi belirler.' },
  { ad: 'Grup düşüncesi', panzehir: 'Eleştirel düşünce', belirti: 'İtiraz edilmediği için uzlaşı sanılan sessizlik oluşur.' }
];

/** Liderler için kritik davranışlar (dokümanın 4. bölümü) — sistemden güçlüdür. */
export const LEADER_MOVES = [
  { ad: '"Bilmiyorum" diyebilmek', not: 'Zayıflık değil, düşünmeyi açan tetikleyici. Lider bunu yapınca ekip de düşünmeye başlar.' },
  { ad: 'Kendi varsayımını açık etmek', not: '"Benim şu anki varsayımım şu, yanlış olabilir" — tartışmayı bu cümle başlatır.' },
  { ad: 'Fikir değiştirmeyi normalleştirmek', not: '"Bu yeni bilgiyle fikrimi değiştiriyorum." Yapılmazsa herkes pozisyonunu savunur.' }
];

/** Günlük iş yapışta zihinsel kası geliştiren alışkanlıklar (dokümanın 3. bölümü). */
export const DAILY_HABITS = [
  { ad: 'Gözlem yapmadan yorum yapmama', against: 'Temsil yanlılığı', not: '"Bence" ile başlayan cümleleri azaltın; "gördüğüm/duyduğum veri şu" ile değiştirin.' },
  { ad: 'Problemi yeniden tanımlama', against: 'Statüko yanlılığı', not: 'Her problemde sorun: biz aslında neyi çözmeye çalışıyoruz, problem gerçekten bu mu?' },
  { ad: 'Karar sonrası kısa refleksiyon', against: 'Sonuç yanlılığı', not: 'Sonuç iyi diye karar doğru sayılmaz: süreç doğru muydu, bugün tekrar aynı kararı alır mıydım?' }
];

/** Toplantıda uygulanacak mikro müdahaleler (dokümanın 2. bölümü). */
export const MEETING_MOVES = [
  { ad: 'İlk fikri askıya al', against: 'Çapa etkisi', not: 'İlk fikri hemen değerlendirme; en az 2 alternatif gelmeden karar sürecine girme.' },
  { ad: 'Sessizleri konuştur', against: 'Grup düşüncesi', not: '"Henüz konuşmayanların fikrini merak ediyorum", "Buna katılmayan var mı?"' },
  { ad: '"Bu neden yanlış olabilir?" anını yarat', against: 'Aşırı güven', not: 'Bu karar nerede başarısız olur, en büyük risk ne?' },
  { ad: 'Varsayımını açık et', against: 'Onaylama yanlılığı', not: '"Benim şu anki varsayımım şu, yanlış olabilir" — tartışmayı bu cümle başlatır.' }
];

// ---- İngilizce arayüz varyantları -------------------------------------------
// Veri şeması (key'ler: key/ad/against/not/bias/amac/sorular) iki dilde de aynıdır;
// yalnız görünen metinler değişir. BIASES yalnız YZ istemine gider, EN varyantı yok.

export const THINKING_METHOD_INFO_EN = {
  'Critical thinking': {
    bias: 'Confirmation bias',
    amac: 'Make assumptions visible and question the thinking',
    sorular: [
      'What are we currently accepting as true but have not tested?',
      'If we tried to prove this idea wrong, what would we find?',
      'Why do we believe this conclusion?',
      'What is the most critical assumption behind this decision?',
      'If that assumption is wrong, how does the whole decision collapse?'
    ]
  },
  'First-principles thinking': {
    bias: 'Status quo bias & sunk cost fallacy',
    amac: 'Strip the problem of habits and past decisions and reduce it to its essence',
    sorular: [
      'If we built this from scratch today, how would we do it?',
      'What do we accept as true here but never question?',
      'Could our past decisions be influencing our thinking?',
      'What is the most fundamental (real) form of this work?',
      'If we remove all the assumptions, what remains?'
    ]
  },
  'Design thinking': {
    bias: 'Representativeness bias',
    amac: 'Think through real users / the field instead of assumptions',
    sorular: [
      'Have we actually observed this, or are we assuming it?',
      'What would the customer say if they saw this decision?',
      'Would this decision survive a visit to the field?',
      'Is actual behavior the same as what we think it is?',
      'Is this decision data or interpretation?'
    ]
  },
  'Lateral thinking': {
    bias: 'Overconfidence bias',
    amac: 'Generate alternatives and increase mental flexibility',
    sorular: [
      'What could be a completely different solution to this?',
      'What would happen if we did the exact opposite?',
      'How would another industry solve this?',
      'What is the most radical alternative we are not considering right now?',
      'What solution do we call "impossible" for this problem?'
    ]
  },
  'Second-order thinking': {
    bias: 'Short-termism & outcome bias',
    amac: 'See long-term and indirect effects',
    sorular: [
      'This decision is good today — what will it break tomorrow?',
      'What is the most likely outcome in 3 months?',
      'What effects will emerge after 1 year?',
      'What does this decision trigger as a chain reaction?',
      'What does the short-term win cost us in the long term?'
    ]
  },
  'Systems thinking': {
    bias: 'Availability bias & oversimplification',
    amac: 'See the whole system instead of a single cause',
    sorular: [
      'What system is operating behind this outcome?',
      'Are we solving the cause or the symptom?',
      'Where else does this problem show up?',
      'How does this system keep producing this outcome?',
      'What does blaming this problem on one person hide?'
    ]
  },
  'Algorithmic thinking': {
    bias: 'Anchoring effect & heuristic shortcuts',
    amac: 'Make the decision logic visible and repeatable',
    sorular: [
      'What logic are we using to make this decision?',
      'Are our criteria explicit, or intuitive?',
      'Can we define this process step by step?',
      'Would we make the same decision again in the same situation?',
      'Could an outsider understand this decision process?'
    ]
  },
  'Best-practice adaptation': {
    bias: 'Ignoring context (copy-paste)',
    amac: 'Adopt a proven solution by adapting it to our own context',
    sorular: [
      'In what context did this practice work, and how similar is ours?',
      'Which part of the solution is essential, and which is specific to that organization?',
      'When adapting, what must we change and what must we keep as is?',
      'Did anyone try this before us and give up — why did they?',
      'What is the smallest version we could test with a small pilot?'
    ]
  }
};

// Yöntem adı state'te seçildiği dildeki haliyle durabilir; EN haritasına TR
// takma adları eklenir ki THINKING_METHOD_INFO_EN['Eleştirel düşünce'] da bulunsun.
// (TR haritası AYNEN korunur — YZ istemi Object.keys(THINKING_METHOD_INFO) kullanır.)
const METHOD_NAME_TR_TO_EN = {
  'Eleştirel düşünce': 'Critical thinking',
  'İlk ilkeler düşüncesi': 'First-principles thinking',
  'Tasarım odaklı düşünce': 'Design thinking',
  'Yanal düşünce': 'Lateral thinking',
  'İkinci düzey düşünce': 'Second-order thinking',
  'Sistem düşüncesi': 'Systems thinking',
  'Algoritmik düşünce': 'Algorithmic thinking',
  'Best practice adaptasyonu': 'Best-practice adaptation'
};
for (const trName of Object.keys(METHOD_NAME_TR_TO_EN)) {
  THINKING_METHOD_INFO_EN[trName] = THINKING_METHOD_INFO_EN[METHOD_NAME_TR_TO_EN[trName]];
}

export const META_QUESTIONS_EN = [
  'Are we thinking fast right now, or truly analyzing?',
  'Under what conditions are we making this decision? (time pressure, uncertainty…)',
  'What mental tendency might be influencing us most right now?',
  'Are we too sure?',
  'Are we on autopilot, or at a critical point where we need to switch to deliberate thinking?'
];

export const PRE_DECISION_QUESTIONS_EN = [
  {
    key: 'assume',
    title: 'What am I assuming right now?',
    against: 'Against confirmation bias',
    hint: 'Why do I believe this is true? What changes if it is wrong?',
    ph: 'Assumptions the decision rests on that are not yet proven with data…'
  },
  {
    key: 'alt',
    title: 'What other explanation is possible?',
    against: 'Against representativeness bias and overconfidence',
    hint: 'The first explanation is usually not the most accurate one, just the fastest. How would I read this situation if I were someone else?',
    ph: 'Competing interpretations that could explain the same findings…'
  },
  {
    key: 'cost',
    title: 'Who will pay the price of this decision, and when?',
    against: 'Against short-termism and outcome bias',
    hint: 'What happens in 3 months? What does it trigger in 1 year?',
    ph: 'Who bears the cost, when it will surface, and second-order effects…'
  }
];

export const LEADER_MOVES_EN = [
  { ad: 'Being able to say "I don\'t know"', not: 'Not a weakness — a trigger that opens up thinking. When the leader does it, the team starts thinking too.' },
  { ad: 'Making your own assumption explicit', not: '"My current assumption is this, and it may be wrong" — that sentence starts the discussion.' },
  { ad: 'Normalizing changing your mind', not: '"With this new information, I am changing my mind." Otherwise everyone keeps defending their position.' }
];

export const DAILY_HABITS_EN = [
  { ad: 'No interpretation without observation', against: 'Representativeness bias', not: 'Cut down sentences starting with "I think"; replace them with "the data I saw/heard is this".' },
  { ad: 'Redefining the problem', against: 'Status quo bias', not: 'For every problem ask: what are we actually trying to solve — is this really the problem?' },
  { ad: 'Short reflection after decisions', against: 'Outcome bias', not: 'A good outcome does not make the decision right: was the process sound, would I make the same decision today?' }
];

export const MEETING_MOVES_EN = [
  { ad: 'Suspend the first idea', against: 'Anchoring effect', not: 'Do not evaluate the first idea right away; do not start deciding before at least 2 alternatives are on the table.' },
  { ad: 'Get the quiet ones talking', against: 'Groupthink', not: '"I\'m curious what those who haven\'t spoken yet think", "Does anyone disagree?"' },
  { ad: 'Create a "why might this be wrong?" moment', against: 'Overconfidence', not: 'Where would this decision fail, what is the biggest risk?' },
  { ad: 'Make your assumption explicit', against: 'Confirmation bias', not: '"My current assumption is this, and it may be wrong" — that sentence starts the discussion.' }
];

// ---- Dil erişimcileri --------------------------------------------------------

export const thinkingMethodInfoFor = lang => (lang === 'en' ? THINKING_METHOD_INFO_EN : THINKING_METHOD_INFO);
export const metaQuestionsFor = lang => (lang === 'en' ? META_QUESTIONS_EN : META_QUESTIONS);
export const preDecisionQuestionsFor = lang => (lang === 'en' ? PRE_DECISION_QUESTIONS_EN : PRE_DECISION_QUESTIONS);
export const leaderMovesFor = lang => (lang === 'en' ? LEADER_MOVES_EN : LEADER_MOVES);
export const dailyHabitsFor = lang => (lang === 'en' ? DAILY_HABITS_EN : DAILY_HABITS);
export const meetingMovesFor = lang => (lang === 'en' ? MEETING_MOVES_EN : MEETING_MOVES);
