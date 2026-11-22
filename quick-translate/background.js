// ---- translation (unofficial free Google Translate endpoint) ----
async function translateOnce(q, tl) {
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" + tl +
    "&dt=t&dt=bd&q=" + encodeURIComponent(q);
  const r = await fetch(url);
  if (!r.ok) throw new Error("HTTP " + r.status);
  const d = await r.json();
  return {
    text: (d[0] || []).map((x) => x[0]).join(""),
    src: d[2],
    tl,
    dict: (d[1] || []).map((e) => ({ pos: e[0], words: (e[1] || []).slice(0, 5) }))
  };
}

// English -> Vietnamese by default; if the input is already Vietnamese, go to English.
async function smartTranslate(q) {
  let res = await translateOnce(q, "vi");
  if (res.src === "vi") res = await translateOnce(q, "en");
  return res;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "translate") {
    smartTranslate(String(msg.q).slice(0, 2000))
      .then((r) => sendResponse({ ok: true, ...r }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true; // async response
  }
});

// ---- right-click menu ----
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "translate-selection",
      title: "Dịch: “%s”",
      contexts: ["selection"]
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translate-selection" && tab && tab.id != null) {
    chrome.tabs.sendMessage(tab.id, { type: "show", q: info.selectionText }).catch(() => {});
  }
});

// ---- keyboard shortcut (Alt+T): open bar, translate selection if any ----
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "open-translate" && tab && tab.id != null) {
    chrome.tabs.sendMessage(tab.id, { type: "open" }).catch(() => {});
  }
});
