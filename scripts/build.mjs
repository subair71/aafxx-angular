import { spawn } from "node:child_process";
import { configureBuild } from "./configure-build.mjs";
const child = spawn(process.execPath, ["node_modules/@angular/cli/bin/ng.js", "build", ...process.argv.slice(2)], { stdio: "inherit" });
child.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
const code = await new Promise((resolve) => child.on("exit", resolve));
if (code !== 0) process.exit(typeof code === "number" ? code : 1);
await configureBuild();
