/* eslint-disable no-console */
import { JsonObject } from "type-fest";

enum Levels {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
}

export class Logger {
  levels = Levels;
  name = "";
  extraParams: JsonObject = {};

  constructor(name: string, extraParams?: JsonObject) {
    this.name = name;

    this.extraParams = extraParams ?? {};
  }

  #loggerContent = (level: Levels, message: string | JsonObject) => {
    const time = new Date();

    return {
      time: time.valueOf(),
      readableTime: time.toISOString(),
      UTCTime: time.toUTCString(),
      loggerName: this.name,
      level,
      ...this.extraParams,
      ...(typeof message !== "string" ? message : {}),
      msg: message,
    };
  };

  #do_log(
    level: Levels,
    message: string | JsonObject,
    ...optionalParams: unknown[]
  ) {
    switch (level) {
      case Levels.INFO:
        console.info(this.#loggerContent(level, message), ...optionalParams);
        break;
      case Levels.WARN:
        console.warn(this.#loggerContent(level, message), ...optionalParams);
        break;
      case Levels.ERROR:
        console.error(this.#loggerContent(level, message), ...optionalParams);
        break;
      case Levels.DEBUG:
        console.debug(this.#loggerContent(level, message), ...optionalParams);
        break;
      default:
        console.log(this.#loggerContent(level, message), ...optionalParams);
    }
  }

  log(message: string | JsonObject, ...optionalParams: unknown[]) {
    this.#do_log(Levels.INFO, message, ...optionalParams);
  }

  info(message: string | JsonObject, ...optionalParams: unknown[]) {
    this.#do_log(Levels.INFO, message, ...optionalParams);
  }

  warn(message: string | JsonObject, ...optionalParams: unknown[]) {
    this.#do_log(Levels.WARN, message, ...optionalParams);
  }

  error(message: string | JsonObject | Error, ...optionalParams: unknown[]) {
    if (message instanceof Error) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { message: msg, name, stack } = message;

      this.#do_log(
        Levels.ERROR,
        msg,
        { name, stack: stack ?? "" },
        ...optionalParams,
      );
    } else {
      this.#do_log(Levels.ERROR, message, ...optionalParams);
    }
  }

  debug(message: string | JsonObject, ...optionalParams: unknown[]) {
    this.#do_log(Levels.DEBUG, message, ...optionalParams);
  }
}

export const createLogger = (name: string, extraParams?: JsonObject) => {
  return new Logger(name, extraParams);
};
