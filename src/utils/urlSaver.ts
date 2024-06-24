import * as fs from "fs";

export const saveUrlsToFile = (urls: string[], filePath: string) => {
  const data = urls.join("\n");
  fs.writeFileSync(filePath, data);
  console.log(`URLs saved to ${filePath}`);
};
