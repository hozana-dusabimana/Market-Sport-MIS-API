# 💳 Lanari Payment API Integration Guide

## Overview

The Market Spot application now supports **Lanari Mobile Money Payments** for payment processing. This integration allows sellers to receive payments directly through Lanari's mobile money platform.

---

## 📋 Table of Contents

1. [Setup & Configuration](#setup--configuration)
2. [API Endpoints](#api-endpoints)
3. [Request/Response Examples](#requestresponse-examples)
4. [Phone Number Validation](#phone-number-validation)
5. [Error Handling](#error-handling)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Setup & Configuration

### 1. Environment Variables

Add your Lanari credentials to `.env` file in the server directory:

```bash
# .env
LANARI_API_KEY=your_api_key_here
LANARI_API_SECRET=your_api_secret_here
LANARI_API_URL=https://www.lanari.rw/lanari_pay/api/payment/process.php
```

**Default Credentials (for testing):**
```bash
LANARI_API_KEY=c85f060f918b53893e3abe8acdbc64ed9148c9a30d1bb39b2cfa194c27080746
LANARI_API_SECRET=cf034117f2ecf6c5048115fc710d27e51284a9cd57223d9bf689ccb0f08a1368d4a3e282a8071a528ab660b564da11a4fa0f661da56b0ed2992d93569b1d5488
```

### 2. Verify Installation

The service is auto-loaded in the payment controller:

```javascript
import lanariPaymentService from '../services/lanariPaymentService.js';
```

---

## API Endpoints

### 1. **Process Lanari Payment (Manual Status)**

```
POST /api/v1/payments/lanari/process
Authorization: Bearer {{authToken}}
Content-Type: application/json
```

**Purpose:** Initiate payment and track status manually

**Request Body:**
```json
{
  "allocation_id": 1,
  "seller_id": 5,
  "amount": 1000,
  "customer_phone": "250788123456",
  "payment_period_start": "2025-01-01",
  "payment_period_end": "2025-01-31",
  "notes": "Monthly rent payment for space SPC-001"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| allocation_id | integer | ✅ | Space allocation ID |
| seller_id | integer | ✅ | Seller ID |
| amount | number | ✅ | Payment amount in  |
| customer_phone | string | ✅ | Customer phone (250788123456 format) |
| payment_period_start | date | ❌ | Period start date |
| payment_period_end | date | ❌ | Period end date |
| notes | string | ❌ | Optional notes |

**Success Response (201 Created):**
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
      "transaction_id": "LANARI_TXN_123456",
      "message": "Payment processed successfully"
    }
  }
}
```

**Status Values:**
- `pending` - Payment awaiting confirmation
- `completed` - Payment successful
- `failed` - Payment failed

---

### 2. **Process Lanari Payment (Auto Confirmation)**

```
POST /api/v1/payments/lanari/process-auto
Authorization: Bearer {{authToken}}
Content-Type: application/json
```

**Purpose:** Initiate payment with automatic confirmation

**Request Body:**
```json
{
  "allocation_id": 1,
  "seller_id": 5,
  "amount": 1000,
  "customer_phone": "250788123456",
  "payment_period_start": "2025-01-01",
  "payment_period_end": "2025-01-31",
  "notes": "Monthly rent payment"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Payment completed successfully",
  "data": {
    "payment_id": 16,
    "transaction_id": "LANARI_TXN_789012",
    "status": "completed",
    "amount_paid": 1000,
    "customer_phone": "250788123456"
  }
}
```

---

### 3. **Get Payment Details**

```
GET /api/v1/payments/{payment_id}
Authorization: Bearer {{authToken}}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment_id": 15,
    "allocation_id": 1,
    "seller_id": 5,
    "seller_name": "John Doe",
    "business_name": "John's Store",
    "seller_phone": "250788123456",
    "amount": 1000,
    "payment_date": "2025-01-15T10:30:00Z",
    "payment_method": "lanari_mobile_money",
    "payment_reference": "MKTS-5-1-1699876543210",
    "payment_period_start": "2025-01-01",
    "payment_period_end": "2025-01-31",
    "status": "pending",
    "mobile_money_provider": "lanari",
    "transaction_id": "LANARI_TXN_123456",
    "space_number": "SPC-001",
    "space_type": "counter",
    "zone_name": "Zone A",
    "allocation_type": "monthly",
    "notes": "Monthly rent payment for space SPC-001"
  }
}
```

---

### 4. **Get All Payments**

```
GET /api/v1/payments?limit=20&offset=0&status=completed&payment_method=lanari_mobile_money
Authorization: Bearer {{authToken}}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| limit | integer | Records per page (default: 100) |
| offset | integer | Pagination offset (default: 0) |
| status | string | Filter: pending, completed, failed |
| payment_method | string | Filter: lanari_mobile_money |
| date_from | date | Filter: from date (YYYY-MM-DD) |
| date_to | date | Filter: to date (YYYY-MM-DD) |

---

### 5. **Update Payment Status**

```
PATCH /api/v1/payments/{payment_id}/status
Authorization: Bearer {{authToken}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "completed"
}
```

**Valid Statuses:**
- `pending` - Awaiting confirmation
- `completed` - Successfully completed
- `failed` - Payment failed

---

## Request/Response Examples

### Example 1: Using cURL

```bash
curl -X POST http://localhost:3000/api/v1/payments/lanari/process \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
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

### Example 2: Using Postman

1. **Create new POST request**
   - URL: `http://localhost:3000/api/v1/payments/lanari/process`

2. **Headers Tab:**
   ```
   Authorization: Bearer {{authToken}}
   Content-Type: application/json
   ```

3. **Body Tab (JSON):**
   ```json
   {
     "allocation_id": 1,
     "seller_id": 5,
     "amount": 1000,
     "customer_phone": "250788123456",
     "payment_period_start": "2025-01-01",
     "payment_period_end": "2025-01-31",
     "notes": "Monthly rent payment"
   }
   ```

4. **Click Send**

### Example 3: Using JavaScript/Fetch

```javascript
const processLanariPayment = async (paymentData) => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/payments/lanari/process', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        allocation_id: paymentData.allocation_id,
        seller_id: paymentData.seller_id,
        amount: paymentData.amount,
        customer_phone: paymentData.customer_phone,
        payment_period_start: paymentData.payment_period_start,
        payment_period_end: paymentData.payment_period_end,
        notes: paymentData.notes
      })
    });

    const result = await response.json();
    console.log('Payment Result:', result);
    return result;
  } catch (error) {
    console.error('Payment Error:', error);
    throw error;
  }
};

// Usage
processLanariPayment({
  allocation_id: 1,
  seller_id: 5,
  amount: 1000,
  customer_phone: '250788123456',
  payment_period_start: '2025-01-01',
  payment_period_end: '2025-01-31',
  notes: 'Monthly rent'
});
```

---

## Phone Number Validation

### Supported Formats

The service automatically converts phone numbers to Lanari format (`250788123456`):

| Input Format | Converted To | Notes |
|---|---|---|
| `250788123456` | `250788123456` | ✅ Already correct |
| `0788123456` | `250788123456` | Local format with 0 |
| `+250788123456` | `250788123456` | International format |
| `788123456` | `250788123456` | Missing country code |

### Validation Rules

```javascript
// Valid formats
✅ "250788123456"      // 12 digits starting with 250
✅ "0788123456"        // 10 digits starting with 0
✅ "+250788123456"     // International format
✅ "788123456"         // 9 digits (will add 250)

// Invalid formats
❌ "123"               // Too short
❌ "25078812345"       // Wrong length
❌ "+1234567890"       // Wrong country code
❌ "abc788123456"      // Contains letters
```

### Manual Phone Formatting

```javascript
const formatPhoneNumber = (phoneNumber) => {
  const formattedPhone = lanariPaymentService.formatPhoneNumber(phoneNumber);
  console.log(`${phoneNumber} → ${formattedPhone}`);
};

formatPhoneNumber('0788123456');     // → 250788123456
formatPhoneNumber('+250788123456');  // → 250788123456
formatPhoneNumber('250788123456');   // → 250788123456
```

---

## Error Handling

### Common Error Responses

#### 1. Missing Required Fields

```json
{
  "success": false,
  "message": "Allocation ID, Seller ID, Amount, and Customer Phone are required"
}
```

**Fix:** Ensure all required fields are included in request body

#### 2. Invalid Phone Number

```json
{
  "success": false,
  "message": "Invalid phone number format. Expected: 250788123456"
}
```

**Fix:** Use valid Rwanda phone number format

#### 3. Allocation Not Found

```json
{
  "success": false,
  "message": "Allocation not found or does not belong to this seller"
}
```

**Fix:** Verify allocation_id and seller_id are correct

#### 4. API Connection Error

```json
{
  "success": false,
  "message": "Payment processing failed: Failed to fetch from Lanari API",
  "error": "Error details here"
}
```

**Fix:** Check internet connection and Lanari API status

#### 5. Unauthorized Request

```json
{
  "success": false,
  "message": "Authentication failed"
}
```

**Fix:** Include valid JWT token in Authorization header

### Error Handling in Code

```javascript
try {
  const response = await fetch('/api/v1/payments/lanari/process', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(paymentData)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success) {
    console.error('Payment failed:', result.message);
    // Show error to user
  } else {
    console.log('Payment successful:', result.data.transaction_id);
    // Show success to user
  }
} catch (error) {
  console.error('Payment error:', error);
  // Show error message
}
```

---

## Testing

### 1. Using Postman Collection

**Import the collection:**

```json
{
  "info": {
    "name": "Lanari Payment Integration",
    "version": "1.0.0"
  },
  "item": [
    {
      "name": "Process Lanari Payment",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{authToken}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"allocation_id\": 1,\n  \"seller_id\": 5,\n  \"amount\": 1000,\n  \"customer_phone\": \"250788123456\",\n  \"payment_period_start\": \"2025-01-01\",\n  \"payment_period_end\": \"2025-01-31\",\n  \"notes\": \"Monthly rent\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/v1/payments/lanari/process",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "v1", "payments", "lanari", "process"]
        }
      }
    }
  ]
}
```

### 2. Test Script (Node.js)

```javascript
// test-lanari-payment.js
import fetch from 'node-fetch';

const testLanariPayment = async () => {
  try {
    const token = 'your_jwt_token_here';

    const response = await fetch('http://localhost:3000/api/v1/payments/lanari/process', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        allocation_id: 1,
        seller_id: 5,
        amount: 1000,
        customer_phone: '250788123456',
        payment_period_start: '2025-01-01',
        payment_period_end: '2025-01-31',
        notes: 'Test payment'
      })
    });

    const result = await response.json();
    console.log('✅ Test Result:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log(`✅ Payment ID: ${result.data.payment_id}`);
      console.log(`✅ Transaction ID: ${result.data.transaction_id}`);
      console.log(`✅ Status: ${result.data.status}`);
    } else {
      console.error(`❌ Error: ${result.message}`);
    }
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
};

testLanariPayment();
```

Run test:
```bash
node test-lanari-payment.js
```

---

## Troubleshooting

### Issue 1: "LANARI_API_KEY is empty"

**Cause:** Environment variables not loaded

**Solution:**
```bash
# Make sure .env file exists in server directory
# Restart server after adding credentials
node server.js
```

### Issue 2: "Network timeout"

**Cause:** Lanari API unavailable or slow connection

**Solution:**
```javascript
// Check API status at https://www.lanari.rw
// Verify internet connection
// Check firewall settings
// Increase timeout in lanariPaymentService.js
```

### Issue 3: "Invalid phone number"

**Cause:** Phone number format incorrect

**Solution:**
```javascript
// Use Rwanda phone numbers only
// Format: 250788123456 (12 digits)
// Or use service's auto-format feature
const formatted = lanariPaymentService.formatPhoneNumber(phoneNumber);
```

### Issue 4: "Payment shows pending but never confirms"

**Cause:** Lanari webhook not configured or customer not completing payment

**Solution:**
```javascript
// Check payment status manually
GET /api/v1/payments/{payment_id}

// Update status if confirmed
PATCH /api/v1/payments/{payment_id}/status
{
  "status": "completed"
}
```

### Issue 5: "401 Unauthorized"

**Cause:** Missing or invalid authentication token

**Solution:**
```javascript
// Get valid token from login endpoint
POST /api/v1/auth/login
{
  "username": "admin",
  "password": "password"
}

// Use returned token in Authorization header
Authorization: Bearer {token}
```

---

## Database Schema

### Payments Table

```sql
CREATE TABLE payments (
  payment_id INT PRIMARY KEY AUTO_INCREMENT,
  allocation_id INT NOT NULL,
  seller_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  payment_period_start DATE,
  payment_period_end DATE,
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  processed_by INT,
  mobile_money_number VARCHAR(20),
  mobile_money_provider VARCHAR(50),
  transaction_id VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (allocation_id) REFERENCES space_allocations(allocation_id),
  FOREIGN KEY (seller_id) REFERENCES sellers(seller_id),
  INDEX idx_payment_status (status),
  INDEX idx_seller_id (seller_id),
  INDEX idx_transaction_id (transaction_id)
);
```

---

## Security Best Practices

### 1. ✅ Protect API Credentials

```bash
# ❌ DON'T commit .env to repository
# ✅ Use .env.example with placeholder values
# ✅ Add .env to .gitignore
```

### 2. ✅ Validate Input

```javascript
// ✅ Validate phone numbers
// ✅ Validate amounts
// ✅ Validate allocation ownership
// ✅ Verify JWT tokens
```

### 3. ✅ Use HTTPS in Production

```javascript
// ✅ Enable HTTPS
// ✅ Use secure cookies
// ✅ Add CORS properly
// ❌ Never expose credentials in logs
```

### 4. ✅ Handle Sensitive Data

```javascript
// ✅ Don't log full phone numbers
// ✅ Don't log transaction details
// ✅ Encrypt stored data if needed
// ✅ Use secure headers
```

---

## Support & Resources

- **Lanari Website:** https://www.lanari.rw
- **API Documentation:** https://www.lanari.rw/api-docs
- **Support Email:** support@lanari.rw
- **Live Chat:** Available on Lanari website

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-15 | Initial Lanari API integration |
| 1.1.0 | TBD | Webhook support coming soon |
| 1.2.0 | TBD | SMS notifications coming soon |

---

**Last Updated:** January 15, 2025
**Status:** ✅ Production Ready
