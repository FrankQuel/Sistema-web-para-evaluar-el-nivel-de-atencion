export async function cargarOpenCV() {
  return new Promise((resolve, reject) => {
    if (typeof cv !== 'undefined') {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.5.5/opencv.js';
    script.async = true;

    script.onload = () => {
      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(checkLoaded);
      } else {
        setTimeout(checkLoaded, 100);
      }

      function checkLoaded() {
        if (typeof cv !== 'undefined' && cv.Mat) {
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      }
    };

    script.onerror = reject;
    document.body.appendChild(script);
  });
}
