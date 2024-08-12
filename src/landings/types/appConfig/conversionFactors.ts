export type quotaStatuses = 'quota' | 'nonquota';

export interface IConversionFactor {
  species: string,
  state: string,
  presentation: string,
  toLiveWeightFactor: number,
  quotaStatus: quotaStatuses,
  riskScore: number
}