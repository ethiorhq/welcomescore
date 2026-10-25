import fs from "node:fs";
import path from "node:path";

const assetsDir = path.resolve(".open-next/assets");
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

fs.writeFileSync(
  path.join(assetsDir, "_worker.js"),
  `export default {
  async fetch(request, env, ctx) {
    if (env.NEXT_WORKER) {
      return env.NEXT_WORKER.fetch(request);
    }
    return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Not found", { status: 404 });
  }
};`
);

fs.writeFileSync(path.join(assetsDir, ".assetsignore"), `_worker.js\n`);
console.log("Pages _worker.js and .assetsignore prepared.");
