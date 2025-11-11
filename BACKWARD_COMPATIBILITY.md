# 🔄 Backward Compatibility Update - Complete Guide

## What Changed ✅

Both `createSpace()` and `updateSpace()` methods now automatically convert old field names to new ones.

---

## Before and After

### CREATE Endpoint

#### Before (❌ Only new format worked)
```json
// ✅ WORKED
{
  "zone_id": 1,
  "space_number": "SPC-001",
  "space_type": "standard",
  "daily_rate": 5000
}

// ❌ FAILED
{
  "zone_id": 1,
  "space_code": "SPC-001",
  "space_type": "standard",
  "rent_amount": 5000
}
```

#### After (✅ Both formats work)
```json
// ✅ WORKS - New Format
{
  "zone_id": 1,
  "space_number": "SPC-001",
  "space_type": "standard",
  "daily_rate": 5000
}

// ✅ ALSO WORKS - Old Format (Auto-Converted)
{
  "zone_id": 1,
  "space_code": "SPC-001",
  "space_type": "standard",
  "rent_amount": 5000
}
```

---

### UPDATE Endpoint

#### Before (❌ Only new format worked)
```json
// ✅ WORKED
{
  "space_number": "SPC-001",
  "daily_rate": 8000
}

// ❌ FAILED - "Unknown column 'space_code'"
{
  "space_code": "SPC-001",
  "rent_amount": 8000
}
```

#### After (✅ Both formats work)
```json
// ✅ WORKS - New Format
{
  "space_number": "SPC-001",
  "daily_rate": 8000
}

// ✅ ALSO WORKS - Old Format (Auto-Converted)
{
  "space_code": "SPC-001",
  "rent_amount": 8000
}
```

---

## Field Name Mapping

| Old Name | New Name | Example |
|----------|----------|---------|
| `space_code` | `space_number` | "SPC-001" |
| `rent_amount` | `daily_rate` | 5000 |
| (new) | `weekly_rate` | 30000 |
| (new) | `monthly_rate` | 150000 |
| `size` | `size_sqm` | 30 |

---

## Conversion Examples

### Size Format Conversion
```javascript
"size": "35m²"    →  size_sqm: 35
"size": "35"      →  size_sqm: 35
"size": 35        →  size_sqm: 35
"size_sqm": 35    →  size_sqm: 35  (no conversion needed)
```

### Field Name Conversion
```javascript
"space_code": "SPC-001"    →  space_number: "SPC-001"
"rent_amount": 200000      →  daily_rate: 200000
"size": 40                 →  size_sqm: 40
```

---

## Usage Examples

### Create with Old Format
```bash
curl -X POST http://localhost:3000/api/v1/spaces \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "zone_id": 1,
    "space_code": "SPC-NEW-001",
    "space_type": "standard",
    "rent_amount": 5000,
    "size": "30m²"
  }'
```

### Create with New Format
```bash
curl -X POST http://localhost:3000/api/v1/spaces \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "zone_id": 1,
    "space_number": "SPC-NEW-001",
    "space_type": "standard",
    "daily_rate": 5000,
    "size_sqm": 30
  }'
```

### Update with Old Format
```bash
curl -X PUT http://localhost:3000/api/v1/spaces/1 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "space_code": "SPC-UPDATED",
    "rent_amount": 8000,
    "status": "occupied"
  }'
```

### Update with New Format
```bash
curl -X PUT http://localhost:3000/api/v1/spaces/1 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "space_number": "SPC-UPDATED",
    "daily_rate": 8000,
    "status": "occupied"
  }'
```

---

## How It Works Behind the Scenes

### Conversion Logic (Simplified)

```javascript
// In createSpace() and updateSpace()

// Check for old field names and convert them
if (req.body.space_code) {
  space_number = req.body.space_code;  // Convert
}

if (req.body.rent_amount) {
  daily_rate = req.body.rent_amount;   // Convert
}

if (req.body.size) {
  size_sqm = typeof req.body.size === 'string' 
    ? parseInt(req.body.size)          // "35m²" → 35
    : req.body.size;                   // 35 → 35
}

// Then use the converted/new field names
await Space.create({
  space_number,    // Now has the right value
  daily_rate,      // Now has the right value
  size_sqm,        // Now has the right value
  // ... other fields
});
```

---

## Benefits 🎯

✅ **No Breaking Changes**: Old code keeps working
✅ **Future-Proof**: New code uses correct names
✅ **Flexible**: Use either format anytime
✅ **Gradual Migration**: Migrate at your own pace
✅ **User-Friendly**: Auto-converts common mistakes
✅ **Type Handling**: Converts strings to numbers intelligently

---

## Migration Strategy

### Phase 1: Now (Backward Compatible)
- ✅ Old code works
- ✅ New code works
- ✅ Mixed usage works

### Phase 2: Later (Optional)
- Gradually update endpoints to use new names
- No rush, both work simultaneously

### Phase 3: Future (Optional)
- Deprecate old field names (if desired)
- But not required!

---

## Testing Backward Compatibility

### Test 1: Old Format Create
```bash
# Should work ✅
curl -X POST http://localhost:3000/api/v1/spaces \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"zone_id": 1, "space_code": "TEST-OLD-CREATE", "space_type": "standard", "rent_amount": 5000}'
```

### Test 2: Old Format Update
```bash
# Should work ✅
curl -X PUT http://localhost:3000/api/v1/spaces/1 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"space_code": "TEST-OLD-UPDATE", "rent_amount": 8000}'
```

### Test 3: New Format Create
```bash
# Should work ✅
curl -X POST http://localhost:3000/api/v1/spaces \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"zone_id": 1, "space_number": "TEST-NEW-CREATE", "space_type": "standard", "daily_rate": 5000}'
```

### Test 4: New Format Update
```bash
# Should work ✅
curl -X PUT http://localhost:3000/api/v1/spaces/1 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"space_number": "TEST-NEW-UPDATE", "daily_rate": 8000}'
```

---

## FAQ

### Q: Will my old requests still work?
**A**: Yes! Both `createSpace()` and `updateSpace()` now support old field names.

### Q: Should I update my code?
**A**: Eventually yes (best practice), but not required. Old format works indefinitely.

### Q: What if I mix old and new field names?
**A**: The old ones get converted. Use one or the other for clarity.

### Q: Is there any performance impact?
**A**: Negligible. Simple field name mapping and type conversion.

### Q: Can I rely on backward compatibility?
**A**: Yes, it's built in for forward compatibility.

---

## Files Modified

```
server/src/controllers/space.controller.js
  ✅ createSpace() - Added auto-conversion
  ✅ updateSpace() - Added auto-conversion
```

---

## Server Status

✅ **Running**: Port 3000
✅ **Updated**: Both endpoints support both formats
✅ **Tested**: Backward compatibility working
✅ **Ready**: For both old and new requests

---

## Summary

| Aspect | Status |
|--------|--------|
| Old field names work in CREATE | ✅ Yes |
| Old field names work in UPDATE | ✅ Yes |
| New field names work in CREATE | ✅ Yes |
| New field names work in UPDATE | ✅ Yes |
| Mixed formats work | ✅ Yes |
| Breaking changes | ❌ None |
| Migration required | ❌ No |

---

**Your API now supports both field name formats!** 🎉

The old format will automatically be converted to the new format internally.
