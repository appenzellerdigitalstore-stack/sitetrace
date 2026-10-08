import { useEffect, useRef } from "react";

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const symbols = "アイウエオカキクケコサシスセソタチツテトナニヌネノ012345789";
    let width = 0;
    let height = 0;
    let frame = 0;
    let previous = 0;
    let drops: { y: number; speed: number; length: number }[] = [];
    const colors = getComputedStyle(canvas);
    const green = colors.getPropertyValue("--rain-color").trim();
    const head = colors.getPropertyValue("--rain-head").trim();
    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const ratio = Math.min(window.devicePixelRatio, 2);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      drops = Array.from({ length: Math.ceil(width / 25) }, () => ({ y: Math.random() * (height + 400), speed: 100 + Math.random() * 110, length: 8 + Math.floor(Math.random() * 19) }));
      draw();
    };
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.font = "14px monospace";
      drops.forEach((drop, index) => {
        for (let j = 0; j < drop.length; j++) {
          ctx.globalAlpha = (1 - j / drop.length) * (index % 5 === 0 ? 0.95 : 0.65);
          ctx.fillStyle = j === 0 ? head : green;
          const character = symbols.charAt((index * 7 + j * 13 + Math.floor(drop.y / 22)) % symbols.length);
          ctx.fillText(character, index * 25, drop.y - j * 19);
        }
      });
      ctx.globalAlpha = 1;
    };
    const animate = (time: number) => {
      const elapsed = previous ? Math.min((time - previous) / 1000, 0.05) : 0;
      drops.forEach((drop) => { drop.y += drop.speed * elapsed; if (drop.y - drop.length * 19 > height) drop.y = -20; });
      draw();
      previous = time;
      frame = requestAnimationFrame(animate);
    };
    const motion = () => { cancelAnimationFrame(frame); previous = 0; if (!reduced.matches) frame = requestAnimationFrame(animate); };
    resize();
    motion();
    window.addEventListener("resize", resize);
    reduced.addEventListener("change", motion);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); reduced.removeEventListener("change", motion); };
  }, []);

  return <div className="matrix-background" aria-hidden="true"><canvas ref={canvasRef} className="matrix-rain" /><div className="matrix-shade" /></div>;
}