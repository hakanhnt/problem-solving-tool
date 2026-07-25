// Salt-okunur paylaşım linki: çalışma, sıkıştırılıp URL'nin # kısmına gömülür.
// Veri hiçbir sunucuya gitmez — link kimdeyse çalışmayı o görür.

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

const VERSION = 1;

/** Paylaşıma girmeyecek ağır/oturuma özgü alanları ayıklar. */
function sanitizeCase(c) {
  const out = structuredClone(c);
  delete out.ai;
  delete out.coach;
  delete out.decisionCoach;
  delete out.actionCoach;
  delete out.audit;
  delete out.premortem;
  if (out.report && out.report.status !== 'done') delete out.report;
  if (out.biasScan && out.biasScan.status !== 'done') delete out.biasScan;
  // Referansların ham metni/özeti linki şişirir; raporda yalnız başlık/URL görünür.
  out.references = (out.references || []).map(r => ({ id: r.id, title: r.title, type: r.type, url: r.url }));
  return out;
}

/** Paylaşım yükünü URL hash parçasına çevirir. */
export function buildShareHash(c, principles, company) {
  const payload = { v: VERSION, company: company || '', principles: principles || [], c: sanitizeCase(c) };
  return '#s=' + compressToEncodedURIComponent(JSON.stringify(payload));
}

/** Adresteki paylaşım yükünü çözer; yoksa/bozuksa null döner. */
export function parseShareHash(hash) {
  const m = /^#s=(.+)$/.exec(hash || '');
  if (!m) return null;
  try {
    const json = decompressFromEncodedURIComponent(m[1]);
    const payload = JSON.parse(json);
    if (!payload || payload.v !== VERSION || !payload.c || !payload.c.problem) return null;
    return payload;
  } catch (e) {
    return null;
  }
}
