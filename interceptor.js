// Runs in the page's MAIN world. Hooks fetch/XHR so we can read the JSON
// Instagram already delivers to the browser (no extra requests are made),
// then forwards any reel media found to the content script via CustomEvent.
(() => {
  if (window.__highwaterHooked) return;
  window.__highwaterHooked = true;

  const EVENT_NAME = "highwater:media";

  function emit(items) {
    if (!items.length) return;
    document.dispatchEvent(
      new CustomEvent(EVENT_NAME, { detail: JSON.stringify(items) })
    );
  }

  // ---- media extraction -------------------------------------------------

  function pickViews(obj) {
    for (const key of ["play_count", "ig_play_count", "view_count", "video_view_count"]) {
      if (typeof obj[key] === "number") return obj[key];
    }
    return null;
  }

  // Instagram's private API shape (api/v1): { code, play_count, caption: { text }, ... }
  function fromApiMedia(obj) {
    if (typeof obj.code !== "string") return null;
    const views = pickViews(obj);
    const likes = typeof obj.like_count === "number" ? obj.like_count : null;
    // Accept photo posts too (no play_count) so profile sorting by
    // likes/comments/date covers the whole grid.
    if (views === null && (likes === null || obj.media_type === undefined)) return null;
    const candidates =
      (obj.image_versions2 && obj.image_versions2.candidates) || [];
    return {
      code: obj.code,
      views,
      likes,
      comments: typeof obj.comment_count === "number" ? obj.comment_count : null,
      takenAt: typeof obj.taken_at === "number" ? obj.taken_at : null,
      isVideo: obj.media_type === 2 || obj.product_type === "clips",
      caption: (obj.caption && obj.caption.text) || "",
      thumb: candidates.length ? candidates[candidates.length - 1].url : null,
      username: (obj.user && obj.user.username) || (obj.owner && obj.owner.username) || null
    };
  }

  // Web GraphQL shape: { shortcode, video_view_count, edge_media_to_caption, thumbnail_src }
  function fromGraphqlNode(obj) {
    if (typeof obj.shortcode !== "string") return null;
    const views = pickViews(obj);
    let likes = null;
    try {
      likes = obj.edge_liked_by ? obj.edge_liked_by.count : obj.edge_media_preview_like.count;
    } catch (_) {}
    if (views === null && likes === null) return null;
    let caption = "";
    try {
      caption = obj.edge_media_to_caption.edges[0].node.text || "";
    } catch (_) {}
    let comments = null;
    try {
      comments = obj.edge_media_to_comment.count;
    } catch (_) {}
    return {
      code: obj.shortcode,
      views,
      likes,
      comments: typeof comments === "number" ? comments : null,
      takenAt: typeof obj.taken_at_timestamp === "number" ? obj.taken_at_timestamp : null,
      isVideo: Boolean(obj.is_video),
      caption,
      thumb: obj.thumbnail_src || obj.display_url || null,
      username: (obj.owner && obj.owner.username) || null
    };
  }

  // Walk any JSON payload and collect everything that looks like reel media.
  // Shape-based rather than endpoint-based, so it survives Instagram renaming
  // its API routes.
  function collectMedia(root) {
    const found = [];
    const seen = new Set();
    const stack = [root];
    let steps = 0;
    while (stack.length && steps < 200000) {
      steps++;
      const node = stack.pop();
      if (!node || typeof node !== "object") continue;
      if (Array.isArray(node)) {
        for (const child of node) stack.push(child);
        continue;
      }
      const item = fromApiMedia(node) || fromGraphqlNode(node);
      if (item && !seen.has(item.code)) {
        seen.add(item.code);
        found.push(item);
      }
      for (const key in node) stack.push(node[key]);
    }
    return found;
  }

  function handleBody(text) {
    if (!text || text[0] !== "{") return;
    try {
      emit(collectMedia(JSON.parse(text)));
    } catch (_) {
      /* not JSON or unexpected shape — ignore */
    }
  }

  function isInstagramApi(url) {
    return (
      typeof url === "string" &&
      (url.includes("/api/v1/") || url.includes("/graphql"))
    );
  }

  // ---- active topic fetch ------------------------------------------------
  // The content script asks us (we live in the page world, with the page's
  // session) to query Instagram's own search API for a topic and feed the
  // results into the collector — same engine the mobile app's topic search
  // uses, no page navigation needed.

  const IG_APP_ID = "936619743392459"; // Instagram web's public app id

  document.addEventListener("highwater:fetch", async (e) => {
    const kw = String(e.detail || "").trim();
    if (!kw) return;
    const status = (msg) =>
      document.dispatchEvent(new CustomEvent("highwater:status", { detail: msg }));
    status(`Searching Instagram for "${kw}"…`);

    const url = kw.startsWith("#")
      ? "https://www.instagram.com/api/v1/tags/web_info/?tag_name=" +
        encodeURIComponent(kw.slice(1))
      : "https://www.instagram.com/api/v1/fbsearch/web/top_serp/?query=" +
        encodeURIComponent(kw);

    try {
      const res = await origFetch(url, {
        headers: { "x-ig-app-id": IG_APP_ID },
        credentials: "include"
      });
      const text = await res.text();
      if (!res.ok || text[0] !== "{") {
        console.warn("[Highwater] search failed", url, res.status, text.slice(0, 200));
        status(`Instagram refused the search (HTTP ${res.status}) — try again in a bit.`);
        return;
      }
      const items = collectMedia(JSON.parse(text));
      console.log("[Highwater] search", kw, "->", items.length, "posts");
      emit(items);
      status(
        items.length
          ? `Added ${items.length} posts for "${kw}".`
          : `No posts found for "${kw}" — try a broader word or a #hashtag.`
      );
    } catch (_) {
      status(`Search failed for "${kw}" — check you're logged in.`);
    }
  });

  // ---- fetch hook --------------------------------------------------------

  const origFetch = window.fetch;
  window.fetch = function (...args) {
    const url = typeof args[0] === "string" ? args[0] : args[0] && args[0].url;
    const promise = origFetch.apply(this, args);
    if (isInstagramApi(url)) {
      promise
        .then((res) => {
          res
            .clone()
            .text()
            .then(handleBody)
            .catch(() => {});
          return res;
        })
        .catch(() => {});
    }
    return promise;
  };

  // ---- XHR hook ----------------------------------------------------------

  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    if (isInstagramApi(url)) {
      this.addEventListener("load", function () {
        if (this.responseType === "" || this.responseType === "text") {
          handleBody(this.responseText);
        }
      });
    }
    return origOpen.call(this, method, url, ...rest);
  };
})();
