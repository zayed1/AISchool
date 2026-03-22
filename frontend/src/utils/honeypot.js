// #16 — Simple honeypot anti-spam
// A hidden field that bots will fill but humans won't

export function createHoneypot() {
  return {
    value: '',
    fieldName: '_hp_field',
  }
}

export function isBot(honeypotValue) {
  // If the hidden field has any value, it's likely a bot
  return honeypotValue && honeypotValue.trim().length > 0
}

// Time-based check: bots submit too fast
export function createTimestamp() {
  return Date.now()
}

export function isTooFast(startTimestamp, minMs = 3000) {
  return Date.now() - startTimestamp < minMs
}
