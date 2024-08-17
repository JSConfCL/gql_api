import { Resvg, initWasm } from "@resvg/resvg-wasm";
import { Hono } from "hono";
import { QR } from "qr-svg";

import { createLogger } from "~/logging";
import { isValidUUID } from "~/schema/shared/helpers";

// @ts-expect-error This import actually exists
import resvgwasm from "./index_bg.wasm";

const app = new Hono();

app.get("/qr/raw/:id", (c) => {
  const logger = createLogger("qr-render");
  const uuid = c.req.param("id").trim().toLowerCase();

  if (!isValidUUID(uuid)) {
    logger.error("Invalid id");
    throw new Error("Invalid id");
  }

  const svg = QR(uuid);

  return c.text(svg);
});

app.get("/qr/svg/:id", (c) => {
  const logger = createLogger("qr-render");
  const uuid = c.req.param("id").trim().toLowerCase();

  if (!isValidUUID(uuid)) {
    logger.error("Invalid id");
    throw new Error("Invalid id");
  }

  const svg = QR(uuid);

  c.res.headers.set("Content-Type", "image/svg+xml");

  return c.text(svg);
});

app.get("/qr/png/:id", async (c) => {
  const logger = createLogger("qr-render-png");
  const uuid = c.req.param("id").trim().toLowerCase();

  if (!isValidUUID(uuid)) {
    logger.error("Invalid id");
    throw new Error("Invalid id");
  }

  try {
    await initWasm(resvgwasm as WebAssembly.Module);
  } catch (error) {
    logger.error("Resvg wasm not initialized");
  }

  const svg = QR(uuid);

  const resvg = new Resvg(svg, {
    background: "white",
    fitTo: {
      mode: "width",
      value: 1200,
    },
    font: {
      loadSystemFonts: false,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  c.res.headers.set("Content-Type", "image/png");

  return new Response(pngBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, immutable, no-transform, max-age=31536000",
    },
    status: 200,
  });
});

app.get("/", (c) => {
  return c.json({
    message: "Greetings and salutations from the CommunityOS team",
  });
});

export default app;
