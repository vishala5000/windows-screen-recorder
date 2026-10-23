// app.js — renderer process
const $ = (id) => document.getElementById(id);

const preview    = $("preview");
const placeholder= $("placeholder");
const recBadge   = $("recBadge");
const timerEl    = $("timer");
const startBtn   = $("startBtn");
const pauseBtn   = $("pauseBtn");
const stopBtn    = $("stopBtn");
const sysAudioCb = $("sysAudio");
const micAudioCb = $("micAudio");
const statusEl   = $("status");

// Titlebar
$("minBtn").onclick  = () => window.electronAPI.minimize();
$("maxBtn").onclick  = () => window.electronAPI.maximize();
$("closeBtn").onclick= () => window.electronAPI.close();

let mediaRecorder = null;
let displayStream = null;
let micStream = null;
let chunks = [];
let startTime = 0;
let pausedTime = 0;
let timerInterval = null;

function setStatus(msg) { statusEl.textContent = msg; }

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = n => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

function startTimer() {
  startTime = Date.now() - pausedTime;
  timerInterval = setInterval(() => {
    timerEl.textContent = formatTime(Date.now() - startTime);
  }, 200);
}
function stopTimer() {
  clearInterval(timerInterval);
  pausedTime = Date.now() - startTime;
}
function resetTimer() {
  clearInterval(timerInterval);
  pausedTime = 0;
  timerEl.textContent = "00:00";
}

startBtn.onclick = async () => {
  try {
    setStatus("Requesting screen access...");

    // 1) Get display stream
    displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 },
      audio: sysAudioCb.checked
    });

    // 2) Optionally get mic
    let tracks = [...displayStream.getTracks()];
    if (micAudioCb.checked) {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        tracks = tracks.concat(micStream.getAudioTracks());
      } catch (e) {
        setStatus("Mic access denied — recording without mic");
      }
    }

    const combined = new MediaStream(tracks);

    // 3) Show preview
    preview.srcObject = displayStream;
    preview.classList.add("active");
    placeholder.classList.add("hidden");
    recBadge.classList.remove("hidden");

    // 4) Start MediaRecorder
    const mimeCandidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm"
    ];
    const mimeType = mimeCandidates.find(m => MediaRecorder.isTypeSupported(m)) || "video/webm";

    chunks = [];
    mediaRecorder = new MediaRecorder(combined, { mimeType });
    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    mediaRecorder.onstop = handleStop;

    mediaRecorder.start(1000);
    startTimer();

    // If user stops sharing via browser UI
    displayStream.getVideoTracks()[0].onended = () => {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
    };

    // Update UI
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
    setStatus("Recording...");

  } catch (e) {
    setStatus("Canceled: " + e.message);
    cleanup();
  }
};

pauseBtn.onclick = () => {
  if (!mediaRecorder) return;
  if (mediaRecorder.state === "recording") {
    mediaRecorder.pause();
    stopTimer();
    pauseBtn.textContent = "▶ Resume";
    setStatus("Paused");
  } else if (mediaRecorder.state === "paused") {
    mediaRecorder.resume();
    startTimer();
    pauseBtn.textContent = "⏸ Pause";
    setStatus("Recording...");
  }
};

stopBtn.onclick = () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
};

async function handleStop() {
  stopTimer();
  setStatus("Saving...");

  const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
  const reader = new FileReader();
  reader.onload = async () => {
    const dataUrl = reader.result;
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const defaultName = `recording-${ts}.webm`;

    const result = await window.electronAPI.saveRecording(dataUrl, defaultName);
    if (result.ok) {
      setStatus(`Saved to ${result.path}`);
    } else {
      setStatus(result.reason === "canceled" ? "Save canceled" : "Save failed: " + result.reason);
    }
    cleanup();
  };
  reader.readAsDataURL(blob);
}

function cleanup() {
  if (displayStream) {
    displayStream.getTracks().forEach(t => t.stop());
    displayStream = null;
  }
  if (micStream) {
    micStream.getTracks().forEach(t => t.stop());
    micStream = null;
  }
  mediaRecorder = null;
  chunks = [];

  preview.srcObject = null;
  preview.classList.remove("active");
  placeholder.classList.remove("hidden");
  recBadge.classList.add("hidden");

  startBtn.disabled = false;
  pauseBtn.disabled = true;
  stopBtn.disabled = true;
  pauseBtn.textContent = "⏸ Pause";
  resetTimer();
}

// Init
setStatus("Ready — v" + (window.electronAPI?.getVersion ? "loading..." : "web"));
window.electronAPI?.getVersion().then(v => setStatus(`Ready — v${v}`)).catch(() => {});
