const gt={ev_started:"started",working:"working",ev_running_hot:"running hot",waiting:"waiting",ev_waits_on:e=>"waits on "+String(e.agent),asks_you:"asks you",landing:"landing",ev_in_line:"waits to land",ev_landed:"landed",done:"done",failed:"failed",blocked:"blocked",ev_stopped:"stopped",idle:"idle",state_hot:"working · running hot",state_waiting_for:e=>"waiting · for "+String(e.what),state_waits_on:e=>"waiting on "+String(e.agent),state_urgent:"asks you · a tool waits for your yes",state_in_line:e=>"waits to land · "+String(e.nth),state_stopped:"stopped by you",state_starting:"starting",pill_asks_tip:e=>String(e.agent)+" asks you. click opens it",pill_failed_tip:e=>String(e.agent)+" failed. click opens it",view_bims_tip:"the agents in their office, above the list",cube_open_tip:"show the bims: your agents in their office",cube_close_tip:"hide the office",cube_label:"the bims",width_narrow:"320",width_wide:"wide",width_narrow_tip:"the bar at 320 px, the office fit to it",width_wide_tip:"the bar at 640 px while the office shows",lost:"can't draw the office here",fit:"fit",fit_tip:"back to the whole office",held_left_out:e=>e.n===1?"+"+String(e.n)+" name · hover a bim":"+"+String(e.n)+" names · hover a bim",stage_1:"a plant and a deck chair",stage_2:"the kitchen island",stage_3:"the lounge",stage_4:"the whiteboard",stage_5:"the mural and the boombox",stage_6:"a longer island",stage_7:"the terrace",stage_8:"trees all round",stage_9:"the skate ramp",stage_10:"the fountain",stage_11:"the arcade cabinet",stage_12:"the pond",stage_13:"the balloon",stage_14:"main's golden statue",stage_fruit:"a fruit bowl and a tree",stage_more_fruit:"more fruit and flowers",stage_kyoto_1:"a bonsai",stage_kyoto_2:"a bento and a maple",stage_kyoto_3:"the zabuton",stage_kyoto_4:"the slate",stage_kyoto_5:"the wave and the wind bell",stage_kyoto_6:"the matcha set",stage_kyoto_7:"the paper umbrella",stage_kyoto_8:"maples all round",stage_kyoto_9:"the go board",stage_kyoto_10:"the shishi-odoshi",stage_kyoto_11:"the arcade cabinet",stage_kyoto_12:"the koi pond",stage_kyoto_13:"the koinobori",stage_kyoto_14:"the golden maneki-neko",stage_riad_1:"a pot of mint",stage_riad_2:"the tea tray",stage_riad_3:"the poufs",stage_riad_4:"the slate",stage_riad_5:"the Berber rug and the darbouka",stage_riad_6:"a tajine and jasmine",stage_riad_7:"the awning",stage_riad_8:"the four orange trees",stage_riad_9:"the draughts table",stage_riad_10:"the fountain's second tier",stage_riad_11:"the hammam",stage_riad_12:"the zellige basin",stage_riad_13:"the balloon over the Atlas",stage_riad_14:"the golden lantern",stage_nordic_1:"a fern",stage_nordic_2:"kanelbullar and a birch",stage_nordic_3:"the sheepskins",stage_nordic_4:"the blackboard",stage_nordic_5:"the rya and the record player",stage_nordic_6:"blueberries and coffee",stage_nordic_7:"the campfire",stage_nordic_8:"firs all round",stage_nordic_9:"the kubb set",stage_nordic_10:"the hot tub",stage_nordic_11:"the sauna's porch",stage_nordic_12:"the lake and its jetty",stage_nordic_13:"the midsummer pole",stage_nordic_14:"the golden Dala horse",grow_new:e=>"new: "+String(e.thing),grow_tip:e=>e.n===1?"level "+String(e.level)+" · "+String(e.n)+" job done · next: "+String(e.thing)+" at "+String(e.at):"level "+String(e.level)+" · "+String(e.n)+" jobs done · next: "+String(e.thing)+" at "+String(e.at),grow_tip_top:e=>e.n===1?"level "+String(e.level)+" · "+String(e.n)+" job done":"level "+String(e.level)+" · "+String(e.n)+" jobs done",map_loft:"Loft",map_loft_mood:"the kitchen island in the middle, bean bags at the back",map_greenhouse:"Greenhouse",map_greenhouse_mood:"desks in a ring round a tree, glass walls",map_campus:"Campus",map_campus_mood:"pods of four, a long counter, steps to sit on",map_workshop:"Workshop",map_workshop_mood:"a garage: a workbench, ping-pong, the door rolled up",map_kyoto:"Kyoto",map_kyoto_mood:"low tables on tatami round a small garden",map_riad:"Riad",map_riad_mood:"galleries round a patio and its fountain",map_nordic:"Nordic",map_nordic_mood:"one long wooden table, a stove, a sauna outside",map_patio:"Patio",map_patio_mood:"coloured walls round a patio, hammocks for naps",map_haveli:"Haveli",map_haveli_mood:"a courtyard with arcades, a chai stall, a swing",map_tropical:"Tropical",map_tropical_mood:"desks on a curve, a juice bar, hammocks",map_cyclades:"Cyclades",map_cyclades_mood:"little white cubes up steps, blue tables",map_sahel:"Sahel",map_sahel_mood:"a shade hangar round a yard and its baobab",map_california:"California",map_california_mood:"a stucco office and a concrete skatepark",map_pick_tip:e=>"draw this project's office as the "+String(e.map),map_current_tip:e=>"this project's office is the "+String(e.map)+" now",town_label:"the town: one office per project",town_sign_tip:e=>"look inside "+String(e.project),town_sign_label:e=>String(e.project)+": "+String(e.at_work)+" working, "+String(e.asks)+" asking you",town_open:"open",town_open_tip:e=>"open "+String(e.project),town_back:"town",town_back_tip:"back to the whole town",state_skating:e=>"idle "+String(e.dur)+" · skating",trick_drop_in:"drop in",trick_pump:"pumps",trick_rock_to_fakie:"rock to fakie",trick_axle_stall:"axle stall",trick_fs_180:"frontside 180",trick_bs_180:"backside 180",trick_ollie:"ollie",trick_kickflip:"kickflip",trick_heelflip:"heelflip",trick_shove_it:"pop shove-it",trick_tre_flip:"360 flip",trick_fifty:"50-50",trick_five_o:"5-0",trick_boardslide:"boardslide",trick_nosegrind:"nosegrind",trick_manual:"manual",trick_no_comply:"no comply",trick_carve:"carve",trick_fs_air:"frontside air",trick_nine:"900"},Jo=[0,1,3,6,10,15,25,40,60,100,150,250,400,600,1e3];Jo.length-1;const jd=[1,3,7,14,30,60,100,365],Qg=10,jg=30,t1=500,L0=[0,0,0,2,2,4,4,4,8];function yl(e){return L0[Math.max(0,Math.min(e,L0.length-1))]??0}const e1=.7,Rc=3,hm=3,cs={stage:0,garden:0,frames:0,golden:!1,building:!1,jobs:0};function pm(e,t){let n=0;for(const i of t)e>=i&&n++;return n}function n1(e){return Math.max(0,pm(e,Jo)-1)}function mm(e){if(!e)return cs;const t=e.jobs_done,n=e.artifacts_made,i=n1(t),s=Jo[i+1],a=Jo[i],o=s!==void 0&&a!==void 0&&t>=a+e1*(s-a);return{stage:i,garden:pm(e.days_used,jd),frames:Math.min(jg,Math.floor(n/Qg)),golden:n>=t1,building:o,jobs:t}}function i1(e,t){return!e||t.stage<=e.stage?null:t.stage}const I0=[0,.15,.3,.45,.6,.8,1,1.2,1.4],s1=1.7,Nr=1.5;function a1(e){return(I0[Math.min(e.garden,I0.length-1)]??0)+(e.stage>=10?s1:0)}function No(e){return`${e.stage}/${e.garden}/${e.frames}/${e.golden?1:0}/${e.building?1:0}`}const Ga=Math.PI/4,Rs=Math.PI/6,Ur=60,D0=.25;function bl(e){return{x0:e.x0-1.2,x1:e.x0+e.W+1.2,z0:-1.5,z1:e.D+4.8,yLow:-1.35,yHigh:2.5}}function xm(e,t){const n=bl(e),i=a1(t);return{x0:n.x0-i,x1:n.x1+i,z0:n.z0-i/2,z1:n.z1+i/2,yLow:n.yLow,yHigh:t.stage>=13?3:n.yHigh}}function o1(e){const t=bl(e);return{...t,x0:t.x0-Nr,x1:t.x1+Nr,z0:t.z0-Nr/2,z1:t.z1+Nr/2}}const Ln={x:Math.cos(Ga),y:0,z:-Math.sin(Ga)},Pa={x:-Math.sin(Ga)*Math.sin(Rs),y:Math.cos(Rs),z:-Math.cos(Ga)*Math.sin(Rs)},La={x:Math.sin(Ga)*Math.cos(Rs),y:Math.sin(Rs),z:Math.cos(Ga)*Math.cos(Rs)},Qo=(e,t)=>e.x*t.x+e.y*t.y+e.z*t.z;function wu(e,t,n){const i={x:(e.x0+e.x1)/2,y:0,z:(e.z0+e.z1)/2};let s=1/0,a=-1/0,o=1/0,r=-1/0;for(const p of[e.x0,e.x1])for(const v of[e.yLow,e.yHigh])for(const y of[e.z0,e.z1]){const g={x:p-i.x,y:v-i.y,z:y-i.z},b=Qo(g,Ln),w=Qo(g,Pa);s=Math.min(s,b),a=Math.max(a,b),o=Math.min(o,w),r=Math.max(r,w)}const c=Math.max(1,t),l=a-s+2*D0,d=r-o+2*D0;let f=l/c,u=Math.ceil(d/f);n>0&&u>n&&(u=Math.floor(n),f=d/u);const h=(s+a)/2,m=(o+r)/2,_=c*f/2,x=u*f/2;return{target:i,left:h-_,right:h+_,top:m+x,bottom:m-x,scale:f,widthPx:c,heightPx:u}}function r1(e,t,n){const i=Math.max(1,t),s=Math.max(1,n),a=wu(e,i,s),o=(a.left+a.right)/2,r=(a.top+a.bottom)/2;return{...a,left:o-i*a.scale/2,right:o+i*a.scale/2,top:r+s*a.scale/2,bottom:r-s*a.scale/2,widthPx:i,heightPx:s}}function c1(e,t){const n=e.right-e.left,i=e.top-e.bottom,s=e.left+t.u*n,a=e.top-t.v*i,o=n/(2*t.zoom),r=i/(2*t.zoom);return{...e,left:s-o,right:s+o,top:a+r,bottom:a-r,scale:e.scale/t.zoom}}function ts(e,t){const n={x:t.x-e.target.x,y:t.y-e.target.y,z:t.z-e.target.z};return{x:(Qo(n,Ln)-e.left)/e.scale,y:(e.top-Qo(n,Pa))/e.scale}}function l1(e,t,n=.6){const i={x:t.x-e.target.x,y:-e.target.y,z:t.z-e.target.z},s=Qo(i,Pa);return Math.max(2,(e.top-s)/Math.cos(Rs)+n)}const Eu="186",d1=0,N0=1,f1=2,Uo=1,u1=2,Eo=3,Ds=0,hn=1,zi=2,Ui=0,Oo=1,U0=2,O0=3,F0=4,h1=5,ba=100,p1=101,m1=102,x1=103,g1=104,_1=200,v1=201,M1=202,y1=203,gm=204,_m=205,b1=206,S1=207,w1=208,E1=209,T1=210,A1=211,z1=212,R1=213,C1=214,tf=0,ef=1,nf=2,jo=3,sf=4,af=5,of=6,rf=7,Tu=0,P1=1,L1=2,li=0,vm=1,Mm=2,ym=3,bm=4,Sm=5,wm=6,Em=7,Tm=300,Ns=301,Ha=302,Xl=303,$l=304,Sl=306,tr=1e3,Ri=1001,cf=1002,Xe=1003,I1=1004,Or=1005,$e=1006,ql=1007,bs=1008,wn=1009,Am=1010,zm=1011,er=1012,Au=1013,fi=1014,oi=1015,ui=1016,zu=1017,Ru=1018,nr=1020,Rm=35902,Cm=35899,Pm=1021,Lm=1022,Zn=1023,Bi=1026,Ss=1027,Im=1028,Cu=1029,Us=1030,Pu=1031,Lu=1033,Cc=33776,Pc=33777,Lc=33778,Ic=33779,lf=35840,df=35841,ff=35842,uf=35843,hf=36196,pf=37492,mf=37496,xf=37488,gf=37489,Wc=37490,_f=37491,vf=37808,Mf=37809,yf=37810,bf=37811,Sf=37812,wf=37813,Ef=37814,Tf=37815,Af=37816,zf=37817,Rf=37818,Cf=37819,Pf=37820,Lf=37821,If=36492,Df=36494,Nf=36495,Uf=36283,Of=36284,Xc=36285,Ff=36286,D1=3200,$c=0,N1=1,as="",fn="srgb",qc="srgb-linear",Yc="linear",me="srgb",Yl=7680,U1=519,O1=512,F1=513,B1=514,Iu=515,G1=516,H1=517,Du=518,V1=519,k1=35044,B0="300 es",ri=2e3,ir=2001;function W1(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function Zc(e){return document.createElementNS("http://www.w3.org/1999/xhtml",e)}function X1(){const e=Zc("canvas");return e.style.display="block",e}const G0={};function H0(...e){const t="THREE."+e.shift();console.log(t,...e)}function Dm(e){const t=e[0];if(typeof t=="string"&&t.startsWith("TSL:")){const n=e[1];n&&n.isStackTrace?e[0]+=" "+n.getLocation():e[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return e}function Qt(...e){e=Dm(e);const t="THREE."+e.shift();{const n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function ce(...e){e=Dm(e);const t="THREE."+e.shift();{const n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function Ia(...e){const t=e.join(" ");t in G0||(G0[t]=!0,Qt(...e))}function $1(e,t,n){return new Promise(function(i,s){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:s();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:i()}}setTimeout(a,n)})}const q1={[tf]:ef,[nf]:of,[sf]:rf,[jo]:af,[ef]:tf,[of]:nf,[rf]:sf,[af]:jo};class Ys{addEventListener(t,n){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(n)===-1&&i[t].push(n)}hasEventListener(t,n){const i=this._listeners;return i===void 0?!1:i[t]!==void 0&&i[t].indexOf(n)!==-1}removeEventListener(t,n){const i=this._listeners;if(i===void 0)return;const s=i[t];if(s!==void 0){const a=s.indexOf(n);a!==-1&&s.splice(a,1)}}dispatchEvent(t){const n=this._listeners;if(n===void 0)return;const i=n[t.type];if(i!==void 0){t.target=this;const s=i.slice(0);for(let a=0,o=s.length;a<o;a++)s[a].call(this,t);t.target=null}}}const Ze=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Zl=Math.PI/180,Bf=180/Math.PI;function qa(){const e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Ze[e&255]+Ze[e>>8&255]+Ze[e>>16&255]+Ze[e>>24&255]+"-"+Ze[t&255]+Ze[t>>8&255]+"-"+Ze[t>>16&15|64]+Ze[t>>24&255]+"-"+Ze[n&63|128]+Ze[n>>8&255]+"-"+Ze[n>>16&255]+Ze[n>>24&255]+Ze[i&255]+Ze[i>>8&255]+Ze[i>>16&255]+Ze[i>>24&255]).toLowerCase()}function ae(e,t,n){return Math.max(t,Math.min(n,e))}function Y1(e,t){return(e%t+t)%t}function Kl(e,t,n){return(1-n)*e+n*t}function ro(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:case Uint8ClampedArray:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function dn(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}class Ct{static{Ct.prototype.isVector2=!0}constructor(t=0,n=0){this.x=t,this.y=n}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,n){return this.x=t,this.y=n,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const n=this.x,i=this.y,s=t.elements;return this.x=s[0]*n+s[3]*i+s[6],this.y=s[1]*n+s[4]*i+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,n){return this.x=ae(this.x,t.x,n.x),this.y=ae(this.y,t.y,n.y),this}clampScalar(t,n){return this.x=ae(this.x,t,n),this.y=ae(this.y,t,n),this}clampLength(t,n){const i=this.length();return this.divideScalar(i||1).multiplyScalar(ae(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const n=Math.sqrt(this.lengthSq()*t.lengthSq());if(n===0)return Math.PI/2;const i=this.dot(t)/n;return Math.acos(ae(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const n=this.x-t.x,i=this.y-t.y;return n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this}rotateAround(t,n){const i=Math.cos(n),s=Math.sin(n),a=this.x-t.x,o=this.y-t.y;return this.x=a*i-o*s+t.x,this.y=a*s+o*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Ya{constructor(t=0,n=0,i=0,s=1){this.isQuaternion=!0,this._x=t,this._y=n,this._z=i,this._w=s}static slerpFlat(t,n,i,s,a,o,r){let c=i[s+0],l=i[s+1],d=i[s+2],f=i[s+3],u=a[o+0],h=a[o+1],m=a[o+2],_=a[o+3];if(f!==_||c!==u||l!==h||d!==m){let x=c*u+l*h+d*m+f*_;x<0&&(u=-u,h=-h,m=-m,_=-_,x=-x);let p=1-r;if(x<.9995){const v=Math.acos(x),y=Math.sin(v);p=Math.sin(p*v)/y,r=Math.sin(r*v)/y,c=c*p+u*r,l=l*p+h*r,d=d*p+m*r,f=f*p+_*r}else{c=c*p+u*r,l=l*p+h*r,d=d*p+m*r,f=f*p+_*r;const v=1/Math.sqrt(c*c+l*l+d*d+f*f);c*=v,l*=v,d*=v,f*=v}}t[n]=c,t[n+1]=l,t[n+2]=d,t[n+3]=f}static multiplyQuaternionsFlat(t,n,i,s,a,o){const r=i[s],c=i[s+1],l=i[s+2],d=i[s+3],f=a[o],u=a[o+1],h=a[o+2],m=a[o+3];return t[n]=r*m+d*f+c*h-l*u,t[n+1]=c*m+d*u+l*f-r*h,t[n+2]=l*m+d*h+r*u-c*f,t[n+3]=d*m-r*f-c*u-l*h,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,n,i,s){return this._x=t,this._y=n,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,n=!0){const i=t._x,s=t._y,a=t._z,o=t._order,r=Math.cos,c=Math.sin,l=r(i/2),d=r(s/2),f=r(a/2),u=c(i/2),h=c(s/2),m=c(a/2);switch(o){case"XYZ":this._x=u*d*f+l*h*m,this._y=l*h*f-u*d*m,this._z=l*d*m+u*h*f,this._w=l*d*f-u*h*m;break;case"YXZ":this._x=u*d*f+l*h*m,this._y=l*h*f-u*d*m,this._z=l*d*m-u*h*f,this._w=l*d*f+u*h*m;break;case"ZXY":this._x=u*d*f-l*h*m,this._y=l*h*f+u*d*m,this._z=l*d*m+u*h*f,this._w=l*d*f-u*h*m;break;case"ZYX":this._x=u*d*f-l*h*m,this._y=l*h*f+u*d*m,this._z=l*d*m-u*h*f,this._w=l*d*f+u*h*m;break;case"YZX":this._x=u*d*f+l*h*m,this._y=l*h*f+u*d*m,this._z=l*d*m-u*h*f,this._w=l*d*f-u*h*m;break;case"XZY":this._x=u*d*f-l*h*m,this._y=l*h*f-u*d*m,this._z=l*d*m+u*h*f,this._w=l*d*f+u*h*m;break;default:Qt("Quaternion: .setFromEuler() encountered an unknown order: "+o)}return n===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,n){const i=n/2,s=Math.sin(i);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){const n=t.elements,i=n[0],s=n[4],a=n[8],o=n[1],r=n[5],c=n[9],l=n[2],d=n[6],f=n[10],u=i+r+f;if(u>0){const h=.5/Math.sqrt(u+1);this._w=.25/h,this._x=(d-c)*h,this._y=(a-l)*h,this._z=(o-s)*h}else if(i>r&&i>f){const h=2*Math.sqrt(1+i-r-f);this._w=(d-c)/h,this._x=.25*h,this._y=(s+o)/h,this._z=(a+l)/h}else if(r>f){const h=2*Math.sqrt(1+r-i-f);this._w=(a-l)/h,this._x=(s+o)/h,this._y=.25*h,this._z=(c+d)/h}else{const h=2*Math.sqrt(1+f-i-r);this._w=(o-s)/h,this._x=(a+l)/h,this._y=(c+d)/h,this._z=.25*h}return this._onChangeCallback(),this}setFromUnitVectors(t,n){let i=t.dot(n)+1;return i<1e-8?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*n.z-t.z*n.y,this._y=t.z*n.x-t.x*n.z,this._z=t.x*n.y-t.y*n.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(ae(this.dot(t),-1,1)))}rotateTowards(t,n){const i=this.angleTo(t);if(i===0)return this;const s=Math.min(1,n/i);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,n){const i=t._x,s=t._y,a=t._z,o=t._w,r=n._x,c=n._y,l=n._z,d=n._w;return this._x=i*d+o*r+s*l-a*c,this._y=s*d+o*c+a*r-i*l,this._z=a*d+o*l+i*c-s*r,this._w=o*d-i*r-s*c-a*l,this._onChangeCallback(),this}slerp(t,n){let i=t._x,s=t._y,a=t._z,o=t._w,r=this.dot(t);r<0&&(i=-i,s=-s,a=-a,o=-o,r=-r);let c=1-n;if(r<.9995){const l=Math.acos(r),d=Math.sin(l);c=Math.sin(c*l)/d,n=Math.sin(n*l)/d,this._x=this._x*c+i*n,this._y=this._y*c+s*n,this._z=this._z*c+a*n,this._w=this._w*c+o*n,this._onChangeCallback()}else this._x=this._x*c+i*n,this._y=this._y*c+s*n,this._z=this._z*c+a*n,this._w=this._w*c+o*n,this.normalize();return this}slerpQuaternions(t,n,i){return this.copy(t).slerp(n,i)}random(){const t=2*Math.PI*Math.random(),n=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),a=Math.sqrt(i);return this.set(s*Math.sin(t),s*Math.cos(t),a*Math.sin(n),a*Math.cos(n))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,n=0){return this._x=t[n],this._y=t[n+1],this._z=t[n+2],this._w=t[n+3],this._onChangeCallback(),this}toArray(t=[],n=0){return t[n]=this._x,t[n+1]=this._y,t[n+2]=this._z,t[n+3]=this._w,t}fromBufferAttribute(t,n){return this._x=t.getX(n),this._y=t.getY(n),this._z=t.getZ(n),this._w=t.getW(n),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class q{static{q.prototype.isVector3=!0}constructor(t=0,n=0,i=0){this.x=t,this.y=n,this.z=i}set(t,n,i){return i===void 0&&(i=this.z),this.x=t,this.y=n,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this.z=t.z+n.z,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this.z+=t.z*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this.z=t.z-n.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,n){return this.x=t.x*n.x,this.y=t.y*n.y,this.z=t.z*n.z,this}applyEuler(t){return this.applyQuaternion(V0.setFromEuler(t))}applyAxisAngle(t,n){return this.applyQuaternion(V0.setFromAxisAngle(t,n))}applyMatrix3(t){const n=this.x,i=this.y,s=this.z,a=t.elements;return this.x=a[0]*n+a[3]*i+a[6]*s,this.y=a[1]*n+a[4]*i+a[7]*s,this.z=a[2]*n+a[5]*i+a[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const n=this.x,i=this.y,s=this.z,a=t.elements,o=1/(a[3]*n+a[7]*i+a[11]*s+a[15]);return this.x=(a[0]*n+a[4]*i+a[8]*s+a[12])*o,this.y=(a[1]*n+a[5]*i+a[9]*s+a[13])*o,this.z=(a[2]*n+a[6]*i+a[10]*s+a[14])*o,this}applyQuaternion(t){const n=this.x,i=this.y,s=this.z,a=t.x,o=t.y,r=t.z,c=t.w,l=2*(o*s-r*i),d=2*(r*n-a*s),f=2*(a*i-o*n);return this.x=n+c*l+o*f-r*d,this.y=i+c*d+r*l-a*f,this.z=s+c*f+a*d-o*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const n=this.x,i=this.y,s=this.z,a=t.elements;return this.x=a[0]*n+a[4]*i+a[8]*s,this.y=a[1]*n+a[5]*i+a[9]*s,this.z=a[2]*n+a[6]*i+a[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,n){return this.x=ae(this.x,t.x,n.x),this.y=ae(this.y,t.y,n.y),this.z=ae(this.z,t.z,n.z),this}clampScalar(t,n){return this.x=ae(this.x,t,n),this.y=ae(this.y,t,n),this.z=ae(this.z,t,n),this}clampLength(t,n){const i=this.length();return this.divideScalar(i||1).multiplyScalar(ae(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this.z+=(t.z-this.z)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this.z=t.z+(n.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,n){const i=t.x,s=t.y,a=t.z,o=n.x,r=n.y,c=n.z;return this.x=s*c-a*r,this.y=a*o-i*c,this.z=i*r-s*o,this}projectOnVector(t){const n=t.lengthSq();if(n===0)return this.set(0,0,0);const i=t.dot(this)/n;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return Jl.copy(this).projectOnVector(t),this.sub(Jl)}reflect(t){return this.sub(Jl.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const n=Math.sqrt(this.lengthSq()*t.lengthSq());if(n===0)return Math.PI/2;const i=this.dot(t)/n;return Math.acos(ae(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const n=this.x-t.x,i=this.y-t.y,s=this.z-t.z;return n*n+i*i+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,n,i){const s=Math.sin(n)*t;return this.x=s*Math.sin(i),this.y=Math.cos(n)*t,this.z=s*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,n,i){return this.x=t*Math.sin(n),this.y=i,this.z=t*Math.cos(n),this}setFromMatrixPosition(t){const n=t.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this}setFromMatrixScale(t){const n=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=n,this.y=i,this.z=s,this}setFromMatrixColumn(t,n){return this.fromArray(t.elements,n*4)}setFromMatrix3Column(t,n){return this.fromArray(t.elements,n*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this.z=t[n+2],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t[n+2]=this.z,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this.z=t.getZ(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,n=Math.random()*2-1,i=Math.sqrt(1-n*n);return this.x=i*Math.cos(t),this.y=n,this.z=i*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Jl=new q,V0=new Ya;class te{static{te.prototype.isMatrix3=!0}constructor(t,n,i,s,a,o,r,c,l){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,n,i,s,a,o,r,c,l)}set(t,n,i,s,a,o,r,c,l){const d=this.elements;return d[0]=t,d[1]=s,d[2]=r,d[3]=n,d[4]=a,d[5]=c,d[6]=i,d[7]=o,d[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const n=this.elements,i=t.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],this}extractBasis(t,n,i){return t.setFromMatrix3Column(this,0),n.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const n=t.elements;return this.set(n[0],n[4],n[8],n[1],n[5],n[9],n[2],n[6],n[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,n){const i=t.elements,s=n.elements,a=this.elements,o=i[0],r=i[3],c=i[6],l=i[1],d=i[4],f=i[7],u=i[2],h=i[5],m=i[8],_=s[0],x=s[3],p=s[6],v=s[1],y=s[4],g=s[7],b=s[2],w=s[5],T=s[8];return a[0]=o*_+r*v+c*b,a[3]=o*x+r*y+c*w,a[6]=o*p+r*g+c*T,a[1]=l*_+d*v+f*b,a[4]=l*x+d*y+f*w,a[7]=l*p+d*g+f*T,a[2]=u*_+h*v+m*b,a[5]=u*x+h*y+m*w,a[8]=u*p+h*g+m*T,this}multiplyScalar(t){const n=this.elements;return n[0]*=t,n[3]*=t,n[6]*=t,n[1]*=t,n[4]*=t,n[7]*=t,n[2]*=t,n[5]*=t,n[8]*=t,this}determinant(){const t=this.elements,n=t[0],i=t[1],s=t[2],a=t[3],o=t[4],r=t[5],c=t[6],l=t[7],d=t[8];return n*o*d-n*r*l-i*a*d+i*r*c+s*a*l-s*o*c}invert(){const t=this.elements,n=t[0],i=t[1],s=t[2],a=t[3],o=t[4],r=t[5],c=t[6],l=t[7],d=t[8],f=d*o-r*l,u=r*c-d*a,h=l*a-o*c,m=n*f+i*u+s*h;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/m;return t[0]=f*_,t[1]=(s*l-d*i)*_,t[2]=(r*i-s*o)*_,t[3]=u*_,t[4]=(d*n-s*c)*_,t[5]=(s*a-r*n)*_,t[6]=h*_,t[7]=(i*c-l*n)*_,t[8]=(o*n-i*a)*_,this}transpose(){let t;const n=this.elements;return t=n[1],n[1]=n[3],n[3]=t,t=n[2],n[2]=n[6],n[6]=t,t=n[5],n[5]=n[7],n[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const n=this.elements;return t[0]=n[0],t[1]=n[3],t[2]=n[6],t[3]=n[1],t[4]=n[4],t[5]=n[7],t[6]=n[2],t[7]=n[5],t[8]=n[8],this}setUvTransform(t,n,i,s,a,o,r){const c=Math.cos(a),l=Math.sin(a);return this.set(i*c,i*l,-i*(c*o+l*r)+o+t,-s*l,s*c,-s*(-l*o+c*r)+r+n,0,0,1),this}scale(t,n){return Ia("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Ql.makeScale(t,n)),this}rotate(t){return Ia("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Ql.makeRotation(-t)),this}translate(t,n){return Ia("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Ql.makeTranslation(t,n)),this}makeTranslation(t,n){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,n,0,0,1),this}makeRotation(t){const n=Math.cos(t),i=Math.sin(t);return this.set(n,-i,0,i,n,0,0,0,1),this}makeScale(t,n){return this.set(t,0,0,0,n,0,0,0,1),this}equals(t){const n=this.elements,i=t.elements;for(let s=0;s<9;s++)if(n[s]!==i[s])return!1;return!0}fromArray(t,n=0){for(let i=0;i<9;i++)this.elements[i]=t[i+n];return this}toArray(t=[],n=0){const i=this.elements;return t[n]=i[0],t[n+1]=i[1],t[n+2]=i[2],t[n+3]=i[3],t[n+4]=i[4],t[n+5]=i[5],t[n+6]=i[6],t[n+7]=i[7],t[n+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const Ql=new te,k0=new te().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),W0=new te().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Z1(){const e={enabled:!0,workingColorSpace:qc,spaces:{},convert:function(s,a,o){return this.enabled===!1||a===o||!a||!o||(this.spaces[a].transfer===me&&(s.r=Oi(s.r),s.g=Oi(s.g),s.b=Oi(s.b)),this.spaces[a].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[a].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===me&&(s.r=Da(s.r),s.g=Da(s.g),s.b=Da(s.b))),s},workingToColorSpace:function(s,a){return this.convert(s,this.workingColorSpace,a)},colorSpaceToWorking:function(s,a){return this.convert(s,a,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===as?Yc:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,a=this.workingColorSpace){return s.fromArray(this.spaces[a].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,a,o){return s.copy(this.spaces[a].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,a){return Ia("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),e.workingToColorSpace(s,a)},toWorkingColorSpace:function(s,a){return Ia("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),e.colorSpaceToWorking(s,a)}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],i=[.3127,.329];return e.define({[qc]:{primaries:t,whitePoint:i,transfer:Yc,toXYZ:k0,fromXYZ:W0,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:fn},outputColorSpaceConfig:{drawingBufferColorSpace:fn}},[fn]:{primaries:t,whitePoint:i,transfer:me,toXYZ:k0,fromXYZ:W0,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:fn}}}),e}const oe=Z1();function Oi(e){return e<.04045?e*.0773993808:Math.pow(e*.9478672986+.0521327014,2.4)}function Da(e){return e<.0031308?e*12.92:1.055*Math.pow(e,.41666)-.055}let sa;class K1{static getDataURL(t,n="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let i;if(t instanceof HTMLCanvasElement)i=t;else{sa===void 0&&(sa=Zc("canvas")),sa.width=t.width,sa.height=t.height;const s=sa.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),i=sa}return i.toDataURL(n)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const n=Zc("canvas");n.width=t.width,n.height=t.height;const i=n.getContext("2d");i.drawImage(t,0,0,t.width,t.height);const s=i.getImageData(0,0,t.width,t.height),a=s.data;for(let o=0;o<a.length;o++)a[o]=Oi(a[o]/255)*255;return i.putImageData(s,0,0),n}else if(t.data){const n=t.data.slice(0);for(let i=0;i<n.length;i++)n instanceof Uint8Array||n instanceof Uint8ClampedArray?n[i]=Math.floor(Oi(n[i]/255)*255):n[i]=Oi(n[i]);return{data:n,width:t.width,height:t.height}}else return Qt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let J1=0;class Nu{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:J1++}),this.uuid=qa(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){const n=this.data;return typeof HTMLVideoElement<"u"&&n instanceof HTMLVideoElement?t.set(n.videoWidth,n.videoHeight,0):typeof VideoFrame<"u"&&n instanceof VideoFrame?t.set(n.displayWidth,n.displayHeight,0):n!==null?t.set(n.width,n.height,n.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const n=t===void 0||typeof t=="string";if(!n&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let a;if(Array.isArray(s)){a=[];for(let o=0,r=s.length;o<r;o++)s[o].isDataTexture?a.push(jl(s[o].image)):a.push(jl(s[o]))}else a=jl(s);i.url=a}return n||(t.images[this.uuid]=i),i}}function jl(e){return typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap?K1.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(Qt("Texture: Unable to serialize Texture."),{})}let Q1=0;const td=new q;class en extends Ys{constructor(t=en.DEFAULT_IMAGE,n=en.DEFAULT_MAPPING,i=Ri,s=Ri,a=$e,o=bs,r=Zn,c=wn,l=en.DEFAULT_ANISOTROPY,d=as){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Q1++}),this.uuid=qa(),this.name="",this.source=new Nu(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=a,this.minFilter=o,this.anisotropy=l,this.format=r,this.internalFormat=null,this.type=c,this.offset=new Ct(0,0),this.repeat=new Ct(1,1),this.center=new Ct(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new te,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=d,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(td).x}get height(){return this.source.getSize(td).y}get depth(){return this.source.getSize(td).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,n){this.updateRanges.push({start:t,count:n})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(const n in t){const i=t[n];if(i===void 0){Qt(`Texture.setValues(): parameter '${n}' has value of undefined.`);continue}const s=this[n];if(s===void 0){Qt(`Texture.setValues(): property '${n}' does not exist.`);continue}s&&i&&s.isVector2&&i.isVector2||s&&i&&s.isVector3&&i.isVector3||s&&i&&s.isMatrix3&&i.isMatrix3?s.copy(i):this[n]=i}}toJSON(t){const n=t===void 0||typeof t=="string";if(!n&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),n||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Tm)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case tr:t.x=t.x-Math.floor(t.x);break;case Ri:t.x=t.x<0?0:1;break;case cf:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case tr:t.y=t.y-Math.floor(t.y);break;case Ri:t.y=t.y<0?0:1;break;case cf:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}en.DEFAULT_IMAGE=null;en.DEFAULT_MAPPING=Tm;en.DEFAULT_ANISOTROPY=1;class Ae{static{Ae.prototype.isVector4=!0}constructor(t=0,n=0,i=0,s=1){this.x=t,this.y=n,this.z=i,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,n,i,s){return this.x=t,this.y=n,this.z=i,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;case 3:this.w=n;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this.z=t.z+n.z,this.w=t.w+n.w,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this.z+=t.z*n,this.w+=t.w*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this.z=t.z-n.z,this.w=t.w-n.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const n=this.x,i=this.y,s=this.z,a=this.w,o=t.elements;return this.x=o[0]*n+o[4]*i+o[8]*s+o[12]*a,this.y=o[1]*n+o[5]*i+o[9]*s+o[13]*a,this.z=o[2]*n+o[6]*i+o[10]*s+o[14]*a,this.w=o[3]*n+o[7]*i+o[11]*s+o[15]*a,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const n=Math.sqrt(1-t.w*t.w);return n<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/n,this.y=t.y/n,this.z=t.z/n),this}setAxisAngleFromRotationMatrix(t){let n,i,s,a;const c=t.elements,l=c[0],d=c[4],f=c[8],u=c[1],h=c[5],m=c[9],_=c[2],x=c[6],p=c[10];if(Math.abs(d-u)<.01&&Math.abs(f-_)<.01&&Math.abs(m-x)<.01){if(Math.abs(d+u)<.1&&Math.abs(f+_)<.1&&Math.abs(m+x)<.1&&Math.abs(l+h+p-3)<.1)return this.set(1,0,0,0),this;n=Math.PI;const y=(l+1)/2,g=(h+1)/2,b=(p+1)/2,w=(d+u)/4,T=(f+_)/4,M=(m+x)/4;return y>g&&y>b?y<.01?(i=0,s=.707106781,a=.707106781):(i=Math.sqrt(y),s=w/i,a=T/i):g>b?g<.01?(i=.707106781,s=0,a=.707106781):(s=Math.sqrt(g),i=w/s,a=M/s):b<.01?(i=.707106781,s=.707106781,a=0):(a=Math.sqrt(b),i=T/a,s=M/a),this.set(i,s,a,n),this}let v=Math.sqrt((x-m)*(x-m)+(f-_)*(f-_)+(u-d)*(u-d));return Math.abs(v)<.001&&(v=1),this.x=(x-m)/v,this.y=(f-_)/v,this.z=(u-d)/v,this.w=Math.acos((l+h+p-1)/2),this}setFromMatrixPosition(t){const n=t.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this.w=n[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,n){return this.x=ae(this.x,t.x,n.x),this.y=ae(this.y,t.y,n.y),this.z=ae(this.z,t.z,n.z),this.w=ae(this.w,t.w,n.w),this}clampScalar(t,n){return this.x=ae(this.x,t,n),this.y=ae(this.y,t,n),this.z=ae(this.z,t,n),this.w=ae(this.w,t,n),this}clampLength(t,n){const i=this.length();return this.divideScalar(i||1).multiplyScalar(ae(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this.z+=(t.z-this.z)*n,this.w+=(t.w-this.w)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this.z=t.z+(n.z-t.z)*i,this.w=t.w+(n.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this.z=t[n+2],this.w=t[n+3],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t[n+2]=this.z,t[n+3]=this.w,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this.z=t.getZ(n),this.w=t.getW(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class j1 extends Ys{constructor(t=1,n=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:$e,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=t,this.height=n,this.depth=i.depth,this.scissor=new Ae(0,0,t,n),this.scissorTest=!1,this.viewport=new Ae(0,0,t,n),this.textures=[];const s={width:t,height:n,depth:i.depth},a=new en(s),o=i.count;for(let r=0;r<o;r++)this.textures[r]=a.clone(),this.textures[r].isRenderTargetTexture=!0,this.textures[r].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(t={}){const n={minFilter:$e,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(n.mapping=t.mapping),t.wrapS!==void 0&&(n.wrapS=t.wrapS),t.wrapT!==void 0&&(n.wrapT=t.wrapT),t.wrapR!==void 0&&(n.wrapR=t.wrapR),t.magFilter!==void 0&&(n.magFilter=t.magFilter),t.minFilter!==void 0&&(n.minFilter=t.minFilter),t.format!==void 0&&(n.format=t.format),t.type!==void 0&&(n.type=t.type),t.anisotropy!==void 0&&(n.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(n.colorSpace=t.colorSpace),t.flipY!==void 0&&(n.flipY=t.flipY),t.generateMipmaps!==void 0&&(n.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(n.internalFormat=t.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(n)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,n,i=1){if(this.width!==t||this.height!==n||this.depth!==i){this.width=t,this.height=n,this.depth=i;for(let s=0,a=this.textures.length;s<a;s++)this.textures[s].image.width=t,this.textures[s].image.height=n,this.textures[s].image.depth=i,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,n),this.scissor.set(0,0,t,n)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,i=t.textures.length;n<i;n++){this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0,this.textures[n].renderTarget=this;const s=Object.assign({},t.textures[n].image);this.textures[n].source=new Nu(s)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){const n=t.depthTexture.clone();n.renderTarget=null,this.depthTexture=n}else this.depthTexture=t.depthTexture;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Kn extends j1{constructor(t=1,n=1,i={}){super(t,n,i),this.isWebGLRenderTarget=!0}}class Nm extends en{constructor(t=null,n=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:n,height:i,depth:s},this.magFilter=Xe,this.minFilter=Xe,this.wrapR=Ri,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class t_ extends en{constructor(t=null,n=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:n,height:i,depth:s},this.magFilter=Xe,this.minFilter=Xe,this.wrapR=Ri,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}}class Ee{static{Ee.prototype.isMatrix4=!0}constructor(t,n,i,s,a,o,r,c,l,d,f,u,h,m,_,x){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,n,i,s,a,o,r,c,l,d,f,u,h,m,_,x)}set(t,n,i,s,a,o,r,c,l,d,f,u,h,m,_,x){const p=this.elements;return p[0]=t,p[4]=n,p[8]=i,p[12]=s,p[1]=a,p[5]=o,p[9]=r,p[13]=c,p[2]=l,p[6]=d,p[10]=f,p[14]=u,p[3]=h,p[7]=m,p[11]=_,p[15]=x,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Ee().fromArray(this.elements)}copy(t){const n=this.elements,i=t.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],n[9]=i[9],n[10]=i[10],n[11]=i[11],n[12]=i[12],n[13]=i[13],n[14]=i[14],n[15]=i[15],this}copyPosition(t){const n=this.elements,i=t.elements;return n[12]=i[12],n[13]=i[13],n[14]=i[14],this}setFromMatrix3(t){const n=t.elements;return this.set(n[0],n[3],n[6],0,n[1],n[4],n[7],0,n[2],n[5],n[8],0,0,0,0,1),this}extractBasis(t,n,i){return this.determinantAffine()===0?(t.set(1,0,0),n.set(0,1,0),i.set(0,0,1),this):(t.setFromMatrixColumn(this,0),n.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(t,n,i){return this.set(t.x,n.x,i.x,0,t.y,n.y,i.y,0,t.z,n.z,i.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();const n=this.elements,i=t.elements,s=1/aa.setFromMatrixColumn(t,0).length(),a=1/aa.setFromMatrixColumn(t,1).length(),o=1/aa.setFromMatrixColumn(t,2).length();return n[0]=i[0]*s,n[1]=i[1]*s,n[2]=i[2]*s,n[3]=0,n[4]=i[4]*a,n[5]=i[5]*a,n[6]=i[6]*a,n[7]=0,n[8]=i[8]*o,n[9]=i[9]*o,n[10]=i[10]*o,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromEuler(t){const n=this.elements,i=t.x,s=t.y,a=t.z,o=Math.cos(i),r=Math.sin(i),c=Math.cos(s),l=Math.sin(s),d=Math.cos(a),f=Math.sin(a);if(t.order==="XYZ"){const u=o*d,h=o*f,m=r*d,_=r*f;n[0]=c*d,n[4]=-c*f,n[8]=l,n[1]=h+m*l,n[5]=u-_*l,n[9]=-r*c,n[2]=_-u*l,n[6]=m+h*l,n[10]=o*c}else if(t.order==="YXZ"){const u=c*d,h=c*f,m=l*d,_=l*f;n[0]=u+_*r,n[4]=m*r-h,n[8]=o*l,n[1]=o*f,n[5]=o*d,n[9]=-r,n[2]=h*r-m,n[6]=_+u*r,n[10]=o*c}else if(t.order==="ZXY"){const u=c*d,h=c*f,m=l*d,_=l*f;n[0]=u-_*r,n[4]=-o*f,n[8]=m+h*r,n[1]=h+m*r,n[5]=o*d,n[9]=_-u*r,n[2]=-o*l,n[6]=r,n[10]=o*c}else if(t.order==="ZYX"){const u=o*d,h=o*f,m=r*d,_=r*f;n[0]=c*d,n[4]=m*l-h,n[8]=u*l+_,n[1]=c*f,n[5]=_*l+u,n[9]=h*l-m,n[2]=-l,n[6]=r*c,n[10]=o*c}else if(t.order==="YZX"){const u=o*c,h=o*l,m=r*c,_=r*l;n[0]=c*d,n[4]=_-u*f,n[8]=m*f+h,n[1]=f,n[5]=o*d,n[9]=-r*d,n[2]=-l*d,n[6]=h*f+m,n[10]=u-_*f}else if(t.order==="XZY"){const u=o*c,h=o*l,m=r*c,_=r*l;n[0]=c*d,n[4]=-f,n[8]=l*d,n[1]=u*f+_,n[5]=o*d,n[9]=h*f-m,n[2]=m*f-h,n[6]=r*d,n[10]=_*f+u}return n[3]=0,n[7]=0,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromQuaternion(t){return this.compose(e_,t,n_)}lookAt(t,n,i){const s=this.elements;return xn.subVectors(t,n),xn.lengthSq()===0&&(xn.z=1),xn.normalize(),Xi.crossVectors(i,xn),Xi.lengthSq()===0&&(Math.abs(i.z)===1?xn.x+=1e-4:xn.z+=1e-4,xn.normalize(),Xi.crossVectors(i,xn)),Xi.normalize(),Fr.crossVectors(xn,Xi),s[0]=Xi.x,s[4]=Fr.x,s[8]=xn.x,s[1]=Xi.y,s[5]=Fr.y,s[9]=xn.y,s[2]=Xi.z,s[6]=Fr.z,s[10]=xn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,n){const i=t.elements,s=n.elements,a=this.elements,o=i[0],r=i[4],c=i[8],l=i[12],d=i[1],f=i[5],u=i[9],h=i[13],m=i[2],_=i[6],x=i[10],p=i[14],v=i[3],y=i[7],g=i[11],b=i[15],w=s[0],T=s[4],M=s[8],E=s[12],A=s[1],C=s[5],I=s[9],U=s[13],P=s[2],O=s[6],V=s[10],N=s[14],F=s[3],L=s[7],B=s[11],$=s[15];return a[0]=o*w+r*A+c*P+l*F,a[4]=o*T+r*C+c*O+l*L,a[8]=o*M+r*I+c*V+l*B,a[12]=o*E+r*U+c*N+l*$,a[1]=d*w+f*A+u*P+h*F,a[5]=d*T+f*C+u*O+h*L,a[9]=d*M+f*I+u*V+h*B,a[13]=d*E+f*U+u*N+h*$,a[2]=m*w+_*A+x*P+p*F,a[6]=m*T+_*C+x*O+p*L,a[10]=m*M+_*I+x*V+p*B,a[14]=m*E+_*U+x*N+p*$,a[3]=v*w+y*A+g*P+b*F,a[7]=v*T+y*C+g*O+b*L,a[11]=v*M+y*I+g*V+b*B,a[15]=v*E+y*U+g*N+b*$,this}multiplyScalar(t){const n=this.elements;return n[0]*=t,n[4]*=t,n[8]*=t,n[12]*=t,n[1]*=t,n[5]*=t,n[9]*=t,n[13]*=t,n[2]*=t,n[6]*=t,n[10]*=t,n[14]*=t,n[3]*=t,n[7]*=t,n[11]*=t,n[15]*=t,this}determinant(){const t=this.elements,n=t[0],i=t[4],s=t[8],a=t[12],o=t[1],r=t[5],c=t[9],l=t[13],d=t[2],f=t[6],u=t[10],h=t[14],m=t[3],_=t[7],x=t[11],p=t[15],v=c*h-l*u,y=r*h-l*f,g=r*u-c*f,b=o*h-l*d,w=o*u-c*d,T=o*f-r*d;return n*(_*v-x*y+p*g)-i*(m*v-x*b+p*w)+s*(m*y-_*b+p*T)-a*(m*g-_*w+x*T)}determinantAffine(){const t=this.elements,n=t[0],i=t[4],s=t[8],a=t[1],o=t[5],r=t[9],c=t[2],l=t[6],d=t[10];return n*(o*d-r*l)-i*(a*d-r*c)+s*(a*l-o*c)}transpose(){const t=this.elements;let n;return n=t[1],t[1]=t[4],t[4]=n,n=t[2],t[2]=t[8],t[8]=n,n=t[6],t[6]=t[9],t[9]=n,n=t[3],t[3]=t[12],t[12]=n,n=t[7],t[7]=t[13],t[13]=n,n=t[11],t[11]=t[14],t[14]=n,this}setPosition(t,n,i){const s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=n,s[14]=i),this}invert(){const t=this.elements,n=t[0],i=t[1],s=t[2],a=t[3],o=t[4],r=t[5],c=t[6],l=t[7],d=t[8],f=t[9],u=t[10],h=t[11],m=t[12],_=t[13],x=t[14],p=t[15],v=n*r-i*o,y=n*c-s*o,g=n*l-a*o,b=i*c-s*r,w=i*l-a*r,T=s*l-a*c,M=d*_-f*m,E=d*x-u*m,A=d*p-h*m,C=f*x-u*_,I=f*p-h*_,U=u*p-h*x,P=v*U-y*I+g*C+b*A-w*E+T*M;if(P===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const O=1/P;return t[0]=(r*U-c*I+l*C)*O,t[1]=(s*I-i*U-a*C)*O,t[2]=(_*T-x*w+p*b)*O,t[3]=(u*w-f*T-h*b)*O,t[4]=(c*A-o*U-l*E)*O,t[5]=(n*U-s*A+a*E)*O,t[6]=(x*g-m*T-p*y)*O,t[7]=(d*T-u*g+h*y)*O,t[8]=(o*I-r*A+l*M)*O,t[9]=(i*A-n*I-a*M)*O,t[10]=(m*w-_*g+p*v)*O,t[11]=(f*g-d*w-h*v)*O,t[12]=(r*E-o*C-c*M)*O,t[13]=(n*C-i*E+s*M)*O,t[14]=(_*y-m*b-x*v)*O,t[15]=(d*b-f*y+u*v)*O,this}scale(t){const n=this.elements,i=t.x,s=t.y,a=t.z;return n[0]*=i,n[4]*=s,n[8]*=a,n[1]*=i,n[5]*=s,n[9]*=a,n[2]*=i,n[6]*=s,n[10]*=a,n[3]*=i,n[7]*=s,n[11]*=a,this}getMaxScaleOnAxis(){const t=this.elements,n=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(n,i,s))}makeTranslation(t,n,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,n,0,0,1,i,0,0,0,1),this}makeRotationX(t){const n=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,n,-i,0,0,i,n,0,0,0,0,1),this}makeRotationY(t){const n=Math.cos(t),i=Math.sin(t);return this.set(n,0,i,0,0,1,0,0,-i,0,n,0,0,0,0,1),this}makeRotationZ(t){const n=Math.cos(t),i=Math.sin(t);return this.set(n,-i,0,0,i,n,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,n){const i=Math.cos(n),s=Math.sin(n),a=1-i,o=t.x,r=t.y,c=t.z,l=a*o,d=a*r;return this.set(l*o+i,l*r-s*c,l*c+s*r,0,l*r+s*c,d*r+i,d*c-s*o,0,l*c-s*r,d*c+s*o,a*c*c+i,0,0,0,0,1),this}makeScale(t,n,i){return this.set(t,0,0,0,0,n,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,n,i,s,a,o){return this.set(1,i,a,0,t,1,o,0,n,s,1,0,0,0,0,1),this}compose(t,n,i){const s=this.elements,a=n._x,o=n._y,r=n._z,c=n._w,l=a+a,d=o+o,f=r+r,u=a*l,h=a*d,m=a*f,_=o*d,x=o*f,p=r*f,v=c*l,y=c*d,g=c*f,b=i.x,w=i.y,T=i.z;return s[0]=(1-(_+p))*b,s[1]=(h+g)*b,s[2]=(m-y)*b,s[3]=0,s[4]=(h-g)*w,s[5]=(1-(u+p))*w,s[6]=(x+v)*w,s[7]=0,s[8]=(m+y)*T,s[9]=(x-v)*T,s[10]=(1-(u+_))*T,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,n,i){const s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];const a=this.determinantAffine();if(a===0)return i.set(1,1,1),n.identity(),this;let o=aa.set(s[0],s[1],s[2]).length();const r=aa.set(s[4],s[5],s[6]).length(),c=aa.set(s[8],s[9],s[10]).length();a<0&&(o=-o),Hn.copy(this);const l=1/o,d=1/r,f=1/c;return Hn.elements[0]*=l,Hn.elements[1]*=l,Hn.elements[2]*=l,Hn.elements[4]*=d,Hn.elements[5]*=d,Hn.elements[6]*=d,Hn.elements[8]*=f,Hn.elements[9]*=f,Hn.elements[10]*=f,n.setFromRotationMatrix(Hn),i.x=o,i.y=r,i.z=c,this}makePerspective(t,n,i,s,a,o,r=ri,c=!1){const l=this.elements,d=2*a/(n-t),f=2*a/(i-s),u=(n+t)/(n-t),h=(i+s)/(i-s);let m,_;if(c)m=a/(o-a),_=o*a/(o-a);else if(r===ri)m=-(o+a)/(o-a),_=-2*o*a/(o-a);else if(r===ir)m=-o/(o-a),_=-o*a/(o-a);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+r);return l[0]=d,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=f,l[9]=h,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=_,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,n,i,s,a,o,r=ri,c=!1){const l=this.elements,d=2/(n-t),f=2/(i-s),u=-(n+t)/(n-t),h=-(i+s)/(i-s);let m,_;if(c)m=1/(o-a),_=o/(o-a);else if(r===ri)m=-2/(o-a),_=-(o+a)/(o-a);else if(r===ir)m=-1/(o-a),_=-a/(o-a);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+r);return l[0]=d,l[4]=0,l[8]=0,l[12]=u,l[1]=0,l[5]=f,l[9]=0,l[13]=h,l[2]=0,l[6]=0,l[10]=m,l[14]=_,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const n=this.elements,i=t.elements;for(let s=0;s<16;s++)if(n[s]!==i[s])return!1;return!0}fromArray(t,n=0){for(let i=0;i<16;i++)this.elements[i]=t[i+n];return this}toArray(t=[],n=0){const i=this.elements;return t[n]=i[0],t[n+1]=i[1],t[n+2]=i[2],t[n+3]=i[3],t[n+4]=i[4],t[n+5]=i[5],t[n+6]=i[6],t[n+7]=i[7],t[n+8]=i[8],t[n+9]=i[9],t[n+10]=i[10],t[n+11]=i[11],t[n+12]=i[12],t[n+13]=i[13],t[n+14]=i[14],t[n+15]=i[15],t}}const aa=new q,Hn=new Ee,e_=new q(0,0,0),n_=new q(1,1,1),Xi=new q,Fr=new q,xn=new q,X0=new Ee,$0=new Ya;class Gi{constructor(t=0,n=0,i=0,s=Gi.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=i,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,n,i,s=this._order){return this._x=t,this._y=n,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,n=this._order,i=!0){const s=t.elements,a=s[0],o=s[4],r=s[8],c=s[1],l=s[5],d=s[9],f=s[2],u=s[6],h=s[10];switch(n){case"XYZ":this._y=Math.asin(ae(r,-1,1)),Math.abs(r)<.9999999?(this._x=Math.atan2(-d,h),this._z=Math.atan2(-o,a)):(this._x=Math.atan2(u,l),this._z=0);break;case"YXZ":this._x=Math.asin(-ae(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(r,h),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-f,a),this._z=0);break;case"ZXY":this._x=Math.asin(ae(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-f,h),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,a));break;case"ZYX":this._y=Math.asin(-ae(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(u,h),this._z=Math.atan2(c,a)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(ae(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-d,l),this._y=Math.atan2(-f,a)):(this._x=0,this._y=Math.atan2(r,h));break;case"XZY":this._z=Math.asin(-ae(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(u,l),this._y=Math.atan2(r,a)):(this._x=Math.atan2(-d,h),this._y=0);break;default:Qt("Euler: .setFromRotationMatrix() encountered an unknown order: "+n)}return this._order=n,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,n,i){return X0.makeRotationFromQuaternion(t),this.setFromRotationMatrix(X0,n,i)}setFromVector3(t,n=this._order){return this.set(t.x,t.y,t.z,n)}reorder(t){return $0.setFromEuler(this),this.setFromQuaternion($0,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],n=0){return t[n]=this._x,t[n+1]=this._y,t[n+2]=this._z,t[n+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Gi.DEFAULT_ORDER="XYZ";class Um{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let i_=0;const q0=new q,oa=new Ya,vi=new Ee,Br=new q,co=new q,s_=new q,a_=new Ya,Y0=new q(1,0,0),Z0=new q(0,1,0),K0=new q(0,0,1),J0={type:"added"},o_={type:"removed"},ra={type:"childadded",child:null},ed={type:"childremoved",child:null};class qe extends Ys{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:i_++}),this.uuid=qa(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=qe.DEFAULT_UP.clone();const t=new q,n=new Gi,i=new Ya,s=new q(1,1,1);function a(){i.setFromEuler(n,!1)}function o(){n.setFromQuaternion(i,void 0,!1)}n._onChange(a),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Ee},normalMatrix:{value:new te}}),this.matrix=new Ee,this.matrixWorld=new Ee,this.matrixAutoUpdate=qe.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=qe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Um,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,n){this.quaternion.setFromAxisAngle(t,n)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,n){return oa.setFromAxisAngle(t,n),this.quaternion.multiply(oa),this}rotateOnWorldAxis(t,n){return oa.setFromAxisAngle(t,n),this.quaternion.premultiply(oa),this}rotateX(t){return this.rotateOnAxis(Y0,t)}rotateY(t){return this.rotateOnAxis(Z0,t)}rotateZ(t){return this.rotateOnAxis(K0,t)}translateOnAxis(t,n){return q0.copy(t).applyQuaternion(this.quaternion),this.position.add(q0.multiplyScalar(n)),this}translateX(t){return this.translateOnAxis(Y0,t)}translateY(t){return this.translateOnAxis(Z0,t)}translateZ(t){return this.translateOnAxis(K0,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(vi.copy(this.matrixWorld).invert())}lookAt(t,n,i){t.isVector3?Br.copy(t):Br.set(t,n,i);const s=this.parent;this.updateWorldMatrix(!0,!1),co.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?vi.lookAt(co,Br,this.up):vi.lookAt(Br,co,this.up),this.quaternion.setFromRotationMatrix(vi),s&&(vi.extractRotation(s.matrixWorld),oa.setFromRotationMatrix(vi),this.quaternion.premultiply(oa.invert()))}add(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.add(arguments[n]);return this}return t===this?(ce("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(J0),ra.child=t,this.dispatchEvent(ra),ra.child=null):ce("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const n=this.children.indexOf(t);return n!==-1&&(t.parent=null,this.children.splice(n,1),t.dispatchEvent(o_),ed.child=t,this.dispatchEvent(ed),ed.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),vi.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),vi.multiply(t.parent.matrixWorld)),t.applyMatrix4(vi),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(J0),ra.child=t,this.dispatchEvent(ra),ra.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,n){if(this[t]===n)return this;for(let i=0,s=this.children.length;i<s;i++){const o=this.children[i].getObjectByProperty(t,n);if(o!==void 0)return o}}getObjectsByProperty(t,n,i=[]){this[t]===n&&i.push(this);const s=this.children;for(let a=0,o=s.length;a<o;a++)s[a].getObjectsByProperty(t,n,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(co,t,s_),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(co,a_,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const n=this.matrixWorld.elements;return t.set(n[8],n[9],n[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(t){t(this);const n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].traverseVisible(t)}traverseAncestors(t){const n=this.parent;n!==null&&(t(n),n.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const t=this.pivot;if(t!==null){const n=t.x,i=t.y,s=t.z,a=this.matrix.elements;a[12]+=n-a[0]*n-a[4]*i-a[8]*s,a[13]+=i-a[1]*n-a[5]*i-a[9]*s,a[14]+=s-a[2]*n-a[6]*i-a[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].updateMatrixWorld(t)}updateWorldMatrix(t,n,i=!1){const s=this.parent;if(t===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),n===!0){const a=this.children;for(let o=0,r=a.length;o<r;o++)a[o].updateWorldMatrix(!1,!0,i)}}toJSON(t){const n=t===void 0||typeof t=="string",i={};n&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(r=>({...r,boundingBox:r.boundingBox?r.boundingBox.toJSON():void 0,boundingSphere:r.boundingSphere?r.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(r=>({...r})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function a(r,c){return r[c.uuid]===void 0&&(r[c.uuid]=c.toJSON(t)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=a(t.geometries,this.geometry);const r=this.geometry.parameters;if(r!==void 0&&r.shapes!==void 0){const c=r.shapes;if(Array.isArray(c))for(let l=0,d=c.length;l<d;l++){const f=c[l];a(t.shapes,f)}else a(t.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(a(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const r=[];for(let c=0,l=this.material.length;c<l;c++)r.push(a(t.materials,this.material[c]));s.material=r}else s.material=a(t.materials,this.material);if(this.children.length>0){s.children=[];for(let r=0;r<this.children.length;r++)s.children.push(this.children[r].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let r=0;r<this.animations.length;r++){const c=this.animations[r];s.animations.push(a(t.animations,c))}}if(n){const r=o(t.geometries),c=o(t.materials),l=o(t.textures),d=o(t.images),f=o(t.shapes),u=o(t.skeletons),h=o(t.animations),m=o(t.nodes);r.length>0&&(i.geometries=r),c.length>0&&(i.materials=c),l.length>0&&(i.textures=l),d.length>0&&(i.images=d),f.length>0&&(i.shapes=f),u.length>0&&(i.skeletons=u),h.length>0&&(i.animations=h),m.length>0&&(i.nodes=m)}return i.object=s,i;function o(r){const c=[];for(const l in r){const d=r[l];delete d.metadata,c.push(d)}return c}}clone(t){return new this.constructor().copy(this,t)}copy(t,n=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),n===!0)for(let i=0;i<t.children.length;i++){const s=t.children[i];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}qe.DEFAULT_UP=new q(0,1,0);qe.DEFAULT_MATRIX_AUTO_UPDATE=!0;qe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class Wt extends qe{constructor(){super(),this.isGroup=!0,this.type="Group"}}const r_={type:"move"};class nd{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Wt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Wt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new q,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new q),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Wt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new q,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new q,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const n=this._hand;if(n)for(const i of t.hand.values())this._getHandJoint(n,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,n,i){let s=null,a=null,o=null;const r=this._targetRay,c=this._grip,l=this._hand;if(t&&n.session.visibilityState!=="visible-blurred"){if(l&&t.hand){o=!0;for(const _ of t.hand.values()){const x=n.getJointPose(_,i),p=this._getHandJoint(l,_);x!==null&&(p.matrix.fromArray(x.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=x.radius),p.visible=x!==null}const d=l.joints["index-finger-tip"],f=l.joints["thumb-tip"],u=d.position.distanceTo(f.position),h=.02,m=.005;l.inputState.pinching&&u>h+m?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!l.inputState.pinching&&u<=h-m&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else c!==null&&t.gripSpace&&(a=n.getPose(t.gripSpace,i),a!==null&&(c.matrix.fromArray(a.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,a.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(a.linearVelocity)):c.hasLinearVelocity=!1,a.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(a.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:t,target:this})));r!==null&&(s=n.getPose(t.targetRaySpace,i),s===null&&a!==null&&(s=a),s!==null&&(r.matrix.fromArray(s.transform.matrix),r.matrix.decompose(r.position,r.rotation,r.scale),r.matrixWorldNeedsUpdate=!0,s.linearVelocity?(r.hasLinearVelocity=!0,r.linearVelocity.copy(s.linearVelocity)):r.hasLinearVelocity=!1,s.angularVelocity?(r.hasAngularVelocity=!0,r.angularVelocity.copy(s.angularVelocity)):r.hasAngularVelocity=!1,this.dispatchEvent(r_)))}return r!==null&&(r.visible=s!==null),c!==null&&(c.visible=a!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(t,n){if(t.joints[n.jointName]===void 0){const i=new Wt;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[n.jointName]=i,t.add(i)}return t.joints[n.jointName]}}const Om={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},$i={h:0,s:0,l:0},Gr={h:0,s:0,l:0};function id(e,t,n){return n<0&&(n+=1),n>1&&(n-=1),n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}class ee{constructor(t,n,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,n,i)}set(t,n,i){if(n===void 0&&i===void 0){const s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,n,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,n=fn){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,oe.colorSpaceToWorking(this,n),this}setRGB(t,n,i,s=oe.workingColorSpace){return this.r=t,this.g=n,this.b=i,oe.colorSpaceToWorking(this,s),this}setHSL(t,n,i,s=oe.workingColorSpace){if(t=Y1(t,1),n=ae(n,0,1),i=ae(i,0,1),n===0)this.r=this.g=this.b=i;else{const a=i<=.5?i*(1+n):i+n-i*n,o=2*i-a;this.r=id(o,a,t+1/3),this.g=id(o,a,t),this.b=id(o,a,t-1/3)}return oe.colorSpaceToWorking(this,s),this}setStyle(t,n=fn){function i(a){a!==void 0&&parseFloat(a)<1&&Qt("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let a;const o=s[1],r=s[2];switch(o){case"rgb":case"rgba":if(a=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(r))return i(a[4]),this.setRGB(Math.min(255,parseInt(a[1],10))/255,Math.min(255,parseInt(a[2],10))/255,Math.min(255,parseInt(a[3],10))/255,n);if(a=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(r))return i(a[4]),this.setRGB(Math.min(100,parseInt(a[1],10))/100,Math.min(100,parseInt(a[2],10))/100,Math.min(100,parseInt(a[3],10))/100,n);break;case"hsl":case"hsla":if(a=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(r))return i(a[4]),this.setHSL(parseFloat(a[1])/360,parseFloat(a[2])/100,parseFloat(a[3])/100,n);break;default:Qt("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){const a=s[1],o=a.length;if(o===3)return this.setRGB(parseInt(a.charAt(0),16)/15,parseInt(a.charAt(1),16)/15,parseInt(a.charAt(2),16)/15,n);if(o===6)return this.setHex(parseInt(a,16),n);Qt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,n);return this}setColorName(t,n=fn){const i=Om[t.toLowerCase()];return i!==void 0?this.setHex(i,n):Qt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Oi(t.r),this.g=Oi(t.g),this.b=Oi(t.b),this}copyLinearToSRGB(t){return this.r=Da(t.r),this.g=Da(t.g),this.b=Da(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=fn){return oe.workingToColorSpace(Ke.copy(this),t),Math.round(ae(Ke.r*255,0,255))*65536+Math.round(ae(Ke.g*255,0,255))*256+Math.round(ae(Ke.b*255,0,255))}getHexString(t=fn){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,n=oe.workingColorSpace){oe.workingToColorSpace(Ke.copy(this),n);const i=Ke.r,s=Ke.g,a=Ke.b,o=Math.max(i,s,a),r=Math.min(i,s,a);let c,l;const d=(r+o)/2;if(r===o)c=0,l=0;else{const f=o-r;switch(l=d<=.5?f/(o+r):f/(2-o-r),o){case i:c=(s-a)/f+(s<a?6:0);break;case s:c=(a-i)/f+2;break;case a:c=(i-s)/f+4;break}c/=6}return t.h=c,t.s=l,t.l=d,t}getRGB(t,n=oe.workingColorSpace){return oe.workingToColorSpace(Ke.copy(this),n),t.r=Ke.r,t.g=Ke.g,t.b=Ke.b,t}getStyle(t=fn){oe.workingToColorSpace(Ke.copy(this),t);const n=Ke.r,i=Ke.g,s=Ke.b;return t!==fn?`color(${t} ${n.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(n*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(t,n,i){return this.getHSL($i),this.setHSL($i.h+t,$i.s+n,$i.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,n){return this.r=t.r+n.r,this.g=t.g+n.g,this.b=t.b+n.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,n){return this.r+=(t.r-this.r)*n,this.g+=(t.g-this.g)*n,this.b+=(t.b-this.b)*n,this}lerpColors(t,n,i){return this.r=t.r+(n.r-t.r)*i,this.g=t.g+(n.g-t.g)*i,this.b=t.b+(n.b-t.b)*i,this}lerpHSL(t,n){this.getHSL($i),t.getHSL(Gr);const i=Kl($i.h,Gr.h,n),s=Kl($i.s,Gr.s,n),a=Kl($i.l,Gr.l,n);return this.setHSL(i,s,a),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const n=this.r,i=this.g,s=this.b,a=t.elements;return this.r=a[0]*n+a[3]*i+a[6]*s,this.g=a[1]*n+a[4]*i+a[7]*s,this.b=a[2]*n+a[5]*i+a[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,n=0){return this.r=t[n],this.g=t[n+1],this.b=t[n+2],this}toArray(t=[],n=0){return t[n]=this.r,t[n+1]=this.g,t[n+2]=this.b,t}fromBufferAttribute(t,n){return this.r=t.getX(n),this.g=t.getY(n),this.b=t.getZ(n),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ke=new ee;ee.NAMES=Om;class c_ extends qe{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Gi,this.environmentIntensity=1,this.environmentRotation=new Gi,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,n){return super.copy(t,n),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const n=super.toJSON(t);return this.fog!==null&&(n.object.fog=this.fog.toJSON()),n.object.backgroundBlurriness=this.backgroundBlurriness,n.object.backgroundIntensity=this.backgroundIntensity,n.object.backgroundRotation=this.backgroundRotation.toArray(),n.object.environmentIntensity=this.environmentIntensity,n.object.environmentRotation=this.environmentRotation.toArray(),n}}const Vn=new q,Mi=new q,sd=new q,yi=new q,ca=new q,la=new q,Q0=new q,ad=new q,od=new q,rd=new q,cd=new Ae,ld=new Ae,dd=new Ae;class Yn{constructor(t=new q,n=new q,i=new q){this.a=t,this.b=n,this.c=i}static getNormal(t,n,i,s){s.subVectors(i,n),Vn.subVectors(t,n),s.cross(Vn);const a=s.lengthSq();return a>0?s.multiplyScalar(1/Math.sqrt(a)):s.set(0,0,0)}static getBarycoord(t,n,i,s,a){Vn.subVectors(s,n),Mi.subVectors(i,n),sd.subVectors(t,n);const o=Vn.dot(Vn),r=Vn.dot(Mi),c=Vn.dot(sd),l=Mi.dot(Mi),d=Mi.dot(sd),f=o*l-r*r;if(f===0)return a.set(0,0,0),null;const u=1/f,h=(l*c-r*d)*u,m=(o*d-r*c)*u;return a.set(1-h-m,m,h)}static containsPoint(t,n,i,s){return this.getBarycoord(t,n,i,s,yi)===null?!1:yi.x>=0&&yi.y>=0&&yi.x+yi.y<=1}static getInterpolation(t,n,i,s,a,o,r,c){return this.getBarycoord(t,n,i,s,yi)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(a,yi.x),c.addScaledVector(o,yi.y),c.addScaledVector(r,yi.z),c)}static getInterpolatedAttribute(t,n,i,s,a,o){return cd.setScalar(0),ld.setScalar(0),dd.setScalar(0),cd.fromBufferAttribute(t,n),ld.fromBufferAttribute(t,i),dd.fromBufferAttribute(t,s),o.setScalar(0),o.addScaledVector(cd,a.x),o.addScaledVector(ld,a.y),o.addScaledVector(dd,a.z),o}static isFrontFacing(t,n,i,s){return Vn.subVectors(i,n),Mi.subVectors(t,n),Vn.cross(Mi).dot(s)<0}set(t,n,i){return this.a.copy(t),this.b.copy(n),this.c.copy(i),this}setFromPointsAndIndices(t,n,i,s){return this.a.copy(t[n]),this.b.copy(t[i]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,n,i,s){return this.a.fromBufferAttribute(t,n),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Vn.subVectors(this.c,this.b),Mi.subVectors(this.a,this.b),Vn.cross(Mi).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return Yn.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return Yn.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,i,s,a){return Yn.getInterpolation(t,this.a,this.b,this.c,n,i,s,a)}containsPoint(t){return Yn.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return Yn.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,n){const i=this.a,s=this.b,a=this.c;let o,r;ca.subVectors(s,i),la.subVectors(a,i),ad.subVectors(t,i);const c=ca.dot(ad),l=la.dot(ad);if(c<=0&&l<=0)return n.copy(i);od.subVectors(t,s);const d=ca.dot(od),f=la.dot(od);if(d>=0&&f<=d)return n.copy(s);const u=c*f-d*l;if(u<=0&&c>=0&&d<=0)return o=c/(c-d),n.copy(i).addScaledVector(ca,o);rd.subVectors(t,a);const h=ca.dot(rd),m=la.dot(rd);if(m>=0&&h<=m)return n.copy(a);const _=h*l-c*m;if(_<=0&&l>=0&&m<=0)return r=l/(l-m),n.copy(i).addScaledVector(la,r);const x=d*m-h*f;if(x<=0&&f-d>=0&&h-m>=0)return Q0.subVectors(a,s),r=(f-d)/(f-d+(h-m)),n.copy(s).addScaledVector(Q0,r);const p=1/(x+_+u);return o=_*p,r=u*p,n.copy(i).addScaledVector(ca,o).addScaledVector(la,r)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}class Za{constructor(t=new q(1/0,1/0,1/0),n=new q(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=n}set(t,n){return this.min.copy(t),this.max.copy(n),this}setFromArray(t){this.makeEmpty();for(let n=0,i=t.length;n<i;n+=3)this.expandByPoint(kn.fromArray(t,n));return this}setFromBufferAttribute(t){this.makeEmpty();for(let n=0,i=t.count;n<i;n++)this.expandByPoint(kn.fromBufferAttribute(t,n));return this}setFromPoints(t){this.makeEmpty();for(let n=0,i=t.length;n<i;n++)this.expandByPoint(t[n]);return this}setFromCenterAndSize(t,n){const i=kn.copy(n).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,n=!1){return this.makeEmpty(),this.expandByObject(t,n)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,n=!1){t.updateWorldMatrix(!1,!1);const i=t.geometry;if(i!==void 0){const a=i.getAttribute("position");if(n===!0&&a!==void 0&&t.isInstancedMesh!==!0)for(let o=0,r=a.count;o<r;o++)t.isMesh===!0?t.getVertexPosition(o,kn):kn.fromBufferAttribute(a,o),kn.applyMatrix4(t.matrixWorld),this.expandByPoint(kn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Hr.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Hr.copy(i.boundingBox)),Hr.applyMatrix4(t.matrixWorld),this.union(Hr)}const s=t.children;for(let a=0,o=s.length;a<o;a++)this.expandByObject(s[a],n);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,n){return n.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,kn),kn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let n,i;return t.normal.x>0?(n=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(n=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(n+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(n+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(n+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(n+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),n<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(lo),Vr.subVectors(this.max,lo),da.subVectors(t.a,lo),fa.subVectors(t.b,lo),ua.subVectors(t.c,lo),qi.subVectors(fa,da),Yi.subVectors(ua,fa),us.subVectors(da,ua);let n=[0,-qi.z,qi.y,0,-Yi.z,Yi.y,0,-us.z,us.y,qi.z,0,-qi.x,Yi.z,0,-Yi.x,us.z,0,-us.x,-qi.y,qi.x,0,-Yi.y,Yi.x,0,-us.y,us.x,0];return!fd(n,da,fa,ua,Vr)||(n=[1,0,0,0,1,0,0,0,1],!fd(n,da,fa,ua,Vr))?!1:(kr.crossVectors(qi,Yi),n=[kr.x,kr.y,kr.z],fd(n,da,fa,ua,Vr))}clampPoint(t,n){return n.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,kn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(kn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(bi[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),bi[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),bi[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),bi[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),bi[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),bi[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),bi[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),bi[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(bi),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}}const bi=[new q,new q,new q,new q,new q,new q,new q,new q],kn=new q,Hr=new Za,da=new q,fa=new q,ua=new q,qi=new q,Yi=new q,us=new q,lo=new q,Vr=new q,kr=new q,hs=new q;function fd(e,t,n,i,s){for(let a=0,o=e.length-3;a<=o;a+=3){hs.fromArray(e,a);const r=s.x*Math.abs(hs.x)+s.y*Math.abs(hs.y)+s.z*Math.abs(hs.z),c=t.dot(hs),l=n.dot(hs),d=i.dot(hs);if(Math.max(-Math.max(c,l,d),Math.min(c,l,d))>r)return!1}return!0}const Ie=new q,Wr=new Ct;let l_=0;class pn extends Ys{constructor(t,n,i=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:l_++}),this.name="",this.array=t,this.itemSize=n,this.count=t!==void 0?t.length/n:0,this.normalized=i,this.usage=k1,this.updateRanges=[],this.gpuType=oi,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,n){this.updateRanges.push({start:t,count:n})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,n,i){t*=this.itemSize,i*=n.itemSize;for(let s=0,a=this.itemSize;s<a;s++)this.array[t+s]=n.array[i+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let n=0,i=this.count;n<i;n++)Wr.fromBufferAttribute(this,n),Wr.applyMatrix3(t),this.setXY(n,Wr.x,Wr.y);else if(this.itemSize===3)for(let n=0,i=this.count;n<i;n++)Ie.fromBufferAttribute(this,n),Ie.applyMatrix3(t),this.setXYZ(n,Ie.x,Ie.y,Ie.z);return this}applyMatrix4(t){for(let n=0,i=this.count;n<i;n++)Ie.fromBufferAttribute(this,n),Ie.applyMatrix4(t),this.setXYZ(n,Ie.x,Ie.y,Ie.z);return this}applyNormalMatrix(t){for(let n=0,i=this.count;n<i;n++)Ie.fromBufferAttribute(this,n),Ie.applyNormalMatrix(t),this.setXYZ(n,Ie.x,Ie.y,Ie.z);return this}transformDirection(t){for(let n=0,i=this.count;n<i;n++)Ie.fromBufferAttribute(this,n),Ie.transformDirection(t),this.setXYZ(n,Ie.x,Ie.y,Ie.z);return this}set(t,n=0){return this.array.set(t,n),this}getComponent(t,n){let i=this.array[t*this.itemSize+n];return this.normalized&&(i=ro(i,this.array)),i}setComponent(t,n,i){return this.normalized&&(i=dn(i,this.array)),this.array[t*this.itemSize+n]=i,this}getX(t){let n=this.array[t*this.itemSize];return this.normalized&&(n=ro(n,this.array)),n}setX(t,n){return this.normalized&&(n=dn(n,this.array)),this.array[t*this.itemSize]=n,this}getY(t){let n=this.array[t*this.itemSize+1];return this.normalized&&(n=ro(n,this.array)),n}setY(t,n){return this.normalized&&(n=dn(n,this.array)),this.array[t*this.itemSize+1]=n,this}getZ(t){let n=this.array[t*this.itemSize+2];return this.normalized&&(n=ro(n,this.array)),n}setZ(t,n){return this.normalized&&(n=dn(n,this.array)),this.array[t*this.itemSize+2]=n,this}getW(t){let n=this.array[t*this.itemSize+3];return this.normalized&&(n=ro(n,this.array)),n}setW(t,n){return this.normalized&&(n=dn(n,this.array)),this.array[t*this.itemSize+3]=n,this}setXY(t,n,i){return t*=this.itemSize,this.normalized&&(n=dn(n,this.array),i=dn(i,this.array)),this.array[t+0]=n,this.array[t+1]=i,this}setXYZ(t,n,i,s){return t*=this.itemSize,this.normalized&&(n=dn(n,this.array),i=dn(i,this.array),s=dn(s,this.array)),this.array[t+0]=n,this.array[t+1]=i,this.array[t+2]=s,this}setXYZW(t,n,i,s,a){return t*=this.itemSize,this.normalized&&(n=dn(n,this.array),i=dn(i,this.array),s=dn(s,this.array),a=dn(a,this.array)),this.array[t+0]=n,this.array[t+1]=i,this.array[t+2]=s,this.array[t+3]=a,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}}class Fm extends pn{constructor(t,n,i){super(new Uint16Array(t),n,i)}}class Bm extends pn{constructor(t,n,i){super(new Uint32Array(t),n,i)}}class le extends pn{constructor(t,n,i){super(new Float32Array(t),n,i)}}const d_=new Za,fo=new q,ud=new q;class Uu{constructor(t=new q,n=-1){this.isSphere=!0,this.center=t,this.radius=n}set(t,n){return this.center.copy(t),this.radius=n,this}setFromPoints(t,n){const i=this.center;n!==void 0?i.copy(n):d_.setFromPoints(t).getCenter(i);let s=0;for(let a=0,o=t.length;a<o;a++)s=Math.max(s,i.distanceToSquared(t[a]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const n=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=n*n}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,n){const i=this.center.distanceToSquared(t);return n.copy(t),i>this.radius*this.radius&&(n.sub(this.center).normalize(),n.multiplyScalar(this.radius).add(this.center)),n}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;fo.subVectors(t,this.center);const n=fo.lengthSq();if(n>this.radius*this.radius){const i=Math.sqrt(n),s=(i-this.radius)*.5;this.center.addScaledVector(fo,s/i),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(ud.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(fo.copy(t.center).add(ud)),this.expandByPoint(fo.copy(t.center).sub(ud))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}}let f_=0;const zn=new Ee,hd=new qe,ha=new q,gn=new Za,uo=new Za,Ve=new q;class Ne extends Ys{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:f_++}),this.uuid=qa(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(W1(t)?Bm:Fm)(t,1):this.index=t,this}setIndirect(t,n=0){return this.indirect=t,this.indirectOffset=n,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,n){return this.attributes[t]=n,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,n,i=0){this.groups.push({start:t,count:n,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,n){this.drawRange.start=t,this.drawRange.count=n}applyMatrix4(t){const n=this.attributes.position;n!==void 0&&(n.applyMatrix4(t),n.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const a=new te().getNormalMatrix(t);i.applyNormalMatrix(a),i.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return zn.makeRotationFromQuaternion(t),this.applyMatrix4(zn),this}rotateX(t){return zn.makeRotationX(t),this.applyMatrix4(zn),this}rotateY(t){return zn.makeRotationY(t),this.applyMatrix4(zn),this}rotateZ(t){return zn.makeRotationZ(t),this.applyMatrix4(zn),this}translate(t,n,i){return zn.makeTranslation(t,n,i),this.applyMatrix4(zn),this}scale(t,n,i){return zn.makeScale(t,n,i),this.applyMatrix4(zn),this}lookAt(t){return hd.lookAt(t),hd.updateMatrix(),this.applyMatrix4(hd.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ha).negate(),this.translate(ha.x,ha.y,ha.z),this}setFromPoints(t){const n=this.getAttribute("position");if(n===void 0){const i=[];for(let s=0,a=t.length;s<a;s++){const o=t[s];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new le(i,3))}else{const i=Math.min(t.length,n.count);for(let s=0;s<i;s++){const a=t[s];n.setXYZ(s,a.x,a.y,a.z||0)}t.length>n.count&&Qt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),n.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Za);const t=this.attributes.position,n=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){ce("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new q(-1/0,-1/0,-1/0),new q(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),n)for(let i=0,s=n.length;i<s;i++){const a=n[i];gn.setFromBufferAttribute(a),this.morphTargetsRelative?(Ve.addVectors(this.boundingBox.min,gn.min),this.boundingBox.expandByPoint(Ve),Ve.addVectors(this.boundingBox.max,gn.max),this.boundingBox.expandByPoint(Ve)):(this.boundingBox.expandByPoint(gn.min),this.boundingBox.expandByPoint(gn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&ce('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Uu);const t=this.attributes.position,n=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){ce("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new q,1/0);return}if(t){const i=this.boundingSphere.center;if(gn.setFromBufferAttribute(t),n)for(let a=0,o=n.length;a<o;a++){const r=n[a];uo.setFromBufferAttribute(r),this.morphTargetsRelative?(Ve.addVectors(gn.min,uo.min),gn.expandByPoint(Ve),Ve.addVectors(gn.max,uo.max),gn.expandByPoint(Ve)):(gn.expandByPoint(uo.min),gn.expandByPoint(uo.max))}gn.getCenter(i);let s=0;for(let a=0,o=t.count;a<o;a++)Ve.fromBufferAttribute(t,a),s=Math.max(s,i.distanceToSquared(Ve));if(n)for(let a=0,o=n.length;a<o;a++){const r=n[a],c=this.morphTargetsRelative;for(let l=0,d=r.count;l<d;l++)Ve.fromBufferAttribute(r,l),c&&(ha.fromBufferAttribute(t,l),Ve.add(ha)),s=Math.max(s,i.distanceToSquared(Ve))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&ce('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,n=this.attributes;if(t===null||n.position===void 0||n.normal===void 0||n.uv===void 0){ce("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=n.position,s=n.normal,a=n.uv;let o=this.getAttribute("tangent");(o===void 0||o.count!==i.count)&&(o=new pn(new Float32Array(4*i.count),4),this.setAttribute("tangent",o));const r=[],c=[];for(let M=0;M<i.count;M++)r[M]=new q,c[M]=new q;const l=new q,d=new q,f=new q,u=new Ct,h=new Ct,m=new Ct,_=new q,x=new q;function p(M,E,A){l.fromBufferAttribute(i,M),d.fromBufferAttribute(i,E),f.fromBufferAttribute(i,A),u.fromBufferAttribute(a,M),h.fromBufferAttribute(a,E),m.fromBufferAttribute(a,A),d.sub(l),f.sub(l),h.sub(u),m.sub(u);const C=1/(h.x*m.y-m.x*h.y);isFinite(C)&&(_.copy(d).multiplyScalar(m.y).addScaledVector(f,-h.y).multiplyScalar(C),x.copy(f).multiplyScalar(h.x).addScaledVector(d,-m.x).multiplyScalar(C),r[M].add(_),r[E].add(_),r[A].add(_),c[M].add(x),c[E].add(x),c[A].add(x))}let v=this.groups;v.length===0&&(v=[{start:0,count:t.count}]);for(let M=0,E=v.length;M<E;++M){const A=v[M],C=A.start,I=A.count;for(let U=C,P=C+I;U<P;U+=3)p(t.getX(U+0),t.getX(U+1),t.getX(U+2))}const y=new q,g=new q,b=new q,w=new q;function T(M){b.fromBufferAttribute(s,M),w.copy(b);const E=r[M];y.copy(E),y.sub(b.multiplyScalar(b.dot(E))).normalize(),g.crossVectors(w,E);const C=g.dot(c[M])<0?-1:1;o.setXYZW(M,y.x,y.y,y.z,C)}for(let M=0,E=v.length;M<E;++M){const A=v[M],C=A.start,I=A.count;for(let U=C,P=C+I;U<P;U+=3)T(t.getX(U+0)),T(t.getX(U+1)),T(t.getX(U+2))}this._transformed=!0}computeVertexNormals(){const t=this.index,n=this.getAttribute("position");if(n!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==n.count)i=new pn(new Float32Array(n.count*3),3),this.setAttribute("normal",i);else for(let u=0,h=i.count;u<h;u++)i.setXYZ(u,0,0,0);const s=new q,a=new q,o=new q,r=new q,c=new q,l=new q,d=new q,f=new q;if(t)for(let u=0,h=t.count;u<h;u+=3){const m=t.getX(u+0),_=t.getX(u+1),x=t.getX(u+2);s.fromBufferAttribute(n,m),a.fromBufferAttribute(n,_),o.fromBufferAttribute(n,x),d.subVectors(o,a),f.subVectors(s,a),d.cross(f),r.fromBufferAttribute(i,m),c.fromBufferAttribute(i,_),l.fromBufferAttribute(i,x),r.add(d),c.add(d),l.add(d),i.setXYZ(m,r.x,r.y,r.z),i.setXYZ(_,c.x,c.y,c.z),i.setXYZ(x,l.x,l.y,l.z)}else for(let u=0,h=n.count;u<h;u+=3)s.fromBufferAttribute(n,u+0),a.fromBufferAttribute(n,u+1),o.fromBufferAttribute(n,u+2),d.subVectors(o,a),f.subVectors(s,a),d.cross(f),i.setXYZ(u+0,d.x,d.y,d.z),i.setXYZ(u+1,d.x,d.y,d.z),i.setXYZ(u+2,d.x,d.y,d.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let n=0,i=t.count;n<i;n++)Ve.fromBufferAttribute(t,n),Ve.normalize(),t.setXYZ(n,Ve.x,Ve.y,Ve.z)}toNonIndexed(){function t(r,c){const l=r.array,d=r.itemSize,f=r.normalized,u=new l.constructor(c.length*d);let h=0,m=0;for(let _=0,x=c.length;_<x;_++){r.isInterleavedBufferAttribute?h=c[_]*r.data.stride+r.offset:h=c[_]*d;for(let p=0;p<d;p++)u[m++]=l[h++]}return new pn(u,d,f)}if(this.index===null)return Qt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const n=new Ne,i=this.index.array,s=this.attributes;for(const r in s){const c=s[r],l=t(c,i);n.setAttribute(r,l)}const a=this.morphAttributes;for(const r in a){const c=[],l=a[r];for(let d=0,f=l.length;d<f;d++){const u=l[d],h=t(u,i);c.push(h)}n.morphAttributes[r]=c}n.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let r=0,c=o.length;r<c;r++){const l=o[r];n.addGroup(l.start,l.count,l.materialIndex)}return n}toJSON(){const t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(t[l]=c[l]);return t}t.data={attributes:{}};const n=this.index;n!==null&&(t.data.index={type:n.array.constructor.name,array:Array.prototype.slice.call(n.array)});const i=this.attributes;for(const c in i){const l=i[c];t.data.attributes[c]=l.toJSON(t.data)}const s={};let a=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],d=[];for(let f=0,u=l.length;f<u;f++){const h=l[f];d.push(h.toJSON(t.data))}d.length>0&&(s[c]=d,a=!0)}a&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));const r=this.boundingSphere;return r!==null&&(t.data.boundingSphere=r.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const n={};this.name=t.name;const i=t.index;i!==null&&this.setIndex(i.clone());const s=t.attributes;for(const l in s){const d=s[l];this.setAttribute(l,d.clone(n))}const a=t.morphAttributes;for(const l in a){const d=[],f=a[l];for(let u=0,h=f.length;u<h;u++)d.push(f[u].clone(n));this.morphAttributes[l]=d}this.morphTargetsRelative=t.morphTargetsRelative;const o=t.groups;for(let l=0,d=o.length;l<d;l++){const f=o[l];this.addGroup(f.start,f.count,f.materialIndex)}const r=t.boundingBox;r!==null&&(this.boundingBox=r.clone());const c=t.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}const pd=new q,u_=new q,h_=new te;class es{constructor(t=new q(1,0,0),n=0){this.isPlane=!0,this.normal=t,this.constant=n}set(t,n){return this.normal.copy(t),this.constant=n,this}setComponents(t,n,i,s){return this.normal.set(t,n,i),this.constant=s,this}setFromNormalAndCoplanarPoint(t,n){return this.normal.copy(t),this.constant=-n.dot(this.normal),this}setFromCoplanarPoints(t,n,i){const s=pd.subVectors(i,n).cross(u_.subVectors(t,n)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,n){return n.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,n,i=!0){const s=t.delta(pd),a=this.normal.dot(s);if(a===0)return this.distanceToPoint(t.start)===0?n.copy(t.start):null;const o=-(t.start.dot(this.normal)+this.constant)/a;return i===!0&&(o<0||o>1)?null:n.copy(t.start).addScaledVector(s,o)}intersectsLine(t){const n=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return n<0&&i>0||i<0&&n>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,n){const i=n||h_.getNormalMatrix(t),s=this.coplanarPoint(pd).applyMatrix4(t),a=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(a),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}}let p_=0;class Ka extends Ys{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:p_++}),this.uuid=qa(),this.name="",this.type="Material",this.blending=Oo,this.side=Ds,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=gm,this.blendDst=_m,this.blendEquation=ba,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ee(0,0,0),this.blendAlpha=0,this.depthFunc=jo,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=U1,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Yl,this.stencilZFail=Yl,this.stencilZPass=Yl,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const n in t){const i=t[n];if(i===void 0){Qt(`Material: parameter '${n}' has value of undefined.`);continue}const s=this[n];if(s===void 0){Qt(`Material: '${n}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector2&&i&&i.isVector2||s&&s.isEuler&&i&&i.isEuler||s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[n]=i}}toJSON(t){const n=t===void 0||typeof t=="string";n&&(t={textures:{},images:{}});const i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(a=>a.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(a){const o=[];for(const r in a){const c=a[r];delete c.metadata,o.push(c)}return o}if(n){const a=s(t.textures),o=s(t.images);a.length>0&&(i.textures=a),o.length>0&&(i.images=o)}return i}fromJSON(t,n){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new ee().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(i=>new es().fromJSON(i))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=n[t.map]||null),t.matcap!==void 0&&(this.matcap=n[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=n[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=n[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=n[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let i=t.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new Ct().fromArray(i)}return t.displacementMap!==void 0&&(this.displacementMap=n[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=n[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=n[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=n[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=n[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=n[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=n[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=n[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=n[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=n[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=n[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=n[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=n[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=n[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Ct().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=n[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=n[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=n[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=n[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=n[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=n[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=n[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const n=t.clippingPlanes;let i=null;if(n!==null){const s=n.length;i=new Array(s);for(let a=0;a!==s;++a)i[a]=n[a].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}const Si=new q,md=new q,Xr=new q,$r=new q;class m_{constructor(t=new q,n=new q(0,0,-1)){this.origin=t,this.direction=n}set(t,n){return this.origin.copy(t),this.direction.copy(n),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,n){return n.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Si)),this}closestPointToPoint(t,n){n.subVectors(t,this.origin);const i=n.dot(this.direction);return i<0?n.copy(this.origin):n.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const n=Si.subVectors(t,this.origin).dot(this.direction);return n<0?this.origin.distanceToSquared(t):(Si.copy(this.origin).addScaledVector(this.direction,n),Si.distanceToSquared(t))}distanceSqToSegment(t,n,i,s){md.copy(t).add(n).multiplyScalar(.5),Xr.copy(n).sub(t).normalize(),$r.copy(this.origin).sub(md);const a=t.distanceTo(n)*.5,o=-this.direction.dot(Xr),r=$r.dot(this.direction),c=-$r.dot(Xr),l=$r.lengthSq(),d=Math.abs(1-o*o);let f,u,h,m;if(d>0)if(f=o*c-r,u=o*r-c,m=a*d,f>=0)if(u>=-m)if(u<=m){const _=1/d;f*=_,u*=_,h=f*(f+o*u+2*r)+u*(o*f+u+2*c)+l}else u=a,f=Math.max(0,-(o*u+r)),h=-f*f+u*(u+2*c)+l;else u=-a,f=Math.max(0,-(o*u+r)),h=-f*f+u*(u+2*c)+l;else u<=-m?(f=Math.max(0,-(-o*a+r)),u=f>0?-a:Math.min(Math.max(-a,-c),a),h=-f*f+u*(u+2*c)+l):u<=m?(f=0,u=Math.min(Math.max(-a,-c),a),h=u*(u+2*c)+l):(f=Math.max(0,-(o*a+r)),u=f>0?a:Math.min(Math.max(-a,-c),a),h=-f*f+u*(u+2*c)+l);else u=o>0?-a:a,f=Math.max(0,-(o*u+r)),h=-f*f+u*(u+2*c)+l;return i&&i.copy(this.origin).addScaledVector(this.direction,f),s&&s.copy(md).addScaledVector(Xr,u),h}intersectSphere(t,n){if(t.radius<0)return null;Si.subVectors(t.center,this.origin);const i=Si.dot(this.direction),s=Si.dot(Si)-i*i,a=t.radius*t.radius;if(s>a)return null;const o=Math.sqrt(a-s),r=i-o,c=i+o;return c<0?null:r<0?this.at(c,n):this.at(r,n)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const n=t.normal.dot(this.direction);if(n===0)return t.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(t.normal)+t.constant)/n;return i>=0?i:null}intersectPlane(t,n){const i=this.distanceToPlane(t);return i===null?null:this.at(i,n)}intersectsPlane(t){const n=t.distanceToPoint(this.origin);return n===0||t.normal.dot(this.direction)*n<0}intersectBox(t,n){let i,s,a,o,r,c;const l=1/this.direction.x,d=1/this.direction.y,f=1/this.direction.z,u=this.origin;return l>=0?(i=(t.min.x-u.x)*l,s=(t.max.x-u.x)*l):(i=(t.max.x-u.x)*l,s=(t.min.x-u.x)*l),d>=0?(a=(t.min.y-u.y)*d,o=(t.max.y-u.y)*d):(a=(t.max.y-u.y)*d,o=(t.min.y-u.y)*d),i>o||a>s||((a>i||isNaN(i))&&(i=a),(o<s||isNaN(s))&&(s=o),f>=0?(r=(t.min.z-u.z)*f,c=(t.max.z-u.z)*f):(r=(t.max.z-u.z)*f,c=(t.min.z-u.z)*f),i>c||r>s)||((r>i||i!==i)&&(i=r),(c<s||s!==s)&&(s=c),s<0)?null:this.at(i>=0?i:s,n)}intersectsBox(t){return this.intersectBox(t,Si)!==null}intersectTriangle(t,n,i,s,a){const o=this.origin,r=this.direction,c=r.x,l=r.y,d=r.z,f=t.x-o.x,u=t.y-o.y,h=t.z-o.z,m=n.x-o.x,_=n.y-o.y,x=n.z-o.z,p=i.x-o.x,v=i.y-o.y,y=i.z-o.z,g=Math.abs(c),b=Math.abs(l),w=Math.abs(d);let T,M,E,A,C,I,U,P,O,V,N,F;if(g>=b&&g>=w?(E=c,I=f,O=m,F=p,c>=0?(T=l,M=d,A=u,C=h,U=_,P=x,V=v,N=y):(T=d,M=l,A=h,C=u,U=x,P=_,V=y,N=v)):b>=w?(E=l,I=u,O=_,F=v,l>=0?(T=d,M=c,A=h,C=f,U=x,P=m,V=y,N=p):(T=c,M=d,A=f,C=h,U=m,P=x,V=p,N=y)):(E=d,I=h,O=x,F=y,d>=0?(T=c,M=l,A=f,C=u,U=m,P=_,V=p,N=v):(T=l,M=c,A=u,C=f,U=_,P=m,V=v,N=p)),E===0)return null;const L=T/E,B=M/E,$=1/E,J=A-L*I,st=C-B*I,Tt=U-L*O,H=P-B*O,et=V-L*F,W=N-B*F,k=et*H-W*Tt,at=J*W-st*et,mt=Tt*st-H*J;if(s){if(k<0||at<0||mt<0)return null}else if((k<0||at<0||mt<0)&&(k>0||at>0||mt>0))return null;const rt=k+at+mt;if(rt===0)return null;const Mt=$*(k*I+at*O+mt*F);return(rt>0?Mt<0:Mt>0)?null:this.at(Mt/rt,a)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class wl extends Ka{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new ee(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Gi,this.combine=Tu,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const j0=new Ee,ps=new m_,qr=new Uu,th=new q,Yr=new q,Zr=new q,Kr=new q,xd=new q,Jr=new q,eh=new q,Qr=new q;class we extends qe{constructor(t=new Ne,n=new wl){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,n){return super.copy(t,n),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){const s=n[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,o=s.length;a<o;a++){const r=s[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[r]=a}}}}getVertexPosition(t,n){const i=this.geometry,s=i.attributes.position,a=i.morphAttributes.position,o=i.morphTargetsRelative;n.fromBufferAttribute(s,t);const r=this.morphTargetInfluences;if(a&&r){Jr.set(0,0,0);for(let c=0,l=a.length;c<l;c++){const d=r[c],f=a[c];d!==0&&(xd.fromBufferAttribute(f,t),o?Jr.addScaledVector(xd,d):Jr.addScaledVector(xd.sub(n),d))}n.add(Jr)}return n}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,n){const i=this.geometry,s=this.material,a=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),qr.copy(i.boundingSphere),qr.applyMatrix4(a),ps.copy(t.ray).recast(t.near),!(qr.containsPoint(ps.origin)===!1&&(ps.intersectSphere(qr,th)===null||ps.origin.distanceToSquared(th)>(t.far-t.near)**2))&&(j0.copy(a).invert(),ps.copy(t.ray).applyMatrix4(j0),!(i.boundingBox!==null&&ps.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,n,ps)))}_computeIntersections(t,n,i){let s;const a=this.geometry,o=this.material,r=a.index,c=a.attributes.position,l=a.attributes.uv,d=a.attributes.uv1,f=a.attributes.normal,u=a.groups,h=a.drawRange;if(r!==null)if(Array.isArray(o))for(let m=0,_=u.length;m<_;m++){const x=u[m],p=o[x.materialIndex],v=Math.max(x.start,h.start),y=Math.min(r.count,Math.min(x.start+x.count,h.start+h.count));for(let g=v,b=y;g<b;g+=3){const w=r.getX(g),T=r.getX(g+1),M=r.getX(g+2);s=jr(this,p,t,i,l,d,f,w,T,M),s&&(s.faceIndex=Math.floor(g/3),s.face.materialIndex=x.materialIndex,n.push(s))}}else{const m=Math.max(0,h.start),_=Math.min(r.count,h.start+h.count);for(let x=m,p=_;x<p;x+=3){const v=r.getX(x),y=r.getX(x+1),g=r.getX(x+2);s=jr(this,o,t,i,l,d,f,v,y,g),s&&(s.faceIndex=Math.floor(x/3),n.push(s))}}else if(c!==void 0)if(Array.isArray(o))for(let m=0,_=u.length;m<_;m++){const x=u[m],p=o[x.materialIndex],v=Math.max(x.start,h.start),y=Math.min(c.count,Math.min(x.start+x.count,h.start+h.count));for(let g=v,b=y;g<b;g+=3){const w=g,T=g+1,M=g+2;s=jr(this,p,t,i,l,d,f,w,T,M),s&&(s.faceIndex=Math.floor(g/3),s.face.materialIndex=x.materialIndex,n.push(s))}}else{const m=Math.max(0,h.start),_=Math.min(c.count,h.start+h.count);for(let x=m,p=_;x<p;x+=3){const v=x,y=x+1,g=x+2;s=jr(this,o,t,i,l,d,f,v,y,g),s&&(s.faceIndex=Math.floor(x/3),n.push(s))}}}}function x_(e,t,n,i,s,a,o,r){let c;if(t.side===hn?c=i.intersectTriangle(o,a,s,!0,r):c=i.intersectTriangle(s,a,o,t.side===Ds,r),c===null)return null;Qr.copy(r),Qr.applyMatrix4(e.matrixWorld);const l=n.ray.origin.distanceTo(Qr);return l<n.near||l>n.far?null:{distance:l,point:Qr.clone(),object:e}}function jr(e,t,n,i,s,a,o,r,c,l){e.getVertexPosition(r,Yr),e.getVertexPosition(c,Zr),e.getVertexPosition(l,Kr);const d=x_(e,t,n,i,Yr,Zr,Kr,eh);if(d){const f=new q;Yn.getBarycoord(eh,Yr,Zr,Kr,f),s&&(d.uv=Yn.getInterpolatedAttribute(s,r,c,l,f,new Ct)),a&&(d.uv1=Yn.getInterpolatedAttribute(a,r,c,l,f,new Ct)),o&&(d.normal=Yn.getInterpolatedAttribute(o,r,c,l,f,new q),d.normal.dot(i.direction)>0&&d.normal.multiplyScalar(-1));const u={a:r,b:c,c:l,normal:new q,materialIndex:0};Yn.getNormal(Yr,Zr,Kr,u.normal),d.face=u,d.barycoord=f}return d}class g_ extends en{constructor(t=null,n=1,i=1,s,a,o,r,c,l=Xe,d=Xe,f,u){super(null,o,r,c,l,d,s,a,f,u),this.isDataTexture=!0,this.image={data:t,width:n,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const ms=new Uu,__=new Ct(.5,.5),tc=new q;class Ou{constructor(t=new es,n=new es,i=new es,s=new es,a=new es,o=new es){this.planes=[t,n,i,s,a,o]}set(t,n,i,s,a,o){const r=this.planes;return r[0].copy(t),r[1].copy(n),r[2].copy(i),r[3].copy(s),r[4].copy(a),r[5].copy(o),this}copy(t){const n=this.planes;for(let i=0;i<6;i++)n[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,n=ri,i=!1){const s=this.planes,a=t.elements,o=a[0],r=a[1],c=a[2],l=a[3],d=a[4],f=a[5],u=a[6],h=a[7],m=a[8],_=a[9],x=a[10],p=a[11],v=a[12],y=a[13],g=a[14],b=a[15];if(s[0].setComponents(l-o,h-d,p-m,b-v).normalize(),s[1].setComponents(l+o,h+d,p+m,b+v).normalize(),s[2].setComponents(l+r,h+f,p+_,b+y).normalize(),s[3].setComponents(l-r,h-f,p-_,b-y).normalize(),i)s[4].setComponents(c,u,x,g).normalize(),s[5].setComponents(l-c,h-u,p-x,b-g).normalize();else if(s[4].setComponents(l-c,h-u,p-x,b-g).normalize(),n===ri)s[5].setComponents(l+c,h+u,p+x,b+g).normalize();else if(n===ir)s[5].setComponents(c,u,x,g).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+n);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),ms.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const n=t.geometry;n.boundingSphere===null&&n.computeBoundingSphere(),ms.copy(n.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(ms)}intersectsSprite(t){ms.center.set(0,0,0);const n=__.distanceTo(t.center);return ms.radius=.7071067811865476+n,ms.applyMatrix4(t.matrixWorld),this.intersectsSphere(ms)}intersectsSphere(t){const n=this.planes,i=t.center,s=-t.radius;for(let a=0;a<6;a++)if(n[a].distanceToPoint(i)<s)return!1;return!0}intersectsBox(t){const n=this.planes;for(let i=0;i<6;i++){const s=n[i];if(tc.x=s.normal.x>0?t.max.x:t.min.x,tc.y=s.normal.y>0?t.max.y:t.min.y,tc.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(tc)<0)return!1}return!0}containsPoint(t){const n=this.planes;for(let i=0;i<6;i++)if(n[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class Gm extends en{constructor(t=[],n=Ns,i,s,a,o,r,c,l,d){super(t,n,i,s,a,o,r,c,l,d),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Hm extends en{constructor(t,n,i,s,a,o,r,c,l){super(t,n,i,s,a,o,r,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}}class sr extends en{constructor(t,n,i=fi,s,a,o,r=Xe,c=Xe,l,d=Bi,f=1){if(d!==Bi&&d!==Ss)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const u={width:t,height:n,depth:f};super(u,s,a,o,r,c,d,i,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new Nu(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){const n=super.toJSON(t);return n.compareFunction=this.compareFunction,n}}class v_ extends sr{constructor(t,n=fi,i=Ns,s,a,o=Xe,r=Xe,c,l=Bi){const d={width:t,height:t,depth:1},f=[d,d,d,d,d,d];super(t,t,n,i,s,a,o,r,c,l),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}}class Vm extends en{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}}class Ja extends Ne{constructor(t=1,n=1,i=1,s=1,a=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:n,depth:i,widthSegments:s,heightSegments:a,depthSegments:o};const r=this;s=Math.floor(s),a=Math.floor(a),o=Math.floor(o);const c=[],l=[],d=[],f=[];let u=0,h=0;m("z","y","x",-1,-1,i,n,t,o,a,0),m("z","y","x",1,-1,i,n,-t,o,a,1),m("x","z","y",1,1,t,i,n,s,o,2),m("x","z","y",1,-1,t,i,-n,s,o,3),m("x","y","z",1,-1,t,n,i,s,a,4),m("x","y","z",-1,-1,t,n,-i,s,a,5),this.setIndex(c),this.setAttribute("position",new le(l,3)),this.setAttribute("normal",new le(d,3)),this.setAttribute("uv",new le(f,2));function m(_,x,p,v,y,g,b,w,T,M,E){const A=g/T,C=b/M,I=g/2,U=b/2,P=w/2,O=T+1,V=M+1;let N=0,F=0;const L=new q;for(let B=0;B<V;B++){const $=B*C-U;for(let J=0;J<O;J++){const st=J*A-I;L[_]=st*v,L[x]=$*y,L[p]=P,l.push(L.x,L.y,L.z),L[_]=0,L[x]=0,L[p]=w>0?1:-1,d.push(L.x,L.y,L.z),f.push(J/T),f.push(1-B/M),N+=1}}for(let B=0;B<M;B++)for(let $=0;$<T;$++){const J=u+$+O*B,st=u+$+O*(B+1),Tt=u+($+1)+O*(B+1),H=u+($+1)+O*B;c.push(J,st,H),c.push(st,Tt,H),F+=6}r.addGroup(h,F,E),h+=F,u+=N}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ja(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}class Fu extends Ne{constructor(t=1,n=1,i=4,s=8,a=1){super(),this.type="CapsuleGeometry",this.parameters={radius:t,height:n,capSegments:i,radialSegments:s,heightSegments:a},n=Math.max(0,n),i=Math.max(1,Math.floor(i)),s=Math.max(3,Math.floor(s)),a=Math.max(1,Math.floor(a));const o=[],r=[],c=[],l=[],d=n/2,f=Math.PI/2*t,u=n,h=2*f+u,m=i*2+a,_=s+1,x=new q,p=new q;for(let v=0;v<=m;v++){let y=0,g=0,b=0,w=0;if(v<=i){const E=v/i,A=E*Math.PI/2;g=-d-t*Math.cos(A),b=t*Math.sin(A),w=-t*Math.cos(A),y=E*f}else if(v<=i+a){const E=(v-i)/a;g=-d+E*n,b=t,w=0,y=f+E*u}else{const E=(v-i-a)/i,A=E*Math.PI/2;g=d+t*Math.sin(A),b=t*Math.cos(A),w=t*Math.sin(A),y=f+u+E*f}const T=Math.max(0,Math.min(1,y/h));let M=0;v===0?M=.5/s:v===m&&(M=-.5/s);for(let E=0;E<=s;E++){const A=E/s,C=A*Math.PI*2,I=Math.sin(C),U=Math.cos(C);p.x=-b*U,p.y=g,p.z=b*I,r.push(p.x,p.y,p.z),x.set(-b*U,w,b*I),x.normalize(),c.push(x.x,x.y,x.z),l.push(A+M,T)}if(v>0){const E=(v-1)*_;for(let A=0;A<s;A++){const C=E+A,I=E+A+1,U=v*_+A,P=v*_+A+1;o.push(C,I,U),o.push(I,P,U)}}}this.setIndex(o),this.setAttribute("position",new le(r,3)),this.setAttribute("normal",new le(c,3)),this.setAttribute("uv",new le(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Fu(t.radius,t.height,t.capSegments,t.radialSegments,t.heightSegments)}}class El extends Ne{constructor(t=1,n=1,i=1,s=32,a=1,o=!1,r=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:n,height:i,radialSegments:s,heightSegments:a,openEnded:o,thetaStart:r,thetaLength:c};const l=this;s=Math.floor(s),a=Math.floor(a);const d=[],f=[],u=[],h=[];let m=0;const _=[],x=i/2;let p=0;v(),o===!1&&(t>0&&y(!0),n>0&&y(!1)),this.setIndex(d),this.setAttribute("position",new le(f,3)),this.setAttribute("normal",new le(u,3)),this.setAttribute("uv",new le(h,2));function v(){const g=new q,b=new q;let w=0;const T=(n-t)/i;for(let M=0;M<=a;M++){const E=[],A=M/a,C=A*(n-t)+t;for(let I=0;I<=s;I++){const U=I/s,P=U*c+r,O=Math.sin(P),V=Math.cos(P);b.x=C*O,b.y=-A*i+x,b.z=C*V,f.push(b.x,b.y,b.z),g.set(O,T,V).normalize(),u.push(g.x,g.y,g.z),h.push(U,1-A),E.push(m++)}_.push(E)}for(let M=0;M<s;M++)for(let E=0;E<a;E++){const A=_[E][M],C=_[E+1][M],I=_[E+1][M+1],U=_[E][M+1];(t>0||E!==0)&&(d.push(A,C,U),w+=3),(n>0||E!==a-1)&&(d.push(C,I,U),w+=3)}l.addGroup(p,w,0),p+=w}function y(g){const b=m,w=new Ct,T=new q;let M=0;const E=g===!0?t:n,A=g===!0?1:-1;for(let I=1;I<=s;I++)f.push(0,x*A,0),u.push(0,A,0),h.push(.5,.5),m++;const C=m;for(let I=0;I<=s;I++){const P=I/s*c+r,O=Math.cos(P),V=Math.sin(P);T.x=E*V,T.y=x*A,T.z=E*O,f.push(T.x,T.y,T.z),u.push(0,A,0),w.x=O*.5+.5,w.y=V*.5*A+.5,h.push(w.x,w.y),m++}for(let I=0;I<s;I++){const U=b+I,P=C+I;g===!0?d.push(P,P+1,U):d.push(P+1,P,U),M+=3}l.addGroup(p,M,g===!0?1:2),p+=M}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new El(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Tl extends El{constructor(t=1,n=1,i=32,s=1,a=!1,o=0,r=Math.PI*2){super(0,t,n,i,s,a,o,r),this.type="ConeGeometry",this.parameters={radius:t,height:n,radialSegments:i,heightSegments:s,openEnded:a,thetaStart:o,thetaLength:r}}static fromJSON(t){return new Tl(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class gi{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Qt("Curve: .getPoint() not implemented.")}getPointAt(t,n){const i=this.getUtoTmapping(t);return this.getPoint(i,n)}getPoints(t=5){const n=[];for(let i=0;i<=t;i++)n.push(this.getPoint(i/t));return n}getSpacedPoints(t=5){const n=[];for(let i=0;i<=t;i++)n.push(this.getPointAt(i/t));return n}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const n=[];let i,s=this.getPoint(0),a=0;n.push(0);for(let o=1;o<=t;o++)i=this.getPoint(o/t),a+=i.distanceTo(s),n.push(a),s=i;return this.cacheArcLengths=n,n}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,n=null){const i=this.getLengths();let s=0;const a=i.length;let o;n?o=n:o=t*i[a-1];let r=0,c=a-1,l;for(;r<=c;)if(s=Math.floor(r+(c-r)/2),l=i[s]-o,l<0)r=s+1;else if(l>0)c=s-1;else{c=s;break}if(s=c,i[s]===o)return s/(a-1);const d=i[s],u=i[s+1]-d,h=(o-d)/u;return(s+h)/(a-1)}getTangent(t,n){let s=t-1e-4,a=t+1e-4;s<0&&(s=0),a>1&&(a=1);const o=this.getPoint(s),r=this.getPoint(a),c=n||(o.isVector2?new Ct:new q);return c.copy(r).sub(o).normalize(),c}getTangentAt(t,n){const i=this.getUtoTmapping(t);return this.getTangent(i,n)}computeFrenetFrames(t,n=!1){const i=new q,s=[],a=[],o=[],r=new q,c=new Ee;for(let h=0;h<=t;h++){const m=h/t;s[h]=this.getTangentAt(m,new q)}a[0]=new q,o[0]=new q;let l=Number.MAX_VALUE;const d=Math.abs(s[0].x),f=Math.abs(s[0].y),u=Math.abs(s[0].z);d<=l&&(l=d,i.set(1,0,0)),f<=l&&(l=f,i.set(0,1,0)),u<=l&&i.set(0,0,1),r.crossVectors(s[0],i).normalize(),a[0].crossVectors(s[0],r),o[0].crossVectors(s[0],a[0]);for(let h=1;h<=t;h++){if(a[h]=a[h-1].clone(),o[h]=o[h-1].clone(),r.crossVectors(s[h-1],s[h]),r.length()>Number.EPSILON){r.normalize();const m=Math.acos(ae(s[h-1].dot(s[h]),-1,1));a[h].applyMatrix4(c.makeRotationAxis(r,m))}o[h].crossVectors(s[h],a[h])}if(n===!0){let h=Math.acos(ae(a[0].dot(a[t]),-1,1));h/=t,s[0].dot(r.crossVectors(a[0],a[t]))>0&&(h=-h);for(let m=1;m<=t;m++)a[m].applyMatrix4(c.makeRotationAxis(s[m],h*m)),o[m].crossVectors(s[m],a[m])}return{tangents:s,normals:a,binormals:o}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class Bu extends gi{constructor(t=0,n=0,i=1,s=1,a=0,o=Math.PI*2,r=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=n,this.xRadius=i,this.yRadius=s,this.aStartAngle=a,this.aEndAngle=o,this.aClockwise=r,this.aRotation=c}getPoint(t,n=new Ct){const i=n,s=Math.PI*2;let a=this.aEndAngle-this.aStartAngle;const o=Math.abs(a)<Number.EPSILON;for(;a<0;)a+=s;for(;a>s;)a-=s;a<Number.EPSILON&&(o?a=0:a=s),this.aClockwise===!0&&!o&&(a===s?a=-s:a=a-s);const r=this.aStartAngle+t*a;let c=this.aX+this.xRadius*Math.cos(r),l=this.aY+this.yRadius*Math.sin(r);if(this.aRotation!==0){const d=Math.cos(this.aRotation),f=Math.sin(this.aRotation),u=c-this.aX,h=l-this.aY;c=u*d-h*f+this.aX,l=u*f+h*d+this.aY}return i.set(c,l)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class M_ extends Bu{constructor(t,n,i,s,a,o){super(t,n,i,i,s,a,o),this.isArcCurve=!0,this.type="ArcCurve"}}function Gu(){let e=0,t=0,n=0,i=0;function s(a,o,r,c){e=a,t=r,n=-3*a+3*o-2*r-c,i=2*a-2*o+r+c}return{initCatmullRom:function(a,o,r,c,l){s(o,r,l*(r-a),l*(c-o))},initNonuniformCatmullRom:function(a,o,r,c,l,d,f){let u=(o-a)/l-(r-a)/(l+d)+(r-o)/d,h=(r-o)/d-(c-o)/(d+f)+(c-r)/f;u*=d,h*=d,s(o,r,u,h)},calc:function(a){const o=a*a,r=o*a;return e+t*a+n*o+i*r}}}const nh=new q,ih=new q,gd=new Gu,_d=new Gu,vd=new Gu;class km extends gi{constructor(t=[],n=!1,i="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=n,this.curveType=i,this.tension=s}getPoint(t,n=new q){const i=n,s=this.points,a=s.length,o=(a-(this.closed?0:1))*t;let r=Math.floor(o),c=o-r;this.closed?r+=r>0?0:(Math.floor(Math.abs(r)/a)+1)*a:c===0&&r===a-1&&(r=a-2,c=1);let l,d;this.closed||r>0?l=s[(r-1)%a]:(ih.subVectors(s[0],s[1]).add(s[0]),l=ih);const f=s[r%a],u=s[(r+1)%a];if(this.closed||r+2<a?d=s[(r+2)%a]:(nh.subVectors(s[a-1],s[a-2]).add(s[a-1]),d=nh),this.curveType==="centripetal"||this.curveType==="chordal"){const h=this.curveType==="chordal"?.5:.25;let m=Math.pow(l.distanceToSquared(f),h),_=Math.pow(f.distanceToSquared(u),h),x=Math.pow(u.distanceToSquared(d),h);_<1e-4&&(_=1),m<1e-4&&(m=_),x<1e-4&&(x=_),gd.initNonuniformCatmullRom(l.x,f.x,u.x,d.x,m,_,x),_d.initNonuniformCatmullRom(l.y,f.y,u.y,d.y,m,_,x),vd.initNonuniformCatmullRom(l.z,f.z,u.z,d.z,m,_,x)}else this.curveType==="catmullrom"&&(gd.initCatmullRom(l.x,f.x,u.x,d.x,this.tension),_d.initCatmullRom(l.y,f.y,u.y,d.y,this.tension),vd.initCatmullRom(l.z,f.z,u.z,d.z,this.tension));return i.set(gd.calc(c),_d.calc(c),vd.calc(c)),i}copy(t){super.copy(t),this.points=[];for(let n=0,i=t.points.length;n<i;n++){const s=t.points[n];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let n=0,i=this.points.length;n<i;n++){const s=this.points[n];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let n=0,i=t.points.length;n<i;n++){const s=t.points[n];this.points.push(new q().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function sh(e,t,n,i,s){const a=(i-t)*.5,o=(s-n)*.5,r=e*e,c=e*r;return(2*n-2*i+a+o)*c+(-3*n+3*i-2*a-o)*r+a*e+n}function y_(e,t){const n=1-e;return n*n*t}function b_(e,t){return 2*(1-e)*e*t}function S_(e,t){return e*e*t}function Fo(e,t,n,i){return y_(e,t)+b_(e,n)+S_(e,i)}function w_(e,t){const n=1-e;return n*n*n*t}function E_(e,t){const n=1-e;return 3*n*n*e*t}function T_(e,t){return 3*(1-e)*e*e*t}function A_(e,t){return e*e*e*t}function Bo(e,t,n,i,s){return w_(e,t)+E_(e,n)+T_(e,i)+A_(e,s)}class Wm extends gi{constructor(t=new Ct,n=new Ct,i=new Ct,s=new Ct){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=n,this.v2=i,this.v3=s}getPoint(t,n=new Ct){const i=n,s=this.v0,a=this.v1,o=this.v2,r=this.v3;return i.set(Bo(t,s.x,a.x,o.x,r.x),Bo(t,s.y,a.y,o.y,r.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class z_ extends gi{constructor(t=new q,n=new q,i=new q,s=new q){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=n,this.v2=i,this.v3=s}getPoint(t,n=new q){const i=n,s=this.v0,a=this.v1,o=this.v2,r=this.v3;return i.set(Bo(t,s.x,a.x,o.x,r.x),Bo(t,s.y,a.y,o.y,r.y),Bo(t,s.z,a.z,o.z,r.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class Xm extends gi{constructor(t=new Ct,n=new Ct){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=n}getPoint(t,n=new Ct){const i=n;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,n){return this.getPoint(t,n)}getTangent(t,n=new Ct){return n.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,n){return this.getTangent(t,n)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class R_ extends gi{constructor(t=new q,n=new q){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=n}getPoint(t,n=new q){const i=n;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,n){return this.getPoint(t,n)}getTangent(t,n=new q){return n.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,n){return this.getTangent(t,n)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class $m extends gi{constructor(t=new Ct,n=new Ct,i=new Ct){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=n,this.v2=i}getPoint(t,n=new Ct){const i=n,s=this.v0,a=this.v1,o=this.v2;return i.set(Fo(t,s.x,a.x,o.x),Fo(t,s.y,a.y,o.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class qm extends gi{constructor(t=new q,n=new q,i=new q){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=n,this.v2=i}getPoint(t,n=new q){const i=n,s=this.v0,a=this.v1,o=this.v2;return i.set(Fo(t,s.x,a.x,o.x),Fo(t,s.y,a.y,o.y),Fo(t,s.z,a.z,o.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Ym extends gi{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,n=new Ct){const i=n,s=this.points,a=(s.length-1)*t,o=Math.floor(a),r=a-o,c=s[o===0?o:o-1],l=s[o],d=s[o>s.length-2?s.length-1:o+1],f=s[o>s.length-3?s.length-1:o+2];return i.set(sh(r,c.x,l.x,d.x,f.x),sh(r,c.y,l.y,d.y,f.y)),i}copy(t){super.copy(t),this.points=[];for(let n=0,i=t.points.length;n<i;n++){const s=t.points[n];this.points.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let n=0,i=this.points.length;n<i;n++){const s=this.points[n];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let n=0,i=t.points.length;n<i;n++){const s=t.points[n];this.points.push(new Ct().fromArray(s))}return this}}var Kc=Object.freeze({__proto__:null,ArcCurve:M_,CatmullRomCurve3:km,CubicBezierCurve:Wm,CubicBezierCurve3:z_,EllipseCurve:Bu,LineCurve:Xm,LineCurve3:R_,QuadraticBezierCurve:$m,QuadraticBezierCurve3:qm,SplineCurve:Ym});class C_ extends gi{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),n=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(n)){const i=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Kc[i](n,t))}return this}getPoint(t,n){const i=t*this.getLength(),s=this.getCurveLengths();let a=0;for(;a<s.length;){if(s[a]>=i){const o=s[a]-i,r=this.curves[a],c=r.getLength(),l=c===0?0:1-o/c;return r.getPointAt(l,n)}a++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let n=0;for(let i=0,s=this.curves.length;i<s;i++)n+=this.curves[i].getLength(),t.push(n);return this.cacheLengths=t,t}getSpacedPoints(t=40){const n=[];for(let i=0;i<=t;i++)n.push(this.getPoint(i/t));return this.autoClose&&n.push(n[0]),n}getPoints(t=12){const n=[];let i;for(let s=0,a=this.curves;s<a.length;s++){const o=a[s],r=o.isEllipseCurve?t*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?t*o.points.length:t,c=o.getPoints(r);for(let l=0;l<c.length;l++){const d=c[l];i&&i.equals(d)||(n.push(d),i=d)}}return this.autoClose&&n.length>1&&!n[n.length-1].equals(n[0])&&n.push(n[0]),n}copy(t){super.copy(t),this.curves=[];for(let n=0,i=t.curves.length;n<i;n++){const s=t.curves[n];this.curves.push(s.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let n=0,i=this.curves.length;n<i;n++){const s=this.curves[n];t.curves.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let n=0,i=t.curves.length;n<i;n++){const s=t.curves[n];this.curves.push(new Kc[s.type]().fromJSON(s))}return this}}class ar extends C_{constructor(t){super(),this.type="Path",this.currentPoint=new Ct,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let n=1,i=t.length;n<i;n++)this.lineTo(t[n].x,t[n].y);return this}moveTo(t,n){return this.currentPoint.set(t,n),this}lineTo(t,n){const i=new Xm(this.currentPoint.clone(),new Ct(t,n));return this.curves.push(i),this.currentPoint.set(t,n),this}quadraticCurveTo(t,n,i,s){const a=new $m(this.currentPoint.clone(),new Ct(t,n),new Ct(i,s));return this.curves.push(a),this.currentPoint.set(i,s),this}bezierCurveTo(t,n,i,s,a,o){const r=new Wm(this.currentPoint.clone(),new Ct(t,n),new Ct(i,s),new Ct(a,o));return this.curves.push(r),this.currentPoint.set(a,o),this}splineThru(t){const n=[this.currentPoint.clone()].concat(t),i=new Ym(n);return this.curves.push(i),this.currentPoint.copy(t[t.length-1]),this}arc(t,n,i,s,a,o){const r=this.currentPoint.x,c=this.currentPoint.y;return this.absarc(t+r,n+c,i,s,a,o),this}absarc(t,n,i,s,a,o){return this.absellipse(t,n,i,i,s,a,o),this}ellipse(t,n,i,s,a,o,r,c){const l=this.currentPoint.x,d=this.currentPoint.y;return this.absellipse(t+l,n+d,i,s,a,o,r,c),this}absellipse(t,n,i,s,a,o,r,c){const l=new Bu(t,n,i,s,a,o,r,c);if(this.curves.length>0){const f=l.getPoint(0);f.equals(this.currentPoint)||this.lineTo(f.x,f.y)}this.curves.push(l);const d=l.getPoint(1);return this.currentPoint.copy(d),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class ls extends ar{constructor(t){super(t),this.uuid=qa(),this.type="Shape",this.holes=[]}getPointsHoles(t){const n=[];for(let i=0,s=this.holes.length;i<s;i++)n[i]=this.holes[i].getPoints(t);return n}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let n=0,i=t.holes.length;n<i;n++){const s=t.holes[n];this.holes.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let n=0,i=this.holes.length;n<i;n++){const s=this.holes[n];t.holes.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let n=0,i=t.holes.length;n<i;n++){const s=t.holes[n];this.holes.push(new ar().fromJSON(s))}return this}}function P_(e,t,n=2){const i=t&&t.length,s=i?t[0]*n:e.length;let a=Zm(e,0,s,n,!0);const o=[];if(!a||a.next===a.prev)return o;let r,c,l;if(i&&(a=U_(e,t,a,n)),e.length>80*n){r=e[0],c=e[1];let d=r,f=c;for(let u=n;u<s;u+=n){const h=e[u],m=e[u+1];h<r&&(r=h),m<c&&(c=m),h>d&&(d=h),m>f&&(f=m)}l=Math.max(d-r,f-c),l=l!==0?32767/l:0}return or(a,o,n,r,c,l,0),o}function Zm(e,t,n,i,s){let a;if(s===q_(e,t,n,i)>0)for(let o=t;o<n;o+=i)a=ah(o/i|0,e[o],e[o+1],a);else for(let o=n-i;o>=t;o-=i)a=ah(o/i|0,e[o],e[o+1],a);return a&&Va(a,a.next)&&(cr(a),a=a.next),a}function Os(e,t){if(!e)return e;t||(t=e);let n=e,i;do if(i=!1,!n.steiner&&(Va(n,n.next)||ze(n.prev,n,n.next)===0)){if(cr(n),n=t=n.prev,n===n.next)break;i=!0}else n=n.next;while(i||n!==t);return t}function or(e,t,n,i,s,a,o){if(!e)return;!o&&a&&H_(e,i,s,a);let r=e;for(;e.prev!==e.next;){const c=e.prev,l=e.next;if(a?I_(e,i,s,a):L_(e)){t.push(c.i,e.i,l.i),cr(e),e=l.next,r=l.next;continue}if(e=l,e===r){o?o===1?(e=D_(Os(e),t),or(e,t,n,i,s,a,2)):o===2&&N_(e,t,n,i,s,a):or(Os(e),t,n,i,s,a,1);break}}}function L_(e){const t=e.prev,n=e,i=e.next;if(ze(t,n,i)>=0)return!1;const s=t.x,a=n.x,o=i.x,r=t.y,c=n.y,l=i.y,d=Math.min(s,a,o),f=Math.min(r,c,l),u=Math.max(s,a,o),h=Math.max(r,c,l);let m=i.next;for(;m!==t;){if(m.x>=d&&m.x<=u&&m.y>=f&&m.y<=h&&To(s,r,a,c,o,l,m.x,m.y)&&ze(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function I_(e,t,n,i){const s=e.prev,a=e,o=e.next;if(ze(s,a,o)>=0)return!1;const r=s.x,c=a.x,l=o.x,d=s.y,f=a.y,u=o.y,h=Math.min(r,c,l),m=Math.min(d,f,u),_=Math.max(r,c,l),x=Math.max(d,f,u),p=Gf(h,m,t,n,i),v=Gf(_,x,t,n,i);let y=e.prevZ,g=e.nextZ;for(;y&&y.z>=p&&g&&g.z<=v;){if(y.x>=h&&y.x<=_&&y.y>=m&&y.y<=x&&y!==s&&y!==o&&To(r,d,c,f,l,u,y.x,y.y)&&ze(y.prev,y,y.next)>=0||(y=y.prevZ,g.x>=h&&g.x<=_&&g.y>=m&&g.y<=x&&g!==s&&g!==o&&To(r,d,c,f,l,u,g.x,g.y)&&ze(g.prev,g,g.next)>=0))return!1;g=g.nextZ}for(;y&&y.z>=p;){if(y.x>=h&&y.x<=_&&y.y>=m&&y.y<=x&&y!==s&&y!==o&&To(r,d,c,f,l,u,y.x,y.y)&&ze(y.prev,y,y.next)>=0)return!1;y=y.prevZ}for(;g&&g.z<=v;){if(g.x>=h&&g.x<=_&&g.y>=m&&g.y<=x&&g!==s&&g!==o&&To(r,d,c,f,l,u,g.x,g.y)&&ze(g.prev,g,g.next)>=0)return!1;g=g.nextZ}return!0}function D_(e,t){let n=e;do{const i=n.prev,s=n.next.next;!Va(i,s)&&Jm(i,n,n.next,s)&&rr(i,s)&&rr(s,i)&&(t.push(i.i,n.i,s.i),cr(n),cr(n.next),n=e=s),n=n.next}while(n!==e);return Os(n)}function N_(e,t,n,i,s,a){let o=e;do{let r=o.next.next;for(;r!==o.prev;){if(o.i!==r.i&&W_(o,r)){let c=Qm(o,r);o=Os(o,o.next),c=Os(c,c.next),or(o,t,n,i,s,a,0),or(c,t,n,i,s,a,0);return}r=r.next}o=o.next}while(o!==e)}function U_(e,t,n,i){const s=[];for(let a=0,o=t.length;a<o;a++){const r=t[a]*i,c=a<o-1?t[a+1]*i:e.length,l=Zm(e,r,c,i,!1);l===l.next&&(l.steiner=!0),s.push(k_(l))}s.sort(O_);for(let a=0;a<s.length;a++)n=F_(s[a],n);return n}function O_(e,t){let n=e.x-t.x;if(n===0&&(n=e.y-t.y,n===0)){const i=(e.next.y-e.y)/(e.next.x-e.x),s=(t.next.y-t.y)/(t.next.x-t.x);n=i-s}return n}function F_(e,t){const n=B_(e,t);if(!n)return t;const i=Qm(n,e);return Os(i,i.next),Os(n,n.next)}function B_(e,t){let n=t;const i=e.x,s=e.y;let a=-1/0,o;if(Va(e,n))return n;do{if(Va(e,n.next))return n.next;if(s<=n.y&&s>=n.next.y&&n.next.y!==n.y){const f=n.x+(s-n.y)*(n.next.x-n.x)/(n.next.y-n.y);if(f<=i&&f>a&&(a=f,o=n.x<n.next.x?n:n.next,f===i))return o}n=n.next}while(n!==t);if(!o)return null;const r=o,c=o.x,l=o.y;let d=1/0;n=o;do{if(i>=n.x&&n.x>=c&&i!==n.x&&Km(s<l?i:a,s,c,l,s<l?a:i,s,n.x,n.y)){const f=Math.abs(s-n.y)/(i-n.x);rr(n,e)&&(f<d||f===d&&(n.x>o.x||n.x===o.x&&G_(o,n)))&&(o=n,d=f)}n=n.next}while(n!==r);return o}function G_(e,t){return ze(e.prev,e,t.prev)<0&&ze(t.next,e,e.next)<0}function H_(e,t,n,i){let s=e;do s.z===0&&(s.z=Gf(s.x,s.y,t,n,i)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==e);s.prevZ.nextZ=null,s.prevZ=null,V_(s)}function V_(e){let t,n=1;do{let i=e,s;e=null;let a=null;for(t=0;i;){t++;let o=i,r=0;for(let l=0;l<n&&(r++,o=o.nextZ,!!o);l++);let c=n;for(;r>0||c>0&&o;)r!==0&&(c===0||!o||i.z<=o.z)?(s=i,i=i.nextZ,r--):(s=o,o=o.nextZ,c--),a?a.nextZ=s:e=s,s.prevZ=a,a=s;i=o}a.nextZ=null,n*=2}while(t>1);return e}function Gf(e,t,n,i,s){return e=(e-n)*s|0,t=(t-i)*s|0,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,e|t<<1}function k_(e){let t=e,n=e;do(t.x<n.x||t.x===n.x&&t.y<n.y)&&(n=t),t=t.next;while(t!==e);return n}function Km(e,t,n,i,s,a,o,r){return(s-o)*(t-r)>=(e-o)*(a-r)&&(e-o)*(i-r)>=(n-o)*(t-r)&&(n-o)*(a-r)>=(s-o)*(i-r)}function To(e,t,n,i,s,a,o,r){return!(e===o&&t===r)&&Km(e,t,n,i,s,a,o,r)}function W_(e,t){return e.next.i!==t.i&&e.prev.i!==t.i&&!X_(e,t)&&(rr(e,t)&&rr(t,e)&&$_(e,t)&&(ze(e.prev,e,t.prev)||ze(e,t.prev,t))||Va(e,t)&&ze(e.prev,e,e.next)>0&&ze(t.prev,t,t.next)>0)}function ze(e,t,n){return(t.y-e.y)*(n.x-t.x)-(t.x-e.x)*(n.y-t.y)}function Va(e,t){return e.x===t.x&&e.y===t.y}function Jm(e,t,n,i){const s=nc(ze(e,t,n)),a=nc(ze(e,t,i)),o=nc(ze(n,i,e)),r=nc(ze(n,i,t));return!!(s!==a&&o!==r||s===0&&ec(e,n,t)||a===0&&ec(e,i,t)||o===0&&ec(n,e,i)||r===0&&ec(n,t,i))}function ec(e,t,n){return t.x<=Math.max(e.x,n.x)&&t.x>=Math.min(e.x,n.x)&&t.y<=Math.max(e.y,n.y)&&t.y>=Math.min(e.y,n.y)}function nc(e){return e>0?1:e<0?-1:0}function X_(e,t){let n=e;do{if(n.i!==e.i&&n.next.i!==e.i&&n.i!==t.i&&n.next.i!==t.i&&Jm(n,n.next,e,t))return!0;n=n.next}while(n!==e);return!1}function rr(e,t){return ze(e.prev,e,e.next)<0?ze(e,t,e.next)>=0&&ze(e,e.prev,t)>=0:ze(e,t,e.prev)<0||ze(e,e.next,t)<0}function $_(e,t){let n=e,i=!1;const s=(e.x+t.x)/2,a=(e.y+t.y)/2;do n.y>a!=n.next.y>a&&n.next.y!==n.y&&s<(n.next.x-n.x)*(a-n.y)/(n.next.y-n.y)+n.x&&(i=!i),n=n.next;while(n!==e);return i}function Qm(e,t){const n=Hf(e.i,e.x,e.y),i=Hf(t.i,t.x,t.y),s=e.next,a=t.prev;return e.next=t,t.prev=e,n.next=s,s.prev=n,i.next=n,n.prev=i,a.next=i,i.prev=a,i}function ah(e,t,n,i){const s=Hf(e,t,n);return i?(s.next=i.next,s.prev=i,i.next.prev=s,i.next=s):(s.prev=s,s.next=s),s}function cr(e){e.next.prev=e.prev,e.prev.next=e.next,e.prevZ&&(e.prevZ.nextZ=e.nextZ),e.nextZ&&(e.nextZ.prevZ=e.prevZ)}function Hf(e,t,n){return{i:e,x:t,y:n,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function q_(e,t,n,i){let s=0;for(let a=t,o=n-i;a<n;a+=i)s+=(e[o]-e[a])*(e[a+1]+e[o+1]),o=a;return s}class Y_{static triangulate(t,n,i=2){return P_(t,n,i)}}class Ci{static area(t){const n=t.length;let i=0;for(let s=n-1,a=0;a<n;s=a++)i+=t[s].x*t[a].y-t[a].x*t[s].y;return i*.5}static isClockWise(t){return Ci.area(t)<0}static triangulateShape(t,n){const i=[],s=[],a=[];oh(t),rh(i,t);let o=t.length;n.forEach(oh);for(let c=0;c<n.length;c++)s.push(o),o+=n[c].length,rh(i,n[c]);const r=Y_.triangulate(i,s);for(let c=0;c<r.length;c+=3)a.push(r.slice(c,c+3));return a}}function oh(e){const t=e.length;t>2&&e[t-1].equals(e[0])&&e.pop()}function rh(e,t){for(let n=0;n<t.length;n++)e.push(t[n].x),e.push(t[n].y)}class Zs extends Ne{constructor(t=new ls([new Ct(.5,.5),new Ct(-.5,.5),new Ct(-.5,-.5),new Ct(.5,-.5)]),n={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:n},t=Array.isArray(t)?t:[t];const i=this,s=[],a=[];for(let r=0,c=t.length;r<c;r++){const l=t[r];o(l)}this.setAttribute("position",new le(s,3)),this.setAttribute("uv",new le(a,2)),this.computeVertexNormals();function o(r){const c=[],l=n.curveSegments!==void 0?n.curveSegments:12,d=n.steps!==void 0?n.steps:1,f=n.depth!==void 0?n.depth:1;let u=n.bevelEnabled!==void 0?n.bevelEnabled:!0,h=n.bevelThickness!==void 0?n.bevelThickness:.2,m=n.bevelSize!==void 0?n.bevelSize:h-.1,_=n.bevelOffset!==void 0?n.bevelOffset:0,x=n.bevelSegments!==void 0?n.bevelSegments:3;const p=n.extrudePath,v=n.UVGenerator!==void 0?n.UVGenerator:Z_;let y,g=!1,b,w,T,M;if(p){y=p.getSpacedPoints(d),g=!0,u=!1;const lt=p.isCatmullRomCurve3?p.closed:!1;b=p.computeFrenetFrames(d,lt),w=new q,T=new q,M=new q}u||(x=0,h=0,m=0,_=0);const E=r.extractPoints(l);let A=E.shape;const C=E.holes;if(!Ci.isClockWise(A)){A=A.reverse();for(let lt=0,pt=C.length;lt<pt;lt++){const xt=C[lt];Ci.isClockWise(xt)&&(C[lt]=xt.reverse())}}function U(lt){const xt=10000000000000001e-36;let yt=lt[0];for(let j=1;j<=lt.length;j++){const wt=j%lt.length,Pt=lt[wt],bt=Pt.x-yt.x,Zt=Pt.y-yt.y,G=bt*bt+Zt*Zt,Q=Math.max(Math.abs(Pt.x),Math.abs(Pt.y),Math.abs(yt.x),Math.abs(yt.y)),ut=xt*Q*Q;if(G<=ut){lt.splice(wt,1),j--;continue}yt=Pt}}U(A),C.forEach(U);const P=C.length,O=A;for(let lt=0;lt<P;lt++){const pt=C[lt];A=A.concat(pt)}function V(lt,pt,xt){return pt||ce("ExtrudeGeometry: vec does not exist"),lt.clone().addScaledVector(pt,xt)}const N=A.length;function F(lt,pt,xt){let yt,j,wt;const Pt=lt.x-pt.x,bt=lt.y-pt.y,Zt=xt.x-lt.x,G=xt.y-lt.y,Q=Pt*Pt+bt*bt,ut=Pt*G-bt*Zt;if(Math.abs(ut)>Number.EPSILON){const R=Math.sqrt(Q),S=Math.sqrt(Zt*Zt+G*G),X=pt.x-bt/R,K=pt.y+Pt/R,tt=xt.x-G/S,_t=xt.y+Zt/S,St=((tt-X)*G-(_t-K)*Zt)/(Pt*G-bt*Zt);yt=X+Pt*St-lt.x,j=K+bt*St-lt.y;const ct=yt*yt+j*j;if(ct<=2)return new Ct(yt,j);wt=Math.sqrt(ct/2)}else{let R=!1;Pt>Number.EPSILON?Zt>Number.EPSILON&&(R=!0):Pt<-Number.EPSILON?Zt<-Number.EPSILON&&(R=!0):Math.sign(bt)===Math.sign(G)&&(R=!0),R?(yt=-bt,j=Pt,wt=Math.sqrt(Q)):(yt=Pt,j=bt,wt=Math.sqrt(Q/2))}return new Ct(yt/wt,j/wt)}const L=[];for(let lt=0,pt=O.length,xt=pt-1,yt=lt+1;lt<pt;lt++,xt++,yt++)xt===pt&&(xt=0),yt===pt&&(yt=0),L[lt]=F(O[lt],O[xt],O[yt]);const B=[];let $,J=L.concat();for(let lt=0,pt=P;lt<pt;lt++){const xt=C[lt];$=[];for(let yt=0,j=xt.length,wt=j-1,Pt=yt+1;yt<j;yt++,wt++,Pt++)wt===j&&(wt=0),Pt===j&&(Pt=0),$[yt]=F(xt[yt],xt[wt],xt[Pt]);B.push($),J=J.concat($)}let st;if(x===0)st=Ci.triangulateShape(O,C);else{const lt=[],pt=[];for(let xt=0;xt<x;xt++){const yt=xt/x,j=h*Math.cos(yt*Math.PI/2),wt=m*Math.sin(yt*Math.PI/2)+_;for(let Pt=0,bt=O.length;Pt<bt;Pt++){const Zt=V(O[Pt],L[Pt],wt);at(Zt.x,Zt.y,-j),yt===0&&lt.push(Zt)}for(let Pt=0,bt=P;Pt<bt;Pt++){const Zt=C[Pt];$=B[Pt];const G=[];for(let Q=0,ut=Zt.length;Q<ut;Q++){const R=V(Zt[Q],$[Q],wt);at(R.x,R.y,-j),yt===0&&G.push(R)}yt===0&&pt.push(G)}}st=Ci.triangulateShape(lt,pt)}const Tt=st.length,H=m+_;for(let lt=0;lt<N;lt++){const pt=u?V(A[lt],J[lt],H):A[lt];g?(T.copy(b.normals[0]).multiplyScalar(pt.x),w.copy(b.binormals[0]).multiplyScalar(pt.y),M.copy(y[0]).add(T).add(w),at(M.x,M.y,M.z)):at(pt.x,pt.y,0)}for(let lt=1;lt<=d;lt++)for(let pt=0;pt<N;pt++){const xt=u?V(A[pt],J[pt],H):A[pt];g?(T.copy(b.normals[lt]).multiplyScalar(xt.x),w.copy(b.binormals[lt]).multiplyScalar(xt.y),M.copy(y[lt]).add(T).add(w),at(M.x,M.y,M.z)):at(xt.x,xt.y,f/d*lt)}for(let lt=x-1;lt>=0;lt--){const pt=lt/x,xt=h*Math.cos(pt*Math.PI/2),yt=m*Math.sin(pt*Math.PI/2)+_;for(let j=0,wt=O.length;j<wt;j++){const Pt=V(O[j],L[j],yt);at(Pt.x,Pt.y,f+xt)}for(let j=0,wt=C.length;j<wt;j++){const Pt=C[j];$=B[j];for(let bt=0,Zt=Pt.length;bt<Zt;bt++){const G=V(Pt[bt],$[bt],yt);g?at(G.x,G.y+y[d-1].y,y[d-1].x+xt):at(G.x,G.y,f+xt)}}}et(),W();function et(){const lt=s.length/3;if(u){let pt=0,xt=N*pt;for(let yt=0;yt<Tt;yt++){const j=st[yt];mt(j[2]+xt,j[1]+xt,j[0]+xt)}pt=d+x*2,xt=N*pt;for(let yt=0;yt<Tt;yt++){const j=st[yt];mt(j[0]+xt,j[1]+xt,j[2]+xt)}}else{for(let pt=0;pt<Tt;pt++){const xt=st[pt];mt(xt[2],xt[1],xt[0])}for(let pt=0;pt<Tt;pt++){const xt=st[pt];mt(xt[0]+N*d,xt[1]+N*d,xt[2]+N*d)}}i.addGroup(lt,s.length/3-lt,0)}function W(){const lt=s.length/3;let pt=0;k(O,pt),pt+=O.length;for(let xt=0,yt=C.length;xt<yt;xt++){const j=C[xt];k(j,pt),pt+=j.length}i.addGroup(lt,s.length/3-lt,1)}function k(lt,pt){let xt=lt.length;for(;--xt>=0;){const yt=xt;let j=xt-1;j<0&&(j=lt.length-1);for(let wt=0,Pt=d+x*2;wt<Pt;wt++){const bt=N*wt,Zt=N*(wt+1),G=pt+yt+bt,Q=pt+j+bt,ut=pt+j+Zt,R=pt+yt+Zt;rt(G,Q,ut,R)}}}function at(lt,pt,xt){c.push(lt),c.push(pt),c.push(xt)}function mt(lt,pt,xt){Mt(lt),Mt(pt),Mt(xt);const yt=s.length/3,j=v.generateTopUV(i,s,yt-3,yt-2,yt-1);Kt(j[0]),Kt(j[1]),Kt(j[2])}function rt(lt,pt,xt,yt){Mt(lt),Mt(pt),Mt(yt),Mt(pt),Mt(xt),Mt(yt);const j=s.length/3,wt=v.generateSideWallUV(i,s,j-6,j-3,j-2,j-1);Kt(wt[0]),Kt(wt[1]),Kt(wt[3]),Kt(wt[1]),Kt(wt[2]),Kt(wt[3])}function Mt(lt){s.push(c[lt*3+0]),s.push(c[lt*3+1]),s.push(c[lt*3+2])}function Kt(lt){a.push(lt.x),a.push(lt.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),n=this.parameters.shapes,i=this.parameters.options;return K_(n,i,t)}static fromJSON(t,n){const i=[];for(let a=0,o=t.shapes.length;a<o;a++){const r=n[t.shapes[a]];i.push(r)}const s=t.options.extrudePath;return s!==void 0&&(t.options.extrudePath=new Kc[s.type]().fromJSON(s)),new Zs(i,t.options)}}const Z_={generateTopUV:function(e,t,n,i,s){const a=t[n*3],o=t[n*3+1],r=t[i*3],c=t[i*3+1],l=t[s*3],d=t[s*3+1];return[new Ct(a,o),new Ct(r,c),new Ct(l,d)]},generateSideWallUV:function(e,t,n,i,s,a){const o=t[n*3],r=t[n*3+1],c=t[n*3+2],l=t[i*3],d=t[i*3+1],f=t[i*3+2],u=t[s*3],h=t[s*3+1],m=t[s*3+2],_=t[a*3],x=t[a*3+1],p=t[a*3+2];return Math.abs(r-d)<Math.abs(o-l)?[new Ct(o,1-c),new Ct(l,1-f),new Ct(u,1-m),new Ct(_,1-p)]:[new Ct(r,1-c),new Ct(d,1-f),new Ct(h,1-m),new Ct(x,1-p)]}};function K_(e,t,n){if(n.shapes=[],Array.isArray(e))for(let i=0,s=e.length;i<s;i++){const a=e[i];n.shapes.push(a.uuid)}else n.shapes.push(e.uuid);return n.options=Object.assign({},t),t.extrudePath!==void 0&&(n.options.extrudePath=t.extrudePath.toJSON()),n}class Al extends Ne{constructor(t=1,n=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:n,widthSegments:i,heightSegments:s};const a=t/2,o=n/2,r=Math.floor(i),c=Math.floor(s),l=r+1,d=c+1,f=t/r,u=n/c,h=[],m=[],_=[],x=[];for(let p=0;p<d;p++){const v=p*u-o;for(let y=0;y<l;y++){const g=y*f-a;m.push(g,-v,0),_.push(0,0,1),x.push(y/r),x.push(1-p/c)}}for(let p=0;p<c;p++)for(let v=0;v<r;v++){const y=v+l*p,g=v+l*(p+1),b=v+1+l*(p+1),w=v+1+l*p;h.push(y,g,w),h.push(g,b,w)}this.setIndex(h),this.setAttribute("position",new le(m,3)),this.setAttribute("normal",new le(_,3)),this.setAttribute("uv",new le(x,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Al(t.width,t.height,t.widthSegments,t.heightSegments)}}class Hu extends Ne{constructor(t=.5,n=1,i=32,s=1,a=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:n,thetaSegments:i,phiSegments:s,thetaStart:a,thetaLength:o},i=Math.max(3,i),s=Math.max(1,s);const r=[],c=[],l=[],d=[];let f=t;const u=(n-t)/s,h=new q,m=new Ct;for(let _=0;_<=s;_++){for(let x=0;x<=i;x++){const p=a+x/i*o;h.x=f*Math.cos(p),h.y=f*Math.sin(p),c.push(h.x,h.y,h.z),l.push(0,0,1),m.x=(h.x/n+1)/2,m.y=(h.y/n+1)/2,d.push(m.x,m.y)}f+=u}for(let _=0;_<s;_++){const x=_*(i+1);for(let p=0;p<i;p++){const v=p+x,y=v,g=v+i+1,b=v+i+2,w=v+1;r.push(y,g,w),r.push(g,b,w)}}this.setIndex(r),this.setAttribute("position",new le(c,3)),this.setAttribute("normal",new le(l,3)),this.setAttribute("uv",new le(d,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Hu(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class Vu extends Ne{constructor(t=new ls([new Ct(0,.5),new Ct(-.5,-.5),new Ct(.5,-.5)]),n=12){super(),this.type="ShapeGeometry",this.parameters={shapes:t,curveSegments:n};const i=[],s=[],a=[],o=[];let r=0,c=0;if(Array.isArray(t)===!1)l(t);else for(let d=0;d<t.length;d++)l(t[d]),this.addGroup(r,c,d),r+=c,c=0;this.setIndex(i),this.setAttribute("position",new le(s,3)),this.setAttribute("normal",new le(a,3)),this.setAttribute("uv",new le(o,2));function l(d){const f=s.length/3,u=d.extractPoints(n);let h=u.shape;const m=u.holes;Ci.isClockWise(h)===!1&&(h=h.reverse());for(let x=0,p=m.length;x<p;x++){const v=m[x];Ci.isClockWise(v)===!0&&(m[x]=v.reverse())}const _=Ci.triangulateShape(h,m);for(let x=0,p=m.length;x<p;x++){const v=m[x];h=h.concat(v)}for(let x=0,p=h.length;x<p;x++){const v=h[x];s.push(v.x,v.y,0),a.push(0,0,1),o.push(v.x,v.y)}for(let x=0,p=_.length;x<p;x++){const v=_[x],y=v[0]+f,g=v[1]+f,b=v[2]+f;i.push(y,g,b),c+=3}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),n=this.parameters.shapes;return J_(n,t)}static fromJSON(t,n){const i=[];for(let s=0,a=t.shapes.length;s<a;s++){const o=n[t.shapes[s]];i.push(o)}return new Vu(i,t.curveSegments)}}function J_(e,t){if(t.shapes=[],Array.isArray(e))for(let n=0,i=e.length;n<i;n++){const s=e[n];t.shapes.push(s.uuid)}else t.shapes.push(e.uuid);return t}class Jc extends Ne{constructor(t=1,n=32,i=16,s=0,a=Math.PI*2,o=0,r=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:n,heightSegments:i,phiStart:s,phiLength:a,thetaStart:o,thetaLength:r},n=Math.max(3,Math.floor(n)),i=Math.max(2,Math.floor(i));const c=Math.min(o+r,Math.PI);let l=0;const d=[],f=new q,u=new q,h=[],m=[],_=[],x=[];for(let p=0;p<=i;p++){const v=[],y=p/i,g=o+y*r,b=t*Math.cos(g),w=Math.sqrt(t*t-b*b);let T=0;p===0&&o===0?T=.5/n:p===i&&c===Math.PI&&(T=-.5/n);for(let M=0;M<=n;M++){const E=M/n,A=s+E*a;f.x=-w*Math.cos(A),f.y=b,f.z=w*Math.sin(A),m.push(f.x,f.y,f.z),u.copy(f).normalize(),_.push(u.x,u.y,u.z),x.push(E+T,1-y),v.push(l++)}d.push(v)}for(let p=0;p<i;p++)for(let v=0;v<n;v++){const y=d[p][v+1],g=d[p][v],b=d[p+1][v],w=d[p+1][v+1];(p!==0||o>0)&&h.push(y,g,w),(p!==i-1||c<Math.PI)&&h.push(g,b,w)}this.setIndex(h),this.setAttribute("position",new le(m,3)),this.setAttribute("normal",new le(_,3)),this.setAttribute("uv",new le(x,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Jc(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class mr extends Ne{constructor(t=1,n=.4,i=12,s=48,a=Math.PI*2,o=0,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:n,radialSegments:i,tubularSegments:s,arc:a,thetaStart:o,thetaLength:r},i=Math.floor(i),s=Math.floor(s);const c=[],l=[],d=[],f=[],u=new q,h=new q,m=new q;for(let _=0;_<=i;_++){const x=o+_/i*r;for(let p=0;p<=s;p++){const v=p/s*a;h.x=(t+n*Math.cos(x))*Math.cos(v),h.y=(t+n*Math.cos(x))*Math.sin(v),h.z=n*Math.sin(x),l.push(h.x,h.y,h.z),u.x=t*Math.cos(v),u.y=t*Math.sin(v),m.subVectors(h,u).normalize(),d.push(m.x,m.y,m.z),f.push(p/s),f.push(_/i)}}for(let _=1;_<=i;_++)for(let x=1;x<=s;x++){const p=(s+1)*_+x-1,v=(s+1)*(_-1)+x-1,y=(s+1)*(_-1)+x,g=(s+1)*_+x;c.push(p,v,g),c.push(v,y,g)}this.setIndex(c),this.setAttribute("position",new le(l,3)),this.setAttribute("normal",new le(d,3)),this.setAttribute("uv",new le(f,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new mr(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc,t.thetaStart,t.thetaLength)}}class ku extends Ne{constructor(t=new qm(new q(-1,-1,0),new q(-1,1,0),new q(1,1,0)),n=64,i=1,s=8,a=!1){super(),this.type="TubeGeometry",this.parameters={path:t,tubularSegments:n,radius:i,radialSegments:s,closed:a};const o=t.computeFrenetFrames(n,a);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;const r=new q,c=new q,l=new Ct;let d=new q;const f=[],u=[],h=[],m=[];_(),this.setIndex(m),this.setAttribute("position",new le(f,3)),this.setAttribute("normal",new le(u,3)),this.setAttribute("uv",new le(h,2));function _(){for(let y=0;y<n;y++)x(y);x(a===!1?n:0),v(),p()}function x(y){d=t.getPointAt(y/n,d);const g=o.normals[y],b=o.binormals[y];for(let w=0;w<=s;w++){const T=w/s*Math.PI*2,M=Math.sin(T),E=-Math.cos(T);c.x=E*g.x+M*b.x,c.y=E*g.y+M*b.y,c.z=E*g.z+M*b.z,c.normalize(),u.push(c.x,c.y,c.z),r.x=d.x+i*c.x,r.y=d.y+i*c.y,r.z=d.z+i*c.z,f.push(r.x,r.y,r.z)}}function p(){for(let y=1;y<=n;y++)for(let g=1;g<=s;g++){const b=(s+1)*(y-1)+(g-1),w=(s+1)*y+(g-1),T=(s+1)*y+g,M=(s+1)*(y-1)+g;m.push(b,w,M),m.push(w,T,M)}}function v(){for(let y=0;y<=n;y++)for(let g=0;g<=s;g++)l.x=y/n,l.y=g/s,h.push(l.x,l.y)}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON();return t.path=this.parameters.path.toJSON(),t}static fromJSON(t){return new ku(new Kc[t.path.type]().fromJSON(t.path),t.tubularSegments,t.radius,t.radialSegments,t.closed)}}function ka(e){const t={};for(const n in e){t[n]={};for(const i in e[n]){const s=e[n][i];if(ch(s))s.isRenderTargetTexture?(Qt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[n][i]=null):t[n][i]=s.clone();else if(Array.isArray(s))if(ch(s[0])){const a=[];for(let o=0,r=s.length;o<r;o++)a[o]=s[o].clone();t[n][i]=a}else t[n][i]=s.slice();else t[n][i]=s}}return t}function cn(e){const t={};for(let n=0;n<e.length;n++){const i=ka(e[n]);for(const s in i)t[s]=i[s]}return t}function ch(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function Q_(e){const t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function jm(e){const t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:oe.workingColorSpace}const j_={clone:ka,merge:cn};var tv=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,ev=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class hi extends Ka{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=tv,this.fragmentShader=ev,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=ka(t.uniforms),this.uniformsGroups=Q_(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){const n=super.toJSON(t);n.glslVersion=this.glslVersion,n.uniforms={};for(const s in this.uniforms){const o=this.uniforms[s].value;o&&o.isTexture?n.uniforms[s]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?n.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?n.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?n.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?n.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?n.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?n.uniforms[s]={type:"m4",value:o.toArray()}:n.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(n.defines=this.defines),n.vertexShader=this.vertexShader,n.fragmentShader=this.fragmentShader,n.lights=this.lights,n.clipping=this.clipping;const i={};for(const s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(n.extensions=i),n}fromJSON(t,n){if(super.fromJSON(t,n),t.uniforms!==void 0)for(const i in t.uniforms){const s=t.uniforms[i];switch(this.uniforms[i]={},s.type){case"t":this.uniforms[i].value=n[s.value]||null;break;case"c":this.uniforms[i].value=new ee().setHex(s.value);break;case"v2":this.uniforms[i].value=new Ct().fromArray(s.value);break;case"v3":this.uniforms[i].value=new q().fromArray(s.value);break;case"v4":this.uniforms[i].value=new Ae().fromArray(s.value);break;case"m3":this.uniforms[i].value=new te().fromArray(s.value);break;case"m4":this.uniforms[i].value=new Ee().fromArray(s.value);break;default:this.uniforms[i].value=s.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(const i in t.extensions)this.extensions[i]=t.extensions[i];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}}class nv extends hi{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class lr extends Ka{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new ee(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ee(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=$c,this.normalScale=new Ct(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Gi,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class tx extends Ka{constructor(t){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new ee(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ee(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=$c,this.normalScale=new Ct(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Gi,this.combine=Tu,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.envMapIntensity=t.envMapIntensity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class iv extends Ka{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=D1,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class sv extends Ka{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}class Wu extends qe{constructor(t,n=1){super(),this.isLight=!0,this.type="Light",this.color=new ee(t),this.intensity=n}copy(t,n){return super.copy(t,n),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const n=super.toJSON(t);return n.object.color=this.color.getHex(),n.object.intensity=this.intensity,n}}class av extends Wu{constructor(t,n,i){super(t,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(qe.DEFAULT_UP),this.updateMatrix(),this.groundColor=new ee(n)}copy(t,n){return super.copy(t,n),this.groundColor.copy(t.groundColor),this}toJSON(t){const n=super.toJSON(t);return n.object.groundColor=this.groundColor.getHex(),n}}const Md=new Ee,lh=new q,dh=new q;class ex{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Ct(512,512),this.mapType=wn,this.map=null,this.mapPass=null,this.matrix=new Ee,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ou,this._frameExtents=new Ct(1,1),this._viewportCount=1,this._viewports=[new Ae(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(t){const n=this.camera;lh.setFromMatrixPosition(t.matrixWorld),n.position.copy(lh),dh.setFromMatrixPosition(t.target.matrixWorld),n.lookAt(dh),n.updateMatrixWorld(),this._updateMatrix(n,this.matrix,this._frustum)}_updateMatrix(t,n,i,s){Md.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),i.setFromProjectionMatrix(Md,t.coordinateSystem,t.reversedDepth);const a=this._frameExtents,o=s?s.z/a.x:1,r=s?s.w/a.y:1,c=s?s.x/a.x:0,l=s?s.y/a.y:0;t.coordinateSystem===ir||t.reversedDepth?n.set(.5*o,0,0,.5*o+c,0,.5*r,0,.5*r+l,0,0,1,0,0,0,0,1):n.set(.5*o,0,0,.5*o+c,0,.5*r,0,.5*r+l,0,0,.5,.5,0,0,0,1),n.multiply(Md)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return t.intensity=this.intensity,t.bias=this.bias,t.normalBias=this.normalBias,t.radius=this.radius,t.blurSamples=this.blurSamples,t.mapSize=this.mapSize.toArray(),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}const ic=new q,sc=new Ya,ei=new q;class nx extends qe{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Ee,this.projectionMatrix=new Ee,this.projectionMatrixInverse=new Ee,this.coordinateSystem=ri,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,n){return super.copy(t,n),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(ic,sc,ei),ei.x===1&&ei.y===1&&ei.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ic,sc,ei.set(1,1,1)).invert()}updateWorldMatrix(t,n,i=!1){super.updateWorldMatrix(t,n,i),this.matrixWorld.decompose(ic,sc,ei),ei.x===1&&ei.y===1&&ei.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ic,sc,ei.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const Zi=new q,fh=new Ct,uh=new Ct;class Nn extends nx{constructor(t=50,n=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=n,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,n){return super.copy(t,n),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const n=.5*this.getFilmHeight()/t;this.fov=Bf*2*Math.atan(n),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(Zl*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Bf*2*Math.atan(Math.tan(Zl*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,n,i){Zi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Zi.x,Zi.y).multiplyScalar(-t/Zi.z),Zi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Zi.x,Zi.y).multiplyScalar(-t/Zi.z)}getViewSize(t,n){return this.getViewBounds(t,fh,uh),n.subVectors(uh,fh)}setViewOffset(t,n,i,s,a,o){this.aspect=t/n,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=s,this.view.width=a,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let n=t*Math.tan(Zl*.5*this.fov)/this.zoom,i=2*n,s=this.aspect*i,a=-.5*s;const o=this.view;if(this.view!==null&&this.view.enabled){const c=o.fullWidth,l=o.fullHeight;a+=o.offsetX*s/c,n-=o.offsetY*i/l,s*=o.width/c,i*=o.height/l}const r=this.filmOffset;r!==0&&(a+=t*r/this.getFilmWidth()),this.projectionMatrix.makePerspective(a,a+s,n,n-i,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const n=super.toJSON(t);return n.object.fov=this.fov,n.object.zoom=this.zoom,n.object.near=this.near,n.object.far=this.far,n.object.focus=this.focus,n.object.aspect=this.aspect,this.view!==null&&(n.object.view=Object.assign({},this.view)),n.object.filmGauge=this.filmGauge,n.object.filmOffset=this.filmOffset,n}}class ov extends ex{constructor(){super(new Nn(90,1,.5,500)),this.isPointLightShadow=!0}}class Xu extends Wu{constructor(t,n,i=0,s=2){super(t,n),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=s,this.shadow=new ov}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(t,n){return super.copy(t,n),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}toJSON(t){const n=super.toJSON(t);return n.object.distance=this.distance,n.object.decay=this.decay,n.object.shadow=this.shadow.toJSON(),n}}class zl extends nx{constructor(t=-1,n=1,i=1,s=-1,a=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=n,this.top=i,this.bottom=s,this.near=a,this.far=o,this.updateProjectionMatrix()}copy(t,n){return super.copy(t,n),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,n,i,s,a,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=s,this.view.width=a,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),n=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let a=i-t,o=i+t,r=s+n,c=s-n;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,d=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=l*this.view.offsetX,o=a+l*this.view.width,r-=d*this.view.offsetY,c=r-d*this.view.height}this.projectionMatrix.makeOrthographic(a,o,r,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const n=super.toJSON(t);return n.object.zoom=this.zoom,n.object.left=this.left,n.object.right=this.right,n.object.top=this.top,n.object.bottom=this.bottom,n.object.near=this.near,n.object.far=this.far,this.view!==null&&(n.object.view=Object.assign({},this.view)),n}}class rv extends ex{constructor(){super(new zl(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class cv extends Wu{constructor(t,n){super(t,n),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(qe.DEFAULT_UP),this.updateMatrix(),this.target=new qe,this.shadow=new rv}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){const n=super.toJSON(t);return n.object.shadow=this.shadow.toJSON(),n.object.target=this.target.uuid,n}}const pa=-90,ma=1;class lv extends qe{constructor(t,n,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new Nn(pa,ma,t,n);s.layers=this.layers,this.add(s);const a=new Nn(pa,ma,t,n);a.layers=this.layers,this.add(a);const o=new Nn(pa,ma,t,n);o.layers=this.layers,this.add(o);const r=new Nn(pa,ma,t,n);r.layers=this.layers,this.add(r);const c=new Nn(pa,ma,t,n);c.layers=this.layers,this.add(c);const l=new Nn(pa,ma,t,n);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const t=this.coordinateSystem,n=this.children.concat(),[i,s,a,o,r,c]=n;for(const l of n)this.remove(l);if(t===ri)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),a.up.set(0,0,-1),a.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),r.up.set(0,1,0),r.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(t===ir)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),a.up.set(0,0,1),a.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),r.up.set(0,-1,0),r.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const l of n)this.add(l),l.updateMatrixWorld()}update(t,n){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[a,o,r,c,l,d]=this.children,f=t.getRenderTarget(),u=t.getActiveCubeFace(),h=t.getActiveMipmapLevel(),m=t.xr.enabled;t.xr.enabled=!1;const _=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let x=!1;t.isWebGLRenderer===!0?x=t.state.buffers.depth.getReversed():x=t.reversedDepthBuffer,t.setRenderTarget(i,0,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(n,a),t.setRenderTarget(i,1,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(n,o),t.setRenderTarget(i,2,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(n,r),t.setRenderTarget(i,3,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(n,c),t.setRenderTarget(i,4,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(n,l),i.texture.generateMipmaps=_,t.setRenderTarget(i,5,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(n,d),t.setRenderTarget(f,u,h),t.xr.enabled=m,i.texture.needsPMREMUpdate=!0}}class dv extends Nn{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}}class ix{static{ix.prototype.isMatrix2=!0}constructor(t,n,i,s){this.elements=[1,0,0,1],t!==void 0&&this.set(t,n,i,s)}identity(){return this.set(1,0,0,1),this}fromArray(t,n=0){for(let i=0;i<4;i++)this.elements[i]=t[i+n];return this}set(t,n,i,s){const a=this.elements;return a[0]=t,a[2]=n,a[1]=i,a[3]=s,this}}function hh(e,t,n,i){const s=fv(i);switch(n){case Pm:return e*t;case Im:return e*t/s.components*s.byteLength;case Cu:return e*t/s.components*s.byteLength;case Us:return e*t*2/s.components*s.byteLength;case Pu:return e*t*2/s.components*s.byteLength;case Lm:return e*t*3/s.components*s.byteLength;case Zn:return e*t*4/s.components*s.byteLength;case Lu:return e*t*4/s.components*s.byteLength;case Cc:case Pc:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Lc:case Ic:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case df:case uf:return Math.max(e,16)*Math.max(t,8)/4;case lf:case ff:return Math.max(e,8)*Math.max(t,8)/2;case hf:case pf:case xf:case gf:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case mf:case Wc:case _f:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case vf:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Mf:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case yf:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case bf:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case Sf:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case wf:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case Ef:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case Tf:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case Af:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case zf:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case Rf:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case Cf:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case Pf:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case Lf:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case If:case Df:case Nf:return Math.ceil(e/4)*Math.ceil(t/4)*16;case Uf:case Of:return Math.ceil(e/4)*Math.ceil(t/4)*8;case Xc:case Ff:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${n} format.`)}function fv(e){switch(e){case wn:case Am:return{byteLength:1,components:1};case er:case zm:case ui:return{byteLength:2,components:1};case zu:case Ru:return{byteLength:2,components:4};case fi:case Au:case oi:return{byteLength:4,components:1};case Rm:case Cm:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Eu}}));typeof window<"u"&&(window.__THREE__?Qt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Eu);function sx(){let e=null,t=!1,n=null,i=null;function s(a,o){i=e.requestAnimationFrame(s),n(a,o)}return{start:function(){t!==!0&&n!==null&&e!==null&&(i=e.requestAnimationFrame(s),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(a){n=a},setContext:function(a){e=a}}}function uv(e){const t=new WeakMap;function n(r,c){const l=r.array,d=r.usage,f=l.byteLength,u=e.createBuffer();e.bindBuffer(c,u),e.bufferData(c,l,d),r.onUploadCallback();let h;if(l instanceof Float32Array)h=e.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)h=e.HALF_FLOAT;else if(l instanceof Uint16Array)r.isFloat16BufferAttribute?h=e.HALF_FLOAT:h=e.UNSIGNED_SHORT;else if(l instanceof Int16Array)h=e.SHORT;else if(l instanceof Uint32Array)h=e.UNSIGNED_INT;else if(l instanceof Int32Array)h=e.INT;else if(l instanceof Int8Array)h=e.BYTE;else if(l instanceof Uint8Array)h=e.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)h=e.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:u,type:h,bytesPerElement:l.BYTES_PER_ELEMENT,version:r.version,size:f}}function i(r,c,l){const d=c.array,f=c.updateRanges;if(e.bindBuffer(l,r),f.length===0)e.bufferSubData(l,0,d);else{f.sort((h,m)=>h.start-m.start);let u=0;for(let h=1;h<f.length;h++){const m=f[u],_=f[h];_.start<=m.start+m.count+1?m.count=Math.max(m.count,_.start+_.count-m.start):(++u,f[u]=_)}f.length=u+1;for(let h=0,m=f.length;h<m;h++){const _=f[h];e.bufferSubData(l,_.start*d.BYTES_PER_ELEMENT,d,_.start,_.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(r){return r.isInterleavedBufferAttribute&&(r=r.data),t.get(r)}function a(r){r.isInterleavedBufferAttribute&&(r=r.data);const c=t.get(r);c&&(e.deleteBuffer(c.buffer),t.delete(r))}function o(r,c){if(r.isInterleavedBufferAttribute&&(r=r.data),r.isGLBufferAttribute){const d=t.get(r);(!d||d.version<r.version)&&t.set(r,{buffer:r.buffer,type:r.type,bytesPerElement:r.elementSize,version:r.version});return}const l=t.get(r);if(l===void 0)t.set(r,n(r,c));else if(l.version<r.version){if(l.size!==r.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(l.buffer,r,c),l.version=r.version}}return{get:s,remove:a,update:o}}var hv=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,pv=`#ifdef USE_ALPHAHASH
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
#endif`,mv=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,xv=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,gv=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,_v=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,vv=`#ifdef USE_AOMAP
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
#endif`,Mv=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,yv=`#ifdef USE_BATCHING
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
#endif`,bv=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Sv=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,wv=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Ev=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Tv=`#ifdef USE_IRIDESCENCE
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
#endif`,Av=`#ifdef USE_BUMPMAP
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
#endif`,zv=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Rv=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Cv=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Pv=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Lv=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Iv=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Dv=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Nv=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,Uv=`#define PI 3.141592653589793
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
} // validated`,Ov=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Fv=`vec3 transformedNormal = objectNormal;
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
#endif`,Bv=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Gv=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Hv=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Vv=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,kv="gl_FragColor = linearToOutputTexel( gl_FragColor );",Wv=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Xv=`#ifdef USE_ENVMAP
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
#endif`,$v=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,qv=`#ifdef USE_ENVMAP
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
#endif`,Yv=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Zv=`#ifdef USE_ENVMAP
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
#endif`,Kv=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Jv=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Qv=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,jv=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,tM=`#ifdef USE_GRADIENTMAP
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
}`,eM=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,nM=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,iM=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,sM=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,aM=`#ifdef USE_ENVMAP
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
#endif`,oM=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,rM=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,cM=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lM=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,dM=`PhysicalMaterial material;
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
#endif`,fM=`uniform sampler2D dfgLUT;
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
}`,uM=`
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
#endif`,hM=`#if defined( RE_IndirectDiffuse )
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
#endif`,pM=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,mM=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,xM=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,gM=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,_M=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,vM=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,MM=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,yM=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,bM=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,SM=`#if defined( USE_POINTS_UV )
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
#endif`,wM=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,EM=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,TM=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,AM=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,zM=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,RM=`#ifdef USE_MORPHTARGETS
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
#endif`,CM=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,PM=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,LM=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,IM=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,DM=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,NM=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,UM=`#ifdef USE_NORMALMAP
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
#endif`,OM=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,FM=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,BM=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,GM=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,HM=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,VM=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,kM=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,WM=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,XM=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,$M=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,qM=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,YM=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,ZM=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,KM=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,JM=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,QM=`float getShadowMask() {
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
}`,jM=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,ty=`#ifdef USE_SKINNING
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
#endif`,ey=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,ny=`#ifdef USE_SKINNING
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
#endif`,iy=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,sy=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,ay=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,oy=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,ry=`#ifdef USE_TRANSMISSION
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
#endif`,cy=`#ifdef USE_TRANSMISSION
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
#endif`,ly=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,dy=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,fy=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,uy=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const hy=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,py=`uniform sampler2D t2D;
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
}`,my=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,xy=`#ifdef ENVMAP_TYPE_CUBE
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
}`,gy=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,_y=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,vy=`#include <common>
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
}`,My=`#if DEPTH_PACKING == 3200
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
}`,yy=`#define DISTANCE
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
}`,by=`#define DISTANCE
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
}`,Sy=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,wy=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Ey=`uniform float scale;
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
}`,Ty=`uniform vec3 diffuse;
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
}`,Ay=`#include <common>
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
}`,zy=`uniform vec3 diffuse;
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
}`,Ry=`#define LAMBERT
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
}`,Cy=`#define LAMBERT
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
}`,Py=`#define MATCAP
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
}`,Ly=`#define MATCAP
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
}`,Iy=`#define NORMAL
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
}`,Dy=`#define NORMAL
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
}`,Ny=`#define PHONG
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
}`,Uy=`#define PHONG
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
}`,Oy=`#define STANDARD
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
}`,Fy=`#define STANDARD
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
}`,By=`#define TOON
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
}`,Gy=`#define TOON
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
}`,Hy=`uniform float size;
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
}`,Vy=`uniform vec3 diffuse;
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
}`,ky=`#include <common>
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
}`,Wy=`uniform vec3 color;
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
}`,Xy=`uniform float rotation;
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
}`,$y=`uniform vec3 diffuse;
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
}`,ie={alphahash_fragment:hv,alphahash_pars_fragment:pv,alphamap_fragment:mv,alphamap_pars_fragment:xv,alphatest_fragment:gv,alphatest_pars_fragment:_v,aomap_fragment:vv,aomap_pars_fragment:Mv,batching_pars_vertex:yv,batching_vertex:bv,begin_vertex:Sv,beginnormal_vertex:wv,bsdfs:Ev,iridescence_fragment:Tv,bumpmap_pars_fragment:Av,clipping_planes_fragment:zv,clipping_planes_pars_fragment:Rv,clipping_planes_pars_vertex:Cv,clipping_planes_vertex:Pv,color_fragment:Lv,color_pars_fragment:Iv,color_pars_vertex:Dv,color_vertex:Nv,common:Uv,cube_uv_reflection_fragment:Ov,defaultnormal_vertex:Fv,displacementmap_pars_vertex:Bv,displacementmap_vertex:Gv,emissivemap_fragment:Hv,emissivemap_pars_fragment:Vv,colorspace_fragment:kv,colorspace_pars_fragment:Wv,envmap_fragment:Xv,envmap_common_pars_fragment:$v,envmap_pars_fragment:qv,envmap_pars_vertex:Yv,envmap_physical_pars_fragment:aM,envmap_vertex:Zv,fog_vertex:Kv,fog_pars_vertex:Jv,fog_fragment:Qv,fog_pars_fragment:jv,gradientmap_pars_fragment:tM,lightmap_pars_fragment:eM,lights_lambert_fragment:nM,lights_lambert_pars_fragment:iM,lights_pars_begin:sM,lights_toon_fragment:oM,lights_toon_pars_fragment:rM,lights_phong_fragment:cM,lights_phong_pars_fragment:lM,lights_physical_fragment:dM,lights_physical_pars_fragment:fM,lights_fragment_begin:uM,lights_fragment_maps:hM,lights_fragment_end:pM,lightprobes_pars_fragment:mM,logdepthbuf_fragment:xM,logdepthbuf_pars_fragment:gM,logdepthbuf_pars_vertex:_M,logdepthbuf_vertex:vM,map_fragment:MM,map_pars_fragment:yM,map_particle_fragment:bM,map_particle_pars_fragment:SM,metalnessmap_fragment:wM,metalnessmap_pars_fragment:EM,morphinstance_vertex:TM,morphcolor_vertex:AM,morphnormal_vertex:zM,morphtarget_pars_vertex:RM,morphtarget_vertex:CM,normal_fragment_begin:PM,normal_fragment_maps:LM,normal_pars_fragment:IM,normal_pars_vertex:DM,normal_vertex:NM,normalmap_pars_fragment:UM,clearcoat_normal_fragment_begin:OM,clearcoat_normal_fragment_maps:FM,clearcoat_pars_fragment:BM,iridescence_pars_fragment:GM,opaque_fragment:HM,packing:VM,premultiplied_alpha_fragment:kM,project_vertex:WM,dithering_fragment:XM,dithering_pars_fragment:$M,roughnessmap_fragment:qM,roughnessmap_pars_fragment:YM,shadowmap_pars_fragment:ZM,shadowmap_pars_vertex:KM,shadowmap_vertex:JM,shadowmask_pars_fragment:QM,skinbase_vertex:jM,skinning_pars_vertex:ty,skinning_vertex:ey,skinnormal_vertex:ny,specularmap_fragment:iy,specularmap_pars_fragment:sy,tonemapping_fragment:ay,tonemapping_pars_fragment:oy,transmission_fragment:ry,transmission_pars_fragment:cy,uv_pars_fragment:ly,uv_pars_vertex:dy,uv_vertex:fy,worldpos_vertex:uy,background_vert:hy,background_frag:py,backgroundCube_vert:my,backgroundCube_frag:xy,cube_vert:gy,cube_frag:_y,depth_vert:vy,depth_frag:My,distance_vert:yy,distance_frag:by,equirect_vert:Sy,equirect_frag:wy,linedashed_vert:Ey,linedashed_frag:Ty,meshbasic_vert:Ay,meshbasic_frag:zy,meshlambert_vert:Ry,meshlambert_frag:Cy,meshmatcap_vert:Py,meshmatcap_frag:Ly,meshnormal_vert:Iy,meshnormal_frag:Dy,meshphong_vert:Ny,meshphong_frag:Uy,meshphysical_vert:Oy,meshphysical_frag:Fy,meshtoon_vert:By,meshtoon_frag:Gy,points_vert:Hy,points_frag:Vy,shadow_vert:ky,shadow_frag:Wy,sprite_vert:Xy,sprite_frag:$y},Dt={common:{diffuse:{value:new ee(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new te},alphaMap:{value:null},alphaMapTransform:{value:new te},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new te}},envmap:{envMap:{value:null},envMapRotation:{value:new te},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new te}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new te}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new te},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new te},normalScale:{value:new Ct(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new te},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new te}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new te}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new te}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ee(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new q},probesMax:{value:new q},probesResolution:{value:new q}},points:{diffuse:{value:new ee(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new te},alphaTest:{value:0},uvTransform:{value:new te}},sprite:{diffuse:{value:new ee(16777215)},opacity:{value:1},center:{value:new Ct(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new te},alphaMap:{value:null},alphaMapTransform:{value:new te},alphaTest:{value:0}}},ai={basic:{uniforms:cn([Dt.common,Dt.specularmap,Dt.envmap,Dt.aomap,Dt.lightmap,Dt.fog]),vertexShader:ie.meshbasic_vert,fragmentShader:ie.meshbasic_frag},lambert:{uniforms:cn([Dt.common,Dt.specularmap,Dt.envmap,Dt.aomap,Dt.lightmap,Dt.emissivemap,Dt.bumpmap,Dt.normalmap,Dt.displacementmap,Dt.fog,Dt.lights,{emissive:{value:new ee(0)},envMapIntensity:{value:1}}]),vertexShader:ie.meshlambert_vert,fragmentShader:ie.meshlambert_frag},phong:{uniforms:cn([Dt.common,Dt.specularmap,Dt.envmap,Dt.aomap,Dt.lightmap,Dt.emissivemap,Dt.bumpmap,Dt.normalmap,Dt.displacementmap,Dt.fog,Dt.lights,{emissive:{value:new ee(0)},specular:{value:new ee(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:ie.meshphong_vert,fragmentShader:ie.meshphong_frag},standard:{uniforms:cn([Dt.common,Dt.envmap,Dt.aomap,Dt.lightmap,Dt.emissivemap,Dt.bumpmap,Dt.normalmap,Dt.displacementmap,Dt.roughnessmap,Dt.metalnessmap,Dt.fog,Dt.lights,{emissive:{value:new ee(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ie.meshphysical_vert,fragmentShader:ie.meshphysical_frag},toon:{uniforms:cn([Dt.common,Dt.aomap,Dt.lightmap,Dt.emissivemap,Dt.bumpmap,Dt.normalmap,Dt.displacementmap,Dt.gradientmap,Dt.fog,Dt.lights,{emissive:{value:new ee(0)}}]),vertexShader:ie.meshtoon_vert,fragmentShader:ie.meshtoon_frag},matcap:{uniforms:cn([Dt.common,Dt.bumpmap,Dt.normalmap,Dt.displacementmap,Dt.fog,{matcap:{value:null}}]),vertexShader:ie.meshmatcap_vert,fragmentShader:ie.meshmatcap_frag},points:{uniforms:cn([Dt.points,Dt.fog]),vertexShader:ie.points_vert,fragmentShader:ie.points_frag},dashed:{uniforms:cn([Dt.common,Dt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ie.linedashed_vert,fragmentShader:ie.linedashed_frag},depth:{uniforms:cn([Dt.common,Dt.displacementmap]),vertexShader:ie.depth_vert,fragmentShader:ie.depth_frag},normal:{uniforms:cn([Dt.common,Dt.bumpmap,Dt.normalmap,Dt.displacementmap,{opacity:{value:1}}]),vertexShader:ie.meshnormal_vert,fragmentShader:ie.meshnormal_frag},sprite:{uniforms:cn([Dt.sprite,Dt.fog]),vertexShader:ie.sprite_vert,fragmentShader:ie.sprite_frag},background:{uniforms:{uvTransform:{value:new te},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ie.background_vert,fragmentShader:ie.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new te}},vertexShader:ie.backgroundCube_vert,fragmentShader:ie.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ie.cube_vert,fragmentShader:ie.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ie.equirect_vert,fragmentShader:ie.equirect_frag},distance:{uniforms:cn([Dt.common,Dt.displacementmap,{referencePosition:{value:new q},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ie.distance_vert,fragmentShader:ie.distance_frag},shadow:{uniforms:cn([Dt.lights,Dt.fog,{color:{value:new ee(0)},opacity:{value:1}}]),vertexShader:ie.shadow_vert,fragmentShader:ie.shadow_frag}};ai.physical={uniforms:cn([ai.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new te},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new te},clearcoatNormalScale:{value:new Ct(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new te},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new te},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new te},sheen:{value:0},sheenColor:{value:new ee(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new te},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new te},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new te},transmissionSamplerSize:{value:new Ct},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new te},attenuationDistance:{value:0},attenuationColor:{value:new ee(0)},specularColor:{value:new ee(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new te},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new te},anisotropyVector:{value:new Ct},anisotropyMap:{value:null},anisotropyMapTransform:{value:new te}}]),vertexShader:ie.meshphysical_vert,fragmentShader:ie.meshphysical_frag};const ac={r:0,b:0,g:0},qy=new Ee,ax=new te;ax.set(-1,0,0,0,1,0,0,0,1);function Yy(e,t,n,i,s,a){const o=new ee(0);let r=s===!0?0:1,c,l,d=null,f=0,u=null;function h(v){let y=v.isScene===!0?v.background:null;if(y&&y.isTexture){const g=v.backgroundBlurriness>0;y=t.get(y,g)}return y}function m(v){let y=!1;const g=h(v);g===null?x(o,r):g&&g.isColor&&(x(g,1),y=!0);const b=e.xr.getEnvironmentBlendMode();b==="additive"?n.buffers.color.setClear(0,0,0,1,a):b==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||y)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function _(v,y){const g=h(y);g&&(g.isCubeTexture||g.mapping===Sl)?(l===void 0&&(l=new we(new Ja(1,1,1),new hi({name:"BackgroundCubeMaterial",uniforms:ka(ai.backgroundCube.uniforms),vertexShader:ai.backgroundCube.vertexShader,fragmentShader:ai.backgroundCube.fragmentShader,side:hn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(b,w,T){this.matrixWorld.copyPosition(T.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(l)),l.material.uniforms.envMap.value=g,l.material.uniforms.backgroundBlurriness.value=y.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(qy.makeRotationFromEuler(y.backgroundRotation)).transpose(),g.isCubeTexture&&g.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(ax),l.material.toneMapped=oe.getTransfer(g.colorSpace)!==me,(d!==g||f!==g.version||u!==e.toneMapping)&&(l.material.needsUpdate=!0,d=g,f=g.version,u=e.toneMapping),l.layers.enableAll(),v.unshift(l,l.geometry,l.material,0,0,null)):g&&g.isTexture&&(c===void 0&&(c=new we(new Al(2,2),new hi({name:"BackgroundMaterial",uniforms:ka(ai.background.uniforms),vertexShader:ai.background.vertexShader,fragmentShader:ai.background.fragmentShader,side:Ds,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c)),c.material.uniforms.t2D.value=g,c.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,c.material.toneMapped=oe.getTransfer(g.colorSpace)!==me,g.matrixAutoUpdate===!0&&g.updateMatrix(),c.material.uniforms.uvTransform.value.copy(g.matrix),(d!==g||f!==g.version||u!==e.toneMapping)&&(c.material.needsUpdate=!0,d=g,f=g.version,u=e.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null))}function x(v,y){v.getRGB(ac,jm(e)),n.buffers.color.setClear(ac.r,ac.g,ac.b,y,a)}function p(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(v,y=1){o.set(v),r=y,x(o,r)},getClearAlpha:function(){return r},setClearAlpha:function(v){r=v,x(o,r)},render:m,addToRenderList:_,dispose:p}}function Zy(e,t){const n=e.getParameter(e.MAX_VERTEX_ATTRIBS),i={},s=u(null);let a=s,o=!1;function r(C,I,U,P,O){let V=!1;const N=f(C,P,U,I);a!==N&&(a=N,l(a.object)),V=h(C,P,U,O),V&&m(C,P,U,O),O!==null&&t.update(O,e.ELEMENT_ARRAY_BUFFER),(V||o)&&(o=!1,g(C,I,U,P),O!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(O).buffer))}function c(){return e.createVertexArray()}function l(C){return e.bindVertexArray(C)}function d(C){return e.deleteVertexArray(C)}function f(C,I,U,P){const O=P.wireframe===!0;let V=i[I.id];V===void 0&&(V={},i[I.id]=V);const N=C.isInstancedMesh===!0?C.id:0;let F=V[N];F===void 0&&(F={},V[N]=F);let L=F[U.id];L===void 0&&(L={},F[U.id]=L);let B=L[O];return B===void 0&&(B=u(c()),L[O]=B),B}function u(C){const I=[],U=[],P=[];for(let O=0;O<n;O++)I[O]=0,U[O]=0,P[O]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:I,enabledAttributes:U,attributeDivisors:P,object:C,attributes:{},index:null}}function h(C,I,U,P){const O=a.attributes,V=I.attributes;let N=0;const F=U.getAttributes();for(const L in F)if(F[L].location>=0){const $=O[L];let J=V[L];if(J===void 0&&(L==="instanceMatrix"&&C.instanceMatrix&&(J=C.instanceMatrix),L==="instanceColor"&&C.instanceColor&&(J=C.instanceColor)),$===void 0||$.attribute!==J||J&&$.data!==J.data)return!0;N++}return a.attributesNum!==N||a.index!==P}function m(C,I,U,P){const O={},V=I.attributes;let N=0;const F=U.getAttributes();for(const L in F)if(F[L].location>=0){let $=V[L];$===void 0&&(L==="instanceMatrix"&&C.instanceMatrix&&($=C.instanceMatrix),L==="instanceColor"&&C.instanceColor&&($=C.instanceColor));const J={};J.attribute=$,$&&$.data&&(J.data=$.data),O[L]=J,N++}a.attributes=O,a.attributesNum=N,a.index=P}function _(){const C=a.newAttributes;for(let I=0,U=C.length;I<U;I++)C[I]=0}function x(C){p(C,0)}function p(C,I){const U=a.newAttributes,P=a.enabledAttributes,O=a.attributeDivisors;U[C]=1,P[C]===0&&(e.enableVertexAttribArray(C),P[C]=1),O[C]!==I&&(e.vertexAttribDivisor(C,I),O[C]=I)}function v(){const C=a.newAttributes,I=a.enabledAttributes;for(let U=0,P=I.length;U<P;U++)I[U]!==C[U]&&(e.disableVertexAttribArray(U),I[U]=0)}function y(C,I,U,P,O,V,N){N===!0?e.vertexAttribIPointer(C,I,U,O,V):e.vertexAttribPointer(C,I,U,P,O,V)}function g(C,I,U,P){_();const O=P.attributes,V=U.getAttributes(),N=I.defaultAttributeValues;for(const F in V){const L=V[F];if(L.location>=0){let B=O[F];if(B===void 0&&(F==="instanceMatrix"&&C.instanceMatrix&&(B=C.instanceMatrix),F==="instanceColor"&&C.instanceColor&&(B=C.instanceColor)),B!==void 0){const $=B.normalized,J=B.itemSize,st=t.get(B);if(st===void 0)continue;const Tt=st.buffer,H=st.type,et=st.bytesPerElement,W=H===e.INT||H===e.UNSIGNED_INT||B.gpuType===Au;if(B.isInterleavedBufferAttribute){const k=B.data,at=k.stride,mt=B.offset;if(k.isInstancedInterleavedBuffer){for(let rt=0;rt<L.locationSize;rt++)p(L.location+rt,k.meshPerAttribute);C.isInstancedMesh!==!0&&P._maxInstanceCount===void 0&&(P._maxInstanceCount=k.meshPerAttribute*k.count)}else for(let rt=0;rt<L.locationSize;rt++)x(L.location+rt);e.bindBuffer(e.ARRAY_BUFFER,Tt);for(let rt=0;rt<L.locationSize;rt++)y(L.location+rt,J/L.locationSize,H,$,at*et,(mt+J/L.locationSize*rt)*et,W)}else{if(B.isInstancedBufferAttribute){for(let k=0;k<L.locationSize;k++)p(L.location+k,B.meshPerAttribute);C.isInstancedMesh!==!0&&P._maxInstanceCount===void 0&&(P._maxInstanceCount=B.meshPerAttribute*B.count)}else for(let k=0;k<L.locationSize;k++)x(L.location+k);e.bindBuffer(e.ARRAY_BUFFER,Tt);for(let k=0;k<L.locationSize;k++)y(L.location+k,J/L.locationSize,H,$,J*et,J/L.locationSize*k*et,W)}}else if(N!==void 0){const $=N[F];if($!==void 0)switch($.length){case 2:e.vertexAttrib2fv(L.location,$);break;case 3:e.vertexAttrib3fv(L.location,$);break;case 4:e.vertexAttrib4fv(L.location,$);break;default:e.vertexAttrib1fv(L.location,$)}}}}v()}function b(){E();for(const C in i){const I=i[C];for(const U in I){const P=I[U];for(const O in P){const V=P[O];for(const N in V)d(V[N].object),delete V[N];delete P[O]}}delete i[C]}}function w(C){if(i[C.id]===void 0)return;const I=i[C.id];for(const U in I){const P=I[U];for(const O in P){const V=P[O];for(const N in V)d(V[N].object),delete V[N];delete P[O]}}delete i[C.id]}function T(C){for(const I in i){const U=i[I];for(const P in U){const O=U[P];if(O[C.id]===void 0)continue;const V=O[C.id];for(const N in V)d(V[N].object),delete V[N];delete O[C.id]}}}function M(C){for(const I in i){const U=i[I],P=C.isInstancedMesh===!0?C.id:0,O=U[P];if(O!==void 0){for(const V in O){const N=O[V];for(const F in N)d(N[F].object),delete N[F];delete O[V]}delete U[P],Object.keys(U).length===0&&delete i[I]}}}function E(){A(),o=!0,a!==s&&(a=s,l(a.object))}function A(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:r,reset:E,resetDefaultState:A,dispose:b,releaseStatesOfGeometry:w,releaseStatesOfObject:M,releaseStatesOfProgram:T,initAttributes:_,enableAttribute:x,disableUnusedAttributes:v}}function Ky(e,t,n){let i;function s(c){i=c}function a(c,l){e.drawArrays(i,c,l),n.update(l,i,1)}function o(c,l,d){d!==0&&(e.drawArraysInstanced(i,c,l,d),n.update(l,i,d))}function r(c,l,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,l,0,d);let u=0;for(let h=0;h<d;h++)u+=l[h];n.update(u,i,1)}this.setMode=s,this.render=a,this.renderInstances=o,this.renderMultiDraw=r}function Jy(e,t,n,i){let s;function a(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){const T=t.get("EXT_texture_filter_anisotropic");s=e.getParameter(T.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(T){return!(T!==Zn&&i.convert(T)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT))}function r(T){const M=T===ui&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(T!==wn&&T!==oi&&!M&&i.convert(T)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(T){if(T==="highp"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return"highp";T="mediump"}return T==="mediump"&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=n.precision!==void 0?n.precision:"highp";const d=c(l);d!==l&&(Qt("WebGLRenderer:",l,"not supported, using",d,"instead."),l=d);const f=n.logarithmicDepthBuffer===!0,u=n.reversedDepthBuffer===!0&&t.has("EXT_clip_control");n.reversedDepthBuffer===!0&&u===!1&&Qt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const h=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=e.getParameter(e.MAX_TEXTURE_SIZE),x=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),p=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),g=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),b=e.getParameter(e.MAX_SAMPLES),w=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:r,precision:l,logarithmicDepthBuffer:f,reversedDepthBuffer:u,maxTextures:h,maxVertexTextures:m,maxTextureSize:_,maxCubemapSize:x,maxAttributes:p,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:g,maxSamples:b,samples:w}}function Qy(e){const t=this;let n=null,i=0,s=!1,a=!1;const o=new es,r=new te,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(f,u){const h=f.length!==0||u||i!==0||s;return s=u,i=f.length,h},this.beginShadows=function(){a=!0,d(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(f,u){n=d(f,u,0)},this.setState=function(f,u,h){const m=f.clippingPlanes,_=f.clipIntersection,x=f.clipShadows,p=e.get(f);if(!s||m===null||m.length===0||a&&!x)a?d(null):l();else{const v=a?0:i,y=v*4;let g=p.clippingState||null;c.value=g,g=d(m,u,y,h);for(let b=0;b!==y;++b)g[b]=n[b];p.clippingState=g,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=v}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function d(f,u,h,m){const _=f!==null?f.length:0;let x=null;if(_!==0){if(x=c.value,m!==!0||x===null){const p=h+_*4,v=u.matrixWorldInverse;r.getNormalMatrix(v),(x===null||x.length<p)&&(x=new Float32Array(p));for(let y=0,g=h;y!==_;++y,g+=4)o.copy(f[y]).applyMatrix4(v,r),o.normal.toArray(x,g),x[g+3]=o.constant}c.value=x,c.needsUpdate=!0}return t.numPlanes=_,t.numIntersection=0,x}}const Sa=4,jy=6,t2=20,e2=256,ho=new zl,ph=new ee;let yd=null,bd=0,Sd=0,wd=!1;const n2=new q,xs=new q;class mh{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,n=0,i=.1,s=100,a={}){const{size:o=256,position:r=n2}=a;yd=this._renderer.getRenderTarget(),bd=this._renderer.getActiveCubeFace(),Sd=this._renderer.getActiveMipmapLevel(),wd=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);const c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(t,i,s,c,r),n>0&&this._blur(c,0,0,n),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(t,n=null){return this._fromTexture(t,n)}fromCubemap(t,n=null){return this._fromTexture(t,n)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=_h(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=gh(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(yd,bd,Sd),this._renderer.xr.enabled=wd,t.scissorTest=!1,xa(t,0,0,t.width,t.height)}_fromTexture(t,n){t.mapping===Ns||t.mapping===Ha?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),yd=this._renderer.getRenderTarget(),bd=this._renderer.getActiveCubeFace(),Sd=this._renderer.getActiveMipmapLevel(),wd=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=n||this._allocateTargets();return this._textureToCubeUV(t,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),n=4*this._cubeSize,i={magFilter:$e,minFilter:$e,generateMipmaps:!1,type:ui,format:Zn,colorSpace:qc,depthBuffer:!1},s=xh(t,n,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==n){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=xh(t,n,i);const{_lodMax:a}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=i2(a)),this._blurMaterial=a2(a,t,n),this._ggxMaterial=s2(a,t,n)}return s}_compileMaterial(t){const n=new we(new Ne,t);this._renderer.compile(n,ho)}_sceneToCubeUV(t,n,i,s,a){const c=new Nn(90,1,n,i),l=[1,-1,1,1,1,1],d=[1,1,1,-1,-1,-1],f=this._renderer,u=f.autoClear,h=f.toneMapping;f.getClearColor(ph),f.toneMapping=li,f.autoClear=!1,f.state.buffers.depth.getReversed()&&(f.setRenderTarget(s),f.clearDepth(),f.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new we(new Ja,new wl({name:"PMREM.Background",side:hn,depthWrite:!1,depthTest:!1})));const _=this._backgroundBox,x=_.material;let p=!1;const v=t.background;v?v.isColor&&(x.color.copy(v),t.background=null,p=!0):(x.color.copy(ph),p=!0);for(let y=0;y<6;y++){const g=y%3;g===0?(c.up.set(0,l[y],0),c.position.set(a.x,a.y,a.z),c.lookAt(a.x+d[y],a.y,a.z)):g===1?(c.up.set(0,0,l[y]),c.position.set(a.x,a.y,a.z),c.lookAt(a.x,a.y+d[y],a.z)):(c.up.set(0,l[y],0),c.position.set(a.x,a.y,a.z),c.lookAt(a.x,a.y,a.z+d[y]));const b=this._cubeSize;xa(s,g*b,y>2?b:0,b,b),f.setRenderTarget(s),p&&f.render(_,c),f.render(t,c)}f.toneMapping=h,f.autoClear=u,t.background=v}_textureToCubeUV(t,n){const i=this._renderer,s=t.mapping===Ns||t.mapping===Ha;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=_h()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=gh());const a=s?this._cubemapMaterial:this._equirectMaterial,o=this._lodMeshes[0];o.material=a;const r=a.uniforms;r.envMap.value=t;const c=this._cubeSize;xa(n,0,0,3*c,2*c),i.setRenderTarget(n),i.render(o,ho)}_applyPMREM(t){const n=this._renderer,i=n.autoClear;n.autoClear=!1;const s=this._lodMeshes.length;for(let a=1;a<s;a++)this._applyGGXFilter(t,a-1,a);n.autoClear=i}_applyGGXFilter(t,n,i){const s=this._renderer,a=this._pingPongRenderTarget,o=this._ggxMaterial,r=this._lodMeshes[i];r.material=o;const c=o.uniforms,l=i/(this._lodMeshes.length-1),d=n/(this._lodMeshes.length-1),f=Math.sqrt(l*l-d*d),u=l*1.25,h=f*u,{_lodMax:m}=this,_=this._sizeLods[i],x=3*_*(i>m-Sa?i-m+Sa:0),p=4*(this._cubeSize-_);c.envMap.value=t.texture,c.roughness.value=h,c.mipInt.value=m-n,xa(a,x,p,3*_,2*_),s.setRenderTarget(a),s.render(r,ho),c.envMap.value=a.texture,c.roughness.value=0,c.mipInt.value=m-i,xa(t,x,p,3*_,2*_),s.setRenderTarget(t),s.render(r,ho)}_blur(t,n,i,s){const a=this._pingPongRenderTarget,o=Math.min(s,Math.PI)/Math.SQRT2;this._blurPass(t,a,n,i,o),this._blurPass(a,t,i,i,o)}_blurPass(t,n,i,s,a){const o=this._renderer,r=this._blurMaterial,c=this._lodMeshes[s];c.material=r;const l=r.uniforms;l.envMap.value=t.texture,l.sigma.value=a,l.mipInt.value=this._lodMax-i;const d=this._sizeLods[s],f=3*d*(s>this._lodMax-Sa?s-this._lodMax+Sa:0),u=4*(this._cubeSize-d);xa(n,f,u,3*d,2*d),o.setRenderTarget(n),o.render(c,ho)}}function i2(e){const t=[],n=[];let i=e;const s=e-Sa+1+jy;for(let a=0;a<s;a++){const o=Math.pow(2,i);t.push(o);const r=1/(o-2),c=-r,l=1+r,d=[c,c,l,c,l,l,c,c,l,l,c,l],f=6,u=6,h=3,m=new Float32Array(h*u*f),_=new Float32Array(h*u*f);for(let p=0;p<f;p++){const v=p%3*2/3-1,y=p>2?0:-1,g=[v,y,0,v+2/3,y,0,v+2/3,y+1,0,v,y,0,v+2/3,y+1,0,v,y+1,0];m.set(g,h*u*p);for(let b=0;b<u;b++){const w=d[b*2]*2-1,T=d[b*2+1]*2-1;p===0?xs.set(1,T,w):p===1?xs.set(-w,1,-T):p===2?xs.set(-w,T,1):p===3?xs.set(-1,T,-w):p===4?xs.set(-w,-1,T):xs.set(w,T,-1),xs.toArray(_,(p*u+b)*h)}}const x=new Ne;x.setAttribute("position",new pn(m,h)),x.setAttribute("outputDirection",new pn(_,h)),n.push(new we(x,null)),i>Sa&&i--}return{lodMeshes:n,sizeLods:t}}function xh(e,t,n){const i=new Kn(e,t,n);return i.texture.mapping=Sl,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function xa(e,t,n,i,s){e.viewport.set(t,n,i,s),e.scissor.set(t,n,i,s)}function s2(e,t,n){return new hi({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:e2,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Rl(),fragmentShader:`

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
		`,blending:Ui,depthTest:!1,depthWrite:!1})}function a2(e,t,n){return new hi({name:"SphericalGaussianBlur",defines:{SAMPLES:t2,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Rl(),fragmentShader:`

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
		`,blending:Ui,depthTest:!1,depthWrite:!1})}function gh(){return new hi({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Rl(),fragmentShader:`

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
		`,blending:Ui,depthTest:!1,depthWrite:!1})}function _h(){return new hi({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Rl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Ui,depthTest:!1,depthWrite:!1})}function Rl(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class ox extends Kn{constructor(t=1,n={}){super(t,t,n),this.isWebGLCubeRenderTarget=!0;const i={width:t,height:t,depth:1},s=[i,i,i,i,i,i];this.texture=new Gm(s),this._setTextureOptions(n),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,n){this.texture.type=n.type,this.texture.colorSpace=n.colorSpace,this.texture.generateMipmaps=n.generateMipmaps,this.texture.minFilter=n.minFilter,this.texture.magFilter=n.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new Ja(5,5,5),a=new hi({name:"CubemapFromEquirect",uniforms:ka(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:hn,blending:Ui});a.uniforms.tEquirect.value=n;const o=new we(s,a),r=n.minFilter;return n.minFilter===bs&&(n.minFilter=$e),new lv(1,10,this).update(t,o),n.minFilter=r,o.geometry.dispose(),o.material.dispose(),this}clear(t,n=!0,i=!0,s=!0){const a=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(n,i,s);t.setRenderTarget(a)}}function o2(e){let t=new WeakMap,n=new WeakMap,i=null;function s(u,h=!1){return u==null?null:h?o(u):a(u)}function a(u){if(u&&u.isTexture){const h=u.mapping;if(h===Xl||h===$l)if(t.has(u)){const m=t.get(u).texture;return r(m,u.mapping)}else{const m=u.image;if(m&&m.height>0){const _=new ox(m.height);return _.fromEquirectangularTexture(e,u),t.set(u,_),u.addEventListener("dispose",l),r(_.texture,u.mapping)}else return null}}return u}function o(u){if(u&&u.isTexture){const h=u.mapping,m=h===Xl||h===$l,_=h===Ns||h===Ha;if(m||_){let x=n.get(u);const p=x!==void 0?x.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==p)return i===null&&(i=new mh(e)),x=m?i.fromEquirectangular(u,x):i.fromCubemap(u,x),x.texture.pmremVersion=u.pmremVersion,n.set(u,x),x.texture;if(x!==void 0)return x.texture;{const v=u.image;return m&&v&&v.height>0||_&&v&&c(v)?(i===null&&(i=new mh(e)),x=m?i.fromEquirectangular(u):i.fromCubemap(u),x.texture.pmremVersion=u.pmremVersion,n.set(u,x),u.addEventListener("dispose",d),x.texture):null}}}return u}function r(u,h){return h===Xl?u.mapping=Ns:h===$l&&(u.mapping=Ha),u}function c(u){let h=0;const m=6;for(let _=0;_<m;_++)u[_]!==void 0&&h++;return h===m}function l(u){const h=u.target;h.removeEventListener("dispose",l);const m=t.get(h);m!==void 0&&(t.delete(h),m.dispose())}function d(u){const h=u.target;h.removeEventListener("dispose",d);const m=n.get(h);m!==void 0&&(n.delete(h),m.dispose())}function f(){t=new WeakMap,n=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:s,dispose:f}}function r2(e){const t={};function n(i){if(t[i]!==void 0)return t[i];const s=e.getExtension(i);return t[i]=s,s}return{has:function(i){return n(i)!==null},init:function(){n("EXT_color_buffer_float"),n("WEBGL_clip_cull_distance"),n("OES_texture_float_linear"),n("EXT_color_buffer_half_float"),n("WEBGL_multisampled_render_to_texture"),n("WEBGL_render_shared_exponent")},get:function(i){const s=n(i);return s===null&&Ia("WebGLRenderer: "+i+" extension not supported."),s}}}function c2(e,t,n,i){const s={},a=new WeakMap;function o(f){const u=f.target;u.index!==null&&t.remove(u.index);for(const m in u.attributes)t.remove(u.attributes[m]);u.removeEventListener("dispose",o),delete s[u.id];const h=a.get(u);h&&(t.remove(h),a.delete(u)),i.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,n.memory.geometries--}function r(f,u){return s[u.id]===!0||(u.addEventListener("dispose",o),s[u.id]=!0,n.memory.geometries++),u}function c(f){const u=f.attributes;for(const h in u)t.update(u[h],e.ARRAY_BUFFER)}function l(f){const u=[],h=f.index,m=f.attributes.position;let _=0;if(m===void 0)return;if(h!==null){const v=h.array;_=h.version;for(let y=0,g=v.length;y<g;y+=3){const b=v[y+0],w=v[y+1],T=v[y+2];u.push(b,w,w,T,T,b)}}else{const v=m.array;_=m.version;for(let y=0,g=v.length/3-1;y<g;y+=3){const b=y+0,w=y+1,T=y+2;u.push(b,w,w,T,T,b)}}const x=new(m.count>=65535?Bm:Fm)(u,1);x.version=_;const p=a.get(f);p&&t.remove(p),a.set(f,x)}function d(f){const u=a.get(f);if(u){const h=f.index;h!==null&&u.version<h.version&&l(f)}else l(f);return a.get(f)}return{get:r,update:c,getWireframeAttribute:d}}function l2(e,t,n){let i;function s(f){i=f}let a,o;function r(f){a=f.type,o=f.bytesPerElement}function c(f,u){e.drawElements(i,u,a,f*o),n.update(u,i,1)}function l(f,u,h){h!==0&&(e.drawElementsInstanced(i,u,a,f*o,h),n.update(u,i,h))}function d(f,u,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,u,0,a,f,0,h);let _=0;for(let x=0;x<h;x++)_+=u[x];n.update(_,i,1)}this.setMode=s,this.setIndex=r,this.render=c,this.renderInstances=l,this.renderMultiDraw=d}function d2(e){const t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function i(a,o,r){switch(n.calls++,o){case e.TRIANGLES:n.triangles+=r*(a/3);break;case e.LINES:n.lines+=r*(a/2);break;case e.LINE_STRIP:n.lines+=r*(a-1);break;case e.LINE_LOOP:n.lines+=r*a;break;case e.POINTS:n.points+=r*a;break;default:ce("WebGLInfo: Unknown draw mode:",o);break}}function s(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:s,update:i}}function f2(e,t,n){const i=new WeakMap,s=new Ae;function a(o,r,c){const l=o.morphTargetInfluences,d=r.morphAttributes.position||r.morphAttributes.normal||r.morphAttributes.color,f=d!==void 0?d.length:0;let u=i.get(r);if(u===void 0||u.count!==f){let E=function(){T.dispose(),i.delete(r),r.removeEventListener("dispose",E)};u!==void 0&&u.texture.dispose();const h=r.morphAttributes.position!==void 0,m=r.morphAttributes.normal!==void 0,_=r.morphAttributes.color!==void 0,x=r.morphAttributes.position||[],p=r.morphAttributes.normal||[],v=r.morphAttributes.color||[];let y=0;h===!0&&(y=1),m===!0&&(y=2),_===!0&&(y=3);let g=r.attributes.position.count*y,b=1;g>t.maxTextureSize&&(b=Math.ceil(g/t.maxTextureSize),g=t.maxTextureSize);const w=new Float32Array(g*b*4*f),T=new Nm(w,g,b,f);T.type=oi,T.needsUpdate=!0;const M=y*4;for(let A=0;A<f;A++){const C=x[A],I=p[A],U=v[A],P=g*b*4*A;for(let O=0;O<C.count;O++){const V=O*M;h===!0&&(s.fromBufferAttribute(C,O),w[P+V+0]=s.x,w[P+V+1]=s.y,w[P+V+2]=s.z,w[P+V+3]=0),m===!0&&(s.fromBufferAttribute(I,O),w[P+V+4]=s.x,w[P+V+5]=s.y,w[P+V+6]=s.z,w[P+V+7]=0),_===!0&&(s.fromBufferAttribute(U,O),w[P+V+8]=s.x,w[P+V+9]=s.y,w[P+V+10]=s.z,w[P+V+11]=U.itemSize===4?s.w:1)}}u={count:f,texture:T,size:new Ct(g,b)},i.set(r,u),r.addEventListener("dispose",E)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(e,"morphTexture",o.morphTexture,n);else{let h=0;for(let _=0;_<l.length;_++)h+=l[_];const m=r.morphTargetsRelative?1:1-h;c.getUniforms().setValue(e,"morphTargetBaseInfluence",m),c.getUniforms().setValue(e,"morphTargetInfluences",l)}c.getUniforms().setValue(e,"morphTargetsTexture",u.texture,n),c.getUniforms().setValue(e,"morphTargetsTextureSize",u.size)}return{update:a}}function u2(e,t,n,i,s){let a=new WeakMap;function o(l){const d=s.render.frame,f=l.geometry,u=t.get(l,f);if(a.get(u)!==d&&(t.update(u),a.set(u,d)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),a.get(l)!==d&&(n.update(l.instanceMatrix,e.ARRAY_BUFFER),l.instanceColor!==null&&n.update(l.instanceColor,e.ARRAY_BUFFER),a.set(l,d))),l.isSkinnedMesh){const h=l.skeleton;a.get(h)!==d&&(h.update(),a.set(h,d))}return u}function r(){a=new WeakMap}function c(l){const d=l.target;d.removeEventListener("dispose",c),i.releaseStatesOfObject(d),n.remove(d.instanceMatrix),d.instanceColor!==null&&n.remove(d.instanceColor)}return{update:o,dispose:r}}const h2={[vm]:"LINEAR_TONE_MAPPING",[Mm]:"REINHARD_TONE_MAPPING",[ym]:"CINEON_TONE_MAPPING",[bm]:"ACES_FILMIC_TONE_MAPPING",[wm]:"AGX_TONE_MAPPING",[Em]:"NEUTRAL_TONE_MAPPING",[Sm]:"CUSTOM_TONE_MAPPING"};function p2(e,t,n,i,s,a){const o=new Kn(t,n,{type:e,depthBuffer:s,stencilBuffer:a,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let r=null,c=null;const l=new Ne;l.setAttribute("position",new le([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new le([0,2,0,0,2,0],2));const d=new nv({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),f=new we(l,d),u=new zl(-1,1,1,-1,0,1);let h=null,m=null,_=!1,x,p=null,v=[],y=!1;this.setSize=function(g,b){o.setSize(g,b),r!==null&&r.setSize(g,b),c!==null&&c.setSize(g,b);for(let w=0;w<v.length;w++){const T=v[w];T.setSize&&T.setSize(g,b)}},this.setEffects=function(g){v=g,y=v.length>0&&v[0].isRenderPass===!0;const b=o.width,w=o.height;v.length>0&&r===null&&(r=new Kn(b,w,{type:ui,depthBuffer:!1,stencilBuffer:!1}),c=new Kn(b,w,{type:ui,depthBuffer:!1,stencilBuffer:!1}));for(let T=0;T<v.length;T++){const M=v[T];M.setSize&&M.setSize(b,w)}},this.begin=function(g,b){if(_||g.toneMapping===li&&v.length===0)return!1;if(p=b,b!==null){const w=b.width,T=b.height;(o.width!==w||o.height!==T)&&this.setSize(w,T)}return y===!1&&g.setRenderTarget(o),x=g.toneMapping,g.toneMapping=li,!0},this.hasRenderPass=function(){return y},this.end=function(g,b){g.toneMapping=x,_=!0;let w=o,T=r;for(let M=0;M<v.length;M++){const E=v[M];E.enabled!==!1&&(E.render(g,T,w,b),E.needsSwap!==!1&&(w=T,T=T===r?c:r))}if(h!==g.outputColorSpace||m!==g.toneMapping){h=g.outputColorSpace,m=g.toneMapping,d.defines={},oe.getTransfer(h)===me&&(d.defines.SRGB_TRANSFER="");const M=h2[m];M&&(d.defines[M]=""),d.needsUpdate=!0}d.uniforms.tDiffuse.value=w.texture,g.setRenderTarget(p),g.render(f,u),p=null,_=!1},this.isCompositing=function(){return _},this.dispose=function(){o.dispose(),r!==null&&r.dispose(),c!==null&&c.dispose(),l.dispose(),d.dispose()}}const rx=new en,Vf=new sr(1,1),cx=new Nm,lx=new t_,dx=new Gm,vh=[],Mh=[],yh=new Float32Array(16),bh=new Float32Array(9),Sh=new Float32Array(4);function Qa(e,t,n){const i=e[0];if(i<=0||i>0)return e;const s=t*n;let a=vh[s];if(a===void 0&&(a=new Float32Array(s),vh[s]=a),t!==0){i.toArray(a,0);for(let o=1,r=0;o!==t;++o)r+=n,e[o].toArray(a,r)}return a}function Ge(e,t){if(e.length!==t.length)return!1;for(let n=0,i=e.length;n<i;n++)if(e[n]!==t[n])return!1;return!0}function He(e,t){for(let n=0,i=t.length;n<i;n++)e[n]=t[n]}function Cl(e,t){let n=Mh[t];n===void 0&&(n=new Int32Array(t),Mh[t]=n);for(let i=0;i!==t;++i)n[i]=e.allocateTextureUnit();return n}function m2(e,t){const n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function x2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Ge(n,t))return;e.uniform2fv(this.addr,t),He(n,t)}}function g2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(Ge(n,t))return;e.uniform3fv(this.addr,t),He(n,t)}}function _2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Ge(n,t))return;e.uniform4fv(this.addr,t),He(n,t)}}function v2(e,t){const n=this.cache,i=t.elements;if(i===void 0){if(Ge(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),He(n,t)}else{if(Ge(n,i))return;Sh.set(i),e.uniformMatrix2fv(this.addr,!1,Sh),He(n,i)}}function M2(e,t){const n=this.cache,i=t.elements;if(i===void 0){if(Ge(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),He(n,t)}else{if(Ge(n,i))return;bh.set(i),e.uniformMatrix3fv(this.addr,!1,bh),He(n,i)}}function y2(e,t){const n=this.cache,i=t.elements;if(i===void 0){if(Ge(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),He(n,t)}else{if(Ge(n,i))return;yh.set(i),e.uniformMatrix4fv(this.addr,!1,yh),He(n,i)}}function b2(e,t){const n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function S2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Ge(n,t))return;e.uniform2iv(this.addr,t),He(n,t)}}function w2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Ge(n,t))return;e.uniform3iv(this.addr,t),He(n,t)}}function E2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Ge(n,t))return;e.uniform4iv(this.addr,t),He(n,t)}}function T2(e,t){const n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function A2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Ge(n,t))return;e.uniform2uiv(this.addr,t),He(n,t)}}function z2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Ge(n,t))return;e.uniform3uiv(this.addr,t),He(n,t)}}function R2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Ge(n,t))return;e.uniform4uiv(this.addr,t),He(n,t)}}function C2(e,t,n){const i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s);let a;this.type===e.SAMPLER_2D_SHADOW?(Vf.compareFunction=n.isReversedDepthBuffer()?Du:Iu,a=Vf):a=rx,n.setTexture2D(t||a,s)}function P2(e,t,n){const i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s),n.setTexture3D(t||lx,s)}function L2(e,t,n){const i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s),n.setTextureCube(t||dx,s)}function I2(e,t,n){const i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s),n.setTexture2DArray(t||cx,s)}function D2(e){switch(e){case 5126:return m2;case 35664:return x2;case 35665:return g2;case 35666:return _2;case 35674:return v2;case 35675:return M2;case 35676:return y2;case 5124:case 35670:return b2;case 35667:case 35671:return S2;case 35668:case 35672:return w2;case 35669:case 35673:return E2;case 5125:return T2;case 36294:return A2;case 36295:return z2;case 36296:return R2;case 35678:case 36198:case 36298:case 36306:case 35682:return C2;case 35679:case 36299:case 36307:return P2;case 35680:case 36300:case 36308:case 36293:return L2;case 36289:case 36303:case 36311:case 36292:return I2}}function N2(e,t){e.uniform1fv(this.addr,t)}function U2(e,t){const n=Qa(t,this.size,2);e.uniform2fv(this.addr,n)}function O2(e,t){const n=Qa(t,this.size,3);e.uniform3fv(this.addr,n)}function F2(e,t){const n=Qa(t,this.size,4);e.uniform4fv(this.addr,n)}function B2(e,t){const n=Qa(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function G2(e,t){const n=Qa(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function H2(e,t){const n=Qa(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function V2(e,t){e.uniform1iv(this.addr,t)}function k2(e,t){e.uniform2iv(this.addr,t)}function W2(e,t){e.uniform3iv(this.addr,t)}function X2(e,t){e.uniform4iv(this.addr,t)}function $2(e,t){e.uniform1uiv(this.addr,t)}function q2(e,t){e.uniform2uiv(this.addr,t)}function Y2(e,t){e.uniform3uiv(this.addr,t)}function Z2(e,t){e.uniform4uiv(this.addr,t)}function K2(e,t,n){const i=this.cache,s=t.length,a=Cl(n,s);Ge(i,a)||(e.uniform1iv(this.addr,a),He(i,a));let o;this.type===e.SAMPLER_2D_SHADOW?o=Vf:o=rx;for(let r=0;r!==s;++r)n.setTexture2D(t[r]||o,a[r])}function J2(e,t,n){const i=this.cache,s=t.length,a=Cl(n,s);Ge(i,a)||(e.uniform1iv(this.addr,a),He(i,a));for(let o=0;o!==s;++o)n.setTexture3D(t[o]||lx,a[o])}function Q2(e,t,n){const i=this.cache,s=t.length,a=Cl(n,s);Ge(i,a)||(e.uniform1iv(this.addr,a),He(i,a));for(let o=0;o!==s;++o)n.setTextureCube(t[o]||dx,a[o])}function j2(e,t,n){const i=this.cache,s=t.length,a=Cl(n,s);Ge(i,a)||(e.uniform1iv(this.addr,a),He(i,a));for(let o=0;o!==s;++o)n.setTexture2DArray(t[o]||cx,a[o])}function tb(e){switch(e){case 5126:return N2;case 35664:return U2;case 35665:return O2;case 35666:return F2;case 35674:return B2;case 35675:return G2;case 35676:return H2;case 5124:case 35670:return V2;case 35667:case 35671:return k2;case 35668:case 35672:return W2;case 35669:case 35673:return X2;case 5125:return $2;case 36294:return q2;case 36295:return Y2;case 36296:return Z2;case 35678:case 36198:case 36298:case 36306:case 35682:return K2;case 35679:case 36299:case 36307:return J2;case 35680:case 36300:case 36308:case 36293:return Q2;case 36289:case 36303:case 36311:case 36292:return j2}}class eb{constructor(t,n,i){this.id=t,this.addr=i,this.cache=[],this.type=n.type,this.setValue=D2(n.type)}}class nb{constructor(t,n,i){this.id=t,this.addr=i,this.cache=[],this.type=n.type,this.size=n.size,this.setValue=tb(n.type)}}class ib{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,n,i){const s=this.seq;for(let a=0,o=s.length;a!==o;++a){const r=s[a];r.setValue(t,n[r.id],i)}}}const Ed=/(\w+)(\])?(\[|\.)?/g;function wh(e,t){e.seq.push(t),e.map[t.id]=t}function sb(e,t,n){const i=e.name,s=i.length;for(Ed.lastIndex=0;;){const a=Ed.exec(i),o=Ed.lastIndex;let r=a[1];const c=a[2]==="]",l=a[3];if(c&&(r=r|0),l===void 0||l==="["&&o+2===s){wh(n,l===void 0?new eb(r,e,t):new nb(r,e,t));break}else{let f=n.map[r];f===void 0&&(f=new ib(r),wh(n,f)),n=f}}}class Dc{constructor(t,n){this.seq=[],this.map={};const i=t.getProgramParameter(n,t.ACTIVE_UNIFORMS);for(let o=0;o<i;++o){const r=t.getActiveUniform(n,o),c=t.getUniformLocation(n,r.name);sb(r,c,this)}const s=[],a=[];for(const o of this.seq)o.type===t.SAMPLER_2D_SHADOW||o.type===t.SAMPLER_CUBE_SHADOW||o.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(o):a.push(o);s.length>0&&(this.seq=s.concat(a))}setValue(t,n,i,s){const a=this.map[n];a!==void 0&&a.setValue(t,i,s)}setOptional(t,n,i){const s=n[i];s!==void 0&&this.setValue(t,i,s)}static upload(t,n,i,s){for(let a=0,o=n.length;a!==o;++a){const r=n[a],c=i[r.id];c.needsUpdate!==!1&&r.setValue(t,c.value,s)}}static seqWithValue(t,n){const i=[];for(let s=0,a=t.length;s!==a;++s){const o=t[s];o.id in n&&i.push(o)}return i}}function Eh(e,t,n){const i=e.createShader(t);return e.shaderSource(i,n),e.compileShader(i),i}const ab=37297;let ob=0;function rb(e,t){const n=e.split(`
`),i=[],s=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let o=s;o<a;o++){const r=o+1;i.push(`${r===t?">":" "} ${r}: ${n[o]}`)}return i.join(`
`)}const Th=new te;function cb(e){oe._getMatrix(Th,oe.workingColorSpace,e);const t=`mat3( ${Th.elements.map(n=>n.toFixed(4))} )`;switch(oe.getTransfer(e)){case Yc:return[t,"LinearTransferOETF"];case me:return[t,"sRGBTransferOETF"];default:return Qt("WebGLProgram: Unsupported color space: ",e),[t,"LinearTransferOETF"]}}function Ah(e,t,n){const i=e.getShaderParameter(t,e.COMPILE_STATUS),a=(e.getShaderInfoLog(t)||"").trim();if(i&&a==="")return"";const o=/ERROR: 0:(\d+)/.exec(a);if(o){const r=parseInt(o[1]);return n.toUpperCase()+`

`+a+`

`+rb(e.getShaderSource(t),r)}else return a}function lb(e,t){const n=cb(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,"}"].join(`
`)}const db={[vm]:"Linear",[Mm]:"Reinhard",[ym]:"Cineon",[bm]:"ACESFilmic",[wm]:"AgX",[Em]:"Neutral",[Sm]:"Custom"};function fb(e,t){const n=db[t];return n===void 0?(Qt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+e+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+e+"( vec3 color ) { return "+n+"ToneMapping( color ); }"}const oc=new q;function ub(){oe.getLuminanceCoefficients(oc);const e=oc.x.toFixed(4),t=oc.y.toFixed(4),n=oc.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${e}, ${t}, ${n} );`,"	return dot( weights, rgb );","}"].join(`
`)}function hb(e){return[e.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",e.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ao).join(`
`)}function pb(e){const t=[];for(const n in e){const i=e[n];i!==!1&&t.push("#define "+n+" "+i)}return t.join(`
`)}function mb(e,t){const n={},i=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){const a=e.getActiveAttrib(t,s),o=a.name;let r=1;a.type===e.FLOAT_MAT2&&(r=2),a.type===e.FLOAT_MAT3&&(r=3),a.type===e.FLOAT_MAT4&&(r=4),n[o]={type:a.type,location:e.getAttribLocation(t,o),locationSize:r}}return n}function Ao(e){return e!==""}function zh(e,t){const n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Rh(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const xb=/^[ \t]*#include +<([\w\d./]+)>/gm;function kf(e){return e.replace(xb,_b)}const gb=new Map;function _b(e,t){let n=ie[t];if(n===void 0){const i=gb.get(t);if(i!==void 0)n=ie[i],Qt('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return kf(n)}const vb=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Ch(e){return e.replace(vb,Mb)}function Mb(e,t,n,i){let s="";for(let a=parseInt(t);a<parseInt(n);a++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+a+" ]").replace(/UNROLLED_LOOP_INDEX/g,a);return s}function Ph(e){let t=`precision ${e.precision} float;
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
#define LOW_PRECISION`),t}const yb={[Uo]:"SHADOWMAP_TYPE_PCF",[Eo]:"SHADOWMAP_TYPE_VSM"};function bb(e){return yb[e.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const Sb={[Ns]:"ENVMAP_TYPE_CUBE",[Ha]:"ENVMAP_TYPE_CUBE",[Sl]:"ENVMAP_TYPE_CUBE_UV"};function wb(e){return e.envMap===!1?"ENVMAP_TYPE_CUBE":Sb[e.envMapMode]||"ENVMAP_TYPE_CUBE"}const Eb={[Ha]:"ENVMAP_MODE_REFRACTION"};function Tb(e){return e.envMap===!1?"ENVMAP_MODE_REFLECTION":Eb[e.envMapMode]||"ENVMAP_MODE_REFLECTION"}const Ab={[Tu]:"ENVMAP_BLENDING_MULTIPLY",[P1]:"ENVMAP_BLENDING_MIX",[L1]:"ENVMAP_BLENDING_ADD"};function zb(e){return e.envMap===!1?"ENVMAP_BLENDING_NONE":Ab[e.combine]||"ENVMAP_BLENDING_NONE"}function Rb(e){const t=e.envMapCubeUVHeight;if(t===null)return null;const n=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,n),112)),texelHeight:i,maxMip:n}}function Cb(e,t,n,i){const s=e.getContext(),a=n.defines;let o=n.vertexShader,r=n.fragmentShader;const c=bb(n),l=wb(n),d=Tb(n),f=zb(n),u=Rb(n),h=hb(n),m=pb(a),_=s.createProgram();let x,p,v=n.glslVersion?"#version "+n.glslVersion+`
`:"";n.isRawShaderMaterial?(x=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m].filter(Ao).join(`
`),x.length>0&&(x+=`
`),p=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m].filter(Ao).join(`
`),p.length>0&&(p+=`
`)):(x=[Ph(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m,n.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",n.batching?"#define USE_BATCHING":"",n.batchingColor?"#define USE_BATCHING_COLOR":"",n.instancing?"#define USE_INSTANCING":"",n.instancingColor?"#define USE_INSTANCING_COLOR":"",n.instancingMorph?"#define USE_INSTANCING_MORPH":"",n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.map?"#define USE_MAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+d:"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.displacementMap?"#define USE_DISPLACEMENTMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.mapUv?"#define MAP_UV "+n.mapUv:"",n.alphaMapUv?"#define ALPHAMAP_UV "+n.alphaMapUv:"",n.lightMapUv?"#define LIGHTMAP_UV "+n.lightMapUv:"",n.aoMapUv?"#define AOMAP_UV "+n.aoMapUv:"",n.emissiveMapUv?"#define EMISSIVEMAP_UV "+n.emissiveMapUv:"",n.bumpMapUv?"#define BUMPMAP_UV "+n.bumpMapUv:"",n.normalMapUv?"#define NORMALMAP_UV "+n.normalMapUv:"",n.displacementMapUv?"#define DISPLACEMENTMAP_UV "+n.displacementMapUv:"",n.metalnessMapUv?"#define METALNESSMAP_UV "+n.metalnessMapUv:"",n.roughnessMapUv?"#define ROUGHNESSMAP_UV "+n.roughnessMapUv:"",n.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+n.anisotropyMapUv:"",n.clearcoatMapUv?"#define CLEARCOATMAP_UV "+n.clearcoatMapUv:"",n.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+n.clearcoatNormalMapUv:"",n.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+n.clearcoatRoughnessMapUv:"",n.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+n.iridescenceMapUv:"",n.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+n.iridescenceThicknessMapUv:"",n.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+n.sheenColorMapUv:"",n.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+n.sheenRoughnessMapUv:"",n.specularMapUv?"#define SPECULARMAP_UV "+n.specularMapUv:"",n.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+n.specularColorMapUv:"",n.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+n.specularIntensityMapUv:"",n.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+n.transmissionMapUv:"",n.thicknessMapUv?"#define THICKNESSMAP_UV "+n.thicknessMapUv:"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexNormals?"#define HAS_NORMAL":"",n.vertexColors?"#define USE_COLOR":"",n.vertexAlphas?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.flatShading?"#define FLAT_SHADED":"",n.skinning?"#define USE_SKINNING":"",n.morphTargets?"#define USE_MORPHTARGETS":"",n.morphNormals&&n.flatShading===!1?"#define USE_MORPHNORMALS":"",n.morphColors?"#define USE_MORPHCOLORS":"",n.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+n.morphTextureStride:"",n.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+n.morphTargetsCount:"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+c:"",n.sizeAttenuation?"#define USE_SIZEATTENUATION":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ao).join(`
`),p=[Ph(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m,n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",n.map?"#define USE_MAP":"",n.matcap?"#define USE_MATCAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+l:"",n.envMap?"#define "+d:"",n.envMap?"#define "+f:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoat?"#define USE_CLEARCOAT":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.dispersion?"#define USE_DISPERSION":"",n.retroreflection?"#define USE_RETROREFLECTION":"",n.iridescence?"#define USE_IRIDESCENCE":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaTest?"#define USE_ALPHATEST":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.sheen?"#define USE_SHEEN":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexColors||n.instancingColor?"#define USE_COLOR":"",n.vertexAlphas||n.batchingColor?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.gradientMap?"#define USE_GRADIENTMAP":"",n.flatShading?"#define FLAT_SHADED":"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+c:"",n.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",n.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",n.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",n.toneMapping!==li?"#define TONE_MAPPING":"",n.toneMapping!==li?ie.tonemapping_pars_fragment:"",n.toneMapping!==li?fb("toneMapping",n.toneMapping):"",n.dithering?"#define DITHERING":"",n.opaque?"#define OPAQUE":"",ie.colorspace_pars_fragment,lb("linearToOutputTexel",n.outputColorSpace),ub(),n.useDepthPacking?"#define DEPTH_PACKING "+n.depthPacking:"",`
`].filter(Ao).join(`
`)),o=kf(o),o=zh(o,n),o=Rh(o,n),r=kf(r),r=zh(r,n),r=Rh(r,n),o=Ch(o),r=Ch(r),n.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,x=[h,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+x,p=["#define varying in",n.glslVersion===B0?"":"layout(location = 0) out highp vec4 pc_fragColor;",n.glslVersion===B0?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const y=v+x+o,g=v+p+r,b=Eh(s,s.VERTEX_SHADER,y),w=Eh(s,s.FRAGMENT_SHADER,g);s.attachShader(_,b),s.attachShader(_,w),n.index0AttributeName!==void 0?s.bindAttribLocation(_,0,n.index0AttributeName):n.hasPositionAttribute===!0&&s.bindAttribLocation(_,0,"position"),s.linkProgram(_);function T(C){if(e.debug.checkShaderErrors){const I=s.getProgramInfoLog(_)||"",U=s.getShaderInfoLog(b)||"",P=s.getShaderInfoLog(w)||"",O=I.trim(),V=U.trim(),N=P.trim();let F=!0,L=!0;if(s.getProgramParameter(_,s.LINK_STATUS)===!1)if(F=!1,typeof e.debug.onShaderError=="function")e.debug.onShaderError(s,_,b,w);else{const B=Ah(s,b,"vertex"),$=Ah(s,w,"fragment");ce("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(_,s.VALIDATE_STATUS)+`

Material Name: `+C.name+`
Material Type: `+C.type+`

Program Info Log: `+O+`
`+B+`
`+$)}else O!==""?Qt("WebGLProgram: Program Info Log:",O):(V===""||N==="")&&(L=!1);L&&(C.diagnostics={runnable:F,programLog:O,vertexShader:{log:V,prefix:x},fragmentShader:{log:N,prefix:p}})}s.deleteShader(b),s.deleteShader(w),M=new Dc(s,_),E=mb(s,_)}let M;this.getUniforms=function(){return M===void 0&&T(this),M};let E;this.getAttributes=function(){return E===void 0&&T(this),E};let A=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return A===!1&&(A=s.getProgramParameter(_,ab)),A},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(_),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=ob++,this.cacheKey=t,this.usedTimes=1,this.program=_,this.vertexShader=b,this.fragmentShader=w,this}let Pb=0;class Lb{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,n,i){const s=this._getShaderCacheForMaterial(t);return s.has(n)===!1&&(s.add(n),n.usedTimes++),s.has(i)===!1&&(s.add(i),i.usedTimes++),this}remove(t){const n=this.materialCache.get(t);for(const i of n)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const n=this.materialCache;let i=n.get(t);return i===void 0&&(i=new Set,n.set(t,i)),i}_getShaderStage(t){const n=this.shaderCache;let i=n.get(t);return i===void 0&&(i=new Ib(t),n.set(t,i)),i}}class Ib{constructor(t){this.id=Pb++,this.code=t,this.usedTimes=0}}function Db(e){return e===Us||e===Wc||e===Xc}function Nb(e,t,n,i,s,a){const o=new Um,r=new Lb,c=new Set,l=[],d=new Map,f=i.logarithmicDepthBuffer;let u=i.precision;const h={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function m(M){return c.add(M),M===0?"uv":`uv${M}`}function _(M,E,A,C,I,U){const P=C.fog,O=I.geometry,V=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?C.environment:null,N=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap,F=t.get(M.envMap||V,N),L=F&&F.mapping===Sl?F.image.height:null,B=h[M.type];M.precision!==null&&(u=i.getMaxPrecision(M.precision),u!==M.precision&&Qt("WebGLProgram.getParameters:",M.precision,"not supported, using",u,"instead."));const $=O.morphAttributes.position||O.morphAttributes.normal||O.morphAttributes.color,J=$!==void 0?$.length:0;let st=0;O.morphAttributes.position!==void 0&&(st=1),O.morphAttributes.normal!==void 0&&(st=2),O.morphAttributes.color!==void 0&&(st=3);let Tt,H,et,W;if(B){const ye=ai[B];Tt=ye.vertexShader,H=ye.fragmentShader}else{Tt=M.vertexShader,H=M.fragmentShader;const ye=r.getVertexShaderStage(M),fe=r.getFragmentShaderStage(M);r.update(M,ye,fe),et=ye.id,W=fe.id}const k=e.getRenderTarget(),at=e.state.buffers.depth.getReversed(),mt=I.isInstancedMesh===!0,rt=I.isBatchedMesh===!0,Mt=!!M.map,Kt=!!M.matcap,lt=!!F,pt=!!M.aoMap,xt=!!M.lightMap,yt=!!M.bumpMap&&M.wireframe===!1,j=!!M.normalMap,wt=!!M.displacementMap,Pt=!!M.emissiveMap,bt=!!M.metalnessMap,Zt=!!M.roughnessMap,G=M.anisotropy>0,Q=M.clearcoat>0,ut=M.dispersion>0,R=M.retroreflectivity>0,S=M.iridescence>0,X=M.sheen>0,K=M.transmission>0,tt=G&&!!M.anisotropyMap,_t=Q&&!!M.clearcoatMap,St=Q&&!!M.clearcoatNormalMap,ct=Q&&!!M.clearcoatRoughnessMap,dt=S&&!!M.iridescenceMap,Et=S&&!!M.iridescenceThicknessMap,At=X&&!!M.sheenColorMap,zt=X&&!!M.sheenRoughnessMap,Rt=!!M.specularMap,Ot=!!M.specularColorMap,$t=!!M.specularIntensityMap,Jt=K&&!!M.transmissionMap,Z=K&&!!M.thicknessMap,Lt=!!M.gradientMap,ht=!!M.alphaMap,It=M.alphaTest>0,Ft=!!M.alphaHash,vt=!!M.extensions;let Yt=li;M.toneMapped&&(k===null||k.isXRRenderTarget===!0)&&(Yt=e.toneMapping);const Xt={shaderID:B,shaderType:M.type,shaderName:M.name,vertexShader:Tt,fragmentShader:H,defines:M.defines,customVertexShaderID:et,customFragmentShaderID:W,isRawShaderMaterial:M.isRawShaderMaterial===!0,glslVersion:M.glslVersion,precision:u,batching:rt,batchingColor:rt&&I._colorsTexture!==null,instancing:mt,instancingColor:mt&&I.instanceColor!==null,instancingMorph:mt&&I.morphTexture!==null,outputColorSpace:k===null?e.outputColorSpace:k.isXRRenderTarget===!0?k.texture.colorSpace:oe.workingColorSpace,alphaToCoverage:!!M.alphaToCoverage,map:Mt,matcap:Kt,envMap:lt,envMapMode:lt&&F.mapping,envMapCubeUVHeight:L,aoMap:pt,lightMap:xt,bumpMap:yt,normalMap:j,displacementMap:wt,emissiveMap:Pt,normalMapObjectSpace:j&&M.normalMapType===N1,normalMapTangentSpace:j&&M.normalMapType===$c,packedNormalMap:j&&M.normalMapType===$c&&Db(M.normalMap.format),metalnessMap:bt,roughnessMap:Zt,anisotropy:G,anisotropyMap:tt,clearcoat:Q,clearcoatMap:_t,clearcoatNormalMap:St,clearcoatRoughnessMap:ct,dispersion:ut,retroreflection:R,iridescence:S,iridescenceMap:dt,iridescenceThicknessMap:Et,sheen:X,sheenColorMap:At,sheenRoughnessMap:zt,specularMap:Rt,specularColorMap:Ot,specularIntensityMap:$t,transmission:K,transmissionMap:Jt,thicknessMap:Z,gradientMap:Lt,opaque:M.transparent===!1&&M.blending===Oo&&M.alphaToCoverage===!1,alphaMap:ht,alphaTest:It,alphaHash:Ft,combine:M.combine,mapUv:Mt&&m(M.map.channel),aoMapUv:pt&&m(M.aoMap.channel),lightMapUv:xt&&m(M.lightMap.channel),bumpMapUv:yt&&m(M.bumpMap.channel),normalMapUv:j&&m(M.normalMap.channel),displacementMapUv:wt&&m(M.displacementMap.channel),emissiveMapUv:Pt&&m(M.emissiveMap.channel),metalnessMapUv:bt&&m(M.metalnessMap.channel),roughnessMapUv:Zt&&m(M.roughnessMap.channel),anisotropyMapUv:tt&&m(M.anisotropyMap.channel),clearcoatMapUv:_t&&m(M.clearcoatMap.channel),clearcoatNormalMapUv:St&&m(M.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ct&&m(M.clearcoatRoughnessMap.channel),iridescenceMapUv:dt&&m(M.iridescenceMap.channel),iridescenceThicknessMapUv:Et&&m(M.iridescenceThicknessMap.channel),sheenColorMapUv:At&&m(M.sheenColorMap.channel),sheenRoughnessMapUv:zt&&m(M.sheenRoughnessMap.channel),specularMapUv:Rt&&m(M.specularMap.channel),specularColorMapUv:Ot&&m(M.specularColorMap.channel),specularIntensityMapUv:$t&&m(M.specularIntensityMap.channel),transmissionMapUv:Jt&&m(M.transmissionMap.channel),thicknessMapUv:Z&&m(M.thicknessMap.channel),alphaMapUv:ht&&m(M.alphaMap.channel),vertexTangents:!!O.attributes.tangent&&(j||G),vertexNormals:!!O.attributes.normal,vertexColors:M.vertexColors,vertexAlphas:M.vertexColors===!0&&!!O.attributes.color&&O.attributes.color.itemSize===4,pointsUvs:I.isPoints===!0&&!!O.attributes.uv&&(Mt||ht),fog:!!P,useFog:M.fog===!0,fogExp2:!!P&&P.isFogExp2,flatShading:M.wireframe===!1&&(M.flatShading===!0||O.attributes.normal===void 0&&j===!1&&(M.isMeshLambertMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isMeshPhysicalMaterial)),sizeAttenuation:M.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:at,skinning:I.isSkinnedMesh===!0,hasPositionAttribute:O.attributes.position!==void 0,morphTargets:O.morphAttributes.position!==void 0,morphNormals:O.morphAttributes.normal!==void 0,morphColors:O.morphAttributes.color!==void 0,morphTargetsCount:J,morphTextureStride:st,numSunLights:E.sun.length,numDirLights:E.directional.length,numPointLights:E.point.length,numSpotLights:E.spot.length,numSpotLightMaps:E.spotLightMap.length,numRectAreaLights:E.rectArea.length,numHemiLights:E.hemi.length,numSunLightShadows:E.sunShadowMap.length,numDirLightShadows:E.directionalShadowMap.length,numPointLightShadows:E.pointShadowMap.length,numSpotLightShadows:E.spotShadowMap.length,numSpotLightShadowsWithMaps:E.numSpotLightShadowsWithMaps,numLightProbes:E.numLightProbes,numLightProbeGrids:U.length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:M.dithering,shadowMapEnabled:e.shadowMap.enabled&&A.length>0,shadowMapType:e.shadowMap.type,toneMapping:Yt,decodeVideoTexture:Mt&&M.map.isVideoTexture===!0&&oe.getTransfer(M.map.colorSpace)===me,decodeVideoTextureEmissive:Pt&&M.emissiveMap.isVideoTexture===!0&&oe.getTransfer(M.emissiveMap.colorSpace)===me,premultipliedAlpha:M.premultipliedAlpha,doubleSided:M.side===zi,flipSided:M.side===hn,useDepthPacking:M.depthPacking>=0,depthPacking:M.depthPacking||0,index0AttributeName:M.index0AttributeName,extensionClipCullDistance:vt&&M.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(vt&&M.extensions.multiDraw===!0||rt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:M.customProgramCacheKey()};return Xt.vertexUv1s=c.has(1),Xt.vertexUv2s=c.has(2),Xt.vertexUv3s=c.has(3),c.clear(),Xt}function x(M){const E=[];if(M.shaderID?E.push(M.shaderID):(E.push(M.customVertexShaderID),E.push(M.customFragmentShaderID)),M.defines!==void 0)for(const A in M.defines)E.push(A),E.push(M.defines[A]);return M.isRawShaderMaterial===!1&&(p(E,M),v(E,M),E.push(e.outputColorSpace)),E.push(M.customProgramCacheKey),E.join()}function p(M,E){M.push(E.precision),M.push(E.outputColorSpace),M.push(E.envMapMode),M.push(E.envMapCubeUVHeight),M.push(E.mapUv),M.push(E.alphaMapUv),M.push(E.lightMapUv),M.push(E.aoMapUv),M.push(E.bumpMapUv),M.push(E.normalMapUv),M.push(E.displacementMapUv),M.push(E.emissiveMapUv),M.push(E.metalnessMapUv),M.push(E.roughnessMapUv),M.push(E.anisotropyMapUv),M.push(E.clearcoatMapUv),M.push(E.clearcoatNormalMapUv),M.push(E.clearcoatRoughnessMapUv),M.push(E.iridescenceMapUv),M.push(E.iridescenceThicknessMapUv),M.push(E.sheenColorMapUv),M.push(E.sheenRoughnessMapUv),M.push(E.specularMapUv),M.push(E.specularColorMapUv),M.push(E.specularIntensityMapUv),M.push(E.transmissionMapUv),M.push(E.thicknessMapUv),M.push(E.combine),M.push(E.fogExp2),M.push(E.sizeAttenuation),M.push(E.morphTargetsCount),M.push(E.morphAttributeCount),M.push(E.numSunLights),M.push(E.numDirLights),M.push(E.numPointLights),M.push(E.numSpotLights),M.push(E.numSpotLightMaps),M.push(E.numHemiLights),M.push(E.numRectAreaLights),M.push(E.numSunLightShadows),M.push(E.numDirLightShadows),M.push(E.numPointLightShadows),M.push(E.numSpotLightShadows),M.push(E.numSpotLightShadowsWithMaps),M.push(E.numLightProbes),M.push(E.shadowMapType),M.push(E.toneMapping),M.push(E.numClippingPlanes),M.push(E.numClipIntersection),M.push(E.depthPacking)}function v(M,E){o.disableAll(),E.instancing&&o.enable(0),E.instancingColor&&o.enable(1),E.instancingMorph&&o.enable(2),E.matcap&&o.enable(3),E.envMap&&o.enable(4),E.normalMapObjectSpace&&o.enable(5),E.normalMapTangentSpace&&o.enable(6),E.clearcoat&&o.enable(7),E.iridescence&&o.enable(8),E.alphaTest&&o.enable(9),E.vertexColors&&o.enable(10),E.vertexAlphas&&o.enable(11),E.vertexUv1s&&o.enable(12),E.vertexUv2s&&o.enable(13),E.vertexUv3s&&o.enable(14),E.vertexTangents&&o.enable(15),E.anisotropy&&o.enable(16),E.alphaHash&&o.enable(17),E.batching&&o.enable(18),E.dispersion&&o.enable(19),E.retroreflection&&o.enable(24),E.batchingColor&&o.enable(20),E.gradientMap&&o.enable(21),E.packedNormalMap&&o.enable(22),E.vertexNormals&&o.enable(23),M.push(o.mask),o.disableAll(),E.fog&&o.enable(0),E.useFog&&o.enable(1),E.flatShading&&o.enable(2),E.logarithmicDepthBuffer&&o.enable(3),E.reversedDepthBuffer&&o.enable(4),E.skinning&&o.enable(5),E.morphTargets&&o.enable(6),E.morphNormals&&o.enable(7),E.morphColors&&o.enable(8),E.premultipliedAlpha&&o.enable(9),E.shadowMapEnabled&&o.enable(10),E.doubleSided&&o.enable(11),E.flipSided&&o.enable(12),E.useDepthPacking&&o.enable(13),E.dithering&&o.enable(14),E.transmission&&o.enable(15),E.sheen&&o.enable(16),E.opaque&&o.enable(17),E.pointsUvs&&o.enable(18),E.decodeVideoTexture&&o.enable(19),E.decodeVideoTextureEmissive&&o.enable(20),E.alphaToCoverage&&o.enable(21),E.numLightProbeGrids>0&&o.enable(22),E.hasPositionAttribute&&o.enable(23),M.push(o.mask)}function y(M){const E=h[M.type];let A;if(E){const C=ai[E];A=j_.clone(C.uniforms)}else A=M.uniforms;return A}function g(M,E){let A=d.get(E);return A!==void 0?++A.usedTimes:(A=new Cb(e,E,M,s),l.push(A),d.set(E,A)),A}function b(M){if(--M.usedTimes===0){const E=l.indexOf(M);l[E]=l[l.length-1],l.pop(),d.delete(M.cacheKey),M.destroy()}}function w(M){r.remove(M)}function T(){r.dispose()}return{getParameters:_,getProgramCacheKey:x,getUniforms:y,acquireProgram:g,releaseProgram:b,releaseShaderCache:w,programs:l,dispose:T}}function Ub(){let e=new WeakMap;function t(o){return e.has(o)}function n(o){let r=e.get(o);return r===void 0&&(r={},e.set(o,r)),r}function i(o){e.delete(o)}function s(o,r,c){e.get(o)[r]=c}function a(){e=new WeakMap}return{has:t,get:n,remove:i,update:s,dispose:a}}function Ob(e,t){return e.groupOrder!==t.groupOrder?e.groupOrder-t.groupOrder:e.renderOrder!==t.renderOrder?e.renderOrder-t.renderOrder:e.material.id!==t.material.id?e.material.id-t.material.id:e.materialVariant!==t.materialVariant?e.materialVariant-t.materialVariant:e.z!==t.z?e.z-t.z:e.id-t.id}function Lh(e,t){return e.groupOrder!==t.groupOrder?e.groupOrder-t.groupOrder:e.renderOrder!==t.renderOrder?e.renderOrder-t.renderOrder:e.z!==t.z?t.z-e.z:e.id-t.id}function Ih(){const e=[];let t=0;const n=[],i=[],s=[];function a(){t=0,n.length=0,i.length=0,s.length=0}function o(u){let h=0;return u.isInstancedMesh&&(h+=2),u.isSkinnedMesh&&(h+=1),h}function r(u,h,m,_,x,p){let v=e[t];return v===void 0?(v={id:u.id,object:u,geometry:h,material:m,materialVariant:o(u),groupOrder:_,renderOrder:u.renderOrder,z:x,group:p},e[t]=v):(v.id=u.id,v.object=u,v.geometry=h,v.material=m,v.materialVariant=o(u),v.groupOrder=_,v.renderOrder=u.renderOrder,v.z=x,v.group=p),t++,v}function c(u,h,m,_,x,p,v){v.reversedDepth===!0&&(x=-x);const y=r(u,h,m,_,x,p);m.transmission>0?i.push(y):m.transparent===!0?s.push(y):n.push(y)}function l(u,h,m,_,x,p){const v=r(u,h,m,_,x,p);m.transmission>0?i.unshift(v):m.transparent===!0?s.unshift(v):n.unshift(v)}function d(u,h){n.length>1&&n.sort(u||Ob),i.length>1&&i.sort(h||Lh),s.length>1&&s.sort(h||Lh)}function f(){for(let u=t,h=e.length;u<h;u++){const m=e[u];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:n,transmissive:i,transparent:s,init:a,push:c,unshift:l,finish:f,sort:d}}function Fb(){let e=new WeakMap;function t(i,s){const a=e.get(i);let o;return a===void 0?(o=new Ih,e.set(i,[o])):s>=a.length?(o=new Ih,a.push(o)):o=a[s],o}function n(){e=new WeakMap}return{get:t,dispose:n}}function Bb(){const e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"SunLight":case"DirectionalLight":n={direction:new q,color:new ee};break;case"SpotLight":n={position:new q,direction:new q,color:new ee,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":n={position:new q,color:new ee,distance:0,decay:0};break;case"HemisphereLight":n={direction:new q,skyColor:new ee,groundColor:new ee};break;case"RectAreaLight":n={color:new ee,position:new q,halfWidth:new q,halfHeight:new q};break}return e[t.id]=n,n}}}function Gb(){const e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"SunLight":case"DirectionalLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ct};break;case"SpotLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ct};break;case"PointLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ct,shadowCameraNear:1,shadowCameraFar:1e3};break}return e[t.id]=n,n}}}let Hb=0;function Vb(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+(t.map?1:0)-(e.map?1:0)}function kb(e){const t=new Bb,n=Gb(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)i.probe.push(new q);const s=new q,a=new Ee,o=new Ee;function r(l){let d=0,f=0,u=0;for(let I=0;I<9;I++)i.probe[I].set(0,0,0);let h=0,m=0,_=0,x=0,p=0,v=0,y=0,g=0,b=0,w=0,T=0,M=0,E=0,A=0;l.sort(Vb);for(let I=0,U=l.length;I<U;I++){const P=l[I],O=P.color,V=P.intensity,N=P.distance;let F=null;if(P.shadow&&P.shadow.map&&(P.shadow.map.texture.format===Us?F=P.shadow.map.texture:F=P.shadow.map.depthTexture||P.shadow.map.texture),P.isAmbientLight)d+=O.r*V,f+=O.g*V,u+=O.b*V;else if(P.isLightProbe){for(let L=0;L<9;L++)i.probe[L].addScaledVector(P.sh.coefficients[L],V);A++}else if(P.isSunLight){const L=t.get(P);if(L.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){const B=P.shadow,$=n.get(P);$.shadowIntensity=B.intensity,$.shadowBias=B.bias,$.shadowNormalBias=B.normalBias,$.shadowRadius=B.radius,$.shadowMapSize.copy(B.mapSize).multiply(B.getFrameExtents()),i.sunShadow[m]=$,i.sunShadowMap[m]=F;const J=B.getViewportCount();for(let st=0;st<J;st++)i.sunShadowMatrix[_+st]=B.getMatrix(st),i.sunShadowCascade[_+st]=B._cascadeData[st];_+=J,m++}i.sun[h]=L,h++}else if(P.isDirectionalLight){const L=t.get(P);if(L.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){const B=P.shadow,$=n.get(P);$.shadowIntensity=B.intensity,$.shadowBias=B.bias,$.shadowNormalBias=B.normalBias,$.shadowRadius=B.radius,$.shadowMapSize=B.mapSize,i.directionalShadow[x]=$,i.directionalShadowMap[x]=F,i.directionalShadowMatrix[x]=P.shadow.matrix,b++}i.directional[x]=L,x++}else if(P.isSpotLight){const L=t.get(P);L.position.setFromMatrixPosition(P.matrixWorld),L.color.copy(O).multiplyScalar(V),L.distance=N,L.coneCos=Math.cos(P.angle),L.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),L.decay=P.decay,i.spot[v]=L;const B=P.shadow;if(P.map&&(i.spotLightMap[M]=P.map,M++,B.updateMatrices(P),P.castShadow&&E++),i.spotLightMatrix[v]=B.matrix,P.castShadow){const $=n.get(P);$.shadowIntensity=B.intensity,$.shadowBias=B.bias,$.shadowNormalBias=B.normalBias,$.shadowRadius=B.radius,$.shadowMapSize=B.mapSize,i.spotShadow[v]=$,i.spotShadowMap[v]=F,T++}v++}else if(P.isRectAreaLight){const L=t.get(P);L.color.copy(O).multiplyScalar(V),L.halfWidth.set(P.width*.5,0,0),L.halfHeight.set(0,P.height*.5,0),i.rectArea[y]=L,y++}else if(P.isPointLight){const L=t.get(P);if(L.color.copy(P.color).multiplyScalar(P.intensity),L.distance=P.distance,L.decay=P.decay,P.castShadow){const B=P.shadow,$=n.get(P);$.shadowIntensity=B.intensity,$.shadowBias=B.bias,$.shadowNormalBias=B.normalBias,$.shadowRadius=B.radius,$.shadowMapSize=B.mapSize,$.shadowCameraNear=B.camera.near,$.shadowCameraFar=B.camera.far,i.pointShadow[p]=$,i.pointShadowMap[p]=F,i.pointShadowMatrix[p]=P.shadow.matrix,w++}i.point[p]=L,p++}else if(P.isHemisphereLight){const L=t.get(P);L.skyColor.copy(P.color).multiplyScalar(V),L.groundColor.copy(P.groundColor).multiplyScalar(V),i.hemi[g]=L,g++}}y>0&&(e.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=Dt.LTC_FLOAT_1,i.rectAreaLTC2=Dt.LTC_FLOAT_2):(i.rectAreaLTC1=Dt.LTC_HALF_1,i.rectAreaLTC2=Dt.LTC_HALF_2)),i.ambient[0]=d,i.ambient[1]=f,i.ambient[2]=u;const C=i.hash;(C.sunLength!==h||C.directionalLength!==x||C.pointLength!==p||C.spotLength!==v||C.rectAreaLength!==y||C.hemiLength!==g||C.numSunShadows!==m||C.numDirectionalShadows!==b||C.numPointShadows!==w||C.numSpotShadows!==T||C.numSpotMaps!==M||C.numLightProbes!==A)&&(i.sun.length=h,i.directional.length=x,i.spot.length=v,i.rectArea.length=y,i.point.length=p,i.hemi.length=g,i.sunShadow.length=m,i.sunShadowMap.length=m,i.sunShadowMatrix.length=_,i.sunShadowCascade.length=_,i.directionalShadow.length=b,i.directionalShadowMap.length=b,i.directionalShadowMatrix.length=b,i.pointShadow.length=w,i.pointShadowMap.length=w,i.pointShadowMatrix.length=w,i.spotShadow.length=T,i.spotShadowMap.length=T,i.spotLightMatrix.length=T+M-E,i.spotLightMap.length=M,i.numSpotLightShadowsWithMaps=E,i.numLightProbes=A,C.sunLength=h,C.directionalLength=x,C.pointLength=p,C.spotLength=v,C.rectAreaLength=y,C.hemiLength=g,C.numSunShadows=m,C.numDirectionalShadows=b,C.numPointShadows=w,C.numSpotShadows=T,C.numSpotMaps=M,C.numLightProbes=A,i.version=Hb++)}function c(l,d){let f=0,u=0,h=0,m=0,_=0,x=0;const p=d.matrixWorldInverse;for(let v=0,y=l.length;v<y;v++){const g=l[v];if(g.isSunLight){const b=i.sun[f];b.direction.setFromMatrixPosition(g.matrixWorld),b.direction.transformDirection(p),f++}else if(g.isDirectionalLight){const b=i.directional[u];b.direction.setFromMatrixPosition(g.matrixWorld),s.setFromMatrixPosition(g.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(p),u++}else if(g.isSpotLight){const b=i.spot[m];b.position.setFromMatrixPosition(g.matrixWorld),b.position.applyMatrix4(p),b.direction.setFromMatrixPosition(g.matrixWorld),s.setFromMatrixPosition(g.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(p),m++}else if(g.isRectAreaLight){const b=i.rectArea[_];b.position.setFromMatrixPosition(g.matrixWorld),b.position.applyMatrix4(p),o.identity(),a.copy(g.matrixWorld),a.premultiply(p),o.extractRotation(a),b.halfWidth.set(g.width*.5,0,0),b.halfHeight.set(0,g.height*.5,0),b.halfWidth.applyMatrix4(o),b.halfHeight.applyMatrix4(o),_++}else if(g.isPointLight){const b=i.point[h];b.position.setFromMatrixPosition(g.matrixWorld),b.position.applyMatrix4(p),h++}else if(g.isHemisphereLight){const b=i.hemi[x];b.direction.setFromMatrixPosition(g.matrixWorld),b.direction.transformDirection(p),x++}}}return{setup:r,setupView:c,state:i}}function Dh(e){const t=new kb(e),n=[],i=[],s=[];function a(u){f.camera=u,n.length=0,i.length=0,s.length=0}function o(u){n.push(u)}function r(u){i.push(u)}function c(u){s.push(u)}function l(){t.setup(n)}function d(u){t.setupView(n,u)}const f={lightsArray:n,shadowsArray:i,lightProbeGridArray:s,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:f,setupLights:l,setupLightsView:d,pushLight:o,pushShadow:r,pushLightProbeGrid:c}}function Wb(e){let t=new WeakMap;function n(s,a=0){const o=t.get(s);let r;return o===void 0?(r=new Dh(e),t.set(s,[r])):a>=o.length?(r=new Dh(e),o.push(r)):r=o[a],r}function i(){t=new WeakMap}return{get:n,dispose:i}}const Xb=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,$b=`uniform sampler2D shadow_pass;
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
}`,qb=[new q(1,0,0),new q(-1,0,0),new q(0,1,0),new q(0,-1,0),new q(0,0,1),new q(0,0,-1)],Yb=[new q(0,-1,0),new q(0,-1,0),new q(0,0,1),new q(0,0,-1),new q(0,-1,0),new q(0,-1,0)],Nh=new Ee,po=new q,Td=new q;function Zb(e,t,n){let i=new Ou;const s=new Ct,a=new Ct,o=new Ae,r=new iv,c=new sv,l={},d=n.maxTextureSize,f={[Ds]:hn,[hn]:Ds,[zi]:zi},u=new hi({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ct},radius:{value:4}},vertexShader:Xb,fragmentShader:$b}),h=u.clone();h.defines.HORIZONTAL_PASS=1;const m=new Ne;m.setAttribute("position",new pn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new we(m,u),x=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Uo;let p=this.type;this.render=function(w,T,M){if(x.enabled===!1||x.autoUpdate===!1&&x.needsUpdate===!1||w.length===0)return;this.type===u1&&(Qt("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Uo);const E=e.getRenderTarget(),A=e.getActiveCubeFace(),C=e.getActiveMipmapLevel(),I=e.state;I.setBlending(Ui),I.buffers.depth.getReversed()===!0?I.buffers.color.setClear(0,0,0,0):I.buffers.color.setClear(1,1,1,1),I.buffers.depth.setTest(!0),I.setScissorTest(!1);const U=p!==this.type;U&&T.traverse(function(P){P.material&&(Array.isArray(P.material)?P.material.forEach(O=>O.needsUpdate=!0):P.material.needsUpdate=!0)});for(let P=0,O=w.length;P<O;P++){const V=w[P],N=V.shadow;if(N===void 0){Qt("WebGLShadowMap:",V,"has no shadow.");continue}if(N.autoUpdate===!1&&N.needsUpdate===!1)continue;s.copy(N.mapSize);const F=N.getFrameExtents();s.multiply(F),a.copy(N.mapSize),(s.x>d||s.y>d)&&(s.x>d&&(a.x=Math.floor(d/F.x),s.x=a.x*F.x,N.mapSize.x=a.x),s.y>d&&(a.y=Math.floor(d/F.y),s.y=a.y*F.y,N.mapSize.y=a.y));const L=e.state.buffers.depth.getReversed();if(N.camera._reversedDepth=L,N.map===null||U===!0){if(N.map!==null&&(N.map.depthTexture!==null&&(N.map.depthTexture.dispose(),N.map.depthTexture=null),N.map.dispose()),this.type===Eo){if(V.isPointLight){Qt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}N.map=new Kn(s.x,s.y,{format:Us,type:ui,minFilter:$e,magFilter:$e,generateMipmaps:!1}),N.map.texture.name=V.name+".shadowMap",N.map.depthTexture=new sr(s.x,s.y,oi),N.map.depthTexture.name=V.name+".shadowMapDepth",N.map.depthTexture.format=Bi,N.map.depthTexture.compareFunction=null,N.map.depthTexture.minFilter=Xe,N.map.depthTexture.magFilter=Xe}else V.isPointLight?(N.map=new ox(s.x),N.map.depthTexture=new v_(s.x,fi)):(N.map=new Kn(s.x,s.y),N.map.depthTexture=new sr(s.x,s.y,fi)),N.map.depthTexture.name=V.name+".shadowMap",N.map.depthTexture.format=Bi,this.type===Uo?(N.map.depthTexture.compareFunction=L?Du:Iu,N.map.depthTexture.minFilter=$e,N.map.depthTexture.magFilter=$e):(N.map.depthTexture.compareFunction=null,N.map.depthTexture.minFilter=Xe,N.map.depthTexture.magFilter=Xe);N.camera.updateProjectionMatrix()}N.map.isWebGLCubeRenderTarget!==!0&&(N.map.width!==s.x||N.map.height!==s.y)&&N.map.setSize(s.x,s.y);const B=N.map.isWebGLCubeRenderTarget?6:N.getViewportCount();V.isPointLight!==!0&&N.updateMatrices(V,M);for(let $=0;$<B;$++){const J=N.getCamera($);if(V.isPointLight){const st=N.camera,Tt=N.matrix,H=V.distance||st.far;H!==st.far&&(st.far=H,st.updateProjectionMatrix()),po.setFromMatrixPosition(V.matrixWorld),st.position.copy(po),Td.copy(st.position),Td.add(qb[$]),st.up.copy(Yb[$]),st.lookAt(Td),st.updateMatrixWorld(),Tt.makeTranslation(-po.x,-po.y,-po.z),Nh.multiplyMatrices(st.projectionMatrix,st.matrixWorldInverse),N._frustum.setFromProjectionMatrix(Nh,st.coordinateSystem,st.reversedDepth)}if(N.map.isWebGLCubeRenderTarget)e.setRenderTarget(N.map,$),e.clear();else{$===0&&(e.setRenderTarget(N.map),e.clear());const st=N.getViewport($);o.set(a.x*st.x,a.y*st.y,a.x*st.z,a.y*st.w),I.viewport(o)}i=N.getFrustum($),g(T,M,J,V,this.type)}N.isPointLightShadow!==!0&&this.type===Eo&&v(N,M),N.needsUpdate=!1}p=this.type,x.needsUpdate=!1,e.setRenderTarget(E,A,C)};function v(w,T){const M=t.update(_);u.defines.VSM_SAMPLES!==w.blurSamples&&(u.defines.VSM_SAMPLES=w.blurSamples,h.defines.VSM_SAMPLES=w.blurSamples,u.needsUpdate=!0,h.needsUpdate=!0),w.mapPass===null?w.mapPass=new Kn(s.x,s.y,{format:Us,type:ui}):(w.mapPass.width!==w.map.width||w.mapPass.height!==w.map.height)&&w.mapPass.setSize(w.map.width,w.map.height),u.uniforms.shadow_pass.value=w.map.depthTexture,u.uniforms.resolution.value.set(w.map.width,w.map.height),u.uniforms.radius.value=w.radius,e.setRenderTarget(w.mapPass),e.clear(),e.renderBufferDirect(T,null,M,u,_,null),h.uniforms.shadow_pass.value=w.mapPass.texture,h.uniforms.resolution.value.set(w.map.width,w.map.height),h.uniforms.radius.value=w.radius,e.setRenderTarget(w.map),e.clear(),e.renderBufferDirect(T,null,M,h,_,null)}function y(w,T,M,E){let A=null;const C=M.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(C!==void 0)A=C;else if(A=M.isPointLight===!0?c:r,e.localClippingEnabled&&T.clipShadows===!0&&Array.isArray(T.clippingPlanes)&&T.clippingPlanes.length!==0||T.displacementMap&&T.displacementScale!==0||T.alphaMap&&T.alphaTest>0||T.map&&T.alphaTest>0||T.alphaToCoverage===!0){const I=A.uuid,U=T.uuid;let P=l[I];P===void 0&&(P={},l[I]=P);let O=P[U];O===void 0&&(O=A.clone(),P[U]=O,T.addEventListener("dispose",b)),A=O}if(A.visible=T.visible,A.wireframe=T.wireframe,E===Eo?A.side=T.shadowSide!==null?T.shadowSide:T.side:A.side=T.shadowSide!==null?T.shadowSide:f[T.side],A.alphaMap=T.alphaMap,A.alphaTest=T.alphaToCoverage===!0?.5:T.alphaTest,A.map=T.map,A.clipShadows=T.clipShadows,A.clippingPlanes=T.clippingPlanes,A.clipIntersection=T.clipIntersection,A.displacementMap=T.displacementMap,A.displacementScale=T.displacementScale,A.displacementBias=T.displacementBias,A.wireframeLinewidth=T.wireframeLinewidth,A.linewidth=T.linewidth,M.isPointLight===!0&&A.isMeshDistanceMaterial===!0){const I=e.properties.get(A);I.light=M}return A}function g(w,T,M,E,A){if(w.visible===!1)return;if(w.layers.test(T.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&A===Eo)&&(!w.frustumCulled||w.intersectsFrustum(i))){w.modelViewMatrix.multiplyMatrices(M.matrixWorldInverse,w.matrixWorld);const U=t.update(w),P=w.material;if(Array.isArray(P)){const O=U.groups;for(let V=0,N=O.length;V<N;V++){const F=O[V],L=P[F.materialIndex];if(L&&L.visible){const B=y(w,L,E,A);w.onBeforeShadow(e,w,T,M,U,B,F),e.renderBufferDirect(M,null,U,B,w,F),w.onAfterShadow(e,w,T,M,U,B,F)}}}else if(P.visible){const O=y(w,P,E,A);w.onBeforeShadow(e,w,T,M,U,O,null),e.renderBufferDirect(M,null,U,O,w,null),w.onAfterShadow(e,w,T,M,U,O,null)}}const I=w.children;for(let U=0,P=I.length;U<P;U++)g(I[U],T,M,E,A)}function b(w){w.target.removeEventListener("dispose",b);for(const M in l){const E=l[M],A=w.target.uuid;A in E&&(E[A].dispose(),delete E[A])}}}function Kb(e,t){function n(){let Z=!1;const Lt=new Ae;let ht=null;const It=new Ae(0,0,0,0);return{setMask:function(Ft){ht!==Ft&&!Z&&(e.colorMask(Ft,Ft,Ft,Ft),ht=Ft)},setLocked:function(Ft){Z=Ft},setClear:function(Ft,vt,Yt,Xt,ye){ye===!0&&(Ft*=Xt,vt*=Xt,Yt*=Xt),Lt.set(Ft,vt,Yt,Xt),It.equals(Lt)===!1&&(e.clearColor(Ft,vt,Yt,Xt),It.copy(Lt))},reset:function(){Z=!1,ht=null,It.set(-1,0,0,0)}}}function i(){let Z=!1,Lt=!1,ht=null,It=null,Ft=null;return{setReversed:function(vt){if(Lt!==vt){const Yt=t.get("EXT_clip_control");vt?Yt.clipControlEXT(Yt.LOWER_LEFT_EXT,Yt.ZERO_TO_ONE_EXT):Yt.clipControlEXT(Yt.LOWER_LEFT_EXT,Yt.NEGATIVE_ONE_TO_ONE_EXT),Lt=vt;const Xt=Ft;Ft=null,this.setClear(Xt)}},getReversed:function(){return Lt},setTest:function(vt){vt?k(e.DEPTH_TEST):at(e.DEPTH_TEST)},setMask:function(vt){ht!==vt&&!Z&&(e.depthMask(vt),ht=vt)},setFunc:function(vt){if(Lt&&(vt=q1[vt]),It!==vt){switch(vt){case tf:e.depthFunc(e.NEVER);break;case ef:e.depthFunc(e.ALWAYS);break;case nf:e.depthFunc(e.LESS);break;case jo:e.depthFunc(e.LEQUAL);break;case sf:e.depthFunc(e.EQUAL);break;case af:e.depthFunc(e.GEQUAL);break;case of:e.depthFunc(e.GREATER);break;case rf:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}It=vt}},setLocked:function(vt){Z=vt},setClear:function(vt){Ft!==vt&&(Ft=vt,Lt&&(vt=1-vt),e.clearDepth(vt))},reset:function(){Z=!1,ht=null,It=null,Ft=null,Lt=!1}}}function s(){let Z=!1,Lt=null,ht=null,It=null,Ft=null,vt=null,Yt=null,Xt=null,ye=null;return{setTest:function(fe){Z||(fe?k(e.STENCIL_TEST):at(e.STENCIL_TEST))},setMask:function(fe){Lt!==fe&&!Z&&(e.stencilMask(fe),Lt=fe)},setFunc:function(fe,Gn,jn){(ht!==fe||It!==Gn||Ft!==jn)&&(e.stencilFunc(fe,Gn,jn),ht=fe,It=Gn,Ft=jn)},setOp:function(fe,Gn,jn){(vt!==fe||Yt!==Gn||Xt!==jn)&&(e.stencilOp(fe,Gn,jn),vt=fe,Yt=Gn,Xt=jn)},setLocked:function(fe){Z=fe},setClear:function(fe){ye!==fe&&(e.clearStencil(fe),ye=fe)},reset:function(){Z=!1,Lt=null,ht=null,It=null,Ft=null,vt=null,Yt=null,Xt=null,ye=null}}}const a=new n,o=new i,r=new s,c=new WeakMap,l=new WeakMap;let d={},f={},u={},h=new WeakMap,m=[],_=null,x=!1,p=null,v=null,y=null,g=null,b=null,w=null,T=null,M=new ee(0,0,0),E=0,A=!1,C=null,I=null,U=null,P=null,O=null;const V=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let N=!1,F=0;const L=e.getParameter(e.VERSION);L.indexOf("WebGL")!==-1?(F=parseFloat(/^WebGL (\d)/.exec(L)[1]),N=F>=1):L.indexOf("OpenGL ES")!==-1&&(F=parseFloat(/^OpenGL ES (\d)/.exec(L)[1]),N=F>=2);let B=null,$={};const J=e.getParameter(e.SCISSOR_BOX),st=e.getParameter(e.VIEWPORT),Tt=new Ae().fromArray(J),H=new Ae().fromArray(st);function et(Z,Lt,ht,It){const Ft=new Uint8Array(4),vt=e.createTexture();e.bindTexture(Z,vt),e.texParameteri(Z,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(Z,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let Yt=0;Yt<ht;Yt++)Z===e.TEXTURE_3D||Z===e.TEXTURE_2D_ARRAY?e.texImage3D(Lt,0,e.RGBA,1,1,It,0,e.RGBA,e.UNSIGNED_BYTE,Ft):e.texImage2D(Lt+Yt,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,Ft);return vt}const W={};W[e.TEXTURE_2D]=et(e.TEXTURE_2D,e.TEXTURE_2D,1),W[e.TEXTURE_CUBE_MAP]=et(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),W[e.TEXTURE_2D_ARRAY]=et(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),W[e.TEXTURE_3D]=et(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),r.setClear(0),k(e.DEPTH_TEST),o.setFunc(jo),yt(!1),j(N0),k(e.CULL_FACE),pt(Ui);function k(Z){d[Z]!==!0&&(e.enable(Z),d[Z]=!0)}function at(Z){d[Z]!==!1&&(e.disable(Z),d[Z]=!1)}function mt(Z,Lt){return u[Z]!==Lt?(e.bindFramebuffer(Z,Lt),u[Z]=Lt,Z===e.DRAW_FRAMEBUFFER&&(u[e.FRAMEBUFFER]=Lt),Z===e.FRAMEBUFFER&&(u[e.DRAW_FRAMEBUFFER]=Lt),!0):!1}function rt(Z,Lt){let ht=m,It=!1;if(Z){ht=h.get(Lt),ht===void 0&&(ht=[],h.set(Lt,ht));const Ft=Z.textures;if(ht.length!==Ft.length||ht[0]!==e.COLOR_ATTACHMENT0){for(let vt=0,Yt=Ft.length;vt<Yt;vt++)ht[vt]=e.COLOR_ATTACHMENT0+vt;ht.length=Ft.length,It=!0}}else ht[0]!==e.BACK&&(ht[0]=e.BACK,It=!0);It&&e.drawBuffers(ht)}function Mt(Z){return _!==Z?(e.useProgram(Z),_=Z,!0):!1}const Kt={[ba]:e.FUNC_ADD,[p1]:e.FUNC_SUBTRACT,[m1]:e.FUNC_REVERSE_SUBTRACT};Kt[x1]=e.MIN,Kt[g1]=e.MAX;const lt={[_1]:e.ZERO,[v1]:e.ONE,[M1]:e.SRC_COLOR,[gm]:e.SRC_ALPHA,[T1]:e.SRC_ALPHA_SATURATE,[w1]:e.DST_COLOR,[b1]:e.DST_ALPHA,[y1]:e.ONE_MINUS_SRC_COLOR,[_m]:e.ONE_MINUS_SRC_ALPHA,[E1]:e.ONE_MINUS_DST_COLOR,[S1]:e.ONE_MINUS_DST_ALPHA,[A1]:e.CONSTANT_COLOR,[z1]:e.ONE_MINUS_CONSTANT_COLOR,[R1]:e.CONSTANT_ALPHA,[C1]:e.ONE_MINUS_CONSTANT_ALPHA};function pt(Z,Lt,ht,It,Ft,vt,Yt,Xt,ye,fe){if(Z===Ui){x===!0&&(at(e.BLEND),x=!1);return}if(x===!1&&(k(e.BLEND),x=!0),Z!==h1){if(Z!==p||fe!==A){if((v!==ba||b!==ba)&&(e.blendEquation(e.FUNC_ADD),v=ba,b=ba),fe)switch(Z){case Oo:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case U0:e.blendFunc(e.ONE,e.ONE);break;case O0:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case F0:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:ce("WebGLState: Invalid blending: ",Z);break}else switch(Z){case Oo:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case U0:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case O0:ce("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case F0:ce("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:ce("WebGLState: Invalid blending: ",Z);break}y=null,g=null,w=null,T=null,M.set(0,0,0),E=0,p=Z,A=fe}return}Ft=Ft||Lt,vt=vt||ht,Yt=Yt||It,(Lt!==v||Ft!==b)&&(e.blendEquationSeparate(Kt[Lt],Kt[Ft]),v=Lt,b=Ft),(ht!==y||It!==g||vt!==w||Yt!==T)&&(e.blendFuncSeparate(lt[ht],lt[It],lt[vt],lt[Yt]),y=ht,g=It,w=vt,T=Yt),(Xt.equals(M)===!1||ye!==E)&&(e.blendColor(Xt.r,Xt.g,Xt.b,ye),M.copy(Xt),E=ye),p=Z,A=!1}function xt(Z,Lt){Z.side===zi?at(e.CULL_FACE):k(e.CULL_FACE);let ht=Z.side===hn;Lt&&(ht=!ht),yt(ht),Z.blending===Oo&&Z.transparent===!1?pt(Ui):pt(Z.blending,Z.blendEquation,Z.blendSrc,Z.blendDst,Z.blendEquationAlpha,Z.blendSrcAlpha,Z.blendDstAlpha,Z.blendColor,Z.blendAlpha,Z.premultipliedAlpha),o.setFunc(Z.depthFunc),o.setTest(Z.depthTest),o.setMask(Z.depthWrite),a.setMask(Z.colorWrite);const It=Z.stencilWrite;r.setTest(It),It&&(r.setMask(Z.stencilWriteMask),r.setFunc(Z.stencilFunc,Z.stencilRef,Z.stencilFuncMask),r.setOp(Z.stencilFail,Z.stencilZFail,Z.stencilZPass)),Pt(Z.polygonOffset,Z.polygonOffsetFactor,Z.polygonOffsetUnits),Z.alphaToCoverage===!0?k(e.SAMPLE_ALPHA_TO_COVERAGE):at(e.SAMPLE_ALPHA_TO_COVERAGE)}function yt(Z){C!==Z&&(Z?e.frontFace(e.CW):e.frontFace(e.CCW),C=Z)}function j(Z){Z!==d1?(k(e.CULL_FACE),Z!==I&&(Z===N0?e.cullFace(e.BACK):Z===f1?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))):at(e.CULL_FACE),I=Z}function wt(Z){Z!==U&&(N&&e.lineWidth(Z),U=Z)}function Pt(Z,Lt,ht){Z?(k(e.POLYGON_OFFSET_FILL),(P!==Lt||O!==ht)&&(P=Lt,O=ht,o.getReversed()&&(Lt=-Lt),e.polygonOffset(Lt,ht))):at(e.POLYGON_OFFSET_FILL)}function bt(Z){Z?k(e.SCISSOR_TEST):at(e.SCISSOR_TEST)}function Zt(Z){Z===void 0&&(Z=e.TEXTURE0+V-1),B!==Z&&(e.activeTexture(Z),B=Z)}function G(Z,Lt,ht){ht===void 0&&(B===null?ht=e.TEXTURE0+V-1:ht=B);let It=$[ht];It===void 0&&(It={type:void 0,texture:void 0},$[ht]=It),(It.type!==Z||It.texture!==Lt)&&(B!==ht&&(e.activeTexture(ht),B=ht),e.bindTexture(Z,Lt||W[Z]),It.type=Z,It.texture=Lt)}function Q(){const Z=$[B];Z!==void 0&&Z.type!==void 0&&(e.bindTexture(Z.type,null),Z.type=void 0,Z.texture=void 0)}function ut(){try{e.compressedTexImage2D(...arguments)}catch(Z){ce("WebGLState:",Z)}}function R(){try{e.compressedTexImage3D(...arguments)}catch(Z){ce("WebGLState:",Z)}}function S(){try{e.texSubImage2D(...arguments)}catch(Z){ce("WebGLState:",Z)}}function X(){try{e.texSubImage3D(...arguments)}catch(Z){ce("WebGLState:",Z)}}function K(){try{e.compressedTexSubImage2D(...arguments)}catch(Z){ce("WebGLState:",Z)}}function tt(){try{e.compressedTexSubImage3D(...arguments)}catch(Z){ce("WebGLState:",Z)}}function _t(){try{e.texStorage2D(...arguments)}catch(Z){ce("WebGLState:",Z)}}function St(){try{e.texStorage3D(...arguments)}catch(Z){ce("WebGLState:",Z)}}function ct(){try{e.texImage2D(...arguments)}catch(Z){ce("WebGLState:",Z)}}function dt(){try{e.texImage3D(...arguments)}catch(Z){ce("WebGLState:",Z)}}function Et(Z){return f[Z]!==void 0?f[Z]:e.getParameter(Z)}function At(Z,Lt){f[Z]!==Lt&&(e.pixelStorei(Z,Lt),f[Z]=Lt)}function zt(Z){Tt.equals(Z)===!1&&(e.scissor(Z.x,Z.y,Z.z,Z.w),Tt.copy(Z))}function Rt(Z){H.equals(Z)===!1&&(e.viewport(Z.x,Z.y,Z.z,Z.w),H.copy(Z))}function Ot(Z,Lt){let ht=l.get(Lt);ht===void 0&&(ht=new WeakMap,l.set(Lt,ht));let It=ht.get(Z);It===void 0&&(It=e.getUniformBlockIndex(Lt,Z.name),ht.set(Z,It))}function $t(Z,Lt){const It=l.get(Lt).get(Z);c.get(Lt)!==It&&(e.uniformBlockBinding(Lt,It,Z.__bindingPointIndex),c.set(Lt,It))}function Jt(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),d={},f={},B=null,$={},u={},h=new WeakMap,m=[],_=null,x=!1,p=null,v=null,y=null,g=null,b=null,w=null,T=null,M=new ee(0,0,0),E=0,A=!1,C=null,I=null,U=null,P=null,O=null,Tt.set(0,0,e.canvas.width,e.canvas.height),H.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),r.reset()}return{buffers:{color:a,depth:o,stencil:r},enable:k,disable:at,bindFramebuffer:mt,drawBuffers:rt,useProgram:Mt,setBlending:pt,setMaterial:xt,setFlipSided:yt,setCullFace:j,setLineWidth:wt,setPolygonOffset:Pt,setScissorTest:bt,activeTexture:Zt,bindTexture:G,unbindTexture:Q,compressedTexImage2D:ut,compressedTexImage3D:R,texImage2D:ct,texImage3D:dt,pixelStorei:At,getParameter:Et,updateUBOMapping:Ot,uniformBlockBinding:$t,texStorage2D:_t,texStorage3D:St,texSubImage2D:S,texSubImage3D:X,compressedTexSubImage2D:K,compressedTexSubImage3D:tt,scissor:zt,viewport:Rt,reset:Jt}}function Jb(e,t,n,i,s,a,o){const r=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new Ct,d=new WeakMap,f=new Set;let u;const h=new WeakMap;let m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function _(R,S){return m?new OffscreenCanvas(R,S):Zc("canvas")}function x(R,S,X){let K=1;const tt=ut(R);if((tt.width>X||tt.height>X)&&(K=X/Math.max(tt.width,tt.height)),K<1)if(typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&R instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&R instanceof ImageBitmap||typeof VideoFrame<"u"&&R instanceof VideoFrame){const _t=Math.floor(K*tt.width),St=Math.floor(K*tt.height);u===void 0&&(u=_(_t,St));const ct=S?_(_t,St):u;return ct.width=_t,ct.height=St,ct.getContext("2d").drawImage(R,0,0,_t,St),Qt("WebGLRenderer: Texture has been resized from ("+tt.width+"x"+tt.height+") to ("+_t+"x"+St+")."),ct}else return"data"in R&&Qt("WebGLRenderer: Image in DataTexture is too big ("+tt.width+"x"+tt.height+")."),R;return R}function p(R){return R.generateMipmaps}function v(R){e.generateMipmap(R)}function y(R){return R.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:R.isWebGL3DRenderTarget?e.TEXTURE_3D:R.isWebGLArrayRenderTarget||R.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function g(R,S,X,K,tt,_t=!1){if(R!==null){if(e[R]!==void 0)return e[R];Qt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+R+"'")}let St;K&&(St=t.get("EXT_texture_norm16"),St||Qt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let ct=S;if(S===e.RED&&(X===e.FLOAT&&(ct=e.R32F),X===e.HALF_FLOAT&&(ct=e.R16F),X===e.UNSIGNED_BYTE&&(ct=e.R8),X===e.UNSIGNED_SHORT&&St&&(ct=St.R16_EXT),X===e.SHORT&&St&&(ct=St.R16_SNORM_EXT)),S===e.RED_INTEGER&&(X===e.UNSIGNED_BYTE&&(ct=e.R8UI),X===e.UNSIGNED_SHORT&&(ct=e.R16UI),X===e.UNSIGNED_INT&&(ct=e.R32UI),X===e.BYTE&&(ct=e.R8I),X===e.SHORT&&(ct=e.R16I),X===e.INT&&(ct=e.R32I)),S===e.RG&&(X===e.FLOAT&&(ct=e.RG32F),X===e.HALF_FLOAT&&(ct=e.RG16F),X===e.UNSIGNED_BYTE&&(ct=e.RG8),X===e.UNSIGNED_SHORT&&St&&(ct=St.RG16_EXT),X===e.SHORT&&St&&(ct=St.RG16_SNORM_EXT)),S===e.RG_INTEGER&&(X===e.UNSIGNED_BYTE&&(ct=e.RG8UI),X===e.UNSIGNED_SHORT&&(ct=e.RG16UI),X===e.UNSIGNED_INT&&(ct=e.RG32UI),X===e.BYTE&&(ct=e.RG8I),X===e.SHORT&&(ct=e.RG16I),X===e.INT&&(ct=e.RG32I)),S===e.RGB_INTEGER&&(X===e.UNSIGNED_BYTE&&(ct=e.RGB8UI),X===e.UNSIGNED_SHORT&&(ct=e.RGB16UI),X===e.UNSIGNED_INT&&(ct=e.RGB32UI),X===e.BYTE&&(ct=e.RGB8I),X===e.SHORT&&(ct=e.RGB16I),X===e.INT&&(ct=e.RGB32I)),S===e.RGBA_INTEGER&&(X===e.UNSIGNED_BYTE&&(ct=e.RGBA8UI),X===e.UNSIGNED_SHORT&&(ct=e.RGBA16UI),X===e.UNSIGNED_INT&&(ct=e.RGBA32UI),X===e.BYTE&&(ct=e.RGBA8I),X===e.SHORT&&(ct=e.RGBA16I),X===e.INT&&(ct=e.RGBA32I)),S===e.RGB&&(X===e.UNSIGNED_SHORT&&St&&(ct=St.RGB16_EXT),X===e.SHORT&&St&&(ct=St.RGB16_SNORM_EXT),X===e.UNSIGNED_INT_5_9_9_9_REV&&(ct=e.RGB9_E5),X===e.UNSIGNED_INT_10F_11F_11F_REV&&(ct=e.R11F_G11F_B10F)),S===e.RGBA){const dt=_t?Yc:oe.getTransfer(tt);X===e.FLOAT&&(ct=e.RGBA32F),X===e.HALF_FLOAT&&(ct=e.RGBA16F),X===e.UNSIGNED_BYTE&&(ct=dt===me?e.SRGB8_ALPHA8:e.RGBA8),X===e.UNSIGNED_SHORT&&St&&(ct=St.RGBA16_EXT),X===e.SHORT&&St&&(ct=St.RGBA16_SNORM_EXT),X===e.UNSIGNED_SHORT_4_4_4_4&&(ct=e.RGBA4),X===e.UNSIGNED_SHORT_5_5_5_1&&(ct=e.RGB5_A1)}return(ct===e.R16F||ct===e.R32F||ct===e.RG16F||ct===e.RG32F||ct===e.RGBA16F||ct===e.RGBA32F)&&t.get("EXT_color_buffer_float"),ct}function b(R,S){let X;return R?S===null||S===fi||S===nr?X=e.DEPTH24_STENCIL8:S===oi?X=e.DEPTH32F_STENCIL8:S===er&&(X=e.DEPTH24_STENCIL8,Qt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):S===null||S===fi||S===nr?X=e.DEPTH_COMPONENT24:S===oi?X=e.DEPTH_COMPONENT32F:S===er&&(X=e.DEPTH_COMPONENT16),X}function w(R,S){return p(R)===!0||R.isFramebufferTexture&&R.minFilter!==Xe&&R.minFilter!==$e?Math.log2(Math.max(S.width,S.height))+1:R.mipmaps!==void 0&&R.mipmaps.length>0?R.mipmaps.length:R.isCompressedTexture&&Array.isArray(R.image)?S.mipmaps.length:1}function T(R){const S=R.target;S.removeEventListener("dispose",T),E(S),S.isVideoTexture&&d.delete(S),S.isHTMLTexture&&f.delete(S)}function M(R){const S=R.target;S.removeEventListener("dispose",M),C(S)}function E(R){const S=i.get(R);if(S.__webglInit===void 0)return;const X=R.source,K=h.get(X);if(K){const tt=K[S.__cacheKey];tt.usedTimes--,tt.usedTimes===0&&A(R),Object.keys(K).length===0&&h.delete(X)}i.remove(R)}function A(R){const S=i.get(R);e.deleteTexture(S.__webglTexture);const X=R.source,K=h.get(X);delete K[S.__cacheKey],o.memory.textures--}function C(R){const S=i.get(R);if(R.depthTexture&&(R.depthTexture.dispose(),i.remove(R.depthTexture)),R.isWebGLCubeRenderTarget)for(let K=0;K<6;K++){if(Array.isArray(S.__webglFramebuffer[K]))for(let tt=0;tt<S.__webglFramebuffer[K].length;tt++)e.deleteFramebuffer(S.__webglFramebuffer[K][tt]);else e.deleteFramebuffer(S.__webglFramebuffer[K]);S.__webglDepthbuffer&&e.deleteRenderbuffer(S.__webglDepthbuffer[K])}else{if(Array.isArray(S.__webglFramebuffer))for(let K=0;K<S.__webglFramebuffer.length;K++)e.deleteFramebuffer(S.__webglFramebuffer[K]);else e.deleteFramebuffer(S.__webglFramebuffer);if(S.__webglDepthbuffer&&e.deleteRenderbuffer(S.__webglDepthbuffer),S.__webglMultisampledFramebuffer&&e.deleteFramebuffer(S.__webglMultisampledFramebuffer),S.__webglColorRenderbuffer)for(let K=0;K<S.__webglColorRenderbuffer.length;K++)S.__webglColorRenderbuffer[K]&&e.deleteRenderbuffer(S.__webglColorRenderbuffer[K]);S.__webglDepthRenderbuffer&&e.deleteRenderbuffer(S.__webglDepthRenderbuffer)}const X=R.textures;for(let K=0,tt=X.length;K<tt;K++){const _t=i.get(X[K]);_t.__webglTexture&&(e.deleteTexture(_t.__webglTexture),o.memory.textures--),i.remove(X[K])}i.remove(R)}let I=0;function U(){I=0}function P(){return I}function O(R){I=R}function V(){const R=I;return R>=s.maxTextures&&Qt("WebGLTextures: Trying to use "+(R+1)+" texture units while this GPU supports only "+s.maxTextures),I+=1,R}function N(R){const S=[];return S.push(R.wrapS),S.push(R.wrapT),S.push(R.wrapR||0),S.push(R.magFilter),S.push(R.minFilter),S.push(R.anisotropy),S.push(R.internalFormat),S.push(R.format),S.push(R.type),S.push(R.generateMipmaps),S.push(R.premultiplyAlpha),S.push(R.flipY),S.push(R.unpackAlignment),S.push(R.colorSpace),S.join()}function F(R,S){const X=i.get(R);if(R.isVideoTexture&&G(R),R.isRenderTargetTexture===!1&&R.isExternalTexture!==!0&&R.version>0&&X.__version!==R.version){const K=R.image;if(K===null)Qt("WebGLRenderer: Texture marked for update but no image data found.");else if(K.complete===!1)Qt("WebGLRenderer: Texture marked for update but image is incomplete");else{at(X,R,S);return}}else R.isExternalTexture&&(X.__webglTexture=R.sourceTexture?R.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,X.__webglTexture,e.TEXTURE0+S)}function L(R,S){const X=i.get(R);if(R.isRenderTargetTexture===!1&&R.version>0&&X.__version!==R.version){at(X,R,S);return}else R.isExternalTexture&&(X.__webglTexture=R.sourceTexture?R.sourceTexture:null);n.bindTexture(e.TEXTURE_2D_ARRAY,X.__webglTexture,e.TEXTURE0+S)}function B(R,S){const X=i.get(R);if(R.isRenderTargetTexture===!1&&R.version>0&&X.__version!==R.version){at(X,R,S);return}n.bindTexture(e.TEXTURE_3D,X.__webglTexture,e.TEXTURE0+S)}function $(R,S){const X=i.get(R);if(R.isCubeDepthTexture!==!0&&R.version>0&&X.__version!==R.version){mt(X,R,S);return}n.bindTexture(e.TEXTURE_CUBE_MAP,X.__webglTexture,e.TEXTURE0+S)}const J={[tr]:e.REPEAT,[Ri]:e.CLAMP_TO_EDGE,[cf]:e.MIRRORED_REPEAT},st={[Xe]:e.NEAREST,[I1]:e.NEAREST_MIPMAP_NEAREST,[Or]:e.NEAREST_MIPMAP_LINEAR,[$e]:e.LINEAR,[ql]:e.LINEAR_MIPMAP_NEAREST,[bs]:e.LINEAR_MIPMAP_LINEAR},Tt={[O1]:e.NEVER,[V1]:e.ALWAYS,[F1]:e.LESS,[Iu]:e.LEQUAL,[B1]:e.EQUAL,[Du]:e.GEQUAL,[G1]:e.GREATER,[H1]:e.NOTEQUAL};function H(R,S){if(S.type===oi&&t.has("OES_texture_float_linear")===!1&&(S.magFilter===$e||S.magFilter===ql||S.magFilter===Or||S.magFilter===bs||S.minFilter===$e||S.minFilter===ql||S.minFilter===Or||S.minFilter===bs)&&Qt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),e.texParameteri(R,e.TEXTURE_WRAP_S,J[S.wrapS]),e.texParameteri(R,e.TEXTURE_WRAP_T,J[S.wrapT]),(R===e.TEXTURE_3D||R===e.TEXTURE_2D_ARRAY)&&e.texParameteri(R,e.TEXTURE_WRAP_R,J[S.wrapR]),e.texParameteri(R,e.TEXTURE_MAG_FILTER,st[S.magFilter]),e.texParameteri(R,e.TEXTURE_MIN_FILTER,st[S.minFilter]),S.compareFunction&&(e.texParameteri(R,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(R,e.TEXTURE_COMPARE_FUNC,Tt[S.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(S.magFilter===Xe||S.minFilter!==Or&&S.minFilter!==bs||S.type===oi&&t.has("OES_texture_float_linear")===!1)return;if(S.anisotropy>1||i.get(S).__currentAnisotropy){const X=t.get("EXT_texture_filter_anisotropic");e.texParameterf(R,X.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(S.anisotropy,s.getMaxAnisotropy())),i.get(S).__currentAnisotropy=S.anisotropy}}}function et(R,S){let X=!1;R.__webglInit===void 0&&(R.__webglInit=!0,S.addEventListener("dispose",T));const K=S.source;let tt=h.get(K);tt===void 0&&(tt={},h.set(K,tt));const _t=N(S);if(_t!==R.__cacheKey){tt[_t]===void 0&&(tt[_t]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,X=!0),tt[_t].usedTimes++;const St=tt[R.__cacheKey];St!==void 0&&(tt[R.__cacheKey].usedTimes--,St.usedTimes===0&&A(S)),R.__cacheKey=_t,R.__webglTexture=tt[_t].texture}return X}function W(R,S,X){return Math.floor(Math.floor(R/X)/S)}function k(R,S,X,K){const _t=R.updateRanges;if(_t.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,S.width,S.height,X,K,S.data);else{_t.sort((At,zt)=>At.start-zt.start);let St=0;for(let At=1;At<_t.length;At++){const zt=_t[St],Rt=_t[At],Ot=zt.start+zt.count,$t=W(Rt.start,S.width,4),Jt=W(zt.start,S.width,4);Rt.start<=Ot+1&&$t===Jt&&W(Rt.start+Rt.count-1,S.width,4)===$t?zt.count=Math.max(zt.count,Rt.start+Rt.count-zt.start):(++St,_t[St]=Rt)}_t.length=St+1;const ct=n.getParameter(e.UNPACK_ROW_LENGTH),dt=n.getParameter(e.UNPACK_SKIP_PIXELS),Et=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,S.width);for(let At=0,zt=_t.length;At<zt;At++){const Rt=_t[At],Ot=Math.floor(Rt.start/4),$t=Math.ceil(Rt.count/4),Jt=Ot%S.width,Z=Math.floor(Ot/S.width),Lt=$t,ht=1;n.pixelStorei(e.UNPACK_SKIP_PIXELS,Jt),n.pixelStorei(e.UNPACK_SKIP_ROWS,Z),n.texSubImage2D(e.TEXTURE_2D,0,Jt,Z,Lt,ht,X,K,S.data)}R.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,ct),n.pixelStorei(e.UNPACK_SKIP_PIXELS,dt),n.pixelStorei(e.UNPACK_SKIP_ROWS,Et)}}function at(R,S,X){let K=e.TEXTURE_2D;(S.isDataArrayTexture||S.isCompressedArrayTexture)&&(K=e.TEXTURE_2D_ARRAY),S.isData3DTexture&&(K=e.TEXTURE_3D);const tt=et(R,S),_t=S.source;n.bindTexture(K,R.__webglTexture,e.TEXTURE0+X);const St=i.get(_t);if(_t.version!==St.__version||tt===!0){if(n.activeTexture(e.TEXTURE0+X),(typeof ImageBitmap<"u"&&S.image instanceof ImageBitmap)===!1){const ht=oe.getPrimaries(oe.workingColorSpace),It=S.colorSpace===as?null:oe.getPrimaries(S.colorSpace),Ft=S.colorSpace===as||ht===It?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,S.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ft)}n.pixelStorei(e.UNPACK_ALIGNMENT,S.unpackAlignment);let dt=x(S.image,!1,s.maxTextureSize);dt=Q(S,dt);const Et=a.convert(S.format,S.colorSpace),At=a.convert(S.type);let zt=g(S.internalFormat,Et,At,S.normalized,S.colorSpace,S.isVideoTexture);H(K,S);let Rt;const Ot=S.mipmaps,$t=S.isVideoTexture!==!0,Jt=St.__version===void 0||tt===!0,Z=_t.dataReady,Lt=w(S,dt);if(S.isDepthTexture)zt=b(S.format===Ss,S.type),Jt&&($t?n.texStorage2D(e.TEXTURE_2D,1,zt,dt.width,dt.height):n.texImage2D(e.TEXTURE_2D,0,zt,dt.width,dt.height,0,Et,At,null));else if(S.isDataTexture)if(Ot.length>0){$t&&Jt&&n.texStorage2D(e.TEXTURE_2D,Lt,zt,Ot[0].width,Ot[0].height);for(let ht=0,It=Ot.length;ht<It;ht++)Rt=Ot[ht],$t?Z&&n.texSubImage2D(e.TEXTURE_2D,ht,0,0,Rt.width,Rt.height,Et,At,Rt.data):n.texImage2D(e.TEXTURE_2D,ht,zt,Rt.width,Rt.height,0,Et,At,Rt.data);S.generateMipmaps=!1}else $t?(Jt&&n.texStorage2D(e.TEXTURE_2D,Lt,zt,dt.width,dt.height),Z&&k(S,dt,Et,At)):n.texImage2D(e.TEXTURE_2D,0,zt,dt.width,dt.height,0,Et,At,dt.data);else if(S.isCompressedTexture)if(S.isCompressedArrayTexture){$t&&Jt&&n.texStorage3D(e.TEXTURE_2D_ARRAY,Lt,zt,Ot[0].width,Ot[0].height,dt.depth);for(let ht=0,It=Ot.length;ht<It;ht++)if(Rt=Ot[ht],S.format!==Zn)if(Et!==null)if($t){if(Z)if(S.layerUpdates.size>0){const Ft=hh(Rt.width,Rt.height,S.format,S.type);for(const vt of S.layerUpdates){const Yt=Rt.data.subarray(vt*Ft/Rt.data.BYTES_PER_ELEMENT,(vt+1)*Ft/Rt.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,ht,0,0,vt,Rt.width,Rt.height,1,Et,Yt)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,ht,0,0,0,Rt.width,Rt.height,dt.depth,Et,Rt.data)}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,ht,zt,Rt.width,Rt.height,dt.depth,0,Rt.data,0,0);else Qt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else $t?Z&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,ht,0,0,0,Rt.width,Rt.height,dt.depth,Et,At,Rt.data):n.texImage3D(e.TEXTURE_2D_ARRAY,ht,zt,Rt.width,Rt.height,dt.depth,0,Et,At,Rt.data);S.layerUpdates.size>0&&S.clearLayerUpdates()}else{$t&&Jt&&n.texStorage2D(e.TEXTURE_2D,Lt,zt,Ot[0].width,Ot[0].height);for(let ht=0,It=Ot.length;ht<It;ht++)Rt=Ot[ht],S.format!==Zn?Et!==null?$t?Z&&n.compressedTexSubImage2D(e.TEXTURE_2D,ht,0,0,Rt.width,Rt.height,Et,Rt.data):n.compressedTexImage2D(e.TEXTURE_2D,ht,zt,Rt.width,Rt.height,0,Rt.data):Qt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):$t?Z&&n.texSubImage2D(e.TEXTURE_2D,ht,0,0,Rt.width,Rt.height,Et,At,Rt.data):n.texImage2D(e.TEXTURE_2D,ht,zt,Rt.width,Rt.height,0,Et,At,Rt.data)}else if(S.isDataArrayTexture)if($t){if(Jt&&n.texStorage3D(e.TEXTURE_2D_ARRAY,Lt,zt,dt.width,dt.height,dt.depth),Z)if(S.layerUpdates.size>0){const ht=hh(dt.width,dt.height,S.format,S.type);for(const It of S.layerUpdates){const Ft=dt.data.subarray(It*ht/dt.data.BYTES_PER_ELEMENT,(It+1)*ht/dt.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,It,dt.width,dt.height,1,Et,At,Ft)}S.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,dt.width,dt.height,dt.depth,Et,At,dt.data)}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,zt,dt.width,dt.height,dt.depth,0,Et,At,dt.data);else if(S.isData3DTexture)$t?(Jt&&n.texStorage3D(e.TEXTURE_3D,Lt,zt,dt.width,dt.height,dt.depth),Z&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,dt.width,dt.height,dt.depth,Et,At,dt.data)):n.texImage3D(e.TEXTURE_3D,0,zt,dt.width,dt.height,dt.depth,0,Et,At,dt.data);else if(S.isFramebufferTexture){if(Jt)if($t)n.texStorage2D(e.TEXTURE_2D,Lt,zt,dt.width,dt.height);else{let ht=dt.width,It=dt.height;for(let Ft=0;Ft<Lt;Ft++)n.texImage2D(e.TEXTURE_2D,Ft,zt,ht,It,0,Et,At,null),ht>>=1,It>>=1}}else if(S.isHTMLTexture){if("texElementImage2D"in e){const ht=e.canvas;if(ht.hasAttribute("layoutsubtree")||ht.setAttribute("layoutsubtree","true"),dt.parentNode!==ht){ht.appendChild(dt),f.add(S),ht.onpaint=It=>{const Ft=It.changedElements;for(const vt of f)Ft.includes(vt.image)&&(vt.needsUpdate=!0)},ht.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,dt);else{const Ft=e.RGBA,vt=e.RGBA,Yt=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,Ft,vt,Yt,dt)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(Ot.length>0){if($t&&Jt){const ht=ut(Ot[0]);n.texStorage2D(e.TEXTURE_2D,Lt,zt,ht.width,ht.height)}for(let ht=0,It=Ot.length;ht<It;ht++)Rt=Ot[ht],$t?Z&&n.texSubImage2D(e.TEXTURE_2D,ht,0,0,Et,At,Rt):n.texImage2D(e.TEXTURE_2D,ht,zt,Et,At,Rt);S.generateMipmaps=!1}else if($t){if(Jt){const ht=ut(dt);n.texStorage2D(e.TEXTURE_2D,Lt,zt,ht.width,ht.height)}Z&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,Et,At,dt)}else n.texImage2D(e.TEXTURE_2D,0,zt,Et,At,dt);p(S)&&v(K),St.__version=_t.version,S.onUpdate&&S.onUpdate(S)}R.__version=S.version}function mt(R,S,X){if(S.image.length!==6)return;const K=et(R,S),tt=S.source;n.bindTexture(e.TEXTURE_CUBE_MAP,R.__webglTexture,e.TEXTURE0+X);const _t=i.get(tt);if(tt.version!==_t.__version||K===!0){n.activeTexture(e.TEXTURE0+X);const St=oe.getPrimaries(oe.workingColorSpace),ct=S.colorSpace===as?null:oe.getPrimaries(S.colorSpace),dt=S.colorSpace===as||St===ct?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,S.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,S.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,dt);const Et=S.isCompressedTexture||S.image[0].isCompressedTexture,At=S.image[0]&&S.image[0].isDataTexture,zt=[];for(let vt=0;vt<6;vt++)!Et&&!At?zt[vt]=x(S.image[vt],!0,s.maxCubemapSize):zt[vt]=At?S.image[vt].image:S.image[vt],zt[vt]=Q(S,zt[vt]);const Rt=zt[0],Ot=a.convert(S.format,S.colorSpace),$t=a.convert(S.type),Jt=g(S.internalFormat,Ot,$t,S.normalized,S.colorSpace),Z=S.isVideoTexture!==!0,Lt=_t.__version===void 0||K===!0,ht=tt.dataReady;let It=w(S,Rt);H(e.TEXTURE_CUBE_MAP,S);let Ft;if(Et){Z&&Lt&&n.texStorage2D(e.TEXTURE_CUBE_MAP,It,Jt,Rt.width,Rt.height);for(let vt=0;vt<6;vt++){Ft=zt[vt].mipmaps;for(let Yt=0;Yt<Ft.length;Yt++){const Xt=Ft[Yt];S.format!==Zn?Ot!==null?Z?ht&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,Yt,0,0,Xt.width,Xt.height,Ot,Xt.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,Yt,Jt,Xt.width,Xt.height,0,Xt.data):Qt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Z?ht&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,Yt,0,0,Xt.width,Xt.height,Ot,$t,Xt.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,Yt,Jt,Xt.width,Xt.height,0,Ot,$t,Xt.data)}}}else{if(Ft=S.mipmaps,Z&&Lt){Ft.length>0&&It++;const vt=ut(zt[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,It,Jt,vt.width,vt.height)}for(let vt=0;vt<6;vt++)if(At){Z?ht&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,0,0,0,zt[vt].width,zt[vt].height,Ot,$t,zt[vt].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,0,Jt,zt[vt].width,zt[vt].height,0,Ot,$t,zt[vt].data);for(let Yt=0;Yt<Ft.length;Yt++){const ye=Ft[Yt].image[vt].image;Z?ht&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,Yt+1,0,0,ye.width,ye.height,Ot,$t,ye.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,Yt+1,Jt,ye.width,ye.height,0,Ot,$t,ye.data)}}else{Z?ht&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,0,0,0,Ot,$t,zt[vt]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,0,Jt,Ot,$t,zt[vt]);for(let Yt=0;Yt<Ft.length;Yt++){const Xt=Ft[Yt];Z?ht&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,Yt+1,0,0,Ot,$t,Xt.image[vt]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+vt,Yt+1,Jt,Ot,$t,Xt.image[vt])}}}p(S)&&v(e.TEXTURE_CUBE_MAP),_t.__version=tt.version,S.onUpdate&&S.onUpdate(S)}R.__version=S.version}function rt(R,S,X,K,tt,_t){const St=a.convert(X.format,X.colorSpace),ct=a.convert(X.type),dt=g(X.internalFormat,St,ct,X.normalized,X.colorSpace),Et=i.get(S),At=i.get(X);if(At.__renderTarget=S,!Et.__hasExternalTextures){const zt=Math.max(1,S.width>>_t),Rt=Math.max(1,S.height>>_t);tt===e.TEXTURE_3D||tt===e.TEXTURE_2D_ARRAY?n.texImage3D(tt,_t,dt,zt,Rt,S.depth,0,St,ct,null):n.texImage2D(tt,_t,dt,zt,Rt,0,St,ct,null)}n.bindFramebuffer(e.FRAMEBUFFER,R),Zt(S)?r.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,K,tt,At.__webglTexture,0,bt(S)):(tt===e.TEXTURE_2D||tt>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&tt<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,K,tt,At.__webglTexture,_t),n.bindFramebuffer(e.FRAMEBUFFER,null)}function Mt(R,S,X){if(e.bindRenderbuffer(e.RENDERBUFFER,R),S.depthBuffer){const K=S.depthTexture,tt=K&&K.isDepthTexture?K.type:null,_t=b(S.stencilBuffer,tt),St=S.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;Zt(S)?r.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,bt(S),_t,S.width,S.height):X?e.renderbufferStorageMultisample(e.RENDERBUFFER,bt(S),_t,S.width,S.height):e.renderbufferStorage(e.RENDERBUFFER,_t,S.width,S.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,St,e.RENDERBUFFER,R)}else{const K=S.textures;for(let tt=0;tt<K.length;tt++){const _t=K[tt],St=a.convert(_t.format,_t.colorSpace),ct=a.convert(_t.type),dt=g(_t.internalFormat,St,ct,_t.normalized,_t.colorSpace);Zt(S)?r.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,bt(S),dt,S.width,S.height):X?e.renderbufferStorageMultisample(e.RENDERBUFFER,bt(S),dt,S.width,S.height):e.renderbufferStorage(e.RENDERBUFFER,dt,S.width,S.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Kt(R,S,X){const K=S.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,R),!(S.depthTexture&&S.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const tt=i.get(S.depthTexture);if(tt.__renderTarget=S,(!tt.__webglTexture||S.depthTexture.image.width!==S.width||S.depthTexture.image.height!==S.height)&&(S.depthTexture.image.width=S.width,S.depthTexture.image.height=S.height,S.depthTexture.needsUpdate=!0),K){if(tt.__webglInit===void 0&&(tt.__webglInit=!0,S.depthTexture.addEventListener("dispose",T)),tt.__webglTexture===void 0){tt.__webglTexture=e.createTexture(),n.bindTexture(e.TEXTURE_CUBE_MAP,tt.__webglTexture),H(e.TEXTURE_CUBE_MAP,S.depthTexture);const Et=a.convert(S.depthTexture.format),At=a.convert(S.depthTexture.type);let zt;S.depthTexture.format===Bi?zt=e.DEPTH_COMPONENT24:S.depthTexture.format===Ss&&(zt=e.DEPTH24_STENCIL8);for(let Rt=0;Rt<6;Rt++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,0,zt,S.width,S.height,0,Et,At,null)}}else F(S.depthTexture,0);const _t=tt.__webglTexture,St=bt(S),ct=K?e.TEXTURE_CUBE_MAP_POSITIVE_X+X:e.TEXTURE_2D,dt=S.depthTexture.format===Ss?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(S.depthTexture.format===Bi)Zt(S)?r.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,dt,ct,_t,0,St):e.framebufferTexture2D(e.FRAMEBUFFER,dt,ct,_t,0);else if(S.depthTexture.format===Ss)Zt(S)?r.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,dt,ct,_t,0,St):e.framebufferTexture2D(e.FRAMEBUFFER,dt,ct,_t,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function lt(R){const S=i.get(R),X=R.isWebGLCubeRenderTarget===!0;if(S.__boundDepthTexture!==R.depthTexture){const K=R.depthTexture;if(S.__depthDisposeCallback&&S.__depthDisposeCallback(),K){const tt=()=>{delete S.__boundDepthTexture,delete S.__depthDisposeCallback,K.removeEventListener("dispose",tt)};K.addEventListener("dispose",tt),S.__depthDisposeCallback=tt}S.__boundDepthTexture=K}if(R.depthTexture&&!S.__autoAllocateDepthBuffer)if(X)for(let K=0;K<6;K++)Kt(S.__webglFramebuffer[K],R,K);else{const K=R.texture.mipmaps;K&&K.length>0?Kt(S.__webglFramebuffer[0],R,0):Kt(S.__webglFramebuffer,R,0)}else if(X){S.__webglDepthbuffer=[];for(let K=0;K<6;K++)if(n.bindFramebuffer(e.FRAMEBUFFER,S.__webglFramebuffer[K]),S.__webglDepthbuffer[K]===void 0)S.__webglDepthbuffer[K]=e.createRenderbuffer(),Mt(S.__webglDepthbuffer[K],R,!1);else{const tt=R.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,_t=S.__webglDepthbuffer[K];e.bindRenderbuffer(e.RENDERBUFFER,_t),e.framebufferRenderbuffer(e.FRAMEBUFFER,tt,e.RENDERBUFFER,_t)}}else{const K=R.texture.mipmaps;if(K&&K.length>0?n.bindFramebuffer(e.FRAMEBUFFER,S.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,S.__webglFramebuffer),S.__webglDepthbuffer===void 0)S.__webglDepthbuffer=e.createRenderbuffer(),Mt(S.__webglDepthbuffer,R,!1);else{const tt=R.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,_t=S.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,_t),e.framebufferRenderbuffer(e.FRAMEBUFFER,tt,e.RENDERBUFFER,_t)}}n.bindFramebuffer(e.FRAMEBUFFER,null)}function pt(R,S,X){const K=i.get(R);S!==void 0&&rt(K.__webglFramebuffer,R,R.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),X!==void 0&&lt(R)}function xt(R){const S=R.texture,X=i.get(R),K=i.get(S);R.addEventListener("dispose",M);const tt=R.textures,_t=R.isWebGLCubeRenderTarget===!0,St=tt.length>1;if(St||(K.__webglTexture===void 0&&(K.__webglTexture=e.createTexture()),K.__version=S.version,o.memory.textures++),_t){X.__webglFramebuffer=[];for(let ct=0;ct<6;ct++)if(S.mipmaps&&S.mipmaps.length>0){X.__webglFramebuffer[ct]=[];for(let dt=0;dt<S.mipmaps.length;dt++)X.__webglFramebuffer[ct][dt]=e.createFramebuffer()}else X.__webglFramebuffer[ct]=e.createFramebuffer()}else{if(S.mipmaps&&S.mipmaps.length>0){X.__webglFramebuffer=[];for(let ct=0;ct<S.mipmaps.length;ct++)X.__webglFramebuffer[ct]=e.createFramebuffer()}else X.__webglFramebuffer=e.createFramebuffer();if(St)for(let ct=0,dt=tt.length;ct<dt;ct++){const Et=i.get(tt[ct]);Et.__webglTexture===void 0&&(Et.__webglTexture=e.createTexture(),o.memory.textures++)}if(R.samples>0&&Zt(R)===!1){X.__webglMultisampledFramebuffer=e.createFramebuffer(),X.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,X.__webglMultisampledFramebuffer);for(let ct=0;ct<tt.length;ct++){const dt=tt[ct];X.__webglColorRenderbuffer[ct]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,X.__webglColorRenderbuffer[ct]);const Et=a.convert(dt.format,dt.colorSpace),At=a.convert(dt.type),zt=g(dt.internalFormat,Et,At,dt.normalized,dt.colorSpace,R.isXRRenderTarget===!0),Rt=bt(R);e.renderbufferStorageMultisample(e.RENDERBUFFER,Rt,zt,R.width,R.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+ct,e.RENDERBUFFER,X.__webglColorRenderbuffer[ct])}e.bindRenderbuffer(e.RENDERBUFFER,null),R.depthBuffer&&(X.__webglDepthRenderbuffer=e.createRenderbuffer(),Mt(X.__webglDepthRenderbuffer,R,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(_t){n.bindTexture(e.TEXTURE_CUBE_MAP,K.__webglTexture),H(e.TEXTURE_CUBE_MAP,S);for(let ct=0;ct<6;ct++)if(S.mipmaps&&S.mipmaps.length>0)for(let dt=0;dt<S.mipmaps.length;dt++)rt(X.__webglFramebuffer[ct][dt],R,S,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+ct,dt);else rt(X.__webglFramebuffer[ct],R,S,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+ct,0);p(S)&&v(e.TEXTURE_CUBE_MAP),n.unbindTexture()}else if(St){for(let ct=0,dt=tt.length;ct<dt;ct++){const Et=tt[ct],At=i.get(Et);let zt=e.TEXTURE_2D;(R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(zt=R.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(zt,At.__webglTexture),H(zt,Et),rt(X.__webglFramebuffer,R,Et,e.COLOR_ATTACHMENT0+ct,zt,0),p(Et)&&v(zt)}n.unbindTexture()}else{let ct=e.TEXTURE_2D;if((R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(ct=R.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(ct,K.__webglTexture),H(ct,S),S.mipmaps&&S.mipmaps.length>0)for(let dt=0;dt<S.mipmaps.length;dt++)rt(X.__webglFramebuffer[dt],R,S,e.COLOR_ATTACHMENT0,ct,dt);else rt(X.__webglFramebuffer,R,S,e.COLOR_ATTACHMENT0,ct,0);p(S)&&v(ct),n.unbindTexture()}R.depthBuffer&&lt(R)}function yt(R){const S=R.textures;for(let X=0,K=S.length;X<K;X++){const tt=S[X];if(p(tt)){const _t=y(R),St=i.get(tt).__webglTexture;n.bindTexture(_t,St),v(_t),n.unbindTexture()}}}const j=[],wt=[];function Pt(R){if(R.samples>0){if(Zt(R)===!1){const S=R.textures,X=R.width,K=R.height;let tt=e.COLOR_BUFFER_BIT;const _t=R.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,St=i.get(R),ct=S.length>1;if(ct)for(let Et=0;Et<S.length;Et++)n.bindFramebuffer(e.FRAMEBUFFER,St.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+Et,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,St.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+Et,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,St.__webglMultisampledFramebuffer);const dt=R.texture.mipmaps;dt&&dt.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,St.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,St.__webglFramebuffer);for(let Et=0;Et<S.length;Et++){if(R.resolveDepthBuffer&&(R.depthBuffer&&(tt|=e.DEPTH_BUFFER_BIT),R.stencilBuffer&&R.resolveStencilBuffer&&(tt|=e.STENCIL_BUFFER_BIT)),ct){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,St.__webglColorRenderbuffer[Et]);const At=i.get(S[Et]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,At,0)}e.blitFramebuffer(0,0,X,K,0,0,X,K,tt,e.NEAREST),c===!0&&(j.length=0,wt.length=0,j.push(e.COLOR_ATTACHMENT0+Et),R.depthBuffer&&R.storeMultisampledDepthBuffer===!1&&(j.push(_t),wt.push(_t),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,wt)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,j))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),ct)for(let Et=0;Et<S.length;Et++){n.bindFramebuffer(e.FRAMEBUFFER,St.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+Et,e.RENDERBUFFER,St.__webglColorRenderbuffer[Et]);const At=i.get(S[Et]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,St.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+Et,e.TEXTURE_2D,At,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,St.__webglMultisampledFramebuffer)}else if(R.depthBuffer&&R.storeMultisampledDepthBuffer===!1&&c){const S=R.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[S])}}}function bt(R){return Math.min(s.maxSamples,R.samples)}function Zt(R){const S=i.get(R);return R.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&S.__useRenderToTexture!==!1}function G(R){const S=o.render.frame;d.get(R)!==S&&(d.set(R,S),R.update())}function Q(R,S){const X=R.colorSpace,K=R.format,tt=R.type;return R.isCompressedTexture===!0||R.isVideoTexture===!0||X!==qc&&X!==as&&(oe.getTransfer(X)===me?(K!==Zn||tt!==wn)&&Qt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):ce("WebGLTextures: Unsupported texture color space:",X)),S}function ut(R){return typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement?(l.width=R.naturalWidth||R.width,l.height=R.naturalHeight||R.height):typeof VideoFrame<"u"&&R instanceof VideoFrame?(l.width=R.displayWidth,l.height=R.displayHeight):(l.width=R.width,l.height=R.height),l}this.allocateTextureUnit=V,this.resetTextureUnits=U,this.getTextureUnits=P,this.setTextureUnits=O,this.setTexture2D=F,this.setTexture2DArray=L,this.setTexture3D=B,this.setTextureCube=$,this.rebindTextures=pt,this.setupRenderTarget=xt,this.updateRenderTargetMipmap=yt,this.updateMultisampleRenderTarget=Pt,this.setupDepthRenderbuffer=lt,this.setupFrameBufferTexture=rt,this.useMultisampledRTT=Zt,this.isReversedDepthBuffer=function(){return n.buffers.depth.getReversed()}}function Qb(e,t){function n(i,s=as){let a;const o=oe.getTransfer(s);if(i===wn)return e.UNSIGNED_BYTE;if(i===zu)return e.UNSIGNED_SHORT_4_4_4_4;if(i===Ru)return e.UNSIGNED_SHORT_5_5_5_1;if(i===Rm)return e.UNSIGNED_INT_5_9_9_9_REV;if(i===Cm)return e.UNSIGNED_INT_10F_11F_11F_REV;if(i===Am)return e.BYTE;if(i===zm)return e.SHORT;if(i===er)return e.UNSIGNED_SHORT;if(i===Au)return e.INT;if(i===fi)return e.UNSIGNED_INT;if(i===oi)return e.FLOAT;if(i===ui)return e.HALF_FLOAT;if(i===Pm)return e.ALPHA;if(i===Lm)return e.RGB;if(i===Zn)return e.RGBA;if(i===Bi)return e.DEPTH_COMPONENT;if(i===Ss)return e.DEPTH_STENCIL;if(i===Im)return e.RED;if(i===Cu)return e.RED_INTEGER;if(i===Us)return e.RG;if(i===Pu)return e.RG_INTEGER;if(i===Lu)return e.RGBA_INTEGER;if(i===Cc||i===Pc||i===Lc||i===Ic)if(o===me)if(a=t.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(i===Cc)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Pc)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Lc)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Ic)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=t.get("WEBGL_compressed_texture_s3tc"),a!==null){if(i===Cc)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Pc)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Lc)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Ic)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===lf||i===df||i===ff||i===uf)if(a=t.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(i===lf)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===df)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===ff)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===uf)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===hf||i===pf||i===mf||i===xf||i===gf||i===Wc||i===_f)if(a=t.get("WEBGL_compressed_texture_etc"),a!==null){if(i===hf||i===pf)return o===me?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(i===mf)return o===me?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC;if(i===xf)return a.COMPRESSED_R11_EAC;if(i===gf)return a.COMPRESSED_SIGNED_R11_EAC;if(i===Wc)return a.COMPRESSED_RG11_EAC;if(i===_f)return a.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===vf||i===Mf||i===yf||i===bf||i===Sf||i===wf||i===Ef||i===Tf||i===Af||i===zf||i===Rf||i===Cf||i===Pf||i===Lf)if(a=t.get("WEBGL_compressed_texture_astc"),a!==null){if(i===vf)return o===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Mf)return o===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===yf)return o===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===bf)return o===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===Sf)return o===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===wf)return o===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Ef)return o===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Tf)return o===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Af)return o===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===zf)return o===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Rf)return o===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Cf)return o===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Pf)return o===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Lf)return o===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===If||i===Df||i===Nf)if(a=t.get("EXT_texture_compression_bptc"),a!==null){if(i===If)return o===me?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Df)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Nf)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Uf||i===Of||i===Xc||i===Ff)if(a=t.get("EXT_texture_compression_rgtc"),a!==null){if(i===Uf)return a.COMPRESSED_RED_RGTC1_EXT;if(i===Of)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Xc)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Ff)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===nr?e.UNSIGNED_INT_24_8:e[i]!==void 0?e[i]:null}return{convert:n}}const jb=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,tS=`
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

}`;class eS{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,n){if(this.texture===null){const i=new Vm(t.texture);(t.depthNear!==n.depthNear||t.depthFar!==n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=i}}getMesh(t){if(this.texture!==null&&this.mesh===null){const n=t.cameras[0].viewport,i=new hi({vertexShader:jb,fragmentShader:tS,uniforms:{depthColor:{value:this.texture},depthWidth:{value:n.z},depthHeight:{value:n.w}}});this.mesh=new we(new Al(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class nS extends Ys{constructor(t,n){super();const i=this;let s=null,a=1,o=null,r="local-floor",c=1,l=null,d=null,f=null,u=null,h=null,m=null;const _=typeof XRWebGLBinding<"u",x=new eS,p={},v=n.getContextAttributes();let y=null,g=null;const b=[],w=[],T=new Ct;let M=null,E=null;const A=new Nn;A.viewport=new Ae;const C=new Nn;C.viewport=new Ae;const I=[A,C],U=new dv;let P=null,O=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(W){let k=b[W];return k===void 0&&(k=new nd,b[W]=k),k.getTargetRaySpace()},this.getControllerGrip=function(W){let k=b[W];return k===void 0&&(k=new nd,b[W]=k),k.getGripSpace()},this.getHand=function(W){let k=b[W];return k===void 0&&(k=new nd,b[W]=k),k.getHandSpace()};function V(W){const k=w.indexOf(W.inputSource);if(k===-1)return;const at=b[k];at!==void 0&&(at.update(W.inputSource,W.frame,l||o),at.dispatchEvent({type:W.type,data:W.inputSource}))}function N(){s.removeEventListener("select",V),s.removeEventListener("selectstart",V),s.removeEventListener("selectend",V),s.removeEventListener("squeeze",V),s.removeEventListener("squeezestart",V),s.removeEventListener("squeezeend",V),s.removeEventListener("end",N),s.removeEventListener("inputsourceschange",F);for(let W=0;W<b.length;W++){const k=w[W];k!==null&&(w[W]=null,b[W].disconnect(k))}P=null,O=null,x.reset();for(const W in p)delete p[W];if(t.setRenderTarget(y),h=null,u=null,f=null,s=null,g=null,et.stop(),i.isPresenting=!1,t.setPixelRatio(M),t.setSize(T.width,T.height,!1),E!==null){const W=E.camera;W.fov=E.fov,W.zoom=E.zoom,W.updateProjectionMatrix(),E=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(W){a=W,i.isPresenting===!0&&Qt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(W){r=W,i.isPresenting===!0&&Qt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(W){l=W},this.getBaseLayer=function(){return u!==null?u:h},this.getBinding=function(){return f===null&&_&&(f=new XRWebGLBinding(s,n)),f},this.getFrame=function(){return m},this.getSession=function(){return s},this.setSession=async function(W){if(s=W,s!==null){if(y=t.getRenderTarget(),s.addEventListener("select",V),s.addEventListener("selectstart",V),s.addEventListener("selectend",V),s.addEventListener("squeeze",V),s.addEventListener("squeezestart",V),s.addEventListener("squeezeend",V),s.addEventListener("end",N),s.addEventListener("inputsourceschange",F),v.xrCompatible!==!0&&await n.makeXRCompatible(),M=t.getPixelRatio(),t.getSize(T),_&&"createProjectionLayer"in XRWebGLBinding.prototype){let at=null,mt=null,rt=null;v.depth&&(rt=v.stencil?n.DEPTH24_STENCIL8:n.DEPTH_COMPONENT24,at=v.stencil?Ss:Bi,mt=v.stencil?nr:fi);const Mt={colorFormat:n.RGBA8,depthFormat:rt,scaleFactor:a};f=this.getBinding(),u=f.createProjectionLayer(Mt),s.updateRenderState({layers:[u]}),t.setPixelRatio(1),t.setSize(u.textureWidth,u.textureHeight,!1),g=new Kn(u.textureWidth,u.textureHeight,{format:Zn,type:wn,depthTexture:new sr(u.textureWidth,u.textureHeight,mt,void 0,void 0,void 0,void 0,void 0,void 0,at),stencilBuffer:v.stencil,colorSpace:t.outputColorSpace,samples:v.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}else{const at={antialias:v.antialias,alpha:!0,depth:v.depth,stencil:v.stencil,framebufferScaleFactor:a};h=new XRWebGLLayer(s,n,at),s.updateRenderState({baseLayer:h}),t.setPixelRatio(1),t.setSize(h.framebufferWidth,h.framebufferHeight,!1),g=new Kn(h.framebufferWidth,h.framebufferHeight,{format:Zn,type:wn,colorSpace:t.outputColorSpace,stencilBuffer:v.stencil,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1,storeMultisampledDepthBuffer:h.ignoreDepthValues===!1,storeMultisampledStencilBuffer:h.ignoreDepthValues===!1})}g.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await s.requestReferenceSpace(r),et.setContext(s),et.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function F(W){for(let k=0;k<W.removed.length;k++){const at=W.removed[k],mt=w.indexOf(at);mt>=0&&(w[mt]=null,b[mt].disconnect(at))}for(let k=0;k<W.added.length;k++){const at=W.added[k];let mt=w.indexOf(at);if(mt===-1){for(let Mt=0;Mt<b.length;Mt++)if(Mt>=w.length){w.push(at),mt=Mt;break}else if(w[Mt]===null){w[Mt]=at,mt=Mt;break}if(mt===-1)break}const rt=b[mt];rt&&rt.connect(at)}}const L=new q,B=new q;function $(W,k,at){L.setFromMatrixPosition(k.matrixWorld),B.setFromMatrixPosition(at.matrixWorld);const mt=L.distanceTo(B),rt=k.projectionMatrix.elements,Mt=at.projectionMatrix.elements,Kt=rt[14]/(rt[10]-1),lt=rt[14]/(rt[10]+1),pt=(rt[9]+1)/rt[5],xt=(rt[9]-1)/rt[5],yt=(rt[8]-1)/rt[0],j=(Mt[8]+1)/Mt[0],wt=Kt*yt,Pt=Kt*j,bt=mt/(-yt+j),Zt=bt*-yt;if(k.matrixWorld.decompose(W.position,W.quaternion,W.scale),W.translateX(Zt),W.translateZ(bt),W.matrixWorld.compose(W.position,W.quaternion,W.scale),W.matrixWorldInverse.copy(W.matrixWorld).invert(),rt[10]===-1)W.projectionMatrix.copy(k.projectionMatrix),W.projectionMatrixInverse.copy(k.projectionMatrixInverse);else{const G=Kt+bt,Q=lt+bt,ut=wt-Zt,R=Pt+(mt-Zt),S=pt*lt/Q*G,X=xt*lt/Q*G;W.projectionMatrix.makePerspective(ut,R,S,X,G,Q),W.projectionMatrixInverse.copy(W.projectionMatrix).invert()}}function J(W,k){k===null?W.matrixWorld.copy(W.matrix):W.matrixWorld.multiplyMatrices(k.matrixWorld,W.matrix),W.matrixWorldInverse.copy(W.matrixWorld).invert()}this.updateCamera=function(W){if(s===null)return;let k=W.near,at=W.far;x.texture!==null&&(x.depthNear>0&&(k=x.depthNear),x.depthFar>0&&(at=x.depthFar)),U.near=C.near=A.near=k,U.far=C.far=A.far=at,(P!==U.near||O!==U.far)&&(s.updateRenderState({depthNear:U.near,depthFar:U.far}),P=U.near,O=U.far),U.layers.mask=W.layers.mask|6,A.layers.mask=U.layers.mask&-5,C.layers.mask=U.layers.mask&-3;const mt=W.parent,rt=U.cameras;J(U,mt);for(let Mt=0;Mt<rt.length;Mt++)J(rt[Mt],mt);rt.length===2?$(U,A,C):U.projectionMatrix.copy(A.projectionMatrix),E===null&&W.isPerspectiveCamera&&(E={camera:W,fov:W.fov,zoom:W.zoom}),st(W,U,mt)};function st(W,k,at){at===null?W.matrix.copy(k.matrixWorld):(W.matrix.copy(at.matrixWorld),W.matrix.invert(),W.matrix.multiply(k.matrixWorld)),W.matrix.decompose(W.position,W.quaternion,W.scale),W.updateMatrixWorld(!0),W.projectionMatrix.copy(k.projectionMatrix),W.projectionMatrixInverse.copy(k.projectionMatrixInverse),W.isPerspectiveCamera&&(W.fov=Bf*2*Math.atan(1/W.projectionMatrix.elements[5]),W.zoom=1)}this.getCamera=function(){return U},this.getFoveation=function(){if(!(u===null&&h===null))return c},this.setFoveation=function(W){c=W,u!==null&&(u.fixedFoveation=W),h!==null&&h.fixedFoveation!==void 0&&(h.fixedFoveation=W)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(U)},this.getCameraTexture=function(W){return p[W]};let Tt=null;function H(W,k){if(d=k.getViewerPose(l||o),m=k,d!==null){const at=d.views;h!==null&&(t.setRenderTargetFramebuffer(g,h.framebuffer),t.setRenderTarget(g));let mt=!1;at.length!==U.cameras.length&&(U.cameras.length=0,mt=!0);for(let lt=0;lt<at.length;lt++){const pt=at[lt];let xt=null;if(h!==null)xt=h.getViewport(pt);else{const j=f.getViewSubImage(u,pt);xt=j.viewport,lt===0&&(t.setRenderTargetTextures(g,j.colorTexture,j.depthStencilTexture),t.setRenderTarget(g))}let yt=I[lt];yt===void 0&&(yt=new Nn,yt.layers.enable(lt),yt.viewport=new Ae,I[lt]=yt),yt.matrix.fromArray(pt.transform.matrix),yt.matrix.decompose(yt.position,yt.quaternion,yt.scale),yt.projectionMatrix.fromArray(pt.projectionMatrix),yt.projectionMatrixInverse.copy(yt.projectionMatrix).invert(),yt.viewport.set(xt.x,xt.y,xt.width,xt.height),lt===0&&(U.matrix.copy(yt.matrix),U.matrix.decompose(U.position,U.quaternion,U.scale)),mt===!0&&U.cameras.push(yt)}const rt=s.enabledFeatures;if(rt&&rt.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&_){f=i.getBinding();const lt=f.getDepthInformation(at[0]);lt&&lt.isValid&&lt.texture&&x.init(lt,s.renderState)}if(rt&&rt.includes("camera-access")&&_){t.state.unbindTexture(),f=i.getBinding();for(let lt=0;lt<at.length;lt++){const pt=at[lt].camera;if(pt){let xt=p[pt];xt||(xt=new Vm,p[pt]=xt);const yt=f.getCameraImage(pt);xt.sourceTexture=yt}}}}for(let at=0;at<b.length;at++){const mt=w[at],rt=b[at];mt!==null&&rt!==void 0&&rt.update(mt,k,l||o)}Tt&&Tt(W,k),k.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:k}),m=null}const et=new sx;et.setAnimationLoop(H),this.setAnimationLoop=function(W){Tt=W},this.dispose=function(){}}}const iS=new Ee,fx=new te;fx.set(-1,0,0,0,1,0,0,0,1);function sS(e,t){function n(x,p){x.matrixAutoUpdate===!0&&x.updateMatrix(),p.value.copy(x.matrix)}function i(x,p){p.color.getRGB(x.fogColor.value,jm(e)),p.isFog?(x.fogNear.value=p.near,x.fogFar.value=p.far):p.isFogExp2&&(x.fogDensity.value=p.density)}function s(x,p,v,y,g){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?a(x,p):p.isMeshLambertMaterial?(a(x,p),p.envMap&&(x.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(a(x,p),f(x,p)):p.isMeshPhongMaterial?(a(x,p),d(x,p),p.envMap&&(x.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(a(x,p),u(x,p),p.isMeshPhysicalMaterial&&h(x,p,g)):p.isMeshMatcapMaterial?(a(x,p),m(x,p)):p.isMeshDepthMaterial?a(x,p):p.isMeshDistanceMaterial?(a(x,p),_(x,p)):p.isMeshNormalMaterial?a(x,p):p.isLineBasicMaterial?(o(x,p),p.isLineDashedMaterial&&r(x,p)):p.isPointsMaterial?c(x,p,v,y):p.isSpriteMaterial?l(x,p):p.isShadowMaterial?(x.color.value.copy(p.color),x.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function a(x,p){x.opacity.value=p.opacity,p.color&&x.diffuse.value.copy(p.color),p.emissive&&x.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(x.map.value=p.map,n(p.map,x.mapTransform)),p.alphaMap&&(x.alphaMap.value=p.alphaMap,n(p.alphaMap,x.alphaMapTransform)),p.bumpMap&&(x.bumpMap.value=p.bumpMap,n(p.bumpMap,x.bumpMapTransform),x.bumpScale.value=p.bumpScale,p.side===hn&&(x.bumpScale.value*=-1)),p.normalMap&&(x.normalMap.value=p.normalMap,n(p.normalMap,x.normalMapTransform),x.normalScale.value.copy(p.normalScale),p.side===hn&&x.normalScale.value.negate()),p.displacementMap&&(x.displacementMap.value=p.displacementMap,n(p.displacementMap,x.displacementMapTransform),x.displacementScale.value=p.displacementScale,x.displacementBias.value=p.displacementBias),p.emissiveMap&&(x.emissiveMap.value=p.emissiveMap,n(p.emissiveMap,x.emissiveMapTransform)),p.specularMap&&(x.specularMap.value=p.specularMap,n(p.specularMap,x.specularMapTransform)),p.alphaTest>0&&(x.alphaTest.value=p.alphaTest);const v=t.get(p),y=v.envMap,g=v.envMapRotation;y&&(x.envMap.value=y,x.envMapRotation.value.setFromMatrix4(iS.makeRotationFromEuler(g)).transpose(),y.isCubeTexture&&y.isRenderTargetTexture===!1&&x.envMapRotation.value.premultiply(fx),x.reflectivity.value=p.reflectivity,x.ior.value=p.ior,x.refractionRatio.value=p.refractionRatio),p.lightMap&&(x.lightMap.value=p.lightMap,x.lightMapIntensity.value=p.lightMapIntensity,n(p.lightMap,x.lightMapTransform)),p.aoMap&&(x.aoMap.value=p.aoMap,x.aoMapIntensity.value=p.aoMapIntensity,n(p.aoMap,x.aoMapTransform))}function o(x,p){x.diffuse.value.copy(p.color),x.opacity.value=p.opacity,p.map&&(x.map.value=p.map,n(p.map,x.mapTransform))}function r(x,p){x.dashSize.value=p.dashSize,x.totalSize.value=p.dashSize+p.gapSize,x.scale.value=p.scale}function c(x,p,v,y){x.diffuse.value.copy(p.color),x.opacity.value=p.opacity,x.size.value=p.size*v,x.scale.value=y*.5,p.map&&(x.map.value=p.map,n(p.map,x.uvTransform)),p.alphaMap&&(x.alphaMap.value=p.alphaMap,n(p.alphaMap,x.alphaMapTransform)),p.alphaTest>0&&(x.alphaTest.value=p.alphaTest)}function l(x,p){x.diffuse.value.copy(p.color),x.opacity.value=p.opacity,x.rotation.value=p.rotation,p.map&&(x.map.value=p.map,n(p.map,x.mapTransform)),p.alphaMap&&(x.alphaMap.value=p.alphaMap,n(p.alphaMap,x.alphaMapTransform)),p.alphaTest>0&&(x.alphaTest.value=p.alphaTest)}function d(x,p){x.specular.value.copy(p.specular),x.shininess.value=Math.max(p.shininess,1e-4)}function f(x,p){p.gradientMap&&(x.gradientMap.value=p.gradientMap)}function u(x,p){x.metalness.value=p.metalness,p.metalnessMap&&(x.metalnessMap.value=p.metalnessMap,n(p.metalnessMap,x.metalnessMapTransform)),x.roughness.value=p.roughness,p.roughnessMap&&(x.roughnessMap.value=p.roughnessMap,n(p.roughnessMap,x.roughnessMapTransform)),p.envMap&&(x.envMapIntensity.value=p.envMapIntensity)}function h(x,p,v){x.ior.value=p.ior,p.sheen>0&&(x.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),x.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(x.sheenColorMap.value=p.sheenColorMap,n(p.sheenColorMap,x.sheenColorMapTransform)),p.sheenRoughnessMap&&(x.sheenRoughnessMap.value=p.sheenRoughnessMap,n(p.sheenRoughnessMap,x.sheenRoughnessMapTransform))),p.clearcoat>0&&(x.clearcoat.value=p.clearcoat,x.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(x.clearcoatMap.value=p.clearcoatMap,n(p.clearcoatMap,x.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(x.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,n(p.clearcoatRoughnessMap,x.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(x.clearcoatNormalMap.value=p.clearcoatNormalMap,n(p.clearcoatNormalMap,x.clearcoatNormalMapTransform),x.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===hn&&x.clearcoatNormalScale.value.negate())),p.dispersion>0&&(x.dispersion.value=p.dispersion),p.retroreflectivity>0&&(x.retroreflectivity.value=p.retroreflectivity),p.iridescence>0&&(x.iridescence.value=p.iridescence,x.iridescenceIOR.value=p.iridescenceIOR,x.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],x.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(x.iridescenceMap.value=p.iridescenceMap,n(p.iridescenceMap,x.iridescenceMapTransform)),p.iridescenceThicknessMap&&(x.iridescenceThicknessMap.value=p.iridescenceThicknessMap,n(p.iridescenceThicknessMap,x.iridescenceThicknessMapTransform))),p.transmission>0&&(x.transmission.value=p.transmission,x.transmissionSamplerMap.value=v.texture,x.transmissionSamplerSize.value.set(v.width,v.height),p.transmissionMap&&(x.transmissionMap.value=p.transmissionMap,n(p.transmissionMap,x.transmissionMapTransform)),x.thickness.value=p.thickness,p.thicknessMap&&(x.thicknessMap.value=p.thicknessMap,n(p.thicknessMap,x.thicknessMapTransform)),x.attenuationDistance.value=p.attenuationDistance,x.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(x.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(x.anisotropyMap.value=p.anisotropyMap,n(p.anisotropyMap,x.anisotropyMapTransform))),x.specularIntensity.value=p.specularIntensity,x.specularColor.value.copy(p.specularColor),p.specularColorMap&&(x.specularColorMap.value=p.specularColorMap,n(p.specularColorMap,x.specularColorMapTransform)),p.specularIntensityMap&&(x.specularIntensityMap.value=p.specularIntensityMap,n(p.specularIntensityMap,x.specularIntensityMapTransform))}function m(x,p){p.matcap&&(x.matcap.value=p.matcap)}function _(x,p){const v=t.get(p).light;x.referencePosition.value.setFromMatrixPosition(v.matrixWorld),x.nearDistance.value=v.shadow.camera.near,x.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function aS(e,t,n,i){let s={},a={},o=[];const r=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function c(g,b){const w=b.program;i.uniformBlockBinding(g,w)}function l(g,b){let w=s[g.id];w===void 0&&(x(g),w=d(g),s[g.id]=w,g.addEventListener("dispose",v));const T=b.program;i.updateUBOMapping(g,T);const M=t.render.frame;a[g.id]!==M&&(u(g),a[g.id]=M)}function d(g){const b=f();g.__bindingPointIndex=b;const w=e.createBuffer(),T=g.__size,M=g.usage;return e.bindBuffer(e.UNIFORM_BUFFER,w),e.bufferData(e.UNIFORM_BUFFER,T,M),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,b,w),w}function f(){for(let g=0;g<r;g++)if(o.indexOf(g)===-1)return o.push(g),g;return ce("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(g){const b=s[g.id],w=g.uniforms,T=g.__cache;e.bindBuffer(e.UNIFORM_BUFFER,b);for(let M=0,E=w.length;M<E;M++){const A=w[M];if(Array.isArray(A))for(let C=0,I=A.length;C<I;C++)h(A[C],M,C,T);else h(A,M,0,T)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function h(g,b,w,T){if(_(g,b,w,T)===!0){const M=g.__offset,E=g.value;if(Array.isArray(E)){let A=0;for(let C=0;C<E.length;C++){const I=E[C],U=p(I);m(I,g.__data,A),typeof I!="number"&&typeof I!="boolean"&&!I.isMatrix3&&!ArrayBuffer.isView(I)&&(A+=U.storage/Float32Array.BYTES_PER_ELEMENT)}}else m(E,g.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,M,g.__data)}}function m(g,b,w){typeof g=="number"||typeof g=="boolean"?b[0]=g:g.isMatrix3?(b[0]=g.elements[0],b[1]=g.elements[1],b[2]=g.elements[2],b[3]=0,b[4]=g.elements[3],b[5]=g.elements[4],b[6]=g.elements[5],b[7]=0,b[8]=g.elements[6],b[9]=g.elements[7],b[10]=g.elements[8],b[11]=0):ArrayBuffer.isView(g)?b.set(new g.constructor(g.buffer,g.byteOffset,b.length)):g.toArray(b,w)}function _(g,b,w,T){const M=g.value,E=b+"_"+w;if(T[E]===void 0)return typeof M=="number"||typeof M=="boolean"?T[E]=M:ArrayBuffer.isView(M)?T[E]=M.slice():T[E]=M.clone(),!0;{const A=T[E];if(typeof M=="number"||typeof M=="boolean"){if(A!==M)return T[E]=M,!0}else{if(ArrayBuffer.isView(M))return!0;if(A.equals(M)===!1)return A.copy(M),!0}}return!1}function x(g){const b=g.uniforms;let w=0;const T=16;for(let E=0,A=b.length;E<A;E++){const C=Array.isArray(b[E])?b[E]:[b[E]];for(let I=0,U=C.length;I<U;I++){const P=C[I],O=Array.isArray(P.value)?P.value:[P.value];for(let V=0,N=O.length;V<N;V++){const F=O[V],L=p(F),B=w%T,$=B%L.boundary,J=B+$;w+=$,J!==0&&T-J<L.storage&&(w+=T-J),P.__data=new Float32Array(L.storage/Float32Array.BYTES_PER_ELEMENT),P.__offset=w,w+=L.storage}}}const M=w%T;return M>0&&(w+=T-M),g.__size=w,g.__cache={},this}function p(g){const b={boundary:0,storage:0};return typeof g=="number"||typeof g=="boolean"?(b.boundary=4,b.storage=4):g.isVector2?(b.boundary=8,b.storage=8):g.isVector3||g.isColor?(b.boundary=16,b.storage=12):g.isVector4?(b.boundary=16,b.storage=16):g.isMatrix3?(b.boundary=48,b.storage=48):g.isMatrix4?(b.boundary=64,b.storage=64):g.isTexture?Qt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(g)?(b.boundary=16,b.storage=g.byteLength):Qt("WebGLRenderer: Unsupported uniform value type.",g),b}function v(g){const b=g.target;b.removeEventListener("dispose",v);const w=o.indexOf(b.__bindingPointIndex);o.splice(w,1),e.deleteBuffer(s[b.id]),delete s[b.id],delete a[b.id]}function y(){for(const g in s)e.deleteBuffer(s[g]);o=[],s={},a={}}return{bind:c,update:l,dispose:y}}const oS=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let ni=null;function rS(){return ni===null&&(ni=new g_(oS,16,16,Us,ui),ni.name="DFG_LUT",ni.minFilter=$e,ni.magFilter=$e,ni.wrapS=Ri,ni.wrapT=Ri,ni.generateMipmaps=!1,ni.needsUpdate=!0),ni}class cS{constructor(t={}){const{canvas:n=X1(),context:i=null,depth:s=!0,stencil:a=!1,alpha:o=!1,antialias:r=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:d="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:u=!1,outputBufferType:h=wn}=t;this.isWebGLRenderer=!0;let m;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=i.getContextAttributes().alpha}else m=o;const _=h,x=new Set([Lu,Pu,Cu]),p=new Set([wn,fi,er,nr,zu,Ru]),v=new Uint32Array(4),y=new Int32Array(4),g=new q;let b=null,w=null;const T=[],M=[];let E=null;this.domElement=n,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=li,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const A=this;let C=!1,I=null,U=null,P=null,O=null;this._outputColorSpace=fn;let V=0,N=0,F=null,L=-1,B=null;const $=new Ae,J=new Ae;let st=null;const Tt=new ee(0);let H=0,et=n.width,W=n.height,k=1,at=null,mt=null;const rt=new Ae(0,0,et,W),Mt=new Ae(0,0,et,W);let Kt=!1;const lt=new Ou;let pt=!1,xt=!1;const yt=new Ee,j=new q,wt=new Ae,Pt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let bt=!1;function Zt(){return F===null?k:1}let G=i;function Q(z,Y){return n.getContext(z,Y)}let ut,R,S,X,K,tt,_t,St,ct,dt,Et,At,zt,Rt,Ot,$t,Jt,Z,Lt,ht,It,Ft,vt;try{const z={alpha:!0,depth:s,stencil:a,antialias:r,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:d,failIfMajorPerformanceCaveat:f};if("setAttribute"in n&&n.setAttribute("data-engine",`three.js r${Eu}`),n.addEventListener("webglcontextlost",ye,!1),n.addEventListener("webglcontextrestored",fe,!1),n.addEventListener("webglcontextcreationerror",Gn,!1),G===null){const Y="webgl2";if(G=Q(Y,z),G===null)throw Q(Y)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Yt()}catch(z){throw n.removeEventListener("webglcontextlost",ye,!1),n.removeEventListener("webglcontextrestored",fe,!1),n.removeEventListener("webglcontextcreationerror",Gn,!1),ce("WebGLRenderer: "+z.message),z}function Yt(){ut=new r2(G),ut.init(),It=new Qb(G,ut),R=new Jy(G,ut,t,It),S=new Kb(G,ut),R.reversedDepthBuffer&&u&&S.buffers.depth.setReversed(!0),U=G.createFramebuffer(),P=G.createFramebuffer(),O=G.createFramebuffer(),X=new d2(G),K=new Ub,tt=new Jb(G,ut,S,K,R,It,X),_t=new o2(A),St=new uv(G),Ft=new Zy(G,St),ct=new c2(G,St,X,Ft),dt=new u2(G,ct,St,Ft,X),Z=new f2(G,R,tt),Ot=new Qy(K),Et=new Nb(A,_t,ut,R,Ft,Ot),At=new sS(A,K),zt=new Fb,Rt=new Wb(ut),Jt=new Yy(A,_t,S,dt,m,c),$t=new Zb(A,dt,R),vt=new aS(G,X,R,S),Lt=new Ky(G,ut,X),ht=new l2(G,ut,X),X.programs=Et.programs,A.capabilities=R,A.extensions=ut,A.properties=K,A.renderLists=zt,A.shadowMap=$t,A.state=S,A.info=X}_!==wn&&(E=new p2(_,n.width,n.height,r,s,a));const Xt=new nS(A,G);this.xr=Xt,this.getContext=function(){return G},this.getContextAttributes=function(){return G.getContextAttributes()},this.forceContextLoss=function(){const z=ut.get("WEBGL_lose_context");z&&z.loseContext()},this.forceContextRestore=function(){const z=ut.get("WEBGL_lose_context");z&&z.restoreContext()},this.getPixelRatio=function(){return k},this.setPixelRatio=function(z){z!==void 0&&(k=z,this.setSize(et,W,!1))},this.getSize=function(z){return z.set(et,W)},this.setSize=function(z,Y,ot=!0){if(Xt.isPresenting){Qt("WebGLRenderer: Can't change size while VR device is presenting.");return}et=z,W=Y,n.width=Math.floor(z*k),n.height=Math.floor(Y*k),ot===!0&&(n.style.width=z+"px",n.style.height=Y+"px"),E!==null&&E.setSize(n.width,n.height),this.setViewport(0,0,z,Y)},this.getDrawingBufferSize=function(z){return z.set(et*k,W*k).floor()},this.setDrawingBufferSize=function(z,Y,ot){et=z,W=Y,k=ot,n.width=Math.floor(z*ot),n.height=Math.floor(Y*ot),this.setViewport(0,0,z,Y)},this.setEffects=function(z){if(_===wn){ce("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(z){for(let Y=0;Y<z.length;Y++)if(z[Y].isOutputPass===!0){Qt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}E.setEffects(z||[])},this.getCurrentViewport=function(z){return z.copy($)},this.getViewport=function(z){return z.copy(rt)},this.setViewport=function(z,Y,ot,nt){z.isVector4?rt.set(z.x,z.y,z.z,z.w):rt.set(z,Y,ot,nt),S.viewport($.copy(rt).multiplyScalar(k).round())},this.getScissor=function(z){return z.copy(Mt)},this.setScissor=function(z,Y,ot,nt){z.isVector4?Mt.set(z.x,z.y,z.z,z.w):Mt.set(z,Y,ot,nt),S.scissor(J.copy(Mt).multiplyScalar(k).round())},this.getScissorTest=function(){return Kt},this.setScissorTest=function(z){S.setScissorTest(Kt=z)},this.setOpaqueSort=function(z){at=z},this.setTransparentSort=function(z){mt=z},this.getClearColor=function(z){return z.copy(Jt.getClearColor())},this.setClearColor=function(){Jt.setClearColor(...arguments)},this.getClearAlpha=function(){return Jt.getClearAlpha()},this.setClearAlpha=function(){Jt.setClearAlpha(...arguments)},this.clear=function(z=!0,Y=!0,ot=!0){let nt=0;if(z){let it=!1;if(F!==null){const Ut=F.texture.format;it=x.has(Ut)}if(it){const Ut=F.texture.type,Gt=p.has(Ut),Nt=Jt.getClearColor(),Vt=Jt.getClearAlpha(),qt=Nt.r,ne=Nt.g,se=Nt.b;Gt?(v[0]=qt,v[1]=ne,v[2]=se,v[3]=Vt,G.clearBufferuiv(G.COLOR,0,v)):(y[0]=qt,y[1]=ne,y[2]=se,y[3]=Vt,G.clearBufferiv(G.COLOR,0,y))}else nt|=G.COLOR_BUFFER_BIT}Y&&(nt|=G.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),ot&&(nt|=G.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),nt!==0&&G.clear(nt)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(z){z.setRenderer(this),I=z},this.dispose=function(){n.removeEventListener("webglcontextlost",ye,!1),n.removeEventListener("webglcontextrestored",fe,!1),n.removeEventListener("webglcontextcreationerror",Gn,!1),Jt.dispose(),zt.dispose(),Rt.dispose(),K.dispose(),_t.dispose(),dt.dispose(),Ft.dispose(),vt.dispose(),Et.dispose(),Xt.dispose(),Xt.removeEventListener("sessionstart",S0),Xt.removeEventListener("sessionend",w0),fs.stop()};function ye(z){z.preventDefault(),H0("WebGLRenderer: Context Lost."),C=!0}function fe(){H0("WebGLRenderer: Context Restored."),C=!1;const z=X.autoReset,Y=$t.enabled,ot=$t.autoUpdate,nt=$t.needsUpdate,it=$t.type;Yt(),X.autoReset=z,$t.enabled=Y,$t.autoUpdate=ot,$t.needsUpdate=nt,$t.type=it}function Gn(z){ce("WebGLRenderer: A WebGL context could not be created. Reason: ",z.statusMessage)}function jn(z){const Y=z.target;Y.removeEventListener("dispose",jn),Xg(Y)}function Xg(z){$g(z),K.remove(z)}function $g(z){const Y=K.get(z).programs;Y!==void 0&&(Y.forEach(function(ot){Et.releaseProgram(ot)}),z.isShaderMaterial&&Et.releaseShaderCache(z))}this.renderBufferDirect=function(z,Y,ot,nt,it,Ut){Y===null&&(Y=Pt);const Gt=it.isMesh&&it.matrixWorld.determinantAffine()<0,Nt=Zg(z,Y,ot,nt,it);S.setMaterial(nt,Gt);let Vt=ot.index,qt=1;if(nt.wireframe===!0){if(Vt=ct.getWireframeAttribute(ot),Vt===void 0)return;qt=2}const ne=ot.drawRange,se=ot.attributes.position;let kt=ne.start*qt,ue=(ne.start+ne.count)*qt;Ut!==null&&(kt=Math.max(kt,Ut.start*qt),ue=Math.min(ue,(Ut.start+Ut.count)*qt)),Vt!==null?(kt=Math.max(kt,0),ue=Math.min(ue,Vt.count)):se!=null&&(kt=Math.max(kt,0),ue=Math.min(ue,se.count));const Le=ue-kt;if(Le<0||Le===1/0)return;Ft.setup(it,nt,Nt,ot,Vt);let Se,ge=Lt;if(Vt!==null&&(Se=St.get(Vt),ge=ht,ge.setIndex(Se)),it.isMesh)nt.wireframe===!0?(S.setLineWidth(nt.wireframeLinewidth*Zt()),ge.setMode(G.LINES)):ge.setMode(G.TRIANGLES);else if(it.isLine){let Ye=nt.linewidth;Ye===void 0&&(Ye=1),S.setLineWidth(Ye*Zt()),it.isLineSegments?ge.setMode(G.LINES):it.isLineLoop?ge.setMode(G.LINE_LOOP):ge.setMode(G.LINE_STRIP)}else it.isPoints?ge.setMode(G.POINTS):it.isSprite&&ge.setMode(G.TRIANGLES);if(it.isBatchedMesh)if(ut.get("WEBGL_multi_draw"))ge.renderMultiDraw(it._multiDrawStarts,it._multiDrawCounts,it._multiDrawCount);else{const Ye=it._multiDrawStarts,Bt=it._multiDrawCounts,nn=it._multiDrawCount,re=Vt?St.get(Vt).bytesPerElement:1,An=K.get(nt).currentProgram.getUniforms();for(let ti=0;ti<nn;ti++)An.setValue(G,"_gl_DrawID",ti),ge.render(Ye[ti]/re,Bt[ti])}else if(it.isInstancedMesh)ge.renderInstances(kt,Le,it.count);else if(ot.isInstancedBufferGeometry){const Ye=ot._maxInstanceCount!==void 0?ot._maxInstanceCount:1/0,Bt=Math.min(ot.instanceCount,Ye);ge.renderInstances(kt,Le,Bt)}else ge.render(kt,Le)};function b0(z,Y,ot,nt){I!==null&&z.isNodeMaterial&&I.setObject(nt,z),pt===!0&&Ot.setState(z,ot,!1),z.transparent===!0&&z.side===zi&&z.forceSinglePass===!1?(z.side=hn,z.needsUpdate=!0,Dr(z,Y,nt),z.side=Ds,z.needsUpdate=!0,Dr(z,Y,nt),z.side=zi):Dr(z,Y,nt)}this.compile=function(z,Y,ot=null){ot===null&&(ot=z),I!==null&&I.renderStart(z,Y,ot),w=Rt.get(ot),w.init(Y),M.push(w),ot.traverseVisible(function(it){it.isLight&&it.layers.test(Y.layers)&&(w.pushLight(it),it.castShadow&&w.pushShadow(it))}),z!==ot&&z.traverseVisible(function(it){it.isLight&&it.layers.test(Y.layers)&&(w.pushLight(it),it.castShadow&&w.pushShadow(it))}),w.setupLights(),I!==null&&I.updateLights(w.state.lightsArray),xt=this.localClippingEnabled,pt=Ot.init(this.clippingPlanes,xt),pt===!0&&Ot.setGlobalState(this.clippingPlanes,Y),I!==null&&$t.render(w.state.shadowsArray,ot,Y);const nt=new Set;return z.traverse(function(it){if(!(it.isMesh||it.isPoints||it.isLine||it.isSprite))return;const Ut=it.material;if(Ut)if(Array.isArray(Ut))for(let Gt=0;Gt<Ut.length;Gt++){const Nt=Ut[Gt];b0(Nt,ot,Y,it),nt.add(Nt)}else b0(Ut,ot,Y,it),nt.add(Ut)}),w=M.pop(),I!==null&&I.renderEnd(),nt},this.compileAsync=function(z,Y,ot=null){const nt=this.compile(z,Y,ot);return new Promise(it=>{function Ut(){if(nt.forEach(function(Gt){const Vt=K.get(Gt).currentProgram;(Vt===void 0||Vt.isReady())&&nt.delete(Gt)}),nt.size===0){it(z);return}setTimeout(Ut,10)}ut.get("KHR_parallel_shader_compile")!==null?Ut():setTimeout(Ut,10)})};let kl=null;function qg(z){kl&&kl(z)}function S0(){fs.stop()}function w0(){fs.start()}const fs=new sx;fs.setAnimationLoop(qg),typeof self<"u"&&fs.setContext(self),this.setAnimationLoop=function(z){kl=z,Xt.setAnimationLoop(z),z===null?fs.stop():fs.start()},Xt.addEventListener("sessionstart",S0),Xt.addEventListener("sessionend",w0),this.render=function(z,Y){if(Y!==void 0&&Y.isCamera!==!0){ce("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(C===!0)return;I!==null&&I.renderStart(z,Y);const ot=Xt.enabled===!0&&Xt.isPresenting===!0,nt=E!==null&&(F===null||ot)&&E.begin(A,F);if(z.matrixWorldAutoUpdate===!0&&z.updateMatrixWorld(),Y.parent===null&&Y.matrixWorldAutoUpdate===!0&&Y.updateMatrixWorld(),Xt.enabled===!0&&Xt.isPresenting===!0&&(E===null||E.isCompositing()===!1)&&(Xt.cameraAutoUpdate===!0&&Xt.updateCamera(Y),Y=Xt.getCamera()),z.isScene===!0&&z.onBeforeRender(A,z,Y,F),w=Rt.get(z,M.length),w.init(Y),w.state.textureUnits=tt.getTextureUnits(),M.push(w),yt.multiplyMatrices(Y.projectionMatrix,Y.matrixWorldInverse),lt.setFromProjectionMatrix(yt,ri,Y.reversedDepth),xt=this.localClippingEnabled,pt=Ot.init(this.clippingPlanes,xt),b=zt.get(z,T.length),b.init(),T.push(b),Xt.enabled===!0&&Xt.isPresenting===!0){const Gt=A.xr.getDepthSensingMesh();Gt!==null&&Wl(Gt,Y,-1/0,A.sortObjects)}Wl(z,Y,0,A.sortObjects),b.finish(),I!==null&&I.updateLights(w.state.lightsArray),A.sortObjects===!0&&b.sort(at,mt),bt=Xt.enabled===!1||Xt.isPresenting===!1||Xt.hasDepthSensing()===!1,bt&&Jt.addToRenderList(b,z),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),pt===!0&&Ot.beginShadows();const it=w.state.shadowsArray;if($t.render(it,z,Y),pt===!0&&Ot.endShadows(),(nt&&E.hasRenderPass())===!1){const Gt=b.opaque,Nt=b.transmissive;if(w.setupLights(),Y.isArrayCamera){const Vt=Y.cameras;if(Nt.length>0)for(let qt=0,ne=Vt.length;qt<ne;qt++){const se=Vt[qt];T0(Gt,Nt,z,se)}bt&&Jt.render(z);for(let qt=0,ne=Vt.length;qt<ne;qt++){const se=Vt[qt];E0(b,z,se,se.viewport)}}else Nt.length>0&&T0(Gt,Nt,z,Y),bt&&Jt.render(z),E0(b,z,Y)}F!==null&&N===0&&(tt.updateMultisampleRenderTarget(F),tt.updateRenderTargetMipmap(F)),nt&&E.end(A),z.isScene===!0&&z.onAfterRender(A,z,Y),Ft.resetDefaultState(),L=-1,B=null,M.pop(),M.length>0?(w=M[M.length-1],tt.setTextureUnits(w.state.textureUnits),pt===!0&&Ot.setGlobalState(A.clippingPlanes,w.state.camera)):w=null,T.pop(),T.length>0?b=T[T.length-1]:b=null,I!==null&&I.renderEnd()};function Wl(z,Y,ot,nt){if(z.visible===!1)return;if(z.layers.test(Y.layers)){if(z.isGroup)ot=z.renderOrder;else if(z.isLOD)z.autoUpdate===!0&&z.update(Y);else if(z.isLightProbeGrid)w.pushLightProbeGrid(z);else if(z.isLight)w.pushLight(z),z.castShadow&&w.pushShadow(z);else if(z.isSprite){if(!z.frustumCulled||z.intersectsFrustum(lt)){nt&&wt.setFromMatrixPosition(z.matrixWorld).applyMatrix4(yt);const Gt=dt.update(z),Nt=z.material;Nt.visible&&b.push(z,Gt,Nt,ot,wt.z,null,Y)}}else if((z.isMesh||z.isLine||z.isPoints)&&(!z.frustumCulled||z.intersectsFrustum(lt))){const Gt=dt.update(z),Nt=z.material;if(nt&&(z.boundingSphere!==void 0?(z.boundingSphere===null&&z.computeBoundingSphere(),wt.copy(z.boundingSphere.center)):(Gt.boundingSphere===null&&Gt.computeBoundingSphere(),wt.copy(Gt.boundingSphere.center)),wt.applyMatrix4(z.matrixWorld).applyMatrix4(yt)),Array.isArray(Nt)){const Vt=Gt.groups;for(let qt=0,ne=Vt.length;qt<ne;qt++){const se=Vt[qt],kt=Nt[se.materialIndex];kt&&kt.visible&&b.push(z,Gt,kt,ot,wt.z,se,Y)}}else Nt.visible&&b.push(z,Gt,Nt,ot,wt.z,null,Y)}}const Ut=z.children;for(let Gt=0,Nt=Ut.length;Gt<Nt;Gt++)Wl(Ut[Gt],Y,ot,nt)}function E0(z,Y,ot,nt){const{opaque:it,transmissive:Ut,transparent:Gt}=z;w.setupLightsView(ot),pt===!0&&Ot.setGlobalState(A.clippingPlanes,ot),nt&&S.viewport($.copy(nt)),it.length>0&&Ir(it,Y,ot),Ut.length>0&&Ir(Ut,Y,ot),Gt.length>0&&Ir(Gt,Y,ot),S.buffers.depth.setTest(!0),S.buffers.depth.setMask(!0),S.buffers.color.setMask(!0),S.setPolygonOffset(!1)}function T0(z,Y,ot,nt){if((ot.isScene===!0?ot.overrideMaterial:null)!==null)return;if(w.state.transmissionRenderTarget[nt.id]===void 0){const kt=ut.has("EXT_color_buffer_half_float")||ut.has("EXT_color_buffer_float");w.state.transmissionRenderTarget[nt.id]=new Kn(1,1,{generateMipmaps:!0,type:kt?ui:wn,minFilter:bs,samples:Math.max(4,R.samples),stencilBuffer:a,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:oe.workingColorSpace})}const Ut=w.state.transmissionRenderTarget[nt.id],Gt=nt.viewport||$;Ut.setSize(Gt.z*A.transmissionResolutionScale,Gt.w*A.transmissionResolutionScale);const Nt=A.getRenderTarget(),Vt=A.getActiveCubeFace(),qt=A.getActiveMipmapLevel();A.setRenderTarget(Ut),A.getClearColor(Tt),H=A.getClearAlpha(),H<1&&A.setClearColor(16777215,.5),A.clear(),bt&&Jt.render(ot);const ne=A.toneMapping;A.toneMapping=li;const se=nt.viewport;if(nt.viewport!==void 0&&(nt.viewport=void 0),w.setupLightsView(nt),pt===!0&&Ot.setGlobalState(A.clippingPlanes,nt),Ir(z,ot,nt),tt.updateMultisampleRenderTarget(Ut),tt.updateRenderTargetMipmap(Ut),ut.has("WEBGL_multisampled_render_to_texture")===!1){let kt=!1;for(let ue=0,Le=Y.length;ue<Le;ue++){const Se=Y[ue],{object:ge,geometry:Ye,material:Bt,group:nn}=Se;if(Bt.side===zi&&ge.layers.test(nt.layers)){const re=Bt.side;Bt.side=hn,Bt.needsUpdate=!0,A0(ge,ot,nt,Ye,Bt,nn),Bt.side=re,Bt.needsUpdate=!0,kt=!0}}kt===!0&&(tt.updateMultisampleRenderTarget(Ut),tt.updateRenderTargetMipmap(Ut))}A.setRenderTarget(Nt,Vt,qt),A.setClearColor(Tt,H),se!==void 0&&(nt.viewport=se),A.toneMapping=ne}function Ir(z,Y,ot){const nt=Y.isScene===!0?Y.overrideMaterial:null;for(let it=0,Ut=z.length;it<Ut;it++){const Gt=z[it],{object:Nt,geometry:Vt,group:qt}=Gt;let ne=Gt.material;ne.allowOverride===!0&&nt!==null&&(ne=nt),Nt.layers.test(ot.layers)&&A0(Nt,Y,ot,Vt,ne,qt)}}function A0(z,Y,ot,nt,it,Ut){I!==null&&it.isNodeMaterial&&I.setObject(z,it),z.onBeforeRender(A,Y,ot,nt,it,Ut),z.modelViewMatrix.multiplyMatrices(ot.matrixWorldInverse,z.matrixWorld),z.normalMatrix.getNormalMatrix(z.modelViewMatrix),it.onBeforeRender(A,Y,ot,nt,z,Ut),it.transparent===!0&&it.side===zi&&it.forceSinglePass===!1?(it.side=hn,it.needsUpdate=!0,A.renderBufferDirect(ot,Y,nt,it,z,Ut),it.side=Ds,it.needsUpdate=!0,A.renderBufferDirect(ot,Y,nt,it,z,Ut),it.side=zi):A.renderBufferDirect(ot,Y,nt,it,z,Ut),z.onAfterRender(A,Y,ot,nt,it,Ut)}function Dr(z,Y,ot){Y.isScene!==!0&&(Y=Pt);const nt=K.get(z),it=w.state.lights,Ut=w.state.shadowsArray,Gt=it.state.version,Nt=Et.getParameters(z,it.state,Ut,Y,ot,w.state.lightProbeGridArray),Vt=Et.getProgramCacheKey(Nt);let qt=nt.programs;nt.environment=z.isMeshStandardMaterial||z.isMeshLambertMaterial||z.isMeshPhongMaterial?Y.environment:null,nt.fog=Y.fog;const ne=z.isMeshStandardMaterial||z.isMeshLambertMaterial&&!z.envMap||z.isMeshPhongMaterial&&!z.envMap;nt.envMap=_t.get(z.envMap||nt.environment,ne),nt.envMapRotation=nt.environment!==null&&z.envMap===null?Y.environmentRotation:z.envMapRotation,qt===void 0&&(z.addEventListener("dispose",jn),qt=new Map,nt.programs=qt);let se=qt.get(Vt);if(se!==void 0){if(nt.currentProgram===se&&nt.lightsStateVersion===Gt)return R0(z,Nt),se}else Nt.uniforms=Et.getUniforms(z),I!==null&&z.isNodeMaterial&&I.build(z,ot,Nt),z.onBeforeCompile(Nt,A),se=Et.acquireProgram(Nt,Vt),qt.set(Vt,se),nt.uniforms=Nt.uniforms;const kt=nt.uniforms;return(!z.isShaderMaterial&&!z.isRawShaderMaterial||z.clipping===!0)&&(kt.clippingPlanes=Ot.uniform),R0(z,Nt),nt.needsLights=Jg(z),nt.lightsStateVersion=Gt,nt.needsLights&&(kt.ambientLightColor.value=it.state.ambient,kt.lightProbe.value=it.state.probe,kt.sunLights.value=it.state.sun,kt.sunLightShadows.value=it.state.sunShadow,kt.directionalLights.value=it.state.directional,kt.directionalLightShadows.value=it.state.directionalShadow,kt.spotLights.value=it.state.spot,kt.spotLightShadows.value=it.state.spotShadow,kt.rectAreaLights.value=it.state.rectArea,kt.ltc_1.value=it.state.rectAreaLTC1,kt.ltc_2.value=it.state.rectAreaLTC2,kt.pointLights.value=it.state.point,kt.pointLightShadows.value=it.state.pointShadow,kt.hemisphereLights.value=it.state.hemi,kt.sunShadowMatrix.value=it.state.sunShadowMatrix,kt.sunShadowCascade.value=it.state.sunShadowCascade,kt.directionalShadowMatrix.value=it.state.directionalShadowMatrix,kt.spotLightMatrix.value=it.state.spotLightMatrix,kt.spotLightMap.value=it.state.spotLightMap,kt.pointShadowMatrix.value=it.state.pointShadowMatrix),nt.lightProbeGrid=w.state.lightProbeGridArray.length>0,nt.currentProgram=se,nt.uniformsList=null,se}function z0(z){if(z.uniformsList===null){const Y=z.currentProgram.getUniforms();z.uniformsList=Dc.seqWithValue(Y.seq,z.uniforms)}return z.uniformsList}function R0(z,Y){const ot=K.get(z);ot.outputColorSpace=Y.outputColorSpace,ot.batching=Y.batching,ot.batchingColor=Y.batchingColor,ot.instancing=Y.instancing,ot.instancingColor=Y.instancingColor,ot.instancingMorph=Y.instancingMorph,ot.skinning=Y.skinning,ot.morphTargets=Y.morphTargets,ot.morphNormals=Y.morphNormals,ot.morphColors=Y.morphColors,ot.morphTargetsCount=Y.morphTargetsCount,ot.numClippingPlanes=Y.numClippingPlanes,ot.numIntersection=Y.numClipIntersection,ot.vertexAlphas=Y.vertexAlphas,ot.vertexTangents=Y.vertexTangents,ot.toneMapping=Y.toneMapping}function Yg(z,Y){if(z.length===0)return null;if(z.length===1)return z[0].texture!==null?z[0]:null;g.setFromMatrixPosition(Y.matrixWorld);for(let ot=0,nt=z.length;ot<nt;ot++){const it=z[ot];if(it.texture!==null&&it.boundingBox.containsPoint(g))return it}return null}function Zg(z,Y,ot,nt,it){Y.isScene!==!0&&(Y=Pt),tt.resetTextureUnits();const Ut=Y.fog,Gt=nt.isMeshStandardMaterial||nt.isMeshLambertMaterial||nt.isMeshPhongMaterial?Y.environment:null,Nt=F===null?A.outputColorSpace:F.isXRRenderTarget===!0?F.texture.colorSpace:oe.workingColorSpace,Vt=nt.isMeshStandardMaterial||nt.isMeshLambertMaterial&&!nt.envMap||nt.isMeshPhongMaterial&&!nt.envMap,qt=_t.get(nt.envMap||Gt,Vt),ne=nt.vertexColors===!0&&!!ot.attributes.color&&ot.attributes.color.itemSize===4,se=!!ot.attributes.tangent&&(!!nt.normalMap||nt.anisotropy>0),kt=!!ot.morphAttributes.position,ue=!!ot.morphAttributes.normal,Le=!!ot.morphAttributes.color;let Se=li;nt.toneMapped&&(F===null||F.isXRRenderTarget===!0)&&(Se=A.toneMapping);const ge=ot.morphAttributes.position||ot.morphAttributes.normal||ot.morphAttributes.color,Ye=ge!==void 0?ge.length:0,Bt=K.get(nt),nn=w.state.lights;if(pt===!0&&(xt===!0||z!==B)){const be=z===B&&nt.id===L;Ot.setState(nt,z,be)}let re=!1;nt.version===Bt.__version?(Bt.needsLights&&Bt.lightsStateVersion!==nn.state.version||Bt.outputColorSpace!==Nt||it.isBatchedMesh&&Bt.batching===!1||!it.isBatchedMesh&&Bt.batching===!0||it.isBatchedMesh&&Bt.batchingColor===!0&&it._colorsTexture===null||it.isBatchedMesh&&Bt.batchingColor===!1&&it._colorsTexture!==null||it.isInstancedMesh&&Bt.instancing===!1||!it.isInstancedMesh&&Bt.instancing===!0||it.isSkinnedMesh&&Bt.skinning===!1||!it.isSkinnedMesh&&Bt.skinning===!0||it.isInstancedMesh&&Bt.instancingColor===!0&&it.instanceColor===null||it.isInstancedMesh&&Bt.instancingColor===!1&&it.instanceColor!==null||it.isInstancedMesh&&Bt.instancingMorph===!0&&it.morphTexture===null||it.isInstancedMesh&&Bt.instancingMorph===!1&&it.morphTexture!==null||Bt.envMap!==qt||nt.fog===!0&&Bt.fog!==Ut||Bt.numClippingPlanes!==void 0&&(Bt.numClippingPlanes!==Ot.numPlanes||Bt.numIntersection!==Ot.numIntersection)||Bt.vertexAlphas!==ne||Bt.vertexTangents!==se||Bt.morphTargets!==kt||Bt.morphNormals!==ue||Bt.morphColors!==Le||Bt.toneMapping!==Se||Bt.morphTargetsCount!==Ye||!!Bt.lightProbeGrid!=w.state.lightProbeGridArray.length>0)&&(re=!0):(re=!0,Bt.__version=nt.version);let An=Bt.currentProgram;re===!0&&(An=Dr(nt,Y,it),I&&nt.isNodeMaterial&&I.onUpdateProgram(nt,An,Bt));let ti=!1,Vi=!1,na=!1;const xe=An.getUniforms(),Ce=Bt.uniforms;if(S.useProgram(An.program)&&(ti=!0,Vi=!0,na=!0),nt.id!==L&&(L=nt.id,Vi=!0),Bt.needsLights){const be=Yg(w.state.lightProbeGridArray,it);Bt.lightProbeGrid!==be&&(Bt.lightProbeGrid=be,Vi=!0)}if(ti||B!==z){S.buffers.depth.getReversed()&&z.reversedDepth!==!0&&(z._reversedDepth=!0,z.updateProjectionMatrix()),xe.setValue(G,"projectionMatrix",z.projectionMatrix),xe.setValue(G,"viewMatrix",z.matrixWorldInverse);const Wi=xe.map.cameraPosition;Wi!==void 0&&Wi.setValue(G,j.setFromMatrixPosition(z.matrixWorld)),R.logarithmicDepthBuffer&&xe.setValue(G,"logDepthBufFC",2/(Math.log(z.far+1)/Math.LN2)),(nt.isMeshPhongMaterial||nt.isMeshToonMaterial||nt.isMeshLambertMaterial||nt.isMeshBasicMaterial||nt.isMeshStandardMaterial||nt.isShaderMaterial)&&xe.setValue(G,"isOrthographic",z.isOrthographicCamera===!0),B!==z&&(B=z,Vi=!0,na=!0)}if(Bt.needsLights&&(nn.state.sunShadowMap.length>0&&xe.setValue(G,"sunShadowMap",nn.state.sunShadowMap,tt),nn.state.directionalShadowMap.length>0&&xe.setValue(G,"directionalShadowMap",nn.state.directionalShadowMap,tt),nn.state.spotShadowMap.length>0&&xe.setValue(G,"spotShadowMap",nn.state.spotShadowMap,tt),nn.state.pointShadowMap.length>0&&xe.setValue(G,"pointShadowMap",nn.state.pointShadowMap,tt)),it.isSkinnedMesh){xe.setOptional(G,it,"bindMatrix"),xe.setOptional(G,it,"bindMatrixInverse");const be=it.skeleton;be&&(be.boneTexture===null&&be.computeBoneTexture(),xe.setValue(G,"boneTexture",be.boneTexture,tt))}it.isBatchedMesh&&(xe.setOptional(G,it,"batchingTexture"),xe.setValue(G,"batchingTexture",it._matricesTexture,tt),xe.setOptional(G,it,"batchingIdTexture"),xe.setValue(G,"batchingIdTexture",it._indirectTexture,tt),xe.setOptional(G,it,"batchingColorTexture"),it._colorsTexture!==null&&xe.setValue(G,"batchingColorTexture",it._colorsTexture,tt));const ki=ot.morphAttributes;if((ki.position!==void 0||ki.normal!==void 0||ki.color!==void 0)&&Z.update(it,ot,An),(Vi||Bt.receiveShadow!==it.receiveShadow)&&(Bt.receiveShadow=it.receiveShadow,xe.setValue(G,"receiveShadow",it.receiveShadow)),(nt.isMeshStandardMaterial||nt.isMeshLambertMaterial||nt.isMeshPhongMaterial)&&nt.envMap===null&&Y.environment!==null&&(Ce.envMapIntensity.value=Y.environmentIntensity),Ce.dfgLUT!==void 0&&(Ce.dfgLUT.value=rS()),Vi){if(xe.setValue(G,"toneMappingExposure",A.toneMappingExposure),Bt.needsLights&&Kg(Ce,na),Ut&&nt.fog===!0&&At.refreshFogUniforms(Ce,Ut),At.refreshMaterialUniforms(Ce,nt,k,W,w.state.transmissionRenderTarget[z.id]),Bt.needsLights&&Bt.lightProbeGrid){const be=Bt.lightProbeGrid;Ce.probesSH.value=be.texture,Ce.probesMin.value.copy(be.boundingBox.min),Ce.probesMax.value.copy(be.boundingBox.max),Ce.probesResolution.value.copy(be.resolution)}Dc.upload(G,z0(Bt),Ce,tt)}if(nt.isShaderMaterial&&nt.uniformsNeedUpdate===!0&&(Dc.upload(G,z0(Bt),Ce,tt),nt.uniformsNeedUpdate=!1),nt.isSpriteMaterial&&xe.setValue(G,"center",it.center),xe.setValue(G,"modelViewMatrix",it.modelViewMatrix),xe.setValue(G,"normalMatrix",it.normalMatrix),xe.setValue(G,"modelMatrix",it.matrixWorld),nt.uniformsGroups!==void 0){const be=nt.uniformsGroups;for(let Wi=0,ia=be.length;Wi<ia;Wi++){const P0=be[Wi];vt.update(P0,An),vt.bind(P0,An)}}return An}function Kg(z,Y){z.ambientLightColor.needsUpdate=Y,z.lightProbe.needsUpdate=Y,z.sunLights.needsUpdate=Y,z.sunLightShadows.needsUpdate=Y,z.directionalLights.needsUpdate=Y,z.directionalLightShadows.needsUpdate=Y,z.pointLights.needsUpdate=Y,z.pointLightShadows.needsUpdate=Y,z.spotLights.needsUpdate=Y,z.spotLightShadows.needsUpdate=Y,z.rectAreaLights.needsUpdate=Y,z.hemisphereLights.needsUpdate=Y}function Jg(z){return z.isMeshLambertMaterial||z.isMeshToonMaterial||z.isMeshPhongMaterial||z.isMeshStandardMaterial||z.isShadowMaterial||z.isShaderMaterial&&z.lights===!0}this.getActiveCubeFace=function(){return V},this.getActiveMipmapLevel=function(){return N},this.getRenderTarget=function(){return F},this.setRenderTargetTextures=function(z,Y,ot){const nt=K.get(z);nt.__autoAllocateDepthBuffer=z.resolveDepthBuffer===!1,nt.__autoAllocateDepthBuffer===!1&&(nt.__useRenderToTexture=!1),K.get(z.texture).__webglTexture=Y,K.get(z.depthTexture).__webglTexture=nt.__autoAllocateDepthBuffer?void 0:ot,nt.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(z,Y){const ot=K.get(z);ot.__webglFramebuffer=Y,ot.__useDefaultFramebuffer=Y===void 0},this.setRenderTarget=function(z,Y=0,ot=0){F=z,V=Y,N=ot;let nt=null,it=!1,Ut=!1;if(z){const Nt=K.get(z);if(Nt.__useDefaultFramebuffer!==void 0){S.bindFramebuffer(G.FRAMEBUFFER,Nt.__webglFramebuffer),$.copy(z.viewport),J.copy(z.scissor),st=z.scissorTest,S.viewport($),S.scissor(J),S.setScissorTest(st),L=-1;return}else if(Nt.__webglFramebuffer===void 0)tt.setupRenderTarget(z);else if(Nt.__hasExternalTextures)tt.rebindTextures(z,K.get(z.texture).__webglTexture,K.get(z.depthTexture).__webglTexture);else if(z.depthBuffer){const ne=z.depthTexture;if(Nt.__boundDepthTexture!==ne){if(ne!==null&&K.has(ne)&&(z.width!==ne.image.width||z.height!==ne.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");tt.setupDepthRenderbuffer(z)}}const Vt=z.texture;(Vt.isData3DTexture||Vt.isDataArrayTexture||Vt.isCompressedArrayTexture)&&(Ut=!0);const qt=K.get(z).__webglFramebuffer;z.isWebGLCubeRenderTarget?(Array.isArray(qt[Y])?nt=qt[Y][ot]:nt=qt[Y],it=!0):z.samples>0&&tt.useMultisampledRTT(z)===!1?nt=K.get(z).__webglMultisampledFramebuffer:Array.isArray(qt)?nt=qt[ot]:nt=qt,$.copy(z.viewport),J.copy(z.scissor),st=z.scissorTest}else $.copy(rt).multiplyScalar(k).floor(),J.copy(Mt).multiplyScalar(k).floor(),st=Kt;if(ot!==0&&(nt=U),S.bindFramebuffer(G.FRAMEBUFFER,nt)&&S.drawBuffers(z,nt),S.viewport($),S.scissor(J),S.setScissorTest(st),it){const Nt=K.get(z.texture);G.framebufferTexture2D(G.FRAMEBUFFER,G.COLOR_ATTACHMENT0,G.TEXTURE_CUBE_MAP_POSITIVE_X+Y,Nt.__webglTexture,ot)}else if(Ut){const Nt=Y;for(let Vt=0;Vt<z.textures.length;Vt++){const qt=K.get(z.textures[Vt]);G.framebufferTextureLayer(G.FRAMEBUFFER,G.COLOR_ATTACHMENT0+Vt,qt.__webglTexture,ot,Nt)}}else if(z!==null&&ot!==0){const Nt=K.get(z.texture);G.framebufferTexture2D(G.FRAMEBUFFER,G.COLOR_ATTACHMENT0,G.TEXTURE_2D,Nt.__webglTexture,ot)}L=-1};function C0(z){const Y=K.get(z);return(Y.__readFormat!==z.format||Y.__readType!==z.type)&&(Y.__readFormat=z.format,Y.__readType=z.type,Y.__formatReadable=R.textureFormatReadable(z.format),Y.__typeReadable=R.textureTypeReadable(z.type)),Y}this.readRenderTargetPixels=function(z,Y,ot,nt,it,Ut,Gt,Nt=0){if(!(z&&z.isWebGLRenderTarget)){ce("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Vt=K.get(z).__webglFramebuffer;if(z.isWebGLCubeRenderTarget&&Gt!==void 0&&(Vt=Vt[Gt]),Vt){S.bindFramebuffer(G.FRAMEBUFFER,Vt);try{const qt=z.textures[Nt],ne=qt.format,se=qt.type;z.textures.length>1&&G.readBuffer(G.COLOR_ATTACHMENT0+Nt);const kt=C0(qt);if(kt.__formatReadable===!1){ce("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(kt.__typeReadable===!1){ce("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}Y>=0&&Y<=z.width-nt&&ot>=0&&ot<=z.height-it&&G.readPixels(Y,ot,nt,it,It.convert(ne),It.convert(se),Ut)}finally{const qt=F!==null?K.get(F).__webglFramebuffer:null;S.bindFramebuffer(G.FRAMEBUFFER,qt)}}},this.readRenderTargetPixelsAsync=async function(z,Y,ot,nt,it,Ut,Gt,Nt=0){if(!(z&&z.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Vt=K.get(z).__webglFramebuffer;if(z.isWebGLCubeRenderTarget&&Gt!==void 0&&(Vt=Vt[Gt]),Vt)if(Y>=0&&Y<=z.width-nt&&ot>=0&&ot<=z.height-it){S.bindFramebuffer(G.FRAMEBUFFER,Vt);const qt=z.textures[Nt],ne=qt.format,se=qt.type;z.textures.length>1&&G.readBuffer(G.COLOR_ATTACHMENT0+Nt);const kt=C0(qt);if(kt.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(kt.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const ue=G.createBuffer();G.bindBuffer(G.PIXEL_PACK_BUFFER,ue),G.bufferData(G.PIXEL_PACK_BUFFER,Ut.byteLength,G.STREAM_READ),G.readPixels(Y,ot,nt,it,It.convert(ne),It.convert(se),0),G.bindBuffer(G.PIXEL_PACK_BUFFER,null);const Le=F!==null?K.get(F).__webglFramebuffer:null;S.bindFramebuffer(G.FRAMEBUFFER,Le);const Se=G.fenceSync(G.SYNC_GPU_COMMANDS_COMPLETE,0);return G.flush(),await $1(G,Se,4),G.bindBuffer(G.PIXEL_PACK_BUFFER,ue),G.getBufferSubData(G.PIXEL_PACK_BUFFER,0,Ut),G.bindBuffer(G.PIXEL_PACK_BUFFER,null),G.deleteBuffer(ue),G.deleteSync(Se),Ut}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(z,Y=null,ot=0){const nt=Math.pow(2,-ot),it=Math.floor(z.image.width*nt),Ut=Math.floor(z.image.height*nt),Gt=Y!==null?Y.x:0,Nt=Y!==null?Y.y:0;tt.setTexture2D(z,0),G.copyTexSubImage2D(G.TEXTURE_2D,ot,0,0,Gt,Nt,it,Ut),S.unbindTexture()},this.copyTextureToTexture=function(z,Y,ot=null,nt=null,it=0,Ut=0){let Gt,Nt,Vt,qt,ne,se,kt,ue,Le;const Se=z.isCompressedTexture?z.mipmaps[Ut]:z.image;if(ot!==null)Gt=ot.max.x-ot.min.x,Nt=ot.max.y-ot.min.y,Vt=ot.isBox3?ot.max.z-ot.min.z:1,qt=ot.min.x,ne=ot.min.y,se=ot.isBox3?ot.min.z:0;else{const Ce=Math.pow(2,-it);Gt=Math.floor(Se.width*Ce),Nt=Math.floor(Se.height*Ce),z.isDataArrayTexture?Vt=Se.depth:z.isData3DTexture?Vt=Math.floor(Se.depth*Ce):Vt=1,qt=0,ne=0,se=0}nt!==null?(kt=nt.x,ue=nt.y,Le=nt.z):(kt=0,ue=0,Le=0);const ge=It.convert(Y.format),Ye=It.convert(Y.type);let Bt;Y.isData3DTexture?(tt.setTexture3D(Y,0),Bt=G.TEXTURE_3D):Y.isDataArrayTexture||Y.isCompressedArrayTexture?(tt.setTexture2DArray(Y,0),Bt=G.TEXTURE_2D_ARRAY):(tt.setTexture2D(Y,0),Bt=G.TEXTURE_2D),S.activeTexture(G.TEXTURE0),S.pixelStorei(G.UNPACK_FLIP_Y_WEBGL,Y.flipY),S.pixelStorei(G.UNPACK_PREMULTIPLY_ALPHA_WEBGL,Y.premultiplyAlpha),S.pixelStorei(G.UNPACK_ALIGNMENT,Y.unpackAlignment);const nn=S.getParameter(G.UNPACK_ROW_LENGTH),re=S.getParameter(G.UNPACK_IMAGE_HEIGHT),An=S.getParameter(G.UNPACK_SKIP_PIXELS),ti=S.getParameter(G.UNPACK_SKIP_ROWS),Vi=S.getParameter(G.UNPACK_SKIP_IMAGES);S.pixelStorei(G.UNPACK_ROW_LENGTH,Se.width),S.pixelStorei(G.UNPACK_IMAGE_HEIGHT,Se.height),S.pixelStorei(G.UNPACK_SKIP_PIXELS,qt),S.pixelStorei(G.UNPACK_SKIP_ROWS,ne),S.pixelStorei(G.UNPACK_SKIP_IMAGES,se);const na=z.isDataArrayTexture||z.isData3DTexture,xe=Y.isDataArrayTexture||Y.isData3DTexture;if(z.isDepthTexture){const Ce=K.get(z),ki=K.get(Y),be=K.get(Ce.__renderTarget),Wi=K.get(ki.__renderTarget);S.bindFramebuffer(G.READ_FRAMEBUFFER,be.__webglFramebuffer),S.bindFramebuffer(G.DRAW_FRAMEBUFFER,Wi.__webglFramebuffer);for(let ia=0;ia<Vt;ia++)na&&(G.framebufferTextureLayer(G.READ_FRAMEBUFFER,G.COLOR_ATTACHMENT0,K.get(z).__webglTexture,it,se+ia),G.framebufferTextureLayer(G.DRAW_FRAMEBUFFER,G.COLOR_ATTACHMENT0,K.get(Y).__webglTexture,Ut,Le+ia)),G.blitFramebuffer(qt,ne,Gt,Nt,kt,ue,Gt,Nt,G.DEPTH_BUFFER_BIT,G.NEAREST);S.bindFramebuffer(G.READ_FRAMEBUFFER,null),S.bindFramebuffer(G.DRAW_FRAMEBUFFER,null)}else if(it!==0||z.isRenderTargetTexture||K.has(z)){const Ce=K.get(z),ki=K.get(Y);S.bindFramebuffer(G.READ_FRAMEBUFFER,P),S.bindFramebuffer(G.DRAW_FRAMEBUFFER,O);for(let be=0;be<Vt;be++)na?G.framebufferTextureLayer(G.READ_FRAMEBUFFER,G.COLOR_ATTACHMENT0,Ce.__webglTexture,it,se+be):G.framebufferTexture2D(G.READ_FRAMEBUFFER,G.COLOR_ATTACHMENT0,G.TEXTURE_2D,Ce.__webglTexture,it),xe?G.framebufferTextureLayer(G.DRAW_FRAMEBUFFER,G.COLOR_ATTACHMENT0,ki.__webglTexture,Ut,Le+be):G.framebufferTexture2D(G.DRAW_FRAMEBUFFER,G.COLOR_ATTACHMENT0,G.TEXTURE_2D,ki.__webglTexture,Ut),it!==0?G.blitFramebuffer(qt,ne,Gt,Nt,kt,ue,Gt,Nt,G.COLOR_BUFFER_BIT,G.NEAREST):xe?G.copyTexSubImage3D(Bt,Ut,kt,ue,Le+be,qt,ne,Gt,Nt):G.copyTexSubImage2D(Bt,Ut,kt,ue,qt,ne,Gt,Nt);S.bindFramebuffer(G.READ_FRAMEBUFFER,null),S.bindFramebuffer(G.DRAW_FRAMEBUFFER,null)}else xe?z.isDataTexture||z.isData3DTexture?G.texSubImage3D(Bt,Ut,kt,ue,Le,Gt,Nt,Vt,ge,Ye,Se.data):Y.isCompressedArrayTexture?G.compressedTexSubImage3D(Bt,Ut,kt,ue,Le,Gt,Nt,Vt,ge,Se.data):G.texSubImage3D(Bt,Ut,kt,ue,Le,Gt,Nt,Vt,ge,Ye,Se):z.isDataTexture?G.texSubImage2D(G.TEXTURE_2D,Ut,kt,ue,Gt,Nt,ge,Ye,Se.data):z.isCompressedTexture?G.compressedTexSubImage2D(G.TEXTURE_2D,Ut,kt,ue,Se.width,Se.height,ge,Se.data):G.texSubImage2D(G.TEXTURE_2D,Ut,kt,ue,Gt,Nt,ge,Ye,Se);S.pixelStorei(G.UNPACK_ROW_LENGTH,nn),S.pixelStorei(G.UNPACK_IMAGE_HEIGHT,re),S.pixelStorei(G.UNPACK_SKIP_PIXELS,An),S.pixelStorei(G.UNPACK_SKIP_ROWS,ti),S.pixelStorei(G.UNPACK_SKIP_IMAGES,Vi),Ut===0&&Y.generateMipmaps&&G.generateMipmap(Bt),S.unbindTexture()},this.initRenderTarget=function(z){K.get(z).__webglFramebuffer===void 0&&tt.setupRenderTarget(z)},this.initTexture=function(z){z.isCubeTexture?tt.setTextureCube(z,0):z.isData3DTexture?tt.setTexture3D(z,0):z.isDataArrayTexture||z.isCompressedArrayTexture?tt.setTexture2DArray(z,0):tt.setTexture2D(z,0),S.unbindTexture()},this.resetState=function(){V=0,N=0,F=null,S.reset(),Ft.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return ri}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const n=this.getContext();n.drawingBufferColorSpace=oe._getDrawingBufferColorSpace(t),n.unpackColorSpace=oe._getUnpackColorSpace()}}const lS={zoom:1,u:.5,v:.5};function dS(e){return e.zoom<=1+1e-6}function Be(e){const{x0:t,W:n,D:i}=e,s=t+n;return{plants:[{x:t+.3,z:i-.22,hw:.2,hd:.2},{x:s-.35,z:3.5,hw:.2,hd:.2}],parasol:{x:s-1.4,z:i+1.9,hw:.05,hd:.05},palm:{x:s-.5,z:i+3.5,hw:.1,hd:.1},ramp:{x:s-2,z:i+3.6,hw:.6,hd:.35},doorMat:{x:e.door.x,z:i-.15,hw:.55,hd:.25},trees:[{x:t-.7,z:1,hw:.18,hd:.18},{x:t-.7,z:i*.45,hw:.18,hd:.18},{x:t-.7,z:i*.85,hw:.18,hd:.18},{x:t+n*.3,z:-.85,hw:.18,hd:.18},{x:t+n*.75,z:-.85,hw:.18,hd:.18}],terrace:{x:t+n/2,z:i+2.35,hw:n/2-.2,hd:2.15}}}const $u={dz:-.03,base:{w:.5,h:.03,d:.34,y:.56},lid:{w:.5,h:.34,d:.025,y:.57,back:.16,tilt:.2}},fS=.93,pi={bg:"#fdfbf7",grass:"#86c96f",dirt:"#9a6a45",floor:"#f6e7cf",wall:"#fffaf1",wallTop:"#f1e3c9",desk:"#e2b880",deskTop:"#f3d79e",island:"#2a9d8f",islandTop:"#fffaf0",ink:"#1d1a17",rug:"#ffd166",islandRug:"#bfe1f2",plant:"#5fb35a",screenOn:"#fdfbf7",screenOff:"#3a3530",terrace:"#ecd7ae",window:"#cfeaff",lampOn:"#ffe7a8",lamp:"#f1e3c9",neon:"#ffd166",hemi:["#ffffff","#e9dcc4",1.55],sun:["#fff4e0",1.9],pendants:!1},mi={bg:"#141211",grass:"#3f6b35",dirt:"#6e4a31",floor:"#7a6150",wall:"#4a3d33",wallTop:"#5c4b3e",desk:"#ad7f50",deskTop:"#c6966a",island:"#1f7a70",islandTop:"#ece2cf",ink:"#0d0b0a",rug:"#c99a2e",islandRug:"#3b5f7a",plant:"#3f8a3e",screenOn:"#fff2d6",screenOff:"#26221f",terrace:"#6b5a44",window:"#2c4a6b",lampOn:"#ffcf8a",lamp:"#e6d8bf",neon:"#ffd166",hemi:["#ffd9a8","#3a2c22",1.5],sun:["#a9b8e8",.7],pendants:!0},uS=e=>e?mi:pi,D={bean:["#f39a4c","#6cb4ee","#7cc26b","#9b8fe0","#ffd166","#2a9d8f","#f28c28","#5aa9a0"],mural:["#ffd166","#6cb4ee","#7cc26b","#9b8fe0","#f39a4c"],board:["#2b6cb0","#2a9d8f","#c07a21","#6b46c1"],flowers:["#ffd166","#f39a4c","#9b8fe0","#fffaf0"],trunk:"#7a4a2a",leaf:["#5fb35a","#4e9a48"],pot:"#f39a4c",crate:"#e8b86b",tape:"#c98a3a",dark:"#2b2d42",metal:"#c9ccd3",paper:"#fffaf0",paperShade:"#e9e2d4",orange:"#f28c28",pineapple:"#e9b44c",pineLeaf:"#3f8a3e",banana:"#ffd166",marker:"#2b6cb0",skate:"#f39a4c",wheel:"#3a3532",truck:"#c9ccd1",sweat:"#8fd3ff",steam:"#ffffff",cloud:"#9a958c",sunglasses:"#1d1a17",parasol:"#ffd166",chair:["#6cb4ee","#fffaf0"],ramp:"#9b8fe0",palmTrunk:"#a0673f",mat:"#f39a4c",coffee:"#2b2d42",coffeeLed:"#ffd166",gold:"#e9c46a",eclipse:"#4b3f7a",grey:"#9a958c",ink:"#1d1a17",glass:"#bfe1f2",bar:"#7cc26b"},tn=["#f39a4c","#6cb4ee","#7cc26b","#ffd166","#9b8fe0","#2a9d8f","#f28c28","#4f6d7a","#e9c46a","#5aa9a0"],hS=["#3d5a80","#2b2d42","#5c677d","#3d405b"],pS=["#f3d5b5","#e0ac7e","#c68b59","#8d5524","#ffdbac","#a0673f"],mS=["#2b2118","#4a3222","#7a4a2a","#d9a066","#1b1b1b","#9b8fe0"],xS=["cap","beanie","afro","bun","hair","headphones","capback","hair","beanie","cap"],ux="#1d1a17",rc="#1d1a17",gS="#3a2b26",_S="#f2b36b";function Re(e){let t=2166136261;for(let n=0;n<e.length;n++)t=Math.imul(t^e.charCodeAt(n),16777619);return t>>>0}function Fs(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let n=t;return n=Math.imul(n^n>>>15,n|1),n^=n+Math.imul(n^n>>>7,n|61),((n^n>>>14)>>>0)/4294967296}}function hx(e,t){const n=Re(e),i=(s,a)=>s[(n>>>a)%s.length];return{hoodie:t?ux:i(tn,0),pants:i(hS,4),skin:i(pS,2),hair:t?"#2b2118":i(mS,13),hatColor:i(tn,11),hat:t?"main":i(xS,7),phase:n%1e3/160}}function Ks(e,t,n,i){const{style:s,pal:a}=e,{base:o,lid:r}=$u;e.add(s.box(o.w,o.h,o.d),e.mat(D.metal),t,n,o.y,i);const c=new Wt;c.position.set(n,r.y,i+r.back),c.rotation.x=r.tilt,t.add(c),e.add(s.box(r.w,r.h,r.d),e.mat(D.metal),c,0,r.h/2,0);const l=s.material(a.screenOff,{emissive:a.screenOn,ei:0});return l.userData.live=!0,e.add(s.box(.44,.28,.01),l,c,0,r.h/2,-.016),l}function Js(e,t,n,i){const{style:s,pal:a}=e;e.add(s.box(.11,.025,.11),e.mat(a.lamp),t,n,.56,i),e.add(s.box(.025,.13,.025),e.mat(a.lamp),t,n,.635,i),e.add(s.box(.12,.06,.1),e.mat(a.lamp),t,n-.03,.725,i);const o=s.material(a.lamp,{emissive:a.lampOn,ei:0});return o.userData.live=!0,e.add(s.box(.08,.02,.06),o,t,n-.03,.69,i),o}function Qs(e,t,n,i,s,a){const o=new Wt;o.position.set(n,0,i),o.rotation.y=a,t.add(o),e.add(e.style.box(.42,.08,.42),e.mat(s),o,0,.32,0),e.add(e.style.box(.42,.42,.07),e.mat(s),o,0,.55,-.2),e.add(e.style.cylinder(.03,.3),e.mat(e.pal.ink),o,0,.15,0)}function qu(e,t){let n=null;for(const i of e)i.of||t.x<i.x0||t.x>i.x1||i.z0<t.z||(!n||i.z0<n.z0)&&(n=i);return n}function px(e,t){const n=new Map;return{style:e,pal:t,mat(i){let s=n.get(i);return s||(s=e.material(i),n.set(i,s)),s},add(i,s,a,o,r,c){const l=new we(i,s);return l.position.set(o,r,c),a.add(l),l}}}function js(e,t,n,i,s,a,o,r){const c=r??e.mat(a);e.add(e.style.box(o,o,.02),c,t,n-2.2*o,i+1.1*o,s),e.add(e.style.box(o,o,.02),c,t,n-2.2*o,i-1.1*o,s);for(let l=0;l<3;l++){const d=e.add(e.style.box(3.4*o,.8*o,.02),c,t,n+1.2*o,i,s);d.rotation.z=l*Math.PI/3+Math.PI/2}}function mn(e,t,n,i,s,a){return e.add(e.style.box(n.x1-n.x0,i,n.z1-n.z0),e.mat(a),t,(n.x0+n.x1)/2,s,(n.z0+n.z1)/2)}const Fn=e=>({x0:e.x-e.hw,x1:e.x+e.hw,z0:e.z-e.hd,z1:e.z+e.hd}),vS=[0,1,1,1,2,2,2,4,4,4,8],MS=(e,t)=>e[Math.min(t,e.length-1)];function Bs(e,t,n,i,s){const{style:a}=e,o=new Wt;if(o.position.set(n,0,i),o.scale.setScalar(s),t.add(o),a.name==="clay"){e.add(a.cylinder(.14,1.3),e.mat(D.trunk),o,0,.65,0),[[0,1.75,0,.62],[.42,1.45,.1,.45],[-.38,1.5,-.1,.48]].forEach(([l,d,f,u],h)=>e.add(a.ball(u),e.mat(D.leaf[h%2]??D.trunk),o,l,d,f));return}e.add(a.box(.36,1.4,.36),e.mat(D.trunk),o,0,.7,0),[[0,1.6,0],[.45,1.5,0],[-.45,1.5,0],[0,2.05,0],[0,1.6,.45]].forEach(([c,l,d],f)=>e.add(a.box(.75,.75,.75),e.mat(D.leaf[f%2]??D.trunk),o,c,l,d))}function Qc(e,t,n,i){e.add(e.style.cylinder(.2,.36),e.mat(D.pot),t,n,.18,i);for(let s=0;s<3;s++){const a=e.add(e.style.ball(.26-s*.04),e.mat(s%2?D.leaf[0]:e.pal.plant),t,n+(s-1)*.12,.55+s*.22,i+s%2*.08);a.scale.y=1.2}}function yS(e,t,n,i,s){const a=e.add(e.style.ball(.11),e.mat(D.pineapple),t,n,i+.1,s);a.scale.y=1.45,e.add(e.style.box(.08,.16,.08),e.mat(D.pineLeaf),t,n,i+.3,s)}function jc(e,t,n,i){e.add(e.style.box(.5,.12,.5),e.mat(D.paper),t,n,.76,i),[D.orange,D.orange,D.banana,D.leaf[0]].forEach((a,o)=>e.add(e.style.ball(.09),e.mat(a),t,n+Math.cos(o*1.7)*.13,.86,i+Math.sin(o*1.7)*.12)),yS(e,t,n+.05,.84,i-.02)}function mx(e,t,n){const{style:i}=e,s=i.pictureZ;e.add(i.box(1.8,.95,.05),e.mat("#d8d2c6"),t,n,1.05,.02+s),e.add(i.box(1.7,.85,.02),e.mat(D.paper),t,n,1.05,.05+s);const a=Fs(Re("board"));for(let r=0;r<5;r++){const c=.5+a()*.7,l=D.board[r%D.board.length]??D.marker;e.add(i.box(c,.045,.01),e.mat(l),t,n-.78+c/2+r%2*.08,1.37-r*.15,.065+s)}const o=[[.45,.72],[.55,.88],[.65,.8],[.75,1.02]];for(const[r,c]of o)e.add(i.box(.06,.06,.01),e.mat(D.mat),t,n+(r??0),c??0,.065+s)}function xx(e,t,n,i){const{style:s}=e,a=i-n;D.mural.forEach((o,r)=>{const c=a/4;e.add(s.box(c,.45+r%2*.12,.02),e.mat(o),t,n+c/2+r*(a-c)/4,1.15+(r%2?-.06:.08),.01+s.pictureZ)}),js(e,t,(n+i)/2,1.18,.035+s.pictureZ,e.pal.ink,.07)}function gx(e,t,n){e.add(e.style.box(.55,.28,.2),e.mat(D.dark),t,0,.84,n);for(const i of[-.15,.15])e.add(e.style.box(.14,.14,.02),e.mat(D.wheel),t,i,.84,n+.11)}function Yu(e){const t=e.lounge.map(n=>n.x);return t.length?{l0:Math.min(...t)-.55,l1:Math.max(...t)+.55}:{l0:e.x0+.1,l1:e.x0+e.W*.4}}const Pl=e=>e.boardSpots.length?e.boardSpots.reduce((t,n)=>t+n.x,0)/e.boardSpots.length:e.x0+e.W/2,Zu=.55,_x=e=>({x:Pl(e)+.9+.25+Zu/2,z:.3});function _s(e,t){const n=Be(e),{l0:i,l1:s}=Yu(e),a=e.x0+e.W,o=e.island,r=[e.door,n.plants[0]??e.door,{x:0,z:o.z0+1.3},{x:(i+s)/2,z:1.5},{x:Pl(e),z:.9},{x:(i+s)/2,z:.6},{x:0,z:o.z1-.8},n.parasol,n.trees[1]??e.door,n.ramp,{x:e.x0-1.9,z:e.D*.55},_x(e),{x:e.x0-1.9,z:e.D+2.2},{x:a+1.2,z:1.2},{x:e.x0-1.9,z:1.4}];return r[Math.min(t,r.length-1)]??e.door}function xr(e,t){const n=e.island.z1-e.island.z0;return t<2?Math.min(n,1.2):t<6?Math.min(n,3.5):n}function gr(e){const{k:t,o:n,grow:i}=e,{style:s,pal:a}=t,o=x=>e.stage(x),r=o(0);if(!r)return;const c=n.furniture,{l0:l,l1:d}=Yu(n),f=n.lounge.map(x=>x.z),u=o(3);u&&f.length&&t.add(s.box(d-l,.02,Math.max(...f)-Math.min(...f)+1.1),t.mat(a.rug),u,(l+d)/2,.035,(Math.min(...f)+Math.max(...f))/2);const h=x=>x.of!==void 0&&n.lounge.some(p=>p.x===x.of?.x&&p.z===x.of.z),m=c.filter(h),_=yl(i.stage);m.forEach((x,p)=>{if(p>=_)return;const v=p<2?3:p<4?5:8;t.add(s.ball((x.x1-x.x0)/2/1.05/.92),t.mat(D.bean[p%D.bean.length]??a.rug),o(v)??r,(x.x0+x.x1)/2,.2,(x.z0+x.z1)/2).scale.set(1.05,.62,1.05)})}function bS(e){const{k:t,o:n,grow:i}=e,{style:s,pal:a}=t,o=n.furniture,r=L=>e.stage(L),c=Be(n),{x0:l,W:d,D:f}=n,u=l+d,h=n.island,m=r(0);if(!m)return;const _=r(1);_&&mn(t,_,Fn(c.terrace),.08,0,a.terrace);const x=L=>L.of!==void 0&&n.terrace.some(B=>B.x===L.of?.x&&B.z===L.of.z),p=o.filter(x),v=MS(vS,i.stage);p.forEach((L,B)=>{if(B>=v)return;const $=[1,4,7,7,10,10,10,10][B]??0;Dl(t,r($)??m,L,D.chair[B%2]??D.paper)});const y=r(1);y&&c.plants[0]&&Qc(t,y,c.plants[0].x,c.plants[0].z);const g=.75+i.garden*.06,b=r(2);if(b){jc(t,b,0,h.z0+1.3);const L=c.trees[0];L&&Bs(t,b,L.x,L.z,g)}const{l0:w,l1:T}=Yu(n),M=r(4);M&&(mx(t,M,Pl(n)),c.plants[1]&&Qc(t,M,c.plants[1].x,c.plants[1].z));const E=r(5);E&&(xx(t,E,w+.15,T-.15),gx(t,E,h.z0+xr(n,i.stage)-.6));const A=r(6);if(A){h.z1-h.z0>3&&jc(t,A,0,h.z0+2.9);const L=Fs(Re(`flowers${d}`));for(let B=0;B<10;B++){const $=L()<.5?l-.35-L()*.6:u+.35+L()*.6;t.add(s.box(.16,.16,.16),t.mat(D.flowers[B%4]??D.paper),A,$,.06,L()*(f+3))}}const C=r(7);if(C){const L=c.parasol;t.add(s.cylinder(.03,1.8),t.mat(a.ink),C,L.x,.9,L.z),t.add(s.box(1.4,.3,1.4),t.mat(D.parasol),C,L.x,1.85,L.z);const B=c.palm;t.add(s.box(.16,1.6,.16),t.mat(D.palmTrunk),C,B.x,.8,B.z);for(let $=0;$<4;$++){const J=t.add(s.box(.9,.04,.22),t.mat(D.leaf[0]),C,B.x,1.62,B.z);J.rotation.y=$*Math.PI/2+.4}}const I=r(8);if(I)for(const L of c.trees.slice(1))Bs(t,I,L.x,L.z,g);const U=r(9);U&&mn(t,U,Fn(c.ramp),.3,.15,D.ramp);const P=r(10);if(P){const L=_s(n,10);t.add(s.cylinder(.72,.25),t.mat("#d8d2c6"),P,L.x,.12,L.z),t.add(s.cylinder(.6,.05),s.material("#8fd3ff",{emissive:"#8fd3ff",ei:.15}),P,L.x,.26,L.z),t.add(s.cylinder(.13,.6),t.mat("#d8d2c6"),P,L.x,.5,L.z),t.add(s.ball(.12),t.mat("#8fd3ff"),P,L.x,.85,L.z)}const O=r(11);if(O){const L=_s(n,11);t.add(s.box(Zu,1.1,.45),t.mat(D.ramp),O,L.x,.55,L.z),t.add(s.box(.45,.32,.03),s.material(D.dark,{emissive:"#6cb4ee",ei:.5}),O,L.x,.82,L.z+.24),t.add(s.box(.5,.06,.25),t.mat(D.dark),O,L.x,.6,L.z+.28)}const V=r(12);if(V){const L=_s(n,12),B=t.add(s.cylinder(1,.04),t.mat("#6cb4ee"),V,L.x,0,L.z);B.scale.z=.7,t.add(s.box(.9,.06,.35),t.mat("#c49a6c"),V,L.x+.7,.06,L.z-.2);for(let $=0;$<3;$++)t.add(s.ball(.1),t.mat(D.leaf[0]),V,L.x-.5+$*.35,.04,L.z+.3-$*.2)}const N=r(13);if(N){const L=_s(n,13),B=2.3;t.add(s.ball(.6),t.mat(D.parasol),N,L.x,B,L.z),js(t,N,L.x,B,L.z+.62,t.pal.ink,.05),t.add(s.box(.35,.25,.35),t.mat("#c49a6c"),N,L.x,B-1,L.z);for(const $ of[-.15,.15])t.add(s.cylinder(.01,.5),t.mat(D.ink),N,L.x+$,B-.65,L.z)}const F=r(14);if(F){const L=_s(n,14),B=s.material(D.gold,{emissive:D.gold,ei:.15});t.add(s.box(.7,.4,.7),t.mat("#d8d2c6"),F,L.x,.2,L.z),t.add(s.capsule(.22,.25),B,F,L.x,.85,L.z),t.add(s.ball(.22),B,F,L.x,1.32,L.z)}Ll(t,m,n,i),SS(t,m,n,i),i.building&&i.stage<14&&Il(t,m,_s(n,i.stage+1))}function Ll(e,t,n,i){if(i.garden===0)return;const s=Fs(Re(`garden${n.W}`)),a=.9+i.garden*.12;for(let o=0;o<i.garden*4;o++){const c=s()<.5?n.x0-.3-s()*a:n.x0+n.W+.3+s()*a;e.add(e.style.box(.14,.14,.14),e.mat(D.flowers[o%4]??D.paper),t,c,.06,-.6+s()*(n.D+4.5))}}function SS(e,t,n,i){if(i.frames===0)return;const{style:s}=e,a=.36,o=i.stage>=11?_x(n).x+Zu/2+.1:Pl(n)+1.1,r=n.mainDesk.x-.5,c=Math.max(1,Math.floor((r-o)/a)),l=e.mat(i.golden?D.gold:D.crate);for(let d=0;d<i.frames;d++){const f=d%c,u=Math.floor(d/c),h=o+a/2+f*a,m=1.45-u*.32;if(m<.6)break;e.add(s.box(.28,.22,.02),l,t,h,m,.02+s.pictureZ),e.add(s.box(.22,.16,.01),e.mat(D.mural[d%D.mural.length]??D.paper),t,h,m,.035+s.pictureZ)}}function Il(e,t,n){const{style:i}=e;for(const[s,a]of[[-.5,-.4],[.5,-.4],[-.5,.4],[.5,.4]])e.add(i.cylinder(.08,.28),e.mat(D.orange),t,n.x+s,.14,n.z+a),e.add(i.cylinder(.12,.03),e.mat(D.orange),t,n.x+s,.015,n.z+a);for(let s=0;s<4;s++)e.add(i.box(.26,.12,.05),e.mat(s%2?D.paper:D.parasol),t,n.x-.39+s*.26,.32,n.z+.45);for(const s of[-.5,.5])e.add(i.box(.04,.32,.04),e.mat(D.ink),t,n.x+s,.16,n.z+.45)}const pe={seat:.24,tilt:.6,back:.54,cloth:.05,rail:.04};function Dl(e,t,n,i){const{style:s,pal:a}=e,o=(n.x0+n.x1)/2,r=n.x1-n.x0-.04,c=e.mat(a.desk),l=e.mat(i),d=n.z0+.42,f=n.z1-d;e.add(s.box(r,pe.cloth,f),l,t,o,pe.seat-pe.cloth/2,d+f/2);const u=e.add(s.box(r,pe.cloth,pe.back),l,t,o,0,0),h=Math.cos(pe.tilt),m=Math.sin(pe.tilt);u.rotation.x=pe.tilt,u.position.set(o,pe.seat-pe.cloth/2+pe.back/2*m,d-pe.back/2*h);const _=pe.seat-pe.cloth;for(const x of[-1,1]){const p=o+x*(r/2-pe.rail/2);e.add(s.box(pe.rail,pe.rail,f),c,t,p,_-pe.rail/2,d+f/2),e.add(s.box(pe.rail,_,pe.rail),c,t,p,_/2,n.z1-pe.rail),e.add(s.box(pe.rail,_,pe.rail),c,t,p,_/2,d);const v=pe.seat+(pe.back-.12)*m-pe.cloth;e.add(s.box(pe.rail,v,pe.rail),c,t,p,v/2,d-(pe.back-.12)*h)}}function wS({k:e,root:t,o:n,grow:i}){const{style:s,pal:a}=e,{x0:o,W:r,D:c}=n,l=o+r/2,d=new we(s.box(r,.14,c),s.floor(a.floor,r,c));d.position.set(l,-.05,c/2),t.add(d);const f=n.island,u=xr(n,i.stage);e.add(s.box(f.x1-f.x0+1.6,.02,u+1.2),e.mat(a.islandRug),t,(f.x0+f.x1)/2,.03,f.z0+u/2);const h=1.7;e.add(s.box(r+.2,h,.2),e.mat(a.wall),t,l,h/2,-.1),e.add(s.box(.2,1,c+.2),e.mat(a.wall),t,o-.1,.5,c/2);const m=s.material(a.window,{emissive:a.window,ei:a.pendants?.4:0});for(let _=(n.desks.size>0?Math.min(...[...n.desks.values()].map(x=>x.z)):4.3)+.1;_<c-1;_+=2.3)e.add(s.box(.05,.45,1.2),m,t,o,.62,_+.6);mn(e,t,Fn(Be(n).doorMat),.04,.03,D.mat)}function ES({k:e,root:t,o:n}){const{style:i,pal:s}=e,a=n.mainDesk,o=qu(n.furniture,a)??{x0:a.x-1.15,x1:a.x+1.15,z0:a.z+.1,z1:a.z+1.1},r=(o.x0+o.x1)/2,c=(o.z0+o.z1)/2,l=new Wt;l.position.set(r,0,c),t.add(l);const d=o.x1-o.x0,f=o.z1-o.z0;e.add(i.box(d-.1,.5,f-.1),e.mat(s.desk),l,0,.25,0),e.add(i.box(d,.06,f),e.mat(s.deskTop),l,0,.52,0);const u=Ks(e,l,a.x-r+.2,$u.dz),h=Js(e,l,d/2-.2,f/2-.2);e.add(i.box(.7,.06,.5),e.mat(s.wallTop),l,-d/2+.5,.58,0),e.add(i.box(.34,.24,.26),e.mat(D.crate),l,-d/2+.5,.73,0),Qs(e,t,a.x,a.z-.05,D.dark,a.face);const m=i.material(s.neon,{flat:!0});return js(e,t,a.x,1.25,.02+i.pictureZ,s.neon,.06,m),{screen:u,lamp:h,top:{x:r,y:.55,z:c}}}function TS({k:e,root:t,o:n,grow:i}){const{style:s,pal:a}=e,o=n.island,r=(o.x0+o.x1)/2,c=(o.z0+o.z1)/2,l=n.furniture.find(f=>!f.of&&f.x0<r&&f.x1>r&&f.z0<c&&f.z1>c)??o,d={...l,z1:Math.min(l.z1,l.z0+xr(n,i.stage)+.15)};if(e.add(s.box(d.x1-d.x0-.2,.62,d.z1-d.z0-.15,.2),e.mat(a.island),t,r,.31,(d.z0+d.z1)/2),mn(e,t,d,.07,.66,a.islandTop),e.add(s.box(.5,.5,.42),e.mat(D.coffee),t,r,.95,o.z0+.35),e.add(s.box(.18,.06,.04),s.material(D.coffeeLed,{emissive:D.coffeeLed,ei:.5}),t,r,1.07,o.z0+.57),a.pendants)for(let f=o.z0+.9;f<d.z1;f+=1.8){const u=new Xu("#ffcf8a",3.2,4.5,1.6);u.position.set(r,1.5,f),t.add(u)}}function AS({k:e,root:t,o:n},i,s){const a=qu(n.furniture,i)??{x0:i.x-.8,x1:i.x+.8,z0:i.z+.11,z1:i.z+.89},{style:o,pal:r}=e,c=Re(s),l=a.x1-a.x0,d=a.z1-a.z0,f=(a.x0+a.x1)/2,u=(a.z0+a.z1)/2,h=new Wt;h.position.set(f,0,u),t.add(h),e.add(o.box(l-.1,.5,d-.08,.12),e.mat(r.desk),h,0,.25,0),e.add(o.box(l,.06,d,.03),e.mat(r.deskTop),h,0,.52,0),e.add(o.box(.22,.08,.02),e.mat(tn[c%tn.length]??r.desk),h,-l/3,.4,d/2-.03);const m=Ks(e,h,i.x-f,$u.dz),_=Js(e,h,l/2-.18,d/2-.17);return Qs(e,t,i.x,i.z-.05,tn[(c>>5)%tn.length]??r.desk,i.face),c%3===0&&e.add(o.cylinder(.06,.12),e.mat(D.paper),h,.42,.61,-.2),c%4===1&&(e.add(o.cylinder(.08,.12),e.mat(D.pot),h,-.55,.61,-.1),e.add(o.ball(.12),e.mat(r.plant),h,-.55,.76,-.1)),c%5===2&&e.add(o.ball(.07),e.mat(D.orange),h,.4,.62,.12),{screen:m,lamp:_,top:{x:f,y:.55,z:u}}}const Wf={id:"loft",pal:uS,shell:wS,island:TS,lounge:gr,desk:AS,mainDesk:e=>ES(e),tree:({k:e},t,n,i,s)=>{Bs(e,t,n,i,s)},growth:bS,pieceAt:_s};function Na(e,t){const n=parseInt(e.slice(1),16);return`#${[n>>16&255,n>>8&255,n&255].map(s=>Math.max(0,Math.min(255,Math.round(s*t)))).map(s=>s.toString(16).padStart(2,"0")).join("")}`}const zS=["floor","wall","wallTop","desk","deskTop","island","islandTop","terrace","grass","dirt","rug","islandRug","plant"];function ja(e,t={}){const n={...pi,...e},i={};for(const a of zS)e[a]!==void 0&&(i[a]=Na(n[a],.62));const s={...mi,...i,...t};return a=>a?s:n}const vx=(e,t)=>({x:e.x+t*Math.sin(e.face),z:e.z+t*Math.cos(e.face)});function _r(e,t,n,i={}){const{k:s,root:a}=e,{style:o,pal:r}=s,c=i.w??1.5,l=i.d??.7,d=i.at??.5,f=Re(n),u=new Wt;u.position.set(t.x,0,t.z),u.rotation.y=t.face,a.add(u),s.add(o.box(c-.1,.5,l-.08,.12),s.mat(r.desk),u,0,.25,d),s.add(o.box(c,.06,l,.03),s.mat(r.deskTop),u,0,.52,d),s.add(o.box(.22,.08,.02),s.mat(tn[f%tn.length]??r.desk),u,-c/3,.4,d-l/2+.03);const h=Ks(s,u,0,d-.03),m=Js(s,u,c/2-.18,d+l/2-.17);i.chair!==!1&&Qs(s,u,0,-.05,tn[(f>>5)%tn.length]??r.desk,0),i.extra?.(u,f);const _=vx(t,d);return{screen:h,lamp:m,top:{x:_.x,y:.55,z:_.z}}}function to(e,t,n,i={}){const{k:s,root:a}=e,{style:o,pal:r}=s,c=(t.x0+t.x1)/2,l=(t.z0+t.z1)/2,d=t.x1-t.x0,f=t.z1-t.z0,u=new Wt;u.position.set(c,0,l),a.add(u),s.add(o.box(d-.1,.5,f-.1),s.mat(r.desk),u,0,.25,0),s.add(o.box(d,.06,f),s.mat(r.deskTop),u,0,.52,0);const h=Ks(s,u,n.x-c+.2,-.03),m=Js(s,u,d/2-.2,f/2-.2);return s.add(o.box(.7,.06,.5),s.mat(r.wallTop),u,-d/2+.5,.58,0),s.add(o.box(.34,.24,.26),s.mat(D.crate),u,-d/2+.5,.73,0),Qs(s,a,n.x,n.z-.05,D.dark,n.face),js(s,a,i.x??n.x,i.y??1.25,(i.z??.02)+o.pictureZ,r.neon,.06,o.material(r.neon,{flat:!0})),{screen:h,lamp:m,top:{x:c,y:.55,z:l}}}const eo=(e,t)=>e.furniture.find(n=>!n.of&&t.x>n.x0&&t.x<n.x1&&t.z>n.z0&&t.z<n.z1),RS=[0,1,1,1,2,2,2,4,4,4,8],CS=(e,t)=>e[Math.min(t,e.length-1)];function Ku(e,t){const{o:n,grow:i}=e,s=e.stage(0);if(!s)return;const a=yl(i.stage);n.lounge.forEach((o,r)=>{if(r>=a)return;const c=n.furniture.find(l=>l.of&&l.of.x===o.x&&l.of.z===o.z);c&&t(e.k,e.stage(r<2?3:r<4?5:8)??s,c,r)})}function ta(e){return(t,n)=>n<=0?t.door:e.pieces[Math.min(n,e.pieces.length-1)]?.at(t)??t.door}function no(e,t){const{k:n,o:i,grow:s}=e,a=e.stage(0);if(!a)return;const o=Be(i),r=e.stage(1);r&&mn(n,r,Fn(o.terrace),.08,0,n.pal.terrace);const c=i.furniture.filter(u=>u.of!==void 0&&i.terrace.some(h=>h.x===u.of?.x&&h.z===u.of.z)),l=CS(RS,s.stage);c.forEach((u,h)=>{h>=l||Dl(n,e.stage([1,4,7,7,10,10,10,10][h]??0)??a,u,D.chair[h%2]??D.paper)});for(let u=1;u<t.pieces.length&&u<=s.stage;u++){const h=t.pieces[u],m=e.stage(u);h&&m&&h.draw(n,m,h.at(i),e)}const d=.75+s.garden*.06;o.trees.forEach((u,h)=>{const m=e.stage(h===0?2:8);m&&t.tree(n,m,u.x,u.z,d,h)});const f=e.stage(6);if(f){const u=Fs(Re(`flowers${String(i.W)}`)),h=t.flowers??D.flowers;for(let m=0;m<10;m++){const _=u()<.5?i.x0-.35-u()*.6:i.x0+i.W+.35+u()*.6;n.add(n.style.box(.16,.16,.16),n.mat(h[m%h.length]??D.paper),f,_,.06,u()*(i.D+3))}}Ll(n,a,i,s),PS(n,a,i,s,t),s.building&&s.stage<14&&Il(n,a,ta(t)(i,s.stage+1))}function PS(e,t,n,i,s){if(i.frames===0)return;const a=s.frameSpan(n),{xb:o,y:r,z:c}=a,l=i.stage>=11?s.pieces[11]?.at(n):void 0,d=l&&l.z<1&&l.x+Go/2>a.xa&&l.x-Go/2<o?Math.max(a.xa,l.x+Go/2+.1):a.xa,f=.36,u=Math.max(1,Math.floor((o-d)/f));for(let h=0;h<i.frames;h++){const m=r-Math.floor(h/u)*.32;if(m<.6)break;s.frame(e,t,d+f/2+h%u*f,m,c,h,i.golden)}}function Mx(e,t){return(n,i,s,a,o,r,c)=>{n.add(n.style.box(.28,.22,.02),n.mat(c?D.gold:e),i,s,a,o+n.style.pictureZ),n.add(n.style.box(.22,.16,.01),n.mat(t[r%t.length]??D.paper),i,s,a,o+.015+n.style.pictureZ)}}function yx(e,t,n,i,s,a){const r=e.add(e.style.ball(.6),e.mat(s[0]??D.parasol),t,n,2.3,i);r.scale.y=1.15,s[1]&&e.add(e.style.cylinder(.61,.18),e.mat(s[1]),t,n,2.3,i).scale.set(1,1,1),js(e,t,n,2.3,i+.62,a,.05),e.add(e.style.box(.35,.25,.35),e.mat("#c49a6c"),t,n,2.3-1,i);for(const c of[-.15,.15])e.add(e.style.cylinder(.01,.5),e.mat(D.ink),t,n+c,2.3-.65,i)}function Nl(e,t,n,i,s){e.add(e.style.box(.7,.4,.7),e.mat("#d8d2c6"),t,n,.2,i),s(e.style.material(D.gold,{emissive:D.gold,ei:.15}),.4)}const Xf=e=>e.boardSpots.length?e.boardSpots.reduce((t,n)=>t+n.x,0)/e.boardSpots.length:e.x0+e.W/2,sn=(e,t=()=>{})=>({at:e,draw:t});function Ju(e){const t=n=>Be(n);return{pieces:[sn(n=>n.door),sn(n=>t(n).plants[0]??n.door,(n,i,s)=>{Qc(n,i,s.x,s.z)}),sn(e.fruit,(n,i,s)=>{jc(n,i,s.x,s.z)}),sn(e.nap),sn(n=>({x:Xf(n),z:.9}),(n,i,s,a)=>{mx(n,i,s.x);const o=t(a.o).plants[1];o&&Qc(n,i,o.x,o.z)}),sn(e.boombox,(n,i,s,a)=>{const[o,r]=e.mural(a.o);xx(n,i,o,r);const c=new Wt;c.position.x=s.x,i.add(c),gx(n,c,s.z)}),sn(e.fruit2,(n,i,s)=>{jc(n,i,s.x,s.z)}),sn(n=>t(n).parasol,(n,i,s,a)=>{const o=t(a.o);n.add(n.style.cylinder(.03,1.8),n.mat(n.pal.ink),i,o.parasol.x,.9,o.parasol.z),n.add(n.style.box(1.4,.3,1.4),n.mat(D.parasol),i,o.parasol.x,1.85,o.parasol.z),n.add(n.style.box(.16,1.6,.16),n.mat(D.palmTrunk),i,o.palm.x,.8,o.palm.z);for(let r=0;r<4;r++)n.add(n.style.box(.9,.04,.22),n.mat(D.leaf[0]),i,o.palm.x,1.62,o.palm.z).rotation.y=r*Math.PI/2+.4}),sn(n=>t(n).trees[1]??n.door),sn(n=>t(n).ramp,(n,i,s,a)=>mn(n,i,Fn(t(a.o).ramp),.3,.15,D.ramp)),sn(n=>({x:n.x0-1.9,z:n.D*.55}),(n,i,s)=>{n.add(n.style.cylinder(.72,.25),n.mat("#d8d2c6"),i,s.x,.12,s.z),n.add(n.style.cylinder(.6,.05),n.style.material("#8fd3ff",{emissive:"#8fd3ff",ei:.15}),i,s.x,.26,s.z),n.add(n.style.cylinder(.13,.6),n.mat("#d8d2c6"),i,s.x,.5,s.z),n.add(n.style.ball(.12),n.mat("#8fd3ff"),i,s.x,.85,s.z)}),sn(e.arcade,(n,i,s)=>{bx(n,i,s)}),sn(n=>({x:n.x0-1.9,z:n.D+2.2}),(n,i,s,a)=>{Qu(n,i,s.x,s.z,1,.7,a.k.pal.pendants),n.add(n.style.box(.9,.06,.35),n.mat("#c49a6c"),i,s.x+.7,.06,s.z-.2);for(let o=0;o<3;o++)n.add(n.style.ball(.1),n.mat(D.leaf[0]),i,s.x-.5+o*.35,.04,s.z+.3-o*.2)}),sn(n=>({x:n.x0+n.W+1.2,z:1.2}),(n,i,s)=>{yx(n,i,s.x,s.z,[D.parasol],n.pal.ink)}),sn(n=>({x:n.x0-1.9,z:1.4}),(n,i,s)=>{Nl(n,i,s.x,s.z,(a,o)=>{n.add(n.style.capsule(.22,.25),a,i,s.x,o+.45,s.z),n.add(n.style.ball(.22),a,i,s.x,o+.92,s.z)})})],tree:(n,i,s,a,o)=>{Bs(n,i,s,a,o)},frameSpan:e.frameSpan??(n=>({xa:Xf(n)+1.1,xb:n.mainDesk.x-.5,y:1.45,z:.02})),frame:Mx(D.crate,D.mural)}}const Go=.55,LS=e=>({x:Xf(e)+.9+.25+Go/2,z:.3});function bx(e,t,n){e.add(e.style.box(Go,1.1,.45),e.mat(D.ramp),t,n.x,.55,n.z),e.add(e.style.box(.45,.32,.03),e.style.material(D.dark,{emissive:"#6cb4ee",ei:.5}),t,n.x,.82,n.z+.24),e.add(e.style.box(.5,.06,.25),e.mat(D.dark),t,n.x,.6,n.z+.28)}function Qu(e,t,n,i,s,a,o){e.add(e.style.cylinder(1,.04),e.style.material(o?"#1d3b52":"#6cb4ee",{emissive:o?"#2c5a7a":"#6cb4ee",ei:o?.3:.08}),t,n,0,i).scale.set(s,1,a)}const IS="#3d405b",DS=["#5fb35a","#7cc26b","#4e9a48"],NS=e=>e.o,Uh=Ju({fruit:e=>({x:(e.island.x0+e.island.x1)/2+.75,z:(e.island.z0+e.island.z1)/2+.3}),fruit2:e=>({x:(e.island.x0+e.island.x1)/2-.7,z:(e.island.z0+e.island.z1)/2-.5}),boombox:e=>({x:(e.island.x0+e.island.x1)/2-.75,z:(e.island.z0+e.island.z1)/2+.55}),mural:e=>{const t=e.lounge.map(n=>n.x);return[Math.min(...t)-.4,Math.max(...t)+.4]},arcade:LS,nap:e=>({x:(e.lounge[0]?.x??e.x0)+1,z:1.5})});function US(e){const{k:t,root:n,o:i}=e,{style:s,pal:a}=t,{x0:o,W:r,D:c}=i,l=t.add(s.box(r,.14,c),s.floor(a.floor,r,c),n,o+r/2,-.05,c/2);l.receiveShadow=!0;const d=s.material(a.window,{opacity:.35}),f=1.9;t.add(s.box(r,.3,.12),t.mat(a.wallTop),n,o+r/2,.15,-.06),t.add(s.box(.12,.3,c),t.mat(a.wallTop),n,o-.06,.15,c/2),t.add(s.box(r,f-.3,.05),d,n,o+r/2,.3+(f-.3)/2,-.05),t.add(s.box(.05,f-.3,c),d,n,o-.05,.3+(f-.3)/2,c/2);const u=t.mat(IS);for(let h=0;h<=6;h++)t.add(s.box(.07,f,.07),u,n,o+h*r/6,f/2,-.05);for(let h=0;h<=6;h++)t.add(s.box(.07,f,.07),u,n,o-.05,f/2,h*c/6);t.add(s.box(r,.06,.08),u,n,o+r/2,f,-.05),t.add(s.box(.08,.06,c),u,n,o-.05,f,c/2);for(let h=0;h<6;h++){const m=o+(h+.5)*r/6;t.add(s.cylinder(.005,.3),u,n,m,f-.15,.25),t.add(s.cylinder(.14,.14),t.mat(D.pot),n,m,f-.35,.25),t.add(s.ball(.2),t.mat(DS[h%3]??D.leaf[0]),n,m,f-.48,.25).scale.y=1.3}mn(t,n,Fn(Be(i).doorMat),.04,.03,D.mat)}function OS(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=NS(e),{cx:o,cz:r,tableR:c}=a;t.add(i.cylinder(c,.62),t.mat(s.island),n,o,.31,r),t.add(i.cylinder(c+.08,.07),t.mat(s.islandTop),n,o,.66,r),t.add(i.cylinder(.2,2.4),t.mat("#a0673f"),n,o,1.4,r);const l=[[0,2.9,0,1,"#5fb35a"],[.6,2.5,.3,.7,"#7cc26b"],[-.6,2.6,-.2,.7,"#4e9a48"],[.1,3.4,-.3,.6,"#7cc26b"]];for(const[d,f,u,h,m]of l)t.add(i.ball(h),t.mat(m),n,o+d,f,r+u);t.add(i.box(.45,.45,.4),t.mat(D.coffee),n,o-.2,.92,r+.85),t.add(i.box(.16,.05,.04),i.material(D.coffeeLed,{emissive:D.coffeeLed,ei:.5}),n,o-.2,1.04,r+1.06)}const FS={id:"greenhouse",pal:ja({floor:"#e3b48f",wall:"#cfe8ee",wallTop:"#9cc7d1",desk:"#f3efe6",deskTop:"#ffffff",island:"#c49a6c",islandTop:"#e9d4b4",window:"#cfe8ee",rug:"#7cc26b"},{window:"#3b5f7a",desk:"#c9c2b4",deskTop:"#ddd6c8"}),shell:US,island:OS,lounge:gr,desk:(e,t,n)=>_r(e,t,n,{w:1.1,d:.55,at:.5}),mainDesk:e=>{const t=e.o.mainDesk,n=eo(e.o,{x:t.x,z:t.z+.6})??{x0:t.x-1.15,x1:t.x+1.15,z0:t.z+.1,z1:t.z+1.1};return to(e,n,t)},tree:({k:e},t,n,i,s)=>{Bs(e,t,n,i,s)},growth:e=>{no(e,Uh)},pieceAt:ta(Uh)},Ad=["#bfe1f2","#ffe3a3","#cfe8c3","#e2dcf7"],BS=["#f4a259","#ffd166","#e9c46a"],GS=e=>e.o,$f=e=>{const t=e.lounge.map(n=>n.x);return t.length?[Math.min(...t)-.4,Math.max(...t)+.4]:[e.x0+.3,e.x0+4]},Oh=Ju({fruit:e=>({x:(e.island.x0+e.island.x1)/2,z:e.island.z0+1.6}),fruit2:e=>({x:(e.island.x0+e.island.x1)/2,z:e.island.z0+2.9}),boombox:e=>({x:(e.island.x0+e.island.x1)/2,z:e.island.z1-.5}),mural:e=>$f(e),arcade:e=>({x:$f(e)[1]+.3,z:.3}),nap:e=>({x:(e.lounge[0]?.x??e.x0)+1,z:1.5})});function HS(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=GS(e),{x0:o,W:r,D:c}=a;t.add(i.box(r,.14,c),i.floor(s.floor,r,c),n,o+r/2,-.05,c/2),t.add(i.box(r+.2,1.7,.2),t.mat(s.wall),n,o+r/2,.85,-.1),t.add(i.box(.2,1,c+.2),t.mat(s.wall),n,o-.1,.5,c/2);const l=i.material(s.window,{emissive:s.window,ei:s.pendants?.4:0});for(let h=4.6;h<c-1;h+=2.3)t.add(i.box(.05,.45,1.2),l,n,o,.62,h+.6);const d=new Set([...a.slots.values()].map(h=>Math.floor(h/4)));a.pods.forEach((h,m)=>{if(!d.has(m))return;const _=Ad[m%Ad.length]??Ad[0];t.add(i.cylinder(2,.03),t.mat(s.pendants?Na(_,.55):_),n,h.x,.02,h.z)});const[f,u]=$f(a);BS.forEach((h,m)=>t.add(i.box(u-f,.2*(3-m),.18),t.mat(s.pendants?Na(h,.7):h),n,(f+u)/2,.1*(3-m),.1+m*.17)),mn(t,n,Fn(Be(a).doorMat),.04,.03,D.mat)}function VS(e){const{k:t,root:n,o:i}=e,{style:s,pal:a}=t,o=i.island,r=(o.x0+o.x1)/2,c=(o.z0+o.z1)/2,l=o.z1-o.z0;t.add(s.box(o.x1-o.x0-.1,.62,l-.1,.15),t.mat(a.island),n,r,.31,c),t.add(s.box(o.x1-o.x0+.05,.07,l),t.mat(a.islandTop),n,r,.66,c),t.add(s.box(.42,.45,.4),t.mat(D.coffee),n,r,.92,o.z0+.4),t.add(s.box(.04,.05,.16),s.material(D.coffeeLed,{emissive:D.coffeeLed,ei:.5}),n,r+.22,1.04,o.z0+.4)}const kS={id:"campus",pal:ja({floor:"#efe6d8",wall:"#fbf6ec",wallTop:"#e4d6bf",desk:"#f6f2ea",deskTop:"#ffffff",island:"#f39a4c",islandTop:"#fffaf0"},{desk:"#c9c2b4",deskTop:"#ddd6c8"}),shell:HS,island:VS,lounge:gr,desk:(e,t,n)=>_r(e,t,n,{w:1.6,d:.78,at:.5}),mainDesk:e=>{const t=e.o.mainDesk,n=eo(e.o,{x:t.x,z:t.z+.6})??{x0:t.x-1.15,x1:t.x+1.15,z0:t.z+.1,z1:t.z+1.1};return to(e,n,t)},tree:({k:e},t,n,i,s)=>{Bs(e,t,n,i,s)},growth:e=>{no(e,Oh)},pieceAt:ta(Oh)},Ki=2.1,Fh=["#f39a4c","#6cb4ee","#2b2d42","#ffd166"],Sx=e=>e.o,ns=e=>({x:(e.island.x0+e.island.x1)/2,z:(e.island.z0+e.island.z1)/2}),ju=e=>e.boardSpots.reduce((t,n)=>t+n.x,0)/Math.max(1,e.boardSpots.length),Bh=Ju({fruit:e=>({x:ns(e).x+.1,z:ns(e).z}),fruit2:e=>({x:ns(e).x-.75,z:ns(e).z}),boombox:e=>({x:ns(e).x+.85,z:ns(e).z}),mural:e=>[e.x0+.15,e.x0+2.3],arcade:e=>({x:e.x0+.5,z:1.2}),nap:e=>({x:e.x0+e.W-2.5,z:e.D-2.5}),frameSpan:e=>({xa:e.x0+2.4,xb:ju(e)-1.1,y:1.9,z:.02})});function WS(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=Sx(e),{x0:o,W:r,D:c}=a,l=o+r;t.add(i.box(r,.14,c),i.floor(s.floor,r,c),n,o+r/2,-.05,c/2),t.add(i.box(r+.2,Ki,.2),t.mat(s.wall),n,o+r/2,Ki/2,-.1),t.add(i.box(.2,1.2,c+.2),t.mat(s.wall),n,o-.1,.6,c/2),t.add(i.box(r+.2,.08,.24),t.mat(s.wallTop),n,o+r/2,Ki,-.1);const d=ju(a)-1;t.add(i.box(1.2,.5,.04),t.mat("#c49a6c"),n,d,1.75,.03+i.pictureZ);for(let g=0;g<6;g++)t.add(i.box(.06,.3,.04),t.mat(Fh[g%Fh.length]??D.dark),n,d-.45+g*.18,1.75+g%2*.06,.07+i.pictureZ);const f=4.3,u=c-.4;for(const g of[f,u])t.add(i.box(.16,Ki,.16),t.mat(s.wallTop),n,l+.05,Ki/2,g);t.add(i.box(.36,.34,u-f+.2),t.mat(s.wallTop),n,l+.05,Ki-.05,(f+u)/2),t.add(i.box(.06,.4,u-f-.16),t.mat("#9aa3ab"),n,l+.05,Ki-.42,(f+u)/2);for(let g=0;g<3;g++)t.add(i.box(.07,.02,u-f-.16),t.mat("#77838c"),n,l+.05,Ki-.3-g*.12,(f+u)/2);const h=new Wt;h.position.set(l-.35,0,f+.65),h.rotation.y=-Math.PI/2,n.add(h),$S(t,h,0,0);const m=ns(a),_=m.x+1.6,x=l-4.6,p=(m.z+.75+a.crossFront)/2;if(x-_>2.6){XS(t,n,(_+x)/2+.3,p);for(let g=0;g<3;g++)t.add(i.cylinder(.26,.14),t.mat(D.dark),n,_+.2,.08+g*.15,p+.2)}const v=t.add(i.cylinder(.5,.01),t.mat("#9a978f"),n,o+r*.62,.025,c*.72);v.scale.z=.6;const y=t.add(i.cylinder(.3,.16),t.mat(D.dark),n,o+.25,.3,c-1);y.rotation.z=Math.PI/2,mn(t,n,Fn(Be(a).doorMat),.04,.03,D.mat)}function XS(e,t,n,i){const{style:s}=e,a=e.mat("#e9c46a");e.add(s.box(2.2,.4,1,.15),a,t,n,.38,i),e.add(s.box(1.1,.38,.9,.15),a,t,n-.25,.75,i),e.add(s.box(1,.26,.92),e.mat("#2c4a6b"),t,n-.25,.78,i);const o=e.add(s.box(.6,.04,.9),a,t,n+.75,.8,i);o.rotation.z=.7;for(const[r,c]of[[-.7,-.5],[.7,-.5],[-.7,.5],[.7,.5]]){const l=e.add(s.cylinder(.2,.12),e.mat(D.dark),t,n+r,.2,i+c);l.rotation.x=Math.PI/2}for(const r of[-.32,.32])e.add(s.box(.03,.1,.14),e.mat(D.paper),t,n+1.1,.45,i+r)}function $S(e,t,n,i){const{style:s}=e,a=e.mat("#6cb4ee");for(const o of[-.42,.42]){const r=e.add(s.cylinder(.16,.08),e.mat(D.dark),t,n+o,.16,i);r.rotation.x=Math.PI/2}e.add(s.box(.7,.14,.26),a,t,n-.05,.3,i),e.add(s.box(.3,.3,.3,.1),a,t,n-.3,.45,i),e.add(s.box(.34,.07,.24),e.mat(D.dark),t,n-.28,.63,i),e.add(s.box(.08,.5,.2),a,t,n+.38,.45,i),e.add(s.box(.04,.04,.5),e.mat(D.dark),t,n+.4,.72,i),e.add(s.ball(.05),e.mat(D.paper),t,n+.44,.62,i)}function qS(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=Sx(e),{x:o,z:r}=ns(a);t.add(i.box(2.5,.62,.8,.08),t.mat(s.island),n,o,.31,r),t.add(i.box(2.6,.07,.9),t.mat(s.islandTop),n,o,.66,r),t.add(i.box(.2,.16,.16),t.mat(D.dark),n,o-1.1,.78,r+.32),t.add(i.box(.5,.26,.28),t.mat(D.pot),n,o-.3,.83,r-.22);const c=a.pingpong,l=(c.x0+c.x1)/2,d=(c.z0+c.z1)/2;t.add(i.box(c.x1-c.x0,.06,c.z1-c.z0),t.mat("#2a9d8f"),n,l,.72,d),t.add(i.box(.02,.01,c.z1-c.z0-.04),t.mat(D.paper),n,l-(c.x1-c.x0)/2+.03,.755,d),t.add(i.box(.04,.16,c.z1-c.z0),t.mat(D.paper),n,l,.83,d);for(const[f,u]of[[-1.1,-.6],[1.1,-.6],[-1.1,.6],[1.1,.6]])t.add(i.box(.06,.7,.06),t.mat(D.dark),n,l+f,.35,d+u);t.add(i.ball(.05),t.mat(D.paper),n,l+.6,.9,d+.2)}const YS={id:"workshop",pal:ja({floor:"#c4c1bb",wall:"#8e9aa3",wallTop:"#77838c",desk:"#c49a6c",deskTop:"#d8b483",island:"#5c677d",islandTop:"#c49a6c",rug:"#6cb4ee"},{floor:"#7d7a75",wall:"#4f585f"}),shell:WS,island:qS,lounge:gr,desk:(e,t,n)=>_r(e,t,n,{w:1.6,d:.78,at:.5}),mainDesk:e=>{const t=e.o.mainDesk,n=eo(e.o,{x:t.x,z:t.z+.6})??{x0:t.x-1.15,x1:t.x+1.15,z0:t.z+.1,z1:t.z+1.1};return to(e,n,t,{x:ju(e.o),y:1.82})},tree:({k:e},t,n,i,s)=>{Bs(e,t,n,i,s)},growth:e=>{no(e,Bh)},pieceAt:ta(Bh)},Xn="#4a3222",ZS="#3d4a2e",Gs="#2b3a67",zo="#ec9a3c",wx="#5f8f3a",Ex="#a9adb3",Gh=[Gs,"#a8c96a","#e9c46a"],Cn=e=>e,Hh=e=>e.boardSpots.reduce((t,n)=>t+n.x,0)/Math.max(1,e.boardSpots.length),qf=e=>(e.island.x0+e.island.x1)/2,an=(e,t=()=>{})=>({at:e,draw:t});function tl(e,t,n,i,s,a,o){const{style:r}=e;if(a%2===0){e.add(r.cylinder(.08*s,1*s),e.mat(Xn),t,n,.5*s,i);for(const[c,l,d,f]of[[0,1.2,0,.5],[.3,1,.2,.35],[-.3,1.05,-.15,.32]])e.add(r.ball(f*s),e.mat(o?zo:"#7cb35a"),t,n+c*s,l*s,i+d*s);return}for(let c=0;c<4;c++){const l=n+c%2*.2,d=i+Math.floor(c/2)*.2;e.add(r.cylinder(.035,2*s),e.mat("#8fbf5a"),t,l,1*s,d).rotation.z=(c-1.5)*.05,e.add(r.ball(.18),e.mat("#6b9f3a"),t,l,2*s,d).scale.y=.5}}const Yf=e=>{const t=Cn(e).garden,n=(t.x0+t.x1)/2;return{lantern:{x:n+.9,z:t.z0+.7},maple:{x:n-.2,z:(t.z0+t.z1)/2},goban:{x:t.x0+.7,z:t.z1-.7},bamboo:{x:t.x1-.5,z:t.z1-.5}}},Vh={pieces:[an(e=>e.door),an(e=>Be(e).plants[0]??e.door,(e,t,n)=>{e.add(e.style.box(.42,.12,.3),e.mat("#5c677d"),t,n.x,.06,n.z),e.add(e.style.cylinder(.04,.35),e.mat(Xn),t,n.x,.3,n.z).rotation.z=.4;for(const[i,s]of[[-.12,.42],[.1,.5],[.02,.6]])e.add(e.style.ball(.12),e.mat("#4e7a3a"),t,n.x+i,s,n.z).scale.y=.5}),an(e=>({x:qf(e),z:e.island.z0+1.6}),(e,t,n)=>{e.add(e.style.box(.44,.12,.32),e.mat(D.dark),t,n.x,.75,n.z),e.add(e.style.box(.18,.04,.12),e.mat(D.paper),t,n.x-.1,.82,n.z-.06),e.add(e.style.box(.18,.04,.12),e.mat("#7cc26b"),t,n.x+.1,.82,n.z-.06),e.add(e.style.box(.38,.04,.12),e.mat(D.orange),t,n.x,.82,n.z+.08)}),an(e=>({x:(Cn(e).kotatsu.x0+Cn(e).kotatsu.x1)/2,z:1.75})),an(e=>({x:Hh(e),z:.9}),(e,t,n,i)=>{const s=e.style.pictureZ;e.add(e.style.box(1.8,.95,.05),e.mat(Xn),t,n.x,1.05,.02+s),e.add(e.style.box(1.66,.82,.02),e.mat("#2f3437"),t,n.x,1.05,.05+s);for(let o=0;o<4;o++)e.add(e.style.box(.04,.5-o*.08,.01),e.mat(D.paper),t,n.x+.55-o*.3,1.1,.065+s);const a=Be(i.o).plants[1];a&&tl(e,t,a.x,a.z,.45,1,!1)}),an(e=>({x:(Cn(e).kotatsu.x0+Cn(e).kotatsu.x1)/2,z:.4}),(e,t,n,i)=>{const s=e.style.pictureZ,a=Cn(i.o).kotatsu.x1-Cn(i.o).kotatsu.x0;e.add(e.style.box(a,.6,.02),e.mat("#fbf6e8"),t,n.x,1.2,.02+s);for(let r=0;r<5;r++){const c=r%2?"#3d6fb6":Gs;e.add(e.style.box(a/5-.04,.08+r%3*.06,.01),e.mat(c),t,n.x-a/2+(r+.5)*(a/5),1+r%3*.07,.035+s)}e.add(e.style.ball(.11),e.mat(D.paper),t,n.x+a/2-.25,1.36,.04+s);const o=Cn(i.o).garden;e.add(e.style.cylinder(.005,.3),e.mat(D.ink),t,o.x0-.25,1.6,o.z0),e.add(e.style.cap(.08,.6),e.mat("#bfe1f2"),t,o.x0-.25,1.42,o.z0),e.add(e.style.box(.06,.14,.01),e.mat(D.paper),t,o.x0-.25,1.28,o.z0)}),an(e=>({x:qf(e),z:e.island.z0+2.9}),(e,t,n,i)=>{e.add(e.style.box(.4,.03,.3),e.mat(Xn),t,n.x,.71,n.z),e.add(e.style.cylinder(.08,.07),e.mat("#e9e2d4"),t,n.x-.08,.76,n.z),e.add(e.style.cylinder(.06,.02),e.mat("#7cb35a"),t,n.x-.08,.8,n.z),e.add(e.style.cylinder(.035,.14),e.mat("#d8c9a0"),t,n.x+.1,.79,n.z);const s=Cn(i.o).garden;for(const[a,o,r]of[[.25,.3,.45],[.7,.75,.35],[.2,.85,.3]])e.add(e.style.ball(r),e.mat(wx),t,s.x0+(s.x1-s.x0)*a,0,s.z0+(s.z1-s.z0)*o).scale.y=.35}),an(e=>Be(e).parasol,(e,t,n)=>{e.add(e.style.cylinder(.03,1.8),e.mat(Xn),t,n.x,.9,n.z);const i=e.add(e.style.cap(.85,.35),e.mat(zo),t,n.x,1.75,n.z);i.scale.y=.6,e.add(e.style.cap(.4,.35),e.mat(D.paper),t,n.x,1.79,n.z).scale.y=.6}),an(e=>Be(e).trees[1]??e.door),an(e=>Yf(e).goban,(e,t,n)=>{e.add(e.style.box(.5,.18,.5),e.mat("#e2b880"),t,n.x,.09,n.z);for(let i=0;i<3;i++)e.add(e.style.box(.44,.005,.01),e.mat(D.ink),t,n.x,.185,n.z-.15+i*.15),e.add(e.style.box(.01,.005,.44),e.mat(D.ink),t,n.x-.15+i*.15,.185,n.z);e.add(e.style.cylinder(.09,.1),e.mat(Xn),t,n.x-.4,.05,n.z),e.add(e.style.cylinder(.09,.1),e.mat(Xn),t,n.x+.4,.05,n.z),e.add(e.style.ball(.03),e.mat(D.ink),t,n.x+.05,.2,n.z),e.add(e.style.ball(.03),e.mat(D.paper),t,n.x-.1,.2,n.z+.15)}),an(e=>Yf(e).bamboo,(e,t,n,i)=>{e.add(e.style.cylinder(.3,.18),e.mat(Ex),t,n.x,.09,n.z),e.add(e.style.cylinder(.25,.02),e.style.material(i.k.pal.pendants?"#1d3b52":"#8fd3ff"),t,n.x,.19,n.z),e.add(e.style.cylinder(.045,.7),e.mat("#a8c96a"),t,n.x-.35,.42,n.z-.1).rotation.z=1.1,e.add(e.style.cylinder(.02,.35),e.mat("#6b8f3a"),t,n.x-.4,.2,n.z-.1)}),an(e=>({x:Cn(e).kotatsu.x1+.45,z:.3}),(e,t,n)=>{bx(e,t,n)}),an(e=>({x:e.x0-1.9,z:e.D+2.2}),(e,t,n,i)=>{Qu(e,t,n.x,n.z,1,.75,i.k.pal.pendants);const s=e.add(e.style.box(.4,.06,1.8),e.mat(zo),t,n.x,.2,n.z);s.rotation.x=0;for(const a of[-.85,.85])e.add(e.style.box(.42,.2,.08),e.mat(zo),t,n.x,.1,n.z+a);for(const[a,o,r]of[[-.5,.2,D.orange],[.5,-.25,D.paper]])e.add(e.style.ball(.09),e.mat(r),t,n.x+a,.04,n.z+o).scale.set(1.8,.5,1)}),an(e=>({x:e.x0+e.W+1.2,z:1.2}),(e,t,n)=>{e.add(e.style.cylinder(.04,3.2),e.mat(Xn),t,n.x,1.6,n.z),[[Gs,2.9],[zo,2.5],["#6cb4ee",2.1]].forEach(([i,s],a)=>{const o=e.add(e.style.capsule(.12-a*.015,.7-a*.1),e.mat(i),t,n.x+.5,s,n.z);o.rotation.z=Math.PI/2-.1,e.add(e.style.ball(.04),e.mat(D.paper),t,n.x+.12,s+.04,n.z+.1)})}),an(e=>({x:e.x0-1.9,z:1.4}),(e,t,n)=>{Nl(e,t,n.x,n.z,(i,s)=>{e.add(e.style.ball(.26),i,t,n.x,s+.3,n.z).scale.y=1.15,e.add(e.style.ball(.2),i,t,n.x,s+.7,n.z);for(const a of[-.1,.1])e.add(e.style.box(.07,.1,.05),i,t,n.x+a,s+.9,n.z);e.add(e.style.capsule(.05,.16),i,t,n.x+.2,s+.78,n.z+.08)})})],tree:(e,t,n,i,s,a)=>{tl(e,t,n,i,s,a,!0)},frameSpan:e=>({xa:Hh(e)+1.1,xb:e.mainDesk.x-.5,y:1.3,z:.02}),frame:(e,t,n,i,s,a,o)=>{const r=s+e.style.pictureZ;e.add(e.style.box(.26,.03,.03),e.mat(Xn),t,n,i+.27,r),e.add(e.style.box(.22,.5,.01),e.mat(o?D.gold:"#fbf6e8"),t,n,i,r),e.add(e.style.box(.03,.22-a%3*.05,.01),e.mat(D.ink),t,n,i+.03,r+.01),e.add(e.style.box(.26,.03,.03),e.mat(Xn),t,n,i-.26,r)},flowers:["#fffaf0","#ffd166","#9b8fe0","#e9e2d4"]};function KS(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=Cn(e.o),{x0:o,W:r,D:c,garden:l}=a;t.add(i.box(r,.14,c),i.floor(s.floor,r,c),n,o+r/2,-.05,c/2);const d=t.mat(ZS),f=l.x0-.5-o;for(let p=2;p<c;p+=2)t.add(i.box(f,.012,.05),d,n,o+f/2,.03,p);for(let p=o+1.9;p<l.x0-.6;p+=1.9)t.add(i.box(.05,.012,c-.2),d,n,p,.03,c/2);t.add(i.box(.5,.08,l.z1-l.z0+.6),t.mat("#7a5a3c"),n,l.x0-.25,.05,(l.z0+l.z1)/2),t.add(i.box(l.x1-l.x0,.03,l.z1-l.z0),t.mat(s.pendants?"#8e8a80":"#e6e2d6"),n,(l.x0+l.x1)/2,.02,(l.z0+l.z1)/2);for(let p=l.z0+.25;p<l.z1;p+=.3)t.add(i.box(l.x1-l.x0-.1,.005,.02),t.mat(s.pendants?"#77736a":"#c9c3b3"),n,(l.x0+l.x1)/2,.04,p);const u=Yf(a);for(const[p,v,y]of[[-.8,1,.5],[.9,-1.2,.6]])t.add(i.ball(y),t.mat(wx),n,(l.x0+l.x1)/2+p,0,v>0?l.z0+v:l.z1+v).scale.y=.4;t.add(i.ball(.25),t.mat("#8e9399"),n,u.maple.x+.6,.08,u.maple.z-.9).scale.y=.6;const h=u.lantern;t.add(i.box(.22,.45,.22),t.mat(Ex),n,h.x,.22,h.z),t.add(i.box(.3,.2,.3),i.material("#e9d8a6",s.pendants?{emissive:"#e9d8a6",ei:1.2}:{}),n,h.x,.55,h.z),t.add(i.box(.42,.1,.42),t.mat("#8e9399"),n,h.x,.72,h.z),tl(t,n,u.maple.x,u.maple.z,1.1,0,e.grow.stage>=6);const m=t.mat(Xn);t.add(i.box(r+.2,1.8,.14),t.mat(s.wall),n,o+r/2,.9,-.07),t.add(i.box(.14,1.2,c+.2),t.mat(s.wall),n,o-.07,.6,c/2);for(let p=o;p<=o+r+.01;p+=1.9)t.add(i.box(.08,1.8,.05),m,n,p,.9,.01);t.add(i.box(r,.08,.06),m,n,o+r/2,1.78,.01);for(let p=0;p<=c+.01;p+=1.9)t.add(i.box(.05,1.2,.08),m,n,o+.01,.6,p);const _=i.material("#fbf6e8",s.pendants?{emissive:"#fbf6e8",ei:.35}:{});for(let p=4.6;p<c-1.2;p+=1.9){t.add(i.box(.02,.8,1.6),_,n,o+.02,.62,p+.8);for(let v=1;v<4;v++)t.add(i.box(.03,.8,.02),m,n,o+.03,.62,p+v*.4);t.add(i.box(.03,.02,1.6),m,n,o+.03,.62,p+.8)}const x=a.door.x;for(const p of[-.55,.55])t.add(i.box(.08,1.7,.08),m,n,x+p,.85,c-.05);t.add(i.box(1.2,.08,.08),m,n,x,1.7,c-.05);for(const p of[-.22,.22])t.add(i.box(.42,.5,.02),t.mat(Gs),n,x+p,1.4,c-.05);t.add(i.ball(.07),t.mat(D.paper),n,x,1.45,c-.03),mn(t,n,Fn(Be(a).doorMat),.03,.03,"#c9b27a")}function JS(e){const{k:t,root:n,o:i}=e,{style:s,pal:a}=t,o=i.island,r=qf(i),c=(o.z0+o.z1)/2,l=o.z1-o.z0;t.add(s.box(o.x1-o.x0-.1,.62,l-.1,.06),t.mat(a.island),n,r,.31,c),t.add(s.box(o.x1-o.x0+.05,.06,l),t.mat(a.islandTop),n,r,.65,c),t.add(s.ball(.13),t.mat("#5c677d"),n,r,.78,o.z0+.45),t.add(s.cylinder(.02,.12),t.mat("#5c677d"),n,r+.14,.82,o.z0+.45).rotation.z=-.8;for(let d=0;d<3;d++)t.add(s.cylinder(.045,.07),t.mat("#e9e2d4"),n,r+.2,.72,o.z0+.75+d*.14)}function QS(e){const{k:t,root:n}=e,{style:i}=t,s=Cn(e.o).kotatsu,a=(s.x0+s.x1)/2,o=(s.z0+s.z1)/2;if(t.add(i.box(s.x1-s.x0,.22,s.z1-s.z0+.1),t.mat(Gs),n,a,.11,o),t.add(i.box(s.x1-s.x0-.2,.05,s.z1-s.z0-.1),t.mat("#7a5a3c"),n,a,.25,o),e.grow.stage>=2)for(const r of[0,.16])t.add(i.ball(.09),t.mat(D.orange),n,a+r,.33,o+r/2);Ku(e,(r,c,l,d)=>{r.add(r.style.box(l.x1-l.x0,.08,l.z1-l.z0,.04),r.mat(Gh[d%Gh.length]??Gs),c,(l.x0+l.x1)/2,.05,(l.z0+l.z1)/2)})}const jS={id:"kyoto",pal:ja({floor:"#d6cc95",wall:"#e8dcc0",wallTop:"#5c3d2e",desk:"#5c3d2e",deskTop:"#7a5a3c",island:"#5c3d2e",islandTop:"#7a5a3c",grass:"#7fa35a",dirt:"#6b5a48",terrace:"#9a8f80",rug:"#a8c96a"},{desk:"#7a5a3c",deskTop:"#94704e",island:"#7a5a3c",islandTop:"#94704e"}),shell:KS,island:JS,lounge:QS,desk:(e,t,n)=>_r(e,t,n,{w:1.6,d:.78,at:.5}),mainDesk:e=>{const t=e.o.mainDesk,n=eo(e.o,{x:t.x,z:t.z+.6})??{x0:t.x-1.15,x1:t.x+1.15,z0:t.z+.1,z1:t.z+1.1};return to(e,n,t)},tree:({k:e,grow:t},n,i,s,a)=>{tl(e,n,i,s,a,0,t.stage>=6)},growth:e=>{no(e,Vh)},pieceAt:ta(Vh),wear:e=>{e.add(e.style.cylinder(.232,.05),e.mat(Gs),e.head,0,.07,0);for(let t=0;t<3;t++)e.add(e.style.ball(.014),e.mat(D.paper),e.head,Math.sin(t*.5-.5)*.235,.07,Math.cos(t*.5-.5)*.235)}},bn="#2a9d8f",dr="#3d6fb6",Sn="#e9c46a",Zf="#b08a3c",qn="#f3e3c6",Ho=[bn,"#f3efe4",dr,Sn],Tx="#c98a3e",ws=e=>e,kh=e=>e.boardSpots.reduce((t,n)=>t+n.x,0)/Math.max(1,e.boardSpots.length),on=(e,t=()=>{})=>({at:e,draw:t}),Ro=e=>{const t=e.lounge.map(n=>n.x);return t.length?[Math.min(...t)-.4,Math.max(...t)+.4]:[e.x0+.3,e.x0+4]},Nc=e=>({x:e.lounge[1]?.x??e.x0+1.8,z:2.95}),zd=e=>{const t=ws(e).patio;return[{x:t.x0+.7,z:t.z0+.7},{x:t.x1-.7,z:t.z0+.7},{x:t.x0+.7,z:t.z1-.7},{x:t.x1-.7,z:t.z1-.7}]};function Wh(e,t,n,i){e.add(e.style.box(.5,.4,.5),e.mat(bn),t,n.x,.2,n.z),e.add(e.style.cylinder(.05,.6),e.mat("#6b4a32"),t,n.x,.7,n.z),e.add(e.style.ball(.42),e.mat(i?"#2f6a2f":"#3f8a3e"),t,n.x,1.15,n.z);for(let s=0;s<5;s++)e.add(e.style.ball(.06),e.mat(D.orange),t,n.x+Math.sin(s*1.3)*.36,1.1+s%3*.12,n.z+Math.cos(s*1.3)*.36)}function Ax(e,t,n,i,s){e.add(e.style.cylinder(.08*s,1.7*s),e.mat("#a0673f"),t,n,.85*s,i);for(let a=0;a<6;a++){const o=e.add(e.style.box(.95*s,.04,.22),e.mat(a%2?"#5fb35a":"#4e9a48"),t,n,1.7*s,i);o.rotation.y=a*Math.PI/3,o.rotation.z=-.3}}const Xh={pieces:[on(e=>e.door),on(e=>Be(e).plants[0]??e.door,(e,t,n)=>{e.add(e.style.cylinder(.18,.3),e.mat(bn),t,n.x,.15,n.z);for(let i=0;i<4;i++)e.add(e.style.ball(.13),e.mat(i%2?"#7cc26b":"#5fb35a"),t,n.x+Math.sin(i*1.6)*.1,.38+i%2*.08,n.z+Math.cos(i*1.6)*.1)}),on(Nc,(e,t,n,i)=>{e.add(e.style.cylinder(.32,.03),e.mat(Sn),t,n.x,.43,n.z),e.add(e.style.ball(.1),e.mat("#d8d4cc"),t,n.x,.53,n.z),e.add(e.style.cylinder(.015,.12),e.mat("#d8d4cc"),t,n.x+.1,.57,n.z).rotation.z=-.9;for(let s=0;s<3;s++)e.add(e.style.cylinder(.03,.08),e.style.material(bn,{opacity:.8}),t,n.x-.15+s*.12,.49,n.z+.17);for(const s of zd(i.o).slice(0,1))Wh(e,t,s,i.k.pal.pendants)}),on(e=>({x:(Ro(e)[0]+Ro(e)[1])/2,z:1.5})),on(e=>({x:kh(e),z:.9}),(e,t,n)=>{const i=e.style.pictureZ;e.add(e.style.box(1.9,1.05,.06),e.mat(qn),t,n.x,1.05,.03+i),e.add(e.style.cap(.95,.35),e.mat(qn),t,n.x,1.5,.03+i).scale.z=.08,e.add(e.style.box(1.66,.82,.02),e.mat("#2f3437"),t,n.x,1.03,.07+i);for(let s=0;s<4;s++)e.add(e.style.box(.5-s*.08,.035,.01),e.mat(D.paper),t,n.x-.4,1.3-s*.15,.085+i)}),on(e=>({x:Ro(e)[1]-.2,z:.35}),(e,t,n,i)=>{const[s,a]=Ro(i.o),o=e.style.pictureZ,r=Math.min(3,a-s-.4),c=(s+a)/2;e.add(e.style.box(r,.6,.02),e.mat("#f1e6d2"),t,c,1.5,.02+o);for(let l=0;l<4;l++){const d=e.add(e.style.box(.24,.24,.01),e.mat("#2b2118"),t,c-r/2+(l+.5)*(r/4),1.5,.035+o);d.rotation.z=Math.PI/4,e.add(e.style.box(.12,.12,.01),e.mat("#f1e6d2"),t,c-r/2+(l+.5)*(r/4),1.5,.04+o).rotation.z=Math.PI/4}e.add(e.style.cylinder(.14,.3),e.mat(Tx),t,n.x,.15,n.z),e.add(e.style.cylinder(.15,.02),e.mat("#f1e6d2"),t,n.x,.31,n.z)}),on(e=>({x:Nc(e).x+0,z:Nc(e).z}),(e,t,n)=>{e.add(e.style.cylinder(.2,.04),e.mat("#b5651d"),t,n.x-.12,.47,n.z-.1),e.add(e.style.cap(.17,.95),e.mat("#c98a3e"),t,n.x-.12,.62,n.z-.1).scale.y=1.2}),on(e=>Be(e).parasol,(e,t,n)=>{for(const[i,s]of[[-.8,-.6],[.8,-.6],[-.8,.6],[.8,.6]])e.add(e.style.cylinder(.03,1.7),e.mat("#6b4a32"),t,n.x+i,.85,n.z+s);e.add(e.style.box(1.8,.04,1.4),e.mat("#f1e6d2"),t,n.x,1.72,n.z);for(let i=0;i<3;i++)e.add(e.style.box(.3,.045,1.4),e.mat(dr),t,n.x-.6+i*.6,1.73,n.z)}),on(e=>zd(e)[3]??e.door,(e,t,n,i)=>{for(const s of zd(i.o).slice(1))Wh(e,t,s,i.k.pal.pendants)}),on(e=>({x:ws(e).patio.x1-1.6,z:ws(e).patio.z1-.7}),(e,t,n)=>{e.add(e.style.cylinder(.32,.3),e.mat(Zf),t,n.x,.15,n.z);for(let i=0;i<16;i++)e.add(e.style.box(.08,.01,.08),e.mat(i%2===Math.floor(i/4)%2?"#2b2118":"#f1e6d2"),t,n.x-.12+i%4*.08,.31,n.z-.12+Math.floor(i/4)*.08)}),on(e=>({x:ws(e).fx,z:ws(e).fz}),(e,t,n)=>{e.add(e.style.cylinder(.08,.4),e.mat(qn),t,n.x,1.2,n.z),e.add(e.style.cylinder(.28,.08),e.mat(bn),t,n.x,1.42,n.z),e.add(e.style.ball(.08),e.mat("#8fd3ff"),t,n.x,1.52,n.z)}),on(e=>({x:e.x0-1.9,z:e.D*.55}),(e,t,n)=>{e.add(e.style.box(1.2,.7,1),e.mat(qn),t,n.x,.35,n.z),e.add(e.style.cap(.5,.5),e.mat("#fbf6ec"),t,n.x,.7,n.z),e.add(e.style.box(.35,.5,.02),e.mat(bn),t,n.x+.61,.25,n.z);for(let i=0;i<3;i++)e.add(e.style.ball(.12+i*.03),e.style.material(D.steam,{opacity:.5}),t,n.x+.1*i,1.35+i*.25,n.z)}),on(e=>({x:e.x0-1.9,z:e.D+2.4}),(e,t,n,i)=>{e.add(e.style.box(1,.12,2.4),e.mat(bn),t,n.x,.06,n.z);const s=e.add(e.style.box(.8,.02,2.2),e.style.material(i.k.pal.pendants?"#1d3b52":"#8fd3ff",{emissive:i.k.pal.pendants?"#2c5a7a":"#8fd3ff",ei:.2}),t,n.x,.13,n.z);s.castShadow=!1;for(let a=0;a<6;a++)e.add(e.style.box(.1,.03,.1),e.mat(Ho[a%4]??bn),t,n.x+(a%2?.45:-.45),.13,n.z-1+Math.floor(a/2)*1)}),on(e=>({x:e.x0+e.W+1.2,z:1.2}),(e,t,n,i)=>{yx(e,t,n.x,n.z,[Sn,dr],e.pal.ink);const s=i.o;[[.25,1.4],[.5,1.9],[.75,1.5]].forEach(([a,o])=>{const r=e.add(e.style.cylinder(1.2,o),e.mat(e.pal.pendants?"#5a4a5f":"#b39a8a"),t,s.x0+s.W*a,o/2-.1,-2.6);r.scale.z=.5,e.add(e.style.cap(.55,.4),e.mat(D.paper),t,s.x0+s.W*a,o-.25,-2.6).scale.z=.5})}),on(e=>({x:e.x0-1.9,z:1.4}),(e,t,n)=>{Nl(e,t,n.x,n.z,(i,s)=>{e.add(e.style.cylinder(.22,.5),i,t,n.x,s+.3,n.z),e.add(e.style.cap(.24,.6),i,t,n.x,s+.6,n.z),e.add(e.style.ball(.06),i,t,n.x,s+.85,n.z)})})],tree:(e,t,n,i,s)=>{Ax(e,t,n,i,s)},frameSpan:e=>({xa:kh(e)+1.1,xb:e.mainDesk.x-.5,y:1.4,z:.02}),frame:(e,t,n,i,s,a,o)=>{const r=s+e.style.pictureZ;e.add(e.style.box(.28,.24,.02),e.mat(o?D.gold:qn),t,n,i,r),e.add(e.style.cap(.14,.5),e.mat(o?D.gold:qn),t,n,i+.12,r).scale.z=.15,e.add(e.style.box(.2,.17,.01),e.mat(Ho[a%4]??bn),t,n,i,r+.015)},flowers:["#fffaf0","#fbf6ec",Sn,"#9b8fe0"]};function tw(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=ws(e.o),{x0:o,W:r,D:c,patio:l}=a,d=s.pendants;t.add(i.box(r,.14,c),i.floor(s.floor,r,c),n,o+r/2,-.05,c/2);const f=l.x1-l.x0,u=l.z1-l.z0;t.add(i.box(f,.03,u),t.mat(d?"#9a968c":"#f3efe4"),n,(l.x0+l.x1)/2,.02,(l.z0+l.z1)/2);const h=Math.max(.8,f/10);for(let M=l.x0+h/2,E=0;M<l.x1;M+=h,E++)for(let A=l.z0+h/2,C=0;A<l.z1;A+=h,C++){const I=Ho[(E+C)%3===1?2:(E+C)%3===2?3:0];t.add(i.box(.22,.01,.22),t.mat(d?Na(I,.7):I),n,M,.04,A).rotation.y=Math.PI/4}t.add(i.box(r+.2,2.1,.2),t.mat(s.wall),n,o+r/2,1.05,-.1),t.add(i.box(.2,1.3,c+.2),t.mat(s.wall),n,o-.1,.65,c/2);for(let M=o+.2,E=0;M<o+r;M+=.4,E++)t.add(i.box(.4,.45,.02),t.mat(Ho[E%4]??bn),n,M,.26,.01);for(let M=.2,E=0;M<c;M+=.4,E++)t.add(i.box(.02,.45,.4),t.mat(Ho[E%4]??bn),n,o+.01,.26,M);t.add(i.box(r,.18,.06),t.mat(d?Na(qn,.7):qn),n,o+r/2,1.85,.03);const m=t.mat(d?Na(qn,.75):qn),_=1.35,x=M=>{for(const E of M)t.add(i.cylinder(.11,_),m,n,E.x,_/2,E.z),t.add(i.box(.28,.08,.28),m,n,E.x,_,E.z)},p=[];for(let M=l.x0;M<=l.x1+.01;M+=f/Math.max(1,Math.round(f/1.9)))p.push({x:M,z:l.z0-.15});const v=M=>{const E=[];for(let A=l.z0;A<=l.z1+.01;A+=1.9)E.push({x:M,z:A});return E};x([...p,...v(l.x0-.15),...v(l.x1+.15)]),t.add(i.box(f+.4,.14,.2),m,n,(l.x0+l.x1)/2,_+.1,l.z0-.15);for(const M of[l.x0-.15,l.x1+.15])t.add(i.box(.2,.14,u),m,n,M,_+.1,(l.z0+l.z1)/2);const y=i.material(Sn,d?{emissive:Sn,ei:1.2}:{});for(let M=0;M+1<p.length;M+=2){const E=p[M],A=p[M+1];if(!E||!A)continue;const C=(E.x+A.x)/2;t.add(i.cylinder(.11,.24),y,n,C,1.05,E.z),t.add(i.cap(.13,.5),t.mat(Zf),n,C,1.17,E.z)}const[g,b]=Ro(a);t.add(i.box(b-g,.35,.5),t.mat(dr),n,(g+b)/2,.18,.3);for(let M=0;M<5;M++)t.add(i.box(.5,.36,.1),t.mat([Sn,bn,D.orange,"#9b8fe0",Sn][M]??Sn),n,g+.4+M*(b-g-.8)/4,.5,.08);const w=Nc(a);t.add(i.cylinder(.06,.4),t.mat(Zf),n,w.x,.2,w.z),t.add(i.cylinder(.4,.04),t.mat(Sn),n,w.x,.41,w.z);const T=a.door.x;for(const M of[-.55,.55])t.add(i.box(.14,1.6,.14),t.mat(s.wall),n,T+M,.8,c-.05);t.add(i.box(1.25,.2,.16),t.mat(s.wall),n,T,1.6,c-.05),t.add(i.box(.08,1.4,.9),t.mat("#6b3f22"),n,T-.62,.7,c-.55);for(let M=0;M<6;M++)t.add(i.ball(.03),t.mat(Sn),n,T-.57,.35+Math.floor(M/2)*.4,c-.8+M%2*.5);mn(t,n,Fn(Be(a).doorMat),.03,.03,"#b5651d")}function ew(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=ws(e.o),{fx:o,fz:r}=a,c=s.pendants;t.add(i.cylinder(1.08,.38),t.mat(s.island),n,o,.19,r),t.add(i.cylinder(.95,.04),i.material(c?"#1d3b52":"#8fd3ff",{emissive:c?"#2c5a7a":"#8fd3ff",ei:c?.4:.1}),n,o,.37,r),t.add(i.cylinder(.14,.7),t.mat(qn),n,o,.6,r),t.add(i.cylinder(.38,.12),t.mat(s.island),n,o,.98,r),t.add(i.ball(.1),t.mat("#8fd3ff"),n,o,1.1,r);for(let l=0;l<8;l++){const d=l/8*Math.PI*2;t.add(i.ball(.07),t.mat(dr),n,o+Math.sin(d)*1.1,.38,r+Math.cos(d)*1.1)}}const nw={id:"riad",pal:ja({floor:"#d9a36f",wall:"#d98e4f",wallTop:"#c47a3e",desk:"#a0704a",deskTop:"#b8875c",island:bn,islandTop:"#e9f5f2",grass:"#c9b27a",dirt:"#a8764a",terrace:"#e6c9a0",rug:"#f1e6d2"},{desk:"#9a6a48",deskTop:"#b07a52",island:"#1f7a70"}),shell:tw,island:ew,lounge:e=>{Ku(e,(t,n,i)=>{t.add(t.style.cylinder((i.x1-i.x0)/2-.05,.32),t.mat(Tx),n,(i.x0+i.x1)/2,.16,(i.z0+i.z1)/2),t.add(t.style.cylinder(.12,.01),t.mat(Sn),n,(i.x0+i.x1)/2,.325,(i.z0+i.z1)/2)})},desk:(e,t,n)=>_r(e,t,n,{w:1.4,d:.78,at:.5}),mainDesk:e=>{const t=e.o.mainDesk,n=eo(e.o,{x:t.x,z:t.z+.6})??{x0:t.x-1.15,x1:t.x+1.15,z0:t.z+.1,z1:t.z+1.1};return to(e,n,t)},tree:({k:e},t,n,i,s)=>{Ax(e,t,n,i,s)},growth:e=>{no(e,Xh)},pieceAt:ta(Xh),wear:e=>{for(const t of e.legs){const n=t.children[1];n&&(n.material=e.mat(Sn),n.scale.z=1.25)}}},Dn="#d9b98a",Ua="#6b4a32",Fi="#3d6fb6",Cs="#d9a54a",zx="#fbf8f2",iw="#2f6b4f",sw="#f4f7fa",aw=e=>e;function ow(e,t,n){const{style:i,pal:s}=e,a=n.x0+n.W-1.5,o=Math.max(n.table.z0+1.2,(n.table.z0+n.D)/2);e.add(i.box(2,.02,1.8),e.mat(s.pendants?"#5a6e8a":"#bfd4ea"),t,a-.2,.03,o),e.add(i.box(.35,.8,1.4),e.mat(Dn),t,a+.85,.4,o),[Fi,Cs,"#2a9d8f","#9b8fe0","#fffaf0"].forEach((r,c)=>e.add(i.box(.25,.26,.08),e.mat(r),t,a+.68,.22+c%2*.36,o-.5+c*.22)),e.add(i.box(.22,.14,.07),e.mat(Fi),t,a+.85,.87,o-.3),e.add(i.box(.08,.14,.07),e.mat(Fi),t,a+.85,.98,o-.2);for(let r=0;r<3;r++)e.add(i.cylinder(.05,.22),e.mat(["#2a9d8f","#e9c46a","#fffaf0"][r]??D.paper),t,a+.85,.91,o+.15+r*.16);e.add(i.box(.75,.35,.7,.12),e.mat("#c9d6e3"),t,a-.4,.2,o),e.add(i.box(.75,.45,.16,.08),e.mat("#c9d6e3"),t,a-.4,.55,o+.3),e.add(i.box(.6,.1,.5),e.mat(zx),t,a-.4,.42,o-.05),e.add(i.cylinder(.02,1.3),e.mat(D.dark),t,a-1,.65,o+.55),e.add(i.cap(.18,.6),i.material("#fff2d6",s.pendants?{emissive:"#ffd166",ei:.9}:{}),t,a-1,1.35,o+.55)}const $h=e=>e.boardSpots.reduce((t,n)=>t+n.x,0)/Math.max(1,e.boardSpots.length),Uc=e=>(e.island.x0+e.island.x1)/2,rn=(e,t=()=>{})=>({at:e,draw:t}),Oc=e=>{const t=e.lounge.map(n=>n.x);return t.length?[Math.min(...t)-.45,Math.max(...t)+.45]:[e.x0+1,e.x0+4.5]},Rx=e=>({x:e.x0+e.W-1.4,z:e.D+3.5});function Cx(e,t,n,i,s,a){const{style:o}=e;if(a%2===0){e.add(o.cylinder(.08,1.6*s),e.mat("#f4f1ea"),t,n,.8*s,i);for(let r=0;r<3;r++)e.add(o.box(.1,.03,.02),e.mat(D.ink),t,n,(.4+r*.4)*s,i+.08);e.add(o.ball(.5*s),e.mat("#a8c96a"),t,n,1.8*s,i).scale.set(.8,1.2,.8);return}e.add(o.cylinder(.08,.4),e.mat("#5c3d2e"),t,n,.2,i);for(let r=0;r<3;r++){const c=(.7-r*.18)*s;e.add(o.cap(c,.9),e.mat(iw),t,n,(.45+r*.42)*s,i).scale.y=1.1,e.add(o.cap(c*.5,.5),e.mat(sw),t,n,(.75+r*.42)*s,i)}}function Px(e,t,n,i){const{style:s}=e;if(e.add(s.box(1.4,1,1.1),e.mat(Cs),t,n.x,.5,n.z),e.add(s.box(1.6,.12,1.3),e.mat("#5c677d"),t,n.x,1.06,n.z),e.add(s.cylinder(.07,.5),e.mat(D.dark),t,n.x+.4,1.3,n.z-.2),e.add(s.box(.4,.7,.04),e.mat(Ua),t,n.x-.3,.35,n.z-.57),!!i){e.add(s.box(1.4,.06,.6),e.mat(Dn),t,n.x,.12,n.z-.9),e.add(s.box(.9,.08,.25),e.mat(Ua),t,n.x+.2,.3,n.z-.95);for(let a=0;a<3;a++)e.add(s.ball(.1+a*.03),s.material(D.steam,{opacity:.5}),t,n.x+.4+a*.06,1.65+a*.22,n.z-.2)}}const qh={pieces:[rn(e=>e.door),rn(e=>Be(e).plants[0]??e.door,(e,t,n)=>{e.add(e.style.cylinder(.18,.3),e.mat(D.paper),t,n.x,.15,n.z);for(let i=0;i<6;i++){const s=e.add(e.style.box(.45,.03,.12),e.mat(i%2?"#5fb35a":"#4e9a48"),t,n.x,.4,n.z);s.rotation.y=i*Math.PI/3,s.rotation.z=.4}}),rn(e=>({x:Uc(e),z:e.island.z0+1.3}),(e,t,n)=>{e.add(e.style.cylinder(.28,.03),e.mat(D.paper),t,n.x,.71,n.z);for(let i=0;i<5;i++)e.add(e.style.ball(.07),e.mat("#c98a3e"),t,n.x+Math.sin(i*1.25)*.15,.76,n.z+Math.cos(i*1.25)*.15).scale.y=.6}),rn(e=>({x:(Oc(e)[0]+Oc(e)[1])/2,z:1.5})),rn(e=>({x:$h(e),z:.9}),(e,t,n)=>{const i=e.style.pictureZ;e.add(e.style.box(1.8,.95,.05),e.mat(Dn),t,n.x,1.05,.02+i),e.add(e.style.box(1.66,.82,.02),e.mat("#2f3a33"),t,n.x,1.05,.05+i);for(let s=0;s<4;s++)e.add(e.style.box(.6-s*.1,.035,.01),e.mat(D.paper),t,n.x-.3,1.3-s*.15,.065+i)}),rn(e=>({x:Uc(e),z:e.island.z1-.4}),(e,t,n,i)=>{const[s,a]=Oc(i.o),o=e.style.pictureZ,r=(s+a)/2+.3;[Cs,Fi,"#2a9d8f","#f39a4c","#9b8fe0"].forEach((l,d)=>e.add(e.style.box(.42,.7,.03),e.mat(l),t,r-.84+d*.42,1.25,.03+o)),e.add(e.style.box(.42,.12,.34),e.mat(Ua),t,n.x,.75,n.z),e.add(e.style.cylinder(.13,.015),e.mat(D.ink),t,n.x,.82,n.z)}),rn(e=>({x:Uc(e),z:e.island.z0+2.1}),(e,t,n)=>{e.add(e.style.cylinder(.14,.08),e.mat(D.paper),t,n.x,.73,n.z);for(let i=0;i<5;i++)e.add(e.style.ball(.04),e.mat("#4b3f7a"),t,n.x+Math.sin(i*1.3)*.07,.79,n.z+Math.cos(i*1.3)*.07);for(const i of[-.3,.3])e.add(e.style.cylinder(.05,.09),e.mat(D.paper),t,n.x,.74,n.z+i)}),rn(e=>({x:e.x0+e.W-3.4,z:e.D+2}),(e,t,n,i)=>{const s=i.k.pal.pendants;e.add(e.style.cylinder(.4,.08),e.mat("#8e9399"),t,n.x,.04,n.z);for(let a=0;a<3;a++)e.add(e.style.cylinder(.05,.5),e.mat(Ua),t,n.x,.12,n.z).rotation.set(Math.PI/2,a*Math.PI/3,0);e.add(e.style.cap(.18,.8),e.style.material(D.orange,{emissive:D.orange,ei:s?1.4:.5}),t,n.x,.22,n.z);for(const a of[-.85,.85]){const o=e.add(e.style.cylinder(.12,1.1),e.mat("#a0673f"),t,n.x,.12,n.z+a);o.rotation.z=Math.PI/2}}),rn(e=>Be(e).trees[1]??e.door),rn(e=>({x:e.x0+e.W+1,z:e.D*.6}),(e,t,n)=>{e.add(e.style.box(.12,.34,.12),e.mat(Dn),t,n.x,.17,n.z),e.add(e.style.box(.14,.05,.14),e.mat(Cs),t,n.x,.36,n.z);for(const i of[-.9,-.45,.45,.9])e.add(e.style.box(.08,.18,.08),e.mat(Dn),t,n.x-.4,.09,n.z+i),e.add(e.style.box(.08,.18,.08),e.mat(Dn),t,n.x+.4,.09,n.z+i)}),rn(e=>({x:e.x0-1.9,z:e.D*.55}),(e,t,n,i)=>{e.add(e.style.cylinder(.65,.6),e.mat("#a0673f"),t,n.x,.3,n.z),e.add(e.style.cylinder(.56,.03),e.style.material(i.k.pal.pendants?"#2c5a7a":"#8fd3ff",{emissive:"#8fd3ff",ei:i.k.pal.pendants?.5:.1}),t,n.x,.58,n.z);for(let s=0;s<3;s++)e.add(e.style.ball(.12+s*.04),e.style.material(D.steam,{opacity:.45}),t,n.x+.12*s-.1,.85+s*.25,n.z)}),rn(Rx,(e,t,n)=>{Px(e,t,n,!0)}),rn(e=>({x:e.x0-1.9,z:e.D+2.4}),(e,t,n,i)=>{Qu(e,t,n.x,n.z,1.2,.9,i.k.pal.pendants),e.add(e.style.box(.4,.06,1.2),e.mat(Dn),t,n.x+.6,.08,n.z-.2);for(const s of[-.7,.3])e.add(e.style.cylinder(.04,.3),e.mat(Ua),t,n.x+.6,0,n.z+s)}),rn(e=>({x:e.x0+e.W+1.2,z:1.2}),(e,t,n)=>{e.add(e.style.cylinder(.05,2.8),e.mat(Dn),t,n.x,1.4,n.z);const i=e.add(e.style.cylinder(.04,1.4),e.mat(Dn),t,n.x,2.2,n.z);i.rotation.z=Math.PI/2;for(const s of[-.6,.6]){const a=e.add(e.style.cylinder(.22,.06),e.mat("#5fb35a"),t,n.x+s,1.9,n.z);a.rotation.x=Math.PI/2}for(let s=0;s<8;s++)e.add(e.style.ball(.07),e.mat(["#ffd166","#fffaf0","#9b8fe0","#6cb4ee"][s%4]??D.paper),t,n.x,.5+s*.28,n.z+.06)}),rn(e=>({x:e.x0-1.9,z:1.4}),(e,t,n)=>{Nl(e,t,n.x,n.z,(i,s)=>{e.add(e.style.box(.5,.26,.18),i,t,n.x,s+.42,n.z),e.add(e.style.box(.18,.34,.16),i,t,n.x+.22,s+.68,n.z);for(const a of[-.18,.18])e.add(e.style.box(.08,.24,.14),i,t,n.x+a,s+.17,n.z)})})],tree:(e,t,n,i,s,a)=>{Cx(e,t,n,i,s,a)},frameSpan:e=>({xa:$h(e)+1.1,xb:e.mainDesk.x-.5,y:1.45,z:.02}),frame:Mx("#ecd2a6",[Fi,Cs,"#2a9d8f","#9b8fe0","#a8c96a"]),flowers:["#fffaf0","#ffd166","#9b8fe0","#6cb4ee"]};function rw(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=aw(e.o),{x0:o,W:r,D:c,table:l}=a,d=s.pendants;t.add(i.box(r,.14,c),i.floor(s.floor,r,c),n,o+r/2,-.05,c/2),t.add(i.box(r+.2,1.9,.2),t.mat(s.wall),n,o+r/2,.95,-.1),t.add(i.box(.2,1.3,c+.2),t.mat(s.wall),n,o-.1,.65,c/2),t.add(i.box(r,.5,.05),t.mat(s.desk),n,o+r/2,.25,.02),t.add(i.box(.05,.5,c),t.mat(s.desk),n,o+.02,.25,c/2);const f=i.material(d?"#2c4a6b":"#dff1fb",d?{emissive:"#3c5a8a",ei:.5}:{});for(let p=a.island.z1+.4;p<c-1.2;p+=2.4)t.add(i.box(.06,.9,1.4),t.mat(Ua),n,o+.01,.85,p+.7),t.add(i.box(.07,.78,1.28),f,n,o+.02,.85,p+.7);const u=(l.z0+l.z1)/2,h=l.z1-l.z0;t.add(i.box(l.x1-l.x0-.1,.5,h-.1,.06),t.mat(s.desk),n,0,.25,u),t.add(i.box(l.x1-l.x0,.06,h),t.mat(s.deskTop),n,0,.52,u),t.add(i.box(.4,.01,h-.2),t.mat(d?"#9aa4ad":"#dfe7ee"),n,0,.555,u);const m=i.material("#ffd166",d?{emissive:"#ffd166",ei:2}:{});for(let p=l.z0+.8;p<l.z1;p+=1.6)t.add(i.cylinder(.04,.16),t.mat(D.paper),n,0,.64,p),t.add(i.ball(.035),m,n,0,.75,p);const _=t.mat(d?"#d8d2c6":D.paper),x=i.material("#ffd166",d?{emissive:"#ffd166",ei:.8}:{});for(let p=l.z0+1.2;p<l.z1;p+=2.4)t.add(i.cylinder(.005,.6),t.mat(D.dark),n,0,2.1,p),t.add(i.cap(.3,.5),_,n,0,1.75,p),t.add(i.ball(.08),x,n,0,1.68,p);for(const[p,v]of[[0,Fi],[.25,Cs]])t.add(i.box(.1,1.7,.04),t.mat(v),n,o+r-.35-p,.85,.15).rotation.z=.08;ow(t,n,a),e.grow.stage<11&&Px(t,n,Rx(a),!1),mn(t,n,Fn(Be(a).doorMat),.03,.03,"#a9b8c8")}function cw(e){const{k:t,root:n,o:i}=e,{style:s,pal:a}=t,o=i.island,r=Uc(i),c=(o.z0+o.z1)/2,l=o.z1-o.z0;t.add(s.box(o.x1-o.x0-.1,.62,l-.1,.06),t.mat(a.island),n,r,.31,c),t.add(s.box(o.x1-o.x0+.05,.07,l),t.mat(a.islandTop),n,r,.66,c),t.add(s.cylinder(.13,.3),t.mat(D.dark),n,r,.84,o.z0+.4),t.add(s.cylinder(.02,.14),t.mat(D.dark),n,r+.15,.88,o.z0+.4).rotation.z=-.8,t.add(s.cylinder(.07,.18),s.material("#cfe8c3",{opacity:.85}),n,r,.78,o.z0+.8)}function lw(e){const{k:t,root:n,o:i}=e,{style:s,pal:a}=t,o=a.pendants,r=i.x0+.55;t.add(s.cylinder(.35,.8),t.mat(D.dark),n,r,.4,.55),t.add(s.cylinder(.08,1.2),t.mat(D.dark),n,r,1.4,.55),t.add(s.box(.3,.22,.03),s.material(o?"#ff9a3d":"#5c3d2e",o?{emissive:"#ff9a3d",ei:1.5}:{}),n,r,.38,.9);for(let l=0;l<4;l++)t.add(s.cylinder(.06,.5),t.mat("#a0673f"),n,r-.2+l%2*.13,.06+Math.floor(l/2)*.12,1.5).rotation.x=Math.PI/2;const c=e.stage(3);if(c){const[l,d]=Oc(i);t.add(s.box(Math.min(2.2,d-l),.02,1),t.mat(Fi),c,(l+d)/2,.035,3);for(let f=0;f<4;f++)t.add(s.box(Math.min(2.2,d-l),.025,.06),t.mat(D.paper),c,(l+d)/2,.04,2.65+f*.22)}Ku(e,(l,d,f)=>{l.add(l.style.ball(.4),l.mat(o?"#c9c4bb":zx),d,(f.x0+f.x1)/2,.05,(f.z0+f.z1)/2).scale.set(1,.18,.9)})}function dw(e,t,n){const{k:i,root:s}=e,a=Re(n),o=new Wt;o.position.set(t.x,0,t.z),o.rotation.y=t.face,s.add(o);const r=Ks(i,o,0,.47),c=Js(i,o,.5,.85);Qs(i,o,0,-.05,tn[(a>>5)%tn.length]??Dn,0),a%3===0&&i.add(i.style.cylinder(.05,.1),i.mat(D.paper),o,-.45,.6,.75);const l=vx(t,.5);return{screen:r,lamp:c,top:{x:l.x,y:.55,z:l.z}}}const fw={id:"nordic",pal:ja({floor:"#ead6b4",wall:"#f7f5f0",wallTop:"#d9c7a6",desk:Dn,deskTop:"#ecd2a6",island:"#f7f5f0",islandTop:Dn,grass:"#eef3f7",dirt:"#7a5a3c",terrace:"#e2d2b4",rug:Fi},{grass:"#9fb0c4",wall:"#8c8a84"}),shell:rw,island:cw,lounge:lw,desk:dw,mainDesk:e=>{const t=e.o.mainDesk,n=eo(e.o,{x:t.x,z:t.z+.6})??{x0:t.x-1.15,x1:t.x+1.15,z0:t.z+.1,z1:t.z+1.1};return to(e,n,t)},tree:({k:e},t,n,i,s)=>{Cx(e,t,n,i,s,1)},growth:e=>{no(e,qh)},pieceAt:ta(qh),wear:e=>{const t=Re(e.name);[Fi,D.paper,Cs].slice(0,2+t%2).forEach((i,s)=>e.add(e.style.cylinder(.19,.05),e.mat(i),e.body,0,.74+s*.05,0))}},Ht=(e,t,n=.62)=>t?`#${new ee(e).multiplyScalar(n).getHexString()}`:e;function Pi(e,t,n,i,s,a){if(typeof document>"u")return e.mat(t);const o=document.createElement("canvas");o.width=o.height=64;const r=o.getContext("2d");if(!r)return e.mat(t);r.fillStyle=t,r.fillRect(0,0,64,64),a(r,64);const c=new Hm(o);return c.colorSpace=fn,c.wrapS=c.wrapT=tr,c.repeat.set(n/s,i/s),new lr({color:16777215,map:c,roughness:.95,metalness:0})}function vr(e,t,n,i){e.add(e.style.box(n.W,.14,n.D),i,t,n.x0+n.W/2,-.05,n.D/2)}function _i(e){const t=e.x0+e.W,n=e.lounge.map(l=>l.x),i=n.length?(Math.min(...n)+Math.max(...n))/2:e.x0+2,s=e.terrace.map(l=>l.x),a=s.length?Math.min(...s)<e.x0+e.W/2:!0,o=a?t-1.6:e.x0+1.6,r=e.island,c=e.boardSpots.length?e.boardSpots.reduce((l,d)=>l+d.x,0)/e.boardSpots.length:e.x0+e.W/2;return[e.door,{x:a?e.x0+.3:t-.3,z:e.D-.25},{x:(r.x0+r.x1)/2,z:(r.z0+r.z1)/2},{x:i,z:1.6},{x:c,z:.9},{x:i,z:.6},{x:(r.x0+r.x1)/2,z:r.z0+.3},{x:a?Math.max(...s)+1.7:Math.min(...s)-1.7,z:e.D+2.3},{x:e.x0-.9,z:e.D*.45},{x:o,z:e.D+2.6},{x:e.x0-1.9,z:e.D*.55},{x:o+(a?-1.6:1.6),z:e.D+2.6},{x:e.x0-1.9,z:e.D+2.2},{x:t+1.2,z:1.2},{x:e.x0-1.9,z:1.4}]}function xi(e){return[{x:e.x0-.7,z:1},{x:e.x0-.7,z:e.D*.45},{x:e.x0-.7,z:e.D*.85},{x:e.x0+e.W*.3,z:-.85},{x:e.x0+e.W*.75,z:-.85}]}function Mr(e,t){return{...e,...t}}function Tn(e,t,n,i,s,a,o,r){return e.add(new Tl(n,i,10),typeof s=="string"?e.mat(s):s,t,a,o,r)}function t0(e,t,n=.9){return e.pal.pendants?e.style.material(t,{emissive:t,ei:n}):e.mat(t)}function Hs(e,t,n,i,s,a=0){return e.add(e.style.box(n.x1-n.x0,i,n.z1-n.z0),e.mat(s),t,(n.x0+n.x1)/2,a+i/2,(n.z0+n.z1)/2)}function yr(e,t,n,i={}){const{k:s,root:a}=e,{style:o,pal:r}=s,c=Re(n),l=new Wt;l.position.set(t.x,0,t.z),l.rotation.y=t.face,a.add(l);const d=1.3,f=.72;i.mat&&s.add(o.box(1.5,.02,1.5),s.mat(i.mat),l,0,.03,.3),s.add(o.box(d-.1,.5,f-.08,.12),s.mat(r.desk),l,0,.25,.5),s.add(o.box(d,.06,f,.03),s.mat(r.deskTop),l,0,.52,.5),s.add(o.box(.22,.08,.02),s.mat(tn[c%tn.length]??r.desk),l,-d/3,.4,.5+f/2-.03);const u=Ks(s,l,0,.47),h=Js(s,l,d/2-.18,.5+f/2-.17);return Qs(s,a,t.x-Math.sin(t.face)*.05,t.z-Math.cos(t.face)*.05,i.chair??tn[(c>>5)%tn.length]??r.desk,t.face),i.thing?.(s,l,c),{screen:u,lamp:h,top:{x:t.x+Math.sin(t.face)*.5,y:.55,z:t.z+Math.cos(t.face)*.5}}}function br(e,t,n){const{k:i,root:s,o:a}=e,{style:o,pal:r}=i,c=a.mainDesk,l=qu(a.furniture,c)??{x0:c.x-1.15,x1:c.x+1.15,z0:c.z+.1,z1:c.z+1.1},d=(l.x0+l.x1)/2,f=(l.z0+l.z1)/2,u=new Wt;u.position.set(d,0,f),s.add(u);const h=l.x1-l.x0,m=l.z1-l.z0;i.add(o.box(h-.1,.5,m-.1),i.mat(n),u,0,.25,0),i.add(o.box(h,.06,m),i.mat(t),u,0,.52,0);const _=Ks(i,u,c.x-d+.2,-.03),x=Js(i,u,h/2-.2,m/2-.2);return i.add(o.box(.7,.06,.5),i.mat(r.wallTop),u,-h/2+.5,.58,0),i.add(o.box(.34,.24,.26),i.mat(D.crate),u,-h/2+.5,.73,0),Qs(i,s,c.x,c.z-.05,D.dark,c.face),js(i,s,c.x,1.25,.02+o.pictureZ,r.neon,.06,o.material(r.neon,{flat:!0})),{screen:_,lamp:x,top:{x:d,y:.55,z:f}}}const uw=[0,1,1,1,2,2,2,4,4,4,8],hw=(e,t)=>e[Math.min(t,e.length-1)]??0,pw=e=>e<2?3:e<4?5:8;function Sr(e,t){const{o:n,grow:i}=e;n.furniture.filter(a=>a.of!==void 0&&n.lounge.some(o=>o.x===a.of?.x&&o.z===a.of.z)).forEach((a,o)=>{if(o>=yl(i.stage))return;const r=e.stage(pw(o));r&&t(r,a,o)})}function wr(e,t,n){const{k:i,o:s,grow:a}=e,o=e.stage(1);if(!o)return;const r=s.terrace.map(m=>m.x),c=s.terrace.map(m=>m.z),l=Math.min(...r)-.8,d=Math.max(...r)+.8,f=s.D+.15,u=Math.max(...c)+.8;i.add(i.style.box(d-l,.08,u-f),i.mat(t),o,(l+d)/2,0,(f+u)/2),s.furniture.filter(m=>m.of!==void 0&&s.terrace.some(_=>_.x===m.of?.x&&_.z===m.of.z)).forEach((m,_)=>{if(_>=hw(uw,a.stage))return;const x=[1,4,7,7,10,10,10,10][_]??0;Dl(i,e.stage(x)??o,m,n[_%n.length]??D.paper)})}function Er(e,t,n){const{k:i,grow:s}=e,a=e.stage(0);if(!a||s.frames===0)return;const o=.36,r=Math.max(1,Math.floor((t.xb-t.xa)/o));for(let c=0;c<s.frames;c++){const l=t.y-Math.floor(c/r)*.32;if(l<.6)break;n(i,a,t.xa+o/2+c%r*o,l,.02+i.style.pictureZ,c,s.golden)}}function Tr(e,t,n){const{k:i,o:s,grow:a}=e,o=e.stage(0);if(o){for(let r=1;r<=14;r++){const c=e.stage(r),l=t[r];c&&l&&l(i,c,n(s,r),e)}Ll(i,o,s,a),a.building&&a.stage<14&&Il(i,o,n(s,a.stage+1))}}function Ar(e,t,n,i){e.add(e.style.box(.7,.4,.7),e.mat("#d8d2c6"),t,n.x,.2,n.z),i(e.style.material(D.gold,{emissive:D.gold,ei:.15}),.4)}function e0(e,t,n,i,s,a,o=.5){e.add(e.style.cylinder(.18,.32),e.mat(s),t,n,.16,i);for(let r=0;r<4;r++)e.add(e.style.ball(.14),e.mat(a),t,n+Math.cos(r*1.6)*.1,.4+r/4*o,i+Math.sin(r*1.6)*.08).scale.set(.8,1.3,.8)}function mw(e,t,n,i,s=2.3){const a=new Wt;a.position.set(n.x,s,n.z),t.add(a),i.forEach((o,r)=>{e.add(e.style.ball(.6-r*.001),e.mat(o),a,0,0,0).scale.set(1-r*.28,1.05,1-r*.28)}),e.add(e.style.box(.35,.25,.35),e.mat("#c49a6c"),a,0,-1,0);for(const o of[-.15,.15])e.add(e.style.cylinder(.01,.5),e.mat(D.ink),a,o,-.65,0);return a}function Fc(e,t,n,i,s,a=2.6){const o=e.add(e.style.box(.5,.5,.02),e.mat(i),t,n.x,a,n.z);o.rotation.z=Math.PI/4;for(let c=0;c<4;c++)e.add(e.style.box(.1,.06,.02),e.mat(c%2?s:i),t,n.x+.05*c,a-.42-c*.14,n.z);const r=e.add(e.style.cylinder(.006,a),e.mat(D.ink),t,n.x+.4,a/2,n.z+.3);r.rotation.z=.25}function Ul(e,t,n,i,s){e.add(e.style.box(.9,.36,.9),e.mat(i),t,n.x,.18,n.z),e.add(e.style.box(.8,.03,.8),e.mat(s),t,n.x,.37,n.z)}function n0(e,t,n,i,s,a=1){const o=e.add(e.style.cylinder(a,.04),e.style.material(i,{emissive:i,ei:.1}),t,n.x,.02,n.z);o.scale.z=.7;const r=e.add(e.style.cylinder(a+.1,.03),e.mat(s),t,n.x,0,n.z);r.scale.z=.72}const xw=["#2f5fa7","#7b5fc0","#f39a4c","#2a9d8f","#e9c46a"],Ps=["#f28c28","#e9c46a","#2a9d8f","#3d6fb6","#7b5fc0","#7cc26b"],Yh="#2f5fa7",ci="#3d6fb6",i0="#6b9f7a",Vo="#4f8a5b",gw="#9b8fe0",On="#f28c28",_w=e=>Mr(e?mi:pi,{floor:Ht("#df9a6a",e,.7),wall:Ht("#f2b53a",e),wallTop:Ht("#d99a2a",e),desk:Ht("#a0673f",e,.85),deskTop:Ht("#c98a5a",e,.85),island:Ht("#6b4a32",e,.85),islandTop:Ht("#f3efe4",e,.8),grass:Ht("#d9c08a",e),dirt:Ht("#a8764a",e),terrace:Ht("#e6c9a0",e),plant:i0}),vw=e=>e.o;function Mw(e){const{k:t,root:n}=e,i=vw(e),{x0:s,W:a,D:o}=i,r=t.pal.pendants;vr(t,n,i,Pi(t,t.pal.floor,a,o,.8,(f,u)=>{f.fillStyle=Ht("#c47a48",r,.7),f.fillRect(0,0,u,3),f.fillRect(0,0,3,u),f.fillStyle=Ht("#e3a070",r,.7),f.fillRect(12,12,40,40)})),t.add(t.style.box(a+.2,1.7,.2),t.mat(t.pal.wall),n,s+a/2,.85,-.1),t.add(t.style.box(.2,1.1,o+.2),t.mat(Ht(Yh,r)),n,s-.1,.55,o/2);for(const f of i.slabs){t.add(t.style.box(f.w,1.2,.22),t.mat(Ht(xw[f.c]??Yh,r,.75)),n,f.x,.6,f.z);for(let u=0;u<5;u++)t.add(t.style.box(.3,.16,.02),t.mat(u%2?"#fffaf0":ci),n,f.x-1.6+u*.8,.95,f.z+.12)}for(const f of[4.25,i.island.z0-.35]){const u=t.add(t.style.cylinder(.006,a-.6),t.mat(D.ink),n,s+a/2,2,f);u.rotation.z=Math.PI/2;for(let h=s+.6,m=0;h<s+a-.5;h+=.42,m++)t.add(t.style.box(.28,.3,.01),t.mat(Ps[m%Ps.length]??On),n,h,1.82-Math.sin((h-s)/a*Math.PI)*.12,f)}const c=i.trough;Hs(t,n,c,.45,Ht("#7b5fc0",r)),t.add(t.style.box(c.x1-c.x0-.15,.02,c.z1-c.z0-.15),t.style.material("#8fd3ff",{emissive:"#8fd3ff",ei:r?.3:.1}),n,(c.x0+c.x1)/2,.46,(c.z0+c.z1)/2),t.add(t.style.box(.3,1.4,.7),t.mat(Ht("#f39a4c",r)),n,c.x1+.1,.7,(c.z0+c.z1)/2),t.add(t.style.box(.5,.08,.08),t.mat("#6b4a32"),n,c.x1-.2,1.2,(c.z0+c.z1)/2),t.add(t.style.box(.06,.7,.06),t.style.material("#8fd3ff",{opacity:.7}),n,c.x1-.42,.82,(c.z0+c.z1)/2);const l=(c.z0+c.z1)/2;t.add(t.style.ball(.12),t.mat("#7b5fc0"),n,c.x0+.3,.6,l).scale.set(1.4,.9,1),t.add(t.style.ball(.07),t.mat("#e9c46a"),n,c.x0+.45,.72,l);for(const f of i.slabs)Lx(t,n,f.x+f.w/2+.3,f.z-.25);for(let f=0;f<4;f++)t.add(t.style.box(.25,.02,.5),t.mat(Ps[f]??On),n,i.door.x-.38+f*.25,.03,o-.2)}function Lx(e,t,n,i){e.add(e.style.cylinder(.17,.34),e.mat("#f3efe4"),t,n,.17,i),e.add(e.style.cylinder(.175,.06),e.mat(ci),t,n,.28,i);for(let s=0;s<6;s++)Tn(e,t,.05,.5,i0,n+Math.sin(s)*.07,.55,i+Math.cos(s)*.07).rotation.set(Math.cos(s)*.6,0,-Math.sin(s)*.6)}function yw(e){const{k:t,root:n,o:i}=e,s=i.island;Hs(t,n,{...s,x0:s.x0+.05,x1:s.x1-.05,z0:s.z0+.05,z1:s.z1-.05},.5,t.pal.island),Hs(t,n,s,.06,t.pal.islandTop,.5);for(let a=s.x0+.15;a<s.x1-.1;a+=.3)for(const o of[s.z0+.04,s.z1-.04])t.add(t.style.box(.2,.02,.06),t.mat(ci),n,a,.57,o);for(const a of i.islandSpots)t.add(t.style.box(.36,.3,.36),t.mat("#c98a5a"),n,a.x,.15,a.z+(a.face===0?-.1:.1))}function bw(e){const{k:t}=e;Sr(e,(n,i,s)=>{const a=(i.x0+i.x1)/2,o=(i.z0+i.z1)/2;if(s<4){t.add(t.style.cylinder(.28,.32),t.mat("#c98a3e"),n,a,.16,o),t.add(t.style.cylinder(.3,.06),t.mat("#8a5a3c"),n,a,.34,o),t.add(t.style.box(.56,.4,.08),t.mat("#a0673f"),n,a,.55,o-.26);return}for(const c of[-.45,.45])t.add(t.style.cylinder(.05,1.2),t.mat("#6b4a32"),n,a,.6,o+c);const r=s%2?["#2a9d8f","#7b5fc0","#e9c46a"]:[On,ci,"#e9c46a"];for(let c=0;c<7;c++){const l=c/6,d=t.add(t.style.box(.5,.04,.14),t.mat(r[c%3]??On),n,a,.75-Math.sin(l*Math.PI)*.35,o-.4+l*.8);d.rotation.x=-Math.cos(l*Math.PI)*.5}})}function Kf(e,t,n,i,s){const a=new Wt;a.position.set(n,0,i),a.scale.setScalar(s),t.add(a);const o=Re(`${n.toFixed(1)}:${i.toFixed(1)}`)%3;if(o===0){e.add(e.style.capsule(.16,1.3),e.mat(Vo),a,0,.8,0);for(const r of[-1,1]){e.add(e.style.capsule(.09,.35),e.mat(Vo),a,r*.3,1.05+r*.1,0);const c=e.add(e.style.capsule(.09,.15),e.mat(Vo),a,r*.17,.82+r*.1,0);c.rotation.z=Math.PI/2}}else if(o===1)for(let r=0;r<8;r++)Tn(e,a,.07,.7,i0,Math.sin(r)*.1,.32,Math.cos(r)*.1).rotation.set(Math.cos(r)*.7,0,-Math.sin(r)*.7);else e.add(e.style.cylinder(.1,1.1),e.mat("#6b4a32"),a,0,.55,0),e.add(e.style.ball(.65),e.mat(gw),a,0,1.45,0).scale.y=.75}function Sw(e,t,n,i){e.add(e.style.cylinder(.25,.03),e.mat("#fffaf0"),t,n,.58,i);for(let s=0;s<4;s++)e.add(e.style.ball(.07),e.mat(s%2?"#e9c46a":"#c98a3e"),t,n+Math.sin(s*1.6)*.12,.63,i+Math.cos(s*1.6)*.12).scale.y=.6}const ww={1:(e,t,n)=>{e.add(e.style.cylinder(.17,.3),e.mat("#f3efe4"),t,n.x,.15,n.z),e.add(e.style.capsule(.1,.35),e.mat(Vo),t,n.x,.55,n.z),e.add(e.style.capsule(.06,.12),e.mat(Vo),t,n.x+.12,.55,n.z)},2:(e,t,n,i)=>{Sw(e,t,n.x,n.z);const s=xi(i.o)[0];s&&Kf(e,t,s.x,s.z,.8+i.grow.garden*.06)},3:()=>{},4:(e,t,n)=>{const i=.04+e.style.pictureZ;e.add(e.style.box(1.7,.95,.05),e.mat("#e9c46a"),t,n.x,1.05,i),e.add(e.style.box(1.55,.8,.02),e.mat("#2b3a2f"),t,n.x,1.05,i+.03);const s=Fs(Re("pizarra"));for(let a=0;a<4;a++)e.add(e.style.box(.4+s()*.6,.04,.01),e.mat("#fffaf0"),t,n.x-.3+s()*.2,1.3-a*.16,i+.05)},5:(e,t,n)=>{const i=.02+e.style.pictureZ;["#2a9d8f",On,"#7b5fc0","#e9c46a",ci].forEach((l,d)=>e.add(e.style.box(.95,.5+d%2*.2,.02),e.mat(l),t,n.x-1.9+d*.95,1.15,i));const a=e.add(e.style.cylinder(.25,.02),e.mat("#e9c46a"),t,n.x,1.3,i+.02);a.rotation.x=Math.PI/2;const o=n.x+2.4;e.add(e.style.ball(.2),e.mat("#c98a3e"),t,o,.3,.25).scale.set(1,1.2,.4);const c=e.add(e.style.box(.07,.6,.04),e.mat("#6b4a32"),t,o,.75,.22);c.rotation.x=-.15},6:(e,t,n,i)=>{e.add(e.style.cylinder(.16,.24),e.mat("#a8764a"),t,n.x+1.2,.68,n.z+.15),e.add(e.style.cylinder(.05,.03),e.mat("#6b4a32"),t,n.x+1.2,.82,n.z+.15);const s=Fs(Re(`cempasuchil${i.o.W}`));for(let a=0;a<12;a++)e.add(e.style.ball(.09),e.mat(a%3?On:"#e9c46a"),t,i.o.x0-.3-s()*.5,.08,s()*i.o.D)},7:(e,t,n)=>{for(const[i,s]of[[-.7,-.7],[.7,-.7],[-.7,.7],[.7,.7]])e.add(e.style.cylinder(.05,1.7),e.mat("#8a5a3c"),t,n.x+i,.85,n.z+s);Tn(e,t,1.25,.7,"#d9b86a",n.x,2,n.z)},8:(e,t,n,i)=>{for(const s of xi(i.o).slice(1))Kf(e,t,s.x,s.z,.8+i.grow.garden*.06)},9:(e,t,n)=>{Ul(e,t,n,"#8a5a3c","#fffaf0");for(let i=0;i<9;i++)e.add(e.style.box(.18,.01,.22),e.mat(Ps[i%Ps.length]??On),t,n.x-.25+i%3*.25,.39,n.z-.27+Math.floor(i/3)*.27)},10:(e,t,n)=>{e.add(e.style.cylinder(.75,.35),e.mat("#fffaf0"),t,n.x,.17,n.z),e.add(e.style.cylinder(.77,.08),e.mat(ci),t,n.x,.3,n.z),e.add(e.style.cylinder(.62,.04),e.style.material("#8fd3ff",{emissive:"#8fd3ff",ei:.15}),t,n.x,.34,n.z),e.add(e.style.cylinder(.12,.6),e.mat(ci),t,n.x,.6,n.z),e.add(e.style.ball(.14),e.mat("#8fd3ff"),t,n.x,.95,n.z)},11:(e,t,n)=>{Hs(e,t,{x0:n.x-.6,x1:n.x+.6,z0:n.z-.35,z1:n.z+.35},.25,"#2a9d8f",.5),e.add(e.style.box(1.1,.02,.6),e.mat("#7cc26b"),t,n.x,.76,n.z);for(const i of[-.5,.5])for(const s of[-.28,.28])e.add(e.style.box(.08,.5,.08),e.mat("#6b4a32"),t,n.x+i,.25,n.z+s);for(let i=0;i<4;i++){const s=e.add(e.style.cylinder(.015,.9),e.mat(D.metal),t,n.x-.36+i*.24,.82,n.z);s.rotation.x=Math.PI/2,e.add(e.style.box(.05,.12,.05),e.mat(i%2?ci:On),t,n.x-.36+i*.24,.8,n.z)}},12:(e,t,n)=>{n0(e,t,n,"#2ec4b6","#b39a72",1.1);for(let i=0;i<5;i++)e.add(e.style.ball(.2),e.mat("#b39a72"),t,n.x+Math.cos(i*1.3)*1.1,.08,n.z+Math.sin(i*1.3)*.78)},13:(e,t,n)=>{const i=mw(e,t,n,["#7b5fc0",On,"#2a9d8f"]);e.add(e.style.ball(.12),e.mat("#e9c46a"),i,0,.1,.6);for(const s of[-1,1])Tn(e,i,.06,.25,"#2a9d8f",s*.25,.6,.3)},14:(e,t,n)=>{Ar(e,t,n,(i,s)=>{e.add(e.style.ball(.22),i,t,n.x,s+.3,n.z).scale.set(1.5,.9,.8),e.add(e.style.ball(.13),i,t,n.x+.33,s+.5,n.z);for(const r of[-1,1])Tn(e,t,.04,.18,i,n.x+.36,s+.68,n.z+r*.06);for(const r of[-.2,.2])e.add(e.style.box(.06,.2,.06),i,t,n.x+r,s+.1,n.z);const o=Tn(e,t,.05,.35,i,n.x-.42,s+.45,n.z);o.rotation.z=.8})}};function Ew(e,t,n,i,s,a,o){e.add(e.style.box(.28,.24,.02),e.mat(o?D.gold:D.metal),t,n,i,s),e.add(e.style.box(.2,.16,.01),e.mat(Ps[a%Ps.length]??On),t,n,i,s+.015),o&&e.add(e.style.box(.08,.06,.02),e.mat(D.gold),t,n,i+.15,s)}function Tw(e){wr(e,Aw(e).pal.terrace,[ci,"#fffaf0",On]),Tr(e,ww,Ix);const t=e.o,n=_i(t)[4]?.x??t.x0+t.W/2;Er(e,{xa:n+1.1,xb:t.mainDesk.x-.6,y:1.45},Ew)}const Aw=e=>e.k,Ix=(e,t)=>_i(e)[Math.min(t,14)]??e.door;function zw(e){const t=new Wt;t.position.set(0,.55,0),t.rotation.z=.7,e.body.add(t),[On,ci,"#e9c46a","#2a9d8f"].forEach((n,i)=>{e.add(new mr(.235,.02,6,20),e.mat(n),t,0,0,-.03+i*.03).scale.set(1,1.15,.8)})}const Rw={id:"patio",pal:_w,shell:Mw,island:yw,lounge:bw,desk:(e,t,n)=>yr(e,t,n,{thing:(i,s,a)=>{a%3===0&&Lx(i,s,.45,.35)}}),mainDesk:e=>br(e,"#c98a5a","#6b4a32"),tree:({k:e},t,n,i,s)=>{Kf(e,t,n,i,s)},growth:Tw,pieceAt:Ix,wear:zw},el="#3d6fb6",je="#f28c28",ln="#e9c46a",Bn="#2a9d8f",Es="#f1dcae",s0="#4f8a3e",Dx=[je,Bn,"#7b5fc0",ln],Cw=e=>Mr(e?mi:pi,{floor:Ht("#efd19c",e,.62),wall:Ht("#d9a64e",e),wallTop:Ht("#c48f3a",e),desk:Ht("#8a5a3c",e,.95),deskTop:Ht("#a0673f",e,.95),island:Bn,islandTop:ln,grass:Ht("#d8bf86",e),dirt:Ht("#a8764a",e),terrace:Ht("#e6c9a0",e),plant:s0}),Pw=e=>e.o;function Lw(e,t,n,i,s){const a=Math.hypot(i.x-n.x,i.z-n.z),o=new Wt;o.position.set((n.x+i.x)/2,1.3,(n.z+i.z)/2),o.rotation.y=-Math.atan2(i.z-n.z,i.x-n.x),t.add(o);const r=a/6;for(let c=-1;c<=1;c++)e.add(new mr(r,.06,6,12,Math.PI),e.mat(s),o,c*2*r,c===0?.12:0,0);e.add(e.style.box(a,.08,.14),e.mat(s),o,0,.32,0)}function Iw(e){const{k:t,root:n}=e,i=Pw(e),{x0:s,W:a,D:o,yard:r}=i,c=t.pal.pendants;vr(t,n,i,Pi(t,t.pal.floor,a,o,1,(x,p)=>{x.strokeStyle=Ht("#d9b97c",c,.62),x.lineWidth=2,x.strokeRect(1,1,p-2,p-2)}));const l=Pi(t,Ht("#e8cf9f",c,.62),r.x1-r.x0,r.z1-r.z0,1.2,(x,p)=>{x.strokeStyle=Ht("#c9a66c",c,.62),x.lineWidth=2,x.strokeRect(1,1,p-2,p-2),x.strokeRect(p/2,1,p/2-1,p/2)});t.add(t.style.box(r.x1-r.x0,.02,r.z1-r.z0),l,n,(r.x0+r.x1)/2,.03,(r.z0+r.z1)/2),t.add(t.style.box(a+.2,1.8,.22),t.mat(t.pal.wall),n,s+a/2,.9,-.11),t.add(t.style.box(.22,1.1,o+.2),t.mat(Ht(el,c)),n,s-.11,.55,o/2);for(const x of[s+a*.45,s+a*.66]){t.add(t.style.box(1,.7,.4),t.mat(Ht("#e0b25c",c)),n,x,1.5,.2),t.add(t.style.box(.7,.5,.02),t0(t,"#c48f3a",.6),n,x,1.5,.41);for(let p=0;p<3;p++)for(let v=0;v<2;v++)t.add(t.style.ball(.05),t.mat("#5c3d2e"),n,x-.2+p*.2,1.4+v*.2,.42);t.add(t.style.box(1.1,.08,.5),t.mat(t.pal.wallTop),n,x,1.88,.2),t.add(t.style.cap(.28,.5),t.mat(Ht(Es,c)),n,x,1.92,.2)}const d=Ht(Es,c);for(const x of i.columns)t.add(t.style.cylinder(.09,1.3),t.mat(d),n,x.x,.65,x.z);const f=i.columns.filter(x=>x.x<s+2.3).sort((x,p)=>x.z-p.z),u=i.columns.filter(x=>x.x>s+a-2.3).sort((x,p)=>x.z-p.z),h=i.columns.filter(x=>Math.abs(x.z-6)<1e-6).sort((x,p)=>x.x-p.x);for(const x of[f,u,h])for(let p=1;p<x.length;p++)Lw(t,n,x[p-1],x[p],d);const m=new Date().getDate();([[je,ln,Bn],[el,ln,"#7cc26b"],["#7b5fc0",je,"#fffaf0"]][m%3]??[je,ln,Bn]).forEach((x,p)=>{for(let v=0;v<8;v++){const y=v*Math.PI/4;t.add(t.style.box(.14-p*.02,.01,.07),t.mat(x),n,i.door.x+Math.cos(y)*(.42-p*.13),.04+p*.002,o-.75+Math.sin(y)*(.42-p*.13)).rotation.y=-y}}),t.add(t.style.cylinder(.08,.01),t.mat("#fffaf0"),n,i.door.x,.045,o-.75)}function Dw(e){const{k:t,root:n,o:i}=e,s=(i.island.x0+i.island.x1)/2,a=(i.island.z0+i.island.z1)/2;t.add(t.style.box(1.7,.6,.8),t.mat(Bn),n,s,.42,a),t.add(t.style.box(1.8,.06,.9),t.mat(ln),n,s,.75,a);for(const o of[-.6,.6])t.add(t.style.cylinder(.2,.06),t.mat(D.dark),n,s+o,.2,a+.42).rotation.x=Math.PI/2;t.add(t.style.cylinder(.13,.04),t0(t,je,1.4),n,s-.4,.8,a),t.add(t.style.cylinder(.12,.2),t.mat("#b08a3c"),n,s-.4,.92,a);for(let o=0;o<5;o++)t.add(t.style.cylinder(.04,.08),t.mat("#a8764a"),n,s+.15+o*.13,.82,a+.15);for(const o of[-.8,.8])t.add(t.style.cylinder(.03,1.1),t.mat("#6b4a32"),n,s+o,1.3,a-.35);for(let o=0;o<6;o++)t.add(t.style.box(.3,.03,.9),t.mat(o%2?"#fffaf0":je),n,s-.75+o*.3,1.86,a+.05).rotation.x=.25}function Nw(e){const{k:t,o:n}=e,i=n.lounge.map(r=>r.x),s=e.stage(3);if(s&&i.length){const r=Math.min(...i)-.5,c=Math.max(...i)+.5;for(let l=0;l<8;l++)t.add(t.style.box(c-r,.02,.3),t.mat([el,ln,Bn,Es][l%4]??ln),s,(r+c)/2,.035,.6+l*.3)}Sr(e,(r,c,l)=>{t.add(t.style.box(.58,.16,.58),t.mat(Dx[l%4]??je),r,(c.x0+c.x1)/2,.1,(c.z0+c.z1)/2)});const a=e.stage(8),o=n.lounge.map(r=>r.z);if(a&&i.length){const r=Math.min(...i)-n.x0<n.x0+n.W-Math.max(...i)?1:-1,c=r===1?n.x0:n.x0+n.W,l=(Math.min(...o)+Math.max(...o))/2,d=f=>c+r*f;for(const f of[-1.2,1.2])t.add(t.style.cylinder(.07,1.6),t.mat("#6b4a32"),a,d(.3),.8,l+f);t.add(t.style.box(.1,.1,2.6),t.mat("#6b4a32"),a,d(.3),1.6,l);for(const f of[-.7,.7])t.add(t.style.cylinder(.012,1),t.mat("#b08a3c"),a,d(.3),1.1,l+f);t.add(t.style.box(.45,.08,1.6),t.mat("#8a5a3c"),a,d(.3),.6,l),t.add(t.style.box(.06,.35,1.6),t.mat("#8a5a3c"),a,d(.11),.8,l)}}function Jf(e,t,n,i,s){const a=new Wt;a.position.set(n,0,i),a.scale.setScalar(s),t.add(a),e.add(e.style.cylinder(.17,1.1),e.mat("#7a6a58"),a,0,.55,0),e.add(e.style.ball(.6),e.mat(s0),a,0,1.35,0).scale.set(1.3,.6,1.1);const o=2+Re(`${n.toFixed(1)}${i.toFixed(1)}`)%3;for(let r=0;r<o;r++)e.add(e.style.cylinder(.025,1.2),e.mat("#8a7a68"),a,Math.cos(r*2.1)*.6,.6,Math.sin(r*2.1)*.45)}const Uw={1:(e,t,n)=>{e.add(e.style.box(.42,.42,.42),e.mat(Es),t,n.x,.21,n.z),e.add(e.style.box(.46,.05,.46),e.mat(je),t,n.x,.43,n.z),e0(e,t,n.x,n.z,Es,s0,.25)},2:(e,t,n,i)=>{for(let a=0;a<4;a++)e.add(e.style.cylinder(.035,.09),e.style.material("#e9d7b0",{opacity:.85}),t,n.x-.65+a*.12,.83,n.z-.22);const s=xi(i.o)[0];s&&Jf(e,t,s.x,s.z,.8+i.grow.garden*.06)},3:()=>{},4:(e,t,n)=>{const i=.04+e.style.pictureZ;e.add(e.style.box(1.7,.95,.05),e.mat("#8a5a3c"),t,n.x,1.05,i),e.add(e.style.box(1.55,.8,.02),e.mat("#2b3a2f"),t,n.x,1.05,i+.03);const s=Fs(Re("slate"));for(let a=0;a<4;a++)e.add(e.style.box(.4+s()*.6,.04,.01),e.mat("#fffaf0"),t,n.x-.3+s()*.2,1.3-a*.16,i+.05)},5:(e,t,n)=>{const i=.02+e.style.pictureZ;e.add(e.style.box(3.6,.8,.02),e.mat("#f3e2b8"),t,n.x,1.2,i),e.add(e.style.ball(.22),e.mat("#9a958c"),t,n.x-.6,1.15,i+.02).scale.set(1.4,.9,.1),e.add(e.style.ball(.12),e.mat("#9a958c"),t,n.x-.25,1.28,i+.02).scale.z=.1;for(let o=0;o<6;o++)e.add(e.style.ball(.07),e.mat(o%2?je:Bn),t,n.x+.3+o*.22,1.1+o%2*.15,i+.02).scale.z=.2;const a=n.x+2.4;e.add(e.style.box(.55,.22,.3),e.mat("#8a5a3c"),t,a,.11,.3);for(let o=0;o<6;o++)e.add(e.style.box(.07,.02,.1),e.mat(o%2?D.ink:"#fffaf0"),t,a-.2+o*.08,.23,.38)},6:(e,t,n,i)=>{e.add(e.style.cylinder(.22,.03),e.mat("#c9ccd3"),t,n.x+.45,.8,n.z-.15);for(let r=0;r<5;r++)e.add(e.style.cylinder(.05,.04),e.mat([ln,"#7cc26b",je,"#fffaf0","#a8764a"][r]??ln),t,n.x+.45+Math.cos(r*1.25)*.13,.83,n.z-.15+Math.sin(r*1.25)*.13);const o=i.o.columns.filter(r=>Math.abs(r.z-6)<1e-6).map(r=>r.x);if(o.length>1)for(let r=Math.min(...o);r<Math.max(...o);r+=.16)e.add(e.style.ball(.05),e.mat(Math.round(r*6)%3?je:ln),t,r,1.5-Math.abs(Math.sin((r-(o[0]??0))*1.85))*.2,6)},7:(e,t,n)=>{for(const[i,s]of[[-.45,-.45],[.45,-.45],[-.45,.45],[.45,.45]])e.add(e.style.cylinder(.06,1.1),e.mat(Es),t,n.x+i,.55,n.z+s);e.add(e.style.box(1.15,.1,1.15),e.mat("#c48f3a"),t,n.x,1.12,n.z),e.add(e.style.cap(.48,.5),e.mat(Es),t,n.x,1.17,n.z),Tn(e,t,.06,.25,ln,n.x,1.75,n.z)},8:(e,t,n,i)=>{for(const s of xi(i.o).slice(1))Jf(e,t,s.x,s.z,.8+i.grow.garden*.06)},9:(e,t,n)=>{Ul(e,t,n,"#8a5a3c","#efd19c");for(const[i,s]of[[-.35,-.35],[.35,-.35],[-.35,.35],[.35,.35]])e.add(e.style.cylinder(.04,.01),e.mat(D.ink),t,n.x+i,.39,n.z+s);for(let i=0;i<7;i++)e.add(e.style.cylinder(.03,.02),e.mat(i%2?D.ink:"#fffaf0"),t,n.x+Math.cos(i)*.08,.4,n.z+Math.sin(i)*.08)},10:(e,t,n)=>{for(let i=0;i<4;i++)e.add(e.style.box(1.6-i*.35,.06,1.6-i*.35),e.mat(i%2?"#d9b97c":"#c9a66c"),t,n.x,.05-i*.04,n.z);e.add(e.style.box(.5,.02,.5),e.style.material("#5aa9a0",{emissive:"#5aa9a0",ei:.1}),t,n.x,-.1,n.z)},11:(e,t,n)=>{for(const i of[-.8,.8])for(const s of[-.4,.4])e.add(e.style.cylinder(.03,1.2),e.mat("#8a7a68"),t,n.x+i,.6,n.z+s);e.add(e.style.box(1.6,1.1,.8),e.style.material("#fffaf0",{opacity:.25}),t,n.x,.6,n.z);for(let i=0;i<3;i++)e.add(e.style.cylinder(.015,.4),e.mat("#e9d7b0"),t,n.x-.6,.2,n.z-.06+i*.06)},12:(e,t,n)=>{n0(e,t,n,"#5aa9a0","#d9b97c");for(let i=0;i<5;i++)e.add(e.style.cylinder(.14,.01),e.mat("#4f8a3e"),t,n.x-.6+i*.3,.05,n.z+Math.sin(i*2)*.3),i%2===0&&e.add(e.style.ball(.07),e.mat("#fffaf0"),t,n.x-.6+i*.3,.1,n.z+Math.sin(i*2)*.3)},13:(e,t,n)=>{Fc(e,t,n,je,ln,2.6),Fc(e,t,{x:n.x-1.2,z:n.z+1.4},Bn,"#fffaf0",2.2),Fc(e,t,{x:n.x-.4,z:n.z+2.6},"#7b5fc0",ln,2.9)},14:(e,t,n)=>{Ar(e,t,n,(i,s)=>{e.add(e.style.ball(.16),i,t,n.x,s+.25,n.z).scale.set(1,1.3,.9),e.add(e.style.capsule(.05,.25),i,t,n.x,s+.5,n.z+.05),e.add(e.style.ball(.07),i,t,n.x,s+.68,n.z+.08);for(let a=0;a<7;a++){const o=e.add(e.style.box(.08,.55,.02),i,t,n.x+Math.sin((a-3)*.3)*.25,s+.45,n.z-.2);o.rotation.z=(a-3)*.3}})}};function Ow(e,t,n,i,s,a,o){if(e.add(e.style.box(.26,.3,.02),e.mat(o?D.gold:"#b08a3c"),t,n,i,s),e.add(e.style.box(.2,.24,.01),e.mat(o?"#d8e4ec":[Bn,"#7b5fc0",je,el][a%4]??Bn),t,n,i,s+.015),o)for(let r=0;r<3;r++)e.add(e.style.box(.05,.05,.01),e.mat(D.gold),t,n-.06+r*.06,i+r%2*.06,s+.02)}const Nx=(e,t)=>_i(e)[Math.min(t,14)]??e.door;function Fw(e){wr(e,e.k.pal.terrace,[je,"#fffaf0",Bn]),Tr(e,Uw,Nx);const t=_i(e.o)[4]?.x??e.o.x0+e.o.W/2;Er(e,{xa:t+1.1,xb:e.o.x0+e.o.W*.45-.6,y:1},Ow)}function Bw(e){const t=[je,ln,Bn][Re(e.name)%3]??je,n=e.add(new mr(.18,.08,8,18),e.mat(t),e.head,0,.13,-.01);n.rotation.x=Math.PI/2,n.scale.set(1.05,1,1.2),e.add(e.style.ball(.17),e.mat(t),e.head,0,.19,-.02).scale.y=.55}const Gw={id:"haveli",pal:Cw,shell:Iw,island:Dw,lounge:Nw,desk:(e,t,n)=>yr(e,t,n,{mat:Dx[Re(n)%4]}),mainDesk:e=>br(e,"#a0673f","#6b4a32"),tree:({k:e},t,n,i,s)=>{Jf(e,t,n,i,s)},growth:Fw,pieceAt:Nx,wear:Bw},a0="#2f7a4a",nl="#5fa84a",Ls="#2f5fa7",un="#e9c46a",il="#7cc26b",Hw="#5b3a7a",Zh=[["#2a9d8f",un,"#fffaf0"],[Ls,il,"#fffaf0"],["#f28c28",un,"#fffaf0"]],Vw=e=>Mr(e?mi:pi,{floor:Ht("#d8d2c6",e,.55),wall:Ht("#e8e4dc",e,.55),wallTop:Ht("#b9b3a8",e),desk:Ht("#8a5a3c",e,.95),deskTop:Ht("#a0673f",e,.95),island:un,islandTop:Ht("#fffaf0",e,.8),grass:Ht("#7fbf5a",e),dirt:Ht("#8a6a4a",e),terrace:Ht("#f3efe4",e,.55),plant:a0}),kw=e=>e.o;function Ux(e,t,n,i){e.add(e.style.cylinder(.18,.32),e.mat(un),t,n,.16,i);for(let s=0;s<6;s++){const a=e.add(e.style.ball(.2),e.mat(a0),t,n+Math.sin(s)*.18,.5+s%2*.15,i+Math.cos(s)*.18);a.scale.set(1.2,.3,.9),a.rotation.y=s}}function Ww(e){const{k:t,root:n}=e,i=kw(e),{x0:s,W:a,D:o}=i,r=t.pal.pendants;vr(t,n,i,Pi(t,t.pal.floor,a,o,2,(u,h)=>{u.fillStyle=Ht("#cfc8bb",r,.55),u.fillRect(0,0,h,1),u.fillRect(0,0,1,h)}));const c=Pi(t,Ht("#f3efe4",r,.6),a,1,2,(u,h)=>{u.fillStyle="#5c677d",u.beginPath(),u.moveTo(0,h);for(let m=0;m<=h;m+=2)u.lineTo(m,h*.55+Math.sin(m/h*Math.PI*2)*h*.2);u.lineTo(h,h),u.fill()});t.add(t.style.box(a,.02,1),c,n,s+a/2,.03,o-.5),t.add(t.style.box(a+.2,1.7,.2),t.mat(t.pal.wall),n,s+a/2,.85,-.1);const l=Pi(t,Ht("#e8e4dc",r,.55),a,1.6,.8,u=>{u.fillStyle=Ht("#6b8f71",r);for(let h=0;h<2;h++)for(let m=0;m<2;m++)u.beginPath(),u.arc(16+h*32,16+m*32,11,0,7),u.fill()});t.add(t.style.box(a,1.6,.02),l,n,s+a/2,.85,.01),t.add(t.style.box(.2,1,o+.2),t.mat(t.pal.wall),n,s-.1,.5,o/2);const d=Pi(t,"#f3f6fb",o,1,.5,(u,h)=>{u.strokeStyle=Ls,u.lineWidth=4,u.beginPath(),u.moveTo(h/2,6),u.lineTo(h-6,h/2),u.lineTo(h/2,h-6),u.lineTo(6,h/2),u.closePath(),u.stroke()});t.add(t.style.box(.02,.9,o),d,n,s+.01,.5,o/2);const f=i.lounge.map(u=>u.x);if(f.length){const u=Math.min(...f)-.7,h=Math.max(...f)+.7;for(const m of[u,h])t.add(t.style.cylinder(.05,1.95),t.mat("#d8d2c6"),n,m,.97,3);t.add(t.style.box(h-u+.2,.08,3.1),t.mat(Ht("#f3efe4",r,.7)),n,(u+h)/2,1.97,1.5)}for(const u of i.paths)for(let h=1;h<u.length-1;h+=3){const m=u[h];m&&Ux(t,n,m.x+.78,m.z+2.05)}t.add(t.style.ball(.13),t.mat("#fffaf0"),n,i.door.x-.8,.13,o-.6)}function Xw(e){const{k:t,root:n,o:i}=e,s=i.island,a=(s.x0+s.x1)/2;Hs(t,n,{x0:s.x0+.05,x1:s.x1-.05,z0:s.z0,z1:s.z1},.62,t.pal.island),Hs(t,n,{x0:s.x0-.05,x1:s.x1+.05,z0:s.z0-.05,z1:s.z1+.05},.07,t.pal.islandTop,.62),t.add(t.style.box(.25,.12,.25),t.mat(D.dark),n,a,.75,s.z0+.5),t.add(t.style.cylinder(.1,.3),t.style.material("#cfe8ee",{opacity:.7}),n,a,.95,s.z0+.5);for(const o of i.islandSpots)t.add(t.style.cylinder(.04,.6),t.mat(D.metal),n,o.x,.3,o.z),t.add(t.style.cylinder(.18,.06),t.mat(Ls),n,o.x,.62,o.z)}function $w(e){const{k:t}=e;Sr(e,(n,i,s)=>{const a=(i.x0+i.x1)/2,o=(i.z0+i.z1)/2,r=Zh[s%3]??Zh[0];if(s<4){t.add(t.style.cylinder(.01,1.2),t.mat("#b9b3a8"),n,a,1.35,o);const c=t.add(t.style.cap(.32,.5),t.mat(r[0]),n,a,.75,o);c.rotation.x=Math.PI;return}for(const c of[-.45,.45])t.add(t.style.cylinder(.04,1.2),t.mat("#d8d2c6"),n,a,.6,o+c);for(let c=0;c<7;c++){const l=c/6,d=t.add(t.style.box(.5,.04,.14),t.mat(r[c%3]??un),n,a,.75-Math.sin(l*Math.PI)*.35,o-.4+l*.8);d.rotation.x=-Math.cos(l*Math.PI)*.5}})}function Qf(e,t,n,i,s){const a=new Wt;if(a.position.set(n,0,i),a.scale.setScalar(s),t.add(a),Re(`${n.toFixed(1)}${i.toFixed(1)}`)%2){e.add(e.style.cylinder(.08,1.7),e.mat("#a0673f"),a,0,.85,0);for(let o=0;o<6;o++)e.add(e.style.box(.9,.04,.2),e.mat(nl),a,Math.cos(o)*.3,1.65,Math.sin(o)*.3).rotation.y=o;return}e.add(e.style.cylinder(.1,1.3),e.mat("#8a9a5a"),a,0,.65,0);for(let o=0;o<6;o++)e.add(e.style.box(.25,.03,1),e.mat(nl),a,Math.sin(o)*.35,1.4,Math.cos(o)*.35).rotation.set(.5*Math.cos(o),o,.5*Math.sin(o))}const qw={1:(e,t,n)=>{Ux(e,t,n.x,n.z)},2:(e,t,n,i)=>{for(let a=0;a<3;a++)e.add(e.style.cylinder(.09,.07),e.mat("#fffaf0"),t,n.x,.73,n.z-.5+a*.35),e.add(e.style.ball(.07),e.mat(Hw),t,n.x,.77,n.z-.5+a*.35).scale.y=.4;const s=xi(i.o)[0];s&&Qf(e,t,s.x,s.z,.8+i.grow.garden*.06)},3:()=>{},4:(e,t,n)=>{const i=.05+e.style.pictureZ;e.add(e.style.box(1.7,.95,.05),e.mat("#c9c3b6"),t,n.x,1.05,i),e.add(e.style.box(1.6,.85,.02),e.mat(D.paper),t,n.x,1.05,i+.03);for(let s=0;s<4;s++)e.add(e.style.box(.5+s%3*.2,.04,.01),e.mat(D.board[s]??D.marker),t,n.x-.3,1.3-s*.16,i+.05)},5:(e,t,n)=>{const i=.04+e.style.pictureZ;for(let a=0;a<10;a++)for(let o=0;o<3;o++)e.add(e.style.box(.34,.24,.02),e.mat((a+o)%2?"#f3f6fb":Ls),t,n.x-1.7+a*.36,.95+o*.26,i);const s=n.x+2.3;e.add(e.style.ball(.12),e.mat("#c98a3e"),t,s,.35,.3).scale.set(1,1.2,.4),e.add(e.style.box(.05,.4,.03),e.mat("#6b4a32"),t,s,.62,.3)},6:(e,t,n,i)=>{for(let s=0;s<6;s++)e.add(e.style.ball(.08),e.mat(["#f28c28",un,il][s%3]??un),t,n.x-.15+s%3*.15,.76+Math.floor(s/3)*.08,n.z+1.6);for(let s=0;s<6;s++){const a=i.o.x0-.4,o=2+s*(i.o.D/6);e.add(e.style.cylinder(.03,.7),e.mat(nl),t,a,.35,o);for(let r=0;r<3;r++)Tn(e,t,.06,.18,r%2?un:"#f28c28",a+.05,.55+r*.12,o).rotation.z=1.2}},7:(e,t,n)=>{e.add(e.style.cylinder(.04,1.8),e.mat("#8a5a3c"),t,n.x,.9,n.z),Tn(e,t,1,.45,"#d9b86a",n.x,1.9,n.z),Hs(e,t,{x0:n.x+.9,x1:n.x+1.6,z0:n.z-.3,z1:n.z+.3},.8,"#d9b86a");for(let i=0;i<4;i++)e.add(e.style.ball(.1),e.mat(il),t,n.x+1.05+i%2*.3,.9,n.z-.12+Math.floor(i/2)*.24)},8:(e,t,n,i)=>{for(const s of xi(i.o).slice(1))Qf(e,t,s.x,s.z,.8+i.grow.garden*.06)},9:(e,t,n)=>{e.add(e.style.box(2.2,.02,1.3),e.mat("#5fb35a"),t,n.x,.02,n.z),e.add(e.style.box(.03,.01,1.2),e.mat("#fffaf0"),t,n.x,.04,n.z);for(const i of[-1,1]){for(const s of[-.3,.3])e.add(e.style.box(.04,.4,.04),e.mat("#fffaf0"),t,n.x+i*1.05,.2,n.z+s);e.add(e.style.box(.04,.04,.64),e.mat("#fffaf0"),t,n.x+i*1.05,.4,n.z)}e.add(e.style.ball(.09),e.mat("#fffaf0"),t,n.x+.3,.09,n.z+.2)},10:(e,t,n)=>{for(let i=0;i<3;i++){const s=e.add(e.style.cylinder(.55,.04),e.style.material("#6cb4ee",{emissive:"#6cb4ee",ei:.1}),t,n.x+Math.sin(i*2.1)*.35,.02,n.z-.5+i*.5);s.scale.x=1.2}},11:(e,t,n)=>{e.add(e.style.cylinder(.25,.45),e.mat("#c9ccd3"),t,n.x,.23,n.z),e.add(e.style.cylinder(.26,.03),e.mat("#fffaf0"),t,n.x,.47,n.z),e.add(e.style.cylinder(.16,.25),e.mat(Ls),t,n.x+.5,.13,n.z+.2),e.add(e.style.cylinder(.14,.04),e.mat(un),t,n.x-.45,.3,n.z+.25).rotation.x=1.2},12:(e,t,n)=>{n0(e,t,n,"#5aa9a0","#cfc8bb");for(let i=0;i<4;i++)e.add(e.style.cylinder(.3,.02),e.mat(nl),t,n.x-.5+i*.35,.05,n.z+Math.sin(i*2)*.25)},13:(e,t,n)=>{Fc(e,t,n,"#f28c28",Ls,2.8)},14:(e,t,n)=>{Ar(e,t,n,(i,s)=>{e.add(e.style.cylinder(.12,.1),i,t,n.x,s+.05,n.z),e.add(e.style.cylinder(.04,.3),i,t,n.x,s+.25,n.z),e.add(e.style.cap(.22,.5),i,t,n.x,s+.42,n.z).rotation.x=Math.PI;for(const a of[-1,1])e.add(e.style.box(.05,.2,.05),i,t,n.x+a*.25,s+.55,n.z)})}};function Yw(e,t,n,i,s,a,o){e.add(e.style.box(.28,.28,.02),e.mat(o?D.gold:["#2a9d8f",un,Ls,"#f28c28"][a%4]??un),t,n,i,s);const r=e.add(e.style.cylinder(.1,.01),e.mat(o?D.gold:D.dark),t,n+.06,i,s+.015);r.rotation.x=Math.PI/2}const Ox=(e,t)=>_i(e)[Math.min(t,14)]??e.door;function Zw(e){wr(e,e.k.pal.terrace,["#2a9d8f",un,"#fffaf0"]),Tr(e,qw,Ox);const t=_i(e.o)[4]?.x??e.o.x0+e.o.W/2,n=Math.min(...e.o.lounge.map(i=>i.x));Er(e,{xa:t+1.1,xb:n-1,y:1.45},Yw)}function Kw(e){for(const t of e.legs)e.add(e.style.box(.15,.06,.24),e.mat(il),t,0,-.29,.04),e.add(e.style.box(.16,.02,.25),e.mat(un),t,0,-.32,.04)}const Jw={id:"tropical",pal:Vw,shell:Ww,island:Xw,lounge:$w,desk:(e,t,n)=>yr(e,t,n,{thing:(i,s,a)=>{a%4===1&&e0(i,s,-.5,.4,un,a0,.2)}}),mainDesk:e=>br(e,"#a0673f","#6b4a32"),tree:({k:e},t,n,i,s)=>{Qf(e,t,n,i,s)},growth:Zw,pieceAt:Ox,wear:Kw},ke="#2f5fa7",Oe="#fbfaf6",o0="#8a9a6a",Kh="#c9a66c",Qw="#6b9f3a",jf="#3d8fd1",jw=e=>Mr(e?mi:pi,{floor:Ht("#e8e2d4",e,.55),wall:Ht(Oe,e,.55),wallTop:Ht("#e8e4dc",e,.55),desk:Ht(ke,e,.9),deskTop:Ht(Oe,e,.75),island:ke,islandTop:Ht(Oe,e,.75),grass:Ht("#d8c9a0",e),dirt:Ht("#b39a72",e),terrace:Ht("#ece6d8",e,.6),plant:o0}),Fx=e=>e.o;function t3(e,t,n,i,s,a){const o=e.mat(e.pal.wall),r=e.mat(Ht(ke,e.pal.pendants)),c=s/2,l=i-.55;e.add(e.style.box(s+.1,.02,2.6),e.mat(Ht("#f7f4ec",e.pal.pendants,.6)),t,n,.035,i+.65),e.add(e.style.box(s+.1,1.5,.22),o,t,n,.75,l),e.add(e.style.box(.22,1.2,2.4),o,t,n-c-.05,.6,i+.65),e.add(e.style.box(.5,.45,.04),r,t,n+c-.6,1,l+.12),e.add(e.style.box(.04,.85,.5),r,t,n-c+.08,.45,i+1.3),a&&(e.add(e.style.cylinder(.55,.35),o,t,n-c+.8,1.65,l),e.add(e.style.cap(.55,.5),r,t,n-c+.8,1.82,l),e.add(e.style.box(.05,.3,.05),e.mat("#e9c46a"),t,n-c+.8,2.5,l))}function e3(e){const{k:t,root:n}=e,i=Fx(e),{x0:s,W:a,D:o}=i,r=t.pal.pendants,c=t.add(t.style.box(90,.02,90),t.style.material(r?"#16304a":jf),n,s+a/2,-1.4,o/2);c.receiveShadow=!1,vr(t,n,i,Pi(t,t.pal.floor,a,o,1.5,(d,f)=>{for(let u=0;u<40;u++)d.fillStyle=u%3?Ht(Oe,r,.6):"#5c677d",d.beginPath(),d.ellipse(u*37%f,u*53%f,4,2.5,u,0,7),d.fill()})),t.add(t.style.box(a+.2,.8,.25),t.mat(t.pal.wall),n,s+a/2,.4,-.12),t.add(t.style.box(.25,.8,o+.2),t.mat(t.pal.wall),n,s-.12,.4,o/2),i.cubes.forEach((d,f)=>{t3(t,n,d.x,d.z,d.w,f===0)});const l=[...i.desks.values()].sort((d,f)=>d.z-f.z||d.x-f.x)[0];l&&(t.add(t.style.ball(.16),t.mat("#e9a65c"),n,l.x+.45,.62,l.z+.75).scale.set(1.4,.6,1),t.add(t.style.ball(.08),t.mat("#e9a65c"),n,l.x+.65,.66,l.z+.75));for(const d of[-.6,.6])t.add(t.style.box(.12,.9,.12),t.mat(t.pal.wall),n,i.door.x+d,.45,o-.05)}function n3(e){const{k:t,root:n}=e,i=Fx(e);for(const r of i.posts)t.add(t.style.cylinder(.07,2.1),t.mat(Oe),n,r.x,1.05,r.z);const s=i.posts.map(r=>r.x),a=i.posts.map(r=>r.z),o=(Math.min(...s)+Math.max(...s))/2;for(let r=Math.min(...a);r<=Math.max(...a);r+=.18)t.add(t.style.box(2.4,.03,.08),t.mat(Kh),n,o,2.12,r);for(const r of i.tables){const c=(r.x0+r.x1)/2,l=(r.z0+r.z1)/2;t.add(t.style.cylinder(.42,.05),t.mat(Oe),n,c,.55,l),t.add(t.style.cylinder(.05,.55),t.mat(D.dark),n,c,.27,l)}for(const r of i.islandSpots){const c=new Wt;c.position.set(r.x,0,r.z),c.rotation.y=r.face,n.add(c),t.add(t.style.box(.38,.06,.38),t.mat(Kh),c,0,.32,0),t.add(t.style.box(.38,.4,.05),t.mat(ke),c,0,.52,-.18);for(const l of[-.16,.16])for(const d of[-.16,.16])t.add(t.style.box(.04,.3,.04),t.mat(ke),c,l,.15,d)}}function i3(e){const{k:t,o:n}=e,i=n.lounge.map(a=>a.x),s=e.stage(3);if(s&&i.length){const a=Math.min(...i)-.5,o=Math.max(...i)+.5;t.add(t.style.box(o-a,.3,.45),t.mat(t.pal.wall),s,(a+o)/2,.15,.3)}Sr(e,(a,o)=>{t.add(t.style.box(.7,.12,.5),t.mat(ke),a,(o.x0+o.x1)/2,.08,(o.z0+o.z1)/2),t.add(t.style.box(.5,.2,.1),t.mat(Oe),a,(o.x0+o.x1)/2,.22,o.z0+.05)})}function tu(e,t,n,i,s){const a=new Wt;a.position.set(n,0,i),a.scale.setScalar(s),t.add(a);const o=(Re(`${n.toFixed(1)}${i.toFixed(1)}`)%9-4)*.05;e.add(e.style.cylinder(.1,.8),e.mat("#6b5a48"),a,0,.4,0).rotation.z=o,e.add(e.style.ball(.55),e.mat(o0),a,o*.6,1.1,0).scale.set(1.2,.7,1)}const s3={1:(e,t,n)=>{e0(e,t,n.x,n.z,Oe,"#5fb35a",.3)},2:(e,t,n,i)=>{e.add(e.style.box(.2,.08,.14),e.mat(Oe),t,n.x-.1,.62,n.z);for(let a=0;a<5;a++)e.add(e.style.ball(.035),e.mat("#4b3f2a"),t,n.x+.12+a%3*.06,.6,n.z-.05+Math.floor(a/3)*.08);const s=xi(i.o)[0];s&&tu(e,t,s.x,s.z,.8+i.grow.garden*.06)},3:()=>{},4:(e,t,n)=>{const i=.13+e.style.pictureZ;e.add(e.style.box(1.7,.6,.05),e.mat(ke),t,n.x,.5,i),e.add(e.style.box(1.55,.48,.02),e.mat(Oe),t,n.x,.5,i+.03);for(let s=0;s<3;s++)e.add(e.style.box(.5+s*.25,.04,.01),e.mat(D.board[s]??ke),t,n.x-.3,.65-s*.13,i+.05)},5:(e,t,n)=>{for(let a=0;a<12;a++)e.add(e.style.box(.18,.04,.02),e.mat(ke),t,n.x-2+a*.36,.72,.02),e.add(e.style.box(.04,.14,.02),e.mat(ke),t,n.x-1.93+a*.36,.66,.02);const s=n.x+2.4;e.add(e.style.ball(.14),e.mat("#c98a3e"),t,s,.3,.3).scale.set(1,1.2,.5),e.add(e.style.box(.05,.55,.03),e.mat("#6b4a32"),t,s,.7,.3)},6:(e,t,n,i)=>{for(let a=0;a<4;a++)e.add(e.style.ball(.06),e.mat("#5b3a7a"),t,n.x+Math.cos(a*1.6)*.1,.6,n.z+2.1+Math.sin(a*1.6)*.1);const s=i.o;for(let a=0;a<14;a++)e.add(e.style.ball(.05),e.mat(a%3?"#fffaf0":"#7cc26b"),t,s.x0+.5+a*(s.W/14),.82,-.05)},7:(e,t,n,i)=>{const s=i.o,a=s.posts.map(c=>c.x),o=s.posts.map(c=>c.z),r=(Math.min(...a)+Math.max(...a))/2;for(let c=0;c<9;c++)e.add(e.style.ball(.22),e.mat(Qw),t,r-.9+c%3*.9,2.2,Math.min(...o)+.4+Math.floor(c/3)*1.4).scale.y=.5;for(let c=0;c<4;c++)e.add(e.style.ball(.05),e.mat("#5b3a7a"),t,r-.6+c*.4,2.05,Math.min(...o)+1.2+c*.5)},8:(e,t,n,i)=>{e.add(e.style.box(1,.9,1),e.mat(i.k.pal.wall),t,n.x,.45,n.z),e.add(e.style.box(.3,.5,.02),e.mat(ke),t,n.x,.25,n.z+.51);for(const s of xi(i.o).slice(1))tu(e,t,s.x,s.z,.8+i.grow.garden*.06)},9:(e,t,n)=>{Ul(e,t,n,"#8a5a3c","#e8d6b0");for(let i=0;i<6;i++)Tn(e,t,.04,.2,i%2?Oe:D.dark,n.x-.25+i*.1,.39,n.z-.2).rotation.x=Math.PI/2},10:(e,t,n)=>{e.add(e.style.cylinder(.45,.6),e.mat(Oe),t,n.x,.3,n.z),e.add(e.style.cylinder(.4,.05),e.mat(ke),t,n.x,.62,n.z)},11:(e,t,n,i)=>{e.add(e.style.box(1.4,1,1.2),e.mat(i.k.pal.wall),t,n.x,.5,n.z),e.add(e.style.box(1,.8,.9),e.mat(i.k.pal.wall),t,n.x+.1,1.4,n.z-.05),e.add(e.style.box(.3,.45,.02),e.mat(ke),t,n.x+.1,1.3,n.z+.41);for(let s=0;s<5;s++)e.add(e.style.box(.35,.2,.2),e.mat(Oe),t,n.x-.85,.1+s*.2,n.z+.5-s*.2)},12:(e,t,n)=>{e.add(e.style.box(1.8,.08,.4),e.mat("#c49a6c"),t,n.x,.05,n.z),e.add(e.style.box(1.2,.25,.45),e.mat(ke),t,n.x-.2,.15,n.z+.6).scale.set(1,1,1),e.add(e.style.box(1.1,.06,.4),e.mat(Oe),t,n.x-.2,.3,n.z+.6),e.add(e.style.box(.04,.6,.04),e.mat("#6b4a32"),t,n.x-.1,.6,n.z+.6)},13:(e,t,n)=>{e.add(e.style.cylinder(.5,1.6),e.mat(Oe),t,n.x,.8,n.z),Tn(e,t,.6,.45,"#a8764a",n.x,1.82,n.z);const i=new Wt;i.position.set(n.x,1.7,n.z+.55),t.add(i);for(let s=0;s<6;s++){const a=new Wt;a.rotation.z=s*Math.PI/3,i.add(a),e.add(e.style.box(.06,.9,.02),e.mat("#6b4a32"),a,0,.45,0),e.add(e.style.box(.22,.5,.01),e.mat(Oe),a,.12,.6,0)}},14:(e,t,n)=>{Ar(e,t,n,(i,s)=>{e.add(e.style.ball(.22),i,t,n.x,s+.3,n.z).scale.set(1,1.3,1),e.add(e.style.cylinder(.07,.25),i,t,n.x,s+.65,n.z);for(const a of[-1,1])e.add(e.style.box(.04,.2,.04),i,t,n.x+a*.12,s+.62,n.z)})}};function a3(e,t,n,i,s,a,o){e.add(e.style.box(.28,.24,.02),e.mat(o?D.gold:ke),t,n,i,s),e.add(e.style.box(.2,.16,.01),e.mat(o?"#e9c46a":[jf,"#e9c46a",o0,Oe][a%4]??jf),t,n,i,s+.015)}const Bx=(e,t)=>{const n=_i(e);if(t===2||t===6){const i=e.tables[0];if(i)return{x:(i.x0+i.x1)/2,z:(i.z0+i.z1)/2}}return n[Math.min(t,14)]??e.door};function o3(e){wr(e,e.k.pal.terrace,[ke,Oe]),Tr(e,s3,Bx);const t=_i(e.o)[4]?.x??e.o.x0+e.o.W/2;Er(e,{xa:t+1.1,xb:e.o.mainDesk.x-.6,y:.95},a3)}function r3(e){e.add(e.style.cylinder(.21,.12),e.mat("#2b3a67"),e.head,0,.2,0),e.add(e.style.box(.24,.025,.12),e.mat("#1d1a17"),e.head,0,.15,.2)}const c3={id:"cyclades",pal:jw,shell:e3,island:n3,lounge:i3,desk:(e,t,n)=>yr(e,t,n,{chair:ke}),mainDesk:e=>br(e,Oe,ke),tree:({k:e},t,n,i,s)=>{tu(e,t,n,i,s)},growth:o3,pieceAt:Bx,wear:r3},Vs="#d9b86a",Qe="#6b4a32",eu="#9a8a78",Gx="#7a9a4a",nu=[["#2a9d8f","#e9c46a"],["#f28c28","#2f5fa7"],["#7b5fc0","#e9c46a"]],iu=["#2a9d8f","#f28c28","#e9c46a","#7b5fc0"],l3=e=>Mr(e?mi:pi,{floor:Ht("#dfaa72",e,.62),wall:Ht("#c98a4e",e),wallTop:Ht("#b07a42",e),desk:Ht(Qe,e,1.2),deskTop:Ht("#8a5a3c",e,1.2),island:Qe,islandTop:"#8a5a3c",grass:Ht("#c9a35a",e),dirt:Ht("#9a6a3e",e),terrace:Ht("#d9b07a",e),plant:Gx}),Hx=e=>e.o;function r0(e,t,n,i,s,a,o){for(let r=0;r<5;r++)e.add(e.style.box(s,.02,a/5),e.mat(r%2?o:Vs),t,n,.035,i-a/2+(r+.5)*(a/5))}function Vx(e,t,n,i,s,a){for(const o of[n,i])for(const r of[s,a])e.add(e.style.cylinder(.08,2),e.mat(Qe),t,o,1,r);for(let o=s;o<=a+.01;o+=1.8)e.add(e.style.cylinder(.018,i-n+.4),e.mat("#b08a5a"),t,(n+i)/2,2.02,o).rotation.z=Math.PI/2;for(let o=0;o<3;o++)e.add(e.style.box(i-n,.03,.4),e.mat(Vs),t,(n+i)/2,2.06,s+.5+o*(a-s-1)/2)}function Jh(e,t){const n=e.lounge.find(i=>Math.abs(i.x-t)<.6);return n?n.x+(t>=n.x?1:-1)*Math.abs(n.ax-n.x):t}function d3(e){const{k:t,root:n}=e,i=Hx(e),{x0:s,W:a,D:o,hangar:r}=i,c=t.pal.pendants;vr(t,n,i,Pi(t,t.pal.floor,a,o,2,(h,m)=>{h.fillStyle=Ht("#d39a62",c,.62);for(let _=0;_<9;_++)h.fillRect(_*23%m,_*41%m,6,3)}));const l=t.mat(t.pal.wall);t.add(t.style.box(a+.2,1.5,.4),l,n,s+a/2,.75,-.2),t.add(t.style.box(.4,1.2,o+.2),l,n,s-.2,.6,o/2);for(let h=s+.6;h<s+a;h+=.9)t.add(t.style.cylinder(.035,.5),t.mat(Qe),n,h,1.2,.05).rotation.x=Math.PI/2;for(let h=s;h<=s+a+.01;h+=a/4)t.add(t.style.box(.55,1.8,.6),l,n,Jh(i,h),.9,-.15),Tn(t,n,.25,.5,t.pal.wall,Jh(i,h),2.05,-.15);Vx(t,n,r.x0,r.x1,r.z0,r.z1);for(const h of i.desks.values())r0(t,n,h.x,h.z+.3,1.6,1.4,iu[Re(`${h.x}`)%4]??Vs);for(const[h,m]of[[s+a-.9,5],[s+a-.9,6.3]])t.add(t.style.cylinder(.4,1),l,n,h,.5,m),Tn(t,n,.55,.55,Vs,h,1.27,m);for(let h=0;h<3;h++)t.add(t.style.ball(.2),t.mat("#a8764a"),n,i.door.x+.8+h*.45,.2,o-.25).scale.y=1.1;const d=i.tree.x-1.8,f=i.tree.x+1.8,u=4.6;for(const h of[d,f])t.add(t.style.cylinder(.04,1.6),t.mat(Qe),n,h,.8,u);t.add(t.style.cylinder(.008,f-d),t.mat(D.dark),n,(d+f)/2,1.55,u).rotation.z=Math.PI/2,nu.forEach(([h,m],_)=>{t.add(t.style.box(.9,.7,.01),t.mat(h),n,d+.75+_*1.1,1.15,u);for(let x=0;x<4;x++)t.add(t.style.box(.12,.12,.01),t.mat(m),n,d+.55+_*1.1+x%2*.4,1+Math.floor(x/2)*.3,u+.01)})}function f3(e){const{k:t,root:n}=e,i=Hx(e),{x:s,z:a}=i.tree,o=e.grow.stage>=8;t.add(t.style.cylinder(o?.7:.55,2),t.mat(eu),n,s,1,a);for(let l=0;l<5;l++){const d=l*1.3;t.add(t.style.cylinder(.1,1.1),t.mat(eu),n,s+Math.sin(d)*.5,2.3,a+Math.cos(d)*.5).rotation.set(Math.cos(d)*.7,0,-Math.sin(d)*.7);const u=e.grow.garden>=3?"#6b9f3a":"#8a9a5a";t.add(t.style.ball(o?.45:.35),t.mat(u),n,s+Math.sin(d)*1,2.75,a+Math.cos(d)*1).scale.y=.55}const r=s+.55,c=a+.55;t.add(t.style.cylinder(.14,.2),t.mat(D.dark),n,r,.1,c),t.add(t.style.cylinder(.11,.03),t0(t,"#f28c28",1.6),n,r,.21,c),t.add(t.style.ball(.08),t.mat("#5c677d"),n,r,.3,c);for(const l of i.islandSpots)t.add(t.style.cylinder(.15,.2),t.mat(Qe),n,l.x+Math.sin(l.face)*.05,.1,l.z+Math.cos(l.face)*.05)}function u3(e){const{k:t}=e;Sr(e,(n,i,s)=>{const a=(i.x0+i.x1)/2,o=(i.z0+i.z1)/2;r0(t,n,a,o,.75,.6,iu[s%4]??Vs),t.add(t.style.capsule(.07,.4),t.mat(iu[(s+1)%4]??Vs),n,a,.1,i.z0+.05).rotation.z=Math.PI/2})}function su(e,t,n,i,s){const a=new Wt;if(a.position.set(n,0,i),a.scale.setScalar(s),t.add(a),Re(`${n.toFixed(1)}${i.toFixed(1)}`)%2){e.add(e.style.cylinder(.3,1.1),e.mat(eu),a,0,.55,0),e.add(e.style.ball(.45),e.mat("#8a9a5a"),a,0,1.35,0).scale.y=.5;return}e.add(e.style.cylinder(.06,1),e.mat(Qe),a,0,.5,0),e.add(e.style.ball(.6),e.mat(Gx),a,0,1.15,0).scale.set(1.3,.3,1.3)}const h3={1:(e,t,n)=>{e.add(e.style.cap(.22,.6),e.mat("#c98a3e"),t,n.x,.25,n.z).rotation.x=Math.PI;for(let i=0;i<5;i++)e.add(e.style.ball(.08),e.mat("#5fb35a"),t,n.x+Math.cos(i*1.3)*.1,.3,n.z+Math.sin(i*1.3)*.1)},2:(e,t,n,i)=>{const{x:s,z:a}=i.o.tree;e.add(e.style.cylinder(.22,.05),e.mat(Vs),t,s-.5,.05,a+.55);for(let r=0;r<4;r++)e.add(e.style.ball(.07),e.mat(r%2?"#e9c46a":"#f28c28"),t,s-.5+Math.cos(r*1.6)*.1,.11,a+.55+Math.sin(r*1.6)*.1).scale.set(1.2,.9,.9);const o=xi(i.o)[0];o&&su(e,t,o.x,o.z,.8+i.grow.garden*.06)},3:()=>{},4:(e,t,n)=>{const i=e.add(e.style.box(1.4,.9,.05),e.mat("#2b3a2f"),t,n.x,.45,.3);i.rotation.x=-.15,e.add(e.style.box(1.5,.06,.08),e.mat(Qe),t,n.x,.03,.36)},5:(e,t,n)=>{const i=.03+e.style.pictureZ;e.add(e.style.box(2.6,1,.02),e.mat("#6b4a32"),t,n.x,1,i);for(let a=0;a<12;a++)e.add(e.style.box(.14,.14,.01),e.mat("#e8d6b0"),t,n.x-1.1+a%6*.44,.75+Math.floor(a/6)*.5,i+.015);const s=n.x+2.4;e.add(e.style.ball(.22),e.mat("#c98a3e"),t,s,.25,.4).scale.z=.6,e.add(e.style.cylinder(.025,1.1),e.mat(Qe),t,s,.8,.35).rotation.x=-.2},6:(e,t,n,i)=>{const{x:s,z:a}=i.o.tree;e.add(e.style.box(.4,.04,.25),e.mat("#b08a3c"),t,s+.95,.2,a+.3);for(let o=0;o<3;o++)e.add(e.style.cylinder(.025,.07),e.style.material("#cfe8c3",{opacity:.8}),t,s+.83+o*.12,.26,a+.3)},7:(e,t,n)=>{Vx(e,t,n.x-1,n.x+1,n.z-.6,n.z+.6),r0(e,t,n.x,n.z,1.6,1,"#2a9d8f")},8:(e,t,n,i)=>{for(const s of xi(i.o).slice(1))su(e,t,s.x,s.z,.8+i.grow.garden*.06)},9:(e,t,n)=>{e.add(e.style.box(1,.12,.35),e.mat(Qe),t,n.x,.06,n.z);for(let i=0;i<12;i++){const s=n.x-.4+i%6*.16,a=n.z-.08+Math.floor(i/6)*.16;e.add(e.style.cylinder(.05,.02),e.mat("#3b2a1e"),t,s,.13,a),e.add(e.style.ball(.02),e.mat("#e8d6b0"),t,s,.15,a)}},10:(e,t,n)=>{e.add(e.style.cylinder(.45,.55),e.mat("#c98a4e"),t,n.x,.27,n.z),e.add(e.style.cylinder(.32,.02),e.mat("#2b3a4a"),t,n.x,.56,n.z);for(const i of[-1,1])e.add(e.style.cylinder(.04,1.2),e.mat(Qe),t,n.x+i*.45,.6,n.z);e.add(e.style.cylinder(.03,1),e.mat(Qe),t,n.x,1.2,n.z).rotation.z=Math.PI/2,e.add(e.style.cylinder(.1,.06),e.mat(D.metal),t,n.x,1.15,n.z).rotation.x=Math.PI/2},11:(e,t,n)=>{Ul(e,t,n,Qe,"#8a5a3c"),e.add(e.style.box(.35,.18,.15),e.mat(D.dark),t,n.x-.1,.48,n.z),e.add(e.style.box(.08,.12,.12),e.mat(D.dark),t,n.x+.12,.62,n.z),e.add(e.style.cylinder(.08,.5),e.mat("#2a9d8f"),t,n.x+.25,.47,n.z+.25).rotation.z=Math.PI/2},12:(e,t,n)=>{const i=e.add(e.style.box(3.2,.03,.9),e.style.material("#5aa9a0",{emissive:"#5aa9a0",ei:.1}),t,n.x,.02,n.z);i.rotation.y=.3;const s=e.add(e.style.capsule(.14,.9),e.mat(Qe),t,n.x+.2,.1,n.z);s.rotation.z=Math.PI/2,s.scale.y=1,s.rotation.y=.3},13:(e,t,n)=>{for(let i=0;i<3;i++){const s=n.x-i*.7,a=2.6+i*.25,o=n.z+i*.6;e.add(e.style.capsule(.06,.25),e.mat("#fffaf0"),t,s,a,o).rotation.z=Math.PI/2;for(const r of[-1,1])e.add(e.style.box(.05,.02,.35),e.mat(D.dark),t,s,a+.03,o+r*.2);e.add(e.style.box(.12,.02,.02),e.mat("#f28c28"),t,s+.25,a,o)}},14:(e,t,n)=>{Ar(e,t,n,(i,s)=>{e.add(e.style.cylinder(.1,.25),i,t,n.x,s+.12,n.z),e.add(e.style.cap(.22,.55),i,t,n.x,s+.25,n.z).rotation.x=Math.PI,e.add(e.style.cylinder(.22,.25),i,t,n.x,s+.42,n.z)})}};function p3(e,t,n,i,s,a,o){e.add(e.style.box(.26,.32,.02),e.mat(o?D.gold:D.dark),t,n,i,s),e.add(e.style.box(.2,.26,.01),e.mat(a%2?"#d8d2c6":"#9a958c"),t,n,i,s+.015),e.add(e.style.ball(.05),e.mat(a%2?"#3a3530":"#1d1a17"),t,n,i+.04,s+.02).scale.z=.2,e.add(e.style.box(.1,.08,.01),e.mat(a%2?"#3a3530":"#1d1a17"),t,n,i-.06,s+.02)}const kx=(e,t)=>{const n=e.tree;return t===2||t===6?n:t===9?{x:n.x,z:n.z-2.4}:_i(e)[Math.min(t,14)]??e.door};function m3(e){wr(e,e.k.pal.terrace,["#2a9d8f","#e9c46a","#f28c28"]),Tr(e,h3,kx);const t=_i(e.o)[4]?.x??e.o.x0+e.o.W/2;Er(e,{xa:t+1.1,xb:e.o.mainDesk.x-.6,y:1.25},p3)}function x3(e){const t=Re(e.name),[n,i]=nu[t%3]??nu[0];e.add(e.style.capsule(.06,.3),e.mat(n),e.body,0,.74,.12).rotation.z=Math.PI/2;for(let s=0;s<3;s++)e.add(e.style.ball(.03),e.mat(i),e.body,-.12+s*.12,.76,.18)}const g3={id:"sahel",pal:l3,shell:d3,island:f3,lounge:u3,desk:(e,t,n)=>yr(e,t,n,{chair:Qe}),mainDesk:e=>br(e,"#8a5a3c",Qe),tree:({k:e},t,n,i,s)=>{su(e,t,n,i,s)},growth:m3,pieceAt:kx,wear:x3},Jn={flat:0,funbox:0,qp:0,curb:3,rail:5,ramp:7,stairs:9,ledge:9,bowl:11,vert:13},Oa=(e,t)=>Jn[t]<=e&&!(t==="qp"&&e>=Jn.vert),c0=(e,t)=>t>=Jn.vert?e.qp.r13:e.qp.r,au=(e,t)=>{const n=Math.max(0,Math.min(t,e));return t-Math.sqrt(Math.max(0,t*t-n*n))};function sl(e,t){const{xa:n,xb:i,r:s}=e.ramp;return t<n+s?au(n+s-t,s):t>i-s?au(t-(i-s),s):0}function Ol(e,t,n){const i=Math.abs(t-e.x)-(e.hw-e.rc),s=Math.abs(n-e.z)-(e.hd-e.rc);return e.rc-Math.hypot(Math.max(i,0),Math.max(s,0))-Math.min(Math.max(i,s),0)}function Wx(e,t){if(t<=0)return 0;if(t>=e.depth)return-e.depth;const n=e.depth-t;return-Math.sqrt(e.depth*e.depth-n*n)}function al(e,t,n){const i=Math.cos(n),s=Math.sin(n);let a=0,o=Math.max(e.hw,e.hd);for(let r=0;r<24;r++){const c=(a+o)/2;Ol(e,e.x+i*c,e.z+s*c)>t?a=c:o=c}return{x:e.x+i*a,z:e.z+s*a}}const mo=(e,t)=>({box:e,top:t,flat:!1}),xo=(e,t)=>({box:e,top:()=>t,flat:!0}),Xx=.55,ou={curb:.35,rail:.05,ledge:.6};function _3(e,t){const n=[];for(const o of e.poles)n.push(xo({x0:o.x-.05,x1:o.x+.05,z0:o.z-.05,z1:o.z+.05},3));for(const o of e.benches)n.push(xo(o,.35));const i=e.funbox;n.push(mo({x0:i.x-i.hw-i.run,x1:i.x+i.hw+i.run,z0:i.z-i.hd,z1:i.z+i.hd},o=>{const r=Math.abs(o-i.x);return r<=i.hw?i.h:i.h*Math.max(0,1-(r-i.hw)/i.run)}));const s=e.qp,a=c0(e,t);n.push(mo({x0:s.x0,x1:s.x1,z0:s.zLip-Xx,z1:s.zLip+a},(o,r)=>r<=s.zLip?a:au(s.zLip+a-r,a)));for(const o of["curb","rail","ledge"]){if(!Oa(t,o))continue;const r=e[o];n.push(xo({x0:r.x0,x1:r.x1,z0:r.z-ou[o]/2,z1:r.z+ou[o]/2},r.h))}if(Oa(t,"ramp")){const o=e.ramp;n.push(mo({x0:o.xa-.6,x1:o.xb+.6,z0:o.z0,z1:o.z1},r=>r<=o.xa||r>=o.xb?o.r:sl(e,r)))}if(Oa(t,"stairs")){const o=e.stairs;n.push(xo({x0:o.x0,x1:o.bankX0,z0:o.z0,z1:o.z1},o.h)),n.push(mo({x0:o.bankX0,x1:o.xTop,z0:o.z0,z1:o.bankZ},(l,d)=>d<=o.z1?o.h:o.h*(o.bankZ-d)/(o.bankZ-o.z1)));const r=(o.xBottom-o.xTop)/4;for(let l=0;l<4;l++)n.push(xo({x0:o.xTop+r*l,x1:o.xTop+r*(l+1),z0:o.z0,z1:o.z1},o.h-(l+1)*(o.h/5)));const c=$x(o);n.push(mo({x0:o.xTop,x1:o.xBottom,z0:o.railZ-.03,z1:o.railZ+.03},l=>c.top+(c.low-c.top)*(l-o.xTop)/(o.xBottom-o.xTop)))}return n}const $x=e=>({top:e.h+.4,low:.55}),Qh=(e,t,n)=>Math.max(t,Math.min(n,e));function qx(e,t,n,i,s){let a=Oa(t,"bowl")?Wx(e.bowl,Ol(e.bowl,n,i)):0;for(const o of jx(e,t)){const r=o.box;n<r.x0-s||n>r.x1+s||i<r.z0-s||i>r.z1+s||(a=Math.max(a,o.top(Qh(n,r.x0,r.x1),Qh(i,r.z0,r.z1))))}return a}const Qn=(e,t,n,i)=>qx(e,t,n,i,0);function cc(e,t,n,i){let s=Oa(t,"bowl")?Wx(e.bowl,Ol(e.bowl,n,i)):0;for(const a of jx(e,t)){const o=a.box;a.flat||n<o.x0||n>o.x1||i<o.z0||i>o.z1||(s=Math.max(s,a.top(n,i)))}return s}const v3=.35,fr=e=>(e%2===0?-1:1)*v3,M3=.45,wa=.45,Yx=(e,t)=>e[t].z-ou[t]/2-M3,l0=e=>(e.z0+e.z1)/2-.2,Zx=(e,t)=>({x:(e.ramp.xa+e.ramp.xb)/2+fr(t)*.6,z:e.ramp.z1+.6}),Kx=(e,t,n)=>({x:(e.qp.x0+e.qp.x1)/2+fr(n),z:e.qp.zLip+c0(e,t)+2.2});function ks(e,t,n,i,s){switch(n){case"flat":{const a=e.flat;return{x:i===1?a.x0:a.x1,z:a.z+fr(s)}}case"curb":case"rail":case"ledge":{const a=e[n];return{x:i===1?a.x0-wa:a.x1+wa,z:Yx(e,n)}}case"stairs":{const a=e.stairs;return{x:(a.bankX0+a.xTop)/2,z:a.bankZ+.5}}case"funbox":{const a=e.funbox,o=a.hw+a.run+.6;return{x:i===1?a.x-o:a.x+o,z:a.z+fr(s)*.6}}case"ramp":return Zx(e,s);case"qp":case"vert":return Kx(e,t,s);case"bowl":return{x:e.bowl.x-e.bowl.hw-.5,z:e.bowl.z-.6}}}function ur(e,t,n,i,s){switch(n){case"flat":case"curb":case"rail":case"ledge":case"funbox":return ks(e,t,n,i===1?-1:1,s);case"stairs":{const a=e.stairs;return{x:a.xBottom+1.35,z:l0(a)}}case"bowl":return{x:e.bowl.x-e.bowl.hw-.5,z:e.bowl.z+.6};case"ramp":case"qp":case"vert":return ks(e,t,n,i,s)}}const y3=e=>e==="ramp"?4.5:e==="bowl"?2:0;function d0(e){const t=e.stairs,n=(t.bankX0+t.xTop)/2,i=l0(t),s=[{x:n,z:t.bankZ+.5}];for(let a=0;a<=6;a++){const o=a/6,r=1-o;s.push({x:r*r*n+2*r*o*n+o*o*(t.xTop-.5),z:r*r*(i+.5)+2*r*o*i+o*o*i})}return s}const b3=(e,t)=>t==="stairs"?f0(d0(e)):0,Li=.1,jh=.35,lc=.25,S3=new Map,w3=new Map,Jx=(e,t)=>{const n=e.area;return`${String(n.x0)},${String(n.x1)},${String(n.z0)},${String(n.z1)}|${String(t)}`};function Qx(e,t,n){const i=e.get(t);if(i!==void 0)return i;const s=n();return e.set(t,s),e.size>2&&e.delete(e.keys().next().value),s}function jx(e,t){return Qx(w3,Jx(e,t),()=>_3(e,t))}function E3(e,t){return Qx(S3,Jx(e,t),()=>{const n=e.area,i=Math.ceil((n.x1-n.x0)/Li),s=Math.ceil((n.z1-n.z0)/Li),a=new Uint8Array(i*s),o=Oa(t,"bowl");for(let r=0;r<s;r++)for(let c=0;c<i;c++){const l=n.x0+(c+.5)*Li,d=n.z0+(r+.5)*Li,f=l>n.x0+lc&&l<n.x1-lc&&d>n.z0+lc&&d<n.z1-lc,u=o&&Ol(e.bowl,l,d)>-jh;a[r*i+c]=f&&!u&&qx(e,t,l,d,jh)<=.001?1:0}return{x0:n.x0,z0:n.z0,nx:i,nz:s,free:a,paths:new Map}})}const tg=(e,t)=>[Math.floor((t.x-e.x0)/Li),Math.floor((t.z-e.z0)/Li)],ko=(e,t,n)=>t>=0&&n>=0&&t<e.nx&&n<e.nz&&e.free[n*e.nx+t]===1,eg=(e,t,n)=>({x:e.x0+(t+.5)*Li,z:e.z0+(n+.5)*Li});function tp(e,t){const[n,i]=tg(e,t);for(let s=0;s<12;s++){let a=null,o=1/0;for(let r=i-s;r<=i+s;r++)for(let c=n-s;c<=n+s;c++){if(Math.max(Math.abs(c-n),Math.abs(r-i))!==s||!ko(e,c,r))continue;const l=eg(e,c,r),d=Math.hypot(l.x-t.x,l.z-t.z);d<o&&(o=d,a=[c,r])}if(a)return a}return null}function T3(e,t,n){const i=e.nx*e.nz,s=new Float64Array(i).fill(1/0),a=new Int32Array(i).fill(-1),o=new Uint8Array(i),r=[],c=(m,_)=>{r.push([m,_]);let x=r.length-1;for(;x>0;){const p=x-1>>1;if(r[p][0]<=m)break;[r[p],r[x]]=[r[x],r[p]],x=p}},l=()=>{const m=r[0],_=r.pop();if(r.length>0&&_){r[0]=_;let x=0;for(;;){const p=x*2+1,v=p+1;let y=x;if(p<r.length&&r[p][0]<r[y][0]&&(y=p),v<r.length&&r[v][0]<r[y][0]&&(y=v),y===x)break;[r[y],r[x]]=[r[x],r[y]],x=y}}return m},d=(m,_)=>{const x=Math.abs(m-n[0]),p=Math.abs(_-n[1]);return Math.max(x,p)+(Math.SQRT2-1)*Math.min(x,p)},f=t[1]*e.nx+t[0],u=n[1]*e.nx+n[0];for(s[f]=0,c(d(t[0],t[1]),f);;){const m=l();if(!m)return null;const _=m[1];if(o[_]===1)continue;if(o[_]=1,_===u)break;const x=_%e.nx,p=(_-x)/e.nx;for(let v=-1;v<=1;v++)for(let y=-1;y<=1;y++){if(y===0&&v===0)continue;const g=x+y,b=p+v;if(!ko(e,g,b)||y!==0&&v!==0&&(!ko(e,x+y,p)||!ko(e,x,p+v)))continue;const w=b*e.nx+g,T=(s[_]??0)+(y!==0&&v!==0?Math.SQRT2:1);T<(s[w]??1/0)&&(s[w]=T,a[w]=_,c(T+d(g,b),w))}}const h=[];for(let m=u;m!==-1;m=a[m]??-1){const _=m%e.nx;h.push(eg(e,_,(m-_)/e.nx))}return h.reverse()}function A3(e,t,n){const i=Math.ceil(Math.hypot(n.x-t.x,n.z-t.z)/(Li/2));for(let s=0;s<=i;s++){const[a,o]=tg(e,{x:t.x+(n.x-t.x)*s/Math.max(1,i),z:t.z+(n.z-t.z)*s/Math.max(1,i)});if(!ko(e,a,o))return!1}return!0}function z3(e,t){const n=[];let i=0;const s=t[0];if(!s)return n;for(n.push(s);i<t.length-1;){let a=t.length-1;for(;a>i+1&&!A3(e,t[i],t[a]);)a--;n.push(t[a]),i=a}return n}const R3=.4;function C3(e){if(e.length<3)return[...e];const t=[e[0]];for(let n=1;n<e.length-1;n++){const i=e[n-1],s=e[n],a=e[n+1],o=Math.hypot(s.x-i.x,s.z-i.z),r=Math.hypot(a.x-s.x,a.z-s.z),c=Math.min(R3,o/2,r/2),l={x:s.x+(i.x-s.x)*c/o,z:s.z+(i.z-s.z)*c/o},d={x:s.x+(a.x-s.x)*c/r,z:s.z+(a.z-s.z)*c/r};for(let f=0;f<=4;f++){const u=f/4,h=1-u;t.push({x:h*h*l.x+2*h*u*s.x+u*u*d.x,z:h*h*l.z+2*h*u*s.z+u*u*d.z})}}return t.push(e[e.length-1]),t}function ng(e,t,n,i){const s=E3(e,t),a=`${n.x.toFixed(3)},${n.z.toFixed(3)}>${i.x.toFixed(3)},${i.z.toFixed(3)}`,o=s.paths.get(a);if(o)return o;const r=tp(s,n),c=tp(s,i),l=r&&c?T3(s,r,c):null,d=l?C3(z3(s,[n,...l,i])):[n,i];return s.paths.set(a,d),d}const f0=e=>{let t=0;for(let n=1;n<e.length;n++)t+=Math.hypot(e[n].x-e[n-1].x,e[n].z-e[n-1].z);return t};function Rd(e,t){let n=Math.max(0,t);for(let i=1;i<e.length;i++){const s=e[i-1],a=e[i],o=Math.hypot(a.x-s.x,a.z-s.z);if(n<=o||i===e.length-1){const r=o>0?Math.min(1,n/o):1;return{x:s.x+(a.x-s.x)*r,z:s.z+(a.z-s.z)*r}}n-=o}return e[0]??{x:0,z:0}}const P3=10*6e4,L3=240,I3=181,D3=30,N3=61;function Fl(e){let t=2166136261;for(let n=0;n<e.length;n++)t=Math.imul(t^e.charCodeAt(n),16777619);return t>>>0}function U3(e,t){return D3+Fl(`${e}#${String(t)}`)%N3}function O3(e,t){const n=Fl(e),i=L3+n%I3,s=t+n%i,a=Math.floor(s/i);return s-a*i<U3(e,a)?{k:"snack",at:"island",key:a,fruit:(n+a)%3}:{k:"nap",at:"lounge"}}function F3(e,t,n){const i=e.main?"main":"desk";if(e.phase==="stopped")return{k:"stopped",at:i};if(e.status==="done")return{k:"done",at:"terrace"};if(e.status==="failed")return{k:"failed",at:i};const s=t.cards.filter(o=>o.agent===e.name);if(e.waits>0||e.waiting_on?.who==="you"||s.length>0)return s.some(o=>o.urgent)?{k:"asks",at:i,urgent:!0}:{k:"asks",at:i};if(!e.main){const o=t.places.find(r=>r.id===e.place_id)?.landing;if(o!=null&&o>0)return{k:"landing",at:"queue",rank:o}}if(e.phase==="starting")return{k:"starting",at:e.main?"main":"door"};const a=e.doing?.kind;return e.main?e.status==="working"?ep({k:"main",at:"main"},a,!1):{k:"mainidle",at:"main"}:e.status==="working"?ep((e.turn_ms??0)>P3?{k:"hot",at:"desk"}:{k:"work",at:"desk"},a,!0):e.status==="blocked"?{k:"blocked",at:"desk"}:e.waiting_on?.who==="agent"?{k:"waitagent",at:"desk",on:e.waiting_on.name}:a==="build"?{k:"work",at:"desk",doing:a}:e.status==="waiting"||e.watching.length>0?{k:"sleep",at:"desk"}:O3(e.name,n)}function ep(e,t,n){return t===void 0?e:{...e,doing:t,...t==="think"&&n?{at:"board"}:{}}}function B3(e,t){const n=new Map;for(const i of e.agents)i.archived||n.set(i.name,F3(i,e,t));return n}const np=14,Cd={drop_in:.9,pump:1.1,rock_to_fakie:1.1,axle_stall:1.1,fs_180:1.1,bs_180:1.1,ollie:.7,kickflip:.8,heelflip:.8,shove_it:.8,tre_flip:.9,fifty:1.1,five_o:1.1,boardslide:1.1,nosegrind:1.1,manual:1.3,no_comply:.8,carve:1.5,fs_air:1.1,nine:1.8},Pd=1.5,ip={flat:["manual","no_comply","ollie","kickflip","heelflip","shove_it"],funbox:["ollie","manual","kickflip"],qp:["fs_air","axle_stall"],curb:["fifty","five_o","nosegrind"],rail:["fifty","boardslide"],ledge:["fifty","five_o","boardslide","nosegrind"],stairs:["ollie","kickflip","heelflip","shove_it"],ramp:["fs_air","fs_180","bs_180","axle_stall","rock_to_fakie","fifty","fs_air","pump"],bowl:["carve","carve","fs_air"],vert:["fs_air","axle_stall"]},G3=new Set(["drop_in","pump","carve","manual"]),dc=8,Ld=12,Id=24,Fa=2,H3=2,V3=600,k3=900,W3=1.5,X3=3.2,$3=.6;function q3(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let n=t;return n=Math.imul(n^n>>>15,n|1),n^=n+Math.imul(n^n>>>7,n|61),((n^n>>>14)>>>0)/4294967296}}const ru=(e,t)=>e[Math.min(e.length-1,Math.floor(t*e.length))];function Y3(e){return Object.keys(Jn).filter(t=>Jn[t]<=e&&!(t==="qp"&&e>=Jn.vert))}function Z3(e){return e.dow===0&&e.stage>=Jn.bowl&&Math.floor((e.day+4)/7)%4===0}const K3=(e,t,n)=>Math.floor(Date.UTC(e,t-1,n)/864e5);function J3(e,t,n,i){const s=new Map,a=t.park;if(!i||i.reduced||!a||a.spots.length===0)return s;const o=Z3(i),r=Math.floor(n/V3),c=[...e].filter(([,u])=>u.k==="nap"||u.k==="snack").map(([u])=>u),l=o?a.spots.length:Math.min(H3,a.spots.length),d=c.map(u=>({name:u,h:Fl(`${u}|${String(r)}`)})).sort((u,h)=>u.h-h.h||(u.name<h.name?-1:1)).slice(0,l).map(u=>u.name).sort(),f=i.jobs===k3&&i.stage>=Jn.vert;return d.forEach((u,h)=>s.set(u,{kind:"skate",slot:h,pool:o,nine:f&&h===0,stage:i.stage})),s}function Q3(e,t,n){if(e==="ramp"){const i=2+Math.floor(t()*2);return["drop_in",...Array.from({length:i},()=>ru(ip.ramp,t()))]}return e==="bowl"?["carve","carve",t()<.5?"fs_air":"carve"]:e==="stairs"&&n?["tre_flip"]:[ru(ip[e],t())]}function j3(e,t,n,i){const s=q3(Fl(`${e}|line|${String(t)}`)),a=dc+s()*(Ld-dc),o=n.pool?["bowl"]:Y3(n.stage),r=[];let c=0;const l=i.spots[n.slot]??i.spots[0]??{x:i.area.x0,z:i.area.z0};let d=l,f=null;const u=(x,p,v,y)=>Math.max($3,(y3(p)+f0(ng(i,n.stage,x,v))+b3(i,y))/X3),h=(x,p,v,y,g)=>{r.push({trick:x,on:p,t0:c,dur:v,bail:y,side:g}),c+=v};if(n.nine&&t%3===0&&o.includes("vert")){h("roll","vert",u(d,null,ks(i,n.stage,"vert",1,n.slot),"vert"),!1,1);const x=t%2===1;h("nine","vert",Cd.nine*Pd+(x?Fa:0),x,1),d=ur(i,n.stage,"vert",1,n.slot),f="vert"}let m=f;for(let x=0;x<12;x++){const p=o.filter(I=>I!==m||o.length===1).flatMap(I=>I==="bowl"&&o.length>1?[I,I]:[I]),v=ru(p,s()),y=s()<1/8,g=Q3(v,s,y),b=s()<.5?1:-1,w=u(d,f,ks(i,n.stage,v,b,n.slot),v),T=ur(i,n.stage,v,b,n.slot),M=u(T,v,l,null),E=g.map(I=>({k:I,bail:!G3.has(I)&&s()<.1})),A=E.reduce((I,U)=>I+Cd[U.k]*Pd+(U.bail?Fa:0),0);if(c+w+A+M>Ld){if(c+u(d,f,l,null)>=dc)break;continue}h("roll",v,w,!1,b);let C=b;for(const I of E)h(I.k,v,Cd[I.k]*Pd+(I.bail?Fa:0),I.bail,C),v==="ramp"&&(C=C===1?-1:1);if(m=v,d=T,f=v,c+M>=a)break}const _=u(d,f,l,null);return h("roll",null,Math.min(Ld-c,Math.max(_,dc-c)),!1,1),{moves:r,len:c}}function ig(e,t,n,i){const s=Math.max(0,n),a=Math.floor(s/Id),o=s-a*Id,r=j3(e,a,t,i);if(o>=r.len)return{n:a,line:r,move:null,f:0,into:0,restLeft:Id-o};const c=r.moves.find(d=>o<d.t0+d.dur)??null,l=c?o-c.t0:0;return{n:a,line:r,move:c,f:c&&c.dur>0?l/c.dur:0,into:l,restLeft:0}}function sg(e){const t=e.seg;return e.since-(t.path.len>.01?t.path.len/t.speed:0)}function tE(e,t,n){const i=t.seg.pastime;if(!i||t.moving||!n)return null;const s=ig(e,i,sg(t),n),a=s.move;return!a||a.trick==="roll"||s.into>=W3?null:a.trick}const eE={...pi,floor:"#efe6d6",wall:"#fbf6ec",wallTop:"#e4d6bf",desk:"#c49a6c",deskTop:"#e2c18f",island:"#6cb4ee",islandTop:"#fffaf0",grass:"#e8d3a8",dirt:"#b08a5a",terrace:"#ece2cf",rug:"#ffd166",islandRug:"#f3ecdf"},nE={...mi,floor:"#7d6a55",wall:"#5a4c40",wallTop:"#6a5a4b",desk:"#a77f55",deskTop:"#bf9a6c",island:"#3d78a8",islandTop:"#e8dfcc",grass:"#8a7552",dirt:"#5e4a33",terrace:"#6d5d47",islandRug:"#6b5b4a"},Wa={day:"#d8d4cc",night:"#8d8a84"},sp={day:"#c9c4ba",night:"#7c7973"},Ws="#8e9399",u0="#5c677d",ap={day:"#9fd68a",night:"#4f7a45"},op={day:"#e8d3a8",night:"#8a7552"},rp={day:"#5fa84a",night:"#3f7a35"},iE=["#ffd166","#f4a259","#f39a4c","#9b8fe0","#6cb4ee"],sE=["#6cb4ee","#ffd166","#2a9d8f"],Bl=e=>e.pal.pendants,h0=e=>e;function Dd(e,t,n,i,s,a,o,r,c){const l=new ls;l.moveTo(0,0),l.absarc(0,a,a,-Math.PI/2,0,!1),l.lineTo(a+o,a),l.lineTo(a+o,0),l.lineTo(0,0);const d=new Zs(l,{depth:s,bevelEnabled:!1,curveSegments:16});d.translate(0,0,-s/2),d.rotateY(Math.PI);const f=new Wt;f.position.set(n,0,i),f.rotation.y=r,t.add(f),e.add(d,c,f,0,0,0);const u=e.add(e.style.cylinder(.05,s),e.mat(Ws),f,-a,a,0);return u.rotation.x=Math.PI/2,f}function ol(e,t,n,i,s){const a=new Wt;a.position.set(n,0,i),a.scale.setScalar(s),t.add(a),e.add(e.style.cylinder(.08,2.6),e.mat(D.palmTrunk),a,0,1.3,0);for(let o=0;o<7;o++)e.add(e.style.box(.18,.03,.9),e.mat(o%2?D.leaf[0]:D.leaf[1]),a,Math.sin(o)*.3,2.6,Math.cos(o)*.3).rotation.set(.5*Math.cos(o),o,.5*Math.sin(o))}function aE(e){const{k:t,root:n,o:i}=e,s=h0(i),{style:a,pal:o}=t,{x0:r,D:c,roomX1:l}=s,d=Bl(t),f=l-r,u=t.add(a.box(f,.14,c),a.floor(o.floor,f,c),n,r+f/2,-.05,c/2);u.receiveShadow=!0,t.add(a.box(f+.2,1.9,.2),t.mat(o.wall),n,r+f/2,.95,-.1),t.add(a.box(.2,1.1,c+.2),t.mat(o.wall),n,r-.1,.55,c/2),oE(t,n,r+.3,r+4.5,d),sE.forEach((x,p)=>{const v=t.add(a.box(.08,1.6,.42,.04),t.mat(x),n,r+.12,.8,c-4+p*.6);v.rotation.z=-.15}),mn(t,n,Fn({x:s.door.x,z:c-.15,hw:.55,hd:.25}),.04,.03,D.mat);const h=t.mat(d?rp.night:rp.day);for(let x=.2;x<c-.3;x+=.7){if(Math.abs(x-s.pathZ)<.75)continue;t.add(a.ball(.32),h,n,l+.2,.25,x).scale.set(1,.8,1.1)}const m=l,_=s.parkX0;t.add(a.box(_-m,.06,c),t.mat(d?ap.night:ap.day),n,(m+_)/2,0,c/2),t.add(a.box(_-m+.6,.07,1.1),t.mat(d?op.night:op.day),n,(m+_)/2,.01,s.pathZ);for(const x of[1.5,c*.55])ol(t,n,(m+_)/2+(x<2?.5:-.5),x,1);rE(t,n,s.park,d,e.grow.stage>=Jn.bowl)}function oE(e,t,n,i,s){const{style:a}=e,o=.01+a.pictureZ,r=i-n,c=1.75,l=.28;iE.forEach((f,u)=>e.add(a.box(r,l,.02),e.mat(s?ag(f):f),t,(n+i)/2,c-l/2-u*l,o));const d=e.add(a.cylinder(.32,.03),e.mat("#fff3c4"),t,n+r*.62,c-3.2*l,o+.02);d.rotation.x=Math.PI/2,d.scale.y=1;for(const f of[.12,.3,.85]){const u=n+r*f;e.add(a.box(.05,.9,.02),e.mat(D.dark),t,u,c-.95,o+.03);for(let h=0;h<5;h++){const m=e.add(a.box(.3,.05,.02),e.mat(D.dark),t,u,c-.5,o+.03);m.rotation.z=(h-2)*.45}}}function ag(e){const t=parseInt(e.slice(1),16),n=i=>Math.round((t>>i&255)*.7).toString(16).padStart(2,"0");return`#${n(16)}${n(8)}${n(0)}`}function rE(e,t,n,i,s){const{style:a}=e,o=n.area,r=e.mat(i?Wa.night:Wa.day),c=e.mat(i?sp.night:sp.day),l=o.x1-o.x0;e.add(fE(e,n,s),r,t,(o.x0+o.x1)/2,0,(o.z0+o.z1)/2),e.add(a.box(l+.2,.3,.2),c,t,(o.x0+o.x1)/2,.15,o.z0-.1);const d=n.bowl;for(let f=o.z0+2;f<o.z1;f+=2){const h=s&&Math.abs(f-d.z)<d.hd+.4?[[o.x0,d.x-d.hw-.4],[d.x+d.hw+.4,o.x1]]:[[o.x0,o.x1]];for(const[m,_]of h)_-m>.05&&e.add(a.box(_-m,.005,.03),e.mat("#b9b4ab"),t,(m+_)/2,.045,f)}for(const{x:f,z:u}of n.poles)if(e.add(a.cylinder(.045,3),e.mat(u0),t,f,1.5,u),e.add(a.box(.4,.2,.22),a.material("#fff3c4",{emissive:"#fff3c4",ei:i?1.5:.1}),t,f,3,u),i){const h=new Xu("#fff3c4",6,9,1.4);h.position.set(f,2.8,u),t.add(h)}for(const f of n.benches)e.add(a.box(f.x1-f.x0,.35,f.z1-f.z0,.05),e.mat("#c49a6c"),t,(f.x0+f.x1)/2,.18,(f.z0+f.z1)/2);cE(e,t,n,r)}function cE(e,t,n,i){const s=n.funbox;e.add(e.style.box(s.hw*2,s.h,s.hd*2),i,t,s.x,s.h/2,s.z);const a=Math.hypot(s.run,s.h);for(const o of[-1,1]){const r=e.add(e.style.box(a,.08,s.hd*2),i,t,s.x+o*(s.hw+s.run/2),s.h/2,s.z);r.rotation.z=-o*Math.atan2(s.h,s.run)}e.add(e.style.box(s.hw*2,.03,.04),e.mat(Ws),t,s.x,s.h+.01,s.z-s.hd)}function Nd(e,t,n,i,s){const{style:a}=e,o=n.x1-n.x0,r=(n.x0+n.x1)/2;if(i==="rail"){e.add(a.box(o,.04,.05),e.mat(Ws),t,r,n.h,n.z);for(const l of[n.x0+.3,n.x1-.3])e.add(a.box(.05,n.h,.05),e.mat(u0),t,l,n.h/2,n.z);return}const c=i==="curb"?.35:.6;e.add(a.box(o,n.h,c),s,t,r,n.h/2,n.z),e.add(a.box(o,.03,.04),e.mat(Ws),t,r,n.h+.01,n.z-c/2)}function lE(e,t,n,i){const s=n.stairs,a=s.z1-s.z0,o=(s.z0+s.z1)/2;e.add(e.style.box(s.xTop-s.x0,s.h,a),i,t,(s.x0+s.xTop)/2,s.h/2,o);const r=(s.xBottom-s.xTop)/4;for(let v=0;v<4;v++){const y=s.h-(v+1)*(s.h/5);e.add(e.style.box(r,y,a),i,t,s.xTop+r*(v+.5),y/2,o)}const c=new ls;c.moveTo(0,0),c.lineTo(s.bankZ-s.z1,0),c.lineTo(0,s.h),c.lineTo(0,0);const l=s.xTop-s.bankX0,d=new Zs(c,{depth:l,bevelEnabled:!1});d.rotateY(-Math.PI/2),e.add(d,i,t,s.xTop,0,s.z1);const{top:f,low:u}=$x(s),h=s.xBottom-s.xTop,m=Math.hypot(h,f-u),_=e.add(e.style.cylinder(.03,m+.06),e.mat(Ws),t,s.xTop+h/2,(f+u)/2,s.railZ);_.rotation.z=Math.PI/2-Math.atan2(f-u,h);const x=s.h,p=s.h/5;for(const[v,y,g]of[[s.xTop+.03,f,x],[s.xBottom-.03,u,p]])e.add(e.style.cylinder(.025,y-g),e.mat(Ws),t,v,(y+g)/2,s.railZ)}const go=.04,cp=10,lp=10;function Co(e,t){const n=Math.max(.001,e.rc-t),i=[];return[[1,1],[-1,1],[-1,-1],[1,-1]].forEach(([a,o],r)=>{const c=e.x+a*(e.hw-e.rc),l=e.z+o*(e.hd-e.rc);for(let d=0;d<=cp;d++){const f=r*Math.PI/2+d/cp*(Math.PI/2);i.push({x:c+Math.cos(f)*n,z:l+Math.sin(f)*n})}}),i}function fc(e,t){const n=[],i=(a,o,r)=>{const c=(o[0]??0)-(a[0]??0),l=(o[1]??0)-(a[1]??0),d=(o[2]??0)-(a[2]??0),f=(r[0]??0)-(a[0]??0),u=(r[1]??0)-(a[1]??0),h=(r[2]??0)-(a[2]??0),m=[l*h-d*u,d*f-c*h,c*u-l*f],_=[t[0]-(a[0]??0),t[1]-(a[1]??0),t[2]-(a[2]??0)],x=(m[0]??0)*(_[0]??0)+(m[1]??0)*(_[1]??0)+(m[2]??0)*(_[2]??0)<0;for(const p of x?[a,r,o]:[a,o,r])n.push(p[0]??0,p[1]??0,p[2]??0)};for(let a=0;a+1<e.length;a++){const o=e[a]??[],r=e[a+1]??[];for(let c=0;c<o.length;c++){const l=(c+1)%o.length,d=o[c],f=o[l],u=r[c],h=r[l];!d||!f||!u||!h||(i(d,f,u),i(f,h,u))}}const s=new Ne;return s.setAttribute("position",new le(n,3)),s.computeVertexNormals(),s}function dE(e,t,n,i){const s=n.bowl,a=v=>e.mat(i?ag(v):v),o=v=>{const y=s.depth*(1-Math.cos(v)),g=go-s.depth*Math.sin(v);return Co(s,y).map(b=>[b.x,g,b.z])},r=Array.from({length:lp+1},(v,y)=>y/lp*(Math.PI/2)),c=[s.x,go,s.z],l=2;e.add(fc(r.slice(0,l+1).map(o),c),a("#3d6fb6"),t,0,0,0),e.add(fc(r.slice(l).map(o),c),a("#b9bdc3"),t,0,0,0);const d=go-s.depth,f=o(Math.PI/2),u=f.map(([v,,y])=>[s.x+(v-s.x)*.55,d,s.z+(y-s.z)*.55]),h=[s.x,d+1,s.z];e.add(fc([f,u],h),a("#9a9fa6"),t,0,0,0),e.add(fc([u,u.map(()=>[s.x,d,s.z])],h),a("#80858d"),t,0,0,0);const m=Co(s,-.03).map(v=>new q(v.x,go+.02,v.z));e.add(new ku(new km(m,!0),m.length*2,.05,6,!0),e.mat(Ws),t,0,0,0);const _=new ls(Co({...s,hw:s.hw+.35,hd:s.hd+.35,rc:s.rc+.35},0).map(v=>new Ct(v.x-s.x,-(v.z-s.z))));_.holes.push(new ar(Co(s,0).map(v=>new Ct(v.x-s.x,-(v.z-s.z)))));const x=new Vu(_,4);x.rotateX(-Math.PI/2);const p=e.add(x,a("#ece8e0"),t,s.x,go+.005,s.z);p.castShadow=!1}function fE(e,t,n){const i=t.area,s=i.x1-i.x0,a=i.z1-i.z0;if(!n)return e.style.box(s,.08,a);const o=(i.x0+i.x1)/2,r=(i.z0+i.z1)/2,c=new ls;c.moveTo(-s/2,-a/2),c.lineTo(s/2,-a/2),c.lineTo(s/2,a/2),c.lineTo(-s/2,a/2),c.lineTo(-s/2,-a/2),c.holes.push(new ar(Co(t.bowl,0).map(d=>new Ct(d.x-o,-(d.z-r)))));const l=new Zs(c,{depth:.08,bevelEnabled:!1});return l.rotateX(-Math.PI/2),l.translate(0,-.04,0),l}function uE(e,t){const{k:n}=e,i=Bl(n),s=n.mat(i?Wa.night:Wa.day),a=_=>e.stage(Jn[_]),o=a("vert"),r=t.qp,c=o?r.r13:r.r,l=o??a("qp");if(l){const _=Xx,x=Dd(n,l,(r.x0+r.x1)/2,r.zLip+c,r.x1-r.x0,c,_,-Math.PI/2,s);o&&n.add(n.style.box(.04,.5,r.x1-r.x0),n.mat(u0),x,-(c+_-.05),c+.25,0)}const d=a("curb");d&&Nd(n,d,t.curb,"curb",s);const f=a("rail");f&&Nd(n,f,t.rail,"rail",s);const u=a("ramp");if(u){const _=t.ramp,x=_.z1-_.z0,p=(_.z0+_.z1)/2;Dd(n,u,_.xa+_.r,p,x,_.r,.6,0,s),Dd(n,u,_.xb-_.r,p,x,_.r,.6,Math.PI,s)}const h=a("stairs");h&&(lE(n,h,t,s),Nd(n,h,t.ledge,"ledge",s));const m=a("bowl");m&&dE(n,m,t,i)}function hE({k:e,root:t,o:n}){const{style:i,pal:s}=e,a=n.island,o=(a.x0+a.x1)/2,r=(a.z0+a.z1)/2,c=a.x1-a.x0,l=a.z1-a.z0;e.add(i.box(c,1.3,l,.12),e.mat(s.island),t,o,.85,r),e.add(i.box(c+.05,.25,l+.05,.08),e.mat(s.islandTop),t,o,1.55,r),e.add(i.box(c*.55,.5,.05),i.material("#fff3c4",{emissive:"#fff3c4",ei:Bl(e)?.8:.1}),t,o,1.05,a.z0-.01),e.add(i.box(c*.6,.05,.3),e.mat(s.islandTop),t,o,.8,a.z0-.12);for(const d of[-c/3,c/3]){const f=e.add(i.cylinder(.22,.15),e.mat(D.dark),t,o+d,.22,a.z0+.05);f.rotation.x=Math.PI/2}if(["#ffd166","#7cc26b","#f28c28"].forEach((d,f)=>e.add(i.box(.22,.06,.14),e.mat(d),t,o-.5+f*.5,.86,a.z0-.15)),s.pendants){const d=new Xu("#ffcf8a",3.2,4.5,1.6);d.position.set(o,1.6,a.z0-.8),t.add(d)}}function Ai(e,t){const n=h0(e),i=n.park,s=(n.roomX1+n.parkX0)/2,a=n.island,o=[n.door,{x:n.x0+.5,z:n.D-.6},{x:a.x1+.5,z:a.z0+.3},{x:(i.curb.x0+i.curb.x1)/2,z:i.curb.z},{x:(n.boardSpots[2]??n.door).x,z:.9},{x:(i.rail.x0+i.rail.x1)/2,z:i.rail.z},{x:n.roomX1-.6,z:n.D*.5},{x:(i.ramp.xa+i.ramp.xb)/2,z:(i.ramp.z0+i.ramp.z1)/2},{x:s,z:n.D*.3},{x:(i.stairs.xTop+i.stairs.xBottom)/2,z:(i.stairs.z0+i.stairs.z1)/2},{x:s,z:n.pathZ+1.6},{x:i.bowl.x,z:i.bowl.z},{x:n.x0-1.9,z:n.D*.55},{x:(i.qp.x0+i.qp.x1)/2,z:i.qp.zLip+.8},{x:s,z:n.pathZ-1.4}];return o[Math.min(t,o.length-1)]??n.door}function pE(e){const{k:t,o:n,grow:i}=e,s=h0(n),{style:a,pal:o}=t,r=e.stage(0);if(!r)return;const c=T=>e.stage(T);uE(e,s.park);const l=(s.roomX1+s.parkX0)/2,d=c(1);d&&mn(t,d,{x0:s.x0+.4,x1:s.x0+5.2,z0:s.D+.3,z1:s.D+4.4},.08,0,o.terrace);const f=s.furniture.filter(T=>T.of!==void 0&&s.terrace.some(M=>M.x===T.of?.x&&M.z===T.of.z)),u=[0,1,1,1,2,2,2,4,4,4,8][Math.min(i.stage,10)]??8;f.forEach((T,M)=>{if(M>=u)return;const E=[1,4,7,7,10,10,10,10][M]??0;Dl(t,c(E)??r,T,M%2?"#ffd166":"#6cb4ee")});const h=c(1);if(h){const T=Ai(s,1);t.add(a.cylinder(.2,.34),t.mat(D.pot),h,T.x,.17,T.z);for(let M=0;M<6;M++)t.add(a.box(.07,.5,.12),t.mat("#6fa88a"),h,T.x,.55,T.z).rotation.set(Math.cos(M)*.6,M*1.05,Math.sin(M)*.6)}const m=c(2);if(m){const T=Ai(s,2);t.add(a.box(.5,.3,.4),t.mat(D.crate),m,T.x,.15,T.z);for(let M=0;M<6;M++)t.add(a.ball(.07),t.mat(M%2?"#7cc26b":D.orange),m,T.x-.15+M%3*.15,.34,T.z-.08+Math.floor(M/3)*.16);ol(t,m,l+.5,s.D*.8,.9)}const _=c(4);if(_){const T=Ai(s,4).x,M=a.pictureZ;t.add(a.box(1.8,.95,.05),t.mat("#c49a6c"),_,T,1.05,.02+M),t.add(a.box(1.68,.83,.02),t.mat("#2f4a3a"),_,T,1.05,.05+M);for(let E=0;E<5;E++){const A=.4+Re(`chalk${String(E)}`)%50/100;t.add(a.box(A,.04,.01),t.mat(["#fffaf0","#ffd166","#8fd3ff"][E%3]??"#fffaf0"),_,T-.7+A/2,1.35-E*.14,.065+M)}}const x=c(5);if(x){const T=s.island,M=T.z0+xr(s,i.stage)-.6;t.add(a.box(.55,.28,.2),t.mat(D.dark),x,(T.x0+T.x1)/2,1.8,M)}const p=c(6);if(p){const T=Ai(s,6);t.add(a.box(.5,.35,.35,.05),t.mat("#6cb4ee"),p,T.x-.4,.18,T.z),t.add(a.box(.52,.06,.37),t.mat("#fffaf0"),p,T.x-.4,.38,T.z);for(let M=.8;M<s.D-.6;M+=1.3)Math.abs(M-s.pathZ)<.8||t.add(a.box(.14,.14,.14),t.mat(M%2.6<1.3?D.orange:"#9b8fe0"),p,s.roomX1+.55,.35,M)}const v=c(7);if(v){const T=s.x0+5.6,M=s.D+1.9;t.add(a.cylinder(.03,1.8),t.mat(o.ink),v,T,.9,M),t.add(a.cap(.75,.35),t.mat("#ffd166"),v,T,1.75,M)}const y=c(8);if(y)for(const T of[s.D*.3,s.D-1])ol(t,y,l-.6,T,1.05);const g=c(10);if(g){const T=Ai(s,10);t.add(a.box(.7,.05,.7),t.mat("#c49a6c"),g,T.x,.05,T.z),t.add(a.cylinder(.04,2),t.mat(D.metal),g,T.x-.25,1,T.z),t.add(a.box(.3,.04,.12),t.mat(D.metal),g,T.x-.12,2,T.z)}const b=c(12);if(b){const T=Ai(s,12),M=t.add(a.cylinder(1,.04),t.mat("#6cb4ee"),b,T.x,0,T.z);M.scale.z=.7;const E=t.add(a.box(.08,1.4,.4,.04),t.mat("#ffd166"),b,T.x+.9,.6,T.z-.6);E.rotation.z=.2}const w=c(np);if(w){const T=Ai(s,np),M=a.material(D.gold,{emissive:D.gold,ei:.15});t.add(a.box(.7,.5,.5),t.mat(mE(t)),w,T.x,.25,T.z);const E=t.add(a.box(.28,.04,.95,.03),M,w,T.x,1,T.z);E.rotation.x=Math.PI/2-.25,js(t,w,T.x,1,T.z+.05,t.pal.ink,.04)}Ll(t,r,s,i),xE(t,r,s,i),i.building&&i.stage<14&&Il(t,r,Ai(s,i.stage+1))}const mE=e=>Bl(e)?Wa.night:Wa.day;function xE(e,t,n,i){if(i.frames===0)return;const{style:s}=e,a=(n.boardSpots[2]?.x??n.x0+5.5)+1.1,o=n.mainDesk.x-.6,r=.3,c=Math.max(1,Math.floor((o-a)/r));for(let l=0;l<i.frames;l++){const d=l%c,u=1.3-Math.floor(l/c)*.62;if(u<.5)break;const h=i.golden&&l===0?D.gold:D.mural[l%D.mural.length]??D.paper;e.add(s.box(.2,.58,.03,.06),e.mat(h),t,a+r/2+d*r,u,.03+s.pictureZ)}}const gE={id:"california",pal:e=>e?nE:eE,shell:aE,island:hE,lounge:gr,desk:(e,t,n)=>Wf.desk(e,t,n),mainDesk:(e,t)=>Wf.mainDesk(e,t),tree:({k:e},t,n,i,s)=>{ol(e,t,n,i,s)},growth:pE,pieceAt:Ai,pits:(e,t)=>t>=Jn.bowl&&e.park?[_E(e.park.bowl)]:[]};function _E(e){return{x0:e.x-e.hw-.1,x1:e.x+e.hw+.1,z0:e.z-e.hd-.1,z1:e.z+e.hd+.1}}const vE={loft:Wf,greenhouse:FS,campus:kS,workshop:YS,kyoto:jS,riad:nw,nordic:fw,patio:Rw,haveli:Gw,tropical:Jw,cyclades:c3,sahel:g3,california:gE},cu=e=>vE[e],ME=(e,t,n)=>new Ja(Math.max(.01,e),Math.max(.01,t),Math.max(.01,n));function yE(e){const t=document.createElement("canvas");t.width=4,t.height=32;const n=t.getContext("2d"),i=new ee(e);n&&(n.fillStyle="#"+i.getHexString(),n.fillRect(0,0,4,32),n.fillStyle="#"+i.clone().multiplyScalar(.93).getHexString(),n.fillRect(0,0,4,1));const s=new Hm(t);return s.magFilter=s.minFilter=$e,s.colorSpace=fn,s.wrapS=s.wrapT=tr,s}function bE(e,t,n,i){const s=Math.max(.004,Math.min(i,e/2-.001,n/2-.001,t/2)),a=new ls,o=-e/2,r=-n/2;a.moveTo(o+s,r),a.lineTo(o+e-s,r),a.quadraticCurveTo(o+e,r,o+e,r+s),a.lineTo(o+e,r+n-s),a.quadraticCurveTo(o+e,r+n,o+e-s,r+n),a.lineTo(o+s,r+n),a.quadraticCurveTo(o,r+n,o,r+n-s),a.lineTo(o,r+s),a.quadraticCurveTo(o,r,o+s,r);const c=new Zs(a,{depth:Math.max(.01,t-s),bevelEnabled:!0,bevelThickness:s/2,bevelSize:s*.4,bevelSegments:3,curveSegments:6});return c.rotateX(-Math.PI/2),c.translate(0,-t/2+s/4,0),c.computeVertexNormals(),c}const _o=20,SE={name:"clay",shadows:!0,antialias:!0,pictureZ:.09,maxPixelRatio:2,material(e,t={}){const n=t.opacity!==void 0;return t.flat?new wl({color:new ee(e),transparent:n,opacity:t.opacity??1}):new lr({color:new ee(e),roughness:.95,metalness:0,emissive:new ee(t.emissive??"#000000"),emissiveIntensity:t.ei??(t.emissive?1:0),transparent:n,opacity:t.opacity??1})},floor(e,t,n){const i=yE(e);return i.repeat.set(t/2,n*2),new lr({color:16777215,map:i,roughness:.95,metalness:0})},box:(e,t,n,i)=>{const s=Math.max(.01,e),a=Math.max(.01,t),o=Math.max(.01,n);return Math.min(s,a,o)<.03?ME(s,a,o):bE(s,a,o,i??Math.min(s,a,o)*.22)},ball:e=>new Jc(e,_o,_o-4),cap:(e,t)=>new Jc(e,_o,_o-4,0,Math.PI*2,0,Math.PI*Math.min(1,t)),capsule:(e,t)=>new Fu(e,t,4,12),cylinder:(e,t)=>new El(e,e,t,_o)},yn=SE;function wE(e,t=!1){const n=e[0].index!==null,i=new Set(Object.keys(e[0].attributes)),s=new Set(Object.keys(e[0].morphAttributes)),a={},o={},r=e[0].morphTargetsRelative,c=new Ne;let l=0;for(let d=0;d<e.length;++d){const f=e[d];let u=0;if(n!==(f.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+d+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const h in f.attributes){if(!i.has(h))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+d+'. All geometries must have compatible attributes; make sure "'+h+'" attribute exists among all geometries, or in none of them.'),null;a[h]===void 0&&(a[h]=[]),a[h].push(f.attributes[h]),u++}if(u!==i.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+d+". Make sure all geometries have the same number of attributes."),null;if(r!==f.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+d+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const h in f.morphAttributes){if(!s.has(h))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+d+".  .morphAttributes must be consistent throughout all geometries."),null;o[h]===void 0&&(o[h]=[]),o[h].push(f.morphAttributes[h])}if(t){let h;if(n)h=f.index.count;else if(f.attributes.position!==void 0)h=f.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+d+". The geometry must have either an index or a position attribute"),null;c.addGroup(l,h,d),l+=h}}if(n){let d=0;const f=[];for(let u=0;u<e.length;++u){const h=e[u].index;for(let m=0;m<h.count;++m)f.push(h.getX(m)+d);d+=e[u].attributes.position.count}c.setIndex(f)}for(const d in a){const f=dp(a[d]);if(!f)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+d+" attribute."),null;c.setAttribute(d,f)}for(const d in o){const f=o[d][0].length;if(f!==0){c.morphAttributes=c.morphAttributes||{},c.morphAttributes[d]=[];for(let u=0;u<f;++u){const h=[];for(let _=0;_<o[d].length;++_)h.push(o[d][_][u]);const m=dp(h);if(!m)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+d+" morphAttribute."),null;c.morphAttributes[d].push(m)}}}return c}function dp(e){let t,n,i,s=-1,a=0;for(let l=0;l<e.length;++l){const d=e[l];if(t===void 0&&(t=d.array.constructor),t!==d.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(n===void 0&&(n=d.itemSize),n!==d.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(i===void 0&&(i=d.normalized),i!==d.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(s===-1&&(s=d.gpuType),s!==d.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;a+=d.count*n}const o=new t(a),r=new pn(o,n,i);let c=0;for(let l=0;l<e.length;++l){const d=e[l];if(d.isInterleavedBufferAttribute){const f=c/n;for(let u=0,h=d.count;u<h;u++)for(let m=0;m<n;m++){const _=d.getComponent(u,m);r.setComponent(u+f,m,_)}}else o.set(d.array,c);c+=d.count*n}return s!==void 0&&(r.gpuType=s),r}function EE(e){return!(e instanceof lr||e instanceof tx)||e.userData.live===!0||e.transparent||e.map!==null?!1:e.emissiveIntensity===0||e.emissive.r===0&&e.emissive.g===0&&e.emissive.b===0}function fp(e,t,n){const i=e.index!==null?e.toNonIndexed():e.clone();i.applyMatrix4(t);for(const s of Object.keys(i.attributes))s!=="position"&&s!=="normal"&&!(n&&s==="uv")&&i.deleteAttribute(s);return i.hasAttribute("normal")||i.computeVertexNormals(),n&&!i.hasAttribute("uv")&&i.setAttribute("uv",new pn(new Float32Array(i.getAttribute("position").count*2),2)),i.morphAttributes={},i}function TE(e,t,n,i){const s=e.getAttribute("position").count,a=new Float32Array(s*3);for(let o=0;o<s;o++)a[o*3]=t,a[o*3+1]=n,a[o*3+2]=i;return e.setAttribute("color",new pn(a,3)),e}function AE(e){return e.name==="clay"?new lr({vertexColors:!0,roughness:.95,metalness:0}):new tx({vertexColors:!0})}function Ud(e,t,n){e.updateMatrixWorld(!0);const i=[],s=new Map;let a=0;e.traverseVisible(d=>{if(!(d instanceof we))return;const f=d.geometry,u=d.material;if(Array.isArray(u))return;if(a++,EE(u)){i.push(TE(fp(f,d.matrixWorld,!1),u.color.r,u.color.g,u.color.b));return}const h="map"in u&&u.map!==null&&u.map!==void 0,m=s.get(u)??[];m.push(fp(f,d.matrixWorld,h)),s.set(u,m)});const o=new Wt,r=[];let c=null;const l=(d,f)=>{const h=(d.length===1?d[0]:void 0)??wE(d,!1);for(const _ of d)_!==h&&_.dispose();if(h===null)return;r.push(h);const m=new we(h,f);m.castShadow=n,m.receiveShadow=n,o.add(m)};i.length>0&&(c=AE(t),l(i,c));for(const[d,f]of s)l(f,d);return{group:o,baked:c,from:a,to:o.children.length,dispose(){for(const d of r)d.dispose();c?.dispose()}}}const zE=new ee(D.grey),RE=.25;function og(e,t,n,i,s){const a=i??hx(e,t),o=new Map,r=new Map,c=(j,wt=0)=>{const Pt=`${j}|${wt}`;let bt=o.get(Pt);return bt||(bt=n.material(j,wt>0?{emissive:j,ei:wt}:{}),o.set(Pt,bt),r.set(bt,bt.color.clone())),bt},l=(j,wt,Pt,bt,Zt,G)=>{const Q=new we(j,wt);return Q.position.set(bt,Zt,G),Pt.add(Q),Q},d=new Wt,f=new Wt,u=t?1.18:1;f.scale.setScalar(u),d.add(f),l(n.capsule(.21,.22),c(a.hoodie),f,0,.5,0);const h=new Wt;h.position.set(0,fS,0),f.add(h),l(n.ball(.22),c(a.skin),h,0,0,0);const m=[-.075,.075].map(j=>l(n.box(.07,.08,.02),c(rc),h,j,.03,.205)),_=[-.08,.08].map(j=>l(n.box(.065,.014,.006),c(rc),h,j,.01,.214)),x=l(n.box(.12,.03,.02),c(rc),h,0,-.05,.205),p=l(n.box(.12,.06,.02),c(gS),h,0,-.06,.207),v=l(n.box(.06,.06,.02),c(rc),h,0,-.08,.205);for(const j of[-.135,.135])l(n.box(.06,.04,.02),c(_S),h,j,-.05,.205);const y=j=>{l(n.cap(.225,.48),c(a.hatColor),h,0,.03,0),l(n.box(.22,.03,.2),c(a.hatColor),h,0,.07,j?-.22:.21)};switch(a.hat){case"cap":y(!1);break;case"capback":y(!0);break;case"beanie":l(n.cap(.232,.5),c(a.hatColor),h,0,.04,0),l(n.ball(.06),c(D.paper),h,0,.28,0);break;case"afro":{l(n.ball(.27),c(a.hair),h,0,.1,-.05).scale.set(1.05,.85,1);break}case"bun":l(n.cap(.226,.42),c(a.hair),h,0,.02,-.01),l(n.ball(.09),c(a.hair),h,0,.24,-.08);break;case"hair":l(n.cap(.228,.4),c(a.hair),h,0,.02,-.02);break;case"headphones":{l(n.cap(.226,.4),c(a.hair),h,0,.02,-.02);const j=c(D.dark),wt=.262,Pt=7,bt=1.3,Zt=2*bt/Pt;for(let S=0;S<Pt;S++){const X=-bt+Zt*(S+.5),K=l(n.box(wt*Zt*1.15,.034,.06,.012),j,h,wt*Math.sin(X),wt*Math.cos(X),-.01);K.rotation.z=-X}for(const S of[-1,1]){l(n.box(.03,.07,.035,.01),j,h,S*.258,.07,-.01);const X=l(n.cylinder(.078,.03),j,h,S*.222,-.01,-.01);X.rotation.z=Math.PI/2;const K=l(n.cylinder(.086,.055),c(a.hatColor),h,S*.258,-.01,-.01);K.rotation.z=Math.PI/2;const tt=l(n.cylinder(.05,.012),j,h,S*.288,-.01,-.01);tt.rotation.z=Math.PI/2}const G=new q(-.27,-.05,.03),Q=new q(-.12,-.1,.19),ut=Q.clone().sub(G);l(n.box(.018,.018,ut.length(),.006),j,h,(G.x+Q.x)/2,(G.y+Q.y)/2,(G.z+Q.z)/2).quaternion.setFromUnitVectors(new q(0,0,1),ut.normalize()),l(n.ball(.026),j,h,Q.x,Q.y,Q.z);break}case"main":{l(n.cap(.228,.4),c(a.hair),h,0,.02,-.02);const j=c(D.wheel,.3);l(n.box(.05,.05,.02),j,f,-.06,.58,.215),l(n.box(.05,.05,.02),j,f,-.06,.47,.215);for(let wt=0;wt<3;wt++){const Pt=l(n.box(.11,.025,.02),j,f,.05,.525,.215);Pt.rotation.z=wt*Math.PI/3}l(n.box(.3,.03,.03),c(D.gold,.2),f,0,.7,.2);break}}const g=[],b=[];for(const j of[-1,1]){const wt=new Wt;wt.position.set(j*.24,.66,0),f.add(wt),l(n.capsule(.065,.2),c(a.hoodie),wt,0,-.15,0),l(n.ball(.065),c(a.skin),wt,0,-.3,0),g.push(wt);const Pt=new Wt;Pt.position.set(j*.1,.3,0),f.add(Pt),l(n.capsule(.075,.14),c(a.pants),Pt,0,-.12,0),l(n.box(.15,.08,.24),c(D.paper),Pt,0,-.27,.04),b.push(Pt)}const[w,T]=g,[M,E]=b;s?.({style:n,name:e,head:h,body:f,arms:g,legs:b,mat:c,add:l});const A=l(n.box(.4,.3,.3),c(D.crate),f,0,.62,.3);l(n.box(.41,.04,.12),c(D.tape),A,0,.15,0);const C=new Wt;C.position.set(0,-.33,.04),T.add(C);const I=l(n.cylinder(.055,.11),c(D.paper),C,0,0,0),U=l(n.ball(.08),c(D.orange),C,0,0,.02),P=new Wt;C.add(P);const O=l(n.ball(.08),c(D.pineapple),P,0,0,.03);O.scale.y=1.4;const V=c(D.gold,.6),N=O.material,F=l(n.cylinder(.09,.025),c(D.gold,.4),d,0,1.4,0);F.rotation.x=Math.PI/2,l(n.box(.06,.12,.06),c(D.pineLeaf),P,0,.16,.03);const L=new Wt;C.add(L),l(n.box(.2,.01,.14),c(D.paper),L,0,.02,.06);const B=l(n.box(.3,.38,.015),c(D.paper),f,0,.58,.32);B.rotation.x=-.35;const $=new Wt;d.add($),l(n.box(.28,.04,.85),c(D.skate),$,0,.15,0);for(const j of[-.27,.27]){l(n.box(.38,.04,.07),c(D.truck),$,0,.11,j);for(const wt of[-.21,.21]){const Pt=l(n.cylinder(.065,.08),c(D.wheel),$,wt,.065,j);Pt.rotation.z=Math.PI/2}}const J=l(n.box(.26,.06,.03),c(D.sunglasses),h,0,.04,.215),st=new Wt;d.add(st);for(const[j,wt,Pt]of[[-.12,0,.12],[.06,.04,.15],[.2,-.01,.1]])l(n.ball(Pt),c(D.cloud),st,j,wt,0);st.position.set(0,1.05,.47);const Tt=l(n.box(.04,.16,.04),c(D.marker),C,0,-.02,.03),H=new Wt;f.add(H),H.position.set(0,.62,.34),H.rotation.x=-.3,l(n.box(.46,.32,.015),c(D.paper),H,0,0,0);for(let j=0;j<4;j++)l(n.box(.36,.025,.005),c(D.ink),H,0,.1-j*.065,.01);const et=new Wt;C.add(et),l(n.box(.03,.12,.03),c(D.trunk),et,0,.06,.05),l(n.box(.16,.16,.025),c(D.glass,.25),et,0,.19,.05);const W=new Wt;f.add(W),W.position.set(0,1.25,.12),l(n.box(.62,.44,.015),c(D.paper),W,0,0,0),D.mural.slice(0,3).forEach((j,wt)=>l(n.box(.16,.16,.005),c(j),W,-.18+wt*.18,.04,.01));const k=new Wt;d.add(k),k.position.set(-.3,0,.55),l(n.box(.06,.8,.06),c(D.dark),k,0,.4,0),l(n.box(.75,.48,.05),c(D.dark),k,0,1,0),l(n.box(.68,.41,.01),c(D.glass,.6),k,0,1,-.03);const at=new Wt;d.add(at),at.position.set(0,0,.4),l(n.box(.36,.42,.26),c(D.dark),at,0,.21,0);const mt=l(n.box(.24,.3,.012),c(D.paper),at,0,.5,0),rt=new Wt;d.add(rt),l(n.box(.62,.1,.03),c(D.dark),rt,0,0,0);const Mt=l(n.box(.58,.06,.035),c(D.bar,.3),rt,0,0,.005),Kt=[0,1,2].map(()=>l(n.box(.06,.09,.04),c(D.sweat,.3),h,0,0,0)),lt=[0,1,2].map(()=>l(n.ball(.08),c(D.steam),d,0,0,0)),pt=(j,wt)=>{j.rotation.set(wt[0],wt[1],wt[2])};let xt=-1,yt=-1;return{name:e,main:t,outfit:a,group:d,apply(j){d.visible=j.opacity>.001,d.position.set(j.x,j.lift??0,j.z),d.rotation.set(j.tilt?.[0]??0,j.dir,j.tilt?.[1]??0,"YXZ");const wt=j.board;$.position.set(wt?.x??0,wt?wt.y-.08:0,wt?.z??0),$.rotation.set(wt?.rot[0]??0,wt?.rot[1]??0,wt?.rot[2]??0,"YXZ"),f.position.set(0,j.y,0),pt(f,j.body),pt(h,j.head),pt(w,j.armL),pt(T,j.armR),M.rotation.set(j.legL,0,0),E.rotation.set(j.legR,0,0);const Pt=j.eyes<RE;for(const G of m)G.visible=!Pt,G.scale.y=j.eyes;for(const G of _)G.visible=Pt;x.visible=j.mouth==="smile",p.visible=j.mouth==="laugh",v.visible=j.mouth==="oh";const bt=j.props;A.visible=bt.crate,A.position.set(0,bt.crateUp?1.62*u:.62,bt.crateUp?0:.3),O.material=bt.golden?V:N,F.visible=bt.coin!==null,bt.coin!==null&&(F.position.y=1.5*u+j.y+bt.coin*.5),I.visible=bt.mug,U.visible=bt.orange,P.visible=bt.pine;const Zt=Math.max(.15,1-bt.eaten*.85);if(U.scale.setScalar(Zt),P.scale.setScalar(Zt),L.visible=bt.plane,B.visible=bt.sheet,$.visible=bt.skate,J.visible=bt.glasses,Tt.visible=bt.marker,H.visible=bt.newspaper,et.visible=bt.magnifier,W.visible=bt.poster,k.visible=bt.bigScreen,at.visible=bt.shredder!==null,bt.shredder!==null&&(mt.position.y=.5-bt.shredder*.32),rt.visible=bt.progress!==null,bt.progress!==null){const G=Math.max(.02,bt.progress);Mt.scale.x=G,Mt.position.x=-.29*(1-G),rt.position.set(0,1.62*u+j.y,0)}if(st.visible=bt.cloud>.02,st.scale.setScalar(Math.max(.01,bt.cloud)),Kt.forEach((G,Q)=>{if(G.visible=bt.hot!==null,bt.hot===null)return;const ut=(bt.hot+Q/3)%1;G.position.set((Q-1)*.17,.16-ut*.4,.16),G.scale.setScalar(1-ut*.6)}),lt.forEach((G,Q)=>{if(G.visible=bt.hot!==null,bt.hot===null)return;const ut=(bt.hot*.66+Q/3)%1;G.position.set(Math.sin(ut*6+Q)*.1,1.28*u+ut*.9,0),G.scale.setScalar(.6+ut)}),j.grey!==xt){xt=j.grey;for(const[G,Q]of r)G.color.copy(Q).lerp(zE,j.grey*.85)}if(j.opacity!==yt){const G=yt>=1||yt<0;yt=j.opacity;const Q=j.opacity>=1;for(const ut of r.keys())ut.opacity=j.opacity,(ut.transparent===Q||G!==Q)&&(ut.transparent=!Q,ut.needsUpdate=!0)}},headTop(j){return h.getWorldPosition(j),j.y+=.3*u,j},feet(j){return j.set(d.position.x,0,d.position.z)},dispose(){d.traverse(j=>{j instanceof we&&j.geometry.dispose()});for(const j of r.keys())j.dispose()}}}const Je={crate:!1,mug:!1,orange:!1,pine:!1,sheet:!1,plane:!1,skate:!1,glasses:!1,cloud:0,hot:null,marker:!1,newspaper:!1,bigScreen:!1,magnifier:!1,poster:!1,shredder:null,progress:null,coin:null,golden:!1,crateUp:!1,eaten:0},Ts=[0,0,0],he={y:0,body:Ts,head:Ts,armL:Ts,armR:Ts,legL:0,legR:0,eyes:1,mouth:"smile",props:Je,screen:0,lamp:!0,grey:0,dx:0,dz:0,face:null},Ii={y:-.05,legL:-1.45,legR:-1.45},rg=new Set(["work","hot","main"]),CE=(e,t)=>t?0:e,PE=new Set(["think","computer","compact","build","edit","tool","unknown"]);function LE(e,t,n,i){const s=e==="hot",a={...Je,hot:s?(n*.9+i)%1:null},o=s?"oh":"smile";switch(t.doing){case"think":return t.at==="board"?{...he,mouth:o,armL:[-.3,0,0],head:[-.15,0,0],armR:[-2.4+Math.sin(n*6+i)*.2,0,.2+Math.sin(n*3+i)*.25],props:{...a,marker:!0}}:{...he,...Ii,mouth:o,armR:[-2.2,0,-.5],armL:[-1.2,0,0],head:[-.25,.2+Math.sin(n*1.5+i)*.1,0],screen:.6,props:a};case"search":return{...he,...Ii,mouth:o,armL:[-1.3,0,.35],armR:[-1.3,0,-.35],head:[.2,0,0],screen:.5,props:{...a,newspaper:!0}};case"computer":return{...he,dx:-.75,dz:.1,face:0,mouth:o,head:[.05,-.5,0],armR:[-1+Math.sin(n*4+i)*.08,0,Math.sin(n*3+i)*.1],armL:Ts,screen:.4,props:{...a,bigScreen:!0}};case"image":return{...he,...Ii,mouth:"oh",armR:[-2,0,-.3],armL:[-1.2,0,0],head:[.1,0,0],screen:.9,props:{...a,magnifier:!0}};case"publish":return{...he,mouth:"laugh",eyes:.3,armL:[-2.6,0,.2],armR:[-2.6,0,-.2],props:{...a,poster:!0}};case"compact":return{...he,dx:.6,face:0,mouth:o,armL:[-1.1,0,0],armR:[-1.1,0,0],head:[.35,0,0],screen:.4,props:{...a,shredder:(n*.8+i)%1}};case"build":return{...he,dz:-.15,mouth:o,armL:[-1.2,0,.9],armR:[-1.2,0,-.9],head:[.1,0,0],screen:.9,props:{...a,progress:(n+i*3)%12/12}};case"edit":case"tool":case"unknown":case void 0:{const r=s?22:12;return{...he,...Ii,armL:[-1.2+Math.sin(n*r+i)*.18,0,0],armR:[-1.2+Math.sin(n*r+i+2)*.18,0,0],head:[.15+Math.sin(n*2+i)*.04,Math.sin(n*.7+i)*.15,0],body:s?[0,0,Math.sin(n*30)*.015]:Ts,mouth:o,screen:.9,props:a}}}}function IE(e){return e.doing===void 0||PE.has(e.doing)||e.k==="hot"}const DE={...he,y:.22,dz:.15,body:[-.9,0,0],legL:-.4,legR:-.4,armL:[0,0,-.5],armR:[0,0,.5],eyes:.15,mouth:"oh",face:0},up={...he,...Ii,body:[.3,0,0],head:[.6,0,0],armL:[-1.4,0,0],armR:[-1.4,0,0],eyes:.15,mouth:"oh"},Ea=1.6,rl=2.6,lu=4,hp=Ea+lu*rl,uc=(e,t,n)=>[e[0]+(t[0]-e[0])*n,e[1]+(t[1]-e[1])*n,e[2]+(t[2]-e[2])*n],vo=[-1.3,0,-.2],Od=[-2.25,0,-.45],pp=[-.75,0,.1];function NE(e,t,n){const i=Math.floor(t/hp),s=t-i*hp,a=e===2,o=a?2:(e+i)%2,r=(h,m)=>({...Je,pine:m&&o===0,orange:m&&o===1,mug:m&&a,eaten:a?0:h});if(s<Ea){const h=s/Ea,m=h<.5?is(h*2):1-is((h-.5)*2);return{...he,body:[.22*m,0,0],head:[.1+.3*m,0,0],armR:h<.5?uc(vo,pp,is(h*2)):uc(pp,vo,is((h-.5)*2)),armL:[-.15,0,0],mouth:"smile",props:r(0,h>=.5)}}const c=Math.floor((s-Ea)/rl),l=s-Ea-c*rl,d=c/lu,f=(c+1)/lu;if(l<.5)return{...he,armR:uc(vo,Od,is(l/.5)),head:[-.05,0,0],mouth:"oh",props:r(d,!0)};if(l<.75)return{...he,armR:Od,head:[.15,0,0],mouth:"smile",eyes:.6,props:r(f,f<1)};if(l<1.15)return{...he,armR:uc(Od,vo,is((l-.75)/.4)),head:[.05,0,0],mouth:"smile",props:r(f,f<1)};const u=Math.sin((l-1.15)*Math.PI*6+n);return{...he,armR:vo,head:[.04+u*.04,0,Math.sin((l-1.15)*2+n)*.05],mouth:u>0?"oh":"smile",eyes:.4,props:r(f,f<1)}}function mp(e,t,n,i=t){const s=e.k,a=e.urgent===!0,o=e.fruit??0;switch(s){case"work":case"main":case"hot":return LE(s,e,t,n);case"starting":return{...he,head:[0,.35,0],armR:[0,0,2.4],face:Math.PI};case"nap":return e.at==="desk"?up:DE;case"sleep":case"waitagent":return up;case"snack":return NE(o,i,n);case"asks":return{...he,dx:.65,dz:.15,face:0,y:Math.abs(Math.sin(t*(a?5.2:2.6)+n))*.08,armR:[0,0,2.7+Math.sin(t*5+n)*.25],armL:a?[-1.3,0,0]:Ts,mouth:"oh",screen:.6,props:a?{...Je,sheet:!0}:Je};case"blocked":return{...he,...Ii,armL:[-1.2,0,.9],armR:[-1.2,0,-.9],head:[.25,0,0],mouth:"oh",screen:.4};case"failed":return{...he,...Ii,body:[.35,0,0],head:[.7,0,0],armL:[-.2,0,0],armR:[-.2,0,0],eyes:.3,mouth:"oh",props:{...Je,cloud:1}};case"landing":return{...he,armL:[-1.3,0,0],armR:[-1.3,0,0],props:{...Je,crate:!0}};case"done":return{...he,y:.26,dz:.33,body:[-1,0,0],legL:-.2,legR:-.2,armL:[0,0,-2.6],armR:[0,0,2.6],props:{...Je,glasses:!0}};case"stopped":return{...he,...Ii,armL:[-.9,0,0],armR:[-.9,0,0],head:[.1,0,0],lamp:!1,grey:1};case"mainidle":return{...he,...Ii,armL:[-1.3,0,.35],armR:[-1.3,0,-.35],head:[.25,0,0],props:{...Je,sheet:!0}};case"coffee":return{...he,armR:[-1.5,0,0],head:[-.1,0,.06],mouth:"laugh",eyes:.3,props:{...Je,mug:!0}};case"visit":return{...he,armR:[-1.2,0,-.3],head:[.1,0,0]};case"report":return{...he,armL:[-1.3,0,0],armR:[-1.3,0,0],props:{...Je,sheet:!0}}}}function UE(e,t){return e===null||e===t?0:t==="sleep"||t==="waitagent"?1.5:t==="failed"?1.2:t==="stopped"?.5:e==="sleep"||e==="waitagent"||e==="failed"||e==="stopped"?1:.6}const Gl=1.5,cg=2,is=e=>e<=0?0:e>=1?1:e*e*(3-2*e),Pn=(e,t,n)=>e+(t-e)*n,hc=(e,t,n)=>[Pn(e[0],t[0],n),Pn(e[1],t[1],n),Pn(e[2],t[2],n)];function lg(e,t,n){const i=n>=.5;return{y:Pn(e.y,t.y,n),body:hc(e.body,t.body,n),head:hc(e.head,t.head,n),armL:hc(e.armL,t.armL,n),armR:hc(e.armR,t.armR,n),legL:Pn(e.legL,t.legL,n),legR:Pn(e.legR,t.legR,n),eyes:Pn(e.eyes,t.eyes,n),mouth:i?t.mouth:e.mouth,props:{...i?t.props:e.props,cloud:Pn(e.props.cloud,t.props.cloud,n)},screen:Pn(e.screen,t.screen,n),lamp:i?t.lamp:e.lamp,grey:Pn(e.grey,t.grey,n),dx:Pn(e.dx,t.dx,n),dz:Pn(e.dz,t.dz,n),face:i?t.face:e.face}}function OE(e,t){if(e==="done")return{...he,y:.1,legL:.2,legR:-.3,armL:[0,0,-1.1],armR:[0,0,1.1],body:[0,.5,0],mouth:"laugh",eyes:.3,props:{...Je,skate:!0,glasses:!0}};const n=t*9,i=e==="landing";return{...he,y:Math.abs(Math.sin(n))*.05,legL:Math.sin(n)*.6,legR:-Math.sin(n)*.6,armL:[i?-1.3:-Math.sin(n)*.5,0,0],armR:[i?-1.3:Math.sin(n)*.5,0,0],props:i?{...Je,crate:!0}:Je}}function FE(e,t,n,i){const s=Math.sin(Math.PI*n);return(t==="sleep"||t==="waitagent")&&n<.6?{...i,armL:[0,0,-2.6*s],armR:[0,0,2.6*s],mouth:"oh",eyes:.6}:(e==="sleep"||e==="waitagent")&&rg.has(t)?{...i,y:i.y+.18*s,eyes:1}:t==="failed"?{...i,armL:[-2.4*s,0,.4],armR:[-2.4*s,0,-.4]}:e==="stopped"?{...i,armL:[0,0,-2.2*s],armR:[0,0,2.2*s]}:i}function BE(e,t){const n=t-Gl;return n<0||n>cg?e:n<.4?{...e,armR:[0,0,2.6],eyes:1,mouth:"smile",screen:Math.max(e.screen,.4)}:n<1.3?{...e,armR:[-1.4,0,-.3],head:[.35,0,0],props:{...e.props,plane:!0},eyes:1,mouth:"smile"}:n<1.7?{...e,armR:[-.4,0,2.2],mouth:"laugh",eyes:.3}:lg({...e,armR:[-.4,0,2.2]},e,is((n-1.7)/.3))}const dg=.8;function GE(e,t){const{path:n}=e.seg;if(!t||n.len<.01||e.seg.from===null)return{x:e.x,z:e.z,opacity:1,fading:!1};const i=Math.min(dg,n.len/e.seg.speed),s=e.since,a=n.pts[0],o=n.pts[n.pts.length-1];return!a||!o?{x:e.x,z:e.z,opacity:1,fading:!1}:s<i/2?{x:a.x,z:a.z,opacity:1-s/(i/2),fading:!0}:s<i?{x:o.x,z:o.z,opacity:(s-i/2)/(i/2),fading:!0}:{x:o.x,z:o.z,opacity:1,fading:!1}}function fg(e){const{pose:t,t:n,phase:i,reduced:s}=e,{seg:a}=t,o=a.act,r=o.k,c=CE(n,s),l=GE(t,s),d=a.path.len>.01&&a.from!==null?a.path.len/a.speed:0,f=s?!l.fading:!t.moving,u=s?0:UE(a.from,r),h=t.since-(s?Math.min(dg,d):d),m=mp(o,c,i,s?Ea+rl-.2:Math.max(0,h-u));let _,x;if(!f&&!s)_=OE(r,n),x="walk";else if(!f)_=m,x="walk";else if(h<u){const M=d>0?he:a.from===null?m:mp({k:a.from,at:o.at},c,i),E=is(h/u);_=FE(a.from,r,h/u,lg(M,m,E)),x="walk"}else _=m,x=!s&&(rg.has(r)&&IE(o)||r==="asks"||r==="snack")?"loop":"still";if(t.plane&&!s){const M=t.plane.since;M<Gl+cg&&(x="walk"),f&&(_=BE(_,M))}const p=_.face??t.dir,v=Math.cos(p),y=Math.sin(p),g=l.x+_.dx*v+_.dz*y,b=l.z-_.dx*y+_.dz*v,w={x:g,z:b,dir:p,y:_.y,body:_.body,head:_.head,armL:_.armL,armR:_.armR,legL:_.legL,legR:_.legR,eyes:_.eyes,mouth:_.mouth,props:_.props,screen:_.screen,lamp:_.lamp,grey:_.grey,opacity:l.opacity,motion:x};return!f&&!s&&(a.pastime!==void 0||a.fromSkate===!0)?VE(w,a.fromSkate===!0?t.since:1/0):w}const HE=.4;function VE(e,t){const n={x:.3,y:.62,z:.05,rot:[0,0,Math.PI/2]},i=t/HE,s=i<1?{x:n.x*i,y:.08+(n.y-.08)*i,z:.35*(1-i),rot:[Math.PI*2*i,0,Math.PI/2*i]}:n;return{...e,armR:[-.4,0,.35],props:{...e.props,skate:!0},board:s}}function kE(e,t){return e==="walk"||t==="walk"?"walk":e==="skate"||t==="skate"?"skate":e==="loop"||t==="loop"?"loop":"still"}function WE(e,t,n,i=!1){const s=Math.min(1,Math.max(0,n/Gl)),a=1-(1-s)*(1-s),o=(1-a)*1.6,r=Math.sin(s*Math.PI*3)*.12*(1-s),c={x:e.x-Ln.x*o+r,y:e.y+t*(1-a),z:e.z-Ln.z*o},l={x:Ln.x*1.6*2*(1-s),y:-t*2*(1-s)-.01,z:Ln.z*1.6*2*(1-s)};if(i&&s>.2&&s<.6){const d=(s-.2)/.4*Math.PI*2,f=.45;return{p:{x:c.x+Ln.x*Math.sin(d)*f,y:c.y+(1-Math.cos(d))*f,z:c.z+Ln.z*Math.sin(d)*f},heading:{x:Ln.x*Math.cos(d),y:Math.sin(d),z:Ln.z*Math.cos(d)},roll:0}}return{p:c,heading:l,roll:Math.sin(s*Math.PI*2)*.35}}function XE(e){const t=new Wt,n=e.material(D.paper,{flat:!0}),i=e.material(D.paperShade,{flat:!0}),s=new we(e.box(.16,.012,.42),n);s.position.set(-.08,0,0),s.rotation.z=.25;const a=new we(e.box(.16,.012,.42),n);a.position.set(.08,0,0),a.rotation.z=-.25;const o=new we(e.box(.02,.07,.38),i);return o.position.set(0,-.035,-.01),t.add(s,a,o),t.scale.setScalar(1.3),{group:t,dispose(){for(const r of[s,a,o])r.geometry.dispose();n.dispose(),i.dispose()}}}const Te={knees:.5,arms:1,up:0,lean:0,spin:0,board:[0,0,0],boardUp:0,mouth:"smile",eyes:1,sit:!1},$E=.17,We=e=>e<=0?0:e>=1?1:e*e*(3-2*e),Fe=(e,t,n)=>e+(t-e)*n,di=e=>Math.max(0,Math.min(1,e)),En=(e,t)=>e<=0||e>=1?0:4*t*e*(1-e),qE=(e,t)=>Math.atan2(e,t),Wo=(e,t)=>t===1?e.ramp.xb:e.ramp.xa,ug=(e,t)=>(e.ramp.z0+e.ramp.z1)/2+fr(t)*.8,cl=.9,YE=(e,t,n)=>ug(t,n)+(e.trick==="fifty"?e.side===1?-cl:cl:0),hg=e=>e?.75:.6,Ta=.45,Po=.7,Aa=.3,pg=e=>{const t=e.line.moves[e.i-1];return t&&t.trick!=="roll"?t:null},mg=e=>{let t=0;for(let n=e.i-1;n>=0&&e.line.moves[n]?.trick!=="roll";n--)t++;return t};function ZE(e,t,n){const{park:i,slot:s}=t,{r:a}=i.ramp,o=e.side,r=Wo(i,o),c=ug(i,s),l=qE(o,0),d=pg(t),f=hg(d===null);if(n<f){if(d===null){const p=Zx(i,s),v=n/f;if(v<.4){const g=v/.4,b=1-g,w=b*b*p.x+2*b*g*p.x+g*g*(p.x+o*1),T=b*b*p.z+2*b*g*c+g*g*c;return{x:w,z:T,ys:Qn(i,t.stage,w,T),air:0}}const y=Fe(p.x+o*1,r,We((v-.4)/.6));return{x:y,z:c,ys:sl(i,y),air:0,dir:l}}const m=d.bail?Wo(i,d.side)-d.side*a:Wo(i,d.side),_=We(n/f),x=Fe(m,r,_);return{x,z:Fe(YE(d,i,s),c,_),ys:sl(i,x),air:0,dir:l}}const u=(n-f)/(1-f),h=m=>({x:r+o*m*di(Math.min(u,1-u)*6),z:c,ys:a,air:0,dir:l});switch(e.trick){case"fs_air":return{x:r,z:c,ys:a,air:En(u,1),dir:l};case"fs_180":case"bs_180":return{x:r,z:c,ys:a,air:En(u,.6),dir:l};case"pump":return{x:r,z:c,ys:a,air:En(u,.15),dir:l};case"fifty":return{x:r,z:c+(o===1?-cl:cl)*We(u),ys:a,air:0,dir:l};case"rock_to_fakie":return h(.12);default:return h(.18)}}function KE(e,t,n){const{park:i,stage:s,slot:a}=t,o=i.qp,r=c0(i,s),c=Kx(i,s,a),l=Math.PI,d=c.x;if(n<Ta){const u=Fe(c.z,o.zLip,We(n/Ta));return{x:d,z:u,ys:Qn(i,s,d,u),air:0,dir:l}}if(n>Po){const u=Fe(o.zLip,c.z,We((n-Po)/(1-Po)));return{x:d,z:u,ys:Qn(i,s,d,u),air:0,dir:l}}const f=(n-Ta)/(Po-Ta);return e.trick==="axle_stall"?{x:d,z:o.zLip-.15*di(Math.min(f,1-f)*6),ys:r,air:0,dir:l}:{x:d,z:o.zLip,ys:r,air:En(f,e.trick==="nine"?1.4:.85),dir:l}}const xp=(e,t)=>e?.75-.72*Math.sin(Math.PI*t):.75-.45*Math.sin(Math.PI*t),JE=(e,t)=>Math.PI+e.slot*.9+t*Math.PI;function QE(e,t,n){const{park:i,stage:s}=t,a=i.bowl,o=mg(t),r=o===0,c=JE(t,o);if(r&&n<Aa){const u=ks(i,s,"bowl",e.side,t.slot),h=al(a,xp(!1,0),c),m=n/Aa,_=Fe(u.x,h.x,m),x=Fe(u.z,h.z,m);return{x:_,z:x,ys:Qn(i,s,_,x),air:0}}const l=r?(n-Aa)/(1-Aa):n,d=e.trick==="fs_air",f=al(a,xp(d,l),c+Math.PI*l);return{x:f.x,z:f.z,ys:Qn(i,s,f.x,f.z),air:d?En((l-.35)/.3,.8):0}}function vs(e,t,n){const{park:i,stage:s,slot:a}=t;switch(e.on){case"flat":case"funbox":{const o=ks(i,s,e.on,e.side,a),r=ur(i,s,e.on,e.side,a),c=Fe(o.x,r.x,n);return{x:c,z:o.z,ys:Qn(i,s,c,o.z),air:0}}case"curb":case"rail":case"ledge":{const o=i[e.on],r=Yx(i,e.on),[c,l]=e.side===1?[o.x0-wa,o.x1+wa]:[o.x1+wa,o.x0-wa],d=Fe(c,l,n);if(n<.2){const f=n/.2;return{x:d,z:Fe(r,o.z,We((f-.3)/.7)),ys:0,air:o.h*We(f/.5)+En(f,.15)}}if(n>.8){const f=(n-.8)/.2;return{x:d,z:Fe(o.z,r,We(f/.7)),ys:0,air:o.h*(1-We((f-.5)/.5))+En(f,.12)}}return{x:d,z:o.z,ys:o.h,air:0}}case"stairs":{const o=i.stairs,r=l0(o),c=d0(i),l=c[c.length-1]??{x:o.xTop-.5},d=o.xBottom+.5;if(n<.2)return{x:Fe(l.x,o.xTop,n/.2),z:r,ys:o.h,air:0};if(n<.8){const f=(n-.2)/.6;return{x:Fe(o.xTop,d,f),z:r,ys:0,air:o.h*(1-f*f)+En(f,.3)}}return{x:Fe(d,ur(i,s,"stairs",1,a).x,(n-.8)/.2),z:r,ys:0,air:0}}case"ramp":return ZE(e,t,n);case"qp":case"vert":return KE(e,t,n);case"bowl":return QE(e,t,n);case null:return{x:i.area.x0,z:i.area.z0,ys:0,air:0}}}function jE(e,t){const n=vs(e,t,1);return e.on==="ramp"&&e.bail?{x:Wo(t.park,e.side)-e.side*t.park.ramp.r,z:n.z}:{x:n.x,z:n.z}}function tT(e,t,n){const i=vs(e,t,1);if(e.on!=="ramp")return{...i,ys:Qn(t.park,t.stage,i.x,i.z),air:0};const s=Wo(t.park,e.side),a=Fe(s,s-e.side*t.park.ramp.r,We(n/.3));return{x:a,z:i.z,ys:sl(t.park,a),air:0,dir:i.dir}}function eT(e,t){const{park:n,stage:i,slot:s,line:a,i:o}=e,r=a.moves[o-1],c=a.moves[o],l=[];let d=t;if(r&&r.on){const u=jE(r,{...e,i:o-1});if(d=ur(n,i,r.on,r.side,s),r.on==="ramp"){const{xa:h,xb:m,r:_}=n.ramp,x=Math.max(h+_+.3,Math.min(m-_-.3,u.x));l.push(u,{x,z:u.z},{x:d.x,z:u.z})}else if(r.on==="bowl"){const h=n.bowl,m=Math.atan2(d.z-h.z,d.x-h.x);l.push(u,al(h,.45,m),al(h,0,m))}}const f=c.on?ks(n,i,c.on,c.side,s):t;return l.push(...ng(n,i,d,f)),c.on==="stairs"&&l.push(...d0(n).slice(1)),l}function nT(e,t,n){const i=e.trick,s=r=>{if(t<.25)return{...Te,knees:Fe(.5,1.1,t/.25)};if(t<.75){const c=(t-.25)/.5,l=We(Math.min(1,c/.85));return{...Te,knees:1.1,arms:1.4,up:En(c,.12),boardUp:En(c,.22),board:[r[0]*l,r[1]*l,r[2]*l]}}return{...Te,knees:Fe(1,.5,(t-.75)/.25)}},a=(r,c,l)=>r*We((n-c)/(l-c)),o=r=>({...Te,knees:n>.1&&n<.9?1.3:.6,arms:n>.15&&n<.85?1.9:1.1,spin:r*We(n)});switch(i){case"ollie":return s([0,0,0]);case"kickflip":return s([0,0,Math.PI*2]);case"heelflip":return s([0,0,-Math.PI*2]);case"shove_it":return s([0,Math.PI,0]);case"tre_flip":return s([0,Math.PI*2,Math.PI*2]);case"no_comply":{const r=di((t-.2)/.6);return{...Te,knees:.8,arms:1.3,boardUp:En(r,.25),board:[En(r,.7),0,0]}}case"manual":return{...Te,knees:.6,arms:1.5,lean:-.25,board:[-.28*di(Math.min(t,1-t)*6),0,0]};case"fifty":if(e.on==="ramp"){const r=n<.15?Math.PI/2*We(n/.15):n<.85?Math.PI/2:Math.PI/2+Math.PI/2*We((n-.85)/.15);return{...Te,knees:.75,arms:1.4,spin:r}}return{...Te,knees:.7,arms:1.3};case"five_o":return{...Te,knees:.6,arms:1.4,lean:-.15,board:[-.22,0,0]};case"nosegrind":return{...Te,knees:.8,arms:1.3,lean:.15,board:[.22,0,0]};case"boardslide":return{...Te,knees:.75,arms:1.4,board:[0,Math.PI/2,0],spin:t>.2&&t<.8?Math.PI/2:0};case"drop_in":case"axle_stall":return{...Te,knees:.8,arms:1.2,spin:a(Math.PI,.3,.8)};case"pump":return{...Te,knees:.5+Math.abs(Math.sin(t*Math.PI*2))*.5,spin:a(Math.PI,.1,.9)};case"rock_to_fakie":return{...Te,knees:.8,arms:1.2,board:[-.5*En(di(n/.5),1),0,0],spin:a(Math.PI,.45,.95)};case"fs_180":return{...Te,knees:1,arms:1.3,spin:Math.PI*We(n)};case"bs_180":return{...Te,knees:1,arms:1.3,spin:-Math.PI*We(n)};case"carve":return{...Te,knees:.75,arms:1.1};case"fs_air":return o(e.on==="bowl"?Math.PI*2:Math.PI);case"nine":return o(Math.PI*5);case"roll":return Te}}function iT(e,t,n){switch(e.on){case"ramp":{const i=hg(pg(t)===null);return di((n-i)/(1-i))}case"qp":case"vert":return di((n-Ta)/(Po-Ta));case"bowl":{const i=mg(t)===0?(n-Aa)/(1-Aa):n;return di((i-.35)/.3)}default:return n}}const Fd=(e,t,n)=>Math.hypot(t.x-e.x,t.z-e.z)<1e-4?n:Math.atan2(t.x-e.x,t.z-e.z),Xo=.42;function sT(e,t,n,i){const s=Math.sin(i),a=Math.cos(i),o=y=>[Qn(e,t,n.x+s*y,n.z+a*y),Qn(e,t,n.x-s*y,n.z-a*y)];let r=0,c=Xo;for(let y=0;y<14;y++){const g=(r+c)/2,[b,w]=o(g);Math.hypot(g*2,b-w)>2*Xo?c=g:r=g}const l=r,[d,f]=o(l),u=.04,h=(cc(e,t,n.x+u,n.z)-cc(e,t,n.x-u,n.z))/(2*u),m=(cc(e,t,n.x,n.z+u)-cc(e,t,n.x,n.z-u))/(2*u),_=h*a-m*s,x=di(1-n.air/.3),p=y=>Math.max(-1.35,Math.min(1.35,y));return{base:Math.max(n.ys,Fe(n.ys,(d+f)/2,x)),tilt:[p(-Math.atan2(d-f,2*l))*x,p(Math.atan(_))*x]}}function aT(e,t,n,i){const s=t.seg.pastime;if(!s||t.moving)return null;const a=n.spots[s.slot]??n.spots[0];if(!a)return null;const o=ig(e,s,sg(t),n),r=o.move;if(!r)return cT(a.x,a.z,a.face);const c={park:n,stage:s.stage,slot:s.slot,line:o.line,i:o.line.moves.indexOf(r)},l=r.bail?Math.max(.01,r.dur-Fa):r.dur,d=di(o.into/l);let f,u,h;if(r.trick==="roll"){const E=eT(c,a),A=f0(E),C=We(d)*A,I=Rd(E,C);f={x:I.x,z:I.z,ys:Qn(n,s.stage,I.x,I.z),air:0},u=C>.05?Rd(E,C-.05):I;const U=Rd(E,C+.05);h=r.on===null&&d>=.98?a.face:Fd(u,U,a.face)}else{f=r.bail&&o.into>l?tT(r,c,(o.into-l)/Fa):vs(r,c,d);const A=vs(r,c,Math.max(0,d-.02));u=d<.02&&c.i>0?vs(r,c,0):A,h=f.dir??Fd(u,f,Fd(vs(r,c,d),vs(r,c,Math.min(1,d+.02)),a.face))}const m=r.bail&&o.into>l,_=r.trick==="roll"?oT(d,o.into,i):nT(r,d,iT(r,c,d)),x=m?rT((o.into-l)/Fa):_,p=h+x.spin,v=sT(n,s.stage,f,p),y=v.tilt,g=y[0],b=Math.sin(p)*Math.cos(g)*Xo,w=Math.cos(p)*Math.cos(g)*Xo,T=-Math.sin(g)*Xo;let M=v.base+f.air;for(const E of[1,-1])M=Math.max(M,Qn(n,s.stage,f.x+E*b,f.z+E*w)-E*T);return xg(f.x,f.z,p,M,y,x,"skate")}function oT(e,t,n){const i=Math.sin((t+n)*5);return{...Te,knees:.45,arms:.9,up:e<.6&&i>.6?-.02:0}}function rT(e){return e<.15?{...Te,knees:1.2,arms:2.2,mouth:"oh",eyes:1,board:[0,0,Math.PI*.6*(e/.15)]}:e<.8?{...Te,sit:!0,mouth:"laugh",eyes:.3}:{...Te,knees:Fe(1.2,.5,(e-.8)/.2),mouth:"laugh",eyes:.3}}function cT(e,t,n){return{...xg(e,t,n,0,[0,0],{...Te,knees:0,arms:.2},"still"),y:0,legL:0,legR:-.35,body:[0,0,0],head:[0,0,0],board:{x:.3,y:.08,z:.3,rot:[0,.3,0]}}}function xg(e,t,n,i,s,a,o){const r=a.knees,c={x:0,y:.08+a.boardUp,z:0,rot:a.board};return a.sit?{x:e,z:t,dir:n,y:-.12,body:[-.5,0,0],head:[-.2,0,0],armL:[0,0,-.6],armR:[0,0,.6],legL:-1.45,legR:-1.45,eyes:a.eyes,mouth:a.mouth,props:{...Je,skate:!0},screen:0,lamp:!0,grey:0,opacity:1,motion:o,lift:i,tilt:s,board:{x:.2,y:.08,z:.7,rot:[0,.5,Math.PI]}}:{x:e,z:t,dir:n,y:$E+a.up-r*.08,body:[a.lean,1.25,0],head:[0,-1,0],armL:[0,0,-a.arms],armR:[0,0,a.arms],legL:r,legR:-r*.6,eyes:a.eyes,mouth:a.mouth,props:{...Je,skate:!0},screen:0,lamp:!0,grey:0,opacity:1,motion:o,lift:i,tilt:s,board:c}}const gp=e=>e<.5?2*e*e:1-(-2*e+2)**2/2,Bd=(e,t)=>[e[0]+t[0],e[1]+t[1],e[2]+t[2]];function lT(e,t){if(t===null)return e;const n=Number.isFinite(t.dur)?Math.min(1,Math.max(0,t.since/t.dur)):0,i=t.since,s=Number.isFinite(t.dur),a=(()=>{switch(t.kind){case"salto":return{...e,y:e.y+Math.sin(Math.PI*n)*.7,body:Bd(e.body,[-2*Math.PI*gp(n),0,0]),mouth:"laugh"};case"hop":return{...e,y:e.y+Math.sin(Math.PI*n)*.35,props:{...e.props,coin:n}};case"kickflip":return{...e,y:e.y+Math.sin(Math.PI*n)*.3,body:Bd(e.body,[0,2*Math.PI*gp(n),0]),props:{...e.props,skate:!0},mouth:"laugh"};case"moonwalk":return{...e,dir:e.dir+Math.PI};case"itemget":return{...e,armL:[-Math.PI*.95,0,.2],armR:[-Math.PI*.95,0,-.2],props:{...e.props,crate:!0,crateUp:!0},mouth:"oh"};case"tap":return{...e,armR:[-1.3+Math.sin(i*18)*.25,0,0]};case"clap":{const o=.35+Math.sin(i*14)*.3;return{...e,armL:[-1.3,0,o],armR:[-1.3,0,-o],mouth:"laugh"}}case"dance":return{...e,armL:[-1.5,0,0],armR:[-1.5,0,0],body:Bd(e.body,[0,0,Math.sin(i*6)*.2]),y:e.y+Math.abs(Math.sin(i*6))*.08};case"lookup":return{...e,head:[-.6,e.head[1],e.head[2]],mouth:"oh"};case"golden":return{...e,props:{...e.props,pine:!0,golden:!0}};case"shades":return{...e,props:{...e.props,glasses:!0}};case"speedrun":case"combo":case"stare":case"tetris":case"loop":return e}})();return s&&t.kind!=="moonwalk"?{...a,motion:"walk"}:a}function dT(e,t,n=0){const i=new Wt,s=[],a=(A,C=0)=>{const I=t.material(A,C>0?{emissive:A,ei:C}:{});return s.push(I),I},o=(A,C,I,U,P,O)=>{const V=new we(A,C);return V.position.set(U,P,O),I.add(V),V},r=new Wt,c=a(D.paper,.35);o(t.capsule(.22,.3),c,r,0,0,0),o(t.ball(.035),a(D.ink),r,-.08,.12,.2),o(t.ball(.035),a(D.ink),r,.08,.12,.2),r.visible=!1,i.add(r);const l=e.lounge.length?e.lounge:[e.mainDesk],d=l.reduce((A,C)=>A+C.x,0)/l.length,f=l.reduce((A,C)=>A+C.z,0)/l.length,u=new Wt,h=a(D.pineLeaf);o(t.cylinder(.06,.25),a(D.crate),u,0,.12,0);for(const[A,C]of[.42,.32,.22].entries())o(t.cylinder(C,.3),h,u,0,.35+A*.25,0).scale.set(1,1,1);o(t.ball(.07),a(D.gold,.6),u,0,1.2,0),u.position.set(d,0,f-.6),u.visible=!1,i.add(u);const m=new Wt,_=a(D.paper);o(t.cylinder(.4,.22),_,m,0,.11,0),o(t.cylinder(.3,.18),_,m,0,.31,0),o(t.cylinder(.03,.18),a(D.pineapple),m,0,.49,0),o(t.ball(.045),a(D.gold,.9),m,0,.61,0),m.position.set((e.island.x0+e.island.x1)/2,.66,e.island.z1-.6),m.visible=!1,i.add(m);const x=new Wt,p=e.boardSpots.length?e.boardSpots.reduce((A,C)=>A+C.x,0)/e.boardSpots.length:0,v=.08+t.pictureZ;o(t.box(1.7,.85,.01),a(D.paper),x,p,1.05,v-.005);const y=a(D.marker);for(const A of[-.13,.13])o(t.box(.025,.7,.01),y,x,p+A,1.05,v);for(const A of[-.12,.12])o(t.box(.75,.025,.01),y,x,p,1.05+A,v);const g=a(D.board[0]);for(const[A,C]of[[-.26,.24],[0,0],[.26,-.24]])o(t.box(.16,.025,.01),g,x,p+A,1.05+C,v+.003).rotation.z=Math.PI/4,o(t.box(.16,.025,.01),g,x,p+A,1.05+C,v+.003).rotation.z=-Math.PI/4;x.visible=!1,i.add(x);const b=new Wt,w=a(D.ink);for(const[A,[C,I]]of[[-.22,.25],[.02,.42],[.26,.3]].entries()){const U=new Wt;U.position.set(C??0,I??0,0),U.rotation.z=(A-1)*.25,o(t.ball(.055),w,U,0,0,0).scale.set(1.25,.9,.6),o(t.box(.022,.2,.022),w,U,.05,.1,0),b.add(U)}b.position.set((e.island.x0+e.island.x1)/2,.95,e.island.z0+xr(e,n)-.6),b.visible=!1,i.add(b);const T=e.x0-.5,M=e.x0+e.W+.5,E=(e.island.z0+e.island.z1)/2;return{root:i,update(A){const C=A?.ghost??null;return r.visible=C!==null,C!==null&&r.position.set(T+(M-T)*C,1.7+Math.sin(C*Math.PI*6)*.08,E),u.visible=A?.tree===!0,m.visible=A?.cake===!0,x.visible=A?.doodle===!0,b.visible=A?.music===!0,C!==null},dispose(){i.traverse(A=>{A instanceof we&&A.geometry.dispose()});for(const A of s)A.dispose()}}}function ll(e,t,n,i,s,a,o,r){const c=r.filter(m=>m.x0>a-t/2&&m.x1<a+t/2&&m.z0>o-i/2&&m.z1<o+i/2);if(c.length===0)return e.box(t,n,i,s);const l=new ls,d=-t/2,f=-i/2,u=Math.min(s,t/2,i/2);l.moveTo(d+u,f),l.lineTo(d+t-u,f),l.quadraticCurveTo(d+t,f,d+t,f+u),l.lineTo(d+t,f+i-u),l.quadraticCurveTo(d+t,f+i,d+t-u,f+i),l.lineTo(d+u,f+i),l.quadraticCurveTo(d,f+i,d,f+i-u),l.lineTo(d,f+u),l.quadraticCurveTo(d,f,d+u,f);for(const m of c){const _=new ar,[x,p]=[m.x0-a,m.x1-a],[v,y]=[-(m.z1-o),-(m.z0-o)];_.moveTo(x,v),_.lineTo(x,y),_.lineTo(p,y),_.lineTo(p,v),_.lineTo(x,v),l.holes.push(_)}const h=new Zs(l,{depth:n,bevelEnabled:!1,curveSegments:6});return h.rotateX(-Math.PI/2),h.translate(0,-n/2,0),h}const fT=e=>e.pendants?1.1:.55;function p0(e){e.traverse(t=>{t instanceof we&&(t.castShadow=!0,t.receiveShadow=!0)})}function uT(e,t,n,i,s,a=cs,o=!0){const r=i.pal(s),c=px(n,r),l=new Wt,d=xm(e,a),f=d.x1-d.x0,u=d.z1-d.z0,h=(d.x0+d.x1)/2,m=(d.z0+d.z1)/2,_=i.pits?.(e,a.stage)??[];o&&(c.add(ll(n,f,1.2,u,.45,h,m,_),c.mat(r.dirt),l,h,-.75,m),c.add(ll(n,f,.16,u,0,h,m,_),c.mat(r.grass),l,h,-.1,m));const x=new Map,p={k:c,root:l,o:e,grow:a,stage(g){if(g>a.stage)return null;let b=x.get(g);return b||(b=new Wt,x.set(g,b),l.add(b)),b}};p.stage(0),i.shell(p),i.island(p),i.lounge(p);const v=new Map;for(const[g,b]of e.desks)v.set(g,i.desk(p,b,g));const y=i.mainDesk(p,t);return v.set(t,y),i.growth(p),n.shadows&&p0(l),{root:l,desks:v,mainDesk:y,pal:r,pieces:x,dispose(){l.traverse(g=>{if(g instanceof we){g.geometry.dispose();const b=g.material;for(const w of Array.isArray(b)?b:[b]){const T=w.map;T&&T.dispose(),w.dispose()}}})}}}function hT(e,t,n,i){e.screen.emissiveIntensity=n,e.screen.color.set(n>.05?t.screenOn:t.screenOff);const s=i&&t.pendants;e.lamp.emissiveIntensity=s?fT(t):0,e.lamp.color.set(s?t.lampOn:t.lamp)}const dl=1e-6,_p=new WeakMap;function gg(e,t,n){if(Xs(t,n))return Lo([t]);const i=pT(e),s=vp(i,t),a=vp(i,n);if(xT(s,a))return Lo([t,n]);const o=i.nodes.length,r=new Array(o).fill(1/0),c=new Array(o).fill(-1),l=new Array(o).fill(!1);for(const h of s.ends)r[h.node]=Math.min(Me(r,h.node),h.w);for(;;){let h=-1;for(let m=0;m<o;m++)!Me(l,m)&&Me(r,m)<1/0&&(h<0||Me(r,m)<Me(r,h))&&(h=m);if(h<0)break;l[h]=!0;for(const{to:m,w:_}of Me(i.adj,h))Me(r,h)+_<Me(r,m)-dl&&(r[m]=Me(r,h)+_,c[m]=h)}let d=-1,f=1/0;for(const h of a.ends){const m=Me(r,h.node)+h.w;m<f-dl&&(f=m,d=h.node)}if(d<0)return Lo([t,n]);const u=[];for(let h=d;h>=0;h=Me(c,h))u.unshift(Me(i.nodes,h));return Lo([t,s.at,...u,n])}function Lo(e){const t=gT(e),n=[];let i=0;for(let s=1;s<t.length;s++){const a=Di(Me(t,s-1),Me(t,s));n.push(a),i+=a}return{pts:t,seg:n,len:i}}function _g(e,t){const n=Me(e.pts,0);let i=Math.max(0,t);for(let s=0;s<e.seg.length;s++){const a=Me(e.seg,s);if(i<=a||s===e.seg.length-1){const o=a>0?Math.min(1,i/a):1,r=Me(e.pts,s),c=Me(e.pts,s+1);return{x:r.x+(c.x-r.x)*o,z:r.z+(c.z-r.z)*o,dir:Math.atan2(c.x-r.x,c.z-r.z)}}i-=a}return{x:n.x,z:n.z,dir:0}}function pT(e){let t=_p.get(e);return t||(t=mT(e),_p.set(e,t)),t}function mT(e){const n=e.walks.filter(([l,d])=>!Xs(l,d)),i=[],s=new Map,a=l=>{const d=vT(l);let f=s.get(d);return f===void 0&&(f=i.length,i.push(l),s.set(d,f)),f};for(const[l,d]of n)a(l),a(d);const o=[],r=i.map(()=>[]),c=new Set;for(const l of n){const d=i.filter(f=>vg(l,f)).sort((f,u)=>Di(l[0],f)-Di(l[0],u));for(let f=1;f<d.length;f++){const u=Me(d,f-1),h=Me(d,f),m=a(u),_=a(h);if(m===_)continue;const x=m<_?`${String(m)}-${String(_)}`:`${String(_)}-${String(m)}`;if(c.has(x))continue;c.add(x);const p=Di(u,h);o.push([u,h]),Me(r,m).push({to:_,w:p}),Me(r,_).push({to:m,w:p})}}return{legs:o,nodes:i,adj:r}}function vp(e,t){const n=e.nodes.findIndex(o=>Xs(o,t));if(n>=0)return{at:Me(e.nodes,n),leg:-1,ends:[{node:n,w:0}]};const i=o=>e.nodes.findIndex(r=>Xs(r,o)),s=e.legs.findIndex(o=>vg(o,t));if(s>=0){const[o,r]=Me(e.legs,s);return{at:t,leg:s,ends:[{node:i(o),w:Di(t,o)},{node:i(r),w:Di(t,r)}]}}let a=0;return e.nodes.forEach((o,r)=>{Di(o,t)<Di(Me(e.nodes,a),t)&&(a=r)}),{at:Me(e.nodes,a),leg:-1,ends:[{node:a,w:0}]}}function xT(e,t){return e.leg>=0&&t.leg>=0?e.leg===t.leg:e.leg>=0?t.ends.some(n=>e.ends.some(i=>i.node===n.node)):t.leg>=0?e.ends.some(n=>t.ends.some(i=>i.node===n.node)):!1}function vg([e,t],n){const i=t.x-e.x,s=t.z-e.z,a=i*i+s*s;if(a<dl*dl)return Xs(e,n);const o=((n.x-e.x)*i+(n.z-e.z)*s)/a;return o<-1e-4||o>1+1e-4?!1:Math.abs((n.x-e.x)*s-(n.z-e.z)*i)/Math.sqrt(a)<1e-4}function gT(e){const t=[],n=i=>Me(t,t.length-i);for(const i of e)if(!(t.length&&Xs(n(1),i)))for(t.push({x:i.x,z:i.z});t.length>=3&&_T(n(3),n(2),n(1));)t.splice(t.length-2,1),t.length>=2&&Xs(n(2),n(1))&&t.pop();return t}function _T(e,t,n){const i=(t.x-e.x)*(n.z-t.z)-(t.z-e.z)*(n.x-t.x),s=(t.x-e.x)*(n.x-t.x)+(t.z-e.z)*(n.z-t.z);return Math.abs(i)<1e-6&&s>=0}const Di=(e,t)=>Math.hypot(e.x-t.x,e.z-t.z),Xs=(e,t)=>Di(e,t)<1e-4;function Me(e,t){const n=e[t];if(n===void 0)throw new Error(`bims paths: index ${String(t)} out of ${String(e.length)}`);return n}const vT=e=>`${String(Math.round(e.x*1e4))},${String(Math.round(e.z*1e4))}`,MT=.35,yT=.4;function bT(e,t){const n=[],i=()=>{if(n.length===0)for(const a of["crew-a","crew-b"]){const o=og(a,!1,t);t.shadows&&p0(o.group),o.group.visible=!1,e.add(o.group),n.push(o)}return n},s=()=>{for(const a of n)a.group.visible=!1};return{update(a,o,r,c,l,d){if(!r)return s(),c&&c.scale.setScalar(1),!1;const f=a-r.at,u=Rc+hm;if(l||f>=u||f<0)return s(),c&&(c.visible=!0,c.scale.setScalar(1)),!1;if(c){const w=(f-Rc)/yT;c.visible=w>0;const T=Math.min(1,Math.max(.01,w));c.scale.setScalar(T)}const h=d.pieceAt(o,r.stage),m=gg(o,o.door,h),_=Math.max(.5,m.len/Rc),x={k:"landing",at:"queue"},p={x:h.x,z:h.z,wz:h.z,ax:h.x,face:0},v={t:r.at,act:x,sig:"unlock",spot:p,path:m,speed:_,from:"starting"},y=Math.min(m.len,f*_),g=_g(m,y),b=y<m.len;return i().forEach((w,T)=>{const M=(T===0?-1:1)*MT,E={x:g.x+Math.cos(g.dir)*M,z:g.z-Math.sin(g.dir)*M,dir:g.dir,moving:b,since:f,seg:v},A=fg({pose:E,t:a,phase:T*.5,reduced:!1}),C=Math.min(1,Math.max(0,u-f));w.apply({...A,opacity:Math.min(A.opacity,C)}),w.group.visible=!0}),!0},dispose(){for(const a of n)e.remove(a.group),a.dispose();n.length=0}}}const ST=.42,wT=12,ET=1.25,TT=.45,ga={inner:.34,outer:.5,alpha:.28,day:"#1d1a17",night:"#f3ede4"};function AT(e,t={}){const n=t.ground??!0,i=new Wt;let s=null,a=[],o=null,r=null,c=!1,l=null,d=!1,f=cs,u=No(cs);const h=bT(i,e),m=new Map,_=new Map,x=new Map,p=new Hu(ga.inner,ga.outer,40);p.rotateX(-Math.PI/2);const v=new wl({color:ga.day,transparent:!0,opacity:ga.alpha,depthWrite:!1}),y=new Map;function g(){return cu(s?.map??"loft")}function b(){return a.find(P=>P.main)?.name??"main"}function w(P){if(o&&(i.remove(o.root),o.dispose(),o=null),r=P,!s)return;const O=cu(s.map);c=!1,o=uT(s,b(),e,O,P,f,n),i.add(o.root),l&&(i.remove(l.root),l.dispose()),l=dT(s,e,f.stage),i.add(l.root)}function T(P,O){if(!d||O)return;const V=a.filter(B=>!B.main).map(B=>B.name),N=V.indexOf(P),F=V[(N+1)%V.length]??P,L=hx(F,!1);return N===0?{...L,hoodie:ux}:L}function M(){for(const P of m.values())i.remove(P.group),P.dispose();m.clear(),_.clear()}function E(){const P=new Set(a.map(O=>O.name));for(const[O,V]of m)P.has(O)||(i.remove(V.group),V.dispose(),m.delete(O),_.delete(O));for(const O of a)A(O.name,O.main)}function A(P,O){let V=m.get(P);if(!V){const N=g();V=og(P,O,e,T(P,O),O?void 0:F=>N.wear?.(F)),e.shadows&&p0(V.group),V.group.visible=!1,m.set(P,V),i.add(V.group)}return V}function C(P,O){const V=new Set;for(const N of P){const F=N.pose.plane?.since;if(F===void 0||F<0||F>=Gl)continue;const L=_.get(N.name);if(!L)continue;V.add(N.name);let B=x.get(N.name);B||(B=XE(e),x.set(N.name,B),i.add(B.group));const $={x:L.x,y:1,z:L.z},J=WE($,l1(O,$),F,N.egg?.kind==="loop");B.group.visible=!0,B.group.scale.setScalar(Math.max(1,wT*ET*O.scale/ST)),B.group.position.set(J.p.x,J.p.y,J.p.z),B.group.lookAt(J.p.x+J.heading.x,J.p.y+J.heading.y,J.p.z+J.heading.z),B.group.rotateZ(J.roll)}for(const[N,F]of x)V.has(N)||(i.remove(F.group),F.dispose(),x.delete(N));return V.size>0}function I(P,O){v.color.set(O?ga.night:ga.day);const V=new Set;for(const N of P){const F=_.get(N.name);if(N.lit!==!0||!F)continue;V.add(N.name);let L=y.get(N.name);L||(L=new we(p,v),L.renderOrder=1,y.set(N.name,L),i.add(L)),L.position.set(F.x,.02,F.z),L.visible=F.opacity>.05}for(const[N,F]of y)V.has(N)||(i.remove(F),y.delete(N))}const U=P=>{const O=m.get(P);return O&&O.group.visible?O:null};return{root:i,setOffice(P,O){s&&s.map!==P.map&&M(),s=P,a=O,w(r??!1),E()},prepare(P){if(!s)return!1;const O=P.grow??cs;let V=!1;No(O)!==u?(f=O,u=No(O),w(P.night),V=!0):r!==P.night&&w(P.night),c=P.eggs?.eclipse===!0;const N=P.eggs?.april===!0;return N!==d&&(d=N,M()),V},frame(P,O,V,N,F){if(!s||!o)return null;const L=o.pal;let B="still";const $=new Set;_.clear();for(const J of O){const st=A(J.name,J.main),Tt=s.park,H=Tt&&!V.reduced?aT(J.name,J.pose,Tt,st.outfit.phase):null,et=lT(H??fg({pose:J.pose,t:P,main:J.main,phase:st.outfit.phase,reduced:V.reduced}),J.egg??null);st.apply(et),_.set(J.name,et),$.add(J.name),B=kE(B,et.motion),F?.(J,et,H!==null)}for(const[J,st]of m)$.has(J)||(st.group.visible=!1);I(O,V.night);for(const[J,st]of o.desks){const Tt=_.get(J);hT(st,L,Tt?.screen??0,Tt?Tt.lamp:J!==b())}return!V.reduced&&C(O,N)&&(B="walk"),l?.update(V.eggs)===!0&&(B="walk"),h.update(P,s,V.unlock,V.unlock?o.pieces.get(V.unlock.stage):void 0,V.reduced,g())&&(B="walk"),B},sky(){return o?c?new ee(o.pal.bg).lerp(new ee(D.eclipse),TT):o.pal.bg:null},pal:()=>o?.pal??null,office:()=>s,headTop(P,O){return U(P)?.headTop(O)??null},feet(P,O){return U(P)?.feet(O)??null},names:()=>[...m.keys()],body:P=>m.get(P)?.group??null,desk:P=>o?.desks.get(P),pieceAt(P){return s?g().pieceAt(s,P):null},world:()=>o?.root??null,dispose(){o&&(i.remove(o.root),o.dispose(),o=null),l&&(l.dispose(),l=null),h.dispose();for(const P of m.values())P.dispose();m.clear();for(const P of x.values())P.dispose();x.clear();for(const P of y.values())i.remove(P);y.clear(),p.dispose(),v.dispose()}}}function zT(e,t){const n=new cS({canvas:e,antialias:yn.antialias,alpha:!1,powerPreference:"low-power"});n.shadowMap.enabled=yn.shadows,n.shadowMap.type=Uo,n.shadowMap.autoUpdate=t.shadowAuto;const i=new c_,s=new zl(-1,1,1,-1,.1,Ur*3),a=new av,o=new cv;i.add(a,o,o.target);let r=!1,c=null;const l=[],d=f=>{f.preventDefault(),r=!0;for(const u of l)u()};return e.addEventListener("webglcontextlost",d),{renderer:n,scene:i,camera:s,hemi:a,sun:o,look(f){const u=f.target;s.position.set(u.x+La.x*Ur,u.y+La.y*Ur,u.z+La.z*Ur),s.up.set(0,1,0),s.lookAt(u.x,u.y,u.z),s.left=f.left,s.right=f.right,s.top=f.top,s.bottom=f.bottom,s.updateProjectionMatrix()},size(f){n.setPixelRatio(Math.min(window.devicePixelRatio||1,yn.maxPixelRatio)),n.setSize(f.widthPx,f.heightPx,!1)},sky(f){c!==null&&typeof f!="object"&&c===f||(c=f,n.setClearColor(f))},tint(f){a.color.set(f.hemi[0]),a.groundColor.set(f.hemi[1]),a.intensity=f.hemi[2],o.color.set(f.sun[0]),o.intensity=f.sun[1]},render(){n.render(i,s)},copyTo(f){n.render(i,s),f.getContext("2d")?.drawImage(e,0,0,f.width,f.height)},lost:()=>r,onLost(f){l.push(f)},dispose(){e.removeEventListener("webglcontextlost",d),n.dispose()}}}const RT=14;function CT(e,t,n){const i=n.x-t.x,s=n.y-t.y,a=i*i+s*s,o=a===0?0:Math.max(0,Math.min(1,((e.x-t.x)*i+(e.y-t.y)*s)/a));return Math.hypot(e.x-(t.x+i*o),e.y-(t.y+s*o))}function PT(e,t,n){const i={x:t,y:n};let s=null,a=RT;for(const c of e){if(!c.head||!c.feet)continue;const l=CT(i,c.head,c.feet);l<a&&(a=l,s=c.name)}if(s!==null)return s;let o=null,r=1/0;for(const c of e){if(!c.desk)continue;const l=Math.hypot(t-c.desk.x,n-c.desk.y);l<c.desk.r&&l<r&&(r=l,o=c.name)}return o}const As=1.25,Mg=1.5,Is=1.8,za=11,yg=.5,LT=As+.3,IT=Is-.2,DT=7,pc=2.5,NT=12;function UT(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let n=t;return n=Math.imul(n^n>>>15,n|1),n^=n+Math.imul(n^n>>>7,n|61),((n^n>>>14)>>>0)/4294967296}}function OT(e){let t=2166136261;for(let n=0;n<e.length;n++)t=Math.imul(t^e.charCodeAt(n),16777619);return t>>>0}function FT(e){return e<=3?Math.min(2,Math.max(1,e)):Math.ceil(Math.sqrt(e*1.3))}function BT(e,t,n){const i=[];let s=e;for(;s>0;){const a=t<=2?t:t+(n()<.3?-1:n()<.45?1:0),o=s-a===1&&t>2?s:Math.min(s,Math.max(1,a));i.push(o),s-=o}return i}const fl=(e,t)=>Math.hypot(e.x-t.x,e.z-t.z);function Mp(e,t){const n=e[0];if(n===void 0)return[];const i=[n];let s=0;for(let o=1;o<e.length;o++){const r=e[o-1]??n,c=e[o]??r,l=fl(r,c);let d=t-s;for(;d<=l;){const f=d/l;i.push({x:r.x+(c.x-r.x)*f,z:r.z+(c.z-r.z)*f}),d+=t}s=l-(d-t)}const a=e[e.length-1]??n;return fl(i[i.length-1]??n,a)>1e-6&&i.push(a),i}function GT(e,t){let n=e;for(let i=0;i<t;i++){if(n.length<3)return[...n];const s=[n[0]??{x:0,z:0}];for(let a=0;a<n.length-1;a++){const o=n[a]??{x:0,z:0},r=n[a+1]??o;s.push({x:.75*o.x+.25*r.x,z:.75*o.z+.25*r.z},{x:.25*o.x+.75*r.x,z:.25*o.z+.75*r.z})}s.push(n[n.length-1]??{x:0,z:0}),n=s}return[...n]}function yp(e,t){return Mp(GT(Mp(e,t),4),yg)}function du(e,t,n,i){return e.some(s=>t>s.fp.x0-i&&t<s.fp.x1+i&&n>s.fp.z0-i&&n<s.fp.z1+i)}function bg(e){return{road:e.road.filter(t=>du(e.offices,t.x,t.z,LT)).length,river:e.river.filter(t=>du(e.offices,t.x,t.z,IT)).length}}const Sg=8,bp=7;function HT(e,t,n,i){const s=[],a=[];let o=0,r=0;return e.forEach((c,l)=>{const d=l>0&&l-1===t,f=c.home===!0||e[l-1]?.home===!0;let u=l===0?0:d?za:f?DT:3+n()*4;l>0&&!d&&!f&&i.since>=i.next&&(u=Sg+2+n()*2,a.push(o+u/2),i.since=0,i.next=4+Math.floor(n()*2)),i.since++,d&&(r=o+za/2);const h=o+u-c.fp.x0;s.push(h),o=h+c.fp.x1}),t>=e.length-1&&(r=o+za/2,o+=za),{xs:s,riverX:r,width:o,squares:a}}function Sp(e,t){const n=UT(t),i=e.find(N=>N.home===!0),s=e.filter(N=>N.home!==!0),a=[];let o=0;for(const N of BT(s.length,FT(e.length),n))a.push(s.slice(o,o+N)),o+=N;if(i!==void 0){const N=a[Math.floor(a.length/2)];N===void 0?a.push([i]):N.splice(Math.ceil(N.length/2),0,i)}const r=[],c=[],l={since:0,next:4+Math.floor(n()*2)};let d=0;for(const[N,F]of a.entries()){const L=F.length===1?0:Math.min(F.length-2,Math.max(0,Math.floor(F.length/2)-1+N%2)),B=HT(F,L,n,l),$=r[N-1],J=$===void 0?-B.width/2:$.riverX+(n()-.5)*6-B.riverX,st=F.map((rt,Mt)=>{const Kt=(B.xs[Mt]??0)+J,lt=d+n()*5-rt.fp.z0;return{id:rt.id,x:Kt,z:lt,fp:{x0:Kt+rt.fp.x0,x1:Kt+rt.fp.x1,z0:lt+rt.fp.z0,z1:lt+rt.fp.z1},door:{x:Kt+rt.doorX,z:lt+rt.fp.z1}}}),Tt=Math.max(...st.map(rt=>rt.fp.z1)),H=Math.min(...st.map(rt=>rt.fp.z0)),et=st.map(rt=>rt.fp.z1+2+n()*6),W=[];st.forEach((rt,Mt)=>{const Kt=et[Mt]??rt.fp.z1+3;W.push({x:rt.door.x,z:Kt});const lt=st[Mt+1],pt=et[Mt+1];lt!==void 0&&pt!==void 0&&W.push({x:(rt.fp.x1+lt.fp.x0)/2,z:Math.max(Kt,pt)+n()*1.2})});for(const rt of B.squares)c.push({x:rt+J,z:d+1+bp/2,w:Sg,d:bp});const k=B.riverX+J,at=Math.min(J,...st.map(rt=>rt.fp.x0),k-za/2),mt=Math.max(J+B.width,...st.map(rt=>rt.fp.x1),k+za/2);r.push({offices:st,riverX:k,back:H,front:Tt,x0:at,x1:mt,stops:W}),d=Math.max(...W.map(rt=>rt.z))+As+4+n()*2.5}const f=r.flatMap(N=>N.offices),u=Math.min(...r.map(N=>N.x0)),h=Math.max(...r.map(N=>N.x1)),m=Math.min(...r.map(N=>N.back)),_=Math.max(...r.map(N=>Math.max(...N.stops.map(F=>F.z)))),x=[],p=r[0]?.stops[0]??{z:0};x.push({x:u-40,z:p.z-3},{x:u-8,z:p.z}),r.forEach((N,F)=>{const L=F%2===0,B=L?N.stops:[...N.stops].reverse();x.push(...B);const $=r[F+1],J=B[B.length-1]??p;if($===void 0){x.push({x:L?h+8:u-8,z:J.z},{x:L?h+40:u-40,z:J.z+3});return}const Tt=(L?[...$.stops].reverse():$.stops)[0]??J,H=L?Math.max(N.x1,$.x1)+6+n()*2:Math.min(N.x0,$.x0)-6-n()*2,et=L?3:-3;x.push({x:H,z:J.z},{x:H+et,z:(J.z+Tt.z)/2},{x:H,z:Tt.z})});const v=yp(x,2.5),y=[];if(f.length>1){const N=[],F=r[0];F!==void 0&&N.push({x:F.riverX-3,z:m-16},{x:F.riverX+1,z:m-8}),r.forEach((L,B)=>{N.push({x:L.riverX,z:L.back-3},{x:L.riverX,z:L.front+Is+.6});const $=r[B+1];$!==void 0?N.push({x:$.riverX,z:$.back-Is-.6}):N.push({x:L.riverX+2,z:_+8},{x:L.riverX-2,z:_+18})}),y.push(...yp(N,1.2))}const g={x0:u-12,x1:h+14,z0:m-10,z1:_+10},b=i===void 0?void 0:f.find(N=>N.id===i.id),w=b===void 0?null:{x0:b.fp.x0-pc,x1:b.fp.x1+pc,z0:b.fp.z0-pc,z1:b.fp.z1+pc},T=(N,F)=>N>g.x0&&N<g.x1&&F>g.z0&&F<g.z1,M=[];for(let N=0;N<v.length-1;N++){const F=v[N],L=v[N+1];F===void 0||L===void 0||!T(F.x,F.z)||M.some(B=>fl(B,F)<6)||y.some(B=>fl(B,F)<yg)&&M.push({x:F.x,z:F.z,ang:Math.atan2(L.x-F.x,L.z-F.z)})}const E=[],A=[];for(const N of f){let F=1/0;for(let $=0;$<v.length-1;$++){const J=v[$],st=v[$+1];if(J===void 0||st===void 0||(J.x-N.door.x)*(st.x-N.door.x)>0||J.x===st.x)continue;const Tt=J.z+(st.z-J.z)*(N.door.x-J.x)/(st.x-J.x);Tt>N.door.z&&Tt<F&&(F=Tt)}if(!Number.isFinite(F))continue;const L={x:N.door.x,z0:N.door.z,z1:F};E.push(L);const B=y.filter($=>Math.abs($.x-L.x)<Mg&&$.z>L.z0&&$.z<L.z1-As);B.length>0&&A.push({x:L.x,z:B.reduce(($,J)=>$+J.z,0)/B.length})}const C=(N,F,L,B)=>N.some($=>Math.abs($.x-F)<B&&Math.abs($.z-L)<B&&Math.hypot($.x-F,$.z-L)<B),I=(N,F,L)=>T(N,F)&&(w===null||N<w.x0-L||N>w.x1+L||F<w.z0-L||F>w.z1+L)&&!c.some(B=>Math.abs(B.x-N)<B.w/2+L+.4&&Math.abs(B.z-F)<B.d/2+L+.4)&&!du(f,N,F,1.2+L)&&!C(v,N,F,As+1.2+L)&&!C(y,N,F,Is+.6+L)&&E.every(B=>Math.abs(B.x-N)>1.2+L||F<B.z0||F>B.z1),U=[],P=Math.min(10,3+f.length);for(let N=0;N<400&&U.length<P&&v.length>1;N++){const F=Math.floor(n()*(v.length-1)),L=v[F],B=v[F+1];if(L===void 0||B===void 0)continue;const $=Math.atan2(B.x-L.x,B.z-L.z),J=n()<.5?-1:1,st=As+2.6,Tt=L.x+Math.cos($)*st*J,H=L.z-Math.sin($)*st*J;!I(Tt,H,1.4)||C(U,Tt,H,4)||U.push({x:Tt,z:H,ang:$,w:1.7+n()*.8,d:1.7+n()*.8,tone:U.length})}const O=[],V=30+f.length*8;for(let N=0;N<900&&O.length<V;N++){const F=g.x0+n()*(g.x1-g.x0),L=g.z0+n()*(g.z1-g.z0);if(!I(F,L,.6))continue;const B=1+Math.floor(n()*5);for(let $=0;$<B;$++){const J=F+(n()-.5)*3,st=L+(n()-.5)*3;I(J,st,0)&&!C(U,J,st,2.2)&&!C(O,J,st,.7)&&O.push({x:J,z:st,size:.75+n()*.5})}}return{offices:f,road:v,river:y,bridges:M,paths:E,footbridges:A,houses:U,trees:O,squares:c,heart:w,lawn:g,seed:t}}function VT(e,t){let n=null;for(let i=0;i<NT;i++){const s=Sp(e,t+i*7919>>>0),a=bg(s),o=a.road+a.river;if(o===0)return s;(n===null||o<n.hits)&&(n={plan:s,hits:o})}return n?.plan??Sp(e,t)}const kT={water:"#7cc3e8",bank:"#d9cf9c",road:"#9a9590",dash:"#f4f0e8",path:"#e2c79a",wood:"#c49a6c",rail:"#a0673f",trunk:"#a0673f",leaves:["#5fb35a","#7cc26b","#4e9a48"],walls:["#f3d5b5","#bfe1f2","#fffaf0","#ffe3a3","#cfe8c3"],roofs:["#ef8354","#5c677d","#2a9d8f"],stone:"#e4dccd"},WT={water:"#1d3b52",bank:"#3c5a3a",road:"#3a3d44",dash:"#8d8a84",path:"#5c4b3e",wood:"#6b5440",rail:"#5c4b3e",trunk:"#6e4a31",leaves:["#3f8a3e","#4f9a4a","#356f33"],walls:["#8a7663","#5e7686","#9a9284","#9a8455","#6f8466"],roofs:["#8a4a33","#3c4350","#1f6a62"],stone:"#6f685f"},_e=-.06;function mc(e,t,n,i){const s=[];for(let r=0;r<e.length-1;r++){const c=e[r],l=e[r+1];if(c===void 0||l===void 0||!i(c)||!i(l))continue;const d=e[r-1]??c,f=e[r+2]??l,u=wp(l.x-d.x,l.z-d.z),h=wp(f.x-c.x,f.z-c.z),m=[c.x+u.x*t,n,c.z+u.z*t],_=[c.x-u.x*t,n,c.z-u.z*t],x=[l.x+h.x*t,n,l.z+h.z*t],p=[l.x-h.x*t,n,l.z-h.z*t];s.push(...m,...x,..._,..._,...x,...p)}const a=new Ne;a.setAttribute("position",new pn(new Float32Array(s),3));const o=new Float32Array(s.length);for(let r=1;r<o.length;r+=3)o[r]=1;return a.setAttribute("normal",new pn(o,3)),a}function wp(e,t){const n=Math.hypot(e,t)||1;return{x:-t/n,z:e/n}}function XT(e,t,n,i,s=[]){const a=px(t,n),o=new Wt,{lawn:r}=e,c=v=>v.x>r.x0&&v.x<r.x1&&v.z>r.z0&&v.z<r.z1,l=r.x1-r.x0,d=r.z1-r.z0,f=(r.x0+r.x1)/2,u=(r.z0+r.z1)/2;a.add(ll(t,l,1.2,d,.45,f,u,s),a.mat(n.dirt),o,f,_e-.08-.6-.01,u),a.add(ll(t,l,.16,d,.05,f,u,s),a.mat(n.grass),o,f,_e-.08,u);const h=(v,y)=>{const g=new we(v,a.mat(y));o.add(g)};e.river.length>1&&(h(mc(e.river,Is,_e+.005,c),i.bank),h(mc(e.river,Mg,_e+.012,c),i.water)),h(mc(e.road,As,_e+.02,c),i.road);const m=[];for(let v=0;v+2<e.road.length;v+=5){const y=e.road[v],g=e.road[v+2];y!==void 0&&g!==void 0&&m.push([y,g])}for(const v of m)h(mc(v,.06,_e+.03,c),i.dash);for(const v of e.paths){const y=v.z1-v.z0;y>0&&a.add(t.box(1,.04,y,.01),a.mat(i.path),o,v.x,_e+0,v.z0+y/2)}const _=(v,y,g,b,w)=>{const T=new Wt;T.position.set(v,0,y),T.rotation.y=g,o.add(T),a.add(t.box(b*2+.6,.14,w),a.mat(i.wood),T,0,_e+.1,0);for(const M of[-1,1]){a.add(t.box(.12,.12,w),a.mat(i.rail),T,M*(b+.25),_e+.45,0);for(const E of[-w/2+.2,0,w/2-.2])a.add(t.box(.14,.42,.14),a.mat(i.rail),T,M*(b+.25),_e+.3,E)}};for(const v of e.bridges)_(v.x,v.z,v.ang,As,Is*2+1);for(const v of e.footbridges)_(v.x,v.z,0,.5,Is*2+.6);for(const v of e.houses){const y=new Wt;y.position.set(v.x,0,v.z),y.rotation.y=v.ang,o.add(y),a.add(t.box(v.w,1.2,v.d,.2),a.mat(i.walls[v.tone%i.walls.length]??n.wall),y,0,_e+.6,0);const g=a.add(new Tl(Math.max(v.w,v.d)*.78,.9,4),a.mat(i.roofs[v.tone%i.roofs.length]??n.wallTop),y,0,_e+1.65,0);g.rotation.y=Math.PI/4}for(const v of e.squares){a.add(t.box(v.w-1,.05,v.d-1,.3),a.mat(i.stone),o,v.x,_e+.01,v.z),a.add(t.cylinder(1.1,.36),a.mat(i.stone),o,v.x,_e+.2,v.z),a.add(t.cylinder(.92,.06),a.mat(i.water),o,v.x,_e+.38,v.z),a.add(t.cylinder(.16,.7),a.mat(i.stone),o,v.x,_e+.5,v.z);for(const y of[-1,1]){a.add(t.box(1.3,.1,.4),a.mat(i.wood),o,v.x,_e+.32,v.z+y*2.1);for(const g of[-.5,.5])a.add(t.box(.1,.3,.3),a.mat(i.rail),o,v.x+g,_e+.15,v.z+y*2.1)}for(const[y,g]of[[-1,-1],[1,-1],[-1,1],[1,1]])p(v.x+y*(v.w/2-1.1),v.z+g*(v.d/2-1.1),.8)}const x=e.heart;if(x!==null){const v=(x.x0+x.x1)/2,y=(x.z0+x.z1)/2;a.add(t.box(x.x1-x.x0,.05,x.z1-x.z0,.3),a.mat(i.stone),o,v,_e+.01,y);for(const[g,b]of[[-1,-1],[1,-1],[-1,1],[1,1]]){const w=g<0?x.x0+.9:x.x1-.9,T=b<0?x.z0+.9:x.z1-.9;p(w,T,1);const M=w-g*1.6;a.add(t.box(1.1,.4,.7,.08),a.mat(i.stone),o,M,_e+.2,T),a.add(t.ball(.42),a.mat(i.leaves[1]),o,M,_e+.55,T)}for(const g of[-1,1]){const b=g<0?x.x0+.5:x.x1-.5,w=new Wt;w.position.set(b,0,y),w.rotation.y=Math.PI/2,o.add(w),a.add(t.box(1.3,.1,.4),a.mat(i.wood),w,0,_e+.32,0);for(const T of[-.5,.5])a.add(t.box(.1,.3,.3),a.mat(i.rail),w,T,_e+.15,0)}}for(const v of e.trees)p(v.x,v.z,v.size);return o;function p(v,y,g){const b={x:v,z:y};a.add(t.cylinder(.14*g,1.2*g),a.mat(i.trunk),o,b.x,_e+.6*g,b.z),a.add(t.ball(.55*g),a.mat(i.leaves[0]),o,b.x,_e+1.5*g,b.z),a.add(t.ball(.38*g),a.mat(i.leaves[1]),o,b.x+.32*g,_e+1.25*g,b.z+.2*g),a.add(t.ball(.34*g),a.mat(i.leaves[2]),o,b.x-.3*g,_e+1.3*g,b.z-.15*g)}}const $T=480;function Ep(e){return{...e.lawn,yLow:-1.35,yHigh:3}}function qT(e,t,n,i=!1){return i?r1(Ep(e),t,n):wu(Ep(e),t,n)}function YT(e,t,n){const i=n>=$T?o1(t):bl(t);return{...i,x0:i.x0+e.x,x1:i.x1+e.x,z0:i.z0+e.z,z1:i.z1+e.z}}function ZT(e,t,n){return wu(YT(e,t,n),n,4e3)}const Tp=1.15;function KT(e,t,n,i=!1){const s=xm(t,n);if(!i)return{id:e,fp:{x0:s.x0,x1:s.x1,z0:s.z0,z1:s.z1},doorX:t.door.x};const a=(s.x0+s.x1)/2,o=(s.z0+s.z1)/2,r=(s.x1-s.x0)*Tp/2,c=(s.z1-s.z0)*Tp/2;return{id:e,fp:{x0:a-r,x1:a+r,z0:o-c,z1:o+c},doorX:t.door.x,home:!0}}const JT=e=>OT(e.join("\0")),QT=2.6,jT=1.6,tA=4,eA=()=>window.bise?.test===!0;function nA(e){const t=e.agents.map(n=>`${n.name}:${n.status}${n.main?"*":""}`).join(";");return`${e.office.map}|${e.office.size}|${[...e.office.desks.keys()].join(",")}|${No(e.look.grow??cs)}|${e.look.night?"n":"d"}|${t}`}const Ap=e=>`${e.office.map}|${e.office.size}|${e.agents.map(t=>`${t.name}${t.main?"*":""}`).join(",")}`,iA=(e,t={})=>{const n=zT(e,{shadowAuto:!1}),{renderer:i,scene:s,sun:a}=n;let o=null,r="",c=[],l=null,d={w:0,maxH:0},f=null,u=null,h=lS,m=!0,_="";const x=new Map;let p=null,v=t.entry===!0;const y=new q,g=eA()?{frames:0,calls:0,ms:0,offices:0,merged:{from:0,to:0},live:[],recent:[],check:{road:0,river:0},heads:[]}:null;g&&(window.__biseTown=g);const b=H=>o?.offices.find(et=>et.id===H);function w(H){let et=x.get(H);return et||(et={scene:AT(yn,{ground:!1}),shape:"",bake:null,live:!1,walls:null},x.set(H,et)),et}function T(H){H.bake&&(s.remove(H.bake.holder),H.bake.merged.dispose(),H.bake=null)}function M(H){if(!H.walls)return;H.scene.root.remove(H.walls.merged.group),H.walls.merged.dispose(),H.walls=null;const et=H.scene.world();et&&(et.visible=!0)}function E(H,et){const W=H.scene.world();if(!W)return;const k=`${H.shape}|${No(et.look.grow??cs)}|${et.look.night?"n":"d"}|${String(W.id)}`;if(H.walls?.sig===k)return;M(H);const at=H.scene.root.position.clone();H.scene.root.position.set(0,0,0),H.scene.root.updateMatrixWorld(!0),W.visible=!0;const mt=Ud(W,yn,yn.shadows);H.scene.root.position.copy(at),H.scene.root.updateMatrixWorld(!0);for(const rt of mt.group.children){const Mt=rt.material;Mt!==mt.baked&&Mt.userData.live!==!0&&(rt.material=Mt.clone())}W.visible=v,mt.group.visible=!v,H.scene.root.add(mt.group),H.walls={sig:k,merged:mt}}function A(H){const et=x.get(H);et&&(M(et),T(et),s.remove(et.scene.root),et.scene.dispose(),x.delete(H))}function C(H,et,W){(et.reshaped||H.shape!==Ap(et))&&(H.shape=Ap(et),H.scene.setOffice(et.office,et.agents)),H.scene.prepare(et.look);const k=B();return k?H.scene.frame(W,et.played,et.look,k):null}function I(){for(const[H,et]of x){const W=b(H);W&&(et.scene.root.position.set(W.x,0,W.z),et.bake&&et.bake.holder.position.set(W.x,0,W.z),et.bake&&(et.bake.holder.visible=!et.live))}m=!0}function U(H){H.traverse(et=>{et.geometry?.dispose()})}function P(H){H.loose&&(s.remove(H.loose),U(H.loose),H.loose=null,H.merged.group.visible=!0)}function O(H){if(!o)return;const et=c.flatMap(rt=>{const Mt=b(rt.id),Kt=cu(rt.office.map).pits?.(rt.office,rt.grow.stage)??[];return Mt?Kt.map(lt=>({x0:lt.x0+Mt.x,x1:lt.x1+Mt.x,z0:lt.z0+Mt.z,z1:lt.z1+Mt.z})):[]}),W=`${String(o.seed)}|${JSON.stringify(o.lawn)}|${String(o.road.length)}|${String(o.trees.length)}|${String(o.offices.length)}|${H?"n":"d"}|${JSON.stringify(et)}`;if(p?.sig===W)return;p&&(s.remove(p.merged.group),p.merged.dispose(),P(p));const at=XT(o,yn,H?mi:pi,H?WT:kT,et),mt=Ud(at,yn,yn.shadows);s.add(mt.group),v?(mt.group.visible=!1,s.add(at),p={sig:W,merged:mt,loose:at}):(U(at),p={sig:W,merged:mt,loose:null}),N(H),m=!0}function V(){if(!g)return;g.offices=x.size;let H=p?.merged.from??0,et=p?.merged.to??0;for(const W of x.values())W.bake&&(H+=W.bake.merged.from,et+=W.bake.merged.to);g.merged={from:H,to:et}}function N(H){if(!o)return;const et=H?mi:pi;n.tint(et),H&&t.nightLift!==void 0&&(n.hemi.intensity*=t.nightLift,a.intensity*=t.nightLift),n.sky(t.sky?H?t.sky.night:t.sky.day:et.bg),yn.shadows&&(a.castShadow=!0,a.shadow.mapSize.set(2048,2048),a.shadow.radius=4,a.shadow.bias=-8e-4),_="",F(B())}function F(H){if(!o)return;const{lawn:et}=o,W=Math.max(et.x1-et.x0,et.z1-et.z0)*.62+2;let k=(et.x0+et.x1)/2,at=(et.z0+et.z1)/2,mt=W;if(H&&H!==f&&f){const Mt=[J(H,0,0,0),J(H,H.widthPx,0,0),J(H,0,H.heightPx,0),J(H,H.widthPx,H.heightPx,0)],Kt=Mt.map(Pt=>Pt.x),lt=Mt.map(Pt=>Pt.z),pt=Math.min(...Kt),xt=Math.max(...Kt),yt=Math.min(...lt),j=Math.max(...lt),wt=Math.max(xt-pt,j-yt)*.62+4;wt<W&&(k=(pt+xt)/2,at=(yt+j)/2,mt=wt)}const rt=`${k.toFixed(2)}|${at.toFixed(2)}|${mt.toFixed(2)}`;if(rt!==_&&(_=rt,a.position.set(k-15,42,at-3),a.target.position.set(k,0,at),a.target.updateMatrixWorld(),yn.shadows)){const Mt=a.shadow.camera;Mt.left=-mt,Mt.right=mt,Mt.top=mt,Mt.bottom=-mt,Mt.near=1,Mt.far=140,Mt.updateProjectionMatrix(),m=!0}}function L(){!o||d.w<=0||(f=qT(o,d.w,d.maxH,t.box===!0),$())}const B=()=>u??(f&&!dS(h)?c1(f,h):f);function $(){const H=B();H&&(n.look(H),n.size(H),F(H))}function J(H,et,W,k){const at=et*H.scale+H.left,mt=H.top-W*H.scale,rt=(k-H.target.y-mt*Pa.y)/La.y;return{x:H.target.x+at*Ln.x+mt*Pa.x+rt*La.x,z:H.target.z+at*Ln.z+mt*Pa.z+rt*La.z}}function st(H,et){const W=[{x:et.fp.x0,z:et.fp.z0},{x:et.fp.x1,z:et.fp.z0},{x:et.fp.x0,z:et.fp.z1},{x:et.fp.x1,z:et.fp.z1}].map(Mt=>ts(H,{x:Mt.x,y:0,z:Mt.z})),k=Math.min(...W.map(Mt=>Mt.x)),at=Math.max(...W.map(Mt=>Mt.x)),mt=Math.min(...W.map(Mt=>Mt.y))-3/H.scale,rt=Math.max(...W.map(Mt=>Mt.y));return at>0&&k<H.widthPx&&rt>0&&mt<H.heightPx}const Tt={setTown(H){const et=H.map(k=>`${k.id}:${k.office.map}:${k.office.size}:${String(k.grow.stage)}:${String(k.grow.garden)}:${k.home===!0?"h":""}`).join("|");(o===null||et!==r)&&(r=et,o=VT(H.map(k=>KT(k.id,k.office,k.grow,k.home===!0)),JT(H.map(k=>k.id))),g&&(g.check={...bg(o)})),c=H;const W=new Set(H.map(k=>k.id));for(const k of[...x.keys()])W.has(k)||A(k);for(const k of H)w(k.id);O(l??!1),I(),L(),V()},still(H,et){const W=b(H);if(!W)return!1;const k=w(H),at=nA(et);if(k.bake?.sig===at||C(k,et,et.frames[0]?.pose.since??0)===null&&!k.scene.office())return!1;k.scene.root.position.set(0,0,0);const mt=Ud(k.scene.root,yn,yn.shadows);for(const Mt of mt.group.children){const Kt=Mt.material;Kt!==mt.baked&&(Mt.material=Kt.clone())}k.scene.root.position.set(W.x,0,W.z),T(k);const rt=new Wt;return rt.add(mt.group),rt.position.set(W.x,0,W.z),rt.visible=!k.live,s.add(rt),k.bake={sig:at,merged:mt,holder:rt},m=!0,V(),!0},live(H,et,W){const k=x.get(H);if(!k)return"still";const at=C(k,et,W);return E(k,et),m=!0,at??"still"},liveIds(){const H=B();if(!H||!f||!o)return[];if(t.allLive===!0)return o.offices.map(k=>k.id);if((f.right-f.left)/(H.right-H.left)<jT)return[];const et=H.widthPx/2,W=H.heightPx/2;return o.offices.filter(k=>st(H,k)).map(k=>{const at=ts(H,{x:(k.fp.x0+k.fp.x1)/2,y:0,z:(k.fp.z0+k.fp.z1)/2});return{id:k.id,d:Math.hypot(at.x-et,at.y-W)}}).sort((k,at)=>k.d-at.d).slice(0,tA).map(k=>k.id)},setSize(H,et){return d={w:Math.round(H),maxH:Math.round(et)},L(),f?.heightPx??0},townFit:()=>f,shownFit:B,diveFit(H,et){const W=b(H),k=x.get(H)?.scene.office();return W&&k?ZT(W,k,et):null},setView(H){u=H,$()},setCam(H){h=H,$()},frame(H){if(n.lost()||!o)return;l!==H&&(l=H,O(H),N(H));const et=new Set(Tt.liveIds());for(const[k,at]of x){const mt=et.has(k)&&at.scene.office()!==null;mt!==at.live&&(at.live=mt,mt?s.add(at.scene.root):(s.remove(at.scene.root),M(at)),at.bake&&(at.bake.holder.visible=!mt),m=!0)}const W=performance.now();(m||v)&&(i.shadowMap.needsUpdate=!0,m=!1),n.render(),g&&(g.frames++,g.ms=performance.now()-W,g.recent=[...g.recent.slice(-29),g.ms],g.calls=i.info.render.calls,g.live=[...x].filter(([,k])=>k.live).map(([k])=>k),g.heads=g.live.flatMap(k=>(x.get(k)?.scene.names()??[]).flatMap(at=>{const mt=Tt.headOf(k,at);return mt?[{id:k,name:at,...mt}]:[]})))},signAt(H){const et=B(),W=b(H),k=x.get(H)?.scene.office()??c.find(mt=>mt.id===H)?.office;if(!et||!W||!k)return null;y.set(W.x+k.x0+k.W/2,QT,W.z-.3);const at=ts(et,y);return at.x<0||at.x>et.widthPx||at.y<0||at.y>et.heightPx?null:at},pick(H,et){const W=B();if(!W||!o)return null;for(let k=2.6;k>=0;k-=.2){const at=J(W,H,et,k),mt=o.offices.find(rt=>at.x>rt.fp.x0&&at.x<rt.fp.x1&&at.z>rt.fp.z0&&at.z<rt.fp.z1);if(mt)return mt.id}return null},headOf(H,et){const W=B(),k=x.get(H);if(!W||!k?.live)return null;const at=k.scene.headTop(et,y);if(!at)return null;const mt=ts(W,at);if(mt.x<0||mt.y<-20||mt.x>W.widthPx||mt.y>W.heightPx)return null;const rt=k.scene.feet(et,y);return{...mt,feet:rt?ts(W,rt).y:mt.y}},placedOf:H=>b(H)??null,pickBim(H,et){const W=B();if(!W)return null;for(const[k,at]of x){if(!at.live)continue;const mt=at.scene.names().map(Mt=>{const Kt=at.scene.headTop(Mt,y),lt=Kt?ts(W,Kt):null,pt=at.scene.feet(Mt,y);return{name:Mt,head:lt,feet:pt?ts(W,pt):null,desk:null}}),rt=PT(mt,H,et);if(rt!==null)return{id:k,name:rt}}return null},copyTo(H){n.copyTo(H)},onLost(H){n.onLost(H)},entry:{parts(){if(!o)return null;const{lawn:H}=o;return{scape:p?.loose??null,centre:{x:(H.x0+H.x1)/2,z:(H.z0+H.z1)/2},offices:[...x].flatMap(([et,W])=>{const k=W.scene.office();if(!k||!W.live)return[];const at=v?W.scene.world():null,mt=W.scene.names().flatMap(rt=>{const Mt=W.scene.body(rt);return Mt?[{name:rt,body:Mt}]:[]});return[{id:et,root:W.scene.root,world:at,width:k.W,bims:mt}]})}},warm(){i.compileAsync(s,n.camera).catch(()=>{})},settle(){if(v){v=!1,p&&P(p);for(const H of x.values()){if(!H.walls)continue;const et=H.scene.world();et&&(et.visible=!1),H.walls.merged.group.visible=!0}m=!0}}},dispose(){for(const H of[...x.keys()])A(H);p&&(s.remove(p.merged.group),p.merged.dispose(),P(p),p=null),n.dispose(),g&&delete window.__biseTown}};return Tt},wg="loft",Hl=.5,ds=e=>e.filter(t=>!t.main&&!t.archived).map(t=>t.name);function jt(e,t,n,i,s){return{x0:e-n/2,x1:e+n/2,z0:t-i/2,z1:t+i/2,...s?{of:s}:{}}}function Vl(e){const t={x:e.x,z:e.wz},n={x:e.ax,z:e.wz};return[[e,t],[t,n]].filter(([i,s])=>Math.hypot(i.x-s.x,i.z-s.z)>1e-6)}function sA(e){return[...e.desks.values(),e.mainDesk,...e.islandSpots,...e.lounge,...e.boardSpots,...e.queue,e.door,...e.terrace,e.exit,...e.park?.spots??[]]}const m0=2.4,ul=2.3,Ms=1.4,hl=1,$o=4.3,aA=16,oA=10,rA=6,cA=12,xc=1.15,lA=.8,zp=2.5;function dA(e,t){const n=ds(e),i=t?.side===3||n.length>aA?3:2,s=i*2,a=gA(n,i,t),o=Math.max(0,...[...a.values()].map(J=>J+1)),r=Math.max(3,Math.ceil(o/s),t?.side===i?t.rows:0),c=2*(Ms/2+hl+i*m0)+.2,l=-c/2,d=$o+r*ul+1,f=Ms/2+hl/2,u=$o-.25,h=d-.5,m=new Map;for(const J of n){const st=mA(a.get(J)??0,i);m.set(J,{x:st.x,z:st.z,wz:st.z-.65,ax:Math.sign(st.x)*f,face:0})}const _=$o+.2,x={x0:-Ms/2,x1:Ms/2,z0:_,z1:_+Math.max(r*ul-1,3.5)},p=[];for(let J=0;J<12;J++){const st=J%2?1:-1,Tt=x.z0+1.2+Math.floor(J/2)*.85;if(Tt>x.z1-.3)break;p.push({x:st*(Ms/2+.32),z:Tt,wz:Tt,ax:st*f,face:st<0?Math.PI/2:-Math.PI/2})}const v=c*.4,y=(v-.9)/3,g=[];for(let J=0;J<oA;J++){const st=J%4,Tt=l+.65+st*y,H=1+Math.floor(J/4)*1.05;g.push({x:Tt,z:H,wz:H,ax:st<3?Tt+y/2:Tt-y/2,face:0})}const b=l+v+1.15,w=[-.45,.45,0].map(J=>({x:b+J,z:.75,wz:u,ax:b+J,face:Math.PI})),T=c/2-1.55,M=T-1.45,E={x:T,z:1.25,wz:.8,ax:M,face:0},A=[];for(let J=0;J<rA;J++)A.push({x:M,z:1.3+J*Hl,wz:u,ax:M,face:Math.PI/2});const C={x:-f,z:d+.2,wz:h,ax:-f,face:Math.PI},I=[];for(let J=0;J<cA;J++){const st=J%4,Tt=l+1+st*xc,H=d+1.5+Math.floor(J/4)*xc;I.push({x:Tt,z:H,wz:H,ax:st<3?Tt+xc/2:Tt-xc/2,face:0})}const U=d+lA,P={x:l-zp,z:U,wz:U,ax:l-zp,face:-Math.PI/2},O={desks:m,mainDesk:E,islandSpots:p,lounge:g,boardSpots:w,queue:A,door:C,terrace:I,exit:P},V={map:"loft",size:`${String(i)}x${String(r)}`,W:c,D:d,x0:l,island:x,...O},N=pA(V),F=uA({...V,crossBack:u,crossFront:h,ax:f,tw:U}),L=A[0]?.x??T,B=Math.min(...F[0].map(J=>J.x)),$=[{x:L,z:u},{x:Math.min(L,Math.max(B,l+1.5)),z:u}];return{...V,side:i,rows:r,crossBack:u,crossFront:h,ax:f,walks:F,furniture:N,queueMore:$}}const fA={id:"loft",ready:!0,layout:dA};function uA(e){const{crossBack:t,crossFront:n,ax:i,tw:s,exit:a}=e,o=[...e.desks.values(),e.mainDesk,...e.islandSpots,...e.lounge,...e.boardSpots,...e.queue,e.door,...e.terrace,a],r=o.filter(f=>f.wz<=t+1e-6).map(f=>f.ax),c=[[{x:Math.min(-i,...r),z:t},{x:Math.max(i,...r),z:t}],[{x:-i,z:n},{x:i,z:n}],[{x:-i,z:t},{x:-i,z:n}],[{x:i,z:t},{x:i,z:n}],[{x:-i,z:n},{x:-i,z:s}],[{x:a.x,z:s},{x:-i,z:s}]],l=f=>c.some(([u,h])=>hA(u,h,f)),d=[c[0],...c.slice(1)];for(const f of o){d.push(...Vl(f));const u={x:f.ax,z:f.wz};l(u)||d.push([u,{x:f.ax,z:f.wz<t?t:s}])}return d}function hA(e,t,n){return Math.abs(e.x-t.x)<1e-6?Math.abs(n.x-e.x)<1e-4&&n.z>=Math.min(e.z,t.z)-1e-4&&n.z<=Math.max(e.z,t.z)+1e-4:Math.abs(e.z-t.z)<1e-6?Math.abs(n.z-e.z)<1e-4&&n.x>=Math.min(e.x,t.x)-1e-4&&n.x<=Math.max(e.x,t.x)+1e-4:!1}function pA(e){const t=jt,n=[];for(const s of e.desks.values())n.push(t(s.x,s.z+.5,1.6,.78));n.push(t(e.mainDesk.x,e.mainDesk.z+.6,2.3,1));const i=(e.island.z0+e.island.z1)/2;n.push(t((e.island.x0+e.island.x1)/2,i,e.island.x1-e.island.x0+.1,e.island.z1-e.island.z0+.15));for(const s of e.lounge)n.push(t(s.x,s.z-.05,.72,.72,s));for(const s of e.terrace)n.push(t(s.x,s.z+.05,.5,.95,s));return n}function mA(e,t){const n=t*2,i=e%n,s=Math.floor(e/n),a=i<t,o=a?t-1-i:i-t;return{x:(a?-1:1)*(Ms/2+hl+m0*(o+.5)),z:$o+.55+ul*s}}function xA(e,t){const n=Math.round((Math.abs(e.x)-Ms/2-hl)/m0-.5),i=e.x<0?t-1-n:t+n;return Math.round((e.z-$o-.55)/ul)*t*2+i}function gA(e,t,n){const i=new Map,s=new Set;if(n?.side===t)for(const o of e){const r=n.desks.get(o);if(!r)continue;const c=xA(r,t);i.set(o,c),s.add(c)}let a=0;for(const o of e)if(!i.has(o)){for(;s.has(a);)a++;i.set(o,a),s.add(a)}return i}const Rp=(e,t)=>Math.hypot(e.x-t.x,e.z-t.z)<1e-6;function io(e,t){const n=e.filter(([i,s])=>!Rp(i,s));for(const i of t){n.push(...Vl(i.s));const s={x:i.s.ax,z:i.s.wz};i.to&&!Rp(s,i.to)&&n.push([s,i.to])}return n}function $s(e,t,n=[]){const i=[...t.filter(s=>s.to&&Math.abs(s.to.z-e)<1e-6).map(s=>s.to?.x??0),...n];return[{x:Math.min(...i),z:e},{x:Math.max(...i),z:e}]}function so(e,t){const n=ds(e),i=new Map,s=new Set;for(const o of n){const r=t?.get(o);r!==void 0&&(i.set(o,r),s.add(r))}let a=0;for(const o of n)if(!i.has(o)){for(;s.has(a);)a++;i.set(o,a),s.add(a)}return{names:n,slots:i,used:Math.max(0,...[...i.values()].map(o=>o+1))}}const fu=6;function zr(e,t,n,i={}){const s=i.lx0??e+.65,a=i.lw??t*.4-.9,o=i.n??10,r=i.bed??.72,c=a/3,l=[],d=[],f=[];for(let v=0;v<o;v++){const y=v%4,g=s+y*c,b=1+Math.floor(v/4)*1.05;if(b+r/2>n-.2)break;const w={x:g,z:b,wz:b,ax:y<3?g+c/2:g-c/2,face:0};l.push(w),f.push(jt(g,b-.05,r,r,w)),d.push({s:w,to:{x:w.ax,z:n}})}const u=s+a+1.6,h=[-.45,.45,0].map(v=>({x:u+v,z:.75,wz:n,ax:u+v,face:Math.PI}));for(const v of h)d.push({s:v});const m=e+t-1.55,_=m-1.45,x={x:m,z:1.25,wz:.8,ax:_,face:0};d.push({s:x,to:{x:_,z:n}}),f.push(jt(m,x.z+.6,2.3,1));const p=[];for(let v=0;v<fu;v++){const y=1.3+v*.5;if(y>n-.2)break;p.push({x:_,z:y,wz:n,ax:_,face:Math.PI/2})}for(const v of p)d.push({s:v});return{lounge:l,boardSpots:h,mainDesk:x,queue:p,furniture:f,ways:d,boardX:u}}const _A=12,gc=1.15;function ao(e,t,n,i){const s=t+.8,a={x:n,z:t+.2,wz:i,ax:n,face:Math.PI},o=[],r=[],c=[];for(let u=0;u<_A;u++){const h=u%4,m=e+1+h*gc,_=t+1.5+Math.floor(u/4)*gc,x={x:m,z:_,wz:_,ax:h<3?m+gc/2:m-gc/2,face:0};o.push(x),r.push(jt(m,_+.05,.5,.95,x)),c.push({s:x,to:{x:x.ax,z:s}})}const l={x:e-2.5,z:s,wz:s,ax:e-2.5,face:-Math.PI/2},d=Math.max(n,...c.map(u=>u.to?.x??n)),f=[[{x:n,z:i},{x:n,z:s}],[{x:l.x,z:s},{x:d,z:s}]];return c.push({s:a}),{door:a,terrace:o,exit:l,furniture:r,ways:c,trunk:f,tw:s}}function oo(e,t,n,i){const s=e[0]?.x??t.x,a=Math.min(n[0].x,n[1].x),o=n[0].z;return[{x:s,z:o},{x:Math.min(s,Math.max(a,i+1.5)),z:o}]}const x0={1:gt.stage_1,2:gt.stage_fruit,3:gt.stage_3,4:gt.stage_4,5:gt.stage_5,6:gt.stage_more_fruit,7:gt.stage_7,8:gt.stage_8,9:gt.stage_9,10:gt.stage_10,11:gt.stage_11,12:gt.stage_12,13:gt.stage_13,14:gt.stage_14},_c=4.05,Gd=1.25,vc=1.9,Cp=1.1,Pp=.55,vA=.5,wi=(e,t,n,i)=>({x:e+n*Math.sin(i),z:t+n*Math.cos(i)});function MA(e,t,n){const i=Math.abs(Math.cos(t)),s=Math.abs(Math.sin(t));return jt(e.x,e.z,Cp*i+Pp*s,Cp*s+Pp*i,n)}function yA(e,t){const{names:n,slots:i,used:s}=so(e,t?.slots),a=Math.max(6,s,t?.cap??0),o=a+a%2,r=Math.max(3.4,o*1.9/(2*Math.PI)),c=r+.9,l=Math.max(11,2*c+2.6),d=-l/2,f=0,u=_c+c,h=u+c,m=h+.7,_=zr(d,l,_c),x=ao(d,m,f,h),p=[..._.ways,...x.ways],v=[..._.furniture,...x.furniture],y=new Map;for(const C of n){const I=(2*(i.get(C)??0)+1)*Math.PI/o,U=wi(f,u,r,I),P={...U,wz:U.z,ax:U.x,face:I+Math.PI};y.set(C,P),v.push(MA(wi(f,u,r-vA,I),I,P)),p.push({s:P,to:wi(f,u,c,I)})}const g=jt(f,u,2*Gd,2*Gd);v.push(g);const b=[];for(let C=0;C<8;C++){const I=C*Math.PI/4,U=wi(f,u,vc,I);b.push({...U,wz:U.z,ax:U.x,face:I+Math.PI})}const w=(C,I)=>{const U=Array.from({length:I},(P,O)=>wi(f,u,C,O*2*Math.PI/I));return U.map((P,O)=>[P,U[(O+1)%I]??P])},T=$s(_c,p,[f]),M=[T,...x.trunk,...w(vc,8),...w(c,2*o),[wi(f,u,vc,Math.PI),wi(f,u,c,Math.PI)],[wi(f,u,vc,0),wi(f,u,c,0)]],E=io(M,p),A={desks:y,mainDesk:_.mainDesk,islandSpots:b,lounge:_.lounge,boardSpots:_.boardSpots,queue:_.queue,door:x.door,terrace:x.terrace,exit:x.exit};return{map:"greenhouse",size:`ring${String(o)}`,W:l,D:m,x0:d,island:g,...A,walks:E,furniture:v,queueMore:oo(_.queue,_.mainDesk,T,d),slots:i,cap:o,crossBack:_c,cx:f,cz:u,R:r,Ro:c,tableR:Gd}}const bA={id:"greenhouse",ready:!0,layout:yA,things:x0},_n=4.05,Lp=5.2,Ji=4.6,SA=4.2,Ip=[0,.25,-.2,.15,-.1,.3];function wA(e,t){const{names:n,slots:i,used:s}=so(e,t?.slots),a=Math.max(2,Math.ceil(Math.max(s,t?.cap??0)/4)),o=a*4,r=a>4?3:2,c=Math.ceil(a/r),l=r*Lp+2.4,d=-l/2,f=d+1.45,u=_n+c*Ji,h=u+.6,m=zr(d,l,_n),_=ao(d,h,f,u),x=[...m.ways,..._.ways],p=[...m.furniture,..._.furniture],v=[];for(let U=0;U<a;U++){const P=U%r,O=Math.floor(U/r);v.push({x:d+SA+P*Lp+O%2*.6,z:_n+Ji/2+O*Ji+(Ip[U%Ip.length]??0)})}const y=new Map;for(const U of n){const P=i.get(U)??0,O=Math.floor(P/4),V=P%4,N=v[O]??{x:0,z:_n+Ji/2},F=Math.floor(O/r),L=N.x+(V%2?.8:-.8),B=V<2,$=N.z+(B?-1.05:1.05),J=_n+(B?F:F+1)*Ji,st={x:L,z:$,wz:J,ax:L,face:B?0:Math.PI};y.set(U,st),p.push(jt(L,$+(B?.5:-.5),1.6,.78)),x.push({s:st})}const g=Math.min(6,c*Ji-1),b={x0:d+.2,x1:d+1.1,z0:_n+.55,z1:_n+.55+g};p.push(b);const w=[];for(let U=b.z0+.6;U<b.z1-.2;U+=.85)w.push({x:f,z:U,wz:U,ax:f,face:-Math.PI/2});const T=Math.max(f,...[...y.values()].map(U=>U.x)),M=[];for(let U=1;U<=c;U++)M.push([{x:f,z:_n+U*Ji},{x:T,z:_n+U*Ji}]);const E=$s(_n,x,[f,T,...[...y.values()].filter(U=>U.wz===_n).map(U=>U.x)]),A=[E,..._.trunk,...M,[{x:f,z:_n},{x:f,z:u}]],C=io(A,x),I={desks:y,mainDesk:m.mainDesk,islandSpots:w,lounge:m.lounge,boardSpots:m.boardSpots,queue:m.queue,door:_.door,terrace:_.terrace,exit:_.exit};return{map:"campus",size:`pods${String(a)}`,W:l,D:h,x0:d,island:b,...I,walks:C,furniture:p,queueMore:oo(m.queue,m.mainDesk,E,d),slots:i,cap:o,crossBack:_n,pods:v,aisle:f}}const EA={id:"campus",ready:!0,layout:wA,things:x0},ii=1.9,Mc=1.8,yc=1.1,TA=e=>e%3===2?{back:!1,i:Math.floor(e/3)}:{back:!0,i:Math.floor(e/3)*2+e%3};function AA(e,t){const{names:n,slots:i,used:s}=so(e,t?.slots),a=Math.max(6,s,t?.cap??0),o=Math.floor(a/3),r=a-o,c=Math.max(12.5,(r-1)*Mc+7.55),l=Math.max(8.6,o*Mc+3.3),d=-c/2,f=d+c,u=d+1.9,h=l-.5,m=[],_=[],x=new Map;for(const F of n){const L=TA(i.get(F)??0);let B;if(L.back){const $=d+3.2+L.i*Mc;B={x:$,z:yc,wz:ii,ax:$,face:Math.PI},_.push(jt($,yc-.5,1.6,.78))}else{const $=3+L.i*Mc;B={x:d+yc,z:$,wz:$,ax:u,face:-Math.PI/2},_.push(jt(d+yc-.5,$,.78,1.6))}x.set(F,B),m.push({s:B})}const p=f-1.8,v=f-3.25,y={x:p,z:3,wz:3,ax:v,face:0};_.push(jt(p,3.6,2.3,1)),m.push({s:y});const g=[];for(let F=0;F<fu;F++)g.push({x:v,z:2.6+F*.5,wz:ii,ax:v,face:Math.PI/2});for(const F of g)m.push({s:F});const b=f-1.6,w=[-.45,.45,0].map(F=>({x:b+F,z:.75,wz:ii,ax:b+F,face:Math.PI}));for(const F of w)m.push({s:F});const T=u+1.9,M=ii+1.45,E=jt(T,M,2.6,.9);_.push(E);const A=[];for(const F of[-1.1,-.35,.4,1.15])A.push({x:T+F,z:M-.75,wz:M-.75,ax:T+F,face:0}),A.push({x:T+F,z:M+.75,wz:M+.75,ax:T+F,face:Math.PI});const C=jt(T+3.4,M,2.6,1.5);_.push(C);const I=[];for(let F=0;F<8;F++){const L=F%4,B=f-3.9+L*.95,$=l-3+Math.floor(F/4)*1.05,J={x:B,z:$,wz:$,ax:L<3?B+.475:B-.475,face:0};I.push(J),_.push(jt(B,$-.05,.62,.62,J)),m.push({s:J,to:{x:J.ax,z:h}})}const U=ao(d,l,u,h);m.push(...U.ways),_.push(...U.furniture);const P=$s(ii,[...m,...w.map(F=>({s:F,to:{x:F.x,z:ii}}))],[u,v,...[...x.values()].filter(F=>F.wz===ii).map(F=>F.x)]),O=[M-.75,M+.75].map(F=>[{x:u,z:F},{x:T+1.15,z:F}]),V=[P,...U.trunk,[{x:u,z:ii},{x:u,z:h}],$s(h,m,[u]),[{x:v,z:ii},{x:v,z:2.6+(fu-1)*.5}],...O],N=io(V,m);return{map:"workshop",size:`walls${String(a)}`,W:c,D:l,x0:d,island:E,desks:x,mainDesk:y,islandSpots:A,lounge:I,boardSpots:w,queue:g,door:U.door,terrace:U.terrace,exit:U.exit,walks:N,furniture:_,queueMore:oo(g,y,P,d),slots:i,cap:a,crossBack:ii,pingpong:C,aisle:u,crossFront:h}}const zA={id:"workshop",ready:!0,layout:AA,things:x0},_a=4.05,bc=12.5,Hd=2.1,RA=[3.4,5.8];function CA(e,t){const{names:n,slots:i,used:s}=so(e,t?.slots),a=Math.max(3,Math.ceil(Math.max(s,t?.cap??0)/2)),o=a*2,r=4.4+a*Hd+1.2,c=-bc/2,l=c+1.85,d=c+4.6,f=r-.5,u=zr(c,bc,_a,{n:0,lw:3.4}),h=[...u.ways],m=[...u.furniture],_=c+2.6,x=jt(_,1.75,2.8,.7);m.push(x);const p=[],v=c+.7;for(const C of[0,1])for(const I of[-1.2,-.4,.4,1.2]){const U=_+I,P=C===0?{x:U,z:1,wz:.45,ax:v,face:0}:{x:U,z:2.5,wz:2.5,ax:U,face:Math.PI};p.push(P),m.push(jt(U,P.z,.55,.55,P)),h.push({s:P,to:{x:P.ax,z:_a}})}p.push(...p.splice(0,4));const y=new Map;for(const C of n){const I=i.get(C)??0,U=I%2,P=c+(RA[U]??3.4),O=4.95+Math.floor(I/2)*Hd,V={x:P,z:O,wz:O-.65,ax:U===0?l:d,face:0};y.set(C,V),m.push(jt(P,O+.5,1.6,.78)),h.push({s:V})}const g={x0:c+.55,x1:c+1.45,z0:4.8,z1:4.8+Math.min(4.5,a*Hd-.6)};m.push(g);const b=[];for(let C=g.z0+.5;C<g.z1-.2;C+=.85)b.push({x:l,z:C,wz:C,ax:l,face:-Math.PI/2});const w=ao(c,r,l,f);h.push(...w.ways),m.push(...w.furniture);const T={x0:c+7.4,x1:c+bc-.3,z0:4.6,z1:r-1.4},M=$s(_a,h,[l,d]),E=[M,...w.trunk,[{x:l,z:_a},{x:l,z:f}],[{x:d,z:_a},{x:d,z:f}],[{x:l,z:f},{x:d,z:f}]],A=io(E,h);return{map:"kyoto",size:`rows${String(a)}`,W:bc,D:r,x0:c,island:g,desks:y,mainDesk:u.mainDesk,islandSpots:b,lounge:p,boardSpots:u.boardSpots,queue:u.queue,door:w.door,terrace:w.terrace,exit:w.exit,walks:A,furniture:m,queueMore:oo(u.queue,u.mainDesk,M,c),slots:i,cap:o,crossBack:_a,garden:T,kotatsu:x,rows:a}}const PA={1:gt.stage_kyoto_1,2:gt.stage_kyoto_2,3:gt.stage_kyoto_3,4:gt.stage_kyoto_4,5:gt.stage_kyoto_5,6:gt.stage_kyoto_6,7:gt.stage_kyoto_7,8:gt.stage_kyoto_8,9:gt.stage_kyoto_9,10:gt.stage_kyoto_10,11:gt.stage_kyoto_11,12:gt.stage_kyoto_12,13:gt.stage_kyoto_13,14:gt.stage_kyoto_14},LA={id:"kyoto",ready:!0,layout:CA,things:PA},Qi=4.05,gs=1.9,Dp=1.75,Np=1.4;function IA(e,t){const{names:n,slots:i,used:s}=so(e,t?.slots),a=Math.max(3,Math.ceil(Math.max(s,t?.cap??0)/3)),o=a*3,r=Math.max(5.6,a*gs+.4),c=r+5.4,l=-c/2,d=l+c,f=Qi+2.15,u={x0:l+2.7,x1:d-2.7,z0:f,z1:f+r},h=l+2.25,m=d-2.25,_=u.z1+.6,x=_+.6,p=zr(l,c,Qi),v=ao(l,x,h,_),y=[...p.ways,...v.ways],g=[...p.furniture,...v.furniture],b=new Map,w=(r-a*gs)/2;for(const V of n){const N=i.get(V)??0,F=Math.floor(N/3),L=N%3;let B;if(L===1){const $=u.x0+w+gs/2+F*gs;B={x:$,z:Qi+.65,wz:Qi,ax:$,face:0},g.push(jt($,B.z+.5,Np,.78))}else{const $=f+gs/2+F*gs,J=L===0,st=J?l+.9:d-.9;B={x:st,z:$,wz:$+gs/2,ax:J?h:m,face:J?Math.PI/2:-Math.PI/2},g.push(jt(st+(J?.5:-.5),$,.78,Np))}b.set(V,B),y.push({s:B})}const T=(u.x0+u.x1)/2,M=(u.z0+u.z1)/2,E=jt(T,M,2.2,2.2);g.push(E);const A=V=>({x:T+Dp*Math.sin(V),z:M+Dp*Math.cos(V)}),C=[];for(let V=0;V<8;V++){const N=V*Math.PI/4;C.push({...A(N),wz:A(N).z,ax:A(N).x,face:N+Math.PI})}const I=$s(Qi,y,[h,m]),U=C.map((V,N)=>[V,C[(N+1)%8]??V]),P=[I,...v.trunk,[{x:h,z:Qi},{x:h,z:_}],[{x:m,z:Qi},{x:m,z:_}],[{x:h,z:_},{x:m,z:_}],...U,[A(0),{x:T,z:_}]],O=io(P,y);return{map:"riad",size:`galleries${String(a)}`,W:c,D:x,x0:l,island:E,desks:b,mainDesk:p.mainDesk,islandSpots:C,lounge:p.lounge,boardSpots:p.boardSpots,queue:p.queue,door:v.door,terrace:v.terrace,exit:v.exit,walks:O,furniture:g,queueMore:oo(p.queue,p.mainDesk,I,l),slots:i,cap:o,crossBack:Qi,patio:u,fx:T,fz:M}}const DA={1:gt.stage_riad_1,2:gt.stage_riad_2,3:gt.stage_riad_3,4:gt.stage_riad_4,5:gt.stage_riad_5,6:gt.stage_riad_6,7:gt.stage_riad_7,8:gt.stage_riad_8,9:gt.stage_riad_9,10:gt.stage_riad_10,11:gt.stage_riad_11,12:gt.stage_riad_12,13:gt.stage_riad_13,14:gt.stage_riad_14},NA={id:"riad",ready:!0,layout:IA,things:DA},ji=4.05,Vd=10,Mo=1.6,UA=1.5,OA=1.05,Wn=1.85;function FA(e,t){const{names:n,slots:i,used:s}=so(e,t?.slots),a=Math.max(3,Math.ceil(Math.max(s,t?.cap??0)/2)),o=a*2,r=ji+.45,c=jt(0,r+a*Mo/2,UA,a*Mo),l=c.z1+1.4,d=l-.5,f=-Vd/2,u=zr(f,Vd,ji,{lx0:f+1.4,lw:3,n:8,bed:.8}),h=ao(f,l,-Wn,d),m=[...u.ways,...h.ways],_=[...u.furniture,...h.furniture,c],x=new Map;for(const w of n){const T=i.get(w)??0,M=T%2?1:-1,E=r+Mo/2+Math.floor(T/2)*Mo,A={x:M*OA,z:E,wz:E,ax:M*Wn,face:M<0?Math.PI/2:-Math.PI/2};x.set(w,A),m.push({s:A})}const p={x0:f+.15,x1:f+1.05,z0:ji+.55,z1:ji+.55+Math.min(4,a*Mo-.4)};_.push(p);const v=[];for(let w=p.z0+.5;w<p.z1-.2;w+=.85)v.push({x:f+1.4,z:w,wz:w,ax:-Wn,face:-Math.PI/2});for(const w of v)m.push({s:w});const y=$s(ji,m,[-Wn,Wn]),g=[y,...h.trunk,[{x:-Wn,z:ji},{x:-Wn,z:d}],[{x:Wn,z:ji},{x:Wn,z:d}],[{x:-Wn,z:d},{x:Wn,z:d}]],b=io(g,m);return{map:"nordic",size:`table${String(a)}`,W:Vd,D:l,x0:f,island:p,desks:x,mainDesk:u.mainDesk,islandSpots:v,lounge:u.lounge,boardSpots:u.boardSpots,queue:u.queue,door:h.door,terrace:h.terrace,exit:h.exit,walks:b,furniture:_,queueMore:oo(u.queue,u.mainDesk,y,f),slots:i,cap:o,crossBack:ji,table:c}}const BA={1:gt.stage_nordic_1,2:gt.stage_nordic_2,3:gt.stage_nordic_3,4:gt.stage_nordic_4,5:gt.stage_nordic_5,6:gt.stage_nordic_6,7:gt.stage_nordic_7,8:gt.stage_nordic_8,9:gt.stage_nordic_9,10:gt.stage_nordic_10,11:gt.stage_nordic_11,12:gt.stage_nordic_12,13:gt.stage_nordic_13,14:gt.stage_nordic_14},GA={id:"nordic",ready:!0,layout:FA,things:BA},HA=4.3,Un=4,VA=6,kA=12,Sc=1.15,Up=2.5;function Rr(e){const{x0:t,W:n}=e,i=e.main==="right"?1:-1,s=g=>i===1?t+g:t+n-g,a=1.3,[o,r]=e.bed??[.72,.72],c=[],l=[];for(let g=0;g<(e.beds??8);g++){const b=g%4,w=.9+b*a,T=1+Math.floor(g/4)*1.2,M={x:s(w),z:T,wz:T,ax:s(b<3?w+a/2:w-a/2),face:0};c.push(M),l.push(jt(M.x,M.z,o,r,M))}const d=s(.9+3*a+1.9),f=[-.45,.45,0].map(g=>({x:d+g,z:.75,wz:Un,ax:d+g,face:Math.PI})),u=s(n-1.55),h=s(n-3),m={x:u,z:1.25,wz:.8,ax:h,face:0};l.push(jt(u,1.85,2.3,1));const _=[];for(let g=0;g<VA;g++)_.push({x:h,z:1.3+g*Hl,wz:Un,ax:h,face:i*Math.PI/2});const x=[...c.map(g=>g.ax),...f.map(g=>g.x),h,...e.reach??[]],p=[{x:Math.min(...x),z:Un},{x:Math.max(...x),z:Un}],v=i===1?p[0].x:p[1].x,y=[{x:h,z:Un},{x:i===1?Math.min(h,Math.max(v,t+1.5)):Math.max(h,Math.min(v,t+n-1.5)),z:Un}];return{lounge:c,boardSpots:f,mainDesk:m,queue:_,furniture:l,corridor:p,queueMore:y}}function Cr(e){const{x0:t,W:n,D:i,doorX:s}=e,a=i-.5,o=i+.8,r={x:s,z:i+.2,wz:a,ax:s,face:Math.PI},c=[],l=[];for(let _=0;_<kA;_++){const x=_%4,p=t+e.terraceU+x*Sc,v=i+1.5+Math.floor(_/4)*Sc,y={x:p,z:v,wz:v,ax:x<3?p+Sc/2:p-Sc/2,face:0};c.push(y),l.push(jt(p,v+.05,.5,.95,y))}const d=e.out==="left",f=d?t-Up:t+n+Up,u={x:f,z:o,wz:o,ax:f,face:d?-Math.PI/2:Math.PI/2},h=[s,...c.map(_=>_.ax)],m=d?[{x:f,z:o},{x:Math.max(...h),z:o}]:[{x:Math.min(...h),z:o},{x:f,z:o}];return{door:r,terrace:c,exit:u,furniture:l,legs:[[{x:s,z:a},{x:s,z:o}],m],crossFront:a,tw:o}}const g0=(e,t)=>Math.hypot(e.x-t.x,e.z-t.z)<1e-4;function WA([e,t],n){const i=t.x-e.x,s=t.z-e.z,a=i*i+s*s,o=a>0?((n.x-e.x)*i+(n.z-e.z)*s)/a:0;return o<-1e-4||o>1+1e-4?!1:g0({x:e.x+i*o,z:e.z+s*o},n)}function XA([e,t],n){const i=Math.max(2,Math.ceil(Math.hypot(t.x-e.x,t.z-e.z)/.02)),s=1e-6;for(let a=1;a<i;a++){const o=e.x+(t.x-e.x)*a/i,r=e.z+(t.z-e.z)*a/i;if(o>n.x0+s&&o<n.x1-s&&r>n.z0+s&&r<n.z1-s)return!0}return!1}function Pr(e,t){const n=t[0];if(n===void 0)throw new Error(`${e.map}: no trunk`);const i=[n,...t.slice(1)],s=t.filter(([a,o])=>Math.abs(a.z-o.z)<1e-6);for(const a of sA({...e,queueMore:[n[0],n[0]]})){i.push(...Vl(a));const o={x:a.ax,z:a.wz};if(t.some(l=>WA(l,o)))continue;const c=s.filter(([l,d])=>o.x>=Math.min(l.x,d.x)-1e-6&&o.x<=Math.max(l.x,d.x)+1e-6).map(([l])=>[o,{x:o.x,z:l.z}]).filter(l=>!e.furniture.some(d=>XA(l,d))).sort((l,d)=>Math.abs(l[1].z-o.z)-Math.abs(d[1].z-o.z))[0];if(c===void 0)throw new Error(`${e.map}: no way from (${String(o.x)}, ${String(o.z)})`);g0(c[0],c[1])||i.push(c)}return i}function Xa(e,t,n){const i=new Map,s=new Set;for(const o of e){const r=t?.get(o);if(r){for(let c=0;c<96;c++)if(!s.has(c)&&g0(n(c),r)){i.set(o,c),s.add(c);break}}}let a=0;for(const o of e)if(!i.has(o)){for(;s.has(a);)a++;i.set(o,a),s.add(a)}return i}const Lr=e=>Math.max(0,...[...e.values()].map(t=>t+1)),qo=14.4,Yo=-qo/2,wc=[Yo+.6,0,Yo+qo-.6],Bc=[-3.5,3.5],Ra=3,$A=1.6,qA=2.7,YA=1.1,ZA=4.7,Op=5,Io=e=>ZA+Math.floor(e/2)*qA+e%2*YA,uu=e=>Bc[e%2]??0;function Fp(e){const t=Math.floor(e/Ra);return{x:uu(t)+(e%Ra-1)*$A,z:Io(t)+1.05}}function KA(e,t){const n=ds(e),i=Xa(n,t?.desks,Fp),s=Math.max(1,Math.ceil(Math.ceil(Lr(i)/Ra)/2),t?.rows??0),[a,o,r]=wc,c=new Map,l=[];for(const w of n){const T=i.get(w)??0,M=Math.floor(T/Ra),E=T%Ra,A=Fp(T),C=M%2===0?E===0?a:o:E===Ra-1?r:o;c.set(w,{x:A.x,z:A.z,wz:Io(M)+.5,ax:C,face:0}),l.push(jt(A.x,A.z+.5,1.4,.76))}const d=[];for(let w=0;w<s*2;w++)d.push({x:uu(w),z:Io(w),w:Op,c:w%5}),l.push(jt(uu(w),Io(w),Op,.24));const u=Io(s*2-1)+1.05+.89+1.35,h=jt(Bc[0],u,4.4,.9),m=jt(Bc[1],u,4.2,.7);l.push(h,m);const _=[];for(const w of[-1,1])for(const T of[-1.5,-.5,.5,1.5]){const M=u+w*.8;_.push({x:Bc[0]+T,z:M,wz:M,ax:o,face:w<0?0:Math.PI})}const x=u+1.55,p=x+.5,v=Rr({x0:Yo,W:qo,main:"right",bed:[.6,.9],reach:wc}),y=Cr({x0:Yo,W:qo,D:p,doorX:o,terraceU:1,out:"left"});l.push(...v.furniture,...y.furniture);const g=[v.corridor,[{x:a,z:x},{x:r,z:x}],...wc.map(w=>[{x:w,z:Un},{x:w,z:x}]),...y.legs],b={map:"patio",size:`patio-${String(s)}`,W:qo,D:p,x0:Yo,island:h,desks:c,islandSpots:_,mainDesk:v.mainDesk,lounge:v.lounge,boardSpots:v.boardSpots,queue:v.queue,door:y.door,terrace:y.terrace,exit:y.exit,furniture:l};return{...b,walks:Pr(b,g),queueMore:v.queueMore,rows:s,slabs:d,trough:m,aisles:wc}}const JA={id:"patio",ready:!0,layout:KA},In=-7,Ca=6.2,zs=1.9,hr=1.7,hu=In+3.3,kd=e=>Math.max(12.6,6.5+(e-1)*hr);function Wd(e,t){const n=Math.floor(e/3),i=In+t;switch(e%3){case 0:return{x:In+1,z:Ca+n*zs,wz:Ca+n*zs,ax:In+.45,face:Math.PI/2};case 1:return{x:hu+n*hr,z:HA+.55,wz:Un,ax:hu+n*hr,face:0};default:return{x:i-1,z:Ca+n*zs,wz:Ca+n*zs,ax:i-.45,face:-Math.PI/2}}}function QA(e){return e.face===0?jt(e.x,e.z+.5,1.4,.76):jt(e.x+Math.sign(Math.sin(e.face))*.5,e.z,.76,1.4)}function jA(e,t){const n=ds(e),i=Xa(n,t?.desks,E=>Wd(E,kd(t?.k??3))),s=Math.max(3,Math.ceil(Lr(i)/3),t?.k??0),a=kd(s),o=a===kd(t?.k??3)?i:Xa(n,t?.desks,E=>Wd(E,a)),r=In+a,c=new Map,l=[];for(const E of n){const A=Wd(o.get(E)??0,a);c.set(E,A),l.push(QA(A))}const d=Ca+(s-1)*zs+.7,f={x0:In+2.4,x1:r-2.4,z0:6,z1:d},u=[];for(let E=Ca-zs/2;E<=d+.01;E+=zs)u.push({x:In+2.2,z:E},{x:r-2.2,z:E});for(let E=hu-hr/2;E<=r-2.2;E+=hr)u.push({x:E,z:6});for(const E of u)l.push(jt(E.x,E.z,.24,.24));const h=In+a/2,m=(6.3+d)/2,_=jt(h,m,1.8,.9);l.push(_);const x=m+1,p=[...[-1.05,-.35,.35,1.05].map(E=>({x:h+E,z:x,wz:x,ax:h,face:Math.PI})),{x:h-1.35,z:m,wz:x,ax:h,face:Math.PI/2},{x:h+1.35,z:m,wz:x,ax:h,face:-Math.PI/2}],v=d+1.6,y=v-.5,g=[In+.45,r-.45],b=Rr({x0:In,W:a,main:"right",bed:[.62,.62],reach:g}),w=Cr({x0:In,W:a,D:v,doorX:h,terraceU:1,out:"left"});l.push(...b.furniture,...w.furniture);const T=[b.corridor,[{x:g[0],z:y},{x:g[1],z:y}],...g.map(E=>[{x:E,z:Un},{x:E,z:y}]),[{x:h,z:x},{x:h,z:y}],...w.legs],M={map:"haveli",size:`haveli-${String(s)}`,W:a,D:v,x0:In,island:_,desks:c,islandSpots:p,mainDesk:b.mainDesk,lounge:b.lounge,boardSpots:b.boardSpots,queue:b.queue,door:w.door,terrace:w.terrace,exit:w.exit,furniture:l};return{...M,walks:Pr(M,T),queueMore:b.queueMore,k:s,yard:f,columns:u}}const tz={id:"haveli",ready:!0,layout:jA},Do=16.6,os=-Do/2,rs=8,ez=1.55,Eg=2.7,pu=5.4,Tg=.75,Ec=[os+.6,os+14.3];function Xd(e){const t=Math.floor(e/rs),n=e%rs;return{x:os+2+n*ez,z:pu+t*Eg+Tg*Math.sin(n/(rs-1)*1.5*Math.PI)}}function nz(e,t){const n=ds(e),i=Xa(n,t?.desks,Xd),s=Math.max(2,Math.ceil(Lr(i)/rs),t?.curves??0),[a,o]=Ec,r=new Map,c=[];for(const g of n){const b=Xd(i.get(g)??0);r.set(g,{x:b.x,z:b.z,wz:b.z-.6,ax:b.x,face:0}),c.push(jt(b.x,b.z+.5,1.3,.76))}const l=[],d=[];for(let g=0;g<s;g++){const b=Array.from({length:rs},(M,E)=>{const A=Xd(g*rs+E);return{x:A.x,z:A.z-.6}});l.push(b);const w=b[0],T=b[rs-1];d.push([{x:a,z:w.z},w],[T,{x:o,z:T.z}]);for(let M=1;M<rs;M++)d.push([b[M-1],b[M]])}const f=pu+1.6,u=jt(os+15.75,f,.9,3.2);c.push(u);const h=[-1.2,-.4,.4,1.2].map(g=>({x:os+14.95,z:f+g,wz:f+g,ax:o,face:Math.PI/2})),m=Math.max(pu+(s-1)*Eg+Tg+.88+1.2,f+2.4),_=m+.5,x=Rr({x0:os,W:Do,main:"left",bed:[.6,.9],reach:Ec}),p=Cr({x0:os,W:Do,D:_,doorX:o,terraceU:Do-4.6,out:"right"});c.push(...x.furniture,...p.furniture);const v=[x.corridor,[{x:a,z:m},{x:o,z:m}],...Ec.map(g=>[{x:g,z:Un},{x:g,z:m}]),...d,...p.legs],y={map:"tropical",size:`tropical-${String(s)}`,W:Do,D:_,x0:os,island:u,desks:r,islandSpots:h,mainDesk:x.mainDesk,lounge:x.lounge,boardSpots:x.boardSpots,queue:x.queue,door:p.door,terrace:p.terrace,exit:p.exit,furniture:c};return{...y,walks:Pr(y,v),queueMore:x.queueMore,curves:s,paths:l,aisles:Ec}}const iz={id:"tropical",ready:!0,layout:nz},Gc=16.4,Ni=-Gc/2,pl=3,sz=1.5,$d=4.8,Tc=[Ni+6.45,Ni+12.9,Ni+16],az=[Ni+3.3,Ni+9.7],oz=e=>((e*7+3)%3-1)*.3,Ag=e=>(az[e%2]??0)+oz(e),Hc=e=>5.2+Math.floor(e/2)*3.6+e%2*1.3;function Bp(e){const t=Math.floor(e/pl);return{x:Ag(t)+(e%pl-1)*sz,z:Hc(t)+.45}}function rz(e,t){const n=ds(e),i=Xa(n,t?.desks,Bp),s=Math.max(1,Math.ceil(Math.ceil(Lr(i)/pl)/2),t?.rows??0),[a,o,r]=Tc,c=new Map,l=[];for(const T of n){const M=i.get(T)??0,E=Math.floor(M/pl),A=Bp(M);c.set(T,{x:A.x,z:A.z,wz:Hc(E)-.1,ax:E%2===0?a:o,face:0}),l.push(jt(A.x,A.z+.5,1.3,.76))}const d=[];for(let T=0;T<s*2;T++){const M=Ag(T),E=Hc(T);d.push({x:M,z:E,w:$d}),l.push(jt(M,E-.55,$d+.1,.22),jt(M-$d/2-.05,E+.65,.22,2.4))}const f=Ni+14.6,u=4.8,h=[jt(f,u+1,.9,.9),jt(f,u+2.6,.9,.9)],m=[{x:f-1.1,z:u-.2},{x:f+1.1,z:u-.2},{x:f-1.1,z:u+3.9},{x:f+1.1,z:u+3.9}];l.push(...h,...m.map(T=>jt(T.x,T.z,.16,.16)));const _=[];for(const T of[u+1,u+2.6])_.push({x:f-.75,z:T,wz:T,ax:o,face:Math.PI/2},{x:f+.75,z:T,wz:T,ax:r,face:-Math.PI/2});_.push({x:f,z:u+.25,wz:u+.25,ax:o,face:0},{x:f,z:u+3.35,wz:u+3.35,ax:o,face:Math.PI});const x=h[1],p=Math.max(Hc(s*2-1)+.45+.89+1.3,u+4.6),v=p+.5,y=Rr({x0:Ni,W:Gc,main:"right",bed:[.8,.6],reach:Tc}),g=Cr({x0:Ni,W:Gc,D:v,doorX:a,terraceU:1,out:"left"});l.push(...y.furniture,...g.furniture);const b=[y.corridor,[{x:a,z:p},{x:r,z:p}],...Tc.map(T=>[{x:T,z:Un},{x:T,z:p}]),...g.legs],w={map:"cyclades",size:`cyclades-${String(s)}`,W:Gc,D:v,x0:Ni,island:x,desks:c,islandSpots:_,mainDesk:y.mainDesk,lounge:y.lounge,boardSpots:y.boardSpots,queue:y.queue,door:g.door,terrace:g.terrace,exit:g.exit,furniture:l};return{...w,walks:Pr(w,b),queueMore:y.queueMore,rows:s,cubes:d,tables:h,posts:m,lanes:Tc}}const cz={id:"cyclades",ready:!0,layout:rz},Vc=15.6,ys=-Vc/2,mu=4,va=ys+9.9,Ac=1.6;function Gp(e){const t=Math.floor(e/mu);return{x:ys+1.6+e%mu*2.1+t%2*.5,z:5+t*2}}function lz(e,t){const n=ds(e),i=Xa(n,t?.desks,Gp),s=Math.max(3,Math.ceil(Lr(i)/mu),t?.rows??0),a=new Map,o=[];for(const y of n){const g=Gp(i.get(y)??0);a.set(y,{x:g.x,z:g.z,wz:g.z-.6,ax:va,face:0}),o.push(jt(g.x,g.z+.5,1.4,.76))}const r=5+(s-1)*2,c={x0:ys+.5,x1:va-.45,z0:4.25,z1:r+1.3};for(const y of[c.x0,c.x1])for(const g of[c.z0,c.z1])o.push(jt(y,g,.2,.2));const l={x:ys+12.9,z:5+s-.5},d=jt(l.x,l.z,1.5,1.5);o.push(d);const f=Array.from({length:8},(y,g)=>{const b=g/8*Math.PI*2,w=l.x+Ac*Math.sin(b),T=l.z+Ac*Math.cos(b);return{x:w,z:T,wz:T,ax:w,face:Math.atan2(l.x-w,l.z-T)}}),u=f.map((y,g)=>[y,f[(g+1)%8]]),h=Math.max(r+.88+1.2,l.z+Ac+.9),m=h+.5,_=Rr({x0:ys,W:Vc,main:"right",bed:[.7,.5],reach:[va]}),x=Cr({x0:ys,W:Vc,D:m,doorX:l.x,terraceU:1,out:"left"});o.push(..._.furniture,...x.furniture);const p=[_.corridor,[{x:va,z:Un},{x:va,z:h}],[{x:va,z:h},{x:l.x,z:h}],[{x:l.x,z:l.z+Ac},{x:l.x,z:h}],...u,...x.legs],v={map:"sahel",size:`sahel-${String(s)}`,W:Vc,D:m,x0:ys,island:d,desks:a,islandSpots:f,mainDesk:_.mainDesk,lounge:_.lounge,boardSpots:_.boardSpots,queue:_.queue,door:x.door,terrace:x.terrace,exit:x.exit,furniture:o};return{...v,walks:Pr(v,p),queueMore:_.queueMore,rows:s,hangar:c,tree:l}}const dz={id:"sahel",ready:!0,layout:lz},Hp=11,Vp=3.4,fz=13.5,kc=3,zg=2.05,xu=1.95,ml=4.4,uz=ml-.5,hz=16,pz=10,kp=4.4,mz=6,xz=12,Ma=1.15,gz=.8,Wp=2.5,Xp={w:3,d:1.2},_z=6;function vz(e,t){const n=ds(e),i=Ez(n,t),s=Math.max(0,...[...i.values()].map(st=>st+1)),a=Math.max(3,Math.ceil(s/kc),t?.rows??0),o=Hp+Vp+fz,r=Math.max(hz,ml-.2+a*xu+2.6),c=-o/2,l=c+Hp,d=l+Vp,f=c+7.5,u=uz,h=r-2.4,m=new Map;for(const st of n){const Tt=i.get(st)??0,H=c+1.9+Tt%kc*zg,et=ml+Math.floor(Tt/kc)*xu;m.set(st,{x:H,z:et,wz:et-.5,ax:f,face:0})}const _=c+3.9,x=r-1.4,p=jt(_,x,Xp.w,Xp.d),v=[-1.2,-.4,.4,1.2].map(st=>({x:_+st,z:h,wz:h,ax:_+st,face:0})),y=(kp-.9)/3,g=[];for(let st=0;st<pz;st++){const Tt=st%4,H=c+.65+Tt*y,et=1+Math.floor(st/4)*1.05;g.push({x:H,z:et,wz:et,ax:Tt<3?H+y/2:H-y/2,face:0})}const b=c+kp+1.15,w=[-.45,.45,0].map(st=>({x:b+st,z:.75,wz:u,ax:b+st,face:Math.PI})),T=l-1.6,M=T-1.45,E={x:T,z:1.25,wz:.8,ax:M,face:0},A=[];for(let st=0;st<mz;st++)A.push({x:M,z:1.3+st*Hl,wz:u,ax:M,face:Math.PI/2});const C={x:c+1+Ma/2,z:r+.2,wz:h,ax:c+1+Ma/2,face:Math.PI},I=[];for(let st=0;st<xz;st++){const Tt=st%4,H=c+1+Tt*Ma,et=r+1.5+Math.floor(st/4)*Ma;I.push({x:H,z:et,wz:et,ax:Tt<3?H+Ma/2:H-Ma/2,face:0})}const U=r+gz,P={x:c-Wp,z:U,wz:U,ax:c-Wp,face:-Math.PI/2},O=yz(d,c+o-.2,.4,r-.2),V=O.flat.z,N={desks:m,mainDesk:E,islandSpots:v,lounge:g,boardSpots:w,queue:A,door:C,terrace:I,exit:P},F={map:"california",size:String(a),W:o,D:r,x0:c,island:p,...N,park:O},L=wz(F),B=bz({...F,crossBack:u,crossFront:h,aisle:f,tw:U,pathZ:V}),$=Math.min(...B[0].map(st=>st.x)),J=[{x:M,z:u},{x:Math.max($,c+1.5),z:u}];return{...F,rows:a,roomX1:l,parkX0:d,crossBack:u,crossFront:h,aisle:f,pathZ:V,walks:B,furniture:L,queueMore:J}}const Mz={id:"california",ready:!0,layout:vz};function yz(e,t,n,i){const s=(n+7.6+(i-4))/2,a=[],o=e+1.4;for(const c of[.45,1.45])a.push({x:o,z:s+c,wz:s,ax:o,face:Math.PI/2});for(let c=0;c<_z;c++){const l=e+2.6+c*.7;a.push({x:l,z:s+1.45,wz:s,ax:l,face:Math.PI/2})}const r=(c,l,d,f)=>({x0:c,x1:l,z:d,h:f});return{area:{x0:e,x1:t,z0:n,z1:i},spots:a,flat:r(e+2.6,e+7.2,s,0),curb:r(e+5.5,e+7,i-3.4,.2),rail:r(e+.9,e+4.9,i-1.6,.42),ledge:r(e+.8,e+4.8,i-3.4,.45),stairs:{x0:e,xTop:e+2.4,xBottom:e+2.4+4*.42,z0:n+4.8,z1:n+7.2,h:.8,railZ:n+6.95,bankX0:e+.8,bankZ:n+8.6},ramp:{xa:e+1,xb:e+1+1.2+3+1.2,r:1.2,z0:n+.2,z1:n+3.6},qp:{x0:t-3.8,x1:t-.6,zLip:n+.6,r:1,r13:1.7},funbox:{x:e+8.6,z:n+7.2,hw:1,hd:1.1,h:.5,run:1.35},bowl:{x:t-3,z:i-3.4,hw:2.3,hd:2.5,rc:1.4,depth:.95},benches:[{x0:e+.125,x1:e+.575,z0:s-1.9,z1:s-.4},{x0:t-.575,x1:t-.125,z0:n+5.3,z1:n+6.8}],poles:[{x:e+.15,z:n+.15},{x:t-.15,z:n+.15},{x:e+.15,z:n+4.3},{x:e+.15,z:i-.15},{x:(e+t)/2+1,z:n+.15}]}}function bz(e){const{crossBack:t,crossFront:n,aisle:i,tw:s,exit:a,door:o,pathZ:r,park:c}=e,l=[...e.desks.values(),e.mainDesk,...e.islandSpots,...e.lounge,...e.boardSpots,...e.queue,o,...e.terrace,a,...c.spots],d=l.filter(_=>_.wz<=t+1e-6).map(_=>_.ax),f=c.spots.map(_=>_.ax),u=[[{x:Math.min(i,...d),z:t},{x:Math.max(i,...d),z:t}],[{x:i,z:t},{x:i,z:n}],[{x:o.ax,z:n},{x:i,z:n}],[{x:i,z:r},{x:Math.max(...f),z:r}],[{x:o.ax,z:n},{x:o.ax,z:s}],[{x:a.x,z:s},{x:Math.max(o.ax,...e.terrace.map(_=>_.ax)),z:s}]],h=_=>u.some(([x,p])=>Sz(x,p,_)),m=[u[0],...u.slice(1)];for(const _ of l){m.push(...Vl(_));const x={x:_.ax,z:_.wz};h(x)||m.push([x,{x:_.ax,z:_.wz<t?t:s}])}return m}function Sz(e,t,n){return Math.abs(e.x-t.x)<1e-6?Math.abs(n.x-e.x)<1e-4&&n.z>=Math.min(e.z,t.z)-1e-4&&n.z<=Math.max(e.z,t.z)+1e-4:Math.abs(e.z-t.z)<1e-6?Math.abs(n.z-e.z)<1e-4&&n.x>=Math.min(e.x,t.x)-1e-4&&n.x<=Math.max(e.x,t.x)+1e-4:!1}function wz(e){const t=[];for(const i of e.desks.values())t.push(jt(i.x,i.z+.5,1.6,.78));t.push(jt(e.mainDesk.x,e.mainDesk.z+.6,2.3,1));const n=e.island;t.push({x0:n.x0-.05,x1:n.x1+.05,z0:n.z0-.05,z1:n.z1+.05});for(const i of e.lounge)t.push(jt(i.x,i.z-.05,.72,.72,i));for(const i of e.terrace)t.push(jt(i.x,i.z+.05,.5,.95,i));return t}function Ez(e,t){const n=new Map,i=new Set;if(t){const a=t.x0;for(const o of e){const r=t.desks.get(o);if(!r)continue;const c=Math.round((r.z-ml)/xu)*kc+Math.round((r.x-a-1.9)/zg);n.set(o,c),i.add(c)}}let s=0;for(const a of e)if(!n.has(a)){for(;i.has(s);)s++;n.set(a,s),i.add(s)}return n}const $p={loft:fA,greenhouse:bA,campus:EA,workshop:zA,kyoto:LA,riad:NA,nordic:GA,patio:JA,haveli:tz,tropical:iz,cyclades:cz,sahel:dz,california:Mz};function Tz(e){const t=$p[e];return t.ready?t:$p[wg]}function Rg(e,t=wg,n){const i=Tz(t);return i.layout(e,n?.map===i.id?n:void 0)}const Az=new Set(["sleep","waitagent"]);function zz(e){return e.filter(t=>Az.has(t.pose.seg.act.k)&&!t.pose.moving).map(t=>t.name)}function Rz(e,t){const n=new Set;for(const[i,s]of t){n.add(i);let a=e.querySelector(`:scope > [data-bim="${CSS.escape(i)}"]`);if(a===null){a=document.createElement("div"),a.className="bims-zzz",a.dataset.bim=i,a.dataset.testid=`app.right.bims.zzz.${i}`,a.setAttribute("aria-hidden","true");for(const o of["z","z","Z"]){const r=document.createElement("span");r.textContent=o,a.append(r)}e.append(a)}a.style.transform=`translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`}for(const i of[...e.children])i instanceof HTMLElement&&!n.has(i.dataset.bim??"")&&i.remove()}const Cg={eclipse:!1,ghost:null,tree:!1,cake:!1,april:!1,doodle:!1,music:!1},Cz=4,Pz=5,Lz=5;function Iz(e){return{y:e.getFullYear(),mo:e.getMonth()+1,d:e.getDate(),dow:e.getDay(),s:e.getHours()*3600+e.getMinutes()*60+e.getSeconds()}}const Pg=e=>`${String(e.y)}-${String(e.mo)}-${String(e.d)}`,Dz=2,Lg=.9,Ig=.6,Dg=1.2,Ba=3,Nz=30,qp=20,xl=10,gu=1.4,Uz=new Set(["salto","hop","moonwalk","itemget","kickflip","tap","golden","speedrun","combo","loop"]),_u=new Set(["nap","snack","done","mainidle"]);function _0(e){let t=2166136261;for(let n=0;n<e.length;n++)t^=e.charCodeAt(n),t=Math.imul(t,16777619)>>>0;return t>>>0}const ss=(e,t,n)=>_0(`${e}|${t}`)%n===0,Oz=e=>{const t=Math.max(0,Math.round(e/1e3));return`${String(Math.floor(t/60))}:${String(t%60).padStart(2,"0")}`};function Fz(e,t,n){const i=Pg(n),s=e.day===i?[...e.lands]:[];for(const a of t){const o=a.pose.seg;o.from!=="landing"||o.act.k!=="done"||s.some(r=>r.name===a.name&&r.t===o.t)||s.push({name:a.name,t:o.t})}return s.sort((a,o)=>a.t-o.t),s.length===e.lands.length&&i===e.day?e:{day:i,lands:s}}function Ng(e,t){const{local:n}=e,i=Pg(n),s=10*3600+_0(`eclipse-at|${i}`)%(8*3600),a=ss("eclipse",i,100)&&n.s>=s&&n.s<s+Nz,o=e.night&&n.s<qp?n.s/qp:null,r=e.agents.reduce((m,_)=>_.created_ms===void 0||_.created_ms===null?m:m===null?_.created_ms:Math.min(m,_.created_ms),null),c=r===null?null:new Date(r),l=c!==null&&c.getMonth()+1===n.mo&&c.getDate()===n.d&&c.getFullYear()<n.y,d=e.stage??0,f=e.agents.filter(m=>!m.archived&&m.status==="working").length,u=n.dow===5&&n.s>=17*3600,h=d>=Pz&&(f>=Lz||u);return{eclipse:a,ghost:o,tree:n.mo===12&&(n.d===24||n.d===25),cake:l,april:n.mo===4&&n.d===1,doodle:t&&d>=Cz,music:h}}function Bz(e,t,n,i,s){const{t:a}=t,{pose:o}=e,r=o.seg,c=r.act.k,l=`${e.name}@${r.t.toFixed(3)}`,d=a-r.t,f=r.path.len>.01&&r.from!==null?r.path.len/r.speed:0,u=(h,m,_,x="")=>a>=m&&a<m+_?{kind:h,since:a-m,dur:_,label:x}:null;if(t.konami!==null&&a-t.konami<gu&&a>=t.konami)return{kind:"salto",since:a-t.konami,dur:gu,label:e.main?"+30":""};if(e.main&&s!==null)return u("clap",s,Ba,"");if(e.main){const h=t.lands[3];if(h!==void 0)return u("tetris",h.t,Ba,"line clear")}if(c==="done"&&r.from!==null&&r.from!=="done"){const h=t.lands[0];if(r.from==="landing"&&h!==void 0&&h.name===e.name&&h.t===r.t)return u("itemget",r.t,2.5,"♪ ♪ ♪");const m=n.get(e.name),_=m?.created_ms;if(_!=null&&r.t*1e3-_<12e4&&r.t*1e3>=_)return u("speedrun",r.t,4,Oz(r.t*1e3-_));const x=m?.place_id;if(x!==void 0&&x!==""&&x!=="shared"&&t.frames.some(v=>v.name!==e.name&&v.pose.seg.act.k==="done"&&v.pose.seg.t<r.t&&n.get(v.name)?.place_id===x))return u("combo",r.t,Ba,"combo ×2");if(ss("salto",l,10))return u("salto",r.t,Lg)}if(c==="done"&&!o.moving&&r.act.at==="terrace"){const h=Math.floor(a/3600),m=h*3600+_0(`kickflip|${e.name}|${String(h)}`)%3600;if(m>r.t+f){const _=u("kickflip",m,Dg,"kickflip +500");if(_!==null)return _}}if(i.eclipse&&_u.has(c))return{kind:"lookup",since:0,dur:1/0,label:""};if(t.local.mo===10&&t.local.d===31&&t.local.s<xl&&_u.has(c))return{kind:"dance",since:t.local.s,dur:xl,label:""};if(o.moving&&f>4&&ss("hop",l,40))return u("hop",r.t+f/2,Ig);if(o.moving&&r.from==="coffee"&&ss("moonwalk",l,50))return u("moonwalk",r.t,f);if(c==="coffee"&&!o.moving&&ss("tap",l,200))return u("tap",r.t+f,.8);if(c==="snack"&&r.act.fruit===0&&ss("golden",l,500))return{kind:"golden",since:d,dur:1/0,label:""};if(o.plane!==void 0&&ss("loop",`${e.name}@${(a-o.plane.since).toFixed(1)}`,50))return{kind:"loop",since:o.plane.since,dur:1/0,label:""};if(c==="waitagent"){const h=r.act.on,m=h===void 0?void 0:n.get(h)?.waiting_on;if(m?.who==="agent"&&m.name===e.name)return{kind:"stare",since:d,dur:1/0,label:"!"}}return t.local.dow===5&&t.local.s>=17*3600&&(c==="nap"||c==="snack")?{kind:"shades",since:0,dur:1/0,label:""}:null}function Gz(e,t){const n=e.filter(i=>!i.main);return t>0||n.length===0||!n.every(i=>_u.has(i.pose.seg.act.k))||!n.some(i=>i.pose.seg.act.k==="done")?null:Math.max(...e.map(i=>i.pose.seg.t))}function Hz(e){if(e.reduced)return{bims:new Map,office:Cg};const t=new Map(e.agents.map(c=>[c.name,c])),n=e.frames.some(c=>c.pose.seg.act.at==="board"&&!c.pose.moving&&ss("doodle",`${c.name}@${c.pose.seg.t.toFixed(3)}`,10)),i=Ng(e,n),s=Gz(e.frames,e.cards),a=[];for(const c of e.frames){const l=Bz(c,e,t,i,s);l!==null&&a.push([c.name,l])}const o=a.filter(([,c])=>Uz.has(c.kind)&&!(e.konami!==null&&c.dur===gu)).sort(([c,l],[d,f])=>l.since-f.since||(c<d?-1:1)),r=new Set(o.slice(Dz).map(([c])=>c));return{bims:new Map(a.filter(([c])=>!r.has(c))),office:i}}const Vz={bims:new Map,office:Cg};function Yp(e,t,n){const i=Ng({local:e,night:t,agents:n},!1),s=e.dow===5&&e.s>=17*3600,a=e.mo===10&&e.d===31&&e.s<xl;return`${JSON.stringify({...i,ghost:i.ghost===null?null:Math.round(i.ghost*40)})}|${String(s)}|${String(a)}`}function kz(e,t){if(t==null)return e;const n=new Map(e.bims);for(const[i,s]of Object.entries(t.bims??{}))n.set(i,{kind:s.kind,since:s.since,dur:Wz[s.kind]??1/0,label:Xz[s.kind]??""});return{bims:n,office:{...e.office,...t.office}}}const Wz={salto:Lg,hop:Ig,kickflip:Dg,itemget:2.5,tap:.8,clap:Ba,dance:xl,speedrun:4,combo:Ba,tetris:Ba},Xz={speedrun:"1:47",combo:"combo ×2",stare:"!",itemget:"♪ ♪ ♪",kickflip:"kickflip +500",tetris:"line clear"};function $z(e){const t=new Map;for(const[n,i]of e.bims)i.label!==""&&t.set(n,i.label);return t}const zc={walk:2.4,hurry:3.5,skate:3.4,carry:1.8},v0=6,Ug=1.5,Zp=3.5,Kp=8,Jp=6,qz=3,Yz=3,Zz=10,Kz=new Set(["work","hot","nap","snack","done"]);function Jz(){const e=new Map;let t=null;const n=new Set,i=(o,r)=>o.segs.findLast(c=>c.t<=r)??null,s=(o,r)=>{if(o.leaving&&r>=o.outAt)return null;const c=i(o,r);if(!c)return null;const l=(r-c.t)*c.speed,d=l<c.path.len-1e-9,f=d?_g(c.path,l):{x:c.spot.x,z:c.spot.z,dir:c.spot.face},u=o.planes.findLast(h=>h<=r&&r-h<Zp);return{x:f.x,z:f.z,dir:f.dir,moving:d,since:r-c.t,seg:c,...u===void 0?{}:{plane:{since:r-u}}}},a=(o,r)=>{o.segs.push(r),o.segs.length>Kp&&o.segs.splice(0,o.segs.length-Kp)};return{update(o,r,c,l,d,f){const u=t===null,h=t!==null&&(t.map!==r.map||t.size!==r.size);t=r;const m=new Map;for(const[p,v]of e)v.key&&!v.leaving&&m.set(v.key,p);n5(e,o,l,c,n);for(const p of e.values())p.over&&c>=p.over.until&&(p.over=null);const _=new Map([...o].filter(([p])=>e.get(p)?.over==null)),x=J3(_,r,c,f);for(const[p,v]of o){let y=e.get(p);const g=t5(y?.over?.act??v,y?.key??null,m,r.lounge.length,d),b=y?.over?void 0:x.get(p),w=b?r.park?.spots[b.slot]:void 0,T=b&&w?`skate|${String(b.slot)}|${b.pool?"pool":""}|${b.nine?"900":""}|${String(b.stage)}`:Qz(g),M=y?.segs.at(-1),E=w??jz(r,p,g);if(y&&M&&!y.leaving&&M.sig===T&&(w!==void 0||M.act.at===g.at)&&!h&&(!E||i5(E,M.spot)))continue;y?.key&&m.delete(y.key);const A=E?null:e5(r,g.at,m,y?.pref),C=E??A?.spot??r.door,I=A?.key??null;if(I&&m.set(I,p),y&&A?.ix!==void 0&&y.pref.set(g.at,A.ix),!y){y={segs:[],key:I,leaving:!1,outAt:1/0,pref:new Map,planes:[],over:null},A?.ix!==void 0&&y.pref.set(g.at,A.ix),e.set(p,y);const O=u?C:r.door;a(y,qd(Yd(r,c,g,T,O,C,null),b,void 0));continue}if(y.key=I,y.leaving=!1,y.outAt=1/0,h&&M){a(y,qd({...M,act:g,sig:T,spot:C,path:Lo([C]),t:M.sig===T?M.t:c},b,void 0));continue}const U=s(y,c),P=qd(Yd(r,c,g,T,U??C,C,M?M.act.k:null),b,M);a(y,P),y.over&&y.over.act===g&&(y.over.until=c+P.path.len/P.speed+y.over.stay)}for(const p of e.values())p.over&&p.over.until===1/0&&(p.over.until=c+v0+p.over.stay);for(const[p,v]of e){if(o.has(p)||v.leaving)continue;const y=v.segs.at(-1);v.key&&m.delete(v.key),v.key=null,v.leaving=!0;const g={k:"done",at:"terrace"},b=h?null:s(v,c),w=Yd(r,c,g,"gone",b??r.exit,r.exit,y?.act.k??null);a(v,w),v.outAt=c+w.path.len/w.speed}for(const[p,v]of e)v.leaving&&v.outAt<c&&e.delete(p);for(const p of l){if(p.kind!=="message"||p.from.who!=="you"||p.to.who!=="agent")continue;const v=e.get(p.to.name);!v||v.planes.includes(p.t)||(v.planes.push(p.t),v.planes.sort((y,g)=>y-g))}for(const p of e.values())p.planes=p.planes.filter(v=>v>c-Zp-60)},poseAt(o,r){const c=e.get(o);return c?s(c,r):null},names(o){return[...e].filter(([,r])=>s(r,o)!==null).map(([r])=>r)},moving(o){for(const r of e.values()){const c=s(r,o);if(!c)continue;if(c.moving||c.plane||r.over)return!0;const l=c.seg;if(l.from!==null&&o<l.t+l.path.len/l.speed+Ug)return!0}return!1}}}function qd(e,t,n){return{...{t:e.t,act:e.act,sig:e.sig,spot:e.spot,path:e.path,speed:e.speed,from:e.from},...t?{pastime:t}:{},...!t&&n?.pastime?{fromSkate:!0}:{}}}function Qz(e){return`${e.k}|${e.rank===void 0?"":String(e.rank)}|${e.key===void 0?"":String(e.key)}|${e.with??""}`}function Yd(e,t,n,i,s,a,o){const r=gg(e,s,a),c=i==="gone"||n.k==="done"?zc.skate:n.k==="landing"?zc.carry:n.urgent?zc.hurry:zc.walk;return{t,act:n,sig:i,spot:a,path:r,speed:Math.max(c,r.len/v0),from:o}}function jz(e,t,n){switch(n.at){case"desk":return n.k==="visit"&&n.with!==void 0?Qp(e.desks.get(n.with)??e.mainDesk):e.desks.get(t)??e.door;case"main":return n.k==="report"?Qp(e.mainDesk):e.mainDesk;case"door":return e.door;case"queue":{const i=Math.max(1,n.rank??1),s=e.queue[i-1];if(s)return s;const[a,o]=e.queueMore,r=Math.hypot(o.x-a.x,o.z-a.z),c=r>0?Math.min(1,Hl*(i-e.queue.length)/r):0,l=a.x+(o.x-a.x)*c,d=a.z+(o.z-a.z)*c;return{x:l,z:d,wz:d,ax:l,face:e.queue.at(-1)?.face??Math.PI/2}}default:return null}}function t5(e,t,n,i,s){if(e.k!=="nap"||e.at!=="lounge")return e;const a=Math.min(i,s??i),o=r=>{const c=`lounge:${String(r)}`;return c===t||!n.has(c)};for(let r=0;r<a;r++)if(o(r))return e;return{...e,at:"desk"}}function e5(e,t,n,i){const s=t==="lounge"?e.lounge:t==="island"?e.islandSpots:t==="board"?e.boardSpots:e.terrace,a=f=>!n.has(`${t}:${String(f)}`),o=i?.get(t),r=o!==void 0&&o<s.length&&a(o)?o:s.findIndex((f,u)=>a(u)),c=s[r];if(c)return{spot:c,key:`${t}:${String(r)}`,ix:r};let l=0;for(;n.has(`${t}:+${String(l)}`);)l++;const d=s[l%s.length];return d?{spot:{x:d.ax,z:d.wz,wz:d.wz,ax:d.ax,face:d.face},key:`${t}:+${String(l)}`}:null}const Qp=e=>({x:e.x,z:e.wz,wz:e.wz,ax:e.ax,face:e.face});function n5(e,t,n,i,s){const a=o=>{const r=e.get(o),c=r?.over?.act.k??t.get(o)?.k;return r&&!r.leaving&&r.over===null&&c!==void 0&&Kz.has(c)?r:null};for(const o of[...n].sort((r,c)=>r.t-c.t)){const r=o.kind==="report"?`r|${o.agent}|${String(o.t)}`:`m|${JSON.stringify(o.from)}|${JSON.stringify(o.to)}|${String(o.t)}`;if(s.has(r)||o.t>i||i-o.t>Zz)continue;if(s.add(r),o.kind==="report"){const u=t.get(o.agent)?.k==="main"?null:a(o.agent);u&&(u.over={act:{k:"report",at:"main"},stay:Yz,until:1/0});continue}if(o.from.who!=="agent"||o.to.who!=="agent"||o.from.name===o.to.name)continue;const c=a(o.from.name);if(!c||t.get(o.from.name)?.k==="main")continue;const l=t.get(o.to.name)?.k,f=l==="nap"||l==="snack"?a(o.to.name):null;f?(c.over={act:{k:"coffee",at:"island",with:o.to.name},stay:Jp,until:1/0},f.over={act:{k:"coffee",at:"island",with:o.from.name},stay:Jp,until:1/0}):o.mode!=="unknown"&&l!==void 0&&(c.over={act:{k:"visit",at:"desk",with:o.to.name,mode:o.mode},stay:qz,until:1/0})}if(s.size>500)for(const o of[...s].slice(0,s.size-500))s.delete(o)}const i5=(e,t)=>Math.hypot(e.x-t.x,e.z-t.z)<1e-4,$a={hover:null,held:!1,lit:null,follow:null},s5=(e,t)=>`${t}|${e.map(n=>`${n.name}${n.main?"*":""}`).join(",")}`,a5=v0+Ug+1;function o5(e){const t=e.newTimeline();let n=null,i=[],s=null,a=!0,o=[],r=null,c="",l=cs,d=null,f,u={day:"",lands:[]},h=null,m="",_="";return{rows(v,y,g){n=v,i=y,s=g,a=!0},grow(v,y){l=v;const g=i1(d,v);g!==null&&(f={stage:g,at:y}),d=v,a=!0},event(v){o.push(v),a=!0},konami(v){h=v},step(v,y){const g=x(v);return g===null?null:p(g.office,g.reshaped,v,y)},still(v){const y=x(v);return y===null?null:p(y.office,y.reshaped,{...v,t:v.t+a5,reduced:!0,forced:{bims:{}}},$a,!0)},stale(v){if(n===null)return!1;const y=Yp(v.local,v.night,i)!==_||JSON.stringify([...e.activities(n,v.t)])!==m;return y&&(a=!0),y}};function x(v){if(n===null||s===null)return null;const{t:y,local:g,reduced:b}=v;let w=!1;if(a){a=!1;const T=s5(i,s);(r===null||T!==c)&&(c=T,r=e.layoutOf(i,s),w=!0);const M=e.activities(n,y);m=JSON.stringify([...M]),t.update(M,r,y,o,yl(l.stage),{stage:l.stage,jobs:l.jobs,dow:g.dow,day:K3(g.y,g.mo,g.d),reduced:b}),o=[]}return r===null?null:{office:r,reshaped:w}}function p(v,y,g,b,w=!1){const{t:T,local:M,night:E,reduced:A}=g,C=new Set(i.filter(F=>F.main).map(F=>F.name)),I=[];for(const F of t.names(T)){const L=t.poseAt(F,T);L!==null&&I.push({name:F,main:C.has(F),pose:L})}u=Fz(u,I,M);const U=g.forced!==void 0?kz(Vz,g.forced):Hz({t:T,frames:I,agents:i,cards:n?.cards.length??0,local:M,night:E,reduced:A,lands:u.lands,konami:h,stage:l.stage});_=Yp(M,E,i);const P=I.map(F=>{const L=U.bims.get(F.name),B=F.name===b.lit||F.name===b.follow;return L===void 0?B?{...F,lit:B}:F:{...F,egg:L,...B?{lit:B}:{}}}),O=w?void 0:f,V={night:E,reduced:A,eggs:U.office,grow:l,...O?{unlock:O}:{}};O&&T-O.at>Rc+hm&&(f=void 0);const N=e.labelsOf(P,{t:T,hover:b.hover,held:b.held,agents:i,eggs:$z(U),follow:b.follow,park:v.park});return{office:v,agents:i,want:s??v.map,reshaped:y,frames:I,played:P,look:V,labels:N,moving:t.moving(T)}}}const qs=300,ft=(e,t)=>e*60+t,vn={k:"work",doing:"edit"},Zd={k:"work",doing:"think"},si={k:"gone"},Ei={k:"idle"},yo={k:"done"},de="harness",Ue="bise.dev",De="acme-web",Zo=[{id:de,name:"harness",map:"loft",stage:13,bims:[{name:"main",main:!0,life:[[0,{k:"mainidle"}],[ft(0,3.5),{k:"main"}],[ft(4,20),{k:"mainidle"}]]},{name:"signup-flow",life:[[0,si],[ft(0,4),vn],[ft(0,10),{k:"asks"}],[ft(0,17),Zd],[ft(2,57),{k:"landing",rank:1}],[ft(3,5.5),yo],[ft(4,18),si]]},{name:"dark-mode",life:[[0,si],[ft(0,4.6),vn],[ft(0,18),{k:"landing",rank:1}],[ft(0,26.5),yo],[ft(4,21),si]]},{name:"fix-flaky-test",life:[[0,vn],[ft(0,54),{k:"failed"}],[ft(1,48),vn]]},{name:"docs-sync",life:[[0,{k:"snack",fruit:1,trip:1}],[ft(0,20),Ei],[ft(1,5),{k:"snack",fruit:1,trip:2}],[ft(1,9),{k:"snack",fruit:0,trip:3}],[ft(1,20),Ei],[ft(2,0),{k:"snack",fruit:2,trip:4}],[ft(2,14),Ei],[ft(2,46),{k:"snack",fruit:1,trip:5}],[ft(3,0),Ei],[ft(4,54),{k:"snack",fruit:1,trip:1}]]},{name:"perf-audit",life:[[0,{k:"sleep"}],[ft(3,38),vn],[ft(4,10),{k:"sleep"}]]}]},{id:Ue,name:"bise.dev",map:"california",stage:11,bims:[{name:"main",main:!0,life:[[0,{k:"mainidle"}],[ft(0,44),{k:"main"}],[ft(3,18),{k:"mainidle"}]]},{name:"pricing-page",life:[[0,si],[ft(0,46),vn],[ft(1,56),{k:"asks"}],[ft(2,7),vn],[ft(3,6),{k:"landing",rank:1}],[ft(3,13),yo],[ft(4,34),si]]},{name:"og-images",life:[[0,si],[ft(0,46.6),vn],[ft(2,28),{k:"landing",rank:1}],[ft(2,33),yo],[ft(2,36),si]]},{name:"seo-meta",life:[[0,Ei],[ft(1,17),Zd],[ft(1,23),Ei]]},{name:"i18n",life:[[0,Ei],[ft(4,30),Zd],[ft(4,36),Ei]]}]},{id:De,name:"acme-web",map:"riad",stage:9,bims:[{name:"main",main:!0,life:[[0,{k:"main"}]]},{name:"api-tests",life:[[0,vn],[ft(1,17),{k:"wait",on:"checkout"}],[ft(1,28),vn]]},{name:"checkout",life:[[0,vn],[ft(1,17),{k:"wait",on:"api-tests"}],[ft(1,28),Ei],[ft(1,31),vn]]},{name:"invoice-pdf",life:[[0,si],[ft(0,59.5),vn],[ft(2,51),{k:"landing",rank:1}],[ft(2,58),yo],[ft(4,38),si]]}]}],Og=[{at:ft(0,.5),office:de,from:"you",to:"main"},{at:ft(0,14),office:de,from:"you",to:"signup-flow"},{at:ft(0,41),office:Ue,from:"you",to:"main"},{at:ft(1,29),office:De,from:"api-tests",to:"checkout"},{at:ft(2,2),office:Ue,from:"you",to:"pricing-page"},{at:ft(3,52),office:De,from:"api-tests",to:"main"},{at:ft(0,28),office:De,from:"you",to:"api-tests"},{at:ft(1,0),office:de,from:"you",to:"main"},{at:ft(1,20),office:De,from:"you",to:"invoice-pdf"},{at:ft(1,40),office:de,from:"you",to:"signup-flow"},{at:ft(2,22),office:De,from:"you",to:"main"},{at:ft(2,44),office:de,from:"you",to:"fix-flaky-test"},{at:ft(3,24),office:De,from:"you",to:"api-tests"},{at:ft(3,45),office:de,from:"you",to:"perf-audit"},{at:ft(4,1),office:De,from:"you",to:"checkout"},{at:ft(4,24),office:De,from:"you",to:"invoice-pdf"},{at:ft(4,42),office:de,from:"you",to:"fix-flaky-test"}],r5=[{at:ft(0,14),dur:3.5,office:de,bim:"signup-flow",kind:"loop"},{at:ft(0,17.2),dur:.6,office:de,bim:"signup-flow",kind:"hop"},{at:ft(0,23.5),dur:2.5,office:de,bim:"dark-mode",kind:"itemget"},{at:ft(1,2),dur:.6,office:De,bim:"invoice-pdf",kind:"hop"},{at:ft(1,11),dur:8,office:de,bim:"docs-sync",kind:"golden"},{at:ft(1,17.5),dur:10.5,office:De,bim:"api-tests",kind:"stare"},{at:ft(1,17.5),dur:10.5,office:De,bim:"checkout",kind:"stare"},{at:ft(1,36),dur:.8,office:De,bim:"checkout",kind:"tap"},{at:ft(1,41),dur:6,office:De,bim:"checkout",kind:"moonwalk"},{at:ft(2,2),dur:5,office:Ue,bim:"pricing-page",kind:"loop"},{at:ft(2,7.5),dur:.6,office:Ue,bim:"pricing-page",kind:"hop"},{at:ft(2,33),dur:3,office:Ue,bim:"og-images",kind:"speedrun"},{at:ft(3,3),dur:3,office:de,bim:"dark-mode",kind:"combo"},{at:ft(3,3),dur:3,office:de,bim:"signup-flow",kind:"combo"},{at:ft(3,12),dur:3,office:Ue,bim:"main",kind:"tetris"},{at:ft(3,15),dur:3,office:Ue,bim:"main",kind:"clap"},{at:ft(3,30),dur:1.2,office:de,bim:"dark-mode",kind:"kickflip"},{at:ft(4,16),dur:.9,office:de,bim:"signup-flow",kind:"salto"}],Pe=(e,t)=>({k:"bim",office:e,name:t}),Mn=[{at:0,size:"tight",subject:{k:"office",office:de}},{at:ft(0,4),size:"follow",subject:Pe(de,"signup-flow")},{at:ft(0,8),size:"tight",subject:{k:"office",office:de}},{at:ft(0,10),size:"close",subject:Pe(de,"signup-flow")},{at:ft(0,14),size:"follow",subject:Pe(de,"signup-flow")},{at:ft(0,20),size:"follow",subject:Pe(de,"dark-mode")},{at:ft(0,23.5),size:"close",subject:Pe(de,"dark-mode")},{at:ft(0,26),size:"wide",subject:{k:"town"}},{at:ft(0,30),size:"close",subject:Pe(Ue,"i18n")},{at:ft(0,38),size:"follow",subject:Pe(Ue,"seo-meta")},{at:ft(0,44),size:"office",subject:{k:"office",office:Ue}},{at:ft(0,52),size:"follow",subject:Pe(de,"fix-flaky-test")},{at:ft(1,0),size:"office",subject:{k:"office",office:De}},{at:ft(1,8),size:"close",subject:Pe(de,"docs-sync")},{at:ft(1,16),size:"wide",subject:{k:"town"}},{at:ft(1,24),size:"follow",subject:{k:"pair",office:De,names:["api-tests","checkout"]}},{at:ft(1,32),size:"follow",subject:Pe(De,"checkout")},{at:ft(1,40),size:"close",subject:Pe(De,"checkout")},{at:ft(1,46),size:"office",subject:{k:"office",office:de}},{at:ft(1,54),size:"follow",subject:Pe(Ue,"pricing-page")},{at:ft(2,2),size:"tight",subject:Pe(Ue,"pricing-page")},{at:ft(2,10),size:"wide",subject:{k:"town"}},{at:ft(2,18),size:"follow",subject:Pe(Ue,"seo-meta")},{at:ft(2,26),size:"close",subject:Pe(Ue,"og-images")},{at:ft(2,36),size:"follow",subject:Pe(Ue,"og-images")},{at:ft(2,40),size:"wide",subject:{k:"town"}},{at:ft(2,52),size:"follow",subject:Pe(De,"invoice-pdf")},{at:ft(3,0),size:"office",subject:{k:"office",office:de}},{at:ft(3,8),size:"follow",subject:Pe(Ue,"pricing-page")},{at:ft(3,14),size:"closest",subject:Pe(Ue,"main")},{at:ft(3,20),size:"wide",subject:{k:"town"}},{at:ft(3,28),size:"follow",subject:Pe(de,"dark-mode")},{at:ft(3,36),size:"office",subject:{k:"office",office:de}},{at:ft(3,44),size:"close",subject:{k:"spot",office:Ue,spot:"park"}},{at:ft(3,52),size:"office",subject:{k:"office",office:De}},{at:ft(4,0),size:"wide",subject:{k:"town"}},{at:ft(4,8),size:"office",subject:{k:"office",office:de}},{at:ft(4,16),size:"follow",subject:Pe(de,"signup-flow")},{at:ft(4,24),size:"wide",subject:{k:"town"}},{at:ft(4,58),size:"tight",subject:{k:"office",office:de},glide:10}],vu=1.5,c5=1.6,l5=2.4,jp=.6,d5=4,f5=20,tm=2.4,u5=14,gl={x:.575,y:.5},h5={x0:.27,x1:.89,y0:.11,y1:.89},Fg={x0:.3,x1:.85,y0:.1,y1:.9},p5=1.3,m5={tight:1.4,follow:2.2,close:3.2,closest:4},Ko=(e,t,n)=>Math.min(n,Math.max(t,e)),Bg=1.001,x5=.2;function Hi(e){const t=Ko(Number.isFinite(e.zoom)?e.zoom:1,Bg,u5),n=.5/t,i=x5/t,s=Math.min(n,1-n)-i,a=Math.max(n,1-n)+i;return{zoom:t,u:Ko(e.u,s,a),v:Ko(e.v,s,a)}}function Mu(e,t){const n=(t.x1-t.x0)/Math.max(1e-6,e.u1-e.u0),i=(t.y1-t.y0)/Math.max(1e-6,e.v1-e.v0),s=Math.max(Bg,Math.min(n,i)),a=(e.u0+e.u1)/2,o=(e.v0+e.v1)/2,r=(t.x0+t.x1)/2,c=(t.y0+t.y1)/2;return Hi({zoom:s,u:a-(r-.5)/s,v:o-(c-.5)/s})}function yu(e,t,n=gl.x,i=gl.y){return Hi({zoom:t,u:e.u-(n-.5)/t,v:e.v-(i-.5)/t})}const _l=e=>e.k==="town"?null:e.office;function bo(e,t){const n=e.subject;if(e.size==="wide"||n.k==="town"){const o=t.town();return o?Mu(o,h5):null}const i=t.office(n.office);if(!i)return null;const s=Mu(i,Fg);let a;switch(n.k){case"office":a=null;break;case"spot":a=t.spot(n.office,n.spot);break;case"bim":a=t.bim(n.office,n.name);break;case"pair":{const o=t.bim(n.office,n.names[0]),r=t.bim(n.office,n.names[1]);a=o&&r?{u:(o.u+r.u)/2,v:(o.v+r.v)/2}:o??r;break}}if(e.size==="office"){const o=a??{u:s.u+(gl.x-.5)/s.zoom,v:s.v+(gl.y-.5)/s.zoom};return yu(o,s.zoom*p5)}return a===null?s:yu(a,s.zoom*m5[e.size])}function So(e,t){const n=e[0];if(n!==void 0&&t>=n.at-vu+qs)return 0;let i=e.length-1;for(let s=0;s<e.length;s++){const a=e[s];a!==void 0&&a.at-vu<=t&&(i=s)}return i}function g5(e,t){const n=e===null?null:_l(e.subject),i=_l(t.subject),s=e!==null&&n!==i&&n!==null&&i!==null,a=t.glide??(e===null?jp:n===i?c5:l5);return{dur:Math.max(jp,a),across:s}}const em={amp:.04,period:10};function _5(e,t){const n=Math.max(0,t),i=em.amp/2*(1-Math.cos(2*Math.PI*n/em.period));return Hi({...e,u:e.u+i/e.zoom})}const v5=e=>{const t=Ko(e,0,1);return t*t*t*(t*(t*6-15)+10)};function nm(e,t,n,i){const s=v5(n),a=Math.log(e.zoom),o=Math.log(t.zoom);let r=a+(o-a)*s;if(i!==null){const c=(a+o)/2,l=Math.max(0,c-Math.log(Math.max(1,i)));r-=l*4*s*(1-s)}return Hi({zoom:Math.exp(r),u:e.u+(t.u-e.u)*s,v:e.v+(t.v-e.v)*s})}const ya=e=>({cam:e,vz:0,vu:0,vv:0});function M5(e,t,n){const i=Ko(n,0,.1),s=d5,a=(u,h,m)=>{const _=u-m,x=Math.exp(-s*i),p=h+s*_;return[m+(_+p*i)*x,(h-s*p*i)*x]},[o,r]=a(Math.log(e.cam.zoom),e.vz,Math.log(t.zoom)),[c,l]=a(e.cam.u,e.vu,t.u),[d,f]=a(e.cam.v,e.vv,t.v);return{cam:Hi({zoom:Math.exp(o),u:c,v:d}),vz:r,vu:l,vv:f}}function y5(e,t,n){return e.k==="visitor"&&!n&&t-e.last>=f5}const ve={slab:{from:0,to:400},edge:{from:200,to:400},roads:{from:200,to:1400},things:{from:400,span:1400,jitter:40},drop:240,furniture:180,pop:200,bims:{from:1800,gap:30,pop:150},words:{from:2250,to:2400},built:2400,cam:{from:2400,to:2800},done:2800},b5=16,im=.92,bu=1e-4,Su=e=>Math.min(1,Math.max(0,e));function S5(e,t,n,i){const s=(o,r,c)=>3*o*c*(1-c)**2+3*r*c*c*(1-c)+c**3,a=(o,r,c)=>3*o*(1-c)**2+6*(r-o)*c*(1-c)+3*(1-r)*c*c;return o=>{const r=Su(o);let c=r;for(let l=0;l<8;l++){const d=a(e,n,c);if(Math.abs(d)<1e-6)break;c=Su(c-(s(e,n,c)-r)/d)}return s(t,i,c)}}const pr=S5(.65,0,.35,1);function Gg(e){const n=Su(e)-1;return 1+(1.04+1)*n**3+1.04*n*n}function w5(e,t){const n=Math.sin(Math.floor(e/2)*12.9898+Math.floor(t/2)*78.233)*43758.5453;return(n-Math.floor(n))*2-1}function sm(e,t,n,i){const{from:s,span:a,jitter:o}=ve.things;return s+a*pr(t>0?e/t:0)+o*w5(n,i)}function Kd(e,t,n){return e<t?bu:Math.max(bu,Gg((e-t)/n))}function E5(e){return pr((e-ve.roads.from)/(ve.roads.to-ve.roads.from))}const Rn=new Za,Ti=new q,wo=new q;function T5(){const e=new WeakMap,t=new WeakMap,n=[],i={c:{value:{x:0,y:0}},r:{value:0}};let s=0;const a=new Map,o=new Map;function r(f){const u=f.clone();return u.onBeforeCompile=h=>{h.uniforms.uRevealC=i.c,h.uniforms.uRevealR=i.r,h.vertexShader=h.vertexShader.replace("#include <common>",`#include <common>
varying vec2 vRevealXZ;`).replace("#include <project_vertex>",`#include <project_vertex>
vRevealXZ = (modelMatrix * vec4(transformed, 1.0)).xz;`),h.fragmentShader=h.fragmentShader.replace("#include <common>",`#include <common>
varying vec2 vRevealXZ;
uniform vec2 uRevealC;
uniform float uRevealR;`).replace("#include <clipping_planes_fragment>",`if (distance(vRevealXZ, uRevealC) > uRevealR) discard;
#include <clipping_planes_fragment>`)},u.customProgramCacheKey=()=>"bims-hero-reveal",n.push(u),u}function c(f,u){const h=e.get(f);if(h)return h;const m=[],_=[];let x=0,p=0;f.updateMatrixWorld(!0);for(const g of f.children)Rn.setFromObject(g),Rn.getSize(Ti),p=Math.max(p,Ti.x);for(const g of f.children){Rn.setFromObject(g),Rn.getSize(Ti),Rn.getCenter(wo);const b=g instanceof we?g:null;if(b&&Ti.x>=p*.9&&!Array.isArray(b.material)){const w=b.material.clone();w.transparent=!0,n.push(w),b.material=w,m.push({mesh:b,mat:w,edge:Ti.y>.5});continue}if(b&&Ti.y<.1&&!Array.isArray(b.material)){b.material=r(b.material),x=Math.max(x,...[Rn.min.x,Rn.max.x].flatMap(w=>[Rn.min.z,Rn.max.z].map(T=>Math.hypot(w-u.x,T-u.z))));continue}_.push({o:g,d:Math.hypot(wo.x-u.x,wo.z-u.z),x:wo.x,z:wo.z})}s=Math.max(s,..._.map(g=>g.d));const v=_.map(g=>({o:g.o,base:g.o.scale.clone(),start:sm(g.d,s,g.x,g.z),dur:ve.pop})),y={slab:m,pops:v,reach:x};return e.set(f,y),y}function l(f,u,h){const m=t.get(f);if(m)return m;const _=[];f.updateMatrixWorld(!0);let x=0;for(const v of f.children)v.visible&&(Rn.setFromObject(v),!Rn.isEmpty()&&(Rn.getSize(Ti),!(Math.max(Ti.x,Ti.z)>=u*.45)&&_.push({o:v,base:v.scale.clone(),start:h+ve.drop+x++%6*12,dur:ve.furniture})));const p={pops:_};return t.set(f,p),p}const d=(f,u)=>{f.o.scale.set(f.base.x*u,f.base.y*u,f.base.z*u)};return{apply(f,u,h){const m=u.centre;if(u.scape){const p=c(u.scape,m),v=pr((f-ve.slab.from)/(ve.slab.to-ve.slab.from));for(const y of p.slab)y.mesh.scale.setScalar(im+(1-im)*v),y.mat.opacity=y.edge?pr((f-ve.edge.from)/(ve.edge.to-ve.edge.from)):v;i.c.value={x:m.x,y:m.z},i.r.value=p.reach*E5(f)+.001;for(const y of p.pops)d(y,Kd(f,y.start,y.dur))}const _=b5*h*1.25,x=[];for(const p of u.offices){let v=a.get(p.root);if(!v){const b=Math.hypot(p.root.position.x-m.x,p.root.position.z-m.z);v={y:p.root.position.y,start:sm(b,Math.max(s,b),p.root.position.x,p.root.position.z)},a.set(p.root,v)}const y=(f-v.start)/ve.drop;if(p.root.scale.setScalar(f<v.start?bu:1),p.root.position.y=v.y+_*(1-Gg(y)),p.world)for(const b of l(p.world,p.width,v.start).pops)d(b,Kd(f,b.start,b.dur));const g=Math.hypot(p.root.position.x-m.x,p.root.position.z-m.z);for(const b of p.bims)x.push({body:b.body,d:g,name:b.name})}x.sort((p,v)=>p.d-v.d||p.name.localeCompare(v.name)),x.forEach((p,v)=>{let y=o.get(p.body);y||(y=p.body.scale.clone(),o.set(p.body,y));const g=Kd(f,ve.bims.from+v*ve.bims.gap,ve.bims.pop);p.body.scale.set(y.x*g,y.y*g,y.z*g)})},finish(f){for(const u of f?.offices??[]){const h=a.get(u.root);if(u.root.scale.setScalar(1),h&&(u.root.position.y=h.y),u.world)for(const m of t.get(u.world)?.pops??[])d(m,1)}for(const[u,h]of o)u.scale.copy(h);o.clear(),a.clear();for(const u of n.splice(0))u.dispose()}}}function A5(e){return pr((e-ve.words.from)/(ve.words.to-ve.words.from))}const z5=4,R5=.01;function Jd(e,t,n,i){const s=e.zoom*t,a=e.u+(n-.5)/e.zoom,o=e.v+(i-.5)/e.zoom,r=Hi({zoom:s,u:a-(n-.5)/s,v:o-(i-.5)/s});return Hi({zoom:r.zoom,u:a-(n-.5)/r.zoom,v:o-(i-.5)/r.zoom})}function am(e,t,n){return Hi({zoom:e.zoom,u:e.u-t/e.zoom,v:e.v-n/e.zoom})}function C5(e,t){let n=null,i=null;const s=()=>e.getBoundingClientRect(),a=g=>{const b=s();return{x:g.clientX-b.left,y:g.clientY-b.top,w:Math.max(1,b.width),h:Math.max(1,b.height)}},o=g=>{e.style.cursor=g};o("grab");const r=g=>{g.pointerType==="touch"||g.button!==0||g.target?.closest("button, a")==null&&(e.setPointerCapture(g.pointerId),n={id:g.pointerId,x:g.clientX,y:g.clientY,lx:g.clientX,ly:g.clientY,moved:!1})},c=g=>{if(g.pointerType==="touch")return;const b=a(g);if(n===null||n.id!==g.pointerId){const w=t.pick(b.x,b.y);o(w===null?"grab":"pointer"),t.hover(w);return}!n.moved&&Math.hypot(g.clientX-n.x,g.clientY-n.y)<z5||(n.moved||o("grabbing"),n.moved=!0,t.take(am(t.cam(),(g.clientX-n.lx)/b.w,(g.clientY-n.ly)/b.h)),n.lx=g.clientX,n.ly=g.clientY)},l=g=>{if(n===null||n.id!==g.pointerId)return;const b=n;if(n=null,o("grab"),b.moved||g.type==="pointercancel")return;const w=a(g),T=t.pick(w.x,w.y);T!==null&&t.follow({office:T.id,name:T.name})},d=g=>{const b=g[0],w=g[1];return!b||!w?null:{mx:(b.clientX+w.clientX)/2,my:(b.clientY+w.clientY)/2,d:Math.hypot(b.clientX-w.clientX,b.clientY-w.clientY)}},f=g=>{if(g.touches.length!==2){i=null;return}g.preventDefault();const b=d(g.touches);if(b!==null){if(i!==null&&g.type==="touchmove"){const w=s(),T=Math.max(1,w.width),M=Math.max(1,w.height);let E=am(t.cam(),(b.mx-i.mx)/T,(b.my-i.my)/M);i.d>0&&b.d>0&&(E=Jd(E,b.d/i.d,(b.mx-w.left)/T,(b.my-w.top)/M)),t.take(E)}i=b}},u=g=>{if(g.pointerType!=="touch")return;const b=a(g),w=t.pick(b.x,b.y);w!==null&&t.follow({office:w.id,name:w.name})},h=g=>{if(!g.ctrlKey&&!g.metaKey)return;g.preventDefault();const b=a(g),w=g.deltaMode===1?g.deltaY*16:g.deltaY;t.take(Jd(t.cam(),Math.exp(-w*R5),b.x/b.w,b.y/b.h))},m=g=>{g.preventDefault(),t.wide()};let _=!1;const y=[[e,"pointerdown",r],[e,"pointermove",c],[e,"pointerup",l],[e,"pointercancel",l],[e,"touchstart",f,{passive:!1}],[e,"touchmove",f,{passive:!1}],[e,"touchend",f],[e,"click",u],[e,"wheel",h,{passive:!1}],[e,"dblclick",m],[e,"pointerenter",()=>{_=!0,t.inside(!0)}],[e,"pointerleave",()=>{_=!1,t.inside(!1),t.hover(null)}],[window,"keydown",g=>{g.key==="Escape"&&_&&t.wide()}]];for(const[g,b,w,T]of y)g.addEventListener(b,w,T);return{zoomBy(g){t.take(Jd(t.cam(),g,.575,.5))},dispose(){for(const[g,b,w]of y)g.removeEventListener(b,w);e.style.cursor=""}}}const vl=4;function om(e,t,n){const i=e-t/2;return n<=0?i:Math.max(vl,Math.min(i,n-vl-t))}const P5=(e,t)=>e.left<t.left+t.w&&t.left<e.left+e.w&&e.top<t.top+t.h&&t.top<e.top+e.h;function L5(e,t,n){const i=[...e].sort((l,d)=>l.rank-d.rank),s=[...i.filter(l=>l.pill),...i.filter(l=>!l.pill)],a=[],o=new Map;let r=0;const c=l=>n<=0||l.top>=0&&l.top+l.h<=n;for(const l of s){const d=om(l.x,l.w,t),f={left:d,top:l.y-l.h,w:l.w,h:l.h};if(l.pill){const _=n<=0?f.top:Math.max(vl,Math.min(f.top,n-vl-l.h));a.push({...f,top:_}),o.set(l.name,{left:d,top:_,lead:!1});continue}const u=_=>({...f,left:om(l.x+_,l.w,t)}),m=[f,...[-1,1,-2,2].map(_=>({...f,top:f.top+_*l.h})),u(-l.w/2),u(l.w/2)].find(_=>c(_)&&!a.some(x=>P5(x,_)));if(m===void 0){r++;continue}a.push(m),o.set(l.name,{left:m.left,top:m.top,lead:m.top!==f.top||Math.abs(m.left-f.left)>.5})}return{at:o,left:r}}function I5(e){return e.replaceAll("!","…").replaceAll("?","…").replaceAll("✗","…")}const D5={asks:"?",failed:"✗"};function rm(e){return e.mode==="egg"?e.words:e.words===""?e.name:`${e.name} · ${e.words}`}function N5(e){const t=document.createElement("div");t.className="bh-overlay",t.setAttribute("aria-hidden","true");const n=document.createElement("div");n.className="bims-zzzs";const i=document.createElement("div");i.className="bh-tags",t.append(n,i),e.append(t);const s=new Map;return{root:t,labels(a){const o=new Set,r=[];for(const{key:l,label:d,head:f,rank:u}of a){o.add(l);let h=s.get(l);const m=`${d.mode}|${d.pill??""}|${rm(d)}`;if(h===void 0&&(h=document.createElement("div"),h.className="bh-tag",i.append(h),s.set(l,h)),h.dataset.sig!==m){if(h.dataset.sig=m,h.dataset.mode=d.mode,h.replaceChildren(),d.pill!==null){const x=document.createElement("span");x.className=`bh-pill ${d.pill}`,x.textContent=D5[d.pill],h.append(x)}const _=d.mode==="pill"?"":rm(d);if(_!==""){const x=document.createElement("span");x.className="bh-label",x.textContent=_,h.append(x)}}h.style.visibility=f===null?"hidden":"",f!==null&&r.push({name:l,x:f.x,y:f.y,w:h.offsetWidth,h:h.offsetHeight,pill:d.mode==="pill",rank:u})}for(const[l,d]of s)o.has(l)||(d.remove(),s.delete(l));const{at:c}=L5(r,e.clientWidth,e.clientHeight);for(const l of r){const d=s.get(l.name),f=c.get(l.name);d!==void 0&&(d.style.visibility=f===void 0?"hidden":"",f!==void 0&&(d.style.transform=`translate(${f.left.toFixed(1)}px, ${f.top.toFixed(1)}px)`))}},zzz(a){Rz(n,a)},dispose(){t.remove()}}}function U5(e){const t=e%100>=11&&e%100<=13?"th":e%10===1?"st":e%10===2?"nd":e%10===3?"rd":"th";return`${String(e)}${t}`}function O5(e){const t=Math.floor(Math.max(0,e)/6e4);if(t<1)return"now";if(t<60)return`${String(t)} min`;const n=Math.floor(t/60);return n<24?`${String(n)} h`:`${String(Math.floor(n/24))} d`}const cm=3,F5=3,B5=new Set(["nap","snack","coffee","visit","report"]),lm=new Set(["main","mainidle"]);function G5(e){const t=e.act.k;return e.from===null?t==="starting":B5.has(t)||lm.has(t)&&lm.has(e.from)?!1:t===e.from?t==="landing"&&e.act.rank===1:!0}function H5(e,t){switch(e.k){case"starting":return gt.ev_started;case"work":case"main":return gt.working;case"hot":return gt.ev_running_hot;case"sleep":return gt.waiting;case"waitagent":return gt.ev_waits_on({agent:e.on??""});case"asks":return gt.asks_you;case"landing":return e.rank===1?gt.landing:gt.ev_in_line;case"done":return t==="landing"?gt.ev_landed:gt.done;case"failed":return gt.failed;case"blocked":return gt.blocked;case"stopped":return gt.ev_stopped;case"mainidle":return gt.idle;case"nap":case"snack":case"coffee":case"visit":case"report":return""}}function V5(e,t=""){switch(e.k){case"work":case"main":return gt.working;case"hot":return gt.state_hot;case"sleep":return t?gt.state_waiting_for({what:t}):gt.waiting;case"waitagent":return gt.state_waits_on({agent:e.on??""});case"nap":case"snack":case"mainidle":return gt.idle;case"asks":return e.urgent?gt.state_urgent:gt.asks_you;case"blocked":return gt.blocked;case"failed":return gt.failed;case"landing":return e.rank===1||e.rank==null?gt.landing:gt.state_in_line({nth:U5(e.rank)});case"done":return gt.done;case"stopped":return gt.state_stopped;case"starting":return gt.state_starting;case"coffee":case"visit":case"report":return gt.working}}function k5(e){return{drop_in:gt.trick_drop_in,pump:gt.trick_pump,rock_to_fakie:gt.trick_rock_to_fakie,axle_stall:gt.trick_axle_stall,fs_180:gt.trick_fs_180,bs_180:gt.trick_bs_180,ollie:gt.trick_ollie,kickflip:gt.trick_kickflip,heelflip:gt.trick_heelflip,shove_it:gt.trick_shove_it,tre_flip:gt.trick_tre_flip,fifty:gt.trick_fifty,five_o:gt.trick_five_o,boardslide:gt.trick_boardslide,nosegrind:gt.trick_nosegrind,manual:gt.trick_manual,no_comply:gt.trick_no_comply,carve:gt.trick_carve,fs_air:gt.trick_fs_air,nine:gt.trick_nine}[e]}function W5(e){return e.k==="asks"?"asks":e.k==="failed"?"failed":null}function X5(e,t){const n=e.filter(a=>a.pose.seg.t<=t&&G5(a.pose.seg)).map(a=>({name:a.name,at:a.pose.seg.t})).sort((a,o)=>o.at-a.at||(a.name<o.name?-1:a.name>o.name?1:0)),i=Array.from({length:F5},()=>-1/0),s=new Set;for(const a of n){let o=0;for(let c=1;c<i.length;c++)(i[c]??0)<(i[o]??0)&&(o=c);const r=Math.max(a.at,i[o]??-1/0);i[o]=r+cm,r<=t&&t<r+cm&&s.add(a.name)}return s}const $5=(e,t)=>{const n=new Map(t.agents.map(a=>[a.name,a])),i=X5(e,t.t),s=new Map;for(const a of e){const{act:o,from:r}=a.pose.seg,c=W5(o),l=(f,u,h="")=>{s.set(a.name,{name:a.name,mode:f,words:u,title:h,pill:c})},d=t.follow===a.name?tE(a.name,a.pose,t.park):null;if(t.hover===a.name){const f=n.get(a.name),u=a.pose.seg.pastime&&f?gt.state_skating({dur:O5(t.t*1e3-f.since_ms)}):V5(o,f?.watching[0]?.what??"");l("hover",u,f?.title??"")}else i.has(a.name)?l("event",H5(o,r)):d!==null?l("egg",k5(d)):t.eggs?.has(a.name)===!0?l("egg",t.eggs.get(a.name)??""):t.held||a.pose.moving&&!a.main?l("name",""):c&&l("pill","")}return s},ea=18e8;function $n(e){const t=(e-ea)%qs;return t<0?t+qs:t}const Ml=e=>Math.floor((e-ea)/qs);function M0(e,t){let n=null;for(const[i,s]of e.life)i<=t&&(n=s);return n??e.life[e.life.length-1]?.[1]??{k:"gone"}}function Hg(e){return{jobs_done:Jo[e.stage]??0,days_used:jd[Math.min(jd.length-1,Math.floor(e.stage/2))]??0,artifacts_made:e.stage*12}}const Qd=ea*1e3;function q5(e,t){const n={name:e.name,main:e.main===!0,status:"idle",phase:null,archived:!1,title:"",purpose:"",since_ms:Qd,waits:0,dir:e.name,watching:[],waiting_on:null,turn_ms:null,place_id:e.main===!0?"":`wt:${e.name}`},i=s=>({...n,...s});switch(t.k){case"work":return i({status:"working",...t.doing?{doing:{kind:t.doing,since_ms:Qd}}:{}});case"main":return i({status:"working"});case"sleep":return i({status:"waiting",watching:[{id:1,kind:"bg",what:"bench",since_ms:Qd,resumes:!0}]});case"asks":return i({status:"waiting",waits:1,waiting_on:{who:"you"}});case"failed":return i({status:"failed"});case"wait":return i({status:"waiting",waiting_on:{who:"agent",name:t.on}});case"done":return i({status:"done"});default:return n}}function Vg(e,t){const n=[],i=[],s=[];for(const a of e.bims){const o=M0(a,t),r=q5(a,o);i.push(r),o.k!=="gone"&&(n.push(r),o.k==="landing"&&s.push({id:`wt:${a.name}`,branch:`sb/${a.name}`,agents:[a.name],landing:o.rank}))}return{snap:{agents:n,cards:[],places:s},agents:i}}function Y5(e,t){return e.bims.map(n=>`${n.name}:${JSON.stringify(M0(n,t))}`).join("|")}function Z5(e,t){const n=new Map(e.bims.map(i=>[i.name,i]));return(i,s)=>{const a=new Map(B3(i,s));for(const[o,r]of a){if(r.k!=="nap"&&r.k!=="snack")continue;const c=n.get(o);if(!c)continue;const l=M0(c,t(s)),d=l.k==="snack"?{k:"snack",at:"island",key:l.trip,fruit:l.fruit}:{k:"nap",at:"lounge"};a.set(o,d)}return a}}function kg(e,t){const n={};for(const i of r5)i.office!==e||t<i.at||t>=i.at+i.dur||(n[i.bim]={kind:i.kind,since:t-i.at});return{bims:n}}function K5(e,t,n){const i=[];if(n<=t)return i;for(let s=Ml(t);s<=Ml(n);s++)for(const a of Og){if(a.office!==e)continue;const o=ea+s*qs+a.at;o<=t||o>n||i.push({kind:"message",from:a.from==="you"?{who:"you"}:{who:"agent",name:a.from},to:{who:"agent",name:a.to},mode:"queued",expectsReply:!1,t:o})}return i}function J5(e){const t=Zo.find(i=>i.id===e),n=new Set;for(const i of t?.bims??[])for(const[s]of i.life)n.add(s);for(const i of Og)i.office===e&&n.add(i.at);return[...n].sort((i,s)=>i-s)}const Q5=1;function j5(e,t,n){if(n<=t)return[];const i=new Set,s=J5(e);for(let a=Ml(t);a<=Ml(n);a++){const o=ea+a*qs;for(const r of s){const c=o+r;c>t&&c<=n&&i.add(c)}for(let r=0;r<qs;r+=Q5){const c=o+r;c>t&&c<=n&&i.add(c)}}return[...i].sort((a,o)=>a-o)}const tR=201,eR=ea-tR,nR=Iz(new Date(2026,9,14,11,0,0));function y0(e,t,n,i){return{t,local:nR,night:n,reduced:i,forced:i?{bims:{}}:kg(e,$n(t))}}function Wg(e,t,n=!1){const i=Y5(e.cast,$n(t));if(i===e.sig&&!n)return;e.sig=i;const{snap:s,agents:a}=Vg(e.cast,$n(t));e.driver.rows(s,a,e.cast.map)}function iR(e,t){const n=o5({activities:Z5(e,$n),layoutOf:Rg,newTimeline:Jz,labelsOf:$5}),i={cast:e,driver:n,sig:"",at:t};return Wg(i,t),n.grow(mm(Hg(e)),t),n.step(y0(e.id,t,!1,!1),$a),i}const sR=(e=eR)=>Zo.map(t=>iR(t,e));function dm(e,t,n,i){if(t<=e.at)return;const s=K5(e.cast.id,e.at,t);for(const a of j5(e.cast.id,e.at,t)){Wg(e,a,!0);for(const o of s)o.t===a&&e.driver.event(o);e.driver.step(y0(e.cast.id,a,n,i),$a)}e.at=t}const aR=(e,t,n,i=$a)=>e.driver.step(y0(e.cast.id,e.at,t,n),i),oR={light:"#f2ede2",dark:"#171513"},rR=1e3/30,cR=1.25,fm={x0:.3,x1:.85},lR=2,um=.9,dR=2.6;function fR(e,t={}){let n=t.theme==="dark";const i=()=>n,s=t.reduced===!0,a=t.on??(()=>{}),o=t.ground??oR,r=document.createElement("canvas");r.className="bh-canvas",e.append(r);let c=!s&&t.startT===void 0;const l=T5();let d=-1,f=!1;const u=iA(r,{allLive:!0,box:!0,sky:{day:o.light,night:o.dark},nightLift:cR,entry:c}),h=N5(e),m=Zo.map(Q=>({id:Q.id,office:Rg(Vg(Q,0).agents,Q.map),grow:mm(Hg(Q))}));u.setTown(m);const _=sR();let x=ea+Math.max(0,t.startT??0);for(const Q of _)dm(Q,x,i(),s);const p=t.probe===!0?{frames:0,ms:[],T:0,hands:"film",shot:0,cam:{zoom:1,u:.5,v:.5},phases:[],offices:[]}:null;p&&(window.__bimsHero=p);const v=new Map,y=()=>u.townFit(),g=(Q,ut,R,S)=>{const X=ts(Q,{x:ut,y:R,z:S});return{u:X.x/Q.widthPx,v:X.y/Q.heightPx}},b=Q=>{const ut=y(),R=u.placedOf(Q),S=v.get(Q)?.office;if(!ut||!R||!S)return null;const X=bl(S),K=[X.x0,X.x1].flatMap(tt=>[X.z0,X.z1].flatMap(_t=>[0,dR].map(St=>g(ut,R.x+tt,St,R.z+_t))));return{u0:Math.min(...K.map(tt=>tt.u)),u1:Math.max(...K.map(tt=>tt.u)),v0:Math.min(...K.map(tt=>tt.v)),v1:Math.max(...K.map(tt=>tt.v))}},w=Q=>{const ut=y(),R=u.placedOf(Q),S=v.get(Q)?.office.park;if(!ut||!R||!S||S.spots.length===0)return null;const X=S.spots.map(tt=>g(ut,R.x+tt.x,0,R.z+tt.z)),K=.01;return{u0:Math.min(...X.map(tt=>tt.u))-K,u1:Math.max(...X.map(tt=>tt.u))+K,v0:Math.min(...X.map(tt=>tt.v))-K,v1:Math.max(...X.map(tt=>tt.v))+K}},T={town(){const Q=Zo.flatMap(ut=>[b(ut.id),w(ut.id)]).filter(ut=>ut!==null);return Q.length===0?null:{u0:Math.min(...Q.map(ut=>ut.u0)),u1:Math.max(...Q.map(ut=>ut.u1)),v0:Math.min(...Q.map(ut=>ut.v0)),v1:Math.max(...Q.map(ut=>ut.v1))}},office:b,spot(Q,ut){const R=y(),S=u.placedOf(Q),X=v.get(Q)?.office;if(!R||!S||!X)return null;const K=ut==="island"?X.islandSpots:ut==="lounge"?X.lounge:ut==="park"?X.park?.spots??[]:[X.mainDesk];if(K.length===0)return null;const tt=K.reduce((St,ct)=>St+ct.x,0)/K.length,_t=K.reduce((St,ct)=>St+ct.z,0)/K.length;return g(R,S.x+tt,um,S.z+_t)},bim(Q,ut){const R=y(),S=u.placedOf(Q),X=v.get(Q)?.frames.find(K=>K.name===ut);return!R||!S||!X?null:g(R,S.x+X.pose.x,um,S.z+X.pose.z)}},M=Q=>{if(Q===null)return null;const ut=b(Q);return ut?Mu(ut,Fg).zoom:null};let E=s?{k:"visitor",last:1/0,follow:null}:{k:"film"},A=-1,C=null,I=ya({zoom:1,u:.5,v:.5}),U=null,P=!1,O=-1/0;const V=()=>performance.now()/1e3,N=Q=>{const ut=E.k;E=Q,ut!==Q.k&&(e.dataset.hands=Q.k,a(Q.k==="film"?"film":"control"))},F=()=>{const Q=Mn[0];return Q?bo(Q,T):null};function L(Q){const ut=$n(x),R=So(Mn,ut),S=Mn[R];if(!S)return;if(R!==A){const tt=A>=0?Mn[A]??null:null,_t=g5(tt,S),St=_t.across?Math.min(M(_l(tt?.subject??{k:"town"}))??1,M(_l(S.subject))??1):null;A>=0&&(C={from:I.cam,start:x,dur:_t.dur,rise:St,to:null}),A=R}const X=bo(S,T),K=X===null?I.cam:S.size==="wide"?_5(X,ut-(S.at-vu)):X;B(K,Q)}function B(Q,ut){if(C!==null){const R=s?1:(x-C.start)/C.dur,S=C.to?.()??Q;I=ya(nm(C.from,S,Math.min(1,R),C.rise)),R>=1&&(C=null);return}I=s?ya(Q):M5(I,Q,ut)}function $(Q,ut){if(E.k!=="visitor")return;if(!s&&y5(E,ut,P)){J();return}const R=E.follow;if(R!==null){const S=T.bim(R.office,R.name);S!==null&&B(yu(S,I.cam.zoom,.5,.5),Q);return}C!==null&&B(I.cam,Q)}function J(){N({k:"film"});const Q=Mn[So(Mn,$n(x))];A=So(Mn,$n(x)),C=Q?{from:I.cam,start:x,dur:tm,rise:null,to:()=>bo(Q,T)}:null,xt()}const st=C5(e,{cam:()=>I.cam,take(Q,ut){C=null,I=ya(Hi(Q)),O=V(),N({k:"visitor",last:V(),follow:ut??null}),xt()},pick:(Q,ut)=>u.pickBim(Q,ut),hover(Q){const ut=Q?.id===U?.id&&Q?.name===U?.name;U=Q,E.k==="visitor"&&Q!==null&&N({...E,last:V()}),ut||xt()},inside(Q){P=Q,E.k==="visitor"&&N({...E,last:V()})},follow(Q){O=V(),N({k:"visitor",last:V(),follow:Q}),xt()},wide(){const Q=F();Q!==null&&(C={from:I.cam,start:x,dur:s?0:tm,rise:null,to:null},N({k:"visitor",last:V(),follow:null}),C.to=()=>Q,xt())}});let Tt=0,H=0,et=!1,W=0,k=!1;const at=()=>!k&&et&&!document.hidden,mt=p!==null&&t.manual===!0;let rt=1;p&&mt&&(p.step=Q=>{rt+=Q,Mt(rt)});function Mt(Q){if(Tt=0,!at())return;const ut=performance.now(),R=H===0?0:Math.min(.1,Math.max(0,(Q-H)/1e3));H=Q,c&&d<0&&(d=Q);const S=c?t.entryAt??Q-d:ve.done;!s&&S>=ve.done&&(x+=R);const X=i();for(const dt of _){dm(dt,x,X,s);const Et=aR(dt,X,s,j(dt));Et&&v.set(dt.cast.id,Et)}if(c&&E.k==="film"?Kt(S):E.k==="film"?L(R):$(R,V()),!c&&(p?.frames===0||u.shownFit()===null)){const dt=Mn[So(Mn,$n(x))],Et=E.k==="film"&&dt!==void 0?bo(dt,T):F();Et&&(I=ya(Et))}u.setCam(I.cam);const K=performance.now(),tt=u.liveIds();for(const dt of c?tt.slice(0,W):tt){const Et=v.get(dt);Et&&u.live(dt,Et,x)}c&&lt(S,tt.length);const _t=performance.now();u.frame(X);const St=performance.now();c&&(h.root.style.opacity=String(A5(S))),Pt();const ct=performance.now();if(c&&S>=ve.done&&(c=!1,h.root.style.opacity=""),W++,e.dataset.ready!=="true"&&(e.dataset.ready="true",a("ready")),p){p.frames++,p.ms=[...p.ms.slice(-299),performance.now()-ut],p.phases=[...p.phases.slice(-299),{brain:K-ut,pose:_t-K,draw:St-_t,words:ct-St}],p.T=$n(x),p.entry=S,p.hands=E.k,p.shot=A,p.cam=I.cam;const dt=new Set(u.liveIds());p.offices=Zo.map(Et=>({id:Et.id,live:dt.has(Et.id),bims:(v.get(Et.id)?.played??[]).map(At=>({name:At.name,k:At.pose.seg.act.k,x:At.pose.x,z:At.pose.z,head:u.headOf(Et.id,At.name)!==null}))}))}!mt&&(!s||C!==null)&&pt()}function Kt(Q){const ut=F();if(ut===null)return;const R=$n(x);A=So(Mn,R);const S=Mn[A],X=S?bo(S,T):null,K=(Q-ve.cam.from)/(ve.cam.to-ve.cam.from);I=ya(X===null||K<=0?ut:nm(ut,X,Math.min(1,K),null))}function lt(Q,ut){const R=u.entry.parts();if(R!==null){if(!f&&R.offices.length>=ut&&(f=!0,u.entry.warm()),Q<ve.built){l.apply(Q,R,u.shownFit()?.scale??.05);return}(R.scape!==null||R.offices.some(S=>S.world!==null))&&(l.finish(R),u.entry.settle())}}function pt(){if(c||C!==null||V()-O<1){Tt=requestAnimationFrame(Mt);return}const ut=H,R=S=>{if(Tt=0,!!at()){if(S-ut<rR-2&&C===null&&V()-O>=1){Tt=requestAnimationFrame(R);return}Mt(S)}};Tt=requestAnimationFrame(R)}function xt(){mt||Tt!==0||!at()||(Tt=requestAnimationFrame(Mt))}function yt(){if(U!==null)return U;if(E.k==="visitor")return E.follow?{id:E.follow.office,name:E.follow.name}:null;const Q=Mn[A];return!Q||Q.subject.k!=="bim"||Q.size!=="follow"&&Q.size!=="close"&&Q.size!=="closest"?null:{id:Q.subject.office,name:Q.subject.name}}function j(Q){const ut=yt();return ut===null||ut.id!==Q.cast.id?$a:{...$a,hover:U?.id===Q.cast.id?U.name:null,follow:ut.name}}function wt(){const Q=new Set,ut=yt();ut!==null&&Q.add(`${ut.id}\0${ut.name}`);const R=E.k==="film"?Mn[A]:void 0;if(R?.subject.k==="pair")for(const S of R.subject.names)Q.add(`${R.subject.office}\0${S}`);return Q}function Pt(){const Q=yt(),ut=wt(),R=Math.max(1,e.clientWidth),S=At=>At!==null&&At.x/R>=fm.x0&&At.x/R<=fm.x1,X=!(E.k==="film"&&C!==null),K=[],tt=new Map,_t=[],St=[],ct=$n(x);for(const At of u.liveIds()){const zt=v.get(At);if(!zt)continue;const Rt=kg(At,ct).bims??{};for(const Ot of zt.labels.values()){const $t=`${At}\0${Ot.name}`,Jt=u.headOf(At,Ot.name);if(Ot.mode==="egg"){const Z={...Ot,words:I5(Ot.words)},Lt=Rt[Ot.name]?.since??1/0;ut.has($t)?S(Jt)&&_t.push({key:$t,label:Z,head:Jt,rank:0}):Lt<lR&&St.push({key:$t,label:Z,head:Jt,since:Lt,near:Q?.id===At?0:1});continue}(Ot.mode==="pill"||Ot.pill!==null)&&K.push({key:$t,label:{...Ot,mode:"pill",words:""},head:Jt,rank:2})}if(!s)for(const Ot of zz(zt.frames)){const $t=u.headOf(At,Ot);$t&&tt.set(`${At}/${Ot}`,$t)}}if(Q!==null&&X){const At=`${Q.id}\0${Q.name}`,zt=u.headOf(Q.id,Q.name);if(!_t.some(Rt=>Rt.key===At)&&S(zt)&&v.get(Q.id)?.frames.some(Rt=>Rt.name===Q.name)===!0){const Rt=K.find(Ot=>Ot.key===At)?.label.pill??null;_t.push({key:At,label:{name:Q.name,mode:"name",words:"",title:"",pill:Rt},head:zt,rank:0})}}const dt=_t.length>0?void 0:St.filter(At=>At.head!==null).sort((At,zt)=>At.near-zt.near||At.since-zt.since)[0];dt!==void 0&&_t.push({key:dt.key,label:dt.label,head:dt.head,rank:1});const Et=new Set(_t.map(At=>At.key));h.labels([...K.filter(At=>!Et.has(At.key)),..._t]),h.zzz(tt)}const bt=new ResizeObserver(()=>{const Q=e.clientWidth,ut=e.clientHeight;Q<=0||ut<=0||(u.setSize(Q,ut),xt())});bt.observe(e);const Zt=new IntersectionObserver(Q=>{et=Q.some(ut=>ut.isIntersecting),H=0,xt()});Zt.observe(e);const G=()=>{H=0,xt()};return document.addEventListener("visibilitychange",G),u.onLost(()=>{e.dataset.lost="true",a("lost")}),{setTheme(Q){n=Q==="dark",e.dataset.theme=Q,xt()},resumeFilm(){s||J()},zoomBy(Q){st.zoomBy(Q)},dispose(){k=!0,Tt!==0&&cancelAnimationFrame(Tt),bt.disconnect(),Zt.disconnect(),document.removeEventListener("visibilitychange",G),st.dispose(),h.dispose(),u.dispose(),r.remove(),p&&delete window.__bimsHero}}}export{fR as playFilm};
