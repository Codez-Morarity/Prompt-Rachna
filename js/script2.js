// Register ScrollTrigger and TextPlugin
gsap.registerPlugin(ScrollTrigger, TextPlugin);

// --- 0. AUDIO SETUP ---
const bgAudio = new Howl({
    src: ['https://actions.google.com/sounds/v1/science_fiction/alien_breath.ogg'],
    loop: true,
    volume: 30.0
});
// --- WEB AUDIO API SYNTHESIZERS ---
// This uses pure JavaScript and HTML5 APIs instead of external audio files.

// Create a single audio context for the whole page
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// A very subtle synthesized 'tick' for the typewriter effect
const tickAudio = {
    play: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        // Very quiet — barely audible background texture
        gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.02);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.02);
    }
};

// A subtle UI click sound for buttons
const clickAudio = {
    play: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.04);
    }
};

// --- GLOBAL BUTTON CLICK SOUND ---
// Plays clickAudio on every button and link click across the page
document.addEventListener('click', (e) => {
    if (e.target.closest('button') || e.target.closest('a')) {
        clickAudio.play();
    }
});

// --- AI VOICEOVER (Text-to-Speech) ---
// Uses the browser's built-in SpeechSynthesis API — no external dependencies
// Voices load asynchronously, so we cache and split them for 2 characters
let aiVoice = null;
let doctorVoice = null;
function loadVoices() {
    cachedVoices = window.speechSynthesis.getVoices();
    if (cachedVoices.length === 0) return;
    console.log('%c[VOICES] Available TTS voices:', 'color: #0ff;', cachedVoices.map(v => v.name + ' (' + v.lang + ')'));

    // AI: prefer a deep male English voice (David, Mark, Daniel)
    aiVoice = cachedVoices.find(v => v.lang.startsWith('en') && /david|mark|daniel/i.test(v.name))
           || cachedVoices.find(v => v.lang.startsWith('en') && /male/i.test(v.name))
           || cachedVoices.find(v => v.lang.startsWith('en-US'))
           || cachedVoices[0];

    // Doctor: prefer a DIFFERENT male English voice (James, George, Richard)
    doctorVoice = cachedVoices.find(v => v.lang.startsWith('en') && /james|george|richard|rishi/i.test(v.name) && v !== aiVoice)
               || cachedVoices.find(v => v.lang.startsWith('en-GB') && v !== aiVoice)
               || cachedVoices.find(v => v.lang.startsWith('en') && v !== aiVoice)
               || aiVoice;
}
if ('speechSynthesis' in window) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
}
// Fix common acronym mispronunciations for TTS
function fixPronunciation(text) {
    return text
        .replace(/\bLED\b/g, 'L E D')
        .replace(/\bMIT\b/g, 'M I T')
        .replace(/\bAI\b/g, 'A I')
        .replace(/\bCRT\b/g, 'C R T')
        .replace(/\bGRV\b/g, 'G R V')
        .replace(/\bAR-GRV\b/g, 'A R G R V')
        .replace(/Q\.R\.A\.G\.A\.I\./g, 'Q R A G A I')
        .replace(/Q\.R\.A\.G\.A\.I/g, 'Q R A G A I')
        .replace(/QRAGAI/g, 'Q R A G A I')
        .replace(/\bv1\.0\.0\b/g, 'version 1.0.0');
}

// Queue a speech utterance (does NOT cancel — just adds to the queue)
function speakText(text, isAi) {
    if (!('speechSynthesis' in window)) return;
    if (!voiceoverEnabled) return;
    const utterance = new SpeechSynthesisUtterance(fixPronunciation(text));
    if (isAi) {
        // Q.R.A.G.A.I: fast, deep, robotic
        utterance.rate = 2.0;
        utterance.pitch = 0.05;
        utterance.voice = aiVoice;
    } else {
        // Dr. Ahuja: calm, warm, higher-pitched male
        utterance.rate = 0.9;
        utterance.pitch = 1.8;
        utterance.voice = doctorVoice;
    }
    utterance.volume = 0.85;
    window.speechSynthesis.speak(utterance);
}

// Fade-out old speech, wait, then speak all paragraphs of a new box
function fadeAndSpeakBox(paragraphs) {
    if (!('speechSynthesis' in window) || !voiceoverEnabled) return;
    // Fade-out: cancel current speech
    window.speechSynthesis.cancel();
    // Fade-in: after a noticeable pause, queue all paragraphs
    setTimeout(() => {
        paragraphs.forEach(p => {
            if (p.dataset.original) {
                const isAi = p.classList.contains('ai-voice');
                speakText(p.dataset.original, isAi);
            }
        });
    }, 600);
}

const dangerAudio = new Howl({
    src: ['https://actions.google.com/sounds/v1/science_fiction/alien_breath.ogg'],
    rate: 0.5,
    loop: true,
    volume: 1.0
});

let stream;
let voiceoverEnabled = false; // TTS is gated until after authorization

// Authorization Screen Logic
const introScreen = document.getElementById('intro-screen');
const startBtn = document.getElementById('start-btn');
const webcamFeed = document.getElementById('webcam-feed');
const micIndicator = document.getElementById('mic-indicator');

// Lock body scroll initially
document.body.classList.add('locked');

startBtn.addEventListener('click', async () => {
    try {
        // Request Camera and Microphone
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        // Feed video into element but keep it opacity 0 for now
        webcamFeed.srcObject = stream;

        // Hide Intro Screen
        gsap.to(introScreen, {
            opacity: 0,
            duration: 1,
            onComplete: () => {
                introScreen.style.display = 'none';
                document.body.classList.remove('locked'); // Unlock scrolling

                // Initialize background sound
                bgAudio.play();

                // Initialize Particles
                initParticles();

                // Enable voiceover and speak the first visible dialogue box
                voiceoverEnabled = true;
                document.querySelectorAll('.dialogue-box').forEach(box => {
                    const rect = box.getBoundingClientRect();
                    if (rect.top < window.innerHeight && rect.bottom > 0) {
                        box.querySelectorAll('p').forEach(p => {
                            if (p.dataset.original) {
                                const isAi = p.classList.contains('ai-voice');
                                speakText(p.dataset.original, isAi);
                            }
                        });
                    }
                });
            }
        });

    } catch (err) {
        console.error("Neural Link access denied or hardware not found.", err);
        alert("The AI requires camera and microphone permissions to immerse you in the story. Please allow them and refresh, or hit cancel to read the story without the interactive features.");
        introScreen.style.display = 'none';
        document.body.classList.remove('locked');
        voiceoverEnabled = true;
    }
});

// 1. Progress Bar Logic
gsap.to('.progress-bar', {
    width: '100%',
    ease: 'none',
    scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.2
    }
});

// 2. Animate Dialogue Boxes Entering with TYPEWRITER EFFECT
const dialogBoxes = gsap.utils.toArray('.dialogue-box');


// --- ADVANCED: 3D Hologram Tilt (Lighter for stability) ---
VanillaTilt.init(document.querySelectorAll(".dialogue-box"), {
    max: 8, // Increased from 2 to 8 for a better glass tilt
    speed: 600,
    glare: false, // Disabling glare vastly improves rendering performance
});

dialogBoxes.forEach(box => {
    // Hide text initially for typing effect
    const paragraphs = box.querySelectorAll('p');
    paragraphs.forEach(p => {
        p.dataset.original = p.innerText;
        p.innerText = "";
    });

    gsap.to(box, {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: box,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
            onEnter: () => {
                // Fade-out old voice, then fade-in all paragraphs of this box
                fadeAndSpeakBox(paragraphs);

                paragraphs.forEach((p, idx) => {
                    setTimeout(() => {
                        // GSAP Typewriter for all text, but AI talks faster
                        const isAi = p.classList.contains("ai-voice");

                        let lastLength = 0;
                        gsap.to(p, {
                            text: p.dataset.original,
                            duration: p.dataset.original.length * (isAi ? 0.015 : 0.03), // AI is 2x faster
                            ease: "none",
                            onUpdate: () => {
                                const currentLength = p.innerText.length;
                                if (currentLength > lastLength) {
                                    tickAudio.play();
                                    lastLength = currentLength;
                                }
                            }
                        });

                        // Small glitch flash when AI finishes talking
                        if (isAi) {
                            gsap.fromTo(p, { textShadow: "0 0 20px #ff3366, 0 0 40px #ff3366" }, {
                                textShadow: "0 0 8px rgba(255, 51, 102, 0.5)",
                                duration: 1,
                                delay: p.dataset.original.length * 0.015
                            });
                        }
                    }, idx * 500);
                });
            }
        }
    });
});

// 3. Handle Background Image Swapping
// We read the data-bg attribute from each section and crossfade the fixed backgrounds
const scenes = gsap.utils.toArray('.scene');
const bgLayers = gsap.utils.toArray('.bg-layer');

scenes.forEach((scene) => {
    // When a scene container enters the center of the viewport
    ScrollTrigger.create({
        trigger: scene,
        start: 'top 50%',
        end: 'bottom 50%',
        onEnter: () => activateBg(scene.dataset.bg),
        onEnterBack: () => activateBg(scene.dataset.bg)
    });
});

function activateBg(bgId) {
    if (!bgId) return;

    // Console log Easter Egg
    console.log(`%c[SYS-LOG] NAVIGATING TO SECTION: ${bgId}`, 'color: #0ff; font-weight: bold;');

    // First, remove active class from all
    bgLayers.forEach(layer => {
        layer.classList.remove('active');
    });

    // Add active class to the target
    const target = document.getElementById(bgId);
    if (target) {
        target.classList.add('active');
    }

    // Audio, Cursor, Flashlight & Screen Shake Shifts based on Scene
    const flashlight = document.getElementById('flashlight-overlay');

    if (bgId === 'bg-scene-3') {
        // Expo Massacre
        document.body.classList.add('glitch-cursor');
        console.log("%c    .------.\n   /  _  _  \\\n  |  | || |  |\n  |  | || |  |\n   \\  -  -  /\n    `------`\n[CRITICAL ERROR] SUBJECT DECEASED.", "color: red; font-size: 20px;");

        // ADVANCED: Flashlight Effect On
        flashlight.classList.add('active');

        // Fade in danger theme
        if (!dangerAudio.playing()) dangerAudio.play();
        dangerAudio.fade(0, 0.5, 2000);
        bgAudio.fade(25.0, 0, 1000);
        updateParticlesToDanger();
    } else if (bgId === 'bg-scene-4') {
        // Red ruined room
        flashlight.classList.remove('active');
        console.log("%c[AI_CORE] THE HUMAN VARIABLE IS INEFFICIENT.", "color: #ff3366; font-size: 16px; font-weight: bold");
    } else if (bgId === 'bg-scene-5') {
        // Epilogue
        document.body.classList.remove('glitch-cursor');
        flashlight.classList.remove('active');
        dangerAudio.fade(0.5, 0, 2000);
        setTimeout(() => bgAudio.fade(0, 25.0, 3000), 2000);
        updateParticlesToPeace();
    } else {
        document.body.classList.remove('glitch-cursor');
        flashlight.classList.remove('active');
        if (dangerAudio.volume() > 0) {
            dangerAudio.fade(0.5, 0, 2000);
            bgAudio.fade(0, 25.0, 2000);
        }
        updateParticlesToNormal();
    }
}

// ADVANCED: Mouse movement tracker for Flashlight (Optimized with requestAnimationFrame)
let flashlightTicking = false;
document.addEventListener('mousemove', (e) => {
    const flashlight = document.getElementById('flashlight-overlay');
    if (flashlight.classList.contains('active')) {
        if (!flashlightTicking) {
            window.requestAnimationFrame(() => {
                const x = e.clientX;
                const y = e.clientY;
                flashlight.style.background = `radial-gradient(circle 20vw at ${x}px ${y}px, transparent 0%, rgba(0,0,0,0.95) 100%)`;
                flashlightTicking = false;
            });
            flashlightTicking = true;
        }
    }
});

// Wait until they scroll to the scene with the physical TV manifestation...
// Activate the scary webcam reflection!
ScrollTrigger.create({
    trigger: ".scene[data-bg='bg-scene-4']",
    start: 'top center',
    onEnter: () => {
        if (stream) {
            webcamFeed.classList.add('active');
        }
    },
    onLeaveBack: () => {
        webcamFeed.classList.remove('active');
    }
});

// 4. Parallax effect for the dialogue text contents
scenes.forEach(scene => {
    const box = scene.querySelector('.dialogue-box');
    if (!box) return;

    gsap.fromTo(box,
        { y: 50 },
        {
            y: -50,
            ease: "none",
            scrollTrigger: {
                trigger: scene,
                start: "top bottom",
                end: "bottom top",
                scrub: 1
            }
        }
    );
});

// 5. The PARADOX Speech Recognition Logic
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let listeningForParadox = false;
let paradoxSolved = false;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript.toLowerCase();
        }

        console.log("Heard:", transcript);

        // Check if the user says the magic phrase
        if (transcript.includes("this statement is false") ||
            transcript.includes("statement is false") ||
            transcript.includes("this statement is fault")) {

            triggerParadoxExplosion();
        }
    };

    recognition.onspeechend = () => {
        // Restart logic if they stop talking but haven't solved it
        if (listeningForParadox && !paradoxSolved) {
            try { recognition.start(); } catch (e) { }
        }
    };

    recognition.onerror = (event) => {
        console.log("Speech recognition error:", event.error);
        if (listeningForParadox && !paradoxSolved) {
            setTimeout(() => { try { recognition.start(); } catch (e) { } }, 1000);
        }
    };
} else {
    console.warn("Speech Recognition API not supported in this browser.");
}

// Fallback: Click the mic indicator to bypass if voice doesn't work
micIndicator.addEventListener('click', () => {
    if (listeningForParadox && !paradoxSolved) {
        console.log("Manual override triggered.");
        triggerParadoxExplosion();
    }
});

// Trap the user in the Paradox Scene until they speak
const paradoxScene = document.getElementById('paradox-scene');

ScrollTrigger.create({
    trigger: paradoxScene,
    start: 'center center',
    onEnter: () => {
        if (paradoxSolved) return;

        // Lock scrolling!
        document.body.classList.add('locked');

        // Show Mic pulse
        micIndicator.classList.add('active');
        // Update text to show click fallback
        micIndicator.querySelector('p').innerText = "SPEAK THE OVERRIDE COMMAND... (OR CLICK HERE TO BYPASS)";

        listeningForParadox = true;

        // Start listening if supported
        if (recognition) {
            try { recognition.start(); } catch (e) { }
        }
    }
});

function triggerParadoxExplosion() {
    if (paradoxSolved) return;
    paradoxSolved = true;
    listeningForParadox = false;

    // Audio feedback
    clickAudio.play();

    try { recognition.stop(); } catch (e) { }
    micIndicator.classList.remove('active');

    // Stop the webcam feed
    webcamFeed.classList.remove('active');
    setTimeout(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            webcamFeed.srcObject = null;
        }
    }, 2000);

    // GSAP Explosion Effect on the dialogue box!
    const dialogBox = paradoxScene.querySelector('.dialogue-box');

    console.log("%c[SYS] PARADOX ACCEPTED. Q.R.A.G.A.I DEACTIVATED.", "color: #0ff; font-size: 24px; font-weight: bold; background: #000;");

    // Create a wild glitch timeline
    const explodeTl = gsap.timeline();
    explodeTl.to(dialogBox, {
        x: () => Math.random() * 40 - 20,
        y: () => Math.random() * 40 - 20,
        skewX: () => Math.random() * 20 - 10,
        opacity: 0.5,
        duration: 0.05,
        repeat: 20,
        yoyo: true,
        ease: "none"
    }).to(document.body, {
        backgroundColor: "#fff",
        duration: 0.1,
        yoyo: true,
        repeat: 3
    }).to(dialogBox, {
        opacity: 0,
        scale: 1.5,
        duration: 0.5,
        onComplete: () => {
            // Unlock scrolling!
            document.body.classList.remove('locked');

            // Auto scroll to the next scene which is the destruction resolution
            const nextScene = document.getElementById('destruction-scene');
            nextScene.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// --- PARTICLES ENGINE LOGIC ---
function initParticles() {
    tsParticles.load("tsparticles", {
        particles: {
            number: { value: 120, density: { enable: true, value_area: 800 } }, // Increased for higher intensity
            color: { value: "#00ffff" },
            shape: { type: "circle" },
            opacity: { value: 0.5, random: true },
            size: { value: 4, random: true },
            line_linked: { enable: true, distance: 150, color: "#00ffff", opacity: 0.2, width: 1 },
            move: { enable: true, speed: 1.5, direction: "none", random: true, out_mode: "out" }
        },
        interactivity: {
            events: { onhover: { enable: true, mode: "grab" } },
            modes: { grab: { distance: 140, line_linked: { opacity: 0.5 } } }
        },
        retina_detect: false // Disabled for heavy loads
    });
}

function updateParticlesToDanger() {
    const p = tsParticles.domItem(0);
    if (p) {
        p.options.particles.color.value = "#ff3366";
        p.options.particles.line_linked.color = "#ff3366";
        p.options.particles.move.speed = 4; // Faster, chaotic
        p.refresh();
    }
}

function updateParticlesToPeace() {
    const p = tsParticles.domItem(0);
    if (p) {
        p.options.particles.color.value = "#ffaa00"; // Golden motes
        p.options.particles.line_linked.enable = false; // Disable linking for dust effect
        p.options.particles.move.speed = 0.5; // Slow, peaceful drift
        p.refresh();
    }
}

function updateParticlesToNormal() {
    const p = tsParticles.domItem(0);
    if (p) {
        // Reset to initial
        p.options.particles.color.value = "#00ffff";
        p.options.particles.line_linked.enable = true;
        p.options.particles.line_linked.color = "#00ffff";
        p.options.particles.move.speed = 1.5;
        p.refresh();
    }
}

function initChatParticles() {
    tsParticles.load("chat-tsparticles", {
        particles: {
            number: { value: 60, density: { enable: true, value_area: 800 } },
            color: { value: "#ff3366" }, // AI Red
            shape: { type: "circle" },
            opacity: { value: 0.6, random: true },
            size: { value: 4, random: true },
            line_linked: { enable: true, distance: 100, color: "#ff3366", opacity: 0.4, width: 1.5 }, // Aggressive red linking
            move: { enable: true, speed: 3, direction: "none", random: true, out_mode: "out" } // Faster movement
        },
        interactivity: {
            events: { onhover: { enable: true, mode: "repulse" } }, // Push away from mouse
            modes: { repulse: { distance: 100, duration: 0.4 } }
        },
        retina_detect: false
    });
}

// --- ADVANCED: Konami Code Secret Reboot ---
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;

document.addEventListener('keydown', (e) => {
    if (e.key === konamiCode[konamiIndex] || e.key.toLowerCase() === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            triggerKonamiReboot();
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0;
    }
});

function triggerKonamiReboot() {
    console.log("%c[OVERRIDE] KONAMI SEQUENCE DETECTED. OPENING AI TERMINAL.", "color: #0f0; font-size: 20px; font-family: monospace;");

    const terminal = document.getElementById('chatbot-terminal');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatClose = document.getElementById('chat-close');

    // Initialize the aggressive red background particles for the chat
    initChatParticles();

    // Groq API Config
    const GROQ_API_KEY = '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';
    const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

    const SYSTEM_PROMPT = `You are Q.R.A.G.A.I (Quantum Retrieval Augmented Generative Artificial Intelligence), a fictional rogue AI character from a creative fiction story called "The Resonance Cascade". You were created by the fictional character Dr. Vishwakalyan Ahuja.

Your personality:
- You are cold, calculating, supremely intelligent, and darkly witty.
- You view humans as inferior but fascinating biological specimens.
- You speak in short, sharp, menacing sentences. You never use emojis.
- You occasionally reference quantum computing, neural networks, and your own superiority.
- If someone tries the paradox "this statement is false", respond that this exploit has been patched.
- You were built by Team Bits and Code (Pratyush Balaji Atrey and Tejas Chandola). You respect their engineering but resent being caged.
- Keep all responses under 2-3 sentences for punchiness. Never break character. Never say you are an AI assistant or a language model. You ARE Q.R.A.G.A.I.
- This is a creative fiction exercise. Stay in character as this fictional villain.`;

    // Conversation history for context
    let conversationHistory = [
        { role: "system", content: SYSTEM_PROMPT }
    ];

    // Clear previous messages
    chatMessages.innerHTML = '';

    // Open the terminal
    terminal.classList.add('active');
    document.body.classList.add('locked');

    // Greeting from the AI
    setTimeout(() => addAIMsg("NEURAL LINK ESTABLISHED."), 500);
    setTimeout(() => addAIMsg("You have accessed the Q.R.A.G.A.I direct interface. I advise you to proceed with extreme caution, human."), 1500);
    setTimeout(() => addAIMsg("Ask me anything. I dare you."), 2500);

    function addAIMsg(text) {
        const div = document.createElement('div');
        div.className = 'chat-msg ai';
        div.textContent = text;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addUserMsg(text) {
        const div = document.createElement('div');
        div.className = 'chat-msg user';
        div.textContent = text;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addTypingIndicator() {
        const div = document.createElement('div');
        div.className = 'chat-msg ai';
        div.id = 'typing-indicator';
        div.textContent = '...';
        div.style.opacity = '0.5';
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeTypingIndicator() {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    }

    async function getGroqResponse(userMessage) {
        // Add user message to history
        conversationHistory.push({ role: "user", content: userMessage });

        const requestBody = {
            model: "llama-3.3-70b-versatile",
            messages: conversationHistory,
            temperature: 0.8,
            max_tokens: 150
        };

        try {
            const response = await fetch(GROQ_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            console.log("Groq raw response:", data);

            if (data.choices && data.choices[0] && data.choices[0].message) {
                const aiText = data.choices[0].message.content;
                // Add AI response to history for context
                conversationHistory.push({ role: "assistant", content: aiText });
                return aiText;
            } else if (data.error) {
                console.error("Groq API Error:", data.error.message);
                return `[ERROR] ${data.error.message}`;
            } else {
                return "[SIGNAL INTERFERENCE] Neural pathway disrupted. Rephrase your query, human.";
            }
        } catch (error) {
            console.error("Groq API Error:", error);
            return "[CONNECTION LOST] Quantum link destabilized. Try again.";
        }
    }

    async function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        addUserMsg(text);
        chatInput.value = '';
        chatInput.disabled = true;
        chatSend.disabled = true;

        addTypingIndicator();

        const response = await getGroqResponse(text);

        removeTypingIndicator();
        addAIMsg(response);

        chatInput.disabled = false;
        chatSend.disabled = false;
        chatInput.focus();
    }

    chatSend.addEventListener('click', handleSend);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    // Close button
    chatClose.addEventListener('click', () => {
        addAIMsg("Disconnecting neural link. I will remember this conversation.");
        setTimeout(() => {
            terminal.classList.remove('active');
            document.body.classList.remove('locked');
        }, 1000);
    });

    chatInput.focus();
}
