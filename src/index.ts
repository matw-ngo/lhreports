import * as path from "path";
import { Command } from "commander";
import { generateReports } from "./utils/reportGenerator";
import { getNextJsUrls } from "./utils/urlExtractor";
import { saveUrlsToFile } from "./utils/urlSaver";
import * as fs from "fs-extra";

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
  );

program.parse(process.argv);

const options = program.opts();

const reportsDir = path.resolve(__dirname, "../reports");
const pagesDir = path.resolve(__dirname, "../", options.pagesDir);
const urlsFile = path.resolve(__dirname, "../", options.saveUrls);
const excludeUrlsFile = path.resolve(__dirname, "../", options.excludeUrls);

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

    // Uncomment the following lines if you want to generate reports immediately after saving URLs
    await generateReports(urls, reportsDir, options.json, options.html);
    console.log('All reports generated successfully.');
  } catch (error) {
    console.error(
      "Failed to extract URLs or generate Lighthouse reports:",
      error
    );
  }
};

main();
