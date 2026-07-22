"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClaudeAcademyBrand } from "@/components/claude-academy-brand";
import {
  computeCost,
  EFFORT,
  fmtK,
  fmtUsd,
  MODELS,
  PRESETS,
  SIMULATOR_FAQ,
  type EffortLevel,
  type ModelId,
  type PresetId,
} from "./simulator-data";
import styles from "./simulator.module.css";

const EFFORT_LEVELS = Object.keys(EFFORT) as EffortLevel[];

export function SimulatorClient() {
  const [pgIn, setPgIn] = useState(40);
  const [pgOut, setPgOut] = useState(12);
  const [effort, setEffort] = useState<EffortLevel>("high");
  const [batch, setBatch] = useState(false);
  const [cache, setCache] = useState(false);
  const [postSeptember, setPostSeptember] = useState(false);
  const [compareSonnet46, setCompareSonnet46] = useState(false);
  const [monCount, setMonCount] = useState(100);
  const [monModel, setMonModel] = useState<ModelId>("sonnet5");

  const options = useMemo(
    () => ({
      batch,
      cache,
      postSeptember,
      compareSonnet46,
      effort,
    }),
    [batch, cache, postSeptember, compareSonnet46, effort],
  );

  const activeModels = useMemo(
    () => MODELS.filter((m) => !m.optional || compareSonnet46),
    [compareSonnet46],
  );

  const rows = useMemo(
    () =>
      activeModels.map((m) => ({
        m,
        c: computeCost(m, pgIn, pgOut, options),
      })),
    [activeModels, pgIn, pgOut, options],
  );

  const maxTotal = useMemo(
    () => Math.max(...rows.map((d) => d.c.total), 0.001),
    [rows],
  );

  const monthlyRow =
    rows.find((d) => d.m.id === monModel) ??
    rows.find((d) => d.m.id === "sonnet5") ??
    rows[0];

  const tokinfo = [
    `effort ${effort}`,
    batch ? "batch −50%" : null,
    cache ? "cache" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  function applyPreset(id: PresetId) {
    const p = PRESETS[id];
    setPgIn(p.i);
    setPgOut(p.o);
  }

  function modelTag(modelId: ModelId) {
    if (modelId === "sonnet5") {
      return postSeptember ? "preço de setembro" : "intro até 31/ago";
    }
    return MODELS.find((m) => m.id === modelId)?.tag ?? "";
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <ClaudeAcademyBrand size="sm" />
          <Link href="/" className={styles.headerLink}>
            Voltar ao curso
          </Link>
        </div>
      </header>

      <main>
        <div className={styles.wrap}>
          <div className={styles.hud}>
            <span>Master Class · Claude para Advogados</span>
            <span>
              <span className={styles.hudDot}>●</span>&nbsp; Simulador ao vivo
              &nbsp;·&nbsp; Vilas Boas · ChatJurídico
            </span>
          </div>

          <p className={styles.eyebrow}>Preço por milhão de tokens · na prática</p>
          <h1 className={styles.title}>
            Quanto custa <span className={`${styles.titleIt} ${styles.titleEm}`}>essa peça?</span>
          </h1>
          <p className={styles.sub}>
            Ajuste o tamanho do trabalho, o nível de <em>effort</em> e os descontos
            — e veja o custo por requisição em cada modelo Claude, em tempo real.
          </p>

          <div className={styles.grid}>
            <div>
              <div className={styles.panel}>
                <div className={styles.ptitle}>Cenários prontos</div>
                <div className={styles.presets}>
                  {(Object.keys(PRESETS) as PresetId[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      className={styles.presetBtn}
                      onClick={() => applyPreset(id)}
                    >
                      <span className={styles.presetPk}>{PRESETS[id].pk}</span>
                      {PRESETS[id].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.panel}>
                <div className={styles.ptitle}>O trabalho</div>
                <div className={styles.ctrl}>
                  <div className={styles.lbl}>
                    <span className={styles.lblT}>Entrada — o que o modelo lê</span>
                    <span className={styles.lblV}>{pgIn} pgs</span>
                  </div>
                  <input
                    type="range"
                    className={styles.range}
                    min={1}
                    max={800}
                    value={pgIn}
                    onChange={(e) => setPgIn(+e.target.value)}
                    aria-label="Páginas de entrada"
                  />
                  <div className={styles.hint}>
                    Prompt + anexos + skills + histórico · ≈600 tokens/página
                    (estimativa)
                  </div>
                </div>
                <div className={styles.ctrl}>
                  <div className={styles.lbl}>
                    <span className={styles.lblT}>Saída — o que o modelo gera</span>
                    <span className={styles.lblV}>{pgOut} pgs</span>
                  </div>
                  <input
                    type="range"
                    className={styles.range}
                    min={1}
                    max={60}
                    value={pgOut}
                    onChange={(e) => setPgOut(+e.target.value)}
                    aria-label="Páginas de saída"
                  />
                  <div className={styles.hint}>
                    A peça produzida + o raciocínio (thinking conta como saída)
                  </div>
                </div>
                <div className={styles.ctrl}>
                  <div className={styles.lbl}>
                    <span className={styles.lblT}>Effort</span>
                    <span className={styles.lblV}>
                      {effort}
                      {effort === "high" ? " · padrão" : ""}
                    </span>
                  </div>
                  <div className={styles.seg} role="group" aria-label="Nível de effort">
                    {EFFORT_LEVELS.map((level) => (
                      <button
                        key={level}
                        type="button"
                        className={`${styles.segBtn} ${effort === level ? styles.segBtnOn : ""}`}
                        onClick={() => setEffort(level)}
                        aria-pressed={effort === level}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <div className={styles.hint}>
                    Modula profundidade, raciocínio e tool calls — efeito{" "}
                    <span style={{ color: "var(--ember-lt)" }}>ilustrativo</span>{" "}
                    sobre a saída (low ×0,5 · máx ×2)
                  </div>
                </div>
              </div>

              <div className={styles.panel}>
                <div className={styles.ptitle}>Descontos & cenários</div>
                <label className={styles.tog}>
                  <input
                    type="checkbox"
                    className={styles.togInput}
                    checked={batch}
                    onChange={(e) => setBatch(e.target.checked)}
                  />
                  <span className={styles.sw} aria-hidden />
                  <span className={styles.togTt}>
                    Batch API — rotina sem pressa
                    <small className={styles.togSmall}>−50% em entrada e saída</small>
                  </span>
                </label>
                <label className={styles.tog}>
                  <input
                    type="checkbox"
                    className={styles.togInput}
                    checked={cache}
                    onChange={(e) => setCache(e.target.checked)}
                  />
                  <span className={styles.sw} aria-hidden />
                  <span className={styles.togTt}>
                    Cache — contexto repetido
                    <small className={styles.togSmall}>
                      70% do input a 0,1× (skills, timbrado, instruções)
                    </small>
                  </span>
                </label>
                <label className={styles.tog}>
                  <input
                    type="checkbox"
                    className={styles.togInput}
                    checked={postSeptember}
                    onChange={(e) => setPostSeptember(e.target.checked)}
                  />
                  <span className={styles.sw} aria-hidden />
                  <span className={styles.togTt}>
                    Sonnet 5 depois de setembro
                    <small className={styles.togSmall}>
                      Fim do introdutório: US$ 2/10 → US$ 3/15
                    </small>
                  </span>
                </label>
                <label className={styles.tog}>
                  <input
                    type="checkbox"
                    className={styles.togInput}
                    checked={compareSonnet46}
                    onChange={(e) => setCompareSonnet46(e.target.checked)}
                  />
                  <span className={styles.sw} aria-hidden />
                  <span className={styles.togTt}>
                    Comparar com Sonnet 4.6
                    <small className={styles.togSmall}>
                      Tokenizador antigo — mesma US$ 3/15
                    </small>
                  </span>
                </label>
              </div>
            </div>

            <div>
              <div className={styles.panel} style={{ padding: "32px 34px" }}>
                <div className={styles.resHead}>
                  <span className={styles.resRt}>Custo por requisição</span>
                  <span className={styles.resRr}>{tokinfo}</span>
                </div>

                {rows.map(({ m, c }) => {
                  const width = Math.max(2, (c.total / maxTotal) * 100);
                  const hot = m.hot && !postSeptember;
                  const selected = monModel === m.id;

                  return (
                    <div
                      key={m.id}
                      className={`${styles.mrow} ${selected ? styles.mrowSelected : ""}`}
                      onClick={() => setMonModel(m.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setMonModel(m.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-pressed={selected}
                      aria-label={`Selecionar ${m.name} para projeção mensal`}
                    >
                      <div className={styles.mn}>
                        {m.name}
                        <span
                          className={`${styles.tag} ${hot ? styles.tagHot : ""}`}
                        >
                          {modelTag(m.id)}
                        </span>
                      </div>
                      <div>
                        <div className={styles.barwrap}>
                          <div
                            className={`${styles.bar} ${hot ? styles.barLt : ""}`}
                            style={{ width: `${width.toFixed(1)}%` }}
                          />
                        </div>
                        <div className={styles.split}>
                          <span>
                            in <b>{fmtUsd(c.inCost)}</b>
                          </span>
                          <span>·</span>
                          <span>
                            out <b>{fmtUsd(c.outCost)}</b>
                          </span>
                          <span>·</span>
                          <span>
                            {fmtK(c.inT)} → {fmtK(c.outT)} tokens
                          </span>
                        </div>
                      </div>
                      <div className={styles.mv}>
                        <span className={styles.usd}>{fmtUsd(c.total)}</span>
                        <span className={styles.per}>por requisição</span>
                      </div>
                    </div>
                  );
                })}

                <div className={styles.monthly}>
                  <div>
                    <div className={styles.ml}>
                      Projeção mensal — <b>{monCount}</b> requisições no modelo{" "}
                      <b>{monthlyRow.m.name}</b>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <input
                        type="range"
                        className={styles.range}
                        min={10}
                        max={2000}
                        step={10}
                        value={monCount}
                        onChange={(e) => setMonCount(+e.target.value)}
                        aria-label="Requisições por mês"
                      />
                    </div>
                  </div>
                  <div>
                    <div className={styles.monVal}>
                      {fmtUsd(monthlyRow.c.total * monCount).replace("US$ ", "")}
                    </div>
                    <small className={styles.monSmall}>USD / mês</small>
                  </div>
                </div>

                <div className={styles.foot}>
                  Valores oficiais por MTok em{" "}
                  <span className={styles.footEm}>jul/2026</span> ·
                  platform.claude.com/docs — cobrança em USD · Sonnet 5 introdutório
                  US$ 2/10 até <span className={styles.footEm}>31/ago/2026</span> ·
                  Tokenizador novo (Sonnet 5, Opus 4.8, Fable 5):{" "}
                  <span className={styles.footEm}>+30% de tokens</span> no mesmo
                  texto · Páginas→tokens e efeito do effort são{" "}
                  <span className={styles.footEm}>estimativas didáticas</span> — o
                  consumo real varia por caso.
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className={styles.seo} aria-labelledby="faq-heading">
          <h2 id="faq-heading" className={styles.seoTitle}>
            Calculadora de custo Claude para advogados — perguntas frequentes
          </h2>
          {SIMULATOR_FAQ.map((item) => (
            <article key={item.question} className={styles.faqItem}>
              <h3 className={styles.faqQ}>{item.question}</h3>
              <p className={styles.faqA}>{item.answer}</p>
            </article>
          ))}
          <div className={styles.ctaRow}>
            <Link href="/curso" className={`${styles.cta} ${styles.ctaPrimary}`}>
              Aprender a usar Claude no escritório
            </Link>
            <Link href="/quiz" className={`${styles.cta} ${styles.ctaSecondary}`}>
              Fazer o quiz de IA
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
