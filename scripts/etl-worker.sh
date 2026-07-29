#!/bin/sh
# Long-running worker that applies migrations and runs the ETL once a day.
#
# Deployed as the `worker` service in docker-compose.yml, so it shares the api
# image and network — which is how the internal database hostname resolves.
#
#   ETL_AT          time of day to run, HH:MM UTC   (default 00:00)
#   ETL_MODE        arguments passed to load.js     (default --current)
#   ETL_RUN_ON_BOOT run once at startup as well     (default false)
set -eu

AT="${ETL_AT:-00:00}"
MODE="${ETL_MODE:---current}"
HERE="$(cd "$(dirname "$0")" && pwd)"

log() { printf '[etl-worker] %s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }

run_once() {
  log "applying migrations"
  if ! "$HERE/with-secrets.sh" node dist/db/migrate.js; then
    log "migrations FAILED — skipping ETL this cycle"
    return 1
  fi
  log "starting ETL: $MODE"
  # Word splitting is intended: ETL_MODE may carry several arguments.
  # shellcheck disable=SC2086
  if ! "$HERE/with-secrets.sh" node dist/etl/load.js $MODE; then
    log "ETL FAILED — will retry at the next scheduled run"
    return 1
  fi
  log "ETL finished"
}

# Validate the schedule before entering the loop, so a typo fails the deploy
# immediately instead of looking healthy and never firing.
if ! node "$HERE/next-run-delay.mjs" "$AT" >/dev/null; then
  log "invalid ETL_AT: $AT"
  exit 2
fi

log "worker started — schedule ${AT} UTC, mode ${MODE}"

if [ "${ETL_RUN_ON_BOOT:-false}" = "true" ]; then
  log "ETL_RUN_ON_BOOT=true"
  run_once || true
fi

while true; do
  secs="$(node "$HERE/next-run-delay.mjs" "$AT")"
  log "sleeping ${secs}s until next run"
  sleep "$secs"
  run_once || true
done
