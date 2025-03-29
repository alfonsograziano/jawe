import { BasePlugin } from "../../core/basePlugin";
import { Type, Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import nodemailer from "nodemailer";
import { enhanceFieldSchemaWithInputSource } from "../../core/utils/buildDynamicInputField";

const SmtpConfigSchema = Type.Object({
  host: Type.String(),
  port: Type.Number(),
  secure: Type.Boolean(),
  auth: Type.Object({
    user: Type.String(),
    pass: Type.String(),
  }),
});

const MailOptionsSchema = Type.Object({
  from: enhanceFieldSchemaWithInputSource(Type.String()),
  to: enhanceFieldSchemaWithInputSource(Type.String()),
  subject: enhanceFieldSchemaWithInputSource(Type.String()),
  text: enhanceFieldSchemaWithInputSource(Type.Optional(Type.String())),
  html: enhanceFieldSchemaWithInputSource(Type.Optional(Type.String())),
});

const ResolvedMailOptionsSchema = Type.Object({
  from: Type.String(),
  to: Type.String(),
  subject: Type.String(),
  text: Type.Optional(Type.String()),
  html: Type.Optional(Type.String()),
});

const EmailInputSchema = Type.Object({
  smtp: SmtpConfigSchema,
  mail: MailOptionsSchema,
});

const ResolvedEmailInputSchema = Type.Object({
  smtp: SmtpConfigSchema,
  mail: ResolvedMailOptionsSchema,
});

const EmailOutputSchema = Type.Object({
  messageId: Type.String(),
  accepted: Type.Array(Type.String()),
  rejected: Type.Array(Type.String()),
});

export type ResolvedEmailInput = Static<typeof ResolvedEmailInputSchema>;
export type EmailOutput = Static<typeof EmailOutputSchema>;

export default class SendEmailPlugin implements BasePlugin {
  getPluginInfo() {
    return {
      id: "send-email",
      name: "Send Email",
      description:
        "Sends an email using Nodemailer with the provided SMTP configuration and mail options.",
      inputs: EmailInputSchema,
      outputs: EmailOutputSchema,
    };
  }

  async execute(inputs: ResolvedEmailInput): Promise<EmailOutput> {
    // Validate the inputs using TypeBox
    const isValid = Value.Check(ResolvedEmailInputSchema, inputs);
    if (!isValid) {
      throw new Error("Invalid input provided");
    }

    const { smtp, mail } = inputs;

    // Ensure that at least one of 'text' or 'html' is provided.
    if (!mail.text && !mail.html) {
      throw new Error(
        "At least one of 'text' or 'html' must be provided in the mail options."
      );
    }

    try {
      // Create a Nodemailer transporter using the provided SMTP configuration.
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: {
          user: smtp.auth.user,
          pass: smtp.auth.pass,
        },
      });

      // Send the email using the mail options.
      const info = await transporter.sendMail({
        from: mail.from,
        to: mail.to,
        subject: mail.subject,
        //text: mail.text,
        html: mail.html,
      });

      // Return the relevant details from the response.
      return {
        messageId: info.messageId,
        accepted: (info.accepted as string[]) || [],
        rejected: (info.rejected as string[]) || [],
      };
    } catch (error) {
      throw new Error(`Failed to send email: ${(error as Error).message}`);
    }
  }
}
