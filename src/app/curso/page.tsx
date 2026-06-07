import { redirect } from "next/navigation";

/** Roteiro completo é interno — redireciona para sneak peek público. */
export default function CursoPage() {
  redirect("/#trilha");
}
