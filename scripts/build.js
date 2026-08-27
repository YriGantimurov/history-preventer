const fs = require("fs").promises;
const path = require("path");

// ===== Configuration =====
const srcDir = "./src";
const polyfillDir = "./polyfill";
const distDirs = {
  firefox: "./dist/firefox",
  chrome: "./dist/chrome",
};

// ===== Helper: recursive copy (fallback for older Node.js) =====
async function copyRecursive(src, dest) {
  const stat = await fs.stat(src);
  if (stat.isDirectory()) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src);
    for (const entry of entries) {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      await copyRecursive(srcPath, destPath);
    }
  } else {
    await fs.copyFile(src, dest);
  }
}

// ===== Main build function =====
async function build() {
  // Ensure the dist root directory exists (optional, but explicit)
  await fs.mkdir("./dist", { recursive: true });

  for (const [browser, dest] of Object.entries(distDirs)) {
    console.log(`Building for ${browser}...`);

    // Clean destination directory
    await fs.rm(dest, { recursive: true, force: true });

    // Copy source files
    await copyRecursive(srcDir, dest);

    // Copy polyfill
    await copyRecursive(polyfillDir, path.join(dest, "polyfill"));

    // Copy the corresponding manifest
    const manifestSrc = `./manifests/manifest.${browser}.json`;
    const manifestDest = path.join(dest, "manifest.json");
    await fs.copyFile(manifestSrc, manifestDest);

    console.log(`✅ ${browser} build ready at ${dest}`);
  }
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
