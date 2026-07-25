import { app } from "./app.js";
import { config } from "./config.js";

app.listen(config.PORT, () => {
  console.log(`LeadFlow API listening on http://localhost:${config.PORT}`);
});
