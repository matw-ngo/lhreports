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
  runs: number = 3
): Promise<any> => {
  const reports = [];

  for (let i = 0; i < runs; i++) {
    const jsonOutputPath = outputJsonPath.replace(".json", `_${i}.json`);
    const htmlOutputPath = outputHtmlPath.replace(".html", `_${i}.html`);

    const jsonCommand = `lighthouse ${url} --output=json --output-path=${jsonOutputPath} --max-wait-for-load=${maxWaitForLoad} --chrome-flags="--headless"`;
    const htmlCommand = `lighthouse ${url} --output=html --output-path=${htmlOutputPath} --max-wait-for-load=${maxWaitForLoad} --chrome-flags="--headless"`;

    await runCommand(jsonCommand);
    await runCommand(htmlCommand);

    reports.push(parseLighthouseReport(jsonOutputPath));
  }

  const averageScores = getAverageScores(reports);
  return averageScores;
};
