import React, { useState, useEffect, useRef } from 'react';

export default function TypewriterPlaceholder({ 
  texts = [], 
  typingSpeed = 80, 
  deletingSpeed = 40, 
  pauseDuration = 2000 
}) {
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const timeoutRef = useRef(null);

  // Blinking cursor
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    if (texts.length === 0) return;

    const currentText = texts[textIndex];

    if (!isDeleting) {
      if (charIndex < currentText.length) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(currentText.slice(0, charIndex + 1));
          setCharIndex(prev => prev + 1);
        }, typingSpeed + Math.random() * 40);
      } else {
        timeoutRef.current = setTimeout(() => {
          setIsDeleting(true);
        }, pauseDuration);
      }
    } else {
      if (charIndex > 0) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(currentText.slice(0, charIndex - 1));
          setCharIndex(prev => prev - 1);
        }, deletingSpeed);
      } else {
        setIsDeleting(false);
        setTextIndex((prev) => (prev + 1) % texts.length);
      }
    }

    return () => clearTimeout(timeoutRef.current);
  }, [charIndex, isDeleting, textIndex, texts, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span className="text-gray-500 font-mono">
      {displayText || '\u00A0'}
      <span 
        className="text-[#00F5A0] ml-[1px]"
        style={{ opacity: showCursor ? 1 : 0 }}
      >
        |
      </span>
    </span>
  );
}
