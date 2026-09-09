"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ShieldCheck,
} from "lucide-react";

const SLIDES = [
  {
    eyebrow: "Learn together",
    title: "Support that fits.",
    image: "/carousel/filipino-classroom-1.png",
  },
  {
    eyebrow: "Study with support",
    title: "Progress, one step at a time.",
    image: "/carousel/filipino-classroom-2.png",
  },
  {
    eyebrow: "Built for your goals",
    title: "Your next win starts here.",
    image: "/carousel/filipino-classroom-3.png",
  },
  {
    eyebrow: "Learn by doing",
    title: "Make ideas click.",
    image: "/carousel/filipino-classroom-4.png",
  },
  {
    eyebrow: "Keep growing",
    title: "Confidence starts small.",
    image: "/carousel/filipino-classroom-5.png",
  },
  {
    eyebrow: "Share the moment",
    title: "Curiosity goes further together.",
    image: "/carousel/filipino-classroom-6.png",
  },
  {
    eyebrow: "A place to belong",
    title: "Every learner has a next step.",
    image: "/carousel/filipino-classroom-7.png",
  },
];

export function LearningCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % SLIDES.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  const goToSlide = (index: number) => {
    setActiveIndex((index + SLIDES.length) % SLIDES.length);
  };

  return (
    <div className="relative min-h-[26rem] w-full bg-primary-700 shadow-[0_24px_70px_-24px_rgba(16,88,79,0.55)] sm:min-h-[29rem] lg:min-h-[30rem] lg:rounded-[2rem]">
      {SLIDES.map((slide, index) => (
        <div
          key={slide.title}
          aria-hidden={activeIndex !== index}
          role="img"
          aria-label={slide.title}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
            activeIndex === index ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${slide.image})` }}
        >
          <div className="absolute inset-0 bg-[#12334a]/55" />
        </div>
      ))}

      <div className="absolute inset-0 flex items-center">
        <div className="w-full px-5 py-8 text-white sm:px-14 sm:py-12 lg:px-20">
          <div className="max-w-2xl">
            
            <h1 className="mt-5 max-w-[18ch] break-words text-balance text-3xl font-semibold leading-[1.06] tracking-tight sm:mt-7 sm:max-w-2xl sm:text-6xl">
              Learn with confidence.
            </h1>
            <p className="mt-4 max-w-md break-words text-sm leading-6 text-white/85 sm:mt-6 sm:text-lg sm:leading-8">
              Trusted tutors. Clear goals. Better progress.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
              <Link
                href="/tutors"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-12 sm:px-5"
              >
                Find a tutor
                <ArrowRight size={17} />
              </Link>
              <Link
                href="/register"
                className="inline-flex h-10 items-center justify-center rounded-md border border-white/45 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-12 sm:px-5"
              >
                Start learning
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/85 sm:mt-10 sm:gap-x-6 sm:gap-y-3 sm:text-sm">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={17} className="text-primary-100" />
                Vetted tutors
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarClock size={17} className="text-primary-100" />
                Flexible times
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5 sm:p-7">
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {SLIDES[activeIndex].eyebrow}
        </span>
        <button
          type="button"
          onClick={() => setIsPaused((paused) => !paused)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          aria-label={isPaused ? "Play carousel" : "Pause carousel"}
          title={isPaused ? "Play carousel" : "Pause carousel"}
        >
          {isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} />}
        </button>
      </div>

      <button
        type="button"
        onClick={() => goToSlide(activeIndex - 1)}
        className="absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/15 text-white backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white lg:-left-16"
        aria-label="Previous slide"
        title="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={() => goToSlide(activeIndex + 1)}
        className="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/15 text-white backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white lg:-right-16"
        aria-label="Next slide"
        title="Next slide"
      >
        <ChevronRight size={20} />
      </button>

      <div className="absolute inset-x-0 bottom-6 flex items-center justify-center px-7 sm:px-10">
        <div className="flex items-center gap-2" aria-label="Choose carousel slide">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              onClick={() => goToSlide(index)}
              className={`h-1.5 rounded-full transition-all ${
                activeIndex === index ? "w-8 bg-white" : "w-1.5 bg-white/55"
              }`}
              aria-label={`Show slide ${index + 1}`}
              aria-current={activeIndex === index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
