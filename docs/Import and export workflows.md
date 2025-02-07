# Importing and exportiung a Workflow

## Overview

The Import/Export feature in JAWE allows users to serialize and deserialize workflow templates. This enables users to easily save, share, and restore workflows, including their configurations, triggers, steps, and connections.

## Exporting a Template

To export a workflow template:

1. Open the workflow template definition in JAWE.
2. Click the **Download** icon button located in the bottom panel.
3. The system will generate a JSON file containing the entire template, including:
   - Workflow structure
   - Configuration for triggers
   - Defined steps
   - Connections and dependencies
4. The JSON file will be downloaded to your device for backup or sharing purposes.

Keep in mind that this JSON will contain all the information of the template, including sensitive info like API keys, configurations etc. Please sanitize your exports before sharing them.

## Importing a Template

To import a workflow template:

1. Click on **Create New Workflow** in the UI.
2. In the modal that appears, click on **Import JSON**.
3. Select the JSON file containing the workflow template.
4. The system will:
   - Load the JSON file.
   - Generate new unique IDs for the imported elements.
   - Map the new IDs accordingly.
   - Create all necessary resources.
   - Link them appropriately.
5. The imported workflow template will initially be in **DRAFT** status.
6. To publish the imported workflow, click on the **Publish** button.

## Sample Templates

For quick testing and experimentation, sample templates are available in the **Docs => Samples** folder. These pre-defined templates can be imported and used to explore JAWE's capabilities.

You can get started quickly with the [Getting Started Sample](./samples/getting-started/README.md)

## Notes

- Exported JSON files are fully self-contained, meaning they include all necessary configurations for replication.
- Importing a workflow template ensures that all internal references are updated to prevent conflicts.
- Templates remain in **DRAFT** status upon import to allow for review before activation.
- Users can modify and customize imported workflows before publishing them.
