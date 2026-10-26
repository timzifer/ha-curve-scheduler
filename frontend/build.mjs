// Bundle the card into a single file that the integration serves.
import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");
const options = {
  entryPoints: ["src/curve-scheduler-card.ts"],
  outfile: "../custom_components/curve_scheduler/frontend/curve-scheduler-card.js",
  bundle: true,
  format: "esm",
  target: "es2021",
  minify: !watch,
  legalComments: "none",
  logLevel: "info",
  banner: { js: "/* curve-scheduler-card – built from frontend/src, do not edit */" },
};

if (watch) {
  const context = await esbuild.context(options);
  await context.watch();
} else {
  await esbuild.build(options);
}
