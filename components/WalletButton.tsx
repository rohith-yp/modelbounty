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
        className="flex items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-2 text-xs text-cyan-200 transition hover:border-cyan-300/40"
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            walletConnected ? "bg-emerald-400" : "bg-cyan-300"
          }`}
        />
        {walletConnected ? (
          <span className="flex items-center gap-1.5">
            <span className="text-zinc-400 font-normal">Connected</span>
            <span className="font-mono text-cyan-300 font-medium">0x7A...91F2</span>
          </span>
        ) : (
          "Connect Wallet"
        )}
      </button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#090d13] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <h3 className="text-base font-semibold text-white">
                Wallet Connection
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="py-6">
              {walletConnected ? (
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Demo Wallet Connected
                  </div>
                  <div className="mt-2 rounded-xl border border-white/[0.06] bg-black/30 p-3 font-mono text-xs text-zinc-300">
                    0x7A...91F2
                  </div>
                  <p className="mt-3 text-xs text-zinc-400">
                    You are connected in demo mode. Full Web3 provider integration will be connected later.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Connect a wallet to continue.
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    For this prototype, you can connect in demo mode as 0x7A...91F2. Real blockchain wallet connections will be enabled during smart contract deployment.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] pt-4">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>

              {walletConnected ? (
                <button
                  onClick={handleDisconnect}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/20"
                >
                  Disconnect Demo Wallet
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  className="rounded-lg bg-cyan-300 px-4 py-2 text-xs font-semibold text-[#061014] transition hover:bg-cyan-200"
                >
                  Connect Demo Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
