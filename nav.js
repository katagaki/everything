import { applyTranslations } from "./i18n.js";

try {
  const res = await fetch(new URL("nav.html", import.meta.url));
  const html = await res.text();
  const template = document.createElement("template");
  template.innerHTML = html.trim();

  const base = new URL(".", import.meta.url);
  const here = location.pathname.replace(/index\.html$/, "");
  template.content.querySelectorAll("a[href]").forEach((a) => {
    a.href = new URL(a.getAttribute("href"), base).href;
    if (new URL(a.href).pathname === here) a.setAttribute("aria-current", "page");
  });

  const nav = template.content.firstElementChild;
  document.body.prepend(template.content);
  applyTranslations(nav);
} catch (e) {
  console.warn("nav load failed", e);
}
