import { PrismaClient } from "@prisma/client";
import { WorkflowEngine } from "./engine";
import { WorkflowRunRepository } from "./workflowRunRepo";
import { WorkflowTemplate } from "./validateTemplate";

export const runWorker = async (prisma: PrismaClient) => {
  const repository = new WorkflowRunRepository(prisma);

  const pendingWorkflowRuns = await prisma.workflowRun.findMany({
    where: { status: "PENDING" },
    take: 10,
    include: {
      template: {
        include: {
          steps: true,
          connections: true,
          triggers: true,
        },
      },
      triggerRun: true,
    },
  });

  pendingWorkflowRuns.forEach(async (workflowRun) => {
    const { id: runId, template, triggerRun } = workflowRun;

    const engine = new WorkflowEngine({
      repository,
      workflow: template as unknown as WorkflowTemplate,
      workflowRun: {
        id: runId,
        triggerRun,
        stepRuns: [],
      },
    });
    try {
      await prisma.workflowRun.update({
        where: { id: runId },
        data: {
          startTime: new Date(),
        },
      });
      await engine.execute();
      await prisma.workflowRun.update({
        where: { id: runId },
        data: {
          endTime: new Date(),
        },
      });
    } catch (e) {
      console.log("Workflow failed: ", workflowRun.id);
    }
  });
};
