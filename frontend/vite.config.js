import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxies /api to the Spring Boot backend so the frontend can just call
// fetch("/api/...") with no CORS dance and no hardcoded port during dev.
export default defineConfig({
	plugins: [react()],
	server: {
		port: 5173,
		// This project lives on /mnt/c (Windows filesystem) while the dev server
		// runs inside WSL. Windows-side file edits do NOT emit inotify events
		// that WSL can see, so the default watcher silently misses every change
		// and keeps serving stale modules. Polling is the standard workaround.
		watch: {
			usePolling: true,
			interval: 300
		},
		proxy: {
			"/api": {
				target: "http://localhost:8080",
				changeOrigin: true
			}
		}
	}
});
