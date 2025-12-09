export function getChromeVersion(userAgent: string): string {
  const match = userAgent.match(/Chrome\/(\d+)/);
  return match ? `Chrome ${match[1]}` : 'Chrome';
}
