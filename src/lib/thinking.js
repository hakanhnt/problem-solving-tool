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
