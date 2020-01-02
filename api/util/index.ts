import assert from "assert";
import { inRange } from "lodash";

export function assertNumberArgumentIsInRange(
  argName: string,
  argValue: number,
  start: number,
  end: number = Infinity
) {
  assert(
    inRange(argValue, start, end),
    new RangeError(
      `${argValue} is out of range for ${argName} argument. Accepted range is (${start}, ${end})`
    )
  );
}
