export const generateCsrfToken = (): string => {
  const randomBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    randomBytes[i] = Math.floor(Math.random() * 256);
  }
  const csrfToken = btoa(String.fromCharCode(...randomBytes));
  return csrfToken;
};
