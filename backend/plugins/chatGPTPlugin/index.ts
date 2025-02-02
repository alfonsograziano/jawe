import { BasePlugin } from "../../core/basePlugin";
import { Type, Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { enhanceFieldSchemaWithInputSource } from "../../core/utils/buildDynamicInputField";
import OpenAI from "openai";

const ApiKeyType = Type.String({
  title: "API Key",
  description: "The OpenAI API key for authentication.",
});

const ModelType = Type.String({
  title: "Model",
  description:
    "The name of the OpenAI model to use (e.g., gpt-4, gpt-3.5-turbo).",
});

const PromptType = Type.String({
  title: "Prompt",
  description: "The prompt to provide to the model.",
});

const InputSchema = Type.Object({
  apiKey: enhanceFieldSchemaWithInputSource(ApiKeyType),
  model: enhanceFieldSchemaWithInputSource(ModelType),
  prompt: enhanceFieldSchemaWithInputSource(PromptType),
});

const ResolvedInputSchema = Type.Object({
  apiKey: ApiKeyType,
  model: ModelType,
  prompt: PromptType,
});

const OutputSchema = Type.Object({
  result: Type.String({
    title: "Result",
    description: "The response from the model.",
  }),
});

export type ChatGPTInput = Static<typeof ResolvedInputSchema>;
export type ChatGPTOutput = Static<typeof OutputSchema>;

export default class ChatGPTPlugin implements BasePlugin {
  getPluginInfo() {
    return {
      id: "chatgpt-plugin",
      name: "ChatGPT Plugin",
      description: "A plugin to interact with OpenAI's language models.",
      inputs: InputSchema,
      outputs: OutputSchema,
    };
  }

  async execute(inputs: ChatGPTInput): Promise<ChatGPTOutput> {
    const isValid = Value.Check(ResolvedInputSchema, inputs);
    if (!isValid) {
      throw new Error("Invalid input provided");
    }

    const openai = new OpenAI({
      apiKey: inputs.apiKey, // Use the API key from the inputs
    });

    const response = await openai.chat.completions.create({
      model: inputs.model,
      messages: [{ role: "user", content: inputs.prompt }],
    });

    const result = response.choices[0]?.message?.content?.trim() || "";

    return { result };
  }
}
