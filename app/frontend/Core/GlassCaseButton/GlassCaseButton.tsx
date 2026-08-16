import { KeyboardEvent, PointerEvent, useCallback, useEffect, useRef, useState } from 'react';

import * as THREE from 'three';
import * as Tone from 'tone';

import styles from './GlassCaseButton.module.scss';

type GlassState = 'intact' | 'breaking' | 'broken';
type FlashKind = 'shatter' | 'press';

interface GlassShard {
  mesh: THREE.Mesh;
  material: THREE.MeshPhysicalMaterial;
  velocity: THREE.Vector3;
  spin: { x: number; y: number };
}

interface Props {
  locked: boolean;
  onBreak?: () => void;
  onPress: () => void;
  label?: string;
  lockedLabel?: string;
  size?: number;
}

const SHARD_COUNT = 36;
// The canvas renders well beyond the visual footprint so shards, the shockwave,
// and the shake can fly past the layout box. The camera is pushed back by the
// same factor, keeping the buzzer's on-screen size and framing identical.
const OVERSCAN = 2.4;
const ENTRANCE_DURATION = 1.1;
const ENTRANCE_SPIN = Math.PI * 4;
const RING_DURATION = 0.7;
const SHAKE_SHATTER = 0.4;
const SHAKE_PRESS = 0.2;
const SHAKE_AMP = 0.18;
const GLINT_PERIOD = 3.4;
const GLINT_SWEEP = 0.75;

function resolveCssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function GlassCaseButton({
  locked,
  onBreak,
  onPress,
  label = 'BREAK GLASS',
  lockedLabel = 'WAITING…',
  size = 280,
}: Props) {
  const mountRef = useRef<HTMLSpanElement | null>(null);
  const prevLockedRef = useRef(locked);
  const stateRef = useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    cameraBase?: THREE.Vector3;
    group?: THREE.Group;
    dome?: THREE.Mesh;
    button?: THREE.Mesh;
    ring?: THREE.Mesh;
    rim?: THREE.PointLight;
    glint?: THREE.PointLight;
    shards: GlassShard[];
    glassState: GlassState;
    pressing: boolean;
    pressT: number;
    entranceT: number;
    armed: boolean;
    armT: number;
    ringT: number;
    shakeT: number;
    shakeMax: number;
    clock: number;
    reduceMotion: boolean;
    rafId?: number;
    disposed: boolean;
  }>({
    shards: [],
    glassState: 'intact',
    pressing: false,
    pressT: 0,
    entranceT: 0,
    armed: !locked,
    armT: locked ? 0 : 1,
    ringT: 1,
    shakeT: 0,
    shakeMax: SHAKE_SHATTER,
    clock: 0,
    reduceMotion: false,
    disposed: false,
  });

  const [glassState, setGlassState] = useState<GlassState>('intact');
  const [pressing, setPressing] = useState(false);
  const [flash, setFlash] = useState<{ id: number; kind: FlashKind } | null>(null);

  const triggerFlash = useCallback((kind: FlashKind) => {
    if (stateRef.current.reduceMotion) return;
    setFlash({ id: performance.now(), kind });
  }, []);

  // Reset glass + reflect arm state when locked toggles; chime on arm.
  useEffect(() => {
    const st = stateRef.current;
    const was = prevLockedRef.current;
    prevLockedRef.current = locked;
    st.armed = !locked;

    if (locked) {
      setGlassState('intact');
      st.glassState = 'intact';
      st.shards.forEach((shard) => {
        shard.mesh.position.set(0, 0, 0);
        shard.mesh.visible = true;
      });
      if (st.dome) st.dome.visible = true;
      return;
    }

    // Arming (locked → unlocked): play a short "ready" chime when audio is live.
    if (was && Tone.getContext().state === 'running') {
      const chime = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 0.2, sustain: 0, release: 0.12 },
      }).toDestination();
      chime.volume.value = -16;
      chime.triggerAttackRelease('C6', '16n');
      setTimeout(() => chime.triggerAttackRelease('G6', '16n'), 120);
      setTimeout(() => chime.dispose(), 700);
    }
  }, [locked]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const phosphor = resolveCssVar('--phosphor', '#c8f060');
    const card = resolveCssVar('--card', '#1c1c1c');

    const rimPhosphor = new THREE.Color(phosphor);
    const rimRed = new THREE.Color('#ff2a35');
    const btnLocked = new THREE.Color('#7a2228');
    const btnArmed = new THREE.Color('#ff2a35');

    const scene = new THREE.Scene();
    scene.background = null;

    const renderSize = Math.round(size * OVERSCAN);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.4 * OVERSCAN, 5 * OVERSCAN);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(renderSize, renderSize);
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(2, 4, 3);
    scene.add(key);

    const rim = new THREE.PointLight(rimPhosphor.clone(), 1.4, 12);
    rim.position.set(-1.5, 1.5, 1.8);
    scene.add(rim);

    // Sweeps across the dome for an anticipatory glint while armed.
    const glint = new THREE.PointLight(0xffffff, 0, 3);
    glint.position.set(0, 0.1, 1.5);
    scene.add(glint);

    const group = new THREE.Group();
    group.scale.setScalar(0.001);
    scene.add(group);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.7, 0.35, 64),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(card),
        roughness: 0.6,
        metalness: 0.2,
      }),
    );
    base.position.y = -0.95;
    group.add(base);

    const buttonMaterial = new THREE.MeshStandardMaterial({
      color: btnLocked.clone(),
      emissive: new THREE.Color('#5a0008'),
      emissiveIntensity: 0.1,
      roughness: 0.35,
      metalness: 0.15,
    });
    const button = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.95, 0.45, 48), buttonMaterial);
    button.position.y = -0.55;
    group.add(button);

    const domeMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#a8e0ff'),
      emissive: new THREE.Color('#bfe9ff'),
      emissiveIntensity: 0,
      transparent: true,
      opacity: 0.28,
      roughness: 0.05,
      metalness: 0,
      transmission: 0.9,
      thickness: 0.25,
      side: THREE.DoubleSide,
    });
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(1.25, 40, 32, 0, Math.PI * 2, 0, Math.PI / 2),
      domeMaterial,
    );
    dome.position.y = -0.7;
    group.add(dome);

    // Shockwave ring that expands out of the button on press.
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: rimRed.clone(),
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.0, 48), ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.5;
    ring.visible = false;
    group.add(ring);

    const shards: GlassShard[] = [];
    for (let i = 0; i < SHARD_COUNT; i++) {
      const shardMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#cdf0ff'),
        transparent: true,
        opacity: 0.8,
        roughness: 0.1,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.08 + Math.random() * 0.06, 0.18 + Math.random() * 0.12, 4),
        shardMaterial,
      );
      mesh.visible = false;
      group.add(mesh);
      shards.push({
        mesh,
        material: shardMaterial,
        velocity: new THREE.Vector3(),
        spin: { x: 1, y: 1 },
      });
    }

    const st = stateRef.current;
    st.renderer = renderer;
    st.scene = scene;
    st.camera = camera;
    st.cameraBase = camera.position.clone();
    st.group = group;
    st.dome = dome;
    st.button = button;
    st.ring = ring;
    st.rim = rim;
    st.glint = glint;
    st.shards = shards;
    st.entranceT = 0;
    st.reduceMotion = reducedMotion();

    if (st.reduceMotion) {
      st.entranceT = 1;
      group.scale.setScalar(1);
    }

    let last = performance.now();
    const tick = () => {
      if (st.disposed) return;
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      st.clock += dt;

      if (st.entranceT < 1) {
        st.entranceT = Math.min(1, st.entranceT + dt / ENTRANCE_DURATION);
        const t = st.entranceT;
        const easeOutBack = 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
        const easeOutCubic = 1 - Math.pow(1 - t, 3);
        group.scale.setScalar(Math.max(0.001, easeOutBack));
        group.rotation.y = (1 - easeOutCubic) * ENTRANCE_SPIN;
      } else if (group.rotation.y !== 0) {
        group.rotation.y = 0;
      }

      base.rotation.y += dt * 0.18;
      button.rotation.y -= dt * 0.18;
      dome.rotation.y += dt * 0.12;

      // Ease arm state and drive the "powered up" glow on rim, button, dome.
      st.armT += (st.armed ? 1 - st.armT : -st.armT) * Math.min(1, dt * 6);
      const breathe = 0.5 + 0.5 * Math.sin(st.clock * 3);
      rim.color.copy(rimPhosphor).lerp(rimRed, st.armT);
      rim.intensity = 1.0 + st.armT * (0.6 + 0.5 * breathe);
      domeMaterial.emissiveIntensity = st.armT * (0.08 + 0.08 * breathe);
      if (!st.pressing) {
        buttonMaterial.color.copy(btnLocked).lerp(btnArmed, st.armT);
        buttonMaterial.emissiveIntensity = 0.1 + st.armT * (0.4 + 0.2 * breathe);
      }

      // Glint sweep across the intact dome while armed.
      if (!st.reduceMotion && st.glassState === 'intact' && st.armT > 0.5) {
        const phase = st.clock % GLINT_PERIOD;
        if (phase < GLINT_SWEEP) {
          const u = phase / GLINT_SWEEP;
          glint.position.x = -1.7 + u * 3.4;
          glint.intensity = Math.sin(u * Math.PI) * 2.6;
        } else {
          glint.intensity = 0;
        }
      } else {
        glint.intensity = 0;
      }

      if (st.glassState === 'breaking') {
        let stillFlying = false;
        st.shards.forEach((shard) => {
          if (!shard.mesh.visible) return;
          const v = shard.velocity;
          shard.mesh.position.addScaledVector(v, dt);
          v.y -= 4.5 * dt;
          // Bounce off the base platform before settling.
          if (shard.mesh.position.y < -0.7 && v.y < 0) {
            shard.mesh.position.y = -0.7;
            v.y = -v.y * 0.45;
            v.x *= 0.8;
            v.z *= 0.8;
          }
          shard.mesh.rotation.x += shard.spin.x * dt * 4;
          shard.mesh.rotation.y += shard.spin.y * dt * 4;
          shard.material.opacity = Math.max(0, shard.material.opacity - dt * 0.7);
          if (shard.material.opacity > 0.02 && shard.mesh.position.y > -3) stillFlying = true;
          else shard.mesh.visible = false;
        });
        if (!stillFlying) {
          st.glassState = 'broken';
          setGlassState('broken');
        }
      }

      if (st.pressing) {
        st.pressT = Math.min(1, st.pressT + dt * 6);
        button.position.y = -0.55 - 0.32 * Math.sin(st.pressT * Math.PI);
        buttonMaterial.emissiveIntensity = 0.45 + 0.9 * Math.sin(st.pressT * Math.PI);
        if (st.pressT >= 1) {
          st.pressing = false;
          st.pressT = 0;
          button.position.y = -0.55;
          setPressing(false);
        }
      }

      // Expanding shockwave ring.
      if (!st.reduceMotion && st.ringT < 1) {
        st.ringT = Math.min(1, st.ringT + dt / RING_DURATION);
        const e = 1 - Math.pow(1 - st.ringT, 3);
        ring.visible = true;
        ring.scale.setScalar(0.3 + e * 3.2);
        ringMaterial.opacity = (1 - st.ringT) * 0.9;
      } else if (ring.visible) {
        ring.visible = false;
      }

      // Impact camera shake.
      const cameraBase = st.cameraBase!;
      if (!st.reduceMotion && st.shakeT > 0) {
        st.shakeT = Math.max(0, st.shakeT - dt);
        const amp = SHAKE_AMP * (st.shakeT / st.shakeMax);
        camera.position.set(
          cameraBase.x + (Math.random() - 0.5) * amp,
          cameraBase.y + (Math.random() - 0.5) * amp,
          cameraBase.z,
        );
        camera.lookAt(0, 0, 0);
      } else if (!camera.position.equals(cameraBase)) {
        camera.position.copy(cameraBase);
        camera.lookAt(0, 0, 0);
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
        if (!(obj instanceof THREE.Mesh)) return;
        obj.geometry.dispose();
        const mat = obj.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      });
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [size]);

  const shatter = useCallback(async () => {
    if (stateRef.current.glassState !== 'intact') return;
    if (stateRef.current.disposed) return;

    await Tone.start();

    const st = stateRef.current;
    if (st.dome) st.dome.visible = false;

    st.shards.forEach((shard) => {
      shard.mesh.visible = true;
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.1;
      shard.mesh.position.set(
        Math.cos(angle) * 0.4,
        -0.4 + Math.random() * 1.0,
        Math.sin(angle) * 0.4,
      );
      const speed = 2.0 + Math.random() * 2.2;
      shard.velocity.set(
        Math.cos(angle) * speed * radius,
        2.5 + Math.random() * 1.5,
        Math.sin(angle) * speed * radius,
      );
      shard.spin = { x: Math.random() * 6, y: Math.random() * 6 };
      shard.material.opacity = 0.85;
    });

    st.glassState = 'breaking';
    st.shakeT = SHAKE_SHATTER;
    st.shakeMax = SHAKE_SHATTER;
    setGlassState('breaking');
    triggerFlash('shatter');

    const noise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.6, sustain: 0, release: 0.05 },
    }).toDestination();
    noise.volume.value = -10;
    noise.triggerAttackRelease('0.5');
    setTimeout(() => noise.dispose(), 800);

    onBreak?.();
  }, [onBreak, triggerFlash]);

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

    // Metallic clack layered over the thud for a hard mechanical hit.
    const clack = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.15, release: 0.05 },
      harmonicity: 5.1,
      resonance: 4000,
    }).toDestination();
    clack.volume.value = -22;
    clack.triggerAttackRelease('C5', '32n');
    setTimeout(() => clack.dispose(), 400);

    const st = stateRef.current;
    st.pressing = true;
    st.ringT = 0;
    st.shakeT = SHAKE_PRESS;
    st.shakeMax = SHAKE_PRESS;
    setPressing(true);
    triggerFlash('press');
    onPress();
  }, [onPress, triggerFlash]);

  const activate = useCallback(() => {
    if (locked) return;
    if (stateRef.current.glassState === 'intact') {
      void shatter();
    } else if (stateRef.current.glassState === 'broken') {
      void press();
    }
  }, [locked, shatter, press]);

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      activate();
    },
    [activate],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      activate();
    },
    [activate],
  );

  const activeLabel = (() => {
    if (locked) return lockedLabel;
    if (glassState === 'intact') return label;
    if (glassState === 'breaking') return '';
    if (pressing) return 'PRESSED';
    return 'PRESS';
  })();

  return (
    <button
      type="button"
      className={`${styles.root} ${locked ? styles.locked : ''}`}
      style={{
        width: size,
        height: size,
        margin: 0,
        padding: 0,
        border: 'none',
        background: 'none',
      }}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      aria-label={activeLabel}
      aria-disabled={locked}
    >
      <span ref={mountRef} className={styles.canvasMount} />
      {flash && (
        <span
          key={flash.id}
          className={`${styles.flash} ${flash.kind === 'press' ? styles.flashPress : styles.flashShatter}`}
          onAnimationEnd={() => setFlash(null)}
        />
      )}
    </button>
  );
}

export default GlassCaseButton;
