export const isSpeciesFailure = (func: (riskScore: number) => boolean) => (
    enabled: boolean,
    isSpeciesExists: boolean,
    riskScore: number
  ): boolean => {
    if (isSpeciesExists) {
      return false;
    }
  
    if (enabled) {
      return func(riskScore);
    }
  
    return true;
  }
  