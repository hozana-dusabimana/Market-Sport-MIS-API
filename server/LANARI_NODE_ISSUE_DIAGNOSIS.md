# 🔴 LANARI API INTEGRATION - ISSUE DIAGNOSIS

## Problem Summary

✅ **Credentials are valid** - Confirmed working with direct PowerShell calls  
❌ **Node.js HTTPS requests are timing out** - Not reaching Lanari properly  
✅ **REST API endpoint is working** - Can accept requests, validates data  
❌ **Lanari gateway communication failing** - When called from Node.js server

---

## What's Working

```
PowerShell Direct → Lanari API ✅ SUCCESS
```

Example that worked:
```powershell
$body = @{
    "api_key"="c85f060f918b53893e3abe8acdbc64ed9148c9a30d1bb39b2cfa194c27080746"
    "api_secret"="cf034117f2ecf6c5048115fc710d27e51284a9cd57223d9bf689ccb0f08a1368d4a3e282a8071a528ab660b564da11a4fa0f661da56b0ed2992d93569b1d5488"
    "amount"=5
    "customer_phone"="0790989830"
    "currency"="RWF"
    "description"="Payment"
} | ConvertTo-Json

Invoke-WebRequest -Uri 'https://www.lanari.rw/lanari_pay/api/payment/process.php' -Method POST -ContentType 'application/json' -Body $body
# Response: 200 OK ✅
```

---

## What's NOT Working

```
Client → Your Node.js Server → Lanari API ❌ TIMEOUT/FAILURE
```

**Error Chain:**
1. Client sends request to your server endpoint ✅
2. Your server validates allocation & formats phone ✅
3. Your server calls Lanari HTTPS API ❌ **HANGS or 400 error**
4. Request times out after 30 seconds
5. Server crashes or returns error to client

---

## Root Cause Analysis

### Potential Issues:

1. **Node.js TLS/HTTPS Module Issue**
   - Different TLS version than PowerShell
   - Different cipher suites
   - SNI (Server Name Indication) issues
   - Certificate validation issues

2. **Lanari Server Configuration**
   - May reject certain user-agents
   - May have IP whitelist
   - May require specific headers
   - May not support Node.js client format

3. **Network/Firewall**
   - XAMPP environment restrictions
   - Windows firewall blocking
   - Router/ISP blocking HTTPS to Lanari
   - Node.js process isolation issues

---

## Solution Approach

### **Option 1: Use Proxy Service (RECOMMENDED)**

Instead of Node making direct HTTPS calls, use an **intermediate service** that works:

```
Your Server → PowerShell/Windows API → Lanari API
```

Or:

```
Your Server → Python Script → Lanari API
```

Or:

```
Your Server → PHP Script → Lanari API
```

### **Option 2: Use Different HTTP Client**

Try alternative Node modules:
- `axios` instead of native https
- `got` HTTP client
- `node-fetch` with different options
- `undici` (newer replacement for fetch)

### **Option 3: Use Lanari Webhook Approach**

Queue payment requests async and have a separate worker process handle them using PowerShell.

### **Option 4: Contact Lanari Support**

Provide them with:
- Your Node.js version: `22.12.0`
- Error message: "Failed to send payment request"
- Request format (body structure)
- Ask if they have Node.js SDK or API examples

---

## Recommended Fix

Create a **Node.js wrapper** that calls a **PowerShell script** to make the Lanari request:

### File: `server/src/services/lanariPaymentService.js` (MODIFIED)

```javascript
import { spawn } from 'child_process';
import path from 'path';

class LanariPaymentService {
  async processPayment(paymentData) {
    const {
      amount,
      customer_phone,
      description,
      currency = 'RWF',
      reference_id = `MKT-${Date.now()}`
    } = paymentData;

    // Format phone
    const formattedPhone = this.formatPhoneNumber(customer_phone);
    
    // Validate
    if (!this.validatePhoneNumber(formattedPhone)) {
      throw new Error('Invalid phone number format');
    }

    // Call PowerShell script instead of direct HTTPS
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'lanari-payment.ps1');
      
      const ps = spawn('powershell.exe', [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', scriptPath,
        JSON.stringify({
          api_key: process.env.LANARI_API_KEY,
          api_secret: process.env.LANARI_API_SECRET,
          amount: Math.round(amount),
          customer_phone: formattedPhone,
          currency,
          description,
          reference_id
        })
      ]);

      let output = '';
      let error = '';

      ps.stdout.on('data', (data) => {
        output += data.toString();
      });

      ps.stderr.on('data', (data) => {
        error += data.toString();
      });

      ps.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`PowerShell error: ${error}`));
          return;
        }

        try {
          const result = JSON.parse(output);
          resolve({
            success: result.success,
            transaction_id: result.transaction_ref || result.gateway_response?.data?.transaction_id,
            reference_id,
            status: result.status,
            message: result.message,
            raw_response: result
          });
        } catch (e) {
          reject(new Error(`Failed to parse response: ${output}`));
        }
      });
    });
  }

  formatPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return '250' + cleaned.substring(1);
    }
    if (cleaned.startsWith('250')) {
      return cleaned;
    }
    if (cleaned.length === 10) {
      return '250' + cleaned;
    }
    return cleaned;
  }

  validatePhoneNumber(phoneNumber) {
    const phoneRegex = /^250\d{9}$/;
    return phoneRegex.test(phoneNumber);
  }
}

export default new LanariPaymentService();
```

### File: `server/scripts/lanari-payment.ps1` (NEW)

```powershell
param([string]$PaymentData)

$data = $PaymentData | ConvertFrom-Json

$body = @{
    "api_key" = $data.api_key
    "api_secret" = $data.api_secret
    "amount" = $data.amount
    "customer_phone" = $data.customer_phone
    "currency" = $data.currency
    "description" = $data.description
    "reference_id" = $data.reference_id
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest `
        -Uri 'https://www.lanari.rw/lanari_pay/api/payment/process.php' `
        -Method POST `
        -ContentType 'application/json' `
        -Body $body `
        -TimeoutSec 60

    $response.Content | Write-Host
} catch {
    @{
        success = $false
        message = $_.Exception.Message
        error = $_.Exception.Message
    } | ConvertTo-Json | Write-Host
    exit 1
}
```

---

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Credentials | ✅ Valid | Work with PowerShell |
| Payment Service | ✅ Implemented | Phone formatting works |
| Payment Controller | ✅ Implemented | Validates allocations |
| Database Integration | ✅ Ready | Saves transactions |
| Node.js → Lanari | ❌ Failing | Timeouts/hangs |
| PowerShell → Lanari | ✅ Working | Direct calls succeed |

---

## Next Steps

**IMMEDIATE (Quick Fix):**
1. Create `scripts/lanari-payment.ps1` file (provided above)
2. Update `lanariPaymentService.js` to use PowerShell spawn
3. Test: Should work immediately

**LONG TERM:**
1. Contact Lanari about Node.js compatibility
2. Request Node.js SDK or API documentation
3. Migrate to proper SDK if available
4. Test with `axios` or other HTTP client

---

## Files to Modify

- `server/src/services/lanariPaymentService.js` - Change to use PowerShell
- Create `server/scripts/lanari-payment.ps1` - New PowerShell wrapper

---

## Testing After Fix

```bash
curl -X POST http://localhost:3000/api/v1/payments/lanari/process \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "allocation_id": 3,
    "seller_id": 1,
    "amount": 5,
    "customer_phone": "0790989830",
    "payment_period_start": "2025-11-01",
    "payment_period_end": "2025-11-30",
    "notes": "Test"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Payment processed via Lanari",
  "data": {
    "payment_id": 12345,
    "transaction_id": "xxx",
    "status": "pending"
  }
}
```

---
