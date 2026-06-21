/**
 * NayePankhAvatarScene.tsx — Full-body Priya, situation-aware animations
 *
 * Animation triggers:
 *  - onMount   → wave (hello greeting)
 *  - idle      → femineidle only (no cycling)
 *  - speaking  → excited / cheering / nodYes (picked randomly per speech)
 *  - thinking  → femalethinking (while AI is processing)
 *  - success   → victory / clapping
 */

import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useFBX } from '@react-three/drei';
import * as THREE from 'three';
import { VRMLoaderPlugin, VRMHumanBoneName, type VRM } from '@pixiv/three-vrm';
import type { GLTF } from 'three-stdlib';
import { mixamoFbx2motion } from '../utils/mixamoVRMUtils';

// ─── Asset paths ─────────────────────────────────────────────────────────────
const VRM_PATH = '/models/maevewithclothes.vrm';

const ANIM_PATHS = {
  idle: '/animations/femineidle.fbx',
  wave: '/animations/waving.fbx',
  thinking: '/animations/femalethinking.fbx',
  nodYes: '/animations/headnodyes.fbx',
  excited: '/animations/excited.fbx',
  clapping: '/animations/clapping.fbx',
  cheering: '/animations/cheering.fbx',
  victory: '/animations/femalevictory.fbx',
  happy: '/animations/happy.fbx',
  thankful: '/animations/thankfulwomen.fbx',
} as const;

export type AnimTrigger = keyof typeof ANIM_PATHS | 'auto';

// Camera — full body framing (feet to head)
// VRM model sits at y=-0.92 so feet≈0, head≈1.6
// Pulled back far enough so full body fits in 58vh canvas at fov=62
// Shifted X to -0.35 to place Priya on the right side of the screen
const CAM_POS = new THREE.Vector3(-0.35, 0.75, 4.5);
const CAM_TGT = new THREE.Vector3(-0.35, 0.70, 0);

useGLTF.preload(VRM_PATH, undefined, undefined, (l) => { l.register(p => new VRMLoaderPlugin(p)); });
Object.values(ANIM_PATHS).forEach(p => useFBX.preload(p));

// ─── Noise helper ─────────────────────────────────────────────────────────────
function noise(t: number, seed = 0) {
  const s = seed * 127.1;
  return Math.sin(t * 1.1 + s) * 0.5 + Math.sin(t * 2.3 + s * 0.5) * 0.3 + Math.sin(t * 0.7 + s * 1.7) * 0.2;
}

// ─── Lip sync ─────────────────────────────────────────────────────────────────
class LipSyncSM {
  private jaw = 0; private t = 0; private sylDur = 0.12; private paDur = 0.06;
  private inPause = false; private target = 0;
  update(dt: number, speaking: boolean): number {
    if (!speaking) { this.jaw = THREE.MathUtils.lerp(this.jaw, 0, 0.15); return this.jaw; }
    this.t += dt;
    if (this.inPause) {
      this.target = 0;
      if (this.t > this.paDur) {
        this.inPause = false; this.t = 0;
        this.sylDur = 0.08 + Math.random() * 0.14; this.paDur = 0.04 + Math.random() * 0.08;
        this.target = 0.3 + Math.random() * 0.45;
      }
    } else if (this.t > this.sylDur) { this.inPause = true; this.t = 0; this.target = 0; }
    this.jaw = THREE.MathUtils.lerp(this.jaw, this.target, 0.28);
    return this.jaw;
  }
}

// ─── VRM expression targets per situation ─────────────────────────────────────
const EMOTION: Record<string, Record<string, number>> = {
  wave: { happy: 0.85, relaxed: 0.3 },
  idle: { relaxed: 0.25 },
  speaking: { happy: 0.9, surprised: 0.25 },
  thinking: { neutral: 0.5 },
  excited: { happy: 1.0, surprised: 0.4 },
  clapping: { happy: 0.9, surprised: 0.2 },
  cheering: { happy: 1.0, surprised: 0.35 },
  victory: { happy: 1.0 },
  nodYes: { happy: 0.6, relaxed: 0.4 },
  happy: { happy: 0.8, relaxed: 0.3 },
  thankful: { happy: 0.7, relaxed: 0.5 },
};

// ─── Lights ───────────────────────────────────────────────────────────────────
const Lights: React.FC = () => (
  <>
    <ambientLight intensity={0.75} />
    <directionalLight position={[2, 5, 3]} intensity={1.4} color={new THREE.Color(0xfff3e0)} />
    <directionalLight position={[-3, 2, -2]} intensity={0.6} color={new THREE.Color(0xb3d4ff)} />
    <pointLight position={[0, 1.8, 1.5]} intensity={0.55} color={new THREE.Color(0x22c55e)} distance={6} />
    <pointLight position={[1, 0.5, 1]} intensity={0.3} color={new THREE.Color(0xfbbf24)} distance={4} />
  </>
);

// ─── Camera ───────────────────────────────────────────────────────────────────
const CameraSetup: React.FC = () => {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.copy(CAM_POS);
    camera.lookAt(CAM_TGT);
  }, [camera]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Gentle parallax drift — keep it subtle so body stays centered
    camera.position.x = CAM_POS.x + Math.sin(t * 0.11) * 0.02;
    camera.position.y = CAM_POS.y + Math.sin(t * 0.17) * 0.01;
    camera.lookAt(CAM_TGT);
  });
  return null;
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
interface AvatarProps {
  isSpeaking: boolean;
  isThinking: boolean;
  triggerAnim: AnimTrigger;
  emotionKey: string;
  onAnimDone: () => void;
}

const Avatar: React.FC<AvatarProps> = ({ isSpeaking, isThinking, triggerAnim, emotionKey, onAnimDone }) => {
  const gltf = useGLTF(VRM_PATH, undefined, undefined, (l) => {
    l.register(p => new VRMLoaderPlugin(p));
  }) as GLTF & { userData?: { vrm?: VRM } };

  const fbxs = {
    idle: useFBX(ANIM_PATHS.idle),
    wave: useFBX(ANIM_PATHS.wave),
    thinking: useFBX(ANIM_PATHS.thinking),
    nodYes: useFBX(ANIM_PATHS.nodYes),
    excited: useFBX(ANIM_PATHS.excited),
    clapping: useFBX(ANIM_PATHS.clapping),
    cheering: useFBX(ANIM_PATHS.cheering),
    victory: useFBX(ANIM_PATHS.victory),
    happy: useFBX(ANIM_PATHS.happy),
    thankful: useFBX(ANIM_PATHS.thankful),
  };

  const vrmRef = useRef<VRM | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const clipCache = useRef<Partial<Record<AnimTrigger, THREE.AnimationClip>>>({});
  const lipSync = useRef(new LipSyncSM());
  const blinkRef = useRef({ next: 2.5 + Math.random() * 2, active: false, t: 0 });
  const prevTrigger = useRef<AnimTrigger>('auto');
  const emotionTgt = useRef<Record<string, number>>(EMOTION.idle);
  const doneSent = useRef(false);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const vrm: VRM | undefined = (gltf as any).userData?.vrm;
    if (!vrm) return;
    vrmRef.current = vrm;
    vrm.scene.rotation.y = 0;
    vrm.scene.position.set(0, -0.92, 0); // feet near y=0, head near y=1.6

    const mixer = new THREE.AnimationMixer(vrm.scene);
    mixerRef.current = mixer;
    return () => { vrmRef.current = null; mixer.stopAllAction(); mixerRef.current = null; };
  }, [gltf]);

  // ── Play animation clip ────────────────────────────────────────────────────
  const playClip = (key: AnimTrigger, loop: boolean) => {
    const vrm = vrmRef.current; const mixer = mixerRef.current;
    if (!vrm || !mixer || key === 'auto') return;
    const fbx = (fbxs as any)[key];
    if (!fbx || !fbx.animations.length) return;

    let clip = clipCache.current[key];
    if (!clip) { clip = mixamoFbx2motion(fbx, vrm, false); clipCache.current[key] = clip; }

    const newAction = mixer.clipAction(clip);
    newAction.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
    newAction.clampWhenFinished = !loop;
    newAction.reset().play();

    if (actionRef.current && actionRef.current !== newAction) {
      actionRef.current.crossFadeTo(newAction, 0.4, true);
    }
    actionRef.current = newAction;
  };

  // ── React to triggerAnim changes ──────────────────────────────────────────
  useEffect(() => {
    if (triggerAnim === prevTrigger.current) return;
    prevTrigger.current = triggerAnim;
    doneSent.current = false;

    const isLoop = triggerAnim === 'idle' || triggerAnim === 'thinking';
    playClip(triggerAnim, isLoop);
    emotionTgt.current = EMOTION[triggerAnim] ?? EMOTION.idle;

    // Fire onAnimDone after clip duration (for non-loop)
    if (!isLoop) {
      const key = triggerAnim as keyof typeof fbxs;
      const fbx = (fbxs as any)[key];
      if (fbx?.animations?.[0]) {
        const dur = fbx.animations[0].duration * 1000;
        const timer = setTimeout(() => {
          if (!doneSent.current) { doneSent.current = true; onAnimDone(); }
        }, Math.min(dur + 300, 6500));
        return () => clearTimeout(timer);
      } else {
        setTimeout(() => { if (!doneSent.current) { doneSent.current = true; onAnimDone(); } }, 3000);
      }
    }
  }, [triggerAnim]);

  // ── Thinking → emotion update ────────────────────────────────────────────
  useEffect(() => {
    emotionTgt.current = EMOTION[emotionKey] ?? EMOTION.idle;
  }, [emotionKey]);

  // ── Per-frame ─────────────────────────────────────────────────────────────
  useFrame((state, delta) => {
    mixerRef.current?.update(delta);
    const vrm = vrmRef.current;
    if (!vrm) return;
    const t = state.clock.getElapsedTime();
    const b = blinkRef.current;

    const neck = vrm.humanoid?.getRawBoneNode(VRMHumanBoneName.Neck);
    const head = vrm.humanoid?.getRawBoneNode(VRMHumanBoneName.Head);
    const spine = vrm.humanoid?.getRawBoneNode(VRMHumanBoneName.Spine);
    const chest = vrm.humanoid?.getRawBoneNode(VRMHumanBoneName.UpperChest)
      ?? vrm.humanoid?.getRawBoneNode(VRMHumanBoneName.Chest);

    // Breathing
    const br = Math.sin(t * 1.85) * 0.012 + Math.sin(t * 3.7) * 0.003;
    if (spine) spine.rotation.x = THREE.MathUtils.lerp(spine.rotation.x, br, 0.1);
    if (chest) chest.rotation.x = THREE.MathUtils.lerp(chest.rotation.x, br * 0.6, 0.1);

    // Head sway
    if (neck) {
      const sp = isSpeaking ? 0.08 : 0.04;
      neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, noise(t * 0.5, 1) * (isSpeaking ? 0.08 : 0.045), sp);
      neck.rotation.x = THREE.MathUtils.lerp(neck.rotation.x, noise(t * 0.7, 2) * 0.025 + 0.01, sp);
    }
    if (head) head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, noise(t * 0.3, 5) * 0.012, 0.04);

    // Expressions
    if (vrm.expressionManager) {
      const jaw = lipSync.current.update(delta, isSpeaking);
      vrm.expressionManager.setValue('aa', jaw);
      vrm.expressionManager.setValue('ih', jaw * 0.25);

      // Blend emotions
      for (const k of ['happy', 'relaxed', 'angry', 'sad', 'surprised', 'neutral']) {
        const want = emotionTgt.current[k] ?? 0;
        const cur = vrm.expressionManager.getValue(k) ?? 0;
        vrm.expressionManager.setValue(k, THREE.MathUtils.lerp(cur, want, 0.035));
      }

      // Blink
      b.next -= delta;
      if (b.next <= 0 && !b.active) { b.active = true; b.t = 0; b.next = 2.0 + Math.random() * 3.5; }
      if (b.active) {
        b.t += delta;
        const p = b.t / 0.12;
        const v = p < 0.5 ? THREE.MathUtils.smoothstep(p, 0, 0.5) : THREE.MathUtils.smoothstep(1 - p, 0, 0.5);
        vrm.expressionManager.setValue('blink', v);
        if (b.t >= 0.12) { b.active = false; vrm.expressionManager.setValue('blink', 0); }
      }
    }

    vrm.update(delta);
  });

  const vrm: VRM | undefined = (gltf as any).userData?.vrm;
  if (!vrm) return null;
  return <primitive object={vrm.scene} />;
};

// ─── Scene root — situation-aware state machine ───────────────────────────────
export interface NayePankhSceneProps {
  isSpeaking: boolean;
  isThinking?: boolean;
  onSuccess?: boolean;
}

// Which animation to play when speaking (picked randomly each time)
const SPEAK_ANIMS: AnimTrigger[] = ['excited', 'cheering', 'nodYes', 'clapping', 'happy'];
const SUCCESS_ANIMS: AnimTrigger[] = ['victory', 'clapping', 'cheering'];

export const NayePankhScene: React.FC<NayePankhSceneProps> = ({
  isSpeaking,
  isThinking = false,
  onSuccess = false,
}) => {
  const [trigger, setTrigger] = useState<AnimTrigger>('wave');     // start: wave
  const [emotionKey, setEmotionKey] = useState('wave');
  const prevSpeak = useRef(false);
  const prevThink = useRef(false);
  const prevSuccess = useRef(false);
  const hasGreeted = useRef(false);

  // Return to idle after any one-shot animation finishes
  const handleDone = () => {
    setTrigger('idle');
    setEmotionKey('idle');
  };

  // Initial wave greeting
  useEffect(() => {
    if (!hasGreeted.current) {
      hasGreeted.current = true;
      setTrigger('wave');
      setEmotionKey('wave');
    }
  }, []);

  // Thinking state (AI processing)
  useEffect(() => {
    if (isThinking && !prevThink.current) {
      setTrigger('thinking');
      setEmotionKey('thinking');
    } else if (!isThinking && prevThink.current && !isSpeaking) {
      // Finished thinking, not yet speaking → hold idle briefly
      setTrigger('idle');
      setEmotionKey('idle');
    }
    prevThink.current = isThinking;
  }, [isThinking, isSpeaking]);

  // Speaking state
  useEffect(() => {
    if (isSpeaking && !prevSpeak.current) {
      // Pick a random speaking animation
      const pick = SPEAK_ANIMS[Math.floor(Math.random() * SPEAK_ANIMS.length)];
      setTrigger(pick);
      setEmotionKey('speaking');
    } else if (!isSpeaking && prevSpeak.current) {
      // Just finished speaking → thankful / wave, then idle
      const post = Math.random() > 0.5 ? 'thankful' : 'nodYes';
      setTrigger(post);
      setEmotionKey(post);
    }
    prevSpeak.current = isSpeaking;
  }, [isSpeaking]);

  // Success / registration complete
  useEffect(() => {
    if (onSuccess && !prevSuccess.current) {
      const pick = SUCCESS_ANIMS[Math.floor(Math.random() * SUCCESS_ANIMS.length)];
      setTrigger(pick);
      setEmotionKey(pick);
    }
    prevSuccess.current = onSuccess;
  }, [onSuccess]);

  return (
    <>
      <CameraSetup />
      <Lights />
      <Avatar
        isSpeaking={isSpeaking}
        isThinking={isThinking}
        triggerAnim={trigger}
        emotionKey={emotionKey}
        onAnimDone={handleDone}
      />
    </>
  );
};
