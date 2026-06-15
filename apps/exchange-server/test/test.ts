import http from "k6/http";
import { check, sleep } from "k6";

/**
 * Trading pairs → Kafka partition keys
 */
const PAIRS = [
  "BTCUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "DOGEUSDT",
];

/**
 * k6 test configuration
 */
export const options = {
  stages: [
    { duration: "20s", target: 100 },
    { duration: "20s", target: 300 },
    { duration: "20s", target: 500 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<1000"], // p95 < 1s under load
  },
};

/**
 * Helpers
 */
function randomPair() {
  return PAIRS[Math.floor(Math.random() * PAIRS.length)];
}

function randomSide() {
  return Math.random() > 0.5 ? "BUY" : "SELL";
}

function randomPrice() {
  return 42000 + Math.floor(Math.random() * 2000);
}

function randomAmount() {
  return Number((Math.random() * 0.05 + 0.01).toFixed(4));
}

/**
 * Main test
 */
export default function () {
  const orderSide = randomSide();

  // 🔁 Route based on order side
  const url =
    orderSide === "BUY"
      ? "http://localhost:3000/api/order/buyorder"
      : "http://localhost:3000/api/order/sellOrder";

  const payload = JSON.stringify({
    currencyPair: randomPair(), // 🔑 Kafka partition key
    orderSide,
    orderType: "Market",
    entryPrice: randomPrice(),
    positionStatus: "Open",
    orderAmount: randomAmount(),
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
    timeout: "10s",
  };

  const res = http.post(url, payload, params);

  check(res, {
    "status is 200 / 201 / 202": (r) =>
      r.status === 200 || r.status === 201 || r.status === 202,
  });

  // simulate user think time
  sleep(0.1);
}
