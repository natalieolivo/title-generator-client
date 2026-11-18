"use client";

import { useEffect, useRef } from "react";
import styles from "./TurtleMascot.module.css";

// Angles (degrees) where plate seams run from the inner ring to the shell edge.
const SCUTE_ANGLES = [-150, -110, -70, -30, 10, 170];

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
        <rect width="400" height="400" fill="#f4e4cf" />
        <rect width="400" height="34" fill="#8a6548" />
        <rect y="34" width="400" height="14" fill="#dfc7aa" />
        <rect x="165" y="24" width="70" height="24" rx="3" fill="#ecd9c0" />

        {/* shell, behind the head */}
        <ellipse cx="200" cy="240" rx="172" ry="165" fill="#3c7a52" />
        <ellipse cx="200" cy="240" rx="126" ry="119" fill="#4a8c61" />
        <g stroke="#2b5a3d" strokeWidth="5" strokeLinecap="round" fill="none">
          <ellipse cx="200" cy="240" rx="126" ry="119" />
          {SCUTE_ANGLES.map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x = (r: number) => 200 + r * Math.cos(rad);
            const y = (r: number) => 240 + (r * 119) / 126 * Math.sin(rad);
            return (
              <line key={angle} x1={x(126)} y1={y(126)} x2={x(172)} y2={y(172)} />
            );
          })}
        </g>
        <ellipse
          cx="200"
          cy="240"
          rx="172"
          ry="165"
          fill="none"
          stroke="#a7d28a"
          strokeWidth="8"
        />

        {/* neck and shoulders, in front of the shell */}
        <path
          d="M118 250 C110 300 92 335 66 410 L334 410 C308 335 290 300 282 250 Z"
          fill="#78ad62"
        />
        <ellipse cx="96" cy="388" rx="34" ry="26" fill="#6a9c55" />
        <ellipse cx="304" cy="388" rx="34" ry="26" fill="#6a9c55" />
        <ellipse cx="200" cy="306" rx="48" ry="17" fill="#a9d08e" />

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

            <circle cx="140" cy="236" r="15" fill="#ff9aa8" opacity="0.8" />
            <circle cx="260" cy="236" r="15" fill="#ff9aa8" opacity="0.8" />

            {[158, 242].map((cx) => (
              <g key={cx} className={styles.eye}>
                <ellipse cx={cx} cy="198" rx="21" ry="23" fill="#fff" />
                <ellipse
                  cx={cx}
                  cy="198"
                  rx="21"
                  ry="23"
                  fill="none"
                  stroke="#5f9448"
                  strokeWidth="3"
                />
                <g className={styles.gaze}>
                  <circle cx={cx} cy="200" r="14" fill="#2f6b45" />
                  <circle cx={cx} cy="200" r="8.5" fill="#0d1f14" />
                  <circle cx={cx + 5} cy="194" r="5" fill="#fff" />
                  <circle cx={cx - 4} cy="206" r="2.2" fill="#fff" opacity="0.85" />
                </g>
              </g>
            ))}

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
