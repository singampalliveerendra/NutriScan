import { NutritionFacts, HealthRating } from '../types';

export interface RatingThresholds {
  sugar: { low: number; medium: number; high: number };
  sodium: { low: number; medium: number; high: number };
  saturatedFat: { low: number; medium: number; high: number };
  protein: { low: number; medium: number };
}

export const THRESHOLDS: RatingThresholds = {
  sugar: { low: 5, medium: 10, high: 15 },
  sodium: { low: 0.4, medium: 0.8, high: 1.2 },
  saturatedFat: { low: 2, medium: 4, high: 6 },
  protein: { low: 5, medium: 10 },
};

export function calculateHealthRating(nutrition: NutritionFacts): HealthRating {
  const { sugar, sodium, saturatedFat, protein } = nutrition;
  
  let avoidScore = 0;
  let moderateScore = 0;
  let healthyScore = 0;
  
  if (sugar > THRESHOLDS.sugar.high) {
    avoidScore += 2;
  } else if (sugar > THRESHOLDS.sugar.medium) {
    moderateScore += 1;
  } else {
    healthyScore += 1;
  }
  
  if (sodium > THRESHOLDS.sodium.high * 1000) {
    avoidScore += 2;
  } else if (sodium > THRESHOLDS.sodium.medium * 1000) {
    moderateScore += 1;
  } else {
    healthyScore += 1;
  }
  
  if (saturatedFat > THRESHOLDS.saturatedFat.high) {
    avoidScore += 2;
  } else if (saturatedFat > THRESHOLDS.saturatedFat.medium) {
    moderateScore += 1;
  } else {
    healthyScore += 1;
  }
  
  if (protein >= THRESHOLDS.protein.medium && sugar <= THRESHOLDS.sugar.medium) {
    healthyScore += 2;
  } else if (protein >= THRESHOLDS.protein.low) {
    moderateScore += 1;
  }
  
  if (avoidScore >= 2) {
    return 'avoid';
  }
  
  if (avoidScore >= 1 || moderateScore >= 2) {
    return 'moderate';
  }
  
  return 'healthy';
}

export function generateAIExplanation(
  nutrition: NutritionFacts,
  rating: HealthRating
): string {
  const issues: string[] = [];
  const positives: string[] = [];
  
  if (nutrition.sugar > THRESHOLDS.sugar.medium) {
    issues.push(`high sugar content (${nutrition.sugar.toFixed(1)}g per 100g)`);
  } else if (nutrition.sugar <= THRESHOLDS.sugar.low) {
    positives.push('low sugar content');
  }
  
  if (nutrition.sodium > THRESHOLDS.sodium.medium * 1000) {
    issues.push(`very high sodium (${(nutrition.sodium / 1000).toFixed(2)}g per 100g)`);
  } else if (nutrition.sodium > THRESHOLDS.sodium.low * 1000) {
    issues.push(`moderate sodium content`);
  } else {
    positives.push('low sodium');
  }
  
  if (nutrition.saturatedFat > THRESHOLDS.saturatedFat.medium) {
    issues.push(`high saturated fat (${nutrition.saturatedFat.toFixed(1)}g per 100g)`);
  } else if (nutrition.saturatedFat <= THRESHOLDS.saturatedFat.low) {
    positives.push('low saturated fat');
  }
  
  if (nutrition.protein >= THRESHOLDS.protein.medium) {
    positives.push('good protein source');
  }
  
  if (nutrition.fiber && nutrition.fiber >= 5) {
    positives.push('good fiber content');
  }
  
  switch (rating) {
    case 'healthy':
      if (positives.length > 0) {
        return `This product is a healthy choice! ${positives.join(', ')}. Great for maintaining a balanced diet.`;
      }
      return 'This product is considered healthy. It has balanced nutritional values suitable for regular consumption.';
    case 'moderate':
      if (issues.length > 0) {
        return `This product has moderate nutritional value. Considerations: ${issues.join(', ')}. ${positives.length > 0 ? `Positives: ${positives.join(', ')}.` : ''} Enjoy in moderation as part of a balanced diet.`;
      }
      return 'This product has moderate nutritional values. It can be consumed in moderation as part of a varied diet.';
    case 'avoid':
      if (issues.length > 0) {
        return `This product is rated to avoid. Main concerns: ${issues.join(', ')}. ${positives.length > 0 ? `However, it does have some positives: ${positives.join(', ')}.` : ''} Consider healthier alternatives when possible for better nutrition.`;
      }
      return 'This product is not recommended for regular consumption due to its nutritional profile.';
    default:
      return 'Unable to generate nutrition analysis.';
  }
}

export function formatNutritionValue(value: number, unit: string = 'g'): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}kg`;
  }
  return `${value.toFixed(1)}${unit}`;
}

export function getRatingLabel(rating: HealthRating): string {
  switch (rating) {
    case 'healthy':
      return 'Healthy';
    case 'moderate':
      return 'Moderate';
    case 'avoid':
      return 'Avoid';
    default:
      return 'Unknown';
  }
}

export function getRatingColor(rating: HealthRating): string {
  switch (rating) {
    case 'healthy':
      return '#22C55E';
    case 'moderate':
      return '#F59E0B';
    case 'avoid':
      return '#EF4444';
    default:
      return '#64748B';
  }
}