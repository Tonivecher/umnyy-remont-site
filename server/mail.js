import nodemailer from "nodemailer";

const DEFAULT_RECIPIENT = "umniremont@gmail.com";

const propertyTypeLabels = {
  apartment: "Квартира",
  house: "Дом",
  office: "Офис",
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const displayValue = (value) => String(value ?? "").trim() || "—";

const smtpUser = String(process.env.SMTP_USER || DEFAULT_RECIPIENT).trim();
const smtpPass = String(process.env.SMTP_PASS || "").trim();
const recipient = String(process.env.LEADS_EMAIL_TO || DEFAULT_RECIPIENT).trim();
const sender = String(process.env.LEADS_EMAIL_FROM || smtpUser).trim();
const testTransportEnabled =
  process.env.NODE_ENV === "test" && process.env.SMTP_TEST_MODE === "json";

export const isLeadEmailConfigured =
  testTransportEnabled || Boolean(smtpUser && smtpPass && recipient && sender);

const transporter = testTransportEnabled
  ? nodemailer.createTransport({ jsonTransport: true })
  : isLeadEmailConfigured
    ? nodemailer.createTransport({
        host: String(process.env.SMTP_HOST || "smtp.gmail.com").trim(),
        port: Number.parseInt(process.env.SMTP_PORT || "465", 10),
        secure: String(process.env.SMTP_SECURE || "true").toLowerCase() !== "false",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
      })
    : null;

const formatCreatedAt = (createdAt) => {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Europe/Moscow",
    }).format(new Date(createdAt));
  } catch {
    return displayValue(createdAt);
  }
};

const buildLeadMessage = (lead) => {
  const propertyType = propertyTypeLabels[lead.propertyType] || lead.propertyType;
  const createdAt = formatCreatedAt(lead.createdAt);
  const rows = [
    ["Имя", lead.name],
    ["Телефон", lead.phone],
    ["Тип объекта", propertyType],
    ["Площадь", lead.area ? `${lead.area} м²` : "—"],
    ["Бюджет", lead.budget],
    ["Сроки", lead.timeline],
    ["Комментарий", lead.comment],
    ["Дата", createdAt],
    ["Номер заявки", lead.id],
  ];

  const text = [
    "Новая заявка с сайта «Умный Ремонт»",
    "",
    ...rows.map(([label, value]) => `${label}: ${displayValue(value)}`),
  ].join("\n");

  const htmlRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 12px;color:#776b58;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td>
          <td style="padding:8px 12px;color:#17130f;vertical-align:top">${escapeHtml(displayValue(value))}</td>
        </tr>`,
    )
    .join("");

  const html = `
    <!doctype html>
    <html lang="ru">
      <body style="margin:0;background:#f5f1e8;font-family:Arial,sans-serif;color:#17130f">
        <div style="max-width:680px;margin:0 auto;padding:32px 16px">
          <div style="background:#ffffff;border:1px solid #ded5c5;border-radius:20px;overflow:hidden">
            <div style="padding:24px 28px;background:#17130f;color:#f5ead4">
              <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#c5a059">Умный Ремонт</div>
              <h1 style="margin:10px 0 0;font-size:24px;line-height:1.25">Новая заявка с сайта</h1>
            </div>
            <div style="padding:20px 16px 24px">
              <table role="presentation" style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.45">
                ${htmlRows}
              </table>
              <p style="margin:20px 12px 0">
                <a href="tel:${escapeHtml(lead.phone)}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#c5a059;color:#17130f;text-decoration:none;font-weight:700">Позвонить клиенту</a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>`;

  return {
    from: sender,
    to: recipient,
    subject: `[Умный Ремонт] Новая заявка — ${lead.name}`,
    text,
    html,
  };
};

export const verifyLeadEmailTransport = async () => {
  if (!transporter || testTransportEnabled) return isLeadEmailConfigured;
  await transporter.verify();
  return true;
};

export const sendLeadNotification = async (lead) => {
  if (!transporter) {
    return { sent: false, reason: "not-configured" };
  }

  const info = await transporter.sendMail(buildLeadMessage(lead));
  return {
    sent: true,
    messageId: info.messageId,
    preview: testTransportEnabled ? info.message?.toString() : undefined,
  };
};
