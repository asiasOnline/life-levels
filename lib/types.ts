/* #region Stat Types */
export type StatType = 
  | 'health'
  | 'gold'
  | 'xp'
  | 'energy'
  | 'streak';

export type StatDisplayMode = 
  | 'progress'
  | 'numeric'
  | 'none';

export interface StatData {
  type: StatType;
  label: string;
  value: number;
  maxValue?: number; 
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  displayMode?: StatDisplayMode;
}
/* #endregion Stat Types */

