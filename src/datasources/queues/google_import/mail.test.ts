import { it, describe, vi, expect } from "vitest";
import { enqueueGooglePhotoImage, enqueueGooglePhotoImageBatch } from "./index";

const googleMediaType = {
  baseUrl: "some-base-url",
  mimeType: "image/jpeg",
  filename: "some-filename",
  id: "some-id",
  mediaMetadata: {
    creationTime: "some-creation-time",
    height: "some-height",
    width: "some-width",
    photo: {
      apertureFNumber: 2,
      cameraMake: "some-camera-make",
      cameraModel: "some-camera-model",
      focalLength: 1,
      isoEquivalent: 2,
    },
  },
};
describe("Test email library", () => {
  describe("enqueueEmail", () => {
    it("Should enqueue an email", async () => {
      const spy = vi.fn().mockImplementation(() => {
        // do nothing
      });
      const mockedQueue = {
        send: spy,
      } as unknown as Queue;
      await enqueueGooglePhotoImage(mockedQueue, {
        sanityEventId: "some-token",
        googleMedia: googleMediaType,
      });

      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("Should enqueue an email via BATCH api", async () => {
      const spy = vi.fn().mockImplementation(() => {
        // do nothing
      });
      const mockedQueue = {
        sendBatch: spy,
      } as unknown as Queue;
      await enqueueGooglePhotoImageBatch(mockedQueue, [
        {
          sanityEventId: "some-token",
          googleMedia: googleMediaType,
        },
        {
          sanityEventId: "some-token",
          googleMedia: googleMediaType,
        },
      ]);

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
