import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const sourceDir = process.env.CLAP_SOURCE_DIR ?? path.join(process.env.HOME ?? "", "Downloads");
const targetDir = process.env.CLAP_TARGET_DIR ?? path.join(repoRoot, "data", "xiv", "models", "clap-htsat-unfused");

const requiredFiles = [
  "pytorch_model.bin",
  "config.json",
  "preprocessor_config.json",
];

async function ensureFile(fileName) {
  const sourcePath = path.join(sourceDir, fileName);
  const targetPath = path.join(targetDir, fileName);
  let sourceStats;

  try {
    sourceStats = await stat(sourcePath);
  } catch {
    throw new Error(`Missing ${sourcePath}`);
  }

  if (!sourceStats.isFile() || sourceStats.size === 0) {
    throw new Error(`Invalid or empty file: ${sourcePath}`);
  }

  await copyFile(sourcePath, targetPath);
  return `${fileName} (${sourceStats.size.toLocaleString()} bytes)`;
}

await mkdir(targetDir, { recursive: true });

try {
  const copied = [];
  for (const fileName of requiredFiles) {
    copied.push(await ensureFile(fileName));
  }

  for (const jsonName of ["config.json", "preprocessor_config.json"]) {
    JSON.parse(await readFile(path.join(targetDir, jsonName), "utf8"));
  }

  console.log(`CLAP bundle ready: ${targetDir}`);
  copied.forEach((fileName) => console.log(`- ${fileName}`));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
