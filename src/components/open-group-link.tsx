"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { GroupGateModal } from "@/components/group-gate-modal";
import { OPEN_WHATSAPP_GROUP_URL } from "@/lib/site";
import { useIsLead } from "@/lib/waitlist/lead";

type OpenGroupLinkProps = {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/**
 * Todo caminho para o grupo aberto passa por aqui: sem lead, o clique abre o
 * formulário; com lead, segue direto pro WhatsApp. O href real fica no anchor,
 * então sem JS o link continua funcionando.
 */
export function OpenGroupLink({
  className,
  style,
  children,
}: OpenGroupLinkProps) {
  const isLead = useIsLead();
  const [gateOpen, setGateOpen] = useState(false);

  return (
    <>
      <a
        href={OPEN_WHATSAPP_GROUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
        onClick={(event) => {
          if (isLead) return;
          event.preventDefault();
          setGateOpen(true);
        }}
      >
        {children}
      </a>

      <GroupGateModal open={gateOpen} onClose={() => setGateOpen(false)} />
    </>
  );
}
