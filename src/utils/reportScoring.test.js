import {
  calculateProjectedScore,
  extractImpactPoints,
  normalizeActionPlanImpacts,
  formatAiFixPrompt,
} from './reportScoring';

describe('report scoring helpers', () => {
  it('caps projected scores by the 98 point display ceiling', () => {
    const actionPlan = [
      { impact: '+20 pts' },
      { impact: '+5 pts' },
      { impact: '+5 pts' },
    ];

    expect(calculateProjectedScore(84, actionPlan)).toBe(98);
  });

  it('does not allow AI projected scores to exceed the display ceiling', () => {
    expect(calculateProjectedScore(95, [{ impact: '+20 pts' }], 120)).toBe(98);
  });

  it('rescales visible recommendation impacts to match the projected gain', () => {
    const normalized = normalizeActionPlanImpacts(
      [{ impact: '+20 pts' }, { impact: '+5 pts' }, { impact: 'Ongoing' }],
      84,
      98
    );

    expect(normalized.map((item) => item.impact)).toEqual([
      'Est. +11 pts',
      'Est. +3 pts',
      'Ongoing',
    ]);
  });

  it('extracts points from estimated impact labels', () => {
    expect(extractImpactPoints('Est. +8 pts')).toBe(8);
    expect(extractImpactPoints('Ongoing')).toBe(0);
  });

  it('generates fix prompts containing deployment instructions and fallback warning', () => {
    const prompt = formatAiFixPrompt('my-app.netlify.app', 'Fix Contrast', 'Low contrast on buttons');
    expect(prompt).toContain('my-app.netlify.app');
    expect(prompt).toContain('Fix Contrast');
    expect(prompt).toContain('Deployment & CI/CD:');
    expect(prompt).toContain('DEPLOYMENT REQUIRED');
  });
});
