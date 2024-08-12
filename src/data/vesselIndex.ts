const _ = require('lodash');
import moment from 'moment';
import { getDevolvedAuthority } from './authorities';

export const generateIndex = (vessels: any) => {
   /*
   * index by pln
   * and map to DA
   *
   * if the admin port is not found in the mapping, then the da will silently fallback to 'England'
   *
   * returns a function mapping pln to licences
   *
   */
  const indexed =
  _(vessels)
    .sortBy('registrationNumber', 'fishingLicenceValidFrom')
    .groupBy('registrationNumber')
    .map( (items, pln) => ({
      pln,
      items: items.map( ({ homePort, flag, imo, adminPort, fishingLicenceNumber, fishingLicenceValidFrom, fishingLicenceValidTo, rssNumber, licenceHolderName, vesselLength }) => ({
        validFrom: moment(fishingLicenceValidFrom).format('YYYY-MM-DD'),
        validTo: moment(fishingLicenceValidTo).format('YYYY-MM-DD'),
        number: fishingLicenceNumber,
        rssNumber,
        da: getDevolvedAuthority(flag, adminPort),
        homePort,
        flag,
        imoNumber: imo,
        holder: licenceHolderName,
        vesselLength
      }))
    }))
    .reduce((acc, cur) => ({ ...acc, [cur.pln]: cur.items}), {})

  return (pln: string) => indexed[pln]

};

