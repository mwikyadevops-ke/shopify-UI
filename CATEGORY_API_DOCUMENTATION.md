# Category API Documentation

This document describes the backend API endpoints required for the Category management feature in the Shopify UI frontend.

## Base URL

All endpoints should be prefixed with: `/api/categories`

Example: `http://localhost:8000/api/categories`

---

## Endpoints

### 1. Get All Categories (List with Pagination)

**GET** `/api/categories`

Retrieve a paginated list of categories.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number for pagination |
| `limit` | integer | No | 10 | Number of items per page |
| `search` | string | No | - | Search term to filter by name or description |
| `status` | string | No | - | Filter by status (`active` or `inactive`) |
| `sort_by` | string | No | `created_at` | Field to sort by |
| `sort_order` | string | No | `desc` | Sort order (`asc` or `desc`) |

#### Request Example

```http
GET /api/categories?page=1&limit=10&status=active
Authorization: Bearer {token}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Electronics",
      "description": "Electronic products and accessories",
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "name": "Clothing",
      "description": "Apparel and fashion items",
      "status": "active",
      "created_at": "2024-01-16T11:20:00Z",
      "updated_at": "2024-01-16T11:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasPrev": false,
    "hasNext": true
  }
}
```

#### Response (Error - 401)

```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "Invalid or expired token"
}
```

#### Response (Error - 500)

```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Failed to retrieve categories"
}
```

---

### 2. Get Single Category by ID

**GET** `/api/categories/:id`

Retrieve a single category by its ID.

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Category ID |

#### Request Example

```http
GET /api/categories/1
Authorization: Bearer {token}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Category retrieved successfully",
  "data": {
    "id": 1,
    "name": "Electronics",
    "description": "Electronic products and accessories",
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Response (Error - 404)

```json
{
  "success": false,
  "message": "Category not found",
  "error": "Category with ID 1 does not exist"
}
```

---

### 3. Create New Category

**POST** `/api/categories`

Create a new category.

#### Request Body

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `name` | string | Yes | min: 2, max: 255, unique | Category name |
| `description` | string | No | max: 1000 | Category description |
| `status` | string | No | enum: `active`, `inactive` | Category status (default: `active`) |

#### Request Example

```http
POST /api/categories
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Electronics",
  "description": "Electronic products and accessories",
  "status": "active"
}
```

#### Response (Success - 201)

```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": 1,
    "name": "Electronics",
    "description": "Electronic products and accessories",
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Response (Error - 422 Validation Error)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "name": [
      "The name field is required.",
      "The name must be at least 2 characters."
    ]
  }
}
```

#### Response (Error - 409 Conflict)

```json
{
  "success": false,
  "message": "Category name already exists",
  "error": "A category with this name already exists"
}
```

---

### 4. Update Category

**PUT** `/api/categories/:id`

Update an existing category.

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Category ID |

#### Request Body

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `name` | string | Yes | min: 2, max: 255 | Category name (unique except current) |
| `description` | string | No | max: 1000 | Category description |
| `status` | string | No | enum: `active`, `inactive` | Category status |

#### Request Example

```http
PUT /api/categories/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Electronics & Gadgets",
  "description": "Updated description for electronics",
  "status": "active"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "id": 1,
    "name": "Electronics & Gadgets",
    "description": "Updated description for electronics",
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:45:00Z"
  }
}
```

#### Response (Error - 404)

```json
{
  "success": false,
  "message": "Category not found",
  "error": "Category with ID 1 does not exist"
}
```

#### Response (Error - 422 Validation Error)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "name": [
      "The name must be at least 2 characters."
    ]
  }
}
```

---

### 5. Delete Category

**DELETE** `/api/categories/:id`

Delete a category.

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Category ID |

#### Request Example

```http
DELETE /api/categories/1
Authorization: Bearer {token}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

#### Response (Success - 204)

Alternatively, the server may return a 204 No Content status with an empty body.

#### Response (Error - 404)

```json
{
  "success": false,
  "message": "Category not found",
  "error": "Category with ID 1 does not exist"
}
```

#### Response (Error - 409 Conflict)

```json
{
  "success": false,
  "message": "Cannot delete category",
  "error": "Category is associated with existing products and cannot be deleted"
}
```

---

## Database Schema

### Categories Table

```sql
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_name (name)
);
```

---

## Authentication

All endpoints require authentication via JWT Bearer token.

**Authorization Header Format:**
```
Authorization: Bearer {jwt_token}
```

---

## Error Response Format

All error responses should follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error description (optional)",
  "errors": {
    "field_name": [
      "Validation error message 1",
      "Validation error message 2"
    ]
  }
}
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 204 | No Content - Request successful, no content to return |
| 400 | Bad Request - Invalid request parameters |
| 401 | Unauthorized - Missing or invalid authentication token |
| 403 | Forbidden - User doesn't have permission |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource conflict (e.g., duplicate name) |
| 422 | Unprocessable Entity - Validation errors |
| 500 | Internal Server Error - Server error |

---

## Notes for Backend Implementation

1. **Validation Rules:**
   - `name`: Required, minimum 2 characters, maximum 255 characters, must be unique
   - `description`: Optional, maximum 1000 characters
   - `status`: Optional, must be either `active` or `inactive`, defaults to `active`

2. **Business Logic:**
   - Before deleting a category, check if it's associated with any products
   - If products exist, return a 409 Conflict error with an appropriate message
   - Trim whitespace from `name` and `description` fields before saving

3. **Pagination:**
   - Default page size should be 10 items
   - Maximum page size should be 100 items
   - Include pagination metadata in the response

4. **Search Functionality:**
   - Search should work on both `name` and `description` fields
   - Use case-insensitive search

5. **Soft Delete (Optional):**
   - Consider implementing soft deletes instead of hard deletes
   - Add a `deleted_at` timestamp field
   - Filter out soft-deleted categories from GET requests

6. **Caching (Optional):**
   - Consider caching category lists for better performance
   - Invalidate cache on create/update/delete operations

---

## Testing Examples

### cURL Examples

#### Get All Categories
```bash
curl -X GET "http://localhost:8000/api/categories?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

#### Get Single Category
```bash
curl -X GET "http://localhost:8000/api/categories/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

#### Create Category
```bash
curl -X POST "http://localhost:8000/api/categories" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics",
    "description": "Electronic products",
    "status": "active"
  }'
```

#### Update Category
```bash
curl -X PUT "http://localhost:8000/api/categories/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics & Gadgets",
    "description": "Updated description",
    "status": "active"
  }'
```

#### Delete Category
```bash
curl -X DELETE "http://localhost:8000/api/categories/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

---

## Frontend Integration

The frontend is already configured to use these endpoints through the `categoryService` in `src/services/categoryService.js`. The service methods map directly to these API endpoints:

- `categoryService.getAll(params)` → `GET /api/categories`
- `categoryService.getById(id)` → `GET /api/categories/:id`
- `categoryService.create(data)` → `POST /api/categories`
- `categoryService.update(id, data)` → `PUT /api/categories/:id`
- `categoryService.delete(id)` → `DELETE /api/categories/:id`

Ensure your backend implements these endpoints with the exact response format described above for seamless integration.

