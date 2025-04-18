import { defineConfig } from "tsup"

const isDev = process.env.npm_lifecycle_event === "start:dev"

export default defineConfig({
	clean: true,
	dts: true,
	entry: ["src/main.ts"],
	format: ["esm"],
	minify: !isDev,
	metafile: !isDev,
	sourcemap: true,
	target: "node22",
	// shims: true,
	outDir: "dist",
	onSuccess: isDev ? "node dist/main.js" : undefined,
	external: ["../prisma/client"],
	banner: {
		// 		js: `
		// // BANNER START
		// const require = (await import("node:module")).createRequire(import.meta.url);
		// const __filename = (await import("node:url")).fileURLToPath(import.meta.url);
		// const __dirname = (await import("node:path")).dirname(__filename);
		// // BANNER END
		// `
	}
})
