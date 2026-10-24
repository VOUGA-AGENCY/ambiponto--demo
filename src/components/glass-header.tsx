"use client";
import { useEffect, useState, useRef, type CSSProperties } from "react";
import AnimatedFlutedGlass from "./animated-fluted-glass";
export default function GlassHeader() {
  const container = useRef<HTMLDivElement>(null);
  const [plane, setPlane] = useState({ height: 0, scaleY: 1 });
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    try {
      if (typeof WebGL2RenderingContext === "undefined") return;
      const canvas = document.createElement("canvas");
      setSupported(!!canvas.getContext("webgl2"));
    } catch {
      /* The local image remains as a fallback. */
    }
  }, []);
  useEffect(() => {
    if (!supported || !container.current) return;
    // Render the complete source at its own aspect ratio, then fit the glass
    // plane to the header. Cover on the shallow header would crop the image.
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const imageHeight = width * (1063 / 1890);
      if (imageHeight > 0)
        setPlane({ height: imageHeight, scaleY: height / imageHeight });
    });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [supported]);
  return (
    <div ref={container} className="glass-art" aria-hidden="true">
      {supported && plane.height > 0 && (
        <div
          className="glass-image-plane"
          style={
            {
              "--glass-plane-height": `${plane.height}px`,
              transform: `scaleY(${plane.scaleY})`,
            } as CSSProperties
          }
        >
          <AnimatedFlutedGlass />
        </div>
      )}
    </div>
  );
}
