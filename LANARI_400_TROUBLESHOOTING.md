# 🔧 LANARI 400 ERROR - TROUBLESHOOTING CHECKLIST

## ✅ You've Done Great!

```
✅ Found valid Lanari credentials
✅ Passed API authentication (401 → 400)
✅ Request now reaches Lanari system
❌ Request processing fails (400 error)
```

---

## 🧪 Testing Strategy

The 400 error suggests the **request format or data values** might not match what Lanari expects.

Let's test systematically to find the issue.

---

## Test 1: Check Server Logs First

**Step 1:** Make a payment request
```bash
# Through your API (after server starts)
POST http://localhost:3000/api/v1/payments/lanari/process
Headers: Authorization: Bearer TOKEN
Body: {
  "allocation_id": 1,
  "seller_id": 5,
  "amount": 1000,
  "customer_phone": "250788123456"
}
```

**Step 2:** Check server console output

Look for:
```
🔄 Lanari Payment Request: { ... }
📊 Lanari Response (Status 400): { ... }
```

**What you're looking for:** Exact error message from Lanari

---

## Test 2: Try Different Amounts

Lanari might have amount limits or restrictions.

**Test Case 1: Larger amount**
```json
{
  "allocation_id": 1,
  "seller_id": 5,
  "amount": 50000,
  "customer_phone": "250788123456"
}
```

**Test Case 2: Minimum amount**
```json
{
  "allocation_id": 1,
  "seller_id": 5,
  "amount": 50,
  "customer_phone": "250788123456"
}
```

**Test Case 3: Specific amount**
```json
{
  "allocation_id": 1,
  "seller_id": 5,
  "amount": 5000,
  "customer_phone": "250788123456"
}
```

**Expected result:** If one of these works, you know amount format is the issue.

---

## Test 3: Try Different Phone Formats

Lanari might expect a specific phone format.

**Test Case 1: International format (standard)**
```json
{
  "allocation_id": 1,
  "seller_id": 5,
  "amount": 1000,
  "customer_phone": "250788123456"
}
```

**Test Case 2: Local Rwanda format**
```json
{
  "allocation_id": 1,
  "seller_id": 5,
  "amount": 1000,
  "customer_phone": "0788123456"
}
```

**Test Case 3: No country code**
```json
{
  "allocation_id": 1,
  "seller_id": 5,
  "amount": 1000,
  "customer_phone": "788123456"
}
```

**Expected result:** If one works, you know the correct phone format.

---

## Test 4: Check Required Fields

Maybe Lanari requires or rejects certain fields.

**Test Case 1: Minimal fields only**
```json
{
  "allocation_id": 1,
  "seller_id": 5,
  "amount": 1000,
  "customer_phone": "250788123456"
}
```

**Test Case 2: Without description**
(Your service might add a default description)
- Check if server logs show description being sent
- If included, might be causing issue

**Test Case 3: Different description length**
- Try: "Payment" (short)
- Try: "Market Spot Payment" (medium)
- Try: "Payment for allocation" (longer)

---

## Test 5: Check Data Types

Maybe Lanari expects different data types.

**Possible issues:**
- Amount should be integer (1000) not string ("1000") ✅ Your code does this
- Phone should be string ("250788...") not number ✅ Your code does this
- Currency should be exactly "" (not "" or "RW")

**Check in your request:**
```json
{
  "amount": 1000,           ← Should be number, not string
  "customer_phone": "250788123456",  ← Should be string
  "currency": ""         ← Check exact casing
}
```

---

## 🔍 What To Check In Server Logs

After making a payment request, look at console for:

```
🔄 Lanari Payment Request:
{
  amount: 1000,
  customer_phone: '250788123456',
  currency: '',
  description: 'Market Spot Payment - Allocation #1',
  reference_id: 'MKTS-5-1-1762885...'
}

📊 Lanari Response (Status 400):
{
  success: false,
  message: 'Failed to send payment request',
  error: 'Invalid JSON response from gateway: Syntax error',
  gateway_response: { ... }
}
```

**The key is what's in that gateway_response!** 

Can you share what exact error Lanari returns?

---

## 💬 Questions to Answer

When you test, try to answer:

1. **Does the error change when you change the amount?**
   - Yes → Amount format issue
   - No → Probably not amount

2. **Does the error change when you change the phone?**
   - Yes → Phone format issue  
   - No → Probably not phone

3. **Is the error message always the same?**
   - Yes → Systemic issue (probably their server)
   - No → Data-dependent (we can fix)

4. **Can you see what's in `gateway_response`?**
   - Yes → Share that with Lanari support
   - No → Ask for more detailed logging

---

## 📋 Testing Checklist

### Round 1: Different Amounts
- [ ] Test with 50 (very small)
- [ ] Test with 1000 (original)
- [ ] Test with 50000 (very large)
- [ ] Document which ones work/fail

### Round 2: Different Phone Formats
- [ ] Test with 250788123456 (international)
- [ ] Test with 0788123456 (local)
- [ ] Test with 788123456 (no prefix)
- [ ] Document which works

### Round 3: Minimal Request
- [ ] Remove all optional fields
- [ ] Keep only: api_key, api_secret, amount, phone
- [ ] See if error changes

### Round 4: Different Descriptions
- [ ] Try single word: "Payment"
- [ ] Try simple: "Test"
- [ ] Try without special characters
- [ ] See if error changes

### Round 5: Check Data Types
- [ ] Verify amount is integer
- [ ] Verify phone is string
- [ ] Verify currency is "" (uppercase)
- [ ] Verify all values present

---

## 🆘 When To Contact Support

**Contact Lanari if:**
1. Error message is always the same regardless of input
2. Error shows status 500 from their gateway (server error)
3. Lanari's gateway can't parse JSON (syntax error)
4. You can't figure out the required format

**Tell them:**
```
"I'm getting 400 Bad Request with message:
'Invalid JSON response from gateway: Syntax error'

Your gateway is returning HTTP 500 error.

Can you help me identify:
1. What's wrong with my request?
2. What exact format do you expect?
3. Is there an issue with your gateway?
4. Can you provide example code?"
```

---

## 💡 Pro Tips

1. **Check logs carefully** - The detailed error might reveal the issue
2. **Test one thing at a time** - Change one field per test
3. **Document results** - Note which tests pass/fail
4. **Share findings with Lanari** - They can help faster
5. **Ask for documentation** - Most payment APIs have docs

---

## 🎯 Goal

Get Lanari to return **200 OK** with transaction ID:
```json
{
  "success": true,
  "transaction_id": "LANARI_TXN_123456",
  ...
}
```

---

## 📞 Lanari Support Resources

Before contacting, try to provide:
- ✅ Exact error message from your logs
- ✅ Example request you're sending
- ✅ Your API key (first 10 chars): c85f060f91...
- ✅ Which test values work/fail
- ✅ Any Lanari documentation you have access to

---

**Start with Test 1 (check logs) to see the exact error!** 🔍
