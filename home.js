import { applyTranslations } from "./i18n.js";

// Selecting an app opens a context menu anchored to its icon. Phones get a modal
// sheet instead, as a menu next to a small icon is hard to use on a narrow
// screen.
const compact = window.matchMedia("(max-width: 640px)");

const sheet = document.createElement("dialog");
sheet.className = "ktui-app-sheet";

const menu = document.createElement("div");
menu.className = "ktui-app-menu";
menu.popover = "manual";
menu.setAttribute("role", "menu");

document.body.append(sheet, menu);

let menuCard = null;

function parts(card) {
  return {
    icon: card.querySelector(".ktui-card-icon img"),
    link: card.querySelector(".ktui-card-name a"),
    desc: card.querySelector(".ktui-card-desc"),
    action: card.querySelector(".ktui-card-action"),
  };
}

// The app's destinations: its store pages, beta, or development status.
function primaryItems(action) {
  const items = [];

  const appStore = action.querySelector("a:has(.ktui-appstore-badge)");
  if (appStore) items.push({ href: appStore.href, key: "app.view_app_store", text: "View on the App Store" });

  const googlePlay = action.querySelector("a:has(.ktui-playstore-badge)");
  if (googlePlay) items.push({ href: googlePlay.href, key: "app.view_google_play", text: "View on Google Play" });

  const button = action.querySelector(".ktui-button");
  if (button) items.push({ href: button.href, text: button.textContent });

  const tag = action.querySelector(".ktui-tag");
  if (tag) items.push({ text: tag.textContent });

  return items;
}

// Apps built separately per platform link both repositories.
function sourceItems(card, link) {
  const android = card.dataset.androidSource;
  if (!android) return [{ href: link.href, key: "app.view_source", text: "View on GitHub" }];
  return [
    { href: link.href, key: "app.view_source_ios", text: "View iOS Source on GitHub" },
    { href: android, key: "app.view_source_android", text: "View Android Source on GitHub" },
  ];
}

function menuItem({ href, key, text }) {
  const item = document.createElement(href ? "a" : "span");
  item.className = "ktui-app-menu-item";
  item.setAttribute("role", "menuitem");
  item.textContent = text;
  if (href) item.href = href;
  else item.setAttribute("aria-disabled", "true");
  if (key) item.setAttribute("data-i18n", key);
  return item;
}

function openSheet(card) {
  const { icon, link, desc, action } = parts(card);

  sheet.innerHTML = `
    <div class="ktui-app-sheet-header">
      <img alt="">
      <div>
        <h2 class="ktui-app-sheet-name"></h2>
        <p class="ktui-app-sheet-desc"></p>
      </div>
    </div>
    <div class="ktui-app-sheet-actions"></div>
  `;
  sheet.querySelector("img").src = icon.src;
  sheet.querySelector(".ktui-app-sheet-name").textContent = link.textContent;
  sheet.querySelector(".ktui-app-sheet-desc").innerHTML = desc.innerHTML;
  const actions = sheet.querySelector(".ktui-app-sheet-actions");
  const sources = document.createElement("div");
  sources.className = "ktui-app-sheet-sources";
  for (const { href, key, text } of sourceItems(card, link)) {
    const source = document.createElement("a");
    source.className = "ktui-app-sheet-source";
    source.href = href;
    source.setAttribute("data-i18n", key);
    source.textContent = text;
    sources.append(source);
  }
  actions.append(action.cloneNode(true), sources);
  applyTranslations(sheet);

  sheet.showModal();
}

sheet.addEventListener("click", (e) => {
  if (e.target === sheet) sheet.close();
});

// Below the app's label, centred on its icon, flipping above when there's no
// room.
function placeMenu() {
  if (!menuCard) return;
  const tile = menuCard.getBoundingClientRect();
  const icon = menuCard.querySelector(".ktui-card-icon").getBoundingClientRect();
  const { width, height } = menu.getBoundingClientRect();
  const gap = 4;

  let top = tile.bottom + gap;
  if (top + height > window.innerHeight - gap) top = tile.top - height - gap;
  const left = Math.min(
    Math.max(gap, icon.left + icon.width / 2 - width / 2),
    window.innerWidth - width - gap,
  );

  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
}

function openMenu(card) {
  const { link, desc, action } = parts(card);

  menu.innerHTML = `<p class="ktui-app-menu-desc"></p><div class="ktui-app-menu-items"></div>`;
  menu.querySelector(".ktui-app-menu-desc").innerHTML = desc.innerHTML;
  const items = menu.querySelector(".ktui-app-menu-items");
  for (const item of [...primaryItems(action), ...sourceItems(card, link)]) {
    items.append(menuItem(item));
  }
  menu.setAttribute("aria-label", link.textContent);
  applyTranslations(menu);

  menuCard?.setAttribute("aria-expanded", "false");
  menuCard = card;
  card.setAttribute("aria-expanded", "true");

  if (!menu.matches(":popover-open")) menu.showPopover();
  placeMenu();
}

function closeMenu({ restoreFocus = false } = {}) {
  if (!menuCard) return;
  const card = menuCard;
  menuCard = null;
  card.setAttribute("aria-expanded", "false");
  if (menu.matches(":popover-open")) menu.hidePopover();
  if (restoreFocus) card.focus();
}

function select(card, { fromKeyboard = false } = {}) {
  if (compact.matches) {
    openSheet(card);
    return;
  }
  if (menuCard === card) {
    closeMenu();
    return;
  }
  openMenu(card);
  if (fromKeyboard) menu.querySelector("a.ktui-app-menu-item")?.focus();
}

document.querySelectorAll(".ktui-springboard .ktui-card").forEach((card) => {
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-haspopup", "menu");
  card.setAttribute("aria-expanded", "false");
  card.querySelector(".ktui-card-name a").tabIndex = -1;

  card.addEventListener("click", (e) => {
    e.preventDefault();
    select(card);
  });
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(card, { fromKeyboard: true });
    }
  });
});

// Clicking anywhere other than the menu or the selected icon dismisses it.
document.addEventListener("pointerdown", (e) => {
  if (menuCard && !menu.contains(e.target) && !menuCard.contains(e.target)) closeMenu();
});

menu.addEventListener("keydown", (e) => {
  const items = [...menu.querySelectorAll("a.ktui-app-menu-item")];
  const index = items.indexOf(document.activeElement);
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    const step = e.key === "ArrowDown" ? 1 : -1;
    items[(index + step + items.length) % items.length]?.focus();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menuCard) closeMenu({ restoreFocus: true });
});

window.addEventListener("scroll", placeMenu, { passive: true });
window.addEventListener("resize", placeMenu);
compact.addEventListener("change", () => closeMenu());
