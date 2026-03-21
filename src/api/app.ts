import cors from "cors";
import express from "express";
import { handleError } from "#/api/error-handler.js";
import { openApiRouter } from "#/api/openapi.js";
import { petsRouter } from "#/api/pets/routes.js";
import { sheltersRouter } from "#/api/shelters/routes.js";
import { usersRouter } from "#/api/users/routes.js";

export const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (_, res) => {
  res.redirect("/docs");
});
app.use(openApiRouter);
app.use(usersRouter);
app.use(sheltersRouter);
app.use(petsRouter);

app.use(handleError);
