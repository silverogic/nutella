// PDF Parser & Renderer using PDF.js

if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('../../public/vendor/pdf.worker.min.js', import.meta.url).href;
}

export async function loadPdfDocument(arrayBuffer) {
  if (typeof pdfjsLib === 'undefined') {
    throw new Error('PDF.js library is not loaded');
  }

  // Slice buffer so PDF.js web worker transfer does not detach caller's ArrayBuffer
  const safeData = arrayBuffer.slice ? arrayBuffer.slice(0) : new Uint8Array(arrayBuffer).slice(0);
  const loadingTask = pdfjsLib.getDocument({ data: safeData });
  const pdfDoc = await loadingTask.promise;
  
  return pdfDoc;
}

export async function renderPageToCanvas(pdfDoc, pageNum, canvas, scale = 1.0) {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport
  };

  await page.render(renderContext).promise;

  return {
    width: viewport.width,
    height: viewport.height,
    rawWidth: page.view[2] - page.view[0],
    rawHeight: page.view[3] - page.view[1],
    scale: scale
  };
}

export async function extractPageTextItems(pdfDoc, pageNum, viewportScale = 1.0) {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: viewportScale });
  const rawViewport = page.getViewport({ scale: 1.0 });

  const textContent = await page.getTextContent();
  const textItems = [];

  let idCounter = 1;

  for (let i = 0; i < textContent.items.length; i++) {
    const item = textContent.items[i];
    const str = item.str;
    if (!str || str.trim() === '') continue;

    // Transform PDF coordinates to viewport pixel coordinates
    const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
    const rawTx = pdfjsLib.Util.transform(rawViewport.transform, item.transform);

    // X, Y coordinates in page canvas space
    const x = tx[4];
    // In PDF coordinates Y is bottom-up, transform maps it to top-down
    const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
    const y = tx[5] - fontSize;

    const width = item.width ? item.width * viewportScale : Math.max(20, str.length * fontSize * 0.5);
    const height = fontSize * 1.2;

    // Raw unscaled PDF space bounds (72 DPI points)
    const rawX = rawTx[4];
    const rawYFromTop = rawTx[5];
    const rawFontSize = Math.sqrt(rawTx[0] * rawTx[0] + rawTx[1] * rawTx[1]);
    const rawWidth = item.width ? item.width : Math.max(15, str.length * rawFontSize * 0.5);
    const rawHeight = rawFontSize * 1.2;

    textItems.push({
      id: `text_p${pageNum}_${idCounter++}`,
      pageNum: pageNum,
      originalText: str,
      text: str,
      x: x,
      y: y,
      width: width,
      height: height,
      fontSize: Math.round(fontSize),
      fontFamily: 'sans-serif',
      color: '#000000',
      bgColor: '#ffffff',
      isEdited: false,
      isMasked: false, // Default: keep false until user edits
      isNew: false,
      // Original PDF coordinate space (72 DPI)
      pdfBounds: {
        x: rawX,
        yFromTop: rawYFromTop,
        width: rawWidth,
        height: rawHeight,
        fontSize: rawFontSize
      }
    });
  }

  // Merge items that are close or part of the same sentence
  return mergeTextItems(textItems);
}

function mergeTextItems(items) {
  if (items.length === 0) return [];

  const merged = [];
  let current = null;

  for (const item of items) {
    if (!current) {
      current = { ...item };
      continue;
    }

    // Check if item is on the same vertical line and adjacent horizontally
    const sameLine = Math.abs(item.y - current.y) < Math.max(4, current.fontSize * 0.3);
    const adjacent = Math.abs(item.x - (current.x + current.width)) < Math.max(15, current.fontSize * 0.8);

    if (sameLine && adjacent) {
      // Merge into current block
      current.originalText += ' ' + item.originalText;
      current.text += ' ' + item.originalText;
      current.width = (item.x + item.width) - current.x;
      current.height = Math.max(current.height, item.height);
      current.pdfBounds.width = (item.pdfBounds.x + item.pdfBounds.width) - current.pdfBounds.x;
    } else {
      merged.push(current);
      current = { ...item };
    }
  }

  if (current) {
    merged.push(current);
  }

  return merged;
}
