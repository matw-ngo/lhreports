import * as path from "path";
import { Command } from "commander";
import { generateReports } from "./utils/reportGenerator";
import { getNextJsUrls } from "./utils/urlExtractor";
import { saveUrlsToFile } from "./utils/urlSaver";
import { generateMarkdownTable } from "./utils/markdownTable";
import { saveMarkdownToFile } from "./utils/markdownSaver";
import * as fs from "fs-extra";
import { config } from "./config";

const program = new Command();
program
  .option("--json", "Generate JSON reports", false)
  .option("--html", "Generate HTML reports", true)
  .option("--pages-dir <dir>", "Directory of Next.js pages", "pages")
  .option("--save-urls <file>", "File to save extracted URLs", "urls.txt")
  .option("--custom-urls <file>", "File containing custom URLs")
  .option(
    "--exclude-urls <file>",
    "File containing URL exclusion patterns",
    "exclude-urls.txt"
  )
  .option("--markdown-file <file>", "File to save markdown table", "summary.md")
  .option(
    "--chunk-size <number>",
    "Number of URLs to process in parallel",
    "10"
  )
  .option(
    "--max-wait-for-load <number>",
    "Maximum wait time for load (in milliseconds)",
    "45000"
  )
  .option(
    "--runs <number>",
    "Number of times to run Lighthouse for averaging",
    "3"
  );

program.parse(process.argv);

const options = program.opts();

// Ensure --json is true if --markdown-file is specified
if (options.markdownFile) {
  options.json = true;
}

const reportsDir = path.resolve(__dirname, "../reports");
const pagesDir = path.resolve(__dirname, "../", options.pagesDir);
const urlsFile = path.resolve(__dirname, "../", options.saveUrls);
const excludeUrlsFile = path.resolve(__dirname, "../", options.excludeUrls);
const markdownFile = path.resolve(__dirname, "../", options.markdownFile);
const chunkSize = parseInt(options.chunkSize, 10);
const maxWaitForLoad = parseInt(options.maxWaitForLoad, 10);
const runs = parseInt(options.runs, 10);

const readUrlsFromFile = async (filePath: string): Promise<string[]> => {
  const data = await fs.readFile(filePath, "utf-8");
  return data
    .split("\n")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
};

const main = async () => {
  try {
    const excludePatterns = await readUrlsFromFile(excludeUrlsFile);

    let urls: string[];

    if (options.customUrls) {
      const customUrlsFile = path.resolve(__dirname, "../", options.customUrls);
      urls = await readUrlsFromFile(customUrlsFile);
    } else {
      urls = getNextJsUrls(pagesDir, excludePatterns);
      saveUrlsToFile(urls, urlsFile);
      console.log(
        `Please check the URLs in ${urlsFile} before generating reports.`
      );
    }

    // Generate reports and get scores
    const startTime = Date.now();
    const scores = await generateReports(
      urls,
      reportsDir,
      options.json,
      options.html,
      chunkSize,
      maxWaitForLoad,
      runs
    );
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Generate markdown table and save to file
    const pages = scores.map((score) => ({
      page: score.page.replace(config.domain, ""),
      performance: score.performance,
      accessibility: score.accessibility,
      bestPractices: score.bestPractices,
      seo: score.seo,
    }));
    const markdownTable = generateMarkdownTable(pages);
    saveMarkdownToFile(
      `## Summary of Results\n\nGenerated in ${duration} seconds\n\n${markdownTable}`,
      markdownFile
    );

    console.log(
      "All reports generated and summary table created successfully."
    );
  } catch (error) {
    console.error(
      "Failed to extract URLs or generate Lighthouse reports:",
      error
    );
  }
};

main();
