import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { Static } from "@sinclair/typebox";
import { GetWorkflowResponse } from "./template";
import { validateVisualizationMetadata } from "../../core/validateTemplate";

const RunStatus = Type.Union([
  Type.Literal("PENDING"),
  Type.Literal("RUNNING"),
  Type.Literal("COMPLETED"),
  Type.Literal("FAILED"),
]);

const RunStepStatus = Type.Union([
  Type.Literal("PENDING"),
  Type.Literal("RUNNING"),
  Type.Literal("COMPLETED"),
  Type.Literal("FAILED"),
]);

const GetWorkflowRunsParams = Type.Object({
  templateId: Type.String(),
});

const GetWorkflowRunDetailsParams = Type.Object({
  workflowRunId: Type.String(),
});

const WorkflowRunsResponse = Type.Array(
  Type.Object({
    id: Type.String(),
    status: RunStatus,
    createdAt: Type.String({ format: "date-time" }),
    updatedAt: Type.String({ format: "date-time" }),
  })
);

const WorkflowRunDetailsResponse = Type.Object({
  id: Type.String(),
  status: RunStatus,
  startTime: Type.String({ format: "date-time" }),
  endTime: Type.Optional(Type.String({ format: "date-time" })),
  stepRuns: Type.Array(
    Type.Object({
      id: Type.String(),
      status: RunStepStatus,
      output: Type.Any(),
      createdAt: Type.String({ format: "date-time" }),
      updatedAt: Type.String({ format: "date-time" }),
      stepId: Type.String(),
      runId: Type.String(),
    })
  ),
  template: GetWorkflowResponse,
});

const CannotFindErrorResponse = Type.Object({
  error: Type.String(),
});

export default async function workflowRun(app: FastifyInstance) {
  app.get<{
    Params: Static<typeof GetWorkflowRunsParams>;
    Reply: Static<typeof WorkflowRunsResponse>;
  }>(
    "/runs/:templateId",
    {
      schema: {
        params: GetWorkflowRunsParams,
        response: { 200: WorkflowRunsResponse },
      },
    },
    async (request, reply) => {
      const { templateId } = request.params;

      const workflowRuns = await app.prisma.workflowRun.findMany({
        where: { templateId },
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return reply.status(200).send(
        workflowRuns.map((run) => ({
          ...run,
          createdAt: run.createdAt.toISOString(),
          updatedAt: run.updatedAt.toISOString(),
        }))
      );
    }
  );

  app.get<{
    Params: Static<typeof GetWorkflowRunDetailsParams>;
    Reply: Static<
      typeof WorkflowRunDetailsResponse | typeof CannotFindErrorResponse
    >;
  }>(
    "/run/:workflowRunId",
    {
      schema: {
        params: GetWorkflowRunDetailsParams,
        response: {
          200: WorkflowRunDetailsResponse,
          404: CannotFindErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const { workflowRunId } = request.params;

      const run = await app.prisma.workflowRun.findUnique({
        where: { id: workflowRunId },
        include: {
          stepRuns: true,
          template: {
            include: {
              steps: true,
              connections: true,
              triggers: true,
            },
          },
        },
      });

      if (!run) {
        return reply.status(404).send({ error: "WorkflowRun not found" });
      }

      const { template: workflow } = run;

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
        canBePublished: false, // As in order to get a run, it has been published already
      };

      const formattedRun = {
        ...run,
        endTime: run.endTime ? run.endTime.toISOString() : undefined,
        startTime: run.startTime.toISOString(),
        stepRuns: run.stepRuns.map((step) => ({
          ...step,
          createdAt: step.createdAt.toISOString(),
          updatedAt: step.updatedAt.toISOString(),
        })),
        template: formattedWorkflow,
      };

      return reply.status(200).send(formattedRun);
    }
  );
}
