import type { Metadata } from "next";
import { QuizClient } from "./quiz-client";
import { questions } from "./quiz-data";

export const metadata: Metadata = {
  title: "Quiz — Quão atualizado você está com IA? | Claude para advogados",
  description:
    "Descubra em 2 minutos se você está acompanhando os avanços da IA generativa e dos agentes de IA na advocacia. Quiz gratuito com resultado imediato.",
  keywords: [
    "quiz IA advogados",
    "teste inteligência artificial advocacia",
    "agentes de IA advogados",
    "Claude para advogados quiz",
    "IA generativa escritório direito",
  ],
};

const quizJsonLd = {
  "@context": "https://schema.org",
  "@type": "Quiz",
  name: "Quão atualizado você está com IA?",
  description:
    `Quiz de ${questions.length} perguntas para advogados descobrirem seu nível de atualização com ferramentas e agentes de IA.`,
  educationalLevel: "Professional",
  about: {
    "@type": "Thing",
    name: "Inteligência Artificial na Advocacia",
  },
  numberOfQuestions: questions.length,
  timeRequired: "PT2M",
};

export default function QuizPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(quizJsonLd) }}
      />
      <QuizClient />
    </>
  );
}
