// Survives Next.js hot-reloads in dev by attaching to global
if (!global._otpStore) {
  global._otpStore = new Map();
}

const otpStore = global._otpStore;

export function saveOtp(email, otp) {
  otpStore.set(email.toLowerCase().trim(), {
    otp: String(otp),
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
  });
  console.log('[OTP] Saved for:', email, '| OTP:', otp); // remove in production
}

export function verifyOtp(email, inputOtp) {
  const key    = email.toLowerCase().trim();
  const record = otpStore.get(key);

  console.log('[OTP] Verifying for:', key);
  console.log('[OTP] Store has:', [...otpStore.keys()]);
  console.log('[OTP] Record found:', record);

  if (!record) {
    return { valid: false, reason: 'OTP not found or already used' };
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return { valid: false, reason: 'OTP expired' };
  }
  if (record.otp !== String(inputOtp).trim()) {
    return { valid: false, reason: 'Incorrect OTP' };
  }

  otpStore.delete(key); // one-time use
  return { valid: true };
}
