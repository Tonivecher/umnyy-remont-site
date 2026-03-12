import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import {
  LinearFilter,
  MathUtils,
  SRGBColorSpace,
  ShaderMaterial,
  Texture,
  TextureLoader,
  Vector2,
} from 'three';

type DistortionCanvasProps = {
  src: string;
  alt: string;
  hoverTargetRef: React.RefObject<HTMLDivElement | null>;
};

type DistortionUniforms = {
  uTexture: { value: Texture };
  uHover: { value: number };
  uMouse: { value: Vector2 };
  uTime: { value: number };
};

const vertexShader = `
  varying vec2 vUv;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uTime;

  void main() {
    vUv = uv;

    vec3 newPosition = position;
    float distanceToCursor = distance(uv, uMouse);
    float influence = smoothstep(0.55, 0.0, distanceToCursor);

    newPosition.z += influence * 0.12 * uHover;
    newPosition.x += (uMouse.x - 0.5) * influence * 0.1 * uHover;
    newPosition.y += (uMouse.y - 0.5) * influence * 0.08 * uHover;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uTime;

  void main() {
    vec2 uv = vUv;
    vec2 cursor = uMouse;
    vec2 direction = uv - cursor;
    float distanceToCursor = distance(uv, cursor);
    float ripple = sin(distanceToCursor * 18.0 - uTime * 3.4) * 0.014 * uHover;
    vec2 distortion = normalize(direction + 0.0001) * ripple;
    vec4 color = texture2D(uTexture, uv + distortion);

    float vignette = smoothstep(1.2, 0.18, distance(uv, vec2(0.5)));
    color.rgb *= 0.92 + vignette * 0.08;

    gl_FragColor = color;
  }
`;

const DistortionPlane: React.FC<{
  src: string;
  hoverTargetRef: React.RefObject<HTMLDivElement | null>;
}> = ({ src, hoverTargetRef }) => {
  const texture = useLoader(TextureLoader, src);
  const materialRef = useRef<ShaderMaterial | null>(null);
  const targetHover = useRef(0);
  const targetMouse = useRef(new Vector2(0.5, 0.5));

  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;

  const scale = useMemo<[number, number, number]>(() => {
    const textureImage = texture.image as { width?: number; height?: number } | undefined;
    const width = textureImage?.width ?? 1;
    const height = textureImage?.height ?? 1;
    const aspect = width / height;

    return aspect >= 1 ? [aspect, 1, 1] : [1, 1 / aspect, 1];
  }, [texture]);

  const material = useMemo(() => {
    const shaderMaterial = new ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uHover: { value: 0 },
        uMouse: { value: new Vector2(0.5, 0.5) },
        uTime: { value: 0 },
      } satisfies DistortionUniforms,
      vertexShader,
      fragmentShader,
    });

    shaderMaterial.transparent = false;
    return shaderMaterial;
  }, [texture]);

  useEffect(() => {
    materialRef.current = material;
    return () => {
      material.dispose();
    };
  }, [material]);

  useEffect(() => {
    const target = hoverTargetRef.current;
    if (!target) return;

    const handlePointerEnter = () => {
      targetHover.current = 1;
    };

    const handlePointerMove = (event: MouseEvent) => {
      const bounds = target.getBoundingClientRect();
      const relativeX = (event.clientX - bounds.left) / bounds.width;
      const relativeY = (event.clientY - bounds.top) / bounds.height;

      targetMouse.current.set(
        MathUtils.clamp(relativeX, 0, 1),
        MathUtils.clamp(1 - relativeY, 0, 1),
      );
    };

    const handlePointerLeave = () => {
      targetHover.current = 0;
      targetMouse.current.set(0.5, 0.5);
    };

    target.addEventListener('mouseenter', handlePointerEnter);
    target.addEventListener('mousemove', handlePointerMove);
    target.addEventListener('mouseleave', handlePointerLeave);

    return () => {
      target.removeEventListener('mouseenter', handlePointerEnter);
      target.removeEventListener('mousemove', handlePointerMove);
      target.removeEventListener('mouseleave', handlePointerLeave);
    };
  }, [hoverTargetRef]);

  useFrame((_, delta) => {
    const shaderMaterial = materialRef.current;
    if (!shaderMaterial) return;

    const uniforms = shaderMaterial.uniforms as DistortionUniforms;

    uniforms.uTime.value += delta;
    uniforms.uHover.value = MathUtils.lerp(uniforms.uHover.value, targetHover.current, 0.09);
    uniforms.uMouse.value.lerp(targetMouse.current, 0.12);
  });

  return (
    <mesh scale={scale}>
      <planeGeometry args={[1, 1, 32, 32]} />
      <primitive attach="material" object={material} />
    </mesh>
  );
};

export const DistortionCanvas: React.FC<DistortionCanvasProps> = ({ src, alt, hoverTargetRef }) => (
  <div aria-label={alt} role="img" className="absolute inset-0">
    <Canvas
      orthographic
      dpr={[1, 1.3]}
      camera={{ position: [0, 0, 5], zoom: 1.15 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      }}
    >
      <DistortionPlane src={src} hoverTargetRef={hoverTargetRef} />
    </Canvas>
  </div>
);
