export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO date
  color: string;
  icon: string;
  createdAt: string;
  contributions: { date: string; amount: number }[];
}

export interface HealthFactor {
  label: string;
  score: number;
  impact: 'high' | 'medium' | 'low';
  description: string;
}

export interface HealthScore {
  total: number;
  status: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  factors: HealthFactor[];
}

export interface GoalContribution {
  id: string;
  amount: number;
  date: string;
  transactionId?: string;
}

export interface GoalProjection {
  monthlyRequired: number;
  projectedDate: string;
  onTrack: boolean;
  progressPercent: number;
}
