# RX-VERIFY

An industry-standard, secure pharmaceutical verification system designed to ensure the authenticity and safety of medicines across the supply chain. RX-Verify enables distributors to securely register drug manifests and empowers pharmacists and patients to verify authenticity, report flags, and combat counterfeit drugs.

## 🌟 Key Features

*   **Role-Based Access Control (RBAC):** Distinct workflows for Distributors, Pharmacists, Patients, and Administrators.
*   **Cryptographic Security:** Utilizes Ed25519 digital signatures to secure lot manifests, ensuring data integrity and non-repudiation without storing private keys on the server.
*   **QR Code Verification:** Automatically generates printable QR codes for lot manifests. Patients can scan these codes to instantly verify medication authenticity and view trust scores.
*   **Trust Score Engine:** Dynamic trust scoring based on verified receipts, crowd-sourced flags, and system-level alerts.
*   **Unified Dashboards:** Dedicated, responsive React dashboards for each user role to manage inventory, track orders, and report issues.

## 🛠️ Technology Stack

### Frontend
*   **Framework:** React 19 (Hooks, Functional Components)
*   **Build Tool:** Vite
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Routing:** React Router DOM v7
*   **Integrations:** JSQR, qrcode.react (QR code management), Axios

### Backend
*   **Framework:** Django 5.0
*   **API:** Django REST Framework (DRF)
*   **Database:** PostgreSQL (via psycopg2)
*   **Authentication:** JWT (djangorestframework-simplejwt)
*   **Cryptography:** PyNaCl (Ed25519 signatures), cryptography
*   **Documentation:** drf-spectacular (Swagger/OpenAPI 3.0)

## 📁 Project Structure

```text
RX-VERIFY/
├── RX-Verify-UI/       # React Frontend Application
│   ├── src/
│   │   ├── components/ # Reusable UI components and page views
│   │   ├── services/   # API abstraction layer
│   │   ├── hooks/      # Custom React hooks
│   │   └── index.css   # Tailwind configuration
│   └── package.json    # Frontend dependencies
│
└── backend/            # Django API Application
    ├── accounts/       # User management and RBAC
    ├── core/           # Main project settings
    ├── entities/       # Distributor and Regulator profiles
    ├── logs/           # Supply chain receipt events
    ├── manifests/      # Lot manifests and cryptography handling
    ├── orders/         # Distributor to Pharmacist orders
    ├── pharmaceuticals/# Medicine registry
    ├── reports/        # Crowd flags and anomaly reporting
    ├── manage.py       # Django CLI
    └── requirements.txt# Backend dependencies
```

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18+)
*   Python (3.11+)
*   PostgreSQL running locally or remotely

### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```
3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Configure Environment Variables:** Create a `.env` file in the `backend` root with your database credentials and secret key.
5.  **Apply Migrations:**
    ```bash
    python manage.py migrate
    ```
6.  **Run the Server:**
    ```bash
    python manage.py runserver
    ```

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd RX-Verify-UI
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```

## 👥 User Roles & Workflows

*   **Distributor:** Registers medicine lots, completely handles digital cryptographic signing using private keys (never stored), and manages orders.
*   **Pharmacist:** Connects with distributors, orders inventory, scans received items to maintain the chain of custody, and reports discrepancies based strictly on physical inspections.
*   **Patient:** Public access user. Scans QR codes on medicine packaging to verify authenticity and submit crowd flags if they experience adverse reactions or suspect counterfeit drugs.
*   **Admin/Regulator:** Oversees the platform's overall operations, investigates severe anomaly flags, and maintains the centralized registry of verified entities.

## 🔁 Data Flow Architecture

The system has four primary data flows. Each flow is isolated by role and enforced at the API permission layer.

---

### 1. Distributor — Manifest Creation & Order Fulfillment

```mermaid
sequenceDiagram
    actor D as Distributor
    participant UI as React Frontend
    participant API as Django REST API
    participant DB as PostgreSQL
    participant Crypto as PyNaCl Ed25519

    D->>UI: Login via POST /api/auth/token/
    UI->>API: Credentials submitted
    API-->>UI: JWT access and refresh tokens returned

    D->>UI: Register Distributor Entity
    UI->>API: POST /api/distributors/
    API->>DB: Save entity with name and public_key
    API-->>UI: Distributor UUID returned

    D->>UI: Create Medicine
    UI->>API: POST /api/medicines/
    API->>DB: Save Medicine record
    API-->>UI: Medicine UUID

    D->>UI: Create Lot Manifest with batch_number, expiry, medicine, distributor
    UI->>API: POST /api/manifests/
    API->>Crypto: Derive signing key from distributor public_key
    Crypto->>Crypto: Sign batch:expiry:distributor_id message
    Crypto-->>API: 128-char hex Ed25519 signature
    API->>DB: Save LotManifest with trust_score 100
    API-->>UI: Manifest UUID and QR content

    D->>UI: Fulfill Order by linking a manifest
    UI->>API: POST /api/orders/id/fulfill/
    API->>DB: Link manifest to order and set status to SHIPPED
    API-->>UI: QR data and batch details
```

---

### 2. Pharmacist — Order Placement & Chain of Custody Verification

```mermaid
sequenceDiagram
    actor P as Pharmacist
    participant UI as React Frontend
    participant API as Django REST API
    participant DB as PostgreSQL
    participant Crypto as PyNaCl Ed25519

    P->>UI: Login, JWT stored
    P->>UI: Place Supply Order with distributor and items
    UI->>API: POST /api/orders/
    API->>DB: Create SupplyOrder, status PENDING, generate delivery token
    API-->>UI: Order ID

    note over UI,API: Distributor ships the order

    P->>UI: Inspect Shipment to view manifest details
    UI->>API: GET /api/orders/id/manifest_details/
    API->>DB: Fetch linked LotManifest
    API-->>UI: digital_signature, batch_number, trust_score

    P->>UI: Scan QR code on physical package
    UI->>API: POST /api/orders/verify_receipt/ with scanned UUID
    API->>DB: Fetch LotManifest by UUID
    API->>Crypto: Run Ed25519 verify_signature
    Crypto-->>API: is_authentic true or false
    API->>DB: Confirm order belongs to this pharmacist
    API->>DB: Set order status to DELIVERED, add trust score bonus
    API-->>UI: VERIFIED with final trust_score and chain of custody confirmed
```

---

### 3. Patient — QR Code Verification & Crowd Flagging

```mermaid
sequenceDiagram
    actor Pat as Patient
    participant UI as React Frontend
    participant API as Django REST API
    participant DB as PostgreSQL
    participant Crypto as PyNaCl Ed25519

    Pat->>UI: Scan QR code on medicine packet
    UI->>API: GET /api/manifests/lot_id/verify-qr/ — no auth required
    API->>DB: Fetch LotManifest with crowd_flags and receipt_events
    API->>Crypto: Run verify_signature
    Crypto-->>API: is_authentic result
    API-->>UI: trust_score, trust_status SAFE or CAUTION or WARNING, medicine details

    alt Medicine appears suspicious or trust score is low
        Pat->>UI: Submit Crowd Flag with issue_type, severity, description
        UI->>API: POST /api/flags/ with JWT
        API->>DB: Save CrowdFlag with lot, user, severity, location
        API->>DB: Recalculate LotManifest trust_score
        note right of DB: CRITICAL -30, HIGH -20, MEDIUM -15, LOW -5
        API-->>UI: Flag created with updated trust_score
    end
```

---

### 4. Trust Score Engine

```mermaid
flowchart TD
    A([LotManifest Created]) --> B[trust_score = 100.00]
    B --> C{Ed25519 Signature Valid?}
    C -- No --> D[trust_score = 0.00 ❌ Forged]
    C -- Yes --> E[Base = 100.00]

    E --> F{Unresolved Crowd Flags?}
    F -- Yes --> G["CRITICAL: -30 per flag
HIGH: -20 per flag
MEDIUM: -15 per flag
LOW: -5 per flag"]
    G --> H[Apply deductions]
    F -- No --> H

    H --> I{Receipt Events?}
    I -- Yes --> J[+2.00 per verified receipt event]
    I -- No --> K

    J --> K[Clamp score to 0.00 – 100.00]

    K --> L{Score Range}
    L -- 80–100 --> M[🟢 SAFE]
    L -- 60–79 --> N[🟡 CAUTION]
    L -- 0–59 --> O[🔴 WARNING]
```

---

### API → Role Permission Matrix

| Endpoint | Patient | Pharmacist | Distributor | Admin |
|---|:---:|:---:|:---:|:---:|
| `GET /api/manifests/{id}/verify-qr/` | ✅ Public | ✅ | ✅ | ✅ |
| `POST /api/manifests/` | ❌ | ❌ | ✅ | ✅ |
| `POST /api/orders/` | ❌ | ✅ | ❌ | ✅ |
| `POST /api/orders/{id}/fulfill/` | ❌ | ❌ | ✅ | ✅ |
| `GET /api/orders/{id}/manifest_details/` | ❌ | ✅ (own) | ✅ (own entity) | ✅ |
| `POST /api/orders/verify_receipt/` | ❌ | ✅ | ❌ | ✅ |
| `POST /api/flags/` | ✅ | ✅ | ❌ | ✅ |
| `POST /api/manifests/{id}/verify/` | ❌ | ✅ | ❌ | ✅ |

## 📄 License

This project is licensed under the terms described in the `LICENSE` file.

