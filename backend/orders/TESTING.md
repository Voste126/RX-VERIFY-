# Chain of Custody - Testing Guide

## Quick Test Setup

### Prerequisites
- Backend server running on `http://localhost:8000`
- Three user accounts created:
  - Pharmacist account
  - Distributor account
  - Admin account (optional)

---

## Test Workflow

### Step 1: Authenticate Users

**Get Pharmacist Token:**
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "pharmacist_user",
    "password": "password123"
  }'
```

**Get Distributor Token:**
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "distributor_user",
    "password": "password123"
  }'
```

Save both access tokens for subsequent requests.

---

### Step 2: Create Supply Order (Pharmacist)

```bash
curl -X POST http://localhost:8000/api/orders/ \
  -H "Authorization: Bearer <PHARMACIST_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "distributor": "<DISTRIBUTOR_ENTITY_UUID>",
    "items": [
      {
        "medicine_id": "<MEDICINE_UUID>",
        "name": "Aspirin 500mg",
        "quantity": 100
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "id": "<ORDER_UUID>",
  "pharmacist": "<PHARMACIST_UUID>",
  "pharmacist_name": "pharmacist_user",
  "pharmacist_pharmacy": "City Pharmacy",
  "distributor": "<DISTRIBUTOR_UUID>",
  "distributor_name": "ABC Pharma",
  "items": [...],
  "status": "PENDING",
  "manifest": null,
  "delivery_token": "<SHA256_HASH>",
  "created_at": "2026-02-10T18:00:00Z"
}
```

✅ **Verify:** Order created with status PENDING, no manifest linked yet.

---

### Step 3: Fulfill Order (Distributor)

```bash
curl -X POST http://localhost:8000/api/orders/<ORDER_UUID>/fulfill/ \
  -H "Authorization: Bearer <DISTRIBUTOR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "batch_number": "BATCH-2026-TEST-001",
    "expiry_date": "2027-12-31",
    "medicine_id": "<MEDICINE_UUID>"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "✓ Order fulfilled and QR code generated",
  "qr_data": "<MANIFEST_UUID>",
  "batch_number": "BATCH-2026-TEST-001",
  "trust_score": "100.00",
  "order_status": "SHIPPED"
}
```

✅ **Verify:** 
- Manifest created with Ed25519 signature
- Order status changed to SHIPPED
- QR data returned (manifest UUID)

**Check Manifest Created:**
```bash
curl http://localhost:8000/api/manifests/<MANIFEST_UUID>/ \
  -H "Authorization: Bearer <PHARMACIST_TOKEN>"
```

Should return manifest with `digital_signature` populated and `trust_score: 100.00`.

---

### Step 4: Verify Receipt with Chain (Pharmacist)

```bash
curl -X POST http://localhost:8000/api/orders/verify_receipt/ \
  -H "Authorization: Bearer <PHARMACIST_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "scanned_uuid": "<MANIFEST_UUID>"
  }'
```

**Expected Response (Chain Verified - +10 Bonus):**
```json
{
  "status": "VERIFIED",
  "message": "✓ Chain of Custody Verified - Authorized delivery to you",
  "trust_score": "110.00",
  "base_score": "100.00",
  "bonus_applied": "+10.00",
  "batch_number": "BATCH-2026-TEST-001",
  "expiry_date": "2027-12-31",
  "medicine_name": "Aspirin 500mg",
  "distributor_name": "ABC Pharma",
  "chain_of_custody": true,
  "order_id": "<ORDER_UUID>"
}
```

✅ **Verify:**
- Status is VERIFIED
- Trust score is 110.00 (100 base + 10 bonus)
- `chain_of_custody: true`
- Order status updated to DELIVERED

---

### Step 5: Test Verification Without Chain

Use a different pharmacist or a manifest not linked to an order:

```bash
curl -X POST http://localhost:8000/api/orders/verify_receipt/ \
  -H "Authorization: Bearer <DIFFERENT_PHARMACIST_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "scanned_uuid": "<MANIFEST_UUID>"
  }'
```

**Expected Response (No Chain):**
```json
{
  "status": "VERIFIED",
  "message": "✓ Signature Valid - ⚠ Warning: No order link found",
  "trust_score": "100.00",
  "batch_number": "BATCH-2026-TEST-001",
  "medicine_name": "Aspirin 500mg",
  "chain_of_custody": false,
  "warning": "This manifest is not linked to any order you placed"
}
```

✅ **Verify:**
- Signature is still valid
- Trust score is 100.00 (no bonus)
- `chain_of_custody: false`
- Warning message shown

---

## Test Cases

### ✅ Happy Path Tests

1. **Order Creation**
   - Pharmacist creates order → PENDING status
   - Items stored as JSON
   - Pharmacist auto-assigned

2. **Order Fulfillment**
   - Distributor fulfills order → SHIPPED status
   - Manifest created with signature
   - QR code data returned

3. **Chain Verification**
   - Pharmacist scans QR → +10 bonus
   - Order marked DELIVERED
   - Trust score = 110.00

### ⚠️ Edge Case Tests

1. **Fulfill Non-Pending Order**
   ```bash
   # Try to fulfill an already SHIPPED order
   curl -X POST http://localhost:8000/api/orders/<SHIPPED_ORDER_UUID>/fulfill/ ...
   ```
   **Expected:** 400 Bad Request - "Order is already SHIPPED"

2. **Wrong Distributor Fulfills**
   ```bash
   # Distributor B tries to fulfill Distributor A's order
   ```
   **Expected:** 403 Forbidden - "You can only fulfill orders assigned to your distributor entity"

3. **Duplicate Batch Number**
   ```bash
   # Try to create manifest with existing batch number
   ```
   **Expected:** 400 Bad Request - "Batch number already exists"

4. **Invalid Manifest UUID**
   ```bash
   curl -X POST http://localhost:8000/api/orders/verify_receipt/ \
     -d '{"scanned_uuid": "invalid-uuid"}'
   ```
   **Expected:** 404 Not Found - "Manifest not found"

5. **Missing Authentication**
   ```bash
   curl -X POST http://localhost:8000/api/orders/verify_receipt/ \
     -d '{"scanned_uuid": "<MANIFEST_UUID>"}'
   ```
   **Expected:** 401 Unauthorized

### 🔐 Permission Tests

1. **Non-Pharmacist Creates Order**
   - Distributor/Patient tries to POST /api/orders/
   - **Expected:** Works (any authenticated user can create, but pharmacist auto-assigned)

2. **Non-Distributor Fulfills Order**
   - Pharmacist tries to POST /orders/{id}/fulfill/
   - **Expected:** 403 Forbidden (IsDistributor permission)

3. **Non-Pharmacist Verifies Receipt**
   - Distributor tries to POST /orders/verify_receipt/
   - **Expected:** 403 Forbidden (IsPharmacist permission)

---

## Verification Checklist

- [ ] Order creation returns 201 Created
- [ ] Order shows PENDING status initially
- [ ] Fulfillment creates manifest with signature
- [ ] Fulfillment returns QR data (manifest UUID)
- [ ] Order status changes to SHIPPED after fulfillment
- [ ] Chain verification returns 110.00 trust score
- [ ] Chain verification shows +10.00 bonus
- [ ] Chain verification updates order to DELIVERED
- [ ] Non-chain verification returns 100.00 trust score
- [ ] Non-chain verification shows warning message
- [ ] Invalid UUID returns 404
- [ ] Duplicate batch number rejected
- [ ] Wrong distributor cannot fulfill
- [ ] Already fulfilled order cannot be fulfilled again
- [ ] Permissions enforced correctly

---

## Quick Python Test Script

```python
import requests
import json

BASE_URL = "http://localhost:8000"

# 1. Get tokens
pharmacist_token = requests.post(f"{BASE_URL}/api/token/", json={
    "username": "pharmacist_user",
    "password": "password123"
}).json()["access"]

distributor_token = requests.post(f"{BASE_URL}/api/token/", json={
    "username": "distributor_user",
    "password": "password123"
}).json()["access"]

# 2. Create order
order = requests.post(
    f"{BASE_URL}/api/orders/",
    headers={"Authorization": f"Bearer {pharmacist_token}"},
    json={
        "distributor": "DISTRIBUTOR_UUID",
        "items": [{"medicine_id": "MEDICINE_UUID", "name": "Aspirin", "quantity": 100}]
    }
).json()

print(f"✓ Order created: {order['id']}")

# 3. Fulfill order
fulfillment = requests.post(
    f"{BASE_URL}/api/orders/{order['id']}/fulfill/",
    headers={"Authorization": f"Bearer {distributor_token}"},
    json={
        "batch_number": "BATCH-TEST-001",
        "expiry_date": "2027-12-31",
        "medicine_id": "MEDICINE_UUID"
    }
).json()

manifest_uuid = fulfillment["qr_data"]
print(f"✓ Order fulfilled: {manifest_uuid}")

# 4. Verify receipt
verification = requests.post(
    f"{BASE_URL}/api/orders/verify_receipt/",
    headers={"Authorization": f"Bearer {pharmacist_token}"},
    json={"scanned_uuid": manifest_uuid}
).json()

print(f"✓ Chain verified: {verification['trust_score']} (bonus: {verification.get('bonus_applied', 'N/A')})")
print(f"Status: {verification['message']}")
```

---

## Troubleshooting

### Issue: 403 Forbidden on fulfill
- **Cause:** User is not a distributor or wrong distributor entity
- **Fix:** Ensure distributor user has a linked Distributor entity

### Issue: KeyError on nested fields
- **Cause:** Related objects not properly loaded
- **Fix:** Check serializer includes `select_related()` in queryset

### Issue: No bonus applied
- **Cause:** Order not linked to pharmacist
- **Fix:** Verify pharmacist matches order.pharmacist field

### Issue: Migration errors
- **Cause:** Existing data conflicts
- **Fix:** Run `python manage.py migrate --fake orders zero` then `python manage.py migrate orders`
