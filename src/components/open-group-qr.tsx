"use client";

import Image from "next/image";
import { useState } from "react";
import { Lock } from "lucide-react";
import { GroupGateModal } from "@/components/group-gate-modal";
import { useIsLead } from "@/lib/waitlist/lead";

/**
 * QR do grupo aberto (desktop). Sem lead o código fica borrado — senão o gate
 * do botão seria decorativo: bastaria apontar a câmera.
 */
export function OpenGroupQr() {
  const isLead = useIsLead();
  const [gateOpen, setGateOpen] = useState(false);

  return (
    <div className="hidden md:block">
      <div
        className="relative overflow-hidden rounded-2xl bg-white p-5"
        style={{
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        <Image
          src="/assets/images/qr-grupo-whatsapp.png"
          alt="QR Code do grupo aberto Claude Academy no WhatsApp"
          width={320}
          height={320}
          className={`size-80 rounded-lg transition ${
            isLead ? "" : "select-none blur-md"
          }`}
          priority
        />

        {isLead ? null : (
          <button
            type="button"
            onClick={() => setGateOpen(true)}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45 text-sm font-medium text-white transition hover:bg-black/55"
          >
            <Lock className="size-5" aria-hidden />
            Preencha para liberar o QR
          </button>
        )}
      </div>

      <p className="mt-3 text-xs" style={{ color: "#71717a" }}>
        {isLead
          ? "Aponte a câmera do celular para entrar"
          : "Deixe seus dados e o QR aparece aqui"}
      </p>

      <GroupGateModal open={gateOpen} onClose={() => setGateOpen(false)} />
    </div>
  );
}
