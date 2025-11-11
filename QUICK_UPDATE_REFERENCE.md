# ⚡ Quick Reference: Space Update with Backward Compatibility

## ✅ Both Formats Now Work!

### Old Format (Still Works ✅)
```json
{
  "space_code": "SPC-001",
  "rent_amount": 200000,
  "size": "35m²",
  "status": "occupied"
}
```

### New Format (Recommended ✅)
```json
{
  "space_number": "SPC-001",
  "daily_rate": 5000,
  "weekly_rate": 30000,
  "monthly_rate": 200000,
  "size_sqm": 35,
  "status": "occupied"
}
```

---

## Working Examples

### Update with Old Format
```bash
curl -X PUT http://localhost:3000/api/v1/spaces/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "space_code": "SPC-001",
    "rent_amount": 250000,
    "status": "occupied"
  }'
```

### Update with New Format
```bash
curl -X PUT http://localhost:3000/api/v1/spaces/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "space_number": "SPC-001",
    "daily_rate": 8000,
    "status": "occupied"
  }'
```

---

## Field Auto-Conversion

| You Send | Converts To | Example |
|----------|-------------|---------|
| `space_code` | `space_number` | "SPC-001" |
| `rent_amount` | `daily_rate` | 5000 |
| `size: "35m²"` | `size_sqm: 35` | 35 |
| `size: 35` | `size_sqm: 35` | 35 |

---

## Success Response
```json
{
  "success": true,
  "message": "Space updated successfully"
}
```

---

## Key Points
✅ Both old and new field names work
✅ Automatic conversion happens internally
✅ No need to change existing code
✅ New code can use correct field names
✅ Server restarted and ready

---

**Problem Solved!** Use either format, both work! 🎉
