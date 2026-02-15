import { useEffect, useRef } from "react";

/**
 * FASSADE
 * Pure visual presence. No function.
 */

export default function Index() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Film Grain
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationId: number;

    const render = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 6;
        data[i] = noise;
        data[i + 1] = noise;
        data[i + 2] = noise;
        data[i + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden">
      {/* Film Grain */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 opacity-[0.015] mix-blend-overlay"
      />

      {/* Split Layout */}
      <div className="flex h-full">
        {/* Left Panel — Symbol */}
        <div className="relative flex h-full w-1/2 items-center justify-center border-r border-white/5">
          {/* Asterisk Symbol */}
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            className="opacity-90"
          >
            <line x1="60" y1="20" x2="60" y2="100" stroke="white" strokeWidth="1.5" />
            <line x1="20" y1="60" x2="100" y2="60" stroke="white" strokeWidth="1.5" />
            <line x1="32" y1="32" x2="88" y2="88" stroke="white" strokeWidth="1.5" />
            <line x1="88" y1="32" x2="32" y2="88" stroke="white" strokeWidth="1.5" />
            <line x1="42" y1="24" x2="78" y2="96" stroke="white" strokeWidth="1.5" />
            <line x1="78" y1="24" x2="42" y2="96" stroke="white" strokeWidth="1.5" />
            <line x1="24" y1="42" x2="96" y2="78" stroke="white" strokeWidth="1.5" />
            <line x1="96" y1="42" x2="24" y2="78" stroke="white" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Right Panel — Text */}
        <div className="relative flex h-full w-1/2 items-center justify-center">
          <div className="absolute left-16 top-1/2 -translate-y-1/2">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/70">
              ACCESS DENIED
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
