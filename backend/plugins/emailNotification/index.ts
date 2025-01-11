import { BasePlugin } from "../../core/basePlugin";
import { Type, Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

// Email Notification Plugin
const EmailInputSchema = Type.Object({
  to: Type.String(),
  subject: Type.String({ minLength: 1 }),
  body: Type.String({ minLength: 1 }),
});

const EmailOutputSchema = Type.Object({
  status: Type.String({ enum: ["sent", "failed"] }),
});

export type EmailInput = Static<typeof EmailInputSchema>;
export type EmailOutput = Static<typeof EmailOutputSchema>;

export default class EmailNotificationPlugin implements BasePlugin {
  getPluginInfo() {
    return {
      id: "email-notification",
      name: "Email Notification",
      description: "Sends an email to the specified address",
      inputs: EmailInputSchema,
      outputs: EmailOutputSchema,
    };
  }

  async execute(inputs: EmailInput): Promise<EmailOutput> {
    const isValid = Value.Check(EmailInputSchema, inputs);
    if (!isValid) {
      throw new Error("Invalid input provided");
    }

    try {
      // Simulate sending email
      console.log(
        `Sending email to ${inputs.to} with subject: ${inputs.subject}`
      );
      return { status: "sent" };
    } catch {
      return { status: "failed" };
    }
  }
}
