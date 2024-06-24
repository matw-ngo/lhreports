import * as fs from "fs";
import * as readline from "readline";
import csv from "csv-parser";

export const readUrlsFromFile = async (filePath: string): Promise<string[]> => {
  const urls: string[] = [];
  const fileExt = filePath.split(".").pop();

  if (fileExt === "csv") {
    const stream = fs.createReadStream(filePath);
    return new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on("data", (row) => {
          if (row.url) {
            urls.push(row.url);
          }
        })
        .on("end", () => resolve(urls))
        .on("error", (err) => reject(err));
    });
  } else if (fileExt === "txt") {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      urls.push(line.trim());
    }
  } else {
    throw new Error(
      "Unsupported file type. Only CSV and TXT files are supported."
    );
  }

  return urls;
};
