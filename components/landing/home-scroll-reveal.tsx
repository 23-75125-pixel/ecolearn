"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function HomeScrollReveal({ children }: { children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const sections = Array.from(content.children) as HTMLElement[];
    content.classList.add("is-scroll-ready");
    let frame = 0;

    const updateProgress = () => {
      frame = 0;
      const viewportCenter = window.innerHeight * 0.58;

      sections.forEach((section) => {
        if (section.classList.contains("hero-scroll-scene")) return;

        const bounds = section.getBoundingClientRect();
        const travel = Math.max(bounds.height + window.innerHeight * 0.35, 1);
        const progress = Math.min(Math.max((viewportCenter - bounds.top) / travel, 0), 1);
        section.style.setProperty("--section-progress", progress.toFixed(3));
      });
    };

    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={contentRef} className="homepage-scroll-content">
      {children}
    </div>
  );
}
