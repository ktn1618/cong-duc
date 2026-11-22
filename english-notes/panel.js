const editor = document.getElementById("editor");
const store = chrome.storage.local;
let size = 20;

// ---- load saved state ----
store.get(["html", "size", "dark"], (s) => {
  if (s.html) editor.innerHTML = s.html;
  if (s.size) size = s.size;
  if (s.dark) document.body.classList.add("dark");
  editor.style.fontSize = size + "px";
  editor.focus();
});

// ---- autosave (debounced) ----
let t;
function save() {
  clearTimeout(t);
  t = setTimeout(() => store.set({ html: editor.innerHTML }), 300);
}
editor.addEventListener("input", save);

// ---- helpers ----
function highlight(color) {
  editor.focus();
  document.execCommand("styleWithCSS", false, true);
  document.execCommand("hiliteColor", false, color);
  save();
}
function clearHighlight() {
  editor.focus();
  document.execCommand("styleWithCSS", false, true);
  document.execCommand("hiliteColor", false, "transparent");
  save();
}
function setSize(n) {
  size = Math.max(14, Math.min(72, n));
  editor.style.fontSize = size + "px";
  store.set({ size });
}

// ---- toolbar ----
document.querySelectorAll(".hl").forEach((b) =>
  b.addEventListener("mousedown", (e) => { e.preventDefault(); highlight(b.dataset.color); })
);
document.getElementById("clearhl").addEventListener("mousedown", (e) => { e.preventDefault(); clearHighlight(); });
document.getElementById("bigger").addEventListener("click", () => setSize(size + 4));
document.getElementById("smaller").addEventListener("click", () => setSize(size - 4));
document.getElementById("theme").addEventListener("click", () => {
  const dark = document.body.classList.toggle("dark");
  store.set({ dark });
});
document.getElementById("clear").addEventListener("click", () => {
  if (confirm("Clear all notes?")) {
    editor.innerHTML = "";
    store.set({ html: "" });
    editor.focus();
  }
});

// ---- keyboard shortcuts ----
editor.addEventListener("keydown", (e) => {
  if (e.altKey && e.key === "1") { e.preventDefault(); highlight("#fff176"); }
  else if (e.altKey && e.key === "2") { e.preventDefault(); highlight("#a5f3a0"); }
  else if (e.altKey && e.key === "3") { e.preventDefault(); highlight("#ffb3d1"); }
  else if (e.altKey && e.key === "0") { e.preventDefault(); clearHighlight(); }
  else if (e.ctrlKey && (e.key === "=" || e.key === "+")) { e.preventDefault(); setSize(size + 4); }
  else if (e.ctrlKey && e.key === "-") { e.preventDefault(); setSize(size - 4); }
});

// ---- "->" becomes an arrow ----
editor.addEventListener("input", (e) => {
  if (e.inputType !== "insertText" || e.data !== ">") return;
  const sel = window.getSelection();
  if (!sel.rangeCount || !sel.isCollapsed) return;
  const node = sel.anchorNode, off = sel.anchorOffset;
  if (node.nodeType !== Node.TEXT_NODE || off < 2) return;
  if (node.data.slice(off - 2, off) !== "->") return;
  node.data = node.data.slice(0, off - 2) + "→" + node.data.slice(off);
  sel.collapse(node, off - 1);
  save();
});

// ---- paste as plain text (keeps notes clean) ----
editor.addEventListener("paste", (e) => {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData("text/plain");
  document.execCommand("insertText", false, text);
});
