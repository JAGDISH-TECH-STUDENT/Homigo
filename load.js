import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
  vus: 50,            // 20 concurrent users
  duration: "1m",     // Run test for 1 minute
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% requests < 500ms
    http_req_failed: ["rate<0.01"],   // <1% requests should fail
  },
};

export default function () {
  let res = http.get("https://homigo-cp8k.onrender.com/api/listings");

  check(res, {
    "Homepage status is 200": (r) => r.status === 200,
  });

  sleep(1);
}
