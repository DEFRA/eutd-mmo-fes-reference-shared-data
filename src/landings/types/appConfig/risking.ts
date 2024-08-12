export enum WEIGHT {
    VESSEL = 'vesselWeight',
    SPECIES = 'speciesWeight',
    EXPORTER = 'exporterWeight'
}

export interface VesselOfInterest {
    vesselName:         string,    
    pln:                string,
    homePort:           string,      
    da:                 string             
}

export interface IVesselOfInterest {
    registrationNumber: string,
    fishingVesselName:  string, 
    homePort:           string,         
    da:                 string              
}

export interface IWeighting {
    vesselWeight:       number,
    speciesWeight:      number,
    exporterWeight:     number, 
    threshold:          number
}

export interface ISpeciesRiskToggle {
    enabled:            boolean
}