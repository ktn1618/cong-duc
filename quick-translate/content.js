(() => {
  if (window.top !== window) return; // only the top frame shows the bar
  if (window.__quickTranslateLoaded) return;
  window.__quickTranslateLoaded = true;

  const host = document.createElement("div");
  host.style.cssText = "all:initial;";
  const root = host.attachShadow({ mode: "closed" });

  root.innerHTML = `
    <style>
      .bar {
        position: fixed; right: 16px; bottom: 16px; width: 340px; max-height: 50vh;
        overflow: auto; display: none; box-sizing: border-box; padding: 10px;
        background: #fff; color: #111; border: 1px solid #d0d0d0; border-radius: 10px;
        box-shadow: 0 6px 24px rgba(0,0,0,.25); z-index: 2147483647;
        font: 14px/1.45 -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      }
      .row { display: flex; gap: 6px; }
      input {
        flex: 1; min-width: 0; padding: 6px 8px; font: inherit;
        border: 1px solid #c8c8c8; border-radius: 6px; background: #fff; color: #000;
      }
      button {
        padding: 4px 9px; font: inherit; cursor: pointer;
        border: 1px solid #c8c8c8; border-radius: 6px; background: #f4f4f4; color: inherit;
      }
      #out { margin-top: 8px; }
      .main { font-size: 18px; font-weight: 600; }
      .meta { opacity: .6; font-size: 12px; margin-bottom: 2px; }
      .dict { margin-top: 6px; font-size: 13px; }
      .dict b { opacity: .7; font-weight: 600; }
      .err { color: #c62828; }
    </style>
    <div class="bar" id="bar">
      <div class="row">
        <input id="q" type="text" placeholder="Nhập từ / câu rồi Enter…" spellcheck="false">
        <button id="close" title="Đóng (Esc)">✕</button>
      </div>
      <div id="out"></div>
    </div>`;
  document.documentElement.appendChild(host);

  const bar = root.getElementById("bar");
  const input = root.getElementById("q");
  const out = root.getElementById("out");

  function openBar() { bar.style.display = "block"; }
  function closeBar() { bar.style.display = "none"; }

  function render(res) {
    out.textContent = "";
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = (res.src || "?") + " → " + res.tl;
    const main = document.createElement("div");
    main.className = "main";
    main.textContent = res.text;
    out.append(meta, main);
    if (res.dict && res.dict.length) {
      const d = document.createElement("div");
      d.className = "dict";
      res.dict.slice(0, 4).forEach((e) => {
        const line = document.createElement("div");
        const pos = document.createElement("b");
        pos.textContent = e.pos + ": ";
        line.append(pos, document.createTextNode(e.words.join(", ")));
        d.appendChild(line);
      });
      out.appendChild(d);
    }
  }

  function showError(msg) {
    out.textContent = "";
    const e = document.createElement("div");
    e.className = "err";
    e.textContent = msg;
    out.appendChild(e);
  }

  function run(q) {
    q = (q || "").trim();
    if (!q) return;
    input.value = q;
    openBar();
    out.textContent = "…";
    chrome.runtime.sendMessage({ type: "translate", q }, (res) => {
      if (chrome.runtime.lastError || !res) return showError("Không dịch được. Thử lại nhé.");
      if (!res.ok) return showError("Lỗi: " + res.error);
      render(res);
    });
  }

  input.addEventListener("keydown", (e) => {
    e.stopPropagation(); // keep page shortcuts from stealing keys
    if (e.key === "Enter") run(input.value);
    if (e.key === "Escape") closeBar();
  });
  input.addEventListener("keyup", (e) => e.stopPropagation());
  input.addEventListener("keypress", (e) => e.stopPropagation());
  root.getElementById("close").addEventListener("click", closeBar);

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "show") run(msg.q);
    if (msg.type === "open") {
      openBar();
      input.focus();
      input.select();
    }
  });
})();
