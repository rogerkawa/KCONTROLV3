
import { useEffect, useRef } from "react";

export default function BeamsBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let animationFrame;
    let width = 0;
    let height = 0;
    let time = 0;

    const beams = Array.from({ length: 13 }, (_, index) => ({
      x: (index / 13) * 1.4 - 0.2,
      width: 0.025 + Math.random() * 0.035,
      speed: 0.12 + Math.random() * 0.18,
      phase: Math.random() * Math.PI * 2,
      intensity: 0.3 + Math.random() * 0.4,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = rect.width;
      height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      beams.forEach((beam) => {
        const movement =
          Math.sin(time * beam.speed + beam.phase) * 0.045;

        const x = (beam.x + movement) * width;
        const beamWidth = beam.width * width;

        const gradient = ctx.createLinearGradient(
          x,
          height,
          x + beamWidth * 0.35,
          0
        );

        const pulse =
          0.65 + Math.sin(time * 0.35 + beam.phase) * 0.2;

        const alpha = beam.intensity * pulse;

        gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
gradient.addColorStop(
  0.35,
  `rgba(180, 185, 192, ${alpha * 0.045})`
);
gradient.addColorStop(
  0.7,
  `rgba(225, 228, 232, ${alpha * 0.12})`
);
gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.save();
        ctx.translate(x, 0);
        ctx.transform(1, 0, -0.12, 1, 0, 0);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, beamWidth, height);

        ctx.restore();
      });

      time += 0.008;
      animationFrame = requestAnimationFrame(draw);
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!reduceMotion) {
      draw();
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="beams-background" aria-hidden="true">
      <canvas ref={canvasRef} />
      <div className="beams-vignette" />
    </div>
  );
}
