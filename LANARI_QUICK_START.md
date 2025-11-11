# 🚀 Lanari Payment Integration - Quick Start Guide

## What Was Added?

Your Market Spot application now has **complete Lanari Payment API integration** for accepting mobile money payments!

---

## 📁 New Files Created

```
server/
├── src/
│   └── services/
│       └── lanariPaymentService.js      ← New payment service
└── .env.example                          ← Updated with Lanari credentials
```

## 📝 Files Modified

```
server/
├── src/
│   ├── controllers/
│   │   └── payment.controller.js         ← Added Lanari methods
│   └── routes/
│       └── payment.routes.js             ← Added Lanari endpoints
└── .env.example                          ← Added Lanari config
```

---

## ⚙️ Setup (2 Easy Steps)

### Step 1: Add Lanari Credentials to `.env`

In `server/.env`, add:

```bash
# Lanari Payment API Configuration
LANARI_API_KEY=c85f060f918b53893e3abe8acdbc64ed9148c9a30d1bb39b2cfa194c27080746
LANARI_API_SECRET=cf034117f2ecf6c5048115fc710d27e51284a9cd57223d9bf689ccb0f08a1368d4a3e282a8071a528ab660b564da11a4fa0f661da56b0ed2992d93569b1d5488
```

**Note:** These are placeholder credentials. Get your actual credentials from: https://www.lanari.rw

### Step 2: Server Auto-Loads (No Restart Needed!)

The Lanari service is auto-loaded, ready to use! ✅

---

## 🔌 New API Endpoints

### 1. Process Lanari Payment
```
POST /api/v1/payments/lanari/process
Authorization: Bearer {{authToken}}
```

### 2. Process Lanari Payment (Auto-confirm)
```
POST /api/v1/payments/lanari/process-auto
Authorization: Bearer {{authToken}}
```

### 3. Get Payment Details
```
GET /api/v1/payments/{payment_id}
Authorization: Bearer {{authToken}}
```

### 4. Get All Payments
```
GET /api/v1/payments?payment_method=lanari_mobile_money
Authorization: Bearer {{authToken}}
```

### 5. Update Payment Status
```
PATCH /api/v1/payments/{payment_id}/status
Authorization: Bearer {{authToken}}
```

---

## 💳 Quick Test

### Using cURL

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
    "notes": "Monthly space rent"
  }'
```

### Using Postman

1. Create new POST request
2. URL: `http://localhost:3000/api/v1/payments/lanari/process`
3. Headers:
   - `Authorization: Bearer {{authToken}}`
   - `Content-Type: application/json`
4. Body (JSON):
   ```json
   {
     "allocation_id": 1,
     "seller_id": 5,
     "amount": 1000,
     "customer_phone": "250788123456",
     "payment_period_start": "2025-01-01",
     "payment_period_end": "2025-01-31",
     "notes": "Monthly space rent"
   }
   ```
5. Click Send

---

## 📊 Database Fields

All Lanari payments are stored with:

| Field | Value |
|-------|-------|
| payment_method | `lanari_mobile_money` |
| mobile_money_provider | `lanari` |
| transaction_id | From Lanari API |
| payment_reference | Generated reference ID |
| mobile_money_number | Customer phone number |

---

## 🎯 Key Features

✅ **Phone Number Auto-Format**
- Accepts: `0788123456`, `+250788123456`, `250788123456`
- Auto-converts to Lanari format: `250788123456`

✅ **Two Processing Modes**
- **Manual:** Status tracked separately (payment status = `pending` until confirmed)
- **Auto:** Automatic confirmation (payment status = `completed` if Lanari succeeds)

✅ **Complete Payment Tracking**
- Payment ID, Transaction ID, Reference ID
- Payment status (pending/completed/failed)
- Seller info, allocation info, space details
- Payment period tracking

✅ **Error Handling**
- Phone number validation
- Amount validation
- Allocation ownership verification
- API timeout handling
- Comprehensive error messages

---

## 📚 Full Documentation

See **`LANARI_PAYMENT_INTEGRATION.md`** for:

- Complete API reference
- Request/response examples
- Phone number validation guide
- Error handling guide
- Testing procedures
- Security best practices
- Troubleshooting guide

---

## 🔐 Environment Variables

```bash
# Required
LANARI_API_KEY=your_key_here
LANARI_API_SECRET=your_secret_here

# Optional (defaults provided)
LANARI_API_URL=https://www.lanari.rw/lanari_pay/api/payment/process.php
```

---

## 🧪 Test Data

For testing with test allocation:

```javascript
{
  "allocation_id": 1,           // From your database
  "seller_id": 5,               // From your database
  "amount": 1000,               // Amount in RWF
  "customer_phone": "250788123456",  // Valid Rwanda phone
  "payment_period_start": "2025-01-01",
  "payment_period_end": "2025-01-31",
  "notes": "Test payment"
}
```

---

## ❓ FAQs

**Q: How do I get Lanari API credentials?**
A: Visit https://www.lanari.rw and register for developer access

**Q: What phone numbers are supported?**
A: Rwanda mobile numbers in any format (auto-converted to 250788123456 format)

**Q: What's the difference between `/process` and `/process-auto`?**
A: 
- `/process` - Manual status tracking (payment stays `pending` until you confirm)
- `/process-auto` - Automatic confirmation (status set based on Lanari response)

**Q: Can I update payment status manually?**
A: Yes! Use `PATCH /api/v1/payments/{id}/status` with status in body

**Q: How do I see all Lanari payments?**
A: `GET /api/v1/payments?payment_method=lanari_mobile_money`

**Q: What if payment fails?**
A: The payment record is still saved with status `failed` for tracking

---

## 🐛 Troubleshooting

### "Cannot find module 'node-fetch'"
✅ **Fixed!** Using native Node.js fetch instead

### "LANARI_API_KEY is empty"
→ Add credentials to `.env` file in server directory

### "Invalid phone number format"
→ Use Rwanda phone: `0788123456` or `250788123456`

### "Allocation not found"
→ Verify allocation_id and seller_id exist in database

### "Authentication failed"
→ Include valid JWT token in Authorization header

---

## 📞 Support

- **Documentation:** `LANARI_PAYMENT_INTEGRATION.md`
- **Lanari Support:** https://www.lanari.rw
- **API Status:** https://www.lanari.rw/status

---

## ✨ What's Next?

1. ✅ Get Lanari API credentials
2. ✅ Add credentials to `.env`
3. ✅ Test payment endpoints
4. ✅ Integrate with frontend
5. ⏳ (Coming Soon) Webhook support for real-time confirmation
6. ⏳ (Coming Soon) SMS notifications
7. ⏳ (Coming Soon) Payment reconciliation reports

---

**Status:** ✅ Ready to Use
**Version:** 1.0.0
**Last Updated:** January 15, 2025
