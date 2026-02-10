# Chain of Custody Feature - Quick Reference

## 📋 API Endpoints

### Orders Management
| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/api/orders/` | GET | Authenticated | List orders (role-filtered) |
| `/api/orders/` | POST | Pharmacist | Create new order |
| `/api/orders/{id}/` | GET | Authenticated | Get order details |
| `/api/orders/{id}/fulfill/` | POST | Distributor | Fulfill order & create manifest |
| `/api/orders/verify_receipt/` | POST | Pharmacist | Verify receipt & get bonus |

---

## 🔑 Key Endpoints Usage

### 1. Fulfill Order (Distributor)
```bash
POST /api/orders/{order_id}/fulfill/
Authorization: Bearer <distributor_token>

{
  "batch_number": "BATCH-2026-001",
  "expiry_date": "2027-12-31",
  "medicine_id": "<uuid>"
}
```

**Returns:** QR code data (manifest UUID), trust score 100.00

---

### 2. Verify Receipt (Pharmacist)
```bash
POST /api/orders/verify_receipt/
Authorization: Bearer <pharmacist_token>

{
  "scanned_uuid": "<manifest_uuid>"
}
```

**Returns:**
- **With Chain**: Trust score 110.00 (+10 bonus)
- **Without Chain**: Trust score 100.00 (warning message)

---

## 🎯 Trust Score System

- **Base Score**: 100.00 (from manifest creation)
- **Chain Bonus**: +10.00 (when verified by authorized recipient)
- **Flag Penalties**: CRITICAL (-15), HIGH (-10), MEDIUM (-5), LOW (-2)
- **Range**: 0.00 to 110.00

---

## ✅ Implementation Status

- [x] SupplyOrder model with chain linking
- [x] Fulfillment endpoint with manifest creation
- [x] Verification endpoint with bonus logic
- [x] Role-based permissions
- [x] Admin interface
- [x] Database migrations
- [x] URL routing configured
- [x] System checks passing

---

## 📂 Files Created

**Django App:**
- `backend/orders/models.py` - SupplyOrder model
- `backend/orders/serializers.py` - 4 specialized serializers
- `backend/orders/views.py` - ViewSet with fulfillment/verification
- `backend/orders/urls.py` - URL routing
- `backend/orders/admin.py` - Admin interface
- `backend/orders/TESTING.md` - Comprehensive test guide

**Configuration:**
- Updated `core/settings.py` - Added 'orders' to INSTALLED_APPS
- Updated `core/urls.py` - Added orders URL routing

---

## 🧪 Testing

See [`TESTING.md`](file:///home/steve/projects/RX-VERIFY-/backend/orders/TESTING.md) for:
- Complete workflow examples
- curl commands for all endpoints
- Edge case tests
- Permission tests
- Python test script

---

## 🔒 Security Features

1. **Ed25519 Signatures** - Cryptographically secure
2. **OneToOne Constraint** - Each manifest links to one order
3. **Role-based Permissions** - Enforced at endpoint level
4. **Delivery Tokens** - SHA-256 hash for offline verification
5. **Immutable Chain** - Cannot reassign shipped manifests
