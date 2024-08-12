module.exports = {
    mockLandingData: [
        {
            "C20515,2019-08-15":
            {
                "cfr": "NLD200202641",
                "rssNumber": "C20514",
                "vesselRegistrationNumber": "H1100",
                "vesselName": "Wiron 5",
                "fishingAuthority": "GBE",
                "landings": [
                    {
                        "logbookNumber": "A1165920190477",
                        "landingDateTime": "2018-02-03T13:30:00",
                        "landingPort": "NLSCE",
                        "landingAreas": [
                            {
                                "faoArea": 27,
                                "faoSubArea": "4",
                                "landingAreaCatches": [
                                    {
                                        "species": "HER",
                                        "presentation": "BMS",
                                        "state": "FRO",
                                        "weight": 142
                                    },
                                    {
                                        "species": "HER",
                                        "presentation": "WHL",
                                        "state": "FRO",
                                        "weight": 124406
                                    }
                                ]
                            },
                            {
                                "faoArea": 27,
                                "faoSubArea": "7",
                                "landingAreaCatches": [
                                    {
                                        "species": "BRB",
                                        "presentation": "WHL",
                                        "state": "FRO",
                                        "weight": 10007
                                    },
                                    {
                                        "species": "HOM",
                                        "presentation": "WHL",
                                        "state": "FRO",
                                        "weight": 40070
                                    },
                                    {
                                        "species": "HOM",
                                        "presentation": "BMS",
                                        "state": "FRO",
                                        "weight": 173
                                    },
                                    {
                                        "species": "HOM",
                                        "presentation": "WHL",
                                        "state": "FRO",
                                        "weight": 149119
                                    },
                                    {
                                        "species": "HOM",
                                        "presentation": "WHL",
                                        "state": "FRO",
                                        "weight": 43270
                                    },
                                    {
                                        "species": "HOM",
                                        "presentation": "BMS",
                                        "state": "FRO",
                                        "weight": 193
                                    },
                                    {
                                        "species": "HOM",
                                        "presentation": "WHL",
                                        "state": "FRO",
                                        "weight": 213833
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "dateTimeStamp": "2019-08-14T12:14:24.793"
            }
        }
    ],
    mockCatchActivitiesData: { "_embedded": { "fishingTrips": [{ "fishingTripId": { "euTripId": "GBR-TRP-SDS-29597" }, "fishingActivityReports": [{ "purpose": "ORIGINAL", "type": "DECLARATION", "creation": "2020-06-08T17:41:57.227Z", "fishingActivities": [{ "type": "DEPARTURE", "occurrence": "2020-06-08T00:00:00.000Z", "relatedFLUXLocations": [{ "type": "LOCATION", "countryId": "GBR", "scheme": "LOCATION", "id": "GBWEY", "_mmoId": "7dbc0050-a095-4d5e-b5b8-69ec4a7a021b" }], "vesselActivityCode": "FIS" }], "specifiedFishingTrip": { "_mmoId": "5ede77c4df06ae99848f46c2", "euTripId": "GBR-TRP-SDS-29597" }, "specifiedVesselTransportMeans": { "ids": { "cfr": "GBR000C20403" }, "name": "MARAUDER", "registrationVesselCountry": "GBR", "specifiedContactParties": [{ "contactPerson": { "givenName": "-", "familyName": "MR G NOBLE" }, "address": { "blockName": "WYKE REGIS", "streetName": "162 PORTLAND ROAD", "cityName": "WEYMOUTH", "countryId": "GBR", "countrySubDivisionName": "DORSET", "postalArea": "DT4 9AD" }, "role": "MASTER", "_mmoId": "8994f1b0-7aca-4dcc-86ef-3f7ee824cd5b" }], "_mmoId": "d9f872b0-3407-43f4-9625-5ea4eb995108" }, "valid": true, "acceptance": "2020-06-08T17:41:57.62", "owner": { "id": "GBR", "name": "United Kingdom" }, "source": "FAS", "_id": "f96a15ac-2469-4e1e-8e32-87e51354e25c" }, { "purpose": "ORIGINAL", "type": "DECLARATION", "creation": "2020-06-08T17:41:57.227Z", "fishingActivities": [{ "type": "FISHING_OPERATION", "occurrence": "2020-06-08T00:00:00.000Z", "relatedFLUXLocations": [{ "type": "AREA", "scheme": "STAT_RECTANGLE", "id": "29E7", "subRectangle": "7" }], "specifiedFishingGears": [{ "type": "FPO", "roleCodes": ["DEPLOYED"], "applicableGearCharacteristics": [{ "type": "GN", "dataType": "QUANTITY", "unit": "C62", "value": "40", "_mmoId": "total-number-of-pots-hauled-during-trip" }], "_mmoId": "017b6806-1e00-48bb-993e-6a955baae81b|43561ffc-c211-49e8-9d92-6f229952f36d" }], "vesselActivityCode": "FIS", "relatedFishingActivities": [{ "type": "GEAR_SHOT", "relatedFLUXLocations": [{ "type": "AREA", "scheme": "STAT_RECTANGLE", "id": "29E7", "subRectangle": "7" }], "specifiedFishingGears": [{ "type": "FPO", "roleCodes": ["DEPLOYED"], "applicableGearCharacteristics": [{ "type": "GN", "dataType": "QUANTITY", "unit": "C62", "value": "500", "_mmoId": "total-number-of-pots-set-end-of-trip" }] }] }], "specifiedCatches": [{ "species": { "code": "CRE", "_mmoId": "8b10bb25-8e45-46e4-85c6-e4c9ab8e4b54" }, "weightInKg": 20, "catchType": "ONBOARD", "specifiedSizeDistribution": "LSC" }, { "species": { "code": "LBE", "_mmoId": "1236af56-7a82-43c7-8540-fd005dcfff07" }, "weightInKg": 9, "catchType": "ONBOARD", "specifiedSizeDistribution": "LSC" }] }, { "type": "FISHING_OPERATION", "occurrence": "2020-06-08T00:00:00.000Z", "relatedFLUXLocations": [{ "type": "AREA", "scheme": "STAT_RECTANGLE", "id": "29E7", "subRectangle": "7" }], "specifiedFishingGears": [{ "type": "LX", "roleCodes": ["DEPLOYED"], "applicableGearCharacteristics": [{ "type": "GN", "dataType": "QUANTITY", "unit": "C62", "value": "6", "_mmoId": "total-number-of-hooks-hauled-during-trip" }], "_mmoId": "807322a6-011c-4ffb-a663-d983938c4d91|892af86b-fce4-442d-bbf8-7f4e65a7e4cb" }], "vesselActivityCode": "FIS", "relatedFishingActivities": [{ "type": "GEAR_SHOT", "relatedFLUXLocations": [{ "type": "AREA", "scheme": "STAT_RECTANGLE", "id": "29E7", "subRectangle": "7" }], "specifiedFishingGears": [{ "type": "LX", "roleCodes": ["DEPLOYED"], "applicableGearCharacteristics": [{ "type": "GN", "dataType": "QUANTITY", "unit": "C62", "value": "0", "_mmoId": "total-number-of-hooks-set-end-of-trip" }] }] }], "specifiedCatches": [{ "species": { "code": "BSS", "_mmoId": "884ef59c-8cc1-48d1-b451-74009ad094b3" }, "weightInKg": 78, "catchType": "ONBOARD", "specifiedSizeDistribution": "LSC" }] }], "specifiedFishingTrip": { "euTripId": "GBR-TRP-SDS-29597" }, "specifiedVesselTransportMeans": { "ids": { "cfr": "GBR000C20403" }, "name": "MARAUDER", "registrationVesselCountry": "GBR", "specifiedContactParties": [{ "contactPerson": { "givenName": "-", "familyName": "MR G NOBLE" }, "address": { "blockName": "WYKE REGIS", "streetName": "162 PORTLAND ROAD", "cityName": "WEYMOUTH", "countryId": "GBR", "countrySubDivisionName": "DORSET", "postalArea": "DT4 9AD" }, "role": "MASTER", "_mmoId": "8994f1b0-7aca-4dcc-86ef-3f7ee824cd5b" }], "_mmoId": "d9f872b0-3407-43f4-9625-5ea4eb995108" }, "valid": true, "acceptance": "2020-06-08T17:41:57.688", "owner": { "id": "GBR", "name": "United Kingdom" }, "source": "FAS", "_id": "b1b3f786-afb6-46f9-8dba-ebd922a6dbf0" }, { "purpose": "ORIGINAL", "type": "DECLARATION", "creation": "2020-06-08T17:41:57.227Z", "fishingActivities": [{ "type": "ARRIVAL", "occurrence": "2020-06-08T00:00:00.000Z", "relatedFLUXLocations": [{ "type": "LOCATION", "countryId": "GBR", "scheme": "LOCATION", "id": "GBWEY", "_mmoId": "7dbc0050-a095-4d5e-b5b8-69ec4a7a021b" }], "vesselActivityCode": "FIS", "specifiedCatches": [{ "species": { "code": "CRE", "_mmoId": "8b10bb25-8e45-46e4-85c6-e4c9ab8e4b54" }, "weightInKg": 20, "catchType": "KEPT_IN_NET", "specifiedSizeDistribution": "LSC" }] }], "specifiedFishingTrip": { "euTripId": "GBR-TRP-SDS-29597" }, "specifiedVesselTransportMeans": { "ids": { "cfr": "GBR000C20403" }, "name": "MARAUDER", "registrationVesselCountry": "GBR", "specifiedContactParties": [{ "contactPerson": { "givenName": "-", "familyName": "MR G NOBLE" }, "address": { "blockName": "WYKE REGIS", "streetName": "162 PORTLAND ROAD", "cityName": "WEYMOUTH", "countryId": "GBR", "countrySubDivisionName": "DORSET", "postalArea": "DT4 9AD" }, "role": "MASTER", "_mmoId": "8994f1b0-7aca-4dcc-86ef-3f7ee824cd5b" }], "_mmoId": "d9f872b0-3407-43f4-9625-5ea4eb995108" }, "valid": true, "acceptance": "2020-06-08T17:41:57.688", "owner": { "id": "GBR", "name": "United Kingdom" }, "source": "FAS", "_id": "f2bb26e6-204b-4d84-9d58-c115eb4e0b2f" }], "_links": { "self": { "href": "http://sds-fa-service.sds.svc.cluster.local/v1/fishingTrips/GBR-TRP-SDS-29597" }, "fishingTrips": { "href": "http://sds-fa-service.sds.svc.cluster.local/v1/fishingTrips/GBR-TRP-SDS-29597" } } }] }, "_links": { "self": { "href": "http://sds-fa-service.sds.svc.cluster.local/v1/fishingTrips{?cfr,euTripId,mmoTripId,userId,vesselId,fishingActivityType,occurrenceDateTimeFrom,occurrenceDateTimeTo,type,mmoId,purpose,includeInvalid,source,ownerId}", "templated": true } }, "page": { "size": 20, "totalElements": 1, "totalPages": 1, "number": 0 } },
    mockSalesNotes: {
        "execution": {
            "executionID": "ceeec118-6ce9-447e-aed5-def99d6386ee",
            "dateTime": "2019-09-10T12:45:16.166Z",
            "method": "GET",
            "service": "EEC Sales Notes",
            "user": "ECCtest",
            "url": "/DEFRA/v1/ECC/SalesNotes"
        },
        "vesselRegistrationNumber": "PZ476",
        "fishingAuthority": "GBE",
        "rssNumber": "A21802",
        "cfr": "GBR000A21802",
        "vesselName": "LISA JACQUELINE STEVENSON",
        "salesNoteLines": [
            {
                "saleDate": "2018-02-01T00:00:00Z",
                "salePort": "GBNYL",
                "landingDate": "2018-02-01T00:00:00Z",
                "landingPort": "GBNYL",
                "catches": [
                    {
                        "species": "ANF",
                        "presentation": "TAL",
                        "state": "FRE",
                        "weight": 91
                    },
                    {
                        "species": "ANF",
                        "presentation": "TAL",
                        "state": "FRE",
                        "weight": 13
                    },
                    {
                        "species": "ANF",
                        "presentation": "TAL",
                        "state": "FRE",
                        "weight": 24
                    },
                    {
                        "species": "ANF",
                        "presentation": "TAL",
                        "state": "FRE",
                        "weight": 13
                    },
                    {
                        "species": "ANF",
                        "presentation": "TAL",
                        "state": "FRE",
                        "weight": 94
                    },
                    {
                        "species": "ANF",
                        "presentation": "TAL",
                        "state": "FRE",
                        "weight": 50
                    },
                    {
                        "species": "ANF",
                        "presentation": "TAL",
                        "state": "FRE",
                        "weight": 7
                    },
                    {
                        "species": "ANF",
                        "presentation": "TAL",
                        "state": "FRE",
                        "weight": 13
                    },
                    {
                        "species": "ANF",
                        "presentation": "TAL",
                        "state": "FRE",
                        "weight": 101
                    },
                    {
                        "species": "ANF",
                        "presentation": "TAL",
                        "state": "FRE",
                        "weight": 185
                    },
                    {
                        "species": "BIB",
                        "presentation": "WHL",
                        "state": "FRE",
                        "weight": 26
                    },
                    {
                        "species": "BLL",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 2
                    },
                    {
                        "species": "BLL",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 14
                    },
                    {
                        "species": "BLL",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 13
                    },
                    {
                        "species": "COD",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 28
                    },
                    {
                        "species": "COD",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 20
                    },
                    {
                        "species": "COE",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 32
                    },
                    {
                        "species": "COE",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 18
                    },
                    {
                        "species": "CTL",
                        "presentation": "WHL",
                        "state": "FRE",
                        "weight": 150
                    },
                    {
                        "species": "GUX",
                        "presentation": "WHL",
                        "state": "FRE",
                        "weight": 12
                    },
                    {
                        "species": "GUX",
                        "presentation": "WHL",
                        "state": "FRE",
                        "weight": 63
                    },
                    {
                        "species": "GUX",
                        "presentation": "WHL",
                        "state": "FRE",
                        "weight": 7
                    },
                    {
                        "species": "HAD",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 15
                    },
                    {
                        "species": "HAD",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 16
                    },
                    {
                        "species": "HAD",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 7
                    },
                    {
                        "species": "HKE",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 3
                    },
                    {
                        "species": "HKE",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 9
                    },
                    {
                        "species": "HKE",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 3
                    },
                    {
                        "species": "HKE",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 6
                    },
                    {
                        "species": "HKE",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 6
                    },
                    {
                        "species": "HKE",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 16
                    },
                    {
                        "species": "JOD",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 6
                    },
                    {
                        "species": "JOD",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 23
                    },
                    {
                        "species": "JOD",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 6
                    },
                    {
                        "species": "JOD",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 22
                    },
                    {
                        "species": "LEM",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 10
                    },
                    {
                        "species": "LEM",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 51
                    },
                    {
                        "species": "LEM",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 36
                    },
                    {
                        "species": "LEM",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 32
                    },
                    {
                        "species": "LEM",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 14
                    },
                    {
                        "species": "LEZ",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 102
                    },
                    {
                        "species": "LEZ",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 19
                    },
                    {
                        "species": "LEZ",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 62
                    },
                    {
                        "species": "LEZ",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 100
                    },
                    {
                        "species": "LEZ",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 230
                    },
                    {
                        "species": "LEZ",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 187
                    },
                    {
                        "species": "LEZ",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 100
                    },
                    {
                        "species": "LEZ",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 61
                    },
                    {
                        "species": "LEZ",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 38
                    },
                    {
                        "species": "LEZ",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 100
                    },
                    {
                        "species": "LEZ",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 208
                    },
                    {
                        "species": "LIN",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 20
                    },
                    {
                        "species": "MUR",
                        "presentation": "WHL",
                        "state": "FRE",
                        "weight": 5
                    },
                    {
                        "species": "MUR",
                        "presentation": "WHL",
                        "state": "FRE",
                        "weight": 2
                    },
                    {
                        "species": "OCT",
                        "presentation": "WHL",
                        "state": "FRE",
                        "weight": 115
                    },
                    {
                        "species": "PLE",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 4
                    },
                    {
                        "species": "PLE",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 10
                    },
                    {
                        "species": "PLE",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 17
                    },
                    {
                        "species": "PLE",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 2
                    },
                    {
                        "species": "PLE",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 3
                    },
                    {
                        "species": "PLE",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 9
                    },
                    {
                        "species": "PLE",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 13
                    },
                    {
                        "species": "POL",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 8
                    },
                    {
                        "species": "RJF",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 10
                    },
                    {
                        "species": "RJF",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 36
                    },
                    {
                        "species": "RJM",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 26
                    },
                    {
                        "species": "RJN",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 129
                    },
                    {
                        "species": "RJN",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 66
                    },
                    {
                        "species": "SCE",
                        "presentation": "WHL",
                        "state": "FRE",
                        "weight": 10
                    },
                    {
                        "species": "SCE",
                        "presentation": "WHL",
                        "state": "FRE",
                        "weight": 20
                    },
                    {
                        "species": "SMD",
                        "presentation": "WHL",
                        "state": "FRE",
                        "weight": 32
                    },
                    {
                        "species": "SMD",
                        "presentation": "WHL",
                        "state": "FRE",
                        "weight": 13
                    },
                    {
                        "species": "SOL",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 3
                    },
                    {
                        "species": "SOL",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 12
                    },
                    {
                        "species": "SOL",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 30
                    },
                    {
                        "species": "SOL",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 25
                    },
                    {
                        "species": "SOL",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 11
                    },
                    {
                        "species": "SOL",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 61
                    },
                    {
                        "species": "SOL",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 50
                    },
                    {
                        "species": "SOL",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 70
                    },
                    {
                        "species": "SOL",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 50
                    },
                    {
                        "species": "SOL",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 25
                    },
                    {
                        "species": "TUR",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 5
                    },
                    {
                        "species": "TUR",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 24
                    },
                    {
                        "species": "TUR",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 4
                    },
                    {
                        "species": "TUR",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 9
                    },
                    {
                        "species": "TUR",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 20
                    },
                    {
                        "species": "WHG",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 1
                    },
                    {
                        "species": "WIT",
                        "presentation": "GUT",
                        "state": "FRE",
                        "weight": 2
                    }
                ]
            }
        ],
        "dateTimeStamp": "2019-09-10T12:45:24.01Z"
    },
    mockELogsData: [
        {
            "$schema": "./FishingActivityEndpointSchema.json",
            "cfr": "NLD200202641",
            "rssNumber": "C20514",
            "vesselRegistrationNumber": "H1100",
            "vesselName": "Wiron 5",
            "fishingAuthority": "GBE",
            "activity": [
                {
                    "returnDate": "2018-02-03T13:30:00",
                    "returnPort": "NLSCE",
                    "logbookNumber": "C2051420180053",
                    "activityAreas": [
                        {
                            "faoArea": 27,
                            "faoSubArea": "4",
                            "activityAreaCatches": [
                                {
                                    "species": "HER",
                                    "presentation": "WHL",
                                    "state": "FRE",
                                    "weight": 124406
                                }
                            ]
                        },
                        {
                            "faoArea": 27,
                            "faoSubArea": "7",
                            "activityAreaCatches": [
                                {
                                    "species": "BRB",
                                    "presentation": "WHL",
                                    "state": "FRE",
                                    "weight": 10007
                                },
                                {
                                    "species": "COD",
                                    "presentation": "WHL",
                                    "state": "FRE",
                                    "weight": 173
                                }
                            ]
                        }
                    ]
                },
                {
                    "returnDate": "2018-02-03T19:30:00",
                    "returnPort": "NLSCE",
                    "logbookNumber": "C2051420180072",
                    "activityAreas": [
                        {
                            "faoArea": 27,
                            "faoSubArea": "4",
                            "activityAreaCatches": [
                                {
                                    "species": "HER",
                                    "presentation": "WHL",
                                    "state": "FRE",
                                    "weight": 124
                                }
                            ]
                        },
                        {
                            "faoArea": 27,
                            "faoSubArea": "7",
                            "activityAreaCatches": [
                                {
                                    "species": "BRB",
                                    "presentation": "WHL",
                                    "state": "FRE",
                                    "weight": 10027
                                },
                                {
                                    "species": "HOM",
                                    "presentation": "WHL",
                                    "state": "FRE",
                                    "weight": 40070
                                },
                                {
                                    "species": "COD",
                                    "presentation": "WHL",
                                    "state": "FRE",
                                    "weight": 1743
                                },
                                {
                                    "species": "HER",
                                    "presentation": "WHL",
                                    "state": "FRE",
                                    "weight": 149119
                                },
                                {
                                    "species": "ANF",
                                    "presentation": "WHL",
                                    "state": "FRE",
                                    "weight": 43270
                                },
                                {
                                    "species": "CRE",
                                    "presentation": "WHL",
                                    "state": "FRE",
                                    "weight": 193
                                },
                                {
                                    "species": "CLT",
                                    "presentation": "WHL",
                                    "state": "FRE",
                                    "weight": 213833
                                }
                            ]
                        }
                    ]
                }
            ],
            "dateTimeStamp": "2019-08-14T12:14:24.793"
        }
    ],
    mockFishingActivitiesData: [
      {
        "B15011,2019-12-30": {
          "cfr": "GBR000B15011",
          "rssNumber": "B15011",
          "vesselRegistrationNumber": "PE1044",
          "vesselName": "JESSICA LYNN",
          "fishingAuthority": "GBE",
          "activities": [
              {
                  "tripId": "GBR-TRP-SDS-3088",
                  "returnDate": "2019-12-30T00:00:00Z",
                  "returnPort": "GBPOO",
                  "activityAreas": [
                      {
                          "faoArea": 0,
                          "faoSubArea": "NA",
                          "activityAreaCatches": [
                              {
                                  "species": "CRE",
                                  "presentation": "WHL",
                                  "state": "FRE",
                                  "weight": 130
                              },
                              {
                                  "species": "LBE",
                                  "presentation": "WHL",
                                  "state": "FRE",
                                  "weight": 7
                              }
                          ]
                      }
                  ]
              }
          ]
        }
      }
    ]
};