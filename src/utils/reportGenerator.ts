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

const getScoresFromReport = (report: any): PageScore => {
  return {
    page: report.finalUrl,
    performance: Math.round(report.categories.performance.score * 100),
    accessibility: Math.round(report.categories.accessibility.score * 100),
    bestPractices: Math.round(report.categories["best-practices"].score * 100),
    seo: Math.round(report.categories.seo.score * 100),
  };
};

export const generateReports = async (
  urls: string[],
  reportsDir: string,
  outputJson: boolean,
  outputHtml: boolean,
  chunkSize: number = 10,
  maxWaitForLoad: number = 45000,
  runs: number = 3
): Promise<PageScore[]> => {
  if (fs.existsSync(reportsDir)) {
    fs.rmdirSync(reportsDir, { recursive: true });
  }

  fs.mkdirSync(reportsDir, { recursive: true });

  const chunks = chunkArray(urls, chunkSize);
  const scores: PageScore[] = [];

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
        const averageScores = await runLighthouse(
          url,
          reportPathJson,
          reportPathHtml,
          maxWaitForLoad,
          runs
        );
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

  return scores;
};
