import { describe, it, expect } from "vitest";
import HelloWorld from "../index";

describe("HelloWorld Plugin", () => {
  it("should return the correct plugin info", () => {
    const plugin = new HelloWorld();
    const pluginInfo = plugin.getPluginInfo();
    expect(JSON.parse(JSON.stringify(pluginInfo))).toEqual({
      name: "Hello World",
      id: "hello-world",
      description: "A plugin that takes a name as input and returns greetings",
      inputs: {
        type: "object",
        properties: {
          name: {
            minLength: 1,
            type: "string",
          },
        },
        required: ["name"],
      },
      outputs: {
        type: "object",
        properties: {
          greetings: {
            minLength: 1,
            type: "string",
          },
        },
        required: ["greetings"],
      },
    });
  });

  it("should return the correct greeting message", async () => {
    const plugin = new HelloWorld();
    const inputs = { name: "Alice" };
    const mockContext = {
      templateDefinition: {},
      run: {},
    };

    const result = await plugin.execute(inputs);

    expect(result).toEqual({
      greetings: "Hello Alice",
    });
  });

  it("should throw an error if name is missing", async () => {
    const plugin = new HelloWorld();
    const inputs = {} as { name: "1234" }; // Let's fake the type to trick TS :D
    const mockContext = {
      templateDefinition: {},
      run: {},
    };

    await expect(plugin.execute(inputs)).rejects.toThrowError(
      "Invalid input provided"
    );
  });
});
