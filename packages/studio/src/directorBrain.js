export function analyzeRequest(input, history = []) {
  const low = input.toLowerCase();
  
  // Extract @ handles
  const handles = input.match(/@[a-zA-Z0-9-]+/g) || [];
  const characterContext = handles.length > 0 ? ` featuring ${handles.join(", ")}` : "";

  // 1. Detect if this is the start of a project
  const isBroadStart = (low.includes("music video") || low.includes("movie") || low.includes("scene") || low.includes("commercial")) && history.length < 2;

  if (isBroadStart) {
    return {
      role: "assistant",
      type: "questions",
      greeting: "I'd love to help you direct this. To get the best results, tell me a bit more:",
      questions: [
        "What is the genre and mood? (e.g., Gritty Noir, Bright Pop, Cinematic Sci-Fi)",
        "What is the tempo? (e.g., Fast cuts, Slow long takes)",
        "I see you tagged some characters—should they be the focus of the opening shot?"
      ]
    };
  }

  // 2. Generate a Professional Director Plan (Production Document)
  const isEpic = low.includes("clash") || low.includes("battle") || low.includes("epic") || low.includes("war") || low.includes("vibrant");
  const isDark = low.includes("noir") || low.includes("dark") || low.includes("gritty") || low.includes("night");
  
  const genre = isDark ? "Noir" : isEpic ? "Epic Fantasy" : "Cinematic";
  
  // Derive Technical Language
  const isAnamorphic = isEpic || low.includes("cinema") || low.includes("movie") || low.includes("wide");
  const lensType = isAnamorphic ? "Classic Anamorphic" : "Premium Modern Prime";
  
  let lightingMood = "Cinematic naturalism with volumetric lighting";
  if (isDark) lightingMood = "High-contrast Chiaroscuro with deep shadows and rim lighting";
  if (isEpic) lightingMood = "Dynamic high-key lighting with atmospheric haze and lens flares";

  const characters = handles.map(h => {
    const handleClean = h.replace('@', '');
    let visuals = `Consistent identity across shots, high-fidelity detail.`;
    
    // Enrich based on common character archetypes
    if (handleClean.toLowerCase().includes('zeus')) visuals = "Powerful deity with a white lightning beard, wearing ancient silver robes with electrical arcs.";
    if (handleClean.toLowerCase().includes('athena')) visuals = "Wise warrior goddess with golden armor, an owl-crest helmet, and a piercing gaze.";
    if (handleClean.toLowerCase().includes('valkyrie')) visuals = "Ethereal winged warrior in chrome-plated armor, wielding a spear of pure light.";
    if (handleClean.toLowerCase().includes('hacker')) visuals = "Cyberpunk specialist with glowing data-ports on temples, oversized tech-jacket, and holographic HUD eyewear.";
    if (handleClean.toLowerCase().includes('samurai')) visuals = "Sleek carbon-fiber samurai armor with neon-red accents and a katana that glows blue.";

    return {
      handle: h,
      role: "Lead",
      visuals: visuals
    };
  });

  const environment = {
    description: `Dynamic setting based on "${input.replace(/@[a-zA-Z0-9-]+/g, '').trim()}"`,
    blocking: "Characters positioned for maximum depth. Foreground elements used for framing."
  };

  const technical = {
    lens: lensType,
    lighting: lightingMood,
    camera: "Modular 8K Digital",
    format: isAnamorphic ? "2.39:1 (Anamorphic)" : "16:9 (Standard)"
  };

  const clips = [
    {
      id: 1,
      title: "Shot 1: The Hook",
      prompt: `Establishing wide shot, ${input.replace(/@[a-zA-Z0-9-]+/g, '').trim()}${characterContext}, cinematic lighting, ${genre} style.`,
      camera: "Modular 8K Digital",
      lens: lensType,
      focal: 24,
      aperture: "f/1.4",
      duration: "5s",
      technique: "Crane down wide shot",
      rationale: "Sets the scale and establishes the world."
    },
    {
      id: 2,
      title: "Shot 2: The Energy",
      prompt: `Medium close up tracking ${handles[0] || 'the subject'}, motion blur, energetic performance, intense focus.`,
      camera: "Full-Frame Cine Digital",
      lens: "Compact Anamorphic",
      focal: 50,
      aperture: "f/2.8",
      duration: "5s",
      technique: "Dolly in following subject",
      rationale: "Focuses on the core interaction and character presence."
    },
    {
      id: 3,
      title: "Shot 3: The Climax",
      prompt: `Extreme close up, emotional resonance, shallow depth of field, vibrant colors, rack focus from background to ${handles[1] || handles[0] || 'the subject'}.`,
      camera: "Grand Format 70mm Film",
      lens: "Clinical Sharp Prime",
      focal: 85,
      aperture: "f/1.2",
      duration: "5s",
      technique: "Whip pan to close-up",
      rationale: "Captures the peak character moment with high impact."
    }
  ];

  return {
    role: "assistant",
    type: "storyboard", // keeping as storyboard but enriching the payload
    greeting: `Production Plan ready for "${input}". I've outlined the character sheets, floor plans, and a 3-shot cinematic sequence.`,
    plan: {
      characters,
      environment,
      technical,
      clips
    }
  };
}

export function generateStoryboard(idea) {
  return [];
}

