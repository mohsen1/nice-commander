import { Readable } from "stream";
import debug from "debug";
import { CloudWatchLogs, Credentials } from "aws-sdk";
import _ from "lodash";
import { OutputLogEvent } from "aws-sdk/clients/cloudwatchlogs";
import os from "os";

type EventSterilizer = (event: OutputLogEvent) => string;

interface CloudWatchLogsReadableStreamOptions {
  eventSerializer?: EventSterilizer;
  awsRegion: string;
  credentials?: Credentials;
  logGroupName: string;
  logStreamName: string;
}

export default class CloudWatchLogsReadableStream extends Readable {
  private static DEFAULT_EVENT_SERIALIZER = (event: OutputLogEvent) =>
    `[${new Date(event.timestamp ?? 0).toISOString()}] ${event.message}${
      os.EOL
    }`;
  private readonly debug = debug("nice-commander:CloudWatchLogsReadableStream");
  private readonly logGroupName!: string;
  private readonly logStreamName!: string;
  private readonly eventSerializer!: EventSterilizer;
  private readonly cloudWatchLogs!: CloudWatchLogs;
  private sequenceToken: string | undefined = undefined;

  constructor({
    eventSerializer,
    awsRegion,
    credentials,
    logGroupName,
    logStreamName,
  }: CloudWatchLogsReadableStreamOptions) {
    super();

    this.logGroupName = logGroupName || this.logGroupName;
    this.logStreamName = logStreamName;
    this.cloudWatchLogs = new CloudWatchLogs({
      region: awsRegion,
      credentials,
    });
    this.eventSerializer =
      eventSerializer || CloudWatchLogsReadableStream.DEFAULT_EVENT_SERIALIZER;
  }

  async getNewEvents() {
    try {
      const { logGroupName, logStreamName, sequenceToken } = this;

      const stream = await this.cloudWatchLogs
        .getLogEvents({
          logGroupName,
          logStreamName,
          nextToken: sequenceToken,
          startFromHead: sequenceToken === undefined,
        })
        .promise();

      stream.events
        ?.map((event) => this.eventSerializer(event))
        .forEach((s) => this.push(s));

      if (
        this.sequenceToken !== undefined &&
        stream.nextForwardToken === this.sequenceToken
      ) {
        this.push(null);
        this.emit("close");
      } else {
        this.sequenceToken = stream.nextForwardToken;
        this.getNewEvents();
      }
    } catch (err) {
      this.emit("error", err);
    }
  }

  _read() {
    this.getNewEvents();
  }
}
