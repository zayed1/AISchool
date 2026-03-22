# #24 — Email alerts to admin when suspicious threshold is exceeded
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from threading import Thread

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")

# Track alerts to avoid spamming (max 1 per hour)
_last_alert_time = 0


def is_email_configured() -> bool:
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASS and ADMIN_EMAIL)


def _send_email(subject: str, body: str):
    """Send email in background thread."""
    try:
        msg = MIMEMultipart()
        msg["From"] = SMTP_USER
        msg["To"] = ADMIN_EMAIL
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html", "utf-8"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
    except Exception:
        pass


def send_threshold_alert(ai_count: int, total_count: int, avg_score: float):
    """Send alert when AI detection rate is too high."""
    import time
    global _last_alert_time

    if not is_email_configured():
        return

    now = time.time()
    if now - _last_alert_time < 3600:  # 1 hour cooldown
        return
    _last_alert_time = now

    ratio = round(ai_count / total_count * 100) if total_count > 0 else 0

    subject = f"⚠️ تنبيه: نسبة مرتفعة من النصوص المشبوهة ({ratio}%)"
    body = f"""
    <div dir="rtl" style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: #dc2626;">تنبيه كاشف النصوص</h2>
        <p>تم رصد نسبة مرتفعة من النصوص المشبوهة في آخر التحليلات:</p>
        <ul>
            <li><strong>عدد النصوص المشبوهة:</strong> {ai_count} من {total_count}</li>
            <li><strong>النسبة:</strong> {ratio}%</li>
            <li><strong>متوسط الدرجة:</strong> {round(avg_score * 100)}%</li>
        </ul>
        <p style="color: #64748b; font-size: 12px;">هذا تنبيه تلقائي من كاشف النصوص العربية المولدة بالذكاء الاصطناعي</p>
    </div>
    """

    thread = Thread(target=_send_email, args=(subject, body), daemon=True)
    thread.start()


def send_daily_summary(stats: dict):
    """Send daily stats summary."""
    if not is_email_configured():
        return

    subject = f"📊 ملخص يومي — {stats.get('total', 0)} تحليل"
    body = f"""
    <div dir="rtl" style="font-family: sans-serif; padding: 20px;">
        <h2>ملخص يومي لكاشف النصوص</h2>
        <table style="border-collapse: collapse; width: 100%;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">إجمالي التحليلات</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">{stats.get('total', 0)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">نصوص AI</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #dc2626; font-weight: bold;">{stats.get('ai_count', 0)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">نصوص بشرية</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #16a34a; font-weight: bold;">{stats.get('human_count', 0)}</td></tr>
            <tr><td style="padding: 8px;">متوسط الدرجة</td><td style="padding: 8px; font-weight: bold;">{stats.get('avg_score', 0)}%</td></tr>
        </table>
    </div>
    """

    thread = Thread(target=_send_email, args=(subject, body), daemon=True)
    thread.start()
