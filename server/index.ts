import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./googleAuth";

// Extend Express Request type for session
declare module "express-serve-static-core" {
  interface Request {
    session?: Record<string, any>;
  }
}

const app = express();

// Session middleware (simple in-memory sessions for development)
const sessions = new Map<string, Record<string, any>>();

app.use((req: Request, res: Response, next: NextFunction) => {
  const sessionId = req.headers["session-id"]?.toString() || Math.random().toString(36);
  req.session = sessions.get(sessionId) || {};
  res.setHeader("session-id", sessionId);

  // Bind the original `end` and replace with a wrapper that accepts
  // any arguments. Using `any` here avoids TypeScript overload
  // incompatibilities when assigning to `res.end`.
  const originalEnd = (res.end as (...args: any[]) => Response).bind(res);

  (res as any).end = function (...args: any[]) {
    sessions.set(sessionId, req.session!);
    return originalEnd(...args);
  };

  next();
});

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json.bind(res);
  res.json = function (bodyJson: any) {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Setup manual authentication first
  await setupAuth(app);

  const server = await registerRoutes(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite or static files
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start server
  const port = parseInt(process.env.PORT || "5000", 10);
  const listenOptions: any = { port, host: "0.0.0.0" };
  if (process.platform !== "win32") {
    listenOptions.reusePort = true;
  }

  server.listen(listenOptions, () => {
    log(`serving on port ${port}`);
  });
})();