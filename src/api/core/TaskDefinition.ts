import timestring from "timestring";

/**
 * A NiceCommander task definition
 *
 * A task file should export an object conforming to this interface as its default export
 */
export interface TaskDefinition {
  /**
   * Task name must be unique
   */
  name: string;

  /** Task description. Plain text */
  description?: string;

  /**
   * Run function. This function is asynchronous
   *
   * @param payload Task payload sent via manual task invocation
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: (payload: any) => Promise<void>;

  /**
   * Maximum time this task can run.
   * Number of milliseconds, if a number provided. A string describing the timeout if a string is provided.
   *
   * This field is using timestring
   * @see https://www.npmjs.com/package/timestring
   */
  timeoutAfter: string | number;

  /**
   * Time string or "manual". If not provided it is considered manual
   * @see https://www.npmjs.com/package/timestring
   */
  schedule?: "manual" | string;

  /**
   * Optional function for checking if a host should run a task.
   * This is useful for not running tasks on hosts that are overused or are configured in a way
   * that should not be used for running this specific task. For instance staging environment.
   */
  shouldHostRun?(): Promise<boolean>;

  /**
   * How to treat Unhandled Promise Rejection errors? This value can be set globally for all tasks in NiceCommander
   * options. This value will override the global setting.
   *
   * @see https://nodejs.org/api/cli.html#cli_unhandled_rejections_mode
   * @default "strict"
   */
  unhandledRejections?: "strict" | "warn" | "none";
}

export class TaskDefinitionValidationError extends Error {}

export function validateTaskDefinition(
  taskDefinition: Partial<TaskDefinition>
): taskDefinition is TaskDefinition {
  if (!taskDefinition.name) {
    throw new TaskDefinitionValidationError("name is required");
  }
  if (typeof taskDefinition.name !== "string") {
    throw new TaskDefinitionValidationError("name must be a string");
  }
  if (!taskDefinition.timeoutAfter) {
    if (typeof taskDefinition.timeoutAfter === "string") {
      timestring(taskDefinition.timeoutAfter);
    }
    throw new TaskDefinitionValidationError("timeoutAfter is required");
  }
  if (typeof taskDefinition.run !== "function") {
    throw new TaskDefinitionValidationError("run must be a function");
  }
  if (!taskDefinition.schedule) {
    taskDefinition.schedule = "manual";
  }
  if (taskDefinition.schedule !== "manual") {
    timestring(taskDefinition.schedule);
  }
  return true;
}
