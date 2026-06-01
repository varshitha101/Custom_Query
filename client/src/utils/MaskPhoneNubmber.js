/**
 * Masks a phone number by replacing the first 7 digits with 'X' and keeping the last 4 digits visible.
 * This is useful for displaying phone numbers in a privacy-conscious manner.
 * @param {string} phoneNumber
 * @returns
 */
export default function maskPhoneNumber(phoneNumber) {
  if (!phoneNumber || phoneNumber.length < 7) return phoneNumber;
  // Assumes phoneNumber is in "+91XXXXXXXXXX" format
  const last4 = phoneNumber.slice(-4);
  return "+91 XXXXX" + last4;
}
