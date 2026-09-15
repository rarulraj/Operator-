"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function markNavStart() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("operator:nav"));
  }
}

export function NavProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const start = () => setActive(true);
    window.addEventListener("operator:nav", start);
    return () => window.removeEventListener("operator:nav", start);
  }, []);

  useEffect(() => {
    setActive(false);
  }, [pathname]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px] origin-left bg-xp transition-transform duration-300 ease-out ${
        active ? "scale-x-[0.88]" : "scale-x-0"
      }`}
    />
  );
}
