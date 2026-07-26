// Builds the Chrome Web Store upload ZIP for Highwater.
//   Usage:  node build.js
//   Output: dist/highwater-<version>.zip   (manifest.json at the ZIP root)
//
// Hand-rolled ZIP writer on purpose: PowerShell's Compress-Archive stores
// nested paths as "icons\icon128.png" (backslash), which the Chrome Web Store
// reads as a filename rather than a folder — the icons then look missing and
// the upload is rejected. Entry names here always use "/".

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = __dirname;

// Files that ship. Anything not listed stays out of the ZIP
// (README, competitor notes, build scripts, dist/).
const FILES = ["manifest.json", "content.js", "interceptor.js", "panel.css", "xlsx.js"];
const DIRS = ["icons"];

function collect() {
  const out = [];
  for (const f of FILES) out.push(f);
  for (const d of DIRS) {
    for (const name of fs.readdirSync(path.join(ROOT, d)).sort()) {
      const rel = `${d}/${name}`;
      if (fs.statSync(path.join(ROOT, rel)).isFile()) out.push(rel);
    }
  }
  return out;
}

const crc32 =
  typeof zlib.crc32 === "function"
    ? (buf) => zlib.crc32(buf) >>> 0
    : (() => {
        const table = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
          let c = n;
          for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
          table[n] = c >>> 0;
        }
        return (buf) => {
          let crc = 0xffffffff;
          for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
          return (crc ^ 0xffffffff) >>> 0;
        };
      })();

function dosDateTime(d) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

function buildZip(entries) {
  const now = dosDateTime(new Date());
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const name of entries) {
    const raw = fs.readFileSync(path.join(ROOT, name));
    const deflated = zlib.deflateRawSync(raw, { level: 9 });
    const crc = crc32(raw);
    const nameBuf = Buffer.from(name, "utf8"); // already "/"-separated

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(now.time, 10);
    local.writeUInt16LE(now.date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(deflated.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28); // extra len
    locals.push(local, nameBuf, deflated);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(0, 8); // flags
    central.writeUInt16LE(8, 10); // deflate
    central.writeUInt16LE(now.time, 12);
    central.writeUInt16LE(now.date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(deflated.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // comment
    central.writeUInt16LE(0, 34); // disk start
    central.writeUInt16LE(0, 36); // internal attrs
    central.writeUInt32LE(0, 38); // external attrs
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);

    offset += local.length + nameBuf.length + deflated.length;
  }

  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, centralBuf, end]);
}

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));
const entries = collect();
const zip = buildZip(entries);

fs.mkdirSync(path.join(ROOT, "dist"), { recursive: true });
const out = path.join(ROOT, "dist", `highwater-${manifest.version}.zip`);
fs.writeFileSync(out, zip);

console.log(`Version: ${manifest.version}`);
console.log(`Files:   ${entries.length}`);
for (const e of entries) console.log(`  ${e}`);
console.log(`Built:   ${out} (${(zip.length / 1024).toFixed(1)} KB)`);
