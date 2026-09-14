const DEFAULTS = {
  reels: true,
  explore: true,
  followingOnly: true,
};

const ids = ["reels", "explore", "followingOnly"];

chrome.storage.sync.get(DEFAULTS, (settings) => {
  ids.forEach((id) => {
    document.getElementById(id).checked = settings[id];
  });
});

ids.forEach((id) => {
  document.getElementById(id).addEventListener("change", (e) => {
    chrome.storage.sync.set({ [id]: e.target.checked });
  });
});