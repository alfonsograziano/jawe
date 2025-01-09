import {
  PrismaClient,
  WorkflowStatus,
  StepRunStatus,
  StepRun,
} from "@prisma/client";

export class WorkflowRunRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async changeExecutionStatus(runId: string, status: WorkflowStatus) {
    return this.prisma.workflowRun.update({
      where: { id: runId },
      data: { status },
    });
  }

  async getExecutionStatus(runId: string) {
    const run = await this.prisma.workflowRun.findUnique({
      where: { id: runId },
      select: { status: true },
    });
    return run?.status;
  }

  async createStepRun(stepId: string, runId: string, status: StepRunStatus) {
    return this.prisma.stepRun.create({
      data: {
        stepId,
        runId,
        status,
        output: {},
      },
    });
  }

  async changeStepRunStatus(stepRunId: string, status: StepRunStatus) {
    return this.prisma.stepRun.update({
      where: { id: stepRunId },
      data: { status },
    });
  }

  async updateStepRunStatus(
    stepRunId: string,
    status: StepRunStatus,
    output: StepRun["output"]
  ) {
    return this.prisma.stepRun.update({
      where: { id: stepRunId },
      data: {
        status,
        output: output || {},
      },
    });
  }

  async getRunDetails(runId: string) {
    const run = await this.prisma.workflowRun.findUnique({
      where: { id: runId },
      include: {
        stepRun: true,
      },
    });
    if (!run) {
      throw new Error(`Workflow run with id ${runId} does not exist`);
    }
    return run;
  }
}
