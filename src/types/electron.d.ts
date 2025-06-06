interface ElectronAPI {
  silentPrint: (content: string) => Promise<{ success: boolean; error?: string; data?: any }>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {}; 