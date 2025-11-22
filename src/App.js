import React, { useState, useEffect, useCallback } from "react";
import { Heart } from "lucide-react";

// --- CONSTANTS ---
const TILE_SIZE = 48;
const VIEW_WIDTH = 13;
const VIEW_HEIGHT = 9;

// SNES-inspired Palette
const PALETTE = {
  grass: "#36963a",
  grassLight: "#5eb34a",
  grassDark: "#226b26",
  dirt: "#9c6238",
  water: "#3d94cf",
  waterDark: "#286a9c",
  stone: "#7d7d7d",
  temple: "#e8b756",
  gold: "#f0d443",
  uiBg: "#0000aa",
  uiBorder: "#ffffff",
  text: "#ffffff",
  sky: "#87ceeb",
};

// --- AUDIO SYSTEM ---
const playSound = (type) => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;

  if (type === "step") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (type === "splash") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.2);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === "text") {
    osc.type = "square";
    osc.frequency.setValueAtTime(400, now);
    gain.gain.setValueAtTime(0.02, now);
    osc.start(now);
    osc.stop(now + 0.03);
  } else if (type === "get") {
    osc.type = "square";
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.setValueAtTime(1000, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === "alchemy_success") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.6);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.6);
    osc.start(now);
    osc.stop(now + 0.6);
  } else if (type === "vanish") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 1.0);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 1.0);
    osc.start(now);
    osc.stop(now + 1.0);
  }
};

// --- PIXEL ART COMPONENTS ---
const PixelSVG = ({ children, className, style }) => (
  <svg
    viewBox="0 0 16 16"
    className={className}
    shapeRendering="crispEdges"
    style={{ width: "100%", height: "100%", ...style }}
  >
    {children}
  </svg>
);

const Sprites = {
  Player: ({ dir, isMeditating, isWalking, isSwimming }) => {
    const bounce = isWalking ? "translateY(-2px)" : "translateY(0)";
    const swimStyle = isSwimming ? "translateY(4px)" : bounce;

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: swimStyle,
          transition: "transform 0.1s",
        }}
      >
        <PixelSVG>
          {!isSwimming && (
            <rect x="4" y="13" width="8" height="2" fill="rgba(0,0,0,0.4)" />
          )}
          <rect
            x="5"
            y="8"
            width="6"
            height={isSwimming ? 3 : 5}
            fill="#ea580c"
          />
          <rect
            x="4"
            y="9"
            width="8"
            height={isSwimming ? 2 : 4}
            fill="#ea580c"
          />
          <rect x="5" y="3" width="6" height="5" fill="#fdba74" />
          <rect x="6" y="1" width="4" height="2" fill="#1f2937" />
          <rect x="5" y="2" width="6" height="2" fill="#1f2937" />
          {dir === "down" && (
            <>
              <rect x="6" y="5" width="1" height="1" fill="black" />
              <rect x="9" y="5" width="1" height="1" fill="black" />
            </>
          )}
          {dir === "left" && (
            <rect x="5" y="5" width="1" height="1" fill="black" />
          )}
          {dir === "right" && (
            <rect x="10" y="5" width="1" height="1" fill="black" />
          )}
          {dir === "up" && (
            <rect x="5" y="3" width="6" height="5" fill="#1f2937" />
          )}
          {isMeditating && (
            <rect
              x="0"
              y="0"
              width="16"
              height="16"
              fill="none"
              stroke="#fcd34d"
              strokeWidth="1"
              strokeDasharray="2 2"
              className="animate-spin"
            />
          )}
          {isSwimming && (
            <>
              <rect
                x="2"
                y="12"
                width="4"
                height="1"
                fill="rgba(255,255,255,0.5)"
                className="animate-pulse"
              />
              <rect
                x="10"
                y="12"
                width="4"
                height="1"
                fill="rgba(255,255,255,0.5)"
                className="animate-pulse"
              />
            </>
          )}
        </PixelSVG>
      </div>
    );
  },

  Grass: () => (
    <PixelSVG>
      <rect width="16" height="16" fill={PALETTE.grass} />
      <rect x="2" y="3" width="1" height="1" fill={PALETTE.grassLight} />
      <rect x="8" y="10" width="1" height="1" fill={PALETTE.grassDark} />
      <rect x="12" y="5" width="1" height="1" fill={PALETTE.grassLight} />
      <rect x="4" y="12" width="2" height="1" fill={PALETTE.grassDark} />
    </PixelSVG>
  ),

  Water: () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: PALETTE.water,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(255,255,255,0.1)",
          animation: "pulse 2s infinite",
        }}
      ></div>
    </div>
  ),

  Dirt: () => (
    <PixelSVG>
      <rect width="16" height="16" fill={PALETTE.dirt} />
      <rect x="3" y="2" width="1" height="1" fill="#78350f" />
      <rect x="10" y="8" width="1" height="1" fill="#78350f" />
      <rect x="5" y="12" width="1" height="1" fill="#b45309" />
    </PixelSVG>
  ),

  Tree: ({ type }) => {
    const color = type === "tamarind" ? "#15803d" : "#14532d";
    return (
      <div style={{ transform: "translateY(-8px)" }}>
        <PixelSVG>
          <rect x="7" y="11" width="2" height="4" fill="#3f2e21" />
          <rect x="4" y="5" width="8" height="7" fill={color} />
          <rect x="5" y="3" width="6" height="4" fill={color} />
          <rect x="6" y="2" width="4" height="2" fill={color} />
          <rect x="4" y="11" width="8" height="1" fill="rgba(0,0,0,0.2)" />
        </PixelSVG>
      </div>
    );
  },

  Temple: () => (
    <div style={{ transform: "scale(1.25)", position: "relative", zIndex: 10 }}>
      <PixelSVG>
        <rect x="2" y="6" width="12" height="10" fill={PALETTE.temple} />
        <rect x="5" y="10" width="6" height="6" fill="#000" />
        <path d="M1 6 L8 1 L15 6" fill="#b91c1c" />
        <rect x="3" y="3" width="10" height="1" fill="#991b1b" />
      </PixelSVG>
    </div>
  ),

  Yakshini: ({ fading }) => (
    <div
      style={{
        opacity: fading ? 0 : 1,
        transition: "opacity 1s",
        animation: "bounce 1s infinite",
      }}
    >
      <PixelSVG>
        <rect x="6" y="2" width="4" height="3" fill="#0f172a" />
        <rect x="6" y="3" width="4" height="3" fill="#a16207" />
        <path d="M5 6 L11 6 L12 14 L4 14 Z" fill="#db2777" />
        <rect x="4" y="6" width="1" height="4" fill="#a16207" />
        <rect x="11" y="6" width="1" height="4" fill="#a16207" />
        <rect x="7" y="6" width="2" height="1" fill="#fcd34d" />
        <rect x="5" y="2" width="6" height="1" fill="#fbbf24" />
      </PixelSVG>
    </div>
  ),

  Mist: () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(255,255,255,0.4)",
        backdropFilter: "blur(2px)",
        animation: "pulse 1s infinite",
      }}
    ></div>
  ),

  Bridge: () => (
    <PixelSVG>
      <rect width="16" height="16" fill="#a8a29e" />
      <rect x="0" y="0" width="16" height="2" fill="#57534e" />
      <rect x="0" y="14" width="16" height="2" fill="#57534e" />
      <rect x="2" y="2" width="2" height="12" fill="rgba(0,0,0,0.1)" />
      <rect x="12" y="2" width="2" height="12" fill="rgba(0,0,0,0.1)" />
    </PixelSVG>
  ),

  CloudPlatform: () => (
    <PixelSVG>
      <rect x="2" y="4" width="12" height="8" fill="#e0f2fe" />
      <rect x="4" y="2" width="8" height="12" fill="#e0f2fe" />
      <rect x="4" y="4" width="8" height="8" fill="#fff" />
    </PixelSVG>
  ),

  Sparkle: () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          backgroundColor: "#fde047",
          borderRadius: "50%",
          animation: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
        }}
      ></div>
    </div>
  ),

  Mahakala: () => (
    <div style={{ filter: "drop-shadow(0 4px 3px rgb(0 0 0 / 0.07))" }}>
      <PixelSVG>
        <circle
          cx="8"
          cy="8"
          r="7"
          fill="none"
          stroke="#ef4444"
          strokeWidth="1"
          strokeDasharray="1 1"
        />
        <rect x="4" y="4" width="8" height="10" fill="#09090b" />
        <rect x="6" y="4" width="4" height="3" fill="#09090b" />
        <rect x="6" y="5" width="1" height="1" fill="#ef4444" />
        <rect x="9" y="5" width="1" height="1" fill="#ef4444" />
        <rect x="7" y="6" width="2" height="1" fill="#fff" />
        <rect x="2" y="6" width="2" height="6" fill="#f59e0b" />
        <rect x="12" y="6" width="2" height="6" fill="#f59e0b" />
        <circle
          cx="8"
          cy="10"
          r="3"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1"
        />
      </PixelSVG>
    </div>
  ),
};

// --- GAME DATA ---
const ITEMS = {
  copper: { name: "Copper", icon: "🟤", desc: "Base metal." },
  elephant_stone: {
    name: "Elephant Stone",
    icon: "🐘",
    desc: "Flows with guggulu.",
  },
  gold: { name: "Divine Gold", icon: "🌟", desc: "Clears Mist." },
  fish: { name: "Blue Fish", icon: "🐟", desc: "Magical fish." },
  tamarind_wood: { name: "Tamarind Wood", icon: "🪵", desc: "Sacred wood." },
  adamantine_body: {
    name: "Adamantine Body",
    icon: "💎",
    desc: "Immortality.",
  },
  baby: { name: "Yakshini Child", icon: "👶", desc: "Son of Maukali." },
  siddhi_flight: { name: "Flight", icon: "🕊️", desc: "Sky travel." },
};

const RECIPES = [
  {
    inputs: ["copper", "elephant_stone"],
    output: "gold",
    msg: "TRANSMUTATION COMPLETE! Divine Gold obtained. Mists cleared.",
  },
  {
    inputs: ["fish", "tamarind_wood"],
    output: "adamantine_body",
    msg: "ELIXIR CONSUMED! You feel the weight of mortality vanish.",
  },
];

const VERSES = {
  hub: "Verse 2: A stone resembling an elephant stands in front of the White-Jasmine God.",
  south_1:
    "Verse 5: The Accomplished Lord of the Bell is situated to the left of the Jasmine Lord.",
  east_1:
    "Verse 14: The god who is Shiva as the Destroyer of the Three Cities is at the eastern gate.",
  west_1:
    "Verse 82: The Plantain Forest will be seen, spread over seventy kilometers.",
  west_3: "Verse 89: A nymph named the Raveness (Maukali) is situated there.",
  sky_2:
    "Verse 184: ...recite the Aghora mantra one hundred thousand times. (Press SPACE to Chant)",
};

const ROOMS = {
  hub: {
    name: "Mallikārjuna",
    bg: PALETTE.grass,
    layout: [
      [1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 1],
      [1, 0, 0, 3, 3, 10, 10, 10, 3, 3, 0, 0, 1],
      [1, 0, 0, 3, 9, 10, 10, 10, 9, 3, 0, 0, 1],
      [0, 0, 0, 0, 4, 2, 2, 2, 4, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 1],
      [1, 1, 1, 0, 0, 2, 2, 2, 0, 0, 1, 1, 1],
      [1, 1, 1, 9, 9, 2, 2, 2, 9, 9, 1, 1, 1],
    ],
    objects: [
      {
        x: 3,
        y: 2,
        type: "sign",
        msg: "Temple of Mallikārjuna. River Pātālagangā.",
      },
      { x: 4, y: 4, type: "hidden", item: "elephant_stone", dug: false },
      { x: 12, y: 4, type: "mist", msg: "A barrier of mist." },
      { x: 0, y: 4, type: "mist", msg: "A barrier of mist." },
    ],
    exits: { south: "south_1", east: "east_1", west: "west_1" },
  },

  // --- SOUTH (ROCKY PATH -> BELL) ---
  south_1: {
    name: "South Path",
    bg: PALETTE.dirt,
    layout: [
      [1, 1, 1, 9, 9, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 4, 0, 0, 0, 4, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 1],
      [1, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 9, 9, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    objects: [],
    exits: { north: "hub", south: "south_2" },
  },
  south_2: {
    name: "Bell Shrine",
    bg: PALETTE.dirt,
    layout: [
      [1, 1, 1, 9, 9, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 1, 1, 5, 1, 1, 1, 0, 0, 1], // Bell
      [1, 0, 0, 1, 2, 2, 2, 2, 2, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    objects: [{ x: 6, y: 3, type: "bell", msg: "The Bell of Flight." }],
    exits: { north: "south_1" },
  },

  // --- EAST (FOREST PATH -> GROVE -> POOL) ---
  east_1: {
    name: "East Path",
    bg: PALETTE.grassLight,
    layout: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 9],
      [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 9],
      [1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    objects: [],
    exits: { west: "hub", east: "east_2" },
  },
  east_2: {
    name: "Tamarind Grove",
    bg: PALETTE.grassLight,
    layout: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [9, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 9],
      [9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    objects: [{ x: 6, y: 1, type: "tree_int", msg: "The Sacred Tamarind." }],
    exits: { west: "east_1", east: "east_3" },
  },
  east_3: {
    name: "Sacred Pool",
    bg: PALETTE.grassLight,
    layout: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [9, 0, 0, 0, 1, 1, 2, 2, 1, 0, 0, 0, 1],
      [9, 0, 0, 0, 1, 1, 2, 2, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    objects: [{ x: 6, y: 5, type: "hidden", item: "fish", dug: false }],
    exits: { west: "east_2" },
  },

  // --- WEST (JUNGLE EDGE -> DEEP -> YAKSHINI) ---
  west_1: {
    name: "Jungle Edge",
    bg: PALETTE.waterDark,
    layout: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    objects: [],
    exits: { east: "hub", west: "west_2" },
  },
  west_2: {
    name: "Deep Wilds",
    bg: PALETTE.waterDark,
    layout: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 9],
      [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 9],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    objects: [],
    exits: { east: "west_1", west: "west_3" },
  },
  west_3: {
    name: "Yakshini Glade",
    bg: PALETTE.waterDark,
    layout: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 9],
      [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 9],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    objects: [
      {
        x: 2,
        y: 5,
        type: "yakshini",
        msg: "The Yakshini Maukali.",
        fading: false,
      },
    ],
    exits: { east: "west_2" },
  },

  // --- SKY (CLOUDS -> ALTAR) ---
  sky_1: {
    name: "Cloud Path",
    bg: PALETTE.sky,
    layout: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0],
      [0, 0, 0, 7, 7, 7, 0, 7, 7, 7, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0],
      [0, 0, 7, 7, 0, 0, 0, 0, 0, 7, 7, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
    ],
    objects: [],
    exits: { south: "hub", north: "sky_2" },
  },
  sky_2: {
    name: "Ākāśa Altar",
    bg: PALETTE.sky,
    layout: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 7, 7, 7, 7, 7, 7, 7, 7, 7, 0, 0],
      [0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0],
      [0, 0, 7, 0, 0, 8, 0, 0, 0, 0, 7, 0, 0],
      [0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0],
      [0, 0, 7, 7, 7, 7, 7, 7, 7, 7, 7, 0, 0],
      [0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0],
    ],
    objects: [{ x: 5, y: 4, type: "altar", msg: "Final Altar." }],
    exits: { south: "sky_1" },
  },
};

export default function App() {
  const [gameState, setGameState] = useState("start");
  const [currentRoomKey, setCurrentRoomKey] = useState("hub");
  const [player, setPlayer] = useState({
    x: 6,
    y: 4,
    dir: "down",
    health: 3,
    maxHealth: 3,
    meditating: false,
    walking: false,
    isSwimming: false,
  });
  const [inventory, setInventory] = useState(["copper"]);
  const [alchemySlots, setAlchemySlots] = useState([null, null]);
  const [dialogue, setDialogue] = useState(null);
  const [verse, setVerse] = useState(null);
  const [flags, setFlags] = useState({ bellRungCount: 0 });
  const [tempRoomState, setTempRoomState] = useState(
    JSON.parse(JSON.stringify(ROOMS))
  );

  const room = tempRoomState[currentRoomKey];

  useEffect(() => {
    if (gameState === "win") {
      const timer = setTimeout(() => setGameState("credits"), 4000);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState === "playing" && VERSES[currentRoomKey]) {
      setVerse(VERSES[currentRoomKey]);
      const timer = setTimeout(() => setVerse(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [currentRoomKey, gameState]);

  const showText = (text) => {
    playSound("text");
    setDialogue(text);
    setGameState("dialogue");
  };

  const move = useCallback(
    (dx, dy) => {
      if (gameState !== "playing" || player.meditating) return;

      setPlayer((p) => ({ ...p, walking: true }));
      setTimeout(() => setPlayer((p) => ({ ...p, walking: false })), 150);

      const newX = player.x + dx;
      const newY = player.y + dy;
      const tile = room.layout[newY]?.[newX];
      let dir = dx > 0 ? "right" : dx < 0 ? "left" : dy > 0 ? "down" : "up";

      if (newX < 0) {
        attemptExit(room.exits.west, "east");
        return;
      }
      if (newX >= VIEW_WIDTH) {
        attemptExit(room.exits.east, "west");
        return;
      }
      if (newY < 0) {
        attemptExit(room.exits.north, "south");
        return;
      }
      if (newY >= VIEW_HEIGHT) {
        attemptExit(room.exits.south, "north");
        return;
      }

      const isWater = tile === 2;
      if ([0, 2, 4, 7, 9, 10].includes(tile)) {
        setPlayer((p) => ({
          ...p,
          x: newX,
          y: newY,
          dir,
          isSwimming: isWater,
        }));
        playSound(isWater ? "splash" : "step");
      } else {
        setPlayer((p) => ({ ...p, dir }));
      }
    },
    [player, gameState, room]
  );

  const attemptExit = (roomKey, entrySide) => {
    if (!roomKey) return;
    if (
      !inventory.includes("gold") &&
      (roomKey.startsWith("east") || roomKey.startsWith("west"))
    ) {
      showText("Mist blocks the path. You need Divine Gold.");
      return;
    }

    let newX = 6,
      newY = 4;
    if (entrySide === "east") {
      newX = VIEW_WIDTH - 2;
      newY = player.y;
    }
    if (entrySide === "west") {
      newX = 1;
      newY = player.y;
    }
    if (entrySide === "south") {
      newX = player.x;
      newY = VIEW_HEIGHT - 2;
    }
    if (entrySide === "north") {
      newX = player.x;
      newY = 1;
    }

    setCurrentRoomKey(roomKey);
    setPlayer((p) => ({ ...p, x: newX, y: newY, isSwimming: false }));
    setVerse(null);
  };

  const meditate = () => {
    if (gameState !== "playing") return;
    const isMeditating = !player.meditating;
    setPlayer((p) => ({ ...p, meditating: isMeditating }));

    if (isMeditating) {
      playSound("text");
      let hint = "Clear your mind...";
      if (currentRoomKey === "hub") {
        if (!inventory.includes("elephant_stone"))
          hint =
            "Seek the stone shaped like a beast near the temple. Look for the SPARKS on the ground.";
        else if (!inventory.includes("gold"))
          hint =
            "You have the Stone and Copper. Perform Alchemy (ENTER) to create the Key.";
        else if (!inventory.includes("siddhi_flight"))
          hint =
            "The Mist has cleared. Go East or West to gather ingredients, then South for the Bell.";
        else hint = "You have Flight. Press 'F' to ascend to the Sky Realm.";
      } else if (currentRoomKey.startsWith("south"))
        hint =
          "The Bell must be rung thrice to please Shambhu. It lies at the end of this path.";
      else if (currentRoomKey.startsWith("east"))
        hint =
          "Verse 14 speaks of the Tamarind. Gather its wood. The fish lies in a pool deeper in the forest.";
      else if (currentRoomKey.startsWith("west"))
        hint =
          "Navigate the deep jungle. The Yakshini waits in the deepest glade. Trust her.";
      else if (currentRoomKey.startsWith("sky"))
        hint = "Ascend to the final Altar.";

      setVerse(hint);
      if (player.health < player.maxHealth)
        setPlayer((p) => ({ ...p, health: p.health + 1 }));
    } else {
      setVerse(null);
    }
  };

  const interact = () => {
    if (gameState === "dialogue") {
      setGameState("playing");
      setDialogue(null);
      return;
    }

    let tx = player.x,
      ty = player.y;
    if (player.dir === "up") ty--;
    if (player.dir === "down") ty++;
    if (player.dir === "left") tx--;
    if (player.dir === "right") tx++;

    const objIndex = room.objects.findIndex((o) => o.x === tx && o.y === ty);
    const obj = room.objects[objIndex];

    if (obj) {
      if (obj.type === "sign") showText(obj.msg);
      if (obj.type === "bell") {
        setFlags((f) => ({ ...f, bellRungCount: f.bellRungCount + 1 }));
        showText("BONG! BONG! BONG!");
        if (flags.bellRungCount >= 2) {
          setTimeout(() => {
            setInventory((prev) => {
              if (prev.includes("siddhi_flight")) return prev;
              showText("Shambhu grants you FLIGHT!");
              playSound("get");
              return [...prev, "siddhi_flight"];
            });
          }, 1000);
        }
      }
      if (obj.type === "yakshini" && !inventory.includes("baby")) {
        showText(
          "Verse 91: 'This is my son. Hold him to your chest this very instant.' (Do not move...)"
        );
        setGameState("dialogue");
        setTimeout(() => {
          showText("Verse 92: 'You are worthy.' She vanishes.");
          playSound("vanish");

          const newRoomState = { ...tempRoomState };
          newRoomState[currentRoomKey].objects[objIndex].fading = true;
          setTempRoomState(newRoomState);

          setInventory((prev) => [...prev, "baby"]);

          setTimeout(() => {
            const cleanupState = { ...tempRoomState };
            cleanupState[currentRoomKey].objects.splice(objIndex, 1);
            setTempRoomState(cleanupState);
            setGameState("playing");
          }, 1500);
        }, 3000);
      }
      if (obj.type === "tree_int") {
        setInventory((prev) => {
          if (prev.includes("tamarind_wood")) return prev;
          showText("Got Tamarind Wood.");
          playSound("get");
          return [...prev, "tamarind_wood"];
        });
      }
      if (obj.type === "altar") {
        if (inventory.includes("adamantine_body")) {
          showText("Chanting Aghora Mantra...");
          setTimeout(() => setGameState("win"), 3000);
        } else {
          showText("You need the Adamantine Body first.");
        }
      }
    }
  };

  const dig = () => {
    const objIndex = room.objects.findIndex(
      (o) => o.x === player.x && o.y === player.y && o.type === "hidden"
    );
    if (objIndex > -1 && !room.objects[objIndex].dug) {
      const item = room.objects[objIndex].item;
      const newRoomState = { ...tempRoomState };
      newRoomState[currentRoomKey].objects[objIndex].dug = true;
      setTempRoomState(newRoomState);
      setInventory((prev) => {
        if (prev.includes(item)) return prev;
        showText(`You dug up: ${ITEMS[item].name}!`);
        playSound("get");
        return [...prev, item];
      });
    }
  };

  const performAlchemy = () => {
    const [i1, i2] = alchemySlots;
    if (!i1 || !i2) return;
    const recipe = RECIPES.find(
      (r) => r.inputs.includes(i1) && r.inputs.includes(i2)
    );
    if (recipe) {
      setInventory((prev) => [
        ...prev.filter((i) => i !== i1 && i !== i2),
        recipe.output,
      ]);
      setAlchemySlots([null, null]);
      showText(recipe.msg);
      playSound("alchemy_success");
      if (recipe.output === "adamantine_body")
        setPlayer((p) => ({ ...p, maxHealth: 6, health: 6 }));
    } else {
      showText("Failed combination.");
      setAlchemySlots([null, null]);
    }
  };

  useEffect(() => {
    const handle = (e) => {
      if (e.key === "ArrowUp" || e.key === "w") move(0, -1);
      if (e.key === "ArrowDown" || e.key === "s") move(0, 1);
      if (e.key === "ArrowLeft" || e.key === "a") move(-1, 0);
      if (e.key === "ArrowRight" || e.key === "d") move(1, 0);
      if (e.key === " " || e.key === "z") interact();
      if (e.key === "Shift") dig();
      if (e.key === "m") meditate();
      if (e.key === "Enter")
        setGameState((prev) => (prev === "alchemy" ? "playing" : "alchemy"));
      if (e.key === "f" && inventory.includes("siddhi_flight")) {
        setCurrentRoomKey("sky_1");
        setPlayer((p) => ({ ...p, x: 6, y: 7, isSwimming: false }));
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [move, interact, gameState, inventory, meditate]);

  const renderTile = (type, x, y) => {
    const style = {
      width: TILE_SIZE,
      height: TILE_SIZE,
      left: x * TILE_SIZE,
      top: y * TILE_SIZE,
      position: "absolute",
    };
    if (type === 1)
      return (
        <div key={`${x}-${y}`} style={style}>
          <Sprites.Tree type="normal" />
        </div>
      );
    if (type === 2)
      return (
        <div key={`${x}-${y}`} style={style}>
          <Sprites.Water />
        </div>
      );
    if (type === 3)
      return (
        <div key={`${x}-${y}`} style={style}>
          <Sprites.Temple />
        </div>
      );
    if (type === 4)
      return (
        <div key={`${x}-${y}`} style={style}>
          <Sprites.Dirt />
        </div>
      );
    if (type === 5)
      return (
        <div
          key={`${x}-${y}`}
          style={style}
          className="text-2xl flex items-center justify-center"
        >
          🔔
        </div>
      );
    if (type === 6)
      return (
        <div key={`${x}-${y}`} style={style}>
          <Sprites.Tree type="tamarind" />
        </div>
      );
    if (type === 7)
      return (
        <div key={`${x}-${y}`} style={style}>
          <Sprites.CloudPlatform />
        </div>
      );
    if (type === 10)
      return (
        <div key={`${x}-${y}`} style={style}>
          <Sprites.Bridge />
        </div>
      );
    if (type === 0 && currentRoomKey.startsWith("sky")) return null;
    return (
      <div key={`${x}-${y}`} style={style}>
        <Sprites.Grass />
      </div>
    );
  };

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center select-none font-mono">
      <style>{`
          @font-face { font-family: 'Retro'; src: local('Courier New'); }
          .retro-text { font-family: 'Retro', monospace; text-shadow: 2px 2px 0px #000; }
          .scanlines {
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            background-size: 100% 2px, 3px 100%;
            pointer-events: none;
          }
        `}</style>

      <div
        className="relative border-8 border-gray-700 bg-black shadow-2xl overflow-hidden"
        style={{
          width: VIEW_WIDTH * TILE_SIZE,
          height: VIEW_HEIGHT * TILE_SIZE + 100,
        }}
      >
        <div className="absolute inset-0 z-50 scanlines opacity-50"></div>

        {/* HUD */}
        <div className="h-16 bg-[#0000aa] border-b-4 border-white flex items-center justify-between px-4 text-white z-40 relative">
          <div className="flex gap-1">
            {Array.from({ length: player.maxHealth }).map((_, i) => (
              <Heart
                key={i}
                size={20}
                fill={i < player.health ? "red" : "black"}
                className="text-red-500"
              />
            ))}
          </div>
          <div className="retro-text text-xl text-yellow-300">{room.name}</div>
          <div className="text-[10px] space-x-2 flex flex-wrap justify-end">
            <span className="bg-blue-800 px-1 py-1 border border-white rounded">
              SHIFT: DIG
            </span>
            <span className="bg-blue-800 px-1 py-1 border border-white rounded">
              ENTER: MENU
            </span>
            <span className="bg-blue-800 px-1 py-1 border border-white rounded">
              M: MEDITATE
            </span>
            <span className="bg-blue-800 px-1 py-1 border border-white rounded">
              SPACE: INTERACT
            </span>
            <span className="bg-blue-800 px-1 py-1 border border-white rounded">
              F: FLY
            </span>
          </div>
        </div>

        {/* GAME WORLD */}
        <div
          className="relative"
          style={{
            width: VIEW_WIDTH * TILE_SIZE,
            height: VIEW_HEIGHT * TILE_SIZE,
            backgroundColor: room.bg,
          }}
        >
          {room.layout.map((row, y) =>
            row.map((tile, x) => renderTile(tile, x, y))
          )}

          {/* Objects */}
          {room.objects.map((obj, i) => {
            if (obj.type === "hidden" && !obj.dug)
              return (
                <div
                  key={"o" + i}
                  style={{
                    left: obj.x * TILE_SIZE,
                    top: obj.y * TILE_SIZE,
                    position: "absolute",
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                  }}
                >
                  <Sprites.Sparkle />
                </div>
              );
            if (obj.type === "yakshini")
              return (
                <div
                  key={"o" + i}
                  style={{
                    left: obj.x * TILE_SIZE,
                    top: obj.y * TILE_SIZE,
                    position: "absolute",
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                  }}
                >
                  <Sprites.Yakshini fading={obj.fading} />
                </div>
              );
            if (obj.type === "mist" && !inventory.includes("gold"))
              return (
                <div
                  key={"o" + i}
                  style={{
                    left: obj.x * TILE_SIZE,
                    top: obj.y * TILE_SIZE,
                    position: "absolute",
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                  }}
                >
                  <Sprites.Mist />
                </div>
              );
            if (obj.type === "altar")
              return (
                <div
                  key={"o" + i}
                  style={{
                    left: obj.x * TILE_SIZE,
                    top: obj.y * TILE_SIZE,
                    position: "absolute",
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                  }}
                >
                  <Sprites.Mahakala />
                </div>
              );
            return null;
          })}

          {/* Player */}
          <div
            style={{
              width: TILE_SIZE,
              height: TILE_SIZE,
              left: player.x * TILE_SIZE,
              top: player.y * TILE_SIZE,
              position: "absolute",
              transition: "all 0.15s linear",
            }}
          >
            <Sprites.Player
              dir={player.dir}
              isMeditating={player.meditating}
              isWalking={player.walking}
              isSwimming={player.isSwimming}
            />
          </div>
        </div>

        {/* VERSE OVERLAY */}
        {verse && (
          <div className="absolute bottom-20 left-4 right-4 bg-black/80 text-yellow-100 p-2 text-center text-xs italic border border-yellow-500 z-40 retro-text">
            {verse}
          </div>
        )}

        {/* DIALOGUE */}
        {gameState === "dialogue" && (
          <div className="absolute bottom-4 left-4 right-4 bg-[#0000aa] border-4 border-white text-white p-4 z-50 shadow-lg">
            <p className="retro-text text-sm leading-6 tracking-wide">
              {dialogue}
            </p>
            <div className="absolute bottom-2 right-2 text-xs animate-pulse">
              ▼
            </div>
          </div>
        )}

        {/* ALCHEMY MENU */}
        {gameState === "alchemy" && (
          <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center">
            <div className="bg-[#0000aa] border-4 border-white p-8 w-3/4 max-w-md text-white">
              <h2 className="text-center retro-text text-yellow-300 mb-6 border-b-2 border-white pb-2">
                ALCHEMY
              </h2>
              <div className="flex justify-center gap-4 mb-6">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="w-16 h-16 border-2 border-white bg-blue-900 flex items-center justify-center text-2xl cursor-pointer"
                    onClick={() =>
                      alchemySlots[i] &&
                      setAlchemySlots((p) => {
                        const n = [...p];
                        n[i] = null;
                        return n;
                      })
                    }
                  >
                    {ITEMS[alchemySlots[i]]?.icon}
                  </div>
                ))}
                <button
                  onClick={performAlchemy}
                  className="px-4 bg-yellow-600 border-2 border-white hover:bg-yellow-500"
                >
                  MIX
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {inventory.map((k, index) => (
                  <div
                    key={`${k}-${index}`}
                    onClick={() => {
                      if (!alchemySlots[0])
                        setAlchemySlots([k, alchemySlots[1]]);
                      else if (!alchemySlots[1])
                        setAlchemySlots([alchemySlots[0], k]);
                    }}
                    className="p-2 border border-white/50 hover:bg-blue-800 cursor-pointer flex gap-4"
                  >
                    <span>{ITEMS[k].icon}</span>
                    <span>{ITEMS[k].name}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setGameState("playing")}
                className="mt-4 w-full border border-white py-1 hover:bg-red-900"
              >
                EXIT
              </button>
            </div>
          </div>
        )}

        {/* START SCREEN */}
        {gameState === "start" && (
          <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center">
            <h1 className="text-4xl text-yellow-400 retro-text mb-4 text-center">
              Rasaratnākara: The Eighth Instruction
            </h1>
            <div className="text-white text-xs mb-8 font-mono space-y-2 text-center opacity-80">
              <p>PRESS START TO BEGIN</p>
            </div>
            <button
              onClick={() => setGameState("playing")}
              className="px-8 py-2 bg-[#0000aa] border-4 border-white text-white retro-text hover:bg-blue-700"
            >
              START GAME
            </button>
          </div>
        )}

        {/* WIN SCREEN */}
        {gameState === "win" && (
          <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center text-black">
            <h1 className="text-4xl font-bold mb-4">SIDDHI ATTAINED</h1>
            <p>You have conquered death.</p>
          </div>
        )}

        {/* CREDITS SCREEN */}
        {gameState === "credits" && (
          <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center text-center p-8 animate-[fadeIn_2s_ease-in]">
            <h1 className="text-3xl text-yellow-400 retro-text mb-8">
              Rasaratnākara: The Eighth Instruction
            </h1>
            <div className="text-white text-xs font-mono space-y-4 max-w-lg leading-relaxed opacity-80">
              <p>Game created by Keith Edward Cantú using Google Gemini 3.0.</p>
              <p>Translations of Rasaratnākara by Keith Edward Cantú,</p>
              <p>
                published in <i>Indian Alchemy: Sources and Contexts</i>,
              </p>
              <p>edited by Dagmar Wujastyk,</p>
              <p>South Asia Research Series (Oxford University Press, 2025).</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-12 px-4 py-2 border border-white text-white hover:bg-white hover:text-black text-xs"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
