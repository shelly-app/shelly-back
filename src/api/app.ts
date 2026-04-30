import cors from "cors";
import express from "express";
import { handleError } from "@/api/error-handler";
import { openApiRouter } from "@/api/openapi";
import { petsRouter } from "@/api/pets/routes";
import { sheltersRouter } from "@/api/shelters/routes";
import { usersRouter } from "@/api/users/routes";

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
