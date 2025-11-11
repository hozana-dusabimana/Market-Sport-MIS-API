# 🔧 Fix Lanari 401 Error - Quick Guide

## ❌ What's Wrong?

Lanari API rejected your credentials:
```
Status: 401 Unauthorized
Message: "Invalid API key or secret"
```

---

## ✅ What to Do

### Option A: Verify Current Credentials (2 minutes)

**1. Check your Lanari dashboard:**
- Log in: https://www.lanari.rw/
- Find: Settings → API Keys or Developer

**2. Compare credentials:**
- Current API Key: `c85f060f918b53893e3abe8acdbc64ed9148c9a30d1bb39b2cfa194c27080746`
- Current API Secret: `cf034117f2ecf6c5048115fc710d27e51284a9cd57223d9bf689ccb0f08a1368d4a3e282a8071a528ab660b564da11a4fa0f661da56b0ed2992d93569b1d5488`

**3. If NOT matching:**
- Get correct credentials from dashboard
- Update `server/.env`
- Restart server
- Test again

---

### Option B: Generate New Credentials

If old credentials:

**1. In Lanari dashboard, click "Generate New API Key"**

**2. Copy the new credentials**

**3. Update `server/.env`:**
```bash
LANARI_API_KEY=paste_new_key_here
LANARI_API_SECRET=paste_new_secret_here
```

**4. Restart server:**
```powershell
cd server
Get-Process -Name node | Stop-Process -Force
node server.js
```

**5. Test payment:**
```bash
curl -X POST http://localhost:3000/api/v1/payments/lanari/process \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "allocation_id": 1,
    "seller_id": 5,
    "amount": 1000,
    "customer_phone": "250788123456"
  }'
```

---

## 📋 Credentials Location

**File:** `c:\xampp\htdocs\Market Spot\server\.env`

Current content:
```env
LANARI_API_KEY=c85f060f918b53893e3abe8acdbc64ed9148c9a30d1bb39b2cfa194c27080746
LANARI_API_SECRET=cf034117f2ecf6c5048115fc710d27e51284a9cd57223d9bf689ccb0f08a1368d4a3e282a8071a528ab660b564da11a4fa0f661da56b0ed2992d93569b1d5488
LANARI_API_URL=https://www.lanari.rw/lanari_pay/api/payment/process.php
```

Update these 2 lines if credentials are wrong.

---

## 🔍 Diagnostic Commands

**Test authentication:**
```bash
cd server
node test-lanari-direct.js
```

**Check if server is running:**
```bash
Get-Process node
```

**View server logs:**
```bash
# Check the terminal where you ran "node server.js"
# Look for error messages
```

---

## 🎯 Expected Response (After Fix)

Once credentials are correct:

```json
{
  "success": true,
  "message": "Payment processed via Lanari",
  "data": {
    "payment_id": 15,
    "transaction_id": "LANARI_TXN_123456",
    "reference_id": "MKTS-5-1-1699...",
    "status": "pending"
  }
}
```

---

## 💬 Need Help?

**Contact Lanari Support:**
1. Tell them you're getting "Invalid API key or secret"
2. Ask if:
   - Your API credentials are active
   - There's an IP whitelist blocking you
   - You need to regenerate credentials
   - They have code examples

**Check:**
- [ ] Lanari account exists
- [ ] API key is activated
- [ ] API secret is copied correctly (no extra spaces!)
- [ ] Endpoint URL is correct
- [ ] No IP restrictions

---

**Status:** 🟡 Awaiting correct Lanari credentials
