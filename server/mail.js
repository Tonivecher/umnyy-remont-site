const webhookUrl = String(process.env.LEADS_WEBHOOK_URL || "").trim();
const webhookSecret = String(process.env.LEADS_WEBHOOK_SECRET || "").trim();

export const isLeadEmailConfigured = Boolean(webhookUrl && webhookSecret);

const callWebhook = async (action, lead) => {
  if (!isLeadEmailConfigured) {
    return { ok: false, reason: "not-configured" };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, secret: webhookSecret, lead }),
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`Email webhook returned HTTP ${response.status}.`);
  }

  const payload = await response.json().catch(() => null);
  if (!payload?.ok) {
    throw new Error(`Email webhook rejected request: ${payload?.error || "unknown error"}.`);
  }

  return { ok: true };
};

export const verifyLeadEmailTransport = async () => {
  const result = await callWebhook("verify");
  return result.ok;
};

export const sendLeadNotification = async (lead) => {
  const result = await callWebhook("lead", lead);
  return result.ok
    ? { sent: true }
    : { sent: false, reason: result.reason || "delivery-failed" };
};
