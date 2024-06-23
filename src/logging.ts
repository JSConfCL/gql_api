import { pino } from "pino";

const defaultLogger = pino({
  browser: {
    asObject: true,
  },
  transport: {
    target: "pino-pretty",
  },
});

export const logger = defaultLogger;

export const createLogger = (name: string) => {
  return defaultLogger.child({ loggerName: name });
};
