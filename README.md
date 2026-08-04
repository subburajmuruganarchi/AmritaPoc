

# AmritaPoC – PDF Layout Reconstruction Reader

## Overview

AmritaPoC is a Proof of Concept (PoC) that demonstrates how a PDF can be rendered in a web application while preserving the original page layout. Unlike traditional PDF viewers that render the entire page as a canvas or image, this project reconstructs the page using extracted text coordinates and renders individual text elements at their original positions.

The primary objective is to investigate how PDF documents can be transformed into an interactive, searchable, and scalable reading experience while maintaining high visual fidelity.

---

# Problem Statement

Most PDF readers follow one of two approaches:

1. Render the entire PDF page as an image/canvas.
2. Convert the PDF into reflowable text.

Both approaches have limitations.

Canvas rendering preserves layout but provides limited flexibility for customization and accessibility.

Reflowable text improves readability but loses the original page formatting, spacing, and indentation.

This PoC explores a third approach:

> Extract the PDF layout information and reconstruct the page using HTML elements positioned according to the original PDF coordinates.

---

# Current Architecture

```
                  PDF Document
                        │
                        ▼
                 PDF.js Parser
                        │
                        ▼
            Extract Text Content
                        │
                        ▼
        Word Position & Font Extraction
                        │
                        ▼
              Page Layout Model
                        │
                        ▼
      React Coordinate-based Renderer
                        │
                        ▼
        HTML Reconstruction of PDF Page
```

---

# Current Rendering Pipeline

### Step 1 - Load PDF

PDF.js loads the PDF document and parses every page.

```
PDF
      ↓
PDF.js
```

---

### Step 2 - Extract Text

Every text element is extracted from the PDF.

Example:

```json
{
    "text":"Today",
    "transform":[...],
    "width":35
}
```

---

### Step 3 - Extract Layout Information

Each word is converted into a layout object.

```json
{
    "text":"Today",
    "x":245,
    "y":320,
    "fontSize":18,
    "width":35,
    "height":18
}
```

---

### Step 4 - Build Page Model

```
Page
 ├── width
 ├── height
 ├── textElements[]
 ├── images[]
 └── metadata
```

---

### Step 5 - Render

Each text element is rendered using absolute positioning.

```
Text

↓

left = x
top = y

↓

React Component

↓

Looks similar to PDF
```

---

# Current Features

* PDF.js based parsing
* Coordinate extraction
* Font size extraction
* HTML reconstruction
* Searchable text
* Selectable text
* Responsive scaling
* Layout preservation

---

# Why Coordinate-based Rendering?

Traditional HTML rendering loses the exact PDF layout.

Coordinate-based rendering preserves:

* Original paragraph positions
* Spacing
* Indentation
* Alignment
* Font sizes
* Reading order

Result:

```
PDF

↓

Coordinate Extraction

↓

HTML

↓

Looks almost identical to PDF
```

---

# Current Limitations

Although the layout closely resembles the PDF, the implementation still has limitations.

* Embedded font substitution may slightly alter spacing.
* Complex vector graphics are not reconstructed.
* Multi-language text requires proper font support.
* Large pages containing thousands of text elements may require virtualization for better performance.

---

# Future Enhancement – Option 1

## Mobile Coordinate-based Renderer

### Objective

Render PDF documents in React Native while preserving the original page layout.

Instead of parsing the PDF on the mobile device, preprocessing occurs on the server.

Architecture

```
Admin Uploads PDF
          │
          ▼
Processing Service
          │
          ├── Extract text
          ├── Extract coordinates
          ├── Extract fonts
          ├── Generate JSON
          └── Store
                   │
                   ▼
             Database
                   │
                   ▼
            React Native
                   │
                   ▼
 Coordinate-based Renderer
```

Example Page JSON

```json
{
  "pageWidth":595,
  "pageHeight":842,
  "elements":[
    {
      "text":"Today",
      "x":245,
      "y":320,
      "fontSize":18
    }
  ]
}
```

React Native renders every text element using the extracted coordinates, allowing the page to closely resemble the original PDF while remaining searchable and selectable.

### Benefits

* Near PDF fidelity
* Searchable text
* Selectable text
* Responsive scaling
* No PDF parsing on mobile
* Faster page loading

### Challenges

* Embedded font compatibility
* Performance for large pages
* Complex scripts (Indic, Arabic, etc.)
* Thousands of positioned elements

---

# Future Enhancement – Option 2

## Hybrid Document Processing Pipeline

Instead of supporting only coordinate reconstruction, generate multiple document representations during ingestion.

Architecture

```
                   Admin Portal
                         │
                   Upload PDF
                         │
                         ▼
               Document Processor
       ┌────────────────────────────┐
       │ Parse PDF                  │
       │ Extract coordinates        │
       │ Extract fonts              │
       │ Generate thumbnails        │
       │ Generate search index      │
       │ Build Fidelity JSON        │
       │ Build Liquid JSON          │
       └────────────────────────────┘
                         │
                         ▼
              Database / Storage
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
 Fidelity JSON API                  Liquid JSON API
        │                                 │
        ▼                                 ▼
 Coordinate Renderer              Reflow Renderer
```

This architecture allows the application to support multiple reading experiences without reprocessing the PDF.

### Fidelity Mode

Uses coordinate-based rendering.

Best suited for:

* Poetry
* Religious books
* Academic books
* Complex layouts
* Books requiring precise formatting

Characteristics:

* Preserves spacing
* Preserves indentation
* Preserves alignment
* Preserves page structure

---

### Liquid Mode

Uses semantic reconstruction.

Pipeline

```
PDF

↓

Paragraph Detection

↓

Semantic Model

↓

HTML

↓

Responsive Reader
```

Best suited for:

* Novels
* Articles
* Accessibility
* Small mobile screens

Characteristics:

* Adjustable font size
* Scrollable reading
* Responsive layout
* Better accessibility

Limitations:

* Cannot preserve exact PDF spacing.
* Cannot preserve fixed line breaks.
* Complex layouts may require fallback to fidelity mode.

---

# Technology Stack

* React
* Vite
* PDF.js
* JavaScript (ES Modules)
* HTML/CSS
* React Hooks

---

# Future Roadmap

* Coordinate-based React Native renderer
* Document ingestion service
* Page JSON generation
* Search indexing
* Annotation support
* Highlight support
* Bookmark synchronization
* Theme engine
* Multiple rendering strategies (Fidelity and Liquid)
* Offline reading support
* Performance optimization through page virtualization

---

