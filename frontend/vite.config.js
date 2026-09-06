import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Polling costs real CPU: it re-stats the whole tree every `interval` ms
// forever, which on Windows slows both startup and every HMR round-trip.
//
// It is only *needed* when the dev server runs inside WSL against a project on
// /mnt/c, because Windows-side edits emit no inotify events WSL can see, so the
// default watcher misses every change and serves stale modules. Running
// natively on Windows (or on Linux, or on macOS) the native watcher is correct
// and much cheaper - so this is opt-in via VITE_USE_POLLING=1 rather than
// always-on.
const usePolling = process.env.VITE_USE_POLLING === "1";

// Proxies /api to the Spring Boot backend so the frontend can just call
// fetch("/api/...") with no CORS dance and no hardcoded port during dev.
export default defineConfig({
	plugins: [react()],
	// Pre-bundling these on first boot instead of discovering them mid-request
	// avoids the "page loads, then reloads itself" stall on a cold start.
	optimizeDeps: {
		include: ["react", "react-dom", "react-dom/client", "leaflet", "react-leaflet"]
	},
	server: {
		port: 5173,
		watch: usePolling ? { usePolling: true, interval: 300 } : undefined,
		proxy: {
			"/api": {
				target: "http://localhost:8080",
				changeOrigin: true
			}
		}
	}
});
