import { BasePlugin } from "../../core/basePlugin";
import { WorkflowContext } from "../../workflowContext";
import { Type, Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const HttpRequestInputSchema = Type.Object({
  url: Type.String({ format: "uri" }),
  method: Type.String({ enum: ["GET", "POST"] }),
  body: Type.Optional(Type.Any()),
});

const HttpRequestOutputSchema = Type.Object({
  statusCode: Type.Number(),
  response: Type.Any(),
});

export type HttpRequestInput = Static<typeof HttpRequestInputSchema>;
export type HttpRequestOutput = Static<typeof HttpRequestOutputSchema>;

export default class HttpRequestPlugin implements BasePlugin {
  getPluginInfo() {
    return {
      id: "http-request",
      name: "HTTP Request",
      description: "Makes an HTTP request to a specified URL",
      inputs: HttpRequestInputSchema,
      outputs: HttpRequestOutputSchema,
    };
  }

  async execute(
    inputs: HttpRequestInput,
    context: WorkflowContext
  ): Promise<HttpRequestOutput> {
    const isValid = Value.Check(HttpRequestInputSchema, inputs);
    if (!isValid) {
      throw new Error("Invalid input provided");
    }

    try {
      // Simulate HTTP request
      console.log(`Making ${inputs.method} request to ${inputs.url}`);
      return { statusCode: 200, response: { message: "Success" } };
    } catch (error) {
      throw new Error("HTTP request failed");
    }
  }
}
