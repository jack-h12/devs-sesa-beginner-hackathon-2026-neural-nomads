import { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';

const PLANETS = [
  { name: 'Mercury', radius: 0.28, distance: 5,   speed: 0.8,  emissive: '#222',    info: 'Closest to the Sun. No atmosphere, extreme temperatures.' },
  { name: 'Venus',   radius: 0.45, distance: 8,   speed: 0.6,  emissive: '#3a2a10', info: 'Hottest planet. Thick toxic atmosphere of CO₂.' },
  { name: 'Earth',   radius: 0.48, distance: 11,  speed: 0.5,  emissive: '#0a1a30', info: 'Our home. Only known planet with life.' },
  { name: 'Mars',    radius: 0.35, distance: 15,  speed: 0.4,  emissive: '#2a0a00', info: 'The Red Planet. Has the tallest volcano in the solar system.' },
  { name: 'Jupiter', radius: 1.3,  distance: 22,  speed: 0.22, emissive: '#2a1a00', info: 'Largest planet. The Great Red Spot is a storm larger than Earth.' },
  { name: 'Saturn',  radius: 1.1,  distance: 30,  speed: 0.18, emissive: '#2a2000', info: 'Has the most spectacular ring system in the solar system.' },
  { name: 'Uranus',  radius: 0.75, distance: 38,  speed: 0.12, emissive: '#0a2a2a', info: 'Rotates on its side. Has faint rings and 27 known moons.' },
  { name: 'Neptune', radius: 0.72, distance: 46,  speed: 0.09, emissive: '#0a0a2a', info: 'Windiest planet. Storms up to 2,100 km/h.' },
];

function makeCanvasTexture(drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  drawFn(ctx, canvas.width, canvas.height);
  return new THREE.CanvasTexture(canvas);
}

function useTextures() {
  return useMemo(() => ({
    Mercury: makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#888'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 120; i++) {
        const x = Math.random() * w, y = Math.random() * h, r = Math.random() * 8 + 2;
        ctx.fillStyle = `rgba(${60 + Math.random()*40},${60 + Math.random()*40},${60 + Math.random()*40},0.6)`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
    }),
    Venus: makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#c8903a'); grad.addColorStop(0.5, '#d4a96a'); grad.addColorStop(1, '#b87830');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 20; i++) {
        const y = Math.random() * h;
        ctx.strokeStyle = `rgba(180,130,60,0.3)`; ctx.lineWidth = Math.random() * 6 + 2;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + (Math.random() - 0.5) * 20); ctx.stroke();
      }
    }),
    Earth: makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#1a5fa8'; ctx.fillRect(0, 0, w, h);
      const continents: [number,number,number,number][] = [[0.1,0.3,0.25,0.4],[0.4,0.25,0.15,0.35],[0.55,0.3,0.2,0.35],[0.15,0.55,0.12,0.25],[0.72,0.45,0.18,0.3]];
      for (const [x,y,rw,rh] of continents) {
        ctx.fillStyle = `rgba(${50+Math.random()*30},${120+Math.random()*40},${40+Math.random()*20},0.9)`;
        ctx.beginPath(); ctx.ellipse(x*w, y*h, rw*w, rh*h, Math.random(), 0, Math.PI*2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(0,0,w,12); ctx.fillRect(0,h-12,w,12);
    }),
    Mars: makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#b03010'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 80; i++) {
        const x = Math.random()*w, y = Math.random()*h;
        ctx.fillStyle = `rgba(${150+Math.random()*60},${50+Math.random()*30},${10+Math.random()*20},0.5)`;
        ctx.beginPath(); ctx.arc(x, y, Math.random()*15+3, 0, Math.PI*2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(0,0,w,8); ctx.fillRect(0,h-8,w,8);
    }),
    Jupiter: makeCanvasTexture((ctx, w, h) => {
      const bands = ['#c88b3a','#d4a04a','#b87830','#e0c080','#a06820','#d8b060','#906020','#c8a050'];
      const bh = h / bands.length;
      bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, i*bh, w, bh+1); });
      ctx.fillStyle = 'rgba(160,80,40,0.8)';
      ctx.beginPath(); ctx.ellipse(w*0.6, h*0.55, 60, 35, 0, 0, Math.PI*2); ctx.fill();
    }),
    Saturn: makeCanvasTexture((ctx, w, h) => {
      const bands = ['#e8d5a3','#d4c070','#f0e0b0','#c8b060','#e0d090'];
      const bh = h / bands.length;
      bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, i*bh, w, bh+1); });
    }),
    Uranus: makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#a0f0f0'); grad.addColorStop(0.5, '#7de8e8'); grad.addColorStop(1, '#50c8c8');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    }),
    Neptune: makeCanvasTexture((ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#3040a0'); grad.addColorStop(0.5, '#3f54ba'); grad.addColorStop(1, '#2030a0');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(80,100,200,0.6)';
      ctx.beginPath(); ctx.ellipse(w*0.4, h*0.4, 40, 25, 0.3, 0, Math.PI*2); ctx.fill();
    }),
  }), []);
}

function makeSunTexture(): THREE.CanvasTexture {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
    grad.addColorStop(0, '#fff8a0'); grad.addColorStop(0.4, '#FDB813'); grad.addColorStop(0.8, '#ff8800'); grad.addColorStop(1, '#cc4400');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      const x = Math.random()*w, y = Math.random()*h;
      ctx.fillStyle = `rgba(255,${100+Math.random()*100},0,0.3)`;
      ctx.beginPath(); ctx.arc(x, y, Math.random()*20+5, 0, Math.PI*2); ctx.fill();
    }
  });
}

function OrbitRing({ distance }: { distance: number }) {
  const points = Array.from({ length: 129 }, (_, i) => {
    const a = (i / 128) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * distance, 0, Math.sin(a) * distance);
  });
  const orbitLine = useMemo(
    () =>
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: '#4a5a8a', transparent: true, opacity: 0.5 })
      ),
    [points]
  );

  return <primitive object={orbitLine} />;
}

function SaturnRings({ radius }: { radius: number }) {
  return (
    <group rotation={[Math.PI / 2.8, 0, 0.3]}>
      <mesh>
        <ringGeometry args={[radius * 1.5, radius * 2.0, 80]} />
        <meshBasicMaterial color="#d4c080" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <ringGeometry args={[radius * 2.1, radius * 2.5, 80]} />
        <meshBasicMaterial color="#c8b070" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Planet({ name, radius, distance, speed, emissive, texture, onSelect, selected }: {
  name: string; radius: number; distance: number; speed: number; emissive: string;
  texture: THREE.Texture; onSelect: (name: string | null) => void; selected: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    angleRef.current += delta * speed * 0.08;
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(angleRef.current) * distance;
      groupRef.current.position.z = Math.sin(angleRef.current) * distance;
    }
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.3;
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial map={texture} emissive={emissive} emissiveIntensity={0.3} roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Large invisible click target */}
      <mesh onClick={(e) => { e.stopPropagation(); onSelect(selected ? null : name); }}>
        <sphereGeometry args={[Math.max(radius * 2, 1.4), 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {name === 'Saturn' && <SaturnRings radius={radius} />}
      <Html center position={[0, radius + 0.9, 0]} distanceFactor={30} occlude={false}>
        <div
          onClick={() => onSelect(selected ? null : name)}
          style={{
            color: selected ? '#fde68a' : 'rgba(200,210,255,0.85)',
            fontSize: '11px', fontWeight: selected ? 'bold' : 'normal',
            whiteSpace: 'nowrap', cursor: 'pointer',
            textShadow: '0 0 8px rgba(0,0,0,1)', userSelect: 'none',
          }}
        >
          {name}
        </div>
      </Html>
    </group>
  );
}

function Sun() {
  const ref = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => makeSunTexture(), []);
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.05; });
  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[2.5, 64, 64]} />
        <meshStandardMaterial map={tex} emissive="#FDB813" emissiveIntensity={0.8} roughness={1} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.9, 32, 32]} />
        <meshBasicMaterial color="#ff8800" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      <Html center position={[0, 3.4, 0]} distanceFactor={30}>
        <div style={{ color: '#fde68a', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', textShadow: '0 0 8px rgba(253,184,19,0.8)', userSelect: 'none', pointerEvents: 'none' }}>
          ☀ Sun
        </div>
      </Html>
    </group>
  );
}

function Spaceship({ keysRef }: { keysRef: React.RefObject<{ w: boolean; a: boolean; s: boolean; d: boolean }> }) {
  const groupRef = useRef<THREE.Group>(null);
  const posRef = useRef(new THREE.Vector3(11, 0.6, 0));
  const rotRef = useRef(0);
  const thrustRef = useRef(false);

  useFrame((_, delta) => {
    const keys = keysRef.current!;
    const rotSpeed = 1.8;
    const moveSpeed = 10;

    if (keys.a) rotRef.current += rotSpeed * delta;
    if (keys.d) rotRef.current -= rotSpeed * delta;

    thrustRef.current = keys.w || keys.s;

    if (keys.w) {
      posRef.current.x += Math.sin(rotRef.current) * moveSpeed * delta;
      posRef.current.z += Math.cos(rotRef.current) * moveSpeed * delta;
    }
    if (keys.s) {
      posRef.current.x -= Math.sin(rotRef.current) * moveSpeed * delta;
      posRef.current.z -= Math.cos(rotRef.current) * moveSpeed * delta;
    }

    if (groupRef.current) {
      groupRef.current.position.copy(posRef.current);
      groupRef.current.rotation.y = rotRef.current;
    }
  });

  return (
    <group ref={groupRef} position={[11, 0.6, 0]}>
      {/* Body */}
      <mesh>
        <cylinderGeometry args={[0.12, 0.2, 0.7, 8]} />
        <meshStandardMaterial color="#c0c8d8" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Nose cone */}
      <mesh position={[0, 0.55, 0]}>
        <coneGeometry args={[0.12, 0.45, 8]} />
        <meshStandardMaterial color="#8899bb" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Left wing */}
      <mesh position={[-0.38, -0.1, 0]} rotation={[0, 0, Math.PI / 5]}>
        <boxGeometry args={[0.45, 0.06, 0.25]} />
        <meshStandardMaterial color="#8899bb" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Right wing */}
      <mesh position={[0.38, -0.1, 0]} rotation={[0, 0, -Math.PI / 5]}>
        <boxGeometry args={[0.45, 0.06, 0.25]} />
        <meshStandardMaterial color="#8899bb" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Engine glow */}
      <mesh position={[0, -0.42, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="#44aaff" />
      </mesh>
      {/* Cockpit window */}
      <mesh position={[0, 0.28, 0.1]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color="#88ddff" />
      </mesh>
      <Html center position={[0, 1.1, 0]} distanceFactor={20} occlude={false}>
        <div style={{ color: '#7df', fontSize: '10px', whiteSpace: 'nowrap', textShadow: '0 0 6px rgba(0,0,0,1)', userSelect: 'none', pointerEvents: 'none' }}>
          🚀 Your Ship
        </div>
      </Html>
    </group>
  );
}

export default function SolarSystemView() {
  const [selected, setSelected] = useState<string | null>(null);
  const textures = useTextures();
  const keysRef = useRef({ w: false, a: false, s: false, d: false });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W') keysRef.current.w = true;
      if (e.key === 'a' || e.key === 'A') keysRef.current.a = true;
      if (e.key === 's' || e.key === 'S') keysRef.current.s = true;
      if (e.key === 'd' || e.key === 'D') keysRef.current.d = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W') keysRef.current.w = false;
      if (e.key === 'a' || e.key === 'A') keysRef.current.a = false;
      if (e.key === 's' || e.key === 'S') keysRef.current.s = false;
      if (e.key === 'd' || e.key === 'D') keysRef.current.d = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const selectedPlanet = PLANETS.find(p => p.name === selected);

  return (
    <div className="w-full relative" style={{ height: '100vh' }}>
      {/* Header overlay */}
      <div className="absolute top-20 left-0 right-0 z-10 text-center pointer-events-none">
        <p className="text-slate-500 text-[11px] uppercase tracking-widest mb-1">Interactive 3D</p>
        <h2 className="text-white font-bold text-2xl">
          <span className="text-gradient">Solar System</span>
        </h2>
        <p className="text-slate-500 text-xs mt-1">Drag to rotate · Scroll to zoom · Click a planet</p>
      </div>

      {/* WASD controls hint */}
      <div className="absolute bottom-6 left-6 z-10 pointer-events-none">
        <div className="bg-[#0f1628]/80 border border-white/10 rounded-xl p-3 text-xs text-slate-400">
          <div className="font-semibold text-slate-300 mb-2">🚀 Spaceship Controls</div>
          <div className="grid grid-cols-3 gap-1 text-center mb-1">
            <div />
            <div className="bg-white/10 rounded px-2 py-1">W</div>
            <div />
            <div className="bg-white/10 rounded px-2 py-1">A</div>
            <div className="bg-white/10 rounded px-2 py-1">S</div>
            <div className="bg-white/10 rounded px-2 py-1">D</div>
          </div>
          <div className="text-slate-500 text-[10px]">W/S = thrust · A/D = turn</div>
        </div>
      </div>

      {/* Planet info panel — fixed overlay, not affected by zoom */}
      {selectedPlanet && (
        <div className="absolute bottom-6 right-6 z-10 bg-[#0f1628]/92 border border-violet-500/40 rounded-2xl px-6 py-5 text-white max-w-xs"
          style={{ backdropFilter: 'blur(12px)' }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Planet</p>
              <h3 className="text-white font-bold text-xl">{selectedPlanet.name}</h3>
            </div>
            <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white text-lg ml-4">✕</button>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{selectedPlanet.info}</p>
        </div>
      )}

      <Canvas camera={{ position: [0, 55, 70], fov: 50 }} style={{ background: '#020810' }}>
        <ambientLight intensity={0.25} />
        <pointLight position={[0, 0, 0]} intensity={5} color="#ffe8a0" decay={0.5} />
        <hemisphereLight args={['#101840', '#000000', 0.3]} />

        <Stars radius={300} depth={80} count={8000} factor={5} fade />

        <Sun />

        {PLANETS.map(p => (
          <OrbitRing key={`orbit-${p.name}`} distance={p.distance} />
        ))}

        {PLANETS.map(p => (
          <Planet
            key={p.name}
            {...p}
            texture={textures[p.name as keyof typeof textures]}
            selected={selected === p.name}
            onSelect={setSelected}
          />
        ))}

        <Spaceship keysRef={keysRef} />

        <OrbitControls enablePan enableZoom enableRotate minDistance={8} maxDistance={150} zoomSpeed={0.8} rotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
