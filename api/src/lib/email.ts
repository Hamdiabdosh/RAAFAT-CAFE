import { env } from "../config/env.js";

type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text: string;
  link?: string;
  kind?: "verification" | "password-reset";
};

/** In development, auth links are printed here instead of sent by email. */
function logEmailToTerminal(options: SendEmailOptions) {
  const label =
    options.kind === "verification"
      ? "EMAIL VERIFICATION"
      : options.kind === "password-reset"
        ? "PASSWORD RESET"
        : "EMAIL";

  const lines = [
    "",
    "═".repeat(60),
    `  📧 ${label} (dev — not sent, see API terminal)`,
    "═".repeat(60),
    `  To:      ${options.to}`,
    `  Subject: ${options.subject}`,
  ];

  if (options.link) {
    lines.push("  Link (open in browser):");
    lines.push(`  ${options.link}`);
  } else {
    lines.push(`  ${options.text}`);
  }

  lines.push("═".repeat(60), "");

  console.log(lines.join("\n"));
}

function useTerminalOnly(): boolean {
  if (env.NODE_ENV === "development") return true;
  return !env.SMTP_HOST || !env.SMTP_USER;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (useTerminalOnly()) {
    logEmailToTerminal(options);
    return;
  }

  // Production SMTP can be wired here (nodemailer) when credentials are set.
  console.warn("SMTP configured but sender not implemented yet; logging instead:");
  logEmailToTerminal(options);
}

export function verificationEmailLink(token: string): string {
  return `${env.WEB_APP_URL}/verify/${token}`;
}

export function resetPasswordEmailLink(token: string): string {
  return `${env.WEB_APP_URL}/reset-password/${token}`;
}

export async function sendVerificationEmail(email: string, token: string) {
  const link = verificationEmailLink(token);
  await sendEmail({
    to: email,
    subject: "Verify your CaféOS account",
    text: `Verify your email: ${link}`,
    html: `<p>Verify your email: <a href="${link}">${link}</a></p>`,
    link,
    kind: "verification",
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const link = resetPasswordEmailLink(token);
  await sendEmail({
    to: email,
    subject: "Reset your CaféOS password",
    text: `Reset your password: ${link}`,
    html: `<p>Reset your password: <a href="${link}">${link}</a></p>`,
    link,
    kind: "password-reset",
  });
}
