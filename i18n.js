const userLang = (navigator.language || navigator.userLanguage || "en").toLowerCase();
const lang = userLang.startsWith("ja") ? "ja" : "en";
document.documentElement.lang = lang;

let translations = {};
try {
  const res = await fetch(new URL("i18n.json", import.meta.url));
  translations = await res.json();
} catch (e) {
  console.warn("i18n load failed", e);
}

export function applyTranslations(root = document) {
  root.querySelectorAll("[i18n]").forEach((el) => {
    const key = el.textContent.trim();
    const entry = translations[key];
    if (!entry || !entry[lang]) return;

    if (el.tagName === "TITLE") {
      document.title = entry[lang];
    } else {
      el.innerHTML = entry[lang];
    }
  });
}

applyTranslations();
