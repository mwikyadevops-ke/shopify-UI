# Shopify UI Frontend

React-based frontend application for the Shopify Management System.

## Tech Stack

- **React 18.2.0** - UI Library
- **Vite 5.0.8** - Build Tool
- **React Router DOM 6.20.1** - Routing
- **React Query 3.39.3** - Data Fetching & State Management
- **React Hook Form 7.49.2** - Form Handling
- **Axios 1.6.2** - HTTP Client
- **React Hot Toast 2.4.1** - Notifications

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The app will run on http://localhost:3000

## Build

```bash
npm run build
```

## Environment Variables

Create a `.env` file:

```
VITE_API_URL=http://localhost:8000/api
```

## Features

- ✅ Authentication (Login/Logout)
- ✅ Dashboard with statistics
- ✅ Shop Management (CRUD)
- ✅ User Management (CRUD)
- ✅ Product Management (CRUD)
- ✅ Stock Management
- ✅ Stock Transfers
- ✅ Sales Management
- ✅ Payment Processing
- ✅ Reports

## Project Structure

```
src/
  ├── components/     # Reusable components
  ├── pages/         # Page components
  ├── services/      # API services
  ├── context/       # React Context
  ├── hooks/         # Custom hooks
  ├── utils/         # Utility functions
  └── styles/        # CSS files
```

## API Integration

All API calls are made through services in `src/services/`. The API base URL is configured in `src/services/api.js`.


