#!/usr/bin/env node
/**
 * Tiny zero-dependency static server for local development.
 * Vercel serves the site directly in production; this only exists so
 * `npm run dev` works without installing a package.
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

async function statOrNull(filePath) {
  try {
    return await stat(filePath);
  } catch {
    return null;
  }
}

function send(response, status, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(body);
}

async function resolveFile(pathname) {
  const relativePath = decodeURIComponent(pathname).replace(/^\/+/, "");
  let filePath = resolve(ROOT, relativePath || ".");

  if (filePath !== ROOT && !filePath.startsWith(ROOT + sep)) {
    return { forbidden: true };
  }

  let info = await statOrNull(filePath);

  if (pathname.endsWith("/") || info?.isDirectory()) {
    filePath = join(filePath, "index.html");
    info = await statOrNull(filePath);
  }

  if (!info?.isFile() && !extname(filePath)) {
    const htmlPath = `${filePath}.html`;
    const htmlInfo = await statOrNull(htmlPath);
    if (htmlInfo?.isFile()) {
      filePath = htmlPath;
      info = htmlInfo;
    }
  }

  return info?.isFile() ? { filePath } : { notFound: true };
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method Not Allowed");
    return;
  }

  try {
    const url = new URL(
      request.url ?? "/",
      `http://${request.headers.host ?? "localhost"}`,
    );
    const result = await resolveFile(url.pathname);

    if (result.forbidden) {
      send(response, 403, "Forbidden");
      return;
    }

    if (result.notFound) {
      const notFoundPage = await readFile(join(ROOT, "404.html")).catch(() => null);
      send(
        response,
        404,
        notFoundPage ?? "Not Found",
        "text/html; charset=utf-8",
      );
      return;
    }

    const body = await readFile(result.filePath);
    const type = MIME_TYPES[extname(result.filePath).toLowerCase()] ?? "application/octet-stream";

    response.writeHead(200, {
      "Content-Type": type,
      "Content-Length": body.byteLength,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch (error) {
    console.error(error);
    send(response, 500, "Internal Server Error");
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Try: PORT=4000 npm run dev`);
  } else {
    console.error(error);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`CamDX Hackathon 2026 → http://${HOST}:${PORT}`);
});
