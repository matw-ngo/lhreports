# Next.js URL Extractor and Lighthouse Reporter

This project is a Node.js application that extracts URLs from a Next.js project and generates Lighthouse reports for those URLs. It supports custom URL lists and provides options for generating JSON and HTML reports.

## Features

- Extract URLs from a Next.js project's pages directory.
- Remove invalid parts of URLs (e.g., `error`, `page`, `layout`, `layout-mapping`).
- Filter out URLs containing `layout` or `blog`.
- Support for custom URL lists.
- Generate Lighthouse reports in JSON and HTML formats.
- Save extracted URLs to a file for review.

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/matw-ngo/lhreports.git
   cd lhreports
   ```

2. Install dependencies:
   ```
   npm install
   ```
3. Create a .env file in the project root:
   ```
   DOMAIN=https://example.com
   ```
## Usage

### Command Line Options

- `--json`: Generate JSON reports (default: false)
- `--html`: Generate HTML reports (default: true)
- `--pages-dir <dir>`: Directory of Next.js pages (default: `pages`)
- `--save-urls <file>`: File to save extracted URLs (default: `urls.txt`)
- `--custom-urls <file>`: File containing custom URLs

### Examples

1. Extract URLs from the default `pages` directory and save them to `urls.txt`:
   ```
   npx ts-node src/index.ts --pages-dir ./app --save-urls urls.txt
   ```

2. Generate both JSON and HTML reports:
   ```
   npx ts-node src/index.ts --json --html --pages-dir ./app --save-urls urls.txt
   ```

3. Use a custom URL list:
   ```
   npx ts-node src/index.ts --custom-urls custom_urls.txt
   ```

### Project Structure

- `src/config.ts`: Configuration file for the domain.
- `src/utils/fileReader.ts`: Utility to read URLs from a file.
- `src/utils/lighthouseRunner.ts`: Utility to run Lighthouse.
- `src/utils/reportGenerator.ts`: Utility to generate reports.
- `src/utils/urlExtractor.ts`: Utility to extract URLs from the Next.js pages directory.
- `src/utils/urlSaver.ts`: Utility to save URLs to a file.
- `src/index.ts`: Main entry point for the application.

### Configuration

#### Domain Configuration

Update the `src/config.ts` file with your domain:

```
DOMAIN=https://example.com
```

### How It Works

1. **Extract URLs**:
   - The application scans the specified `pages` directory recursively to find all `.tsx`, `.jsx`, `.js`, and `.ts` files.
   - It generates URLs based on the file paths, removing invalid parts (`error`, `page`, `layout`, `layout-mapping`) and filtering out URLs containing `layout` or `blog`.
   - Extracted URLs are saved to the specified file for review.

2. **Generate Reports**:
   - The application generates Lighthouse reports for each URL in JSON and/or HTML format, based on the specified options.
   - Reports are saved in the `reports` directory.

### Contribution

Feel free to submit issues and pull requests to contribute to the project.

### License

This project is licensed under the MIT License.

### Contact

For any questions or suggestions, please contact [matw-ngo](trung.ngo@datanest.vn).
