import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "react-hot-toast": fileURLToPath(new URL("./src/utils/reactHotToast.js", import.meta.url)),
      "react-swipeable": fileURLToPath(new URL("./src/utils/reactSwipeable.js", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/tests/setup.js",
    globals: true,
  },
});
