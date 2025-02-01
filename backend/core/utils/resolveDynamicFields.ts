import { StepRun, TriggerRun } from "@prisma/client";
import { getNestedValue } from "./index";

export const resolveDynamicInputs = (
  obj: any,
  stepRuns: StepRun[],
  triggerRun: TriggerRun
): any => {
  if (typeof obj !== "object" && !Array.isArray(obj)) return obj;

  if (typeof obj === "object" && typeof obj.inputSource === "string") {
    const inputSource = obj.inputSource;
    if (inputSource === "static_value") return obj.staticValue;

    if (inputSource === "step_output") {
      const targetStepId = obj.stepDetails.stepId;
      const stepRunFromStepId = stepRuns.find(
        (stepRun) => stepRun.stepId === targetStepId
      );

      if (!stepRunFromStepId)
        throw new Error("Cannot find stepRun id for input lookup");

      return getNestedValue(
        stepRunFromStepId.output,
        obj.stepDetails.outputPath
      );
    }

    if (inputSource === "trigger_output") {
      return getNestedValue(triggerRun.output, obj.triggerDetails.outputPath);
    }
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => resolveDynamicInputs(item, stepRuns, triggerRun));
  }

  if (typeof obj === "object") {
    const resolvedInputs: Record<string, unknown> = {};
    Object.keys(obj).forEach((key) => {
      resolvedInputs[key] = resolveDynamicInputs(
        obj[key],
        stepRuns,
        triggerRun
      );
    });
    return resolvedInputs;
  }

  return obj;
};
