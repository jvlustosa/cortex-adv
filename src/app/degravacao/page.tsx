import Link from "next/link";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { ClaudeAcademyBrand } from "@/components/claude-academy-brand";
import { HeaderAuthCta } from "@/components/header-auth-cta";
import {
  DEGRAVACAO_AUTHOR,
  DEGRAVACAO_FEATURES,
  DEGRAVACAO_REQUIREMENTS,
  DEGRAVACAO_USE_CASES,
} from "@/data/degravacao";
import { pageShellClass } from "@/lib/layout";
import { CHECKOUT, DEGRAVACAO_PRICING, formatBRL } from "@/lib/pricing";
import { SITE_NAME } from "@/lib/site";
import { COURSE_SUPPORT_WHATSAPP } from "@/lib/support";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Degravação com Claude | Claude Academy",
  description:
    "Plugin que degrava audiências, depoimentos e reuniões no seu computador, com minutagem, separação de falantes, documento em Word e player com marcações.",
  alternates: { canonical: "/degravacao" },
};

const price = formatBRL(DEGRAVACAO_PRICING.price);

// Sem link do Asaas configurado, a compra vai pelo WhatsApp: melhor que um
// botão para um checkout que não existe.
const checkoutUrl =
  CHECKOUT.degravacao ||
  `https://wa.me/${COURSE_SUPPORT_WHATSAPP}?text=${encodeURIComponent(
    "Olá! Quero comprar o Degravação com Claude.",
  )}`;

const STEPS = [
  {
    title: "Instale o plugin no Claude",
    description:
      "Um arquivo, enviado em Personalizar › Plugins. Não precisa instalar Python antes: o Claude cuida disso.",
  },
  {
    title: "Escolha a pasta dos vídeos",
    description:
      "Pode ser a do Google Drive, OneDrive ou Dropbox. Os vídeos originais nunca são movidos nem alterados.",
  },
  {
    title: "Peça e revise no player",
    description:
      "“Degrava os vídeos novos.” Corrija frases e nomes dos falantes no player; a correção volta para o documento e para o Word.",
  },
];

const INCLUDED = [
  "Acesso à área do Degravação no Claude Academy",
  "Arquivo .plugin da versão estável, pronto para instalar",
  "Passo a passo de instalação e os pedidos do dia a dia",
  "As versões novas e o que mudou em cada uma, no mesmo lugar",
];

const FAQ = [
  {
    question: "Precisa instalar Python ou saber programar?",
    answer:
      "Não. O Claude confere o computador e instala o que falta, sem pedir senha de administrador. Você só precisa do app do Claude com a aba Code.",
  },
  {
    question: "O vídeo sai do meu computador?",
    answer:
      "Não. A transcrição e a separação de falantes rodam na sua máquina. O texto da degravação é lido pelo Claude, na sua conta, para montar o resumo e os tópicos.",
  },
  {
    question: "Funciona em qual computador?",
    answer: `${DEGRAVACAO_REQUIREMENTS.join(". ")}.`,
  },
  {
    question: "Já sou aluno do curso. Preciso comprar?",
    answer:
      "Não. O Degravação está incluído no curso. Entre na área de membros e abra a aba Degravação.",
  },
  {
    question: "Como recebo o acesso?",
    answer:
      "Depois do pagamento, chega um e-mail com o link para ativar sua conta. Não tem senha: você entra pelo link.",
  },
  {
    question: "Tem garantia?",
    answer: `Tem. ${DEGRAVACAO_PRICING.guaranteeDays} dias a partir da compra. Se não servir, devolvemos 100% do valor.`,
  },
  {
    question: "O plugin é aberto?",
    answer:
      "É. O código está no GitHub do autor. Quem compra aqui leva a área organizada no Claude Academy: a versão pronta para instalar, o passo a passo e as versões novas com o que mudou.",
  },
];

const primaryCtaClass =
  "inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-medium text-[var(--background)] transition hover:bg-[var(--accent-hover)]";

const sectionTitleClass =
  "font-serif text-2xl tracking-tight text-[var(--foreground)] md:text-3xl";

export default function DegravacaoPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
        <div
          className={cn(
            pageShellClass,
            "flex items-center justify-between gap-3 py-3 sm:py-4",
          )}
        >
          <ClaudeAcademyBrand size="sm" className="shrink sm:hidden" />
          <ClaudeAcademyBrand size="md" className="hidden shrink sm:flex" />
          <nav className="flex shrink-0 items-center gap-2 text-sm">
            <HeaderAuthCta />
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="px-4 pb-12 pt-14 sm:px-6 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
              Plugin para o Claude
            </p>
            <h1 className="mt-4 font-serif text-4xl tracking-tight text-[var(--foreground)] md:text-5xl">
              Degravação de audiência com minutagem, feita no seu computador
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[var(--muted)]">
              Você aponta a pasta dos vídeos e pede: “degrava os vídeos novos”.
              Sai a degravação integral, separada por falante, com resumo,
              tópicos e pontos de atenção, em Markdown e em Word, mais um player
              com o texto sincronizado.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={primaryCtaClass}
              >
                Comprar por {price}
                <ArrowRight className="size-4 opacity-90" aria-hidden />
              </a>
              <p className="text-sm text-[var(--muted)]">
                Garantia de {DEGRAVACAO_PRICING.guaranteeDays} dias · Windows ou
                Mac · Aluno do curso já tem incluído
              </p>
            </div>
            <ul className="mt-10 flex flex-wrap justify-center gap-2">
              {DEGRAVACAO_USE_CASES.map((useCase) => (
                <li
                  key={useCase}
                  className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-sm text-[var(--muted)]"
                >
                  {useCase}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-[var(--border)] px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className={cn(sectionTitleClass, "text-center")}>
              O que ele faz
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {DEGRAVACAO_FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
                >
                  <h3 className="font-medium text-[var(--foreground)]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--border)] px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className={cn(sectionTitleClass, "text-center")}>
              Como funciona
            </h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
                >
                  <span className="text-sm font-medium text-[var(--accent)]">
                    {index + 1}
                  </span>
                  <h3 className="mt-2 font-medium text-[var(--foreground)]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="comprar"
          className="border-t border-[var(--border)] bg-[var(--surface-overlay)] px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="mx-auto max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
            <h2 className={sectionTitleClass}>O que você compra</h2>
            <ul className="mt-6 space-y-3">
              {INCLUDED.map((item) => (
                <li key={item} className="flex gap-3 text-[var(--foreground)]">
                  <Check
                    className="mt-0.5 size-5 shrink-0 text-[var(--accent)]"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 font-serif text-4xl tracking-tight text-[var(--foreground)]">
              {price}
            </p>
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(primaryCtaClass, "mt-6")}
            >
              Comprar o Degravação
              <ArrowRight className="size-4 opacity-90" aria-hidden />
            </a>
            <p className="mt-6 flex gap-2 text-sm text-[var(--muted)]">
              <ShieldCheck
                className="size-5 shrink-0 text-[var(--accent)]"
                aria-hidden
              />
              Garantia de {DEGRAVACAO_PRICING.guaranteeDays} dias: se não servir,
              devolvemos 100% do valor.
            </p>
            <p className="mt-4 text-sm text-[var(--muted)]">
              Já é aluno do curso? O Degravação está incluído.{" "}
              <Link
                href="/area-de-membros/degravacao"
                className="underline underline-offset-4 hover:text-[var(--foreground)]"
              >
                Abrir na área de membros
              </Link>
            </p>
          </div>
        </section>

        <section className="border-t border-[var(--border)] px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-2xl">
            <h2 className={cn(sectionTitleClass, "text-center")}>
              Perguntas frequentes
            </h2>
            <div className="mt-8 space-y-3">
              {FAQ.map((item) => (
                <details
                  key={item.question}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4"
                >
                  <summary className="cursor-pointer font-medium text-[var(--foreground)]">
                    {item.question}
                  </summary>
                  <p className="mt-3 leading-relaxed text-[var(--muted)]">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] px-4 py-8 sm:px-6">
        <div
          className={cn(
            pageShellClass,
            "flex flex-col items-center justify-between gap-4 text-center text-sm text-[var(--muted)] sm:flex-row sm:text-left",
          )}
        >
          <span>
            Plugin desenvolvido por{" "}
            <a
              href={DEGRAVACAO_AUTHOR.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-[var(--foreground)]"
            >
              {DEGRAVACAO_AUTHOR.name}
            </a>
            . Vendido no {SITE_NAME}.
          </span>
          <Link
            href="/"
            className="underline underline-offset-4 hover:text-[var(--foreground)]"
          >
            Conheça o curso
          </Link>
        </div>
      </footer>
    </div>
  );
}
