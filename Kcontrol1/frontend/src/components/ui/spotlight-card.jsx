
import React from "react";
import "./spotlight-card.css";

export function GlowCard({
  children,
  className = "",
  spotlightColor = "rgba(255, 255, 255, 0.3)",
}) {
  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    event.currentTarget.style.setProperty("--spotlight-x", `${x}px`);
    event.currentTarget.style.setProperty("--spotlight-y", `${y}px`);
  };

  return (
    <div
      className={`glow-card ${className}`}
      onMouseMove={handleMouseMove}
      style={{ "--spotlight-color": spotlightColor }}
    >
      <div className="glow-card-content">
        {children}
      </div>
    </div>
  );
}
