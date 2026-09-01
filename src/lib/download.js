// Tarayıcıda dosya indirme — proje idiom'unun (SettingsModal) paylaşılan hali.
// content bir Blob ya da metin olabilir; metinse verilen mime ile Blob'a sarılır.
export function downloadFile(filename, content, mime) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'application/octet-stream' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
