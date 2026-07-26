// Isolated-world content script: receives reel data from interceptor.js,
// keeps a deduped collection, and renders the Highwater side panel.
(() => {
  const EVENT_NAME = "highwater:media";
  const reels = new Map(); // code -> reel
  let keywords = [];
  let panelOpen = false;
  let sortBy = "views";
  let renderQueued = false;

  // ---- storage -----------------------------------------------------------

  chrome.storage.local.get(["keywords", "panelOpen", "sortBy", "collected"], (data) => {
    keywords = Array.isArray(data.keywords) ? data.keywords : [];
    panelOpen = Boolean(data.panelOpen);
    if (typeof data.sortBy === "string") sortBy = data.sortBy;
    // Restore the collection so it survives navigating between topic pages.
    if (Array.isArray(data.collected)) {
      for (const item of data.collected) {
        if (item && item.code) reels.set(item.code, item);
      }
    }
    buildUi();
    render();
  });

  function saveKeywords() {
    chrome.storage.local.set({ keywords });
  }

  const MAX_STORED = 1500;

  function persistCollection() {
    let items = [...reels.values()];
    if (items.length > MAX_STORED) {
      items = items.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, MAX_STORED);
    }
    chrome.storage.local.set({ collected: items });
  }

  // ---- data intake ---------------------------------------------------------

  document.addEventListener(EVENT_NAME, (e) => {
    let items;
    try {
      items = JSON.parse(e.detail);
    } catch (_) {
      return;
    }
    let added = false;
    for (const item of items) {
      const existing = reels.get(item.code);
      if (!existing) {
        reels.set(item.code, item);
        added = true;
      } else {
        // Different endpoints return different subsets of fields for the
        // same post — merge, keeping the freshest non-null values.
        for (const key of ["views", "likes", "comments", "takenAt", "thumb", "username"]) {
          if (item[key] !== null && item[key] !== undefined) existing[key] = item[key];
        }
        if (item.caption) existing.caption = item.caption;
        if (item.isVideo) existing.isVideo = true;
        added = true;
      }
    }
    if (added) queueRender();
  });

  function queueRender() {
    if (renderQueued) return;
    renderQueued = true;
    setTimeout(() => {
      renderQueued = false;
      render();
      persistCollection();
    }, 400);
  }

  // ---- filtering / formatting ---------------------------------------------

  function matchesKeywords(reel) {
    if (!keywords.length) return true;
    const haystack = (reel.caption + " " + (reel.username || "")).toLowerCase();
    return keywords.some((kw) => haystack.includes(kw));
  }

  function formatCount(n) {
    if (n === null || n === undefined) return "—";
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }

  function formatDate(unixSeconds) {
    if (!unixSeconds) return "";
    const d = new Date(unixSeconds * 1000);
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "2-digit" });
  }

  const SORTS = {
    views: (a, b) => (b.views || 0) - (a.views || 0),
    likes: (a, b) => (b.likes || 0) - (a.likes || 0),
    comments: (a, b) => (b.comments || 0) - (a.comments || 0),
    newest: (a, b) => (b.takenAt || 0) - (a.takenAt || 0),
    oldest: (a, b) => (a.takenAt || Infinity) - (b.takenAt || Infinity)
  };

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  // ---- export ---------------------------------------------------------------

  function exportXlsx() {
    // Respects the topic chips, but always orders by views for the sheet.
    // The reader can re-sort by any column with the table's own dropdowns.
    const rows = [...reels.values()]
      .filter(matchesKeywords)
      .sort(SORTS.views)
      .map((r) => [
        `https://www.instagram.com/${r.isVideo ? "reel" : "p"}/${r.code}/`,
        r.views,
        r.likes,
        r.comments,
        r.username || "",
        r.takenAt ? new Date(r.takenAt * 1000).toISOString().slice(0, 10) : ""
      ]);
    if (!rows.length) return;

    const columns = [
      { name: "Link", width: 42, type: "link" },
      { name: "Views", width: 12, type: "num" },
      { name: "Likes", width: 12, type: "num" },
      { name: "Comments", width: 12, type: "num" },
      { name: "Username", width: 22, type: "str" },
      { name: "Date", width: 12, type: "str" }
    ];

    const blob = window.HighwaterXlsx.makeXlsx(columns, rows, "Reels");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `highwater-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ---- UI -------------------------------------------------------------------

  let fab, panel, listEl, countEl, filteredCountEl, kwListEl;

  function buildUi() {
    if (document.getElementById("highwater-fab")) return;

    fab = document.createElement("button");
    fab.id = "highwater-fab";
    fab.title = "Highwater";
    fab.innerHTML = '▶ <span id="highwater-fab-count">0</span>';
    fab.addEventListener("click", () => {
      panelOpen = !panelOpen;
      chrome.storage.local.set({ panelOpen });
      panel.classList.toggle("highwater-open", panelOpen);
    });
    document.documentElement.appendChild(fab);

    panel = document.createElement("div");
    panel.id = "highwater-panel";
    panel.classList.toggle("highwater-open", panelOpen);
    panel.innerHTML = `
      <div class="highwater-header">
        <strong>Highwater</strong>
        <span class="highwater-sub">Explore &amp; profiles</span>
        <button id="highwater-close" title="Close">×</button>
      </div>
      <div class="highwater-controls">
        <label class="highwater-sort-row">Sort by
          <select id="highwater-sort">
            <option value="views">Most views</option>
            <option value="likes">Most likes</option>
            <option value="comments">Most comments</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </label>
        <input id="highwater-kw-input" type="text"
          placeholder="Add topic (e.g. content or #contentcreator) + Enter" />
        <div id="highwater-kw-list"></div>
        <div class="highwater-hint">Click a topic to search Instagram and pull
          its reels into the panel. × removes it.</div>
        <div id="highwater-status"></div>
        <div class="highwater-counts">
          <span id="highwater-filtered-count">0</span> shown ·
          <span id="highwater-count">0</span> collected
        </div>
        <div class="highwater-btn-row">
          <button id="highwater-autoscroll">Auto-scroll: off</button>
          <button id="highwater-clear">Clear collected</button>
          <button id="highwater-export" title="Download the shown list as an Excel workbook">Export ⤓</button>
        </div>
      </div>
      <div id="highwater-list"></div>`;
    document.documentElement.appendChild(panel);

    listEl = panel.querySelector("#highwater-list");
    countEl = panel.querySelector("#highwater-count");
    filteredCountEl = panel.querySelector("#highwater-filtered-count");
    kwListEl = panel.querySelector("#highwater-kw-list");

    panel.querySelector("#highwater-close").addEventListener("click", () => {
      panelOpen = false;
      chrome.storage.local.set({ panelOpen });
      panel.classList.remove("highwater-open");
    });

    const sortSel = panel.querySelector("#highwater-sort");
    sortSel.value = sortBy;
    sortSel.addEventListener("change", () => {
      sortBy = sortSel.value;
      chrome.storage.local.set({ sortBy });
      render();
    });

    panel.querySelector("#highwater-clear").addEventListener("click", () => {
      reels.clear();
      chrome.storage.local.remove("collected");
      render();
    });

    panel.querySelector("#highwater-export").addEventListener("click", exportXlsx);

    // Auto-scroll: scrolls the page so Instagram keeps loading more posts
    // while the collector fills up. Manual toggle, stops on click.
    const autoBtn = panel.querySelector("#highwater-autoscroll");
    let autoTimer = null;
    autoBtn.addEventListener("click", () => {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
        autoBtn.textContent = "Auto-scroll: off";
        autoBtn.classList.remove("highwater-on");
      } else {
        autoTimer = setInterval(() => {
          window.scrollBy({ top: 900, behavior: "smooth" });
        }, 1500);
        autoBtn.textContent = "Auto-scroll: ON";
        autoBtn.classList.add("highwater-on");
      }
    });

    const input = panel.querySelector("#highwater-kw-input");
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const kw = input.value.trim().toLowerCase();
      if (kw) {
        if (!keywords.includes(kw)) {
          keywords.push(kw);
          saveKeywords();
          render();
        }
        // Search immediately — adding a topic should fetch it, not wait for
        // a second click on the chip.
        document.dispatchEvent(
          new CustomEvent("highwater:fetch", { detail: kw })
        );
      }
      input.value = "";
    });

    kwListEl.addEventListener("click", (e) => {
      const remove = e.target.closest("[data-kw]");
      if (remove) {
        keywords = keywords.filter((k) => k !== remove.dataset.kw);
        saveKeywords();
        render();
        return;
      }
      const go = e.target.closest("[data-go]");
      if (go) {
        // Ask the page-world script to query Instagram's search API for this
        // topic; results flow back through the normal media event.
        document.dispatchEvent(
          new CustomEvent("highwater:fetch", { detail: go.dataset.go })
        );
      }
    });

    document.addEventListener("highwater:status", (e) => {
      const el = panel.querySelector("#highwater-status");
      if (el) el.textContent = String(e.detail || "");
    });
  }

  function render() {
    if (!listEl) return;

    kwListEl.innerHTML = keywords
      .map(
        (kw) =>
          `<span class="highwater-chip">
            <span data-go="${escapeHtml(kw)}" title="Browse this topic's feed">${escapeHtml(kw)}</span>
            <span class="highwater-chip-x" data-kw="${escapeHtml(kw)}" title="Remove">×</span>
          </span>`
      )
      .join("");

    const sorted = [...reels.values()]
      .filter(matchesKeywords)
      .sort(SORTS[sortBy] || SORTS.views);

    countEl.textContent = String(reels.size);
    filteredCountEl.textContent = String(sorted.length);
    const fabCount = document.getElementById("highwater-fab-count");
    if (fabCount) fabCount.textContent = formatCount(reels.size);

    if (!sorted.length) {
      listEl.innerHTML = `<div class="highwater-empty">${
        reels.size
          ? "None of the " + reels.size + " collected posts match your topics.<br><br>" +
            "Click a chip (or press Enter on a topic) to search Instagram for it, " +
            "or remove chips with × to see everything collected."
          : "Nothing collected yet.<br><br>Type a topic and press Enter to search " +
            "Instagram, or scroll Explore / a profile to collect posts."
      }</div>`;
      return;
    }

    listEl.innerHTML = sorted
      .slice(0, 300)
      .map((r) => {
        const cap = escapeHtml(r.caption.slice(0, 90)) || "<em>(no caption)</em>";
        const thumb = r.thumb
          ? `<img src="${escapeHtml(r.thumb)}" loading="lazy" alt="" />`
          : `<div class="highwater-nothumb">▶</div>`;
        const path = r.isVideo ? "reel" : "p";
        const date = formatDate(r.takenAt);
        return `
        <a class="highwater-item" href="https://www.instagram.com/${path}/${escapeHtml(r.code)}/"
           target="_blank" rel="noopener">
          ${thumb}
          <div class="highwater-meta">
            <div class="highwater-views">▶ ${formatCount(r.views)}
              <span class="highwater-likes">♥ ${formatCount(r.likes)}</span>
              <span class="highwater-likes">💬 ${formatCount(r.comments)}</span>
            </div>
            <div class="highwater-user">@${escapeHtml(r.username || "unknown")}
              ${date ? `<span class="highwater-date">· ${date}</span>` : ""}
            </div>
            <div class="highwater-caption">${cap}</div>
          </div>
        </a>`;
      })
      .join("");
  }
})();
