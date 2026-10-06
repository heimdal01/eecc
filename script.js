const receiptData = {
  origin: "BLR",
  dest: "DEL",
  pouchNo: "2",
  date: "27-04-2026",
  senderName: "CRR",
  senderAddress: "",
  senderCity: "Bengaluru",
  senderPin: "560001",
  recipientName: "Chaithra Trans",
  recipientAddress: "",
  recipientCity: "Chennai",
  recipientPin: "600008",
  nature: "Documents / Parcel",
  description: "General goods",
  value: "0",
  senderSign: "b/g",
  model: "",
  service: "Air Cargo",
  consignmentNo: "C49191988",
  monthYear: "Jan 2024",
};

const barcode = document.getElementById("barcode");
const barcodeText = document.getElementById("barcodeText");
function createSeededRng(seedText) {
  let seed = 0;
  for (let i = 0; i < seedText.length; i += 1) {
    seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
  }
  return function rng() {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function isInFinder(r, c, size) {
  const finderZones = [
    { rs: 0, re: 6, cs: 0, ce: 6 },
    { rs: 0, re: 6, cs: size - 7, ce: size - 1 },
    { rs: size - 7, re: size - 1, cs: 0, ce: 6 },
  ];
  return finderZones.some(
    (z) => r >= z.rs && r <= z.re && c >= z.cs && c <= z.ce
  );
}

function finderCell(r, c, size) {
  const zones = [
    { ro: 0, co: 0 },
    { ro: 0, co: size - 7 },
    { ro: size - 7, co: 0 },
  ];
  for (const z of zones) {
    const rr = r - z.ro;
    const cc = c - z.co;
    if (rr >= 0 && rr < 7 && cc >= 0 && cc < 7) {
      if (rr === 0 || rr === 6 || cc === 0 || cc === 6) return 1;
      if (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4) return 1;
      return 0;
    }
  }
  return null;
}

function buildQrSvg(seedText) {
  const size = 29;
  const quiet = 2;
  const modulePx = 2.1;
  const totalModules = size + quiet * 2;
  const svgSize = totalModules * modulePx;
  const rng = createSeededRng(seedText);
  let rects = "";

  for (let r = -quiet; r < size + quiet; r += 1) {
    for (let c = -quiet; c < size + quiet; c += 1) {
      if (r < 0 || c < 0 || r >= size || c >= size) {
        continue;
      }

      const fixedFinder = finderCell(r, c, size);
      let dark = fixedFinder === 1;
      if (fixedFinder === null) {
        // Add timing-like lines and seeded modules for realistic QR appearance.
        if ((r === 6 || c === 6) && !isInFinder(r, c, size)) {
          dark = (r + c) % 2 === 0;
        } else {
          dark = rng() > 0.5;
        }
      }

      if (dark) {
        const x = (c + quiet) * modulePx;
        const y = (r + quiet) * modulePx;
        rects += `<rect x="${x}" y="${y}" width="${modulePx}" height="${modulePx}" fill="#101010"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" role="img" aria-label="QR code">${rects}</svg>`;
}

const qrTop = document.getElementById("qrTop");
const qrBottom = document.getElementById("qrBottom");
const printBtn = document.getElementById("printBtn");
const downloadPngBtn = document.getElementById("downloadPngBtn");
const receiptForm = document.getElementById("receiptForm");

const code39Map = {
  "*": "nwnnwnwnn",
  "0": "nnnwwnwnw",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  A: "wnnnnwnnw",
  B: "nnwnnwnnw",
  C: "wnwnnwnnn",
  D: "nnnnwwnnw",
  E: "wnnnwwnnn",
  F: "nnwnwwnnn",
  G: "nnnnnwwnw",
  H: "wnnnnwwnn",
  I: "nnwnnwwnn",
  J: "nnnnwwwnn",
  K: "wnnnnnnww",
  L: "nnwnnnnww",
  M: "wnwnnnnwn",
  N: "nnnnwnnww",
  O: "wnnnwnnwn",
  P: "nnwnwnnwn",
  Q: "nnnnnnwww",
  R: "wnnnnnwwn",
  S: "nnwnnnwwn",
  T: "nnnnwnwwn",
  U: "wwnnnnnnw",
  V: "nwwnnnnnw",
  W: "wwwnnnnnn",
  X: "nwnnwnnnw",
  Y: "wwnnwnnnn",
  Z: "nwwnwnnnn",
  "-": "nwnnnnwnw",
  ".": "wwnnnnwnn",
  " ": "nwwnnnwnn",
  "/": "nwnwnnnwn",
};

function renderTextFields() {
  Object.entries(receiptData).forEach(([key, value]) => {
    const node = document.getElementById(key);
    if (node) node.textContent = value;
  });
}

function renderBarcode() {
  if (!barcode) return;
  const cleanData = receiptData.consignmentNo
    .toUpperCase()
    .replace(/[^A-Z0-9\-./ ]/g, "");
  const encoded = `*${cleanData}*`;
  const narrow = 2;
  const wide = 5;
  const gap = narrow;
  const quietZone = 14;
  const barHeight = 54;
  let x = quietZone;
  let rects = "";

  for (let i = 0; i < encoded.length; i += 1) {
    const char = encoded[i];
    const pattern = code39Map[char] || code39Map["-"];
    for (let j = 0; j < pattern.length; j += 1) {
      const isBar = j % 2 === 0;
      const width = pattern[j] === "w" ? wide : narrow;
      if (isBar) {
        rects += `<rect x="${x}" y="0" width="${width}" height="${barHeight}" fill="#111"/>`;
      }
      x += width;
    }
    if (i !== encoded.length - 1) x += gap;
  }

  const totalWidth = x + quietZone;
  barcode.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${barHeight}" role="img" aria-label="Barcode">${rects}</svg>`;
  if (barcodeText) barcodeText.textContent = receiptData.consignmentNo;
}

function renderQrs() {
  if (qrTop) qrTop.innerHTML = buildQrSvg(`top-${receiptData.consignmentNo}`);
  if (qrBottom) qrBottom.innerHTML = buildQrSvg(`bottom-${receiptData.consignmentNo}`);
}

function renderReceipt() {
  renderTextFields();
  renderBarcode();
  renderQrs();
}

async function renderReceiptCanvas() {
  const receipt = document.getElementById("receipt");
  if (!receipt || typeof window.html2canvas !== "function") return null;
  return window.html2canvas(receipt, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
  });
}

function printSinglePageImage(dataUrl) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1400,height=900");
  if (!printWindow) return;

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt Print</title>
        <style>
          @page { size: A4 landscape; margin: 6mm; }
          html, body { margin: 0; padding: 0; background: #fff; }
          .sheet {
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <img id="printImage" src="${dataUrl}" alt="Receipt" />
        </div>
        <script>
          const img = document.getElementById("printImage");
          img.addEventListener("load", () => {
            window.focus();
            window.print();
            setTimeout(() => window.close(), 300);
          });
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

if (printBtn) {
  printBtn.addEventListener("click", async () => {
    const canvas = await renderReceiptCanvas();
    if (!canvas) return;
    printSinglePageImage(canvas.toDataURL("image/png"));
  });
}

if (downloadPngBtn) {
  downloadPngBtn.addEventListener("click", async () => {
    const canvas = await renderReceiptCanvas();
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `receipt-${receiptData.consignmentNo || "copy"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

if (receiptForm) {
  [
    "origin",
    "dest",
    "pouchNo",
    "date",
    "senderName",
    "senderAddress",
    "senderCity",
    "senderPin",
    "recipientName",
    "recipientAddress",
    "recipientCity",
    "recipientPin",
    "nature",
    "description",
    "senderSign",
    "model",
    "service",
    "monthYear",
    "value",
    "consignmentNo",
  ].forEach((key) => {
    const input = receiptForm.elements.namedItem(key);
    if (input) input.value = receiptData[key];
  });

  receiptForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(receiptForm);
    Object.keys(receiptData).forEach((key) => {
      if (formData.has(key)) {
        receiptData[key] = String(formData.get(key) || "").trim();
      }
    });
    renderReceipt();

    const canvas = await renderReceiptCanvas();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `receipt-${receiptData.consignmentNo || "copy"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

renderReceipt();
