import type { SystemInfo } from '../interfaces/system-info.interface';

export type ScreenshotSession = {
  dataUrl: string;
  systemInfo: SystemInfo;
  timestamp: number;
};
