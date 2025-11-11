# API Testing Guide

## 🚀 Server Status
Server is running on `http://localhost:3000` with all tables and test data created.

## 📝 Default Test Credentials
- **Username**: `admin`
- **Password**: `admin123`

---

## 1️⃣ Get Authentication Token

### Request (Login)
```
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### Response
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "user_id": 1,
      "username": "admin",
      "email": "admin@marketspoton.com",
      "user_type": "admin"
    }
  }
}
```

**Save the token for use in other requests!**

---

## 2️⃣ Test Zone Endpoints

### Get All Zones (No Auth Required)
```
GET http://localhost:3000/api/v1/zones
```

**Response**: List of all zones with their details

### Get Single Zone
```
GET http://localhost:3000/api/v1/zones/1
```

### Get Zone Spaces
```
GET http://localhost:3000/api/v1/zones/1/spaces
```

### Get Zone Statistics
```
GET http://localhost:3000/api/v1/zones/1/statistics
```

### Create Zone (Protected)
```
POST http://localhost:3000/api/v1/zones
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json

{
  "zone_name": "Zone E - Premium",
  "zone_code": "ZE-001",
  "description": "Premium market zone",
  "manager_id": null,
  "total_spaces": 30
}
```

### Update Zone (Protected)
```
PUT http://localhost:3000/api/v1/zones/1
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json

{
  "zone_name": "Zone A - Updated",
  "description": "Updated description"
}
```

---

## 3️⃣ Test Space Endpoints

### Get All Spaces
```
GET http://localhost:3000/api/v1/spaces
```

### Get Available Spaces
```
GET http://localhost:3000/api/v1/spaces/available
```

### Get Available Spaces by Zone
```
GET http://localhost:3000/api/v1/spaces/available?zone_id=1
```

### Get Single Space
```
GET http://localhost:3000/api/v1/spaces/1
```

### Check Space Availability
```
GET http://localhost:3000/api/v1/spaces/1/availability
```

### Get Space Allocation History
```
GET http://localhost:3000/api/v1/spaces/1/history
```

### Create Space (Protected)
```
POST http://localhost:3000/api/v1/spaces
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json

{
  "zone_id": 1,
  "space_code": "SP-NEW-001",
  "space_type": "premium",
  "rent_amount": 15000,
  "size": 100,
  "status": "available"
}
```

### Update Space Status (Protected)
```
PATCH http://localhost:3000/api/v1/spaces/1/status
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json

{
  "status": "maintenance"
}
```

---

## 4️⃣ Test Allocation Endpoints

### Get All Allocations
```
GET http://localhost:3000/api/v1/allocations
```

### Get Allocations by Status
```
GET http://localhost:3000/api/v1/allocations?status=active
```

### Get Allocations by Seller
```
GET http://localhost:3000/api/v1/allocations?seller_id=1
```

### Get Single Allocation
```
GET http://localhost:3000/api/v1/allocations/1
```

### Get Allocation Payments
```
GET http://localhost:3000/api/v1/allocations/1/payments
```

### Create Allocation (Protected)
**Important**: Space must exist! Use a space_id from GET /api/v1/spaces
```
POST http://localhost:3000/api/v1/allocations
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json

{
  "seller_id": 1,
  "space_id": 1,
  "allocation_date": "2024-11-11",
  "start_date": "2024-11-11",
  "end_date": "2024-12-11",
  "allocation_type": "monthly"
}
```

### Update Allocation Status (Protected)
```
PATCH http://localhost:3000/api/v1/allocations/1/status
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json

{
  "status": "expired"
}
```

### Check Expired Allocations (Protected)
```
POST http://localhost:3000/api/v1/allocations/check-expired
Authorization: Bearer <YOUR_TOKEN>
```

---

## 5️⃣ Test Payment Endpoints

### Get All Payments (Protected)
```
GET http://localhost:3000/api/v1/payments
Authorization: Bearer <YOUR_TOKEN>
```

### Get Payments by Seller
```
GET http://localhost:3000/api/v1/payments?seller_id=1
Authorization: Bearer <YOUR_TOKEN>
```

### Get Payments by Status
```
GET http://localhost:3000/api/v1/payments?status=completed
Authorization: Bearer <YOUR_TOKEN>
```

### Get Single Payment (Protected)
```
GET http://localhost:3000/api/v1/payments/1
Authorization: Bearer <YOUR_TOKEN>
```

### Create Payment (Protected)
**Important**: Use existing allocation_id and seller_id
```
POST http://localhost:3000/api/v1/payments
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json

{
  "allocation_id": 1,
  "seller_id": 1,
  "amount": 10000,
  "payment_date": "2024-11-11",
  "payment_method": "cash",
  "payment_reference": "PAY-20241111-001"
}
```

### Get Total Revenue (Protected)
```
GET http://localhost:3000/api/v1/payments/revenue/total
Authorization: Bearer <YOUR_TOKEN>
```

### Get Revenue by Zone (Protected)
```
GET http://localhost:3000/api/v1/payments/revenue/by-zone
Authorization: Bearer <YOUR_TOKEN>
```

### Get Revenue by Payment Method (Protected)
```
GET http://localhost:3000/api/v1/payments/revenue/by-method
Authorization: Bearer <YOUR_TOKEN>
```

---

## 6️⃣ Test Notification Endpoints

### Get User Notifications (Protected)
```
GET http://localhost:3000/api/v1/notifications/user/notifications
Authorization: Bearer <YOUR_TOKEN>
```

### Get Unread Count (Protected)
```
GET http://localhost:3000/api/v1/notifications/unread/count
Authorization: Bearer <YOUR_TOKEN>
```

### Get Single Notification (Protected)
```
GET http://localhost:3000/api/v1/notifications/1
Authorization: Bearer <YOUR_TOKEN>
```

### Create Notification (Protected)
```
POST http://localhost:3000/api/v1/notifications
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json

{
  "user_id": 1,
  "title": "New Allocation",
  "message": "You have been allocated space SP-001 in Zone A",
  "notification_type": "allocation",
  "related_id": 1
}
```

### Mark Notification as Read (Protected)
```
PATCH http://localhost:3000/api/v1/notifications/1/read
Authorization: Bearer <YOUR_TOKEN>
```

### Mark Multiple as Read (Protected)
```
POST http://localhost:3000/api/v1/notifications/read/multiple
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json

{
  "notification_ids": [1, 2, 3]
}
```

---

## 🔧 Using cURL for Testing

### Get Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Get All Zones
```bash
curl http://localhost:3000/api/v1/zones
```

### Create Allocation with Token
```bash
curl -X POST http://localhost:3000/api/v1/allocations \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "seller_id": 1,
    "space_id": 1,
    "start_date": "2024-11-11",
    "end_date": "2024-12-11",
    "allocation_type": "monthly"
  }'
```

---

## ⚠️ Common Issues & Solutions

### Error: "Cannot add or update a child row: a foreign key constraint fails"
**Solution**: Make sure the referenced resource exists:
- For allocations: Create zones and spaces first
- For payments: Create allocations first
- For notifications: User ID must exist in users table

### Error: "Cannot find space"
**Solution**: Get list of available spaces first:
```bash
curl http://localhost:3000/api/v1/spaces/available
```

### Error: "Invalid token"
**Solution**: 
1. Get a fresh token: `POST /api/v1/auth/login`
2. Add token to header: `Authorization: Bearer <token>`

### Error: "Allocation not found"
**Solution**: Create an allocation first before trying to get/update it

---

## 📊 Database Tables Created

✅ users
✅ admins
✅ managers
✅ sellers
✅ zones
✅ spaces
✅ space_allocations
✅ payments
✅ notifications
✅ announcements
✅ reports
✅ audit_logs
✅ feedback
✅ blacklisted_tokens
✅ migrations

---

## 🎯 Test Workflow

1. **Login** → Get token
2. **Create Zone** → Get zone_id
3. **Create Space** → Reference zone, get space_id
4. **Create Seller** → Get seller_id (or use existing)
5. **Create Allocation** → Reference space_id + seller_id
6. **Create Payment** → Reference allocation_id
7. **Create Notification** → Notify user about allocation

All endpoints are now fully functional! 🚀
