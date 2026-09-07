/**
 * AI Gateway model config (see PLAN.md's deterministic/LLM split guardrail —
 * this model only ever phrases precomputed values, never computes its own).
 * Model IDs come and go; verify against `curl -s https://ai-gateway.vercel.sh/v1/models
 * | jq -r '[.data[] | select(.id | startswith("anthropic/")) | .id] | reverse | .[]'`
 * rather than trusting this from memory. Last verified 2026-09-07.
 * PLAN.md calls for the strongest available model pre-validation (quality over cost).
 */
export const CHAT_MODEL = "anthropic/claude-opus-5";
