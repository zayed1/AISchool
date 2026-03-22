// #8 — Browser notifications when analysis finishes in background tab

export function requestNotificationPermission() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

export function sendAnalysisNotification(result) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  if (document.visibilityState !== 'hidden') return // only notify if tab is in background

  const emoji = result.percentage >= 65 ? '🔴' : result.percentage >= 40 ? '🟡' : '🟢'
  const title = 'اكتمل التحليل!'
  const body = `${emoji} النتيجة: ${result.percentage}% — ${result.level}`

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      dir: 'rtl',
      lang: 'ar',
      tag: 'analysis-complete',
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000)
  } catch {}
}
