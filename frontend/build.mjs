// Bundle the card into a single file that the integration serves.
import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");
const options = {
  entryPoints: ["src/zeitprofil-card.ts"],
  outfile: "../custom_components/zeitprofil/frontend/zeitprofil-card.js",
  bundle: true,
  format: "esm",
  target: "es2021",
  minify: !watch,
  legalComments: "none",
  logLevel: "info",
  banner: { js: "/* zeitprofil-card – built from frontend/src, do not edit */" },
};

if (watch) {
  const context = await esbuild.context(options);
  await context.watch();
} else {
  await esbuild.build(options);
}
