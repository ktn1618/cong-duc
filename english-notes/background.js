// Clicking the toolbar icon opens the side panel.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

// Keyboard shortcut (Alt+N by default) opens it too.
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "open-notes" && tab && tab.windowId) {
    chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
  }
});
