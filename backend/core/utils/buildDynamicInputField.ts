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
                    outputPath: { type: "string", minLength: 1 },
                  },
                  required: ["outputPath"],
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

export function enhanceFieldObjectSchemaWithInputSource(fieldSchema: any) {
  return {
    type: "object",
    additionalProperties: {
      type: "object",
      properties: {
        inputSource: {
          type: "string",
          enum: ["static_value", "step_output", "trigger_output"],
          default: "static_value",
        },
      },
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
                    outputPath: { type: "string", minLength: 1 },
                  },
                  required: ["outputPath"],
                },
              },
              required: ["triggerDetails"],
            },
          ],
        },
      },
    },
  };
}
