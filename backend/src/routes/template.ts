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

const UpdateWorkflowBody = Type.Object({
  name: Type.Optional(Type.String()),
  steps: Type.Optional(Type.Array(Step)),
  connections: Type.Optional(Type.Array(StepConnections)),
  entryPointId: Type.Optional(Type.String()),
  status: Type.Optional(TemplateStatus),
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
    updatedAt: Type.String({ format: "date-time" }),
    status: TemplateStatus,
  })
);

const GetWorkflowResponse = Type.Object({
  id: Type.String(),
  name: Type.String(),
  status: TemplateStatus,
  entryPoint: Type.Optional(Step),
  steps: Type.Optional(Type.Array(Step)),
  connections: Type.Optional(Type.Array(StepConnections)),
  updatedAt: Type.String({ format: "date-time" }),
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
          updatedAt: true,
          status: true,
        },
      });

      const formattedWorkflows = workflows.map((workflow) => ({
        ...workflow,
        updatedAt: workflow.updatedAt.toISOString(),
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
          entryPoint: true,
        },
      });

      if (!workflow) {
        return reply.status(404).send({ error: "Workflow not found." });
      }

      const formattedWorkflow = {
        id: workflow.id,
        name: workflow.name,
        status: workflow.status,
        entryPoint: workflow.entryPoint || undefined,
        steps: workflow.steps,
        connections: workflow.connections,
        updatedAt: workflow.updatedAt.toISOString(),
      };

      return reply.status(200).send(formattedWorkflow);
    }
  );

  // Route to update an existing Workflow
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
      const { name, steps, connections, entryPointId, status } = request.body;

      try {
        // Fetch existing steps and connections
        const existingWorkflow = await app.prisma.workflowTemplate.findUnique({
          where: { id },
          include: { steps: true, connections: true },
        });

        if (!existingWorkflow) {
          return reply.status(404).send({ error: "Workflow not found." });
        }

        // Determine steps and connections to delete
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

        // Perform deletions
        await app.prisma.step.deleteMany({
          where: { id: { in: stepIdsToDelete } },
        });

        await app.prisma.connection.deleteMany({
          where: { id: { in: connectionIdsToDelete } },
        });

        // Update the workflow template
        const updatedWorkflow = await app.prisma.workflowTemplate.update({
          where: { id },
          data: {
            name,
            entryPointId,
            status,
            steps: steps
              ? {
                  upsert: steps.map((step) => ({
                    where: { id: step.id },
                    create: {
                      id: step.id,
                      name: step.name,
                      type: step.type,
                      inputs: step.inputs || {}, // Provide a default value if inputs are undefined
                      visualizationMetadata: step.visualizationMetadata || {}, // Default value
                    },
                    update: {
                      name: step.name,
                      type: step.type,
                      inputs: step.inputs,
                      visualizationMetadata: step.visualizationMetadata,
                    },
                  })),
                }
              : undefined,
            connections: connections
              ? {
                  upsert: connections.map((connection) => {
                    return {
                      where: { id: connection.id },
                      create: connection, // Use client-provided ID for creation
                      update: connection, // Update if the connection exists
                    };
                  }),
                }
              : undefined,
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
}
