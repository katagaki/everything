// Pages ship with English text and a data-i18n key on each translatable
// element. Japanese visitors have the page hidden by an inline script in
// <head> (the i18n-pending class) until the translations below are applied.
const userLang = (navigator.language || navigator.userLanguage || "en").toLowerCase();
export const lang = userLang.startsWith("ja") ? "ja" : "en";
document.documentElement.lang = lang;

let translations = {};
if (lang !== "en") {
  try {
    const res = await fetch(new URL("i18n.json", import.meta.url));
    translations = await res.json();
  } catch (e) {
    console.warn("i18n load failed", e);
  }
}

export function applyTranslations(root = document) {
  if (lang === "en") return;

  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const entry = translations[el.getAttribute("data-i18n")];
    if (!entry || !entry[lang]) return;

    if (el.tagName === "TITLE") {
      document.title = entry[lang];
    } else {
      el.innerHTML = entry[lang];
    }
  });
}

applyTranslations();
document.documentElement.classList.remove("i18n-pending");
