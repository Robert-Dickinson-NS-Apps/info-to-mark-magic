# Info to Mark Magic

> _README added by Robert Dickinson via Comet._

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white) ![shadcn/ui](https://img.shields.io/badge/shadcn--ui-000000?logo=shadcnui&logoColor=white)

## About

**Info to Mark Magic** is a web tool that scrapes online documentation and source content and converts it into clean, structured Markdown. It pairs a scraping form with a live Markdown editor and preview, side-by-side comparison, batch export, and a searchable docs view - making it easy to capture reference material (such as Innovyze / InfoWorks documentation) and turn it into reusable Markdown.

It is part of the SWMMEnablement collection and is built on a Vite + React + TypeScript frontend with a Supabase backend.

## What's Inside

| Feature | Description |
| --- | --- |
| Scraper form | Fetches and extracts content from source URLs for conversion. |
| Markdown editor & preview | Edit converted content with a live, rendered Markdown preview. |
| Table of contents | Auto-generated TOC sidebar for navigating long documents. |
| Comparison view | Side-by-side comparison of source versus converted output. |
| Code viewer | Displays code blocks with line numbers. |
| Batch export | Exports multiple converted documents at once. |
| Template library | Reusable Markdown templates for consistent output. |
| Docs & search | Searchable in-app documentation. |
| Workflow diagram | Visual overview of the conversion workflow. |
| Theming | Light and dark mode support. |

## Tech Stack

| Layer | Technology |
| --- | --- |
| Language | TypeScript |
| Framework | React 18 |
| Build tool | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase |
| Theming | Custom ThemeProvider (light/dark) |

## Key Components

| Component | Role |
| --- | --- |
| `ScraperForm` | Fetches and extracts content from source URLs. |
| `MarkdownEditor` / `MarkdownPreview` | Edit and render the converted Markdown. |
| `ComparisonView` | Compares source and converted output. |
| `CodeViewerWithLineNumbers` | Renders code blocks with line numbers. |
| `BatchExport` | Exports multiple documents at once. |
| `TemplateLibrary` | Provides reusable Markdown templates. |
| `DocsSearch` | Searchable in-app documentation. |
| `TableOfContents` | Auto-generated navigation sidebar. |
| `WorkflowDiagram` | Visualizes the conversion workflow. |

## Getting Started

```bash
# Clone the repository
git clone https://github.com/SWMMEnablement/info-to-mark-magic.git
cd info-to-mark-magic

# Install dependencies
npm install

# Start the development server
npm run dev
```

This project uses Supabase Cloud features. Provide the required environment variables (see `.env`) for full backend functionality. Then open the local URL printed by Vite (typically http://localhost:5173) in your browser.

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

## License

Released under the MIT License unless otherwise noted in this repository.
