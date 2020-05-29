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

  /**
   * Run function. This function is asynchronous
   *
   * @param payload Task payload sent via manual task invocation
   */
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
   * Time string or "manual"
   * @see https://www.npmjs.com/package/timestring
   */
  schedule: "manual" | string;
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
  if (taskDefinition.schedule && taskDefinition.schedule !== "manual") {
    timestring(taskDefinition.schedule);
  }
  return true;
}
