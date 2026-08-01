// Zihin Kontrolü (Mind Check): adım başına en olası bilişsel yanılgılar,
// panzehir soruları ve ekibe sorulacak yöntem soruları. Adım 8'de içerik yok.
// TR metinler ürün spesifikasyonundan birebirdir; EN çevirileri arayüz içindir.
// YZ sistem talimatına eklenen blok her zaman Türkçedir (istem dili).

const TR = {
  1: {
    yontem: 'Eleştirel Düşünme',
    yanilgilar: [
      { ad: 'Çapa etkisi', aciklama: 'İlk duyduğunuz sayı ya da ilk formülasyon, tüm sonraki değerlendirmeleri orantısız etkiler.', panzehir: 'Bu problemi hiç duymamış biri aynı ifadeyi mi yazardı?' },
      { ad: 'Mevcudiyet yanlılığı', aciklama: 'En son yaşanan ya da en çarpıcı olay, en yaygın sorun sanılır.', panzehir: 'Bu ifade veriye mi, yoksa akılda kalan birkaç olaya mı dayanıyor?' }
    ],
    sorular: [
      'Şu an doğru kabul ettiğimiz ama test etmediğimiz şey ne?',
      'Bu sonuca neden inanıyoruz?',
      'Bu kararın arkasındaki en kritik varsayım ne?',
      'Bu varsayım yanlışsa tüm karar nasıl çöker?'
    ]
  },
  2: {
    yontem: 'Sistemsel Düşünme',
    yanilgilar: [
      { ad: 'Aşırı basitleştirme', aciklama: "Karmaşık bir sistem 'bu oldu çünkü şu oldu' biçiminde doğrusal bir hikâyeye indirgenir.", panzehir: "Bu sonucu tek bir driver mı üretiyor, yoksa driver'lar birbirini mi besliyor?" },
      { ad: 'Mevcudiyet yanlılığı', aciklama: "Görünür olan driver listelenir; sessiz çalışan driver'lar gözden kaçar.", panzehir: "Hangi driver'ı sırf ölçmediğimiz için listeye almadık?" }
    ],
    sorular: [
      'Bu sonucun arkasında hangi sistem çalışıyor?',
      'Bu problem başka nerelerde ortaya çıkıyor?',
      'Bu problemi bir kişiye bağlamak neyi gizliyor?'
    ]
  },
  3: {
    yontem: 'Tasarım Odaklı Düşünme',
    yanilgilar: [
      { ad: 'Temsil yanlılığı', aciklama: 'Durum, zihindeki kalıba benzediği için o kalıpla açıklanır; benzerlik doğruluk sanılır.', panzehir: 'Bunu gerçekten gözlemledik mi, yoksa tanıdık bir kalıba mı benzetiyoruz?' },
      { ad: 'Sahadan kopukluk', aciklama: 'Gerçek kullanıcı/işi yapan yerine zihinsel model konuşur.', panzehir: 'Bu tespiti işi yapan kişiyle yerinde doğruladık mı (Gemba)?' }
    ],
    sorular: [
      'Bunu gerçekten gözlemledik mi, yoksa varsayıyor muyuz?',
      'Sahaya gitsek bu tespit ayakta kalır mı?',
      'Gerçek davranış ile bizim düşündüğümüz aynı mı?',
      'Bu bulgu veri mi, yorum mu?'
    ]
  },
  4: {
    yontem: 'Eleştirel Düşünme',
    yanilgilar: [
      { ad: 'Onaylama yanlılığı', aciklama: 'Fikri destekleyen veri seçilir, çelişen veri değersizleştirilir; süreç sorgulama olmaktan çıkıp kanıt toplamaya döner.', panzehir: 'Bu bulgunun yanlış olduğunu kanıtlamaya çalışsak hangi veriye bakardık?' },
      { ad: 'Mevcudiyet yanlılığı', aciklama: 'Anekdot, ölçümün yerine geçer.', panzehir: 'Kaç gözlemden konuşuyoruz — örneklem temsil ediyor mu?' }
    ],
    sorular: [
      'Bu fikrin yanlış olduğunu kanıtlamaya çalışsak ne bulurduk?',
      'Bu sonuca neden inanıyoruz?',
      'Bu bulgu veri mi, yorum mu?'
    ]
  },
  5: {
    yontem: 'Sistemsel Düşünme',
    yanilgilar: [
      { ad: 'Tekil nedene indirgeme', aciklama: 'Çok katmanlı bir yapı tek sebebe bağlanır; problem çözülmez, yer değiştirir.', panzehir: 'Bu kök nedeni kaldırsak problem gerçekten biter mi?' },
      { ad: 'Sonuç yanlılığı', aciklama: 'Geçmişte iyi sonuç veren karar sorgulanmaz; kötü sonuç yanlış nedene bağlanır.', panzehir: 'Süreç mi doğruydu, yoksa sadece sonuç mu iyiydi?' }
    ],
    sorular: [
      'Biz sebebi mi çözüyoruz, sonucu mu?',
      'Bu sistem bu sonucu üretmeye nasıl devam eder?',
      'Bu problemi bir kişiye bağlamak neyi gizliyor?'
    ]
  },
  6: {
    yontem: 'Yanal + İkinci Düzey Düşünme',
    yanilgilar: [
      { ad: 'Aşırı güven yanlılığı', aciklama: "Deneyim arttıkça alternatif üretme ihtiyacı azalır; tek çözüm 'doğru' kabul edilir.", panzehir: 'Bu karar nerede başarısızlıkla sonuçlanır? En büyük risk ne?' },
      { ad: 'Statüko & batık maliyet', aciklama: 'Tanıdık olan, daha iyi olana tercih edilir; geçmiş yatırım geleceği belirler.', panzehir: 'Bu işe hiç başlamamış olsaydık, bugün yine bu seçeneği mi seçerdik?' },
      { ad: 'Kısa vadecilik', aciklama: 'Anlık hedef, dolaylı ve uzun vadeli etkileri gölgeler.', panzehir: 'Bugün kazandığımız şey 1 yıl sonra neyi kaybettiriyor?' }
    ],
    sorular: [
      'Bunun tamamen farklı bir çözümü ne olabilir? Tam tersini yapsak ne olurdu?',
      'Başka bir sektör bunu nasıl çözerdi?',
      'Bu karar bugün iyi, peki yarın neyi bozacak?',
      'Bu karar zincirleme olarak neyi tetikler?'
    ]
  },
  7: {
    yontem: 'Algoritmik Düşünme',
    yanilgilar: [
      { ad: 'Sonuç yanlılığı', aciklama: 'KPI iyileştiyse karar doğru sanılır; şans, başarı gibi görünür.', panzehir: 'Bu kararı bugün tekrar alsam yine alır mıydım — süreç doğru muydu?' },
      { ad: 'Onaylama yanlılığı', aciklama: 'İşe yaramadığına dair sinyaller görmezden gelinir.', panzehir: 'Karşı önlemin işe yaramadığını gösterecek veri ne olurdu?' }
    ],
    sorular: [
      'Bu kararı hangi mantıkla aldık — kriterlerimiz net miydi?',
      'Aynı durumda tekrar aynı kararı alır mıyız?',
      'Dışarıdan biri bu karar sürecini anlayabilir mi?'
    ]
  }
};

const EN = {
  1: {
    yontem: 'Critical Thinking',
    yanilgilar: [
      { ad: 'Anchoring effect', aciklama: 'The first number you hear or the first formulation disproportionately shapes every later assessment.', panzehir: 'Would someone who has never heard of this problem write the same statement?' },
      { ad: 'Availability bias', aciklama: 'The most recent or most striking incident is mistaken for the most common problem.', panzehir: 'Is this statement based on data, or on a few memorable incidents?' }
    ],
    sorular: [
      'What are we currently accepting as true without testing it?',
      'Why do we believe this conclusion?',
      'What is the most critical assumption behind this decision?',
      'If that assumption is wrong, how does the whole decision collapse?'
    ]
  },
  2: {
    yontem: 'Systems Thinking',
    yanilgilar: [
      { ad: 'Oversimplification', aciklama: "A complex system gets reduced to a linear story of 'this happened because that happened'.", panzehir: 'Is a single driver producing this outcome, or are the drivers feeding each other?' },
      { ad: 'Availability bias', aciklama: 'Visible drivers get listed; drivers working silently go unnoticed.', panzehir: 'Which driver did we leave off the list simply because we do not measure it?' }
    ],
    sorular: [
      'What system is operating behind this outcome?',
      'Where else does this problem appear?',
      'What does pinning this problem on one person hide?'
    ]
  },
  3: {
    yontem: 'Design Thinking',
    yanilgilar: [
      { ad: 'Representativeness bias', aciklama: 'Because the situation resembles a mental pattern, it gets explained by that pattern; similarity is mistaken for truth.', panzehir: 'Did we actually observe this, or are we matching it to a familiar pattern?' },
      { ad: 'Detachment from the field', aciklama: 'A mental model speaks instead of the real user / the person doing the work.', panzehir: 'Did we verify this on site with the person doing the work (Gemba)?' }
    ],
    sorular: [
      'Did we actually observe this, or are we assuming it?',
      'Would this finding survive if we went to the field?',
      'Is the real behavior the same as what we think it is?',
      'Is this finding data or interpretation?'
    ]
  },
  4: {
    yontem: 'Critical Thinking',
    yanilgilar: [
      { ad: 'Confirmation bias', aciklama: 'Data supporting the idea is selected, contradicting data is devalued; the process stops being inquiry and becomes evidence collection.', panzehir: 'If we tried to prove this finding wrong, which data would we look at?' },
      { ad: 'Availability bias', aciklama: 'Anecdote takes the place of measurement.', panzehir: 'How many observations are we talking about — is the sample representative?' }
    ],
    sorular: [
      'If we tried to prove this idea wrong, what would we find?',
      'Why do we believe this conclusion?',
      'Is this finding data or interpretation?'
    ]
  },
  5: {
    yontem: 'Systems Thinking',
    yanilgilar: [
      { ad: 'Single-cause reduction', aciklama: 'A multi-layered structure gets pinned on one cause; the problem is not solved, it relocates.', panzehir: 'If we removed this root cause, would the problem truly end?' },
      { ad: 'Outcome bias', aciklama: 'Decisions that produced good outcomes in the past go unquestioned; bad outcomes get attributed to the wrong cause.', panzehir: 'Was the process right, or was only the outcome good?' }
    ],
    sorular: [
      'Are we solving the cause or the effect?',
      'How does this system keep producing this outcome?',
      'What does pinning this problem on one person hide?'
    ]
  },
  6: {
    yontem: 'Lateral + Second-Order Thinking',
    yanilgilar: [
      { ad: 'Overconfidence bias', aciklama: "As experience grows, the need to generate alternatives shrinks; a single solution gets accepted as 'right'.", panzehir: 'Where does this decision end in failure? What is the biggest risk?' },
      { ad: 'Status quo & sunk cost', aciklama: 'The familiar is preferred over the better; past investment dictates the future.', panzehir: 'If we had never started this, would we still choose this option today?' },
      { ad: 'Short-termism', aciklama: 'The immediate goal overshadows indirect and long-term effects.', panzehir: 'What does what we gain today cost us a year from now?' }
    ],
    sorular: [
      'What would a completely different solution look like? What if we did the exact opposite?',
      'How would another industry solve this?',
      'This decision is good today — what does it break tomorrow?',
      'What does this decision trigger in a chain?'
    ]
  },
  7: {
    yontem: 'Algorithmic Thinking',
    yanilgilar: [
      { ad: 'Outcome bias', aciklama: 'If the KPI improved, the decision is assumed right; luck looks like success.', panzehir: 'Would I make this decision again today — was the process right?' },
      { ad: 'Confirmation bias', aciklama: 'Signals that it is not working get ignored.', panzehir: 'What data would show the countermeasure is not working?' }
    ],
    sorular: [
      'By what logic did we make this decision — were our criteria clear?',
      'Would we make the same decision again in the same situation?',
      'Could an outsider understand this decision process?'
    ]
  }
};

/** Adımın Zihin Kontrolü içeriği (1-7); Adım 8 için null. */
export function mindCheckFor(step, lang) {
  return (lang === 'en' ? EN : TR)[step] || null;
}

/** YZ sistem talimatının sonuna eklenen yanılgı bloğu — istem dili her zaman Türkçedir. */
export function mindCheckPromptBlock(step) {
  const m = TR[step];
  if (!m) return '';
  const list = m.yanilgilar
    .map(y => y.ad + ' (' + y.aciklama + ' Panzehir sorusu: ' + y.panzehir + ')')
    .join(' | ');
  return '\n\nBU ADIMDA GÖZETİLECEK DÜŞÜNCE YANILGILARI: ' + list
    + '\nKullanıcının girdilerinde bu yanılgıların izini gördüğünde nazikçe ama açıkça işaret et ve panzehir sorusunu sor. Kullanıcı hızlı/otomatik düşünüyorsa yavaşlamasını iste.';
}

/** Adım 6 karar öncesi kontrol soruları (precheck p1-p3). */
export function preCheckItemsFor(lang) {
  if (lang === 'en') {
    return [
      { key: 'p1', soru: 'What am I assuming right now? If it is true, what is it based on; if it is false, what changes?', not: 'Against confirmation bias' },
      { key: 'p2', soru: 'What other explanation is possible? Could this have a completely different cause?', not: 'Against representativeness bias and overconfidence' },
      { key: 'p3', soru: 'Who pays the cost of this decision, and when? What happens in 3 months, in 1 year?', not: 'Against short-termism and outcome bias' }
    ];
  }
  return [
    { key: 'p1', soru: 'Ben şu an neyi varsayıyorum? Bu doğruysa neye dayanıyor, yanlışsa ne değişir?', not: 'Onaylama yanlılığına karşı' },
    { key: 'p2', soru: 'Başka hangi açıklama mümkün? Bunun tamamen farklı bir nedeni olabilir mi?', not: 'Temsil yanlılığı ve aşırı güvene karşı' },
    { key: 'p3', soru: 'Bu kararın bedelini kim ve ne zaman ödeyecek? 3 ay, 1 yıl sonra ne olur?', not: 'Kısa vadecilik ve sonuç yanlılığına karşı' }
  ];
}
