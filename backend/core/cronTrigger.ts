import { PrismaClient } from "@prisma/client";
import { Queue, Worker } from "bullmq";
import Redis from "ioredis";

type CronTriggerInputs = {
  cronExpression: string;
};

class CronTriggerManager {
  private prisma: PrismaClient;
  private queue: Queue;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
    const connection = new Redis({
      maxRetriesPerRequest: null, // Required by BullMQ to avoid breaking blocking commands
    });
    this.queue = new Queue("cronQueue", { connection });

    new Worker(
      "cronQueue",
      async (job) => {
        const { triggerId } = job.data;
        const triggerRun = await this.prisma.triggerRun.create({
          data: {
            triggerId,
            output: {},
          },
          include: {
            trigger: true,
          },
        });

        await this.prisma.workflowRun.create({
          data: {
            triggerRunId: triggerRun.id,
            templateId: triggerRun.trigger.workflowTemplateId,
            status: "PENDING",
          },
        });
      },
      { connection }
    );
  }

  private async registerCronJob(id: string, schedule: string) {
    return this.queue.upsertJobScheduler(
      id,
      { pattern: schedule },
      {
        name: id,
        data: { triggerId: id },
      }
    );
  }

  private async deregisterCronJob(id: string) {
    return this.queue.removeJobScheduler(id);
  }

  async syncTriggers() {
    const dbTriggers = await this.prisma.trigger.findMany({
      where: {
        AND: [
          { type: "cron" },
          {
            isEnabled: true,
          },
          {
            workflowTemplate: {
              status: "PUBLISHED",
            },
          },
        ],
      },
      select: {
        id: true,
        inputs: true,
      },
    });
    const dbTriggerIds = new Set(dbTriggers.map((trigger) => trigger.id));

    const registeredJobs = await this.queue.getJobSchedulers();
    const registeredJobIds = registeredJobs.map((job) => job.key);

    for (const jobId of registeredJobIds) {
      if (!dbTriggerIds.has(jobId)) {
        await this.deregisterCronJob(jobId);
      }
    }

    // As this is an initial implementation, deregistering everything should be fine
    // In an application that needs to scale we definitely need to have a better strategy
    for (const trigger of dbTriggers) {
      const inputs = trigger.inputs as CronTriggerInputs;
      await this.deregisterCronJob(trigger.id);
      await this.registerCronJob(trigger.id, inputs.cronExpression);
    }
  }
}

export default CronTriggerManager;
