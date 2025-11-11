# 🔐 How to Find Your CORRECT Lanari API Credentials

## 🎯 Quick Summary

You're getting **401 "Invalid API key or secret"** which means:
- ❌ The credentials you're using don't exist in Lanari's system
- ❌ They might be typo'd, expired, or from wrong account
- ✅ Code is perfect - credentials just need updating

---

## 📍 Step-by-Step: Find Correct Credentials

### Step 1: Log Into Lanari
1. Go to: **https://www.lanari.rw/**
2. Click: **"Login"** or **"Sign In"** or **"Dashboard"**
3. Enter your credentials (email/username and password)
4. Click: **Sign In**

### Step 2: Navigate to API Settings

Once logged in, look for ONE of these:

**Option A: Settings Menu**
- Look for: ⚙️ **Settings** (usually top right)
- Click: Settings
- Find: **API**, **Integration**, **Developer**, or **Keys**

**Option B: Direct URL**
- Try: `https://www.lanari.rw/dashboard/api` 
- Or: `https://www.lanari.rw/account/api`
- Or: `https://www.lanari.rw/developer`

**Option C: Menu/Sidebar**
- Look for menu on left/top
- Click: **Developer** or **API** or **Integrations**

### Step 3: Find Your API Credentials

Once in API section, you should see:

```
┌─────────────────────────────────────┐
│  API Credentials                    │
├─────────────────────────────────────┤
│  API Key:     c85f060f918b53...    │ ← COPY THIS
│  API Secret:  cf034117f2ecf6c5...  │ ← COPY THIS
│  Endpoint:    https://...          │ ← Check if correct
│  Status:      ✅ Active            │ ← Should say Active
└─────────────────────────────────────┘
```

### Step 4: Check 3 Things

#### ✅ Check 1: API Key
Current: `c85f060f918b53893e3abe8acdbc64ed9148c9a30d1bb39b2cfa194c27080746`

Dashboard shows: ________________________

**Match?** [ ] YES  [ ] NO

#### ✅ Check 2: API Secret  
Current: `cf034117f2ecf6c5048115fc710d27e51284a9cd57223d9bf689ccb0f08a1368d4a3e282a8071a528ab660b564da11a4fa0f661da56b0ed2992d93569b1d5488`

Dashboard shows: ________________________

**Match?** [ ] YES  [ ] NO

#### ✅ Check 3: Status
Dashboard shows status: [ ] Active  [ ] Inactive  [ ] Suspended  [ ] Other: ____

---

## 🆘 If You Can't Find API Section

### Try These:
1. **Search:** Press Ctrl+F, type "API"
2. **Look for:** "Developer Mode", "Integration", "Webhook", "Keys"
3. **Check Profile:** Click your profile → Settings → API
4. **Check Menu:** Scroll down menu, look for API/Developer section

### If Still Can't Find:
1. Go to: https://www.lanari.rw/help or https://www.lanari.rw/support
2. Search for: "API credentials", "API key", "developer"
3. Read any documentation

---

## 📝 If Credentials Don't Match

### Scenario 1: Different API Key
- Dashboard shows: **DIFFERENT** key than what you're using
- Solution: Copy the **CORRECT** key from dashboard

### Scenario 2: Status is INACTIVE/SUSPENDED
- Status shows: **Inactive**, **Suspended**, or **Disabled**
- Solution: Click **"Activate"** or **"Enable"** or **"Generate New"**
- Then copy the new key/secret

### Scenario 3: Can't Find Credentials at All
- Dashboard has no API section
- Solution: Click **"Generate API Credentials"** or similar
- New credentials will be created for you

---

## 🔧 Once You Have Correct Credentials

### Update Your .env File

File path: `c:\xampp\htdocs\Market Spot\server\.env`

**Find these lines:**
```bash
LANARI_API_KEY=c85f060f918b53893e3abe8acdbc64ed9148c9a30d1bb39b2cfa194c27080746
LANARI_API_SECRET=cf034117f2ecf6c5048115fc710d27e51284a9cd57223d9bf689ccb0f08a1368d4a3e282a8071a528ab660b564da11a4fa0f661da56b0ed2992d93569b1d5488
```

**Replace with correct ones:**
```bash
LANARI_API_KEY=YOUR_NEW_KEY_FROM_DASHBOARD
LANARI_API_SECRET=YOUR_NEW_SECRET_FROM_DASHBOARD
```

### Restart Server

```powershell
cd c:\xampp\htdocs\Market Spot\server

# Stop old server
Get-Process -Name node | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment
Start-Sleep -Seconds 2

# Start new server
node server.js
```

### Test Payment

```bash
# Option 1: Run diagnostic
node test-lanari-payloads.js

# Option 2: Test via API (after server restarts)
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

## 🎯 Expected Results

### After updating with CORRECT credentials:

**Diagnostic should show:**
```
Status: 200
Response: {
  "success": true,
  "message": "Payment processed",
  "transaction_id": "TXN123456"
}
```

**Payment API should return:**
```json
{
  "success": true,
  "message": "Payment processed via Lanari",
  "data": {
    "payment_id": 15,
    "transaction_id": "LANARI_TXN_123456",
    "status": "pending"
  }
}
```

---

## ⚠️ Common Issues

### Issue: "I don't see any API section"
**Solution:** 
- Account might not be verified
- Contact Lanari to verify account
- Ask them to enable API access

### Issue: "API key keeps changing"
**Solution:**
- Some systems auto-generate keys
- Always use the LATEST key shown
- Don't use old keys

### Issue: "Status says INACTIVE"
**Solution:**
- Click button to activate/enable
- Or contact Lanari support to activate

### Issue: "There are TWO different keys in dashboard"
**Solution:**
- Usually one is "Live" and one is "Test"
- Use the "Live" key for production
- Use the "Test" key for testing

---

## 💾 Save Your Credentials Safely

Once you find correct credentials:

1. **Write them down** (use password manager)
2. **Update .env file** with correct values
3. **DO NOT commit .env to Git** (keep private)
4. **Only share via secure channel** if others need them

---

## 📞 Still Can't Find Them?

Contact Lanari Support:

**Email:** support@lanari.rw (or check their website)
**Phone:** Check www.lanari.rw for number
**Message:** 
```
"I need help finding my API credentials. 
I'm trying to set up payment integration but can't locate 
my API Key and Secret in the dashboard."
```

---

## ✅ Verification Checklist

- [ ] Logged into Lanari dashboard
- [ ] Found API/Settings section
- [ ] Checked API Key in dashboard
- [ ] Checked API Secret in dashboard  
- [ ] Verified both match OR found correct ones
- [ ] Confirmed API status is "Active"
- [ ] Updated .env file with correct credentials
- [ ] Restarted server
- [ ] Tested payment endpoint
- [ ] Got 200 response (or different from 401)

---

**Once you complete these steps, your Lanari payments will work!** ✨
