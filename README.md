# Exchange-X: High-Performance Crypto Exchange

Welcome to **Exchange-X**, a feature-rich, high-performance cryptocurrency exchange platform. This project is structured as a monorepo using **Turborepo** to orchestrate a modern React/Next.js frontend and a Node.js/Express/Kafka/Redis backend trading engine.

[![Exchange Web Dashboard Mockup](https://i.ibb.co/39cpKjPp/1.png)](https://ibb.co/tTDqRv1q)
[![Exchange Web Analytics Mockup](https://i.ibb.co/hJ2PS62G/2.png)](https://ibb.co/cS2GjB2W)

---

## 🏗️ Monorepo Structure

This project uses [Turborepo](https://turborepo.dev/) to manage the following workspaces:

- **`apps/exchange-web`**: The Next.js-powered trading frontend.
- **`apps/exchange-server`**: The Node.js-powered high-throughput trading engine.
- **`packages/eslint-config`**: Shared linting configurations.
- **`packages/typescript-config`**: Shared TypeScript compiler settings.

---

## 💻 Frontend (Web Application)

The web client provides a simulated, premium environment for real-time crypto trading, complete with live market data, advanced charting, and wallet management.

### Features

- **Live Trading Dashboard:** Integrated TradingView widget for advanced interactive charts.
- **Real-time Order Book:** Live streaming order book displaying buy and sell orders.
- **Spot Trading:** Submit market and limit orders instantly.
- **Wallet Management:** View balances and manage simulated funds across multiple assets.
- **Secure Authentication:** User login, registration, and session token persistence.
- **Trade History:** View open orders, order history, and past trade history.
- **Multi-Market Support:** Quick switching between various cryptocurrency trading pairs.

### Built With

- [Next.js](https://nextjs.org/) (App Router)
- [React](https://reactjs.org/) & [TypeScript](https://www.typescriptlang.org/)
- [Redux Toolkit](https://redux-toolkit.js.org/) (Global state management)
- [Tailwind CSS](https://tailwindcss.com/) (Responsive modern UI styling)
- [Axios](https://axios-http.com/) & [WebSockets (ws)](https://github.com/websockets/ws) for API/real-time communication

---

## ⚙️ Backend (Trading Engine)

The core backend is a high-performance trading engine designed with a fast matching engine algorithm and robust queue-based persistence.

### Tech Stack

- **Core:** Node.js, Express, TypeScript
- **Database:** MongoDB (Persistent state)
- **Messaging & Queueing:** Apache Kafka (Asynchronous ingestion)
- **In-Memory Store & Cache:** Redis (Fast order book querying)

### Core Engine Logic

#### 1. Price-Time Priority Order Matching Engine

The order matching engine ([`orders-matching-engine.ts`](apps/exchange-server/src/matching-engine-algorithm/orders-matching-engine.ts)) uses an in-memory Redis-backed order book to match buy and sell orders:

- **Order Book Management:** Open limit orders are maintained in price-time order in Redis to guarantee ultra-low latency.
- **Matching Algorithm:**
  - **Priority:** Orders are sorted by price (highest buy/lowest sell first), then by creation time.
  - **Matching Rules:** A buy order matches a sell order if `buyPrice >= sellPrice`.
- **Execution & Settlement:**
  - _Full Match:_ Settles and executes the trade. Wallet balances are adjusted, and trade history is updated.
  - _Partial Match:_ Settles the matching portion. The remainder of the order is added to the order book.
  - _No Match:_ Places the order in the order book.
- **Real-time Updates:** Match events and order book updates are published instantly over WebSockets.

#### 2. High-Throughput Bulk Insertion

To prevent database bottlenecks under heavy trading loads, the engine uses **Kafka** ([`bulk-insertion.ts`](apps/exchange-server/src/services/kafka-services/bulk-insertion.ts)) to queue and batch trade logs and wallet balances before writing to MongoDB.

### API Endpoints

| Category   | Endpoint                         | Method | Description                   |
| :--------- | :------------------------------- | :----- | :---------------------------- |
| **Auth**   | `/api/v1/auth/register`          | POST   | Register new user             |
|            | `/api/v1/auth/login`             | POST   | Authenticate & get token      |
|            | `/api/v1/auth/logout`            | POST   | Terminate session             |
|            | `/api/v1/auth/refresh`           | POST   | Refresh token                 |
| **Wallet** | `/api/v1/wallet/create`          | POST   | Create user wallet            |
|            | `/api/v1/wallet/balance/:userId` | GET    | Retrieve wallet balance       |
|            | `/api/v1/wallet/balance/:userId` | PUT    | Modify wallet balance         |
| **Orders** | `/api/v1/orders/buy`             | POST   | Place limit/market buy order  |
|            | `/api/v1/orders/sell`            | POST   | Place limit/market sell order |
|            | `/api/v1/orders/open`            | POST   | Fetch open orders             |
|            | `/api/v1/orders/close`           | POST   | Cancel / close an order       |
|            | `/api/v1/orders/history/:userId` | GET    | Retrieve trade history        |
|            | `/api/v1/orders/orderbook`       | GET    | Retrieve live order book      |

---

## ⚡ Performance & Benchmark Statistics

We conducted a high-concurrency load test on the limit order endpoints to verify the performance limits of the trading engine.

### Test Environment & Configuration

- **Tool:** Grafana k6
- **Test Script:** [`test/limit-order-rate.ts`](apps/exchange-server/test/limit-order-rate.ts)
- **VUs (Virtual Users):** Up to **1,000 parallel VUs** (ramping up from 200 to 1,000, then sustaining peak, then cooling down)
- **Duration:** 1 minute 0 seconds (active test load)

### Results Summary

Under peak load, the system successfully processed **156,380 orders** in 60 seconds with **zero failures**. This translates to an order execution rate of **156,380 orders/minute (~2,606 orders/second)**, comfortably exceeding the design goal of 150k orders/minute.

#### 📊 Performance Metrics

| Metric                      | Target / Threshold   | Actual Result                          | Status  |
| :-------------------------- | :------------------- | :------------------------------------- | :------ |
| **Throughput (Orders/min)** | > 150,000 orders/min | **156,380 orders/min** (~2,606.22/sec) | ✅ Pass |
| **Success Rate**            | > 90.00%             | **100.00%**                            | ✅ Pass |
| **Failed Orders**           | < 500 total          | **0**                                  | ✅ Pass |
| **p(95) HTTP Latency**      | < 2,000 ms           | **398.99 ms**                          | ✅ Pass |
| **p(99) Order Latency**     | < 5,000 ms           | **420.54 ms**                          | ✅ Pass |

#### 📈 Latency Breakdown

- **Average Latency:** 236.01 ms
- **Median Latency:** 250.14 ms
- **90th Percentile (p90):** 385.93 ms
- **95th Percentile (p95):** 398.99 ms
- **99th Percentile (p99):** 420.54 ms
- **Minimum Latency:** 1.06 ms
- **Maximum Latency:** 477.82 ms

#### 🌐 Network & System Throughput

- **Data Sent:** 92 MB (1.5 MB/s)
- **Data Received:** 105 MB (1.7 MB/s)
- **Checks Succeeded:** 156,380 / 156,380 (100.00%)

### 📸 Benchmark Run Screenshots

Here are the terminal execution screenshots from the k6 load test:

[![k6 Benchmark Execution and Thresholds](https://i.ibb.co/Wv2WZW76/test1.png)](https://ibb.co/chrc0cR1)
*Figure 1: k6 Execution Configuration, Scenarios, and Threshold Pass Status*

[![k6 Benchmark Detailed Metrics and Results](https://i.ibb.co/VpS2wWQp/test2.png)](https://ibb.co/rf64dGcf)
*Figure 2: k6 Run Total Results, HTTP, Execution, and Network Metrics*

---

## 🚀 Getting Started

### 📋 Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (v9.0.0 or higher recommended)
- Docker & Docker Compose (for Kafka, Redis, MongoDB services)

### 🛠️ Local Development Setup

1.  **Clone the repository and install dependencies:**

    ```bash
    pnpm install
    ```

2.  **Start required services (Redis, Kafka, MongoDB):**
    Ensure your Docker daemon is running, then start the services defined in `docker-compose.yaml`:

    ```bash
    docker compose up -d
    ```

3.  **Run in development mode:**
    This starts all applications (web client and trading server) concurrently under Turborepo:
    ```bash
    pnpm dev
    ```

    - **Frontend (Web Dashboard):** Access it at [http://localhost:3000](http://localhost:3000)
    - **Backend (Trading Server):** Running at [http://localhost:8008](http://localhost:8008) (or configured port)

### 🧪 Running Tests & Benchmarks

To run tests or performance benchmarks:

- **Run overall server tests:**
  ```bash
  cd apps/exchange-server
  npm test
  ```
- **Run the k6 Load Benchmark:**
  Ensure you have `k6` installed locally, then run:
  ```bash
  k6 run apps/exchange-server/test/limit-order-rate.ts
  ```
