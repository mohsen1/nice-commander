import assert from "assert";
import { inRange } from "lodash";

import ArgumentOutOfRange from "../errors/ArgumentOutOfRange";

export function assertNumberArgumentIsInRange(
  argName: string,
  argValue: number,
  start: number,
  end: number = Infinity
) {
  assert(
    inRange(argValue, start, end),
    new ArgumentOutOfRange(
      `${argValue} is out of range for ${argName} argument. Accepted range is (${start}, ${end})`
    )
  );
}
