"use client";

import { useEffect, useState, useMemo } from "react";
import { ShaderMount } from "@paper-design/shaders-react";
import { flutedGlassFragmentShader } from "@paper-design/shaders";

// Preserve Paper's flutes, lighting and grain. Only the image coordinates move,
// so the glass ribs and the full-width composition remain stationary.
const animatedFragment = flutedGlassFragmentShader
  .replace(
    "uniform float u_size;",
    "uniform float u_size;\nuniform float u_time;\nuniform float u_motion;",
  )
  .replace(
    "  vec4 image = getBlur",
    `
  vec2 imagePosition = clamp(uv, 0.0, 1.0);
  vec2 edgeFade = sin(imagePosition * PI);
  float t = u_time * 0.22;
  vec2 flow = vec2(
    sin(imagePosition.y * 5.0 + t) - sin(imagePosition.y * 5.0),
    sin(imagePosition.x * 4.0 - t * 0.73) - sin(imagePosition.x * 4.0)
  );
  uv += flow * vec2(0.045, 0.055) * edgeFade * u_motion;
  vec4 image = getBlur`,
  );

const baseUniforms = {
  u_image: "/header.png",
  u_colorBack: [0, 0, 0, 0],
  u_colorShadow: [0, 0, 0, 1],
  u_colorHighlight: [1, 1, 1, 1],
  u_size: 0.18,
  u_shadows: 0.38,
  u_highlights: 0.1,
  u_shape: 1,
  u_angle: 0,
  u_distortionShape: 3,
  u_distortion: 0.9,
  u_shift: 0.04,
  u_stretch: 0.11,
  u_blur: 0.11,
  u_edges: 0,
  u_marginLeft: 0,
  u_marginRight: 0,
  u_marginTop: 0,
  u_marginBottom: 0,
  u_grainMixer: 0.43,
  u_grainOverlay: 0,
  u_scale: 1,
  u_fit: 1,
  u_rotation: 0,
  u_offsetX: 0,
  u_offsetY: 0,
  u_originX: 0.5,
  u_originY: 0.5,
  u_worldWidth: 0,
  u_worldHeight: 0,
};
const mipmaps = ["u_image"];

export default function AnimatedFlutedGlass() {
  const [motion, setMotion] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotion(!preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  const uniforms = useMemo(
    () => ({ ...baseUniforms, u_motion: motion ? 1 : 0 }),
    [motion],
  );

  // ShaderMount pauses rendering offscreen and in background tabs, and cleans
  // up its GPU resources on unmount. No React updates run per animation frame.
  return (
    <ShaderMount
      style={{ width: "100%", height: "100%" }}
      fragmentShader={animatedFragment}
      uniforms={uniforms}
      mipmaps={mipmaps}
      speed={motion ? 1 : 0}
      minPixelRatio={1}
      maxPixelCount={2_000_000}
    />
  );
}
