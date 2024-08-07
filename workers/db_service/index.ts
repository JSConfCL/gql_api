import { RpcTarget, WorkerEntrypoint } from "cloudflare:workers";

import { createLogger } from "~/logging";
import { getDb, ORM_TYPE } from "~workers/db_service/db";
import { APP_ENV } from "~workers/db_service/env";
import { ENV } from "~workers/db_service/types";

export default class DBService extends WorkerEntrypoint<ENV> {
  logger = createLogger("DBService");
  NEON_URL = "";

  DB: ORM_TYPE | null = null;

  constructor(ctx: ExecutionContext, env: ENV) {
    super(ctx, env);
    const { NEON_URL, HYPERDRIVE } = env;

    if (!NEON_URL) {
      throw new Error("NEON_URL is required");
    }

    if (!HYPERDRIVE) {
      throw new Error("HYPERDRIVE is required");
    }

    const DB_URL =
      HYPERDRIVE.connectionString.startsWith("postgresql://fake-user:fake") &&
      APP_ENV === "development"
        ? NEON_URL
        : HYPERDRIVE.connectionString;

    this.DB = getDb({
      neonUrl: DB_URL,
      logger: this.logger,
    });
  }

  fetch() {
    return new Response("ok");
  }

  getConnection(): ORM_TYPE {
    if (!this.DB) {
      this.DB = getDb({
        neonUrl: this.env.NEON_URL,
        logger: this.logger,
      });
    }

    return this.DB;
  }
}
