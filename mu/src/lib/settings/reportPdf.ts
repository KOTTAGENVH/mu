import type { UploadExport } from "@/app/api/client/services/report/api";

const brand_name = "MU by Nowen Kottage";
const contact_url = "https://www.nowenkottage.com/contactus";
const contact_label = "nowenkottage.com/contactus";
const logo_src = "/mu.jpg";
const watermark_src = "/mu.png";

// A4 landscape, in points
const page_width = 842;
const page_height = 595;
const margin = 40;

const row_height = 16;
const head_height = 18;
const footer_baseline = page_height - 20;
const table_bottom = page_height - 48;

const watermark_size = 340;
const watermark_alpha = 0.06;

const helvetica: Record<number, number> = {};
const helvetica_bold: Record<number, number> = {};

function loadWidths(target: Record<number, number>, widths: number[]) {
  for (let i = 0; i < widths.length; i++) target[32 + i] = widths[i];
}

//Covers all 26 uppercase A-Z  && 26 lowercase a-z && 10 digits 0-9 && 1 space && 32 punctuation and symbols: !"#$%&'()*+,-./:;<=>?@[\]^_\{|}~ = 115
loadWidths(
  helvetica,
  [
    278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278,
    278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584,
    584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556,
    833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278,
    278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222,
    500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500,
    500, 334, 260, 334, 584,
  ],
);

loadWidths(
  helvetica_bold,
  [
    278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278,
    278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584,
    584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611,
    833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333,
    278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278,
    556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556,
    500, 389, 280, 389, 584,
  ],
);

function textWidth(text: string, size: number, bold = false): number {
  const table = bold ? helvetica_bold : helvetica;
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    total += table[text.charCodeAt(i)] ?? 556;
  }
  return (total * size) / 1000;
}

//As some text characters which cannot be in ascii for example sinhala
function sanitise(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    out += code >= 32 && code <= 126 ? text[i] : "?";
  }
  return out;
}

//Injection safety layer as in pdf strings are in ()
function escapeText(text: string): string {
  return sanitise(text).replace(/([\\()])/g, "\\$1");
}

function truncate(text: string, maxWidth: number, size: number, bold = false) {
  const clean = sanitise(text);
  if (textWidth(clean, size, bold) <= maxWidth) return clean;

  const ellipsis = "...";
  const room = maxWidth - textWidth(ellipsis, size, bold);
  let cut = "";
  for (const char of clean) {
    if (textWidth(cut + char, size, bold) > room) break;
    cut += char;
  }
  return cut + ellipsis;
}

function latin1(text: string): Uint8Array {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) out[i] = text.charCodeAt(i) & 0xff;
  return out;
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const size = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}

// https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream
async function deflate(input: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === "undefined") return null;
  try {
    const stream = new Blob([input as BlobPart])
      .stream()
      .pipeThrough(new CompressionStream("deflate"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    return null;
  }
}

class PdfWriter {
  private objects: (Uint8Array | null)[] = [null];

  alloc(): number {
    this.objects.push(null);
    return this.objects.length - 1;
  }

  set(id: number, body: string | Uint8Array) {
    this.objects[id] = typeof body === "string" ? latin1(body) : body;
  }

  async stream(id: number, dict: string, payload: Uint8Array) {
    const packed = await deflate(payload);
    const body = packed ?? payload;
    const filter = packed ? " /Filter /FlateDecode" : "";
    this.set(
      id,
      concat([
        latin1(`<< ${dict}${filter} /Length ${body.length} >>\nstream\n`),
        body,
        latin1("\nendstream"),
      ]),
    );
  }

  build(rootId: number): Uint8Array {
    const chunks: Uint8Array[] = [];
    let offset = 0;
    const offsets: number[] = [0];

    const push = (bytes: Uint8Array) => {
      chunks.push(bytes);
      offset += bytes.length;
    };
    push(latin1("%PDF-1.7\n%\xE2\xE3\xCF\xD3\n"));

    for (let id = 1; id < this.objects.length; id++) {
      offsets[id] = offset;
      const body = this.objects[id] ?? latin1("<< >>");
      push(latin1(`${id} 0 obj\n`));
      push(body);
      push(latin1("\nendobj\n"));
    }

    const xrefAt = offset;
    const count = this.objects.length;
    let xref = `xref\n0 ${count}\n0000000000 65535 f \n`;
    for (let id = 1; id < count; id++) {
      xref += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
    }
    push(latin1(xref));
    push(
      latin1(
        `trailer\n<< /Size ${count} /Root ${rootId} 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`,
      ),
    );

    return concat(chunks);
  }
}

type Logo = {
  width: number;
  height: number;
  rgb: Uint8Array;
  alpha: Uint8Array | null;
};

async function loadLogo(src: string): Promise<Logo | null> {
  try {
    const response = await fetch(src, { cache: "force-cache" });
    if (!response.ok) return null;

    const bitmap = await createImageBitmap(await response.blob());
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = canvas.width * canvas.height;
    const rgb = new Uint8Array(pixels * 3);
    const alpha = new Uint8Array(pixels);
    let transparent = false;

    for (let i = 0; i < pixels; i++) {
      rgb[i * 3] = data[i * 4];
      rgb[i * 3 + 1] = data[i * 4 + 1];
      rgb[i * 3 + 2] = data[i * 4 + 2];
      alpha[i] = data[i * 4 + 3];
      if (data[i * 4 + 3] !== 255) transparent = true;
    }

    return {
      width: canvas.width,
      height: canvas.height,
      rgb,
      alpha: transparent ? alpha : null,
    };
  } catch {
    return null;
  }
}

const flip = (y: number) => page_height - y;
const round = (n: number) => Math.round(n * 100) / 100;

type Align = "left" | "right" | "center";

type TextOptions = {
  bold?: boolean;
  grey?: number;
  rgb?: [number, number, number];
  align?: Align;
  width?: number;
};

class Page {
  ops: string[] = [];
  annots: number[] = [];

  fill(
    r: number,
    g: number,
    b: number,
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    this.ops.push(
      `${round(r / 255)} ${round(g / 255)} ${round(b / 255)} rg`,
      `${round(x)} ${round(flip(y + h))} ${round(w)} ${round(h)} re f`,
    );
  }

  text(
    value: string,
    x: number,
    y: number,
    size: number,
    options: TextOptions = {},
  ) {
    const { bold = false, align = "left", width = 0 } = options;
    const shade = round((options.grey ?? 0) / 255);
    const colour = options.rgb
      ? options.rgb.map((c) => round(c / 255)).join(" ")
      : `${shade} ${shade} ${shade}`;

    let drawX = x;
    if (align === "right") {
      drawX = x + width - textWidth(sanitise(value), size, bold);
    }
    if (align === "center") {
      drawX = x + (width - textWidth(sanitise(value), size, bold)) / 2;
    }

    this.ops.push(
      `${colour} rg`,
      "BT",
      `/${bold ? "F2" : "F1"} ${size} Tf`,
      `${round(drawX)} ${round(flip(y))} Td`,
      `(${escapeText(value)}) Tj`,
      "ET",
    );
  }

  image(
    name: string,
    x: number,
    y: number,
    w: number,
    h: number,
    alpha?: string,
  ) {
    this.ops.push("q");
    if (alpha) this.ops.push(`/${alpha} gs`);
    this.ops.push(
      `${round(w)} 0 0 ${round(h)} ${round(x)} ${round(flip(y + h))} cm`,
      `/${name} Do`,
      "Q",
    );
  }

  imageRounded(
    name: string,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number,
    alpha?: string,
  ) {
    const r = Math.min(radius, w / 2, h / 2);
    const k = r * 0.5523;
    const bottom = flip(y + h);
    const top = flip(y);
    const right = x + w;

    this.ops.push("q");
    if (alpha) this.ops.push(`/${alpha} gs`);

    this.ops.push(
      `${round(x + r)} ${round(bottom)} m`,
      `${round(right - r)} ${round(bottom)} l`,
      `${round(right - r + k)} ${round(bottom)} ${round(right)} ${round(bottom + r - k)} ${round(right)} ${round(bottom + r)} c`,
      `${round(right)} ${round(top - r)} l`,
      `${round(right)} ${round(top - r + k)} ${round(right - r + k)} ${round(top)} ${round(right - r)} ${round(top)} c`,
      `${round(x + r)} ${round(top)} l`,
      `${round(x + r - k)} ${round(top)} ${round(x)} ${round(top - r + k)} ${round(x)} ${round(top - r)} c`,
      `${round(x)} ${round(bottom + r)} l`,
      `${round(x)} ${round(bottom + r - k)} ${round(x + r - k)} ${round(bottom)} ${round(x + r)} ${round(bottom)} c`,
      "h W n",
      `${round(w)} 0 0 ${round(h)} ${round(x)} ${round(bottom)} cm`,
      `/${name} Do`,
      "Q",
    );
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "Never" : d.toLocaleDateString();
}

type Column = { label: string; width: number; align: Align };

const columns: Column[] = [
  { label: "#", width: 30, align: "right" },
  { label: "Name", width: 145, align: "left" },
  { label: "Artist", width: 110, align: "left" },
  { label: "Category", width: 90, align: "left" },
  { label: "Fav", width: 34, align: "center" },
  { label: "Plays", width: 40, align: "right" },
  { label: "Skips", width: 40, align: "right" },
  { label: "Last played", width: 80, align: "left" },
  { label: "File", width: 185, align: "left" },
];

export async function buildUploadsPdf(data: UploadExport): Promise<Blob> {
  const [logo, watermark] = await Promise.all([
    loadLogo(logo_src),
    loadLogo(watermark_src),
  ]);
  const { summary } = data;
  const hasRows = data.uploads.length > 0;

  const pdf = new PdfWriter();
  const catalogId = pdf.alloc();
  const pagesId = pdf.alloc();
  const fontId = pdf.alloc();
  const fontBoldId = pdf.alloc();
  const gsId = pdf.alloc();

  let imageId = 0;
  let smaskId = 0;
  let markId = 0;
  let markMaskId = 0;
  if (logo) {
    imageId = pdf.alloc();
    if (logo.alpha) smaskId = pdf.alloc();
  }

  if (watermark) {
    markId = pdf.alloc();
    if (watermark.alpha) markMaskId = pdf.alloc();
  }

  const pages: Page[] = [];

  const newPage = (): Page => {
    const page = new Page();
    if (watermark) {
      page.image(
        "Im1",
        (page_width - watermark_size) / 2,
        (page_height - watermark_size) / 2,
        watermark_size,
        watermark_size,
        "GS0",
      );
    }
    pages.push(page);
    return page;
  };

  let page = newPage();

  const textLeft = logo ? 92 : margin;

  if (logo) page.imageRounded("Im0", margin, 30, 40, 40, 20);

  page.text("Audio library", textLeft, 52, 18, { bold: true });
  page.text(brand_name, textLeft, 68, 9, { grey: 110 });
  page.text(
    `Generated ${new Date(data.generatedAt).toLocaleString()}`,
    margin,
    100,
    10,
    { grey: 110 },
  );
  page.text(
    [
      `${summary.exported} tracks`,
      `${summary.categories} categories`,
      `${summary.favourites} favourites`,
      `${summary.totalPlays} plays`,
      `${summary.totalSkips} skips`,
    ].join("   |   "),
    margin,
    116,
    10,
    { grey: 110 },
  );

  let cursor = 134;

  if (summary.truncated) {
    page.text(
      `Showing the first ${summary.exported} of ${summary.total} tracks.`,
      margin,
      132,
      10,
      { rgb: [180, 60, 60] },
    );
    cursor = 150;
  }

  const drawHeadRow = (target: Page, y: number) => {
    target.fill(30, 41, 59, margin, y, page_width - margin * 2, head_height);
    let x = margin;
    for (const column of columns) {
      target.text(column.label, x + 4, y + 12.5, 8, {
        bold: true,
        grey: 255,
        align: column.align,
        width: column.width - 8,
      });
      x += column.width;
    }
    return y + head_height;
  };

  if (!hasRows) {
    const centre = page_height / 2 - 20;
    page.text("No tracks yet", 0, centre, 13, {
      align: "center",
      width: page_width,
    });
    page.text(
      "Upload audio to your library and the next report will list it here.",
      0,
      centre + 20,
      10,
      { align: "center", width: page_width, grey: 110 },
    );
  } else {
    cursor = drawHeadRow(page, cursor);

    data.uploads.forEach((upload, index) => {
      if (cursor + row_height > table_bottom) {
        page = newPage();
        cursor = drawHeadRow(page, 60);
      }

      if (index % 2 === 1) {
        page.fill(
          244,
          246,
          250,
          margin,
          cursor,
          page_width - margin * 2,
          row_height,
        );
      }

      const cells = [
        String(index + 1),
        upload.name,
        upload.artist,
        upload.category,
        upload.favourite ? "Yes" : "",
        String(upload.playCount),
        String(upload.skipCount),
        formatDate(upload.lastPlayedAt),
        upload.fileUrl,
      ];

      let x = margin;
      cells.forEach((cell, i) => {
        const column = columns[i];
        const size = column.label === "File" ? 6 : 8;
        const room = column.width - 8;
        page.text(truncate(cell, room, size), x + 4, cursor + 11, size, {
          align: column.align,
          width: room,
        });
        x += column.width;
      });

      cursor += row_height;
    });
  }

  const linkWidth = textWidth(contact_label, 8);

  pages.forEach((target, index) => {
    if (watermark) {
      target.image(
        "Im1",
        (page_width - watermark_size) / 2,
        (page_height - watermark_size) / 2,
        watermark_size,
        watermark_size,
        "GS0",
      );
    }
    target.text(contact_label, margin, footer_baseline, 8, {
      rgb: [60, 90, 180],
    });
    target.text(brand_name, 0, footer_baseline, 8, {
      align: "center",
      width: page_width,
      grey: 130,
    });
    target.text(`Page ${index + 1} of ${pages.length}`, 0, footer_baseline, 8, {
      align: "right",
      width: page_width - margin,
      grey: 130,
    });

    const annotId = pdf.alloc();
    pdf.set(
      annotId,
      `<< /Type /Annot /Subtype /Link /Rect [${margin} ${round(flip(footer_baseline + 2))} ${round(margin + linkWidth)} ${round(flip(footer_baseline - 8))}] /Border [0 0 0] /A << /S /URI /URI (${escapeText(contact_url)}) >> >>`,
    );
    target.annots.push(annotId);
  });

  pdf.set(
    fontId,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  );
  pdf.set(
    fontBoldId,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  );
  pdf.set(
    gsId,
    `<< /Type /ExtGState /ca ${watermark_alpha} /CA ${watermark_alpha} >>`,
  );

  const writeImage = async (img: Logo, id: number, maskId: number) => {
    if (maskId) {
      await pdf.stream(
        maskId,
        `/Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceGray /BitsPerComponent 8`,
        img.alpha as Uint8Array,
      );
    }
    await pdf.stream(
      id,
      `/Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8${maskId ? ` /SMask ${maskId} 0 R` : ""}`,
      img.rgb,
    );
  };

  if (logo) await writeImage(logo, imageId, smaskId);
  if (watermark) await writeImage(watermark, markId, markMaskId);

  const pageIds: number[] = [];

  for (const target of pages) {
    const contentId = pdf.alloc();
    await pdf.stream(contentId, "", latin1(target.ops.join("\n")));

    const pageId = pdf.alloc();
    pageIds.push(pageId);

    const xobjects = [
      logo ? `/Im0 ${imageId} 0 R` : "",
      watermark ? `/Im1 ${markId} 0 R` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const resources = [
      `/Font << /F1 ${fontId} 0 R /F2 ${fontBoldId} 0 R >>`,
      xobjects ? `/XObject << ${xobjects} >>` : "",
      `/ExtGState << /GS0 ${gsId} 0 R >>`,
    ]
      .filter(Boolean)
      .join(" ");

    const annots = target.annots.length
      ? ` /Annots [${target.annots.map((id) => `${id} 0 R`).join(" ")}]`
      : "";

    pdf.set(
      pageId,
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${page_width} ${page_height}] /Resources << ${resources} >> /Contents ${contentId} 0 R${annots} >>`,
    );
  }

  pdf.set(
    pagesId,
    `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`,
  );
  pdf.set(catalogId, `<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  return new Blob([pdf.build(catalogId) as BlobPart], {
    type: "application/pdf",
  });
}

/*-----------------------------------------------*/
//Reference for how the pdf generator work: Please refer this before development :) Happy Coding!:-(
// 1. FILE LAYOUT
//
//      %PDF-1.7                <- header, plus 4 high bytes so tools treat the
//      %<binary junk>             file as binary rather than text
//      1 0 obj ... endobj      <- numbered objects, in any order
//      2 0 obj ... endobj
//      xref                    <- table of byte offsets, one line per object
//      trailer << /Root n 0 R >>
//      startxref <offset>      <- where the xref table starts
//      %%EOF
//
//      A reader opens the file at the END: it reads startxref, jumps to the xref
//      table, and from there can seek straight to any object without parsing the
//      whole document. This is why PdfWriter.build() tracks a running byte offset
//      while concatenating: offsets[id] must be the exact byte position where
//      "<id> 0 obj" begins. If that is off by one the file is corrupt.
//
//   2. OBJECT MODEL
//
//      Catalog  -> Pages -> Page -> Contents (stream)
//                                -> Resources (fonts, images, ExtGState)
//                                -> Annots (the footer link)
//
//      Objects reference each other by "id generation R", e.g. "5 0 R" means
//      object 5, generation 0. Generation is always 0 for us; it only matters for
//      incremental updates, which we do not do.
//
//      pdf.alloc() reserves an id and returns it, pdf.set(id, body) fills it in.
//      CAUTION: an id that is allocated but never set is written as "<< >>", an
//      empty dictionary. The file still parses, so you get no error, just missing
//      content. (This is exactly how the watermark went missing once.)
//
//   3. SYNTAX CONVENTIONS
//
//      /Name         a name object. The leading slash is part of it. Keys in
//                    dictionaries and resource lookups (/F1, /Im0, /GS0).
//      << ... >>     a dictionary: /Key value pairs, whitespace separated.
//      [ ... ]       an array.
//      (text)        a LITERAL STRING. Round brackets are the delimiters, which
//                    is why escapeText() backslash-escapes "(", ")" and "\"
//                    before we interpolate anything. Without that, a track named
//                    "Live (2019)" would close the string early and everything
//                    after it would be parsed as operators. That is both a
//                    corruption bug and an injection vector, since the filename
//                    is user-controlled.
//      123 0 R       an indirect reference to another object.
//      n             numbers are plain; round() keeps them to 2dp so the content
//                    stream does not fill with float noise.
//
//      We also sanitise() to printable ASCII (32-126). The base-14 Helvetica we
//      use is a single-byte WinAnsi font with no embedded glyphs, so anything
//      outside that range (Sinhala, emoji, smart quotes) has no glyph and would
//      render as garbage. We replace those characters with "?" instead. Fixing
//      this properly means embedding a TrueType font subset with a CID encoding,
//      which is a much bigger job.
//
//   4. COORDINATES
//
//      PDF units are points: 72pt = 1 inch. A4 landscape is 842 x 595.
//      The origin is the BOTTOM-LEFT corner and y grows upward. Every layout
//      number in this file is written top-down because that is how we think, so
//      flip(y) = page_height - y converts at the last moment. Anything that draws
//      a box also has to subtract the height: flip(y + h).
//
//   5. CONTENT STREAM OPERATORS
//
//      Postfix notation: operands first, then the operator.
//
//      r g b rg            set fill colour, 0-1 per channel (hence /255)
//      x y w h re f        rectangle, then fill it
//      q ... Q             save / restore graphics state. Everything between is
//                          scoped: clips, transforms and alpha do not leak out.
//      /GS0 gs             apply a named ExtGState; ours only carries the
//                          constant alpha (ca/CA) for the watermark
//      a b c d e f cm      concatenate a transformation matrix
//      /Im0 Do             paint an XObject
//      m / l / c / h       moveto / lineto / cubic bezier / closepath
//      W n                 use the current path as a clip, then discard it
//                          (imageRounded builds a rounded rect and clips to it,
//                          which is how we fake border-radius: PDF has no such
//                          thing)
//
//      BT /F1 9 Tf x y Td (hello) Tj ET
//        BT/ET open and close a text object, Tf picks font and size, Td sets the
//        baseline position, Tj shows the string. Note y is the BASELINE, not the
//        top of the text, which is why row text is drawn at cursor + 11 rather
//        than cursor.
//
//      Painting order is document order: later ops cover earlier ones. There are
//      no z-indexes. That is why the watermark has to be emitted after the table
//      fills if it should show through them.
//
//   6. IMAGES
//
//      An image XObject is a stream of raw samples plus a dictionary describing
//      how to read them: /Width, /Height, /ColorSpace /DeviceRGB,
//      /BitsPerComponent 8. So the payload is width*height*3 bytes, RGBRGB...,
//      which is what loadLogo() extracts via a canvas.
//
//      PDF has no alpha channel on the image itself. Transparency is a SECOND
//      image, /DeviceGray, referenced as /SMask, where each byte is the opacity
//      of the matching pixel. loadLogo only builds one when the source actually
//      has non-opaque pixels.
//
//      An image XObject always draws into the unit square (0,0)-(1,1). The cm
//      matrix does the scaling and positioning, so "w 0 0 h x y cm" means width
//      w, height h, at (x, y). Aspect ratio is not preserved for you: if w and h
//      do not match the source ratio, the image is stretched.
//
//   7. STREAMS AND COMPRESSION
//
//      << /Length n /Filter /FlateDecode >> stream <bytes> endstream
//
//      /Length must be the byte count AFTER compression. We run the payload
//      through CompressionStream("deflate"), which emits zlib-wrapped deflate,
//      the format /FlateDecode expects. Where CompressionStream is unavailable we
//      fall back to storing raw and omitting /Filter, so the file is bigger but
//      still valid.
//
//   8. TEXT MEASUREMENT
//
//      Since the font is not embedded we cannot ask the PDF how wide a string is,
//      but the base-14 metrics are fixed and public. The helvetica tables hold
//      the advance width of each character in 1/1000 of an em for codes 32-126
//      (95 entries), so width = sum(advances) * fontSize / 1000. That powers
//      right/centre alignment and truncate()'s ellipsis logic. Get the table
//      wrong and nothing crashes, the columns just drift.
//
//   9. LINK ANNOTATION
//
//      Links are not part of the content stream. They are separate annotation
//      objects attached to the page via /Annots, with a /Rect in page coordinates
//      (x1 y1 x2 y2, lower-left first) and a /A action of /S /URI. The text under
//      the rect is drawn normally; the annotation is just an invisible hotspot,
//      so the two have to be kept in sync by hand.
/*******************************************************************************************/
