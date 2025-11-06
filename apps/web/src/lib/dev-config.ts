export interface CustomRpcConfig {
  url: string;
  enabled: boolean;
}

export class DevConfigManager {
  private static STORAGE_KEY = 'custom-rpc-config';

  static getConfig(): CustomRpcConfig | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  static saveConfig(config: CustomRpcConfig): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('rpc-config-changed', { detail: config }));
  }

  static clearConfig(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('rpc-config-changed', { detail: null }));
  }
}
