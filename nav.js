import { applyTranslations } from "./i18n.js";

try {
  const res = await fetch(new URL("nav.html", import.meta.url));
  const html = await res.text();
  const template = document.createElement("template");
  template.innerHTML = html.trim();

  const base = new URL(".", import.meta.url);
  template.content.querySelectorAll("a[href]").forEach((a) => {
    a.href = new URL(a.getAttribute("href"), base).href;
  });

  const nav = template.content.firstElementChild;
  document.body.prepend(template.content);
  applyTranslations(nav);
} catch (e) {
  console.warn("nav load failed", e);
}
