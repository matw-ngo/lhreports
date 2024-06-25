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
  .option(
    "--save-urls <file>",
    "File to save extracted URLs",
    "output/urls.txt"
  )
  .option("--custom-urls <file>", "File containing custom URLs")
  .option(
    "--exclude-urls <file>",
    "File containing URL exclusion patterns",
    "config/exclude-urls.txt"
  )
  .option(
    "--markdown-file <file>",
    "File to save markdown table",
    "output/summary.md"
  )
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
  )
  .option(
    "--preset <device>",
    "Device to emulate (mobile or desktop)",
    "mobile"
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
const preset = options.preset;

const readUrlsFromFile = async (filePath: string): Promise<string[]> => {
  const data = await fs.readFile(filePath, "utf-8");
  return data
    .split("\n")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
};

const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    timeZoneName: "short",
  };
  return new Intl.DateTimeFormat("en-US", options).format(date);
};

const main = async () => {
  try {
    console.log("Starting URL extraction...");
    const excludePatterns = await readUrlsFromFile(excludeUrlsFile);

    let urls: string[];

    if (options.customUrls) {
      const customUrlsFile = path.resolve(__dirname, "../", options.customUrls);
      urls = await readUrlsFromFile(customUrlsFile);
      console.log(`Custom URLs loaded from ${customUrlsFile}`);
    } else {
      urls = getNextJsUrls(pagesDir, excludePatterns);
      saveUrlsToFile(urls, urlsFile);
      console.log(
        `URLs extracted and saved to ${urlsFile}. Please check the URLs before generating reports.`
      );
    }

    // Generate reports and get scores
    console.log("Starting Lighthouse report generation...");
    const startTime = Date.now();
    const { scores, details } = await generateReports(
      urls,
      reportsDir,
      options.json,
      options.html,
      chunkSize,
      maxWaitForLoad,
      runs,
      preset
    );
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    const generatedAt = formatDate(new Date());

    // Generate markdown table and save to file
    console.log("Generating markdown summary...");
    const pages = scores.map((score: any) => ({
      page: score.page.replace(config.domain, ""),
      performance: score.performance,
      accessibility: score.accessibility,
      bestPractices: score.bestPractices,
      seo: score.seo,
    }));
    const markdownTable = generateMarkdownTable(pages);

    let detailsTable =
      "\n\n## Detailed Run Information\n\n| Run | Page | Fetch Time | Performance | Accessibility | Best Practices | SEO | Device | Chromium Version | CPU Throttling | Screen Emulation |\n|-----|------|------------|-------------|---------------|----------------|-----|--------|--------------------|------------------|--------------------------|\n";
    details.forEach((detail: any) => {
      detailsTable += `| ${detail.runIndex} | ${detail.finalUrl} | ${
        detail.fetchTime
      } | ${Math.round(detail.scores.performance * 100)} | ${Math.round(
        detail.scores.accessibility * 100
      )} | ${Math.round(detail.scores.bestPractices * 100)} | ${Math.round(
        detail.scores.seo * 100
      )} | ${detail.environment.formFactor} | ${
        detail.environment.chromiumVersion
      } | ${detail.environment.cpuThrottling} | ${
        detail.environment.screenEmulation
      }\n`;
    });

    saveMarkdownToFile(
      `## Summary of Results\n\nGenerated at: ${generatedAt}\n\nGenerated in ${duration} seconds\n\n${markdownTable}${detailsTable}`,
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
