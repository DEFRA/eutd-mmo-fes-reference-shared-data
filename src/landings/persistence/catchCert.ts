import { DocumentStatuses } from "../types";

export const getCertificateByDocumentNumberWithNumberOfFailedAttemptsQuery = (documentNumber: string): any[] => {
  return [
    {
      $match: {
        documentNumber: documentNumber,
        status: { $in: [DocumentStatuses.Draft, DocumentStatuses.Pending, DocumentStatuses.Complete, DocumentStatuses.Void] }
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
          audit: '$audit' ,
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
}