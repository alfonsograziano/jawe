import { BasePlugin } from "../../core/basePlugin";
import { Type, Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const HttpRequestInputSchema = Type.Object({
  url: Type.String(),
  method: Type.String({ enum: ["GET", "POST", "PUT", "DELETE", "PATCH"] }),
  headers: Type.Optional(Type.Record(Type.String(), Type.String())),
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
      description:
        "Makes an HTTP request to a specified URL with customizable options",
      inputs: HttpRequestInputSchema,
      outputs: HttpRequestOutputSchema,
    };
  }

  async execute(inputs: HttpRequestInput): Promise<HttpRequestOutput> {
    const isValid = Value.Check(HttpRequestInputSchema, inputs);
    if (!isValid) {
      throw new Error("Invalid input provided");
    }

    const { url, method, headers, body } = inputs;

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const responseData = await response.json();
      return {
        statusCode: response.status,
        response: responseData,
      };
    } catch (error) {
      throw new Error(`HTTP request failed: ${(error as Error).message}`);
    }
  }
}
