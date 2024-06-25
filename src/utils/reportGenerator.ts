import { runLighthouse } from "./lighthouseRunner";
import { chunkArray } from "./chunk";
import * as fs from "fs-extra";
import * as path from "path";

interface PageScore {
  page: string;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

interface RunDetail {
  runIndex: number;
  finalUrl: string;
  fetchTime: string;
  environment: {
    formFactor: string;
    throttlingMethod: string;
    chromiumVersion: string;
  };
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
}

export const generateReports = async (
  urls: string[],
  reportsDir: string,
  outputJson: boolean,
  outputHtml: boolean,
  chunkSize: number = 10,
  maxWaitForLoad: number = 45000,
  runs: number = 3,
  preset: string = "mobile"
): Promise<{ scores: PageScore[]; details: RunDetail[] }> => {
  if (fs.existsSync(reportsDir)) {
    fs.rmdirSync(reportsDir, { recursive: true });
  }

  fs.mkdirSync(reportsDir, { recursive: true });

  const chunks = chunkArray(urls, chunkSize);
  const scores: PageScore[] = [];
  const details: RunDetail[] = [];

  for (const chunk of chunks) {
    const promises = chunk.map(async (url) => {
      const urlSafe = url.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const reportPathJson = outputJson
        ? path.join(reportsDir, `${urlSafe}.json`)
        : undefined;
      const reportPathHtml = outputHtml
        ? path.join(reportsDir, `${urlSafe}.html`)
        : undefined;

      if (reportPathJson && reportPathHtml) {
        const { averageScores, details: runDetails } = await runLighthouse(
          url,
          reportPathJson,
          reportPathHtml,
          maxWaitForLoad,
          runs,
          preset
        );
        details.push(...runDetails);
        return {
          page: url,
          performance: Math.round(averageScores.performance * 100),
          accessibility: Math.round(averageScores.accessibility * 100),
          bestPractices: Math.round(averageScores.bestPractices * 100),
          seo: Math.round(averageScores.seo * 100),
        };
      }

      return null;
    });

    const results = await Promise.all(promises);
    scores.push(...(results.filter((score) => score !== null) as PageScore[]));
  }

  return { scores, details };
};
