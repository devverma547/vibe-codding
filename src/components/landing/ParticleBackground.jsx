import React, { useRef, useEffect } from 'react';

export default function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const createParticle = () => ({
      x: Math.random() * canvas.offsetWidth,
      y: canvas.offsetHeight + Math.random() * 40,
      size: Math.random() * 2.5 + 0.5,
      speedY: -(Math.random() * 0.6 + 0.15),
      speedX: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
      fadeSpeed: Math.random() * 0.002 + 0.001,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
    });

    const init = () => {
      resize();
      particles = Array.from({ length: 60 }, createParticle);
      particles.forEach(p => {
        p.y = Math.random() * canvas.offsetHeight;
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      particles.forEach((p, i) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += p.pulseSpeed;

        const pulseFactor = 0.5 + Math.sin(p.pulse) * 0.5;
        const currentOpacity = p.opacity * pulseFactor;
        const currentSize = p.size * (0.8 + pulseFactor * 0.4);

        // Glow effect
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize * 4);
        gradient.addColorStop(0, `rgba(0, 245, 160, ${currentOpacity})`);
        gradient.addColorStop(0.4, `rgba(0, 245, 160, ${currentOpacity * 0.3})`);
        gradient.addColorStop(1, `rgba(0, 245, 160, 0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 245, 160, ${currentOpacity * 1.5})`;
        ctx.fill();

        // Reset if out of bounds
        if (p.y < -20 || p.x < -20 || p.x > canvas.offsetWidth + 20) {
          particles[i] = createParticle();
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    init();
    animate();

    window.addEventListener('resize', () => {
      resize();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.7 }}
    />
  );
}
