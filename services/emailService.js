const { sendEmail } = require('../config/email');

/* ── Shared layout helpers ─────────────────────────────────────────── */
const fmt = (d) =>
  new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const wrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Workaholic</title>
</head>
<body style="margin:0;padding:0;background:#F5F3EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background:#1C1C1E;padding:28px 36px;border-radius:12px 12px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display:inline-block;background:#E8A838;color:#1C1C1E;font-weight:900;font-size:20px;
                                 letter-spacing:-0.5px;padding:6px 14px;border-radius:6px;">W</span>
                    <span style="color:#ffffff;font-weight:700;font-size:18px;margin-left:10px;vertical-align:middle;">
                      Workaholic
                    </span>
                  </td>
                  <td align="right">
                    <span style="color:#ffffff40;font-size:11px;letter-spacing:2px;text-transform:uppercase;">HR System</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F5F3EE;padding:20px 36px;border:1px solid #e5e7eb;border-top:none;
                       border-radius:0 0 12px 12px;text-align:center;">
              <p style="margin:0;color:#9CA3AF;font-size:11px;letter-spacing:1px;text-transform:uppercase;">
                Workaholic Workforce Management &nbsp;·&nbsp; Group 2
              </p>
              <p style="margin:6px 0 0;color:#D1D5DB;font-size:11px;">
                This is an automated message — please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const statusBanner = (color, label, icon) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    <tr>
      <td style="background:${color}15;border-left:4px solid ${color};padding:14px 18px;border-radius:0 8px 8px 0;">
        <span style="color:${color};font-weight:800;font-size:15px;letter-spacing:0.3px;">
          ${icon}&nbsp; ${label}
        </span>
      </td>
    </tr>
  </table>`;

const infoRow = (label, value, isLast = false) => `
  <tr>
    <td style="padding:10px 0;${isLast ? '' : 'border-bottom:1px solid #F3F4F6;'}">
      <span style="color:#6B7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;">${label}</span>
    </td>
    <td style="padding:10px 0;text-align:right;${isLast ? '' : 'border-bottom:1px solid #F3F4F6;'}">
      <span style="color:#1C1C1E;font-weight:600;font-size:14px;">${value}</span>
    </td>
  </tr>`;

/* ── Leave Approved ────────────────────────────────────────────────── */
const leaveApprovedEmail = async (employee, leave) => {
  const content = `
    <h2 style="margin:0 0 6px;color:#1C1C1E;font-size:22px;font-weight:800;">Hi ${employee.name},</h2>
    <p style="margin:0 0 24px;color:#6B7280;font-size:14px;">We have an update on your leave request.</p>

    ${statusBanner('#22C55E', 'Leave Request Approved', '✅')}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${infoRow('Leave Type', leave.type.charAt(0).toUpperCase() + leave.type.slice(1))}
      ${infoRow('From', fmt(leave.startDate))}
      ${infoRow('To', fmt(leave.endDate))}
      ${infoRow('Duration', `${leave.daysRequested} day${leave.daysRequested !== 1 ? 's' : ''}`, !leave.adminComment)}
      ${leave.adminComment ? infoRow('HR Note', leave.adminComment, true) : ''}
    </table>

    <p style="margin:0 0 8px;color:#374151;font-size:14px;line-height:1.6;">
      Your leave has been approved and your vacation balance has been updated accordingly.
      Enjoy your time off!
    </p>`;

  await sendEmail({
    to: employee.email,
    subject: `✅ Leave Approved — ${leave.daysRequested} day${leave.daysRequested !== 1 ? 's' : ''} (${leave.type})`,
    html: wrapper(content),
  });
};

/* ── Leave Rejected ────────────────────────────────────────────────── */
const leaveRejectedEmail = async (employee, leave) => {
  const content = `
    <h2 style="margin:0 0 6px;color:#1C1C1E;font-size:22px;font-weight:800;">Hi ${employee.name},</h2>
    <p style="margin:0 0 24px;color:#6B7280;font-size:14px;">We have an update on your leave request.</p>

    ${statusBanner('#E05C5C', 'Leave Request Rejected', '❌')}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${infoRow('Leave Type', leave.type.charAt(0).toUpperCase() + leave.type.slice(1))}
      ${infoRow('From', fmt(leave.startDate))}
      ${infoRow('To', fmt(leave.endDate))}
      ${infoRow('Duration', `${leave.daysRequested} day${leave.daysRequested !== 1 ? 's' : ''}`, !leave.adminComment)}
      ${leave.adminComment ? infoRow('Reason', leave.adminComment, true) : ''}
    </table>

    <p style="margin:0 0 8px;color:#374151;font-size:14px;line-height:1.6;">
      If you have questions about this decision, please reach out to your HR representative directly.
    </p>`;

  await sendEmail({
    to: employee.email,
    subject: `❌ Leave Request Not Approved — ${leave.type}`,
    html: wrapper(content),
  });
};

/* ── Late Alert (to HR) ────────────────────────────────────────────── */
const lateAlertEmail = async (hrEmail, employee, latenessMinutes) => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const content = `
    <h2 style="margin:0 0 6px;color:#1C1C1E;font-size:22px;font-weight:800;">Late Arrival Alert</h2>
    <p style="margin:0 0 24px;color:#6B7280;font-size:14px;">${dateStr}</p>

    ${statusBanner('#E8A838', `${employee.name} arrived ${latenessMinutes} minutes late`, '⚠️')}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${infoRow('Employee', employee.name)}
      ${infoRow('Department', employee.department || 'N/A')}
      ${infoRow('Clock-In Time', timeStr)}
      ${infoRow('Minutes Late', `+${latenessMinutes} min`, true)}
    </table>

    <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">
      This alert was triggered automatically when the employee clocked in outside their scheduled start time.
    </p>`;

  await sendEmail({
    to: hrEmail,
    subject: `⚠️ Late Alert: ${employee.name} (+${latenessMinutes}m) — ${dateStr}`,
    html: wrapper(content),
  });
};

module.exports = { leaveApprovedEmail, leaveRejectedEmail, lateAlertEmail };
