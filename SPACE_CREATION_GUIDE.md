# 📝 Correct Request Format for Creating Spaces

## ❌ Wrong Request Format (What you sent)
```json
{
  "zone_id": 7,
  "space_code": "SPC-001",
  "space_type": "Shop",
  "rent_amount": 150000,
  "size": "30m²",
  "status": "available"
}
```

**Error**: `Column 'space_number' cannot be null`

**Why it failed**:
- ❌ `space_code` → should be `space_number`
- ❌ `rent_amount` → should be `daily_rate`, `weekly_rate`, `monthly_rate`
- ❌ `size` → should be `size_sqm`
- ❌ Missing `daily_rate` or `weekly_rate` or `monthly_rate`

---

## ✅ Correct Request Format

### Minimum Required Fields
```json
{
  "zone_id": 7,
  "space_number": "SPC-001",
  "space_type": "standard",
  "daily_rate": 5000,
  "status": "available"
}
```

### Complete Request (All Fields)
```json
{
  "zone_id": 7,
  "space_number": "SPC-001",
  "space_type": "premium",
  "size_sqm": 30,
  "daily_rate": 5000,
  "weekly_rate": 30000,
  "monthly_rate": 150000,
  "features": "Air conditioning, Electricity, Water access",
  "status": "available"
}
```

---

## 📋 Field Mapping Reference

| Wrong Field | Correct Field | Type | Example |
|-------------|---------------|------|---------|
| `space_code` | `space_number` | string | "SPC-001" |
| `rent_amount` | `daily_rate` | number | 5000 |
| (new) | `weekly_rate` | number | 30000 |
| (new) | `monthly_rate` | number | 150000 |
| `size` | `size_sqm` | number | 30 |

---

## 📌 Field Descriptions

### Required Fields
- **`zone_id`** (number): ID of the zone this space belongs to
  - Must be a valid zone_id that exists in zones table
  - Example: `7`

- **`space_number`** (string): Unique identifier for the space
  - Format: Like "SPC-001", "SP-A-02", etc.
  - Example: `"SPC-001"`

- **`space_type`** (string): Type of space (from enum)
  - Valid values: `standard`, `premium`, `corner`, `storage`
  - Example: `"standard"`

### Optional Fields
- **`size_sqm`** (number): Size in square meters
  - Example: `30`

- **`daily_rate`** (number): Daily rental rate
  - Example: `5000`

- **`weekly_rate`** (number): Weekly rental rate
  - Example: `30000`

- **`monthly_rate`** (number): Monthly rental rate
  - Example: `150000`

- **`features`** (string): Description of space features
  - Example: `"Air conditioning, Electricity, Water access"`

- **`status`** (string): Current status
  - Valid values: `available`, `occupied`, `reserved`, `maintenance`
  - Default: `available`

---

## 🧪 cURL Examples

### Create Standard Space
```bash
curl -X POST http://localhost:3000/api/v1/spaces \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "zone_id": 7,
    "space_number": "SPC-001",
    "space_type": "standard",
    "size_sqm": 25,
    "daily_rate": 3000,
    "weekly_rate": 18000,
    "monthly_rate": 75000,
    "status": "available"
  }'
```

### Create Premium Space
```bash
curl -X POST http://localhost:3000/api/v1/spaces \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "zone_id": 7,
    "space_number": "SPC-002",
    "space_type": "premium",
    "size_sqm": 40,
    "daily_rate": 8000,
    "weekly_rate": 50000,
    "monthly_rate": 200000,
    "features": "Prime location, High foot traffic",
    "status": "available"
  }'
```

### Create Corner Space
```bash
curl -X POST http://localhost:3000/api/v1/spaces \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "zone_id": 7,
    "space_number": "SPC-CORNER-01",
    "space_type": "corner",
    "size_sqm": 50,
    "daily_rate": 10000,
    "weekly_rate": 65000,
    "monthly_rate": 250000,
    "features": "Corner visibility, Heavy foot traffic",
    "status": "available"
  }'
```

### Create Storage Space
```bash
curl -X POST http://localhost:3000/api/v1/spaces \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "zone_id": 7,
    "space_number": "STORAGE-01",
    "space_type": "storage",
    "size_sqm": 15,
    "daily_rate": 1500,
    "weekly_rate": 9000,
    "monthly_rate": 40000,
    "status": "available"
  }'
```

---

## 💡 Price Recommendations

### Standard Spaces (25m²)
- Daily: 3,000 - 5,000
- Weekly: 18,000 - 30,000
- Monthly: 75,000 - 150,000

### Premium Spaces (40m²)
- Daily: 8,000 - 12,000
- Weekly: 50,000 - 75,000
- Monthly: 200,000 - 350,000

### Corner Spaces (50m²)
- Daily: 10,000 - 15,000
- Weekly: 65,000 - 100,000
- Monthly: 250,000 - 500,000

### Storage Spaces (15m²)
- Daily: 1,500 - 2,500
- Weekly: 9,000 - 15,000
- Monthly: 40,000 - 75,000

---

## ✅ Expected Success Response

```json
{
  "success": true,
  "message": "Space created successfully",
  "data": {
    "space_id": 25
  }
}
```

---

## 🔍 Verify Space Was Created

### Get the space you just created
```bash
curl http://localhost:3000/api/v1/spaces/25
```

### Response
```json
{
  "success": true,
  "data": {
    "space_id": 25,
    "zone_id": 7,
    "space_number": "SPC-002",
    "space_type": "premium",
    "size_sqm": 40,
    "daily_rate": 8000,
    "weekly_rate": 50000,
    "monthly_rate": 200000,
    "status": "available",
    "features": "Prime location, High foot traffic",
    "zone_name": "Zone D - West Wing",
    "zone_code": "ZD-001",
    "currentAllocation": null,
    "history": []
  }
}
```

---

## 📊 Database Schema Reference

```sql
CREATE TABLE spaces (
  space_id INT PRIMARY KEY AUTO_INCREMENT,
  zone_id INT NOT NULL,
  space_number VARCHAR(20) NOT NULL,           -- NOT space_code!
  space_type ENUM('standard', 'premium', 'corner', 'storage') NOT NULL,
  size_sqm DECIMAL(6,2),
  daily_rate DECIMAL(10,2) NOT NULL,           -- NOT rent_amount!
  weekly_rate DECIMAL(10,2),
  monthly_rate DECIMAL(10,2),
  status ENUM('available', 'occupied', 'reserved', 'maintenance'),
  features TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (zone_id) REFERENCES zones(zone_id) ON DELETE CASCADE
)
```

---

## ⚠️ Common Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| Using `space_code` | Field doesn't exist | Use `space_number` |
| Using `rent_amount` | Field doesn't exist | Use `daily_rate`, `weekly_rate`, `monthly_rate` |
| Using `size` | Type mismatch | Use `size_sqm` (number, not string) |
| Missing `daily_rate` | Column cannot be null | Provide at least `daily_rate` |
| `size: "30m²"` | Type mismatch | Use `size_sqm: 30` (number only) |

---

## ✨ Summary

**Key Changes**:
1. `space_code` → `space_number`
2. `rent_amount` → `daily_rate`, `weekly_rate`, `monthly_rate`
3. `size: "30m²"` → `size_sqm: 30`

**Before** (❌ Wrong):
```json
{ "zone_id": 7, "space_code": "SPC-001", "rent_amount": 150000, "size": "30m²" }
```

**After** (✅ Correct):
```json
{ "zone_id": 7, "space_number": "SPC-001", "daily_rate": 5000, "weekly_rate": 30000, "monthly_rate": 150000, "size_sqm": 30 }
```

The issue was a **field naming mismatch**. The database schema uses `space_number`, `daily_rate`, `weekly_rate`, `monthly_rate`, and `size_sqm`, but the request was sending `space_code`, `rent_amount`, and `size`. 

**Now it should work!** 🎉
