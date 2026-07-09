"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { BookMediaItem } from "@/lib/types";

export function MediaGallery({
  coverImage,
  title,
  media,
}: {
  coverImage: string;
  title: string;
  media: BookMediaItem[];
}) {
  const slides: { type: "IMAGE" | "VIDEO"; url: string }[] = [
    { type: "IMAGE", url: coverImage },
    ...media.map((m) => ({ type: m.type, url: m.url })),
  ];
  const [active, setActive] = useState(0);
  const current = slides[active] ?? slides[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-white">
        {current.type === "IMAGE" ? (
          <Image
            src={current.url}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain p-6"
            priority
          />
        ) : (
          <video
            src={current.url}
            controls
            className="h-full w-full object-contain"
          />
        )}
      </div>
      {slides.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {slides.map((slide, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-white",
                i === active ? "border-brand" : "border-border"
              )}
            >
              {slide.type === "IMAGE" ? (
                <Image
                  src={slide.url}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-contain p-1"
                />
              ) : (
                <video src={slide.url} className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
