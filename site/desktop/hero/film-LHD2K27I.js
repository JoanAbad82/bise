const _t={ev_started:"started",working:"working",ev_running_hot:"running hot",waiting:"waiting",ev_waits_on:e=>"waits on "+String(e.agent),asks_you:"asks you",landing:"landing",ev_in_line:"waits to land",ev_landed:"landed",done:"done",failed:"failed",blocked:"blocked",ev_stopped:"stopped",idle:"idle",state_hot:"working · running hot",state_waiting_for:e=>"waiting · for "+String(e.what),state_waits_on:e=>"waiting on "+String(e.agent),state_urgent:"asks you · a tool waits for your yes",state_in_line:e=>"waits to land · "+String(e.nth),state_stopped:"stopped by you",state_starting:"starting",pill_asks_tip:e=>String(e.agent)+" asks you. click opens it",pill_failed_tip:e=>String(e.agent)+" failed. click opens it",view_bims_tip:"the agents in their office, above the list",cube_open_tip:"show the bims: your agents in their office",cube_close_tip:"hide the office",cube_label:"the bims",width_narrow:"320",width_wide:"wide",width_narrow_tip:"the bar at 320 px, the office fit to it",width_wide_tip:"the bar at 640 px while the office shows",lost:"can't draw the office here",fit:"fit",fit_tip:"back to the whole office",held_left_out:e=>e.n===1?"+"+String(e.n)+" name · hover a bim":"+"+String(e.n)+" names · hover a bim",stage_1:"a plant and a deck chair",stage_2:"the kitchen island",stage_3:"the lounge",stage_4:"the whiteboard",stage_5:"the mural and the boombox",stage_6:"a longer island",stage_7:"the terrace",stage_8:"trees all round",stage_9:"the skate ramp",stage_10:"the fountain",stage_11:"the arcade cabinet",stage_12:"the pond",stage_13:"the balloon",stage_14:"main's golden statue",stage_fruit:"a fruit bowl and a tree",stage_more_fruit:"more fruit and flowers",stage_kyoto_1:"a bonsai",stage_kyoto_2:"a bento and a maple",stage_kyoto_3:"the zabuton",stage_kyoto_4:"the slate",stage_kyoto_5:"the wave and the wind bell",stage_kyoto_6:"the matcha set",stage_kyoto_7:"the paper umbrella",stage_kyoto_8:"maples all round",stage_kyoto_9:"the go board",stage_kyoto_10:"the shishi-odoshi",stage_kyoto_11:"the arcade cabinet",stage_kyoto_12:"the koi pond",stage_kyoto_13:"the koinobori",stage_kyoto_14:"the golden maneki-neko",stage_riad_1:"a pot of mint",stage_riad_2:"the tea tray",stage_riad_3:"the poufs",stage_riad_4:"the slate",stage_riad_5:"the Berber rug and the darbouka",stage_riad_6:"a tajine and jasmine",stage_riad_7:"the awning",stage_riad_8:"the four orange trees",stage_riad_9:"the draughts table",stage_riad_10:"the fountain's second tier",stage_riad_11:"the hammam",stage_riad_12:"the zellige basin",stage_riad_13:"the balloon over the Atlas",stage_riad_14:"the golden lantern",stage_nordic_1:"a fern",stage_nordic_2:"kanelbullar and a birch",stage_nordic_3:"the sheepskins",stage_nordic_4:"the blackboard",stage_nordic_5:"the rya and the record player",stage_nordic_6:"blueberries and coffee",stage_nordic_7:"the campfire",stage_nordic_8:"firs all round",stage_nordic_9:"the kubb set",stage_nordic_10:"the hot tub",stage_nordic_11:"the sauna's porch",stage_nordic_12:"the lake and its jetty",stage_nordic_13:"the midsummer pole",stage_nordic_14:"the golden Dala horse",grow_new:e=>"new: "+String(e.thing),grow_tip:e=>e.n===1?"level "+String(e.level)+" · "+String(e.n)+" job done · next: "+String(e.thing)+" at "+String(e.at):"level "+String(e.level)+" · "+String(e.n)+" jobs done · next: "+String(e.thing)+" at "+String(e.at),grow_tip_top:e=>e.n===1?"level "+String(e.level)+" · "+String(e.n)+" job done":"level "+String(e.level)+" · "+String(e.n)+" jobs done",map_loft:"Loft",map_loft_mood:"the kitchen island in the middle, bean bags at the back",map_greenhouse:"Greenhouse",map_greenhouse_mood:"desks in a ring round a tree, glass walls",map_campus:"Campus",map_campus_mood:"pods of four, a long counter, steps to sit on",map_workshop:"Workshop",map_workshop_mood:"a garage: a workbench, ping-pong, the door rolled up",map_kyoto:"Kyoto",map_kyoto_mood:"low tables on tatami round a small garden",map_riad:"Riad",map_riad_mood:"galleries round a patio and its fountain",map_nordic:"Nordic",map_nordic_mood:"one long wooden table, a stove, a sauna outside",map_patio:"Patio",map_patio_mood:"coloured walls round a patio, hammocks for naps",map_haveli:"Haveli",map_haveli_mood:"a courtyard with arcades, a chai stall, a swing",map_tropical:"Tropical",map_tropical_mood:"desks on a curve, a juice bar, hammocks",map_cyclades:"Cyclades",map_cyclades_mood:"little white cubes up steps, blue tables",map_sahel:"Sahel",map_sahel_mood:"a shade hangar round a yard and its baobab",map_california:"California",map_california_mood:"a stucco office and a concrete skatepark",map_pick_tip:e=>"draw this project's office as the "+String(e.map),map_current_tip:e=>"this project's office is the "+String(e.map)+" now",town_label:"the town: one office per project",town_sign_tip:e=>"look inside "+String(e.project),town_sign_label:e=>String(e.project)+": "+String(e.at_work)+" working, "+String(e.asks)+" asking you",town_open:"open",town_open_tip:e=>"open "+String(e.project),town_back:"town",town_back_tip:"back to the whole town",state_skating:e=>"idle "+String(e.dur)+" · skating",trick_drop_in:"drop in",trick_pump:"pumps",trick_rock_to_fakie:"rock to fakie",trick_axle_stall:"axle stall",trick_fs_180:"frontside 180",trick_bs_180:"backside 180",trick_ollie:"ollie",trick_kickflip:"kickflip",trick_heelflip:"heelflip",trick_shove_it:"pop shove-it",trick_tre_flip:"360 flip",trick_fifty:"50-50",trick_five_o:"5-0",trick_boardslide:"boardslide",trick_nosegrind:"nosegrind",trick_manual:"manual",trick_no_comply:"no comply",trick_carve:"carve",trick_fs_air:"frontside air",trick_nine:"900"},ko=[0,1,3,6,10,15,25,40,60,100,150,250,400,600,1e3];ko.length-1;const qd=[1,3,7,14,30,60,100,365],Bg=10,Gg=30,Hg=500,S0=[0,0,0,2,2,4,4,4,8];function xl(e){return S0[Math.max(0,Math.min(e,S0.length-1))]??0}const Vg=.7,wc=3,em=3,is={stage:0,garden:0,frames:0,golden:!1,building:!1,jobs:0};function nm(e,t){let n=0;for(const i of t)e>=i&&n++;return n}function Wg(e){return Math.max(0,nm(e,ko)-1)}function im(e){if(!e)return is;const t=e.jobs_done,n=e.artifacts_made,i=Wg(t),s=ko[i+1],a=ko[i],o=s!==void 0&&a!==void 0&&t>=a+Vg*(s-a);return{stage:i,garden:nm(e.days_used,qd),frames:Math.min(Gg,Math.floor(n/Bg)),golden:n>=Hg,building:o,jobs:t}}function kg(e,t){return!e||t.stage<=e.stage?null:t.stage}const w0=[0,.15,.3,.45,.6,.8,1,1.2,1.4],Xg=1.7,zr=1.5;function $g(e){return(w0[Math.min(e.garden,w0.length-1)]??0)+(e.stage>=10?Xg:0)}function zo(e){return`${e.stage}/${e.garden}/${e.frames}/${e.golden?1:0}/${e.building?1:0}`}const Ua=Math.PI/4,Ts=Math.PI/6,Rr=60,E0=.25;function gl(e){return{x0:e.x0-1.2,x1:e.x0+e.W+1.2,z0:-1.5,z1:e.D+4.8,yLow:-1.35,yHigh:2.5}}function sm(e,t){const n=gl(e),i=$g(t);return{x0:n.x0-i,x1:n.x1+i,z0:n.z0-i/2,z1:n.z1+i/2,yLow:n.yLow,yHigh:t.stage>=13?3:n.yHigh}}function qg(e){const t=gl(e);return{...t,x0:t.x0-zr,x1:t.x1+zr,z0:t.z0-zr/2,z1:t.z1+zr/2}}const zn={x:Math.cos(Ua),y:0,z:-Math.sin(Ua)},Aa={x:-Math.sin(Ua)*Math.sin(Ts),y:Math.cos(Ts),z:-Math.cos(Ua)*Math.sin(Ts)},za={x:Math.sin(Ua)*Math.cos(Ts),y:Math.sin(Ts),z:Math.cos(Ua)*Math.cos(Ts)},Xo=(e,t)=>e.x*t.x+e.y*t.y+e.z*t.z;function mu(e,t,n){const i={x:(e.x0+e.x1)/2,y:0,z:(e.z0+e.z1)/2};let s=1/0,a=-1/0,o=1/0,r=-1/0;for(const m of[e.x0,e.x1])for(const v of[e.yLow,e.yHigh])for(const y of[e.z0,e.z1]){const g={x:m-i.x,y:v-i.y,z:y-i.z},b=Xo(g,zn),S=Xo(g,Aa);s=Math.min(s,b),a=Math.max(a,b),o=Math.min(o,S),r=Math.max(r,S)}const c=Math.max(1,t),l=a-s+2*E0,d=r-o+2*E0;let f=l/c,u=Math.ceil(d/f);n>0&&u>n&&(u=Math.floor(n),f=d/u);const h=(s+a)/2,p=(o+r)/2,_=c*f/2,x=u*f/2;return{target:i,left:h-_,right:h+_,top:p+x,bottom:p-x,scale:f,widthPx:c,heightPx:u}}function Yg(e,t,n){const i=Math.max(1,t),s=Math.max(1,n),a=mu(e,i,s),o=(a.left+a.right)/2,r=(a.top+a.bottom)/2;return{...a,left:o-i*a.scale/2,right:o+i*a.scale/2,top:r+s*a.scale/2,bottom:r-s*a.scale/2,widthPx:i,heightPx:s}}function Zg(e,t){const n=e.right-e.left,i=e.top-e.bottom,s=e.left+t.u*n,a=e.top-t.v*i,o=n/(2*t.zoom),r=i/(2*t.zoom);return{...e,left:s-o,right:s+o,top:a+r,bottom:a-r,scale:e.scale/t.zoom}}function Zi(e,t){const n={x:t.x-e.target.x,y:t.y-e.target.y,z:t.z-e.target.z};return{x:(Xo(n,zn)-e.left)/e.scale,y:(e.top-Xo(n,Aa))/e.scale}}function Kg(e,t,n=.6){const i={x:t.x-e.target.x,y:-e.target.y,z:t.z-e.target.z},s=Xo(i,Aa);return Math.max(2,(e.top-s)/Math.cos(Ts)+n)}const xu="186",Jg=0,T0=1,Qg=2,Ro=1,jg=2,_o=3,Ps=0,dn=1,wi=2,Li=0,Co=1,A0=2,z0=3,R0=4,t1=5,_a=100,e1=101,n1=102,i1=103,s1=104,a1=200,o1=201,r1=202,c1=203,am=204,om=205,l1=206,d1=207,f1=208,u1=209,h1=210,p1=211,m1=212,x1=213,g1=214,Yd=0,Zd=1,Kd=2,$o=3,Jd=4,Qd=5,jd=6,tf=7,gu=0,_1=1,v1=2,ri=0,rm=1,cm=2,lm=3,dm=4,fm=5,um=6,hm=7,pm=300,Ls=301,Oa=302,Gl=303,Hl=304,_l=306,qo=1e3,Ei=1001,ef=1002,He=1003,M1=1004,Cr=1005,Ve=1006,Vl=1007,vs=1008,yn=1009,mm=1010,xm=1011,Yo=1012,_u=1013,li=1014,si=1015,di=1016,vu=1017,Mu=1018,Zo=1020,gm=35902,_m=35899,vm=1021,Mm=1022,$n=1023,Ni=1026,Ms=1027,ym=1028,yu=1029,Is=1030,bu=1031,Su=1033,Ec=33776,Tc=33777,Ac=33778,zc=33779,nf=35840,sf=35841,af=35842,of=35843,rf=36196,cf=37492,lf=37496,df=37488,ff=37489,Bc=37490,uf=37491,hf=37808,pf=37809,mf=37810,xf=37811,gf=37812,_f=37813,vf=37814,Mf=37815,yf=37816,bf=37817,Sf=37818,wf=37819,Ef=37820,Tf=37821,Af=36492,zf=36494,Rf=36495,Cf=36283,Pf=36284,Gc=36285,Lf=36286,y1=3200,Hc=0,b1=1,ts="",cn="srgb",Vc="srgb-linear",Wc="linear",pe="srgb",Wl=7680,S1=519,w1=512,E1=513,T1=514,wu=515,A1=516,z1=517,Eu=518,R1=519,C1=35044,C0="300 es",ai=2e3,Ko=2001;function P1(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function kc(e){return document.createElementNS("http://www.w3.org/1999/xhtml",e)}function L1(){const e=kc("canvas");return e.style.display="block",e}const P0={};function L0(...e){const t="THREE."+e.shift();console.log(t,...e)}function bm(e){const t=e[0];if(typeof t=="string"&&t.startsWith("TSL:")){const n=e[1];n&&n.isStackTrace?e[0]+=" "+n.getLocation():e[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return e}function Kt(...e){e=bm(e);const t="THREE."+e.shift();{const n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function ce(...e){e=bm(e);const t="THREE."+e.shift();{const n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function Ra(...e){const t=e.join(" ");t in P0||(P0[t]=!0,Kt(...e))}function I1(e,t,n){return new Promise(function(i,s){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:s();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:i()}}setTimeout(a,n)})}const D1={[Yd]:Zd,[Kd]:jd,[Jd]:tf,[$o]:Qd,[Zd]:Yd,[jd]:Kd,[tf]:Jd,[Qd]:$o};class Xs{addEventListener(t,n){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(n)===-1&&i[t].push(n)}hasEventListener(t,n){const i=this._listeners;return i===void 0?!1:i[t]!==void 0&&i[t].indexOf(n)!==-1}removeEventListener(t,n){const i=this._listeners;if(i===void 0)return;const s=i[t];if(s!==void 0){const a=s.indexOf(n);a!==-1&&s.splice(a,1)}}dispatchEvent(t){const n=this._listeners;if(n===void 0)return;const i=n[t.type];if(i!==void 0){t.target=this;const s=i.slice(0);for(let a=0,o=s.length;a<o;a++)s[a].call(this,t);t.target=null}}}const Xe=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],kl=Math.PI/180,If=180/Math.PI;function Wa(){const e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Xe[e&255]+Xe[e>>8&255]+Xe[e>>16&255]+Xe[e>>24&255]+"-"+Xe[t&255]+Xe[t>>8&255]+"-"+Xe[t>>16&15|64]+Xe[t>>24&255]+"-"+Xe[n&63|128]+Xe[n>>8&255]+"-"+Xe[n>>16&255]+Xe[n>>24&255]+Xe[i&255]+Xe[i>>8&255]+Xe[i>>16&255]+Xe[i>>24&255]).toLowerCase()}function ae(e,t,n){return Math.max(t,Math.min(n,e))}function N1(e,t){return(e%t+t)%t}function Xl(e,t,n){return(1-n)*e+n*t}function no(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:case Uint8ClampedArray:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function rn(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}class St{static{St.prototype.isVector2=!0}constructor(t=0,n=0){this.x=t,this.y=n}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,n){return this.x=t,this.y=n,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const n=this.x,i=this.y,s=t.elements;return this.x=s[0]*n+s[3]*i+s[6],this.y=s[1]*n+s[4]*i+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,n){return this.x=ae(this.x,t.x,n.x),this.y=ae(this.y,t.y,n.y),this}clampScalar(t,n){return this.x=ae(this.x,t,n),this.y=ae(this.y,t,n),this}clampLength(t,n){const i=this.length();return this.divideScalar(i||1).multiplyScalar(ae(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const n=Math.sqrt(this.lengthSq()*t.lengthSq());if(n===0)return Math.PI/2;const i=this.dot(t)/n;return Math.acos(ae(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const n=this.x-t.x,i=this.y-t.y;return n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this}rotateAround(t,n){const i=Math.cos(n),s=Math.sin(n),a=this.x-t.x,o=this.y-t.y;return this.x=a*i-o*s+t.x,this.y=a*s+o*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class ka{constructor(t=0,n=0,i=0,s=1){this.isQuaternion=!0,this._x=t,this._y=n,this._z=i,this._w=s}static slerpFlat(t,n,i,s,a,o,r){let c=i[s+0],l=i[s+1],d=i[s+2],f=i[s+3],u=a[o+0],h=a[o+1],p=a[o+2],_=a[o+3];if(f!==_||c!==u||l!==h||d!==p){let x=c*u+l*h+d*p+f*_;x<0&&(u=-u,h=-h,p=-p,_=-_,x=-x);let m=1-r;if(x<.9995){const v=Math.acos(x),y=Math.sin(v);m=Math.sin(m*v)/y,r=Math.sin(r*v)/y,c=c*m+u*r,l=l*m+h*r,d=d*m+p*r,f=f*m+_*r}else{c=c*m+u*r,l=l*m+h*r,d=d*m+p*r,f=f*m+_*r;const v=1/Math.sqrt(c*c+l*l+d*d+f*f);c*=v,l*=v,d*=v,f*=v}}t[n]=c,t[n+1]=l,t[n+2]=d,t[n+3]=f}static multiplyQuaternionsFlat(t,n,i,s,a,o){const r=i[s],c=i[s+1],l=i[s+2],d=i[s+3],f=a[o],u=a[o+1],h=a[o+2],p=a[o+3];return t[n]=r*p+d*f+c*h-l*u,t[n+1]=c*p+d*u+l*f-r*h,t[n+2]=l*p+d*h+r*u-c*f,t[n+3]=d*p-r*f-c*u-l*h,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,n,i,s){return this._x=t,this._y=n,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,n=!0){const i=t._x,s=t._y,a=t._z,o=t._order,r=Math.cos,c=Math.sin,l=r(i/2),d=r(s/2),f=r(a/2),u=c(i/2),h=c(s/2),p=c(a/2);switch(o){case"XYZ":this._x=u*d*f+l*h*p,this._y=l*h*f-u*d*p,this._z=l*d*p+u*h*f,this._w=l*d*f-u*h*p;break;case"YXZ":this._x=u*d*f+l*h*p,this._y=l*h*f-u*d*p,this._z=l*d*p-u*h*f,this._w=l*d*f+u*h*p;break;case"ZXY":this._x=u*d*f-l*h*p,this._y=l*h*f+u*d*p,this._z=l*d*p+u*h*f,this._w=l*d*f-u*h*p;break;case"ZYX":this._x=u*d*f-l*h*p,this._y=l*h*f+u*d*p,this._z=l*d*p-u*h*f,this._w=l*d*f+u*h*p;break;case"YZX":this._x=u*d*f+l*h*p,this._y=l*h*f+u*d*p,this._z=l*d*p-u*h*f,this._w=l*d*f-u*h*p;break;case"XZY":this._x=u*d*f-l*h*p,this._y=l*h*f-u*d*p,this._z=l*d*p+u*h*f,this._w=l*d*f+u*h*p;break;default:Kt("Quaternion: .setFromEuler() encountered an unknown order: "+o)}return n===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,n){const i=n/2,s=Math.sin(i);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){const n=t.elements,i=n[0],s=n[4],a=n[8],o=n[1],r=n[5],c=n[9],l=n[2],d=n[6],f=n[10],u=i+r+f;if(u>0){const h=.5/Math.sqrt(u+1);this._w=.25/h,this._x=(d-c)*h,this._y=(a-l)*h,this._z=(o-s)*h}else if(i>r&&i>f){const h=2*Math.sqrt(1+i-r-f);this._w=(d-c)/h,this._x=.25*h,this._y=(s+o)/h,this._z=(a+l)/h}else if(r>f){const h=2*Math.sqrt(1+r-i-f);this._w=(a-l)/h,this._x=(s+o)/h,this._y=.25*h,this._z=(c+d)/h}else{const h=2*Math.sqrt(1+f-i-r);this._w=(o-s)/h,this._x=(a+l)/h,this._y=(c+d)/h,this._z=.25*h}return this._onChangeCallback(),this}setFromUnitVectors(t,n){let i=t.dot(n)+1;return i<1e-8?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*n.z-t.z*n.y,this._y=t.z*n.x-t.x*n.z,this._z=t.x*n.y-t.y*n.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(ae(this.dot(t),-1,1)))}rotateTowards(t,n){const i=this.angleTo(t);if(i===0)return this;const s=Math.min(1,n/i);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,n){const i=t._x,s=t._y,a=t._z,o=t._w,r=n._x,c=n._y,l=n._z,d=n._w;return this._x=i*d+o*r+s*l-a*c,this._y=s*d+o*c+a*r-i*l,this._z=a*d+o*l+i*c-s*r,this._w=o*d-i*r-s*c-a*l,this._onChangeCallback(),this}slerp(t,n){let i=t._x,s=t._y,a=t._z,o=t._w,r=this.dot(t);r<0&&(i=-i,s=-s,a=-a,o=-o,r=-r);let c=1-n;if(r<.9995){const l=Math.acos(r),d=Math.sin(l);c=Math.sin(c*l)/d,n=Math.sin(n*l)/d,this._x=this._x*c+i*n,this._y=this._y*c+s*n,this._z=this._z*c+a*n,this._w=this._w*c+o*n,this._onChangeCallback()}else this._x=this._x*c+i*n,this._y=this._y*c+s*n,this._z=this._z*c+a*n,this._w=this._w*c+o*n,this.normalize();return this}slerpQuaternions(t,n,i){return this.copy(t).slerp(n,i)}random(){const t=2*Math.PI*Math.random(),n=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),a=Math.sqrt(i);return this.set(s*Math.sin(t),s*Math.cos(t),a*Math.sin(n),a*Math.cos(n))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,n=0){return this._x=t[n],this._y=t[n+1],this._z=t[n+2],this._w=t[n+3],this._onChangeCallback(),this}toArray(t=[],n=0){return t[n]=this._x,t[n+1]=this._y,t[n+2]=this._z,t[n+3]=this._w,t}fromBufferAttribute(t,n){return this._x=t.getX(n),this._y=t.getY(n),this._z=t.getZ(n),this._w=t.getW(n),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class Z{static{Z.prototype.isVector3=!0}constructor(t=0,n=0,i=0){this.x=t,this.y=n,this.z=i}set(t,n,i){return i===void 0&&(i=this.z),this.x=t,this.y=n,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this.z=t.z+n.z,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this.z+=t.z*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this.z=t.z-n.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,n){return this.x=t.x*n.x,this.y=t.y*n.y,this.z=t.z*n.z,this}applyEuler(t){return this.applyQuaternion(I0.setFromEuler(t))}applyAxisAngle(t,n){return this.applyQuaternion(I0.setFromAxisAngle(t,n))}applyMatrix3(t){const n=this.x,i=this.y,s=this.z,a=t.elements;return this.x=a[0]*n+a[3]*i+a[6]*s,this.y=a[1]*n+a[4]*i+a[7]*s,this.z=a[2]*n+a[5]*i+a[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const n=this.x,i=this.y,s=this.z,a=t.elements,o=1/(a[3]*n+a[7]*i+a[11]*s+a[15]);return this.x=(a[0]*n+a[4]*i+a[8]*s+a[12])*o,this.y=(a[1]*n+a[5]*i+a[9]*s+a[13])*o,this.z=(a[2]*n+a[6]*i+a[10]*s+a[14])*o,this}applyQuaternion(t){const n=this.x,i=this.y,s=this.z,a=t.x,o=t.y,r=t.z,c=t.w,l=2*(o*s-r*i),d=2*(r*n-a*s),f=2*(a*i-o*n);return this.x=n+c*l+o*f-r*d,this.y=i+c*d+r*l-a*f,this.z=s+c*f+a*d-o*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const n=this.x,i=this.y,s=this.z,a=t.elements;return this.x=a[0]*n+a[4]*i+a[8]*s,this.y=a[1]*n+a[5]*i+a[9]*s,this.z=a[2]*n+a[6]*i+a[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,n){return this.x=ae(this.x,t.x,n.x),this.y=ae(this.y,t.y,n.y),this.z=ae(this.z,t.z,n.z),this}clampScalar(t,n){return this.x=ae(this.x,t,n),this.y=ae(this.y,t,n),this.z=ae(this.z,t,n),this}clampLength(t,n){const i=this.length();return this.divideScalar(i||1).multiplyScalar(ae(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this.z+=(t.z-this.z)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this.z=t.z+(n.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,n){const i=t.x,s=t.y,a=t.z,o=n.x,r=n.y,c=n.z;return this.x=s*c-a*r,this.y=a*o-i*c,this.z=i*r-s*o,this}projectOnVector(t){const n=t.lengthSq();if(n===0)return this.set(0,0,0);const i=t.dot(this)/n;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return $l.copy(this).projectOnVector(t),this.sub($l)}reflect(t){return this.sub($l.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const n=Math.sqrt(this.lengthSq()*t.lengthSq());if(n===0)return Math.PI/2;const i=this.dot(t)/n;return Math.acos(ae(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const n=this.x-t.x,i=this.y-t.y,s=this.z-t.z;return n*n+i*i+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,n,i){const s=Math.sin(n)*t;return this.x=s*Math.sin(i),this.y=Math.cos(n)*t,this.z=s*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,n,i){return this.x=t*Math.sin(n),this.y=i,this.z=t*Math.cos(n),this}setFromMatrixPosition(t){const n=t.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this}setFromMatrixScale(t){const n=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=n,this.y=i,this.z=s,this}setFromMatrixColumn(t,n){return this.fromArray(t.elements,n*4)}setFromMatrix3Column(t,n){return this.fromArray(t.elements,n*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this.z=t[n+2],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t[n+2]=this.z,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this.z=t.getZ(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,n=Math.random()*2-1,i=Math.sqrt(1-n*n);return this.x=i*Math.cos(t),this.y=n,this.z=i*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const $l=new Z,I0=new ka;class jt{static{jt.prototype.isMatrix3=!0}constructor(t,n,i,s,a,o,r,c,l){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,n,i,s,a,o,r,c,l)}set(t,n,i,s,a,o,r,c,l){const d=this.elements;return d[0]=t,d[1]=s,d[2]=r,d[3]=n,d[4]=a,d[5]=c,d[6]=i,d[7]=o,d[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const n=this.elements,i=t.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],this}extractBasis(t,n,i){return t.setFromMatrix3Column(this,0),n.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const n=t.elements;return this.set(n[0],n[4],n[8],n[1],n[5],n[9],n[2],n[6],n[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,n){const i=t.elements,s=n.elements,a=this.elements,o=i[0],r=i[3],c=i[6],l=i[1],d=i[4],f=i[7],u=i[2],h=i[5],p=i[8],_=s[0],x=s[3],m=s[6],v=s[1],y=s[4],g=s[7],b=s[2],S=s[5],E=s[8];return a[0]=o*_+r*v+c*b,a[3]=o*x+r*y+c*S,a[6]=o*m+r*g+c*E,a[1]=l*_+d*v+f*b,a[4]=l*x+d*y+f*S,a[7]=l*m+d*g+f*E,a[2]=u*_+h*v+p*b,a[5]=u*x+h*y+p*S,a[8]=u*m+h*g+p*E,this}multiplyScalar(t){const n=this.elements;return n[0]*=t,n[3]*=t,n[6]*=t,n[1]*=t,n[4]*=t,n[7]*=t,n[2]*=t,n[5]*=t,n[8]*=t,this}determinant(){const t=this.elements,n=t[0],i=t[1],s=t[2],a=t[3],o=t[4],r=t[5],c=t[6],l=t[7],d=t[8];return n*o*d-n*r*l-i*a*d+i*r*c+s*a*l-s*o*c}invert(){const t=this.elements,n=t[0],i=t[1],s=t[2],a=t[3],o=t[4],r=t[5],c=t[6],l=t[7],d=t[8],f=d*o-r*l,u=r*c-d*a,h=l*a-o*c,p=n*f+i*u+s*h;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/p;return t[0]=f*_,t[1]=(s*l-d*i)*_,t[2]=(r*i-s*o)*_,t[3]=u*_,t[4]=(d*n-s*c)*_,t[5]=(s*a-r*n)*_,t[6]=h*_,t[7]=(i*c-l*n)*_,t[8]=(o*n-i*a)*_,this}transpose(){let t;const n=this.elements;return t=n[1],n[1]=n[3],n[3]=t,t=n[2],n[2]=n[6],n[6]=t,t=n[5],n[5]=n[7],n[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const n=this.elements;return t[0]=n[0],t[1]=n[3],t[2]=n[6],t[3]=n[1],t[4]=n[4],t[5]=n[7],t[6]=n[2],t[7]=n[5],t[8]=n[8],this}setUvTransform(t,n,i,s,a,o,r){const c=Math.cos(a),l=Math.sin(a);return this.set(i*c,i*l,-i*(c*o+l*r)+o+t,-s*l,s*c,-s*(-l*o+c*r)+r+n,0,0,1),this}scale(t,n){return Ra("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(ql.makeScale(t,n)),this}rotate(t){return Ra("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(ql.makeRotation(-t)),this}translate(t,n){return Ra("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(ql.makeTranslation(t,n)),this}makeTranslation(t,n){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,n,0,0,1),this}makeRotation(t){const n=Math.cos(t),i=Math.sin(t);return this.set(n,-i,0,i,n,0,0,0,1),this}makeScale(t,n){return this.set(t,0,0,0,n,0,0,0,1),this}equals(t){const n=this.elements,i=t.elements;for(let s=0;s<9;s++)if(n[s]!==i[s])return!1;return!0}fromArray(t,n=0){for(let i=0;i<9;i++)this.elements[i]=t[i+n];return this}toArray(t=[],n=0){const i=this.elements;return t[n]=i[0],t[n+1]=i[1],t[n+2]=i[2],t[n+3]=i[3],t[n+4]=i[4],t[n+5]=i[5],t[n+6]=i[6],t[n+7]=i[7],t[n+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const ql=new jt,D0=new jt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),N0=new jt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function U1(){const e={enabled:!0,workingColorSpace:Vc,spaces:{},convert:function(s,a,o){return this.enabled===!1||a===o||!a||!o||(this.spaces[a].transfer===pe&&(s.r=Ii(s.r),s.g=Ii(s.g),s.b=Ii(s.b)),this.spaces[a].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[a].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===pe&&(s.r=Ca(s.r),s.g=Ca(s.g),s.b=Ca(s.b))),s},workingToColorSpace:function(s,a){return this.convert(s,this.workingColorSpace,a)},colorSpaceToWorking:function(s,a){return this.convert(s,a,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===ts?Wc:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,a=this.workingColorSpace){return s.fromArray(this.spaces[a].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,a,o){return s.copy(this.spaces[a].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,a){return Ra("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),e.workingToColorSpace(s,a)},toWorkingColorSpace:function(s,a){return Ra("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),e.colorSpaceToWorking(s,a)}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],i=[.3127,.329];return e.define({[Vc]:{primaries:t,whitePoint:i,transfer:Wc,toXYZ:D0,fromXYZ:N0,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:cn},outputColorSpaceConfig:{drawingBufferColorSpace:cn}},[cn]:{primaries:t,whitePoint:i,transfer:pe,toXYZ:D0,fromXYZ:N0,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:cn}}}),e}const oe=U1();function Ii(e){return e<.04045?e*.0773993808:Math.pow(e*.9478672986+.0521327014,2.4)}function Ca(e){return e<.0031308?e*12.92:1.055*Math.pow(e,.41666)-.055}let ea;class O1{static getDataURL(t,n="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let i;if(t instanceof HTMLCanvasElement)i=t;else{ea===void 0&&(ea=kc("canvas")),ea.width=t.width,ea.height=t.height;const s=ea.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),i=ea}return i.toDataURL(n)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const n=kc("canvas");n.width=t.width,n.height=t.height;const i=n.getContext("2d");i.drawImage(t,0,0,t.width,t.height);const s=i.getImageData(0,0,t.width,t.height),a=s.data;for(let o=0;o<a.length;o++)a[o]=Ii(a[o]/255)*255;return i.putImageData(s,0,0),n}else if(t.data){const n=t.data.slice(0);for(let i=0;i<n.length;i++)n instanceof Uint8Array||n instanceof Uint8ClampedArray?n[i]=Math.floor(Ii(n[i]/255)*255):n[i]=Ii(n[i]);return{data:n,width:t.width,height:t.height}}else return Kt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let F1=0;class Tu{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:F1++}),this.uuid=Wa(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){const n=this.data;return typeof HTMLVideoElement<"u"&&n instanceof HTMLVideoElement?t.set(n.videoWidth,n.videoHeight,0):typeof VideoFrame<"u"&&n instanceof VideoFrame?t.set(n.displayWidth,n.displayHeight,0):n!==null?t.set(n.width,n.height,n.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const n=t===void 0||typeof t=="string";if(!n&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let a;if(Array.isArray(s)){a=[];for(let o=0,r=s.length;o<r;o++)s[o].isDataTexture?a.push(Yl(s[o].image)):a.push(Yl(s[o]))}else a=Yl(s);i.url=a}return n||(t.images[this.uuid]=i),i}}function Yl(e){return typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap?O1.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(Kt("Texture: Unable to serialize Texture."),{})}let B1=0;const Zl=new Z;class Qe extends Xs{constructor(t=Qe.DEFAULT_IMAGE,n=Qe.DEFAULT_MAPPING,i=Ei,s=Ei,a=Ve,o=vs,r=$n,c=yn,l=Qe.DEFAULT_ANISOTROPY,d=ts){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:B1++}),this.uuid=Wa(),this.name="",this.source=new Tu(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=a,this.minFilter=o,this.anisotropy=l,this.format=r,this.internalFormat=null,this.type=c,this.offset=new St(0,0),this.repeat=new St(1,1),this.center=new St(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new jt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=d,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Zl).x}get height(){return this.source.getSize(Zl).y}get depth(){return this.source.getSize(Zl).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,n){this.updateRanges.push({start:t,count:n})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(const n in t){const i=t[n];if(i===void 0){Kt(`Texture.setValues(): parameter '${n}' has value of undefined.`);continue}const s=this[n];if(s===void 0){Kt(`Texture.setValues(): property '${n}' does not exist.`);continue}s&&i&&s.isVector2&&i.isVector2||s&&i&&s.isVector3&&i.isVector3||s&&i&&s.isMatrix3&&i.isMatrix3?s.copy(i):this[n]=i}}toJSON(t){const n=t===void 0||typeof t=="string";if(!n&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),n||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==pm)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case qo:t.x=t.x-Math.floor(t.x);break;case Ei:t.x=t.x<0?0:1;break;case ef:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case qo:t.y=t.y-Math.floor(t.y);break;case Ei:t.y=t.y<0?0:1;break;case ef:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Qe.DEFAULT_IMAGE=null;Qe.DEFAULT_MAPPING=pm;Qe.DEFAULT_ANISOTROPY=1;class Ee{static{Ee.prototype.isVector4=!0}constructor(t=0,n=0,i=0,s=1){this.x=t,this.y=n,this.z=i,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,n,i,s){return this.x=t,this.y=n,this.z=i,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;case 3:this.w=n;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this.z=t.z+n.z,this.w=t.w+n.w,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this.z+=t.z*n,this.w+=t.w*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this.z=t.z-n.z,this.w=t.w-n.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const n=this.x,i=this.y,s=this.z,a=this.w,o=t.elements;return this.x=o[0]*n+o[4]*i+o[8]*s+o[12]*a,this.y=o[1]*n+o[5]*i+o[9]*s+o[13]*a,this.z=o[2]*n+o[6]*i+o[10]*s+o[14]*a,this.w=o[3]*n+o[7]*i+o[11]*s+o[15]*a,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const n=Math.sqrt(1-t.w*t.w);return n<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/n,this.y=t.y/n,this.z=t.z/n),this}setAxisAngleFromRotationMatrix(t){let n,i,s,a;const c=t.elements,l=c[0],d=c[4],f=c[8],u=c[1],h=c[5],p=c[9],_=c[2],x=c[6],m=c[10];if(Math.abs(d-u)<.01&&Math.abs(f-_)<.01&&Math.abs(p-x)<.01){if(Math.abs(d+u)<.1&&Math.abs(f+_)<.1&&Math.abs(p+x)<.1&&Math.abs(l+h+m-3)<.1)return this.set(1,0,0,0),this;n=Math.PI;const y=(l+1)/2,g=(h+1)/2,b=(m+1)/2,S=(d+u)/4,E=(f+_)/4,M=(p+x)/4;return y>g&&y>b?y<.01?(i=0,s=.707106781,a=.707106781):(i=Math.sqrt(y),s=S/i,a=E/i):g>b?g<.01?(i=.707106781,s=0,a=.707106781):(s=Math.sqrt(g),i=S/s,a=M/s):b<.01?(i=.707106781,s=.707106781,a=0):(a=Math.sqrt(b),i=E/a,s=M/a),this.set(i,s,a,n),this}let v=Math.sqrt((x-p)*(x-p)+(f-_)*(f-_)+(u-d)*(u-d));return Math.abs(v)<.001&&(v=1),this.x=(x-p)/v,this.y=(f-_)/v,this.z=(u-d)/v,this.w=Math.acos((l+h+m-1)/2),this}setFromMatrixPosition(t){const n=t.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this.w=n[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,n){return this.x=ae(this.x,t.x,n.x),this.y=ae(this.y,t.y,n.y),this.z=ae(this.z,t.z,n.z),this.w=ae(this.w,t.w,n.w),this}clampScalar(t,n){return this.x=ae(this.x,t,n),this.y=ae(this.y,t,n),this.z=ae(this.z,t,n),this.w=ae(this.w,t,n),this}clampLength(t,n){const i=this.length();return this.divideScalar(i||1).multiplyScalar(ae(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this.z+=(t.z-this.z)*n,this.w+=(t.w-this.w)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this.z=t.z+(n.z-t.z)*i,this.w=t.w+(n.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this.z=t[n+2],this.w=t[n+3],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t[n+2]=this.z,t[n+3]=this.w,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this.z=t.getZ(n),this.w=t.getW(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class G1 extends Xs{constructor(t=1,n=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Ve,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=t,this.height=n,this.depth=i.depth,this.scissor=new Ee(0,0,t,n),this.scissorTest=!1,this.viewport=new Ee(0,0,t,n),this.textures=[];const s={width:t,height:n,depth:i.depth},a=new Qe(s),o=i.count;for(let r=0;r<o;r++)this.textures[r]=a.clone(),this.textures[r].isRenderTargetTexture=!0,this.textures[r].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(t={}){const n={minFilter:Ve,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(n.mapping=t.mapping),t.wrapS!==void 0&&(n.wrapS=t.wrapS),t.wrapT!==void 0&&(n.wrapT=t.wrapT),t.wrapR!==void 0&&(n.wrapR=t.wrapR),t.magFilter!==void 0&&(n.magFilter=t.magFilter),t.minFilter!==void 0&&(n.minFilter=t.minFilter),t.format!==void 0&&(n.format=t.format),t.type!==void 0&&(n.type=t.type),t.anisotropy!==void 0&&(n.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(n.colorSpace=t.colorSpace),t.flipY!==void 0&&(n.flipY=t.flipY),t.generateMipmaps!==void 0&&(n.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(n.internalFormat=t.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(n)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,n,i=1){if(this.width!==t||this.height!==n||this.depth!==i){this.width=t,this.height=n,this.depth=i;for(let s=0,a=this.textures.length;s<a;s++)this.textures[s].image.width=t,this.textures[s].image.height=n,this.textures[s].image.depth=i,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,n),this.scissor.set(0,0,t,n)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,i=t.textures.length;n<i;n++){this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0,this.textures[n].renderTarget=this;const s=Object.assign({},t.textures[n].image);this.textures[n].source=new Tu(s)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){const n=t.depthTexture.clone();n.renderTarget=null,this.depthTexture=n}else this.depthTexture=t.depthTexture;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class qn extends G1{constructor(t=1,n=1,i={}){super(t,n,i),this.isWebGLRenderTarget=!0}}class Sm extends Qe{constructor(t=null,n=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:n,height:i,depth:s},this.magFilter=He,this.minFilter=He,this.wrapR=Ei,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class H1 extends Qe{constructor(t=null,n=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:n,height:i,depth:s},this.magFilter=He,this.minFilter=He,this.wrapR=Ei,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}}class be{static{be.prototype.isMatrix4=!0}constructor(t,n,i,s,a,o,r,c,l,d,f,u,h,p,_,x){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,n,i,s,a,o,r,c,l,d,f,u,h,p,_,x)}set(t,n,i,s,a,o,r,c,l,d,f,u,h,p,_,x){const m=this.elements;return m[0]=t,m[4]=n,m[8]=i,m[12]=s,m[1]=a,m[5]=o,m[9]=r,m[13]=c,m[2]=l,m[6]=d,m[10]=f,m[14]=u,m[3]=h,m[7]=p,m[11]=_,m[15]=x,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new be().fromArray(this.elements)}copy(t){const n=this.elements,i=t.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],n[9]=i[9],n[10]=i[10],n[11]=i[11],n[12]=i[12],n[13]=i[13],n[14]=i[14],n[15]=i[15],this}copyPosition(t){const n=this.elements,i=t.elements;return n[12]=i[12],n[13]=i[13],n[14]=i[14],this}setFromMatrix3(t){const n=t.elements;return this.set(n[0],n[3],n[6],0,n[1],n[4],n[7],0,n[2],n[5],n[8],0,0,0,0,1),this}extractBasis(t,n,i){return this.determinantAffine()===0?(t.set(1,0,0),n.set(0,1,0),i.set(0,0,1),this):(t.setFromMatrixColumn(this,0),n.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(t,n,i){return this.set(t.x,n.x,i.x,0,t.y,n.y,i.y,0,t.z,n.z,i.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();const n=this.elements,i=t.elements,s=1/na.setFromMatrixColumn(t,0).length(),a=1/na.setFromMatrixColumn(t,1).length(),o=1/na.setFromMatrixColumn(t,2).length();return n[0]=i[0]*s,n[1]=i[1]*s,n[2]=i[2]*s,n[3]=0,n[4]=i[4]*a,n[5]=i[5]*a,n[6]=i[6]*a,n[7]=0,n[8]=i[8]*o,n[9]=i[9]*o,n[10]=i[10]*o,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromEuler(t){const n=this.elements,i=t.x,s=t.y,a=t.z,o=Math.cos(i),r=Math.sin(i),c=Math.cos(s),l=Math.sin(s),d=Math.cos(a),f=Math.sin(a);if(t.order==="XYZ"){const u=o*d,h=o*f,p=r*d,_=r*f;n[0]=c*d,n[4]=-c*f,n[8]=l,n[1]=h+p*l,n[5]=u-_*l,n[9]=-r*c,n[2]=_-u*l,n[6]=p+h*l,n[10]=o*c}else if(t.order==="YXZ"){const u=c*d,h=c*f,p=l*d,_=l*f;n[0]=u+_*r,n[4]=p*r-h,n[8]=o*l,n[1]=o*f,n[5]=o*d,n[9]=-r,n[2]=h*r-p,n[6]=_+u*r,n[10]=o*c}else if(t.order==="ZXY"){const u=c*d,h=c*f,p=l*d,_=l*f;n[0]=u-_*r,n[4]=-o*f,n[8]=p+h*r,n[1]=h+p*r,n[5]=o*d,n[9]=_-u*r,n[2]=-o*l,n[6]=r,n[10]=o*c}else if(t.order==="ZYX"){const u=o*d,h=o*f,p=r*d,_=r*f;n[0]=c*d,n[4]=p*l-h,n[8]=u*l+_,n[1]=c*f,n[5]=_*l+u,n[9]=h*l-p,n[2]=-l,n[6]=r*c,n[10]=o*c}else if(t.order==="YZX"){const u=o*c,h=o*l,p=r*c,_=r*l;n[0]=c*d,n[4]=_-u*f,n[8]=p*f+h,n[1]=f,n[5]=o*d,n[9]=-r*d,n[2]=-l*d,n[6]=h*f+p,n[10]=u-_*f}else if(t.order==="XZY"){const u=o*c,h=o*l,p=r*c,_=r*l;n[0]=c*d,n[4]=-f,n[8]=l*d,n[1]=u*f+_,n[5]=o*d,n[9]=h*f-p,n[2]=p*f-h,n[6]=r*d,n[10]=_*f+u}return n[3]=0,n[7]=0,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromQuaternion(t){return this.compose(V1,t,W1)}lookAt(t,n,i){const s=this.elements;return hn.subVectors(t,n),hn.lengthSq()===0&&(hn.z=1),hn.normalize(),Gi.crossVectors(i,hn),Gi.lengthSq()===0&&(Math.abs(i.z)===1?hn.x+=1e-4:hn.z+=1e-4,hn.normalize(),Gi.crossVectors(i,hn)),Gi.normalize(),Pr.crossVectors(hn,Gi),s[0]=Gi.x,s[4]=Pr.x,s[8]=hn.x,s[1]=Gi.y,s[5]=Pr.y,s[9]=hn.y,s[2]=Gi.z,s[6]=Pr.z,s[10]=hn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,n){const i=t.elements,s=n.elements,a=this.elements,o=i[0],r=i[4],c=i[8],l=i[12],d=i[1],f=i[5],u=i[9],h=i[13],p=i[2],_=i[6],x=i[10],m=i[14],v=i[3],y=i[7],g=i[11],b=i[15],S=s[0],E=s[4],M=s[8],T=s[12],z=s[1],R=s[5],D=s[9],O=s[13],C=s[2],F=s[6],W=s[10],U=s[14],B=s[3],P=s[7],H=s[11],k=s[15];return a[0]=o*S+r*z+c*C+l*B,a[4]=o*E+r*R+c*F+l*P,a[8]=o*M+r*D+c*W+l*H,a[12]=o*T+r*O+c*U+l*k,a[1]=d*S+f*z+u*C+h*B,a[5]=d*E+f*R+u*F+h*P,a[9]=d*M+f*D+u*W+h*H,a[13]=d*T+f*O+u*U+h*k,a[2]=p*S+_*z+x*C+m*B,a[6]=p*E+_*R+x*F+m*P,a[10]=p*M+_*D+x*W+m*H,a[14]=p*T+_*O+x*U+m*k,a[3]=v*S+y*z+g*C+b*B,a[7]=v*E+y*R+g*F+b*P,a[11]=v*M+y*D+g*W+b*H,a[15]=v*T+y*O+g*U+b*k,this}multiplyScalar(t){const n=this.elements;return n[0]*=t,n[4]*=t,n[8]*=t,n[12]*=t,n[1]*=t,n[5]*=t,n[9]*=t,n[13]*=t,n[2]*=t,n[6]*=t,n[10]*=t,n[14]*=t,n[3]*=t,n[7]*=t,n[11]*=t,n[15]*=t,this}determinant(){const t=this.elements,n=t[0],i=t[4],s=t[8],a=t[12],o=t[1],r=t[5],c=t[9],l=t[13],d=t[2],f=t[6],u=t[10],h=t[14],p=t[3],_=t[7],x=t[11],m=t[15],v=c*h-l*u,y=r*h-l*f,g=r*u-c*f,b=o*h-l*d,S=o*u-c*d,E=o*f-r*d;return n*(_*v-x*y+m*g)-i*(p*v-x*b+m*S)+s*(p*y-_*b+m*E)-a*(p*g-_*S+x*E)}determinantAffine(){const t=this.elements,n=t[0],i=t[4],s=t[8],a=t[1],o=t[5],r=t[9],c=t[2],l=t[6],d=t[10];return n*(o*d-r*l)-i*(a*d-r*c)+s*(a*l-o*c)}transpose(){const t=this.elements;let n;return n=t[1],t[1]=t[4],t[4]=n,n=t[2],t[2]=t[8],t[8]=n,n=t[6],t[6]=t[9],t[9]=n,n=t[3],t[3]=t[12],t[12]=n,n=t[7],t[7]=t[13],t[13]=n,n=t[11],t[11]=t[14],t[14]=n,this}setPosition(t,n,i){const s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=n,s[14]=i),this}invert(){const t=this.elements,n=t[0],i=t[1],s=t[2],a=t[3],o=t[4],r=t[5],c=t[6],l=t[7],d=t[8],f=t[9],u=t[10],h=t[11],p=t[12],_=t[13],x=t[14],m=t[15],v=n*r-i*o,y=n*c-s*o,g=n*l-a*o,b=i*c-s*r,S=i*l-a*r,E=s*l-a*c,M=d*_-f*p,T=d*x-u*p,z=d*m-h*p,R=f*x-u*_,D=f*m-h*_,O=u*m-h*x,C=v*O-y*D+g*R+b*z-S*T+E*M;if(C===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const F=1/C;return t[0]=(r*O-c*D+l*R)*F,t[1]=(s*D-i*O-a*R)*F,t[2]=(_*E-x*S+m*b)*F,t[3]=(u*S-f*E-h*b)*F,t[4]=(c*z-o*O-l*T)*F,t[5]=(n*O-s*z+a*T)*F,t[6]=(x*g-p*E-m*y)*F,t[7]=(d*E-u*g+h*y)*F,t[8]=(o*D-r*z+l*M)*F,t[9]=(i*z-n*D-a*M)*F,t[10]=(p*S-_*g+m*v)*F,t[11]=(f*g-d*S-h*v)*F,t[12]=(r*T-o*R-c*M)*F,t[13]=(n*R-i*T+s*M)*F,t[14]=(_*y-p*b-x*v)*F,t[15]=(d*b-f*y+u*v)*F,this}scale(t){const n=this.elements,i=t.x,s=t.y,a=t.z;return n[0]*=i,n[4]*=s,n[8]*=a,n[1]*=i,n[5]*=s,n[9]*=a,n[2]*=i,n[6]*=s,n[10]*=a,n[3]*=i,n[7]*=s,n[11]*=a,this}getMaxScaleOnAxis(){const t=this.elements,n=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(n,i,s))}makeTranslation(t,n,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,n,0,0,1,i,0,0,0,1),this}makeRotationX(t){const n=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,n,-i,0,0,i,n,0,0,0,0,1),this}makeRotationY(t){const n=Math.cos(t),i=Math.sin(t);return this.set(n,0,i,0,0,1,0,0,-i,0,n,0,0,0,0,1),this}makeRotationZ(t){const n=Math.cos(t),i=Math.sin(t);return this.set(n,-i,0,0,i,n,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,n){const i=Math.cos(n),s=Math.sin(n),a=1-i,o=t.x,r=t.y,c=t.z,l=a*o,d=a*r;return this.set(l*o+i,l*r-s*c,l*c+s*r,0,l*r+s*c,d*r+i,d*c-s*o,0,l*c-s*r,d*c+s*o,a*c*c+i,0,0,0,0,1),this}makeScale(t,n,i){return this.set(t,0,0,0,0,n,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,n,i,s,a,o){return this.set(1,i,a,0,t,1,o,0,n,s,1,0,0,0,0,1),this}compose(t,n,i){const s=this.elements,a=n._x,o=n._y,r=n._z,c=n._w,l=a+a,d=o+o,f=r+r,u=a*l,h=a*d,p=a*f,_=o*d,x=o*f,m=r*f,v=c*l,y=c*d,g=c*f,b=i.x,S=i.y,E=i.z;return s[0]=(1-(_+m))*b,s[1]=(h+g)*b,s[2]=(p-y)*b,s[3]=0,s[4]=(h-g)*S,s[5]=(1-(u+m))*S,s[6]=(x+v)*S,s[7]=0,s[8]=(p+y)*E,s[9]=(x-v)*E,s[10]=(1-(u+_))*E,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,n,i){const s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];const a=this.determinantAffine();if(a===0)return i.set(1,1,1),n.identity(),this;let o=na.set(s[0],s[1],s[2]).length();const r=na.set(s[4],s[5],s[6]).length(),c=na.set(s[8],s[9],s[10]).length();a<0&&(o=-o),On.copy(this);const l=1/o,d=1/r,f=1/c;return On.elements[0]*=l,On.elements[1]*=l,On.elements[2]*=l,On.elements[4]*=d,On.elements[5]*=d,On.elements[6]*=d,On.elements[8]*=f,On.elements[9]*=f,On.elements[10]*=f,n.setFromRotationMatrix(On),i.x=o,i.y=r,i.z=c,this}makePerspective(t,n,i,s,a,o,r=ai,c=!1){const l=this.elements,d=2*a/(n-t),f=2*a/(i-s),u=(n+t)/(n-t),h=(i+s)/(i-s);let p,_;if(c)p=a/(o-a),_=o*a/(o-a);else if(r===ai)p=-(o+a)/(o-a),_=-2*o*a/(o-a);else if(r===Ko)p=-o/(o-a),_=-o*a/(o-a);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+r);return l[0]=d,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=f,l[9]=h,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=_,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,n,i,s,a,o,r=ai,c=!1){const l=this.elements,d=2/(n-t),f=2/(i-s),u=-(n+t)/(n-t),h=-(i+s)/(i-s);let p,_;if(c)p=1/(o-a),_=o/(o-a);else if(r===ai)p=-2/(o-a),_=-(o+a)/(o-a);else if(r===Ko)p=-1/(o-a),_=-a/(o-a);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+r);return l[0]=d,l[4]=0,l[8]=0,l[12]=u,l[1]=0,l[5]=f,l[9]=0,l[13]=h,l[2]=0,l[6]=0,l[10]=p,l[14]=_,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const n=this.elements,i=t.elements;for(let s=0;s<16;s++)if(n[s]!==i[s])return!1;return!0}fromArray(t,n=0){for(let i=0;i<16;i++)this.elements[i]=t[i+n];return this}toArray(t=[],n=0){const i=this.elements;return t[n]=i[0],t[n+1]=i[1],t[n+2]=i[2],t[n+3]=i[3],t[n+4]=i[4],t[n+5]=i[5],t[n+6]=i[6],t[n+7]=i[7],t[n+8]=i[8],t[n+9]=i[9],t[n+10]=i[10],t[n+11]=i[11],t[n+12]=i[12],t[n+13]=i[13],t[n+14]=i[14],t[n+15]=i[15],t}}const na=new Z,On=new be,V1=new Z(0,0,0),W1=new Z(1,1,1),Gi=new Z,Pr=new Z,hn=new Z,U0=new be,O0=new ka;class Ui{constructor(t=0,n=0,i=0,s=Ui.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=i,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,n,i,s=this._order){return this._x=t,this._y=n,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,n=this._order,i=!0){const s=t.elements,a=s[0],o=s[4],r=s[8],c=s[1],l=s[5],d=s[9],f=s[2],u=s[6],h=s[10];switch(n){case"XYZ":this._y=Math.asin(ae(r,-1,1)),Math.abs(r)<.9999999?(this._x=Math.atan2(-d,h),this._z=Math.atan2(-o,a)):(this._x=Math.atan2(u,l),this._z=0);break;case"YXZ":this._x=Math.asin(-ae(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(r,h),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-f,a),this._z=0);break;case"ZXY":this._x=Math.asin(ae(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-f,h),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,a));break;case"ZYX":this._y=Math.asin(-ae(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(u,h),this._z=Math.atan2(c,a)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(ae(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-d,l),this._y=Math.atan2(-f,a)):(this._x=0,this._y=Math.atan2(r,h));break;case"XZY":this._z=Math.asin(-ae(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(u,l),this._y=Math.atan2(r,a)):(this._x=Math.atan2(-d,h),this._y=0);break;default:Kt("Euler: .setFromRotationMatrix() encountered an unknown order: "+n)}return this._order=n,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,n,i){return U0.makeRotationFromQuaternion(t),this.setFromRotationMatrix(U0,n,i)}setFromVector3(t,n=this._order){return this.set(t.x,t.y,t.z,n)}reorder(t){return O0.setFromEuler(this),this.setFromQuaternion(O0,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],n=0){return t[n]=this._x,t[n+1]=this._y,t[n+2]=this._z,t[n+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Ui.DEFAULT_ORDER="XYZ";class wm{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let k1=0;const F0=new Z,ia=new ka,gi=new be,Lr=new Z,io=new Z,X1=new Z,$1=new ka,B0=new Z(1,0,0),G0=new Z(0,1,0),H0=new Z(0,0,1),V0={type:"added"},q1={type:"removed"},sa={type:"childadded",child:null},Kl={type:"childremoved",child:null};class We extends Xs{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:k1++}),this.uuid=Wa(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=We.DEFAULT_UP.clone();const t=new Z,n=new Ui,i=new ka,s=new Z(1,1,1);function a(){i.setFromEuler(n,!1)}function o(){n.setFromQuaternion(i,void 0,!1)}n._onChange(a),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new be},normalMatrix:{value:new jt}}),this.matrix=new be,this.matrixWorld=new be,this.matrixAutoUpdate=We.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=We.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new wm,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,n){this.quaternion.setFromAxisAngle(t,n)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,n){return ia.setFromAxisAngle(t,n),this.quaternion.multiply(ia),this}rotateOnWorldAxis(t,n){return ia.setFromAxisAngle(t,n),this.quaternion.premultiply(ia),this}rotateX(t){return this.rotateOnAxis(B0,t)}rotateY(t){return this.rotateOnAxis(G0,t)}rotateZ(t){return this.rotateOnAxis(H0,t)}translateOnAxis(t,n){return F0.copy(t).applyQuaternion(this.quaternion),this.position.add(F0.multiplyScalar(n)),this}translateX(t){return this.translateOnAxis(B0,t)}translateY(t){return this.translateOnAxis(G0,t)}translateZ(t){return this.translateOnAxis(H0,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(gi.copy(this.matrixWorld).invert())}lookAt(t,n,i){t.isVector3?Lr.copy(t):Lr.set(t,n,i);const s=this.parent;this.updateWorldMatrix(!0,!1),io.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?gi.lookAt(io,Lr,this.up):gi.lookAt(Lr,io,this.up),this.quaternion.setFromRotationMatrix(gi),s&&(gi.extractRotation(s.matrixWorld),ia.setFromRotationMatrix(gi),this.quaternion.premultiply(ia.invert()))}add(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.add(arguments[n]);return this}return t===this?(ce("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(V0),sa.child=t,this.dispatchEvent(sa),sa.child=null):ce("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const n=this.children.indexOf(t);return n!==-1&&(t.parent=null,this.children.splice(n,1),t.dispatchEvent(q1),Kl.child=t,this.dispatchEvent(Kl),Kl.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),gi.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),gi.multiply(t.parent.matrixWorld)),t.applyMatrix4(gi),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(V0),sa.child=t,this.dispatchEvent(sa),sa.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,n){if(this[t]===n)return this;for(let i=0,s=this.children.length;i<s;i++){const o=this.children[i].getObjectByProperty(t,n);if(o!==void 0)return o}}getObjectsByProperty(t,n,i=[]){this[t]===n&&i.push(this);const s=this.children;for(let a=0,o=s.length;a<o;a++)s[a].getObjectsByProperty(t,n,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(io,t,X1),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(io,$1,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const n=this.matrixWorld.elements;return t.set(n[8],n[9],n[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(t){t(this);const n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].traverseVisible(t)}traverseAncestors(t){const n=this.parent;n!==null&&(t(n),n.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const t=this.pivot;if(t!==null){const n=t.x,i=t.y,s=t.z,a=this.matrix.elements;a[12]+=n-a[0]*n-a[4]*i-a[8]*s,a[13]+=i-a[1]*n-a[5]*i-a[9]*s,a[14]+=s-a[2]*n-a[6]*i-a[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].updateMatrixWorld(t)}updateWorldMatrix(t,n,i=!1){const s=this.parent;if(t===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),n===!0){const a=this.children;for(let o=0,r=a.length;o<r;o++)a[o].updateWorldMatrix(!1,!0,i)}}toJSON(t){const n=t===void 0||typeof t=="string",i={};n&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(r=>({...r,boundingBox:r.boundingBox?r.boundingBox.toJSON():void 0,boundingSphere:r.boundingSphere?r.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(r=>({...r})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function a(r,c){return r[c.uuid]===void 0&&(r[c.uuid]=c.toJSON(t)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=a(t.geometries,this.geometry);const r=this.geometry.parameters;if(r!==void 0&&r.shapes!==void 0){const c=r.shapes;if(Array.isArray(c))for(let l=0,d=c.length;l<d;l++){const f=c[l];a(t.shapes,f)}else a(t.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(a(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const r=[];for(let c=0,l=this.material.length;c<l;c++)r.push(a(t.materials,this.material[c]));s.material=r}else s.material=a(t.materials,this.material);if(this.children.length>0){s.children=[];for(let r=0;r<this.children.length;r++)s.children.push(this.children[r].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let r=0;r<this.animations.length;r++){const c=this.animations[r];s.animations.push(a(t.animations,c))}}if(n){const r=o(t.geometries),c=o(t.materials),l=o(t.textures),d=o(t.images),f=o(t.shapes),u=o(t.skeletons),h=o(t.animations),p=o(t.nodes);r.length>0&&(i.geometries=r),c.length>0&&(i.materials=c),l.length>0&&(i.textures=l),d.length>0&&(i.images=d),f.length>0&&(i.shapes=f),u.length>0&&(i.skeletons=u),h.length>0&&(i.animations=h),p.length>0&&(i.nodes=p)}return i.object=s,i;function o(r){const c=[];for(const l in r){const d=r[l];delete d.metadata,c.push(d)}return c}}clone(t){return new this.constructor().copy(this,t)}copy(t,n=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),n===!0)for(let i=0;i<t.children.length;i++){const s=t.children[i];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}We.DEFAULT_UP=new Z(0,1,0);We.DEFAULT_MATRIX_AUTO_UPDATE=!0;We.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class Wt extends We{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Y1={type:"move"};class Jl{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Wt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Wt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new Z,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new Z),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Wt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new Z,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new Z,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const n=this._hand;if(n)for(const i of t.hand.values())this._getHandJoint(n,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,n,i){let s=null,a=null,o=null;const r=this._targetRay,c=this._grip,l=this._hand;if(t&&n.session.visibilityState!=="visible-blurred"){if(l&&t.hand){o=!0;for(const _ of t.hand.values()){const x=n.getJointPose(_,i),m=this._getHandJoint(l,_);x!==null&&(m.matrix.fromArray(x.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=x.radius),m.visible=x!==null}const d=l.joints["index-finger-tip"],f=l.joints["thumb-tip"],u=d.position.distanceTo(f.position),h=.02,p=.005;l.inputState.pinching&&u>h+p?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!l.inputState.pinching&&u<=h-p&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else c!==null&&t.gripSpace&&(a=n.getPose(t.gripSpace,i),a!==null&&(c.matrix.fromArray(a.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,a.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(a.linearVelocity)):c.hasLinearVelocity=!1,a.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(a.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:t,target:this})));r!==null&&(s=n.getPose(t.targetRaySpace,i),s===null&&a!==null&&(s=a),s!==null&&(r.matrix.fromArray(s.transform.matrix),r.matrix.decompose(r.position,r.rotation,r.scale),r.matrixWorldNeedsUpdate=!0,s.linearVelocity?(r.hasLinearVelocity=!0,r.linearVelocity.copy(s.linearVelocity)):r.hasLinearVelocity=!1,s.angularVelocity?(r.hasAngularVelocity=!0,r.angularVelocity.copy(s.angularVelocity)):r.hasAngularVelocity=!1,this.dispatchEvent(Y1)))}return r!==null&&(r.visible=s!==null),c!==null&&(c.visible=a!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(t,n){if(t.joints[n.jointName]===void 0){const i=new Wt;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[n.jointName]=i,t.add(i)}return t.joints[n.jointName]}}const Em={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Hi={h:0,s:0,l:0},Ir={h:0,s:0,l:0};function Ql(e,t,n){return n<0&&(n+=1),n>1&&(n-=1),n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}class te{constructor(t,n,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,n,i)}set(t,n,i){if(n===void 0&&i===void 0){const s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,n,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,n=cn){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,oe.colorSpaceToWorking(this,n),this}setRGB(t,n,i,s=oe.workingColorSpace){return this.r=t,this.g=n,this.b=i,oe.colorSpaceToWorking(this,s),this}setHSL(t,n,i,s=oe.workingColorSpace){if(t=N1(t,1),n=ae(n,0,1),i=ae(i,0,1),n===0)this.r=this.g=this.b=i;else{const a=i<=.5?i*(1+n):i+n-i*n,o=2*i-a;this.r=Ql(o,a,t+1/3),this.g=Ql(o,a,t),this.b=Ql(o,a,t-1/3)}return oe.colorSpaceToWorking(this,s),this}setStyle(t,n=cn){function i(a){a!==void 0&&parseFloat(a)<1&&Kt("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let a;const o=s[1],r=s[2];switch(o){case"rgb":case"rgba":if(a=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(r))return i(a[4]),this.setRGB(Math.min(255,parseInt(a[1],10))/255,Math.min(255,parseInt(a[2],10))/255,Math.min(255,parseInt(a[3],10))/255,n);if(a=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(r))return i(a[4]),this.setRGB(Math.min(100,parseInt(a[1],10))/100,Math.min(100,parseInt(a[2],10))/100,Math.min(100,parseInt(a[3],10))/100,n);break;case"hsl":case"hsla":if(a=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(r))return i(a[4]),this.setHSL(parseFloat(a[1])/360,parseFloat(a[2])/100,parseFloat(a[3])/100,n);break;default:Kt("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){const a=s[1],o=a.length;if(o===3)return this.setRGB(parseInt(a.charAt(0),16)/15,parseInt(a.charAt(1),16)/15,parseInt(a.charAt(2),16)/15,n);if(o===6)return this.setHex(parseInt(a,16),n);Kt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,n);return this}setColorName(t,n=cn){const i=Em[t.toLowerCase()];return i!==void 0?this.setHex(i,n):Kt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Ii(t.r),this.g=Ii(t.g),this.b=Ii(t.b),this}copyLinearToSRGB(t){return this.r=Ca(t.r),this.g=Ca(t.g),this.b=Ca(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=cn){return oe.workingToColorSpace($e.copy(this),t),Math.round(ae($e.r*255,0,255))*65536+Math.round(ae($e.g*255,0,255))*256+Math.round(ae($e.b*255,0,255))}getHexString(t=cn){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,n=oe.workingColorSpace){oe.workingToColorSpace($e.copy(this),n);const i=$e.r,s=$e.g,a=$e.b,o=Math.max(i,s,a),r=Math.min(i,s,a);let c,l;const d=(r+o)/2;if(r===o)c=0,l=0;else{const f=o-r;switch(l=d<=.5?f/(o+r):f/(2-o-r),o){case i:c=(s-a)/f+(s<a?6:0);break;case s:c=(a-i)/f+2;break;case a:c=(i-s)/f+4;break}c/=6}return t.h=c,t.s=l,t.l=d,t}getRGB(t,n=oe.workingColorSpace){return oe.workingToColorSpace($e.copy(this),n),t.r=$e.r,t.g=$e.g,t.b=$e.b,t}getStyle(t=cn){oe.workingToColorSpace($e.copy(this),t);const n=$e.r,i=$e.g,s=$e.b;return t!==cn?`color(${t} ${n.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(n*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(t,n,i){return this.getHSL(Hi),this.setHSL(Hi.h+t,Hi.s+n,Hi.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,n){return this.r=t.r+n.r,this.g=t.g+n.g,this.b=t.b+n.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,n){return this.r+=(t.r-this.r)*n,this.g+=(t.g-this.g)*n,this.b+=(t.b-this.b)*n,this}lerpColors(t,n,i){return this.r=t.r+(n.r-t.r)*i,this.g=t.g+(n.g-t.g)*i,this.b=t.b+(n.b-t.b)*i,this}lerpHSL(t,n){this.getHSL(Hi),t.getHSL(Ir);const i=Xl(Hi.h,Ir.h,n),s=Xl(Hi.s,Ir.s,n),a=Xl(Hi.l,Ir.l,n);return this.setHSL(i,s,a),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const n=this.r,i=this.g,s=this.b,a=t.elements;return this.r=a[0]*n+a[3]*i+a[6]*s,this.g=a[1]*n+a[4]*i+a[7]*s,this.b=a[2]*n+a[5]*i+a[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,n=0){return this.r=t[n],this.g=t[n+1],this.b=t[n+2],this}toArray(t=[],n=0){return t[n]=this.r,t[n+1]=this.g,t[n+2]=this.b,t}fromBufferAttribute(t,n){return this.r=t.getX(n),this.g=t.getY(n),this.b=t.getZ(n),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const $e=new te;te.NAMES=Em;class Z1 extends We{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Ui,this.environmentIntensity=1,this.environmentRotation=new Ui,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,n){return super.copy(t,n),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const n=super.toJSON(t);return this.fog!==null&&(n.object.fog=this.fog.toJSON()),n.object.backgroundBlurriness=this.backgroundBlurriness,n.object.backgroundIntensity=this.backgroundIntensity,n.object.backgroundRotation=this.backgroundRotation.toArray(),n.object.environmentIntensity=this.environmentIntensity,n.object.environmentRotation=this.environmentRotation.toArray(),n}}const Fn=new Z,_i=new Z,jl=new Z,vi=new Z,aa=new Z,oa=new Z,W0=new Z,td=new Z,ed=new Z,nd=new Z,id=new Ee,sd=new Ee,ad=new Ee;class kn{constructor(t=new Z,n=new Z,i=new Z){this.a=t,this.b=n,this.c=i}static getNormal(t,n,i,s){s.subVectors(i,n),Fn.subVectors(t,n),s.cross(Fn);const a=s.lengthSq();return a>0?s.multiplyScalar(1/Math.sqrt(a)):s.set(0,0,0)}static getBarycoord(t,n,i,s,a){Fn.subVectors(s,n),_i.subVectors(i,n),jl.subVectors(t,n);const o=Fn.dot(Fn),r=Fn.dot(_i),c=Fn.dot(jl),l=_i.dot(_i),d=_i.dot(jl),f=o*l-r*r;if(f===0)return a.set(0,0,0),null;const u=1/f,h=(l*c-r*d)*u,p=(o*d-r*c)*u;return a.set(1-h-p,p,h)}static containsPoint(t,n,i,s){return this.getBarycoord(t,n,i,s,vi)===null?!1:vi.x>=0&&vi.y>=0&&vi.x+vi.y<=1}static getInterpolation(t,n,i,s,a,o,r,c){return this.getBarycoord(t,n,i,s,vi)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(a,vi.x),c.addScaledVector(o,vi.y),c.addScaledVector(r,vi.z),c)}static getInterpolatedAttribute(t,n,i,s,a,o){return id.setScalar(0),sd.setScalar(0),ad.setScalar(0),id.fromBufferAttribute(t,n),sd.fromBufferAttribute(t,i),ad.fromBufferAttribute(t,s),o.setScalar(0),o.addScaledVector(id,a.x),o.addScaledVector(sd,a.y),o.addScaledVector(ad,a.z),o}static isFrontFacing(t,n,i,s){return Fn.subVectors(i,n),_i.subVectors(t,n),Fn.cross(_i).dot(s)<0}set(t,n,i){return this.a.copy(t),this.b.copy(n),this.c.copy(i),this}setFromPointsAndIndices(t,n,i,s){return this.a.copy(t[n]),this.b.copy(t[i]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,n,i,s){return this.a.fromBufferAttribute(t,n),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Fn.subVectors(this.c,this.b),_i.subVectors(this.a,this.b),Fn.cross(_i).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return kn.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return kn.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,i,s,a){return kn.getInterpolation(t,this.a,this.b,this.c,n,i,s,a)}containsPoint(t){return kn.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return kn.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,n){const i=this.a,s=this.b,a=this.c;let o,r;aa.subVectors(s,i),oa.subVectors(a,i),td.subVectors(t,i);const c=aa.dot(td),l=oa.dot(td);if(c<=0&&l<=0)return n.copy(i);ed.subVectors(t,s);const d=aa.dot(ed),f=oa.dot(ed);if(d>=0&&f<=d)return n.copy(s);const u=c*f-d*l;if(u<=0&&c>=0&&d<=0)return o=c/(c-d),n.copy(i).addScaledVector(aa,o);nd.subVectors(t,a);const h=aa.dot(nd),p=oa.dot(nd);if(p>=0&&h<=p)return n.copy(a);const _=h*l-c*p;if(_<=0&&l>=0&&p<=0)return r=l/(l-p),n.copy(i).addScaledVector(oa,r);const x=d*p-h*f;if(x<=0&&f-d>=0&&h-p>=0)return W0.subVectors(a,s),r=(f-d)/(f-d+(h-p)),n.copy(s).addScaledVector(W0,r);const m=1/(x+_+u);return o=_*m,r=u*m,n.copy(i).addScaledVector(aa,o).addScaledVector(oa,r)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}class rr{constructor(t=new Z(1/0,1/0,1/0),n=new Z(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=n}set(t,n){return this.min.copy(t),this.max.copy(n),this}setFromArray(t){this.makeEmpty();for(let n=0,i=t.length;n<i;n+=3)this.expandByPoint(Bn.fromArray(t,n));return this}setFromBufferAttribute(t){this.makeEmpty();for(let n=0,i=t.count;n<i;n++)this.expandByPoint(Bn.fromBufferAttribute(t,n));return this}setFromPoints(t){this.makeEmpty();for(let n=0,i=t.length;n<i;n++)this.expandByPoint(t[n]);return this}setFromCenterAndSize(t,n){const i=Bn.copy(n).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,n=!1){return this.makeEmpty(),this.expandByObject(t,n)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,n=!1){t.updateWorldMatrix(!1,!1);const i=t.geometry;if(i!==void 0){const a=i.getAttribute("position");if(n===!0&&a!==void 0&&t.isInstancedMesh!==!0)for(let o=0,r=a.count;o<r;o++)t.isMesh===!0?t.getVertexPosition(o,Bn):Bn.fromBufferAttribute(a,o),Bn.applyMatrix4(t.matrixWorld),this.expandByPoint(Bn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Dr.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Dr.copy(i.boundingBox)),Dr.applyMatrix4(t.matrixWorld),this.union(Dr)}const s=t.children;for(let a=0,o=s.length;a<o;a++)this.expandByObject(s[a],n);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,n){return n.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Bn),Bn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let n,i;return t.normal.x>0?(n=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(n=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(n+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(n+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(n+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(n+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),n<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(so),Nr.subVectors(this.max,so),ra.subVectors(t.a,so),ca.subVectors(t.b,so),la.subVectors(t.c,so),Vi.subVectors(ca,ra),Wi.subVectors(la,ca),cs.subVectors(ra,la);let n=[0,-Vi.z,Vi.y,0,-Wi.z,Wi.y,0,-cs.z,cs.y,Vi.z,0,-Vi.x,Wi.z,0,-Wi.x,cs.z,0,-cs.x,-Vi.y,Vi.x,0,-Wi.y,Wi.x,0,-cs.y,cs.x,0];return!od(n,ra,ca,la,Nr)||(n=[1,0,0,0,1,0,0,0,1],!od(n,ra,ca,la,Nr))?!1:(Ur.crossVectors(Vi,Wi),n=[Ur.x,Ur.y,Ur.z],od(n,ra,ca,la,Nr))}clampPoint(t,n){return n.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Bn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Bn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Mi[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Mi[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Mi[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Mi[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Mi[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Mi[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Mi[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Mi[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Mi),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}}const Mi=[new Z,new Z,new Z,new Z,new Z,new Z,new Z,new Z],Bn=new Z,Dr=new rr,ra=new Z,ca=new Z,la=new Z,Vi=new Z,Wi=new Z,cs=new Z,so=new Z,Nr=new Z,Ur=new Z,ls=new Z;function od(e,t,n,i,s){for(let a=0,o=e.length-3;a<=o;a+=3){ls.fromArray(e,a);const r=s.x*Math.abs(ls.x)+s.y*Math.abs(ls.y)+s.z*Math.abs(ls.z),c=t.dot(ls),l=n.dot(ls),d=i.dot(ls);if(Math.max(-Math.max(c,l,d),Math.min(c,l,d))>r)return!1}return!0}const Ce=new Z,Or=new St;let K1=0;class fn extends Xs{constructor(t,n,i=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:K1++}),this.name="",this.array=t,this.itemSize=n,this.count=t!==void 0?t.length/n:0,this.normalized=i,this.usage=C1,this.updateRanges=[],this.gpuType=si,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,n){this.updateRanges.push({start:t,count:n})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,n,i){t*=this.itemSize,i*=n.itemSize;for(let s=0,a=this.itemSize;s<a;s++)this.array[t+s]=n.array[i+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let n=0,i=this.count;n<i;n++)Or.fromBufferAttribute(this,n),Or.applyMatrix3(t),this.setXY(n,Or.x,Or.y);else if(this.itemSize===3)for(let n=0,i=this.count;n<i;n++)Ce.fromBufferAttribute(this,n),Ce.applyMatrix3(t),this.setXYZ(n,Ce.x,Ce.y,Ce.z);return this}applyMatrix4(t){for(let n=0,i=this.count;n<i;n++)Ce.fromBufferAttribute(this,n),Ce.applyMatrix4(t),this.setXYZ(n,Ce.x,Ce.y,Ce.z);return this}applyNormalMatrix(t){for(let n=0,i=this.count;n<i;n++)Ce.fromBufferAttribute(this,n),Ce.applyNormalMatrix(t),this.setXYZ(n,Ce.x,Ce.y,Ce.z);return this}transformDirection(t){for(let n=0,i=this.count;n<i;n++)Ce.fromBufferAttribute(this,n),Ce.transformDirection(t),this.setXYZ(n,Ce.x,Ce.y,Ce.z);return this}set(t,n=0){return this.array.set(t,n),this}getComponent(t,n){let i=this.array[t*this.itemSize+n];return this.normalized&&(i=no(i,this.array)),i}setComponent(t,n,i){return this.normalized&&(i=rn(i,this.array)),this.array[t*this.itemSize+n]=i,this}getX(t){let n=this.array[t*this.itemSize];return this.normalized&&(n=no(n,this.array)),n}setX(t,n){return this.normalized&&(n=rn(n,this.array)),this.array[t*this.itemSize]=n,this}getY(t){let n=this.array[t*this.itemSize+1];return this.normalized&&(n=no(n,this.array)),n}setY(t,n){return this.normalized&&(n=rn(n,this.array)),this.array[t*this.itemSize+1]=n,this}getZ(t){let n=this.array[t*this.itemSize+2];return this.normalized&&(n=no(n,this.array)),n}setZ(t,n){return this.normalized&&(n=rn(n,this.array)),this.array[t*this.itemSize+2]=n,this}getW(t){let n=this.array[t*this.itemSize+3];return this.normalized&&(n=no(n,this.array)),n}setW(t,n){return this.normalized&&(n=rn(n,this.array)),this.array[t*this.itemSize+3]=n,this}setXY(t,n,i){return t*=this.itemSize,this.normalized&&(n=rn(n,this.array),i=rn(i,this.array)),this.array[t+0]=n,this.array[t+1]=i,this}setXYZ(t,n,i,s){return t*=this.itemSize,this.normalized&&(n=rn(n,this.array),i=rn(i,this.array),s=rn(s,this.array)),this.array[t+0]=n,this.array[t+1]=i,this.array[t+2]=s,this}setXYZW(t,n,i,s,a){return t*=this.itemSize,this.normalized&&(n=rn(n,this.array),i=rn(i,this.array),s=rn(s,this.array),a=rn(a,this.array)),this.array[t+0]=n,this.array[t+1]=i,this.array[t+2]=s,this.array[t+3]=a,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}}class Tm extends fn{constructor(t,n,i){super(new Uint16Array(t),n,i)}}class Am extends fn{constructor(t,n,i){super(new Uint32Array(t),n,i)}}class le extends fn{constructor(t,n,i){super(new Float32Array(t),n,i)}}const J1=new rr,ao=new Z,rd=new Z;class Au{constructor(t=new Z,n=-1){this.isSphere=!0,this.center=t,this.radius=n}set(t,n){return this.center.copy(t),this.radius=n,this}setFromPoints(t,n){const i=this.center;n!==void 0?i.copy(n):J1.setFromPoints(t).getCenter(i);let s=0;for(let a=0,o=t.length;a<o;a++)s=Math.max(s,i.distanceToSquared(t[a]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const n=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=n*n}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,n){const i=this.center.distanceToSquared(t);return n.copy(t),i>this.radius*this.radius&&(n.sub(this.center).normalize(),n.multiplyScalar(this.radius).add(this.center)),n}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;ao.subVectors(t,this.center);const n=ao.lengthSq();if(n>this.radius*this.radius){const i=Math.sqrt(n),s=(i-this.radius)*.5;this.center.addScaledVector(ao,s/i),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(rd.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(ao.copy(t.center).add(rd)),this.expandByPoint(ao.copy(t.center).sub(rd))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}}let Q1=0;const En=new be,cd=new We,da=new Z,pn=new rr,oo=new rr,Fe=new Z;class Pe extends Xs{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Q1++}),this.uuid=Wa(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(P1(t)?Am:Tm)(t,1):this.index=t,this}setIndirect(t,n=0){return this.indirect=t,this.indirectOffset=n,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,n){return this.attributes[t]=n,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,n,i=0){this.groups.push({start:t,count:n,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,n){this.drawRange.start=t,this.drawRange.count=n}applyMatrix4(t){const n=this.attributes.position;n!==void 0&&(n.applyMatrix4(t),n.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const a=new jt().getNormalMatrix(t);i.applyNormalMatrix(a),i.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return En.makeRotationFromQuaternion(t),this.applyMatrix4(En),this}rotateX(t){return En.makeRotationX(t),this.applyMatrix4(En),this}rotateY(t){return En.makeRotationY(t),this.applyMatrix4(En),this}rotateZ(t){return En.makeRotationZ(t),this.applyMatrix4(En),this}translate(t,n,i){return En.makeTranslation(t,n,i),this.applyMatrix4(En),this}scale(t,n,i){return En.makeScale(t,n,i),this.applyMatrix4(En),this}lookAt(t){return cd.lookAt(t),cd.updateMatrix(),this.applyMatrix4(cd.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(da).negate(),this.translate(da.x,da.y,da.z),this}setFromPoints(t){const n=this.getAttribute("position");if(n===void 0){const i=[];for(let s=0,a=t.length;s<a;s++){const o=t[s];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new le(i,3))}else{const i=Math.min(t.length,n.count);for(let s=0;s<i;s++){const a=t[s];n.setXYZ(s,a.x,a.y,a.z||0)}t.length>n.count&&Kt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),n.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new rr);const t=this.attributes.position,n=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){ce("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new Z(-1/0,-1/0,-1/0),new Z(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),n)for(let i=0,s=n.length;i<s;i++){const a=n[i];pn.setFromBufferAttribute(a),this.morphTargetsRelative?(Fe.addVectors(this.boundingBox.min,pn.min),this.boundingBox.expandByPoint(Fe),Fe.addVectors(this.boundingBox.max,pn.max),this.boundingBox.expandByPoint(Fe)):(this.boundingBox.expandByPoint(pn.min),this.boundingBox.expandByPoint(pn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&ce('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Au);const t=this.attributes.position,n=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){ce("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new Z,1/0);return}if(t){const i=this.boundingSphere.center;if(pn.setFromBufferAttribute(t),n)for(let a=0,o=n.length;a<o;a++){const r=n[a];oo.setFromBufferAttribute(r),this.morphTargetsRelative?(Fe.addVectors(pn.min,oo.min),pn.expandByPoint(Fe),Fe.addVectors(pn.max,oo.max),pn.expandByPoint(Fe)):(pn.expandByPoint(oo.min),pn.expandByPoint(oo.max))}pn.getCenter(i);let s=0;for(let a=0,o=t.count;a<o;a++)Fe.fromBufferAttribute(t,a),s=Math.max(s,i.distanceToSquared(Fe));if(n)for(let a=0,o=n.length;a<o;a++){const r=n[a],c=this.morphTargetsRelative;for(let l=0,d=r.count;l<d;l++)Fe.fromBufferAttribute(r,l),c&&(da.fromBufferAttribute(t,l),Fe.add(da)),s=Math.max(s,i.distanceToSquared(Fe))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&ce('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,n=this.attributes;if(t===null||n.position===void 0||n.normal===void 0||n.uv===void 0){ce("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=n.position,s=n.normal,a=n.uv;let o=this.getAttribute("tangent");(o===void 0||o.count!==i.count)&&(o=new fn(new Float32Array(4*i.count),4),this.setAttribute("tangent",o));const r=[],c=[];for(let M=0;M<i.count;M++)r[M]=new Z,c[M]=new Z;const l=new Z,d=new Z,f=new Z,u=new St,h=new St,p=new St,_=new Z,x=new Z;function m(M,T,z){l.fromBufferAttribute(i,M),d.fromBufferAttribute(i,T),f.fromBufferAttribute(i,z),u.fromBufferAttribute(a,M),h.fromBufferAttribute(a,T),p.fromBufferAttribute(a,z),d.sub(l),f.sub(l),h.sub(u),p.sub(u);const R=1/(h.x*p.y-p.x*h.y);isFinite(R)&&(_.copy(d).multiplyScalar(p.y).addScaledVector(f,-h.y).multiplyScalar(R),x.copy(f).multiplyScalar(h.x).addScaledVector(d,-p.x).multiplyScalar(R),r[M].add(_),r[T].add(_),r[z].add(_),c[M].add(x),c[T].add(x),c[z].add(x))}let v=this.groups;v.length===0&&(v=[{start:0,count:t.count}]);for(let M=0,T=v.length;M<T;++M){const z=v[M],R=z.start,D=z.count;for(let O=R,C=R+D;O<C;O+=3)m(t.getX(O+0),t.getX(O+1),t.getX(O+2))}const y=new Z,g=new Z,b=new Z,S=new Z;function E(M){b.fromBufferAttribute(s,M),S.copy(b);const T=r[M];y.copy(T),y.sub(b.multiplyScalar(b.dot(T))).normalize(),g.crossVectors(S,T);const R=g.dot(c[M])<0?-1:1;o.setXYZW(M,y.x,y.y,y.z,R)}for(let M=0,T=v.length;M<T;++M){const z=v[M],R=z.start,D=z.count;for(let O=R,C=R+D;O<C;O+=3)E(t.getX(O+0)),E(t.getX(O+1)),E(t.getX(O+2))}this._transformed=!0}computeVertexNormals(){const t=this.index,n=this.getAttribute("position");if(n!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==n.count)i=new fn(new Float32Array(n.count*3),3),this.setAttribute("normal",i);else for(let u=0,h=i.count;u<h;u++)i.setXYZ(u,0,0,0);const s=new Z,a=new Z,o=new Z,r=new Z,c=new Z,l=new Z,d=new Z,f=new Z;if(t)for(let u=0,h=t.count;u<h;u+=3){const p=t.getX(u+0),_=t.getX(u+1),x=t.getX(u+2);s.fromBufferAttribute(n,p),a.fromBufferAttribute(n,_),o.fromBufferAttribute(n,x),d.subVectors(o,a),f.subVectors(s,a),d.cross(f),r.fromBufferAttribute(i,p),c.fromBufferAttribute(i,_),l.fromBufferAttribute(i,x),r.add(d),c.add(d),l.add(d),i.setXYZ(p,r.x,r.y,r.z),i.setXYZ(_,c.x,c.y,c.z),i.setXYZ(x,l.x,l.y,l.z)}else for(let u=0,h=n.count;u<h;u+=3)s.fromBufferAttribute(n,u+0),a.fromBufferAttribute(n,u+1),o.fromBufferAttribute(n,u+2),d.subVectors(o,a),f.subVectors(s,a),d.cross(f),i.setXYZ(u+0,d.x,d.y,d.z),i.setXYZ(u+1,d.x,d.y,d.z),i.setXYZ(u+2,d.x,d.y,d.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let n=0,i=t.count;n<i;n++)Fe.fromBufferAttribute(t,n),Fe.normalize(),t.setXYZ(n,Fe.x,Fe.y,Fe.z)}toNonIndexed(){function t(r,c){const l=r.array,d=r.itemSize,f=r.normalized,u=new l.constructor(c.length*d);let h=0,p=0;for(let _=0,x=c.length;_<x;_++){r.isInterleavedBufferAttribute?h=c[_]*r.data.stride+r.offset:h=c[_]*d;for(let m=0;m<d;m++)u[p++]=l[h++]}return new fn(u,d,f)}if(this.index===null)return Kt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const n=new Pe,i=this.index.array,s=this.attributes;for(const r in s){const c=s[r],l=t(c,i);n.setAttribute(r,l)}const a=this.morphAttributes;for(const r in a){const c=[],l=a[r];for(let d=0,f=l.length;d<f;d++){const u=l[d],h=t(u,i);c.push(h)}n.morphAttributes[r]=c}n.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let r=0,c=o.length;r<c;r++){const l=o[r];n.addGroup(l.start,l.count,l.materialIndex)}return n}toJSON(){const t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(t[l]=c[l]);return t}t.data={attributes:{}};const n=this.index;n!==null&&(t.data.index={type:n.array.constructor.name,array:Array.prototype.slice.call(n.array)});const i=this.attributes;for(const c in i){const l=i[c];t.data.attributes[c]=l.toJSON(t.data)}const s={};let a=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],d=[];for(let f=0,u=l.length;f<u;f++){const h=l[f];d.push(h.toJSON(t.data))}d.length>0&&(s[c]=d,a=!0)}a&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));const r=this.boundingSphere;return r!==null&&(t.data.boundingSphere=r.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const n={};this.name=t.name;const i=t.index;i!==null&&this.setIndex(i.clone());const s=t.attributes;for(const l in s){const d=s[l];this.setAttribute(l,d.clone(n))}const a=t.morphAttributes;for(const l in a){const d=[],f=a[l];for(let u=0,h=f.length;u<h;u++)d.push(f[u].clone(n));this.morphAttributes[l]=d}this.morphTargetsRelative=t.morphTargetsRelative;const o=t.groups;for(let l=0,d=o.length;l<d;l++){const f=o[l];this.addGroup(f.start,f.count,f.materialIndex)}const r=t.boundingBox;r!==null&&(this.boundingBox=r.clone());const c=t.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}const ld=new Z,j1=new Z,t_=new jt;class Ki{constructor(t=new Z(1,0,0),n=0){this.isPlane=!0,this.normal=t,this.constant=n}set(t,n){return this.normal.copy(t),this.constant=n,this}setComponents(t,n,i,s){return this.normal.set(t,n,i),this.constant=s,this}setFromNormalAndCoplanarPoint(t,n){return this.normal.copy(t),this.constant=-n.dot(this.normal),this}setFromCoplanarPoints(t,n,i){const s=ld.subVectors(i,n).cross(j1.subVectors(t,n)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,n){return n.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,n,i=!0){const s=t.delta(ld),a=this.normal.dot(s);if(a===0)return this.distanceToPoint(t.start)===0?n.copy(t.start):null;const o=-(t.start.dot(this.normal)+this.constant)/a;return i===!0&&(o<0||o>1)?null:n.copy(t.start).addScaledVector(s,o)}intersectsLine(t){const n=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return n<0&&i>0||i<0&&n>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,n){const i=n||t_.getNormalMatrix(t),s=this.coplanarPoint(ld).applyMatrix4(t),a=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(a),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}}let e_=0;class Xa extends Xs{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:e_++}),this.uuid=Wa(),this.name="",this.type="Material",this.blending=Co,this.side=Ps,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=am,this.blendDst=om,this.blendEquation=_a,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new te(0,0,0),this.blendAlpha=0,this.depthFunc=$o,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=S1,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Wl,this.stencilZFail=Wl,this.stencilZPass=Wl,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const n in t){const i=t[n];if(i===void 0){Kt(`Material: parameter '${n}' has value of undefined.`);continue}const s=this[n];if(s===void 0){Kt(`Material: '${n}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector2&&i&&i.isVector2||s&&s.isEuler&&i&&i.isEuler||s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[n]=i}}toJSON(t){const n=t===void 0||typeof t=="string";n&&(t={textures:{},images:{}});const i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(a=>a.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(a){const o=[];for(const r in a){const c=a[r];delete c.metadata,o.push(c)}return o}if(n){const a=s(t.textures),o=s(t.images);a.length>0&&(i.textures=a),o.length>0&&(i.images=o)}return i}fromJSON(t,n){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new te().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(i=>new Ki().fromJSON(i))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=n[t.map]||null),t.matcap!==void 0&&(this.matcap=n[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=n[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=n[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=n[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let i=t.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new St().fromArray(i)}return t.displacementMap!==void 0&&(this.displacementMap=n[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=n[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=n[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=n[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=n[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=n[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=n[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=n[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=n[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=n[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=n[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=n[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=n[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=n[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new St().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=n[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=n[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=n[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=n[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=n[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=n[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=n[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const n=t.clippingPlanes;let i=null;if(n!==null){const s=n.length;i=new Array(s);for(let a=0;a!==s;++a)i[a]=n[a].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}const yi=new Z,dd=new Z,Fr=new Z,Br=new Z;class n_{constructor(t=new Z,n=new Z(0,0,-1)){this.origin=t,this.direction=n}set(t,n){return this.origin.copy(t),this.direction.copy(n),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,n){return n.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,yi)),this}closestPointToPoint(t,n){n.subVectors(t,this.origin);const i=n.dot(this.direction);return i<0?n.copy(this.origin):n.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const n=yi.subVectors(t,this.origin).dot(this.direction);return n<0?this.origin.distanceToSquared(t):(yi.copy(this.origin).addScaledVector(this.direction,n),yi.distanceToSquared(t))}distanceSqToSegment(t,n,i,s){dd.copy(t).add(n).multiplyScalar(.5),Fr.copy(n).sub(t).normalize(),Br.copy(this.origin).sub(dd);const a=t.distanceTo(n)*.5,o=-this.direction.dot(Fr),r=Br.dot(this.direction),c=-Br.dot(Fr),l=Br.lengthSq(),d=Math.abs(1-o*o);let f,u,h,p;if(d>0)if(f=o*c-r,u=o*r-c,p=a*d,f>=0)if(u>=-p)if(u<=p){const _=1/d;f*=_,u*=_,h=f*(f+o*u+2*r)+u*(o*f+u+2*c)+l}else u=a,f=Math.max(0,-(o*u+r)),h=-f*f+u*(u+2*c)+l;else u=-a,f=Math.max(0,-(o*u+r)),h=-f*f+u*(u+2*c)+l;else u<=-p?(f=Math.max(0,-(-o*a+r)),u=f>0?-a:Math.min(Math.max(-a,-c),a),h=-f*f+u*(u+2*c)+l):u<=p?(f=0,u=Math.min(Math.max(-a,-c),a),h=u*(u+2*c)+l):(f=Math.max(0,-(o*a+r)),u=f>0?a:Math.min(Math.max(-a,-c),a),h=-f*f+u*(u+2*c)+l);else u=o>0?-a:a,f=Math.max(0,-(o*u+r)),h=-f*f+u*(u+2*c)+l;return i&&i.copy(this.origin).addScaledVector(this.direction,f),s&&s.copy(dd).addScaledVector(Fr,u),h}intersectSphere(t,n){if(t.radius<0)return null;yi.subVectors(t.center,this.origin);const i=yi.dot(this.direction),s=yi.dot(yi)-i*i,a=t.radius*t.radius;if(s>a)return null;const o=Math.sqrt(a-s),r=i-o,c=i+o;return c<0?null:r<0?this.at(c,n):this.at(r,n)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const n=t.normal.dot(this.direction);if(n===0)return t.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(t.normal)+t.constant)/n;return i>=0?i:null}intersectPlane(t,n){const i=this.distanceToPlane(t);return i===null?null:this.at(i,n)}intersectsPlane(t){const n=t.distanceToPoint(this.origin);return n===0||t.normal.dot(this.direction)*n<0}intersectBox(t,n){let i,s,a,o,r,c;const l=1/this.direction.x,d=1/this.direction.y,f=1/this.direction.z,u=this.origin;return l>=0?(i=(t.min.x-u.x)*l,s=(t.max.x-u.x)*l):(i=(t.max.x-u.x)*l,s=(t.min.x-u.x)*l),d>=0?(a=(t.min.y-u.y)*d,o=(t.max.y-u.y)*d):(a=(t.max.y-u.y)*d,o=(t.min.y-u.y)*d),i>o||a>s||((a>i||isNaN(i))&&(i=a),(o<s||isNaN(s))&&(s=o),f>=0?(r=(t.min.z-u.z)*f,c=(t.max.z-u.z)*f):(r=(t.max.z-u.z)*f,c=(t.min.z-u.z)*f),i>c||r>s)||((r>i||i!==i)&&(i=r),(c<s||s!==s)&&(s=c),s<0)?null:this.at(i>=0?i:s,n)}intersectsBox(t){return this.intersectBox(t,yi)!==null}intersectTriangle(t,n,i,s,a){const o=this.origin,r=this.direction,c=r.x,l=r.y,d=r.z,f=t.x-o.x,u=t.y-o.y,h=t.z-o.z,p=n.x-o.x,_=n.y-o.y,x=n.z-o.z,m=i.x-o.x,v=i.y-o.y,y=i.z-o.z,g=Math.abs(c),b=Math.abs(l),S=Math.abs(d);let E,M,T,z,R,D,O,C,F,W,U,B;if(g>=b&&g>=S?(T=c,D=f,F=p,B=m,c>=0?(E=l,M=d,z=u,R=h,O=_,C=x,W=v,U=y):(E=d,M=l,z=h,R=u,O=x,C=_,W=y,U=v)):b>=S?(T=l,D=u,F=_,B=v,l>=0?(E=d,M=c,z=h,R=f,O=x,C=p,W=y,U=m):(E=c,M=d,z=f,R=h,O=p,C=x,W=m,U=y)):(T=d,D=h,F=x,B=y,d>=0?(E=c,M=l,z=f,R=u,O=p,C=_,W=m,U=v):(E=l,M=c,z=u,R=f,O=_,C=p,W=v,U=m)),T===0)return null;const P=E/T,H=M/T,k=1/T,L=z-P*D,V=R-H*D,at=O-P*F,j=C-H*F,pt=W-P*B,J=U-H*B,Q=pt*j-J*at,dt=L*J-V*pt,Ot=at*V-j*L;if(s){if(Q<0||dt<0||Ot<0)return null}else if((Q<0||dt<0||Ot<0)&&(Q>0||dt>0||Ot>0))return null;const mt=Q+dt+Ot;if(mt===0)return null;const Gt=k*(Q*D+dt*F+Ot*B);return(mt>0?Gt<0:Gt>0)?null:this.at(Gt/mt,a)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class vl extends Xa{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new te(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ui,this.combine=gu,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const k0=new be,ds=new n_,Gr=new Au,X0=new Z,Hr=new Z,Vr=new Z,Wr=new Z,fd=new Z,kr=new Z,$0=new Z,Xr=new Z;class Se extends We{constructor(t=new Pe,n=new vl){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,n){return super.copy(t,n),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){const s=n[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,o=s.length;a<o;a++){const r=s[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[r]=a}}}}getVertexPosition(t,n){const i=this.geometry,s=i.attributes.position,a=i.morphAttributes.position,o=i.morphTargetsRelative;n.fromBufferAttribute(s,t);const r=this.morphTargetInfluences;if(a&&r){kr.set(0,0,0);for(let c=0,l=a.length;c<l;c++){const d=r[c],f=a[c];d!==0&&(fd.fromBufferAttribute(f,t),o?kr.addScaledVector(fd,d):kr.addScaledVector(fd.sub(n),d))}n.add(kr)}return n}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,n){const i=this.geometry,s=this.material,a=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Gr.copy(i.boundingSphere),Gr.applyMatrix4(a),ds.copy(t.ray).recast(t.near),!(Gr.containsPoint(ds.origin)===!1&&(ds.intersectSphere(Gr,X0)===null||ds.origin.distanceToSquared(X0)>(t.far-t.near)**2))&&(k0.copy(a).invert(),ds.copy(t.ray).applyMatrix4(k0),!(i.boundingBox!==null&&ds.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,n,ds)))}_computeIntersections(t,n,i){let s;const a=this.geometry,o=this.material,r=a.index,c=a.attributes.position,l=a.attributes.uv,d=a.attributes.uv1,f=a.attributes.normal,u=a.groups,h=a.drawRange;if(r!==null)if(Array.isArray(o))for(let p=0,_=u.length;p<_;p++){const x=u[p],m=o[x.materialIndex],v=Math.max(x.start,h.start),y=Math.min(r.count,Math.min(x.start+x.count,h.start+h.count));for(let g=v,b=y;g<b;g+=3){const S=r.getX(g),E=r.getX(g+1),M=r.getX(g+2);s=$r(this,m,t,i,l,d,f,S,E,M),s&&(s.faceIndex=Math.floor(g/3),s.face.materialIndex=x.materialIndex,n.push(s))}}else{const p=Math.max(0,h.start),_=Math.min(r.count,h.start+h.count);for(let x=p,m=_;x<m;x+=3){const v=r.getX(x),y=r.getX(x+1),g=r.getX(x+2);s=$r(this,o,t,i,l,d,f,v,y,g),s&&(s.faceIndex=Math.floor(x/3),n.push(s))}}else if(c!==void 0)if(Array.isArray(o))for(let p=0,_=u.length;p<_;p++){const x=u[p],m=o[x.materialIndex],v=Math.max(x.start,h.start),y=Math.min(c.count,Math.min(x.start+x.count,h.start+h.count));for(let g=v,b=y;g<b;g+=3){const S=g,E=g+1,M=g+2;s=$r(this,m,t,i,l,d,f,S,E,M),s&&(s.faceIndex=Math.floor(g/3),s.face.materialIndex=x.materialIndex,n.push(s))}}else{const p=Math.max(0,h.start),_=Math.min(c.count,h.start+h.count);for(let x=p,m=_;x<m;x+=3){const v=x,y=x+1,g=x+2;s=$r(this,o,t,i,l,d,f,v,y,g),s&&(s.faceIndex=Math.floor(x/3),n.push(s))}}}}function i_(e,t,n,i,s,a,o,r){let c;if(t.side===dn?c=i.intersectTriangle(o,a,s,!0,r):c=i.intersectTriangle(s,a,o,t.side===Ps,r),c===null)return null;Xr.copy(r),Xr.applyMatrix4(e.matrixWorld);const l=n.ray.origin.distanceTo(Xr);return l<n.near||l>n.far?null:{distance:l,point:Xr.clone(),object:e}}function $r(e,t,n,i,s,a,o,r,c,l){e.getVertexPosition(r,Hr),e.getVertexPosition(c,Vr),e.getVertexPosition(l,Wr);const d=i_(e,t,n,i,Hr,Vr,Wr,$0);if(d){const f=new Z;kn.getBarycoord($0,Hr,Vr,Wr,f),s&&(d.uv=kn.getInterpolatedAttribute(s,r,c,l,f,new St)),a&&(d.uv1=kn.getInterpolatedAttribute(a,r,c,l,f,new St)),o&&(d.normal=kn.getInterpolatedAttribute(o,r,c,l,f,new Z),d.normal.dot(i.direction)>0&&d.normal.multiplyScalar(-1));const u={a:r,b:c,c:l,normal:new Z,materialIndex:0};kn.getNormal(Hr,Vr,Wr,u.normal),d.face=u,d.barycoord=f}return d}class s_ extends Qe{constructor(t=null,n=1,i=1,s,a,o,r,c,l=He,d=He,f,u){super(null,o,r,c,l,d,s,a,f,u),this.isDataTexture=!0,this.image={data:t,width:n,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const fs=new Au,a_=new St(.5,.5),qr=new Z;class zu{constructor(t=new Ki,n=new Ki,i=new Ki,s=new Ki,a=new Ki,o=new Ki){this.planes=[t,n,i,s,a,o]}set(t,n,i,s,a,o){const r=this.planes;return r[0].copy(t),r[1].copy(n),r[2].copy(i),r[3].copy(s),r[4].copy(a),r[5].copy(o),this}copy(t){const n=this.planes;for(let i=0;i<6;i++)n[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,n=ai,i=!1){const s=this.planes,a=t.elements,o=a[0],r=a[1],c=a[2],l=a[3],d=a[4],f=a[5],u=a[6],h=a[7],p=a[8],_=a[9],x=a[10],m=a[11],v=a[12],y=a[13],g=a[14],b=a[15];if(s[0].setComponents(l-o,h-d,m-p,b-v).normalize(),s[1].setComponents(l+o,h+d,m+p,b+v).normalize(),s[2].setComponents(l+r,h+f,m+_,b+y).normalize(),s[3].setComponents(l-r,h-f,m-_,b-y).normalize(),i)s[4].setComponents(c,u,x,g).normalize(),s[5].setComponents(l-c,h-u,m-x,b-g).normalize();else if(s[4].setComponents(l-c,h-u,m-x,b-g).normalize(),n===ai)s[5].setComponents(l+c,h+u,m+x,b+g).normalize();else if(n===Ko)s[5].setComponents(c,u,x,g).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+n);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),fs.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const n=t.geometry;n.boundingSphere===null&&n.computeBoundingSphere(),fs.copy(n.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(fs)}intersectsSprite(t){fs.center.set(0,0,0);const n=a_.distanceTo(t.center);return fs.radius=.7071067811865476+n,fs.applyMatrix4(t.matrixWorld),this.intersectsSphere(fs)}intersectsSphere(t){const n=this.planes,i=t.center,s=-t.radius;for(let a=0;a<6;a++)if(n[a].distanceToPoint(i)<s)return!1;return!0}intersectsBox(t){const n=this.planes;for(let i=0;i<6;i++){const s=n[i];if(qr.x=s.normal.x>0?t.max.x:t.min.x,qr.y=s.normal.y>0?t.max.y:t.min.y,qr.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(qr)<0)return!1}return!0}containsPoint(t){const n=this.planes;for(let i=0;i<6;i++)if(n[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class zm extends Qe{constructor(t=[],n=Ls,i,s,a,o,r,c,l,d){super(t,n,i,s,a,o,r,c,l,d),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Rm extends Qe{constructor(t,n,i,s,a,o,r,c,l){super(t,n,i,s,a,o,r,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}}class Jo extends Qe{constructor(t,n,i=li,s,a,o,r=He,c=He,l,d=Ni,f=1){if(d!==Ni&&d!==Ms)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const u={width:t,height:n,depth:f};super(u,s,a,o,r,c,d,i,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new Tu(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){const n=super.toJSON(t);return n.compareFunction=this.compareFunction,n}}class o_ extends Jo{constructor(t,n=li,i=Ls,s,a,o=He,r=He,c,l=Ni){const d={width:t,height:t,depth:1},f=[d,d,d,d,d,d];super(t,t,n,i,s,a,o,r,c,l),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}}class Cm extends Qe{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}}class $a extends Pe{constructor(t=1,n=1,i=1,s=1,a=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:n,depth:i,widthSegments:s,heightSegments:a,depthSegments:o};const r=this;s=Math.floor(s),a=Math.floor(a),o=Math.floor(o);const c=[],l=[],d=[],f=[];let u=0,h=0;p("z","y","x",-1,-1,i,n,t,o,a,0),p("z","y","x",1,-1,i,n,-t,o,a,1),p("x","z","y",1,1,t,i,n,s,o,2),p("x","z","y",1,-1,t,i,-n,s,o,3),p("x","y","z",1,-1,t,n,i,s,a,4),p("x","y","z",-1,-1,t,n,-i,s,a,5),this.setIndex(c),this.setAttribute("position",new le(l,3)),this.setAttribute("normal",new le(d,3)),this.setAttribute("uv",new le(f,2));function p(_,x,m,v,y,g,b,S,E,M,T){const z=g/E,R=b/M,D=g/2,O=b/2,C=S/2,F=E+1,W=M+1;let U=0,B=0;const P=new Z;for(let H=0;H<W;H++){const k=H*R-O;for(let L=0;L<F;L++){const V=L*z-D;P[_]=V*v,P[x]=k*y,P[m]=C,l.push(P.x,P.y,P.z),P[_]=0,P[x]=0,P[m]=S>0?1:-1,d.push(P.x,P.y,P.z),f.push(L/E),f.push(1-H/M),U+=1}}for(let H=0;H<M;H++)for(let k=0;k<E;k++){const L=u+k+F*H,V=u+k+F*(H+1),at=u+(k+1)+F*(H+1),j=u+(k+1)+F*H;c.push(L,V,j),c.push(V,at,j),B+=6}r.addGroup(h,B,T),h+=B,u+=U}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new $a(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}class Ru extends Pe{constructor(t=1,n=1,i=4,s=8,a=1){super(),this.type="CapsuleGeometry",this.parameters={radius:t,height:n,capSegments:i,radialSegments:s,heightSegments:a},n=Math.max(0,n),i=Math.max(1,Math.floor(i)),s=Math.max(3,Math.floor(s)),a=Math.max(1,Math.floor(a));const o=[],r=[],c=[],l=[],d=n/2,f=Math.PI/2*t,u=n,h=2*f+u,p=i*2+a,_=s+1,x=new Z,m=new Z;for(let v=0;v<=p;v++){let y=0,g=0,b=0,S=0;if(v<=i){const T=v/i,z=T*Math.PI/2;g=-d-t*Math.cos(z),b=t*Math.sin(z),S=-t*Math.cos(z),y=T*f}else if(v<=i+a){const T=(v-i)/a;g=-d+T*n,b=t,S=0,y=f+T*u}else{const T=(v-i-a)/i,z=T*Math.PI/2;g=d+t*Math.sin(z),b=t*Math.cos(z),S=t*Math.sin(z),y=f+u+T*f}const E=Math.max(0,Math.min(1,y/h));let M=0;v===0?M=.5/s:v===p&&(M=-.5/s);for(let T=0;T<=s;T++){const z=T/s,R=z*Math.PI*2,D=Math.sin(R),O=Math.cos(R);m.x=-b*O,m.y=g,m.z=b*D,r.push(m.x,m.y,m.z),x.set(-b*O,S,b*D),x.normalize(),c.push(x.x,x.y,x.z),l.push(z+M,E)}if(v>0){const T=(v-1)*_;for(let z=0;z<s;z++){const R=T+z,D=T+z+1,O=v*_+z,C=v*_+z+1;o.push(R,D,O),o.push(D,C,O)}}}this.setIndex(o),this.setAttribute("position",new le(r,3)),this.setAttribute("normal",new le(c,3)),this.setAttribute("uv",new le(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ru(t.radius,t.height,t.capSegments,t.radialSegments,t.heightSegments)}}class Ml extends Pe{constructor(t=1,n=1,i=1,s=32,a=1,o=!1,r=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:n,height:i,radialSegments:s,heightSegments:a,openEnded:o,thetaStart:r,thetaLength:c};const l=this;s=Math.floor(s),a=Math.floor(a);const d=[],f=[],u=[],h=[];let p=0;const _=[],x=i/2;let m=0;v(),o===!1&&(t>0&&y(!0),n>0&&y(!1)),this.setIndex(d),this.setAttribute("position",new le(f,3)),this.setAttribute("normal",new le(u,3)),this.setAttribute("uv",new le(h,2));function v(){const g=new Z,b=new Z;let S=0;const E=(n-t)/i;for(let M=0;M<=a;M++){const T=[],z=M/a,R=z*(n-t)+t;for(let D=0;D<=s;D++){const O=D/s,C=O*c+r,F=Math.sin(C),W=Math.cos(C);b.x=R*F,b.y=-z*i+x,b.z=R*W,f.push(b.x,b.y,b.z),g.set(F,E,W).normalize(),u.push(g.x,g.y,g.z),h.push(O,1-z),T.push(p++)}_.push(T)}for(let M=0;M<s;M++)for(let T=0;T<a;T++){const z=_[T][M],R=_[T+1][M],D=_[T+1][M+1],O=_[T][M+1];(t>0||T!==0)&&(d.push(z,R,O),S+=3),(n>0||T!==a-1)&&(d.push(R,D,O),S+=3)}l.addGroup(m,S,0),m+=S}function y(g){const b=p,S=new St,E=new Z;let M=0;const T=g===!0?t:n,z=g===!0?1:-1;for(let D=1;D<=s;D++)f.push(0,x*z,0),u.push(0,z,0),h.push(.5,.5),p++;const R=p;for(let D=0;D<=s;D++){const C=D/s*c+r,F=Math.cos(C),W=Math.sin(C);E.x=T*W,E.y=x*z,E.z=T*F,f.push(E.x,E.y,E.z),u.push(0,z,0),S.x=F*.5+.5,S.y=W*.5*z+.5,h.push(S.x,S.y),p++}for(let D=0;D<s;D++){const O=b+D,C=R+D;g===!0?d.push(C,C+1,O):d.push(C+1,C,O),M+=3}l.addGroup(m,M,g===!0?1:2),m+=M}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ml(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class yl extends Ml{constructor(t=1,n=1,i=32,s=1,a=!1,o=0,r=Math.PI*2){super(0,t,n,i,s,a,o,r),this.type="ConeGeometry",this.parameters={radius:t,height:n,radialSegments:i,heightSegments:s,openEnded:a,thetaStart:o,thetaLength:r}}static fromJSON(t){return new yl(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class mi{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Kt("Curve: .getPoint() not implemented.")}getPointAt(t,n){const i=this.getUtoTmapping(t);return this.getPoint(i,n)}getPoints(t=5){const n=[];for(let i=0;i<=t;i++)n.push(this.getPoint(i/t));return n}getSpacedPoints(t=5){const n=[];for(let i=0;i<=t;i++)n.push(this.getPointAt(i/t));return n}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const n=[];let i,s=this.getPoint(0),a=0;n.push(0);for(let o=1;o<=t;o++)i=this.getPoint(o/t),a+=i.distanceTo(s),n.push(a),s=i;return this.cacheArcLengths=n,n}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,n=null){const i=this.getLengths();let s=0;const a=i.length;let o;n?o=n:o=t*i[a-1];let r=0,c=a-1,l;for(;r<=c;)if(s=Math.floor(r+(c-r)/2),l=i[s]-o,l<0)r=s+1;else if(l>0)c=s-1;else{c=s;break}if(s=c,i[s]===o)return s/(a-1);const d=i[s],u=i[s+1]-d,h=(o-d)/u;return(s+h)/(a-1)}getTangent(t,n){let s=t-1e-4,a=t+1e-4;s<0&&(s=0),a>1&&(a=1);const o=this.getPoint(s),r=this.getPoint(a),c=n||(o.isVector2?new St:new Z);return c.copy(r).sub(o).normalize(),c}getTangentAt(t,n){const i=this.getUtoTmapping(t);return this.getTangent(i,n)}computeFrenetFrames(t,n=!1){const i=new Z,s=[],a=[],o=[],r=new Z,c=new be;for(let h=0;h<=t;h++){const p=h/t;s[h]=this.getTangentAt(p,new Z)}a[0]=new Z,o[0]=new Z;let l=Number.MAX_VALUE;const d=Math.abs(s[0].x),f=Math.abs(s[0].y),u=Math.abs(s[0].z);d<=l&&(l=d,i.set(1,0,0)),f<=l&&(l=f,i.set(0,1,0)),u<=l&&i.set(0,0,1),r.crossVectors(s[0],i).normalize(),a[0].crossVectors(s[0],r),o[0].crossVectors(s[0],a[0]);for(let h=1;h<=t;h++){if(a[h]=a[h-1].clone(),o[h]=o[h-1].clone(),r.crossVectors(s[h-1],s[h]),r.length()>Number.EPSILON){r.normalize();const p=Math.acos(ae(s[h-1].dot(s[h]),-1,1));a[h].applyMatrix4(c.makeRotationAxis(r,p))}o[h].crossVectors(s[h],a[h])}if(n===!0){let h=Math.acos(ae(a[0].dot(a[t]),-1,1));h/=t,s[0].dot(r.crossVectors(a[0],a[t]))>0&&(h=-h);for(let p=1;p<=t;p++)a[p].applyMatrix4(c.makeRotationAxis(s[p],h*p)),o[p].crossVectors(s[p],a[p])}return{tangents:s,normals:a,binormals:o}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class Cu extends mi{constructor(t=0,n=0,i=1,s=1,a=0,o=Math.PI*2,r=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=n,this.xRadius=i,this.yRadius=s,this.aStartAngle=a,this.aEndAngle=o,this.aClockwise=r,this.aRotation=c}getPoint(t,n=new St){const i=n,s=Math.PI*2;let a=this.aEndAngle-this.aStartAngle;const o=Math.abs(a)<Number.EPSILON;for(;a<0;)a+=s;for(;a>s;)a-=s;a<Number.EPSILON&&(o?a=0:a=s),this.aClockwise===!0&&!o&&(a===s?a=-s:a=a-s);const r=this.aStartAngle+t*a;let c=this.aX+this.xRadius*Math.cos(r),l=this.aY+this.yRadius*Math.sin(r);if(this.aRotation!==0){const d=Math.cos(this.aRotation),f=Math.sin(this.aRotation),u=c-this.aX,h=l-this.aY;c=u*d-h*f+this.aX,l=u*f+h*d+this.aY}return i.set(c,l)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class r_ extends Cu{constructor(t,n,i,s,a,o){super(t,n,i,i,s,a,o),this.isArcCurve=!0,this.type="ArcCurve"}}function Pu(){let e=0,t=0,n=0,i=0;function s(a,o,r,c){e=a,t=r,n=-3*a+3*o-2*r-c,i=2*a-2*o+r+c}return{initCatmullRom:function(a,o,r,c,l){s(o,r,l*(r-a),l*(c-o))},initNonuniformCatmullRom:function(a,o,r,c,l,d,f){let u=(o-a)/l-(r-a)/(l+d)+(r-o)/d,h=(r-o)/d-(c-o)/(d+f)+(c-r)/f;u*=d,h*=d,s(o,r,u,h)},calc:function(a){const o=a*a,r=o*a;return e+t*a+n*o+i*r}}}const q0=new Z,Y0=new Z,ud=new Pu,hd=new Pu,pd=new Pu;class Pm extends mi{constructor(t=[],n=!1,i="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=n,this.curveType=i,this.tension=s}getPoint(t,n=new Z){const i=n,s=this.points,a=s.length,o=(a-(this.closed?0:1))*t;let r=Math.floor(o),c=o-r;this.closed?r+=r>0?0:(Math.floor(Math.abs(r)/a)+1)*a:c===0&&r===a-1&&(r=a-2,c=1);let l,d;this.closed||r>0?l=s[(r-1)%a]:(Y0.subVectors(s[0],s[1]).add(s[0]),l=Y0);const f=s[r%a],u=s[(r+1)%a];if(this.closed||r+2<a?d=s[(r+2)%a]:(q0.subVectors(s[a-1],s[a-2]).add(s[a-1]),d=q0),this.curveType==="centripetal"||this.curveType==="chordal"){const h=this.curveType==="chordal"?.5:.25;let p=Math.pow(l.distanceToSquared(f),h),_=Math.pow(f.distanceToSquared(u),h),x=Math.pow(u.distanceToSquared(d),h);_<1e-4&&(_=1),p<1e-4&&(p=_),x<1e-4&&(x=_),ud.initNonuniformCatmullRom(l.x,f.x,u.x,d.x,p,_,x),hd.initNonuniformCatmullRom(l.y,f.y,u.y,d.y,p,_,x),pd.initNonuniformCatmullRom(l.z,f.z,u.z,d.z,p,_,x)}else this.curveType==="catmullrom"&&(ud.initCatmullRom(l.x,f.x,u.x,d.x,this.tension),hd.initCatmullRom(l.y,f.y,u.y,d.y,this.tension),pd.initCatmullRom(l.z,f.z,u.z,d.z,this.tension));return i.set(ud.calc(c),hd.calc(c),pd.calc(c)),i}copy(t){super.copy(t),this.points=[];for(let n=0,i=t.points.length;n<i;n++){const s=t.points[n];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let n=0,i=this.points.length;n<i;n++){const s=this.points[n];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let n=0,i=t.points.length;n<i;n++){const s=t.points[n];this.points.push(new Z().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function Z0(e,t,n,i,s){const a=(i-t)*.5,o=(s-n)*.5,r=e*e,c=e*r;return(2*n-2*i+a+o)*c+(-3*n+3*i-2*a-o)*r+a*e+n}function c_(e,t){const n=1-e;return n*n*t}function l_(e,t){return 2*(1-e)*e*t}function d_(e,t){return e*e*t}function Po(e,t,n,i){return c_(e,t)+l_(e,n)+d_(e,i)}function f_(e,t){const n=1-e;return n*n*n*t}function u_(e,t){const n=1-e;return 3*n*n*e*t}function h_(e,t){return 3*(1-e)*e*e*t}function p_(e,t){return e*e*e*t}function Lo(e,t,n,i,s){return f_(e,t)+u_(e,n)+h_(e,i)+p_(e,s)}class Lm extends mi{constructor(t=new St,n=new St,i=new St,s=new St){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=n,this.v2=i,this.v3=s}getPoint(t,n=new St){const i=n,s=this.v0,a=this.v1,o=this.v2,r=this.v3;return i.set(Lo(t,s.x,a.x,o.x,r.x),Lo(t,s.y,a.y,o.y,r.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class m_ extends mi{constructor(t=new Z,n=new Z,i=new Z,s=new Z){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=n,this.v2=i,this.v3=s}getPoint(t,n=new Z){const i=n,s=this.v0,a=this.v1,o=this.v2,r=this.v3;return i.set(Lo(t,s.x,a.x,o.x,r.x),Lo(t,s.y,a.y,o.y,r.y),Lo(t,s.z,a.z,o.z,r.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class Im extends mi{constructor(t=new St,n=new St){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=n}getPoint(t,n=new St){const i=n;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,n){return this.getPoint(t,n)}getTangent(t,n=new St){return n.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,n){return this.getTangent(t,n)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class x_ extends mi{constructor(t=new Z,n=new Z){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=n}getPoint(t,n=new Z){const i=n;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,n){return this.getPoint(t,n)}getTangent(t,n=new Z){return n.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,n){return this.getTangent(t,n)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Dm extends mi{constructor(t=new St,n=new St,i=new St){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=n,this.v2=i}getPoint(t,n=new St){const i=n,s=this.v0,a=this.v1,o=this.v2;return i.set(Po(t,s.x,a.x,o.x),Po(t,s.y,a.y,o.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Nm extends mi{constructor(t=new Z,n=new Z,i=new Z){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=n,this.v2=i}getPoint(t,n=new Z){const i=n,s=this.v0,a=this.v1,o=this.v2;return i.set(Po(t,s.x,a.x,o.x),Po(t,s.y,a.y,o.y),Po(t,s.z,a.z,o.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Um extends mi{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,n=new St){const i=n,s=this.points,a=(s.length-1)*t,o=Math.floor(a),r=a-o,c=s[o===0?o:o-1],l=s[o],d=s[o>s.length-2?s.length-1:o+1],f=s[o>s.length-3?s.length-1:o+2];return i.set(Z0(r,c.x,l.x,d.x,f.x),Z0(r,c.y,l.y,d.y,f.y)),i}copy(t){super.copy(t),this.points=[];for(let n=0,i=t.points.length;n<i;n++){const s=t.points[n];this.points.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let n=0,i=this.points.length;n<i;n++){const s=this.points[n];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let n=0,i=t.points.length;n<i;n++){const s=t.points[n];this.points.push(new St().fromArray(s))}return this}}var Xc=Object.freeze({__proto__:null,ArcCurve:r_,CatmullRomCurve3:Pm,CubicBezierCurve:Lm,CubicBezierCurve3:m_,EllipseCurve:Cu,LineCurve:Im,LineCurve3:x_,QuadraticBezierCurve:Dm,QuadraticBezierCurve3:Nm,SplineCurve:Um});class g_ extends mi{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),n=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(n)){const i=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Xc[i](n,t))}return this}getPoint(t,n){const i=t*this.getLength(),s=this.getCurveLengths();let a=0;for(;a<s.length;){if(s[a]>=i){const o=s[a]-i,r=this.curves[a],c=r.getLength(),l=c===0?0:1-o/c;return r.getPointAt(l,n)}a++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let n=0;for(let i=0,s=this.curves.length;i<s;i++)n+=this.curves[i].getLength(),t.push(n);return this.cacheLengths=t,t}getSpacedPoints(t=40){const n=[];for(let i=0;i<=t;i++)n.push(this.getPoint(i/t));return this.autoClose&&n.push(n[0]),n}getPoints(t=12){const n=[];let i;for(let s=0,a=this.curves;s<a.length;s++){const o=a[s],r=o.isEllipseCurve?t*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?t*o.points.length:t,c=o.getPoints(r);for(let l=0;l<c.length;l++){const d=c[l];i&&i.equals(d)||(n.push(d),i=d)}}return this.autoClose&&n.length>1&&!n[n.length-1].equals(n[0])&&n.push(n[0]),n}copy(t){super.copy(t),this.curves=[];for(let n=0,i=t.curves.length;n<i;n++){const s=t.curves[n];this.curves.push(s.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let n=0,i=this.curves.length;n<i;n++){const s=this.curves[n];t.curves.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let n=0,i=t.curves.length;n<i;n++){const s=t.curves[n];this.curves.push(new Xc[s.type]().fromJSON(s))}return this}}class Qo extends g_{constructor(t){super(),this.type="Path",this.currentPoint=new St,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let n=1,i=t.length;n<i;n++)this.lineTo(t[n].x,t[n].y);return this}moveTo(t,n){return this.currentPoint.set(t,n),this}lineTo(t,n){const i=new Im(this.currentPoint.clone(),new St(t,n));return this.curves.push(i),this.currentPoint.set(t,n),this}quadraticCurveTo(t,n,i,s){const a=new Dm(this.currentPoint.clone(),new St(t,n),new St(i,s));return this.curves.push(a),this.currentPoint.set(i,s),this}bezierCurveTo(t,n,i,s,a,o){const r=new Lm(this.currentPoint.clone(),new St(t,n),new St(i,s),new St(a,o));return this.curves.push(r),this.currentPoint.set(a,o),this}splineThru(t){const n=[this.currentPoint.clone()].concat(t),i=new Um(n);return this.curves.push(i),this.currentPoint.copy(t[t.length-1]),this}arc(t,n,i,s,a,o){const r=this.currentPoint.x,c=this.currentPoint.y;return this.absarc(t+r,n+c,i,s,a,o),this}absarc(t,n,i,s,a,o){return this.absellipse(t,n,i,i,s,a,o),this}ellipse(t,n,i,s,a,o,r,c){const l=this.currentPoint.x,d=this.currentPoint.y;return this.absellipse(t+l,n+d,i,s,a,o,r,c),this}absellipse(t,n,i,s,a,o,r,c){const l=new Cu(t,n,i,s,a,o,r,c);if(this.curves.length>0){const f=l.getPoint(0);f.equals(this.currentPoint)||this.lineTo(f.x,f.y)}this.curves.push(l);const d=l.getPoint(1);return this.currentPoint.copy(d),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class as extends Qo{constructor(t){super(t),this.uuid=Wa(),this.type="Shape",this.holes=[]}getPointsHoles(t){const n=[];for(let i=0,s=this.holes.length;i<s;i++)n[i]=this.holes[i].getPoints(t);return n}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let n=0,i=t.holes.length;n<i;n++){const s=t.holes[n];this.holes.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let n=0,i=this.holes.length;n<i;n++){const s=this.holes[n];t.holes.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let n=0,i=t.holes.length;n<i;n++){const s=t.holes[n];this.holes.push(new Qo().fromJSON(s))}return this}}function __(e,t,n=2){const i=t&&t.length,s=i?t[0]*n:e.length;let a=Om(e,0,s,n,!0);const o=[];if(!a||a.next===a.prev)return o;let r,c,l;if(i&&(a=S_(e,t,a,n)),e.length>80*n){r=e[0],c=e[1];let d=r,f=c;for(let u=n;u<s;u+=n){const h=e[u],p=e[u+1];h<r&&(r=h),p<c&&(c=p),h>d&&(d=h),p>f&&(f=p)}l=Math.max(d-r,f-c),l=l!==0?32767/l:0}return jo(a,o,n,r,c,l,0),o}function Om(e,t,n,i,s){let a;if(s===D_(e,t,n,i)>0)for(let o=t;o<n;o+=i)a=K0(o/i|0,e[o],e[o+1],a);else for(let o=n-i;o>=t;o-=i)a=K0(o/i|0,e[o],e[o+1],a);return a&&Fa(a,a.next)&&(er(a),a=a.next),a}function Ds(e,t){if(!e)return e;t||(t=e);let n=e,i;do if(i=!1,!n.steiner&&(Fa(n,n.next)||Te(n.prev,n,n.next)===0)){if(er(n),n=t=n.prev,n===n.next)break;i=!0}else n=n.next;while(i||n!==t);return t}function jo(e,t,n,i,s,a,o){if(!e)return;!o&&a&&z_(e,i,s,a);let r=e;for(;e.prev!==e.next;){const c=e.prev,l=e.next;if(a?M_(e,i,s,a):v_(e)){t.push(c.i,e.i,l.i),er(e),e=l.next,r=l.next;continue}if(e=l,e===r){o?o===1?(e=y_(Ds(e),t),jo(e,t,n,i,s,a,2)):o===2&&b_(e,t,n,i,s,a):jo(Ds(e),t,n,i,s,a,1);break}}}function v_(e){const t=e.prev,n=e,i=e.next;if(Te(t,n,i)>=0)return!1;const s=t.x,a=n.x,o=i.x,r=t.y,c=n.y,l=i.y,d=Math.min(s,a,o),f=Math.min(r,c,l),u=Math.max(s,a,o),h=Math.max(r,c,l);let p=i.next;for(;p!==t;){if(p.x>=d&&p.x<=u&&p.y>=f&&p.y<=h&&vo(s,r,a,c,o,l,p.x,p.y)&&Te(p.prev,p,p.next)>=0)return!1;p=p.next}return!0}function M_(e,t,n,i){const s=e.prev,a=e,o=e.next;if(Te(s,a,o)>=0)return!1;const r=s.x,c=a.x,l=o.x,d=s.y,f=a.y,u=o.y,h=Math.min(r,c,l),p=Math.min(d,f,u),_=Math.max(r,c,l),x=Math.max(d,f,u),m=Df(h,p,t,n,i),v=Df(_,x,t,n,i);let y=e.prevZ,g=e.nextZ;for(;y&&y.z>=m&&g&&g.z<=v;){if(y.x>=h&&y.x<=_&&y.y>=p&&y.y<=x&&y!==s&&y!==o&&vo(r,d,c,f,l,u,y.x,y.y)&&Te(y.prev,y,y.next)>=0||(y=y.prevZ,g.x>=h&&g.x<=_&&g.y>=p&&g.y<=x&&g!==s&&g!==o&&vo(r,d,c,f,l,u,g.x,g.y)&&Te(g.prev,g,g.next)>=0))return!1;g=g.nextZ}for(;y&&y.z>=m;){if(y.x>=h&&y.x<=_&&y.y>=p&&y.y<=x&&y!==s&&y!==o&&vo(r,d,c,f,l,u,y.x,y.y)&&Te(y.prev,y,y.next)>=0)return!1;y=y.prevZ}for(;g&&g.z<=v;){if(g.x>=h&&g.x<=_&&g.y>=p&&g.y<=x&&g!==s&&g!==o&&vo(r,d,c,f,l,u,g.x,g.y)&&Te(g.prev,g,g.next)>=0)return!1;g=g.nextZ}return!0}function y_(e,t){let n=e;do{const i=n.prev,s=n.next.next;!Fa(i,s)&&Bm(i,n,n.next,s)&&tr(i,s)&&tr(s,i)&&(t.push(i.i,n.i,s.i),er(n),er(n.next),n=e=s),n=n.next}while(n!==e);return Ds(n)}function b_(e,t,n,i,s,a){let o=e;do{let r=o.next.next;for(;r!==o.prev;){if(o.i!==r.i&&P_(o,r)){let c=Gm(o,r);o=Ds(o,o.next),c=Ds(c,c.next),jo(o,t,n,i,s,a,0),jo(c,t,n,i,s,a,0);return}r=r.next}o=o.next}while(o!==e)}function S_(e,t,n,i){const s=[];for(let a=0,o=t.length;a<o;a++){const r=t[a]*i,c=a<o-1?t[a+1]*i:e.length,l=Om(e,r,c,i,!1);l===l.next&&(l.steiner=!0),s.push(C_(l))}s.sort(w_);for(let a=0;a<s.length;a++)n=E_(s[a],n);return n}function w_(e,t){let n=e.x-t.x;if(n===0&&(n=e.y-t.y,n===0)){const i=(e.next.y-e.y)/(e.next.x-e.x),s=(t.next.y-t.y)/(t.next.x-t.x);n=i-s}return n}function E_(e,t){const n=T_(e,t);if(!n)return t;const i=Gm(n,e);return Ds(i,i.next),Ds(n,n.next)}function T_(e,t){let n=t;const i=e.x,s=e.y;let a=-1/0,o;if(Fa(e,n))return n;do{if(Fa(e,n.next))return n.next;if(s<=n.y&&s>=n.next.y&&n.next.y!==n.y){const f=n.x+(s-n.y)*(n.next.x-n.x)/(n.next.y-n.y);if(f<=i&&f>a&&(a=f,o=n.x<n.next.x?n:n.next,f===i))return o}n=n.next}while(n!==t);if(!o)return null;const r=o,c=o.x,l=o.y;let d=1/0;n=o;do{if(i>=n.x&&n.x>=c&&i!==n.x&&Fm(s<l?i:a,s,c,l,s<l?a:i,s,n.x,n.y)){const f=Math.abs(s-n.y)/(i-n.x);tr(n,e)&&(f<d||f===d&&(n.x>o.x||n.x===o.x&&A_(o,n)))&&(o=n,d=f)}n=n.next}while(n!==r);return o}function A_(e,t){return Te(e.prev,e,t.prev)<0&&Te(t.next,e,e.next)<0}function z_(e,t,n,i){let s=e;do s.z===0&&(s.z=Df(s.x,s.y,t,n,i)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==e);s.prevZ.nextZ=null,s.prevZ=null,R_(s)}function R_(e){let t,n=1;do{let i=e,s;e=null;let a=null;for(t=0;i;){t++;let o=i,r=0;for(let l=0;l<n&&(r++,o=o.nextZ,!!o);l++);let c=n;for(;r>0||c>0&&o;)r!==0&&(c===0||!o||i.z<=o.z)?(s=i,i=i.nextZ,r--):(s=o,o=o.nextZ,c--),a?a.nextZ=s:e=s,s.prevZ=a,a=s;i=o}a.nextZ=null,n*=2}while(t>1);return e}function Df(e,t,n,i,s){return e=(e-n)*s|0,t=(t-i)*s|0,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,e|t<<1}function C_(e){let t=e,n=e;do(t.x<n.x||t.x===n.x&&t.y<n.y)&&(n=t),t=t.next;while(t!==e);return n}function Fm(e,t,n,i,s,a,o,r){return(s-o)*(t-r)>=(e-o)*(a-r)&&(e-o)*(i-r)>=(n-o)*(t-r)&&(n-o)*(a-r)>=(s-o)*(i-r)}function vo(e,t,n,i,s,a,o,r){return!(e===o&&t===r)&&Fm(e,t,n,i,s,a,o,r)}function P_(e,t){return e.next.i!==t.i&&e.prev.i!==t.i&&!L_(e,t)&&(tr(e,t)&&tr(t,e)&&I_(e,t)&&(Te(e.prev,e,t.prev)||Te(e,t.prev,t))||Fa(e,t)&&Te(e.prev,e,e.next)>0&&Te(t.prev,t,t.next)>0)}function Te(e,t,n){return(t.y-e.y)*(n.x-t.x)-(t.x-e.x)*(n.y-t.y)}function Fa(e,t){return e.x===t.x&&e.y===t.y}function Bm(e,t,n,i){const s=Zr(Te(e,t,n)),a=Zr(Te(e,t,i)),o=Zr(Te(n,i,e)),r=Zr(Te(n,i,t));return!!(s!==a&&o!==r||s===0&&Yr(e,n,t)||a===0&&Yr(e,i,t)||o===0&&Yr(n,e,i)||r===0&&Yr(n,t,i))}function Yr(e,t,n){return t.x<=Math.max(e.x,n.x)&&t.x>=Math.min(e.x,n.x)&&t.y<=Math.max(e.y,n.y)&&t.y>=Math.min(e.y,n.y)}function Zr(e){return e>0?1:e<0?-1:0}function L_(e,t){let n=e;do{if(n.i!==e.i&&n.next.i!==e.i&&n.i!==t.i&&n.next.i!==t.i&&Bm(n,n.next,e,t))return!0;n=n.next}while(n!==e);return!1}function tr(e,t){return Te(e.prev,e,e.next)<0?Te(e,t,e.next)>=0&&Te(e,e.prev,t)>=0:Te(e,t,e.prev)<0||Te(e,e.next,t)<0}function I_(e,t){let n=e,i=!1;const s=(e.x+t.x)/2,a=(e.y+t.y)/2;do n.y>a!=n.next.y>a&&n.next.y!==n.y&&s<(n.next.x-n.x)*(a-n.y)/(n.next.y-n.y)+n.x&&(i=!i),n=n.next;while(n!==e);return i}function Gm(e,t){const n=Nf(e.i,e.x,e.y),i=Nf(t.i,t.x,t.y),s=e.next,a=t.prev;return e.next=t,t.prev=e,n.next=s,s.prev=n,i.next=n,n.prev=i,a.next=i,i.prev=a,i}function K0(e,t,n,i){const s=Nf(e,t,n);return i?(s.next=i.next,s.prev=i,i.next.prev=s,i.next=s):(s.prev=s,s.next=s),s}function er(e){e.next.prev=e.prev,e.prev.next=e.next,e.prevZ&&(e.prevZ.nextZ=e.nextZ),e.nextZ&&(e.nextZ.prevZ=e.prevZ)}function Nf(e,t,n){return{i:e,x:t,y:n,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function D_(e,t,n,i){let s=0;for(let a=t,o=n-i;a<n;a+=i)s+=(e[o]-e[a])*(e[a+1]+e[o+1]),o=a;return s}class N_{static triangulate(t,n,i=2){return __(t,n,i)}}class Ti{static area(t){const n=t.length;let i=0;for(let s=n-1,a=0;a<n;s=a++)i+=t[s].x*t[a].y-t[a].x*t[s].y;return i*.5}static isClockWise(t){return Ti.area(t)<0}static triangulateShape(t,n){const i=[],s=[],a=[];J0(t),Q0(i,t);let o=t.length;n.forEach(J0);for(let c=0;c<n.length;c++)s.push(o),o+=n[c].length,Q0(i,n[c]);const r=N_.triangulate(i,s);for(let c=0;c<r.length;c+=3)a.push(r.slice(c,c+3));return a}}function J0(e){const t=e.length;t>2&&e[t-1].equals(e[0])&&e.pop()}function Q0(e,t){for(let n=0;n<t.length;n++)e.push(t[n].x),e.push(t[n].y)}class $s extends Pe{constructor(t=new as([new St(.5,.5),new St(-.5,.5),new St(-.5,-.5),new St(.5,-.5)]),n={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:n},t=Array.isArray(t)?t:[t];const i=this,s=[],a=[];for(let r=0,c=t.length;r<c;r++){const l=t[r];o(l)}this.setAttribute("position",new le(s,3)),this.setAttribute("uv",new le(a,2)),this.computeVertexNormals();function o(r){const c=[],l=n.curveSegments!==void 0?n.curveSegments:12,d=n.steps!==void 0?n.steps:1,f=n.depth!==void 0?n.depth:1;let u=n.bevelEnabled!==void 0?n.bevelEnabled:!0,h=n.bevelThickness!==void 0?n.bevelThickness:.2,p=n.bevelSize!==void 0?n.bevelSize:h-.1,_=n.bevelOffset!==void 0?n.bevelOffset:0,x=n.bevelSegments!==void 0?n.bevelSegments:3;const m=n.extrudePath,v=n.UVGenerator!==void 0?n.UVGenerator:U_;let y,g=!1,b,S,E,M;if(m){y=m.getSpacedPoints(d),g=!0,u=!1;const ct=m.isCatmullRomCurve3?m.closed:!1;b=m.computeFrenetFrames(d,ct),S=new Z,E=new Z,M=new Z}u||(x=0,h=0,p=0,_=0);const T=r.extractPoints(l);let z=T.shape;const R=T.holes;if(!Ti.isClockWise(z)){z=z.reverse();for(let ct=0,xt=R.length;ct<xt;ct++){const q=R[ct];Ti.isClockWise(q)&&(R[ct]=q.reverse())}}function O(ct){const q=10000000000000001e-36;let et=ct[0];for(let X=1;X<=ct.length;X++){const lt=X%ct.length,gt=ct[lt],ft=gt.x-et.x,wt=gt.y-et.y,G=ft*ft+wt*wt,Rt=Math.max(Math.abs(gt.x),Math.abs(gt.y),Math.abs(et.x),Math.abs(et.y)),Dt=q*Rt*Rt;if(G<=Dt){ct.splice(lt,1),X--;continue}et=gt}}O(z),R.forEach(O);const C=R.length,F=z;for(let ct=0;ct<C;ct++){const xt=R[ct];z=z.concat(xt)}function W(ct,xt,q){return xt||ce("ExtrudeGeometry: vec does not exist"),ct.clone().addScaledVector(xt,q)}const U=z.length;function B(ct,xt,q){let et,X,lt;const gt=ct.x-xt.x,ft=ct.y-xt.y,wt=q.x-ct.x,G=q.y-ct.y,Rt=gt*gt+ft*ft,Dt=gt*G-ft*wt;if(Math.abs(Dt)>Number.EPSILON){const I=Math.sqrt(Rt),w=Math.sqrt(wt*wt+G*G),$=xt.x-ft/I,tt=xt.y+gt/I,ot=q.x-G/w,Mt=q.y+wt/w,yt=((ot-$)*G-(Mt-tt)*wt)/(gt*G-ft*wt);et=$+gt*yt-ct.x,X=tt+ft*yt-ct.y;const rt=et*et+X*X;if(rt<=2)return new St(et,X);lt=Math.sqrt(rt/2)}else{let I=!1;gt>Number.EPSILON?wt>Number.EPSILON&&(I=!0):gt<-Number.EPSILON?wt<-Number.EPSILON&&(I=!0):Math.sign(ft)===Math.sign(G)&&(I=!0),I?(et=-ft,X=gt,lt=Math.sqrt(Rt)):(et=gt,X=ft,lt=Math.sqrt(Rt/2))}return new St(et/lt,X/lt)}const P=[];for(let ct=0,xt=F.length,q=xt-1,et=ct+1;ct<xt;ct++,q++,et++)q===xt&&(q=0),et===xt&&(et=0),P[ct]=B(F[ct],F[q],F[et]);const H=[];let k,L=P.concat();for(let ct=0,xt=C;ct<xt;ct++){const q=R[ct];k=[];for(let et=0,X=q.length,lt=X-1,gt=et+1;et<X;et++,lt++,gt++)lt===X&&(lt=0),gt===X&&(gt=0),k[et]=B(q[et],q[lt],q[gt]);H.push(k),L=L.concat(k)}let V;if(x===0)V=Ti.triangulateShape(F,R);else{const ct=[],xt=[];for(let q=0;q<x;q++){const et=q/x,X=h*Math.cos(et*Math.PI/2),lt=p*Math.sin(et*Math.PI/2)+_;for(let gt=0,ft=F.length;gt<ft;gt++){const wt=W(F[gt],P[gt],lt);dt(wt.x,wt.y,-X),et===0&&ct.push(wt)}for(let gt=0,ft=C;gt<ft;gt++){const wt=R[gt];k=H[gt];const G=[];for(let Rt=0,Dt=wt.length;Rt<Dt;Rt++){const I=W(wt[Rt],k[Rt],lt);dt(I.x,I.y,-X),et===0&&G.push(I)}et===0&&xt.push(G)}}V=Ti.triangulateShape(ct,xt)}const at=V.length,j=p+_;for(let ct=0;ct<U;ct++){const xt=u?W(z[ct],L[ct],j):z[ct];g?(E.copy(b.normals[0]).multiplyScalar(xt.x),S.copy(b.binormals[0]).multiplyScalar(xt.y),M.copy(y[0]).add(E).add(S),dt(M.x,M.y,M.z)):dt(xt.x,xt.y,0)}for(let ct=1;ct<=d;ct++)for(let xt=0;xt<U;xt++){const q=u?W(z[xt],L[xt],j):z[xt];g?(E.copy(b.normals[ct]).multiplyScalar(q.x),S.copy(b.binormals[ct]).multiplyScalar(q.y),M.copy(y[ct]).add(E).add(S),dt(M.x,M.y,M.z)):dt(q.x,q.y,f/d*ct)}for(let ct=x-1;ct>=0;ct--){const xt=ct/x,q=h*Math.cos(xt*Math.PI/2),et=p*Math.sin(xt*Math.PI/2)+_;for(let X=0,lt=F.length;X<lt;X++){const gt=W(F[X],P[X],et);dt(gt.x,gt.y,f+q)}for(let X=0,lt=R.length;X<lt;X++){const gt=R[X];k=H[X];for(let ft=0,wt=gt.length;ft<wt;ft++){const G=W(gt[ft],k[ft],et);g?dt(G.x,G.y+y[d-1].y,y[d-1].x+q):dt(G.x,G.y,f+q)}}}pt(),J();function pt(){const ct=s.length/3;if(u){let xt=0,q=U*xt;for(let et=0;et<at;et++){const X=V[et];Ot(X[2]+q,X[1]+q,X[0]+q)}xt=d+x*2,q=U*xt;for(let et=0;et<at;et++){const X=V[et];Ot(X[0]+q,X[1]+q,X[2]+q)}}else{for(let xt=0;xt<at;xt++){const q=V[xt];Ot(q[2],q[1],q[0])}for(let xt=0;xt<at;xt++){const q=V[xt];Ot(q[0]+U*d,q[1]+U*d,q[2]+U*d)}}i.addGroup(ct,s.length/3-ct,0)}function J(){const ct=s.length/3;let xt=0;Q(F,xt),xt+=F.length;for(let q=0,et=R.length;q<et;q++){const X=R[q];Q(X,xt),xt+=X.length}i.addGroup(ct,s.length/3-ct,1)}function Q(ct,xt){let q=ct.length;for(;--q>=0;){const et=q;let X=q-1;X<0&&(X=ct.length-1);for(let lt=0,gt=d+x*2;lt<gt;lt++){const ft=U*lt,wt=U*(lt+1),G=xt+et+ft,Rt=xt+X+ft,Dt=xt+X+wt,I=xt+et+wt;mt(G,Rt,Dt,I)}}}function dt(ct,xt,q){c.push(ct),c.push(xt),c.push(q)}function Ot(ct,xt,q){Gt(ct),Gt(xt),Gt(q);const et=s.length/3,X=v.generateTopUV(i,s,et-3,et-2,et-1);Qt(X[0]),Qt(X[1]),Qt(X[2])}function mt(ct,xt,q,et){Gt(ct),Gt(xt),Gt(et),Gt(xt),Gt(q),Gt(et);const X=s.length/3,lt=v.generateSideWallUV(i,s,X-6,X-3,X-2,X-1);Qt(lt[0]),Qt(lt[1]),Qt(lt[3]),Qt(lt[1]),Qt(lt[2]),Qt(lt[3])}function Gt(ct){s.push(c[ct*3+0]),s.push(c[ct*3+1]),s.push(c[ct*3+2])}function Qt(ct){a.push(ct.x),a.push(ct.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),n=this.parameters.shapes,i=this.parameters.options;return O_(n,i,t)}static fromJSON(t,n){const i=[];for(let a=0,o=t.shapes.length;a<o;a++){const r=n[t.shapes[a]];i.push(r)}const s=t.options.extrudePath;return s!==void 0&&(t.options.extrudePath=new Xc[s.type]().fromJSON(s)),new $s(i,t.options)}}const U_={generateTopUV:function(e,t,n,i,s){const a=t[n*3],o=t[n*3+1],r=t[i*3],c=t[i*3+1],l=t[s*3],d=t[s*3+1];return[new St(a,o),new St(r,c),new St(l,d)]},generateSideWallUV:function(e,t,n,i,s,a){const o=t[n*3],r=t[n*3+1],c=t[n*3+2],l=t[i*3],d=t[i*3+1],f=t[i*3+2],u=t[s*3],h=t[s*3+1],p=t[s*3+2],_=t[a*3],x=t[a*3+1],m=t[a*3+2];return Math.abs(r-d)<Math.abs(o-l)?[new St(o,1-c),new St(l,1-f),new St(u,1-p),new St(_,1-m)]:[new St(r,1-c),new St(d,1-f),new St(h,1-p),new St(x,1-m)]}};function O_(e,t,n){if(n.shapes=[],Array.isArray(e))for(let i=0,s=e.length;i<s;i++){const a=e[i];n.shapes.push(a.uuid)}else n.shapes.push(e.uuid);return n.options=Object.assign({},t),t.extrudePath!==void 0&&(n.options.extrudePath=t.extrudePath.toJSON()),n}class bl extends Pe{constructor(t=1,n=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:n,widthSegments:i,heightSegments:s};const a=t/2,o=n/2,r=Math.floor(i),c=Math.floor(s),l=r+1,d=c+1,f=t/r,u=n/c,h=[],p=[],_=[],x=[];for(let m=0;m<d;m++){const v=m*u-o;for(let y=0;y<l;y++){const g=y*f-a;p.push(g,-v,0),_.push(0,0,1),x.push(y/r),x.push(1-m/c)}}for(let m=0;m<c;m++)for(let v=0;v<r;v++){const y=v+l*m,g=v+l*(m+1),b=v+1+l*(m+1),S=v+1+l*m;h.push(y,g,S),h.push(g,b,S)}this.setIndex(h),this.setAttribute("position",new le(p,3)),this.setAttribute("normal",new le(_,3)),this.setAttribute("uv",new le(x,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new bl(t.width,t.height,t.widthSegments,t.heightSegments)}}class Lu extends Pe{constructor(t=.5,n=1,i=32,s=1,a=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:n,thetaSegments:i,phiSegments:s,thetaStart:a,thetaLength:o},i=Math.max(3,i),s=Math.max(1,s);const r=[],c=[],l=[],d=[];let f=t;const u=(n-t)/s,h=new Z,p=new St;for(let _=0;_<=s;_++){for(let x=0;x<=i;x++){const m=a+x/i*o;h.x=f*Math.cos(m),h.y=f*Math.sin(m),c.push(h.x,h.y,h.z),l.push(0,0,1),p.x=(h.x/n+1)/2,p.y=(h.y/n+1)/2,d.push(p.x,p.y)}f+=u}for(let _=0;_<s;_++){const x=_*(i+1);for(let m=0;m<i;m++){const v=m+x,y=v,g=v+i+1,b=v+i+2,S=v+1;r.push(y,g,S),r.push(g,b,S)}}this.setIndex(r),this.setAttribute("position",new le(c,3)),this.setAttribute("normal",new le(l,3)),this.setAttribute("uv",new le(d,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Lu(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class Iu extends Pe{constructor(t=new as([new St(0,.5),new St(-.5,-.5),new St(.5,-.5)]),n=12){super(),this.type="ShapeGeometry",this.parameters={shapes:t,curveSegments:n};const i=[],s=[],a=[],o=[];let r=0,c=0;if(Array.isArray(t)===!1)l(t);else for(let d=0;d<t.length;d++)l(t[d]),this.addGroup(r,c,d),r+=c,c=0;this.setIndex(i),this.setAttribute("position",new le(s,3)),this.setAttribute("normal",new le(a,3)),this.setAttribute("uv",new le(o,2));function l(d){const f=s.length/3,u=d.extractPoints(n);let h=u.shape;const p=u.holes;Ti.isClockWise(h)===!1&&(h=h.reverse());for(let x=0,m=p.length;x<m;x++){const v=p[x];Ti.isClockWise(v)===!0&&(p[x]=v.reverse())}const _=Ti.triangulateShape(h,p);for(let x=0,m=p.length;x<m;x++){const v=p[x];h=h.concat(v)}for(let x=0,m=h.length;x<m;x++){const v=h[x];s.push(v.x,v.y,0),a.push(0,0,1),o.push(v.x,v.y)}for(let x=0,m=_.length;x<m;x++){const v=_[x],y=v[0]+f,g=v[1]+f,b=v[2]+f;i.push(y,g,b),c+=3}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),n=this.parameters.shapes;return F_(n,t)}static fromJSON(t,n){const i=[];for(let s=0,a=t.shapes.length;s<a;s++){const o=n[t.shapes[s]];i.push(o)}return new Iu(i,t.curveSegments)}}function F_(e,t){if(t.shapes=[],Array.isArray(e))for(let n=0,i=e.length;n<i;n++){const s=e[n];t.shapes.push(s.uuid)}else t.shapes.push(e.uuid);return t}class $c extends Pe{constructor(t=1,n=32,i=16,s=0,a=Math.PI*2,o=0,r=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:n,heightSegments:i,phiStart:s,phiLength:a,thetaStart:o,thetaLength:r},n=Math.max(3,Math.floor(n)),i=Math.max(2,Math.floor(i));const c=Math.min(o+r,Math.PI);let l=0;const d=[],f=new Z,u=new Z,h=[],p=[],_=[],x=[];for(let m=0;m<=i;m++){const v=[],y=m/i,g=o+y*r,b=t*Math.cos(g),S=Math.sqrt(t*t-b*b);let E=0;m===0&&o===0?E=.5/n:m===i&&c===Math.PI&&(E=-.5/n);for(let M=0;M<=n;M++){const T=M/n,z=s+T*a;f.x=-S*Math.cos(z),f.y=b,f.z=S*Math.sin(z),p.push(f.x,f.y,f.z),u.copy(f).normalize(),_.push(u.x,u.y,u.z),x.push(T+E,1-y),v.push(l++)}d.push(v)}for(let m=0;m<i;m++)for(let v=0;v<n;v++){const y=d[m][v+1],g=d[m][v],b=d[m+1][v],S=d[m+1][v+1];(m!==0||o>0)&&h.push(y,g,S),(m!==i-1||c<Math.PI)&&h.push(g,b,S)}this.setIndex(h),this.setAttribute("position",new le(p,3)),this.setAttribute("normal",new le(_,3)),this.setAttribute("uv",new le(x,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new $c(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class cr extends Pe{constructor(t=1,n=.4,i=12,s=48,a=Math.PI*2,o=0,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:n,radialSegments:i,tubularSegments:s,arc:a,thetaStart:o,thetaLength:r},i=Math.floor(i),s=Math.floor(s);const c=[],l=[],d=[],f=[],u=new Z,h=new Z,p=new Z;for(let _=0;_<=i;_++){const x=o+_/i*r;for(let m=0;m<=s;m++){const v=m/s*a;h.x=(t+n*Math.cos(x))*Math.cos(v),h.y=(t+n*Math.cos(x))*Math.sin(v),h.z=n*Math.sin(x),l.push(h.x,h.y,h.z),u.x=t*Math.cos(v),u.y=t*Math.sin(v),p.subVectors(h,u).normalize(),d.push(p.x,p.y,p.z),f.push(m/s),f.push(_/i)}}for(let _=1;_<=i;_++)for(let x=1;x<=s;x++){const m=(s+1)*_+x-1,v=(s+1)*(_-1)+x-1,y=(s+1)*(_-1)+x,g=(s+1)*_+x;c.push(m,v,g),c.push(v,y,g)}this.setIndex(c),this.setAttribute("position",new le(l,3)),this.setAttribute("normal",new le(d,3)),this.setAttribute("uv",new le(f,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new cr(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc,t.thetaStart,t.thetaLength)}}class Du extends Pe{constructor(t=new Nm(new Z(-1,-1,0),new Z(-1,1,0),new Z(1,1,0)),n=64,i=1,s=8,a=!1){super(),this.type="TubeGeometry",this.parameters={path:t,tubularSegments:n,radius:i,radialSegments:s,closed:a};const o=t.computeFrenetFrames(n,a);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;const r=new Z,c=new Z,l=new St;let d=new Z;const f=[],u=[],h=[],p=[];_(),this.setIndex(p),this.setAttribute("position",new le(f,3)),this.setAttribute("normal",new le(u,3)),this.setAttribute("uv",new le(h,2));function _(){for(let y=0;y<n;y++)x(y);x(a===!1?n:0),v(),m()}function x(y){d=t.getPointAt(y/n,d);const g=o.normals[y],b=o.binormals[y];for(let S=0;S<=s;S++){const E=S/s*Math.PI*2,M=Math.sin(E),T=-Math.cos(E);c.x=T*g.x+M*b.x,c.y=T*g.y+M*b.y,c.z=T*g.z+M*b.z,c.normalize(),u.push(c.x,c.y,c.z),r.x=d.x+i*c.x,r.y=d.y+i*c.y,r.z=d.z+i*c.z,f.push(r.x,r.y,r.z)}}function m(){for(let y=1;y<=n;y++)for(let g=1;g<=s;g++){const b=(s+1)*(y-1)+(g-1),S=(s+1)*y+(g-1),E=(s+1)*y+g,M=(s+1)*(y-1)+g;p.push(b,S,M),p.push(S,E,M)}}function v(){for(let y=0;y<=n;y++)for(let g=0;g<=s;g++)l.x=y/n,l.y=g/s,h.push(l.x,l.y)}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON();return t.path=this.parameters.path.toJSON(),t}static fromJSON(t){return new Du(new Xc[t.path.type]().fromJSON(t.path),t.tubularSegments,t.radius,t.radialSegments,t.closed)}}function Ba(e){const t={};for(const n in e){t[n]={};for(const i in e[n]){const s=e[n][i];if(j0(s))s.isRenderTargetTexture?(Kt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[n][i]=null):t[n][i]=s.clone();else if(Array.isArray(s))if(j0(s[0])){const a=[];for(let o=0,r=s.length;o<r;o++)a[o]=s[o].clone();t[n][i]=a}else t[n][i]=s.slice();else t[n][i]=s}}return t}function an(e){const t={};for(let n=0;n<e.length;n++){const i=Ba(e[n]);for(const s in i)t[s]=i[s]}return t}function j0(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function B_(e){const t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function Hm(e){const t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:oe.workingColorSpace}const G_={clone:Ba,merge:an};var H_=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,V_=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class fi extends Xa{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=H_,this.fragmentShader=V_,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Ba(t.uniforms),this.uniformsGroups=B_(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){const n=super.toJSON(t);n.glslVersion=this.glslVersion,n.uniforms={};for(const s in this.uniforms){const o=this.uniforms[s].value;o&&o.isTexture?n.uniforms[s]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?n.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?n.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?n.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?n.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?n.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?n.uniforms[s]={type:"m4",value:o.toArray()}:n.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(n.defines=this.defines),n.vertexShader=this.vertexShader,n.fragmentShader=this.fragmentShader,n.lights=this.lights,n.clipping=this.clipping;const i={};for(const s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(n.extensions=i),n}fromJSON(t,n){if(super.fromJSON(t,n),t.uniforms!==void 0)for(const i in t.uniforms){const s=t.uniforms[i];switch(this.uniforms[i]={},s.type){case"t":this.uniforms[i].value=n[s.value]||null;break;case"c":this.uniforms[i].value=new te().setHex(s.value);break;case"v2":this.uniforms[i].value=new St().fromArray(s.value);break;case"v3":this.uniforms[i].value=new Z().fromArray(s.value);break;case"v4":this.uniforms[i].value=new Ee().fromArray(s.value);break;case"m3":this.uniforms[i].value=new jt().fromArray(s.value);break;case"m4":this.uniforms[i].value=new be().fromArray(s.value);break;default:this.uniforms[i].value=s.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(const i in t.extensions)this.extensions[i]=t.extensions[i];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}}class W_ extends fi{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class nr extends Xa{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new te(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new te(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Hc,this.normalScale=new St(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ui,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Vm extends Xa{constructor(t){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new te(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new te(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Hc,this.normalScale=new St(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ui,this.combine=gu,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.envMapIntensity=t.envMapIntensity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class k_ extends Xa{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=y1,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class X_ extends Xa{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}class Nu extends We{constructor(t,n=1){super(),this.isLight=!0,this.type="Light",this.color=new te(t),this.intensity=n}copy(t,n){return super.copy(t,n),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const n=super.toJSON(t);return n.object.color=this.color.getHex(),n.object.intensity=this.intensity,n}}class $_ extends Nu{constructor(t,n,i){super(t,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(We.DEFAULT_UP),this.updateMatrix(),this.groundColor=new te(n)}copy(t,n){return super.copy(t,n),this.groundColor.copy(t.groundColor),this}toJSON(t){const n=super.toJSON(t);return n.object.groundColor=this.groundColor.getHex(),n}}const md=new be,th=new Z,eh=new Z;class Wm{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new St(512,512),this.mapType=yn,this.map=null,this.mapPass=null,this.matrix=new be,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new zu,this._frameExtents=new St(1,1),this._viewportCount=1,this._viewports=[new Ee(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(t){const n=this.camera;th.setFromMatrixPosition(t.matrixWorld),n.position.copy(th),eh.setFromMatrixPosition(t.target.matrixWorld),n.lookAt(eh),n.updateMatrixWorld(),this._updateMatrix(n,this.matrix,this._frustum)}_updateMatrix(t,n,i,s){md.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),i.setFromProjectionMatrix(md,t.coordinateSystem,t.reversedDepth);const a=this._frameExtents,o=s?s.z/a.x:1,r=s?s.w/a.y:1,c=s?s.x/a.x:0,l=s?s.y/a.y:0;t.coordinateSystem===Ko||t.reversedDepth?n.set(.5*o,0,0,.5*o+c,0,.5*r,0,.5*r+l,0,0,1,0,0,0,0,1):n.set(.5*o,0,0,.5*o+c,0,.5*r,0,.5*r+l,0,0,.5,.5,0,0,0,1),n.multiply(md)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return t.intensity=this.intensity,t.bias=this.bias,t.normalBias=this.normalBias,t.radius=this.radius,t.blurSamples=this.blurSamples,t.mapSize=this.mapSize.toArray(),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}const Kr=new Z,Jr=new ka,Qn=new Z;class km extends We{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new be,this.projectionMatrix=new be,this.projectionMatrixInverse=new be,this.coordinateSystem=ai,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,n){return super.copy(t,n),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(Kr,Jr,Qn),Qn.x===1&&Qn.y===1&&Qn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Kr,Jr,Qn.set(1,1,1)).invert()}updateWorldMatrix(t,n,i=!1){super.updateWorldMatrix(t,n,i),this.matrixWorld.decompose(Kr,Jr,Qn),Qn.x===1&&Qn.y===1&&Qn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Kr,Jr,Qn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const ki=new Z,nh=new St,ih=new St;class Pn extends km{constructor(t=50,n=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=n,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,n){return super.copy(t,n),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const n=.5*this.getFilmHeight()/t;this.fov=If*2*Math.atan(n),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(kl*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return If*2*Math.atan(Math.tan(kl*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,n,i){ki.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ki.x,ki.y).multiplyScalar(-t/ki.z),ki.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(ki.x,ki.y).multiplyScalar(-t/ki.z)}getViewSize(t,n){return this.getViewBounds(t,nh,ih),n.subVectors(ih,nh)}setViewOffset(t,n,i,s,a,o){this.aspect=t/n,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=s,this.view.width=a,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let n=t*Math.tan(kl*.5*this.fov)/this.zoom,i=2*n,s=this.aspect*i,a=-.5*s;const o=this.view;if(this.view!==null&&this.view.enabled){const c=o.fullWidth,l=o.fullHeight;a+=o.offsetX*s/c,n-=o.offsetY*i/l,s*=o.width/c,i*=o.height/l}const r=this.filmOffset;r!==0&&(a+=t*r/this.getFilmWidth()),this.projectionMatrix.makePerspective(a,a+s,n,n-i,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const n=super.toJSON(t);return n.object.fov=this.fov,n.object.zoom=this.zoom,n.object.near=this.near,n.object.far=this.far,n.object.focus=this.focus,n.object.aspect=this.aspect,this.view!==null&&(n.object.view=Object.assign({},this.view)),n.object.filmGauge=this.filmGauge,n.object.filmOffset=this.filmOffset,n}}class q_ extends Wm{constructor(){super(new Pn(90,1,.5,500)),this.isPointLightShadow=!0}}class Uu extends Nu{constructor(t,n,i=0,s=2){super(t,n),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=s,this.shadow=new q_}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(t,n){return super.copy(t,n),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}toJSON(t){const n=super.toJSON(t);return n.object.distance=this.distance,n.object.decay=this.decay,n.object.shadow=this.shadow.toJSON(),n}}class Sl extends km{constructor(t=-1,n=1,i=1,s=-1,a=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=n,this.top=i,this.bottom=s,this.near=a,this.far=o,this.updateProjectionMatrix()}copy(t,n){return super.copy(t,n),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,n,i,s,a,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=s,this.view.width=a,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),n=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let a=i-t,o=i+t,r=s+n,c=s-n;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,d=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=l*this.view.offsetX,o=a+l*this.view.width,r-=d*this.view.offsetY,c=r-d*this.view.height}this.projectionMatrix.makeOrthographic(a,o,r,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const n=super.toJSON(t);return n.object.zoom=this.zoom,n.object.left=this.left,n.object.right=this.right,n.object.top=this.top,n.object.bottom=this.bottom,n.object.near=this.near,n.object.far=this.far,this.view!==null&&(n.object.view=Object.assign({},this.view)),n}}class Y_ extends Wm{constructor(){super(new Sl(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Z_ extends Nu{constructor(t,n){super(t,n),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(We.DEFAULT_UP),this.updateMatrix(),this.target=new We,this.shadow=new Y_}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){const n=super.toJSON(t);return n.object.shadow=this.shadow.toJSON(),n.object.target=this.target.uuid,n}}const fa=-90,ua=1;class K_ extends We{constructor(t,n,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new Pn(fa,ua,t,n);s.layers=this.layers,this.add(s);const a=new Pn(fa,ua,t,n);a.layers=this.layers,this.add(a);const o=new Pn(fa,ua,t,n);o.layers=this.layers,this.add(o);const r=new Pn(fa,ua,t,n);r.layers=this.layers,this.add(r);const c=new Pn(fa,ua,t,n);c.layers=this.layers,this.add(c);const l=new Pn(fa,ua,t,n);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const t=this.coordinateSystem,n=this.children.concat(),[i,s,a,o,r,c]=n;for(const l of n)this.remove(l);if(t===ai)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),a.up.set(0,0,-1),a.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),r.up.set(0,1,0),r.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(t===Ko)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),a.up.set(0,0,1),a.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),r.up.set(0,-1,0),r.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const l of n)this.add(l),l.updateMatrixWorld()}update(t,n){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[a,o,r,c,l,d]=this.children,f=t.getRenderTarget(),u=t.getActiveCubeFace(),h=t.getActiveMipmapLevel(),p=t.xr.enabled;t.xr.enabled=!1;const _=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let x=!1;t.isWebGLRenderer===!0?x=t.state.buffers.depth.getReversed():x=t.reversedDepthBuffer,t.setRenderTarget(i,0,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(n,a),t.setRenderTarget(i,1,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(n,o),t.setRenderTarget(i,2,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(n,r),t.setRenderTarget(i,3,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(n,c),t.setRenderTarget(i,4,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(n,l),i.texture.generateMipmaps=_,t.setRenderTarget(i,5,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(n,d),t.setRenderTarget(f,u,h),t.xr.enabled=p,i.texture.needsPMREMUpdate=!0}}class J_ extends Pn{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}}class Xm{static{Xm.prototype.isMatrix2=!0}constructor(t,n,i,s){this.elements=[1,0,0,1],t!==void 0&&this.set(t,n,i,s)}identity(){return this.set(1,0,0,1),this}fromArray(t,n=0){for(let i=0;i<4;i++)this.elements[i]=t[i+n];return this}set(t,n,i,s){const a=this.elements;return a[0]=t,a[2]=n,a[1]=i,a[3]=s,this}}function sh(e,t,n,i){const s=Q_(i);switch(n){case vm:return e*t;case ym:return e*t/s.components*s.byteLength;case yu:return e*t/s.components*s.byteLength;case Is:return e*t*2/s.components*s.byteLength;case bu:return e*t*2/s.components*s.byteLength;case Mm:return e*t*3/s.components*s.byteLength;case $n:return e*t*4/s.components*s.byteLength;case Su:return e*t*4/s.components*s.byteLength;case Ec:case Tc:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Ac:case zc:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case sf:case of:return Math.max(e,16)*Math.max(t,8)/4;case nf:case af:return Math.max(e,8)*Math.max(t,8)/2;case rf:case cf:case df:case ff:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case lf:case Bc:case uf:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case hf:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case pf:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case mf:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case xf:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case gf:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case _f:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case vf:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case Mf:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case yf:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case bf:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case Sf:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case wf:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case Ef:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case Tf:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case Af:case zf:case Rf:return Math.ceil(e/4)*Math.ceil(t/4)*16;case Cf:case Pf:return Math.ceil(e/4)*Math.ceil(t/4)*8;case Gc:case Lf:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${n} format.`)}function Q_(e){switch(e){case yn:case mm:return{byteLength:1,components:1};case Yo:case xm:case di:return{byteLength:2,components:1};case vu:case Mu:return{byteLength:2,components:4};case li:case _u:case si:return{byteLength:4,components:1};case gm:case _m:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:xu}}));typeof window<"u"&&(window.__THREE__?Kt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=xu);function $m(){let e=null,t=!1,n=null,i=null;function s(a,o){i=e.requestAnimationFrame(s),n(a,o)}return{start:function(){t!==!0&&n!==null&&e!==null&&(i=e.requestAnimationFrame(s),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(a){n=a},setContext:function(a){e=a}}}function j_(e){const t=new WeakMap;function n(r,c){const l=r.array,d=r.usage,f=l.byteLength,u=e.createBuffer();e.bindBuffer(c,u),e.bufferData(c,l,d),r.onUploadCallback();let h;if(l instanceof Float32Array)h=e.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)h=e.HALF_FLOAT;else if(l instanceof Uint16Array)r.isFloat16BufferAttribute?h=e.HALF_FLOAT:h=e.UNSIGNED_SHORT;else if(l instanceof Int16Array)h=e.SHORT;else if(l instanceof Uint32Array)h=e.UNSIGNED_INT;else if(l instanceof Int32Array)h=e.INT;else if(l instanceof Int8Array)h=e.BYTE;else if(l instanceof Uint8Array)h=e.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)h=e.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:u,type:h,bytesPerElement:l.BYTES_PER_ELEMENT,version:r.version,size:f}}function i(r,c,l){const d=c.array,f=c.updateRanges;if(e.bindBuffer(l,r),f.length===0)e.bufferSubData(l,0,d);else{f.sort((h,p)=>h.start-p.start);let u=0;for(let h=1;h<f.length;h++){const p=f[u],_=f[h];_.start<=p.start+p.count+1?p.count=Math.max(p.count,_.start+_.count-p.start):(++u,f[u]=_)}f.length=u+1;for(let h=0,p=f.length;h<p;h++){const _=f[h];e.bufferSubData(l,_.start*d.BYTES_PER_ELEMENT,d,_.start,_.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(r){return r.isInterleavedBufferAttribute&&(r=r.data),t.get(r)}function a(r){r.isInterleavedBufferAttribute&&(r=r.data);const c=t.get(r);c&&(e.deleteBuffer(c.buffer),t.delete(r))}function o(r,c){if(r.isInterleavedBufferAttribute&&(r=r.data),r.isGLBufferAttribute){const d=t.get(r);(!d||d.version<r.version)&&t.set(r,{buffer:r.buffer,type:r.type,bytesPerElement:r.elementSize,version:r.version});return}const l=t.get(r);if(l===void 0)t.set(r,n(r,c));else if(l.version<r.version){if(l.size!==r.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(l.buffer,r,c),l.version=r.version}}return{get:s,remove:a,update:o}}var tv=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,ev=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,nv=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,iv=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,sv=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,av=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,ov=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,rv=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,cv=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,lv=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,dv=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,fv=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,uv=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,hv=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,pv=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,mv=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,xv=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,gv=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,_v=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,vv=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Mv=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,yv=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,bv=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,Sv=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,wv=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Ev=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,Tv=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Av=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,zv=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Rv=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Cv="gl_FragColor = linearToOutputTexel( gl_FragColor );",Pv=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Lv=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,Iv=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Dv=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Nv=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Uv=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Ov=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Fv=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Bv=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Gv=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Hv=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Vv=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Wv=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,kv=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Xv=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,$v=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,qv=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Yv=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Zv=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Kv=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Jv=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Qv=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,jv=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,tM=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,eM=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,nM=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,iM=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,sM=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,aM=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,oM=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,rM=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,cM=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,lM=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,dM=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,fM=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,uM=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,hM=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,pM=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,mM=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,xM=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,gM=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,_M=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,vM=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,MM=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,yM=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,bM=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,SM=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,wM=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,EM=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,TM=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,AM=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,zM=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,RM=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,CM=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,PM=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,LM=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,IM=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,DM=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,NM=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,UM=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,OM=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,FM=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,BM=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,GM=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,HM=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,VM=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,WM=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,kM=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,XM=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,$M=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,qM=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,YM=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,ZM=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,KM=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,JM=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,QM=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,jM=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const ty=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,ey=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ny=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,iy=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,sy=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,ay=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,oy=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,ry=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,cy=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,ly=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,dy=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,fy=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,uy=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,hy=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,py=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,my=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,xy=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,gy=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_y=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,vy=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,My=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,yy=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,by=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Sy=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,wy=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Ey=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ty=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Ay=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,zy=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Ry=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Cy=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Py=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Ly=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Iy=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,ie={alphahash_fragment:tv,alphahash_pars_fragment:ev,alphamap_fragment:nv,alphamap_pars_fragment:iv,alphatest_fragment:sv,alphatest_pars_fragment:av,aomap_fragment:ov,aomap_pars_fragment:rv,batching_pars_vertex:cv,batching_vertex:lv,begin_vertex:dv,beginnormal_vertex:fv,bsdfs:uv,iridescence_fragment:hv,bumpmap_pars_fragment:pv,clipping_planes_fragment:mv,clipping_planes_pars_fragment:xv,clipping_planes_pars_vertex:gv,clipping_planes_vertex:_v,color_fragment:vv,color_pars_fragment:Mv,color_pars_vertex:yv,color_vertex:bv,common:Sv,cube_uv_reflection_fragment:wv,defaultnormal_vertex:Ev,displacementmap_pars_vertex:Tv,displacementmap_vertex:Av,emissivemap_fragment:zv,emissivemap_pars_fragment:Rv,colorspace_fragment:Cv,colorspace_pars_fragment:Pv,envmap_fragment:Lv,envmap_common_pars_fragment:Iv,envmap_pars_fragment:Dv,envmap_pars_vertex:Nv,envmap_physical_pars_fragment:$v,envmap_vertex:Uv,fog_vertex:Ov,fog_pars_vertex:Fv,fog_fragment:Bv,fog_pars_fragment:Gv,gradientmap_pars_fragment:Hv,lightmap_pars_fragment:Vv,lights_lambert_fragment:Wv,lights_lambert_pars_fragment:kv,lights_pars_begin:Xv,lights_toon_fragment:qv,lights_toon_pars_fragment:Yv,lights_phong_fragment:Zv,lights_phong_pars_fragment:Kv,lights_physical_fragment:Jv,lights_physical_pars_fragment:Qv,lights_fragment_begin:jv,lights_fragment_maps:tM,lights_fragment_end:eM,lightprobes_pars_fragment:nM,logdepthbuf_fragment:iM,logdepthbuf_pars_fragment:sM,logdepthbuf_pars_vertex:aM,logdepthbuf_vertex:oM,map_fragment:rM,map_pars_fragment:cM,map_particle_fragment:lM,map_particle_pars_fragment:dM,metalnessmap_fragment:fM,metalnessmap_pars_fragment:uM,morphinstance_vertex:hM,morphcolor_vertex:pM,morphnormal_vertex:mM,morphtarget_pars_vertex:xM,morphtarget_vertex:gM,normal_fragment_begin:_M,normal_fragment_maps:vM,normal_pars_fragment:MM,normal_pars_vertex:yM,normal_vertex:bM,normalmap_pars_fragment:SM,clearcoat_normal_fragment_begin:wM,clearcoat_normal_fragment_maps:EM,clearcoat_pars_fragment:TM,iridescence_pars_fragment:AM,opaque_fragment:zM,packing:RM,premultiplied_alpha_fragment:CM,project_vertex:PM,dithering_fragment:LM,dithering_pars_fragment:IM,roughnessmap_fragment:DM,roughnessmap_pars_fragment:NM,shadowmap_pars_fragment:UM,shadowmap_pars_vertex:OM,shadowmap_vertex:FM,shadowmask_pars_fragment:BM,skinbase_vertex:GM,skinning_pars_vertex:HM,skinning_vertex:VM,skinnormal_vertex:WM,specularmap_fragment:kM,specularmap_pars_fragment:XM,tonemapping_fragment:$M,tonemapping_pars_fragment:qM,transmission_fragment:YM,transmission_pars_fragment:ZM,uv_pars_fragment:KM,uv_pars_vertex:JM,uv_vertex:QM,worldpos_vertex:jM,background_vert:ty,background_frag:ey,backgroundCube_vert:ny,backgroundCube_frag:iy,cube_vert:sy,cube_frag:ay,depth_vert:oy,depth_frag:ry,distance_vert:cy,distance_frag:ly,equirect_vert:dy,equirect_frag:fy,linedashed_vert:uy,linedashed_frag:hy,meshbasic_vert:py,meshbasic_frag:my,meshlambert_vert:xy,meshlambert_frag:gy,meshmatcap_vert:_y,meshmatcap_frag:vy,meshnormal_vert:My,meshnormal_frag:yy,meshphong_vert:by,meshphong_frag:Sy,meshphysical_vert:wy,meshphysical_frag:Ey,meshtoon_vert:Ty,meshtoon_frag:Ay,points_vert:zy,points_frag:Ry,shadow_vert:Cy,shadow_frag:Py,sprite_vert:Ly,sprite_frag:Iy},Pt={common:{diffuse:{value:new te(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new jt},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new jt}},envmap:{envMap:{value:null},envMapRotation:{value:new jt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new jt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new jt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new jt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new jt},normalScale:{value:new St(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new jt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new jt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new jt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new jt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new te(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new Z},probesMax:{value:new Z},probesResolution:{value:new Z}},points:{diffuse:{value:new te(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0},uvTransform:{value:new jt}},sprite:{diffuse:{value:new te(16777215)},opacity:{value:1},center:{value:new St(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new jt},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0}}},ni={basic:{uniforms:an([Pt.common,Pt.specularmap,Pt.envmap,Pt.aomap,Pt.lightmap,Pt.fog]),vertexShader:ie.meshbasic_vert,fragmentShader:ie.meshbasic_frag},lambert:{uniforms:an([Pt.common,Pt.specularmap,Pt.envmap,Pt.aomap,Pt.lightmap,Pt.emissivemap,Pt.bumpmap,Pt.normalmap,Pt.displacementmap,Pt.fog,Pt.lights,{emissive:{value:new te(0)},envMapIntensity:{value:1}}]),vertexShader:ie.meshlambert_vert,fragmentShader:ie.meshlambert_frag},phong:{uniforms:an([Pt.common,Pt.specularmap,Pt.envmap,Pt.aomap,Pt.lightmap,Pt.emissivemap,Pt.bumpmap,Pt.normalmap,Pt.displacementmap,Pt.fog,Pt.lights,{emissive:{value:new te(0)},specular:{value:new te(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:ie.meshphong_vert,fragmentShader:ie.meshphong_frag},standard:{uniforms:an([Pt.common,Pt.envmap,Pt.aomap,Pt.lightmap,Pt.emissivemap,Pt.bumpmap,Pt.normalmap,Pt.displacementmap,Pt.roughnessmap,Pt.metalnessmap,Pt.fog,Pt.lights,{emissive:{value:new te(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ie.meshphysical_vert,fragmentShader:ie.meshphysical_frag},toon:{uniforms:an([Pt.common,Pt.aomap,Pt.lightmap,Pt.emissivemap,Pt.bumpmap,Pt.normalmap,Pt.displacementmap,Pt.gradientmap,Pt.fog,Pt.lights,{emissive:{value:new te(0)}}]),vertexShader:ie.meshtoon_vert,fragmentShader:ie.meshtoon_frag},matcap:{uniforms:an([Pt.common,Pt.bumpmap,Pt.normalmap,Pt.displacementmap,Pt.fog,{matcap:{value:null}}]),vertexShader:ie.meshmatcap_vert,fragmentShader:ie.meshmatcap_frag},points:{uniforms:an([Pt.points,Pt.fog]),vertexShader:ie.points_vert,fragmentShader:ie.points_frag},dashed:{uniforms:an([Pt.common,Pt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ie.linedashed_vert,fragmentShader:ie.linedashed_frag},depth:{uniforms:an([Pt.common,Pt.displacementmap]),vertexShader:ie.depth_vert,fragmentShader:ie.depth_frag},normal:{uniforms:an([Pt.common,Pt.bumpmap,Pt.normalmap,Pt.displacementmap,{opacity:{value:1}}]),vertexShader:ie.meshnormal_vert,fragmentShader:ie.meshnormal_frag},sprite:{uniforms:an([Pt.sprite,Pt.fog]),vertexShader:ie.sprite_vert,fragmentShader:ie.sprite_frag},background:{uniforms:{uvTransform:{value:new jt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ie.background_vert,fragmentShader:ie.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new jt}},vertexShader:ie.backgroundCube_vert,fragmentShader:ie.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ie.cube_vert,fragmentShader:ie.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ie.equirect_vert,fragmentShader:ie.equirect_frag},distance:{uniforms:an([Pt.common,Pt.displacementmap,{referencePosition:{value:new Z},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ie.distance_vert,fragmentShader:ie.distance_frag},shadow:{uniforms:an([Pt.lights,Pt.fog,{color:{value:new te(0)},opacity:{value:1}}]),vertexShader:ie.shadow_vert,fragmentShader:ie.shadow_frag}};ni.physical={uniforms:an([ni.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new jt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new jt},clearcoatNormalScale:{value:new St(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new jt},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new jt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new jt},sheen:{value:0},sheenColor:{value:new te(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new jt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new jt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new jt},transmissionSamplerSize:{value:new St},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new jt},attenuationDistance:{value:0},attenuationColor:{value:new te(0)},specularColor:{value:new te(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new jt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new jt},anisotropyVector:{value:new St},anisotropyMap:{value:null},anisotropyMapTransform:{value:new jt}}]),vertexShader:ie.meshphysical_vert,fragmentShader:ie.meshphysical_frag};const Qr={r:0,b:0,g:0},Dy=new be,qm=new jt;qm.set(-1,0,0,0,1,0,0,0,1);function Ny(e,t,n,i,s,a){const o=new te(0);let r=s===!0?0:1,c,l,d=null,f=0,u=null;function h(v){let y=v.isScene===!0?v.background:null;if(y&&y.isTexture){const g=v.backgroundBlurriness>0;y=t.get(y,g)}return y}function p(v){let y=!1;const g=h(v);g===null?x(o,r):g&&g.isColor&&(x(g,1),y=!0);const b=e.xr.getEnvironmentBlendMode();b==="additive"?n.buffers.color.setClear(0,0,0,1,a):b==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||y)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function _(v,y){const g=h(y);g&&(g.isCubeTexture||g.mapping===_l)?(l===void 0&&(l=new Se(new $a(1,1,1),new fi({name:"BackgroundCubeMaterial",uniforms:Ba(ni.backgroundCube.uniforms),vertexShader:ni.backgroundCube.vertexShader,fragmentShader:ni.backgroundCube.fragmentShader,side:dn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(b,S,E){this.matrixWorld.copyPosition(E.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(l)),l.material.uniforms.envMap.value=g,l.material.uniforms.backgroundBlurriness.value=y.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(Dy.makeRotationFromEuler(y.backgroundRotation)).transpose(),g.isCubeTexture&&g.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(qm),l.material.toneMapped=oe.getTransfer(g.colorSpace)!==pe,(d!==g||f!==g.version||u!==e.toneMapping)&&(l.material.needsUpdate=!0,d=g,f=g.version,u=e.toneMapping),l.layers.enableAll(),v.unshift(l,l.geometry,l.material,0,0,null)):g&&g.isTexture&&(c===void 0&&(c=new Se(new bl(2,2),new fi({name:"BackgroundMaterial",uniforms:Ba(ni.background.uniforms),vertexShader:ni.background.vertexShader,fragmentShader:ni.background.fragmentShader,side:Ps,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c)),c.material.uniforms.t2D.value=g,c.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,c.material.toneMapped=oe.getTransfer(g.colorSpace)!==pe,g.matrixAutoUpdate===!0&&g.updateMatrix(),c.material.uniforms.uvTransform.value.copy(g.matrix),(d!==g||f!==g.version||u!==e.toneMapping)&&(c.material.needsUpdate=!0,d=g,f=g.version,u=e.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null))}function x(v,y){v.getRGB(Qr,Hm(e)),n.buffers.color.setClear(Qr.r,Qr.g,Qr.b,y,a)}function m(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(v,y=1){o.set(v),r=y,x(o,r)},getClearAlpha:function(){return r},setClearAlpha:function(v){r=v,x(o,r)},render:p,addToRenderList:_,dispose:m}}function Uy(e,t){const n=e.getParameter(e.MAX_VERTEX_ATTRIBS),i={},s=u(null);let a=s,o=!1;function r(R,D,O,C,F){let W=!1;const U=f(R,C,O,D);a!==U&&(a=U,l(a.object)),W=h(R,C,O,F),W&&p(R,C,O,F),F!==null&&t.update(F,e.ELEMENT_ARRAY_BUFFER),(W||o)&&(o=!1,g(R,D,O,C),F!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(F).buffer))}function c(){return e.createVertexArray()}function l(R){return e.bindVertexArray(R)}function d(R){return e.deleteVertexArray(R)}function f(R,D,O,C){const F=C.wireframe===!0;let W=i[D.id];W===void 0&&(W={},i[D.id]=W);const U=R.isInstancedMesh===!0?R.id:0;let B=W[U];B===void 0&&(B={},W[U]=B);let P=B[O.id];P===void 0&&(P={},B[O.id]=P);let H=P[F];return H===void 0&&(H=u(c()),P[F]=H),H}function u(R){const D=[],O=[],C=[];for(let F=0;F<n;F++)D[F]=0,O[F]=0,C[F]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:D,enabledAttributes:O,attributeDivisors:C,object:R,attributes:{},index:null}}function h(R,D,O,C){const F=a.attributes,W=D.attributes;let U=0;const B=O.getAttributes();for(const P in B)if(B[P].location>=0){const k=F[P];let L=W[P];if(L===void 0&&(P==="instanceMatrix"&&R.instanceMatrix&&(L=R.instanceMatrix),P==="instanceColor"&&R.instanceColor&&(L=R.instanceColor)),k===void 0||k.attribute!==L||L&&k.data!==L.data)return!0;U++}return a.attributesNum!==U||a.index!==C}function p(R,D,O,C){const F={},W=D.attributes;let U=0;const B=O.getAttributes();for(const P in B)if(B[P].location>=0){let k=W[P];k===void 0&&(P==="instanceMatrix"&&R.instanceMatrix&&(k=R.instanceMatrix),P==="instanceColor"&&R.instanceColor&&(k=R.instanceColor));const L={};L.attribute=k,k&&k.data&&(L.data=k.data),F[P]=L,U++}a.attributes=F,a.attributesNum=U,a.index=C}function _(){const R=a.newAttributes;for(let D=0,O=R.length;D<O;D++)R[D]=0}function x(R){m(R,0)}function m(R,D){const O=a.newAttributes,C=a.enabledAttributes,F=a.attributeDivisors;O[R]=1,C[R]===0&&(e.enableVertexAttribArray(R),C[R]=1),F[R]!==D&&(e.vertexAttribDivisor(R,D),F[R]=D)}function v(){const R=a.newAttributes,D=a.enabledAttributes;for(let O=0,C=D.length;O<C;O++)D[O]!==R[O]&&(e.disableVertexAttribArray(O),D[O]=0)}function y(R,D,O,C,F,W,U){U===!0?e.vertexAttribIPointer(R,D,O,F,W):e.vertexAttribPointer(R,D,O,C,F,W)}function g(R,D,O,C){_();const F=C.attributes,W=O.getAttributes(),U=D.defaultAttributeValues;for(const B in W){const P=W[B];if(P.location>=0){let H=F[B];if(H===void 0&&(B==="instanceMatrix"&&R.instanceMatrix&&(H=R.instanceMatrix),B==="instanceColor"&&R.instanceColor&&(H=R.instanceColor)),H!==void 0){const k=H.normalized,L=H.itemSize,V=t.get(H);if(V===void 0)continue;const at=V.buffer,j=V.type,pt=V.bytesPerElement,J=j===e.INT||j===e.UNSIGNED_INT||H.gpuType===_u;if(H.isInterleavedBufferAttribute){const Q=H.data,dt=Q.stride,Ot=H.offset;if(Q.isInstancedInterleavedBuffer){for(let mt=0;mt<P.locationSize;mt++)m(P.location+mt,Q.meshPerAttribute);R.isInstancedMesh!==!0&&C._maxInstanceCount===void 0&&(C._maxInstanceCount=Q.meshPerAttribute*Q.count)}else for(let mt=0;mt<P.locationSize;mt++)x(P.location+mt);e.bindBuffer(e.ARRAY_BUFFER,at);for(let mt=0;mt<P.locationSize;mt++)y(P.location+mt,L/P.locationSize,j,k,dt*pt,(Ot+L/P.locationSize*mt)*pt,J)}else{if(H.isInstancedBufferAttribute){for(let Q=0;Q<P.locationSize;Q++)m(P.location+Q,H.meshPerAttribute);R.isInstancedMesh!==!0&&C._maxInstanceCount===void 0&&(C._maxInstanceCount=H.meshPerAttribute*H.count)}else for(let Q=0;Q<P.locationSize;Q++)x(P.location+Q);e.bindBuffer(e.ARRAY_BUFFER,at);for(let Q=0;Q<P.locationSize;Q++)y(P.location+Q,L/P.locationSize,j,k,L*pt,L/P.locationSize*Q*pt,J)}}else if(U!==void 0){const k=U[B];if(k!==void 0)switch(k.length){case 2:e.vertexAttrib2fv(P.location,k);break;case 3:e.vertexAttrib3fv(P.location,k);break;case 4:e.vertexAttrib4fv(P.location,k);break;default:e.vertexAttrib1fv(P.location,k)}}}}v()}function b(){T();for(const R in i){const D=i[R];for(const O in D){const C=D[O];for(const F in C){const W=C[F];for(const U in W)d(W[U].object),delete W[U];delete C[F]}}delete i[R]}}function S(R){if(i[R.id]===void 0)return;const D=i[R.id];for(const O in D){const C=D[O];for(const F in C){const W=C[F];for(const U in W)d(W[U].object),delete W[U];delete C[F]}}delete i[R.id]}function E(R){for(const D in i){const O=i[D];for(const C in O){const F=O[C];if(F[R.id]===void 0)continue;const W=F[R.id];for(const U in W)d(W[U].object),delete W[U];delete F[R.id]}}}function M(R){for(const D in i){const O=i[D],C=R.isInstancedMesh===!0?R.id:0,F=O[C];if(F!==void 0){for(const W in F){const U=F[W];for(const B in U)d(U[B].object),delete U[B];delete F[W]}delete O[C],Object.keys(O).length===0&&delete i[D]}}}function T(){z(),o=!0,a!==s&&(a=s,l(a.object))}function z(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:r,reset:T,resetDefaultState:z,dispose:b,releaseStatesOfGeometry:S,releaseStatesOfObject:M,releaseStatesOfProgram:E,initAttributes:_,enableAttribute:x,disableUnusedAttributes:v}}function Oy(e,t,n){let i;function s(c){i=c}function a(c,l){e.drawArrays(i,c,l),n.update(l,i,1)}function o(c,l,d){d!==0&&(e.drawArraysInstanced(i,c,l,d),n.update(l,i,d))}function r(c,l,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,l,0,d);let u=0;for(let h=0;h<d;h++)u+=l[h];n.update(u,i,1)}this.setMode=s,this.render=a,this.renderInstances=o,this.renderMultiDraw=r}function Fy(e,t,n,i){let s;function a(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){const E=t.get("EXT_texture_filter_anisotropic");s=e.getParameter(E.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(E){return!(E!==$n&&i.convert(E)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT))}function r(E){const M=E===di&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(E!==yn&&E!==si&&!M&&i.convert(E)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(E){if(E==="highp"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return"highp";E="mediump"}return E==="mediump"&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=n.precision!==void 0?n.precision:"highp";const d=c(l);d!==l&&(Kt("WebGLRenderer:",l,"not supported, using",d,"instead."),l=d);const f=n.logarithmicDepthBuffer===!0,u=n.reversedDepthBuffer===!0&&t.has("EXT_clip_control");n.reversedDepthBuffer===!0&&u===!1&&Kt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const h=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),p=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=e.getParameter(e.MAX_TEXTURE_SIZE),x=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),m=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),g=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),b=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:r,precision:l,logarithmicDepthBuffer:f,reversedDepthBuffer:u,maxTextures:h,maxVertexTextures:p,maxTextureSize:_,maxCubemapSize:x,maxAttributes:m,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:g,maxSamples:b,samples:S}}function By(e){const t=this;let n=null,i=0,s=!1,a=!1;const o=new Ki,r=new jt,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(f,u){const h=f.length!==0||u||i!==0||s;return s=u,i=f.length,h},this.beginShadows=function(){a=!0,d(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(f,u){n=d(f,u,0)},this.setState=function(f,u,h){const p=f.clippingPlanes,_=f.clipIntersection,x=f.clipShadows,m=e.get(f);if(!s||p===null||p.length===0||a&&!x)a?d(null):l();else{const v=a?0:i,y=v*4;let g=m.clippingState||null;c.value=g,g=d(p,u,y,h);for(let b=0;b!==y;++b)g[b]=n[b];m.clippingState=g,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=v}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function d(f,u,h,p){const _=f!==null?f.length:0;let x=null;if(_!==0){if(x=c.value,p!==!0||x===null){const m=h+_*4,v=u.matrixWorldInverse;r.getNormalMatrix(v),(x===null||x.length<m)&&(x=new Float32Array(m));for(let y=0,g=h;y!==_;++y,g+=4)o.copy(f[y]).applyMatrix4(v,r),o.normal.toArray(x,g),x[g+3]=o.constant}c.value=x,c.needsUpdate=!0}return t.numPlanes=_,t.numIntersection=0,x}}const va=4,Gy=6,Hy=20,Vy=256,ro=new Sl,ah=new te;let xd=null,gd=0,_d=0,vd=!1;const Wy=new Z,us=new Z;class oh{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,n=0,i=.1,s=100,a={}){const{size:o=256,position:r=Wy}=a;xd=this._renderer.getRenderTarget(),gd=this._renderer.getActiveCubeFace(),_d=this._renderer.getActiveMipmapLevel(),vd=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);const c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(t,i,s,c,r),n>0&&this._blur(c,0,0,n),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(t,n=null){return this._fromTexture(t,n)}fromCubemap(t,n=null){return this._fromTexture(t,n)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=lh(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ch(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(xd,gd,_d),this._renderer.xr.enabled=vd,t.scissorTest=!1,ha(t,0,0,t.width,t.height)}_fromTexture(t,n){t.mapping===Ls||t.mapping===Oa?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),xd=this._renderer.getRenderTarget(),gd=this._renderer.getActiveCubeFace(),_d=this._renderer.getActiveMipmapLevel(),vd=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=n||this._allocateTargets();return this._textureToCubeUV(t,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),n=4*this._cubeSize,i={magFilter:Ve,minFilter:Ve,generateMipmaps:!1,type:di,format:$n,colorSpace:Vc,depthBuffer:!1},s=rh(t,n,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==n){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=rh(t,n,i);const{_lodMax:a}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=ky(a)),this._blurMaterial=$y(a,t,n),this._ggxMaterial=Xy(a,t,n)}return s}_compileMaterial(t){const n=new Se(new Pe,t);this._renderer.compile(n,ro)}_sceneToCubeUV(t,n,i,s,a){const c=new Pn(90,1,n,i),l=[1,-1,1,1,1,1],d=[1,1,1,-1,-1,-1],f=this._renderer,u=f.autoClear,h=f.toneMapping;f.getClearColor(ah),f.toneMapping=ri,f.autoClear=!1,f.state.buffers.depth.getReversed()&&(f.setRenderTarget(s),f.clearDepth(),f.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Se(new $a,new vl({name:"PMREM.Background",side:dn,depthWrite:!1,depthTest:!1})));const _=this._backgroundBox,x=_.material;let m=!1;const v=t.background;v?v.isColor&&(x.color.copy(v),t.background=null,m=!0):(x.color.copy(ah),m=!0);for(let y=0;y<6;y++){const g=y%3;g===0?(c.up.set(0,l[y],0),c.position.set(a.x,a.y,a.z),c.lookAt(a.x+d[y],a.y,a.z)):g===1?(c.up.set(0,0,l[y]),c.position.set(a.x,a.y,a.z),c.lookAt(a.x,a.y+d[y],a.z)):(c.up.set(0,l[y],0),c.position.set(a.x,a.y,a.z),c.lookAt(a.x,a.y,a.z+d[y]));const b=this._cubeSize;ha(s,g*b,y>2?b:0,b,b),f.setRenderTarget(s),m&&f.render(_,c),f.render(t,c)}f.toneMapping=h,f.autoClear=u,t.background=v}_textureToCubeUV(t,n){const i=this._renderer,s=t.mapping===Ls||t.mapping===Oa;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=lh()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ch());const a=s?this._cubemapMaterial:this._equirectMaterial,o=this._lodMeshes[0];o.material=a;const r=a.uniforms;r.envMap.value=t;const c=this._cubeSize;ha(n,0,0,3*c,2*c),i.setRenderTarget(n),i.render(o,ro)}_applyPMREM(t){const n=this._renderer,i=n.autoClear;n.autoClear=!1;const s=this._lodMeshes.length;for(let a=1;a<s;a++)this._applyGGXFilter(t,a-1,a);n.autoClear=i}_applyGGXFilter(t,n,i){const s=this._renderer,a=this._pingPongRenderTarget,o=this._ggxMaterial,r=this._lodMeshes[i];r.material=o;const c=o.uniforms,l=i/(this._lodMeshes.length-1),d=n/(this._lodMeshes.length-1),f=Math.sqrt(l*l-d*d),u=l*1.25,h=f*u,{_lodMax:p}=this,_=this._sizeLods[i],x=3*_*(i>p-va?i-p+va:0),m=4*(this._cubeSize-_);c.envMap.value=t.texture,c.roughness.value=h,c.mipInt.value=p-n,ha(a,x,m,3*_,2*_),s.setRenderTarget(a),s.render(r,ro),c.envMap.value=a.texture,c.roughness.value=0,c.mipInt.value=p-i,ha(t,x,m,3*_,2*_),s.setRenderTarget(t),s.render(r,ro)}_blur(t,n,i,s){const a=this._pingPongRenderTarget,o=Math.min(s,Math.PI)/Math.SQRT2;this._blurPass(t,a,n,i,o),this._blurPass(a,t,i,i,o)}_blurPass(t,n,i,s,a){const o=this._renderer,r=this._blurMaterial,c=this._lodMeshes[s];c.material=r;const l=r.uniforms;l.envMap.value=t.texture,l.sigma.value=a,l.mipInt.value=this._lodMax-i;const d=this._sizeLods[s],f=3*d*(s>this._lodMax-va?s-this._lodMax+va:0),u=4*(this._cubeSize-d);ha(n,f,u,3*d,2*d),o.setRenderTarget(n),o.render(c,ro)}}function ky(e){const t=[],n=[];let i=e;const s=e-va+1+Gy;for(let a=0;a<s;a++){const o=Math.pow(2,i);t.push(o);const r=1/(o-2),c=-r,l=1+r,d=[c,c,l,c,l,l,c,c,l,l,c,l],f=6,u=6,h=3,p=new Float32Array(h*u*f),_=new Float32Array(h*u*f);for(let m=0;m<f;m++){const v=m%3*2/3-1,y=m>2?0:-1,g=[v,y,0,v+2/3,y,0,v+2/3,y+1,0,v,y,0,v+2/3,y+1,0,v,y+1,0];p.set(g,h*u*m);for(let b=0;b<u;b++){const S=d[b*2]*2-1,E=d[b*2+1]*2-1;m===0?us.set(1,E,S):m===1?us.set(-S,1,-E):m===2?us.set(-S,E,1):m===3?us.set(-1,E,-S):m===4?us.set(-S,-1,E):us.set(S,E,-1),us.toArray(_,(m*u+b)*h)}}const x=new Pe;x.setAttribute("position",new fn(p,h)),x.setAttribute("outputDirection",new fn(_,h)),n.push(new Se(x,null)),i>va&&i--}return{lodMeshes:n,sizeLods:t}}function rh(e,t,n){const i=new qn(e,t,n);return i.texture.mapping=_l,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function ha(e,t,n,i,s){e.viewport.set(t,n,i,s),e.scissor.set(t,n,i,s)}function Xy(e,t,n){return new fi({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:Vy,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:wl(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:Li,depthTest:!1,depthWrite:!1})}function $y(e,t,n){return new fi({name:"SphericalGaussianBlur",defines:{SAMPLES:Hy,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:wl(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:Li,depthTest:!1,depthWrite:!1})}function ch(){return new fi({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:wl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Li,depthTest:!1,depthWrite:!1})}function lh(){return new fi({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:wl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Li,depthTest:!1,depthWrite:!1})}function wl(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class Ym extends qn{constructor(t=1,n={}){super(t,t,n),this.isWebGLCubeRenderTarget=!0;const i={width:t,height:t,depth:1},s=[i,i,i,i,i,i];this.texture=new zm(s),this._setTextureOptions(n),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,n){this.texture.type=n.type,this.texture.colorSpace=n.colorSpace,this.texture.generateMipmaps=n.generateMipmaps,this.texture.minFilter=n.minFilter,this.texture.magFilter=n.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new $a(5,5,5),a=new fi({name:"CubemapFromEquirect",uniforms:Ba(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:dn,blending:Li});a.uniforms.tEquirect.value=n;const o=new Se(s,a),r=n.minFilter;return n.minFilter===vs&&(n.minFilter=Ve),new K_(1,10,this).update(t,o),n.minFilter=r,o.geometry.dispose(),o.material.dispose(),this}clear(t,n=!0,i=!0,s=!0){const a=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(n,i,s);t.setRenderTarget(a)}}function qy(e){let t=new WeakMap,n=new WeakMap,i=null;function s(u,h=!1){return u==null?null:h?o(u):a(u)}function a(u){if(u&&u.isTexture){const h=u.mapping;if(h===Gl||h===Hl)if(t.has(u)){const p=t.get(u).texture;return r(p,u.mapping)}else{const p=u.image;if(p&&p.height>0){const _=new Ym(p.height);return _.fromEquirectangularTexture(e,u),t.set(u,_),u.addEventListener("dispose",l),r(_.texture,u.mapping)}else return null}}return u}function o(u){if(u&&u.isTexture){const h=u.mapping,p=h===Gl||h===Hl,_=h===Ls||h===Oa;if(p||_){let x=n.get(u);const m=x!==void 0?x.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==m)return i===null&&(i=new oh(e)),x=p?i.fromEquirectangular(u,x):i.fromCubemap(u,x),x.texture.pmremVersion=u.pmremVersion,n.set(u,x),x.texture;if(x!==void 0)return x.texture;{const v=u.image;return p&&v&&v.height>0||_&&v&&c(v)?(i===null&&(i=new oh(e)),x=p?i.fromEquirectangular(u):i.fromCubemap(u),x.texture.pmremVersion=u.pmremVersion,n.set(u,x),u.addEventListener("dispose",d),x.texture):null}}}return u}function r(u,h){return h===Gl?u.mapping=Ls:h===Hl&&(u.mapping=Oa),u}function c(u){let h=0;const p=6;for(let _=0;_<p;_++)u[_]!==void 0&&h++;return h===p}function l(u){const h=u.target;h.removeEventListener("dispose",l);const p=t.get(h);p!==void 0&&(t.delete(h),p.dispose())}function d(u){const h=u.target;h.removeEventListener("dispose",d);const p=n.get(h);p!==void 0&&(n.delete(h),p.dispose())}function f(){t=new WeakMap,n=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:s,dispose:f}}function Yy(e){const t={};function n(i){if(t[i]!==void 0)return t[i];const s=e.getExtension(i);return t[i]=s,s}return{has:function(i){return n(i)!==null},init:function(){n("EXT_color_buffer_float"),n("WEBGL_clip_cull_distance"),n("OES_texture_float_linear"),n("EXT_color_buffer_half_float"),n("WEBGL_multisampled_render_to_texture"),n("WEBGL_render_shared_exponent")},get:function(i){const s=n(i);return s===null&&Ra("WebGLRenderer: "+i+" extension not supported."),s}}}function Zy(e,t,n,i){const s={},a=new WeakMap;function o(f){const u=f.target;u.index!==null&&t.remove(u.index);for(const p in u.attributes)t.remove(u.attributes[p]);u.removeEventListener("dispose",o),delete s[u.id];const h=a.get(u);h&&(t.remove(h),a.delete(u)),i.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,n.memory.geometries--}function r(f,u){return s[u.id]===!0||(u.addEventListener("dispose",o),s[u.id]=!0,n.memory.geometries++),u}function c(f){const u=f.attributes;for(const h in u)t.update(u[h],e.ARRAY_BUFFER)}function l(f){const u=[],h=f.index,p=f.attributes.position;let _=0;if(p===void 0)return;if(h!==null){const v=h.array;_=h.version;for(let y=0,g=v.length;y<g;y+=3){const b=v[y+0],S=v[y+1],E=v[y+2];u.push(b,S,S,E,E,b)}}else{const v=p.array;_=p.version;for(let y=0,g=v.length/3-1;y<g;y+=3){const b=y+0,S=y+1,E=y+2;u.push(b,S,S,E,E,b)}}const x=new(p.count>=65535?Am:Tm)(u,1);x.version=_;const m=a.get(f);m&&t.remove(m),a.set(f,x)}function d(f){const u=a.get(f);if(u){const h=f.index;h!==null&&u.version<h.version&&l(f)}else l(f);return a.get(f)}return{get:r,update:c,getWireframeAttribute:d}}function Ky(e,t,n){let i;function s(f){i=f}let a,o;function r(f){a=f.type,o=f.bytesPerElement}function c(f,u){e.drawElements(i,u,a,f*o),n.update(u,i,1)}function l(f,u,h){h!==0&&(e.drawElementsInstanced(i,u,a,f*o,h),n.update(u,i,h))}function d(f,u,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,u,0,a,f,0,h);let _=0;for(let x=0;x<h;x++)_+=u[x];n.update(_,i,1)}this.setMode=s,this.setIndex=r,this.render=c,this.renderInstances=l,this.renderMultiDraw=d}function Jy(e){const t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function i(a,o,r){switch(n.calls++,o){case e.TRIANGLES:n.triangles+=r*(a/3);break;case e.LINES:n.lines+=r*(a/2);break;case e.LINE_STRIP:n.lines+=r*(a-1);break;case e.LINE_LOOP:n.lines+=r*a;break;case e.POINTS:n.points+=r*a;break;default:ce("WebGLInfo: Unknown draw mode:",o);break}}function s(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:s,update:i}}function Qy(e,t,n){const i=new WeakMap,s=new Ee;function a(o,r,c){const l=o.morphTargetInfluences,d=r.morphAttributes.position||r.morphAttributes.normal||r.morphAttributes.color,f=d!==void 0?d.length:0;let u=i.get(r);if(u===void 0||u.count!==f){let T=function(){E.dispose(),i.delete(r),r.removeEventListener("dispose",T)};u!==void 0&&u.texture.dispose();const h=r.morphAttributes.position!==void 0,p=r.morphAttributes.normal!==void 0,_=r.morphAttributes.color!==void 0,x=r.morphAttributes.position||[],m=r.morphAttributes.normal||[],v=r.morphAttributes.color||[];let y=0;h===!0&&(y=1),p===!0&&(y=2),_===!0&&(y=3);let g=r.attributes.position.count*y,b=1;g>t.maxTextureSize&&(b=Math.ceil(g/t.maxTextureSize),g=t.maxTextureSize);const S=new Float32Array(g*b*4*f),E=new Sm(S,g,b,f);E.type=si,E.needsUpdate=!0;const M=y*4;for(let z=0;z<f;z++){const R=x[z],D=m[z],O=v[z],C=g*b*4*z;for(let F=0;F<R.count;F++){const W=F*M;h===!0&&(s.fromBufferAttribute(R,F),S[C+W+0]=s.x,S[C+W+1]=s.y,S[C+W+2]=s.z,S[C+W+3]=0),p===!0&&(s.fromBufferAttribute(D,F),S[C+W+4]=s.x,S[C+W+5]=s.y,S[C+W+6]=s.z,S[C+W+7]=0),_===!0&&(s.fromBufferAttribute(O,F),S[C+W+8]=s.x,S[C+W+9]=s.y,S[C+W+10]=s.z,S[C+W+11]=O.itemSize===4?s.w:1)}}u={count:f,texture:E,size:new St(g,b)},i.set(r,u),r.addEventListener("dispose",T)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(e,"morphTexture",o.morphTexture,n);else{let h=0;for(let _=0;_<l.length;_++)h+=l[_];const p=r.morphTargetsRelative?1:1-h;c.getUniforms().setValue(e,"morphTargetBaseInfluence",p),c.getUniforms().setValue(e,"morphTargetInfluences",l)}c.getUniforms().setValue(e,"morphTargetsTexture",u.texture,n),c.getUniforms().setValue(e,"morphTargetsTextureSize",u.size)}return{update:a}}function jy(e,t,n,i,s){let a=new WeakMap;function o(l){const d=s.render.frame,f=l.geometry,u=t.get(l,f);if(a.get(u)!==d&&(t.update(u),a.set(u,d)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),a.get(l)!==d&&(n.update(l.instanceMatrix,e.ARRAY_BUFFER),l.instanceColor!==null&&n.update(l.instanceColor,e.ARRAY_BUFFER),a.set(l,d))),l.isSkinnedMesh){const h=l.skeleton;a.get(h)!==d&&(h.update(),a.set(h,d))}return u}function r(){a=new WeakMap}function c(l){const d=l.target;d.removeEventListener("dispose",c),i.releaseStatesOfObject(d),n.remove(d.instanceMatrix),d.instanceColor!==null&&n.remove(d.instanceColor)}return{update:o,dispose:r}}const t2={[rm]:"LINEAR_TONE_MAPPING",[cm]:"REINHARD_TONE_MAPPING",[lm]:"CINEON_TONE_MAPPING",[dm]:"ACES_FILMIC_TONE_MAPPING",[um]:"AGX_TONE_MAPPING",[hm]:"NEUTRAL_TONE_MAPPING",[fm]:"CUSTOM_TONE_MAPPING"};function e2(e,t,n,i,s,a){const o=new qn(t,n,{type:e,depthBuffer:s,stencilBuffer:a,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let r=null,c=null;const l=new Pe;l.setAttribute("position",new le([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new le([0,2,0,0,2,0],2));const d=new W_({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),f=new Se(l,d),u=new Sl(-1,1,1,-1,0,1);let h=null,p=null,_=!1,x,m=null,v=[],y=!1;this.setSize=function(g,b){o.setSize(g,b),r!==null&&r.setSize(g,b),c!==null&&c.setSize(g,b);for(let S=0;S<v.length;S++){const E=v[S];E.setSize&&E.setSize(g,b)}},this.setEffects=function(g){v=g,y=v.length>0&&v[0].isRenderPass===!0;const b=o.width,S=o.height;v.length>0&&r===null&&(r=new qn(b,S,{type:di,depthBuffer:!1,stencilBuffer:!1}),c=new qn(b,S,{type:di,depthBuffer:!1,stencilBuffer:!1}));for(let E=0;E<v.length;E++){const M=v[E];M.setSize&&M.setSize(b,S)}},this.begin=function(g,b){if(_||g.toneMapping===ri&&v.length===0)return!1;if(m=b,b!==null){const S=b.width,E=b.height;(o.width!==S||o.height!==E)&&this.setSize(S,E)}return y===!1&&g.setRenderTarget(o),x=g.toneMapping,g.toneMapping=ri,!0},this.hasRenderPass=function(){return y},this.end=function(g,b){g.toneMapping=x,_=!0;let S=o,E=r;for(let M=0;M<v.length;M++){const T=v[M];T.enabled!==!1&&(T.render(g,E,S,b),T.needsSwap!==!1&&(S=E,E=E===r?c:r))}if(h!==g.outputColorSpace||p!==g.toneMapping){h=g.outputColorSpace,p=g.toneMapping,d.defines={},oe.getTransfer(h)===pe&&(d.defines.SRGB_TRANSFER="");const M=t2[p];M&&(d.defines[M]=""),d.needsUpdate=!0}d.uniforms.tDiffuse.value=S.texture,g.setRenderTarget(m),g.render(f,u),m=null,_=!1},this.isCompositing=function(){return _},this.dispose=function(){o.dispose(),r!==null&&r.dispose(),c!==null&&c.dispose(),l.dispose(),d.dispose()}}const Zm=new Qe,Uf=new Jo(1,1),Km=new Sm,Jm=new H1,Qm=new zm,dh=[],fh=[],uh=new Float32Array(16),hh=new Float32Array(9),ph=new Float32Array(4);function qa(e,t,n){const i=e[0];if(i<=0||i>0)return e;const s=t*n;let a=dh[s];if(a===void 0&&(a=new Float32Array(s),dh[s]=a),t!==0){i.toArray(a,0);for(let o=1,r=0;o!==t;++o)r+=n,e[o].toArray(a,r)}return a}function Ue(e,t){if(e.length!==t.length)return!1;for(let n=0,i=e.length;n<i;n++)if(e[n]!==t[n])return!1;return!0}function Oe(e,t){for(let n=0,i=t.length;n<i;n++)e[n]=t[n]}function El(e,t){let n=fh[t];n===void 0&&(n=new Int32Array(t),fh[t]=n);for(let i=0;i!==t;++i)n[i]=e.allocateTextureUnit();return n}function n2(e,t){const n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function i2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Ue(n,t))return;e.uniform2fv(this.addr,t),Oe(n,t)}}function s2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(Ue(n,t))return;e.uniform3fv(this.addr,t),Oe(n,t)}}function a2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Ue(n,t))return;e.uniform4fv(this.addr,t),Oe(n,t)}}function o2(e,t){const n=this.cache,i=t.elements;if(i===void 0){if(Ue(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),Oe(n,t)}else{if(Ue(n,i))return;ph.set(i),e.uniformMatrix2fv(this.addr,!1,ph),Oe(n,i)}}function r2(e,t){const n=this.cache,i=t.elements;if(i===void 0){if(Ue(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),Oe(n,t)}else{if(Ue(n,i))return;hh.set(i),e.uniformMatrix3fv(this.addr,!1,hh),Oe(n,i)}}function c2(e,t){const n=this.cache,i=t.elements;if(i===void 0){if(Ue(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),Oe(n,t)}else{if(Ue(n,i))return;uh.set(i),e.uniformMatrix4fv(this.addr,!1,uh),Oe(n,i)}}function l2(e,t){const n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function d2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Ue(n,t))return;e.uniform2iv(this.addr,t),Oe(n,t)}}function f2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Ue(n,t))return;e.uniform3iv(this.addr,t),Oe(n,t)}}function u2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Ue(n,t))return;e.uniform4iv(this.addr,t),Oe(n,t)}}function h2(e,t){const n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function p2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Ue(n,t))return;e.uniform2uiv(this.addr,t),Oe(n,t)}}function m2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Ue(n,t))return;e.uniform3uiv(this.addr,t),Oe(n,t)}}function x2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Ue(n,t))return;e.uniform4uiv(this.addr,t),Oe(n,t)}}function g2(e,t,n){const i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s);let a;this.type===e.SAMPLER_2D_SHADOW?(Uf.compareFunction=n.isReversedDepthBuffer()?Eu:wu,a=Uf):a=Zm,n.setTexture2D(t||a,s)}function _2(e,t,n){const i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s),n.setTexture3D(t||Jm,s)}function v2(e,t,n){const i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s),n.setTextureCube(t||Qm,s)}function M2(e,t,n){const i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s),n.setTexture2DArray(t||Km,s)}function y2(e){switch(e){case 5126:return n2;case 35664:return i2;case 35665:return s2;case 35666:return a2;case 35674:return o2;case 35675:return r2;case 35676:return c2;case 5124:case 35670:return l2;case 35667:case 35671:return d2;case 35668:case 35672:return f2;case 35669:case 35673:return u2;case 5125:return h2;case 36294:return p2;case 36295:return m2;case 36296:return x2;case 35678:case 36198:case 36298:case 36306:case 35682:return g2;case 35679:case 36299:case 36307:return _2;case 35680:case 36300:case 36308:case 36293:return v2;case 36289:case 36303:case 36311:case 36292:return M2}}function b2(e,t){e.uniform1fv(this.addr,t)}function S2(e,t){const n=qa(t,this.size,2);e.uniform2fv(this.addr,n)}function w2(e,t){const n=qa(t,this.size,3);e.uniform3fv(this.addr,n)}function E2(e,t){const n=qa(t,this.size,4);e.uniform4fv(this.addr,n)}function T2(e,t){const n=qa(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function A2(e,t){const n=qa(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function z2(e,t){const n=qa(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function R2(e,t){e.uniform1iv(this.addr,t)}function C2(e,t){e.uniform2iv(this.addr,t)}function P2(e,t){e.uniform3iv(this.addr,t)}function L2(e,t){e.uniform4iv(this.addr,t)}function I2(e,t){e.uniform1uiv(this.addr,t)}function D2(e,t){e.uniform2uiv(this.addr,t)}function N2(e,t){e.uniform3uiv(this.addr,t)}function U2(e,t){e.uniform4uiv(this.addr,t)}function O2(e,t,n){const i=this.cache,s=t.length,a=El(n,s);Ue(i,a)||(e.uniform1iv(this.addr,a),Oe(i,a));let o;this.type===e.SAMPLER_2D_SHADOW?o=Uf:o=Zm;for(let r=0;r!==s;++r)n.setTexture2D(t[r]||o,a[r])}function F2(e,t,n){const i=this.cache,s=t.length,a=El(n,s);Ue(i,a)||(e.uniform1iv(this.addr,a),Oe(i,a));for(let o=0;o!==s;++o)n.setTexture3D(t[o]||Jm,a[o])}function B2(e,t,n){const i=this.cache,s=t.length,a=El(n,s);Ue(i,a)||(e.uniform1iv(this.addr,a),Oe(i,a));for(let o=0;o!==s;++o)n.setTextureCube(t[o]||Qm,a[o])}function G2(e,t,n){const i=this.cache,s=t.length,a=El(n,s);Ue(i,a)||(e.uniform1iv(this.addr,a),Oe(i,a));for(let o=0;o!==s;++o)n.setTexture2DArray(t[o]||Km,a[o])}function H2(e){switch(e){case 5126:return b2;case 35664:return S2;case 35665:return w2;case 35666:return E2;case 35674:return T2;case 35675:return A2;case 35676:return z2;case 5124:case 35670:return R2;case 35667:case 35671:return C2;case 35668:case 35672:return P2;case 35669:case 35673:return L2;case 5125:return I2;case 36294:return D2;case 36295:return N2;case 36296:return U2;case 35678:case 36198:case 36298:case 36306:case 35682:return O2;case 35679:case 36299:case 36307:return F2;case 35680:case 36300:case 36308:case 36293:return B2;case 36289:case 36303:case 36311:case 36292:return G2}}class V2{constructor(t,n,i){this.id=t,this.addr=i,this.cache=[],this.type=n.type,this.setValue=y2(n.type)}}class W2{constructor(t,n,i){this.id=t,this.addr=i,this.cache=[],this.type=n.type,this.size=n.size,this.setValue=H2(n.type)}}class k2{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,n,i){const s=this.seq;for(let a=0,o=s.length;a!==o;++a){const r=s[a];r.setValue(t,n[r.id],i)}}}const Md=/(\w+)(\])?(\[|\.)?/g;function mh(e,t){e.seq.push(t),e.map[t.id]=t}function X2(e,t,n){const i=e.name,s=i.length;for(Md.lastIndex=0;;){const a=Md.exec(i),o=Md.lastIndex;let r=a[1];const c=a[2]==="]",l=a[3];if(c&&(r=r|0),l===void 0||l==="["&&o+2===s){mh(n,l===void 0?new V2(r,e,t):new W2(r,e,t));break}else{let f=n.map[r];f===void 0&&(f=new k2(r),mh(n,f)),n=f}}}class Rc{constructor(t,n){this.seq=[],this.map={};const i=t.getProgramParameter(n,t.ACTIVE_UNIFORMS);for(let o=0;o<i;++o){const r=t.getActiveUniform(n,o),c=t.getUniformLocation(n,r.name);X2(r,c,this)}const s=[],a=[];for(const o of this.seq)o.type===t.SAMPLER_2D_SHADOW||o.type===t.SAMPLER_CUBE_SHADOW||o.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(o):a.push(o);s.length>0&&(this.seq=s.concat(a))}setValue(t,n,i,s){const a=this.map[n];a!==void 0&&a.setValue(t,i,s)}setOptional(t,n,i){const s=n[i];s!==void 0&&this.setValue(t,i,s)}static upload(t,n,i,s){for(let a=0,o=n.length;a!==o;++a){const r=n[a],c=i[r.id];c.needsUpdate!==!1&&r.setValue(t,c.value,s)}}static seqWithValue(t,n){const i=[];for(let s=0,a=t.length;s!==a;++s){const o=t[s];o.id in n&&i.push(o)}return i}}function xh(e,t,n){const i=e.createShader(t);return e.shaderSource(i,n),e.compileShader(i),i}const $2=37297;let q2=0;function Y2(e,t){const n=e.split(`
`),i=[],s=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let o=s;o<a;o++){const r=o+1;i.push(`${r===t?">":" "} ${r}: ${n[o]}`)}return i.join(`
`)}const gh=new jt;function Z2(e){oe._getMatrix(gh,oe.workingColorSpace,e);const t=`mat3( ${gh.elements.map(n=>n.toFixed(4))} )`;switch(oe.getTransfer(e)){case Wc:return[t,"LinearTransferOETF"];case pe:return[t,"sRGBTransferOETF"];default:return Kt("WebGLProgram: Unsupported color space: ",e),[t,"LinearTransferOETF"]}}function _h(e,t,n){const i=e.getShaderParameter(t,e.COMPILE_STATUS),a=(e.getShaderInfoLog(t)||"").trim();if(i&&a==="")return"";const o=/ERROR: 0:(\d+)/.exec(a);if(o){const r=parseInt(o[1]);return n.toUpperCase()+`

`+a+`

`+Y2(e.getShaderSource(t),r)}else return a}function K2(e,t){const n=Z2(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,"}"].join(`
`)}const J2={[rm]:"Linear",[cm]:"Reinhard",[lm]:"Cineon",[dm]:"ACESFilmic",[um]:"AgX",[hm]:"Neutral",[fm]:"Custom"};function Q2(e,t){const n=J2[t];return n===void 0?(Kt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+e+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+e+"( vec3 color ) { return "+n+"ToneMapping( color ); }"}const jr=new Z;function j2(){oe.getLuminanceCoefficients(jr);const e=jr.x.toFixed(4),t=jr.y.toFixed(4),n=jr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${e}, ${t}, ${n} );`,"	return dot( weights, rgb );","}"].join(`
`)}function tb(e){return[e.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",e.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Mo).join(`
`)}function eb(e){const t=[];for(const n in e){const i=e[n];i!==!1&&t.push("#define "+n+" "+i)}return t.join(`
`)}function nb(e,t){const n={},i=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){const a=e.getActiveAttrib(t,s),o=a.name;let r=1;a.type===e.FLOAT_MAT2&&(r=2),a.type===e.FLOAT_MAT3&&(r=3),a.type===e.FLOAT_MAT4&&(r=4),n[o]={type:a.type,location:e.getAttribLocation(t,o),locationSize:r}}return n}function Mo(e){return e!==""}function vh(e,t){const n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Mh(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const ib=/^[ \t]*#include +<([\w\d./]+)>/gm;function Of(e){return e.replace(ib,ab)}const sb=new Map;function ab(e,t){let n=ie[t];if(n===void 0){const i=sb.get(t);if(i!==void 0)n=ie[i],Kt('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return Of(n)}const ob=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function yh(e){return e.replace(ob,rb)}function rb(e,t,n,i){let s="";for(let a=parseInt(t);a<parseInt(n);a++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+a+" ]").replace(/UNROLLED_LOOP_INDEX/g,a);return s}function bh(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision==="highp"?t+=`
#define HIGH_PRECISION`:e.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:e.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}const cb={[Ro]:"SHADOWMAP_TYPE_PCF",[_o]:"SHADOWMAP_TYPE_VSM"};function lb(e){return cb[e.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const db={[Ls]:"ENVMAP_TYPE_CUBE",[Oa]:"ENVMAP_TYPE_CUBE",[_l]:"ENVMAP_TYPE_CUBE_UV"};function fb(e){return e.envMap===!1?"ENVMAP_TYPE_CUBE":db[e.envMapMode]||"ENVMAP_TYPE_CUBE"}const ub={[Oa]:"ENVMAP_MODE_REFRACTION"};function hb(e){return e.envMap===!1?"ENVMAP_MODE_REFLECTION":ub[e.envMapMode]||"ENVMAP_MODE_REFLECTION"}const pb={[gu]:"ENVMAP_BLENDING_MULTIPLY",[_1]:"ENVMAP_BLENDING_MIX",[v1]:"ENVMAP_BLENDING_ADD"};function mb(e){return e.envMap===!1?"ENVMAP_BLENDING_NONE":pb[e.combine]||"ENVMAP_BLENDING_NONE"}function xb(e){const t=e.envMapCubeUVHeight;if(t===null)return null;const n=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,n),112)),texelHeight:i,maxMip:n}}function gb(e,t,n,i){const s=e.getContext(),a=n.defines;let o=n.vertexShader,r=n.fragmentShader;const c=lb(n),l=fb(n),d=hb(n),f=mb(n),u=xb(n),h=tb(n),p=eb(a),_=s.createProgram();let x,m,v=n.glslVersion?"#version "+n.glslVersion+`
`:"";n.isRawShaderMaterial?(x=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,p].filter(Mo).join(`
`),x.length>0&&(x+=`
`),m=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,p].filter(Mo).join(`
`),m.length>0&&(m+=`
`)):(x=[bh(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,p,n.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",n.batching?"#define USE_BATCHING":"",n.batchingColor?"#define USE_BATCHING_COLOR":"",n.instancing?"#define USE_INSTANCING":"",n.instancingColor?"#define USE_INSTANCING_COLOR":"",n.instancingMorph?"#define USE_INSTANCING_MORPH":"",n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.map?"#define USE_MAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+d:"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.displacementMap?"#define USE_DISPLACEMENTMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.mapUv?"#define MAP_UV "+n.mapUv:"",n.alphaMapUv?"#define ALPHAMAP_UV "+n.alphaMapUv:"",n.lightMapUv?"#define LIGHTMAP_UV "+n.lightMapUv:"",n.aoMapUv?"#define AOMAP_UV "+n.aoMapUv:"",n.emissiveMapUv?"#define EMISSIVEMAP_UV "+n.emissiveMapUv:"",n.bumpMapUv?"#define BUMPMAP_UV "+n.bumpMapUv:"",n.normalMapUv?"#define NORMALMAP_UV "+n.normalMapUv:"",n.displacementMapUv?"#define DISPLACEMENTMAP_UV "+n.displacementMapUv:"",n.metalnessMapUv?"#define METALNESSMAP_UV "+n.metalnessMapUv:"",n.roughnessMapUv?"#define ROUGHNESSMAP_UV "+n.roughnessMapUv:"",n.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+n.anisotropyMapUv:"",n.clearcoatMapUv?"#define CLEARCOATMAP_UV "+n.clearcoatMapUv:"",n.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+n.clearcoatNormalMapUv:"",n.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+n.clearcoatRoughnessMapUv:"",n.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+n.iridescenceMapUv:"",n.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+n.iridescenceThicknessMapUv:"",n.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+n.sheenColorMapUv:"",n.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+n.sheenRoughnessMapUv:"",n.specularMapUv?"#define SPECULARMAP_UV "+n.specularMapUv:"",n.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+n.specularColorMapUv:"",n.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+n.specularIntensityMapUv:"",n.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+n.transmissionMapUv:"",n.thicknessMapUv?"#define THICKNESSMAP_UV "+n.thicknessMapUv:"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexNormals?"#define HAS_NORMAL":"",n.vertexColors?"#define USE_COLOR":"",n.vertexAlphas?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.flatShading?"#define FLAT_SHADED":"",n.skinning?"#define USE_SKINNING":"",n.morphTargets?"#define USE_MORPHTARGETS":"",n.morphNormals&&n.flatShading===!1?"#define USE_MORPHNORMALS":"",n.morphColors?"#define USE_MORPHCOLORS":"",n.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+n.morphTextureStride:"",n.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+n.morphTargetsCount:"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+c:"",n.sizeAttenuation?"#define USE_SIZEATTENUATION":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Mo).join(`
`),m=[bh(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,p,n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",n.map?"#define USE_MAP":"",n.matcap?"#define USE_MATCAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+l:"",n.envMap?"#define "+d:"",n.envMap?"#define "+f:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoat?"#define USE_CLEARCOAT":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.dispersion?"#define USE_DISPERSION":"",n.retroreflection?"#define USE_RETROREFLECTION":"",n.iridescence?"#define USE_IRIDESCENCE":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaTest?"#define USE_ALPHATEST":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.sheen?"#define USE_SHEEN":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexColors||n.instancingColor?"#define USE_COLOR":"",n.vertexAlphas||n.batchingColor?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.gradientMap?"#define USE_GRADIENTMAP":"",n.flatShading?"#define FLAT_SHADED":"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+c:"",n.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",n.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",n.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",n.toneMapping!==ri?"#define TONE_MAPPING":"",n.toneMapping!==ri?ie.tonemapping_pars_fragment:"",n.toneMapping!==ri?Q2("toneMapping",n.toneMapping):"",n.dithering?"#define DITHERING":"",n.opaque?"#define OPAQUE":"",ie.colorspace_pars_fragment,K2("linearToOutputTexel",n.outputColorSpace),j2(),n.useDepthPacking?"#define DEPTH_PACKING "+n.depthPacking:"",`
`].filter(Mo).join(`
`)),o=Of(o),o=vh(o,n),o=Mh(o,n),r=Of(r),r=vh(r,n),r=Mh(r,n),o=yh(o),r=yh(r),n.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,x=[h,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+x,m=["#define varying in",n.glslVersion===C0?"":"layout(location = 0) out highp vec4 pc_fragColor;",n.glslVersion===C0?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);const y=v+x+o,g=v+m+r,b=xh(s,s.VERTEX_SHADER,y),S=xh(s,s.FRAGMENT_SHADER,g);s.attachShader(_,b),s.attachShader(_,S),n.index0AttributeName!==void 0?s.bindAttribLocation(_,0,n.index0AttributeName):n.hasPositionAttribute===!0&&s.bindAttribLocation(_,0,"position"),s.linkProgram(_);function E(R){if(e.debug.checkShaderErrors){const D=s.getProgramInfoLog(_)||"",O=s.getShaderInfoLog(b)||"",C=s.getShaderInfoLog(S)||"",F=D.trim(),W=O.trim(),U=C.trim();let B=!0,P=!0;if(s.getProgramParameter(_,s.LINK_STATUS)===!1)if(B=!1,typeof e.debug.onShaderError=="function")e.debug.onShaderError(s,_,b,S);else{const H=_h(s,b,"vertex"),k=_h(s,S,"fragment");ce("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(_,s.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+F+`
`+H+`
`+k)}else F!==""?Kt("WebGLProgram: Program Info Log:",F):(W===""||U==="")&&(P=!1);P&&(R.diagnostics={runnable:B,programLog:F,vertexShader:{log:W,prefix:x},fragmentShader:{log:U,prefix:m}})}s.deleteShader(b),s.deleteShader(S),M=new Rc(s,_),T=nb(s,_)}let M;this.getUniforms=function(){return M===void 0&&E(this),M};let T;this.getAttributes=function(){return T===void 0&&E(this),T};let z=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return z===!1&&(z=s.getProgramParameter(_,$2)),z},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(_),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=q2++,this.cacheKey=t,this.usedTimes=1,this.program=_,this.vertexShader=b,this.fragmentShader=S,this}let _b=0;class vb{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,n,i){const s=this._getShaderCacheForMaterial(t);return s.has(n)===!1&&(s.add(n),n.usedTimes++),s.has(i)===!1&&(s.add(i),i.usedTimes++),this}remove(t){const n=this.materialCache.get(t);for(const i of n)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const n=this.materialCache;let i=n.get(t);return i===void 0&&(i=new Set,n.set(t,i)),i}_getShaderStage(t){const n=this.shaderCache;let i=n.get(t);return i===void 0&&(i=new Mb(t),n.set(t,i)),i}}class Mb{constructor(t){this.id=_b++,this.code=t,this.usedTimes=0}}function yb(e){return e===Is||e===Bc||e===Gc}function bb(e,t,n,i,s,a){const o=new wm,r=new vb,c=new Set,l=[],d=new Map,f=i.logarithmicDepthBuffer;let u=i.precision;const h={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function p(M){return c.add(M),M===0?"uv":`uv${M}`}function _(M,T,z,R,D,O){const C=R.fog,F=D.geometry,W=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?R.environment:null,U=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap,B=t.get(M.envMap||W,U),P=B&&B.mapping===_l?B.image.height:null,H=h[M.type];M.precision!==null&&(u=i.getMaxPrecision(M.precision),u!==M.precision&&Kt("WebGLProgram.getParameters:",M.precision,"not supported, using",u,"instead."));const k=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,L=k!==void 0?k.length:0;let V=0;F.morphAttributes.position!==void 0&&(V=1),F.morphAttributes.normal!==void 0&&(V=2),F.morphAttributes.color!==void 0&&(V=3);let at,j,pt,J;if(H){const ve=ni[H];at=ve.vertexShader,j=ve.fragmentShader}else{at=M.vertexShader,j=M.fragmentShader;const ve=r.getVertexShaderStage(M),de=r.getFragmentShaderStage(M);r.update(M,ve,de),pt=ve.id,J=de.id}const Q=e.getRenderTarget(),dt=e.state.buffers.depth.getReversed(),Ot=D.isInstancedMesh===!0,mt=D.isBatchedMesh===!0,Gt=!!M.map,Qt=!!M.matcap,ct=!!B,xt=!!M.aoMap,q=!!M.lightMap,et=!!M.bumpMap&&M.wireframe===!1,X=!!M.normalMap,lt=!!M.displacementMap,gt=!!M.emissiveMap,ft=!!M.metalnessMap,wt=!!M.roughnessMap,G=M.anisotropy>0,Rt=M.clearcoat>0,Dt=M.dispersion>0,I=M.retroreflectivity>0,w=M.iridescence>0,$=M.sheen>0,tt=M.transmission>0,ot=G&&!!M.anisotropyMap,Mt=Rt&&!!M.clearcoatMap,yt=Rt&&!!M.clearcoatNormalMap,rt=Rt&&!!M.clearcoatRoughnessMap,ut=w&&!!M.iridescenceMap,Et=w&&!!M.iridescenceThicknessMap,$t=$&&!!M.sheenColorMap,Ct=$&&!!M.sheenRoughnessMap,Tt=!!M.specularMap,qt=!!M.specularColorMap,Zt=!!M.specularIntensityMap,ee=tt&&!!M.transmissionMap,K=tt&&!!M.thicknessMap,At=!!M.gradientMap,ht=!!M.alphaMap,zt=M.alphaTest>0,Nt=!!M.alphaHash,vt=!!M.extensions;let Yt=ri;M.toneMapped&&(Q===null||Q.isXRRenderTarget===!0)&&(Yt=e.toneMapping);const kt={shaderID:H,shaderType:M.type,shaderName:M.name,vertexShader:at,fragmentShader:j,defines:M.defines,customVertexShaderID:pt,customFragmentShaderID:J,isRawShaderMaterial:M.isRawShaderMaterial===!0,glslVersion:M.glslVersion,precision:u,batching:mt,batchingColor:mt&&D._colorsTexture!==null,instancing:Ot,instancingColor:Ot&&D.instanceColor!==null,instancingMorph:Ot&&D.morphTexture!==null,outputColorSpace:Q===null?e.outputColorSpace:Q.isXRRenderTarget===!0?Q.texture.colorSpace:oe.workingColorSpace,alphaToCoverage:!!M.alphaToCoverage,map:Gt,matcap:Qt,envMap:ct,envMapMode:ct&&B.mapping,envMapCubeUVHeight:P,aoMap:xt,lightMap:q,bumpMap:et,normalMap:X,displacementMap:lt,emissiveMap:gt,normalMapObjectSpace:X&&M.normalMapType===b1,normalMapTangentSpace:X&&M.normalMapType===Hc,packedNormalMap:X&&M.normalMapType===Hc&&yb(M.normalMap.format),metalnessMap:ft,roughnessMap:wt,anisotropy:G,anisotropyMap:ot,clearcoat:Rt,clearcoatMap:Mt,clearcoatNormalMap:yt,clearcoatRoughnessMap:rt,dispersion:Dt,retroreflection:I,iridescence:w,iridescenceMap:ut,iridescenceThicknessMap:Et,sheen:$,sheenColorMap:$t,sheenRoughnessMap:Ct,specularMap:Tt,specularColorMap:qt,specularIntensityMap:Zt,transmission:tt,transmissionMap:ee,thicknessMap:K,gradientMap:At,opaque:M.transparent===!1&&M.blending===Co&&M.alphaToCoverage===!1,alphaMap:ht,alphaTest:zt,alphaHash:Nt,combine:M.combine,mapUv:Gt&&p(M.map.channel),aoMapUv:xt&&p(M.aoMap.channel),lightMapUv:q&&p(M.lightMap.channel),bumpMapUv:et&&p(M.bumpMap.channel),normalMapUv:X&&p(M.normalMap.channel),displacementMapUv:lt&&p(M.displacementMap.channel),emissiveMapUv:gt&&p(M.emissiveMap.channel),metalnessMapUv:ft&&p(M.metalnessMap.channel),roughnessMapUv:wt&&p(M.roughnessMap.channel),anisotropyMapUv:ot&&p(M.anisotropyMap.channel),clearcoatMapUv:Mt&&p(M.clearcoatMap.channel),clearcoatNormalMapUv:yt&&p(M.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:rt&&p(M.clearcoatRoughnessMap.channel),iridescenceMapUv:ut&&p(M.iridescenceMap.channel),iridescenceThicknessMapUv:Et&&p(M.iridescenceThicknessMap.channel),sheenColorMapUv:$t&&p(M.sheenColorMap.channel),sheenRoughnessMapUv:Ct&&p(M.sheenRoughnessMap.channel),specularMapUv:Tt&&p(M.specularMap.channel),specularColorMapUv:qt&&p(M.specularColorMap.channel),specularIntensityMapUv:Zt&&p(M.specularIntensityMap.channel),transmissionMapUv:ee&&p(M.transmissionMap.channel),thicknessMapUv:K&&p(M.thicknessMap.channel),alphaMapUv:ht&&p(M.alphaMap.channel),vertexTangents:!!F.attributes.tangent&&(X||G),vertexNormals:!!F.attributes.normal,vertexColors:M.vertexColors,vertexAlphas:M.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,pointsUvs:D.isPoints===!0&&!!F.attributes.uv&&(Gt||ht),fog:!!C,useFog:M.fog===!0,fogExp2:!!C&&C.isFogExp2,flatShading:M.wireframe===!1&&(M.flatShading===!0||F.attributes.normal===void 0&&X===!1&&(M.isMeshLambertMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isMeshPhysicalMaterial)),sizeAttenuation:M.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:dt,skinning:D.isSkinnedMesh===!0,hasPositionAttribute:F.attributes.position!==void 0,morphTargets:F.morphAttributes.position!==void 0,morphNormals:F.morphAttributes.normal!==void 0,morphColors:F.morphAttributes.color!==void 0,morphTargetsCount:L,morphTextureStride:V,numSunLights:T.sun.length,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numSunLightShadows:T.sunShadowMap.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numLightProbeGrids:O.length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:M.dithering,shadowMapEnabled:e.shadowMap.enabled&&z.length>0,shadowMapType:e.shadowMap.type,toneMapping:Yt,decodeVideoTexture:Gt&&M.map.isVideoTexture===!0&&oe.getTransfer(M.map.colorSpace)===pe,decodeVideoTextureEmissive:gt&&M.emissiveMap.isVideoTexture===!0&&oe.getTransfer(M.emissiveMap.colorSpace)===pe,premultipliedAlpha:M.premultipliedAlpha,doubleSided:M.side===wi,flipSided:M.side===dn,useDepthPacking:M.depthPacking>=0,depthPacking:M.depthPacking||0,index0AttributeName:M.index0AttributeName,extensionClipCullDistance:vt&&M.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(vt&&M.extensions.multiDraw===!0||mt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:M.customProgramCacheKey()};return kt.vertexUv1s=c.has(1),kt.vertexUv2s=c.has(2),kt.vertexUv3s=c.has(3),c.clear(),kt}function x(M){const T=[];if(M.shaderID?T.push(M.shaderID):(T.push(M.customVertexShaderID),T.push(M.customFragmentShaderID)),M.defines!==void 0)for(const z in M.defines)T.push(z),T.push(M.defines[z]);return M.isRawShaderMaterial===!1&&(m(T,M),v(T,M),T.push(e.outputColorSpace)),T.push(M.customProgramCacheKey),T.join()}function m(M,T){M.push(T.precision),M.push(T.outputColorSpace),M.push(T.envMapMode),M.push(T.envMapCubeUVHeight),M.push(T.mapUv),M.push(T.alphaMapUv),M.push(T.lightMapUv),M.push(T.aoMapUv),M.push(T.bumpMapUv),M.push(T.normalMapUv),M.push(T.displacementMapUv),M.push(T.emissiveMapUv),M.push(T.metalnessMapUv),M.push(T.roughnessMapUv),M.push(T.anisotropyMapUv),M.push(T.clearcoatMapUv),M.push(T.clearcoatNormalMapUv),M.push(T.clearcoatRoughnessMapUv),M.push(T.iridescenceMapUv),M.push(T.iridescenceThicknessMapUv),M.push(T.sheenColorMapUv),M.push(T.sheenRoughnessMapUv),M.push(T.specularMapUv),M.push(T.specularColorMapUv),M.push(T.specularIntensityMapUv),M.push(T.transmissionMapUv),M.push(T.thicknessMapUv),M.push(T.combine),M.push(T.fogExp2),M.push(T.sizeAttenuation),M.push(T.morphTargetsCount),M.push(T.morphAttributeCount),M.push(T.numSunLights),M.push(T.numDirLights),M.push(T.numPointLights),M.push(T.numSpotLights),M.push(T.numSpotLightMaps),M.push(T.numHemiLights),M.push(T.numRectAreaLights),M.push(T.numSunLightShadows),M.push(T.numDirLightShadows),M.push(T.numPointLightShadows),M.push(T.numSpotLightShadows),M.push(T.numSpotLightShadowsWithMaps),M.push(T.numLightProbes),M.push(T.shadowMapType),M.push(T.toneMapping),M.push(T.numClippingPlanes),M.push(T.numClipIntersection),M.push(T.depthPacking)}function v(M,T){o.disableAll(),T.instancing&&o.enable(0),T.instancingColor&&o.enable(1),T.instancingMorph&&o.enable(2),T.matcap&&o.enable(3),T.envMap&&o.enable(4),T.normalMapObjectSpace&&o.enable(5),T.normalMapTangentSpace&&o.enable(6),T.clearcoat&&o.enable(7),T.iridescence&&o.enable(8),T.alphaTest&&o.enable(9),T.vertexColors&&o.enable(10),T.vertexAlphas&&o.enable(11),T.vertexUv1s&&o.enable(12),T.vertexUv2s&&o.enable(13),T.vertexUv3s&&o.enable(14),T.vertexTangents&&o.enable(15),T.anisotropy&&o.enable(16),T.alphaHash&&o.enable(17),T.batching&&o.enable(18),T.dispersion&&o.enable(19),T.retroreflection&&o.enable(24),T.batchingColor&&o.enable(20),T.gradientMap&&o.enable(21),T.packedNormalMap&&o.enable(22),T.vertexNormals&&o.enable(23),M.push(o.mask),o.disableAll(),T.fog&&o.enable(0),T.useFog&&o.enable(1),T.flatShading&&o.enable(2),T.logarithmicDepthBuffer&&o.enable(3),T.reversedDepthBuffer&&o.enable(4),T.skinning&&o.enable(5),T.morphTargets&&o.enable(6),T.morphNormals&&o.enable(7),T.morphColors&&o.enable(8),T.premultipliedAlpha&&o.enable(9),T.shadowMapEnabled&&o.enable(10),T.doubleSided&&o.enable(11),T.flipSided&&o.enable(12),T.useDepthPacking&&o.enable(13),T.dithering&&o.enable(14),T.transmission&&o.enable(15),T.sheen&&o.enable(16),T.opaque&&o.enable(17),T.pointsUvs&&o.enable(18),T.decodeVideoTexture&&o.enable(19),T.decodeVideoTextureEmissive&&o.enable(20),T.alphaToCoverage&&o.enable(21),T.numLightProbeGrids>0&&o.enable(22),T.hasPositionAttribute&&o.enable(23),M.push(o.mask)}function y(M){const T=h[M.type];let z;if(T){const R=ni[T];z=G_.clone(R.uniforms)}else z=M.uniforms;return z}function g(M,T){let z=d.get(T);return z!==void 0?++z.usedTimes:(z=new gb(e,T,M,s),l.push(z),d.set(T,z)),z}function b(M){if(--M.usedTimes===0){const T=l.indexOf(M);l[T]=l[l.length-1],l.pop(),d.delete(M.cacheKey),M.destroy()}}function S(M){r.remove(M)}function E(){r.dispose()}return{getParameters:_,getProgramCacheKey:x,getUniforms:y,acquireProgram:g,releaseProgram:b,releaseShaderCache:S,programs:l,dispose:E}}function Sb(){let e=new WeakMap;function t(o){return e.has(o)}function n(o){let r=e.get(o);return r===void 0&&(r={},e.set(o,r)),r}function i(o){e.delete(o)}function s(o,r,c){e.get(o)[r]=c}function a(){e=new WeakMap}return{has:t,get:n,remove:i,update:s,dispose:a}}function wb(e,t){return e.groupOrder!==t.groupOrder?e.groupOrder-t.groupOrder:e.renderOrder!==t.renderOrder?e.renderOrder-t.renderOrder:e.material.id!==t.material.id?e.material.id-t.material.id:e.materialVariant!==t.materialVariant?e.materialVariant-t.materialVariant:e.z!==t.z?e.z-t.z:e.id-t.id}function Sh(e,t){return e.groupOrder!==t.groupOrder?e.groupOrder-t.groupOrder:e.renderOrder!==t.renderOrder?e.renderOrder-t.renderOrder:e.z!==t.z?t.z-e.z:e.id-t.id}function wh(){const e=[];let t=0;const n=[],i=[],s=[];function a(){t=0,n.length=0,i.length=0,s.length=0}function o(u){let h=0;return u.isInstancedMesh&&(h+=2),u.isSkinnedMesh&&(h+=1),h}function r(u,h,p,_,x,m){let v=e[t];return v===void 0?(v={id:u.id,object:u,geometry:h,material:p,materialVariant:o(u),groupOrder:_,renderOrder:u.renderOrder,z:x,group:m},e[t]=v):(v.id=u.id,v.object=u,v.geometry=h,v.material=p,v.materialVariant=o(u),v.groupOrder=_,v.renderOrder=u.renderOrder,v.z=x,v.group=m),t++,v}function c(u,h,p,_,x,m,v){v.reversedDepth===!0&&(x=-x);const y=r(u,h,p,_,x,m);p.transmission>0?i.push(y):p.transparent===!0?s.push(y):n.push(y)}function l(u,h,p,_,x,m){const v=r(u,h,p,_,x,m);p.transmission>0?i.unshift(v):p.transparent===!0?s.unshift(v):n.unshift(v)}function d(u,h){n.length>1&&n.sort(u||wb),i.length>1&&i.sort(h||Sh),s.length>1&&s.sort(h||Sh)}function f(){for(let u=t,h=e.length;u<h;u++){const p=e[u];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:n,transmissive:i,transparent:s,init:a,push:c,unshift:l,finish:f,sort:d}}function Eb(){let e=new WeakMap;function t(i,s){const a=e.get(i);let o;return a===void 0?(o=new wh,e.set(i,[o])):s>=a.length?(o=new wh,a.push(o)):o=a[s],o}function n(){e=new WeakMap}return{get:t,dispose:n}}function Tb(){const e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"SunLight":case"DirectionalLight":n={direction:new Z,color:new te};break;case"SpotLight":n={position:new Z,direction:new Z,color:new te,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":n={position:new Z,color:new te,distance:0,decay:0};break;case"HemisphereLight":n={direction:new Z,skyColor:new te,groundColor:new te};break;case"RectAreaLight":n={color:new te,position:new Z,halfWidth:new Z,halfHeight:new Z};break}return e[t.id]=n,n}}}function Ab(){const e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"SunLight":case"DirectionalLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new St};break;case"SpotLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new St};break;case"PointLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new St,shadowCameraNear:1,shadowCameraFar:1e3};break}return e[t.id]=n,n}}}let zb=0;function Rb(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+(t.map?1:0)-(e.map?1:0)}function Cb(e){const t=new Tb,n=Ab(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)i.probe.push(new Z);const s=new Z,a=new be,o=new be;function r(l){let d=0,f=0,u=0;for(let D=0;D<9;D++)i.probe[D].set(0,0,0);let h=0,p=0,_=0,x=0,m=0,v=0,y=0,g=0,b=0,S=0,E=0,M=0,T=0,z=0;l.sort(Rb);for(let D=0,O=l.length;D<O;D++){const C=l[D],F=C.color,W=C.intensity,U=C.distance;let B=null;if(C.shadow&&C.shadow.map&&(C.shadow.map.texture.format===Is?B=C.shadow.map.texture:B=C.shadow.map.depthTexture||C.shadow.map.texture),C.isAmbientLight)d+=F.r*W,f+=F.g*W,u+=F.b*W;else if(C.isLightProbe){for(let P=0;P<9;P++)i.probe[P].addScaledVector(C.sh.coefficients[P],W);z++}else if(C.isSunLight){const P=t.get(C);if(P.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){const H=C.shadow,k=n.get(C);k.shadowIntensity=H.intensity,k.shadowBias=H.bias,k.shadowNormalBias=H.normalBias,k.shadowRadius=H.radius,k.shadowMapSize.copy(H.mapSize).multiply(H.getFrameExtents()),i.sunShadow[p]=k,i.sunShadowMap[p]=B;const L=H.getViewportCount();for(let V=0;V<L;V++)i.sunShadowMatrix[_+V]=H.getMatrix(V),i.sunShadowCascade[_+V]=H._cascadeData[V];_+=L,p++}i.sun[h]=P,h++}else if(C.isDirectionalLight){const P=t.get(C);if(P.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){const H=C.shadow,k=n.get(C);k.shadowIntensity=H.intensity,k.shadowBias=H.bias,k.shadowNormalBias=H.normalBias,k.shadowRadius=H.radius,k.shadowMapSize=H.mapSize,i.directionalShadow[x]=k,i.directionalShadowMap[x]=B,i.directionalShadowMatrix[x]=C.shadow.matrix,b++}i.directional[x]=P,x++}else if(C.isSpotLight){const P=t.get(C);P.position.setFromMatrixPosition(C.matrixWorld),P.color.copy(F).multiplyScalar(W),P.distance=U,P.coneCos=Math.cos(C.angle),P.penumbraCos=Math.cos(C.angle*(1-C.penumbra)),P.decay=C.decay,i.spot[v]=P;const H=C.shadow;if(C.map&&(i.spotLightMap[M]=C.map,M++,H.updateMatrices(C),C.castShadow&&T++),i.spotLightMatrix[v]=H.matrix,C.castShadow){const k=n.get(C);k.shadowIntensity=H.intensity,k.shadowBias=H.bias,k.shadowNormalBias=H.normalBias,k.shadowRadius=H.radius,k.shadowMapSize=H.mapSize,i.spotShadow[v]=k,i.spotShadowMap[v]=B,E++}v++}else if(C.isRectAreaLight){const P=t.get(C);P.color.copy(F).multiplyScalar(W),P.halfWidth.set(C.width*.5,0,0),P.halfHeight.set(0,C.height*.5,0),i.rectArea[y]=P,y++}else if(C.isPointLight){const P=t.get(C);if(P.color.copy(C.color).multiplyScalar(C.intensity),P.distance=C.distance,P.decay=C.decay,C.castShadow){const H=C.shadow,k=n.get(C);k.shadowIntensity=H.intensity,k.shadowBias=H.bias,k.shadowNormalBias=H.normalBias,k.shadowRadius=H.radius,k.shadowMapSize=H.mapSize,k.shadowCameraNear=H.camera.near,k.shadowCameraFar=H.camera.far,i.pointShadow[m]=k,i.pointShadowMap[m]=B,i.pointShadowMatrix[m]=C.shadow.matrix,S++}i.point[m]=P,m++}else if(C.isHemisphereLight){const P=t.get(C);P.skyColor.copy(C.color).multiplyScalar(W),P.groundColor.copy(C.groundColor).multiplyScalar(W),i.hemi[g]=P,g++}}y>0&&(e.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=Pt.LTC_FLOAT_1,i.rectAreaLTC2=Pt.LTC_FLOAT_2):(i.rectAreaLTC1=Pt.LTC_HALF_1,i.rectAreaLTC2=Pt.LTC_HALF_2)),i.ambient[0]=d,i.ambient[1]=f,i.ambient[2]=u;const R=i.hash;(R.sunLength!==h||R.directionalLength!==x||R.pointLength!==m||R.spotLength!==v||R.rectAreaLength!==y||R.hemiLength!==g||R.numSunShadows!==p||R.numDirectionalShadows!==b||R.numPointShadows!==S||R.numSpotShadows!==E||R.numSpotMaps!==M||R.numLightProbes!==z)&&(i.sun.length=h,i.directional.length=x,i.spot.length=v,i.rectArea.length=y,i.point.length=m,i.hemi.length=g,i.sunShadow.length=p,i.sunShadowMap.length=p,i.sunShadowMatrix.length=_,i.sunShadowCascade.length=_,i.directionalShadow.length=b,i.directionalShadowMap.length=b,i.directionalShadowMatrix.length=b,i.pointShadow.length=S,i.pointShadowMap.length=S,i.pointShadowMatrix.length=S,i.spotShadow.length=E,i.spotShadowMap.length=E,i.spotLightMatrix.length=E+M-T,i.spotLightMap.length=M,i.numSpotLightShadowsWithMaps=T,i.numLightProbes=z,R.sunLength=h,R.directionalLength=x,R.pointLength=m,R.spotLength=v,R.rectAreaLength=y,R.hemiLength=g,R.numSunShadows=p,R.numDirectionalShadows=b,R.numPointShadows=S,R.numSpotShadows=E,R.numSpotMaps=M,R.numLightProbes=z,i.version=zb++)}function c(l,d){let f=0,u=0,h=0,p=0,_=0,x=0;const m=d.matrixWorldInverse;for(let v=0,y=l.length;v<y;v++){const g=l[v];if(g.isSunLight){const b=i.sun[f];b.direction.setFromMatrixPosition(g.matrixWorld),b.direction.transformDirection(m),f++}else if(g.isDirectionalLight){const b=i.directional[u];b.direction.setFromMatrixPosition(g.matrixWorld),s.setFromMatrixPosition(g.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(m),u++}else if(g.isSpotLight){const b=i.spot[p];b.position.setFromMatrixPosition(g.matrixWorld),b.position.applyMatrix4(m),b.direction.setFromMatrixPosition(g.matrixWorld),s.setFromMatrixPosition(g.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(m),p++}else if(g.isRectAreaLight){const b=i.rectArea[_];b.position.setFromMatrixPosition(g.matrixWorld),b.position.applyMatrix4(m),o.identity(),a.copy(g.matrixWorld),a.premultiply(m),o.extractRotation(a),b.halfWidth.set(g.width*.5,0,0),b.halfHeight.set(0,g.height*.5,0),b.halfWidth.applyMatrix4(o),b.halfHeight.applyMatrix4(o),_++}else if(g.isPointLight){const b=i.point[h];b.position.setFromMatrixPosition(g.matrixWorld),b.position.applyMatrix4(m),h++}else if(g.isHemisphereLight){const b=i.hemi[x];b.direction.setFromMatrixPosition(g.matrixWorld),b.direction.transformDirection(m),x++}}}return{setup:r,setupView:c,state:i}}function Eh(e){const t=new Cb(e),n=[],i=[],s=[];function a(u){f.camera=u,n.length=0,i.length=0,s.length=0}function o(u){n.push(u)}function r(u){i.push(u)}function c(u){s.push(u)}function l(){t.setup(n)}function d(u){t.setupView(n,u)}const f={lightsArray:n,shadowsArray:i,lightProbeGridArray:s,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:f,setupLights:l,setupLightsView:d,pushLight:o,pushShadow:r,pushLightProbeGrid:c}}function Pb(e){let t=new WeakMap;function n(s,a=0){const o=t.get(s);let r;return o===void 0?(r=new Eh(e),t.set(s,[r])):a>=o.length?(r=new Eh(e),o.push(r)):r=o[a],r}function i(){t=new WeakMap}return{get:n,dispose:i}}const Lb=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Ib=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Db=[new Z(1,0,0),new Z(-1,0,0),new Z(0,1,0),new Z(0,-1,0),new Z(0,0,1),new Z(0,0,-1)],Nb=[new Z(0,-1,0),new Z(0,-1,0),new Z(0,0,1),new Z(0,0,-1),new Z(0,-1,0),new Z(0,-1,0)],Th=new be,co=new Z,yd=new Z;function Ub(e,t,n){let i=new zu;const s=new St,a=new St,o=new Ee,r=new k_,c=new X_,l={},d=n.maxTextureSize,f={[Ps]:dn,[dn]:Ps,[wi]:wi},u=new fi({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new St},radius:{value:4}},vertexShader:Lb,fragmentShader:Ib}),h=u.clone();h.defines.HORIZONTAL_PASS=1;const p=new Pe;p.setAttribute("position",new fn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new Se(p,u),x=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ro;let m=this.type;this.render=function(S,E,M){if(x.enabled===!1||x.autoUpdate===!1&&x.needsUpdate===!1||S.length===0)return;this.type===jg&&(Kt("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Ro);const T=e.getRenderTarget(),z=e.getActiveCubeFace(),R=e.getActiveMipmapLevel(),D=e.state;D.setBlending(Li),D.buffers.depth.getReversed()===!0?D.buffers.color.setClear(0,0,0,0):D.buffers.color.setClear(1,1,1,1),D.buffers.depth.setTest(!0),D.setScissorTest(!1);const O=m!==this.type;O&&E.traverse(function(C){C.material&&(Array.isArray(C.material)?C.material.forEach(F=>F.needsUpdate=!0):C.material.needsUpdate=!0)});for(let C=0,F=S.length;C<F;C++){const W=S[C],U=W.shadow;if(U===void 0){Kt("WebGLShadowMap:",W,"has no shadow.");continue}if(U.autoUpdate===!1&&U.needsUpdate===!1)continue;s.copy(U.mapSize);const B=U.getFrameExtents();s.multiply(B),a.copy(U.mapSize),(s.x>d||s.y>d)&&(s.x>d&&(a.x=Math.floor(d/B.x),s.x=a.x*B.x,U.mapSize.x=a.x),s.y>d&&(a.y=Math.floor(d/B.y),s.y=a.y*B.y,U.mapSize.y=a.y));const P=e.state.buffers.depth.getReversed();if(U.camera._reversedDepth=P,U.map===null||O===!0){if(U.map!==null&&(U.map.depthTexture!==null&&(U.map.depthTexture.dispose(),U.map.depthTexture=null),U.map.dispose()),this.type===_o){if(W.isPointLight){Kt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}U.map=new qn(s.x,s.y,{format:Is,type:di,minFilter:Ve,magFilter:Ve,generateMipmaps:!1}),U.map.texture.name=W.name+".shadowMap",U.map.depthTexture=new Jo(s.x,s.y,si),U.map.depthTexture.name=W.name+".shadowMapDepth",U.map.depthTexture.format=Ni,U.map.depthTexture.compareFunction=null,U.map.depthTexture.minFilter=He,U.map.depthTexture.magFilter=He}else W.isPointLight?(U.map=new Ym(s.x),U.map.depthTexture=new o_(s.x,li)):(U.map=new qn(s.x,s.y),U.map.depthTexture=new Jo(s.x,s.y,li)),U.map.depthTexture.name=W.name+".shadowMap",U.map.depthTexture.format=Ni,this.type===Ro?(U.map.depthTexture.compareFunction=P?Eu:wu,U.map.depthTexture.minFilter=Ve,U.map.depthTexture.magFilter=Ve):(U.map.depthTexture.compareFunction=null,U.map.depthTexture.minFilter=He,U.map.depthTexture.magFilter=He);U.camera.updateProjectionMatrix()}U.map.isWebGLCubeRenderTarget!==!0&&(U.map.width!==s.x||U.map.height!==s.y)&&U.map.setSize(s.x,s.y);const H=U.map.isWebGLCubeRenderTarget?6:U.getViewportCount();W.isPointLight!==!0&&U.updateMatrices(W,M);for(let k=0;k<H;k++){const L=U.getCamera(k);if(W.isPointLight){const V=U.camera,at=U.matrix,j=W.distance||V.far;j!==V.far&&(V.far=j,V.updateProjectionMatrix()),co.setFromMatrixPosition(W.matrixWorld),V.position.copy(co),yd.copy(V.position),yd.add(Db[k]),V.up.copy(Nb[k]),V.lookAt(yd),V.updateMatrixWorld(),at.makeTranslation(-co.x,-co.y,-co.z),Th.multiplyMatrices(V.projectionMatrix,V.matrixWorldInverse),U._frustum.setFromProjectionMatrix(Th,V.coordinateSystem,V.reversedDepth)}if(U.map.isWebGLCubeRenderTarget)e.setRenderTarget(U.map,k),e.clear();else{k===0&&(e.setRenderTarget(U.map),e.clear());const V=U.getViewport(k);o.set(a.x*V.x,a.y*V.y,a.x*V.z,a.y*V.w),D.viewport(o)}i=U.getFrustum(k),g(E,M,L,W,this.type)}U.isPointLightShadow!==!0&&this.type===_o&&v(U,M),U.needsUpdate=!1}m=this.type,x.needsUpdate=!1,e.setRenderTarget(T,z,R)};function v(S,E){const M=t.update(_);u.defines.VSM_SAMPLES!==S.blurSamples&&(u.defines.VSM_SAMPLES=S.blurSamples,h.defines.VSM_SAMPLES=S.blurSamples,u.needsUpdate=!0,h.needsUpdate=!0),S.mapPass===null?S.mapPass=new qn(s.x,s.y,{format:Is,type:di}):(S.mapPass.width!==S.map.width||S.mapPass.height!==S.map.height)&&S.mapPass.setSize(S.map.width,S.map.height),u.uniforms.shadow_pass.value=S.map.depthTexture,u.uniforms.resolution.value.set(S.map.width,S.map.height),u.uniforms.radius.value=S.radius,e.setRenderTarget(S.mapPass),e.clear(),e.renderBufferDirect(E,null,M,u,_,null),h.uniforms.shadow_pass.value=S.mapPass.texture,h.uniforms.resolution.value.set(S.map.width,S.map.height),h.uniforms.radius.value=S.radius,e.setRenderTarget(S.map),e.clear(),e.renderBufferDirect(E,null,M,h,_,null)}function y(S,E,M,T){let z=null;const R=M.isPointLight===!0?S.customDistanceMaterial:S.customDepthMaterial;if(R!==void 0)z=R;else if(z=M.isPointLight===!0?c:r,e.localClippingEnabled&&E.clipShadows===!0&&Array.isArray(E.clippingPlanes)&&E.clippingPlanes.length!==0||E.displacementMap&&E.displacementScale!==0||E.alphaMap&&E.alphaTest>0||E.map&&E.alphaTest>0||E.alphaToCoverage===!0){const D=z.uuid,O=E.uuid;let C=l[D];C===void 0&&(C={},l[D]=C);let F=C[O];F===void 0&&(F=z.clone(),C[O]=F,E.addEventListener("dispose",b)),z=F}if(z.visible=E.visible,z.wireframe=E.wireframe,T===_o?z.side=E.shadowSide!==null?E.shadowSide:E.side:z.side=E.shadowSide!==null?E.shadowSide:f[E.side],z.alphaMap=E.alphaMap,z.alphaTest=E.alphaToCoverage===!0?.5:E.alphaTest,z.map=E.map,z.clipShadows=E.clipShadows,z.clippingPlanes=E.clippingPlanes,z.clipIntersection=E.clipIntersection,z.displacementMap=E.displacementMap,z.displacementScale=E.displacementScale,z.displacementBias=E.displacementBias,z.wireframeLinewidth=E.wireframeLinewidth,z.linewidth=E.linewidth,M.isPointLight===!0&&z.isMeshDistanceMaterial===!0){const D=e.properties.get(z);D.light=M}return z}function g(S,E,M,T,z){if(S.visible===!1)return;if(S.layers.test(E.layers)&&(S.isMesh||S.isLine||S.isPoints)&&(S.castShadow||S.receiveShadow&&z===_o)&&(!S.frustumCulled||S.intersectsFrustum(i))){S.modelViewMatrix.multiplyMatrices(M.matrixWorldInverse,S.matrixWorld);const O=t.update(S),C=S.material;if(Array.isArray(C)){const F=O.groups;for(let W=0,U=F.length;W<U;W++){const B=F[W],P=C[B.materialIndex];if(P&&P.visible){const H=y(S,P,T,z);S.onBeforeShadow(e,S,E,M,O,H,B),e.renderBufferDirect(M,null,O,H,S,B),S.onAfterShadow(e,S,E,M,O,H,B)}}}else if(C.visible){const F=y(S,C,T,z);S.onBeforeShadow(e,S,E,M,O,F,null),e.renderBufferDirect(M,null,O,F,S,null),S.onAfterShadow(e,S,E,M,O,F,null)}}const D=S.children;for(let O=0,C=D.length;O<C;O++)g(D[O],E,M,T,z)}function b(S){S.target.removeEventListener("dispose",b);for(const M in l){const T=l[M],z=S.target.uuid;z in T&&(T[z].dispose(),delete T[z])}}}function Ob(e,t){function n(){let K=!1;const At=new Ee;let ht=null;const zt=new Ee(0,0,0,0);return{setMask:function(Nt){ht!==Nt&&!K&&(e.colorMask(Nt,Nt,Nt,Nt),ht=Nt)},setLocked:function(Nt){K=Nt},setClear:function(Nt,vt,Yt,kt,ve){ve===!0&&(Nt*=kt,vt*=kt,Yt*=kt),At.set(Nt,vt,Yt,kt),zt.equals(At)===!1&&(e.clearColor(Nt,vt,Yt,kt),zt.copy(At))},reset:function(){K=!1,ht=null,zt.set(-1,0,0,0)}}}function i(){let K=!1,At=!1,ht=null,zt=null,Nt=null;return{setReversed:function(vt){if(At!==vt){const Yt=t.get("EXT_clip_control");vt?Yt.clipControlEXT(Yt.LOWER_LEFT_EXT,Yt.ZERO_TO_ONE_EXT):Yt.clipControlEXT(Yt.LOWER_LEFT_EXT,Yt.NEGATIVE_ONE_TO_ONE_EXT),At=vt;const kt=Nt;Nt=null,this.setClear(kt)}},getReversed:function(){return At},setTest:function(vt){vt?Q(e.DEPTH_TEST):dt(e.DEPTH_TEST)},setMask:function(vt){ht!==vt&&!K&&(e.depthMask(vt),ht=vt)},setFunc:function(vt){if(At&&(vt=D1[vt]),zt!==vt){switch(vt){case Yd:e.depthFunc(e.NEVER);break;case Zd:e.depthFunc(e.ALWAYS);break;case Kd:e.depthFunc(e.LESS);break;case $o:e.depthFunc(e.LEQUAL);break;case Jd:e.depthFunc(e.EQUAL);break;case Qd:e.depthFunc(e.GEQUAL);break;case jd:e.depthFunc(e.GREATER);break;case tf:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}zt=vt}},setLocked:function(vt){K=vt},setClear:function(vt){Nt!==vt&&(Nt=vt,At&&(vt=1-vt),e.clearDepth(vt))},reset:function(){K=!1,ht=null,zt=null,Nt=null,At=!1}}}function s(){let K=!1,At=null,ht=null,zt=null,Nt=null,vt=null,Yt=null,kt=null,ve=null;return{setTest:function(de){K||(de?Q(e.STENCIL_TEST):dt(e.STENCIL_TEST))},setMask:function(de){At!==de&&!K&&(e.stencilMask(de),At=de)},setFunc:function(de,Un,Kn){(ht!==de||zt!==Un||Nt!==Kn)&&(e.stencilFunc(de,Un,Kn),ht=de,zt=Un,Nt=Kn)},setOp:function(de,Un,Kn){(vt!==de||Yt!==Un||kt!==Kn)&&(e.stencilOp(de,Un,Kn),vt=de,Yt=Un,kt=Kn)},setLocked:function(de){K=de},setClear:function(de){ve!==de&&(e.clearStencil(de),ve=de)},reset:function(){K=!1,At=null,ht=null,zt=null,Nt=null,vt=null,Yt=null,kt=null,ve=null}}}const a=new n,o=new i,r=new s,c=new WeakMap,l=new WeakMap;let d={},f={},u={},h=new WeakMap,p=[],_=null,x=!1,m=null,v=null,y=null,g=null,b=null,S=null,E=null,M=new te(0,0,0),T=0,z=!1,R=null,D=null,O=null,C=null,F=null;const W=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let U=!1,B=0;const P=e.getParameter(e.VERSION);P.indexOf("WebGL")!==-1?(B=parseFloat(/^WebGL (\d)/.exec(P)[1]),U=B>=1):P.indexOf("OpenGL ES")!==-1&&(B=parseFloat(/^OpenGL ES (\d)/.exec(P)[1]),U=B>=2);let H=null,k={};const L=e.getParameter(e.SCISSOR_BOX),V=e.getParameter(e.VIEWPORT),at=new Ee().fromArray(L),j=new Ee().fromArray(V);function pt(K,At,ht,zt){const Nt=new Uint8Array(4),vt=e.createTexture();e.bindTexture(K,vt),e.texParameteri(K,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(K,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let Yt=0;Yt<ht;Yt++)K===e.TEXTURE_3D||K===e.TEXTURE_2D_ARRAY?e.texImage3D(At,0,e.RGBA,1,1,zt,0,e.RGBA,e.UNSIGNED_BYTE,Nt):e.texImage2D(At+Yt,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,Nt);return vt}const J={};J[e.TEXTURE_2D]=pt(e.TEXTURE_2D,e.TEXTURE_2D,1),J[e.TEXTURE_CUBE_MAP]=pt(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),J[e.TEXTURE_2D_ARRAY]=pt(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),J[e.TEXTURE_3D]=pt(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),r.setClear(0),Q(e.DEPTH_TEST),o.setFunc($o),et(!1),X(T0),Q(e.CULL_FACE),xt(Li);function Q(K){d[K]!==!0&&(e.enable(K),d[K]=!0)}function dt(K){d[K]!==!1&&(e.disable(K),d[K]=!1)}function Ot(K,At){return u[K]!==At?(e.bindFramebuffer(K,At),u[K]=At,K===e.DRAW_FRAMEBUFFER&&(u[e.FRAMEBUFFER]=At),K===e.FRAMEBUFFER&&(u[e.DRAW_FRAMEBUFFER]=At),!0):!1}function mt(K,At){let ht=p,zt=!1;if(K){ht=h.get(At),ht===void 0&&(ht=[],h.set(At,ht));const Nt=K.textures;if(ht.length!==Nt.length||ht[0]!==e.COLOR_ATTACHMENT0){for(let vt=0,Yt=Nt.length;vt<Yt;vt++)ht[vt]=e.COLOR_ATTACHMENT0+vt;ht.length=Nt.length,zt=!0}}else ht[0]!==e.BACK&&(ht[0]=e.BACK,zt=!0);zt&&e.drawBuffers(ht)}function Gt(K){return _!==K?(e.useProgram(K),_=K,!0):!1}const Qt={[_a]:e.FUNC_ADD,[e1]:e.FUNC_SUBTRACT,[n1]:e.FUNC_REVERSE_SUBTRACT};Qt[i1]=e.MIN,Qt[s1]=e.MAX;const ct={[a1]:e.ZERO,[o1]:e.ONE,[r1]:e.SRC_COLOR,[am]:e.SRC_ALPHA,[h1]:e.SRC_ALPHA_SATURATE,[f1]:e.DST_COLOR,[l1]:e.DST_ALPHA,[c1]:e.ONE_MINUS_SRC_COLOR,[om]:e.ONE_MINUS_SRC_ALPHA,[u1]:e.ONE_MINUS_DST_COLOR,[d1]:e.ONE_MINUS_DST_ALPHA,[p1]:e.CONSTANT_COLOR,[m1]:e.ONE_MINUS_CONSTANT_COLOR,[x1]:e.CONSTANT_ALPHA,[g1]:e.ONE_MINUS_CONSTANT_ALPHA};function xt(K,At,ht,zt,Nt,vt,Yt,kt,ve,de){if(K===Li){x===!0&&(dt(e.BLEND),x=!1);return}if(x===!1&&(Q(e.BLEND),x=!0),K!==t1){if(K!==m||de!==z){if((v!==_a||b!==_a)&&(e.blendEquation(e.FUNC_ADD),v=_a,b=_a),de)switch(K){case Co:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case A0:e.blendFunc(e.ONE,e.ONE);break;case z0:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case R0:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:ce("WebGLState: Invalid blending: ",K);break}else switch(K){case Co:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case A0:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case z0:ce("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case R0:ce("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:ce("WebGLState: Invalid blending: ",K);break}y=null,g=null,S=null,E=null,M.set(0,0,0),T=0,m=K,z=de}return}Nt=Nt||At,vt=vt||ht,Yt=Yt||zt,(At!==v||Nt!==b)&&(e.blendEquationSeparate(Qt[At],Qt[Nt]),v=At,b=Nt),(ht!==y||zt!==g||vt!==S||Yt!==E)&&(e.blendFuncSeparate(ct[ht],ct[zt],ct[vt],ct[Yt]),y=ht,g=zt,S=vt,E=Yt),(kt.equals(M)===!1||ve!==T)&&(e.blendColor(kt.r,kt.g,kt.b,ve),M.copy(kt),T=ve),m=K,z=!1}function q(K,At){K.side===wi?dt(e.CULL_FACE):Q(e.CULL_FACE);let ht=K.side===dn;At&&(ht=!ht),et(ht),K.blending===Co&&K.transparent===!1?xt(Li):xt(K.blending,K.blendEquation,K.blendSrc,K.blendDst,K.blendEquationAlpha,K.blendSrcAlpha,K.blendDstAlpha,K.blendColor,K.blendAlpha,K.premultipliedAlpha),o.setFunc(K.depthFunc),o.setTest(K.depthTest),o.setMask(K.depthWrite),a.setMask(K.colorWrite);const zt=K.stencilWrite;r.setTest(zt),zt&&(r.setMask(K.stencilWriteMask),r.setFunc(K.stencilFunc,K.stencilRef,K.stencilFuncMask),r.setOp(K.stencilFail,K.stencilZFail,K.stencilZPass)),gt(K.polygonOffset,K.polygonOffsetFactor,K.polygonOffsetUnits),K.alphaToCoverage===!0?Q(e.SAMPLE_ALPHA_TO_COVERAGE):dt(e.SAMPLE_ALPHA_TO_COVERAGE)}function et(K){R!==K&&(K?e.frontFace(e.CW):e.frontFace(e.CCW),R=K)}function X(K){K!==Jg?(Q(e.CULL_FACE),K!==D&&(K===T0?e.cullFace(e.BACK):K===Qg?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))):dt(e.CULL_FACE),D=K}function lt(K){K!==O&&(U&&e.lineWidth(K),O=K)}function gt(K,At,ht){K?(Q(e.POLYGON_OFFSET_FILL),(C!==At||F!==ht)&&(C=At,F=ht,o.getReversed()&&(At=-At),e.polygonOffset(At,ht))):dt(e.POLYGON_OFFSET_FILL)}function ft(K){K?Q(e.SCISSOR_TEST):dt(e.SCISSOR_TEST)}function wt(K){K===void 0&&(K=e.TEXTURE0+W-1),H!==K&&(e.activeTexture(K),H=K)}function G(K,At,ht){ht===void 0&&(H===null?ht=e.TEXTURE0+W-1:ht=H);let zt=k[ht];zt===void 0&&(zt={type:void 0,texture:void 0},k[ht]=zt),(zt.type!==K||zt.texture!==At)&&(H!==ht&&(e.activeTexture(ht),H=ht),e.bindTexture(K,At||J[K]),zt.type=K,zt.texture=At)}function Rt(){const K=k[H];K!==void 0&&K.type!==void 0&&(e.bindTexture(K.type,null),K.type=void 0,K.texture=void 0)}function Dt(){try{e.compressedTexImage2D(...arguments)}catch(K){ce("WebGLState:",K)}}function I(){try{e.compressedTexImage3D(...arguments)}catch(K){ce("WebGLState:",K)}}function w(){try{e.texSubImage2D(...arguments)}catch(K){ce("WebGLState:",K)}}function $(){try{e.texSubImage3D(...arguments)}catch(K){ce("WebGLState:",K)}}function tt(){try{e.compressedTexSubImage2D(...arguments)}catch(K){ce("WebGLState:",K)}}function ot(){try{e.compressedTexSubImage3D(...arguments)}catch(K){ce("WebGLState:",K)}}function Mt(){try{e.texStorage2D(...arguments)}catch(K){ce("WebGLState:",K)}}function yt(){try{e.texStorage3D(...arguments)}catch(K){ce("WebGLState:",K)}}function rt(){try{e.texImage2D(...arguments)}catch(K){ce("WebGLState:",K)}}function ut(){try{e.texImage3D(...arguments)}catch(K){ce("WebGLState:",K)}}function Et(K){return f[K]!==void 0?f[K]:e.getParameter(K)}function $t(K,At){f[K]!==At&&(e.pixelStorei(K,At),f[K]=At)}function Ct(K){at.equals(K)===!1&&(e.scissor(K.x,K.y,K.z,K.w),at.copy(K))}function Tt(K){j.equals(K)===!1&&(e.viewport(K.x,K.y,K.z,K.w),j.copy(K))}function qt(K,At){let ht=l.get(At);ht===void 0&&(ht=new WeakMap,l.set(At,ht));let zt=ht.get(K);zt===void 0&&(zt=e.getUniformBlockIndex(At,K.name),ht.set(K,zt))}function Zt(K,At){const zt=l.get(At).get(K);c.get(At)!==zt&&(e.uniformBlockBinding(At,zt,K.__bindingPointIndex),c.set(At,zt))}function ee(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),d={},f={},H=null,k={},u={},h=new WeakMap,p=[],_=null,x=!1,m=null,v=null,y=null,g=null,b=null,S=null,E=null,M=new te(0,0,0),T=0,z=!1,R=null,D=null,O=null,C=null,F=null,at.set(0,0,e.canvas.width,e.canvas.height),j.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),r.reset()}return{buffers:{color:a,depth:o,stencil:r},enable:Q,disable:dt,bindFramebuffer:Ot,drawBuffers:mt,useProgram:Gt,setBlending:xt,setMaterial:q,setFlipSided:et,setCullFace:X,setLineWidth:lt,setPolygonOffset:gt,setScissorTest:ft,activeTexture:wt,bindTexture:G,unbindTexture:Rt,compressedTexImage2D:Dt,compressedTexImage3D:I,texImage2D:rt,texImage3D:ut,pixelStorei:$t,getParameter:Et,updateUBOMapping:qt,uniformBlockBinding:Zt,texStorage2D:Mt,texStorage3D:yt,texSubImage2D:w,texSubImage3D:$,compressedTexSubImage2D:tt,compressedTexSubImage3D:ot,scissor:Ct,viewport:Tt,reset:ee}}function Fb(e,t,n,i,s,a,o){const r=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new St,d=new WeakMap,f=new Set;let u;const h=new WeakMap;let p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function _(I,w){return p?new OffscreenCanvas(I,w):kc("canvas")}function x(I,w,$){let tt=1;const ot=Dt(I);if((ot.width>$||ot.height>$)&&(tt=$/Math.max(ot.width,ot.height)),tt<1)if(typeof HTMLImageElement<"u"&&I instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&I instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&I instanceof ImageBitmap||typeof VideoFrame<"u"&&I instanceof VideoFrame){const Mt=Math.floor(tt*ot.width),yt=Math.floor(tt*ot.height);u===void 0&&(u=_(Mt,yt));const rt=w?_(Mt,yt):u;return rt.width=Mt,rt.height=yt,rt.getContext("2d").drawImage(I,0,0,Mt,yt),Kt("WebGLRenderer: Texture has been resized from ("+ot.width+"x"+ot.height+") to ("+Mt+"x"+yt+")."),rt}else return"data"in I&&Kt("WebGLRenderer: Image in DataTexture is too big ("+ot.width+"x"+ot.height+")."),I;return I}function m(I){return I.generateMipmaps}function v(I){e.generateMipmap(I)}function y(I){return I.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:I.isWebGL3DRenderTarget?e.TEXTURE_3D:I.isWebGLArrayRenderTarget||I.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function g(I,w,$,tt,ot,Mt=!1){if(I!==null){if(e[I]!==void 0)return e[I];Kt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+I+"'")}let yt;tt&&(yt=t.get("EXT_texture_norm16"),yt||Kt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let rt=w;if(w===e.RED&&($===e.FLOAT&&(rt=e.R32F),$===e.HALF_FLOAT&&(rt=e.R16F),$===e.UNSIGNED_BYTE&&(rt=e.R8),$===e.UNSIGNED_SHORT&&yt&&(rt=yt.R16_EXT),$===e.SHORT&&yt&&(rt=yt.R16_SNORM_EXT)),w===e.RED_INTEGER&&($===e.UNSIGNED_BYTE&&(rt=e.R8UI),$===e.UNSIGNED_SHORT&&(rt=e.R16UI),$===e.UNSIGNED_INT&&(rt=e.R32UI),$===e.BYTE&&(rt=e.R8I),$===e.SHORT&&(rt=e.R16I),$===e.INT&&(rt=e.R32I)),w===e.RG&&($===e.FLOAT&&(rt=e.RG32F),$===e.HALF_FLOAT&&(rt=e.RG16F),$===e.UNSIGNED_BYTE&&(rt=e.RG8),$===e.UNSIGNED_SHORT&&yt&&(rt=yt.RG16_EXT),$===e.SHORT&&yt&&(rt=yt.RG16_SNORM_EXT)),w===e.RG_INTEGER&&($===e.UNSIGNED_BYTE&&(rt=e.RG8UI),$===e.UNSIGNED_SHORT&&(rt=e.RG16UI),$===e.UNSIGNED_INT&&(rt=e.RG32UI),$===e.BYTE&&(rt=e.RG8I),$===e.SHORT&&(rt=e.RG16I),$===e.INT&&(rt=e.RG32I)),w===e.RGB_INTEGER&&($===e.UNSIGNED_BYTE&&(rt=e.RGB8UI),$===e.UNSIGNED_SHORT&&(rt=e.RGB16UI),$===e.UNSIGNED_INT&&(rt=e.RGB32UI),$===e.BYTE&&(rt=e.RGB8I),$===e.SHORT&&(rt=e.RGB16I),$===e.INT&&(rt=e.RGB32I)),w===e.RGBA_INTEGER&&($===e.UNSIGNED_BYTE&&(rt=e.RGBA8UI),$===e.UNSIGNED_SHORT&&(rt=e.RGBA16UI),$===e.UNSIGNED_INT&&(rt=e.RGBA32UI),$===e.BYTE&&(rt=e.RGBA8I),$===e.SHORT&&(rt=e.RGBA16I),$===e.INT&&(rt=e.RGBA32I)),w===e.RGB&&($===e.UNSIGNED_SHORT&&yt&&(rt=yt.RGB16_EXT),$===e.SHORT&&yt&&(rt=yt.RGB16_SNORM_EXT),$===e.UNSIGNED_INT_5_9_9_9_REV&&(rt=e.RGB9_E5),$===e.UNSIGNED_INT_10F_11F_11F_REV&&(rt=e.R11F_G11F_B10F)),w===e.RGBA){const ut=Mt?Wc:oe.getTransfer(ot);$===e.FLOAT&&(rt=e.RGBA32F),$===e.HALF_FLOAT&&(rt=e.RGBA16F),$===e.UNSIGNED_BYTE&&(rt=ut===pe?e.SRGB8_ALPHA8:e.RGBA8),$===e.UNSIGNED_SHORT&&yt&&(rt=yt.RGBA16_EXT),$===e.SHORT&&yt&&(rt=yt.RGBA16_SNORM_EXT),$===e.UNSIGNED_SHORT_4_4_4_4&&(rt=e.RGBA4),$===e.UNSIGNED_SHORT_5_5_5_1&&(rt=e.RGB5_A1)}return(rt===e.R16F||rt===e.R32F||rt===e.RG16F||rt===e.RG32F||rt===e.RGBA16F||rt===e.RGBA32F)&&t.get("EXT_color_buffer_float"),rt}function b(I,w){let $;return I?w===null||w===li||w===Zo?$=e.DEPTH24_STENCIL8:w===si?$=e.DEPTH32F_STENCIL8:w===Yo&&($=e.DEPTH24_STENCIL8,Kt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):w===null||w===li||w===Zo?$=e.DEPTH_COMPONENT24:w===si?$=e.DEPTH_COMPONENT32F:w===Yo&&($=e.DEPTH_COMPONENT16),$}function S(I,w){return m(I)===!0||I.isFramebufferTexture&&I.minFilter!==He&&I.minFilter!==Ve?Math.log2(Math.max(w.width,w.height))+1:I.mipmaps!==void 0&&I.mipmaps.length>0?I.mipmaps.length:I.isCompressedTexture&&Array.isArray(I.image)?w.mipmaps.length:1}function E(I){const w=I.target;w.removeEventListener("dispose",E),T(w),w.isVideoTexture&&d.delete(w),w.isHTMLTexture&&f.delete(w)}function M(I){const w=I.target;w.removeEventListener("dispose",M),R(w)}function T(I){const w=i.get(I);if(w.__webglInit===void 0)return;const $=I.source,tt=h.get($);if(tt){const ot=tt[w.__cacheKey];ot.usedTimes--,ot.usedTimes===0&&z(I),Object.keys(tt).length===0&&h.delete($)}i.remove(I)}function z(I){const w=i.get(I);e.deleteTexture(w.__webglTexture);const $=I.source,tt=h.get($);delete tt[w.__cacheKey],o.memory.textures--}function R(I){const w=i.get(I);if(I.depthTexture&&(I.depthTexture.dispose(),i.remove(I.depthTexture)),I.isWebGLCubeRenderTarget)for(let tt=0;tt<6;tt++){if(Array.isArray(w.__webglFramebuffer[tt]))for(let ot=0;ot<w.__webglFramebuffer[tt].length;ot++)e.deleteFramebuffer(w.__webglFramebuffer[tt][ot]);else e.deleteFramebuffer(w.__webglFramebuffer[tt]);w.__webglDepthbuffer&&e.deleteRenderbuffer(w.__webglDepthbuffer[tt])}else{if(Array.isArray(w.__webglFramebuffer))for(let tt=0;tt<w.__webglFramebuffer.length;tt++)e.deleteFramebuffer(w.__webglFramebuffer[tt]);else e.deleteFramebuffer(w.__webglFramebuffer);if(w.__webglDepthbuffer&&e.deleteRenderbuffer(w.__webglDepthbuffer),w.__webglMultisampledFramebuffer&&e.deleteFramebuffer(w.__webglMultisampledFramebuffer),w.__webglColorRenderbuffer)for(let tt=0;tt<w.__webglColorRenderbuffer.length;tt++)w.__webglColorRenderbuffer[tt]&&e.deleteRenderbuffer(w.__webglColorRenderbuffer[tt]);w.__webglDepthRenderbuffer&&e.deleteRenderbuffer(w.__webglDepthRenderbuffer)}const $=I.textures;for(let tt=0,ot=$.length;tt<ot;tt++){const Mt=i.get($[tt]);Mt.__webglTexture&&(e.deleteTexture(Mt.__webglTexture),o.memory.textures--),i.remove($[tt])}i.remove(I)}let D=0;function O(){D=0}function C(){return D}function F(I){D=I}function W(){const I=D;return I>=s.maxTextures&&Kt("WebGLTextures: Trying to use "+(I+1)+" texture units while this GPU supports only "+s.maxTextures),D+=1,I}function U(I){const w=[];return w.push(I.wrapS),w.push(I.wrapT),w.push(I.wrapR||0),w.push(I.magFilter),w.push(I.minFilter),w.push(I.anisotropy),w.push(I.internalFormat),w.push(I.format),w.push(I.type),w.push(I.generateMipmaps),w.push(I.premultiplyAlpha),w.push(I.flipY),w.push(I.unpackAlignment),w.push(I.colorSpace),w.join()}function B(I,w){const $=i.get(I);if(I.isVideoTexture&&G(I),I.isRenderTargetTexture===!1&&I.isExternalTexture!==!0&&I.version>0&&$.__version!==I.version){const tt=I.image;if(tt===null)Kt("WebGLRenderer: Texture marked for update but no image data found.");else if(tt.complete===!1)Kt("WebGLRenderer: Texture marked for update but image is incomplete");else{dt($,I,w);return}}else I.isExternalTexture&&($.__webglTexture=I.sourceTexture?I.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,$.__webglTexture,e.TEXTURE0+w)}function P(I,w){const $=i.get(I);if(I.isRenderTargetTexture===!1&&I.version>0&&$.__version!==I.version){dt($,I,w);return}else I.isExternalTexture&&($.__webglTexture=I.sourceTexture?I.sourceTexture:null);n.bindTexture(e.TEXTURE_2D_ARRAY,$.__webglTexture,e.TEXTURE0+w)}function H(I,w){const $=i.get(I);if(I.isRenderTargetTexture===!1&&I.version>0&&$.__version!==I.version){dt($,I,w);return}n.bindTexture(e.TEXTURE_3D,$.__webglTexture,e.TEXTURE0+w)}function k(I,w){const $=i.get(I);if(I.isCubeDepthTexture!==!0&&I.version>0&&$.__version!==I.version){Ot($,I,w);return}n.bindTexture(e.TEXTURE_CUBE_MAP,$.__webglTexture,e.TEXTURE0+w)}const L={[qo]:e.REPEAT,[Ei]:e.CLAMP_TO_EDGE,[ef]:e.MIRRORED_REPEAT},V={[He]:e.NEAREST,[M1]:e.NEAREST_MIPMAP_NEAREST,[Cr]:e.NEAREST_MIPMAP_LINEAR,[Ve]:e.LINEAR,[Vl]:e.LINEAR_MIPMAP_NEAREST,[vs]:e.LINEAR_MIPMAP_LINEAR},at={[w1]:e.NEVER,[R1]:e.ALWAYS,[E1]:e.LESS,[wu]:e.LEQUAL,[T1]:e.EQUAL,[Eu]:e.GEQUAL,[A1]:e.GREATER,[z1]:e.NOTEQUAL};function j(I,w){if(w.type===si&&t.has("OES_texture_float_linear")===!1&&(w.magFilter===Ve||w.magFilter===Vl||w.magFilter===Cr||w.magFilter===vs||w.minFilter===Ve||w.minFilter===Vl||w.minFilter===Cr||w.minFilter===vs)&&Kt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),e.texParameteri(I,e.TEXTURE_WRAP_S,L[w.wrapS]),e.texParameteri(I,e.TEXTURE_WRAP_T,L[w.wrapT]),(I===e.TEXTURE_3D||I===e.TEXTURE_2D_ARRAY)&&e.texParameteri(I,e.TEXTURE_WRAP_R,L[w.wrapR]),e.texParameteri(I,e.TEXTURE_MAG_FILTER,V[w.magFilter]),e.texParameteri(I,e.TEXTURE_MIN_FILTER,V[w.minFilter]),w.compareFunction&&(e.texParameteri(I,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(I,e.TEXTURE_COMPARE_FUNC,at[w.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(w.magFilter===He||w.minFilter!==Cr&&w.minFilter!==vs||w.type===si&&t.has("OES_texture_float_linear")===!1)return;if(w.anisotropy>1||i.get(w).__currentAnisotropy){const $=t.get("EXT_texture_filter_anisotropic");e.texParameterf(I,$.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(w.anisotropy,s.getMaxAnisotropy())),i.get(w).__currentAnisotropy=w.anisotropy}}}function pt(I,w){let $=!1;I.__webglInit===void 0&&(I.__webglInit=!0,w.addEventListener("dispose",E));const tt=w.source;let ot=h.get(tt);ot===void 0&&(ot={},h.set(tt,ot));const Mt=U(w);if(Mt!==I.__cacheKey){ot[Mt]===void 0&&(ot[Mt]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,$=!0),ot[Mt].usedTimes++;const yt=ot[I.__cacheKey];yt!==void 0&&(ot[I.__cacheKey].usedTimes--,yt.usedTimes===0&&z(w)),I.__cacheKey=Mt,I.__webglTexture=ot[Mt].texture}return $}function J(I,w,$){return Math.floor(Math.floor(I/$)/w)}function Q(I,w,$,tt){const Mt=I.updateRanges;if(Mt.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,w.width,w.height,$,tt,w.data);else{Mt.sort(($t,Ct)=>$t.start-Ct.start);let yt=0;for(let $t=1;$t<Mt.length;$t++){const Ct=Mt[yt],Tt=Mt[$t],qt=Ct.start+Ct.count,Zt=J(Tt.start,w.width,4),ee=J(Ct.start,w.width,4);Tt.start<=qt+1&&Zt===ee&&J(Tt.start+Tt.count-1,w.width,4)===Zt?Ct.count=Math.max(Ct.count,Tt.start+Tt.count-Ct.start):(++yt,Mt[yt]=Tt)}Mt.length=yt+1;const rt=n.getParameter(e.UNPACK_ROW_LENGTH),ut=n.getParameter(e.UNPACK_SKIP_PIXELS),Et=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,w.width);for(let $t=0,Ct=Mt.length;$t<Ct;$t++){const Tt=Mt[$t],qt=Math.floor(Tt.start/4),Zt=Math.ceil(Tt.count/4),ee=qt%w.width,K=Math.floor(qt/w.width),At=Zt,ht=1;n.pixelStorei(e.UNPACK_SKIP_PIXELS,ee),n.pixelStorei(e.UNPACK_SKIP_ROWS,K),n.texSubImage2D(e.TEXTURE_2D,0,ee,K,At,ht,$,tt,w.data)}I.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,rt),n.pixelStorei(e.UNPACK_SKIP_PIXELS,ut),n.pixelStorei(e.UNPACK_SKIP_ROWS,Et)}}function dt(I,w,$){let tt=e.TEXTURE_2D;(w.isDataArrayTexture||w.isCompressedArrayTexture)&&(tt=e.TEXTURE_2D_ARRAY),w.isData3DTexture&&(tt=e.TEXTURE_3D);const ot=pt(I,w),Mt=w.source;n.bindTexture(tt,I.__webglTexture,e.TEXTURE0+$);const yt=i.get(Mt);if(Mt.version!==yt.__version||ot===!0){if(n.activeTexture(e.TEXTURE0+$),(typeof ImageBitmap<"u"&&w.image instanceof ImageBitmap)===!1){const ht=oe.getPrimaries(oe.workingColorSpace),zt=w.colorSpace===ts?null:oe.getPrimaries(w.colorSpace),Nt=w.colorSpace===ts||ht===zt?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,w.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,w.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,Nt)}n.pixelStorei(e.UNPACK_ALIGNMENT,w.unpackAlignment);let ut=x(w.image,!1,s.maxTextureSize);ut=Rt(w,ut);const Et=a.convert(w.format,w.colorSpace),$t=a.convert(w.type);let Ct=g(w.internalFormat,Et,$t,w.normalized,w.colorSpace,w.isVideoTexture);j(tt,w);let Tt;const qt=w.mipmaps,Zt=w.isVideoTexture!==!0,ee=yt.__version===void 0||ot===!0,K=Mt.dataReady,At=S(w,ut);if(w.isDepthTexture)Ct=b(w.format===Ms,w.type),ee&&(Zt?n.texStorage2D(e.TEXTURE_2D,1,Ct,ut.width,ut.height):n.texImage2D(e.TEXTURE_2D,0,Ct,ut.width,ut.height,0,Et,$t,null));else if(w.isDataTexture)if(qt.length>0){Zt&&ee&&n.texStorage2D(e.TEXTURE_2D,At,Ct,qt[0].width,qt[0].height);for(let ht=0,zt=qt.length;ht<zt;ht++)Tt=qt[ht],Zt?K&&n.texSubImage2D(e.TEXTURE_2D,ht,0,0,Tt.width,Tt.height,Et,$t,Tt.data):n.texImage2D(e.TEXTURE_2D,ht,Ct,Tt.width,Tt.height,0,Et,$t,Tt.data);w.generateMipmaps=!1}else Zt?(ee&&n.texStorage2D(e.TEXTURE_2D,At,Ct,ut.width,ut.height),K&&Q(w,ut,Et,$t)):n.texImage2D(e.TEXTURE_2D,0,Ct,ut.width,ut.height,0,Et,$t,ut.data);else if(w.isCompressedTexture)if(w.isCompressedArrayTexture){Zt&&ee&&n.texStorage3D(e.TEXTURE_2D_ARRAY,At,Ct,qt[0].width,qt[0].height,ut.depth);for(let ht=0,zt=qt.length;ht<zt;ht++)if(Tt=qt[ht],w.format!==$n)if(Et!==null)if(Zt){if(K)if(w.layerUpdates.size>0){const Nt=sh(Tt.width,Tt.height,w.format,w.type);for(const vt of w.layerUpdates){const Yt=Tt.data.subarray(vt*Nt/Tt.data.BYTES_PER_ELEMENT,(vt+1)*Nt/Tt.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,ht,0,0,vt,Tt.width,Tt.height,1,Et,Yt)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,ht,0,0,0,Tt.width,Tt.height,ut.depth,Et,Tt.data)}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,ht,Ct,Tt.width,Tt.height,ut.depth,0,Tt.data,0,0);else Kt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Zt?K&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,ht,0,0,0,Tt.width,Tt.height,ut.depth,Et,$t,Tt.data):n.texImage3D(e.TEXTURE_2D_ARRAY,ht,Ct,Tt.width,Tt.height,ut.depth,0,Et,$t,Tt.data);w.layerUpdates.size>0&&w.clearLayerUpdates()}else{Zt&&ee&&n.texStorage2D(e.TEXTURE_2D,At,Ct,qt[0].width,qt[0].height);for(let ht=0,zt=qt.length;ht<zt;ht++)Tt=qt[ht],w.format!==$n?Et!==null?Zt?K&&n.compressedTexSubImage2D(e.TEXTURE_2D,ht,0,0,Tt.width,Tt.height,Et,Tt.data):n.compressedTexImage2D(e.TEXTURE_2D,ht,Ct,Tt.width,Tt.height,0,Tt.data):Kt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Zt?K&&n.texSubImage2D(e.TEXTURE_2D,ht,0,0,Tt.width,Tt.height,Et,$t,Tt.data):n.texImage2D(e.TEXTURE_2D,ht,Ct,Tt.width,Tt.height,0,Et,$t,Tt.data)}else if(w.isDataArrayTexture)if(Zt){if(ee&&n.texStorage3D(e.TEXTURE_2D_ARRAY,At,Ct,ut.width,ut.height,ut.depth),K)if(w.layerUpdates.size>0){const ht=sh(ut.width,ut.height,w.format,w.type);for(const zt of w.layerUpdates){const Nt=ut.data.subarray(zt*ht/ut.data.BYTES_PER_ELEMENT,(zt+1)*ht/ut.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,zt,ut.width,ut.height,1,Et,$t,Nt)}w.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,ut.width,ut.height,ut.depth,Et,$t,ut.data)}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,Ct,ut.width,ut.height,ut.depth,0,Et,$t,ut.data);else if(w.isData3DTexture)Zt?(ee&&n.texStorage3D(e.TEXTURE_3D,At,Ct,ut.width,ut.height,ut.depth),K&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,ut.width,ut.height,ut.depth,Et,$t,ut.data)):n.texImage3D(e.TEXTURE_3D,0,Ct,ut.width,ut.height,ut.depth,0,Et,$t,ut.data);else if(w.isFramebufferTexture){if(ee)if(Zt)n.texStorage2D(e.TEXTURE_2D,At,Ct,ut.width,ut.height);else{let ht=ut.width,zt=ut.height;for(let Nt=0;Nt<At;Nt++)n.texImage2D(e.TEXTURE_2D,Nt,Ct,ht,zt,0,Et,$t,null),ht>>=1,zt>>=1}}else if(w.isHTMLTexture){if("texElementImage2D"in e){const ht=e.canvas;if(ht.hasAttribute("layoutsubtree")||ht.setAttribute("layoutsubtree","true"),ut.parentNode!==ht){ht.appendChild(ut),f.add(w),ht.onpaint=zt=>{const Nt=zt.changedElements;for(const vt of f)Nt.includes(vt.image)&&(vt.needsUpdate=!0)},ht.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,ut);else{const Nt=e.RGBA,vt=e.RGBA,Yt=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,Nt,vt,Yt,ut)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(qt.length>0){if(Zt&&ee){const ht=Dt(qt[0]);n.texStorage2D(e.TEXTURE_2D,At,Ct,ht.width,ht.height)}for(let ht=0,zt=qt.length;ht<zt;ht++)Tt=qt[ht],Zt?K&&n.texSubImage2D(e.TEXTURE_2D,ht,0,0,Et,$t,Tt):n.texImage2D(e.TEXTURE_2D,ht,Ct,Et,$t,Tt);w.generateMipmaps=!1}else if(Zt){if(ee){const ht=Dt(ut);n.texStorage2D(e.TEXTURE_2D,At,Ct,ht.width,ht.height)}K&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,Et,$t,ut)}else n.texImage2D(e.TEXTURE_2D,0,Ct,Et,$t,ut);m(w)&&v(tt),yt.__version=Mt.version,w.onUpdate&&w.onUpdate(w)}I.__version=w.version}function Ot(I,w,$){if(w.image.length!==6)return;const tt=pt(I,w),ot=w.source;n.bindTexture(e.TEXTURE_CUBE_MAP,I.__webglTexture,e.TEXTURE0+$);const Mt=i.get(ot);if(ot.version!==Mt.__version||tt===!0){n.activeTexture(e.TEXTURE0+$);const yt=oe.getPrimaries(oe.workingColorSpace),rt=w.colorSpace===ts?null:oe.getPrimaries(w.colorSpace),ut=w.colorSpace===ts||yt===rt?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,w.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,w.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,w.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,ut);const Et=w.isCompressedTexture||w.image[0].isCompressedTexture,$t=w.image[0]&&w.image[0].isDataTexture,Ct=[];for(let vt=0;vt<6;vt++)!Et&&!$t?Ct[vt]=x(w.image[vt],!0,s.maxCubemapSize):Ct[vt]=$t?w.image[vt].image:w.image[vt],Ct[vt]=Rt(w,Ct[vt]);const Tt=Ct[0],qt=a.convert(w.format,w.colorSpace),Zt=a.convert(w.type),ee=g(w.internalFormat,qt,Zt,w.normalized,w.colorSpace),K=w.isVideoTexture!==!0,At=Mt.__version===void 0||tt===!0,ht=ot.dataReady;let zt=S(w,Tt);j(e.TEXTURE_CUBE_MAP,w);let Nt;if(Et){K&&At&&n.texStorage2D(e.TEXTURE_CUBE_MAP,zt,ee,Tt.width,Tt.height);for(let vt=0;vt<6;vt++){Nt=Ct[vt].mipmaps;for(let Yt=0;Yt<Nt.length;Yt++){const kt=Nt[Yt];w.format!==$n?qt!==null?K?ht&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,Yt,0,0,kt.width,kt.height,qt,kt.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,Yt,ee,kt.width,kt.height,0,kt.data):Kt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):K?ht&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,Yt,0,0,kt.width,kt.height,qt,Zt,kt.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,Yt,ee,kt.width,kt.height,0,qt,Zt,kt.data)}}}else{if(Nt=w.mipmaps,K&&At){Nt.length>0&&zt++;const vt=Dt(Ct[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,zt,ee,vt.width,vt.height)}for(let vt=0;vt<6;vt++)if($t){K?ht&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,0,0,0,Ct[vt].width,Ct[vt].height,qt,Zt,Ct[vt].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,0,ee,Ct[vt].width,Ct[vt].height,0,qt,Zt,Ct[vt].data);for(let Yt=0;Yt<Nt.length;Yt++){const ve=Nt[Yt].image[vt].image;K?ht&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,Yt+1,0,0,ve.width,ve.height,qt,Zt,ve.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,Yt+1,ee,ve.width,ve.height,0,qt,Zt,ve.data)}}else{K?ht&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,0,0,0,qt,Zt,Ct[vt]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,0,ee,qt,Zt,Ct[vt]);for(let Yt=0;Yt<Nt.length;Yt++){const kt=Nt[Yt];K?ht&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,Yt+1,0,0,qt,Zt,kt.image[vt]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,Yt+1,ee,qt,Zt,kt.image[vt])}}}m(w)&&v(e.TEXTURE_CUBE_MAP),Mt.__version=ot.version,w.onUpdate&&w.onUpdate(w)}I.__version=w.version}function mt(I,w,$,tt,ot,Mt){const yt=a.convert($.format,$.colorSpace),rt=a.convert($.type),ut=g($.internalFormat,yt,rt,$.normalized,$.colorSpace),Et=i.get(w),$t=i.get($);if($t.__renderTarget=w,!Et.__hasExternalTextures){const Ct=Math.max(1,w.width>>Mt),Tt=Math.max(1,w.height>>Mt);ot===e.TEXTURE_3D||ot===e.TEXTURE_2D_ARRAY?n.texImage3D(ot,Mt,ut,Ct,Tt,w.depth,0,yt,rt,null):n.texImage2D(ot,Mt,ut,Ct,Tt,0,yt,rt,null)}n.bindFramebuffer(e.FRAMEBUFFER,I),wt(w)?r.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,tt,ot,$t.__webglTexture,0,ft(w)):(ot===e.TEXTURE_2D||ot>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&ot<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,tt,ot,$t.__webglTexture,Mt),n.bindFramebuffer(e.FRAMEBUFFER,null)}function Gt(I,w,$){if(e.bindRenderbuffer(e.RENDERBUFFER,I),w.depthBuffer){const tt=w.depthTexture,ot=tt&&tt.isDepthTexture?tt.type:null,Mt=b(w.stencilBuffer,ot),yt=w.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;wt(w)?r.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,ft(w),Mt,w.width,w.height):$?e.renderbufferStorageMultisample(e.RENDERBUFFER,ft(w),Mt,w.width,w.height):e.renderbufferStorage(e.RENDERBUFFER,Mt,w.width,w.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,yt,e.RENDERBUFFER,I)}else{const tt=w.textures;for(let ot=0;ot<tt.length;ot++){const Mt=tt[ot],yt=a.convert(Mt.format,Mt.colorSpace),rt=a.convert(Mt.type),ut=g(Mt.internalFormat,yt,rt,Mt.normalized,Mt.colorSpace);wt(w)?r.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,ft(w),ut,w.width,w.height):$?e.renderbufferStorageMultisample(e.RENDERBUFFER,ft(w),ut,w.width,w.height):e.renderbufferStorage(e.RENDERBUFFER,ut,w.width,w.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Qt(I,w,$){const tt=w.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,I),!(w.depthTexture&&w.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const ot=i.get(w.depthTexture);if(ot.__renderTarget=w,(!ot.__webglTexture||w.depthTexture.image.width!==w.width||w.depthTexture.image.height!==w.height)&&(w.depthTexture.image.width=w.width,w.depthTexture.image.height=w.height,w.depthTexture.needsUpdate=!0),tt){if(ot.__webglInit===void 0&&(ot.__webglInit=!0,w.depthTexture.addEventListener("dispose",E)),ot.__webglTexture===void 0){ot.__webglTexture=e.createTexture(),n.bindTexture(e.TEXTURE_CUBE_MAP,ot.__webglTexture),j(e.TEXTURE_CUBE_MAP,w.depthTexture);const Et=a.convert(w.depthTexture.format),$t=a.convert(w.depthTexture.type);let Ct;w.depthTexture.format===Ni?Ct=e.DEPTH_COMPONENT24:w.depthTexture.format===Ms&&(Ct=e.DEPTH24_STENCIL8);for(let Tt=0;Tt<6;Tt++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+Tt,0,Ct,w.width,w.height,0,Et,$t,null)}}else B(w.depthTexture,0);const Mt=ot.__webglTexture,yt=ft(w),rt=tt?e.TEXTURE_CUBE_MAP_POSITIVE_X+$:e.TEXTURE_2D,ut=w.depthTexture.format===Ms?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(w.depthTexture.format===Ni)wt(w)?r.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,ut,rt,Mt,0,yt):e.framebufferTexture2D(e.FRAMEBUFFER,ut,rt,Mt,0);else if(w.depthTexture.format===Ms)wt(w)?r.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,ut,rt,Mt,0,yt):e.framebufferTexture2D(e.FRAMEBUFFER,ut,rt,Mt,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function ct(I){const w=i.get(I),$=I.isWebGLCubeRenderTarget===!0;if(w.__boundDepthTexture!==I.depthTexture){const tt=I.depthTexture;if(w.__depthDisposeCallback&&w.__depthDisposeCallback(),tt){const ot=()=>{delete w.__boundDepthTexture,delete w.__depthDisposeCallback,tt.removeEventListener("dispose",ot)};tt.addEventListener("dispose",ot),w.__depthDisposeCallback=ot}w.__boundDepthTexture=tt}if(I.depthTexture&&!w.__autoAllocateDepthBuffer)if($)for(let tt=0;tt<6;tt++)Qt(w.__webglFramebuffer[tt],I,tt);else{const tt=I.texture.mipmaps;tt&&tt.length>0?Qt(w.__webglFramebuffer[0],I,0):Qt(w.__webglFramebuffer,I,0)}else if($){w.__webglDepthbuffer=[];for(let tt=0;tt<6;tt++)if(n.bindFramebuffer(e.FRAMEBUFFER,w.__webglFramebuffer[tt]),w.__webglDepthbuffer[tt]===void 0)w.__webglDepthbuffer[tt]=e.createRenderbuffer(),Gt(w.__webglDepthbuffer[tt],I,!1);else{const ot=I.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,Mt=w.__webglDepthbuffer[tt];e.bindRenderbuffer(e.RENDERBUFFER,Mt),e.framebufferRenderbuffer(e.FRAMEBUFFER,ot,e.RENDERBUFFER,Mt)}}else{const tt=I.texture.mipmaps;if(tt&&tt.length>0?n.bindFramebuffer(e.FRAMEBUFFER,w.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,w.__webglFramebuffer),w.__webglDepthbuffer===void 0)w.__webglDepthbuffer=e.createRenderbuffer(),Gt(w.__webglDepthbuffer,I,!1);else{const ot=I.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,Mt=w.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,Mt),e.framebufferRenderbuffer(e.FRAMEBUFFER,ot,e.RENDERBUFFER,Mt)}}n.bindFramebuffer(e.FRAMEBUFFER,null)}function xt(I,w,$){const tt=i.get(I);w!==void 0&&mt(tt.__webglFramebuffer,I,I.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),$!==void 0&&ct(I)}function q(I){const w=I.texture,$=i.get(I),tt=i.get(w);I.addEventListener("dispose",M);const ot=I.textures,Mt=I.isWebGLCubeRenderTarget===!0,yt=ot.length>1;if(yt||(tt.__webglTexture===void 0&&(tt.__webglTexture=e.createTexture()),tt.__version=w.version,o.memory.textures++),Mt){$.__webglFramebuffer=[];for(let rt=0;rt<6;rt++)if(w.mipmaps&&w.mipmaps.length>0){$.__webglFramebuffer[rt]=[];for(let ut=0;ut<w.mipmaps.length;ut++)$.__webglFramebuffer[rt][ut]=e.createFramebuffer()}else $.__webglFramebuffer[rt]=e.createFramebuffer()}else{if(w.mipmaps&&w.mipmaps.length>0){$.__webglFramebuffer=[];for(let rt=0;rt<w.mipmaps.length;rt++)$.__webglFramebuffer[rt]=e.createFramebuffer()}else $.__webglFramebuffer=e.createFramebuffer();if(yt)for(let rt=0,ut=ot.length;rt<ut;rt++){const Et=i.get(ot[rt]);Et.__webglTexture===void 0&&(Et.__webglTexture=e.createTexture(),o.memory.textures++)}if(I.samples>0&&wt(I)===!1){$.__webglMultisampledFramebuffer=e.createFramebuffer(),$.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,$.__webglMultisampledFramebuffer);for(let rt=0;rt<ot.length;rt++){const ut=ot[rt];$.__webglColorRenderbuffer[rt]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,$.__webglColorRenderbuffer[rt]);const Et=a.convert(ut.format,ut.colorSpace),$t=a.convert(ut.type),Ct=g(ut.internalFormat,Et,$t,ut.normalized,ut.colorSpace,I.isXRRenderTarget===!0),Tt=ft(I);e.renderbufferStorageMultisample(e.RENDERBUFFER,Tt,Ct,I.width,I.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+rt,e.RENDERBUFFER,$.__webglColorRenderbuffer[rt])}e.bindRenderbuffer(e.RENDERBUFFER,null),I.depthBuffer&&($.__webglDepthRenderbuffer=e.createRenderbuffer(),Gt($.__webglDepthRenderbuffer,I,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(Mt){n.bindTexture(e.TEXTURE_CUBE_MAP,tt.__webglTexture),j(e.TEXTURE_CUBE_MAP,w);for(let rt=0;rt<6;rt++)if(w.mipmaps&&w.mipmaps.length>0)for(let ut=0;ut<w.mipmaps.length;ut++)mt($.__webglFramebuffer[rt][ut],I,w,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+rt,ut);else mt($.__webglFramebuffer[rt],I,w,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+rt,0);m(w)&&v(e.TEXTURE_CUBE_MAP),n.unbindTexture()}else if(yt){for(let rt=0,ut=ot.length;rt<ut;rt++){const Et=ot[rt],$t=i.get(Et);let Ct=e.TEXTURE_2D;(I.isWebGL3DRenderTarget||I.isWebGLArrayRenderTarget)&&(Ct=I.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(Ct,$t.__webglTexture),j(Ct,Et),mt($.__webglFramebuffer,I,Et,e.COLOR_ATTACHMENT0+rt,Ct,0),m(Et)&&v(Ct)}n.unbindTexture()}else{let rt=e.TEXTURE_2D;if((I.isWebGL3DRenderTarget||I.isWebGLArrayRenderTarget)&&(rt=I.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(rt,tt.__webglTexture),j(rt,w),w.mipmaps&&w.mipmaps.length>0)for(let ut=0;ut<w.mipmaps.length;ut++)mt($.__webglFramebuffer[ut],I,w,e.COLOR_ATTACHMENT0,rt,ut);else mt($.__webglFramebuffer,I,w,e.COLOR_ATTACHMENT0,rt,0);m(w)&&v(rt),n.unbindTexture()}I.depthBuffer&&ct(I)}function et(I){const w=I.textures;for(let $=0,tt=w.length;$<tt;$++){const ot=w[$];if(m(ot)){const Mt=y(I),yt=i.get(ot).__webglTexture;n.bindTexture(Mt,yt),v(Mt),n.unbindTexture()}}}const X=[],lt=[];function gt(I){if(I.samples>0){if(wt(I)===!1){const w=I.textures,$=I.width,tt=I.height;let ot=e.COLOR_BUFFER_BIT;const Mt=I.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,yt=i.get(I),rt=w.length>1;if(rt)for(let Et=0;Et<w.length;Et++)n.bindFramebuffer(e.FRAMEBUFFER,yt.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+Et,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,yt.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+Et,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,yt.__webglMultisampledFramebuffer);const ut=I.texture.mipmaps;ut&&ut.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,yt.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,yt.__webglFramebuffer);for(let Et=0;Et<w.length;Et++){if(I.resolveDepthBuffer&&(I.depthBuffer&&(ot|=e.DEPTH_BUFFER_BIT),I.stencilBuffer&&I.resolveStencilBuffer&&(ot|=e.STENCIL_BUFFER_BIT)),rt){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,yt.__webglColorRenderbuffer[Et]);const $t=i.get(w[Et]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,$t,0)}e.blitFramebuffer(0,0,$,tt,0,0,$,tt,ot,e.NEAREST),c===!0&&(X.length=0,lt.length=0,X.push(e.COLOR_ATTACHMENT0+Et),I.depthBuffer&&I.storeMultisampledDepthBuffer===!1&&(X.push(Mt),lt.push(Mt),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,lt)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,X))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),rt)for(let Et=0;Et<w.length;Et++){n.bindFramebuffer(e.FRAMEBUFFER,yt.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+Et,e.RENDERBUFFER,yt.__webglColorRenderbuffer[Et]);const $t=i.get(w[Et]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,yt.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+Et,e.TEXTURE_2D,$t,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,yt.__webglMultisampledFramebuffer)}else if(I.depthBuffer&&I.storeMultisampledDepthBuffer===!1&&c){const w=I.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[w])}}}function ft(I){return Math.min(s.maxSamples,I.samples)}function wt(I){const w=i.get(I);return I.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&w.__useRenderToTexture!==!1}function G(I){const w=o.render.frame;d.get(I)!==w&&(d.set(I,w),I.update())}function Rt(I,w){const $=I.colorSpace,tt=I.format,ot=I.type;return I.isCompressedTexture===!0||I.isVideoTexture===!0||$!==Vc&&$!==ts&&(oe.getTransfer($)===pe?(tt!==$n||ot!==yn)&&Kt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):ce("WebGLTextures: Unsupported texture color space:",$)),w}function Dt(I){return typeof HTMLImageElement<"u"&&I instanceof HTMLImageElement?(l.width=I.naturalWidth||I.width,l.height=I.naturalHeight||I.height):typeof VideoFrame<"u"&&I instanceof VideoFrame?(l.width=I.displayWidth,l.height=I.displayHeight):(l.width=I.width,l.height=I.height),l}this.allocateTextureUnit=W,this.resetTextureUnits=O,this.getTextureUnits=C,this.setTextureUnits=F,this.setTexture2D=B,this.setTexture2DArray=P,this.setTexture3D=H,this.setTextureCube=k,this.rebindTextures=xt,this.setupRenderTarget=q,this.updateRenderTargetMipmap=et,this.updateMultisampleRenderTarget=gt,this.setupDepthRenderbuffer=ct,this.setupFrameBufferTexture=mt,this.useMultisampledRTT=wt,this.isReversedDepthBuffer=function(){return n.buffers.depth.getReversed()}}function Bb(e,t){function n(i,s=ts){let a;const o=oe.getTransfer(s);if(i===yn)return e.UNSIGNED_BYTE;if(i===vu)return e.UNSIGNED_SHORT_4_4_4_4;if(i===Mu)return e.UNSIGNED_SHORT_5_5_5_1;if(i===gm)return e.UNSIGNED_INT_5_9_9_9_REV;if(i===_m)return e.UNSIGNED_INT_10F_11F_11F_REV;if(i===mm)return e.BYTE;if(i===xm)return e.SHORT;if(i===Yo)return e.UNSIGNED_SHORT;if(i===_u)return e.INT;if(i===li)return e.UNSIGNED_INT;if(i===si)return e.FLOAT;if(i===di)return e.HALF_FLOAT;if(i===vm)return e.ALPHA;if(i===Mm)return e.RGB;if(i===$n)return e.RGBA;if(i===Ni)return e.DEPTH_COMPONENT;if(i===Ms)return e.DEPTH_STENCIL;if(i===ym)return e.RED;if(i===yu)return e.RED_INTEGER;if(i===Is)return e.RG;if(i===bu)return e.RG_INTEGER;if(i===Su)return e.RGBA_INTEGER;if(i===Ec||i===Tc||i===Ac||i===zc)if(o===pe)if(a=t.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(i===Ec)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Tc)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Ac)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===zc)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=t.get("WEBGL_compressed_texture_s3tc"),a!==null){if(i===Ec)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Tc)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Ac)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===zc)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===nf||i===sf||i===af||i===of)if(a=t.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(i===nf)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===sf)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===af)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===of)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===rf||i===cf||i===lf||i===df||i===ff||i===Bc||i===uf)if(a=t.get("WEBGL_compressed_texture_etc"),a!==null){if(i===rf||i===cf)return o===pe?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(i===lf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC;if(i===df)return a.COMPRESSED_R11_EAC;if(i===ff)return a.COMPRESSED_SIGNED_R11_EAC;if(i===Bc)return a.COMPRESSED_RG11_EAC;if(i===uf)return a.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===hf||i===pf||i===mf||i===xf||i===gf||i===_f||i===vf||i===Mf||i===yf||i===bf||i===Sf||i===wf||i===Ef||i===Tf)if(a=t.get("WEBGL_compressed_texture_astc"),a!==null){if(i===hf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===pf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===mf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===xf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===gf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===_f)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===vf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Mf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===yf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===bf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Sf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===wf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Ef)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Tf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Af||i===zf||i===Rf)if(a=t.get("EXT_texture_compression_bptc"),a!==null){if(i===Af)return o===pe?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===zf)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Rf)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Cf||i===Pf||i===Gc||i===Lf)if(a=t.get("EXT_texture_compression_rgtc"),a!==null){if(i===Cf)return a.COMPRESSED_RED_RGTC1_EXT;if(i===Pf)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Gc)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Lf)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Zo?e.UNSIGNED_INT_24_8:e[i]!==void 0?e[i]:null}return{convert:n}}const Gb=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Hb=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Vb{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,n){if(this.texture===null){const i=new Cm(t.texture);(t.depthNear!==n.depthNear||t.depthFar!==n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=i}}getMesh(t){if(this.texture!==null&&this.mesh===null){const n=t.cameras[0].viewport,i=new fi({vertexShader:Gb,fragmentShader:Hb,uniforms:{depthColor:{value:this.texture},depthWidth:{value:n.z},depthHeight:{value:n.w}}});this.mesh=new Se(new bl(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Wb extends Xs{constructor(t,n){super();const i=this;let s=null,a=1,o=null,r="local-floor",c=1,l=null,d=null,f=null,u=null,h=null,p=null;const _=typeof XRWebGLBinding<"u",x=new Vb,m={},v=n.getContextAttributes();let y=null,g=null;const b=[],S=[],E=new St;let M=null,T=null;const z=new Pn;z.viewport=new Ee;const R=new Pn;R.viewport=new Ee;const D=[z,R],O=new J_;let C=null,F=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(J){let Q=b[J];return Q===void 0&&(Q=new Jl,b[J]=Q),Q.getTargetRaySpace()},this.getControllerGrip=function(J){let Q=b[J];return Q===void 0&&(Q=new Jl,b[J]=Q),Q.getGripSpace()},this.getHand=function(J){let Q=b[J];return Q===void 0&&(Q=new Jl,b[J]=Q),Q.getHandSpace()};function W(J){const Q=S.indexOf(J.inputSource);if(Q===-1)return;const dt=b[Q];dt!==void 0&&(dt.update(J.inputSource,J.frame,l||o),dt.dispatchEvent({type:J.type,data:J.inputSource}))}function U(){s.removeEventListener("select",W),s.removeEventListener("selectstart",W),s.removeEventListener("selectend",W),s.removeEventListener("squeeze",W),s.removeEventListener("squeezestart",W),s.removeEventListener("squeezeend",W),s.removeEventListener("end",U),s.removeEventListener("inputsourceschange",B);for(let J=0;J<b.length;J++){const Q=S[J];Q!==null&&(S[J]=null,b[J].disconnect(Q))}C=null,F=null,x.reset();for(const J in m)delete m[J];if(t.setRenderTarget(y),h=null,u=null,f=null,s=null,g=null,pt.stop(),i.isPresenting=!1,t.setPixelRatio(M),t.setSize(E.width,E.height,!1),T!==null){const J=T.camera;J.fov=T.fov,J.zoom=T.zoom,J.updateProjectionMatrix(),T=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(J){a=J,i.isPresenting===!0&&Kt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(J){r=J,i.isPresenting===!0&&Kt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(J){l=J},this.getBaseLayer=function(){return u!==null?u:h},this.getBinding=function(){return f===null&&_&&(f=new XRWebGLBinding(s,n)),f},this.getFrame=function(){return p},this.getSession=function(){return s},this.setSession=async function(J){if(s=J,s!==null){if(y=t.getRenderTarget(),s.addEventListener("select",W),s.addEventListener("selectstart",W),s.addEventListener("selectend",W),s.addEventListener("squeeze",W),s.addEventListener("squeezestart",W),s.addEventListener("squeezeend",W),s.addEventListener("end",U),s.addEventListener("inputsourceschange",B),v.xrCompatible!==!0&&await n.makeXRCompatible(),M=t.getPixelRatio(),t.getSize(E),_&&"createProjectionLayer"in XRWebGLBinding.prototype){let dt=null,Ot=null,mt=null;v.depth&&(mt=v.stencil?n.DEPTH24_STENCIL8:n.DEPTH_COMPONENT24,dt=v.stencil?Ms:Ni,Ot=v.stencil?Zo:li);const Gt={colorFormat:n.RGBA8,depthFormat:mt,scaleFactor:a};f=this.getBinding(),u=f.createProjectionLayer(Gt),s.updateRenderState({layers:[u]}),t.setPixelRatio(1),t.setSize(u.textureWidth,u.textureHeight,!1),g=new qn(u.textureWidth,u.textureHeight,{format:$n,type:yn,depthTexture:new Jo(u.textureWidth,u.textureHeight,Ot,void 0,void 0,void 0,void 0,void 0,void 0,dt),stencilBuffer:v.stencil,colorSpace:t.outputColorSpace,samples:v.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}else{const dt={antialias:v.antialias,alpha:!0,depth:v.depth,stencil:v.stencil,framebufferScaleFactor:a};h=new XRWebGLLayer(s,n,dt),s.updateRenderState({baseLayer:h}),t.setPixelRatio(1),t.setSize(h.framebufferWidth,h.framebufferHeight,!1),g=new qn(h.framebufferWidth,h.framebufferHeight,{format:$n,type:yn,colorSpace:t.outputColorSpace,stencilBuffer:v.stencil,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1,storeMultisampledDepthBuffer:h.ignoreDepthValues===!1,storeMultisampledStencilBuffer:h.ignoreDepthValues===!1})}g.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await s.requestReferenceSpace(r),pt.setContext(s),pt.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function B(J){for(let Q=0;Q<J.removed.length;Q++){const dt=J.removed[Q],Ot=S.indexOf(dt);Ot>=0&&(S[Ot]=null,b[Ot].disconnect(dt))}for(let Q=0;Q<J.added.length;Q++){const dt=J.added[Q];let Ot=S.indexOf(dt);if(Ot===-1){for(let Gt=0;Gt<b.length;Gt++)if(Gt>=S.length){S.push(dt),Ot=Gt;break}else if(S[Gt]===null){S[Gt]=dt,Ot=Gt;break}if(Ot===-1)break}const mt=b[Ot];mt&&mt.connect(dt)}}const P=new Z,H=new Z;function k(J,Q,dt){P.setFromMatrixPosition(Q.matrixWorld),H.setFromMatrixPosition(dt.matrixWorld);const Ot=P.distanceTo(H),mt=Q.projectionMatrix.elements,Gt=dt.projectionMatrix.elements,Qt=mt[14]/(mt[10]-1),ct=mt[14]/(mt[10]+1),xt=(mt[9]+1)/mt[5],q=(mt[9]-1)/mt[5],et=(mt[8]-1)/mt[0],X=(Gt[8]+1)/Gt[0],lt=Qt*et,gt=Qt*X,ft=Ot/(-et+X),wt=ft*-et;if(Q.matrixWorld.decompose(J.position,J.quaternion,J.scale),J.translateX(wt),J.translateZ(ft),J.matrixWorld.compose(J.position,J.quaternion,J.scale),J.matrixWorldInverse.copy(J.matrixWorld).invert(),mt[10]===-1)J.projectionMatrix.copy(Q.projectionMatrix),J.projectionMatrixInverse.copy(Q.projectionMatrixInverse);else{const G=Qt+ft,Rt=ct+ft,Dt=lt-wt,I=gt+(Ot-wt),w=xt*ct/Rt*G,$=q*ct/Rt*G;J.projectionMatrix.makePerspective(Dt,I,w,$,G,Rt),J.projectionMatrixInverse.copy(J.projectionMatrix).invert()}}function L(J,Q){Q===null?J.matrixWorld.copy(J.matrix):J.matrixWorld.multiplyMatrices(Q.matrixWorld,J.matrix),J.matrixWorldInverse.copy(J.matrixWorld).invert()}this.updateCamera=function(J){if(s===null)return;let Q=J.near,dt=J.far;x.texture!==null&&(x.depthNear>0&&(Q=x.depthNear),x.depthFar>0&&(dt=x.depthFar)),O.near=R.near=z.near=Q,O.far=R.far=z.far=dt,(C!==O.near||F!==O.far)&&(s.updateRenderState({depthNear:O.near,depthFar:O.far}),C=O.near,F=O.far),O.layers.mask=J.layers.mask|6,z.layers.mask=O.layers.mask&-5,R.layers.mask=O.layers.mask&-3;const Ot=J.parent,mt=O.cameras;L(O,Ot);for(let Gt=0;Gt<mt.length;Gt++)L(mt[Gt],Ot);mt.length===2?k(O,z,R):O.projectionMatrix.copy(z.projectionMatrix),T===null&&J.isPerspectiveCamera&&(T={camera:J,fov:J.fov,zoom:J.zoom}),V(J,O,Ot)};function V(J,Q,dt){dt===null?J.matrix.copy(Q.matrixWorld):(J.matrix.copy(dt.matrixWorld),J.matrix.invert(),J.matrix.multiply(Q.matrixWorld)),J.matrix.decompose(J.position,J.quaternion,J.scale),J.updateMatrixWorld(!0),J.projectionMatrix.copy(Q.projectionMatrix),J.projectionMatrixInverse.copy(Q.projectionMatrixInverse),J.isPerspectiveCamera&&(J.fov=If*2*Math.atan(1/J.projectionMatrix.elements[5]),J.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(!(u===null&&h===null))return c},this.setFoveation=function(J){c=J,u!==null&&(u.fixedFoveation=J),h!==null&&h.fixedFoveation!==void 0&&(h.fixedFoveation=J)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(O)},this.getCameraTexture=function(J){return m[J]};let at=null;function j(J,Q){if(d=Q.getViewerPose(l||o),p=Q,d!==null){const dt=d.views;h!==null&&(t.setRenderTargetFramebuffer(g,h.framebuffer),t.setRenderTarget(g));let Ot=!1;dt.length!==O.cameras.length&&(O.cameras.length=0,Ot=!0);for(let ct=0;ct<dt.length;ct++){const xt=dt[ct];let q=null;if(h!==null)q=h.getViewport(xt);else{const X=f.getViewSubImage(u,xt);q=X.viewport,ct===0&&(t.setRenderTargetTextures(g,X.colorTexture,X.depthStencilTexture),t.setRenderTarget(g))}let et=D[ct];et===void 0&&(et=new Pn,et.layers.enable(ct),et.viewport=new Ee,D[ct]=et),et.matrix.fromArray(xt.transform.matrix),et.matrix.decompose(et.position,et.quaternion,et.scale),et.projectionMatrix.fromArray(xt.projectionMatrix),et.projectionMatrixInverse.copy(et.projectionMatrix).invert(),et.viewport.set(q.x,q.y,q.width,q.height),ct===0&&(O.matrix.copy(et.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),Ot===!0&&O.cameras.push(et)}const mt=s.enabledFeatures;if(mt&&mt.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&_){f=i.getBinding();const ct=f.getDepthInformation(dt[0]);ct&&ct.isValid&&ct.texture&&x.init(ct,s.renderState)}if(mt&&mt.includes("camera-access")&&_){t.state.unbindTexture(),f=i.getBinding();for(let ct=0;ct<dt.length;ct++){const xt=dt[ct].camera;if(xt){let q=m[xt];q||(q=new Cm,m[xt]=q);const et=f.getCameraImage(xt);q.sourceTexture=et}}}}for(let dt=0;dt<b.length;dt++){const Ot=S[dt],mt=b[dt];Ot!==null&&mt!==void 0&&mt.update(Ot,Q,l||o)}at&&at(J,Q),Q.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:Q}),p=null}const pt=new $m;pt.setAnimationLoop(j),this.setAnimationLoop=function(J){at=J},this.dispose=function(){}}}const kb=new be,jm=new jt;jm.set(-1,0,0,0,1,0,0,0,1);function Xb(e,t){function n(x,m){x.matrixAutoUpdate===!0&&x.updateMatrix(),m.value.copy(x.matrix)}function i(x,m){m.color.getRGB(x.fogColor.value,Hm(e)),m.isFog?(x.fogNear.value=m.near,x.fogFar.value=m.far):m.isFogExp2&&(x.fogDensity.value=m.density)}function s(x,m,v,y,g){m.isNodeMaterial?m.uniformsNeedUpdate=!1:m.isMeshBasicMaterial?a(x,m):m.isMeshLambertMaterial?(a(x,m),m.envMap&&(x.envMapIntensity.value=m.envMapIntensity)):m.isMeshToonMaterial?(a(x,m),f(x,m)):m.isMeshPhongMaterial?(a(x,m),d(x,m),m.envMap&&(x.envMapIntensity.value=m.envMapIntensity)):m.isMeshStandardMaterial?(a(x,m),u(x,m),m.isMeshPhysicalMaterial&&h(x,m,g)):m.isMeshMatcapMaterial?(a(x,m),p(x,m)):m.isMeshDepthMaterial?a(x,m):m.isMeshDistanceMaterial?(a(x,m),_(x,m)):m.isMeshNormalMaterial?a(x,m):m.isLineBasicMaterial?(o(x,m),m.isLineDashedMaterial&&r(x,m)):m.isPointsMaterial?c(x,m,v,y):m.isSpriteMaterial?l(x,m):m.isShadowMaterial?(x.color.value.copy(m.color),x.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function a(x,m){x.opacity.value=m.opacity,m.color&&x.diffuse.value.copy(m.color),m.emissive&&x.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(x.map.value=m.map,n(m.map,x.mapTransform)),m.alphaMap&&(x.alphaMap.value=m.alphaMap,n(m.alphaMap,x.alphaMapTransform)),m.bumpMap&&(x.bumpMap.value=m.bumpMap,n(m.bumpMap,x.bumpMapTransform),x.bumpScale.value=m.bumpScale,m.side===dn&&(x.bumpScale.value*=-1)),m.normalMap&&(x.normalMap.value=m.normalMap,n(m.normalMap,x.normalMapTransform),x.normalScale.value.copy(m.normalScale),m.side===dn&&x.normalScale.value.negate()),m.displacementMap&&(x.displacementMap.value=m.displacementMap,n(m.displacementMap,x.displacementMapTransform),x.displacementScale.value=m.displacementScale,x.displacementBias.value=m.displacementBias),m.emissiveMap&&(x.emissiveMap.value=m.emissiveMap,n(m.emissiveMap,x.emissiveMapTransform)),m.specularMap&&(x.specularMap.value=m.specularMap,n(m.specularMap,x.specularMapTransform)),m.alphaTest>0&&(x.alphaTest.value=m.alphaTest);const v=t.get(m),y=v.envMap,g=v.envMapRotation;y&&(x.envMap.value=y,x.envMapRotation.value.setFromMatrix4(kb.makeRotationFromEuler(g)).transpose(),y.isCubeTexture&&y.isRenderTargetTexture===!1&&x.envMapRotation.value.premultiply(jm),x.reflectivity.value=m.reflectivity,x.ior.value=m.ior,x.refractionRatio.value=m.refractionRatio),m.lightMap&&(x.lightMap.value=m.lightMap,x.lightMapIntensity.value=m.lightMapIntensity,n(m.lightMap,x.lightMapTransform)),m.aoMap&&(x.aoMap.value=m.aoMap,x.aoMapIntensity.value=m.aoMapIntensity,n(m.aoMap,x.aoMapTransform))}function o(x,m){x.diffuse.value.copy(m.color),x.opacity.value=m.opacity,m.map&&(x.map.value=m.map,n(m.map,x.mapTransform))}function r(x,m){x.dashSize.value=m.dashSize,x.totalSize.value=m.dashSize+m.gapSize,x.scale.value=m.scale}function c(x,m,v,y){x.diffuse.value.copy(m.color),x.opacity.value=m.opacity,x.size.value=m.size*v,x.scale.value=y*.5,m.map&&(x.map.value=m.map,n(m.map,x.uvTransform)),m.alphaMap&&(x.alphaMap.value=m.alphaMap,n(m.alphaMap,x.alphaMapTransform)),m.alphaTest>0&&(x.alphaTest.value=m.alphaTest)}function l(x,m){x.diffuse.value.copy(m.color),x.opacity.value=m.opacity,x.rotation.value=m.rotation,m.map&&(x.map.value=m.map,n(m.map,x.mapTransform)),m.alphaMap&&(x.alphaMap.value=m.alphaMap,n(m.alphaMap,x.alphaMapTransform)),m.alphaTest>0&&(x.alphaTest.value=m.alphaTest)}function d(x,m){x.specular.value.copy(m.specular),x.shininess.value=Math.max(m.shininess,1e-4)}function f(x,m){m.gradientMap&&(x.gradientMap.value=m.gradientMap)}function u(x,m){x.metalness.value=m.metalness,m.metalnessMap&&(x.metalnessMap.value=m.metalnessMap,n(m.metalnessMap,x.metalnessMapTransform)),x.roughness.value=m.roughness,m.roughnessMap&&(x.roughnessMap.value=m.roughnessMap,n(m.roughnessMap,x.roughnessMapTransform)),m.envMap&&(x.envMapIntensity.value=m.envMapIntensity)}function h(x,m,v){x.ior.value=m.ior,m.sheen>0&&(x.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),x.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(x.sheenColorMap.value=m.sheenColorMap,n(m.sheenColorMap,x.sheenColorMapTransform)),m.sheenRoughnessMap&&(x.sheenRoughnessMap.value=m.sheenRoughnessMap,n(m.sheenRoughnessMap,x.sheenRoughnessMapTransform))),m.clearcoat>0&&(x.clearcoat.value=m.clearcoat,x.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(x.clearcoatMap.value=m.clearcoatMap,n(m.clearcoatMap,x.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(x.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,n(m.clearcoatRoughnessMap,x.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(x.clearcoatNormalMap.value=m.clearcoatNormalMap,n(m.clearcoatNormalMap,x.clearcoatNormalMapTransform),x.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===dn&&x.clearcoatNormalScale.value.negate())),m.dispersion>0&&(x.dispersion.value=m.dispersion),m.retroreflectivity>0&&(x.retroreflectivity.value=m.retroreflectivity),m.iridescence>0&&(x.iridescence.value=m.iridescence,x.iridescenceIOR.value=m.iridescenceIOR,x.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],x.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(x.iridescenceMap.value=m.iridescenceMap,n(m.iridescenceMap,x.iridescenceMapTransform)),m.iridescenceThicknessMap&&(x.iridescenceThicknessMap.value=m.iridescenceThicknessMap,n(m.iridescenceThicknessMap,x.iridescenceThicknessMapTransform))),m.transmission>0&&(x.transmission.value=m.transmission,x.transmissionSamplerMap.value=v.texture,x.transmissionSamplerSize.value.set(v.width,v.height),m.transmissionMap&&(x.transmissionMap.value=m.transmissionMap,n(m.transmissionMap,x.transmissionMapTransform)),x.thickness.value=m.thickness,m.thicknessMap&&(x.thicknessMap.value=m.thicknessMap,n(m.thicknessMap,x.thicknessMapTransform)),x.attenuationDistance.value=m.attenuationDistance,x.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(x.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(x.anisotropyMap.value=m.anisotropyMap,n(m.anisotropyMap,x.anisotropyMapTransform))),x.specularIntensity.value=m.specularIntensity,x.specularColor.value.copy(m.specularColor),m.specularColorMap&&(x.specularColorMap.value=m.specularColorMap,n(m.specularColorMap,x.specularColorMapTransform)),m.specularIntensityMap&&(x.specularIntensityMap.value=m.specularIntensityMap,n(m.specularIntensityMap,x.specularIntensityMapTransform))}function p(x,m){m.matcap&&(x.matcap.value=m.matcap)}function _(x,m){const v=t.get(m).light;x.referencePosition.value.setFromMatrixPosition(v.matrixWorld),x.nearDistance.value=v.shadow.camera.near,x.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function $b(e,t,n,i){let s={},a={},o=[];const r=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function c(g,b){const S=b.program;i.uniformBlockBinding(g,S)}function l(g,b){let S=s[g.id];S===void 0&&(x(g),S=d(g),s[g.id]=S,g.addEventListener("dispose",v));const E=b.program;i.updateUBOMapping(g,E);const M=t.render.frame;a[g.id]!==M&&(u(g),a[g.id]=M)}function d(g){const b=f();g.__bindingPointIndex=b;const S=e.createBuffer(),E=g.__size,M=g.usage;return e.bindBuffer(e.UNIFORM_BUFFER,S),e.bufferData(e.UNIFORM_BUFFER,E,M),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,b,S),S}function f(){for(let g=0;g<r;g++)if(o.indexOf(g)===-1)return o.push(g),g;return ce("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(g){const b=s[g.id],S=g.uniforms,E=g.__cache;e.bindBuffer(e.UNIFORM_BUFFER,b);for(let M=0,T=S.length;M<T;M++){const z=S[M];if(Array.isArray(z))for(let R=0,D=z.length;R<D;R++)h(z[R],M,R,E);else h(z,M,0,E)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function h(g,b,S,E){if(_(g,b,S,E)===!0){const M=g.__offset,T=g.value;if(Array.isArray(T)){let z=0;for(let R=0;R<T.length;R++){const D=T[R],O=m(D);p(D,g.__data,z),typeof D!="number"&&typeof D!="boolean"&&!D.isMatrix3&&!ArrayBuffer.isView(D)&&(z+=O.storage/Float32Array.BYTES_PER_ELEMENT)}}else p(T,g.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,M,g.__data)}}function p(g,b,S){typeof g=="number"||typeof g=="boolean"?b[0]=g:g.isMatrix3?(b[0]=g.elements[0],b[1]=g.elements[1],b[2]=g.elements[2],b[3]=0,b[4]=g.elements[3],b[5]=g.elements[4],b[6]=g.elements[5],b[7]=0,b[8]=g.elements[6],b[9]=g.elements[7],b[10]=g.elements[8],b[11]=0):ArrayBuffer.isView(g)?b.set(new g.constructor(g.buffer,g.byteOffset,b.length)):g.toArray(b,S)}function _(g,b,S,E){const M=g.value,T=b+"_"+S;if(E[T]===void 0)return typeof M=="number"||typeof M=="boolean"?E[T]=M:ArrayBuffer.isView(M)?E[T]=M.slice():E[T]=M.clone(),!0;{const z=E[T];if(typeof M=="number"||typeof M=="boolean"){if(z!==M)return E[T]=M,!0}else{if(ArrayBuffer.isView(M))return!0;if(z.equals(M)===!1)return z.copy(M),!0}}return!1}function x(g){const b=g.uniforms;let S=0;const E=16;for(let T=0,z=b.length;T<z;T++){const R=Array.isArray(b[T])?b[T]:[b[T]];for(let D=0,O=R.length;D<O;D++){const C=R[D],F=Array.isArray(C.value)?C.value:[C.value];for(let W=0,U=F.length;W<U;W++){const B=F[W],P=m(B),H=S%E,k=H%P.boundary,L=H+k;S+=k,L!==0&&E-L<P.storage&&(S+=E-L),C.__data=new Float32Array(P.storage/Float32Array.BYTES_PER_ELEMENT),C.__offset=S,S+=P.storage}}}const M=S%E;return M>0&&(S+=E-M),g.__size=S,g.__cache={},this}function m(g){const b={boundary:0,storage:0};return typeof g=="number"||typeof g=="boolean"?(b.boundary=4,b.storage=4):g.isVector2?(b.boundary=8,b.storage=8):g.isVector3||g.isColor?(b.boundary=16,b.storage=12):g.isVector4?(b.boundary=16,b.storage=16):g.isMatrix3?(b.boundary=48,b.storage=48):g.isMatrix4?(b.boundary=64,b.storage=64):g.isTexture?Kt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(g)?(b.boundary=16,b.storage=g.byteLength):Kt("WebGLRenderer: Unsupported uniform value type.",g),b}function v(g){const b=g.target;b.removeEventListener("dispose",v);const S=o.indexOf(b.__bindingPointIndex);o.splice(S,1),e.deleteBuffer(s[b.id]),delete s[b.id],delete a[b.id]}function y(){for(const g in s)e.deleteBuffer(s[g]);o=[],s={},a={}}return{bind:c,update:l,dispose:y}}const qb=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let jn=null;function Yb(){return jn===null&&(jn=new s_(qb,16,16,Is,di),jn.name="DFG_LUT",jn.minFilter=Ve,jn.magFilter=Ve,jn.wrapS=Ei,jn.wrapT=Ei,jn.generateMipmaps=!1,jn.needsUpdate=!0),jn}class Zb{constructor(t={}){const{canvas:n=L1(),context:i=null,depth:s=!0,stencil:a=!1,alpha:o=!1,antialias:r=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:d="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:u=!1,outputBufferType:h=yn}=t;this.isWebGLRenderer=!0;let p;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=i.getContextAttributes().alpha}else p=o;const _=h,x=new Set([Su,bu,yu]),m=new Set([yn,li,Yo,Zo,vu,Mu]),v=new Uint32Array(4),y=new Int32Array(4),g=new Z;let b=null,S=null;const E=[],M=[];let T=null;this.domElement=n,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=ri,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const z=this;let R=!1,D=null,O=null,C=null,F=null;this._outputColorSpace=cn;let W=0,U=0,B=null,P=-1,H=null;const k=new Ee,L=new Ee;let V=null;const at=new te(0);let j=0,pt=n.width,J=n.height,Q=1,dt=null,Ot=null;const mt=new Ee(0,0,pt,J),Gt=new Ee(0,0,pt,J);let Qt=!1;const ct=new zu;let xt=!1,q=!1;const et=new be,X=new Z,lt=new Ee,gt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let ft=!1;function wt(){return B===null?Q:1}let G=i;function Rt(A,Y){return n.getContext(A,Y)}let Dt,I,w,$,tt,ot,Mt,yt,rt,ut,Et,$t,Ct,Tt,qt,Zt,ee,K,At,ht,zt,Nt,vt;try{const A={alpha:!0,depth:s,stencil:a,antialias:r,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:d,failIfMajorPerformanceCaveat:f};if("setAttribute"in n&&n.setAttribute("data-engine",`three.js r${xu}`),n.addEventListener("webglcontextlost",ve,!1),n.addEventListener("webglcontextrestored",de,!1),n.addEventListener("webglcontextcreationerror",Un,!1),G===null){const Y="webgl2";if(G=Rt(Y,A),G===null)throw Rt(Y)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Yt()}catch(A){throw n.removeEventListener("webglcontextlost",ve,!1),n.removeEventListener("webglcontextrestored",de,!1),n.removeEventListener("webglcontextcreationerror",Un,!1),ce("WebGLRenderer: "+A.message),A}function Yt(){Dt=new Yy(G),Dt.init(),zt=new Bb(G,Dt),I=new Fy(G,Dt,t,zt),w=new Ob(G,Dt),I.reversedDepthBuffer&&u&&w.buffers.depth.setReversed(!0),O=G.createFramebuffer(),C=G.createFramebuffer(),F=G.createFramebuffer(),$=new Jy(G),tt=new Sb,ot=new Fb(G,Dt,w,tt,I,zt,$),Mt=new qy(z),yt=new j_(G),Nt=new Uy(G,yt),rt=new Zy(G,yt,$,Nt),ut=new jy(G,rt,yt,Nt,$),K=new Qy(G,I,ot),qt=new By(tt),Et=new bb(z,Mt,Dt,I,Nt,qt),$t=new Xb(z,tt),Ct=new Eb,Tt=new Pb(Dt),ee=new Ny(z,Mt,w,ut,p,c),Zt=new Ub(z,ut,I),vt=new $b(G,$,I,w),At=new Oy(G,Dt,$),ht=new Ky(G,Dt,$),$.programs=Et.programs,z.capabilities=I,z.extensions=Dt,z.properties=tt,z.renderLists=Ct,z.shadowMap=Zt,z.state=w,z.info=$}_!==yn&&(T=new e2(_,n.width,n.height,r,s,a));const kt=new Wb(z,G);this.xr=kt,this.getContext=function(){return G},this.getContextAttributes=function(){return G.getContextAttributes()},this.forceContextLoss=function(){const A=Dt.get("WEBGL_lose_context");A&&A.loseContext()},this.forceContextRestore=function(){const A=Dt.get("WEBGL_lose_context");A&&A.restoreContext()},this.getPixelRatio=function(){return Q},this.setPixelRatio=function(A){A!==void 0&&(Q=A,this.setSize(pt,J,!1))},this.getSize=function(A){return A.set(pt,J)},this.setSize=function(A,Y,st=!0){if(kt.isPresenting){Kt("WebGLRenderer: Can't change size while VR device is presenting.");return}pt=A,J=Y,n.width=Math.floor(A*Q),n.height=Math.floor(Y*Q),st===!0&&(n.style.width=A+"px",n.style.height=Y+"px"),T!==null&&T.setSize(n.width,n.height),this.setViewport(0,0,A,Y)},this.getDrawingBufferSize=function(A){return A.set(pt*Q,J*Q).floor()},this.setDrawingBufferSize=function(A,Y,st){pt=A,J=Y,Q=st,n.width=Math.floor(A*st),n.height=Math.floor(Y*st),this.setViewport(0,0,A,Y)},this.setEffects=function(A){if(_===yn){ce("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(A){for(let Y=0;Y<A.length;Y++)if(A[Y].isOutputPass===!0){Kt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}T.setEffects(A||[])},this.getCurrentViewport=function(A){return A.copy(k)},this.getViewport=function(A){return A.copy(mt)},this.setViewport=function(A,Y,st,nt){A.isVector4?mt.set(A.x,A.y,A.z,A.w):mt.set(A,Y,st,nt),w.viewport(k.copy(mt).multiplyScalar(Q).round())},this.getScissor=function(A){return A.copy(Gt)},this.setScissor=function(A,Y,st,nt){A.isVector4?Gt.set(A.x,A.y,A.z,A.w):Gt.set(A,Y,st,nt),w.scissor(L.copy(Gt).multiplyScalar(Q).round())},this.getScissorTest=function(){return Qt},this.setScissorTest=function(A){w.setScissorTest(Qt=A)},this.setOpaqueSort=function(A){dt=A},this.setTransparentSort=function(A){Ot=A},this.getClearColor=function(A){return A.copy(ee.getClearColor())},this.setClearColor=function(){ee.setClearColor(...arguments)},this.getClearAlpha=function(){return ee.getClearAlpha()},this.setClearAlpha=function(){ee.setClearAlpha(...arguments)},this.clear=function(A=!0,Y=!0,st=!0){let nt=0;if(A){let it=!1;if(B!==null){const It=B.texture.format;it=x.has(It)}if(it){const It=B.texture.type,Ft=m.has(It),Lt=ee.getClearColor(),Ht=ee.getClearAlpha(),Xt=Lt.r,ne=Lt.g,se=Lt.b;Ft?(v[0]=Xt,v[1]=ne,v[2]=se,v[3]=Ht,G.clearBufferuiv(G.COLOR,0,v)):(y[0]=Xt,y[1]=ne,y[2]=se,y[3]=Ht,G.clearBufferiv(G.COLOR,0,y))}else nt|=G.COLOR_BUFFER_BIT}Y&&(nt|=G.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),st&&(nt|=G.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),nt!==0&&G.clear(nt)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(A){A.setRenderer(this),D=A},this.dispose=function(){n.removeEventListener("webglcontextlost",ve,!1),n.removeEventListener("webglcontextrestored",de,!1),n.removeEventListener("webglcontextcreationerror",Un,!1),ee.dispose(),Ct.dispose(),Tt.dispose(),tt.dispose(),Mt.dispose(),ut.dispose(),Nt.dispose(),vt.dispose(),Et.dispose(),kt.dispose(),kt.removeEventListener("sessionstart",p0),kt.removeEventListener("sessionend",m0),rs.stop()};function ve(A){A.preventDefault(),L0("WebGLRenderer: Context Lost."),R=!0}function de(){L0("WebGLRenderer: Context Restored."),R=!1;const A=$.autoReset,Y=Zt.enabled,st=Zt.autoUpdate,nt=Zt.needsUpdate,it=Zt.type;Yt(),$.autoReset=A,Zt.enabled=Y,Zt.autoUpdate=st,Zt.needsUpdate=nt,Zt.type=it}function Un(A){ce("WebGLRenderer: A WebGL context could not be created. Reason: ",A.statusMessage)}function Kn(A){const Y=A.target;Y.removeEventListener("dispose",Kn),Lg(Y)}function Lg(A){Ig(A),tt.remove(A)}function Ig(A){const Y=tt.get(A).programs;Y!==void 0&&(Y.forEach(function(st){Et.releaseProgram(st)}),A.isShaderMaterial&&Et.releaseShaderCache(A))}this.renderBufferDirect=function(A,Y,st,nt,it,It){Y===null&&(Y=gt);const Ft=it.isMesh&&it.matrixWorld.determinantAffine()<0,Lt=Ug(A,Y,st,nt,it);w.setMaterial(nt,Ft);let Ht=st.index,Xt=1;if(nt.wireframe===!0){if(Ht=rt.getWireframeAttribute(st),Ht===void 0)return;Xt=2}const ne=st.drawRange,se=st.attributes.position;let Vt=ne.start*Xt,fe=(ne.start+ne.count)*Xt;It!==null&&(Vt=Math.max(Vt,It.start*Xt),fe=Math.min(fe,(It.start+It.count)*Xt)),Ht!==null?(Vt=Math.max(Vt,0),fe=Math.min(fe,Ht.count)):se!=null&&(Vt=Math.max(Vt,0),fe=Math.min(fe,se.count));const Re=fe-Vt;if(Re<0||Re===1/0)return;Nt.setup(it,nt,Lt,st,Ht);let ye,xe=At;if(Ht!==null&&(ye=yt.get(Ht),xe=ht,xe.setIndex(ye)),it.isMesh)nt.wireframe===!0?(w.setLineWidth(nt.wireframeLinewidth*wt()),xe.setMode(G.LINES)):xe.setMode(G.TRIANGLES);else if(it.isLine){let ke=nt.linewidth;ke===void 0&&(ke=1),w.setLineWidth(ke*wt()),it.isLineSegments?xe.setMode(G.LINES):it.isLineLoop?xe.setMode(G.LINE_LOOP):xe.setMode(G.LINE_STRIP)}else it.isPoints?xe.setMode(G.POINTS):it.isSprite&&xe.setMode(G.TRIANGLES);if(it.isBatchedMesh)if(Dt.get("WEBGL_multi_draw"))xe.renderMultiDraw(it._multiDrawStarts,it._multiDrawCounts,it._multiDrawCount);else{const ke=it._multiDrawStarts,Ut=it._multiDrawCounts,je=it._multiDrawCount,re=Ht?yt.get(Ht).bytesPerElement:1,wn=tt.get(nt).currentProgram.getUniforms();for(let Jn=0;Jn<je;Jn++)wn.setValue(G,"_gl_DrawID",Jn),xe.render(ke[Jn]/re,Ut[Jn])}else if(it.isInstancedMesh)xe.renderInstances(Vt,Re,it.count);else if(st.isInstancedBufferGeometry){const ke=st._maxInstanceCount!==void 0?st._maxInstanceCount:1/0,Ut=Math.min(st.instanceCount,ke);xe.renderInstances(Vt,Re,Ut)}else xe.render(Vt,Re)};function h0(A,Y,st,nt){D!==null&&A.isNodeMaterial&&D.setObject(nt,A),xt===!0&&qt.setState(A,st,!1),A.transparent===!0&&A.side===wi&&A.forceSinglePass===!1?(A.side=dn,A.needsUpdate=!0,Ar(A,Y,nt),A.side=Ps,A.needsUpdate=!0,Ar(A,Y,nt),A.side=wi):Ar(A,Y,nt)}this.compile=function(A,Y,st=null){st===null&&(st=A),D!==null&&D.renderStart(A,Y,st),S=Tt.get(st),S.init(Y),M.push(S),st.traverseVisible(function(it){it.isLight&&it.layers.test(Y.layers)&&(S.pushLight(it),it.castShadow&&S.pushShadow(it))}),A!==st&&A.traverseVisible(function(it){it.isLight&&it.layers.test(Y.layers)&&(S.pushLight(it),it.castShadow&&S.pushShadow(it))}),S.setupLights(),D!==null&&D.updateLights(S.state.lightsArray),q=this.localClippingEnabled,xt=qt.init(this.clippingPlanes,q),xt===!0&&qt.setGlobalState(this.clippingPlanes,Y),D!==null&&Zt.render(S.state.shadowsArray,st,Y);const nt=new Set;return A.traverse(function(it){if(!(it.isMesh||it.isPoints||it.isLine||it.isSprite))return;const It=it.material;if(It)if(Array.isArray(It))for(let Ft=0;Ft<It.length;Ft++){const Lt=It[Ft];h0(Lt,st,Y,it),nt.add(Lt)}else h0(It,st,Y,it),nt.add(It)}),S=M.pop(),D!==null&&D.renderEnd(),nt},this.compileAsync=function(A,Y,st=null){const nt=this.compile(A,Y,st);return new Promise(it=>{function It(){if(nt.forEach(function(Ft){const Ht=tt.get(Ft).currentProgram;(Ht===void 0||Ht.isReady())&&nt.delete(Ft)}),nt.size===0){it(A);return}setTimeout(It,10)}Dt.get("KHR_parallel_shader_compile")!==null?It():setTimeout(It,10)})};let Fl=null;function Dg(A){Fl&&Fl(A)}function p0(){rs.stop()}function m0(){rs.start()}const rs=new $m;rs.setAnimationLoop(Dg),typeof self<"u"&&rs.setContext(self),this.setAnimationLoop=function(A){Fl=A,kt.setAnimationLoop(A),A===null?rs.stop():rs.start()},kt.addEventListener("sessionstart",p0),kt.addEventListener("sessionend",m0),this.render=function(A,Y){if(Y!==void 0&&Y.isCamera!==!0){ce("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(R===!0)return;D!==null&&D.renderStart(A,Y);const st=kt.enabled===!0&&kt.isPresenting===!0,nt=T!==null&&(B===null||st)&&T.begin(z,B);if(A.matrixWorldAutoUpdate===!0&&A.updateMatrixWorld(),Y.parent===null&&Y.matrixWorldAutoUpdate===!0&&Y.updateMatrixWorld(),kt.enabled===!0&&kt.isPresenting===!0&&(T===null||T.isCompositing()===!1)&&(kt.cameraAutoUpdate===!0&&kt.updateCamera(Y),Y=kt.getCamera()),A.isScene===!0&&A.onBeforeRender(z,A,Y,B),S=Tt.get(A,M.length),S.init(Y),S.state.textureUnits=ot.getTextureUnits(),M.push(S),et.multiplyMatrices(Y.projectionMatrix,Y.matrixWorldInverse),ct.setFromProjectionMatrix(et,ai,Y.reversedDepth),q=this.localClippingEnabled,xt=qt.init(this.clippingPlanes,q),b=Ct.get(A,E.length),b.init(),E.push(b),kt.enabled===!0&&kt.isPresenting===!0){const Ft=z.xr.getDepthSensingMesh();Ft!==null&&Bl(Ft,Y,-1/0,z.sortObjects)}Bl(A,Y,0,z.sortObjects),b.finish(),D!==null&&D.updateLights(S.state.lightsArray),z.sortObjects===!0&&b.sort(dt,Ot),ft=kt.enabled===!1||kt.isPresenting===!1||kt.hasDepthSensing()===!1,ft&&ee.addToRenderList(b,A),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),xt===!0&&qt.beginShadows();const it=S.state.shadowsArray;if(Zt.render(it,A,Y),xt===!0&&qt.endShadows(),(nt&&T.hasRenderPass())===!1){const Ft=b.opaque,Lt=b.transmissive;if(S.setupLights(),Y.isArrayCamera){const Ht=Y.cameras;if(Lt.length>0)for(let Xt=0,ne=Ht.length;Xt<ne;Xt++){const se=Ht[Xt];g0(Ft,Lt,A,se)}ft&&ee.render(A);for(let Xt=0,ne=Ht.length;Xt<ne;Xt++){const se=Ht[Xt];x0(b,A,se,se.viewport)}}else Lt.length>0&&g0(Ft,Lt,A,Y),ft&&ee.render(A),x0(b,A,Y)}B!==null&&U===0&&(ot.updateMultisampleRenderTarget(B),ot.updateRenderTargetMipmap(B)),nt&&T.end(z),A.isScene===!0&&A.onAfterRender(z,A,Y),Nt.resetDefaultState(),P=-1,H=null,M.pop(),M.length>0?(S=M[M.length-1],ot.setTextureUnits(S.state.textureUnits),xt===!0&&qt.setGlobalState(z.clippingPlanes,S.state.camera)):S=null,E.pop(),E.length>0?b=E[E.length-1]:b=null,D!==null&&D.renderEnd()};function Bl(A,Y,st,nt){if(A.visible===!1)return;if(A.layers.test(Y.layers)){if(A.isGroup)st=A.renderOrder;else if(A.isLOD)A.autoUpdate===!0&&A.update(Y);else if(A.isLightProbeGrid)S.pushLightProbeGrid(A);else if(A.isLight)S.pushLight(A),A.castShadow&&S.pushShadow(A);else if(A.isSprite){if(!A.frustumCulled||A.intersectsFrustum(ct)){nt&&lt.setFromMatrixPosition(A.matrixWorld).applyMatrix4(et);const Ft=ut.update(A),Lt=A.material;Lt.visible&&b.push(A,Ft,Lt,st,lt.z,null,Y)}}else if((A.isMesh||A.isLine||A.isPoints)&&(!A.frustumCulled||A.intersectsFrustum(ct))){const Ft=ut.update(A),Lt=A.material;if(nt&&(A.boundingSphere!==void 0?(A.boundingSphere===null&&A.computeBoundingSphere(),lt.copy(A.boundingSphere.center)):(Ft.boundingSphere===null&&Ft.computeBoundingSphere(),lt.copy(Ft.boundingSphere.center)),lt.applyMatrix4(A.matrixWorld).applyMatrix4(et)),Array.isArray(Lt)){const Ht=Ft.groups;for(let Xt=0,ne=Ht.length;Xt<ne;Xt++){const se=Ht[Xt],Vt=Lt[se.materialIndex];Vt&&Vt.visible&&b.push(A,Ft,Vt,st,lt.z,se,Y)}}else Lt.visible&&b.push(A,Ft,Lt,st,lt.z,null,Y)}}const It=A.children;for(let Ft=0,Lt=It.length;Ft<Lt;Ft++)Bl(It[Ft],Y,st,nt)}function x0(A,Y,st,nt){const{opaque:it,transmissive:It,transparent:Ft}=A;S.setupLightsView(st),xt===!0&&qt.setGlobalState(z.clippingPlanes,st),nt&&w.viewport(k.copy(nt)),it.length>0&&Tr(it,Y,st),It.length>0&&Tr(It,Y,st),Ft.length>0&&Tr(Ft,Y,st),w.buffers.depth.setTest(!0),w.buffers.depth.setMask(!0),w.buffers.color.setMask(!0),w.setPolygonOffset(!1)}function g0(A,Y,st,nt){if((st.isScene===!0?st.overrideMaterial:null)!==null)return;if(S.state.transmissionRenderTarget[nt.id]===void 0){const Vt=Dt.has("EXT_color_buffer_half_float")||Dt.has("EXT_color_buffer_float");S.state.transmissionRenderTarget[nt.id]=new qn(1,1,{generateMipmaps:!0,type:Vt?di:yn,minFilter:vs,samples:Math.max(4,I.samples),stencilBuffer:a,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:oe.workingColorSpace})}const It=S.state.transmissionRenderTarget[nt.id],Ft=nt.viewport||k;It.setSize(Ft.z*z.transmissionResolutionScale,Ft.w*z.transmissionResolutionScale);const Lt=z.getRenderTarget(),Ht=z.getActiveCubeFace(),Xt=z.getActiveMipmapLevel();z.setRenderTarget(It),z.getClearColor(at),j=z.getClearAlpha(),j<1&&z.setClearColor(16777215,.5),z.clear(),ft&&ee.render(st);const ne=z.toneMapping;z.toneMapping=ri;const se=nt.viewport;if(nt.viewport!==void 0&&(nt.viewport=void 0),S.setupLightsView(nt),xt===!0&&qt.setGlobalState(z.clippingPlanes,nt),Tr(A,st,nt),ot.updateMultisampleRenderTarget(It),ot.updateRenderTargetMipmap(It),Dt.has("WEBGL_multisampled_render_to_texture")===!1){let Vt=!1;for(let fe=0,Re=Y.length;fe<Re;fe++){const ye=Y[fe],{object:xe,geometry:ke,material:Ut,group:je}=ye;if(Ut.side===wi&&xe.layers.test(nt.layers)){const re=Ut.side;Ut.side=dn,Ut.needsUpdate=!0,_0(xe,st,nt,ke,Ut,je),Ut.side=re,Ut.needsUpdate=!0,Vt=!0}}Vt===!0&&(ot.updateMultisampleRenderTarget(It),ot.updateRenderTargetMipmap(It))}z.setRenderTarget(Lt,Ht,Xt),z.setClearColor(at,j),se!==void 0&&(nt.viewport=se),z.toneMapping=ne}function Tr(A,Y,st){const nt=Y.isScene===!0?Y.overrideMaterial:null;for(let it=0,It=A.length;it<It;it++){const Ft=A[it],{object:Lt,geometry:Ht,group:Xt}=Ft;let ne=Ft.material;ne.allowOverride===!0&&nt!==null&&(ne=nt),Lt.layers.test(st.layers)&&_0(Lt,Y,st,Ht,ne,Xt)}}function _0(A,Y,st,nt,it,It){D!==null&&it.isNodeMaterial&&D.setObject(A,it),A.onBeforeRender(z,Y,st,nt,it,It),A.modelViewMatrix.multiplyMatrices(st.matrixWorldInverse,A.matrixWorld),A.normalMatrix.getNormalMatrix(A.modelViewMatrix),it.onBeforeRender(z,Y,st,nt,A,It),it.transparent===!0&&it.side===wi&&it.forceSinglePass===!1?(it.side=dn,it.needsUpdate=!0,z.renderBufferDirect(st,Y,nt,it,A,It),it.side=Ps,it.needsUpdate=!0,z.renderBufferDirect(st,Y,nt,it,A,It),it.side=wi):z.renderBufferDirect(st,Y,nt,it,A,It),A.onAfterRender(z,Y,st,nt,it,It)}function Ar(A,Y,st){Y.isScene!==!0&&(Y=gt);const nt=tt.get(A),it=S.state.lights,It=S.state.shadowsArray,Ft=it.state.version,Lt=Et.getParameters(A,it.state,It,Y,st,S.state.lightProbeGridArray),Ht=Et.getProgramCacheKey(Lt);let Xt=nt.programs;nt.environment=A.isMeshStandardMaterial||A.isMeshLambertMaterial||A.isMeshPhongMaterial?Y.environment:null,nt.fog=Y.fog;const ne=A.isMeshStandardMaterial||A.isMeshLambertMaterial&&!A.envMap||A.isMeshPhongMaterial&&!A.envMap;nt.envMap=Mt.get(A.envMap||nt.environment,ne),nt.envMapRotation=nt.environment!==null&&A.envMap===null?Y.environmentRotation:A.envMapRotation,Xt===void 0&&(A.addEventListener("dispose",Kn),Xt=new Map,nt.programs=Xt);let se=Xt.get(Ht);if(se!==void 0){if(nt.currentProgram===se&&nt.lightsStateVersion===Ft)return M0(A,Lt),se}else Lt.uniforms=Et.getUniforms(A),D!==null&&A.isNodeMaterial&&D.build(A,st,Lt),A.onBeforeCompile(Lt,z),se=Et.acquireProgram(Lt,Ht),Xt.set(Ht,se),nt.uniforms=Lt.uniforms;const Vt=nt.uniforms;return(!A.isShaderMaterial&&!A.isRawShaderMaterial||A.clipping===!0)&&(Vt.clippingPlanes=qt.uniform),M0(A,Lt),nt.needsLights=Fg(A),nt.lightsStateVersion=Ft,nt.needsLights&&(Vt.ambientLightColor.value=it.state.ambient,Vt.lightProbe.value=it.state.probe,Vt.sunLights.value=it.state.sun,Vt.sunLightShadows.value=it.state.sunShadow,Vt.directionalLights.value=it.state.directional,Vt.directionalLightShadows.value=it.state.directionalShadow,Vt.spotLights.value=it.state.spot,Vt.spotLightShadows.value=it.state.spotShadow,Vt.rectAreaLights.value=it.state.rectArea,Vt.ltc_1.value=it.state.rectAreaLTC1,Vt.ltc_2.value=it.state.rectAreaLTC2,Vt.pointLights.value=it.state.point,Vt.pointLightShadows.value=it.state.pointShadow,Vt.hemisphereLights.value=it.state.hemi,Vt.sunShadowMatrix.value=it.state.sunShadowMatrix,Vt.sunShadowCascade.value=it.state.sunShadowCascade,Vt.directionalShadowMatrix.value=it.state.directionalShadowMatrix,Vt.spotLightMatrix.value=it.state.spotLightMatrix,Vt.spotLightMap.value=it.state.spotLightMap,Vt.pointShadowMatrix.value=it.state.pointShadowMatrix),nt.lightProbeGrid=S.state.lightProbeGridArray.length>0,nt.currentProgram=se,nt.uniformsList=null,se}function v0(A){if(A.uniformsList===null){const Y=A.currentProgram.getUniforms();A.uniformsList=Rc.seqWithValue(Y.seq,A.uniforms)}return A.uniformsList}function M0(A,Y){const st=tt.get(A);st.outputColorSpace=Y.outputColorSpace,st.batching=Y.batching,st.batchingColor=Y.batchingColor,st.instancing=Y.instancing,st.instancingColor=Y.instancingColor,st.instancingMorph=Y.instancingMorph,st.skinning=Y.skinning,st.morphTargets=Y.morphTargets,st.morphNormals=Y.morphNormals,st.morphColors=Y.morphColors,st.morphTargetsCount=Y.morphTargetsCount,st.numClippingPlanes=Y.numClippingPlanes,st.numIntersection=Y.numClipIntersection,st.vertexAlphas=Y.vertexAlphas,st.vertexTangents=Y.vertexTangents,st.toneMapping=Y.toneMapping}function Ng(A,Y){if(A.length===0)return null;if(A.length===1)return A[0].texture!==null?A[0]:null;g.setFromMatrixPosition(Y.matrixWorld);for(let st=0,nt=A.length;st<nt;st++){const it=A[st];if(it.texture!==null&&it.boundingBox.containsPoint(g))return it}return null}function Ug(A,Y,st,nt,it){Y.isScene!==!0&&(Y=gt),ot.resetTextureUnits();const It=Y.fog,Ft=nt.isMeshStandardMaterial||nt.isMeshLambertMaterial||nt.isMeshPhongMaterial?Y.environment:null,Lt=B===null?z.outputColorSpace:B.isXRRenderTarget===!0?B.texture.colorSpace:oe.workingColorSpace,Ht=nt.isMeshStandardMaterial||nt.isMeshLambertMaterial&&!nt.envMap||nt.isMeshPhongMaterial&&!nt.envMap,Xt=Mt.get(nt.envMap||Ft,Ht),ne=nt.vertexColors===!0&&!!st.attributes.color&&st.attributes.color.itemSize===4,se=!!st.attributes.tangent&&(!!nt.normalMap||nt.anisotropy>0),Vt=!!st.morphAttributes.position,fe=!!st.morphAttributes.normal,Re=!!st.morphAttributes.color;let ye=ri;nt.toneMapped&&(B===null||B.isXRRenderTarget===!0)&&(ye=z.toneMapping);const xe=st.morphAttributes.position||st.morphAttributes.normal||st.morphAttributes.color,ke=xe!==void 0?xe.length:0,Ut=tt.get(nt),je=S.state.lights;if(xt===!0&&(q===!0||A!==H)){const Me=A===H&&nt.id===P;qt.setState(nt,A,Me)}let re=!1;nt.version===Ut.__version?(Ut.needsLights&&Ut.lightsStateVersion!==je.state.version||Ut.outputColorSpace!==Lt||it.isBatchedMesh&&Ut.batching===!1||!it.isBatchedMesh&&Ut.batching===!0||it.isBatchedMesh&&Ut.batchingColor===!0&&it._colorsTexture===null||it.isBatchedMesh&&Ut.batchingColor===!1&&it._colorsTexture!==null||it.isInstancedMesh&&Ut.instancing===!1||!it.isInstancedMesh&&Ut.instancing===!0||it.isSkinnedMesh&&Ut.skinning===!1||!it.isSkinnedMesh&&Ut.skinning===!0||it.isInstancedMesh&&Ut.instancingColor===!0&&it.instanceColor===null||it.isInstancedMesh&&Ut.instancingColor===!1&&it.instanceColor!==null||it.isInstancedMesh&&Ut.instancingMorph===!0&&it.morphTexture===null||it.isInstancedMesh&&Ut.instancingMorph===!1&&it.morphTexture!==null||Ut.envMap!==Xt||nt.fog===!0&&Ut.fog!==It||Ut.numClippingPlanes!==void 0&&(Ut.numClippingPlanes!==qt.numPlanes||Ut.numIntersection!==qt.numIntersection)||Ut.vertexAlphas!==ne||Ut.vertexTangents!==se||Ut.morphTargets!==Vt||Ut.morphNormals!==fe||Ut.morphColors!==Re||Ut.toneMapping!==ye||Ut.morphTargetsCount!==ke||!!Ut.lightProbeGrid!=S.state.lightProbeGridArray.length>0)&&(re=!0):(re=!0,Ut.__version=nt.version);let wn=Ut.currentProgram;re===!0&&(wn=Ar(nt,Y,it),D&&nt.isNodeMaterial&&D.onUpdateProgram(nt,wn,Ut));let Jn=!1,Oi=!1,js=!1;const me=wn.getUniforms(),ze=Ut.uniforms;if(w.useProgram(wn.program)&&(Jn=!0,Oi=!0,js=!0),nt.id!==P&&(P=nt.id,Oi=!0),Ut.needsLights){const Me=Ng(S.state.lightProbeGridArray,it);Ut.lightProbeGrid!==Me&&(Ut.lightProbeGrid=Me,Oi=!0)}if(Jn||H!==A){w.buffers.depth.getReversed()&&A.reversedDepth!==!0&&(A._reversedDepth=!0,A.updateProjectionMatrix()),me.setValue(G,"projectionMatrix",A.projectionMatrix),me.setValue(G,"viewMatrix",A.matrixWorldInverse);const Bi=me.map.cameraPosition;Bi!==void 0&&Bi.setValue(G,X.setFromMatrixPosition(A.matrixWorld)),I.logarithmicDepthBuffer&&me.setValue(G,"logDepthBufFC",2/(Math.log(A.far+1)/Math.LN2)),(nt.isMeshPhongMaterial||nt.isMeshToonMaterial||nt.isMeshLambertMaterial||nt.isMeshBasicMaterial||nt.isMeshStandardMaterial||nt.isShaderMaterial)&&me.setValue(G,"isOrthographic",A.isOrthographicCamera===!0),H!==A&&(H=A,Oi=!0,js=!0)}if(Ut.needsLights&&(je.state.sunShadowMap.length>0&&me.setValue(G,"sunShadowMap",je.state.sunShadowMap,ot),je.state.directionalShadowMap.length>0&&me.setValue(G,"directionalShadowMap",je.state.directionalShadowMap,ot),je.state.spotShadowMap.length>0&&me.setValue(G,"spotShadowMap",je.state.spotShadowMap,ot),je.state.pointShadowMap.length>0&&me.setValue(G,"pointShadowMap",je.state.pointShadowMap,ot)),it.isSkinnedMesh){me.setOptional(G,it,"bindMatrix"),me.setOptional(G,it,"bindMatrixInverse");const Me=it.skeleton;Me&&(Me.boneTexture===null&&Me.computeBoneTexture(),me.setValue(G,"boneTexture",Me.boneTexture,ot))}it.isBatchedMesh&&(me.setOptional(G,it,"batchingTexture"),me.setValue(G,"batchingTexture",it._matricesTexture,ot),me.setOptional(G,it,"batchingIdTexture"),me.setValue(G,"batchingIdTexture",it._indirectTexture,ot),me.setOptional(G,it,"batchingColorTexture"),it._colorsTexture!==null&&me.setValue(G,"batchingColorTexture",it._colorsTexture,ot));const Fi=st.morphAttributes;if((Fi.position!==void 0||Fi.normal!==void 0||Fi.color!==void 0)&&K.update(it,st,wn),(Oi||Ut.receiveShadow!==it.receiveShadow)&&(Ut.receiveShadow=it.receiveShadow,me.setValue(G,"receiveShadow",it.receiveShadow)),(nt.isMeshStandardMaterial||nt.isMeshLambertMaterial||nt.isMeshPhongMaterial)&&nt.envMap===null&&Y.environment!==null&&(ze.envMapIntensity.value=Y.environmentIntensity),ze.dfgLUT!==void 0&&(ze.dfgLUT.value=Yb()),Oi){if(me.setValue(G,"toneMappingExposure",z.toneMappingExposure),Ut.needsLights&&Og(ze,js),It&&nt.fog===!0&&$t.refreshFogUniforms(ze,It),$t.refreshMaterialUniforms(ze,nt,Q,J,S.state.transmissionRenderTarget[A.id]),Ut.needsLights&&Ut.lightProbeGrid){const Me=Ut.lightProbeGrid;ze.probesSH.value=Me.texture,ze.probesMin.value.copy(Me.boundingBox.min),ze.probesMax.value.copy(Me.boundingBox.max),ze.probesResolution.value.copy(Me.resolution)}Rc.upload(G,v0(Ut),ze,ot)}if(nt.isShaderMaterial&&nt.uniformsNeedUpdate===!0&&(Rc.upload(G,v0(Ut),ze,ot),nt.uniformsNeedUpdate=!1),nt.isSpriteMaterial&&me.setValue(G,"center",it.center),me.setValue(G,"modelViewMatrix",it.modelViewMatrix),me.setValue(G,"normalMatrix",it.normalMatrix),me.setValue(G,"modelMatrix",it.matrixWorld),nt.uniformsGroups!==void 0){const Me=nt.uniformsGroups;for(let Bi=0,ta=Me.length;Bi<ta;Bi++){const b0=Me[Bi];vt.update(b0,wn),vt.bind(b0,wn)}}return wn}function Og(A,Y){A.ambientLightColor.needsUpdate=Y,A.lightProbe.needsUpdate=Y,A.sunLights.needsUpdate=Y,A.sunLightShadows.needsUpdate=Y,A.directionalLights.needsUpdate=Y,A.directionalLightShadows.needsUpdate=Y,A.pointLights.needsUpdate=Y,A.pointLightShadows.needsUpdate=Y,A.spotLights.needsUpdate=Y,A.spotLightShadows.needsUpdate=Y,A.rectAreaLights.needsUpdate=Y,A.hemisphereLights.needsUpdate=Y}function Fg(A){return A.isMeshLambertMaterial||A.isMeshToonMaterial||A.isMeshPhongMaterial||A.isMeshStandardMaterial||A.isShadowMaterial||A.isShaderMaterial&&A.lights===!0}this.getActiveCubeFace=function(){return W},this.getActiveMipmapLevel=function(){return U},this.getRenderTarget=function(){return B},this.setRenderTargetTextures=function(A,Y,st){const nt=tt.get(A);nt.__autoAllocateDepthBuffer=A.resolveDepthBuffer===!1,nt.__autoAllocateDepthBuffer===!1&&(nt.__useRenderToTexture=!1),tt.get(A.texture).__webglTexture=Y,tt.get(A.depthTexture).__webglTexture=nt.__autoAllocateDepthBuffer?void 0:st,nt.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(A,Y){const st=tt.get(A);st.__webglFramebuffer=Y,st.__useDefaultFramebuffer=Y===void 0},this.setRenderTarget=function(A,Y=0,st=0){B=A,W=Y,U=st;let nt=null,it=!1,It=!1;if(A){const Lt=tt.get(A);if(Lt.__useDefaultFramebuffer!==void 0){w.bindFramebuffer(G.FRAMEBUFFER,Lt.__webglFramebuffer),k.copy(A.viewport),L.copy(A.scissor),V=A.scissorTest,w.viewport(k),w.scissor(L),w.setScissorTest(V),P=-1;return}else if(Lt.__webglFramebuffer===void 0)ot.setupRenderTarget(A);else if(Lt.__hasExternalTextures)ot.rebindTextures(A,tt.get(A.texture).__webglTexture,tt.get(A.depthTexture).__webglTexture);else if(A.depthBuffer){const ne=A.depthTexture;if(Lt.__boundDepthTexture!==ne){if(ne!==null&&tt.has(ne)&&(A.width!==ne.image.width||A.height!==ne.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");ot.setupDepthRenderbuffer(A)}}const Ht=A.texture;(Ht.isData3DTexture||Ht.isDataArrayTexture||Ht.isCompressedArrayTexture)&&(It=!0);const Xt=tt.get(A).__webglFramebuffer;A.isWebGLCubeRenderTarget?(Array.isArray(Xt[Y])?nt=Xt[Y][st]:nt=Xt[Y],it=!0):A.samples>0&&ot.useMultisampledRTT(A)===!1?nt=tt.get(A).__webglMultisampledFramebuffer:Array.isArray(Xt)?nt=Xt[st]:nt=Xt,k.copy(A.viewport),L.copy(A.scissor),V=A.scissorTest}else k.copy(mt).multiplyScalar(Q).floor(),L.copy(Gt).multiplyScalar(Q).floor(),V=Qt;if(st!==0&&(nt=O),w.bindFramebuffer(G.FRAMEBUFFER,nt)&&w.drawBuffers(A,nt),w.viewport(k),w.scissor(L),w.setScissorTest(V),it){const Lt=tt.get(A.texture);G.framebufferTexture2D(G.FRAMEBUFFER,G.COLOR_ATTACHMENT0,G.TEXTURE_CUBE_MAP_POSITIVE_X+Y,Lt.__webglTexture,st)}else if(It){const Lt=Y;for(let Ht=0;Ht<A.textures.length;Ht++){const Xt=tt.get(A.textures[Ht]);G.framebufferTextureLayer(G.FRAMEBUFFER,G.COLOR_ATTACHMENT0+Ht,Xt.__webglTexture,st,Lt)}}else if(A!==null&&st!==0){const Lt=tt.get(A.texture);G.framebufferTexture2D(G.FRAMEBUFFER,G.COLOR_ATTACHMENT0,G.TEXTURE_2D,Lt.__webglTexture,st)}P=-1};function y0(A){const Y=tt.get(A);return(Y.__readFormat!==A.format||Y.__readType!==A.type)&&(Y.__readFormat=A.format,Y.__readType=A.type,Y.__formatReadable=I.textureFormatReadable(A.format),Y.__typeReadable=I.textureTypeReadable(A.type)),Y}this.readRenderTargetPixels=function(A,Y,st,nt,it,It,Ft,Lt=0){if(!(A&&A.isWebGLRenderTarget)){ce("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Ht=tt.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&Ft!==void 0&&(Ht=Ht[Ft]),Ht){w.bindFramebuffer(G.FRAMEBUFFER,Ht);try{const Xt=A.textures[Lt],ne=Xt.format,se=Xt.type;A.textures.length>1&&G.readBuffer(G.COLOR_ATTACHMENT0+Lt);const Vt=y0(Xt);if(Vt.__formatReadable===!1){ce("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Vt.__typeReadable===!1){ce("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}Y>=0&&Y<=A.width-nt&&st>=0&&st<=A.height-it&&G.readPixels(Y,st,nt,it,zt.convert(ne),zt.convert(se),It)}finally{const Xt=B!==null?tt.get(B).__webglFramebuffer:null;w.bindFramebuffer(G.FRAMEBUFFER,Xt)}}},this.readRenderTargetPixelsAsync=async function(A,Y,st,nt,it,It,Ft,Lt=0){if(!(A&&A.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Ht=tt.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&Ft!==void 0&&(Ht=Ht[Ft]),Ht)if(Y>=0&&Y<=A.width-nt&&st>=0&&st<=A.height-it){w.bindFramebuffer(G.FRAMEBUFFER,Ht);const Xt=A.textures[Lt],ne=Xt.format,se=Xt.type;A.textures.length>1&&G.readBuffer(G.COLOR_ATTACHMENT0+Lt);const Vt=y0(Xt);if(Vt.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Vt.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const fe=G.createBuffer();G.bindBuffer(G.PIXEL_PACK_BUFFER,fe),G.bufferData(G.PIXEL_PACK_BUFFER,It.byteLength,G.STREAM_READ),G.readPixels(Y,st,nt,it,zt.convert(ne),zt.convert(se),0),G.bindBuffer(G.PIXEL_PACK_BUFFER,null);const Re=B!==null?tt.get(B).__webglFramebuffer:null;w.bindFramebuffer(G.FRAMEBUFFER,Re);const ye=G.fenceSync(G.SYNC_GPU_COMMANDS_COMPLETE,0);return G.flush(),await I1(G,ye,4),G.bindBuffer(G.PIXEL_PACK_BUFFER,fe),G.getBufferSubData(G.PIXEL_PACK_BUFFER,0,It),G.bindBuffer(G.PIXEL_PACK_BUFFER,null),G.deleteBuffer(fe),G.deleteSync(ye),It}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(A,Y=null,st=0){const nt=Math.pow(2,-st),it=Math.floor(A.image.width*nt),It=Math.floor(A.image.height*nt),Ft=Y!==null?Y.x:0,Lt=Y!==null?Y.y:0;ot.setTexture2D(A,0),G.copyTexSubImage2D(G.TEXTURE_2D,st,0,0,Ft,Lt,it,It),w.unbindTexture()},this.copyTextureToTexture=function(A,Y,st=null,nt=null,it=0,It=0){let Ft,Lt,Ht,Xt,ne,se,Vt,fe,Re;const ye=A.isCompressedTexture?A.mipmaps[It]:A.image;if(st!==null)Ft=st.max.x-st.min.x,Lt=st.max.y-st.min.y,Ht=st.isBox3?st.max.z-st.min.z:1,Xt=st.min.x,ne=st.min.y,se=st.isBox3?st.min.z:0;else{const ze=Math.pow(2,-it);Ft=Math.floor(ye.width*ze),Lt=Math.floor(ye.height*ze),A.isDataArrayTexture?Ht=ye.depth:A.isData3DTexture?Ht=Math.floor(ye.depth*ze):Ht=1,Xt=0,ne=0,se=0}nt!==null?(Vt=nt.x,fe=nt.y,Re=nt.z):(Vt=0,fe=0,Re=0);const xe=zt.convert(Y.format),ke=zt.convert(Y.type);let Ut;Y.isData3DTexture?(ot.setTexture3D(Y,0),Ut=G.TEXTURE_3D):Y.isDataArrayTexture||Y.isCompressedArrayTexture?(ot.setTexture2DArray(Y,0),Ut=G.TEXTURE_2D_ARRAY):(ot.setTexture2D(Y,0),Ut=G.TEXTURE_2D),w.activeTexture(G.TEXTURE0),w.pixelStorei(G.UNPACK_FLIP_Y_WEBGL,Y.flipY),w.pixelStorei(G.UNPACK_PREMULTIPLY_ALPHA_WEBGL,Y.premultiplyAlpha),w.pixelStorei(G.UNPACK_ALIGNMENT,Y.unpackAlignment);const je=w.getParameter(G.UNPACK_ROW_LENGTH),re=w.getParameter(G.UNPACK_IMAGE_HEIGHT),wn=w.getParameter(G.UNPACK_SKIP_PIXELS),Jn=w.getParameter(G.UNPACK_SKIP_ROWS),Oi=w.getParameter(G.UNPACK_SKIP_IMAGES);w.pixelStorei(G.UNPACK_ROW_LENGTH,ye.width),w.pixelStorei(G.UNPACK_IMAGE_HEIGHT,ye.height),w.pixelStorei(G.UNPACK_SKIP_PIXELS,Xt),w.pixelStorei(G.UNPACK_SKIP_ROWS,ne),w.pixelStorei(G.UNPACK_SKIP_IMAGES,se);const js=A.isDataArrayTexture||A.isData3DTexture,me=Y.isDataArrayTexture||Y.isData3DTexture;if(A.isDepthTexture){const ze=tt.get(A),Fi=tt.get(Y),Me=tt.get(ze.__renderTarget),Bi=tt.get(Fi.__renderTarget);w.bindFramebuffer(G.READ_FRAMEBUFFER,Me.__webglFramebuffer),w.bindFramebuffer(G.DRAW_FRAMEBUFFER,Bi.__webglFramebuffer);for(let ta=0;ta<Ht;ta++)js&&(G.framebufferTextureLayer(G.READ_FRAMEBUFFER,G.COLOR_ATTACHMENT0,tt.get(A).__webglTexture,it,se+ta),G.framebufferTextureLayer(G.DRAW_FRAMEBUFFER,G.COLOR_ATTACHMENT0,tt.get(Y).__webglTexture,It,Re+ta)),G.blitFramebuffer(Xt,ne,Ft,Lt,Vt,fe,Ft,Lt,G.DEPTH_BUFFER_BIT,G.NEAREST);w.bindFramebuffer(G.READ_FRAMEBUFFER,null),w.bindFramebuffer(G.DRAW_FRAMEBUFFER,null)}else if(it!==0||A.isRenderTargetTexture||tt.has(A)){const ze=tt.get(A),Fi=tt.get(Y);w.bindFramebuffer(G.READ_FRAMEBUFFER,C),w.bindFramebuffer(G.DRAW_FRAMEBUFFER,F);for(let Me=0;Me<Ht;Me++)js?G.framebufferTextureLayer(G.READ_FRAMEBUFFER,G.COLOR_ATTACHMENT0,ze.__webglTexture,it,se+Me):G.framebufferTexture2D(G.READ_FRAMEBUFFER,G.COLOR_ATTACHMENT0,G.TEXTURE_2D,ze.__webglTexture,it),me?G.framebufferTextureLayer(G.DRAW_FRAMEBUFFER,G.COLOR_ATTACHMENT0,Fi.__webglTexture,It,Re+Me):G.framebufferTexture2D(G.DRAW_FRAMEBUFFER,G.COLOR_ATTACHMENT0,G.TEXTURE_2D,Fi.__webglTexture,It),it!==0?G.blitFramebuffer(Xt,ne,Ft,Lt,Vt,fe,Ft,Lt,G.COLOR_BUFFER_BIT,G.NEAREST):me?G.copyTexSubImage3D(Ut,It,Vt,fe,Re+Me,Xt,ne,Ft,Lt):G.copyTexSubImage2D(Ut,It,Vt,fe,Xt,ne,Ft,Lt);w.bindFramebuffer(G.READ_FRAMEBUFFER,null),w.bindFramebuffer(G.DRAW_FRAMEBUFFER,null)}else me?A.isDataTexture||A.isData3DTexture?G.texSubImage3D(Ut,It,Vt,fe,Re,Ft,Lt,Ht,xe,ke,ye.data):Y.isCompressedArrayTexture?G.compressedTexSubImage3D(Ut,It,Vt,fe,Re,Ft,Lt,Ht,xe,ye.data):G.texSubImage3D(Ut,It,Vt,fe,Re,Ft,Lt,Ht,xe,ke,ye):A.isDataTexture?G.texSubImage2D(G.TEXTURE_2D,It,Vt,fe,Ft,Lt,xe,ke,ye.data):A.isCompressedTexture?G.compressedTexSubImage2D(G.TEXTURE_2D,It,Vt,fe,ye.width,ye.height,xe,ye.data):G.texSubImage2D(G.TEXTURE_2D,It,Vt,fe,Ft,Lt,xe,ke,ye);w.pixelStorei(G.UNPACK_ROW_LENGTH,je),w.pixelStorei(G.UNPACK_IMAGE_HEIGHT,re),w.pixelStorei(G.UNPACK_SKIP_PIXELS,wn),w.pixelStorei(G.UNPACK_SKIP_ROWS,Jn),w.pixelStorei(G.UNPACK_SKIP_IMAGES,Oi),It===0&&Y.generateMipmaps&&G.generateMipmap(Ut),w.unbindTexture()},this.initRenderTarget=function(A){tt.get(A).__webglFramebuffer===void 0&&ot.setupRenderTarget(A)},this.initTexture=function(A){A.isCubeTexture?ot.setTextureCube(A,0):A.isData3DTexture?ot.setTexture3D(A,0):A.isDataArrayTexture||A.isCompressedArrayTexture?ot.setTexture2DArray(A,0):ot.setTexture2D(A,0),w.unbindTexture()},this.resetState=function(){W=0,U=0,B=null,w.reset(),Nt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return ai}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const n=this.getContext();n.drawingBufferColorSpace=oe._getDrawingBufferColorSpace(t),n.unpackColorSpace=oe._getUnpackColorSpace()}}const Kb={zoom:1,u:.5,v:.5};function Jb(e){return e.zoom<=1+1e-6}function Ne(e){const{x0:t,W:n,D:i}=e,s=t+n;return{plants:[{x:t+.3,z:i-.22,hw:.2,hd:.2},{x:s-.35,z:3.5,hw:.2,hd:.2}],parasol:{x:s-1.4,z:i+1.9,hw:.05,hd:.05},palm:{x:s-.5,z:i+3.5,hw:.1,hd:.1},ramp:{x:s-2,z:i+3.6,hw:.6,hd:.35},doorMat:{x:e.door.x,z:i-.15,hw:.55,hd:.25},trees:[{x:t-.7,z:1,hw:.18,hd:.18},{x:t-.7,z:i*.45,hw:.18,hd:.18},{x:t-.7,z:i*.85,hw:.18,hd:.18},{x:t+n*.3,z:-.85,hw:.18,hd:.18},{x:t+n*.75,z:-.85,hw:.18,hd:.18}],terrace:{x:t+n/2,z:i+2.35,hw:n/2-.2,hd:2.15}}}const Ou={dz:-.03,base:{w:.5,h:.03,d:.34,y:.56},lid:{w:.5,h:.34,d:.025,y:.57,back:.16,tilt:.2}},Qb=.93,ui={bg:"#fdfbf7",grass:"#86c96f",dirt:"#9a6a45",floor:"#f6e7cf",wall:"#fffaf1",wallTop:"#f1e3c9",desk:"#e2b880",deskTop:"#f3d79e",island:"#2a9d8f",islandTop:"#fffaf0",ink:"#1d1a17",rug:"#ffd166",islandRug:"#bfe1f2",plant:"#5fb35a",screenOn:"#fdfbf7",screenOff:"#3a3530",terrace:"#ecd7ae",window:"#cfeaff",lampOn:"#ffe7a8",lamp:"#f1e3c9",neon:"#ffd166",hemi:["#ffffff","#e9dcc4",1.55],sun:["#fff4e0",1.9],pendants:!1},hi={bg:"#141211",grass:"#3f6b35",dirt:"#6e4a31",floor:"#7a6150",wall:"#4a3d33",wallTop:"#5c4b3e",desk:"#ad7f50",deskTop:"#c6966a",island:"#1f7a70",islandTop:"#ece2cf",ink:"#0d0b0a",rug:"#c99a2e",islandRug:"#3b5f7a",plant:"#3f8a3e",screenOn:"#fff2d6",screenOff:"#26221f",terrace:"#6b5a44",window:"#2c4a6b",lampOn:"#ffcf8a",lamp:"#e6d8bf",neon:"#ffd166",hemi:["#ffd9a8","#3a2c22",1.5],sun:["#a9b8e8",.7],pendants:!0},jb=e=>e?hi:ui,N={bean:["#f39a4c","#6cb4ee","#7cc26b","#9b8fe0","#ffd166","#2a9d8f","#f28c28","#5aa9a0"],mural:["#ffd166","#6cb4ee","#7cc26b","#9b8fe0","#f39a4c"],board:["#2b6cb0","#2a9d8f","#c07a21","#6b46c1"],flowers:["#ffd166","#f39a4c","#9b8fe0","#fffaf0"],trunk:"#7a4a2a",leaf:["#5fb35a","#4e9a48"],pot:"#f39a4c",crate:"#e8b86b",tape:"#c98a3a",dark:"#2b2d42",metal:"#c9ccd3",paper:"#fffaf0",paperShade:"#e9e2d4",orange:"#f28c28",pineapple:"#e9b44c",pineLeaf:"#3f8a3e",banana:"#ffd166",marker:"#2b6cb0",skate:"#f39a4c",wheel:"#3a3532",truck:"#c9ccd1",sweat:"#8fd3ff",steam:"#ffffff",cloud:"#9a958c",sunglasses:"#1d1a17",parasol:"#ffd166",chair:["#6cb4ee","#fffaf0"],ramp:"#9b8fe0",palmTrunk:"#a0673f",mat:"#f39a4c",coffee:"#2b2d42",coffeeLed:"#ffd166",gold:"#e9c46a",eclipse:"#4b3f7a",grey:"#9a958c",ink:"#1d1a17",glass:"#bfe1f2",bar:"#7cc26b"},Je=["#f39a4c","#6cb4ee","#7cc26b","#ffd166","#9b8fe0","#2a9d8f","#f28c28","#4f6d7a","#e9c46a","#5aa9a0"],tS=["#3d5a80","#2b2d42","#5c677d","#3d405b"],eS=["#f3d5b5","#e0ac7e","#c68b59","#8d5524","#ffdbac","#a0673f"],nS=["#2b2118","#4a3222","#7a4a2a","#d9a066","#1b1b1b","#9b8fe0"],iS=["cap","beanie","afro","bun","hair","headphones","capback","hair","beanie","cap"],tx="#1d1a17",tc="#1d1a17",sS="#3a2b26",aS="#f2b36b";function Ae(e){let t=2166136261;for(let n=0;n<e.length;n++)t=Math.imul(t^e.charCodeAt(n),16777619);return t>>>0}function Ns(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let n=t;return n=Math.imul(n^n>>>15,n|1),n^=n+Math.imul(n^n>>>7,n|61),((n^n>>>14)>>>0)/4294967296}}function ex(e,t){const n=Ae(e),i=(s,a)=>s[(n>>>a)%s.length];return{hoodie:t?tx:i(Je,0),pants:i(tS,4),skin:i(eS,2),hair:t?"#2b2118":i(nS,13),hatColor:i(Je,11),hat:t?"main":i(iS,7),phase:n%1e3/160}}function qs(e,t,n,i){const{style:s,pal:a}=e,{base:o,lid:r}=Ou;e.add(s.box(o.w,o.h,o.d),e.mat(N.metal),t,n,o.y,i);const c=new Wt;c.position.set(n,r.y,i+r.back),c.rotation.x=r.tilt,t.add(c),e.add(s.box(r.w,r.h,r.d),e.mat(N.metal),c,0,r.h/2,0);const l=s.material(a.screenOff,{emissive:a.screenOn,ei:0});return l.userData.live=!0,e.add(s.box(.44,.28,.01),l,c,0,r.h/2,-.016),l}function Ys(e,t,n,i){const{style:s,pal:a}=e;e.add(s.box(.11,.025,.11),e.mat(a.lamp),t,n,.56,i),e.add(s.box(.025,.13,.025),e.mat(a.lamp),t,n,.635,i),e.add(s.box(.12,.06,.1),e.mat(a.lamp),t,n-.03,.725,i);const o=s.material(a.lamp,{emissive:a.lampOn,ei:0});return o.userData.live=!0,e.add(s.box(.08,.02,.06),o,t,n-.03,.69,i),o}function Zs(e,t,n,i,s,a){const o=new Wt;o.position.set(n,0,i),o.rotation.y=a,t.add(o),e.add(e.style.box(.42,.08,.42),e.mat(s),o,0,.32,0),e.add(e.style.box(.42,.42,.07),e.mat(s),o,0,.55,-.2),e.add(e.style.cylinder(.03,.3),e.mat(e.pal.ink),o,0,.15,0)}function Fu(e,t){let n=null;for(const i of e)i.of||t.x<i.x0||t.x>i.x1||i.z0<t.z||(!n||i.z0<n.z0)&&(n=i);return n}function nx(e,t){const n=new Map;return{style:e,pal:t,mat(i){let s=n.get(i);return s||(s=e.material(i),n.set(i,s)),s},add(i,s,a,o,r,c){const l=new Se(i,s);return l.position.set(o,r,c),a.add(l),l}}}function Ks(e,t,n,i,s,a,o,r){const c=r??e.mat(a);e.add(e.style.box(o,o,.02),c,t,n-2.2*o,i+1.1*o,s),e.add(e.style.box(o,o,.02),c,t,n-2.2*o,i-1.1*o,s);for(let l=0;l<3;l++){const d=e.add(e.style.box(3.4*o,.8*o,.02),c,t,n+1.2*o,i,s);d.rotation.z=l*Math.PI/3+Math.PI/2}}function un(e,t,n,i,s,a){return e.add(e.style.box(n.x1-n.x0,i,n.z1-n.z0),e.mat(a),t,(n.x0+n.x1)/2,s,(n.z0+n.z1)/2)}const Dn=e=>({x0:e.x-e.hw,x1:e.x+e.hw,z0:e.z-e.hd,z1:e.z+e.hd}),oS=[0,1,1,1,2,2,2,4,4,4,8],rS=(e,t)=>e[Math.min(t,e.length-1)];function Us(e,t,n,i,s){const{style:a}=e,o=new Wt;if(o.position.set(n,0,i),o.scale.setScalar(s),t.add(o),a.name==="clay"){e.add(a.cylinder(.14,1.3),e.mat(N.trunk),o,0,.65,0),[[0,1.75,0,.62],[.42,1.45,.1,.45],[-.38,1.5,-.1,.48]].forEach(([l,d,f,u],h)=>e.add(a.ball(u),e.mat(N.leaf[h%2]??N.trunk),o,l,d,f));return}e.add(a.box(.36,1.4,.36),e.mat(N.trunk),o,0,.7,0),[[0,1.6,0],[.45,1.5,0],[-.45,1.5,0],[0,2.05,0],[0,1.6,.45]].forEach(([c,l,d],f)=>e.add(a.box(.75,.75,.75),e.mat(N.leaf[f%2]??N.trunk),o,c,l,d))}function qc(e,t,n,i){e.add(e.style.cylinder(.2,.36),e.mat(N.pot),t,n,.18,i);for(let s=0;s<3;s++){const a=e.add(e.style.ball(.26-s*.04),e.mat(s%2?N.leaf[0]:e.pal.plant),t,n+(s-1)*.12,.55+s*.22,i+s%2*.08);a.scale.y=1.2}}function cS(e,t,n,i,s){const a=e.add(e.style.ball(.11),e.mat(N.pineapple),t,n,i+.1,s);a.scale.y=1.45,e.add(e.style.box(.08,.16,.08),e.mat(N.pineLeaf),t,n,i+.3,s)}function Yc(e,t,n,i){e.add(e.style.box(.5,.12,.5),e.mat(N.paper),t,n,.76,i),[N.orange,N.orange,N.banana,N.leaf[0]].forEach((a,o)=>e.add(e.style.ball(.09),e.mat(a),t,n+Math.cos(o*1.7)*.13,.86,i+Math.sin(o*1.7)*.12)),cS(e,t,n+.05,.84,i-.02)}function ix(e,t,n){const{style:i}=e,s=i.pictureZ;e.add(i.box(1.8,.95,.05),e.mat("#d8d2c6"),t,n,1.05,.02+s),e.add(i.box(1.7,.85,.02),e.mat(N.paper),t,n,1.05,.05+s);const a=Ns(Ae("board"));for(let r=0;r<5;r++){const c=.5+a()*.7,l=N.board[r%N.board.length]??N.marker;e.add(i.box(c,.045,.01),e.mat(l),t,n-.78+c/2+r%2*.08,1.37-r*.15,.065+s)}const o=[[.45,.72],[.55,.88],[.65,.8],[.75,1.02]];for(const[r,c]of o)e.add(i.box(.06,.06,.01),e.mat(N.mat),t,n+(r??0),c??0,.065+s)}function sx(e,t,n,i){const{style:s}=e,a=i-n;N.mural.forEach((o,r)=>{const c=a/4;e.add(s.box(c,.45+r%2*.12,.02),e.mat(o),t,n+c/2+r*(a-c)/4,1.15+(r%2?-.06:.08),.01+s.pictureZ)}),Ks(e,t,(n+i)/2,1.18,.035+s.pictureZ,e.pal.ink,.07)}function ax(e,t,n){e.add(e.style.box(.55,.28,.2),e.mat(N.dark),t,0,.84,n);for(const i of[-.15,.15])e.add(e.style.box(.14,.14,.02),e.mat(N.wheel),t,i,.84,n+.11)}function Bu(e){const t=e.lounge.map(n=>n.x);return t.length?{l0:Math.min(...t)-.55,l1:Math.max(...t)+.55}:{l0:e.x0+.1,l1:e.x0+e.W*.4}}const Tl=e=>e.boardSpots.length?e.boardSpots.reduce((t,n)=>t+n.x,0)/e.boardSpots.length:e.x0+e.W/2,Gu=.55,ox=e=>({x:Tl(e)+.9+.25+Gu/2,z:.3});function ms(e,t){const n=Ne(e),{l0:i,l1:s}=Bu(e),a=e.x0+e.W,o=e.island,r=[e.door,n.plants[0]??e.door,{x:0,z:o.z0+1.3},{x:(i+s)/2,z:1.5},{x:Tl(e),z:.9},{x:(i+s)/2,z:.6},{x:0,z:o.z1-.8},n.parasol,n.trees[1]??e.door,n.ramp,{x:e.x0-1.9,z:e.D*.55},ox(e),{x:e.x0-1.9,z:e.D+2.2},{x:a+1.2,z:1.2},{x:e.x0-1.9,z:1.4}];return r[Math.min(t,r.length-1)]??e.door}function lr(e,t){const n=e.island.z1-e.island.z0;return t<2?Math.min(n,1.2):t<6?Math.min(n,3.5):n}function dr(e){const{k:t,o:n,grow:i}=e,{style:s,pal:a}=t,o=x=>e.stage(x),r=o(0);if(!r)return;const c=n.furniture,{l0:l,l1:d}=Bu(n),f=n.lounge.map(x=>x.z),u=o(3);u&&f.length&&t.add(s.box(d-l,.02,Math.max(...f)-Math.min(...f)+1.1),t.mat(a.rug),u,(l+d)/2,.035,(Math.min(...f)+Math.max(...f))/2);const h=x=>x.of!==void 0&&n.lounge.some(m=>m.x===x.of?.x&&m.z===x.of.z),p=c.filter(h),_=xl(i.stage);p.forEach((x,m)=>{if(m>=_)return;const v=m<2?3:m<4?5:8;t.add(s.ball((x.x1-x.x0)/2/1.05/.92),t.mat(N.bean[m%N.bean.length]??a.rug),o(v)??r,(x.x0+x.x1)/2,.2,(x.z0+x.z1)/2).scale.set(1.05,.62,1.05)})}function lS(e){const{k:t,o:n,grow:i}=e,{style:s,pal:a}=t,o=n.furniture,r=P=>e.stage(P),c=Ne(n),{x0:l,W:d,D:f}=n,u=l+d,h=n.island,p=r(0);if(!p)return;const _=r(1);_&&un(t,_,Dn(c.terrace),.08,0,a.terrace);const x=P=>P.of!==void 0&&n.terrace.some(H=>H.x===P.of?.x&&H.z===P.of.z),m=o.filter(x),v=rS(oS,i.stage);m.forEach((P,H)=>{if(H>=v)return;const k=[1,4,7,7,10,10,10,10][H]??0;Rl(t,r(k)??p,P,N.chair[H%2]??N.paper)});const y=r(1);y&&c.plants[0]&&qc(t,y,c.plants[0].x,c.plants[0].z);const g=.75+i.garden*.06,b=r(2);if(b){Yc(t,b,0,h.z0+1.3);const P=c.trees[0];P&&Us(t,b,P.x,P.z,g)}const{l0:S,l1:E}=Bu(n),M=r(4);M&&(ix(t,M,Tl(n)),c.plants[1]&&qc(t,M,c.plants[1].x,c.plants[1].z));const T=r(5);T&&(sx(t,T,S+.15,E-.15),ax(t,T,h.z0+lr(n,i.stage)-.6));const z=r(6);if(z){h.z1-h.z0>3&&Yc(t,z,0,h.z0+2.9);const P=Ns(Ae(`flowers${d}`));for(let H=0;H<10;H++){const k=P()<.5?l-.35-P()*.6:u+.35+P()*.6;t.add(s.box(.16,.16,.16),t.mat(N.flowers[H%4]??N.paper),z,k,.06,P()*(f+3))}}const R=r(7);if(R){const P=c.parasol;t.add(s.cylinder(.03,1.8),t.mat(a.ink),R,P.x,.9,P.z),t.add(s.box(1.4,.3,1.4),t.mat(N.parasol),R,P.x,1.85,P.z);const H=c.palm;t.add(s.box(.16,1.6,.16),t.mat(N.palmTrunk),R,H.x,.8,H.z);for(let k=0;k<4;k++){const L=t.add(s.box(.9,.04,.22),t.mat(N.leaf[0]),R,H.x,1.62,H.z);L.rotation.y=k*Math.PI/2+.4}}const D=r(8);if(D)for(const P of c.trees.slice(1))Us(t,D,P.x,P.z,g);const O=r(9);O&&un(t,O,Dn(c.ramp),.3,.15,N.ramp);const C=r(10);if(C){const P=ms(n,10);t.add(s.cylinder(.72,.25),t.mat("#d8d2c6"),C,P.x,.12,P.z),t.add(s.cylinder(.6,.05),s.material("#8fd3ff",{emissive:"#8fd3ff",ei:.15}),C,P.x,.26,P.z),t.add(s.cylinder(.13,.6),t.mat("#d8d2c6"),C,P.x,.5,P.z),t.add(s.ball(.12),t.mat("#8fd3ff"),C,P.x,.85,P.z)}const F=r(11);if(F){const P=ms(n,11);t.add(s.box(Gu,1.1,.45),t.mat(N.ramp),F,P.x,.55,P.z),t.add(s.box(.45,.32,.03),s.material(N.dark,{emissive:"#6cb4ee",ei:.5}),F,P.x,.82,P.z+.24),t.add(s.box(.5,.06,.25),t.mat(N.dark),F,P.x,.6,P.z+.28)}const W=r(12);if(W){const P=ms(n,12),H=t.add(s.cylinder(1,.04),t.mat("#6cb4ee"),W,P.x,0,P.z);H.scale.z=.7,t.add(s.box(.9,.06,.35),t.mat("#c49a6c"),W,P.x+.7,.06,P.z-.2);for(let k=0;k<3;k++)t.add(s.ball(.1),t.mat(N.leaf[0]),W,P.x-.5+k*.35,.04,P.z+.3-k*.2)}const U=r(13);if(U){const P=ms(n,13),H=2.3;t.add(s.ball(.6),t.mat(N.parasol),U,P.x,H,P.z),Ks(t,U,P.x,H,P.z+.62,t.pal.ink,.05),t.add(s.box(.35,.25,.35),t.mat("#c49a6c"),U,P.x,H-1,P.z);for(const k of[-.15,.15])t.add(s.cylinder(.01,.5),t.mat(N.ink),U,P.x+k,H-.65,P.z)}const B=r(14);if(B){const P=ms(n,14),H=s.material(N.gold,{emissive:N.gold,ei:.15});t.add(s.box(.7,.4,.7),t.mat("#d8d2c6"),B,P.x,.2,P.z),t.add(s.capsule(.22,.25),H,B,P.x,.85,P.z),t.add(s.ball(.22),H,B,P.x,1.32,P.z)}Al(t,p,n,i),dS(t,p,n,i),i.building&&i.stage<14&&zl(t,p,ms(n,i.stage+1))}function Al(e,t,n,i){if(i.garden===0)return;const s=Ns(Ae(`garden${n.W}`)),a=.9+i.garden*.12;for(let o=0;o<i.garden*4;o++){const c=s()<.5?n.x0-.3-s()*a:n.x0+n.W+.3+s()*a;e.add(e.style.box(.14,.14,.14),e.mat(N.flowers[o%4]??N.paper),t,c,.06,-.6+s()*(n.D+4.5))}}function dS(e,t,n,i){if(i.frames===0)return;const{style:s}=e,a=.36,o=i.stage>=11?ox(n).x+Gu/2+.1:Tl(n)+1.1,r=n.mainDesk.x-.5,c=Math.max(1,Math.floor((r-o)/a)),l=e.mat(i.golden?N.gold:N.crate);for(let d=0;d<i.frames;d++){const f=d%c,u=Math.floor(d/c),h=o+a/2+f*a,p=1.45-u*.32;if(p<.6)break;e.add(s.box(.28,.22,.02),l,t,h,p,.02+s.pictureZ),e.add(s.box(.22,.16,.01),e.mat(N.mural[d%N.mural.length]??N.paper),t,h,p,.035+s.pictureZ)}}function zl(e,t,n){const{style:i}=e;for(const[s,a]of[[-.5,-.4],[.5,-.4],[-.5,.4],[.5,.4]])e.add(i.cylinder(.08,.28),e.mat(N.orange),t,n.x+s,.14,n.z+a),e.add(i.cylinder(.12,.03),e.mat(N.orange),t,n.x+s,.015,n.z+a);for(let s=0;s<4;s++)e.add(i.box(.26,.12,.05),e.mat(s%2?N.paper:N.parasol),t,n.x-.39+s*.26,.32,n.z+.45);for(const s of[-.5,.5])e.add(i.box(.04,.32,.04),e.mat(N.ink),t,n.x+s,.16,n.z+.45)}const he={seat:.24,tilt:.6,back:.54,cloth:.05,rail:.04};function Rl(e,t,n,i){const{style:s,pal:a}=e,o=(n.x0+n.x1)/2,r=n.x1-n.x0-.04,c=e.mat(a.desk),l=e.mat(i),d=n.z0+.42,f=n.z1-d;e.add(s.box(r,he.cloth,f),l,t,o,he.seat-he.cloth/2,d+f/2);const u=e.add(s.box(r,he.cloth,he.back),l,t,o,0,0),h=Math.cos(he.tilt),p=Math.sin(he.tilt);u.rotation.x=he.tilt,u.position.set(o,he.seat-he.cloth/2+he.back/2*p,d-he.back/2*h);const _=he.seat-he.cloth;for(const x of[-1,1]){const m=o+x*(r/2-he.rail/2);e.add(s.box(he.rail,he.rail,f),c,t,m,_-he.rail/2,d+f/2),e.add(s.box(he.rail,_,he.rail),c,t,m,_/2,n.z1-he.rail),e.add(s.box(he.rail,_,he.rail),c,t,m,_/2,d);const v=he.seat+(he.back-.12)*p-he.cloth;e.add(s.box(he.rail,v,he.rail),c,t,m,v/2,d-(he.back-.12)*h)}}function fS({k:e,root:t,o:n,grow:i}){const{style:s,pal:a}=e,{x0:o,W:r,D:c}=n,l=o+r/2,d=new Se(s.box(r,.14,c),s.floor(a.floor,r,c));d.position.set(l,-.05,c/2),t.add(d);const f=n.island,u=lr(n,i.stage);e.add(s.box(f.x1-f.x0+1.6,.02,u+1.2),e.mat(a.islandRug),t,(f.x0+f.x1)/2,.03,f.z0+u/2);const h=1.7;e.add(s.box(r+.2,h,.2),e.mat(a.wall),t,l,h/2,-.1),e.add(s.box(.2,1,c+.2),e.mat(a.wall),t,o-.1,.5,c/2);const p=s.material(a.window,{emissive:a.window,ei:a.pendants?.4:0});for(let _=(n.desks.size>0?Math.min(...[...n.desks.values()].map(x=>x.z)):4.3)+.1;_<c-1;_+=2.3)e.add(s.box(.05,.45,1.2),p,t,o,.62,_+.6);un(e,t,Dn(Ne(n).doorMat),.04,.03,N.mat)}function uS({k:e,root:t,o:n}){const{style:i,pal:s}=e,a=n.mainDesk,o=Fu(n.furniture,a)??{x0:a.x-1.15,x1:a.x+1.15,z0:a.z+.1,z1:a.z+1.1},r=(o.x0+o.x1)/2,c=(o.z0+o.z1)/2,l=new Wt;l.position.set(r,0,c),t.add(l);const d=o.x1-o.x0,f=o.z1-o.z0;e.add(i.box(d-.1,.5,f-.1),e.mat(s.desk),l,0,.25,0),e.add(i.box(d,.06,f),e.mat(s.deskTop),l,0,.52,0);const u=qs(e,l,a.x-r+.2,Ou.dz),h=Ys(e,l,d/2-.2,f/2-.2);e.add(i.box(.7,.06,.5),e.mat(s.wallTop),l,-d/2+.5,.58,0),e.add(i.box(.34,.24,.26),e.mat(N.crate),l,-d/2+.5,.73,0),Zs(e,t,a.x,a.z-.05,N.dark,a.face);const p=i.material(s.neon,{flat:!0});return Ks(e,t,a.x,1.25,.02+i.pictureZ,s.neon,.06,p),{screen:u,lamp:h,top:{x:r,y:.55,z:c}}}function hS({k:e,root:t,o:n,grow:i}){const{style:s,pal:a}=e,o=n.island,r=(o.x0+o.x1)/2,c=(o.z0+o.z1)/2,l=n.furniture.find(f=>!f.of&&f.x0<r&&f.x1>r&&f.z0<c&&f.z1>c)??o,d={...l,z1:Math.min(l.z1,l.z0+lr(n,i.stage)+.15)};if(e.add(s.box(d.x1-d.x0-.2,.62,d.z1-d.z0-.15,.2),e.mat(a.island),t,r,.31,(d.z0+d.z1)/2),un(e,t,d,.07,.66,a.islandTop),e.add(s.box(.5,.5,.42),e.mat(N.coffee),t,r,.95,o.z0+.35),e.add(s.box(.18,.06,.04),s.material(N.coffeeLed,{emissive:N.coffeeLed,ei:.5}),t,r,1.07,o.z0+.57),a.pendants)for(let f=o.z0+.9;f<d.z1;f+=1.8){const u=new Uu("#ffcf8a",3.2,4.5,1.6);u.position.set(r,1.5,f),t.add(u)}}function pS({k:e,root:t,o:n},i,s){const a=Fu(n.furniture,i)??{x0:i.x-.8,x1:i.x+.8,z0:i.z+.11,z1:i.z+.89},{style:o,pal:r}=e,c=Ae(s),l=a.x1-a.x0,d=a.z1-a.z0,f=(a.x0+a.x1)/2,u=(a.z0+a.z1)/2,h=new Wt;h.position.set(f,0,u),t.add(h),e.add(o.box(l-.1,.5,d-.08,.12),e.mat(r.desk),h,0,.25,0),e.add(o.box(l,.06,d,.03),e.mat(r.deskTop),h,0,.52,0),e.add(o.box(.22,.08,.02),e.mat(Je[c%Je.length]??r.desk),h,-l/3,.4,d/2-.03);const p=qs(e,h,i.x-f,Ou.dz),_=Ys(e,h,l/2-.18,d/2-.17);return Zs(e,t,i.x,i.z-.05,Je[(c>>5)%Je.length]??r.desk,i.face),c%3===0&&e.add(o.cylinder(.06,.12),e.mat(N.paper),h,.42,.61,-.2),c%4===1&&(e.add(o.cylinder(.08,.12),e.mat(N.pot),h,-.55,.61,-.1),e.add(o.ball(.12),e.mat(r.plant),h,-.55,.76,-.1)),c%5===2&&e.add(o.ball(.07),e.mat(N.orange),h,.4,.62,.12),{screen:p,lamp:_,top:{x:f,y:.55,z:u}}}const Ff={id:"loft",pal:jb,shell:fS,island:hS,lounge:dr,desk:pS,mainDesk:e=>uS(e),tree:({k:e},t,n,i,s)=>{Us(e,t,n,i,s)},growth:lS,pieceAt:ms};function Pa(e,t){const n=parseInt(e.slice(1),16);return`#${[n>>16&255,n>>8&255,n&255].map(s=>Math.max(0,Math.min(255,Math.round(s*t)))).map(s=>s.toString(16).padStart(2,"0")).join("")}`}const mS=["floor","wall","wallTop","desk","deskTop","island","islandTop","terrace","grass","dirt","rug","islandRug","plant"];function Ya(e,t={}){const n={...ui,...e},i={};for(const a of mS)e[a]!==void 0&&(i[a]=Pa(n[a],.62));const s={...hi,...i,...t};return a=>a?s:n}const rx=(e,t)=>({x:e.x+t*Math.sin(e.face),z:e.z+t*Math.cos(e.face)});function fr(e,t,n,i={}){const{k:s,root:a}=e,{style:o,pal:r}=s,c=i.w??1.5,l=i.d??.7,d=i.at??.5,f=Ae(n),u=new Wt;u.position.set(t.x,0,t.z),u.rotation.y=t.face,a.add(u),s.add(o.box(c-.1,.5,l-.08,.12),s.mat(r.desk),u,0,.25,d),s.add(o.box(c,.06,l,.03),s.mat(r.deskTop),u,0,.52,d),s.add(o.box(.22,.08,.02),s.mat(Je[f%Je.length]??r.desk),u,-c/3,.4,d-l/2+.03);const h=qs(s,u,0,d-.03),p=Ys(s,u,c/2-.18,d+l/2-.17);i.chair!==!1&&Zs(s,u,0,-.05,Je[(f>>5)%Je.length]??r.desk,0),i.extra?.(u,f);const _=rx(t,d);return{screen:h,lamp:p,top:{x:_.x,y:.55,z:_.z}}}function Za(e,t,n,i={}){const{k:s,root:a}=e,{style:o,pal:r}=s,c=(t.x0+t.x1)/2,l=(t.z0+t.z1)/2,d=t.x1-t.x0,f=t.z1-t.z0,u=new Wt;u.position.set(c,0,l),a.add(u),s.add(o.box(d-.1,.5,f-.1),s.mat(r.desk),u,0,.25,0),s.add(o.box(d,.06,f),s.mat(r.deskTop),u,0,.52,0);const h=qs(s,u,n.x-c+.2,-.03),p=Ys(s,u,d/2-.2,f/2-.2);return s.add(o.box(.7,.06,.5),s.mat(r.wallTop),u,-d/2+.5,.58,0),s.add(o.box(.34,.24,.26),s.mat(N.crate),u,-d/2+.5,.73,0),Zs(s,a,n.x,n.z-.05,N.dark,n.face),Ks(s,a,i.x??n.x,i.y??1.25,(i.z??.02)+o.pictureZ,r.neon,.06,o.material(r.neon,{flat:!0})),{screen:h,lamp:p,top:{x:c,y:.55,z:l}}}const Ka=(e,t)=>e.furniture.find(n=>!n.of&&t.x>n.x0&&t.x<n.x1&&t.z>n.z0&&t.z<n.z1),xS=[0,1,1,1,2,2,2,4,4,4,8],gS=(e,t)=>e[Math.min(t,e.length-1)];function Hu(e,t){const{o:n,grow:i}=e,s=e.stage(0);if(!s)return;const a=xl(i.stage);n.lounge.forEach((o,r)=>{if(r>=a)return;const c=n.furniture.find(l=>l.of&&l.of.x===o.x&&l.of.z===o.z);c&&t(e.k,e.stage(r<2?3:r<4?5:8)??s,c,r)})}function Js(e){return(t,n)=>n<=0?t.door:e.pieces[Math.min(n,e.pieces.length-1)]?.at(t)??t.door}function Ja(e,t){const{k:n,o:i,grow:s}=e,a=e.stage(0);if(!a)return;const o=Ne(i),r=e.stage(1);r&&un(n,r,Dn(o.terrace),.08,0,n.pal.terrace);const c=i.furniture.filter(u=>u.of!==void 0&&i.terrace.some(h=>h.x===u.of?.x&&h.z===u.of.z)),l=gS(xS,s.stage);c.forEach((u,h)=>{h>=l||Rl(n,e.stage([1,4,7,7,10,10,10,10][h]??0)??a,u,N.chair[h%2]??N.paper)});for(let u=1;u<t.pieces.length&&u<=s.stage;u++){const h=t.pieces[u],p=e.stage(u);h&&p&&h.draw(n,p,h.at(i),e)}const d=.75+s.garden*.06;o.trees.forEach((u,h)=>{const p=e.stage(h===0?2:8);p&&t.tree(n,p,u.x,u.z,d,h)});const f=e.stage(6);if(f){const u=Ns(Ae(`flowers${String(i.W)}`)),h=t.flowers??N.flowers;for(let p=0;p<10;p++){const _=u()<.5?i.x0-.35-u()*.6:i.x0+i.W+.35+u()*.6;n.add(n.style.box(.16,.16,.16),n.mat(h[p%h.length]??N.paper),f,_,.06,u()*(i.D+3))}}Al(n,a,i,s),_S(n,a,i,s,t),s.building&&s.stage<14&&zl(n,a,Js(t)(i,s.stage+1))}function _S(e,t,n,i,s){if(i.frames===0)return;const a=s.frameSpan(n),{xb:o,y:r,z:c}=a,l=i.stage>=11?s.pieces[11]?.at(n):void 0,d=l&&l.z<1&&l.x+Io/2>a.xa&&l.x-Io/2<o?Math.max(a.xa,l.x+Io/2+.1):a.xa,f=.36,u=Math.max(1,Math.floor((o-d)/f));for(let h=0;h<i.frames;h++){const p=r-Math.floor(h/u)*.32;if(p<.6)break;s.frame(e,t,d+f/2+h%u*f,p,c,h,i.golden)}}function cx(e,t){return(n,i,s,a,o,r,c)=>{n.add(n.style.box(.28,.22,.02),n.mat(c?N.gold:e),i,s,a,o+n.style.pictureZ),n.add(n.style.box(.22,.16,.01),n.mat(t[r%t.length]??N.paper),i,s,a,o+.015+n.style.pictureZ)}}function lx(e,t,n,i,s,a){const r=e.add(e.style.ball(.6),e.mat(s[0]??N.parasol),t,n,2.3,i);r.scale.y=1.15,s[1]&&e.add(e.style.cylinder(.61,.18),e.mat(s[1]),t,n,2.3,i).scale.set(1,1,1),Ks(e,t,n,2.3,i+.62,a,.05),e.add(e.style.box(.35,.25,.35),e.mat("#c49a6c"),t,n,2.3-1,i);for(const c of[-.15,.15])e.add(e.style.cylinder(.01,.5),e.mat(N.ink),t,n+c,2.3-.65,i)}function Cl(e,t,n,i,s){e.add(e.style.box(.7,.4,.7),e.mat("#d8d2c6"),t,n,.2,i),s(e.style.material(N.gold,{emissive:N.gold,ei:.15}),.4)}const Bf=e=>e.boardSpots.length?e.boardSpots.reduce((t,n)=>t+n.x,0)/e.boardSpots.length:e.x0+e.W/2,tn=(e,t=()=>{})=>({at:e,draw:t});function Vu(e){const t=n=>Ne(n);return{pieces:[tn(n=>n.door),tn(n=>t(n).plants[0]??n.door,(n,i,s)=>{qc(n,i,s.x,s.z)}),tn(e.fruit,(n,i,s)=>{Yc(n,i,s.x,s.z)}),tn(e.nap),tn(n=>({x:Bf(n),z:.9}),(n,i,s,a)=>{ix(n,i,s.x);const o=t(a.o).plants[1];o&&qc(n,i,o.x,o.z)}),tn(e.boombox,(n,i,s,a)=>{const[o,r]=e.mural(a.o);sx(n,i,o,r);const c=new Wt;c.position.x=s.x,i.add(c),ax(n,c,s.z)}),tn(e.fruit2,(n,i,s)=>{Yc(n,i,s.x,s.z)}),tn(n=>t(n).parasol,(n,i,s,a)=>{const o=t(a.o);n.add(n.style.cylinder(.03,1.8),n.mat(n.pal.ink),i,o.parasol.x,.9,o.parasol.z),n.add(n.style.box(1.4,.3,1.4),n.mat(N.parasol),i,o.parasol.x,1.85,o.parasol.z),n.add(n.style.box(.16,1.6,.16),n.mat(N.palmTrunk),i,o.palm.x,.8,o.palm.z);for(let r=0;r<4;r++)n.add(n.style.box(.9,.04,.22),n.mat(N.leaf[0]),i,o.palm.x,1.62,o.palm.z).rotation.y=r*Math.PI/2+.4}),tn(n=>t(n).trees[1]??n.door),tn(n=>t(n).ramp,(n,i,s,a)=>un(n,i,Dn(t(a.o).ramp),.3,.15,N.ramp)),tn(n=>({x:n.x0-1.9,z:n.D*.55}),(n,i,s)=>{n.add(n.style.cylinder(.72,.25),n.mat("#d8d2c6"),i,s.x,.12,s.z),n.add(n.style.cylinder(.6,.05),n.style.material("#8fd3ff",{emissive:"#8fd3ff",ei:.15}),i,s.x,.26,s.z),n.add(n.style.cylinder(.13,.6),n.mat("#d8d2c6"),i,s.x,.5,s.z),n.add(n.style.ball(.12),n.mat("#8fd3ff"),i,s.x,.85,s.z)}),tn(e.arcade,(n,i,s)=>{dx(n,i,s)}),tn(n=>({x:n.x0-1.9,z:n.D+2.2}),(n,i,s,a)=>{Wu(n,i,s.x,s.z,1,.7,a.k.pal.pendants),n.add(n.style.box(.9,.06,.35),n.mat("#c49a6c"),i,s.x+.7,.06,s.z-.2);for(let o=0;o<3;o++)n.add(n.style.ball(.1),n.mat(N.leaf[0]),i,s.x-.5+o*.35,.04,s.z+.3-o*.2)}),tn(n=>({x:n.x0+n.W+1.2,z:1.2}),(n,i,s)=>{lx(n,i,s.x,s.z,[N.parasol],n.pal.ink)}),tn(n=>({x:n.x0-1.9,z:1.4}),(n,i,s)=>{Cl(n,i,s.x,s.z,(a,o)=>{n.add(n.style.capsule(.22,.25),a,i,s.x,o+.45,s.z),n.add(n.style.ball(.22),a,i,s.x,o+.92,s.z)})})],tree:(n,i,s,a,o)=>{Us(n,i,s,a,o)},frameSpan:e.frameSpan??(n=>({xa:Bf(n)+1.1,xb:n.mainDesk.x-.5,y:1.45,z:.02})),frame:cx(N.crate,N.mural)}}const Io=.55,vS=e=>({x:Bf(e)+.9+.25+Io/2,z:.3});function dx(e,t,n){e.add(e.style.box(Io,1.1,.45),e.mat(N.ramp),t,n.x,.55,n.z),e.add(e.style.box(.45,.32,.03),e.style.material(N.dark,{emissive:"#6cb4ee",ei:.5}),t,n.x,.82,n.z+.24),e.add(e.style.box(.5,.06,.25),e.mat(N.dark),t,n.x,.6,n.z+.28)}function Wu(e,t,n,i,s,a,o){e.add(e.style.cylinder(1,.04),e.style.material(o?"#1d3b52":"#6cb4ee",{emissive:o?"#2c5a7a":"#6cb4ee",ei:o?.3:.08}),t,n,0,i).scale.set(s,1,a)}const MS="#3d405b",yS=["#5fb35a","#7cc26b","#4e9a48"],bS=e=>e.o,Ah=Vu({fruit:e=>({x:(e.island.x0+e.island.x1)/2+.75,z:(e.island.z0+e.island.z1)/2+.3}),fruit2:e=>({x:(e.island.x0+e.island.x1)/2-.7,z:(e.island.z0+e.island.z1)/2-.5}),boombox:e=>({x:(e.island.x0+e.island.x1)/2-.75,z:(e.island.z0+e.island.z1)/2+.55}),mural:e=>{const t=e.lounge.map(n=>n.x);return[Math.min(...t)-.4,Math.max(...t)+.4]},arcade:vS,nap:e=>({x:(e.lounge[0]?.x??e.x0)+1,z:1.5})});function SS(e){const{k:t,root:n,o:i}=e,{style:s,pal:a}=t,{x0:o,W:r,D:c}=i,l=t.add(s.box(r,.14,c),s.floor(a.floor,r,c),n,o+r/2,-.05,c/2);l.receiveShadow=!0;const d=s.material(a.window,{opacity:.35}),f=1.9;t.add(s.box(r,.3,.12),t.mat(a.wallTop),n,o+r/2,.15,-.06),t.add(s.box(.12,.3,c),t.mat(a.wallTop),n,o-.06,.15,c/2),t.add(s.box(r,f-.3,.05),d,n,o+r/2,.3+(f-.3)/2,-.05),t.add(s.box(.05,f-.3,c),d,n,o-.05,.3+(f-.3)/2,c/2);const u=t.mat(MS);for(let h=0;h<=6;h++)t.add(s.box(.07,f,.07),u,n,o+h*r/6,f/2,-.05);for(let h=0;h<=6;h++)t.add(s.box(.07,f,.07),u,n,o-.05,f/2,h*c/6);t.add(s.box(r,.06,.08),u,n,o+r/2,f,-.05),t.add(s.box(.08,.06,c),u,n,o-.05,f,c/2);for(let h=0;h<6;h++){const p=o+(h+.5)*r/6;t.add(s.cylinder(.005,.3),u,n,p,f-.15,.25),t.add(s.cylinder(.14,.14),t.mat(N.pot),n,p,f-.35,.25),t.add(s.ball(.2),t.mat(yS[h%3]??N.leaf[0]),n,p,f-.48,.25).scale.y=1.3}un(t,n,Dn(Ne(i).doorMat),.04,.03,N.mat)}function wS(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=bS(e),{cx:o,cz:r,tableR:c}=a;t.add(i.cylinder(c,.62),t.mat(s.island),n,o,.31,r),t.add(i.cylinder(c+.08,.07),t.mat(s.islandTop),n,o,.66,r),t.add(i.cylinder(.2,2.4),t.mat("#a0673f"),n,o,1.4,r);const l=[[0,2.9,0,1,"#5fb35a"],[.6,2.5,.3,.7,"#7cc26b"],[-.6,2.6,-.2,.7,"#4e9a48"],[.1,3.4,-.3,.6,"#7cc26b"]];for(const[d,f,u,h,p]of l)t.add(i.ball(h),t.mat(p),n,o+d,f,r+u);t.add(i.box(.45,.45,.4),t.mat(N.coffee),n,o-.2,.92,r+.85),t.add(i.box(.16,.05,.04),i.material(N.coffeeLed,{emissive:N.coffeeLed,ei:.5}),n,o-.2,1.04,r+1.06)}const ES={id:"greenhouse",pal:Ya({floor:"#e3b48f",wall:"#cfe8ee",wallTop:"#9cc7d1",desk:"#f3efe6",deskTop:"#ffffff",island:"#c49a6c",islandTop:"#e9d4b4",window:"#cfe8ee",rug:"#7cc26b"},{window:"#3b5f7a",desk:"#c9c2b4",deskTop:"#ddd6c8"}),shell:SS,island:wS,lounge:dr,desk:(e,t,n)=>fr(e,t,n,{w:1.1,d:.55,at:.5}),mainDesk:e=>{const t=e.o.mainDesk,n=Ka(e.o,{x:t.x,z:t.z+.6})??{x0:t.x-1.15,x1:t.x+1.15,z0:t.z+.1,z1:t.z+1.1};return Za(e,n,t)},tree:({k:e},t,n,i,s)=>{Us(e,t,n,i,s)},growth:e=>{Ja(e,Ah)},pieceAt:Js(Ah)},bd=["#bfe1f2","#ffe3a3","#cfe8c3","#e2dcf7"],TS=["#f4a259","#ffd166","#e9c46a"],AS=e=>e.o,Gf=e=>{const t=e.lounge.map(n=>n.x);return t.length?[Math.min(...t)-.4,Math.max(...t)+.4]:[e.x0+.3,e.x0+4]},zh=Vu({fruit:e=>({x:(e.island.x0+e.island.x1)/2,z:e.island.z0+1.6}),fruit2:e=>({x:(e.island.x0+e.island.x1)/2,z:e.island.z0+2.9}),boombox:e=>({x:(e.island.x0+e.island.x1)/2,z:e.island.z1-.5}),mural:e=>Gf(e),arcade:e=>({x:Gf(e)[1]+.3,z:.3}),nap:e=>({x:(e.lounge[0]?.x??e.x0)+1,z:1.5})});function zS(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=AS(e),{x0:o,W:r,D:c}=a;t.add(i.box(r,.14,c),i.floor(s.floor,r,c),n,o+r/2,-.05,c/2),t.add(i.box(r+.2,1.7,.2),t.mat(s.wall),n,o+r/2,.85,-.1),t.add(i.box(.2,1,c+.2),t.mat(s.wall),n,o-.1,.5,c/2);const l=i.material(s.window,{emissive:s.window,ei:s.pendants?.4:0});for(let h=4.6;h<c-1;h+=2.3)t.add(i.box(.05,.45,1.2),l,n,o,.62,h+.6);const d=new Set([...a.slots.values()].map(h=>Math.floor(h/4)));a.pods.forEach((h,p)=>{if(!d.has(p))return;const _=bd[p%bd.length]??bd[0];t.add(i.cylinder(2,.03),t.mat(s.pendants?Pa(_,.55):_),n,h.x,.02,h.z)});const[f,u]=Gf(a);TS.forEach((h,p)=>t.add(i.box(u-f,.2*(3-p),.18),t.mat(s.pendants?Pa(h,.7):h),n,(f+u)/2,.1*(3-p),.1+p*.17)),un(t,n,Dn(Ne(a).doorMat),.04,.03,N.mat)}function RS(e){const{k:t,root:n,o:i}=e,{style:s,pal:a}=t,o=i.island,r=(o.x0+o.x1)/2,c=(o.z0+o.z1)/2,l=o.z1-o.z0;t.add(s.box(o.x1-o.x0-.1,.62,l-.1,.15),t.mat(a.island),n,r,.31,c),t.add(s.box(o.x1-o.x0+.05,.07,l),t.mat(a.islandTop),n,r,.66,c),t.add(s.box(.42,.45,.4),t.mat(N.coffee),n,r,.92,o.z0+.4),t.add(s.box(.04,.05,.16),s.material(N.coffeeLed,{emissive:N.coffeeLed,ei:.5}),n,r+.22,1.04,o.z0+.4)}const CS={id:"campus",pal:Ya({floor:"#efe6d8",wall:"#fbf6ec",wallTop:"#e4d6bf",desk:"#f6f2ea",deskTop:"#ffffff",island:"#f39a4c",islandTop:"#fffaf0"},{desk:"#c9c2b4",deskTop:"#ddd6c8"}),shell:zS,island:RS,lounge:dr,desk:(e,t,n)=>fr(e,t,n,{w:1.6,d:.78,at:.5}),mainDesk:e=>{const t=e.o.mainDesk,n=Ka(e.o,{x:t.x,z:t.z+.6})??{x0:t.x-1.15,x1:t.x+1.15,z0:t.z+.1,z1:t.z+1.1};return Za(e,n,t)},tree:({k:e},t,n,i,s)=>{Us(e,t,n,i,s)},growth:e=>{Ja(e,zh)},pieceAt:Js(zh)},Xi=2.1,Rh=["#f39a4c","#6cb4ee","#2b2d42","#ffd166"],fx=e=>e.o,Ji=e=>({x:(e.island.x0+e.island.x1)/2,z:(e.island.z0+e.island.z1)/2}),ku=e=>e.boardSpots.reduce((t,n)=>t+n.x,0)/Math.max(1,e.boardSpots.length),Ch=Vu({fruit:e=>({x:Ji(e).x+.1,z:Ji(e).z}),fruit2:e=>({x:Ji(e).x-.75,z:Ji(e).z}),boombox:e=>({x:Ji(e).x+.85,z:Ji(e).z}),mural:e=>[e.x0+.15,e.x0+2.3],arcade:e=>({x:e.x0+.5,z:1.2}),nap:e=>({x:e.x0+e.W-2.5,z:e.D-2.5}),frameSpan:e=>({xa:e.x0+2.4,xb:ku(e)-1.1,y:1.9,z:.02})});function PS(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=fx(e),{x0:o,W:r,D:c}=a,l=o+r;t.add(i.box(r,.14,c),i.floor(s.floor,r,c),n,o+r/2,-.05,c/2),t.add(i.box(r+.2,Xi,.2),t.mat(s.wall),n,o+r/2,Xi/2,-.1),t.add(i.box(.2,1.2,c+.2),t.mat(s.wall),n,o-.1,.6,c/2),t.add(i.box(r+.2,.08,.24),t.mat(s.wallTop),n,o+r/2,Xi,-.1);const d=ku(a)-1;t.add(i.box(1.2,.5,.04),t.mat("#c49a6c"),n,d,1.75,.03+i.pictureZ);for(let g=0;g<6;g++)t.add(i.box(.06,.3,.04),t.mat(Rh[g%Rh.length]??N.dark),n,d-.45+g*.18,1.75+g%2*.06,.07+i.pictureZ);const f=4.3,u=c-.4;for(const g of[f,u])t.add(i.box(.16,Xi,.16),t.mat(s.wallTop),n,l+.05,Xi/2,g);t.add(i.box(.36,.34,u-f+.2),t.mat(s.wallTop),n,l+.05,Xi-.05,(f+u)/2),t.add(i.box(.06,.4,u-f-.16),t.mat("#9aa3ab"),n,l+.05,Xi-.42,(f+u)/2);for(let g=0;g<3;g++)t.add(i.box(.07,.02,u-f-.16),t.mat("#77838c"),n,l+.05,Xi-.3-g*.12,(f+u)/2);const h=new Wt;h.position.set(l-.35,0,f+.65),h.rotation.y=-Math.PI/2,n.add(h),IS(t,h,0,0);const p=Ji(a),_=p.x+1.6,x=l-4.6,m=(p.z+.75+a.crossFront)/2;if(x-_>2.6){LS(t,n,(_+x)/2+.3,m);for(let g=0;g<3;g++)t.add(i.cylinder(.26,.14),t.mat(N.dark),n,_+.2,.08+g*.15,m+.2)}const v=t.add(i.cylinder(.5,.01),t.mat("#9a978f"),n,o+r*.62,.025,c*.72);v.scale.z=.6;const y=t.add(i.cylinder(.3,.16),t.mat(N.dark),n,o+.25,.3,c-1);y.rotation.z=Math.PI/2,un(t,n,Dn(Ne(a).doorMat),.04,.03,N.mat)}function LS(e,t,n,i){const{style:s}=e,a=e.mat("#e9c46a");e.add(s.box(2.2,.4,1,.15),a,t,n,.38,i),e.add(s.box(1.1,.38,.9,.15),a,t,n-.25,.75,i),e.add(s.box(1,.26,.92),e.mat("#2c4a6b"),t,n-.25,.78,i);const o=e.add(s.box(.6,.04,.9),a,t,n+.75,.8,i);o.rotation.z=.7;for(const[r,c]of[[-.7,-.5],[.7,-.5],[-.7,.5],[.7,.5]]){const l=e.add(s.cylinder(.2,.12),e.mat(N.dark),t,n+r,.2,i+c);l.rotation.x=Math.PI/2}for(const r of[-.32,.32])e.add(s.box(.03,.1,.14),e.mat(N.paper),t,n+1.1,.45,i+r)}function IS(e,t,n,i){const{style:s}=e,a=e.mat("#6cb4ee");for(const o of[-.42,.42]){const r=e.add(s.cylinder(.16,.08),e.mat(N.dark),t,n+o,.16,i);r.rotation.x=Math.PI/2}e.add(s.box(.7,.14,.26),a,t,n-.05,.3,i),e.add(s.box(.3,.3,.3,.1),a,t,n-.3,.45,i),e.add(s.box(.34,.07,.24),e.mat(N.dark),t,n-.28,.63,i),e.add(s.box(.08,.5,.2),a,t,n+.38,.45,i),e.add(s.box(.04,.04,.5),e.mat(N.dark),t,n+.4,.72,i),e.add(s.ball(.05),e.mat(N.paper),t,n+.44,.62,i)}function DS(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=fx(e),{x:o,z:r}=Ji(a);t.add(i.box(2.5,.62,.8,.08),t.mat(s.island),n,o,.31,r),t.add(i.box(2.6,.07,.9),t.mat(s.islandTop),n,o,.66,r),t.add(i.box(.2,.16,.16),t.mat(N.dark),n,o-1.1,.78,r+.32),t.add(i.box(.5,.26,.28),t.mat(N.pot),n,o-.3,.83,r-.22);const c=a.pingpong,l=(c.x0+c.x1)/2,d=(c.z0+c.z1)/2;t.add(i.box(c.x1-c.x0,.06,c.z1-c.z0),t.mat("#2a9d8f"),n,l,.72,d),t.add(i.box(.02,.01,c.z1-c.z0-.04),t.mat(N.paper),n,l-(c.x1-c.x0)/2+.03,.755,d),t.add(i.box(.04,.16,c.z1-c.z0),t.mat(N.paper),n,l,.83,d);for(const[f,u]of[[-1.1,-.6],[1.1,-.6],[-1.1,.6],[1.1,.6]])t.add(i.box(.06,.7,.06),t.mat(N.dark),n,l+f,.35,d+u);t.add(i.ball(.05),t.mat(N.paper),n,l+.6,.9,d+.2)}const NS={id:"workshop",pal:Ya({floor:"#c4c1bb",wall:"#8e9aa3",wallTop:"#77838c",desk:"#c49a6c",deskTop:"#d8b483",island:"#5c677d",islandTop:"#c49a6c",rug:"#6cb4ee"},{floor:"#7d7a75",wall:"#4f585f"}),shell:PS,island:DS,lounge:dr,desk:(e,t,n)=>fr(e,t,n,{w:1.6,d:.78,at:.5}),mainDesk:e=>{const t=e.o.mainDesk,n=Ka(e.o,{x:t.x,z:t.z+.6})??{x0:t.x-1.15,x1:t.x+1.15,z0:t.z+.1,z1:t.z+1.1};return Za(e,n,t,{x:ku(e.o),y:1.82})},tree:({k:e},t,n,i,s)=>{Us(e,t,n,i,s)},growth:e=>{Ja(e,Ch)},pieceAt:Js(Ch)},Vn="#4a3222",US="#3d4a2e",Os="#2b3a67",yo="#ec9a3c",ux="#5f8f3a",hx="#a9adb3",Ph=[Os,"#a8c96a","#e9c46a"],Tn=e=>e,Lh=e=>e.boardSpots.reduce((t,n)=>t+n.x,0)/Math.max(1,e.boardSpots.length),Hf=e=>(e.island.x0+e.island.x1)/2,en=(e,t=()=>{})=>({at:e,draw:t});function Zc(e,t,n,i,s,a,o){const{style:r}=e;if(a%2===0){e.add(r.cylinder(.08*s,1*s),e.mat(Vn),t,n,.5*s,i);for(const[c,l,d,f]of[[0,1.2,0,.5],[.3,1,.2,.35],[-.3,1.05,-.15,.32]])e.add(r.ball(f*s),e.mat(o?yo:"#7cb35a"),t,n+c*s,l*s,i+d*s);return}for(let c=0;c<4;c++){const l=n+c%2*.2,d=i+Math.floor(c/2)*.2;e.add(r.cylinder(.035,2*s),e.mat("#8fbf5a"),t,l,1*s,d).rotation.z=(c-1.5)*.05,e.add(r.ball(.18),e.mat("#6b9f3a"),t,l,2*s,d).scale.y=.5}}const Vf=e=>{const t=Tn(e).garden,n=(t.x0+t.x1)/2;return{lantern:{x:n+.9,z:t.z0+.7},maple:{x:n-.2,z:(t.z0+t.z1)/2},goban:{x:t.x0+.7,z:t.z1-.7},bamboo:{x:t.x1-.5,z:t.z1-.5}}},Ih={pieces:[en(e=>e.door),en(e=>Ne(e).plants[0]??e.door,(e,t,n)=>{e.add(e.style.box(.42,.12,.3),e.mat("#5c677d"),t,n.x,.06,n.z),e.add(e.style.cylinder(.04,.35),e.mat(Vn),t,n.x,.3,n.z).rotation.z=.4;for(const[i,s]of[[-.12,.42],[.1,.5],[.02,.6]])e.add(e.style.ball(.12),e.mat("#4e7a3a"),t,n.x+i,s,n.z).scale.y=.5}),en(e=>({x:Hf(e),z:e.island.z0+1.6}),(e,t,n)=>{e.add(e.style.box(.44,.12,.32),e.mat(N.dark),t,n.x,.75,n.z),e.add(e.style.box(.18,.04,.12),e.mat(N.paper),t,n.x-.1,.82,n.z-.06),e.add(e.style.box(.18,.04,.12),e.mat("#7cc26b"),t,n.x+.1,.82,n.z-.06),e.add(e.style.box(.38,.04,.12),e.mat(N.orange),t,n.x,.82,n.z+.08)}),en(e=>({x:(Tn(e).kotatsu.x0+Tn(e).kotatsu.x1)/2,z:1.75})),en(e=>({x:Lh(e),z:.9}),(e,t,n,i)=>{const s=e.style.pictureZ;e.add(e.style.box(1.8,.95,.05),e.mat(Vn),t,n.x,1.05,.02+s),e.add(e.style.box(1.66,.82,.02),e.mat("#2f3437"),t,n.x,1.05,.05+s);for(let o=0;o<4;o++)e.add(e.style.box(.04,.5-o*.08,.01),e.mat(N.paper),t,n.x+.55-o*.3,1.1,.065+s);const a=Ne(i.o).plants[1];a&&Zc(e,t,a.x,a.z,.45,1,!1)}),en(e=>({x:(Tn(e).kotatsu.x0+Tn(e).kotatsu.x1)/2,z:.4}),(e,t,n,i)=>{const s=e.style.pictureZ,a=Tn(i.o).kotatsu.x1-Tn(i.o).kotatsu.x0;e.add(e.style.box(a,.6,.02),e.mat("#fbf6e8"),t,n.x,1.2,.02+s);for(let r=0;r<5;r++){const c=r%2?"#3d6fb6":Os;e.add(e.style.box(a/5-.04,.08+r%3*.06,.01),e.mat(c),t,n.x-a/2+(r+.5)*(a/5),1+r%3*.07,.035+s)}e.add(e.style.ball(.11),e.mat(N.paper),t,n.x+a/2-.25,1.36,.04+s);const o=Tn(i.o).garden;e.add(e.style.cylinder(.005,.3),e.mat(N.ink),t,o.x0-.25,1.6,o.z0),e.add(e.style.cap(.08,.6),e.mat("#bfe1f2"),t,o.x0-.25,1.42,o.z0),e.add(e.style.box(.06,.14,.01),e.mat(N.paper),t,o.x0-.25,1.28,o.z0)}),en(e=>({x:Hf(e),z:e.island.z0+2.9}),(e,t,n,i)=>{e.add(e.style.box(.4,.03,.3),e.mat(Vn),t,n.x,.71,n.z),e.add(e.style.cylinder(.08,.07),e.mat("#e9e2d4"),t,n.x-.08,.76,n.z),e.add(e.style.cylinder(.06,.02),e.mat("#7cb35a"),t,n.x-.08,.8,n.z),e.add(e.style.cylinder(.035,.14),e.mat("#d8c9a0"),t,n.x+.1,.79,n.z);const s=Tn(i.o).garden;for(const[a,o,r]of[[.25,.3,.45],[.7,.75,.35],[.2,.85,.3]])e.add(e.style.ball(r),e.mat(ux),t,s.x0+(s.x1-s.x0)*a,0,s.z0+(s.z1-s.z0)*o).scale.y=.35}),en(e=>Ne(e).parasol,(e,t,n)=>{e.add(e.style.cylinder(.03,1.8),e.mat(Vn),t,n.x,.9,n.z);const i=e.add(e.style.cap(.85,.35),e.mat(yo),t,n.x,1.75,n.z);i.scale.y=.6,e.add(e.style.cap(.4,.35),e.mat(N.paper),t,n.x,1.79,n.z).scale.y=.6}),en(e=>Ne(e).trees[1]??e.door),en(e=>Vf(e).goban,(e,t,n)=>{e.add(e.style.box(.5,.18,.5),e.mat("#e2b880"),t,n.x,.09,n.z);for(let i=0;i<3;i++)e.add(e.style.box(.44,.005,.01),e.mat(N.ink),t,n.x,.185,n.z-.15+i*.15),e.add(e.style.box(.01,.005,.44),e.mat(N.ink),t,n.x-.15+i*.15,.185,n.z);e.add(e.style.cylinder(.09,.1),e.mat(Vn),t,n.x-.4,.05,n.z),e.add(e.style.cylinder(.09,.1),e.mat(Vn),t,n.x+.4,.05,n.z),e.add(e.style.ball(.03),e.mat(N.ink),t,n.x+.05,.2,n.z),e.add(e.style.ball(.03),e.mat(N.paper),t,n.x-.1,.2,n.z+.15)}),en(e=>Vf(e).bamboo,(e,t,n,i)=>{e.add(e.style.cylinder(.3,.18),e.mat(hx),t,n.x,.09,n.z),e.add(e.style.cylinder(.25,.02),e.style.material(i.k.pal.pendants?"#1d3b52":"#8fd3ff"),t,n.x,.19,n.z),e.add(e.style.cylinder(.045,.7),e.mat("#a8c96a"),t,n.x-.35,.42,n.z-.1).rotation.z=1.1,e.add(e.style.cylinder(.02,.35),e.mat("#6b8f3a"),t,n.x-.4,.2,n.z-.1)}),en(e=>({x:Tn(e).kotatsu.x1+.45,z:.3}),(e,t,n)=>{dx(e,t,n)}),en(e=>({x:e.x0-1.9,z:e.D+2.2}),(e,t,n,i)=>{Wu(e,t,n.x,n.z,1,.75,i.k.pal.pendants);const s=e.add(e.style.box(.4,.06,1.8),e.mat(yo),t,n.x,.2,n.z);s.rotation.x=0;for(const a of[-.85,.85])e.add(e.style.box(.42,.2,.08),e.mat(yo),t,n.x,.1,n.z+a);for(const[a,o,r]of[[-.5,.2,N.orange],[.5,-.25,N.paper]])e.add(e.style.ball(.09),e.mat(r),t,n.x+a,.04,n.z+o).scale.set(1.8,.5,1)}),en(e=>({x:e.x0+e.W+1.2,z:1.2}),(e,t,n)=>{e.add(e.style.cylinder(.04,3.2),e.mat(Vn),t,n.x,1.6,n.z),[[Os,2.9],[yo,2.5],["#6cb4ee",2.1]].forEach(([i,s],a)=>{const o=e.add(e.style.capsule(.12-a*.015,.7-a*.1),e.mat(i),t,n.x+.5,s,n.z);o.rotation.z=Math.PI/2-.1,e.add(e.style.ball(.04),e.mat(N.paper),t,n.x+.12,s+.04,n.z+.1)})}),en(e=>({x:e.x0-1.9,z:1.4}),(e,t,n)=>{Cl(e,t,n.x,n.z,(i,s)=>{e.add(e.style.ball(.26),i,t,n.x,s+.3,n.z).scale.y=1.15,e.add(e.style.ball(.2),i,t,n.x,s+.7,n.z);for(const a of[-.1,.1])e.add(e.style.box(.07,.1,.05),i,t,n.x+a,s+.9,n.z);e.add(e.style.capsule(.05,.16),i,t,n.x+.2,s+.78,n.z+.08)})})],tree:(e,t,n,i,s,a)=>{Zc(e,t,n,i,s,a,!0)},frameSpan:e=>({xa:Lh(e)+1.1,xb:e.mainDesk.x-.5,y:1.3,z:.02}),frame:(e,t,n,i,s,a,o)=>{const r=s+e.style.pictureZ;e.add(e.style.box(.26,.03,.03),e.mat(Vn),t,n,i+.27,r),e.add(e.style.box(.22,.5,.01),e.mat(o?N.gold:"#fbf6e8"),t,n,i,r),e.add(e.style.box(.03,.22-a%3*.05,.01),e.mat(N.ink),t,n,i+.03,r+.01),e.add(e.style.box(.26,.03,.03),e.mat(Vn),t,n,i-.26,r)},flowers:["#fffaf0","#ffd166","#9b8fe0","#e9e2d4"]};function OS(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=Tn(e.o),{x0:o,W:r,D:c,garden:l}=a;t.add(i.box(r,.14,c),i.floor(s.floor,r,c),n,o+r/2,-.05,c/2);const d=t.mat(US),f=l.x0-.5-o;for(let m=2;m<c;m+=2)t.add(i.box(f,.012,.05),d,n,o+f/2,.03,m);for(let m=o+1.9;m<l.x0-.6;m+=1.9)t.add(i.box(.05,.012,c-.2),d,n,m,.03,c/2);t.add(i.box(.5,.08,l.z1-l.z0+.6),t.mat("#7a5a3c"),n,l.x0-.25,.05,(l.z0+l.z1)/2),t.add(i.box(l.x1-l.x0,.03,l.z1-l.z0),t.mat(s.pendants?"#8e8a80":"#e6e2d6"),n,(l.x0+l.x1)/2,.02,(l.z0+l.z1)/2);for(let m=l.z0+.25;m<l.z1;m+=.3)t.add(i.box(l.x1-l.x0-.1,.005,.02),t.mat(s.pendants?"#77736a":"#c9c3b3"),n,(l.x0+l.x1)/2,.04,m);const u=Vf(a);for(const[m,v,y]of[[-.8,1,.5],[.9,-1.2,.6]])t.add(i.ball(y),t.mat(ux),n,(l.x0+l.x1)/2+m,0,v>0?l.z0+v:l.z1+v).scale.y=.4;t.add(i.ball(.25),t.mat("#8e9399"),n,u.maple.x+.6,.08,u.maple.z-.9).scale.y=.6;const h=u.lantern;t.add(i.box(.22,.45,.22),t.mat(hx),n,h.x,.22,h.z),t.add(i.box(.3,.2,.3),i.material("#e9d8a6",s.pendants?{emissive:"#e9d8a6",ei:1.2}:{}),n,h.x,.55,h.z),t.add(i.box(.42,.1,.42),t.mat("#8e9399"),n,h.x,.72,h.z),Zc(t,n,u.maple.x,u.maple.z,1.1,0,e.grow.stage>=6);const p=t.mat(Vn);t.add(i.box(r+.2,1.8,.14),t.mat(s.wall),n,o+r/2,.9,-.07),t.add(i.box(.14,1.2,c+.2),t.mat(s.wall),n,o-.07,.6,c/2);for(let m=o;m<=o+r+.01;m+=1.9)t.add(i.box(.08,1.8,.05),p,n,m,.9,.01);t.add(i.box(r,.08,.06),p,n,o+r/2,1.78,.01);for(let m=0;m<=c+.01;m+=1.9)t.add(i.box(.05,1.2,.08),p,n,o+.01,.6,m);const _=i.material("#fbf6e8",s.pendants?{emissive:"#fbf6e8",ei:.35}:{});for(let m=4.6;m<c-1.2;m+=1.9){t.add(i.box(.02,.8,1.6),_,n,o+.02,.62,m+.8);for(let v=1;v<4;v++)t.add(i.box(.03,.8,.02),p,n,o+.03,.62,m+v*.4);t.add(i.box(.03,.02,1.6),p,n,o+.03,.62,m+.8)}const x=a.door.x;for(const m of[-.55,.55])t.add(i.box(.08,1.7,.08),p,n,x+m,.85,c-.05);t.add(i.box(1.2,.08,.08),p,n,x,1.7,c-.05);for(const m of[-.22,.22])t.add(i.box(.42,.5,.02),t.mat(Os),n,x+m,1.4,c-.05);t.add(i.ball(.07),t.mat(N.paper),n,x,1.45,c-.03),un(t,n,Dn(Ne(a).doorMat),.03,.03,"#c9b27a")}function FS(e){const{k:t,root:n,o:i}=e,{style:s,pal:a}=t,o=i.island,r=Hf(i),c=(o.z0+o.z1)/2,l=o.z1-o.z0;t.add(s.box(o.x1-o.x0-.1,.62,l-.1,.06),t.mat(a.island),n,r,.31,c),t.add(s.box(o.x1-o.x0+.05,.06,l),t.mat(a.islandTop),n,r,.65,c),t.add(s.ball(.13),t.mat("#5c677d"),n,r,.78,o.z0+.45),t.add(s.cylinder(.02,.12),t.mat("#5c677d"),n,r+.14,.82,o.z0+.45).rotation.z=-.8;for(let d=0;d<3;d++)t.add(s.cylinder(.045,.07),t.mat("#e9e2d4"),n,r+.2,.72,o.z0+.75+d*.14)}function BS(e){const{k:t,root:n}=e,{style:i}=t,s=Tn(e.o).kotatsu,a=(s.x0+s.x1)/2,o=(s.z0+s.z1)/2;if(t.add(i.box(s.x1-s.x0,.22,s.z1-s.z0+.1),t.mat(Os),n,a,.11,o),t.add(i.box(s.x1-s.x0-.2,.05,s.z1-s.z0-.1),t.mat("#7a5a3c"),n,a,.25,o),e.grow.stage>=2)for(const r of[0,.16])t.add(i.ball(.09),t.mat(N.orange),n,a+r,.33,o+r/2);Hu(e,(r,c,l,d)=>{r.add(r.style.box(l.x1-l.x0,.08,l.z1-l.z0,.04),r.mat(Ph[d%Ph.length]??Os),c,(l.x0+l.x1)/2,.05,(l.z0+l.z1)/2)})}const GS={id:"kyoto",pal:Ya({floor:"#d6cc95",wall:"#e8dcc0",wallTop:"#5c3d2e",desk:"#5c3d2e",deskTop:"#7a5a3c",island:"#5c3d2e",islandTop:"#7a5a3c",grass:"#7fa35a",dirt:"#6b5a48",terrace:"#9a8f80",rug:"#a8c96a"},{desk:"#7a5a3c",deskTop:"#94704e",island:"#7a5a3c",islandTop:"#94704e"}),shell:OS,island:FS,lounge:BS,desk:(e,t,n)=>fr(e,t,n,{w:1.6,d:.78,at:.5}),mainDesk:e=>{const t=e.o.mainDesk,n=Ka(e.o,{x:t.x,z:t.z+.6})??{x0:t.x-1.15,x1:t.x+1.15,z0:t.z+.1,z1:t.z+1.1};return Za(e,n,t)},tree:({k:e,grow:t},n,i,s,a)=>{Zc(e,n,i,s,a,0,t.stage>=6)},growth:e=>{Ja(e,Ih)},pieceAt:Js(Ih),wear:e=>{e.add(e.style.cylinder(.232,.05),e.mat(Os),e.head,0,.07,0);for(let t=0;t<3;t++)e.add(e.style.ball(.014),e.mat(N.paper),e.head,Math.sin(t*.5-.5)*.235,.07,Math.cos(t*.5-.5)*.235)}},vn="#2a9d8f",ir="#3d6fb6",Mn="#e9c46a",Wf="#b08a3c",Wn="#f3e3c6",Do=[vn,"#f3efe4",ir,Mn],px="#c98a3e",ys=e=>e,Dh=e=>e.boardSpots.reduce((t,n)=>t+n.x,0)/Math.max(1,e.boardSpots.length),nn=(e,t=()=>{})=>({at:e,draw:t}),bo=e=>{const t=e.lounge.map(n=>n.x);return t.length?[Math.min(...t)-.4,Math.max(...t)+.4]:[e.x0+.3,e.x0+4]},Cc=e=>({x:e.lounge[1]?.x??e.x0+1.8,z:2.95}),Sd=e=>{const t=ys(e).patio;return[{x:t.x0+.7,z:t.z0+.7},{x:t.x1-.7,z:t.z0+.7},{x:t.x0+.7,z:t.z1-.7},{x:t.x1-.7,z:t.z1-.7}]};function Nh(e,t,n,i){e.add(e.style.box(.5,.4,.5),e.mat(vn),t,n.x,.2,n.z),e.add(e.style.cylinder(.05,.6),e.mat("#6b4a32"),t,n.x,.7,n.z),e.add(e.style.ball(.42),e.mat(i?"#2f6a2f":"#3f8a3e"),t,n.x,1.15,n.z);for(let s=0;s<5;s++)e.add(e.style.ball(.06),e.mat(N.orange),t,n.x+Math.sin(s*1.3)*.36,1.1+s%3*.12,n.z+Math.cos(s*1.3)*.36)}function mx(e,t,n,i,s){e.add(e.style.cylinder(.08*s,1.7*s),e.mat("#a0673f"),t,n,.85*s,i);for(let a=0;a<6;a++){const o=e.add(e.style.box(.95*s,.04,.22),e.mat(a%2?"#5fb35a":"#4e9a48"),t,n,1.7*s,i);o.rotation.y=a*Math.PI/3,o.rotation.z=-.3}}const Uh={pieces:[nn(e=>e.door),nn(e=>Ne(e).plants[0]??e.door,(e,t,n)=>{e.add(e.style.cylinder(.18,.3),e.mat(vn),t,n.x,.15,n.z);for(let i=0;i<4;i++)e.add(e.style.ball(.13),e.mat(i%2?"#7cc26b":"#5fb35a"),t,n.x+Math.sin(i*1.6)*.1,.38+i%2*.08,n.z+Math.cos(i*1.6)*.1)}),nn(Cc,(e,t,n,i)=>{e.add(e.style.cylinder(.32,.03),e.mat(Mn),t,n.x,.43,n.z),e.add(e.style.ball(.1),e.mat("#d8d4cc"),t,n.x,.53,n.z),e.add(e.style.cylinder(.015,.12),e.mat("#d8d4cc"),t,n.x+.1,.57,n.z).rotation.z=-.9;for(let s=0;s<3;s++)e.add(e.style.cylinder(.03,.08),e.style.material(vn,{opacity:.8}),t,n.x-.15+s*.12,.49,n.z+.17);for(const s of Sd(i.o).slice(0,1))Nh(e,t,s,i.k.pal.pendants)}),nn(e=>({x:(bo(e)[0]+bo(e)[1])/2,z:1.5})),nn(e=>({x:Dh(e),z:.9}),(e,t,n)=>{const i=e.style.pictureZ;e.add(e.style.box(1.9,1.05,.06),e.mat(Wn),t,n.x,1.05,.03+i),e.add(e.style.cap(.95,.35),e.mat(Wn),t,n.x,1.5,.03+i).scale.z=.08,e.add(e.style.box(1.66,.82,.02),e.mat("#2f3437"),t,n.x,1.03,.07+i);for(let s=0;s<4;s++)e.add(e.style.box(.5-s*.08,.035,.01),e.mat(N.paper),t,n.x-.4,1.3-s*.15,.085+i)}),nn(e=>({x:bo(e)[1]-.2,z:.35}),(e,t,n,i)=>{const[s,a]=bo(i.o),o=e.style.pictureZ,r=Math.min(3,a-s-.4),c=(s+a)/2;e.add(e.style.box(r,.6,.02),e.mat("#f1e6d2"),t,c,1.5,.02+o);for(let l=0;l<4;l++){const d=e.add(e.style.box(.24,.24,.01),e.mat("#2b2118"),t,c-r/2+(l+.5)*(r/4),1.5,.035+o);d.rotation.z=Math.PI/4,e.add(e.style.box(.12,.12,.01),e.mat("#f1e6d2"),t,c-r/2+(l+.5)*(r/4),1.5,.04+o).rotation.z=Math.PI/4}e.add(e.style.cylinder(.14,.3),e.mat(px),t,n.x,.15,n.z),e.add(e.style.cylinder(.15,.02),e.mat("#f1e6d2"),t,n.x,.31,n.z)}),nn(e=>({x:Cc(e).x+0,z:Cc(e).z}),(e,t,n)=>{e.add(e.style.cylinder(.2,.04),e.mat("#b5651d"),t,n.x-.12,.47,n.z-.1),e.add(e.style.cap(.17,.95),e.mat("#c98a3e"),t,n.x-.12,.62,n.z-.1).scale.y=1.2}),nn(e=>Ne(e).parasol,(e,t,n)=>{for(const[i,s]of[[-.8,-.6],[.8,-.6],[-.8,.6],[.8,.6]])e.add(e.style.cylinder(.03,1.7),e.mat("#6b4a32"),t,n.x+i,.85,n.z+s);e.add(e.style.box(1.8,.04,1.4),e.mat("#f1e6d2"),t,n.x,1.72,n.z);for(let i=0;i<3;i++)e.add(e.style.box(.3,.045,1.4),e.mat(ir),t,n.x-.6+i*.6,1.73,n.z)}),nn(e=>Sd(e)[3]??e.door,(e,t,n,i)=>{for(const s of Sd(i.o).slice(1))Nh(e,t,s,i.k.pal.pendants)}),nn(e=>({x:ys(e).patio.x1-1.6,z:ys(e).patio.z1-.7}),(e,t,n)=>{e.add(e.style.cylinder(.32,.3),e.mat(Wf),t,n.x,.15,n.z);for(let i=0;i<16;i++)e.add(e.style.box(.08,.01,.08),e.mat(i%2===Math.floor(i/4)%2?"#2b2118":"#f1e6d2"),t,n.x-.12+i%4*.08,.31,n.z-.12+Math.floor(i/4)*.08)}),nn(e=>({x:ys(e).fx,z:ys(e).fz}),(e,t,n)=>{e.add(e.style.cylinder(.08,.4),e.mat(Wn),t,n.x,1.2,n.z),e.add(e.style.cylinder(.28,.08),e.mat(vn),t,n.x,1.42,n.z),e.add(e.style.ball(.08),e.mat("#8fd3ff"),t,n.x,1.52,n.z)}),nn(e=>({x:e.x0-1.9,z:e.D*.55}),(e,t,n)=>{e.add(e.style.box(1.2,.7,1),e.mat(Wn),t,n.x,.35,n.z),e.add(e.style.cap(.5,.5),e.mat("#fbf6ec"),t,n.x,.7,n.z),e.add(e.style.box(.35,.5,.02),e.mat(vn),t,n.x+.61,.25,n.z);for(let i=0;i<3;i++)e.add(e.style.ball(.12+i*.03),e.style.material(N.steam,{opacity:.5}),t,n.x+.1*i,1.35+i*.25,n.z)}),nn(e=>({x:e.x0-1.9,z:e.D+2.4}),(e,t,n,i)=>{e.add(e.style.box(1,.12,2.4),e.mat(vn),t,n.x,.06,n.z);const s=e.add(e.style.box(.8,.02,2.2),e.style.material(i.k.pal.pendants?"#1d3b52":"#8fd3ff",{emissive:i.k.pal.pendants?"#2c5a7a":"#8fd3ff",ei:.2}),t,n.x,.13,n.z);s.castShadow=!1;for(let a=0;a<6;a++)e.add(e.style.box(.1,.03,.1),e.mat(Do[a%4]??vn),t,n.x+(a%2?.45:-.45),.13,n.z-1+Math.floor(a/2)*1)}),nn(e=>({x:e.x0+e.W+1.2,z:1.2}),(e,t,n,i)=>{lx(e,t,n.x,n.z,[Mn,ir],e.pal.ink);const s=i.o;[[.25,1.4],[.5,1.9],[.75,1.5]].forEach(([a,o])=>{const r=e.add(e.style.cylinder(1.2,o),e.mat(e.pal.pendants?"#5a4a5f":"#b39a8a"),t,s.x0+s.W*a,o/2-.1,-2.6);r.scale.z=.5,e.add(e.style.cap(.55,.4),e.mat(N.paper),t,s.x0+s.W*a,o-.25,-2.6).scale.z=.5})}),nn(e=>({x:e.x0-1.9,z:1.4}),(e,t,n)=>{Cl(e,t,n.x,n.z,(i,s)=>{e.add(e.style.cylinder(.22,.5),i,t,n.x,s+.3,n.z),e.add(e.style.cap(.24,.6),i,t,n.x,s+.6,n.z),e.add(e.style.ball(.06),i,t,n.x,s+.85,n.z)})})],tree:(e,t,n,i,s)=>{mx(e,t,n,i,s)},frameSpan:e=>({xa:Dh(e)+1.1,xb:e.mainDesk.x-.5,y:1.4,z:.02}),frame:(e,t,n,i,s,a,o)=>{const r=s+e.style.pictureZ;e.add(e.style.box(.28,.24,.02),e.mat(o?N.gold:Wn),t,n,i,r),e.add(e.style.cap(.14,.5),e.mat(o?N.gold:Wn),t,n,i+.12,r).scale.z=.15,e.add(e.style.box(.2,.17,.01),e.mat(Do[a%4]??vn),t,n,i,r+.015)},flowers:["#fffaf0","#fbf6ec",Mn,"#9b8fe0"]};function HS(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=ys(e.o),{x0:o,W:r,D:c,patio:l}=a,d=s.pendants;t.add(i.box(r,.14,c),i.floor(s.floor,r,c),n,o+r/2,-.05,c/2);const f=l.x1-l.x0,u=l.z1-l.z0;t.add(i.box(f,.03,u),t.mat(d?"#9a968c":"#f3efe4"),n,(l.x0+l.x1)/2,.02,(l.z0+l.z1)/2);const h=Math.max(.8,f/10);for(let M=l.x0+h/2,T=0;M<l.x1;M+=h,T++)for(let z=l.z0+h/2,R=0;z<l.z1;z+=h,R++){const D=Do[(T+R)%3===1?2:(T+R)%3===2?3:0];t.add(i.box(.22,.01,.22),t.mat(d?Pa(D,.7):D),n,M,.04,z).rotation.y=Math.PI/4}t.add(i.box(r+.2,2.1,.2),t.mat(s.wall),n,o+r/2,1.05,-.1),t.add(i.box(.2,1.3,c+.2),t.mat(s.wall),n,o-.1,.65,c/2);for(let M=o+.2,T=0;M<o+r;M+=.4,T++)t.add(i.box(.4,.45,.02),t.mat(Do[T%4]??vn),n,M,.26,.01);for(let M=.2,T=0;M<c;M+=.4,T++)t.add(i.box(.02,.45,.4),t.mat(Do[T%4]??vn),n,o+.01,.26,M);t.add(i.box(r,.18,.06),t.mat(d?Pa(Wn,.7):Wn),n,o+r/2,1.85,.03);const p=t.mat(d?Pa(Wn,.75):Wn),_=1.35,x=M=>{for(const T of M)t.add(i.cylinder(.11,_),p,n,T.x,_/2,T.z),t.add(i.box(.28,.08,.28),p,n,T.x,_,T.z)},m=[];for(let M=l.x0;M<=l.x1+.01;M+=f/Math.max(1,Math.round(f/1.9)))m.push({x:M,z:l.z0-.15});const v=M=>{const T=[];for(let z=l.z0;z<=l.z1+.01;z+=1.9)T.push({x:M,z});return T};x([...m,...v(l.x0-.15),...v(l.x1+.15)]),t.add(i.box(f+.4,.14,.2),p,n,(l.x0+l.x1)/2,_+.1,l.z0-.15);for(const M of[l.x0-.15,l.x1+.15])t.add(i.box(.2,.14,u),p,n,M,_+.1,(l.z0+l.z1)/2);const y=i.material(Mn,d?{emissive:Mn,ei:1.2}:{});for(let M=0;M+1<m.length;M+=2){const T=m[M],z=m[M+1];if(!T||!z)continue;const R=(T.x+z.x)/2;t.add(i.cylinder(.11,.24),y,n,R,1.05,T.z),t.add(i.cap(.13,.5),t.mat(Wf),n,R,1.17,T.z)}const[g,b]=bo(a);t.add(i.box(b-g,.35,.5),t.mat(ir),n,(g+b)/2,.18,.3);for(let M=0;M<5;M++)t.add(i.box(.5,.36,.1),t.mat([Mn,vn,N.orange,"#9b8fe0",Mn][M]??Mn),n,g+.4+M*(b-g-.8)/4,.5,.08);const S=Cc(a);t.add(i.cylinder(.06,.4),t.mat(Wf),n,S.x,.2,S.z),t.add(i.cylinder(.4,.04),t.mat(Mn),n,S.x,.41,S.z);const E=a.door.x;for(const M of[-.55,.55])t.add(i.box(.14,1.6,.14),t.mat(s.wall),n,E+M,.8,c-.05);t.add(i.box(1.25,.2,.16),t.mat(s.wall),n,E,1.6,c-.05),t.add(i.box(.08,1.4,.9),t.mat("#6b3f22"),n,E-.62,.7,c-.55);for(let M=0;M<6;M++)t.add(i.ball(.03),t.mat(Mn),n,E-.57,.35+Math.floor(M/2)*.4,c-.8+M%2*.5);un(t,n,Dn(Ne(a).doorMat),.03,.03,"#b5651d")}function VS(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=ys(e.o),{fx:o,fz:r}=a,c=s.pendants;t.add(i.cylinder(1.08,.38),t.mat(s.island),n,o,.19,r),t.add(i.cylinder(.95,.04),i.material(c?"#1d3b52":"#8fd3ff",{emissive:c?"#2c5a7a":"#8fd3ff",ei:c?.4:.1}),n,o,.37,r),t.add(i.cylinder(.14,.7),t.mat(Wn),n,o,.6,r),t.add(i.cylinder(.38,.12),t.mat(s.island),n,o,.98,r),t.add(i.ball(.1),t.mat("#8fd3ff"),n,o,1.1,r);for(let l=0;l<8;l++){const d=l/8*Math.PI*2;t.add(i.ball(.07),t.mat(ir),n,o+Math.sin(d)*1.1,.38,r+Math.cos(d)*1.1)}}const WS={id:"riad",pal:Ya({floor:"#d9a36f",wall:"#d98e4f",wallTop:"#c47a3e",desk:"#a0704a",deskTop:"#b8875c",island:vn,islandTop:"#e9f5f2",grass:"#c9b27a",dirt:"#a8764a",terrace:"#e6c9a0",rug:"#f1e6d2"},{desk:"#9a6a48",deskTop:"#b07a52",island:"#1f7a70"}),shell:HS,island:VS,lounge:e=>{Hu(e,(t,n,i)=>{t.add(t.style.cylinder((i.x1-i.x0)/2-.05,.32),t.mat(px),n,(i.x0+i.x1)/2,.16,(i.z0+i.z1)/2),t.add(t.style.cylinder(.12,.01),t.mat(Mn),n,(i.x0+i.x1)/2,.325,(i.z0+i.z1)/2)})},desk:(e,t,n)=>fr(e,t,n,{w:1.4,d:.78,at:.5}),mainDesk:e=>{const t=e.o.mainDesk,n=Ka(e.o,{x:t.x,z:t.z+.6})??{x0:t.x-1.15,x1:t.x+1.15,z0:t.z+.1,z1:t.z+1.1};return Za(e,n,t)},tree:({k:e},t,n,i,s)=>{mx(e,t,n,i,s)},growth:e=>{Ja(e,Uh)},pieceAt:Js(Uh),wear:e=>{for(const t of e.legs){const n=t.children[1];n&&(n.material=e.mat(Mn),n.scale.z=1.25)}}},Cn="#d9b98a",La="#6b4a32",Di="#3d6fb6",As="#d9a54a",xx="#fbf8f2",kS="#2f6b4f",XS="#f4f7fa",$S=e=>e;function qS(e,t,n){const{style:i,pal:s}=e,a=n.x0+n.W-1.5,o=Math.max(n.table.z0+1.2,(n.table.z0+n.D)/2);e.add(i.box(2,.02,1.8),e.mat(s.pendants?"#5a6e8a":"#bfd4ea"),t,a-.2,.03,o),e.add(i.box(.35,.8,1.4),e.mat(Cn),t,a+.85,.4,o),[Di,As,"#2a9d8f","#9b8fe0","#fffaf0"].forEach((r,c)=>e.add(i.box(.25,.26,.08),e.mat(r),t,a+.68,.22+c%2*.36,o-.5+c*.22)),e.add(i.box(.22,.14,.07),e.mat(Di),t,a+.85,.87,o-.3),e.add(i.box(.08,.14,.07),e.mat(Di),t,a+.85,.98,o-.2);for(let r=0;r<3;r++)e.add(i.cylinder(.05,.22),e.mat(["#2a9d8f","#e9c46a","#fffaf0"][r]??N.paper),t,a+.85,.91,o+.15+r*.16);e.add(i.box(.75,.35,.7,.12),e.mat("#c9d6e3"),t,a-.4,.2,o),e.add(i.box(.75,.45,.16,.08),e.mat("#c9d6e3"),t,a-.4,.55,o+.3),e.add(i.box(.6,.1,.5),e.mat(xx),t,a-.4,.42,o-.05),e.add(i.cylinder(.02,1.3),e.mat(N.dark),t,a-1,.65,o+.55),e.add(i.cap(.18,.6),i.material("#fff2d6",s.pendants?{emissive:"#ffd166",ei:.9}:{}),t,a-1,1.35,o+.55)}const Oh=e=>e.boardSpots.reduce((t,n)=>t+n.x,0)/Math.max(1,e.boardSpots.length),Pc=e=>(e.island.x0+e.island.x1)/2,sn=(e,t=()=>{})=>({at:e,draw:t}),Lc=e=>{const t=e.lounge.map(n=>n.x);return t.length?[Math.min(...t)-.45,Math.max(...t)+.45]:[e.x0+1,e.x0+4.5]},gx=e=>({x:e.x0+e.W-1.4,z:e.D+3.5});function _x(e,t,n,i,s,a){const{style:o}=e;if(a%2===0){e.add(o.cylinder(.08,1.6*s),e.mat("#f4f1ea"),t,n,.8*s,i);for(let r=0;r<3;r++)e.add(o.box(.1,.03,.02),e.mat(N.ink),t,n,(.4+r*.4)*s,i+.08);e.add(o.ball(.5*s),e.mat("#a8c96a"),t,n,1.8*s,i).scale.set(.8,1.2,.8);return}e.add(o.cylinder(.08,.4),e.mat("#5c3d2e"),t,n,.2,i);for(let r=0;r<3;r++){const c=(.7-r*.18)*s;e.add(o.cap(c,.9),e.mat(kS),t,n,(.45+r*.42)*s,i).scale.y=1.1,e.add(o.cap(c*.5,.5),e.mat(XS),t,n,(.75+r*.42)*s,i)}}function vx(e,t,n,i){const{style:s}=e;if(e.add(s.box(1.4,1,1.1),e.mat(As),t,n.x,.5,n.z),e.add(s.box(1.6,.12,1.3),e.mat("#5c677d"),t,n.x,1.06,n.z),e.add(s.cylinder(.07,.5),e.mat(N.dark),t,n.x+.4,1.3,n.z-.2),e.add(s.box(.4,.7,.04),e.mat(La),t,n.x-.3,.35,n.z-.57),!!i){e.add(s.box(1.4,.06,.6),e.mat(Cn),t,n.x,.12,n.z-.9),e.add(s.box(.9,.08,.25),e.mat(La),t,n.x+.2,.3,n.z-.95);for(let a=0;a<3;a++)e.add(s.ball(.1+a*.03),s.material(N.steam,{opacity:.5}),t,n.x+.4+a*.06,1.65+a*.22,n.z-.2)}}const Fh={pieces:[sn(e=>e.door),sn(e=>Ne(e).plants[0]??e.door,(e,t,n)=>{e.add(e.style.cylinder(.18,.3),e.mat(N.paper),t,n.x,.15,n.z);for(let i=0;i<6;i++){const s=e.add(e.style.box(.45,.03,.12),e.mat(i%2?"#5fb35a":"#4e9a48"),t,n.x,.4,n.z);s.rotation.y=i*Math.PI/3,s.rotation.z=.4}}),sn(e=>({x:Pc(e),z:e.island.z0+1.3}),(e,t,n)=>{e.add(e.style.cylinder(.28,.03),e.mat(N.paper),t,n.x,.71,n.z);for(let i=0;i<5;i++)e.add(e.style.ball(.07),e.mat("#c98a3e"),t,n.x+Math.sin(i*1.25)*.15,.76,n.z+Math.cos(i*1.25)*.15).scale.y=.6}),sn(e=>({x:(Lc(e)[0]+Lc(e)[1])/2,z:1.5})),sn(e=>({x:Oh(e),z:.9}),(e,t,n)=>{const i=e.style.pictureZ;e.add(e.style.box(1.8,.95,.05),e.mat(Cn),t,n.x,1.05,.02+i),e.add(e.style.box(1.66,.82,.02),e.mat("#2f3a33"),t,n.x,1.05,.05+i);for(let s=0;s<4;s++)e.add(e.style.box(.6-s*.1,.035,.01),e.mat(N.paper),t,n.x-.3,1.3-s*.15,.065+i)}),sn(e=>({x:Pc(e),z:e.island.z1-.4}),(e,t,n,i)=>{const[s,a]=Lc(i.o),o=e.style.pictureZ,r=(s+a)/2+.3;[As,Di,"#2a9d8f","#f39a4c","#9b8fe0"].forEach((l,d)=>e.add(e.style.box(.42,.7,.03),e.mat(l),t,r-.84+d*.42,1.25,.03+o)),e.add(e.style.box(.42,.12,.34),e.mat(La),t,n.x,.75,n.z),e.add(e.style.cylinder(.13,.015),e.mat(N.ink),t,n.x,.82,n.z)}),sn(e=>({x:Pc(e),z:e.island.z0+2.1}),(e,t,n)=>{e.add(e.style.cylinder(.14,.08),e.mat(N.paper),t,n.x,.73,n.z);for(let i=0;i<5;i++)e.add(e.style.ball(.04),e.mat("#4b3f7a"),t,n.x+Math.sin(i*1.3)*.07,.79,n.z+Math.cos(i*1.3)*.07);for(const i of[-.3,.3])e.add(e.style.cylinder(.05,.09),e.mat(N.paper),t,n.x,.74,n.z+i)}),sn(e=>({x:e.x0+e.W-3.4,z:e.D+2}),(e,t,n,i)=>{const s=i.k.pal.pendants;e.add(e.style.cylinder(.4,.08),e.mat("#8e9399"),t,n.x,.04,n.z);for(let a=0;a<3;a++)e.add(e.style.cylinder(.05,.5),e.mat(La),t,n.x,.12,n.z).rotation.set(Math.PI/2,a*Math.PI/3,0);e.add(e.style.cap(.18,.8),e.style.material(N.orange,{emissive:N.orange,ei:s?1.4:.5}),t,n.x,.22,n.z);for(const a of[-.85,.85]){const o=e.add(e.style.cylinder(.12,1.1),e.mat("#a0673f"),t,n.x,.12,n.z+a);o.rotation.z=Math.PI/2}}),sn(e=>Ne(e).trees[1]??e.door),sn(e=>({x:e.x0+e.W+1,z:e.D*.6}),(e,t,n)=>{e.add(e.style.box(.12,.34,.12),e.mat(Cn),t,n.x,.17,n.z),e.add(e.style.box(.14,.05,.14),e.mat(As),t,n.x,.36,n.z);for(const i of[-.9,-.45,.45,.9])e.add(e.style.box(.08,.18,.08),e.mat(Cn),t,n.x-.4,.09,n.z+i),e.add(e.style.box(.08,.18,.08),e.mat(Cn),t,n.x+.4,.09,n.z+i)}),sn(e=>({x:e.x0-1.9,z:e.D*.55}),(e,t,n,i)=>{e.add(e.style.cylinder(.65,.6),e.mat("#a0673f"),t,n.x,.3,n.z),e.add(e.style.cylinder(.56,.03),e.style.material(i.k.pal.pendants?"#2c5a7a":"#8fd3ff",{emissive:"#8fd3ff",ei:i.k.pal.pendants?.5:.1}),t,n.x,.58,n.z);for(let s=0;s<3;s++)e.add(e.style.ball(.12+s*.04),e.style.material(N.steam,{opacity:.45}),t,n.x+.12*s-.1,.85+s*.25,n.z)}),sn(gx,(e,t,n)=>{vx(e,t,n,!0)}),sn(e=>({x:e.x0-1.9,z:e.D+2.4}),(e,t,n,i)=>{Wu(e,t,n.x,n.z,1.2,.9,i.k.pal.pendants),e.add(e.style.box(.4,.06,1.2),e.mat(Cn),t,n.x+.6,.08,n.z-.2);for(const s of[-.7,.3])e.add(e.style.cylinder(.04,.3),e.mat(La),t,n.x+.6,0,n.z+s)}),sn(e=>({x:e.x0+e.W+1.2,z:1.2}),(e,t,n)=>{e.add(e.style.cylinder(.05,2.8),e.mat(Cn),t,n.x,1.4,n.z);const i=e.add(e.style.cylinder(.04,1.4),e.mat(Cn),t,n.x,2.2,n.z);i.rotation.z=Math.PI/2;for(const s of[-.6,.6]){const a=e.add(e.style.cylinder(.22,.06),e.mat("#5fb35a"),t,n.x+s,1.9,n.z);a.rotation.x=Math.PI/2}for(let s=0;s<8;s++)e.add(e.style.ball(.07),e.mat(["#ffd166","#fffaf0","#9b8fe0","#6cb4ee"][s%4]??N.paper),t,n.x,.5+s*.28,n.z+.06)}),sn(e=>({x:e.x0-1.9,z:1.4}),(e,t,n)=>{Cl(e,t,n.x,n.z,(i,s)=>{e.add(e.style.box(.5,.26,.18),i,t,n.x,s+.42,n.z),e.add(e.style.box(.18,.34,.16),i,t,n.x+.22,s+.68,n.z);for(const a of[-.18,.18])e.add(e.style.box(.08,.24,.14),i,t,n.x+a,s+.17,n.z)})})],tree:(e,t,n,i,s,a)=>{_x(e,t,n,i,s,a)},frameSpan:e=>({xa:Oh(e)+1.1,xb:e.mainDesk.x-.5,y:1.45,z:.02}),frame:cx("#ecd2a6",[Di,As,"#2a9d8f","#9b8fe0","#a8c96a"]),flowers:["#fffaf0","#ffd166","#9b8fe0","#6cb4ee"]};function YS(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=$S(e.o),{x0:o,W:r,D:c,table:l}=a,d=s.pendants;t.add(i.box(r,.14,c),i.floor(s.floor,r,c),n,o+r/2,-.05,c/2),t.add(i.box(r+.2,1.9,.2),t.mat(s.wall),n,o+r/2,.95,-.1),t.add(i.box(.2,1.3,c+.2),t.mat(s.wall),n,o-.1,.65,c/2),t.add(i.box(r,.5,.05),t.mat(s.desk),n,o+r/2,.25,.02),t.add(i.box(.05,.5,c),t.mat(s.desk),n,o+.02,.25,c/2);const f=i.material(d?"#2c4a6b":"#dff1fb",d?{emissive:"#3c5a8a",ei:.5}:{});for(let m=a.island.z1+.4;m<c-1.2;m+=2.4)t.add(i.box(.06,.9,1.4),t.mat(La),n,o+.01,.85,m+.7),t.add(i.box(.07,.78,1.28),f,n,o+.02,.85,m+.7);const u=(l.z0+l.z1)/2,h=l.z1-l.z0;t.add(i.box(l.x1-l.x0-.1,.5,h-.1,.06),t.mat(s.desk),n,0,.25,u),t.add(i.box(l.x1-l.x0,.06,h),t.mat(s.deskTop),n,0,.52,u),t.add(i.box(.4,.01,h-.2),t.mat(d?"#9aa4ad":"#dfe7ee"),n,0,.555,u);const p=i.material("#ffd166",d?{emissive:"#ffd166",ei:2}:{});for(let m=l.z0+.8;m<l.z1;m+=1.6)t.add(i.cylinder(.04,.16),t.mat(N.paper),n,0,.64,m),t.add(i.ball(.035),p,n,0,.75,m);const _=t.mat(d?"#d8d2c6":N.paper),x=i.material("#ffd166",d?{emissive:"#ffd166",ei:.8}:{});for(let m=l.z0+1.2;m<l.z1;m+=2.4)t.add(i.cylinder(.005,.6),t.mat(N.dark),n,0,2.1,m),t.add(i.cap(.3,.5),_,n,0,1.75,m),t.add(i.ball(.08),x,n,0,1.68,m);for(const[m,v]of[[0,Di],[.25,As]])t.add(i.box(.1,1.7,.04),t.mat(v),n,o+r-.35-m,.85,.15).rotation.z=.08;qS(t,n,a),e.grow.stage<11&&vx(t,n,gx(a),!1),un(t,n,Dn(Ne(a).doorMat),.03,.03,"#a9b8c8")}function ZS(e){const{k:t,root:n,o:i}=e,{style:s,pal:a}=t,o=i.island,r=Pc(i),c=(o.z0+o.z1)/2,l=o.z1-o.z0;t.add(s.box(o.x1-o.x0-.1,.62,l-.1,.06),t.mat(a.island),n,r,.31,c),t.add(s.box(o.x1-o.x0+.05,.07,l),t.mat(a.islandTop),n,r,.66,c),t.add(s.cylinder(.13,.3),t.mat(N.dark),n,r,.84,o.z0+.4),t.add(s.cylinder(.02,.14),t.mat(N.dark),n,r+.15,.88,o.z0+.4).rotation.z=-.8,t.add(s.cylinder(.07,.18),s.material("#cfe8c3",{opacity:.85}),n,r,.78,o.z0+.8)}function KS(e){const{k:t,root:n,o:i}=e,{style:s,pal:a}=t,o=a.pendants,r=i.x0+.55;t.add(s.cylinder(.35,.8),t.mat(N.dark),n,r,.4,.55),t.add(s.cylinder(.08,1.2),t.mat(N.dark),n,r,1.4,.55),t.add(s.box(.3,.22,.03),s.material(o?"#ff9a3d":"#5c3d2e",o?{emissive:"#ff9a3d",ei:1.5}:{}),n,r,.38,.9);for(let l=0;l<4;l++)t.add(s.cylinder(.06,.5),t.mat("#a0673f"),n,r-.2+l%2*.13,.06+Math.floor(l/2)*.12,1.5).rotation.x=Math.PI/2;const c=e.stage(3);if(c){const[l,d]=Lc(i);t.add(s.box(Math.min(2.2,d-l),.02,1),t.mat(Di),c,(l+d)/2,.035,3);for(let f=0;f<4;f++)t.add(s.box(Math.min(2.2,d-l),.025,.06),t.mat(N.paper),c,(l+d)/2,.04,2.65+f*.22)}Hu(e,(l,d,f)=>{l.add(l.style.ball(.4),l.mat(o?"#c9c4bb":xx),d,(f.x0+f.x1)/2,.05,(f.z0+f.z1)/2).scale.set(1,.18,.9)})}function JS(e,t,n){const{k:i,root:s}=e,a=Ae(n),o=new Wt;o.position.set(t.x,0,t.z),o.rotation.y=t.face,s.add(o);const r=qs(i,o,0,.47),c=Ys(i,o,.5,.85);Zs(i,o,0,-.05,Je[(a>>5)%Je.length]??Cn,0),a%3===0&&i.add(i.style.cylinder(.05,.1),i.mat(N.paper),o,-.45,.6,.75);const l=rx(t,.5);return{screen:r,lamp:c,top:{x:l.x,y:.55,z:l.z}}}const QS={id:"nordic",pal:Ya({floor:"#ead6b4",wall:"#f7f5f0",wallTop:"#d9c7a6",desk:Cn,deskTop:"#ecd2a6",island:"#f7f5f0",islandTop:Cn,grass:"#eef3f7",dirt:"#7a5a3c",terrace:"#e2d2b4",rug:Di},{grass:"#9fb0c4",wall:"#8c8a84"}),shell:YS,island:ZS,lounge:KS,desk:JS,mainDesk:e=>{const t=e.o.mainDesk,n=Ka(e.o,{x:t.x,z:t.z+.6})??{x0:t.x-1.15,x1:t.x+1.15,z0:t.z+.1,z1:t.z+1.1};return Za(e,n,t)},tree:({k:e},t,n,i,s)=>{_x(e,t,n,i,s,1)},growth:e=>{Ja(e,Fh)},pieceAt:Js(Fh),wear:e=>{const t=Ae(e.name);[Di,N.paper,As].slice(0,2+t%2).forEach((i,s)=>e.add(e.style.cylinder(.19,.05),e.mat(i),e.body,0,.74+s*.05,0))}},Bt=(e,t,n=.62)=>t?`#${new te(e).multiplyScalar(n).getHexString()}`:e;function Ai(e,t,n,i,s,a){if(typeof document>"u")return e.mat(t);const o=document.createElement("canvas");o.width=o.height=64;const r=o.getContext("2d");if(!r)return e.mat(t);r.fillStyle=t,r.fillRect(0,0,64,64),a(r,64);const c=new Rm(o);return c.colorSpace=cn,c.wrapS=c.wrapT=qo,c.repeat.set(n/s,i/s),new nr({color:16777215,map:c,roughness:.95,metalness:0})}function ur(e,t,n,i){e.add(e.style.box(n.W,.14,n.D),i,t,n.x0+n.W/2,-.05,n.D/2)}function xi(e){const t=e.x0+e.W,n=e.lounge.map(l=>l.x),i=n.length?(Math.min(...n)+Math.max(...n))/2:e.x0+2,s=e.terrace.map(l=>l.x),a=s.length?Math.min(...s)<e.x0+e.W/2:!0,o=a?t-1.6:e.x0+1.6,r=e.island,c=e.boardSpots.length?e.boardSpots.reduce((l,d)=>l+d.x,0)/e.boardSpots.length:e.x0+e.W/2;return[e.door,{x:a?e.x0+.3:t-.3,z:e.D-.25},{x:(r.x0+r.x1)/2,z:(r.z0+r.z1)/2},{x:i,z:1.6},{x:c,z:.9},{x:i,z:.6},{x:(r.x0+r.x1)/2,z:r.z0+.3},{x:a?Math.max(...s)+1.7:Math.min(...s)-1.7,z:e.D+2.3},{x:e.x0-.9,z:e.D*.45},{x:o,z:e.D+2.6},{x:e.x0-1.9,z:e.D*.55},{x:o+(a?-1.6:1.6),z:e.D+2.6},{x:e.x0-1.9,z:e.D+2.2},{x:t+1.2,z:1.2},{x:e.x0-1.9,z:1.4}]}function pi(e){return[{x:e.x0-.7,z:1},{x:e.x0-.7,z:e.D*.45},{x:e.x0-.7,z:e.D*.85},{x:e.x0+e.W*.3,z:-.85},{x:e.x0+e.W*.75,z:-.85}]}function hr(e,t){return{...e,...t}}function Sn(e,t,n,i,s,a,o,r){return e.add(new yl(n,i,10),typeof s=="string"?e.mat(s):s,t,a,o,r)}function Xu(e,t,n=.9){return e.pal.pendants?e.style.material(t,{emissive:t,ei:n}):e.mat(t)}function Fs(e,t,n,i,s,a=0){return e.add(e.style.box(n.x1-n.x0,i,n.z1-n.z0),e.mat(s),t,(n.x0+n.x1)/2,a+i/2,(n.z0+n.z1)/2)}function pr(e,t,n,i={}){const{k:s,root:a}=e,{style:o,pal:r}=s,c=Ae(n),l=new Wt;l.position.set(t.x,0,t.z),l.rotation.y=t.face,a.add(l);const d=1.3,f=.72;i.mat&&s.add(o.box(1.5,.02,1.5),s.mat(i.mat),l,0,.03,.3),s.add(o.box(d-.1,.5,f-.08,.12),s.mat(r.desk),l,0,.25,.5),s.add(o.box(d,.06,f,.03),s.mat(r.deskTop),l,0,.52,.5),s.add(o.box(.22,.08,.02),s.mat(Je[c%Je.length]??r.desk),l,-d/3,.4,.5+f/2-.03);const u=qs(s,l,0,.47),h=Ys(s,l,d/2-.18,.5+f/2-.17);return Zs(s,a,t.x-Math.sin(t.face)*.05,t.z-Math.cos(t.face)*.05,i.chair??Je[(c>>5)%Je.length]??r.desk,t.face),i.thing?.(s,l,c),{screen:u,lamp:h,top:{x:t.x+Math.sin(t.face)*.5,y:.55,z:t.z+Math.cos(t.face)*.5}}}function mr(e,t,n){const{k:i,root:s,o:a}=e,{style:o,pal:r}=i,c=a.mainDesk,l=Fu(a.furniture,c)??{x0:c.x-1.15,x1:c.x+1.15,z0:c.z+.1,z1:c.z+1.1},d=(l.x0+l.x1)/2,f=(l.z0+l.z1)/2,u=new Wt;u.position.set(d,0,f),s.add(u);const h=l.x1-l.x0,p=l.z1-l.z0;i.add(o.box(h-.1,.5,p-.1),i.mat(n),u,0,.25,0),i.add(o.box(h,.06,p),i.mat(t),u,0,.52,0);const _=qs(i,u,c.x-d+.2,-.03),x=Ys(i,u,h/2-.2,p/2-.2);return i.add(o.box(.7,.06,.5),i.mat(r.wallTop),u,-h/2+.5,.58,0),i.add(o.box(.34,.24,.26),i.mat(N.crate),u,-h/2+.5,.73,0),Zs(i,s,c.x,c.z-.05,N.dark,c.face),Ks(i,s,c.x,1.25,.02+o.pictureZ,r.neon,.06,o.material(r.neon,{flat:!0})),{screen:_,lamp:x,top:{x:d,y:.55,z:f}}}const jS=[0,1,1,1,2,2,2,4,4,4,8],tw=(e,t)=>e[Math.min(t,e.length-1)]??0,ew=e=>e<2?3:e<4?5:8;function xr(e,t){const{o:n,grow:i}=e;n.furniture.filter(a=>a.of!==void 0&&n.lounge.some(o=>o.x===a.of?.x&&o.z===a.of.z)).forEach((a,o)=>{if(o>=xl(i.stage))return;const r=e.stage(ew(o));r&&t(r,a,o)})}function gr(e,t,n){const{k:i,o:s,grow:a}=e,o=e.stage(1);if(!o)return;const r=s.terrace.map(p=>p.x),c=s.terrace.map(p=>p.z),l=Math.min(...r)-.8,d=Math.max(...r)+.8,f=s.D+.15,u=Math.max(...c)+.8;i.add(i.style.box(d-l,.08,u-f),i.mat(t),o,(l+d)/2,0,(f+u)/2),s.furniture.filter(p=>p.of!==void 0&&s.terrace.some(_=>_.x===p.of?.x&&_.z===p.of.z)).forEach((p,_)=>{if(_>=tw(jS,a.stage))return;const x=[1,4,7,7,10,10,10,10][_]??0;Rl(i,e.stage(x)??o,p,n[_%n.length]??N.paper)})}function _r(e,t,n){const{k:i,grow:s}=e,a=e.stage(0);if(!a||s.frames===0)return;const o=.36,r=Math.max(1,Math.floor((t.xb-t.xa)/o));for(let c=0;c<s.frames;c++){const l=t.y-Math.floor(c/r)*.32;if(l<.6)break;n(i,a,t.xa+o/2+c%r*o,l,.02+i.style.pictureZ,c,s.golden)}}function vr(e,t,n){const{k:i,o:s,grow:a}=e,o=e.stage(0);if(o){for(let r=1;r<=14;r++){const c=e.stage(r),l=t[r];c&&l&&l(i,c,n(s,r),e)}Al(i,o,s,a),a.building&&a.stage<14&&zl(i,o,n(s,a.stage+1))}}function Mr(e,t,n,i){e.add(e.style.box(.7,.4,.7),e.mat("#d8d2c6"),t,n.x,.2,n.z),i(e.style.material(N.gold,{emissive:N.gold,ei:.15}),.4)}function $u(e,t,n,i,s,a,o=.5){e.add(e.style.cylinder(.18,.32),e.mat(s),t,n,.16,i);for(let r=0;r<4;r++)e.add(e.style.ball(.14),e.mat(a),t,n+Math.cos(r*1.6)*.1,.4+r/4*o,i+Math.sin(r*1.6)*.08).scale.set(.8,1.3,.8)}function nw(e,t,n,i,s=2.3){const a=new Wt;a.position.set(n.x,s,n.z),t.add(a),i.forEach((o,r)=>{e.add(e.style.ball(.6-r*.001),e.mat(o),a,0,0,0).scale.set(1-r*.28,1.05,1-r*.28)}),e.add(e.style.box(.35,.25,.35),e.mat("#c49a6c"),a,0,-1,0);for(const o of[-.15,.15])e.add(e.style.cylinder(.01,.5),e.mat(N.ink),a,o,-.65,0);return a}function Ic(e,t,n,i,s,a=2.6){const o=e.add(e.style.box(.5,.5,.02),e.mat(i),t,n.x,a,n.z);o.rotation.z=Math.PI/4;for(let c=0;c<4;c++)e.add(e.style.box(.1,.06,.02),e.mat(c%2?s:i),t,n.x+.05*c,a-.42-c*.14,n.z);const r=e.add(e.style.cylinder(.006,a),e.mat(N.ink),t,n.x+.4,a/2,n.z+.3);r.rotation.z=.25}function Pl(e,t,n,i,s){e.add(e.style.box(.9,.36,.9),e.mat(i),t,n.x,.18,n.z),e.add(e.style.box(.8,.03,.8),e.mat(s),t,n.x,.37,n.z)}function qu(e,t,n,i,s,a=1){const o=e.add(e.style.cylinder(a,.04),e.style.material(i,{emissive:i,ei:.1}),t,n.x,.02,n.z);o.scale.z=.7;const r=e.add(e.style.cylinder(a+.1,.03),e.mat(s),t,n.x,0,n.z);r.scale.z=.72}const iw=["#2f5fa7","#7b5fc0","#f39a4c","#2a9d8f","#e9c46a"],zs=["#f28c28","#e9c46a","#2a9d8f","#3d6fb6","#7b5fc0","#7cc26b"],Bh="#2f5fa7",oi="#3d6fb6",Yu="#6b9f7a",No="#4f8a5b",sw="#9b8fe0",In="#f28c28",aw=e=>hr(e?hi:ui,{floor:Bt("#df9a6a",e,.7),wall:Bt("#f2b53a",e),wallTop:Bt("#d99a2a",e),desk:Bt("#a0673f",e,.85),deskTop:Bt("#c98a5a",e,.85),island:Bt("#6b4a32",e,.85),islandTop:Bt("#f3efe4",e,.8),grass:Bt("#d9c08a",e),dirt:Bt("#a8764a",e),terrace:Bt("#e6c9a0",e),plant:Yu}),ow=e=>e.o;function rw(e){const{k:t,root:n}=e,i=ow(e),{x0:s,W:a,D:o}=i,r=t.pal.pendants;ur(t,n,i,Ai(t,t.pal.floor,a,o,.8,(f,u)=>{f.fillStyle=Bt("#c47a48",r,.7),f.fillRect(0,0,u,3),f.fillRect(0,0,3,u),f.fillStyle=Bt("#e3a070",r,.7),f.fillRect(12,12,40,40)})),t.add(t.style.box(a+.2,1.7,.2),t.mat(t.pal.wall),n,s+a/2,.85,-.1),t.add(t.style.box(.2,1.1,o+.2),t.mat(Bt(Bh,r)),n,s-.1,.55,o/2);for(const f of i.slabs){t.add(t.style.box(f.w,1.2,.22),t.mat(Bt(iw[f.c]??Bh,r,.75)),n,f.x,.6,f.z);for(let u=0;u<5;u++)t.add(t.style.box(.3,.16,.02),t.mat(u%2?"#fffaf0":oi),n,f.x-1.6+u*.8,.95,f.z+.12)}for(const f of[4.25,i.island.z0-.35]){const u=t.add(t.style.cylinder(.006,a-.6),t.mat(N.ink),n,s+a/2,2,f);u.rotation.z=Math.PI/2;for(let h=s+.6,p=0;h<s+a-.5;h+=.42,p++)t.add(t.style.box(.28,.3,.01),t.mat(zs[p%zs.length]??In),n,h,1.82-Math.sin((h-s)/a*Math.PI)*.12,f)}const c=i.trough;Fs(t,n,c,.45,Bt("#7b5fc0",r)),t.add(t.style.box(c.x1-c.x0-.15,.02,c.z1-c.z0-.15),t.style.material("#8fd3ff",{emissive:"#8fd3ff",ei:r?.3:.1}),n,(c.x0+c.x1)/2,.46,(c.z0+c.z1)/2),t.add(t.style.box(.3,1.4,.7),t.mat(Bt("#f39a4c",r)),n,c.x1+.1,.7,(c.z0+c.z1)/2),t.add(t.style.box(.5,.08,.08),t.mat("#6b4a32"),n,c.x1-.2,1.2,(c.z0+c.z1)/2),t.add(t.style.box(.06,.7,.06),t.style.material("#8fd3ff",{opacity:.7}),n,c.x1-.42,.82,(c.z0+c.z1)/2);const l=(c.z0+c.z1)/2;t.add(t.style.ball(.12),t.mat("#7b5fc0"),n,c.x0+.3,.6,l).scale.set(1.4,.9,1),t.add(t.style.ball(.07),t.mat("#e9c46a"),n,c.x0+.45,.72,l);for(const f of i.slabs)Mx(t,n,f.x+f.w/2+.3,f.z-.25);for(let f=0;f<4;f++)t.add(t.style.box(.25,.02,.5),t.mat(zs[f]??In),n,i.door.x-.38+f*.25,.03,o-.2)}function Mx(e,t,n,i){e.add(e.style.cylinder(.17,.34),e.mat("#f3efe4"),t,n,.17,i),e.add(e.style.cylinder(.175,.06),e.mat(oi),t,n,.28,i);for(let s=0;s<6;s++)Sn(e,t,.05,.5,Yu,n+Math.sin(s)*.07,.55,i+Math.cos(s)*.07).rotation.set(Math.cos(s)*.6,0,-Math.sin(s)*.6)}function cw(e){const{k:t,root:n,o:i}=e,s=i.island;Fs(t,n,{...s,x0:s.x0+.05,x1:s.x1-.05,z0:s.z0+.05,z1:s.z1-.05},.5,t.pal.island),Fs(t,n,s,.06,t.pal.islandTop,.5);for(let a=s.x0+.15;a<s.x1-.1;a+=.3)for(const o of[s.z0+.04,s.z1-.04])t.add(t.style.box(.2,.02,.06),t.mat(oi),n,a,.57,o);for(const a of i.islandSpots)t.add(t.style.box(.36,.3,.36),t.mat("#c98a5a"),n,a.x,.15,a.z+(a.face===0?-.1:.1))}function lw(e){const{k:t}=e;xr(e,(n,i,s)=>{const a=(i.x0+i.x1)/2,o=(i.z0+i.z1)/2;if(s<4){t.add(t.style.cylinder(.28,.32),t.mat("#c98a3e"),n,a,.16,o),t.add(t.style.cylinder(.3,.06),t.mat("#8a5a3c"),n,a,.34,o),t.add(t.style.box(.56,.4,.08),t.mat("#a0673f"),n,a,.55,o-.26);return}for(const c of[-.45,.45])t.add(t.style.cylinder(.05,1.2),t.mat("#6b4a32"),n,a,.6,o+c);const r=s%2?["#2a9d8f","#7b5fc0","#e9c46a"]:[In,oi,"#e9c46a"];for(let c=0;c<7;c++){const l=c/6,d=t.add(t.style.box(.5,.04,.14),t.mat(r[c%3]??In),n,a,.75-Math.sin(l*Math.PI)*.35,o-.4+l*.8);d.rotation.x=-Math.cos(l*Math.PI)*.5}})}function kf(e,t,n,i,s){const a=new Wt;a.position.set(n,0,i),a.scale.setScalar(s),t.add(a);const o=Ae(`${n.toFixed(1)}:${i.toFixed(1)}`)%3;if(o===0){e.add(e.style.capsule(.16,1.3),e.mat(No),a,0,.8,0);for(const r of[-1,1]){e.add(e.style.capsule(.09,.35),e.mat(No),a,r*.3,1.05+r*.1,0);const c=e.add(e.style.capsule(.09,.15),e.mat(No),a,r*.17,.82+r*.1,0);c.rotation.z=Math.PI/2}}else if(o===1)for(let r=0;r<8;r++)Sn(e,a,.07,.7,Yu,Math.sin(r)*.1,.32,Math.cos(r)*.1).rotation.set(Math.cos(r)*.7,0,-Math.sin(r)*.7);else e.add(e.style.cylinder(.1,1.1),e.mat("#6b4a32"),a,0,.55,0),e.add(e.style.ball(.65),e.mat(sw),a,0,1.45,0).scale.y=.75}function dw(e,t,n,i){e.add(e.style.cylinder(.25,.03),e.mat("#fffaf0"),t,n,.58,i);for(let s=0;s<4;s++)e.add(e.style.ball(.07),e.mat(s%2?"#e9c46a":"#c98a3e"),t,n+Math.sin(s*1.6)*.12,.63,i+Math.cos(s*1.6)*.12).scale.y=.6}const fw={1:(e,t,n)=>{e.add(e.style.cylinder(.17,.3),e.mat("#f3efe4"),t,n.x,.15,n.z),e.add(e.style.capsule(.1,.35),e.mat(No),t,n.x,.55,n.z),e.add(e.style.capsule(.06,.12),e.mat(No),t,n.x+.12,.55,n.z)},2:(e,t,n,i)=>{dw(e,t,n.x,n.z);const s=pi(i.o)[0];s&&kf(e,t,s.x,s.z,.8+i.grow.garden*.06)},3:()=>{},4:(e,t,n)=>{const i=.04+e.style.pictureZ;e.add(e.style.box(1.7,.95,.05),e.mat("#e9c46a"),t,n.x,1.05,i),e.add(e.style.box(1.55,.8,.02),e.mat("#2b3a2f"),t,n.x,1.05,i+.03);const s=Ns(Ae("pizarra"));for(let a=0;a<4;a++)e.add(e.style.box(.4+s()*.6,.04,.01),e.mat("#fffaf0"),t,n.x-.3+s()*.2,1.3-a*.16,i+.05)},5:(e,t,n)=>{const i=.02+e.style.pictureZ;["#2a9d8f",In,"#7b5fc0","#e9c46a",oi].forEach((l,d)=>e.add(e.style.box(.95,.5+d%2*.2,.02),e.mat(l),t,n.x-1.9+d*.95,1.15,i));const a=e.add(e.style.cylinder(.25,.02),e.mat("#e9c46a"),t,n.x,1.3,i+.02);a.rotation.x=Math.PI/2;const o=n.x+2.4;e.add(e.style.ball(.2),e.mat("#c98a3e"),t,o,.3,.25).scale.set(1,1.2,.4);const c=e.add(e.style.box(.07,.6,.04),e.mat("#6b4a32"),t,o,.75,.22);c.rotation.x=-.15},6:(e,t,n,i)=>{e.add(e.style.cylinder(.16,.24),e.mat("#a8764a"),t,n.x+1.2,.68,n.z+.15),e.add(e.style.cylinder(.05,.03),e.mat("#6b4a32"),t,n.x+1.2,.82,n.z+.15);const s=Ns(Ae(`cempasuchil${i.o.W}`));for(let a=0;a<12;a++)e.add(e.style.ball(.09),e.mat(a%3?In:"#e9c46a"),t,i.o.x0-.3-s()*.5,.08,s()*i.o.D)},7:(e,t,n)=>{for(const[i,s]of[[-.7,-.7],[.7,-.7],[-.7,.7],[.7,.7]])e.add(e.style.cylinder(.05,1.7),e.mat("#8a5a3c"),t,n.x+i,.85,n.z+s);Sn(e,t,1.25,.7,"#d9b86a",n.x,2,n.z)},8:(e,t,n,i)=>{for(const s of pi(i.o).slice(1))kf(e,t,s.x,s.z,.8+i.grow.garden*.06)},9:(e,t,n)=>{Pl(e,t,n,"#8a5a3c","#fffaf0");for(let i=0;i<9;i++)e.add(e.style.box(.18,.01,.22),e.mat(zs[i%zs.length]??In),t,n.x-.25+i%3*.25,.39,n.z-.27+Math.floor(i/3)*.27)},10:(e,t,n)=>{e.add(e.style.cylinder(.75,.35),e.mat("#fffaf0"),t,n.x,.17,n.z),e.add(e.style.cylinder(.77,.08),e.mat(oi),t,n.x,.3,n.z),e.add(e.style.cylinder(.62,.04),e.style.material("#8fd3ff",{emissive:"#8fd3ff",ei:.15}),t,n.x,.34,n.z),e.add(e.style.cylinder(.12,.6),e.mat(oi),t,n.x,.6,n.z),e.add(e.style.ball(.14),e.mat("#8fd3ff"),t,n.x,.95,n.z)},11:(e,t,n)=>{Fs(e,t,{x0:n.x-.6,x1:n.x+.6,z0:n.z-.35,z1:n.z+.35},.25,"#2a9d8f",.5),e.add(e.style.box(1.1,.02,.6),e.mat("#7cc26b"),t,n.x,.76,n.z);for(const i of[-.5,.5])for(const s of[-.28,.28])e.add(e.style.box(.08,.5,.08),e.mat("#6b4a32"),t,n.x+i,.25,n.z+s);for(let i=0;i<4;i++){const s=e.add(e.style.cylinder(.015,.9),e.mat(N.metal),t,n.x-.36+i*.24,.82,n.z);s.rotation.x=Math.PI/2,e.add(e.style.box(.05,.12,.05),e.mat(i%2?oi:In),t,n.x-.36+i*.24,.8,n.z)}},12:(e,t,n)=>{qu(e,t,n,"#2ec4b6","#b39a72",1.1);for(let i=0;i<5;i++)e.add(e.style.ball(.2),e.mat("#b39a72"),t,n.x+Math.cos(i*1.3)*1.1,.08,n.z+Math.sin(i*1.3)*.78)},13:(e,t,n)=>{const i=nw(e,t,n,["#7b5fc0",In,"#2a9d8f"]);e.add(e.style.ball(.12),e.mat("#e9c46a"),i,0,.1,.6);for(const s of[-1,1])Sn(e,i,.06,.25,"#2a9d8f",s*.25,.6,.3)},14:(e,t,n)=>{Mr(e,t,n,(i,s)=>{e.add(e.style.ball(.22),i,t,n.x,s+.3,n.z).scale.set(1.5,.9,.8),e.add(e.style.ball(.13),i,t,n.x+.33,s+.5,n.z);for(const r of[-1,1])Sn(e,t,.04,.18,i,n.x+.36,s+.68,n.z+r*.06);for(const r of[-.2,.2])e.add(e.style.box(.06,.2,.06),i,t,n.x+r,s+.1,n.z);const o=Sn(e,t,.05,.35,i,n.x-.42,s+.45,n.z);o.rotation.z=.8})}};function uw(e,t,n,i,s,a,o){e.add(e.style.box(.28,.24,.02),e.mat(o?N.gold:N.metal),t,n,i,s),e.add(e.style.box(.2,.16,.01),e.mat(zs[a%zs.length]??In),t,n,i,s+.015),o&&e.add(e.style.box(.08,.06,.02),e.mat(N.gold),t,n,i+.15,s)}function hw(e){gr(e,pw(e).pal.terrace,[oi,"#fffaf0",In]),vr(e,fw,yx);const t=e.o,n=xi(t)[4]?.x??t.x0+t.W/2;_r(e,{xa:n+1.1,xb:t.mainDesk.x-.6,y:1.45},uw)}const pw=e=>e.k,yx=(e,t)=>xi(e)[Math.min(t,14)]??e.door;function mw(e){const t=new Wt;t.position.set(0,.55,0),t.rotation.z=.7,e.body.add(t),[In,oi,"#e9c46a","#2a9d8f"].forEach((n,i)=>{e.add(new cr(.235,.02,6,20),e.mat(n),t,0,0,-.03+i*.03).scale.set(1,1.15,.8)})}const xw={id:"patio",pal:aw,shell:rw,island:cw,lounge:lw,desk:(e,t,n)=>pr(e,t,n,{thing:(i,s,a)=>{a%3===0&&Mx(i,s,.45,.35)}}),mainDesk:e=>mr(e,"#c98a5a","#6b4a32"),tree:({k:e},t,n,i,s)=>{kf(e,t,n,i,s)},growth:hw,pieceAt:yx,wear:mw},Kc="#3d6fb6",Ke="#f28c28",on="#e9c46a",Nn="#2a9d8f",bs="#f1dcae",Zu="#4f8a3e",bx=[Ke,Nn,"#7b5fc0",on],gw=e=>hr(e?hi:ui,{floor:Bt("#efd19c",e,.62),wall:Bt("#d9a64e",e),wallTop:Bt("#c48f3a",e),desk:Bt("#8a5a3c",e,.95),deskTop:Bt("#a0673f",e,.95),island:Nn,islandTop:on,grass:Bt("#d8bf86",e),dirt:Bt("#a8764a",e),terrace:Bt("#e6c9a0",e),plant:Zu}),_w=e=>e.o;function vw(e,t,n,i,s){const a=Math.hypot(i.x-n.x,i.z-n.z),o=new Wt;o.position.set((n.x+i.x)/2,1.3,(n.z+i.z)/2),o.rotation.y=-Math.atan2(i.z-n.z,i.x-n.x),t.add(o);const r=a/6;for(let c=-1;c<=1;c++)e.add(new cr(r,.06,6,12,Math.PI),e.mat(s),o,c*2*r,c===0?.12:0,0);e.add(e.style.box(a,.08,.14),e.mat(s),o,0,.32,0)}function Mw(e){const{k:t,root:n}=e,i=_w(e),{x0:s,W:a,D:o,yard:r}=i,c=t.pal.pendants;ur(t,n,i,Ai(t,t.pal.floor,a,o,1,(x,m)=>{x.strokeStyle=Bt("#d9b97c",c,.62),x.lineWidth=2,x.strokeRect(1,1,m-2,m-2)}));const l=Ai(t,Bt("#e8cf9f",c,.62),r.x1-r.x0,r.z1-r.z0,1.2,(x,m)=>{x.strokeStyle=Bt("#c9a66c",c,.62),x.lineWidth=2,x.strokeRect(1,1,m-2,m-2),x.strokeRect(m/2,1,m/2-1,m/2)});t.add(t.style.box(r.x1-r.x0,.02,r.z1-r.z0),l,n,(r.x0+r.x1)/2,.03,(r.z0+r.z1)/2),t.add(t.style.box(a+.2,1.8,.22),t.mat(t.pal.wall),n,s+a/2,.9,-.11),t.add(t.style.box(.22,1.1,o+.2),t.mat(Bt(Kc,c)),n,s-.11,.55,o/2);for(const x of[s+a*.45,s+a*.66]){t.add(t.style.box(1,.7,.4),t.mat(Bt("#e0b25c",c)),n,x,1.5,.2),t.add(t.style.box(.7,.5,.02),Xu(t,"#c48f3a",.6),n,x,1.5,.41);for(let m=0;m<3;m++)for(let v=0;v<2;v++)t.add(t.style.ball(.05),t.mat("#5c3d2e"),n,x-.2+m*.2,1.4+v*.2,.42);t.add(t.style.box(1.1,.08,.5),t.mat(t.pal.wallTop),n,x,1.88,.2),t.add(t.style.cap(.28,.5),t.mat(Bt(bs,c)),n,x,1.92,.2)}const d=Bt(bs,c);for(const x of i.columns)t.add(t.style.cylinder(.09,1.3),t.mat(d),n,x.x,.65,x.z);const f=i.columns.filter(x=>x.x<s+2.3).sort((x,m)=>x.z-m.z),u=i.columns.filter(x=>x.x>s+a-2.3).sort((x,m)=>x.z-m.z),h=i.columns.filter(x=>Math.abs(x.z-6)<1e-6).sort((x,m)=>x.x-m.x);for(const x of[f,u,h])for(let m=1;m<x.length;m++)vw(t,n,x[m-1],x[m],d);const p=new Date().getDate();([[Ke,on,Nn],[Kc,on,"#7cc26b"],["#7b5fc0",Ke,"#fffaf0"]][p%3]??[Ke,on,Nn]).forEach((x,m)=>{for(let v=0;v<8;v++){const y=v*Math.PI/4;t.add(t.style.box(.14-m*.02,.01,.07),t.mat(x),n,i.door.x+Math.cos(y)*(.42-m*.13),.04+m*.002,o-.75+Math.sin(y)*(.42-m*.13)).rotation.y=-y}}),t.add(t.style.cylinder(.08,.01),t.mat("#fffaf0"),n,i.door.x,.045,o-.75)}function yw(e){const{k:t,root:n,o:i}=e,s=(i.island.x0+i.island.x1)/2,a=(i.island.z0+i.island.z1)/2;t.add(t.style.box(1.7,.6,.8),t.mat(Nn),n,s,.42,a),t.add(t.style.box(1.8,.06,.9),t.mat(on),n,s,.75,a);for(const o of[-.6,.6])t.add(t.style.cylinder(.2,.06),t.mat(N.dark),n,s+o,.2,a+.42).rotation.x=Math.PI/2;t.add(t.style.cylinder(.13,.04),Xu(t,Ke,1.4),n,s-.4,.8,a),t.add(t.style.cylinder(.12,.2),t.mat("#b08a3c"),n,s-.4,.92,a);for(let o=0;o<5;o++)t.add(t.style.cylinder(.04,.08),t.mat("#a8764a"),n,s+.15+o*.13,.82,a+.15);for(const o of[-.8,.8])t.add(t.style.cylinder(.03,1.1),t.mat("#6b4a32"),n,s+o,1.3,a-.35);for(let o=0;o<6;o++)t.add(t.style.box(.3,.03,.9),t.mat(o%2?"#fffaf0":Ke),n,s-.75+o*.3,1.86,a+.05).rotation.x=.25}function bw(e){const{k:t,o:n}=e,i=n.lounge.map(r=>r.x),s=e.stage(3);if(s&&i.length){const r=Math.min(...i)-.5,c=Math.max(...i)+.5;for(let l=0;l<8;l++)t.add(t.style.box(c-r,.02,.3),t.mat([Kc,on,Nn,bs][l%4]??on),s,(r+c)/2,.035,.6+l*.3)}xr(e,(r,c,l)=>{t.add(t.style.box(.58,.16,.58),t.mat(bx[l%4]??Ke),r,(c.x0+c.x1)/2,.1,(c.z0+c.z1)/2)});const a=e.stage(8),o=n.lounge.map(r=>r.z);if(a&&i.length){const r=Math.min(...i)-n.x0<n.x0+n.W-Math.max(...i)?1:-1,c=r===1?n.x0:n.x0+n.W,l=(Math.min(...o)+Math.max(...o))/2,d=f=>c+r*f;for(const f of[-1.2,1.2])t.add(t.style.cylinder(.07,1.6),t.mat("#6b4a32"),a,d(.3),.8,l+f);t.add(t.style.box(.1,.1,2.6),t.mat("#6b4a32"),a,d(.3),1.6,l);for(const f of[-.7,.7])t.add(t.style.cylinder(.012,1),t.mat("#b08a3c"),a,d(.3),1.1,l+f);t.add(t.style.box(.45,.08,1.6),t.mat("#8a5a3c"),a,d(.3),.6,l),t.add(t.style.box(.06,.35,1.6),t.mat("#8a5a3c"),a,d(.11),.8,l)}}function Xf(e,t,n,i,s){const a=new Wt;a.position.set(n,0,i),a.scale.setScalar(s),t.add(a),e.add(e.style.cylinder(.17,1.1),e.mat("#7a6a58"),a,0,.55,0),e.add(e.style.ball(.6),e.mat(Zu),a,0,1.35,0).scale.set(1.3,.6,1.1);const o=2+Ae(`${n.toFixed(1)}${i.toFixed(1)}`)%3;for(let r=0;r<o;r++)e.add(e.style.cylinder(.025,1.2),e.mat("#8a7a68"),a,Math.cos(r*2.1)*.6,.6,Math.sin(r*2.1)*.45)}const Sw={1:(e,t,n)=>{e.add(e.style.box(.42,.42,.42),e.mat(bs),t,n.x,.21,n.z),e.add(e.style.box(.46,.05,.46),e.mat(Ke),t,n.x,.43,n.z),$u(e,t,n.x,n.z,bs,Zu,.25)},2:(e,t,n,i)=>{for(let a=0;a<4;a++)e.add(e.style.cylinder(.035,.09),e.style.material("#e9d7b0",{opacity:.85}),t,n.x-.65+a*.12,.83,n.z-.22);const s=pi(i.o)[0];s&&Xf(e,t,s.x,s.z,.8+i.grow.garden*.06)},3:()=>{},4:(e,t,n)=>{const i=.04+e.style.pictureZ;e.add(e.style.box(1.7,.95,.05),e.mat("#8a5a3c"),t,n.x,1.05,i),e.add(e.style.box(1.55,.8,.02),e.mat("#2b3a2f"),t,n.x,1.05,i+.03);const s=Ns(Ae("slate"));for(let a=0;a<4;a++)e.add(e.style.box(.4+s()*.6,.04,.01),e.mat("#fffaf0"),t,n.x-.3+s()*.2,1.3-a*.16,i+.05)},5:(e,t,n)=>{const i=.02+e.style.pictureZ;e.add(e.style.box(3.6,.8,.02),e.mat("#f3e2b8"),t,n.x,1.2,i),e.add(e.style.ball(.22),e.mat("#9a958c"),t,n.x-.6,1.15,i+.02).scale.set(1.4,.9,.1),e.add(e.style.ball(.12),e.mat("#9a958c"),t,n.x-.25,1.28,i+.02).scale.z=.1;for(let o=0;o<6;o++)e.add(e.style.ball(.07),e.mat(o%2?Ke:Nn),t,n.x+.3+o*.22,1.1+o%2*.15,i+.02).scale.z=.2;const a=n.x+2.4;e.add(e.style.box(.55,.22,.3),e.mat("#8a5a3c"),t,a,.11,.3);for(let o=0;o<6;o++)e.add(e.style.box(.07,.02,.1),e.mat(o%2?N.ink:"#fffaf0"),t,a-.2+o*.08,.23,.38)},6:(e,t,n,i)=>{e.add(e.style.cylinder(.22,.03),e.mat("#c9ccd3"),t,n.x+.45,.8,n.z-.15);for(let r=0;r<5;r++)e.add(e.style.cylinder(.05,.04),e.mat([on,"#7cc26b",Ke,"#fffaf0","#a8764a"][r]??on),t,n.x+.45+Math.cos(r*1.25)*.13,.83,n.z-.15+Math.sin(r*1.25)*.13);const o=i.o.columns.filter(r=>Math.abs(r.z-6)<1e-6).map(r=>r.x);if(o.length>1)for(let r=Math.min(...o);r<Math.max(...o);r+=.16)e.add(e.style.ball(.05),e.mat(Math.round(r*6)%3?Ke:on),t,r,1.5-Math.abs(Math.sin((r-(o[0]??0))*1.85))*.2,6)},7:(e,t,n)=>{for(const[i,s]of[[-.45,-.45],[.45,-.45],[-.45,.45],[.45,.45]])e.add(e.style.cylinder(.06,1.1),e.mat(bs),t,n.x+i,.55,n.z+s);e.add(e.style.box(1.15,.1,1.15),e.mat("#c48f3a"),t,n.x,1.12,n.z),e.add(e.style.cap(.48,.5),e.mat(bs),t,n.x,1.17,n.z),Sn(e,t,.06,.25,on,n.x,1.75,n.z)},8:(e,t,n,i)=>{for(const s of pi(i.o).slice(1))Xf(e,t,s.x,s.z,.8+i.grow.garden*.06)},9:(e,t,n)=>{Pl(e,t,n,"#8a5a3c","#efd19c");for(const[i,s]of[[-.35,-.35],[.35,-.35],[-.35,.35],[.35,.35]])e.add(e.style.cylinder(.04,.01),e.mat(N.ink),t,n.x+i,.39,n.z+s);for(let i=0;i<7;i++)e.add(e.style.cylinder(.03,.02),e.mat(i%2?N.ink:"#fffaf0"),t,n.x+Math.cos(i)*.08,.4,n.z+Math.sin(i)*.08)},10:(e,t,n)=>{for(let i=0;i<4;i++)e.add(e.style.box(1.6-i*.35,.06,1.6-i*.35),e.mat(i%2?"#d9b97c":"#c9a66c"),t,n.x,.05-i*.04,n.z);e.add(e.style.box(.5,.02,.5),e.style.material("#5aa9a0",{emissive:"#5aa9a0",ei:.1}),t,n.x,-.1,n.z)},11:(e,t,n)=>{for(const i of[-.8,.8])for(const s of[-.4,.4])e.add(e.style.cylinder(.03,1.2),e.mat("#8a7a68"),t,n.x+i,.6,n.z+s);e.add(e.style.box(1.6,1.1,.8),e.style.material("#fffaf0",{opacity:.25}),t,n.x,.6,n.z);for(let i=0;i<3;i++)e.add(e.style.cylinder(.015,.4),e.mat("#e9d7b0"),t,n.x-.6,.2,n.z-.06+i*.06)},12:(e,t,n)=>{qu(e,t,n,"#5aa9a0","#d9b97c");for(let i=0;i<5;i++)e.add(e.style.cylinder(.14,.01),e.mat("#4f8a3e"),t,n.x-.6+i*.3,.05,n.z+Math.sin(i*2)*.3),i%2===0&&e.add(e.style.ball(.07),e.mat("#fffaf0"),t,n.x-.6+i*.3,.1,n.z+Math.sin(i*2)*.3)},13:(e,t,n)=>{Ic(e,t,n,Ke,on,2.6),Ic(e,t,{x:n.x-1.2,z:n.z+1.4},Nn,"#fffaf0",2.2),Ic(e,t,{x:n.x-.4,z:n.z+2.6},"#7b5fc0",on,2.9)},14:(e,t,n)=>{Mr(e,t,n,(i,s)=>{e.add(e.style.ball(.16),i,t,n.x,s+.25,n.z).scale.set(1,1.3,.9),e.add(e.style.capsule(.05,.25),i,t,n.x,s+.5,n.z+.05),e.add(e.style.ball(.07),i,t,n.x,s+.68,n.z+.08);for(let a=0;a<7;a++){const o=e.add(e.style.box(.08,.55,.02),i,t,n.x+Math.sin((a-3)*.3)*.25,s+.45,n.z-.2);o.rotation.z=(a-3)*.3}})}};function ww(e,t,n,i,s,a,o){if(e.add(e.style.box(.26,.3,.02),e.mat(o?N.gold:"#b08a3c"),t,n,i,s),e.add(e.style.box(.2,.24,.01),e.mat(o?"#d8e4ec":[Nn,"#7b5fc0",Ke,Kc][a%4]??Nn),t,n,i,s+.015),o)for(let r=0;r<3;r++)e.add(e.style.box(.05,.05,.01),e.mat(N.gold),t,n-.06+r*.06,i+r%2*.06,s+.02)}const Sx=(e,t)=>xi(e)[Math.min(t,14)]??e.door;function Ew(e){gr(e,e.k.pal.terrace,[Ke,"#fffaf0",Nn]),vr(e,Sw,Sx);const t=xi(e.o)[4]?.x??e.o.x0+e.o.W/2;_r(e,{xa:t+1.1,xb:e.o.x0+e.o.W*.45-.6,y:1},ww)}function Tw(e){const t=[Ke,on,Nn][Ae(e.name)%3]??Ke,n=e.add(new cr(.18,.08,8,18),e.mat(t),e.head,0,.13,-.01);n.rotation.x=Math.PI/2,n.scale.set(1.05,1,1.2),e.add(e.style.ball(.17),e.mat(t),e.head,0,.19,-.02).scale.y=.55}const Aw={id:"haveli",pal:gw,shell:Mw,island:yw,lounge:bw,desk:(e,t,n)=>pr(e,t,n,{mat:bx[Ae(n)%4]}),mainDesk:e=>mr(e,"#a0673f","#6b4a32"),tree:({k:e},t,n,i,s)=>{Xf(e,t,n,i,s)},growth:Ew,pieceAt:Sx,wear:Tw},Ku="#2f7a4a",Jc="#5fa84a",Rs="#2f5fa7",ln="#e9c46a",Qc="#7cc26b",zw="#5b3a7a",Gh=[["#2a9d8f",ln,"#fffaf0"],[Rs,Qc,"#fffaf0"],["#f28c28",ln,"#fffaf0"]],Rw=e=>hr(e?hi:ui,{floor:Bt("#d8d2c6",e,.55),wall:Bt("#e8e4dc",e,.55),wallTop:Bt("#b9b3a8",e),desk:Bt("#8a5a3c",e,.95),deskTop:Bt("#a0673f",e,.95),island:ln,islandTop:Bt("#fffaf0",e,.8),grass:Bt("#7fbf5a",e),dirt:Bt("#8a6a4a",e),terrace:Bt("#f3efe4",e,.55),plant:Ku}),Cw=e=>e.o;function wx(e,t,n,i){e.add(e.style.cylinder(.18,.32),e.mat(ln),t,n,.16,i);for(let s=0;s<6;s++){const a=e.add(e.style.ball(.2),e.mat(Ku),t,n+Math.sin(s)*.18,.5+s%2*.15,i+Math.cos(s)*.18);a.scale.set(1.2,.3,.9),a.rotation.y=s}}function Pw(e){const{k:t,root:n}=e,i=Cw(e),{x0:s,W:a,D:o}=i,r=t.pal.pendants;ur(t,n,i,Ai(t,t.pal.floor,a,o,2,(u,h)=>{u.fillStyle=Bt("#cfc8bb",r,.55),u.fillRect(0,0,h,1),u.fillRect(0,0,1,h)}));const c=Ai(t,Bt("#f3efe4",r,.6),a,1,2,(u,h)=>{u.fillStyle="#5c677d",u.beginPath(),u.moveTo(0,h);for(let p=0;p<=h;p+=2)u.lineTo(p,h*.55+Math.sin(p/h*Math.PI*2)*h*.2);u.lineTo(h,h),u.fill()});t.add(t.style.box(a,.02,1),c,n,s+a/2,.03,o-.5),t.add(t.style.box(a+.2,1.7,.2),t.mat(t.pal.wall),n,s+a/2,.85,-.1);const l=Ai(t,Bt("#e8e4dc",r,.55),a,1.6,.8,u=>{u.fillStyle=Bt("#6b8f71",r);for(let h=0;h<2;h++)for(let p=0;p<2;p++)u.beginPath(),u.arc(16+h*32,16+p*32,11,0,7),u.fill()});t.add(t.style.box(a,1.6,.02),l,n,s+a/2,.85,.01),t.add(t.style.box(.2,1,o+.2),t.mat(t.pal.wall),n,s-.1,.5,o/2);const d=Ai(t,"#f3f6fb",o,1,.5,(u,h)=>{u.strokeStyle=Rs,u.lineWidth=4,u.beginPath(),u.moveTo(h/2,6),u.lineTo(h-6,h/2),u.lineTo(h/2,h-6),u.lineTo(6,h/2),u.closePath(),u.stroke()});t.add(t.style.box(.02,.9,o),d,n,s+.01,.5,o/2);const f=i.lounge.map(u=>u.x);if(f.length){const u=Math.min(...f)-.7,h=Math.max(...f)+.7;for(const p of[u,h])t.add(t.style.cylinder(.05,1.95),t.mat("#d8d2c6"),n,p,.97,3);t.add(t.style.box(h-u+.2,.08,3.1),t.mat(Bt("#f3efe4",r,.7)),n,(u+h)/2,1.97,1.5)}for(const u of i.paths)for(let h=1;h<u.length-1;h+=3){const p=u[h];p&&wx(t,n,p.x+.78,p.z+2.05)}t.add(t.style.ball(.13),t.mat("#fffaf0"),n,i.door.x-.8,.13,o-.6)}function Lw(e){const{k:t,root:n,o:i}=e,s=i.island,a=(s.x0+s.x1)/2;Fs(t,n,{x0:s.x0+.05,x1:s.x1-.05,z0:s.z0,z1:s.z1},.62,t.pal.island),Fs(t,n,{x0:s.x0-.05,x1:s.x1+.05,z0:s.z0-.05,z1:s.z1+.05},.07,t.pal.islandTop,.62),t.add(t.style.box(.25,.12,.25),t.mat(N.dark),n,a,.75,s.z0+.5),t.add(t.style.cylinder(.1,.3),t.style.material("#cfe8ee",{opacity:.7}),n,a,.95,s.z0+.5);for(const o of i.islandSpots)t.add(t.style.cylinder(.04,.6),t.mat(N.metal),n,o.x,.3,o.z),t.add(t.style.cylinder(.18,.06),t.mat(Rs),n,o.x,.62,o.z)}function Iw(e){const{k:t}=e;xr(e,(n,i,s)=>{const a=(i.x0+i.x1)/2,o=(i.z0+i.z1)/2,r=Gh[s%3]??Gh[0];if(s<4){t.add(t.style.cylinder(.01,1.2),t.mat("#b9b3a8"),n,a,1.35,o);const c=t.add(t.style.cap(.32,.5),t.mat(r[0]),n,a,.75,o);c.rotation.x=Math.PI;return}for(const c of[-.45,.45])t.add(t.style.cylinder(.04,1.2),t.mat("#d8d2c6"),n,a,.6,o+c);for(let c=0;c<7;c++){const l=c/6,d=t.add(t.style.box(.5,.04,.14),t.mat(r[c%3]??ln),n,a,.75-Math.sin(l*Math.PI)*.35,o-.4+l*.8);d.rotation.x=-Math.cos(l*Math.PI)*.5}})}function $f(e,t,n,i,s){const a=new Wt;if(a.position.set(n,0,i),a.scale.setScalar(s),t.add(a),Ae(`${n.toFixed(1)}${i.toFixed(1)}`)%2){e.add(e.style.cylinder(.08,1.7),e.mat("#a0673f"),a,0,.85,0);for(let o=0;o<6;o++)e.add(e.style.box(.9,.04,.2),e.mat(Jc),a,Math.cos(o)*.3,1.65,Math.sin(o)*.3).rotation.y=o;return}e.add(e.style.cylinder(.1,1.3),e.mat("#8a9a5a"),a,0,.65,0);for(let o=0;o<6;o++)e.add(e.style.box(.25,.03,1),e.mat(Jc),a,Math.sin(o)*.35,1.4,Math.cos(o)*.35).rotation.set(.5*Math.cos(o),o,.5*Math.sin(o))}const Dw={1:(e,t,n)=>{wx(e,t,n.x,n.z)},2:(e,t,n,i)=>{for(let a=0;a<3;a++)e.add(e.style.cylinder(.09,.07),e.mat("#fffaf0"),t,n.x,.73,n.z-.5+a*.35),e.add(e.style.ball(.07),e.mat(zw),t,n.x,.77,n.z-.5+a*.35).scale.y=.4;const s=pi(i.o)[0];s&&$f(e,t,s.x,s.z,.8+i.grow.garden*.06)},3:()=>{},4:(e,t,n)=>{const i=.05+e.style.pictureZ;e.add(e.style.box(1.7,.95,.05),e.mat("#c9c3b6"),t,n.x,1.05,i),e.add(e.style.box(1.6,.85,.02),e.mat(N.paper),t,n.x,1.05,i+.03);for(let s=0;s<4;s++)e.add(e.style.box(.5+s%3*.2,.04,.01),e.mat(N.board[s]??N.marker),t,n.x-.3,1.3-s*.16,i+.05)},5:(e,t,n)=>{const i=.04+e.style.pictureZ;for(let a=0;a<10;a++)for(let o=0;o<3;o++)e.add(e.style.box(.34,.24,.02),e.mat((a+o)%2?"#f3f6fb":Rs),t,n.x-1.7+a*.36,.95+o*.26,i);const s=n.x+2.3;e.add(e.style.ball(.12),e.mat("#c98a3e"),t,s,.35,.3).scale.set(1,1.2,.4),e.add(e.style.box(.05,.4,.03),e.mat("#6b4a32"),t,s,.62,.3)},6:(e,t,n,i)=>{for(let s=0;s<6;s++)e.add(e.style.ball(.08),e.mat(["#f28c28",ln,Qc][s%3]??ln),t,n.x-.15+s%3*.15,.76+Math.floor(s/3)*.08,n.z+1.6);for(let s=0;s<6;s++){const a=i.o.x0-.4,o=2+s*(i.o.D/6);e.add(e.style.cylinder(.03,.7),e.mat(Jc),t,a,.35,o);for(let r=0;r<3;r++)Sn(e,t,.06,.18,r%2?ln:"#f28c28",a+.05,.55+r*.12,o).rotation.z=1.2}},7:(e,t,n)=>{e.add(e.style.cylinder(.04,1.8),e.mat("#8a5a3c"),t,n.x,.9,n.z),Sn(e,t,1,.45,"#d9b86a",n.x,1.9,n.z),Fs(e,t,{x0:n.x+.9,x1:n.x+1.6,z0:n.z-.3,z1:n.z+.3},.8,"#d9b86a");for(let i=0;i<4;i++)e.add(e.style.ball(.1),e.mat(Qc),t,n.x+1.05+i%2*.3,.9,n.z-.12+Math.floor(i/2)*.24)},8:(e,t,n,i)=>{for(const s of pi(i.o).slice(1))$f(e,t,s.x,s.z,.8+i.grow.garden*.06)},9:(e,t,n)=>{e.add(e.style.box(2.2,.02,1.3),e.mat("#5fb35a"),t,n.x,.02,n.z),e.add(e.style.box(.03,.01,1.2),e.mat("#fffaf0"),t,n.x,.04,n.z);for(const i of[-1,1]){for(const s of[-.3,.3])e.add(e.style.box(.04,.4,.04),e.mat("#fffaf0"),t,n.x+i*1.05,.2,n.z+s);e.add(e.style.box(.04,.04,.64),e.mat("#fffaf0"),t,n.x+i*1.05,.4,n.z)}e.add(e.style.ball(.09),e.mat("#fffaf0"),t,n.x+.3,.09,n.z+.2)},10:(e,t,n)=>{for(let i=0;i<3;i++){const s=e.add(e.style.cylinder(.55,.04),e.style.material("#6cb4ee",{emissive:"#6cb4ee",ei:.1}),t,n.x+Math.sin(i*2.1)*.35,.02,n.z-.5+i*.5);s.scale.x=1.2}},11:(e,t,n)=>{e.add(e.style.cylinder(.25,.45),e.mat("#c9ccd3"),t,n.x,.23,n.z),e.add(e.style.cylinder(.26,.03),e.mat("#fffaf0"),t,n.x,.47,n.z),e.add(e.style.cylinder(.16,.25),e.mat(Rs),t,n.x+.5,.13,n.z+.2),e.add(e.style.cylinder(.14,.04),e.mat(ln),t,n.x-.45,.3,n.z+.25).rotation.x=1.2},12:(e,t,n)=>{qu(e,t,n,"#5aa9a0","#cfc8bb");for(let i=0;i<4;i++)e.add(e.style.cylinder(.3,.02),e.mat(Jc),t,n.x-.5+i*.35,.05,n.z+Math.sin(i*2)*.25)},13:(e,t,n)=>{Ic(e,t,n,"#f28c28",Rs,2.8)},14:(e,t,n)=>{Mr(e,t,n,(i,s)=>{e.add(e.style.cylinder(.12,.1),i,t,n.x,s+.05,n.z),e.add(e.style.cylinder(.04,.3),i,t,n.x,s+.25,n.z),e.add(e.style.cap(.22,.5),i,t,n.x,s+.42,n.z).rotation.x=Math.PI;for(const a of[-1,1])e.add(e.style.box(.05,.2,.05),i,t,n.x+a*.25,s+.55,n.z)})}};function Nw(e,t,n,i,s,a,o){e.add(e.style.box(.28,.28,.02),e.mat(o?N.gold:["#2a9d8f",ln,Rs,"#f28c28"][a%4]??ln),t,n,i,s);const r=e.add(e.style.cylinder(.1,.01),e.mat(o?N.gold:N.dark),t,n+.06,i,s+.015);r.rotation.x=Math.PI/2}const Ex=(e,t)=>xi(e)[Math.min(t,14)]??e.door;function Uw(e){gr(e,e.k.pal.terrace,["#2a9d8f",ln,"#fffaf0"]),vr(e,Dw,Ex);const t=xi(e.o)[4]?.x??e.o.x0+e.o.W/2,n=Math.min(...e.o.lounge.map(i=>i.x));_r(e,{xa:t+1.1,xb:n-1,y:1.45},Nw)}function Ow(e){for(const t of e.legs)e.add(e.style.box(.15,.06,.24),e.mat(Qc),t,0,-.29,.04),e.add(e.style.box(.16,.02,.25),e.mat(ln),t,0,-.32,.04)}const Fw={id:"tropical",pal:Rw,shell:Pw,island:Lw,lounge:Iw,desk:(e,t,n)=>pr(e,t,n,{thing:(i,s,a)=>{a%4===1&&$u(i,s,-.5,.4,ln,Ku,.2)}}),mainDesk:e=>mr(e,"#a0673f","#6b4a32"),tree:({k:e},t,n,i,s)=>{$f(e,t,n,i,s)},growth:Uw,pieceAt:Ex,wear:Ow},Be="#2f5fa7",Ie="#fbfaf6",Ju="#8a9a6a",Hh="#c9a66c",Bw="#6b9f3a",qf="#3d8fd1",Gw=e=>hr(e?hi:ui,{floor:Bt("#e8e2d4",e,.55),wall:Bt(Ie,e,.55),wallTop:Bt("#e8e4dc",e,.55),desk:Bt(Be,e,.9),deskTop:Bt(Ie,e,.75),island:Be,islandTop:Bt(Ie,e,.75),grass:Bt("#d8c9a0",e),dirt:Bt("#b39a72",e),terrace:Bt("#ece6d8",e,.6),plant:Ju}),Tx=e=>e.o;function Hw(e,t,n,i,s,a){const o=e.mat(e.pal.wall),r=e.mat(Bt(Be,e.pal.pendants)),c=s/2,l=i-.55;e.add(e.style.box(s+.1,.02,2.6),e.mat(Bt("#f7f4ec",e.pal.pendants,.6)),t,n,.035,i+.65),e.add(e.style.box(s+.1,1.5,.22),o,t,n,.75,l),e.add(e.style.box(.22,1.2,2.4),o,t,n-c-.05,.6,i+.65),e.add(e.style.box(.5,.45,.04),r,t,n+c-.6,1,l+.12),e.add(e.style.box(.04,.85,.5),r,t,n-c+.08,.45,i+1.3),a&&(e.add(e.style.cylinder(.55,.35),o,t,n-c+.8,1.65,l),e.add(e.style.cap(.55,.5),r,t,n-c+.8,1.82,l),e.add(e.style.box(.05,.3,.05),e.mat("#e9c46a"),t,n-c+.8,2.5,l))}function Vw(e){const{k:t,root:n}=e,i=Tx(e),{x0:s,W:a,D:o}=i,r=t.pal.pendants,c=t.add(t.style.box(90,.02,90),t.style.material(r?"#16304a":qf),n,s+a/2,-1.4,o/2);c.receiveShadow=!1,ur(t,n,i,Ai(t,t.pal.floor,a,o,1.5,(d,f)=>{for(let u=0;u<40;u++)d.fillStyle=u%3?Bt(Ie,r,.6):"#5c677d",d.beginPath(),d.ellipse(u*37%f,u*53%f,4,2.5,u,0,7),d.fill()})),t.add(t.style.box(a+.2,.8,.25),t.mat(t.pal.wall),n,s+a/2,.4,-.12),t.add(t.style.box(.25,.8,o+.2),t.mat(t.pal.wall),n,s-.12,.4,o/2),i.cubes.forEach((d,f)=>{Hw(t,n,d.x,d.z,d.w,f===0)});const l=[...i.desks.values()].sort((d,f)=>d.z-f.z||d.x-f.x)[0];l&&(t.add(t.style.ball(.16),t.mat("#e9a65c"),n,l.x+.45,.62,l.z+.75).scale.set(1.4,.6,1),t.add(t.style.ball(.08),t.mat("#e9a65c"),n,l.x+.65,.66,l.z+.75));for(const d of[-.6,.6])t.add(t.style.box(.12,.9,.12),t.mat(t.pal.wall),n,i.door.x+d,.45,o-.05)}function Ww(e){const{k:t,root:n}=e,i=Tx(e);for(const r of i.posts)t.add(t.style.cylinder(.07,2.1),t.mat(Ie),n,r.x,1.05,r.z);const s=i.posts.map(r=>r.x),a=i.posts.map(r=>r.z),o=(Math.min(...s)+Math.max(...s))/2;for(let r=Math.min(...a);r<=Math.max(...a);r+=.18)t.add(t.style.box(2.4,.03,.08),t.mat(Hh),n,o,2.12,r);for(const r of i.tables){const c=(r.x0+r.x1)/2,l=(r.z0+r.z1)/2;t.add(t.style.cylinder(.42,.05),t.mat(Ie),n,c,.55,l),t.add(t.style.cylinder(.05,.55),t.mat(N.dark),n,c,.27,l)}for(const r of i.islandSpots){const c=new Wt;c.position.set(r.x,0,r.z),c.rotation.y=r.face,n.add(c),t.add(t.style.box(.38,.06,.38),t.mat(Hh),c,0,.32,0),t.add(t.style.box(.38,.4,.05),t.mat(Be),c,0,.52,-.18);for(const l of[-.16,.16])for(const d of[-.16,.16])t.add(t.style.box(.04,.3,.04),t.mat(Be),c,l,.15,d)}}function kw(e){const{k:t,o:n}=e,i=n.lounge.map(a=>a.x),s=e.stage(3);if(s&&i.length){const a=Math.min(...i)-.5,o=Math.max(...i)+.5;t.add(t.style.box(o-a,.3,.45),t.mat(t.pal.wall),s,(a+o)/2,.15,.3)}xr(e,(a,o)=>{t.add(t.style.box(.7,.12,.5),t.mat(Be),a,(o.x0+o.x1)/2,.08,(o.z0+o.z1)/2),t.add(t.style.box(.5,.2,.1),t.mat(Ie),a,(o.x0+o.x1)/2,.22,o.z0+.05)})}function Yf(e,t,n,i,s){const a=new Wt;a.position.set(n,0,i),a.scale.setScalar(s),t.add(a);const o=(Ae(`${n.toFixed(1)}${i.toFixed(1)}`)%9-4)*.05;e.add(e.style.cylinder(.1,.8),e.mat("#6b5a48"),a,0,.4,0).rotation.z=o,e.add(e.style.ball(.55),e.mat(Ju),a,o*.6,1.1,0).scale.set(1.2,.7,1)}const Xw={1:(e,t,n)=>{$u(e,t,n.x,n.z,Ie,"#5fb35a",.3)},2:(e,t,n,i)=>{e.add(e.style.box(.2,.08,.14),e.mat(Ie),t,n.x-.1,.62,n.z);for(let a=0;a<5;a++)e.add(e.style.ball(.035),e.mat("#4b3f2a"),t,n.x+.12+a%3*.06,.6,n.z-.05+Math.floor(a/3)*.08);const s=pi(i.o)[0];s&&Yf(e,t,s.x,s.z,.8+i.grow.garden*.06)},3:()=>{},4:(e,t,n)=>{const i=.13+e.style.pictureZ;e.add(e.style.box(1.7,.6,.05),e.mat(Be),t,n.x,.5,i),e.add(e.style.box(1.55,.48,.02),e.mat(Ie),t,n.x,.5,i+.03);for(let s=0;s<3;s++)e.add(e.style.box(.5+s*.25,.04,.01),e.mat(N.board[s]??Be),t,n.x-.3,.65-s*.13,i+.05)},5:(e,t,n)=>{for(let a=0;a<12;a++)e.add(e.style.box(.18,.04,.02),e.mat(Be),t,n.x-2+a*.36,.72,.02),e.add(e.style.box(.04,.14,.02),e.mat(Be),t,n.x-1.93+a*.36,.66,.02);const s=n.x+2.4;e.add(e.style.ball(.14),e.mat("#c98a3e"),t,s,.3,.3).scale.set(1,1.2,.5),e.add(e.style.box(.05,.55,.03),e.mat("#6b4a32"),t,s,.7,.3)},6:(e,t,n,i)=>{for(let a=0;a<4;a++)e.add(e.style.ball(.06),e.mat("#5b3a7a"),t,n.x+Math.cos(a*1.6)*.1,.6,n.z+2.1+Math.sin(a*1.6)*.1);const s=i.o;for(let a=0;a<14;a++)e.add(e.style.ball(.05),e.mat(a%3?"#fffaf0":"#7cc26b"),t,s.x0+.5+a*(s.W/14),.82,-.05)},7:(e,t,n,i)=>{const s=i.o,a=s.posts.map(c=>c.x),o=s.posts.map(c=>c.z),r=(Math.min(...a)+Math.max(...a))/2;for(let c=0;c<9;c++)e.add(e.style.ball(.22),e.mat(Bw),t,r-.9+c%3*.9,2.2,Math.min(...o)+.4+Math.floor(c/3)*1.4).scale.y=.5;for(let c=0;c<4;c++)e.add(e.style.ball(.05),e.mat("#5b3a7a"),t,r-.6+c*.4,2.05,Math.min(...o)+1.2+c*.5)},8:(e,t,n,i)=>{e.add(e.style.box(1,.9,1),e.mat(i.k.pal.wall),t,n.x,.45,n.z),e.add(e.style.box(.3,.5,.02),e.mat(Be),t,n.x,.25,n.z+.51);for(const s of pi(i.o).slice(1))Yf(e,t,s.x,s.z,.8+i.grow.garden*.06)},9:(e,t,n)=>{Pl(e,t,n,"#8a5a3c","#e8d6b0");for(let i=0;i<6;i++)Sn(e,t,.04,.2,i%2?Ie:N.dark,n.x-.25+i*.1,.39,n.z-.2).rotation.x=Math.PI/2},10:(e,t,n)=>{e.add(e.style.cylinder(.45,.6),e.mat(Ie),t,n.x,.3,n.z),e.add(e.style.cylinder(.4,.05),e.mat(Be),t,n.x,.62,n.z)},11:(e,t,n,i)=>{e.add(e.style.box(1.4,1,1.2),e.mat(i.k.pal.wall),t,n.x,.5,n.z),e.add(e.style.box(1,.8,.9),e.mat(i.k.pal.wall),t,n.x+.1,1.4,n.z-.05),e.add(e.style.box(.3,.45,.02),e.mat(Be),t,n.x+.1,1.3,n.z+.41);for(let s=0;s<5;s++)e.add(e.style.box(.35,.2,.2),e.mat(Ie),t,n.x-.85,.1+s*.2,n.z+.5-s*.2)},12:(e,t,n)=>{e.add(e.style.box(1.8,.08,.4),e.mat("#c49a6c"),t,n.x,.05,n.z),e.add(e.style.box(1.2,.25,.45),e.mat(Be),t,n.x-.2,.15,n.z+.6).scale.set(1,1,1),e.add(e.style.box(1.1,.06,.4),e.mat(Ie),t,n.x-.2,.3,n.z+.6),e.add(e.style.box(.04,.6,.04),e.mat("#6b4a32"),t,n.x-.1,.6,n.z+.6)},13:(e,t,n)=>{e.add(e.style.cylinder(.5,1.6),e.mat(Ie),t,n.x,.8,n.z),Sn(e,t,.6,.45,"#a8764a",n.x,1.82,n.z);const i=new Wt;i.position.set(n.x,1.7,n.z+.55),t.add(i);for(let s=0;s<6;s++){const a=new Wt;a.rotation.z=s*Math.PI/3,i.add(a),e.add(e.style.box(.06,.9,.02),e.mat("#6b4a32"),a,0,.45,0),e.add(e.style.box(.22,.5,.01),e.mat(Ie),a,.12,.6,0)}},14:(e,t,n)=>{Mr(e,t,n,(i,s)=>{e.add(e.style.ball(.22),i,t,n.x,s+.3,n.z).scale.set(1,1.3,1),e.add(e.style.cylinder(.07,.25),i,t,n.x,s+.65,n.z);for(const a of[-1,1])e.add(e.style.box(.04,.2,.04),i,t,n.x+a*.12,s+.62,n.z)})}};function $w(e,t,n,i,s,a,o){e.add(e.style.box(.28,.24,.02),e.mat(o?N.gold:Be),t,n,i,s),e.add(e.style.box(.2,.16,.01),e.mat(o?"#e9c46a":[qf,"#e9c46a",Ju,Ie][a%4]??qf),t,n,i,s+.015)}const Ax=(e,t)=>{const n=xi(e);if(t===2||t===6){const i=e.tables[0];if(i)return{x:(i.x0+i.x1)/2,z:(i.z0+i.z1)/2}}return n[Math.min(t,14)]??e.door};function qw(e){gr(e,e.k.pal.terrace,[Be,Ie]),vr(e,Xw,Ax);const t=xi(e.o)[4]?.x??e.o.x0+e.o.W/2;_r(e,{xa:t+1.1,xb:e.o.mainDesk.x-.6,y:.95},$w)}function Yw(e){e.add(e.style.cylinder(.21,.12),e.mat("#2b3a67"),e.head,0,.2,0),e.add(e.style.box(.24,.025,.12),e.mat("#1d1a17"),e.head,0,.15,.2)}const Zw={id:"cyclades",pal:Gw,shell:Vw,island:Ww,lounge:kw,desk:(e,t,n)=>pr(e,t,n,{chair:Be}),mainDesk:e=>mr(e,Ie,Be),tree:({k:e},t,n,i,s)=>{Yf(e,t,n,i,s)},growth:qw,pieceAt:Ax,wear:Yw},Bs="#d9b86a",Ze="#6b4a32",Zf="#9a8a78",zx="#7a9a4a",Kf=[["#2a9d8f","#e9c46a"],["#f28c28","#2f5fa7"],["#7b5fc0","#e9c46a"]],Jf=["#2a9d8f","#f28c28","#e9c46a","#7b5fc0"],Kw=e=>hr(e?hi:ui,{floor:Bt("#dfaa72",e,.62),wall:Bt("#c98a4e",e),wallTop:Bt("#b07a42",e),desk:Bt(Ze,e,1.2),deskTop:Bt("#8a5a3c",e,1.2),island:Ze,islandTop:"#8a5a3c",grass:Bt("#c9a35a",e),dirt:Bt("#9a6a3e",e),terrace:Bt("#d9b07a",e),plant:zx}),Rx=e=>e.o;function Qu(e,t,n,i,s,a,o){for(let r=0;r<5;r++)e.add(e.style.box(s,.02,a/5),e.mat(r%2?o:Bs),t,n,.035,i-a/2+(r+.5)*(a/5))}function Cx(e,t,n,i,s,a){for(const o of[n,i])for(const r of[s,a])e.add(e.style.cylinder(.08,2),e.mat(Ze),t,o,1,r);for(let o=s;o<=a+.01;o+=1.8)e.add(e.style.cylinder(.018,i-n+.4),e.mat("#b08a5a"),t,(n+i)/2,2.02,o).rotation.z=Math.PI/2;for(let o=0;o<3;o++)e.add(e.style.box(i-n,.03,.4),e.mat(Bs),t,(n+i)/2,2.06,s+.5+o*(a-s-1)/2)}function Vh(e,t){const n=e.lounge.find(i=>Math.abs(i.x-t)<.6);return n?n.x+(t>=n.x?1:-1)*Math.abs(n.ax-n.x):t}function Jw(e){const{k:t,root:n}=e,i=Rx(e),{x0:s,W:a,D:o,hangar:r}=i,c=t.pal.pendants;ur(t,n,i,Ai(t,t.pal.floor,a,o,2,(h,p)=>{h.fillStyle=Bt("#d39a62",c,.62);for(let _=0;_<9;_++)h.fillRect(_*23%p,_*41%p,6,3)}));const l=t.mat(t.pal.wall);t.add(t.style.box(a+.2,1.5,.4),l,n,s+a/2,.75,-.2),t.add(t.style.box(.4,1.2,o+.2),l,n,s-.2,.6,o/2);for(let h=s+.6;h<s+a;h+=.9)t.add(t.style.cylinder(.035,.5),t.mat(Ze),n,h,1.2,.05).rotation.x=Math.PI/2;for(let h=s;h<=s+a+.01;h+=a/4)t.add(t.style.box(.55,1.8,.6),l,n,Vh(i,h),.9,-.15),Sn(t,n,.25,.5,t.pal.wall,Vh(i,h),2.05,-.15);Cx(t,n,r.x0,r.x1,r.z0,r.z1);for(const h of i.desks.values())Qu(t,n,h.x,h.z+.3,1.6,1.4,Jf[Ae(`${h.x}`)%4]??Bs);for(const[h,p]of[[s+a-.9,5],[s+a-.9,6.3]])t.add(t.style.cylinder(.4,1),l,n,h,.5,p),Sn(t,n,.55,.55,Bs,h,1.27,p);for(let h=0;h<3;h++)t.add(t.style.ball(.2),t.mat("#a8764a"),n,i.door.x+.8+h*.45,.2,o-.25).scale.y=1.1;const d=i.tree.x-1.8,f=i.tree.x+1.8,u=4.6;for(const h of[d,f])t.add(t.style.cylinder(.04,1.6),t.mat(Ze),n,h,.8,u);t.add(t.style.cylinder(.008,f-d),t.mat(N.dark),n,(d+f)/2,1.55,u).rotation.z=Math.PI/2,Kf.forEach(([h,p],_)=>{t.add(t.style.box(.9,.7,.01),t.mat(h),n,d+.75+_*1.1,1.15,u);for(let x=0;x<4;x++)t.add(t.style.box(.12,.12,.01),t.mat(p),n,d+.55+_*1.1+x%2*.4,1+Math.floor(x/2)*.3,u+.01)})}function Qw(e){const{k:t,root:n}=e,i=Rx(e),{x:s,z:a}=i.tree,o=e.grow.stage>=8;t.add(t.style.cylinder(o?.7:.55,2),t.mat(Zf),n,s,1,a);for(let l=0;l<5;l++){const d=l*1.3;t.add(t.style.cylinder(.1,1.1),t.mat(Zf),n,s+Math.sin(d)*.5,2.3,a+Math.cos(d)*.5).rotation.set(Math.cos(d)*.7,0,-Math.sin(d)*.7);const u=e.grow.garden>=3?"#6b9f3a":"#8a9a5a";t.add(t.style.ball(o?.45:.35),t.mat(u),n,s+Math.sin(d)*1,2.75,a+Math.cos(d)*1).scale.y=.55}const r=s+.55,c=a+.55;t.add(t.style.cylinder(.14,.2),t.mat(N.dark),n,r,.1,c),t.add(t.style.cylinder(.11,.03),Xu(t,"#f28c28",1.6),n,r,.21,c),t.add(t.style.ball(.08),t.mat("#5c677d"),n,r,.3,c);for(const l of i.islandSpots)t.add(t.style.cylinder(.15,.2),t.mat(Ze),n,l.x+Math.sin(l.face)*.05,.1,l.z+Math.cos(l.face)*.05)}function jw(e){const{k:t}=e;xr(e,(n,i,s)=>{const a=(i.x0+i.x1)/2,o=(i.z0+i.z1)/2;Qu(t,n,a,o,.75,.6,Jf[s%4]??Bs),t.add(t.style.capsule(.07,.4),t.mat(Jf[(s+1)%4]??Bs),n,a,.1,i.z0+.05).rotation.z=Math.PI/2})}function Qf(e,t,n,i,s){const a=new Wt;if(a.position.set(n,0,i),a.scale.setScalar(s),t.add(a),Ae(`${n.toFixed(1)}${i.toFixed(1)}`)%2){e.add(e.style.cylinder(.3,1.1),e.mat(Zf),a,0,.55,0),e.add(e.style.ball(.45),e.mat("#8a9a5a"),a,0,1.35,0).scale.y=.5;return}e.add(e.style.cylinder(.06,1),e.mat(Ze),a,0,.5,0),e.add(e.style.ball(.6),e.mat(zx),a,0,1.15,0).scale.set(1.3,.3,1.3)}const t3={1:(e,t,n)=>{e.add(e.style.cap(.22,.6),e.mat("#c98a3e"),t,n.x,.25,n.z).rotation.x=Math.PI;for(let i=0;i<5;i++)e.add(e.style.ball(.08),e.mat("#5fb35a"),t,n.x+Math.cos(i*1.3)*.1,.3,n.z+Math.sin(i*1.3)*.1)},2:(e,t,n,i)=>{const{x:s,z:a}=i.o.tree;e.add(e.style.cylinder(.22,.05),e.mat(Bs),t,s-.5,.05,a+.55);for(let r=0;r<4;r++)e.add(e.style.ball(.07),e.mat(r%2?"#e9c46a":"#f28c28"),t,s-.5+Math.cos(r*1.6)*.1,.11,a+.55+Math.sin(r*1.6)*.1).scale.set(1.2,.9,.9);const o=pi(i.o)[0];o&&Qf(e,t,o.x,o.z,.8+i.grow.garden*.06)},3:()=>{},4:(e,t,n)=>{const i=e.add(e.style.box(1.4,.9,.05),e.mat("#2b3a2f"),t,n.x,.45,.3);i.rotation.x=-.15,e.add(e.style.box(1.5,.06,.08),e.mat(Ze),t,n.x,.03,.36)},5:(e,t,n)=>{const i=.03+e.style.pictureZ;e.add(e.style.box(2.6,1,.02),e.mat("#6b4a32"),t,n.x,1,i);for(let a=0;a<12;a++)e.add(e.style.box(.14,.14,.01),e.mat("#e8d6b0"),t,n.x-1.1+a%6*.44,.75+Math.floor(a/6)*.5,i+.015);const s=n.x+2.4;e.add(e.style.ball(.22),e.mat("#c98a3e"),t,s,.25,.4).scale.z=.6,e.add(e.style.cylinder(.025,1.1),e.mat(Ze),t,s,.8,.35).rotation.x=-.2},6:(e,t,n,i)=>{const{x:s,z:a}=i.o.tree;e.add(e.style.box(.4,.04,.25),e.mat("#b08a3c"),t,s+.95,.2,a+.3);for(let o=0;o<3;o++)e.add(e.style.cylinder(.025,.07),e.style.material("#cfe8c3",{opacity:.8}),t,s+.83+o*.12,.26,a+.3)},7:(e,t,n)=>{Cx(e,t,n.x-1,n.x+1,n.z-.6,n.z+.6),Qu(e,t,n.x,n.z,1.6,1,"#2a9d8f")},8:(e,t,n,i)=>{for(const s of pi(i.o).slice(1))Qf(e,t,s.x,s.z,.8+i.grow.garden*.06)},9:(e,t,n)=>{e.add(e.style.box(1,.12,.35),e.mat(Ze),t,n.x,.06,n.z);for(let i=0;i<12;i++){const s=n.x-.4+i%6*.16,a=n.z-.08+Math.floor(i/6)*.16;e.add(e.style.cylinder(.05,.02),e.mat("#3b2a1e"),t,s,.13,a),e.add(e.style.ball(.02),e.mat("#e8d6b0"),t,s,.15,a)}},10:(e,t,n)=>{e.add(e.style.cylinder(.45,.55),e.mat("#c98a4e"),t,n.x,.27,n.z),e.add(e.style.cylinder(.32,.02),e.mat("#2b3a4a"),t,n.x,.56,n.z);for(const i of[-1,1])e.add(e.style.cylinder(.04,1.2),e.mat(Ze),t,n.x+i*.45,.6,n.z);e.add(e.style.cylinder(.03,1),e.mat(Ze),t,n.x,1.2,n.z).rotation.z=Math.PI/2,e.add(e.style.cylinder(.1,.06),e.mat(N.metal),t,n.x,1.15,n.z).rotation.x=Math.PI/2},11:(e,t,n)=>{Pl(e,t,n,Ze,"#8a5a3c"),e.add(e.style.box(.35,.18,.15),e.mat(N.dark),t,n.x-.1,.48,n.z),e.add(e.style.box(.08,.12,.12),e.mat(N.dark),t,n.x+.12,.62,n.z),e.add(e.style.cylinder(.08,.5),e.mat("#2a9d8f"),t,n.x+.25,.47,n.z+.25).rotation.z=Math.PI/2},12:(e,t,n)=>{const i=e.add(e.style.box(3.2,.03,.9),e.style.material("#5aa9a0",{emissive:"#5aa9a0",ei:.1}),t,n.x,.02,n.z);i.rotation.y=.3;const s=e.add(e.style.capsule(.14,.9),e.mat(Ze),t,n.x+.2,.1,n.z);s.rotation.z=Math.PI/2,s.scale.y=1,s.rotation.y=.3},13:(e,t,n)=>{for(let i=0;i<3;i++){const s=n.x-i*.7,a=2.6+i*.25,o=n.z+i*.6;e.add(e.style.capsule(.06,.25),e.mat("#fffaf0"),t,s,a,o).rotation.z=Math.PI/2;for(const r of[-1,1])e.add(e.style.box(.05,.02,.35),e.mat(N.dark),t,s,a+.03,o+r*.2);e.add(e.style.box(.12,.02,.02),e.mat("#f28c28"),t,s+.25,a,o)}},14:(e,t,n)=>{Mr(e,t,n,(i,s)=>{e.add(e.style.cylinder(.1,.25),i,t,n.x,s+.12,n.z),e.add(e.style.cap(.22,.55),i,t,n.x,s+.25,n.z).rotation.x=Math.PI,e.add(e.style.cylinder(.22,.25),i,t,n.x,s+.42,n.z)})}};function e3(e,t,n,i,s,a,o){e.add(e.style.box(.26,.32,.02),e.mat(o?N.gold:N.dark),t,n,i,s),e.add(e.style.box(.2,.26,.01),e.mat(a%2?"#d8d2c6":"#9a958c"),t,n,i,s+.015),e.add(e.style.ball(.05),e.mat(a%2?"#3a3530":"#1d1a17"),t,n,i+.04,s+.02).scale.z=.2,e.add(e.style.box(.1,.08,.01),e.mat(a%2?"#3a3530":"#1d1a17"),t,n,i-.06,s+.02)}const Px=(e,t)=>{const n=e.tree;return t===2||t===6?n:t===9?{x:n.x,z:n.z-2.4}:xi(e)[Math.min(t,14)]??e.door};function n3(e){gr(e,e.k.pal.terrace,["#2a9d8f","#e9c46a","#f28c28"]),vr(e,t3,Px);const t=xi(e.o)[4]?.x??e.o.x0+e.o.W/2;_r(e,{xa:t+1.1,xb:e.o.mainDesk.x-.6,y:1.25},e3)}function i3(e){const t=Ae(e.name),[n,i]=Kf[t%3]??Kf[0];e.add(e.style.capsule(.06,.3),e.mat(n),e.body,0,.74,.12).rotation.z=Math.PI/2;for(let s=0;s<3;s++)e.add(e.style.ball(.03),e.mat(i),e.body,-.12+s*.12,.76,.18)}const s3={id:"sahel",pal:Kw,shell:Jw,island:Qw,lounge:jw,desk:(e,t,n)=>pr(e,t,n,{chair:Ze}),mainDesk:e=>mr(e,"#8a5a3c",Ze),tree:({k:e},t,n,i,s)=>{Qf(e,t,n,i,s)},growth:n3,pieceAt:Px,wear:i3},Yn={flat:0,funbox:0,qp:0,curb:3,rail:5,ramp:7,stairs:9,ledge:9,bowl:11,vert:13},Ia=(e,t)=>Yn[t]<=e&&!(t==="qp"&&e>=Yn.vert),ju=(e,t)=>t>=Yn.vert?e.qp.r13:e.qp.r,jf=(e,t)=>{const n=Math.max(0,Math.min(t,e));return t-Math.sqrt(Math.max(0,t*t-n*n))};function jc(e,t){const{xa:n,xb:i,r:s}=e.ramp;return t<n+s?jf(n+s-t,s):t>i-s?jf(t-(i-s),s):0}function Ll(e,t,n){const i=Math.abs(t-e.x)-(e.hw-e.rc),s=Math.abs(n-e.z)-(e.hd-e.rc);return e.rc-Math.hypot(Math.max(i,0),Math.max(s,0))-Math.min(Math.max(i,s),0)}function Lx(e,t){if(t<=0)return 0;if(t>=e.depth)return-e.depth;const n=e.depth-t;return-Math.sqrt(e.depth*e.depth-n*n)}function tl(e,t,n){const i=Math.cos(n),s=Math.sin(n);let a=0,o=Math.max(e.hw,e.hd);for(let r=0;r<24;r++){const c=(a+o)/2;Ll(e,e.x+i*c,e.z+s*c)>t?a=c:o=c}return{x:e.x+i*a,z:e.z+s*a}}const lo=(e,t)=>({box:e,top:t,flat:!1}),fo=(e,t)=>({box:e,top:()=>t,flat:!0}),Ix=.55,tu={curb:.35,rail:.05,ledge:.6};function a3(e,t){const n=[];for(const o of e.poles)n.push(fo({x0:o.x-.05,x1:o.x+.05,z0:o.z-.05,z1:o.z+.05},3));for(const o of e.benches)n.push(fo(o,.35));const i=e.funbox;n.push(lo({x0:i.x-i.hw-i.run,x1:i.x+i.hw+i.run,z0:i.z-i.hd,z1:i.z+i.hd},o=>{const r=Math.abs(o-i.x);return r<=i.hw?i.h:i.h*Math.max(0,1-(r-i.hw)/i.run)}));const s=e.qp,a=ju(e,t);n.push(lo({x0:s.x0,x1:s.x1,z0:s.zLip-Ix,z1:s.zLip+a},(o,r)=>r<=s.zLip?a:jf(s.zLip+a-r,a)));for(const o of["curb","rail","ledge"]){if(!Ia(t,o))continue;const r=e[o];n.push(fo({x0:r.x0,x1:r.x1,z0:r.z-tu[o]/2,z1:r.z+tu[o]/2},r.h))}if(Ia(t,"ramp")){const o=e.ramp;n.push(lo({x0:o.xa-.6,x1:o.xb+.6,z0:o.z0,z1:o.z1},r=>r<=o.xa||r>=o.xb?o.r:jc(e,r)))}if(Ia(t,"stairs")){const o=e.stairs;n.push(fo({x0:o.x0,x1:o.bankX0,z0:o.z0,z1:o.z1},o.h)),n.push(lo({x0:o.bankX0,x1:o.xTop,z0:o.z0,z1:o.bankZ},(l,d)=>d<=o.z1?o.h:o.h*(o.bankZ-d)/(o.bankZ-o.z1)));const r=(o.xBottom-o.xTop)/4;for(let l=0;l<4;l++)n.push(fo({x0:o.xTop+r*l,x1:o.xTop+r*(l+1),z0:o.z0,z1:o.z1},o.h-(l+1)*(o.h/5)));const c=Dx(o);n.push(lo({x0:o.xTop,x1:o.xBottom,z0:o.railZ-.03,z1:o.railZ+.03},l=>c.top+(c.low-c.top)*(l-o.xTop)/(o.xBottom-o.xTop)))}return n}const Dx=e=>({top:e.h+.4,low:.55}),Wh=(e,t,n)=>Math.max(t,Math.min(n,e));function Nx(e,t,n,i,s){let a=Ia(t,"bowl")?Lx(e.bowl,Ll(e.bowl,n,i)):0;for(const o of Hx(e,t)){const r=o.box;n<r.x0-s||n>r.x1+s||i<r.z0-s||i>r.z1+s||(a=Math.max(a,o.top(Wh(n,r.x0,r.x1),Wh(i,r.z0,r.z1))))}return a}const Zn=(e,t,n,i)=>Nx(e,t,n,i,0);function ec(e,t,n,i){let s=Ia(t,"bowl")?Lx(e.bowl,Ll(e.bowl,n,i)):0;for(const a of Hx(e,t)){const o=a.box;a.flat||n<o.x0||n>o.x1||i<o.z0||i>o.z1||(s=Math.max(s,a.top(n,i)))}return s}const o3=.35,sr=e=>(e%2===0?-1:1)*o3,r3=.45,Ma=.45,Ux=(e,t)=>e[t].z-tu[t]/2-r3,t0=e=>(e.z0+e.z1)/2-.2,Ox=(e,t)=>({x:(e.ramp.xa+e.ramp.xb)/2+sr(t)*.6,z:e.ramp.z1+.6}),Fx=(e,t,n)=>({x:(e.qp.x0+e.qp.x1)/2+sr(n),z:e.qp.zLip+ju(e,t)+2.2});function Gs(e,t,n,i,s){switch(n){case"flat":{const a=e.flat;return{x:i===1?a.x0:a.x1,z:a.z+sr(s)}}case"curb":case"rail":case"ledge":{const a=e[n];return{x:i===1?a.x0-Ma:a.x1+Ma,z:Ux(e,n)}}case"stairs":{const a=e.stairs;return{x:(a.bankX0+a.xTop)/2,z:a.bankZ+.5}}case"funbox":{const a=e.funbox,o=a.hw+a.run+.6;return{x:i===1?a.x-o:a.x+o,z:a.z+sr(s)*.6}}case"ramp":return Ox(e,s);case"qp":case"vert":return Fx(e,t,s);case"bowl":return{x:e.bowl.x-e.bowl.hw-.5,z:e.bowl.z-.6}}}function ar(e,t,n,i,s){switch(n){case"flat":case"curb":case"rail":case"ledge":case"funbox":return Gs(e,t,n,i===1?-1:1,s);case"stairs":{const a=e.stairs;return{x:a.xBottom+1.35,z:t0(a)}}case"bowl":return{x:e.bowl.x-e.bowl.hw-.5,z:e.bowl.z+.6};case"ramp":case"qp":case"vert":return Gs(e,t,n,i,s)}}const c3=e=>e==="ramp"?4.5:e==="bowl"?2:0;function e0(e){const t=e.stairs,n=(t.bankX0+t.xTop)/2,i=t0(t),s=[{x:n,z:t.bankZ+.5}];for(let a=0;a<=6;a++){const o=a/6,r=1-o;s.push({x:r*r*n+2*r*o*n+o*o*(t.xTop-.5),z:r*r*(i+.5)+2*r*o*i+o*o*i})}return s}const l3=(e,t)=>t==="stairs"?n0(e0(e)):0,zi=.1,kh=.35,nc=.25,d3=new Map,f3=new Map,Bx=(e,t)=>{const n=e.area;return`${String(n.x0)},${String(n.x1)},${String(n.z0)},${String(n.z1)}|${String(t)}`};function Gx(e,t,n){const i=e.get(t);if(i!==void 0)return i;const s=n();return e.set(t,s),e.size>2&&e.delete(e.keys().next().value),s}function Hx(e,t){return Gx(f3,Bx(e,t),()=>a3(e,t))}function u3(e,t){return Gx(d3,Bx(e,t),()=>{const n=e.area,i=Math.ceil((n.x1-n.x0)/zi),s=Math.ceil((n.z1-n.z0)/zi),a=new Uint8Array(i*s),o=Ia(t,"bowl");for(let r=0;r<s;r++)for(let c=0;c<i;c++){const l=n.x0+(c+.5)*zi,d=n.z0+(r+.5)*zi,f=l>n.x0+nc&&l<n.x1-nc&&d>n.z0+nc&&d<n.z1-nc,u=o&&Ll(e.bowl,l,d)>-kh;a[r*i+c]=f&&!u&&Nx(e,t,l,d,kh)<=.001?1:0}return{x0:n.x0,z0:n.z0,nx:i,nz:s,free:a,paths:new Map}})}const Vx=(e,t)=>[Math.floor((t.x-e.x0)/zi),Math.floor((t.z-e.z0)/zi)],Uo=(e,t,n)=>t>=0&&n>=0&&t<e.nx&&n<e.nz&&e.free[n*e.nx+t]===1,Wx=(e,t,n)=>({x:e.x0+(t+.5)*zi,z:e.z0+(n+.5)*zi});function Xh(e,t){const[n,i]=Vx(e,t);for(let s=0;s<12;s++){let a=null,o=1/0;for(let r=i-s;r<=i+s;r++)for(let c=n-s;c<=n+s;c++){if(Math.max(Math.abs(c-n),Math.abs(r-i))!==s||!Uo(e,c,r))continue;const l=Wx(e,c,r),d=Math.hypot(l.x-t.x,l.z-t.z);d<o&&(o=d,a=[c,r])}if(a)return a}return null}function h3(e,t,n){const i=e.nx*e.nz,s=new Float64Array(i).fill(1/0),a=new Int32Array(i).fill(-1),o=new Uint8Array(i),r=[],c=(p,_)=>{r.push([p,_]);let x=r.length-1;for(;x>0;){const m=x-1>>1;if(r[m][0]<=p)break;[r[m],r[x]]=[r[x],r[m]],x=m}},l=()=>{const p=r[0],_=r.pop();if(r.length>0&&_){r[0]=_;let x=0;for(;;){const m=x*2+1,v=m+1;let y=x;if(m<r.length&&r[m][0]<r[y][0]&&(y=m),v<r.length&&r[v][0]<r[y][0]&&(y=v),y===x)break;[r[y],r[x]]=[r[x],r[y]],x=y}}return p},d=(p,_)=>{const x=Math.abs(p-n[0]),m=Math.abs(_-n[1]);return Math.max(x,m)+(Math.SQRT2-1)*Math.min(x,m)},f=t[1]*e.nx+t[0],u=n[1]*e.nx+n[0];for(s[f]=0,c(d(t[0],t[1]),f);;){const p=l();if(!p)return null;const _=p[1];if(o[_]===1)continue;if(o[_]=1,_===u)break;const x=_%e.nx,m=(_-x)/e.nx;for(let v=-1;v<=1;v++)for(let y=-1;y<=1;y++){if(y===0&&v===0)continue;const g=x+y,b=m+v;if(!Uo(e,g,b)||y!==0&&v!==0&&(!Uo(e,x+y,m)||!Uo(e,x,m+v)))continue;const S=b*e.nx+g,E=(s[_]??0)+(y!==0&&v!==0?Math.SQRT2:1);E<(s[S]??1/0)&&(s[S]=E,a[S]=_,c(E+d(g,b),S))}}const h=[];for(let p=u;p!==-1;p=a[p]??-1){const _=p%e.nx;h.push(Wx(e,_,(p-_)/e.nx))}return h.reverse()}function p3(e,t,n){const i=Math.ceil(Math.hypot(n.x-t.x,n.z-t.z)/(zi/2));for(let s=0;s<=i;s++){const[a,o]=Vx(e,{x:t.x+(n.x-t.x)*s/Math.max(1,i),z:t.z+(n.z-t.z)*s/Math.max(1,i)});if(!Uo(e,a,o))return!1}return!0}function m3(e,t){const n=[];let i=0;const s=t[0];if(!s)return n;for(n.push(s);i<t.length-1;){let a=t.length-1;for(;a>i+1&&!p3(e,t[i],t[a]);)a--;n.push(t[a]),i=a}return n}const x3=.4;function g3(e){if(e.length<3)return[...e];const t=[e[0]];for(let n=1;n<e.length-1;n++){const i=e[n-1],s=e[n],a=e[n+1],o=Math.hypot(s.x-i.x,s.z-i.z),r=Math.hypot(a.x-s.x,a.z-s.z),c=Math.min(x3,o/2,r/2),l={x:s.x+(i.x-s.x)*c/o,z:s.z+(i.z-s.z)*c/o},d={x:s.x+(a.x-s.x)*c/r,z:s.z+(a.z-s.z)*c/r};for(let f=0;f<=4;f++){const u=f/4,h=1-u;t.push({x:h*h*l.x+2*h*u*s.x+u*u*d.x,z:h*h*l.z+2*h*u*s.z+u*u*d.z})}}return t.push(e[e.length-1]),t}function kx(e,t,n,i){const s=u3(e,t),a=`${n.x.toFixed(3)},${n.z.toFixed(3)}>${i.x.toFixed(3)},${i.z.toFixed(3)}`,o=s.paths.get(a);if(o)return o;const r=Xh(s,n),c=Xh(s,i),l=r&&c?h3(s,r,c):null,d=l?g3(m3(s,[n,...l,i])):[n,i];return s.paths.set(a,d),d}const n0=e=>{let t=0;for(let n=1;n<e.length;n++)t+=Math.hypot(e[n].x-e[n-1].x,e[n].z-e[n-1].z);return t};function wd(e,t){let n=Math.max(0,t);for(let i=1;i<e.length;i++){const s=e[i-1],a=e[i],o=Math.hypot(a.x-s.x,a.z-s.z);if(n<=o||i===e.length-1){const r=o>0?Math.min(1,n/o):1;return{x:s.x+(a.x-s.x)*r,z:s.z+(a.z-s.z)*r}}n-=o}return e[0]??{x:0,z:0}}const _3=10*6e4,v3=240,M3=181,y3=30,b3=61;function Il(e){let t=2166136261;for(let n=0;n<e.length;n++)t=Math.imul(t^e.charCodeAt(n),16777619);return t>>>0}function S3(e,t){return y3+Il(`${e}#${String(t)}`)%b3}function w3(e,t){const n=Il(e),i=v3+n%M3,s=t+n%i,a=Math.floor(s/i);return s-a*i<S3(e,a)?{k:"snack",at:"island",key:a,fruit:(n+a)%3}:{k:"nap",at:"lounge"}}function E3(e,t,n){const i=e.main?"main":"desk";if(e.phase==="stopped")return{k:"stopped",at:i};if(e.status==="done")return{k:"done",at:"terrace"};if(e.status==="failed")return{k:"failed",at:i};const s=t.cards.filter(o=>o.agent===e.name);if(e.waits>0||e.waiting_on?.who==="you"||s.length>0)return s.some(o=>o.urgent)?{k:"asks",at:i,urgent:!0}:{k:"asks",at:i};if(!e.main){const o=t.places.find(r=>r.id===e.place_id)?.landing;if(o!=null&&o>0)return{k:"landing",at:"queue",rank:o}}if(e.phase==="starting")return{k:"starting",at:e.main?"main":"door"};const a=e.doing?.kind;return e.main?e.status==="working"?$h({k:"main",at:"main"},a,!1):{k:"mainidle",at:"main"}:e.status==="working"?$h((e.turn_ms??0)>_3?{k:"hot",at:"desk"}:{k:"work",at:"desk"},a,!0):e.status==="blocked"?{k:"blocked",at:"desk"}:e.waiting_on?.who==="agent"?{k:"waitagent",at:"desk",on:e.waiting_on.name}:a==="build"?{k:"work",at:"desk",doing:a}:e.status==="waiting"||e.watching.length>0?{k:"sleep",at:"desk"}:w3(e.name,n)}function $h(e,t,n){return t===void 0?e:{...e,doing:t,...t==="think"&&n?{at:"board"}:{}}}function T3(e,t){const n=new Map;for(const i of e.agents)i.archived||n.set(i.name,E3(i,e,t));return n}const qh=14,Ed={drop_in:.9,pump:1.1,rock_to_fakie:1.1,axle_stall:1.1,fs_180:1.1,bs_180:1.1,ollie:.7,kickflip:.8,heelflip:.8,shove_it:.8,tre_flip:.9,fifty:1.1,five_o:1.1,boardslide:1.1,nosegrind:1.1,manual:1.3,no_comply:.8,carve:1.5,fs_air:1.1,nine:1.8},Td=1.5,Yh={flat:["manual","no_comply","ollie","kickflip","heelflip","shove_it"],funbox:["ollie","manual","kickflip"],qp:["fs_air","axle_stall"],curb:["fifty","five_o","nosegrind"],rail:["fifty","boardslide"],ledge:["fifty","five_o","boardslide","nosegrind"],stairs:["ollie","kickflip","heelflip","shove_it"],ramp:["fs_air","fs_180","bs_180","axle_stall","rock_to_fakie","fifty","fs_air","pump"],bowl:["carve","carve","fs_air"],vert:["fs_air","axle_stall"]},A3=new Set(["drop_in","pump","carve","manual"]),ic=8,Ad=12,zd=24,Da=2,z3=2,R3=600,C3=900,P3=1.5,L3=3.2,I3=.6;function D3(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let n=t;return n=Math.imul(n^n>>>15,n|1),n^=n+Math.imul(n^n>>>7,n|61),((n^n>>>14)>>>0)/4294967296}}const eu=(e,t)=>e[Math.min(e.length-1,Math.floor(t*e.length))];function N3(e){return Object.keys(Yn).filter(t=>Yn[t]<=e&&!(t==="qp"&&e>=Yn.vert))}function U3(e){return e.dow===0&&e.stage>=Yn.bowl&&Math.floor((e.day+4)/7)%4===0}const O3=(e,t,n)=>Math.floor(Date.UTC(e,t-1,n)/864e5);function F3(e,t,n,i){const s=new Map,a=t.park;if(!i||i.reduced||!a||a.spots.length===0)return s;const o=U3(i),r=Math.floor(n/R3),c=[...e].filter(([,u])=>u.k==="nap"||u.k==="snack").map(([u])=>u),l=o?a.spots.length:Math.min(z3,a.spots.length),d=c.map(u=>({name:u,h:Il(`${u}|${String(r)}`)})).sort((u,h)=>u.h-h.h||(u.name<h.name?-1:1)).slice(0,l).map(u=>u.name).sort(),f=i.jobs===C3&&i.stage>=Yn.vert;return d.forEach((u,h)=>s.set(u,{kind:"skate",slot:h,pool:o,nine:f&&h===0,stage:i.stage})),s}function B3(e,t,n){if(e==="ramp"){const i=2+Math.floor(t()*2);return["drop_in",...Array.from({length:i},()=>eu(Yh.ramp,t()))]}return e==="bowl"?["carve","carve",t()<.5?"fs_air":"carve"]:e==="stairs"&&n?["tre_flip"]:[eu(Yh[e],t())]}function G3(e,t,n,i){const s=D3(Il(`${e}|line|${String(t)}`)),a=ic+s()*(Ad-ic),o=n.pool?["bowl"]:N3(n.stage),r=[];let c=0;const l=i.spots[n.slot]??i.spots[0]??{x:i.area.x0,z:i.area.z0};let d=l,f=null;const u=(x,m,v,y)=>Math.max(I3,(c3(m)+n0(kx(i,n.stage,x,v))+l3(i,y))/L3),h=(x,m,v,y,g)=>{r.push({trick:x,on:m,t0:c,dur:v,bail:y,side:g}),c+=v};if(n.nine&&t%3===0&&o.includes("vert")){h("roll","vert",u(d,null,Gs(i,n.stage,"vert",1,n.slot),"vert"),!1,1);const x=t%2===1;h("nine","vert",Ed.nine*Td+(x?Da:0),x,1),d=ar(i,n.stage,"vert",1,n.slot),f="vert"}let p=f;for(let x=0;x<12;x++){const m=o.filter(D=>D!==p||o.length===1).flatMap(D=>D==="bowl"&&o.length>1?[D,D]:[D]),v=eu(m,s()),y=s()<1/8,g=B3(v,s,y),b=s()<.5?1:-1,S=u(d,f,Gs(i,n.stage,v,b,n.slot),v),E=ar(i,n.stage,v,b,n.slot),M=u(E,v,l,null),T=g.map(D=>({k:D,bail:!A3.has(D)&&s()<.1})),z=T.reduce((D,O)=>D+Ed[O.k]*Td+(O.bail?Da:0),0);if(c+S+z+M>Ad){if(c+u(d,f,l,null)>=ic)break;continue}h("roll",v,S,!1,b);let R=b;for(const D of T)h(D.k,v,Ed[D.k]*Td+(D.bail?Da:0),D.bail,R),v==="ramp"&&(R=R===1?-1:1);if(p=v,d=E,f=v,c+M>=a)break}const _=u(d,f,l,null);return h("roll",null,Math.min(Ad-c,Math.max(_,ic-c)),!1,1),{moves:r,len:c}}function Xx(e,t,n,i){const s=Math.max(0,n),a=Math.floor(s/zd),o=s-a*zd,r=G3(e,a,t,i);if(o>=r.len)return{n:a,line:r,move:null,f:0,into:0,restLeft:zd-o};const c=r.moves.find(d=>o<d.t0+d.dur)??null,l=c?o-c.t0:0;return{n:a,line:r,move:c,f:c&&c.dur>0?l/c.dur:0,into:l,restLeft:0}}function $x(e){const t=e.seg;return e.since-(t.path.len>.01?t.path.len/t.speed:0)}function H3(e,t,n){const i=t.seg.pastime;if(!i||t.moving||!n)return null;const s=Xx(e,i,$x(t),n),a=s.move;return!a||a.trick==="roll"||s.into>=P3?null:a.trick}const V3={...ui,floor:"#efe6d6",wall:"#fbf6ec",wallTop:"#e4d6bf",desk:"#c49a6c",deskTop:"#e2c18f",island:"#6cb4ee",islandTop:"#fffaf0",grass:"#e8d3a8",dirt:"#b08a5a",terrace:"#ece2cf",rug:"#ffd166",islandRug:"#f3ecdf"},W3={...hi,floor:"#7d6a55",wall:"#5a4c40",wallTop:"#6a5a4b",desk:"#a77f55",deskTop:"#bf9a6c",island:"#3d78a8",islandTop:"#e8dfcc",grass:"#8a7552",dirt:"#5e4a33",terrace:"#6d5d47",islandRug:"#6b5b4a"},Ga={day:"#d8d4cc",night:"#8d8a84"},Zh={day:"#c9c4ba",night:"#7c7973"},Hs="#8e9399",i0="#5c677d",Kh={day:"#9fd68a",night:"#4f7a45"},Jh={day:"#e8d3a8",night:"#8a7552"},Qh={day:"#5fa84a",night:"#3f7a35"},k3=["#ffd166","#f4a259","#f39a4c","#9b8fe0","#6cb4ee"],X3=["#6cb4ee","#ffd166","#2a9d8f"],Dl=e=>e.pal.pendants,s0=e=>e;function Rd(e,t,n,i,s,a,o,r,c){const l=new as;l.moveTo(0,0),l.absarc(0,a,a,-Math.PI/2,0,!1),l.lineTo(a+o,a),l.lineTo(a+o,0),l.lineTo(0,0);const d=new $s(l,{depth:s,bevelEnabled:!1,curveSegments:16});d.translate(0,0,-s/2),d.rotateY(Math.PI);const f=new Wt;f.position.set(n,0,i),f.rotation.y=r,t.add(f),e.add(d,c,f,0,0,0);const u=e.add(e.style.cylinder(.05,s),e.mat(Hs),f,-a,a,0);return u.rotation.x=Math.PI/2,f}function el(e,t,n,i,s){const a=new Wt;a.position.set(n,0,i),a.scale.setScalar(s),t.add(a),e.add(e.style.cylinder(.08,2.6),e.mat(N.palmTrunk),a,0,1.3,0);for(let o=0;o<7;o++)e.add(e.style.box(.18,.03,.9),e.mat(o%2?N.leaf[0]:N.leaf[1]),a,Math.sin(o)*.3,2.6,Math.cos(o)*.3).rotation.set(.5*Math.cos(o),o,.5*Math.sin(o))}function $3(e){const{k:t,root:n,o:i}=e,s=s0(i),{style:a,pal:o}=t,{x0:r,D:c,roomX1:l}=s,d=Dl(t),f=l-r,u=t.add(a.box(f,.14,c),a.floor(o.floor,f,c),n,r+f/2,-.05,c/2);u.receiveShadow=!0,t.add(a.box(f+.2,1.9,.2),t.mat(o.wall),n,r+f/2,.95,-.1),t.add(a.box(.2,1.1,c+.2),t.mat(o.wall),n,r-.1,.55,c/2),q3(t,n,r+.3,r+4.5,d),X3.forEach((x,m)=>{const v=t.add(a.box(.08,1.6,.42,.04),t.mat(x),n,r+.12,.8,c-4+m*.6);v.rotation.z=-.15}),un(t,n,Dn({x:s.door.x,z:c-.15,hw:.55,hd:.25}),.04,.03,N.mat);const h=t.mat(d?Qh.night:Qh.day);for(let x=.2;x<c-.3;x+=.7){if(Math.abs(x-s.pathZ)<.75)continue;t.add(a.ball(.32),h,n,l+.2,.25,x).scale.set(1,.8,1.1)}const p=l,_=s.parkX0;t.add(a.box(_-p,.06,c),t.mat(d?Kh.night:Kh.day),n,(p+_)/2,0,c/2),t.add(a.box(_-p+.6,.07,1.1),t.mat(d?Jh.night:Jh.day),n,(p+_)/2,.01,s.pathZ);for(const x of[1.5,c*.55])el(t,n,(p+_)/2+(x<2?.5:-.5),x,1);Y3(t,n,s.park,d,e.grow.stage>=Yn.bowl)}function q3(e,t,n,i,s){const{style:a}=e,o=.01+a.pictureZ,r=i-n,c=1.75,l=.28;k3.forEach((f,u)=>e.add(a.box(r,l,.02),e.mat(s?qx(f):f),t,(n+i)/2,c-l/2-u*l,o));const d=e.add(a.cylinder(.32,.03),e.mat("#fff3c4"),t,n+r*.62,c-3.2*l,o+.02);d.rotation.x=Math.PI/2,d.scale.y=1;for(const f of[.12,.3,.85]){const u=n+r*f;e.add(a.box(.05,.9,.02),e.mat(N.dark),t,u,c-.95,o+.03);for(let h=0;h<5;h++){const p=e.add(a.box(.3,.05,.02),e.mat(N.dark),t,u,c-.5,o+.03);p.rotation.z=(h-2)*.45}}}function qx(e){const t=parseInt(e.slice(1),16),n=i=>Math.round((t>>i&255)*.7).toString(16).padStart(2,"0");return`#${n(16)}${n(8)}${n(0)}`}function Y3(e,t,n,i,s){const{style:a}=e,o=n.area,r=e.mat(i?Ga.night:Ga.day),c=e.mat(i?Zh.night:Zh.day),l=o.x1-o.x0;e.add(Q3(e,n,s),r,t,(o.x0+o.x1)/2,0,(o.z0+o.z1)/2),e.add(a.box(l+.2,.3,.2),c,t,(o.x0+o.x1)/2,.15,o.z0-.1);const d=n.bowl;for(let f=o.z0+2;f<o.z1;f+=2){const h=s&&Math.abs(f-d.z)<d.hd+.4?[[o.x0,d.x-d.hw-.4],[d.x+d.hw+.4,o.x1]]:[[o.x0,o.x1]];for(const[p,_]of h)_-p>.05&&e.add(a.box(_-p,.005,.03),e.mat("#b9b4ab"),t,(p+_)/2,.045,f)}for(const{x:f,z:u}of n.poles)if(e.add(a.cylinder(.045,3),e.mat(i0),t,f,1.5,u),e.add(a.box(.4,.2,.22),a.material("#fff3c4",{emissive:"#fff3c4",ei:i?1.5:.1}),t,f,3,u),i){const h=new Uu("#fff3c4",6,9,1.4);h.position.set(f,2.8,u),t.add(h)}for(const f of n.benches)e.add(a.box(f.x1-f.x0,.35,f.z1-f.z0,.05),e.mat("#c49a6c"),t,(f.x0+f.x1)/2,.18,(f.z0+f.z1)/2);Z3(e,t,n,r)}function Z3(e,t,n,i){const s=n.funbox;e.add(e.style.box(s.hw*2,s.h,s.hd*2),i,t,s.x,s.h/2,s.z);const a=Math.hypot(s.run,s.h);for(const o of[-1,1]){const r=e.add(e.style.box(a,.08,s.hd*2),i,t,s.x+o*(s.hw+s.run/2),s.h/2,s.z);r.rotation.z=-o*Math.atan2(s.h,s.run)}e.add(e.style.box(s.hw*2,.03,.04),e.mat(Hs),t,s.x,s.h+.01,s.z-s.hd)}function Cd(e,t,n,i,s){const{style:a}=e,o=n.x1-n.x0,r=(n.x0+n.x1)/2;if(i==="rail"){e.add(a.box(o,.04,.05),e.mat(Hs),t,r,n.h,n.z);for(const l of[n.x0+.3,n.x1-.3])e.add(a.box(.05,n.h,.05),e.mat(i0),t,l,n.h/2,n.z);return}const c=i==="curb"?.35:.6;e.add(a.box(o,n.h,c),s,t,r,n.h/2,n.z),e.add(a.box(o,.03,.04),e.mat(Hs),t,r,n.h+.01,n.z-c/2)}function K3(e,t,n,i){const s=n.stairs,a=s.z1-s.z0,o=(s.z0+s.z1)/2;e.add(e.style.box(s.xTop-s.x0,s.h,a),i,t,(s.x0+s.xTop)/2,s.h/2,o);const r=(s.xBottom-s.xTop)/4;for(let v=0;v<4;v++){const y=s.h-(v+1)*(s.h/5);e.add(e.style.box(r,y,a),i,t,s.xTop+r*(v+.5),y/2,o)}const c=new as;c.moveTo(0,0),c.lineTo(s.bankZ-s.z1,0),c.lineTo(0,s.h),c.lineTo(0,0);const l=s.xTop-s.bankX0,d=new $s(c,{depth:l,bevelEnabled:!1});d.rotateY(-Math.PI/2),e.add(d,i,t,s.xTop,0,s.z1);const{top:f,low:u}=Dx(s),h=s.xBottom-s.xTop,p=Math.hypot(h,f-u),_=e.add(e.style.cylinder(.03,p+.06),e.mat(Hs),t,s.xTop+h/2,(f+u)/2,s.railZ);_.rotation.z=Math.PI/2-Math.atan2(f-u,h);const x=s.h,m=s.h/5;for(const[v,y,g]of[[s.xTop+.03,f,x],[s.xBottom-.03,u,m]])e.add(e.style.cylinder(.025,y-g),e.mat(Hs),t,v,(y+g)/2,s.railZ)}const uo=.04,jh=10,tp=10;function So(e,t){const n=Math.max(.001,e.rc-t),i=[];return[[1,1],[-1,1],[-1,-1],[1,-1]].forEach(([a,o],r)=>{const c=e.x+a*(e.hw-e.rc),l=e.z+o*(e.hd-e.rc);for(let d=0;d<=jh;d++){const f=r*Math.PI/2+d/jh*(Math.PI/2);i.push({x:c+Math.cos(f)*n,z:l+Math.sin(f)*n})}}),i}function sc(e,t){const n=[],i=(a,o,r)=>{const c=(o[0]??0)-(a[0]??0),l=(o[1]??0)-(a[1]??0),d=(o[2]??0)-(a[2]??0),f=(r[0]??0)-(a[0]??0),u=(r[1]??0)-(a[1]??0),h=(r[2]??0)-(a[2]??0),p=[l*h-d*u,d*f-c*h,c*u-l*f],_=[t[0]-(a[0]??0),t[1]-(a[1]??0),t[2]-(a[2]??0)],x=(p[0]??0)*(_[0]??0)+(p[1]??0)*(_[1]??0)+(p[2]??0)*(_[2]??0)<0;for(const m of x?[a,r,o]:[a,o,r])n.push(m[0]??0,m[1]??0,m[2]??0)};for(let a=0;a+1<e.length;a++){const o=e[a]??[],r=e[a+1]??[];for(let c=0;c<o.length;c++){const l=(c+1)%o.length,d=o[c],f=o[l],u=r[c],h=r[l];!d||!f||!u||!h||(i(d,f,u),i(f,h,u))}}const s=new Pe;return s.setAttribute("position",new le(n,3)),s.computeVertexNormals(),s}function J3(e,t,n,i){const s=n.bowl,a=v=>e.mat(i?qx(v):v),o=v=>{const y=s.depth*(1-Math.cos(v)),g=uo-s.depth*Math.sin(v);return So(s,y).map(b=>[b.x,g,b.z])},r=Array.from({length:tp+1},(v,y)=>y/tp*(Math.PI/2)),c=[s.x,uo,s.z],l=2;e.add(sc(r.slice(0,l+1).map(o),c),a("#3d6fb6"),t,0,0,0),e.add(sc(r.slice(l).map(o),c),a("#b9bdc3"),t,0,0,0);const d=uo-s.depth,f=o(Math.PI/2),u=f.map(([v,,y])=>[s.x+(v-s.x)*.55,d,s.z+(y-s.z)*.55]),h=[s.x,d+1,s.z];e.add(sc([f,u],h),a("#9a9fa6"),t,0,0,0),e.add(sc([u,u.map(()=>[s.x,d,s.z])],h),a("#80858d"),t,0,0,0);const p=So(s,-.03).map(v=>new Z(v.x,uo+.02,v.z));e.add(new Du(new Pm(p,!0),p.length*2,.05,6,!0),e.mat(Hs),t,0,0,0);const _=new as(So({...s,hw:s.hw+.35,hd:s.hd+.35,rc:s.rc+.35},0).map(v=>new St(v.x-s.x,-(v.z-s.z))));_.holes.push(new Qo(So(s,0).map(v=>new St(v.x-s.x,-(v.z-s.z)))));const x=new Iu(_,4);x.rotateX(-Math.PI/2);const m=e.add(x,a("#ece8e0"),t,s.x,uo+.005,s.z);m.castShadow=!1}function Q3(e,t,n){const i=t.area,s=i.x1-i.x0,a=i.z1-i.z0;if(!n)return e.style.box(s,.08,a);const o=(i.x0+i.x1)/2,r=(i.z0+i.z1)/2,c=new as;c.moveTo(-s/2,-a/2),c.lineTo(s/2,-a/2),c.lineTo(s/2,a/2),c.lineTo(-s/2,a/2),c.lineTo(-s/2,-a/2),c.holes.push(new Qo(So(t.bowl,0).map(d=>new St(d.x-o,-(d.z-r)))));const l=new $s(c,{depth:.08,bevelEnabled:!1});return l.rotateX(-Math.PI/2),l.translate(0,-.04,0),l}function j3(e,t){const{k:n}=e,i=Dl(n),s=n.mat(i?Ga.night:Ga.day),a=_=>e.stage(Yn[_]),o=a("vert"),r=t.qp,c=o?r.r13:r.r,l=o??a("qp");if(l){const _=Ix,x=Rd(n,l,(r.x0+r.x1)/2,r.zLip+c,r.x1-r.x0,c,_,-Math.PI/2,s);o&&n.add(n.style.box(.04,.5,r.x1-r.x0),n.mat(i0),x,-(c+_-.05),c+.25,0)}const d=a("curb");d&&Cd(n,d,t.curb,"curb",s);const f=a("rail");f&&Cd(n,f,t.rail,"rail",s);const u=a("ramp");if(u){const _=t.ramp,x=_.z1-_.z0,m=(_.z0+_.z1)/2;Rd(n,u,_.xa+_.r,m,x,_.r,.6,0,s),Rd(n,u,_.xb-_.r,m,x,_.r,.6,Math.PI,s)}const h=a("stairs");h&&(K3(n,h,t,s),Cd(n,h,t.ledge,"ledge",s));const p=a("bowl");p&&J3(n,p,t,i)}function tE({k:e,root:t,o:n}){const{style:i,pal:s}=e,a=n.island,o=(a.x0+a.x1)/2,r=(a.z0+a.z1)/2,c=a.x1-a.x0,l=a.z1-a.z0;e.add(i.box(c,1.3,l,.12),e.mat(s.island),t,o,.85,r),e.add(i.box(c+.05,.25,l+.05,.08),e.mat(s.islandTop),t,o,1.55,r),e.add(i.box(c*.55,.5,.05),i.material("#fff3c4",{emissive:"#fff3c4",ei:Dl(e)?.8:.1}),t,o,1.05,a.z0-.01),e.add(i.box(c*.6,.05,.3),e.mat(s.islandTop),t,o,.8,a.z0-.12);for(const d of[-c/3,c/3]){const f=e.add(i.cylinder(.22,.15),e.mat(N.dark),t,o+d,.22,a.z0+.05);f.rotation.x=Math.PI/2}if(["#ffd166","#7cc26b","#f28c28"].forEach((d,f)=>e.add(i.box(.22,.06,.14),e.mat(d),t,o-.5+f*.5,.86,a.z0-.15)),s.pendants){const d=new Uu("#ffcf8a",3.2,4.5,1.6);d.position.set(o,1.6,a.z0-.8),t.add(d)}}function Si(e,t){const n=s0(e),i=n.park,s=(n.roomX1+n.parkX0)/2,a=n.island,o=[n.door,{x:n.x0+.5,z:n.D-.6},{x:a.x1+.5,z:a.z0+.3},{x:(i.curb.x0+i.curb.x1)/2,z:i.curb.z},{x:(n.boardSpots[2]??n.door).x,z:.9},{x:(i.rail.x0+i.rail.x1)/2,z:i.rail.z},{x:n.roomX1-.6,z:n.D*.5},{x:(i.ramp.xa+i.ramp.xb)/2,z:(i.ramp.z0+i.ramp.z1)/2},{x:s,z:n.D*.3},{x:(i.stairs.xTop+i.stairs.xBottom)/2,z:(i.stairs.z0+i.stairs.z1)/2},{x:s,z:n.pathZ+1.6},{x:i.bowl.x,z:i.bowl.z},{x:n.x0-1.9,z:n.D*.55},{x:(i.qp.x0+i.qp.x1)/2,z:i.qp.zLip+.8},{x:s,z:n.pathZ-1.4}];return o[Math.min(t,o.length-1)]??n.door}function eE(e){const{k:t,o:n,grow:i}=e,s=s0(n),{style:a,pal:o}=t,r=e.stage(0);if(!r)return;const c=E=>e.stage(E);j3(e,s.park);const l=(s.roomX1+s.parkX0)/2,d=c(1);d&&un(t,d,{x0:s.x0+.4,x1:s.x0+5.2,z0:s.D+.3,z1:s.D+4.4},.08,0,o.terrace);const f=s.furniture.filter(E=>E.of!==void 0&&s.terrace.some(M=>M.x===E.of?.x&&M.z===E.of.z)),u=[0,1,1,1,2,2,2,4,4,4,8][Math.min(i.stage,10)]??8;f.forEach((E,M)=>{if(M>=u)return;const T=[1,4,7,7,10,10,10,10][M]??0;Rl(t,c(T)??r,E,M%2?"#ffd166":"#6cb4ee")});const h=c(1);if(h){const E=Si(s,1);t.add(a.cylinder(.2,.34),t.mat(N.pot),h,E.x,.17,E.z);for(let M=0;M<6;M++)t.add(a.box(.07,.5,.12),t.mat("#6fa88a"),h,E.x,.55,E.z).rotation.set(Math.cos(M)*.6,M*1.05,Math.sin(M)*.6)}const p=c(2);if(p){const E=Si(s,2);t.add(a.box(.5,.3,.4),t.mat(N.crate),p,E.x,.15,E.z);for(let M=0;M<6;M++)t.add(a.ball(.07),t.mat(M%2?"#7cc26b":N.orange),p,E.x-.15+M%3*.15,.34,E.z-.08+Math.floor(M/3)*.16);el(t,p,l+.5,s.D*.8,.9)}const _=c(4);if(_){const E=Si(s,4).x,M=a.pictureZ;t.add(a.box(1.8,.95,.05),t.mat("#c49a6c"),_,E,1.05,.02+M),t.add(a.box(1.68,.83,.02),t.mat("#2f4a3a"),_,E,1.05,.05+M);for(let T=0;T<5;T++){const z=.4+Ae(`chalk${String(T)}`)%50/100;t.add(a.box(z,.04,.01),t.mat(["#fffaf0","#ffd166","#8fd3ff"][T%3]??"#fffaf0"),_,E-.7+z/2,1.35-T*.14,.065+M)}}const x=c(5);if(x){const E=s.island,M=E.z0+lr(s,i.stage)-.6;t.add(a.box(.55,.28,.2),t.mat(N.dark),x,(E.x0+E.x1)/2,1.8,M)}const m=c(6);if(m){const E=Si(s,6);t.add(a.box(.5,.35,.35,.05),t.mat("#6cb4ee"),m,E.x-.4,.18,E.z),t.add(a.box(.52,.06,.37),t.mat("#fffaf0"),m,E.x-.4,.38,E.z);for(let M=.8;M<s.D-.6;M+=1.3)Math.abs(M-s.pathZ)<.8||t.add(a.box(.14,.14,.14),t.mat(M%2.6<1.3?N.orange:"#9b8fe0"),m,s.roomX1+.55,.35,M)}const v=c(7);if(v){const E=s.x0+5.6,M=s.D+1.9;t.add(a.cylinder(.03,1.8),t.mat(o.ink),v,E,.9,M),t.add(a.cap(.75,.35),t.mat("#ffd166"),v,E,1.75,M)}const y=c(8);if(y)for(const E of[s.D*.3,s.D-1])el(t,y,l-.6,E,1.05);const g=c(10);if(g){const E=Si(s,10);t.add(a.box(.7,.05,.7),t.mat("#c49a6c"),g,E.x,.05,E.z),t.add(a.cylinder(.04,2),t.mat(N.metal),g,E.x-.25,1,E.z),t.add(a.box(.3,.04,.12),t.mat(N.metal),g,E.x-.12,2,E.z)}const b=c(12);if(b){const E=Si(s,12),M=t.add(a.cylinder(1,.04),t.mat("#6cb4ee"),b,E.x,0,E.z);M.scale.z=.7;const T=t.add(a.box(.08,1.4,.4,.04),t.mat("#ffd166"),b,E.x+.9,.6,E.z-.6);T.rotation.z=.2}const S=c(qh);if(S){const E=Si(s,qh),M=a.material(N.gold,{emissive:N.gold,ei:.15});t.add(a.box(.7,.5,.5),t.mat(nE(t)),S,E.x,.25,E.z);const T=t.add(a.box(.28,.04,.95,.03),M,S,E.x,1,E.z);T.rotation.x=Math.PI/2-.25,Ks(t,S,E.x,1,E.z+.05,t.pal.ink,.04)}Al(t,r,s,i),iE(t,r,s,i),i.building&&i.stage<14&&zl(t,r,Si(s,i.stage+1))}const nE=e=>Dl(e)?Ga.night:Ga.day;function iE(e,t,n,i){if(i.frames===0)return;const{style:s}=e,a=(n.boardSpots[2]?.x??n.x0+5.5)+1.1,o=n.mainDesk.x-.6,r=.3,c=Math.max(1,Math.floor((o-a)/r));for(let l=0;l<i.frames;l++){const d=l%c,u=1.3-Math.floor(l/c)*.62;if(u<.5)break;const h=i.golden&&l===0?N.gold:N.mural[l%N.mural.length]??N.paper;e.add(s.box(.2,.58,.03,.06),e.mat(h),t,a+r/2+d*r,u,.03+s.pictureZ)}}const sE={id:"california",pal:e=>e?W3:V3,shell:$3,island:tE,lounge:dr,desk:(e,t,n)=>Ff.desk(e,t,n),mainDesk:(e,t)=>Ff.mainDesk(e,t),tree:({k:e},t,n,i,s)=>{el(e,t,n,i,s)},growth:eE,pieceAt:Si,pits:(e,t)=>t>=Yn.bowl&&e.park?[aE(e.park.bowl)]:[]};function aE(e){return{x0:e.x-e.hw-.1,x1:e.x+e.hw+.1,z0:e.z-e.hd-.1,z1:e.z+e.hd+.1}}const oE={loft:Ff,greenhouse:ES,campus:CS,workshop:NS,kyoto:GS,riad:WS,nordic:QS,patio:xw,haveli:Aw,tropical:Fw,cyclades:Zw,sahel:s3,california:sE},nu=e=>oE[e],rE=(e,t,n)=>new $a(Math.max(.01,e),Math.max(.01,t),Math.max(.01,n));function cE(e){const t=document.createElement("canvas");t.width=4,t.height=32;const n=t.getContext("2d"),i=new te(e);n&&(n.fillStyle="#"+i.getHexString(),n.fillRect(0,0,4,32),n.fillStyle="#"+i.clone().multiplyScalar(.93).getHexString(),n.fillRect(0,0,4,1));const s=new Rm(t);return s.magFilter=s.minFilter=Ve,s.colorSpace=cn,s.wrapS=s.wrapT=qo,s}function lE(e,t,n,i){const s=Math.max(.004,Math.min(i,e/2-.001,n/2-.001,t/2)),a=new as,o=-e/2,r=-n/2;a.moveTo(o+s,r),a.lineTo(o+e-s,r),a.quadraticCurveTo(o+e,r,o+e,r+s),a.lineTo(o+e,r+n-s),a.quadraticCurveTo(o+e,r+n,o+e-s,r+n),a.lineTo(o+s,r+n),a.quadraticCurveTo(o,r+n,o,r+n-s),a.lineTo(o,r+s),a.quadraticCurveTo(o,r,o+s,r);const c=new $s(a,{depth:Math.max(.01,t-s),bevelEnabled:!0,bevelThickness:s/2,bevelSize:s*.4,bevelSegments:3,curveSegments:6});return c.rotateX(-Math.PI/2),c.translate(0,-t/2+s/4,0),c.computeVertexNormals(),c}const ho=20,dE={name:"clay",shadows:!0,antialias:!0,pictureZ:.09,maxPixelRatio:2,material(e,t={}){const n=t.opacity!==void 0;return t.flat?new vl({color:new te(e),transparent:n,opacity:t.opacity??1}):new nr({color:new te(e),roughness:.95,metalness:0,emissive:new te(t.emissive??"#000000"),emissiveIntensity:t.ei??(t.emissive?1:0),transparent:n,opacity:t.opacity??1})},floor(e,t,n){const i=cE(e);return i.repeat.set(t/2,n*2),new nr({color:16777215,map:i,roughness:.95,metalness:0})},box:(e,t,n,i)=>{const s=Math.max(.01,e),a=Math.max(.01,t),o=Math.max(.01,n);return Math.min(s,a,o)<.03?rE(s,a,o):lE(s,a,o,i??Math.min(s,a,o)*.22)},ball:e=>new $c(e,ho,ho-4),cap:(e,t)=>new $c(e,ho,ho-4,0,Math.PI*2,0,Math.PI*Math.min(1,t)),capsule:(e,t)=>new Ru(e,t,4,12),cylinder:(e,t)=>new Ml(e,e,t,ho)},gn=dE;function fE(e,t=!1){const n=e[0].index!==null,i=new Set(Object.keys(e[0].attributes)),s=new Set(Object.keys(e[0].morphAttributes)),a={},o={},r=e[0].morphTargetsRelative,c=new Pe;let l=0;for(let d=0;d<e.length;++d){const f=e[d];let u=0;if(n!==(f.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+d+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const h in f.attributes){if(!i.has(h))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+d+'. All geometries must have compatible attributes; make sure "'+h+'" attribute exists among all geometries, or in none of them.'),null;a[h]===void 0&&(a[h]=[]),a[h].push(f.attributes[h]),u++}if(u!==i.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+d+". Make sure all geometries have the same number of attributes."),null;if(r!==f.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+d+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const h in f.morphAttributes){if(!s.has(h))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+d+".  .morphAttributes must be consistent throughout all geometries."),null;o[h]===void 0&&(o[h]=[]),o[h].push(f.morphAttributes[h])}if(t){let h;if(n)h=f.index.count;else if(f.attributes.position!==void 0)h=f.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+d+". The geometry must have either an index or a position attribute"),null;c.addGroup(l,h,d),l+=h}}if(n){let d=0;const f=[];for(let u=0;u<e.length;++u){const h=e[u].index;for(let p=0;p<h.count;++p)f.push(h.getX(p)+d);d+=e[u].attributes.position.count}c.setIndex(f)}for(const d in a){const f=ep(a[d]);if(!f)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+d+" attribute."),null;c.setAttribute(d,f)}for(const d in o){const f=o[d][0].length;if(f!==0){c.morphAttributes=c.morphAttributes||{},c.morphAttributes[d]=[];for(let u=0;u<f;++u){const h=[];for(let _=0;_<o[d].length;++_)h.push(o[d][_][u]);const p=ep(h);if(!p)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+d+" morphAttribute."),null;c.morphAttributes[d].push(p)}}}return c}function ep(e){let t,n,i,s=-1,a=0;for(let l=0;l<e.length;++l){const d=e[l];if(t===void 0&&(t=d.array.constructor),t!==d.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(n===void 0&&(n=d.itemSize),n!==d.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(i===void 0&&(i=d.normalized),i!==d.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(s===-1&&(s=d.gpuType),s!==d.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;a+=d.count*n}const o=new t(a),r=new fn(o,n,i);let c=0;for(let l=0;l<e.length;++l){const d=e[l];if(d.isInterleavedBufferAttribute){const f=c/n;for(let u=0,h=d.count;u<h;u++)for(let p=0;p<n;p++){const _=d.getComponent(u,p);r.setComponent(u+f,p,_)}}else o.set(d.array,c);c+=d.count*n}return s!==void 0&&(r.gpuType=s),r}function uE(e){return!(e instanceof nr||e instanceof Vm)||e.userData.live===!0||e.transparent||e.map!==null?!1:e.emissiveIntensity===0||e.emissive.r===0&&e.emissive.g===0&&e.emissive.b===0}function np(e,t,n){const i=e.index!==null?e.toNonIndexed():e.clone();i.applyMatrix4(t);for(const s of Object.keys(i.attributes))s!=="position"&&s!=="normal"&&!(n&&s==="uv")&&i.deleteAttribute(s);return i.hasAttribute("normal")||i.computeVertexNormals(),n&&!i.hasAttribute("uv")&&i.setAttribute("uv",new fn(new Float32Array(i.getAttribute("position").count*2),2)),i.morphAttributes={},i}function hE(e,t,n,i){const s=e.getAttribute("position").count,a=new Float32Array(s*3);for(let o=0;o<s;o++)a[o*3]=t,a[o*3+1]=n,a[o*3+2]=i;return e.setAttribute("color",new fn(a,3)),e}function pE(e){return e.name==="clay"?new nr({vertexColors:!0,roughness:.95,metalness:0}):new Vm({vertexColors:!0})}function Pd(e,t,n){e.updateMatrixWorld(!0);const i=[],s=new Map;let a=0;e.traverseVisible(d=>{if(!(d instanceof Se))return;const f=d.geometry,u=d.material;if(Array.isArray(u))return;if(a++,uE(u)){i.push(hE(np(f,d.matrixWorld,!1),u.color.r,u.color.g,u.color.b));return}const h="map"in u&&u.map!==null&&u.map!==void 0,p=s.get(u)??[];p.push(np(f,d.matrixWorld,h)),s.set(u,p)});const o=new Wt,r=[];let c=null;const l=(d,f)=>{const h=(d.length===1?d[0]:void 0)??fE(d,!1);for(const _ of d)_!==h&&_.dispose();if(h===null)return;r.push(h);const p=new Se(h,f);p.castShadow=n,p.receiveShadow=n,o.add(p)};i.length>0&&(c=pE(t),l(i,c));for(const[d,f]of s)l(f,d);return{group:o,baked:c,from:a,to:o.children.length,dispose(){for(const d of r)d.dispose();c?.dispose()}}}const mE=new te(N.grey),xE=.25;function Yx(e,t,n,i,s){const a=i??ex(e,t),o=new Map,r=new Map,c=(X,lt=0)=>{const gt=`${X}|${lt}`;let ft=o.get(gt);return ft||(ft=n.material(X,lt>0?{emissive:X,ei:lt}:{}),o.set(gt,ft),r.set(ft,ft.color.clone())),ft},l=(X,lt,gt,ft,wt,G)=>{const Rt=new Se(X,lt);return Rt.position.set(ft,wt,G),gt.add(Rt),Rt},d=new Wt,f=new Wt,u=t?1.18:1;f.scale.setScalar(u),d.add(f),l(n.capsule(.21,.22),c(a.hoodie),f,0,.5,0);const h=new Wt;h.position.set(0,Qb,0),f.add(h),l(n.ball(.22),c(a.skin),h,0,0,0);const p=[-.075,.075].map(X=>l(n.box(.07,.08,.02),c(tc),h,X,.03,.205)),_=[-.08,.08].map(X=>l(n.box(.065,.014,.006),c(tc),h,X,.01,.214)),x=l(n.box(.12,.03,.02),c(tc),h,0,-.05,.205),m=l(n.box(.12,.06,.02),c(sS),h,0,-.06,.207),v=l(n.box(.06,.06,.02),c(tc),h,0,-.08,.205);for(const X of[-.135,.135])l(n.box(.06,.04,.02),c(aS),h,X,-.05,.205);const y=X=>{l(n.cap(.225,.48),c(a.hatColor),h,0,.03,0),l(n.box(.22,.03,.2),c(a.hatColor),h,0,.07,X?-.22:.21)};switch(a.hat){case"cap":y(!1);break;case"capback":y(!0);break;case"beanie":l(n.cap(.232,.5),c(a.hatColor),h,0,.04,0),l(n.ball(.06),c(N.paper),h,0,.28,0);break;case"afro":{l(n.ball(.27),c(a.hair),h,0,.1,-.05).scale.set(1.05,.85,1);break}case"bun":l(n.cap(.226,.42),c(a.hair),h,0,.02,-.01),l(n.ball(.09),c(a.hair),h,0,.24,-.08);break;case"hair":l(n.cap(.228,.4),c(a.hair),h,0,.02,-.02);break;case"headphones":{l(n.cap(.226,.4),c(a.hair),h,0,.02,-.02);const X=c(N.dark),lt=.262,gt=7,ft=1.3,wt=2*ft/gt;for(let w=0;w<gt;w++){const $=-ft+wt*(w+.5),tt=l(n.box(lt*wt*1.15,.034,.06,.012),X,h,lt*Math.sin($),lt*Math.cos($),-.01);tt.rotation.z=-$}for(const w of[-1,1]){l(n.box(.03,.07,.035,.01),X,h,w*.258,.07,-.01);const $=l(n.cylinder(.078,.03),X,h,w*.222,-.01,-.01);$.rotation.z=Math.PI/2;const tt=l(n.cylinder(.086,.055),c(a.hatColor),h,w*.258,-.01,-.01);tt.rotation.z=Math.PI/2;const ot=l(n.cylinder(.05,.012),X,h,w*.288,-.01,-.01);ot.rotation.z=Math.PI/2}const G=new Z(-.27,-.05,.03),Rt=new Z(-.12,-.1,.19),Dt=Rt.clone().sub(G);l(n.box(.018,.018,Dt.length(),.006),X,h,(G.x+Rt.x)/2,(G.y+Rt.y)/2,(G.z+Rt.z)/2).quaternion.setFromUnitVectors(new Z(0,0,1),Dt.normalize()),l(n.ball(.026),X,h,Rt.x,Rt.y,Rt.z);break}case"main":{l(n.cap(.228,.4),c(a.hair),h,0,.02,-.02);const X=c(N.wheel,.3);l(n.box(.05,.05,.02),X,f,-.06,.58,.215),l(n.box(.05,.05,.02),X,f,-.06,.47,.215);for(let lt=0;lt<3;lt++){const gt=l(n.box(.11,.025,.02),X,f,.05,.525,.215);gt.rotation.z=lt*Math.PI/3}l(n.box(.3,.03,.03),c(N.gold,.2),f,0,.7,.2);break}}const g=[],b=[];for(const X of[-1,1]){const lt=new Wt;lt.position.set(X*.24,.66,0),f.add(lt),l(n.capsule(.065,.2),c(a.hoodie),lt,0,-.15,0),l(n.ball(.065),c(a.skin),lt,0,-.3,0),g.push(lt);const gt=new Wt;gt.position.set(X*.1,.3,0),f.add(gt),l(n.capsule(.075,.14),c(a.pants),gt,0,-.12,0),l(n.box(.15,.08,.24),c(N.paper),gt,0,-.27,.04),b.push(gt)}const[S,E]=g,[M,T]=b;s?.({style:n,name:e,head:h,body:f,arms:g,legs:b,mat:c,add:l});const z=l(n.box(.4,.3,.3),c(N.crate),f,0,.62,.3);l(n.box(.41,.04,.12),c(N.tape),z,0,.15,0);const R=new Wt;R.position.set(0,-.33,.04),E.add(R);const D=l(n.cylinder(.055,.11),c(N.paper),R,0,0,0),O=l(n.ball(.08),c(N.orange),R,0,0,.02),C=new Wt;R.add(C);const F=l(n.ball(.08),c(N.pineapple),C,0,0,.03);F.scale.y=1.4;const W=c(N.gold,.6),U=F.material,B=l(n.cylinder(.09,.025),c(N.gold,.4),d,0,1.4,0);B.rotation.x=Math.PI/2,l(n.box(.06,.12,.06),c(N.pineLeaf),C,0,.16,.03);const P=new Wt;R.add(P),l(n.box(.2,.01,.14),c(N.paper),P,0,.02,.06);const H=l(n.box(.3,.38,.015),c(N.paper),f,0,.58,.32);H.rotation.x=-.35;const k=new Wt;d.add(k),l(n.box(.28,.04,.85),c(N.skate),k,0,.15,0);for(const X of[-.27,.27]){l(n.box(.38,.04,.07),c(N.truck),k,0,.11,X);for(const lt of[-.21,.21]){const gt=l(n.cylinder(.065,.08),c(N.wheel),k,lt,.065,X);gt.rotation.z=Math.PI/2}}const L=l(n.box(.26,.06,.03),c(N.sunglasses),h,0,.04,.215),V=new Wt;d.add(V);for(const[X,lt,gt]of[[-.12,0,.12],[.06,.04,.15],[.2,-.01,.1]])l(n.ball(gt),c(N.cloud),V,X,lt,0);V.position.set(0,1.05,.47);const at=l(n.box(.04,.16,.04),c(N.marker),R,0,-.02,.03),j=new Wt;f.add(j),j.position.set(0,.62,.34),j.rotation.x=-.3,l(n.box(.46,.32,.015),c(N.paper),j,0,0,0);for(let X=0;X<4;X++)l(n.box(.36,.025,.005),c(N.ink),j,0,.1-X*.065,.01);const pt=new Wt;R.add(pt),l(n.box(.03,.12,.03),c(N.trunk),pt,0,.06,.05),l(n.box(.16,.16,.025),c(N.glass,.25),pt,0,.19,.05);const J=new Wt;f.add(J),J.position.set(0,1.25,.12),l(n.box(.62,.44,.015),c(N.paper),J,0,0,0),N.mural.slice(0,3).forEach((X,lt)=>l(n.box(.16,.16,.005),c(X),J,-.18+lt*.18,.04,.01));const Q=new Wt;d.add(Q),Q.position.set(-.3,0,.55),l(n.box(.06,.8,.06),c(N.dark),Q,0,.4,0),l(n.box(.75,.48,.05),c(N.dark),Q,0,1,0),l(n.box(.68,.41,.01),c(N.glass,.6),Q,0,1,-.03);const dt=new Wt;d.add(dt),dt.position.set(0,0,.4),l(n.box(.36,.42,.26),c(N.dark),dt,0,.21,0);const Ot=l(n.box(.24,.3,.012),c(N.paper),dt,0,.5,0),mt=new Wt;d.add(mt),l(n.box(.62,.1,.03),c(N.dark),mt,0,0,0);const Gt=l(n.box(.58,.06,.035),c(N.bar,.3),mt,0,0,.005),Qt=[0,1,2].map(()=>l(n.box(.06,.09,.04),c(N.sweat,.3),h,0,0,0)),ct=[0,1,2].map(()=>l(n.ball(.08),c(N.steam),d,0,0,0)),xt=(X,lt)=>{X.rotation.set(lt[0],lt[1],lt[2])};let q=-1,et=-1;return{name:e,main:t,outfit:a,group:d,apply(X){d.visible=X.opacity>.001,d.position.set(X.x,X.lift??0,X.z),d.rotation.set(X.tilt?.[0]??0,X.dir,X.tilt?.[1]??0,"YXZ");const lt=X.board;k.position.set(lt?.x??0,lt?lt.y-.08:0,lt?.z??0),k.rotation.set(lt?.rot[0]??0,lt?.rot[1]??0,lt?.rot[2]??0,"YXZ"),f.position.set(0,X.y,0),xt(f,X.body),xt(h,X.head),xt(S,X.armL),xt(E,X.armR),M.rotation.set(X.legL,0,0),T.rotation.set(X.legR,0,0);const gt=X.eyes<xE;for(const G of p)G.visible=!gt,G.scale.y=X.eyes;for(const G of _)G.visible=gt;x.visible=X.mouth==="smile",m.visible=X.mouth==="laugh",v.visible=X.mouth==="oh";const ft=X.props;z.visible=ft.crate,z.position.set(0,ft.crateUp?1.62*u:.62,ft.crateUp?0:.3),F.material=ft.golden?W:U,B.visible=ft.coin!==null,ft.coin!==null&&(B.position.y=1.5*u+X.y+ft.coin*.5),D.visible=ft.mug,O.visible=ft.orange,C.visible=ft.pine;const wt=Math.max(.15,1-ft.eaten*.85);if(O.scale.setScalar(wt),C.scale.setScalar(wt),P.visible=ft.plane,H.visible=ft.sheet,k.visible=ft.skate,L.visible=ft.glasses,at.visible=ft.marker,j.visible=ft.newspaper,pt.visible=ft.magnifier,J.visible=ft.poster,Q.visible=ft.bigScreen,dt.visible=ft.shredder!==null,ft.shredder!==null&&(Ot.position.y=.5-ft.shredder*.32),mt.visible=ft.progress!==null,ft.progress!==null){const G=Math.max(.02,ft.progress);Gt.scale.x=G,Gt.position.x=-.29*(1-G),mt.position.set(0,1.62*u+X.y,0)}if(V.visible=ft.cloud>.02,V.scale.setScalar(Math.max(.01,ft.cloud)),Qt.forEach((G,Rt)=>{if(G.visible=ft.hot!==null,ft.hot===null)return;const Dt=(ft.hot+Rt/3)%1;G.position.set((Rt-1)*.17,.16-Dt*.4,.16),G.scale.setScalar(1-Dt*.6)}),ct.forEach((G,Rt)=>{if(G.visible=ft.hot!==null,ft.hot===null)return;const Dt=(ft.hot*.66+Rt/3)%1;G.position.set(Math.sin(Dt*6+Rt)*.1,1.28*u+Dt*.9,0),G.scale.setScalar(.6+Dt)}),X.grey!==q){q=X.grey;for(const[G,Rt]of r)G.color.copy(Rt).lerp(mE,X.grey*.85)}if(X.opacity!==et){const G=et>=1||et<0;et=X.opacity;const Rt=X.opacity>=1;for(const Dt of r.keys())Dt.opacity=X.opacity,(Dt.transparent===Rt||G!==Rt)&&(Dt.transparent=!Rt,Dt.needsUpdate=!0)}},headTop(X){return h.getWorldPosition(X),X.y+=.3*u,X},feet(X){return X.set(d.position.x,0,d.position.z)},dispose(){d.traverse(X=>{X instanceof Se&&X.geometry.dispose()});for(const X of r.keys())X.dispose()}}}const Ye={crate:!1,mug:!1,orange:!1,pine:!1,sheet:!1,plane:!1,skate:!1,glasses:!1,cloud:0,hot:null,marker:!1,newspaper:!1,bigScreen:!1,magnifier:!1,poster:!1,shredder:null,progress:null,coin:null,golden:!1,crateUp:!1,eaten:0},Ss=[0,0,0],ue={y:0,body:Ss,head:Ss,armL:Ss,armR:Ss,legL:0,legR:0,eyes:1,mouth:"smile",props:Ye,screen:0,lamp:!0,grey:0,dx:0,dz:0,face:null},Ri={y:-.05,legL:-1.45,legR:-1.45},Zx=new Set(["work","hot","main"]),gE=(e,t)=>t?0:e,_E=new Set(["think","computer","compact","build","edit","tool","unknown"]);function vE(e,t,n,i){const s=e==="hot",a={...Ye,hot:s?(n*.9+i)%1:null},o=s?"oh":"smile";switch(t.doing){case"think":return t.at==="board"?{...ue,mouth:o,armL:[-.3,0,0],head:[-.15,0,0],armR:[-2.4+Math.sin(n*6+i)*.2,0,.2+Math.sin(n*3+i)*.25],props:{...a,marker:!0}}:{...ue,...Ri,mouth:o,armR:[-2.2,0,-.5],armL:[-1.2,0,0],head:[-.25,.2+Math.sin(n*1.5+i)*.1,0],screen:.6,props:a};case"search":return{...ue,...Ri,mouth:o,armL:[-1.3,0,.35],armR:[-1.3,0,-.35],head:[.2,0,0],screen:.5,props:{...a,newspaper:!0}};case"computer":return{...ue,dx:-.75,dz:.1,face:0,mouth:o,head:[.05,-.5,0],armR:[-1+Math.sin(n*4+i)*.08,0,Math.sin(n*3+i)*.1],armL:Ss,screen:.4,props:{...a,bigScreen:!0}};case"image":return{...ue,...Ri,mouth:"oh",armR:[-2,0,-.3],armL:[-1.2,0,0],head:[.1,0,0],screen:.9,props:{...a,magnifier:!0}};case"publish":return{...ue,mouth:"laugh",eyes:.3,armL:[-2.6,0,.2],armR:[-2.6,0,-.2],props:{...a,poster:!0}};case"compact":return{...ue,dx:.6,face:0,mouth:o,armL:[-1.1,0,0],armR:[-1.1,0,0],head:[.35,0,0],screen:.4,props:{...a,shredder:(n*.8+i)%1}};case"build":return{...ue,dz:-.15,mouth:o,armL:[-1.2,0,.9],armR:[-1.2,0,-.9],head:[.1,0,0],screen:.9,props:{...a,progress:(n+i*3)%12/12}};case"edit":case"tool":case"unknown":case void 0:{const r=s?22:12;return{...ue,...Ri,armL:[-1.2+Math.sin(n*r+i)*.18,0,0],armR:[-1.2+Math.sin(n*r+i+2)*.18,0,0],head:[.15+Math.sin(n*2+i)*.04,Math.sin(n*.7+i)*.15,0],body:s?[0,0,Math.sin(n*30)*.015]:Ss,mouth:o,screen:.9,props:a}}}}function ME(e){return e.doing===void 0||_E.has(e.doing)||e.k==="hot"}const yE={...ue,y:.22,dz:.15,body:[-.9,0,0],legL:-.4,legR:-.4,armL:[0,0,-.5],armR:[0,0,.5],eyes:.15,mouth:"oh",face:0},ip={...ue,...Ri,body:[.3,0,0],head:[.6,0,0],armL:[-1.4,0,0],armR:[-1.4,0,0],eyes:.15,mouth:"oh"},ya=1.6,nl=2.6,iu=4,sp=ya+iu*nl,ac=(e,t,n)=>[e[0]+(t[0]-e[0])*n,e[1]+(t[1]-e[1])*n,e[2]+(t[2]-e[2])*n],po=[-1.3,0,-.2],Ld=[-2.25,0,-.45],ap=[-.75,0,.1];function bE(e,t,n){const i=Math.floor(t/sp),s=t-i*sp,a=e===2,o=a?2:(e+i)%2,r=(h,p)=>({...Ye,pine:p&&o===0,orange:p&&o===1,mug:p&&a,eaten:a?0:h});if(s<ya){const h=s/ya,p=h<.5?Qi(h*2):1-Qi((h-.5)*2);return{...ue,body:[.22*p,0,0],head:[.1+.3*p,0,0],armR:h<.5?ac(po,ap,Qi(h*2)):ac(ap,po,Qi((h-.5)*2)),armL:[-.15,0,0],mouth:"smile",props:r(0,h>=.5)}}const c=Math.floor((s-ya)/nl),l=s-ya-c*nl,d=c/iu,f=(c+1)/iu;if(l<.5)return{...ue,armR:ac(po,Ld,Qi(l/.5)),head:[-.05,0,0],mouth:"oh",props:r(d,!0)};if(l<.75)return{...ue,armR:Ld,head:[.15,0,0],mouth:"smile",eyes:.6,props:r(f,f<1)};if(l<1.15)return{...ue,armR:ac(Ld,po,Qi((l-.75)/.4)),head:[.05,0,0],mouth:"smile",props:r(f,f<1)};const u=Math.sin((l-1.15)*Math.PI*6+n);return{...ue,armR:po,head:[.04+u*.04,0,Math.sin((l-1.15)*2+n)*.05],mouth:u>0?"oh":"smile",eyes:.4,props:r(f,f<1)}}function op(e,t,n,i=t){const s=e.k,a=e.urgent===!0,o=e.fruit??0;switch(s){case"work":case"main":case"hot":return vE(s,e,t,n);case"starting":return{...ue,head:[0,.35,0],armR:[0,0,2.4],face:Math.PI};case"nap":return e.at==="desk"?ip:yE;case"sleep":case"waitagent":return ip;case"snack":return bE(o,i,n);case"asks":return{...ue,dx:.65,dz:.15,face:0,y:Math.abs(Math.sin(t*(a?5.2:2.6)+n))*.08,armR:[0,0,2.7+Math.sin(t*5+n)*.25],armL:a?[-1.3,0,0]:Ss,mouth:"oh",screen:.6,props:a?{...Ye,sheet:!0}:Ye};case"blocked":return{...ue,...Ri,armL:[-1.2,0,.9],armR:[-1.2,0,-.9],head:[.25,0,0],mouth:"oh",screen:.4};case"failed":return{...ue,...Ri,body:[.35,0,0],head:[.7,0,0],armL:[-.2,0,0],armR:[-.2,0,0],eyes:.3,mouth:"oh",props:{...Ye,cloud:1}};case"landing":return{...ue,armL:[-1.3,0,0],armR:[-1.3,0,0],props:{...Ye,crate:!0}};case"done":return{...ue,y:.26,dz:.33,body:[-1,0,0],legL:-.2,legR:-.2,armL:[0,0,-2.6],armR:[0,0,2.6],props:{...Ye,glasses:!0}};case"stopped":return{...ue,...Ri,armL:[-.9,0,0],armR:[-.9,0,0],head:[.1,0,0],lamp:!1,grey:1};case"mainidle":return{...ue,...Ri,armL:[-1.3,0,.35],armR:[-1.3,0,-.35],head:[.25,0,0],props:{...Ye,sheet:!0}};case"coffee":return{...ue,armR:[-1.5,0,0],head:[-.1,0,.06],mouth:"laugh",eyes:.3,props:{...Ye,mug:!0}};case"visit":return{...ue,armR:[-1.2,0,-.3],head:[.1,0,0]};case"report":return{...ue,armL:[-1.3,0,0],armR:[-1.3,0,0],props:{...Ye,sheet:!0}}}}function SE(e,t){return e===null||e===t?0:t==="sleep"||t==="waitagent"?1.5:t==="failed"?1.2:t==="stopped"?.5:e==="sleep"||e==="waitagent"||e==="failed"||e==="stopped"?1:.6}const Nl=1.5,Kx=2,Qi=e=>e<=0?0:e>=1?1:e*e*(3-2*e),An=(e,t,n)=>e+(t-e)*n,oc=(e,t,n)=>[An(e[0],t[0],n),An(e[1],t[1],n),An(e[2],t[2],n)];function Jx(e,t,n){const i=n>=.5;return{y:An(e.y,t.y,n),body:oc(e.body,t.body,n),head:oc(e.head,t.head,n),armL:oc(e.armL,t.armL,n),armR:oc(e.armR,t.armR,n),legL:An(e.legL,t.legL,n),legR:An(e.legR,t.legR,n),eyes:An(e.eyes,t.eyes,n),mouth:i?t.mouth:e.mouth,props:{...i?t.props:e.props,cloud:An(e.props.cloud,t.props.cloud,n)},screen:An(e.screen,t.screen,n),lamp:i?t.lamp:e.lamp,grey:An(e.grey,t.grey,n),dx:An(e.dx,t.dx,n),dz:An(e.dz,t.dz,n),face:i?t.face:e.face}}function wE(e,t){if(e==="done")return{...ue,y:.1,legL:.2,legR:-.3,armL:[0,0,-1.1],armR:[0,0,1.1],body:[0,.5,0],mouth:"laugh",eyes:.3,props:{...Ye,skate:!0,glasses:!0}};const n=t*9,i=e==="landing";return{...ue,y:Math.abs(Math.sin(n))*.05,legL:Math.sin(n)*.6,legR:-Math.sin(n)*.6,armL:[i?-1.3:-Math.sin(n)*.5,0,0],armR:[i?-1.3:Math.sin(n)*.5,0,0],props:i?{...Ye,crate:!0}:Ye}}function EE(e,t,n,i){const s=Math.sin(Math.PI*n);return(t==="sleep"||t==="waitagent")&&n<.6?{...i,armL:[0,0,-2.6*s],armR:[0,0,2.6*s],mouth:"oh",eyes:.6}:(e==="sleep"||e==="waitagent")&&Zx.has(t)?{...i,y:i.y+.18*s,eyes:1}:t==="failed"?{...i,armL:[-2.4*s,0,.4],armR:[-2.4*s,0,-.4]}:e==="stopped"?{...i,armL:[0,0,-2.2*s],armR:[0,0,2.2*s]}:i}function TE(e,t){const n=t-Nl;return n<0||n>Kx?e:n<.4?{...e,armR:[0,0,2.6],eyes:1,mouth:"smile",screen:Math.max(e.screen,.4)}:n<1.3?{...e,armR:[-1.4,0,-.3],head:[.35,0,0],props:{...e.props,plane:!0},eyes:1,mouth:"smile"}:n<1.7?{...e,armR:[-.4,0,2.2],mouth:"laugh",eyes:.3}:Jx({...e,armR:[-.4,0,2.2]},e,Qi((n-1.7)/.3))}const Qx=.8;function AE(e,t){const{path:n}=e.seg;if(!t||n.len<.01||e.seg.from===null)return{x:e.x,z:e.z,opacity:1,fading:!1};const i=Math.min(Qx,n.len/e.seg.speed),s=e.since,a=n.pts[0],o=n.pts[n.pts.length-1];return!a||!o?{x:e.x,z:e.z,opacity:1,fading:!1}:s<i/2?{x:a.x,z:a.z,opacity:1-s/(i/2),fading:!0}:s<i?{x:o.x,z:o.z,opacity:(s-i/2)/(i/2),fading:!0}:{x:o.x,z:o.z,opacity:1,fading:!1}}function jx(e){const{pose:t,t:n,phase:i,reduced:s}=e,{seg:a}=t,o=a.act,r=o.k,c=gE(n,s),l=AE(t,s),d=a.path.len>.01&&a.from!==null?a.path.len/a.speed:0,f=s?!l.fading:!t.moving,u=s?0:SE(a.from,r),h=t.since-(s?Math.min(Qx,d):d),p=op(o,c,i,s?ya+nl-.2:Math.max(0,h-u));let _,x;if(!f&&!s)_=wE(r,n),x="walk";else if(!f)_=p,x="walk";else if(h<u){const M=d>0?ue:a.from===null?p:op({k:a.from,at:o.at},c,i),T=Qi(h/u);_=EE(a.from,r,h/u,Jx(M,p,T)),x="walk"}else _=p,x=!s&&(Zx.has(r)&&ME(o)||r==="asks"||r==="snack")?"loop":"still";if(t.plane&&!s){const M=t.plane.since;M<Nl+Kx&&(x="walk"),f&&(_=TE(_,M))}const m=_.face??t.dir,v=Math.cos(m),y=Math.sin(m),g=l.x+_.dx*v+_.dz*y,b=l.z-_.dx*y+_.dz*v,S={x:g,z:b,dir:m,y:_.y,body:_.body,head:_.head,armL:_.armL,armR:_.armR,legL:_.legL,legR:_.legR,eyes:_.eyes,mouth:_.mouth,props:_.props,screen:_.screen,lamp:_.lamp,grey:_.grey,opacity:l.opacity,motion:x};return!f&&!s&&(a.pastime!==void 0||a.fromSkate===!0)?RE(S,a.fromSkate===!0?t.since:1/0):S}const zE=.4;function RE(e,t){const n={x:.3,y:.62,z:.05,rot:[0,0,Math.PI/2]},i=t/zE,s=i<1?{x:n.x*i,y:.08+(n.y-.08)*i,z:.35*(1-i),rot:[Math.PI*2*i,0,Math.PI/2*i]}:n;return{...e,armR:[-.4,0,.35],props:{...e.props,skate:!0},board:s}}function CE(e,t){return e==="walk"||t==="walk"?"walk":e==="skate"||t==="skate"?"skate":e==="loop"||t==="loop"?"loop":"still"}function PE(e,t,n,i=!1){const s=Math.min(1,Math.max(0,n/Nl)),a=1-(1-s)*(1-s),o=(1-a)*1.6,r=Math.sin(s*Math.PI*3)*.12*(1-s),c={x:e.x-zn.x*o+r,y:e.y+t*(1-a),z:e.z-zn.z*o},l={x:zn.x*1.6*2*(1-s),y:-t*2*(1-s)-.01,z:zn.z*1.6*2*(1-s)};if(i&&s>.2&&s<.6){const d=(s-.2)/.4*Math.PI*2,f=.45;return{p:{x:c.x+zn.x*Math.sin(d)*f,y:c.y+(1-Math.cos(d))*f,z:c.z+zn.z*Math.sin(d)*f},heading:{x:zn.x*Math.cos(d),y:Math.sin(d),z:zn.z*Math.cos(d)},roll:0}}return{p:c,heading:l,roll:Math.sin(s*Math.PI*2)*.35}}function LE(e){const t=new Wt,n=e.material(N.paper,{flat:!0}),i=e.material(N.paperShade,{flat:!0}),s=new Se(e.box(.16,.012,.42),n);s.position.set(-.08,0,0),s.rotation.z=.25;const a=new Se(e.box(.16,.012,.42),n);a.position.set(.08,0,0),a.rotation.z=-.25;const o=new Se(e.box(.02,.07,.38),i);return o.position.set(0,-.035,-.01),t.add(s,a,o),t.scale.setScalar(1.3),{group:t,dispose(){for(const r of[s,a,o])r.geometry.dispose();n.dispose(),i.dispose()}}}const we={knees:.5,arms:1,up:0,lean:0,spin:0,board:[0,0,0],boardUp:0,mouth:"smile",eyes:1,sit:!1},IE=.17,Ge=e=>e<=0?0:e>=1?1:e*e*(3-2*e),De=(e,t,n)=>e+(t-e)*n,ci=e=>Math.max(0,Math.min(1,e)),bn=(e,t)=>e<=0||e>=1?0:4*t*e*(1-e),DE=(e,t)=>Math.atan2(e,t),Oo=(e,t)=>t===1?e.ramp.xb:e.ramp.xa,tg=(e,t)=>(e.ramp.z0+e.ramp.z1)/2+sr(t)*.8,il=.9,NE=(e,t,n)=>tg(t,n)+(e.trick==="fifty"?e.side===1?-il:il:0),eg=e=>e?.75:.6,ba=.45,wo=.7,Sa=.3,ng=e=>{const t=e.line.moves[e.i-1];return t&&t.trick!=="roll"?t:null},ig=e=>{let t=0;for(let n=e.i-1;n>=0&&e.line.moves[n]?.trick!=="roll";n--)t++;return t};function UE(e,t,n){const{park:i,slot:s}=t,{r:a}=i.ramp,o=e.side,r=Oo(i,o),c=tg(i,s),l=DE(o,0),d=ng(t),f=eg(d===null);if(n<f){if(d===null){const m=Ox(i,s),v=n/f;if(v<.4){const g=v/.4,b=1-g,S=b*b*m.x+2*b*g*m.x+g*g*(m.x+o*1),E=b*b*m.z+2*b*g*c+g*g*c;return{x:S,z:E,ys:Zn(i,t.stage,S,E),air:0}}const y=De(m.x+o*1,r,Ge((v-.4)/.6));return{x:y,z:c,ys:jc(i,y),air:0,dir:l}}const p=d.bail?Oo(i,d.side)-d.side*a:Oo(i,d.side),_=Ge(n/f),x=De(p,r,_);return{x,z:De(NE(d,i,s),c,_),ys:jc(i,x),air:0,dir:l}}const u=(n-f)/(1-f),h=p=>({x:r+o*p*ci(Math.min(u,1-u)*6),z:c,ys:a,air:0,dir:l});switch(e.trick){case"fs_air":return{x:r,z:c,ys:a,air:bn(u,1),dir:l};case"fs_180":case"bs_180":return{x:r,z:c,ys:a,air:bn(u,.6),dir:l};case"pump":return{x:r,z:c,ys:a,air:bn(u,.15),dir:l};case"fifty":return{x:r,z:c+(o===1?-il:il)*Ge(u),ys:a,air:0,dir:l};case"rock_to_fakie":return h(.12);default:return h(.18)}}function OE(e,t,n){const{park:i,stage:s,slot:a}=t,o=i.qp,r=ju(i,s),c=Fx(i,s,a),l=Math.PI,d=c.x;if(n<ba){const u=De(c.z,o.zLip,Ge(n/ba));return{x:d,z:u,ys:Zn(i,s,d,u),air:0,dir:l}}if(n>wo){const u=De(o.zLip,c.z,Ge((n-wo)/(1-wo)));return{x:d,z:u,ys:Zn(i,s,d,u),air:0,dir:l}}const f=(n-ba)/(wo-ba);return e.trick==="axle_stall"?{x:d,z:o.zLip-.15*ci(Math.min(f,1-f)*6),ys:r,air:0,dir:l}:{x:d,z:o.zLip,ys:r,air:bn(f,e.trick==="nine"?1.4:.85),dir:l}}const rp=(e,t)=>e?.75-.72*Math.sin(Math.PI*t):.75-.45*Math.sin(Math.PI*t),FE=(e,t)=>Math.PI+e.slot*.9+t*Math.PI;function BE(e,t,n){const{park:i,stage:s}=t,a=i.bowl,o=ig(t),r=o===0,c=FE(t,o);if(r&&n<Sa){const u=Gs(i,s,"bowl",e.side,t.slot),h=tl(a,rp(!1,0),c),p=n/Sa,_=De(u.x,h.x,p),x=De(u.z,h.z,p);return{x:_,z:x,ys:Zn(i,s,_,x),air:0}}const l=r?(n-Sa)/(1-Sa):n,d=e.trick==="fs_air",f=tl(a,rp(d,l),c+Math.PI*l);return{x:f.x,z:f.z,ys:Zn(i,s,f.x,f.z),air:d?bn((l-.35)/.3,.8):0}}function xs(e,t,n){const{park:i,stage:s,slot:a}=t;switch(e.on){case"flat":case"funbox":{const o=Gs(i,s,e.on,e.side,a),r=ar(i,s,e.on,e.side,a),c=De(o.x,r.x,n);return{x:c,z:o.z,ys:Zn(i,s,c,o.z),air:0}}case"curb":case"rail":case"ledge":{const o=i[e.on],r=Ux(i,e.on),[c,l]=e.side===1?[o.x0-Ma,o.x1+Ma]:[o.x1+Ma,o.x0-Ma],d=De(c,l,n);if(n<.2){const f=n/.2;return{x:d,z:De(r,o.z,Ge((f-.3)/.7)),ys:0,air:o.h*Ge(f/.5)+bn(f,.15)}}if(n>.8){const f=(n-.8)/.2;return{x:d,z:De(o.z,r,Ge(f/.7)),ys:0,air:o.h*(1-Ge((f-.5)/.5))+bn(f,.12)}}return{x:d,z:o.z,ys:o.h,air:0}}case"stairs":{const o=i.stairs,r=t0(o),c=e0(i),l=c[c.length-1]??{x:o.xTop-.5},d=o.xBottom+.5;if(n<.2)return{x:De(l.x,o.xTop,n/.2),z:r,ys:o.h,air:0};if(n<.8){const f=(n-.2)/.6;return{x:De(o.xTop,d,f),z:r,ys:0,air:o.h*(1-f*f)+bn(f,.3)}}return{x:De(d,ar(i,s,"stairs",1,a).x,(n-.8)/.2),z:r,ys:0,air:0}}case"ramp":return UE(e,t,n);case"qp":case"vert":return OE(e,t,n);case"bowl":return BE(e,t,n);case null:return{x:i.area.x0,z:i.area.z0,ys:0,air:0}}}function GE(e,t){const n=xs(e,t,1);return e.on==="ramp"&&e.bail?{x:Oo(t.park,e.side)-e.side*t.park.ramp.r,z:n.z}:{x:n.x,z:n.z}}function HE(e,t,n){const i=xs(e,t,1);if(e.on!=="ramp")return{...i,ys:Zn(t.park,t.stage,i.x,i.z),air:0};const s=Oo(t.park,e.side),a=De(s,s-e.side*t.park.ramp.r,Ge(n/.3));return{x:a,z:i.z,ys:jc(t.park,a),air:0,dir:i.dir}}function VE(e,t){const{park:n,stage:i,slot:s,line:a,i:o}=e,r=a.moves[o-1],c=a.moves[o],l=[];let d=t;if(r&&r.on){const u=GE(r,{...e,i:o-1});if(d=ar(n,i,r.on,r.side,s),r.on==="ramp"){const{xa:h,xb:p,r:_}=n.ramp,x=Math.max(h+_+.3,Math.min(p-_-.3,u.x));l.push(u,{x,z:u.z},{x:d.x,z:u.z})}else if(r.on==="bowl"){const h=n.bowl,p=Math.atan2(d.z-h.z,d.x-h.x);l.push(u,tl(h,.45,p),tl(h,0,p))}}const f=c.on?Gs(n,i,c.on,c.side,s):t;return l.push(...kx(n,i,d,f)),c.on==="stairs"&&l.push(...e0(n).slice(1)),l}function WE(e,t,n){const i=e.trick,s=r=>{if(t<.25)return{...we,knees:De(.5,1.1,t/.25)};if(t<.75){const c=(t-.25)/.5,l=Ge(Math.min(1,c/.85));return{...we,knees:1.1,arms:1.4,up:bn(c,.12),boardUp:bn(c,.22),board:[r[0]*l,r[1]*l,r[2]*l]}}return{...we,knees:De(1,.5,(t-.75)/.25)}},a=(r,c,l)=>r*Ge((n-c)/(l-c)),o=r=>({...we,knees:n>.1&&n<.9?1.3:.6,arms:n>.15&&n<.85?1.9:1.1,spin:r*Ge(n)});switch(i){case"ollie":return s([0,0,0]);case"kickflip":return s([0,0,Math.PI*2]);case"heelflip":return s([0,0,-Math.PI*2]);case"shove_it":return s([0,Math.PI,0]);case"tre_flip":return s([0,Math.PI*2,Math.PI*2]);case"no_comply":{const r=ci((t-.2)/.6);return{...we,knees:.8,arms:1.3,boardUp:bn(r,.25),board:[bn(r,.7),0,0]}}case"manual":return{...we,knees:.6,arms:1.5,lean:-.25,board:[-.28*ci(Math.min(t,1-t)*6),0,0]};case"fifty":if(e.on==="ramp"){const r=n<.15?Math.PI/2*Ge(n/.15):n<.85?Math.PI/2:Math.PI/2+Math.PI/2*Ge((n-.85)/.15);return{...we,knees:.75,arms:1.4,spin:r}}return{...we,knees:.7,arms:1.3};case"five_o":return{...we,knees:.6,arms:1.4,lean:-.15,board:[-.22,0,0]};case"nosegrind":return{...we,knees:.8,arms:1.3,lean:.15,board:[.22,0,0]};case"boardslide":return{...we,knees:.75,arms:1.4,board:[0,Math.PI/2,0],spin:t>.2&&t<.8?Math.PI/2:0};case"drop_in":case"axle_stall":return{...we,knees:.8,arms:1.2,spin:a(Math.PI,.3,.8)};case"pump":return{...we,knees:.5+Math.abs(Math.sin(t*Math.PI*2))*.5,spin:a(Math.PI,.1,.9)};case"rock_to_fakie":return{...we,knees:.8,arms:1.2,board:[-.5*bn(ci(n/.5),1),0,0],spin:a(Math.PI,.45,.95)};case"fs_180":return{...we,knees:1,arms:1.3,spin:Math.PI*Ge(n)};case"bs_180":return{...we,knees:1,arms:1.3,spin:-Math.PI*Ge(n)};case"carve":return{...we,knees:.75,arms:1.1};case"fs_air":return o(e.on==="bowl"?Math.PI*2:Math.PI);case"nine":return o(Math.PI*5);case"roll":return we}}function kE(e,t,n){switch(e.on){case"ramp":{const i=eg(ng(t)===null);return ci((n-i)/(1-i))}case"qp":case"vert":return ci((n-ba)/(wo-ba));case"bowl":{const i=ig(t)===0?(n-Sa)/(1-Sa):n;return ci((i-.35)/.3)}default:return n}}const Id=(e,t,n)=>Math.hypot(t.x-e.x,t.z-e.z)<1e-4?n:Math.atan2(t.x-e.x,t.z-e.z),Fo=.42;function XE(e,t,n,i){const s=Math.sin(i),a=Math.cos(i),o=y=>[Zn(e,t,n.x+s*y,n.z+a*y),Zn(e,t,n.x-s*y,n.z-a*y)];let r=0,c=Fo;for(let y=0;y<14;y++){const g=(r+c)/2,[b,S]=o(g);Math.hypot(g*2,b-S)>2*Fo?c=g:r=g}const l=r,[d,f]=o(l),u=.04,h=(ec(e,t,n.x+u,n.z)-ec(e,t,n.x-u,n.z))/(2*u),p=(ec(e,t,n.x,n.z+u)-ec(e,t,n.x,n.z-u))/(2*u),_=h*a-p*s,x=ci(1-n.air/.3),m=y=>Math.max(-1.35,Math.min(1.35,y));return{base:Math.max(n.ys,De(n.ys,(d+f)/2,x)),tilt:[m(-Math.atan2(d-f,2*l))*x,m(Math.atan(_))*x]}}function $E(e,t,n,i){const s=t.seg.pastime;if(!s||t.moving)return null;const a=n.spots[s.slot]??n.spots[0];if(!a)return null;const o=Xx(e,s,$x(t),n),r=o.move;if(!r)return ZE(a.x,a.z,a.face);const c={park:n,stage:s.stage,slot:s.slot,line:o.line,i:o.line.moves.indexOf(r)},l=r.bail?Math.max(.01,r.dur-Da):r.dur,d=ci(o.into/l);let f,u,h;if(r.trick==="roll"){const T=VE(c,a),z=n0(T),R=Ge(d)*z,D=wd(T,R);f={x:D.x,z:D.z,ys:Zn(n,s.stage,D.x,D.z),air:0},u=R>.05?wd(T,R-.05):D;const O=wd(T,R+.05);h=r.on===null&&d>=.98?a.face:Id(u,O,a.face)}else{f=r.bail&&o.into>l?HE(r,c,(o.into-l)/Da):xs(r,c,d);const z=xs(r,c,Math.max(0,d-.02));u=d<.02&&c.i>0?xs(r,c,0):z,h=f.dir??Id(u,f,Id(xs(r,c,d),xs(r,c,Math.min(1,d+.02)),a.face))}const p=r.bail&&o.into>l,_=r.trick==="roll"?qE(d,o.into,i):WE(r,d,kE(r,c,d)),x=p?YE((o.into-l)/Da):_,m=h+x.spin,v=XE(n,s.stage,f,m),y=v.tilt,g=y[0],b=Math.sin(m)*Math.cos(g)*Fo,S=Math.cos(m)*Math.cos(g)*Fo,E=-Math.sin(g)*Fo;let M=v.base+f.air;for(const T of[1,-1])M=Math.max(M,Zn(n,s.stage,f.x+T*b,f.z+T*S)-T*E);return sg(f.x,f.z,m,M,y,x,"skate")}function qE(e,t,n){const i=Math.sin((t+n)*5);return{...we,knees:.45,arms:.9,up:e<.6&&i>.6?-.02:0}}function YE(e){return e<.15?{...we,knees:1.2,arms:2.2,mouth:"oh",eyes:1,board:[0,0,Math.PI*.6*(e/.15)]}:e<.8?{...we,sit:!0,mouth:"laugh",eyes:.3}:{...we,knees:De(1.2,.5,(e-.8)/.2),mouth:"laugh",eyes:.3}}function ZE(e,t,n){return{...sg(e,t,n,0,[0,0],{...we,knees:0,arms:.2},"still"),y:0,legL:0,legR:-.35,body:[0,0,0],head:[0,0,0],board:{x:.3,y:.08,z:.3,rot:[0,.3,0]}}}function sg(e,t,n,i,s,a,o){const r=a.knees,c={x:0,y:.08+a.boardUp,z:0,rot:a.board};return a.sit?{x:e,z:t,dir:n,y:-.12,body:[-.5,0,0],head:[-.2,0,0],armL:[0,0,-.6],armR:[0,0,.6],legL:-1.45,legR:-1.45,eyes:a.eyes,mouth:a.mouth,props:{...Ye,skate:!0},screen:0,lamp:!0,grey:0,opacity:1,motion:o,lift:i,tilt:s,board:{x:.2,y:.08,z:.7,rot:[0,.5,Math.PI]}}:{x:e,z:t,dir:n,y:IE+a.up-r*.08,body:[a.lean,1.25,0],head:[0,-1,0],armL:[0,0,-a.arms],armR:[0,0,a.arms],legL:r,legR:-r*.6,eyes:a.eyes,mouth:a.mouth,props:{...Ye,skate:!0},screen:0,lamp:!0,grey:0,opacity:1,motion:o,lift:i,tilt:s,board:c}}const cp=e=>e<.5?2*e*e:1-(-2*e+2)**2/2,Dd=(e,t)=>[e[0]+t[0],e[1]+t[1],e[2]+t[2]];function KE(e,t){if(t===null)return e;const n=Number.isFinite(t.dur)?Math.min(1,Math.max(0,t.since/t.dur)):0,i=t.since,s=Number.isFinite(t.dur),a=(()=>{switch(t.kind){case"salto":return{...e,y:e.y+Math.sin(Math.PI*n)*.7,body:Dd(e.body,[-2*Math.PI*cp(n),0,0]),mouth:"laugh"};case"hop":return{...e,y:e.y+Math.sin(Math.PI*n)*.35,props:{...e.props,coin:n}};case"kickflip":return{...e,y:e.y+Math.sin(Math.PI*n)*.3,body:Dd(e.body,[0,2*Math.PI*cp(n),0]),props:{...e.props,skate:!0},mouth:"laugh"};case"moonwalk":return{...e,dir:e.dir+Math.PI};case"itemget":return{...e,armL:[-Math.PI*.95,0,.2],armR:[-Math.PI*.95,0,-.2],props:{...e.props,crate:!0,crateUp:!0},mouth:"oh"};case"tap":return{...e,armR:[-1.3+Math.sin(i*18)*.25,0,0]};case"clap":{const o=.35+Math.sin(i*14)*.3;return{...e,armL:[-1.3,0,o],armR:[-1.3,0,-o],mouth:"laugh"}}case"dance":return{...e,armL:[-1.5,0,0],armR:[-1.5,0,0],body:Dd(e.body,[0,0,Math.sin(i*6)*.2]),y:e.y+Math.abs(Math.sin(i*6))*.08};case"lookup":return{...e,head:[-.6,e.head[1],e.head[2]],mouth:"oh"};case"golden":return{...e,props:{...e.props,pine:!0,golden:!0}};case"shades":return{...e,props:{...e.props,glasses:!0}};case"speedrun":case"combo":case"stare":case"tetris":case"loop":return e}})();return s&&t.kind!=="moonwalk"?{...a,motion:"walk"}:a}function JE(e,t,n=0){const i=new Wt,s=[],a=(z,R=0)=>{const D=t.material(z,R>0?{emissive:z,ei:R}:{});return s.push(D),D},o=(z,R,D,O,C,F)=>{const W=new Se(z,R);return W.position.set(O,C,F),D.add(W),W},r=new Wt,c=a(N.paper,.35);o(t.capsule(.22,.3),c,r,0,0,0),o(t.ball(.035),a(N.ink),r,-.08,.12,.2),o(t.ball(.035),a(N.ink),r,.08,.12,.2),r.visible=!1,i.add(r);const l=e.lounge.length?e.lounge:[e.mainDesk],d=l.reduce((z,R)=>z+R.x,0)/l.length,f=l.reduce((z,R)=>z+R.z,0)/l.length,u=new Wt,h=a(N.pineLeaf);o(t.cylinder(.06,.25),a(N.crate),u,0,.12,0);for(const[z,R]of[.42,.32,.22].entries())o(t.cylinder(R,.3),h,u,0,.35+z*.25,0).scale.set(1,1,1);o(t.ball(.07),a(N.gold,.6),u,0,1.2,0),u.position.set(d,0,f-.6),u.visible=!1,i.add(u);const p=new Wt,_=a(N.paper);o(t.cylinder(.4,.22),_,p,0,.11,0),o(t.cylinder(.3,.18),_,p,0,.31,0),o(t.cylinder(.03,.18),a(N.pineapple),p,0,.49,0),o(t.ball(.045),a(N.gold,.9),p,0,.61,0),p.position.set((e.island.x0+e.island.x1)/2,.66,e.island.z1-.6),p.visible=!1,i.add(p);const x=new Wt,m=e.boardSpots.length?e.boardSpots.reduce((z,R)=>z+R.x,0)/e.boardSpots.length:0,v=.08+t.pictureZ;o(t.box(1.7,.85,.01),a(N.paper),x,m,1.05,v-.005);const y=a(N.marker);for(const z of[-.13,.13])o(t.box(.025,.7,.01),y,x,m+z,1.05,v);for(const z of[-.12,.12])o(t.box(.75,.025,.01),y,x,m,1.05+z,v);const g=a(N.board[0]);for(const[z,R]of[[-.26,.24],[0,0],[.26,-.24]])o(t.box(.16,.025,.01),g,x,m+z,1.05+R,v+.003).rotation.z=Math.PI/4,o(t.box(.16,.025,.01),g,x,m+z,1.05+R,v+.003).rotation.z=-Math.PI/4;x.visible=!1,i.add(x);const b=new Wt,S=a(N.ink);for(const[z,[R,D]]of[[-.22,.25],[.02,.42],[.26,.3]].entries()){const O=new Wt;O.position.set(R??0,D??0,0),O.rotation.z=(z-1)*.25,o(t.ball(.055),S,O,0,0,0).scale.set(1.25,.9,.6),o(t.box(.022,.2,.022),S,O,.05,.1,0),b.add(O)}b.position.set((e.island.x0+e.island.x1)/2,.95,e.island.z0+lr(e,n)-.6),b.visible=!1,i.add(b);const E=e.x0-.5,M=e.x0+e.W+.5,T=(e.island.z0+e.island.z1)/2;return{root:i,update(z){const R=z?.ghost??null;return r.visible=R!==null,R!==null&&r.position.set(E+(M-E)*R,1.7+Math.sin(R*Math.PI*6)*.08,T),u.visible=z?.tree===!0,p.visible=z?.cake===!0,x.visible=z?.doodle===!0,b.visible=z?.music===!0,R!==null},dispose(){i.traverse(z=>{z instanceof Se&&z.geometry.dispose()});for(const z of s)z.dispose()}}}function sl(e,t,n,i,s,a,o,r){const c=r.filter(p=>p.x0>a-t/2&&p.x1<a+t/2&&p.z0>o-i/2&&p.z1<o+i/2);if(c.length===0)return e.box(t,n,i,s);const l=new as,d=-t/2,f=-i/2,u=Math.min(s,t/2,i/2);l.moveTo(d+u,f),l.lineTo(d+t-u,f),l.quadraticCurveTo(d+t,f,d+t,f+u),l.lineTo(d+t,f+i-u),l.quadraticCurveTo(d+t,f+i,d+t-u,f+i),l.lineTo(d+u,f+i),l.quadraticCurveTo(d,f+i,d,f+i-u),l.lineTo(d,f+u),l.quadraticCurveTo(d,f,d+u,f);for(const p of c){const _=new Qo,[x,m]=[p.x0-a,p.x1-a],[v,y]=[-(p.z1-o),-(p.z0-o)];_.moveTo(x,v),_.lineTo(x,y),_.lineTo(m,y),_.lineTo(m,v),_.lineTo(x,v),l.holes.push(_)}const h=new $s(l,{depth:n,bevelEnabled:!1,curveSegments:6});return h.rotateX(-Math.PI/2),h.translate(0,-n/2,0),h}const QE=e=>e.pendants?1.1:.55;function a0(e){e.traverse(t=>{t instanceof Se&&(t.castShadow=!0,t.receiveShadow=!0)})}function jE(e,t,n,i,s,a=is,o=!0){const r=i.pal(s),c=nx(n,r),l=new Wt,d=sm(e,a),f=d.x1-d.x0,u=d.z1-d.z0,h=(d.x0+d.x1)/2,p=(d.z0+d.z1)/2,_=i.pits?.(e,a.stage)??[];o&&(c.add(sl(n,f,1.2,u,.45,h,p,_),c.mat(r.dirt),l,h,-.75,p),c.add(sl(n,f,.16,u,0,h,p,_),c.mat(r.grass),l,h,-.1,p));const x=new Map,m={k:c,root:l,o:e,grow:a,stage(g){if(g>a.stage)return null;let b=x.get(g);return b||(b=new Wt,x.set(g,b),l.add(b)),b}};m.stage(0),i.shell(m),i.island(m),i.lounge(m);const v=new Map;for(const[g,b]of e.desks)v.set(g,i.desk(m,b,g));const y=i.mainDesk(m,t);return v.set(t,y),i.growth(m),n.shadows&&a0(l),{root:l,desks:v,mainDesk:y,pal:r,pieces:x,dispose(){l.traverse(g=>{if(g instanceof Se){g.geometry.dispose();const b=g.material;for(const S of Array.isArray(b)?b:[b]){const E=S.map;E&&E.dispose(),S.dispose()}}})}}}function tT(e,t,n,i){e.screen.emissiveIntensity=n,e.screen.color.set(n>.05?t.screenOn:t.screenOff);const s=i&&t.pendants;e.lamp.emissiveIntensity=s?QE(t):0,e.lamp.color.set(s?t.lampOn:t.lamp)}const al=1e-6,lp=new WeakMap;function ag(e,t,n){if(Vs(t,n))return Eo([t]);const i=eT(e),s=dp(i,t),a=dp(i,n);if(iT(s,a))return Eo([t,n]);const o=i.nodes.length,r=new Array(o).fill(1/0),c=new Array(o).fill(-1),l=new Array(o).fill(!1);for(const h of s.ends)r[h.node]=Math.min(_e(r,h.node),h.w);for(;;){let h=-1;for(let p=0;p<o;p++)!_e(l,p)&&_e(r,p)<1/0&&(h<0||_e(r,p)<_e(r,h))&&(h=p);if(h<0)break;l[h]=!0;for(const{to:p,w:_}of _e(i.adj,h))_e(r,h)+_<_e(r,p)-al&&(r[p]=_e(r,h)+_,c[p]=h)}let d=-1,f=1/0;for(const h of a.ends){const p=_e(r,h.node)+h.w;p<f-al&&(f=p,d=h.node)}if(d<0)return Eo([t,n]);const u=[];for(let h=d;h>=0;h=_e(c,h))u.unshift(_e(i.nodes,h));return Eo([t,s.at,...u,n])}function Eo(e){const t=sT(e),n=[];let i=0;for(let s=1;s<t.length;s++){const a=Ci(_e(t,s-1),_e(t,s));n.push(a),i+=a}return{pts:t,seg:n,len:i}}function og(e,t){const n=_e(e.pts,0);let i=Math.max(0,t);for(let s=0;s<e.seg.length;s++){const a=_e(e.seg,s);if(i<=a||s===e.seg.length-1){const o=a>0?Math.min(1,i/a):1,r=_e(e.pts,s),c=_e(e.pts,s+1);return{x:r.x+(c.x-r.x)*o,z:r.z+(c.z-r.z)*o,dir:Math.atan2(c.x-r.x,c.z-r.z)}}i-=a}return{x:n.x,z:n.z,dir:0}}function eT(e){let t=lp.get(e);return t||(t=nT(e),lp.set(e,t)),t}function nT(e){const n=e.walks.filter(([l,d])=>!Vs(l,d)),i=[],s=new Map,a=l=>{const d=oT(l);let f=s.get(d);return f===void 0&&(f=i.length,i.push(l),s.set(d,f)),f};for(const[l,d]of n)a(l),a(d);const o=[],r=i.map(()=>[]),c=new Set;for(const l of n){const d=i.filter(f=>rg(l,f)).sort((f,u)=>Ci(l[0],f)-Ci(l[0],u));for(let f=1;f<d.length;f++){const u=_e(d,f-1),h=_e(d,f),p=a(u),_=a(h);if(p===_)continue;const x=p<_?`${String(p)}-${String(_)}`:`${String(_)}-${String(p)}`;if(c.has(x))continue;c.add(x);const m=Ci(u,h);o.push([u,h]),_e(r,p).push({to:_,w:m}),_e(r,_).push({to:p,w:m})}}return{legs:o,nodes:i,adj:r}}function dp(e,t){const n=e.nodes.findIndex(o=>Vs(o,t));if(n>=0)return{at:_e(e.nodes,n),leg:-1,ends:[{node:n,w:0}]};const i=o=>e.nodes.findIndex(r=>Vs(r,o)),s=e.legs.findIndex(o=>rg(o,t));if(s>=0){const[o,r]=_e(e.legs,s);return{at:t,leg:s,ends:[{node:i(o),w:Ci(t,o)},{node:i(r),w:Ci(t,r)}]}}let a=0;return e.nodes.forEach((o,r)=>{Ci(o,t)<Ci(_e(e.nodes,a),t)&&(a=r)}),{at:_e(e.nodes,a),leg:-1,ends:[{node:a,w:0}]}}function iT(e,t){return e.leg>=0&&t.leg>=0?e.leg===t.leg:e.leg>=0?t.ends.some(n=>e.ends.some(i=>i.node===n.node)):t.leg>=0?e.ends.some(n=>t.ends.some(i=>i.node===n.node)):!1}function rg([e,t],n){const i=t.x-e.x,s=t.z-e.z,a=i*i+s*s;if(a<al*al)return Vs(e,n);const o=((n.x-e.x)*i+(n.z-e.z)*s)/a;return o<-1e-4||o>1+1e-4?!1:Math.abs((n.x-e.x)*s-(n.z-e.z)*i)/Math.sqrt(a)<1e-4}function sT(e){const t=[],n=i=>_e(t,t.length-i);for(const i of e)if(!(t.length&&Vs(n(1),i)))for(t.push({x:i.x,z:i.z});t.length>=3&&aT(n(3),n(2),n(1));)t.splice(t.length-2,1),t.length>=2&&Vs(n(2),n(1))&&t.pop();return t}function aT(e,t,n){const i=(t.x-e.x)*(n.z-t.z)-(t.z-e.z)*(n.x-t.x),s=(t.x-e.x)*(n.x-t.x)+(t.z-e.z)*(n.z-t.z);return Math.abs(i)<1e-6&&s>=0}const Ci=(e,t)=>Math.hypot(e.x-t.x,e.z-t.z),Vs=(e,t)=>Ci(e,t)<1e-4;function _e(e,t){const n=e[t];if(n===void 0)throw new Error(`bims paths: index ${String(t)} out of ${String(e.length)}`);return n}const oT=e=>`${String(Math.round(e.x*1e4))},${String(Math.round(e.z*1e4))}`,rT=.35,cT=.4;function lT(e,t){const n=[],i=()=>{if(n.length===0)for(const a of["crew-a","crew-b"]){const o=Yx(a,!1,t);t.shadows&&a0(o.group),o.group.visible=!1,e.add(o.group),n.push(o)}return n},s=()=>{for(const a of n)a.group.visible=!1};return{update(a,o,r,c,l,d){if(!r)return s(),c&&c.scale.setScalar(1),!1;const f=a-r.at,u=wc+em;if(l||f>=u||f<0)return s(),c&&(c.visible=!0,c.scale.setScalar(1)),!1;if(c){const S=(f-wc)/cT;c.visible=S>0;const E=Math.min(1,Math.max(.01,S));c.scale.setScalar(E)}const h=d.pieceAt(o,r.stage),p=ag(o,o.door,h),_=Math.max(.5,p.len/wc),x={k:"landing",at:"queue"},m={x:h.x,z:h.z,wz:h.z,ax:h.x,face:0},v={t:r.at,act:x,sig:"unlock",spot:m,path:p,speed:_,from:"starting"},y=Math.min(p.len,f*_),g=og(p,y),b=y<p.len;return i().forEach((S,E)=>{const M=(E===0?-1:1)*rT,T={x:g.x+Math.cos(g.dir)*M,z:g.z-Math.sin(g.dir)*M,dir:g.dir,moving:b,since:f,seg:v},z=jx({pose:T,t:a,phase:E*.5,reduced:!1}),R=Math.min(1,Math.max(0,u-f));S.apply({...z,opacity:Math.min(z.opacity,R)}),S.group.visible=!0}),!0},dispose(){for(const a of n)e.remove(a.group),a.dispose();n.length=0}}}const dT=.42,fT=12,uT=1.25,hT=.45,pa={inner:.34,outer:.5,alpha:.28,day:"#1d1a17",night:"#f3ede4"};function pT(e,t={}){const n=t.ground??!0,i=new Wt;let s=null,a=[],o=null,r=null,c=!1,l=null,d=!1,f=is,u=zo(is);const h=lT(i,e),p=new Map,_=new Map,x=new Map,m=new Lu(pa.inner,pa.outer,40);m.rotateX(-Math.PI/2);const v=new vl({color:pa.day,transparent:!0,opacity:pa.alpha,depthWrite:!1}),y=new Map;function g(){return nu(s?.map??"loft")}function b(){return a.find(C=>C.main)?.name??"main"}function S(C){if(o&&(i.remove(o.root),o.dispose(),o=null),r=C,!s)return;const F=nu(s.map);c=!1,o=jE(s,b(),e,F,C,f,n),i.add(o.root),l&&(i.remove(l.root),l.dispose()),l=JE(s,e,f.stage),i.add(l.root)}function E(C,F){if(!d||F)return;const W=a.filter(H=>!H.main).map(H=>H.name),U=W.indexOf(C),B=W[(U+1)%W.length]??C,P=ex(B,!1);return U===0?{...P,hoodie:tx}:P}function M(){for(const C of p.values())i.remove(C.group),C.dispose();p.clear(),_.clear()}function T(){const C=new Set(a.map(F=>F.name));for(const[F,W]of p)C.has(F)||(i.remove(W.group),W.dispose(),p.delete(F),_.delete(F));for(const F of a)z(F.name,F.main)}function z(C,F){let W=p.get(C);if(!W){const U=g();W=Yx(C,F,e,E(C,F),F?void 0:B=>U.wear?.(B)),e.shadows&&a0(W.group),W.group.visible=!1,p.set(C,W),i.add(W.group)}return W}function R(C,F){const W=new Set;for(const U of C){const B=U.pose.plane?.since;if(B===void 0||B<0||B>=Nl)continue;const P=_.get(U.name);if(!P)continue;W.add(U.name);let H=x.get(U.name);H||(H=LE(e),x.set(U.name,H),i.add(H.group));const k={x:P.x,y:1,z:P.z},L=PE(k,Kg(F,k),B,U.egg?.kind==="loop");H.group.visible=!0,H.group.scale.setScalar(Math.max(1,fT*uT*F.scale/dT)),H.group.position.set(L.p.x,L.p.y,L.p.z),H.group.lookAt(L.p.x+L.heading.x,L.p.y+L.heading.y,L.p.z+L.heading.z),H.group.rotateZ(L.roll)}for(const[U,B]of x)W.has(U)||(i.remove(B.group),B.dispose(),x.delete(U));return W.size>0}function D(C,F){v.color.set(F?pa.night:pa.day);const W=new Set;for(const U of C){const B=_.get(U.name);if(U.lit!==!0||!B)continue;W.add(U.name);let P=y.get(U.name);P||(P=new Se(m,v),P.renderOrder=1,y.set(U.name,P),i.add(P)),P.position.set(B.x,.02,B.z),P.visible=B.opacity>.05}for(const[U,B]of y)W.has(U)||(i.remove(B),y.delete(U))}const O=C=>{const F=p.get(C);return F&&F.group.visible?F:null};return{root:i,setOffice(C,F){s&&s.map!==C.map&&M(),s=C,a=F,S(r??!1),T()},prepare(C){if(!s)return!1;const F=C.grow??is;let W=!1;zo(F)!==u?(f=F,u=zo(F),S(C.night),W=!0):r!==C.night&&S(C.night),c=C.eggs?.eclipse===!0;const U=C.eggs?.april===!0;return U!==d&&(d=U,M()),W},frame(C,F,W,U,B){if(!s||!o)return null;const P=o.pal;let H="still";const k=new Set;_.clear();for(const L of F){const V=z(L.name,L.main),at=s.park,j=at&&!W.reduced?$E(L.name,L.pose,at,V.outfit.phase):null,pt=KE(j??jx({pose:L.pose,t:C,main:L.main,phase:V.outfit.phase,reduced:W.reduced}),L.egg??null);V.apply(pt),_.set(L.name,pt),k.add(L.name),H=CE(H,pt.motion),B?.(L,pt,j!==null)}for(const[L,V]of p)k.has(L)||(V.group.visible=!1);D(F,W.night);for(const[L,V]of o.desks){const at=_.get(L);tT(V,P,at?.screen??0,at?at.lamp:L!==b())}return!W.reduced&&R(F,U)&&(H="walk"),l?.update(W.eggs)===!0&&(H="walk"),h.update(C,s,W.unlock,W.unlock?o.pieces.get(W.unlock.stage):void 0,W.reduced,g())&&(H="walk"),H},sky(){return o?c?new te(o.pal.bg).lerp(new te(N.eclipse),hT):o.pal.bg:null},pal:()=>o?.pal??null,office:()=>s,headTop(C,F){return O(C)?.headTop(F)??null},feet(C,F){return O(C)?.feet(F)??null},names:()=>[...p.keys()],desk:C=>o?.desks.get(C),pieceAt(C){return s?g().pieceAt(s,C):null},world:()=>o?.root??null,dispose(){o&&(i.remove(o.root),o.dispose(),o=null),l&&(l.dispose(),l=null),h.dispose();for(const C of p.values())C.dispose();p.clear();for(const C of x.values())C.dispose();x.clear();for(const C of y.values())i.remove(C);y.clear(),m.dispose(),v.dispose()}}}function mT(e,t){const n=new Zb({canvas:e,antialias:gn.antialias,alpha:!1,powerPreference:"low-power"});n.shadowMap.enabled=gn.shadows,n.shadowMap.type=Ro,n.shadowMap.autoUpdate=t.shadowAuto;const i=new Z1,s=new Sl(-1,1,1,-1,.1,Rr*3),a=new $_,o=new Z_;i.add(a,o,o.target);let r=!1,c=null;const l=[],d=f=>{f.preventDefault(),r=!0;for(const u of l)u()};return e.addEventListener("webglcontextlost",d),{renderer:n,scene:i,camera:s,hemi:a,sun:o,look(f){const u=f.target;s.position.set(u.x+za.x*Rr,u.y+za.y*Rr,u.z+za.z*Rr),s.up.set(0,1,0),s.lookAt(u.x,u.y,u.z),s.left=f.left,s.right=f.right,s.top=f.top,s.bottom=f.bottom,s.updateProjectionMatrix()},size(f){n.setPixelRatio(Math.min(window.devicePixelRatio||1,gn.maxPixelRatio)),n.setSize(f.widthPx,f.heightPx,!1)},sky(f){c!==null&&typeof f!="object"&&c===f||(c=f,n.setClearColor(f))},tint(f){a.color.set(f.hemi[0]),a.groundColor.set(f.hemi[1]),a.intensity=f.hemi[2],o.color.set(f.sun[0]),o.intensity=f.sun[1]},render(){n.render(i,s)},copyTo(f){n.render(i,s),f.getContext("2d")?.drawImage(e,0,0,f.width,f.height)},lost:()=>r,onLost(f){l.push(f)},dispose(){e.removeEventListener("webglcontextlost",d),n.dispose()}}}const xT=14;function gT(e,t,n){const i=n.x-t.x,s=n.y-t.y,a=i*i+s*s,o=a===0?0:Math.max(0,Math.min(1,((e.x-t.x)*i+(e.y-t.y)*s)/a));return Math.hypot(e.x-(t.x+i*o),e.y-(t.y+s*o))}function _T(e,t,n){const i={x:t,y:n};let s=null,a=xT;for(const c of e){if(!c.head||!c.feet)continue;const l=gT(i,c.head,c.feet);l<a&&(a=l,s=c.name)}if(s!==null)return s;let o=null,r=1/0;for(const c of e){if(!c.desk)continue;const l=Math.hypot(t-c.desk.x,n-c.desk.y);l<c.desk.r&&l<r&&(r=l,o=c.name)}return o}const ws=1.25,cg=1.5,Cs=1.8,wa=11,lg=.5,vT=ws+.3,MT=Cs-.2,yT=7,rc=2.5,bT=12;function ST(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let n=t;return n=Math.imul(n^n>>>15,n|1),n^=n+Math.imul(n^n>>>7,n|61),((n^n>>>14)>>>0)/4294967296}}function wT(e){let t=2166136261;for(let n=0;n<e.length;n++)t=Math.imul(t^e.charCodeAt(n),16777619);return t>>>0}function ET(e){return e<=3?Math.min(2,Math.max(1,e)):Math.ceil(Math.sqrt(e*1.3))}function TT(e,t,n){const i=[];let s=e;for(;s>0;){const a=t<=2?t:t+(n()<.3?-1:n()<.45?1:0),o=s-a===1&&t>2?s:Math.min(s,Math.max(1,a));i.push(o),s-=o}return i}const ol=(e,t)=>Math.hypot(e.x-t.x,e.z-t.z);function fp(e,t){const n=e[0];if(n===void 0)return[];const i=[n];let s=0;for(let o=1;o<e.length;o++){const r=e[o-1]??n,c=e[o]??r,l=ol(r,c);let d=t-s;for(;d<=l;){const f=d/l;i.push({x:r.x+(c.x-r.x)*f,z:r.z+(c.z-r.z)*f}),d+=t}s=l-(d-t)}const a=e[e.length-1]??n;return ol(i[i.length-1]??n,a)>1e-6&&i.push(a),i}function AT(e,t){let n=e;for(let i=0;i<t;i++){if(n.length<3)return[...n];const s=[n[0]??{x:0,z:0}];for(let a=0;a<n.length-1;a++){const o=n[a]??{x:0,z:0},r=n[a+1]??o;s.push({x:.75*o.x+.25*r.x,z:.75*o.z+.25*r.z},{x:.25*o.x+.75*r.x,z:.25*o.z+.75*r.z})}s.push(n[n.length-1]??{x:0,z:0}),n=s}return[...n]}function up(e,t){return fp(AT(fp(e,t),4),lg)}function su(e,t,n,i){return e.some(s=>t>s.fp.x0-i&&t<s.fp.x1+i&&n>s.fp.z0-i&&n<s.fp.z1+i)}function dg(e){return{road:e.road.filter(t=>su(e.offices,t.x,t.z,vT)).length,river:e.river.filter(t=>su(e.offices,t.x,t.z,MT)).length}}const fg=8,hp=7;function zT(e,t,n,i){const s=[],a=[];let o=0,r=0;return e.forEach((c,l)=>{const d=l>0&&l-1===t,f=c.home===!0||e[l-1]?.home===!0;let u=l===0?0:d?wa:f?yT:3+n()*4;l>0&&!d&&!f&&i.since>=i.next&&(u=fg+2+n()*2,a.push(o+u/2),i.since=0,i.next=4+Math.floor(n()*2)),i.since++,d&&(r=o+wa/2);const h=o+u-c.fp.x0;s.push(h),o=h+c.fp.x1}),t>=e.length-1&&(r=o+wa/2,o+=wa),{xs:s,riverX:r,width:o,squares:a}}function pp(e,t){const n=ST(t),i=e.find(U=>U.home===!0),s=e.filter(U=>U.home!==!0),a=[];let o=0;for(const U of TT(s.length,ET(e.length),n))a.push(s.slice(o,o+U)),o+=U;if(i!==void 0){const U=a[Math.floor(a.length/2)];U===void 0?a.push([i]):U.splice(Math.ceil(U.length/2),0,i)}const r=[],c=[],l={since:0,next:4+Math.floor(n()*2)};let d=0;for(const[U,B]of a.entries()){const P=B.length===1?0:Math.min(B.length-2,Math.max(0,Math.floor(B.length/2)-1+U%2)),H=zT(B,P,n,l),k=r[U-1],L=k===void 0?-H.width/2:k.riverX+(n()-.5)*6-H.riverX,V=B.map((mt,Gt)=>{const Qt=(H.xs[Gt]??0)+L,ct=d+n()*5-mt.fp.z0;return{id:mt.id,x:Qt,z:ct,fp:{x0:Qt+mt.fp.x0,x1:Qt+mt.fp.x1,z0:ct+mt.fp.z0,z1:ct+mt.fp.z1},door:{x:Qt+mt.doorX,z:ct+mt.fp.z1}}}),at=Math.max(...V.map(mt=>mt.fp.z1)),j=Math.min(...V.map(mt=>mt.fp.z0)),pt=V.map(mt=>mt.fp.z1+2+n()*6),J=[];V.forEach((mt,Gt)=>{const Qt=pt[Gt]??mt.fp.z1+3;J.push({x:mt.door.x,z:Qt});const ct=V[Gt+1],xt=pt[Gt+1];ct!==void 0&&xt!==void 0&&J.push({x:(mt.fp.x1+ct.fp.x0)/2,z:Math.max(Qt,xt)+n()*1.2})});for(const mt of H.squares)c.push({x:mt+L,z:d+1+hp/2,w:fg,d:hp});const Q=H.riverX+L,dt=Math.min(L,...V.map(mt=>mt.fp.x0),Q-wa/2),Ot=Math.max(L+H.width,...V.map(mt=>mt.fp.x1),Q+wa/2);r.push({offices:V,riverX:Q,back:j,front:at,x0:dt,x1:Ot,stops:J}),d=Math.max(...J.map(mt=>mt.z))+ws+4+n()*2.5}const f=r.flatMap(U=>U.offices),u=Math.min(...r.map(U=>U.x0)),h=Math.max(...r.map(U=>U.x1)),p=Math.min(...r.map(U=>U.back)),_=Math.max(...r.map(U=>Math.max(...U.stops.map(B=>B.z)))),x=[],m=r[0]?.stops[0]??{z:0};x.push({x:u-40,z:m.z-3},{x:u-8,z:m.z}),r.forEach((U,B)=>{const P=B%2===0,H=P?U.stops:[...U.stops].reverse();x.push(...H);const k=r[B+1],L=H[H.length-1]??m;if(k===void 0){x.push({x:P?h+8:u-8,z:L.z},{x:P?h+40:u-40,z:L.z+3});return}const at=(P?[...k.stops].reverse():k.stops)[0]??L,j=P?Math.max(U.x1,k.x1)+6+n()*2:Math.min(U.x0,k.x0)-6-n()*2,pt=P?3:-3;x.push({x:j,z:L.z},{x:j+pt,z:(L.z+at.z)/2},{x:j,z:at.z})});const v=up(x,2.5),y=[];if(f.length>1){const U=[],B=r[0];B!==void 0&&U.push({x:B.riverX-3,z:p-16},{x:B.riverX+1,z:p-8}),r.forEach((P,H)=>{U.push({x:P.riverX,z:P.back-3},{x:P.riverX,z:P.front+Cs+.6});const k=r[H+1];k!==void 0?U.push({x:k.riverX,z:k.back-Cs-.6}):U.push({x:P.riverX+2,z:_+8},{x:P.riverX-2,z:_+18})}),y.push(...up(U,1.2))}const g={x0:u-12,x1:h+14,z0:p-10,z1:_+10},b=i===void 0?void 0:f.find(U=>U.id===i.id),S=b===void 0?null:{x0:b.fp.x0-rc,x1:b.fp.x1+rc,z0:b.fp.z0-rc,z1:b.fp.z1+rc},E=(U,B)=>U>g.x0&&U<g.x1&&B>g.z0&&B<g.z1,M=[];for(let U=0;U<v.length-1;U++){const B=v[U],P=v[U+1];B===void 0||P===void 0||!E(B.x,B.z)||M.some(H=>ol(H,B)<6)||y.some(H=>ol(H,B)<lg)&&M.push({x:B.x,z:B.z,ang:Math.atan2(P.x-B.x,P.z-B.z)})}const T=[],z=[];for(const U of f){let B=1/0;for(let k=0;k<v.length-1;k++){const L=v[k],V=v[k+1];if(L===void 0||V===void 0||(L.x-U.door.x)*(V.x-U.door.x)>0||L.x===V.x)continue;const at=L.z+(V.z-L.z)*(U.door.x-L.x)/(V.x-L.x);at>U.door.z&&at<B&&(B=at)}if(!Number.isFinite(B))continue;const P={x:U.door.x,z0:U.door.z,z1:B};T.push(P);const H=y.filter(k=>Math.abs(k.x-P.x)<cg&&k.z>P.z0&&k.z<P.z1-ws);H.length>0&&z.push({x:P.x,z:H.reduce((k,L)=>k+L.z,0)/H.length})}const R=(U,B,P,H)=>U.some(k=>Math.abs(k.x-B)<H&&Math.abs(k.z-P)<H&&Math.hypot(k.x-B,k.z-P)<H),D=(U,B,P)=>E(U,B)&&(S===null||U<S.x0-P||U>S.x1+P||B<S.z0-P||B>S.z1+P)&&!c.some(H=>Math.abs(H.x-U)<H.w/2+P+.4&&Math.abs(H.z-B)<H.d/2+P+.4)&&!su(f,U,B,1.2+P)&&!R(v,U,B,ws+1.2+P)&&!R(y,U,B,Cs+.6+P)&&T.every(H=>Math.abs(H.x-U)>1.2+P||B<H.z0||B>H.z1),O=[],C=Math.min(10,3+f.length);for(let U=0;U<400&&O.length<C&&v.length>1;U++){const B=Math.floor(n()*(v.length-1)),P=v[B],H=v[B+1];if(P===void 0||H===void 0)continue;const k=Math.atan2(H.x-P.x,H.z-P.z),L=n()<.5?-1:1,V=ws+2.6,at=P.x+Math.cos(k)*V*L,j=P.z-Math.sin(k)*V*L;!D(at,j,1.4)||R(O,at,j,4)||O.push({x:at,z:j,ang:k,w:1.7+n()*.8,d:1.7+n()*.8,tone:O.length})}const F=[],W=30+f.length*8;for(let U=0;U<900&&F.length<W;U++){const B=g.x0+n()*(g.x1-g.x0),P=g.z0+n()*(g.z1-g.z0);if(!D(B,P,.6))continue;const H=1+Math.floor(n()*5);for(let k=0;k<H;k++){const L=B+(n()-.5)*3,V=P+(n()-.5)*3;D(L,V,0)&&!R(O,L,V,2.2)&&!R(F,L,V,.7)&&F.push({x:L,z:V,size:.75+n()*.5})}}return{offices:f,road:v,river:y,bridges:M,paths:T,footbridges:z,houses:O,trees:F,squares:c,heart:S,lawn:g,seed:t}}function RT(e,t){let n=null;for(let i=0;i<bT;i++){const s=pp(e,t+i*7919>>>0),a=dg(s),o=a.road+a.river;if(o===0)return s;(n===null||o<n.hits)&&(n={plan:s,hits:o})}return n?.plan??pp(e,t)}const CT={water:"#7cc3e8",bank:"#d9cf9c",road:"#9a9590",dash:"#f4f0e8",path:"#e2c79a",wood:"#c49a6c",rail:"#a0673f",trunk:"#a0673f",leaves:["#5fb35a","#7cc26b","#4e9a48"],walls:["#f3d5b5","#bfe1f2","#fffaf0","#ffe3a3","#cfe8c3"],roofs:["#ef8354","#5c677d","#2a9d8f"],stone:"#e4dccd"},PT={water:"#1d3b52",bank:"#3c5a3a",road:"#3a3d44",dash:"#8d8a84",path:"#5c4b3e",wood:"#6b5440",rail:"#5c4b3e",trunk:"#6e4a31",leaves:["#3f8a3e","#4f9a4a","#356f33"],walls:["#8a7663","#5e7686","#9a9284","#9a8455","#6f8466"],roofs:["#8a4a33","#3c4350","#1f6a62"],stone:"#6f685f"},ge=-.06;function cc(e,t,n,i){const s=[];for(let r=0;r<e.length-1;r++){const c=e[r],l=e[r+1];if(c===void 0||l===void 0||!i(c)||!i(l))continue;const d=e[r-1]??c,f=e[r+2]??l,u=mp(l.x-d.x,l.z-d.z),h=mp(f.x-c.x,f.z-c.z),p=[c.x+u.x*t,n,c.z+u.z*t],_=[c.x-u.x*t,n,c.z-u.z*t],x=[l.x+h.x*t,n,l.z+h.z*t],m=[l.x-h.x*t,n,l.z-h.z*t];s.push(...p,...x,..._,..._,...x,...m)}const a=new Pe;a.setAttribute("position",new fn(new Float32Array(s),3));const o=new Float32Array(s.length);for(let r=1;r<o.length;r+=3)o[r]=1;return a.setAttribute("normal",new fn(o,3)),a}function mp(e,t){const n=Math.hypot(e,t)||1;return{x:-t/n,z:e/n}}function LT(e,t,n,i,s=[]){const a=nx(t,n),o=new Wt,{lawn:r}=e,c=v=>v.x>r.x0&&v.x<r.x1&&v.z>r.z0&&v.z<r.z1,l=r.x1-r.x0,d=r.z1-r.z0,f=(r.x0+r.x1)/2,u=(r.z0+r.z1)/2;a.add(sl(t,l,1.2,d,.45,f,u,s),a.mat(n.dirt),o,f,ge-.08-.6-.01,u),a.add(sl(t,l,.16,d,.05,f,u,s),a.mat(n.grass),o,f,ge-.08,u);const h=(v,y)=>{const g=new Se(v,a.mat(y));o.add(g)};e.river.length>1&&(h(cc(e.river,Cs,ge+.005,c),i.bank),h(cc(e.river,cg,ge+.012,c),i.water)),h(cc(e.road,ws,ge+.02,c),i.road);const p=[];for(let v=0;v+2<e.road.length;v+=5){const y=e.road[v],g=e.road[v+2];y!==void 0&&g!==void 0&&p.push([y,g])}for(const v of p)h(cc(v,.06,ge+.03,c),i.dash);for(const v of e.paths){const y=v.z1-v.z0;y>0&&a.add(t.box(1,.04,y,.01),a.mat(i.path),o,v.x,ge+0,v.z0+y/2)}const _=(v,y,g,b,S)=>{const E=new Wt;E.position.set(v,0,y),E.rotation.y=g,o.add(E),a.add(t.box(b*2+.6,.14,S),a.mat(i.wood),E,0,ge+.1,0);for(const M of[-1,1]){a.add(t.box(.12,.12,S),a.mat(i.rail),E,M*(b+.25),ge+.45,0);for(const T of[-S/2+.2,0,S/2-.2])a.add(t.box(.14,.42,.14),a.mat(i.rail),E,M*(b+.25),ge+.3,T)}};for(const v of e.bridges)_(v.x,v.z,v.ang,ws,Cs*2+1);for(const v of e.footbridges)_(v.x,v.z,0,.5,Cs*2+.6);for(const v of e.houses){const y=new Wt;y.position.set(v.x,0,v.z),y.rotation.y=v.ang,o.add(y),a.add(t.box(v.w,1.2,v.d,.2),a.mat(i.walls[v.tone%i.walls.length]??n.wall),y,0,ge+.6,0);const g=a.add(new yl(Math.max(v.w,v.d)*.78,.9,4),a.mat(i.roofs[v.tone%i.roofs.length]??n.wallTop),y,0,ge+1.65,0);g.rotation.y=Math.PI/4}for(const v of e.squares){a.add(t.box(v.w-1,.05,v.d-1,.3),a.mat(i.stone),o,v.x,ge+.01,v.z),a.add(t.cylinder(1.1,.36),a.mat(i.stone),o,v.x,ge+.2,v.z),a.add(t.cylinder(.92,.06),a.mat(i.water),o,v.x,ge+.38,v.z),a.add(t.cylinder(.16,.7),a.mat(i.stone),o,v.x,ge+.5,v.z);for(const y of[-1,1]){a.add(t.box(1.3,.1,.4),a.mat(i.wood),o,v.x,ge+.32,v.z+y*2.1);for(const g of[-.5,.5])a.add(t.box(.1,.3,.3),a.mat(i.rail),o,v.x+g,ge+.15,v.z+y*2.1)}for(const[y,g]of[[-1,-1],[1,-1],[-1,1],[1,1]])m(v.x+y*(v.w/2-1.1),v.z+g*(v.d/2-1.1),.8)}const x=e.heart;if(x!==null){const v=(x.x0+x.x1)/2,y=(x.z0+x.z1)/2;a.add(t.box(x.x1-x.x0,.05,x.z1-x.z0,.3),a.mat(i.stone),o,v,ge+.01,y);for(const[g,b]of[[-1,-1],[1,-1],[-1,1],[1,1]]){const S=g<0?x.x0+.9:x.x1-.9,E=b<0?x.z0+.9:x.z1-.9;m(S,E,1);const M=S-g*1.6;a.add(t.box(1.1,.4,.7,.08),a.mat(i.stone),o,M,ge+.2,E),a.add(t.ball(.42),a.mat(i.leaves[1]),o,M,ge+.55,E)}for(const g of[-1,1]){const b=g<0?x.x0+.5:x.x1-.5,S=new Wt;S.position.set(b,0,y),S.rotation.y=Math.PI/2,o.add(S),a.add(t.box(1.3,.1,.4),a.mat(i.wood),S,0,ge+.32,0);for(const E of[-.5,.5])a.add(t.box(.1,.3,.3),a.mat(i.rail),S,E,ge+.15,0)}}for(const v of e.trees)m(v.x,v.z,v.size);return o;function m(v,y,g){const b={x:v,z:y};a.add(t.cylinder(.14*g,1.2*g),a.mat(i.trunk),o,b.x,ge+.6*g,b.z),a.add(t.ball(.55*g),a.mat(i.leaves[0]),o,b.x,ge+1.5*g,b.z),a.add(t.ball(.38*g),a.mat(i.leaves[1]),o,b.x+.32*g,ge+1.25*g,b.z+.2*g),a.add(t.ball(.34*g),a.mat(i.leaves[2]),o,b.x-.3*g,ge+1.3*g,b.z-.15*g)}}const IT=480;function xp(e){return{...e.lawn,yLow:-1.35,yHigh:3}}function DT(e,t,n,i=!1){return i?Yg(xp(e),t,n):mu(xp(e),t,n)}function NT(e,t,n){const i=n>=IT?qg(t):gl(t);return{...i,x0:i.x0+e.x,x1:i.x1+e.x,z0:i.z0+e.z,z1:i.z1+e.z}}function UT(e,t,n){return mu(NT(e,t,n),n,4e3)}const gp=1.15;function OT(e,t,n,i=!1){const s=sm(t,n);if(!i)return{id:e,fp:{x0:s.x0,x1:s.x1,z0:s.z0,z1:s.z1},doorX:t.door.x};const a=(s.x0+s.x1)/2,o=(s.z0+s.z1)/2,r=(s.x1-s.x0)*gp/2,c=(s.z1-s.z0)*gp/2;return{id:e,fp:{x0:a-r,x1:a+r,z0:o-c,z1:o+c},doorX:t.door.x,home:!0}}const FT=e=>wT(e.join("\0")),BT=2.6,GT=1.6,HT=4,VT=()=>window.bise?.test===!0;function WT(e){const t=e.agents.map(n=>`${n.name}:${n.status}${n.main?"*":""}`).join(";");return`${e.office.map}|${e.office.size}|${[...e.office.desks.keys()].join(",")}|${zo(e.look.grow??is)}|${e.look.night?"n":"d"}|${t}`}const _p=e=>`${e.office.map}|${e.office.size}|${e.agents.map(t=>`${t.name}${t.main?"*":""}`).join(",")}`,kT=(e,t={})=>{const n=mT(e,{shadowAuto:!1}),{renderer:i,scene:s,sun:a}=n;let o=null,r="",c=[],l=null,d={w:0,maxH:0},f=null,u=null,h=Kb,p=!0,_="";const x=new Map;let m=null;const v=new Z,y=VT()?{frames:0,calls:0,ms:0,offices:0,merged:{from:0,to:0},live:[],recent:[],check:{road:0,river:0},heads:[]}:null;y&&(window.__biseTown=y);const g=L=>o?.offices.find(V=>V.id===L);function b(L){let V=x.get(L);return V||(V={scene:pT(gn,{ground:!1}),shape:"",bake:null,live:!1,walls:null},x.set(L,V)),V}function S(L){L.bake&&(s.remove(L.bake.holder),L.bake.merged.dispose(),L.bake=null)}function E(L){if(!L.walls)return;L.scene.root.remove(L.walls.merged.group),L.walls.merged.dispose(),L.walls=null;const V=L.scene.world();V&&(V.visible=!0)}function M(L,V){const at=L.scene.world();if(!at)return;const j=`${L.shape}|${zo(V.look.grow??is)}|${V.look.night?"n":"d"}|${String(at.id)}`;if(L.walls?.sig===j)return;E(L);const pt=L.scene.root.position.clone();L.scene.root.position.set(0,0,0),L.scene.root.updateMatrixWorld(!0),at.visible=!0;const J=Pd(at,gn,gn.shadows);L.scene.root.position.copy(pt),L.scene.root.updateMatrixWorld(!0);for(const Q of J.group.children){const dt=Q.material;dt!==J.baked&&dt.userData.live!==!0&&(Q.material=dt.clone())}at.visible=!1,L.scene.root.add(J.group),L.walls={sig:j,merged:J}}function T(L){const V=x.get(L);V&&(E(V),S(V),s.remove(V.scene.root),V.scene.dispose(),x.delete(L))}function z(L,V,at){(V.reshaped||L.shape!==_p(V))&&(L.shape=_p(V),L.scene.setOffice(V.office,V.agents)),L.scene.prepare(V.look);const j=U();return j?L.scene.frame(at,V.played,V.look,j):null}function R(){for(const[L,V]of x){const at=g(L);at&&(V.scene.root.position.set(at.x,0,at.z),V.bake&&V.bake.holder.position.set(at.x,0,at.z),V.bake&&(V.bake.holder.visible=!V.live))}p=!0}function D(L){if(!o)return;const V=c.flatMap(Q=>{const dt=g(Q.id),Ot=nu(Q.office.map).pits?.(Q.office,Q.grow.stage)??[];return dt?Ot.map(mt=>({x0:mt.x0+dt.x,x1:mt.x1+dt.x,z0:mt.z0+dt.z,z1:mt.z1+dt.z})):[]}),at=`${String(o.seed)}|${JSON.stringify(o.lawn)}|${String(o.road.length)}|${String(o.trees.length)}|${String(o.offices.length)}|${L?"n":"d"}|${JSON.stringify(V)}`;if(m?.sig===at)return;m&&(s.remove(m.merged.group),m.merged.dispose());const pt=LT(o,gn,L?hi:ui,L?PT:CT,V),J=Pd(pt,gn,gn.shadows);pt.traverse(Q=>{Q.geometry?.dispose()}),s.add(J.group),m={sig:at,merged:J},C(L),p=!0}function O(){if(!y)return;y.offices=x.size;let L=m?.merged.from??0,V=m?.merged.to??0;for(const at of x.values())at.bake&&(L+=at.bake.merged.from,V+=at.bake.merged.to);y.merged={from:L,to:V}}function C(L){if(!o)return;const V=L?hi:ui;n.tint(V),L&&t.nightLift!==void 0&&(n.hemi.intensity*=t.nightLift,a.intensity*=t.nightLift),n.sky(t.sky?L?t.sky.night:t.sky.day:V.bg),gn.shadows&&(a.castShadow=!0,a.shadow.mapSize.set(2048,2048),a.shadow.radius=4,a.shadow.bias=-8e-4),_="",F(U())}function F(L){if(!o)return;const{lawn:V}=o,at=Math.max(V.x1-V.x0,V.z1-V.z0)*.62+2;let j=(V.x0+V.x1)/2,pt=(V.z0+V.z1)/2,J=at;if(L&&L!==f&&f){const dt=[P(L,0,0,0),P(L,L.widthPx,0,0),P(L,0,L.heightPx,0),P(L,L.widthPx,L.heightPx,0)],Ot=dt.map(et=>et.x),mt=dt.map(et=>et.z),Gt=Math.min(...Ot),Qt=Math.max(...Ot),ct=Math.min(...mt),xt=Math.max(...mt),q=Math.max(Qt-Gt,xt-ct)*.62+4;q<at&&(j=(Gt+Qt)/2,pt=(ct+xt)/2,J=q)}const Q=`${j.toFixed(2)}|${pt.toFixed(2)}|${J.toFixed(2)}`;if(Q!==_&&(_=Q,a.position.set(j-15,42,pt-3),a.target.position.set(j,0,pt),a.target.updateMatrixWorld(),gn.shadows)){const dt=a.shadow.camera;dt.left=-J,dt.right=J,dt.top=J,dt.bottom=-J,dt.near=1,dt.far=140,dt.updateProjectionMatrix(),p=!0}}function W(){!o||d.w<=0||(f=DT(o,d.w,d.maxH,t.box===!0),B())}const U=()=>u??(f&&!Jb(h)?Zg(f,h):f);function B(){const L=U();L&&(n.look(L),n.size(L),F(L))}function P(L,V,at,j){const pt=V*L.scale+L.left,J=L.top-at*L.scale,Q=(j-L.target.y-J*Aa.y)/za.y;return{x:L.target.x+pt*zn.x+J*Aa.x+Q*za.x,z:L.target.z+pt*zn.z+J*Aa.z+Q*za.z}}function H(L,V){const at=[{x:V.fp.x0,z:V.fp.z0},{x:V.fp.x1,z:V.fp.z0},{x:V.fp.x0,z:V.fp.z1},{x:V.fp.x1,z:V.fp.z1}].map(dt=>Zi(L,{x:dt.x,y:0,z:dt.z})),j=Math.min(...at.map(dt=>dt.x)),pt=Math.max(...at.map(dt=>dt.x)),J=Math.min(...at.map(dt=>dt.y))-3/L.scale,Q=Math.max(...at.map(dt=>dt.y));return pt>0&&j<L.widthPx&&Q>0&&J<L.heightPx}const k={setTown(L){const V=L.map(j=>`${j.id}:${j.office.map}:${j.office.size}:${String(j.grow.stage)}:${String(j.grow.garden)}:${j.home===!0?"h":""}`).join("|");(o===null||V!==r)&&(r=V,o=RT(L.map(j=>OT(j.id,j.office,j.grow,j.home===!0)),FT(L.map(j=>j.id))),y&&(y.check={...dg(o)})),c=L;const at=new Set(L.map(j=>j.id));for(const j of[...x.keys()])at.has(j)||T(j);for(const j of L)b(j.id);D(l??!1),R(),W(),O()},still(L,V){const at=g(L);if(!at)return!1;const j=b(L),pt=WT(V);if(j.bake?.sig===pt||z(j,V,V.frames[0]?.pose.since??0)===null&&!j.scene.office())return!1;j.scene.root.position.set(0,0,0);const J=Pd(j.scene.root,gn,gn.shadows);for(const dt of J.group.children){const Ot=dt.material;Ot!==J.baked&&(dt.material=Ot.clone())}j.scene.root.position.set(at.x,0,at.z),S(j);const Q=new Wt;return Q.add(J.group),Q.position.set(at.x,0,at.z),Q.visible=!j.live,s.add(Q),j.bake={sig:pt,merged:J,holder:Q},p=!0,O(),!0},live(L,V,at){const j=x.get(L);if(!j)return"still";const pt=z(j,V,at);return M(j,V),p=!0,pt??"still"},liveIds(){const L=U();if(!L||!f||!o)return[];if(t.allLive===!0)return o.offices.map(j=>j.id);if((f.right-f.left)/(L.right-L.left)<GT)return[];const V=L.widthPx/2,at=L.heightPx/2;return o.offices.filter(j=>H(L,j)).map(j=>{const pt=Zi(L,{x:(j.fp.x0+j.fp.x1)/2,y:0,z:(j.fp.z0+j.fp.z1)/2});return{id:j.id,d:Math.hypot(pt.x-V,pt.y-at)}}).sort((j,pt)=>j.d-pt.d).slice(0,HT).map(j=>j.id)},setSize(L,V){return d={w:Math.round(L),maxH:Math.round(V)},W(),f?.heightPx??0},townFit:()=>f,shownFit:U,diveFit(L,V){const at=g(L),j=x.get(L)?.scene.office();return at&&j?UT(at,j,V):null},setView(L){u=L,B()},setCam(L){h=L,B()},frame(L){if(n.lost()||!o)return;l!==L&&(l=L,D(L),C(L));const V=new Set(k.liveIds());for(const[j,pt]of x){const J=V.has(j)&&pt.scene.office()!==null;J!==pt.live&&(pt.live=J,J?s.add(pt.scene.root):(s.remove(pt.scene.root),E(pt)),pt.bake&&(pt.bake.holder.visible=!J),p=!0)}const at=performance.now();p&&(i.shadowMap.needsUpdate=!0,p=!1),n.render(),y&&(y.frames++,y.ms=performance.now()-at,y.recent=[...y.recent.slice(-29),y.ms],y.calls=i.info.render.calls,y.live=[...x].filter(([,j])=>j.live).map(([j])=>j),y.heads=y.live.flatMap(j=>(x.get(j)?.scene.names()??[]).flatMap(pt=>{const J=k.headOf(j,pt);return J?[{id:j,name:pt,...J}]:[]})))},signAt(L){const V=U(),at=g(L),j=x.get(L)?.scene.office()??c.find(J=>J.id===L)?.office;if(!V||!at||!j)return null;v.set(at.x+j.x0+j.W/2,BT,at.z-.3);const pt=Zi(V,v);return pt.x<0||pt.x>V.widthPx||pt.y<0||pt.y>V.heightPx?null:pt},pick(L,V){const at=U();if(!at||!o)return null;for(let j=2.6;j>=0;j-=.2){const pt=P(at,L,V,j),J=o.offices.find(Q=>pt.x>Q.fp.x0&&pt.x<Q.fp.x1&&pt.z>Q.fp.z0&&pt.z<Q.fp.z1);if(J)return J.id}return null},headOf(L,V){const at=U(),j=x.get(L);if(!at||!j?.live)return null;const pt=j.scene.headTop(V,v);if(!pt)return null;const J=Zi(at,pt);if(J.x<0||J.y<-20||J.x>at.widthPx||J.y>at.heightPx)return null;const Q=j.scene.feet(V,v);return{...J,feet:Q?Zi(at,Q).y:J.y}},placedOf:L=>g(L)??null,pickBim(L,V){const at=U();if(!at)return null;for(const[j,pt]of x){if(!pt.live)continue;const J=pt.scene.names().map(dt=>{const Ot=pt.scene.headTop(dt,v),mt=Ot?Zi(at,Ot):null,Gt=pt.scene.feet(dt,v);return{name:dt,head:mt,feet:Gt?Zi(at,Gt):null,desk:null}}),Q=_T(J,L,V);if(Q!==null)return{id:j,name:Q}}return null},copyTo(L){n.copyTo(L)},onLost(L){n.onLost(L)},dispose(){for(const L of[...x.keys()])T(L);m&&(s.remove(m.merged.group),m.merged.dispose(),m=null),n.dispose(),y&&delete window.__biseTown}};return k},ug="loft",Ul=.5,os=e=>e.filter(t=>!t.main&&!t.archived).map(t=>t.name);function Jt(e,t,n,i,s){return{x0:e-n/2,x1:e+n/2,z0:t-i/2,z1:t+i/2,...s?{of:s}:{}}}function Ol(e){const t={x:e.x,z:e.wz},n={x:e.ax,z:e.wz};return[[e,t],[t,n]].filter(([i,s])=>Math.hypot(i.x-s.x,i.z-s.z)>1e-6)}function XT(e){return[...e.desks.values(),e.mainDesk,...e.islandSpots,...e.lounge,...e.boardSpots,...e.queue,e.door,...e.terrace,e.exit,...e.park?.spots??[]]}const o0=2.4,rl=2.3,gs=1.4,cl=1,Bo=4.3,$T=16,qT=10,YT=6,ZT=12,lc=1.15,KT=.8,vp=2.5;function JT(e,t){const n=os(e),i=t?.side===3||n.length>$T?3:2,s=i*2,a=sA(n,i,t),o=Math.max(0,...[...a.values()].map(L=>L+1)),r=Math.max(3,Math.ceil(o/s),t?.side===i?t.rows:0),c=2*(gs/2+cl+i*o0)+.2,l=-c/2,d=Bo+r*rl+1,f=gs/2+cl/2,u=Bo-.25,h=d-.5,p=new Map;for(const L of n){const V=nA(a.get(L)??0,i);p.set(L,{x:V.x,z:V.z,wz:V.z-.65,ax:Math.sign(V.x)*f,face:0})}const _=Bo+.2,x={x0:-gs/2,x1:gs/2,z0:_,z1:_+Math.max(r*rl-1,3.5)},m=[];for(let L=0;L<12;L++){const V=L%2?1:-1,at=x.z0+1.2+Math.floor(L/2)*.85;if(at>x.z1-.3)break;m.push({x:V*(gs/2+.32),z:at,wz:at,ax:V*f,face:V<0?Math.PI/2:-Math.PI/2})}const v=c*.4,y=(v-.9)/3,g=[];for(let L=0;L<qT;L++){const V=L%4,at=l+.65+V*y,j=1+Math.floor(L/4)*1.05;g.push({x:at,z:j,wz:j,ax:V<3?at+y/2:at-y/2,face:0})}const b=l+v+1.15,S=[-.45,.45,0].map(L=>({x:b+L,z:.75,wz:u,ax:b+L,face:Math.PI})),E=c/2-1.55,M=E-1.45,T={x:E,z:1.25,wz:.8,ax:M,face:0},z=[];for(let L=0;L<YT;L++)z.push({x:M,z:1.3+L*Ul,wz:u,ax:M,face:Math.PI/2});const R={x:-f,z:d+.2,wz:h,ax:-f,face:Math.PI},D=[];for(let L=0;L<ZT;L++){const V=L%4,at=l+1+V*lc,j=d+1.5+Math.floor(L/4)*lc;D.push({x:at,z:j,wz:j,ax:V<3?at+lc/2:at-lc/2,face:0})}const O=d+KT,C={x:l-vp,z:O,wz:O,ax:l-vp,face:-Math.PI/2},F={desks:p,mainDesk:T,islandSpots:m,lounge:g,boardSpots:S,queue:z,door:R,terrace:D,exit:C},W={map:"loft",size:`${String(i)}x${String(r)}`,W:c,D:d,x0:l,island:x,...F},U=eA(W),B=jT({...W,crossBack:u,crossFront:h,ax:f,tw:O}),P=z[0]?.x??E,H=Math.min(...B[0].map(L=>L.x)),k=[{x:P,z:u},{x:Math.min(P,Math.max(H,l+1.5)),z:u}];return{...W,side:i,rows:r,crossBack:u,crossFront:h,ax:f,walks:B,furniture:U,queueMore:k}}const QT={id:"loft",ready:!0,layout:JT};function jT(e){const{crossBack:t,crossFront:n,ax:i,tw:s,exit:a}=e,o=[...e.desks.values(),e.mainDesk,...e.islandSpots,...e.lounge,...e.boardSpots,...e.queue,e.door,...e.terrace,a],r=o.filter(f=>f.wz<=t+1e-6).map(f=>f.ax),c=[[{x:Math.min(-i,...r),z:t},{x:Math.max(i,...r),z:t}],[{x:-i,z:n},{x:i,z:n}],[{x:-i,z:t},{x:-i,z:n}],[{x:i,z:t},{x:i,z:n}],[{x:-i,z:n},{x:-i,z:s}],[{x:a.x,z:s},{x:-i,z:s}]],l=f=>c.some(([u,h])=>tA(u,h,f)),d=[c[0],...c.slice(1)];for(const f of o){d.push(...Ol(f));const u={x:f.ax,z:f.wz};l(u)||d.push([u,{x:f.ax,z:f.wz<t?t:s}])}return d}function tA(e,t,n){return Math.abs(e.x-t.x)<1e-6?Math.abs(n.x-e.x)<1e-4&&n.z>=Math.min(e.z,t.z)-1e-4&&n.z<=Math.max(e.z,t.z)+1e-4:Math.abs(e.z-t.z)<1e-6?Math.abs(n.z-e.z)<1e-4&&n.x>=Math.min(e.x,t.x)-1e-4&&n.x<=Math.max(e.x,t.x)+1e-4:!1}function eA(e){const t=Jt,n=[];for(const s of e.desks.values())n.push(t(s.x,s.z+.5,1.6,.78));n.push(t(e.mainDesk.x,e.mainDesk.z+.6,2.3,1));const i=(e.island.z0+e.island.z1)/2;n.push(t((e.island.x0+e.island.x1)/2,i,e.island.x1-e.island.x0+.1,e.island.z1-e.island.z0+.15));for(const s of e.lounge)n.push(t(s.x,s.z-.05,.72,.72,s));for(const s of e.terrace)n.push(t(s.x,s.z+.05,.5,.95,s));return n}function nA(e,t){const n=t*2,i=e%n,s=Math.floor(e/n),a=i<t,o=a?t-1-i:i-t;return{x:(a?-1:1)*(gs/2+cl+o0*(o+.5)),z:Bo+.55+rl*s}}function iA(e,t){const n=Math.round((Math.abs(e.x)-gs/2-cl)/o0-.5),i=e.x<0?t-1-n:t+n;return Math.round((e.z-Bo-.55)/rl)*t*2+i}function sA(e,t,n){const i=new Map,s=new Set;if(n?.side===t)for(const o of e){const r=n.desks.get(o);if(!r)continue;const c=iA(r,t);i.set(o,c),s.add(c)}let a=0;for(const o of e)if(!i.has(o)){for(;s.has(a);)a++;i.set(o,a),s.add(a)}return i}const Mp=(e,t)=>Math.hypot(e.x-t.x,e.z-t.z)<1e-6;function Qa(e,t){const n=e.filter(([i,s])=>!Mp(i,s));for(const i of t){n.push(...Ol(i.s));const s={x:i.s.ax,z:i.s.wz};i.to&&!Mp(s,i.to)&&n.push([s,i.to])}return n}function Ws(e,t,n=[]){const i=[...t.filter(s=>s.to&&Math.abs(s.to.z-e)<1e-6).map(s=>s.to?.x??0),...n];return[{x:Math.min(...i),z:e},{x:Math.max(...i),z:e}]}function ja(e,t){const n=os(e),i=new Map,s=new Set;for(const o of n){const r=t?.get(o);r!==void 0&&(i.set(o,r),s.add(r))}let a=0;for(const o of n)if(!i.has(o)){for(;s.has(a);)a++;i.set(o,a),s.add(a)}return{names:n,slots:i,used:Math.max(0,...[...i.values()].map(o=>o+1))}}const au=6;function yr(e,t,n,i={}){const s=i.lx0??e+.65,a=i.lw??t*.4-.9,o=i.n??10,r=i.bed??.72,c=a/3,l=[],d=[],f=[];for(let v=0;v<o;v++){const y=v%4,g=s+y*c,b=1+Math.floor(v/4)*1.05;if(b+r/2>n-.2)break;const S={x:g,z:b,wz:b,ax:y<3?g+c/2:g-c/2,face:0};l.push(S),f.push(Jt(g,b-.05,r,r,S)),d.push({s:S,to:{x:S.ax,z:n}})}const u=s+a+1.6,h=[-.45,.45,0].map(v=>({x:u+v,z:.75,wz:n,ax:u+v,face:Math.PI}));for(const v of h)d.push({s:v});const p=e+t-1.55,_=p-1.45,x={x:p,z:1.25,wz:.8,ax:_,face:0};d.push({s:x,to:{x:_,z:n}}),f.push(Jt(p,x.z+.6,2.3,1));const m=[];for(let v=0;v<au;v++){const y=1.3+v*.5;if(y>n-.2)break;m.push({x:_,z:y,wz:n,ax:_,face:Math.PI/2})}for(const v of m)d.push({s:v});return{lounge:l,boardSpots:h,mainDesk:x,queue:m,furniture:f,ways:d,boardX:u}}const aA=12,dc=1.15;function to(e,t,n,i){const s=t+.8,a={x:n,z:t+.2,wz:i,ax:n,face:Math.PI},o=[],r=[],c=[];for(let u=0;u<aA;u++){const h=u%4,p=e+1+h*dc,_=t+1.5+Math.floor(u/4)*dc,x={x:p,z:_,wz:_,ax:h<3?p+dc/2:p-dc/2,face:0};o.push(x),r.push(Jt(p,_+.05,.5,.95,x)),c.push({s:x,to:{x:x.ax,z:s}})}const l={x:e-2.5,z:s,wz:s,ax:e-2.5,face:-Math.PI/2},d=Math.max(n,...c.map(u=>u.to?.x??n)),f=[[{x:n,z:i},{x:n,z:s}],[{x:l.x,z:s},{x:d,z:s}]];return c.push({s:a}),{door:a,terrace:o,exit:l,furniture:r,ways:c,trunk:f,tw:s}}function eo(e,t,n,i){const s=e[0]?.x??t.x,a=Math.min(n[0].x,n[1].x),o=n[0].z;return[{x:s,z:o},{x:Math.min(s,Math.max(a,i+1.5)),z:o}]}const r0={1:_t.stage_1,2:_t.stage_fruit,3:_t.stage_3,4:_t.stage_4,5:_t.stage_5,6:_t.stage_more_fruit,7:_t.stage_7,8:_t.stage_8,9:_t.stage_9,10:_t.stage_10,11:_t.stage_11,12:_t.stage_12,13:_t.stage_13,14:_t.stage_14},fc=4.05,Nd=1.25,uc=1.9,yp=1.1,bp=.55,oA=.5,bi=(e,t,n,i)=>({x:e+n*Math.sin(i),z:t+n*Math.cos(i)});function rA(e,t,n){const i=Math.abs(Math.cos(t)),s=Math.abs(Math.sin(t));return Jt(e.x,e.z,yp*i+bp*s,yp*s+bp*i,n)}function cA(e,t){const{names:n,slots:i,used:s}=ja(e,t?.slots),a=Math.max(6,s,t?.cap??0),o=a+a%2,r=Math.max(3.4,o*1.9/(2*Math.PI)),c=r+.9,l=Math.max(11,2*c+2.6),d=-l/2,f=0,u=fc+c,h=u+c,p=h+.7,_=yr(d,l,fc),x=to(d,p,f,h),m=[..._.ways,...x.ways],v=[..._.furniture,...x.furniture],y=new Map;for(const R of n){const D=(2*(i.get(R)??0)+1)*Math.PI/o,O=bi(f,u,r,D),C={...O,wz:O.z,ax:O.x,face:D+Math.PI};y.set(R,C),v.push(rA(bi(f,u,r-oA,D),D,C)),m.push({s:C,to:bi(f,u,c,D)})}const g=Jt(f,u,2*Nd,2*Nd);v.push(g);const b=[];for(let R=0;R<8;R++){const D=R*Math.PI/4,O=bi(f,u,uc,D);b.push({...O,wz:O.z,ax:O.x,face:D+Math.PI})}const S=(R,D)=>{const O=Array.from({length:D},(C,F)=>bi(f,u,R,F*2*Math.PI/D));return O.map((C,F)=>[C,O[(F+1)%D]??C])},E=Ws(fc,m,[f]),M=[E,...x.trunk,...S(uc,8),...S(c,2*o),[bi(f,u,uc,Math.PI),bi(f,u,c,Math.PI)],[bi(f,u,uc,0),bi(f,u,c,0)]],T=Qa(M,m),z={desks:y,mainDesk:_.mainDesk,islandSpots:b,lounge:_.lounge,boardSpots:_.boardSpots,queue:_.queue,door:x.door,terrace:x.terrace,exit:x.exit};return{map:"greenhouse",size:`ring${String(o)}`,W:l,D:p,x0:d,island:g,...z,walks:T,furniture:v,queueMore:eo(_.queue,_.mainDesk,E,d),slots:i,cap:o,crossBack:fc,cx:f,cz:u,R:r,Ro:c,tableR:Nd}}const lA={id:"greenhouse",ready:!0,layout:cA,things:r0},mn=4.05,Sp=5.2,$i=4.6,dA=4.2,wp=[0,.25,-.2,.15,-.1,.3];function fA(e,t){const{names:n,slots:i,used:s}=ja(e,t?.slots),a=Math.max(2,Math.ceil(Math.max(s,t?.cap??0)/4)),o=a*4,r=a>4?3:2,c=Math.ceil(a/r),l=r*Sp+2.4,d=-l/2,f=d+1.45,u=mn+c*$i,h=u+.6,p=yr(d,l,mn),_=to(d,h,f,u),x=[...p.ways,..._.ways],m=[...p.furniture,..._.furniture],v=[];for(let O=0;O<a;O++){const C=O%r,F=Math.floor(O/r);v.push({x:d+dA+C*Sp+F%2*.6,z:mn+$i/2+F*$i+(wp[O%wp.length]??0)})}const y=new Map;for(const O of n){const C=i.get(O)??0,F=Math.floor(C/4),W=C%4,U=v[F]??{x:0,z:mn+$i/2},B=Math.floor(F/r),P=U.x+(W%2?.8:-.8),H=W<2,k=U.z+(H?-1.05:1.05),L=mn+(H?B:B+1)*$i,V={x:P,z:k,wz:L,ax:P,face:H?0:Math.PI};y.set(O,V),m.push(Jt(P,k+(H?.5:-.5),1.6,.78)),x.push({s:V})}const g=Math.min(6,c*$i-1),b={x0:d+.2,x1:d+1.1,z0:mn+.55,z1:mn+.55+g};m.push(b);const S=[];for(let O=b.z0+.6;O<b.z1-.2;O+=.85)S.push({x:f,z:O,wz:O,ax:f,face:-Math.PI/2});const E=Math.max(f,...[...y.values()].map(O=>O.x)),M=[];for(let O=1;O<=c;O++)M.push([{x:f,z:mn+O*$i},{x:E,z:mn+O*$i}]);const T=Ws(mn,x,[f,E,...[...y.values()].filter(O=>O.wz===mn).map(O=>O.x)]),z=[T,..._.trunk,...M,[{x:f,z:mn},{x:f,z:u}]],R=Qa(z,x),D={desks:y,mainDesk:p.mainDesk,islandSpots:S,lounge:p.lounge,boardSpots:p.boardSpots,queue:p.queue,door:_.door,terrace:_.terrace,exit:_.exit};return{map:"campus",size:`pods${String(a)}`,W:l,D:h,x0:d,island:b,...D,walks:R,furniture:m,queueMore:eo(p.queue,p.mainDesk,T,d),slots:i,cap:o,crossBack:mn,pods:v,aisle:f}}const uA={id:"campus",ready:!0,layout:fA,things:r0},ti=1.9,hc=1.8,pc=1.1,hA=e=>e%3===2?{back:!1,i:Math.floor(e/3)}:{back:!0,i:Math.floor(e/3)*2+e%3};function pA(e,t){const{names:n,slots:i,used:s}=ja(e,t?.slots),a=Math.max(6,s,t?.cap??0),o=Math.floor(a/3),r=a-o,c=Math.max(12.5,(r-1)*hc+7.55),l=Math.max(8.6,o*hc+3.3),d=-c/2,f=d+c,u=d+1.9,h=l-.5,p=[],_=[],x=new Map;for(const B of n){const P=hA(i.get(B)??0);let H;if(P.back){const k=d+3.2+P.i*hc;H={x:k,z:pc,wz:ti,ax:k,face:Math.PI},_.push(Jt(k,pc-.5,1.6,.78))}else{const k=3+P.i*hc;H={x:d+pc,z:k,wz:k,ax:u,face:-Math.PI/2},_.push(Jt(d+pc-.5,k,.78,1.6))}x.set(B,H),p.push({s:H})}const m=f-1.8,v=f-3.25,y={x:m,z:3,wz:3,ax:v,face:0};_.push(Jt(m,3.6,2.3,1)),p.push({s:y});const g=[];for(let B=0;B<au;B++)g.push({x:v,z:2.6+B*.5,wz:ti,ax:v,face:Math.PI/2});for(const B of g)p.push({s:B});const b=f-1.6,S=[-.45,.45,0].map(B=>({x:b+B,z:.75,wz:ti,ax:b+B,face:Math.PI}));for(const B of S)p.push({s:B});const E=u+1.9,M=ti+1.45,T=Jt(E,M,2.6,.9);_.push(T);const z=[];for(const B of[-1.1,-.35,.4,1.15])z.push({x:E+B,z:M-.75,wz:M-.75,ax:E+B,face:0}),z.push({x:E+B,z:M+.75,wz:M+.75,ax:E+B,face:Math.PI});const R=Jt(E+3.4,M,2.6,1.5);_.push(R);const D=[];for(let B=0;B<8;B++){const P=B%4,H=f-3.9+P*.95,k=l-3+Math.floor(B/4)*1.05,L={x:H,z:k,wz:k,ax:P<3?H+.475:H-.475,face:0};D.push(L),_.push(Jt(H,k-.05,.62,.62,L)),p.push({s:L,to:{x:L.ax,z:h}})}const O=to(d,l,u,h);p.push(...O.ways),_.push(...O.furniture);const C=Ws(ti,[...p,...S.map(B=>({s:B,to:{x:B.x,z:ti}}))],[u,v,...[...x.values()].filter(B=>B.wz===ti).map(B=>B.x)]),F=[M-.75,M+.75].map(B=>[{x:u,z:B},{x:E+1.15,z:B}]),W=[C,...O.trunk,[{x:u,z:ti},{x:u,z:h}],Ws(h,p,[u]),[{x:v,z:ti},{x:v,z:2.6+(au-1)*.5}],...F],U=Qa(W,p);return{map:"workshop",size:`walls${String(a)}`,W:c,D:l,x0:d,island:T,desks:x,mainDesk:y,islandSpots:z,lounge:D,boardSpots:S,queue:g,door:O.door,terrace:O.terrace,exit:O.exit,walks:U,furniture:_,queueMore:eo(g,y,C,d),slots:i,cap:a,crossBack:ti,pingpong:R,aisle:u,crossFront:h}}const mA={id:"workshop",ready:!0,layout:pA,things:r0},ma=4.05,mc=12.5,Ud=2.1,xA=[3.4,5.8];function gA(e,t){const{names:n,slots:i,used:s}=ja(e,t?.slots),a=Math.max(3,Math.ceil(Math.max(s,t?.cap??0)/2)),o=a*2,r=4.4+a*Ud+1.2,c=-mc/2,l=c+1.85,d=c+4.6,f=r-.5,u=yr(c,mc,ma,{n:0,lw:3.4}),h=[...u.ways],p=[...u.furniture],_=c+2.6,x=Jt(_,1.75,2.8,.7);p.push(x);const m=[],v=c+.7;for(const R of[0,1])for(const D of[-1.2,-.4,.4,1.2]){const O=_+D,C=R===0?{x:O,z:1,wz:.45,ax:v,face:0}:{x:O,z:2.5,wz:2.5,ax:O,face:Math.PI};m.push(C),p.push(Jt(O,C.z,.55,.55,C)),h.push({s:C,to:{x:C.ax,z:ma}})}m.push(...m.splice(0,4));const y=new Map;for(const R of n){const D=i.get(R)??0,O=D%2,C=c+(xA[O]??3.4),F=4.95+Math.floor(D/2)*Ud,W={x:C,z:F,wz:F-.65,ax:O===0?l:d,face:0};y.set(R,W),p.push(Jt(C,F+.5,1.6,.78)),h.push({s:W})}const g={x0:c+.55,x1:c+1.45,z0:4.8,z1:4.8+Math.min(4.5,a*Ud-.6)};p.push(g);const b=[];for(let R=g.z0+.5;R<g.z1-.2;R+=.85)b.push({x:l,z:R,wz:R,ax:l,face:-Math.PI/2});const S=to(c,r,l,f);h.push(...S.ways),p.push(...S.furniture);const E={x0:c+7.4,x1:c+mc-.3,z0:4.6,z1:r-1.4},M=Ws(ma,h,[l,d]),T=[M,...S.trunk,[{x:l,z:ma},{x:l,z:f}],[{x:d,z:ma},{x:d,z:f}],[{x:l,z:f},{x:d,z:f}]],z=Qa(T,h);return{map:"kyoto",size:`rows${String(a)}`,W:mc,D:r,x0:c,island:g,desks:y,mainDesk:u.mainDesk,islandSpots:b,lounge:m,boardSpots:u.boardSpots,queue:u.queue,door:S.door,terrace:S.terrace,exit:S.exit,walks:z,furniture:p,queueMore:eo(u.queue,u.mainDesk,M,c),slots:i,cap:o,crossBack:ma,garden:E,kotatsu:x,rows:a}}const _A={1:_t.stage_kyoto_1,2:_t.stage_kyoto_2,3:_t.stage_kyoto_3,4:_t.stage_kyoto_4,5:_t.stage_kyoto_5,6:_t.stage_kyoto_6,7:_t.stage_kyoto_7,8:_t.stage_kyoto_8,9:_t.stage_kyoto_9,10:_t.stage_kyoto_10,11:_t.stage_kyoto_11,12:_t.stage_kyoto_12,13:_t.stage_kyoto_13,14:_t.stage_kyoto_14},vA={id:"kyoto",ready:!0,layout:gA,things:_A},qi=4.05,hs=1.9,Ep=1.75,Tp=1.4;function MA(e,t){const{names:n,slots:i,used:s}=ja(e,t?.slots),a=Math.max(3,Math.ceil(Math.max(s,t?.cap??0)/3)),o=a*3,r=Math.max(5.6,a*hs+.4),c=r+5.4,l=-c/2,d=l+c,f=qi+2.15,u={x0:l+2.7,x1:d-2.7,z0:f,z1:f+r},h=l+2.25,p=d-2.25,_=u.z1+.6,x=_+.6,m=yr(l,c,qi),v=to(l,x,h,_),y=[...m.ways,...v.ways],g=[...m.furniture,...v.furniture],b=new Map,S=(r-a*hs)/2;for(const W of n){const U=i.get(W)??0,B=Math.floor(U/3),P=U%3;let H;if(P===1){const k=u.x0+S+hs/2+B*hs;H={x:k,z:qi+.65,wz:qi,ax:k,face:0},g.push(Jt(k,H.z+.5,Tp,.78))}else{const k=f+hs/2+B*hs,L=P===0,V=L?l+.9:d-.9;H={x:V,z:k,wz:k+hs/2,ax:L?h:p,face:L?Math.PI/2:-Math.PI/2},g.push(Jt(V+(L?.5:-.5),k,.78,Tp))}b.set(W,H),y.push({s:H})}const E=(u.x0+u.x1)/2,M=(u.z0+u.z1)/2,T=Jt(E,M,2.2,2.2);g.push(T);const z=W=>({x:E+Ep*Math.sin(W),z:M+Ep*Math.cos(W)}),R=[];for(let W=0;W<8;W++){const U=W*Math.PI/4;R.push({...z(U),wz:z(U).z,ax:z(U).x,face:U+Math.PI})}const D=Ws(qi,y,[h,p]),O=R.map((W,U)=>[W,R[(U+1)%8]??W]),C=[D,...v.trunk,[{x:h,z:qi},{x:h,z:_}],[{x:p,z:qi},{x:p,z:_}],[{x:h,z:_},{x:p,z:_}],...O,[z(0),{x:E,z:_}]],F=Qa(C,y);return{map:"riad",size:`galleries${String(a)}`,W:c,D:x,x0:l,island:T,desks:b,mainDesk:m.mainDesk,islandSpots:R,lounge:m.lounge,boardSpots:m.boardSpots,queue:m.queue,door:v.door,terrace:v.terrace,exit:v.exit,walks:F,furniture:g,queueMore:eo(m.queue,m.mainDesk,D,l),slots:i,cap:o,crossBack:qi,patio:u,fx:E,fz:M}}const yA={1:_t.stage_riad_1,2:_t.stage_riad_2,3:_t.stage_riad_3,4:_t.stage_riad_4,5:_t.stage_riad_5,6:_t.stage_riad_6,7:_t.stage_riad_7,8:_t.stage_riad_8,9:_t.stage_riad_9,10:_t.stage_riad_10,11:_t.stage_riad_11,12:_t.stage_riad_12,13:_t.stage_riad_13,14:_t.stage_riad_14},bA={id:"riad",ready:!0,layout:MA,things:yA},Yi=4.05,Od=10,mo=1.6,SA=1.5,wA=1.05,Gn=1.85;function EA(e,t){const{names:n,slots:i,used:s}=ja(e,t?.slots),a=Math.max(3,Math.ceil(Math.max(s,t?.cap??0)/2)),o=a*2,r=Yi+.45,c=Jt(0,r+a*mo/2,SA,a*mo),l=c.z1+1.4,d=l-.5,f=-Od/2,u=yr(f,Od,Yi,{lx0:f+1.4,lw:3,n:8,bed:.8}),h=to(f,l,-Gn,d),p=[...u.ways,...h.ways],_=[...u.furniture,...h.furniture,c],x=new Map;for(const S of n){const E=i.get(S)??0,M=E%2?1:-1,T=r+mo/2+Math.floor(E/2)*mo,z={x:M*wA,z:T,wz:T,ax:M*Gn,face:M<0?Math.PI/2:-Math.PI/2};x.set(S,z),p.push({s:z})}const m={x0:f+.15,x1:f+1.05,z0:Yi+.55,z1:Yi+.55+Math.min(4,a*mo-.4)};_.push(m);const v=[];for(let S=m.z0+.5;S<m.z1-.2;S+=.85)v.push({x:f+1.4,z:S,wz:S,ax:-Gn,face:-Math.PI/2});for(const S of v)p.push({s:S});const y=Ws(Yi,p,[-Gn,Gn]),g=[y,...h.trunk,[{x:-Gn,z:Yi},{x:-Gn,z:d}],[{x:Gn,z:Yi},{x:Gn,z:d}],[{x:-Gn,z:d},{x:Gn,z:d}]],b=Qa(g,p);return{map:"nordic",size:`table${String(a)}`,W:Od,D:l,x0:f,island:m,desks:x,mainDesk:u.mainDesk,islandSpots:v,lounge:u.lounge,boardSpots:u.boardSpots,queue:u.queue,door:h.door,terrace:h.terrace,exit:h.exit,walks:b,furniture:_,queueMore:eo(u.queue,u.mainDesk,y,f),slots:i,cap:o,crossBack:Yi,table:c}}const TA={1:_t.stage_nordic_1,2:_t.stage_nordic_2,3:_t.stage_nordic_3,4:_t.stage_nordic_4,5:_t.stage_nordic_5,6:_t.stage_nordic_6,7:_t.stage_nordic_7,8:_t.stage_nordic_8,9:_t.stage_nordic_9,10:_t.stage_nordic_10,11:_t.stage_nordic_11,12:_t.stage_nordic_12,13:_t.stage_nordic_13,14:_t.stage_nordic_14},AA={id:"nordic",ready:!0,layout:EA,things:TA},zA=4.3,Ln=4,RA=6,CA=12,xc=1.15,Ap=2.5;function br(e){const{x0:t,W:n}=e,i=e.main==="right"?1:-1,s=g=>i===1?t+g:t+n-g,a=1.3,[o,r]=e.bed??[.72,.72],c=[],l=[];for(let g=0;g<(e.beds??8);g++){const b=g%4,S=.9+b*a,E=1+Math.floor(g/4)*1.2,M={x:s(S),z:E,wz:E,ax:s(b<3?S+a/2:S-a/2),face:0};c.push(M),l.push(Jt(M.x,M.z,o,r,M))}const d=s(.9+3*a+1.9),f=[-.45,.45,0].map(g=>({x:d+g,z:.75,wz:Ln,ax:d+g,face:Math.PI})),u=s(n-1.55),h=s(n-3),p={x:u,z:1.25,wz:.8,ax:h,face:0};l.push(Jt(u,1.85,2.3,1));const _=[];for(let g=0;g<RA;g++)_.push({x:h,z:1.3+g*Ul,wz:Ln,ax:h,face:i*Math.PI/2});const x=[...c.map(g=>g.ax),...f.map(g=>g.x),h,...e.reach??[]],m=[{x:Math.min(...x),z:Ln},{x:Math.max(...x),z:Ln}],v=i===1?m[0].x:m[1].x,y=[{x:h,z:Ln},{x:i===1?Math.min(h,Math.max(v,t+1.5)):Math.max(h,Math.min(v,t+n-1.5)),z:Ln}];return{lounge:c,boardSpots:f,mainDesk:p,queue:_,furniture:l,corridor:m,queueMore:y}}function Sr(e){const{x0:t,W:n,D:i,doorX:s}=e,a=i-.5,o=i+.8,r={x:s,z:i+.2,wz:a,ax:s,face:Math.PI},c=[],l=[];for(let _=0;_<CA;_++){const x=_%4,m=t+e.terraceU+x*xc,v=i+1.5+Math.floor(_/4)*xc,y={x:m,z:v,wz:v,ax:x<3?m+xc/2:m-xc/2,face:0};c.push(y),l.push(Jt(m,v+.05,.5,.95,y))}const d=e.out==="left",f=d?t-Ap:t+n+Ap,u={x:f,z:o,wz:o,ax:f,face:d?-Math.PI/2:Math.PI/2},h=[s,...c.map(_=>_.ax)],p=d?[{x:f,z:o},{x:Math.max(...h),z:o}]:[{x:Math.min(...h),z:o},{x:f,z:o}];return{door:r,terrace:c,exit:u,furniture:l,legs:[[{x:s,z:a},{x:s,z:o}],p],crossFront:a,tw:o}}const c0=(e,t)=>Math.hypot(e.x-t.x,e.z-t.z)<1e-4;function PA([e,t],n){const i=t.x-e.x,s=t.z-e.z,a=i*i+s*s,o=a>0?((n.x-e.x)*i+(n.z-e.z)*s)/a:0;return o<-1e-4||o>1+1e-4?!1:c0({x:e.x+i*o,z:e.z+s*o},n)}function LA([e,t],n){const i=Math.max(2,Math.ceil(Math.hypot(t.x-e.x,t.z-e.z)/.02)),s=1e-6;for(let a=1;a<i;a++){const o=e.x+(t.x-e.x)*a/i,r=e.z+(t.z-e.z)*a/i;if(o>n.x0+s&&o<n.x1-s&&r>n.z0+s&&r<n.z1-s)return!0}return!1}function wr(e,t){const n=t[0];if(n===void 0)throw new Error(`${e.map}: no trunk`);const i=[n,...t.slice(1)],s=t.filter(([a,o])=>Math.abs(a.z-o.z)<1e-6);for(const a of XT({...e,queueMore:[n[0],n[0]]})){i.push(...Ol(a));const o={x:a.ax,z:a.wz};if(t.some(l=>PA(l,o)))continue;const c=s.filter(([l,d])=>o.x>=Math.min(l.x,d.x)-1e-6&&o.x<=Math.max(l.x,d.x)+1e-6).map(([l])=>[o,{x:o.x,z:l.z}]).filter(l=>!e.furniture.some(d=>LA(l,d))).sort((l,d)=>Math.abs(l[1].z-o.z)-Math.abs(d[1].z-o.z))[0];if(c===void 0)throw new Error(`${e.map}: no way from (${String(o.x)}, ${String(o.z)})`);c0(c[0],c[1])||i.push(c)}return i}function Ha(e,t,n){const i=new Map,s=new Set;for(const o of e){const r=t?.get(o);if(r){for(let c=0;c<96;c++)if(!s.has(c)&&c0(n(c),r)){i.set(o,c),s.add(c);break}}}let a=0;for(const o of e)if(!i.has(o)){for(;s.has(a);)a++;i.set(o,a),s.add(a)}return i}const Er=e=>Math.max(0,...[...e.values()].map(t=>t+1)),Go=14.4,Ho=-Go/2,gc=[Ho+.6,0,Ho+Go-.6],Dc=[-3.5,3.5],Ea=3,IA=1.6,DA=2.7,NA=1.1,UA=4.7,zp=5,To=e=>UA+Math.floor(e/2)*DA+e%2*NA,ou=e=>Dc[e%2]??0;function Rp(e){const t=Math.floor(e/Ea);return{x:ou(t)+(e%Ea-1)*IA,z:To(t)+1.05}}function OA(e,t){const n=os(e),i=Ha(n,t?.desks,Rp),s=Math.max(1,Math.ceil(Math.ceil(Er(i)/Ea)/2),t?.rows??0),[a,o,r]=gc,c=new Map,l=[];for(const S of n){const E=i.get(S)??0,M=Math.floor(E/Ea),T=E%Ea,z=Rp(E),R=M%2===0?T===0?a:o:T===Ea-1?r:o;c.set(S,{x:z.x,z:z.z,wz:To(M)+.5,ax:R,face:0}),l.push(Jt(z.x,z.z+.5,1.4,.76))}const d=[];for(let S=0;S<s*2;S++)d.push({x:ou(S),z:To(S),w:zp,c:S%5}),l.push(Jt(ou(S),To(S),zp,.24));const u=To(s*2-1)+1.05+.89+1.35,h=Jt(Dc[0],u,4.4,.9),p=Jt(Dc[1],u,4.2,.7);l.push(h,p);const _=[];for(const S of[-1,1])for(const E of[-1.5,-.5,.5,1.5]){const M=u+S*.8;_.push({x:Dc[0]+E,z:M,wz:M,ax:o,face:S<0?0:Math.PI})}const x=u+1.55,m=x+.5,v=br({x0:Ho,W:Go,main:"right",bed:[.6,.9],reach:gc}),y=Sr({x0:Ho,W:Go,D:m,doorX:o,terraceU:1,out:"left"});l.push(...v.furniture,...y.furniture);const g=[v.corridor,[{x:a,z:x},{x:r,z:x}],...gc.map(S=>[{x:S,z:Ln},{x:S,z:x}]),...y.legs],b={map:"patio",size:`patio-${String(s)}`,W:Go,D:m,x0:Ho,island:h,desks:c,islandSpots:_,mainDesk:v.mainDesk,lounge:v.lounge,boardSpots:v.boardSpots,queue:v.queue,door:y.door,terrace:y.terrace,exit:y.exit,furniture:l};return{...b,walks:wr(b,g),queueMore:v.queueMore,rows:s,slabs:d,trough:p,aisles:gc}}const FA={id:"patio",ready:!0,layout:OA},Rn=-7,Ta=6.2,Es=1.9,or=1.7,ru=Rn+3.3,Fd=e=>Math.max(12.6,6.5+(e-1)*or);function Bd(e,t){const n=Math.floor(e/3),i=Rn+t;switch(e%3){case 0:return{x:Rn+1,z:Ta+n*Es,wz:Ta+n*Es,ax:Rn+.45,face:Math.PI/2};case 1:return{x:ru+n*or,z:zA+.55,wz:Ln,ax:ru+n*or,face:0};default:return{x:i-1,z:Ta+n*Es,wz:Ta+n*Es,ax:i-.45,face:-Math.PI/2}}}function BA(e){return e.face===0?Jt(e.x,e.z+.5,1.4,.76):Jt(e.x+Math.sign(Math.sin(e.face))*.5,e.z,.76,1.4)}function GA(e,t){const n=os(e),i=Ha(n,t?.desks,T=>Bd(T,Fd(t?.k??3))),s=Math.max(3,Math.ceil(Er(i)/3),t?.k??0),a=Fd(s),o=a===Fd(t?.k??3)?i:Ha(n,t?.desks,T=>Bd(T,a)),r=Rn+a,c=new Map,l=[];for(const T of n){const z=Bd(o.get(T)??0,a);c.set(T,z),l.push(BA(z))}const d=Ta+(s-1)*Es+.7,f={x0:Rn+2.4,x1:r-2.4,z0:6,z1:d},u=[];for(let T=Ta-Es/2;T<=d+.01;T+=Es)u.push({x:Rn+2.2,z:T},{x:r-2.2,z:T});for(let T=ru-or/2;T<=r-2.2;T+=or)u.push({x:T,z:6});for(const T of u)l.push(Jt(T.x,T.z,.24,.24));const h=Rn+a/2,p=(6.3+d)/2,_=Jt(h,p,1.8,.9);l.push(_);const x=p+1,m=[...[-1.05,-.35,.35,1.05].map(T=>({x:h+T,z:x,wz:x,ax:h,face:Math.PI})),{x:h-1.35,z:p,wz:x,ax:h,face:Math.PI/2},{x:h+1.35,z:p,wz:x,ax:h,face:-Math.PI/2}],v=d+1.6,y=v-.5,g=[Rn+.45,r-.45],b=br({x0:Rn,W:a,main:"right",bed:[.62,.62],reach:g}),S=Sr({x0:Rn,W:a,D:v,doorX:h,terraceU:1,out:"left"});l.push(...b.furniture,...S.furniture);const E=[b.corridor,[{x:g[0],z:y},{x:g[1],z:y}],...g.map(T=>[{x:T,z:Ln},{x:T,z:y}]),[{x:h,z:x},{x:h,z:y}],...S.legs],M={map:"haveli",size:`haveli-${String(s)}`,W:a,D:v,x0:Rn,island:_,desks:c,islandSpots:m,mainDesk:b.mainDesk,lounge:b.lounge,boardSpots:b.boardSpots,queue:b.queue,door:S.door,terrace:S.terrace,exit:S.exit,furniture:l};return{...M,walks:wr(M,E),queueMore:b.queueMore,k:s,yard:f,columns:u}}const HA={id:"haveli",ready:!0,layout:GA},Ao=16.6,es=-Ao/2,ns=8,VA=1.55,hg=2.7,cu=5.4,pg=.75,_c=[es+.6,es+14.3];function Gd(e){const t=Math.floor(e/ns),n=e%ns;return{x:es+2+n*VA,z:cu+t*hg+pg*Math.sin(n/(ns-1)*1.5*Math.PI)}}function WA(e,t){const n=os(e),i=Ha(n,t?.desks,Gd),s=Math.max(2,Math.ceil(Er(i)/ns),t?.curves??0),[a,o]=_c,r=new Map,c=[];for(const g of n){const b=Gd(i.get(g)??0);r.set(g,{x:b.x,z:b.z,wz:b.z-.6,ax:b.x,face:0}),c.push(Jt(b.x,b.z+.5,1.3,.76))}const l=[],d=[];for(let g=0;g<s;g++){const b=Array.from({length:ns},(M,T)=>{const z=Gd(g*ns+T);return{x:z.x,z:z.z-.6}});l.push(b);const S=b[0],E=b[ns-1];d.push([{x:a,z:S.z},S],[E,{x:o,z:E.z}]);for(let M=1;M<ns;M++)d.push([b[M-1],b[M]])}const f=cu+1.6,u=Jt(es+15.75,f,.9,3.2);c.push(u);const h=[-1.2,-.4,.4,1.2].map(g=>({x:es+14.95,z:f+g,wz:f+g,ax:o,face:Math.PI/2})),p=Math.max(cu+(s-1)*hg+pg+.88+1.2,f+2.4),_=p+.5,x=br({x0:es,W:Ao,main:"left",bed:[.6,.9],reach:_c}),m=Sr({x0:es,W:Ao,D:_,doorX:o,terraceU:Ao-4.6,out:"right"});c.push(...x.furniture,...m.furniture);const v=[x.corridor,[{x:a,z:p},{x:o,z:p}],..._c.map(g=>[{x:g,z:Ln},{x:g,z:p}]),...d,...m.legs],y={map:"tropical",size:`tropical-${String(s)}`,W:Ao,D:_,x0:es,island:u,desks:r,islandSpots:h,mainDesk:x.mainDesk,lounge:x.lounge,boardSpots:x.boardSpots,queue:x.queue,door:m.door,terrace:m.terrace,exit:m.exit,furniture:c};return{...y,walks:wr(y,v),queueMore:x.queueMore,curves:s,paths:l,aisles:_c}}const kA={id:"tropical",ready:!0,layout:WA},Nc=16.4,Pi=-Nc/2,ll=3,XA=1.5,Hd=4.8,vc=[Pi+6.45,Pi+12.9,Pi+16],$A=[Pi+3.3,Pi+9.7],qA=e=>((e*7+3)%3-1)*.3,mg=e=>($A[e%2]??0)+qA(e),Uc=e=>5.2+Math.floor(e/2)*3.6+e%2*1.3;function Cp(e){const t=Math.floor(e/ll);return{x:mg(t)+(e%ll-1)*XA,z:Uc(t)+.45}}function YA(e,t){const n=os(e),i=Ha(n,t?.desks,Cp),s=Math.max(1,Math.ceil(Math.ceil(Er(i)/ll)/2),t?.rows??0),[a,o,r]=vc,c=new Map,l=[];for(const E of n){const M=i.get(E)??0,T=Math.floor(M/ll),z=Cp(M);c.set(E,{x:z.x,z:z.z,wz:Uc(T)-.1,ax:T%2===0?a:o,face:0}),l.push(Jt(z.x,z.z+.5,1.3,.76))}const d=[];for(let E=0;E<s*2;E++){const M=mg(E),T=Uc(E);d.push({x:M,z:T,w:Hd}),l.push(Jt(M,T-.55,Hd+.1,.22),Jt(M-Hd/2-.05,T+.65,.22,2.4))}const f=Pi+14.6,u=4.8,h=[Jt(f,u+1,.9,.9),Jt(f,u+2.6,.9,.9)],p=[{x:f-1.1,z:u-.2},{x:f+1.1,z:u-.2},{x:f-1.1,z:u+3.9},{x:f+1.1,z:u+3.9}];l.push(...h,...p.map(E=>Jt(E.x,E.z,.16,.16)));const _=[];for(const E of[u+1,u+2.6])_.push({x:f-.75,z:E,wz:E,ax:o,face:Math.PI/2},{x:f+.75,z:E,wz:E,ax:r,face:-Math.PI/2});_.push({x:f,z:u+.25,wz:u+.25,ax:o,face:0},{x:f,z:u+3.35,wz:u+3.35,ax:o,face:Math.PI});const x=h[1],m=Math.max(Uc(s*2-1)+.45+.89+1.3,u+4.6),v=m+.5,y=br({x0:Pi,W:Nc,main:"right",bed:[.8,.6],reach:vc}),g=Sr({x0:Pi,W:Nc,D:v,doorX:a,terraceU:1,out:"left"});l.push(...y.furniture,...g.furniture);const b=[y.corridor,[{x:a,z:m},{x:r,z:m}],...vc.map(E=>[{x:E,z:Ln},{x:E,z:m}]),...g.legs],S={map:"cyclades",size:`cyclades-${String(s)}`,W:Nc,D:v,x0:Pi,island:x,desks:c,islandSpots:_,mainDesk:y.mainDesk,lounge:y.lounge,boardSpots:y.boardSpots,queue:y.queue,door:g.door,terrace:g.terrace,exit:g.exit,furniture:l};return{...S,walks:wr(S,b),queueMore:y.queueMore,rows:s,cubes:d,tables:h,posts:p,lanes:vc}}const ZA={id:"cyclades",ready:!0,layout:YA},Oc=15.6,_s=-Oc/2,lu=4,xa=_s+9.9,Mc=1.6;function Pp(e){const t=Math.floor(e/lu);return{x:_s+1.6+e%lu*2.1+t%2*.5,z:5+t*2}}function KA(e,t){const n=os(e),i=Ha(n,t?.desks,Pp),s=Math.max(3,Math.ceil(Er(i)/lu),t?.rows??0),a=new Map,o=[];for(const y of n){const g=Pp(i.get(y)??0);a.set(y,{x:g.x,z:g.z,wz:g.z-.6,ax:xa,face:0}),o.push(Jt(g.x,g.z+.5,1.4,.76))}const r=5+(s-1)*2,c={x0:_s+.5,x1:xa-.45,z0:4.25,z1:r+1.3};for(const y of[c.x0,c.x1])for(const g of[c.z0,c.z1])o.push(Jt(y,g,.2,.2));const l={x:_s+12.9,z:5+s-.5},d=Jt(l.x,l.z,1.5,1.5);o.push(d);const f=Array.from({length:8},(y,g)=>{const b=g/8*Math.PI*2,S=l.x+Mc*Math.sin(b),E=l.z+Mc*Math.cos(b);return{x:S,z:E,wz:E,ax:S,face:Math.atan2(l.x-S,l.z-E)}}),u=f.map((y,g)=>[y,f[(g+1)%8]]),h=Math.max(r+.88+1.2,l.z+Mc+.9),p=h+.5,_=br({x0:_s,W:Oc,main:"right",bed:[.7,.5],reach:[xa]}),x=Sr({x0:_s,W:Oc,D:p,doorX:l.x,terraceU:1,out:"left"});o.push(..._.furniture,...x.furniture);const m=[_.corridor,[{x:xa,z:Ln},{x:xa,z:h}],[{x:xa,z:h},{x:l.x,z:h}],[{x:l.x,z:l.z+Mc},{x:l.x,z:h}],...u,...x.legs],v={map:"sahel",size:`sahel-${String(s)}`,W:Oc,D:p,x0:_s,island:d,desks:a,islandSpots:f,mainDesk:_.mainDesk,lounge:_.lounge,boardSpots:_.boardSpots,queue:_.queue,door:x.door,terrace:x.terrace,exit:x.exit,furniture:o};return{...v,walks:wr(v,m),queueMore:_.queueMore,rows:s,hangar:c,tree:l}}const JA={id:"sahel",ready:!0,layout:KA},Lp=11,Ip=3.4,QA=13.5,Fc=3,xg=2.05,du=1.95,dl=4.4,jA=dl-.5,tz=16,ez=10,Dp=4.4,nz=6,iz=12,ga=1.15,sz=.8,Np=2.5,Up={w:3,d:1.2},az=6;function oz(e,t){const n=os(e),i=uz(n,t),s=Math.max(0,...[...i.values()].map(V=>V+1)),a=Math.max(3,Math.ceil(s/Fc),t?.rows??0),o=Lp+Ip+QA,r=Math.max(tz,dl-.2+a*du+2.6),c=-o/2,l=c+Lp,d=l+Ip,f=c+7.5,u=jA,h=r-2.4,p=new Map;for(const V of n){const at=i.get(V)??0,j=c+1.9+at%Fc*xg,pt=dl+Math.floor(at/Fc)*du;p.set(V,{x:j,z:pt,wz:pt-.5,ax:f,face:0})}const _=c+3.9,x=r-1.4,m=Jt(_,x,Up.w,Up.d),v=[-1.2,-.4,.4,1.2].map(V=>({x:_+V,z:h,wz:h,ax:_+V,face:0})),y=(Dp-.9)/3,g=[];for(let V=0;V<ez;V++){const at=V%4,j=c+.65+at*y,pt=1+Math.floor(V/4)*1.05;g.push({x:j,z:pt,wz:pt,ax:at<3?j+y/2:j-y/2,face:0})}const b=c+Dp+1.15,S=[-.45,.45,0].map(V=>({x:b+V,z:.75,wz:u,ax:b+V,face:Math.PI})),E=l-1.6,M=E-1.45,T={x:E,z:1.25,wz:.8,ax:M,face:0},z=[];for(let V=0;V<nz;V++)z.push({x:M,z:1.3+V*Ul,wz:u,ax:M,face:Math.PI/2});const R={x:c+1+ga/2,z:r+.2,wz:h,ax:c+1+ga/2,face:Math.PI},D=[];for(let V=0;V<iz;V++){const at=V%4,j=c+1+at*ga,pt=r+1.5+Math.floor(V/4)*ga;D.push({x:j,z:pt,wz:pt,ax:at<3?j+ga/2:j-ga/2,face:0})}const O=r+sz,C={x:c-Np,z:O,wz:O,ax:c-Np,face:-Math.PI/2},F=cz(d,c+o-.2,.4,r-.2),W=F.flat.z,U={desks:p,mainDesk:T,islandSpots:v,lounge:g,boardSpots:S,queue:z,door:R,terrace:D,exit:C},B={map:"california",size:String(a),W:o,D:r,x0:c,island:m,...U,park:F},P=fz(B),H=lz({...B,crossBack:u,crossFront:h,aisle:f,tw:O,pathZ:W}),k=Math.min(...H[0].map(V=>V.x)),L=[{x:M,z:u},{x:Math.max(k,c+1.5),z:u}];return{...B,rows:a,roomX1:l,parkX0:d,crossBack:u,crossFront:h,aisle:f,pathZ:W,walks:H,furniture:P,queueMore:L}}const rz={id:"california",ready:!0,layout:oz};function cz(e,t,n,i){const s=(n+7.6+(i-4))/2,a=[],o=e+1.4;for(const c of[.45,1.45])a.push({x:o,z:s+c,wz:s,ax:o,face:Math.PI/2});for(let c=0;c<az;c++){const l=e+2.6+c*.7;a.push({x:l,z:s+1.45,wz:s,ax:l,face:Math.PI/2})}const r=(c,l,d,f)=>({x0:c,x1:l,z:d,h:f});return{area:{x0:e,x1:t,z0:n,z1:i},spots:a,flat:r(e+2.6,e+7.2,s,0),curb:r(e+5.5,e+7,i-3.4,.2),rail:r(e+.9,e+4.9,i-1.6,.42),ledge:r(e+.8,e+4.8,i-3.4,.45),stairs:{x0:e,xTop:e+2.4,xBottom:e+2.4+4*.42,z0:n+4.8,z1:n+7.2,h:.8,railZ:n+6.95,bankX0:e+.8,bankZ:n+8.6},ramp:{xa:e+1,xb:e+1+1.2+3+1.2,r:1.2,z0:n+.2,z1:n+3.6},qp:{x0:t-3.8,x1:t-.6,zLip:n+.6,r:1,r13:1.7},funbox:{x:e+8.6,z:n+7.2,hw:1,hd:1.1,h:.5,run:1.35},bowl:{x:t-3,z:i-3.4,hw:2.3,hd:2.5,rc:1.4,depth:.95},benches:[{x0:e+.125,x1:e+.575,z0:s-1.9,z1:s-.4},{x0:t-.575,x1:t-.125,z0:n+5.3,z1:n+6.8}],poles:[{x:e+.15,z:n+.15},{x:t-.15,z:n+.15},{x:e+.15,z:n+4.3},{x:e+.15,z:i-.15},{x:(e+t)/2+1,z:n+.15}]}}function lz(e){const{crossBack:t,crossFront:n,aisle:i,tw:s,exit:a,door:o,pathZ:r,park:c}=e,l=[...e.desks.values(),e.mainDesk,...e.islandSpots,...e.lounge,...e.boardSpots,...e.queue,o,...e.terrace,a,...c.spots],d=l.filter(_=>_.wz<=t+1e-6).map(_=>_.ax),f=c.spots.map(_=>_.ax),u=[[{x:Math.min(i,...d),z:t},{x:Math.max(i,...d),z:t}],[{x:i,z:t},{x:i,z:n}],[{x:o.ax,z:n},{x:i,z:n}],[{x:i,z:r},{x:Math.max(...f),z:r}],[{x:o.ax,z:n},{x:o.ax,z:s}],[{x:a.x,z:s},{x:Math.max(o.ax,...e.terrace.map(_=>_.ax)),z:s}]],h=_=>u.some(([x,m])=>dz(x,m,_)),p=[u[0],...u.slice(1)];for(const _ of l){p.push(...Ol(_));const x={x:_.ax,z:_.wz};h(x)||p.push([x,{x:_.ax,z:_.wz<t?t:s}])}return p}function dz(e,t,n){return Math.abs(e.x-t.x)<1e-6?Math.abs(n.x-e.x)<1e-4&&n.z>=Math.min(e.z,t.z)-1e-4&&n.z<=Math.max(e.z,t.z)+1e-4:Math.abs(e.z-t.z)<1e-6?Math.abs(n.z-e.z)<1e-4&&n.x>=Math.min(e.x,t.x)-1e-4&&n.x<=Math.max(e.x,t.x)+1e-4:!1}function fz(e){const t=[];for(const i of e.desks.values())t.push(Jt(i.x,i.z+.5,1.6,.78));t.push(Jt(e.mainDesk.x,e.mainDesk.z+.6,2.3,1));const n=e.island;t.push({x0:n.x0-.05,x1:n.x1+.05,z0:n.z0-.05,z1:n.z1+.05});for(const i of e.lounge)t.push(Jt(i.x,i.z-.05,.72,.72,i));for(const i of e.terrace)t.push(Jt(i.x,i.z+.05,.5,.95,i));return t}function uz(e,t){const n=new Map,i=new Set;if(t){const a=t.x0;for(const o of e){const r=t.desks.get(o);if(!r)continue;const c=Math.round((r.z-dl)/du)*Fc+Math.round((r.x-a-1.9)/xg);n.set(o,c),i.add(c)}}let s=0;for(const a of e)if(!n.has(a)){for(;i.has(s);)s++;n.set(a,s),i.add(s)}return n}const Op={loft:QT,greenhouse:lA,campus:uA,workshop:mA,kyoto:vA,riad:bA,nordic:AA,patio:FA,haveli:HA,tropical:kA,cyclades:ZA,sahel:JA,california:rz};function hz(e){const t=Op[e];return t.ready?t:Op[ug]}function gg(e,t=ug,n){const i=hz(t);return i.layout(e,n?.map===i.id?n:void 0)}const pz=new Set(["sleep","waitagent"]);function mz(e){return e.filter(t=>pz.has(t.pose.seg.act.k)&&!t.pose.moving).map(t=>t.name)}function xz(e,t){const n=new Set;for(const[i,s]of t){n.add(i);let a=e.querySelector(`:scope > [data-bim="${CSS.escape(i)}"]`);if(a===null){a=document.createElement("div"),a.className="bims-zzz",a.dataset.bim=i,a.dataset.testid=`app.right.bims.zzz.${i}`,a.setAttribute("aria-hidden","true");for(const o of["z","z","Z"]){const r=document.createElement("span");r.textContent=o,a.append(r)}e.append(a)}a.style.transform=`translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`}for(const i of[...e.children])i instanceof HTMLElement&&!n.has(i.dataset.bim??"")&&i.remove()}const _g={eclipse:!1,ghost:null,tree:!1,cake:!1,april:!1,doodle:!1,music:!1},gz=4,_z=5,vz=5;function Mz(e){return{y:e.getFullYear(),mo:e.getMonth()+1,d:e.getDate(),dow:e.getDay(),s:e.getHours()*3600+e.getMinutes()*60+e.getSeconds()}}const vg=e=>`${String(e.y)}-${String(e.mo)}-${String(e.d)}`,yz=2,Mg=.9,yg=.6,bg=1.2,Na=3,bz=30,Fp=20,fl=10,fu=1.4,Sz=new Set(["salto","hop","moonwalk","itemget","kickflip","tap","golden","speedrun","combo","loop"]),uu=new Set(["nap","snack","done","mainidle"]);function l0(e){let t=2166136261;for(let n=0;n<e.length;n++)t^=e.charCodeAt(n),t=Math.imul(t,16777619)>>>0;return t>>>0}const ji=(e,t,n)=>l0(`${e}|${t}`)%n===0,wz=e=>{const t=Math.max(0,Math.round(e/1e3));return`${String(Math.floor(t/60))}:${String(t%60).padStart(2,"0")}`};function Ez(e,t,n){const i=vg(n),s=e.day===i?[...e.lands]:[];for(const a of t){const o=a.pose.seg;o.from!=="landing"||o.act.k!=="done"||s.some(r=>r.name===a.name&&r.t===o.t)||s.push({name:a.name,t:o.t})}return s.sort((a,o)=>a.t-o.t),s.length===e.lands.length&&i===e.day?e:{day:i,lands:s}}function Sg(e,t){const{local:n}=e,i=vg(n),s=10*3600+l0(`eclipse-at|${i}`)%(8*3600),a=ji("eclipse",i,100)&&n.s>=s&&n.s<s+bz,o=e.night&&n.s<Fp?n.s/Fp:null,r=e.agents.reduce((p,_)=>_.created_ms===void 0||_.created_ms===null?p:p===null?_.created_ms:Math.min(p,_.created_ms),null),c=r===null?null:new Date(r),l=c!==null&&c.getMonth()+1===n.mo&&c.getDate()===n.d&&c.getFullYear()<n.y,d=e.stage??0,f=e.agents.filter(p=>!p.archived&&p.status==="working").length,u=n.dow===5&&n.s>=17*3600,h=d>=_z&&(f>=vz||u);return{eclipse:a,ghost:o,tree:n.mo===12&&(n.d===24||n.d===25),cake:l,april:n.mo===4&&n.d===1,doodle:t&&d>=gz,music:h}}function Tz(e,t,n,i,s){const{t:a}=t,{pose:o}=e,r=o.seg,c=r.act.k,l=`${e.name}@${r.t.toFixed(3)}`,d=a-r.t,f=r.path.len>.01&&r.from!==null?r.path.len/r.speed:0,u=(h,p,_,x="")=>a>=p&&a<p+_?{kind:h,since:a-p,dur:_,label:x}:null;if(t.konami!==null&&a-t.konami<fu&&a>=t.konami)return{kind:"salto",since:a-t.konami,dur:fu,label:e.main?"+30":""};if(e.main&&s!==null)return u("clap",s,Na,"");if(e.main){const h=t.lands[3];if(h!==void 0)return u("tetris",h.t,Na,"line clear")}if(c==="done"&&r.from!==null&&r.from!=="done"){const h=t.lands[0];if(r.from==="landing"&&h!==void 0&&h.name===e.name&&h.t===r.t)return u("itemget",r.t,2.5,"♪ ♪ ♪");const p=n.get(e.name),_=p?.created_ms;if(_!=null&&r.t*1e3-_<12e4&&r.t*1e3>=_)return u("speedrun",r.t,4,wz(r.t*1e3-_));const x=p?.place_id;if(x!==void 0&&x!==""&&x!=="shared"&&t.frames.some(v=>v.name!==e.name&&v.pose.seg.act.k==="done"&&v.pose.seg.t<r.t&&n.get(v.name)?.place_id===x))return u("combo",r.t,Na,"combo ×2");if(ji("salto",l,10))return u("salto",r.t,Mg)}if(c==="done"&&!o.moving&&r.act.at==="terrace"){const h=Math.floor(a/3600),p=h*3600+l0(`kickflip|${e.name}|${String(h)}`)%3600;if(p>r.t+f){const _=u("kickflip",p,bg,"kickflip +500");if(_!==null)return _}}if(i.eclipse&&uu.has(c))return{kind:"lookup",since:0,dur:1/0,label:""};if(t.local.mo===10&&t.local.d===31&&t.local.s<fl&&uu.has(c))return{kind:"dance",since:t.local.s,dur:fl,label:""};if(o.moving&&f>4&&ji("hop",l,40))return u("hop",r.t+f/2,yg);if(o.moving&&r.from==="coffee"&&ji("moonwalk",l,50))return u("moonwalk",r.t,f);if(c==="coffee"&&!o.moving&&ji("tap",l,200))return u("tap",r.t+f,.8);if(c==="snack"&&r.act.fruit===0&&ji("golden",l,500))return{kind:"golden",since:d,dur:1/0,label:""};if(o.plane!==void 0&&ji("loop",`${e.name}@${(a-o.plane.since).toFixed(1)}`,50))return{kind:"loop",since:o.plane.since,dur:1/0,label:""};if(c==="waitagent"){const h=r.act.on,p=h===void 0?void 0:n.get(h)?.waiting_on;if(p?.who==="agent"&&p.name===e.name)return{kind:"stare",since:d,dur:1/0,label:"!"}}return t.local.dow===5&&t.local.s>=17*3600&&(c==="nap"||c==="snack")?{kind:"shades",since:0,dur:1/0,label:""}:null}function Az(e,t){const n=e.filter(i=>!i.main);return t>0||n.length===0||!n.every(i=>uu.has(i.pose.seg.act.k))||!n.some(i=>i.pose.seg.act.k==="done")?null:Math.max(...e.map(i=>i.pose.seg.t))}function zz(e){if(e.reduced)return{bims:new Map,office:_g};const t=new Map(e.agents.map(c=>[c.name,c])),n=e.frames.some(c=>c.pose.seg.act.at==="board"&&!c.pose.moving&&ji("doodle",`${c.name}@${c.pose.seg.t.toFixed(3)}`,10)),i=Sg(e,n),s=Az(e.frames,e.cards),a=[];for(const c of e.frames){const l=Tz(c,e,t,i,s);l!==null&&a.push([c.name,l])}const o=a.filter(([,c])=>Sz.has(c.kind)&&!(e.konami!==null&&c.dur===fu)).sort(([c,l],[d,f])=>l.since-f.since||(c<d?-1:1)),r=new Set(o.slice(yz).map(([c])=>c));return{bims:new Map(a.filter(([c])=>!r.has(c))),office:i}}const Rz={bims:new Map,office:_g};function Bp(e,t,n){const i=Sg({local:e,night:t,agents:n},!1),s=e.dow===5&&e.s>=17*3600,a=e.mo===10&&e.d===31&&e.s<fl;return`${JSON.stringify({...i,ghost:i.ghost===null?null:Math.round(i.ghost*40)})}|${String(s)}|${String(a)}`}function Cz(e,t){if(t==null)return e;const n=new Map(e.bims);for(const[i,s]of Object.entries(t.bims??{}))n.set(i,{kind:s.kind,since:s.since,dur:Pz[s.kind]??1/0,label:Lz[s.kind]??""});return{bims:n,office:{...e.office,...t.office}}}const Pz={salto:Mg,hop:yg,kickflip:bg,itemget:2.5,tap:.8,clap:Na,dance:fl,speedrun:4,combo:Na,tetris:Na},Lz={speedrun:"1:47",combo:"combo ×2",stare:"!",itemget:"♪ ♪ ♪",kickflip:"kickflip +500",tetris:"line clear"};function Iz(e){const t=new Map;for(const[n,i]of e.bims)i.label!==""&&t.set(n,i.label);return t}const yc={walk:2.4,hurry:3.5,skate:3.4,carry:1.8},d0=6,wg=1.5,Gp=3.5,Hp=8,Vp=6,Dz=3,Nz=3,Uz=10,Oz=new Set(["work","hot","nap","snack","done"]);function Fz(){const e=new Map;let t=null;const n=new Set,i=(o,r)=>o.segs.findLast(c=>c.t<=r)??null,s=(o,r)=>{if(o.leaving&&r>=o.outAt)return null;const c=i(o,r);if(!c)return null;const l=(r-c.t)*c.speed,d=l<c.path.len-1e-9,f=d?og(c.path,l):{x:c.spot.x,z:c.spot.z,dir:c.spot.face},u=o.planes.findLast(h=>h<=r&&r-h<Gp);return{x:f.x,z:f.z,dir:f.dir,moving:d,since:r-c.t,seg:c,...u===void 0?{}:{plane:{since:r-u}}}},a=(o,r)=>{o.segs.push(r),o.segs.length>Hp&&o.segs.splice(0,o.segs.length-Hp)};return{update(o,r,c,l,d,f){const u=t===null,h=t!==null&&(t.map!==r.map||t.size!==r.size);t=r;const p=new Map;for(const[m,v]of e)v.key&&!v.leaving&&p.set(v.key,m);Wz(e,o,l,c,n);for(const m of e.values())m.over&&c>=m.over.until&&(m.over=null);const _=new Map([...o].filter(([m])=>e.get(m)?.over==null)),x=F3(_,r,c,f);for(const[m,v]of o){let y=e.get(m);const g=Hz(y?.over?.act??v,y?.key??null,p,r.lounge.length,d),b=y?.over?void 0:x.get(m),S=b?r.park?.spots[b.slot]:void 0,E=b&&S?`skate|${String(b.slot)}|${b.pool?"pool":""}|${b.nine?"900":""}|${String(b.stage)}`:Bz(g),M=y?.segs.at(-1),T=S??Gz(r,m,g);if(y&&M&&!y.leaving&&M.sig===E&&(S!==void 0||M.act.at===g.at)&&!h&&(!T||kz(T,M.spot)))continue;y?.key&&p.delete(y.key);const z=T?null:Vz(r,g.at,p,y?.pref),R=T??z?.spot??r.door,D=z?.key??null;if(D&&p.set(D,m),y&&z?.ix!==void 0&&y.pref.set(g.at,z.ix),!y){y={segs:[],key:D,leaving:!1,outAt:1/0,pref:new Map,planes:[],over:null},z?.ix!==void 0&&y.pref.set(g.at,z.ix),e.set(m,y);const F=u?R:r.door;a(y,Vd(Wd(r,c,g,E,F,R,null),b,void 0));continue}if(y.key=D,y.leaving=!1,y.outAt=1/0,h&&M){a(y,Vd({...M,act:g,sig:E,spot:R,path:Eo([R]),t:M.sig===E?M.t:c},b,void 0));continue}const O=s(y,c),C=Vd(Wd(r,c,g,E,O??R,R,M?M.act.k:null),b,M);a(y,C),y.over&&y.over.act===g&&(y.over.until=c+C.path.len/C.speed+y.over.stay)}for(const m of e.values())m.over&&m.over.until===1/0&&(m.over.until=c+d0+m.over.stay);for(const[m,v]of e){if(o.has(m)||v.leaving)continue;const y=v.segs.at(-1);v.key&&p.delete(v.key),v.key=null,v.leaving=!0;const g={k:"done",at:"terrace"},b=h?null:s(v,c),S=Wd(r,c,g,"gone",b??r.exit,r.exit,y?.act.k??null);a(v,S),v.outAt=c+S.path.len/S.speed}for(const[m,v]of e)v.leaving&&v.outAt<c&&e.delete(m);for(const m of l){if(m.kind!=="message"||m.from.who!=="you"||m.to.who!=="agent")continue;const v=e.get(m.to.name);!v||v.planes.includes(m.t)||(v.planes.push(m.t),v.planes.sort((y,g)=>y-g))}for(const m of e.values())m.planes=m.planes.filter(v=>v>c-Gp-60)},poseAt(o,r){const c=e.get(o);return c?s(c,r):null},names(o){return[...e].filter(([,r])=>s(r,o)!==null).map(([r])=>r)},moving(o){for(const r of e.values()){const c=s(r,o);if(!c)continue;if(c.moving||c.plane||r.over)return!0;const l=c.seg;if(l.from!==null&&o<l.t+l.path.len/l.speed+wg)return!0}return!1}}}function Vd(e,t,n){return{...{t:e.t,act:e.act,sig:e.sig,spot:e.spot,path:e.path,speed:e.speed,from:e.from},...t?{pastime:t}:{},...!t&&n?.pastime?{fromSkate:!0}:{}}}function Bz(e){return`${e.k}|${e.rank===void 0?"":String(e.rank)}|${e.key===void 0?"":String(e.key)}|${e.with??""}`}function Wd(e,t,n,i,s,a,o){const r=ag(e,s,a),c=i==="gone"||n.k==="done"?yc.skate:n.k==="landing"?yc.carry:n.urgent?yc.hurry:yc.walk;return{t,act:n,sig:i,spot:a,path:r,speed:Math.max(c,r.len/d0),from:o}}function Gz(e,t,n){switch(n.at){case"desk":return n.k==="visit"&&n.with!==void 0?Wp(e.desks.get(n.with)??e.mainDesk):e.desks.get(t)??e.door;case"main":return n.k==="report"?Wp(e.mainDesk):e.mainDesk;case"door":return e.door;case"queue":{const i=Math.max(1,n.rank??1),s=e.queue[i-1];if(s)return s;const[a,o]=e.queueMore,r=Math.hypot(o.x-a.x,o.z-a.z),c=r>0?Math.min(1,Ul*(i-e.queue.length)/r):0,l=a.x+(o.x-a.x)*c,d=a.z+(o.z-a.z)*c;return{x:l,z:d,wz:d,ax:l,face:e.queue.at(-1)?.face??Math.PI/2}}default:return null}}function Hz(e,t,n,i,s){if(e.k!=="nap"||e.at!=="lounge")return e;const a=Math.min(i,s??i),o=r=>{const c=`lounge:${String(r)}`;return c===t||!n.has(c)};for(let r=0;r<a;r++)if(o(r))return e;return{...e,at:"desk"}}function Vz(e,t,n,i){const s=t==="lounge"?e.lounge:t==="island"?e.islandSpots:t==="board"?e.boardSpots:e.terrace,a=f=>!n.has(`${t}:${String(f)}`),o=i?.get(t),r=o!==void 0&&o<s.length&&a(o)?o:s.findIndex((f,u)=>a(u)),c=s[r];if(c)return{spot:c,key:`${t}:${String(r)}`,ix:r};let l=0;for(;n.has(`${t}:+${String(l)}`);)l++;const d=s[l%s.length];return d?{spot:{x:d.ax,z:d.wz,wz:d.wz,ax:d.ax,face:d.face},key:`${t}:+${String(l)}`}:null}const Wp=e=>({x:e.x,z:e.wz,wz:e.wz,ax:e.ax,face:e.face});function Wz(e,t,n,i,s){const a=o=>{const r=e.get(o),c=r?.over?.act.k??t.get(o)?.k;return r&&!r.leaving&&r.over===null&&c!==void 0&&Oz.has(c)?r:null};for(const o of[...n].sort((r,c)=>r.t-c.t)){const r=o.kind==="report"?`r|${o.agent}|${String(o.t)}`:`m|${JSON.stringify(o.from)}|${JSON.stringify(o.to)}|${String(o.t)}`;if(s.has(r)||o.t>i||i-o.t>Uz)continue;if(s.add(r),o.kind==="report"){const u=t.get(o.agent)?.k==="main"?null:a(o.agent);u&&(u.over={act:{k:"report",at:"main"},stay:Nz,until:1/0});continue}if(o.from.who!=="agent"||o.to.who!=="agent"||o.from.name===o.to.name)continue;const c=a(o.from.name);if(!c||t.get(o.from.name)?.k==="main")continue;const l=t.get(o.to.name)?.k,f=l==="nap"||l==="snack"?a(o.to.name):null;f?(c.over={act:{k:"coffee",at:"island",with:o.to.name},stay:Vp,until:1/0},f.over={act:{k:"coffee",at:"island",with:o.from.name},stay:Vp,until:1/0}):o.mode!=="unknown"&&l!==void 0&&(c.over={act:{k:"visit",at:"desk",with:o.to.name,mode:o.mode},stay:Dz,until:1/0})}if(s.size>500)for(const o of[...s].slice(0,s.size-500))s.delete(o)}const kz=(e,t)=>Math.hypot(e.x-t.x,e.z-t.z)<1e-4,Va={hover:null,held:!1,lit:null,follow:null},Xz=(e,t)=>`${t}|${e.map(n=>`${n.name}${n.main?"*":""}`).join(",")}`,$z=d0+wg+1;function qz(e){const t=e.newTimeline();let n=null,i=[],s=null,a=!0,o=[],r=null,c="",l=is,d=null,f,u={day:"",lands:[]},h=null,p="",_="";return{rows(v,y,g){n=v,i=y,s=g,a=!0},grow(v,y){l=v;const g=kg(d,v);g!==null&&(f={stage:g,at:y}),d=v,a=!0},event(v){o.push(v),a=!0},konami(v){h=v},step(v,y){const g=x(v);return g===null?null:m(g.office,g.reshaped,v,y)},still(v){const y=x(v);return y===null?null:m(y.office,y.reshaped,{...v,t:v.t+$z,reduced:!0,forced:{bims:{}}},Va,!0)},stale(v){if(n===null)return!1;const y=Bp(v.local,v.night,i)!==_||JSON.stringify([...e.activities(n,v.t)])!==p;return y&&(a=!0),y}};function x(v){if(n===null||s===null)return null;const{t:y,local:g,reduced:b}=v;let S=!1;if(a){a=!1;const E=Xz(i,s);(r===null||E!==c)&&(c=E,r=e.layoutOf(i,s),S=!0);const M=e.activities(n,y);p=JSON.stringify([...M]),t.update(M,r,y,o,xl(l.stage),{stage:l.stage,jobs:l.jobs,dow:g.dow,day:O3(g.y,g.mo,g.d),reduced:b}),o=[]}return r===null?null:{office:r,reshaped:S}}function m(v,y,g,b,S=!1){const{t:E,local:M,night:T,reduced:z}=g,R=new Set(i.filter(B=>B.main).map(B=>B.name)),D=[];for(const B of t.names(E)){const P=t.poseAt(B,E);P!==null&&D.push({name:B,main:R.has(B),pose:P})}u=Ez(u,D,M);const O=g.forced!==void 0?Cz(Rz,g.forced):zz({t:E,frames:D,agents:i,cards:n?.cards.length??0,local:M,night:T,reduced:z,lands:u.lands,konami:h,stage:l.stage});_=Bp(M,T,i);const C=D.map(B=>{const P=O.bims.get(B.name),H=B.name===b.lit||B.name===b.follow;return P===void 0?H?{...B,lit:H}:B:{...B,egg:P,...H?{lit:H}:{}}}),F=S?void 0:f,W={night:T,reduced:z,eggs:O.office,grow:l,...F?{unlock:F}:{}};F&&E-F.at>wc+em&&(f=void 0);const U=e.labelsOf(C,{t:E,hover:b.hover,held:b.held,agents:i,eggs:Iz(O),follow:b.follow,park:v.park});return{office:v,agents:i,want:s??v.map,reshaped:y,frames:D,played:C,look:W,labels:U,moving:t.moving(E)}}}const ks=300,bt=(e,t)=>e*60+t,xn={k:"work",doing:"edit"},kd={k:"work",doing:"think"},ei={k:"gone"},ps={k:"idle"},xo={k:"done"},Le="harness",_n="bise.dev",Xn="acme-web",Vo=[{id:Le,name:"harness",map:"loft",stage:13,bims:[{name:"main",main:!0,life:[[0,{k:"mainidle"}],[bt(0,12),{k:"main"}],[bt(3,50),{k:"mainidle"}]]},{name:"signup-flow",life:[[0,ei],[bt(0,20),xn],[bt(3,36),{k:"landing",rank:1}],[bt(3,42),xo],[bt(4,31),ei]]},{name:"dark-mode",life:[[0,ei],[bt(0,24),xn],[bt(2,30),kd],[bt(2,50),xn],[bt(3,2),{k:"landing",rank:1}],[bt(3,11),xo],[bt(4,33),ei]]},{name:"fix-flaky-test",life:[[0,xn],[bt(1,16),{k:"failed"}],[bt(1,40),xn]]},{name:"docs-sync",life:[[0,ps],[bt(2,0),{k:"snack",fruit:1,trip:1}],[bt(2,8),{k:"snack",fruit:0,trip:2}],[bt(2,16),ps]]},{name:"perf-audit",life:[[0,{k:"sleep"}]]}]},{id:_n,name:"bise.dev",map:"california",stage:11,bims:[{name:"main",main:!0,life:[[0,{k:"main"}],[bt(4,4),{k:"mainidle"}]]},{name:"pricing-page",life:[[0,ei],[bt(0,58),xn],[bt(1,6),{k:"asks"}],[bt(1,26),xn],[bt(3,58),{k:"landing",rank:1}],[bt(4,3),xo],[bt(4,32),ei]]},{name:"og-images",life:[[0,ei],[bt(1,20),xn],[bt(3,12),{k:"landing",rank:1}],[bt(3,16),xo],[bt(3,52),ei]]},{name:"seo-meta",life:[[0,ps],[bt(1,40),kd],[bt(1,46),ps]]},{name:"i18n",life:[[0,ps],[bt(4,44),kd],[bt(4,50),ps]]}]},{id:Xn,name:"acme-web",map:"riad",stage:9,bims:[{name:"main",main:!0,life:[[0,{k:"main"}]]},{name:"api-tests",life:[[0,xn],[bt(2,12),{k:"wait",on:"checkout"}],[bt(2,23),xn]]},{name:"checkout",life:[[0,xn],[bt(2,12),{k:"wait",on:"api-tests"}],[bt(2,23),ps],[bt(2,26),xn]]},{name:"invoice-pdf",life:[[0,ei],[bt(0,58),xn],[bt(3,22),{k:"landing",rank:1}],[bt(3,28),xo],[bt(4,46),ei]]}]}],Eg=[{at:bt(0,11),office:Le,from:"you",to:"main"},{at:bt(1,24),office:_n,from:"you",to:"pricing-page"},{at:bt(2,24),office:Xn,from:"api-tests",to:"checkout"}],Yz=[{at:bt(1,24),dur:3.5,office:_n,bim:"pricing-page",kind:"loop"},{at:bt(1,.5),dur:.6,office:Xn,bim:"invoice-pdf",kind:"hop"},{at:bt(2,8),dur:8,office:Le,bim:"docs-sync",kind:"golden"},{at:bt(2,12.5),dur:10.5,office:Xn,bim:"api-tests",kind:"stare"},{at:bt(2,12.5),dur:10.5,office:Xn,bim:"checkout",kind:"stare"},{at:bt(2,31),dur:.8,office:Xn,bim:"checkout",kind:"tap"},{at:bt(2,36),dur:6,office:Xn,bim:"checkout",kind:"moonwalk"},{at:bt(3,8),dur:2.5,office:Le,bim:"dark-mode",kind:"itemget"},{at:bt(3,16),dur:4,office:_n,bim:"og-images",kind:"speedrun"},{at:bt(3,42),dur:3,office:Le,bim:"main",kind:"tetris"},{at:bt(3,42),dur:3,office:Le,bim:"dark-mode",kind:"combo"},{at:bt(3,42),dur:3,office:Le,bim:"signup-flow",kind:"combo"},{at:bt(4,5),dur:3,office:_n,bim:"main",kind:"clap"},{at:bt(4,20),dur:1.2,office:Le,bim:"dark-mode",kind:"kickflip"},{at:bt(4,30),dur:.9,office:Le,bim:"signup-flow",kind:"salto"}],qe=(e,t)=>({k:"bim",office:e,name:t}),Hn=[{at:0,size:"wide",subject:{k:"town"}},{at:bt(0,10),size:"office",subject:{k:"office",office:Le}},{at:bt(0,20),size:"follow",subject:qe(Le,"signup-flow")},{at:bt(0,34),size:"office",subject:{k:"office",office:Le}},{at:bt(0,44),size:"close",subject:qe(_n,"i18n")},{at:bt(0,58),size:"wide",subject:{k:"town"}},{at:bt(1,6),size:"follow",subject:qe(_n,"pricing-page")},{at:bt(1,16),size:"follow",subject:qe(Le,"fix-flaky-test")},{at:bt(1,24),size:"office",subject:{k:"office",office:_n}},{at:bt(1,40),size:"office",subject:{k:"office",office:Le}},{at:bt(1,52),size:"wide",subject:{k:"town"}},{at:bt(2,2),size:"close",subject:qe(Le,"docs-sync")},{at:bt(2,14),size:"follow",subject:{k:"pair",office:Xn,names:["api-tests","checkout"]}},{at:bt(2,24),size:"follow",subject:qe(Xn,"checkout")},{at:bt(2,34),size:"close",subject:qe(Xn,"checkout")},{at:bt(2,42),size:"follow",subject:qe(_n,"seo-meta")},{at:bt(2,56),size:"wide",subject:{k:"town"}},{at:bt(3,4),size:"follow",subject:qe(Le,"dark-mode")},{at:bt(3,16),size:"close",subject:qe(_n,"og-images")},{at:bt(3,26),size:"office",subject:{k:"office",office:Xn}},{at:bt(3,38),size:"close",subject:qe(Le,"main")},{at:bt(3,52),size:"follow",subject:qe(_n,"og-images")},{at:bt(3,56),size:"wide",subject:{k:"town"}},{at:bt(4,2),size:"closest",subject:qe(_n,"main")},{at:bt(4,8),size:"close",subject:qe(_n,"main")},{at:bt(4,16),size:"follow",subject:qe(Le,"dark-mode")},{at:bt(4,30),size:"follow",subject:qe(Le,"signup-flow")},{at:bt(4,44),size:"wide",subject:{k:"town"}}],kp=1.5,Zz=1.6,Kz=2.4,Xp=.6,Jz=4,Qz=20,$p=2.4,jz=14,ul={x:.575,y:.5},t5={x0:.27,x1:.89,y0:.19,y1:.97},Tg={x0:.3,x1:.85,y0:.1,y1:.9},e5=1.3,n5={tight:1.4,follow:2.2,close:3.2,closest:4},Wo=(e,t,n)=>Math.min(n,Math.max(t,e)),Ag=.75,i5=.2;function ss(e){const t=Wo(Number.isFinite(e.zoom)?e.zoom:1,Ag,jz),n=.5/t,i=i5/t,s=Math.min(n,1-n)-i,a=Math.max(n,1-n)+i;return{zoom:t,u:Wo(e.u,s,a),v:Wo(e.v,s,a)}}function hu(e,t){const n=(t.x1-t.x0)/Math.max(1e-6,e.u1-e.u0),i=(t.y1-t.y0)/Math.max(1e-6,e.v1-e.v0),s=Math.max(Ag,Math.min(n,i)),a=(e.u0+e.u1)/2,o=(e.v0+e.v1)/2,r=(t.x0+t.x1)/2,c=(t.y0+t.y1)/2;return ss({zoom:s,u:a-(r-.5)/s,v:o-(c-.5)/s})}function pu(e,t,n=ul.x,i=ul.y){return ss({zoom:t,u:e.u-(n-.5)/t,v:e.v-(i-.5)/t})}const hl=e=>e.k==="town"?null:e.office;function bc(e,t){const n=e.subject;if(e.size==="wide"||n.k==="town"){const o=t.town();return o?hu(o,t5):null}const i=t.office(n.office);if(!i)return null;const s=hu(i,Tg);let a;switch(n.k){case"office":a=null;break;case"spot":a=t.spot(n.office,n.spot);break;case"bim":a=t.bim(n.office,n.name);break;case"pair":{const o=t.bim(n.office,n.names[0]),r=t.bim(n.office,n.names[1]);a=o&&r?{u:(o.u+r.u)/2,v:(o.v+r.v)/2}:o??r;break}}if(e.size==="office"){const o=a??{u:s.u+(ul.x-.5)/s.zoom,v:s.v+(ul.y-.5)/s.zoom};return pu(o,s.zoom*e5)}return a===null?s:pu(a,s.zoom*n5[e.size])}function Sc(e,t){const n=e[0];if(n!==void 0&&t>=n.at-kp+ks)return 0;let i=e.length-1;for(let s=0;s<e.length;s++){const a=e[s];a!==void 0&&a.at-kp<=t&&(i=s)}return i}function s5(e,t){const n=e===null?null:hl(e.subject),i=hl(t.subject),s=e!==null&&n!==i&&n!==null&&i!==null;return{dur:Math.max(Xp,e===null?Xp:n===i?Zz:Kz),across:s}}const a5=e=>{const t=Wo(e,0,1);return t*t*t*(t*(t*6-15)+10)};function o5(e,t,n,i){const s=a5(n),a=Math.log(e.zoom),o=Math.log(t.zoom);let r=a+(o-a)*s;if(i!==null){const c=(a+o)/2,l=Math.max(0,c-Math.log(Math.max(1,i)));r-=l*4*s*(1-s)}return ss({zoom:Math.exp(r),u:e.u+(t.u-e.u)*s,v:e.v+(t.v-e.v)*s})}const go=e=>({cam:e,vz:0,vu:0,vv:0});function r5(e,t,n){const i=Wo(n,0,.1),s=Jz,a=(u,h,p)=>{const _=u-p,x=Math.exp(-s*i),m=h+s*_;return[p+(_+m*i)*x,(h-s*m*i)*x]},[o,r]=a(Math.log(e.cam.zoom),e.vz,Math.log(t.zoom)),[c,l]=a(e.cam.u,e.vu,t.u),[d,f]=a(e.cam.v,e.vv,t.v);return{cam:ss({zoom:Math.exp(o),u:c,v:d}),vz:r,vu:l,vv:f}}function c5(e,t,n){return e.k==="visitor"&&!n&&t-e.last>=Qz}const l5=4,d5=.01;function Xd(e,t,n,i){const s=e.zoom*t,a=e.u+(n-.5)/e.zoom,o=e.v+(i-.5)/e.zoom,r=ss({zoom:s,u:a-(n-.5)/s,v:o-(i-.5)/s});return ss({zoom:r.zoom,u:a-(n-.5)/r.zoom,v:o-(i-.5)/r.zoom})}function qp(e,t,n){return ss({zoom:e.zoom,u:e.u-t/e.zoom,v:e.v-n/e.zoom})}function f5(e,t){let n=null,i=null;const s=()=>e.getBoundingClientRect(),a=g=>{const b=s();return{x:g.clientX-b.left,y:g.clientY-b.top,w:Math.max(1,b.width),h:Math.max(1,b.height)}},o=g=>{e.style.cursor=g};o("grab");const r=g=>{g.pointerType==="touch"||g.button!==0||g.target?.closest("button, a")==null&&(e.setPointerCapture(g.pointerId),n={id:g.pointerId,x:g.clientX,y:g.clientY,lx:g.clientX,ly:g.clientY,moved:!1})},c=g=>{if(g.pointerType==="touch")return;const b=a(g);if(n===null||n.id!==g.pointerId){const S=t.pick(b.x,b.y);o(S===null?"grab":"pointer"),t.hover(S);return}!n.moved&&Math.hypot(g.clientX-n.x,g.clientY-n.y)<l5||(n.moved||o("grabbing"),n.moved=!0,t.take(qp(t.cam(),(g.clientX-n.lx)/b.w,(g.clientY-n.ly)/b.h)),n.lx=g.clientX,n.ly=g.clientY)},l=g=>{if(n===null||n.id!==g.pointerId)return;const b=n;if(n=null,o("grab"),b.moved||g.type==="pointercancel")return;const S=a(g),E=t.pick(S.x,S.y);E!==null&&t.follow({office:E.id,name:E.name})},d=g=>{const b=g[0],S=g[1];return!b||!S?null:{mx:(b.clientX+S.clientX)/2,my:(b.clientY+S.clientY)/2,d:Math.hypot(b.clientX-S.clientX,b.clientY-S.clientY)}},f=g=>{if(g.touches.length!==2){i=null;return}g.preventDefault();const b=d(g.touches);if(b!==null){if(i!==null&&g.type==="touchmove"){const S=s(),E=Math.max(1,S.width),M=Math.max(1,S.height);let T=qp(t.cam(),(b.mx-i.mx)/E,(b.my-i.my)/M);i.d>0&&b.d>0&&(T=Xd(T,b.d/i.d,(b.mx-S.left)/E,(b.my-S.top)/M)),t.take(T)}i=b}},u=g=>{if(g.pointerType!=="touch")return;const b=a(g),S=t.pick(b.x,b.y);S!==null&&t.follow({office:S.id,name:S.name})},h=g=>{if(!g.ctrlKey&&!g.metaKey)return;g.preventDefault();const b=a(g),S=g.deltaMode===1?g.deltaY*16:g.deltaY;t.take(Xd(t.cam(),Math.exp(-S*d5),b.x/b.w,b.y/b.h))},p=g=>{g.preventDefault(),t.wide()};let _=!1;const y=[[e,"pointerdown",r],[e,"pointermove",c],[e,"pointerup",l],[e,"pointercancel",l],[e,"touchstart",f,{passive:!1}],[e,"touchmove",f,{passive:!1}],[e,"touchend",f],[e,"click",u],[e,"wheel",h,{passive:!1}],[e,"dblclick",p],[e,"pointerenter",()=>{_=!0,t.inside(!0)}],[e,"pointerleave",()=>{_=!1,t.inside(!1),t.hover(null)}],[window,"keydown",g=>{g.key==="Escape"&&_&&t.wide()}]];for(const[g,b,S,E]of y)g.addEventListener(b,S,E);return{zoomBy(g){t.take(Xd(t.cam(),g,.575,.5))},dispose(){for(const[g,b,S]of y)g.removeEventListener(b,S);e.style.cursor=""}}}const pl=4;function Yp(e,t,n){const i=e-t/2;return n<=0?i:Math.max(pl,Math.min(i,n-pl-t))}const u5=(e,t)=>e.left<t.left+t.w&&t.left<e.left+e.w&&e.top<t.top+t.h&&t.top<e.top+e.h;function h5(e,t,n){const i=[...e].sort((l,d)=>l.rank-d.rank),s=[...i.filter(l=>l.pill),...i.filter(l=>!l.pill)],a=[],o=new Map;let r=0;const c=l=>n<=0||l.top>=0&&l.top+l.h<=n;for(const l of s){const d=Yp(l.x,l.w,t),f={left:d,top:l.y-l.h,w:l.w,h:l.h};if(l.pill){const _=n<=0?f.top:Math.max(pl,Math.min(f.top,n-pl-l.h));a.push({...f,top:_}),o.set(l.name,{left:d,top:_,lead:!1});continue}const u=_=>({...f,left:Yp(l.x+_,l.w,t)}),p=[f,...[-1,1,-2,2].map(_=>({...f,top:f.top+_*l.h})),u(-l.w/2),u(l.w/2)].find(_=>c(_)&&!a.some(x=>u5(x,_)));if(p===void 0){r++;continue}a.push(p),o.set(l.name,{left:p.left,top:p.top,lead:p.top!==f.top||Math.abs(p.left-f.left)>.5})}return{at:o,left:r}}function p5(e){return e.replaceAll("!","…").replaceAll("?","…").replaceAll("✗","…")}const m5={asks:"?",failed:"✗"};function Zp(e){return e.mode==="egg"?e.words:e.words===""?e.name:`${e.name} · ${e.words}`}function x5(e){const t=document.createElement("div");t.className="bh-overlay",t.setAttribute("aria-hidden","true");const n=document.createElement("div");n.className="bims-zzzs";const i=document.createElement("div");i.className="bh-tags",t.append(n,i),e.append(t);const s=new Map;return{root:t,labels(a){const o=new Set,r=[];for(const{key:l,label:d,head:f,rank:u}of a){o.add(l);let h=s.get(l);const p=`${d.mode}|${d.pill??""}|${Zp(d)}`;if(h===void 0&&(h=document.createElement("div"),h.className="bh-tag",i.append(h),s.set(l,h)),h.dataset.sig!==p){if(h.dataset.sig=p,h.dataset.mode=d.mode,h.replaceChildren(),d.pill!==null){const x=document.createElement("span");x.className=`bh-pill ${d.pill}`,x.textContent=m5[d.pill],h.append(x)}const _=d.mode==="pill"?"":Zp(d);if(_!==""){const x=document.createElement("span");x.className="bh-label",x.textContent=_,h.append(x)}}h.style.visibility=f===null?"hidden":"",f!==null&&r.push({name:l,x:f.x,y:f.y,w:h.offsetWidth,h:h.offsetHeight,pill:d.mode==="pill",rank:u})}for(const[l,d]of s)o.has(l)||(d.remove(),s.delete(l));const{at:c}=h5(r,e.clientWidth,e.clientHeight);for(const l of r){const d=s.get(l.name),f=c.get(l.name);d!==void 0&&(d.style.visibility=f===void 0?"hidden":"",f!==void 0&&(d.style.transform=`translate(${f.left.toFixed(1)}px, ${f.top.toFixed(1)}px)`))}},zzz(a){xz(n,a)},dispose(){t.remove()}}}function g5(e){const t=e%100>=11&&e%100<=13?"th":e%10===1?"st":e%10===2?"nd":e%10===3?"rd":"th";return`${String(e)}${t}`}function _5(e){const t=Math.floor(Math.max(0,e)/6e4);if(t<1)return"now";if(t<60)return`${String(t)} min`;const n=Math.floor(t/60);return n<24?`${String(n)} h`:`${String(Math.floor(n/24))} d`}const Kp=3,v5=3,M5=new Set(["nap","snack","coffee","visit","report"]),Jp=new Set(["main","mainidle"]);function y5(e){const t=e.act.k;return e.from===null?t==="starting":M5.has(t)||Jp.has(t)&&Jp.has(e.from)?!1:t===e.from?t==="landing"&&e.act.rank===1:!0}function b5(e,t){switch(e.k){case"starting":return _t.ev_started;case"work":case"main":return _t.working;case"hot":return _t.ev_running_hot;case"sleep":return _t.waiting;case"waitagent":return _t.ev_waits_on({agent:e.on??""});case"asks":return _t.asks_you;case"landing":return e.rank===1?_t.landing:_t.ev_in_line;case"done":return t==="landing"?_t.ev_landed:_t.done;case"failed":return _t.failed;case"blocked":return _t.blocked;case"stopped":return _t.ev_stopped;case"mainidle":return _t.idle;case"nap":case"snack":case"coffee":case"visit":case"report":return""}}function S5(e,t=""){switch(e.k){case"work":case"main":return _t.working;case"hot":return _t.state_hot;case"sleep":return t?_t.state_waiting_for({what:t}):_t.waiting;case"waitagent":return _t.state_waits_on({agent:e.on??""});case"nap":case"snack":case"mainidle":return _t.idle;case"asks":return e.urgent?_t.state_urgent:_t.asks_you;case"blocked":return _t.blocked;case"failed":return _t.failed;case"landing":return e.rank===1||e.rank==null?_t.landing:_t.state_in_line({nth:g5(e.rank)});case"done":return _t.done;case"stopped":return _t.state_stopped;case"starting":return _t.state_starting;case"coffee":case"visit":case"report":return _t.working}}function w5(e){return{drop_in:_t.trick_drop_in,pump:_t.trick_pump,rock_to_fakie:_t.trick_rock_to_fakie,axle_stall:_t.trick_axle_stall,fs_180:_t.trick_fs_180,bs_180:_t.trick_bs_180,ollie:_t.trick_ollie,kickflip:_t.trick_kickflip,heelflip:_t.trick_heelflip,shove_it:_t.trick_shove_it,tre_flip:_t.trick_tre_flip,fifty:_t.trick_fifty,five_o:_t.trick_five_o,boardslide:_t.trick_boardslide,nosegrind:_t.trick_nosegrind,manual:_t.trick_manual,no_comply:_t.trick_no_comply,carve:_t.trick_carve,fs_air:_t.trick_fs_air,nine:_t.trick_nine}[e]}function E5(e){return e.k==="asks"?"asks":e.k==="failed"?"failed":null}function T5(e,t){const n=e.filter(a=>a.pose.seg.t<=t&&y5(a.pose.seg)).map(a=>({name:a.name,at:a.pose.seg.t})).sort((a,o)=>o.at-a.at||(a.name<o.name?-1:a.name>o.name?1:0)),i=Array.from({length:v5},()=>-1/0),s=new Set;for(const a of n){let o=0;for(let c=1;c<i.length;c++)(i[c]??0)<(i[o]??0)&&(o=c);const r=Math.max(a.at,i[o]??-1/0);i[o]=r+Kp,r<=t&&t<r+Kp&&s.add(a.name)}return s}const A5=(e,t)=>{const n=new Map(t.agents.map(a=>[a.name,a])),i=T5(e,t.t),s=new Map;for(const a of e){const{act:o,from:r}=a.pose.seg,c=E5(o),l=(f,u,h="")=>{s.set(a.name,{name:a.name,mode:f,words:u,title:h,pill:c})},d=t.follow===a.name?H3(a.name,a.pose,t.park):null;if(t.hover===a.name){const f=n.get(a.name),u=a.pose.seg.pastime&&f?_t.state_skating({dur:_5(t.t*1e3-f.since_ms)}):S5(o,f?.watching[0]?.what??"");l("hover",u,f?.title??"")}else i.has(a.name)?l("event",b5(o,r)):d!==null?l("egg",w5(d)):t.eggs?.has(a.name)===!0?l("egg",t.eggs.get(a.name)??""):t.held||a.pose.moving&&!a.main?l("name",""):c&&l("pill","")}return s},Qs=18e8;function ii(e){const t=(e-Qs)%ks;return t<0?t+ks:t}const ml=e=>Math.floor((e-Qs)/ks);function f0(e,t){let n=null;for(const[i,s]of e.life)i<=t&&(n=s);return n??e.life[e.life.length-1]?.[1]??{k:"gone"}}function zg(e){return{jobs_done:ko[e.stage]??0,days_used:qd[Math.min(qd.length-1,Math.floor(e.stage/2))]??0,artifacts_made:e.stage*12}}const $d=Qs*1e3;function z5(e,t){const n={name:e.name,main:e.main===!0,status:"idle",phase:null,archived:!1,title:"",purpose:"",since_ms:$d,waits:0,dir:e.name,watching:[],waiting_on:null,turn_ms:null,place_id:e.main===!0?"":`wt:${e.name}`},i=s=>({...n,...s});switch(t.k){case"work":return i({status:"working",...t.doing?{doing:{kind:t.doing,since_ms:$d}}:{}});case"main":return i({status:"working"});case"sleep":return i({status:"waiting",watching:[{id:1,kind:"bg",what:"bench",since_ms:$d,resumes:!0}]});case"asks":return i({status:"waiting",waits:1,waiting_on:{who:"you"}});case"failed":return i({status:"failed"});case"wait":return i({status:"waiting",waiting_on:{who:"agent",name:t.on}});case"done":return i({status:"done"});default:return n}}function Rg(e,t){const n=[],i=[],s=[];for(const a of e.bims){const o=f0(a,t),r=z5(a,o);i.push(r),o.k!=="gone"&&(n.push(r),o.k==="landing"&&s.push({id:`wt:${a.name}`,branch:`sb/${a.name}`,agents:[a.name],landing:o.rank}))}return{snap:{agents:n,cards:[],places:s},agents:i}}function R5(e,t){return e.bims.map(n=>`${n.name}:${JSON.stringify(f0(n,t))}`).join("|")}function C5(e,t){const n=new Map(e.bims.map(i=>[i.name,i]));return(i,s)=>{const a=new Map(T3(i,s));for(const[o,r]of a){if(r.k!=="nap"&&r.k!=="snack")continue;const c=n.get(o);if(!c)continue;const l=f0(c,t(s)),d=l.k==="snack"?{k:"snack",at:"island",key:l.trip,fruit:l.fruit}:{k:"nap",at:"lounge"};a.set(o,d)}return a}}function Cg(e,t){const n={};for(const i of Yz)i.office!==e||t<i.at||t>=i.at+i.dur||(n[i.bim]={kind:i.kind,since:t-i.at});return{bims:n}}function P5(e,t,n){const i=[];if(n<=t)return i;for(let s=ml(t);s<=ml(n);s++)for(const a of Eg){if(a.office!==e)continue;const o=Qs+s*ks+a.at;o<=t||o>n||i.push({kind:"message",from:a.from==="you"?{who:"you"}:{who:"agent",name:a.from},to:{who:"agent",name:a.to},mode:"queued",expectsReply:!1,t:o})}return i}function L5(e){const t=Vo.find(i=>i.id===e),n=new Set;for(const i of t?.bims??[])for(const[s]of i.life)n.add(s);for(const i of Eg)i.office===e&&n.add(i.at);return[...n].sort((i,s)=>i-s)}const I5=1;function D5(e,t,n){if(n<=t)return[];const i=new Set,s=L5(e);for(let a=ml(t);a<=ml(n);a++){const o=Qs+a*ks;for(const r of s){const c=o+r;c>t&&c<=n&&i.add(c)}for(let r=0;r<ks;r+=I5){const c=o+r;c>t&&c<=n&&i.add(c)}}return[...i].sort((a,o)=>a-o)}const N5=201,U5=Qs-N5,O5=Mz(new Date(2026,9,14,11,0,0));function u0(e,t,n,i){return{t,local:O5,night:n,reduced:i,forced:i?{bims:{}}:Cg(e,ii(t))}}function Pg(e,t,n=!1){const i=R5(e.cast,ii(t));if(i===e.sig&&!n)return;e.sig=i;const{snap:s,agents:a}=Rg(e.cast,ii(t));e.driver.rows(s,a,e.cast.map)}function F5(e,t){const n=qz({activities:C5(e,ii),layoutOf:gg,newTimeline:Fz,labelsOf:A5}),i={cast:e,driver:n,sig:"",at:t};return Pg(i,t),n.grow(im(zg(e)),t),n.step(u0(e.id,t,!1,!1),Va),i}const B5=(e=U5)=>Vo.map(t=>F5(t,e));function Qp(e,t,n,i){if(t<=e.at)return;const s=P5(e.cast.id,e.at,t);for(const a of D5(e.cast.id,e.at,t)){Pg(e,a,!0);for(const o of s)o.t===a&&e.driver.event(o);e.driver.step(u0(e.cast.id,a,n,i),Va)}e.at=t}const G5=(e,t,n,i=Va)=>e.driver.step(u0(e.cast.id,e.at,t,n),i),H5={light:"#f2ede2",dark:"#171513"},V5=1e3/30,W5=1.25,k5=8,jp={x0:.3,x1:.85},X5=2,tm=.9,$5=2.6;function q5(e,t={}){let n=t.theme==="dark";const i=()=>n,s=t.reduced===!0,a=t.on??(()=>{}),o=t.ground??H5,r=document.createElement("canvas");r.className="bh-canvas",e.append(r);const c=kT(r,{allLive:!0,box:!0,sky:{day:o.light,night:o.dark},nightLift:W5}),l=x5(e),d=Vo.map(q=>({id:q.id,office:gg(Rg(q,0).agents,q.map),grow:im(zg(q))}));c.setTown(d);const f=B5();let u=Qs+Math.max(0,t.startT??0);for(const q of f)Qp(q,u,i(),s);const h=t.probe===!0?{frames:0,ms:[],T:0,hands:"film",shot:0,cam:{zoom:1,u:.5,v:.5},phases:[],offices:[]}:null;h&&(window.__bimsHero=h);const p=new Map,_=()=>c.townFit(),x=(q,et,X,lt)=>{const gt=Zi(q,{x:et,y:X,z:lt});return{u:gt.x/q.widthPx,v:gt.y/q.heightPx}},m=q=>{const et=_(),X=c.placedOf(q),lt=p.get(q)?.office;if(!et||!X||!lt)return null;const gt=gl(lt),ft=[gt.x0,gt.x1].flatMap(wt=>[gt.z0,gt.z1].flatMap(G=>[0,$5].map(Rt=>x(et,X.x+wt,Rt,X.z+G))));return{u0:Math.min(...ft.map(wt=>wt.u)),u1:Math.max(...ft.map(wt=>wt.u)),v0:Math.min(...ft.map(wt=>wt.v)),v1:Math.max(...ft.map(wt=>wt.v))}},v=q=>{const et=_(),X=c.placedOf(q),lt=p.get(q)?.office.park;if(!et||!X||!lt||lt.spots.length===0)return null;const gt=lt.spots.map(wt=>x(et,X.x+wt.x,0,X.z+wt.z)),ft=.01;return{u0:Math.min(...gt.map(wt=>wt.u))-ft,u1:Math.max(...gt.map(wt=>wt.u))+ft,v0:Math.min(...gt.map(wt=>wt.v))-ft,v1:Math.max(...gt.map(wt=>wt.v))+ft}},y={town(){const q=Vo.flatMap(et=>[m(et.id),v(et.id)]).filter(et=>et!==null);return q.length===0?null:{u0:Math.min(...q.map(et=>et.u0)),u1:Math.max(...q.map(et=>et.u1)),v0:Math.min(...q.map(et=>et.v0)),v1:Math.max(...q.map(et=>et.v1))}},office:m,spot(q,et){const X=_(),lt=c.placedOf(q),gt=p.get(q)?.office;if(!X||!lt||!gt)return null;const ft=et==="island"?gt.islandSpots:et==="lounge"?gt.lounge:et==="park"?gt.park?.spots??[]:[gt.mainDesk];if(ft.length===0)return null;const wt=ft.reduce((Rt,Dt)=>Rt+Dt.x,0)/ft.length,G=ft.reduce((Rt,Dt)=>Rt+Dt.z,0)/ft.length;return x(X,lt.x+wt,tm,lt.z+G)},bim(q,et){const X=_(),lt=c.placedOf(q),gt=p.get(q)?.frames.find(ft=>ft.name===et);return!X||!lt||!gt?null:x(X,lt.x+gt.pose.x,tm,lt.z+gt.pose.z)}},g=q=>{if(q===null)return null;const et=m(q);return et?hu(et,Tg).zoom:null};let b=s?{k:"visitor",last:1/0,follow:null}:{k:"film"},S=-1,E=null,M=go({zoom:1,u:.5,v:.5}),T=null,z=!1,R=-1/0;const D=()=>performance.now()/1e3,O=q=>{const et=b.k;b=q,et!==q.k&&(e.dataset.hands=q.k,a(q.k==="film"?"film":"control"))},C=()=>{const q=Hn[0];return q?bc(q,y):null};function F(q){const et=ii(u),X=Sc(Hn,et),lt=Hn[X];if(!lt)return;if(X!==S){const ft=S>=0?Hn[S]??null:null,wt=s5(ft,lt),G=wt.across?Math.min(g(hl(ft?.subject??{k:"town"}))??1,g(hl(lt.subject))??1):null;S>=0&&(E={from:M.cam,start:u,dur:wt.dur,rise:G,to:null}),S=X}const gt=bc(lt,y)??M.cam;W(gt,q)}function W(q,et){if(E!==null){const X=s?1:(u-E.start)/E.dur,lt=E.to?.()??q;M=go(o5(E.from,lt,Math.min(1,X),E.rise)),X>=1&&(E=null);return}M=s?go(q):r5(M,q,et)}function U(q,et){if(b.k!=="visitor")return;if(!s&&c5(b,et,z)){B();return}const X=b.follow;if(X!==null){const lt=y.bim(X.office,X.name);lt!==null&&W(pu(lt,M.cam.zoom,.5,.5),q);return}E!==null&&W(M.cam,q)}function B(){O({k:"film"});const q=Hn[Sc(Hn,ii(u))];S=Sc(Hn,ii(u)),E=q?{from:M.cam,start:u,dur:$p,rise:null,to:()=>bc(q,y)}:null,Q()}const P=f5(e,{cam:()=>M.cam,take(q,et){E=null,M=go(ss(q)),R=D(),O({k:"visitor",last:D(),follow:et??null}),Q()},pick:(q,et)=>c.pickBim(q,et),hover(q){const et=q?.id===T?.id&&q?.name===T?.name;T=q,b.k==="visitor"&&q!==null&&O({...b,last:D()}),et||Q()},inside(q){z=q,b.k==="visitor"&&O({...b,last:D()})},follow(q){R=D(),O({k:"visitor",last:D(),follow:q}),Q()},wide(){const q=C();q!==null&&(E={from:M.cam,start:u,dur:s?0:$p,rise:null,to:null},O({k:"visitor",last:D(),follow:null}),E.to=()=>q,Q())}});let H=0,k=0,L=!1,V=0,at=!1;const j=()=>!at&&L&&!document.hidden;function pt(q){if(H=0,!j())return;const et=performance.now(),X=k===0?0:Math.min(.1,Math.max(0,(q-k)/1e3));k=q,s||(u+=X);const lt=i();for(const Rt of f){Qp(Rt,u,lt,s);const Dt=G5(Rt,lt,s,Ot(Rt));Dt&&p.set(Rt.cast.id,Dt)}if(b.k==="film"?F(X):U(X,D()),h?.frames===0||c.shownFit()===null){const Rt=Hn[Sc(Hn,ii(u))],Dt=b.k==="film"&&Rt!==void 0?bc(Rt,y):C();Dt&&(M=go(Dt))}c.setCam(M.cam);const gt=performance.now();for(const Rt of c.liveIds()){const Dt=p.get(Rt);Dt&&c.live(Rt,Dt,u)}const ft=performance.now();c.frame(lt);const wt=performance.now();Gt();const G=performance.now();if(e.dataset.ready!=="true"&&++V>=k5&&(e.dataset.ready="true",a("ready")),h){h.frames++,h.ms=[...h.ms.slice(-299),performance.now()-et],h.phases=[...h.phases.slice(-299),{brain:gt-et,pose:ft-gt,draw:wt-ft,words:G-wt}],h.T=ii(u),h.hands=b.k,h.shot=S,h.cam=M.cam;const Rt=new Set(c.liveIds());h.offices=Vo.map(Dt=>({id:Dt.id,live:Rt.has(Dt.id),bims:(p.get(Dt.id)?.played??[]).map(I=>({name:I.name,k:I.pose.seg.act.k,x:I.pose.x,z:I.pose.z,head:c.headOf(Dt.id,I.name)!==null}))}))}(!s||E!==null)&&J()}function J(){if(E!==null||D()-R<1){H=requestAnimationFrame(pt);return}const et=k,X=lt=>{if(H=0,!!j()){if(lt-et<V5-2&&E===null&&D()-R>=1){H=requestAnimationFrame(X);return}pt(lt)}};H=requestAnimationFrame(X)}function Q(){H!==0||!j()||(H=requestAnimationFrame(pt))}function dt(){if(T!==null)return T;if(b.k==="visitor")return b.follow?{id:b.follow.office,name:b.follow.name}:null;const q=Hn[S];return!q||q.subject.k!=="bim"||q.size!=="follow"&&q.size!=="close"&&q.size!=="closest"?null:{id:q.subject.office,name:q.subject.name}}function Ot(q){const et=dt();return et===null||et.id!==q.cast.id?Va:{...Va,hover:T?.id===q.cast.id?T.name:null,follow:et.name}}function mt(){const q=new Set,et=dt();et!==null&&q.add(`${et.id}\0${et.name}`);const X=b.k==="film"?Hn[S]:void 0;if(X?.subject.k==="pair")for(const lt of X.subject.names)q.add(`${X.subject.office}\0${lt}`);return q}function Gt(){const q=dt(),et=mt(),X=Math.max(1,e.clientWidth),lt=$=>$!==null&&$.x/X>=jp.x0&&$.x/X<=jp.x1,gt=!(b.k==="film"&&E!==null),ft=[],wt=new Map,G=[],Rt=[],Dt=ii(u);for(const $ of c.liveIds()){const tt=p.get($);if(!tt)continue;const ot=Cg($,Dt).bims??{};for(const Mt of tt.labels.values()){const yt=`${$}\0${Mt.name}`,rt=c.headOf($,Mt.name);if(Mt.mode==="egg"){const ut={...Mt,words:p5(Mt.words)},Et=ot[Mt.name]?.since??1/0;et.has(yt)?lt(rt)&&G.push({key:yt,label:ut,head:rt,rank:0}):Et<X5&&Rt.push({key:yt,label:ut,head:rt,since:Et,near:q?.id===$?0:1});continue}(Mt.mode==="pill"||Mt.pill!==null)&&ft.push({key:yt,label:{...Mt,mode:"pill",words:""},head:rt,rank:2})}if(!s)for(const Mt of mz(tt.frames)){const yt=c.headOf($,Mt);yt&&wt.set(`${$}/${Mt}`,yt)}}if(q!==null&&gt){const $=`${q.id}\0${q.name}`,tt=c.headOf(q.id,q.name);if(!G.some(ot=>ot.key===$)&&lt(tt)&&p.get(q.id)?.frames.some(ot=>ot.name===q.name)===!0){const ot=ft.find(Mt=>Mt.key===$)?.label.pill??null;G.push({key:$,label:{name:q.name,mode:"name",words:"",title:"",pill:ot},head:tt,rank:0})}}const I=G.length>0?void 0:Rt.filter($=>$.head!==null).sort(($,tt)=>$.near-tt.near||$.since-tt.since)[0];I!==void 0&&G.push({key:I.key,label:I.label,head:I.head,rank:1});const w=new Set(G.map($=>$.key));l.labels([...ft.filter($=>!w.has($.key)),...G]),l.zzz(wt)}const Qt=new ResizeObserver(()=>{const q=e.clientWidth,et=e.clientHeight;q<=0||et<=0||(c.setSize(q,et),Q())});Qt.observe(e);const ct=new IntersectionObserver(q=>{L=q.some(et=>et.isIntersecting),k=0,Q()});ct.observe(e);const xt=()=>{k=0,Q()};return document.addEventListener("visibilitychange",xt),c.onLost(()=>{e.dataset.lost="true",a("lost")}),{setTheme(q){n=q==="dark",e.dataset.theme=q,Q()},resumeFilm(){s||B()},zoomBy(q){P.zoomBy(q)},dispose(){at=!0,H!==0&&cancelAnimationFrame(H),Qt.disconnect(),ct.disconnect(),document.removeEventListener("visibilitychange",xt),P.dispose(),l.dispose(),c.dispose(),r.remove(),h&&delete window.__bimsHero}}}export{q5 as playFilm};
