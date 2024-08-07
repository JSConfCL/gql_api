import { it, describe, vi, expect } from "vitest";

import { enqueueEmail, sendTransactionalEmail } from "./index";

describe("Test email library", () => {
  describe("enqueueEmail", () => {
    it("Should enqueue an email", async () => {
      const spy = vi.fn().mockImplementation(() => {
        // do nothing
      });
      const mockedQueue = {
        send: spy,
      };
      const mockedLogger = {
        info: vi.fn().mockImplementation(() => {
          // do nothing
        }),
        debug: vi.fn().mockImplementation(() => {
          // do nothing
        }),
      };

      await enqueueEmail(
        // @ts-expect-error Estamos mockeando la cola de cloudflare
        mockedQueue,
        mockedLogger,
        {
          code: "123",
          userId: "123",
          to: "",
        },
      );

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe("sendTransactionalEmail", () => {
    it("Should consume an email", async () => {
      const spiedFetch = vi.fn().mockImplementation(() => {
        return { status: 200 };
      });

      global.fetch = spiedFetch;

      await sendTransactionalEmail(
        {
          RESEND_API_KEY: "123",
        },
        {
          from: "",
          to: "",
          subject: "",
          html: "",
        },
      );
    });

    it("Should error if status is over 400", async () => {
      const spiedFetch = vi.fn().mockImplementation(() => {
        return { status: 400 };
      });

      global.fetch = spiedFetch;

      try {
        await sendTransactionalEmail(
          {
            RESEND_API_KEY: "123",
          },
          {
            from: "",
            to: "",
            subject: "",
            html: "",
          },
        );
      } catch (e) {
        expect((e as Error).message).toBe("Error sending email");
      }
    });
  });
});
