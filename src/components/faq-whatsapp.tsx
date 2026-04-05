"use client";

import { useCallback, useRef } from "react";
import styles from "./faq-whatsapp.module.css";

export interface FaqItem {
  question: string;
  answer: string;
  reaction?: string;
}

interface FaqWhatsappProps {
  heading?: string;
  subtitle?: string;
  items: FaqItem[];
}

export function FaqWhatsapp({
  heading = "Perguntas frequentes",
  subtitle = "Tire suas dúvidas sobre o Claude Cowork",
  items,
}: FaqWhatsappProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(
    (index: number) => {
      const list = listRef.current;
      if (!list) return;

      const item = list.children[index] as HTMLElement;
      if (!item) return;

      const btn = item.querySelector("button") as HTMLElement;
      const answer = item.querySelector(
        "[data-faq-answer]"
      ) as HTMLElement;
      const bubble = answer?.querySelector(
        `.${styles.aBubble}`
      ) as HTMLElement;
      if (!btn || !answer || !bubble) return;

      const expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!expanded));
      item.classList.toggle(styles.itemOpen, !expanded);

      if (!expanded) {
        answer.style.maxHeight = answer.scrollHeight + 40 + "px";
        const emoji = items[index].reaction;
        if (emoji && !bubble.querySelector(`.${styles.reaction}`)) {
          const el = document.createElement("span");
          el.className = styles.reaction;
          el.textContent = emoji;
          bubble.appendChild(el);
          requestAnimationFrame(() => el.classList.add(styles.reactionShow));
        }
      } else {
        const rx = bubble.querySelector(`.${styles.reaction}`);
        if (rx) {
          rx.classList.remove(styles.reactionShow);
          setTimeout(() => rx.parentNode?.removeChild(rx), 250);
        }
        answer.style.maxHeight = "0";
      }
    },
    [items]
  );

  return (
    <section className={styles.faq}>
      <div className={styles.container}>
        <h2 className={styles.title}>{heading}</h2>
        <p className={styles.subtitle}>{subtitle}</p>

        <div className={styles.list} ref={listRef}>
          {items.map((faq, i) => {
            const qMin = i * 2 + 1;
            const aMin = qMin + 1;
            const pad = (n: number) => String(n).padStart(2, "0");

            return (
              <div key={i} className={styles.item}>
                <button
                  className={styles.question}
                  type="button"
                  aria-expanded="false"
                  onClick={() => handleToggle(i)}
                >
                  <div className={styles.qAvatar} aria-hidden="true">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className={styles.qBubble}>
                    <span className={styles.qText}>{faq.question}</span>
                    <span className={styles.qTime}>15:{pad(qMin)}</span>
                  </div>
                  <span className={styles.toggleIcon} aria-hidden="true">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path className={styles.toggleV} d="M12 5v14" />
                    </svg>
                  </span>
                </button>

                <div className={styles.answer} data-faq-answer>
                  <div className={styles.aWrap}>
                    <div className={styles.aBubbles}>
                      <div className={styles.aBubble}>
                        <div className={styles.aBubbleInner}>
                          <span className={styles.aText}>{faq.answer}</span>
                          <span className={styles.aTime}>
                            15:{pad(aMin)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.aAvatar} aria-hidden="true">
                      C
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
