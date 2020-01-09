import { ConnectionOptions } from "typeorm";

/**
 * NiceCommander constructor options
 */
export interface Options {
  /**
   * Path to directory that contains all tasks. This path must be absolute
   */
  taskDefinitionsDirectory: string;

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
   * S3 Bucket name to store log files
   *
   * @default "nice-commander"
   */
  s3BucketName?: string;

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
  };
}
