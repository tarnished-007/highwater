# Installing Highwater

Highwater isn't in the Chrome Web Store, so you install it from a folder on your
own computer. It takes about two minutes. You don't need to be technical — just
follow these in order.

Works on **desktop Chrome, Edge, Brave, or Opera**. It cannot work on phones.

---

## 1. Download it

Go to the **[latest release](../../releases/latest)** and click the file ending
in `.zip` (about 15 KB).

## 2. Unzip it properly — this is where people go wrong

Windows lets you *peek* inside a zip without actually extracting it. Chrome
cannot install from a peek.

- **Windows:** right-click the downloaded zip → **Extract All…** → **Extract**
- **Mac:** double-click the zip

You'll get a **folder**. Move it somewhere permanent — **Documents** is good.

> ⚠️ **Do not leave it in Downloads and do not delete or move it later.** Chrome
> runs the extension from this folder forever. If the folder disappears, the
> extension stops working.

## 3. Open Chrome's extensions page

Copy this into your address bar and press Enter:

```
chrome://extensions
```

## 4. Turn on Developer mode

Top-right of that page, flip the **Developer mode** switch **on**. Three new
buttons appear.

## 5. Load the folder

Click **Load unpacked** (top-left), then select the folder you extracted in
step 2 and click **Select Folder**.

Pick the folder that has `manifest.json` directly inside it. If you opened the
folder and see another folder with the same name, go one level deeper.

**Highwater should now appear in your list with a red icon.** That's it.

## 6. Pin it (optional)

Click the puzzle-piece icon in Chrome's toolbar, then the pin next to Highwater
so you can always see it.

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

---

## Things you should expect

**"Disable developer mode extensions" popup.** Chrome shows this on startup for
any extension installed this way. It is not a virus warning — it's Chrome
reminding you the extension didn't come from its store. Click the **X** to
dismiss it. If you click *Disable*, Highwater turns off and you'll need to
re-enable it at `chrome://extensions`.

**It doesn't update itself.** Store extensions update silently; this one can't.
When there's a new version you'll get a new zip, and you repeat steps 1–5 (use
**Remove** on the old one first).

**It stops collecting posts one day.** Instagram changes how its website works
every so often, which breaks the part of Highwater that reads the numbers. That's
expected, not something you broke — ask for an updated version.

**Nothing is uploaded anywhere.** No account, no server, no tracking. Everything
stays in your browser on your machine — see the
[privacy policy](docs/privacy.html).

---

## If something goes wrong

| What you see | Fix |
|---|---|
| "Manifest file is missing or unreadable" | You selected the wrong folder, or you loaded the zip instead of the extracted folder. Redo step 2. |
| Extension loads but no red button on Instagram | Reload the Instagram tab (F5). It only runs on `instagram.com`. |
| Red button shows 0 and never rises | Scroll the page — it collects as posts load. Also check you're logged in. |
| Everything vanished after a restart | The folder was moved or deleted. Re-extract and redo step 5. |
| Panel opens but rows are empty | Click **Clear collected**, reload the page, scroll again. |

Still stuck: **msohaibn.007@gmail.com**

---

Highwater is not affiliated with, endorsed by, or sponsored by Instagram or Meta
Platforms, Inc.
