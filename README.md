# DocuSign CLM Airtable Extension

An Airtable Extension built with TypeScript and the `@airtable/blocks` SDK to integrate Airtable records with DocuSign CLM. The extension enables users to trigger automated contract generation workflows, map record fields directly to DocuSign CLM parameters, and view signed PDF contracts in a new browser tab.

---

## Architecture Diagram

```mermaid
flowchart TD
    subgraph Airtable ["Airtable Sandboxed Environment"]
        UI["React UI Component (ui.tsx)"]
        Config["Global Config / Admin Settings"]
        Record["Airtable Record / Table Data"]
    end

    subgraph Auth ["Authentication Module"]
        JWTGen["JWT Generator (clmAuth.ts)"]
        WebCrypto["Web Crypto API (RS256)"]
        TokenCache["In-Memory Token Cache"]
    end

    subgraph DocuSign ["DocuSign CLM API"]
        OAuthEP["DocuSign OAuth Server (/oauth/token)"]
        WorkflowAPI["CLM Workflow Task API (/v2/.../workflows/.../tasks)"]
        ContentAPI["CLM Content API (/content/v2/.../documents)"]
    end

    %% Flow: Settings
    Config -->|Loads Config| UI

    %% Flow: Auth
    UI -->|Triggers Action| JWTGen
    JWTGen -->|Signs with RSA Key| WebCrypto
    JWTGen -->|Check / Store Token| TokenCache
    JWTGen -->|POST JWT Assertion| OAuthEP
    OAuthEP -->|Returns Bearer Token| TokenCache

    %% Flow: Generate Contract
    Record -->|Extract Mapped Fields| UI
    UI -->|POST Task Params| WorkflowAPI
    WorkflowAPI -->|Returns Document ID| UI
    UI -->|Store Doc ID| Record

    %% Flow: View Contract
    UI -->|GET Binary Stream| ContentAPI
    ContentAPI -->|Return PDF Blob| UI
    UI -->|Open Object URL| BrowserTab["Browser PDF View"]
