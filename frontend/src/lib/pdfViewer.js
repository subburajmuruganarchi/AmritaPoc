import { pdfjsLib } from './pdfjsSetup.js';
import { getFontFallback } from './utils.js';

export async function loadPdfDocument(data) {
  const pdfDocument = await pdfjsLib.getDocument(data).promise;
  const totalPdfPages = pdfDocument.numPages;
  const virtualPages = [];

  for (let i = 1; i <= totalPdfPages; i++) {
    const page = await pdfDocument.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });

    if (viewport.width > viewport.height * 1.1) {
      const halfWidth = viewport.width / 2;
      virtualPages.push({
        pdfPageIndex: i,
        splitSide: 'left',
        width: halfWidth,
        height: viewport.height,
      });
      virtualPages.push({
        pdfPageIndex: i,
        splitSide: 'right',
        width: halfWidth,
        height: viewport.height,
      });
    } else {
      virtualPages.push({
        pdfPageIndex: i,
        splitSide: 'full',
        width: viewport.width,
        height: viewport.height,
      });
    }
  }

  return { pdfDocument, virtualPages };
}

export async function buildPdfPageModel(pdfDocument, virtualPages, virtualPageIndex) {
  const virtualPage = virtualPages[virtualPageIndex];
  const page = await pdfDocument.getPage(virtualPage.pdfPageIndex);

  const originalViewport = page.getViewport({ scale: 1.0 });
  const originalWidth = originalViewport.width;
  const originalHeight = originalViewport.height;

  const textContent = await page.getTextContent();

  const pageModel = {
    format: 'PDF_PageModel',
    virtualPageIndex,
    originalPageIndex: virtualPage.pdfPageIndex,
    splitSide: virtualPage.splitSide,
    width: virtualPage.width,
    height: virtualPage.height,
    textElements: [],
  };

  textContent.items.forEach((item) => {
    const transform = item.transform;
    const scaleX = transform[0];
    const x = transform[4];
    const y = transform[5];

    const fontSize = Math.sqrt(scaleX * scaleX + transform[1] * transform[1]);
    const calculatedTop = originalHeight - y - fontSize;

    let relativeX = x;
    const relativeY = calculatedTop;

    if (virtualPage.splitSide === 'left') {
      if (x >= virtualPage.width) return;
      relativeX = x;
    } else if (virtualPage.splitSide === 'right') {
      if (x < originalWidth / 2) return;
      relativeX = x - originalWidth / 2;
    }

    pageModel.textElements.push({
      text: item.str,
      x: parseFloat(relativeX.toFixed(2)),
      y: parseFloat(relativeY.toFixed(2)),
      width: parseFloat(item.width.toFixed(2)),
      height: parseFloat(item.height.toFixed(2)),
      fontSize: parseFloat(fontSize.toFixed(2)),
      fontName: item.fontName,
    });
  });

  return { pageModel, page, virtualPage };
}

export async function reconstructPdfPageInReader({
  hostEl,
  pdfDocument,
  virtualPages,
  virtualPageIndex,
  pageModel,
  page,
  virtualPage,
  showCanvas,
  showOverlay,
  pdfZoom,
  currentTheme,
  customBgColor,
}) {
  if (!hostEl || !pageModel) return;

  hostEl.innerHTML = '';

  const pageFrame = document.createElement('div');
  pageFrame.className = `reconstructed-page theme-${currentTheme}`;
  if (currentTheme === 'custom') {
    pageFrame.style.backgroundColor = customBgColor;
  }

  const maxWidth = hostEl.clientWidth - 40;
  const maxHeight = hostEl.clientHeight - 40;

  let scale = Math.min(maxWidth / pageModel.width, maxHeight / pageModel.height);
  if (scale > 1.2) scale = 1.2;
  scale *= pdfZoom;

  const finalWidth = pageModel.width * scale;
  const finalHeight = pageModel.height * scale;
  pageFrame.style.width = `${finalWidth}px`;
  pageFrame.style.height = `${finalHeight}px`;

  if (showCanvas) {
    const canvas = document.createElement('canvas');
    canvas.className = 'page-canvas';
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    canvas.width = finalWidth * dpr;
    canvas.height = finalHeight * dpr;
    ctx.scale(dpr, dpr);

    if (virtualPage.splitSide === 'left') {
      const renderViewport = page.getViewport({ scale });
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = renderViewport.width;
      tempCanvas.height = renderViewport.height;
      const tempCtx = tempCanvas.getContext('2d');

      await page.render({ canvasContext: tempCtx, viewport: renderViewport }).promise;
      ctx.drawImage(
        tempCanvas,
        0,
        0,
        renderViewport.width / 2,
        renderViewport.height,
        0,
        0,
        finalWidth,
        finalHeight,
      );
    } else if (virtualPage.splitSide === 'right') {
      const renderViewport = page.getViewport({ scale });
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = renderViewport.width;
      tempCanvas.height = renderViewport.height;
      const tempCtx = tempCanvas.getContext('2d');

      await page.render({ canvasContext: tempCtx, viewport: renderViewport }).promise;
      ctx.drawImage(
        tempCanvas,
        renderViewport.width / 2,
        0,
        renderViewport.width / 2,
        renderViewport.height,
        0,
        0,
        finalWidth,
        finalHeight,
      );
    } else {
      const renderViewport = page.getViewport({ scale });
      await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;
    }

    pageFrame.appendChild(canvas);
  }

  const textOverlay = document.createElement('div');
  textOverlay.className = 'text-overlay-container';

  pageModel.textElements.forEach((elem) => {
    const textSpan = document.createElement('div');
    textSpan.className = showOverlay ? 'text-element visible-overlay' : 'text-element';
    textSpan.textContent = elem.text;

    textSpan.style.left = `${(elem.x / pageModel.width) * 100}%`;
    textSpan.style.top = `${(elem.y / pageModel.height) * 100}%`;

    const scaledFontSize = elem.fontSize * scale;
    textSpan.style.fontSize = `${scaledFontSize}px`;
    textSpan.style.fontFamily = getFontFallback(elem.fontName);

    textOverlay.appendChild(textSpan);
  });

  pageFrame.appendChild(textOverlay);
  hostEl.appendChild(pageFrame);
}
