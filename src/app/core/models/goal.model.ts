export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO 8601
  color: string;
  icon: string; // emoji
  createdAt: string;
  contributions: GoalContribution[];
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
