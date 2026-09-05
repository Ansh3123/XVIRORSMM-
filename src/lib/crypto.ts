/**
 * Simple, robust symmetric XOR-base64 cipher for client-server communication
 * and encrypted DB storage to avoid storing sensitive values in plain text.
 */

const SECRET_KEY = "XVIROR_SMM_SECURE_CIPHER_KEY_98374";

export function encryptText(text: string, key: string = SECRET_KEY): string {
  if (!text) return "";
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  // Safe base64 encoding (supports Unicode / non-ASCII safely)
  return btoa(encodeURIComponent(result));
}

export function decryptText(encoded: string, key: string = SECRET_KEY): string {
  if (!encoded) return "";
  try {
    const rawXor = decodeURIComponent(atob(encoded));
    let result = '';
    for (let i = 0; i < rawXor.length; i++) {
      const charCode = rawXor.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (e) {
    console.error("Failed to decrypt text:", e);
    return "";
  }
}
