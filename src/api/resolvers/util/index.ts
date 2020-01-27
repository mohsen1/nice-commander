import _ from "lodash";
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

/**
 * Generate a random string
 * @param length Output string length
 */
export function rand(length: number = 10) {
  let result = "";
  for (let i = 0; i < length; i++) {
    // Add a random letter from A to Z
    result += String.fromCharCode(65 + Math.floor(Math.random() * 26));
  }
  return result;
}
