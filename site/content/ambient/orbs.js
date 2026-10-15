// glass, further: shader orbs for the ambient app (WebGL1). one GL context per kind, drawn into any 2D canvas.
// ORB.draw(canvas, kind, { t, pose, s, lvl, need }) — pose: rest | listen | talk | think | speak | kiss
// ORB.edge(canvas, { t, on, lvl }) — the screen-edge glow while you hold fn
(() => {
  const NOISE = `
  vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*vnoise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
  mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
  vec3 iri(float x){return .5+.5*cos(6.2831*(vec3(0.,.33,.67)+x));}
  const vec3 PINK=vec3(.957,.651,.69);`;
  const HEAD = `precision highp float;uniform vec2 res;uniform float t,flow,lvl,listen,think,speak,kiss,need;` + NOISE;

  const FS = {
    // a drop of liquid glass: a raymarched blob, noise-displaced by the voice; iridescent rim, fake refraction
    liquid: HEAD + `
    float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
    float map(vec3 p){
      vec3 q=p; q.y-=need*.07*abs(sin(t*5.));
      float a=think*(q.y*2.2+flow*1.2); q.xz=rot(a)*q.xz;
      float sq=sin(clamp(kiss*2.,0.,1.)*3.14159); q.x*=1.+.22*sq; q.y*=1.-.12*sq;
      float amp=.03+.04*listen+.14*lvl+.06*think+.03*speak;
      float n=snoise(q*1.35+vec3(0.,0.,flow*.5))*amp+snoise(q*2.9-vec3(flow*.7))*amp*.25;
      float d=length(q)-(.6+.02*sin(t*1.6)+.05*speak*lvl)-n;
      if(kiss>0.){float k=clamp((kiss-.2)/.8,0.,1.);vec3 c=vec3(.5,.42,.1)*(.3+k*1.4);d=smin(d,length(p-c)-.13*(1.-k*.7),.22*(1.-k)+.01);}
      if(need>0.){vec3 c=vec3(0.,.86+.07*sin(t*5.),0.);d=smin(d,length(p-c)-.12*need,.16);}
      return d;}
    vec3 nrm(vec3 p){vec2 e=vec2(.002,-.002);return normalize(e.xyy*map(p+e.xyy)+e.yyx*map(p+e.yyx)+e.yxy*map(p+e.yxy)+e.xxx*map(p+e.xxx));}
    void main(){
      vec2 uv=(gl_FragCoord.xy-.5*res)/min(res.x,res.y);
      vec3 ro=vec3(0.,0.,2.6),rd=normalize(vec3(uv*1.15,-1.6));
      float d0=1.2,md=9.;bool hit=false;
      for(int i=0;i<64;i++){vec3 p=ro+rd*d0;float d=map(p);md=min(md,d);if(d<.001){hit=true;break;}d0+=d*.8;if(d0>4.2)break;}
      if(!hit){float g=exp(-max(md,0.)*9.)*(.18+.35*lvl+.12*listen+.25*need);gl_FragColor=vec4(PINK*g,g);return;}
      vec3 p=ro+rd*d0,n=nrm(p),v=-rd;
      float ndv=max(dot(n,v),0.),fr=pow(1.-ndv,2.4);
      vec3 rf=refract(rd,n,.72);
      vec3 env=mix(vec3(.16,.07,.2),vec3(1.,.78,.7),smoothstep(-.7,.8,rf.y+rf.x*.3));
      vec3 film=iri(ndv*1.3+n.y*.25+flow*.04);
      vec3 base=mix(PINK,film,.5);
      vec3 l1=normalize(vec3(-.5,.8,.6));float s1=pow(max(dot(reflect(-l1,n),v),0.),48.);
      vec3 l2=normalize(vec3(.7,-.4,.5));float s2=pow(max(dot(reflect(-l2,n),v),0.),10.)*.35;
      vec3 col=env*.45+base*(.3+.7*fr)+PINK*(1.-fr)*.35+s1+s2*vec3(1.,.8,.9)+speak*lvl*.3*PINK+need*.2*PINK;
      float a=clamp(.5+fr*.5+s1,0.,1.);
      gl_FragColor=vec4(col*a,a);}`,
    // a glass marble full of moving smoke: domain-warped noise inside a sphere, the rim wobbles with the voice
    nebula: HEAD + `
    void main(){
      vec2 uv=(gl_FragCoord.xy-.5*res)/min(res.x,res.y)*2.;
      float r=length(uv),an=atan(uv.y,uv.x);
      float R=.74+.02*sin(t*1.5)+lvl*.06*sin(an*5.+t*7.)+lvl*.03*sin(an*9.-t*5.)+need*.035*sin(t*6.)+speak*lvl*.05;
      if(r>R){float g=exp(-(r-R)*7.)*(.16+.4*lvl+.15*listen+.25*need);gl_FragColor=vec4(PINK*g,g);return;}
      float z=sqrt(max(0.,1.-r*r/(R*R)));vec3 n=vec3(uv/R,z);
      vec2 p=uv*1.5/(.55+z*.6);
      p=rot(think*(2.4*(1.-r/R))+flow*.15*think)*p;
      vec2 q=vec2(fbm(p+flow*.25),fbm(p+vec2(5.2,1.3)-flow*.2));
      vec2 w=vec2(fbm(p+3.*q+vec2(1.7,9.2)+flow*.35),fbm(p+3.*q+vec2(8.3,2.8)));
      float f=fbm(p+2.5*w);
      vec3 col=mix(vec3(.17,.05,.14),vec3(.96,.55,.63),clamp(f*f*2.2,0.,1.));
      col=mix(col,vec3(.55,.44,.96),clamp(length(q)*.55,0.,1.)*.45);
      col=mix(col,vec3(1.,.86,.76),clamp(w.x*w.x*1.2,0.,1.)*.55);
      col*=.55+.6*z;
      col+=(speak*lvl*.35+need*.15)*PINK;
      float fr=pow(1.-z,3.);col+=fr*vec3(1.,.8,.86)*.85;
      float sp=pow(max(dot(n,normalize(vec3(-.45,.55,.7))),0.),70.);col+=sp;
      float a=smoothstep(R,R-.012,r)*(.82+.18*fr);
      gl_FragColor=vec4(col*a,a);}`,
    // drops of glass that merge and split: metaballs with a lit, refractive surface
    droplets: HEAD + `
    float field(vec2 p){
      float f=0.;
      float r0=.4+.03*sin(t*1.7)+.07*speak*lvl;
      f+=r0*r0/(dot(p,p)+1e-4);
      for(int i=0;i<3;i++){
        float fi=float(i);
        float a=fi*2.094+flow*(.35+think*2.2)+.6*sin(t*.7+fi);
        float d=.2+.06*sin(t*1.3+fi*2.)+listen*.06+lvl*.38*(.55+.45*sin(t*3.1+fi*1.9))+think*.32;
        vec2 c=vec2(cos(a),sin(a))*d;float rr=.2-.02*fi;
        if(i==0&&need>0.){c=mix(c,vec2(0.,.62+.08*abs(sin(t*5.))),need);rr=mix(rr,.15,need);}
        if(i==0&&kiss>0.){float k=clamp(kiss*1.3,0.,1.);c=mix(c,vec2(.62,.55)*(1.+k*.6),k);rr*=1.-k*.75;}
        f+=rr*rr/(dot(p-c,p-c)+1e-4);}
      return f;}
    void main(){
      vec2 uv=(gl_FragCoord.xy-.5*res)/min(res.x,res.y)*2.;
      float e=.006,f=field(uv),fx=field(uv+vec2(e,0.)),fy=field(uv+vec2(0.,e));
      if(f<1.){float g=smoothstep(.25,1.,f)*(.14+.35*lvl+.12*listen+.2*need);gl_FragColor=vec4(PINK*g,g);return;}
      vec3 n=normalize(vec3(-(fx-f)/e*.06,-(fy-f)/e*.06,1.));
      float edge=smoothstep(1.,1.25,f);
      vec3 v=vec3(0.,0.,1.);float ndv=n.z,fr=pow(1.-ndv,2.);
      vec2 rf=uv+n.xy*.5;
      vec3 env=mix(vec3(.2,.08,.22),vec3(1.,.8,.72),smoothstep(-.9,.9,rf.y+rf.x*.4));
      vec3 film=iri(ndv*1.6+flow*.03);
      vec3 col=env*.45+mix(PINK,film,.45)*(.3+.7*fr);
      float s1=pow(max(dot(reflect(-normalize(vec3(-.5,.7,.6)),n),v),0.),60.);
      float s2=pow(max(dot(reflect(-normalize(vec3(.6,-.5,.5)),n),v),0.),14.)*.3;
      col+=s1+s2+speak*lvl*.2*PINK;
      float a=clamp((.38+fr*.62+s1)*mix(.5,1.,edge),0.,1.)*smoothstep(1.,1.04,f);
      gl_FragColor=vec4(col*a,a);}`,
    // the screen's edge, glowing while you hold fn (a flowing iridescent band, wider when you're loud)
    edge: HEAD + `
    void main(){
      vec2 p=gl_FragCoord.xy,hs=res*.5;float R=22.;
      vec2 q=abs(p-hs)-(hs-vec2(R));float d=length(max(q,0.))+min(max(q.x,q.y),0.)-R;
      float dist=max(-d,0.);
      float w=7.+42.*lvl+8.*listen;
      float an=atan(p.y-hs.y,(p.x-hs.x)*res.y/res.x);
      vec3 c=mix(iri(an/6.2831+flow*.08),PINK,.45);
      float band=.65+.35*sin(an*3.+flow*2.)*sin(an*5.-flow*1.3);
      float g=exp(-dist/w)*listen*band;
      g+=exp(-dist/2.5)*listen*.5;
      gl_FragColor=vec4(c*g,g);}`,
  };
  const VS = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

  // the 3D cloud of points: a sphere that breathes with the voice, that becomes the :) face when calm
  const PVS = `precision highp float;attribute vec3 pos;attribute float k;uniform float aspect,psz;varying float vk;varying float vz;
    void main(){vec3 p=pos;p.z+=3.2;gl_Position=vec4(p.x*2.25/p.z/aspect,p.y*2.25/p.z,0.,1.);gl_PointSize=psz*(3.2/p.z);vk=k;vz=p.z;}`;
  const PFS = `precision highp float;varying float vk;varying float vz;void main(){vec2 c=gl_PointCoord-.5;float a=exp(-dot(c,c)*22.)*clamp(1.1-(vz-2.4)*.6,.25,1.2)*.55;
    vec3 col=mix(vec3(.957,.651,.69),vec3(1.,.93,.88),vk);gl_FragColor=vec4(col*a,a);}`;

  const ctxs = {};
  function compile(gl, vs, fs) {
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  function ctx(kind) {
    if (ctxs[kind]) return ctxs[kind];
    const cv = document.createElement("canvas");
    const gl = cv.getContext("webgl", { premultipliedAlpha: true, alpha: true, preserveDrawingBuffer: true, antialias: true });
    if (!gl) return (ctxs[kind] = { fail: true });
    let C;
    try {
      if (kind === "cloud") {
        const prog = compile(gl, PVS, PFS);
        C = { cv, gl, prog, buf: gl.createBuffer(), kb: gl.createBuffer() };
      } else {
        const prog = compile(gl, VS, FS[kind]);
        const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        C = { cv, gl, prog, buf, u: {} };
        for (const n of ["res", "t", "flow", "lvl", "listen", "think", "speak", "kiss", "need"]) C.u[n] = gl.getUniformLocation(prog, n);
      }
    } catch (e) { console.error(kind, e); return (ctxs[kind] = { fail: true, err: String(e) }); }
    return (ctxs[kind] = C);
  }

  // smoothed state per target canvas
  function state(cv, st) {
    const S = cv._orb || (cv._orb = { lvl: 0, listen: 0, think: 0, speak: 0, need: 0, face: 1, flow: 0, lt: st.t });
    const dt = Math.max(0, Math.min(0.5, st.t - S.lt)); S.lt = st.t;
    const p = st.pose, tg = { listen: p === "listen" || p === "talk" ? 1 : 0, think: p === "think" ? 1 : 0, speak: p === "speak" ? 1 : 0, need: st.need ? 1 : 0 };
    const k = 1 - Math.pow(0.002, dt), kl = 1 - Math.pow(0.00002, dt);
    for (const n in tg) S[n] += (tg[n] - S[n]) * k;
    S.lvl += ((st.lvl || 0) - S.lvl) * kl;
    S.flow += dt * (0.6 + 0.8 * S.listen + 3.2 * S.lvl + 2.2 * S.think + 0.8 * S.speak);
    S.kiss = p === "kiss" ? Math.min(1, st.s / 1.0) : 0;
    const faceT = p === "rest" || p === "kiss" || p === "think" ? 1 : 0;
    S.face += (faceT - S.face) * (1 - Math.pow(0.02, dt));
    return S;
  }

  function size(cv) {
    const w = cv.clientWidth || +cv.dataset.w || 100, h = cv.clientHeight || +cv.dataset.h || w, dpr = +(cv.dataset.dpr || Math.min(2, devicePixelRatio || 1));
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    return [cv.width, cv.height];
  }

  function quad(C, w, h, S, t) {
    const { gl, cv, prog, buf, u } = C;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const a = gl.getAttribLocation(prog, "a"); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(u.res, w, h); gl.uniform1f(u.t, t); gl.uniform1f(u.flow, S.flow); gl.uniform1f(u.lvl, S.lvl);
    gl.uniform1f(u.listen, S.listen); gl.uniform1f(u.think, S.think); gl.uniform1f(u.speak, S.speak); gl.uniform1f(u.kiss, S.kiss || 0); gl.uniform1f(u.need, S.need);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // the cloud: positions on the CPU
  const NP = 1500, SPH = [], JIT = [];
  for (let i = 0; i < NP; i++) {
    const y = 1 - (i + 0.5) / NP * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996;
    SPH.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    const h = (n) => { const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
    JIT.push([h(1) - 0.5, h(2) - 0.5, h(3) - 0.5, h(4)]);
  }
  function cloud(C, w, h, S, st) {
    const { gl, cv, prog, buf, kb } = C;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    const P = window.AMB ? AMB.face(st.pose === "kiss" ? "kiss" : st.pose === "think" ? "think" : "rest", st.pose === "kiss" ? st.s : st.t, 0) : null, T = [];
    if (P) for (let y = 0; y < 18; y++) for (let x = 0; x < 41; x++) if (P[y][x]) T.push([(x - 21) / 19, -(y - 8.5) / 19]);
    const pos = new Float32Array(NP * 3), kk = new Float32Array(NP), t = st.t, ry = S.flow * 0.35, rx = 0.35 + 0.15 * Math.sin(t * 0.4);
    const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
    for (let i = 0; i < NP; i++) {
      let [x, y, z] = SPH[i]; const j = JIT[i];
      const n = Math.sin(x * 3 + S.flow * 1.3) * Math.sin(y * 3.4 - S.flow) * Math.sin(z * 2.7 + S.flow * 0.7);
      const n2 = Math.sin(x * 7 - S.flow * 2) * Math.sin(y * 6 + S.flow * 1.7) * 0.5;
      const rr = 0.78 * (1 + (n * 0.6 + n2) * (0.05 + 0.3 * S.lvl) + 0.05 * S.listen * Math.sin(t * 2 + y * 4) + S.need * 0.06 * Math.sin(t * 6));
      x *= rr; y *= rr; z *= rr;
      let x2 = x * cy + z * sy, z2 = -x * sy + z * cy, y2 = y * cx - z2 * sx; z2 = y * sx + z2 * cx;
      let fx = x2, fy = y2, fz = z2;
      if (T.length) { const d = T[(i * 7) % T.length]; fx = d[0] + j[0] * 0.03; fy = d[1] + j[1] * 0.03; fz = j[2] * 0.08; }
      const m = S.face * S.face * (3 - 2 * S.face);
      pos[i * 3] = x2 + (fx - x2) * m; pos[i * 3 + 1] = y2 + (fy - y2) * m; pos[i * 3 + 2] = z2 + (fz - z2) * m;
      kk[i] = j[3] < 0.2 ? 1 : 0;
    }
    gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
    const a = gl.getAttribLocation(prog, "pos"); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, kb); gl.bufferData(gl.ARRAY_BUFFER, kk, gl.DYNAMIC_DRAW);
    const b = gl.getAttribLocation(prog, "k"); gl.enableVertexAttribArray(b); gl.vertexAttribPointer(b, 1, gl.FLOAT, false, 0, 0);
    gl.uniform1f(gl.getUniformLocation(prog, "aspect"), w / h);
    gl.uniform1f(gl.getUniformLocation(prog, "psz"), Math.max(3, h / 40) * (1 + 0.4 * S.lvl));
    gl.drawArrays(gl.POINTS, 0, NP);
  }

  const STILL = new URLSearchParams(location.search).has("still") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  function stillFace(target) {
    const [w, h] = size(target), g = target.getContext("2d"), P = window.AMB ? AMB.face("rest", 1.3, 0) : null;
    g.clearRect(0, 0, w, h); if (!P) return true;
    const cell = Math.min(w / 45, h / 20), ox = (w - 41 * cell) / 2, oy = (h - 18 * cell) / 2;
    g.fillStyle = "#f4a6b0";
    for (let y = 0; y < 18; y++) for (let x = 0; x < 41; x++) if (P[y][x]) { g.beginPath(); g.arc(ox + x * cell + cell / 2, oy + y * cell + cell / 2, cell * 0.42, 0, 7); g.fill(); }
    return true;
  }
  function draw(target, kind, st) {
    if (STILL) return stillFace(target);
    const C = ctx(kind); if (C.fail) return false;
    const [w, h] = size(target), S = state(target, st);
    if (kind === "cloud") cloud(C, w, h, S, st); else quad(C, w, h, S, st.t);
    const g = target.getContext("2d"); g.clearRect(0, 0, w, h); g.drawImage(C.cv, 0, 0);
    return true;
  }
  function edge(target, st) {
    if (STILL) return;
    const C = ctx("edge"); if (C.fail) return;
    const [w, h] = size(target), S = state(target, { t: st.t, pose: st.on ? "talk" : "rest", lvl: st.lvl, s: 0 });
    quad(C, w, h, S, st.t);
    const g = target.getContext("2d"); g.clearRect(0, 0, w, h); g.drawImage(C.cv, 0, 0);
  }
  const KINDS = [
    ["liquid", "liquid glass", "a drop of glass, raymarched in 3D. your voice ripples its surface; it twists while main thinks; the kiss is a little drop that leaves."],
    ["nebula", "the marble", "a glass marble full of moving smoke. the smoke speeds up with your voice, swirls into a whirlpool while main thinks; the rim wobbles."],
    ["droplets", "the drops", "four drops of glass that merge and split. they push apart when you talk, orbit when main thinks; one hops up when something needs you."],
    ["cloud", "the constellation", "1,500 points of light. calm, they draw the kiss face; when you talk they become a sphere that breathes with your voice, then come back to the face."],
  ];
  window.ORB = { draw, edge, KINDS };
})();
