import { useRef } from 'react';
import { useBookViewer } from './hooks/useBookViewer.js';

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function EmptyDocIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
      <path
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

const THEME_SWATCHES = ['white', 'sepia', 'gray', 'dark'];

export default function App() {
  const readerHostRef = useRef(null);
  const viewer = useBookViewer(readerHostRef);

  return (
    <>
      <header>
        <div className="logo-section">
          <h1>Amrita Books</h1>
          <span>Ingestion & Rendering Viewer (PoC)</span>
        </div>
        <div className="controls-section">
          <div className="upload-btn-wrapper">
            <button type="button" className="btn btn-primary">
              <UploadIcon />
              Upload PDF / EPUB
            </button>
            <input type="file" accept=".pdf,.epub" onChange={viewer.handleFileSelect} />
          </div>
        </div>
      </header>

      <main>
        <div className="panel sidebar">
          <div>
            <h3 className="panel-title">Document Properties</h3>
            <div className="file-info-card">
              <div className="file-name">{viewer.fileName}</div>
              <div className="file-size">{viewer.fileSize}</div>
            </div>
          </div>

          <div className="navigation-controls">
            <h3 className="panel-title">Navigation</h3>
            <div className="nav-buttons">
              <button type="button" className="btn" disabled={viewer.prevDisabled} onClick={viewer.navigatePrevious}>
                <ChevronLeft />
                Previous
              </button>
              <span className="page-num-display">{viewer.pageLabel}</span>
              <button type="button" className="btn" disabled={viewer.nextDisabled} onClick={viewer.navigateNext}>
                Next
                <ChevronRight />
              </button>
            </div>
          </div>

          <div className="settings-panel">
            <h3 className="panel-title">View Options (PDF Only)</h3>
            <label className="toggle-container">
              <input
                type="checkbox"
                checked={viewer.showCanvas}
                onChange={(e) => viewer.onToggleCanvas(e.target.checked)}
              />
              <span>Show High-Fidelity Canvas</span>
            </label>
            <label className="toggle-container">
              <input
                type="checkbox"
                checked={viewer.showOverlay}
                onChange={(e) => viewer.onToggleOverlay(e.target.checked)}
              />
              <span>Show Extracted Text Blocks</span>
            </label>
          </div>

          <div className="settings-panel">
            <h3 className="panel-title">Viewer Customization</h3>

            <div className="zoom-container">
              <span className="settings-subtitle">Zoom</span>
              <div className="zoom-controls">
                <button type="button" className="btn btn-sm" title="Zoom Out" onClick={viewer.handleZoomOut}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <span className="zoom-display">{Math.round(viewer.pdfZoom * 100)}%</span>
                <button type="button" className="btn btn-sm" title="Zoom In" onClick={viewer.handleZoomIn}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="theme-container">
              <span className="settings-subtitle">Page Background</span>
              <div className="theme-swatches">
                {THEME_SWATCHES.map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    className={`swatch swatch-${theme}${viewer.currentTheme === theme && !viewer.customColorActive ? ' active' : ''}`}
                    title={theme}
                    onClick={() => viewer.handleThemeSelect(theme)}
                  />
                ))}
                <div className={`custom-color-container${viewer.customColorActive ? ' active' : ''}`} title="Choose Custom Color">
                  <input
                    type="color"
                    value={viewer.customBgColor}
                    onInput={(e) => viewer.handleCustomColorSelect(e.target.value)}
                    onChange={(e) => viewer.handleCustomColorSelect(e.target.value)}
                  />
                  <span className="custom-color-icon">🎨</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sidebar-notes">
            <strong>Layout Engine Notes:</strong>
            <p>
              This tool models pages by mapping vector layouts (PDF coordinates) or metadata spines (EPUB manifests)
              directly into a structured canonical schema representation, rendering content dynamically.
            </p>
          </div>
        </div>

        <div className="workspace">
          <div className="reader-pane">
            <div ref={readerHostRef} className="reader-host" id="reader-pane" />
            {viewer.readerPhase === 'idle' && (
              <div className="reader-overlay empty-state">
                <EmptyDocIcon />
                <h3>Upload a Book to Start</h3>
                <p>Load any PDF or EPUB file to parse the layout/manifest structures and view interactive rendering.</p>
              </div>
            )}
            {viewer.readerPhase === 'loading' && (
              <div className="reader-overlay empty-state">
                <LoadingSpinner />
                <h3>Parsing {viewer.loadingLabel} Content...</h3>
                <p>Processing structures, layouts, and page-spread detection.</p>
              </div>
            )}
          </div>

          <div className="json-pane">
            <div className="json-header">
              <h3 className="panel-title" style={{ marginBottom: 0 }}>
                JSON Model Structure
              </h3>
            </div>
            <div className="json-content">{viewer.jsonContent}</div>
          </div>
        </div>
      </main>
    </>
  );
}
