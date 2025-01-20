# Creating a Plugin for JAWE

This guide explains how to create a plugin for JAWE. Plugins encapsulate business logic and serve as the core of workflow execution. Each plugin is registered and made available for use in workflows.

## Overview of Plugins

A plugin in JAWE is responsible for:

- Executing custom logic through its `execute` method.
- Defining inputs and outputs via JSON schemas.
- Integrating seamlessly into workflows as a reusable and modular component.

### Plugin Structure

Each plugin must:

1. **Implement the `BasePlugin` Interface**: This ensures consistency across all plugins.
2. **Expose an `index.ts` file**: This acts as the entry point for the plugin.
3. **Provide Introspection**: Define metadata about the plugin, including its inputs and outputs.

## Example: "Hello World" Plugin

Below is a complete example of a simple plugin called "Hello World."

```typescript
import { BasePlugin } from "../../core/basePlugin";
import { Type, Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { enhanceFieldSchemaWithInputSource } from "../../core/utils/buildDynamicInputField";

const NameType = Type.String({ title: "Name" });

const InputSchema = Type.Object({
  name: enhanceFieldSchemaWithInputSource(NameType),
});

const ResolvedInputSchema = Type.Object({
  name: NameType,
});

const OutputSchema = Type.Object({
  greetings: Type.String({ minLength: 1 }),
});

export type HelloWorldInput = Static<typeof ResolvedInputSchema>;
export type HelloWorldOutput = Static<typeof OutputSchema>;

export default class HelloWorld implements BasePlugin {
  getPluginInfo() {
    return {
      id: "hello-world",
      name: "Hello World",
      description: "A plugin that takes a name as input and returns greetings",
      inputs: InputSchema, // This is the input for the user
      outputs: OutputSchema,
    };
  }

  async execute(inputs: HelloWorldInput): Promise<HelloWorldOutput> {
    const isValid = Value.Check(ResolvedInputSchema, inputs);
    if (!isValid) {
      throw new Error("Invalid input provided");
    }

    return {
      greetings: `Hello ${inputs.name}`,
    };
  }
}
```

### Key Components of the Example

1. **Schemas**:
   - **Input Schema**: Defines the structure of inputs expected by the plugin.
   - **Output Schema**: Specifies the format of the plugin's outputs.
2. **`getPluginInfo`** Method:
   - Provides metadata about the plugin, such as its ID, name, description, inputs, and outputs.
3. **`execute`** Method:
   - Contains the logic executed when the plugin is called. It validates the inputs and generates the outputs.

## Steps to Create a Plugin

### 1. Create a Folder

- Navigate to the `plugins` directory.
- Create a new folder named after your plugin (e.g., `hello-world`).

### 2. Initialize the Plugin

- Run `npm init` inside the plugin folder to initialize a new `package.json` file.
- Add any custom dependencies required for your plugin.

### 3. Implement the Plugin

- Create an `index.ts` file in your plugin folder.
- Implement the `BasePlugin` interface.

### 4. Define Input and Output Schemas

- Use `@sinclair/typebox` to define JSON schemas for inputs and outputs.
- If desired, use the `enhanceFieldSchemaWithInputSource` utility. This allows you to reference a field value from another step’s output. With this, you can:
  - Set a static value,
  - Reference the output value of a step, or
  - Reference the output value of a trigger.

### 5. Implement the `execute` Method

- Write the business logic for the plugin in the `execute` method.
- Validate inputs using `Value.Check`.

### 6. Register the Plugin

- Plugins in the `plugins` folder are automatically registered by the plugin registry at runtime.
- Ensure the `index.ts` file exports the plugin class as the default.

## How Plugins Work

1. **Inputs**:
   - Inputs can be static or dynamic.
   - Dynamic inputs are derived from the outputs of other workflow steps.
2. **Execution**:
   - The `execute` method is called with the provided inputs.
   - Outputs are generated and stored for subsequent steps.
3. **Introspection**:
   - Metadata about the plugin's inputs and outputs is available at runtime.
4. **Integration**:
   - The workflow engine uses the plugin's outputs to determine the next steps in the workflow.

## Best Practices

- **Validate Inputs**: Always validate inputs to ensure data integrity.
- **Use Modular Logic**: Write reusable and modular code for your plugin.
- **Leverage JSON Schemas**: Use schemas to define and enforce the structure of inputs and outputs.
- **Document the Plugin**: Provide clear descriptions for the plugin's functionality, inputs, and outputs.

By following this guide, you can create robust and reusable plugins that integrate seamlessly into JAWE workflows.
