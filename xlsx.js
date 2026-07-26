// Minimal XLSX writer — enough to produce a real Excel workbook containing a
// styled Excel Table (colored header, banded rows, sort/filter dropdowns on
// every column). An .xlsx is a zip of XML parts; we build both by hand so we
// don't have to ship a spreadsheet library.
(() => {
  // ---- zip (stored, no compression) ---------------------------------------

  const CRC_TABLE = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    CRC_TABLE[n] = c >>> 0;
  }

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function zip(files) {
    const enc = new TextEncoder();
    const parts = [];
    const central = [];
    let offset = 0;
    for (const f of files) {
      const name = enc.encode(f.name);
      const data = enc.encode(f.data);
      const crc = crc32(data);

      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true);
      local.setUint16(4, 20, true);
      local.setUint16(6, 0x0800, true); // UTF-8 names
      local.setUint16(8, 0, true); // stored
      local.setUint32(14, crc, true);
      local.setUint32(18, data.length, true);
      local.setUint32(22, data.length, true);
      local.setUint16(26, name.length, true);
      parts.push(new Uint8Array(local.buffer), name, data);

      const cen = new DataView(new ArrayBuffer(46));
      cen.setUint32(0, 0x02014b50, true);
      cen.setUint16(4, 20, true);
      cen.setUint16(6, 20, true);
      cen.setUint16(8, 0x0800, true);
      cen.setUint32(16, crc, true);
      cen.setUint32(20, data.length, true);
      cen.setUint32(24, data.length, true);
      cen.setUint16(28, name.length, true);
      cen.setUint32(42, offset, true);
      central.push(new Uint8Array(cen.buffer), name);

      offset += 30 + name.length + data.length;
    }
    const centralSize = central.reduce((s, a) => s + a.length, 0);
    const eocd = new DataView(new ArrayBuffer(22));
    eocd.setUint32(0, 0x06054b50, true);
    eocd.setUint16(8, files.length, true);
    eocd.setUint16(10, files.length, true);
    eocd.setUint32(12, centralSize, true);
    eocd.setUint32(16, offset, true);
    parts.push(...central, new Uint8Array(eocd.buffer));
    return new Blob(parts, {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
  }

  // ---- workbook XML ---------------------------------------------------------

  function xmlEsc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
    })[c]);
  }

  const colLetter = (i) => String.fromCharCode(65 + i); // A..Z is plenty

  // columns: [{ name, width, type: "link" | "num" | "str" }]
  // rows: array of arrays matching columns
  function makeXlsx(columns, rows, sheetName) {
    const nCols = columns.length;
    const nRows = rows.length + 1; // + header
    const ref = `A1:${colLetter(nCols - 1)}${nRows}`;

    const colsXml = columns
      .map(
        (c, i) =>
          `<col min="${i + 1}" max="${i + 1}" width="${c.width}" customWidth="1"/>`
      )
      .join("");

    const headerXml =
      `<row r="1">` +
      columns
        .map(
          (c, i) =>
            `<c r="${colLetter(i)}1" t="inlineStr"><is><t>${xmlEsc(c.name)}</t></is></c>`
        )
        .join("") +
      `</row>`;

    const bodyXml = rows
      .map((row, ri) => {
        const r = ri + 2;
        const cells = row
          .map((v, ci) => {
            const cr = `${colLetter(ci)}${r}`;
            if (v === null || v === undefined || v === "") return `<c r="${cr}"/>`;
            const type = columns[ci].type;
            if (type === "num") return `<c r="${cr}"><v>${Number(v)}</v></c>`;
            if (type === "link") {
              const u = xmlEsc(v).replace(/"/g, "");
              return `<c r="${cr}" t="str"><f>HYPERLINK(&quot;${u}&quot;)</f><v>${u}</v></c>`;
            }
            return `<c r="${cr}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`;
          })
          .join("");
        return `<row r="${r}">${cells}</row>`;
      })
      .join("");

    const sheetXml =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"` +
      ` xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
      `<dimension ref="${ref}"/>` +
      `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" state="frozen"/></sheetView></sheetViews>` +
      `<cols>${colsXml}</cols>` +
      `<sheetData>${headerXml}${bodyXml}</sheetData>` +
      `<tableParts count="1"><tablePart r:id="rId1"/></tableParts>` +
      `</worksheet>`;

    const tableColsXml = columns
      .map((c, i) => `<tableColumn id="${i + 1}" name="${xmlEsc(c.name)}"/>`)
      .join("");

    // TableStyleMedium3 = Excel's built-in red table style: colored header,
    // banded rows, and the sort/filter dropdown on every column.
    const tableXml =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<table xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"` +
      ` id="1" name="Highwater" displayName="Highwater" ref="${ref}" totalsRowShown="0">` +
      `<autoFilter ref="${ref}"/>` +
      `<tableColumns count="${nCols}">${tableColsXml}</tableColumns>` +
      `<tableStyleInfo name="TableStyleMedium3" showFirstColumn="0"` +
      ` showLastColumn="0" showRowStripes="1" showColumnStripes="0"/>` +
      `</table>`;

    const stylesXml =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
      `<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>` +
      `<fills count="2"><fill><patternFill patternType="none"/></fill>` +
      `<fill><patternFill patternType="gray125"/></fill></fills>` +
      `<borders count="1"><border/></borders>` +
      `<cellStyleXfs count="1"><xf/></cellStyleXfs>` +
      `<cellXfs count="1"><xf/></cellXfs>` +
      `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
      `</styleSheet>`;

    const workbookXml =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"` +
      ` xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
      `<sheets><sheet name="${xmlEsc(sheetName)}" sheetId="1" r:id="rId1"/></sheets>` +
      `</workbook>`;

    const relsRoot =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
      `</Relationships>`;

    const relsWorkbook =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
      `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      `</Relationships>`;

    const relsSheet =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/table" Target="../tables/table1.xml"/>` +
      `</Relationships>`;

    const contentTypes =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
      `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
      `<Override PartName="/xl/tables/table1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"/>` +
      `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
      `</Types>`;

    return zip([
      { name: "[Content_Types].xml", data: contentTypes },
      { name: "_rels/.rels", data: relsRoot },
      { name: "xl/workbook.xml", data: workbookXml },
      { name: "xl/_rels/workbook.xml.rels", data: relsWorkbook },
      { name: "xl/styles.xml", data: stylesXml },
      { name: "xl/worksheets/sheet1.xml", data: sheetXml },
      { name: "xl/worksheets/_rels/sheet1.xml.rels", data: relsSheet },
      { name: "xl/tables/table1.xml", data: tableXml }
    ]);
  }

  window.HighwaterXlsx = { makeXlsx };
})();
