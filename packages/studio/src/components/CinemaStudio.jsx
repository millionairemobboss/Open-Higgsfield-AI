"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { generateImage, generateVideo, uploadFile, processLipSync } from "../muapi.js";
import { analyzeRequest, generateStoryboard } from "../directorBrain.js";
import { toast } from "react-hot-toast";

// ─── Constants (inlined from promptUtils) ───────────────────────────────────

const CAMERA_MAP = {
  "Modular 8K Digital": "modular 8K digital cinema camera",
  "Full-Frame Cine Digital": "full-frame digital cinema camera",
  "Grand Format 70mm Film": "grand format 70mm film camera",
  "Studio Digital S35": "Super 35 studio digital camera",
  "Classic 16mm Film": "classic 16mm film camera",
  "Premium Large Format Digital": "premium large-format digital cinema camera",
};

const LENS_MAP = {
  "Creative Tilt Lens": "creative tilt lens effect",
  "Compact Anamorphic": "compact anamorphic lens",
  "Extreme Macro": "extreme macro lens",
  "70s Cinema Prime": "1970s cinema prime lens",
  "Classic Anamorphic": "classic anamorphic lens",
  "Premium Modern Prime": "premium modern prime lens",
  "Warm Cinema Prime": "warm-toned cinema prime lens",
  "Swirl Bokeh Portrait": "swirl bokeh portrait lens",
  "Vintage Prime": "vintage prime lens",
  "Halation Diffusion": "halation diffusion filter",
  "Clinical Sharp Prime": "ultra-sharp clinical prime lens",
};

const FOCAL_PERSPECTIVE = {
  8: "ultra-wide perspective",
  14: "wide-angle perspective",
  24: "wide-angle dynamic perspective",
  35: "natural cinematic perspective",
  50: "standard portrait perspective",
  85: "classic portrait perspective",
};

const APERTURE_EFFECT = {
  "f/1.4": "shallow depth of field, creamy bokeh",
  "f/4": "balanced depth of field",
  "f/11": "deep focus clarity, sharp foreground to background",
};

const ASSET_URLS = {
  "Modular 8K Digital": "/assets/cinema/modular_8k_digital.webp",
  "Full-Frame Cine Digital": "/assets/cinema/full_frame_cine_digital.webp",
  "Grand Format 70mm Film": "/assets/cinema/grand_format_70mm_film.webp",
  "Studio Digital S35": "/assets/cinema/studio_digital_s35.webp",
  "Classic 16mm Film": "/assets/cinema/classic_16mm_film.webp",
  "Premium Large Format Digital":
    "/assets/cinema/premium_large_format_digital.webp",
  "Creative Tilt Lens": "/assets/cinema/creative_tilt_lens.webp",
  "Compact Anamorphic": "/assets/cinema/compact_anamorphic.webp",
  "Extreme Macro": "/assets/cinema/extreme_macro.webp",
  "70s Cinema Prime": "/assets/cinema/70s_cinema_prime.webp",
  "Classic Anamorphic": "/assets/cinema/classic_anamorphic.webp",
  "Premium Modern Prime": "/assets/cinema/premium_modern_prime.webp",
  "Warm Cinema Prime": "/assets/cinema/warm_cinema_prime.webp",
  "Swirl Bokeh Portrait": "/assets/cinema/swirl_bokeh_portrait.webp",
  "Vintage Prime": "/assets/cinema/vintage_prime.webp",
  "Halation Diffusion": "/assets/cinema/halation_diffusion.webp",
  "Clinical Sharp Prime": "/assets/cinema/clinical_sharp_prime.webp",
  "f/1.4": "/assets/cinema/f_1_4.webp",
  "f/4": "/assets/cinema/f_4.webp",
  "f/11": "/assets/cinema/f_11.webp",
};

const ASPECT_RATIOS = ["16:9", "21:9", "9:16", "1:1", "4:5"];
const RESOLUTIONS = ["1K", "2K", "4K"];
const CAMERAS = Object.keys(CAMERA_MAP);
const LENSES = Object.keys(LENS_MAP);
const FOCAL_LENGTHS = Object.keys(FOCAL_PERSPECTIVE).map((k) => parseInt(k));
const APERTURES = Object.keys(APERTURE_EFFECT);

const ELEMENTS_MOCK = [
  { id: 1, name: "Tazz (Mob Boss)", handle: "mob-boss", icon: "🕴️" },
  { id: 2, name: "Ragan", handle: "ragan", icon: "👩" },
  { id: 3, name: "Pink Watch", handle: "pink-watch", icon: "⌚" },
  { id: 4, name: "Neon Skyline", handle: "neon-skyline", icon: "🏙️" }
];

function buildNanoBananaPrompt(
  basePrompt,
  camera,
  lens,
  focalLength,
  aperture,
) {
  const cameraDesc = CAMERA_MAP[camera] || camera;
  const lensDesc = LENS_MAP[lens] || lens;
  const perspective = FOCAL_PERSPECTIVE[focalLength] || "";
  const depthEffect = APERTURE_EFFECT[aperture] || "";
  const qualityTags = [
    "professional photography",
    "ultra-detailed",
    "8K resolution",
  ];
  const parts = [
    basePrompt,
    `shot on a ${cameraDesc}`,
    `using a ${lensDesc} at ${focalLength}mm ${perspective ? `(${perspective})` : ""}`,
    `aperture ${aperture}`,
    depthEffect,
    "cinematic lighting",
    "natural color science",
    "high dynamic range",
    qualityTags.join(", "),
  ];
  return parts.filter((p) => p && p.trim() !== "").join(", ");
}

// ─── Dropdown ────────────────────────────────────────────────────────────────

function Dropdown({ items, selected, onSelect, triggerRef, onClose }) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ bottom: 0, left: 0 });

  useEffect(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        bottom: window.innerHeight - rect.top + 8,
        left: rect.left,
      });
    }

    const handler = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    const timer = setTimeout(
      () => document.addEventListener("click", handler),
      0,
    );
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handler);
    };
  }, [triggerRef, onClose]);

  return (
    <div
      ref={menuRef}
      className="custom-dropdown fixed bg-[#1a1a1a] border border-white/10 rounded-xl py-1 shadow-2xl z-50 flex flex-col min-w-[100px] animate-fade-in"
      style={{ bottom: position.bottom, left: position.left }}
    >
      {items.map((item) => (
        <button
          key={item}
          className={`px-3 py-2 text-xs font-bold text-left hover:bg-white/10 transition-colors ${item === selected ? "text-primary" : "text-white"}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(item);
            onClose();
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

// ─── Scroll Column (Camera Controls) ─────────────────────────────────────────

function ScrollColumn({ title, items, columnKey, value, onChange }) {
  const listRef = useRef(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const scrollTopStart = useRef(0);
  const isSnapEnabled = useRef(true);

  // Scroll to initial value on mount
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const timer = setTimeout(() => {
      const target = Array.from(list.children).find(
        (c) => c.dataset.value == String(value),
      );
      if (target) target.scrollIntoView({ block: "center" });
    }, 100);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const centerY = list.scrollTop + list.clientHeight / 2;
    let closest = null;
    let minDist = Infinity;

    const children = Array.from(list.children).filter((c) => c.dataset.value);
    children.forEach((child) => {
      const childCenter = child.offsetTop + child.offsetHeight / 2;
      const dist = Math.abs(centerY - childCenter);
      if (dist < minDist) {
        minDist = dist;
        closest = child;
      }
    });

    children.forEach((child) => {
      const imgBox = child.querySelector("[data-imgbox]");
      const label = child.querySelector("[data-label]");
      const focalSpan = imgBox?.querySelector("[data-focal-text]");
      const isClosest = child === closest;

      if (isClosest) {
        child.classList.remove("opacity-30", "scale-75", "blur-[1px]");
        child.classList.add("opacity-100", "scale-100", "blur-0", "z-30");
        if (imgBox) {
          imgBox.classList.add(
            "border-primary/50",
            "shadow-glow-sm",
            "scale-110",
          );
          imgBox.classList.remove("border-white/10", "bg-white/5");
        }
        if (focalSpan) focalSpan.classList.add("text-primary");
        if (label) label.classList.add("text-primary", "text-shadow-sm");
      } else {
        child.classList.add("opacity-30", "scale-75", "blur-[1px]");
        child.classList.remove("opacity-100", "scale-100", "blur-0", "z-30");
        if (imgBox) {
          imgBox.classList.remove(
            "border-primary/50",
            "shadow-glow-sm",
            "scale-110",
          );
          imgBox.classList.add("border-white/10", "bg-white/5");
        }
        if (focalSpan) focalSpan.classList.remove("text-primary");
        if (label) label.classList.remove("text-primary", "text-shadow-sm");
      }
    });

    if (closest) {
      const newVal =
        columnKey === "focal"
          ? parseInt(closest.dataset.value)
          : closest.dataset.value;
      if (String(newVal) !== String(value)) {
        onChange(newVal);
      }
    }
  }, [columnKey, value, onChange]);

  // Attach scroll handler with initial check
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.addEventListener("scroll", handleScroll);
    const timer = setTimeout(handleScroll, 150);
    return () => {
      list.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [handleScroll]);

  // Mouse drag handlers
  const onMouseDown = (e) => {
    isDragging.current = true;
    isSnapEnabled.current = false;
    listRef.current.classList.add("cursor-grabbing");
    listRef.current.classList.remove("snap-y");
    startY.current = e.pageY - listRef.current.offsetTop;
    scrollTopStart.current = listRef.current.scrollTop;
    e.preventDefault();
  };

  const onMouseLeave = () => {
    isDragging.current = false;
    listRef.current.classList.remove("cursor-grabbing");
    listRef.current.classList.add("snap-y");
  };

  const onMouseUp = () => {
    isDragging.current = false;
    listRef.current.classList.remove("cursor-grabbing");
    listRef.current.classList.add("snap-y");
  };

  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const y = e.pageY - listRef.current.offsetTop;
    const walk = (y - startY.current) * 1.5;
    listRef.current.scrollTop = scrollTopStart.current - walk;
  };

  const onItemClick = (item) => {
    const list = listRef.current;
    if (!list) return;
    const target = Array.from(list.children).find(
      (c) => c.dataset.value == String(item),
    );
    if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="flex flex-col items-center relative w-[140px] md:w-[160px] shrink-0 snap-center group">
      <div className="mb-3 text-[9px] font-black text-white/40 uppercase tracking-[0.2em] text-center">
        {title}
      </div>
      <div className="relative overflow-hidden w-full h-[40vh] md:h-[320px] bg-[#050505]/60 rounded-2xl border border-white/[0.05] shadow-2xl backdrop-blur-2xl transition-transform duration-500 hover:scale-[1.01] hover:border-white/[0.1]">
        {/* Top mask */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent z-20 pointer-events-none" />
        {/* Bottom mask */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent z-20 pointer-events-none" />
        {/* Center selection indicator */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[80px] bg-primary/[0.03] border border-primary/[0.1] rounded-2xl pointer-events-none z-0" />

        <div
          ref={listRef}
          className="h-full overflow-y-auto no-scrollbar snap-y snap-mandatory relative z-10"
          onMouseDown={onMouseDown}
          onMouseLeave={onMouseLeave}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
        >
          {/* Top spacer */}
          <div style={{ height: "calc(50% - 50px)" }} />

          {items.map((item) => {
            const imageUrl = ASSET_URLS[item];
            return (
              <div
                key={item}
                data-value={item}
                className="h-[100px] flex flex-col items-center justify-center gap-3 snap-center cursor-pointer transition-all duration-500 ease-out text-white p-2 select-none opacity-30 scale-75 blur-[1px]"
                onClick={() => onItemClick(item)}
              >
                <div
                  data-imgbox="true"
                  className="w-14 h-14 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center transition-all duration-500 shadow-inner overflow-hidden relative"
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={String(item)}
                      className="w-full h-full object-cover opacity-80"
                    />
                  ) : columnKey === "focal" ? (
                    <span
                      data-focal-text="true"
                      className="text-lg font-bold text-white/50"
                    >
                      {item}
                    </span>
                  ) : (
                    <div className="w-3 h-3 bg-white/20 rounded-full" />
                  )}
                </div>
                <span
                  data-label="true"
                  className="text-[9px] md:text-[10px] font-bold uppercase text-center leading-tight max-w-full truncate px-1 tracking-wider"
                >
                  {item}
                </span>
              </div>
            );
          })}

          {/* Bottom spacer */}
          <div style={{ height: "calc(50% - 50px)" }} />
        </div>
      </div>
    </div>
  );
}

function CameraControlsOverlay({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}) {
  const backdropRef = useRef(null);

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose();
  };

  const updateSetting = (key) => (val) => {
    onSettingsChange((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div
      ref={backdropRef}
      className={`fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-2xl z-[100] flex items-center justify-center transition-all duration-500 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      onClick={handleBackdropClick}
    >
      <div
        className={`w-full max-w-5xl bg-[#0a0a0a]/60 border border-white/10 rounded-2xl p-6 md:p-10 shadow-3xl transform transition-all duration-500 flex flex-col max-h-[90vh] ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-10"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Camera Configuration
            </h2>
            <p className="text-[11px] font-medium text-white/20 uppercase tracking-[0.2em]">
              Select hardware & optics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                 onSettingsChange(prev => ({
                   ...prev,
                   camera: CAMERAS[Math.floor(Math.random() * CAMERAS.length)],
                   lens: LENSES[Math.floor(Math.random() * LENSES.length)],
                   focal: FOCAL_LENGTHS[Math.floor(Math.random() * FOCAL_LENGTHS.length)],
                   aperture: APERTURES[Math.floor(Math.random() * APERTURES.length)]
                 }));
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl text-xs font-bold text-purple-300 hover:bg-purple-500/30 transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6z" strokeLinejoin="round" strokeLinecap="round"/></svg>
              Auto-Generate Settings
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scroll columns */}
        <div className="w-full flex justify-start md:justify-center gap-3 md:gap-6 py-4 md:py-8 overflow-x-auto no-scrollbar snap-x px-4 md:px-0">
          <ScrollColumn
            title="Camera"
            items={CAMERAS}
            columnKey="camera"
            value={settings.camera}
            onChange={updateSetting("camera")}
          />
          <ScrollColumn
            title="Lens"
            items={LENSES}
            columnKey="lens"
            value={settings.lens}
            onChange={updateSetting("lens")}
          />
          <ScrollColumn
            title="Focal Length"
            items={FOCAL_LENGTHS}
            columnKey="focal"
            value={settings.focal}
            onChange={updateSetting("focal")}
          />
          <ScrollColumn
            title="Aperture"
            items={APERTURES}
            columnKey="aperture"
            value={settings.aperture}
            onChange={updateSetting("aperture")}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ───────────────────────────────────────────────────

function QuickElementsMenu({ items, position, onSelect, onClose }) {
  return (
    <div 
      className="absolute bg-[#1c1c1c] border border-white/10 rounded-xl shadow-2xl z-[100] w-48 overflow-hidden animate-fade-in-up"
      style={{ bottom: position.bottom, right: position.right }}
    >
      <div className="p-2 border-b border-white/5 bg-white/5">
        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Suggested Elements</span>
      </div>
      <div className="max-h-48 overflow-y-auto custom-scrollbar">
        {items.map((item, i) => (
          <button 
            key={i} 
            onClick={() => onSelect(item)}
            className="w-full text-left px-4 py-2 text-xs text-white/70 hover:bg-[#93e8d3] hover:text-black transition-colors border-b border-white/5 last:border-0"
          >
            @{item.replace(/\s+/g, '-').toLowerCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CinemaStudio({
  apiKey,
  onGenerationComplete,
  historyItems,
}) {
  const PERSIST_KEY = "hg_cinema_studio_persistent";

  // ── Settings state ──
  const [settings, setSettings] = useState({
    prompt: "",
    aspect_ratio: "16:9",
    camera: CAMERAS[0],
    lens: LENSES[0],
    focal: 35,
    aperture: "f/1.4",
  });
  const [resolution, setResolution] = useState("1080p");
  const [duration, setDuration] = useState("5s");

  // ── UI state ──
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [canvasUrl, setCanvasUrl] = useState(null); // null = prompt view
  const [fullscreenUrl, setFullscreenUrl] = useState(null);
  const [activeHistoryIndex, setactiveHistoryIndex] = useState(null);
  
  const [elements, setElements] = useState([
    { id: '1', name: 'Zeus', type: 'Character', image: null },
    { id: '2', name: 'Athena', type: 'Character', image: null },
    { id: '3', name: 'Cyberpunk Hacker', type: 'Character', image: null },
    { id: '4', name: 'Street Samurai', type: 'Character', image: null }
  ]);
  const [isUploadingElement, setIsUploadingElement] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Cinema Studio 3.5");
  const [isAiDirectorOpen, setIsAiDirectorOpen] = useState(false);
  const [isElementsModalOpen, setIsElementsModalOpen] = useState(false);
  const [elementsModalTab, setElementsModalTab] = useState("Elements");
  const [elementsFilter, setElementsFilter] = useState("All");
  const [directorInput, setDirectorInput] = useState("");
  const [showDirectorElements, setShowDirectorElements] = useState(false);
  const [directorChat, setDirectorChat] = useState([]);
  const [showElements, setShowElements] = useState(false);
  
  // ── Director Mode State ──
  const [isDirectorMode, setIsDirectorMode] = useState(false);
  const [directorShots, setDirectorShots] = useState([
    { id: 1, prompt: "", status: "idle", url: null }
  ]);
  const [activeShotId, setActiveShotId] = useState(1);

  // ── Internal history state (used when historyItems prop is not provided) ──
  const [internalHistory, setInternalHistory] = useState([]);

  const [openDropdown, setOpenDropdown] = useState(null); // 'ar' | 'res' | 'motion' | 'duration' | null
  const [motion, setMotion] = useState("Auto");
  
  // ── Audio State ──
  const [audioFileUrl, setAudioFileUrl] = useState(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const audioInputRef = useRef(null);

  // ── Textarea auto-grow ──
  const textareaRef = useRef(null);
  const resultImgRef = useRef(null);

  // ── Persistence: Load ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PERSIST_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.settings) setSettings(data.settings);
        if (data.resolution) setResolution(data.resolution);
        if (data.internalHistory) setInternalHistory(data.internalHistory);
      }
    } catch (err) {
      console.warn("Failed to load CinemaStudio persistence:", err);
    }
  }, []);

  // ── Persistence: Save ────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const state = {
          settings,
          resolution,
          internalHistory,
        };
        localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
      } catch (err) {
        console.warn("Failed to save CinemaStudio persistence:", err);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [settings, resolution, internalHistory]);

  // Derive effective history (prop wins over internal)
  const history = historyItems != null ? historyItems : internalHistory;

  useEffect(() => {
    setCanvasUrl(history[0]?.url || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyItems]);

  const formatSummaryValue = () =>
    `${settings.lens}, ${settings.focal}mm, ${settings.aperture}`;

  // ── Textarea auto-height & Elements Trigger ──
  const handleTextareaInput = (e) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
    
    const val = el.value;
    setSettings((prev) => ({ ...prev, prompt: val }));

    // Detect if user typed '@' as the last character or after a space
    if (val.endsWith('@') || val.endsWith(' @')) {
      setShowElements(true);
    } else if (showElements && !val.includes('@')) {
      setShowElements(false);
    }
  };

  const handleElementSelect = (el) => {
    setSettings(prev => {
      const currentPrompt = prev.prompt || "";
      const newPrompt = currentPrompt.endsWith('@') 
        ? currentPrompt.replace(/@$/, `@${el.handle} `)
        : currentPrompt + (currentPrompt && !currentPrompt.endsWith(' ') ? ' ' : '') + `@${el.handle} `;
      return { ...prev, prompt: newPrompt };
    });
    
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // ── Generate ──
  const handleGenerate = useCallback(async () => {
    if (isDirectorMode) {
      // Director Mode: generate all idle shots
      const idleShots = directorShots.filter(s => !s.url && s.prompt.trim());
      if (idleShots.length === 0) return alert("No valid shots to generate. Add prompts to your shots.");
      
      setIsGenerating(true);
      try {
        const newShots = [...directorShots];
        for (const shot of idleShots) {
          // Find if the shot prompt contains any uploaded character elements
          let referenceImageUrls = [];
          for (const el of elements) {
            if (shot.prompt.includes(`@${el.handle}`) && el.imageUrls && el.imageUrls.length > 0) {
              referenceImageUrls = el.imageUrls;
              break;
            } else if (shot.prompt.includes(`@${el.handle}`) && el.imageUrl) {
              referenceImageUrls = [el.imageUrl];
              break;
            }
          }
          const primaryImageUrl = referenceImageUrls.length > 0 ? referenceImageUrls[0] : null;

          let actualModelId = "kling-v3.0-std-motion-control";
          const lowerModel = selectedModel.toLowerCase();
          if (lowerModel.includes("kling 3.0")) actualModelId = "kling-v3.0-std-motion-control";
          else if (lowerModel.includes("seedance 2.0") && !lowerModel.includes("omni")) actualModelId = "seedance-v2.0-t2v";
          else if (lowerModel.includes("seedance omni")) actualModelId = "seedance-omni-t2v";
          else if (lowerModel.includes("kling 2.5")) actualModelId = "kling-v2.5-std-motion-control";

          if (primaryImageUrl && lowerModel.includes("seedance")) {
            actualModelId = "seedance-omni-t2v";
          }

          // Omni requires an image payload. If not provided, fallback safely
          if (actualModelId === "seedance-omni-t2v" && !primaryImageUrl) {
            actualModelId = "seedance-v2.0-t2v";
          }

          const payload = {
            model: actualModelId,
            prompt: shot.prompt,
            aspect_ratio: settings.aspect_ratio,
            resolution: resolution.toLowerCase(),
            duration: parseInt(duration, 10),
          };
          
          if (motion !== "Auto") {
            payload.camera_control = motion.toLowerCase();
          }

          if (primaryImageUrl) {
            payload.image_url = primaryImageUrl;
            if (referenceImageUrls.length > 1) payload.image_urls = referenceImageUrls;
          }

          // Update status to processing
          setDirectorShots(prev => prev.map(s => s.id === shot.id ? { ...s, status: "processing" } : s));

          const res = await generateVideo(apiKey, payload);
          if (res && res.url) {
            setDirectorShots(prev => prev.map(s => s.id === shot.id ? { ...s, status: "completed", url: res.url } : s));
            
            // Add to gallery history
            const entry = {
              url: res.url,
              timestamp: Date.now(),
              settings: {
                prompt: shot.prompt,
                camera: settings.camera,
                lens: settings.lens,
                focal: settings.focal,
                aperture: settings.aperture,
                aspect_ratio: settings.aspect_ratio,
                resolution,
                motion
              },
            };
            if (historyItems == null) {
              setInternalHistory((prev) => [entry, ...prev].slice(0, 50));
            }
            setCanvasUrl(res.url); // Preview the latest finished shot
          } else {
            setDirectorShots(prev => prev.map(s => s.id === shot.id ? { ...s, status: "failed" } : s));
          }
        }
      } catch (e) {
        console.error(e);
        alert("Director Mode Generation Failed.");
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // Single Shot Mode
    const basePrompt = settings.prompt.trim();
    if (!basePrompt || isGenerating) return;

    setIsGenerating(true);

    const finalPrompt = buildNanoBananaPrompt(
      basePrompt,
      settings.camera,
      settings.lens,
      settings.focal,
      settings.aperture,
    );

    // Find if the prompt contains any uploaded character elements
    let referenceImageUrls = [];
    for (const el of elements) {
      if (basePrompt.includes(`@${el.handle}`) && el.imageUrls && el.imageUrls.length > 0) {
        referenceImageUrls = el.imageUrls;
        break; // take the first matched character for now
      } else if (basePrompt.includes(`@${el.handle}`) && el.imageUrl) {
        referenceImageUrls = [el.imageUrl]; // backwards compatibility
        break;
      }
    }
    const primaryImageUrl = referenceImageUrls.length > 0 ? referenceImageUrls[0] : null;

    try {
      // Map the UI model name to a valid muapi model ID
      let actualModelId = "kling-v3.0-std-motion-control"; // default fallback
      const lowerModel = selectedModel.toLowerCase();
      if (lowerModel.includes("kling 3.0")) actualModelId = "kling-v3.0-std-motion-control";
      else if (lowerModel.includes("seedance 2.0") && !lowerModel.includes("omni")) actualModelId = "seedance-v2.0-t2v";
      else if (lowerModel.includes("seedance omni")) actualModelId = "seedance-omni-t2v";
      else if (lowerModel.includes("kling 2.5")) actualModelId = "kling-v2.5-std-motion-control";

      // If we have an image reference, auto-switch to Omni if using Seedance
      if (primaryImageUrl && lowerModel.includes("seedance")) {
         actualModelId = "seedance-omni-t2v";
      }

      // Omni requires an image payload. If not provided, fallback safely to prevent 422 error
      if (actualModelId === "seedance-omni-t2v" && !primaryImageUrl) {
         console.warn("Seedance Omni requires a character reference. Falling back to Seedance 2.0 Text-to-Video.");
         actualModelId = "seedance-v2.0-t2v";
      }

      const payload = {
        model: actualModelId,
        prompt: finalPrompt,
        aspect_ratio: settings.aspect_ratio,
        resolution: resolution.toLowerCase(),
        duration: parseInt(duration, 10),
      };
      
      if (motion !== "Auto") {
        payload.camera_control = motion.toLowerCase();
      }

      // Pass multiple images if available (some models use image_url, some use image_list/images)
      if (primaryImageUrl) {
        payload.image_url = primaryImageUrl;
        if (referenceImageUrls.length > 1) {
          payload.image_urls = referenceImageUrls; // Send the full array for VIP/Advanced models
        }
      }

      const res = await generateVideo(apiKey, payload);

      if (res && res.url) {
        let finalUrl = res.url;

        // ── Lip Sync Pipeline ──
        if (audioFileUrl) {
           setIsGenerating(true);
           try {
              const lipSyncRes = await processLipSync(apiKey, {
                model: "sync-1.6.0",
                video_url: res.url,
                audio_url: audioFileUrl
              });
              if (lipSyncRes && lipSyncRes.url) {
                 finalUrl = lipSyncRes.url;
              }
           } catch (lipErr) {
              console.error("Lip Sync failed:", lipErr);
              alert("Video generated, but Lip Sync failed.");
           }
        }

        const entry = {
          url: finalUrl,
          timestamp: Date.now(),
          settings: {
            prompt: basePrompt,
            camera: settings.camera,
            lens: settings.lens,
            focal: settings.focal,
            aperture: settings.aperture,
            aspect_ratio: settings.aspect_ratio,
            resolution,
            motion,
            audioUrl: audioFileUrl
          },
        };

        // Only update internal history if not using prop-driven history
        if (historyItems == null) {
          setInternalHistory((prev) => [entry, ...prev].slice(0, 50));
        }

        setCanvasUrl(finalUrl);

        if (onGenerationComplete) {
          onGenerationComplete({
            url: res.url,
            model: "nano-banana-pro",
            prompt: basePrompt,
            type: "cinema",
          });
        }
      } else {
        throw new Error("No data returned");
      }
    } catch (e) {
      console.error(e);
      alert("Generation Failed: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  }, [
    settings,
    resolution,
    apiKey,
    isGenerating,
    onGenerationComplete,
    historyItems,
  ]);

  // ── Regenerate ──
  const handleRegenerate = useCallback(() => {
    setCanvasUrl(null);
    // Small delay then generate
    setTimeout(() => handleGenerate(), 300);
  }, [handleGenerate]);

  // ── Download ──
  const handleDownload = useCallback(async () => {
    if (!canvasUrl) return;
    try {
      const response = await fetch(canvasUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `cinema-shot-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(canvasUrl, "_blank");
    }
  }, [canvasUrl]);

  // ── Load history item ──
  const loadHistoryItem = (entry, idx) => {
    if (entry.settings) {
      setSettings((prev) => ({
        ...prev,
        camera: entry.settings.camera ?? prev.camera,
        lens: entry.settings.lens ?? prev.lens,
        focal: entry.settings.focal ?? prev.focal,
        aperture: entry.settings.aperture ?? prev.aperture,
        aspect_ratio: entry.settings.aspect_ratio ?? prev.aspect_ratio,
        prompt: entry.settings.prompt ?? prev.prompt,
      }));
      if (entry.settings.resolution) setResolution(entry.settings.resolution);

      // Sync textarea height
      if (textareaRef.current) {
        textareaRef.current.value = entry.settings.prompt || "";
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height =
          textareaRef.current.scrollHeight + "px";
      }
    }
    setCanvasUrl(entry.url);
  };

  const resetToPrompt = () => {
    setCanvasUrl(null);
    setSettings((prev) => ({ ...prev, prompt: "" }));
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleGenerateCharacterSheet = async (char) => {
    if (!apiKey) {
      toast.error("Please add your API key first");
      return;
    }
    
    setIsGenerating(true);
    const toastId = toast.loading(`Designing reference sheet for ${char.handle}...`);
    
    try {
      const prompt = `Character design sheet of ${char.handle}, ${char.visuals}, detailed turnaround featuring: full body front view, side view, and back view. Consistent character features, uniform soft studio lighting, plain white background, sharp focus, professional concept art style, 8k resolution.`;
      
      const result = await generateImage(apiKey, {
        model: "dalle-3", 
        prompt: prompt,
        aspect_ratio: "16:9"
      });
      
      if (result.url) {
        setElements(prev => {
          const cleanHandle = char.handle.replace('@', '');
          const existing = prev.find(e => e.handle === cleanHandle || e.name.toLowerCase() === cleanHandle.toLowerCase());
          if (existing) {
            return prev.map(e => e.id === existing.id ? { ...e, imageUrl: result.url, type: 'Character' } : e);
          } else {
            return [...prev, { 
              id: Date.now().toString(), 
              name: cleanHandle.charAt(0).toUpperCase() + cleanHandle.slice(1), 
              handle: cleanHandle, 
              imageUrl: result.url,
              type: 'Character',
              icon: '👤'
            }];
          }
        });
        toast.success(`Character sheet for ${char.handle} is ready!`, { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate character sheet", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsUploadingElement(true);
    try {
      // Upload all selected files concurrently
      const uploadedUrls = await Promise.all(
        files.map(file => uploadFile(apiKey, file, (p) => console.log(p)))
      );
      
      const name = prompt(`Enter character name for these ${files.length} photos:`, "My Character") || "New Element";
      const handle = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
      
      const newElement = {
        id: Date.now(),
        name,
        handle,
        icon: "🖼️",
        imageUrl: uploadedUrls[0], // primary
        imageUrls: uploadedUrls // full set for multi-angle/identity lock
      };
      
      setElements(prev => [...prev, newElement]);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload reference images.");
    } finally {
      setIsUploadingElement(false);
      e.target.value = null; // reset input
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black relative overflow-hidden">
      
      {/* ── CENTRAL GALLERY AREA ── */}
      <div className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-2">
        {history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-4 animate-fade-in-up">
            {history.map((entry, idx) => (
              <div
                key={entry.timestamp ?? idx}
                className="relative group rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-[#a855f7]/50 transition-all duration-300 flex flex-col cursor-pointer"
                onClick={() => loadHistoryItem(entry, idx)}
              >
                <video
                  src={entry.url}
                  className="w-full aspect-[4/3] object-cover bg-black/40"
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                />
                
                {/* Overlay actions */}
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    title="Fullscreen"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullscreenUrl(entry.url);
                    }}
                    className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-[#a855f7] hover:text-black transition-all border border-white/10"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Download"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const response = await fetch(entry.url);
                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = blobUrl;
                        a.download = `cinema-shot-${entry.id || idx}.jpg`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(blobUrl);
                      } catch {
                        window.open(entry.url, "_blank");
                      }
                    }}
                    className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-[#a855f7] hover:text-black transition-all border border-white/10"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                  </button>
                </div>

                {/* Details */}
                <div className="p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2">
                  <p className="text-white/70 text-xs line-clamp-3 leading-relaxed">
                    {entry.settings?.prompt || "No prompt"}
                  </p>
                  <div className="flex items-center justify-between mt-1 flex-wrap gap-1">
                    <span className="text-[10px] font-bold text-[#a855f7] px-2 py-0.5 bg-[#a855f7]/10 rounded border border-[#a855f7]/20">
                      {entry.settings?.camera || "Standard"}
                    </span>
                    <div className="flex gap-2">
                      <span className="text-[10px] text-white/40">{entry.settings?.lens || "35mm"}</span>
                      {entry.settings?.aspect_ratio && (
                        <span className="text-[10px] text-white/40">{entry.settings.aspect_ratio}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in-up transition-all duration-700 min-h-[50vh]">
            <div className="mb-12 relative group">
              <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />
              <div className="relative w-24 h-24 md:w-32 md:h-32 bg-white/[0.02] rounded-[2rem] flex items-center justify-center border border-white/[0.05] overflow-hidden backdrop-blur-sm">
                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 relative z-10 transition-transform duration-500 group-hover:scale-110">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary opacity-80">
                    <path d="M23 7l-7 5 7 5V7z" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <div className="absolute top-4 right-4 text-[10px] text-primary/40 animate-pulse">REC</div>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4 text-center px-4">
              <span className="text-white/40 font-medium">START CREATING WITH</span><br />
              <span className="text-white uppercase tracking-wider">Cinema Studio</span>
            </h1>
            <p className="text-white/40 text-sm md:text-base font-medium tracking-wide text-center max-w-lg leading-relaxed">
              What would you shoot with infinite budget?
            </p>
          </div>
        )}
      </div>

      {/* ── BOTTOM PROMPT BAR (Higgsfield Style) ── */}
      <div className="absolute bottom-4 left-4 right-4 md:left-0 md:right-0 md:mx-auto lg:max-w-4xl z-30 transition-all duration-700 animate-fade-in-up">
        {/* Director Mode Timeline */}
        {isDirectorMode && (
          <div className="mb-2 bg-[#1c1c1c]/95 backdrop-blur-3xl border border-white/5 rounded-2xl p-2 shadow-2xl flex gap-2 overflow-x-auto custom-scrollbar">
            {directorShots.map((shot, idx) => (
              <div 
                key={shot.id} 
                onClick={() => {
                  setActiveShotId(shot.id);
                  setSettings(prev => ({ ...prev, prompt: shot.prompt }));
                  if (shot.url) setCanvasUrl(shot.url);
                }}
                className={`relative shrink-0 w-32 h-20 rounded-xl overflow-hidden cursor-pointer border-2 transition-colors ${activeShotId === shot.id ? 'border-purple-500' : 'border-white/5 hover:border-white/20'}`}
              >
                {shot.url ? (
                  <video src={shot.url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center flex-col gap-1 text-white/40">
                    {shot.status === 'processing' ? (
                      <span className="animate-pulse text-xs text-purple-400">Processing...</span>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>
                        <span className="text-[10px] font-bold uppercase">Shot {idx + 1}</span>
                      </>
                    )}
                  </div>
                )}
                {/* Delete Shot Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDirectorShots(prev => prev.filter(s => s.id !== shot.id));
                  }}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/80 rounded-full flex items-center justify-center text-white/50 hover:text-red-400 hover:bg-black"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))}
            
            {/* Add Shot Button */}
            <button 
              onClick={() => {
                const newId = Date.now();
                setDirectorShots(prev => [...prev, { id: newId, prompt: "", status: "idle", url: null }]);
                setActiveShotId(newId);
                setSettings(prev => ({ ...prev, prompt: "" }));
              }}
              className="shrink-0 w-32 h-20 rounded-xl border border-dashed border-white/20 hover:border-purple-500/50 hover:bg-purple-500/10 flex flex-col items-center justify-center text-white/40 hover:text-purple-400 transition-colors cursor-pointer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span className="text-[10px] font-bold uppercase mt-1">Add Shot</span>
            </button>
          </div>
        )}

        <div className="bg-[#1c1c1c]/95 backdrop-blur-3xl border border-white/5 rounded-2xl p-3 flex flex-col shadow-2xl relative gap-2">
          
          {/* Quick Elements Menu */}
          {showElements && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#1a1a1a]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up z-50">
              <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Select Element</span>
                <button onClick={() => setShowElements(false)} className="text-white/20 hover:text-white"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
              </div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {elements.length === 0 ? (
                  <div className="p-4 text-center text-white/20 text-xs italic">No elements found. Upload one!</div>
                ) : (
                  elements.map(el => (
                    <button 
                      key={el.id} 
                      onClick={() => { handleElementSelect(el); setShowElements(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-purple-500/50 transition-colors">
                        {el.imageUrl ? <img src={el.imageUrl} alt={el.name} className="w-full h-full object-cover" /> : <span>{el.icon}</span>}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-white truncate">@{el.handle}</span>
                        <span className="text-[9px] text-white/30 uppercase font-bold">{el.name}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <button 
                onClick={() => { setIsElementsModalOpen(true); setShowElements(false); }}
                className="w-full p-3 bg-white/[0.03] hover:bg-white/[0.08] text-[10px] font-bold text-purple-400 uppercase tracking-widest border-t border-white/5 transition-colors"
              >
                + Create / Manage Elements
              </button>
            </div>
          )}

          {/* Input Row */}
          <div className="flex items-start gap-2 w-full relative">
            <button 
              className="w-12 h-12 shrink-0 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-white/60 transition-colors border border-white/5"
              onClick={() => setIsElementsModalOpen(true)}
              title="Add Elements & Assets"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <button 
              className={`p-2.5 mt-0.5 rounded-full hover:bg-white/10 transition-colors shadow-sm ${audioFileUrl ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-white/60"}`}
              title={isUploadingAudio ? "Uploading..." : "Add Dialogue / Lip-Sync Audio"}
              onClick={() => audioInputRef.current?.click()}
              disabled={isUploadingAudio}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
            <input 
              type="file" 
              accept="audio/*" 
              className="hidden" 
              ref={audioInputRef} 
              onChange={async (e) => {
                 const file = e.target.files[0];
                 if (!file) return;
                 setIsUploadingAudio(true);
                 try {
                   const url = await uploadFile(apiKey, file);
                   setAudioFileUrl(url);
                 } catch (err) {
                   console.error("Audio upload failed", err);
                   alert("Failed to upload audio file.");
                 } finally {
                   setIsUploadingAudio(false);
                   e.target.value = null;
                 }
              }} 
            />
            
            <div className="flex-1 flex flex-col relative">
              {audioFileUrl && (
                <div className="absolute -top-7 left-1 flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] px-2 py-0.5 rounded-full z-10">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/></svg>
                  Dialogue Attached
                  <button onClick={() => setAudioFileUrl(null)} className="hover:text-red-400 ml-1"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                </div>
              )}
              <textarea
                ref={textareaRef}
              placeholder={isDirectorMode ? "Describe this shot - use @ to add characters" : "Describe your scene - use @ to add characters & locations"}
              className="w-full bg-transparent border-none text-white text-sm placeholder:text-white/30 focus:outline-none resize-none pt-2.5 leading-relaxed min-h-[44px] max-h-[150px] overflow-y-auto custom-scrollbar disabled:opacity-40"
              rows={1}
              value={settings.prompt}
              onInput={(e) => {
                handleTextareaInput(e);
                if (isDirectorMode) {
                  setDirectorShots(prev => prev.map(s => s.id === activeShotId ? { ...s, prompt: e.target.value } : s));
                }
              }}
            />
            </div>
            {/* Generate Button */}
            <button
              className="h-[44px] px-6 bg-[#93e8d3] text-black rounded-xl font-bold text-sm hover:bg-[#a6fae4] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(147,232,211,0.2)] disabled:opacity-50 min-w-[140px] tracking-wide"
              disabled={isGenerating || (isDirectorMode ? directorShots.every(s => !s.prompt.trim()) : !settings.prompt.trim())}
              onClick={handleGenerate}
            >
              {isGenerating ? (
                <span className="animate-pulse">{isDirectorMode ? "SHOOTING..." : "GENERATING..."}</span>
              ) : (
                <>{isDirectorMode ? "SHOOT SCENE 🎬" : "GENERATE ✨"}</>
              )}
            </button>
          </div>

          {/* Controls Row */}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 flex-wrap">
             {/* Model Selector Dropdown */}
             <div className="relative">
               <button 
                 onClick={() => setOpenDropdown(openDropdown === 'model' ? null : 'model')}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-white/80 transition-colors"
               >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                  {selectedModel}
               </button>
               {openDropdown === 'model' && (
                 <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                   {["Kling 3.0", "Kling 2.5", "Seedance 2.0", "Seedance Omni"].map(model => (
                     <button key={model} onClick={() => { setSelectedModel(model); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2 text-xs hover:bg-white/5 ${selectedModel === model ? 'text-purple-400' : 'text-white'}`}>
                       {model}
                     </button>
                   ))}
                 </div>
               )}
             </div>
             
             {/* Duration Dropdown */}
             <div className="relative">
               <button 
                 onClick={() => setOpenDropdown(openDropdown === 'duration' ? null : 'duration')}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-white/80 transition-colors"
               >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {duration}
               </button>
               {openDropdown === 'duration' && (
                 <div className="absolute bottom-full left-0 mb-2 w-24 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                   {["5s", "10s", "15s"].map(d => (
                     <button key={d} onClick={() => { setDuration(d); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2 text-xs hover:bg-white/5 ${duration === d ? 'text-purple-400' : 'text-white'}`}>
                       {d}
                     </button>
                   ))}
                 </div>
               )}
             </div>

             {/* Resolution Dropdown */}
             <div className="relative">
               <button 
                 onClick={() => setOpenDropdown(openDropdown === 'res' ? null : 'res')}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-white/80 transition-colors"
               >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  {resolution}
               </button>
               {openDropdown === 'res' && (
                 <div className="absolute bottom-full left-0 mb-2 w-32 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                   {["720p", "1080p", "2K", "4K"].map(res => (
                     <button key={res} onClick={() => { setResolution(res); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2 text-xs hover:bg-white/5 ${resolution === res ? 'text-purple-400' : 'text-white'}`}>
                       {res}
                     </button>
                   ))}
                 </div>
               )}
             </div>

             {/* AR Dropdown */}
             <div className="relative">
               <button 
                 onClick={() => setOpenDropdown(openDropdown === 'ar' ? null : 'ar')}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-white/80 transition-colors"
               >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="6" width="16" height="12" rx="2"/></svg>
                  {settings.aspect_ratio}
               </button>
               {openDropdown === 'ar' && (
                 <div className="absolute bottom-full left-0 mb-2 w-32 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                   {ASPECT_RATIOS.map(ar => (
                     <button key={ar} onClick={() => { setSettings(prev => ({ ...prev, aspect_ratio: ar })); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2 text-xs hover:bg-white/5 ${settings.aspect_ratio === ar ? 'text-purple-400' : 'text-white'}`}>
                       {ar}
                     </button>
                   ))}
                 </div>
               )}
             </div>

             {/* Motion Dropdown */}
             <div className="relative">
               <button 
                 onClick={() => setOpenDropdown(openDropdown === 'motion' ? null : 'motion')}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-white/80 transition-colors"
               >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 12l-4-4-4 4M12 8v8"/></svg>
                  {motion}
               </button>
               {openDropdown === 'motion' && (
                 <div className="absolute bottom-full left-0 mb-2 w-36 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                   {["Auto", "Pan Left", "Pan Right", "Tilt Up", "Tilt Down", "Zoom In", "Zoom Out", "Dolly In", "Dolly Out"].map(m => (
                     <button key={m} onClick={() => { setMotion(m); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2 text-xs hover:bg-white/5 ${motion === m ? 'text-purple-400' : 'text-white'}`}>
                       {m}
                     </button>
                   ))}
                 </div>
               )}
             </div>

             {/* Config Button (Replaces static Variants) */}
             <button 
                onClick={() => setIsOverlayOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-[#a855f7] transition-colors"
             >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Optics
             </button>

              {/* Director Mode Toggle */}
              <button 
                onClick={() => setIsDirectorMode(!isDirectorMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isDirectorMode ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 hover:bg-white/10 text-white/80'}`}
              >
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
                 Director Mode
              </button>

             {/* @ Button */}
             <button 
               onClick={() => setShowElements(!showElements)}
               className={`ml-auto flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${showElements ? 'bg-white/20 text-white' : 'bg-white/5 hover:bg-white/10 text-white/80'}`}
             >
                <span className="font-bold text-sm">@</span>
             </button>
          </div>
        </div>
      </div>

      {/* ── FULLSCREEN VIDEO MODAL ── */}
      {fullscreenUrl && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-fade-in" onClick={() => setFullscreenUrl(null)}>
          <button 
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-50"
            onClick={(e) => { e.stopPropagation(); setFullscreenUrl(null); }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <video src={fullscreenUrl} className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl border border-white/10" autoPlay loop controls playsInline onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* ── Camera Controls Overlay ── */}
      <CameraControlsOverlay
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
      />

      {/* ── AI DIRECTOR FLOATING TOGGLE ── */}
      <div className={`fixed top-1/2 right-0 -translate-y-1/2 z-40 transition-all ${isAiDirectorOpen ? 'translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'} group flex items-center`}>
         {/* Hover Tooltip / Quick Actions */}
         <div className="absolute right-full pr-4 flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto hidden md:flex items-end">
            {["Pick a camera", "Set up my look", "Write my prompt"].map(chip => (
               <button 
                 key={chip} 
                 onClick={() => {
                   setIsAiDirectorOpen(true);
                   setDirectorChat(prev => [...prev, { role: "user", content: chip }, { role: "assistant", type: "mockup" }]);
                 }}
                 className="px-4 py-2 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl text-xs font-bold text-[#93e8d3] whitespace-nowrap shadow-2xl hover:bg-white/5 transition-all"
               >
                 {chip}
               </button>
            ))}
         </div>

         <button 
           onClick={() => setIsAiDirectorOpen(!isAiDirectorOpen)}
           className="bg-[#1c1c1c]/90 backdrop-blur-md border border-white/10 border-r-0 rounded-l-xl p-3 flex flex-col items-center gap-2 shadow-2xl hover:bg-white/10 transition-all"
         >
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#93e8d3" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
           <span className="[writing-mode:vertical-lr] text-xs font-bold text-white/70 tracking-widest uppercase">AI Director</span>
         </button>
      </div>

      {/* ── AI DIRECTOR SIDEBAR ── */}
      <div className={`fixed top-[64px] right-0 bottom-0 w-[380px] bg-[#141414]/95 backdrop-blur-2xl border-l border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-50 transform transition-transform duration-500 flex flex-col ${isAiDirectorOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-5 bg-gradient-to-r from-transparent to-white/[0.02]">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#93e8d3" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            <h3 className="font-bold text-white tracking-wide">AI Director</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setDirectorChat([])} className="p-1.5 text-white/40 hover:text-white transition-colors" title="Clear Chat">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
            <button onClick={() => setIsAiDirectorOpen(false)} className="p-1.5 text-white/40 hover:text-white transition-colors" title="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto min-h-0 p-5 custom-scrollbar flex flex-col gap-6">
          {directorChat.length === 0 ? (
             <div className="text-center mt-10 flex flex-col items-center gap-4 px-6">
                <div className="w-12 h-12 rounded-full bg-[#93e8d3]/10 flex items-center justify-center mb-2">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#93e8d3" strokeWidth="1.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                </div>
                <p className="text-white/40 text-sm italic leading-relaxed">
                   I'm your AI Director. Try saying <strong className="text-white/60">"reference characters"</strong> and use <strong className="text-[#93e8d3]">@</strong> to tag them.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                   {["reference characters", "make a music video", "gritty noir style"].map(chip => (
                     <button 
                       key={chip}
                       onClick={() => {
                         setDirectorInput(chip === "reference characters" ? chip + " @" : chip);
                         if (chip === "reference characters") setShowDirectorElements(true);
                       }}
                       className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/60 hover:bg-white/10 hover:text-white transition-all"
                     >
                       {chip}
                     </button>
                   ))}
                </div>
             </div>
          ) : (
            directorChat.map((msg, idx) => (
              msg.role === "user" ? (
                <div key={idx} className="self-end bg-white/10 rounded-2xl rounded-tr-none px-4 py-2.5 text-sm text-white max-w-[85%]">
                  {msg.content}
                </div>
              ) : (
                <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-5 text-sm text-white/80 shadow-lg relative animate-fade-in">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#93e8d3]"></div>
                  
                  {msg.type === "questions" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-[#93e8d3] uppercase tracking-widest">Assistant: Clarification</span>
                        <span className="text-[10px] font-bold text-white/20">v3.5 Core</span>
                      </div>
                      <p className="text-white text-xs font-medium leading-relaxed">{msg.greeting}</p>
                      <div className="flex flex-col gap-2">
                        {msg.questions?.map((q, i) => (
                          <div key={i} className="bg-white/[0.03] p-2.5 rounded-lg border border-white/5 text-[10px] text-white/60 italic">
                             {q}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.type === "storyboard" && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-[#93e8d3] uppercase tracking-[0.2em]">Production Document</span>
                        <span className="text-[10px] font-bold text-white/20">AI Director v3.5</span>
                      </div>
                      <p className="text-white text-[11px] font-medium leading-relaxed italic opacity-80">{msg.greeting}</p>
                      
                      {/* Character Sheets */}
                      {msg.plan?.characters && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5 pb-1">Character Sheets</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {msg.plan.characters.map((char, i) => (
                              <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center text-[10px] font-bold text-purple-400">@</div>
                                    <span className="text-[11px] font-bold text-white">{char.handle}</span>
                                  </div>
                                  <button 
                                    onClick={() => handleGenerateCharacterSheet(char)}
                                    className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[8px] font-black uppercase text-[#93e8d3] transition-all border border-white/5"
                                  >
                                    Generate Sheet
                                  </button>
                                </div>
                                <p className="text-[9px] text-white/40 leading-tight">{char.visuals}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Environment & Blocking */}
                      {msg.plan?.environment && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5 pb-1">Set Design & Blocking</h4>
                          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 space-y-2">
                            <p className="text-[10px] text-white/80 leading-relaxed"><strong className="text-[#93e8d3]">World:</strong> {msg.plan.environment.description}</p>
                            <div className="flex items-start gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30 mt-0.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                              <p className="text-[9px] text-white/50 italic">{msg.plan.environment.blocking}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Technical Specs */}
                      {msg.plan?.technical && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5 pb-1">Optics & Lighting</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                              <span className="text-[8px] font-black text-white/20 uppercase block mb-1">Primary Lens</span>
                              <span className="text-[10px] font-bold text-[#93e8d3]">{msg.plan.technical.lens}</span>
                            </div>
                            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                              <span className="text-[8px] font-black text-white/20 uppercase block mb-1">Format</span>
                              <span className="text-[10px] font-bold text-white">{msg.plan.technical.format}</span>
                            </div>
                            <div className="col-span-2 bg-white/[0.03] border border-white/5 rounded-xl p-3">
                              <span className="text-[8px] font-black text-white/20 uppercase block mb-1">Lighting Strategy</span>
                              <p className="text-[9px] text-white/60">{msg.plan.technical.lighting}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Storyboard Clips */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5 pb-1">Cinematic Sequence</h4>
                        {(msg.plan?.clips || msg.clips)?.map((clip, i) => (
                          <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg relative animate-fade-in-up" style={{ animationDelay: `${i * 150}ms` }}>
                             <div className="absolute top-0 left-0 w-1 h-full bg-[#93e8d3]"></div>
                             <div className="flex items-center justify-between">
                               <span className="text-[10px] font-black text-white uppercase tracking-widest">{clip.title}</span>
                               <span className="text-[10px] font-bold text-[#93e8d3]">{clip.duration}</span>
                             </div>
                             
                             <p className="text-[11px] text-white font-medium leading-relaxed mb-1">{clip.prompt}</p>
                             
                             <div className="flex flex-wrap gap-1.5">
                               {clip.technique && (
                                 <span className="text-[9px] bg-purple-500/10 px-2 py-0.5 rounded text-purple-300 border border-purple-500/20 font-bold uppercase tracking-tighter">{clip.technique}</span>
                               )}
                               <span className="text-[9px] bg-black/40 px-2 py-0.5 rounded text-white/50 border border-white/5">{clip.camera}</span>
                               <span className="text-[9px] bg-black/40 px-2 py-0.5 rounded text-white/50 border border-white/5">{clip.focal}mm</span>
                             </div>

                             <div className="flex gap-2 mt-2 pt-3 border-t border-white/5">
                               <button 
                                 onClick={() => {
                                   setSettings(prev => ({
                                     ...prev,
                                     prompt: clip.prompt,
                                     camera: clip.camera,
                                     lens: clip.lens,
                                     focal: clip.focal,
                                     aperture: clip.aperture
                                   }));
                                   toast.success(`${clip.title} applied to Studio!`);
                                 }}
                                 className="flex-1 py-2 bg-[#93e8d3] text-black text-[10px] font-black uppercase rounded-lg hover:bg-[#a6fae4] transition-all shadow-lg shadow-[#93e8d3]/10"
                               >
                                 Apply to Studio
                               </button>
                               <button 
                                 onClick={() => {
                                    setDirectorShots(prev => {
                                       const newId = Date.now();
                                       return [...prev, { id: newId, prompt: clip.prompt, status: "idle", url: null }];
                                    });
                                    setIsDirectorMode(true);
                                    toast.success("Added to Director Timeline!");
                                 }}
                                 className="px-3 py-2 bg-white/5 text-white/40 text-[10px] font-bold rounded-lg hover:bg-white/10 hover:text-white transition-all border border-white/5"
                               >
                                  + Timeline
                               </button>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/5 bg-[#141414]/90 backdrop-blur-md">
           <form 
             className="bg-[#1c1c1c] border border-white/10 rounded-xl flex items-end p-1.5 focus-within:border-white/20 transition-colors shadow-inner"
             onSubmit={(e) => {
               e.preventDefault();
               if (!directorInput.trim()) return;
               console.log("Director Input:", directorInput);
               const plan = analyzeRequest(directorInput);
               console.log("Generated Plan:", plan);
               setDirectorChat(prev => [...prev, 
                 { role: "user", content: directorInput }, 
                 { role: "assistant", ...plan, content: directorInput }
               ]);
               setDirectorInput("");
             }}

           >
              <input 
                type="text"
                placeholder="Ask the Director - use @ to add characters..." 
                className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none px-3 py-2.5" 
                value={directorInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setDirectorInput(val);
                  if (val.endsWith('@') || val.endsWith(' @')) {
                    setShowDirectorElements(true);
                  } else if (showDirectorElements && !val.includes('@')) {
                    setShowDirectorElements(false);
                  }
                }}
              />
              
              {showDirectorElements && (
                <QuickElementsMenu 
                  items={elements.map(e => e.name)}
                  position={{ bottom: 70, right: 20 }}
                  onSelect={(name) => {
                    setDirectorInput(prev => prev.slice(0, -1) + name + " ");
                    setShowDirectorElements(false);
                  }}
                  onClose={() => setShowDirectorElements(false)}
                />
              )}
              <button type="submit" className="p-2 m-1 bg-white/10 rounded-lg text-white hover:bg-white/20 hover:text-[#93e8d3] transition-colors self-end">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
              </button>
           </form>
        </div>
      </div>

      {/* ── HIGGSFIELD ELEMENTS MODAL ── */}
      {isElementsModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsElementsModalOpen(false)}>
          <div className="w-full max-w-[1100px] h-[80vh] min-h-[600px] bg-[#141414] border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative" onClick={e => e.stopPropagation()}>
             
             {/* Header */}
             <div className="h-16 border-b border-white/5 flex items-center px-6 gap-6 shrink-0 relative">
               {["Uploads", "Image Generations", "Video Generations", "Elements", "Liked"].map(tab => (
                 <button 
                   key={tab} 
                   onClick={() => setElementsModalTab(tab)}
                   className={`h-full text-sm font-bold border-b-2 transition-colors relative top-[1px] ${elementsModalTab === tab ? 'border-white text-white' : 'border-transparent text-white/50 hover:text-white/80'}`}
                 >
                   {tab}
                 </button>
               ))}
               <button onClick={() => setIsElementsModalOpen(false)} className="absolute right-6 p-2 text-white/50 hover:text-white transition-colors bg-white/5 rounded-full hover:bg-white/10">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
               </button>
             </div>

             {/* Content Area */}
             <div className="flex-1 overflow-hidden flex flex-col p-6 bg-[#0a0a0a]">
                
                {/* Sub Header for Elements tab */}
                {elementsModalTab === "Elements" && (
                  <div className="flex items-center justify-between mb-6 shrink-0">
                    <div className="flex items-center gap-2">
                       {["All", "Pinned", "Shared", "Characters", "Locations", "Props"].map(filter => (
                         <button 
                           key={filter} 
                           onClick={() => setElementsFilter(filter)}
                           className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${elementsFilter === filter ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white/80'}`}
                         >
                           {filter === "Pinned" && <span className="mr-1.5">📌</span>}
                           {filter === "Shared" && <span className="mr-1.5">👤</span>}
                           {filter}
                         </button>
                       ))}
                    </div>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input type="text" placeholder="Search..." className="bg-white/5 border border-white/5 rounded-full pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-white/20 transition-colors w-48" />
                    </div>
                  </div>
                )}

                {/* Uploads Tab */}
                {elementsModalTab === "Uploads" && (
                  <div className="flex flex-col items-center justify-center flex-1 gap-4">
                    <label className="w-64 h-40 rounded-2xl border-2 border-dashed border-white/10 hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.05] flex flex-col items-center justify-center cursor-pointer transition-all group">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30 group-hover:text-white mb-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <span className="text-sm font-bold text-white/40 group-hover:text-white">Upload Files</span>
                      <span className="text-xs text-white/20 mt-1">Images, Videos, Audio</span>
                      <input type="file" accept="image/*,video/*,audio/*" multiple className="hidden" onChange={handleFileUpload} disabled={isUploadingElement || !apiKey} />
                    </label>
                    <p className="text-white/30 text-xs">Drag and drop or click to upload</p>
                  </div>
                )}

                {/* Generations Tabs */}
                {(elementsModalTab === "Image Generations" || elementsModalTab === "Video Generations") && (
                  <div className="flex flex-col items-center justify-center flex-1 gap-4 text-white/30">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M10 8l6 4-6 4V8z"/></svg>
                    <p className="text-sm">Your {elementsModalTab.toLowerCase()} will appear here</p>
                  </div>
                )}

                {/* Liked Tab */}
                {elementsModalTab === "Liked" && (
                  <div className="flex flex-col items-center justify-center flex-1 gap-4 text-white/30">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    <p className="text-sm">Your liked items will appear here</p>
                  </div>
                )}

                {/* Elements Grid */}
                {elementsModalTab === "Elements" && (
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-10">
                       <label className="aspect-[4/3] rounded-2xl border-2 border-dashed border-white/10 hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.05] flex flex-col items-center justify-center cursor-pointer transition-all group">
                         <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform bg-white/5">
                           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60 group-hover:text-white"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                         </div>
                         <span className="text-sm font-bold text-white/60 group-hover:text-white">{isUploadingElement ? "Uploading..." : "New Element"}</span>
                         <span className="text-xs text-white/30 mt-1">Character, prop, or location</span>
                         <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} disabled={isUploadingElement || !apiKey} />
                       </label>
                       {elements.filter(el => elementsFilter === "All" || el.type === elementsFilter).map(el => (
                         <div key={el.id} className="aspect-[4/3] rounded-2xl bg-[#141414] border border-white/5 overflow-hidden flex flex-col group cursor-pointer hover:border-white/20 transition-colors relative" onClick={() => { handleElementSelect(el); setIsElementsModalOpen(false); }}>
                           <div className="flex-1 overflow-hidden relative">
                             {el.imageUrl ? <img src={el.imageUrl} alt={el.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500" /> : <div className="w-full h-full flex items-center justify-center text-4xl bg-black/40">{el.icon}</div>}
                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                             <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button className="p-1.5 bg-black/50 hover:bg-red-500/80 rounded-lg text-white border border-white/10 backdrop-blur-md" onClick={(e) => { e.stopPropagation(); setElements(prev => prev.filter(item => item.id !== el.id)); }} title="Delete">
                                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                               </button>
                             </div>
                             <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity w-full px-4">
                               <button className="w-full py-1.5 bg-white/10 border border-white/20 rounded-full text-[10px] font-bold text-white backdrop-blur-md hover:bg-white/20">Use in shot</button>
                             </div>
                           </div>
                           <div className="h-14 bg-[#111111] border-t border-white/5 p-3 flex flex-col justify-center">
                             <span className="text-sm font-bold text-white truncate">@{el.handle || el.name.replace(/s+/g, '-').toLowerCase()}</span>
                             <span className="text-[10px] text-white/40 font-medium uppercase tracking-widest">{el.type || 'Character'}</span>
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

             </div>
          </div>
        </div>
      )}
    </div>
  );
}
