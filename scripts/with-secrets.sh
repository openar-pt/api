#!/bin/sh
# Run a command with secrets from Infisical injected as environment variables.
#
#   ./scripts/with-secrets.sh node dist/index.js
#
# Requires INFISICAL_CLIENT_ID and INFISICAL_CLIENT_SECRET (Universal Auth
# machine identity). INFISICAL_ENV selects the environment, default "dev".
set -eu

# Not secret, committed on purpose; overridable for staging instances.
PROJECT_ID="${INFISICAL_PROJECT_ID:-__INFISICAL_PROJECT_ID__}"
INFISICAL_DOMAIN="${INFISICAL_DOMAIN:-__INFISICAL_DOMAIN__}"
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
