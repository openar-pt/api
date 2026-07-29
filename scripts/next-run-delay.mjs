// Prints the whole seconds until the next occurrence of HH:MM UTC.
// Used by scripts/etl-worker.sh to sleep until the next scheduled run without
// drifting, however long the previous run took.
//
//   node scripts/next-run-delay.mjs 00:00
//
// NOW_ISO overrides "now" so the behaviour is testable.

const at = process.argv[2] ?? "00:00";
const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(at);
if (!m) {
  console.error(`invalid time "${at}" — expected HH:MM in 24h UTC`);
  process.exit(2);
}

const hh = Number(m[1]);
const mm = Number(m[2]);
const now = process.env.NOW_ISO ? new Date(process.env.NOW_ISO) : new Date();
if (Number.isNaN(now.getTime())) {
  console.error(`invalid NOW_ISO "${process.env.NOW_ISO}"`);
  process.exit(2);
}

const next = new Date(Date.UTC(
  now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hh, mm, 0, 0,
));
// Exactly on the mark counts as "now"; wait a full day rather than firing twice.
if (next <= now) next.setUTCDate(next.getUTCDate() + 1);

console.log(Math.ceil((next.getTime() - now.getTime()) / 1000));
