import { Type } from "@sinclair/typebox";

const HttpTriggerSchema = Type.Object(
  {
    method: Type.Union([Type.Literal("POST"), Type.Literal("GET")], {
      type: "string",
      description: "HTTP method used to trigger the workflow.",
    }),
    url: Type.String({
      pattern: "^[a-zA-Z0-9_-]+$",
      description:
        "The unique part of the URL that the trigger must respond to. Must consist of alphanumeric characters, underscores, or hyphens.",
    }),
    redirectUrl: Type.Optional(
      Type.String({
        description: "An optional URL to redirect after trigger execution.",
      })
    ),
    authorization: Type.Optional(
      Type.String({
        description: "The authorization header",
      })
    ),
  },
  { description: "Schema for an HTTP trigger in JAWE." }
);

const CronTriggerSchema = Type.Object(
  {
    cronExpression: Type.String({
      description: "A cron expression to schedule the workflow execution.",
    }),
  },
  { description: "Schema for a Cron trigger in JAWE." }
);

export default HttpTriggerSchema;

export const triggerRegistry = [
  {
    id: "webhook",
    name: "Webhook",
    description:
      "Do an HTTP call on a specific endpoint to trigger a workflow execution",
    inputs: HttpTriggerSchema,
  },
  {
    id: "cron",
    name: "Scheduled execution",
    description: "Schedule a workflow execution using a cron expression",
    inputs: CronTriggerSchema,
  },
];

export type Trigger = (typeof triggerRegistry)[number];

export let triggerRegistryMap: Map<string, Trigger> = new Map();
triggerRegistry.map((trigger) => {
  triggerRegistryMap.set(trigger.id, trigger);
});
