import { LandingSources } from '../types/landing';
import { ICcQueryResult } from '../types/query';

export const DEMINIMUS_IN_KG = 50;

export const isWithinDeminimus = (
    isSpeciesExists: boolean,
    weightOnCert: number,
    deminimus: number
) : boolean => !isSpeciesExists && weightOnCert <= deminimus;

export const isElog = (func: (isSpeciesExists: boolean, weightOnCert: number, deminimus: number) => boolean) => ({ source, isSpeciesExists, weightOnCert } : ICcQueryResult) =>
  (source === LandingSources.ELog) ? func(isSpeciesExists, weightOnCert, DEMINIMUS_IN_KG) : false;