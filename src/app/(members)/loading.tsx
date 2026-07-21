// Fallback de navegação da área de membros. Sem isto, as pages (server
// components que dão await em auth + curso antes de renderizar) deixam a tela
// parada até o servidor responder — o clique parece travar. Este skeleton
// aparece na hora em qualquer rota do grupo, então a navegação fica reativa.
export default function MembersLoading() {
  return (
    <div
      className="mx-auto max-w-6xl animate-pulse px-4 py-6 sm:px-6 sm:py-8 md:py-10"
      role="status"
      aria-label="Carregando"
    >
      <div className="mb-8 space-y-3">
        <div className="h-3 w-32 rounded bg-[var(--surface)]" />
        <div className="h-8 w-3/4 max-w-md rounded-lg bg-[var(--surface)]" />
        <div className="h-4 w-full max-w-lg rounded bg-[var(--surface)]" />
        <div className="flex gap-2 pt-1">
          <div className="h-6 w-24 rounded-full bg-[var(--surface)]" />
          <div className="h-6 w-20 rounded-full bg-[var(--surface)]" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-40 rounded-xl bg-[var(--surface)]" />
        <div className="flex gap-4 overflow-hidden">
          <div className="h-48 w-72 flex-shrink-0 rounded-xl bg-[var(--surface)]" />
          <div className="h-48 w-72 flex-shrink-0 rounded-xl bg-[var(--surface)]" />
          <div className="hidden h-48 w-72 flex-shrink-0 rounded-xl bg-[var(--surface)] sm:block" />
        </div>
      </div>
    </div>
  );
}
