#!/bin/sh
# Tests the ETL worker's schedule arithmetic. No network, no credentials.
# Run: sh scripts/next-run-delay.test.sh
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/next-run-delay.mjs"
FAILURES=0

pass() { printf '  ok   %s\n' "$1"; }
fail() { printf '  FAIL %s\n' "$1"; FAILURES=$((FAILURES + 1)); }

# expect <now-iso> <at> <expected-seconds> <description>
expect() {
  actual="$(NOW_ISO="$1" node "$SCRIPT" "$2" 2>&1)"
  if [ "$actual" = "$3" ]; then pass "$4"
  else fail "$4 (expected $3, got $actual)"; fi
}

# expect_err <at> <description>
expect_err() {
  if NOW_ISO="2026-01-01T00:00:00Z" node "$SCRIPT" "$1" >/dev/null 2>&1
  then fail "$2 (should have exited non-zero)"; else pass "$2"; fi
}

echo "next-run-delay.mjs"

expect "2026-01-01T23:00:00Z" "00:00" "3600"  "one hour before midnight -> 3600s"
expect "2026-01-01T00:00:01Z" "00:00" "86399" "one second past the mark -> almost a full day"
expect "2026-01-01T12:00:00Z" "00:00" "43200" "midday -> 12 hours"
expect "2026-01-01T00:00:00Z" "00:00" "86400" "exactly on the mark -> full day, never fires twice"
expect "2026-01-01T06:30:00Z" "07:15" "2700"  "same-day target later today -> 45 minutes"
expect "2026-01-01T08:00:00Z" "07:15" "83700" "same-day target already passed -> tomorrow"

# Month and year rollover: the target is tomorrow, which is also next month/year.
expect "2026-01-31T23:30:00Z" "00:00" "1800" "month rollover"
expect "2026-12-31T23:30:00Z" "00:00" "1800" "year rollover"
# 2028 is a leap year, so 29 Feb exists and 28 Feb rolls into it.
expect "2028-02-28T23:30:00Z" "00:00" "1800" "leap-year rollover into 29 Feb"

expect_err "24:00"  "rejects hour 24"
expect_err "12:60"  "rejects minute 60"
expect_err "7:15"   "rejects unpadded hour"
expect_err "noon"   "rejects non-numeric input"
expect_err ""       "rejects empty string"

[ "$FAILURES" -eq 0 ] || { printf '\n%s test(s) failed\n' "$FAILURES"; exit 1; }
printf '\nall tests passed\n'
