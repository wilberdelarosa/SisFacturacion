# Document Generation System Plan

## Goal
Implement a professional, architecture-aligned system for generating, previewing, and downloading business documents (Invoices, Quotes, Proformas).

## Architecture Approach
We will follow the **Shared Library** pattern to ensure consistency across the Web App, Backend Services, and WhatsApp Bot.

### 1. New Package: `@template/documents` (or `templates`)
We will create a specific package for document templates.
*   **Location**: `packages/documents`
*   **Tech Stack**: `@react-pdf/renderer` (standard for React-based PDFs).
*   **Reason**: Allows templates to be rendered on the **Client** (Instant Preview) and the **Server** (Email attachments, WhatsApp).

### 2. Components
*   `BaseLayout`: Header (Logo, Company Info), Footer (Terms, Pagination).
*   `InvoiceTemplate`: Specific layout for invoices (NCF, Due Date).
*   `QuoteTemplate`: Specific layout for quotes.
*   `WaybillTemplate`: For delivery notes (Conduces).
*   **Styling**: Professional, clean design using Flexbox (React-PDF support).

### 3. Integration
*   **Web App**:
    *   Install `@template/documents`.
    *   Use `PDFViewer` for admin preview.
    *   Use `PDFDownloadLink` for direct download.
*   **Billing Service**:
    *   Use `renderToStream` from `@react-pdf/renderer` to generate PDFs for emails.

## Implementation Steps
1.  **Initialize Package**: Create `packages/documents`.
2.  **Install Dependencies**: `react`, `react-dom`, `@react-pdf/renderer`.
3.  **Create Components**: Implement the professional designs.
4.  **Export**: Expose components via `index.ts`.
5.  **Web Integration**: Add "Preview" button in Invoice details page.

## Required Data
Templates will define strict Interfaces (Typed) matching our Prisma Models but optimized for display (e.g., pre-formatted dates, calculated totals).
