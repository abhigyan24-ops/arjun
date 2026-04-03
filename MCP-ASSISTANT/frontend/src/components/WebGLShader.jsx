import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const vertexShader = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `
  precision highp float;
  uniform vec2 resolution;
  uniform float time;
  uniform float xScale;
  uniform float yScale;
  uniform float distortion;

  void main() {
    vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
    
    float d = length(p) * distortion;
    
    float rx = p.x * (1.0 + d);
    float gx = p.x;
    float bx = p.x * (1.0 - d);

    float r = 0.05 / abs(p.y + sin((rx - time) * xScale) * yScale);
    float g = 0.05 / abs(p.y + sin((gx - time) * xScale) * yScale);
    float b = 0.05 / abs(p.y + sin((bx - time) * xScale) * yScale);
    
    gl_FragColor = vec4(r, g, b, 1.0);
  }
`;

export default function WebGLShader() {
  const mountRef = useRef(null);

  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    const geometry = new THREE.PlaneGeometry(2, 2);
    
    const uniforms = {
      resolution: { value: new THREE.Vector2(w, h) },
      time: { value: 0.0 },
      xScale: { value: 1.2 },
      yScale: { value: 0.6 },
      distortion: { value: 0.06 }
    };

    const material = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let animationFrameId;
    const startTime = Date.now();

    const render = () => {
      uniforms.time.value += 0.05;
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      const resizeW = window.innerWidth;
      const resizeH = window.innerHeight;
      renderer.setSize(resizeW, resizeH);
      uniforms.resolution.value.set(resizeW, resizeH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
        background: '#000'
      }} 
    />
  );
}
