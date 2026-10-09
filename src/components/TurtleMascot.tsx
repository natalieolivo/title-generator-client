"use client";

import { useEffect, useRef } from "react";
import styles from "./TurtleMascot.module.css";

// Normalized pointer offset from the mascot's center, clamped to [-1, 1].
function clamp(value: number) {
  return Math.max(-1, Math.min(1, value));
}

export default function TurtleMascot() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      const rect = svg!.getBoundingClientRect();
      const dx = clamp((event.clientX - (rect.left + rect.width / 2)) / 400);
      const dy = clamp((event.clientY - (rect.top + rect.height / 2)) / 400);
      svg!.style.setProperty("--head-x", `${dx * 14}px`);
      svg!.style.setProperty("--head-y", `${dy * 8}px`);
      svg!.style.setProperty("--eye-x", `${dx * 5}px`);
      svg!.style.setProperty("--eye-y", `${dy * 4}px`);
    }

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return (
    <svg
      ref={svgRef}
      className={styles.mascot}
      viewBox="0 0 400 400"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id="turtle-frame">
          <circle cx="200" cy="200" r="190" />
        </clipPath>
      </defs>

      <g clipPath="url(#turtle-frame)">
        {/* backdrop */}
        <rect width="400" height="400" fill="#dddddd" />
        <rect width="400" height="34" fill="#4d4d4d" />
        <rect y="34" width="400" height="14" fill="#c6c6c6" />
        <rect x="165" y="24" width="70" height="24" rx="3" fill="#d2d2d2" />

        {/* neck */}
        <path
          d="M110 240 C100 280 95 300 90 330 L310 330 C305 300 300 280 290 240 Z"
          fill="#78ad62"
        />
        <ellipse cx="200" cy="302" rx="46" ry="16" fill="#a9d08e" />

        {/* shell */}
        <path
          d="M30 430 C30 340 110 308 200 308 C290 308 370 340 370 430 Z"
          fill="#3c7a52"
        />
        <path
          d="M30 430 C30 340 110 308 200 308 C290 308 370 340 370 430"
          fill="none"
          stroke="#a7d28a"
          strokeWidth="8"
        />
        <polygon
          points="200,326 238,346 238,392 200,412 162,392 162,346"
          fill="#4a8c61"
          stroke="#2b5a3d"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <g stroke="#2b5a3d" strokeWidth="5" strokeLinecap="round">
          <line x1="162" y1="346" x2="110" y2="334" />
          <line x1="238" y1="346" x2="290" y2="334" />
          <line x1="162" y1="392" x2="120" y2="410" />
          <line x1="238" y1="392" x2="280" y2="410" />
        </g>

        {/* head */}
        <g className={styles.headTrack}>
          <g className={styles.headBob}>
            <ellipse cx="192" cy="205" rx="104" ry="94" fill="#5f9448" />
            <ellipse cx="200" cy="200" rx="96" ry="88" fill="#86b86b" />
            <ellipse cx="190" cy="150" rx="52" ry="26" fill="#9cca80" opacity="0.7" />
            <g fill="#6fa257">
              <ellipse cx="170" cy="132" rx="9" ry="6" />
              <ellipse cx="205" cy="122" rx="11" ry="7" />
              <ellipse cx="238" cy="138" rx="8" ry="6" />
            </g>

            <circle cx="140" cy="236" r="16" fill="#f4a6a0" opacity="0.5" />
            <circle cx="260" cy="236" r="16" fill="#f4a6a0" opacity="0.5" />

            <g className={styles.eyes}>
              <g className={styles.eye}>
                <circle cx="158" cy="200" r="13" fill="#c4e0a2" />
                <circle cx="158" cy="200" r="7.5" fill="#000" />
                <circle cx="160.5" cy="197" r="2.6" fill="#fff" />
              </g>
              <g className={styles.eye}>
                <circle cx="242" cy="200" r="13" fill="#c4e0a2" />
                <circle cx="242" cy="200" r="7.5" fill="#000" />
                <circle cx="244.5" cy="197" r="2.6" fill="#fff" />
              </g>
            </g>

            <ellipse cx="191" cy="229" rx="3.5" ry="4.5" fill="#1f3d2a" />
            <ellipse cx="209" cy="229" rx="3.5" ry="4.5" fill="#1f3d2a" />
            <path
              d="M168 246 Q200 270 232 246"
              fill="none"
              stroke="#1f3d2a"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}
