/* =============================================
   SNIP — URL Shortener Frontend Logic
   File: frontend/static/app.js
   All data comes from the Node.js + PostgreSQL backend.
   ============================================= */

/* ── DOM references ── */
const urlInput = document.getElementById("url-input");
const btnShorten = document.getElementById("btn-shorten");
const btnCopy = document.getElementById("btn-copy");
const resultBanner = document.getElementById("result-banner");
const resultUrl = document.getElementById("result-url");
const copyText = document.getElementById("copy-text");
const historyList = document.getElementById("history-list");
const emptyState = document.getElementById("empty-state");
const toast = document.getElementById("toast");
const statTotal = document.getElementById("stat-total");
const statClicks = document.getElementById("stat-clicks");
const statSaved = document.getElementById("stat-saved");

/* ── Helpers ── */
function formatHostname(url) {
  try {
    return new URL(url).hostname + "…";
  } catch {
    return url.slice(0, 30) + "…";
  }
}

function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.style.borderColor = isError ? "var(--danger)" : "var(--accent)";
  toast.style.color = isError ? "var(--danger)" : "var(--accent)";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2400);
}

/* ── Shorten a URL ── */
async function shortenURL() {
  const url = urlInput.value.trim();

  urlInput.classList.remove("error");

  if (!url) {
    showToast("Please enter a URL first", true);
    urlInput.classList.add("error");
    return;
  }

  // Basic client-side validation before hitting the server
  try {
    new URL(url);
  } catch {
    showToast("URL must start with http:// or https://", true);
    urlInput.classList.add("error");
    return;
  }

  // Loading state
  btnShorten.textContent = "...";
  btnShorten.classList.add("loading");
  btnShorten.disabled = true;

  try {
    const res = await fetch("/api/shorten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Something went wrong", true);
      return;
    }

    // Show result banner
    resultUrl.textContent = data.short_url;
    copyText.textContent = "Copy";
    btnCopy.classList.remove("copied");
    resultBanner.classList.add("visible");

    urlInput.value = "";
    showToast("Short link created!");

    // Refresh history from the server
    loadHistory();
  } catch (err) {
    showToast("Network error — is the server running?", true);
    console.error(err);
  } finally {
    btnShorten.textContent = "Shorten →";
    btnShorten.classList.remove("loading");
    btnShorten.disabled = false;
  }
}

/* ── Copy the result URL ── */
function copyResult() {
  const url = resultUrl.textContent;
  if (!url) return;

  navigator.clipboard.writeText(url).then(() => {
    copyText.textContent = "Copied!";
    btnCopy.classList.add("copied");
    setTimeout(() => {
      copyText.textContent = "Copy";
      btnCopy.classList.remove("copied");
    }, 2000);
  });
}

/* ── Copy any short link from history ── */
function copyLink(shortCode) {
  const url = `${window.location.origin}/${shortCode}`;
  navigator.clipboard.writeText(url);
  showToast("Copied to clipboard");
}

/* ── Delete a short link ── */
async function deleteLink(shortCode) {
  try {
    const res = await fetch(`/api/urls/${shortCode}`, { method: "DELETE" });

    if (!res.ok) {
      const data = await res.json();
      showToast(data.error || "Could not delete link", true);
      return;
    }

    showToast("Link deleted");
    loadHistory();
  } catch (err) {
    showToast("Network error", true);
    console.error(err);
  }
}

/* ── Load URL history from the backend ── */
async function loadHistory() {
  try {
    const res = await fetch("/api/urls");
    const urls = await res.json();

    if (!res.ok) {
      console.error("Failed to load history");
      return;
    }

    renderHistory(urls);
    updateStats(urls);
  } catch (err) {
    console.error("Could not fetch history:", err);
  }
}

/* ── Render the history table ── */
function renderHistory(urls) {
  historyList.innerHTML = "";

  if (!urls || urls.length === 0) {
    historyList.appendChild(emptyState);
    return;
  }

  urls.forEach((link, i) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.style.animationDelay = `${i * 0.04}s`;

    item.innerHTML = `
      <div class="history-original" title="${link.original_url}">${formatHostname(link.original_url)}</div>
      <div class="history-short"    title="/${link.short_code}">/${link.short_code}</div>
      <div class="history-actions">
        <button class="btn-icon"     title="Copy link">⎘</button>
        <button class="btn-icon del" title="Delete">✕</button>
      </div>
    `;

    // Attach listeners to buttons (avoids inline onclick with user data)
    item
      .querySelector(".btn-icon:not(.del)")
      .addEventListener("click", () => copyLink(link.short_code));
    item
      .querySelector(".btn-icon.del")
      .addEventListener("click", () => deleteLink(link.short_code));

    historyList.appendChild(item);
  });
}

/* ── Update the three stats counters ── */
function updateStats(urls) {
  const total = urls.length;
  const clicks = urls.reduce((acc, l) => acc + (l.clicks || 0), 0);
  const saved = urls.reduce((acc, l) => {
    const shortLen = (window.location.origin + "/" + l.short_code).length;
    return acc + Math.max(0, l.original_url.length - shortLen);
  }, 0);

  statTotal.textContent = total;
  statClicks.textContent = clicks;
  statSaved.textContent = saved > 999 ? (saved / 1000).toFixed(1) + "k" : saved;
}

/* ── Event listeners ── */
btnShorten.addEventListener("click", shortenURL);
btnCopy.addEventListener("click", copyResult);

urlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") shortenURL();
});

urlInput.addEventListener("input", () => {
  urlInput.classList.remove("error");
});

/* ── Init ── */
loadHistory();
