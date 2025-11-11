# 🧪 Test Allocation Creation Fix

## Quick Test Steps

### Step 1: Get Admin Token
```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@market-spot.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user_type": "admin"
  }
}
```

Copy the `token` value.

---

### Step 2: Create Allocation (Should Work) ✅

```bash
POST http://localhost:3000/api/v1/allocations
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

{
  "seller_id": 1,
  "space_id": 1,
  "allocation_date": "2025-11-11",
  "start_date": "2025-11-12",
  "end_date": "2025-12-12",
  "allocation_type": "temporary",
  "notes": "Test allocation - first creation"
}
```

**Expected Response: 201 Created**
```json
{
  "success": true,
  "message": "Allocation created successfully",
  "data": {
    "allocation_id": 5
  }
}
```

✅ **Check:**
- ✓ Status code is 201
- ✓ allocation_id is returned
- ✓ Message says "successfully"

---

### Step 3: Try Duplicate (Should Fail) ❌

**Same request again** with seller_id=1, space_id=1:

```bash
POST http://localhost:3000/api/v1/allocations
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

{
  "seller_id": 1,
  "space_id": 1,  // ❌ Same as before!
  "allocation_date": "2025-11-11",
  "start_date": "2025-11-12",
  "end_date": "2025-12-12",
  "allocation_type": "temporary",
  "notes": "Try duplicate"
}
```

**Expected Response: 409 Conflict**
```json
{
  "success": false,
  "message": "An active allocation already exists for this seller-space combination",
  "data": {
    "existing_allocation_id": 5
  }
}
```

✅ **Check:**
- ✓ Status code is 409 (Conflict)
- ✓ Message mentions "already exists"
- ✓ Shows existing allocation ID

---

### Step 4: Create Different Space (Should Work) ✅

```bash
POST http://localhost:3000/api/v1/allocations
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

{
  "seller_id": 1,
  "space_id": 2,  // ✅ Different space!
  "allocation_date": "2025-11-11",
  "start_date": "2025-11-12",
  "end_date": "2025-12-12",
  "allocation_type": "temporary",
  "notes": "Different space allocation"
}
```

**Expected Response: 201 Created**
```json
{
  "success": true,
  "message": "Allocation created successfully",
  "data": {
    "allocation_id": 6
  }
}
```

✅ **Check:**
- ✓ Different space_id allows new allocation
- ✓ New allocation_id (6, not 5)

---

### Step 5: Verify approved_by is Set Correctly

```bash
GET http://localhost:3000/api/v1/allocations/5
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "allocation_id": 5,
    "seller_id": 1,
    "space_id": 1,
    "approved_by": 1,  // ✅ Should be admin's user_id (1)
    "notes": "Test allocation - first creation",  // ✅ Notes properly saved!
    "status": "active",
    "seller_name": "Seller Name",
    "space_number": "SPC-001",
    ...
  }
}
```

✅ **Check:**
- ✓ `approved_by` = 1 (admin's user_id)
- ✓ `notes` is properly saved (not empty)

---

### Step 6: Try Without Auth (Should Fail) ❌

```bash
POST http://localhost:3000/api/v1/allocations
Content-Type: application/json
{
  "seller_id": 2,
  "space_id": 3,
  "start_date": "2025-11-12",
  "end_date": "2025-12-12"
}
```

**Expected Response: 401 Unauthorized**
```json
{
  "success": false,
  "message": "No token provided"
}
```

✅ **Check:**
- ✓ Status code is 401
- ✓ Must have valid JWT token

---

## Test Summary Table

| Test | Request | Expected | Status |
|------|---------|----------|--------|
| Valid create | seller_id=1, space_id=1 | 201 Created | ✅ Should pass |
| Duplicate | seller_id=1, space_id=1 (again) | 409 Conflict | ✅ Should fail |
| Different space | seller_id=1, space_id=2 | 201 Created | ✅ Should pass |
| Check approved_by | GET allocation/5 | approved_by=1 | ✅ Should be logged user |
| Check notes | GET allocation/5 | notes preserved | ✅ Should not be empty |
| No auth | No token | 401 Unauthorized | ✅ Should fail |

---

## Key Points

✅ **approved_by** = Always logged-in user (from JWT token)
✅ **No duplicates** = Same seller-space combo rejected when active
✅ **Notes field** = Properly stored in database
✅ **Authentication** = Required for all requests
✅ **Security** = approved_by can't be spoofed from request

---

## Using Postman/Insomnia

### Setup:
1. Create new request: **POST** `http://localhost:3000/api/v1/allocations`
2. Headers tab:
   - `Content-Type: application/json`
   - `Authorization: Bearer YOUR_TOKEN_HERE`
3. Body tab (JSON):
```json
{
  "seller_id": 1,
  "space_id": 1,
  "allocation_date": "2025-11-11",
  "start_date": "2025-11-12",
  "end_date": "2025-12-12",
  "allocation_type": "temporary",
  "notes": "Test allocation"
}
```
4. Click Send

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `No token provided` | Missing Authorization header | Add `Authorization: Bearer TOKEN` |
| `Invalid token` | Token expired or malformed | Get new token from login |
| `User authentication required` | req.user is null | Ensure valid JWT in header |
| `already exists` | Same seller-space with status='active' | Change space_id or end previous allocation |
| `Seller ID and Space ID are required` | Missing seller_id or space_id | Add both to request body |

---

## Success Criteria ✅

After testing, you should see:

1. ✅ First allocation creates successfully (201)
2. ✅ Second identical allocation fails (409)
3. ✅ Different space creates successfully (201)
4. ✅ approved_by = logged-in user's ID
5. ✅ notes field is preserved (not empty)
6. ✅ Without auth fails (401)

**If all 6 pass → Implementation is correct!** 🎉
