import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://192.168.100.5:5000", // change to your backend server
        changeOrigin: true,
      },
    },
  },

  plugins: [react()],
});
