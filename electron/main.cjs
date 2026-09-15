// ── Operator desktop shell ─────────────────────────────────────────────────
// Ships the standalone Next.js server as a tarball, extracts it into the
// user-data directory on first run / upgrade, runs it with Electron's Node,
// and presents it in a native window. No browser required.

const { app, BrowserWindow, shell, net } = require("electron");
const { spawn, execFile } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");
const http = require("http");

const execFileAsync = promisify(execFile);

const PORT = 3737;
const APP_URL = `http://127.0.0.1:${PORT}`;
// Poll a static route for readiness — the dashboard takes ~1.7s to render
// (coach + quest logic), which is fine for a window load but too slow for
// a snappy health poll.
const HEALTH_URL = `http://127.0.0.1:${PORT}/manifest.webmanifest`;

let serverProcess = null;
let mainWindow = null;

function resolvePaths() {
  const userData = app.getPath("userData");
  if (app.isPackaged) {
    return {
      tarball: path.join(process.resourcesPath, "server.tar.gz"),
      serverDir: path.join(userData, "server"),
      bundledContext: path.join(process.resourcesPath, "ARUN_CONTEXT.md"),
      userData,
    };
  }
  // Unpackaged (npm run desktop) — use the project's own build output
  const root = path.join(__dirname, "..");
  return {
    tarball: null,
    serverDir: path.join(root, ".next", "standalone"),
    bundledContext: path.join(root, "ARUN_CONTEXT.md"),
    userData,
  };
}

/** Packaged builds run from an extracted copy (app bundles are read-only,
 *  and Next wants a writable .next/cache). Re-extract on version change. */
async function ensureServerExtracted({ tarball, serverDir }) {
  if (!tarball) return; // unpackaged: run straight from .next/standalone
  const stampPath = path.join(serverDir, ".operator-version");
  // Stamp = app version + tarball identity, so any rebuild re-extracts even
  // without a version bump.
  const stat = fs.statSync(tarball);
  const want = `${app.getVersion()}-${stat.size}-${Math.floor(stat.mtimeMs)}`;
  const have =
    fs.existsSync(path.join(serverDir, "server.js")) && fs.existsSync(stampPath)
      ? fs.readFileSync(stampPath, "utf8")
      : null;
  if (have === want) return;
  console.log("[operator] extracting server bundle (version", want + ")");
  fs.rmSync(serverDir, { recursive: true, force: true });
  fs.mkdirSync(serverDir, { recursive: true });
  await execFileAsync("tar", ["-xzf", tarball, "-C", serverDir]);
  fs.writeFileSync(stampPath, want);
}

/** Data + user-editable context live in the OS app-data directory. */
function ensureUserData({ bundledContext, userData }) {
  const dataDir = path.join(userData, "data");
  fs.mkdirSync(dataDir, { recursive: true });

  const contextFile = path.join(userData, "ARUN_CONTEXT.md");
  if (!fs.existsSync(contextFile) && fs.existsSync(bundledContext)) {
    fs.copyFileSync(bundledContext, contextFile);
  }
  return { dataDir, contextFile };
}

function startServer(serverDir, dataDir, contextFile) {
  const serverPath = path.join(serverDir, "server.js");
  if (!fs.existsSync(serverPath)) {
    console.error("[operator] standalone server not found at", serverPath);
    return false;
  }
  serverProcess = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(PORT),
      HOSTNAME: "127.0.0.1",
      OPERATOR_DATA_DIR: dataDir,
      OPERATOR_CONTEXT_FILE: contextFile,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  serverProcess.stdout.on("data", (d) => console.log("[server]", String(d).trim()));
  serverProcess.stderr.on("data", (d) => console.error("[server]", String(d).trim()));
  serverProcess.on("exit", (code) => {
    console.log("[server] exited with code", code);
  });
  return true;
}

function waitForServer(maxAttempts = 120) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const attempt = (remaining) => {
      if (settled) return;
      let done = false;
      const retry = (why) => {
        if (done || settled) return;
        done = true;
        if (remaining % 10 === 0 || remaining < 5) {
          console.log(`[operator] waiting for server (${why}), attempts left: ${remaining}`);
        }
        if (remaining <= 0) {
          settled = true;
          reject(new Error("Server did not start in time"));
          return;
        }
        setTimeout(() => attempt(remaining - 1), 400);
      };
      // After a few Node-http failures, also try Electron's net stack —
      // belt and suspenders against any Node-networking quirk in the
      // main process.
      if (remaining < maxAttempts - 8 && remaining % 2 === 0) {
        net
          .fetch(HEALTH_URL)
          .then((res) => {
            if (settled || done) return;
            done = true;
            settled = true;
            console.log("[operator] server responded via net.fetch, status", res.status);
            resolve();
          })
          .catch((e) => retry("netfetch:" + (e?.code || e?.message || "fail")));
        return;
      }
      const req = http.get(HEALTH_URL, (res) => {
        res.resume();
        if (settled || done) return;
        done = true;
        settled = true;
        console.log("[operator] server responded via http, status", res.statusCode);
        resolve();
      });
      // destroy() without an error emits only 'close', not 'error' — which
      // used to silently kill the retry loop. Always pass an error.
      req.setTimeout(3000, () => req.destroy(new Error("timeout")));
      req.on("error", (e) => retry(e.code || e.message || "error"));
      req.on("close", () => retry("close"));
    };
    attempt(maxAttempts);
  });
}

function createWindow() {
  console.log("[operator] creating window");
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: "#161009",
    title: "Operator",
    autoHideMenuBar: true,
    show: true,
    webPreferences: { contextIsolation: true },
  });
  mainWindow.webContents.on("did-fail-load", (_e, code, desc) => {
    console.error("[operator] page failed to load:", code, desc);
  });
  mainWindow.webContents.on("render-process-gone", (_e, details) => {
    console.error("[operator] renderer gone:", JSON.stringify(details));
  });
  // External links open in the system browser, not in the app window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http") && !url.startsWith(APP_URL)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });
  mainWindow
    .loadURL(APP_URL)
    .then(() => console.log("[operator] window loaded"))
    .catch((err) => console.error("[operator] loadURL error:", err));
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    const paths = resolvePaths();
    try {
      await ensureServerExtracted(paths);
    } catch (err) {
      console.error("[operator] failed to extract server bundle:", err);
      app.quit();
      return;
    }
    const { dataDir, contextFile } = ensureUserData(paths);
    if (!startServer(paths.serverDir, dataDir, contextFile)) {
      app.quit();
      return;
    }
    try {
      await waitForServer();
      console.log("[operator] server is up, creating window");
      createWindow();
    } catch (err) {
      console.error("[operator]", err);
      app.quit();
    }
  });

  process.on("unhandledRejection", (err) => {
    console.error("[operator] unhandled rejection:", err);
  });

  app.on("window-all-closed", () => {
    app.quit();
  });

  // Graceful shutdown: give the server a moment to finish any in-flight
  // write before we die. Store writes are atomic, so even a SIGKILL can't
  // corrupt data — this just lets the last action land cleanly.
  app.on("before-quit", (event) => {
    if (!serverProcess) return; // nothing to clean up
    event.preventDefault();
    const proc = serverProcess;
    serverProcess = null;
    const finish = () => app.exit(0);
    const force = setTimeout(() => {
      try {
        proc.kill("SIGKILL");
      } catch {}
      finish();
    }, 2000);
    proc.once("exit", () => {
      clearTimeout(force);
      finish();
    });
    try {
      proc.kill("SIGTERM");
    } catch {
      finish();
    }
  });

  // OS-level termination (shutdown, kill, Ctrl-C in terminal) → normal quit path
  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    process.on(sig, () => app.quit());
  }
}
