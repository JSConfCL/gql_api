import { Resvg, initWasm } from "@resvg/resvg-wasm";
import { Hono } from "hono";
import { QR } from "qr-svg";

import { createLogger } from "~/logging";

// @ts-expect-error This import actually exists
import resvgwasm from "./index_bg.wasm";

const app = new Hono();

app.get("/qr/raw/:id", (c) => {
  const logger = createLogger("qr-render");
  const text = c.req.param("id").trim().toLowerCase();

  logger.info("Rendering QR code for text", { text });
  const svg = QR(text);

  return c.text(svg);
});

app.get("/qr/svg/:id", (c) => {
  const text = c.req.param("id").trim().toLowerCase();
  const logger = createLogger("qr-render");

  logger.info("Rendering QR code for text", { text });
  const svg = QR(text);

  c.res.headers.set("Content-Type", "image/svg+xml");

  return c.text(svg);
});

app.get("/qr/png/:id", async (c) => {
  const logger = createLogger("qr-render-png");
  const text = c.req.param("id").trim().toLowerCase();

  try {
    await initWasm(resvgwasm as WebAssembly.Module);
  } catch (error) {
    logger.error("Resvg wasm not initialized");
  }

  logger.info("Rendering QR code for text", { text });

  const svg = QR(text);

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

app.get("/qr/raw/url/:encoded_url", (c) => {
  const logger = createLogger("qr-render-raw");
  const encodedUrl = c.req.param("encoded_url").trim().toLowerCase();

  const url = decodeURIComponent(encodedUrl);

  logger.info("Rendering QR code for url", { url });
  const svg = QR(url);

  return c.text(svg);
});

app.get("/qr/svg/url/:encoded_url", (c) => {
  const logger = createLogger("qr-render-svg");
  const encodedUrl = c.req.param("encoded_url").trim().toLowerCase();

  const url = decodeURIComponent(encodedUrl);

  logger.info("Rendering QR code for url", { url });
  const svg = QR(url);

  c.res.headers.set("Content-Type", "image/svg+xml");

  return c.text(svg);
});

app.get("/qr/png/url/:encoded_url", (c) => {
  const logger = createLogger("qr-render-png");
  const encodedUrl = c.req.param("encoded_url").trim().toLowerCase();

  try {
    const url = decodeURIComponent(encodedUrl);

    logger.info("Rendering QR code for url", { url });

    const svg = QR(url);

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
  } catch (error) {
    logger.error("Error rendering QR code for url", { error });
    throw error;
  }
});

app.get("/", (c) => {
  return c.json({
    message: "Greetings and salutations from the CommunityOS team",
  });
});

export default app;
