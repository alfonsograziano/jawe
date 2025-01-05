import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { Static } from "@sinclair/typebox";

const CreateWorkflowBody = Type.Object({
  name: Type.String(),
});

const TemplateStatus = Type.Union([
  Type.Literal("DRAFT"),
  Type.Literal("PUBLISHED"),
]);

const Step = Type.Object({
  id: Type.String(),
  name: Type.String(),
  type: Type.String(),
  inputs: Type.Optional(Type.Any()),
  visualizationMetadata: Type.Optional(Type.Any()),
});

const StepConnections = Type.Object({
  id: Type.String(),
  fromStepId: Type.String(),
  toStepId: Type.String(),
});

const Trigger = Type.Object({
  id: Type.String(),
  type: Type.String(),
  settings: Type.Any(),
  visualizationMetadata: Type.Any(),
});

const UpdateWorkflowBody = Type.Object({
  name: Type.Optional(Type.String()),
  steps: Type.Optional(Type.Array(Step)),
  connections: Type.Optional(Type.Array(StepConnections)),
  entryPointId: Type.Optional(Type.String()),
  status: Type.Optional(TemplateStatus),
  triggers: Type.Array(Trigger),
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

const GetWorkflowResponse = Type.Object({
  id: Type.String(),
  name: Type.String(),
  status: TemplateStatus,
  entryPointId: Type.Optional(Type.String()),
  steps: Type.Optional(Type.Array(Step)),
  connections: Type.Optional(Type.Array(StepConnections)),
  updatedAt: Type.String({ format: "date-time" }),
  triggers: Type.Array(Trigger),
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
        steps: workflow.steps,
        connections: workflow.connections,
        updatedAt: workflow.updatedAt.toISOString(),
        triggers: workflow.triggers,
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
        // Fetch existing workflow including steps, connections, and triggers
        const existingWorkflow = await app.prisma.workflowTemplate.findUnique({
          where: { id },
          include: { steps: true, connections: true, triggers: true },
        });

        if (!existingWorkflow) {
          return reply.status(404).send({ error: "Workflow not found." });
        }

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
          await app.prisma.step.upsert({
            where: { id: step.id },
            create: {
              id: step.id,
              name: step.name,
              type: step.type,
              workflowTemplateId: id,
              inputs: step.inputs || {},
              visualizationMetadata: step.visualizationMetadata || {},
            },
            update: {
              name: step.name,
              type: step.type,
              workflowTemplateId: id,
              inputs: step.inputs,
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
          await app.prisma.trigger.upsert({
            where: { id: trigger.id },
            create: {
              id: trigger.id,
              type: trigger.type,
              settings: trigger.settings,
              workflowTemplateId: id,
              visualizationMetadata: trigger.visualizationMetadata || {},
            },
            update: {
              type: trigger.type,
              settings: trigger.settings,
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
        app.log.error(error);
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
}
