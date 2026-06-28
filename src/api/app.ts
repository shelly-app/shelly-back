import cors from "cors";
import express from "express";
import { contactRouter } from "@/api/contact/routes";
import { handleError } from "@/api/error-handler";
import { openApiRouter } from "@/api/openapi";
import { petsRouter } from "@/api/pets/routes";
import { publicAdoptionRequestsRouter } from "@/api/shelters/adoption-requests/routes";
import { publicSheltersRouter, sheltersRouter } from "@/api/shelters/routes";
import { usersRouter } from "@/api/users/routes";
import { corsOrigins } from "@/env";

export const app = express();

app.use(
  cors({
    // When no explicit allow-list is configured, reflect the request origin so
    // browser clients (e.g. the Vite dev server) work out of the box.
    origin: corsOrigins && corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/", (_, res) => {
  res.redirect("/api/docs");
});

app.use("/api", openApiRouter);

// Public, unauthenticated routes must be registered before the authenticated
// routers so their requests are not intercepted by auth middleware.
app.use("/api", contactRouter);
app.use("/api", publicAdoptionRequestsRouter);
app.use("/api", publicSheltersRouter);

app.use("/api", usersRouter);
app.use("/api", sheltersRouter);
app.use("/api", petsRouter);

app.use(handleError);
