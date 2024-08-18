import { Resvg, initWasm } from "@resvg/resvg-wasm";
import { Hono } from "hono";
import { QR } from "qr-svg";
import * as React from "react";
import satori from "satori";

import { createLogger } from "~/logging";
import { isValidUUID } from "~/schema/shared/helpers";
import { loadGoogleFont } from "~workers/svg_renderer/loadGoogleFont";

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

const toUpperCase = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

app.get("/hackathon/og/:userName/:tag/:eventName/:date", async (c) => {
  const userName = c.req.param("userName").trim();
  const tag = c.req.param("tag").trim();
  const eventName = c.req.param("eventName").trim();
  const date = c.req.param("date").trim();

  if (!userName || !tag || !eventName || !date) {
    throw new Error("Invalid parameters");
  }

  const poppins = await loadGoogleFont({
    family: "Poppins",
    weight: 400,
  });

  try {
    const svg = await satori(
      <div
        style={{
          height: 1200,
          width: 675,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "black",
          fontFamily: "Poppins",
          fontSize: 32,
          fontWeight: 600,
          padding: 50,
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            color: "white",
            marginBottom: 50,
          }}
        >
          <span>IA en Chile</span>
          <span>{date}</span>
        </div>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            color: "white",
            marginBottom: 20,
          }}
        >
          <span
            style={{
              width: 180,
              height: 180,
              backgroundColor: "white",
              borderRadius: "50%",
            }}
          />
          <span
            style={{
              width: 180,
              height: 180,
              backgroundColor: "white",
              borderRadius: "50%",
            }}
          />
          <span
            style={{
              width: 180,
              height: 180,
              backgroundColor: "white",
              borderRadius: "50%",
            }}
          />
        </div>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            color: "white",
            marginBottom: 60,
          }}
        >
          <span
            style={{
              width: 180,
              height: 180,
              backgroundColor: "white",
              borderRadius: "50%",
            }}
          />
          <span
            style={{
              width: 180,
              height: 180,
              backgroundColor: "white",
              borderRadius: "50%",
            }}
          />
          <span
            style={{
              width: 180,
              height: 180,
              backgroundColor: "white",
              borderRadius: "50%",
            }}
          />
        </div>
        <div
          style={{
            fontSize: 45,
            textAlign: "left",
            color: "white",
            display: "flex",
            marginBottom: 30,
          }}
        >
          {eventName}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "100%",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 38,
              textAlign: "left",
              color: "white",
              display: "flex",
              width: "100%",
            }}
          >
            {userName}
          </div>
          <div
            style={{
              fontSize: 30,
              textAlign: "left",
              color: "white",
              display: "flex",
              width: "100%",
            }}
          >
            {tag}
          </div>
        </div>
      </div>,
      {
        height: 1080,
        width: 1920,
        fonts: [
          {
            name: "Poppins",
            data: poppins,
            weight: 400,
            style: "normal",
          },
        ],
      },
    );

    c.res.headers.set("Content-Type", "image/svg+xml");

    return c.text(svg);
  } catch (error) {
    console.error(error);
    throw new Error("Invalid parameters");
  }
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
