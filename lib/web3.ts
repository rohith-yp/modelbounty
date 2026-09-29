export const DEMO_WALLET_ADDRESS = "0x7A29f3d9b4b029B9057B362F11397858c70491F2";

export function getDemoWalletState(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("modelbounty_wallet_demo") === "true";
}

export function setDemoWalletState(connected: boolean): void {
  if (typeof window === "undefined") return;
  if (connected) {
    window.localStorage.setItem("modelbounty_wallet_demo", "true");
  } else {
    window.localStorage.removeItem("modelbounty_wallet_demo");
  }
  window.dispatchEvent(new Event("modelbounty_wallet_changed"));
}
