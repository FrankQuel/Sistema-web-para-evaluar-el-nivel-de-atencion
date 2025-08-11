import cv2 as cv
import numpy as np
import time
from collections import deque, Counter
from attention_model_rf import RandomForestAttentionModel
from FaceMeshModule import FaceMeshGenerator

# ====== Config ======
CAM_INDEX = 0
SESSION_SECONDS = 60       # cambia a lo que necesites
RESIZE_TO = (1280, 360)    # ventana de vista; solo ojos, más angosta
EAR_THRESHOLD = 0.30
CONSEC_FRAMES = 4
SMOOTH_N = 5               # suavizado yaw/pitch

# Modelo IA
MODEL_PATH = "ml/MODELS/modelo_rf_v1.joblib"
try:
    rf = RandomForestAttentionModel.load(MODEL_PATH)
    MODEL_TAG = "RF_v1"
except Exception:
    rf = None
    MODEL_TAG = "Heuristica_v1"  # fallback

# Landmarks de ojo/iris
RIGHT_EYE = [33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246]
LEFT_EYE  = [362,382,381,380,374,373,390,249,263,466,388,387,386,385,384,398]
RIGHT_EYE_EAR = [33,159,158,133,153,145]
LEFT_EYE_EAR  = [362,380,374,263,386,385]
RIGHT_IRIS = [468,469,470,471,472]
LEFT_IRIS  = [473,474,475,476,477]

IRIS_LEFT_THR, IRIS_RIGHT_THR = 0.35, 0.65
IRIS_UP_THR,   IRIS_DOWN_THR  = 0.40, 0.60
YAW_LEFT_DEG, YAW_RIGHT_DEG   = -15.0, 15.0
PITCH_UP_DEG, PITCH_DOWN_DEG  = -15.0, 15.0

# ====== Utils de visión ======
def eye_aspect_ratio(eye_idx, lm):
    p1,p2,p3,p4,p5,p6 = [np.array(lm[i], np.float32) for i in eye_idx]
    A = np.linalg.norm(p2 - p6); B = np.linalg.norm(p3 - p5); C = np.linalg.norm(p1 - p4)
    return (A + B) / (2.0*C + 1e-6)

def iris_center(lm, ids):
    pts = [np.array(lm[i], float) for i in ids if i in lm]
    if not pts: return None
    c = np.mean(pts, axis=0)
    return float(c[0]), float(c[1])

def iris_gaze(lm):
    need = [33,133,362,263,159,145,386,374]
    if not all(i in lm for i in need): return None
    rc, lc = iris_center(lm, RIGHT_IRIS), iris_center(lm, LEFT_IRIS)
    if rc is None or lc is None: return None
    r_left,r_right = np.array(lm[33],float), np.array(lm[133],float)
    l_left,l_right = np.array(lm[362],float), np.array(lm[263],float)
    r_ratio = (rc[0]-r_left[0])/(r_right[0]-r_left[0] + 1e-6)
    l_ratio = (lc[0]-l_left[0])/(l_right[0]-l_left[0] + 1e-6)
    h_ratio = 0.5*(r_ratio+l_ratio)
    r_top,r_bot = np.array(lm[159],float), np.array(lm[145],float)
    l_top,l_bot = np.array(lm[386],float), np.array(lm[374],float)
    r_v = (rc[1]-r_top[1])/(r_bot[1]-r_top[1] + 1e-6)
    l_v = (lc[1]-l_top[1])/(l_bot[1]-l_top[1] + 1e-6)
    v_ratio = 0.5*(r_v+l_v)
    if h_ratio <= IRIS_LEFT_THR:  return "izquierda"
    if h_ratio >= IRIS_RIGHT_THR: return "derecha"
    if v_ratio <= IRIS_UP_THR:    return "arriba"
    if v_ratio >= IRIS_DOWN_THR:  return "abajo"
    return "centro"

def head_pose_angles(lm, shape):
    h,w = shape[:2]
    model3d = np.array([
        (0.0,0.0,0.0),(0.0,-63.6,-12.5),
        (-43.3,32.7,-26.0),(43.3,32.7,-26.0),
        (-28.9,-28.9,-24.1),(28.9,-28.9,-24.1)
    ], np.float32)
    img2d = np.array([
        lm.get(1,(w//2,h//2)), lm.get(152,(w//2,h-1)),
        lm.get(263,(0,0)), lm.get(33,(w-1,0)),
        lm.get(291,(0,h-1)), lm.get(61,(w-1,h-1))
    ], np.float32)
    K = np.array([[w,0,w/2],[0,w,h/2],[0,0,1]], np.float32)
    ok, rvec, _ = cv.solvePnP(model3d, img2d, K, np.zeros((4,1),np.float32), flags=cv.SOLVEPNP_ITERATIVE)
    if not ok: return None, None, None
    R,_ = cv.Rodrigues(rvec); sy = np.sqrt(R[0,0]**2 + R[1,0]**2)
    if sy < 1e-6:
        pitch = np.degrees(np.arctan2(-R[1,2], R[1,1])); yaw = np.degrees(np.arctan2(-R[2,0], sy)); roll = 0.0
    else:
        pitch = np.degrees(np.arctan2(R[2,1], R[2,2]));   yaw = np.degrees(np.arctan2(-R[2,0], sy));  roll = np.degrees(np.arctan2(R[1,0],R[0,0]))
    return yaw,pitch,roll

def gaze_from_pose(yaw,pitch):
    if yaw is None or pitch is None: return "—"
    if yaw <= YAW_LEFT_DEG:  return "izquierda"
    if yaw >= YAW_RIGHT_DEG: return "derecha"
    if pitch <= PITCH_UP_DEG:return "arriba"
    if pitch >= PITCH_DOWN_DEG:return "abajo"
    return "centro"

# ====== Clasificación heurística (fallback) ======
def classify_and_recommend(m):
    blink_rate = m['blink_rate']; pct_centro = m['gaze_pct'].get('centro',0.0)
    yaw_avg = m['yaw_avg_abs'];  pitch_avg = m['pitch_avg_abs']; noface = m['noface_pct']
    if noface > 25.0: return 'DISTRAIDO','Ausencia de rostro frecuente.'
    if pct_centro >= 65.0 and yaw_avg < 7.0 and pitch_avg < 7.0 and 8.0 <= blink_rate <= 25.0:
        return 'ATENTO','Buen enfoque. Pausas cada 15–20 min.'
    if pct_centro < 45.0 or yaw_avg > 12.0 or pitch_avg > 12.0 or blink_rate < 6.0 or blink_rate > 30.0:
        return 'DISTRAIDO','Actividad interactiva y segmentación.'
    return 'NEUTRO','Resúmenes cortos y checks de comprensión.'

def recommend_from_label(label):
    return {
        "ATENTO":"Buen enfoque. Pausas cada 15–20 min.",
        "NEUTRO":"Atención variable. Resúmenes + checks.",
        "DISTRAIDO":"Actividades interactivas y segmentar."
    }.get(label,"—")

# ====== Runtime ======
def run_session(on_result=None):
    cap = cv.VideoCapture(CAM_INDEX)
    if not cap.isOpened():
        raise RuntimeError("No se pudo abrir la cámara")

    # FaceMesh sin dibujar; solo usaremos puntos para render
    try:    gen = FaceMeshGenerator(refine_landmarks=True)
    except: gen = FaceMeshGenerator()

    start = time.time()
    frames=0; frames_face=0
    blink_counter=0; frame_counter=0
    ear_sum=0.0; ear_min=10.0; ear_max=0.0
    yaw_abs_sum=0.0; pitch_abs_sum=0.0
    gaze_counts=Counter()
    yaw_q, pitch_q = deque(maxlen=SMOOTH_N), deque(maxlen=SMOOTH_N)

    while True:
        ok, frame = cap.read()
        if not ok: break
        frame = cv.flip(frame,1)

        if (time.time()-start) >= SESSION_SECONDS:
            end_reason=f"Fin automático de {SESSION_SECONDS}s"; break

        _, lm = gen.create_face_mesh(frame, draw=False)
        frames += 1

        # --- DIBUJO SOLO PUNTOS (como tu imagen) ---
        # borra textos, solo ojos y centros de iris
        if lm:
            frames_face += 1

            # EAR + blink
            r_ear = eye_aspect_ratio(RIGHT_EYE_EAR,lm)
            l_ear = eye_aspect_ratio(LEFT_EYE_EAR,lm)
            ear = (r_ear + l_ear)/2.0
            ear_sum += ear; ear_min=min(ear_min,ear); ear_max=max(ear_max,ear)
            if ear < EAR_THRESHOLD: frame_counter += 1
            else:
                if frame_counter >= CONSEC_FRAMES: blink_counter += 1
                frame_counter = 0

            # dibujar landmarks de ojo (rojo) y centros de iris (amarillo)
            for loc in RIGHT_EYE + LEFT_EYE:
                if loc in lm: cv.circle(frame, lm[loc], 2, (0,0,255), cv.FILLED)
            for ids in (RIGHT_IRIS, LEFT_IRIS):
                c = iris_center(lm, ids)
                if c is not None: cv.circle(frame, (int(c[0]),int(c[1])), 4, (0,255,255), cv.FILLED)

            # mirada por iris + pose siempre
            gaze_label = iris_gaze(lm)
            yaw,pitch,_ = head_pose_angles(lm, frame.shape)
            if yaw is not None:   yaw_q.append(yaw)
            if pitch is not None: pitch_q.append(pitch)
            if (gaze_label is None) and (yaw_q and pitch_q):
                gaze_label = gaze_from_pose(float(np.mean(yaw_q)), float(np.mean(pitch_q)))
            if gaze_label: gaze_counts[gaze_label] += 1
            if yaw_q:   yaw_abs_sum += abs(float(np.mean(yaw_q)))
            if pitch_q: pitch_abs_sum += abs(float(np.mean(pitch_q)))

        # mostrar ventana (sin textos)
        disp = cv.resize(frame, RESIZE_TO) if RESIZE_TO else frame
        cv.imshow("Atención (solo puntos) - p para salir", disp)
        if cv.waitKey(1) & 0xFF == ord('p'):
            end_reason = "Salida manual con p"; break

    cap.release(); cv.destroyAllWindows()

    # métricas agregadas (en memoria)
    dur = max(1.0, time.time()-start); minutes = dur/60.0
    frames = max(1, frames); frames_face = max(0, frames_face)
    ear_avg = (ear_sum/frames_face) if frames_face else 0.0
    blink_rate = blink_counter / minutes
    noface_pct = (1.0 - (frames_face/frames)) * 100.0
    yaw_avg_abs = (yaw_abs_sum/frames_face) if frames_face else 0.0
    pitch_avg_abs= (pitch_abs_sum/frames_face) if frames_face else 0.0
    gaze_pct = {k: (v/frames_face)*100.0 for k,v in gaze_counts.items()} if frames_face else {}

    metrics = {
        "session_seconds": round(dur,2),
        "frames_total": frames,
        "frames_face": frames_face,
        "noface_pct": round(noface_pct,2),
        "blink_count": blink_counter,
        "blink_rate": round(blink_rate,2),
        "ear_avg": round(ear_avg,3),
        "ear_min": 0.0 if ear_min>9.0 else round(ear_min,3),
        "ear_max": round(ear_max,3),
        "yaw_avg_abs": round(yaw_avg_abs,2),
        "pitch_avg_abs": round(pitch_avg_abs,2),
        "gaze_pct": {k: round(v,2) for k,v in gaze_pct.items()},
        "end_reason": end_reason,
    }

    # Clasificación (IA si hay modelo)
    if rf is not None:
        nivel = rf.predict_label_from_metrics(metrics)
        recomendacion = recommend_from_label(nivel)
        modelo = MODEL_TAG
    else:
        nivel, recomendacion = classify_and_recommend(metrics)
        modelo = MODEL_TAG

    # Retorna al backend (no escribe archivos)
    result = {"modelo": modelo, "nivel": nivel, "recomendacion": recomendacion, "metrics": metrics}
    if on_result: on_result(result)
    return result

if __name__ == "__main__":
    res = run_session()
    print(res["modelo"], "|", res["nivel"], "|", res["recomendacion"])
