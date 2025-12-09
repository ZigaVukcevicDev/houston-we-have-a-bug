export function detectOS(userAgent: string): string {
  if (userAgent.includes("Mac OS X")) {
    return "macOS";
  } else if (userAgent.includes("Windows")) {
    return "Windows";
  } else if (userAgent.includes("Linux")) {
    return "Linux";
  } else if (userAgent.includes("Android")) {
    return "Android";
  } else if (
    userAgent.includes("iOS") ||
    userAgent.includes("iPhone") ||
    userAgent.includes("iPad")
  ) {
    return "iOS";
  }
  return "Unknown";
}
