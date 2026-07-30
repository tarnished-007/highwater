# Installing Highwater

Works on **desktop Chrome, Edge, Brave, or Opera**. It cannot work on phones.

---

## Install (30 seconds)

**→ [Get Highwater from the Chrome Web Store](https://chromewebstore.google.com/detail/highwater/aiblhblmgmemcpcdkoedkbgpbckmhlpo)**

Click **Add to Chrome**, then **Add extension**. That's it — it updates itself from
here on.

### You may see "Proceed with caution" — that's expected

Chrome may show a dialog saying *"This extension is not trusted by Enhanced Safe
Browsing."* **Click "Continue to install".**

This is not a virus warning and nothing was found wrong with Highwater. It means
only that the extension is new and hasn't been in the store long enough to build a
reputation with Google's Enhanced Safe Browsing system. Every brand-new extension
from a new developer gets it. You'll only see it at all if you have Enhanced Safe
Browsing switched on in Chrome's security settings — most people don't. It stops
appearing on its own once the extension has been listed for a few months.

---

## Using it

1. Go to **[instagram.com/explore](https://www.instagram.com/explore/)** or any
   profile, and scroll. Highwater collects posts as they load.
2. Click the round **red button** at the bottom-right to open the panel. The
   number on it counts what's been collected — keep scrolling for more.
3. Choose a sort: **Most views / Most likes / Most comments / Newest / Oldest**.
4. Type a topic (e.g. `hook`, or `#contentmarketing`) and press Enter to filter,
   and to pull more posts on that topic straight from Instagram's search.
5. **Export ⤓** saves the list as an Excel file.
6. **Clear collected** empties it — do that when switching profiles so the
   numbers don't mix together.

You need to be logged into Instagram in that same browser, as normal.

**Nothing is uploaded anywhere.** No account, no server, no tracking. Everything
stays in your browser on your machine — see the
[privacy policy](https://tarnished-007.github.io/highwater/privacy.html).

**It stops collecting posts one day.** Instagram changes how its website works
every so often, which breaks the part of Highwater that reads the numbers. That's
expected, not something you broke — an update will follow.

---

## If something goes wrong

| What you see | Fix |
|---|---|
| No red button on Instagram | Reload the Instagram tab (F5). It only runs on `instagram.com`. |
| Red button shows 0 and never rises | Scroll the page — it collects as posts load. Also check you're logged in. |
| Panel opens but rows are empty | Click **Clear collected**, reload the page, scroll again. |
| Nothing happens at all | Check it's enabled at `chrome://extensions`. |

Still stuck: **msohaibn.007@gmail.com**

---

<details>
<summary><strong>Manual install (only if you can't use the store)</strong></summary>

Use this only if the store listing is unavailable to you. Installed this way the
extension **will not auto-update**, and Chrome shows a "disable developer mode
extensions" reminder every startup.

**1. Download** the `.zip` from the [latest release](../../releases/latest) (~15 KB).

**2. Unzip it properly.** Windows lets you *peek* inside a zip without extracting
it, and Chrome cannot install from a peek.

- **Windows:** right-click the zip → **Extract All…** → **Extract**
- **Mac:** double-click the zip

Move the resulting **folder** somewhere permanent — Documents is good.

> ⚠️ Do not leave it in Downloads and do not delete or move it later. Chrome runs
> the extension from that folder forever. If it disappears, the extension breaks.

**3.** Put `chrome://extensions` in your address bar and press Enter.

**4.** Turn on **Developer mode** (top-right switch).

**5.** Click **Load unpacked**, select the folder from step 2, click **Select
Folder**. Pick the folder with `manifest.json` directly inside it — if you see
another folder of the same name, go one level deeper.

**6.** Optional: click the puzzle-piece icon in the toolbar and pin Highwater.

If you see *"Manifest file is missing or unreadable"*, you selected the wrong
folder or loaded the zip instead of the extracted folder. Redo step 2.

</details>

---

Highwater is not affiliated with, endorsed by, or sponsored by Instagram or Meta
Platforms, Inc.
