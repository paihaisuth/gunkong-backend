# Gunkong Backend

A secure P2P transaction middleman system that facilitates safe peer-to-peer transactions by holding payments until both parties fulfill their obligations.

## Overview

Gunkong is a backend API service designed to act as a trusted intermediary in peer-to-peer marketplace transactions. It creates secure transaction rooms where buyers and sellers can complete transactions with confidence, knowing that payments are held securely until delivery is confirmed.

## Features

### Core Functionality

-   **Transaction Room Management** - Create and manage secure transaction spaces
-   **Payment Holding** - Secure payment escrow system
-   **Multi-Party Support** - Handles buyer, seller, and creator roles
-   **Room Code System** - Unique codes for easy room identification
-   **Status Tracking** - Complete transaction lifecycle monitoring

### Authentication & Security

-   **JWT Authentication** - Secure token-based authentication
-   **Auto Token Refresh** - Seamless token renewal without interruption
-   **Role-Based Access Control** - User and Admin role management
-   **Password Encryption** - Secure password hashing with bcrypt

### User Management

-   **User Registration & Login**
-   **Profile Management**
-   **User Search**
-   **Admin User Management**
-   **Account Activation/Deactivation**

## Tech Stack

-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: PostgreSQL
-   **ORM**: Sequelize
-   **Authentication**: JWT (jsonwebtoken)
-   **Password Hashing**: bcrypt
-   **Environment**: dotenv

## Installation

### Prerequisites

-   Node.js (v14 or higher)
-   PostgreSQL (v12 or higher)
-   pnpm (or npm/yarn)

### Setup

1. Clone the repository

```bash
git clone https://github.com/paihaisuth/gunkong-backend.git
cd gunkong-backend
```

2. Install dependencies

```bash
pnpm install
```

3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` file:

```env
PORT=8000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=gunkong
DB_USER=your_db_user
DB_PASSWORD=your_db_password

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

4. Start PostgreSQL (using Docker Compose)

```bash
docker-compose up -d
```

5. Run the application

```bash
pnpm start
```

The server will start at `http://localhost:8000`

## Transaction Flow

1. **Room Creation**

    - Seller/Buyer creates a transaction room
    - System generates unique room code
    - Room status: `CREATED`

2. **Payment**

    - Buyer makes payment
    - Payment held in escrow
    - Room status: `PENDING_PAYMENT` → `PAID`

3. **Shipping**

    - Seller ships item with tracking
    - Room status: `SHIPPED`

4. **Completion**

    - Buyer confirms receipt
    - Payment released to seller
    - Room status: `COMPLETED`

5. **Cancellation** (if needed)
    - Either party can cancel with reason
    - Payment refunded if applicable
    - Room status: `CANCELLED`

## Transaction Room Statuses

-   `CREATED` - Room created, awaiting payment
-   `PENDING_PAYMENT` - Payment being processed
-   `PAID` - Payment confirmed and held
-   `SHIPPED` - Item shipped by seller
-   `COMPLETED` - Transaction completed successfully
-   `CANCELLED` - Transaction cancelled

## Payment Statuses

-   `PENDING` - Payment not yet made
-   `HELD` - Payment held in escrow
-   `RELEASED` - Payment released to seller
-   `REFUNDED` - Payment refunded to buyer

## Security Features

### JWT Token System

-   **Access Token**: 1 hour expiry
-   **Refresh Token**: 7 days expiry
-   Automatic token refresh on expiration

### Password Security

-   Bcrypt hashing with salt rounds
-   Password validation on registration
-   Secure password change flow

### Role-Based Access

-   `USER` - Standard user access
-   `ADMIN` - Administrative privileges

## Development

### Run in development mode

```bash
pnpm start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software.

## Support

For support, please contact the development team or open an issue in the repository.
