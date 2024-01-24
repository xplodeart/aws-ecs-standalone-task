import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"], // Build for commonJS and ESmodules
  //dts: true,
  dts: {
    resolve: true,
    entry: ["./src/index.ts"],
    compilerOptions: {
      moduleResolution: "node",
    },
  },
  splitting: false,
  sourcemap: true,
  clean: true,
});
