#!/usr/bin/env node
/**
 * Move Operator's local save from this machine to another.
 *
 * The save is not in git. The desktop app keeps it in the OS app-data
 * folder. `next dev` / `npm start` keep a separate copy in <repo>/.data.
 * This script copies the live one (newest store.json) into a tarball, and
 * restores that tarball onto another instance.
 *
 *   npm run storage:export
 *   npm run storage:export -- ~/Desktop/operator-storage.tar.gz
 *   npm run storage:import -- ~/Desktop/operator-storage.tar.gz
 *   npm run storage:import -- ~/Desktop/operator-storage.tar.gz --into dev
 *
 * Quit Operator on the destination before importing. The previous save
 * there is moved aside, not deleted.
 */

import { execFileSync } from "child_process";
import { createServer } from "net";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const devDataDir = path.join(repoRoot, ".data");

function electronRoot() {
  const home = os.homedir();
  if (process.platform === "darwin") {
    return path.join(home, "Library", "Application Support", "Operator");
  }
  if (process.platform === "win32") {
    const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
    return path.join(appData, "Operator");
  }
  const config = process.env.XDG_CONFIG_HOME || path.join(home, ".config");
  return path.join(config, "Operator");
}

function locations() {
  return {
    electron: {
      id: "electron",
      label: "desktop app",
      dataDir: path.join(electronRoot(), "data"),
      contextFile: path.join(electronRoot(), "ARUN_CONTEXT.md"),
    },
    dev: {
      id: "dev",
      label: "project folder",
      dataDir: devDataDir,
      contextFile: path.join(repoRoot, "ARUN_CONTEXT.md"),
    },
  };
}

function die(message) {
  console.error(message);
  process.exit(1);
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function storeStamp(dataDir) {
  const file = path.join(dataDir, "store.json");
  try {
    const stat = await fs.stat(file);
    return { file, mtimeMs: stat.mtimeMs, size: stat.size };
  } catch {
    return null;
  }
}

async function pickSource(explicit) {
  if (explicit) {
    const stamp = await storeStamp(explicit);
    if (!stamp) die(`No store.json in ${explicit}`);
    return {
      id: "custom",
      label: explicit,
      dataDir: explicit,
      contextFile: path.join(path.dirname(explicit), "ARUN_CONTEXT.md"),
      stamp,
    };
  }
  const found = [];
  for (const loc of Object.values(locations())) {
    const stamp = await storeStamp(loc.dataDir);
    if (stamp) found.push({ ...loc, stamp });
  }
  if (!found.length) die("No Operator save found in the desktop app data or .data/.");
  found.sort((a, b) => b.stamp.mtimeMs - a.stamp.mtimeMs);
  return found[0];
}

function defaultArchivePath() {
  const day = new Date().toISOString().slice(0, 10);
  return path.join(os.homedir(), "Desktop", `operator-storage-${day}.tar.gz`);
}

async function summarize(dataDir) {
  const raw = await fs.readFile(path.join(dataDir, "store.json"), "utf8");
  const state = JSON.parse(raw);
  const count = (key) => (Array.isArray(state[key]) ? state[key].length : 0);
  return {
    playerName: typeof state.playerName === "string" ? state.playerName : null,
    todos: count("todos"),
    notes: count("notes"),
    quests: count("quests"),
    missions: count("missions"),
    chat: count("chat"),
    xpEvents: count("xpEvents"),
  };
}

async function portBusy(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => server.close(() => resolve(false)));
    server.listen(port, "127.0.0.1");
  });
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--into" || arg === "--from") {
      flags[arg.slice(2)] = argv[++i];
    } else if (arg.startsWith("--")) {
      flags[arg.slice(2)] = true;
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

async function exportStorage(archivePath, fromDir) {
  const source = await pickSource(fromDir);
  const summary = await summarize(source.dataDir);
  const staging = await fs.mkdtemp(path.join(os.tmpdir(), "operator-storage-"));
  const bundle = path.join(staging, "operator-storage");
  const dataOut = path.join(bundle, "data");
  await fs.mkdir(dataOut, { recursive: true });
  await fs.cp(source.dataDir, dataOut, {
    recursive: true,
    filter: (src) => !path.basename(src).includes(".tmp-"),
  });

  let contextIncluded = false;
  if (await exists(source.contextFile)) {
    await fs.copyFile(source.contextFile, path.join(bundle, "ARUN_CONTEXT.md"));
    contextIncluded = true;
  }

  const hasKey = await exists(path.join(dataOut, "config.json"));
  const manifest = {
    app: "operator",
    exportedAt: new Date().toISOString(),
    sourceLabel: source.label,
    sourceDataDir: source.dataDir,
    contextIncluded,
    includesConfig: hasKey,
    summary,
  };
  await fs.writeFile(path.join(bundle, "manifest.json"), JSON.stringify(manifest, null, 2));
  await fs.writeFile(
    path.join(bundle, "README.txt"),
    [
      "Operator save bundle",
      "",
      "On the other machine, quit Operator, then from the operator repo run:",
      "",
      "  npm run storage:import -- /path/to/this-file.tar.gz",
      "",
      "That restores the desktop app save",
      `(${path.join(electronRoot(), "data")}).`,
      "Add --into dev to restore the project .data folder instead.",
      "",
      "config.json inside data/ can contain an API key. Keep this archive private.",
      "",
    ].join("\n"),
  );

  await fs.mkdir(path.dirname(archivePath), { recursive: true });
  execFileSync("tar", ["-czf", archivePath, "-C", staging, "operator-storage"], {
    stdio: "inherit",
  });
  await fs.rm(staging, { recursive: true, force: true });

  console.log(`Exported ${source.label}`);
  console.log(`  from ${source.dataDir}`);
  console.log(
    `  ${summary.todos} tasks, ${summary.notes} notes, ${summary.quests} quests, ${summary.chat} chat messages`,
  );
  if (contextIncluded) console.log("  included ARUN_CONTEXT.md");
  if (hasKey) console.log("  included config.json (may contain an API key)");
  console.log(`Archive: ${archivePath}`);
}

async function resolveDest(into) {
  const locs = locations();
  if (!into || into === "electron" || into === "desktop") return locs.electron;
  if (into === "dev" || into === "project") return locs.dev;
  return {
    id: "custom",
    label: into,
    dataDir: into,
    contextFile: path.join(path.dirname(into), "ARUN_CONTEXT.md"),
  };
}

async function importStorage(archivePath, into) {
  if (!archivePath) die("Usage: npm run storage:import -- <archive.tar.gz> [--into electron|dev|<dir>]");
  if (!(await exists(archivePath))) die(`Archive not found: ${archivePath}`);

  if ((await portBusy(3737)) || (await portBusy(3000))) {
    die("Operator is still running (port 3737 or 3000 is in use). Quit it, then import.");
  }

  const staging = await fs.mkdtemp(path.join(os.tmpdir(), "operator-import-"));
  try {
    execFileSync("tar", ["-xzf", archivePath, "-C", staging], { stdio: "inherit" });
    const bundle = path.join(staging, "operator-storage");
    const incoming = path.join(bundle, "data", "store.json");
    if (!(await exists(incoming))) die("Archive is missing operator-storage/data/store.json.");
    const summary = await summarize(path.join(bundle, "data"));
    const dest = await resolveDest(into);

    if (await exists(dest.dataDir)) {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const aside = `${dest.dataDir}.before-import-${stamp}`;
      await fs.rename(dest.dataDir, aside);
      console.log(`Moved the existing save aside:\n  ${aside}`);
    }
    await fs.mkdir(path.dirname(dest.dataDir), { recursive: true });
    await fs.cp(path.join(bundle, "data"), dest.dataDir, { recursive: true });

    const contextSrc = path.join(bundle, "ARUN_CONTEXT.md");
    if (await exists(contextSrc)) {
      await fs.mkdir(path.dirname(dest.contextFile), { recursive: true });
      if (dest.id === "dev" && (await exists(dest.contextFile))) {
        console.log("Left the repo ARUN_CONTEXT.md in place. The bundle copy is in the archive.");
      } else {
        await fs.copyFile(contextSrc, dest.contextFile);
        console.log(`Restored context file:\n  ${dest.contextFile}`);
      }
    }

    console.log(`Imported into ${dest.label}`);
    console.log(`  ${dest.dataDir}`);
    console.log(
      `  ${summary.todos} tasks, ${summary.notes} notes, ${summary.quests} quests, ${summary.chat} chat messages`,
    );
    console.log("Start Operator on this machine. It will read this save.");
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }
}

async function showStatus() {
  for (const loc of Object.values(locations())) {
    const stamp = await storeStamp(loc.dataDir);
    if (!stamp) {
      console.log(`${loc.label}: no save at ${loc.dataDir}`);
      continue;
    }
    const summary = await summarize(loc.dataDir);
    const when = new Date(stamp.mtimeMs).toISOString();
    console.log(`${loc.label}: ${loc.dataDir}`);
    console.log(
      `  updated ${when}, ${summary.todos} tasks, ${summary.notes} notes, ${summary.chat} chat messages`,
    );
  }
}

const { positional, flags } = parseArgs(process.argv.slice(2));
const command = positional[0];

if (command === "export") {
  await exportStorage(path.resolve(positional[1] || defaultArchivePath()), flags.from);
} else if (command === "import") {
  await importStorage(positional[1] ? path.resolve(positional[1]) : "", flags.into);
} else if (command === "status" || !command) {
  await showStatus();
} else {
  die("Commands: status | export [archive.tar.gz] | import <archive.tar.gz> [--into electron|dev]");
}
