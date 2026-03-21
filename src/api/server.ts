import { app } from "#/api/app.js";
import { port } from "#/env.js";

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
