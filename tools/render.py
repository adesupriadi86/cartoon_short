#!/usr/bin/env python3
"""Render frames via headless Chromium + SwiftShader on about:blank (Blob ES modules).
Usage: python3 render.py <outdir> <frames: "a-b" or "1,2,3"> [step] [quality] [workers]
"""
import os, sys, time, base64, json
from concurrent.futures import ProcessPoolExecutor
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

def parse_frames(spec, step=1):
    frames = []
    for part in spec.split(","):
        if "-" in part:
            a, b = map(int, part.split("-"))
            frames.extend(range(a, b + 1, step))
        else:
            frames.append(int(part))
    return frames

def load_web_sources(web_root):
    files = {}
    for rel in ["lib/three.module.js", "motion.js", "toon.js", "paint.js", "story.js", "main.js"]:
        p = os.path.join(web_root, rel)
        if os.path.exists(p):
            files[rel] = open(p, "r", encoding="utf-8").read()
    return files

def render_chunk(args):
    outdir, chunk, files, qual, hash_str, resume = args
    opts = Options()
    opts.binary_location = "/usr/bin/chromium"
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--use-angle=swiftshader")
    opts.add_argument("--enable-unsafe-swiftshader")
    opts.add_argument("--ignore-gpu-blocklist")
    opts.add_argument("--window-size=720,1280")
    opts.set_capability("goog:loggingPrefs", {"browser": "ALL"})
    driver = webdriver.Chrome(service=Service("/usr/bin/chromedriver"), options=opts)
    try:
        driver.get("about:blank")
        # Inject canvas + error catcher + Blob ES module graph
        driver.execute_script("""
            const files = arguments[0];
            const hashStr = arguments[1];
            document.body.style.margin = '0';
            document.body.style.background = '#000';
            const c = document.createElement('canvas');
            c.id = 'c'; c.width = 720; c.height = 1280; c.style.display = 'block';
            document.body.appendChild(c);
            window.addEventListener('error', e => { window.err = String(e.message || e); });
            window.addEventListener('unhandledrejection', e => { window.err = String(e.reason || e); });
            if (hashStr === '#nd') window.DEBUG_ND = 1;
            if (hashStr === '#e') window.DEBUG_E = 1;

            const urls = {};
            const mkBlob = (src) => URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
            // Order matters: leaves first
            urls['./lib/three.module.js'] = mkBlob(files['lib/three.module.js']);
            urls['./motion.js'] = mkBlob(files['motion.js']);
            urls['./toon.js'] = mkBlob(files['toon.js']);

            const rewrite = (src) => {
                let s = src;
                for (const [k, v] of Object.entries(urls)) {
                    s = s.replaceAll(`'${k}'`, `'${v}'`).replaceAll(`"${k}"`, `"${v}"`);
                }
                return s;
            };
            urls['./paint.js'] = mkBlob(rewrite(files['paint.js']));
            urls['./story.js'] = mkBlob(rewrite(files['story.js']));
            const mainUrl = mkBlob(rewrite(files['main.js']));

            const sc = document.createElement('script');
            sc.type = 'module';
            sc.src = mainUrl;
            document.body.appendChild(sc);
        """, files, hash_str)

        t_wait = time.time()
        while time.time() - t_wait < 60:
            st = driver.execute_script("return {ready: !!window.ready, err: window.err || null};")
            if st["err"]:
                raise RuntimeError(f"Page error: {st['err']}")
            if st["ready"]:
                break
            time.sleep(0.05)
        else:
            logs = driver.get_log("browser")
            raise RuntimeError(f"Timeout waiting for window.ready. Logs: {logs}")

        done = 0
        for f in chunk:
            out_path = os.path.join(outdir, f"f{f:04d}.jpg")
            if resume and os.path.exists(out_path):
                done += 1
                continue
            b64 = driver.execute_script(
                "window.renderFrame(arguments[0]); return document.getElementById('c').toDataURL('image/jpeg', arguments[1]).split(',')[1];",
                f, qual
            )
            with open(out_path, "wb") as fp:
                fp.write(base64.b64decode(b64))
            done += 1
        return done
    finally:
        driver.quit()

def main():
    outdir = sys.argv[1]
    spec = sys.argv[2]
    step = int(sys.argv[3]) if len(sys.argv) > 3 else 1
    qual = float(sys.argv[4]) if len(sys.argv) > 4 else 0.96
    workers = int(sys.argv[5]) if len(sys.argv) > 5 else 1
    os.makedirs(outdir, exist_ok=True)
    frames = parse_frames(spec, step)
    web_root = os.path.abspath(os.environ.get("WEB", "web"))
    files = load_web_sources(web_root)
    hash_str = os.environ.get("HASH", "")
    resume = bool(os.environ.get("RESUME"))
    t0 = time.time()
    if workers <= 1 or len(frames) <= 4:
        render_chunk((outdir, frames, files, qual, hash_str, resume))
    else:
        chunks = [frames[i::workers] for i in range(workers)]
        chunks = [c for c in chunks if c]
        with ProcessPoolExecutor(max_workers=len(chunks)) as ex:
            list(ex.map(render_chunk, [(outdir, c, files, qual, hash_str, resume) for c in chunks]))
    dt = time.time() - t0
    print(f"done {len(frames)} frames in {dt:.1f}s ({dt/max(1,len(frames)):.2f} s/frame)")

if __name__ == "__main__":
    main()
