# 🚀 Quick Reference: Create Space Correctly

## ✅ Working Example

```bash
curl -X POST http://localhost:3000/api/v1/spaces \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "zone_id": 1,
    "space_number": "SPC-001",
    "space_type": "standard",
    "size_sqm": 30,
    "daily_rate": 5000,
    "weekly_rate": 30000,
    "monthly_rate": 150000,
    "features": "Good location with electricity",
    "status": "available"
  }'
```

## 🔑 Required Fields
- `zone_id` - ID of the zone
- `space_number` - Space identifier (e.g., "SPC-001")
- `space_type` - One of: standard, premium, corner, storage
- `daily_rate` - Price per day

## 📝 Optional Fields
- `weekly_rate` - Price per week
- `monthly_rate` - Price per month
- `size_sqm` - Size in square meters
- `features` - Description
- `status` - available, occupied, reserved, or maintenance

## 🎯 Field Names (CORRECTED)
| Use | Don't Use |
|-----|-----------|
| `space_number` | `space_code` ❌ |
| `daily_rate`, `weekly_rate`, `monthly_rate` | `rent_amount` ❌ |
| `size_sqm` | `size` ❌ |

## ✨ Expected Response
```json
{
  "success": true,
  "message": "Space created successfully",
  "data": { "space_id": 25 }
}
```

---

**Fixed! Server restarted and ready to accept correct space creation requests.** ✅
