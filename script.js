const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

addEventListener("resize", () => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
});

// ---------------- AUDIO SETUP ----------------
const audio = document.getElementById("audio");
const fileInput = document.getElementById("audioFile");

const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 256;

let data = new Uint8Array(analyser.frequencyBinCount);
let sourceCreated = false;

// IMPORTANT: create source ONLY once audio is playable
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  audio.src = url;

  await audio.play();
  await audioCtx.resume();

  if (!sourceCreated) {
    const source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    sourceCreated = true;
  }
});

// unlock audio context
document.body.addEventListener("click", () => audioCtx.resume());

// ---------------- PARTICLES ----------------
let particles = [];

for (let i = 0; i < 1200; i++) {
  particles.push({
    x: (Math.random() - 0.5) * 800,
    y: (Math.random() - 0.5) * 800,
    z: Math.random() * 1500
  });
}

// ---------------- HEART ----------------
function drawHeart(x, y, size) {
  ctx.beginPath();

  for (let t = 0; t < Math.PI * 2; t += 0.03) {
    let hx = 16 * Math.pow(Math.sin(t), 3);
    let hy =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);

    ctx.lineTo(x + hx * size, y - hy * size);
  }

  ctx.closePath();
  ctx.fill();
}

// ---------------- MOUSE ----------------
let mouse = { x: 0, y: 0 };

addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX - innerWidth / 2) * 0.003;
  mouse.y = (e.clientY - innerHeight / 2) * 0.003;
});

// ---------------- LOOP ----------------
let energySmooth = 0;

function draw() {
  requestAnimationFrame(draw);

  analyser.getByteFrequencyData(data);

  // fallback so it NEVER goes invisible
  let energy = 0;
  for (let i = 0; i < data.length; i++) energy += data[i];
  energy = energy / data.length / 255;

  energySmooth += (energy - energySmooth) * 0.15;

  // IMPORTANT: lighter fade (fix blurry screen issue)
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let cx = canvas.width / 2;
  let cy = canvas.height / 2;

  // ---------------- PARTICLES ----------------
  for (let p of particles) {
    p.z -= 4 + energySmooth * 8;

    if (p.z <= 1) {
      p.z = 1500;
      p.x = (Math.random() - 0.5) * 800;
      p.y = (Math.random() - 0.5) * 800;
    }

    let scale = 600 / p.z;

    let x = cx + (p.x + mouse.x * p.z) * scale;
    let y = cy + (p.y + mouse.y * p.z) * scale;

    let size = (1 - p.z / 1500) * (2 + energySmooth * 4);

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);

    ctx.fillStyle = `rgba(255, 100, 180, 0.7)`;
    ctx.shadowColor = "hotpink";
    ctx.shadowBlur = 8;

    ctx.fill();
  }

  // ---------------- HEART ----------------
  let pulse = 10 + energySmooth * 10;

  ctx.fillStyle = "rgba(200,60,140,0.8)";
  ctx.shadowColor = "rgb(200,60,140)";
  ctx.shadowBlur = 50;

  drawHeart(cx, cy, pulse);
}

draw();
