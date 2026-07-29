#!/bin/sh
# Run a command with secrets from Infisical injected as environment variables.
#
#   ./scripts/with-secrets.sh node dist/index.js
#
# Requires INFISICAL_CLIENT_ID and INFISICAL_CLIENT_SECRET (Universal Auth
# machine identity). INFISICAL_ENV selects the environment, default "dev".
set -eu

# Load local bootstrap credentials, if the file exists. Values already present
# in the environment win, so CI and production — where the file is absent — are
# unaffected. Deliberately not `set -a; . file`, which would do the opposite.
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${INFISICAL_ENV_FILE:-$REPO_ROOT/.env.infisical}"
if [ -f "$ENV_FILE" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in ''|'#'*) continue ;; esac   # blanks and comments
    case "$line" in *=*) ;; *) continue ;; esac # must be KEY=VALUE
    key="${line%%=*}"
    case "$key" in ''|*[!A-Za-z0-9_]*) continue ;; esac  # valid shell names only
    val="${line#*=}"
    case "$val" in                              # strip one layer of quoting
      \"*\") val="${val#\"}"; val="${val%\"}" ;;
      \'*\') val="${val#\'}"; val="${val%\'}" ;;
    esac
    # `key` is validated above, so this eval only ever expands a safe name.
    if [ -z "$(eval printf %s "\"\${$key:-}\"")" ]; then
      export "$key=$val"
    fi
  done < "$ENV_FILE"
fi

# Not secret, committed on purpose; overridable for staging instances.
PROJECT_ID="${INFISICAL_PROJECT_ID:-00000000-0000-0000-0000-000000000000}"
INFISICAL_DOMAIN="${INFISICAL_DOMAIN:-https://infisical.example.com}"
export INFISICAL_DOMAIN

: "${INFISICAL_CLIENT_ID:?is not set — see README section 'Segredos'}"
: "${INFISICAL_CLIENT_SECRET:?is not set — see README section 'Segredos'}"

# Quieter and more deterministic in containers and CI.
INFISICAL_DISABLE_UPDATE_CHECK=true
export INFISICAL_DISABLE_UPDATE_CHECK

INFISICAL_TOKEN="$(infisical login \
  --method=universal-auth \
  --client-id="$INFISICAL_CLIENT_ID" \
  --client-secret="$INFISICAL_CLIENT_SECRET" \
  --silent --plain)"
export INFISICAL_TOKEN

# exec so signals and the exit code pass straight through to the child —
# required for the container CMD and for `tsx watch`.
exec infisical run \
  --projectId="$PROJECT_ID" \
  --env="${INFISICAL_ENV:-dev}" \
  -- "$@"
