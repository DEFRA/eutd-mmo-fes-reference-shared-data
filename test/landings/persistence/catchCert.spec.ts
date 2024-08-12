import { getCertificateByDocumentNumberWithNumberOfFailedAttemptsQuery } from '../../../src/landings/persistence/catchCert';

describe('when querying the exportCertificates collection for catch certs with failed number of submissions', () => {
  it('will return the correct query', () => {

    const expected = [
      {
        $match: {
          documentNumber: 'CC1',
          status: {
            $in: [
              'DRAFT',
              'PENDING',
              'COMPLETE',
              'VOID'
            ]
          }
        }
      },
      {
        $lookup: {
          from: 'failedonlinecertificates',
          localField: 'documentNumber',
          foreignField: 'documentNumber',
          as: 'failedOnlineCertificates'
        }
      },
      {
        $unwind: {
          path: '$failedOnlineCertificates',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: {
            documentNumber: '$documentNumber',
            status: '$status',
            createdAt: '$createdAt',
            createdBy: '$createdBy',
            createdByEmail: '$createdByEmail',
            documentUri: '$documentUri',
            audit: '$audit',
            investigation: '$investigation',
            exportData: '$exportData',
            requestByAdmin: '$requestByAdmin',
            userReference: '$userReference',
            clonedFrom: '$clonedFrom',
            landingsCloned: '$landingsCloned',
            parentDocumentVoid: '$parentDocumentVoid'
          },
          failedOnlineCertificates: { $addToSet: '$failedOnlineCertificates.createdAt' }
        }
      },
      {
        $project: {
          documentNumber: '$_id.documentNumber',
          status: '$_id.status',
          createdAt: '$_id.createdAt',
          createdBy: '$_id.createdBy',
          createdByEmail: '$_id.createdByEmail',
          documentUri: '$_id.documentUri',
          audit: '$_id.audit',
          investigation: '$_id.investigation',
          exportData: '$_id.exportData',
          requestByAdmin: '$_id.requestByAdmin',
          numberOfFailedAttempts: { $size: '$failedOnlineCertificates' },
          clonedFrom: '$_id.clonedFrom',
          landingsCloned: '$_id.landingsCloned',
          parentDocumentVoid: '$_id.parentDocumentVoid'
        }
      }
    ];

    expect(getCertificateByDocumentNumberWithNumberOfFailedAttemptsQuery('CC1')).toStrictEqual(expected);
  })
});