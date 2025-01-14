import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { Static } from "@sinclair/typebox";
import {
  canTemplateBePublished,
  Step,
  StepConnections,
  StepInputOnly,
  TemplateStatus,
  Trigger,
  TriggerInputOnly,
  validateTemplate,
  validateVisualizationMetadata,
} from "../../core/validateTemplate";
import crypto from "crypto";
import { triggerRegistryMap } from "../../core/triggerRegistry";
import { Value } from "@sinclair/typebox/value";
import { pluginRegistryMap } from "../../core/pluginRegistry";
import Ajv from "ajv";
const ajv = new Ajv();

const DuplicateTemplateParams = Type.Object({
  id: Type.String(),
});

const DuplicateTemplateResponse = Type.Object({
  id: Type.String(),
  name: Type.String(),
  status: Type.String(),
  message: Type.String(),
});

const DuplicateTemplateErrorResponse = Type.Object({
  error: Type.String(),
});

const CreateWorkflowBody = Type.Object({
  name: Type.String(),
});

const UpdateWorkflowBody = Type.Object({
  name: Type.Optional(Type.String()),
  steps: Type.Optional(Type.Array(StepInputOnly)),
  connections: Type.Optional(Type.Array(StepConnections)),
  entryPointId: Type.Optional(Type.String()),
  status: Type.Optional(TemplateStatus),
  triggers: Type.Array(TriggerInputOnly),
});

const UpdateWorkflowParams = Type.Object({
  id: Type.String(),
});

const WorkflowResponse = Type.Object({
  id: Type.String(),
});

const ErrorResponse = Type.Object({
  error: Type.String(),
});

const ListWorkflowResponse = Type.Array(
  Type.Object({
    id: Type.String(),
    name: Type.String(),
    createdAt: Type.String({ format: "date-time" }),
    status: TemplateStatus,
  })
);

export const GetWorkflowResponse = Type.Object({
  id: Type.String(),
  name: Type.String(),
  status: TemplateStatus,
  entryPointId: Type.Optional(Type.String()),
  steps: Type.Array(Step),
  connections: Type.Optional(Type.Array(StepConnections)),
  updatedAt: Type.String({ format: "date-time" }),
  triggers: Type.Array(Trigger),
  canBePublished: Type.Boolean(),
});

const DeleteWorkflowParams = Type.Object({
  id: Type.String(),
});

const DeleteWorkflowResponse = Type.Object({
  success: Type.Boolean(),
  message: Type.String(),
});

const DeleteWorkflowErrorResponse = Type.Object({
  error: Type.String(),
});

const PublishWorkflowParams = Type.Object({
  id: Type.String(),
});

const PublishWorkflowResponse = Type.Object({
  success: Type.Boolean(),
  message: Type.String(),
});

const PublishWorkflowErrorResponse = Type.Object({
  error: Type.String(),
});

export default async function workflowTemplate(app: FastifyInstance) {
  app.post<{
    Body: Static<typeof CreateWorkflowBody>;
    Reply: Static<typeof WorkflowResponse>;
  }>(
    "/",
    {
      schema: {
        body: CreateWorkflowBody,
        response: { 201: WorkflowResponse },
      },
    },
    async (request, reply) => {
      const { name } = request.body;

      const workflow = await app.prisma.workflowTemplate.create({
        data: {
          name,
          status: "DRAFT",
        },
      });

      return reply.status(201).send({ id: workflow.id });
    }
  );

  app.get<{
    Reply: Static<typeof ListWorkflowResponse>;
  }>(
    "/",
    {
      schema: {
        response: { 200: ListWorkflowResponse },
      },
    },
    async (request, reply) => {
      const workflows = await app.prisma.workflowTemplate.findMany({
        select: {
          id: true,
          name: true,
          createdAt: true,
          status: true,
        },
      });

      const formattedWorkflows = workflows.map((workflow) => ({
        ...workflow,
        createdAt: workflow.createdAt.toISOString(),
      }));

      return reply.status(200).send(formattedWorkflows);
    }
  );

  app.get<{
    Params: Static<typeof UpdateWorkflowParams>;
    Reply: Static<typeof GetWorkflowResponse | typeof ErrorResponse>;
  }>(
    "/:id",
    {
      schema: {
        params: UpdateWorkflowParams,
        response: { 200: GetWorkflowResponse, 404: ErrorResponse },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const workflow = await app.prisma.workflowTemplate.findUnique({
        where: { id },
        include: {
          steps: true,
          connections: true,
          triggers: true,
        },
      });

      if (!workflow) {
        return reply.status(404).send({ error: "Workflow not found." });
      }

      const formattedWorkflow = {
        id: workflow.id,
        name: workflow.name,
        status: workflow.status,
        entryPointId: workflow.entryPointId || undefined,
        steps: workflow.steps.map((step) => ({
          ...step,
          visualizationMetadata: validateVisualizationMetadata(
            step.visualizationMetadata
          ),
        })),
        connections: workflow.connections,
        updatedAt: workflow.updatedAt.toISOString(),
        triggers: workflow.triggers.map((trigger) => ({
          ...trigger,
          visualizationMetadata: validateVisualizationMetadata(
            trigger.visualizationMetadata
          ),
        })),
        canBePublished: canTemplateBePublished(workflow),
      };

      return reply.status(200).send(formattedWorkflow);
    }
  );

  app.put<{
    Params: Static<typeof UpdateWorkflowParams>;
    Body: Static<typeof UpdateWorkflowBody>;
    Reply: Static<typeof WorkflowResponse | typeof ErrorResponse>;
  }>(
    "/:id",
    {
      schema: {
        params: UpdateWorkflowParams,
        body: UpdateWorkflowBody,
        response: { 200: WorkflowResponse, 404: ErrorResponse },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { name, steps, connections, entryPointId, status, triggers } =
        request.body;

      try {
        validateTemplate({
          name,
          steps,
          connections,
          entryPointId,
          status,
          triggers,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";

        return reply.status(500).send({
          error: errorMessage,
        });
      }

      try {
        // Fetch existing workflow including steps, connections, and triggers
        const existingWorkflow = await app.prisma.workflowTemplate.findUnique({
          where: { id },
          include: { steps: true, connections: true, triggers: true },
        });

        if (!existingWorkflow) {
          return reply.status(404).send({ error: "Workflow not found." });
        }

        if (existingWorkflow.status === "PUBLISHED")
          return reply
            .status(500)
            .send({ error: "Cannot edit a published template." });

        // Determine steps, connections, and triggers to delete
        const stepIdsToDelete = existingWorkflow.steps
          .filter(
            (existingStep) =>
              !steps?.some((step) => step.id === existingStep.id)
          )
          .map((step) => step.id);

        const connectionIdsToDelete = existingWorkflow.connections
          .filter(
            (existingConnection) =>
              !connections?.some(
                (connection) => connection.id === existingConnection.id
              )
          )
          .map((connection) => connection.id);

        const triggerIdsToDelete = existingWorkflow.triggers
          .filter(
            (existingTrigger) =>
              !triggers?.some((trigger) => trigger.id === existingTrigger.id)
          )
          .map((trigger) => trigger.id);

        // Perform deletions
        await app.prisma.step.deleteMany({
          where: { id: { in: stepIdsToDelete } },
        });

        await app.prisma.connection.deleteMany({
          where: { id: { in: connectionIdsToDelete } },
        });

        await app.prisma.trigger.deleteMany({
          where: { id: { in: triggerIdsToDelete } },
        });

        // Upsert each step individually and link them to the workflow
        for (const step of steps || []) {
          // Validate if the step configuration is valid

          const pluginSchema = pluginRegistryMap.get(step.type);
          if (!pluginSchema)
            throw new Error(
              "cannot find plugin schema definition for " + step.id
            );

          const validate = ajv.compile(pluginSchema.inputs);
          const isValid = validate(step.inputs);

          await app.prisma.step.upsert({
            where: { id: step.id },
            create: {
              id: step.id,
              name: step.name,
              type: step.type,
              workflowTemplateId: id,
              inputs: step.inputs || {},
              isConfigured: isValid,
              visualizationMetadata: step.visualizationMetadata || {},
            },
            update: {
              name: step.name,
              type: step.type,
              workflowTemplateId: id,
              inputs: step.inputs,
              isConfigured: isValid,
              visualizationMetadata: step.visualizationMetadata,
            },
          });
        }

        // Upsert each connection individually and link them to the workflow
        for (const connection of connections || []) {
          await app.prisma.connection.upsert({
            where: { id: connection.id },
            create: {
              ...connection,
              workflowTemplateId: id,
            },
            update: {
              ...connection,
              workflowTemplateId: id,
            },
          });
        }

        // Upsert each trigger individually and link them to the workflow
        for (const trigger of triggers || []) {
          // Validate if the trigger configuration is valid
          const triggerSchema = triggerRegistryMap.get(trigger.type);
          if (!triggerSchema)
            throw new Error(
              "cannot find trigger schema definition for " + trigger.id
            );
          const isValid = Value.Check(triggerSchema.inputs, trigger.inputs);

          await app.prisma.trigger.upsert({
            where: { id: trigger.id },
            create: {
              id: trigger.id,
              type: trigger.type,
              inputs: trigger.inputs,
              isConfigured: isValid,
              workflowTemplateId: id,
              visualizationMetadata: trigger.visualizationMetadata || {},
            },
            update: {
              type: trigger.type,
              inputs: trigger.inputs,
              isConfigured: isValid,
              visualizationMetadata: trigger.visualizationMetadata,
              workflowTemplateId: id,
            },
          });
        }

        // Update the workflow template
        const updatedWorkflow = await app.prisma.workflowTemplate.update({
          where: { id },
          data: {
            name,
            entryPointId,
            status,
          },
        });

        return reply.status(200).send(updatedWorkflow);
      } catch (error) {
        console.log(error);
        return reply
          .status(500)
          .send({ error: "An error occurred while updating the workflow." });
      }
    }
  );

  app.delete<{
    Params: Static<typeof DeleteWorkflowParams>;
    Reply: Static<
      typeof DeleteWorkflowResponse | typeof DeleteWorkflowErrorResponse
    >;
  }>(
    "/:id",
    {
      schema: {
        params: DeleteWorkflowParams,
        response: {
          200: DeleteWorkflowResponse,
          404: DeleteWorkflowErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      try {
        const existingWorkflow = await app.prisma.workflowTemplate.findUnique({
          where: { id },
        });

        if (!existingWorkflow) {
          return reply.status(404).send({ error: "Workflow not found." });
        }

        await app.prisma.workflowTemplate.delete({
          where: { id },
        });

        return reply.status(200).send({
          success: true,
          message: "Workflow template deleted successfully.",
        });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({
          error: "An error occurred while deleting the workflow template.",
        });
      }
    }
  );

  app.patch<{
    Params: Static<typeof PublishWorkflowParams>;
    Reply: Static<
      typeof PublishWorkflowResponse | typeof PublishWorkflowErrorResponse
    >;
  }>(
    "/:id/publish",
    {
      schema: {
        params: PublishWorkflowParams,
        response: {
          200: PublishWorkflowResponse,
          404: PublishWorkflowErrorResponse,
          400: PublishWorkflowErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      try {
        // Fetch the workflow template with all related properties
        const workflowTemplate = await app.prisma.workflowTemplate.findUnique({
          where: { id },
          include: {
            steps: true,
            connections: true,
            triggers: true,
          },
        });

        if (!workflowTemplate) {
          return reply
            .status(404)
            .send({ error: "Workflow template not found." });
        }

        const canBePublished = canTemplateBePublished(workflowTemplate);
        if (!canBePublished) {
          return reply.status(500).send({
            error: "Template is not correctly configured, cannot be published",
          });
        }

        // Update the workflow template status to PUBLISHED
        await app.prisma.workflowTemplate.update({
          where: { id },
          data: { status: "PUBLISHED" },
        });

        return reply.status(200).send({
          success: true,
          message: "Workflow template published successfully.",
        });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({
          error: "An error occurred while publishing the workflow template.",
        });
      }
    }
  );

  app.post<{
    Params: Static<typeof DuplicateTemplateParams>;
    Reply: Static<
      typeof DuplicateTemplateResponse | typeof DuplicateTemplateErrorResponse
    >;
  }>(
    "/:id/duplicate",
    {
      schema: {
        params: DuplicateTemplateParams,
        response: {
          200: DuplicateTemplateResponse,
          404: DuplicateTemplateErrorResponse,
          500: DuplicateTemplateErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      try {
        // Fetch the original template
        const originalTemplate = await app.prisma.workflowTemplate.findUnique({
          where: { id },
          include: {
            steps: true,
            connections: true,
            triggers: true,
          },
        });

        if (!originalTemplate) {
          return reply.status(404).send({ error: "Template not found." });
        }

        // Generate new name with random suffix
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const newName = `${originalTemplate.name} - Copy ${randomSuffix}`;

        // Map of old step IDs to new step IDs for entry point and connections
        const stepIdMap = new Map();

        // Create the duplicated template
        const duplicatedTemplate = await app.prisma.workflowTemplate.create({
          data: {
            name: newName,
            status:
              originalTemplate.status === "PUBLISHED"
                ? "DRAFT"
                : originalTemplate.status,
          },
        });

        // Duplicate steps
        for (const step of originalTemplate.steps) {
          const newStepId = crypto.randomUUID();
          stepIdMap.set(step.id, newStepId);
          await app.prisma.step.create({
            data: {
              id: newStepId,
              workflowTemplateId: duplicatedTemplate.id,
              name: step.name,
              type: step.type,
              inputs: step.inputs ?? {},
              visualizationMetadata: step.visualizationMetadata ?? {},
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }

        // Duplicate connections
        for (const connection of originalTemplate.connections) {
          await app.prisma.connection.create({
            data: {
              id: crypto.randomUUID(),
              workflowTemplateId: duplicatedTemplate.id,
              fromStepId:
                stepIdMap.get(connection.fromStepId) ?? connection.fromStepId,
              toStepId:
                stepIdMap.get(connection.toStepId) ?? connection.toStepId,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }

        // Duplicate triggers
        for (const trigger of originalTemplate.triggers) {
          await app.prisma.trigger.create({
            data: {
              id: `trigger-${crypto.randomUUID()}`,
              workflowTemplateId: duplicatedTemplate.id,
              type: trigger.type,
              inputs: trigger.inputs ?? {},
              visualizationMetadata: trigger.visualizationMetadata ?? {},
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }

        // Update entryPointId in duplicated template
        if (originalTemplate.entryPointId) {
          await app.prisma.workflowTemplate.update({
            where: { id: duplicatedTemplate.id },
            data: {
              entryPointId: stepIdMap.get(originalTemplate.entryPointId),
            },
          });
        }

        return reply.status(200).send({
          id: duplicatedTemplate.id,
          name: duplicatedTemplate.name,
          status: duplicatedTemplate.status,
          message: "Template duplicated successfully.",
        });
      } catch (error) {
        console.log(error);
        return reply.status(500).send({
          error: "An error occurred while duplicating the template.",
        });
      }
    }
  );
}
