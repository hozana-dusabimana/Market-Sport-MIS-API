# 📝 Space Update - Field Name Correction & Backward Compatibility

## The Problem ❌

When trying to update a space with:
```json
{
  "space_code": "SPC-001",
  "space_type": "Shop",
  "rent_amount": 200000,
  "size": "35m²",
  "status": "occupied"
}
```

You got:
```json
{
  "success": false,
  "message": "Failed to update space",
  "error": "Unknown column 'space_code' in 'field list'"
}
```

---

## The Issue 🔍

The Space model's `update()` method doesn't recognize old field names:
- ❌ `space_code` → Should be `space_number`
- ❌ `rent_amount` → Should be `daily_rate` (or `weekly_rate`, `monthly_rate`)
- ❌ `size` → Should be `size_sqm`

---

## The Solution ✅

### Enhanced Both Methods with Backward Compatibility

**Files Updated**:
```
server/src/controllers/space.controller.js
  - createSpace()
  - updateSpace()
```

Both methods now:
1. ✅ Accept old field names (`space_code`, `rent_amount`, `size`)
2. ✅ Automatically convert to new field names
3. ✅ Support both string and number formats for size
4. ✅ Work with new field names too

---

## Now You Can Use Either Format

### ✅ Option 1: New Correct Format (Recommended)
```json
{
  "space_number": "SPC-001",
  "space_type": "premium",
  "daily_rate": 5000,
  "weekly_rate": 30000,
  "monthly_rate": 200000,
  "size_sqm": 35,
  "status": "occupied"
}
```

### ✅ Option 2: Old Format (Auto-Converted)
```json
{
  "space_code": "SPC-001",
  "space_type": "Shop",
  "rent_amount": 200000,
  "size": "35m²",
  "status": "occupied"
}
```

**Both work now!** The controller automatically converts old field names to new ones.

---

## Update Request Examples

### Update with Old Field Names
```bash
curl -X PUT http://localhost:3000/api/v1/spaces/5 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "space_code": "SPC-005",
    "rent_amount": 250000,
    "status": "occupied"
  }'
```

### Update with New Field Names
```bash
curl -X PUT http://localhost:3000/api/v1/spaces/5 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "space_number": "SPC-005",
    "daily_rate": 8000,
    "weekly_rate": 50000,
    "monthly_rate": 250000,
    "status": "occupied"
  }'
```

### Update Only What Changed
```bash
curl -X PUT http://localhost:3000/api/v1/spaces/5 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "occupied"
  }'
```

---

## Field Conversion Logic 🔄

### What Happens Behind the Scenes

```javascript
// If you send old field names, they're automatically converted:

space_code: "SPC-001"      → space_number: "SPC-001"
rent_amount: 200000        → daily_rate: 200000
size: "35m²"               → size_sqm: 35
size: 35                   → size_sqm: 35
```

### Size Conversion Details

```javascript
// Handles multiple formats:
"size": "35m²"             // String with unit → 35
"size": 35                 // Number → 35
"size": "35"               // String number → 35
"size_sqm": 35             // Already correct → 35
```

---

## Complete Update Examples

### Update Status Only
```bash
curl -X PUT http://localhost:3000/api/v1/spaces/5 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "maintenance"}'
```

### Update All Fields
```bash
curl -X PUT http://localhost:3000/api/v1/spaces/5 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "space_number": "SPC-005-UPDATED",
    "space_type": "premium",
    "daily_rate": 8000,
    "weekly_rate": 50000,
    "monthly_rate": 250000,
    "size_sqm": 40,
    "features": "Updated location description",
    "status": "occupied"
  }'
```

### Update with Old Field Names (Still Works!)
```bash
curl -X PUT http://localhost:3000/api/v1/spaces/5 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "space_code": "SPC-005",
    "rent_amount": 250000,
    "size": "40m²",
    "status": "occupied"
  }'
```

---

## Success Response

```json
{
  "success": true,
  "message": "Space updated successfully"
}
```

---

## Field Updatability

| Field | Can Update | Notes |
|-------|-----------|-------|
| `space_number` / `space_code` | ✅ Yes | Change the space identifier |
| `space_type` | ✅ Yes | Change type (standard, premium, etc.) |
| `daily_rate` / `rent_amount` | ✅ Yes | Update daily pricing |
| `weekly_rate` | ✅ Yes | Update weekly pricing |
| `monthly_rate` | ✅ Yes | Update monthly pricing |
| `size_sqm` / `size` | ✅ Yes | Change space size |
| `features` | ✅ Yes | Update description |
| `status` | ✅ Yes | Change status (available, occupied, etc.) |

---

## When to Use What Format

### Use New Field Names When:
- ✅ Building new code
- ✅ Creating new integrations
- ✅ Writing API documentation
- ✅ Following best practices

### Old Field Names Work For:
- ✅ Legacy integrations
- ✅ Existing code that hasn't been updated
- ✅ Quick testing
- ✅ Backward compatibility

---

## Migration Tips

### No Migration Needed!
Since the controller now handles both formats automatically:
- ✅ Old code keeps working
- ✅ New code works immediately
- ✅ No breaking changes
- ✅ Gradual migration possible

### Gradual Update Strategy
1. **Today**: Use either format (both work)
2. **Soon**: Update to new field names
3. **Later**: Deprecate old field names (optional)

---

## Testing the Update Endpoint

### Step 1: Get a Valid Space ID
```bash
curl http://localhost:3000/api/v1/spaces
```

Find a space and note its `space_id`.

### Step 2: Update with Old Format
```bash
curl -X PUT http://localhost:3000/api/v1/spaces/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "space_code": "SPC-UPDATED",
    "rent_amount": 250000,
    "status": "occupied"
  }'
```

### Step 3: Verify Update
```bash
curl http://localhost:3000/api/v1/spaces/1
```

You should see the updated values!

---

## Error Handling

### If Space Not Found
```json
{
  "success": false,
  "message": "Space not found"
}
```

### If Update Fails
```json
{
  "success": false,
  "message": "Failed to update space",
  "error": "Detailed error message"
}
```

---

## Summary of Changes

### What's New
✅ Both create and update now support old field names
✅ Automatic conversion from old to new field names
✅ Handles multiple size format variations
✅ Full backward compatibility
✅ No breaking changes

### Files Modified
- `server/src/controllers/space.controller.js`
  - `createSpace()` - Added field name conversion
  - `updateSpace()` - Added field name conversion

### Server Status
✅ Restarted and ready
✅ Backward compatibility enabled
✅ Both formats working

---

## Examples by Scenario

### Scenario 1: Update Price Only
```bash
# Old format
{"rent_amount": 300000}

# New format
{"daily_rate": 10000}
```

### Scenario 2: Change Space Status
```bash
# Both formats work the same
{"status": "maintenance"}
```

### Scenario 3: Full Update
```bash
# Old format
{
  "space_code": "NEW-CODE",
  "space_type": "premium",
  "rent_amount": 300000,
  "size": "50m²"
}

# New format
{
  "space_number": "NEW-CODE",
  "space_type": "premium",
  "daily_rate": 10000,
  "weekly_rate": 60000,
  "monthly_rate": 300000,
  "size_sqm": 50
}
```

---

**Both create and update endpoints now support backward compatibility!** 🎉

See the endpoint in action with any of the examples above.
