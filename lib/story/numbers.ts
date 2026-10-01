/** Grouped thousands ("1,210") or plain digits, an optional decimal part, optional £/$ and %. */
const NUMBER_TOKEN = /[£$]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?%?/g;

/** Every numeric token in the text, sorted, so two texts can be compared as multisets. */
export function extractNumberTokens(text: string): string[] {
  return (text.match(NUMBER_TOKEN) ?? []).sort();
}

/**
 * The AI-polish number lock: the rewrite must contain exactly the same numbers as the original —
 * none changed, dropped or added (see PLAN.md: the LLM only phrases, it never computes).
 */
export function sameNumbers(original: string, rewrite: string): boolean {
  const a = extractNumberTokens(original);
  const b = extractNumberTokens(rewrite);
  return a.length === b.length && a.every((token, i) => token === b[i]);
}
