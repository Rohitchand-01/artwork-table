# ArtworkTable React Component

A React component for displaying and managing a paginated table of artworks with advanced selection capabilities.

## Features

- Fetches artworks data from the Art Institute of Chicago API.
- Displays artwork details in a responsive, sortable data table.
- Pagination support with PrimeReact Paginator.
- Individual row selection via checkboxes.
- Select all across **all pages** by toggling a single header checkbox (without loading delays).
- Bulk selection dropdown allowing numeric input to select/unselect artworks across pages.
- Persistent selection state saved in `localStorage`.
- Modern React hooks and TypeScript implementation.
- Clean, accessible UI built with PrimeReact, Tailwind CSS styling, and React Icons.

---

## Installation

Make sure you have the following dependencies installed in your React project:

- `react`
- `react-dom`
- `typescript`
- `primereact`
- `primeicons`
- `react-icons`
- `tailwindcss` (optional for styling)
- etc.

(Install dependencies as appropriate for your project setup.)

---

## Usage

1. Add your `ArtworkTable.tsx` component file to your React project within your components folder.

2. Import and use it in your app:

