import { queueConsumer } from "./consumer";

export default {
  queue: queueConsumer,
  fetch() {
    return new Response(null, {
      status: 404,
    });
  },
};
