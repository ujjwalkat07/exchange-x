import http from "k6/http";
import { check } from "k6";
import { Counter, Trend, Rate } from "k6/metrics";
import { SharedArray } from "k6/data";
import exec from "k6/execution";

// ─── Custom Metrics ─────────────────────────────────────────────────────────
const successOrders = new Counter("success_orders");
const rateLimited = new Counter("rate_limited");
const failedOrders = new Counter("failed_orders");
const orderLatency = new Trend("order_latency_ms", true);
const successRate = new Rate("success_rate");

// ─── Config ─────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || "http://localhost:8008";

// Load tokens from JSON file (shared across VUs — read once)
const tokens = new SharedArray("tokens", function () {
  return JSON.parse(open("./loadtest-tokens.json"));
});

/**
 * Goal: 100k orders/min ≈ 1,667 req/s
 *
 * Formula: throughput (req/s) = VUs / avg_latency_in_seconds
 *
 *   At 50ms avg latency  → need ~84 VUs
 *   At 100ms avg latency → need ~167 VUs
 *   At 200ms avg latency → need ~334 VUs
 *   At 500ms avg latency → need ~834 VUs
 *
 * Strategy: Ramp up VUs in stages to find the ceiling, then sustain.
 * Each VU fires as fast as possible (no sleep) with its own token.
 */
export const options = {
  // ── Ramped stages ──────────────────────────────────────────────────────
  stages: [
    { duration: "10s", target: 200 },   // warm-up
    { duration: "10s", target: 500 },   // ramp to medium load
    { duration: "10s", target: 1000 },  // ramp to high load
    { duration: "20s", target: 1000 },  // sustain peak
    { duration: "10s", target: 0 },     // cool down
  ],

  // ── Thresholds ─────────────────────────────────────────────────────────
  thresholds: {
    "http_req_duration": ["p(95)<2000"],   // 95th pct under 2s
    "order_latency_ms":  ["p(99)<5000"],   // tail under 5s
    "success_rate":      ["rate>0.90"],     // 90%+ success
    "failed_orders":     ["count<500"],     // tolerate some errors
  },

  // ── Connection tuning ─────────────────────────────────────────────────
  // Reuse TCP connections aggressively to reduce handshake overhead
  noConnectionReuse: false,
  // Increase the batch size for concurrent requests per VU
  batch: 1,
  // DNS cache to avoid repeated lookups
  dns: {
    ttl: "5m",
    select: "roundRobin",
  },
};

// Pre-built currency pairs for variety (adds realism to the test)
const PAIRS = ["BTCUSDT"];

// ─── VU loop — one order per iteration, no sleep ────────────────────────
export default function () {
  // Each VU gets a deterministic token based on its ID
  const vuIndex = (exec.vu.idInTest - 1) % tokens.length;
  const token = tokens[vuIndex];

  // Randomize order side for realistic mixed workload
  const isBuy = Math.random() > 0.4; // 60% buy, 40% sell
  const pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];

  // Build request body
  let body: string;
  let url: string;

  if (isBuy) {
    url = `${BASE_URL}/api/order/buyorder`;
    body = JSON.stringify({
      currencyPair: pair,
      orderType: "Limit",
      positionStatus: "Open",
      entryPrice: 60000 + Math.floor(Math.random() * 4000),
      orderAmount: 1, // Small amount to avoid balance exhaustion
    });
  } else {
    url = `${BASE_URL}/api/order/sellorder`;
    body = JSON.stringify({
      currencyPair: pair,
      orderType: "Limit",
      positionStatus: "Open",
      entryPrice: 60000 + Math.floor(Math.random() * 4000),
      orderQuantity: 0.00001, // Tiny quantity to avoid balance issues
    });
  }

  const params = {
    headers: {
      "Content-Type": "application/json",
      "Cookie": `accessToken=${token}`,
    },
    timeout: "10s",
    // Compression saves bandwidth → faster requests
    compression: "gzip",
  };

  const res = http.post(url, body, params);

  // ── Record metrics ──────────────────────────────────────────────────
  orderLatency.add(res.timings.duration);

  const isSuccess = res.status === 200 || res.status === 201;
  successRate.add(isSuccess);

  if (isSuccess) {
    successOrders.add(1);
  } else if (res.status === 429) {
    rateLimited.add(1);
  } else {
    failedOrders.add(1);
    // Rate-limit error logging — only log every ~100th error to avoid console overhead
    if (Math.random() < 0.01) {
      console.error(
        `❌ [sample] status=${res.status} body=${String(res.body).slice(0, 150)}`
      );
    }
  }

  check(res, {
    "order accepted": (r) => [200, 201, 429].includes(r.status),
  });

  // NO sleep — hammer the endpoint for max throughput
}