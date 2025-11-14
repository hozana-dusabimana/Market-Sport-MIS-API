# Reports Feature Documentation

## Overview

The Reports feature generates comprehensive reports on-the-fly by querying existing database tables (allocations, payments, spaces, zones, sellers). **No reports table is created** - all data is calculated and aggregated in real-time from the source tables.

## Report Types

### 1. **Daily Report**
Generates a daily summary for a specific date.

**Endpoint:** `POST /api/v1/reports/generate/daily`

**Request Body:**
```json
{
  "date": "2025-11-12",
  "zone_id": null
}
```

**Response:**
```json
{
  "success": true,
  "message": "Daily report generated",
  "data": {
    "report_type": "daily",
    "report_date": "2025-11-12",
    "zones": [
      {
        "report_date": "2025-11-12",
        "zone_id": 1,
        "zone_name": "Downtown Market",
        "total_spaces": 50,
        "occupied_spaces": 35,
        "occupancy_rate": 70.00,
        "total_revenue": 25000,
        "total_payments": 15
      }
    ],
    "summary": {
      "total_zones": 1,
      "average_occupancy_rate": 70,
      "total_revenue": 25000,
      "total_payments": 15
    }
  }
}
```

### 2. **Weekly Report**
Aggregates data for a 7-day period.

**Endpoint:** `POST /api/v1/reports/generate/weekly`

**Request Body:**
```json
{
  "start_date": "2025-11-05",
  "end_date": "2025-11-11",
  "zone_id": null
}
```

### 3. **Monthly Report**
Aggregates data for a complete month with top seller rankings.

**Endpoint:** `POST /api/v1/reports/generate/monthly`

**Request Body:**
```json
{
  "year": 2025,
  "month": 11,
  "zone_id": null
}
```

**Additional Data:**
- Top 5 sellers by revenue included
- Unique sellers count
- All zone statistics

### 4. **Occupancy Report**
Detailed space occupancy analysis.

**Endpoint:** `POST /api/v1/reports/generate/occupancy`

**Request Body:**
```json
{
  "start_date": "2025-11-01",
  "end_date": "2025-11-30",
  "zone_id": null
}
```

**Response Summary:**
```json
{
  "summary": {
    "average_occupancy_rate": 65.50,
    "total_zones": 3,
    "total_spaces": 150,
    "occupied_spaces": 98,
    "available_spaces": 42,
    "maintenance_spaces": 10
  }
}
```

### 5. **Revenue Report**
Payment analysis by method and status.

**Endpoint:** `POST /api/v1/reports/generate/revenue`

**Request Body:**
```json
{
  "start_date": "2025-11-01",
  "end_date": "2025-11-30",
  "zone_id": null
}
```

**Breakdown by Payment Method:**
```json
{
  "payment_methods": [
    {
      "payment_method": "mobile_money",
      "status": "completed",
      "transaction_count": 25,
      "total_amount": 50000,
      "average_amount": 2000,
      "min_amount": 500,
      "max_amount": 5000
    }
  ]
}
```

## Query Endpoints

### Zone Statistics
**Endpoint:** `GET /api/v1/reports/zone-statistics?start_date=2025-11-01&end_date=2025-11-30`

**Response:**
```json
{
  "data": {
    "report_type": "zone_statistics",
    "zones": [
      {
        "zone_id": 1,
        "zone_name": "Downtown Market",
        "total_spaces": 50,
        "available_spaces": 15,
        "occupied_spaces": 30,
        "total_allocations": 30,
        "unique_sellers": 25,
        "occupancy_rate": 60,
        "total_revenue": 100000
      }
    ]
  }
}
```

### Allocation Summary
**Endpoint:** `GET /api/v1/reports/allocations?start_date=2025-11-01&end_date=2025-11-30`

**Breaks down allocations by:**
- Total allocations
- Active vs pending vs terminated
- Unique sellers
- By zone

### Top Sellers
**Endpoint:** `GET /api/v1/reports/top-sellers?start_date=2025-11-01&end_date=2025-11-30&limit=10`

**Response:**
```json
{
  "data": {
    "report_type": "top_sellers",
    "sellers": [
      {
        "seller_id": 1,
        "full_name": "Kwizera Imana",
        "business_name": "Fresh Produce Ltd",
        "phone_number": "0790989830",
        "email": "kwizera@example.com",
        "total_allocations": 5,
        "total_payments": 12,
        "total_revenue": 180000,
        "average_payment": 15000
      }
    ]
  }
}
```

## Authentication

All report endpoints require authentication via JWT token.

**Header:**
```
Authorization: Bearer <JWT_TOKEN>
```

The JWT token must contain `userId` (not `user_id`) in the payload.

## Database Queries

The Report model uses aggregation queries on these existing tables:
- `spaces` - Space information and status
- `zones` - Zone information
- `space_allocations` - Allocation details
- `payments` - Payment transactions
- `sellers` - Seller information
- `users` - User contact information

No data is stored; all reports are calculated on-demand.

## Performance Considerations

1. **Large date ranges** - May take longer to aggregate
2. **Query optimization** - Ensure database indexes exist on:
   - `space_allocations.start_date, end_date, status`
   - `payments.payment_date, status, allocation_id`
   - `spaces.zone_id, status`

3. **Caching** - Reports can be cached on the frontend for 5-10 minutes

## Example Usage

### Generate a monthly report
```javascript
const response = await fetch('/api/v1/reports/generate/monthly', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    year: 2025,
    month: 11
  })
});

const report = await response.json();
console.log(report.data.summary);
```

### Get zone statistics
```javascript
const response = await fetch(
  '/api/v1/reports/zone-statistics?start_date=2025-11-01&end_date=2025-11-30',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const stats = await response.json();
```

## Error Handling

All endpoints return:
- **400** - Missing or invalid parameters
- **500** - Database query error

Example error response:
```json
{
  "success": false,
  "message": "Failed to generate daily report",
  "error": "Database connection error"
}
```

## File Structure

```
server/src/
├── models/
│   └── Report.model.js          # 8 query methods
├── controllers/
│   └── report.controller.js      # 8 endpoint handlers
├── routes/
│   └── report.routes.js          # 8 route definitions
└── migrations/
    └── 008_create_reports_table.js  # Empty (no table needed)
```

## Routes Defined

```
POST   /api/v1/reports/generate/daily
POST   /api/v1/reports/generate/weekly
POST   /api/v1/reports/generate/monthly
POST   /api/v1/reports/generate/occupancy
POST   /api/v1/reports/generate/revenue
GET    /api/v1/reports/zone-statistics
GET    /api/v1/reports/allocations
GET    /api/v1/reports/top-sellers
```

All routes require authentication.
