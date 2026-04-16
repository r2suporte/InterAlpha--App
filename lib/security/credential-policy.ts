export function shouldExposeTemporaryCredentials(): boolean {
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  return process.env.ALLOW_PLAINTEXT_CREDENTIALS === 'true';
}
