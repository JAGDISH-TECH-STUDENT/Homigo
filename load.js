import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
  vus: 50,
  duration: "1m",
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  let res = http.get("https://homigo-cp8k.onrender.com");

  check(res, {
    "Homepage status is 200": (r) => r.status === 200,
  });

  sleep(1);
}
