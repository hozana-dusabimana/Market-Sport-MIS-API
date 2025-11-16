# 🏗️ Lanari Payment Integration Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATION                          │
│                      (React/Vue Frontend)                            │
│                                                                      │
│  Payment Form → Send to Backend                                      │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ POST /api/v1/payments/lanari/process
                             │ or
                             │ POST /api/v1/payments/lanari/process-auto
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXPRESS SERVER (PORT 3000)                      │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ROUTES: payment.routes.js                                   │   │
│  │ ├─ POST /lanari/process                                     │   │
│  │ └─ POST /lanari/process-auto                                │   │
│  └────────────────┬────────────────────────────────────────────┘   │
│                   │                                                  │
│  ┌────────────────▼────────────────────────────────────────────┐   │
│  │ CONTROLLER: payment.controller.js                           │   │
│  │ ├─ processLanariPayment()                                   │   │
│  │ └─ processLanariPaymentAuto()                               │   │
│  │                                                              │   │
│  │ RESPONSIBILITIES:                                           │   │
│  │ • Validate input (allocation_id, seller_id, amount, phone)  │   │
│  │ • Verify allocation exists and belongs to seller            │   │
│  │ • Format phone number                                       │   │
│  │ • Call payment service                                      │   │
│  │ • Save payment to database                                  │   │
│  │ • Return success/failure response                           │   │
│  └────────────────┬────────────────────────────────────────────┘   │
│                   │                                                  │
│  ┌────────────────▼────────────────────────────────────────────┐   │
│  │ SERVICE: lanariPaymentService.js                            │   │
│  │                                                              │   │
│  │ ┌──────────────────────────────────────────────────────┐   │   │
│  │ │ processPayment(paymentData)                          │   │   │
│  │ │ ├─ Validate phone number format                      │   │   │
│  │ │ ├─ Validate amount > 0                               │   │   │
│  │ │ ├─ Build API request payload                         │   │   │
│  │ │ ├─ Call Lanari API (30s timeout)                     │   │   │
│  │ │ ├─ Parse response                                    │   │   │
│  │ │ └─ Return structured response                        │   │   │
│  │ └──────────────────────────────────────────────────────┘   │   │
│  │                                                              │   │
│  │ ┌──────────────────────────────────────────────────────┐   │   │
│  │ │ formatPhoneNumber(phoneNumber)                       │   │   │
│  │ │ • Converts 0788123456 → 250788123456                 │   │   │
│  │ │ • Converts +250788123456 → 250788123456              │   │   │
│  │ │ • Validates final format with regex                  │   │   │
│  │ └──────────────────────────────────────────────────────┘   │   │
│  │                                                              │   │
│  │ ┌──────────────────────────────────────────────────────┐   │   │
│  │ │ validatePhoneNumber(phoneNumber)                     │   │   │
│  │ │ • Checks if 12 digits starting with 250              │   │   │
│  │ └──────────────────────────────────────────────────────┘   │   │
│  └────────────────┬────────────────────────────────────────────┘   │
│                   │                                                  │
└───────────────────┼──────────────────────────────────────────────────┘
                    │
                    │ HTTPS POST Request
                    │ {
                    │   api_key: "...",
                    │   api_secret: "...",
                    │   amount: 1000,
                    │   customer_phone: "250788123456",
                    │   currency: "",
                    │   description: "...",
                    │   reference_id: "..."
                    │ }
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LANARI PAYMENT API                               │
│              https://www.lanari.rw/lanari_pay/api/...               │
│                                                                      │
│ Lanari Mobile Money Gateway                                         │
│ ├─ Process payments                                                 │
│ ├─ Validate transactions                                            │
│ ├─ Send customer notifications                                      │
│ └─ Return transaction status                                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ Response
                             │ {
                             │   success: true/false,
                             │   status: "success/failed",
                             │   transaction_id: "LANARI_TXN_...",
                             │   message: "...",
                             │   ...
                             │ }
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│               Back to EXPRESS CONTROLLER                            │
│                                                                      │
│ • Parse Lanari response                                             │
│ • Determine payment status (pending/completed/failed)               │
│ • Save payment record to database                                   │
│ • Return response to client                                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    MySQL DATABASE                                   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ PAYMENTS TABLE                                               │  │
│  │ ├─ payment_id (PK)                                           │  │
│  │ ├─ allocation_id (FK) → space_allocations                    │  │
│  │ ├─ seller_id (FK) → sellers                                  │  │
│  │ ├─ amount                                                    │  │
│  │ ├─ payment_method = "lanari_mobile_money"                    │  │
│  │ ├─ transaction_id (from Lanari API)                          │  │
│  │ ├─ mobile_money_number (customer phone)                      │  │
│  │ ├─ mobile_money_provider = "lanari"                          │  │
│  │ ├─ payment_reference (generated ID)                          │  │
│  │ ├─ status (pending/completed/failed)                         │  │
│  │ ├─ notes                                                     │  │
│  │ └─ created_at (timestamp)                                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ RELATED TABLES (via JOINs)                                   │  │
│  │ ├─ space_allocations (allocation details)                    │  │
│  │ ├─ sellers (seller info)                                     │  │
│  │ ├─ users (seller contact info)                               │  │
│  │ ├─ spaces (space details)                                    │  │
│  │ └─ zones (zone info)                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    RESPONSE TO CLIENT                               │
│                                                                      │
│ Success Response (201):                                             │
│ {                                                                   │
│   success: true,                                                    │
│   message: "Payment processed via Lanari",                          │
│   data: {                                                           │
│     payment_id: 15,                                                 │
│     transaction_id: "LANARI_TXN_123456",                            │
│     reference_id: "MKTS-5-1-1699876543210",                         │
│     status: "pending"                                               │
│   }                                                                 │
│ }                                                                   │
│                                                                      │
│ OR                                                                  │
│                                                                      │
│ Error Response (400/500):                                           │
│ {                                                                   │
│   success: false,                                                   │
│   message: "Error description",                                     │
│   error: "Detailed error message"                                   │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CLIENT DISPLAYS RESULT                           │
│                   (UI shows payment status)                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow - Manual Status Mode

```
1. USER INITIATES PAYMENT
   └─ Clicks "Pay via Lanari" button

2. FRONTEND SENDS REQUEST
   └─ POST /api/v1/payments/lanari/process
      {
        allocation_id: 1,
        seller_id: 5,
        amount: 1000,
        customer_phone: "250788123456"
      }

3. CONTROLLER VALIDATES
   ├─ Check allocation exists
   ├─ Verify seller_id matches
   ├─ Format phone number
   └─ Call service

4. SERVICE CALLS LANARI
   └─ POST https://www.lanari.rw/lanari_pay/api/payment/process.php
      {
        api_key: "...",
        api_secret: "...",
        amount: 1000,
        customer_phone: "250788123456",
        description: "Market Spot Payment - Allocation #1",
        reference_id: "MKTS-5-1-1699876543210"
      }

5. LANARI RESPONDS
   └─ {
        success: true,
        status: "pending",
        transaction_id: "LANARI_TXN_123456"
      }

6. PAYMENT SAVED TO DATABASE
   └─ INSERT INTO payments (
        allocation_id: 1,
        seller_id: 5,
        amount: 1000,
        payment_method: "lanari_mobile_money",
        status: "pending",
        transaction_id: "LANARI_TXN_123456",
        ...
      )

7. RESPONSE SENT TO CLIENT
   └─ {
        success: true,
        data: {
          payment_id: 15,
          transaction_id: "LANARI_TXN_123456",
          status: "pending"
        }
      }

8. ADMIN LATER CONFIRMS PAYMENT
   └─ PATCH /api/v1/payments/15/status
      { "status": "completed" }

9. STATUS UPDATED IN DATABASE
   └─ UPDATE payments
      SET status = "completed"
      WHERE payment_id = 15
```

---

## Data Flow - Auto Confirmation Mode

```
1. USER INITIATES PAYMENT
   └─ Clicks "Pay via Lanari (Auto-confirm)" button

2. FRONTEND SENDS REQUEST
   └─ POST /api/v1/payments/lanari/process-auto
      (same request body as manual mode)

3-5. SAME AS MANUAL MODE (validate, call Lanari, get response)

6. PAYMENT STATUS DETERMINED
   ├─ If Lanari.success === true
   │  └─ status = "completed"
   └─ If Lanari.success === false
      └─ status = "failed"

7. PAYMENT SAVED WITH FINAL STATUS
   └─ INSERT INTO payments (
        ...,
        status: "completed",  ← Automatic!
        ...
      )

8. RESPONSE SENT TO CLIENT
   └─ {
        success: true,
        message: "Payment completed successfully",
        data: {
          payment_id: 16,
          transaction_id: "LANARI_TXN_789012",
          status: "completed"  ← Already done!
        }
      }

9. CLIENT SHOWS SUCCESS IMMEDIATELY
   └─ No admin intervention needed!
```

---

## File Dependencies

```
payment.routes.js
    ↓
payment.controller.js
    ├─ Uses lanariPaymentService.js
    │   └─ Makes HTTPS calls to Lanari API
    ├─ Uses Payment.model.js
    │   └─ Queries MySQL database
    └─ Uses auth middleware
        └─ Validates JWT tokens

lanariPaymentService.js
    ├─ Uses Node.js built-in fetch API
    └─ Pure utility (no dependencies on other files)

.env.example
    ├─ Contains LANARI_API_KEY
    ├─ Contains LANARI_API_SECRET
    └─ Used by lanariPaymentService at runtime
```

---

## Error Handling Flow

```
REQUEST
  ↓
VALIDATION ERRORS?
  ├─ YES → Return 400 Bad Request
  │        {
  │          success: false,
  │          message: "Field X is required"
  │        }
  └─ NO → Continue

ALLOCATION EXISTS?
  ├─ NO → Return 404 Not Found
  │       {
  │         success: false,
  │         message: "Allocation not found"
  │       }
  └─ YES → Continue

LANARI API CALL
  ├─ NETWORK ERROR → Return 500 Server Error
  │                   {
  │                     success: false,
  │                     message: "Payment processing failed",
  │                     error: "Network error details"
  │                   }
  ├─ API RESPONDS with error → Return 500
  │                             {
  │                               success: false,
  │                               message: "Failed to process Lanari payment",
  │                               error: "Lanari error details"
  │                             }
  └─ API RESPONDS OK → Continue

SAVE TO DATABASE
  ├─ DATABASE ERROR → Return 500 Server Error
  │                   {
  │                     success: false,
  │                     message: "Failed to save payment"
  │                   }
  └─ SUCCESS → Return 201 Created
              {
                success: true,
                data: {
                  payment_id: X,
                  transaction_id: "...",
                  status: "pending" or "completed"
                }
              }
```

---

## Security Layers

```
┌─ HTTPS/TLS (Transport Layer)
│  └─ Encrypts data in transit to/from Lanari

├─ JWT AUTHENTICATION (Application Layer)
│  └─ Only authenticated users can process payments

├─ INPUT VALIDATION (Application Layer)
│  ├─ Phone number format check
│  ├─ Amount validation (> 0)
│  ├─ Allocation ownership verification
│  └─ SQL injection prevention (parameterized queries)

├─ ENVIRONMENT VARIABLES (Credential Storage)
│  └─ API keys/secrets never hardcoded

├─ ERROR HANDLING (Information Security)
│  └─ No sensitive data in error messages

└─ LOGGING (Audit Trail)
   └─ Transaction tracking for compliance
```

---

## Scalability Considerations

```
CURRENT SETUP (Single Server)
  ├─ Express running on port 3000
  ├─ Single MySQL connection pool
  ├─ Synchronous payment processing
  └─ Good for: Development, small-scale

FUTURE IMPROVEMENTS
  ├─ Message Queue (Redis, RabbitMQ)
  │  └─ Async payment processing
  ├─ Webhook Handling
  │  └─ Real-time status updates from Lanari
  ├─ Database Replication
  │  └─ Handle high load
  ├─ Load Balancer
  │  └─ Distribute across multiple servers
  ├─ Caching Layer
  │  └─ Cache payment status queries
  └─ Payment Reconciliation Service
     └─ Periodic sync with Lanari
```

---

## Database Relationships

```
PAYMENTS
  │
  ├─ allocation_id → SPACE_ALLOCATIONS
  │                  │
  │                  ├─ seller_id → SELLERS
  │                  │              │
  │                  │              └─ user_id → USERS
  │                  │
  │                  └─ space_id → SPACES
  │                               │
  │                               └─ zone_id → ZONES
  │
  └─ seller_id → SELLERS
                 │
                 └─ user_id → USERS


PAYMENT FULL DETAILS QUERY
  └─ Joins 5 tables to get complete context:
     ├─ payments (main data)
     ├─ sellers (seller info)
     ├─ users (seller contact via phone_number)
     ├─ spaces (space details)
     └─ zones (zone info)
```

---

## Timeline & Status Tracking

```
PAYMENT LIFECYCLE (Manual Mode)

Step 1: CREATED
  └─ Initial INSERT with status = "pending"
     Created: 2025-01-15 10:30:00
     Status: pending

Step 2: REVIEWED
  └─ Admin checks Lanari status
     Time: 2025-01-15 11:00:00
     Status: pending (waiting for customer confirmation)

Step 3: CONFIRMED (Manual Update)
  └─ Admin updates: PATCH /payments/{id}/status
     Updated: 2025-01-15 12:00:00
     Status: completed

OR

Step 3: FAILED
  └─ Admin updates: PATCH /payments/{id}/status
     Updated: 2025-01-15 12:00:00
     Status: failed


PAYMENT LIFECYCLE (Auto Mode)

Step 1: CREATED with FINAL STATUS
  └─ INSERT with status = "completed" or "failed"
     Created: 2025-01-15 10:30:00
     Status: completed (immediately!)

Step 2: DONE
  └─ No further action needed
```

---

## Performance Metrics

```
EXPECTED RESPONSE TIMES

Normal Request Flow:
  ├─ Input Validation: ~1-2 ms
  ├─ Database Query: ~5-10 ms
  ├─ Lanari API Call: ~1-5 seconds (network dependent)
  ├─ Database INSERT: ~5-10 ms
  └─ Total: 1-5 seconds (dominated by Lanari API)

With Network Issues:
  └─ Timeout: 30 seconds (configured limit)

Throughput:
  └─ Single server: ~100-500 concurrent requests
     (depending on DB connection pool size)

Storage:
  └─ Each payment record: ~1 KB
     1000 payments: ~1 MB
     1 million payments: ~1 GB
```

---

**This architecture provides secure, scalable payment processing with Lanari Mobile Money!** 🚀
