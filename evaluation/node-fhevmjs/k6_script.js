import http from "k6/http";
import { check, sleep } from "k6";
import exec from "k6/execution";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// Array to store encryption times and user categories
let encryptionData = [];

export const options = {
    stages: [
        { duration: "10s", target: 10 }, // Low load: 10 users
        { duration: "10s", target: 50 }, // Medium load: 50 users
        { duration: "10s", target: 100 }, // High load: 100 users
        { duration: "5s", target: 0 }, // Ramp down
    ],
    thresholds: {
        http_req_duration: ["p(95)<500"], // 95% of requests should complete within 500ms
        http_req_failed: ["rate<0.01"], // Less than 1% of requests should fail
    },
};

export default function () {
    const payload = JSON.stringify({
        QoS_type: 1,
        QoD_model: 2,
        QoD_os_version: 3,
        QoS_operator: 4,
        MOS: 5,
    });

    const headers = { "Content-Type": "application/json" };
    const response = http.post("http://localhost:8585/encrypt", payload, { headers });

    check(response, {
        "status is 200": (r) => r.status === 200,
        "response has encryption time": (r) => r.json().encryptionTime !== undefined,
    });

    // Determine user category based on the current number of VUs
    const userCategory = exec.vu.idInTest <= 10 ? "Low" :
                        exec.vu.idInTest <= 50 ? "Medium" :
                        "High";

    // Store encryption time and user category
    encryptionData.push({
        userCategory: userCategory,
        encryptionTime: response.json().encryptionTime,
    });

    sleep(1); // Simulate a delay between requests
}

// Function to log data after the test completes
export function handleSummary(data) {
    // Convert encryptionData to CSV format
    const csvContent = [
        "UserCategory,EncryptionTime", // CSV header
        ...encryptionData.map((item) => `${item.userCategory},${item.encryptionTime}`), // CSV rows
    ].join("\n");

    // Log the CSV content to the console (you can redirect this to a file externally)
    console.log(csvContent);

    // Return the default summary
    return {
        "stdout": textSummary(data, { indent: " ", enableColors: true }),
    };
}