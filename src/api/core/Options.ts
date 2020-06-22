import { Credentials } from "aws-sdk";
import { ConnectionOptions } from "typeorm-plus";

/**
 * NiceCommander constructor options
 */
export interface Options {
  /** AWS Credentials */
  awsCredentials?: Credentials;

  /** AWS CloudWatch Log Log Group Name */
  awsCloudWatchLogsLogGroupName: string;

  /** AWS Region */
  awsRegion: string;

  /**
   * Path to directory that contains all tasks. This path must be absolute
   */
  taskDefinitionsDirectory: string;

  /**
   * Only read task definitions from database. Do not create new task task definitions
   * from task files.
   */
  readonlyMode?: boolean;

  /**
   * How to treat Unhandled Promise Rejection errors globally? Each task definition can override this value by providing
   * the `unhandledRejections` option in the task definition level.
   *
   * @see https://nodejs.org/api/cli.html#cli_unhandled_rejections_mode
   * @default "strict"
   */
  unhandledRejections?: "strict" | "warn" | "none";

  /**
   * At what path this middleware is mounted?
   * This is used to make URLs of static assets used in UI
   */
  mountPath: string;

  /**
   * Print task logs to stdout.
   *
   * This is useful for allowing your log ingesting system ot pick up your task logs.
   *
   * @default false
   */
  logToStdout?: boolean;

  /**
   * SQL connection configuration
   */
  sqlConnectionOptions: ConnectionOptions;

  /**
   * Redis connection configuration
   */
  redisConnectionOptions: {
    host: string;
    port: number;
    /**
     * Use the config method to set `'notify-keyspace-events'` to `'Ex'`
     * This configuration is useful for subscribing to key expired events
     * which Nice Commander rely on for scheduling tasks. If you set this
     * value to false, you need to configure your Redis instance to have
     * `notify-keyspace-events` set to `Ex`
     * @default true
     */
    setNotifyKeyspaceEvents?: boolean;
  };

  /**
   * Get user information from a request object.
   *
   * Defaults to reading name from `req.user.name` and email from `req.user.email`
   *
   * @param req Express request object
   */
  getUser?(req: Express.Request): Promise<{ name?: string; email?: string }>;
}
