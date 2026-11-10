const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const host = process.env.HOST || "127.0.0.1";
const preferredPort = Number(process.env.PORT) || 3000;
const maxPort = preferredPort + 10;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const relative = decoded.replace(/^\/+/, "") || "index.html";
  const resolved = path.normalize(path.join(root, relative));
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

const server = http.createServer((req, res) => {
  let filePath = safePath(req.url || "/");
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        if (readErr.code === "ENOENT" && !req.url?.includes(".")) {
          fs.readFile(path.join(root, "index.html"), (fallbackErr, html) => {
            if (fallbackErr) {
              res.writeHead(404);
              res.end("Not found");
              return;
            }
            res.writeHead(200, { "Content-Type": MIME[".html"] });
            res.end(html);
          });
          return;
        }
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      res.end(data);
    });
  });
});

let tryPort = preferredPort;

server.on("listening", () => {
  const bound = server.address();
  const port = typeof bound === "object" && bound ? bound.port : tryPort;
  console.log(`Serving ${root}`);
  console.log(`Open http://${host}:${port}/`);
  if (port !== preferredPort) {
    console.log(`(Port ${preferredPort} was busy; using ${port} instead.)`);
  }
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE" && tryPort < maxPort) {
    tryPort += 1;
    server.listen(tryPort, host);
    return;
  }
  if (err.code === "EADDRINUSE") {
    console.error(
      `Ports ${preferredPort}–${maxPort} are in use. Stop the other process or run: $env:PORT=3011; npm run dev`,
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});

server.listen(tryPort, host);
