import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const runLighthouse = async (
  url: string,
  outputPathJson?: string,
  outputPathHtml?: string
): Promise<void> => {
  try {
    const promises = [];

    if (outputPathJson) {
      const commandJson = `lighthouse ${url} --output=json --output-path=${outputPathJson}`;
      promises.push(
        execAsync(commandJson).then(({ stderr }) => {
          if (stderr) {
            console.error(`Error generating JSON report for ${url}:`, stderr);
          } else {
            console.log(
              `JSON report generated for ${url} and saved to ${outputPathJson}`
            );
          }
        })
      );
    }

    if (outputPathHtml) {
      const commandHtml = `lighthouse ${url} --output=html --output-path=${outputPathHtml}`;
      promises.push(
        execAsync(commandHtml).then(({ stderr }) => {
          if (stderr) {
            console.error(`Error generating HTML report for ${url}:`, stderr);
          } else {
            console.log(
              `HTML report generated for ${url} and saved to ${outputPathHtml}`
            );
          }
        })
      );
    }

    await Promise.all(promises);
  } catch (error) {
    console.error(`Failed to run Lighthouse for ${url}:`, error);
  }
};
