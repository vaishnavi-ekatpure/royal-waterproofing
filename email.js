function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatWhen(iso) {
  const date = iso ? new Date(iso) : new Date();
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function renderEmail({ kicker, heading, intro, rows, actions, receivedAt }) {
  const detailRows = rows
    .map((row, index) => {
      const last = index === rows.length - 1;
      const value = escapeHtml(row.value).replace(/\n/g, "<br>");
      return `
        <tr>
          <td style="padding:14px 18px;border-bottom:${last ? "0" : "1px solid #e3dcd0"};">
            <div style="font-family:'Segoe UI',Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8a6432;font-weight:700;">${escapeHtml(row.label)}</div>
            <div style="font-family:'Segoe UI',Arial,sans-serif;font-size:16px;line-height:1.45;color:#0e2744;padding-top:4px;">${value}</div>
          </td>
        </tr>`;
    })
    .join("");

  const actionCells = (actions || [])
    .map(
      (action) => `
        <td style="padding-right:10px;">
          <a href="${escapeHtml(action.href)}" style="display:inline-block;background:${action.color};color:#fbf9f6;text-decoration:none;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;font-weight:700;padding:12px 18px;border-radius:4px;">${escapeHtml(action.label)}</a>
        </td>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f3efe7;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe7;">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#fbf9f6;border:1px solid #e3dcd0;">
            <tr>
              <td style="background:#0e2744;padding:28px 28px 22px;">
                <div style="font-family:'Segoe UI',Arial,sans-serif;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#d7c4a4;">Royal Waterproofing Company</div>
                <div style="font-family:'Segoe UI',Arial,sans-serif;font-size:22px;line-height:1.3;color:#fbf9f6;font-weight:700;padding-top:8px;">${escapeHtml(heading)}</div>
                <div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;line-height:1.5;color:#e7e1d6;padding-top:8px;">${escapeHtml(intro)}</div>
              </td>
            </tr>
            <tr>
              <td style="background:#8a6432;height:4px;font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:22px 28px 6px;">
                <div style="font-family:'Segoe UI',Arial,sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#4a5870;">${escapeHtml(kicker)} · ${escapeHtml(formatWhen(receivedAt))}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 28px 8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e3dcd0;">
                  ${detailRows}
                </table>
              </td>
            </tr>
            ${
              actionCells
                ? `<tr>
              <td style="padding:16px 28px 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0"><tr>${actionCells}</tr></table>
              </td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding:18px 28px 26px;font-family:'Segoe UI',Arial,sans-serif;font-size:13px;line-height:1.5;color:#4a5870;">
                Our Work. Our Quality. Your Protection.<br>
                Pune, Maharashtra · 9112970129
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function customerActions(mobile) {
  const digits = String(mobile || "").replace(/\D/g, "");
  if (!digits) return [];
  return [
    { label: `Call ${digits}`, href: `tel:+91${digits}`, color: "#0e2744" },
    { label: "WhatsApp customer", href: `https://wa.me/91${digits}`, color: "#0f6b45" },
  ];
}

function quoteMessage(quote) {
  const rows = [
    { label: "Name", value: quote.name },
    { label: "Mobile", value: quote.mobile },
    { label: "Location", value: quote.location },
    { label: "Service", value: quote.service },
    { label: "Problem", value: quote.problem },
    { label: "Preferred contact time", value: quote.preferredTime || "Not given" },
  ];
  const text = [
    "New quote request — Royal Waterproofing Company",
    "",
    ...rows.map((row) => `${row.label}: ${row.value}`),
  ].join("\n");
  return {
    subject: "New quote request — Royal Waterproofing",
    text,
    html: renderEmail({
      kicker: "Quote request",
      heading: "A customer asked for a quote",
      intro: "The details below were submitted on the website.",
      rows,
      actions: customerActions(quote.mobile),
      receivedAt: quote.createdAt,
    }),
  };
}

module.exports = { quoteMessage };
