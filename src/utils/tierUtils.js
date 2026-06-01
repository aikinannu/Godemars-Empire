export const tierLevels = {
  basic: 1,
  standard: 2,
  premium: 3,
};

export const normalizeTier = (tier) => {
  if (!tier || typeof tier !== "string") return "basic";
  const normalized = tier.toLowerCase();
  if (normalized === "standard" || normalized === "premium") return normalized;
  return "basic";
};

export const hasTierAccess = (userTier, requiredTier) => {
  const current = tierLevels[normalizeTier(userTier)];
  const required = tierLevels[normalizeTier(requiredTier)];
  return current >= required;
};

export const formatTierLabel = (tier) => {
  const normalized = normalizeTier(tier);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};
