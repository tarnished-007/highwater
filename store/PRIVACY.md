# Highwater — Privacy Policy

_Last updated: 27 July 2026_

Highwater is a Chrome extension that re-sorts and filters Instagram posts that
are already visible in your own logged-in browser session.

## What Highwater does with data

Highwater reads the post data Instagram already sends to your browser when you
browse the Explore page, a profile, or a topic search: post link, view count,
like count, comment count, caption text, thumbnail URL, author username, and
upload date.

That data is kept **on your own computer only**, in Chrome's local extension
storage (`chrome.storage.local`), so your sorted list survives page navigation.
You can erase all of it at any time with the **Clear collected** button in the
panel, or by removing the extension.

## What Highwater does NOT do

- It does **not** send your data to us, or to any server or third party. There is
  no Highwater backend, no analytics, no telemetry, and no tracking pixels.
- It does **not** collect your Instagram password, credentials, cookies, direct
  messages, or any private account information.
- It does **not** sell, rent, or transfer any data to third parties.
- It does **not** use your data for advertising, credit scoring, or lending.
- It does **not** run on any website other than `https://www.instagram.com`.

## Network requests

Highwater makes network requests to `https://www.instagram.com` only, and only
when you click a topic keyword chip — it asks Instagram's own search endpoint for
posts matching that keyword, using your existing logged-in session, exactly as
the Instagram website itself would. No request is ever made to any other domain.

## Permissions and why they are needed

- **`storage`** — to save your keyword chips, sort choice, panel open/closed
  state, and the collected post list locally on your device.
- **Access to `https://www.instagram.com`** — Highwater's entire function is
  re-sorting Instagram's own grid, so it must run on Instagram pages. It has no
  access to any other site.

## Exported files

The **Export** button writes an `.xlsx` file directly to your computer's
Downloads folder using code that runs locally in your browser. The file is not
uploaded anywhere.

## Changes

If this policy changes, the updated version will be posted at this URL and the
date above will be revised.

## Contact

Questions about this policy: **msohaibn.007@gmail.com**
