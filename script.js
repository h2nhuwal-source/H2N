// =====================
// DEBUG
// =====================
alert("JS jalan");

// =====================
// ELEMENT
// =====================
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// =====================
// KAMERA
// =====================
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
    video.play();
    console.log("kamera aktif");
  })
  .catch(err => {
    console.error("Kamera error:", err);
    alert("Kamera tidak bisa diakses");
  });

// =====================
// SUARA
// =====================
function speak(text) {
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "id-ID";
  speechSynthesis.speak(speech);
}

// =====================
// MEDIAPIPE
// =====================
const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }
});

hands.setOptions({
  maxNumHands: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

// =====================
// WARNA
// =====================
const gestureColors = {
  "Halo": "rgb(255,100,100)",
  "Nama saya": "rgb(100,255,100)",
  "Mohamad Husen": "rgb(0,200,255)",
  "Terimakasih": "rgb(255,100,255)",
  "Dua Jari": "rgb(255,255,100)",
  "OK": "rgb(100,255,255)"
};

// =====================
// DETEKSI JARI
// =====================
function fingerUp(hand, tip, pip) {
  return hand[tip].y < hand[pip].y;
}

function isOK(hand) {
  const thumb = hand[4];
  const index = hand[8];

  const dx = thumb.x - index.x;
  const dy = thumb.y - index.y;

  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < 0.05;
}

// =====================
// DETEKSI GESTURE
// =====================
function detectGesture(hand) {
  const index = fingerUp(hand, 8, 6);
  const middle = fingerUp(hand, 12, 10);
  const ring = fingerUp(hand, 16, 14);
  const pinky = fingerUp(hand, 20, 18);

  const total = [index, middle, ring, pinky].filter(v => v).length;

  if (isOK(hand)) return "OK";
  if (total === 4) return "Halo";
  if (index && !middle && !ring && !pinky) return "Nama saya";
  if (total === 0) return "Mohamad Husen";
  if (index && pinky && !middle && !ring) return "Terimakasih";
  if (index && middle && !ring && !pinky) return "Dua Jari";

  return null;
}

// =====================
// COOLDOWN SUARA
// =====================
let lastGesture = "";
let lastTime = 0;

// =====================
// HASIL DETEKSI
// =====================
hands.onResults(results => {

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (results.multiHandLandmarks) {
    const hand = results.multiHandLandmarks[0];
    const gesture = detectGesture(hand);

    if (gesture) {
      const color = gestureColors[gesture] || "white";

      // background
      ctx.fillStyle = "rgba(40,40,40,0.8)";
      ctx.fillRect(20, 20, 400, 80);

      // text
      ctx.fillStyle = color;
      ctx.font = "30px Arial";
      ctx.fillText(gesture, 40, 70);

      // suara (anti spam)
      const now = Date.now();
      if (gesture !== lastGesture && now - lastTime > 2000) {
        speak(gesture);
        lastGesture = gesture;
        lastTime = now;
      }
    }
  }
});

// =====================
// LOOP
// =====================
function run() {
  hands.send({ image: video });
  requestAnimationFrame(run);
}

video.onloadeddata = () => {
  run();
};