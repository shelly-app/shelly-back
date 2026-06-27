import { app } from "@/api/app";
import { port } from "@/env";

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
