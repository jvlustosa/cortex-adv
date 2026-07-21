import { COURSE } from "@/data/course-content";
import {
  TRILHA_NIVEIS_PUBLIC,
  type TrilhaNivelPublic,
} from "@/data/curso-trilha-public";
import { SEASON_COVER_IMAGES } from "@/lib/course/module-covers";

/**
 * Módulos do roteiro público que ainda NÃO estão no curso real (course.yml).
 * Renderizados como "Sessões em breve" na área de membros — o aluno vê que a
 * trilha cresce, em vez de achar que o curso são só os módulos já gravados.
 *
 * Fonte do roteiro: curso-trilha-public.ts (mesma da landing). Ao publicar um
 * módulo no course.yml, mapeie o id aqui pro nível correspondente da trilha.
 */
const MODULE_ID_TO_TRILHA_LEVEL: Record<string, string> = {
  "comece-aqui": "0",
  "fundacao-pratica": "1",
};

export type ComingSoonModule = {
  id: string;
  title: string;
  teaser: string;
  coverImage: string;
};

function toComingSoonModule(n: TrilhaNivelPublic): ComingSoonModule {
  return {
    id: `em-breve-${n.level}`,
    title: n.title,
    teaser: n.teaser,
    coverImage: SEASON_COVER_IMAGES[Number(n.level)] ?? SEASON_COVER_IMAGES[0],
  };
}

/** Níveis da trilha pública ainda não cobertos pelos módulos publicados. */
export function getComingSoonModules(
  publishedModuleIds: readonly string[],
): ComingSoonModule[] {
  const releasedLevels = new Set(
    publishedModuleIds
      .map((id) => MODULE_ID_TO_TRILHA_LEVEL[id])
      .filter((level): level is string => Boolean(level)),
  );

  return TRILHA_NIVEIS_PUBLIC.filter((n) => !releasedLevels.has(n.level)).map(
    toComingSoonModule,
  );
}

/** Default estático (course.yml) — usado onde não há curso merged em runtime. */
export const COMING_SOON_MODULES = getComingSoonModules(
  COURSE.modules.map((m) => m.id),
);
