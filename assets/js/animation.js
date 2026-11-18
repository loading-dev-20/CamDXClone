const COLORS = ["#F0388F", "#2ED8F0", "#F7A531", "#3CC6A4"];
const NODE_COUNT = 7;
const STATIC_PACKETS = [
  [0, 0.55],
  [2, 0.4],
  [4, 0.7],
  [5, 0.3],
];

/**
 * Draw the "data exchange" animation: packets travel from an outer node to the
 * central CamDX hub, then out to another node.
 * @param {HTMLCanvasElement | null} canvas
 */
export function initNetworkAnimation(canvas) {
  if (!canvas) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  let width = 0;
  let height = 0;
  let hub = { x: 0, y: 0, pulse: 0 };
  let nodes = [];
  let packets = [];
  let frameId = 0;
  let lastTimestamp = 0;
  let nextSpawn = 0;

  function makePacket(from, to, progress = 0, colorIndex) {
    return {
      from,
      to,
      progress,
      color: COLORS[(colorIndex ?? from) % COLORS.length],
      speed: 0.0006 + Math.random() * 0.0004,
    };
  }

  function layout() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = rect.width;
    height = rect.height;
    if (!width || !height) return;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    hub = { x: width / 2, y: height / 2, pulse: 0 };

    const radius = Math.min(width, height) * 0.4;
    nodes = Array.from({ length: NODE_COUNT }, (_, index) => {
      const angle =
        -Math.PI / 2 +
        (index * 2 * Math.PI) / NODE_COUNT +
        (index % 2 ? 0.12 : -0.08);
      const distance = radius * (index % 2 ? 0.82 : 1);
      return {
        x: hub.x + Math.cos(angle) * distance,
        y: hub.y + Math.sin(angle) * distance,
        color: COLORS[index % COLORS.length],
      };
    });

    if (motionQuery.matches) {
      packets = STATIC_PACKETS.map(([from, progress], index) =>
        makePacket(from, (from + 3) % NODE_COUNT, progress, index),
      );
      draw();
    }
  }

  /** Point along a packet's path (outer node -> hub -> outer node). */
  function positionOf(packet) {
    const from = nodes[packet.from];
    const to = nodes[packet.to];

    if (packet.progress < 0.5) {
      const progress = packet.progress * 2;
      return [
        from.x + (hub.x - from.x) * progress,
        from.y + (hub.y - from.y) * progress,
      ];
    }

    const progress = (packet.progress - 0.5) * 2;
    return [
      hub.x + (to.x - hub.x) * progress,
      hub.y + (to.y - hub.y) * progress,
    ];
  }

  function draw() {
    if (!width || !height) return;

    context.clearRect(0, 0, width, height);

    context.lineWidth = 1;
    context.strokeStyle = "rgba(120,180,255,.22)";
    nodes.forEach((node) => {
      context.beginPath();
      context.moveTo(node.x, node.y);
      context.lineTo(hub.x, hub.y);
      context.stroke();
    });

    nodes.forEach((node) => {
      context.fillStyle = node.color;
      context.beginPath();
      context.arc(node.x, node.y, 7, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = node.color;
      context.globalAlpha = 0.35;
      context.beginPath();
      context.arc(node.x, node.y, 13, 0, Math.PI * 2);
      context.stroke();
      context.globalAlpha = 1;
    });

    const hubRadius = 22 + hub.pulse * 8;
    context.fillStyle = "#0B1C45";
    context.strokeStyle = "#2ED8F0";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(hub.x, hub.y, hubRadius, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = "#EAF2FF";
    context.font = "700 11px Noto Sans, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("CamDX", hub.x, hub.y);

    packets.forEach((packet) => {
      for (let step = 1; step <= 4; step += 1) {
        const trail = { ...packet, progress: Math.max(0, packet.progress - step * 0.025) };
        const [trailX, trailY] = positionOf(trail);
        context.fillStyle = packet.color;
        context.globalAlpha = (0.18 * (5 - step)) / 4;
        context.beginPath();
        context.arc(trailX, trailY, 4, 0, Math.PI * 2);
        context.fill();
      }

      const [x, y] = positionOf(packet);
      context.globalAlpha = 1;
      context.fillStyle = packet.color;
      context.beginPath();
      context.arc(x, y, 4.5, 0, Math.PI * 2);
      context.fill();
    });

    context.globalAlpha = 1;
  }

  function frame(timestamp) {
    const delta = lastTimestamp ? Math.min(timestamp - lastTimestamp, 50) : 16;
    lastTimestamp = timestamp;

    if (!nodes.length) {
      frameId = requestAnimationFrame(frame);
      return;
    }

    if (timestamp > nextSpawn) {
      const from = Math.floor(Math.random() * nodes.length);
      let to = Math.floor(Math.random() * nodes.length);
      if (to === from) to = (to + 1) % nodes.length;
      packets.push(makePacket(from, to));
      nextSpawn = timestamp + 420 + Math.random() * 300;
    }

    packets.forEach((packet) => {
      const previous = packet.progress;
      packet.progress += packet.speed * delta;
      if (previous < 0.5 && packet.progress >= 0.5) hub.pulse = 1;
    });
    packets = packets.filter((packet) => packet.progress < 1);
    hub.pulse *= 0.92;

    draw();
    frameId = requestAnimationFrame(frame);
  }

  function start() {
    if (frameId || motionQuery.matches) return;
    lastTimestamp = 0;
    nextSpawn = 0;
    frameId = requestAnimationFrame(frame);
  }

  function stop() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
  }

  function handleMotionChange() {
    stop();
    layout();
    start();
  }

  layout();
  start();

  if ("ResizeObserver" in window) {
    new ResizeObserver(layout).observe(canvas);
  }
  window.addEventListener("resize", layout);

  if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", handleMotionChange);
  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      if (motionQuery.matches) draw();
    });
  }
}
