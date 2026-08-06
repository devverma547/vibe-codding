const MAX_PROJECTED_SCORE = 98;
const MAX_RECOMMENDED_GAIN = 20;

export function clampScore(value) {
  const number = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

export function extractImpactPoints(impact) {
  if (typeof impact === 'number') return Math.max(0, impact);
  if (typeof impact !== 'string') return 0;
  const match = impact.match(/(\d+(?:\.\d+)?)/);
  return match ? Math.max(0, Number.parseFloat(match[1])) : 0;
}

export function calculateProjectedScore(currentScore, actionPlan = [], aiProjectedScore) {
  const current = clampScore(currentScore);
  const scoreCeiling = Math.min(100, MAX_PROJECTED_SCORE);
  const remainingRoom = Math.max(0, scoreCeiling - current);
  if (remainingRoom === 0 || actionPlan.length === 0) return current;

  const estimatedImpact = actionPlan.reduce((sum, item) => sum + extractImpactPoints(item?.impact), 0);
  const fallbackImpact = estimatedImpact > 0 ? estimatedImpact : Math.min(8, remainingRoom);
  const aiNumber = typeof aiProjectedScore === 'string' ? Number.parseFloat(aiProjectedScore) : aiProjectedScore;
  const aiImpact = Number.isFinite(aiNumber)
    ? Math.max(0, aiNumber - current)
    : 0;

  const projectedGain = Math.min(
    Math.max(fallbackImpact, aiImpact),
    MAX_RECOMMENDED_GAIN,
    remainingRoom
  );

  return clampScore(current + projectedGain);
}

export function normalizeActionPlanImpacts(actionPlan = [], currentScore, projectedScore) {
  const current = clampScore(currentScore);
  const projected = clampScore(projectedScore);
  const availableGain = Math.max(0, projected - current);
  const numericItems = actionPlan.filter((item) => extractImpactPoints(item?.impact) > 0);
  const totalRawImpact = numericItems.reduce((sum, item) => sum + extractImpactPoints(item.impact), 0);

  if (numericItems.length === 0 || totalRawImpact === 0) {
    return actionPlan.map((item) => ({ ...item }));
  }

  let allocated = 0;
  let numericIndex = 0;

  return actionPlan.map((item) => {
    const rawImpact = extractImpactPoints(item?.impact);
    if (rawImpact === 0) return { ...item };

    numericIndex += 1;
    const isLastNumeric = numericIndex === numericItems.length;
    const remaining = Math.max(0, availableGain - allocated);
    const scaled = totalRawImpact > availableGain
      ? Math.round(rawImpact * (availableGain / totalRawImpact))
      : Math.round(rawImpact);
    const points = isLastNumeric ? remaining : Math.min(remaining, Math.max(0, scaled));
    allocated += points;

    return {
      ...item,
      impact: points > 0 ? `Est. +${points} pts` : 'Included in estimate',
    };
  });
}
