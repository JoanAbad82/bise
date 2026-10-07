// The pearl's fragment shader, as is from the old web capsule's (its pearl.js, round 8: the
// reference's variant 1 'the mist pearl', palette 'pink'), and its palette. WebGL1. Only
// well-defined GLSL (WebKit's Metal path draws garbage where Chrome forgives): no atan(0,0), no pow
// of a negative base, no smoothstep with edge0 >= edge1.

export const FRAGMENT = `
  precision highp float;
  uniform vec2 res; uniform float t, flow, variant, lvl, think, need, done, away, listen, still, gather, zoom;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*vn(p);p=mat2(1.6,1.2,-1.2,1.6)*p;a*=.5;}return s;}
  mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
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
    col+=CREAM*exp(-r*r/(R*R)*3.)*.35*(1.+listen*.5+lvl*.5);
    col=mix(col,col*.55+ROSE*.6*(.6+.4*f),need*.65);
    col=mix(col,col*.6+OLIVE*.55*(.6+.4*f),done*.6);
    col=mix(col,col*.5+EMBER*.35,away*.6);
    col*=(1.-away*.45);
    return col;}
  void main(){
    // zoom: the pearl's size inside its canvas (1 fills it); the bar grows it while fn is held here,
    // never with a CSS transform on the canvas (WebKit and Chrome showed a scaled WebGL canvas as a
    // thin vertical sliver, round 9's gate)
    vec2 uv=(gl_FragCoord.xy-.5*res)/min(res.x,res.y)*2./max(zoom,.01);
    // only well-defined GLSL below (WebKit's Metal path draws garbage where Chrome forgives:
    // ambient's gate, the listen pearl as a streak): no atan(0,0), no pow of a negative base, no
    // smoothstep with edge0 >= edge1 (written as 1 - smoothstep(lo, hi, x))
    float r=length(uv),an=atan(uv.y,uv.x+1e-6);
    float breath=.015*sin(t*6.283/7.)*(1.-still);
    float R=.66+breath+lvl*.05*sin(an*5.+t*7.)+lvl*.025*sin(an*9.-t*5.)+need*.025*sin(t*5.)+listen*.03;
    float halo=(.16+.35*lvl+.15*listen+.22*need+.12*done)*(1.-away*.6);
    // mist pearl: no rim. the smoke thins out into the air, and the edge breaks into dots of light
    R*=1.05; float dens,z; vec3 col=smoke(uv*.95,R,dens,z);
    float edge=R+.18*(fbm(vec2(an*2.,flow*.3))-.4);
    float a=(1.-smoothstep(edge-.45,edge,r))*(.55+.6*dens);
    vec2 g=uv*min(res.x,res.y)/6.; vec2 id=floor(g), fc=fract(g)-.5;
    float h=hash(id), tw=.5+.5*sin(t*(1.5+h*3.)+h*40.);
    float rd=(r-R*.98)/.16; float ring=exp(-rd*rd);
    float dot_=step(.82-ring*.25,h)*(1.-smoothstep(.0,.32,length(fc)))*ring*tw;
    col=mix(col,CREAM*1.1,dot_); a=max(a,dot_*.9);
    a+= (1.-a)*exp(-max(0.,r-R*.8)*5.)*halo*.6;
    // the hello (ambient m_5702): gather 1 is a few scattered dots of pink and cream, the body not
    // yet there; as it eases to 0 the dots close in and the mist fills in behind them
    if(gather>0.){
      vec2 gs=uv/(1.+gather*1.3); vec2 g2=gs*min(res.x,res.y)/7.; vec2 id2=floor(g2), f2=fract(g2)-.5;
      float h2=hash(id2+vec2(7.,3.));
      float d2=step(.8,h2)*(1.-smoothstep(.0,.3,length(f2)))*(1.-smoothstep(R*.6,R*1.05,length(gs)))*gather;
      a*=(1.-gather); col=mix(col,mix(ROSE,CREAM,fract(h2*13.)),d2); a=max(a,d2*.95);}
    gl_FragColor=vec4(col*a,a);}`;

export const VERTEX = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

/** bise pink (SPEC §1): dark, body, light, needs you, done, away. */
export const PINK = {
  UMBER: [0.14, 0.05, 0.11],
  AMBER: [0.96, 0.56, 0.64],
  CREAM: [1, 0.93, 0.91],
  ROSE: [1, 0.38, 0.6],
  OLIVE: [1, 0.87, 0.66],
  EMBER: [0.58, 0.46, 0.96],
} as const satisfies Record<string, readonly [number, number, number]>;
