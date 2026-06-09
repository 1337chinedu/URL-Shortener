/* =============================================
   SNIP — URL Shortener Frontend Logic
   File: frontend/app.js
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
    const { hostname, pathname } = new URL(url);
    const path = pathname.length > 1 ? pathname.slice(0, 18) + "…" : "";
    return hostname + path;
  } catch {
    return url.slice(0, 36) + "…";
  }
}

let toastTimer;
function showToast(msg, isError = false) {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function animateValue(el, newVal) {
  el.style.transform = "translateY(-4px)";
  el.style.opacity = "0";
  setTimeout(() => {
    el.textContent = newVal;
    el.style.transform = "translateY(4px)";
    setTimeout(() => {
      el.style.transition = "transform 0.25s ease, opacity 0.25s ease";
      el.style.transform = "translateY(0)";
      el.style.opacity = "1";
    }, 20);
  }, 150);
}

/* ── Shorten a URL ── */
async function shortenURL() {
  const url = urlInput.value.trim();

  urlInput.classList.remove("error");

  if (!url) {
    showToast("Please paste a URL first", true);
    urlInput.classList.add("error");
    urlInput.focus();
    return;
  }

  try {
    new URL(url);
  } catch {
    showToast("URL must start with http:// or https://", true);
    urlInput.classList.add("error");
    urlInput.focus();
    return;
  }

  /* Loading state */
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

    /* Show result banner */
    resultUrl.textContent = data.short_url;
    copyText.textContent = "Copy";
    btnCopy.classList.remove("copied");
    resultBanner.classList.add("visible");

    urlInput.value = "";
    showToast("Short link created!");

    loadHistory();
  } catch (err) {
    showToast("Network error — is the server running?", true);
    console.error(err);
  } finally {
    btnShorten.classList.remove("loading");
    btnShorten.disabled = false;
  }
}

/* ── Copy the result URL ── */
function copyResult() {
  const url = resultUrl.textContent;
  if (!url) return;

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(url).then(() => {
      copyText.textContent = "Copied!";
      btnCopy.classList.add("copied");
      showToast("Copied to clipboard");
      setTimeout(() => {
        copyText.textContent = "Copy";
        btnCopy.classList.remove("copied");
      }, 2200);
    });
  } else {
    // Fallback for HTTP
    const el = document.createElement("textarea");
    el.value = url;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    copyText.textContent = "Copied!";
    btnCopy.classList.add("copied");
    showToast("Copied to clipboard");
    setTimeout(() => {
      copyText.textContent = "Copy";
      btnCopy.classList.remove("copied");
    }, 2200);
  }
}

/* ── Copy any short link from history ── */
function copyLink(shortCode) {
  const url = `${window.location.origin}/${shortCode}`;
  navigator.clipboard
    .writeText(url)
    .then(() => showToast("Copied to clipboard"));
}

/* ── Delete a short link ── */
async function deleteLink(shortCode, itemEl) {
  /* Animate row out before the network call for snappier feel */
  if (itemEl) {
    itemEl.style.transition = "opacity 0.2s, transform 0.2s";
    itemEl.style.opacity = "0";
    itemEl.style.transform = "translateX(8px)";
  }

  try {
    const res = await fetch(`/api/urls/${shortCode}`, { method: "DELETE" });

    if (!res.ok) {
      const data = await res.json();
      showToast(data.error || "Could not delete link", true);
      if (itemEl) {
        itemEl.style.opacity = "1";
        itemEl.style.transform = "none";
      }
      return;
    }

    showToast("Link deleted");
    loadHistory();
  } catch (err) {
    showToast("Network error", true);
    if (itemEl) {
      itemEl.style.opacity = "1";
      itemEl.style.transform = "none";
    }
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
    item.style.animationDelay = `${i * 0.045}s`;

    item.innerHTML = `
      <div class="history-original" title="${link.original_url}">${formatHostname(link.original_url)}</div>
      <div class="history-short" title="${window.location.origin}/${link.short_code}">/${link.short_code}</div>
      <div class="history-actions">
        <button class="btn-icon" title="Copy link" aria-label="Copy short link">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="4.5" y="4.5" width="7" height="8" rx="1.2" stroke="currentColor" stroke-width="1.3"/>
            <path d="M2.5 9H2a.8.8 0 01-.8-.8V2a.8.8 0 01.8-.8H8a.8.8 0 01.8.8v.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="btn-icon del" title="Delete link" aria-label="Delete short link">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M11 3.5l-.7 7.7a1 1 0 01-1 .8H4.7a1 1 0 01-1-.8L3 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    `;

    item
      .querySelector(".btn-icon:not(.del)")
      .addEventListener("click", () => copyLink(link.short_code));
    item
      .querySelector(".btn-icon.del")
      .addEventListener("click", () => deleteLink(link.short_code, item));

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

  const fmtSaved = saved > 999 ? (saved / 1000).toFixed(1) + "k" : saved;

  if (statTotal.textContent !== String(total)) animateValue(statTotal, total);
  if (statClicks.textContent !== String(clicks))
    animateValue(statClicks, clicks);
  if (statSaved.textContent !== String(fmtSaved))
    animateValue(statSaved, fmtSaved);
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
