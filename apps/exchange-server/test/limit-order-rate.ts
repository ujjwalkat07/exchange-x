import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Trend } from "k6/metrics";

// ─── Metrics ───────────────────────────────────────────────────────────────────
const successOrders = new Counter("success_orders");
const rateLimited   = new Counter("rate_limited");
const failedOrders  = new Counter("failed_orders");
const orderLatency  = new Trend("order_latency_ms", true);

// ─── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || "http://localhost:8008";

/**
 * Goal: max raw throughput on the buy order endpoint.
 * 
 * Stages push VUs high to find the backend's ceiling.
 * Adjust MAX_VUS up/down depending on your machine limits.
 * 
 * To hit 100k trades/min (~1667/sec) you need:
 *   throughput (req/s) = VUs / avg_latency_in_seconds
 *   e.g. 200 VUs at 120ms avg latency = ~1667 req/s
 * 
 * Run with:
 *   k6 run --env BASE_URL=http://your-server:8008 load-test.js
 */
export const options = {
  stages: [
    { duration: "15s", target: 50  }, // warm-up
    { duration: "30s", target: 100 }, // ramp
    { duration: "60s", target: 200 }, // sustained — main measurement window
    { duration: "30s", target: 300 }, // push harder
    { duration: "15s", target: 0   }, // cool-down
  ],
  thresholds: {
    "http_req_duration":  ["p(95)<2000"],  // 95th pct under 2s
    "order_latency_ms":   ["p(99)<5000"],  // tail under 5s
    "failed_orders":      ["count<100"],   // tolerate very few real errors
  },
};

// ─── Login once, share token with all VUs ─────────────────────────────────────
export function setup() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: "admin2@gmail.com", password: "password123" }),
    { headers: { "Content-Type": "application/json" } },
  );

  if (res.status !== 200) {
    throw new Error(`Login failed (status=${res.status}): ${res.body}`);
  }

  const token = JSON.parse(res.body).data.accessToken;
  console.log(`✅ Login OK – token length=${token.length}`);
  return { token };
}

// ─── VU loop — one limit buy per iteration, no sleep ─────────────────────────
export default function (data) {
  const body = JSON.stringify({
    currencyPair:   "BTCUSDT",
    orderType:      "Limit",
    positionStatus: "Open",
    entryPrice:     60000 + Math.floor(Math.random() * 4000), // 90k–94k
    orderAmount:    1,    // 100–1000 USDT
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      "Cookie":        `accessToken=${data.token}`,
      "Authorization": `Bearer ${data.token}`,
    },
    timeout: "10s",
  };

  const res = http.post(`${BASE_URL}/api/order/buyorder`, body, params);

  orderLatency.add(res.timings.duration);

  if (res.status === 200 || res.status === 201) {
    successOrders.add(1);
  } else if (res.status === 429) {
    rateLimited.add(1);
  } else {
    failedOrders.add(1);
    console.error(`❌ status=${res.status} body=${String(res.body).slice(0, 200)}`);
  }

  check(res, { "ok or rate-limited": (r) => [200, 201, 429].includes(r.status) });

  // NO sleep — we want to hammer the endpoint as fast as possible.
  // If your backend struggles, add: sleep(0.05)
}