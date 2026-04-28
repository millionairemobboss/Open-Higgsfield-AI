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

  // 2. If we have more context, generate a Cinematic Plan (Storyboard Cards)
  const genre = low.includes("noir") ? "Noir" : low.includes("sci-fi") ? "Sci-Fi" : "Cinematic";
  
  const clips = [
    {
      id: 1,
      title: "Clip 1: The Hook",
      prompt: `Establishing shot of ${input.replace(/@[a-zA-Z0-9-]+/g, '').trim()}${characterContext}, wide angle, cinematic lighting, ${genre} style.`,
      camera: genre === "Noir" ? "Classic 16mm Film" : "Modular 8K Digital",
      lens: "Premium Modern Prime",
      focal: 24,
      aperture: "f/1.4",
      duration: "10s",
      rationale: "Sets the scale and mood of the track."
    },
    {
      id: 2,
      title: "Clip 2: The Energy",
      prompt: `Medium close up following ${handles[0] || 'the subject'} through the scene, motion blur, energetic performance.`,
      camera: "Full-Frame Cine Digital",
      lens: "Compact Anamorphic",
      focal: 35,
      aperture: "f/2.8",
      duration: "15s",
      rationale: "Focuses on the core interaction and rhythm."
    },
    {
      id: 3,
      title: "Clip 3: The Climax",
      prompt: `Extreme close up on ${handles[1] || handles[0] || 'the subject'}, emotional resonance, shallow depth of field, vibrant colors.`,
      camera: "Grand Format 70mm Film",
      lens: "Clinical Sharp Prime",
      focal: 85,
      aperture: "f/1.2",
      duration: "5s",
      rationale: "Captures the peak character moment."
    }
  ];

  return {
    role: "assistant",
    type: "storyboard",
    greeting: `I've integrated ${handles.length > 0 ? handles.join(" and ") : "your ideas"} into a 3-clip Cinematic Plan. Check the clip cards below:`,
    clips: clips
  };
}

export function generateStoryboard(idea) {
  // Logic moved into analyzeRequest for better integration
  return [];
}
