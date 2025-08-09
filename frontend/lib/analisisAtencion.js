import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

let resultados = [];
let faceLandmarker = null;
let running = false;
let tiempoMaximo = 60000; // 60 segundos

// Contador de parpadeos
let conteoParpadeos = 0;
let ultimoParpadeo = false;

export async function iniciarAnalisis(video) {
  if (running) return;
  running = true;
  conteoParpadeos = 0;
  ultimoParpadeo = false;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );

  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: '/models/face_landmarker.task',
      delegate: 'GPU'
    },
    runningMode: "VIDEO"
  });

  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  video.onloadedmetadata = () => {
    video.play();
    detectarRostro(video);

    setTimeout(() => {
      running = false;
      video.pause();
      stream.getTracks().forEach(track => track.stop());
      exportarCSV(resultados, conteoParpadeos);
    }, tiempoMaximo);
  };
}

function detectarRostro(video) {
  const loop = async () => {
    if (!running || video.paused || video.ended) return;

    const detections = await faceLandmarker.detectForVideo(video, performance.now());

    if (detections.faceLandmarks?.length) {
      const landmarks = detections.faceLandmarks[0];

      const ear = calcularEAR(landmarks);
      const mirada = detectarMirada(landmarks);
      const { yaw, pitch, roll } = calcularPosturaCabeza(landmarks);

      // Parpadeo (umbral EAR)
      const umbralEAR = 0.2;
      const estaParpadeando = ear < umbralEAR;

      if (!ultimoParpadeo && estaParpadeando) {
        conteoParpadeos++;
        console.log("¡Parpadeo detectado! Total:", conteoParpadeos);
      }
      ultimoParpadeo = estaParpadeando;

      resultados.push({
        timestamp: new Date().toISOString(),
        ear: ear.toFixed(3),
        mirada,
        yaw,
        pitch,
        roll
      });

      console.log("EAR:", ear.toFixed(3), "| Mirada:", mirada, "| Yaw:", yaw, "| Pitch:", pitch, "| Roll:", roll);
    }

    requestAnimationFrame(loop);
  };

  loop();
}

function exportarCSV(data, totalParpadeos) {
  const headers = "timestamp,ear,mirada,yaw,pitch,roll\n";
  const filas = data.map(r =>
    `${r.timestamp},${r.ear},${r.mirada},${r.yaw},${r.pitch},${r.roll}`
  ).join("\n");

  const parpadeoFinal = `\n\nTotal parpadeos,${totalParpadeos}`;
  const blob = new Blob([headers + filas + parpadeoFinal], { type: "text/csv" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "atencion.csv";
  a.click();
}

// Cálculo EAR (detección de parpadeo)
function calcularEAR(landmarks) {
  const p1 = landmarks[159];
  const p2 = landmarks[145];
  const vertical = Math.abs(p1.y - p2.y);
  const horizontal = Math.abs(landmarks[33].x - landmarks[263].x);
  return vertical / horizontal;
}

// Seguimiento de mirada equilibrado
function detectarMirada(landmarks) {
  // Izquierdo
  const irisI = landmarks[468];
  const extremoIntI = landmarks[362];
  const extremoExtI = landmarks[263];
  const anchoI = Math.abs(extremoIntI.x - extremoExtI.x);
  const posRelI = (irisI.x - extremoExtI.x) / anchoI;

  // Derecho
  const irisD = landmarks[473];
  const extremoIntD = landmarks[133];
  const extremoExtD = landmarks[33];
  const anchoD = Math.abs(extremoIntD.x - extremoExtD.x);
  const posRelD = (irisD.x - extremoExtD.x) / anchoD;

  const promedio = (posRelI + posRelD) / 2;

  // Umbrales equilibrados
  if (promedio < 0.45) return "izquierda";
  if (promedio > 0.55) return "derecha";
  return "centro";
}

// Cálculo de postura de cabeza
function calcularPosturaCabeza(landmarks) {
  if (typeof cv === "undefined") return { yaw: 0, pitch: 0, roll: 0 };

  const modelPoints = cv.matFromArray(6, 3, cv.CV_64FC1, [
    0.0, 0.0, 0.0,
    0.0, -330.0, -65.0,
    -225.0, 170.0, -135.0,
    225.0, 170.0, -135.0,
    -150.0, -150.0, -125.0,
    150.0, -150.0, -125.0
  ]);

  const imagePoints = cv.matFromArray(6, 2, cv.CV_64FC1, [
    landmarks[1].x * 640, landmarks[1].y * 480,
    landmarks[152].x * 640, landmarks[152].y * 480,
    landmarks[33].x * 640, landmarks[33].y * 480,
    landmarks[263].x * 640, landmarks[263].y * 480,
    landmarks[61].x * 640, landmarks[61].y * 480,
    landmarks[291].x * 640, landmarks[291].y * 480
  ]);

  const cameraMatrix = cv.matFromArray(3, 3, cv.CV_64FC1, [
    640, 0, 320,
    0, 480, 240,
    0, 0, 1
  ]);
  const distCoeffs = cv.Mat.zeros(4, 1, cv.CV_64FC1);

  let rvec = new cv.Mat(), tvec = new cv.Mat();
  cv.solvePnP(modelPoints, imagePoints, cameraMatrix, distCoeffs, rvec, tvec);

  let rotMat = new cv.Mat();
  cv.Rodrigues(rvec, rotMat);

  let yaw = Math.atan2(rotMat.data64F[3], rotMat.data64F[0]);
  let pitch = Math.atan2(-rotMat.data64F[6], Math.sqrt(rotMat.data64F[7] ** 2 + rotMat.data64F[8] ** 2));
  let roll = Math.atan2(rotMat.data64F[7], rotMat.data64F[8]);

  rvec.delete(); tvec.delete(); rotMat.delete();
  modelPoints.delete(); imagePoints.delete(); cameraMatrix.delete(); distCoeffs.delete();

  return {
    yaw: yaw.toFixed(3),
    pitch: pitch.toFixed(3),
    roll: roll.toFixed(3)
  };
}
