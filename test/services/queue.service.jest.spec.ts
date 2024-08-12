import fs from 'fs';
import * as SUT from "../../src/services/queue.service";
import { ServiceBusMessage } from '@azure/service-bus';

import logger from "../../src/logger";

const mockSendMessages = jest.fn();
const mockSenderClose = jest.fn();
const mockClientClose = jest.fn();

jest.mock('@azure/service-bus', () => {
  class ServiceBusSender {

    queueName: string;

    constructor(queueName: string) {
      this.queueName = queueName
    }

    sendMessages = mockSendMessages;
    close = mockSenderClose;
  }

  class ServiceBusClient {
    connectionString: string;
    
    constructor(connectionString: string) {
      this.connectionString = connectionString
    }

    createSender(queueName: string) {
      return new ServiceBusSender(queueName)
    }

    close = mockClientClose;

  }

  return {
    ServiceBusClient,
    ServiceBusSender
  }
});

describe('addToReportQueue - case management', () => {

  const message: ServiceBusMessage = {
    body: {
     data: 'some-data'
    },
    sessionId: 'some-correlation-id',
    subject: 'some-label'
  };

  let mockLoggerInfo;
  let mockLoggerError;

  beforeEach(() => {
    mockLoggerInfo = jest.spyOn(logger, 'info');
    mockLoggerError = jest.spyOn(logger, 'error');
  });

  afterEach(() => {
    mockSenderClose.mockRestore();
    mockSendMessages.mockRestore();
    mockClientClose.mockRestore();

    mockLoggerInfo.mockRestore();
    mockLoggerError.mockRestore();
  });

  it('should add message to queue', async () => {
    await SUT.addToReportQueue('GBR-23423-234234-23444', message, 'connection-string', 'report-queue', true);

    expect(mockSendMessages).toHaveBeenCalledWith(message);
    expect(mockSendMessages).toHaveBeenCalledTimes(1);
    expect(mockSenderClose).toHaveBeenCalled();
    expect(mockClientClose).toHaveBeenCalled();

    expect(mockLoggerInfo).toHaveBeenCalledTimes(3);
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, '[AZURE-SERVICE-BUS][ADD-TO-REPORT-QUEUE][report-queue][DOCUMENT-NUMBER][GBR-23423-234234-23444][CORRELATION-ID][some-correlation-id][ENABLED:true]');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, '[AZURE-SERVICE-BUS][QUEUE-MESSAGE][report-queue][DOCUMENT-NUMBER][GBR-23423-234234-23444][CORRELATION-ID][some-correlation-id]');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(3, `[AZURE-SERVICE-BUS][PUSHED-TO-QUEUE][report-queue][DOCUMENT-NUMBER][GBR-23423-234234-23444][CORRELATION-ID][some-correlation-id][SUCCESS][${JSON.stringify(message)}]`);
  });

  it('should log an error if messages to add to queue', async () => {
    mockSendMessages.mockRejectedValue(new Error('failed to add message to queue'));

    await SUT.addToReportQueue('GBR-23423-234234-23444', message, 'connection-string', 'report-queue', true);

    expect(mockSendMessages).toHaveBeenCalled();
    expect(mockSenderClose).not.toHaveBeenCalled();
    expect(mockClientClose).toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalled();
  });

  it('should log a simple error if messages to add to queue', async () => {
    mockSendMessages.mockRejectedValue('failed to add message to queue');

    await SUT.addToReportQueue('GBR-23423-234234-23444', message, 'connection-string', 'report-queue', true);

    expect(mockSendMessages).toHaveBeenCalled();
    expect(mockSenderClose).not.toHaveBeenCalled();
    expect(mockClientClose).toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledWith('[AZURE-SERVICE-BUS][PUSH-TO-QUEUE][ERROR][report-queue][DOCUMENT-NUMBER][GBR-23423-234234-23444][CORRELATION-ID][some-correlation-id][failed to add message to queue]');
  });


  it('should not add message to if queue url is not defined', async () => {
    await SUT.addToReportQueue('GBR-23423-234234-23444', message, undefined, 'report-queue', true);

    expect(mockSendMessages).not.toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledWith('[AZURE-SERVICE-BUS][QUEUE-MESSAGE][FAILED][report-queue][DOCUMENT-NUMBER][GBR-23423-234234-23444][CORRELATION-ID][some-correlation-id][arguments missing :  connectionString ]');
  });

  it('should not add message to if queue name is not defined', async () => {
    await SUT.addToReportQueue('GBR-23423-234234-23444', message, 'connection-string', undefined, true);

    expect(mockSendMessages).not.toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledWith('[AZURE-SERVICE-BUS][QUEUE-MESSAGE][FAILED][undefined][DOCUMENT-NUMBER][GBR-23423-234234-23444][CORRELATION-ID][some-correlation-id][arguments missing :  queueName ]');
  });

  it('should not add message to if message is not defined', async () => {
    await SUT.addToReportQueue('GBR-23423-234234-23444', undefined, 'connection-string', 'report-queue', true);

    expect(mockSendMessages).not.toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledWith('[AZURE-SERVICE-BUS][QUEUE-MESSAGE][FAILED][report-queue][DOCUMENT-NUMBER][GBR-23423-234234-23444][CORRELATION-ID][undefined][arguments missing :  message ]');
  });


});

describe('addToReportQueue - defra trade', () => {

  const message: ServiceBusMessage = {
    body: {
     data: 'some-data'
    },
    messageId: 'some-message-id',
    correlationId: 'some-correlation-id',
    contentType: 'application/json',
    applicationProperties: {
      user: 'user-properties'
    },
    subject: 'some-label'
  };

  let mockLoggerInfo;
  let mockLoggerError;

  beforeEach(() => {
    mockLoggerInfo = jest.spyOn(logger, 'info');
    mockLoggerError = jest.spyOn(logger, 'error');
  });

  afterEach(() => {
    mockSendMessages.mockRestore();
    mockSenderClose.mockRestore();
    mockClientClose.mockRestore();

    mockLoggerInfo.mockRestore();
    mockLoggerError.mockRestore();
  });

  it('should add message to queue', async () => {
    await SUT.addToReportQueue('GBR-23423-234234-23444', message, 'connection-string', 'report-queue', true);

    expect(mockSendMessages).toHaveBeenCalledWith(message);
    expect(mockSendMessages).toHaveBeenCalledTimes(1);
    expect(mockSenderClose).toHaveBeenCalled();
    expect(mockClientClose).toHaveBeenCalled();

    expect(mockLoggerInfo).toHaveBeenCalledTimes(3);
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, '[AZURE-SERVICE-BUS][ADD-TO-REPORT-QUEUE][report-queue][DOCUMENT-NUMBER][GBR-23423-234234-23444][CORRELATION-ID][some-correlation-id][ENABLED:true]');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, '[AZURE-SERVICE-BUS][QUEUE-MESSAGE][report-queue][DOCUMENT-NUMBER][GBR-23423-234234-23444][CORRELATION-ID][some-correlation-id]');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(3, `[AZURE-SERVICE-BUS][PUSHED-TO-QUEUE][report-queue][DOCUMENT-NUMBER][GBR-23423-234234-23444][CORRELATION-ID][some-correlation-id][SUCCESS][${JSON.stringify(message)}]`);
  });

  it('should log an error if messages to add to queue', async () => {
    mockSendMessages.mockRejectedValue(new Error('failed to add message to queue'));

    await SUT.addToReportQueue('GBR-23423-234234-23444', message, 'connection-string', 'report-queue', true);

    expect(mockSendMessages).toHaveBeenCalled();
    expect(mockSenderClose).not.toHaveBeenCalled();
    expect(mockClientClose).toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalled();
  });

  it('should not add message to if queue url is not defined', async () => {
    await SUT.addToReportQueue('GBR-23423-234234-23444', message, undefined, 'report-queue', true);

    expect(mockSendMessages).not.toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledWith('[AZURE-SERVICE-BUS][QUEUE-MESSAGE][FAILED][report-queue][DOCUMENT-NUMBER][GBR-23423-234234-23444][CORRELATION-ID][some-correlation-id][arguments missing :  connectionString ]');
  });

  it('should not add message to if queue name is not defined', async () => {
    await SUT.addToReportQueue('GBR-23423-234234-23444', message, 'connection-string', undefined, true);

    expect(mockSendMessages).not.toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledWith('[AZURE-SERVICE-BUS][QUEUE-MESSAGE][FAILED][undefined][DOCUMENT-NUMBER][GBR-23423-234234-23444][CORRELATION-ID][some-correlation-id][arguments missing :  queueName ]');
  });

  it('should not add message to if message is not defined', async () => {
    await SUT.addToReportQueue('GBR-23423-234234-23444', undefined, 'connection-string', 'report-queue', true);

    expect(mockSendMessages).not.toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledWith('[AZURE-SERVICE-BUS][QUEUE-MESSAGE][FAILED][report-queue][DOCUMENT-NUMBER][GBR-23423-234234-23444][CORRELATION-ID][undefined][arguments missing :  message ]');
  });


});

describe('addToReportQueue - localhost / case management', () => {

  const message: ServiceBusMessage = {
    body: {
     data: 'some-data'
    },
    sessionId: 'some-correlation-id',
    subject: 'some-label'
  };

  let mockExistsSync;
  let mockMkdir;
  let mockWriteFileSync;
  let mockLoggerInfo;
  let mockLoggerError;

  beforeEach(() => {
    mockExistsSync = jest.spyOn(fs, 'existsSync');
    mockMkdir = jest.spyOn(fs, 'mkdirSync');

    mockWriteFileSync = jest.spyOn(fs, 'writeFileSync');
    mockWriteFileSync.mockReturnValue(null);

    mockLoggerInfo = jest.spyOn(logger, 'info');
    mockLoggerError = jest.spyOn(logger, 'error');
  });

  afterEach(() => {
    mockExistsSync.mockRestore();
    mockMkdir.mockRestore();

    mockWriteFileSync.mockRestore();

    mockLoggerInfo.mockRestore();
    mockLoggerError.mockRestore();
  });

  it('should create a `service_bus` directory if one does not exists when `enableReportToQueue` is disabled', async () => {
    mockMkdir.mockReturnValue(null);
    mockExistsSync.mockReturnValue(false);

    await SUT.addToReportQueue('GBR-23423-234234-23444', message, 'connection-string', 'report-queue', false);

    expect(mockMkdir).toHaveBeenCalled();
    expect(mockMkdir).toHaveBeenCalledTimes(2);
    expect(mockLoggerInfo).toHaveBeenCalledTimes(2);
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, '[AZURE-SERVICE-BUS][ADD-TO-REPORT-QUEUE][report-queue][DOCUMENT-NUMBER][GBR-23423-234234-23444][CORRELATION-ID][some-correlation-id][ENABLED:false]');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, '[AZURE-SERVICE-BUS][ADD-TO-REPORT-LOCAL-FILESYSTEM][report-queue/some-correlation-id.json]');
  });

  it('should create a `report-queue` sub directory if one does not exists when `enableReportToQueue` is disabled', async () => {
    mockMkdir.mockReturnValue(null);
    mockExistsSync.mockReturnValueOnce(true);
    mockExistsSync.mockReturnValue(false);

    await SUT.addToReportQueue('GBR-23423-234234-23444', message, 'connection-string', 'report-queue', false);

    expect(mockMkdir).toHaveBeenCalledTimes(1);
    expect(mockLoggerInfo).toHaveBeenCalledTimes(2);
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, '[AZURE-SERVICE-BUS][ADD-TO-REPORT-QUEUE][report-queue][DOCUMENT-NUMBER][GBR-23423-234234-23444][CORRELATION-ID][some-correlation-id][ENABLED:false]');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, '[AZURE-SERVICE-BUS][ADD-TO-REPORT-LOCAL-FILESYSTEM][report-queue/some-correlation-id.json]');
  });

  it('should log an error if one found when creating a `service_bus` directory when `enableReportToQueue` is disabled', async () => {
    const error = new Error('mkdir error');

    mockExistsSync.mockReturnValue(false);
    mockMkdir.mockImplementation(() => {
      throw error;
    });

    await SUT.addToReportQueue('GBR-23423-234234-23444', message, 'connection-string', 'report-queue', false);

    expect(mockLoggerError).toHaveBeenCalledWith(`[AZURE-SERVICE-BUS][ADD-TO-REPORT-LOCAL-FILESYSTEM][MAKE-DIRECTORY][ERROR-MAKE-DIRECTORY][${error}]`);
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  it('should not attempt to create a directory if a `service_bus` directory already exists when `enableReportToQueue` is disabled', async () => {
    mockExistsSync.mockReturnValue(true);

    await SUT.addToReportQueue('GBR-23423-234234-23444', message, 'connection-string', 'report-queue', false);

    expect(mockMkdir).not.toHaveBeenCalled();
  });

  it('should log messages to local file when `enableReportToQueue` is disabled', async () => {
    mockExistsSync.mockReturnValue(true);

    await SUT.addToReportQueue('GBR-23423-234234-23444', message, 'connection-string', 'report-queue', false);

    expect(mockWriteFileSync).toHaveBeenCalled();
    expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
    expect(mockLoggerInfo).toHaveBeenCalledTimes(2);
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, '[AZURE-SERVICE-BUS][ADD-TO-REPORT-QUEUE][report-queue][DOCUMENT-NUMBER][GBR-23423-234234-23444][CORRELATION-ID][some-correlation-id][ENABLED:false]');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, '[AZURE-SERVICE-BUS][ADD-TO-REPORT-LOCAL-FILESYSTEM][report-queue/some-correlation-id.json]');
  });

  it('should log retrospective landing messages to local file when `enableReportToQueue` is disabled', async () => {
    mockExistsSync.mockReturnValue(true);

    await SUT.addToReportQueue('GBR-23423-234234-23444', message, 'connection-string', 'report-queue', false);

    expect(mockWriteFileSync).toHaveBeenCalled();
    expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
    expect(mockLoggerInfo).toHaveBeenCalledTimes(2);
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, '[AZURE-SERVICE-BUS][ADD-TO-REPORT-QUEUE][report-queue][DOCUMENT-NUMBER][GBR-23423-234234-23444][CORRELATION-ID][some-correlation-id][ENABLED:false]');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, '[AZURE-SERVICE-BUS][ADD-TO-REPORT-LOCAL-FILESYSTEM][report-queue/some-correlation-id.json]');
  });
});

describe('addToReportQueue - localhost / defra trade', () => {

  const message: ServiceBusMessage = {
    body: {
     data: 'some-data'
    },
    messageId: 'some-message-id',
    correlationId: 'some-correlation-id',
    contentType: 'application/json',
    applicationProperties: {
      user: 'user-properties'
    },
    subject: 'some-label'
  };

  let mockExistsSync;
  let mockMkdir;
  let mockWriteFileSync;
  let mockLoggerInfo;
  let mockLoggerError;

  beforeEach(() => {
    mockExistsSync = jest.spyOn(fs, 'existsSync');
    mockMkdir = jest.spyOn(fs, 'mkdirSync');

    mockWriteFileSync = jest.spyOn(fs, 'writeFileSync');
    mockWriteFileSync.mockReturnValue(null);

    mockLoggerInfo = jest.spyOn(logger, 'info');
    mockLoggerError = jest.spyOn(logger, 'error');
  });

  afterEach(() => {
    mockExistsSync.mockRestore();
    mockMkdir.mockRestore();

    mockWriteFileSync.mockRestore();

    mockLoggerInfo.mockRestore();
    mockLoggerError.mockRestore();
  });

  it('should create a `service_bus` directory if one does not exists when `enableReportToQueue` is disabled', async () => {
    mockMkdir.mockReturnValue(null);
    mockExistsSync.mockReturnValue(false);

    await SUT.addToReportQueue('GBR-23423-234234-23444', message, 'connection-string', 'report-queue', false);

    expect(mockMkdir).toHaveBeenCalled();
    expect(mockMkdir).toHaveBeenCalledTimes(2);
    expect(mockLoggerInfo).toHaveBeenCalledTimes(2);
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, '[AZURE-SERVICE-BUS][ADD-TO-REPORT-QUEUE][report-queue][DOCUMENT-NUMBER][GBR-23423-234234-23444][CORRELATION-ID][some-correlation-id][ENABLED:false]');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, '[AZURE-SERVICE-BUS][ADD-TO-REPORT-LOCAL-FILESYSTEM][report-queue/some-correlation-id.json]');
  });

  it('should create a `report-queue` sub directory if one does not exists when `enableReportToQueue` is disabled', async () => {
    mockMkdir.mockReturnValue(null);
    mockExistsSync.mockReturnValueOnce(true);
    mockExistsSync.mockReturnValue(false);

    await SUT.addToReportQueue('GBR-23423-234234-23444', message, 'connection-string', 'report-queue', false);

    expect(mockMkdir).toHaveBeenCalledTimes(1);
    expect(mockLoggerInfo).toHaveBeenCalledTimes(2);
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, '[AZURE-SERVICE-BUS][ADD-TO-REPORT-QUEUE][report-queue][DOCUMENT-NUMBER][GBR-23423-234234-23444][CORRELATION-ID][some-correlation-id][ENABLED:false]');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, '[AZURE-SERVICE-BUS][ADD-TO-REPORT-LOCAL-FILESYSTEM][report-queue/some-correlation-id.json]');
  });

  it('should log an error if one found when creating a `service_bus` directory when `enableReportToQueue` is disabled', async () => {
    const error = new Error('mkdir error');

    mockExistsSync.mockReturnValue(false);
    mockMkdir.mockImplementation(() => {
      throw error;
    });

    await SUT.addToReportQueue('GBR-23423-234234-23444', message, 'connection-string', 'report-queue', false);

    expect(mockLoggerError).toHaveBeenCalledWith(`[AZURE-SERVICE-BUS][ADD-TO-REPORT-LOCAL-FILESYSTEM][MAKE-DIRECTORY][ERROR-MAKE-DIRECTORY][${error}]`);
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  it('should not attempt to create a directory if a `service_bus` directory already exists when `enableReportToQueue` is disabled', async () => {
    mockExistsSync.mockReturnValue(true);

    await SUT.addToReportQueue('GBR-23423-234234-23444', message, 'connection-string', 'report-queue', false);

    expect(mockMkdir).not.toHaveBeenCalled();
  });

  it('should log messages to local file when `enableReportToQueue` is disabled', async () => {
    mockExistsSync.mockReturnValue(true);

    await SUT.addToReportQueue('GBR-23423-234234-23444', message, 'connection-string', 'report-queue', false);

    expect(mockWriteFileSync).toHaveBeenCalled();
    expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
    expect(mockLoggerInfo).toHaveBeenCalledTimes(2);
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, '[AZURE-SERVICE-BUS][ADD-TO-REPORT-QUEUE][report-queue][DOCUMENT-NUMBER][GBR-23423-234234-23444][CORRELATION-ID][some-correlation-id][ENABLED:false]');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, '[AZURE-SERVICE-BUS][ADD-TO-REPORT-LOCAL-FILESYSTEM][report-queue/some-correlation-id.json]');
  });

  it('should log retrospective landing messages to local file when `enableReportToQueue` is disabled', async () => {
    mockExistsSync.mockReturnValue(true);

    await SUT.addToReportQueue('GBR-23423-234234-23444', message, 'connection-string', 'report-queue', false);

    expect(mockWriteFileSync).toHaveBeenCalled();
    expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
    expect(mockLoggerInfo).toHaveBeenCalledTimes(2);
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, '[AZURE-SERVICE-BUS][ADD-TO-REPORT-QUEUE][report-queue][DOCUMENT-NUMBER][GBR-23423-234234-23444][CORRELATION-ID][some-correlation-id][ENABLED:false]');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, '[AZURE-SERVICE-BUS][ADD-TO-REPORT-LOCAL-FILESYSTEM][report-queue/some-correlation-id.json]');
  });
});
