# RxVerify Lite — System Design Diagrams (Mermaid.js)

> **Usage:** Copy any `mermaid` code block below into your research document. These render natively in GitHub, Notion, Obsidian, and any Mermaid-compatible editor.

---

## 1. UML Use Case Diagram

```mermaid
flowchart TB
    subgraph RxVerify["🏥 RxVerify Lite System"]
        UC1["📦 Create Lot Manifest\n(Ed25519 Signed)"]
        UC2["💊 Register Medicine"]
        UC3["📋 Place Supply Order"]
        UC4["🔍 Verify Receipt\n(Scan QR / Batch)"]
        UC5["✅ Confirm Delivery\n(SHA-256 Token)"]
        UC6["🚩 Submit Crowd Flag"]
        UC7["📊 View Trust Score"]
        UC8["🗺️ Fraud Radar\n(Heatmap Dashboard)"]
        UC9["⚙️ Manage Users & Roles"]
        UC10["📈 Review Flagged Lots"]
    end

    Distributor(["🏭 Distributor"])
    Pharmacist(["💊 Pharmacist"])
    Patient(["🧑 Patient"])
    Admin(["🔐 Admin"])

    Distributor --> UC1
    Distributor --> UC2
    Pharmacist --> UC3
    Pharmacist --> UC4
    Pharmacist --> UC5
    Pharmacist --> UC7
    Patient --> UC6
    Patient --> UC7
    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
    Admin --> UC7
```

---

## 2. UML Class Diagram

```mermaid
classDiagram
    class User {
        +UUID id
        +String username
        +String role [Admin|Pharmacist|Patient|Distributor]
        +String pharmacy_name
        +String pharmacy_phone
        +String license_number
        +String company_name
        +DateTime date_joined
        +__str__() String
    }

    class Distributor {
        +UUID id
        +String name
        +Text public_key
        +Boolean is_verified_regulator
        +FK created_by → User
        +__str__() String
    }

    class Medicine {
        +UUID id
        +String name
        +String category
        +String active_ingredient
        +String strength
        +String dosage_form
        +String manufacturer_name
        +FK distributor → Distributor
        +__str__() String
    }

    class LotManifest {
        +UUID id
        +String batch_number [unique]
        +Date expiry_date
        +Text digital_signature [Ed25519 hex]
        +Decimal trust_score [0.00–100.00]
        +FK medicine → Medicine
        +FK distributor → Distributor
        +verify_signature() Boolean
        +calculate_trust_score() Decimal
        +update_trust_score() Decimal
    }

    class SupplyOrder {
        +UUID id
        +FK pharmacist → User
        +FK distributor → Distributor
        +JSON items
        +String status [PENDING|SHIPPED|DELIVERED|REJECTED]
        +OneToOne manifest → LotManifest
        +String delivery_token [SHA-256 hex]
        +DateTime created_at
        +DateTime updated_at
        +save() void
    }

    class CrowdFlag {
        +UUID id
        +String reporter_type
        +String issue_type
        +Text description
        +Float latitude
        +Float longitude
        +String region
        +String severity [CRITICAL|HIGH|MEDIUM|LOW]
        +FK user → User
        +FK lot → LotManifest
        +Boolean is_resolved
        +DateTime created_at
    }

    class ReceiptEvent {
        +UUID id
        +JSON location_coord
        +FK user → User
        +FK lot → LotManifest
        +DateTime created_at
    }

    User "1" --> "*" SupplyOrder : places
    User "1" --> "*" CrowdFlag : reports
    User "1" --> "*" ReceiptEvent : creates
    User "1" --> "0..*" Distributor : creates_by

    Distributor "1" --> "*" Medicine : supplies
    Distributor "1" --> "*" LotManifest : signs
    Distributor "1" --> "*" SupplyOrder : fulfills

    Medicine "1" --> "*" LotManifest : has lots

    LotManifest "1" --> "0..1" SupplyOrder : chain of custody
    LotManifest "1" --> "*" CrowdFlag : flagged by
    LotManifest "1" --> "*" ReceiptEvent : verified by
```

---

## 3. DFD Level 1 — System Overview

```mermaid
flowchart LR
    Dist(["🏭 Distributor"])
    Pharm(["💊 Pharmacist"])
    Pat(["🧑 Patient"])
    Adm(["🔐 Admin"])

    subgraph API["⚙️ Django REST API"]
        P1["1.0\nManifest\nService"]
        P2["2.0\nOrder\nService"]
        P3["3.0\nVerification\nEngine"]
        P4["4.0\nCrowd Flag\nService"]
        P5["5.0\nTrust Score\nEngine"]
        P6["6.0\nFraud Radar\nService"]
    end

    DB[("🗄️ PostgreSQL\nDatabase")]

    Dist -- "Signed Manifest\n+ Public Key" --> P1
    P1 -- "Store Manifest\n+ Signature" --> DB

    Pharm -- "Place Order\n(items, distributor_id)" --> P2
    P2 -- "Generate SHA-256\nDelivery Token" --> DB

    Pharm -- "Scan QR UUID\n+ Delivery Token" --> P3
    P3 -- "Fetch Manifest\n+ Verify Ed25519" --> DB
    P3 -- "Verification\nResult" --> Pharm

    Pat -- "Submit Flag\n(issue, severity, GPS)" --> P4
    P4 -- "Store Flag" --> DB

    P4 -- "Trigger\nRecalculation" --> P5
    P3 -- "Receipt +2.00\nBonus" --> P5
    P5 -- "Updated\nTrust Score" --> DB

    Adm -- "Request\nHeatmap Data" --> P6
    P6 -- "Geo-aggregated\nFlag Data" --> DB
    P6 -- "Heatmap\nPayload" --> Adm
```

---

## 4. DFD Level 2 — Pharmacist Verification Process

```mermaid
flowchart TB
    Pharm(["💊 Pharmacist\nDashboard"])
    DistStore[("🔑 Distributor\nKey Store")]
    DB[("🗄️ PostgreSQL")]

    Pharm -- "1. Scanned QR UUID" --> P2_1
    DB -- "2. Delivery Token\n+ LotManifest" --> P2_1

    subgraph VerifyReceipt["Process: Verify Receipt"]
        P2_1["2.1\nFetch Order &\nLot Manifest"]
        P2_2["2.2\nCryptographic\nSignature Validation\n(PyNaCl Ed25519)"]
        P2_3["2.3\nChain of Custody\nValidation"]
        P2_4["2.4\nTrust Score\nUpdate"]
    end

    P2_1 -- "batch_number\nexpiry_date\ndigital_signature\ndistributor_id" --> P2_2
    DistStore -- "3. Public Key\n(Ed25519)" --> P2_2

    P2_2 -- "Signature\nValid/Invalid" --> P2_3
    P2_3 -- "Match\norder.pharmacist_id\n== request.user.id" --> P2_4

    P2_4 -- "If valid:\n+2.00 Receipt Bonus\nCreate ReceiptEvent" --> DB

    P2_4 -- "Verification Results:\n• Authenticity Status\n• Final Trust Score\n• Updated Order Status" --> Pharm

    style P2_2 fill:#1a1a2e,stroke:#e94560,color:#fff
    style P2_3 fill:#1a1a2e,stroke:#0f3460,color:#fff
    style P2_4 fill:#1a1a2e,stroke:#16c79a,color:#fff
```

### Sub-Process Details

| Sub-Process | Input | Logic | Output |
|---|---|---|---|
| **2.1 Fetch** | QR UUID | Lookup `SupplyOrder` + joined `LotManifest` | Manifest payload |
| **2.2 Crypto Validation** | `batch_number:expiry_date:distributor_id`, signature hex, public key | `nacl.signing.VerifyKey.verify(message, signature)` | `Boolean` (pass/fail) |
| **2.3 Chain of Custody** | `order.pharmacist_id`, `request.user.id` | Identity match assertion | `Boolean` (authorized/unauthorized) |
| **2.4 Trust Score Update** | validation results, existing `trust_score` | If valid → `+2.00`, create `ReceiptEvent`; if fail → score `0.00` | Final `Decimal` score |

---

## 5. UML Sequence Diagram — Pharmacist Verification Flow

```mermaid
sequenceDiagram
    actor Ph as Pharmacist
    participant UI as React Vite UI
    participant API as Django REST API
    participant DB as PostgreSQL
    participant PyNaCl as PyNaCl Engine

    Ph->>UI: Scan QR Code (batch UUID)
    UI->>API: GET /api/orders/{uuid}/verify/
    activate API

    API->>DB: SELECT SupplyOrder WHERE id = uuid
    DB-->>API: SupplyOrder + delivery_token

    API->>DB: SELECT LotManifest WHERE id = order.manifest_id
    DB-->>API: LotManifest (batch_number, expiry_date, digital_signature, distributor_id)

    API->>DB: SELECT Distributor WHERE id = manifest.distributor_id
    DB-->>API: Distributor (public_key)

    Note over API,PyNaCl: Construct message:<br/>"{batch_number}:{expiry_date}:{distributor_id}"

    API->>PyNaCl: verify_signature()
    activate PyNaCl

    PyNaCl->>PyNaCl: seed = hex(public_key)[:32]
    PyNaCl->>PyNaCl: verify_key = SigningKey(seed).verify_key
    PyNaCl->>PyNaCl: verify_key.verify(message_bytes, signature_bytes)

    alt Signature Valid
        PyNaCl-->>API: return True
        deactivate PyNaCl

        API->>API: Chain of Custody Check<br/>order.pharmacist_id == request.user.id

        alt Custody Match
            API->>DB: INSERT ReceiptEvent (user, lot, location)
            API->>DB: UPDATE LotManifest SET trust_score = calculate_trust_score()
            Note over API,DB: Trust Score: base 100.00<br/>- flag penalties + receipt bonuses (+2.00 each)

            API-->>UI: 200 OK {authentic: true, trust_score: 98.00, status: "DELIVERED"}
        else Custody Mismatch
            API-->>UI: 403 Forbidden {error: "Unauthorized recipient"}
        end

    else Signature Invalid
        PyNaCl-->>API: return False
        API->>DB: UPDATE LotManifest SET trust_score = 0.00
        API-->>UI: 200 OK {authentic: false, trust_score: 0.00, status: "REJECTED"}
    end

    deactivate API
    UI-->>Ph: Display Verification Dashboard<br/>(Authenticity Badge, Trust Score, Order Status)
```

---

## 6. Trust Score Algorithm — Decision Flowchart

```mermaid
flowchart TD
    Start(["calculate_trust_score()"]) --> CryptoCheck{"verify_signature()\nEd25519 Valid?"}

    CryptoCheck -- "❌ Invalid" --> Zero["Return 0.00\n(Instant Fail)"]
    CryptoCheck -- "✅ Valid" --> Base["Base Score = 100.00"]

    Base --> Flags{"Unresolved\nCrowdFlags?"}

    Flags -- "Yes" --> Deduct["Apply Penalties:\n• CRITICAL → −30.00\n• HIGH → −20.00\n• MEDIUM → −15.00\n• LOW → −5.00"]

    Flags -- "No" --> Receipts

    Deduct --> Receipts{"ReceiptEvents\nexist?"}

    Receipts -- "Yes" --> Bonus["Add Bonus:\n+2.00 per verified receipt"]
    Receipts -- "No" --> Cap

    Bonus --> Cap{"Score\nCapping"}
    Cap --> MaxCheck{"score > 100?"}
    MaxCheck -- "Yes" --> SetMax["score = 100.00"]
    MaxCheck -- "No" --> MinCheck{"score < 0?"}
    MinCheck -- "Yes" --> SetMin["score = 0.00"]
    MinCheck -- "No" --> Final

    SetMax --> Final
    SetMin --> Final

    Final(["Return final_score\n(Decimal 0.00–100.00)"])

    style Zero fill:#e94560,stroke:#1a1a2e,color:#fff
    style Final fill:#16c79a,stroke:#1a1a2e,color:#fff
    style Base fill:#0f3460,stroke:#e2e2e2,color:#fff
```
