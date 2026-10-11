# ShopEase — E-commerce Store

A full-stack online shopping application built as part of the **CodeAlpha Full Stack Development Internship** (October 2026 batch).

---

## Features

- Browse product listings with search and category filters
- View full product details with stock availability
- Shopping cart — add, remove, update quantity (persisted in browser)
- User registration and login with JWT authentication
- Place real orders with shipping details and payment method
- Order history — view all past orders
- Admin dashboard — manage products, orders, and users

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT + bcrypt |

## Project Structure

```
ecommerce-store/
├── client/                  # Frontend
│   ├── css/style.css
│   ├── images/
│   ├── js/
│   │   ├── api.js           # Shared API utility
│   │   ├── auth.js          # Login / Register
│   │   ├── home.js          # Home page
│   │   ├── products.js      # Product listing
│   │   ├── product-details.js
│   │   ├── cart.js          # Shopping cart
│   │   ├── checkout.js      # Order placement
│   │   ├── orders.js        # Order history
│   │   └── admin.js         # Admin dashboard
│   ├── index.html
│   ├── products.html
│   ├── product-details.html
│   ├── cart.html
│   ├── checkout.html
│   ├── orders.html
│   ├── login.html
│   ├── register.html
│   └── admin.html
│
└── server/                  # Backend API
    ├── config/db.js
    ├── controllers/
    ├── middleware/
    ├── models/              # User, Product, Order
    ├── routes/
    ├── seed.js              # Database seeder
    └── server.js
```

## Getting Started

### 1. Install dependencies
```bash
cd server
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

### 3. Seed the database
```bash
node seed.js
```

### 4. Start the server
```bash
node server.js
```

### 5. Open the frontend
Open `client/index.html` in your browser or use VS Code Live Server.

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login, get JWT |
| GET | `/api/products` | — | List all products |
| GET | `/api/products/:id` | — | Single product |
| POST | `/api/orders` | ✓ | Place an order |
| GET | `/api/orders/my-orders` | ✓ | Order history |
| GET | `/api/admin/stats` | Admin | Dashboard stats |
| GET | `/api/admin/orders` | Admin | All orders |
| GET | `/api/admin/users` | Admin | All users |
| POST | `/api/admin/products` | Admin | Add product |
| DELETE | `/api/admin/products/:id` | Admin | Remove product |

## Admin Access

| Email | Password |
|-------|----------|
| `admin@shopease.com` | `Admin@1234` |

---

**Internship:** CodeAlpha — Full Stack Development | October 2026
