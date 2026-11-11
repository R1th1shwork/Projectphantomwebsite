/* Ambient liquid-metal orbit rings with scroll parallax. Shared site backdrop.
   Included on content pages via a fixed #ringsBg canvas. Fails silent, no backend. */
(function () {
  try {
    if (!window.THREE || !window.WebGLRenderingContext) return;
    var canvas = document.getElementById('ringsBg');
    if (!canvas) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
    camera.position.set(0, 0, 9);
    var pmrem = new THREE.PMREMGenerator(renderer);
    var env = new THREE.Scene();
    env.background = new THREE.Color(0x000000);
    function strip(x, y, z, w, h, c) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      env.add(m);
    }
    strip(5, 3, 2, 6, 3, 0xffffff);
    strip(-6, -2, 1, 5, 4, 0xb9c8ff);
    strip(0, -5, 3, 4, 2, 0xffd9f2);
    strip(0, 6, -4, 9, 2, 0xffffff);
    scene.environment = pmrem.fromScene(env, 0.04).texture;
    pmrem.dispose();
    var key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(4, 6, 6);
    scene.add(key);
    var front = new THREE.PointLight(0xffffff, 60, 40);
    front.position.set(0, 2, 7);
    scene.add(front);
    var rimB = new THREE.PointLight(0x9db8ff, 50, 40);
    rimB.position.set(-6, -2, -2);
    scene.add(rimB);
    var rimP = new THREE.PointLight(0xffd7f5, 35, 40);
    rimP.position.set(6, -3, -3);
    scene.add(rimP);
    var rings = new THREE.Group();
    scene.add(rings);
    rings.position.z = -1;
    var defs = [
      [3.3, 0.05, 0xe8edf5, 0.5, 0.2, 0.3, 0.0016],
      [2.7, 0.035, 0xf4f6fa, 1.1, -0.4, 0.9, -0.0022],
      [2.15, 0.05, 0xffffff, -0.3, 0.7, 1.8, 0.0012]
    ];
    var pivots = [];
    defs.forEach(function (d) {
      var pivot = new THREE.Group();
      pivot.rotation.set(d[3], d[4], d[5]);
      var ring = new THREE.Mesh(
        new THREE.TorusGeometry(d[0], d[1], 20, 180),
        new THREE.MeshPhysicalMaterial({ color: d[2], metalness: 1.0, roughness: 0.12, clearcoat: 1.0, clearcoatRoughness: 0.06, envMapIntensity: 1.1 })
      );
      pivot.add(ring);
      pivot.userData.speed = d[6];
      rings.add(pivot);
      pivots.push(pivot);
    });
    function layout() {
      var w = window.innerWidth, h = window.innerHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = camera.aspect >= 1 ? 9 : 9 / Math.max(camera.aspect, 0.55);
      camera.updateProjectionMatrix();
    }
    layout();
    window.addEventListener('resize', layout);
    var sy = window.scrollY || 0;
    window.addEventListener('scroll', function () { sy = window.scrollY || 0; }, { passive: true });
    function frame(t) {
      for (var i = 0; i < pivots.length; i++) pivots[i].rotation.z += pivots[i].userData.speed;
      rings.rotation.y = t * 0.00004 + sy * 0.00045;
      rings.position.y = -sy * 0.00035;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    }
    if (reduce) { frame(0); return; }
    var run = true;
    var t0 = performance.now();
    document.addEventListener('visibilitychange', function () {
      var go = !document.hidden;
      if (go && !run) { run = true; requestAnimationFrame(loop); }
      else if (!go) { run = false; }
    });
    function loop(now) {
      if (!run) return;
      frame(now - t0);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  } catch (err) { return; }
})();
