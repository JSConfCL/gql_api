import {
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
  trace,
} from "@opentelemetry/api";
// import {
//   AutoLoaderOptions,
//   registerInstrumentations,
// } from "@opentelemetry/instrumentation";
import {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
  AlwaysOnSampler,
  BasicTracerProvider,
} from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
export const provider = new BasicTracerProvider({
  sampler: new AlwaysOnSampler(),
});

const exporter = new OTLPTraceExporter({
  url: "http://localhost:4317",
});

provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
provider.register();

// const tracer = openTelemetry.trace.getTracer("example-basic-tracer-node");

// registerInstrumentations({
//   // Automatically create spans for http requests
//   // instrumentations: [new HttpInstrumentation()],
// } as AutoLoaderOptions);

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

export const tracer = trace.getTracer("graphql");
