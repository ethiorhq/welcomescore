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
    let response;
    if (env.NEXT_WORKER) {
      response = await env.NEXT_WORKER.fetch(request);
    } else if (env.ASSETS) {
      response = await env.ASSETS.fetch(request);
    } else {
      response = new Response("Not found", { status: 404 });
    }
    const headers = new Headers(response.headers);
    headers.set("alt-svc", "clear");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};`
);

fs.writeFileSync(path.join(assetsDir, ".assetsignore"), `_worker.js\n`);
console.log("Pages _worker.js and .assetsignore prepared.");
