// Toolbar icon click toggles the zoom card; "OFF" badge shows when disabled.
function showBadge(enabled) {
  chrome.action.setBadgeText({ text: enabled ? "" : "OFF" });
}

chrome.storage.local.get({ enabled: true }, ({ enabled }) => showBadge(enabled));

chrome.action.onClicked.addListener(async () => {
  const { enabled } = await chrome.storage.local.get({ enabled: true });
  await chrome.storage.local.set({ enabled: !enabled });
  showBadge(!enabled);
});
