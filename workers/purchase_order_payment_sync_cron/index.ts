import { scheduled } from "./scheduled";

export default {
  scheduled,
  // eslint-disable-next-line @typescript-eslint/require-await
  async fetch() {
    return new Response(".");
  },
};
