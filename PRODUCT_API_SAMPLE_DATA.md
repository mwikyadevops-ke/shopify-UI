# Product API - Sample Request Data

This document shows the exact data format that the frontend sends to the backend API when creating or updating a product.

## Endpoint

**POST** `/api/products` (Create)  
**PUT** `/api/products/:id` (Update)

---

## Request Headers

```http
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

---

## Sample Request Payload Examples

### Example 1: Creating a Product (All Fields)

```json
{
  "name": "Samsung Galaxy S24",
  "sku": "SAM-GAL-S24-128",
  "category_id": "1",
  "barcode": "8806093441234",
  "unit_price": 999.99,
  "cost_price": 750.00,
  "default_min_stock_level": 10,
  "description": "Latest Samsung flagship smartphone with 128GB storage, 8GB RAM, and 50MP camera",
  "status": "active"
}
```

### Example 2: Creating a Product (Minimal Required Fields)

```json
{
  "name": "Wireless Mouse",
  "unit_price": 29.99,
  "default_min_stock_level": 0,
  "status": "active"
}
```

### Example 3: Creating a Product (Without Category)

```json
{
  "name": "USB Cable",
  "sku": "USB-C-001",
  "category_id": null,
  "barcode": "123456789012",
  "unit_price": 12.50,
  "cost_price": 8.00,
  "description": "High-quality USB-C charging cable, 1 meter length",
  "status": "active"
}
```

### Example 4: Creating a Product (Inactive Status)

```json
{
  "name": "Discontinued Model X",
  "sku": "MOD-X-OLD",
  "category_id": "3",
  "unit_price": 199.99,
  "status": "inactive"
}
```

### Example 5: Creating a Product (Discontinued Status)

```json
{
  "name": "Old Product Line",
  "sku": "OLD-PROD-001",
  "category_id": "2",
  "unit_price": 49.99,
  "status": "discontinued"
}
```

---

## Field Specifications

| Field | Type | Required | Default | Validation | Notes |
|-------|------|----------|---------|------------|-------|
| `name` | string | ✅ Yes | - | min: 1 character | Product name |
| `sku` | string | ❌ No | null | - | Stock Keeping Unit (unique identifier) |
| `category_id` | string \| null | ❌ No | null | Must exist in categories table | Category ID as string (or null if not selected) |
| `barcode` | string | ❌ No | null | - | Product barcode/UPC |
| `unit_price` | number | ✅ Yes | - | > 0, decimal precision: 2 | Selling price |
| `cost_price` | number | ❌ No | null | ≥ 0, decimal precision: 2 | Cost price (for profit calculation) |
| `default_min_stock_level` | number | ❌ No | 0 | ≥ 0, integer | Default minimum stock level for the product |
| `description` | string | ❌ No | null | - | Product description |
| `status` | string | ❌ No | "active" | enum: "active", "inactive", "discontinued" | Product status |

---

## Important Notes

### 1. Data Type Conversions

- **`category_id`**: Sent as a **string** (e.g., `"1"`) or `null` if not selected. Backend should convert to integer if needed.
- **`unit_price`** and **`cost_price`**: Sent as **numbers** (not strings) with decimal precision (e.g., `999.99`).
- **`status`**: Default value is `"active"` if not provided (from the select dropdown).

### 2. Empty/Null Values

When fields are not filled:
- `category_id`: `null` (empty select returns `null` via `setValueAs`)
- `sku`, `barcode`, `description`: Empty string `""` or may be `null`
- `cost_price`: `null` if not provided (because `valueAsNumber` returns `null` for empty)

### 3. Category ID Handling

```javascript
// Frontend converts empty select to null
category_id: value === '' ? null : String(value)

// So backend will receive:
category_id: "1"  // Selected category
category_id: null // No category selected
```

### 4. Price Fields

```javascript
// Frontend uses valueAsNumber: true
unit_price: 999.99  // Number type
cost_price: 750.50  // Number type
cost_price: null    // If not provided
```

---

## Complete cURL Examples

### Create Product (Full Example)

```bash
curl -X POST "http://localhost:8000/api/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Samsung Galaxy S24",
    "sku": "SAM-GAL-S24-128",
    "category_id": "1",
    "barcode": "8806093441234",
    "unit_price": 999.99,
    "cost_price": 750.00,
    "description": "Latest Samsung flagship smartphone with 128GB storage",
    "status": "active"
  }'
```

### Create Product (Minimal Example)

```bash
curl -X POST "http://localhost:8000/api/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Wireless Mouse",
    "unit_price": 29.99
  }'
```

### Update Product

```bash
curl -X PUT "http://localhost:8000/api/products/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Samsung Galaxy S24 Pro",
    "sku": "SAM-GAL-S24-256",
    "category_id": "1",
    "barcode": "8806093441235",
    "unit_price": 1199.99,
    "cost_price": 900.00,
    "description": "Updated description",
    "status": "active"
  }'
```

---

## Expected Backend Response (Success)

### Create Product Response (201)

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": 1,
    "name": "Samsung Galaxy S24",
    "sku": "SAM-GAL-S24-128",
    "category_id": 1,
    "barcode": "8806093441234",
    "unit_price": "999.99",
    "cost_price": "750.00",
    "description": "Latest Samsung flagship smartphone with 128GB storage",
    "status": "active",
    "created_at": "2024-01-20T10:30:00Z",
    "updated_at": "2024-01-20T10:30:00Z"
  }
}
```

### Update Product Response (200)

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": 1,
    "name": "Samsung Galaxy S24 Pro",
    "sku": "SAM-GAL-S24-256",
    "category_id": 1,
    "barcode": "8806093441235",
    "unit_price": "1199.99",
    "cost_price": "900.00",
    "description": "Updated description",
    "status": "active",
    "created_at": "2024-01-20T10:30:00Z",
    "updated_at": "2024-01-20T11:45:00Z"
  }
}
```

---

## Validation Error Response (422)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "name": [
      "The name field is required."
    ],
    "unit_price": [
      "The unit price field is required.",
      "The unit price must be greater than 0."
    ],
    "category_id": [
      "The selected category does not exist."
    ]
  }
}
```

---

## Database Schema Recommendations

```sql
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    category_id INT NULL,
    barcode VARCHAR(100),
    unit_price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) NULL,
    description TEXT,
    status ENUM('active', 'inactive', 'discontinued') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category_id),
    INDEX idx_sku (sku),
    INDEX idx_status (status),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
```

---

## Backend Implementation Notes

### 1. Category ID Handling

```php
// PHP/Laravel Example
$categoryId = $request->category_id ? (int) $request->category_id : null;
```

```javascript
// Node.js/Express Example
const categoryId = req.body.category_id ? parseInt(req.body.category_id) : null;
```

```python
# Python/Django Example
category_id = int(request.data.get('category_id')) if request.data.get('category_id') else None
```

### 2. Price Validation

- Ensure `unit_price` is positive
- `cost_price` can be null or zero
- Store as DECIMAL in database for precision

### 3. Status Default

- If `status` is not provided, default to `"active"`
- Validate against enum values: `"active"`, `"inactive"`, `"discontinued"`

### 4. SKU Uniqueness

- If SKU is provided, ensure it's unique across all products
- Return 409 Conflict if duplicate SKU is provided

### 5. Category Validation

- If `category_id` is provided, verify it exists in categories table
- If category doesn't exist, return 422 validation error
- If category is inactive, you may want to allow or reject based on business logic

---

## Testing Checklist

✅ Test with all fields filled  
✅ Test with only required fields  
✅ Test without category (null category_id)  
✅ Test with empty string values  
✅ Test with different status values  
✅ Test with decimal prices (e.g., 99.99)  
✅ Test with very large prices  
✅ Test with invalid category_id  
✅ Test with duplicate SKU  
✅ Test validation errors  

---

## Frontend Console Logging

The frontend logs the data being sent. Check browser console for:
- `📦 Creating product:` - Shows the exact payload being sent
- API Request logs show the full request in the Network tab

---

## Summary

**Key Points:**
- `category_id` is sent as a **string** or `null`
- `unit_price` and `cost_price` are sent as **numbers**
- `status` defaults to `"active"` if not provided
- Empty optional fields may be `null` or empty string `""`
- Only `name` and `unit_price` are required fields

