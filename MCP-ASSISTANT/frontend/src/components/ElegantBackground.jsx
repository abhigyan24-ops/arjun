import React from 'react';
import { motion } from 'framer-motion';

export default function ElegantBackground() {
  const shapes = [
    {
      width: 600, height: 140, rotate: 12,
      gradient: "from-indigo-500/[0.15]",
      left: "-10%", top: "20%", right: "auto", bottom: "auto",
      delay: 0.3
    },
    {
      width: 500, height: 120, rotate: -15,
      gradient: "from-rose-500/[0.15]",
      right: "0%", top: "75%", left: "auto", bottom: "auto",
      delay: 0.5
    },
    {
      width: 300, height: 80, rotate: -8,
      gradient: "from-violet-500/[0.15]",
      left: "10%", bottom: "10%", right: "auto", top: "auto",
      delay: 0.4
    },
    {
      width: 200, height: 60, rotate: 20,
      gradient: "from-amber-500/[0.15]",
      right: "20%", top: "15%", left: "auto", bottom: "auto",
      delay: 0.6
    },
    {
      width: 150, height: 40, rotate: -25,
      gradient: "from-cyan-500/[0.15]",
      left: "25%", top: "10%", right: "auto", bottom: "auto",
      delay: 0.7
    }
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', backgroundColor: '#030303' }}>
      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80" />

      {/* Floating Shapes */}
      {shapes.map((shape, i) => (
        <motion.div
          key={i}
          initial={{ y: -100, opacity: 0, rotate: shape.rotate }}
          animate={{ y: [0, 20, 0], opacity: 1, rotate: shape.rotate }}
          transition={{ 
            y: { repeat: Infinity, duration: 12, ease: "easeInOut", delay: shape.delay }, 
            opacity: { duration: 1, delay: shape.delay, ease: "easeOut" } 
          }}
          className={`absolute rounded-full bg-gradient-to-r ${shape.gradient} to-transparent backdrop-blur-[2px]`}
          style={{
            width: shape.width,
            height: shape.height,
            left: shape.left !== "auto" ? shape.left : undefined,
            right: shape.right !== "auto" ? shape.right : undefined,
            top: shape.top !== "auto" ? shape.top : undefined,
            bottom: shape.bottom !== "auto" ? shape.bottom : undefined,
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 8px 32px 0 rgba(255,255,255,0.1)'
          }}
        >
          <div 
            className="absolute inset-0 rounded-full" 
            style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 60%)' }} 
          />
        </motion.div>
      ))}
    </div>
  );
}
