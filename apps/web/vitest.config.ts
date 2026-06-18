import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),

        },
    },
    test: {
        pool: "threads",
        environment: "jsdom",
        globals: true,
        setupFiles: ["./vitest.setup.ts"],
        css: true,
    },
});
