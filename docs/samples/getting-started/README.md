# Getting Started Workflow

This guide helps you set up and run your first workflow in JAWE. The "Getting Started" workflow demonstrates how to use a POST Trigger to execute a simple plugin.

---

## Workflow Overview

- **Trigger**: POST Trigger
  - Endpoint: `/getting-started`
  - Input: `{ "name": "<name>" }`
  - If `name` is not provided, the workflow will fail.
- **Plugin**: `Hello World`
  - Outputs: A greeting string in the format `Hello ${name}`.

---

## How It Works

1. A POST request to the endpoint `/getting-started` triggers the workflow.
2. The input `name` is passed to the `Hello World` plugin.
3. The `Hello World` plugin processes the input and generates a greeting output.
4. If no `name` is provided, the plugin will throw an error, and the workflow will fail.

---

## Setup Instructions

1. **Import the Workflow**:

   - Add the workflow template to your JAWE instance.

2. **Publish the Workflow**:

   - Once the workflow is imported, publish it to make it available for execution.

3. **Run the Workflow**:

   - Use a tool like `curl` or Postman to send a POST request to the trigger endpoint:

     ```bash
     curl -X POST http://localhost:7001/api/v1/webhook/getting-started \
     -H "Content-Type: application/json" \
     -d '{ "name": "John" }'
     ```

   - On success, the response will include a `workflowRunId`.

---

## Viewing Executions

1. **Open the Executions Dialog**:

   - Navigate to the JAWE UI.
   - Click on "View Executions".

2. **View Execution Details**:

   - Find the execution in the list and click on the "Details" button.
   - This opens a detailed view of the workflow's steps.

3. **Inspect Step Outputs**:

   - In the detailed execution view, locate the `Hello World` plugin.
   - Click on the "Info" button to view the plugin's output.
   - You should see the output:

     ```json
     "greetings": "Hello John"
     ```

---

## Error Handling

- If the `name` parameter is not provided in the POST request, the `Hello World` plugin will throw an error, and the workflow will fail.
- Ensure your POST request includes a valid `name` field.

---

## Example Postman Setup

1. **Create a New Request**:

   - Method: `POST`
   - URL: `http://localhost:7001/api/v1/webhook/getting-started`

2. **Set Headers**:

   - `Content-Type: application/json`

3. **Add Body**:

   - Example JSON:

     ```json
     {
       "name": "Jane"
     }
     ```

4. **Send the Request**.

---

## Conclusion

This simple workflow demonstrates how to:

- Set up a POST trigger.
- Pass inputs dynamically to plugins.
- View execution details and outputs in the JAWE UI.

Now that you're familiar with the basics, you can explore more advanced workflows and plugins!
