import express from "express";
import { handleError } from "@/api/error-handler";
import { openApiRouter } from "@/api/openapi";
import { petsRouter } from "@/api/pets/routes";
import { sheltersRouter } from "@/api/shelters/routes";
import { usersRouter } from "@/api/users/routes";

export const app = express();

app.use(express.json());

app.get("/", (_, res) => {
  res.redirect("/api/docs");
});

app.use("/api", openApiRouter);
app.use("/api", usersRouter);
app.use("/api", sheltersRouter);
app.use("/api", petsRouter);

app.use(handleError);
