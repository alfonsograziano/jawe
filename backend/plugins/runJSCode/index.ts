import { BasePlugin } from "../../core/basePlugin";
import { Type, Static } from "@sinclair/typebox";
import { spawn } from "child_process";
import path from "path";
import { Value } from "@sinclair/typebox/value";
import { fileURLToPath } from "url";
import { enhanceFieldSchemaWithInputSource } from "../../core/utils/buildDynamicInputField";

const InputSchema = Type.Object({
  variables: Type.Array(enhanceFieldSchemaWithInputSource(Type.String()), {
    title: "Variables",
  }),
  code: Type.String({
    title: "Code",
    description: "JavaScript code to execute",
  }),
});

const ResolvedInputSchema = Type.Object({
  variables: Type.Array(Type.String(), {
    title: "Variables",
  }),
  code: Type.String({
    title: "Code",
    description: "JavaScript code to execute",
  }),
});

const OutputSchema = Type.Object({
  result: Type.Any({ description: "Result of the executed JavaScript code" }),
});

export type ExecuteJSInput = Static<typeof ResolvedInputSchema>;
export type ExecuteJSOutput = Static<typeof OutputSchema>;

export default class ExecuteJS implements BasePlugin {
  getPluginInfo() {
    return {
      id: "execute-js",
      name: "Execute JS",
      description:
        "A plugin that executes arbitrary JavaScript code with provided variables in a separate Node.js process",
      inputs: InputSchema,
      outputs: OutputSchema,
    };
  }

  async execute(inputs: ExecuteJSInput): Promise<ExecuteJSOutput> {
    const { variables: args, code } = inputs;

    const isValid = Value.Check(ResolvedInputSchema, inputs);
    if (!isValid) {
      throw new Error("Invalid input provided");
    }

    return new Promise((resolve, reject) => {
      // Path to the child process script
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const workerScriptPath = path.resolve(__dirname, "worker.js");

      // Spawn a new Node.js process
      const child = spawn("node", [workerScriptPath], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Handle data from the child process
      let outputData = "";
      let errorData = "";

      child.stdout.on("data", (data) => {
        outputData += data.toString();
      });

      child.stderr.on("data", (data) => {
        errorData += data.toString();
      });

      // Handle process completion
      child.on("close", (code) => {
        if (code !== 0) {
          return reject(
            new Error(`Child process exited with code ${code}: ${errorData}`)
          );
        }
        try {
          const result = JSON.parse(outputData);
          resolve({ result });
        } catch (error) {
          reject(
            new Error(
              `Failed to parse child process output: ${
                (error as Error).message
              }`
            )
          );
        }
      });

      // Send data to the child process
      const payload = JSON.stringify({ inputs: args, code });
      child.stdin.write(payload);
      child.stdin.end();
    });
  }
}
