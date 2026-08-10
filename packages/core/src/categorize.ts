const RULES: { pattern: RegExp; categoryId: string }[] = [
  { pattern: /tesco|sainsbury|aldi|lidl|asda|waitrose|morrison/i, categoryId: 'groceries' },
  { pattern: /netflix|spotify|disney|prime\s+video|youtube|icloud/i, categoryId: 'subscriptions' },
  { pattern: /\buber\b|\btfl\b|trainline|bus|rail|\bshell\b|bp\s/i, categoryId: 'transport' },
  { pattern: /pharmacy|boots|nhs|dentist|gym/i,                  categoryId: 'health' },
  { pattern: /pret|greggs|mcdonald|nando|deliveroo|just\s?eat|restaurant|cafe|coffee/i, categoryId: 'eating_out' },
  { pattern: /amazon|asos|zara|h&m|apple\s+store|argos/i,        categoryId: 'shopping' },
  { pattern: /cinema|odeon|vue|steam|playstation|xbox/i,         categoryId: 'fun' },
];

export function categorize(description: string): string {
  for (const rule of RULES) {
    if (rule.pattern.test(description)) return rule.categoryId;
  }
  return 'uncategorised';
}
