import { trace as OpenTelemetryTrace } from "@opentelemetry/api";
import { AttributeNames, SpanNames } from "@pothos/tracing-opentelemetry";
import { print } from "graphql";
import { Plugin } from "graphql-yoga";

export const trace = OpenTelemetryTrace;
export const tracer = OpenTelemetryTrace.getTracer("graphql-api");

export const tracingPlugin: Plugin = {
  onExecute: ({ setExecuteFn, executeFn }) => {
    setExecuteFn((options) =>
      tracer.startActiveSpan(
        SpanNames.EXECUTE,
        {
          attributes: {
            [AttributeNames.OPERATION_NAME]: options.operationName ?? undefined,
            [AttributeNames.SOURCE]: print(options.document),
          },
        },
        async (span) => {
          try {
            const result = (await executeFn(options)) as unknown;

            return result;
          } catch (error) {
            span.recordException(error as Error);
            throw error;
          } finally {
            span.end();
          }
        },
      ),
    );
  },
};
