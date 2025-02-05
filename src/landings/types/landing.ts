export const enum LandingSources {
  LandingDeclaration  = 'LANDING_DECLARATION',
  CatchRecording      = 'CATCH_RECORDING',
  ELog                = 'ELOG'
}

export interface ILandingItem {
  species: string,
  weight: number,
  factor: number,
  state?: string,
  presentation?: string,
}

export interface ILanding {
  rssNumber: string,
  dateTimeLanded: string,
  dateTimeRetrieved?: string,
  source: string,
  items: ILandingItem[],
  _ignore?: boolean
}

export interface ILandingQuery {
  rssNumber: string,
  dateLanded: string,
  dataEverExpected?: boolean,
  landingDataExpectedDate?: string,
  landingDataEndDate?: string,
  createdAt?: string
}

//
// Aggregated per day
//
export interface ILandingAggregated {
  rssNumber: string,
  dateLanded: string,
  numberOfLandings: number,
  firstDateTimeRetrieved: string,
  lastDateTimeRetrieved: string,
  items: ILandingAggregatedItem[]
}

export interface ILandingAggregatedItem {
  species : string,
  weight: number,
  breakdown? : ILandingAggregatedItemBreakdown[]
}

export interface ILandingAggregatedItemBreakdown {
  presentation? : string
  state? : string
  source : string
  isEstimate: boolean
  factor: number
  weight: number
  liveWeight: number
}