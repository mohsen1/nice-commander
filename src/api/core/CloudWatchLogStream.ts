import { Writable } from "stream";
import debug from "debug";
import { CloudWatchLogs, Credentials } from "aws-sdk";
import _ from "lodash";
import { InputLogEvent } from "aws-sdk/clients/cloudwatchlogs";

interface CloudWatchLogStreamConstructorOptions {
  awsRegion: string;
  credentials?: Credentials;
  logGroupName: string;
  logStreamName: string;
}

export default class CloudWatchLogStream extends Writable {
  private readonly debug = debug("nice-commander:CloudWatchLogStream");
  private readonly logGroupName!: string;
  private readonly logStreamName!: string;
  private readonly cloudWatchLogs!: CloudWatchLogs;
  private readonly eventsBuffer: InputLogEvent[] = [];
  private logStreamIsCreated = false;
  private logSubmitIsInFlight = false;
  private sequenceToken: string | undefined = undefined;

  constructor({
    awsRegion,
    credentials,
    logGroupName,
    logStreamName,
  }: CloudWatchLogStreamConstructorOptions) {
    super();

    this.logGroupName = logGroupName || this.logGroupName;
    this.logStreamName = logStreamName;

    this.cloudWatchLogs = new CloudWatchLogs({
      region: awsRegion,
      credentials,
    });

    this.createLogStream();
  }

  private async createLogStream() {
    if (this.logStreamIsCreated) {
      return this.submitLogs();
    }

    await this.cloudWatchLogs
      .createLogStream({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
      })
      .promise();

    this.logStreamIsCreated = true;

    this.submitLogs();
  }

  private submitLogs = _.throttle(async () => {
    if (this.logSubmitIsInFlight) return;
    if (!this.eventsBuffer.length) return;

    try {
      this.logSubmitIsInFlight = true;

      // Drain the logs buffer
      const logEvents: InputLogEvent[] = [];
      while (this.eventsBuffer.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        logEvents.push(this.eventsBuffer.shift()!);
      }

      const data = await this.cloudWatchLogs
        .putLogEvents({
          sequenceToken: this.sequenceToken,
          logGroupName: this.logGroupName,
          logStreamName: this.logStreamName,
          logEvents,
        })
        .promise();

      this.sequenceToken = data?.nextSequenceToken;
    } catch (e) {
      this.debug("Error putting logs in CloudWatch Logs", e);
    } finally {
      this.logSubmitIsInFlight = false;

      if (this.eventsBuffer.length) {
        this.submitLogs();
      }
    }
  }, 1000);

  _write(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ) {
    this.eventsBuffer.push({
      message: String(chunk),
      timestamp: Date.now(),
    });
    this.submitLogs();
    callback(null);
  }
}
