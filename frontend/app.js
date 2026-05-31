/* =============================================
   SNIP — URL Shortener Logic
   File: app.js
   ============================================= */

const BASE = "http://localhost";

/* ---------- State ---------- */
let links = JSON.parse(localStorage.getItem("snip_links") || "[]");
let totalClicks = parseInt(localStorage.getItem("snip_clicks") || "0");

/* ---------- Persistence ---------- */
function save() {
  localStorage.setItem("snip_links", JSON.stringify(links));
  localStorage.setItem("snip_clicks", totalClicks);
}

/* ---------- Helpers ---------- */
function generateCode() {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

function formatUrl(url) {
  try {
    return new URL(url).hostname + "…";
  } catch {
    return url.slice(0, 30) + "…";
  }
}

/* ---------- Shorten ---------- */
async function shortenURL() {
  const input = document.getElementById("url-input");
  const btn = document.getElementById("btn-shorten");
  const url = input.value.trim();

  if (!url) {
    showToast("Please enter a URL first");
    return;
  }

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    showToast("URL must start with http:// or https://");
    return;
  }

  /* Loading state */
  btn.textContent = "...";
  btn.classList.add("loading");
  btn.disabled = true;

  /* Simulates network latency.
     In production, replace with a real API call:

     const res  = await fetch('/shorten', {
       method:  'POST',
       headers: { 'Content-Type': 'application/json' },
       body:    JSON.stringify({ url })
     });
     const data = await res.json();
     const code = data.short_code;
  */
  await new Promise((r) => setTimeout(r, 600));

  const code = generateCode();
  const shortUrl = `${BASE}/${code}`;

  const entry = {
    id: Date.now(),
    original: url,
    short: shortUrl,
    code,
    clicks: 0,
    created: new Date().toLocaleTimeString(),
  };

  links.unshift(entry);
  save();
  updateStats();
  renderHistory();
  showResult(shortUrl);

  input.value = "";
  btn.textContent = "Shorten →";
  btn.classList.remove("loading");
  btn.disabled = false;

  showToast("Link created successfully");
}

/* ---------- Result banner ---------- */
function showResult(url) {
  const banner = document.getElementById("result-banner");
  document.getElementById("result-url").textContent = url;
  document.getElementById("copy-text").textContent = "Copy";
  document.getElementById("btn-copy").classList.remove("copied");
  banner.classList.add("visible");
}

/* ---------- Copy ---------- */
function copyResult() {
  const url = document.getElementById("result-url").textContent;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById("btn-copy");
    document.getElementById("copy-text").textContent = "Copied!";
    btn.classList.add("copied");
    setTimeout(() => {
      document.getElementById("copy-text").textContent = "Copy";
      btn.classList.remove("copied");
    }, 2000);
  });
}

function copyLink(code) {
  navigator.clipboard.writeText(`${BASE}/${code}`);
  showToast("Copied to clipboard");
}

/* ---------- Delete ---------- */
function deleteLink(id) {
  links = links.filter((l) => l.id !== id);
  save();
  updateStats();
  renderHistory();
  showToast("Link deleted");
}

/* ---------- Simulate redirect ---------- */
function simulateClick(id) {
  const link = links.find((l) => l.id === id);
  if (link) {
    link.clicks++;
    totalClicks++;
    save();
    updateStats();
    renderHistory();
  }
  showToast("Redirect simulated");
}

/* ---------- Stats ---------- */
function updateStats() {
  document.getElementById("stat-total").textContent = links.length;
  document.getElementById("stat-clicks").textContent = totalClicks;

  const saved = links.reduce(
    (acc, l) => acc + Math.max(0, l.original.length - l.short.length),
    0,
  );
  document.getElementById("stat-saved").textContent =
    saved > 999 ? (saved / 1000).toFixed(1) + "k" : saved;
}

/* ---------- History render ---------- */
function renderHistory() {
  const list = document.getElementById("history-list");
  const empty = document.getElementById("empty-state");

  if (links.length === 0) {
    list.innerHTML = "";
    list.appendChild(empty);
    return;
  }

  list.innerHTML = "";

  links.forEach((link, i) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.style.animationDelay = `${i * 0.04}s`;

    item.innerHTML = `
      <div class="history-original" title="${link.original}">${formatUrl(link.original)}</div>
      <div class="history-short"    title="${link.short}">/${link.code}</div>
      <div class="history-actions">
        <button class="btn-icon"     onclick="copyLink('${link.code}')"    title="Copy">⎘</button>
        <button class="btn-icon"     onclick="simulateClick(${link.id})"   title="Simulate redirect">↗</button>
        <button class="btn-icon del" onclick="deleteLink(${link.id})"      title="Delete">✕</button>
      </div>
    `;

    list.appendChild(item);
  });
}

/* ---------- Toast ---------- */
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- Event listeners ---------- */
document.getElementById("url-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") shortenURL();
});

document.getElementById("btn-shorten").addEventListener("click", shortenURL);
document.getElementById("btn-copy").addEventListener("click", copyResult);

/* ---------- Init ---------- */
updateStats();
renderHistory();
