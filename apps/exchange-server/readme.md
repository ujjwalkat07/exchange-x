
# Trading Engine

This is a high-performance trading engine built with Node.js, Express, and MongoDB. It features a robust order matching system, real-time data processing with Kafka, and a secure authentication system.

## Tech Stack

*   **Backend:** Node.js, Express
*   **Database:** MongoDB
*   **Real-time Data Processing:** Kafka
*   **In-Memory Data Store:** Redis
*   **Language:** TypeScript

## Project Structure

The project is organized into the following main directories:

-   `src`: Contains the main source code.
    -   `config`: Configuration files for the database, Kafka, and Redis.
    -   `middleware`: Express middleware for authentication and error handling.
    -   `services`: Core application services, including authentication, orders, and wallet.
    -   `utils`: Utility functions and helper classes.
-   `test`: Test files.

## Core Logic

### Order Matching Engine

The order matching engine, implemented in `src/matching-engine-algorithm/orders-matching-engine.ts`, is the heart of the trading platform. It's responsible for matching buy and sell orders in a fair and efficient manner. Here's a detailed breakdown of its operation:

1.  **Order Book Management:** The engine maintains an order book for each trading pair. The order book is a list of all open buy and sell orders, organized by price level. To ensure high performance and low latency, the order book is stored in Redis, an in-memory data store.

2.  **Order Submission:** When a user places a new order (either buy or sell), the order is sent to the matching engine.

3.  **Matching Algorithm:** The matching engine's core algorithm continuously tries to match incoming orders with existing orders in the order book. The matching process follows these principles:
    *   **Price-Time Priority:** Orders are prioritized first by price and then by the time they were placed. For buy orders, the highest price is the highest priority. For sell orders, the lowest price is the highest priority.
    *   **Matching:** A buy order is matched with a sell order if the buy price is greater than or equal to the sell price.

4.  **Execution and Settlement:**
    *   **Full Match:** If an incoming order is fully matched with one or more orders in the order book, the trade is executed. The wallet balances of the buyer and seller are updated, and the trade is recorded in the order history.
    *   **Partial Match:** If an incoming order is only partially matched, the matched portion is executed as a trade. The remaining, unmatched portion of the order is then added to the order book.
    *   **No Match:** If an incoming order cannot be matched with any existing orders, it is added to the order book to await a matching order.

5.  **Real-time Updates:** The order book is updated in real-time as new orders are placed and trades are executed. These updates are broadcast to connected clients using WebSockets (or a similar technology) to provide a live view of the market.

### Bulk Insertion

The bulk insertion mechanism is responsible for efficiently inserting large volumes of data into the database. It uses Kafka to queue and process data in batches, ensuring high throughput and minimizing database load. The bulk insertion logic is implemented in `src/services/kafka-services/bulk-insertion.ts`.

## API Endpoints

### Authentication

-   `POST /api/v1/auth/register`: Register a new user.
-   `POST /api/v1/auth/login`: Login an existing user.
-   `POST /api/v1/auth/logout`: Logout a user.
-   `POST /api/v1/auth/refresh`: Refresh an access token.

### Wallet

-   `POST /api/v1/wallet/create`: Create a new wallet for a user.
-   `GET /api/v1/wallet/balance/:userId`: Get the wallet balance for a user.
-   `PUT /api/v1/wallet/balance/:userId`: Update the wallet balance for a user.

### Orders

-   `POST /api/v1/orders/buy`: Place a new buy order.
-   `POST /api/v1/orders/sell`: Place a new sell order.
-   `POST /api/v1/orders/open`: Get all open orders for a user.
-   `POST /api/v1/orders/close`: Close an open order.
-   `GET /api/v1/orders/history/:userId`: Get the order history for a user.
-   `GET /api/v1/orders/orderbook`: Get the current order book.

## Getting Started

1.  Install dependencies: `npm install`
2.  Start the server: `npm start`
3.  Run the tests: `npm test`

