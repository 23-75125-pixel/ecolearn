"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, BookOpenCheck, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import heroImage from "@/app/image.jpeg";
import { buttonClasses } from "@/components/ui/button";
import { ICON_INLINE, SUBTEXT, TITLE } from "@/lib/ui/styles";
import { cn } from "@/lib/utils/cn";

const HEADLINE_WORDS = ["Learn", "anything", "you", "set", "your", "mind", "to."];

type SceneStyle = CSSProperties & {
  "--hero-progress": number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function HeroScrollScene() {
  const sceneRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const updateProgress = () => {
      frame = 0;
      const scene = sceneRef.current;
      if (!scene) return;

      const range = Math.max(scene.offsetHeight - window.innerHeight, 1);
      setProgress(clamp(-scene.getBoundingClientRect().top / range, 0, 1));
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      ref={sceneRef}
      aria-labelledby="hero-heading"
      className="hero-scroll-scene"
      style={{ "--hero-progress": progress } as SceneStyle}
    >
      <div className="hero-scroll-sticky">
        <div aria-hidden="true" className="hero-scroll-glow hero-scroll-glow-one" />
        <div aria-hidden="true" className="hero-scroll-glow hero-scroll-glow-two" />
        <div aria-hidden="true" className="hero-scroll-grid" />

        <div className="hero-scroll-content">
          <div className="hero-scroll-copy text-center lg:text-left">
            <div className="hero-scroll-eyebrow">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              Learning that moves with you
            </div>
            <h1 id="hero-heading" className={cn(TITLE, "mt-5 text-balance text-4xl sm:text-5xl lg:text-6xl")}>
              {HEADLINE_WORDS.map((word, index) => (
                <span
                  key={`${word}-${index}`}
                  className="animate-word-in inline-block"
                  style={{ "--word-delay": `${150 + index * 70}ms` } as CSSProperties}
                >
                  {word}{"\u00A0"}
                </span>
              ))}
            </h1>
            <p className={cn("mx-auto mt-5 max-w-xl text-pretty leading-7 lg:mx-0", SUBTEXT)}>
              Real help for real classroom challenges: homework, exams, and skills you will use long after school.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link href="/tutors" className={buttonClasses({ size: "lg" })}>
                Find your tutor
                <ArrowRight aria-hidden="true" className={ICON_INLINE} />
              </Link>
            </div>
          </div>

          <div className="hero-scroll-stage" aria-label="EcoLearn learning platform preview">
            <div aria-hidden="true" className="hero-scroll-orbit hero-scroll-orbit-one" />
            <div aria-hidden="true" className="hero-scroll-orbit hero-scroll-orbit-two" />
            <div className="hero-scroll-frame">
              <div className="hero-scroll-image-wrap">
                <Image
                  src={heroImage}
                  alt="A tutor guiding a young student through written work"
                  fill
                  priority
                  quality={90}
                  sizes="(max-width: 1024px) 90vw, 560px"
                  className="object-cover"
                />
                <div className="hero-scroll-image-shade" />
                <div className="hero-scroll-badge">
                  <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                  Every tutor is admin-verified
                </div>
                <div className="hero-scroll-image-caption">
                  <span className="text-xs uppercase tracking-[0.2em] text-white/60">Your next step</span>
                  <span className="mt-1 block text-lg font-medium text-white">Starts with one good question.</span>
                </div>
              </div>

              <div className="hero-scroll-float-card hero-scroll-float-card-top">
                <GraduationCap aria-hidden="true" className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <span>
                  <strong className="block text-xs font-medium">Personal guidance</strong>
                  <span className="mt-0.5 block text-[11px] text-zinc-500 dark:text-zinc-400">Built around your goals</span>
                </span>
              </div>
              <div className="hero-scroll-float-card hero-scroll-float-card-bottom">
                <BookOpenCheck aria-hidden="true" className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <span>
                  <strong className="block text-xs font-medium">Keep progressing</strong>
                  <span className="mt-0.5 block text-[11px] text-zinc-500 dark:text-zinc-400">One session at a time</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-scroll-progress" aria-hidden="true">
          <span className="hero-scroll-progress-line" />
          <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
            <ArrowDown className="h-3.5 w-3.5" />
            Scroll to explore
          </span>
        </div>
      </div>
    </section>
  );
}
