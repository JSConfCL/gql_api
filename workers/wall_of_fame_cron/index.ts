import { P } from "pino";

import { scheduled } from "./scheduled";

export default {
  scheduled,
  fetch() {
    return new Response(null, {
      status: 404,
    });
  },
};
