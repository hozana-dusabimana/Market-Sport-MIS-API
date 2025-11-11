# 📊 Space Creation Field Mapping - Visual Guide

## The Problem vs Solution

```
┌─────────────────────────────────────────────────────────────┐
│                   YOUR REQUEST                              │
├─────────────────────────────────────────────────────────────┤
│ {                                                            │
│   "zone_id": 7,              ✅ CORRECT                     │
│   "space_code": "SPC-001",   ❌ Should be space_number      │
│   "space_type": "Shop",      ❓ Should be standard/premium  │
│   "rent_amount": 150000,     ❌ Should be daily/weekly/...  │
│   "size": "30m²",            ❌ Should be size_sqm (number) │
│   "status": "available"      ✅ CORRECT                     │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                           ⬇️
              Column 'space_number' cannot be null
                           ⬇️
┌─────────────────────────────────────────────────────────────┐
│                   CORRECTED REQUEST                         │
├─────────────────────────────────────────────────────────────┤
│ {                                                            │
│   "zone_id": 7,                    ✅                       │
│   "space_number": "SPC-001",       ✅ FIXED                 │
│   "space_type": "standard",        ✅ FIXED                 │
│   "daily_rate": 5000,              ✅ FIXED                 │
│   "weekly_rate": 30000,            ✅ NEW                   │
│   "monthly_rate": 150000,          ✅ NEW                   │
│   "size_sqm": 30,                  ✅ FIXED                 │
│   "features": "Good location",     ✅ NEW (optional)        │
│   "status": "available"            ✅                       │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                           ⬇️
                    SUCCESS ✅
                           ⬇️
         {
           "success": true,
           "message": "Space created successfully",
           "data": { "space_id": 25 }
         }
```

---

## Field-by-Field Comparison

```
┌──────────────────┬──────────────────┬──────────────────┬────────────────────┐
│   Your Field     │   Expected Field │   Data Type      │   Example Value    │
├──────────────────┼──────────────────┼──────────────────┼────────────────────┤
│ space_code       │ space_number     │ string           │ "SPC-001"          │
│ rent_amount      │ daily_rate       │ number           │ 5000               │
│ (missing)        │ weekly_rate      │ number (opt)     │ 30000              │
│ (missing)        │ monthly_rate     │ number (opt)     │ 150000             │
│ size: "30m²"     │ size_sqm: 30     │ number (opt)     │ 30                 │
│ (missing)        │ features         │ string (opt)     │ "Good location"    │
│ zone_id ✓        │ zone_id          │ number           │ 7                  │
│ space_type ?     │ space_type       │ enum             │ "standard"         │
│ status ✓         │ status           │ enum             │ "available"        │
└──────────────────┴──────────────────┴──────────────────┴────────────────────┘
```

---

## Valid Space Types

```
┌─────────────┬────────────────────────────────────┬──────────────────────┐
│   Type      │   Description                      │   Typical Pricing    │
├─────────────┼────────────────────────────────────┼──────────────────────┤
│ standard    │ Regular market stall/shop          │ 5K-8K daily         │
│ premium     │ High-traffic location              │ 8K-12K daily        │
│ corner      │ Corner position with visibility    │ 10K-15K daily       │
│ storage     │ Storage/warehouse space            │ 1.5K-2.5K daily     │
└─────────────┴────────────────────────────────────┴──────────────────────┘
```

---

## Valid Status Values

```
┌──────────────┬──────────────────────────────────┐
│   Status     │   Meaning                        │
├──────────────┼──────────────────────────────────┤
│ available    │ Space is empty and can be rented │
│ occupied     │ Space is currently allocated     │
│ reserved     │ Space is reserved (soon)         │
│ maintenance  │ Space is under maintenance       │
└──────────────┴──────────────────────────────────┘
```

---

## Pricing Strategy Guide

### Example 1: Standard Space (25m²)
```
Daily Rate:   3,000  RWF
Weekly Rate:  18,000 RWF  (3,000 × 6 = 14.3% discount)
Monthly Rate: 75,000 RWF  (3,000 × 25 = 16.7% discount)
```

### Example 2: Premium Space (40m²)
```
Daily Rate:   8,000  RWF
Weekly Rate:  50,000 RWF  (8,000 × 6.25 = 1.6% discount)
Monthly Rate: 200,000 RWF (8,000 × 25 = 0% discount = bulk price)
```

### Example 3: Corner Space (50m²)
```
Daily Rate:   10,000 RWF
Weekly Rate:  65,000 RWF  (10,000 × 6.5 = 0% discount = premium)
Monthly Rate: 250,000 RWF (10,000 × 25 = 0% discount = premium)
```

---

## Database Schema (For Reference)

```sql
CREATE TABLE spaces (
  space_id INT PRIMARY KEY AUTO_INCREMENT,
  zone_id INT NOT NULL,
  space_number VARCHAR(20) NOT NULL,        ← Your space_code goes here
  space_type ENUM('standard', 
                  'premium', 
                  'corner', 
                  'storage'),
  size_sqm DECIMAL(6,2),                    ← Your size as number
  daily_rate DECIMAL(10,2) NOT NULL,        ← Your rent_amount splits
  weekly_rate DECIMAL(10,2),                ← New field
  monthly_rate DECIMAL(10,2),               ← New field
  status ENUM('available', 
              'occupied', 
              'reserved', 
              'maintenance'),
  features TEXT,                            ← New optional field
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Common Mistakes to Avoid ❌

```
❌ DON'T:
{
  "space_code": "...",           Use space_number instead!
  "rent_amount": 150000,         Use daily_rate, weekly_rate, monthly_rate!
  "size": "30m²",                Use size_sqm: 30 (number, not string)!
  "space_type": "Shop"           Use "standard", "premium", "corner", "storage"!
}

✅ DO:
{
  "space_number": "SPC-001",
  "daily_rate": 5000,
  "weekly_rate": 30000,
  "monthly_rate": 150000,
  "size_sqm": 30,
  "space_type": "standard"
}
```

---

## Quick Copy-Paste Templates

### Minimum Required
```json
{
  "zone_id": 1,
  "space_number": "SP-001",
  "space_type": "standard",
  "daily_rate": 5000
}
```

### Standard Shop
```json
{
  "zone_id": 1,
  "space_number": "SP-STD-001",
  "space_type": "standard",
  "size_sqm": 25,
  "daily_rate": 3000,
  "weekly_rate": 18000,
  "monthly_rate": 75000,
  "features": "Good foot traffic, electricity included"
}
```

### Premium Shop
```json
{
  "zone_id": 1,
  "space_number": "SP-PREM-001",
  "space_type": "premium",
  "size_sqm": 40,
  "daily_rate": 8000,
  "weekly_rate": 50000,
  "monthly_rate": 200000,
  "features": "Prime corner location, high visibility"
}
```

### Storage Unit
```json
{
  "zone_id": 2,
  "space_number": "STOR-01",
  "space_type": "storage",
  "size_sqm": 15,
  "daily_rate": 1500,
  "weekly_rate": 9000,
  "monthly_rate": 40000,
  "features": "Climate controlled, secure storage"
}
```

---

## Testing Workflow

```
1. GET /auth/login
   ⬇️
   Receive token

2. POST /spaces
   ⬇️
   Send CORRECT request format
   ⬇️
   Receive space_id

3. GET /spaces/:id
   ⬇️
   Verify space was created with all fields

4. GET /spaces/available
   ⬇️
   See your newly created space in the list
```

---

## Success Indicators ✅

When you send a correct request, you should see:
- HTTP Status: **201 Created**
- Response:
  ```json
  {
    "success": true,
    "message": "Space created successfully",
    "data": { "space_id": 25 }
  }
  ```

---

**Remember the 3 Main Changes:**
1. `space_code` → `space_number`
2. `rent_amount` → `daily_rate` (+ `weekly_rate`, `monthly_rate`)
3. `size: "30m²"` → `size_sqm: 30`

Good luck! 🚀
