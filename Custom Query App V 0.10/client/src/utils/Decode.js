const salt = "secretRemainSecret";

/**
 *  Decodes an encoded environment variable string.
 * This function performs the following actions:
 * 1. Decodes the base64 encoded string.
 * 2. Checks if the decoded string starts with a predefined salt.
 * 3. If the salt is valid, it returns the decoded string without the salt prefix.
 * 4. If the salt is invalid or the string is corrupted, it throws an error
 * * indicating that the salt is invalid or the value is corrupted.
 * @param {string} encoded
 * @returns  {string} The decoded environment variable value.
 * @throws {Error} If the salt is invalid or the value is corrupted.
 */
export default function decodeEnv(encoded) {
  const decoded = atob(encoded);
  if (!decoded.startsWith(salt)) throw new Error("Invalid salt or corrupted value");
  return decoded.slice(salt.length);
}
