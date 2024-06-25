import { exec } from "child_process";
import * as fs from "fs-extra";

const runCommand = (command: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${stderr}`);
      } else {
        resolve();
      }
    });
  });
};

const parseLighthouseReport = (filePath: string): any => {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
};

const calculateAverage = (values: number[]): number => {
  return values.reduce((a, b) => a + b, 0) / values.length;
};

const getAverageScores = (reports: any[]): any => {
  const scores = {
    performance: calculateAverage(
      reports.map((report) => report.categories.performance.score)
    ),
    accessibility: calculateAverage(
      reports.map((report) => report.categories.accessibility.score)
    ),
    bestPractices: calculateAverage(
      reports.map((report) => report.categories["best-practices"].score)
    ),
    seo: calculateAverage(reports.map((report) => report.categories.seo.score)),
  };
  return scores;
};

export const runLighthouse = async (
  url: string,
  outputJsonPath: string,
  outputHtmlPath: string,
  maxWaitForLoad: number = 45000,
  runs: number = 3,
  preset: string = "mobile"
): Promise<{ averageScores: any; details: any[] }> => {
  const reports = [];
  const details = [];

  for (let i = 0; i < runs; i++) {
    const jsonOutputPath = outputJsonPath.replace(".json", `_${i}.json`);
    const htmlOutputPath = outputHtmlPath.replace(".html", `_${i}.html`);
    let jsonCommand = "";
    let htmlCommand = "";

    if (preset === "mobile") {
      jsonCommand = `lighthouse ${url} --output=json --output-path=${jsonOutputPath} --max-wait-for-load=${maxWaitForLoad} --chrome-flags="--headless" `;
      htmlCommand = `lighthouse ${url} --output=html --output-path=${htmlOutputPath} --max-wait-for-load=${maxWaitForLoad} --chrome-flags="--headless" `;
    } else {
      jsonCommand = `lighthouse ${url} --output=json --output-path=${jsonOutputPath} --max-wait-for-load=${maxWaitForLoad} --chrome-flags="--headless" --preset=${preset}`;
      htmlCommand = `lighthouse ${url} --output=html --output-path=${htmlOutputPath} --max-wait-for-load=${maxWaitForLoad} --chrome-flags="--headless" --preset=${preset}`;
    }

    await runCommand(jsonCommand);
    await runCommand(htmlCommand);

    const report = parseLighthouseReport(jsonOutputPath);
    reports.push(report);
    details.push({
      runIndex: i + 1,
      finalUrl: report.finalUrl,
      fetchTime: report.fetchTime,
      environment: {
        formFactor: report.configSettings.formFactor,
        throttlingMethod: report.configSettings.throttlingMethod,
        chromiumVersion: report.environment.hostUserAgent.match(
          /HeadlessChrome\/([\d.]+)/
        )[1],
        cpuThrottling: `${report.configSettings.throttling.cpuSlowdownMultiplier}x slowdown (${report.configSettings.throttlingMethod})`,
        screenEmulation: `${report.configSettings.screenEmulation.width}x${report.configSettings.screenEmulation.height}, DPR ${report.configSettings.screenEmulation.deviceScaleFactor}`,
      },
      scores: {
        performance: report.categories.performance.score,
        accessibility: report.categories.accessibility.score,
        bestPractices: report.categories["best-practices"].score,
        seo: report.categories.seo.score,
      },
    });
  }

  const averageScores = getAverageScores(reports);
  return { averageScores, details };
};
