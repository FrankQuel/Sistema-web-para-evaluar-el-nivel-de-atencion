import os
import glob
import json
import math
import argparse
from collections import Counter
from typing import Tuple

import numpy as np
from joblib import dump, load
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

"""
RandomForest para nivel de atención (ATENTO / NEUTRO / DISTRAIDO)

FUNCIONA EN DOS MODOS:
1) Entrenamiento desde un directorio de JSONs (como los que genera session_eval_demo.py).
   - Usa etiquetas reales si el JSON trae 'label' o 'nivel_atencion_gt'.
   - Si no hay etiquetas y permites pseudo-etiquetas, usa una heurística para auto-etiquetar.
   - Guarda el modelo en MODELS/modelo_rf_v1.joblib (o ruta que pases).

2) Inferencia: cargar el modelo y predecir desde un diccionario 'metrics' con los mismos campos.

Requisitos (ejemplo compatible con Python 3.13 en Windows):
    pip install --only-binary=:all: scikit-learn==1.5.2 joblib==1.4.2 scipy==1.16.1
"""


# ------------------------------
# Extracción de features
# ------------------------------
FEATURE_NAMES = [
    "blink_rate",        # parpadeos por minuto
    "ear_avg",           # EAR promedio
    "ear_min",
    "ear_max",
    "gaze_pct_centro",   # % tiempo mirando al centro
    "gaze_pct_izquierda",
    "gaze_pct_derecha",
    "yaw_avg_abs",       # |yaw| promedio
    "pitch_avg_abs",     # |pitch| promedio
    "noface_pct",        # % tiempo sin rostro
]


def _safe_get(d: dict, key: str, default: float = 0.0) -> float:
    v = d.get(key, default)
    if v is None:
        return float(default)
    try:
        v = float(v)
    except Exception:
        return float(default)
    if math.isnan(v) or math.isinf(v):
        return float(default)
    return v


def features_from_metrics(metrics: dict) -> np.ndarray:
    gaze_pct = metrics.get("gaze_pct", {}) or {}
    row = [
        _safe_get(metrics, "blink_rate", 0.0),
        _safe_get(metrics, "ear_avg", 0.0),
        _safe_get(metrics, "ear_min", 0.0),
        _safe_get(metrics, "ear_max", 0.0),
        float(gaze_pct.get("centro", 0.0)),
        float(gaze_pct.get("izquierda", 0.0)),
        float(gaze_pct.get("derecha", 0.0)),
        _safe_get(metrics, "yaw_avg_abs", 0.0),
        _safe_get(metrics, "pitch_avg_abs", 0.0),
        _safe_get(metrics, "noface_pct", 0.0),
    ]
    return np.array(row, dtype=np.float32)


# ------------------------------
# Heurística (para pseudo-etiquetar si no hay ground truth)
# ------------------------------

def heuristic_label(metrics: dict) -> str:
    blink_rate = _safe_get(metrics, "blink_rate", 0.0)
    pct_centro = (metrics.get("gaze_pct", {}) or {}).get("centro", 0.0)
    yaw_avg = _safe_get(metrics, "yaw_avg_abs", 0.0)
    pitch_avg = _safe_get(metrics, "pitch_avg_abs", 0.0)
    noface_pct = _safe_get(metrics, "noface_pct", 0.0)

    if noface_pct > 25.0:
        return "DISTRAIDO"
    if pct_centro >= 65.0 and yaw_avg < 7.0 and pitch_avg < 7.0 and 8.0 <= blink_rate <= 25.0:
        return "ATENTO"
    if (
        pct_centro < 45.0
        or yaw_avg > 12.0
        or pitch_avg > 12.0
        or blink_rate < 6.0
        or blink_rate > 30.0
    ):
        return "DISTRAIDO"
    return "NEUTRO"


def recommend_from_label(label: str) -> str:
    """Devuelve una recomendación corta en función del nivel."""
    label = (label or "").upper()
    return {
        "ATENTO":    "Buen enfoque. Pausas cada 15–20 min.",
        "NEUTRO":    "Atención variable. Usa resúmenes y checks de comprensión.",
        "DISTRAIDO": "Segmenta el contenido y añade actividades interactivas.",
    }.get(label, "—")


# ------------------------------
# Dataset loader
# ------------------------------

def _read_json(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_dataset(json_dir: str, use_pseudo: bool = True) -> Tuple[np.ndarray, np.ndarray]:
    pattern = os.path.join(json_dir, "*.json")
    files = sorted(glob.glob(pattern))
    X, y = [], []
    for fp in files:
        try:
            data = _read_json(fp)
            metrics = data.get("metricas") or data.get("metrics") or {}
            if not metrics:
                continue

            # etiquetas reales si vienen en el JSON
            label = data.get("label") or data.get("nivel_atencion_gt") or data.get("nivel_atencion")
            if label is None and use_pseudo:
                label = heuristic_label(metrics)

            if label is None:
                # si no hay etiqueta y no queremos pseudo, saltar
                continue

            X.append(features_from_metrics(metrics))
            y.append(str(label).upper())
        except Exception as e:
            print(f"[WARN] No se pudo leer {fp}: {e}")

    X = np.stack(X, axis=0) if X else np.empty((0, len(FEATURE_NAMES)), dtype=np.float32)
    y = np.array(y, dtype=object)
    return X, y


# ------------------------------
# Modelo
# ------------------------------
class RandomForestAttentionModel:
    def __init__(self, n_estimators=300, max_depth=None, min_samples_leaf=1, random_state=42):
        self.clf = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            min_samples_leaf=min_samples_leaf,
            class_weight="balanced",
            random_state=random_state,
            n_jobs=-1,
        )
        self.classes_ = None

    def fit(self, X: np.ndarray, y: np.ndarray):
        self.clf.fit(X, y)
        self.classes_ = list(self.clf.classes_)
        return self

    def predict(self, X: np.ndarray):
        return self.clf.predict(X)

    def predict_label_from_metrics(self, metrics: dict) -> str:
        x = features_from_metrics(metrics).reshape(1, -1)
        return str(self.predict(x)[0])

    def save(self, path: str):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        dump({"model": self.clf, "features": FEATURE_NAMES}, path)

    @staticmethod
    def load(path: str) -> "RandomForestAttentionModel":
        pkg = load(path)
        obj = RandomForestAttentionModel()
        obj.clf = pkg["model"]
        obj.classes_ = list(obj.clf.classes_)
        return obj


# ------------------------------
# CLI
# ------------------------------

def train_cli(args):
    X, y = load_dataset(args.data, use_pseudo=not args.no_pseudo)
    if X.shape[0] < 10:
        raise SystemExit(
            f"Muy pocos ejemplos en '{args.data}'. "
            f"Genera más JSON con tu recolector o añade labels."
        )

    print(f"Dataset: {X.shape[0]} ejemplos, {X.shape[1]} features")
    dist = Counter(y)
    print("Distribución de etiquetas:", dict(dist))

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=args.test_size, random_state=args.seed, stratify=y
    )

    model = RandomForestAttentionModel(
        n_estimators=args.estimators,
        max_depth=args.max_depth,
        min_samples_leaf=args.min_leaf,
        random_state=args.seed,
    ).fit(X_tr, y_tr)

    y_pred = model.predict(X_te)
    print("\nReporte de clasificación (test):\n", classification_report(y_te, y_pred, digits=3))
    print("Matriz de confusión:\n", confusion_matrix(y_te, y_pred, labels=sorted(set(y))))

    out_path = args.out
    model.save(out_path)
    print(f"\nModelo guardado en: {out_path}")


def predict_from_json_cli(args):
    model = RandomForestAttentionModel.load(args.model)
    sample = _read_json(args.predict_json)
    metrics = sample.get("metricas") or sample.get("metrics") or {}
    if not metrics:
        raise SystemExit("El JSON no contiene 'metricas'.")
    label = model.predict_label_from_metrics(metrics)
    print("Predicción:", label)


def build_argparser():
    p = argparse.ArgumentParser(description="RandomForest para nivel de atención")
    sub = p.add_subparsers(dest="cmd")

    # entrenamiento
    t = sub.add_parser("train", help="Entrenar modelo desde JSONs")
    t.add_argument("--data", required=True, help="Directorio con session_summary_*.json")
    t.add_argument("--out", default=os.path.join("MODELS", "modelo_rf_v1.joblib"))
    t.add_argument("--test-size", type=float, default=0.2)
    t.add_argument("--estimators", type=int, default=300)
    t.add_argument("--max-depth", type=int, default=None)
    t.add_argument("--min-leaf", type=int, default=1)
    t.add_argument("--seed", type=int, default=42)
    t.add_argument("--no-pseudo", action="store_true", help="No usar pseudo-etiquetas; requiere labels reales en JSON")

    # predicción directa desde un JSON
    g = sub.add_parser("predict-json", help="Predecir desde un JSON de sesión")
    g.add_argument("--predict-json", required=True)
    g.add_argument("--model", required=True)

    return p


if __name__ == "__main__":
    parser = build_argparser()
    args = parser.parse_args()

    if args.cmd == "train":
        train_cli(args)
    elif args.cmd == "predict-json":
        predict_from_json_cli(args)
    else:
        parser.print_help()
