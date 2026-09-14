const DEFAULTS = {
  reels: true,
  explore: true,
  followingOnly: true,
};

const ROOT = document.documentElement;

const FOR_YOU = ["Para ti", "For you"];
const FOLLOWING = ["Siguiendo", "Following"];
const SUGGESTED = [
  "Publicaciones sugeridas",
  "Publicaciones sugeridas para ti",
  "Suggested for you",
  "Sugerencias para ti",
  "Suggested posts",
  "Más publicaciones de",
  "More posts from",
];

let settings = { ...DEFAULTS };
let lastPath = location.pathname;
let forcedFollowingAt = 0;

function normalize(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function isLoginScreen() {
  return !!document.querySelector(
    'input[name="username"], form#loginForm, [data-testid="login-form"], a[href="/accounts/login/"]'
  );
}

function findTab(labels) {
  let best = null;
  let bestLength = Infinity;
  const nodes = document.querySelectorAll(
    'span, a, button, div, [role="tab"], [role="button"]'
  );
  for (const el of nodes) {
    const text = normalize(el.textContent);
    if (!labels.includes(text)) continue;
    if (text.length < bestLength) {
      best = el;
      bestLength = text.length;
    }
  }
  return best
    ? best.closest('a, button, [role="tab"], [role="button"]') || best
    : null;
}

function isSelected(el) {
  const tab = el.closest("[aria-selected]");
  return tab ? tab.getAttribute("aria-selected") === "true" : false;
}

function applyFollowingOnly() {
  if (lastPath !== location.pathname) {
    lastPath = location.pathname;
  }

  if (
    !settings.followingOnly ||
    location.pathname !== "/" ||
    isLoginScreen()
  ) {
    return;
  }

  const forYouTab = findTab(FOR_YOU);
  if (forYouTab) forYouTab.setAttribute("data-bi-for-you", "hide");

  if (!forYouTab || !isSelected(forYouTab)) return;

  const now = Date.now();
  if (now - forcedFollowingAt < 30000) return;

  const followingTab = findTab(FOLLOWING);
  if (followingTab) {
    forcedFollowingAt = now;
    followingTab.click();
  }
}

function applyHideSuggested() {
  if (isLoginScreen()) return;

  const nodes = document.querySelectorAll(
    'span, h1, h2, h3, [role="heading"]'
  );
  for (const el of nodes) {
    if (!SUGGESTED.includes(normalize(el.textContent))) continue;
    const target = el.closest("article") || el.parentElement;
    if (target && target.getAttribute("data-bi-suggested") !== "hide") {
      target.setAttribute("data-bi-suggested", "hide");
    }
  }
}

function resolveView(path) {
  if (path === "/") return "feed";
  if (path.startsWith("/direct")) return "direct";
  if (path.startsWith("/reels")) return "reels";
  if (path.startsWith("/reel/")) return "reel";
  if (path.startsWith("/explore")) return "explore";
  return "other";
}

function renderNow() {
  ROOT.dataset.biReels = settings.reels ? "on" : "off";
  ROOT.dataset.biExplore = settings.explore ? "on" : "off";
  ROOT.dataset.biView = resolveView(location.pathname);

  const feedLoaded =
    location.pathname === "/" &&
    !!document.querySelector('main[role="main"] article');
  ROOT.dataset.biFeedLoaded = feedLoaded ? "on" : "off";

  applyFollowingOnly();
  applyHideSuggested();
}

let scheduled = false;
function render() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    renderNow();
  });
}

function load() {
  if (!chrome?.storage?.sync) {
    render();
    return;
  }
  chrome.storage.sync.get(DEFAULTS, (stored) => {
    settings = { ...DEFAULTS, ...stored };
    render();
  });
}

load();

if (chrome?.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    for (const [key, { newValue }] of Object.entries(changes)) {
      if (key in DEFAULTS) settings[key] = newValue;
    }
    render();
  });
}

["pushState", "replaceState"].forEach((method) => {
  const original = history[method];
  history[method] = function (...args) {
    const result = original.apply(this, args);
    render();
    return result;
  };
});

window.addEventListener("popstate", render);

const observer = new MutationObserver(render);
observer.observe(ROOT, { childList: true, subtree: true });