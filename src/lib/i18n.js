// İki dilli arayüz yardımcıları. Çeviriler merkezi sözlükte değil, kullanım
// yerinde çift metin olarak durur: t('Türkçe', 'English'). Varsayılan dil
// Türkçedir; bilinmeyen değerler 'tr'ye düşer, eski kayıtlar etkilenmez.

export const LANGS = ['tr', 'en'];

/** Dil için çevirmen üretir: t(tr, en). Bileşen dışı modüller de kullanır. */
export const mkT = lang => (tr, en) => (lang === 'en' ? en : tr);

/** Sayı biçimi: TR ondalık virgül, EN ondalık nokta. */
export const fmtNum = (lang, v) => {
  const s = String(v);
  return lang === 'en' ? s : s.replace('.', ',');
};
