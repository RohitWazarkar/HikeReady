// Data-source mode: a manual override for where data is read from.
//
//   "auto"    -> DB first, automatic JSON fallback on failure (default)
//   "online"  -> DB first, still falls back to JSON if the DB is down
//   "offline" -> JSON files only (never touches the DB)
//
// The mode is stored in a cookie so SERVER components (which do the data
// fetching) can read it. The Settings page lets the user switch it.

import { cookies } from "next/headers";

export const DATA_SOURCE_COOKIE = "hikeready-datasource";
export const MODES = ["auto", "online", "offline"];
export const DEFAULT_MODE = "auto";

// Read the current mode from cookies (server-only). Returns "auto" by default.
export async function getDataSourceMode() {
  try {
    const store = await cookies();
    const value = store.get(DATA_SOURCE_COOKIE)?.value;
    return MODES.includes(value) ? value : DEFAULT_MODE;
  } catch {
    // Called outside a request scope (e.g. scripts) -> default.
    return DEFAULT_MODE;
  }
}
