import React from 'react';
import { motion } from 'framer-motion';

export default function ElegantBackground() {
  const shapes = [
    {
      width: 600, height: 140, rotate: 12,
      color: "rgba(99,102,241,0.15)", // indigo
      left: "-5%", top: "20%", right: "auto", bottom: "auto",
      delay: 0.3
    },
    {
      width: 500, height: 120, rotate: -15,
      color: "rgba(244,63,94,0.15)", // rose
      right: "0%", top: "75%", left: "auto", bottom: "auto",
      delay: 0.5
    },
    {
      width: 300, height: 80, rotate: -8,
      color: "rgba(139,92,246,0.15)", // violet
      left: "10%", bottom: "10%", right: "auto", top: "auto",
      delay: 0.4
    },
    {
      width: 200, height: 60, rotate: 20,
      color: "rgba(245,158,11,0.15)", // amber
      right: "20%", top: "15%", left: "auto", bottom: "auto",
      delay: 0.6
    },
    {
      width: 150, height: 40, rotate: -25,
      color: "rgba(6,182,212,0.15)", // cyan
      left: "25%", top: "10%", right: "auto", bottom: "auto",
      delay: 0.7
    }
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', backgroundColor: '#030303' }}>
      {/* Overlays */}
      <div 
        style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 80%)'
        }}
      />
      <div 
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, #030303 0%, transparent 20%, transparent 80%, #030303 100%)'
        }}
      />

      {/* Floating Shapes */}
      {shapes.map((shape, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: -150, rotate: shape.rotate - 15 }}
          animate={{ opacity: 1, y: 0, rotate: shape.rotate }}
          transition={{ duration: 2.4, delay: shape.delay, ease: "easeOut" }}
          style={{
            position: 'absolute',
            left: shape.left !== "auto" ? shape.left : undefined,
            right: shape.right !== "auto" ? shape.right : undefined,
            top: shape.top !== "auto" ? shape.top : undefined,
            bottom: shape.bottom !== "auto" ? shape.bottom : undefined,
          }}
        >
          <motion.div
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: shape.delay }}
            style={{
              width: shape.width,
              height: shape.height,
              borderRadius: '9999px',
              background: `linear-gradient(to right, ${shape.color}, transparent)`,
              backdropFilter: 'blur(2px)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 8px 32px 0 rgba(255,255,255,0.1)'
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}
