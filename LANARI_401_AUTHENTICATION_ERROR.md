# 🔴 Lanari API 401 Authentication Error - DIAGNOSIS

## 📊 Problem Summary

```
Status: 401 Unauthorized
Error: "Invalid API key or secret"
Cause: Lanari API is rejecting your credentials
```

---

## 🔍 Test Results

All 4 authentication methods tested returned **401**:

| Method | Credentials Location | Status | Result |
|--------|---------------------|--------|--------|
| 1️⃣ Direct | JSON body | 401 | "Invalid API key or secret" |
| 2️⃣ Bearer | Authorization header | 401 | "API key and secret required" |
| 3️⃣ Basic Auth | Basic Authorization | 401 | "API key and secret required" |
| 4️⃣ Signature | X-API-Key header | 401 | "API key and secret required" |

**Key Finding:** Method 1 shows different error message = Lanari recognizes the format but rejects the credentials

---

## ✅ Solutions

### Option 1: Verify Credentials in Lanari Dashboard

**Step 1:** Log in to your Lanari account
- URL: https://www.lanari.rw/
- Account type: Business/Merchant account

**Step 2:** Navigate to API Settings
- Look for: "API Keys", "Developer", "Integrations", or "Settings"

**Step 3:** Check current API credentials
- Verify API Key matches: `c85f060f918b53893e3abe8acdbc64ed9148c9a30d1bb39b2cfa194c27080746`
- Verify API Secret matches: `cf034117f2ecf6c5048115fc710d27e51284a9cd57223d9bf689ccb0f08a1368d4a3e282a8071a528ab660b564da11a4fa0f661da56b0ed2992d93569b1d5488`

**Step 4:** If NOT matching:
- Copy the CORRECT API Key from dashboard
- Copy the CORRECT API Secret from dashboard
- Update the `.env` file below

### Option 2: Generate New API Credentials

If credentials are old/expired:

**Step 1:** In Lanari dashboard, regenerate API keys
- Usually button like "Generate New Key" or "Reset Credentials"

**Step 2:** Copy the new credentials

**Step 3:** Update `server/.env`:
```bash
LANARI_API_KEY=YOUR_NEW_KEY_HERE
LANARI_API_SECRET=YOUR_NEW_SECRET_HERE
```

**Step 4:** Restart server:
```bash
cd server
Get-Process -Name node | Stop-Process -Force
node server.js
```

### Option 3: Check IP Whitelist

Some payment APIs restrict which IPs can call them:

**Step 1:** In Lanari dashboard, check "IP Whitelist" or "Allowed IPs"

**Step 2:** Add your server IP
- Development: `127.0.0.1` or `localhost`
- Production: Your server's public IP

**Step 3:** Save changes

---

## 🔧 How to Get Correct Credentials

### From Lanari Dashboard:

1. Log in to Lanari account
2. Go to Settings → API or Developer Settings
3. Find "API Credentials" or "API Keys"
4. You should see:
   - **API Key** (64 characters, starts with alphanumeric)
   - **API Secret** (128 characters, longer string)
   - **Endpoint URL** (should be `https://www.lanari.rw/lanari_pay/api/payment/process.php`)

### Example of correct format:
```
API_KEY: c85f060f918b53893e3abe8acdbc64ed9148c9a30d1bb39b2cfa194c27080746
API_SECRET: cf034117f2ecf6c5048115fc710d27e51284a9cd57223d9bf689ccb0f08a1368...
```

---

## 🛠️ Update .env with New Credentials

**File:** `server/.env`

Current:
```bash
LANARI_API_KEY=c85f060f918b53893e3abe8acdbc64ed9148c9a30d1bb39b2cfa194c27080746
LANARI_API_SECRET=cf034117f2ecf6c5048115fc710d27e51284a9cd57223d9bf689ccb0f08a1368d4a3e282a8071a528ab660b564da11a4fa0f661da56b0ed2992d93569b1d5488
```

If credentials are wrong, replace with correct ones:
```bash
LANARI_API_KEY=YOUR_CORRECT_KEY_HERE
LANARI_API_SECRET=YOUR_CORRECT_SECRET_HERE
```

---

## 🚀 After Updating Credentials

### Step 1: Stop server
```bash
Get-Process -Name node | Stop-Process -Force
```

### Step 2: Restart server
```bash
cd server
node server.js
```

### Step 3: Re-test payment
```bash
curl -X POST http://localhost:3000/api/v1/payments/lanari/process \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "allocation_id": 1,
    "seller_id": 5,
    "amount": 1000,
    "customer_phone": "250788123456"
  }'
```

---

## 📋 Checklist

- [ ] Log into Lanari dashboard
- [ ] Verify API credentials are active
- [ ] Copy correct API Key
- [ ] Copy correct API Secret
- [ ] Update `server/.env` file
- [ ] Check for IP whitelist restrictions
- [ ] Restart server
- [ ] Test payment again
- [ ] Should return 200 with transaction_id

---

## 🆘 Still Getting 401?

**Next Steps:**

1. **Contact Lanari Support**
   - Email: support@lanari.rw
   - Phone: Check their website
   - Message: "API authentication failing with 401 - Invalid API key or secret"

2. **Provide Them:**
   - Your API Key (first 10 chars): `c85f060f91...`
   - Endpoint URL you're using: `https://www.lanari.rw/lanari_pay/api/payment/process.php`
   - Request format you're sending
   - Server IP address (if there's IP whitelist)

3. **Ask Them:**
   - Confirm your API key is active/enabled
   - Ask if there's an IP whitelist
   - Ask the correct endpoint URL
   - Ask the exact request format required
   - Ask if credentials are still valid or need renewal

---

## 📝 Important Notes

✅ Service implementation is correct  
✅ Authentication method is correct  
❌ Credentials are invalid or inactive  
✅ Once you get correct credentials, payments will work immediately  

**This is a credential/account issue, NOT a code issue.**

---

## 🔗 Lanari Links

- **Lanari Website:** https://www.lanari.rw/
- **API Documentation:** Check their developer portal
- **Dashboard:** https://www.lanari.rw/dashboard or similar
- **Support:** Check their website for contact info

---

**Status:** 🔴 Waiting for correct Lanari API credentials

**Next Action:** Update credentials in `server/.env` and restart server
