import { Type, Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const VisualizationMetadata = Type.Object({
  position: Type.Object({
    x: Type.Number(),
    y: Type.Number(),
  }),
  data: Type.Object({
    label: Type.String(),
  }),
});

export const StepConnections = Type.Object({
  id: Type.String(),
  fromStepId: Type.String(),
  toStepId: Type.String(),
});

export const Trigger = Type.Object({
  id: Type.String(),
  type: Type.String(),
  settings: Type.Any(),
  visualizationMetadata: VisualizationMetadata,
});

export const Step = Type.Object({
  id: Type.String(),
  name: Type.String(),
  type: Type.String(),
  inputs: Type.Optional(Type.Any()),
  visualizationMetadata: VisualizationMetadata,
});

export type VisualizationMetadataType = Static<typeof VisualizationMetadata>;

export function validateVisualizationMetadata(
  metadata: any
): VisualizationMetadataType {
  if (Value.Check(VisualizationMetadata, metadata)) {
    return metadata;
  }

  throw new Error("Cannot validate visual metadata");
}
