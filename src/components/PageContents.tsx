"use client";

import { useEffect, useState } from "react";

export type ContentsGroup = { title?: string; items: { id: string; label: string }[] };

/**
 * "On this page" list for long pages: sticks to the left on wide screens and highlights the section being read.
 * Hidden below the lg breakpoint, where there is no room beside the text.
 */
export default function PageContents({ groups }: { groups: ContentsGroup[] }) {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const ids = groups.flatMap((g) => g.items.map((i) => i.id));
    const sections = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el != null);

    // The current section is the last one whose top has scrolled past a line just below the sticky header.
    function update() {
      const line = 180;
      let active = sections[0]?.id ?? null;
      for (const el of sections) {
        if (el.getBoundingClientRect().top - line <= 0) active = el.id;
      }
      // At the very bottom, short final sections never reach the line; mark the last one.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        active = sections.at(-1)?.id ?? active;
      }
      setCurrent(active);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [groups]);

  return (
    <nav aria-label="On this page" className="hidden lg:block">
      <div className="sticky top-36 max-h-[calc(100vh-10rem)] overflow-y-auto py-14">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-3">On this page</p>
        <div className="mt-3 flex flex-col gap-4">
          {groups.map((group, gi) => (
            <div key={gi} className="flex flex-col gap-1">
              {group.title && <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-3">{group.title}</p>}
              <ul className="flex flex-col border-l border-line text-sm">
                {group.items.map(({ id, label }) => {
                  const active = current === id;
                  return (
                    <li key={id}>
                      <a
                        href={`#${id}`}
                        aria-current={active ? "location" : undefined}
                        className={`-ml-px block border-l-2 py-1.5 pl-3 leading-snug ${
                          active ? "border-ink font-medium text-ink" : "border-transparent text-ink-2 hover:text-ink"
                        }`}
                      >
                        {label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
