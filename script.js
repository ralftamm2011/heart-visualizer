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
const fileInput = document.getElementById("audioFile");

const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 256;

let source;
let data = new Uint8Array(analyser.frequencyBinCount);
let sourceCreated = false;

// load local file
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  audio.src = url;

  await audio.play();
  await audioCtx.resume();

  if (!sourceCreated) {
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    sourceCreated = true;
  }
});

// unlock audio on interaction (required by browsers)
document.body.addEventListener("click", () => {
  audioCtx.resume();
});

// ---------------- MOUSE ----------------
let mouse = { x: 0, y: 0 };

addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX - innerWidth / 2) * 0.002;
  mouse.y = (e.clientY - innerHeight / 2) * 0.002;
});

// ---------------- PARTICLES ----------------
let particles = [];

for (let i = 0; i < 1800; i++) {
  particles.push({
    x: (Math.random() - 0.5) * 1000,
    y: (Math.random() - 0.5) * 1000,
    z: Math.random() * 2000
  });
}

// ---------------- HEART ----------------
function drawHeart(x, y, size) {
  ctx.beginPath();

  for (let t = 0; t < Math.PI * 2; t += 0.02) {
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
  analyser.getByteFrequencyData(data);

  let energy = 0;
  for (let i = 0; i < data.length; i++) energy += data[i];
  energy = energy / data.length / 255;

  energySmooth += (energy - energySmooth) * 0.1;

  // motion trails (flying effect)
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let cx = canvas.width / 2;
  let cy = canvas.height / 2;

  // ---------------- PARTICLES ----------------
  for (let p of particles) {
    p.z -= 6 + energySmooth * 10;

    if (p.z <= 1) {
      p.z = 2000;
      p.x = (Math.random() - 0.5) * 1000;
      p.y = (Math.random() - 0.5) * 1000;
    }

    let scale = 800 / p.z;

    let x = cx + (p.x + mouse.x * p.z) * scale;
    let y = cy + (p.y + mouse.y * p.z) * scale;

    let size = (1 - p.z / 2000) * (1.5 + energySmooth * 3);

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);

    ctx.fillStyle = `rgba(255,120,200,${0.4 + energySmooth})`;
    ctx.shadowColor = "hotpink";
    ctx.shadowBlur = 10;

    ctx.fill();
  }

  // ---------------- HEART ----------------
  let pulse = 9 + energySmooth * 7;

  ctx.fillStyle = `rgba(200,60,140,0.6)`;
  ctx.shadowColor = "rgb(200,60,140)";
  ctx.shadowBlur = 40 + energySmooth * 60;

  drawHeart(cx, cy, pulse);

  requestAnimationFrame(draw);
}

draw();
