"use client";

import { useEffect, useState } from "react";

export default function WalletButton() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    function checkWallet() {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("modelbounty_wallet_demo");
        setWalletConnected(saved === "true");
      }
    }

    checkWallet();
    window.addEventListener("modelbounty_wallet_changed", checkWallet);
    window.addEventListener("storage", checkWallet);

    return () => {
      window.removeEventListener("modelbounty_wallet_changed", checkWallet);
      window.removeEventListener("storage", checkWallet);
    };
  }, []);

  function handleConnect() {
    if (typeof window !== "undefined") {
      localStorage.setItem("modelbounty_wallet_demo", "true");
      window.dispatchEvent(new Event("modelbounty_wallet_changed"));
    }
    setWalletConnected(true);
    setModalOpen(false);
  }

  function handleDisconnect() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("modelbounty_wallet_demo");
      window.dispatchEvent(new Event("modelbounty_wallet_changed"));
    }
    setWalletConnected(false);
    setModalOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-2 rounded border border-[#232732] bg-[#13151B] px-3 py-1.5 text-xs font-mono text-[#8C93A4] transition hover:border-[#3D4454] hover:text-[#EDEDF0]"
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            walletConnected ? "bg-[#38A169]" : "bg-[#E09F3E]"
          }`}
        />
        {walletConnected ? (
          <span className="flex items-center gap-1.5">
            <span className="text-[#525866]">ETH</span>
            <span className="text-[#EDEDF0] font-medium">0x7A...91F2</span>
          </span>
        ) : (
          <span className="text-[#EDEDF0]">CONNECT_WALLET</span>
        )}
      </button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded border border-[#232732] bg-[#13151B] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#232732] pb-3">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#EDEDF0]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E09F3E]" />
                Wallet Session Ledger
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-xs font-mono text-[#525866] hover:text-[#EDEDF0] transition"
              >
                [ESC]
              </button>
            </div>

            <div className="py-4">
              {walletConnected ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8C93A4]">Status</span>
                    <span className="inline-flex items-center gap-1.5 text-[#38A169] font-mono text-[11px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#38A169]" />
                      CONNECTED_ACTIVE
                    </span>
                  </div>

                  <div className="rounded border border-[#1C2029] bg-[#0C0D10] p-2.5">
                    <div className="text-[10px] font-mono text-[#525866] uppercase">Account Address</div>
                    <div className="mt-1 font-mono text-xs text-[#EDEDF0] tracking-wide select-all">
                      0x7A29f3d9b4b029B9057B362F11397858c70491F2
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[#8C93A4]">Escrow Network</span>
                    <span className="font-mono text-xs text-[#EDEDF0]">Sepolia (11155111)</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[#8C93A4] leading-relaxed">
                    Connect cryptographic identity to sign findings, claim bounties, or deploy model escrow pools.
                  </p>
                  <div className="rounded border border-[#1C2029] bg-[#0C0D10] p-2.5 text-[11px] font-mono text-[#525866]">
                    SESSION: DEMO_RESEARCHER_KEY
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#232732] pt-3">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded border border-[#232732] px-3 py-1.5 text-xs font-mono text-[#8C93A4] hover:text-[#EDEDF0] transition"
              >
                Dismiss
              </button>

              {walletConnected ? (
                <button
                  onClick={handleDisconnect}
                  className="rounded border border-[#D9534F]/30 bg-[#D9534F]/10 px-3 py-1.5 text-xs font-mono font-medium text-[#D9534F] transition hover:bg-[#D9534F]/20"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  className="rounded border border-[#E09F3E]/40 bg-[#E09F3E] px-3.5 py-1.5 text-xs font-mono font-semibold text-[#0C0D10] transition hover:bg-[#EBB052]"
                >
                  Authorize 0x7A...
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
