/// <reference types="vite/client" />

/**
 * Build-time configuration, read from `.env` files by Vite.
 *
 * API URL and event slug are optional; mock mode is opt-in and defaults off.
 */
interface ImportMetaEnv {
  /** Base URL of the BreachPoint API, e.g. http://localhost:8080 */
  readonly VITE_API_BASE_URL?: string;
  /** Use the built-in in-memory CTF instead of making API requests. */
  readonly VITE_USE_MOCK_API?: string;
  /** Slug of the event this build plays, e.g. breachpoint-2026-r1 */
  readonly VITE_EVENT_SLUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
