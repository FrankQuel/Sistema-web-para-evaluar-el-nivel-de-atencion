export function earFromEye(pts: [number, number][]) {
  // pts: [p1..p6] = [[x,y], ...] con el orden (p1 horizontal, p4 horizontal; p2-p6 / p3-p5 verticales)
  if (pts.length < 6) return 0
  const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1])
  const A = dist(pts[1], pts[5])
  const B = dist(pts[2], pts[4])
  const C = dist(pts[0], pts[3])
  return (A + B) / (2.0 * C + 1e-6)
}

export function blinkDetector(ear: number, thr = 0.28, consec = 3) {
  // Devuelve un closure que cuenta blinks.
  let below = 0
  let blinks = 0
  return (value: number) => {
    if (value < thr) below++
    else {
      if (below >= consec) blinks++
      below = 0
    }
    return blinks
  }
}
