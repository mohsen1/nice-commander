import cp from "child_process";
import path from "path";

export default class ForkedProcess {
  private INVOKE_FILE = path.resolve(__dirname, "./invoke");
  private child?: cp.ChildProcess;

  constructor(
    private taskFilePath: string,
    private payload: object = {},
    private logCollector: (logChunk: string) => void,
    private onExit: () => void,
    private onError: () => void
  ) {}

  public start() {
    this.child = cp.fork(
      this.INVOKE_FILE,
      [this.taskFilePath, JSON.stringify(this.payload)],
      {
        silent: true
        // stdio:
      }
    );
    this.child.on("message", this.logCollector);
    this.child.on("exit", this.onExit);
    this.child.on("error", this.onError);
  }

  public stop() {
    if (!this.child?.killed) {
      this.child?.kill();
    }
  }
}
