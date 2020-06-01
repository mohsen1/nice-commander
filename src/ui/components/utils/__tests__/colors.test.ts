import {
  getBackgroundColorForStatus,
  getForegroundColorForStatus,
} from "../colors";

describe("colors", () => {
  it("getBackgroundColorForStatus returns the right color", () => {
    expect(getBackgroundColorForStatus("ERROR")).toMatchInlineSnapshot(
      `"var(--color-fail-dim)"`
    );
    expect(getBackgroundColorForStatus("FINISHED")).toMatchInlineSnapshot(
      `"var(--color-success-dim)"`
    );
    expect(getBackgroundColorForStatus("RUNNING")).toMatchInlineSnapshot(
      `"var(--color-progress-dim)"`
    );
    expect(getBackgroundColorForStatus("TIMED_OUT")).toMatchInlineSnapshot(
      `"var(--color-gray-dim)"`
    );
  });

  it("getForegroundColorForStatus returns the right color", () => {
    expect(getForegroundColorForStatus("ERROR")).toMatchInlineSnapshot(
      `"var(--color-fail-normal)"`
    );
    expect(getForegroundColorForStatus("FINISHED")).toMatchInlineSnapshot(
      `"var(--color-success-normal)"`
    );
    expect(getForegroundColorForStatus("RUNNING")).toMatchInlineSnapshot(
      `"var(--color-progress-normal)"`
    );
    expect(getForegroundColorForStatus("TIMED_OUT")).toMatchInlineSnapshot(
      `"var(--color-gray-normal)"`
    );
  });
});
