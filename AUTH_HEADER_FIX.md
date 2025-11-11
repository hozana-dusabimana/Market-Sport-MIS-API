# ❌ Authorization Header Issue - WHY It's Not Working

## The Problem

Your Postman request shows:
```
Authorization: Bearer ({authToken})
```

But the server receives:
```
Bearer ({authToken})  ← Literal text, NOT the actual token!
```

**This is why you get: `"User authentication required"` error**

---

## Why It's Happening

### ❌ Wrong Way (What You're Doing)
```
Authorization: Bearer ({authToken})
                       ↑
                  Variable syntax NOT recognized
```

**Issue**: You're using `({authToken})` which is NOT valid Postman syntax

### ✅ Correct Ways

#### Option 1: Postman Variable (Correct Syntax)
```
Authorization: Bearer {{authToken}}
                       ↑↑
                   Double curly braces!
```

#### Option 2: Postman Pre-request Script
```javascript
// In "Pre-request Script" tab
const token = pm.environment.get('authToken');
pm.request.headers.add({
  key: 'Authorization',
  value: `Bearer ${token}`
});
```

#### Option 3: Postman Auth Tab
```
Type: Bearer Token
Token: {{authToken}}
```

---

## Step-by-Step Fix

### Step 1: Get & Store Token
```bash
POST http://localhost:3000/api/v1/auth/login

Body:
{
  "email": "admin@market-spot.com",
  "password": "admin123"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Step 2: Save Token to Environment Variable

In Postman:
1. Click `Environments` (top-left area)
2. Select or create an environment (e.g., "Development")
3. Add variable:
   - **Key**: `authToken`
   - **Value**: `paste_your_token_here`
   - **Initial value**: (same as Value)
4. Click Save

### Step 3: Use Variable in Headers

```
Authorization: Bearer {{authToken}}
                       ↑↑ Double braces!
```

Now Postman will replace `{{authToken}}` with actual token value ✅

---

## Compare: Wrong vs Right

### ❌ WRONG
```
Header: Authorization
Value:  Bearer ({authToken})

Server receives:
Bearer ({authToken})  ← Literal text!
↓
Auth middleware tries to verify "({authToken})" as JWT
↓
Fails → "User authentication required"
```

### ✅ RIGHT
```
Header: Authorization
Value:  Bearer {{authToken}}

Server receives:
Bearer eyJhbGciOiJIUzI1NiIs...  ← Actual token!
↓
Auth middleware verifies real JWT
↓
Success → req.user is populated
```

---

## Auto-Extract Token (Recommended)

### In Login Request - "Tests" Tab:
```javascript
// After login request
if (pm.response.code === 201 || pm.response.code === 200) {
  const jsonData = pm.response.json();
  pm.environment.set('authToken', jsonData.data.token);
  console.log('✓ Token saved:', jsonData.data.token.substring(0, 20) + '...');
}
```

Now after each login, token is **automatically saved** ✅

---

## Checklist to Fix

- [ ] Change `({authToken})` to `{{authToken}}` in Authorization header
- [ ] Create/select environment in Postman
- [ ] Add `authToken` variable to environment
- [ ] Paste actual token value
- [ ] Click "Send" again
- [ ] Should get 201 Created (not 401)

---

## If Still Getting 401

1. **Check token is valid** - Token might be expired
   - Get new token from login endpoint
   - Paste fresh token into environment variable

2. **Verify syntax** - Make sure it's `{{authToken}}` (double braces)
   - Not `({authToken})`
   - Not `{authToken}`
   - Not `$authToken`

3. **Check variable name** - Ensure it matches exactly
   - Set: `authToken`
   - Use: `{{authToken}}`

4. **Verify environment selected** - Top-right dropdown should show your environment
   - Not "No Environment"

---

## Postman Variable Syntax

| Syntax | Type | Works? |
|--------|------|--------|
| `{{variable}}` | Double braces | ✅ YES |
| `{variable}` | Single brace | ❌ NO |
| `({variable})` | Parentheses | ❌ NO |
| `$variable` | Dollar | ❌ NO |
| `variable` | Plain text | ❌ NO |

---

## Quick Test

After fixing Authorization header:

### Request
```
POST http://localhost:3000/api/v1/allocations
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "seller_id": 1,
  "space_id": 1,
  "start_date": "2025-11-12",
  "end_date": "2025-12-12",
  "allocation_type": "temporary",
  "notes": "Test"
}
```

### Response Should Be:
```json
{
  "success": true,
  "message": "Allocation created successfully",
  "data": { "allocation_id": X }
}
```

**NOT:**
```json
{
  "success": false,
  "message": "User authentication required"
}
```

---

## Summary

| Issue | Cause | Fix |
|-------|-------|-----|
| `"User authentication required"` | Variable not resolved | Use `{{authToken}}` not `({authToken})` |
| Token not saving | Manual entry | Use auto-extract in Tests tab |
| Wrong token format | Copying wrong part | Get `data.token` from login response |
| Expired token | Old token | Login again to get fresh token |

---

**Change `({authToken})` → `{{authToken}}` in your Authorization header!** ✅
