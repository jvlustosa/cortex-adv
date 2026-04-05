export type CoworkFaq = { question: string; answer: string };

export const CLAUDE_COWORK_FAQS: CoworkFaq[] = [
  {
    question: "O que é o Claude Cowork?",
    answer:
      "É a integração do Claude (IA da Anthropic) com o Chat Jurídico. O Claude passa a ter acesso ao seu CRM, contatos, conversas e funil. Você conversa com ele em linguagem natural e ele executa tarefas no seu escritório: classifica leads, envia follow-ups, analisa documentos e gera relatórios.",
  },
  {
    question: "Preciso saber programar para usar?",
    answer:
      "Não. A implantação completa é feita pela nossa equipe, e você recebe acompanhamento contínuo para extrair resultados duradouros. No dia a dia, o Claude Cowork funciona por conversa em linguagem natural. Você digita \"envie follow-up para os leads de ontem\" e ele executa.",
  },
  {
    question: "Quanto custa o Claude Cowork?",
    answer:
      "O Claude Cowork é um adicional de R$149/mês sobre o plano do Chat Jurídico. Os primeiros da fila de espera terão condições exclusivas de lançamento. Você também precisa de uma assinatura do Claude (da Anthropic), que tem plano gratuito e planos pagos.",
  },
  {
    question: "Meus dados de clientes ficam seguros?",
    answer:
      "Sim. A conexão entre o Claude e o Chat Jurídico acontece via MCP (Model Context Protocol), um protocolo aberto da Anthropic. O Claude acessa apenas os dados que você autorizar, quando você solicitar. Nenhum dado é armazenado pela Anthropic para treinamento de modelos.",
  },
  {
    question: "Preciso ser cliente do Chat Jurídico?",
    answer:
      "Sim, o Claude Cowork é uma integração exclusiva para clientes do Chat Jurídico. As funcionalidades que interagem com CRM, contatos, conversas e funil dependem da plataforma.",
  },
  {
    question: "Posso personalizar os comandos?",
    answer:
      "Sim. Além dos comandos prontos, você pode pedir qualquer coisa em linguagem natural. O Claude entende o contexto do seu escritório e adapta as respostas. Quanto mais você usa, mais ele aprende o seu fluxo de trabalho.",
  },
  {
    question: "Preciso saber mexer no Claude Code?",
    answer:
      "Não. Nossa equipe configura tudo e te ensina a usar. Escritórios que passaram pela implantação começaram a performar 3x mais de uma semana para a outra.",
  },
];
