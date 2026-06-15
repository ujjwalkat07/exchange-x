import http from "k6/http";
// import { sleep } from "k6";

export const options = {
  vus: 10,
  duration: "60s",
  cloud: {
    // Project: testing-pro
    projectID: 6480406,
    // Test runs with the same name groups test runs together.
    name: "Test (30/01/2026-11:15:19)",
  },
};

export default function () {
  http.get("http://localhost:8000/api/wallet/getuserbalance/USDT");
  // sleep(1);
}

// k6 run test/getuserbalance.test.ts
