import { PointerEvent, useCallback, useEffect, useRef, useState } from 'react';

import * as THREE from 'three';
import * as Tone from 'tone';

import styles from './GlassCaseButton.module.scss';

type GlassState = 'intact' | 'breaking' | 'broken';

interface Props {
  locked: boolean;
  onBreak?: () => void;
  onPress: () => void;
  label?: string;
  lockedLabel?: string;
  size?: number;
}

const SHARD_COUNT = 36;

function resolveCssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function GlassCaseButton({
  locked,
  onBreak,
  onPress,
  label = 'BREAK GLASS',
  lockedLabel = 'WAITING…',
  size = 280,
}: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    dome?: THREE.Mesh;
    button?: THREE.Mesh;
    shards: THREE.Mesh[];
    glassState: GlassState;
    pressing: boolean;
    pressT: number;
    rafId?: number;
    disposed: boolean;
  }>({
    shards: [],
    glassState: 'intact',
    pressing: false,
    pressT: 0,
    disposed: false,
  });

  const [glassState, setGlassState] = useState<GlassState>('intact');
  const [pressing, setPressing] = useState(false);

  useEffect(() => {
    if (locked) {
      setGlassState('intact');
      stateRef.current.glassState = 'intact';
      stateRef.current.shards.forEach((s) => {
        s.position.set(0, 0, 0);
        s.visible = true;
      });
      const dome = stateRef.current.dome;
      if (dome) dome.visible = true;
    }
  }, [locked]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const phosphor = resolveCssVar('--phosphor', '#c8f060');
    const card = resolveCssVar('--card', '#1c1c1c');

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.4, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(size, size);
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(2, 4, 3);
    scene.add(key);

    const rim = new THREE.PointLight(new THREE.Color(phosphor), 1.4, 12);
    rim.position.set(-1.5, 1.5, 1.8);
    scene.add(rim);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.7, 0.35, 64),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(card),
        roughness: 0.6,
        metalness: 0.2,
      }),
    );
    base.position.y = -0.95;
    scene.add(base);

    const button = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.95, 0.45, 48),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#ff2a35'),
        emissive: new THREE.Color('#5a0008'),
        emissiveIntensity: 0.45,
        roughness: 0.35,
        metalness: 0.15,
      }),
    );
    button.position.y = -0.55;
    scene.add(button);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(1.25, 40, 32, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#a8e0ff'),
        transparent: true,
        opacity: 0.28,
        roughness: 0.05,
        metalness: 0,
        transmission: 0.9,
        thickness: 0.25,
        side: THREE.DoubleSide,
      }),
    );
    dome.position.y = -0.7;
    scene.add(dome);

    const shards: THREE.Mesh[] = [];
    for (let i = 0; i < SHARD_COUNT; i++) {
      const shard = new THREE.Mesh(
        new THREE.ConeGeometry(0.08 + Math.random() * 0.06, 0.18 + Math.random() * 0.12, 4),
        new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#cdf0ff'),
          transparent: true,
          opacity: 0.8,
          roughness: 0.1,
          metalness: 0.1,
        }),
      );
      shard.visible = false;
      scene.add(shard);
      shards.push(shard);
    }

    const st = stateRef.current;
    st.renderer = renderer;
    st.scene = scene;
    st.camera = camera;
    st.dome = dome;
    st.button = button;
    st.shards = shards;

    let last = performance.now();
    const tick = () => {
      if (st.disposed) return;
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;

      base.rotation.y += dt * 0.18;
      button.rotation.y -= dt * 0.18;
      dome.rotation.y += dt * 0.12;

      if (st.glassState === 'breaking') {
        let stillFlying = false;
        st.shards.forEach((shard) => {
          if (!shard.visible) return;
          const v = (shard.userData.velocity as THREE.Vector3) || new THREE.Vector3();
          shard.position.addScaledVector(v, dt);
          v.y -= 4.5 * dt;
          shard.rotation.x += (shard.userData.spin?.x ?? 1) * dt * 4;
          shard.rotation.y += (shard.userData.spin?.y ?? 1) * dt * 4;
          const mat = shard.material as THREE.MeshPhysicalMaterial;
          mat.opacity = Math.max(0, mat.opacity - dt * 0.7);
          if (mat.opacity > 0.02 && shard.position.y > -3) stillFlying = true;
          else shard.visible = false;
        });
        if (!stillFlying) {
          st.glassState = 'broken';
          setGlassState('broken');
        }
      }

      if (st.pressing) {
        st.pressT = Math.min(1, st.pressT + dt * 6);
        button.position.y = -0.55 - 0.22 * Math.sin(st.pressT * Math.PI);
        const mat = button.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.45 + 0.9 * Math.sin(st.pressT * Math.PI);
        if (st.pressT >= 1) {
          st.pressing = false;
          st.pressT = 0;
          button.position.y = -0.55;
          mat.emissiveIntensity = 0.45;
          setPressing(false);
        }
      }

      renderer.render(scene, camera);
      st.rafId = requestAnimationFrame(tick);
    };
    st.rafId = requestAnimationFrame(tick);

    return () => {
      st.disposed = true;
      if (st.rafId) cancelAnimationFrame(st.rafId);
      renderer.dispose();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          const mat = mesh.material as THREE.Material | THREE.Material[];
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [size]);

  // Dim materials when locked.
  useEffect(() => {
    const button = stateRef.current.button;
    if (!button) return;
    const mat = button.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = locked ? 0.1 : 0.45;
    mat.color = new THREE.Color(locked ? '#7a2228' : '#ff2a35');
  }, [locked, glassState]);

  const shatter = useCallback(async () => {
    if (stateRef.current.glassState !== 'intact') return;
    if (stateRef.current.disposed) return;

    await Tone.start();

    const dome = stateRef.current.dome;
    if (dome) dome.visible = false;

    stateRef.current.shards.forEach((shard) => {
      shard.visible = true;
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.1;
      shard.position.set(Math.cos(angle) * 0.4, -0.4 + Math.random() * 1.0, Math.sin(angle) * 0.4);
      const speed = 2.0 + Math.random() * 2.2;
      shard.userData.velocity = new THREE.Vector3(
        Math.cos(angle) * speed * radius,
        2.5 + Math.random() * 1.5,
        Math.sin(angle) * speed * radius,
      );
      shard.userData.spin = { x: Math.random() * 6, y: Math.random() * 6 };
      const mat = shard.material as THREE.MeshPhysicalMaterial;
      mat.opacity = 0.85;
    });

    stateRef.current.glassState = 'breaking';
    setGlassState('breaking');

    const noise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.6, sustain: 0, release: 0.05 },
    }).toDestination();
    noise.volume.value = -10;
    noise.triggerAttackRelease('0.5');
    setTimeout(() => noise.dispose(), 800);

    onBreak?.();
  }, [onBreak]);

  const press = useCallback(async () => {
    if (stateRef.current.glassState !== 'broken') return;
    if (stateRef.current.pressing) return;

    await Tone.start();
    const thud = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 },
    }).toDestination();
    thud.volume.value = -6;
    thud.triggerAttackRelease('C2', '8n');
    setTimeout(() => thud.dispose(), 600);

    stateRef.current.pressing = true;
    setPressing(true);
    onPress();
  }, [onPress]);

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (locked) return;
      if (stateRef.current.glassState === 'intact') {
        void shatter();
      } else if (stateRef.current.glassState === 'broken') {
        void press();
      }
    },
    [locked, shatter, press],
  );

  const activeLabel = (() => {
    if (locked) return lockedLabel;
    if (glassState === 'intact') return label;
    if (glassState === 'breaking') return '';
    if (pressing) return 'PRESSED';
    return 'PRESS';
  })();

  return (
    <div
      className={`${styles.root} ${locked ? styles.locked : ''} ${glassState === 'broken' ? styles.armed : ''}`}
      style={{ width: size, height: size }}
      onPointerDown={handlePointerDown}
      role="button"
      tabIndex={0}
      aria-label={activeLabel}
      aria-disabled={locked}
    >
      <div ref={mountRef} className={styles.canvasMount} />
      <span className={styles.label}>{activeLabel}</span>
    </div>
  );
}

export default GlassCaseButton;
