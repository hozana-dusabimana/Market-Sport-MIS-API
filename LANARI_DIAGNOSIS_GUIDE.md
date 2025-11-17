# 🔍 LANARI PAYMENT ERROR DIAGNOSIS

## 📊 Current Error

```json
{
    "success": false,
    "message": "Failed to process Lanari payment",
    "error": "Payment processing failed: Lanari API error: Failed to send payment request"
}
```

**Status Code from Lanari:** 400 Bad Request

---

## 🔎 Server Logs Show

```
🔄 Lanari Payment Request: {
  amount: 10,
  customer_phone: '250790989830',
  currency: '',
  description: 'Market Spot Payment - Allocation #3',
  reference_id: 'MKTS-1-3-1762885934037'
}

📊 Lanari Response (Status 400): {
  success: false,
  message: 'Failed to send payment request',
  transaction_ref: '099f5500-2516-4331-901b-fe3448dceb3b',
  status: 'failed',
  error: 'Payment request failed',
  gateway_response: { 
    status: 400, 
    data: { message: 'Payment request failed' } 
  }
}
```

---

## 🎯 Possible Root Causes (In Order of Likelihood)

### 1️⃣ **AMOUNT TOO SMALL** (Most Likely)

**Your amount:** 10 

**Problem:** 10  is probably below Lanari's minimum transaction amount.

**Solution:** Increase amount to 1000+ 

```json
{
    "allocation_id": 3,
    "seller_id": 1,
    "amount": 1000,    ← Change from 10 to 1000
    "customer_phone": "0790989830"
}
```

---

### 2️⃣ **INVALID ALLOCATION OR SELLER**

**Check:** Does allocation_id 3 exist for seller_id 1?

**Solution:** Verify in database:
```sql
-- Check allocation
SELECT * FROM space_allocations 
WHERE allocation_id = 3 AND seller_id = 1;

-- Check seller
SELECT * FROM users 
WHERE user_id = 1 AND user_type = 'seller';
```

If either doesn't exist or doesn't match, use valid IDs.

---

### 3️⃣ **PHONE NUMBER ISSUE**

**Your input:** `0790989830`
**Formatted to:** `250790989830` ✅ Correct length and format

**Potential issues:**
- Phone number doesn't exist in Rwanda
- Number is inactive
- Number has issues with Lanari

**Solutions to try:**
- Use a different valid Rwanda phone (0788, 0789, 0791, 0792, etc.)
- Use international format directly: `250788123456`

---

### 4️⃣ **LANARI ACCOUNT/API ISSUE**

**Possible problems:**
- Your Lanari account is new/unverified
- Account has payment restrictions
- API key has limited permissions
- Lanari's gateway is down

**Solution:** Check your Lanari account dashboard for:
- Account status (Active? Verified?)
- Payment limits
- Any warnings/alerts

---

## ✅ RECOMMENDED TEST

### Test with VALID DATA

Try this exact request:

```json
{
    "allocation_id": 1,
    "seller_id": 5,
    "amount": 1000,
    "customer_phone": "0788123456",
    "notes": "Test payment"
}
```

**Changes made:**
- ✅ Amount increased to 1000 
- ✅ Used allocation_id 1 (seeded default)
- ✅ Used seller_id 5 (likely exists)
- ✅ Used common Rwanda phone format
- ✅ Removed optional period_start/end fields

**First verify these exist:**
```sql
SELECT * FROM space_allocations WHERE allocation_id = 1;
SELECT * FROM users WHERE user_id = 5 AND user_type = 'seller';
```

---

## 🧪 STEP-BY-STEP TROUBLESHOOTING

### Step 1: Verify Database Records

```bash
# Check what allocations exist
SELECT allocation_id, seller_id, zone_id 
FROM space_allocations 
LIMIT 10;

# Check what sellers exist
SELECT user_id, username, user_type 
FROM users 
WHERE user_type = 'seller' 
LIMIT 10;
```

### Step 2: Use Real Data From Database

Once you see what data exists, use those IDs in your payment request.

### Step 3: Try With Larger Amount

```json
{
    "allocation_id": [USE_REAL_ID],
    "seller_id": [USE_REAL_ID],
    "amount": 5000,           ← Large enough amount
    "customer_phone": "0788123456"
}
```

### Step 4: Check Server Logs

After each test, check server console for:
```
📊 Lanari Response (Status ???): 
```

**Expected outcomes:**
- 200 = Success! ✅
- 400 = Request format/data issue
- 401 = Credentials issue
- 500 = Lanari server error

---

## 📋 VERIFICATION CHECKLIST

Before testing, confirm:

- [ ] allocation_id exists in database
- [ ] seller_id exists in database
- [ ] allocation belongs to seller (ALLOCATED status)
- [ ] amount >= 1000  (or Lanari's minimum)
- [ ] customer_phone is valid Rwanda number
- [ ] Server is running
- [ ] .env has valid Lanari credentials

---

## 💡 WHAT WE KNOW

✅ **Credentials are valid** - You passed 401 barrier
✅ **Request format is correct** - Structure is good
✅ **Server is working** - Receives and processes requests
✅ **Phone formatting is correct** - 0790989830 → 250790989830 ✓

❌ **Something in the data is wrong** - Amount, IDs, or account issue

---

## 🎯 NEXT ACTION

**TRY THIS NOW:**

```bash
# 1. Query database for real data
mysql market_spoton_db -e "SELECT allocation_id, seller_id FROM space_allocations LIMIT 5;"

# 2. Use those IDs with amount 5000
POST /api/v1/payments/lanari/process
{
    "allocation_id": [ID_FROM_QUERY],
    "seller_id": [ID_FROM_QUERY],
    "amount": 5000,
    "customer_phone": "0788123456"
}

# 3. Check server console for detailed error
```

---

## 📞 WHEN TO CONTACT LANARI

**Contact them if:**
- You've tried with valid allocation/seller IDs
- Amount is 5000+ 
- Phone number is valid
- Still getting 400 error

**Tell them:**
```
"I'm getting 400 'Failed to send payment request' error
even with valid data (amount 5000, valid allocation, valid phone).

Can you help debug? What could cause this error?
Is there an issue with my account or API key?"
```

---

**Status: 🟡 Need to verify database data and try with larger amount**

**Start with: Query your database to find valid allocation and seller IDs** 🔍
