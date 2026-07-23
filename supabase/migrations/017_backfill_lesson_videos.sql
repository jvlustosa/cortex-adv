-- Preenche tella/duration/description nas aulas nativas quando o seed inicial
-- não gravou vídeo (006) e o overlay (lesson_overrides) não foi aplicado ao DB.
-- Idempotente: só atualiza linhas com tella vazio.

update public.lessons l
set
  tella = v.tella,
  duration = coalesce(nullif(l.duration, ''), v.duration),
  description = coalesce(nullif(l.description, ''), v.description),
  youtube_id = coalesce(l.youtube_id, v.youtube_id)
from (
  values
    ('comece-aqui', 'o-que-e-claude', '01-ca-1-o-que-e-o-claude-f528', null, '3:32', 'Não é só mais um chatbot. Uma inteligência que lê, raciocina e responde no nível de um colega sênior.'),
    ('comece-aqui', 'o-que-e-anthropic', '02-ca-2-o-que-e-a-anthropic-d1o3', null, '4:15', 'Quem está por trás do Claude e por que isso importa pra quem lida com dado sensível de cliente.'),
    ('comece-aqui', 'claude-vs-chatgpt', '03-ca-3-claude-vs-chatgpt-ahkq', null, '5:34', 'Onde o Claude brilha no jurídico, onde o ChatGPT leva vantagem, e por que o curso aposta no Claude.'),
    ('comece-aqui', 'nivel-de-dificuldade', '04-ca-4-nivel-de-dificuldade-para-adaptacao-224s', null, '6:09', 'A curva real de aprendizado: suave, com vitórias rápidas nos primeiros dias. Precisa de curiosidade, não de ser técnico.'),
    ('comece-aqui', 'qual-plano-escolher', '05-ca-5-qual-plano-escolher-04qx', null, '5:42', 'Visão geral de Free, Pro e Max pra você não travar na largada. O suficiente pra começar certo.'),
    ('fundacao-pratica', 'o-que-vai-aprender', '10-intro-o-que-voce-vai-aprender-no-modulo-1-1-5ut1', null, '4:27', 'O trailer do módulo em poucos minutos: a jornada do primeiro uau à primeira petição revisada.'),
    ('fundacao-pratica', '5-superpoderes', '11-os-5-superpoderes-do-claude-que-mais-ajudam-advogados-1-5crm', null, '9:34', 'Ler processos inteiros, dissecar contratos e laudos, criar peças e calculadoras do zero. A aula do encantamento.'),
    ('fundacao-pratica', 'escritorio-seguro-ia', '12-seu-escritorio-esta-seguro-para-usar-ia-4uuo', null, '15:20', 'As configurações de privacidade que todo advogado precisa ativar, e o que o Claude faz (e não faz) com o dado do cliente. LGPD e OAB desarmados.'),
    ('fundacao-pratica', 'o-que-e-contexto', '13-o-que-e-contexto-326q', null, '10:15', 'O conceito mais importante do curso. O que o Claude tem em mente em cada conversa, e o que acontece quando estoura.'),
    ('fundacao-pratica', 'ambientes-claude', '14-chat-projects-chrome-e-cowork-quando-usar-cada-ambiente-dggd', null, '7:02', 'Chat pra dúvida pontual, Projects pro contexto permanente, Cowork pro Claude agindo nos seus arquivos. Quando usar cada um.'),
    ('fundacao-pratica', 'quatro-pilares-delegar', '15-quatro-pilares-para-delegar-8e1r', null, '9:00', 'Contexto, exemplos, formato e verificação. Os quatro pilares que separam um pedido vago de uma delegação que o Claude executa direito.'),
    ('fundacao-pratica', 'assinaria-sem-conferir', '16-voce-assinaria-sem-conferir-2o7b', null, '8:56', 'A regra de ouro na prática: você assina, você responde. Revisão humana é inegociável, por mais convincente que a resposta pareça.'),
    ('instrucoes-basicas', 'configuracoes-privacidade', 'instrucoes-basicas-iii-configuracoes-e-privacidade-no-claude-8ox6', null, '3:59', 'As configurações de privacidade que todo advogado precisa conferir antes de subir qualquer coisa de cliente.'),
    ('instrucoes-basicas', 'importacao-de-dados', 'instrucoes-basicas-iv-importacao-de-dados-para-o-claude-df5w', null, '4:01', 'Como colocar seus documentos e dados dentro do Claude do jeito certo, sem bagunça e sem vazar o que não devia.'),
    ('instrucoes-basicas', 'gravacao-de-memorias', 'instrucoes-basicas-v-gravacao-basica-de-memorias-9k7z', null, '4:57', 'Como fazer o Claude lembrar do que importa entre conversas, sem precisar repetir tudo toda vez.'),
    ('skills', 'introducao-skills', 'introducao-ao-modulo-de-skills-no-cloud-68sx', null, '5:21', 'O que você vai construir neste módulo e por que skills são o pulo do gato pra industrializar o escritório.'),
    ('skills', 'prompts-vs-skills', 'prompts-vs-skills-qual-a-diferenca-euuq', null, '2:03', 'Prompt é o pedido da vez, skill é o padrão que fica. Quando usar cada um e por que confundir os dois trava seu ganho de escala.'),
    ('skills', 'verificar-seguranca-skills', 'como-verificar-a-seguranca-de-novas-skills-80c9', null, '7:23', 'Antes de instalar uma skill de terceiro, o que olhar pra não abrir a porta pro que não devia.'),
    ('skills', 'navegacao-e-skills', 'dicas-de-navegacao-e-skills-no-claude-eo75', null, '6:24', 'Atalhos e manhas do dia a dia pra achar, acionar e alternar entre skills sem perder o fio.'),
    ('skills', 'gerenciar-compartilhar-skills', 'como-gerenciar-compartilhar-e-atualizar-suas-skills-de-ia-1sp2', null, '14:59', 'Como manter sua biblioteca de skills organizada, dividir com a equipe e atualizar sem quebrar o que já funciona.')
) as v(module_slug, lesson_slug, tella, youtube_id, duration, description)
join public.modules m on m.slug = v.module_slug
where l.module_id = m.id
  and l.slug = v.lesson_slug
  and (l.tella is null or btrim(l.tella) = '');
