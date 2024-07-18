import { pino } from "pino";

const defaultLogger = pino({
  browser: {
    asObject: true,
  },
  transport: {
    target: "pino-pretty",
  },
});

export const createLogger = (
  name: string,
  params: { [key in string]: string | number | undefined | null } = {},
) => {
  return defaultLogger.child({
    loggerName: name,
    ...params,
  });
};
