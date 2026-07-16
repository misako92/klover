import "server-only";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface EmailProvider {
  sendEmail(message: EmailMessage): Promise<void>;
}

export class ConsoleEmailAdapter implements EmailProvider {
  async sendEmail(message: EmailMessage): Promise<void> {
    console.log("📨 [EMAIL SENT (LOCAL)]");
    console.log(`To: ${message.to}`);
    console.log(`Subject: ${message.subject}`);
    console.log("--- Body ---");
    console.log(message.html);
    console.log("------------");
  }
}

export class ResendEmailAdapter implements EmailProvider {
  private apiKey: string;
  private fromAddress: string;

  constructor(apiKey: string, fromAddress = "Klover <noreply@klover.co>") {
    this.apiKey = apiKey;
    this.fromAddress = fromAddress;
  }

  async sendEmail(message: EmailMessage): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.fromAddress,
        to: [message.to],
        subject: message.subject,
        html: message.html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Resend email error:", errorData);
      throw new Error(`Failed to send email: ${response.status}`);
    }
  }
}

// Factory to get the configured provider
export function getEmailProvider(): EmailProvider {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    return new ResendEmailAdapter(resendApiKey, process.env.RESEND_FROM_ADDRESS || "Klover <noreply@klover.co>");
  }
  return new ConsoleEmailAdapter();
}

// Singleton instance for easy import
export const emailService = getEmailProvider();
