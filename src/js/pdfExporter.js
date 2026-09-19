// PDF Exporter Module supporting Native Vector PDF Export with Local Korean Font

let cachedFontBytes = null;

async function loadKoreanFont() {
  if (cachedFontBytes) return cachedFontBytes;

  try {
    // 1. Fetch local downloaded Korean font
    const fontUrl = new URL('../../public/vendor/KoreanFont.ttf', import.meta.url).href;
    const response = await fetch(fontUrl);
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      cachedFontBytes = new Uint8Array(arrayBuffer);
      return cachedFontBytes;
    }
  } catch (err) {
    console.warn('Local KoreanFont.ttf fetch failed, attempting online fallback...', err);
  }

  try {
    // Online fallback
    const response2 = await fetch('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Regular.ttf');
    if (response2.ok) {
      const arrayBuffer2 = await response2.arrayBuffer();
      cachedFontBytes = new Uint8Array(arrayBuffer2);
      return cachedFontBytes;
    }
  } catch (e2) {
    console.error('Failed to fetch online Korean font', e2);
  }

  return null;
}

function hexToRgb(hex) {
  if (!hex || hex.length < 6) return { r: 0, g: 0, b: 0 };
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255
  };
}

function containsKorean(str) {
  if (!str) return false;
  return /[\u3131-\u318E\uAC00-\uD7A3]/.test(str);
}

export async function exportVectorPdf(originalPdfArrayBuffer, textBlocksByPage, numPages) {
  if (typeof PDFLib === 'undefined') {
    throw new Error('PDFLib is not loaded');
  }

  const { PDFDocument, rgb, StandardFonts } = PDFLib;

  // Load existing PDF document
  let pdfDoc;
  if (originalPdfArrayBuffer && originalPdfArrayBuffer.byteLength > 0) {
    const safeBuffer = originalPdfArrayBuffer.slice ? originalPdfArrayBuffer.slice(0) : new Uint8Array(originalPdfArrayBuffer).slice(0);
    pdfDoc = await PDFDocument.load(safeBuffer);
  } else {
    pdfDoc = await PDFDocument.create();
  }

  // Register fontkit & embed local Korean font
  let embeddedFont = null;
  if (typeof fontkit !== 'undefined') {
    try {
      pdfDoc.registerFontkit(fontkit);
      const fontBytes = await loadKoreanFont();
      if (fontBytes && fontBytes.byteLength > 0) {
        embeddedFont = await pdfDoc.embedFont(fontBytes, { subset: false });
      }
    } catch (err) {
      console.warn('Fontkit font embedding notice:', err);
    }
  }

  const defaultHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();

  for (let pNum = 1; pNum <= numPages; pNum++) {
    const pageIndex = pNum - 1;
    let page = pages[pageIndex];

    if (!page) {
      page = pdfDoc.addPage([595.28, 841.89]);
    }

    const { height: pageHeight } = page.getSize();
    const blocks = textBlocksByPage[pNum] || [];

    for (const block of blocks) {
      // Determine font to use: Use embedded Korean font if available, or Helvetica
      const fontToUse = (containsKorean(block.text) && embeddedFont) ? embeddedFont : (embeddedFont || defaultHelvetica);

      // Whiteout / Mask original text if edited or masked
      if ((block.isEdited || block.isMasked) && !block.isNew && block.pdfBounds) {
        const bounds = block.pdfBounds;
        const yTop = bounds.yFromTop !== undefined ? bounds.yFromTop : (bounds.y || 0);
        // PDF-lib Y is measured from bottom up. Baseline from bottom = pageHeight - yTop.
        // Box top is at (pageHeight - yTop + fontSize * 0.2), box bottom is at (pageHeight - yTop - fontSize)
        const maskY = Math.max(0, pageHeight - yTop - bounds.fontSize * 0.3);
        const maskHeight = Math.max(bounds.height || (bounds.fontSize * 1.25), bounds.fontSize * 1.25);
        const bgColor = hexToRgb(block.bgColor || '#ffffff');

        page.drawRectangle({
          x: Math.max(0, bounds.x - 2),
          y: maskY,
          width: Math.max(20, bounds.width + 6),
          height: maskHeight,
          color: rgb(bgColor.r, bgColor.g, bgColor.b),
        });
      }

      // Draw ONLY edited or new text (do NOT re-draw unedited original text)
      if ((block.isEdited || block.isNew) && block.text && block.text.trim().length > 0) {
        let drawX, drawY, drawSize;

        if (block.pdfBounds) {
          drawX = block.pdfBounds.x;
          const yTop = block.pdfBounds.yFromTop !== undefined ? block.pdfBounds.yFromTop : (block.pdfBounds.y || 0);
          // In PDF-lib, baseline Y = pageHeight - yTop
          drawY = pageHeight - yTop;
          drawSize = block.pdfBounds.fontSize;
        } else {
          // Screen coordinates (block.x, block.y) converted to PDF points (scale ~ 1.2)
          drawX = block.x / 1.2;
          drawY = pageHeight - (block.y / 1.2) - (block.fontSize / 1.2) * 0.8;
          drawSize = block.fontSize / 1.2;
        }

        const textColor = hexToRgb(block.color || '#000000');

        try {
          page.drawText(block.text, {
            x: Math.max(0, drawX),
            y: Math.max(0, drawY),
            size: drawSize || 12,
            font: fontToUse,
            color: rgb(textColor.r, textColor.g, textColor.b),
          });
        } catch (err) {
          console.warn(`DrawText fallback for block '${block.text}':`, err);
          // Safety fallback to prevent WinAnsi encoding crash if Korean font missing
          if (containsKorean(block.text) && fontToUse !== embeddedFont && embeddedFont) {
            try {
              page.drawText(block.text, {
                x: Math.max(0, drawX),
                y: Math.max(0, drawY),
                size: drawSize || 12,
                font: embeddedFont,
                color: rgb(textColor.r, textColor.g, textColor.b),
              });
            } catch (e2) {
              console.error('Final drawText error:', e2);
            }
          }
        }
      }
    }
  }

  const modifiedPdfBytes = await pdfDoc.save();
  return modifiedPdfBytes;
}

export function triggerDownload(pdfBytes, filename = 'edited_document.pdf') {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
