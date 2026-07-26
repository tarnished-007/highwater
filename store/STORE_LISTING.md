# Chrome Web Store submission sheet — Highwater v1.0.0

Copy-paste answers for every field in the Developer Dashboard.
Upload file: `dist/highwater-1.0.0.zip` (rebuild any time with `node build.js`).

---

## Store listing tab

**Item name** (max 75 chars)

```
Highwater — find the peaks in any feed
```

**Summary / short description** (max 132 chars — this is the line people see)

```
Sort Explore and profile posts by views, likes, comments or date, filter them by topic keywords, and export to Excel.
```

**Detailed description**

```
Highwater unlocks the numbers that are already in your browser.

When you scroll Instagram's Explore page or a profile, Instagram sends your browser far more than it shows you: every post's view count, like count, comment count and upload date. The grid just doesn't display them, and it never lets you sort. Highwater reads that data as it arrives and gives you the sorted, filterable list you actually wanted.

WHAT IT DOES

• Sort any collected posts by Most views, Most likes, Most comments, Newest or Oldest.
• See the real numbers on every row — views, likes, comments, author, upload date.
• Filter by topic keywords. Add a chip like "content", "hook" or "#contentmarketing" and the list narrows to matching posts (matched against caption, hashtags and username).
• Click a chip to pull in more. Highwater asks Instagram's own search for that topic and drops the results straight into your panel — no page navigation, no new tabs.
• Auto-scroll collects hands-free while you do something else.
• Works on Explore and on any profile, and the collection persists across page navigation, so browsing several topics builds one combined sorted list.
• Export to Excel. One click writes a real .xlsx workbook — Link, Views, Likes, Comments, Username, Date — formatted as a sortable table that opens in Excel or Google Sheets.

WHO IT'S FOR

Creators and marketers doing research: finding which formats actually performed in your niche, building a swipe file, or checking a profile's real top posts instead of its pinned ones.

HOW TO USE IT

1. Open instagram.com/explore (or any profile) and scroll.
2. Click the round red button at the bottom-right to open the panel. The badge counts what's been collected — keep scrolling for more.
3. Pick a sort, add keyword chips, click any row to open that post.
4. Export when you're done. Clear collected resets the session.

PRIVACY

Everything stays on your computer. Highwater has no server, no account, no analytics and no tracking. It only reads the post data Instagram already sent to your browser, stores it in Chrome's local storage so your list survives navigation, and never transmits it anywhere. It runs only on instagram.com and nowhere else. The Clear collected button erases everything.

GOOD TO KNOW

• It sorts what has loaded — scroll to collect more. There is no "all of Explore".
• Keyword filtering reads captions, so posts with empty captions can't be keyword-matched.
• Desktop Chrome and Chromium browsers. Requires Chrome 111 or newer.
• Instagram changes its internals from time to time. If collecting stops working, update the extension or report it and it'll be fixed.

Not affiliated with, endorsed by, or sponsored by Instagram or Meta Platforms, Inc.
```

**Category:** `Social Networking` — if a second slot is offered, `Workflow & Planning`
**Language:** English (United States)

**Graphics**
- Store icon 128×128 → `icons/icon128.png`
- Screenshots 1280×800 (1 minimum, 5 max) → see `make-screenshot.ps1` below
- Small promo tile 440×280 → optional, skip for now

**Homepage URL**

```
https://github.com/tarnished-007/highwater
```

**Support URL**

```
https://github.com/tarnished-007/highwater/issues
```

---

## Privacy practices tab

**Single purpose description**

```
Highwater has one purpose: to re-order and filter the Instagram posts the user is already browsing. Instagram's Explore page and profile grids deliver each post's view count, like count, comment count and upload date to the browser but display them in a fixed, unsortable order. Highwater reads that data from the responses the page already receives, then renders a side panel where the user can sort those same posts by views, likes, comments or date, narrow them with topic keywords, and export the list to an Excel file. All processing happens locally in the browser on instagram.com only.
```

**Permission justification — `storage`**

```
Used to save the user's own settings and working list on their device: their topic keyword chips, their selected sort order, whether the panel is open, and the list of posts collected so far. Storing the collected list locally is what lets it persist across page navigations so the user can browse several profiles or topics and still see one combined sorted list. Nothing in storage is transmitted anywhere; the "Clear collected" button deletes it.
```

**Permission justification — host permission `https://www.instagram.com/*`**

```
The extension's only function is sorting and filtering Instagram's own post grid, so its content script must run on Instagram pages to read the post data the page already receives and to render the sorting panel. Access is scoped to https://www.instagram.com/* exclusively; the extension requests no other host and runs on no other website.
```

**Remote code:** select **No, I am not using remote code.**
(All code ships in the package. No `eval`, no injected external scripts, no remote-hosted JS.)

**Data usage — what you collect**

Leave every category **unchecked**. "Collect" in Google's terms means transferring
data off the user's device, and Highwater transmits nothing — post data is read
locally and written to `chrome.storage.local`.

> If a reviewer pushes back on this, the fix is: check **Website content**, keep
> the privacy policy URL in place, and resubmit. Don't check anything else —
> nothing else is even touched.

**Certify all three checkboxes:**
- ✔ I do not sell or transfer user data to third parties, outside of the approved use cases
- ✔ I do not use or transfer user data for purposes unrelated to my item's single purpose
- ✔ I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL** — live and verified (HTTP 200), just paste it:

```
https://tarnished-007.github.io/highwater/privacy.html
```

Served by GitHub Pages from `docs/privacy.html` on `main`. If the repo is ever made
private, Pages stops serving on a free account and this URL dies — move the policy
to a public Gist or `sohaib.studio` first, then update it here and in the dashboard.

---

## Distribution tab

- **Visibility:** **Unlisted** — anyone with the link can install it; it won't appear
  in Store search or browse. This is the right setting for "I send people a link."
- **Distribution:** All regions (or just the ones you care about)
- Not for enterprise-only distribution; no "Trusted testers" needed.

---

## Screenshots — how to get valid ones

Google requires **exactly 1280×800** (or 640×400). A wrong-size image blocks
submission. Screenshots must show the real extension working — no heavy marketing
overlays, no unrelated imagery.

1. Open `https://www.instagram.com/explore/`, scroll a while, open the Highwater
   panel with a couple of keyword chips added so the panel looks populated.
2. Take the screenshot — `Win` + `Shift` + `S`, or `Win` + `PrtScn` for the whole
   screen (saves to `Pictures\Screenshots`).
3. Normalise it to exactly 1280×800:
   ```powershell
   powershell -ExecutionPolicy Bypass -File store\make-screenshot.ps1 "C:\path\to\shot.png"
   ```
   Output lands in `store\screenshots\` ready to upload. Repeat for 2–4 shots
   (suggested: sorted list, keyword chips filtering, the exported .xlsx open in Excel).

Blur or crop out anything you don't want public — the account you're logged into
is visible in Instagram's UI, and other people's usernames will appear in the list.
