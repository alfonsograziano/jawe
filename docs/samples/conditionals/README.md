# Conditional Workflow Template

This guide explains how to set up and use the **Conditional Workflow** template in JAWE. This workflow introduces conditional branching using the `Conditional Plugin`, allowing different execution paths based on input values.

---

## Workflow Overview

- **Trigger**: POST Trigger
  - Endpoint: `/conditional`
  - Input: `{ "name": "<name>" }`
  - The workflow behavior changes based on the `name` value.
- **Plugins**:
  - `Conditional Plugin`: Determines the next step based on conditions.
  - `Hello World`: Outputs a greeting message.
  - `No Operation`: Ends the workflow if conditions are not met.

### Conditional Logic:

- If `name` is `"Bob"`, the workflow proceeds to the `Hello World` plugin.
- Otherwise, the workflow ends at the `No Operation` step.

---

## How It Works

1. A POST request to the `/conditional` endpoint triggers the workflow.
2. The `Conditional Plugin` evaluates the `name` input.
3. If `name` equals `"Bob"`, execution continues to the `Hello World` plugin.
4. Otherwise, the workflow ends with the `No Operation` step.
5. The `Hello World` plugin generates a greeting if executed.

---

## Setup Instructions

1. **Import the Workflow**:

   - Add the conditional workflow template to your JAWE instance.

2. **Publish the Workflow**:

   - Once the workflow is imported, publish it to make it available for execution.

3. **Run the Workflow**:

   - Use `curl` or Postman to send a POST request to the trigger endpoint:

     ```bash
     curl -X POST http://localhost:7001/api/v1/webhook/conditional \
     -H "Content-Type: application/json" \
     -d '{ "name": "Bob" }'
     ```

   - On success, the response will include a `workflowRunId`.

---

## Viewing Executions

1. **Open the Executions Dialog**:

   - Navigate to the JAWE UI.
   - Click on "View Executions".

2. **View Execution Details**:

   - Locate the execution and click "Details".
   - The execution flow will display which steps were executed.

3. **Inspect Step Outputs**:

   - If `name` was `"Bob"`, the `Hello World` plugin output will be:

     ```json
     {
       "greetings": "Hello Bob"
     }
     ```

   - If `name` was any other value, the execution will end at `No Operation`.

---

## Error Handling

- If `name` is missing from the request body, the workflow may not execute correctly.
- Ensure the `name` parameter is included in the request payload.

---

## Example Postman Setup

1. **Create a New Request**:

   - Method: `POST`
   - URL: `http://localhost:7001/api/v1/webhook/conditional`

2. **Set Headers**:

   - `Content-Type: application/json`

3. **Add Body**:

   - Example JSON:

     ```json
     {
       "name": "Bob"
     }
     ```

4. **Send the Request**.

---

## Customizing the Workflow

If you want to modify the conditional logic, you can leverage the rule-based operators available in the [`json-rules-engine` library](https://github.com/cachecontrol/json-rules-engine/blob/HEAD/docs/rules.md#operators). This allows you to create more complex conditions and branching logic tailored to your use case.

---

## Conclusion

This workflow demonstrates:

- Conditional branching in JAWE.
- Dynamic execution paths based on input values.
- How to set up and test conditional logic in workflows.

Now that you understand the basics, try modifying the conditions or adding more branches!
