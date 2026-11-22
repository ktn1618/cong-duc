// Shows the selected text in a large, high-contrast card next to the selection.
const FONT_PX = 34;
const MAX_CHARS = 600;
let enabled = true;
let card = null;

chrome.storage.local.get({ enabled: true }, (v) => { enabled = v.enabled; });
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    enabled = changes.enabled.newValue;
    if (!enabled) hide();
  }
});

function hide() {
  if (card) card.remove();
  card = null;
}

function show(text, rect) {
  hide();
  card = document.createElement("div");
  card.textContent = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) + "…" : text;
  Object.assign(card.style, {
    all: "initial",
    position: "fixed",
    zIndex: "2147483647",
    maxWidth: "min(70vw, 900px)",
    padding: "20px 28px",
    background: "#111",
    color: "#fff",
    font: `600 ${FONT_PX}px/1.35 system-ui, sans-serif`,
    borderRadius: "14px",
    boxShadow: "0 8px 40px rgba(0,0,0,.5)",
    border: "3px solid #ffd54a",
    pointerEvents: "none",
    visibility: "hidden",
  });
  document.documentElement.appendChild(card);

  // Place below the selection if it fits, otherwise above; keep inside the viewport.
  const box = card.getBoundingClientRect();
  const gap = 14;
  let top = rect.bottom + gap;
  if (top + box.height > innerHeight) top = Math.max(gap, rect.top - box.height - gap);
  let left = Math.min(Math.max(gap, rect.left), innerWidth - box.width - gap);
  card.style.top = `${top}px`;
  card.style.left = `${Math.max(gap, left)}px`;
  card.style.visibility = "visible";
}

// Blank note card (Alt+N) to type grammar points while the highlight card stays visible.
let note = null;

function toggleNote() {
  if (note) {
    note.remove();
    note = null;
    return;
  }
  note = document.createElement("div");
  note.contentEditable = "plaintext-only";
  note.spellcheck = false;
  Object.assign(note.style, {
    all: "initial",
    position: "fixed",
    top: "24px",
    right: "24px",
    zIndex: "2147483647",
    boxSizing: "border-box",
    width: "min(36vw, 560px)",
    minHeight: "140px",
    padding: "20px 28px",
    background: "#111",
    color: "#fff",
    font: `600 ${FONT_PX}px/1.35 system-ui, sans-serif`,
    whiteSpace: "pre-wrap",
    outline: "none",
    borderRadius: "14px",
    boxShadow: "0 8px 40px rgba(0,0,0,.5)",
    border: "3px solid #4dd0e1",
    cursor: "text",
  });
  // Keep typing away from the page's own keyboard shortcuts.
  for (const type of ["keydown", "keyup", "keypress"]) {
    note.addEventListener(type, (e) => {
      if (!(e.altKey && e.code === "KeyN")) e.stopPropagation();
    });
  }
  document.documentElement.appendChild(note);
  note.focus();
}

document.addEventListener("keydown", (e) => {
  if (e.altKey && e.code === "KeyN") {
    e.preventDefault();
    toggleNote();
  }
});

const inNote = (target) => note && note.contains(target);

document.addEventListener("mouseup", (e) => {
  if (inNote(e.target)) return;
  // Wait a tick so the browser has updated the selection.
  setTimeout(() => {
    const sel = getSelection();
    const text = sel ? sel.toString().trim() : "";
    if (!enabled || !text || sel.rangeCount === 0) return hide();
    show(text, sel.getRangeAt(0).getBoundingClientRect());
  }, 0);
});

document.addEventListener("mousedown", (e) => { if (!inNote(e.target)) hide(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") hide(); });
document.addEventListener("scroll", hide, true);
