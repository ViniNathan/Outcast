import { createContext } from "@backend/api/context";
import { appRouter } from "@backend/api/routers/index";
import { env } from "@backend/env/server";
import { cors } from "@elysiajs/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Elysia } from "elysia";

const app = new Elysia()
  .use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST", "OPTIONS"],
    }),
  )
  .all("/trpc/*", async (context) => {
    const res = await fetchRequestHandler({
      endpoint: "/trpc",
      router: appRouter,
      req: context.request,
      createContext: () => createContext({ context }),
    });
    return res;
  })
  .get("/", () => "OK")
  .listen(env.PORT, () => {
    console.log(`Server is running on http://localhost:${env.PORT}`);
  });
