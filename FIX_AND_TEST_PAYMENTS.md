# ✅ HOW TO FIX & TEST LANARI PAYMENTS

## 🎯 The Issue (FOUND!)

**Allocation 3 is assigned to seller_id 1, which is NOT a seller.**

Actual sellers in system:
- seller_id 3: kwizeriimana
- seller_id 4: seller_paul

---

## 🛠️ FIX (Choose One)

### Option A: Update Database (Quickest)

```sql
UPDATE space_allocations 
SET seller_id = 3 
WHERE allocation_id = 3;
```

### Option B: Create New Allocation

```sql
INSERT INTO space_allocations 
(seller_id, space_id, allocation_date, start_date, end_date, allocation_type, status, approved_by)
VALUES 
(3, 21, NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 'temporary', 'active', 15);
```

Get the new allocation_id and use it.

---

## 🧪 TEST PAYMENT

After fixing the allocation, make this request:

**Endpoint:** `POST http://localhost:3000/api/v1/payments/lanari/process`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
    "allocation_id": 3,
    "seller_id": 3,
    "amount": 1000,
    "customer_phone": "0788123456",
    "notes": "Test payment"
}
```

---

## 📊 Expected Response

### Success (200 OK):
```json
{
    "success": true,
    "message": "Payment processed via Lanari",
    "data": {
        "payment_id": 15,
        "transaction_id": "LANARI_TXN_123456",
        "reference_id": "MKTS-3-3-1762886...",
        "status": "pending"
    }
}
```

### Still Getting Error:
```json
{
    "success": false,
    "message": "Failed to process Lanari payment",
    "error": "..."
}
```

If still failing, check:
- ✅ Allocation exists and is "active"
- ✅ Seller_id matches an actual seller
- ✅ Amount is >= 1000
- ✅ Phone number is valid

---

## 📋 Step-by-Step

1. **Start server:**
   ```bash
   cd c:\xampp\htdocs\Market Spot\server
   node server.js
   ```

2. **Update allocation (Option A):**
   ```sql
   UPDATE space_allocations SET seller_id = 3 WHERE allocation_id = 3;
   ```

3. **Get JWT token:**
   ```bash
   POST http://localhost:3000/api/v1/auth/login
   {
     "username": "kwizeriimana",
     "password": "seller_password"  // or whatever the password is
   }
   ```

4. **Make payment request:**
   ```bash
   POST http://localhost:3000/api/v1/payments/lanari/process
   Headers: Authorization: Bearer {token}
   Body: {
     "allocation_id": 3,
     "seller_id": 3,
     "amount": 1000,
     "customer_phone": "0788123456"
   }
   ```

5. **Check server console for response:**
   ```
   📊 Lanari Response (Status 200 or 400):
   ```

---

## 🎊 What This Fixes

- ✅ Allocation validation will pass
- ✅ Seller validation will pass
- ✅ Database query will find valid record
- ✅ Request will reach Lanari with valid data
- ✅ Should either process successfully or give clear Lanari error

---

**Status: 🟢 READY TO TEST**

**Next: Fix allocation and test payment!** 🚀
