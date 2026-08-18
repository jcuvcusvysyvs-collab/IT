/**
 * Footer Dot Matrix — vanilla WebGL2 (no CDN / OGL).
 * Brand palette; lazy-init; respects prefers-reduced-motion.
 */
(() => {
  const FRAME_MS = 1000 / 30;

  const VERT = `#version 300 es
in vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

  const PERLIN_FRAG = `#version 300 es
precision mediump float;
uniform float uFrequency;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uResolution;
out vec4 fragColor;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
  vec2 uv = gl_FragCoord.xy / max(uResolution, vec2(1.0));
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0) + 0.5;
  float t = uTime * uSpeed;
  float n1 = snoise(vec3(p.x * uFrequency * 1.85, p.y * uFrequency * 0.72, t));
  float n2 = snoise(vec3(p.x * uFrequency * 0.55 + 2.1, p.y * uFrequency * 0.4 - 1.3, t * 0.65 + 4.0));
  float field = 0.52 + 0.34 * n1 + 0.22 * n2;
  field = clamp(field, 0.0, 1.0);
  fragColor = vec4(vec3(field), 1.0);
}`;

  const DOT_FRAG = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform sampler2D uTexture;
uniform vec3 uDotColor;
uniform float uDotAlpha;
uniform float uCellSize;
uniform float uGamma;
uniform float uPaletteBias;
out vec4 fragColor;

void main() {
  vec2 pix = gl_FragCoord.xy;
  float cell = max(uCellSize, 1.0);
  vec2 cellIdx = floor(pix / cell);
  vec2 cellCenter = (cellIdx + 0.5) * cell;
  vec3 col = texture(uTexture, cellCenter / uResolution.xy).rgb;
  float gray = 0.3 * col.r + 0.59 * col.g + 0.11 * col.b;
  gray = pow(clamp(gray, 0.0, 1.0), uGamma);

  vec2 cellUV = fract(pix / cell) - 0.5;
  float dist = length(cellUV);
  float radius = mix(0.07, 0.48, clamp(gray + uPaletteBias, 0.0, 1.0));
  float aa = fwidth(dist) + 1e-4;
  float mark = 1.0 - smoothstep(radius - aa, radius + aa, dist);
  float alpha = mark * uDotAlpha;
  fragColor = vec4(uDotColor * alpha, alpha);
}`;

  function parseColor(input) {
    const str = String(input || "").trim();
    const rgba = str.match(
      /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/i
    );
    if (rgba) {
      return {
        r: Math.max(0, Math.min(255, parseFloat(rgba[1]))) / 255,
        g: Math.max(0, Math.min(255, parseFloat(rgba[2]))) / 255,
        b: Math.max(0, Math.min(255, parseFloat(rgba[3]))) / 255,
        a: rgba[4] !== undefined ? Math.max(0, Math.min(1, parseFloat(rgba[4]))) : 1,
      };
    }
    const hex = str.replace(/^#/, "");
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16) / 255,
        g: parseInt(hex.slice(2, 4), 16) / 255,
        b: parseInt(hex.slice(4, 6), 16) / 255,
        a: 1,
      };
    }
    return { r: 0.1, g: 0.29, b: 0.49, a: 0.7 };
  }

  function themeConfig() {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    return {
      frequency: 2.15,
      speed: 0.95,
      cellSize: 16,
      gamma: 1.05,
      paletteBias: 0.02,
      color: dark ? "#3d74c4" : "#3a6ea8",
      alpha: dark ? 1 : 0.58,
    };
  }

  function compile(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new Error(log || "shader compile failed");
    }
    return sh;
  }

  function link(gl, vsSrc, fsSrc) {
    const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, "aPos");
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(prog);
      gl.deleteProgram(prog);
      throw new Error(log || "program link failed");
    }
    return prog;
  }

  function loc(gl, prog, name) {
    return gl.getUniformLocation(prog, name);
  }

  function ensureBgLayer(footer) {
    let layer = footer.querySelector(".footer-dot-bg");
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "footer-dot-bg";
      layer.setAttribute("aria-hidden", "true");
      footer.insertBefore(layer, footer.firstChild);
    }
    return layer;
  }

  function createDotField(container) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = document.createElement("canvas");
    canvas.className = "footer-dot-bg__canvas";
    container.appendChild(canvas);

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!gl) throw new Error("WebGL2 unavailable");

    const dprCap = Math.min(window.devicePixelRatio || 1, 1.75);
    let cfg = themeConfig();
    let playing = !reduceMotion;
    let rafId = null;
    let lastTime = 0;
    let disposed = false;
    let startMs = performance.now();

    const perlinProg = link(gl, VERT, PERLIN_FRAG);
    const dotProg = link(gl, VERT, DOT_FRAG);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const noiseTex = gl.createTexture();
    const fbo = gl.createFramebuffer();
    let texW = 0;
    let texH = 0;

    function allocTarget(w, h) {
      if (w === texW && h === texH) return;
      texW = w;
      texH = h;
      gl.bindTexture(gl.TEXTURE_2D, noiseTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, noiseTex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    function applyDotColor(prog) {
      const c = parseColor(cfg.color);
      gl.useProgram(prog);
      gl.uniform3f(loc(gl, prog, "uDotColor"), c.r, c.g, c.b);
      gl.uniform1f(loc(gl, prog, "uDotAlpha"), cfg.alpha);
    }

    function resize() {
      if (disposed) return;
      const w = Math.max(1, Math.floor(container.clientWidth * dprCap));
      const h = Math.max(1, Math.floor(container.clientHeight * dprCap));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      allocTarget(w, h);
    }

    function renderOnce(timeSec) {
      if (disposed) return;
      const w = canvas.width;
      const h = canvas.height;
      if (w < 2 || h < 2) return;

      gl.bindVertexArray(vao);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, w, h);
      gl.useProgram(perlinProg);
      gl.uniform1f(loc(gl, perlinProg, "uFrequency"), cfg.frequency);
      gl.uniform1f(loc(gl, perlinProg, "uTime"), timeSec);
      gl.uniform1f(loc(gl, perlinProg, "uSpeed"), playing ? cfg.speed : 0);
      gl.uniform2f(loc(gl, perlinProg, "uResolution"), w, h);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(dotProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, noiseTex);
      gl.uniform1i(loc(gl, dotProg, "uTexture"), 0);
      gl.uniform2f(loc(gl, dotProg, "uResolution"), w, h);
      gl.uniform1f(loc(gl, dotProg, "uCellSize"), cfg.cellSize * dprCap);
      gl.uniform1f(loc(gl, dotProg, "uGamma"), cfg.gamma);
      gl.uniform1f(loc(gl, dotProg, "uPaletteBias"), cfg.paletteBias);
      applyDotColor(dotProg);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindVertexArray(null);
    }

    function tick(now) {
      if (disposed || !playing) {
        rafId = null;
        return;
      }
      if (now - lastTime < FRAME_MS) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      lastTime = now;
      renderOnce((now - startMs) * 0.001);
      rafId = requestAnimationFrame(tick);
    }

    function start() {
      if (disposed) return;
      if (reduceMotion) {
        playing = false;
        renderOnce(0.8);
        return;
      }
      playing = true;
      if (rafId == null) {
        lastTime = 0;
        rafId = requestAnimationFrame(tick);
      }
    }

    function stop() {
      playing = false;
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    function applyTheme() {
      cfg = themeConfig();
      if (!playing) renderOnce((performance.now() - startMs) * 0.001);
    }

    resize();
    renderOnce(0.6);

    let resizePending = false;
    const onResize = () => {
      if (resizePending) return;
      resizePending = true;
      requestAnimationFrame(() => {
        resizePending = false;
        resize();
        if (!playing) renderOnce((performance.now() - startMs) * 0.001);
      });
    };
    window.addEventListener("resize", onResize);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
    if (ro) ro.observe(container);

    return {
      start,
      stop,
      applyTheme,
      dispose() {
        window.removeEventListener("resize", onResize);
        if (ro) {
          try {
            ro.disconnect();
          } catch (_) {
            /* ignore */
          }
        }
        disposed = true;
        stop();
        if (canvas.parentElement === container) container.removeChild(canvas);
      },
    };
  }

  function boot() {
    const footer = document.querySelector(".site-footer");
    if (!footer) return;

    const layer = ensureBgLayer(footer);
    let field = null;
    let failed = false;

    const tryInit = () => {
      if (field || failed) return;
      try {
        field = createDotField(layer);
        layer.classList.add("is-ready");
      } catch (err) {
        failed = true;
        layer.classList.add("is-fallback");
        if (typeof console !== "undefined" && console.warn) {
          console.warn("[footer-dot-matrix]", err);
        }
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          tryInit();
          if (field) field.start();
        } else if (field) {
          field.stop();
        }
      },
      { rootMargin: "160px 0px", threshold: 0 }
    );
    io.observe(footer);

    const themeObserver = new MutationObserver(() => {
      if (field) field.applyTheme();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
