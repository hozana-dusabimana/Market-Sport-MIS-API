# 🌐 Market Spoton API - Complete Endpoint Reference

**Base URL**: `http://localhost:3000/api/v1`

---

## 🔐 Authentication Endpoints

### `POST /auth/login`
- **Auth Required**: No
- **Description**: Login and get JWT token
- **Body**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response**: `{ token, user }`

### `POST /auth/register`
- **Auth Required**: No
- **Description**: Register new user

### `GET /auth/profile`
- **Auth Required**: Yes
- **Description**: Get authenticated user's profile

---

## 🏪 Zone Management

### `GET /zones`
- **Auth Required**: No
- **Params**: `status`, `manager_id`, `search`, `limit`, `offset`
- **Returns**: Array of zones

### `GET /zones/:id`
- **Auth Required**: No
- **Returns**: Zone details with spaces and statistics

### `GET /zones/:id/spaces`
- **Auth Required**: No
- **Returns**: Spaces in zone

### `GET /zones/:id/statistics`
- **Auth Required**: No
- **Returns**: Zone stats (occupied count, revenue, etc.)

### `POST /zones`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "zone_name": "string",
    "zone_code": "string",
    "description": "string",
    "manager_id": "number",
    "total_spaces": "number"
  }
  ```

### `PUT /zones/:id`
- **Auth Required**: Yes
- **Updates**: Zone details

### `DELETE /zones/:id`
- **Auth Required**: Yes
- **Deletes**: Zone

---

## 📦 Space Management

### `GET /spaces`
- **Auth Required**: No
- **Params**: `zone_id`, `status`, `space_type`, `limit`, `offset`
- **Returns**: Array of spaces

### `GET /spaces/available`
- **Auth Required**: No
- **Params**: `zone_id`, `space_type`
- **Returns**: Only available spaces

### `GET /spaces/:id`
- **Auth Required**: No
- **Returns**: Space with allocation history

### `GET /spaces/:id/availability`
- **Auth Required**: No
- **Returns**: `{ space_id, available: boolean }`

### `GET /spaces/:id/history`
- **Auth Required**: No
- **Returns**: Allocation history of space

### `POST /spaces`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "zone_id": "number",
    "space_number": "string",
    "space_type": "standard|premium|corner|storage",
    "size_sqm": "number",
    "daily_rate": "number",
    "weekly_rate": "number (optional)",
    "monthly_rate": "number (optional)",
    "features": "string (optional)",
    "status": "available (default)|occupied|reserved|maintenance"
  }
  ```

### `PUT /spaces/:id`
- **Auth Required**: Yes
- **Updates**: Space details

### `PATCH /spaces/:id/status`
- **Auth Required**: Yes
- **Body**: `{ "status": "available|occupied|reserved|maintenance" }`

### `DELETE /spaces/:id`
- **Auth Required**: Yes

---

## 🏷️ Allocation Management

### `GET /allocations`
- **Auth Required**: No
- **Params**: `seller_id`, `space_id`, `zone_id`, `status`, `allocation_type`, `limit`, `offset`
- **Returns**: Array of allocations

### `GET /allocations/:id`
- **Auth Required**: No
- **Returns**: Allocation details with payments

### `GET /allocations/:id/payments`
- **Auth Required**: No
- **Returns**: Payments for allocation

### `POST /allocations`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "seller_id": "number",
    "space_id": "number",
    "allocation_date": "date",
    "start_date": "date",
    "end_date": "date (optional)",
    "allocation_type": "daily|weekly|monthly|permanent"
  }
  ```

### `PUT /allocations/:id`
- **Auth Required**: Yes
- **Updates**: Allocation details

### `PATCH /allocations/:id/status`
- **Auth Required**: Yes
- **Body**: `{ "status": "active|expired|cancelled" }`

### `DELETE /allocations/:id`
- **Auth Required**: Yes

### `POST /allocations/check-expired`
- **Auth Required**: Yes
- **Description**: Check and auto-expire old allocations

---

## 💳 Payment Management

### `GET /payments`
- **Auth Required**: Yes
- **Params**: `seller_id`, `allocation_id`, `status`, `payment_method`, `date_from`, `date_to`, `limit`, `offset`
- **Returns**: Array of payments

### `GET /payments/:id`
- **Auth Required**: Yes
- **Returns**: Payment details

### `POST /payments`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "allocation_id": "number",
    "seller_id": "number",
    "amount": "number",
    "payment_date": "date",
    "payment_method": "cash|mobile_money|bank_transfer|check",
    "payment_reference": "string",
    "payment_period_start": "date",
    "payment_period_end": "date"
  }
  ```

### `PUT /payments/:id`
- **Auth Required**: Yes
- **Updates**: Payment details

### `PATCH /payments/:id/status`
- **Auth Required**: Yes
- **Body**: `{ "status": "pending|completed|cancelled" }`

### `GET /payments/revenue/total`
- **Auth Required**: Yes
- **Params**: `date_from`, `date_to`
- **Returns**: `{ total_revenue }`

### `GET /payments/revenue/by-zone`
- **Auth Required**: Yes
- **Params**: `date_from`, `date_to`
- **Returns**: Revenue breakdown by zone

### `GET /payments/revenue/by-method`
- **Auth Required**: Yes
- **Params**: `date_from`, `date_to`
- **Returns**: Revenue breakdown by payment method

---

## 🔔 Notification Management

### `GET /notifications`
- **Auth Required**: Yes
- **Params**: `user_id`, `seller_id`, `status`, `notification_type`, `limit`, `offset`
- **Returns**: Array of notifications

### `GET /notifications/user/notifications`
- **Auth Required**: Yes
- **Params**: `status`, `notification_type`, `limit`, `offset`
- **Returns**: Current user's notifications

### `GET /notifications/unread/count`
- **Auth Required**: Yes
- **Returns**: `{ user_id, unread_count }`

### `GET /notifications/:id`
- **Auth Required**: Yes
- **Returns**: Notification details

### `POST /notifications`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "user_id": "number",
    "seller_id": "number (optional)",
    "title": "string",
    "message": "string",
    "notification_type": "system|allocation|payment|alert|announcement",
    "related_id": "number (optional)",
    "action_url": "string (optional)"
  }
  ```

### `PUT /notifications/:id`
- **Auth Required**: Yes
- **Updates**: Notification details

### `PATCH /notifications/:id/status`
- **Auth Required**: Yes
- **Body**: `{ "status": "unread|read|archived" }`

### `PATCH /notifications/:id/read`
- **Auth Required**: Yes
- **Description**: Mark single notification as read

### `POST /notifications/read/multiple`
- **Auth Required**: Yes
- **Body**: `{ "notification_ids": [1, 2, 3] }`
- **Description**: Mark multiple notifications as read

### `DELETE /notifications/:id`
- **Auth Required**: Yes

---

## 👥 User Management

### `GET /users`
- **Auth Required**: Yes
- **Params**: `status`, `user_type`, `limit`, `offset`
- **Returns**: Array of users

### `GET /users/:id`
- **Auth Required**: Yes
- **Returns**: User details

### `POST /users`
- **Auth Required**: Yes
- **Creates**: New user

### `PUT /users/:id`
- **Auth Required**: Yes
- **Updates**: User details

### `PATCH /users/:id/status`
- **Auth Required**: Yes
- **Updates**: User status

### `DELETE /users/:id`
- **Auth Required**: Yes

---

## 🏪 Seller Management

### `GET /sellers`
- **Auth Required**: No
- **Params**: `status`, `limit`, `offset`
- **Returns**: Array of sellers

### `GET /sellers/:id`
- **Auth Required**: No
- **Returns**: Seller details

### `GET /sellers/:id/allocations`
- **Auth Required**: No
- **Returns**: Seller's allocations

### `GET /sellers/:id/payments`
- **Auth Required**: No
- **Returns**: Seller's payments

### `GET /sellers/:id/stats`
- **Auth Required**: No
- **Returns**: Seller statistics

### `POST /sellers`
- **Auth Required**: Yes
- **Creates**: New seller

### `PUT /sellers/:id`
- **Auth Required**: Yes
- **Updates**: Seller details

### `PATCH /sellers/:id/verification`
- **Auth Required**: Yes
- **Updates**: Verification status

### `DELETE /sellers/:id`
- **Auth Required**: Yes

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [],
  "count": 10,
  "limit": 10,
  "offset": 0,
  "total": 50
}
```

---

## 🔒 Authentication Header

All protected routes require:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 📌 HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate/conflict
- `500 Server Error` - Server error

---

## ⏱️ Query Parameters

All list endpoints support:
- `limit` - Records per page (default: 100)
- `offset` - Skip records (default: 0)
- `sort` - Sort field (default: created_at)
- `order` - asc or desc (default: desc)

---

## 🎯 Example Complete Flow

1. **Login**
   ```bash
   POST /auth/login
   { "username": "admin", "password": "admin123" }
   → Get token
   ```

2. **Get Zones**
   ```bash
   GET /zones
   → Receive list of zones
   ```

3. **Create Allocation**
   ```bash
   POST /allocations
   Auth: Bearer <token>
   { "seller_id": 1, "space_id": 5, ... }
   → Allocation created
   ```

4. **Add Payment**
   ```bash
   POST /payments
   Auth: Bearer <token>
   { "allocation_id": 1, "amount": 10000, ... }
   → Payment recorded
   ```

5. **Get Revenue**
   ```bash
   GET /payments/revenue/total
   Auth: Bearer <token>
   → Total revenue returned
   ```

---

**Last Updated**: November 11, 2025
**API Version**: v1
**Status**: ✅ Production Ready
