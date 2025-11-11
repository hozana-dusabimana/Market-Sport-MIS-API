# 🚀 Test Lanari Payment - Quick Guide

## ✅ Setup Complete!

Your server is now running with **Lanari API credentials loaded** from the `.env` file.

---

## 🧪 Test Payment Initiation

### Method 1: Using cURL (Manual Test)

```bash
# Step 1: Get Authentication Token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Response: { "success": true, "token": "eyJ..." }
# Copy the token value (without "eyJ...")
```

### Step 2: Process Lanari Payment

```bash
curl -X POST http://localhost:3000/api/v1/payments/lanari/process \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "allocation_id": 1,
    "seller_id": 5,
    "amount": 1000,
    "customer_phone": "250788123456",
    "payment_period_start": "2025-01-01",
    "payment_period_end": "2025-01-31",
    "notes": "Test payment"
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Payment processed via Lanari",
  "data": {
    "payment_id": 15,
    "transaction_id": "LANARI_TXN_123456",
    "reference_id": "MKTS-5-1-1699876543210",
    "status": "pending",
    "lanari_response": {
      "success": true,
      "status": "pending",
      "transaction_id": "LANARI_TXN_123456"
    }
  }
}
```

---

## 🔍 What Was Fixed

### ❌ Problem
- Lanari API credentials were NOT being loaded
- `.env` file was missing
- Service couldn't authenticate with Lanari API

### ✅ Solution
1. **Created `.env` file** with your Lanari credentials:
   ```
   LANARI_API_KEY=c85f060f918b53893e3abe8acdbc64ed9148c9a30d1bb39b2cfa194c27080746
   LANARI_API_SECRET=cf034117f2ecf6c5048115fc710d27e51284a9cd57223d9bf689ccb0f08a1368d4a3e282a8071a528ab660b564da11a4fa0f661da56b0ed2992d93569b1d5488
   ```

2. **Restarted the server** to load environment variables

3. **Now payments can be initiated!**

---

## 📊 Payment Flow

```
Your Request
    ↓
Market Spot API (/payments/lanari/process)
    ↓
LanariPaymentService (validates & formats)
    ↓
Lanari API (https://www.lanari.rw/lanari_pay/api/payment/process.php)
    ↓
Lanari Response (transaction ID, status)
    ↓
Database (payment record saved)
    ↓
Your Response (success with payment_id)
```

---

## 🎯 Status Check

**Server:** ✅ Running on port 3000
**Database:** ✅ Connected
**Lanari Credentials:** ✅ Loaded from .env
**Payment Service:** ✅ Ready to process

---

## 📝 Important Notes

✅ **Credentials are now secure** - Stored in `.env` (not in code)
✅ **Payment service is ready** - No additional setup needed
✅ **All endpoints working** - Manual and auto-confirmation modes
✅ **Phone formatting** - Auto-converts any format to Lanari standard

---

## 🧪 Quick Test Command

Run this to test the full payment flow:

```bash
node test-lanari.js
```

This will:
1. Login with admin credentials
2. Process a Lanari payment
3. Retrieve payment details
4. Show full response

---

## ❓ Troubleshooting

### "LANARI_API_KEY is empty"
→ Make sure server restarted after creating `.env`

### "Invalid phone number"
→ Use Rwanda format: `250788123456` or `0788123456`

### "Allocation not found"
→ Verify allocation_id exists: `SELECT * FROM space_allocations;`

### "Authentication failed"
→ Get fresh token first with login endpoint

---

## ✨ You're Ready!

Payments can now be initiated to Lanari! 🎉

**Test it with cURL or import the Postman collection.**

