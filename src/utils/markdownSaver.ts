import * as fs from "fs-extra";
import * as path from "path";

export const saveMarkdownToFile = (
  markdown: string,
  filePath: string
): void => {
  fs.writeFileSync(filePath, markdown);
  console.log(`Markdown table saved to ${filePath}`);
};
