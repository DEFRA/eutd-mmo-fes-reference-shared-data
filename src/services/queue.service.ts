import fs from 'fs';
import path from 'path';
import { ServiceBusClient, ServiceBusMessage, ServiceBusSender } from "@azure/service-bus";
import logger from '../logger';

export enum MessageLabel   {
  CATCH_CERTIFICATE_SUBMITTED = 'catch_certificate_submitted',
  CATCH_CERTIFICATE_VOIDED = 'catch_certificate_voided',
  NEW_LANDING = 'new-landing',
  EXCEEDED_LANDING = 'exceeded-landing',
  PROCESSING_STATEMENT_SUBMITTED = 'processing_statement_submitted',
  PROCESSING_STATEMENT_VOIDED = 'processing_statement_voided',
  STORAGE_DOCUMENT_SUBMITTED = 'storage_document_submitted',
  STORAGE_DOCUMENT_VOIDED = 'storage_document_voided'
}

export const addToReportQueue = async (documentNumber: string, message: ServiceBusMessage | undefined, queueUrl: string | undefined, queueName: string | undefined, enableReportToQueue: boolean) => {
  logger.info(`[AZURE-SERVICE-BUS][ADD-TO-REPORT-QUEUE][${queueName}][DOCUMENT-NUMBER][${documentNumber}][CORRELATION-ID][${message?.sessionId || message?.correlationId}][ENABLED:${enableReportToQueue}]`);

  if(!queueUrl || !queueName || !message) {
    let logMessage = `[AZURE-SERVICE-BUS][QUEUE-MESSAGE][FAILED][${queueName}][DOCUMENT-NUMBER][${documentNumber}][CORRELATION-ID][${message?.sessionId || message?.correlationId}][arguments missing : `;
    if(!queueUrl) logMessage += ' connectionString ';
    if(!queueName) logMessage += ' queueName ';
    if(!message) logMessage += ' message ';
    logMessage += ']';
    logger.error(logMessage);
  } else if (enableReportToQueue) {

          await callEnableReportToQueue(queueUrl,documentNumber, queueName, message);
  } else {
    const filePath = `${__dirname}/../../../service_bus/`;
    const subFolder = `${queueName.replace(/[.]/gi,'-')}`;
    const fileName = message.sessionId || message.correlationId;

    try {
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(path.join(`${__dirname}/../../../`, 'service_bus'));
      }

      if (!fs.existsSync(`${filePath}${subFolder}/`)) {
        fs.mkdirSync(path.join(`${__dirname}/../../../service_bus/`, `${subFolder}`));
      }

      fs.writeFileSync(`${filePath}${subFolder}/${fileName}.json` , JSON.stringify(message.body), 'utf-8');
    } catch (err) {
      logger.error(`[AZURE-SERVICE-BUS][ADD-TO-REPORT-LOCAL-FILESYSTEM][MAKE-DIRECTORY][ERROR-MAKE-DIRECTORY][${err}]`);
    }

    logger.info(`[AZURE-SERVICE-BUS][ADD-TO-REPORT-LOCAL-FILESYSTEM][${subFolder}/${fileName}.json]`);
  }
};
const callEnableReportToQueue = async (queueUrl: string,documentNumber:string, queueName: string, message: ServiceBusMessage) => {
  logger.info(`[AZURE-SERVICE-BUS][QUEUE-MESSAGE][${queueName}][DOCUMENT-NUMBER][${documentNumber}][CORRELATION-ID][${message.sessionId || message.correlationId}]`);

  const sbClient = new ServiceBusClient(queueUrl);
  const queueSender : ServiceBusSender = sbClient.createSender(queueName);

  try {
    await queueSender.sendMessages(message);
    await queueSender.close();
    logger.info(`[AZURE-SERVICE-BUS][PUSHED-TO-QUEUE][${queueName}][DOCUMENT-NUMBER][${documentNumber}][CORRELATION-ID][${message.sessionId || message.correlationId}][SUCCESS][${JSON.stringify(message)}]`);
  } catch (e) {
    logger.error(`[AZURE-SERVICE-BUS][PUSH-TO-QUEUE][ERROR][${queueName}][DOCUMENT-NUMBER][${documentNumber}][CORRELATION-ID][${message.sessionId || message.correlationId}][${e.stack ?? e}]`)
  } finally {
    await sbClient.close();
  }
}