export function getOS(userAgent: string): string {
  switch (true) {
    case userAgent.includes('Mac OS X'):
      return 'macOS';
    case userAgent.includes('Windows'):
      return 'Windows';
    case userAgent.includes('Linux'):
      return 'Linux';
    default:
      return 'Unknown';
  }
}
