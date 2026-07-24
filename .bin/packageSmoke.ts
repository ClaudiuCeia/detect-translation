import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { runInNewContext } from "node:vm";
import { build } from "esbuild";

type PackageApi = {
  observe?: unknown;
};

const root = process.cwd();
const command = (name: string): string =>
  process.platform === "win32" ? `${name}.cmd` : name;

const run = (file: string, args: string[], cwd: string): void => {
  execFileSync(file, args, { cwd, stdio: "inherit" });
};

const main = async (): Promise<void> => {
  const temp = await mkdtemp(
    path.join(tmpdir(), "detect-translation-package-smoke-"),
  );

  try {
    await writeFile(
      path.join(temp, "package.json"),
      JSON.stringify({ private: true, type: "module" }),
    );

    const tarball = path.join(temp, "detect-translation.tgz");
    run(command("pnpm"), ["pack", "--out", tarball], root);
    run(
      command("npm"),
      [
        "install",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        "--no-package-lock",
        tarball,
      ],
      temp,
    );

    run(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        `
          import { observe } from "detect-translation";
          if (typeof observe !== "function") process.exit(1);
        `,
      ],
      temp,
    );
    run(
      process.execPath,
      [
        "--eval",
        `
          const { observe } = require("detect-translation");
          if (typeof observe !== "function") process.exit(1);
        `,
      ],
      temp,
    );

    await writeFile(
      path.join(temp, "consumer.mts"),
      `
        import { observe, type ObserverParams } from "detect-translation";

        const params: ObserverParams = {
          sourceLang: "en",
          onTranslation: () => {},
        };

        const observer: MutationObserver = observe(params);
        observer.disconnect();
      `,
    );
    await writeFile(
      path.join(temp, "consumer.cts"),
      `
        import detectTranslation = require("detect-translation");
        import type { ObserverParams } from "detect-translation";

        const params: ObserverParams = {
          sourceLang: "en",
          onTranslation: () => {},
        };

        const observer: MutationObserver = detectTranslation.observe(params);
        observer.disconnect();
      `,
    );
    await writeFile(
      path.join(temp, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          lib: ["ES2020", "DOM"],
          module: "NodeNext",
          moduleResolution: "NodeNext",
          noEmit: true,
          strict: true,
          target: "ES2020",
        },
        include: ["consumer.mts", "consumer.cts"],
      }),
    );

    const localRequire = createRequire(path.join(root, "package.json"));
    const tsc = localRequire.resolve("typescript/bin/tsc");
    run(process.execPath, [tsc, "--project", temp], temp);

    const browserBuild = await build({
      stdin: {
        contents: 'export { observe } from "detect-translation";',
        resolveDir: temp,
      },
      bundle: true,
      format: "iife",
      globalName: "Consumer",
      logLevel: "silent",
      metafile: true,
      platform: "browser",
      write: false,
    });

    assert(
      Object.keys(browserBuild.metafile.inputs).some((input) =>
        input.replaceAll(path.sep, "/").endsWith("/dist/index.mjs"),
      ),
      "browser bundling did not resolve the ESM entrypoint",
    );

    const browserContext: { Consumer?: PackageApi } = {};
    runInNewContext(browserBuild.outputFiles[0].text, browserContext);
    assert.equal(typeof browserContext.Consumer?.observe, "function");

    const installedPackage = path.join(
      temp,
      "node_modules",
      "detect-translation",
    );
    const manifest = JSON.parse(
      await readFile(path.join(installedPackage, "package.json"), "utf8"),
    );
    assert.equal(manifest.unpkg, "dist-browser/index.min.js");
    assert.equal(manifest.jsdelivr, "dist-browser/index.min.js");

    const cdnBundle = await readFile(
      path.join(installedPackage, "dist-browser", "index.min.js"),
      "utf8",
    );
    const cdnContext: { DetectTranslation?: PackageApi } = {};
    runInNewContext(cdnBundle, cdnContext);
    assert.equal(typeof cdnContext.DetectTranslation?.observe, "function");

    console.log("Package smoke checks passed.");
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
