import { Type } from "@sinclair/typebox";

export function enhanceFieldSchemaWithInputSource(fieldSchema: any) {
  return Type.Object(
    {
      inputSource: Type.String({
        title: "Input source",
        enum: ["static_value", "step_output", "trigger_output"],
        default: "static_value",
      }),
    },
    {
      dependencies: {
        inputSource: {
          oneOf: [
            {
              properties: {
                inputSource: { const: "static_value" },
                staticValue: fieldSchema,
              },
              required: ["staticValue"],
            },
            {
              properties: {
                inputSource: { const: "step_output" },
                stepDetails: {
                  type: "object",
                  properties: {
                    stepId: { type: "string", minLength: 1 },
                    outputPath: { type: "string", minLength: 1 },
                  },
                  required: ["stepId", "outputPath"],
                },
              },
              required: ["stepDetails"],
            },
            {
              properties: {
                inputSource: { const: "trigger_output" },
                triggerDetails: {
                  type: "object",
                  properties: {
                    triggerId: { type: "string", minLength: 1 },
                    outputPath: { type: "string", minLength: 1 },
                  },
                  required: ["triggerId", "outputPath"],
                },
              },
              required: ["triggerDetails"],
            },
          ],
        },
      },
    }
  );
}
