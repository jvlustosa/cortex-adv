import { NextResponse } from "next/server";
import { CHECKOUT } from "@/lib/pricing";

/**
 * Atalho pro checkout com voucher (50% off). Existe só pra ter um link curto
 * de mandar no WhatsApp — o valor não aparece em lugar nenhum da página de
 * vendas. Fora do sitemap e bloqueado no robots: não é pra ser descoberto,
 * mas também não é gate de acesso — quem tem o link, compra.
 */
export async function GET() {
  return NextResponse.redirect(CHECKOUT.voucher, 307);
}
