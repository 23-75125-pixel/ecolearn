"use client";

import Image from "next/image";
import { useEffect, useRef, type ReactNode } from "react";
import heroImage from "@/app/image.jpeg";

export function HomeScrollReveal({ children }: { children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const travelImageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const sections = Array.from(content.children) as HTMLElement[];
    content.classList.add("is-scroll-ready");
    let frame = 0;

    const updateProgress = () => {
      frame = 0;
      const pageRange = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const pageProgress = Math.min(Math.max(window.scrollY / pageRange, 0), 1);
      content.style.setProperty("--homepage-progress", pageProgress.toFixed(3));
      const horizontalProgress =
        pageProgress < 0.42
          ? -45 * (pageProgress / 0.42)
          : -45 + 90 * ((pageProgress - 0.42) / 0.58);
      const travelImage = travelImageRef.current;
      travelImage?.style.setProperty("--travel-x", `${horizontalProgress}vw`);
      travelImage?.style.setProperty("--travel-y", `${8 + pageProgress * 72}vh`);
      travelImage?.style.setProperty("--travel-rotation", `${pageProgress * 720}deg`);
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
    <>
      <div ref={travelImageRef} className="homepage-travel-image" aria-hidden="true">
        <Image
          src={heroImage}
          alt=""
          fill
          sizes="clamp(7rem, 17vw, 15rem)"
          quality={90}
          className="object-cover"
        />
      </div>
      <div ref={contentRef} className="homepage-scroll-content">
        {children}
      </div>
    </>
  );
}
