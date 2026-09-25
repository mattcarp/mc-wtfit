import 'server-only';

type Mail = { to: string; subject: string; html: string; text: string };

/** Sends through Resend when RESEND_API_KEY is set; otherwise logs, so forks work without an email provider. */
export async function sendEmail(m: Mail): Promise<{ sent: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'WTF This <onboarding@resend.dev>';
  if (!key) {
    console.log(`[email:not-sent] to=${m.to} subject="${m.subject}"\n${m.text}`);
    return { sent: false, error: 'RESEND_API_KEY not set' };
  }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [m.to], subject: m.subject, html: m.html, text: m.text }),
  });
  if (!r.ok) {
    const error = `Resend ${r.status}: ${(await r.text()).slice(0, 300)}`;
    console.error('[email:error]', error);
    return { sent: false, error };
  }
  return { sent: true };
}

export function esc(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
