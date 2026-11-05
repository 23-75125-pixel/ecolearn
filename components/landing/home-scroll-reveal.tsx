"use client";

import Image from "next/image";
import { useEffect, useRef, type ReactNode } from "react";
import heroImage from "@/app/image.jpeg";

export function HomeScrollReveal({ children }: { children: ReactNode }) {
  const travelImageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;

    const updateProgress = () => {
      frame = 0;
      const pageRange = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const pageProgress = Math.min(Math.max(window.scrollY / pageRange, 0), 1);
      const horizontalProgress =
        pageProgress < 0.42
          ? -45 * (pageProgress / 0.42)
          : -45 + 90 * ((pageProgress - 0.42) / 0.58);
      const travelImage = travelImageRef.current;
      travelImage?.style.setProperty("--travel-x", `${horizontalProgress}vw`);
      travelImage?.style.setProperty("--travel-y", `${8 + pageProgress * 72}vh`);
      travelImage?.style.setProperty("--travel-rotation", `${pageProgress * 720}deg`);
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
      <div className="homepage-scroll-content">{children}</div>
    </>
  );
}
