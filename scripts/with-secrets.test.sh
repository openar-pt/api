#!/bin/sh
# Tests scripts/with-secrets.sh guard behaviour without network or credentials.
# Run: sh scripts/with-secrets.test.sh
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
WRAPPER="$HERE/with-secrets.sh"
FAILURES=0

pass() { printf '  ok   %s\n' "$1"; }
fail() { printf '  FAIL %s\n' "$1"; FAILURES=$((FAILURES + 1)); }

# A fake `infisical` that records it was called, so we can assert it was NOT.
FAKEBIN="$(mktemp -d)"
cat > "$FAKEBIN/infisical" <<'FAKE'
#!/bin/sh
echo "CALLED $*" >> "$FAKE_MARKER"
# `login ... --plain` must emit a token on stdout
if [ "$1" = "login" ]; then echo "fake-token-value"; exit 0; fi
# `run --env=X -- cmd...` should exec the command after the `--`
if [ "$1" = "run" ]; then
  shift
  while [ "$#" -gt 0 ]; do
    if [ "$1" = "--" ]; then shift; exec "$@"; fi
    shift
  done
fi
exit 0
FAKE
chmod +x "$FAKEBIN/infisical"

# Tests must never pick up the developer's real .env.infisical, so every case
# points INFISICAL_ENV_FILE somewhere explicit. Default: a path that must not exist.
run_wrapper() {
  FAKE_MARKER="$FAKEBIN/marker"
  export FAKE_MARKER
  rm -f "$FAKE_MARKER"
  INFISICAL_ENV_FILE="${INFISICAL_ENV_FILE:-$FAKEBIN/no-such-env-file}" \
  PATH="$FAKEBIN:$PATH" sh "$WRAPPER" "$@" 2>"$FAKEBIN/stderr" >"$FAKEBIN/stdout"
}

echo "with-secrets.sh"

# 1. Missing client id -> exit non-zero, names the variable, child never runs
( unset INFISICAL_CLIENT_ID || true
  export INFISICAL_CLIENT_SECRET=shh
  run_wrapper echo should-not-run
  status=$?
  [ "$status" -ne 0 ] || { fail "missing client id should exit non-zero"; exit 1; }
  grep -q "INFISICAL_CLIENT_ID" "$FAKEBIN/stderr" \
    || { fail "stderr should name INFISICAL_CLIENT_ID"; exit 1; }
  [ ! -f "$FAKEBIN/marker" ] || { fail "infisical must not be invoked"; exit 1; }
  grep -q "should-not-run" "$FAKEBIN/stdout" && { fail "child must not run"; exit 1; }
  exit 0
) && pass "missing INFISICAL_CLIENT_ID aborts before running anything" \
  || fail "missing INFISICAL_CLIENT_ID"

# 2. Missing client secret -> same, names the other variable
( export INFISICAL_CLIENT_ID=abc
  unset INFISICAL_CLIENT_SECRET || true
  run_wrapper echo should-not-run
  status=$?
  [ "$status" -ne 0 ] || { fail "missing secret should exit non-zero"; exit 1; }
  grep -q "INFISICAL_CLIENT_SECRET" "$FAKEBIN/stderr" \
    || { fail "stderr should name INFISICAL_CLIENT_SECRET"; exit 1; }
  exit 0
) && pass "missing INFISICAL_CLIENT_SECRET aborts before running anything" \
  || fail "missing INFISICAL_CLIENT_SECRET"

# 3. Empty-string credentials are treated as missing
( export INFISICAL_CLIENT_ID=""
  export INFISICAL_CLIENT_SECRET=shh
  run_wrapper echo should-not-run
  [ "$?" -ne 0 ] || { fail "empty client id should exit non-zero"; exit 1; }
  exit 0
) && pass "empty INFISICAL_CLIENT_ID is treated as missing" \
  || fail "empty INFISICAL_CLIENT_ID"

# 4. With both set, the child command runs and its output reaches stdout
( export INFISICAL_CLIENT_ID=abc
  export INFISICAL_CLIENT_SECRET=shh
  run_wrapper echo hello-from-child
  grep -q "hello-from-child" "$FAKEBIN/stdout" \
    || { fail "child stdout should pass through"; exit 1; }
  exit 0
) && pass "runs the child command when credentials are present" \
  || fail "child command execution"

# 5. Child's exit code propagates
( export INFISICAL_CLIENT_ID=abc
  export INFISICAL_CLIENT_SECRET=shh
  run_wrapper sh -c "exit 42"
  [ "$?" -eq 42 ] || { fail "expected exit 42, got $?"; exit 1; }
  exit 0
) && pass "propagates the child exit code" || fail "exit code propagation"

# 6. Credentials supplied only by .env.infisical are picked up
( cat > "$FAKEBIN/envfile" <<'ENVF'
# a comment, and a blank line follow

INFISICAL_CLIENT_ID=from-file-id
INFISICAL_CLIENT_SECRET=from-file-secret
INFISICAL_ENV=dev
ENVF
  unset INFISICAL_CLIENT_ID INFISICAL_CLIENT_SECRET INFISICAL_ENV || true
  INFISICAL_ENV_FILE="$FAKEBIN/envfile" run_wrapper echo sourced-ok
  grep -q "sourced-ok" "$FAKEBIN/stdout" \
    || { fail "child should run using file credentials"; exit 1; }
  grep -q "\-\-env=dev" "$FAKEBIN/marker" \
    || { fail "should use INFISICAL_ENV=dev from the file"; exit 1; }
  exit 0
) && pass "sources credentials from .env.infisical when present" \
  || fail "sourcing .env.infisical"

# 7. A real environment variable beats the file's value
( cat > "$FAKEBIN/envfile" <<'ENVF'
INFISICAL_CLIENT_ID=from-file-id
INFISICAL_CLIENT_SECRET=from-file-secret
INFISICAL_ENV=dev
ENVF
  export INFISICAL_ENV=prod
  INFISICAL_ENV_FILE="$FAKEBIN/envfile" run_wrapper echo precedence
  grep -q "\-\-env=prod" "$FAKEBIN/marker" \
    || { fail "real INFISICAL_ENV=prod should beat the file's dev"; exit 1; }
  exit 0
) && pass "real environment variables take precedence over the file" \
  || fail "environment precedence"

# 8. Quoted values in the file are unquoted
( cat > "$FAKEBIN/envfile" <<'ENVF'
INFISICAL_CLIENT_ID="quoted-id"
INFISICAL_CLIENT_SECRET='single-quoted'
INFISICAL_ENV="prod"
ENVF
  unset INFISICAL_CLIENT_ID INFISICAL_CLIENT_SECRET INFISICAL_ENV || true
  INFISICAL_ENV_FILE="$FAKEBIN/envfile" run_wrapper echo quoted
  grep -q '\-\-env=prod' "$FAKEBIN/marker" \
    || { fail "quotes should be stripped from file values"; exit 1; }
  grep -q '"' "$FAKEBIN/marker" && { fail "no raw quotes should survive"; exit 1; }
  exit 0
) && pass "strips surrounding quotes from file values" || fail "quoted values"

rm -rf "$FAKEBIN"
[ "$FAILURES" -eq 0 ] || { printf '\n%s test(s) failed\n' "$FAILURES"; exit 1; }
printf '\nall tests passed\n'
