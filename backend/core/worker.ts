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
    },
  });

  pendingWorkflowRuns.forEach(async (workflowRun) => {
    const { id: runId, template } = workflowRun;

    const engine = new WorkflowEngine({
      repository,
      runId,
      workflow: template as unknown as WorkflowTemplate,
    });
    try {
      await engine.execute();
    } catch (e) {
      console.log("Workflow failed: ", workflowRun.id);
    }
  });
};
