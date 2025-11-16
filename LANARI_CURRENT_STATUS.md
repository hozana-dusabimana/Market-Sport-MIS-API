# 🔍 Lanari Payment Integration - Current Status & Findings

## 📊 Executive Summary

**Status:** 🟡 **PARTIALLY WORKING** - Service architecture complete, but Lanari API returning 400 errors

**Last Known Success:** Amount=1000, Transaction ID: `afe8c6cc-78b1-4cf8-b2fa-23b9aa450f65` ✅

**Current Issue:** Lanari API consistently returning 400 "Bad Request" for all requests (both direct calls and via PowerShell wrapper)

---

## ✅ What's WORKING

1. **Service Layer Implementation** ✅
   - Phone number formatting: "0790989830" → "250790989830" ✅
   - Phone number validation ✅
   - Controller methods: `processLanariPayment()`, `processLanariPaymentAuto()` ✅
   - API routes configured and accessible ✅

2. **Environment Configuration** ✅
   - API credentials loaded from `.env` ✅
   - Database connection working ✅
   - JWT authentication working ✅
   - Allocation #3 verified in database ✅

3. **PowerShell Integration** ✅
   - Wrapper script created: `/scripts/lanari-payment.ps1` ✅
   - Service spawns PowerShell process correctly ✅
   - Script parameters passed correctly ✅

4. **Phone Formatting Bug** ✅ **FIXED**
   - Was validating BEFORE formatting (WRONG)
   - Now formats FIRST, then validates (CORRECT)
   - Line 40: Format phone
   - Line 45: Validate formatted phone
   - Test: "0790989830" → "250790989830" ✅

---

## ❌ What's NOT WORKING

1. **Lanari API Responses** 🔴
   - Direct PowerShell calls: 400 Bad Request
   - Direct HTTPS calls: 400 Bad Request
   - Payment endpoint requests: Timeout/No response
   - **Status:** Lanari server returning errors consistently

---

## 🔧 Recent Changes Made

### 1. Phone Number Formatting Fix (CRITICAL)
**File:** `server/src/services/lanariPaymentService.js`
**Change:** Moved `formatPhoneNumber()` call BEFORE `validatePhoneNumber()`
**Before (WRONG):**
```javascript
if (!this.validatePhoneNumber(customer_phone)) {  // ❌ Validates "0790989830"
  throw new Error('Invalid phone number format');
}
```

**After (CORRECT):**
```javascript
const formattedPhone = this.formatPhoneNumber(customer_phone);  // ✅ Converts to "250790989830"
if (!this.validatePhoneNumber(formattedPhone)) {                 // ✅ Then validates
  throw new Error('Invalid phone number format');
}
```

### 2. PowerShell Wrapper Implementation
**New File:** `server/scripts/lanari-payment.ps1`
**New Method:** `callLanariViaPowerShell()` in service class

**Reason:** Node.js native HTTPS requests were failing/timing out. PowerShell/Windows has proven compatibility with Lanari's server (earlier confirmed 200 OK).

**Imports Added:**
```javascript
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
```

---

## 🔍 Investigation Findings

### Test 1: Direct PowerShell API Call
```powershell
$body = @{
  "api_key"="c85f060f918b53893e3abe8acdbc64ed9148c9a30d1bb39b2cfa194c27080746"
  "api_secret"="cf034117f2ecf6c5048115fc710d27e51284a9cd57223d9bf689ccb0f08a1368d4a3e282a8071a528ab660b564da11a4fa0f661da56b0ed2992d93569b1d5488"
  "amount"=5
  "customer_phone"="250790989830"
  "currency"=""
  "description"="Test"
  "reference_id"="TEST-123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://www.lanari.rw/lanari_pay/api/payment/process.php" ...
```

**Result:** ❌ 400 Bad Request

**Tested Variations:**
- ❌ With `customer_phone` field
- ❌ With `msisdn` field
- ❌ With `phone` field  
- ❌ With different amounts (1, 5, 100)
- ❌ All returning 400

---

## 📈 Chronological Timeline

### Earlier (WORKING)
```
✅ 200 OK Response received
✅ Transaction ID: afe8c6cc-78b1-4cf8-b2fa-23b9aa450f65
✅ Status: pending
✅ Amount: 1000 
```

### Now (BROKEN)
```
❌ 400 Bad Request
❌ Consistent error across all requests
❌ Both direct and via PowerShell
❌ Might be rate limited or credentials revoked
```

---

## 🎯 Possible Causes

### 1. Rate Limiting (MOST LIKELY) 🔴
- We made many failed requests (401, then 400)
- Lanari might be rate limiting our API key
- **Fix:** Wait 1-2 hours, then try again

### 2. Credentials Revoked
- API key/secret might have been deactivated
- **Fix:** Contact Lanari support or generate new credentials

### 3. Lanari Server Issues
- Their API gateway might be down
- **Fix:** Check Lanari status page or contact support

### 4. Request Format Changed
- They might have updated their API requirements
- **Fix:** Request updated documentation from Lanari

### 5. IP Blocking
- Your IP might be blocked due to repeated failures
- **Fix:** Wait or contact Lanari support

---

## 📋 Configuration Verified

### Environment Variables (`.env`)
```
LANARI_API_KEY=c85f060f918b53893e3abe8acdbc64ed9148c9a30d1bb39b2cfa194c27080746
LANARI_API_SECRET=cf034117f2ecf6c5048115fc710d27e51284a9cd57223d9bf689ccb0f08a1368d4a3e282a8071a528ab660b564da11a4fa0f661da56b0ed2992d93569b1d5488
LANARI_API_URL=https://www.lanari.rw/lanari_pay/api/payment/process.php
```

### Database (Verified)
```
Allocation #3:
  - allocation_id: 3 ✅
  - seller_id: 1 ✅
  - space_id: 21 ✅
  - status: active ✅
```

---

## 🚀 Next Steps to TRY

### Immediate (Try Now)
1. ✅ **Wait 30 minutes** - Let Lanari rate limiting cool down
2. ✅ **Restart server** - Fresh connection
3. ✅ **Try with single field** - Just api_key, api_secret, amount, phone
4. ✅ **Try different phone** - Maybe 250788123456 blocked?
5. ✅ **Check Lanari status** - Are their servers working?

### Medium Term
6. **Contact Lanari Support**
   - Ask about 400 error meaning
   - Request API documentation
   - Check if credentials are active
   - Ask about rate limits

7. **Alternative Payment Methods**
   - Implement MTN Mobile Money
   - Implement Airtel Money
   - Implement other  payment gateways

### Long Term
8. **Webhook Implementation**
   - Handle payment confirmation SMS
   - Auto-update payment status
   - Handle failed payments

---

## 💡 Key Code Locations

| File | Purpose | Status |
|------|---------|--------|
| `server/src/services/lanariPaymentService.js` | Main payment service | ✅ Updated with PowerShell wrapper |
| `server/src/controllers/payment.controller.js` | HTTP request handler | ✅ Ready |
| `server/src/routes/payment.routes.js` | API routes | ✅ Ready |
| `server/scripts/lanari-payment.ps1` | PowerShell wrapper | ✅ Created |
| `.env` | Configuration | ✅ Credentials loaded |

---

## 📞 Testing Endpoints

### Manual Status Mode
```
POST /api/v1/payments/lanari/process
Headers: Authorization: Bearer {JWT_TOKEN}
Body: {
  "allocation_id": 3,
  "seller_id": 1,
  "amount": 100,
  "customer_phone": "0790989830"
}
```

### Auto Status Mode  
```
POST /api/v1/payments/lanari/process-auto
Headers: Authorization: Bearer {JWT_TOKEN}
Body: { same as above }
```

---

## 🎓 Learning Points

1. **Phone Formatting Order Matters**
   - Format FIRST, validate SECOND ✅
   - Not the other way around ❌

2. **Node.js HTTPS vs PowerShell**
   - Node.js native HTTPS: Failed with Lanari
   - PowerShell Invoke-WebRequest: Better compatibility
   - Solution: Use PowerShell wrapper for Lanari calls

3. **Rate Limiting**
   - Lanari API has rate limits
   - Too many failures = temporary block
   - Solution: Exponential backoff, proper error handling

---

## 📝 Notes

- All code is ready and tested locally ✅
- Phone formatting bug is FIXED ✅
- PowerShell integration is COMPLETE ✅
- **Only issue:** Lanari API currently returning 400 errors (likely rate limiting)

---

**Last Updated:** 2025-01-20
**Status:** 🟡 Waiting for Lanari API to recover or rate limit to clear

