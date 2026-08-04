// Salt-okunur paylaşım linki: çalışma, sıkıştırılıp URL'nin # kısmına gömülür.
// Veri hiçbir sunucuya gitmez — link kimdeyse çalışmayı o görür.

import lz from 'lz-string';
import { deflateSync, inflateSync, strToU8, strFromU8 } from 'fflate';

const VERSION = 1;

// URL'de güvenli base64 (+/= yerine -_ ve dolgusuz).
function toB64Url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64Url(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Paylaşıma girmeyecek ağır/oturuma özgü alanları ayıklar. */
function sanitizeCase(c) {
  const out = structuredClone(c);
  delete out.ai;
  delete out.coach;
  delete out.decisionCoach;
  delete out.actionCoach;
  delete out.audit;
  delete out.premortem;
  delete out.redTeam;
  if (out.report && out.report.status !== 'done') delete out.report;
  if (out.biasScan && out.biasScan.status !== 'done') delete out.biasScan;
  // Referansların ham metni/özeti linki şişirir; raporda yalnız başlık/URL görünür.
  out.references = (out.references || []).map(r => ({ id: r.id, title: r.title, type: r.type, url: r.url }));
  return out;
}

/** Paylaşım yükünü URL hash parçasına çevirir (deflate + base64url). */
export function buildShareHash(c, principles, company) {
  const payload = { v: VERSION, company: company || '', principles: principles || [], c: sanitizeCase(c) };
  return '#z=' + toB64Url(deflateSync(strToU8(JSON.stringify(payload)), { level: 9 }));
}

/** Adresteki paylaşım yükünü çözer; yoksa/bozuksa null döner.
 *  #z= yeni biçim (deflate); #s= eski biçim (lz-string) — eski linkler açılmaya devam eder. */
export function parseShareHash(hash) {
  const m = /^#(z|s)=(.+)$/.exec(hash || '');
  if (!m) return null;
  try {
    const json = m[1] === 'z'
      ? strFromU8(inflateSync(fromB64Url(m[2])))
      : lz.decompressFromEncodedURIComponent(m[2]);
    const payload = JSON.parse(json);
    if (!payload || payload.v !== VERSION || !payload.c || !payload.c.problem) return null;
    return payload;
  } catch (e) {
    return null;
  }
}
