import type { RequestInfo } from "@cloudflare/workers-types";
import type { CloudflareWorkersHandler } from "@as-integrations/cloudflare-workers";
import { createGraphQLHandler } from "~/handlers/apollo";

const graphQLOptions: GraphQLOptions = {
  baseEndpoint: GRAPHQL_BASE_ENDPOINT,
  kvCache: Boolean(GRAPHQL_KV_CACHE),
};

const handleGraphQLRequest: CloudflareWorkersHandler =
  createGraphQLHandler(graphQLOptions);

const handleRequest = async (
  request: FetchEvent["request"],
): Promise<Response> => {
  const { pathname } = new URL(request.url);

  try {
    if (pathname === graphQLOptions.baseEndpoint) {
      return handleGraphQLRequest(request);
    }

    return graphQLOptions?.forwardUnmatchedRequestsToOrigin
      ? fetch(request)
      : new Response("Not found", { status: 404 });
  } catch (err: unknown) {
    return new Response(
      graphQLOptions?.debug ? (err as Error).message : "Something went wrong",
      {
        status: 500,
      },
    );
  }
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});
