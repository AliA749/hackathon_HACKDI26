/**
 * Design tokens lifted verbatim from the UmmahMap inspiration mock so the
 * class names in that HTML (bg-surface-container-lowest, font-label-md, ...)
 * mean the same thing here. Material 3 naming: `surface`/`on-surface` pairs a
 * background with the foreground that is legible on it.
 */
export default {
	content: ["./index.html", "./src/**/*.{js,jsx}"],
	darkMode: "class",
	theme: {
		extend: {
			colors: {
				"secondary-fixed-dim": "#4edea3",
				"on-tertiary-fixed-variant": "#6e3900",
				"on-secondary-container": "#00714d",
				"on-secondary-fixed": "#002113",
				"surface-container-high": "#dce9ff",
				"on-secondary": "#ffffff",
				"surface-dim": "#cbdbf5",
				"on-surface": "#0b1c30",
				"on-tertiary": "#ffffff",
				"surface-container": "#e5eeff",
				"on-error-container": "#93000a",
				"on-primary-fixed": "#002117",
				"inverse-surface": "#213145",
				background: "#f8f9ff",
				"surface-variant": "#d3e4fe",
				"error-container": "#ffdad6",
				"on-surface-variant": "#3f4944",
				"on-background": "#0b1c30",
				"secondary-container": "#6cf8bb",
				"secondary-fixed": "#6ffbbe",
				"inverse-primary": "#8ed5b9",
				"on-tertiary-container": "#ffb477",
				secondary: "#006c49",
				tertiary: "#5c2f00",
				error: "#ba1a1a",
				"on-primary-container": "#8cd2b6",
				primary: "#004331",
				surface: "#f8f9ff",
				"on-tertiary-fixed": "#2f1500",
				"surface-container-highest": "#d3e4fe",
				"on-primary-fixed-variant": "#00513d",
				"tertiary-fixed-dim": "#ffb77d",
				"surface-bright": "#f8f9ff",
				"on-secondary-fixed-variant": "#005236",
				"outline-variant": "#bfc9c2",
				"surface-container-low": "#eff4ff",
				"primary-container": "#0d5c46",
				"surface-tint": "#226a53",
				"inverse-on-surface": "#eaf1ff",
				"surface-container-lowest": "#ffffff",
				"primary-fixed-dim": "#8ed5b9",
				"on-primary": "#ffffff",
				"tertiary-container": "#7d4200",
				"tertiary-fixed": "#ffdcc3",
				"on-error": "#ffffff",
				outline: "#6f7974",
				"primary-fixed": "#aaf1d4"
			},
			borderRadius: {
				DEFAULT: "0.25rem",
				lg: "0.5rem",
				xl: "0.75rem",
				full: "9999px"
			},
			spacing: {
				"max-width-content": "1280px",
				"gutter-2xl": "3rem",
				"margin-desktop": "2.5rem",
				"margin-tablet": "1.5rem",
				"gutter-lg": "1.5rem",
				"gutter-xs": "0.25rem",
				"gutter-md": "0.75rem",
				"gutter-base": "1rem",
				"gutter-xl": "2rem",
				"margin-mobile": "1rem",
				"gutter-sm": "0.5rem"
			},
			fontFamily: {
				"headline-sm": ["Plus Jakarta Sans", "system-ui", "sans-serif"],
				"body-lg": ["Plus Jakarta Sans", "system-ui", "sans-serif"],
				"body-base": ["Plus Jakarta Sans", "system-ui", "sans-serif"],
				"label-lg": ["Plus Jakarta Sans", "system-ui", "sans-serif"],
				"body-sm": ["Plus Jakarta Sans", "system-ui", "sans-serif"],
				"label-tag": ["Plus Jakarta Sans", "system-ui", "sans-serif"],
				"label-md": ["Plus Jakarta Sans", "system-ui", "sans-serif"],
				"headline-lg": ["Plus Jakarta Sans", "system-ui", "sans-serif"]
			},
			fontSize: {
				"headline-sm": ["18px", { lineHeight: "24px", letterSpacing: "-0.01em", fontWeight: "600" }],
				"body-lg": ["16px", { lineHeight: "24px", letterSpacing: "0em", fontWeight: "400" }],
				"body-base": ["14px", { lineHeight: "22px", letterSpacing: "0em", fontWeight: "400" }],
				"label-lg": ["14px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "600" }],
				"body-sm": ["12px", { lineHeight: "18px", letterSpacing: "0.01em", fontWeight: "400" }],
				"label-tag": ["11px", { lineHeight: "14px", letterSpacing: "0.04em", fontWeight: "700" }],
				"label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "600" }],
				"headline-lg": ["22px", { lineHeight: "28px", letterSpacing: "-0.015em", fontWeight: "700" }]
			}
		}
	},
	plugins: []
};
