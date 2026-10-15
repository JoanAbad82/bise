// the marble: bise's entity. a floating ball of warm painted smoke, in five variations.
// one WebGL1 context, drawn into any number of 2D canvases (MARBLE.draw(canvas, variant, mood state)).
// variants: 0 lamp marble · 1 mist pearl · 2 painted marble · 3 lantern · 4 pointillist
(() => {
  const FS = `
  precision highp float;
  uniform vec2 res; uniform float t, flow, variant, lvl, think, need, done, away, listen, still;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*vn(p);p=mat2(1.6,1.2,-1.2,1.6)*p;a*=.5;}return s;}
  mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
  // the palette is a uniform set: lamplight (default) or bise pink
  uniform vec3 UMBER, AMBER, CREAM, ROSE, OLIVE, EMBER;
  // the smoke inside: domain-warped noise, swirled into a whirlpool while bise thinks
  vec3 smoke(vec2 uv, float R, out float dens, out float z){
    float r=length(uv); z=sqrt(max(0.,1.-r*r/(R*R)));
    vec2 p=uv*1.5/(.55+z*.6);
    p=rot(think*(2.6*(1.-r/R))+flow*.12*think)*p;
    vec2 q=vec2(fbm(p+flow*.22),fbm(p+vec2(5.2,1.3)-flow*.18));
    vec2 w=vec2(fbm(p+3.*q+vec2(1.7,9.2)+flow*.3),fbm(p+3.*q+vec2(8.3,2.8)));
    float f=fbm(p+2.5*w); dens=f;
    vec3 col=mix(UMBER,AMBER,clamp(f*f*2.3,0.,1.));
    col=mix(col,CREAM,clamp(w.x*w.x*1.3,0.,1.)*.7);
    col=mix(col,ROSE,clamp(length(q)*.5,0.,1.)*.22);
    // light from inside: a warm core
    col+=CREAM*exp(-r*r/(R*R)*3.)*.35*(1.+listen*.5+lvl*.5);
    // mood tints
    col=mix(col,col*.55+ROSE*.6*(.6+.4*f),need*.65);
    col=mix(col,col*.6+OLIVE*.55*(.6+.4*f),done*.6);
    col=mix(col,col*.5+EMBER*.35,away*.6);
    col*=(1.-away*.45);
    return col;}
  void main(){
    vec2 uv=(gl_FragCoord.xy-.5*res)/min(res.x,res.y)*2.;
    float r=length(uv),an=atan(uv.y,uv.x);
    float breath=.015*sin(t*6.283/7.)*(1.-still);
    float R=.66+breath+lvl*.05*sin(an*5.+t*7.)+lvl*.025*sin(an*9.-t*5.)+need*.025*sin(t*5.)+listen*.03;
    float v=floor(variant+.5);
    float halo=(.16+.35*lvl+.15*listen+.22*need+.12*done)*(1.-away*.6);
    vec3 hc=mix(mix(AMBER,ROSE,need),OLIVE,done*(1.-need));
    if(v==1.){ // mist pearl: no rim. the smoke thins out into the air, and the edge breaks into dots of light
      R*=1.05; float dens,z; vec3 col=smoke(uv*.95,R,dens,z);
      float edge=R+.18*(fbm(vec2(an*2.,flow*.3))-.4);
      float a=smoothstep(edge,edge-.45,r)*(.55+.6*dens);
      // pointillist dots around the edge
      vec2 g=uv*min(res.x,res.y)/6.; vec2 id=floor(g), fc=fract(g)-.5;
      float h=hash(id), tw=.5+.5*sin(t*(1.5+h*3.)+h*40.);
      float ring=exp(-pow((r-R*.98)/.16,2.));
      float dot_=step(.82-ring*.25,h)*smoothstep(.32,.0,length(fc))*ring*tw;
      col=mix(col,CREAM*1.1,dot_); a=max(a,dot_*.9);
      a+= (1.-a)*exp(-max(0.,r-R*.8)*5.)*halo*.6;
      gl_FragColor=vec4(col*a,a); return; }
    if(v==4.){ // pointillist: the marble as dots of paint, bigger where it's brighter
      float cell=max(3.,min(res.x,res.y)/34.);
      vec2 g=gl_FragCoord.xy/cell; vec2 id=floor(g)+.5; vec2 c=(id*cell-.5*res)/min(res.x,res.y)*2.;
      vec2 jit=(vec2(hash(id),hash(id+7.))-.5)*.35; vec2 fc=fract(g)-.5-jit*.6;
      float rc=length(c); float dens,z; vec3 col=smoke(c,R,dens,z);
      float lum=dot(col,vec3(.3,.55,.15));
      float inside=smoothstep(R+.06,R-.04,rc);
      float outer=exp(-max(0.,rc-R)*6.)*halo*1.6*step(.7,hash(id+3.)) *(.6+.4*sin(t*2.+hash(id)*30.));
      float rad=mix(.18,.5,clamp(lum*1.4,0.,1.))*inside + .2*outer;
      float a=smoothstep(rad,rad-.12,length(fc))*max(inside,outer>0.?1.:0.);
      vec3 cc=inside>.5?col*1.15:hc;
      gl_FragColor=vec4(cc*a,a); return; }
    if(r>R){ float g=exp(-(r-R)*6.5)*halo; gl_FragColor=vec4(hc*g,g); return; }
    float dens,z; vec3 col=smoke(uv,R,dens,z);
    vec3 n=vec3(uv/R,z);
    if(v==2.){ // painted marble: the smoke laid down in strokes, posterized like a palette knife
      vec2 fl=vec2(cos(dens*6.+flow*.2),sin(dens*6.+flow*.2));
      vec2 sp=rot(atan(fl.y,fl.x))*uv*min(res.x,res.y)*.05;
      float stroke=vn(sp*vec2(1.,7.))*.6+vn(sp*vec2(.5,3.))*.4;
      float lum=dot(col,vec3(.3,.55,.15)); float band=floor(lum*5.+stroke*.9)/5.;
      col=mix(col,col*(band/(lum+.05)),.75)*(.92+.16*stroke);
      float Rw=R*(.97+.05*vn(vec2(an*3.,t*.2)));
      float a=smoothstep(Rw,Rw-.03,r);
      col+=pow(1.-z,3.)*CREAM*.35;
      gl_FragColor=vec4(col*a,a); return; }
    if(v==3.){ // lantern: a bright core like a flame, the smoke dark around it, light seeping out
      float core=exp(-pow(length(uv-vec2(0.,-.08+.02*sin(t*2.3)))/(.22+.05*lvl+.04*listen),2.));
      col=col*.55+ (CREAM*1.2+AMBER*.2)*core*(1.-away*.5) + mix(AMBER,ROSE,need)*core*.15;
      float fr=pow(1.-z,4.); col+=fr*AMBER*.5;
      float a=smoothstep(R,R-.015,r)*(.9+.1*fr);
      gl_FragColor=vec4(col*a,a); return; }
    // 0: lamp marble: clear glass, warm smoke, light from inside, a soft rim and one highlight
    col*=.6+.55*z;
    float fr=pow(1.-z,3.); col+=fr*CREAM*.7;
    float spec=pow(max(dot(n,normalize(vec3(-.45,.55,.7))),0.),60.); col+=spec*.9;
    float a=smoothstep(R,R-.014,r)*(.84+.16*fr);
    gl_FragColor=vec4(col*a,a);}`;
  const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  let gl, prog, U = {}, CV;
  function init() {
    CV = document.createElement("canvas"); CV.width = CV.height = 512;
    gl = CV.getContext("webgl", { premultipliedAlpha: true, alpha: true, preserveDrawingBuffer: true });
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; };
    prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ["res", "t", "flow", "variant", "lvl", "think", "need", "done", "away", "listen", "still", "UMBER", "AMBER", "CREAM", "ROSE", "OLIVE", "EMBER"].forEach(k => U[k] = gl.getUniformLocation(prog, k));
  }
  // dark, main, light, "needs you", "done", "away"
  const PALETTES = {
    lamp: { UMBER: [.17, .10, .07], AMBER: [.93, .64, .32], CREAM: [1, .93, .78], ROSE: [.86, .36, .50], OLIVE: [.76, .82, .48], EMBER: [.85, .42, .22] },
    pink: { UMBER: [.14, .05, .11], AMBER: [.96, .56, .64], CREAM: [1, .93, .91], ROSE: [1, .38, .60], OLIVE: [1, .87, .66], EMBER: [.58, .46, .96] },
  };
  // moods: what each one asks of the smoke. speed is how fast the smoke moves.
  const MOODS = {
    rest:   { speed: .18, think: 0, need: 0, done: 0, away: 0, listen: 0, voice: 0, still: 0 },
    still:  { speed: 0,   think: 0, need: 0, done: 0, away: .25, listen: 0, voice: 0, still: 1 },
    listen: { speed: .7,  think: 0, need: 0, done: 0, away: 0, listen: 1, voice: 1, still: 0 },
    speak:  { speed: .5,  think: 0, need: 0, done: 0, away: 0, listen: .4, voice: .6, still: 0 },
    work:   { speed: .45, think: 1, need: 0, done: 0, away: 0, listen: 0, voice: 0, still: 0 },
    need:   { speed: .2,  think: 0, need: 1, done: 0, away: 0, listen: 0, voice: 0, still: 0 },
    done:   { speed: .25, think: 0, need: 0, done: 1, away: 0, listen: 0, voice: 0, still: 0 },
    fail:   { speed: 0,   think: 0, need: 0, done: 0, away: .5, listen: 0, voice: 0, still: 1 },
    away:   { speed: .06, think: 0, need: 0, done: 0, away: 1, listen: 0, voice: 0, still: 0 },
  };
  const voice = t => Math.min(1, .3 + .55 * Math.abs(Math.sin(t * 7.3)) * (.55 + .45 * Math.sin(t * 2.1)) + .15 * Math.abs(Math.sin(t * 17.9)));
  // a per-canvas state that eases toward its mood (a change takes ~0.9 s) and integrates the smoke's flow
  function state(cv) { return cv._ms || (cv._ms = { flow: Math.random() * 40, ...MOODS.rest }); }
  function draw(cv, variant, mood, t, dt, palette = "lamp") {
    if (!gl) init();
    const PAL = PALETTES[palette] || PALETTES.lamp; for (const k in PAL) gl.uniform3fv(U[k], PAL[k]);
    const S = state(cv), M = MOODS[mood] || MOODS.rest, k = dt > 1 ? 1 : 1 - Math.exp(-dt / .3);
    for (const key in M) S[key] += (M[key] - S[key]) * k;
    S.flow += dt * S.speed * (1 + S.voice * voice(t) * 1.2);
    const dpr = 2, w = Math.round(cv.clientWidth * dpr) || cv.width, h = Math.round(cv.clientHeight * dpr) || cv.height;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    if (CV.width < w || CV.height < h) { CV.width = Math.max(CV.width, w); CV.height = Math.max(CV.height, h); }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(U.res, w, h); gl.uniform1f(U.t, t); gl.uniform1f(U.flow, S.flow); gl.uniform1f(U.variant, variant);
    gl.uniform1f(U.lvl, S.voice * voice(t)); gl.uniform1f(U.think, S.think); gl.uniform1f(U.need, S.need); gl.uniform1f(U.done, S.done);
    gl.uniform1f(U.away, S.away); gl.uniform1f(U.listen, S.listen); gl.uniform1f(U.still, S.still);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    const g = cv.getContext("2d"); g.clearRect(0, 0, w, h); g.drawImage(CV, 0, CV.height - h, w, h, 0, 0, w, h);
  }
  window.MARBLE = { draw, MOODS, NAMES: ["the lamp marble", "the mist pearl", "the painted marble", "the lantern", "the pointillist"] };
})();
