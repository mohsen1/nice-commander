import fs from "fs";
import path from "path";

export function readSourceCode(filePath: string) {
  let sourceFilePath = filePath;

  try {
    const mapFilePath = filePath + ".map";
    const mapFileContent = JSON.parse(fs.readFileSync(mapFilePath).toString());

    sourceFilePath = path.resolve(
      path.dirname(filePath),
      mapFileContent.sources[0]
    );
  } catch {
    // Simply use the original filePath
  }

  return fs.readFileSync(sourceFilePath).toString();
}
