import { Hono } from "hono";
import { QR } from "qr-svg";

import { createLogger } from "~/logging";
import { isValidUUID } from "~/schema/shared/helpers";

const app = new Hono();

app.get("/qr/:id", (c) => {
  const logger = createLogger("qr-render");
  const uuid = c.req.param("id").trim().toLowerCase();

  if (!isValidUUID(uuid)) {
    logger.error("Invalid id");
    throw new Error("Invalid id");
  }

  const svg = QR(uuid);

  return c.text(svg);
});

app.get("/", (c) => {
  return c.json({
    message: "Greetings and salutations from the CommunityOS team",
  });
});

export default app;
