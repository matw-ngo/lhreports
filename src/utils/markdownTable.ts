interface PageScore {
  page: string;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

export const generateMarkdownTable = (scores: PageScore[]): string => {
  const headers = [
    "Page",
    "Performance",
    "Accessibility",
    "Best Practices",
    "SEO",
  ];
  const tableHeader = `| ${headers.join(" | ")} |`;
  const tableDivider = `|${headers.map(() => "-------------").join("|")}|`;

  const tableRows = scores
    .map(
      (score) =>
        `| ${score.page} | ${score.performance} | ${score.accessibility} | ${score.bestPractices} | ${score.seo} |`
    )
    .join("\n");

  return `
## Summary of Results

${tableHeader}
${tableDivider}
${tableRows}
`;
};
