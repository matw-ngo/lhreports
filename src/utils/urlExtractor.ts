import * as fs from "fs-extra";
import * as path from "path";
import { config } from "../config";

const getFilesRecursively = (dir: string): string[] => {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
};

const cleanInvalidParts = (url: string): string => {
  const invalidParts = ["/error", "/page", "/layout", "/layout-mapping"];
  invalidParts.forEach((part) => {
    url = url.split(part).join("");
  });
  return url;
};

const isValidUrl = (url: string, excludePatterns: string[]): boolean => {
  return !excludePatterns.some((pattern) => url.includes(pattern));
};

const ensureTrailingSlash = (url: string): string => {
  return url.endsWith("/") ? url : `${url}/`;
};

const extractUrlsFromNextJsPages = (
  pagesDir: string,
  excludePatterns: string[]
): string[] => {
  const files = getFilesRecursively(pagesDir);
  const urls = files
    .filter(
      (file) =>
        file.endsWith(".tsx") ||
        file.endsWith(".jsx") ||
        file.endsWith(".js") ||
        file.endsWith(".ts")
    )
    .map((file) => {
      let url = file.replace(pagesDir, "");
      url = url.replace(/\/index\.(tsx|jsx|js|ts)$/, "/");
      url = url.replace(/\.(tsx|jsx|js|ts)$/, "");
      return url || "/";
    })
    .map((url) => `${config.domain}${cleanInvalidParts(url)}`)
    .map((url) => ensureTrailingSlash(url))
    .filter((url) => isValidUrl(url, excludePatterns))
    .filter((url) => url !== `${config.domain}/`);

  const uniqueUrls = Array.from(new Set(urls));
  return uniqueUrls;
};

export const getNextJsUrls = (
  pagesDir: string,
  excludePatterns: string[]
): string[] => {
  const urls = extractUrlsFromNextJsPages(pagesDir, excludePatterns);
  // Always include the homepage
  if (!urls.includes(config.domain + "/")) {
    urls.unshift(config.domain + "/");
  }
  return urls;
};
