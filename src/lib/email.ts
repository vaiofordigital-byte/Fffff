import nodemailer from "nodemailer";
import { env } from "@/lib/env";

type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export function emailAvailable() {
  const config = env();
  return Boolean(
    config.SMTP_HOST &&
      config.SMTP_USER &&
      config.SMTP_PASSWORD &&
      config.SMTP_FROM,
  );
}

export async function sendEmail(message: EmailMessage) {
  const config = env();
  if (!emailAvailable()) return { delivered: false as const, reason: "NOT_CONFIGURED" };

  const transport = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASSWORD,
    },
  });

  await transport.sendMail({
    from: config.SMTP_FROM,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });

  return { delivered: true as const };
}

export function verificationEmail(input: {
  locale: "ar" | "en";
  url: string;
}) {
  const ar = input.locale === "ar";
  const title = ar ? "فعّل حسابك في PROMPTX" : "Verify your PROMPTX account";
  const action = ar ? "تأكيد البريد الإلكتروني" : "Verify email";
  const body = ar
    ? "استخدم الزر التالي لتأكيد بريدك. تنتهي صلاحية الرابط خلال ساعة واحدة."
    : "Use the button below to verify your email. This link expires in one hour.";

  return {
    subject: title,
    text: `${title}\n\n${body}\n\n${input.url}`,
    html: `<!doctype html>
<html lang="${input.locale}" dir="${ar ? "rtl" : "ltr"}">
  <body style="margin:0;background:#f8f7f3;color:#151714;font-family:${ar ? "'IBM Plex Sans Arabic',Arial" : "Inter,Arial"},sans-serif">
    <div style="max-width:600px;margin:auto;padding:40px 20px">
      <div style="background:#fff;border:1px solid #dedfd9;border-radius:20px;padding:32px">
        <div style="font-size:22px;font-weight:800;letter-spacing:-.5px">PROMPT<span style="color:#b68a3a">X</span></div>
        <h1 style="font-size:26px;margin:28px 0 12px">${title}</h1>
        <p style="font-size:15px;line-height:1.8;color:#666b65">${body}</p>
        <a href="${input.url}" style="display:inline-block;margin-top:20px;background:#151714;color:#fff;text-decoration:none;padding:13px 22px;border-radius:12px;font-weight:700">${action}</a>
        <p style="margin-top:28px;font-size:12px;line-height:1.7;color:#888">${ar ? "إذا لم تطلب إنشاء الحساب، تجاهل الرسالة." : "If you did not create this account, ignore this message."}</p>
      </div>
    </div>
  </body>
</html>`,
  };
}

export function passwordResetEmail(input: {
  locale: "ar" | "en";
  url: string;
}) {
  const ar = input.locale === "ar";
  const title = ar ? "إعادة تعيين كلمة المرور" : "Reset your password";
  const body = ar
    ? "وصلنا طلب لتغيير كلمة مرور حسابك. تنتهي صلاحية الرابط خلال 30 دقيقة."
    : "We received a request to change your account password. This link expires in 30 minutes.";
  const action = ar ? "اختيار كلمة مرور جديدة" : "Choose a new password";
  return {
    subject: title,
    text: `${title}\n\n${body}\n\n${input.url}`,
    html: `<!doctype html><html lang="${input.locale}" dir="${ar ? "rtl" : "ltr"}"><body style="margin:0;background:#f8f7f3;color:#151714;font-family:Arial,sans-serif"><div style="max-width:600px;margin:auto;padding:40px 20px"><div style="background:#fff;border:1px solid #dedfd9;border-radius:20px;padding:32px"><div style="font-size:22px;font-weight:800">PROMPT<span style="color:#b68a3a">X</span></div><h1 style="font-size:26px;margin:28px 0 12px">${title}</h1><p style="font-size:15px;line-height:1.8;color:#666b65">${body}</p><a href="${input.url}" style="display:inline-block;margin-top:20px;background:#151714;color:#fff;text-decoration:none;padding:13px 22px;border-radius:12px;font-weight:700">${action}</a><p style="margin-top:28px;font-size:12px;color:#888">${ar ? "إذا لم تطلب ذلك، تجاهل الرسالة وراجع جلسات حسابك." : "If you did not request this, ignore the email and review your account sessions."}</p></div></div></body></html>`,
  };
}
