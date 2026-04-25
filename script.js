const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

addEventListener("resize", () => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
});

// ---------------- AUDIO ----------------
const audio = document.getElementById("audio");
const startBtn = document.getElementById("startBtn");

const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 256;

let data = new Uint8Array(analyser.frequencyBinCount);
let source = null;
let started = false;

// load your mp3 here (put song.mp3 in repo)
audio.src = "song.mp3";

// ---------------- START BUTTON ----------------
startBtn.addEventListener("click", async () => {
  if (started) return;
  started = true;

  await audioCtx.resume();
  await audio.play();

  if (!source) {
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
  }

  startBtn.style.display = "none";
});

// ---------------- MOUSE ----------------
let mouse = { x: 0, y: 0 };

addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX - innerWidth / 2) * 0.003;
  mouse.y = (e.clientY - innerHeight / 2) * 0.003;
});

// ---------------- PARTICLES ----------------
let particles = [];

for (let i = 0; i < 1400; i++) {
  particles.push({
    x: (Math.random() - 0.5) * 900,
    y: (Math.random() - 0.5) * 900,
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

// ---------------- LOOP ----------------
let energySmooth = 0;

function draw() {
  requestAnimationFrame(draw);

  analyser.getByteFrequencyData(data);

  let energy = 0;
  for (let i = 0; i < data.length; i++) energy += data[i];
  energy = energy / data.length / 255;

  energySmooth += (energy - energySmooth) * 0.12;

  ctx.fillStyle = "rgba(0,0,0,0.14)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let cx = canvas.width / 2;
  let cy = canvas.height / 2;

  // particles
  for (let p of particles) {
    p.z -= 5 + energySmooth * 9;

    if (p.z <= 1) {
      p.z = 1500;
      p.x = (Math.random() - 0.5) * 900;
      p.y = (Math.random() - 0.5) * 900;
    }

    let scale = 700 / p.z;

    let x = cx + (p.x + mouse.x * p.z) * scale;
    let y = cy + (p.y + mouse.y * p.z) * scale;

    let size = (1 - p.z / 1500) * (1.5 + energySmooth * 3);

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);

    ctx.fillStyle = `rgba(255,120,200,0.7)`;
    ctx.shadowColor = "hotpink";
    ctx.shadowBlur = 10;

    ctx.fill();
  }

  // heart
  let pulse = 10 + energySmooth * 8;

  ctx.fillStyle = "rgba(200,60,140,0.75)";
  ctx.shadowColor = "rgb(200,60,140)";
  ctx.shadowBlur = 50 + energySmooth * 40;

  drawHeart(cx, cy, pulse);
}

draw();
