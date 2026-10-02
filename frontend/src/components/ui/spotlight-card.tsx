"use client";

import * as React from "react";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "article" | "li";
}

export function SpotlightCard({ as, className, children, onMouseMove, onFocus, ...rest }: Props): React.JSX.Element {
  function handleMove(e: React.MouseEvent<HTMLDivElement>): void {
    onMouseMove?.(e);
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - r.top}px`);
  }
  function handleFocus(e: React.FocusEvent<HTMLDivElement>): void {
    onFocus?.(e);
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mouse-x", `${r.width / 2}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${r.height / 2}px`);
  }
  const cls = `spotlight-card relative${className ? ` ${className}` : ""}`;
  const inner = (
    <>
      <div className="raycast-glow" aria-hidden />
      {children}
    </>
  );
  if (as === "section") {
    return (
      <section onMouseMove={handleMove} onFocus={handleFocus} className={cls} {...rest}>
        {inner}
      </section>
    );
  }
  if (as === "article") {
    return (
      <article onMouseMove={handleMove} onFocus={handleFocus} className={cls} {...rest}>
        {inner}
      </article>
    );
  }
  return (
    <div onMouseMove={handleMove} onFocus={handleFocus} className={cls} {...rest}>
      {inner}
    </div>
  );
}
