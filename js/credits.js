const tl = gsap.timeline({ delay: 0.5 });

tl.fromTo('.reveal-text', 
    { y: 30, opacity: 0 }, 
    { y: 0, opacity: 1, duration: 1.2, stagger: 0.4, ease: 'power3.out' }
)
.to('.reveal-line', 
    { width: '100%', opacity: 1, duration: 1.2, ease: 'power2.inOut' }, 
    "-=0.6" // overlap
)
.fromTo('.reveal-box', 
    { y: 50, opacity: 0, scale: 0.9 }, 
    { y: 0, opacity: 1, scale: 1, duration: 1, stagger: 0.3, ease: 'back.out(1.5)' },
    "-=0.2"
)
.fromTo('.reveal-button', 
    { y: 20, opacity: 0 }, 
    { y: 0, opacity: 1, duration: 1, ease: 'power2.out' },
    "+=0.8"
);

// gentle floating animation for the member boxes to make the page dynamic
gsap.to('.member', {
    y: "-=10",
    duration: 2.5,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
    stagger: 0.8
});
