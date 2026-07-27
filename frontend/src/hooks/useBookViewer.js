import { useCallback, useEffect, useRef, useState } from 'react';
import ePub from 'epubjs';
import { EPUB_THEMES } from '../lib/epubThemes.js';
import {
  buildPdfPageModel,
  loadPdfDocument,
  reconstructPdfPageInReader,
} from '../lib/pdfViewer.js';
import { formatBytes, getContrastColor } from '../lib/utils.js';

const INITIAL_JSON = '{ "info": "Upload a document to inspect its parsed JSON schema representation." }';

export function useBookViewer(readerHostRef) {
  const pdfDocumentRef = useRef(null);
  const epubBookRef = useRef(null);
  const epubRenditionRef = useRef(null);
  const virtualPagesRef = useRef([]);
  const jsonPageModelsRef = useRef({});
  const pdfRenderCacheRef = useRef(null);

  const [fileType, setFileType] = useState('');
  const [fileName, setFileName] = useState('No book loaded');
  const [fileSize, setFileSize] = useState('-');
  const [currentVirtualPageIndex, setCurrentVirtualPageIndex] = useState(0);
  const [virtualPageCount, setVirtualPageCount] = useState(0);
  const [epubSpineLength, setEpubSpineLength] = useState(0);
  const [jsonContent, setJsonContent] = useState(INITIAL_JSON);
  const [readerPhase, setReaderPhase] = useState('idle');
  const [loadingLabel, setLoadingLabel] = useState('');

  const [showCanvas, setShowCanvas] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(1.0);
  const [currentTheme, setCurrentTheme] = useState('white');
  const [customBgColor, setCustomBgColor] = useState('#ffffff');
  const [customColorActive, setCustomColorActive] = useState(false);

  const [pdfRenderTick, setPdfRenderTick] = useState(0);

  const destroyEpubRendition = useCallback(() => {
    if (epubRenditionRef.current) {
      epubRenditionRef.current.destroy();
      epubRenditionRef.current = null;
    }
    epubBookRef.current = null;
  }, []);

  const clearReaderHost = useCallback(() => {
    const host = readerHostRef.current;
    if (host) host.innerHTML = '';
  }, [readerHostRef]);

  const bumpPdfRender = useCallback(() => {
    setPdfRenderTick((n) => n + 1);
  }, []);

  const renderPdfPage = useCallback(
    async (pageIndex) => {
      const pdfDocument = pdfDocumentRef.current;
      const virtualPages = virtualPagesRef.current;
      if (!pdfDocument || virtualPages.length === 0) return;

      try {
        const { pageModel, page, virtualPage } = await buildPdfPageModel(
          pdfDocument,
          virtualPages,
          pageIndex,
        );
        jsonPageModelsRef.current[pageIndex] = pageModel;
        setJsonContent(JSON.stringify(pageModel, null, 2));

        pdfRenderCacheRef.current = { pageModel, page, virtualPage };
        bumpPdfRender();
      } catch (error) {
        console.error('Error rendering PDF page: ', error);
      }
    },
    [bumpPdfRender],
  );

  const loadPdf = useCallback(
    async (data) => {
      try {
        setReaderPhase('loading');
        setLoadingLabel('PDF');
        setJsonContent('Generating PDF data model...');
        clearReaderHost();

        const { pdfDocument, virtualPages } = await loadPdfDocument(data);
        pdfDocumentRef.current = pdfDocument;
        virtualPagesRef.current = virtualPages;
        setVirtualPageCount(virtualPages.length);
        jsonPageModelsRef.current = {};
        setCurrentVirtualPageIndex(0);
        setReaderPhase('document');
        await renderPdfPage(0);
      } catch (error) {
        console.error('Error loading PDF: ', error);
        alert('Failed to load PDF. Please ensure it is a valid file.');
        setReaderPhase('idle');
        setJsonContent(INITIAL_JSON);
      }
    },
    [clearReaderHost, renderPdfPage],
  );

  const loadEpub = useCallback(
    async (data) => {
      const host = readerHostRef.current;
      if (!host) return;

      try {
        setReaderPhase('loading');
        setLoadingLabel('EPUB');
        setJsonContent('Generating EPUB data model...');
        destroyEpubRendition();
        clearReaderHost();
        virtualPagesRef.current = [];

        const epubBook = ePub(data);
        epubBookRef.current = epubBook;
        await epubBook.ready;

        const metadata = epubBook.package.metadata;
        const navigation = epubBook.navigation;
        const spine = epubBook.spine;

        const epubModel = {
          format: 'EPUB_BookModel',
          title: metadata.title,
          creator: metadata.creator,
          language: metadata.language,
          toc: navigation.toc.map((item) => ({
            label: item.label.trim(),
            href: item.href,
          })),
          spineItems: spine.spineItems.map((item) => ({
            idref: item.idref,
            href: item.href,
          })),
        };

        setJsonContent(JSON.stringify(epubModel, null, 2));
        setEpubSpineLength(epubBook.spine.length);

        const rendition = epubBook.renderTo(host, {
          width: '100%',
          height: '100%',
          spread: 'always',
        });
        epubRenditionRef.current = rendition;

        for (const [name, style] of Object.entries(EPUB_THEMES)) {
          rendition.themes.register(name, style);
        }
        rendition.themes.select(currentTheme);
        rendition.themes.fontSize(`${Math.round(pdfZoom * 100)}%`);

        await rendition.display();
        setReaderPhase('document');

        rendition.on('relocated', (location) => {
          setCurrentVirtualPageIndex(location.start.index);
        });
      } catch (error) {
        console.error('Error loading EPUB: ', error);
        alert('Failed to load EPUB file.');
        setReaderPhase('idle');
        setJsonContent(INITIAL_JSON);
      }
    },
    [clearReaderHost, currentTheme, destroyEpubRendition, pdfZoom, readerHostRef],
  );

  const handleFileSelect = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setFileName(file.name);
      setFileSize(formatBytes(file.size));

      const fileExt = file.name.split('.').pop().toLowerCase();

      destroyEpubRendition();
      pdfDocumentRef.current = null;
      virtualPagesRef.current = [];
      jsonPageModelsRef.current = {};
      pdfRenderCacheRef.current = null;
      setCurrentVirtualPageIndex(0);
      setVirtualPageCount(0);
      setEpubSpineLength(0);

      const reader = new FileReader();
      if (fileExt === 'pdf') {
        setFileType('pdf');
        reader.onload = (e) => {
          loadPdf(new Uint8Array(e.target.result));
        };
        reader.readAsArrayBuffer(file);
      } else if (fileExt === 'epub') {
        setFileType('epub');
        reader.onload = (e) => {
          loadEpub(e.target.result);
        };
        reader.readAsArrayBuffer(file);
      } else {
        alert('Unsupported file format. Please upload a PDF or EPUB file.');
      }

      event.target.value = '';
    },
    [destroyEpubRendition, loadEpub, loadPdf],
  );

  useEffect(() => {
    if (fileType !== 'pdf' || readerPhase !== 'document') return;

    const host = readerHostRef.current;
    const cache = pdfRenderCacheRef.current;
    const pdfDocument = pdfDocumentRef.current;
    const virtualPages = virtualPagesRef.current;

    if (!host || !cache || !pdfDocument) return;

    let cancelled = false;

    (async () => {
      await reconstructPdfPageInReader({
        hostEl: host,
        pdfDocument,
        virtualPages,
        virtualPageIndex: cache.pageModel.virtualPageIndex,
        pageModel: cache.pageModel,
        page: cache.page,
        virtualPage: cache.virtualPage,
        showCanvas,
        showOverlay,
        pdfZoom,
        currentTheme,
        customBgColor,
      });
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
  }, [
    currentTheme,
    customBgColor,
    fileType,
    pdfRenderTick,
    pdfZoom,
    readerHostRef,
    readerPhase,
    showCanvas,
    showOverlay,
  ]);

  useEffect(() => {
    const rendition = epubRenditionRef.current;
    if (fileType !== 'epub' || !rendition) return;
    rendition.themes.fontSize(`${Math.round(pdfZoom * 100)}%`);
  }, [fileType, pdfZoom]);

  useEffect(() => {
    const rendition = epubRenditionRef.current;
    if (fileType !== 'epub' || !rendition) return;

    if (currentTheme === 'custom') {
      const textColor = getContrastColor(customBgColor);
      rendition.themes.register('custom', {
        body: {
          'background-color': customBgColor,
          color: textColor,
          "font-family": "'Inter', sans-serif",
          padding: '20px 40px !important',
        },
        p: {
          'line-height': '1.6',
          'margin-bottom': '1em',
        },
      });
      rendition.themes.select('custom');
    } else {
      rendition.themes.select(currentTheme);
    }
  }, [customBgColor, currentTheme, fileType]);

  useEffect(() => () => destroyEpubRendition(), [destroyEpubRendition]);

  const navigatePrevious = useCallback(() => {
    if (fileType === 'pdf') {
      if (currentVirtualPageIndex > 0) {
        const nextIndex = currentVirtualPageIndex - 1;
        setCurrentVirtualPageIndex(nextIndex);
        renderPdfPage(nextIndex);
      }
    } else if (fileType === 'epub' && epubRenditionRef.current) {
      epubRenditionRef.current.prev();
    }
  }, [currentVirtualPageIndex, fileType, renderPdfPage]);

  const navigateNext = useCallback(() => {
    if (fileType === 'pdf') {
      const total = virtualPagesRef.current.length;
      if (currentVirtualPageIndex < total - 1) {
        const nextIndex = currentVirtualPageIndex + 1;
        setCurrentVirtualPageIndex(nextIndex);
        renderPdfPage(nextIndex);
      }
    } else if (fileType === 'epub' && epubRenditionRef.current) {
      epubRenditionRef.current.next();
    }
  }, [currentVirtualPageIndex, fileType, renderPdfPage]);

  const pageLabel =
    fileType === 'pdf'
      ? `Virtual Page ${currentVirtualPageIndex + 1} of ${virtualPageCount}`
      : fileType === 'epub'
        ? `Section ${currentVirtualPageIndex + 1} of ${epubSpineLength}`
        : 'Page 0 of 0';

  const prevDisabled =
    fileType === 'pdf' ? currentVirtualPageIndex <= 0 : fileType !== 'epub';
  const nextDisabled =
    fileType === 'pdf'
      ? currentVirtualPageIndex >= virtualPageCount - 1
      : fileType !== 'epub';

  const handleZoomIn = useCallback(() => {
    setPdfZoom((z) => {
      if (z >= 2.0) return z;
      const next = parseFloat((z + 0.1).toFixed(1));
      if (fileType === 'pdf') bumpPdfRender();
      return next;
    });
  }, [bumpPdfRender, fileType]);

  const handleZoomOut = useCallback(() => {
    setPdfZoom((z) => {
      if (z <= 0.5) return z;
      const next = parseFloat((z - 0.1).toFixed(1));
      if (fileType === 'pdf') bumpPdfRender();
      return next;
    });
  }, [bumpPdfRender, fileType]);

  const handleThemeSelect = useCallback(
    (theme) => {
      setCurrentTheme(theme);
      setCustomColorActive(false);
      if (fileType === 'pdf') bumpPdfRender();
    },
    [bumpPdfRender, fileType],
  );

  const handleCustomColorSelect = useCallback(
    (color) => {
      setCurrentTheme('custom');
      setCustomBgColor(color);
      setCustomColorActive(true);
      if (fileType === 'pdf') bumpPdfRender();
    },
    [bumpPdfRender, fileType],
  );

  const onToggleCanvas = useCallback(
    (checked) => {
      setShowCanvas(checked);
      if (fileType === 'pdf') bumpPdfRender();
    },
    [bumpPdfRender, fileType],
  );

  const onToggleOverlay = useCallback(
    (checked) => {
      setShowOverlay(checked);
      if (fileType === 'pdf') bumpPdfRender();
    },
    [bumpPdfRender, fileType],
  );

  return {
    fileName,
    fileSize,
    jsonContent,
    readerPhase,
    loadingLabel,
    showCanvas,
    showOverlay,
    pdfZoom,
    currentTheme,
    customBgColor,
    customColorActive,
    pageLabel,
    prevDisabled,
    nextDisabled,
    handleFileSelect,
    navigatePrevious,
    navigateNext,
    handleZoomIn,
    handleZoomOut,
    handleThemeSelect,
    handleCustomColorSelect,
    onToggleCanvas,
    onToggleOverlay,
  };
}
