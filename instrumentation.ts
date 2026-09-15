// Server startup hook.
// Node 25 exposes an experimental global `localStorage` that exists but throws
// on use unless --localstorage-file is given a valid path. Isomorphic libraries
// check `typeof localStorage !== "undefined"` to detect browsers, so the broken
// global crashes SSR. Delete it at startup if it's non-functional.
export async function register() {
  try {
    const ls = (globalThis as Record<string, unknown>).localStorage as
      | Storage
      | undefined;
    if (ls) {
      ls.getItem("__probe__");
    }
  } catch {
    delete (globalThis as Record<string, unknown>).localStorage;
  }
}
