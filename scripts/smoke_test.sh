#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:8000}"

TRANSCRIPT=$(cat <<'EOF'
Rep: Thanks for joining. What is driving the evaluation right now?
Customer: We spend 12 hours a week on manual reporting, and our CFO wants that cut in half this quarter.
Rep: Who is involved in the final decision?
Customer: I am leading the review, but our CFO signs off and IT will validate security.
Rep: What matters most in the decision?
Customer: Clear ROI, Salesforce integration, and confidence that rollout will be low effort.
Rep: What should we do next?
Customer: Send the ROI model and set up a technical review for next week.
EOF
)

echo "Checking backend health at ${BASE_URL}/health"
curl -fsS "${BASE_URL}/health"
echo
echo

echo "Queueing analysis job"
JOB_RESPONSE=$(curl -fsS \
  -X POST "${BASE_URL}/api/v1/analyze" \
  -H "Content-Type: application/json" \
  -d "$(printf '{"transcript": %s, "source_name": "Smoke Test"}' "$(printf '%s' "$TRANSCRIPT" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')")")

echo "$JOB_RESPONSE"
echo

JOB_ID=$(printf '%s' "$JOB_RESPONSE" | python3 -c 'import json,sys; print(json.load(sys.stdin)["job_id"])')

echo "Polling job ${JOB_ID}"
for _ in $(seq 1 30); do
  JOB_STATUS=$(curl -fsS "${BASE_URL}/api/v1/jobs/${JOB_ID}")
  STATUS=$(printf '%s' "$JOB_STATUS" | python3 -c 'import json,sys; print(json.load(sys.stdin)["status"])')
  echo "status=${STATUS}"

  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "partial" ] || [ "$STATUS" = "failed" ]; then
    ANALYSIS_ID=$(printf '%s' "$JOB_STATUS" | python3 -c 'import json,sys; data=json.load(sys.stdin); print(data.get("analysis_id") or "")')
    if [ -n "$ANALYSIS_ID" ]; then
      echo
      echo "Fetching analysis ${ANALYSIS_ID}"
      curl -fsS "${BASE_URL}/api/v1/analysis/${ANALYSIS_ID}"
      echo
    fi
    exit 0
  fi

  sleep 2
done

echo "Timed out waiting for job completion"
exit 1
