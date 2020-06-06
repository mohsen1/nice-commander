import { Writable } from "stream";
import debug from "debug";
import { CloudWatchLogs, Credentials } from "aws-sdk";
import _ from "lodash";
import { InputLogEvent } from "aws-sdk/clients/cloudwatchlogs";

interface CloudWatchLogStreamConstructorOptions {
  awsRegion: string;
  credentials?: Credentials;
  logGroupName?: string;
  logStreamName: string;
}

export default class CloudWatchLogStream extends Writable {
  private readonly debug = debug("nice-commander:CloudWatchLogStream");
  private logGroupName = "NiceCommander";
  private logStreamName!: string;
  private cloudWatchLogs!: CloudWatchLogs;
  private logStreamIsCreated = false;
  private logSubmitIsInFlight = false;
  private sequenceToken: string | undefined = undefined;
  private eventsBuffer: InputLogEvent[] = [];

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

    this.createLogStream().then(() => {
      this.logStreamIsCreated = true;
    });
  }

  private async createLogStream() {
    await this.cloudWatchLogs
      .createLogStream({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
      })
      .promise();
  }

  private submitLogs = _.throttle(async () => {
    if (!this.logStreamIsCreated) return;
    if (this.logSubmitIsInFlight) return;

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

  _write(chunk: Buffer) {
    this.eventsBuffer.push({
      message: String(chunk),
      timestamp: Date.now(),
    });
    this.submitLogs();
  }
}
