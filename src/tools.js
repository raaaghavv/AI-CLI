import fs from "fs";
import path from "path";
import axios from "axios";
import puppeteer from "puppeteer";
import { exec } from "child_process";
import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";

export async function writeToFile([fileName, content]) {
  try {
    // Ensure parent directories exist
    const dir = dirname(fileName);
    await mkdir(dir, { recursive: true });

    // Write file (overwrite if exists)
    await writeFile(fileName, content, { flag: "w" });

    return `✅ Successfully wrote to ${fileName}`;
  } catch (err) {
    throw new Error(`❌ Error writing to file "${fileName}": ${err.message}`);
  }
}

// Fetch HTML using Puppeteer
export async function fetchPageHTML(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle0" });
  const html = await page.content();
  await browser.close();
  return html;
}

function ensureDirectoryExistence(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function downloadAsset(fileUrl, outputPath) {
  try {
    const outputDir = path.dirname(outputPath);
    ensureDirectoryExistence(outputDir);

    const response = await axios({
      method: "GET",
      url: fileUrl,
      responseType: "arraybuffer",
    });

    fs.writeFileSync(outputPath, response.data);
    console.log(`Downloaded: ${fileUrl}`);
  } catch (error) {
    console.error(
      `Failed to download asset: ${fileUrl}\nError: ${error.message}`
    );
  }
}

async function scrape(urlAndFolder) {
  const { url, outputFolder } =
    typeof urlAndFolder === "object"
      ? urlAndFolder
      : { url: urlAndFolder, outputFolder: "cloned-site" };

  let browser;
  try {
    ensureDirectoryExistence(outputFolder);
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const collectedAssets = new Map(); 

    // Set up the network response listener
    page.on("response", async (response) => {
      const responseUrl = response.url();
      const resourceType = response.request().resourceType();

      if (
        response.ok() &&
        ["script", "stylesheet", "image", "font"].includes(resourceType)
      ) {
        // Avoid duplicate URLs
        if (!collectedAssets.has(responseUrl)) {
          collectedAssets.set(responseUrl, resourceType);
        }
      }
    });

    // Navigate to the page, waiting for network activity to cease
    await page.goto(url, { waitUntil: "networkidle0", timeout: 0 });

    // Handle potential iframe content
    let contentFrame = page.mainFrame();
    const iframeElement = await page.$("iframe");
    if (iframeElement) {
      console.log("Iframe found, switching context...");
      const frame = await iframeElement.contentFrame();
      if (frame) {
        contentFrame = frame;
      }
    }

    let html = await contentFrame.content();
    const baseUrl = new URL(contentFrame.url());

    // Download all collected assets and prepare for path rewriting
    const pathRewriteMap = new Map();

    for (const assetUrl of collectedAssets.keys()) {
      try {
        const assetUrlObj = new URL(assetUrl);
        // Clean the pathname by removing the leading slash
        const assetPathname = assetUrlObj.pathname.startsWith("/")
          ? assetUrlObj.pathname.substring(1)
          : assetUrlObj.pathname;

        // Construct a local path without the hostname subfolder
        let localPath = path.join(outputFolder, assetPathname);

        if (assetPathname.endsWith("/")) {
          localPath = path.join(localPath, "index.html");
        }

        // Download the asset
        await downloadAsset(assetUrl, localPath);

        // Store the mapping for rewriting paths in the HTML
        const relativePath = path.relative(outputFolder, localPath);
        const finalWebPath = "./" + relativePath.split(path.sep).join("/");

        // We will want to replace both the full absolute URL and the relative pathname
        pathRewriteMap.set(assetUrl, finalWebPath);
        pathRewriteMap.set(assetUrlObj.pathname, finalWebPath);
      } catch (error) {
        console.error(`Could not process asset ${assetUrl}: ${error.message}`);
      }
    }

    // Rewrite all occurrences of asset paths in the HTML
    console.log("Rewriting paths in HTML...");
    for (const [originalPath, newPath] of pathRewriteMap.entries()) {
      // Escape special characters for use in a regular expression
      const escapedOriginalPath = originalPath.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      // Create a global regex to replace all instances
      const regex = new RegExp(escapedOriginalPath, "g");
      html = html.replace(regex, newPath);
    }

    // Save the final HTML file
    const htmlPath = path.join(outputFolder, "index.html");
    fs.writeFileSync(htmlPath, html);

    console.log(`\n✅ Scraping complete! Site saved in "${outputFolder}"`);
    return {
      success: true,
      message: `Scraped successfully to ${outputFolder}`,
    };
  } catch (err) {
    console.error(`\n❌ Scraping failed: ${err.message}`);
    return { success: false, message: `Scraping failed: ${err.message}` };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Map of tools AI can call
export const TOOL_MAP = {
  downloadAsset,
  writeToFile,
  scrape,
};
