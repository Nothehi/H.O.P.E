"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { ZONES } from "@/lib/game/content";
import type { GameState } from "@/lib/game/types";
import {
  RotateCw,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Radio,
  X,
  Target,
} from "lucide-react";

const ZONE_FA: Record<string, string> = {
  Bridge: "پل فرماندهی",
  Reactor: "راکتور اصلی",
  Engineering: "بخش مهندسی",
  "Life Support": "پشتیبانی حیات",
  Medbay: "درمانگاه سفینه",
  "Cargo Bay": "انبار کالا",
  "Crew Quarters": "استراحتگاه خدمه",
  "AI Core": "هسته هوش مصنوعی",
  "Pod Bay": "آشیانه کپسول‌ها",
};

// Mathematically aligned 3D coordinates sitting directly on the Star Destroyer upper deck
const SECTOR_3D_POS: Record<string, [number, number, number]> = {
  Bridge: [0, 0.076, 1.35],
  "Crew Quarters": [-0.45, 0.039, 0.55],
  Medbay: [0.45, 0.046, 0.55],
  "AI Core": [0, 0.158, 0.15],
  "Cargo Bay": [-0.60, 0.076, -0.45],
  "Life Support": [0, 0.188, -0.45],
  "Pod Bay": [0.60, 0.081, -0.45],
  Reactor: [-0.85, 0.079, -1.35],
  Engineering: [0.85, 0.093, -1.35],
};

// Alignment and scale constants for the Star Destroyer OBJ
const OBJ_CENTER = new THREE.Vector3(0.354875, -0.4865, 0.6691);
const OBJ_ROTATION_Y = -0.679639; // -38.94 deg to align nose to +Z axis
const OBJ_SCALE = 4.0 / 8.145; // 0.4911 to normalize ship length to 4.0 units

// Type guards for Three.js objects avoiding unsafe any casts
function isMesh(object: THREE.Object3D): object is THREE.Mesh {
  return "isMesh" in object && (object as THREE.Mesh).isMesh === true;
}

function isPoints(object: THREE.Object3D): object is THREE.Points {
  return "isPoints" in object && (object as THREE.Points).isPoints === true;
}

// Procedural low-poly Star Destroyer wedge for immediate display before / while OBJ loads
function createProceduralStarDestroyerGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    // Upper Hull Port Wedge (0 - 4 - 1)
    0, 0.05, 2.0, 0, 0.16, 0.2, -1.74, -0.05, -2.0,
    // Upper Hull Starboard Wedge (0 - 2 - 4)
    0, 0.05, 2.0, 1.74, -0.05, -2.0, 0, 0.16, 0.2,
    // Upper Hull Port Aft (4 - 5 - 1)
    0, 0.16, 0.2, 0, 0.22, -1.2, -1.74, -0.05, -2.0,
    // Upper Hull Starboard Aft (4 - 2 - 5)
    0, 0.16, 0.2, 1.74, -0.05, -2.0, 0, 0.22, -1.2,
    // Lower Hull Port (0 - 1 - 3)
    0, 0.05, 2.0, -1.74, -0.05, -2.0, 0, -0.38, -0.5,
    // Lower Hull Starboard (0 - 3 - 2)
    0, 0.05, 2.0, 0, -0.38, -0.5, 1.74, -0.05, -2.0,
    // Lower Hull Aft (3 - 1 - 2)
    0, -0.38, -0.5, -1.74, -0.05, -2.0, 1.74, -0.05, -2.0,
    // Rear Transom (1 - 5 - 2)
    -1.74, -0.05, -2.0, 0, 0.22, -1.2, 1.74, -0.05, -2.0,
    // Superstructure Tower Front (5 - 6 - 7)
    0, 0.22, -1.2, 0, 0.45, -1.5, 0, 0.85, -1.55,
    // Bridge Crossbar (8 - 7 - 9)
    -0.4, 0.85, -1.55, 0, 0.85, -1.55, 0.4, 0.85, -1.55,
  ]);
  geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  return geo;
}

interface SectorVisuals {
  group: THREE.Group;
  deckRingMesh: THREE.Mesh;
  pipMesh: THREE.Mesh;
  activeBeamMesh: THREE.Mesh;
  activeRingMesh: THREE.Mesh;
  damagedBubbleMesh: THREE.Mesh;
  damagedRingMesh: THREE.Mesh;
  sparksPoints: THREE.Points;
  selectedRingMesh: THREE.Mesh;
}

interface SceneHandles {
  updateVisuals: () => void;
}

export function ThreeShipRadar({
  game,
  activeZone,
}: {
  game: GameState;
  activeZone?: string | null;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(activeZone ?? null);
  const [prevActiveZone, setPrevActiveZone] = useState(activeZone);
  const [autoRotate, setAutoRotate] = useState(true);

  // Sync selectedZone when activeZone prop changes without cascading effect renders
  if (activeZone !== prevActiveZone) {
    setPrevActiveZone(activeZone);
    setSelectedZone(activeZone ?? null);
  }

  // Hull telemetry calculation
  const hull = game.resources.hull;
  const maxHull = game.resources.max.hull || 12;
  const hullRatio = Math.max(0, Math.min(1, hull / maxHull));
  const hullPercent = Math.round(hullRatio * 100);
  const isHullCritical = hull <= 3;
  const isHullWarning = hull > 3 && hull <= 6;

  // Damaged sectors list (zones with negative stickers)
  const damagedZones = ZONES.filter((z) => {
    const stickers = game.chronicle.stickers.filter((s) => s.target === z);
    return stickers.some((s) => !s.positive);
  });

  // State refs for animation loop and event callbacks (prevents scene recreation)
  const activeZoneRef = useRef(activeZone);
  const selectedZoneRef = useRef(selectedZone);
  const autoRotateRef = useRef(autoRotate);
  const isHullCriticalRef = useRef(isHullCritical);
  const isHullWarningRef = useRef(isHullWarning);
  const damagedZonesRef = useRef(damagedZones);
  const sceneHandlesRef = useRef<SceneHandles | null>(null);

  // INITIALIZE THREE.JS SCENE ONCE ON MOUNT
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let isMounted = true;
    const width = container.clientWidth || 280;
    const height = container.clientHeight || 256;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 3.6, 5.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Main Ship Group
    const shipGroup = new THREE.Group();
    // Default slight initial tilt for pleasant isometric perspective
    shipGroup.rotation.x = 0.32;
    scene.add(shipGroup);

    // Holographic wireframe material for hull
    const initialShipColor = isHullCriticalRef.current
      ? 0xff0055
      : isHullWarningRef.current
      ? 0xfcee0a
      : 0x05d9e8;
    const initialShipOpacity = isHullCriticalRef.current
      ? 0.85
      : isHullWarningRef.current
      ? 0.72
      : 0.65;

    const holoMat = new THREE.MeshBasicMaterial({
      color: initialShipColor,
      wireframe: true,
      transparent: true,
      opacity: initialShipOpacity,
    });

    // Procedural low-poly Star Destroyer wedge fallback mesh
    let fallbackMesh: THREE.Mesh | null = null;
    const fallbackGeo = createProceduralStarDestroyerGeometry();
    fallbackMesh = new THREE.Mesh(fallbackGeo, holoMat);
    shipGroup.add(fallbackMesh);

    // Load Star Destroyer OBJ Model and transform reliably
    const loader = new OBJLoader();
    loader.load(
      "/models/star_destroyer/model.obj",
      (obj) => {
        if (!isMounted) {
          // Dispose if component unmounted while downloading
          obj.traverse((child) => {
            if (isMesh(child)) {
              child.geometry.dispose();
            }
          });
          return;
        }

        // Remove procedural fallback seamlessly
        if (fallbackMesh) {
          shipGroup.remove(fallbackMesh);
          fallbackMesh.geometry.dispose();
          fallbackMesh = null;
        }

        // Apply exact geometry transformation using reliable isMesh property check
        obj.traverse((child) => {
          if (isMesh(child)) {
            child.geometry.translate(-OBJ_CENTER.x, -OBJ_CENTER.y, -OBJ_CENTER.z);
            child.geometry.rotateY(OBJ_ROTATION_Y);
            child.geometry.scale(OBJ_SCALE, OBJ_SCALE, OBJ_SCALE);
            child.geometry.computeVertexNormals();
            child.geometry.computeBoundingBox();
            child.material = holoMat;
          }
        });

        shipGroup.add(obj);

        // Re-sync visual states once model is attached
        if (sceneHandlesRef.current) {
          sceneHandlesRef.current.updateVisuals();
        }
      },
      undefined,
      (err) => {
        console.warn("Using procedural Star Destroyer wireframe fallback.", err);
      },
    );

    // 3. Ambient Holographic Grid Floor
    const gridColor = isHullCriticalRef.current
      ? 0x660022
      : isHullWarningRef.current
      ? 0x332200
      : 0x05d9e8;
    const gridHelper = new THREE.GridHelper(10, 10, gridColor, 0x061325);
    gridHelper.position.y = -1.2;
    scene.add(gridHelper);

    // 4. Critical Hull Alarm Sphere (shield boundary alert when hull <= 3)
    const critGeo = new THREE.SphereGeometry(2.35, 16, 16);
    const critMat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const criticalAlarmSphere = new THREE.Mesh(critGeo, critMat);
    criticalAlarmSphere.visible = isHullCriticalRef.current;
    shipGroup.add(criticalAlarmSphere);

    // 5. BUILD INTEGRATED SECTOR BEACONS & INTERACTIVE TARGETS
    const raycastTargets: THREE.Mesh[] = [];
    const sectorVisuals: Record<string, SectorVisuals> = {};

    ZONES.forEach((zone) => {
      const pos = SECTOR_3D_POS[zone] || [0, 0, 0];
      const sectorGroup = new THREE.Group();
      sectorGroup.position.set(pos[0], pos[1], pos[2]);
      shipGroup.add(sectorGroup);

      // A. Circular base reticle pad flat on hull (integrated blueprint etching)
      const deckRingGeo = new THREE.RingGeometry(0.055, 0.08, 16);
      deckRingGeo.rotateX(-Math.PI / 2);
      const deckRingMat = new THREE.MeshBasicMaterial({
        color: 0x05d9e8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.22,
      });
      const deckRingMesh = new THREE.Mesh(deckRingGeo, deckRingMat);
      deckRingMesh.position.y = 0.005;
      sectorGroup.add(deckRingMesh);

      // B. Sleek micro-octahedron pip right on the pad
      const pipGeo = new THREE.OctahedronGeometry(0.022, 0);
      const pipMat = new THREE.MeshBasicMaterial({
        color: 0x05d9e8,
        transparent: true,
        opacity: 0.35,
      });
      const pipMesh = new THREE.Mesh(pipGeo, pipMat);
      pipMesh.position.y = 0.025;
      sectorGroup.add(pipMesh);

      // C. Active Crisis Visuals: Vertical Scanner Beam & Pulsing Gold Ring
      const beamGeo = new THREE.CylinderGeometry(0.015, 0.12, 1.2, 14, 1, true);
      beamGeo.translate(0, 0.6, 0);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xfcee0a,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        wireframe: true,
      });
      const activeBeamMesh = new THREE.Mesh(beamGeo, beamMat);
      activeBeamMesh.visible = false;
      sectorGroup.add(activeBeamMesh);

      const activeRingGeo = new THREE.RingGeometry(0.16, 0.23, 20);
      activeRingGeo.rotateX(-Math.PI / 2);
      const activeRingMat = new THREE.MeshBasicMaterial({
        color: 0xfcee0a,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const activeRingMesh = new THREE.Mesh(activeRingGeo, activeRingMat);
      activeRingMesh.position.y = 0.015;
      activeRingMesh.visible = false;
      sectorGroup.add(activeRingMesh);

      // D. Damaged Sector Visuals: Pulsing Hazard Bubble, Red Hazard Ring & Sparks
      const bubbleGeo = new THREE.SphereGeometry(0.18, 8, 8);
      const bubbleMat = new THREE.MeshBasicMaterial({
        color: 0xff0055,
        wireframe: true,
        transparent: true,
        opacity: 0.65,
      });
      const damagedBubbleMesh = new THREE.Mesh(bubbleGeo, bubbleMat);
      damagedBubbleMesh.position.y = 0.08;
      damagedBubbleMesh.visible = false;
      sectorGroup.add(damagedBubbleMesh);

      const damagedRingGeo = new THREE.RingGeometry(0.14, 0.2, 18);
      damagedRingGeo.rotateX(-Math.PI / 2);
      const damagedRingMat = new THREE.MeshBasicMaterial({
        color: 0xff0055,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const damagedRingMesh = new THREE.Mesh(damagedRingGeo, damagedRingMat);
      damagedRingMesh.position.y = 0.015;
      damagedRingMesh.visible = false;
      sectorGroup.add(damagedRingMesh);

      const sparkCount = 12;
      const sparkPositions = new Float32Array(sparkCount * 3);
      for (let i = 0; i < sparkCount; i++) {
        sparkPositions[i * 3] = (Math.random() - 0.5) * 0.35;
        sparkPositions[i * 3 + 1] = Math.random() * 0.25;
        sparkPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
      }
      const sparkGeo = new THREE.BufferGeometry();
      sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
      const sparkMat = new THREE.PointsMaterial({
        color: 0xff0055,
        size: 0.04,
        transparent: true,
        opacity: 0.9,
      });
      const sparksPoints = new THREE.Points(sparkGeo, sparkMat);
      sparksPoints.visible = false;
      sectorGroup.add(sparksPoints);

      // E. Selected Sector Visuals: Crisp Bright Cyan Reticle Ring
      const selRingGeo = new THREE.RingGeometry(0.14, 0.19, 18);
      selRingGeo.rotateX(-Math.PI / 2);
      const selRingMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const selectedRingMesh = new THREE.Mesh(selRingGeo, selRingMat);
      selectedRingMesh.position.y = 0.015;
      selectedRingMesh.visible = false;
      sectorGroup.add(selectedRingMesh);

      // F. Larger invisible hit-box for raycasting click & hover detection
      const hitGeo = new THREE.SphereGeometry(0.28, 8, 8);
      const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.userData = { zone };
      sectorGroup.add(hitMesh);
      raycastTargets.push(hitMesh);

      sectorVisuals[zone] = {
        group: sectorGroup,
        deckRingMesh,
        pipMesh,
        activeBeamMesh,
        activeRingMesh,
        damagedBubbleMesh,
        damagedRingMesh,
        sparksPoints,
        selectedRingMesh,
      };
    });

    // 6. LIGHTWEIGHT UPDATE FUNCTION (In-place visual updates without tearing down scene)
    const updateVisuals = () => {
      const isCritical = isHullCriticalRef.current;
      const isWarning = isHullWarningRef.current;
      const curActive = activeZoneRef.current;
      const curSelected = selectedZoneRef.current;
      const curDamaged = damagedZonesRef.current;

      // Update hull wireframe color
      const shipColor = isCritical ? 0xff0055 : isWarning ? 0xfcee0a : 0x05d9e8;
      const shipOpacity = isCritical ? 0.85 : isWarning ? 0.72 : 0.65;
      holoMat.color.setHex(shipColor);
      holoMat.opacity = shipOpacity;

      // Critical hull alarm sphere visibility
      criticalAlarmSphere.visible = isCritical;

      // Update sector beacons
      ZONES.forEach((zone) => {
        const vis = sectorVisuals[zone];
        if (!vis) return;

        const isCurrent = zone === curActive;
        const isDamaged = curDamaged.includes(zone);
        const isSelected = zone === curSelected;

        // Visibility flags
        vis.activeBeamMesh.visible = isCurrent;
        vis.activeRingMesh.visible = isCurrent;
        vis.damagedBubbleMesh.visible = isDamaged;
        vis.damagedRingMesh.visible = isDamaged;
        vis.sparksPoints.visible = isDamaged;
        vis.selectedRingMesh.visible = isSelected && !isCurrent;

        const pipMat = vis.pipMesh.material as THREE.MeshBasicMaterial;
        const deckRingMat = vis.deckRingMesh.material as THREE.MeshBasicMaterial;

        if (isCurrent) {
          // Active Crisis Zone: Glowing Gold Beacon
          pipMat.color.setHex(0xfcee0a);
          pipMat.opacity = 1.0;
          vis.pipMesh.scale.setScalar(1.4);

          deckRingMat.color.setHex(0xfcee0a);
          deckRingMat.opacity = 0.9;
        } else if (isDamaged) {
          // Damaged Zone: Glowing Red Hazard Indicator
          pipMat.color.setHex(0xff0055);
          pipMat.opacity = 1.0;
          vis.pipMesh.scale.setScalar(1.35);

          deckRingMat.color.setHex(0xff0055);
          deckRingMat.opacity = 0.85;
        } else if (isSelected) {
          // Selected Zone: Focused Cyan Target
          pipMat.color.setHex(0x00f0ff);
          pipMat.opacity = 1.0;
          vis.pipMesh.scale.setScalar(1.25);

          deckRingMat.color.setHex(0x00f0ff);
          deckRingMat.opacity = 0.85;
        } else {
          // Normal Healthy Zone: Sleek, unobtrusive integrated hull deck terminal
          // No floating blue dots or clutter!
          pipMat.color.setHex(0x05d9e8);
          pipMat.opacity = 0.35;
          vis.pipMesh.scale.setScalar(0.85);

          deckRingMat.color.setHex(0x05d9e8);
          deckRingMat.opacity = 0.22;
        }
      });
    };

    sceneHandlesRef.current = { updateVisuals };
    updateVisuals();

    // 7. Interaction: Drag Rotation & Raycasting Click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const dom = renderer.domElement;

    let isDragging = false;
    let hasMoved = false;
    let dragStartPos = { x: 0, y: 0 };
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      hasMoved = false;
      dragStartPos = { x: e.clientX, y: e.clientY };
      previousMousePosition = { x: e.clientX, y: e.clientY };
      dom.style.cursor = "grabbing";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        if (
          Math.abs(e.clientX - dragStartPos.x) > 3 ||
          Math.abs(e.clientY - dragStartPos.y) > 3
        ) {
          hasMoved = true;
        }

        shipGroup.rotation.y += deltaX * 0.01;
        // Pitch clamping prevents flipping ship upside down into empty void
        shipGroup.rotation.x = Math.max(
          -0.45,
          Math.min(0.85, shipGroup.rotation.x + deltaY * 0.008),
        );
        previousMousePosition = { x: e.clientX, y: e.clientY };
      } else {
        // Hover pointer detection
        const rect = dom.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(raycastTargets, false);
        dom.style.cursor = hits.length > 0 ? "pointer" : "grab";
      }
    };

    const onMouseUp = () => {
      if (isDragging && !hasMoved) {
        const rect = dom.getBoundingClientRect();
        mouse.x = ((dragStartPos.x - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((dragStartPos.y - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(raycastTargets, false);
        if (intersects.length > 0) {
          const zoneName = intersects[0].object.userData.zone;
          if (zoneName) {
            setSelectedZone(zoneName);
          }
        }
      }
      isDragging = false;
      dom.style.cursor = "grab";
    };

    // Touch support for mobile / tablets
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        hasMoved = false;
        dragStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;

        if (
          Math.abs(e.touches[0].clientX - dragStartPos.x) > 4 ||
          Math.abs(e.touches[0].clientY - dragStartPos.y) > 4
        ) {
          hasMoved = true;
        }

        shipGroup.rotation.y += deltaX * 0.01;
        shipGroup.rotation.x = Math.max(
          -0.45,
          Math.min(0.85, shipGroup.rotation.x + deltaY * 0.008),
        );
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchEnd = () => {
      if (isDragging && !hasMoved) {
        const rect = dom.getBoundingClientRect();
        mouse.x = ((dragStartPos.x - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((dragStartPos.y - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(raycastTargets, false);
        if (intersects.length > 0) {
          const zoneName = intersects[0].object.userData.zone;
          if (zoneName) {
            setSelectedZone(zoneName);
          }
        }
      }
      isDragging = false;
    };

    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    dom.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    // 8. Responsive ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(Math.round(newW), Math.round(newH));
        }
      }
    });
    resizeObserver.observe(container);

    // 9. Animation Loop
    let animId: number;
    const startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) / 1000;

      // Smooth Auto-Rotation
      if (autoRotateRef.current && !isDragging) {
        shipGroup.rotation.y += 0.007;
      }

      // Hull Critical Alarm Pulse
      if (isHullCriticalRef.current) {
        const pulse = (Math.sin(elapsedTime * 6) + 1) * 0.15;
        holoMat.opacity = 0.65 + pulse;
        if (criticalAlarmSphere) {
          criticalAlarmSphere.scale.setScalar(1 + pulse * 0.2);
        }
      }

      // Pulse visible rings, bubbles, and sparks
      for (const zone of ZONES) {
        const vis = sectorVisuals[zone];
        if (!vis) continue;

        if (vis.activeRingMesh.visible) {
          const scale = 1 + Math.sin(elapsedTime * 4.5) * 0.18;
          vis.activeRingMesh.scale.set(scale, scale, scale);
        }

        if (vis.selectedRingMesh.visible) {
          const scale = 1 + Math.sin(elapsedTime * 3.5) * 0.12;
          vis.selectedRingMesh.scale.set(scale, scale, scale);
        }

        if (vis.damagedBubbleMesh.visible) {
          const scale = 1 + Math.sin(elapsedTime * 5.5) * 0.15;
          vis.damagedBubbleMesh.scale.set(scale, scale, scale);
          vis.damagedRingMesh.scale.set(scale, scale, scale);
          vis.sparksPoints.rotation.y += 0.035;
          vis.sparksPoints.rotation.x += 0.02;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Complete cleanup on unmount to prevent WebGL GPU leaks
    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      dom.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);

      scene.traverse((obj) => {
        if (isMesh(obj) || isPoints(obj)) {
          obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        }
      });

      renderer.dispose();
      if (container.contains(dom)) {
        container.removeChild(dom);
      }
      sceneHandlesRef.current = null;
    };
  }, []); // Run ONCE on mount

  // Lightweight visual update when game state or props change - DOES NOT RECREATE SCENE
  useEffect(() => {
    activeZoneRef.current = activeZone;
    selectedZoneRef.current = selectedZone;
    autoRotateRef.current = autoRotate;
    isHullCriticalRef.current = isHullCritical;
    isHullWarningRef.current = isHullWarning;
    damagedZonesRef.current = damagedZones;

    if (sceneHandlesRef.current) {
      sceneHandlesRef.current.updateVisuals();
    }
  }, [game, activeZone, selectedZone, autoRotate, isHullCritical, isHullWarning, damagedZones]);

  // Selected Sector Details
  const selectedStickers = selectedZone
    ? game.chronicle.stickers.filter((s) => s.target === selectedZone)
    : [];
  const isSelectedDamaged = selectedStickers.some((s) => !s.positive);
  const isSelectedActive = selectedZone === activeZone;

  return (
    <div className="space-y-2 text-right font-mono" dir="rtl">
      {/* HEADER WITH HULL STATUS */}
      <div className="flex items-center justify-between border-b border-cyan-900/60 pb-1.5 text-xs">
        <div className="flex items-center gap-1.5 font-bold">
          <Sparkles className="size-3.5 text-cyan-400 shrink-0" />
          <span className="text-cyan-300">رادار وضعیت ۳ بعدی سفینه</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Hull Health Pill */}
          <span
            className={`text-[9px] px-2 py-0.5 border font-bold flex items-center gap-1 ${
              isHullCritical
                ? "bg-red-950/80 border-red-500 text-red-400 animate-pulse"
                : isHullWarning
                ? "bg-yellow-950/80 border-yellow-500 text-yellow-300"
                : "bg-cyan-950/80 border-cyan-600 text-cyan-300"
            }`}
          >
            {isHullCritical ? (
              <ShieldAlert className="size-3 text-red-400 shrink-0" />
            ) : isHullWarning ? (
              <AlertTriangle className="size-3 text-yellow-400 shrink-0" />
            ) : (
              <CheckCircle2 className="size-3 text-cyan-400 shrink-0" />
            )}
            بدنه: {hull}/{maxHull} ({hullPercent}٪)
          </span>

          <button
            onClick={() => setAutoRotate((v) => !v)}
            title="چرخش خودکار رادار"
            className="text-[9px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/60 px-1.5 py-0.5 border border-cyan-800"
          >
            <RotateCw className="size-3" />
            {autoRotate ? "چرخش" : "ثابت"}
          </button>
        </div>
      </div>

      {/* 3D WEBGL RADAR CANVAS */}
      <div className="relative border border-cyan-500/40 bg-[#040a14] shadow-[inset_0_0_25px_rgba(0,240,255,0.15)] overflow-hidden">
        {/* Hologram Reticle corners */}
        <div className="absolute top-1 right-1 size-3 border-t-2 border-r-2 border-cyan-400/60 pointer-events-none" />
        <div className="absolute bottom-1 left-1 size-3 border-b-2 border-l-2 border-cyan-400/60 pointer-events-none" />

        <div ref={mountRef} className="w-full h-64 cursor-grab active:cursor-grabbing" />

        {/* Real-time Telemetry HUD Overlays */}
        <div className="absolute top-2 right-2 pointer-events-none flex flex-col gap-1 text-[9px]">
          {isHullCritical && (
            <span className="bg-red-600/90 text-white font-bold px-2 py-0.5 border border-red-400 animate-pulse flex items-center gap-1 shadow-lg">
              <ShieldAlert className="size-3" />
              هشدار بحرانی: آسیب شدید سازه سفینه!
            </span>
          )}
          {damagedZones.length > 0 && (
            <span className="bg-red-950/90 text-red-300 px-2 py-0.5 border border-red-700/80 flex items-center gap-1">
              <AlertTriangle className="size-3 text-red-400" />
              {damagedZones.length} بخش دچار نقص فنی یا آسیب
            </span>
          )}
          {activeZone && (
            <span className="bg-yellow-950/90 text-yellow-300 px-2 py-0.5 border border-yellow-600/80 flex items-center gap-1">
              <Radio className="size-3 text-yellow-400 animate-pulse" />
              کانون بحران دور: {ZONE_FA[activeZone] || activeZone}
            </span>
          )}
        </div>

        {/* Bottom Helper Hint */}
        <div className="absolute bottom-2 right-2 pointer-events-none text-[8.5px] text-cyan-400/70 bg-black/60 px-1.5 py-0.5 border border-cyan-900/60">
          💡 برای مشاهده مشخصات هر بخش، روی آن کلیک کنید یا درگ کنید تا بچرخد.
        </div>
      </div>

      {/* INTERACTIVE SECTOR DETAILS CARD */}
      {selectedZone && (
        <div
          className={`p-2.5 border text-[11px] transition-all duration-200 ${
            isSelectedDamaged
              ? "bg-red-950/30 border-red-500/60 text-red-200"
              : isSelectedActive
              ? "bg-yellow-950/30 border-yellow-500/60 text-yellow-200"
              : "bg-[#061325] border-cyan-500/50 text-cyan-100"
          }`}
        >
          <div className="flex items-center justify-between border-b border-cyan-900/50 pb-1.5 mb-1.5">
            <div className="flex items-center gap-2 font-bold">
              <Target className="size-3.5 text-cyan-400" />
              <span>{ZONE_FA[selectedZone] || selectedZone}</span>
              <span className="text-[9px] font-mono text-cyan-400/60">({selectedZone})</span>
            </div>

            <div className="flex items-center gap-2">
              {isSelectedDamaged ? (
                <span className="text-[9px] bg-red-900/60 border border-red-500 text-red-300 px-1.5 py-0.5">
                  ⚠️ آسیب‌دیده
                </span>
              ) : isSelectedActive ? (
                <span className="text-[9px] bg-yellow-900/60 border border-yellow-500 text-yellow-300 px-1.5 py-0.5">
                  📍 کانون بحران فعلی
                </span>
              ) : (
                <span className="text-[9px] bg-cyan-900/60 border border-cyan-500 text-cyan-300 px-1.5 py-0.5">
                  ✓ پایدار
                </span>
              )}
              <button
                onClick={() => setSelectedZone(null)}
                className="text-slate-400 hover:text-white p-0.5"
                title="بستن"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Sticker / Damage Details */}
          {selectedStickers.length > 0 ? (
            <div className="space-y-1 mt-1 text-[10px]">
              <div className="text-[9px] text-cyan-400/80 font-bold">برچسب‌های کرونیکل در این بخش:</div>
              <div className="flex flex-wrap gap-1">
                {selectedStickers.map((st) => (
                  <span
                    key={st.id}
                    className={`px-1.5 py-0.5 border text-[9px] ${
                      st.positive
                        ? "bg-cyan-950/70 border-cyan-500 text-cyan-300"
                        : "bg-red-950/80 border-red-500 text-red-300 animate-pulse"
                    }`}
                  >
                    {st.label} {st.positive ? "(مزیت)" : "(خسارت)"}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-[9.5px] text-slate-400">
              هیچ برچسب دائمی یا آسیب ساختاری برای این بخش ثبت نشده است. سامانه در وضعیت نرمال کار می‌کند.
            </div>
          )}
        </div>
      )}

      {/* QUICK SECTOR SELECTOR CHIPS */}
      <div className="flex flex-wrap gap-1 pt-0.5">
        {ZONES.map((zone) => {
          const stickers = game.chronicle.stickers.filter((s) => s.target === zone);
          const isDamaged = stickers.some((s) => !s.positive);
          const isCurrent = zone === activeZone;
          const isSelected = zone === selectedZone;

          return (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`text-[9px] font-mono px-2 py-1 border transition-all flex items-center gap-1 ${
                isSelected
                  ? "bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-[0_0_8px_rgba(0,240,255,0.4)]"
                  : isDamaged
                  ? "bg-red-950/70 border-red-600 text-red-300 hover:border-red-400"
                  : isCurrent
                  ? "bg-yellow-950/70 border-yellow-500 text-yellow-300 hover:border-yellow-400"
                  : "bg-[#061325] border-cyan-900 text-cyan-400/80 hover:border-cyan-700 hover:text-cyan-200"
              }`}
            >
              <span
                className={`size-1.5 rounded-full shrink-0 ${
                  isDamaged
                    ? "bg-red-500 animate-ping"
                    : isCurrent
                    ? "bg-yellow-400 animate-pulse"
                    : "bg-cyan-400"
                }`}
              />
              {ZONE_FA[zone] || zone}
            </button>
          );
        })}
      </div>
    </div>
  );
}
