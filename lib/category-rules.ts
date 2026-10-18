export const RULE_MATCHES = ["contains", "starts_with", "equals"] as const;

export type RuleMatch = (typeof RULE_MATCHES)[number];

export const RULE_MATCH_LABELS: Record<RuleMatch, string> = {
  contains: "contains",
  starts_with: "starts with",
  equals: "is exactly",
};

export const RULE_MATCH_OPTIONS = RULE_MATCHES.map((value) => ({
  value,
  label: RULE_MATCH_LABELS[value],
}));

export type CategoryRule = {
  pattern: string;
  match: RuleMatch;
  categoryId: string;
  priority: number;
};

const normalize = (value: string) => value.trim().toLowerCase();

const MATCHERS: Record<RuleMatch, (payee: string, pattern: string) => boolean> =
  {
    contains: (payee, pattern) => payee.includes(pattern),
    starts_with: (payee, pattern) => payee.startsWith(pattern),
    equals: (payee, pattern) => payee === pattern,
  };

export function matchesRule(
  payee: string,
  rule: Pick<CategoryRule, "pattern" | "match">
) {
  const pattern = normalize(rule.pattern);

  if (pattern.length === 0) return false;

  return MATCHERS[rule.match](normalize(payee), pattern);
}

const byPrecedence = (a: CategoryRule, b: CategoryRule) =>
  b.priority - a.priority || b.pattern.length - a.pattern.length;

export function rankRules<T extends CategoryRule>(rules: T[]): T[] {
  return [...rules].sort(byPrecedence);
}

export function categorize(payee: string, rules: CategoryRule[]) {
  return (
    rankRules(rules).find((rule) => matchesRule(payee, rule))?.categoryId ??
    null
  );
}

export function applyCategoryRules<
  T extends { payee: string; categoryId?: string | null },
>(rows: T[], rules: CategoryRule[]): T[] {
  if (rules.length === 0) return rows;

  const ranked = rankRules(rules);

  return rows.map((row) => {
    if (row.categoryId) return row;

    const match = ranked.find((rule) => matchesRule(row.payee, rule));

    return match ? { ...row, categoryId: match.categoryId } : row;
  });
}
