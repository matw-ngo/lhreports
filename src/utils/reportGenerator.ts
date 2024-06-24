import * as fs from "fs";
import * as path from "path";
import { runLighthouse } from "./lighthouseRunner";

export const generateReports = async (
  urls: string[],
  reportsDir: string,
  outputJson: boolean,
  outputHtml: boolean
): Promise<void> => {
  if (fs.existsSync(reportsDir)) {
    fs.rmdirSync(reportsDir, { recursive: true });
  }

  fs.mkdirSync(reportsDir, { recursive: true });

  const promises = urls.map(async (url) => {
    const urlSafe = url.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const reportPathJson = outputJson
      ? path.join(reportsDir, `${urlSafe}.json`)
      : undefined;
    const reportPathHtml = outputHtml
      ? path.join(reportsDir, `${urlSafe}.html`)
      : undefined;
    await runLighthouse(url, reportPathJson, reportPathHtml);
  });

  await Promise.all(promises);
};
