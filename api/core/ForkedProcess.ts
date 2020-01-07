import cp from "child_process";
import path from "path";
import AWS from "aws-sdk";
import { PassThrough } from "stream";

interface ForkedProcessOptions {
  /** S3 Object "file name" for logs to store */
  logKey: string;
  taskFilePath: string;
  payload?: object;
}

export default class ForkedProcess {
  private INVOKE_FILE = path.resolve(__dirname, "./invoke");
  private s3 = new AWS.S3({ apiVersion: "2006-03-01" });

  public child?: cp.ChildProcess;

  constructor(private options: ForkedProcessOptions) {}

  public start() {
    const passThrough = new PassThrough();
    const upload = this.s3.upload({
      Bucket: "nice-commander",
      Key: this.options.logKey,
      Body: passThrough,
      ContentType: "text/plain"
    });

    this.child = cp.fork(
      this.INVOKE_FILE,
      [this.options.taskFilePath, JSON.stringify(this.options.payload ?? {})],
      {
        stdio: "pipe"
      }
    );

    this.child.stdout?.pipe(passThrough);

    upload.send();
  }

  public stop() {
    if (!this.child?.killed) {
      this.child?.kill();
    }
  }
}
