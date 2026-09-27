// This plugin's own strings: v5 plugins carry their own locale tables rather than core's
// (FORK-LEDGER, `i18n/locales/definition.ts`). v4's came from core, in every locale it had, so this
// is stock @quartz-community/backlinks' table (MIT), which carries them all. A locale missing here
// falls back to en-US, as stock's does.
interface Strings {
  /** The section's heading. */
  title: string
  /** The list's one item when no page links here and `hideWhenEmpty` is off. */
  noBacklinksFound: string
}

const locales: Record<string, Strings> = {
  "en-US": { title: "Backlinks", noBacklinksFound: "No backlinks found" },
  "ar-SA": { title: "وصلات العودة", noBacklinksFound: "لا يوجد وصلات عودة" },
  "ca-ES": { title: "Retroenllaç", noBacklinksFound: "No s'han trobat retroenllaços" },
  "cs-CZ": { title: "Příchozí odkazy", noBacklinksFound: "Nenalezeny žádné příchozí odkazy" },
  "de-DE": { title: "Backlinks", noBacklinksFound: "Keine Backlinks gefunden" },
  "en-GB": { title: "Backlinks", noBacklinksFound: "No backlinks found" },
  "es-ES": { title: "Retroenlaces", noBacklinksFound: "No se han encontrado retroenlaces" },
  "fa-IR": { title: "بک‌لینک‌ها", noBacklinksFound: "بدون بک‌لینک" },
  "fi-FI": { title: "Takalinkit", noBacklinksFound: "Takalinkkejä ei löytynyt" },
  "fr-FR": { title: "Liens retour", noBacklinksFound: "Aucun lien retour trouvé" },
  "he-IL": { title: "קישורים חוזרים", noBacklinksFound: "לא נמצאו קישורים חוזרים" },
  "hu-HU": { title: "Visszautalások", noBacklinksFound: "Nincs visszautalás" },
  "id-ID": { title: "Tautan Balik", noBacklinksFound: "Tidak ada tautan balik ditemukan" },
  "it-IT": { title: "Link entranti", noBacklinksFound: "Nessun link entrante" },
  "ja-JP": { title: "バックリンク", noBacklinksFound: "バックリンクはありません" },
  "kk-KZ": { title: "Артқа сілтемелер", noBacklinksFound: "Артқа сілтемелер табылмады" },
  "ko-KR": { title: "백링크", noBacklinksFound: "백링크가 없습니다." },
  "lt-LT": { title: "Atgalinės Nuorodos", noBacklinksFound: "Atgalinių Nuorodų Nerasta" },
  "nb-NO": { title: "Tilbakekoblinger", noBacklinksFound: "Ingen tilbakekoblinger funnet" },
  "nl-NL": { title: "Backlinks", noBacklinksFound: "Geen backlinks gevonden" },
  "pl-PL": { title: "Odnośniki zwrotne", noBacklinksFound: "Brak połączeń zwrotnych" },
  "pt-BR": { title: "Backlinks", noBacklinksFound: "Sem backlinks encontrados" },
  "ro-RO": { title: "Legături înapoi", noBacklinksFound: "Nu s-au găsit legături înapoi" },
  "ru-RU": { title: "Обратные ссылки", noBacklinksFound: "Обратные ссылки отсутствуют" },
  "th-TH": { title: "หน้าที่กล่าวถึง", noBacklinksFound: "ไม่มีหน้าที่โยงมาหน้านี้" },
  "tr-TR": { title: "Backlinkler", noBacklinksFound: "Backlink bulunamadı" },
  "uk-UA": { title: "Зворотні посилання", noBacklinksFound: "Зворотних посилань не знайдено" },
  "vi-VN": { title: "Liên kết ngược", noBacklinksFound: "Không có liên kết ngược nào" },
  "zh-CN": { title: "反向链接", noBacklinksFound: "无法找到反向链接" },
  "zh-TW": { title: "反向連結", noBacklinksFound: "無法找到反向連結" },
}

export const i18n = (locale?: string): Strings => locales[locale ?? ""] ?? locales["en-US"]
