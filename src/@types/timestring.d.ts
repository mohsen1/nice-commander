declare module "timestring" {
  /**
   * By default the return time value will be in seconds. This can be changed by passing one of the following strings as an argument to timestring:
   *
   *  * `ms` - Millisecond
   *  * `s` - Second
   *  * `m` - Minute
   *  * `h` - Hour
   *  * `d` - Day
   *  * `w` - Week
   *  * `mth` - Month
   *  * `y` - Years
   */
  export type ReturnTimeValue =
    | "ms"
    | "s"
    | "m"
    | "h"
    | "d"
    | "w"
    | "mth"
    | "y";
  /**
   * A few assumptions are made by default:
   *
   * * There are 24 hours per day
   * * There are 7 days per week
   * * There are 4 weeks per month
   * * There are 12 months per year
   * * There are 365.25 days per year
   *
   * These options can be changed by passing an options object as an argument to `timestring`.
   */
  export interface TimestringOption {
    hoursPerDay?: number;
    daysPerWeek?: number;
    weeksPerMonth?: number;
    monthsPerYear?: number;
    daysPerYear?: number;
  }
  /**
   * **Parse a human readable time string into a time based value.**
   *
   * timestring will parse the following keywords into time values:
   *
   * - ms, milli, millisecond, milliseconds - will parse to millisecond
   * - s, sec, secs, second, seconds - will parse to second
   * - m, min, mins, minute, minutes - will parse to minute
   * - h, hr, hrs, hour, hours - will parse to hour
   * - d, day, days - will parse to day
   * - w, week, weeks - will parse to week
   * - mon, mth, mths, month, months - will parse to month
   * - y, yr, yrs, year, years - will parse to years
   *
   * By default the returned time value from timestring will be in seconds.
   *
   * @example
   *     const timestring = require('timestring')
   *     let str = '1day 15h 20minutes 15s'
   *     let time = timestring(str)
   *     console.log(time) // will log 141615
   */
  declare function timestring(
    time: string,
    returnTimeValue?: ReturnTimeValue,
    options?: TimestringOption
  ): number;

  export default timestring;
}
