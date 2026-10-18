const pt={ev_started:"started",working:"working",ev_running_hot:"running hot",waiting:"waiting",ev_waits_on:e=>"waits on "+String(e.agent),asks_you:"asks you",landing:"landing",ev_in_line:"waits to land",ev_landed:"landed",done:"done",failed:"failed",blocked:"blocked",ev_stopped:"stopped",idle:"idle",state_hot:"working · running hot",state_waiting_for:e=>"waiting · for "+String(e.what),state_waits_on:e=>"waiting on "+String(e.agent),state_urgent:"asks you · a tool waits for your yes",state_in_line:e=>"waits to land · "+String(e.nth),state_stopped:"stopped by you",state_starting:"starting",pill_asks_tip:e=>String(e.agent)+" asks you. click opens it",pill_failed_tip:e=>String(e.agent)+" failed. click opens it",view_bims_tip:"the agents in their office, above the list",cube_open_tip:"show the bims: your agents in their office",cube_close_tip:"hide the office",cube_label:"the bims",width_narrow:"320",width_wide:"wide",width_narrow_tip:"the bar at 320 px, the office fit to it",width_wide_tip:"the bar at 640 px while the office shows",lost:"can't draw the office here",fit:"fit",fit_tip:"back to the whole office",held_left_out:e=>e.n===1?"+"+String(e.n)+" name · hover a bim":"+"+String(e.n)+" names · hover a bim",stage_1:"a plant and a deck chair",stage_2:"the kitchen island",stage_3:"the lounge",stage_4:"the whiteboard",stage_5:"the mural and the boombox",stage_6:"a longer island",stage_7:"the terrace",stage_8:"trees all round",stage_9:"the skate ramp",stage_10:"the fountain",stage_11:"the arcade cabinet",stage_12:"the pond",stage_13:"the balloon",stage_14:"main's golden statue",stage_fruit:"a fruit bowl and a tree",stage_more_fruit:"more fruit and flowers",stage_kyoto_1:"a bonsai",stage_kyoto_2:"a bento and a maple",stage_kyoto_3:"the zabuton",stage_kyoto_4:"the slate",stage_kyoto_5:"the wave and the wind bell",stage_kyoto_6:"the matcha set",stage_kyoto_7:"the paper umbrella",stage_kyoto_8:"maples all round",stage_kyoto_9:"the go board",stage_kyoto_10:"the shishi-odoshi",stage_kyoto_11:"the arcade cabinet",stage_kyoto_12:"the koi pond",stage_kyoto_13:"the koinobori",stage_kyoto_14:"the golden maneki-neko",stage_riad_1:"a pot of mint",stage_riad_2:"the tea tray",stage_riad_3:"the poufs",stage_riad_4:"the slate",stage_riad_5:"the Berber rug and the darbouka",stage_riad_6:"a tajine and jasmine",stage_riad_7:"the awning",stage_riad_8:"the four orange trees",stage_riad_9:"the draughts table",stage_riad_10:"the fountain's second tier",stage_riad_11:"the hammam",stage_riad_12:"the zellige basin",stage_riad_13:"the balloon over the Atlas",stage_riad_14:"the golden lantern",stage_nordic_1:"a fern",stage_nordic_2:"kanelbullar and a birch",stage_nordic_3:"the sheepskins",stage_nordic_4:"the blackboard",stage_nordic_5:"the rya and the record player",stage_nordic_6:"blueberries and coffee",stage_nordic_7:"the campfire",stage_nordic_8:"firs all round",stage_nordic_9:"the kubb set",stage_nordic_10:"the hot tub",stage_nordic_11:"the sauna's porch",stage_nordic_12:"the lake and its jetty",stage_nordic_13:"the midsummer pole",stage_nordic_14:"the golden Dala horse",grow_new:e=>"new: "+String(e.thing),grow_tip:e=>e.n===1?"level "+String(e.level)+" · "+String(e.n)+" job done · next: "+String(e.thing)+" at "+String(e.at):"level "+String(e.level)+" · "+String(e.n)+" jobs done · next: "+String(e.thing)+" at "+String(e.at),grow_tip_top:e=>e.n===1?"level "+String(e.level)+" · "+String(e.n)+" job done":"level "+String(e.level)+" · "+String(e.n)+" jobs done",map_loft:"Loft",map_loft_mood:"the kitchen island in the middle, bean bags at the back",map_greenhouse:"Greenhouse",map_greenhouse_mood:"desks in a ring round a tree, glass walls",map_campus:"Campus",map_campus_mood:"pods of four, a long counter, steps to sit on",map_workshop:"Workshop",map_workshop_mood:"a garage: a workbench, ping-pong, the door rolled up",map_kyoto:"Kyoto",map_kyoto_mood:"low tables on tatami round a small garden",map_riad:"Riad",map_riad_mood:"galleries round a patio and its fountain",map_nordic:"Nordic",map_nordic_mood:"one long wooden table, a stove, a sauna outside",map_patio:"Patio",map_patio_mood:"coloured walls round a patio, hammocks for naps",map_haveli:"Haveli",map_haveli_mood:"a courtyard with arcades, a chai stall, a swing",map_tropical:"Tropical",map_tropical_mood:"desks on a curve, a juice bar, hammocks",map_cyclades:"Cyclades",map_cyclades_mood:"little white cubes up steps, blue tables",map_sahel:"Sahel",map_sahel_mood:"a shade hangar round a yard and its baobab",map_california:"California",map_california_mood:"a stucco office and a concrete skatepark",map_pick_tip:e=>"draw this project's office as the "+String(e.map),map_current_tip:e=>"this project's office is the "+String(e.map)+" now",town_label:"the town: one office per project",town_sign_tip:e=>"look inside "+String(e.project),town_sign_label:e=>String(e.project)+": "+String(e.at_work)+" working, "+String(e.asks)+" asking you",town_open:"open",town_open_tip:e=>"open "+String(e.project),town_back:"town",town_back_tip:"back to the whole town",state_skating:e=>"idle "+String(e.dur)+" · skating",trick_drop_in:"drop in",trick_pump:"pumps",trick_rock_to_fakie:"rock to fakie",trick_axle_stall:"axle stall",trick_fs_180:"frontside 180",trick_bs_180:"backside 180",trick_ollie:"ollie",trick_kickflip:"kickflip",trick_heelflip:"heelflip",trick_shove_it:"pop shove-it",trick_tre_flip:"360 flip",trick_fifty:"50-50",trick_five_o:"5-0",trick_boardslide:"boardslide",trick_nosegrind:"nosegrind",trick_manual:"manual",trick_no_comply:"no comply",trick_carve:"carve",trick_fs_air:"frontside air",trick_nine:"900"},Jo=[0,1,3,6,10,15,25,40,60,100,150,250,400,600,1e3];Jo.length-1;const jd=[1,3,7,14,30,60,100,365],Jg=10,Qg=30,jg=500,P0=[0,0,0,2,2,4,4,4,8];function yl(e){return P0[Math.max(0,Math.min(e,P0.length-1))]??0}const t1=.7,Rc=3,um=3,os={stage:0,garden:0,frames:0,golden:!1,building:!1,jobs:0};function hm(e,t){let n=0;for(const i of t)e>=i&&n++;return n}function e1(e){return Math.max(0,hm(e,Jo)-1)}function pm(e){if(!e)return os;const t=e.jobs_done,n=e.artifacts_made,i=e1(t),s=Jo[i+1],a=Jo[i],o=s!==void 0&&a!==void 0&&t>=a+t1*(s-a);return{stage:i,garden:hm(e.days_used,jd),frames:Math.min(Qg,Math.floor(n/Jg)),golden:n>=jg,building:o,jobs:t}}function n1(e,t){return!e||t.stage<=e.stage?null:t.stage}const L0=[0,.15,.3,.45,.6,.8,1,1.2,1.4],i1=1.7,Nr=1.5;function s1(e){return(L0[Math.min(e.garden,L0.length-1)]??0)+(e.stage>=10?i1:0)}function No(e){return`${e.stage}/${e.garden}/${e.frames}/${e.golden?1:0}/${e.building?1:0}`}const Ga=Math.PI/4,Rs=Math.PI/6,Ur=60,I0=.25;function bl(e){return{x0:e.x0-1.2,x1:e.x0+e.W+1.2,z0:-1.5,z1:e.D+4.8,yLow:-1.35,yHigh:2.5}}function mm(e,t){const n=bl(e),i=s1(t);return{x0:n.x0-i,x1:n.x1+i,z0:n.z0-i/2,z1:n.z1+i/2,yLow:n.yLow,yHigh:t.stage>=13?3:n.yHigh}}function a1(e){const t=bl(e);return{...t,x0:t.x0-Nr,x1:t.x1+Nr,z0:t.z0-Nr/2,z1:t.z1+Nr/2}}const Pn={x:Math.cos(Ga),y:0,z:-Math.sin(Ga)},Pa={x:-Math.sin(Ga)*Math.sin(Rs),y:Math.cos(Rs),z:-Math.cos(Ga)*Math.sin(Rs)},La={x:Math.sin(Ga)*Math.cos(Rs),y:Math.sin(Rs),z:Math.cos(Ga)*Math.cos(Rs)},Qo=(e,t)=>e.x*t.x+e.y*t.y+e.z*t.z;function Su(e,t,n){const i={x:(e.x0+e.x1)/2,y:0,z:(e.z0+e.z1)/2};let s=1/0,a=-1/0,o=1/0,r=-1/0;for(const p of[e.x0,e.x1])for(const v of[e.yLow,e.yHigh])for(const y of[e.z0,e.z1]){const g={x:p-i.x,y:v-i.y,z:y-i.z},b=Qo(g,Pn),S=Qo(g,Pa);s=Math.min(s,b),a=Math.max(a,b),o=Math.min(o,S),r=Math.max(r,S)}const c=Math.max(1,t),l=a-s+2*I0,d=r-o+2*I0;let f=l/c,u=Math.ceil(d/f);n>0&&u>n&&(u=Math.floor(n),f=d/u);const h=(s+a)/2,m=(o+r)/2,_=c*f/2,x=u*f/2;return{target:i,left:h-_,right:h+_,top:m+x,bottom:m-x,scale:f,widthPx:c,heightPx:u}}function o1(e,t,n){const i=Math.max(1,t),s=Math.max(1,n),a=Su(e,i,s),o=(a.left+a.right)/2,r=(a.top+a.bottom)/2;return{...a,left:o-i*a.scale/2,right:o+i*a.scale/2,top:r+s*a.scale/2,bottom:r-s*a.scale/2,widthPx:i,heightPx:s}}function r1(e,t){const n=e.right-e.left,i=e.top-e.bottom,s=e.left+t.u*n,a=e.top-t.v*i,o=n/(2*t.zoom),r=i/(2*t.zoom);return{...e,left:s-o,right:s+o,top:a+r,bottom:a-r,scale:e.scale/t.zoom}}function Qi(e,t){const n={x:t.x-e.target.x,y:t.y-e.target.y,z:t.z-e.target.z};return{x:(Qo(n,Pn)-e.left)/e.scale,y:(e.top-Qo(n,Pa))/e.scale}}function c1(e,t,n=.6){const i={x:t.x-e.target.x,y:-e.target.y,z:t.z-e.target.z},s=Qo(i,Pa);return Math.max(2,(e.top-s)/Math.cos(Rs)+n)}const wu="186",l1=0,D0=1,d1=2,Uo=1,f1=2,Eo=3,Ds=0,fn=1,Ai=2,Ni=0,Oo=1,N0=2,U0=3,O0=4,u1=5,ba=100,h1=101,p1=102,m1=103,x1=104,g1=200,_1=201,v1=202,M1=203,xm=204,gm=205,y1=206,b1=207,S1=208,w1=209,E1=210,T1=211,A1=212,z1=213,R1=214,tf=0,ef=1,nf=2,jo=3,sf=4,af=5,of=6,rf=7,Eu=0,C1=1,P1=2,li=0,_m=1,vm=2,Mm=3,ym=4,bm=5,Sm=6,wm=7,Em=300,Ns=301,Ha=302,Xl=303,$l=304,Sl=306,tr=1e3,zi=1001,cf=1002,Ve=1003,L1=1004,Or=1005,We=1006,ql=1007,bs=1008,Sn=1009,Tm=1010,Am=1011,er=1012,Tu=1013,fi=1014,oi=1015,ui=1016,Au=1017,zu=1018,nr=1020,zm=35902,Rm=35899,Cm=1021,Pm=1022,Zn=1023,Fi=1026,Ss=1027,Lm=1028,Ru=1029,Us=1030,Cu=1031,Pu=1033,Cc=33776,Pc=33777,Lc=33778,Ic=33779,lf=35840,df=35841,ff=35842,uf=35843,hf=36196,pf=37492,mf=37496,xf=37488,gf=37489,kc=37490,_f=37491,vf=37808,Mf=37809,yf=37810,bf=37811,Sf=37812,wf=37813,Ef=37814,Tf=37815,Af=37816,zf=37817,Rf=37818,Cf=37819,Pf=37820,Lf=37821,If=36492,Df=36494,Nf=36495,Uf=36283,Of=36284,Xc=36285,Ff=36286,I1=3200,$c=0,D1=1,is="",ln="srgb",qc="srgb-linear",Yc="linear",pe="srgb",Yl=7680,N1=519,U1=512,O1=513,F1=514,Lu=515,B1=516,G1=517,Iu=518,H1=519,V1=35044,F0="300 es",ri=2e3,ir=2001;function W1(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function Zc(e){return document.createElementNS("http://www.w3.org/1999/xhtml",e)}function k1(){const e=Zc("canvas");return e.style.display="block",e}const B0={};function G0(...e){const t="THREE."+e.shift();console.log(t,...e)}function Im(e){const t=e[0];if(typeof t=="string"&&t.startsWith("TSL:")){const n=e[1];n&&n.isStackTrace?e[0]+=" "+n.getLocation():e[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return e}function Jt(...e){e=Im(e);const t="THREE."+e.shift();{const n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function ce(...e){e=Im(e);const t="THREE."+e.shift();{const n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function Ia(...e){const t=e.join(" ");t in B0||(B0[t]=!0,Jt(...e))}function X1(e,t,n){return new Promise(function(i,s){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:s();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:i()}}setTimeout(a,n)})}const $1={[tf]:ef,[nf]:of,[sf]:rf,[jo]:af,[ef]:tf,[of]:nf,[rf]:sf,[af]:jo};class Ys{addEventListener(t,n){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(n)===-1&&i[t].push(n)}hasEventListener(t,n){const i=this._listeners;return i===void 0?!1:i[t]!==void 0&&i[t].indexOf(n)!==-1}removeEventListener(t,n){const i=this._listeners;if(i===void 0)return;const s=i[t];if(s!==void 0){const a=s.indexOf(n);a!==-1&&s.splice(a,1)}}dispatchEvent(t){const n=this._listeners;if(n===void 0)return;const i=n[t.type];if(i!==void 0){t.target=this;const s=i.slice(0);for(let a=0,o=s.length;a<o;a++)s[a].call(this,t);t.target=null}}}const $e=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Zl=Math.PI/180,Bf=180/Math.PI;function qa(){const e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return($e[e&255]+$e[e>>8&255]+$e[e>>16&255]+$e[e>>24&255]+"-"+$e[t&255]+$e[t>>8&255]+"-"+$e[t>>16&15|64]+$e[t>>24&255]+"-"+$e[n&63|128]+$e[n>>8&255]+"-"+$e[n>>16&255]+$e[n>>24&255]+$e[i&255]+$e[i>>8&255]+$e[i>>16&255]+$e[i>>24&255]).toLowerCase()}function ae(e,t,n){return Math.max(t,Math.min(n,e))}function q1(e,t){return(e%t+t)%t}function Kl(e,t,n){return(1-n)*e+n*t}function ro(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:case Uint8ClampedArray:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function cn(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}class Ct{static{Ct.prototype.isVector2=!0}constructor(t=0,n=0){this.x=t,this.y=n}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,n){return this.x=t,this.y=n,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const n=this.x,i=this.y,s=t.elements;return this.x=s[0]*n+s[3]*i+s[6],this.y=s[1]*n+s[4]*i+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,n){return this.x=ae(this.x,t.x,n.x),this.y=ae(this.y,t.y,n.y),this}clampScalar(t,n){return this.x=ae(this.x,t,n),this.y=ae(this.y,t,n),this}clampLength(t,n){const i=this.length();return this.divideScalar(i||1).multiplyScalar(ae(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const n=Math.sqrt(this.lengthSq()*t.lengthSq());if(n===0)return Math.PI/2;const i=this.dot(t)/n;return Math.acos(ae(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const n=this.x-t.x,i=this.y-t.y;return n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this}rotateAround(t,n){const i=Math.cos(n),s=Math.sin(n),a=this.x-t.x,o=this.y-t.y;return this.x=a*i-o*s+t.x,this.y=a*s+o*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Ya{constructor(t=0,n=0,i=0,s=1){this.isQuaternion=!0,this._x=t,this._y=n,this._z=i,this._w=s}static slerpFlat(t,n,i,s,a,o,r){let c=i[s+0],l=i[s+1],d=i[s+2],f=i[s+3],u=a[o+0],h=a[o+1],m=a[o+2],_=a[o+3];if(f!==_||c!==u||l!==h||d!==m){let x=c*u+l*h+d*m+f*_;x<0&&(u=-u,h=-h,m=-m,_=-_,x=-x);let p=1-r;if(x<.9995){const v=Math.acos(x),y=Math.sin(v);p=Math.sin(p*v)/y,r=Math.sin(r*v)/y,c=c*p+u*r,l=l*p+h*r,d=d*p+m*r,f=f*p+_*r}else{c=c*p+u*r,l=l*p+h*r,d=d*p+m*r,f=f*p+_*r;const v=1/Math.sqrt(c*c+l*l+d*d+f*f);c*=v,l*=v,d*=v,f*=v}}t[n]=c,t[n+1]=l,t[n+2]=d,t[n+3]=f}static multiplyQuaternionsFlat(t,n,i,s,a,o){const r=i[s],c=i[s+1],l=i[s+2],d=i[s+3],f=a[o],u=a[o+1],h=a[o+2],m=a[o+3];return t[n]=r*m+d*f+c*h-l*u,t[n+1]=c*m+d*u+l*f-r*h,t[n+2]=l*m+d*h+r*u-c*f,t[n+3]=d*m-r*f-c*u-l*h,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,n,i,s){return this._x=t,this._y=n,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,n=!0){const i=t._x,s=t._y,a=t._z,o=t._order,r=Math.cos,c=Math.sin,l=r(i/2),d=r(s/2),f=r(a/2),u=c(i/2),h=c(s/2),m=c(a/2);switch(o){case"XYZ":this._x=u*d*f+l*h*m,this._y=l*h*f-u*d*m,this._z=l*d*m+u*h*f,this._w=l*d*f-u*h*m;break;case"YXZ":this._x=u*d*f+l*h*m,this._y=l*h*f-u*d*m,this._z=l*d*m-u*h*f,this._w=l*d*f+u*h*m;break;case"ZXY":this._x=u*d*f-l*h*m,this._y=l*h*f+u*d*m,this._z=l*d*m+u*h*f,this._w=l*d*f-u*h*m;break;case"ZYX":this._x=u*d*f-l*h*m,this._y=l*h*f+u*d*m,this._z=l*d*m-u*h*f,this._w=l*d*f+u*h*m;break;case"YZX":this._x=u*d*f+l*h*m,this._y=l*h*f+u*d*m,this._z=l*d*m-u*h*f,this._w=l*d*f-u*h*m;break;case"XZY":this._x=u*d*f-l*h*m,this._y=l*h*f-u*d*m,this._z=l*d*m+u*h*f,this._w=l*d*f+u*h*m;break;default:Jt("Quaternion: .setFromEuler() encountered an unknown order: "+o)}return n===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,n){const i=n/2,s=Math.sin(i);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){const n=t.elements,i=n[0],s=n[4],a=n[8],o=n[1],r=n[5],c=n[9],l=n[2],d=n[6],f=n[10],u=i+r+f;if(u>0){const h=.5/Math.sqrt(u+1);this._w=.25/h,this._x=(d-c)*h,this._y=(a-l)*h,this._z=(o-s)*h}else if(i>r&&i>f){const h=2*Math.sqrt(1+i-r-f);this._w=(d-c)/h,this._x=.25*h,this._y=(s+o)/h,this._z=(a+l)/h}else if(r>f){const h=2*Math.sqrt(1+r-i-f);this._w=(a-l)/h,this._x=(s+o)/h,this._y=.25*h,this._z=(c+d)/h}else{const h=2*Math.sqrt(1+f-i-r);this._w=(o-s)/h,this._x=(a+l)/h,this._y=(c+d)/h,this._z=.25*h}return this._onChangeCallback(),this}setFromUnitVectors(t,n){let i=t.dot(n)+1;return i<1e-8?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*n.z-t.z*n.y,this._y=t.z*n.x-t.x*n.z,this._z=t.x*n.y-t.y*n.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(ae(this.dot(t),-1,1)))}rotateTowards(t,n){const i=this.angleTo(t);if(i===0)return this;const s=Math.min(1,n/i);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,n){const i=t._x,s=t._y,a=t._z,o=t._w,r=n._x,c=n._y,l=n._z,d=n._w;return this._x=i*d+o*r+s*l-a*c,this._y=s*d+o*c+a*r-i*l,this._z=a*d+o*l+i*c-s*r,this._w=o*d-i*r-s*c-a*l,this._onChangeCallback(),this}slerp(t,n){let i=t._x,s=t._y,a=t._z,o=t._w,r=this.dot(t);r<0&&(i=-i,s=-s,a=-a,o=-o,r=-r);let c=1-n;if(r<.9995){const l=Math.acos(r),d=Math.sin(l);c=Math.sin(c*l)/d,n=Math.sin(n*l)/d,this._x=this._x*c+i*n,this._y=this._y*c+s*n,this._z=this._z*c+a*n,this._w=this._w*c+o*n,this._onChangeCallback()}else this._x=this._x*c+i*n,this._y=this._y*c+s*n,this._z=this._z*c+a*n,this._w=this._w*c+o*n,this.normalize();return this}slerpQuaternions(t,n,i){return this.copy(t).slerp(n,i)}random(){const t=2*Math.PI*Math.random(),n=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),a=Math.sqrt(i);return this.set(s*Math.sin(t),s*Math.cos(t),a*Math.sin(n),a*Math.cos(n))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,n=0){return this._x=t[n],this._y=t[n+1],this._z=t[n+2],this._w=t[n+3],this._onChangeCallback(),this}toArray(t=[],n=0){return t[n]=this._x,t[n+1]=this._y,t[n+2]=this._z,t[n+3]=this._w,t}fromBufferAttribute(t,n){return this._x=t.getX(n),this._y=t.getY(n),this._z=t.getZ(n),this._w=t.getW(n),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class q{static{q.prototype.isVector3=!0}constructor(t=0,n=0,i=0){this.x=t,this.y=n,this.z=i}set(t,n,i){return i===void 0&&(i=this.z),this.x=t,this.y=n,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this.z=t.z+n.z,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this.z+=t.z*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this.z=t.z-n.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,n){return this.x=t.x*n.x,this.y=t.y*n.y,this.z=t.z*n.z,this}applyEuler(t){return this.applyQuaternion(H0.setFromEuler(t))}applyAxisAngle(t,n){return this.applyQuaternion(H0.setFromAxisAngle(t,n))}applyMatrix3(t){const n=this.x,i=this.y,s=this.z,a=t.elements;return this.x=a[0]*n+a[3]*i+a[6]*s,this.y=a[1]*n+a[4]*i+a[7]*s,this.z=a[2]*n+a[5]*i+a[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const n=this.x,i=this.y,s=this.z,a=t.elements,o=1/(a[3]*n+a[7]*i+a[11]*s+a[15]);return this.x=(a[0]*n+a[4]*i+a[8]*s+a[12])*o,this.y=(a[1]*n+a[5]*i+a[9]*s+a[13])*o,this.z=(a[2]*n+a[6]*i+a[10]*s+a[14])*o,this}applyQuaternion(t){const n=this.x,i=this.y,s=this.z,a=t.x,o=t.y,r=t.z,c=t.w,l=2*(o*s-r*i),d=2*(r*n-a*s),f=2*(a*i-o*n);return this.x=n+c*l+o*f-r*d,this.y=i+c*d+r*l-a*f,this.z=s+c*f+a*d-o*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const n=this.x,i=this.y,s=this.z,a=t.elements;return this.x=a[0]*n+a[4]*i+a[8]*s,this.y=a[1]*n+a[5]*i+a[9]*s,this.z=a[2]*n+a[6]*i+a[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,n){return this.x=ae(this.x,t.x,n.x),this.y=ae(this.y,t.y,n.y),this.z=ae(this.z,t.z,n.z),this}clampScalar(t,n){return this.x=ae(this.x,t,n),this.y=ae(this.y,t,n),this.z=ae(this.z,t,n),this}clampLength(t,n){const i=this.length();return this.divideScalar(i||1).multiplyScalar(ae(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this.z+=(t.z-this.z)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this.z=t.z+(n.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,n){const i=t.x,s=t.y,a=t.z,o=n.x,r=n.y,c=n.z;return this.x=s*c-a*r,this.y=a*o-i*c,this.z=i*r-s*o,this}projectOnVector(t){const n=t.lengthSq();if(n===0)return this.set(0,0,0);const i=t.dot(this)/n;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return Jl.copy(this).projectOnVector(t),this.sub(Jl)}reflect(t){return this.sub(Jl.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const n=Math.sqrt(this.lengthSq()*t.lengthSq());if(n===0)return Math.PI/2;const i=this.dot(t)/n;return Math.acos(ae(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const n=this.x-t.x,i=this.y-t.y,s=this.z-t.z;return n*n+i*i+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,n,i){const s=Math.sin(n)*t;return this.x=s*Math.sin(i),this.y=Math.cos(n)*t,this.z=s*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,n,i){return this.x=t*Math.sin(n),this.y=i,this.z=t*Math.cos(n),this}setFromMatrixPosition(t){const n=t.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this}setFromMatrixScale(t){const n=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=n,this.y=i,this.z=s,this}setFromMatrixColumn(t,n){return this.fromArray(t.elements,n*4)}setFromMatrix3Column(t,n){return this.fromArray(t.elements,n*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this.z=t[n+2],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t[n+2]=this.z,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this.z=t.getZ(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,n=Math.random()*2-1,i=Math.sqrt(1-n*n);return this.x=i*Math.cos(t),this.y=n,this.z=i*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Jl=new q,H0=new Ya;class te{static{te.prototype.isMatrix3=!0}constructor(t,n,i,s,a,o,r,c,l){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,n,i,s,a,o,r,c,l)}set(t,n,i,s,a,o,r,c,l){const d=this.elements;return d[0]=t,d[1]=s,d[2]=r,d[3]=n,d[4]=a,d[5]=c,d[6]=i,d[7]=o,d[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const n=this.elements,i=t.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],this}extractBasis(t,n,i){return t.setFromMatrix3Column(this,0),n.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const n=t.elements;return this.set(n[0],n[4],n[8],n[1],n[5],n[9],n[2],n[6],n[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,n){const i=t.elements,s=n.elements,a=this.elements,o=i[0],r=i[3],c=i[6],l=i[1],d=i[4],f=i[7],u=i[2],h=i[5],m=i[8],_=s[0],x=s[3],p=s[6],v=s[1],y=s[4],g=s[7],b=s[2],S=s[5],T=s[8];return a[0]=o*_+r*v+c*b,a[3]=o*x+r*y+c*S,a[6]=o*p+r*g+c*T,a[1]=l*_+d*v+f*b,a[4]=l*x+d*y+f*S,a[7]=l*p+d*g+f*T,a[2]=u*_+h*v+m*b,a[5]=u*x+h*y+m*S,a[8]=u*p+h*g+m*T,this}multiplyScalar(t){const n=this.elements;return n[0]*=t,n[3]*=t,n[6]*=t,n[1]*=t,n[4]*=t,n[7]*=t,n[2]*=t,n[5]*=t,n[8]*=t,this}determinant(){const t=this.elements,n=t[0],i=t[1],s=t[2],a=t[3],o=t[4],r=t[5],c=t[6],l=t[7],d=t[8];return n*o*d-n*r*l-i*a*d+i*r*c+s*a*l-s*o*c}invert(){const t=this.elements,n=t[0],i=t[1],s=t[2],a=t[3],o=t[4],r=t[5],c=t[6],l=t[7],d=t[8],f=d*o-r*l,u=r*c-d*a,h=l*a-o*c,m=n*f+i*u+s*h;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/m;return t[0]=f*_,t[1]=(s*l-d*i)*_,t[2]=(r*i-s*o)*_,t[3]=u*_,t[4]=(d*n-s*c)*_,t[5]=(s*a-r*n)*_,t[6]=h*_,t[7]=(i*c-l*n)*_,t[8]=(o*n-i*a)*_,this}transpose(){let t;const n=this.elements;return t=n[1],n[1]=n[3],n[3]=t,t=n[2],n[2]=n[6],n[6]=t,t=n[5],n[5]=n[7],n[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const n=this.elements;return t[0]=n[0],t[1]=n[3],t[2]=n[6],t[3]=n[1],t[4]=n[4],t[5]=n[7],t[6]=n[2],t[7]=n[5],t[8]=n[8],this}setUvTransform(t,n,i,s,a,o,r){const c=Math.cos(a),l=Math.sin(a);return this.set(i*c,i*l,-i*(c*o+l*r)+o+t,-s*l,s*c,-s*(-l*o+c*r)+r+n,0,0,1),this}scale(t,n){return Ia("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Ql.makeScale(t,n)),this}rotate(t){return Ia("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Ql.makeRotation(-t)),this}translate(t,n){return Ia("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Ql.makeTranslation(t,n)),this}makeTranslation(t,n){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,n,0,0,1),this}makeRotation(t){const n=Math.cos(t),i=Math.sin(t);return this.set(n,-i,0,i,n,0,0,0,1),this}makeScale(t,n){return this.set(t,0,0,0,n,0,0,0,1),this}equals(t){const n=this.elements,i=t.elements;for(let s=0;s<9;s++)if(n[s]!==i[s])return!1;return!0}fromArray(t,n=0){for(let i=0;i<9;i++)this.elements[i]=t[i+n];return this}toArray(t=[],n=0){const i=this.elements;return t[n]=i[0],t[n+1]=i[1],t[n+2]=i[2],t[n+3]=i[3],t[n+4]=i[4],t[n+5]=i[5],t[n+6]=i[6],t[n+7]=i[7],t[n+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const Ql=new te,V0=new te().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),W0=new te().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Y1(){const e={enabled:!0,workingColorSpace:qc,spaces:{},convert:function(s,a,o){return this.enabled===!1||a===o||!a||!o||(this.spaces[a].transfer===pe&&(s.r=Ui(s.r),s.g=Ui(s.g),s.b=Ui(s.b)),this.spaces[a].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[a].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===pe&&(s.r=Da(s.r),s.g=Da(s.g),s.b=Da(s.b))),s},workingToColorSpace:function(s,a){return this.convert(s,this.workingColorSpace,a)},colorSpaceToWorking:function(s,a){return this.convert(s,a,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===is?Yc:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,a=this.workingColorSpace){return s.fromArray(this.spaces[a].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,a,o){return s.copy(this.spaces[a].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,a){return Ia("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),e.workingToColorSpace(s,a)},toWorkingColorSpace:function(s,a){return Ia("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),e.colorSpaceToWorking(s,a)}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],i=[.3127,.329];return e.define({[qc]:{primaries:t,whitePoint:i,transfer:Yc,toXYZ:V0,fromXYZ:W0,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:ln},outputColorSpaceConfig:{drawingBufferColorSpace:ln}},[ln]:{primaries:t,whitePoint:i,transfer:pe,toXYZ:V0,fromXYZ:W0,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:ln}}}),e}const oe=Y1();function Ui(e){return e<.04045?e*.0773993808:Math.pow(e*.9478672986+.0521327014,2.4)}function Da(e){return e<.0031308?e*12.92:1.055*Math.pow(e,.41666)-.055}let sa;class Z1{static getDataURL(t,n="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let i;if(t instanceof HTMLCanvasElement)i=t;else{sa===void 0&&(sa=Zc("canvas")),sa.width=t.width,sa.height=t.height;const s=sa.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),i=sa}return i.toDataURL(n)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const n=Zc("canvas");n.width=t.width,n.height=t.height;const i=n.getContext("2d");i.drawImage(t,0,0,t.width,t.height);const s=i.getImageData(0,0,t.width,t.height),a=s.data;for(let o=0;o<a.length;o++)a[o]=Ui(a[o]/255)*255;return i.putImageData(s,0,0),n}else if(t.data){const n=t.data.slice(0);for(let i=0;i<n.length;i++)n instanceof Uint8Array||n instanceof Uint8ClampedArray?n[i]=Math.floor(Ui(n[i]/255)*255):n[i]=Ui(n[i]);return{data:n,width:t.width,height:t.height}}else return Jt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let K1=0;class Du{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:K1++}),this.uuid=qa(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){const n=this.data;return typeof HTMLVideoElement<"u"&&n instanceof HTMLVideoElement?t.set(n.videoWidth,n.videoHeight,0):typeof VideoFrame<"u"&&n instanceof VideoFrame?t.set(n.displayWidth,n.displayHeight,0):n!==null?t.set(n.width,n.height,n.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const n=t===void 0||typeof t=="string";if(!n&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let a;if(Array.isArray(s)){a=[];for(let o=0,r=s.length;o<r;o++)s[o].isDataTexture?a.push(jl(s[o].image)):a.push(jl(s[o]))}else a=jl(s);i.url=a}return n||(t.images[this.uuid]=i),i}}function jl(e){return typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap?Z1.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(Jt("Texture: Unable to serialize Texture."),{})}let J1=0;const td=new q;class je extends Ys{constructor(t=je.DEFAULT_IMAGE,n=je.DEFAULT_MAPPING,i=zi,s=zi,a=We,o=bs,r=Zn,c=Sn,l=je.DEFAULT_ANISOTROPY,d=is){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:J1++}),this.uuid=qa(),this.name="",this.source=new Du(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=a,this.minFilter=o,this.anisotropy=l,this.format=r,this.internalFormat=null,this.type=c,this.offset=new Ct(0,0),this.repeat=new Ct(1,1),this.center=new Ct(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new te,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=d,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(td).x}get height(){return this.source.getSize(td).y}get depth(){return this.source.getSize(td).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,n){this.updateRanges.push({start:t,count:n})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(const n in t){const i=t[n];if(i===void 0){Jt(`Texture.setValues(): parameter '${n}' has value of undefined.`);continue}const s=this[n];if(s===void 0){Jt(`Texture.setValues(): property '${n}' does not exist.`);continue}s&&i&&s.isVector2&&i.isVector2||s&&i&&s.isVector3&&i.isVector3||s&&i&&s.isMatrix3&&i.isMatrix3?s.copy(i):this[n]=i}}toJSON(t){const n=t===void 0||typeof t=="string";if(!n&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),n||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Em)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case tr:t.x=t.x-Math.floor(t.x);break;case zi:t.x=t.x<0?0:1;break;case cf:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case tr:t.y=t.y-Math.floor(t.y);break;case zi:t.y=t.y<0?0:1;break;case cf:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}je.DEFAULT_IMAGE=null;je.DEFAULT_MAPPING=Em;je.DEFAULT_ANISOTROPY=1;class Te{static{Te.prototype.isVector4=!0}constructor(t=0,n=0,i=0,s=1){this.x=t,this.y=n,this.z=i,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,n,i,s){return this.x=t,this.y=n,this.z=i,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;case 3:this.w=n;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this.z=t.z+n.z,this.w=t.w+n.w,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this.z+=t.z*n,this.w+=t.w*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this.z=t.z-n.z,this.w=t.w-n.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const n=this.x,i=this.y,s=this.z,a=this.w,o=t.elements;return this.x=o[0]*n+o[4]*i+o[8]*s+o[12]*a,this.y=o[1]*n+o[5]*i+o[9]*s+o[13]*a,this.z=o[2]*n+o[6]*i+o[10]*s+o[14]*a,this.w=o[3]*n+o[7]*i+o[11]*s+o[15]*a,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const n=Math.sqrt(1-t.w*t.w);return n<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/n,this.y=t.y/n,this.z=t.z/n),this}setAxisAngleFromRotationMatrix(t){let n,i,s,a;const c=t.elements,l=c[0],d=c[4],f=c[8],u=c[1],h=c[5],m=c[9],_=c[2],x=c[6],p=c[10];if(Math.abs(d-u)<.01&&Math.abs(f-_)<.01&&Math.abs(m-x)<.01){if(Math.abs(d+u)<.1&&Math.abs(f+_)<.1&&Math.abs(m+x)<.1&&Math.abs(l+h+p-3)<.1)return this.set(1,0,0,0),this;n=Math.PI;const y=(l+1)/2,g=(h+1)/2,b=(p+1)/2,S=(d+u)/4,T=(f+_)/4,M=(m+x)/4;return y>g&&y>b?y<.01?(i=0,s=.707106781,a=.707106781):(i=Math.sqrt(y),s=S/i,a=T/i):g>b?g<.01?(i=.707106781,s=0,a=.707106781):(s=Math.sqrt(g),i=S/s,a=M/s):b<.01?(i=.707106781,s=.707106781,a=0):(a=Math.sqrt(b),i=T/a,s=M/a),this.set(i,s,a,n),this}let v=Math.sqrt((x-m)*(x-m)+(f-_)*(f-_)+(u-d)*(u-d));return Math.abs(v)<.001&&(v=1),this.x=(x-m)/v,this.y=(f-_)/v,this.z=(u-d)/v,this.w=Math.acos((l+h+p-1)/2),this}setFromMatrixPosition(t){const n=t.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this.w=n[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,n){return this.x=ae(this.x,t.x,n.x),this.y=ae(this.y,t.y,n.y),this.z=ae(this.z,t.z,n.z),this.w=ae(this.w,t.w,n.w),this}clampScalar(t,n){return this.x=ae(this.x,t,n),this.y=ae(this.y,t,n),this.z=ae(this.z,t,n),this.w=ae(this.w,t,n),this}clampLength(t,n){const i=this.length();return this.divideScalar(i||1).multiplyScalar(ae(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this.z+=(t.z-this.z)*n,this.w+=(t.w-this.w)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this.z=t.z+(n.z-t.z)*i,this.w=t.w+(n.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this.z=t[n+2],this.w=t[n+3],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t[n+2]=this.z,t[n+3]=this.w,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this.z=t.getZ(n),this.w=t.getW(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Q1 extends Ys{constructor(t=1,n=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:We,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=t,this.height=n,this.depth=i.depth,this.scissor=new Te(0,0,t,n),this.scissorTest=!1,this.viewport=new Te(0,0,t,n),this.textures=[];const s={width:t,height:n,depth:i.depth},a=new je(s),o=i.count;for(let r=0;r<o;r++)this.textures[r]=a.clone(),this.textures[r].isRenderTargetTexture=!0,this.textures[r].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(t={}){const n={minFilter:We,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(n.mapping=t.mapping),t.wrapS!==void 0&&(n.wrapS=t.wrapS),t.wrapT!==void 0&&(n.wrapT=t.wrapT),t.wrapR!==void 0&&(n.wrapR=t.wrapR),t.magFilter!==void 0&&(n.magFilter=t.magFilter),t.minFilter!==void 0&&(n.minFilter=t.minFilter),t.format!==void 0&&(n.format=t.format),t.type!==void 0&&(n.type=t.type),t.anisotropy!==void 0&&(n.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(n.colorSpace=t.colorSpace),t.flipY!==void 0&&(n.flipY=t.flipY),t.generateMipmaps!==void 0&&(n.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(n.internalFormat=t.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(n)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,n,i=1){if(this.width!==t||this.height!==n||this.depth!==i){this.width=t,this.height=n,this.depth=i;for(let s=0,a=this.textures.length;s<a;s++)this.textures[s].image.width=t,this.textures[s].image.height=n,this.textures[s].image.depth=i,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,n),this.scissor.set(0,0,t,n)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,i=t.textures.length;n<i;n++){this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0,this.textures[n].renderTarget=this;const s=Object.assign({},t.textures[n].image);this.textures[n].source=new Du(s)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){const n=t.depthTexture.clone();n.renderTarget=null,this.depthTexture=n}else this.depthTexture=t.depthTexture;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Kn extends Q1{constructor(t=1,n=1,i={}){super(t,n,i),this.isWebGLRenderTarget=!0}}class Dm extends je{constructor(t=null,n=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:n,height:i,depth:s},this.magFilter=Ve,this.minFilter=Ve,this.wrapR=zi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class j1 extends je{constructor(t=null,n=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:n,height:i,depth:s},this.magFilter=Ve,this.minFilter=Ve,this.wrapR=zi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}}class we{static{we.prototype.isMatrix4=!0}constructor(t,n,i,s,a,o,r,c,l,d,f,u,h,m,_,x){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,n,i,s,a,o,r,c,l,d,f,u,h,m,_,x)}set(t,n,i,s,a,o,r,c,l,d,f,u,h,m,_,x){const p=this.elements;return p[0]=t,p[4]=n,p[8]=i,p[12]=s,p[1]=a,p[5]=o,p[9]=r,p[13]=c,p[2]=l,p[6]=d,p[10]=f,p[14]=u,p[3]=h,p[7]=m,p[11]=_,p[15]=x,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new we().fromArray(this.elements)}copy(t){const n=this.elements,i=t.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],n[9]=i[9],n[10]=i[10],n[11]=i[11],n[12]=i[12],n[13]=i[13],n[14]=i[14],n[15]=i[15],this}copyPosition(t){const n=this.elements,i=t.elements;return n[12]=i[12],n[13]=i[13],n[14]=i[14],this}setFromMatrix3(t){const n=t.elements;return this.set(n[0],n[3],n[6],0,n[1],n[4],n[7],0,n[2],n[5],n[8],0,0,0,0,1),this}extractBasis(t,n,i){return this.determinantAffine()===0?(t.set(1,0,0),n.set(0,1,0),i.set(0,0,1),this):(t.setFromMatrixColumn(this,0),n.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(t,n,i){return this.set(t.x,n.x,i.x,0,t.y,n.y,i.y,0,t.z,n.z,i.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();const n=this.elements,i=t.elements,s=1/aa.setFromMatrixColumn(t,0).length(),a=1/aa.setFromMatrixColumn(t,1).length(),o=1/aa.setFromMatrixColumn(t,2).length();return n[0]=i[0]*s,n[1]=i[1]*s,n[2]=i[2]*s,n[3]=0,n[4]=i[4]*a,n[5]=i[5]*a,n[6]=i[6]*a,n[7]=0,n[8]=i[8]*o,n[9]=i[9]*o,n[10]=i[10]*o,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromEuler(t){const n=this.elements,i=t.x,s=t.y,a=t.z,o=Math.cos(i),r=Math.sin(i),c=Math.cos(s),l=Math.sin(s),d=Math.cos(a),f=Math.sin(a);if(t.order==="XYZ"){const u=o*d,h=o*f,m=r*d,_=r*f;n[0]=c*d,n[4]=-c*f,n[8]=l,n[1]=h+m*l,n[5]=u-_*l,n[9]=-r*c,n[2]=_-u*l,n[6]=m+h*l,n[10]=o*c}else if(t.order==="YXZ"){const u=c*d,h=c*f,m=l*d,_=l*f;n[0]=u+_*r,n[4]=m*r-h,n[8]=o*l,n[1]=o*f,n[5]=o*d,n[9]=-r,n[2]=h*r-m,n[6]=_+u*r,n[10]=o*c}else if(t.order==="ZXY"){const u=c*d,h=c*f,m=l*d,_=l*f;n[0]=u-_*r,n[4]=-o*f,n[8]=m+h*r,n[1]=h+m*r,n[5]=o*d,n[9]=_-u*r,n[2]=-o*l,n[6]=r,n[10]=o*c}else if(t.order==="ZYX"){const u=o*d,h=o*f,m=r*d,_=r*f;n[0]=c*d,n[4]=m*l-h,n[8]=u*l+_,n[1]=c*f,n[5]=_*l+u,n[9]=h*l-m,n[2]=-l,n[6]=r*c,n[10]=o*c}else if(t.order==="YZX"){const u=o*c,h=o*l,m=r*c,_=r*l;n[0]=c*d,n[4]=_-u*f,n[8]=m*f+h,n[1]=f,n[5]=o*d,n[9]=-r*d,n[2]=-l*d,n[6]=h*f+m,n[10]=u-_*f}else if(t.order==="XZY"){const u=o*c,h=o*l,m=r*c,_=r*l;n[0]=c*d,n[4]=-f,n[8]=l*d,n[1]=u*f+_,n[5]=o*d,n[9]=h*f-m,n[2]=m*f-h,n[6]=r*d,n[10]=_*f+u}return n[3]=0,n[7]=0,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromQuaternion(t){return this.compose(t_,t,e_)}lookAt(t,n,i){const s=this.elements;return pn.subVectors(t,n),pn.lengthSq()===0&&(pn.z=1),pn.normalize(),Wi.crossVectors(i,pn),Wi.lengthSq()===0&&(Math.abs(i.z)===1?pn.x+=1e-4:pn.z+=1e-4,pn.normalize(),Wi.crossVectors(i,pn)),Wi.normalize(),Fr.crossVectors(pn,Wi),s[0]=Wi.x,s[4]=Fr.x,s[8]=pn.x,s[1]=Wi.y,s[5]=Fr.y,s[9]=pn.y,s[2]=Wi.z,s[6]=Fr.z,s[10]=pn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,n){const i=t.elements,s=n.elements,a=this.elements,o=i[0],r=i[4],c=i[8],l=i[12],d=i[1],f=i[5],u=i[9],h=i[13],m=i[2],_=i[6],x=i[10],p=i[14],v=i[3],y=i[7],g=i[11],b=i[15],S=s[0],T=s[4],M=s[8],E=s[12],A=s[1],R=s[5],D=s[9],O=s[13],P=s[2],F=s[6],V=s[10],U=s[14],B=s[3],I=s[7],G=s[11],$=s[15];return a[0]=o*S+r*A+c*P+l*B,a[4]=o*T+r*R+c*F+l*I,a[8]=o*M+r*D+c*V+l*G,a[12]=o*E+r*O+c*U+l*$,a[1]=d*S+f*A+u*P+h*B,a[5]=d*T+f*R+u*F+h*I,a[9]=d*M+f*D+u*V+h*G,a[13]=d*E+f*O+u*U+h*$,a[2]=m*S+_*A+x*P+p*B,a[6]=m*T+_*R+x*F+p*I,a[10]=m*M+_*D+x*V+p*G,a[14]=m*E+_*O+x*U+p*$,a[3]=v*S+y*A+g*P+b*B,a[7]=v*T+y*R+g*F+b*I,a[11]=v*M+y*D+g*V+b*G,a[15]=v*E+y*O+g*U+b*$,this}multiplyScalar(t){const n=this.elements;return n[0]*=t,n[4]*=t,n[8]*=t,n[12]*=t,n[1]*=t,n[5]*=t,n[9]*=t,n[13]*=t,n[2]*=t,n[6]*=t,n[10]*=t,n[14]*=t,n[3]*=t,n[7]*=t,n[11]*=t,n[15]*=t,this}determinant(){const t=this.elements,n=t[0],i=t[4],s=t[8],a=t[12],o=t[1],r=t[5],c=t[9],l=t[13],d=t[2],f=t[6],u=t[10],h=t[14],m=t[3],_=t[7],x=t[11],p=t[15],v=c*h-l*u,y=r*h-l*f,g=r*u-c*f,b=o*h-l*d,S=o*u-c*d,T=o*f-r*d;return n*(_*v-x*y+p*g)-i*(m*v-x*b+p*S)+s*(m*y-_*b+p*T)-a*(m*g-_*S+x*T)}determinantAffine(){const t=this.elements,n=t[0],i=t[4],s=t[8],a=t[1],o=t[5],r=t[9],c=t[2],l=t[6],d=t[10];return n*(o*d-r*l)-i*(a*d-r*c)+s*(a*l-o*c)}transpose(){const t=this.elements;let n;return n=t[1],t[1]=t[4],t[4]=n,n=t[2],t[2]=t[8],t[8]=n,n=t[6],t[6]=t[9],t[9]=n,n=t[3],t[3]=t[12],t[12]=n,n=t[7],t[7]=t[13],t[13]=n,n=t[11],t[11]=t[14],t[14]=n,this}setPosition(t,n,i){const s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=n,s[14]=i),this}invert(){const t=this.elements,n=t[0],i=t[1],s=t[2],a=t[3],o=t[4],r=t[5],c=t[6],l=t[7],d=t[8],f=t[9],u=t[10],h=t[11],m=t[12],_=t[13],x=t[14],p=t[15],v=n*r-i*o,y=n*c-s*o,g=n*l-a*o,b=i*c-s*r,S=i*l-a*r,T=s*l-a*c,M=d*_-f*m,E=d*x-u*m,A=d*p-h*m,R=f*x-u*_,D=f*p-h*_,O=u*p-h*x,P=v*O-y*D+g*R+b*A-S*E+T*M;if(P===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const F=1/P;return t[0]=(r*O-c*D+l*R)*F,t[1]=(s*D-i*O-a*R)*F,t[2]=(_*T-x*S+p*b)*F,t[3]=(u*S-f*T-h*b)*F,t[4]=(c*A-o*O-l*E)*F,t[5]=(n*O-s*A+a*E)*F,t[6]=(x*g-m*T-p*y)*F,t[7]=(d*T-u*g+h*y)*F,t[8]=(o*D-r*A+l*M)*F,t[9]=(i*A-n*D-a*M)*F,t[10]=(m*S-_*g+p*v)*F,t[11]=(f*g-d*S-h*v)*F,t[12]=(r*E-o*R-c*M)*F,t[13]=(n*R-i*E+s*M)*F,t[14]=(_*y-m*b-x*v)*F,t[15]=(d*b-f*y+u*v)*F,this}scale(t){const n=this.elements,i=t.x,s=t.y,a=t.z;return n[0]*=i,n[4]*=s,n[8]*=a,n[1]*=i,n[5]*=s,n[9]*=a,n[2]*=i,n[6]*=s,n[10]*=a,n[3]*=i,n[7]*=s,n[11]*=a,this}getMaxScaleOnAxis(){const t=this.elements,n=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(n,i,s))}makeTranslation(t,n,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,n,0,0,1,i,0,0,0,1),this}makeRotationX(t){const n=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,n,-i,0,0,i,n,0,0,0,0,1),this}makeRotationY(t){const n=Math.cos(t),i=Math.sin(t);return this.set(n,0,i,0,0,1,0,0,-i,0,n,0,0,0,0,1),this}makeRotationZ(t){const n=Math.cos(t),i=Math.sin(t);return this.set(n,-i,0,0,i,n,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,n){const i=Math.cos(n),s=Math.sin(n),a=1-i,o=t.x,r=t.y,c=t.z,l=a*o,d=a*r;return this.set(l*o+i,l*r-s*c,l*c+s*r,0,l*r+s*c,d*r+i,d*c-s*o,0,l*c-s*r,d*c+s*o,a*c*c+i,0,0,0,0,1),this}makeScale(t,n,i){return this.set(t,0,0,0,0,n,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,n,i,s,a,o){return this.set(1,i,a,0,t,1,o,0,n,s,1,0,0,0,0,1),this}compose(t,n,i){const s=this.elements,a=n._x,o=n._y,r=n._z,c=n._w,l=a+a,d=o+o,f=r+r,u=a*l,h=a*d,m=a*f,_=o*d,x=o*f,p=r*f,v=c*l,y=c*d,g=c*f,b=i.x,S=i.y,T=i.z;return s[0]=(1-(_+p))*b,s[1]=(h+g)*b,s[2]=(m-y)*b,s[3]=0,s[4]=(h-g)*S,s[5]=(1-(u+p))*S,s[6]=(x+v)*S,s[7]=0,s[8]=(m+y)*T,s[9]=(x-v)*T,s[10]=(1-(u+_))*T,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,n,i){const s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];const a=this.determinantAffine();if(a===0)return i.set(1,1,1),n.identity(),this;let o=aa.set(s[0],s[1],s[2]).length();const r=aa.set(s[4],s[5],s[6]).length(),c=aa.set(s[8],s[9],s[10]).length();a<0&&(o=-o),Gn.copy(this);const l=1/o,d=1/r,f=1/c;return Gn.elements[0]*=l,Gn.elements[1]*=l,Gn.elements[2]*=l,Gn.elements[4]*=d,Gn.elements[5]*=d,Gn.elements[6]*=d,Gn.elements[8]*=f,Gn.elements[9]*=f,Gn.elements[10]*=f,n.setFromRotationMatrix(Gn),i.x=o,i.y=r,i.z=c,this}makePerspective(t,n,i,s,a,o,r=ri,c=!1){const l=this.elements,d=2*a/(n-t),f=2*a/(i-s),u=(n+t)/(n-t),h=(i+s)/(i-s);let m,_;if(c)m=a/(o-a),_=o*a/(o-a);else if(r===ri)m=-(o+a)/(o-a),_=-2*o*a/(o-a);else if(r===ir)m=-o/(o-a),_=-o*a/(o-a);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+r);return l[0]=d,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=f,l[9]=h,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=_,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,n,i,s,a,o,r=ri,c=!1){const l=this.elements,d=2/(n-t),f=2/(i-s),u=-(n+t)/(n-t),h=-(i+s)/(i-s);let m,_;if(c)m=1/(o-a),_=o/(o-a);else if(r===ri)m=-2/(o-a),_=-(o+a)/(o-a);else if(r===ir)m=-1/(o-a),_=-a/(o-a);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+r);return l[0]=d,l[4]=0,l[8]=0,l[12]=u,l[1]=0,l[5]=f,l[9]=0,l[13]=h,l[2]=0,l[6]=0,l[10]=m,l[14]=_,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const n=this.elements,i=t.elements;for(let s=0;s<16;s++)if(n[s]!==i[s])return!1;return!0}fromArray(t,n=0){for(let i=0;i<16;i++)this.elements[i]=t[i+n];return this}toArray(t=[],n=0){const i=this.elements;return t[n]=i[0],t[n+1]=i[1],t[n+2]=i[2],t[n+3]=i[3],t[n+4]=i[4],t[n+5]=i[5],t[n+6]=i[6],t[n+7]=i[7],t[n+8]=i[8],t[n+9]=i[9],t[n+10]=i[10],t[n+11]=i[11],t[n+12]=i[12],t[n+13]=i[13],t[n+14]=i[14],t[n+15]=i[15],t}}const aa=new q,Gn=new we,t_=new q(0,0,0),e_=new q(1,1,1),Wi=new q,Fr=new q,pn=new q,k0=new we,X0=new Ya;class Bi{constructor(t=0,n=0,i=0,s=Bi.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=i,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,n,i,s=this._order){return this._x=t,this._y=n,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,n=this._order,i=!0){const s=t.elements,a=s[0],o=s[4],r=s[8],c=s[1],l=s[5],d=s[9],f=s[2],u=s[6],h=s[10];switch(n){case"XYZ":this._y=Math.asin(ae(r,-1,1)),Math.abs(r)<.9999999?(this._x=Math.atan2(-d,h),this._z=Math.atan2(-o,a)):(this._x=Math.atan2(u,l),this._z=0);break;case"YXZ":this._x=Math.asin(-ae(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(r,h),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-f,a),this._z=0);break;case"ZXY":this._x=Math.asin(ae(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-f,h),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,a));break;case"ZYX":this._y=Math.asin(-ae(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(u,h),this._z=Math.atan2(c,a)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(ae(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-d,l),this._y=Math.atan2(-f,a)):(this._x=0,this._y=Math.atan2(r,h));break;case"XZY":this._z=Math.asin(-ae(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(u,l),this._y=Math.atan2(r,a)):(this._x=Math.atan2(-d,h),this._y=0);break;default:Jt("Euler: .setFromRotationMatrix() encountered an unknown order: "+n)}return this._order=n,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,n,i){return k0.makeRotationFromQuaternion(t),this.setFromRotationMatrix(k0,n,i)}setFromVector3(t,n=this._order){return this.set(t.x,t.y,t.z,n)}reorder(t){return X0.setFromEuler(this),this.setFromQuaternion(X0,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],n=0){return t[n]=this._x,t[n+1]=this._y,t[n+2]=this._z,t[n+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Bi.DEFAULT_ORDER="XYZ";class Nm{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let n_=0;const $0=new q,oa=new Ya,vi=new we,Br=new q,co=new q,i_=new q,s_=new Ya,q0=new q(1,0,0),Y0=new q(0,1,0),Z0=new q(0,0,1),K0={type:"added"},a_={type:"removed"},ra={type:"childadded",child:null},ed={type:"childremoved",child:null};class ke extends Ys{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:n_++}),this.uuid=qa(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=ke.DEFAULT_UP.clone();const t=new q,n=new Bi,i=new Ya,s=new q(1,1,1);function a(){i.setFromEuler(n,!1)}function o(){n.setFromQuaternion(i,void 0,!1)}n._onChange(a),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new we},normalMatrix:{value:new te}}),this.matrix=new we,this.matrixWorld=new we,this.matrixAutoUpdate=ke.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=ke.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Nm,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,n){this.quaternion.setFromAxisAngle(t,n)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,n){return oa.setFromAxisAngle(t,n),this.quaternion.multiply(oa),this}rotateOnWorldAxis(t,n){return oa.setFromAxisAngle(t,n),this.quaternion.premultiply(oa),this}rotateX(t){return this.rotateOnAxis(q0,t)}rotateY(t){return this.rotateOnAxis(Y0,t)}rotateZ(t){return this.rotateOnAxis(Z0,t)}translateOnAxis(t,n){return $0.copy(t).applyQuaternion(this.quaternion),this.position.add($0.multiplyScalar(n)),this}translateX(t){return this.translateOnAxis(q0,t)}translateY(t){return this.translateOnAxis(Y0,t)}translateZ(t){return this.translateOnAxis(Z0,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(vi.copy(this.matrixWorld).invert())}lookAt(t,n,i){t.isVector3?Br.copy(t):Br.set(t,n,i);const s=this.parent;this.updateWorldMatrix(!0,!1),co.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?vi.lookAt(co,Br,this.up):vi.lookAt(Br,co,this.up),this.quaternion.setFromRotationMatrix(vi),s&&(vi.extractRotation(s.matrixWorld),oa.setFromRotationMatrix(vi),this.quaternion.premultiply(oa.invert()))}add(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.add(arguments[n]);return this}return t===this?(ce("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(K0),ra.child=t,this.dispatchEvent(ra),ra.child=null):ce("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const n=this.children.indexOf(t);return n!==-1&&(t.parent=null,this.children.splice(n,1),t.dispatchEvent(a_),ed.child=t,this.dispatchEvent(ed),ed.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),vi.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),vi.multiply(t.parent.matrixWorld)),t.applyMatrix4(vi),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(K0),ra.child=t,this.dispatchEvent(ra),ra.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,n){if(this[t]===n)return this;for(let i=0,s=this.children.length;i<s;i++){const o=this.children[i].getObjectByProperty(t,n);if(o!==void 0)return o}}getObjectsByProperty(t,n,i=[]){this[t]===n&&i.push(this);const s=this.children;for(let a=0,o=s.length;a<o;a++)s[a].getObjectsByProperty(t,n,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(co,t,i_),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(co,s_,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const n=this.matrixWorld.elements;return t.set(n[8],n[9],n[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(t){t(this);const n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].traverseVisible(t)}traverseAncestors(t){const n=this.parent;n!==null&&(t(n),n.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const t=this.pivot;if(t!==null){const n=t.x,i=t.y,s=t.z,a=this.matrix.elements;a[12]+=n-a[0]*n-a[4]*i-a[8]*s,a[13]+=i-a[1]*n-a[5]*i-a[9]*s,a[14]+=s-a[2]*n-a[6]*i-a[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].updateMatrixWorld(t)}updateWorldMatrix(t,n,i=!1){const s=this.parent;if(t===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),n===!0){const a=this.children;for(let o=0,r=a.length;o<r;o++)a[o].updateWorldMatrix(!1,!0,i)}}toJSON(t){const n=t===void 0||typeof t=="string",i={};n&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(r=>({...r,boundingBox:r.boundingBox?r.boundingBox.toJSON():void 0,boundingSphere:r.boundingSphere?r.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(r=>({...r})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function a(r,c){return r[c.uuid]===void 0&&(r[c.uuid]=c.toJSON(t)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=a(t.geometries,this.geometry);const r=this.geometry.parameters;if(r!==void 0&&r.shapes!==void 0){const c=r.shapes;if(Array.isArray(c))for(let l=0,d=c.length;l<d;l++){const f=c[l];a(t.shapes,f)}else a(t.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(a(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const r=[];for(let c=0,l=this.material.length;c<l;c++)r.push(a(t.materials,this.material[c]));s.material=r}else s.material=a(t.materials,this.material);if(this.children.length>0){s.children=[];for(let r=0;r<this.children.length;r++)s.children.push(this.children[r].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let r=0;r<this.animations.length;r++){const c=this.animations[r];s.animations.push(a(t.animations,c))}}if(n){const r=o(t.geometries),c=o(t.materials),l=o(t.textures),d=o(t.images),f=o(t.shapes),u=o(t.skeletons),h=o(t.animations),m=o(t.nodes);r.length>0&&(i.geometries=r),c.length>0&&(i.materials=c),l.length>0&&(i.textures=l),d.length>0&&(i.images=d),f.length>0&&(i.shapes=f),u.length>0&&(i.skeletons=u),h.length>0&&(i.animations=h),m.length>0&&(i.nodes=m)}return i.object=s,i;function o(r){const c=[];for(const l in r){const d=r[l];delete d.metadata,c.push(d)}return c}}clone(t){return new this.constructor().copy(this,t)}copy(t,n=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),n===!0)for(let i=0;i<t.children.length;i++){const s=t.children[i];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}ke.DEFAULT_UP=new q(0,1,0);ke.DEFAULT_MATRIX_AUTO_UPDATE=!0;ke.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class Xt extends ke{constructor(){super(),this.isGroup=!0,this.type="Group"}}const o_={type:"move"};class nd{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Xt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Xt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new q,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new q),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Xt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new q,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new q,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const n=this._hand;if(n)for(const i of t.hand.values())this._getHandJoint(n,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,n,i){let s=null,a=null,o=null;const r=this._targetRay,c=this._grip,l=this._hand;if(t&&n.session.visibilityState!=="visible-blurred"){if(l&&t.hand){o=!0;for(const _ of t.hand.values()){const x=n.getJointPose(_,i),p=this._getHandJoint(l,_);x!==null&&(p.matrix.fromArray(x.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=x.radius),p.visible=x!==null}const d=l.joints["index-finger-tip"],f=l.joints["thumb-tip"],u=d.position.distanceTo(f.position),h=.02,m=.005;l.inputState.pinching&&u>h+m?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!l.inputState.pinching&&u<=h-m&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else c!==null&&t.gripSpace&&(a=n.getPose(t.gripSpace,i),a!==null&&(c.matrix.fromArray(a.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,a.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(a.linearVelocity)):c.hasLinearVelocity=!1,a.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(a.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:t,target:this})));r!==null&&(s=n.getPose(t.targetRaySpace,i),s===null&&a!==null&&(s=a),s!==null&&(r.matrix.fromArray(s.transform.matrix),r.matrix.decompose(r.position,r.rotation,r.scale),r.matrixWorldNeedsUpdate=!0,s.linearVelocity?(r.hasLinearVelocity=!0,r.linearVelocity.copy(s.linearVelocity)):r.hasLinearVelocity=!1,s.angularVelocity?(r.hasAngularVelocity=!0,r.angularVelocity.copy(s.angularVelocity)):r.hasAngularVelocity=!1,this.dispatchEvent(o_)))}return r!==null&&(r.visible=s!==null),c!==null&&(c.visible=a!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(t,n){if(t.joints[n.jointName]===void 0){const i=new Xt;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[n.jointName]=i,t.add(i)}return t.joints[n.jointName]}}const Um={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ki={h:0,s:0,l:0},Gr={h:0,s:0,l:0};function id(e,t,n){return n<0&&(n+=1),n>1&&(n-=1),n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}class ee{constructor(t,n,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,n,i)}set(t,n,i){if(n===void 0&&i===void 0){const s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,n,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,n=ln){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,oe.colorSpaceToWorking(this,n),this}setRGB(t,n,i,s=oe.workingColorSpace){return this.r=t,this.g=n,this.b=i,oe.colorSpaceToWorking(this,s),this}setHSL(t,n,i,s=oe.workingColorSpace){if(t=q1(t,1),n=ae(n,0,1),i=ae(i,0,1),n===0)this.r=this.g=this.b=i;else{const a=i<=.5?i*(1+n):i+n-i*n,o=2*i-a;this.r=id(o,a,t+1/3),this.g=id(o,a,t),this.b=id(o,a,t-1/3)}return oe.colorSpaceToWorking(this,s),this}setStyle(t,n=ln){function i(a){a!==void 0&&parseFloat(a)<1&&Jt("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let a;const o=s[1],r=s[2];switch(o){case"rgb":case"rgba":if(a=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(r))return i(a[4]),this.setRGB(Math.min(255,parseInt(a[1],10))/255,Math.min(255,parseInt(a[2],10))/255,Math.min(255,parseInt(a[3],10))/255,n);if(a=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(r))return i(a[4]),this.setRGB(Math.min(100,parseInt(a[1],10))/100,Math.min(100,parseInt(a[2],10))/100,Math.min(100,parseInt(a[3],10))/100,n);break;case"hsl":case"hsla":if(a=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(r))return i(a[4]),this.setHSL(parseFloat(a[1])/360,parseFloat(a[2])/100,parseFloat(a[3])/100,n);break;default:Jt("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){const a=s[1],o=a.length;if(o===3)return this.setRGB(parseInt(a.charAt(0),16)/15,parseInt(a.charAt(1),16)/15,parseInt(a.charAt(2),16)/15,n);if(o===6)return this.setHex(parseInt(a,16),n);Jt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,n);return this}setColorName(t,n=ln){const i=Um[t.toLowerCase()];return i!==void 0?this.setHex(i,n):Jt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Ui(t.r),this.g=Ui(t.g),this.b=Ui(t.b),this}copyLinearToSRGB(t){return this.r=Da(t.r),this.g=Da(t.g),this.b=Da(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=ln){return oe.workingToColorSpace(qe.copy(this),t),Math.round(ae(qe.r*255,0,255))*65536+Math.round(ae(qe.g*255,0,255))*256+Math.round(ae(qe.b*255,0,255))}getHexString(t=ln){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,n=oe.workingColorSpace){oe.workingToColorSpace(qe.copy(this),n);const i=qe.r,s=qe.g,a=qe.b,o=Math.max(i,s,a),r=Math.min(i,s,a);let c,l;const d=(r+o)/2;if(r===o)c=0,l=0;else{const f=o-r;switch(l=d<=.5?f/(o+r):f/(2-o-r),o){case i:c=(s-a)/f+(s<a?6:0);break;case s:c=(a-i)/f+2;break;case a:c=(i-s)/f+4;break}c/=6}return t.h=c,t.s=l,t.l=d,t}getRGB(t,n=oe.workingColorSpace){return oe.workingToColorSpace(qe.copy(this),n),t.r=qe.r,t.g=qe.g,t.b=qe.b,t}getStyle(t=ln){oe.workingToColorSpace(qe.copy(this),t);const n=qe.r,i=qe.g,s=qe.b;return t!==ln?`color(${t} ${n.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(n*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(t,n,i){return this.getHSL(ki),this.setHSL(ki.h+t,ki.s+n,ki.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,n){return this.r=t.r+n.r,this.g=t.g+n.g,this.b=t.b+n.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,n){return this.r+=(t.r-this.r)*n,this.g+=(t.g-this.g)*n,this.b+=(t.b-this.b)*n,this}lerpColors(t,n,i){return this.r=t.r+(n.r-t.r)*i,this.g=t.g+(n.g-t.g)*i,this.b=t.b+(n.b-t.b)*i,this}lerpHSL(t,n){this.getHSL(ki),t.getHSL(Gr);const i=Kl(ki.h,Gr.h,n),s=Kl(ki.s,Gr.s,n),a=Kl(ki.l,Gr.l,n);return this.setHSL(i,s,a),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const n=this.r,i=this.g,s=this.b,a=t.elements;return this.r=a[0]*n+a[3]*i+a[6]*s,this.g=a[1]*n+a[4]*i+a[7]*s,this.b=a[2]*n+a[5]*i+a[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,n=0){return this.r=t[n],this.g=t[n+1],this.b=t[n+2],this}toArray(t=[],n=0){return t[n]=this.r,t[n+1]=this.g,t[n+2]=this.b,t}fromBufferAttribute(t,n){return this.r=t.getX(n),this.g=t.getY(n),this.b=t.getZ(n),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const qe=new ee;ee.NAMES=Um;class r_ extends ke{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Bi,this.environmentIntensity=1,this.environmentRotation=new Bi,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,n){return super.copy(t,n),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const n=super.toJSON(t);return this.fog!==null&&(n.object.fog=this.fog.toJSON()),n.object.backgroundBlurriness=this.backgroundBlurriness,n.object.backgroundIntensity=this.backgroundIntensity,n.object.backgroundRotation=this.backgroundRotation.toArray(),n.object.environmentIntensity=this.environmentIntensity,n.object.environmentRotation=this.environmentRotation.toArray(),n}}const Hn=new q,Mi=new q,sd=new q,yi=new q,ca=new q,la=new q,J0=new q,ad=new q,od=new q,rd=new q,cd=new Te,ld=new Te,dd=new Te;class qn{constructor(t=new q,n=new q,i=new q){this.a=t,this.b=n,this.c=i}static getNormal(t,n,i,s){s.subVectors(i,n),Hn.subVectors(t,n),s.cross(Hn);const a=s.lengthSq();return a>0?s.multiplyScalar(1/Math.sqrt(a)):s.set(0,0,0)}static getBarycoord(t,n,i,s,a){Hn.subVectors(s,n),Mi.subVectors(i,n),sd.subVectors(t,n);const o=Hn.dot(Hn),r=Hn.dot(Mi),c=Hn.dot(sd),l=Mi.dot(Mi),d=Mi.dot(sd),f=o*l-r*r;if(f===0)return a.set(0,0,0),null;const u=1/f,h=(l*c-r*d)*u,m=(o*d-r*c)*u;return a.set(1-h-m,m,h)}static containsPoint(t,n,i,s){return this.getBarycoord(t,n,i,s,yi)===null?!1:yi.x>=0&&yi.y>=0&&yi.x+yi.y<=1}static getInterpolation(t,n,i,s,a,o,r,c){return this.getBarycoord(t,n,i,s,yi)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(a,yi.x),c.addScaledVector(o,yi.y),c.addScaledVector(r,yi.z),c)}static getInterpolatedAttribute(t,n,i,s,a,o){return cd.setScalar(0),ld.setScalar(0),dd.setScalar(0),cd.fromBufferAttribute(t,n),ld.fromBufferAttribute(t,i),dd.fromBufferAttribute(t,s),o.setScalar(0),o.addScaledVector(cd,a.x),o.addScaledVector(ld,a.y),o.addScaledVector(dd,a.z),o}static isFrontFacing(t,n,i,s){return Hn.subVectors(i,n),Mi.subVectors(t,n),Hn.cross(Mi).dot(s)<0}set(t,n,i){return this.a.copy(t),this.b.copy(n),this.c.copy(i),this}setFromPointsAndIndices(t,n,i,s){return this.a.copy(t[n]),this.b.copy(t[i]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,n,i,s){return this.a.fromBufferAttribute(t,n),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Hn.subVectors(this.c,this.b),Mi.subVectors(this.a,this.b),Hn.cross(Mi).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return qn.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return qn.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,i,s,a){return qn.getInterpolation(t,this.a,this.b,this.c,n,i,s,a)}containsPoint(t){return qn.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return qn.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,n){const i=this.a,s=this.b,a=this.c;let o,r;ca.subVectors(s,i),la.subVectors(a,i),ad.subVectors(t,i);const c=ca.dot(ad),l=la.dot(ad);if(c<=0&&l<=0)return n.copy(i);od.subVectors(t,s);const d=ca.dot(od),f=la.dot(od);if(d>=0&&f<=d)return n.copy(s);const u=c*f-d*l;if(u<=0&&c>=0&&d<=0)return o=c/(c-d),n.copy(i).addScaledVector(ca,o);rd.subVectors(t,a);const h=ca.dot(rd),m=la.dot(rd);if(m>=0&&h<=m)return n.copy(a);const _=h*l-c*m;if(_<=0&&l>=0&&m<=0)return r=l/(l-m),n.copy(i).addScaledVector(la,r);const x=d*m-h*f;if(x<=0&&f-d>=0&&h-m>=0)return J0.subVectors(a,s),r=(f-d)/(f-d+(h-m)),n.copy(s).addScaledVector(J0,r);const p=1/(x+_+u);return o=_*p,r=u*p,n.copy(i).addScaledVector(ca,o).addScaledVector(la,r)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}class Za{constructor(t=new q(1/0,1/0,1/0),n=new q(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=n}set(t,n){return this.min.copy(t),this.max.copy(n),this}setFromArray(t){this.makeEmpty();for(let n=0,i=t.length;n<i;n+=3)this.expandByPoint(Vn.fromArray(t,n));return this}setFromBufferAttribute(t){this.makeEmpty();for(let n=0,i=t.count;n<i;n++)this.expandByPoint(Vn.fromBufferAttribute(t,n));return this}setFromPoints(t){this.makeEmpty();for(let n=0,i=t.length;n<i;n++)this.expandByPoint(t[n]);return this}setFromCenterAndSize(t,n){const i=Vn.copy(n).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,n=!1){return this.makeEmpty(),this.expandByObject(t,n)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,n=!1){t.updateWorldMatrix(!1,!1);const i=t.geometry;if(i!==void 0){const a=i.getAttribute("position");if(n===!0&&a!==void 0&&t.isInstancedMesh!==!0)for(let o=0,r=a.count;o<r;o++)t.isMesh===!0?t.getVertexPosition(o,Vn):Vn.fromBufferAttribute(a,o),Vn.applyMatrix4(t.matrixWorld),this.expandByPoint(Vn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Hr.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Hr.copy(i.boundingBox)),Hr.applyMatrix4(t.matrixWorld),this.union(Hr)}const s=t.children;for(let a=0,o=s.length;a<o;a++)this.expandByObject(s[a],n);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,n){return n.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Vn),Vn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let n,i;return t.normal.x>0?(n=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(n=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(n+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(n+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(n+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(n+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),n<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(lo),Vr.subVectors(this.max,lo),da.subVectors(t.a,lo),fa.subVectors(t.b,lo),ua.subVectors(t.c,lo),Xi.subVectors(fa,da),$i.subVectors(ua,fa),fs.subVectors(da,ua);let n=[0,-Xi.z,Xi.y,0,-$i.z,$i.y,0,-fs.z,fs.y,Xi.z,0,-Xi.x,$i.z,0,-$i.x,fs.z,0,-fs.x,-Xi.y,Xi.x,0,-$i.y,$i.x,0,-fs.y,fs.x,0];return!fd(n,da,fa,ua,Vr)||(n=[1,0,0,0,1,0,0,0,1],!fd(n,da,fa,ua,Vr))?!1:(Wr.crossVectors(Xi,$i),n=[Wr.x,Wr.y,Wr.z],fd(n,da,fa,ua,Vr))}clampPoint(t,n){return n.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Vn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Vn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(bi[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),bi[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),bi[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),bi[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),bi[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),bi[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),bi[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),bi[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(bi),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}}const bi=[new q,new q,new q,new q,new q,new q,new q,new q],Vn=new q,Hr=new Za,da=new q,fa=new q,ua=new q,Xi=new q,$i=new q,fs=new q,lo=new q,Vr=new q,Wr=new q,us=new q;function fd(e,t,n,i,s){for(let a=0,o=e.length-3;a<=o;a+=3){us.fromArray(e,a);const r=s.x*Math.abs(us.x)+s.y*Math.abs(us.y)+s.z*Math.abs(us.z),c=t.dot(us),l=n.dot(us),d=i.dot(us);if(Math.max(-Math.max(c,l,d),Math.min(c,l,d))>r)return!1}return!0}const Pe=new q,kr=new Ct;let c_=0;class un extends Ys{constructor(t,n,i=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:c_++}),this.name="",this.array=t,this.itemSize=n,this.count=t!==void 0?t.length/n:0,this.normalized=i,this.usage=V1,this.updateRanges=[],this.gpuType=oi,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,n){this.updateRanges.push({start:t,count:n})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,n,i){t*=this.itemSize,i*=n.itemSize;for(let s=0,a=this.itemSize;s<a;s++)this.array[t+s]=n.array[i+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let n=0,i=this.count;n<i;n++)kr.fromBufferAttribute(this,n),kr.applyMatrix3(t),this.setXY(n,kr.x,kr.y);else if(this.itemSize===3)for(let n=0,i=this.count;n<i;n++)Pe.fromBufferAttribute(this,n),Pe.applyMatrix3(t),this.setXYZ(n,Pe.x,Pe.y,Pe.z);return this}applyMatrix4(t){for(let n=0,i=this.count;n<i;n++)Pe.fromBufferAttribute(this,n),Pe.applyMatrix4(t),this.setXYZ(n,Pe.x,Pe.y,Pe.z);return this}applyNormalMatrix(t){for(let n=0,i=this.count;n<i;n++)Pe.fromBufferAttribute(this,n),Pe.applyNormalMatrix(t),this.setXYZ(n,Pe.x,Pe.y,Pe.z);return this}transformDirection(t){for(let n=0,i=this.count;n<i;n++)Pe.fromBufferAttribute(this,n),Pe.transformDirection(t),this.setXYZ(n,Pe.x,Pe.y,Pe.z);return this}set(t,n=0){return this.array.set(t,n),this}getComponent(t,n){let i=this.array[t*this.itemSize+n];return this.normalized&&(i=ro(i,this.array)),i}setComponent(t,n,i){return this.normalized&&(i=cn(i,this.array)),this.array[t*this.itemSize+n]=i,this}getX(t){let n=this.array[t*this.itemSize];return this.normalized&&(n=ro(n,this.array)),n}setX(t,n){return this.normalized&&(n=cn(n,this.array)),this.array[t*this.itemSize]=n,this}getY(t){let n=this.array[t*this.itemSize+1];return this.normalized&&(n=ro(n,this.array)),n}setY(t,n){return this.normalized&&(n=cn(n,this.array)),this.array[t*this.itemSize+1]=n,this}getZ(t){let n=this.array[t*this.itemSize+2];return this.normalized&&(n=ro(n,this.array)),n}setZ(t,n){return this.normalized&&(n=cn(n,this.array)),this.array[t*this.itemSize+2]=n,this}getW(t){let n=this.array[t*this.itemSize+3];return this.normalized&&(n=ro(n,this.array)),n}setW(t,n){return this.normalized&&(n=cn(n,this.array)),this.array[t*this.itemSize+3]=n,this}setXY(t,n,i){return t*=this.itemSize,this.normalized&&(n=cn(n,this.array),i=cn(i,this.array)),this.array[t+0]=n,this.array[t+1]=i,this}setXYZ(t,n,i,s){return t*=this.itemSize,this.normalized&&(n=cn(n,this.array),i=cn(i,this.array),s=cn(s,this.array)),this.array[t+0]=n,this.array[t+1]=i,this.array[t+2]=s,this}setXYZW(t,n,i,s,a){return t*=this.itemSize,this.normalized&&(n=cn(n,this.array),i=cn(i,this.array),s=cn(s,this.array),a=cn(a,this.array)),this.array[t+0]=n,this.array[t+1]=i,this.array[t+2]=s,this.array[t+3]=a,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}}class Om extends un{constructor(t,n,i){super(new Uint16Array(t),n,i)}}class Fm extends un{constructor(t,n,i){super(new Uint32Array(t),n,i)}}class le extends un{constructor(t,n,i){super(new Float32Array(t),n,i)}}const l_=new Za,fo=new q,ud=new q;class Nu{constructor(t=new q,n=-1){this.isSphere=!0,this.center=t,this.radius=n}set(t,n){return this.center.copy(t),this.radius=n,this}setFromPoints(t,n){const i=this.center;n!==void 0?i.copy(n):l_.setFromPoints(t).getCenter(i);let s=0;for(let a=0,o=t.length;a<o;a++)s=Math.max(s,i.distanceToSquared(t[a]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const n=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=n*n}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,n){const i=this.center.distanceToSquared(t);return n.copy(t),i>this.radius*this.radius&&(n.sub(this.center).normalize(),n.multiplyScalar(this.radius).add(this.center)),n}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;fo.subVectors(t,this.center);const n=fo.lengthSq();if(n>this.radius*this.radius){const i=Math.sqrt(n),s=(i-this.radius)*.5;this.center.addScaledVector(fo,s/i),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(ud.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(fo.copy(t.center).add(ud)),this.expandByPoint(fo.copy(t.center).sub(ud))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}}let d_=0;const An=new we,hd=new ke,ha=new q,mn=new Za,uo=new Za,Be=new q;class Le extends Ys{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:d_++}),this.uuid=qa(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(W1(t)?Fm:Om)(t,1):this.index=t,this}setIndirect(t,n=0){return this.indirect=t,this.indirectOffset=n,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,n){return this.attributes[t]=n,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,n,i=0){this.groups.push({start:t,count:n,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,n){this.drawRange.start=t,this.drawRange.count=n}applyMatrix4(t){const n=this.attributes.position;n!==void 0&&(n.applyMatrix4(t),n.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const a=new te().getNormalMatrix(t);i.applyNormalMatrix(a),i.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return An.makeRotationFromQuaternion(t),this.applyMatrix4(An),this}rotateX(t){return An.makeRotationX(t),this.applyMatrix4(An),this}rotateY(t){return An.makeRotationY(t),this.applyMatrix4(An),this}rotateZ(t){return An.makeRotationZ(t),this.applyMatrix4(An),this}translate(t,n,i){return An.makeTranslation(t,n,i),this.applyMatrix4(An),this}scale(t,n,i){return An.makeScale(t,n,i),this.applyMatrix4(An),this}lookAt(t){return hd.lookAt(t),hd.updateMatrix(),this.applyMatrix4(hd.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ha).negate(),this.translate(ha.x,ha.y,ha.z),this}setFromPoints(t){const n=this.getAttribute("position");if(n===void 0){const i=[];for(let s=0,a=t.length;s<a;s++){const o=t[s];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new le(i,3))}else{const i=Math.min(t.length,n.count);for(let s=0;s<i;s++){const a=t[s];n.setXYZ(s,a.x,a.y,a.z||0)}t.length>n.count&&Jt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),n.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Za);const t=this.attributes.position,n=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){ce("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new q(-1/0,-1/0,-1/0),new q(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),n)for(let i=0,s=n.length;i<s;i++){const a=n[i];mn.setFromBufferAttribute(a),this.morphTargetsRelative?(Be.addVectors(this.boundingBox.min,mn.min),this.boundingBox.expandByPoint(Be),Be.addVectors(this.boundingBox.max,mn.max),this.boundingBox.expandByPoint(Be)):(this.boundingBox.expandByPoint(mn.min),this.boundingBox.expandByPoint(mn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&ce('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Nu);const t=this.attributes.position,n=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){ce("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new q,1/0);return}if(t){const i=this.boundingSphere.center;if(mn.setFromBufferAttribute(t),n)for(let a=0,o=n.length;a<o;a++){const r=n[a];uo.setFromBufferAttribute(r),this.morphTargetsRelative?(Be.addVectors(mn.min,uo.min),mn.expandByPoint(Be),Be.addVectors(mn.max,uo.max),mn.expandByPoint(Be)):(mn.expandByPoint(uo.min),mn.expandByPoint(uo.max))}mn.getCenter(i);let s=0;for(let a=0,o=t.count;a<o;a++)Be.fromBufferAttribute(t,a),s=Math.max(s,i.distanceToSquared(Be));if(n)for(let a=0,o=n.length;a<o;a++){const r=n[a],c=this.morphTargetsRelative;for(let l=0,d=r.count;l<d;l++)Be.fromBufferAttribute(r,l),c&&(ha.fromBufferAttribute(t,l),Be.add(ha)),s=Math.max(s,i.distanceToSquared(Be))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&ce('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,n=this.attributes;if(t===null||n.position===void 0||n.normal===void 0||n.uv===void 0){ce("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=n.position,s=n.normal,a=n.uv;let o=this.getAttribute("tangent");(o===void 0||o.count!==i.count)&&(o=new un(new Float32Array(4*i.count),4),this.setAttribute("tangent",o));const r=[],c=[];for(let M=0;M<i.count;M++)r[M]=new q,c[M]=new q;const l=new q,d=new q,f=new q,u=new Ct,h=new Ct,m=new Ct,_=new q,x=new q;function p(M,E,A){l.fromBufferAttribute(i,M),d.fromBufferAttribute(i,E),f.fromBufferAttribute(i,A),u.fromBufferAttribute(a,M),h.fromBufferAttribute(a,E),m.fromBufferAttribute(a,A),d.sub(l),f.sub(l),h.sub(u),m.sub(u);const R=1/(h.x*m.y-m.x*h.y);isFinite(R)&&(_.copy(d).multiplyScalar(m.y).addScaledVector(f,-h.y).multiplyScalar(R),x.copy(f).multiplyScalar(h.x).addScaledVector(d,-m.x).multiplyScalar(R),r[M].add(_),r[E].add(_),r[A].add(_),c[M].add(x),c[E].add(x),c[A].add(x))}let v=this.groups;v.length===0&&(v=[{start:0,count:t.count}]);for(let M=0,E=v.length;M<E;++M){const A=v[M],R=A.start,D=A.count;for(let O=R,P=R+D;O<P;O+=3)p(t.getX(O+0),t.getX(O+1),t.getX(O+2))}const y=new q,g=new q,b=new q,S=new q;function T(M){b.fromBufferAttribute(s,M),S.copy(b);const E=r[M];y.copy(E),y.sub(b.multiplyScalar(b.dot(E))).normalize(),g.crossVectors(S,E);const R=g.dot(c[M])<0?-1:1;o.setXYZW(M,y.x,y.y,y.z,R)}for(let M=0,E=v.length;M<E;++M){const A=v[M],R=A.start,D=A.count;for(let O=R,P=R+D;O<P;O+=3)T(t.getX(O+0)),T(t.getX(O+1)),T(t.getX(O+2))}this._transformed=!0}computeVertexNormals(){const t=this.index,n=this.getAttribute("position");if(n!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==n.count)i=new un(new Float32Array(n.count*3),3),this.setAttribute("normal",i);else for(let u=0,h=i.count;u<h;u++)i.setXYZ(u,0,0,0);const s=new q,a=new q,o=new q,r=new q,c=new q,l=new q,d=new q,f=new q;if(t)for(let u=0,h=t.count;u<h;u+=3){const m=t.getX(u+0),_=t.getX(u+1),x=t.getX(u+2);s.fromBufferAttribute(n,m),a.fromBufferAttribute(n,_),o.fromBufferAttribute(n,x),d.subVectors(o,a),f.subVectors(s,a),d.cross(f),r.fromBufferAttribute(i,m),c.fromBufferAttribute(i,_),l.fromBufferAttribute(i,x),r.add(d),c.add(d),l.add(d),i.setXYZ(m,r.x,r.y,r.z),i.setXYZ(_,c.x,c.y,c.z),i.setXYZ(x,l.x,l.y,l.z)}else for(let u=0,h=n.count;u<h;u+=3)s.fromBufferAttribute(n,u+0),a.fromBufferAttribute(n,u+1),o.fromBufferAttribute(n,u+2),d.subVectors(o,a),f.subVectors(s,a),d.cross(f),i.setXYZ(u+0,d.x,d.y,d.z),i.setXYZ(u+1,d.x,d.y,d.z),i.setXYZ(u+2,d.x,d.y,d.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let n=0,i=t.count;n<i;n++)Be.fromBufferAttribute(t,n),Be.normalize(),t.setXYZ(n,Be.x,Be.y,Be.z)}toNonIndexed(){function t(r,c){const l=r.array,d=r.itemSize,f=r.normalized,u=new l.constructor(c.length*d);let h=0,m=0;for(let _=0,x=c.length;_<x;_++){r.isInterleavedBufferAttribute?h=c[_]*r.data.stride+r.offset:h=c[_]*d;for(let p=0;p<d;p++)u[m++]=l[h++]}return new un(u,d,f)}if(this.index===null)return Jt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const n=new Le,i=this.index.array,s=this.attributes;for(const r in s){const c=s[r],l=t(c,i);n.setAttribute(r,l)}const a=this.morphAttributes;for(const r in a){const c=[],l=a[r];for(let d=0,f=l.length;d<f;d++){const u=l[d],h=t(u,i);c.push(h)}n.morphAttributes[r]=c}n.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let r=0,c=o.length;r<c;r++){const l=o[r];n.addGroup(l.start,l.count,l.materialIndex)}return n}toJSON(){const t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(t[l]=c[l]);return t}t.data={attributes:{}};const n=this.index;n!==null&&(t.data.index={type:n.array.constructor.name,array:Array.prototype.slice.call(n.array)});const i=this.attributes;for(const c in i){const l=i[c];t.data.attributes[c]=l.toJSON(t.data)}const s={};let a=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],d=[];for(let f=0,u=l.length;f<u;f++){const h=l[f];d.push(h.toJSON(t.data))}d.length>0&&(s[c]=d,a=!0)}a&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));const r=this.boundingSphere;return r!==null&&(t.data.boundingSphere=r.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const n={};this.name=t.name;const i=t.index;i!==null&&this.setIndex(i.clone());const s=t.attributes;for(const l in s){const d=s[l];this.setAttribute(l,d.clone(n))}const a=t.morphAttributes;for(const l in a){const d=[],f=a[l];for(let u=0,h=f.length;u<h;u++)d.push(f[u].clone(n));this.morphAttributes[l]=d}this.morphTargetsRelative=t.morphTargetsRelative;const o=t.groups;for(let l=0,d=o.length;l<d;l++){const f=o[l];this.addGroup(f.start,f.count,f.materialIndex)}const r=t.boundingBox;r!==null&&(this.boundingBox=r.clone());const c=t.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}const pd=new q,f_=new q,u_=new te;class ji{constructor(t=new q(1,0,0),n=0){this.isPlane=!0,this.normal=t,this.constant=n}set(t,n){return this.normal.copy(t),this.constant=n,this}setComponents(t,n,i,s){return this.normal.set(t,n,i),this.constant=s,this}setFromNormalAndCoplanarPoint(t,n){return this.normal.copy(t),this.constant=-n.dot(this.normal),this}setFromCoplanarPoints(t,n,i){const s=pd.subVectors(i,n).cross(f_.subVectors(t,n)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,n){return n.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,n,i=!0){const s=t.delta(pd),a=this.normal.dot(s);if(a===0)return this.distanceToPoint(t.start)===0?n.copy(t.start):null;const o=-(t.start.dot(this.normal)+this.constant)/a;return i===!0&&(o<0||o>1)?null:n.copy(t.start).addScaledVector(s,o)}intersectsLine(t){const n=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return n<0&&i>0||i<0&&n>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,n){const i=n||u_.getNormalMatrix(t),s=this.coplanarPoint(pd).applyMatrix4(t),a=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(a),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}}let h_=0;class Ka extends Ys{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:h_++}),this.uuid=qa(),this.name="",this.type="Material",this.blending=Oo,this.side=Ds,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=xm,this.blendDst=gm,this.blendEquation=ba,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ee(0,0,0),this.blendAlpha=0,this.depthFunc=jo,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=N1,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Yl,this.stencilZFail=Yl,this.stencilZPass=Yl,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const n in t){const i=t[n];if(i===void 0){Jt(`Material: parameter '${n}' has value of undefined.`);continue}const s=this[n];if(s===void 0){Jt(`Material: '${n}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector2&&i&&i.isVector2||s&&s.isEuler&&i&&i.isEuler||s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[n]=i}}toJSON(t){const n=t===void 0||typeof t=="string";n&&(t={textures:{},images:{}});const i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(a=>a.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(a){const o=[];for(const r in a){const c=a[r];delete c.metadata,o.push(c)}return o}if(n){const a=s(t.textures),o=s(t.images);a.length>0&&(i.textures=a),o.length>0&&(i.images=o)}return i}fromJSON(t,n){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new ee().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(i=>new ji().fromJSON(i))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=n[t.map]||null),t.matcap!==void 0&&(this.matcap=n[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=n[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=n[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=n[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let i=t.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new Ct().fromArray(i)}return t.displacementMap!==void 0&&(this.displacementMap=n[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=n[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=n[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=n[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=n[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=n[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=n[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=n[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=n[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=n[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=n[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=n[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=n[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=n[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Ct().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=n[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=n[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=n[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=n[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=n[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=n[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=n[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const n=t.clippingPlanes;let i=null;if(n!==null){const s=n.length;i=new Array(s);for(let a=0;a!==s;++a)i[a]=n[a].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}const Si=new q,md=new q,Xr=new q,$r=new q;class p_{constructor(t=new q,n=new q(0,0,-1)){this.origin=t,this.direction=n}set(t,n){return this.origin.copy(t),this.direction.copy(n),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,n){return n.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Si)),this}closestPointToPoint(t,n){n.subVectors(t,this.origin);const i=n.dot(this.direction);return i<0?n.copy(this.origin):n.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const n=Si.subVectors(t,this.origin).dot(this.direction);return n<0?this.origin.distanceToSquared(t):(Si.copy(this.origin).addScaledVector(this.direction,n),Si.distanceToSquared(t))}distanceSqToSegment(t,n,i,s){md.copy(t).add(n).multiplyScalar(.5),Xr.copy(n).sub(t).normalize(),$r.copy(this.origin).sub(md);const a=t.distanceTo(n)*.5,o=-this.direction.dot(Xr),r=$r.dot(this.direction),c=-$r.dot(Xr),l=$r.lengthSq(),d=Math.abs(1-o*o);let f,u,h,m;if(d>0)if(f=o*c-r,u=o*r-c,m=a*d,f>=0)if(u>=-m)if(u<=m){const _=1/d;f*=_,u*=_,h=f*(f+o*u+2*r)+u*(o*f+u+2*c)+l}else u=a,f=Math.max(0,-(o*u+r)),h=-f*f+u*(u+2*c)+l;else u=-a,f=Math.max(0,-(o*u+r)),h=-f*f+u*(u+2*c)+l;else u<=-m?(f=Math.max(0,-(-o*a+r)),u=f>0?-a:Math.min(Math.max(-a,-c),a),h=-f*f+u*(u+2*c)+l):u<=m?(f=0,u=Math.min(Math.max(-a,-c),a),h=u*(u+2*c)+l):(f=Math.max(0,-(o*a+r)),u=f>0?a:Math.min(Math.max(-a,-c),a),h=-f*f+u*(u+2*c)+l);else u=o>0?-a:a,f=Math.max(0,-(o*u+r)),h=-f*f+u*(u+2*c)+l;return i&&i.copy(this.origin).addScaledVector(this.direction,f),s&&s.copy(md).addScaledVector(Xr,u),h}intersectSphere(t,n){if(t.radius<0)return null;Si.subVectors(t.center,this.origin);const i=Si.dot(this.direction),s=Si.dot(Si)-i*i,a=t.radius*t.radius;if(s>a)return null;const o=Math.sqrt(a-s),r=i-o,c=i+o;return c<0?null:r<0?this.at(c,n):this.at(r,n)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const n=t.normal.dot(this.direction);if(n===0)return t.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(t.normal)+t.constant)/n;return i>=0?i:null}intersectPlane(t,n){const i=this.distanceToPlane(t);return i===null?null:this.at(i,n)}intersectsPlane(t){const n=t.distanceToPoint(this.origin);return n===0||t.normal.dot(this.direction)*n<0}intersectBox(t,n){let i,s,a,o,r,c;const l=1/this.direction.x,d=1/this.direction.y,f=1/this.direction.z,u=this.origin;return l>=0?(i=(t.min.x-u.x)*l,s=(t.max.x-u.x)*l):(i=(t.max.x-u.x)*l,s=(t.min.x-u.x)*l),d>=0?(a=(t.min.y-u.y)*d,o=(t.max.y-u.y)*d):(a=(t.max.y-u.y)*d,o=(t.min.y-u.y)*d),i>o||a>s||((a>i||isNaN(i))&&(i=a),(o<s||isNaN(s))&&(s=o),f>=0?(r=(t.min.z-u.z)*f,c=(t.max.z-u.z)*f):(r=(t.max.z-u.z)*f,c=(t.min.z-u.z)*f),i>c||r>s)||((r>i||i!==i)&&(i=r),(c<s||s!==s)&&(s=c),s<0)?null:this.at(i>=0?i:s,n)}intersectsBox(t){return this.intersectBox(t,Si)!==null}intersectTriangle(t,n,i,s,a){const o=this.origin,r=this.direction,c=r.x,l=r.y,d=r.z,f=t.x-o.x,u=t.y-o.y,h=t.z-o.z,m=n.x-o.x,_=n.y-o.y,x=n.z-o.z,p=i.x-o.x,v=i.y-o.y,y=i.z-o.z,g=Math.abs(c),b=Math.abs(l),S=Math.abs(d);let T,M,E,A,R,D,O,P,F,V,U,B;if(g>=b&&g>=S?(E=c,D=f,F=m,B=p,c>=0?(T=l,M=d,A=u,R=h,O=_,P=x,V=v,U=y):(T=d,M=l,A=h,R=u,O=x,P=_,V=y,U=v)):b>=S?(E=l,D=u,F=_,B=v,l>=0?(T=d,M=c,A=h,R=f,O=x,P=m,V=y,U=p):(T=c,M=d,A=f,R=h,O=m,P=x,V=p,U=y)):(E=d,D=h,F=x,B=y,d>=0?(T=c,M=l,A=f,R=u,O=m,P=_,V=p,U=v):(T=l,M=c,A=u,R=f,O=_,P=m,V=v,U=p)),E===0)return null;const I=T/E,G=M/E,$=1/E,J=A-I*D,it=R-G*D,Tt=O-I*F,H=P-G*F,tt=V-I*B,k=U-G*B,W=tt*H-k*Tt,at=J*k-it*tt,ht=Tt*it-H*J;if(s){if(W<0||at<0||ht<0)return null}else if((W<0||at<0||ht<0)&&(W>0||at>0||ht>0))return null;const dt=W+at+ht;if(dt===0)return null;const gt=$*(W*D+at*F+ht*B);return(dt>0?gt<0:gt>0)?null:this.at(gt/dt,a)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class wl extends Ka{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new ee(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Bi,this.combine=Eu,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const Q0=new we,hs=new p_,qr=new Nu,j0=new q,Yr=new q,Zr=new q,Kr=new q,xd=new q,Jr=new q,th=new q,Qr=new q;class Se extends ke{constructor(t=new Le,n=new wl){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,n){return super.copy(t,n),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){const s=n[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,o=s.length;a<o;a++){const r=s[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[r]=a}}}}getVertexPosition(t,n){const i=this.geometry,s=i.attributes.position,a=i.morphAttributes.position,o=i.morphTargetsRelative;n.fromBufferAttribute(s,t);const r=this.morphTargetInfluences;if(a&&r){Jr.set(0,0,0);for(let c=0,l=a.length;c<l;c++){const d=r[c],f=a[c];d!==0&&(xd.fromBufferAttribute(f,t),o?Jr.addScaledVector(xd,d):Jr.addScaledVector(xd.sub(n),d))}n.add(Jr)}return n}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,n){const i=this.geometry,s=this.material,a=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),qr.copy(i.boundingSphere),qr.applyMatrix4(a),hs.copy(t.ray).recast(t.near),!(qr.containsPoint(hs.origin)===!1&&(hs.intersectSphere(qr,j0)===null||hs.origin.distanceToSquared(j0)>(t.far-t.near)**2))&&(Q0.copy(a).invert(),hs.copy(t.ray).applyMatrix4(Q0),!(i.boundingBox!==null&&hs.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,n,hs)))}_computeIntersections(t,n,i){let s;const a=this.geometry,o=this.material,r=a.index,c=a.attributes.position,l=a.attributes.uv,d=a.attributes.uv1,f=a.attributes.normal,u=a.groups,h=a.drawRange;if(r!==null)if(Array.isArray(o))for(let m=0,_=u.length;m<_;m++){const x=u[m],p=o[x.materialIndex],v=Math.max(x.start,h.start),y=Math.min(r.count,Math.min(x.start+x.count,h.start+h.count));for(let g=v,b=y;g<b;g+=3){const S=r.getX(g),T=r.getX(g+1),M=r.getX(g+2);s=jr(this,p,t,i,l,d,f,S,T,M),s&&(s.faceIndex=Math.floor(g/3),s.face.materialIndex=x.materialIndex,n.push(s))}}else{const m=Math.max(0,h.start),_=Math.min(r.count,h.start+h.count);for(let x=m,p=_;x<p;x+=3){const v=r.getX(x),y=r.getX(x+1),g=r.getX(x+2);s=jr(this,o,t,i,l,d,f,v,y,g),s&&(s.faceIndex=Math.floor(x/3),n.push(s))}}else if(c!==void 0)if(Array.isArray(o))for(let m=0,_=u.length;m<_;m++){const x=u[m],p=o[x.materialIndex],v=Math.max(x.start,h.start),y=Math.min(c.count,Math.min(x.start+x.count,h.start+h.count));for(let g=v,b=y;g<b;g+=3){const S=g,T=g+1,M=g+2;s=jr(this,p,t,i,l,d,f,S,T,M),s&&(s.faceIndex=Math.floor(g/3),s.face.materialIndex=x.materialIndex,n.push(s))}}else{const m=Math.max(0,h.start),_=Math.min(c.count,h.start+h.count);for(let x=m,p=_;x<p;x+=3){const v=x,y=x+1,g=x+2;s=jr(this,o,t,i,l,d,f,v,y,g),s&&(s.faceIndex=Math.floor(x/3),n.push(s))}}}}function m_(e,t,n,i,s,a,o,r){let c;if(t.side===fn?c=i.intersectTriangle(o,a,s,!0,r):c=i.intersectTriangle(s,a,o,t.side===Ds,r),c===null)return null;Qr.copy(r),Qr.applyMatrix4(e.matrixWorld);const l=n.ray.origin.distanceTo(Qr);return l<n.near||l>n.far?null:{distance:l,point:Qr.clone(),object:e}}function jr(e,t,n,i,s,a,o,r,c,l){e.getVertexPosition(r,Yr),e.getVertexPosition(c,Zr),e.getVertexPosition(l,Kr);const d=m_(e,t,n,i,Yr,Zr,Kr,th);if(d){const f=new q;qn.getBarycoord(th,Yr,Zr,Kr,f),s&&(d.uv=qn.getInterpolatedAttribute(s,r,c,l,f,new Ct)),a&&(d.uv1=qn.getInterpolatedAttribute(a,r,c,l,f,new Ct)),o&&(d.normal=qn.getInterpolatedAttribute(o,r,c,l,f,new q),d.normal.dot(i.direction)>0&&d.normal.multiplyScalar(-1));const u={a:r,b:c,c:l,normal:new q,materialIndex:0};qn.getNormal(Yr,Zr,Kr,u.normal),d.face=u,d.barycoord=f}return d}class x_ extends je{constructor(t=null,n=1,i=1,s,a,o,r,c,l=Ve,d=Ve,f,u){super(null,o,r,c,l,d,s,a,f,u),this.isDataTexture=!0,this.image={data:t,width:n,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const ps=new Nu,g_=new Ct(.5,.5),tc=new q;class Uu{constructor(t=new ji,n=new ji,i=new ji,s=new ji,a=new ji,o=new ji){this.planes=[t,n,i,s,a,o]}set(t,n,i,s,a,o){const r=this.planes;return r[0].copy(t),r[1].copy(n),r[2].copy(i),r[3].copy(s),r[4].copy(a),r[5].copy(o),this}copy(t){const n=this.planes;for(let i=0;i<6;i++)n[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,n=ri,i=!1){const s=this.planes,a=t.elements,o=a[0],r=a[1],c=a[2],l=a[3],d=a[4],f=a[5],u=a[6],h=a[7],m=a[8],_=a[9],x=a[10],p=a[11],v=a[12],y=a[13],g=a[14],b=a[15];if(s[0].setComponents(l-o,h-d,p-m,b-v).normalize(),s[1].setComponents(l+o,h+d,p+m,b+v).normalize(),s[2].setComponents(l+r,h+f,p+_,b+y).normalize(),s[3].setComponents(l-r,h-f,p-_,b-y).normalize(),i)s[4].setComponents(c,u,x,g).normalize(),s[5].setComponents(l-c,h-u,p-x,b-g).normalize();else if(s[4].setComponents(l-c,h-u,p-x,b-g).normalize(),n===ri)s[5].setComponents(l+c,h+u,p+x,b+g).normalize();else if(n===ir)s[5].setComponents(c,u,x,g).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+n);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),ps.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const n=t.geometry;n.boundingSphere===null&&n.computeBoundingSphere(),ps.copy(n.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(ps)}intersectsSprite(t){ps.center.set(0,0,0);const n=g_.distanceTo(t.center);return ps.radius=.7071067811865476+n,ps.applyMatrix4(t.matrixWorld),this.intersectsSphere(ps)}intersectsSphere(t){const n=this.planes,i=t.center,s=-t.radius;for(let a=0;a<6;a++)if(n[a].distanceToPoint(i)<s)return!1;return!0}intersectsBox(t){const n=this.planes;for(let i=0;i<6;i++){const s=n[i];if(tc.x=s.normal.x>0?t.max.x:t.min.x,tc.y=s.normal.y>0?t.max.y:t.min.y,tc.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(tc)<0)return!1}return!0}containsPoint(t){const n=this.planes;for(let i=0;i<6;i++)if(n[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class Bm extends je{constructor(t=[],n=Ns,i,s,a,o,r,c,l,d){super(t,n,i,s,a,o,r,c,l,d),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Gm extends je{constructor(t,n,i,s,a,o,r,c,l){super(t,n,i,s,a,o,r,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}}class sr extends je{constructor(t,n,i=fi,s,a,o,r=Ve,c=Ve,l,d=Fi,f=1){if(d!==Fi&&d!==Ss)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const u={width:t,height:n,depth:f};super(u,s,a,o,r,c,d,i,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new Du(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){const n=super.toJSON(t);return n.compareFunction=this.compareFunction,n}}class __ extends sr{constructor(t,n=fi,i=Ns,s,a,o=Ve,r=Ve,c,l=Fi){const d={width:t,height:t,depth:1},f=[d,d,d,d,d,d];super(t,t,n,i,s,a,o,r,c,l),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}}class Hm extends je{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}}class Ja extends Le{constructor(t=1,n=1,i=1,s=1,a=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:n,depth:i,widthSegments:s,heightSegments:a,depthSegments:o};const r=this;s=Math.floor(s),a=Math.floor(a),o=Math.floor(o);const c=[],l=[],d=[],f=[];let u=0,h=0;m("z","y","x",-1,-1,i,n,t,o,a,0),m("z","y","x",1,-1,i,n,-t,o,a,1),m("x","z","y",1,1,t,i,n,s,o,2),m("x","z","y",1,-1,t,i,-n,s,o,3),m("x","y","z",1,-1,t,n,i,s,a,4),m("x","y","z",-1,-1,t,n,-i,s,a,5),this.setIndex(c),this.setAttribute("position",new le(l,3)),this.setAttribute("normal",new le(d,3)),this.setAttribute("uv",new le(f,2));function m(_,x,p,v,y,g,b,S,T,M,E){const A=g/T,R=b/M,D=g/2,O=b/2,P=S/2,F=T+1,V=M+1;let U=0,B=0;const I=new q;for(let G=0;G<V;G++){const $=G*R-O;for(let J=0;J<F;J++){const it=J*A-D;I[_]=it*v,I[x]=$*y,I[p]=P,l.push(I.x,I.y,I.z),I[_]=0,I[x]=0,I[p]=S>0?1:-1,d.push(I.x,I.y,I.z),f.push(J/T),f.push(1-G/M),U+=1}}for(let G=0;G<M;G++)for(let $=0;$<T;$++){const J=u+$+F*G,it=u+$+F*(G+1),Tt=u+($+1)+F*(G+1),H=u+($+1)+F*G;c.push(J,it,H),c.push(it,Tt,H),B+=6}r.addGroup(h,B,E),h+=B,u+=U}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ja(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}class Ou extends Le{constructor(t=1,n=1,i=4,s=8,a=1){super(),this.type="CapsuleGeometry",this.parameters={radius:t,height:n,capSegments:i,radialSegments:s,heightSegments:a},n=Math.max(0,n),i=Math.max(1,Math.floor(i)),s=Math.max(3,Math.floor(s)),a=Math.max(1,Math.floor(a));const o=[],r=[],c=[],l=[],d=n/2,f=Math.PI/2*t,u=n,h=2*f+u,m=i*2+a,_=s+1,x=new q,p=new q;for(let v=0;v<=m;v++){let y=0,g=0,b=0,S=0;if(v<=i){const E=v/i,A=E*Math.PI/2;g=-d-t*Math.cos(A),b=t*Math.sin(A),S=-t*Math.cos(A),y=E*f}else if(v<=i+a){const E=(v-i)/a;g=-d+E*n,b=t,S=0,y=f+E*u}else{const E=(v-i-a)/i,A=E*Math.PI/2;g=d+t*Math.sin(A),b=t*Math.cos(A),S=t*Math.sin(A),y=f+u+E*f}const T=Math.max(0,Math.min(1,y/h));let M=0;v===0?M=.5/s:v===m&&(M=-.5/s);for(let E=0;E<=s;E++){const A=E/s,R=A*Math.PI*2,D=Math.sin(R),O=Math.cos(R);p.x=-b*O,p.y=g,p.z=b*D,r.push(p.x,p.y,p.z),x.set(-b*O,S,b*D),x.normalize(),c.push(x.x,x.y,x.z),l.push(A+M,T)}if(v>0){const E=(v-1)*_;for(let A=0;A<s;A++){const R=E+A,D=E+A+1,O=v*_+A,P=v*_+A+1;o.push(R,D,O),o.push(D,P,O)}}}this.setIndex(o),this.setAttribute("position",new le(r,3)),this.setAttribute("normal",new le(c,3)),this.setAttribute("uv",new le(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ou(t.radius,t.height,t.capSegments,t.radialSegments,t.heightSegments)}}class El extends Le{constructor(t=1,n=1,i=1,s=32,a=1,o=!1,r=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:n,height:i,radialSegments:s,heightSegments:a,openEnded:o,thetaStart:r,thetaLength:c};const l=this;s=Math.floor(s),a=Math.floor(a);const d=[],f=[],u=[],h=[];let m=0;const _=[],x=i/2;let p=0;v(),o===!1&&(t>0&&y(!0),n>0&&y(!1)),this.setIndex(d),this.setAttribute("position",new le(f,3)),this.setAttribute("normal",new le(u,3)),this.setAttribute("uv",new le(h,2));function v(){const g=new q,b=new q;let S=0;const T=(n-t)/i;for(let M=0;M<=a;M++){const E=[],A=M/a,R=A*(n-t)+t;for(let D=0;D<=s;D++){const O=D/s,P=O*c+r,F=Math.sin(P),V=Math.cos(P);b.x=R*F,b.y=-A*i+x,b.z=R*V,f.push(b.x,b.y,b.z),g.set(F,T,V).normalize(),u.push(g.x,g.y,g.z),h.push(O,1-A),E.push(m++)}_.push(E)}for(let M=0;M<s;M++)for(let E=0;E<a;E++){const A=_[E][M],R=_[E+1][M],D=_[E+1][M+1],O=_[E][M+1];(t>0||E!==0)&&(d.push(A,R,O),S+=3),(n>0||E!==a-1)&&(d.push(R,D,O),S+=3)}l.addGroup(p,S,0),p+=S}function y(g){const b=m,S=new Ct,T=new q;let M=0;const E=g===!0?t:n,A=g===!0?1:-1;for(let D=1;D<=s;D++)f.push(0,x*A,0),u.push(0,A,0),h.push(.5,.5),m++;const R=m;for(let D=0;D<=s;D++){const P=D/s*c+r,F=Math.cos(P),V=Math.sin(P);T.x=E*V,T.y=x*A,T.z=E*F,f.push(T.x,T.y,T.z),u.push(0,A,0),S.x=F*.5+.5,S.y=V*.5*A+.5,h.push(S.x,S.y),m++}for(let D=0;D<s;D++){const O=b+D,P=R+D;g===!0?d.push(P,P+1,O):d.push(P+1,P,O),M+=3}l.addGroup(p,M,g===!0?1:2),p+=M}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new El(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Tl extends El{constructor(t=1,n=1,i=32,s=1,a=!1,o=0,r=Math.PI*2){super(0,t,n,i,s,a,o,r),this.type="ConeGeometry",this.parameters={radius:t,height:n,radialSegments:i,heightSegments:s,openEnded:a,thetaStart:o,thetaLength:r}}static fromJSON(t){return new Tl(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class gi{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Jt("Curve: .getPoint() not implemented.")}getPointAt(t,n){const i=this.getUtoTmapping(t);return this.getPoint(i,n)}getPoints(t=5){const n=[];for(let i=0;i<=t;i++)n.push(this.getPoint(i/t));return n}getSpacedPoints(t=5){const n=[];for(let i=0;i<=t;i++)n.push(this.getPointAt(i/t));return n}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const n=[];let i,s=this.getPoint(0),a=0;n.push(0);for(let o=1;o<=t;o++)i=this.getPoint(o/t),a+=i.distanceTo(s),n.push(a),s=i;return this.cacheArcLengths=n,n}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,n=null){const i=this.getLengths();let s=0;const a=i.length;let o;n?o=n:o=t*i[a-1];let r=0,c=a-1,l;for(;r<=c;)if(s=Math.floor(r+(c-r)/2),l=i[s]-o,l<0)r=s+1;else if(l>0)c=s-1;else{c=s;break}if(s=c,i[s]===o)return s/(a-1);const d=i[s],u=i[s+1]-d,h=(o-d)/u;return(s+h)/(a-1)}getTangent(t,n){let s=t-1e-4,a=t+1e-4;s<0&&(s=0),a>1&&(a=1);const o=this.getPoint(s),r=this.getPoint(a),c=n||(o.isVector2?new Ct:new q);return c.copy(r).sub(o).normalize(),c}getTangentAt(t,n){const i=this.getUtoTmapping(t);return this.getTangent(i,n)}computeFrenetFrames(t,n=!1){const i=new q,s=[],a=[],o=[],r=new q,c=new we;for(let h=0;h<=t;h++){const m=h/t;s[h]=this.getTangentAt(m,new q)}a[0]=new q,o[0]=new q;let l=Number.MAX_VALUE;const d=Math.abs(s[0].x),f=Math.abs(s[0].y),u=Math.abs(s[0].z);d<=l&&(l=d,i.set(1,0,0)),f<=l&&(l=f,i.set(0,1,0)),u<=l&&i.set(0,0,1),r.crossVectors(s[0],i).normalize(),a[0].crossVectors(s[0],r),o[0].crossVectors(s[0],a[0]);for(let h=1;h<=t;h++){if(a[h]=a[h-1].clone(),o[h]=o[h-1].clone(),r.crossVectors(s[h-1],s[h]),r.length()>Number.EPSILON){r.normalize();const m=Math.acos(ae(s[h-1].dot(s[h]),-1,1));a[h].applyMatrix4(c.makeRotationAxis(r,m))}o[h].crossVectors(s[h],a[h])}if(n===!0){let h=Math.acos(ae(a[0].dot(a[t]),-1,1));h/=t,s[0].dot(r.crossVectors(a[0],a[t]))>0&&(h=-h);for(let m=1;m<=t;m++)a[m].applyMatrix4(c.makeRotationAxis(s[m],h*m)),o[m].crossVectors(s[m],a[m])}return{tangents:s,normals:a,binormals:o}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class Fu extends gi{constructor(t=0,n=0,i=1,s=1,a=0,o=Math.PI*2,r=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=n,this.xRadius=i,this.yRadius=s,this.aStartAngle=a,this.aEndAngle=o,this.aClockwise=r,this.aRotation=c}getPoint(t,n=new Ct){const i=n,s=Math.PI*2;let a=this.aEndAngle-this.aStartAngle;const o=Math.abs(a)<Number.EPSILON;for(;a<0;)a+=s;for(;a>s;)a-=s;a<Number.EPSILON&&(o?a=0:a=s),this.aClockwise===!0&&!o&&(a===s?a=-s:a=a-s);const r=this.aStartAngle+t*a;let c=this.aX+this.xRadius*Math.cos(r),l=this.aY+this.yRadius*Math.sin(r);if(this.aRotation!==0){const d=Math.cos(this.aRotation),f=Math.sin(this.aRotation),u=c-this.aX,h=l-this.aY;c=u*d-h*f+this.aX,l=u*f+h*d+this.aY}return i.set(c,l)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class v_ extends Fu{constructor(t,n,i,s,a,o){super(t,n,i,i,s,a,o),this.isArcCurve=!0,this.type="ArcCurve"}}function Bu(){let e=0,t=0,n=0,i=0;function s(a,o,r,c){e=a,t=r,n=-3*a+3*o-2*r-c,i=2*a-2*o+r+c}return{initCatmullRom:function(a,o,r,c,l){s(o,r,l*(r-a),l*(c-o))},initNonuniformCatmullRom:function(a,o,r,c,l,d,f){let u=(o-a)/l-(r-a)/(l+d)+(r-o)/d,h=(r-o)/d-(c-o)/(d+f)+(c-r)/f;u*=d,h*=d,s(o,r,u,h)},calc:function(a){const o=a*a,r=o*a;return e+t*a+n*o+i*r}}}const eh=new q,nh=new q,gd=new Bu,_d=new Bu,vd=new Bu;class Vm extends gi{constructor(t=[],n=!1,i="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=n,this.curveType=i,this.tension=s}getPoint(t,n=new q){const i=n,s=this.points,a=s.length,o=(a-(this.closed?0:1))*t;let r=Math.floor(o),c=o-r;this.closed?r+=r>0?0:(Math.floor(Math.abs(r)/a)+1)*a:c===0&&r===a-1&&(r=a-2,c=1);let l,d;this.closed||r>0?l=s[(r-1)%a]:(nh.subVectors(s[0],s[1]).add(s[0]),l=nh);const f=s[r%a],u=s[(r+1)%a];if(this.closed||r+2<a?d=s[(r+2)%a]:(eh.subVectors(s[a-1],s[a-2]).add(s[a-1]),d=eh),this.curveType==="centripetal"||this.curveType==="chordal"){const h=this.curveType==="chordal"?.5:.25;let m=Math.pow(l.distanceToSquared(f),h),_=Math.pow(f.distanceToSquared(u),h),x=Math.pow(u.distanceToSquared(d),h);_<1e-4&&(_=1),m<1e-4&&(m=_),x<1e-4&&(x=_),gd.initNonuniformCatmullRom(l.x,f.x,u.x,d.x,m,_,x),_d.initNonuniformCatmullRom(l.y,f.y,u.y,d.y,m,_,x),vd.initNonuniformCatmullRom(l.z,f.z,u.z,d.z,m,_,x)}else this.curveType==="catmullrom"&&(gd.initCatmullRom(l.x,f.x,u.x,d.x,this.tension),_d.initCatmullRom(l.y,f.y,u.y,d.y,this.tension),vd.initCatmullRom(l.z,f.z,u.z,d.z,this.tension));return i.set(gd.calc(c),_d.calc(c),vd.calc(c)),i}copy(t){super.copy(t),this.points=[];for(let n=0,i=t.points.length;n<i;n++){const s=t.points[n];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let n=0,i=this.points.length;n<i;n++){const s=this.points[n];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let n=0,i=t.points.length;n<i;n++){const s=t.points[n];this.points.push(new q().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function ih(e,t,n,i,s){const a=(i-t)*.5,o=(s-n)*.5,r=e*e,c=e*r;return(2*n-2*i+a+o)*c+(-3*n+3*i-2*a-o)*r+a*e+n}function M_(e,t){const n=1-e;return n*n*t}function y_(e,t){return 2*(1-e)*e*t}function b_(e,t){return e*e*t}function Fo(e,t,n,i){return M_(e,t)+y_(e,n)+b_(e,i)}function S_(e,t){const n=1-e;return n*n*n*t}function w_(e,t){const n=1-e;return 3*n*n*e*t}function E_(e,t){return 3*(1-e)*e*e*t}function T_(e,t){return e*e*e*t}function Bo(e,t,n,i,s){return S_(e,t)+w_(e,n)+E_(e,i)+T_(e,s)}class Wm extends gi{constructor(t=new Ct,n=new Ct,i=new Ct,s=new Ct){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=n,this.v2=i,this.v3=s}getPoint(t,n=new Ct){const i=n,s=this.v0,a=this.v1,o=this.v2,r=this.v3;return i.set(Bo(t,s.x,a.x,o.x,r.x),Bo(t,s.y,a.y,o.y,r.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class A_ extends gi{constructor(t=new q,n=new q,i=new q,s=new q){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=n,this.v2=i,this.v3=s}getPoint(t,n=new q){const i=n,s=this.v0,a=this.v1,o=this.v2,r=this.v3;return i.set(Bo(t,s.x,a.x,o.x,r.x),Bo(t,s.y,a.y,o.y,r.y),Bo(t,s.z,a.z,o.z,r.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class km extends gi{constructor(t=new Ct,n=new Ct){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=n}getPoint(t,n=new Ct){const i=n;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,n){return this.getPoint(t,n)}getTangent(t,n=new Ct){return n.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,n){return this.getTangent(t,n)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class z_ extends gi{constructor(t=new q,n=new q){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=n}getPoint(t,n=new q){const i=n;return t===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(t).add(this.v1)),i}getPointAt(t,n){return this.getPoint(t,n)}getTangent(t,n=new q){return n.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,n){return this.getTangent(t,n)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Xm extends gi{constructor(t=new Ct,n=new Ct,i=new Ct){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=n,this.v2=i}getPoint(t,n=new Ct){const i=n,s=this.v0,a=this.v1,o=this.v2;return i.set(Fo(t,s.x,a.x,o.x),Fo(t,s.y,a.y,o.y)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class $m extends gi{constructor(t=new q,n=new q,i=new q){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=n,this.v2=i}getPoint(t,n=new q){const i=n,s=this.v0,a=this.v1,o=this.v2;return i.set(Fo(t,s.x,a.x,o.x),Fo(t,s.y,a.y,o.y),Fo(t,s.z,a.z,o.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class qm extends gi{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,n=new Ct){const i=n,s=this.points,a=(s.length-1)*t,o=Math.floor(a),r=a-o,c=s[o===0?o:o-1],l=s[o],d=s[o>s.length-2?s.length-1:o+1],f=s[o>s.length-3?s.length-1:o+2];return i.set(ih(r,c.x,l.x,d.x,f.x),ih(r,c.y,l.y,d.y,f.y)),i}copy(t){super.copy(t),this.points=[];for(let n=0,i=t.points.length;n<i;n++){const s=t.points[n];this.points.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let n=0,i=this.points.length;n<i;n++){const s=this.points[n];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let n=0,i=t.points.length;n<i;n++){const s=t.points[n];this.points.push(new Ct().fromArray(s))}return this}}var Kc=Object.freeze({__proto__:null,ArcCurve:v_,CatmullRomCurve3:Vm,CubicBezierCurve:Wm,CubicBezierCurve3:A_,EllipseCurve:Fu,LineCurve:km,LineCurve3:z_,QuadraticBezierCurve:Xm,QuadraticBezierCurve3:$m,SplineCurve:qm});class R_ extends gi{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),n=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(n)){const i=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Kc[i](n,t))}return this}getPoint(t,n){const i=t*this.getLength(),s=this.getCurveLengths();let a=0;for(;a<s.length;){if(s[a]>=i){const o=s[a]-i,r=this.curves[a],c=r.getLength(),l=c===0?0:1-o/c;return r.getPointAt(l,n)}a++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let n=0;for(let i=0,s=this.curves.length;i<s;i++)n+=this.curves[i].getLength(),t.push(n);return this.cacheLengths=t,t}getSpacedPoints(t=40){const n=[];for(let i=0;i<=t;i++)n.push(this.getPoint(i/t));return this.autoClose&&n.push(n[0]),n}getPoints(t=12){const n=[];let i;for(let s=0,a=this.curves;s<a.length;s++){const o=a[s],r=o.isEllipseCurve?t*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?t*o.points.length:t,c=o.getPoints(r);for(let l=0;l<c.length;l++){const d=c[l];i&&i.equals(d)||(n.push(d),i=d)}}return this.autoClose&&n.length>1&&!n[n.length-1].equals(n[0])&&n.push(n[0]),n}copy(t){super.copy(t),this.curves=[];for(let n=0,i=t.curves.length;n<i;n++){const s=t.curves[n];this.curves.push(s.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let n=0,i=this.curves.length;n<i;n++){const s=this.curves[n];t.curves.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let n=0,i=t.curves.length;n<i;n++){const s=t.curves[n];this.curves.push(new Kc[s.type]().fromJSON(s))}return this}}class ar extends R_{constructor(t){super(),this.type="Path",this.currentPoint=new Ct,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let n=1,i=t.length;n<i;n++)this.lineTo(t[n].x,t[n].y);return this}moveTo(t,n){return this.currentPoint.set(t,n),this}lineTo(t,n){const i=new km(this.currentPoint.clone(),new Ct(t,n));return this.curves.push(i),this.currentPoint.set(t,n),this}quadraticCurveTo(t,n,i,s){const a=new Xm(this.currentPoint.clone(),new Ct(t,n),new Ct(i,s));return this.curves.push(a),this.currentPoint.set(i,s),this}bezierCurveTo(t,n,i,s,a,o){const r=new Wm(this.currentPoint.clone(),new Ct(t,n),new Ct(i,s),new Ct(a,o));return this.curves.push(r),this.currentPoint.set(a,o),this}splineThru(t){const n=[this.currentPoint.clone()].concat(t),i=new qm(n);return this.curves.push(i),this.currentPoint.copy(t[t.length-1]),this}arc(t,n,i,s,a,o){const r=this.currentPoint.x,c=this.currentPoint.y;return this.absarc(t+r,n+c,i,s,a,o),this}absarc(t,n,i,s,a,o){return this.absellipse(t,n,i,i,s,a,o),this}ellipse(t,n,i,s,a,o,r,c){const l=this.currentPoint.x,d=this.currentPoint.y;return this.absellipse(t+l,n+d,i,s,a,o,r,c),this}absellipse(t,n,i,s,a,o,r,c){const l=new Fu(t,n,i,s,a,o,r,c);if(this.curves.length>0){const f=l.getPoint(0);f.equals(this.currentPoint)||this.lineTo(f.x,f.y)}this.curves.push(l);const d=l.getPoint(1);return this.currentPoint.copy(d),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class cs extends ar{constructor(t){super(t),this.uuid=qa(),this.type="Shape",this.holes=[]}getPointsHoles(t){const n=[];for(let i=0,s=this.holes.length;i<s;i++)n[i]=this.holes[i].getPoints(t);return n}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let n=0,i=t.holes.length;n<i;n++){const s=t.holes[n];this.holes.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let n=0,i=this.holes.length;n<i;n++){const s=this.holes[n];t.holes.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let n=0,i=t.holes.length;n<i;n++){const s=t.holes[n];this.holes.push(new ar().fromJSON(s))}return this}}function C_(e,t,n=2){const i=t&&t.length,s=i?t[0]*n:e.length;let a=Ym(e,0,s,n,!0);const o=[];if(!a||a.next===a.prev)return o;let r,c,l;if(i&&(a=N_(e,t,a,n)),e.length>80*n){r=e[0],c=e[1];let d=r,f=c;for(let u=n;u<s;u+=n){const h=e[u],m=e[u+1];h<r&&(r=h),m<c&&(c=m),h>d&&(d=h),m>f&&(f=m)}l=Math.max(d-r,f-c),l=l!==0?32767/l:0}return or(a,o,n,r,c,l,0),o}function Ym(e,t,n,i,s){let a;if(s===$_(e,t,n,i)>0)for(let o=t;o<n;o+=i)a=sh(o/i|0,e[o],e[o+1],a);else for(let o=n-i;o>=t;o-=i)a=sh(o/i|0,e[o],e[o+1],a);return a&&Va(a,a.next)&&(cr(a),a=a.next),a}function Os(e,t){if(!e)return e;t||(t=e);let n=e,i;do if(i=!1,!n.steiner&&(Va(n,n.next)||Ae(n.prev,n,n.next)===0)){if(cr(n),n=t=n.prev,n===n.next)break;i=!0}else n=n.next;while(i||n!==t);return t}function or(e,t,n,i,s,a,o){if(!e)return;!o&&a&&G_(e,i,s,a);let r=e;for(;e.prev!==e.next;){const c=e.prev,l=e.next;if(a?L_(e,i,s,a):P_(e)){t.push(c.i,e.i,l.i),cr(e),e=l.next,r=l.next;continue}if(e=l,e===r){o?o===1?(e=I_(Os(e),t),or(e,t,n,i,s,a,2)):o===2&&D_(e,t,n,i,s,a):or(Os(e),t,n,i,s,a,1);break}}}function P_(e){const t=e.prev,n=e,i=e.next;if(Ae(t,n,i)>=0)return!1;const s=t.x,a=n.x,o=i.x,r=t.y,c=n.y,l=i.y,d=Math.min(s,a,o),f=Math.min(r,c,l),u=Math.max(s,a,o),h=Math.max(r,c,l);let m=i.next;for(;m!==t;){if(m.x>=d&&m.x<=u&&m.y>=f&&m.y<=h&&To(s,r,a,c,o,l,m.x,m.y)&&Ae(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function L_(e,t,n,i){const s=e.prev,a=e,o=e.next;if(Ae(s,a,o)>=0)return!1;const r=s.x,c=a.x,l=o.x,d=s.y,f=a.y,u=o.y,h=Math.min(r,c,l),m=Math.min(d,f,u),_=Math.max(r,c,l),x=Math.max(d,f,u),p=Gf(h,m,t,n,i),v=Gf(_,x,t,n,i);let y=e.prevZ,g=e.nextZ;for(;y&&y.z>=p&&g&&g.z<=v;){if(y.x>=h&&y.x<=_&&y.y>=m&&y.y<=x&&y!==s&&y!==o&&To(r,d,c,f,l,u,y.x,y.y)&&Ae(y.prev,y,y.next)>=0||(y=y.prevZ,g.x>=h&&g.x<=_&&g.y>=m&&g.y<=x&&g!==s&&g!==o&&To(r,d,c,f,l,u,g.x,g.y)&&Ae(g.prev,g,g.next)>=0))return!1;g=g.nextZ}for(;y&&y.z>=p;){if(y.x>=h&&y.x<=_&&y.y>=m&&y.y<=x&&y!==s&&y!==o&&To(r,d,c,f,l,u,y.x,y.y)&&Ae(y.prev,y,y.next)>=0)return!1;y=y.prevZ}for(;g&&g.z<=v;){if(g.x>=h&&g.x<=_&&g.y>=m&&g.y<=x&&g!==s&&g!==o&&To(r,d,c,f,l,u,g.x,g.y)&&Ae(g.prev,g,g.next)>=0)return!1;g=g.nextZ}return!0}function I_(e,t){let n=e;do{const i=n.prev,s=n.next.next;!Va(i,s)&&Km(i,n,n.next,s)&&rr(i,s)&&rr(s,i)&&(t.push(i.i,n.i,s.i),cr(n),cr(n.next),n=e=s),n=n.next}while(n!==e);return Os(n)}function D_(e,t,n,i,s,a){let o=e;do{let r=o.next.next;for(;r!==o.prev;){if(o.i!==r.i&&W_(o,r)){let c=Jm(o,r);o=Os(o,o.next),c=Os(c,c.next),or(o,t,n,i,s,a,0),or(c,t,n,i,s,a,0);return}r=r.next}o=o.next}while(o!==e)}function N_(e,t,n,i){const s=[];for(let a=0,o=t.length;a<o;a++){const r=t[a]*i,c=a<o-1?t[a+1]*i:e.length,l=Ym(e,r,c,i,!1);l===l.next&&(l.steiner=!0),s.push(V_(l))}s.sort(U_);for(let a=0;a<s.length;a++)n=O_(s[a],n);return n}function U_(e,t){let n=e.x-t.x;if(n===0&&(n=e.y-t.y,n===0)){const i=(e.next.y-e.y)/(e.next.x-e.x),s=(t.next.y-t.y)/(t.next.x-t.x);n=i-s}return n}function O_(e,t){const n=F_(e,t);if(!n)return t;const i=Jm(n,e);return Os(i,i.next),Os(n,n.next)}function F_(e,t){let n=t;const i=e.x,s=e.y;let a=-1/0,o;if(Va(e,n))return n;do{if(Va(e,n.next))return n.next;if(s<=n.y&&s>=n.next.y&&n.next.y!==n.y){const f=n.x+(s-n.y)*(n.next.x-n.x)/(n.next.y-n.y);if(f<=i&&f>a&&(a=f,o=n.x<n.next.x?n:n.next,f===i))return o}n=n.next}while(n!==t);if(!o)return null;const r=o,c=o.x,l=o.y;let d=1/0;n=o;do{if(i>=n.x&&n.x>=c&&i!==n.x&&Zm(s<l?i:a,s,c,l,s<l?a:i,s,n.x,n.y)){const f=Math.abs(s-n.y)/(i-n.x);rr(n,e)&&(f<d||f===d&&(n.x>o.x||n.x===o.x&&B_(o,n)))&&(o=n,d=f)}n=n.next}while(n!==r);return o}function B_(e,t){return Ae(e.prev,e,t.prev)<0&&Ae(t.next,e,e.next)<0}function G_(e,t,n,i){let s=e;do s.z===0&&(s.z=Gf(s.x,s.y,t,n,i)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==e);s.prevZ.nextZ=null,s.prevZ=null,H_(s)}function H_(e){let t,n=1;do{let i=e,s;e=null;let a=null;for(t=0;i;){t++;let o=i,r=0;for(let l=0;l<n&&(r++,o=o.nextZ,!!o);l++);let c=n;for(;r>0||c>0&&o;)r!==0&&(c===0||!o||i.z<=o.z)?(s=i,i=i.nextZ,r--):(s=o,o=o.nextZ,c--),a?a.nextZ=s:e=s,s.prevZ=a,a=s;i=o}a.nextZ=null,n*=2}while(t>1);return e}function Gf(e,t,n,i,s){return e=(e-n)*s|0,t=(t-i)*s|0,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,e|t<<1}function V_(e){let t=e,n=e;do(t.x<n.x||t.x===n.x&&t.y<n.y)&&(n=t),t=t.next;while(t!==e);return n}function Zm(e,t,n,i,s,a,o,r){return(s-o)*(t-r)>=(e-o)*(a-r)&&(e-o)*(i-r)>=(n-o)*(t-r)&&(n-o)*(a-r)>=(s-o)*(i-r)}function To(e,t,n,i,s,a,o,r){return!(e===o&&t===r)&&Zm(e,t,n,i,s,a,o,r)}function W_(e,t){return e.next.i!==t.i&&e.prev.i!==t.i&&!k_(e,t)&&(rr(e,t)&&rr(t,e)&&X_(e,t)&&(Ae(e.prev,e,t.prev)||Ae(e,t.prev,t))||Va(e,t)&&Ae(e.prev,e,e.next)>0&&Ae(t.prev,t,t.next)>0)}function Ae(e,t,n){return(t.y-e.y)*(n.x-t.x)-(t.x-e.x)*(n.y-t.y)}function Va(e,t){return e.x===t.x&&e.y===t.y}function Km(e,t,n,i){const s=nc(Ae(e,t,n)),a=nc(Ae(e,t,i)),o=nc(Ae(n,i,e)),r=nc(Ae(n,i,t));return!!(s!==a&&o!==r||s===0&&ec(e,n,t)||a===0&&ec(e,i,t)||o===0&&ec(n,e,i)||r===0&&ec(n,t,i))}function ec(e,t,n){return t.x<=Math.max(e.x,n.x)&&t.x>=Math.min(e.x,n.x)&&t.y<=Math.max(e.y,n.y)&&t.y>=Math.min(e.y,n.y)}function nc(e){return e>0?1:e<0?-1:0}function k_(e,t){let n=e;do{if(n.i!==e.i&&n.next.i!==e.i&&n.i!==t.i&&n.next.i!==t.i&&Km(n,n.next,e,t))return!0;n=n.next}while(n!==e);return!1}function rr(e,t){return Ae(e.prev,e,e.next)<0?Ae(e,t,e.next)>=0&&Ae(e,e.prev,t)>=0:Ae(e,t,e.prev)<0||Ae(e,e.next,t)<0}function X_(e,t){let n=e,i=!1;const s=(e.x+t.x)/2,a=(e.y+t.y)/2;do n.y>a!=n.next.y>a&&n.next.y!==n.y&&s<(n.next.x-n.x)*(a-n.y)/(n.next.y-n.y)+n.x&&(i=!i),n=n.next;while(n!==e);return i}function Jm(e,t){const n=Hf(e.i,e.x,e.y),i=Hf(t.i,t.x,t.y),s=e.next,a=t.prev;return e.next=t,t.prev=e,n.next=s,s.prev=n,i.next=n,n.prev=i,a.next=i,i.prev=a,i}function sh(e,t,n,i){const s=Hf(e,t,n);return i?(s.next=i.next,s.prev=i,i.next.prev=s,i.next=s):(s.prev=s,s.next=s),s}function cr(e){e.next.prev=e.prev,e.prev.next=e.next,e.prevZ&&(e.prevZ.nextZ=e.nextZ),e.nextZ&&(e.nextZ.prevZ=e.prevZ)}function Hf(e,t,n){return{i:e,x:t,y:n,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function $_(e,t,n,i){let s=0;for(let a=t,o=n-i;a<n;a+=i)s+=(e[o]-e[a])*(e[a+1]+e[o+1]),o=a;return s}class q_{static triangulate(t,n,i=2){return C_(t,n,i)}}class Ri{static area(t){const n=t.length;let i=0;for(let s=n-1,a=0;a<n;s=a++)i+=t[s].x*t[a].y-t[a].x*t[s].y;return i*.5}static isClockWise(t){return Ri.area(t)<0}static triangulateShape(t,n){const i=[],s=[],a=[];ah(t),oh(i,t);let o=t.length;n.forEach(ah);for(let c=0;c<n.length;c++)s.push(o),o+=n[c].length,oh(i,n[c]);const r=q_.triangulate(i,s);for(let c=0;c<r.length;c+=3)a.push(r.slice(c,c+3));return a}}function ah(e){const t=e.length;t>2&&e[t-1].equals(e[0])&&e.pop()}function oh(e,t){for(let n=0;n<t.length;n++)e.push(t[n].x),e.push(t[n].y)}class Zs extends Le{constructor(t=new cs([new Ct(.5,.5),new Ct(-.5,.5),new Ct(-.5,-.5),new Ct(.5,-.5)]),n={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:n},t=Array.isArray(t)?t:[t];const i=this,s=[],a=[];for(let r=0,c=t.length;r<c;r++){const l=t[r];o(l)}this.setAttribute("position",new le(s,3)),this.setAttribute("uv",new le(a,2)),this.computeVertexNormals();function o(r){const c=[],l=n.curveSegments!==void 0?n.curveSegments:12,d=n.steps!==void 0?n.steps:1,f=n.depth!==void 0?n.depth:1;let u=n.bevelEnabled!==void 0?n.bevelEnabled:!0,h=n.bevelThickness!==void 0?n.bevelThickness:.2,m=n.bevelSize!==void 0?n.bevelSize:h-.1,_=n.bevelOffset!==void 0?n.bevelOffset:0,x=n.bevelSegments!==void 0?n.bevelSegments:3;const p=n.extrudePath,v=n.UVGenerator!==void 0?n.UVGenerator:Y_;let y,g=!1,b,S,T,M;if(p){y=p.getSpacedPoints(d),g=!0,u=!1;const ct=p.isCatmullRomCurve3?p.closed:!1;b=p.computeFrenetFrames(d,ct),S=new q,T=new q,M=new q}u||(x=0,h=0,m=0,_=0);const E=r.extractPoints(l);let A=E.shape;const R=E.holes;if(!Ri.isClockWise(A)){A=A.reverse();for(let ct=0,ut=R.length;ct<ut;ct++){const vt=R[ct];Ri.isClockWise(vt)&&(R[ct]=vt.reverse())}}function O(ct){const vt=10000000000000001e-36;let _t=ct[0];for(let Q=1;Q<=ct.length;Q++){const St=Q%ct.length,Pt=ct[St],yt=Pt.x-_t.x,j=Pt.y-_t.y,L=yt*yt+j*j,xt=Math.max(Math.abs(Pt.x),Math.abs(Pt.y),Math.abs(_t.x),Math.abs(_t.y)),bt=vt*xt*xt;if(L<=bt){ct.splice(St,1),Q--;continue}_t=Pt}}O(A),R.forEach(O);const P=R.length,F=A;for(let ct=0;ct<P;ct++){const ut=R[ct];A=A.concat(ut)}function V(ct,ut,vt){return ut||ce("ExtrudeGeometry: vec does not exist"),ct.clone().addScaledVector(ut,vt)}const U=A.length;function B(ct,ut,vt){let _t,Q,St;const Pt=ct.x-ut.x,yt=ct.y-ut.y,j=vt.x-ct.x,L=vt.y-ct.y,xt=Pt*Pt+yt*yt,bt=Pt*L-yt*j;if(Math.abs(bt)>Number.EPSILON){const C=Math.sqrt(xt),w=Math.sqrt(j*j+L*L),X=ut.x-yt/C,K=ut.y+Pt/C,ot=vt.x-L/w,wt=vt.y+j/w,Mt=((ot-X)*L-(wt-K)*j)/(Pt*L-yt*j);_t=X+Pt*Mt-ct.x,Q=K+yt*Mt-ct.y;const rt=_t*_t+Q*Q;if(rt<=2)return new Ct(_t,Q);St=Math.sqrt(rt/2)}else{let C=!1;Pt>Number.EPSILON?j>Number.EPSILON&&(C=!0):Pt<-Number.EPSILON?j<-Number.EPSILON&&(C=!0):Math.sign(yt)===Math.sign(L)&&(C=!0),C?(_t=-yt,Q=Pt,St=Math.sqrt(xt)):(_t=Pt,Q=yt,St=Math.sqrt(xt/2))}return new Ct(_t/St,Q/St)}const I=[];for(let ct=0,ut=F.length,vt=ut-1,_t=ct+1;ct<ut;ct++,vt++,_t++)vt===ut&&(vt=0),_t===ut&&(_t=0),I[ct]=B(F[ct],F[vt],F[_t]);const G=[];let $,J=I.concat();for(let ct=0,ut=P;ct<ut;ct++){const vt=R[ct];$=[];for(let _t=0,Q=vt.length,St=Q-1,Pt=_t+1;_t<Q;_t++,St++,Pt++)St===Q&&(St=0),Pt===Q&&(Pt=0),$[_t]=B(vt[_t],vt[St],vt[Pt]);G.push($),J=J.concat($)}let it;if(x===0)it=Ri.triangulateShape(F,R);else{const ct=[],ut=[];for(let vt=0;vt<x;vt++){const _t=vt/x,Q=h*Math.cos(_t*Math.PI/2),St=m*Math.sin(_t*Math.PI/2)+_;for(let Pt=0,yt=F.length;Pt<yt;Pt++){const j=V(F[Pt],I[Pt],St);at(j.x,j.y,-Q),_t===0&&ct.push(j)}for(let Pt=0,yt=P;Pt<yt;Pt++){const j=R[Pt];$=G[Pt];const L=[];for(let xt=0,bt=j.length;xt<bt;xt++){const C=V(j[xt],$[xt],St);at(C.x,C.y,-Q),_t===0&&L.push(C)}_t===0&&ut.push(L)}}it=Ri.triangulateShape(ct,ut)}const Tt=it.length,H=m+_;for(let ct=0;ct<U;ct++){const ut=u?V(A[ct],J[ct],H):A[ct];g?(T.copy(b.normals[0]).multiplyScalar(ut.x),S.copy(b.binormals[0]).multiplyScalar(ut.y),M.copy(y[0]).add(T).add(S),at(M.x,M.y,M.z)):at(ut.x,ut.y,0)}for(let ct=1;ct<=d;ct++)for(let ut=0;ut<U;ut++){const vt=u?V(A[ut],J[ut],H):A[ut];g?(T.copy(b.normals[ct]).multiplyScalar(vt.x),S.copy(b.binormals[ct]).multiplyScalar(vt.y),M.copy(y[ct]).add(T).add(S),at(M.x,M.y,M.z)):at(vt.x,vt.y,f/d*ct)}for(let ct=x-1;ct>=0;ct--){const ut=ct/x,vt=h*Math.cos(ut*Math.PI/2),_t=m*Math.sin(ut*Math.PI/2)+_;for(let Q=0,St=F.length;Q<St;Q++){const Pt=V(F[Q],I[Q],_t);at(Pt.x,Pt.y,f+vt)}for(let Q=0,St=R.length;Q<St;Q++){const Pt=R[Q];$=G[Q];for(let yt=0,j=Pt.length;yt<j;yt++){const L=V(Pt[yt],$[yt],_t);g?at(L.x,L.y+y[d-1].y,y[d-1].x+vt):at(L.x,L.y,f+vt)}}}tt(),k();function tt(){const ct=s.length/3;if(u){let ut=0,vt=U*ut;for(let _t=0;_t<Tt;_t++){const Q=it[_t];ht(Q[2]+vt,Q[1]+vt,Q[0]+vt)}ut=d+x*2,vt=U*ut;for(let _t=0;_t<Tt;_t++){const Q=it[_t];ht(Q[0]+vt,Q[1]+vt,Q[2]+vt)}}else{for(let ut=0;ut<Tt;ut++){const vt=it[ut];ht(vt[2],vt[1],vt[0])}for(let ut=0;ut<Tt;ut++){const vt=it[ut];ht(vt[0]+U*d,vt[1]+U*d,vt[2]+U*d)}}i.addGroup(ct,s.length/3-ct,0)}function k(){const ct=s.length/3;let ut=0;W(F,ut),ut+=F.length;for(let vt=0,_t=R.length;vt<_t;vt++){const Q=R[vt];W(Q,ut),ut+=Q.length}i.addGroup(ct,s.length/3-ct,1)}function W(ct,ut){let vt=ct.length;for(;--vt>=0;){const _t=vt;let Q=vt-1;Q<0&&(Q=ct.length-1);for(let St=0,Pt=d+x*2;St<Pt;St++){const yt=U*St,j=U*(St+1),L=ut+_t+yt,xt=ut+Q+yt,bt=ut+Q+j,C=ut+_t+j;dt(L,xt,bt,C)}}}function at(ct,ut,vt){c.push(ct),c.push(ut),c.push(vt)}function ht(ct,ut,vt){gt(ct),gt(ut),gt(vt);const _t=s.length/3,Q=v.generateTopUV(i,s,_t-3,_t-2,_t-1);Kt(Q[0]),Kt(Q[1]),Kt(Q[2])}function dt(ct,ut,vt,_t){gt(ct),gt(ut),gt(_t),gt(ut),gt(vt),gt(_t);const Q=s.length/3,St=v.generateSideWallUV(i,s,Q-6,Q-3,Q-2,Q-1);Kt(St[0]),Kt(St[1]),Kt(St[3]),Kt(St[1]),Kt(St[2]),Kt(St[3])}function gt(ct){s.push(c[ct*3+0]),s.push(c[ct*3+1]),s.push(c[ct*3+2])}function Kt(ct){a.push(ct.x),a.push(ct.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),n=this.parameters.shapes,i=this.parameters.options;return Z_(n,i,t)}static fromJSON(t,n){const i=[];for(let a=0,o=t.shapes.length;a<o;a++){const r=n[t.shapes[a]];i.push(r)}const s=t.options.extrudePath;return s!==void 0&&(t.options.extrudePath=new Kc[s.type]().fromJSON(s)),new Zs(i,t.options)}}const Y_={generateTopUV:function(e,t,n,i,s){const a=t[n*3],o=t[n*3+1],r=t[i*3],c=t[i*3+1],l=t[s*3],d=t[s*3+1];return[new Ct(a,o),new Ct(r,c),new Ct(l,d)]},generateSideWallUV:function(e,t,n,i,s,a){const o=t[n*3],r=t[n*3+1],c=t[n*3+2],l=t[i*3],d=t[i*3+1],f=t[i*3+2],u=t[s*3],h=t[s*3+1],m=t[s*3+2],_=t[a*3],x=t[a*3+1],p=t[a*3+2];return Math.abs(r-d)<Math.abs(o-l)?[new Ct(o,1-c),new Ct(l,1-f),new Ct(u,1-m),new Ct(_,1-p)]:[new Ct(r,1-c),new Ct(d,1-f),new Ct(h,1-m),new Ct(x,1-p)]}};function Z_(e,t,n){if(n.shapes=[],Array.isArray(e))for(let i=0,s=e.length;i<s;i++){const a=e[i];n.shapes.push(a.uuid)}else n.shapes.push(e.uuid);return n.options=Object.assign({},t),t.extrudePath!==void 0&&(n.options.extrudePath=t.extrudePath.toJSON()),n}class Al extends Le{constructor(t=1,n=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:n,widthSegments:i,heightSegments:s};const a=t/2,o=n/2,r=Math.floor(i),c=Math.floor(s),l=r+1,d=c+1,f=t/r,u=n/c,h=[],m=[],_=[],x=[];for(let p=0;p<d;p++){const v=p*u-o;for(let y=0;y<l;y++){const g=y*f-a;m.push(g,-v,0),_.push(0,0,1),x.push(y/r),x.push(1-p/c)}}for(let p=0;p<c;p++)for(let v=0;v<r;v++){const y=v+l*p,g=v+l*(p+1),b=v+1+l*(p+1),S=v+1+l*p;h.push(y,g,S),h.push(g,b,S)}this.setIndex(h),this.setAttribute("position",new le(m,3)),this.setAttribute("normal",new le(_,3)),this.setAttribute("uv",new le(x,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Al(t.width,t.height,t.widthSegments,t.heightSegments)}}class Gu extends Le{constructor(t=.5,n=1,i=32,s=1,a=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:n,thetaSegments:i,phiSegments:s,thetaStart:a,thetaLength:o},i=Math.max(3,i),s=Math.max(1,s);const r=[],c=[],l=[],d=[];let f=t;const u=(n-t)/s,h=new q,m=new Ct;for(let _=0;_<=s;_++){for(let x=0;x<=i;x++){const p=a+x/i*o;h.x=f*Math.cos(p),h.y=f*Math.sin(p),c.push(h.x,h.y,h.z),l.push(0,0,1),m.x=(h.x/n+1)/2,m.y=(h.y/n+1)/2,d.push(m.x,m.y)}f+=u}for(let _=0;_<s;_++){const x=_*(i+1);for(let p=0;p<i;p++){const v=p+x,y=v,g=v+i+1,b=v+i+2,S=v+1;r.push(y,g,S),r.push(g,b,S)}}this.setIndex(r),this.setAttribute("position",new le(c,3)),this.setAttribute("normal",new le(l,3)),this.setAttribute("uv",new le(d,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Gu(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class Hu extends Le{constructor(t=new cs([new Ct(0,.5),new Ct(-.5,-.5),new Ct(.5,-.5)]),n=12){super(),this.type="ShapeGeometry",this.parameters={shapes:t,curveSegments:n};const i=[],s=[],a=[],o=[];let r=0,c=0;if(Array.isArray(t)===!1)l(t);else for(let d=0;d<t.length;d++)l(t[d]),this.addGroup(r,c,d),r+=c,c=0;this.setIndex(i),this.setAttribute("position",new le(s,3)),this.setAttribute("normal",new le(a,3)),this.setAttribute("uv",new le(o,2));function l(d){const f=s.length/3,u=d.extractPoints(n);let h=u.shape;const m=u.holes;Ri.isClockWise(h)===!1&&(h=h.reverse());for(let x=0,p=m.length;x<p;x++){const v=m[x];Ri.isClockWise(v)===!0&&(m[x]=v.reverse())}const _=Ri.triangulateShape(h,m);for(let x=0,p=m.length;x<p;x++){const v=m[x];h=h.concat(v)}for(let x=0,p=h.length;x<p;x++){const v=h[x];s.push(v.x,v.y,0),a.push(0,0,1),o.push(v.x,v.y)}for(let x=0,p=_.length;x<p;x++){const v=_[x],y=v[0]+f,g=v[1]+f,b=v[2]+f;i.push(y,g,b),c+=3}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),n=this.parameters.shapes;return K_(n,t)}static fromJSON(t,n){const i=[];for(let s=0,a=t.shapes.length;s<a;s++){const o=n[t.shapes[s]];i.push(o)}return new Hu(i,t.curveSegments)}}function K_(e,t){if(t.shapes=[],Array.isArray(e))for(let n=0,i=e.length;n<i;n++){const s=e[n];t.shapes.push(s.uuid)}else t.shapes.push(e.uuid);return t}class Jc extends Le{constructor(t=1,n=32,i=16,s=0,a=Math.PI*2,o=0,r=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:n,heightSegments:i,phiStart:s,phiLength:a,thetaStart:o,thetaLength:r},n=Math.max(3,Math.floor(n)),i=Math.max(2,Math.floor(i));const c=Math.min(o+r,Math.PI);let l=0;const d=[],f=new q,u=new q,h=[],m=[],_=[],x=[];for(let p=0;p<=i;p++){const v=[],y=p/i,g=o+y*r,b=t*Math.cos(g),S=Math.sqrt(t*t-b*b);let T=0;p===0&&o===0?T=.5/n:p===i&&c===Math.PI&&(T=-.5/n);for(let M=0;M<=n;M++){const E=M/n,A=s+E*a;f.x=-S*Math.cos(A),f.y=b,f.z=S*Math.sin(A),m.push(f.x,f.y,f.z),u.copy(f).normalize(),_.push(u.x,u.y,u.z),x.push(E+T,1-y),v.push(l++)}d.push(v)}for(let p=0;p<i;p++)for(let v=0;v<n;v++){const y=d[p][v+1],g=d[p][v],b=d[p+1][v],S=d[p+1][v+1];(p!==0||o>0)&&h.push(y,g,S),(p!==i-1||c<Math.PI)&&h.push(g,b,S)}this.setIndex(h),this.setAttribute("position",new le(m,3)),this.setAttribute("normal",new le(_,3)),this.setAttribute("uv",new le(x,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Jc(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class mr extends Le{constructor(t=1,n=.4,i=12,s=48,a=Math.PI*2,o=0,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:n,radialSegments:i,tubularSegments:s,arc:a,thetaStart:o,thetaLength:r},i=Math.floor(i),s=Math.floor(s);const c=[],l=[],d=[],f=[],u=new q,h=new q,m=new q;for(let _=0;_<=i;_++){const x=o+_/i*r;for(let p=0;p<=s;p++){const v=p/s*a;h.x=(t+n*Math.cos(x))*Math.cos(v),h.y=(t+n*Math.cos(x))*Math.sin(v),h.z=n*Math.sin(x),l.push(h.x,h.y,h.z),u.x=t*Math.cos(v),u.y=t*Math.sin(v),m.subVectors(h,u).normalize(),d.push(m.x,m.y,m.z),f.push(p/s),f.push(_/i)}}for(let _=1;_<=i;_++)for(let x=1;x<=s;x++){const p=(s+1)*_+x-1,v=(s+1)*(_-1)+x-1,y=(s+1)*(_-1)+x,g=(s+1)*_+x;c.push(p,v,g),c.push(v,y,g)}this.setIndex(c),this.setAttribute("position",new le(l,3)),this.setAttribute("normal",new le(d,3)),this.setAttribute("uv",new le(f,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new mr(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc,t.thetaStart,t.thetaLength)}}class Vu extends Le{constructor(t=new $m(new q(-1,-1,0),new q(-1,1,0),new q(1,1,0)),n=64,i=1,s=8,a=!1){super(),this.type="TubeGeometry",this.parameters={path:t,tubularSegments:n,radius:i,radialSegments:s,closed:a};const o=t.computeFrenetFrames(n,a);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;const r=new q,c=new q,l=new Ct;let d=new q;const f=[],u=[],h=[],m=[];_(),this.setIndex(m),this.setAttribute("position",new le(f,3)),this.setAttribute("normal",new le(u,3)),this.setAttribute("uv",new le(h,2));function _(){for(let y=0;y<n;y++)x(y);x(a===!1?n:0),v(),p()}function x(y){d=t.getPointAt(y/n,d);const g=o.normals[y],b=o.binormals[y];for(let S=0;S<=s;S++){const T=S/s*Math.PI*2,M=Math.sin(T),E=-Math.cos(T);c.x=E*g.x+M*b.x,c.y=E*g.y+M*b.y,c.z=E*g.z+M*b.z,c.normalize(),u.push(c.x,c.y,c.z),r.x=d.x+i*c.x,r.y=d.y+i*c.y,r.z=d.z+i*c.z,f.push(r.x,r.y,r.z)}}function p(){for(let y=1;y<=n;y++)for(let g=1;g<=s;g++){const b=(s+1)*(y-1)+(g-1),S=(s+1)*y+(g-1),T=(s+1)*y+g,M=(s+1)*(y-1)+g;m.push(b,S,M),m.push(S,T,M)}}function v(){for(let y=0;y<=n;y++)for(let g=0;g<=s;g++)l.x=y/n,l.y=g/s,h.push(l.x,l.y)}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON();return t.path=this.parameters.path.toJSON(),t}static fromJSON(t){return new Vu(new Kc[t.path.type]().fromJSON(t.path),t.tubularSegments,t.radius,t.radialSegments,t.closed)}}function Wa(e){const t={};for(const n in e){t[n]={};for(const i in e[n]){const s=e[n][i];if(rh(s))s.isRenderTargetTexture?(Jt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[n][i]=null):t[n][i]=s.clone();else if(Array.isArray(s))if(rh(s[0])){const a=[];for(let o=0,r=s.length;o<r;o++)a[o]=s[o].clone();t[n][i]=a}else t[n][i]=s.slice();else t[n][i]=s}}return t}function on(e){const t={};for(let n=0;n<e.length;n++){const i=Wa(e[n]);for(const s in i)t[s]=i[s]}return t}function rh(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function J_(e){const t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function Qm(e){const t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:oe.workingColorSpace}const Q_={clone:Wa,merge:on};var j_=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,tv=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class hi extends Ka{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=j_,this.fragmentShader=tv,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Wa(t.uniforms),this.uniformsGroups=J_(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){const n=super.toJSON(t);n.glslVersion=this.glslVersion,n.uniforms={};for(const s in this.uniforms){const o=this.uniforms[s].value;o&&o.isTexture?n.uniforms[s]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?n.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?n.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?n.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?n.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?n.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?n.uniforms[s]={type:"m4",value:o.toArray()}:n.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(n.defines=this.defines),n.vertexShader=this.vertexShader,n.fragmentShader=this.fragmentShader,n.lights=this.lights,n.clipping=this.clipping;const i={};for(const s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(n.extensions=i),n}fromJSON(t,n){if(super.fromJSON(t,n),t.uniforms!==void 0)for(const i in t.uniforms){const s=t.uniforms[i];switch(this.uniforms[i]={},s.type){case"t":this.uniforms[i].value=n[s.value]||null;break;case"c":this.uniforms[i].value=new ee().setHex(s.value);break;case"v2":this.uniforms[i].value=new Ct().fromArray(s.value);break;case"v3":this.uniforms[i].value=new q().fromArray(s.value);break;case"v4":this.uniforms[i].value=new Te().fromArray(s.value);break;case"m3":this.uniforms[i].value=new te().fromArray(s.value);break;case"m4":this.uniforms[i].value=new we().fromArray(s.value);break;default:this.uniforms[i].value=s.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(const i in t.extensions)this.extensions[i]=t.extensions[i];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}}class ev extends hi{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class lr extends Ka{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new ee(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ee(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=$c,this.normalScale=new Ct(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Bi,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class jm extends Ka{constructor(t){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new ee(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ee(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=$c,this.normalScale=new Ct(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Bi,this.combine=Eu,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.envMapIntensity=t.envMapIntensity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class nv extends Ka{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=I1,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class iv extends Ka{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}class Wu extends ke{constructor(t,n=1){super(),this.isLight=!0,this.type="Light",this.color=new ee(t),this.intensity=n}copy(t,n){return super.copy(t,n),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const n=super.toJSON(t);return n.object.color=this.color.getHex(),n.object.intensity=this.intensity,n}}class sv extends Wu{constructor(t,n,i){super(t,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(ke.DEFAULT_UP),this.updateMatrix(),this.groundColor=new ee(n)}copy(t,n){return super.copy(t,n),this.groundColor.copy(t.groundColor),this}toJSON(t){const n=super.toJSON(t);return n.object.groundColor=this.groundColor.getHex(),n}}const Md=new we,ch=new q,lh=new q;class tx{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Ct(512,512),this.mapType=Sn,this.map=null,this.mapPass=null,this.matrix=new we,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Uu,this._frameExtents=new Ct(1,1),this._viewportCount=1,this._viewports=[new Te(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(t){const n=this.camera;ch.setFromMatrixPosition(t.matrixWorld),n.position.copy(ch),lh.setFromMatrixPosition(t.target.matrixWorld),n.lookAt(lh),n.updateMatrixWorld(),this._updateMatrix(n,this.matrix,this._frustum)}_updateMatrix(t,n,i,s){Md.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),i.setFromProjectionMatrix(Md,t.coordinateSystem,t.reversedDepth);const a=this._frameExtents,o=s?s.z/a.x:1,r=s?s.w/a.y:1,c=s?s.x/a.x:0,l=s?s.y/a.y:0;t.coordinateSystem===ir||t.reversedDepth?n.set(.5*o,0,0,.5*o+c,0,.5*r,0,.5*r+l,0,0,1,0,0,0,0,1):n.set(.5*o,0,0,.5*o+c,0,.5*r,0,.5*r+l,0,0,.5,.5,0,0,0,1),n.multiply(Md)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return t.intensity=this.intensity,t.bias=this.bias,t.normalBias=this.normalBias,t.radius=this.radius,t.blurSamples=this.blurSamples,t.mapSize=this.mapSize.toArray(),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}const ic=new q,sc=new Ya,ei=new q;class ex extends ke{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new we,this.projectionMatrix=new we,this.projectionMatrixInverse=new we,this.coordinateSystem=ri,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,n){return super.copy(t,n),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(ic,sc,ei),ei.x===1&&ei.y===1&&ei.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ic,sc,ei.set(1,1,1)).invert()}updateWorldMatrix(t,n,i=!1){super.updateWorldMatrix(t,n,i),this.matrixWorld.decompose(ic,sc,ei),ei.x===1&&ei.y===1&&ei.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ic,sc,ei.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const qi=new q,dh=new Ct,fh=new Ct;class Dn extends ex{constructor(t=50,n=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=n,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,n){return super.copy(t,n),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const n=.5*this.getFilmHeight()/t;this.fov=Bf*2*Math.atan(n),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(Zl*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Bf*2*Math.atan(Math.tan(Zl*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,n,i){qi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(qi.x,qi.y).multiplyScalar(-t/qi.z),qi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(qi.x,qi.y).multiplyScalar(-t/qi.z)}getViewSize(t,n){return this.getViewBounds(t,dh,fh),n.subVectors(fh,dh)}setViewOffset(t,n,i,s,a,o){this.aspect=t/n,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=s,this.view.width=a,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let n=t*Math.tan(Zl*.5*this.fov)/this.zoom,i=2*n,s=this.aspect*i,a=-.5*s;const o=this.view;if(this.view!==null&&this.view.enabled){const c=o.fullWidth,l=o.fullHeight;a+=o.offsetX*s/c,n-=o.offsetY*i/l,s*=o.width/c,i*=o.height/l}const r=this.filmOffset;r!==0&&(a+=t*r/this.getFilmWidth()),this.projectionMatrix.makePerspective(a,a+s,n,n-i,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const n=super.toJSON(t);return n.object.fov=this.fov,n.object.zoom=this.zoom,n.object.near=this.near,n.object.far=this.far,n.object.focus=this.focus,n.object.aspect=this.aspect,this.view!==null&&(n.object.view=Object.assign({},this.view)),n.object.filmGauge=this.filmGauge,n.object.filmOffset=this.filmOffset,n}}class av extends tx{constructor(){super(new Dn(90,1,.5,500)),this.isPointLightShadow=!0}}class ku extends Wu{constructor(t,n,i=0,s=2){super(t,n),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=s,this.shadow=new av}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(t,n){return super.copy(t,n),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}toJSON(t){const n=super.toJSON(t);return n.object.distance=this.distance,n.object.decay=this.decay,n.object.shadow=this.shadow.toJSON(),n}}class zl extends ex{constructor(t=-1,n=1,i=1,s=-1,a=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=n,this.top=i,this.bottom=s,this.near=a,this.far=o,this.updateProjectionMatrix()}copy(t,n){return super.copy(t,n),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,n,i,s,a,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=s,this.view.width=a,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),n=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let a=i-t,o=i+t,r=s+n,c=s-n;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,d=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=l*this.view.offsetX,o=a+l*this.view.width,r-=d*this.view.offsetY,c=r-d*this.view.height}this.projectionMatrix.makeOrthographic(a,o,r,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const n=super.toJSON(t);return n.object.zoom=this.zoom,n.object.left=this.left,n.object.right=this.right,n.object.top=this.top,n.object.bottom=this.bottom,n.object.near=this.near,n.object.far=this.far,this.view!==null&&(n.object.view=Object.assign({},this.view)),n}}class ov extends tx{constructor(){super(new zl(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class rv extends Wu{constructor(t,n){super(t,n),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(ke.DEFAULT_UP),this.updateMatrix(),this.target=new ke,this.shadow=new ov}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){const n=super.toJSON(t);return n.object.shadow=this.shadow.toJSON(),n.object.target=this.target.uuid,n}}const pa=-90,ma=1;class cv extends ke{constructor(t,n,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new Dn(pa,ma,t,n);s.layers=this.layers,this.add(s);const a=new Dn(pa,ma,t,n);a.layers=this.layers,this.add(a);const o=new Dn(pa,ma,t,n);o.layers=this.layers,this.add(o);const r=new Dn(pa,ma,t,n);r.layers=this.layers,this.add(r);const c=new Dn(pa,ma,t,n);c.layers=this.layers,this.add(c);const l=new Dn(pa,ma,t,n);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const t=this.coordinateSystem,n=this.children.concat(),[i,s,a,o,r,c]=n;for(const l of n)this.remove(l);if(t===ri)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),a.up.set(0,0,-1),a.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),r.up.set(0,1,0),r.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(t===ir)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),a.up.set(0,0,1),a.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),r.up.set(0,-1,0),r.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const l of n)this.add(l),l.updateMatrixWorld()}update(t,n){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[a,o,r,c,l,d]=this.children,f=t.getRenderTarget(),u=t.getActiveCubeFace(),h=t.getActiveMipmapLevel(),m=t.xr.enabled;t.xr.enabled=!1;const _=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let x=!1;t.isWebGLRenderer===!0?x=t.state.buffers.depth.getReversed():x=t.reversedDepthBuffer,t.setRenderTarget(i,0,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(n,a),t.setRenderTarget(i,1,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(n,o),t.setRenderTarget(i,2,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(n,r),t.setRenderTarget(i,3,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(n,c),t.setRenderTarget(i,4,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(n,l),i.texture.generateMipmaps=_,t.setRenderTarget(i,5,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(n,d),t.setRenderTarget(f,u,h),t.xr.enabled=m,i.texture.needsPMREMUpdate=!0}}class lv extends Dn{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}}class nx{static{nx.prototype.isMatrix2=!0}constructor(t,n,i,s){this.elements=[1,0,0,1],t!==void 0&&this.set(t,n,i,s)}identity(){return this.set(1,0,0,1),this}fromArray(t,n=0){for(let i=0;i<4;i++)this.elements[i]=t[i+n];return this}set(t,n,i,s){const a=this.elements;return a[0]=t,a[2]=n,a[1]=i,a[3]=s,this}}function uh(e,t,n,i){const s=dv(i);switch(n){case Cm:return e*t;case Lm:return e*t/s.components*s.byteLength;case Ru:return e*t/s.components*s.byteLength;case Us:return e*t*2/s.components*s.byteLength;case Cu:return e*t*2/s.components*s.byteLength;case Pm:return e*t*3/s.components*s.byteLength;case Zn:return e*t*4/s.components*s.byteLength;case Pu:return e*t*4/s.components*s.byteLength;case Cc:case Pc:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Lc:case Ic:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case df:case uf:return Math.max(e,16)*Math.max(t,8)/4;case lf:case ff:return Math.max(e,8)*Math.max(t,8)/2;case hf:case pf:case xf:case gf:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case mf:case kc:case _f:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case vf:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Mf:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case yf:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case bf:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case Sf:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case wf:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case Ef:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case Tf:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case Af:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case zf:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case Rf:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case Cf:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case Pf:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case Lf:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case If:case Df:case Nf:return Math.ceil(e/4)*Math.ceil(t/4)*16;case Uf:case Of:return Math.ceil(e/4)*Math.ceil(t/4)*8;case Xc:case Ff:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${n} format.`)}function dv(e){switch(e){case Sn:case Tm:return{byteLength:1,components:1};case er:case Am:case ui:return{byteLength:2,components:1};case Au:case zu:return{byteLength:2,components:4};case fi:case Tu:case oi:return{byteLength:4,components:1};case zm:case Rm:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:wu}}));typeof window<"u"&&(window.__THREE__?Jt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=wu);function ix(){let e=null,t=!1,n=null,i=null;function s(a,o){i=e.requestAnimationFrame(s),n(a,o)}return{start:function(){t!==!0&&n!==null&&e!==null&&(i=e.requestAnimationFrame(s),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(a){n=a},setContext:function(a){e=a}}}function fv(e){const t=new WeakMap;function n(r,c){const l=r.array,d=r.usage,f=l.byteLength,u=e.createBuffer();e.bindBuffer(c,u),e.bufferData(c,l,d),r.onUploadCallback();let h;if(l instanceof Float32Array)h=e.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)h=e.HALF_FLOAT;else if(l instanceof Uint16Array)r.isFloat16BufferAttribute?h=e.HALF_FLOAT:h=e.UNSIGNED_SHORT;else if(l instanceof Int16Array)h=e.SHORT;else if(l instanceof Uint32Array)h=e.UNSIGNED_INT;else if(l instanceof Int32Array)h=e.INT;else if(l instanceof Int8Array)h=e.BYTE;else if(l instanceof Uint8Array)h=e.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)h=e.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:u,type:h,bytesPerElement:l.BYTES_PER_ELEMENT,version:r.version,size:f}}function i(r,c,l){const d=c.array,f=c.updateRanges;if(e.bindBuffer(l,r),f.length===0)e.bufferSubData(l,0,d);else{f.sort((h,m)=>h.start-m.start);let u=0;for(let h=1;h<f.length;h++){const m=f[u],_=f[h];_.start<=m.start+m.count+1?m.count=Math.max(m.count,_.start+_.count-m.start):(++u,f[u]=_)}f.length=u+1;for(let h=0,m=f.length;h<m;h++){const _=f[h];e.bufferSubData(l,_.start*d.BYTES_PER_ELEMENT,d,_.start,_.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(r){return r.isInterleavedBufferAttribute&&(r=r.data),t.get(r)}function a(r){r.isInterleavedBufferAttribute&&(r=r.data);const c=t.get(r);c&&(e.deleteBuffer(c.buffer),t.delete(r))}function o(r,c){if(r.isInterleavedBufferAttribute&&(r=r.data),r.isGLBufferAttribute){const d=t.get(r);(!d||d.version<r.version)&&t.set(r,{buffer:r.buffer,type:r.type,bytesPerElement:r.elementSize,version:r.version});return}const l=t.get(r);if(l===void 0)t.set(r,n(r,c));else if(l.version<r.version){if(l.size!==r.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(l.buffer,r,c),l.version=r.version}}return{get:s,remove:a,update:o}}var uv=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,hv=`#ifdef USE_ALPHAHASH
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
#endif`,pv=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,mv=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,xv=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,gv=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,_v=`#ifdef USE_AOMAP
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
#endif`,vv=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Mv=`#ifdef USE_BATCHING
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
#endif`,yv=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,bv=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Sv=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,wv=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Ev=`#ifdef USE_IRIDESCENCE
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
#endif`,Tv=`#ifdef USE_BUMPMAP
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
#endif`,Av=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,zv=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Rv=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Cv=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Pv=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Lv=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Iv=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Dv=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,Nv=`#define PI 3.141592653589793
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
} // validated`,Uv=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Ov=`vec3 transformedNormal = objectNormal;
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
#endif`,Fv=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Bv=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Gv=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Hv=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Vv="gl_FragColor = linearToOutputTexel( gl_FragColor );",Wv=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,kv=`#ifdef USE_ENVMAP
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
#endif`,Xv=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,$v=`#ifdef USE_ENVMAP
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
#endif`,qv=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Yv=`#ifdef USE_ENVMAP
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
#endif`,Zv=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Kv=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Jv=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Qv=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,jv=`#ifdef USE_GRADIENTMAP
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
}`,tM=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,eM=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,nM=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,iM=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,sM=`#ifdef USE_ENVMAP
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
#endif`,aM=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,oM=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,rM=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,cM=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lM=`PhysicalMaterial material;
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
#endif`,dM=`uniform sampler2D dfgLUT;
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
}`,fM=`
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
#endif`,uM=`#if defined( RE_IndirectDiffuse )
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
#endif`,hM=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,pM=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,mM=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,xM=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,gM=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,_M=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,vM=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,MM=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,yM=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,bM=`#if defined( USE_POINTS_UV )
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
#endif`,SM=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,wM=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,EM=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,TM=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,AM=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,zM=`#ifdef USE_MORPHTARGETS
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
#endif`,RM=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,CM=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,PM=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,LM=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,IM=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,DM=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,NM=`#ifdef USE_NORMALMAP
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
#endif`,UM=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,OM=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,FM=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,BM=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,GM=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,HM=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,VM=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,WM=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,kM=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,XM=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,$M=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,qM=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,YM=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,ZM=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,KM=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,JM=`float getShadowMask() {
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
}`,QM=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,jM=`#ifdef USE_SKINNING
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
#endif`,ty=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,ey=`#ifdef USE_SKINNING
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
#endif`,ny=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,iy=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,sy=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,ay=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,oy=`#ifdef USE_TRANSMISSION
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
#endif`,ry=`#ifdef USE_TRANSMISSION
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
#endif`,cy=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,ly=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,dy=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,fy=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const uy=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,hy=`uniform sampler2D t2D;
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
}`,py=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,my=`#ifdef ENVMAP_TYPE_CUBE
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
}`,xy=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,gy=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,_y=`#include <common>
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
}`,vy=`#if DEPTH_PACKING == 3200
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
}`,My=`#define DISTANCE
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
}`,yy=`#define DISTANCE
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
}`,by=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Sy=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,wy=`uniform float scale;
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
}`,Ey=`uniform vec3 diffuse;
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
}`,Ty=`#include <common>
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
}`,Ay=`uniform vec3 diffuse;
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
}`,zy=`#define LAMBERT
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
}`,Ry=`#define LAMBERT
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
}`,Cy=`#define MATCAP
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
}`,Py=`#define MATCAP
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
}`,Ly=`#define NORMAL
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
}`,Iy=`#define NORMAL
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
}`,Dy=`#define PHONG
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
}`,Ny=`#define PHONG
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
}`,Uy=`#define STANDARD
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
}`,Oy=`#define STANDARD
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
}`,Fy=`#define TOON
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
}`,By=`#define TOON
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
}`,Gy=`uniform float size;
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
}`,Hy=`uniform vec3 diffuse;
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
}`,Vy=`#include <common>
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
}`,ky=`uniform float rotation;
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
}`,Xy=`uniform vec3 diffuse;
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
}`,ie={alphahash_fragment:uv,alphahash_pars_fragment:hv,alphamap_fragment:pv,alphamap_pars_fragment:mv,alphatest_fragment:xv,alphatest_pars_fragment:gv,aomap_fragment:_v,aomap_pars_fragment:vv,batching_pars_vertex:Mv,batching_vertex:yv,begin_vertex:bv,beginnormal_vertex:Sv,bsdfs:wv,iridescence_fragment:Ev,bumpmap_pars_fragment:Tv,clipping_planes_fragment:Av,clipping_planes_pars_fragment:zv,clipping_planes_pars_vertex:Rv,clipping_planes_vertex:Cv,color_fragment:Pv,color_pars_fragment:Lv,color_pars_vertex:Iv,color_vertex:Dv,common:Nv,cube_uv_reflection_fragment:Uv,defaultnormal_vertex:Ov,displacementmap_pars_vertex:Fv,displacementmap_vertex:Bv,emissivemap_fragment:Gv,emissivemap_pars_fragment:Hv,colorspace_fragment:Vv,colorspace_pars_fragment:Wv,envmap_fragment:kv,envmap_common_pars_fragment:Xv,envmap_pars_fragment:$v,envmap_pars_vertex:qv,envmap_physical_pars_fragment:sM,envmap_vertex:Yv,fog_vertex:Zv,fog_pars_vertex:Kv,fog_fragment:Jv,fog_pars_fragment:Qv,gradientmap_pars_fragment:jv,lightmap_pars_fragment:tM,lights_lambert_fragment:eM,lights_lambert_pars_fragment:nM,lights_pars_begin:iM,lights_toon_fragment:aM,lights_toon_pars_fragment:oM,lights_phong_fragment:rM,lights_phong_pars_fragment:cM,lights_physical_fragment:lM,lights_physical_pars_fragment:dM,lights_fragment_begin:fM,lights_fragment_maps:uM,lights_fragment_end:hM,lightprobes_pars_fragment:pM,logdepthbuf_fragment:mM,logdepthbuf_pars_fragment:xM,logdepthbuf_pars_vertex:gM,logdepthbuf_vertex:_M,map_fragment:vM,map_pars_fragment:MM,map_particle_fragment:yM,map_particle_pars_fragment:bM,metalnessmap_fragment:SM,metalnessmap_pars_fragment:wM,morphinstance_vertex:EM,morphcolor_vertex:TM,morphnormal_vertex:AM,morphtarget_pars_vertex:zM,morphtarget_vertex:RM,normal_fragment_begin:CM,normal_fragment_maps:PM,normal_pars_fragment:LM,normal_pars_vertex:IM,normal_vertex:DM,normalmap_pars_fragment:NM,clearcoat_normal_fragment_begin:UM,clearcoat_normal_fragment_maps:OM,clearcoat_pars_fragment:FM,iridescence_pars_fragment:BM,opaque_fragment:GM,packing:HM,premultiplied_alpha_fragment:VM,project_vertex:WM,dithering_fragment:kM,dithering_pars_fragment:XM,roughnessmap_fragment:$M,roughnessmap_pars_fragment:qM,shadowmap_pars_fragment:YM,shadowmap_pars_vertex:ZM,shadowmap_vertex:KM,shadowmask_pars_fragment:JM,skinbase_vertex:QM,skinning_pars_vertex:jM,skinning_vertex:ty,skinnormal_vertex:ey,specularmap_fragment:ny,specularmap_pars_fragment:iy,tonemapping_fragment:sy,tonemapping_pars_fragment:ay,transmission_fragment:oy,transmission_pars_fragment:ry,uv_pars_fragment:cy,uv_pars_vertex:ly,uv_vertex:dy,worldpos_vertex:fy,background_vert:uy,background_frag:hy,backgroundCube_vert:py,backgroundCube_frag:my,cube_vert:xy,cube_frag:gy,depth_vert:_y,depth_frag:vy,distance_vert:My,distance_frag:yy,equirect_vert:by,equirect_frag:Sy,linedashed_vert:wy,linedashed_frag:Ey,meshbasic_vert:Ty,meshbasic_frag:Ay,meshlambert_vert:zy,meshlambert_frag:Ry,meshmatcap_vert:Cy,meshmatcap_frag:Py,meshnormal_vert:Ly,meshnormal_frag:Iy,meshphong_vert:Dy,meshphong_frag:Ny,meshphysical_vert:Uy,meshphysical_frag:Oy,meshtoon_vert:Fy,meshtoon_frag:By,points_vert:Gy,points_frag:Hy,shadow_vert:Vy,shadow_frag:Wy,sprite_vert:ky,sprite_frag:Xy},Dt={common:{diffuse:{value:new ee(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new te},alphaMap:{value:null},alphaMapTransform:{value:new te},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new te}},envmap:{envMap:{value:null},envMapRotation:{value:new te},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new te}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new te}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new te},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new te},normalScale:{value:new Ct(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new te},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new te}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new te}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new te}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ee(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new q},probesMax:{value:new q},probesResolution:{value:new q}},points:{diffuse:{value:new ee(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new te},alphaTest:{value:0},uvTransform:{value:new te}},sprite:{diffuse:{value:new ee(16777215)},opacity:{value:1},center:{value:new Ct(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new te},alphaMap:{value:null},alphaMapTransform:{value:new te},alphaTest:{value:0}}},ai={basic:{uniforms:on([Dt.common,Dt.specularmap,Dt.envmap,Dt.aomap,Dt.lightmap,Dt.fog]),vertexShader:ie.meshbasic_vert,fragmentShader:ie.meshbasic_frag},lambert:{uniforms:on([Dt.common,Dt.specularmap,Dt.envmap,Dt.aomap,Dt.lightmap,Dt.emissivemap,Dt.bumpmap,Dt.normalmap,Dt.displacementmap,Dt.fog,Dt.lights,{emissive:{value:new ee(0)},envMapIntensity:{value:1}}]),vertexShader:ie.meshlambert_vert,fragmentShader:ie.meshlambert_frag},phong:{uniforms:on([Dt.common,Dt.specularmap,Dt.envmap,Dt.aomap,Dt.lightmap,Dt.emissivemap,Dt.bumpmap,Dt.normalmap,Dt.displacementmap,Dt.fog,Dt.lights,{emissive:{value:new ee(0)},specular:{value:new ee(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:ie.meshphong_vert,fragmentShader:ie.meshphong_frag},standard:{uniforms:on([Dt.common,Dt.envmap,Dt.aomap,Dt.lightmap,Dt.emissivemap,Dt.bumpmap,Dt.normalmap,Dt.displacementmap,Dt.roughnessmap,Dt.metalnessmap,Dt.fog,Dt.lights,{emissive:{value:new ee(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ie.meshphysical_vert,fragmentShader:ie.meshphysical_frag},toon:{uniforms:on([Dt.common,Dt.aomap,Dt.lightmap,Dt.emissivemap,Dt.bumpmap,Dt.normalmap,Dt.displacementmap,Dt.gradientmap,Dt.fog,Dt.lights,{emissive:{value:new ee(0)}}]),vertexShader:ie.meshtoon_vert,fragmentShader:ie.meshtoon_frag},matcap:{uniforms:on([Dt.common,Dt.bumpmap,Dt.normalmap,Dt.displacementmap,Dt.fog,{matcap:{value:null}}]),vertexShader:ie.meshmatcap_vert,fragmentShader:ie.meshmatcap_frag},points:{uniforms:on([Dt.points,Dt.fog]),vertexShader:ie.points_vert,fragmentShader:ie.points_frag},dashed:{uniforms:on([Dt.common,Dt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ie.linedashed_vert,fragmentShader:ie.linedashed_frag},depth:{uniforms:on([Dt.common,Dt.displacementmap]),vertexShader:ie.depth_vert,fragmentShader:ie.depth_frag},normal:{uniforms:on([Dt.common,Dt.bumpmap,Dt.normalmap,Dt.displacementmap,{opacity:{value:1}}]),vertexShader:ie.meshnormal_vert,fragmentShader:ie.meshnormal_frag},sprite:{uniforms:on([Dt.sprite,Dt.fog]),vertexShader:ie.sprite_vert,fragmentShader:ie.sprite_frag},background:{uniforms:{uvTransform:{value:new te},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ie.background_vert,fragmentShader:ie.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new te}},vertexShader:ie.backgroundCube_vert,fragmentShader:ie.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ie.cube_vert,fragmentShader:ie.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ie.equirect_vert,fragmentShader:ie.equirect_frag},distance:{uniforms:on([Dt.common,Dt.displacementmap,{referencePosition:{value:new q},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ie.distance_vert,fragmentShader:ie.distance_frag},shadow:{uniforms:on([Dt.lights,Dt.fog,{color:{value:new ee(0)},opacity:{value:1}}]),vertexShader:ie.shadow_vert,fragmentShader:ie.shadow_frag}};ai.physical={uniforms:on([ai.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new te},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new te},clearcoatNormalScale:{value:new Ct(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new te},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new te},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new te},sheen:{value:0},sheenColor:{value:new ee(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new te},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new te},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new te},transmissionSamplerSize:{value:new Ct},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new te},attenuationDistance:{value:0},attenuationColor:{value:new ee(0)},specularColor:{value:new ee(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new te},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new te},anisotropyVector:{value:new Ct},anisotropyMap:{value:null},anisotropyMapTransform:{value:new te}}]),vertexShader:ie.meshphysical_vert,fragmentShader:ie.meshphysical_frag};const ac={r:0,b:0,g:0},$y=new we,sx=new te;sx.set(-1,0,0,0,1,0,0,0,1);function qy(e,t,n,i,s,a){const o=new ee(0);let r=s===!0?0:1,c,l,d=null,f=0,u=null;function h(v){let y=v.isScene===!0?v.background:null;if(y&&y.isTexture){const g=v.backgroundBlurriness>0;y=t.get(y,g)}return y}function m(v){let y=!1;const g=h(v);g===null?x(o,r):g&&g.isColor&&(x(g,1),y=!0);const b=e.xr.getEnvironmentBlendMode();b==="additive"?n.buffers.color.setClear(0,0,0,1,a):b==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||y)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function _(v,y){const g=h(y);g&&(g.isCubeTexture||g.mapping===Sl)?(l===void 0&&(l=new Se(new Ja(1,1,1),new hi({name:"BackgroundCubeMaterial",uniforms:Wa(ai.backgroundCube.uniforms),vertexShader:ai.backgroundCube.vertexShader,fragmentShader:ai.backgroundCube.fragmentShader,side:fn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(b,S,T){this.matrixWorld.copyPosition(T.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(l)),l.material.uniforms.envMap.value=g,l.material.uniforms.backgroundBlurriness.value=y.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4($y.makeRotationFromEuler(y.backgroundRotation)).transpose(),g.isCubeTexture&&g.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(sx),l.material.toneMapped=oe.getTransfer(g.colorSpace)!==pe,(d!==g||f!==g.version||u!==e.toneMapping)&&(l.material.needsUpdate=!0,d=g,f=g.version,u=e.toneMapping),l.layers.enableAll(),v.unshift(l,l.geometry,l.material,0,0,null)):g&&g.isTexture&&(c===void 0&&(c=new Se(new Al(2,2),new hi({name:"BackgroundMaterial",uniforms:Wa(ai.background.uniforms),vertexShader:ai.background.vertexShader,fragmentShader:ai.background.fragmentShader,side:Ds,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c)),c.material.uniforms.t2D.value=g,c.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,c.material.toneMapped=oe.getTransfer(g.colorSpace)!==pe,g.matrixAutoUpdate===!0&&g.updateMatrix(),c.material.uniforms.uvTransform.value.copy(g.matrix),(d!==g||f!==g.version||u!==e.toneMapping)&&(c.material.needsUpdate=!0,d=g,f=g.version,u=e.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null))}function x(v,y){v.getRGB(ac,Qm(e)),n.buffers.color.setClear(ac.r,ac.g,ac.b,y,a)}function p(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(v,y=1){o.set(v),r=y,x(o,r)},getClearAlpha:function(){return r},setClearAlpha:function(v){r=v,x(o,r)},render:m,addToRenderList:_,dispose:p}}function Yy(e,t){const n=e.getParameter(e.MAX_VERTEX_ATTRIBS),i={},s=u(null);let a=s,o=!1;function r(R,D,O,P,F){let V=!1;const U=f(R,P,O,D);a!==U&&(a=U,l(a.object)),V=h(R,P,O,F),V&&m(R,P,O,F),F!==null&&t.update(F,e.ELEMENT_ARRAY_BUFFER),(V||o)&&(o=!1,g(R,D,O,P),F!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(F).buffer))}function c(){return e.createVertexArray()}function l(R){return e.bindVertexArray(R)}function d(R){return e.deleteVertexArray(R)}function f(R,D,O,P){const F=P.wireframe===!0;let V=i[D.id];V===void 0&&(V={},i[D.id]=V);const U=R.isInstancedMesh===!0?R.id:0;let B=V[U];B===void 0&&(B={},V[U]=B);let I=B[O.id];I===void 0&&(I={},B[O.id]=I);let G=I[F];return G===void 0&&(G=u(c()),I[F]=G),G}function u(R){const D=[],O=[],P=[];for(let F=0;F<n;F++)D[F]=0,O[F]=0,P[F]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:D,enabledAttributes:O,attributeDivisors:P,object:R,attributes:{},index:null}}function h(R,D,O,P){const F=a.attributes,V=D.attributes;let U=0;const B=O.getAttributes();for(const I in B)if(B[I].location>=0){const $=F[I];let J=V[I];if(J===void 0&&(I==="instanceMatrix"&&R.instanceMatrix&&(J=R.instanceMatrix),I==="instanceColor"&&R.instanceColor&&(J=R.instanceColor)),$===void 0||$.attribute!==J||J&&$.data!==J.data)return!0;U++}return a.attributesNum!==U||a.index!==P}function m(R,D,O,P){const F={},V=D.attributes;let U=0;const B=O.getAttributes();for(const I in B)if(B[I].location>=0){let $=V[I];$===void 0&&(I==="instanceMatrix"&&R.instanceMatrix&&($=R.instanceMatrix),I==="instanceColor"&&R.instanceColor&&($=R.instanceColor));const J={};J.attribute=$,$&&$.data&&(J.data=$.data),F[I]=J,U++}a.attributes=F,a.attributesNum=U,a.index=P}function _(){const R=a.newAttributes;for(let D=0,O=R.length;D<O;D++)R[D]=0}function x(R){p(R,0)}function p(R,D){const O=a.newAttributes,P=a.enabledAttributes,F=a.attributeDivisors;O[R]=1,P[R]===0&&(e.enableVertexAttribArray(R),P[R]=1),F[R]!==D&&(e.vertexAttribDivisor(R,D),F[R]=D)}function v(){const R=a.newAttributes,D=a.enabledAttributes;for(let O=0,P=D.length;O<P;O++)D[O]!==R[O]&&(e.disableVertexAttribArray(O),D[O]=0)}function y(R,D,O,P,F,V,U){U===!0?e.vertexAttribIPointer(R,D,O,F,V):e.vertexAttribPointer(R,D,O,P,F,V)}function g(R,D,O,P){_();const F=P.attributes,V=O.getAttributes(),U=D.defaultAttributeValues;for(const B in V){const I=V[B];if(I.location>=0){let G=F[B];if(G===void 0&&(B==="instanceMatrix"&&R.instanceMatrix&&(G=R.instanceMatrix),B==="instanceColor"&&R.instanceColor&&(G=R.instanceColor)),G!==void 0){const $=G.normalized,J=G.itemSize,it=t.get(G);if(it===void 0)continue;const Tt=it.buffer,H=it.type,tt=it.bytesPerElement,k=H===e.INT||H===e.UNSIGNED_INT||G.gpuType===Tu;if(G.isInterleavedBufferAttribute){const W=G.data,at=W.stride,ht=G.offset;if(W.isInstancedInterleavedBuffer){for(let dt=0;dt<I.locationSize;dt++)p(I.location+dt,W.meshPerAttribute);R.isInstancedMesh!==!0&&P._maxInstanceCount===void 0&&(P._maxInstanceCount=W.meshPerAttribute*W.count)}else for(let dt=0;dt<I.locationSize;dt++)x(I.location+dt);e.bindBuffer(e.ARRAY_BUFFER,Tt);for(let dt=0;dt<I.locationSize;dt++)y(I.location+dt,J/I.locationSize,H,$,at*tt,(ht+J/I.locationSize*dt)*tt,k)}else{if(G.isInstancedBufferAttribute){for(let W=0;W<I.locationSize;W++)p(I.location+W,G.meshPerAttribute);R.isInstancedMesh!==!0&&P._maxInstanceCount===void 0&&(P._maxInstanceCount=G.meshPerAttribute*G.count)}else for(let W=0;W<I.locationSize;W++)x(I.location+W);e.bindBuffer(e.ARRAY_BUFFER,Tt);for(let W=0;W<I.locationSize;W++)y(I.location+W,J/I.locationSize,H,$,J*tt,J/I.locationSize*W*tt,k)}}else if(U!==void 0){const $=U[B];if($!==void 0)switch($.length){case 2:e.vertexAttrib2fv(I.location,$);break;case 3:e.vertexAttrib3fv(I.location,$);break;case 4:e.vertexAttrib4fv(I.location,$);break;default:e.vertexAttrib1fv(I.location,$)}}}}v()}function b(){E();for(const R in i){const D=i[R];for(const O in D){const P=D[O];for(const F in P){const V=P[F];for(const U in V)d(V[U].object),delete V[U];delete P[F]}}delete i[R]}}function S(R){if(i[R.id]===void 0)return;const D=i[R.id];for(const O in D){const P=D[O];for(const F in P){const V=P[F];for(const U in V)d(V[U].object),delete V[U];delete P[F]}}delete i[R.id]}function T(R){for(const D in i){const O=i[D];for(const P in O){const F=O[P];if(F[R.id]===void 0)continue;const V=F[R.id];for(const U in V)d(V[U].object),delete V[U];delete F[R.id]}}}function M(R){for(const D in i){const O=i[D],P=R.isInstancedMesh===!0?R.id:0,F=O[P];if(F!==void 0){for(const V in F){const U=F[V];for(const B in U)d(U[B].object),delete U[B];delete F[V]}delete O[P],Object.keys(O).length===0&&delete i[D]}}}function E(){A(),o=!0,a!==s&&(a=s,l(a.object))}function A(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:r,reset:E,resetDefaultState:A,dispose:b,releaseStatesOfGeometry:S,releaseStatesOfObject:M,releaseStatesOfProgram:T,initAttributes:_,enableAttribute:x,disableUnusedAttributes:v}}function Zy(e,t,n){let i;function s(c){i=c}function a(c,l){e.drawArrays(i,c,l),n.update(l,i,1)}function o(c,l,d){d!==0&&(e.drawArraysInstanced(i,c,l,d),n.update(l,i,d))}function r(c,l,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,l,0,d);let u=0;for(let h=0;h<d;h++)u+=l[h];n.update(u,i,1)}this.setMode=s,this.render=a,this.renderInstances=o,this.renderMultiDraw=r}function Ky(e,t,n,i){let s;function a(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){const T=t.get("EXT_texture_filter_anisotropic");s=e.getParameter(T.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(T){return!(T!==Zn&&i.convert(T)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT))}function r(T){const M=T===ui&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(T!==Sn&&T!==oi&&!M&&i.convert(T)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(T){if(T==="highp"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return"highp";T="mediump"}return T==="mediump"&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=n.precision!==void 0?n.precision:"highp";const d=c(l);d!==l&&(Jt("WebGLRenderer:",l,"not supported, using",d,"instead."),l=d);const f=n.logarithmicDepthBuffer===!0,u=n.reversedDepthBuffer===!0&&t.has("EXT_clip_control");n.reversedDepthBuffer===!0&&u===!1&&Jt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const h=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=e.getParameter(e.MAX_TEXTURE_SIZE),x=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),p=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),g=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),b=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:r,precision:l,logarithmicDepthBuffer:f,reversedDepthBuffer:u,maxTextures:h,maxVertexTextures:m,maxTextureSize:_,maxCubemapSize:x,maxAttributes:p,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:g,maxSamples:b,samples:S}}function Jy(e){const t=this;let n=null,i=0,s=!1,a=!1;const o=new ji,r=new te,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(f,u){const h=f.length!==0||u||i!==0||s;return s=u,i=f.length,h},this.beginShadows=function(){a=!0,d(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(f,u){n=d(f,u,0)},this.setState=function(f,u,h){const m=f.clippingPlanes,_=f.clipIntersection,x=f.clipShadows,p=e.get(f);if(!s||m===null||m.length===0||a&&!x)a?d(null):l();else{const v=a?0:i,y=v*4;let g=p.clippingState||null;c.value=g,g=d(m,u,y,h);for(let b=0;b!==y;++b)g[b]=n[b];p.clippingState=g,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=v}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function d(f,u,h,m){const _=f!==null?f.length:0;let x=null;if(_!==0){if(x=c.value,m!==!0||x===null){const p=h+_*4,v=u.matrixWorldInverse;r.getNormalMatrix(v),(x===null||x.length<p)&&(x=new Float32Array(p));for(let y=0,g=h;y!==_;++y,g+=4)o.copy(f[y]).applyMatrix4(v,r),o.normal.toArray(x,g),x[g+3]=o.constant}c.value=x,c.needsUpdate=!0}return t.numPlanes=_,t.numIntersection=0,x}}const Sa=4,Qy=6,jy=20,t2=256,ho=new zl,hh=new ee;let yd=null,bd=0,Sd=0,wd=!1;const e2=new q,ms=new q;class ph{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,n=0,i=.1,s=100,a={}){const{size:o=256,position:r=e2}=a;yd=this._renderer.getRenderTarget(),bd=this._renderer.getActiveCubeFace(),Sd=this._renderer.getActiveMipmapLevel(),wd=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);const c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(t,i,s,c,r),n>0&&this._blur(c,0,0,n),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(t,n=null){return this._fromTexture(t,n)}fromCubemap(t,n=null){return this._fromTexture(t,n)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=gh(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=xh(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(yd,bd,Sd),this._renderer.xr.enabled=wd,t.scissorTest=!1,xa(t,0,0,t.width,t.height)}_fromTexture(t,n){t.mapping===Ns||t.mapping===Ha?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),yd=this._renderer.getRenderTarget(),bd=this._renderer.getActiveCubeFace(),Sd=this._renderer.getActiveMipmapLevel(),wd=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=n||this._allocateTargets();return this._textureToCubeUV(t,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),n=4*this._cubeSize,i={magFilter:We,minFilter:We,generateMipmaps:!1,type:ui,format:Zn,colorSpace:qc,depthBuffer:!1},s=mh(t,n,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==n){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=mh(t,n,i);const{_lodMax:a}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=n2(a)),this._blurMaterial=s2(a,t,n),this._ggxMaterial=i2(a,t,n)}return s}_compileMaterial(t){const n=new Se(new Le,t);this._renderer.compile(n,ho)}_sceneToCubeUV(t,n,i,s,a){const c=new Dn(90,1,n,i),l=[1,-1,1,1,1,1],d=[1,1,1,-1,-1,-1],f=this._renderer,u=f.autoClear,h=f.toneMapping;f.getClearColor(hh),f.toneMapping=li,f.autoClear=!1,f.state.buffers.depth.getReversed()&&(f.setRenderTarget(s),f.clearDepth(),f.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Se(new Ja,new wl({name:"PMREM.Background",side:fn,depthWrite:!1,depthTest:!1})));const _=this._backgroundBox,x=_.material;let p=!1;const v=t.background;v?v.isColor&&(x.color.copy(v),t.background=null,p=!0):(x.color.copy(hh),p=!0);for(let y=0;y<6;y++){const g=y%3;g===0?(c.up.set(0,l[y],0),c.position.set(a.x,a.y,a.z),c.lookAt(a.x+d[y],a.y,a.z)):g===1?(c.up.set(0,0,l[y]),c.position.set(a.x,a.y,a.z),c.lookAt(a.x,a.y+d[y],a.z)):(c.up.set(0,l[y],0),c.position.set(a.x,a.y,a.z),c.lookAt(a.x,a.y,a.z+d[y]));const b=this._cubeSize;xa(s,g*b,y>2?b:0,b,b),f.setRenderTarget(s),p&&f.render(_,c),f.render(t,c)}f.toneMapping=h,f.autoClear=u,t.background=v}_textureToCubeUV(t,n){const i=this._renderer,s=t.mapping===Ns||t.mapping===Ha;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=gh()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=xh());const a=s?this._cubemapMaterial:this._equirectMaterial,o=this._lodMeshes[0];o.material=a;const r=a.uniforms;r.envMap.value=t;const c=this._cubeSize;xa(n,0,0,3*c,2*c),i.setRenderTarget(n),i.render(o,ho)}_applyPMREM(t){const n=this._renderer,i=n.autoClear;n.autoClear=!1;const s=this._lodMeshes.length;for(let a=1;a<s;a++)this._applyGGXFilter(t,a-1,a);n.autoClear=i}_applyGGXFilter(t,n,i){const s=this._renderer,a=this._pingPongRenderTarget,o=this._ggxMaterial,r=this._lodMeshes[i];r.material=o;const c=o.uniforms,l=i/(this._lodMeshes.length-1),d=n/(this._lodMeshes.length-1),f=Math.sqrt(l*l-d*d),u=l*1.25,h=f*u,{_lodMax:m}=this,_=this._sizeLods[i],x=3*_*(i>m-Sa?i-m+Sa:0),p=4*(this._cubeSize-_);c.envMap.value=t.texture,c.roughness.value=h,c.mipInt.value=m-n,xa(a,x,p,3*_,2*_),s.setRenderTarget(a),s.render(r,ho),c.envMap.value=a.texture,c.roughness.value=0,c.mipInt.value=m-i,xa(t,x,p,3*_,2*_),s.setRenderTarget(t),s.render(r,ho)}_blur(t,n,i,s){const a=this._pingPongRenderTarget,o=Math.min(s,Math.PI)/Math.SQRT2;this._blurPass(t,a,n,i,o),this._blurPass(a,t,i,i,o)}_blurPass(t,n,i,s,a){const o=this._renderer,r=this._blurMaterial,c=this._lodMeshes[s];c.material=r;const l=r.uniforms;l.envMap.value=t.texture,l.sigma.value=a,l.mipInt.value=this._lodMax-i;const d=this._sizeLods[s],f=3*d*(s>this._lodMax-Sa?s-this._lodMax+Sa:0),u=4*(this._cubeSize-d);xa(n,f,u,3*d,2*d),o.setRenderTarget(n),o.render(c,ho)}}function n2(e){const t=[],n=[];let i=e;const s=e-Sa+1+Qy;for(let a=0;a<s;a++){const o=Math.pow(2,i);t.push(o);const r=1/(o-2),c=-r,l=1+r,d=[c,c,l,c,l,l,c,c,l,l,c,l],f=6,u=6,h=3,m=new Float32Array(h*u*f),_=new Float32Array(h*u*f);for(let p=0;p<f;p++){const v=p%3*2/3-1,y=p>2?0:-1,g=[v,y,0,v+2/3,y,0,v+2/3,y+1,0,v,y,0,v+2/3,y+1,0,v,y+1,0];m.set(g,h*u*p);for(let b=0;b<u;b++){const S=d[b*2]*2-1,T=d[b*2+1]*2-1;p===0?ms.set(1,T,S):p===1?ms.set(-S,1,-T):p===2?ms.set(-S,T,1):p===3?ms.set(-1,T,-S):p===4?ms.set(-S,-1,T):ms.set(S,T,-1),ms.toArray(_,(p*u+b)*h)}}const x=new Le;x.setAttribute("position",new un(m,h)),x.setAttribute("outputDirection",new un(_,h)),n.push(new Se(x,null)),i>Sa&&i--}return{lodMeshes:n,sizeLods:t}}function mh(e,t,n){const i=new Kn(e,t,n);return i.texture.mapping=Sl,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function xa(e,t,n,i,s){e.viewport.set(t,n,i,s),e.scissor.set(t,n,i,s)}function i2(e,t,n){return new hi({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:t2,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Rl(),fragmentShader:`

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
		`,blending:Ni,depthTest:!1,depthWrite:!1})}function s2(e,t,n){return new hi({name:"SphericalGaussianBlur",defines:{SAMPLES:jy,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Rl(),fragmentShader:`

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
		`,blending:Ni,depthTest:!1,depthWrite:!1})}function xh(){return new hi({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Rl(),fragmentShader:`

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
		`,blending:Ni,depthTest:!1,depthWrite:!1})}function gh(){return new hi({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Rl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Ni,depthTest:!1,depthWrite:!1})}function Rl(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class ax extends Kn{constructor(t=1,n={}){super(t,t,n),this.isWebGLCubeRenderTarget=!0;const i={width:t,height:t,depth:1},s=[i,i,i,i,i,i];this.texture=new Bm(s),this._setTextureOptions(n),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,n){this.texture.type=n.type,this.texture.colorSpace=n.colorSpace,this.texture.generateMipmaps=n.generateMipmaps,this.texture.minFilter=n.minFilter,this.texture.magFilter=n.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new Ja(5,5,5),a=new hi({name:"CubemapFromEquirect",uniforms:Wa(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:fn,blending:Ni});a.uniforms.tEquirect.value=n;const o=new Se(s,a),r=n.minFilter;return n.minFilter===bs&&(n.minFilter=We),new cv(1,10,this).update(t,o),n.minFilter=r,o.geometry.dispose(),o.material.dispose(),this}clear(t,n=!0,i=!0,s=!0){const a=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(n,i,s);t.setRenderTarget(a)}}function a2(e){let t=new WeakMap,n=new WeakMap,i=null;function s(u,h=!1){return u==null?null:h?o(u):a(u)}function a(u){if(u&&u.isTexture){const h=u.mapping;if(h===Xl||h===$l)if(t.has(u)){const m=t.get(u).texture;return r(m,u.mapping)}else{const m=u.image;if(m&&m.height>0){const _=new ax(m.height);return _.fromEquirectangularTexture(e,u),t.set(u,_),u.addEventListener("dispose",l),r(_.texture,u.mapping)}else return null}}return u}function o(u){if(u&&u.isTexture){const h=u.mapping,m=h===Xl||h===$l,_=h===Ns||h===Ha;if(m||_){let x=n.get(u);const p=x!==void 0?x.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==p)return i===null&&(i=new ph(e)),x=m?i.fromEquirectangular(u,x):i.fromCubemap(u,x),x.texture.pmremVersion=u.pmremVersion,n.set(u,x),x.texture;if(x!==void 0)return x.texture;{const v=u.image;return m&&v&&v.height>0||_&&v&&c(v)?(i===null&&(i=new ph(e)),x=m?i.fromEquirectangular(u):i.fromCubemap(u),x.texture.pmremVersion=u.pmremVersion,n.set(u,x),u.addEventListener("dispose",d),x.texture):null}}}return u}function r(u,h){return h===Xl?u.mapping=Ns:h===$l&&(u.mapping=Ha),u}function c(u){let h=0;const m=6;for(let _=0;_<m;_++)u[_]!==void 0&&h++;return h===m}function l(u){const h=u.target;h.removeEventListener("dispose",l);const m=t.get(h);m!==void 0&&(t.delete(h),m.dispose())}function d(u){const h=u.target;h.removeEventListener("dispose",d);const m=n.get(h);m!==void 0&&(n.delete(h),m.dispose())}function f(){t=new WeakMap,n=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:s,dispose:f}}function o2(e){const t={};function n(i){if(t[i]!==void 0)return t[i];const s=e.getExtension(i);return t[i]=s,s}return{has:function(i){return n(i)!==null},init:function(){n("EXT_color_buffer_float"),n("WEBGL_clip_cull_distance"),n("OES_texture_float_linear"),n("EXT_color_buffer_half_float"),n("WEBGL_multisampled_render_to_texture"),n("WEBGL_render_shared_exponent")},get:function(i){const s=n(i);return s===null&&Ia("WebGLRenderer: "+i+" extension not supported."),s}}}function r2(e,t,n,i){const s={},a=new WeakMap;function o(f){const u=f.target;u.index!==null&&t.remove(u.index);for(const m in u.attributes)t.remove(u.attributes[m]);u.removeEventListener("dispose",o),delete s[u.id];const h=a.get(u);h&&(t.remove(h),a.delete(u)),i.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,n.memory.geometries--}function r(f,u){return s[u.id]===!0||(u.addEventListener("dispose",o),s[u.id]=!0,n.memory.geometries++),u}function c(f){const u=f.attributes;for(const h in u)t.update(u[h],e.ARRAY_BUFFER)}function l(f){const u=[],h=f.index,m=f.attributes.position;let _=0;if(m===void 0)return;if(h!==null){const v=h.array;_=h.version;for(let y=0,g=v.length;y<g;y+=3){const b=v[y+0],S=v[y+1],T=v[y+2];u.push(b,S,S,T,T,b)}}else{const v=m.array;_=m.version;for(let y=0,g=v.length/3-1;y<g;y+=3){const b=y+0,S=y+1,T=y+2;u.push(b,S,S,T,T,b)}}const x=new(m.count>=65535?Fm:Om)(u,1);x.version=_;const p=a.get(f);p&&t.remove(p),a.set(f,x)}function d(f){const u=a.get(f);if(u){const h=f.index;h!==null&&u.version<h.version&&l(f)}else l(f);return a.get(f)}return{get:r,update:c,getWireframeAttribute:d}}function c2(e,t,n){let i;function s(f){i=f}let a,o;function r(f){a=f.type,o=f.bytesPerElement}function c(f,u){e.drawElements(i,u,a,f*o),n.update(u,i,1)}function l(f,u,h){h!==0&&(e.drawElementsInstanced(i,u,a,f*o,h),n.update(u,i,h))}function d(f,u,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,u,0,a,f,0,h);let _=0;for(let x=0;x<h;x++)_+=u[x];n.update(_,i,1)}this.setMode=s,this.setIndex=r,this.render=c,this.renderInstances=l,this.renderMultiDraw=d}function l2(e){const t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function i(a,o,r){switch(n.calls++,o){case e.TRIANGLES:n.triangles+=r*(a/3);break;case e.LINES:n.lines+=r*(a/2);break;case e.LINE_STRIP:n.lines+=r*(a-1);break;case e.LINE_LOOP:n.lines+=r*a;break;case e.POINTS:n.points+=r*a;break;default:ce("WebGLInfo: Unknown draw mode:",o);break}}function s(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:s,update:i}}function d2(e,t,n){const i=new WeakMap,s=new Te;function a(o,r,c){const l=o.morphTargetInfluences,d=r.morphAttributes.position||r.morphAttributes.normal||r.morphAttributes.color,f=d!==void 0?d.length:0;let u=i.get(r);if(u===void 0||u.count!==f){let E=function(){T.dispose(),i.delete(r),r.removeEventListener("dispose",E)};u!==void 0&&u.texture.dispose();const h=r.morphAttributes.position!==void 0,m=r.morphAttributes.normal!==void 0,_=r.morphAttributes.color!==void 0,x=r.morphAttributes.position||[],p=r.morphAttributes.normal||[],v=r.morphAttributes.color||[];let y=0;h===!0&&(y=1),m===!0&&(y=2),_===!0&&(y=3);let g=r.attributes.position.count*y,b=1;g>t.maxTextureSize&&(b=Math.ceil(g/t.maxTextureSize),g=t.maxTextureSize);const S=new Float32Array(g*b*4*f),T=new Dm(S,g,b,f);T.type=oi,T.needsUpdate=!0;const M=y*4;for(let A=0;A<f;A++){const R=x[A],D=p[A],O=v[A],P=g*b*4*A;for(let F=0;F<R.count;F++){const V=F*M;h===!0&&(s.fromBufferAttribute(R,F),S[P+V+0]=s.x,S[P+V+1]=s.y,S[P+V+2]=s.z,S[P+V+3]=0),m===!0&&(s.fromBufferAttribute(D,F),S[P+V+4]=s.x,S[P+V+5]=s.y,S[P+V+6]=s.z,S[P+V+7]=0),_===!0&&(s.fromBufferAttribute(O,F),S[P+V+8]=s.x,S[P+V+9]=s.y,S[P+V+10]=s.z,S[P+V+11]=O.itemSize===4?s.w:1)}}u={count:f,texture:T,size:new Ct(g,b)},i.set(r,u),r.addEventListener("dispose",E)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(e,"morphTexture",o.morphTexture,n);else{let h=0;for(let _=0;_<l.length;_++)h+=l[_];const m=r.morphTargetsRelative?1:1-h;c.getUniforms().setValue(e,"morphTargetBaseInfluence",m),c.getUniforms().setValue(e,"morphTargetInfluences",l)}c.getUniforms().setValue(e,"morphTargetsTexture",u.texture,n),c.getUniforms().setValue(e,"morphTargetsTextureSize",u.size)}return{update:a}}function f2(e,t,n,i,s){let a=new WeakMap;function o(l){const d=s.render.frame,f=l.geometry,u=t.get(l,f);if(a.get(u)!==d&&(t.update(u),a.set(u,d)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),a.get(l)!==d&&(n.update(l.instanceMatrix,e.ARRAY_BUFFER),l.instanceColor!==null&&n.update(l.instanceColor,e.ARRAY_BUFFER),a.set(l,d))),l.isSkinnedMesh){const h=l.skeleton;a.get(h)!==d&&(h.update(),a.set(h,d))}return u}function r(){a=new WeakMap}function c(l){const d=l.target;d.removeEventListener("dispose",c),i.releaseStatesOfObject(d),n.remove(d.instanceMatrix),d.instanceColor!==null&&n.remove(d.instanceColor)}return{update:o,dispose:r}}const u2={[_m]:"LINEAR_TONE_MAPPING",[vm]:"REINHARD_TONE_MAPPING",[Mm]:"CINEON_TONE_MAPPING",[ym]:"ACES_FILMIC_TONE_MAPPING",[Sm]:"AGX_TONE_MAPPING",[wm]:"NEUTRAL_TONE_MAPPING",[bm]:"CUSTOM_TONE_MAPPING"};function h2(e,t,n,i,s,a){const o=new Kn(t,n,{type:e,depthBuffer:s,stencilBuffer:a,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let r=null,c=null;const l=new Le;l.setAttribute("position",new le([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new le([0,2,0,0,2,0],2));const d=new ev({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),f=new Se(l,d),u=new zl(-1,1,1,-1,0,1);let h=null,m=null,_=!1,x,p=null,v=[],y=!1;this.setSize=function(g,b){o.setSize(g,b),r!==null&&r.setSize(g,b),c!==null&&c.setSize(g,b);for(let S=0;S<v.length;S++){const T=v[S];T.setSize&&T.setSize(g,b)}},this.setEffects=function(g){v=g,y=v.length>0&&v[0].isRenderPass===!0;const b=o.width,S=o.height;v.length>0&&r===null&&(r=new Kn(b,S,{type:ui,depthBuffer:!1,stencilBuffer:!1}),c=new Kn(b,S,{type:ui,depthBuffer:!1,stencilBuffer:!1}));for(let T=0;T<v.length;T++){const M=v[T];M.setSize&&M.setSize(b,S)}},this.begin=function(g,b){if(_||g.toneMapping===li&&v.length===0)return!1;if(p=b,b!==null){const S=b.width,T=b.height;(o.width!==S||o.height!==T)&&this.setSize(S,T)}return y===!1&&g.setRenderTarget(o),x=g.toneMapping,g.toneMapping=li,!0},this.hasRenderPass=function(){return y},this.end=function(g,b){g.toneMapping=x,_=!0;let S=o,T=r;for(let M=0;M<v.length;M++){const E=v[M];E.enabled!==!1&&(E.render(g,T,S,b),E.needsSwap!==!1&&(S=T,T=T===r?c:r))}if(h!==g.outputColorSpace||m!==g.toneMapping){h=g.outputColorSpace,m=g.toneMapping,d.defines={},oe.getTransfer(h)===pe&&(d.defines.SRGB_TRANSFER="");const M=u2[m];M&&(d.defines[M]=""),d.needsUpdate=!0}d.uniforms.tDiffuse.value=S.texture,g.setRenderTarget(p),g.render(f,u),p=null,_=!1},this.isCompositing=function(){return _},this.dispose=function(){o.dispose(),r!==null&&r.dispose(),c!==null&&c.dispose(),l.dispose(),d.dispose()}}const ox=new je,Vf=new sr(1,1),rx=new Dm,cx=new j1,lx=new Bm,_h=[],vh=[],Mh=new Float32Array(16),yh=new Float32Array(9),bh=new Float32Array(4);function Qa(e,t,n){const i=e[0];if(i<=0||i>0)return e;const s=t*n;let a=_h[s];if(a===void 0&&(a=new Float32Array(s),_h[s]=a),t!==0){i.toArray(a,0);for(let o=1,r=0;o!==t;++o)r+=n,e[o].toArray(a,r)}return a}function Oe(e,t){if(e.length!==t.length)return!1;for(let n=0,i=e.length;n<i;n++)if(e[n]!==t[n])return!1;return!0}function Fe(e,t){for(let n=0,i=t.length;n<i;n++)e[n]=t[n]}function Cl(e,t){let n=vh[t];n===void 0&&(n=new Int32Array(t),vh[t]=n);for(let i=0;i!==t;++i)n[i]=e.allocateTextureUnit();return n}function p2(e,t){const n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function m2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Oe(n,t))return;e.uniform2fv(this.addr,t),Fe(n,t)}}function x2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(Oe(n,t))return;e.uniform3fv(this.addr,t),Fe(n,t)}}function g2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Oe(n,t))return;e.uniform4fv(this.addr,t),Fe(n,t)}}function _2(e,t){const n=this.cache,i=t.elements;if(i===void 0){if(Oe(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),Fe(n,t)}else{if(Oe(n,i))return;bh.set(i),e.uniformMatrix2fv(this.addr,!1,bh),Fe(n,i)}}function v2(e,t){const n=this.cache,i=t.elements;if(i===void 0){if(Oe(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),Fe(n,t)}else{if(Oe(n,i))return;yh.set(i),e.uniformMatrix3fv(this.addr,!1,yh),Fe(n,i)}}function M2(e,t){const n=this.cache,i=t.elements;if(i===void 0){if(Oe(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),Fe(n,t)}else{if(Oe(n,i))return;Mh.set(i),e.uniformMatrix4fv(this.addr,!1,Mh),Fe(n,i)}}function y2(e,t){const n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function b2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Oe(n,t))return;e.uniform2iv(this.addr,t),Fe(n,t)}}function S2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Oe(n,t))return;e.uniform3iv(this.addr,t),Fe(n,t)}}function w2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Oe(n,t))return;e.uniform4iv(this.addr,t),Fe(n,t)}}function E2(e,t){const n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function T2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Oe(n,t))return;e.uniform2uiv(this.addr,t),Fe(n,t)}}function A2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Oe(n,t))return;e.uniform3uiv(this.addr,t),Fe(n,t)}}function z2(e,t){const n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Oe(n,t))return;e.uniform4uiv(this.addr,t),Fe(n,t)}}function R2(e,t,n){const i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s);let a;this.type===e.SAMPLER_2D_SHADOW?(Vf.compareFunction=n.isReversedDepthBuffer()?Iu:Lu,a=Vf):a=ox,n.setTexture2D(t||a,s)}function C2(e,t,n){const i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s),n.setTexture3D(t||cx,s)}function P2(e,t,n){const i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s),n.setTextureCube(t||lx,s)}function L2(e,t,n){const i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s),n.setTexture2DArray(t||rx,s)}function I2(e){switch(e){case 5126:return p2;case 35664:return m2;case 35665:return x2;case 35666:return g2;case 35674:return _2;case 35675:return v2;case 35676:return M2;case 5124:case 35670:return y2;case 35667:case 35671:return b2;case 35668:case 35672:return S2;case 35669:case 35673:return w2;case 5125:return E2;case 36294:return T2;case 36295:return A2;case 36296:return z2;case 35678:case 36198:case 36298:case 36306:case 35682:return R2;case 35679:case 36299:case 36307:return C2;case 35680:case 36300:case 36308:case 36293:return P2;case 36289:case 36303:case 36311:case 36292:return L2}}function D2(e,t){e.uniform1fv(this.addr,t)}function N2(e,t){const n=Qa(t,this.size,2);e.uniform2fv(this.addr,n)}function U2(e,t){const n=Qa(t,this.size,3);e.uniform3fv(this.addr,n)}function O2(e,t){const n=Qa(t,this.size,4);e.uniform4fv(this.addr,n)}function F2(e,t){const n=Qa(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function B2(e,t){const n=Qa(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function G2(e,t){const n=Qa(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function H2(e,t){e.uniform1iv(this.addr,t)}function V2(e,t){e.uniform2iv(this.addr,t)}function W2(e,t){e.uniform3iv(this.addr,t)}function k2(e,t){e.uniform4iv(this.addr,t)}function X2(e,t){e.uniform1uiv(this.addr,t)}function $2(e,t){e.uniform2uiv(this.addr,t)}function q2(e,t){e.uniform3uiv(this.addr,t)}function Y2(e,t){e.uniform4uiv(this.addr,t)}function Z2(e,t,n){const i=this.cache,s=t.length,a=Cl(n,s);Oe(i,a)||(e.uniform1iv(this.addr,a),Fe(i,a));let o;this.type===e.SAMPLER_2D_SHADOW?o=Vf:o=ox;for(let r=0;r!==s;++r)n.setTexture2D(t[r]||o,a[r])}function K2(e,t,n){const i=this.cache,s=t.length,a=Cl(n,s);Oe(i,a)||(e.uniform1iv(this.addr,a),Fe(i,a));for(let o=0;o!==s;++o)n.setTexture3D(t[o]||cx,a[o])}function J2(e,t,n){const i=this.cache,s=t.length,a=Cl(n,s);Oe(i,a)||(e.uniform1iv(this.addr,a),Fe(i,a));for(let o=0;o!==s;++o)n.setTextureCube(t[o]||lx,a[o])}function Q2(e,t,n){const i=this.cache,s=t.length,a=Cl(n,s);Oe(i,a)||(e.uniform1iv(this.addr,a),Fe(i,a));for(let o=0;o!==s;++o)n.setTexture2DArray(t[o]||rx,a[o])}function j2(e){switch(e){case 5126:return D2;case 35664:return N2;case 35665:return U2;case 35666:return O2;case 35674:return F2;case 35675:return B2;case 35676:return G2;case 5124:case 35670:return H2;case 35667:case 35671:return V2;case 35668:case 35672:return W2;case 35669:case 35673:return k2;case 5125:return X2;case 36294:return $2;case 36295:return q2;case 36296:return Y2;case 35678:case 36198:case 36298:case 36306:case 35682:return Z2;case 35679:case 36299:case 36307:return K2;case 35680:case 36300:case 36308:case 36293:return J2;case 36289:case 36303:case 36311:case 36292:return Q2}}class tb{constructor(t,n,i){this.id=t,this.addr=i,this.cache=[],this.type=n.type,this.setValue=I2(n.type)}}class eb{constructor(t,n,i){this.id=t,this.addr=i,this.cache=[],this.type=n.type,this.size=n.size,this.setValue=j2(n.type)}}class nb{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,n,i){const s=this.seq;for(let a=0,o=s.length;a!==o;++a){const r=s[a];r.setValue(t,n[r.id],i)}}}const Ed=/(\w+)(\])?(\[|\.)?/g;function Sh(e,t){e.seq.push(t),e.map[t.id]=t}function ib(e,t,n){const i=e.name,s=i.length;for(Ed.lastIndex=0;;){const a=Ed.exec(i),o=Ed.lastIndex;let r=a[1];const c=a[2]==="]",l=a[3];if(c&&(r=r|0),l===void 0||l==="["&&o+2===s){Sh(n,l===void 0?new tb(r,e,t):new eb(r,e,t));break}else{let f=n.map[r];f===void 0&&(f=new nb(r),Sh(n,f)),n=f}}}class Dc{constructor(t,n){this.seq=[],this.map={};const i=t.getProgramParameter(n,t.ACTIVE_UNIFORMS);for(let o=0;o<i;++o){const r=t.getActiveUniform(n,o),c=t.getUniformLocation(n,r.name);ib(r,c,this)}const s=[],a=[];for(const o of this.seq)o.type===t.SAMPLER_2D_SHADOW||o.type===t.SAMPLER_CUBE_SHADOW||o.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(o):a.push(o);s.length>0&&(this.seq=s.concat(a))}setValue(t,n,i,s){const a=this.map[n];a!==void 0&&a.setValue(t,i,s)}setOptional(t,n,i){const s=n[i];s!==void 0&&this.setValue(t,i,s)}static upload(t,n,i,s){for(let a=0,o=n.length;a!==o;++a){const r=n[a],c=i[r.id];c.needsUpdate!==!1&&r.setValue(t,c.value,s)}}static seqWithValue(t,n){const i=[];for(let s=0,a=t.length;s!==a;++s){const o=t[s];o.id in n&&i.push(o)}return i}}function wh(e,t,n){const i=e.createShader(t);return e.shaderSource(i,n),e.compileShader(i),i}const sb=37297;let ab=0;function ob(e,t){const n=e.split(`
`),i=[],s=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let o=s;o<a;o++){const r=o+1;i.push(`${r===t?">":" "} ${r}: ${n[o]}`)}return i.join(`
`)}const Eh=new te;function rb(e){oe._getMatrix(Eh,oe.workingColorSpace,e);const t=`mat3( ${Eh.elements.map(n=>n.toFixed(4))} )`;switch(oe.getTransfer(e)){case Yc:return[t,"LinearTransferOETF"];case pe:return[t,"sRGBTransferOETF"];default:return Jt("WebGLProgram: Unsupported color space: ",e),[t,"LinearTransferOETF"]}}function Th(e,t,n){const i=e.getShaderParameter(t,e.COMPILE_STATUS),a=(e.getShaderInfoLog(t)||"").trim();if(i&&a==="")return"";const o=/ERROR: 0:(\d+)/.exec(a);if(o){const r=parseInt(o[1]);return n.toUpperCase()+`

`+a+`

`+ob(e.getShaderSource(t),r)}else return a}function cb(e,t){const n=rb(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,"}"].join(`
`)}const lb={[_m]:"Linear",[vm]:"Reinhard",[Mm]:"Cineon",[ym]:"ACESFilmic",[Sm]:"AgX",[wm]:"Neutral",[bm]:"Custom"};function db(e,t){const n=lb[t];return n===void 0?(Jt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+e+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+e+"( vec3 color ) { return "+n+"ToneMapping( color ); }"}const oc=new q;function fb(){oe.getLuminanceCoefficients(oc);const e=oc.x.toFixed(4),t=oc.y.toFixed(4),n=oc.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${e}, ${t}, ${n} );`,"	return dot( weights, rgb );","}"].join(`
`)}function ub(e){return[e.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",e.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ao).join(`
`)}function hb(e){const t=[];for(const n in e){const i=e[n];i!==!1&&t.push("#define "+n+" "+i)}return t.join(`
`)}function pb(e,t){const n={},i=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){const a=e.getActiveAttrib(t,s),o=a.name;let r=1;a.type===e.FLOAT_MAT2&&(r=2),a.type===e.FLOAT_MAT3&&(r=3),a.type===e.FLOAT_MAT4&&(r=4),n[o]={type:a.type,location:e.getAttribLocation(t,o),locationSize:r}}return n}function Ao(e){return e!==""}function Ah(e,t){const n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function zh(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const mb=/^[ \t]*#include +<([\w\d./]+)>/gm;function Wf(e){return e.replace(mb,gb)}const xb=new Map;function gb(e,t){let n=ie[t];if(n===void 0){const i=xb.get(t);if(i!==void 0)n=ie[i],Jt('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return Wf(n)}const _b=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Rh(e){return e.replace(_b,vb)}function vb(e,t,n,i){let s="";for(let a=parseInt(t);a<parseInt(n);a++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+a+" ]").replace(/UNROLLED_LOOP_INDEX/g,a);return s}function Ch(e){let t=`precision ${e.precision} float;
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
#define LOW_PRECISION`),t}const Mb={[Uo]:"SHADOWMAP_TYPE_PCF",[Eo]:"SHADOWMAP_TYPE_VSM"};function yb(e){return Mb[e.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const bb={[Ns]:"ENVMAP_TYPE_CUBE",[Ha]:"ENVMAP_TYPE_CUBE",[Sl]:"ENVMAP_TYPE_CUBE_UV"};function Sb(e){return e.envMap===!1?"ENVMAP_TYPE_CUBE":bb[e.envMapMode]||"ENVMAP_TYPE_CUBE"}const wb={[Ha]:"ENVMAP_MODE_REFRACTION"};function Eb(e){return e.envMap===!1?"ENVMAP_MODE_REFLECTION":wb[e.envMapMode]||"ENVMAP_MODE_REFLECTION"}const Tb={[Eu]:"ENVMAP_BLENDING_MULTIPLY",[C1]:"ENVMAP_BLENDING_MIX",[P1]:"ENVMAP_BLENDING_ADD"};function Ab(e){return e.envMap===!1?"ENVMAP_BLENDING_NONE":Tb[e.combine]||"ENVMAP_BLENDING_NONE"}function zb(e){const t=e.envMapCubeUVHeight;if(t===null)return null;const n=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,n),112)),texelHeight:i,maxMip:n}}function Rb(e,t,n,i){const s=e.getContext(),a=n.defines;let o=n.vertexShader,r=n.fragmentShader;const c=yb(n),l=Sb(n),d=Eb(n),f=Ab(n),u=zb(n),h=ub(n),m=hb(a),_=s.createProgram();let x,p,v=n.glslVersion?"#version "+n.glslVersion+`
`:"";n.isRawShaderMaterial?(x=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m].filter(Ao).join(`
`),x.length>0&&(x+=`
`),p=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m].filter(Ao).join(`
`),p.length>0&&(p+=`
`)):(x=[Ch(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m,n.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",n.batching?"#define USE_BATCHING":"",n.batchingColor?"#define USE_BATCHING_COLOR":"",n.instancing?"#define USE_INSTANCING":"",n.instancingColor?"#define USE_INSTANCING_COLOR":"",n.instancingMorph?"#define USE_INSTANCING_MORPH":"",n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.map?"#define USE_MAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+d:"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.displacementMap?"#define USE_DISPLACEMENTMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.mapUv?"#define MAP_UV "+n.mapUv:"",n.alphaMapUv?"#define ALPHAMAP_UV "+n.alphaMapUv:"",n.lightMapUv?"#define LIGHTMAP_UV "+n.lightMapUv:"",n.aoMapUv?"#define AOMAP_UV "+n.aoMapUv:"",n.emissiveMapUv?"#define EMISSIVEMAP_UV "+n.emissiveMapUv:"",n.bumpMapUv?"#define BUMPMAP_UV "+n.bumpMapUv:"",n.normalMapUv?"#define NORMALMAP_UV "+n.normalMapUv:"",n.displacementMapUv?"#define DISPLACEMENTMAP_UV "+n.displacementMapUv:"",n.metalnessMapUv?"#define METALNESSMAP_UV "+n.metalnessMapUv:"",n.roughnessMapUv?"#define ROUGHNESSMAP_UV "+n.roughnessMapUv:"",n.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+n.anisotropyMapUv:"",n.clearcoatMapUv?"#define CLEARCOATMAP_UV "+n.clearcoatMapUv:"",n.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+n.clearcoatNormalMapUv:"",n.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+n.clearcoatRoughnessMapUv:"",n.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+n.iridescenceMapUv:"",n.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+n.iridescenceThicknessMapUv:"",n.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+n.sheenColorMapUv:"",n.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+n.sheenRoughnessMapUv:"",n.specularMapUv?"#define SPECULARMAP_UV "+n.specularMapUv:"",n.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+n.specularColorMapUv:"",n.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+n.specularIntensityMapUv:"",n.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+n.transmissionMapUv:"",n.thicknessMapUv?"#define THICKNESSMAP_UV "+n.thicknessMapUv:"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexNormals?"#define HAS_NORMAL":"",n.vertexColors?"#define USE_COLOR":"",n.vertexAlphas?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.flatShading?"#define FLAT_SHADED":"",n.skinning?"#define USE_SKINNING":"",n.morphTargets?"#define USE_MORPHTARGETS":"",n.morphNormals&&n.flatShading===!1?"#define USE_MORPHNORMALS":"",n.morphColors?"#define USE_MORPHCOLORS":"",n.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+n.morphTextureStride:"",n.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+n.morphTargetsCount:"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+c:"",n.sizeAttenuation?"#define USE_SIZEATTENUATION":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ao).join(`
`),p=[Ch(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m,n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",n.map?"#define USE_MAP":"",n.matcap?"#define USE_MATCAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+l:"",n.envMap?"#define "+d:"",n.envMap?"#define "+f:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoat?"#define USE_CLEARCOAT":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.dispersion?"#define USE_DISPERSION":"",n.retroreflection?"#define USE_RETROREFLECTION":"",n.iridescence?"#define USE_IRIDESCENCE":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaTest?"#define USE_ALPHATEST":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.sheen?"#define USE_SHEEN":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexColors||n.instancingColor?"#define USE_COLOR":"",n.vertexAlphas||n.batchingColor?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.gradientMap?"#define USE_GRADIENTMAP":"",n.flatShading?"#define FLAT_SHADED":"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+c:"",n.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",n.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",n.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",n.toneMapping!==li?"#define TONE_MAPPING":"",n.toneMapping!==li?ie.tonemapping_pars_fragment:"",n.toneMapping!==li?db("toneMapping",n.toneMapping):"",n.dithering?"#define DITHERING":"",n.opaque?"#define OPAQUE":"",ie.colorspace_pars_fragment,cb("linearToOutputTexel",n.outputColorSpace),fb(),n.useDepthPacking?"#define DEPTH_PACKING "+n.depthPacking:"",`
`].filter(Ao).join(`
`)),o=Wf(o),o=Ah(o,n),o=zh(o,n),r=Wf(r),r=Ah(r,n),r=zh(r,n),o=Rh(o),r=Rh(r),n.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,x=[h,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+x,p=["#define varying in",n.glslVersion===F0?"":"layout(location = 0) out highp vec4 pc_fragColor;",n.glslVersion===F0?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const y=v+x+o,g=v+p+r,b=wh(s,s.VERTEX_SHADER,y),S=wh(s,s.FRAGMENT_SHADER,g);s.attachShader(_,b),s.attachShader(_,S),n.index0AttributeName!==void 0?s.bindAttribLocation(_,0,n.index0AttributeName):n.hasPositionAttribute===!0&&s.bindAttribLocation(_,0,"position"),s.linkProgram(_);function T(R){if(e.debug.checkShaderErrors){const D=s.getProgramInfoLog(_)||"",O=s.getShaderInfoLog(b)||"",P=s.getShaderInfoLog(S)||"",F=D.trim(),V=O.trim(),U=P.trim();let B=!0,I=!0;if(s.getProgramParameter(_,s.LINK_STATUS)===!1)if(B=!1,typeof e.debug.onShaderError=="function")e.debug.onShaderError(s,_,b,S);else{const G=Th(s,b,"vertex"),$=Th(s,S,"fragment");ce("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(_,s.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+F+`
`+G+`
`+$)}else F!==""?Jt("WebGLProgram: Program Info Log:",F):(V===""||U==="")&&(I=!1);I&&(R.diagnostics={runnable:B,programLog:F,vertexShader:{log:V,prefix:x},fragmentShader:{log:U,prefix:p}})}s.deleteShader(b),s.deleteShader(S),M=new Dc(s,_),E=pb(s,_)}let M;this.getUniforms=function(){return M===void 0&&T(this),M};let E;this.getAttributes=function(){return E===void 0&&T(this),E};let A=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return A===!1&&(A=s.getProgramParameter(_,sb)),A},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(_),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=ab++,this.cacheKey=t,this.usedTimes=1,this.program=_,this.vertexShader=b,this.fragmentShader=S,this}let Cb=0;class Pb{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,n,i){const s=this._getShaderCacheForMaterial(t);return s.has(n)===!1&&(s.add(n),n.usedTimes++),s.has(i)===!1&&(s.add(i),i.usedTimes++),this}remove(t){const n=this.materialCache.get(t);for(const i of n)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const n=this.materialCache;let i=n.get(t);return i===void 0&&(i=new Set,n.set(t,i)),i}_getShaderStage(t){const n=this.shaderCache;let i=n.get(t);return i===void 0&&(i=new Lb(t),n.set(t,i)),i}}class Lb{constructor(t){this.id=Cb++,this.code=t,this.usedTimes=0}}function Ib(e){return e===Us||e===kc||e===Xc}function Db(e,t,n,i,s,a){const o=new Nm,r=new Pb,c=new Set,l=[],d=new Map,f=i.logarithmicDepthBuffer;let u=i.precision;const h={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function m(M){return c.add(M),M===0?"uv":`uv${M}`}function _(M,E,A,R,D,O){const P=R.fog,F=D.geometry,V=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?R.environment:null,U=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap,B=t.get(M.envMap||V,U),I=B&&B.mapping===Sl?B.image.height:null,G=h[M.type];M.precision!==null&&(u=i.getMaxPrecision(M.precision),u!==M.precision&&Jt("WebGLProgram.getParameters:",M.precision,"not supported, using",u,"instead."));const $=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,J=$!==void 0?$.length:0;let it=0;F.morphAttributes.position!==void 0&&(it=1),F.morphAttributes.normal!==void 0&&(it=2),F.morphAttributes.color!==void 0&&(it=3);let Tt,H,tt,k;if(G){const Me=ai[G];Tt=Me.vertexShader,H=Me.fragmentShader}else{Tt=M.vertexShader,H=M.fragmentShader;const Me=r.getVertexShaderStage(M),de=r.getFragmentShaderStage(M);r.update(M,Me,de),tt=Me.id,k=de.id}const W=e.getRenderTarget(),at=e.state.buffers.depth.getReversed(),ht=D.isInstancedMesh===!0,dt=D.isBatchedMesh===!0,gt=!!M.map,Kt=!!M.matcap,ct=!!B,ut=!!M.aoMap,vt=!!M.lightMap,_t=!!M.bumpMap&&M.wireframe===!1,Q=!!M.normalMap,St=!!M.displacementMap,Pt=!!M.emissiveMap,yt=!!M.metalnessMap,j=!!M.roughnessMap,L=M.anisotropy>0,xt=M.clearcoat>0,bt=M.dispersion>0,C=M.retroreflectivity>0,w=M.iridescence>0,X=M.sheen>0,K=M.transmission>0,ot=L&&!!M.anisotropyMap,wt=xt&&!!M.clearcoatMap,Mt=xt&&!!M.clearcoatNormalMap,rt=xt&&!!M.clearcoatRoughnessMap,st=w&&!!M.iridescenceMap,At=w&&!!M.iridescenceThicknessMap,Ht=X&&!!M.sheenColorMap,Et=X&&!!M.sheenRoughnessMap,Rt=!!M.specularMap,Vt=!!M.specularColorMap,Zt=!!M.specularIntensityMap,jt=K&&!!M.transmissionMap,Z=K&&!!M.thicknessMap,Lt=!!M.gradientMap,ft=!!M.alphaMap,It=M.alphaTest>0,Ot=!!M.alphaHash,mt=!!M.extensions;let Yt=li;M.toneMapped&&(W===null||W.isXRRenderTarget===!0)&&(Yt=e.toneMapping);const $t={shaderID:G,shaderType:M.type,shaderName:M.name,vertexShader:Tt,fragmentShader:H,defines:M.defines,customVertexShaderID:tt,customFragmentShaderID:k,isRawShaderMaterial:M.isRawShaderMaterial===!0,glslVersion:M.glslVersion,precision:u,batching:dt,batchingColor:dt&&D._colorsTexture!==null,instancing:ht,instancingColor:ht&&D.instanceColor!==null,instancingMorph:ht&&D.morphTexture!==null,outputColorSpace:W===null?e.outputColorSpace:W.isXRRenderTarget===!0?W.texture.colorSpace:oe.workingColorSpace,alphaToCoverage:!!M.alphaToCoverage,map:gt,matcap:Kt,envMap:ct,envMapMode:ct&&B.mapping,envMapCubeUVHeight:I,aoMap:ut,lightMap:vt,bumpMap:_t,normalMap:Q,displacementMap:St,emissiveMap:Pt,normalMapObjectSpace:Q&&M.normalMapType===D1,normalMapTangentSpace:Q&&M.normalMapType===$c,packedNormalMap:Q&&M.normalMapType===$c&&Ib(M.normalMap.format),metalnessMap:yt,roughnessMap:j,anisotropy:L,anisotropyMap:ot,clearcoat:xt,clearcoatMap:wt,clearcoatNormalMap:Mt,clearcoatRoughnessMap:rt,dispersion:bt,retroreflection:C,iridescence:w,iridescenceMap:st,iridescenceThicknessMap:At,sheen:X,sheenColorMap:Ht,sheenRoughnessMap:Et,specularMap:Rt,specularColorMap:Vt,specularIntensityMap:Zt,transmission:K,transmissionMap:jt,thicknessMap:Z,gradientMap:Lt,opaque:M.transparent===!1&&M.blending===Oo&&M.alphaToCoverage===!1,alphaMap:ft,alphaTest:It,alphaHash:Ot,combine:M.combine,mapUv:gt&&m(M.map.channel),aoMapUv:ut&&m(M.aoMap.channel),lightMapUv:vt&&m(M.lightMap.channel),bumpMapUv:_t&&m(M.bumpMap.channel),normalMapUv:Q&&m(M.normalMap.channel),displacementMapUv:St&&m(M.displacementMap.channel),emissiveMapUv:Pt&&m(M.emissiveMap.channel),metalnessMapUv:yt&&m(M.metalnessMap.channel),roughnessMapUv:j&&m(M.roughnessMap.channel),anisotropyMapUv:ot&&m(M.anisotropyMap.channel),clearcoatMapUv:wt&&m(M.clearcoatMap.channel),clearcoatNormalMapUv:Mt&&m(M.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:rt&&m(M.clearcoatRoughnessMap.channel),iridescenceMapUv:st&&m(M.iridescenceMap.channel),iridescenceThicknessMapUv:At&&m(M.iridescenceThicknessMap.channel),sheenColorMapUv:Ht&&m(M.sheenColorMap.channel),sheenRoughnessMapUv:Et&&m(M.sheenRoughnessMap.channel),specularMapUv:Rt&&m(M.specularMap.channel),specularColorMapUv:Vt&&m(M.specularColorMap.channel),specularIntensityMapUv:Zt&&m(M.specularIntensityMap.channel),transmissionMapUv:jt&&m(M.transmissionMap.channel),thicknessMapUv:Z&&m(M.thicknessMap.channel),alphaMapUv:ft&&m(M.alphaMap.channel),vertexTangents:!!F.attributes.tangent&&(Q||L),vertexNormals:!!F.attributes.normal,vertexColors:M.vertexColors,vertexAlphas:M.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,pointsUvs:D.isPoints===!0&&!!F.attributes.uv&&(gt||ft),fog:!!P,useFog:M.fog===!0,fogExp2:!!P&&P.isFogExp2,flatShading:M.wireframe===!1&&(M.flatShading===!0||F.attributes.normal===void 0&&Q===!1&&(M.isMeshLambertMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isMeshPhysicalMaterial)),sizeAttenuation:M.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:at,skinning:D.isSkinnedMesh===!0,hasPositionAttribute:F.attributes.position!==void 0,morphTargets:F.morphAttributes.position!==void 0,morphNormals:F.morphAttributes.normal!==void 0,morphColors:F.morphAttributes.color!==void 0,morphTargetsCount:J,morphTextureStride:it,numSunLights:E.sun.length,numDirLights:E.directional.length,numPointLights:E.point.length,numSpotLights:E.spot.length,numSpotLightMaps:E.spotLightMap.length,numRectAreaLights:E.rectArea.length,numHemiLights:E.hemi.length,numSunLightShadows:E.sunShadowMap.length,numDirLightShadows:E.directionalShadowMap.length,numPointLightShadows:E.pointShadowMap.length,numSpotLightShadows:E.spotShadowMap.length,numSpotLightShadowsWithMaps:E.numSpotLightShadowsWithMaps,numLightProbes:E.numLightProbes,numLightProbeGrids:O.length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:M.dithering,shadowMapEnabled:e.shadowMap.enabled&&A.length>0,shadowMapType:e.shadowMap.type,toneMapping:Yt,decodeVideoTexture:gt&&M.map.isVideoTexture===!0&&oe.getTransfer(M.map.colorSpace)===pe,decodeVideoTextureEmissive:Pt&&M.emissiveMap.isVideoTexture===!0&&oe.getTransfer(M.emissiveMap.colorSpace)===pe,premultipliedAlpha:M.premultipliedAlpha,doubleSided:M.side===Ai,flipSided:M.side===fn,useDepthPacking:M.depthPacking>=0,depthPacking:M.depthPacking||0,index0AttributeName:M.index0AttributeName,extensionClipCullDistance:mt&&M.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(mt&&M.extensions.multiDraw===!0||dt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:M.customProgramCacheKey()};return $t.vertexUv1s=c.has(1),$t.vertexUv2s=c.has(2),$t.vertexUv3s=c.has(3),c.clear(),$t}function x(M){const E=[];if(M.shaderID?E.push(M.shaderID):(E.push(M.customVertexShaderID),E.push(M.customFragmentShaderID)),M.defines!==void 0)for(const A in M.defines)E.push(A),E.push(M.defines[A]);return M.isRawShaderMaterial===!1&&(p(E,M),v(E,M),E.push(e.outputColorSpace)),E.push(M.customProgramCacheKey),E.join()}function p(M,E){M.push(E.precision),M.push(E.outputColorSpace),M.push(E.envMapMode),M.push(E.envMapCubeUVHeight),M.push(E.mapUv),M.push(E.alphaMapUv),M.push(E.lightMapUv),M.push(E.aoMapUv),M.push(E.bumpMapUv),M.push(E.normalMapUv),M.push(E.displacementMapUv),M.push(E.emissiveMapUv),M.push(E.metalnessMapUv),M.push(E.roughnessMapUv),M.push(E.anisotropyMapUv),M.push(E.clearcoatMapUv),M.push(E.clearcoatNormalMapUv),M.push(E.clearcoatRoughnessMapUv),M.push(E.iridescenceMapUv),M.push(E.iridescenceThicknessMapUv),M.push(E.sheenColorMapUv),M.push(E.sheenRoughnessMapUv),M.push(E.specularMapUv),M.push(E.specularColorMapUv),M.push(E.specularIntensityMapUv),M.push(E.transmissionMapUv),M.push(E.thicknessMapUv),M.push(E.combine),M.push(E.fogExp2),M.push(E.sizeAttenuation),M.push(E.morphTargetsCount),M.push(E.morphAttributeCount),M.push(E.numSunLights),M.push(E.numDirLights),M.push(E.numPointLights),M.push(E.numSpotLights),M.push(E.numSpotLightMaps),M.push(E.numHemiLights),M.push(E.numRectAreaLights),M.push(E.numSunLightShadows),M.push(E.numDirLightShadows),M.push(E.numPointLightShadows),M.push(E.numSpotLightShadows),M.push(E.numSpotLightShadowsWithMaps),M.push(E.numLightProbes),M.push(E.shadowMapType),M.push(E.toneMapping),M.push(E.numClippingPlanes),M.push(E.numClipIntersection),M.push(E.depthPacking)}function v(M,E){o.disableAll(),E.instancing&&o.enable(0),E.instancingColor&&o.enable(1),E.instancingMorph&&o.enable(2),E.matcap&&o.enable(3),E.envMap&&o.enable(4),E.normalMapObjectSpace&&o.enable(5),E.normalMapTangentSpace&&o.enable(6),E.clearcoat&&o.enable(7),E.iridescence&&o.enable(8),E.alphaTest&&o.enable(9),E.vertexColors&&o.enable(10),E.vertexAlphas&&o.enable(11),E.vertexUv1s&&o.enable(12),E.vertexUv2s&&o.enable(13),E.vertexUv3s&&o.enable(14),E.vertexTangents&&o.enable(15),E.anisotropy&&o.enable(16),E.alphaHash&&o.enable(17),E.batching&&o.enable(18),E.dispersion&&o.enable(19),E.retroreflection&&o.enable(24),E.batchingColor&&o.enable(20),E.gradientMap&&o.enable(21),E.packedNormalMap&&o.enable(22),E.vertexNormals&&o.enable(23),M.push(o.mask),o.disableAll(),E.fog&&o.enable(0),E.useFog&&o.enable(1),E.flatShading&&o.enable(2),E.logarithmicDepthBuffer&&o.enable(3),E.reversedDepthBuffer&&o.enable(4),E.skinning&&o.enable(5),E.morphTargets&&o.enable(6),E.morphNormals&&o.enable(7),E.morphColors&&o.enable(8),E.premultipliedAlpha&&o.enable(9),E.shadowMapEnabled&&o.enable(10),E.doubleSided&&o.enable(11),E.flipSided&&o.enable(12),E.useDepthPacking&&o.enable(13),E.dithering&&o.enable(14),E.transmission&&o.enable(15),E.sheen&&o.enable(16),E.opaque&&o.enable(17),E.pointsUvs&&o.enable(18),E.decodeVideoTexture&&o.enable(19),E.decodeVideoTextureEmissive&&o.enable(20),E.alphaToCoverage&&o.enable(21),E.numLightProbeGrids>0&&o.enable(22),E.hasPositionAttribute&&o.enable(23),M.push(o.mask)}function y(M){const E=h[M.type];let A;if(E){const R=ai[E];A=Q_.clone(R.uniforms)}else A=M.uniforms;return A}function g(M,E){let A=d.get(E);return A!==void 0?++A.usedTimes:(A=new Rb(e,E,M,s),l.push(A),d.set(E,A)),A}function b(M){if(--M.usedTimes===0){const E=l.indexOf(M);l[E]=l[l.length-1],l.pop(),d.delete(M.cacheKey),M.destroy()}}function S(M){r.remove(M)}function T(){r.dispose()}return{getParameters:_,getProgramCacheKey:x,getUniforms:y,acquireProgram:g,releaseProgram:b,releaseShaderCache:S,programs:l,dispose:T}}function Nb(){let e=new WeakMap;function t(o){return e.has(o)}function n(o){let r=e.get(o);return r===void 0&&(r={},e.set(o,r)),r}function i(o){e.delete(o)}function s(o,r,c){e.get(o)[r]=c}function a(){e=new WeakMap}return{has:t,get:n,remove:i,update:s,dispose:a}}function Ub(e,t){return e.groupOrder!==t.groupOrder?e.groupOrder-t.groupOrder:e.renderOrder!==t.renderOrder?e.renderOrder-t.renderOrder:e.material.id!==t.material.id?e.material.id-t.material.id:e.materialVariant!==t.materialVariant?e.materialVariant-t.materialVariant:e.z!==t.z?e.z-t.z:e.id-t.id}function Ph(e,t){return e.groupOrder!==t.groupOrder?e.groupOrder-t.groupOrder:e.renderOrder!==t.renderOrder?e.renderOrder-t.renderOrder:e.z!==t.z?t.z-e.z:e.id-t.id}function Lh(){const e=[];let t=0;const n=[],i=[],s=[];function a(){t=0,n.length=0,i.length=0,s.length=0}function o(u){let h=0;return u.isInstancedMesh&&(h+=2),u.isSkinnedMesh&&(h+=1),h}function r(u,h,m,_,x,p){let v=e[t];return v===void 0?(v={id:u.id,object:u,geometry:h,material:m,materialVariant:o(u),groupOrder:_,renderOrder:u.renderOrder,z:x,group:p},e[t]=v):(v.id=u.id,v.object=u,v.geometry=h,v.material=m,v.materialVariant=o(u),v.groupOrder=_,v.renderOrder=u.renderOrder,v.z=x,v.group=p),t++,v}function c(u,h,m,_,x,p,v){v.reversedDepth===!0&&(x=-x);const y=r(u,h,m,_,x,p);m.transmission>0?i.push(y):m.transparent===!0?s.push(y):n.push(y)}function l(u,h,m,_,x,p){const v=r(u,h,m,_,x,p);m.transmission>0?i.unshift(v):m.transparent===!0?s.unshift(v):n.unshift(v)}function d(u,h){n.length>1&&n.sort(u||Ub),i.length>1&&i.sort(h||Ph),s.length>1&&s.sort(h||Ph)}function f(){for(let u=t,h=e.length;u<h;u++){const m=e[u];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:n,transmissive:i,transparent:s,init:a,push:c,unshift:l,finish:f,sort:d}}function Ob(){let e=new WeakMap;function t(i,s){const a=e.get(i);let o;return a===void 0?(o=new Lh,e.set(i,[o])):s>=a.length?(o=new Lh,a.push(o)):o=a[s],o}function n(){e=new WeakMap}return{get:t,dispose:n}}function Fb(){const e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"SunLight":case"DirectionalLight":n={direction:new q,color:new ee};break;case"SpotLight":n={position:new q,direction:new q,color:new ee,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":n={position:new q,color:new ee,distance:0,decay:0};break;case"HemisphereLight":n={direction:new q,skyColor:new ee,groundColor:new ee};break;case"RectAreaLight":n={color:new ee,position:new q,halfWidth:new q,halfHeight:new q};break}return e[t.id]=n,n}}}function Bb(){const e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"SunLight":case"DirectionalLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ct};break;case"SpotLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ct};break;case"PointLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ct,shadowCameraNear:1,shadowCameraFar:1e3};break}return e[t.id]=n,n}}}let Gb=0;function Hb(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+(t.map?1:0)-(e.map?1:0)}function Vb(e){const t=new Fb,n=Bb(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)i.probe.push(new q);const s=new q,a=new we,o=new we;function r(l){let d=0,f=0,u=0;for(let D=0;D<9;D++)i.probe[D].set(0,0,0);let h=0,m=0,_=0,x=0,p=0,v=0,y=0,g=0,b=0,S=0,T=0,M=0,E=0,A=0;l.sort(Hb);for(let D=0,O=l.length;D<O;D++){const P=l[D],F=P.color,V=P.intensity,U=P.distance;let B=null;if(P.shadow&&P.shadow.map&&(P.shadow.map.texture.format===Us?B=P.shadow.map.texture:B=P.shadow.map.depthTexture||P.shadow.map.texture),P.isAmbientLight)d+=F.r*V,f+=F.g*V,u+=F.b*V;else if(P.isLightProbe){for(let I=0;I<9;I++)i.probe[I].addScaledVector(P.sh.coefficients[I],V);A++}else if(P.isSunLight){const I=t.get(P);if(I.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){const G=P.shadow,$=n.get(P);$.shadowIntensity=G.intensity,$.shadowBias=G.bias,$.shadowNormalBias=G.normalBias,$.shadowRadius=G.radius,$.shadowMapSize.copy(G.mapSize).multiply(G.getFrameExtents()),i.sunShadow[m]=$,i.sunShadowMap[m]=B;const J=G.getViewportCount();for(let it=0;it<J;it++)i.sunShadowMatrix[_+it]=G.getMatrix(it),i.sunShadowCascade[_+it]=G._cascadeData[it];_+=J,m++}i.sun[h]=I,h++}else if(P.isDirectionalLight){const I=t.get(P);if(I.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){const G=P.shadow,$=n.get(P);$.shadowIntensity=G.intensity,$.shadowBias=G.bias,$.shadowNormalBias=G.normalBias,$.shadowRadius=G.radius,$.shadowMapSize=G.mapSize,i.directionalShadow[x]=$,i.directionalShadowMap[x]=B,i.directionalShadowMatrix[x]=P.shadow.matrix,b++}i.directional[x]=I,x++}else if(P.isSpotLight){const I=t.get(P);I.position.setFromMatrixPosition(P.matrixWorld),I.color.copy(F).multiplyScalar(V),I.distance=U,I.coneCos=Math.cos(P.angle),I.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),I.decay=P.decay,i.spot[v]=I;const G=P.shadow;if(P.map&&(i.spotLightMap[M]=P.map,M++,G.updateMatrices(P),P.castShadow&&E++),i.spotLightMatrix[v]=G.matrix,P.castShadow){const $=n.get(P);$.shadowIntensity=G.intensity,$.shadowBias=G.bias,$.shadowNormalBias=G.normalBias,$.shadowRadius=G.radius,$.shadowMapSize=G.mapSize,i.spotShadow[v]=$,i.spotShadowMap[v]=B,T++}v++}else if(P.isRectAreaLight){const I=t.get(P);I.color.copy(F).multiplyScalar(V),I.halfWidth.set(P.width*.5,0,0),I.halfHeight.set(0,P.height*.5,0),i.rectArea[y]=I,y++}else if(P.isPointLight){const I=t.get(P);if(I.color.copy(P.color).multiplyScalar(P.intensity),I.distance=P.distance,I.decay=P.decay,P.castShadow){const G=P.shadow,$=n.get(P);$.shadowIntensity=G.intensity,$.shadowBias=G.bias,$.shadowNormalBias=G.normalBias,$.shadowRadius=G.radius,$.shadowMapSize=G.mapSize,$.shadowCameraNear=G.camera.near,$.shadowCameraFar=G.camera.far,i.pointShadow[p]=$,i.pointShadowMap[p]=B,i.pointShadowMatrix[p]=P.shadow.matrix,S++}i.point[p]=I,p++}else if(P.isHemisphereLight){const I=t.get(P);I.skyColor.copy(P.color).multiplyScalar(V),I.groundColor.copy(P.groundColor).multiplyScalar(V),i.hemi[g]=I,g++}}y>0&&(e.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=Dt.LTC_FLOAT_1,i.rectAreaLTC2=Dt.LTC_FLOAT_2):(i.rectAreaLTC1=Dt.LTC_HALF_1,i.rectAreaLTC2=Dt.LTC_HALF_2)),i.ambient[0]=d,i.ambient[1]=f,i.ambient[2]=u;const R=i.hash;(R.sunLength!==h||R.directionalLength!==x||R.pointLength!==p||R.spotLength!==v||R.rectAreaLength!==y||R.hemiLength!==g||R.numSunShadows!==m||R.numDirectionalShadows!==b||R.numPointShadows!==S||R.numSpotShadows!==T||R.numSpotMaps!==M||R.numLightProbes!==A)&&(i.sun.length=h,i.directional.length=x,i.spot.length=v,i.rectArea.length=y,i.point.length=p,i.hemi.length=g,i.sunShadow.length=m,i.sunShadowMap.length=m,i.sunShadowMatrix.length=_,i.sunShadowCascade.length=_,i.directionalShadow.length=b,i.directionalShadowMap.length=b,i.directionalShadowMatrix.length=b,i.pointShadow.length=S,i.pointShadowMap.length=S,i.pointShadowMatrix.length=S,i.spotShadow.length=T,i.spotShadowMap.length=T,i.spotLightMatrix.length=T+M-E,i.spotLightMap.length=M,i.numSpotLightShadowsWithMaps=E,i.numLightProbes=A,R.sunLength=h,R.directionalLength=x,R.pointLength=p,R.spotLength=v,R.rectAreaLength=y,R.hemiLength=g,R.numSunShadows=m,R.numDirectionalShadows=b,R.numPointShadows=S,R.numSpotShadows=T,R.numSpotMaps=M,R.numLightProbes=A,i.version=Gb++)}function c(l,d){let f=0,u=0,h=0,m=0,_=0,x=0;const p=d.matrixWorldInverse;for(let v=0,y=l.length;v<y;v++){const g=l[v];if(g.isSunLight){const b=i.sun[f];b.direction.setFromMatrixPosition(g.matrixWorld),b.direction.transformDirection(p),f++}else if(g.isDirectionalLight){const b=i.directional[u];b.direction.setFromMatrixPosition(g.matrixWorld),s.setFromMatrixPosition(g.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(p),u++}else if(g.isSpotLight){const b=i.spot[m];b.position.setFromMatrixPosition(g.matrixWorld),b.position.applyMatrix4(p),b.direction.setFromMatrixPosition(g.matrixWorld),s.setFromMatrixPosition(g.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(p),m++}else if(g.isRectAreaLight){const b=i.rectArea[_];b.position.setFromMatrixPosition(g.matrixWorld),b.position.applyMatrix4(p),o.identity(),a.copy(g.matrixWorld),a.premultiply(p),o.extractRotation(a),b.halfWidth.set(g.width*.5,0,0),b.halfHeight.set(0,g.height*.5,0),b.halfWidth.applyMatrix4(o),b.halfHeight.applyMatrix4(o),_++}else if(g.isPointLight){const b=i.point[h];b.position.setFromMatrixPosition(g.matrixWorld),b.position.applyMatrix4(p),h++}else if(g.isHemisphereLight){const b=i.hemi[x];b.direction.setFromMatrixPosition(g.matrixWorld),b.direction.transformDirection(p),x++}}}return{setup:r,setupView:c,state:i}}function Ih(e){const t=new Vb(e),n=[],i=[],s=[];function a(u){f.camera=u,n.length=0,i.length=0,s.length=0}function o(u){n.push(u)}function r(u){i.push(u)}function c(u){s.push(u)}function l(){t.setup(n)}function d(u){t.setupView(n,u)}const f={lightsArray:n,shadowsArray:i,lightProbeGridArray:s,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:f,setupLights:l,setupLightsView:d,pushLight:o,pushShadow:r,pushLightProbeGrid:c}}function Wb(e){let t=new WeakMap;function n(s,a=0){const o=t.get(s);let r;return o===void 0?(r=new Ih(e),t.set(s,[r])):a>=o.length?(r=new Ih(e),o.push(r)):r=o[a],r}function i(){t=new WeakMap}return{get:n,dispose:i}}const kb=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Xb=`uniform sampler2D shadow_pass;
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
}`,$b=[new q(1,0,0),new q(-1,0,0),new q(0,1,0),new q(0,-1,0),new q(0,0,1),new q(0,0,-1)],qb=[new q(0,-1,0),new q(0,-1,0),new q(0,0,1),new q(0,0,-1),new q(0,-1,0),new q(0,-1,0)],Dh=new we,po=new q,Td=new q;function Yb(e,t,n){let i=new Uu;const s=new Ct,a=new Ct,o=new Te,r=new nv,c=new iv,l={},d=n.maxTextureSize,f={[Ds]:fn,[fn]:Ds,[Ai]:Ai},u=new hi({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ct},radius:{value:4}},vertexShader:kb,fragmentShader:Xb}),h=u.clone();h.defines.HORIZONTAL_PASS=1;const m=new Le;m.setAttribute("position",new un(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new Se(m,u),x=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Uo;let p=this.type;this.render=function(S,T,M){if(x.enabled===!1||x.autoUpdate===!1&&x.needsUpdate===!1||S.length===0)return;this.type===f1&&(Jt("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Uo);const E=e.getRenderTarget(),A=e.getActiveCubeFace(),R=e.getActiveMipmapLevel(),D=e.state;D.setBlending(Ni),D.buffers.depth.getReversed()===!0?D.buffers.color.setClear(0,0,0,0):D.buffers.color.setClear(1,1,1,1),D.buffers.depth.setTest(!0),D.setScissorTest(!1);const O=p!==this.type;O&&T.traverse(function(P){P.material&&(Array.isArray(P.material)?P.material.forEach(F=>F.needsUpdate=!0):P.material.needsUpdate=!0)});for(let P=0,F=S.length;P<F;P++){const V=S[P],U=V.shadow;if(U===void 0){Jt("WebGLShadowMap:",V,"has no shadow.");continue}if(U.autoUpdate===!1&&U.needsUpdate===!1)continue;s.copy(U.mapSize);const B=U.getFrameExtents();s.multiply(B),a.copy(U.mapSize),(s.x>d||s.y>d)&&(s.x>d&&(a.x=Math.floor(d/B.x),s.x=a.x*B.x,U.mapSize.x=a.x),s.y>d&&(a.y=Math.floor(d/B.y),s.y=a.y*B.y,U.mapSize.y=a.y));const I=e.state.buffers.depth.getReversed();if(U.camera._reversedDepth=I,U.map===null||O===!0){if(U.map!==null&&(U.map.depthTexture!==null&&(U.map.depthTexture.dispose(),U.map.depthTexture=null),U.map.dispose()),this.type===Eo){if(V.isPointLight){Jt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}U.map=new Kn(s.x,s.y,{format:Us,type:ui,minFilter:We,magFilter:We,generateMipmaps:!1}),U.map.texture.name=V.name+".shadowMap",U.map.depthTexture=new sr(s.x,s.y,oi),U.map.depthTexture.name=V.name+".shadowMapDepth",U.map.depthTexture.format=Fi,U.map.depthTexture.compareFunction=null,U.map.depthTexture.minFilter=Ve,U.map.depthTexture.magFilter=Ve}else V.isPointLight?(U.map=new ax(s.x),U.map.depthTexture=new __(s.x,fi)):(U.map=new Kn(s.x,s.y),U.map.depthTexture=new sr(s.x,s.y,fi)),U.map.depthTexture.name=V.name+".shadowMap",U.map.depthTexture.format=Fi,this.type===Uo?(U.map.depthTexture.compareFunction=I?Iu:Lu,U.map.depthTexture.minFilter=We,U.map.depthTexture.magFilter=We):(U.map.depthTexture.compareFunction=null,U.map.depthTexture.minFilter=Ve,U.map.depthTexture.magFilter=Ve);U.camera.updateProjectionMatrix()}U.map.isWebGLCubeRenderTarget!==!0&&(U.map.width!==s.x||U.map.height!==s.y)&&U.map.setSize(s.x,s.y);const G=U.map.isWebGLCubeRenderTarget?6:U.getViewportCount();V.isPointLight!==!0&&U.updateMatrices(V,M);for(let $=0;$<G;$++){const J=U.getCamera($);if(V.isPointLight){const it=U.camera,Tt=U.matrix,H=V.distance||it.far;H!==it.far&&(it.far=H,it.updateProjectionMatrix()),po.setFromMatrixPosition(V.matrixWorld),it.position.copy(po),Td.copy(it.position),Td.add($b[$]),it.up.copy(qb[$]),it.lookAt(Td),it.updateMatrixWorld(),Tt.makeTranslation(-po.x,-po.y,-po.z),Dh.multiplyMatrices(it.projectionMatrix,it.matrixWorldInverse),U._frustum.setFromProjectionMatrix(Dh,it.coordinateSystem,it.reversedDepth)}if(U.map.isWebGLCubeRenderTarget)e.setRenderTarget(U.map,$),e.clear();else{$===0&&(e.setRenderTarget(U.map),e.clear());const it=U.getViewport($);o.set(a.x*it.x,a.y*it.y,a.x*it.z,a.y*it.w),D.viewport(o)}i=U.getFrustum($),g(T,M,J,V,this.type)}U.isPointLightShadow!==!0&&this.type===Eo&&v(U,M),U.needsUpdate=!1}p=this.type,x.needsUpdate=!1,e.setRenderTarget(E,A,R)};function v(S,T){const M=t.update(_);u.defines.VSM_SAMPLES!==S.blurSamples&&(u.defines.VSM_SAMPLES=S.blurSamples,h.defines.VSM_SAMPLES=S.blurSamples,u.needsUpdate=!0,h.needsUpdate=!0),S.mapPass===null?S.mapPass=new Kn(s.x,s.y,{format:Us,type:ui}):(S.mapPass.width!==S.map.width||S.mapPass.height!==S.map.height)&&S.mapPass.setSize(S.map.width,S.map.height),u.uniforms.shadow_pass.value=S.map.depthTexture,u.uniforms.resolution.value.set(S.map.width,S.map.height),u.uniforms.radius.value=S.radius,e.setRenderTarget(S.mapPass),e.clear(),e.renderBufferDirect(T,null,M,u,_,null),h.uniforms.shadow_pass.value=S.mapPass.texture,h.uniforms.resolution.value.set(S.map.width,S.map.height),h.uniforms.radius.value=S.radius,e.setRenderTarget(S.map),e.clear(),e.renderBufferDirect(T,null,M,h,_,null)}function y(S,T,M,E){let A=null;const R=M.isPointLight===!0?S.customDistanceMaterial:S.customDepthMaterial;if(R!==void 0)A=R;else if(A=M.isPointLight===!0?c:r,e.localClippingEnabled&&T.clipShadows===!0&&Array.isArray(T.clippingPlanes)&&T.clippingPlanes.length!==0||T.displacementMap&&T.displacementScale!==0||T.alphaMap&&T.alphaTest>0||T.map&&T.alphaTest>0||T.alphaToCoverage===!0){const D=A.uuid,O=T.uuid;let P=l[D];P===void 0&&(P={},l[D]=P);let F=P[O];F===void 0&&(F=A.clone(),P[O]=F,T.addEventListener("dispose",b)),A=F}if(A.visible=T.visible,A.wireframe=T.wireframe,E===Eo?A.side=T.shadowSide!==null?T.shadowSide:T.side:A.side=T.shadowSide!==null?T.shadowSide:f[T.side],A.alphaMap=T.alphaMap,A.alphaTest=T.alphaToCoverage===!0?.5:T.alphaTest,A.map=T.map,A.clipShadows=T.clipShadows,A.clippingPlanes=T.clippingPlanes,A.clipIntersection=T.clipIntersection,A.displacementMap=T.displacementMap,A.displacementScale=T.displacementScale,A.displacementBias=T.displacementBias,A.wireframeLinewidth=T.wireframeLinewidth,A.linewidth=T.linewidth,M.isPointLight===!0&&A.isMeshDistanceMaterial===!0){const D=e.properties.get(A);D.light=M}return A}function g(S,T,M,E,A){if(S.visible===!1)return;if(S.layers.test(T.layers)&&(S.isMesh||S.isLine||S.isPoints)&&(S.castShadow||S.receiveShadow&&A===Eo)&&(!S.frustumCulled||S.intersectsFrustum(i))){S.modelViewMatrix.multiplyMatrices(M.matrixWorldInverse,S.matrixWorld);const O=t.update(S),P=S.material;if(Array.isArray(P)){const F=O.groups;for(let V=0,U=F.length;V<U;V++){const B=F[V],I=P[B.materialIndex];if(I&&I.visible){const G=y(S,I,E,A);S.onBeforeShadow(e,S,T,M,O,G,B),e.renderBufferDirect(M,null,O,G,S,B),S.onAfterShadow(e,S,T,M,O,G,B)}}}else if(P.visible){const F=y(S,P,E,A);S.onBeforeShadow(e,S,T,M,O,F,null),e.renderBufferDirect(M,null,O,F,S,null),S.onAfterShadow(e,S,T,M,O,F,null)}}const D=S.children;for(let O=0,P=D.length;O<P;O++)g(D[O],T,M,E,A)}function b(S){S.target.removeEventListener("dispose",b);for(const M in l){const E=l[M],A=S.target.uuid;A in E&&(E[A].dispose(),delete E[A])}}}function Zb(e,t){function n(){let Z=!1;const Lt=new Te;let ft=null;const It=new Te(0,0,0,0);return{setMask:function(Ot){ft!==Ot&&!Z&&(e.colorMask(Ot,Ot,Ot,Ot),ft=Ot)},setLocked:function(Ot){Z=Ot},setClear:function(Ot,mt,Yt,$t,Me){Me===!0&&(Ot*=$t,mt*=$t,Yt*=$t),Lt.set(Ot,mt,Yt,$t),It.equals(Lt)===!1&&(e.clearColor(Ot,mt,Yt,$t),It.copy(Lt))},reset:function(){Z=!1,ft=null,It.set(-1,0,0,0)}}}function i(){let Z=!1,Lt=!1,ft=null,It=null,Ot=null;return{setReversed:function(mt){if(Lt!==mt){const Yt=t.get("EXT_clip_control");mt?Yt.clipControlEXT(Yt.LOWER_LEFT_EXT,Yt.ZERO_TO_ONE_EXT):Yt.clipControlEXT(Yt.LOWER_LEFT_EXT,Yt.NEGATIVE_ONE_TO_ONE_EXT),Lt=mt;const $t=Ot;Ot=null,this.setClear($t)}},getReversed:function(){return Lt},setTest:function(mt){mt?W(e.DEPTH_TEST):at(e.DEPTH_TEST)},setMask:function(mt){ft!==mt&&!Z&&(e.depthMask(mt),ft=mt)},setFunc:function(mt){if(Lt&&(mt=$1[mt]),It!==mt){switch(mt){case tf:e.depthFunc(e.NEVER);break;case ef:e.depthFunc(e.ALWAYS);break;case nf:e.depthFunc(e.LESS);break;case jo:e.depthFunc(e.LEQUAL);break;case sf:e.depthFunc(e.EQUAL);break;case af:e.depthFunc(e.GEQUAL);break;case of:e.depthFunc(e.GREATER);break;case rf:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}It=mt}},setLocked:function(mt){Z=mt},setClear:function(mt){Ot!==mt&&(Ot=mt,Lt&&(mt=1-mt),e.clearDepth(mt))},reset:function(){Z=!1,ft=null,It=null,Ot=null,Lt=!1}}}function s(){let Z=!1,Lt=null,ft=null,It=null,Ot=null,mt=null,Yt=null,$t=null,Me=null;return{setTest:function(de){Z||(de?W(e.STENCIL_TEST):at(e.STENCIL_TEST))},setMask:function(de){Lt!==de&&!Z&&(e.stencilMask(de),Lt=de)},setFunc:function(de,Bn,jn){(ft!==de||It!==Bn||Ot!==jn)&&(e.stencilFunc(de,Bn,jn),ft=de,It=Bn,Ot=jn)},setOp:function(de,Bn,jn){(mt!==de||Yt!==Bn||$t!==jn)&&(e.stencilOp(de,Bn,jn),mt=de,Yt=Bn,$t=jn)},setLocked:function(de){Z=de},setClear:function(de){Me!==de&&(e.clearStencil(de),Me=de)},reset:function(){Z=!1,Lt=null,ft=null,It=null,Ot=null,mt=null,Yt=null,$t=null,Me=null}}}const a=new n,o=new i,r=new s,c=new WeakMap,l=new WeakMap;let d={},f={},u={},h=new WeakMap,m=[],_=null,x=!1,p=null,v=null,y=null,g=null,b=null,S=null,T=null,M=new ee(0,0,0),E=0,A=!1,R=null,D=null,O=null,P=null,F=null;const V=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let U=!1,B=0;const I=e.getParameter(e.VERSION);I.indexOf("WebGL")!==-1?(B=parseFloat(/^WebGL (\d)/.exec(I)[1]),U=B>=1):I.indexOf("OpenGL ES")!==-1&&(B=parseFloat(/^OpenGL ES (\d)/.exec(I)[1]),U=B>=2);let G=null,$={};const J=e.getParameter(e.SCISSOR_BOX),it=e.getParameter(e.VIEWPORT),Tt=new Te().fromArray(J),H=new Te().fromArray(it);function tt(Z,Lt,ft,It){const Ot=new Uint8Array(4),mt=e.createTexture();e.bindTexture(Z,mt),e.texParameteri(Z,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(Z,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let Yt=0;Yt<ft;Yt++)Z===e.TEXTURE_3D||Z===e.TEXTURE_2D_ARRAY?e.texImage3D(Lt,0,e.RGBA,1,1,It,0,e.RGBA,e.UNSIGNED_BYTE,Ot):e.texImage2D(Lt+Yt,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,Ot);return mt}const k={};k[e.TEXTURE_2D]=tt(e.TEXTURE_2D,e.TEXTURE_2D,1),k[e.TEXTURE_CUBE_MAP]=tt(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),k[e.TEXTURE_2D_ARRAY]=tt(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),k[e.TEXTURE_3D]=tt(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),r.setClear(0),W(e.DEPTH_TEST),o.setFunc(jo),_t(!1),Q(D0),W(e.CULL_FACE),ut(Ni);function W(Z){d[Z]!==!0&&(e.enable(Z),d[Z]=!0)}function at(Z){d[Z]!==!1&&(e.disable(Z),d[Z]=!1)}function ht(Z,Lt){return u[Z]!==Lt?(e.bindFramebuffer(Z,Lt),u[Z]=Lt,Z===e.DRAW_FRAMEBUFFER&&(u[e.FRAMEBUFFER]=Lt),Z===e.FRAMEBUFFER&&(u[e.DRAW_FRAMEBUFFER]=Lt),!0):!1}function dt(Z,Lt){let ft=m,It=!1;if(Z){ft=h.get(Lt),ft===void 0&&(ft=[],h.set(Lt,ft));const Ot=Z.textures;if(ft.length!==Ot.length||ft[0]!==e.COLOR_ATTACHMENT0){for(let mt=0,Yt=Ot.length;mt<Yt;mt++)ft[mt]=e.COLOR_ATTACHMENT0+mt;ft.length=Ot.length,It=!0}}else ft[0]!==e.BACK&&(ft[0]=e.BACK,It=!0);It&&e.drawBuffers(ft)}function gt(Z){return _!==Z?(e.useProgram(Z),_=Z,!0):!1}const Kt={[ba]:e.FUNC_ADD,[h1]:e.FUNC_SUBTRACT,[p1]:e.FUNC_REVERSE_SUBTRACT};Kt[m1]=e.MIN,Kt[x1]=e.MAX;const ct={[g1]:e.ZERO,[_1]:e.ONE,[v1]:e.SRC_COLOR,[xm]:e.SRC_ALPHA,[E1]:e.SRC_ALPHA_SATURATE,[S1]:e.DST_COLOR,[y1]:e.DST_ALPHA,[M1]:e.ONE_MINUS_SRC_COLOR,[gm]:e.ONE_MINUS_SRC_ALPHA,[w1]:e.ONE_MINUS_DST_COLOR,[b1]:e.ONE_MINUS_DST_ALPHA,[T1]:e.CONSTANT_COLOR,[A1]:e.ONE_MINUS_CONSTANT_COLOR,[z1]:e.CONSTANT_ALPHA,[R1]:e.ONE_MINUS_CONSTANT_ALPHA};function ut(Z,Lt,ft,It,Ot,mt,Yt,$t,Me,de){if(Z===Ni){x===!0&&(at(e.BLEND),x=!1);return}if(x===!1&&(W(e.BLEND),x=!0),Z!==u1){if(Z!==p||de!==A){if((v!==ba||b!==ba)&&(e.blendEquation(e.FUNC_ADD),v=ba,b=ba),de)switch(Z){case Oo:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case N0:e.blendFunc(e.ONE,e.ONE);break;case U0:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case O0:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:ce("WebGLState: Invalid blending: ",Z);break}else switch(Z){case Oo:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case N0:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case U0:ce("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case O0:ce("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:ce("WebGLState: Invalid blending: ",Z);break}y=null,g=null,S=null,T=null,M.set(0,0,0),E=0,p=Z,A=de}return}Ot=Ot||Lt,mt=mt||ft,Yt=Yt||It,(Lt!==v||Ot!==b)&&(e.blendEquationSeparate(Kt[Lt],Kt[Ot]),v=Lt,b=Ot),(ft!==y||It!==g||mt!==S||Yt!==T)&&(e.blendFuncSeparate(ct[ft],ct[It],ct[mt],ct[Yt]),y=ft,g=It,S=mt,T=Yt),($t.equals(M)===!1||Me!==E)&&(e.blendColor($t.r,$t.g,$t.b,Me),M.copy($t),E=Me),p=Z,A=!1}function vt(Z,Lt){Z.side===Ai?at(e.CULL_FACE):W(e.CULL_FACE);let ft=Z.side===fn;Lt&&(ft=!ft),_t(ft),Z.blending===Oo&&Z.transparent===!1?ut(Ni):ut(Z.blending,Z.blendEquation,Z.blendSrc,Z.blendDst,Z.blendEquationAlpha,Z.blendSrcAlpha,Z.blendDstAlpha,Z.blendColor,Z.blendAlpha,Z.premultipliedAlpha),o.setFunc(Z.depthFunc),o.setTest(Z.depthTest),o.setMask(Z.depthWrite),a.setMask(Z.colorWrite);const It=Z.stencilWrite;r.setTest(It),It&&(r.setMask(Z.stencilWriteMask),r.setFunc(Z.stencilFunc,Z.stencilRef,Z.stencilFuncMask),r.setOp(Z.stencilFail,Z.stencilZFail,Z.stencilZPass)),Pt(Z.polygonOffset,Z.polygonOffsetFactor,Z.polygonOffsetUnits),Z.alphaToCoverage===!0?W(e.SAMPLE_ALPHA_TO_COVERAGE):at(e.SAMPLE_ALPHA_TO_COVERAGE)}function _t(Z){R!==Z&&(Z?e.frontFace(e.CW):e.frontFace(e.CCW),R=Z)}function Q(Z){Z!==l1?(W(e.CULL_FACE),Z!==D&&(Z===D0?e.cullFace(e.BACK):Z===d1?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))):at(e.CULL_FACE),D=Z}function St(Z){Z!==O&&(U&&e.lineWidth(Z),O=Z)}function Pt(Z,Lt,ft){Z?(W(e.POLYGON_OFFSET_FILL),(P!==Lt||F!==ft)&&(P=Lt,F=ft,o.getReversed()&&(Lt=-Lt),e.polygonOffset(Lt,ft))):at(e.POLYGON_OFFSET_FILL)}function yt(Z){Z?W(e.SCISSOR_TEST):at(e.SCISSOR_TEST)}function j(Z){Z===void 0&&(Z=e.TEXTURE0+V-1),G!==Z&&(e.activeTexture(Z),G=Z)}function L(Z,Lt,ft){ft===void 0&&(G===null?ft=e.TEXTURE0+V-1:ft=G);let It=$[ft];It===void 0&&(It={type:void 0,texture:void 0},$[ft]=It),(It.type!==Z||It.texture!==Lt)&&(G!==ft&&(e.activeTexture(ft),G=ft),e.bindTexture(Z,Lt||k[Z]),It.type=Z,It.texture=Lt)}function xt(){const Z=$[G];Z!==void 0&&Z.type!==void 0&&(e.bindTexture(Z.type,null),Z.type=void 0,Z.texture=void 0)}function bt(){try{e.compressedTexImage2D(...arguments)}catch(Z){ce("WebGLState:",Z)}}function C(){try{e.compressedTexImage3D(...arguments)}catch(Z){ce("WebGLState:",Z)}}function w(){try{e.texSubImage2D(...arguments)}catch(Z){ce("WebGLState:",Z)}}function X(){try{e.texSubImage3D(...arguments)}catch(Z){ce("WebGLState:",Z)}}function K(){try{e.compressedTexSubImage2D(...arguments)}catch(Z){ce("WebGLState:",Z)}}function ot(){try{e.compressedTexSubImage3D(...arguments)}catch(Z){ce("WebGLState:",Z)}}function wt(){try{e.texStorage2D(...arguments)}catch(Z){ce("WebGLState:",Z)}}function Mt(){try{e.texStorage3D(...arguments)}catch(Z){ce("WebGLState:",Z)}}function rt(){try{e.texImage2D(...arguments)}catch(Z){ce("WebGLState:",Z)}}function st(){try{e.texImage3D(...arguments)}catch(Z){ce("WebGLState:",Z)}}function At(Z){return f[Z]!==void 0?f[Z]:e.getParameter(Z)}function Ht(Z,Lt){f[Z]!==Lt&&(e.pixelStorei(Z,Lt),f[Z]=Lt)}function Et(Z){Tt.equals(Z)===!1&&(e.scissor(Z.x,Z.y,Z.z,Z.w),Tt.copy(Z))}function Rt(Z){H.equals(Z)===!1&&(e.viewport(Z.x,Z.y,Z.z,Z.w),H.copy(Z))}function Vt(Z,Lt){let ft=l.get(Lt);ft===void 0&&(ft=new WeakMap,l.set(Lt,ft));let It=ft.get(Z);It===void 0&&(It=e.getUniformBlockIndex(Lt,Z.name),ft.set(Z,It))}function Zt(Z,Lt){const It=l.get(Lt).get(Z);c.get(Lt)!==It&&(e.uniformBlockBinding(Lt,It,Z.__bindingPointIndex),c.set(Lt,It))}function jt(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),d={},f={},G=null,$={},u={},h=new WeakMap,m=[],_=null,x=!1,p=null,v=null,y=null,g=null,b=null,S=null,T=null,M=new ee(0,0,0),E=0,A=!1,R=null,D=null,O=null,P=null,F=null,Tt.set(0,0,e.canvas.width,e.canvas.height),H.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),r.reset()}return{buffers:{color:a,depth:o,stencil:r},enable:W,disable:at,bindFramebuffer:ht,drawBuffers:dt,useProgram:gt,setBlending:ut,setMaterial:vt,setFlipSided:_t,setCullFace:Q,setLineWidth:St,setPolygonOffset:Pt,setScissorTest:yt,activeTexture:j,bindTexture:L,unbindTexture:xt,compressedTexImage2D:bt,compressedTexImage3D:C,texImage2D:rt,texImage3D:st,pixelStorei:Ht,getParameter:At,updateUBOMapping:Vt,uniformBlockBinding:Zt,texStorage2D:wt,texStorage3D:Mt,texSubImage2D:w,texSubImage3D:X,compressedTexSubImage2D:K,compressedTexSubImage3D:ot,scissor:Et,viewport:Rt,reset:jt}}function Kb(e,t,n,i,s,a,o){const r=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new Ct,d=new WeakMap,f=new Set;let u;const h=new WeakMap;let m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function _(C,w){return m?new OffscreenCanvas(C,w):Zc("canvas")}function x(C,w,X){let K=1;const ot=bt(C);if((ot.width>X||ot.height>X)&&(K=X/Math.max(ot.width,ot.height)),K<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){const wt=Math.floor(K*ot.width),Mt=Math.floor(K*ot.height);u===void 0&&(u=_(wt,Mt));const rt=w?_(wt,Mt):u;return rt.width=wt,rt.height=Mt,rt.getContext("2d").drawImage(C,0,0,wt,Mt),Jt("WebGLRenderer: Texture has been resized from ("+ot.width+"x"+ot.height+") to ("+wt+"x"+Mt+")."),rt}else return"data"in C&&Jt("WebGLRenderer: Image in DataTexture is too big ("+ot.width+"x"+ot.height+")."),C;return C}function p(C){return C.generateMipmaps}function v(C){e.generateMipmap(C)}function y(C){return C.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?e.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function g(C,w,X,K,ot,wt=!1){if(C!==null){if(e[C]!==void 0)return e[C];Jt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let Mt;K&&(Mt=t.get("EXT_texture_norm16"),Mt||Jt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let rt=w;if(w===e.RED&&(X===e.FLOAT&&(rt=e.R32F),X===e.HALF_FLOAT&&(rt=e.R16F),X===e.UNSIGNED_BYTE&&(rt=e.R8),X===e.UNSIGNED_SHORT&&Mt&&(rt=Mt.R16_EXT),X===e.SHORT&&Mt&&(rt=Mt.R16_SNORM_EXT)),w===e.RED_INTEGER&&(X===e.UNSIGNED_BYTE&&(rt=e.R8UI),X===e.UNSIGNED_SHORT&&(rt=e.R16UI),X===e.UNSIGNED_INT&&(rt=e.R32UI),X===e.BYTE&&(rt=e.R8I),X===e.SHORT&&(rt=e.R16I),X===e.INT&&(rt=e.R32I)),w===e.RG&&(X===e.FLOAT&&(rt=e.RG32F),X===e.HALF_FLOAT&&(rt=e.RG16F),X===e.UNSIGNED_BYTE&&(rt=e.RG8),X===e.UNSIGNED_SHORT&&Mt&&(rt=Mt.RG16_EXT),X===e.SHORT&&Mt&&(rt=Mt.RG16_SNORM_EXT)),w===e.RG_INTEGER&&(X===e.UNSIGNED_BYTE&&(rt=e.RG8UI),X===e.UNSIGNED_SHORT&&(rt=e.RG16UI),X===e.UNSIGNED_INT&&(rt=e.RG32UI),X===e.BYTE&&(rt=e.RG8I),X===e.SHORT&&(rt=e.RG16I),X===e.INT&&(rt=e.RG32I)),w===e.RGB_INTEGER&&(X===e.UNSIGNED_BYTE&&(rt=e.RGB8UI),X===e.UNSIGNED_SHORT&&(rt=e.RGB16UI),X===e.UNSIGNED_INT&&(rt=e.RGB32UI),X===e.BYTE&&(rt=e.RGB8I),X===e.SHORT&&(rt=e.RGB16I),X===e.INT&&(rt=e.RGB32I)),w===e.RGBA_INTEGER&&(X===e.UNSIGNED_BYTE&&(rt=e.RGBA8UI),X===e.UNSIGNED_SHORT&&(rt=e.RGBA16UI),X===e.UNSIGNED_INT&&(rt=e.RGBA32UI),X===e.BYTE&&(rt=e.RGBA8I),X===e.SHORT&&(rt=e.RGBA16I),X===e.INT&&(rt=e.RGBA32I)),w===e.RGB&&(X===e.UNSIGNED_SHORT&&Mt&&(rt=Mt.RGB16_EXT),X===e.SHORT&&Mt&&(rt=Mt.RGB16_SNORM_EXT),X===e.UNSIGNED_INT_5_9_9_9_REV&&(rt=e.RGB9_E5),X===e.UNSIGNED_INT_10F_11F_11F_REV&&(rt=e.R11F_G11F_B10F)),w===e.RGBA){const st=wt?Yc:oe.getTransfer(ot);X===e.FLOAT&&(rt=e.RGBA32F),X===e.HALF_FLOAT&&(rt=e.RGBA16F),X===e.UNSIGNED_BYTE&&(rt=st===pe?e.SRGB8_ALPHA8:e.RGBA8),X===e.UNSIGNED_SHORT&&Mt&&(rt=Mt.RGBA16_EXT),X===e.SHORT&&Mt&&(rt=Mt.RGBA16_SNORM_EXT),X===e.UNSIGNED_SHORT_4_4_4_4&&(rt=e.RGBA4),X===e.UNSIGNED_SHORT_5_5_5_1&&(rt=e.RGB5_A1)}return(rt===e.R16F||rt===e.R32F||rt===e.RG16F||rt===e.RG32F||rt===e.RGBA16F||rt===e.RGBA32F)&&t.get("EXT_color_buffer_float"),rt}function b(C,w){let X;return C?w===null||w===fi||w===nr?X=e.DEPTH24_STENCIL8:w===oi?X=e.DEPTH32F_STENCIL8:w===er&&(X=e.DEPTH24_STENCIL8,Jt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):w===null||w===fi||w===nr?X=e.DEPTH_COMPONENT24:w===oi?X=e.DEPTH_COMPONENT32F:w===er&&(X=e.DEPTH_COMPONENT16),X}function S(C,w){return p(C)===!0||C.isFramebufferTexture&&C.minFilter!==Ve&&C.minFilter!==We?Math.log2(Math.max(w.width,w.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?w.mipmaps.length:1}function T(C){const w=C.target;w.removeEventListener("dispose",T),E(w),w.isVideoTexture&&d.delete(w),w.isHTMLTexture&&f.delete(w)}function M(C){const w=C.target;w.removeEventListener("dispose",M),R(w)}function E(C){const w=i.get(C);if(w.__webglInit===void 0)return;const X=C.source,K=h.get(X);if(K){const ot=K[w.__cacheKey];ot.usedTimes--,ot.usedTimes===0&&A(C),Object.keys(K).length===0&&h.delete(X)}i.remove(C)}function A(C){const w=i.get(C);e.deleteTexture(w.__webglTexture);const X=C.source,K=h.get(X);delete K[w.__cacheKey],o.memory.textures--}function R(C){const w=i.get(C);if(C.depthTexture&&(C.depthTexture.dispose(),i.remove(C.depthTexture)),C.isWebGLCubeRenderTarget)for(let K=0;K<6;K++){if(Array.isArray(w.__webglFramebuffer[K]))for(let ot=0;ot<w.__webglFramebuffer[K].length;ot++)e.deleteFramebuffer(w.__webglFramebuffer[K][ot]);else e.deleteFramebuffer(w.__webglFramebuffer[K]);w.__webglDepthbuffer&&e.deleteRenderbuffer(w.__webglDepthbuffer[K])}else{if(Array.isArray(w.__webglFramebuffer))for(let K=0;K<w.__webglFramebuffer.length;K++)e.deleteFramebuffer(w.__webglFramebuffer[K]);else e.deleteFramebuffer(w.__webglFramebuffer);if(w.__webglDepthbuffer&&e.deleteRenderbuffer(w.__webglDepthbuffer),w.__webglMultisampledFramebuffer&&e.deleteFramebuffer(w.__webglMultisampledFramebuffer),w.__webglColorRenderbuffer)for(let K=0;K<w.__webglColorRenderbuffer.length;K++)w.__webglColorRenderbuffer[K]&&e.deleteRenderbuffer(w.__webglColorRenderbuffer[K]);w.__webglDepthRenderbuffer&&e.deleteRenderbuffer(w.__webglDepthRenderbuffer)}const X=C.textures;for(let K=0,ot=X.length;K<ot;K++){const wt=i.get(X[K]);wt.__webglTexture&&(e.deleteTexture(wt.__webglTexture),o.memory.textures--),i.remove(X[K])}i.remove(C)}let D=0;function O(){D=0}function P(){return D}function F(C){D=C}function V(){const C=D;return C>=s.maxTextures&&Jt("WebGLTextures: Trying to use "+(C+1)+" texture units while this GPU supports only "+s.maxTextures),D+=1,C}function U(C){const w=[];return w.push(C.wrapS),w.push(C.wrapT),w.push(C.wrapR||0),w.push(C.magFilter),w.push(C.minFilter),w.push(C.anisotropy),w.push(C.internalFormat),w.push(C.format),w.push(C.type),w.push(C.generateMipmaps),w.push(C.premultiplyAlpha),w.push(C.flipY),w.push(C.unpackAlignment),w.push(C.colorSpace),w.join()}function B(C,w){const X=i.get(C);if(C.isVideoTexture&&L(C),C.isRenderTargetTexture===!1&&C.isExternalTexture!==!0&&C.version>0&&X.__version!==C.version){const K=C.image;if(K===null)Jt("WebGLRenderer: Texture marked for update but no image data found.");else if(K.complete===!1)Jt("WebGLRenderer: Texture marked for update but image is incomplete");else{at(X,C,w);return}}else C.isExternalTexture&&(X.__webglTexture=C.sourceTexture?C.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,X.__webglTexture,e.TEXTURE0+w)}function I(C,w){const X=i.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&X.__version!==C.version){at(X,C,w);return}else C.isExternalTexture&&(X.__webglTexture=C.sourceTexture?C.sourceTexture:null);n.bindTexture(e.TEXTURE_2D_ARRAY,X.__webglTexture,e.TEXTURE0+w)}function G(C,w){const X=i.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&X.__version!==C.version){at(X,C,w);return}n.bindTexture(e.TEXTURE_3D,X.__webglTexture,e.TEXTURE0+w)}function $(C,w){const X=i.get(C);if(C.isCubeDepthTexture!==!0&&C.version>0&&X.__version!==C.version){ht(X,C,w);return}n.bindTexture(e.TEXTURE_CUBE_MAP,X.__webglTexture,e.TEXTURE0+w)}const J={[tr]:e.REPEAT,[zi]:e.CLAMP_TO_EDGE,[cf]:e.MIRRORED_REPEAT},it={[Ve]:e.NEAREST,[L1]:e.NEAREST_MIPMAP_NEAREST,[Or]:e.NEAREST_MIPMAP_LINEAR,[We]:e.LINEAR,[ql]:e.LINEAR_MIPMAP_NEAREST,[bs]:e.LINEAR_MIPMAP_LINEAR},Tt={[U1]:e.NEVER,[H1]:e.ALWAYS,[O1]:e.LESS,[Lu]:e.LEQUAL,[F1]:e.EQUAL,[Iu]:e.GEQUAL,[B1]:e.GREATER,[G1]:e.NOTEQUAL};function H(C,w){if(w.type===oi&&t.has("OES_texture_float_linear")===!1&&(w.magFilter===We||w.magFilter===ql||w.magFilter===Or||w.magFilter===bs||w.minFilter===We||w.minFilter===ql||w.minFilter===Or||w.minFilter===bs)&&Jt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),e.texParameteri(C,e.TEXTURE_WRAP_S,J[w.wrapS]),e.texParameteri(C,e.TEXTURE_WRAP_T,J[w.wrapT]),(C===e.TEXTURE_3D||C===e.TEXTURE_2D_ARRAY)&&e.texParameteri(C,e.TEXTURE_WRAP_R,J[w.wrapR]),e.texParameteri(C,e.TEXTURE_MAG_FILTER,it[w.magFilter]),e.texParameteri(C,e.TEXTURE_MIN_FILTER,it[w.minFilter]),w.compareFunction&&(e.texParameteri(C,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(C,e.TEXTURE_COMPARE_FUNC,Tt[w.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(w.magFilter===Ve||w.minFilter!==Or&&w.minFilter!==bs||w.type===oi&&t.has("OES_texture_float_linear")===!1)return;if(w.anisotropy>1||i.get(w).__currentAnisotropy){const X=t.get("EXT_texture_filter_anisotropic");e.texParameterf(C,X.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(w.anisotropy,s.getMaxAnisotropy())),i.get(w).__currentAnisotropy=w.anisotropy}}}function tt(C,w){let X=!1;C.__webglInit===void 0&&(C.__webglInit=!0,w.addEventListener("dispose",T));const K=w.source;let ot=h.get(K);ot===void 0&&(ot={},h.set(K,ot));const wt=U(w);if(wt!==C.__cacheKey){ot[wt]===void 0&&(ot[wt]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,X=!0),ot[wt].usedTimes++;const Mt=ot[C.__cacheKey];Mt!==void 0&&(ot[C.__cacheKey].usedTimes--,Mt.usedTimes===0&&A(w)),C.__cacheKey=wt,C.__webglTexture=ot[wt].texture}return X}function k(C,w,X){return Math.floor(Math.floor(C/X)/w)}function W(C,w,X,K){const wt=C.updateRanges;if(wt.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,w.width,w.height,X,K,w.data);else{wt.sort((Ht,Et)=>Ht.start-Et.start);let Mt=0;for(let Ht=1;Ht<wt.length;Ht++){const Et=wt[Mt],Rt=wt[Ht],Vt=Et.start+Et.count,Zt=k(Rt.start,w.width,4),jt=k(Et.start,w.width,4);Rt.start<=Vt+1&&Zt===jt&&k(Rt.start+Rt.count-1,w.width,4)===Zt?Et.count=Math.max(Et.count,Rt.start+Rt.count-Et.start):(++Mt,wt[Mt]=Rt)}wt.length=Mt+1;const rt=n.getParameter(e.UNPACK_ROW_LENGTH),st=n.getParameter(e.UNPACK_SKIP_PIXELS),At=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,w.width);for(let Ht=0,Et=wt.length;Ht<Et;Ht++){const Rt=wt[Ht],Vt=Math.floor(Rt.start/4),Zt=Math.ceil(Rt.count/4),jt=Vt%w.width,Z=Math.floor(Vt/w.width),Lt=Zt,ft=1;n.pixelStorei(e.UNPACK_SKIP_PIXELS,jt),n.pixelStorei(e.UNPACK_SKIP_ROWS,Z),n.texSubImage2D(e.TEXTURE_2D,0,jt,Z,Lt,ft,X,K,w.data)}C.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,rt),n.pixelStorei(e.UNPACK_SKIP_PIXELS,st),n.pixelStorei(e.UNPACK_SKIP_ROWS,At)}}function at(C,w,X){let K=e.TEXTURE_2D;(w.isDataArrayTexture||w.isCompressedArrayTexture)&&(K=e.TEXTURE_2D_ARRAY),w.isData3DTexture&&(K=e.TEXTURE_3D);const ot=tt(C,w),wt=w.source;n.bindTexture(K,C.__webglTexture,e.TEXTURE0+X);const Mt=i.get(wt);if(wt.version!==Mt.__version||ot===!0){if(n.activeTexture(e.TEXTURE0+X),(typeof ImageBitmap<"u"&&w.image instanceof ImageBitmap)===!1){const ft=oe.getPrimaries(oe.workingColorSpace),It=w.colorSpace===is?null:oe.getPrimaries(w.colorSpace),Ot=w.colorSpace===is||ft===It?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,w.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,w.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ot)}n.pixelStorei(e.UNPACK_ALIGNMENT,w.unpackAlignment);let st=x(w.image,!1,s.maxTextureSize);st=xt(w,st);const At=a.convert(w.format,w.colorSpace),Ht=a.convert(w.type);let Et=g(w.internalFormat,At,Ht,w.normalized,w.colorSpace,w.isVideoTexture);H(K,w);let Rt;const Vt=w.mipmaps,Zt=w.isVideoTexture!==!0,jt=Mt.__version===void 0||ot===!0,Z=wt.dataReady,Lt=S(w,st);if(w.isDepthTexture)Et=b(w.format===Ss,w.type),jt&&(Zt?n.texStorage2D(e.TEXTURE_2D,1,Et,st.width,st.height):n.texImage2D(e.TEXTURE_2D,0,Et,st.width,st.height,0,At,Ht,null));else if(w.isDataTexture)if(Vt.length>0){Zt&&jt&&n.texStorage2D(e.TEXTURE_2D,Lt,Et,Vt[0].width,Vt[0].height);for(let ft=0,It=Vt.length;ft<It;ft++)Rt=Vt[ft],Zt?Z&&n.texSubImage2D(e.TEXTURE_2D,ft,0,0,Rt.width,Rt.height,At,Ht,Rt.data):n.texImage2D(e.TEXTURE_2D,ft,Et,Rt.width,Rt.height,0,At,Ht,Rt.data);w.generateMipmaps=!1}else Zt?(jt&&n.texStorage2D(e.TEXTURE_2D,Lt,Et,st.width,st.height),Z&&W(w,st,At,Ht)):n.texImage2D(e.TEXTURE_2D,0,Et,st.width,st.height,0,At,Ht,st.data);else if(w.isCompressedTexture)if(w.isCompressedArrayTexture){Zt&&jt&&n.texStorage3D(e.TEXTURE_2D_ARRAY,Lt,Et,Vt[0].width,Vt[0].height,st.depth);for(let ft=0,It=Vt.length;ft<It;ft++)if(Rt=Vt[ft],w.format!==Zn)if(At!==null)if(Zt){if(Z)if(w.layerUpdates.size>0){const Ot=uh(Rt.width,Rt.height,w.format,w.type);for(const mt of w.layerUpdates){const Yt=Rt.data.subarray(mt*Ot/Rt.data.BYTES_PER_ELEMENT,(mt+1)*Ot/Rt.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,ft,0,0,mt,Rt.width,Rt.height,1,At,Yt)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,ft,0,0,0,Rt.width,Rt.height,st.depth,At,Rt.data)}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,ft,Et,Rt.width,Rt.height,st.depth,0,Rt.data,0,0);else Jt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Zt?Z&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,ft,0,0,0,Rt.width,Rt.height,st.depth,At,Ht,Rt.data):n.texImage3D(e.TEXTURE_2D_ARRAY,ft,Et,Rt.width,Rt.height,st.depth,0,At,Ht,Rt.data);w.layerUpdates.size>0&&w.clearLayerUpdates()}else{Zt&&jt&&n.texStorage2D(e.TEXTURE_2D,Lt,Et,Vt[0].width,Vt[0].height);for(let ft=0,It=Vt.length;ft<It;ft++)Rt=Vt[ft],w.format!==Zn?At!==null?Zt?Z&&n.compressedTexSubImage2D(e.TEXTURE_2D,ft,0,0,Rt.width,Rt.height,At,Rt.data):n.compressedTexImage2D(e.TEXTURE_2D,ft,Et,Rt.width,Rt.height,0,Rt.data):Jt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Zt?Z&&n.texSubImage2D(e.TEXTURE_2D,ft,0,0,Rt.width,Rt.height,At,Ht,Rt.data):n.texImage2D(e.TEXTURE_2D,ft,Et,Rt.width,Rt.height,0,At,Ht,Rt.data)}else if(w.isDataArrayTexture)if(Zt){if(jt&&n.texStorage3D(e.TEXTURE_2D_ARRAY,Lt,Et,st.width,st.height,st.depth),Z)if(w.layerUpdates.size>0){const ft=uh(st.width,st.height,w.format,w.type);for(const It of w.layerUpdates){const Ot=st.data.subarray(It*ft/st.data.BYTES_PER_ELEMENT,(It+1)*ft/st.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,It,st.width,st.height,1,At,Ht,Ot)}w.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,st.width,st.height,st.depth,At,Ht,st.data)}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,Et,st.width,st.height,st.depth,0,At,Ht,st.data);else if(w.isData3DTexture)Zt?(jt&&n.texStorage3D(e.TEXTURE_3D,Lt,Et,st.width,st.height,st.depth),Z&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,st.width,st.height,st.depth,At,Ht,st.data)):n.texImage3D(e.TEXTURE_3D,0,Et,st.width,st.height,st.depth,0,At,Ht,st.data);else if(w.isFramebufferTexture){if(jt)if(Zt)n.texStorage2D(e.TEXTURE_2D,Lt,Et,st.width,st.height);else{let ft=st.width,It=st.height;for(let Ot=0;Ot<Lt;Ot++)n.texImage2D(e.TEXTURE_2D,Ot,Et,ft,It,0,At,Ht,null),ft>>=1,It>>=1}}else if(w.isHTMLTexture){if("texElementImage2D"in e){const ft=e.canvas;if(ft.hasAttribute("layoutsubtree")||ft.setAttribute("layoutsubtree","true"),st.parentNode!==ft){ft.appendChild(st),f.add(w),ft.onpaint=It=>{const Ot=It.changedElements;for(const mt of f)Ot.includes(mt.image)&&(mt.needsUpdate=!0)},ft.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,st);else{const Ot=e.RGBA,mt=e.RGBA,Yt=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,Ot,mt,Yt,st)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(Vt.length>0){if(Zt&&jt){const ft=bt(Vt[0]);n.texStorage2D(e.TEXTURE_2D,Lt,Et,ft.width,ft.height)}for(let ft=0,It=Vt.length;ft<It;ft++)Rt=Vt[ft],Zt?Z&&n.texSubImage2D(e.TEXTURE_2D,ft,0,0,At,Ht,Rt):n.texImage2D(e.TEXTURE_2D,ft,Et,At,Ht,Rt);w.generateMipmaps=!1}else if(Zt){if(jt){const ft=bt(st);n.texStorage2D(e.TEXTURE_2D,Lt,Et,ft.width,ft.height)}Z&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,At,Ht,st)}else n.texImage2D(e.TEXTURE_2D,0,Et,At,Ht,st);p(w)&&v(K),Mt.__version=wt.version,w.onUpdate&&w.onUpdate(w)}C.__version=w.version}function ht(C,w,X){if(w.image.length!==6)return;const K=tt(C,w),ot=w.source;n.bindTexture(e.TEXTURE_CUBE_MAP,C.__webglTexture,e.TEXTURE0+X);const wt=i.get(ot);if(ot.version!==wt.__version||K===!0){n.activeTexture(e.TEXTURE0+X);const Mt=oe.getPrimaries(oe.workingColorSpace),rt=w.colorSpace===is?null:oe.getPrimaries(w.colorSpace),st=w.colorSpace===is||Mt===rt?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,w.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,w.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,w.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,st);const At=w.isCompressedTexture||w.image[0].isCompressedTexture,Ht=w.image[0]&&w.image[0].isDataTexture,Et=[];for(let mt=0;mt<6;mt++)!At&&!Ht?Et[mt]=x(w.image[mt],!0,s.maxCubemapSize):Et[mt]=Ht?w.image[mt].image:w.image[mt],Et[mt]=xt(w,Et[mt]);const Rt=Et[0],Vt=a.convert(w.format,w.colorSpace),Zt=a.convert(w.type),jt=g(w.internalFormat,Vt,Zt,w.normalized,w.colorSpace),Z=w.isVideoTexture!==!0,Lt=wt.__version===void 0||K===!0,ft=ot.dataReady;let It=S(w,Rt);H(e.TEXTURE_CUBE_MAP,w);let Ot;if(At){Z&&Lt&&n.texStorage2D(e.TEXTURE_CUBE_MAP,It,jt,Rt.width,Rt.height);for(let mt=0;mt<6;mt++){Ot=Et[mt].mipmaps;for(let Yt=0;Yt<Ot.length;Yt++){const $t=Ot[Yt];w.format!==Zn?Vt!==null?Z?ft&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,Yt,0,0,$t.width,$t.height,Vt,$t.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,Yt,jt,$t.width,$t.height,0,$t.data):Jt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Z?ft&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,Yt,0,0,$t.width,$t.height,Vt,Zt,$t.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,Yt,jt,$t.width,$t.height,0,Vt,Zt,$t.data)}}}else{if(Ot=w.mipmaps,Z&&Lt){Ot.length>0&&It++;const mt=bt(Et[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,It,jt,mt.width,mt.height)}for(let mt=0;mt<6;mt++)if(Ht){Z?ft&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,0,0,0,Et[mt].width,Et[mt].height,Vt,Zt,Et[mt].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,0,jt,Et[mt].width,Et[mt].height,0,Vt,Zt,Et[mt].data);for(let Yt=0;Yt<Ot.length;Yt++){const Me=Ot[Yt].image[mt].image;Z?ft&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,Yt+1,0,0,Me.width,Me.height,Vt,Zt,Me.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,Yt+1,jt,Me.width,Me.height,0,Vt,Zt,Me.data)}}else{Z?ft&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,0,0,0,Vt,Zt,Et[mt]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,0,jt,Vt,Zt,Et[mt]);for(let Yt=0;Yt<Ot.length;Yt++){const $t=Ot[Yt];Z?ft&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,Yt+1,0,0,Vt,Zt,$t.image[mt]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+mt,Yt+1,jt,Vt,Zt,$t.image[mt])}}}p(w)&&v(e.TEXTURE_CUBE_MAP),wt.__version=ot.version,w.onUpdate&&w.onUpdate(w)}C.__version=w.version}function dt(C,w,X,K,ot,wt){const Mt=a.convert(X.format,X.colorSpace),rt=a.convert(X.type),st=g(X.internalFormat,Mt,rt,X.normalized,X.colorSpace),At=i.get(w),Ht=i.get(X);if(Ht.__renderTarget=w,!At.__hasExternalTextures){const Et=Math.max(1,w.width>>wt),Rt=Math.max(1,w.height>>wt);ot===e.TEXTURE_3D||ot===e.TEXTURE_2D_ARRAY?n.texImage3D(ot,wt,st,Et,Rt,w.depth,0,Mt,rt,null):n.texImage2D(ot,wt,st,Et,Rt,0,Mt,rt,null)}n.bindFramebuffer(e.FRAMEBUFFER,C),j(w)?r.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,K,ot,Ht.__webglTexture,0,yt(w)):(ot===e.TEXTURE_2D||ot>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&ot<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,K,ot,Ht.__webglTexture,wt),n.bindFramebuffer(e.FRAMEBUFFER,null)}function gt(C,w,X){if(e.bindRenderbuffer(e.RENDERBUFFER,C),w.depthBuffer){const K=w.depthTexture,ot=K&&K.isDepthTexture?K.type:null,wt=b(w.stencilBuffer,ot),Mt=w.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;j(w)?r.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,yt(w),wt,w.width,w.height):X?e.renderbufferStorageMultisample(e.RENDERBUFFER,yt(w),wt,w.width,w.height):e.renderbufferStorage(e.RENDERBUFFER,wt,w.width,w.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,Mt,e.RENDERBUFFER,C)}else{const K=w.textures;for(let ot=0;ot<K.length;ot++){const wt=K[ot],Mt=a.convert(wt.format,wt.colorSpace),rt=a.convert(wt.type),st=g(wt.internalFormat,Mt,rt,wt.normalized,wt.colorSpace);j(w)?r.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,yt(w),st,w.width,w.height):X?e.renderbufferStorageMultisample(e.RENDERBUFFER,yt(w),st,w.width,w.height):e.renderbufferStorage(e.RENDERBUFFER,st,w.width,w.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Kt(C,w,X){const K=w.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,C),!(w.depthTexture&&w.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const ot=i.get(w.depthTexture);if(ot.__renderTarget=w,(!ot.__webglTexture||w.depthTexture.image.width!==w.width||w.depthTexture.image.height!==w.height)&&(w.depthTexture.image.width=w.width,w.depthTexture.image.height=w.height,w.depthTexture.needsUpdate=!0),K){if(ot.__webglInit===void 0&&(ot.__webglInit=!0,w.depthTexture.addEventListener("dispose",T)),ot.__webglTexture===void 0){ot.__webglTexture=e.createTexture(),n.bindTexture(e.TEXTURE_CUBE_MAP,ot.__webglTexture),H(e.TEXTURE_CUBE_MAP,w.depthTexture);const At=a.convert(w.depthTexture.format),Ht=a.convert(w.depthTexture.type);let Et;w.depthTexture.format===Fi?Et=e.DEPTH_COMPONENT24:w.depthTexture.format===Ss&&(Et=e.DEPTH24_STENCIL8);for(let Rt=0;Rt<6;Rt++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+Rt,0,Et,w.width,w.height,0,At,Ht,null)}}else B(w.depthTexture,0);const wt=ot.__webglTexture,Mt=yt(w),rt=K?e.TEXTURE_CUBE_MAP_POSITIVE_X+X:e.TEXTURE_2D,st=w.depthTexture.format===Ss?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(w.depthTexture.format===Fi)j(w)?r.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,st,rt,wt,0,Mt):e.framebufferTexture2D(e.FRAMEBUFFER,st,rt,wt,0);else if(w.depthTexture.format===Ss)j(w)?r.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,st,rt,wt,0,Mt):e.framebufferTexture2D(e.FRAMEBUFFER,st,rt,wt,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function ct(C){const w=i.get(C),X=C.isWebGLCubeRenderTarget===!0;if(w.__boundDepthTexture!==C.depthTexture){const K=C.depthTexture;if(w.__depthDisposeCallback&&w.__depthDisposeCallback(),K){const ot=()=>{delete w.__boundDepthTexture,delete w.__depthDisposeCallback,K.removeEventListener("dispose",ot)};K.addEventListener("dispose",ot),w.__depthDisposeCallback=ot}w.__boundDepthTexture=K}if(C.depthTexture&&!w.__autoAllocateDepthBuffer)if(X)for(let K=0;K<6;K++)Kt(w.__webglFramebuffer[K],C,K);else{const K=C.texture.mipmaps;K&&K.length>0?Kt(w.__webglFramebuffer[0],C,0):Kt(w.__webglFramebuffer,C,0)}else if(X){w.__webglDepthbuffer=[];for(let K=0;K<6;K++)if(n.bindFramebuffer(e.FRAMEBUFFER,w.__webglFramebuffer[K]),w.__webglDepthbuffer[K]===void 0)w.__webglDepthbuffer[K]=e.createRenderbuffer(),gt(w.__webglDepthbuffer[K],C,!1);else{const ot=C.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,wt=w.__webglDepthbuffer[K];e.bindRenderbuffer(e.RENDERBUFFER,wt),e.framebufferRenderbuffer(e.FRAMEBUFFER,ot,e.RENDERBUFFER,wt)}}else{const K=C.texture.mipmaps;if(K&&K.length>0?n.bindFramebuffer(e.FRAMEBUFFER,w.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,w.__webglFramebuffer),w.__webglDepthbuffer===void 0)w.__webglDepthbuffer=e.createRenderbuffer(),gt(w.__webglDepthbuffer,C,!1);else{const ot=C.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,wt=w.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,wt),e.framebufferRenderbuffer(e.FRAMEBUFFER,ot,e.RENDERBUFFER,wt)}}n.bindFramebuffer(e.FRAMEBUFFER,null)}function ut(C,w,X){const K=i.get(C);w!==void 0&&dt(K.__webglFramebuffer,C,C.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),X!==void 0&&ct(C)}function vt(C){const w=C.texture,X=i.get(C),K=i.get(w);C.addEventListener("dispose",M);const ot=C.textures,wt=C.isWebGLCubeRenderTarget===!0,Mt=ot.length>1;if(Mt||(K.__webglTexture===void 0&&(K.__webglTexture=e.createTexture()),K.__version=w.version,o.memory.textures++),wt){X.__webglFramebuffer=[];for(let rt=0;rt<6;rt++)if(w.mipmaps&&w.mipmaps.length>0){X.__webglFramebuffer[rt]=[];for(let st=0;st<w.mipmaps.length;st++)X.__webglFramebuffer[rt][st]=e.createFramebuffer()}else X.__webglFramebuffer[rt]=e.createFramebuffer()}else{if(w.mipmaps&&w.mipmaps.length>0){X.__webglFramebuffer=[];for(let rt=0;rt<w.mipmaps.length;rt++)X.__webglFramebuffer[rt]=e.createFramebuffer()}else X.__webglFramebuffer=e.createFramebuffer();if(Mt)for(let rt=0,st=ot.length;rt<st;rt++){const At=i.get(ot[rt]);At.__webglTexture===void 0&&(At.__webglTexture=e.createTexture(),o.memory.textures++)}if(C.samples>0&&j(C)===!1){X.__webglMultisampledFramebuffer=e.createFramebuffer(),X.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,X.__webglMultisampledFramebuffer);for(let rt=0;rt<ot.length;rt++){const st=ot[rt];X.__webglColorRenderbuffer[rt]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,X.__webglColorRenderbuffer[rt]);const At=a.convert(st.format,st.colorSpace),Ht=a.convert(st.type),Et=g(st.internalFormat,At,Ht,st.normalized,st.colorSpace,C.isXRRenderTarget===!0),Rt=yt(C);e.renderbufferStorageMultisample(e.RENDERBUFFER,Rt,Et,C.width,C.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+rt,e.RENDERBUFFER,X.__webglColorRenderbuffer[rt])}e.bindRenderbuffer(e.RENDERBUFFER,null),C.depthBuffer&&(X.__webglDepthRenderbuffer=e.createRenderbuffer(),gt(X.__webglDepthRenderbuffer,C,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(wt){n.bindTexture(e.TEXTURE_CUBE_MAP,K.__webglTexture),H(e.TEXTURE_CUBE_MAP,w);for(let rt=0;rt<6;rt++)if(w.mipmaps&&w.mipmaps.length>0)for(let st=0;st<w.mipmaps.length;st++)dt(X.__webglFramebuffer[rt][st],C,w,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+rt,st);else dt(X.__webglFramebuffer[rt],C,w,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+rt,0);p(w)&&v(e.TEXTURE_CUBE_MAP),n.unbindTexture()}else if(Mt){for(let rt=0,st=ot.length;rt<st;rt++){const At=ot[rt],Ht=i.get(At);let Et=e.TEXTURE_2D;(C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(Et=C.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(Et,Ht.__webglTexture),H(Et,At),dt(X.__webglFramebuffer,C,At,e.COLOR_ATTACHMENT0+rt,Et,0),p(At)&&v(Et)}n.unbindTexture()}else{let rt=e.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(rt=C.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(rt,K.__webglTexture),H(rt,w),w.mipmaps&&w.mipmaps.length>0)for(let st=0;st<w.mipmaps.length;st++)dt(X.__webglFramebuffer[st],C,w,e.COLOR_ATTACHMENT0,rt,st);else dt(X.__webglFramebuffer,C,w,e.COLOR_ATTACHMENT0,rt,0);p(w)&&v(rt),n.unbindTexture()}C.depthBuffer&&ct(C)}function _t(C){const w=C.textures;for(let X=0,K=w.length;X<K;X++){const ot=w[X];if(p(ot)){const wt=y(C),Mt=i.get(ot).__webglTexture;n.bindTexture(wt,Mt),v(wt),n.unbindTexture()}}}const Q=[],St=[];function Pt(C){if(C.samples>0){if(j(C)===!1){const w=C.textures,X=C.width,K=C.height;let ot=e.COLOR_BUFFER_BIT;const wt=C.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,Mt=i.get(C),rt=w.length>1;if(rt)for(let At=0;At<w.length;At++)n.bindFramebuffer(e.FRAMEBUFFER,Mt.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+At,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,Mt.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+At,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,Mt.__webglMultisampledFramebuffer);const st=C.texture.mipmaps;st&&st.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,Mt.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,Mt.__webglFramebuffer);for(let At=0;At<w.length;At++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(ot|=e.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(ot|=e.STENCIL_BUFFER_BIT)),rt){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,Mt.__webglColorRenderbuffer[At]);const Ht=i.get(w[At]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,Ht,0)}e.blitFramebuffer(0,0,X,K,0,0,X,K,ot,e.NEAREST),c===!0&&(Q.length=0,St.length=0,Q.push(e.COLOR_ATTACHMENT0+At),C.depthBuffer&&C.storeMultisampledDepthBuffer===!1&&(Q.push(wt),St.push(wt),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,St)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,Q))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),rt)for(let At=0;At<w.length;At++){n.bindFramebuffer(e.FRAMEBUFFER,Mt.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+At,e.RENDERBUFFER,Mt.__webglColorRenderbuffer[At]);const Ht=i.get(w[At]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,Mt.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+At,e.TEXTURE_2D,Ht,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,Mt.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.storeMultisampledDepthBuffer===!1&&c){const w=C.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[w])}}}function yt(C){return Math.min(s.maxSamples,C.samples)}function j(C){const w=i.get(C);return C.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&w.__useRenderToTexture!==!1}function L(C){const w=o.render.frame;d.get(C)!==w&&(d.set(C,w),C.update())}function xt(C,w){const X=C.colorSpace,K=C.format,ot=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||X!==qc&&X!==is&&(oe.getTransfer(X)===pe?(K!==Zn||ot!==Sn)&&Jt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):ce("WebGLTextures: Unsupported texture color space:",X)),w}function bt(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(l.width=C.naturalWidth||C.width,l.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(l.width=C.displayWidth,l.height=C.displayHeight):(l.width=C.width,l.height=C.height),l}this.allocateTextureUnit=V,this.resetTextureUnits=O,this.getTextureUnits=P,this.setTextureUnits=F,this.setTexture2D=B,this.setTexture2DArray=I,this.setTexture3D=G,this.setTextureCube=$,this.rebindTextures=ut,this.setupRenderTarget=vt,this.updateRenderTargetMipmap=_t,this.updateMultisampleRenderTarget=Pt,this.setupDepthRenderbuffer=ct,this.setupFrameBufferTexture=dt,this.useMultisampledRTT=j,this.isReversedDepthBuffer=function(){return n.buffers.depth.getReversed()}}function Jb(e,t){function n(i,s=is){let a;const o=oe.getTransfer(s);if(i===Sn)return e.UNSIGNED_BYTE;if(i===Au)return e.UNSIGNED_SHORT_4_4_4_4;if(i===zu)return e.UNSIGNED_SHORT_5_5_5_1;if(i===zm)return e.UNSIGNED_INT_5_9_9_9_REV;if(i===Rm)return e.UNSIGNED_INT_10F_11F_11F_REV;if(i===Tm)return e.BYTE;if(i===Am)return e.SHORT;if(i===er)return e.UNSIGNED_SHORT;if(i===Tu)return e.INT;if(i===fi)return e.UNSIGNED_INT;if(i===oi)return e.FLOAT;if(i===ui)return e.HALF_FLOAT;if(i===Cm)return e.ALPHA;if(i===Pm)return e.RGB;if(i===Zn)return e.RGBA;if(i===Fi)return e.DEPTH_COMPONENT;if(i===Ss)return e.DEPTH_STENCIL;if(i===Lm)return e.RED;if(i===Ru)return e.RED_INTEGER;if(i===Us)return e.RG;if(i===Cu)return e.RG_INTEGER;if(i===Pu)return e.RGBA_INTEGER;if(i===Cc||i===Pc||i===Lc||i===Ic)if(o===pe)if(a=t.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(i===Cc)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Pc)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Lc)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Ic)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=t.get("WEBGL_compressed_texture_s3tc"),a!==null){if(i===Cc)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Pc)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Lc)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Ic)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===lf||i===df||i===ff||i===uf)if(a=t.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(i===lf)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===df)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===ff)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===uf)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===hf||i===pf||i===mf||i===xf||i===gf||i===kc||i===_f)if(a=t.get("WEBGL_compressed_texture_etc"),a!==null){if(i===hf||i===pf)return o===pe?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(i===mf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC;if(i===xf)return a.COMPRESSED_R11_EAC;if(i===gf)return a.COMPRESSED_SIGNED_R11_EAC;if(i===kc)return a.COMPRESSED_RG11_EAC;if(i===_f)return a.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===vf||i===Mf||i===yf||i===bf||i===Sf||i===wf||i===Ef||i===Tf||i===Af||i===zf||i===Rf||i===Cf||i===Pf||i===Lf)if(a=t.get("WEBGL_compressed_texture_astc"),a!==null){if(i===vf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Mf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===yf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===bf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===Sf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===wf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Ef)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Tf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Af)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===zf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Rf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Cf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Pf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Lf)return o===pe?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===If||i===Df||i===Nf)if(a=t.get("EXT_texture_compression_bptc"),a!==null){if(i===If)return o===pe?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Df)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Nf)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Uf||i===Of||i===Xc||i===Ff)if(a=t.get("EXT_texture_compression_rgtc"),a!==null){if(i===Uf)return a.COMPRESSED_RED_RGTC1_EXT;if(i===Of)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Xc)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Ff)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===nr?e.UNSIGNED_INT_24_8:e[i]!==void 0?e[i]:null}return{convert:n}}const Qb=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,jb=`
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

}`;class tS{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,n){if(this.texture===null){const i=new Hm(t.texture);(t.depthNear!==n.depthNear||t.depthFar!==n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=i}}getMesh(t){if(this.texture!==null&&this.mesh===null){const n=t.cameras[0].viewport,i=new hi({vertexShader:Qb,fragmentShader:jb,uniforms:{depthColor:{value:this.texture},depthWidth:{value:n.z},depthHeight:{value:n.w}}});this.mesh=new Se(new Al(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class eS extends Ys{constructor(t,n){super();const i=this;let s=null,a=1,o=null,r="local-floor",c=1,l=null,d=null,f=null,u=null,h=null,m=null;const _=typeof XRWebGLBinding<"u",x=new tS,p={},v=n.getContextAttributes();let y=null,g=null;const b=[],S=[],T=new Ct;let M=null,E=null;const A=new Dn;A.viewport=new Te;const R=new Dn;R.viewport=new Te;const D=[A,R],O=new lv;let P=null,F=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(k){let W=b[k];return W===void 0&&(W=new nd,b[k]=W),W.getTargetRaySpace()},this.getControllerGrip=function(k){let W=b[k];return W===void 0&&(W=new nd,b[k]=W),W.getGripSpace()},this.getHand=function(k){let W=b[k];return W===void 0&&(W=new nd,b[k]=W),W.getHandSpace()};function V(k){const W=S.indexOf(k.inputSource);if(W===-1)return;const at=b[W];at!==void 0&&(at.update(k.inputSource,k.frame,l||o),at.dispatchEvent({type:k.type,data:k.inputSource}))}function U(){s.removeEventListener("select",V),s.removeEventListener("selectstart",V),s.removeEventListener("selectend",V),s.removeEventListener("squeeze",V),s.removeEventListener("squeezestart",V),s.removeEventListener("squeezeend",V),s.removeEventListener("end",U),s.removeEventListener("inputsourceschange",B);for(let k=0;k<b.length;k++){const W=S[k];W!==null&&(S[k]=null,b[k].disconnect(W))}P=null,F=null,x.reset();for(const k in p)delete p[k];if(t.setRenderTarget(y),h=null,u=null,f=null,s=null,g=null,tt.stop(),i.isPresenting=!1,t.setPixelRatio(M),t.setSize(T.width,T.height,!1),E!==null){const k=E.camera;k.fov=E.fov,k.zoom=E.zoom,k.updateProjectionMatrix(),E=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(k){a=k,i.isPresenting===!0&&Jt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(k){r=k,i.isPresenting===!0&&Jt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(k){l=k},this.getBaseLayer=function(){return u!==null?u:h},this.getBinding=function(){return f===null&&_&&(f=new XRWebGLBinding(s,n)),f},this.getFrame=function(){return m},this.getSession=function(){return s},this.setSession=async function(k){if(s=k,s!==null){if(y=t.getRenderTarget(),s.addEventListener("select",V),s.addEventListener("selectstart",V),s.addEventListener("selectend",V),s.addEventListener("squeeze",V),s.addEventListener("squeezestart",V),s.addEventListener("squeezeend",V),s.addEventListener("end",U),s.addEventListener("inputsourceschange",B),v.xrCompatible!==!0&&await n.makeXRCompatible(),M=t.getPixelRatio(),t.getSize(T),_&&"createProjectionLayer"in XRWebGLBinding.prototype){let at=null,ht=null,dt=null;v.depth&&(dt=v.stencil?n.DEPTH24_STENCIL8:n.DEPTH_COMPONENT24,at=v.stencil?Ss:Fi,ht=v.stencil?nr:fi);const gt={colorFormat:n.RGBA8,depthFormat:dt,scaleFactor:a};f=this.getBinding(),u=f.createProjectionLayer(gt),s.updateRenderState({layers:[u]}),t.setPixelRatio(1),t.setSize(u.textureWidth,u.textureHeight,!1),g=new Kn(u.textureWidth,u.textureHeight,{format:Zn,type:Sn,depthTexture:new sr(u.textureWidth,u.textureHeight,ht,void 0,void 0,void 0,void 0,void 0,void 0,at),stencilBuffer:v.stencil,colorSpace:t.outputColorSpace,samples:v.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}else{const at={antialias:v.antialias,alpha:!0,depth:v.depth,stencil:v.stencil,framebufferScaleFactor:a};h=new XRWebGLLayer(s,n,at),s.updateRenderState({baseLayer:h}),t.setPixelRatio(1),t.setSize(h.framebufferWidth,h.framebufferHeight,!1),g=new Kn(h.framebufferWidth,h.framebufferHeight,{format:Zn,type:Sn,colorSpace:t.outputColorSpace,stencilBuffer:v.stencil,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1,storeMultisampledDepthBuffer:h.ignoreDepthValues===!1,storeMultisampledStencilBuffer:h.ignoreDepthValues===!1})}g.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await s.requestReferenceSpace(r),tt.setContext(s),tt.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function B(k){for(let W=0;W<k.removed.length;W++){const at=k.removed[W],ht=S.indexOf(at);ht>=0&&(S[ht]=null,b[ht].disconnect(at))}for(let W=0;W<k.added.length;W++){const at=k.added[W];let ht=S.indexOf(at);if(ht===-1){for(let gt=0;gt<b.length;gt++)if(gt>=S.length){S.push(at),ht=gt;break}else if(S[gt]===null){S[gt]=at,ht=gt;break}if(ht===-1)break}const dt=b[ht];dt&&dt.connect(at)}}const I=new q,G=new q;function $(k,W,at){I.setFromMatrixPosition(W.matrixWorld),G.setFromMatrixPosition(at.matrixWorld);const ht=I.distanceTo(G),dt=W.projectionMatrix.elements,gt=at.projectionMatrix.elements,Kt=dt[14]/(dt[10]-1),ct=dt[14]/(dt[10]+1),ut=(dt[9]+1)/dt[5],vt=(dt[9]-1)/dt[5],_t=(dt[8]-1)/dt[0],Q=(gt[8]+1)/gt[0],St=Kt*_t,Pt=Kt*Q,yt=ht/(-_t+Q),j=yt*-_t;if(W.matrixWorld.decompose(k.position,k.quaternion,k.scale),k.translateX(j),k.translateZ(yt),k.matrixWorld.compose(k.position,k.quaternion,k.scale),k.matrixWorldInverse.copy(k.matrixWorld).invert(),dt[10]===-1)k.projectionMatrix.copy(W.projectionMatrix),k.projectionMatrixInverse.copy(W.projectionMatrixInverse);else{const L=Kt+yt,xt=ct+yt,bt=St-j,C=Pt+(ht-j),w=ut*ct/xt*L,X=vt*ct/xt*L;k.projectionMatrix.makePerspective(bt,C,w,X,L,xt),k.projectionMatrixInverse.copy(k.projectionMatrix).invert()}}function J(k,W){W===null?k.matrixWorld.copy(k.matrix):k.matrixWorld.multiplyMatrices(W.matrixWorld,k.matrix),k.matrixWorldInverse.copy(k.matrixWorld).invert()}this.updateCamera=function(k){if(s===null)return;let W=k.near,at=k.far;x.texture!==null&&(x.depthNear>0&&(W=x.depthNear),x.depthFar>0&&(at=x.depthFar)),O.near=R.near=A.near=W,O.far=R.far=A.far=at,(P!==O.near||F!==O.far)&&(s.updateRenderState({depthNear:O.near,depthFar:O.far}),P=O.near,F=O.far),O.layers.mask=k.layers.mask|6,A.layers.mask=O.layers.mask&-5,R.layers.mask=O.layers.mask&-3;const ht=k.parent,dt=O.cameras;J(O,ht);for(let gt=0;gt<dt.length;gt++)J(dt[gt],ht);dt.length===2?$(O,A,R):O.projectionMatrix.copy(A.projectionMatrix),E===null&&k.isPerspectiveCamera&&(E={camera:k,fov:k.fov,zoom:k.zoom}),it(k,O,ht)};function it(k,W,at){at===null?k.matrix.copy(W.matrixWorld):(k.matrix.copy(at.matrixWorld),k.matrix.invert(),k.matrix.multiply(W.matrixWorld)),k.matrix.decompose(k.position,k.quaternion,k.scale),k.updateMatrixWorld(!0),k.projectionMatrix.copy(W.projectionMatrix),k.projectionMatrixInverse.copy(W.projectionMatrixInverse),k.isPerspectiveCamera&&(k.fov=Bf*2*Math.atan(1/k.projectionMatrix.elements[5]),k.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(!(u===null&&h===null))return c},this.setFoveation=function(k){c=k,u!==null&&(u.fixedFoveation=k),h!==null&&h.fixedFoveation!==void 0&&(h.fixedFoveation=k)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(O)},this.getCameraTexture=function(k){return p[k]};let Tt=null;function H(k,W){if(d=W.getViewerPose(l||o),m=W,d!==null){const at=d.views;h!==null&&(t.setRenderTargetFramebuffer(g,h.framebuffer),t.setRenderTarget(g));let ht=!1;at.length!==O.cameras.length&&(O.cameras.length=0,ht=!0);for(let ct=0;ct<at.length;ct++){const ut=at[ct];let vt=null;if(h!==null)vt=h.getViewport(ut);else{const Q=f.getViewSubImage(u,ut);vt=Q.viewport,ct===0&&(t.setRenderTargetTextures(g,Q.colorTexture,Q.depthStencilTexture),t.setRenderTarget(g))}let _t=D[ct];_t===void 0&&(_t=new Dn,_t.layers.enable(ct),_t.viewport=new Te,D[ct]=_t),_t.matrix.fromArray(ut.transform.matrix),_t.matrix.decompose(_t.position,_t.quaternion,_t.scale),_t.projectionMatrix.fromArray(ut.projectionMatrix),_t.projectionMatrixInverse.copy(_t.projectionMatrix).invert(),_t.viewport.set(vt.x,vt.y,vt.width,vt.height),ct===0&&(O.matrix.copy(_t.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),ht===!0&&O.cameras.push(_t)}const dt=s.enabledFeatures;if(dt&&dt.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&_){f=i.getBinding();const ct=f.getDepthInformation(at[0]);ct&&ct.isValid&&ct.texture&&x.init(ct,s.renderState)}if(dt&&dt.includes("camera-access")&&_){t.state.unbindTexture(),f=i.getBinding();for(let ct=0;ct<at.length;ct++){const ut=at[ct].camera;if(ut){let vt=p[ut];vt||(vt=new Hm,p[ut]=vt);const _t=f.getCameraImage(ut);vt.sourceTexture=_t}}}}for(let at=0;at<b.length;at++){const ht=S[at],dt=b[at];ht!==null&&dt!==void 0&&dt.update(ht,W,l||o)}Tt&&Tt(k,W),W.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:W}),m=null}const tt=new ix;tt.setAnimationLoop(H),this.setAnimationLoop=function(k){Tt=k},this.dispose=function(){}}}const nS=new we,dx=new te;dx.set(-1,0,0,0,1,0,0,0,1);function iS(e,t){function n(x,p){x.matrixAutoUpdate===!0&&x.updateMatrix(),p.value.copy(x.matrix)}function i(x,p){p.color.getRGB(x.fogColor.value,Qm(e)),p.isFog?(x.fogNear.value=p.near,x.fogFar.value=p.far):p.isFogExp2&&(x.fogDensity.value=p.density)}function s(x,p,v,y,g){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?a(x,p):p.isMeshLambertMaterial?(a(x,p),p.envMap&&(x.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(a(x,p),f(x,p)):p.isMeshPhongMaterial?(a(x,p),d(x,p),p.envMap&&(x.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(a(x,p),u(x,p),p.isMeshPhysicalMaterial&&h(x,p,g)):p.isMeshMatcapMaterial?(a(x,p),m(x,p)):p.isMeshDepthMaterial?a(x,p):p.isMeshDistanceMaterial?(a(x,p),_(x,p)):p.isMeshNormalMaterial?a(x,p):p.isLineBasicMaterial?(o(x,p),p.isLineDashedMaterial&&r(x,p)):p.isPointsMaterial?c(x,p,v,y):p.isSpriteMaterial?l(x,p):p.isShadowMaterial?(x.color.value.copy(p.color),x.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function a(x,p){x.opacity.value=p.opacity,p.color&&x.diffuse.value.copy(p.color),p.emissive&&x.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(x.map.value=p.map,n(p.map,x.mapTransform)),p.alphaMap&&(x.alphaMap.value=p.alphaMap,n(p.alphaMap,x.alphaMapTransform)),p.bumpMap&&(x.bumpMap.value=p.bumpMap,n(p.bumpMap,x.bumpMapTransform),x.bumpScale.value=p.bumpScale,p.side===fn&&(x.bumpScale.value*=-1)),p.normalMap&&(x.normalMap.value=p.normalMap,n(p.normalMap,x.normalMapTransform),x.normalScale.value.copy(p.normalScale),p.side===fn&&x.normalScale.value.negate()),p.displacementMap&&(x.displacementMap.value=p.displacementMap,n(p.displacementMap,x.displacementMapTransform),x.displacementScale.value=p.displacementScale,x.displacementBias.value=p.displacementBias),p.emissiveMap&&(x.emissiveMap.value=p.emissiveMap,n(p.emissiveMap,x.emissiveMapTransform)),p.specularMap&&(x.specularMap.value=p.specularMap,n(p.specularMap,x.specularMapTransform)),p.alphaTest>0&&(x.alphaTest.value=p.alphaTest);const v=t.get(p),y=v.envMap,g=v.envMapRotation;y&&(x.envMap.value=y,x.envMapRotation.value.setFromMatrix4(nS.makeRotationFromEuler(g)).transpose(),y.isCubeTexture&&y.isRenderTargetTexture===!1&&x.envMapRotation.value.premultiply(dx),x.reflectivity.value=p.reflectivity,x.ior.value=p.ior,x.refractionRatio.value=p.refractionRatio),p.lightMap&&(x.lightMap.value=p.lightMap,x.lightMapIntensity.value=p.lightMapIntensity,n(p.lightMap,x.lightMapTransform)),p.aoMap&&(x.aoMap.value=p.aoMap,x.aoMapIntensity.value=p.aoMapIntensity,n(p.aoMap,x.aoMapTransform))}function o(x,p){x.diffuse.value.copy(p.color),x.opacity.value=p.opacity,p.map&&(x.map.value=p.map,n(p.map,x.mapTransform))}function r(x,p){x.dashSize.value=p.dashSize,x.totalSize.value=p.dashSize+p.gapSize,x.scale.value=p.scale}function c(x,p,v,y){x.diffuse.value.copy(p.color),x.opacity.value=p.opacity,x.size.value=p.size*v,x.scale.value=y*.5,p.map&&(x.map.value=p.map,n(p.map,x.uvTransform)),p.alphaMap&&(x.alphaMap.value=p.alphaMap,n(p.alphaMap,x.alphaMapTransform)),p.alphaTest>0&&(x.alphaTest.value=p.alphaTest)}function l(x,p){x.diffuse.value.copy(p.color),x.opacity.value=p.opacity,x.rotation.value=p.rotation,p.map&&(x.map.value=p.map,n(p.map,x.mapTransform)),p.alphaMap&&(x.alphaMap.value=p.alphaMap,n(p.alphaMap,x.alphaMapTransform)),p.alphaTest>0&&(x.alphaTest.value=p.alphaTest)}function d(x,p){x.specular.value.copy(p.specular),x.shininess.value=Math.max(p.shininess,1e-4)}function f(x,p){p.gradientMap&&(x.gradientMap.value=p.gradientMap)}function u(x,p){x.metalness.value=p.metalness,p.metalnessMap&&(x.metalnessMap.value=p.metalnessMap,n(p.metalnessMap,x.metalnessMapTransform)),x.roughness.value=p.roughness,p.roughnessMap&&(x.roughnessMap.value=p.roughnessMap,n(p.roughnessMap,x.roughnessMapTransform)),p.envMap&&(x.envMapIntensity.value=p.envMapIntensity)}function h(x,p,v){x.ior.value=p.ior,p.sheen>0&&(x.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),x.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(x.sheenColorMap.value=p.sheenColorMap,n(p.sheenColorMap,x.sheenColorMapTransform)),p.sheenRoughnessMap&&(x.sheenRoughnessMap.value=p.sheenRoughnessMap,n(p.sheenRoughnessMap,x.sheenRoughnessMapTransform))),p.clearcoat>0&&(x.clearcoat.value=p.clearcoat,x.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(x.clearcoatMap.value=p.clearcoatMap,n(p.clearcoatMap,x.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(x.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,n(p.clearcoatRoughnessMap,x.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(x.clearcoatNormalMap.value=p.clearcoatNormalMap,n(p.clearcoatNormalMap,x.clearcoatNormalMapTransform),x.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===fn&&x.clearcoatNormalScale.value.negate())),p.dispersion>0&&(x.dispersion.value=p.dispersion),p.retroreflectivity>0&&(x.retroreflectivity.value=p.retroreflectivity),p.iridescence>0&&(x.iridescence.value=p.iridescence,x.iridescenceIOR.value=p.iridescenceIOR,x.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],x.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(x.iridescenceMap.value=p.iridescenceMap,n(p.iridescenceMap,x.iridescenceMapTransform)),p.iridescenceThicknessMap&&(x.iridescenceThicknessMap.value=p.iridescenceThicknessMap,n(p.iridescenceThicknessMap,x.iridescenceThicknessMapTransform))),p.transmission>0&&(x.transmission.value=p.transmission,x.transmissionSamplerMap.value=v.texture,x.transmissionSamplerSize.value.set(v.width,v.height),p.transmissionMap&&(x.transmissionMap.value=p.transmissionMap,n(p.transmissionMap,x.transmissionMapTransform)),x.thickness.value=p.thickness,p.thicknessMap&&(x.thicknessMap.value=p.thicknessMap,n(p.thicknessMap,x.thicknessMapTransform)),x.attenuationDistance.value=p.attenuationDistance,x.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(x.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(x.anisotropyMap.value=p.anisotropyMap,n(p.anisotropyMap,x.anisotropyMapTransform))),x.specularIntensity.value=p.specularIntensity,x.specularColor.value.copy(p.specularColor),p.specularColorMap&&(x.specularColorMap.value=p.specularColorMap,n(p.specularColorMap,x.specularColorMapTransform)),p.specularIntensityMap&&(x.specularIntensityMap.value=p.specularIntensityMap,n(p.specularIntensityMap,x.specularIntensityMapTransform))}function m(x,p){p.matcap&&(x.matcap.value=p.matcap)}function _(x,p){const v=t.get(p).light;x.referencePosition.value.setFromMatrixPosition(v.matrixWorld),x.nearDistance.value=v.shadow.camera.near,x.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function sS(e,t,n,i){let s={},a={},o=[];const r=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function c(g,b){const S=b.program;i.uniformBlockBinding(g,S)}function l(g,b){let S=s[g.id];S===void 0&&(x(g),S=d(g),s[g.id]=S,g.addEventListener("dispose",v));const T=b.program;i.updateUBOMapping(g,T);const M=t.render.frame;a[g.id]!==M&&(u(g),a[g.id]=M)}function d(g){const b=f();g.__bindingPointIndex=b;const S=e.createBuffer(),T=g.__size,M=g.usage;return e.bindBuffer(e.UNIFORM_BUFFER,S),e.bufferData(e.UNIFORM_BUFFER,T,M),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,b,S),S}function f(){for(let g=0;g<r;g++)if(o.indexOf(g)===-1)return o.push(g),g;return ce("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(g){const b=s[g.id],S=g.uniforms,T=g.__cache;e.bindBuffer(e.UNIFORM_BUFFER,b);for(let M=0,E=S.length;M<E;M++){const A=S[M];if(Array.isArray(A))for(let R=0,D=A.length;R<D;R++)h(A[R],M,R,T);else h(A,M,0,T)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function h(g,b,S,T){if(_(g,b,S,T)===!0){const M=g.__offset,E=g.value;if(Array.isArray(E)){let A=0;for(let R=0;R<E.length;R++){const D=E[R],O=p(D);m(D,g.__data,A),typeof D!="number"&&typeof D!="boolean"&&!D.isMatrix3&&!ArrayBuffer.isView(D)&&(A+=O.storage/Float32Array.BYTES_PER_ELEMENT)}}else m(E,g.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,M,g.__data)}}function m(g,b,S){typeof g=="number"||typeof g=="boolean"?b[0]=g:g.isMatrix3?(b[0]=g.elements[0],b[1]=g.elements[1],b[2]=g.elements[2],b[3]=0,b[4]=g.elements[3],b[5]=g.elements[4],b[6]=g.elements[5],b[7]=0,b[8]=g.elements[6],b[9]=g.elements[7],b[10]=g.elements[8],b[11]=0):ArrayBuffer.isView(g)?b.set(new g.constructor(g.buffer,g.byteOffset,b.length)):g.toArray(b,S)}function _(g,b,S,T){const M=g.value,E=b+"_"+S;if(T[E]===void 0)return typeof M=="number"||typeof M=="boolean"?T[E]=M:ArrayBuffer.isView(M)?T[E]=M.slice():T[E]=M.clone(),!0;{const A=T[E];if(typeof M=="number"||typeof M=="boolean"){if(A!==M)return T[E]=M,!0}else{if(ArrayBuffer.isView(M))return!0;if(A.equals(M)===!1)return A.copy(M),!0}}return!1}function x(g){const b=g.uniforms;let S=0;const T=16;for(let E=0,A=b.length;E<A;E++){const R=Array.isArray(b[E])?b[E]:[b[E]];for(let D=0,O=R.length;D<O;D++){const P=R[D],F=Array.isArray(P.value)?P.value:[P.value];for(let V=0,U=F.length;V<U;V++){const B=F[V],I=p(B),G=S%T,$=G%I.boundary,J=G+$;S+=$,J!==0&&T-J<I.storage&&(S+=T-J),P.__data=new Float32Array(I.storage/Float32Array.BYTES_PER_ELEMENT),P.__offset=S,S+=I.storage}}}const M=S%T;return M>0&&(S+=T-M),g.__size=S,g.__cache={},this}function p(g){const b={boundary:0,storage:0};return typeof g=="number"||typeof g=="boolean"?(b.boundary=4,b.storage=4):g.isVector2?(b.boundary=8,b.storage=8):g.isVector3||g.isColor?(b.boundary=16,b.storage=12):g.isVector4?(b.boundary=16,b.storage=16):g.isMatrix3?(b.boundary=48,b.storage=48):g.isMatrix4?(b.boundary=64,b.storage=64):g.isTexture?Jt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(g)?(b.boundary=16,b.storage=g.byteLength):Jt("WebGLRenderer: Unsupported uniform value type.",g),b}function v(g){const b=g.target;b.removeEventListener("dispose",v);const S=o.indexOf(b.__bindingPointIndex);o.splice(S,1),e.deleteBuffer(s[b.id]),delete s[b.id],delete a[b.id]}function y(){for(const g in s)e.deleteBuffer(s[g]);o=[],s={},a={}}return{bind:c,update:l,dispose:y}}const aS=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let ni=null;function oS(){return ni===null&&(ni=new x_(aS,16,16,Us,ui),ni.name="DFG_LUT",ni.minFilter=We,ni.magFilter=We,ni.wrapS=zi,ni.wrapT=zi,ni.generateMipmaps=!1,ni.needsUpdate=!0),ni}class rS{constructor(t={}){const{canvas:n=k1(),context:i=null,depth:s=!0,stencil:a=!1,alpha:o=!1,antialias:r=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:d="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:u=!1,outputBufferType:h=Sn}=t;this.isWebGLRenderer=!0;let m;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=i.getContextAttributes().alpha}else m=o;const _=h,x=new Set([Pu,Cu,Ru]),p=new Set([Sn,fi,er,nr,Au,zu]),v=new Uint32Array(4),y=new Int32Array(4),g=new q;let b=null,S=null;const T=[],M=[];let E=null;this.domElement=n,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=li,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const A=this;let R=!1,D=null,O=null,P=null,F=null;this._outputColorSpace=ln;let V=0,U=0,B=null,I=-1,G=null;const $=new Te,J=new Te;let it=null;const Tt=new ee(0);let H=0,tt=n.width,k=n.height,W=1,at=null,ht=null;const dt=new Te(0,0,tt,k),gt=new Te(0,0,tt,k);let Kt=!1;const ct=new Uu;let ut=!1,vt=!1;const _t=new we,Q=new q,St=new Te,Pt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let yt=!1;function j(){return B===null?W:1}let L=i;function xt(z,Y){return n.getContext(z,Y)}let bt,C,w,X,K,ot,wt,Mt,rt,st,At,Ht,Et,Rt,Vt,Zt,jt,Z,Lt,ft,It,Ot,mt;try{const z={alpha:!0,depth:s,stencil:a,antialias:r,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:d,failIfMajorPerformanceCaveat:f};if("setAttribute"in n&&n.setAttribute("data-engine",`three.js r${wu}`),n.addEventListener("webglcontextlost",Me,!1),n.addEventListener("webglcontextrestored",de,!1),n.addEventListener("webglcontextcreationerror",Bn,!1),L===null){const Y="webgl2";if(L=xt(Y,z),L===null)throw xt(Y)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Yt()}catch(z){throw n.removeEventListener("webglcontextlost",Me,!1),n.removeEventListener("webglcontextrestored",de,!1),n.removeEventListener("webglcontextcreationerror",Bn,!1),ce("WebGLRenderer: "+z.message),z}function Yt(){bt=new o2(L),bt.init(),It=new Jb(L,bt),C=new Ky(L,bt,t,It),w=new Zb(L,bt),C.reversedDepthBuffer&&u&&w.buffers.depth.setReversed(!0),O=L.createFramebuffer(),P=L.createFramebuffer(),F=L.createFramebuffer(),X=new l2(L),K=new Nb,ot=new Kb(L,bt,w,K,C,It,X),wt=new a2(A),Mt=new fv(L),Ot=new Yy(L,Mt),rt=new r2(L,Mt,X,Ot),st=new f2(L,rt,Mt,Ot,X),Z=new d2(L,C,ot),Vt=new Jy(K),At=new Db(A,wt,bt,C,Ot,Vt),Ht=new iS(A,K),Et=new Ob,Rt=new Wb(bt),jt=new qy(A,wt,w,st,m,c),Zt=new Yb(A,st,C),mt=new sS(L,X,C,w),Lt=new Zy(L,bt,X),ft=new c2(L,bt,X),X.programs=At.programs,A.capabilities=C,A.extensions=bt,A.properties=K,A.renderLists=Et,A.shadowMap=Zt,A.state=w,A.info=X}_!==Sn&&(E=new h2(_,n.width,n.height,r,s,a));const $t=new eS(A,L);this.xr=$t,this.getContext=function(){return L},this.getContextAttributes=function(){return L.getContextAttributes()},this.forceContextLoss=function(){const z=bt.get("WEBGL_lose_context");z&&z.loseContext()},this.forceContextRestore=function(){const z=bt.get("WEBGL_lose_context");z&&z.restoreContext()},this.getPixelRatio=function(){return W},this.setPixelRatio=function(z){z!==void 0&&(W=z,this.setSize(tt,k,!1))},this.getSize=function(z){return z.set(tt,k)},this.setSize=function(z,Y,lt=!0){if($t.isPresenting){Jt("WebGLRenderer: Can't change size while VR device is presenting.");return}tt=z,k=Y,n.width=Math.floor(z*W),n.height=Math.floor(Y*W),lt===!0&&(n.style.width=z+"px",n.style.height=Y+"px"),E!==null&&E.setSize(n.width,n.height),this.setViewport(0,0,z,Y)},this.getDrawingBufferSize=function(z){return z.set(tt*W,k*W).floor()},this.setDrawingBufferSize=function(z,Y,lt){tt=z,k=Y,W=lt,n.width=Math.floor(z*lt),n.height=Math.floor(Y*lt),this.setViewport(0,0,z,Y)},this.setEffects=function(z){if(_===Sn){ce("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(z){for(let Y=0;Y<z.length;Y++)if(z[Y].isOutputPass===!0){Jt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}E.setEffects(z||[])},this.getCurrentViewport=function(z){return z.copy($)},this.getViewport=function(z){return z.copy(dt)},this.setViewport=function(z,Y,lt,et){z.isVector4?dt.set(z.x,z.y,z.z,z.w):dt.set(z,Y,lt,et),w.viewport($.copy(dt).multiplyScalar(W).round())},this.getScissor=function(z){return z.copy(gt)},this.setScissor=function(z,Y,lt,et){z.isVector4?gt.set(z.x,z.y,z.z,z.w):gt.set(z,Y,lt,et),w.scissor(J.copy(gt).multiplyScalar(W).round())},this.getScissorTest=function(){return Kt},this.setScissorTest=function(z){w.setScissorTest(Kt=z)},this.setOpaqueSort=function(z){at=z},this.setTransparentSort=function(z){ht=z},this.getClearColor=function(z){return z.copy(jt.getClearColor())},this.setClearColor=function(){jt.setClearColor(...arguments)},this.getClearAlpha=function(){return jt.getClearAlpha()},this.setClearAlpha=function(){jt.setClearAlpha(...arguments)},this.clear=function(z=!0,Y=!0,lt=!0){let et=0;if(z){let nt=!1;if(B!==null){const Ut=B.texture.format;nt=x.has(Ut)}if(nt){const Ut=B.texture.type,Bt=p.has(Ut),Nt=jt.getClearColor(),Wt=jt.getClearAlpha(),qt=Nt.r,ne=Nt.g,se=Nt.b;Bt?(v[0]=qt,v[1]=ne,v[2]=se,v[3]=Wt,L.clearBufferuiv(L.COLOR,0,v)):(y[0]=qt,y[1]=ne,y[2]=se,y[3]=Wt,L.clearBufferiv(L.COLOR,0,y))}else et|=L.COLOR_BUFFER_BIT}Y&&(et|=L.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),lt&&(et|=L.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),et!==0&&L.clear(et)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(z){z.setRenderer(this),D=z},this.dispose=function(){n.removeEventListener("webglcontextlost",Me,!1),n.removeEventListener("webglcontextrestored",de,!1),n.removeEventListener("webglcontextcreationerror",Bn,!1),jt.dispose(),Et.dispose(),Rt.dispose(),K.dispose(),wt.dispose(),st.dispose(),Ot.dispose(),mt.dispose(),At.dispose(),$t.dispose(),$t.removeEventListener("sessionstart",b0),$t.removeEventListener("sessionend",S0),ds.stop()};function Me(z){z.preventDefault(),G0("WebGLRenderer: Context Lost."),R=!0}function de(){G0("WebGLRenderer: Context Restored."),R=!1;const z=X.autoReset,Y=Zt.enabled,lt=Zt.autoUpdate,et=Zt.needsUpdate,nt=Zt.type;Yt(),X.autoReset=z,Zt.enabled=Y,Zt.autoUpdate=lt,Zt.needsUpdate=et,Zt.type=nt}function Bn(z){ce("WebGLRenderer: A WebGL context could not be created. Reason: ",z.statusMessage)}function jn(z){const Y=z.target;Y.removeEventListener("dispose",jn),kg(Y)}function kg(z){Xg(z),K.remove(z)}function Xg(z){const Y=K.get(z).programs;Y!==void 0&&(Y.forEach(function(lt){At.releaseProgram(lt)}),z.isShaderMaterial&&At.releaseShaderCache(z))}this.renderBufferDirect=function(z,Y,lt,et,nt,Ut){Y===null&&(Y=Pt);const Bt=nt.isMesh&&nt.matrixWorld.determinantAffine()<0,Nt=Yg(z,Y,lt,et,nt);w.setMaterial(et,Bt);let Wt=lt.index,qt=1;if(et.wireframe===!0){if(Wt=rt.getWireframeAttribute(lt),Wt===void 0)return;qt=2}const ne=lt.drawRange,se=lt.attributes.position;let kt=ne.start*qt,fe=(ne.start+ne.count)*qt;Ut!==null&&(kt=Math.max(kt,Ut.start*qt),fe=Math.min(fe,(Ut.start+Ut.count)*qt)),Wt!==null?(kt=Math.max(kt,0),fe=Math.min(fe,Wt.count)):se!=null&&(kt=Math.max(kt,0),fe=Math.min(fe,se.count));const Ce=fe-kt;if(Ce<0||Ce===1/0)return;Ot.setup(nt,et,Nt,lt,Wt);let be,xe=Lt;if(Wt!==null&&(be=Mt.get(Wt),xe=ft,xe.setIndex(be)),nt.isMesh)et.wireframe===!0?(w.setLineWidth(et.wireframeLinewidth*j()),xe.setMode(L.LINES)):xe.setMode(L.TRIANGLES);else if(nt.isLine){let Xe=et.linewidth;Xe===void 0&&(Xe=1),w.setLineWidth(Xe*j()),nt.isLineSegments?xe.setMode(L.LINES):nt.isLineLoop?xe.setMode(L.LINE_LOOP):xe.setMode(L.LINE_STRIP)}else nt.isPoints?xe.setMode(L.POINTS):nt.isSprite&&xe.setMode(L.TRIANGLES);if(nt.isBatchedMesh)if(bt.get("WEBGL_multi_draw"))xe.renderMultiDraw(nt._multiDrawStarts,nt._multiDrawCounts,nt._multiDrawCount);else{const Xe=nt._multiDrawStarts,Ft=nt._multiDrawCounts,tn=nt._multiDrawCount,re=Wt?Mt.get(Wt).bytesPerElement:1,Tn=K.get(et).currentProgram.getUniforms();for(let ti=0;ti<tn;ti++)Tn.setValue(L,"_gl_DrawID",ti),xe.render(Xe[ti]/re,Ft[ti])}else if(nt.isInstancedMesh)xe.renderInstances(kt,Ce,nt.count);else if(lt.isInstancedBufferGeometry){const Xe=lt._maxInstanceCount!==void 0?lt._maxInstanceCount:1/0,Ft=Math.min(lt.instanceCount,Xe);xe.renderInstances(kt,Ce,Ft)}else xe.render(kt,Ce)};function y0(z,Y,lt,et){D!==null&&z.isNodeMaterial&&D.setObject(et,z),ut===!0&&Vt.setState(z,lt,!1),z.transparent===!0&&z.side===Ai&&z.forceSinglePass===!1?(z.side=fn,z.needsUpdate=!0,Dr(z,Y,et),z.side=Ds,z.needsUpdate=!0,Dr(z,Y,et),z.side=Ai):Dr(z,Y,et)}this.compile=function(z,Y,lt=null){lt===null&&(lt=z),D!==null&&D.renderStart(z,Y,lt),S=Rt.get(lt),S.init(Y),M.push(S),lt.traverseVisible(function(nt){nt.isLight&&nt.layers.test(Y.layers)&&(S.pushLight(nt),nt.castShadow&&S.pushShadow(nt))}),z!==lt&&z.traverseVisible(function(nt){nt.isLight&&nt.layers.test(Y.layers)&&(S.pushLight(nt),nt.castShadow&&S.pushShadow(nt))}),S.setupLights(),D!==null&&D.updateLights(S.state.lightsArray),vt=this.localClippingEnabled,ut=Vt.init(this.clippingPlanes,vt),ut===!0&&Vt.setGlobalState(this.clippingPlanes,Y),D!==null&&Zt.render(S.state.shadowsArray,lt,Y);const et=new Set;return z.traverse(function(nt){if(!(nt.isMesh||nt.isPoints||nt.isLine||nt.isSprite))return;const Ut=nt.material;if(Ut)if(Array.isArray(Ut))for(let Bt=0;Bt<Ut.length;Bt++){const Nt=Ut[Bt];y0(Nt,lt,Y,nt),et.add(Nt)}else y0(Ut,lt,Y,nt),et.add(Ut)}),S=M.pop(),D!==null&&D.renderEnd(),et},this.compileAsync=function(z,Y,lt=null){const et=this.compile(z,Y,lt);return new Promise(nt=>{function Ut(){if(et.forEach(function(Bt){const Wt=K.get(Bt).currentProgram;(Wt===void 0||Wt.isReady())&&et.delete(Bt)}),et.size===0){nt(z);return}setTimeout(Ut,10)}bt.get("KHR_parallel_shader_compile")!==null?Ut():setTimeout(Ut,10)})};let Wl=null;function $g(z){Wl&&Wl(z)}function b0(){ds.stop()}function S0(){ds.start()}const ds=new ix;ds.setAnimationLoop($g),typeof self<"u"&&ds.setContext(self),this.setAnimationLoop=function(z){Wl=z,$t.setAnimationLoop(z),z===null?ds.stop():ds.start()},$t.addEventListener("sessionstart",b0),$t.addEventListener("sessionend",S0),this.render=function(z,Y){if(Y!==void 0&&Y.isCamera!==!0){ce("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(R===!0)return;D!==null&&D.renderStart(z,Y);const lt=$t.enabled===!0&&$t.isPresenting===!0,et=E!==null&&(B===null||lt)&&E.begin(A,B);if(z.matrixWorldAutoUpdate===!0&&z.updateMatrixWorld(),Y.parent===null&&Y.matrixWorldAutoUpdate===!0&&Y.updateMatrixWorld(),$t.enabled===!0&&$t.isPresenting===!0&&(E===null||E.isCompositing()===!1)&&($t.cameraAutoUpdate===!0&&$t.updateCamera(Y),Y=$t.getCamera()),z.isScene===!0&&z.onBeforeRender(A,z,Y,B),S=Rt.get(z,M.length),S.init(Y),S.state.textureUnits=ot.getTextureUnits(),M.push(S),_t.multiplyMatrices(Y.projectionMatrix,Y.matrixWorldInverse),ct.setFromProjectionMatrix(_t,ri,Y.reversedDepth),vt=this.localClippingEnabled,ut=Vt.init(this.clippingPlanes,vt),b=Et.get(z,T.length),b.init(),T.push(b),$t.enabled===!0&&$t.isPresenting===!0){const Bt=A.xr.getDepthSensingMesh();Bt!==null&&kl(Bt,Y,-1/0,A.sortObjects)}kl(z,Y,0,A.sortObjects),b.finish(),D!==null&&D.updateLights(S.state.lightsArray),A.sortObjects===!0&&b.sort(at,ht),yt=$t.enabled===!1||$t.isPresenting===!1||$t.hasDepthSensing()===!1,yt&&jt.addToRenderList(b,z),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),ut===!0&&Vt.beginShadows();const nt=S.state.shadowsArray;if(Zt.render(nt,z,Y),ut===!0&&Vt.endShadows(),(et&&E.hasRenderPass())===!1){const Bt=b.opaque,Nt=b.transmissive;if(S.setupLights(),Y.isArrayCamera){const Wt=Y.cameras;if(Nt.length>0)for(let qt=0,ne=Wt.length;qt<ne;qt++){const se=Wt[qt];E0(Bt,Nt,z,se)}yt&&jt.render(z);for(let qt=0,ne=Wt.length;qt<ne;qt++){const se=Wt[qt];w0(b,z,se,se.viewport)}}else Nt.length>0&&E0(Bt,Nt,z,Y),yt&&jt.render(z),w0(b,z,Y)}B!==null&&U===0&&(ot.updateMultisampleRenderTarget(B),ot.updateRenderTargetMipmap(B)),et&&E.end(A),z.isScene===!0&&z.onAfterRender(A,z,Y),Ot.resetDefaultState(),I=-1,G=null,M.pop(),M.length>0?(S=M[M.length-1],ot.setTextureUnits(S.state.textureUnits),ut===!0&&Vt.setGlobalState(A.clippingPlanes,S.state.camera)):S=null,T.pop(),T.length>0?b=T[T.length-1]:b=null,D!==null&&D.renderEnd()};function kl(z,Y,lt,et){if(z.visible===!1)return;if(z.layers.test(Y.layers)){if(z.isGroup)lt=z.renderOrder;else if(z.isLOD)z.autoUpdate===!0&&z.update(Y);else if(z.isLightProbeGrid)S.pushLightProbeGrid(z);else if(z.isLight)S.pushLight(z),z.castShadow&&S.pushShadow(z);else if(z.isSprite){if(!z.frustumCulled||z.intersectsFrustum(ct)){et&&St.setFromMatrixPosition(z.matrixWorld).applyMatrix4(_t);const Bt=st.update(z),Nt=z.material;Nt.visible&&b.push(z,Bt,Nt,lt,St.z,null,Y)}}else if((z.isMesh||z.isLine||z.isPoints)&&(!z.frustumCulled||z.intersectsFrustum(ct))){const Bt=st.update(z),Nt=z.material;if(et&&(z.boundingSphere!==void 0?(z.boundingSphere===null&&z.computeBoundingSphere(),St.copy(z.boundingSphere.center)):(Bt.boundingSphere===null&&Bt.computeBoundingSphere(),St.copy(Bt.boundingSphere.center)),St.applyMatrix4(z.matrixWorld).applyMatrix4(_t)),Array.isArray(Nt)){const Wt=Bt.groups;for(let qt=0,ne=Wt.length;qt<ne;qt++){const se=Wt[qt],kt=Nt[se.materialIndex];kt&&kt.visible&&b.push(z,Bt,kt,lt,St.z,se,Y)}}else Nt.visible&&b.push(z,Bt,Nt,lt,St.z,null,Y)}}const Ut=z.children;for(let Bt=0,Nt=Ut.length;Bt<Nt;Bt++)kl(Ut[Bt],Y,lt,et)}function w0(z,Y,lt,et){const{opaque:nt,transmissive:Ut,transparent:Bt}=z;S.setupLightsView(lt),ut===!0&&Vt.setGlobalState(A.clippingPlanes,lt),et&&w.viewport($.copy(et)),nt.length>0&&Ir(nt,Y,lt),Ut.length>0&&Ir(Ut,Y,lt),Bt.length>0&&Ir(Bt,Y,lt),w.buffers.depth.setTest(!0),w.buffers.depth.setMask(!0),w.buffers.color.setMask(!0),w.setPolygonOffset(!1)}function E0(z,Y,lt,et){if((lt.isScene===!0?lt.overrideMaterial:null)!==null)return;if(S.state.transmissionRenderTarget[et.id]===void 0){const kt=bt.has("EXT_color_buffer_half_float")||bt.has("EXT_color_buffer_float");S.state.transmissionRenderTarget[et.id]=new Kn(1,1,{generateMipmaps:!0,type:kt?ui:Sn,minFilter:bs,samples:Math.max(4,C.samples),stencilBuffer:a,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:oe.workingColorSpace})}const Ut=S.state.transmissionRenderTarget[et.id],Bt=et.viewport||$;Ut.setSize(Bt.z*A.transmissionResolutionScale,Bt.w*A.transmissionResolutionScale);const Nt=A.getRenderTarget(),Wt=A.getActiveCubeFace(),qt=A.getActiveMipmapLevel();A.setRenderTarget(Ut),A.getClearColor(Tt),H=A.getClearAlpha(),H<1&&A.setClearColor(16777215,.5),A.clear(),yt&&jt.render(lt);const ne=A.toneMapping;A.toneMapping=li;const se=et.viewport;if(et.viewport!==void 0&&(et.viewport=void 0),S.setupLightsView(et),ut===!0&&Vt.setGlobalState(A.clippingPlanes,et),Ir(z,lt,et),ot.updateMultisampleRenderTarget(Ut),ot.updateRenderTargetMipmap(Ut),bt.has("WEBGL_multisampled_render_to_texture")===!1){let kt=!1;for(let fe=0,Ce=Y.length;fe<Ce;fe++){const be=Y[fe],{object:xe,geometry:Xe,material:Ft,group:tn}=be;if(Ft.side===Ai&&xe.layers.test(et.layers)){const re=Ft.side;Ft.side=fn,Ft.needsUpdate=!0,T0(xe,lt,et,Xe,Ft,tn),Ft.side=re,Ft.needsUpdate=!0,kt=!0}}kt===!0&&(ot.updateMultisampleRenderTarget(Ut),ot.updateRenderTargetMipmap(Ut))}A.setRenderTarget(Nt,Wt,qt),A.setClearColor(Tt,H),se!==void 0&&(et.viewport=se),A.toneMapping=ne}function Ir(z,Y,lt){const et=Y.isScene===!0?Y.overrideMaterial:null;for(let nt=0,Ut=z.length;nt<Ut;nt++){const Bt=z[nt],{object:Nt,geometry:Wt,group:qt}=Bt;let ne=Bt.material;ne.allowOverride===!0&&et!==null&&(ne=et),Nt.layers.test(lt.layers)&&T0(Nt,Y,lt,Wt,ne,qt)}}function T0(z,Y,lt,et,nt,Ut){D!==null&&nt.isNodeMaterial&&D.setObject(z,nt),z.onBeforeRender(A,Y,lt,et,nt,Ut),z.modelViewMatrix.multiplyMatrices(lt.matrixWorldInverse,z.matrixWorld),z.normalMatrix.getNormalMatrix(z.modelViewMatrix),nt.onBeforeRender(A,Y,lt,et,z,Ut),nt.transparent===!0&&nt.side===Ai&&nt.forceSinglePass===!1?(nt.side=fn,nt.needsUpdate=!0,A.renderBufferDirect(lt,Y,et,nt,z,Ut),nt.side=Ds,nt.needsUpdate=!0,A.renderBufferDirect(lt,Y,et,nt,z,Ut),nt.side=Ai):A.renderBufferDirect(lt,Y,et,nt,z,Ut),z.onAfterRender(A,Y,lt,et,nt,Ut)}function Dr(z,Y,lt){Y.isScene!==!0&&(Y=Pt);const et=K.get(z),nt=S.state.lights,Ut=S.state.shadowsArray,Bt=nt.state.version,Nt=At.getParameters(z,nt.state,Ut,Y,lt,S.state.lightProbeGridArray),Wt=At.getProgramCacheKey(Nt);let qt=et.programs;et.environment=z.isMeshStandardMaterial||z.isMeshLambertMaterial||z.isMeshPhongMaterial?Y.environment:null,et.fog=Y.fog;const ne=z.isMeshStandardMaterial||z.isMeshLambertMaterial&&!z.envMap||z.isMeshPhongMaterial&&!z.envMap;et.envMap=wt.get(z.envMap||et.environment,ne),et.envMapRotation=et.environment!==null&&z.envMap===null?Y.environmentRotation:z.envMapRotation,qt===void 0&&(z.addEventListener("dispose",jn),qt=new Map,et.programs=qt);let se=qt.get(Wt);if(se!==void 0){if(et.currentProgram===se&&et.lightsStateVersion===Bt)return z0(z,Nt),se}else Nt.uniforms=At.getUniforms(z),D!==null&&z.isNodeMaterial&&D.build(z,lt,Nt),z.onBeforeCompile(Nt,A),se=At.acquireProgram(Nt,Wt),qt.set(Wt,se),et.uniforms=Nt.uniforms;const kt=et.uniforms;return(!z.isShaderMaterial&&!z.isRawShaderMaterial||z.clipping===!0)&&(kt.clippingPlanes=Vt.uniform),z0(z,Nt),et.needsLights=Kg(z),et.lightsStateVersion=Bt,et.needsLights&&(kt.ambientLightColor.value=nt.state.ambient,kt.lightProbe.value=nt.state.probe,kt.sunLights.value=nt.state.sun,kt.sunLightShadows.value=nt.state.sunShadow,kt.directionalLights.value=nt.state.directional,kt.directionalLightShadows.value=nt.state.directionalShadow,kt.spotLights.value=nt.state.spot,kt.spotLightShadows.value=nt.state.spotShadow,kt.rectAreaLights.value=nt.state.rectArea,kt.ltc_1.value=nt.state.rectAreaLTC1,kt.ltc_2.value=nt.state.rectAreaLTC2,kt.pointLights.value=nt.state.point,kt.pointLightShadows.value=nt.state.pointShadow,kt.hemisphereLights.value=nt.state.hemi,kt.sunShadowMatrix.value=nt.state.sunShadowMatrix,kt.sunShadowCascade.value=nt.state.sunShadowCascade,kt.directionalShadowMatrix.value=nt.state.directionalShadowMatrix,kt.spotLightMatrix.value=nt.state.spotLightMatrix,kt.spotLightMap.value=nt.state.spotLightMap,kt.pointShadowMatrix.value=nt.state.pointShadowMatrix),et.lightProbeGrid=S.state.lightProbeGridArray.length>0,et.currentProgram=se,et.uniformsList=null,se}function A0(z){if(z.uniformsList===null){const Y=z.currentProgram.getUniforms();z.uniformsList=Dc.seqWithValue(Y.seq,z.uniforms)}return z.uniformsList}function z0(z,Y){const lt=K.get(z);lt.outputColorSpace=Y.outputColorSpace,lt.batching=Y.batching,lt.batchingColor=Y.batchingColor,lt.instancing=Y.instancing,lt.instancingColor=Y.instancingColor,lt.instancingMorph=Y.instancingMorph,lt.skinning=Y.skinning,lt.morphTargets=Y.morphTargets,lt.morphNormals=Y.morphNormals,lt.morphColors=Y.morphColors,lt.morphTargetsCount=Y.morphTargetsCount,lt.numClippingPlanes=Y.numClippingPlanes,lt.numIntersection=Y.numClipIntersection,lt.vertexAlphas=Y.vertexAlphas,lt.vertexTangents=Y.vertexTangents,lt.toneMapping=Y.toneMapping}function qg(z,Y){if(z.length===0)return null;if(z.length===1)return z[0].texture!==null?z[0]:null;g.setFromMatrixPosition(Y.matrixWorld);for(let lt=0,et=z.length;lt<et;lt++){const nt=z[lt];if(nt.texture!==null&&nt.boundingBox.containsPoint(g))return nt}return null}function Yg(z,Y,lt,et,nt){Y.isScene!==!0&&(Y=Pt),ot.resetTextureUnits();const Ut=Y.fog,Bt=et.isMeshStandardMaterial||et.isMeshLambertMaterial||et.isMeshPhongMaterial?Y.environment:null,Nt=B===null?A.outputColorSpace:B.isXRRenderTarget===!0?B.texture.colorSpace:oe.workingColorSpace,Wt=et.isMeshStandardMaterial||et.isMeshLambertMaterial&&!et.envMap||et.isMeshPhongMaterial&&!et.envMap,qt=wt.get(et.envMap||Bt,Wt),ne=et.vertexColors===!0&&!!lt.attributes.color&&lt.attributes.color.itemSize===4,se=!!lt.attributes.tangent&&(!!et.normalMap||et.anisotropy>0),kt=!!lt.morphAttributes.position,fe=!!lt.morphAttributes.normal,Ce=!!lt.morphAttributes.color;let be=li;et.toneMapped&&(B===null||B.isXRRenderTarget===!0)&&(be=A.toneMapping);const xe=lt.morphAttributes.position||lt.morphAttributes.normal||lt.morphAttributes.color,Xe=xe!==void 0?xe.length:0,Ft=K.get(et),tn=S.state.lights;if(ut===!0&&(vt===!0||z!==G)){const ye=z===G&&et.id===I;Vt.setState(et,z,ye)}let re=!1;et.version===Ft.__version?(Ft.needsLights&&Ft.lightsStateVersion!==tn.state.version||Ft.outputColorSpace!==Nt||nt.isBatchedMesh&&Ft.batching===!1||!nt.isBatchedMesh&&Ft.batching===!0||nt.isBatchedMesh&&Ft.batchingColor===!0&&nt._colorsTexture===null||nt.isBatchedMesh&&Ft.batchingColor===!1&&nt._colorsTexture!==null||nt.isInstancedMesh&&Ft.instancing===!1||!nt.isInstancedMesh&&Ft.instancing===!0||nt.isSkinnedMesh&&Ft.skinning===!1||!nt.isSkinnedMesh&&Ft.skinning===!0||nt.isInstancedMesh&&Ft.instancingColor===!0&&nt.instanceColor===null||nt.isInstancedMesh&&Ft.instancingColor===!1&&nt.instanceColor!==null||nt.isInstancedMesh&&Ft.instancingMorph===!0&&nt.morphTexture===null||nt.isInstancedMesh&&Ft.instancingMorph===!1&&nt.morphTexture!==null||Ft.envMap!==qt||et.fog===!0&&Ft.fog!==Ut||Ft.numClippingPlanes!==void 0&&(Ft.numClippingPlanes!==Vt.numPlanes||Ft.numIntersection!==Vt.numIntersection)||Ft.vertexAlphas!==ne||Ft.vertexTangents!==se||Ft.morphTargets!==kt||Ft.morphNormals!==fe||Ft.morphColors!==Ce||Ft.toneMapping!==be||Ft.morphTargetsCount!==Xe||!!Ft.lightProbeGrid!=S.state.lightProbeGridArray.length>0)&&(re=!0):(re=!0,Ft.__version=et.version);let Tn=Ft.currentProgram;re===!0&&(Tn=Dr(et,Y,nt),D&&et.isNodeMaterial&&D.onUpdateProgram(et,Tn,Ft));let ti=!1,Gi=!1,na=!1;const me=Tn.getUniforms(),Re=Ft.uniforms;if(w.useProgram(Tn.program)&&(ti=!0,Gi=!0,na=!0),et.id!==I&&(I=et.id,Gi=!0),Ft.needsLights){const ye=qg(S.state.lightProbeGridArray,nt);Ft.lightProbeGrid!==ye&&(Ft.lightProbeGrid=ye,Gi=!0)}if(ti||G!==z){w.buffers.depth.getReversed()&&z.reversedDepth!==!0&&(z._reversedDepth=!0,z.updateProjectionMatrix()),me.setValue(L,"projectionMatrix",z.projectionMatrix),me.setValue(L,"viewMatrix",z.matrixWorldInverse);const Vi=me.map.cameraPosition;Vi!==void 0&&Vi.setValue(L,Q.setFromMatrixPosition(z.matrixWorld)),C.logarithmicDepthBuffer&&me.setValue(L,"logDepthBufFC",2/(Math.log(z.far+1)/Math.LN2)),(et.isMeshPhongMaterial||et.isMeshToonMaterial||et.isMeshLambertMaterial||et.isMeshBasicMaterial||et.isMeshStandardMaterial||et.isShaderMaterial)&&me.setValue(L,"isOrthographic",z.isOrthographicCamera===!0),G!==z&&(G=z,Gi=!0,na=!0)}if(Ft.needsLights&&(tn.state.sunShadowMap.length>0&&me.setValue(L,"sunShadowMap",tn.state.sunShadowMap,ot),tn.state.directionalShadowMap.length>0&&me.setValue(L,"directionalShadowMap",tn.state.directionalShadowMap,ot),tn.state.spotShadowMap.length>0&&me.setValue(L,"spotShadowMap",tn.state.spotShadowMap,ot),tn.state.pointShadowMap.length>0&&me.setValue(L,"pointShadowMap",tn.state.pointShadowMap,ot)),nt.isSkinnedMesh){me.setOptional(L,nt,"bindMatrix"),me.setOptional(L,nt,"bindMatrixInverse");const ye=nt.skeleton;ye&&(ye.boneTexture===null&&ye.computeBoneTexture(),me.setValue(L,"boneTexture",ye.boneTexture,ot))}nt.isBatchedMesh&&(me.setOptional(L,nt,"batchingTexture"),me.setValue(L,"batchingTexture",nt._matricesTexture,ot),me.setOptional(L,nt,"batchingIdTexture"),me.setValue(L,"batchingIdTexture",nt._indirectTexture,ot),me.setOptional(L,nt,"batchingColorTexture"),nt._colorsTexture!==null&&me.setValue(L,"batchingColorTexture",nt._colorsTexture,ot));const Hi=lt.morphAttributes;if((Hi.position!==void 0||Hi.normal!==void 0||Hi.color!==void 0)&&Z.update(nt,lt,Tn),(Gi||Ft.receiveShadow!==nt.receiveShadow)&&(Ft.receiveShadow=nt.receiveShadow,me.setValue(L,"receiveShadow",nt.receiveShadow)),(et.isMeshStandardMaterial||et.isMeshLambertMaterial||et.isMeshPhongMaterial)&&et.envMap===null&&Y.environment!==null&&(Re.envMapIntensity.value=Y.environmentIntensity),Re.dfgLUT!==void 0&&(Re.dfgLUT.value=oS()),Gi){if(me.setValue(L,"toneMappingExposure",A.toneMappingExposure),Ft.needsLights&&Zg(Re,na),Ut&&et.fog===!0&&Ht.refreshFogUniforms(Re,Ut),Ht.refreshMaterialUniforms(Re,et,W,k,S.state.transmissionRenderTarget[z.id]),Ft.needsLights&&Ft.lightProbeGrid){const ye=Ft.lightProbeGrid;Re.probesSH.value=ye.texture,Re.probesMin.value.copy(ye.boundingBox.min),Re.probesMax.value.copy(ye.boundingBox.max),Re.probesResolution.value.copy(ye.resolution)}Dc.upload(L,A0(Ft),Re,ot)}if(et.isShaderMaterial&&et.uniformsNeedUpdate===!0&&(Dc.upload(L,A0(Ft),Re,ot),et.uniformsNeedUpdate=!1),et.isSpriteMaterial&&me.setValue(L,"center",nt.center),me.setValue(L,"modelViewMatrix",nt.modelViewMatrix),me.setValue(L,"normalMatrix",nt.normalMatrix),me.setValue(L,"modelMatrix",nt.matrixWorld),et.uniformsGroups!==void 0){const ye=et.uniformsGroups;for(let Vi=0,ia=ye.length;Vi<ia;Vi++){const C0=ye[Vi];mt.update(C0,Tn),mt.bind(C0,Tn)}}return Tn}function Zg(z,Y){z.ambientLightColor.needsUpdate=Y,z.lightProbe.needsUpdate=Y,z.sunLights.needsUpdate=Y,z.sunLightShadows.needsUpdate=Y,z.directionalLights.needsUpdate=Y,z.directionalLightShadows.needsUpdate=Y,z.pointLights.needsUpdate=Y,z.pointLightShadows.needsUpdate=Y,z.spotLights.needsUpdate=Y,z.spotLightShadows.needsUpdate=Y,z.rectAreaLights.needsUpdate=Y,z.hemisphereLights.needsUpdate=Y}function Kg(z){return z.isMeshLambertMaterial||z.isMeshToonMaterial||z.isMeshPhongMaterial||z.isMeshStandardMaterial||z.isShadowMaterial||z.isShaderMaterial&&z.lights===!0}this.getActiveCubeFace=function(){return V},this.getActiveMipmapLevel=function(){return U},this.getRenderTarget=function(){return B},this.setRenderTargetTextures=function(z,Y,lt){const et=K.get(z);et.__autoAllocateDepthBuffer=z.resolveDepthBuffer===!1,et.__autoAllocateDepthBuffer===!1&&(et.__useRenderToTexture=!1),K.get(z.texture).__webglTexture=Y,K.get(z.depthTexture).__webglTexture=et.__autoAllocateDepthBuffer?void 0:lt,et.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(z,Y){const lt=K.get(z);lt.__webglFramebuffer=Y,lt.__useDefaultFramebuffer=Y===void 0},this.setRenderTarget=function(z,Y=0,lt=0){B=z,V=Y,U=lt;let et=null,nt=!1,Ut=!1;if(z){const Nt=K.get(z);if(Nt.__useDefaultFramebuffer!==void 0){w.bindFramebuffer(L.FRAMEBUFFER,Nt.__webglFramebuffer),$.copy(z.viewport),J.copy(z.scissor),it=z.scissorTest,w.viewport($),w.scissor(J),w.setScissorTest(it),I=-1;return}else if(Nt.__webglFramebuffer===void 0)ot.setupRenderTarget(z);else if(Nt.__hasExternalTextures)ot.rebindTextures(z,K.get(z.texture).__webglTexture,K.get(z.depthTexture).__webglTexture);else if(z.depthBuffer){const ne=z.depthTexture;if(Nt.__boundDepthTexture!==ne){if(ne!==null&&K.has(ne)&&(z.width!==ne.image.width||z.height!==ne.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");ot.setupDepthRenderbuffer(z)}}const Wt=z.texture;(Wt.isData3DTexture||Wt.isDataArrayTexture||Wt.isCompressedArrayTexture)&&(Ut=!0);const qt=K.get(z).__webglFramebuffer;z.isWebGLCubeRenderTarget?(Array.isArray(qt[Y])?et=qt[Y][lt]:et=qt[Y],nt=!0):z.samples>0&&ot.useMultisampledRTT(z)===!1?et=K.get(z).__webglMultisampledFramebuffer:Array.isArray(qt)?et=qt[lt]:et=qt,$.copy(z.viewport),J.copy(z.scissor),it=z.scissorTest}else $.copy(dt).multiplyScalar(W).floor(),J.copy(gt).multiplyScalar(W).floor(),it=Kt;if(lt!==0&&(et=O),w.bindFramebuffer(L.FRAMEBUFFER,et)&&w.drawBuffers(z,et),w.viewport($),w.scissor(J),w.setScissorTest(it),nt){const Nt=K.get(z.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_CUBE_MAP_POSITIVE_X+Y,Nt.__webglTexture,lt)}else if(Ut){const Nt=Y;for(let Wt=0;Wt<z.textures.length;Wt++){const qt=K.get(z.textures[Wt]);L.framebufferTextureLayer(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0+Wt,qt.__webglTexture,lt,Nt)}}else if(z!==null&&lt!==0){const Nt=K.get(z.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,Nt.__webglTexture,lt)}I=-1};function R0(z){const Y=K.get(z);return(Y.__readFormat!==z.format||Y.__readType!==z.type)&&(Y.__readFormat=z.format,Y.__readType=z.type,Y.__formatReadable=C.textureFormatReadable(z.format),Y.__typeReadable=C.textureTypeReadable(z.type)),Y}this.readRenderTargetPixels=function(z,Y,lt,et,nt,Ut,Bt,Nt=0){if(!(z&&z.isWebGLRenderTarget)){ce("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Wt=K.get(z).__webglFramebuffer;if(z.isWebGLCubeRenderTarget&&Bt!==void 0&&(Wt=Wt[Bt]),Wt){w.bindFramebuffer(L.FRAMEBUFFER,Wt);try{const qt=z.textures[Nt],ne=qt.format,se=qt.type;z.textures.length>1&&L.readBuffer(L.COLOR_ATTACHMENT0+Nt);const kt=R0(qt);if(kt.__formatReadable===!1){ce("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(kt.__typeReadable===!1){ce("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}Y>=0&&Y<=z.width-et&&lt>=0&&lt<=z.height-nt&&L.readPixels(Y,lt,et,nt,It.convert(ne),It.convert(se),Ut)}finally{const qt=B!==null?K.get(B).__webglFramebuffer:null;w.bindFramebuffer(L.FRAMEBUFFER,qt)}}},this.readRenderTargetPixelsAsync=async function(z,Y,lt,et,nt,Ut,Bt,Nt=0){if(!(z&&z.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Wt=K.get(z).__webglFramebuffer;if(z.isWebGLCubeRenderTarget&&Bt!==void 0&&(Wt=Wt[Bt]),Wt)if(Y>=0&&Y<=z.width-et&&lt>=0&&lt<=z.height-nt){w.bindFramebuffer(L.FRAMEBUFFER,Wt);const qt=z.textures[Nt],ne=qt.format,se=qt.type;z.textures.length>1&&L.readBuffer(L.COLOR_ATTACHMENT0+Nt);const kt=R0(qt);if(kt.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(kt.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const fe=L.createBuffer();L.bindBuffer(L.PIXEL_PACK_BUFFER,fe),L.bufferData(L.PIXEL_PACK_BUFFER,Ut.byteLength,L.STREAM_READ),L.readPixels(Y,lt,et,nt,It.convert(ne),It.convert(se),0),L.bindBuffer(L.PIXEL_PACK_BUFFER,null);const Ce=B!==null?K.get(B).__webglFramebuffer:null;w.bindFramebuffer(L.FRAMEBUFFER,Ce);const be=L.fenceSync(L.SYNC_GPU_COMMANDS_COMPLETE,0);return L.flush(),await X1(L,be,4),L.bindBuffer(L.PIXEL_PACK_BUFFER,fe),L.getBufferSubData(L.PIXEL_PACK_BUFFER,0,Ut),L.bindBuffer(L.PIXEL_PACK_BUFFER,null),L.deleteBuffer(fe),L.deleteSync(be),Ut}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(z,Y=null,lt=0){const et=Math.pow(2,-lt),nt=Math.floor(z.image.width*et),Ut=Math.floor(z.image.height*et),Bt=Y!==null?Y.x:0,Nt=Y!==null?Y.y:0;ot.setTexture2D(z,0),L.copyTexSubImage2D(L.TEXTURE_2D,lt,0,0,Bt,Nt,nt,Ut),w.unbindTexture()},this.copyTextureToTexture=function(z,Y,lt=null,et=null,nt=0,Ut=0){let Bt,Nt,Wt,qt,ne,se,kt,fe,Ce;const be=z.isCompressedTexture?z.mipmaps[Ut]:z.image;if(lt!==null)Bt=lt.max.x-lt.min.x,Nt=lt.max.y-lt.min.y,Wt=lt.isBox3?lt.max.z-lt.min.z:1,qt=lt.min.x,ne=lt.min.y,se=lt.isBox3?lt.min.z:0;else{const Re=Math.pow(2,-nt);Bt=Math.floor(be.width*Re),Nt=Math.floor(be.height*Re),z.isDataArrayTexture?Wt=be.depth:z.isData3DTexture?Wt=Math.floor(be.depth*Re):Wt=1,qt=0,ne=0,se=0}et!==null?(kt=et.x,fe=et.y,Ce=et.z):(kt=0,fe=0,Ce=0);const xe=It.convert(Y.format),Xe=It.convert(Y.type);let Ft;Y.isData3DTexture?(ot.setTexture3D(Y,0),Ft=L.TEXTURE_3D):Y.isDataArrayTexture||Y.isCompressedArrayTexture?(ot.setTexture2DArray(Y,0),Ft=L.TEXTURE_2D_ARRAY):(ot.setTexture2D(Y,0),Ft=L.TEXTURE_2D),w.activeTexture(L.TEXTURE0),w.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,Y.flipY),w.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,Y.premultiplyAlpha),w.pixelStorei(L.UNPACK_ALIGNMENT,Y.unpackAlignment);const tn=w.getParameter(L.UNPACK_ROW_LENGTH),re=w.getParameter(L.UNPACK_IMAGE_HEIGHT),Tn=w.getParameter(L.UNPACK_SKIP_PIXELS),ti=w.getParameter(L.UNPACK_SKIP_ROWS),Gi=w.getParameter(L.UNPACK_SKIP_IMAGES);w.pixelStorei(L.UNPACK_ROW_LENGTH,be.width),w.pixelStorei(L.UNPACK_IMAGE_HEIGHT,be.height),w.pixelStorei(L.UNPACK_SKIP_PIXELS,qt),w.pixelStorei(L.UNPACK_SKIP_ROWS,ne),w.pixelStorei(L.UNPACK_SKIP_IMAGES,se);const na=z.isDataArrayTexture||z.isData3DTexture,me=Y.isDataArrayTexture||Y.isData3DTexture;if(z.isDepthTexture){const Re=K.get(z),Hi=K.get(Y),ye=K.get(Re.__renderTarget),Vi=K.get(Hi.__renderTarget);w.bindFramebuffer(L.READ_FRAMEBUFFER,ye.__webglFramebuffer),w.bindFramebuffer(L.DRAW_FRAMEBUFFER,Vi.__webglFramebuffer);for(let ia=0;ia<Wt;ia++)na&&(L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,K.get(z).__webglTexture,nt,se+ia),L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,K.get(Y).__webglTexture,Ut,Ce+ia)),L.blitFramebuffer(qt,ne,Bt,Nt,kt,fe,Bt,Nt,L.DEPTH_BUFFER_BIT,L.NEAREST);w.bindFramebuffer(L.READ_FRAMEBUFFER,null),w.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else if(nt!==0||z.isRenderTargetTexture||K.has(z)){const Re=K.get(z),Hi=K.get(Y);w.bindFramebuffer(L.READ_FRAMEBUFFER,P),w.bindFramebuffer(L.DRAW_FRAMEBUFFER,F);for(let ye=0;ye<Wt;ye++)na?L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,Re.__webglTexture,nt,se+ye):L.framebufferTexture2D(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,Re.__webglTexture,nt),me?L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,Hi.__webglTexture,Ut,Ce+ye):L.framebufferTexture2D(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,Hi.__webglTexture,Ut),nt!==0?L.blitFramebuffer(qt,ne,Bt,Nt,kt,fe,Bt,Nt,L.COLOR_BUFFER_BIT,L.NEAREST):me?L.copyTexSubImage3D(Ft,Ut,kt,fe,Ce+ye,qt,ne,Bt,Nt):L.copyTexSubImage2D(Ft,Ut,kt,fe,qt,ne,Bt,Nt);w.bindFramebuffer(L.READ_FRAMEBUFFER,null),w.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else me?z.isDataTexture||z.isData3DTexture?L.texSubImage3D(Ft,Ut,kt,fe,Ce,Bt,Nt,Wt,xe,Xe,be.data):Y.isCompressedArrayTexture?L.compressedTexSubImage3D(Ft,Ut,kt,fe,Ce,Bt,Nt,Wt,xe,be.data):L.texSubImage3D(Ft,Ut,kt,fe,Ce,Bt,Nt,Wt,xe,Xe,be):z.isDataTexture?L.texSubImage2D(L.TEXTURE_2D,Ut,kt,fe,Bt,Nt,xe,Xe,be.data):z.isCompressedTexture?L.compressedTexSubImage2D(L.TEXTURE_2D,Ut,kt,fe,be.width,be.height,xe,be.data):L.texSubImage2D(L.TEXTURE_2D,Ut,kt,fe,Bt,Nt,xe,Xe,be);w.pixelStorei(L.UNPACK_ROW_LENGTH,tn),w.pixelStorei(L.UNPACK_IMAGE_HEIGHT,re),w.pixelStorei(L.UNPACK_SKIP_PIXELS,Tn),w.pixelStorei(L.UNPACK_SKIP_ROWS,ti),w.pixelStorei(L.UNPACK_SKIP_IMAGES,Gi),Ut===0&&Y.generateMipmaps&&L.generateMipmap(Ft),w.unbindTexture()},this.initRenderTarget=function(z){K.get(z).__webglFramebuffer===void 0&&ot.setupRenderTarget(z)},this.initTexture=function(z){z.isCubeTexture?ot.setTextureCube(z,0):z.isData3DTexture?ot.setTexture3D(z,0):z.isDataArrayTexture||z.isCompressedArrayTexture?ot.setTexture2DArray(z,0):ot.setTexture2D(z,0),w.unbindTexture()},this.resetState=function(){V=0,U=0,B=null,w.reset(),Ot.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return ri}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const n=this.getContext();n.drawingBufferColorSpace=oe._getDrawingBufferColorSpace(t),n.unpackColorSpace=oe._getUnpackColorSpace()}}const cS={zoom:1,u:.5,v:.5};function lS(e){return e.zoom<=1+1e-6}function Ue(e){const{x0:t,W:n,D:i}=e,s=t+n;return{plants:[{x:t+.3,z:i-.22,hw:.2,hd:.2},{x:s-.35,z:3.5,hw:.2,hd:.2}],parasol:{x:s-1.4,z:i+1.9,hw:.05,hd:.05},palm:{x:s-.5,z:i+3.5,hw:.1,hd:.1},ramp:{x:s-2,z:i+3.6,hw:.6,hd:.35},doorMat:{x:e.door.x,z:i-.15,hw:.55,hd:.25},trees:[{x:t-.7,z:1,hw:.18,hd:.18},{x:t-.7,z:i*.45,hw:.18,hd:.18},{x:t-.7,z:i*.85,hw:.18,hd:.18},{x:t+n*.3,z:-.85,hw:.18,hd:.18},{x:t+n*.75,z:-.85,hw:.18,hd:.18}],terrace:{x:t+n/2,z:i+2.35,hw:n/2-.2,hd:2.15}}}const Xu={dz:-.03,base:{w:.5,h:.03,d:.34,y:.56},lid:{w:.5,h:.34,d:.025,y:.57,back:.16,tilt:.2}},dS=.93,pi={bg:"#fdfbf7",grass:"#86c96f",dirt:"#9a6a45",floor:"#f6e7cf",wall:"#fffaf1",wallTop:"#f1e3c9",desk:"#e2b880",deskTop:"#f3d79e",island:"#2a9d8f",islandTop:"#fffaf0",ink:"#1d1a17",rug:"#ffd166",islandRug:"#bfe1f2",plant:"#5fb35a",screenOn:"#fdfbf7",screenOff:"#3a3530",terrace:"#ecd7ae",window:"#cfeaff",lampOn:"#ffe7a8",lamp:"#f1e3c9",neon:"#ffd166",hemi:["#ffffff","#e9dcc4",1.55],sun:["#fff4e0",1.9],pendants:!1},mi={bg:"#141211",grass:"#3f6b35",dirt:"#6e4a31",floor:"#7a6150",wall:"#4a3d33",wallTop:"#5c4b3e",desk:"#ad7f50",deskTop:"#c6966a",island:"#1f7a70",islandTop:"#ece2cf",ink:"#0d0b0a",rug:"#c99a2e",islandRug:"#3b5f7a",plant:"#3f8a3e",screenOn:"#fff2d6",screenOff:"#26221f",terrace:"#6b5a44",window:"#2c4a6b",lampOn:"#ffcf8a",lamp:"#e6d8bf",neon:"#ffd166",hemi:["#ffd9a8","#3a2c22",1.5],sun:["#a9b8e8",.7],pendants:!0},fS=e=>e?mi:pi,N={bean:["#f39a4c","#6cb4ee","#7cc26b","#9b8fe0","#ffd166","#2a9d8f","#f28c28","#5aa9a0"],mural:["#ffd166","#6cb4ee","#7cc26b","#9b8fe0","#f39a4c"],board:["#2b6cb0","#2a9d8f","#c07a21","#6b46c1"],flowers:["#ffd166","#f39a4c","#9b8fe0","#fffaf0"],trunk:"#7a4a2a",leaf:["#5fb35a","#4e9a48"],pot:"#f39a4c",crate:"#e8b86b",tape:"#c98a3a",dark:"#2b2d42",metal:"#c9ccd3",paper:"#fffaf0",paperShade:"#e9e2d4",orange:"#f28c28",pineapple:"#e9b44c",pineLeaf:"#3f8a3e",banana:"#ffd166",marker:"#2b6cb0",skate:"#f39a4c",wheel:"#3a3532",truck:"#c9ccd1",sweat:"#8fd3ff",steam:"#ffffff",cloud:"#9a958c",sunglasses:"#1d1a17",parasol:"#ffd166",chair:["#6cb4ee","#fffaf0"],ramp:"#9b8fe0",palmTrunk:"#a0673f",mat:"#f39a4c",coffee:"#2b2d42",coffeeLed:"#ffd166",gold:"#e9c46a",eclipse:"#4b3f7a",grey:"#9a958c",ink:"#1d1a17",glass:"#bfe1f2",bar:"#7cc26b"},Qe=["#f39a4c","#6cb4ee","#7cc26b","#ffd166","#9b8fe0","#2a9d8f","#f28c28","#4f6d7a","#e9c46a","#5aa9a0"],uS=["#3d5a80","#2b2d42","#5c677d","#3d405b"],hS=["#f3d5b5","#e0ac7e","#c68b59","#8d5524","#ffdbac","#a0673f"],pS=["#2b2118","#4a3222","#7a4a2a","#d9a066","#1b1b1b","#9b8fe0"],mS=["cap","beanie","afro","bun","hair","headphones","capback","hair","beanie","cap"],fx="#1d1a17",rc="#1d1a17",xS="#3a2b26",gS="#f2b36b";function ze(e){let t=2166136261;for(let n=0;n<e.length;n++)t=Math.imul(t^e.charCodeAt(n),16777619);return t>>>0}function Fs(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let n=t;return n=Math.imul(n^n>>>15,n|1),n^=n+Math.imul(n^n>>>7,n|61),((n^n>>>14)>>>0)/4294967296}}function ux(e,t){const n=ze(e),i=(s,a)=>s[(n>>>a)%s.length];return{hoodie:t?fx:i(Qe,0),pants:i(uS,4),skin:i(hS,2),hair:t?"#2b2118":i(pS,13),hatColor:i(Qe,11),hat:t?"main":i(mS,7),phase:n%1e3/160}}function Ks(e,t,n,i){const{style:s,pal:a}=e,{base:o,lid:r}=Xu;e.add(s.box(o.w,o.h,o.d),e.mat(N.metal),t,n,o.y,i);const c=new Xt;c.position.set(n,r.y,i+r.back),c.rotation.x=r.tilt,t.add(c),e.add(s.box(r.w,r.h,r.d),e.mat(N.metal),c,0,r.h/2,0);const l=s.material(a.screenOff,{emissive:a.screenOn,ei:0});return l.userData.live=!0,e.add(s.box(.44,.28,.01),l,c,0,r.h/2,-.016),l}function Js(e,t,n,i){const{style:s,pal:a}=e;e.add(s.box(.11,.025,.11),e.mat(a.lamp),t,n,.56,i),e.add(s.box(.025,.13,.025),e.mat(a.lamp),t,n,.635,i),e.add(s.box(.12,.06,.1),e.mat(a.lamp),t,n-.03,.725,i);const o=s.material(a.lamp,{emissive:a.lampOn,ei:0});return o.userData.live=!0,e.add(s.box(.08,.02,.06),o,t,n-.03,.69,i),o}function Qs(e,t,n,i,s,a){const o=new Xt;o.position.set(n,0,i),o.rotation.y=a,t.add(o),e.add(e.style.box(.42,.08,.42),e.mat(s),o,0,.32,0),e.add(e.style.box(.42,.42,.07),e.mat(s),o,0,.55,-.2),e.add(e.style.cylinder(.03,.3),e.mat(e.pal.ink),o,0,.15,0)}function $u(e,t){let n=null;for(const i of e)i.of||t.x<i.x0||t.x>i.x1||i.z0<t.z||(!n||i.z0<n.z0)&&(n=i);return n}function hx(e,t){const n=new Map;return{style:e,pal:t,mat(i){let s=n.get(i);return s||(s=e.material(i),n.set(i,s)),s},add(i,s,a,o,r,c){const l=new Se(i,s);return l.position.set(o,r,c),a.add(l),l}}}function js(e,t,n,i,s,a,o,r){const c=r??e.mat(a);e.add(e.style.box(o,o,.02),c,t,n-2.2*o,i+1.1*o,s),e.add(e.style.box(o,o,.02),c,t,n-2.2*o,i-1.1*o,s);for(let l=0;l<3;l++){const d=e.add(e.style.box(3.4*o,.8*o,.02),c,t,n+1.2*o,i,s);d.rotation.z=l*Math.PI/3+Math.PI/2}}function hn(e,t,n,i,s,a){return e.add(e.style.box(n.x1-n.x0,i,n.z1-n.z0),e.mat(a),t,(n.x0+n.x1)/2,s,(n.z0+n.z1)/2)}const On=e=>({x0:e.x-e.hw,x1:e.x+e.hw,z0:e.z-e.hd,z1:e.z+e.hd}),_S=[0,1,1,1,2,2,2,4,4,4,8],vS=(e,t)=>e[Math.min(t,e.length-1)];function Bs(e,t,n,i,s){const{style:a}=e,o=new Xt;if(o.position.set(n,0,i),o.scale.setScalar(s),t.add(o),a.name==="clay"){e.add(a.cylinder(.14,1.3),e.mat(N.trunk),o,0,.65,0),[[0,1.75,0,.62],[.42,1.45,.1,.45],[-.38,1.5,-.1,.48]].forEach(([l,d,f,u],h)=>e.add(a.ball(u),e.mat(N.leaf[h%2]??N.trunk),o,l,d,f));return}e.add(a.box(.36,1.4,.36),e.mat(N.trunk),o,0,.7,0),[[0,1.6,0],[.45,1.5,0],[-.45,1.5,0],[0,2.05,0],[0,1.6,.45]].forEach(([c,l,d],f)=>e.add(a.box(.75,.75,.75),e.mat(N.leaf[f%2]??N.trunk),o,c,l,d))}function Qc(e,t,n,i){e.add(e.style.cylinder(.2,.36),e.mat(N.pot),t,n,.18,i);for(let s=0;s<3;s++){const a=e.add(e.style.ball(.26-s*.04),e.mat(s%2?N.leaf[0]:e.pal.plant),t,n+(s-1)*.12,.55+s*.22,i+s%2*.08);a.scale.y=1.2}}function MS(e,t,n,i,s){const a=e.add(e.style.ball(.11),e.mat(N.pineapple),t,n,i+.1,s);a.scale.y=1.45,e.add(e.style.box(.08,.16,.08),e.mat(N.pineLeaf),t,n,i+.3,s)}function jc(e,t,n,i){e.add(e.style.box(.5,.12,.5),e.mat(N.paper),t,n,.76,i),[N.orange,N.orange,N.banana,N.leaf[0]].forEach((a,o)=>e.add(e.style.ball(.09),e.mat(a),t,n+Math.cos(o*1.7)*.13,.86,i+Math.sin(o*1.7)*.12)),MS(e,t,n+.05,.84,i-.02)}function px(e,t,n){const{style:i}=e,s=i.pictureZ;e.add(i.box(1.8,.95,.05),e.mat("#d8d2c6"),t,n,1.05,.02+s),e.add(i.box(1.7,.85,.02),e.mat(N.paper),t,n,1.05,.05+s);const a=Fs(ze("board"));for(let r=0;r<5;r++){const c=.5+a()*.7,l=N.board[r%N.board.length]??N.marker;e.add(i.box(c,.045,.01),e.mat(l),t,n-.78+c/2+r%2*.08,1.37-r*.15,.065+s)}const o=[[.45,.72],[.55,.88],[.65,.8],[.75,1.02]];for(const[r,c]of o)e.add(i.box(.06,.06,.01),e.mat(N.mat),t,n+(r??0),c??0,.065+s)}function mx(e,t,n,i){const{style:s}=e,a=i-n;N.mural.forEach((o,r)=>{const c=a/4;e.add(s.box(c,.45+r%2*.12,.02),e.mat(o),t,n+c/2+r*(a-c)/4,1.15+(r%2?-.06:.08),.01+s.pictureZ)}),js(e,t,(n+i)/2,1.18,.035+s.pictureZ,e.pal.ink,.07)}function xx(e,t,n){e.add(e.style.box(.55,.28,.2),e.mat(N.dark),t,0,.84,n);for(const i of[-.15,.15])e.add(e.style.box(.14,.14,.02),e.mat(N.wheel),t,i,.84,n+.11)}function qu(e){const t=e.lounge.map(n=>n.x);return t.length?{l0:Math.min(...t)-.55,l1:Math.max(...t)+.55}:{l0:e.x0+.1,l1:e.x0+e.W*.4}}const Pl=e=>e.boardSpots.length?e.boardSpots.reduce((t,n)=>t+n.x,0)/e.boardSpots.length:e.x0+e.W/2,Yu=.55,gx=e=>({x:Pl(e)+.9+.25+Yu/2,z:.3});function _s(e,t){const n=Ue(e),{l0:i,l1:s}=qu(e),a=e.x0+e.W,o=e.island,r=[e.door,n.plants[0]??e.door,{x:0,z:o.z0+1.3},{x:(i+s)/2,z:1.5},{x:Pl(e),z:.9},{x:(i+s)/2,z:.6},{x:0,z:o.z1-.8},n.parasol,n.trees[1]??e.door,n.ramp,{x:e.x0-1.9,z:e.D*.55},gx(e),{x:e.x0-1.9,z:e.D+2.2},{x:a+1.2,z:1.2},{x:e.x0-1.9,z:1.4}];return r[Math.min(t,r.length-1)]??e.door}function xr(e,t){const n=e.island.z1-e.island.z0;return t<2?Math.min(n,1.2):t<6?Math.min(n,3.5):n}function gr(e){const{k:t,o:n,grow:i}=e,{style:s,pal:a}=t,o=x=>e.stage(x),r=o(0);if(!r)return;const c=n.furniture,{l0:l,l1:d}=qu(n),f=n.lounge.map(x=>x.z),u=o(3);u&&f.length&&t.add(s.box(d-l,.02,Math.max(...f)-Math.min(...f)+1.1),t.mat(a.rug),u,(l+d)/2,.035,(Math.min(...f)+Math.max(...f))/2);const h=x=>x.of!==void 0&&n.lounge.some(p=>p.x===x.of?.x&&p.z===x.of.z),m=c.filter(h),_=yl(i.stage);m.forEach((x,p)=>{if(p>=_)return;const v=p<2?3:p<4?5:8;t.add(s.ball((x.x1-x.x0)/2/1.05/.92),t.mat(N.bean[p%N.bean.length]??a.rug),o(v)??r,(x.x0+x.x1)/2,.2,(x.z0+x.z1)/2).scale.set(1.05,.62,1.05)})}function yS(e){const{k:t,o:n,grow:i}=e,{style:s,pal:a}=t,o=n.furniture,r=I=>e.stage(I),c=Ue(n),{x0:l,W:d,D:f}=n,u=l+d,h=n.island,m=r(0);if(!m)return;const _=r(1);_&&hn(t,_,On(c.terrace),.08,0,a.terrace);const x=I=>I.of!==void 0&&n.terrace.some(G=>G.x===I.of?.x&&G.z===I.of.z),p=o.filter(x),v=vS(_S,i.stage);p.forEach((I,G)=>{if(G>=v)return;const $=[1,4,7,7,10,10,10,10][G]??0;Dl(t,r($)??m,I,N.chair[G%2]??N.paper)});const y=r(1);y&&c.plants[0]&&Qc(t,y,c.plants[0].x,c.plants[0].z);const g=.75+i.garden*.06,b=r(2);if(b){jc(t,b,0,h.z0+1.3);const I=c.trees[0];I&&Bs(t,b,I.x,I.z,g)}const{l0:S,l1:T}=qu(n),M=r(4);M&&(px(t,M,Pl(n)),c.plants[1]&&Qc(t,M,c.plants[1].x,c.plants[1].z));const E=r(5);E&&(mx(t,E,S+.15,T-.15),xx(t,E,h.z0+xr(n,i.stage)-.6));const A=r(6);if(A){h.z1-h.z0>3&&jc(t,A,0,h.z0+2.9);const I=Fs(ze(`flowers${d}`));for(let G=0;G<10;G++){const $=I()<.5?l-.35-I()*.6:u+.35+I()*.6;t.add(s.box(.16,.16,.16),t.mat(N.flowers[G%4]??N.paper),A,$,.06,I()*(f+3))}}const R=r(7);if(R){const I=c.parasol;t.add(s.cylinder(.03,1.8),t.mat(a.ink),R,I.x,.9,I.z),t.add(s.box(1.4,.3,1.4),t.mat(N.parasol),R,I.x,1.85,I.z);const G=c.palm;t.add(s.box(.16,1.6,.16),t.mat(N.palmTrunk),R,G.x,.8,G.z);for(let $=0;$<4;$++){const J=t.add(s.box(.9,.04,.22),t.mat(N.leaf[0]),R,G.x,1.62,G.z);J.rotation.y=$*Math.PI/2+.4}}const D=r(8);if(D)for(const I of c.trees.slice(1))Bs(t,D,I.x,I.z,g);const O=r(9);O&&hn(t,O,On(c.ramp),.3,.15,N.ramp);const P=r(10);if(P){const I=_s(n,10);t.add(s.cylinder(.72,.25),t.mat("#d8d2c6"),P,I.x,.12,I.z),t.add(s.cylinder(.6,.05),s.material("#8fd3ff",{emissive:"#8fd3ff",ei:.15}),P,I.x,.26,I.z),t.add(s.cylinder(.13,.6),t.mat("#d8d2c6"),P,I.x,.5,I.z),t.add(s.ball(.12),t.mat("#8fd3ff"),P,I.x,.85,I.z)}const F=r(11);if(F){const I=_s(n,11);t.add(s.box(Yu,1.1,.45),t.mat(N.ramp),F,I.x,.55,I.z),t.add(s.box(.45,.32,.03),s.material(N.dark,{emissive:"#6cb4ee",ei:.5}),F,I.x,.82,I.z+.24),t.add(s.box(.5,.06,.25),t.mat(N.dark),F,I.x,.6,I.z+.28)}const V=r(12);if(V){const I=_s(n,12),G=t.add(s.cylinder(1,.04),t.mat("#6cb4ee"),V,I.x,0,I.z);G.scale.z=.7,t.add(s.box(.9,.06,.35),t.mat("#c49a6c"),V,I.x+.7,.06,I.z-.2);for(let $=0;$<3;$++)t.add(s.ball(.1),t.mat(N.leaf[0]),V,I.x-.5+$*.35,.04,I.z+.3-$*.2)}const U=r(13);if(U){const I=_s(n,13),G=2.3;t.add(s.ball(.6),t.mat(N.parasol),U,I.x,G,I.z),js(t,U,I.x,G,I.z+.62,t.pal.ink,.05),t.add(s.box(.35,.25,.35),t.mat("#c49a6c"),U,I.x,G-1,I.z);for(const $ of[-.15,.15])t.add(s.cylinder(.01,.5),t.mat(N.ink),U,I.x+$,G-.65,I.z)}const B=r(14);if(B){const I=_s(n,14),G=s.material(N.gold,{emissive:N.gold,ei:.15});t.add(s.box(.7,.4,.7),t.mat("#d8d2c6"),B,I.x,.2,I.z),t.add(s.capsule(.22,.25),G,B,I.x,.85,I.z),t.add(s.ball(.22),G,B,I.x,1.32,I.z)}Ll(t,m,n,i),bS(t,m,n,i),i.building&&i.stage<14&&Il(t,m,_s(n,i.stage+1))}function Ll(e,t,n,i){if(i.garden===0)return;const s=Fs(ze(`garden${n.W}`)),a=.9+i.garden*.12;for(let o=0;o<i.garden*4;o++){const c=s()<.5?n.x0-.3-s()*a:n.x0+n.W+.3+s()*a;e.add(e.style.box(.14,.14,.14),e.mat(N.flowers[o%4]??N.paper),t,c,.06,-.6+s()*(n.D+4.5))}}function bS(e,t,n,i){if(i.frames===0)return;const{style:s}=e,a=.36,o=i.stage>=11?gx(n).x+Yu/2+.1:Pl(n)+1.1,r=n.mainDesk.x-.5,c=Math.max(1,Math.floor((r-o)/a)),l=e.mat(i.golden?N.gold:N.crate);for(let d=0;d<i.frames;d++){const f=d%c,u=Math.floor(d/c),h=o+a/2+f*a,m=1.45-u*.32;if(m<.6)break;e.add(s.box(.28,.22,.02),l,t,h,m,.02+s.pictureZ),e.add(s.box(.22,.16,.01),e.mat(N.mural[d%N.mural.length]??N.paper),t,h,m,.035+s.pictureZ)}}function Il(e,t,n){const{style:i}=e;for(const[s,a]of[[-.5,-.4],[.5,-.4],[-.5,.4],[.5,.4]])e.add(i.cylinder(.08,.28),e.mat(N.orange),t,n.x+s,.14,n.z+a),e.add(i.cylinder(.12,.03),e.mat(N.orange),t,n.x+s,.015,n.z+a);for(let s=0;s<4;s++)e.add(i.box(.26,.12,.05),e.mat(s%2?N.paper:N.parasol),t,n.x-.39+s*.26,.32,n.z+.45);for(const s of[-.5,.5])e.add(i.box(.04,.32,.04),e.mat(N.ink),t,n.x+s,.16,n.z+.45)}const he={seat:.24,tilt:.6,back:.54,cloth:.05,rail:.04};function Dl(e,t,n,i){const{style:s,pal:a}=e,o=(n.x0+n.x1)/2,r=n.x1-n.x0-.04,c=e.mat(a.desk),l=e.mat(i),d=n.z0+.42,f=n.z1-d;e.add(s.box(r,he.cloth,f),l,t,o,he.seat-he.cloth/2,d+f/2);const u=e.add(s.box(r,he.cloth,he.back),l,t,o,0,0),h=Math.cos(he.tilt),m=Math.sin(he.tilt);u.rotation.x=he.tilt,u.position.set(o,he.seat-he.cloth/2+he.back/2*m,d-he.back/2*h);const _=he.seat-he.cloth;for(const x of[-1,1]){const p=o+x*(r/2-he.rail/2);e.add(s.box(he.rail,he.rail,f),c,t,p,_-he.rail/2,d+f/2),e.add(s.box(he.rail,_,he.rail),c,t,p,_/2,n.z1-he.rail),e.add(s.box(he.rail,_,he.rail),c,t,p,_/2,d);const v=he.seat+(he.back-.12)*m-he.cloth;e.add(s.box(he.rail,v,he.rail),c,t,p,v/2,d-(he.back-.12)*h)}}function SS({k:e,root:t,o:n,grow:i}){const{style:s,pal:a}=e,{x0:o,W:r,D:c}=n,l=o+r/2,d=new Se(s.box(r,.14,c),s.floor(a.floor,r,c));d.position.set(l,-.05,c/2),t.add(d);const f=n.island,u=xr(n,i.stage);e.add(s.box(f.x1-f.x0+1.6,.02,u+1.2),e.mat(a.islandRug),t,(f.x0+f.x1)/2,.03,f.z0+u/2);const h=1.7;e.add(s.box(r+.2,h,.2),e.mat(a.wall),t,l,h/2,-.1),e.add(s.box(.2,1,c+.2),e.mat(a.wall),t,o-.1,.5,c/2);const m=s.material(a.window,{emissive:a.window,ei:a.pendants?.4:0});for(let _=(n.desks.size>0?Math.min(...[...n.desks.values()].map(x=>x.z)):4.3)+.1;_<c-1;_+=2.3)e.add(s.box(.05,.45,1.2),m,t,o,.62,_+.6);hn(e,t,On(Ue(n).doorMat),.04,.03,N.mat)}function wS({k:e,root:t,o:n}){const{style:i,pal:s}=e,a=n.mainDesk,o=$u(n.furniture,a)??{x0:a.x-1.15,x1:a.x+1.15,z0:a.z+.1,z1:a.z+1.1},r=(o.x0+o.x1)/2,c=(o.z0+o.z1)/2,l=new Xt;l.position.set(r,0,c),t.add(l);const d=o.x1-o.x0,f=o.z1-o.z0;e.add(i.box(d-.1,.5,f-.1),e.mat(s.desk),l,0,.25,0),e.add(i.box(d,.06,f),e.mat(s.deskTop),l,0,.52,0);const u=Ks(e,l,a.x-r+.2,Xu.dz),h=Js(e,l,d/2-.2,f/2-.2);e.add(i.box(.7,.06,.5),e.mat(s.wallTop),l,-d/2+.5,.58,0),e.add(i.box(.34,.24,.26),e.mat(N.crate),l,-d/2+.5,.73,0),Qs(e,t,a.x,a.z-.05,N.dark,a.face);const m=i.material(s.neon,{flat:!0});return js(e,t,a.x,1.25,.02+i.pictureZ,s.neon,.06,m),{screen:u,lamp:h,top:{x:r,y:.55,z:c}}}function ES({k:e,root:t,o:n,grow:i}){const{style:s,pal:a}=e,o=n.island,r=(o.x0+o.x1)/2,c=(o.z0+o.z1)/2,l=n.furniture.find(f=>!f.of&&f.x0<r&&f.x1>r&&f.z0<c&&f.z1>c)??o,d={...l,z1:Math.min(l.z1,l.z0+xr(n,i.stage)+.15)};if(e.add(s.box(d.x1-d.x0-.2,.62,d.z1-d.z0-.15,.2),e.mat(a.island),t,r,.31,(d.z0+d.z1)/2),hn(e,t,d,.07,.66,a.islandTop),e.add(s.box(.5,.5,.42),e.mat(N.coffee),t,r,.95,o.z0+.35),e.add(s.box(.18,.06,.04),s.material(N.coffeeLed,{emissive:N.coffeeLed,ei:.5}),t,r,1.07,o.z0+.57),a.pendants)for(let f=o.z0+.9;f<d.z1;f+=1.8){const u=new ku("#ffcf8a",3.2,4.5,1.6);u.position.set(r,1.5,f),t.add(u)}}function TS({k:e,root:t,o:n},i,s){const a=$u(n.furniture,i)??{x0:i.x-.8,x1:i.x+.8,z0:i.z+.11,z1:i.z+.89},{style:o,pal:r}=e,c=ze(s),l=a.x1-a.x0,d=a.z1-a.z0,f=(a.x0+a.x1)/2,u=(a.z0+a.z1)/2,h=new Xt;h.position.set(f,0,u),t.add(h),e.add(o.box(l-.1,.5,d-.08,.12),e.mat(r.desk),h,0,.25,0),e.add(o.box(l,.06,d,.03),e.mat(r.deskTop),h,0,.52,0),e.add(o.box(.22,.08,.02),e.mat(Qe[c%Qe.length]??r.desk),h,-l/3,.4,d/2-.03);const m=Ks(e,h,i.x-f,Xu.dz),_=Js(e,h,l/2-.18,d/2-.17);return Qs(e,t,i.x,i.z-.05,Qe[(c>>5)%Qe.length]??r.desk,i.face),c%3===0&&e.add(o.cylinder(.06,.12),e.mat(N.paper),h,.42,.61,-.2),c%4===1&&(e.add(o.cylinder(.08,.12),e.mat(N.pot),h,-.55,.61,-.1),e.add(o.ball(.12),e.mat(r.plant),h,-.55,.76,-.1)),c%5===2&&e.add(o.ball(.07),e.mat(N.orange),h,.4,.62,.12),{screen:m,lamp:_,top:{x:f,y:.55,z:u}}}const kf={id:"loft",pal:fS,shell:SS,island:ES,lounge:gr,desk:TS,mainDesk:e=>wS(e),tree:({k:e},t,n,i,s)=>{Bs(e,t,n,i,s)},growth:yS,pieceAt:_s};function Na(e,t){const n=parseInt(e.slice(1),16);return`#${[n>>16&255,n>>8&255,n&255].map(s=>Math.max(0,Math.min(255,Math.round(s*t)))).map(s=>s.toString(16).padStart(2,"0")).join("")}`}const AS=["floor","wall","wallTop","desk","deskTop","island","islandTop","terrace","grass","dirt","rug","islandRug","plant"];function ja(e,t={}){const n={...pi,...e},i={};for(const a of AS)e[a]!==void 0&&(i[a]=Na(n[a],.62));const s={...mi,...i,...t};return a=>a?s:n}const _x=(e,t)=>({x:e.x+t*Math.sin(e.face),z:e.z+t*Math.cos(e.face)});function _r(e,t,n,i={}){const{k:s,root:a}=e,{style:o,pal:r}=s,c=i.w??1.5,l=i.d??.7,d=i.at??.5,f=ze(n),u=new Xt;u.position.set(t.x,0,t.z),u.rotation.y=t.face,a.add(u),s.add(o.box(c-.1,.5,l-.08,.12),s.mat(r.desk),u,0,.25,d),s.add(o.box(c,.06,l,.03),s.mat(r.deskTop),u,0,.52,d),s.add(o.box(.22,.08,.02),s.mat(Qe[f%Qe.length]??r.desk),u,-c/3,.4,d-l/2+.03);const h=Ks(s,u,0,d-.03),m=Js(s,u,c/2-.18,d+l/2-.17);i.chair!==!1&&Qs(s,u,0,-.05,Qe[(f>>5)%Qe.length]??r.desk,0),i.extra?.(u,f);const _=_x(t,d);return{screen:h,lamp:m,top:{x:_.x,y:.55,z:_.z}}}function to(e,t,n,i={}){const{k:s,root:a}=e,{style:o,pal:r}=s,c=(t.x0+t.x1)/2,l=(t.z0+t.z1)/2,d=t.x1-t.x0,f=t.z1-t.z0,u=new Xt;u.position.set(c,0,l),a.add(u),s.add(o.box(d-.1,.5,f-.1),s.mat(r.desk),u,0,.25,0),s.add(o.box(d,.06,f),s.mat(r.deskTop),u,0,.52,0);const h=Ks(s,u,n.x-c+.2,-.03),m=Js(s,u,d/2-.2,f/2-.2);return s.add(o.box(.7,.06,.5),s.mat(r.wallTop),u,-d/2+.5,.58,0),s.add(o.box(.34,.24,.26),s.mat(N.crate),u,-d/2+.5,.73,0),Qs(s,a,n.x,n.z-.05,N.dark,n.face),js(s,a,i.x??n.x,i.y??1.25,(i.z??.02)+o.pictureZ,r.neon,.06,o.material(r.neon,{flat:!0})),{screen:h,lamp:m,top:{x:c,y:.55,z:l}}}const eo=(e,t)=>e.furniture.find(n=>!n.of&&t.x>n.x0&&t.x<n.x1&&t.z>n.z0&&t.z<n.z1),zS=[0,1,1,1,2,2,2,4,4,4,8],RS=(e,t)=>e[Math.min(t,e.length-1)];function Zu(e,t){const{o:n,grow:i}=e,s=e.stage(0);if(!s)return;const a=yl(i.stage);n.lounge.forEach((o,r)=>{if(r>=a)return;const c=n.furniture.find(l=>l.of&&l.of.x===o.x&&l.of.z===o.z);c&&t(e.k,e.stage(r<2?3:r<4?5:8)??s,c,r)})}function ta(e){return(t,n)=>n<=0?t.door:e.pieces[Math.min(n,e.pieces.length-1)]?.at(t)??t.door}function no(e,t){const{k:n,o:i,grow:s}=e,a=e.stage(0);if(!a)return;const o=Ue(i),r=e.stage(1);r&&hn(n,r,On(o.terrace),.08,0,n.pal.terrace);const c=i.furniture.filter(u=>u.of!==void 0&&i.terrace.some(h=>h.x===u.of?.x&&h.z===u.of.z)),l=RS(zS,s.stage);c.forEach((u,h)=>{h>=l||Dl(n,e.stage([1,4,7,7,10,10,10,10][h]??0)??a,u,N.chair[h%2]??N.paper)});for(let u=1;u<t.pieces.length&&u<=s.stage;u++){const h=t.pieces[u],m=e.stage(u);h&&m&&h.draw(n,m,h.at(i),e)}const d=.75+s.garden*.06;o.trees.forEach((u,h)=>{const m=e.stage(h===0?2:8);m&&t.tree(n,m,u.x,u.z,d,h)});const f=e.stage(6);if(f){const u=Fs(ze(`flowers${String(i.W)}`)),h=t.flowers??N.flowers;for(let m=0;m<10;m++){const _=u()<.5?i.x0-.35-u()*.6:i.x0+i.W+.35+u()*.6;n.add(n.style.box(.16,.16,.16),n.mat(h[m%h.length]??N.paper),f,_,.06,u()*(i.D+3))}}Ll(n,a,i,s),CS(n,a,i,s,t),s.building&&s.stage<14&&Il(n,a,ta(t)(i,s.stage+1))}function CS(e,t,n,i,s){if(i.frames===0)return;const a=s.frameSpan(n),{xb:o,y:r,z:c}=a,l=i.stage>=11?s.pieces[11]?.at(n):void 0,d=l&&l.z<1&&l.x+Go/2>a.xa&&l.x-Go/2<o?Math.max(a.xa,l.x+Go/2+.1):a.xa,f=.36,u=Math.max(1,Math.floor((o-d)/f));for(let h=0;h<i.frames;h++){const m=r-Math.floor(h/u)*.32;if(m<.6)break;s.frame(e,t,d+f/2+h%u*f,m,c,h,i.golden)}}function vx(e,t){return(n,i,s,a,o,r,c)=>{n.add(n.style.box(.28,.22,.02),n.mat(c?N.gold:e),i,s,a,o+n.style.pictureZ),n.add(n.style.box(.22,.16,.01),n.mat(t[r%t.length]??N.paper),i,s,a,o+.015+n.style.pictureZ)}}function Mx(e,t,n,i,s,a){const r=e.add(e.style.ball(.6),e.mat(s[0]??N.parasol),t,n,2.3,i);r.scale.y=1.15,s[1]&&e.add(e.style.cylinder(.61,.18),e.mat(s[1]),t,n,2.3,i).scale.set(1,1,1),js(e,t,n,2.3,i+.62,a,.05),e.add(e.style.box(.35,.25,.35),e.mat("#c49a6c"),t,n,2.3-1,i);for(const c of[-.15,.15])e.add(e.style.cylinder(.01,.5),e.mat(N.ink),t,n+c,2.3-.65,i)}function Nl(e,t,n,i,s){e.add(e.style.box(.7,.4,.7),e.mat("#d8d2c6"),t,n,.2,i),s(e.style.material(N.gold,{emissive:N.gold,ei:.15}),.4)}const Xf=e=>e.boardSpots.length?e.boardSpots.reduce((t,n)=>t+n.x,0)/e.boardSpots.length:e.x0+e.W/2,en=(e,t=()=>{})=>({at:e,draw:t});function Ku(e){const t=n=>Ue(n);return{pieces:[en(n=>n.door),en(n=>t(n).plants[0]??n.door,(n,i,s)=>{Qc(n,i,s.x,s.z)}),en(e.fruit,(n,i,s)=>{jc(n,i,s.x,s.z)}),en(e.nap),en(n=>({x:Xf(n),z:.9}),(n,i,s,a)=>{px(n,i,s.x);const o=t(a.o).plants[1];o&&Qc(n,i,o.x,o.z)}),en(e.boombox,(n,i,s,a)=>{const[o,r]=e.mural(a.o);mx(n,i,o,r);const c=new Xt;c.position.x=s.x,i.add(c),xx(n,c,s.z)}),en(e.fruit2,(n,i,s)=>{jc(n,i,s.x,s.z)}),en(n=>t(n).parasol,(n,i,s,a)=>{const o=t(a.o);n.add(n.style.cylinder(.03,1.8),n.mat(n.pal.ink),i,o.parasol.x,.9,o.parasol.z),n.add(n.style.box(1.4,.3,1.4),n.mat(N.parasol),i,o.parasol.x,1.85,o.parasol.z),n.add(n.style.box(.16,1.6,.16),n.mat(N.palmTrunk),i,o.palm.x,.8,o.palm.z);for(let r=0;r<4;r++)n.add(n.style.box(.9,.04,.22),n.mat(N.leaf[0]),i,o.palm.x,1.62,o.palm.z).rotation.y=r*Math.PI/2+.4}),en(n=>t(n).trees[1]??n.door),en(n=>t(n).ramp,(n,i,s,a)=>hn(n,i,On(t(a.o).ramp),.3,.15,N.ramp)),en(n=>({x:n.x0-1.9,z:n.D*.55}),(n,i,s)=>{n.add(n.style.cylinder(.72,.25),n.mat("#d8d2c6"),i,s.x,.12,s.z),n.add(n.style.cylinder(.6,.05),n.style.material("#8fd3ff",{emissive:"#8fd3ff",ei:.15}),i,s.x,.26,s.z),n.add(n.style.cylinder(.13,.6),n.mat("#d8d2c6"),i,s.x,.5,s.z),n.add(n.style.ball(.12),n.mat("#8fd3ff"),i,s.x,.85,s.z)}),en(e.arcade,(n,i,s)=>{yx(n,i,s)}),en(n=>({x:n.x0-1.9,z:n.D+2.2}),(n,i,s,a)=>{Ju(n,i,s.x,s.z,1,.7,a.k.pal.pendants),n.add(n.style.box(.9,.06,.35),n.mat("#c49a6c"),i,s.x+.7,.06,s.z-.2);for(let o=0;o<3;o++)n.add(n.style.ball(.1),n.mat(N.leaf[0]),i,s.x-.5+o*.35,.04,s.z+.3-o*.2)}),en(n=>({x:n.x0+n.W+1.2,z:1.2}),(n,i,s)=>{Mx(n,i,s.x,s.z,[N.parasol],n.pal.ink)}),en(n=>({x:n.x0-1.9,z:1.4}),(n,i,s)=>{Nl(n,i,s.x,s.z,(a,o)=>{n.add(n.style.capsule(.22,.25),a,i,s.x,o+.45,s.z),n.add(n.style.ball(.22),a,i,s.x,o+.92,s.z)})})],tree:(n,i,s,a,o)=>{Bs(n,i,s,a,o)},frameSpan:e.frameSpan??(n=>({xa:Xf(n)+1.1,xb:n.mainDesk.x-.5,y:1.45,z:.02})),frame:vx(N.crate,N.mural)}}const Go=.55,PS=e=>({x:Xf(e)+.9+.25+Go/2,z:.3});function yx(e,t,n){e.add(e.style.box(Go,1.1,.45),e.mat(N.ramp),t,n.x,.55,n.z),e.add(e.style.box(.45,.32,.03),e.style.material(N.dark,{emissive:"#6cb4ee",ei:.5}),t,n.x,.82,n.z+.24),e.add(e.style.box(.5,.06,.25),e.mat(N.dark),t,n.x,.6,n.z+.28)}function Ju(e,t,n,i,s,a,o){e.add(e.style.cylinder(1,.04),e.style.material(o?"#1d3b52":"#6cb4ee",{emissive:o?"#2c5a7a":"#6cb4ee",ei:o?.3:.08}),t,n,0,i).scale.set(s,1,a)}const LS="#3d405b",IS=["#5fb35a","#7cc26b","#4e9a48"],DS=e=>e.o,Nh=Ku({fruit:e=>({x:(e.island.x0+e.island.x1)/2+.75,z:(e.island.z0+e.island.z1)/2+.3}),fruit2:e=>({x:(e.island.x0+e.island.x1)/2-.7,z:(e.island.z0+e.island.z1)/2-.5}),boombox:e=>({x:(e.island.x0+e.island.x1)/2-.75,z:(e.island.z0+e.island.z1)/2+.55}),mural:e=>{const t=e.lounge.map(n=>n.x);return[Math.min(...t)-.4,Math.max(...t)+.4]},arcade:PS,nap:e=>({x:(e.lounge[0]?.x??e.x0)+1,z:1.5})});function NS(e){const{k:t,root:n,o:i}=e,{style:s,pal:a}=t,{x0:o,W:r,D:c}=i,l=t.add(s.box(r,.14,c),s.floor(a.floor,r,c),n,o+r/2,-.05,c/2);l.receiveShadow=!0;const d=s.material(a.window,{opacity:.35}),f=1.9;t.add(s.box(r,.3,.12),t.mat(a.wallTop),n,o+r/2,.15,-.06),t.add(s.box(.12,.3,c),t.mat(a.wallTop),n,o-.06,.15,c/2),t.add(s.box(r,f-.3,.05),d,n,o+r/2,.3+(f-.3)/2,-.05),t.add(s.box(.05,f-.3,c),d,n,o-.05,.3+(f-.3)/2,c/2);const u=t.mat(LS);for(let h=0;h<=6;h++)t.add(s.box(.07,f,.07),u,n,o+h*r/6,f/2,-.05);for(let h=0;h<=6;h++)t.add(s.box(.07,f,.07),u,n,o-.05,f/2,h*c/6);t.add(s.box(r,.06,.08),u,n,o+r/2,f,-.05),t.add(s.box(.08,.06,c),u,n,o-.05,f,c/2);for(let h=0;h<6;h++){const m=o+(h+.5)*r/6;t.add(s.cylinder(.005,.3),u,n,m,f-.15,.25),t.add(s.cylinder(.14,.14),t.mat(N.pot),n,m,f-.35,.25),t.add(s.ball(.2),t.mat(IS[h%3]??N.leaf[0]),n,m,f-.48,.25).scale.y=1.3}hn(t,n,On(Ue(i).doorMat),.04,.03,N.mat)}function US(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=DS(e),{cx:o,cz:r,tableR:c}=a;t.add(i.cylinder(c,.62),t.mat(s.island),n,o,.31,r),t.add(i.cylinder(c+.08,.07),t.mat(s.islandTop),n,o,.66,r),t.add(i.cylinder(.2,2.4),t.mat("#a0673f"),n,o,1.4,r);const l=[[0,2.9,0,1,"#5fb35a"],[.6,2.5,.3,.7,"#7cc26b"],[-.6,2.6,-.2,.7,"#4e9a48"],[.1,3.4,-.3,.6,"#7cc26b"]];for(const[d,f,u,h,m]of l)t.add(i.ball(h),t.mat(m),n,o+d,f,r+u);t.add(i.box(.45,.45,.4),t.mat(N.coffee),n,o-.2,.92,r+.85),t.add(i.box(.16,.05,.04),i.material(N.coffeeLed,{emissive:N.coffeeLed,ei:.5}),n,o-.2,1.04,r+1.06)}const OS={id:"greenhouse",pal:ja({floor:"#e3b48f",wall:"#cfe8ee",wallTop:"#9cc7d1",desk:"#f3efe6",deskTop:"#ffffff",island:"#c49a6c",islandTop:"#e9d4b4",window:"#cfe8ee",rug:"#7cc26b"},{window:"#3b5f7a",desk:"#c9c2b4",deskTop:"#ddd6c8"}),shell:NS,island:US,lounge:gr,desk:(e,t,n)=>_r(e,t,n,{w:1.1,d:.55,at:.5}),mainDesk:e=>{const t=e.o.mainDesk,n=eo(e.o,{x:t.x,z:t.z+.6})??{x0:t.x-1.15,x1:t.x+1.15,z0:t.z+.1,z1:t.z+1.1};return to(e,n,t)},tree:({k:e},t,n,i,s)=>{Bs(e,t,n,i,s)},growth:e=>{no(e,Nh)},pieceAt:ta(Nh)},Ad=["#bfe1f2","#ffe3a3","#cfe8c3","#e2dcf7"],FS=["#f4a259","#ffd166","#e9c46a"],BS=e=>e.o,$f=e=>{const t=e.lounge.map(n=>n.x);return t.length?[Math.min(...t)-.4,Math.max(...t)+.4]:[e.x0+.3,e.x0+4]},Uh=Ku({fruit:e=>({x:(e.island.x0+e.island.x1)/2,z:e.island.z0+1.6}),fruit2:e=>({x:(e.island.x0+e.island.x1)/2,z:e.island.z0+2.9}),boombox:e=>({x:(e.island.x0+e.island.x1)/2,z:e.island.z1-.5}),mural:e=>$f(e),arcade:e=>({x:$f(e)[1]+.3,z:.3}),nap:e=>({x:(e.lounge[0]?.x??e.x0)+1,z:1.5})});function GS(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=BS(e),{x0:o,W:r,D:c}=a;t.add(i.box(r,.14,c),i.floor(s.floor,r,c),n,o+r/2,-.05,c/2),t.add(i.box(r+.2,1.7,.2),t.mat(s.wall),n,o+r/2,.85,-.1),t.add(i.box(.2,1,c+.2),t.mat(s.wall),n,o-.1,.5,c/2);const l=i.material(s.window,{emissive:s.window,ei:s.pendants?.4:0});for(let h=4.6;h<c-1;h+=2.3)t.add(i.box(.05,.45,1.2),l,n,o,.62,h+.6);const d=new Set([...a.slots.values()].map(h=>Math.floor(h/4)));a.pods.forEach((h,m)=>{if(!d.has(m))return;const _=Ad[m%Ad.length]??Ad[0];t.add(i.cylinder(2,.03),t.mat(s.pendants?Na(_,.55):_),n,h.x,.02,h.z)});const[f,u]=$f(a);FS.forEach((h,m)=>t.add(i.box(u-f,.2*(3-m),.18),t.mat(s.pendants?Na(h,.7):h),n,(f+u)/2,.1*(3-m),.1+m*.17)),hn(t,n,On(Ue(a).doorMat),.04,.03,N.mat)}function HS(e){const{k:t,root:n,o:i}=e,{style:s,pal:a}=t,o=i.island,r=(o.x0+o.x1)/2,c=(o.z0+o.z1)/2,l=o.z1-o.z0;t.add(s.box(o.x1-o.x0-.1,.62,l-.1,.15),t.mat(a.island),n,r,.31,c),t.add(s.box(o.x1-o.x0+.05,.07,l),t.mat(a.islandTop),n,r,.66,c),t.add(s.box(.42,.45,.4),t.mat(N.coffee),n,r,.92,o.z0+.4),t.add(s.box(.04,.05,.16),s.material(N.coffeeLed,{emissive:N.coffeeLed,ei:.5}),n,r+.22,1.04,o.z0+.4)}const VS={id:"campus",pal:ja({floor:"#efe6d8",wall:"#fbf6ec",wallTop:"#e4d6bf",desk:"#f6f2ea",deskTop:"#ffffff",island:"#f39a4c",islandTop:"#fffaf0"},{desk:"#c9c2b4",deskTop:"#ddd6c8"}),shell:GS,island:HS,lounge:gr,desk:(e,t,n)=>_r(e,t,n,{w:1.6,d:.78,at:.5}),mainDesk:e=>{const t=e.o.mainDesk,n=eo(e.o,{x:t.x,z:t.z+.6})??{x0:t.x-1.15,x1:t.x+1.15,z0:t.z+.1,z1:t.z+1.1};return to(e,n,t)},tree:({k:e},t,n,i,s)=>{Bs(e,t,n,i,s)},growth:e=>{no(e,Uh)},pieceAt:ta(Uh)},Yi=2.1,Oh=["#f39a4c","#6cb4ee","#2b2d42","#ffd166"],bx=e=>e.o,ts=e=>({x:(e.island.x0+e.island.x1)/2,z:(e.island.z0+e.island.z1)/2}),Qu=e=>e.boardSpots.reduce((t,n)=>t+n.x,0)/Math.max(1,e.boardSpots.length),Fh=Ku({fruit:e=>({x:ts(e).x+.1,z:ts(e).z}),fruit2:e=>({x:ts(e).x-.75,z:ts(e).z}),boombox:e=>({x:ts(e).x+.85,z:ts(e).z}),mural:e=>[e.x0+.15,e.x0+2.3],arcade:e=>({x:e.x0+.5,z:1.2}),nap:e=>({x:e.x0+e.W-2.5,z:e.D-2.5}),frameSpan:e=>({xa:e.x0+2.4,xb:Qu(e)-1.1,y:1.9,z:.02})});function WS(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=bx(e),{x0:o,W:r,D:c}=a,l=o+r;t.add(i.box(r,.14,c),i.floor(s.floor,r,c),n,o+r/2,-.05,c/2),t.add(i.box(r+.2,Yi,.2),t.mat(s.wall),n,o+r/2,Yi/2,-.1),t.add(i.box(.2,1.2,c+.2),t.mat(s.wall),n,o-.1,.6,c/2),t.add(i.box(r+.2,.08,.24),t.mat(s.wallTop),n,o+r/2,Yi,-.1);const d=Qu(a)-1;t.add(i.box(1.2,.5,.04),t.mat("#c49a6c"),n,d,1.75,.03+i.pictureZ);for(let g=0;g<6;g++)t.add(i.box(.06,.3,.04),t.mat(Oh[g%Oh.length]??N.dark),n,d-.45+g*.18,1.75+g%2*.06,.07+i.pictureZ);const f=4.3,u=c-.4;for(const g of[f,u])t.add(i.box(.16,Yi,.16),t.mat(s.wallTop),n,l+.05,Yi/2,g);t.add(i.box(.36,.34,u-f+.2),t.mat(s.wallTop),n,l+.05,Yi-.05,(f+u)/2),t.add(i.box(.06,.4,u-f-.16),t.mat("#9aa3ab"),n,l+.05,Yi-.42,(f+u)/2);for(let g=0;g<3;g++)t.add(i.box(.07,.02,u-f-.16),t.mat("#77838c"),n,l+.05,Yi-.3-g*.12,(f+u)/2);const h=new Xt;h.position.set(l-.35,0,f+.65),h.rotation.y=-Math.PI/2,n.add(h),XS(t,h,0,0);const m=ts(a),_=m.x+1.6,x=l-4.6,p=(m.z+.75+a.crossFront)/2;if(x-_>2.6){kS(t,n,(_+x)/2+.3,p);for(let g=0;g<3;g++)t.add(i.cylinder(.26,.14),t.mat(N.dark),n,_+.2,.08+g*.15,p+.2)}const v=t.add(i.cylinder(.5,.01),t.mat("#9a978f"),n,o+r*.62,.025,c*.72);v.scale.z=.6;const y=t.add(i.cylinder(.3,.16),t.mat(N.dark),n,o+.25,.3,c-1);y.rotation.z=Math.PI/2,hn(t,n,On(Ue(a).doorMat),.04,.03,N.mat)}function kS(e,t,n,i){const{style:s}=e,a=e.mat("#e9c46a");e.add(s.box(2.2,.4,1,.15),a,t,n,.38,i),e.add(s.box(1.1,.38,.9,.15),a,t,n-.25,.75,i),e.add(s.box(1,.26,.92),e.mat("#2c4a6b"),t,n-.25,.78,i);const o=e.add(s.box(.6,.04,.9),a,t,n+.75,.8,i);o.rotation.z=.7;for(const[r,c]of[[-.7,-.5],[.7,-.5],[-.7,.5],[.7,.5]]){const l=e.add(s.cylinder(.2,.12),e.mat(N.dark),t,n+r,.2,i+c);l.rotation.x=Math.PI/2}for(const r of[-.32,.32])e.add(s.box(.03,.1,.14),e.mat(N.paper),t,n+1.1,.45,i+r)}function XS(e,t,n,i){const{style:s}=e,a=e.mat("#6cb4ee");for(const o of[-.42,.42]){const r=e.add(s.cylinder(.16,.08),e.mat(N.dark),t,n+o,.16,i);r.rotation.x=Math.PI/2}e.add(s.box(.7,.14,.26),a,t,n-.05,.3,i),e.add(s.box(.3,.3,.3,.1),a,t,n-.3,.45,i),e.add(s.box(.34,.07,.24),e.mat(N.dark),t,n-.28,.63,i),e.add(s.box(.08,.5,.2),a,t,n+.38,.45,i),e.add(s.box(.04,.04,.5),e.mat(N.dark),t,n+.4,.72,i),e.add(s.ball(.05),e.mat(N.paper),t,n+.44,.62,i)}function $S(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=bx(e),{x:o,z:r}=ts(a);t.add(i.box(2.5,.62,.8,.08),t.mat(s.island),n,o,.31,r),t.add(i.box(2.6,.07,.9),t.mat(s.islandTop),n,o,.66,r),t.add(i.box(.2,.16,.16),t.mat(N.dark),n,o-1.1,.78,r+.32),t.add(i.box(.5,.26,.28),t.mat(N.pot),n,o-.3,.83,r-.22);const c=a.pingpong,l=(c.x0+c.x1)/2,d=(c.z0+c.z1)/2;t.add(i.box(c.x1-c.x0,.06,c.z1-c.z0),t.mat("#2a9d8f"),n,l,.72,d),t.add(i.box(.02,.01,c.z1-c.z0-.04),t.mat(N.paper),n,l-(c.x1-c.x0)/2+.03,.755,d),t.add(i.box(.04,.16,c.z1-c.z0),t.mat(N.paper),n,l,.83,d);for(const[f,u]of[[-1.1,-.6],[1.1,-.6],[-1.1,.6],[1.1,.6]])t.add(i.box(.06,.7,.06),t.mat(N.dark),n,l+f,.35,d+u);t.add(i.ball(.05),t.mat(N.paper),n,l+.6,.9,d+.2)}const qS={id:"workshop",pal:ja({floor:"#c4c1bb",wall:"#8e9aa3",wallTop:"#77838c",desk:"#c49a6c",deskTop:"#d8b483",island:"#5c677d",islandTop:"#c49a6c",rug:"#6cb4ee"},{floor:"#7d7a75",wall:"#4f585f"}),shell:WS,island:$S,lounge:gr,desk:(e,t,n)=>_r(e,t,n,{w:1.6,d:.78,at:.5}),mainDesk:e=>{const t=e.o.mainDesk,n=eo(e.o,{x:t.x,z:t.z+.6})??{x0:t.x-1.15,x1:t.x+1.15,z0:t.z+.1,z1:t.z+1.1};return to(e,n,t,{x:Qu(e.o),y:1.82})},tree:({k:e},t,n,i,s)=>{Bs(e,t,n,i,s)},growth:e=>{no(e,Fh)},pieceAt:ta(Fh)},kn="#4a3222",YS="#3d4a2e",Gs="#2b3a67",zo="#ec9a3c",Sx="#5f8f3a",wx="#a9adb3",Bh=[Gs,"#a8c96a","#e9c46a"],Rn=e=>e,Gh=e=>e.boardSpots.reduce((t,n)=>t+n.x,0)/Math.max(1,e.boardSpots.length),qf=e=>(e.island.x0+e.island.x1)/2,nn=(e,t=()=>{})=>({at:e,draw:t});function tl(e,t,n,i,s,a,o){const{style:r}=e;if(a%2===0){e.add(r.cylinder(.08*s,1*s),e.mat(kn),t,n,.5*s,i);for(const[c,l,d,f]of[[0,1.2,0,.5],[.3,1,.2,.35],[-.3,1.05,-.15,.32]])e.add(r.ball(f*s),e.mat(o?zo:"#7cb35a"),t,n+c*s,l*s,i+d*s);return}for(let c=0;c<4;c++){const l=n+c%2*.2,d=i+Math.floor(c/2)*.2;e.add(r.cylinder(.035,2*s),e.mat("#8fbf5a"),t,l,1*s,d).rotation.z=(c-1.5)*.05,e.add(r.ball(.18),e.mat("#6b9f3a"),t,l,2*s,d).scale.y=.5}}const Yf=e=>{const t=Rn(e).garden,n=(t.x0+t.x1)/2;return{lantern:{x:n+.9,z:t.z0+.7},maple:{x:n-.2,z:(t.z0+t.z1)/2},goban:{x:t.x0+.7,z:t.z1-.7},bamboo:{x:t.x1-.5,z:t.z1-.5}}},Hh={pieces:[nn(e=>e.door),nn(e=>Ue(e).plants[0]??e.door,(e,t,n)=>{e.add(e.style.box(.42,.12,.3),e.mat("#5c677d"),t,n.x,.06,n.z),e.add(e.style.cylinder(.04,.35),e.mat(kn),t,n.x,.3,n.z).rotation.z=.4;for(const[i,s]of[[-.12,.42],[.1,.5],[.02,.6]])e.add(e.style.ball(.12),e.mat("#4e7a3a"),t,n.x+i,s,n.z).scale.y=.5}),nn(e=>({x:qf(e),z:e.island.z0+1.6}),(e,t,n)=>{e.add(e.style.box(.44,.12,.32),e.mat(N.dark),t,n.x,.75,n.z),e.add(e.style.box(.18,.04,.12),e.mat(N.paper),t,n.x-.1,.82,n.z-.06),e.add(e.style.box(.18,.04,.12),e.mat("#7cc26b"),t,n.x+.1,.82,n.z-.06),e.add(e.style.box(.38,.04,.12),e.mat(N.orange),t,n.x,.82,n.z+.08)}),nn(e=>({x:(Rn(e).kotatsu.x0+Rn(e).kotatsu.x1)/2,z:1.75})),nn(e=>({x:Gh(e),z:.9}),(e,t,n,i)=>{const s=e.style.pictureZ;e.add(e.style.box(1.8,.95,.05),e.mat(kn),t,n.x,1.05,.02+s),e.add(e.style.box(1.66,.82,.02),e.mat("#2f3437"),t,n.x,1.05,.05+s);for(let o=0;o<4;o++)e.add(e.style.box(.04,.5-o*.08,.01),e.mat(N.paper),t,n.x+.55-o*.3,1.1,.065+s);const a=Ue(i.o).plants[1];a&&tl(e,t,a.x,a.z,.45,1,!1)}),nn(e=>({x:(Rn(e).kotatsu.x0+Rn(e).kotatsu.x1)/2,z:.4}),(e,t,n,i)=>{const s=e.style.pictureZ,a=Rn(i.o).kotatsu.x1-Rn(i.o).kotatsu.x0;e.add(e.style.box(a,.6,.02),e.mat("#fbf6e8"),t,n.x,1.2,.02+s);for(let r=0;r<5;r++){const c=r%2?"#3d6fb6":Gs;e.add(e.style.box(a/5-.04,.08+r%3*.06,.01),e.mat(c),t,n.x-a/2+(r+.5)*(a/5),1+r%3*.07,.035+s)}e.add(e.style.ball(.11),e.mat(N.paper),t,n.x+a/2-.25,1.36,.04+s);const o=Rn(i.o).garden;e.add(e.style.cylinder(.005,.3),e.mat(N.ink),t,o.x0-.25,1.6,o.z0),e.add(e.style.cap(.08,.6),e.mat("#bfe1f2"),t,o.x0-.25,1.42,o.z0),e.add(e.style.box(.06,.14,.01),e.mat(N.paper),t,o.x0-.25,1.28,o.z0)}),nn(e=>({x:qf(e),z:e.island.z0+2.9}),(e,t,n,i)=>{e.add(e.style.box(.4,.03,.3),e.mat(kn),t,n.x,.71,n.z),e.add(e.style.cylinder(.08,.07),e.mat("#e9e2d4"),t,n.x-.08,.76,n.z),e.add(e.style.cylinder(.06,.02),e.mat("#7cb35a"),t,n.x-.08,.8,n.z),e.add(e.style.cylinder(.035,.14),e.mat("#d8c9a0"),t,n.x+.1,.79,n.z);const s=Rn(i.o).garden;for(const[a,o,r]of[[.25,.3,.45],[.7,.75,.35],[.2,.85,.3]])e.add(e.style.ball(r),e.mat(Sx),t,s.x0+(s.x1-s.x0)*a,0,s.z0+(s.z1-s.z0)*o).scale.y=.35}),nn(e=>Ue(e).parasol,(e,t,n)=>{e.add(e.style.cylinder(.03,1.8),e.mat(kn),t,n.x,.9,n.z);const i=e.add(e.style.cap(.85,.35),e.mat(zo),t,n.x,1.75,n.z);i.scale.y=.6,e.add(e.style.cap(.4,.35),e.mat(N.paper),t,n.x,1.79,n.z).scale.y=.6}),nn(e=>Ue(e).trees[1]??e.door),nn(e=>Yf(e).goban,(e,t,n)=>{e.add(e.style.box(.5,.18,.5),e.mat("#e2b880"),t,n.x,.09,n.z);for(let i=0;i<3;i++)e.add(e.style.box(.44,.005,.01),e.mat(N.ink),t,n.x,.185,n.z-.15+i*.15),e.add(e.style.box(.01,.005,.44),e.mat(N.ink),t,n.x-.15+i*.15,.185,n.z);e.add(e.style.cylinder(.09,.1),e.mat(kn),t,n.x-.4,.05,n.z),e.add(e.style.cylinder(.09,.1),e.mat(kn),t,n.x+.4,.05,n.z),e.add(e.style.ball(.03),e.mat(N.ink),t,n.x+.05,.2,n.z),e.add(e.style.ball(.03),e.mat(N.paper),t,n.x-.1,.2,n.z+.15)}),nn(e=>Yf(e).bamboo,(e,t,n,i)=>{e.add(e.style.cylinder(.3,.18),e.mat(wx),t,n.x,.09,n.z),e.add(e.style.cylinder(.25,.02),e.style.material(i.k.pal.pendants?"#1d3b52":"#8fd3ff"),t,n.x,.19,n.z),e.add(e.style.cylinder(.045,.7),e.mat("#a8c96a"),t,n.x-.35,.42,n.z-.1).rotation.z=1.1,e.add(e.style.cylinder(.02,.35),e.mat("#6b8f3a"),t,n.x-.4,.2,n.z-.1)}),nn(e=>({x:Rn(e).kotatsu.x1+.45,z:.3}),(e,t,n)=>{yx(e,t,n)}),nn(e=>({x:e.x0-1.9,z:e.D+2.2}),(e,t,n,i)=>{Ju(e,t,n.x,n.z,1,.75,i.k.pal.pendants);const s=e.add(e.style.box(.4,.06,1.8),e.mat(zo),t,n.x,.2,n.z);s.rotation.x=0;for(const a of[-.85,.85])e.add(e.style.box(.42,.2,.08),e.mat(zo),t,n.x,.1,n.z+a);for(const[a,o,r]of[[-.5,.2,N.orange],[.5,-.25,N.paper]])e.add(e.style.ball(.09),e.mat(r),t,n.x+a,.04,n.z+o).scale.set(1.8,.5,1)}),nn(e=>({x:e.x0+e.W+1.2,z:1.2}),(e,t,n)=>{e.add(e.style.cylinder(.04,3.2),e.mat(kn),t,n.x,1.6,n.z),[[Gs,2.9],[zo,2.5],["#6cb4ee",2.1]].forEach(([i,s],a)=>{const o=e.add(e.style.capsule(.12-a*.015,.7-a*.1),e.mat(i),t,n.x+.5,s,n.z);o.rotation.z=Math.PI/2-.1,e.add(e.style.ball(.04),e.mat(N.paper),t,n.x+.12,s+.04,n.z+.1)})}),nn(e=>({x:e.x0-1.9,z:1.4}),(e,t,n)=>{Nl(e,t,n.x,n.z,(i,s)=>{e.add(e.style.ball(.26),i,t,n.x,s+.3,n.z).scale.y=1.15,e.add(e.style.ball(.2),i,t,n.x,s+.7,n.z);for(const a of[-.1,.1])e.add(e.style.box(.07,.1,.05),i,t,n.x+a,s+.9,n.z);e.add(e.style.capsule(.05,.16),i,t,n.x+.2,s+.78,n.z+.08)})})],tree:(e,t,n,i,s,a)=>{tl(e,t,n,i,s,a,!0)},frameSpan:e=>({xa:Gh(e)+1.1,xb:e.mainDesk.x-.5,y:1.3,z:.02}),frame:(e,t,n,i,s,a,o)=>{const r=s+e.style.pictureZ;e.add(e.style.box(.26,.03,.03),e.mat(kn),t,n,i+.27,r),e.add(e.style.box(.22,.5,.01),e.mat(o?N.gold:"#fbf6e8"),t,n,i,r),e.add(e.style.box(.03,.22-a%3*.05,.01),e.mat(N.ink),t,n,i+.03,r+.01),e.add(e.style.box(.26,.03,.03),e.mat(kn),t,n,i-.26,r)},flowers:["#fffaf0","#ffd166","#9b8fe0","#e9e2d4"]};function ZS(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=Rn(e.o),{x0:o,W:r,D:c,garden:l}=a;t.add(i.box(r,.14,c),i.floor(s.floor,r,c),n,o+r/2,-.05,c/2);const d=t.mat(YS),f=l.x0-.5-o;for(let p=2;p<c;p+=2)t.add(i.box(f,.012,.05),d,n,o+f/2,.03,p);for(let p=o+1.9;p<l.x0-.6;p+=1.9)t.add(i.box(.05,.012,c-.2),d,n,p,.03,c/2);t.add(i.box(.5,.08,l.z1-l.z0+.6),t.mat("#7a5a3c"),n,l.x0-.25,.05,(l.z0+l.z1)/2),t.add(i.box(l.x1-l.x0,.03,l.z1-l.z0),t.mat(s.pendants?"#8e8a80":"#e6e2d6"),n,(l.x0+l.x1)/2,.02,(l.z0+l.z1)/2);for(let p=l.z0+.25;p<l.z1;p+=.3)t.add(i.box(l.x1-l.x0-.1,.005,.02),t.mat(s.pendants?"#77736a":"#c9c3b3"),n,(l.x0+l.x1)/2,.04,p);const u=Yf(a);for(const[p,v,y]of[[-.8,1,.5],[.9,-1.2,.6]])t.add(i.ball(y),t.mat(Sx),n,(l.x0+l.x1)/2+p,0,v>0?l.z0+v:l.z1+v).scale.y=.4;t.add(i.ball(.25),t.mat("#8e9399"),n,u.maple.x+.6,.08,u.maple.z-.9).scale.y=.6;const h=u.lantern;t.add(i.box(.22,.45,.22),t.mat(wx),n,h.x,.22,h.z),t.add(i.box(.3,.2,.3),i.material("#e9d8a6",s.pendants?{emissive:"#e9d8a6",ei:1.2}:{}),n,h.x,.55,h.z),t.add(i.box(.42,.1,.42),t.mat("#8e9399"),n,h.x,.72,h.z),tl(t,n,u.maple.x,u.maple.z,1.1,0,e.grow.stage>=6);const m=t.mat(kn);t.add(i.box(r+.2,1.8,.14),t.mat(s.wall),n,o+r/2,.9,-.07),t.add(i.box(.14,1.2,c+.2),t.mat(s.wall),n,o-.07,.6,c/2);for(let p=o;p<=o+r+.01;p+=1.9)t.add(i.box(.08,1.8,.05),m,n,p,.9,.01);t.add(i.box(r,.08,.06),m,n,o+r/2,1.78,.01);for(let p=0;p<=c+.01;p+=1.9)t.add(i.box(.05,1.2,.08),m,n,o+.01,.6,p);const _=i.material("#fbf6e8",s.pendants?{emissive:"#fbf6e8",ei:.35}:{});for(let p=4.6;p<c-1.2;p+=1.9){t.add(i.box(.02,.8,1.6),_,n,o+.02,.62,p+.8);for(let v=1;v<4;v++)t.add(i.box(.03,.8,.02),m,n,o+.03,.62,p+v*.4);t.add(i.box(.03,.02,1.6),m,n,o+.03,.62,p+.8)}const x=a.door.x;for(const p of[-.55,.55])t.add(i.box(.08,1.7,.08),m,n,x+p,.85,c-.05);t.add(i.box(1.2,.08,.08),m,n,x,1.7,c-.05);for(const p of[-.22,.22])t.add(i.box(.42,.5,.02),t.mat(Gs),n,x+p,1.4,c-.05);t.add(i.ball(.07),t.mat(N.paper),n,x,1.45,c-.03),hn(t,n,On(Ue(a).doorMat),.03,.03,"#c9b27a")}function KS(e){const{k:t,root:n,o:i}=e,{style:s,pal:a}=t,o=i.island,r=qf(i),c=(o.z0+o.z1)/2,l=o.z1-o.z0;t.add(s.box(o.x1-o.x0-.1,.62,l-.1,.06),t.mat(a.island),n,r,.31,c),t.add(s.box(o.x1-o.x0+.05,.06,l),t.mat(a.islandTop),n,r,.65,c),t.add(s.ball(.13),t.mat("#5c677d"),n,r,.78,o.z0+.45),t.add(s.cylinder(.02,.12),t.mat("#5c677d"),n,r+.14,.82,o.z0+.45).rotation.z=-.8;for(let d=0;d<3;d++)t.add(s.cylinder(.045,.07),t.mat("#e9e2d4"),n,r+.2,.72,o.z0+.75+d*.14)}function JS(e){const{k:t,root:n}=e,{style:i}=t,s=Rn(e.o).kotatsu,a=(s.x0+s.x1)/2,o=(s.z0+s.z1)/2;if(t.add(i.box(s.x1-s.x0,.22,s.z1-s.z0+.1),t.mat(Gs),n,a,.11,o),t.add(i.box(s.x1-s.x0-.2,.05,s.z1-s.z0-.1),t.mat("#7a5a3c"),n,a,.25,o),e.grow.stage>=2)for(const r of[0,.16])t.add(i.ball(.09),t.mat(N.orange),n,a+r,.33,o+r/2);Zu(e,(r,c,l,d)=>{r.add(r.style.box(l.x1-l.x0,.08,l.z1-l.z0,.04),r.mat(Bh[d%Bh.length]??Gs),c,(l.x0+l.x1)/2,.05,(l.z0+l.z1)/2)})}const QS={id:"kyoto",pal:ja({floor:"#d6cc95",wall:"#e8dcc0",wallTop:"#5c3d2e",desk:"#5c3d2e",deskTop:"#7a5a3c",island:"#5c3d2e",islandTop:"#7a5a3c",grass:"#7fa35a",dirt:"#6b5a48",terrace:"#9a8f80",rug:"#a8c96a"},{desk:"#7a5a3c",deskTop:"#94704e",island:"#7a5a3c",islandTop:"#94704e"}),shell:ZS,island:KS,lounge:JS,desk:(e,t,n)=>_r(e,t,n,{w:1.6,d:.78,at:.5}),mainDesk:e=>{const t=e.o.mainDesk,n=eo(e.o,{x:t.x,z:t.z+.6})??{x0:t.x-1.15,x1:t.x+1.15,z0:t.z+.1,z1:t.z+1.1};return to(e,n,t)},tree:({k:e,grow:t},n,i,s,a)=>{tl(e,n,i,s,a,0,t.stage>=6)},growth:e=>{no(e,Hh)},pieceAt:ta(Hh),wear:e=>{e.add(e.style.cylinder(.232,.05),e.mat(Gs),e.head,0,.07,0);for(let t=0;t<3;t++)e.add(e.style.ball(.014),e.mat(N.paper),e.head,Math.sin(t*.5-.5)*.235,.07,Math.cos(t*.5-.5)*.235)}},yn="#2a9d8f",dr="#3d6fb6",bn="#e9c46a",Zf="#b08a3c",$n="#f3e3c6",Ho=[yn,"#f3efe4",dr,bn],Ex="#c98a3e",ws=e=>e,Vh=e=>e.boardSpots.reduce((t,n)=>t+n.x,0)/Math.max(1,e.boardSpots.length),sn=(e,t=()=>{})=>({at:e,draw:t}),Ro=e=>{const t=e.lounge.map(n=>n.x);return t.length?[Math.min(...t)-.4,Math.max(...t)+.4]:[e.x0+.3,e.x0+4]},Nc=e=>({x:e.lounge[1]?.x??e.x0+1.8,z:2.95}),zd=e=>{const t=ws(e).patio;return[{x:t.x0+.7,z:t.z0+.7},{x:t.x1-.7,z:t.z0+.7},{x:t.x0+.7,z:t.z1-.7},{x:t.x1-.7,z:t.z1-.7}]};function Wh(e,t,n,i){e.add(e.style.box(.5,.4,.5),e.mat(yn),t,n.x,.2,n.z),e.add(e.style.cylinder(.05,.6),e.mat("#6b4a32"),t,n.x,.7,n.z),e.add(e.style.ball(.42),e.mat(i?"#2f6a2f":"#3f8a3e"),t,n.x,1.15,n.z);for(let s=0;s<5;s++)e.add(e.style.ball(.06),e.mat(N.orange),t,n.x+Math.sin(s*1.3)*.36,1.1+s%3*.12,n.z+Math.cos(s*1.3)*.36)}function Tx(e,t,n,i,s){e.add(e.style.cylinder(.08*s,1.7*s),e.mat("#a0673f"),t,n,.85*s,i);for(let a=0;a<6;a++){const o=e.add(e.style.box(.95*s,.04,.22),e.mat(a%2?"#5fb35a":"#4e9a48"),t,n,1.7*s,i);o.rotation.y=a*Math.PI/3,o.rotation.z=-.3}}const kh={pieces:[sn(e=>e.door),sn(e=>Ue(e).plants[0]??e.door,(e,t,n)=>{e.add(e.style.cylinder(.18,.3),e.mat(yn),t,n.x,.15,n.z);for(let i=0;i<4;i++)e.add(e.style.ball(.13),e.mat(i%2?"#7cc26b":"#5fb35a"),t,n.x+Math.sin(i*1.6)*.1,.38+i%2*.08,n.z+Math.cos(i*1.6)*.1)}),sn(Nc,(e,t,n,i)=>{e.add(e.style.cylinder(.32,.03),e.mat(bn),t,n.x,.43,n.z),e.add(e.style.ball(.1),e.mat("#d8d4cc"),t,n.x,.53,n.z),e.add(e.style.cylinder(.015,.12),e.mat("#d8d4cc"),t,n.x+.1,.57,n.z).rotation.z=-.9;for(let s=0;s<3;s++)e.add(e.style.cylinder(.03,.08),e.style.material(yn,{opacity:.8}),t,n.x-.15+s*.12,.49,n.z+.17);for(const s of zd(i.o).slice(0,1))Wh(e,t,s,i.k.pal.pendants)}),sn(e=>({x:(Ro(e)[0]+Ro(e)[1])/2,z:1.5})),sn(e=>({x:Vh(e),z:.9}),(e,t,n)=>{const i=e.style.pictureZ;e.add(e.style.box(1.9,1.05,.06),e.mat($n),t,n.x,1.05,.03+i),e.add(e.style.cap(.95,.35),e.mat($n),t,n.x,1.5,.03+i).scale.z=.08,e.add(e.style.box(1.66,.82,.02),e.mat("#2f3437"),t,n.x,1.03,.07+i);for(let s=0;s<4;s++)e.add(e.style.box(.5-s*.08,.035,.01),e.mat(N.paper),t,n.x-.4,1.3-s*.15,.085+i)}),sn(e=>({x:Ro(e)[1]-.2,z:.35}),(e,t,n,i)=>{const[s,a]=Ro(i.o),o=e.style.pictureZ,r=Math.min(3,a-s-.4),c=(s+a)/2;e.add(e.style.box(r,.6,.02),e.mat("#f1e6d2"),t,c,1.5,.02+o);for(let l=0;l<4;l++){const d=e.add(e.style.box(.24,.24,.01),e.mat("#2b2118"),t,c-r/2+(l+.5)*(r/4),1.5,.035+o);d.rotation.z=Math.PI/4,e.add(e.style.box(.12,.12,.01),e.mat("#f1e6d2"),t,c-r/2+(l+.5)*(r/4),1.5,.04+o).rotation.z=Math.PI/4}e.add(e.style.cylinder(.14,.3),e.mat(Ex),t,n.x,.15,n.z),e.add(e.style.cylinder(.15,.02),e.mat("#f1e6d2"),t,n.x,.31,n.z)}),sn(e=>({x:Nc(e).x+0,z:Nc(e).z}),(e,t,n)=>{e.add(e.style.cylinder(.2,.04),e.mat("#b5651d"),t,n.x-.12,.47,n.z-.1),e.add(e.style.cap(.17,.95),e.mat("#c98a3e"),t,n.x-.12,.62,n.z-.1).scale.y=1.2}),sn(e=>Ue(e).parasol,(e,t,n)=>{for(const[i,s]of[[-.8,-.6],[.8,-.6],[-.8,.6],[.8,.6]])e.add(e.style.cylinder(.03,1.7),e.mat("#6b4a32"),t,n.x+i,.85,n.z+s);e.add(e.style.box(1.8,.04,1.4),e.mat("#f1e6d2"),t,n.x,1.72,n.z);for(let i=0;i<3;i++)e.add(e.style.box(.3,.045,1.4),e.mat(dr),t,n.x-.6+i*.6,1.73,n.z)}),sn(e=>zd(e)[3]??e.door,(e,t,n,i)=>{for(const s of zd(i.o).slice(1))Wh(e,t,s,i.k.pal.pendants)}),sn(e=>({x:ws(e).patio.x1-1.6,z:ws(e).patio.z1-.7}),(e,t,n)=>{e.add(e.style.cylinder(.32,.3),e.mat(Zf),t,n.x,.15,n.z);for(let i=0;i<16;i++)e.add(e.style.box(.08,.01,.08),e.mat(i%2===Math.floor(i/4)%2?"#2b2118":"#f1e6d2"),t,n.x-.12+i%4*.08,.31,n.z-.12+Math.floor(i/4)*.08)}),sn(e=>({x:ws(e).fx,z:ws(e).fz}),(e,t,n)=>{e.add(e.style.cylinder(.08,.4),e.mat($n),t,n.x,1.2,n.z),e.add(e.style.cylinder(.28,.08),e.mat(yn),t,n.x,1.42,n.z),e.add(e.style.ball(.08),e.mat("#8fd3ff"),t,n.x,1.52,n.z)}),sn(e=>({x:e.x0-1.9,z:e.D*.55}),(e,t,n)=>{e.add(e.style.box(1.2,.7,1),e.mat($n),t,n.x,.35,n.z),e.add(e.style.cap(.5,.5),e.mat("#fbf6ec"),t,n.x,.7,n.z),e.add(e.style.box(.35,.5,.02),e.mat(yn),t,n.x+.61,.25,n.z);for(let i=0;i<3;i++)e.add(e.style.ball(.12+i*.03),e.style.material(N.steam,{opacity:.5}),t,n.x+.1*i,1.35+i*.25,n.z)}),sn(e=>({x:e.x0-1.9,z:e.D+2.4}),(e,t,n,i)=>{e.add(e.style.box(1,.12,2.4),e.mat(yn),t,n.x,.06,n.z);const s=e.add(e.style.box(.8,.02,2.2),e.style.material(i.k.pal.pendants?"#1d3b52":"#8fd3ff",{emissive:i.k.pal.pendants?"#2c5a7a":"#8fd3ff",ei:.2}),t,n.x,.13,n.z);s.castShadow=!1;for(let a=0;a<6;a++)e.add(e.style.box(.1,.03,.1),e.mat(Ho[a%4]??yn),t,n.x+(a%2?.45:-.45),.13,n.z-1+Math.floor(a/2)*1)}),sn(e=>({x:e.x0+e.W+1.2,z:1.2}),(e,t,n,i)=>{Mx(e,t,n.x,n.z,[bn,dr],e.pal.ink);const s=i.o;[[.25,1.4],[.5,1.9],[.75,1.5]].forEach(([a,o])=>{const r=e.add(e.style.cylinder(1.2,o),e.mat(e.pal.pendants?"#5a4a5f":"#b39a8a"),t,s.x0+s.W*a,o/2-.1,-2.6);r.scale.z=.5,e.add(e.style.cap(.55,.4),e.mat(N.paper),t,s.x0+s.W*a,o-.25,-2.6).scale.z=.5})}),sn(e=>({x:e.x0-1.9,z:1.4}),(e,t,n)=>{Nl(e,t,n.x,n.z,(i,s)=>{e.add(e.style.cylinder(.22,.5),i,t,n.x,s+.3,n.z),e.add(e.style.cap(.24,.6),i,t,n.x,s+.6,n.z),e.add(e.style.ball(.06),i,t,n.x,s+.85,n.z)})})],tree:(e,t,n,i,s)=>{Tx(e,t,n,i,s)},frameSpan:e=>({xa:Vh(e)+1.1,xb:e.mainDesk.x-.5,y:1.4,z:.02}),frame:(e,t,n,i,s,a,o)=>{const r=s+e.style.pictureZ;e.add(e.style.box(.28,.24,.02),e.mat(o?N.gold:$n),t,n,i,r),e.add(e.style.cap(.14,.5),e.mat(o?N.gold:$n),t,n,i+.12,r).scale.z=.15,e.add(e.style.box(.2,.17,.01),e.mat(Ho[a%4]??yn),t,n,i,r+.015)},flowers:["#fffaf0","#fbf6ec",bn,"#9b8fe0"]};function jS(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=ws(e.o),{x0:o,W:r,D:c,patio:l}=a,d=s.pendants;t.add(i.box(r,.14,c),i.floor(s.floor,r,c),n,o+r/2,-.05,c/2);const f=l.x1-l.x0,u=l.z1-l.z0;t.add(i.box(f,.03,u),t.mat(d?"#9a968c":"#f3efe4"),n,(l.x0+l.x1)/2,.02,(l.z0+l.z1)/2);const h=Math.max(.8,f/10);for(let M=l.x0+h/2,E=0;M<l.x1;M+=h,E++)for(let A=l.z0+h/2,R=0;A<l.z1;A+=h,R++){const D=Ho[(E+R)%3===1?2:(E+R)%3===2?3:0];t.add(i.box(.22,.01,.22),t.mat(d?Na(D,.7):D),n,M,.04,A).rotation.y=Math.PI/4}t.add(i.box(r+.2,2.1,.2),t.mat(s.wall),n,o+r/2,1.05,-.1),t.add(i.box(.2,1.3,c+.2),t.mat(s.wall),n,o-.1,.65,c/2);for(let M=o+.2,E=0;M<o+r;M+=.4,E++)t.add(i.box(.4,.45,.02),t.mat(Ho[E%4]??yn),n,M,.26,.01);for(let M=.2,E=0;M<c;M+=.4,E++)t.add(i.box(.02,.45,.4),t.mat(Ho[E%4]??yn),n,o+.01,.26,M);t.add(i.box(r,.18,.06),t.mat(d?Na($n,.7):$n),n,o+r/2,1.85,.03);const m=t.mat(d?Na($n,.75):$n),_=1.35,x=M=>{for(const E of M)t.add(i.cylinder(.11,_),m,n,E.x,_/2,E.z),t.add(i.box(.28,.08,.28),m,n,E.x,_,E.z)},p=[];for(let M=l.x0;M<=l.x1+.01;M+=f/Math.max(1,Math.round(f/1.9)))p.push({x:M,z:l.z0-.15});const v=M=>{const E=[];for(let A=l.z0;A<=l.z1+.01;A+=1.9)E.push({x:M,z:A});return E};x([...p,...v(l.x0-.15),...v(l.x1+.15)]),t.add(i.box(f+.4,.14,.2),m,n,(l.x0+l.x1)/2,_+.1,l.z0-.15);for(const M of[l.x0-.15,l.x1+.15])t.add(i.box(.2,.14,u),m,n,M,_+.1,(l.z0+l.z1)/2);const y=i.material(bn,d?{emissive:bn,ei:1.2}:{});for(let M=0;M+1<p.length;M+=2){const E=p[M],A=p[M+1];if(!E||!A)continue;const R=(E.x+A.x)/2;t.add(i.cylinder(.11,.24),y,n,R,1.05,E.z),t.add(i.cap(.13,.5),t.mat(Zf),n,R,1.17,E.z)}const[g,b]=Ro(a);t.add(i.box(b-g,.35,.5),t.mat(dr),n,(g+b)/2,.18,.3);for(let M=0;M<5;M++)t.add(i.box(.5,.36,.1),t.mat([bn,yn,N.orange,"#9b8fe0",bn][M]??bn),n,g+.4+M*(b-g-.8)/4,.5,.08);const S=Nc(a);t.add(i.cylinder(.06,.4),t.mat(Zf),n,S.x,.2,S.z),t.add(i.cylinder(.4,.04),t.mat(bn),n,S.x,.41,S.z);const T=a.door.x;for(const M of[-.55,.55])t.add(i.box(.14,1.6,.14),t.mat(s.wall),n,T+M,.8,c-.05);t.add(i.box(1.25,.2,.16),t.mat(s.wall),n,T,1.6,c-.05),t.add(i.box(.08,1.4,.9),t.mat("#6b3f22"),n,T-.62,.7,c-.55);for(let M=0;M<6;M++)t.add(i.ball(.03),t.mat(bn),n,T-.57,.35+Math.floor(M/2)*.4,c-.8+M%2*.5);hn(t,n,On(Ue(a).doorMat),.03,.03,"#b5651d")}function tw(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=ws(e.o),{fx:o,fz:r}=a,c=s.pendants;t.add(i.cylinder(1.08,.38),t.mat(s.island),n,o,.19,r),t.add(i.cylinder(.95,.04),i.material(c?"#1d3b52":"#8fd3ff",{emissive:c?"#2c5a7a":"#8fd3ff",ei:c?.4:.1}),n,o,.37,r),t.add(i.cylinder(.14,.7),t.mat($n),n,o,.6,r),t.add(i.cylinder(.38,.12),t.mat(s.island),n,o,.98,r),t.add(i.ball(.1),t.mat("#8fd3ff"),n,o,1.1,r);for(let l=0;l<8;l++){const d=l/8*Math.PI*2;t.add(i.ball(.07),t.mat(dr),n,o+Math.sin(d)*1.1,.38,r+Math.cos(d)*1.1)}}const ew={id:"riad",pal:ja({floor:"#d9a36f",wall:"#d98e4f",wallTop:"#c47a3e",desk:"#a0704a",deskTop:"#b8875c",island:yn,islandTop:"#e9f5f2",grass:"#c9b27a",dirt:"#a8764a",terrace:"#e6c9a0",rug:"#f1e6d2"},{desk:"#9a6a48",deskTop:"#b07a52",island:"#1f7a70"}),shell:jS,island:tw,lounge:e=>{Zu(e,(t,n,i)=>{t.add(t.style.cylinder((i.x1-i.x0)/2-.05,.32),t.mat(Ex),n,(i.x0+i.x1)/2,.16,(i.z0+i.z1)/2),t.add(t.style.cylinder(.12,.01),t.mat(bn),n,(i.x0+i.x1)/2,.325,(i.z0+i.z1)/2)})},desk:(e,t,n)=>_r(e,t,n,{w:1.4,d:.78,at:.5}),mainDesk:e=>{const t=e.o.mainDesk,n=eo(e.o,{x:t.x,z:t.z+.6})??{x0:t.x-1.15,x1:t.x+1.15,z0:t.z+.1,z1:t.z+1.1};return to(e,n,t)},tree:({k:e},t,n,i,s)=>{Tx(e,t,n,i,s)},growth:e=>{no(e,kh)},pieceAt:ta(kh),wear:e=>{for(const t of e.legs){const n=t.children[1];n&&(n.material=e.mat(bn),n.scale.z=1.25)}}},In="#d9b98a",Ua="#6b4a32",Oi="#3d6fb6",Cs="#d9a54a",Ax="#fbf8f2",nw="#2f6b4f",iw="#f4f7fa",sw=e=>e;function aw(e,t,n){const{style:i,pal:s}=e,a=n.x0+n.W-1.5,o=Math.max(n.table.z0+1.2,(n.table.z0+n.D)/2);e.add(i.box(2,.02,1.8),e.mat(s.pendants?"#5a6e8a":"#bfd4ea"),t,a-.2,.03,o),e.add(i.box(.35,.8,1.4),e.mat(In),t,a+.85,.4,o),[Oi,Cs,"#2a9d8f","#9b8fe0","#fffaf0"].forEach((r,c)=>e.add(i.box(.25,.26,.08),e.mat(r),t,a+.68,.22+c%2*.36,o-.5+c*.22)),e.add(i.box(.22,.14,.07),e.mat(Oi),t,a+.85,.87,o-.3),e.add(i.box(.08,.14,.07),e.mat(Oi),t,a+.85,.98,o-.2);for(let r=0;r<3;r++)e.add(i.cylinder(.05,.22),e.mat(["#2a9d8f","#e9c46a","#fffaf0"][r]??N.paper),t,a+.85,.91,o+.15+r*.16);e.add(i.box(.75,.35,.7,.12),e.mat("#c9d6e3"),t,a-.4,.2,o),e.add(i.box(.75,.45,.16,.08),e.mat("#c9d6e3"),t,a-.4,.55,o+.3),e.add(i.box(.6,.1,.5),e.mat(Ax),t,a-.4,.42,o-.05),e.add(i.cylinder(.02,1.3),e.mat(N.dark),t,a-1,.65,o+.55),e.add(i.cap(.18,.6),i.material("#fff2d6",s.pendants?{emissive:"#ffd166",ei:.9}:{}),t,a-1,1.35,o+.55)}const Xh=e=>e.boardSpots.reduce((t,n)=>t+n.x,0)/Math.max(1,e.boardSpots.length),Uc=e=>(e.island.x0+e.island.x1)/2,an=(e,t=()=>{})=>({at:e,draw:t}),Oc=e=>{const t=e.lounge.map(n=>n.x);return t.length?[Math.min(...t)-.45,Math.max(...t)+.45]:[e.x0+1,e.x0+4.5]},zx=e=>({x:e.x0+e.W-1.4,z:e.D+3.5});function Rx(e,t,n,i,s,a){const{style:o}=e;if(a%2===0){e.add(o.cylinder(.08,1.6*s),e.mat("#f4f1ea"),t,n,.8*s,i);for(let r=0;r<3;r++)e.add(o.box(.1,.03,.02),e.mat(N.ink),t,n,(.4+r*.4)*s,i+.08);e.add(o.ball(.5*s),e.mat("#a8c96a"),t,n,1.8*s,i).scale.set(.8,1.2,.8);return}e.add(o.cylinder(.08,.4),e.mat("#5c3d2e"),t,n,.2,i);for(let r=0;r<3;r++){const c=(.7-r*.18)*s;e.add(o.cap(c,.9),e.mat(nw),t,n,(.45+r*.42)*s,i).scale.y=1.1,e.add(o.cap(c*.5,.5),e.mat(iw),t,n,(.75+r*.42)*s,i)}}function Cx(e,t,n,i){const{style:s}=e;if(e.add(s.box(1.4,1,1.1),e.mat(Cs),t,n.x,.5,n.z),e.add(s.box(1.6,.12,1.3),e.mat("#5c677d"),t,n.x,1.06,n.z),e.add(s.cylinder(.07,.5),e.mat(N.dark),t,n.x+.4,1.3,n.z-.2),e.add(s.box(.4,.7,.04),e.mat(Ua),t,n.x-.3,.35,n.z-.57),!!i){e.add(s.box(1.4,.06,.6),e.mat(In),t,n.x,.12,n.z-.9),e.add(s.box(.9,.08,.25),e.mat(Ua),t,n.x+.2,.3,n.z-.95);for(let a=0;a<3;a++)e.add(s.ball(.1+a*.03),s.material(N.steam,{opacity:.5}),t,n.x+.4+a*.06,1.65+a*.22,n.z-.2)}}const $h={pieces:[an(e=>e.door),an(e=>Ue(e).plants[0]??e.door,(e,t,n)=>{e.add(e.style.cylinder(.18,.3),e.mat(N.paper),t,n.x,.15,n.z);for(let i=0;i<6;i++){const s=e.add(e.style.box(.45,.03,.12),e.mat(i%2?"#5fb35a":"#4e9a48"),t,n.x,.4,n.z);s.rotation.y=i*Math.PI/3,s.rotation.z=.4}}),an(e=>({x:Uc(e),z:e.island.z0+1.3}),(e,t,n)=>{e.add(e.style.cylinder(.28,.03),e.mat(N.paper),t,n.x,.71,n.z);for(let i=0;i<5;i++)e.add(e.style.ball(.07),e.mat("#c98a3e"),t,n.x+Math.sin(i*1.25)*.15,.76,n.z+Math.cos(i*1.25)*.15).scale.y=.6}),an(e=>({x:(Oc(e)[0]+Oc(e)[1])/2,z:1.5})),an(e=>({x:Xh(e),z:.9}),(e,t,n)=>{const i=e.style.pictureZ;e.add(e.style.box(1.8,.95,.05),e.mat(In),t,n.x,1.05,.02+i),e.add(e.style.box(1.66,.82,.02),e.mat("#2f3a33"),t,n.x,1.05,.05+i);for(let s=0;s<4;s++)e.add(e.style.box(.6-s*.1,.035,.01),e.mat(N.paper),t,n.x-.3,1.3-s*.15,.065+i)}),an(e=>({x:Uc(e),z:e.island.z1-.4}),(e,t,n,i)=>{const[s,a]=Oc(i.o),o=e.style.pictureZ,r=(s+a)/2+.3;[Cs,Oi,"#2a9d8f","#f39a4c","#9b8fe0"].forEach((l,d)=>e.add(e.style.box(.42,.7,.03),e.mat(l),t,r-.84+d*.42,1.25,.03+o)),e.add(e.style.box(.42,.12,.34),e.mat(Ua),t,n.x,.75,n.z),e.add(e.style.cylinder(.13,.015),e.mat(N.ink),t,n.x,.82,n.z)}),an(e=>({x:Uc(e),z:e.island.z0+2.1}),(e,t,n)=>{e.add(e.style.cylinder(.14,.08),e.mat(N.paper),t,n.x,.73,n.z);for(let i=0;i<5;i++)e.add(e.style.ball(.04),e.mat("#4b3f7a"),t,n.x+Math.sin(i*1.3)*.07,.79,n.z+Math.cos(i*1.3)*.07);for(const i of[-.3,.3])e.add(e.style.cylinder(.05,.09),e.mat(N.paper),t,n.x,.74,n.z+i)}),an(e=>({x:e.x0+e.W-3.4,z:e.D+2}),(e,t,n,i)=>{const s=i.k.pal.pendants;e.add(e.style.cylinder(.4,.08),e.mat("#8e9399"),t,n.x,.04,n.z);for(let a=0;a<3;a++)e.add(e.style.cylinder(.05,.5),e.mat(Ua),t,n.x,.12,n.z).rotation.set(Math.PI/2,a*Math.PI/3,0);e.add(e.style.cap(.18,.8),e.style.material(N.orange,{emissive:N.orange,ei:s?1.4:.5}),t,n.x,.22,n.z);for(const a of[-.85,.85]){const o=e.add(e.style.cylinder(.12,1.1),e.mat("#a0673f"),t,n.x,.12,n.z+a);o.rotation.z=Math.PI/2}}),an(e=>Ue(e).trees[1]??e.door),an(e=>({x:e.x0+e.W+1,z:e.D*.6}),(e,t,n)=>{e.add(e.style.box(.12,.34,.12),e.mat(In),t,n.x,.17,n.z),e.add(e.style.box(.14,.05,.14),e.mat(Cs),t,n.x,.36,n.z);for(const i of[-.9,-.45,.45,.9])e.add(e.style.box(.08,.18,.08),e.mat(In),t,n.x-.4,.09,n.z+i),e.add(e.style.box(.08,.18,.08),e.mat(In),t,n.x+.4,.09,n.z+i)}),an(e=>({x:e.x0-1.9,z:e.D*.55}),(e,t,n,i)=>{e.add(e.style.cylinder(.65,.6),e.mat("#a0673f"),t,n.x,.3,n.z),e.add(e.style.cylinder(.56,.03),e.style.material(i.k.pal.pendants?"#2c5a7a":"#8fd3ff",{emissive:"#8fd3ff",ei:i.k.pal.pendants?.5:.1}),t,n.x,.58,n.z);for(let s=0;s<3;s++)e.add(e.style.ball(.12+s*.04),e.style.material(N.steam,{opacity:.45}),t,n.x+.12*s-.1,.85+s*.25,n.z)}),an(zx,(e,t,n)=>{Cx(e,t,n,!0)}),an(e=>({x:e.x0-1.9,z:e.D+2.4}),(e,t,n,i)=>{Ju(e,t,n.x,n.z,1.2,.9,i.k.pal.pendants),e.add(e.style.box(.4,.06,1.2),e.mat(In),t,n.x+.6,.08,n.z-.2);for(const s of[-.7,.3])e.add(e.style.cylinder(.04,.3),e.mat(Ua),t,n.x+.6,0,n.z+s)}),an(e=>({x:e.x0+e.W+1.2,z:1.2}),(e,t,n)=>{e.add(e.style.cylinder(.05,2.8),e.mat(In),t,n.x,1.4,n.z);const i=e.add(e.style.cylinder(.04,1.4),e.mat(In),t,n.x,2.2,n.z);i.rotation.z=Math.PI/2;for(const s of[-.6,.6]){const a=e.add(e.style.cylinder(.22,.06),e.mat("#5fb35a"),t,n.x+s,1.9,n.z);a.rotation.x=Math.PI/2}for(let s=0;s<8;s++)e.add(e.style.ball(.07),e.mat(["#ffd166","#fffaf0","#9b8fe0","#6cb4ee"][s%4]??N.paper),t,n.x,.5+s*.28,n.z+.06)}),an(e=>({x:e.x0-1.9,z:1.4}),(e,t,n)=>{Nl(e,t,n.x,n.z,(i,s)=>{e.add(e.style.box(.5,.26,.18),i,t,n.x,s+.42,n.z),e.add(e.style.box(.18,.34,.16),i,t,n.x+.22,s+.68,n.z);for(const a of[-.18,.18])e.add(e.style.box(.08,.24,.14),i,t,n.x+a,s+.17,n.z)})})],tree:(e,t,n,i,s,a)=>{Rx(e,t,n,i,s,a)},frameSpan:e=>({xa:Xh(e)+1.1,xb:e.mainDesk.x-.5,y:1.45,z:.02}),frame:vx("#ecd2a6",[Oi,Cs,"#2a9d8f","#9b8fe0","#a8c96a"]),flowers:["#fffaf0","#ffd166","#9b8fe0","#6cb4ee"]};function ow(e){const{k:t,root:n}=e,{style:i,pal:s}=t,a=sw(e.o),{x0:o,W:r,D:c,table:l}=a,d=s.pendants;t.add(i.box(r,.14,c),i.floor(s.floor,r,c),n,o+r/2,-.05,c/2),t.add(i.box(r+.2,1.9,.2),t.mat(s.wall),n,o+r/2,.95,-.1),t.add(i.box(.2,1.3,c+.2),t.mat(s.wall),n,o-.1,.65,c/2),t.add(i.box(r,.5,.05),t.mat(s.desk),n,o+r/2,.25,.02),t.add(i.box(.05,.5,c),t.mat(s.desk),n,o+.02,.25,c/2);const f=i.material(d?"#2c4a6b":"#dff1fb",d?{emissive:"#3c5a8a",ei:.5}:{});for(let p=a.island.z1+.4;p<c-1.2;p+=2.4)t.add(i.box(.06,.9,1.4),t.mat(Ua),n,o+.01,.85,p+.7),t.add(i.box(.07,.78,1.28),f,n,o+.02,.85,p+.7);const u=(l.z0+l.z1)/2,h=l.z1-l.z0;t.add(i.box(l.x1-l.x0-.1,.5,h-.1,.06),t.mat(s.desk),n,0,.25,u),t.add(i.box(l.x1-l.x0,.06,h),t.mat(s.deskTop),n,0,.52,u),t.add(i.box(.4,.01,h-.2),t.mat(d?"#9aa4ad":"#dfe7ee"),n,0,.555,u);const m=i.material("#ffd166",d?{emissive:"#ffd166",ei:2}:{});for(let p=l.z0+.8;p<l.z1;p+=1.6)t.add(i.cylinder(.04,.16),t.mat(N.paper),n,0,.64,p),t.add(i.ball(.035),m,n,0,.75,p);const _=t.mat(d?"#d8d2c6":N.paper),x=i.material("#ffd166",d?{emissive:"#ffd166",ei:.8}:{});for(let p=l.z0+1.2;p<l.z1;p+=2.4)t.add(i.cylinder(.005,.6),t.mat(N.dark),n,0,2.1,p),t.add(i.cap(.3,.5),_,n,0,1.75,p),t.add(i.ball(.08),x,n,0,1.68,p);for(const[p,v]of[[0,Oi],[.25,Cs]])t.add(i.box(.1,1.7,.04),t.mat(v),n,o+r-.35-p,.85,.15).rotation.z=.08;aw(t,n,a),e.grow.stage<11&&Cx(t,n,zx(a),!1),hn(t,n,On(Ue(a).doorMat),.03,.03,"#a9b8c8")}function rw(e){const{k:t,root:n,o:i}=e,{style:s,pal:a}=t,o=i.island,r=Uc(i),c=(o.z0+o.z1)/2,l=o.z1-o.z0;t.add(s.box(o.x1-o.x0-.1,.62,l-.1,.06),t.mat(a.island),n,r,.31,c),t.add(s.box(o.x1-o.x0+.05,.07,l),t.mat(a.islandTop),n,r,.66,c),t.add(s.cylinder(.13,.3),t.mat(N.dark),n,r,.84,o.z0+.4),t.add(s.cylinder(.02,.14),t.mat(N.dark),n,r+.15,.88,o.z0+.4).rotation.z=-.8,t.add(s.cylinder(.07,.18),s.material("#cfe8c3",{opacity:.85}),n,r,.78,o.z0+.8)}function cw(e){const{k:t,root:n,o:i}=e,{style:s,pal:a}=t,o=a.pendants,r=i.x0+.55;t.add(s.cylinder(.35,.8),t.mat(N.dark),n,r,.4,.55),t.add(s.cylinder(.08,1.2),t.mat(N.dark),n,r,1.4,.55),t.add(s.box(.3,.22,.03),s.material(o?"#ff9a3d":"#5c3d2e",o?{emissive:"#ff9a3d",ei:1.5}:{}),n,r,.38,.9);for(let l=0;l<4;l++)t.add(s.cylinder(.06,.5),t.mat("#a0673f"),n,r-.2+l%2*.13,.06+Math.floor(l/2)*.12,1.5).rotation.x=Math.PI/2;const c=e.stage(3);if(c){const[l,d]=Oc(i);t.add(s.box(Math.min(2.2,d-l),.02,1),t.mat(Oi),c,(l+d)/2,.035,3);for(let f=0;f<4;f++)t.add(s.box(Math.min(2.2,d-l),.025,.06),t.mat(N.paper),c,(l+d)/2,.04,2.65+f*.22)}Zu(e,(l,d,f)=>{l.add(l.style.ball(.4),l.mat(o?"#c9c4bb":Ax),d,(f.x0+f.x1)/2,.05,(f.z0+f.z1)/2).scale.set(1,.18,.9)})}function lw(e,t,n){const{k:i,root:s}=e,a=ze(n),o=new Xt;o.position.set(t.x,0,t.z),o.rotation.y=t.face,s.add(o);const r=Ks(i,o,0,.47),c=Js(i,o,.5,.85);Qs(i,o,0,-.05,Qe[(a>>5)%Qe.length]??In,0),a%3===0&&i.add(i.style.cylinder(.05,.1),i.mat(N.paper),o,-.45,.6,.75);const l=_x(t,.5);return{screen:r,lamp:c,top:{x:l.x,y:.55,z:l.z}}}const dw={id:"nordic",pal:ja({floor:"#ead6b4",wall:"#f7f5f0",wallTop:"#d9c7a6",desk:In,deskTop:"#ecd2a6",island:"#f7f5f0",islandTop:In,grass:"#eef3f7",dirt:"#7a5a3c",terrace:"#e2d2b4",rug:Oi},{grass:"#9fb0c4",wall:"#8c8a84"}),shell:ow,island:rw,lounge:cw,desk:lw,mainDesk:e=>{const t=e.o.mainDesk,n=eo(e.o,{x:t.x,z:t.z+.6})??{x0:t.x-1.15,x1:t.x+1.15,z0:t.z+.1,z1:t.z+1.1};return to(e,n,t)},tree:({k:e},t,n,i,s)=>{Rx(e,t,n,i,s,1)},growth:e=>{no(e,$h)},pieceAt:ta($h),wear:e=>{const t=ze(e.name);[Oi,N.paper,Cs].slice(0,2+t%2).forEach((i,s)=>e.add(e.style.cylinder(.19,.05),e.mat(i),e.body,0,.74+s*.05,0))}},Gt=(e,t,n=.62)=>t?`#${new ee(e).multiplyScalar(n).getHexString()}`:e;function Ci(e,t,n,i,s,a){if(typeof document>"u")return e.mat(t);const o=document.createElement("canvas");o.width=o.height=64;const r=o.getContext("2d");if(!r)return e.mat(t);r.fillStyle=t,r.fillRect(0,0,64,64),a(r,64);const c=new Gm(o);return c.colorSpace=ln,c.wrapS=c.wrapT=tr,c.repeat.set(n/s,i/s),new lr({color:16777215,map:c,roughness:.95,metalness:0})}function vr(e,t,n,i){e.add(e.style.box(n.W,.14,n.D),i,t,n.x0+n.W/2,-.05,n.D/2)}function _i(e){const t=e.x0+e.W,n=e.lounge.map(l=>l.x),i=n.length?(Math.min(...n)+Math.max(...n))/2:e.x0+2,s=e.terrace.map(l=>l.x),a=s.length?Math.min(...s)<e.x0+e.W/2:!0,o=a?t-1.6:e.x0+1.6,r=e.island,c=e.boardSpots.length?e.boardSpots.reduce((l,d)=>l+d.x,0)/e.boardSpots.length:e.x0+e.W/2;return[e.door,{x:a?e.x0+.3:t-.3,z:e.D-.25},{x:(r.x0+r.x1)/2,z:(r.z0+r.z1)/2},{x:i,z:1.6},{x:c,z:.9},{x:i,z:.6},{x:(r.x0+r.x1)/2,z:r.z0+.3},{x:a?Math.max(...s)+1.7:Math.min(...s)-1.7,z:e.D+2.3},{x:e.x0-.9,z:e.D*.45},{x:o,z:e.D+2.6},{x:e.x0-1.9,z:e.D*.55},{x:o+(a?-1.6:1.6),z:e.D+2.6},{x:e.x0-1.9,z:e.D+2.2},{x:t+1.2,z:1.2},{x:e.x0-1.9,z:1.4}]}function xi(e){return[{x:e.x0-.7,z:1},{x:e.x0-.7,z:e.D*.45},{x:e.x0-.7,z:e.D*.85},{x:e.x0+e.W*.3,z:-.85},{x:e.x0+e.W*.75,z:-.85}]}function Mr(e,t){return{...e,...t}}function En(e,t,n,i,s,a,o,r){return e.add(new Tl(n,i,10),typeof s=="string"?e.mat(s):s,t,a,o,r)}function ju(e,t,n=.9){return e.pal.pendants?e.style.material(t,{emissive:t,ei:n}):e.mat(t)}function Hs(e,t,n,i,s,a=0){return e.add(e.style.box(n.x1-n.x0,i,n.z1-n.z0),e.mat(s),t,(n.x0+n.x1)/2,a+i/2,(n.z0+n.z1)/2)}function yr(e,t,n,i={}){const{k:s,root:a}=e,{style:o,pal:r}=s,c=ze(n),l=new Xt;l.position.set(t.x,0,t.z),l.rotation.y=t.face,a.add(l);const d=1.3,f=.72;i.mat&&s.add(o.box(1.5,.02,1.5),s.mat(i.mat),l,0,.03,.3),s.add(o.box(d-.1,.5,f-.08,.12),s.mat(r.desk),l,0,.25,.5),s.add(o.box(d,.06,f,.03),s.mat(r.deskTop),l,0,.52,.5),s.add(o.box(.22,.08,.02),s.mat(Qe[c%Qe.length]??r.desk),l,-d/3,.4,.5+f/2-.03);const u=Ks(s,l,0,.47),h=Js(s,l,d/2-.18,.5+f/2-.17);return Qs(s,a,t.x-Math.sin(t.face)*.05,t.z-Math.cos(t.face)*.05,i.chair??Qe[(c>>5)%Qe.length]??r.desk,t.face),i.thing?.(s,l,c),{screen:u,lamp:h,top:{x:t.x+Math.sin(t.face)*.5,y:.55,z:t.z+Math.cos(t.face)*.5}}}function br(e,t,n){const{k:i,root:s,o:a}=e,{style:o,pal:r}=i,c=a.mainDesk,l=$u(a.furniture,c)??{x0:c.x-1.15,x1:c.x+1.15,z0:c.z+.1,z1:c.z+1.1},d=(l.x0+l.x1)/2,f=(l.z0+l.z1)/2,u=new Xt;u.position.set(d,0,f),s.add(u);const h=l.x1-l.x0,m=l.z1-l.z0;i.add(o.box(h-.1,.5,m-.1),i.mat(n),u,0,.25,0),i.add(o.box(h,.06,m),i.mat(t),u,0,.52,0);const _=Ks(i,u,c.x-d+.2,-.03),x=Js(i,u,h/2-.2,m/2-.2);return i.add(o.box(.7,.06,.5),i.mat(r.wallTop),u,-h/2+.5,.58,0),i.add(o.box(.34,.24,.26),i.mat(N.crate),u,-h/2+.5,.73,0),Qs(i,s,c.x,c.z-.05,N.dark,c.face),js(i,s,c.x,1.25,.02+o.pictureZ,r.neon,.06,o.material(r.neon,{flat:!0})),{screen:_,lamp:x,top:{x:d,y:.55,z:f}}}const fw=[0,1,1,1,2,2,2,4,4,4,8],uw=(e,t)=>e[Math.min(t,e.length-1)]??0,hw=e=>e<2?3:e<4?5:8;function Sr(e,t){const{o:n,grow:i}=e;n.furniture.filter(a=>a.of!==void 0&&n.lounge.some(o=>o.x===a.of?.x&&o.z===a.of.z)).forEach((a,o)=>{if(o>=yl(i.stage))return;const r=e.stage(hw(o));r&&t(r,a,o)})}function wr(e,t,n){const{k:i,o:s,grow:a}=e,o=e.stage(1);if(!o)return;const r=s.terrace.map(m=>m.x),c=s.terrace.map(m=>m.z),l=Math.min(...r)-.8,d=Math.max(...r)+.8,f=s.D+.15,u=Math.max(...c)+.8;i.add(i.style.box(d-l,.08,u-f),i.mat(t),o,(l+d)/2,0,(f+u)/2),s.furniture.filter(m=>m.of!==void 0&&s.terrace.some(_=>_.x===m.of?.x&&_.z===m.of.z)).forEach((m,_)=>{if(_>=uw(fw,a.stage))return;const x=[1,4,7,7,10,10,10,10][_]??0;Dl(i,e.stage(x)??o,m,n[_%n.length]??N.paper)})}function Er(e,t,n){const{k:i,grow:s}=e,a=e.stage(0);if(!a||s.frames===0)return;const o=.36,r=Math.max(1,Math.floor((t.xb-t.xa)/o));for(let c=0;c<s.frames;c++){const l=t.y-Math.floor(c/r)*.32;if(l<.6)break;n(i,a,t.xa+o/2+c%r*o,l,.02+i.style.pictureZ,c,s.golden)}}function Tr(e,t,n){const{k:i,o:s,grow:a}=e,o=e.stage(0);if(o){for(let r=1;r<=14;r++){const c=e.stage(r),l=t[r];c&&l&&l(i,c,n(s,r),e)}Ll(i,o,s,a),a.building&&a.stage<14&&Il(i,o,n(s,a.stage+1))}}function Ar(e,t,n,i){e.add(e.style.box(.7,.4,.7),e.mat("#d8d2c6"),t,n.x,.2,n.z),i(e.style.material(N.gold,{emissive:N.gold,ei:.15}),.4)}function t0(e,t,n,i,s,a,o=.5){e.add(e.style.cylinder(.18,.32),e.mat(s),t,n,.16,i);for(let r=0;r<4;r++)e.add(e.style.ball(.14),e.mat(a),t,n+Math.cos(r*1.6)*.1,.4+r/4*o,i+Math.sin(r*1.6)*.08).scale.set(.8,1.3,.8)}function pw(e,t,n,i,s=2.3){const a=new Xt;a.position.set(n.x,s,n.z),t.add(a),i.forEach((o,r)=>{e.add(e.style.ball(.6-r*.001),e.mat(o),a,0,0,0).scale.set(1-r*.28,1.05,1-r*.28)}),e.add(e.style.box(.35,.25,.35),e.mat("#c49a6c"),a,0,-1,0);for(const o of[-.15,.15])e.add(e.style.cylinder(.01,.5),e.mat(N.ink),a,o,-.65,0);return a}function Fc(e,t,n,i,s,a=2.6){const o=e.add(e.style.box(.5,.5,.02),e.mat(i),t,n.x,a,n.z);o.rotation.z=Math.PI/4;for(let c=0;c<4;c++)e.add(e.style.box(.1,.06,.02),e.mat(c%2?s:i),t,n.x+.05*c,a-.42-c*.14,n.z);const r=e.add(e.style.cylinder(.006,a),e.mat(N.ink),t,n.x+.4,a/2,n.z+.3);r.rotation.z=.25}function Ul(e,t,n,i,s){e.add(e.style.box(.9,.36,.9),e.mat(i),t,n.x,.18,n.z),e.add(e.style.box(.8,.03,.8),e.mat(s),t,n.x,.37,n.z)}function e0(e,t,n,i,s,a=1){const o=e.add(e.style.cylinder(a,.04),e.style.material(i,{emissive:i,ei:.1}),t,n.x,.02,n.z);o.scale.z=.7;const r=e.add(e.style.cylinder(a+.1,.03),e.mat(s),t,n.x,0,n.z);r.scale.z=.72}const mw=["#2f5fa7","#7b5fc0","#f39a4c","#2a9d8f","#e9c46a"],Ps=["#f28c28","#e9c46a","#2a9d8f","#3d6fb6","#7b5fc0","#7cc26b"],qh="#2f5fa7",ci="#3d6fb6",n0="#6b9f7a",Vo="#4f8a5b",xw="#9b8fe0",Un="#f28c28",gw=e=>Mr(e?mi:pi,{floor:Gt("#df9a6a",e,.7),wall:Gt("#f2b53a",e),wallTop:Gt("#d99a2a",e),desk:Gt("#a0673f",e,.85),deskTop:Gt("#c98a5a",e,.85),island:Gt("#6b4a32",e,.85),islandTop:Gt("#f3efe4",e,.8),grass:Gt("#d9c08a",e),dirt:Gt("#a8764a",e),terrace:Gt("#e6c9a0",e),plant:n0}),_w=e=>e.o;function vw(e){const{k:t,root:n}=e,i=_w(e),{x0:s,W:a,D:o}=i,r=t.pal.pendants;vr(t,n,i,Ci(t,t.pal.floor,a,o,.8,(f,u)=>{f.fillStyle=Gt("#c47a48",r,.7),f.fillRect(0,0,u,3),f.fillRect(0,0,3,u),f.fillStyle=Gt("#e3a070",r,.7),f.fillRect(12,12,40,40)})),t.add(t.style.box(a+.2,1.7,.2),t.mat(t.pal.wall),n,s+a/2,.85,-.1),t.add(t.style.box(.2,1.1,o+.2),t.mat(Gt(qh,r)),n,s-.1,.55,o/2);for(const f of i.slabs){t.add(t.style.box(f.w,1.2,.22),t.mat(Gt(mw[f.c]??qh,r,.75)),n,f.x,.6,f.z);for(let u=0;u<5;u++)t.add(t.style.box(.3,.16,.02),t.mat(u%2?"#fffaf0":ci),n,f.x-1.6+u*.8,.95,f.z+.12)}for(const f of[4.25,i.island.z0-.35]){const u=t.add(t.style.cylinder(.006,a-.6),t.mat(N.ink),n,s+a/2,2,f);u.rotation.z=Math.PI/2;for(let h=s+.6,m=0;h<s+a-.5;h+=.42,m++)t.add(t.style.box(.28,.3,.01),t.mat(Ps[m%Ps.length]??Un),n,h,1.82-Math.sin((h-s)/a*Math.PI)*.12,f)}const c=i.trough;Hs(t,n,c,.45,Gt("#7b5fc0",r)),t.add(t.style.box(c.x1-c.x0-.15,.02,c.z1-c.z0-.15),t.style.material("#8fd3ff",{emissive:"#8fd3ff",ei:r?.3:.1}),n,(c.x0+c.x1)/2,.46,(c.z0+c.z1)/2),t.add(t.style.box(.3,1.4,.7),t.mat(Gt("#f39a4c",r)),n,c.x1+.1,.7,(c.z0+c.z1)/2),t.add(t.style.box(.5,.08,.08),t.mat("#6b4a32"),n,c.x1-.2,1.2,(c.z0+c.z1)/2),t.add(t.style.box(.06,.7,.06),t.style.material("#8fd3ff",{opacity:.7}),n,c.x1-.42,.82,(c.z0+c.z1)/2);const l=(c.z0+c.z1)/2;t.add(t.style.ball(.12),t.mat("#7b5fc0"),n,c.x0+.3,.6,l).scale.set(1.4,.9,1),t.add(t.style.ball(.07),t.mat("#e9c46a"),n,c.x0+.45,.72,l);for(const f of i.slabs)Px(t,n,f.x+f.w/2+.3,f.z-.25);for(let f=0;f<4;f++)t.add(t.style.box(.25,.02,.5),t.mat(Ps[f]??Un),n,i.door.x-.38+f*.25,.03,o-.2)}function Px(e,t,n,i){e.add(e.style.cylinder(.17,.34),e.mat("#f3efe4"),t,n,.17,i),e.add(e.style.cylinder(.175,.06),e.mat(ci),t,n,.28,i);for(let s=0;s<6;s++)En(e,t,.05,.5,n0,n+Math.sin(s)*.07,.55,i+Math.cos(s)*.07).rotation.set(Math.cos(s)*.6,0,-Math.sin(s)*.6)}function Mw(e){const{k:t,root:n,o:i}=e,s=i.island;Hs(t,n,{...s,x0:s.x0+.05,x1:s.x1-.05,z0:s.z0+.05,z1:s.z1-.05},.5,t.pal.island),Hs(t,n,s,.06,t.pal.islandTop,.5);for(let a=s.x0+.15;a<s.x1-.1;a+=.3)for(const o of[s.z0+.04,s.z1-.04])t.add(t.style.box(.2,.02,.06),t.mat(ci),n,a,.57,o);for(const a of i.islandSpots)t.add(t.style.box(.36,.3,.36),t.mat("#c98a5a"),n,a.x,.15,a.z+(a.face===0?-.1:.1))}function yw(e){const{k:t}=e;Sr(e,(n,i,s)=>{const a=(i.x0+i.x1)/2,o=(i.z0+i.z1)/2;if(s<4){t.add(t.style.cylinder(.28,.32),t.mat("#c98a3e"),n,a,.16,o),t.add(t.style.cylinder(.3,.06),t.mat("#8a5a3c"),n,a,.34,o),t.add(t.style.box(.56,.4,.08),t.mat("#a0673f"),n,a,.55,o-.26);return}for(const c of[-.45,.45])t.add(t.style.cylinder(.05,1.2),t.mat("#6b4a32"),n,a,.6,o+c);const r=s%2?["#2a9d8f","#7b5fc0","#e9c46a"]:[Un,ci,"#e9c46a"];for(let c=0;c<7;c++){const l=c/6,d=t.add(t.style.box(.5,.04,.14),t.mat(r[c%3]??Un),n,a,.75-Math.sin(l*Math.PI)*.35,o-.4+l*.8);d.rotation.x=-Math.cos(l*Math.PI)*.5}})}function Kf(e,t,n,i,s){const a=new Xt;a.position.set(n,0,i),a.scale.setScalar(s),t.add(a);const o=ze(`${n.toFixed(1)}:${i.toFixed(1)}`)%3;if(o===0){e.add(e.style.capsule(.16,1.3),e.mat(Vo),a,0,.8,0);for(const r of[-1,1]){e.add(e.style.capsule(.09,.35),e.mat(Vo),a,r*.3,1.05+r*.1,0);const c=e.add(e.style.capsule(.09,.15),e.mat(Vo),a,r*.17,.82+r*.1,0);c.rotation.z=Math.PI/2}}else if(o===1)for(let r=0;r<8;r++)En(e,a,.07,.7,n0,Math.sin(r)*.1,.32,Math.cos(r)*.1).rotation.set(Math.cos(r)*.7,0,-Math.sin(r)*.7);else e.add(e.style.cylinder(.1,1.1),e.mat("#6b4a32"),a,0,.55,0),e.add(e.style.ball(.65),e.mat(xw),a,0,1.45,0).scale.y=.75}function bw(e,t,n,i){e.add(e.style.cylinder(.25,.03),e.mat("#fffaf0"),t,n,.58,i);for(let s=0;s<4;s++)e.add(e.style.ball(.07),e.mat(s%2?"#e9c46a":"#c98a3e"),t,n+Math.sin(s*1.6)*.12,.63,i+Math.cos(s*1.6)*.12).scale.y=.6}const Sw={1:(e,t,n)=>{e.add(e.style.cylinder(.17,.3),e.mat("#f3efe4"),t,n.x,.15,n.z),e.add(e.style.capsule(.1,.35),e.mat(Vo),t,n.x,.55,n.z),e.add(e.style.capsule(.06,.12),e.mat(Vo),t,n.x+.12,.55,n.z)},2:(e,t,n,i)=>{bw(e,t,n.x,n.z);const s=xi(i.o)[0];s&&Kf(e,t,s.x,s.z,.8+i.grow.garden*.06)},3:()=>{},4:(e,t,n)=>{const i=.04+e.style.pictureZ;e.add(e.style.box(1.7,.95,.05),e.mat("#e9c46a"),t,n.x,1.05,i),e.add(e.style.box(1.55,.8,.02),e.mat("#2b3a2f"),t,n.x,1.05,i+.03);const s=Fs(ze("pizarra"));for(let a=0;a<4;a++)e.add(e.style.box(.4+s()*.6,.04,.01),e.mat("#fffaf0"),t,n.x-.3+s()*.2,1.3-a*.16,i+.05)},5:(e,t,n)=>{const i=.02+e.style.pictureZ;["#2a9d8f",Un,"#7b5fc0","#e9c46a",ci].forEach((l,d)=>e.add(e.style.box(.95,.5+d%2*.2,.02),e.mat(l),t,n.x-1.9+d*.95,1.15,i));const a=e.add(e.style.cylinder(.25,.02),e.mat("#e9c46a"),t,n.x,1.3,i+.02);a.rotation.x=Math.PI/2;const o=n.x+2.4;e.add(e.style.ball(.2),e.mat("#c98a3e"),t,o,.3,.25).scale.set(1,1.2,.4);const c=e.add(e.style.box(.07,.6,.04),e.mat("#6b4a32"),t,o,.75,.22);c.rotation.x=-.15},6:(e,t,n,i)=>{e.add(e.style.cylinder(.16,.24),e.mat("#a8764a"),t,n.x+1.2,.68,n.z+.15),e.add(e.style.cylinder(.05,.03),e.mat("#6b4a32"),t,n.x+1.2,.82,n.z+.15);const s=Fs(ze(`cempasuchil${i.o.W}`));for(let a=0;a<12;a++)e.add(e.style.ball(.09),e.mat(a%3?Un:"#e9c46a"),t,i.o.x0-.3-s()*.5,.08,s()*i.o.D)},7:(e,t,n)=>{for(const[i,s]of[[-.7,-.7],[.7,-.7],[-.7,.7],[.7,.7]])e.add(e.style.cylinder(.05,1.7),e.mat("#8a5a3c"),t,n.x+i,.85,n.z+s);En(e,t,1.25,.7,"#d9b86a",n.x,2,n.z)},8:(e,t,n,i)=>{for(const s of xi(i.o).slice(1))Kf(e,t,s.x,s.z,.8+i.grow.garden*.06)},9:(e,t,n)=>{Ul(e,t,n,"#8a5a3c","#fffaf0");for(let i=0;i<9;i++)e.add(e.style.box(.18,.01,.22),e.mat(Ps[i%Ps.length]??Un),t,n.x-.25+i%3*.25,.39,n.z-.27+Math.floor(i/3)*.27)},10:(e,t,n)=>{e.add(e.style.cylinder(.75,.35),e.mat("#fffaf0"),t,n.x,.17,n.z),e.add(e.style.cylinder(.77,.08),e.mat(ci),t,n.x,.3,n.z),e.add(e.style.cylinder(.62,.04),e.style.material("#8fd3ff",{emissive:"#8fd3ff",ei:.15}),t,n.x,.34,n.z),e.add(e.style.cylinder(.12,.6),e.mat(ci),t,n.x,.6,n.z),e.add(e.style.ball(.14),e.mat("#8fd3ff"),t,n.x,.95,n.z)},11:(e,t,n)=>{Hs(e,t,{x0:n.x-.6,x1:n.x+.6,z0:n.z-.35,z1:n.z+.35},.25,"#2a9d8f",.5),e.add(e.style.box(1.1,.02,.6),e.mat("#7cc26b"),t,n.x,.76,n.z);for(const i of[-.5,.5])for(const s of[-.28,.28])e.add(e.style.box(.08,.5,.08),e.mat("#6b4a32"),t,n.x+i,.25,n.z+s);for(let i=0;i<4;i++){const s=e.add(e.style.cylinder(.015,.9),e.mat(N.metal),t,n.x-.36+i*.24,.82,n.z);s.rotation.x=Math.PI/2,e.add(e.style.box(.05,.12,.05),e.mat(i%2?ci:Un),t,n.x-.36+i*.24,.8,n.z)}},12:(e,t,n)=>{e0(e,t,n,"#2ec4b6","#b39a72",1.1);for(let i=0;i<5;i++)e.add(e.style.ball(.2),e.mat("#b39a72"),t,n.x+Math.cos(i*1.3)*1.1,.08,n.z+Math.sin(i*1.3)*.78)},13:(e,t,n)=>{const i=pw(e,t,n,["#7b5fc0",Un,"#2a9d8f"]);e.add(e.style.ball(.12),e.mat("#e9c46a"),i,0,.1,.6);for(const s of[-1,1])En(e,i,.06,.25,"#2a9d8f",s*.25,.6,.3)},14:(e,t,n)=>{Ar(e,t,n,(i,s)=>{e.add(e.style.ball(.22),i,t,n.x,s+.3,n.z).scale.set(1.5,.9,.8),e.add(e.style.ball(.13),i,t,n.x+.33,s+.5,n.z);for(const r of[-1,1])En(e,t,.04,.18,i,n.x+.36,s+.68,n.z+r*.06);for(const r of[-.2,.2])e.add(e.style.box(.06,.2,.06),i,t,n.x+r,s+.1,n.z);const o=En(e,t,.05,.35,i,n.x-.42,s+.45,n.z);o.rotation.z=.8})}};function ww(e,t,n,i,s,a,o){e.add(e.style.box(.28,.24,.02),e.mat(o?N.gold:N.metal),t,n,i,s),e.add(e.style.box(.2,.16,.01),e.mat(Ps[a%Ps.length]??Un),t,n,i,s+.015),o&&e.add(e.style.box(.08,.06,.02),e.mat(N.gold),t,n,i+.15,s)}function Ew(e){wr(e,Tw(e).pal.terrace,[ci,"#fffaf0",Un]),Tr(e,Sw,Lx);const t=e.o,n=_i(t)[4]?.x??t.x0+t.W/2;Er(e,{xa:n+1.1,xb:t.mainDesk.x-.6,y:1.45},ww)}const Tw=e=>e.k,Lx=(e,t)=>_i(e)[Math.min(t,14)]??e.door;function Aw(e){const t=new Xt;t.position.set(0,.55,0),t.rotation.z=.7,e.body.add(t),[Un,ci,"#e9c46a","#2a9d8f"].forEach((n,i)=>{e.add(new mr(.235,.02,6,20),e.mat(n),t,0,0,-.03+i*.03).scale.set(1,1.15,.8)})}const zw={id:"patio",pal:gw,shell:vw,island:Mw,lounge:yw,desk:(e,t,n)=>yr(e,t,n,{thing:(i,s,a)=>{a%3===0&&Px(i,s,.45,.35)}}),mainDesk:e=>br(e,"#c98a5a","#6b4a32"),tree:({k:e},t,n,i,s)=>{Kf(e,t,n,i,s)},growth:Ew,pieceAt:Lx,wear:Aw},el="#3d6fb6",Je="#f28c28",rn="#e9c46a",Fn="#2a9d8f",Es="#f1dcae",i0="#4f8a3e",Ix=[Je,Fn,"#7b5fc0",rn],Rw=e=>Mr(e?mi:pi,{floor:Gt("#efd19c",e,.62),wall:Gt("#d9a64e",e),wallTop:Gt("#c48f3a",e),desk:Gt("#8a5a3c",e,.95),deskTop:Gt("#a0673f",e,.95),island:Fn,islandTop:rn,grass:Gt("#d8bf86",e),dirt:Gt("#a8764a",e),terrace:Gt("#e6c9a0",e),plant:i0}),Cw=e=>e.o;function Pw(e,t,n,i,s){const a=Math.hypot(i.x-n.x,i.z-n.z),o=new Xt;o.position.set((n.x+i.x)/2,1.3,(n.z+i.z)/2),o.rotation.y=-Math.atan2(i.z-n.z,i.x-n.x),t.add(o);const r=a/6;for(let c=-1;c<=1;c++)e.add(new mr(r,.06,6,12,Math.PI),e.mat(s),o,c*2*r,c===0?.12:0,0);e.add(e.style.box(a,.08,.14),e.mat(s),o,0,.32,0)}function Lw(e){const{k:t,root:n}=e,i=Cw(e),{x0:s,W:a,D:o,yard:r}=i,c=t.pal.pendants;vr(t,n,i,Ci(t,t.pal.floor,a,o,1,(x,p)=>{x.strokeStyle=Gt("#d9b97c",c,.62),x.lineWidth=2,x.strokeRect(1,1,p-2,p-2)}));const l=Ci(t,Gt("#e8cf9f",c,.62),r.x1-r.x0,r.z1-r.z0,1.2,(x,p)=>{x.strokeStyle=Gt("#c9a66c",c,.62),x.lineWidth=2,x.strokeRect(1,1,p-2,p-2),x.strokeRect(p/2,1,p/2-1,p/2)});t.add(t.style.box(r.x1-r.x0,.02,r.z1-r.z0),l,n,(r.x0+r.x1)/2,.03,(r.z0+r.z1)/2),t.add(t.style.box(a+.2,1.8,.22),t.mat(t.pal.wall),n,s+a/2,.9,-.11),t.add(t.style.box(.22,1.1,o+.2),t.mat(Gt(el,c)),n,s-.11,.55,o/2);for(const x of[s+a*.45,s+a*.66]){t.add(t.style.box(1,.7,.4),t.mat(Gt("#e0b25c",c)),n,x,1.5,.2),t.add(t.style.box(.7,.5,.02),ju(t,"#c48f3a",.6),n,x,1.5,.41);for(let p=0;p<3;p++)for(let v=0;v<2;v++)t.add(t.style.ball(.05),t.mat("#5c3d2e"),n,x-.2+p*.2,1.4+v*.2,.42);t.add(t.style.box(1.1,.08,.5),t.mat(t.pal.wallTop),n,x,1.88,.2),t.add(t.style.cap(.28,.5),t.mat(Gt(Es,c)),n,x,1.92,.2)}const d=Gt(Es,c);for(const x of i.columns)t.add(t.style.cylinder(.09,1.3),t.mat(d),n,x.x,.65,x.z);const f=i.columns.filter(x=>x.x<s+2.3).sort((x,p)=>x.z-p.z),u=i.columns.filter(x=>x.x>s+a-2.3).sort((x,p)=>x.z-p.z),h=i.columns.filter(x=>Math.abs(x.z-6)<1e-6).sort((x,p)=>x.x-p.x);for(const x of[f,u,h])for(let p=1;p<x.length;p++)Pw(t,n,x[p-1],x[p],d);const m=new Date().getDate();([[Je,rn,Fn],[el,rn,"#7cc26b"],["#7b5fc0",Je,"#fffaf0"]][m%3]??[Je,rn,Fn]).forEach((x,p)=>{for(let v=0;v<8;v++){const y=v*Math.PI/4;t.add(t.style.box(.14-p*.02,.01,.07),t.mat(x),n,i.door.x+Math.cos(y)*(.42-p*.13),.04+p*.002,o-.75+Math.sin(y)*(.42-p*.13)).rotation.y=-y}}),t.add(t.style.cylinder(.08,.01),t.mat("#fffaf0"),n,i.door.x,.045,o-.75)}function Iw(e){const{k:t,root:n,o:i}=e,s=(i.island.x0+i.island.x1)/2,a=(i.island.z0+i.island.z1)/2;t.add(t.style.box(1.7,.6,.8),t.mat(Fn),n,s,.42,a),t.add(t.style.box(1.8,.06,.9),t.mat(rn),n,s,.75,a);for(const o of[-.6,.6])t.add(t.style.cylinder(.2,.06),t.mat(N.dark),n,s+o,.2,a+.42).rotation.x=Math.PI/2;t.add(t.style.cylinder(.13,.04),ju(t,Je,1.4),n,s-.4,.8,a),t.add(t.style.cylinder(.12,.2),t.mat("#b08a3c"),n,s-.4,.92,a);for(let o=0;o<5;o++)t.add(t.style.cylinder(.04,.08),t.mat("#a8764a"),n,s+.15+o*.13,.82,a+.15);for(const o of[-.8,.8])t.add(t.style.cylinder(.03,1.1),t.mat("#6b4a32"),n,s+o,1.3,a-.35);for(let o=0;o<6;o++)t.add(t.style.box(.3,.03,.9),t.mat(o%2?"#fffaf0":Je),n,s-.75+o*.3,1.86,a+.05).rotation.x=.25}function Dw(e){const{k:t,o:n}=e,i=n.lounge.map(r=>r.x),s=e.stage(3);if(s&&i.length){const r=Math.min(...i)-.5,c=Math.max(...i)+.5;for(let l=0;l<8;l++)t.add(t.style.box(c-r,.02,.3),t.mat([el,rn,Fn,Es][l%4]??rn),s,(r+c)/2,.035,.6+l*.3)}Sr(e,(r,c,l)=>{t.add(t.style.box(.58,.16,.58),t.mat(Ix[l%4]??Je),r,(c.x0+c.x1)/2,.1,(c.z0+c.z1)/2)});const a=e.stage(8),o=n.lounge.map(r=>r.z);if(a&&i.length){const r=Math.min(...i)-n.x0<n.x0+n.W-Math.max(...i)?1:-1,c=r===1?n.x0:n.x0+n.W,l=(Math.min(...o)+Math.max(...o))/2,d=f=>c+r*f;for(const f of[-1.2,1.2])t.add(t.style.cylinder(.07,1.6),t.mat("#6b4a32"),a,d(.3),.8,l+f);t.add(t.style.box(.1,.1,2.6),t.mat("#6b4a32"),a,d(.3),1.6,l);for(const f of[-.7,.7])t.add(t.style.cylinder(.012,1),t.mat("#b08a3c"),a,d(.3),1.1,l+f);t.add(t.style.box(.45,.08,1.6),t.mat("#8a5a3c"),a,d(.3),.6,l),t.add(t.style.box(.06,.35,1.6),t.mat("#8a5a3c"),a,d(.11),.8,l)}}function Jf(e,t,n,i,s){const a=new Xt;a.position.set(n,0,i),a.scale.setScalar(s),t.add(a),e.add(e.style.cylinder(.17,1.1),e.mat("#7a6a58"),a,0,.55,0),e.add(e.style.ball(.6),e.mat(i0),a,0,1.35,0).scale.set(1.3,.6,1.1);const o=2+ze(`${n.toFixed(1)}${i.toFixed(1)}`)%3;for(let r=0;r<o;r++)e.add(e.style.cylinder(.025,1.2),e.mat("#8a7a68"),a,Math.cos(r*2.1)*.6,.6,Math.sin(r*2.1)*.45)}const Nw={1:(e,t,n)=>{e.add(e.style.box(.42,.42,.42),e.mat(Es),t,n.x,.21,n.z),e.add(e.style.box(.46,.05,.46),e.mat(Je),t,n.x,.43,n.z),t0(e,t,n.x,n.z,Es,i0,.25)},2:(e,t,n,i)=>{for(let a=0;a<4;a++)e.add(e.style.cylinder(.035,.09),e.style.material("#e9d7b0",{opacity:.85}),t,n.x-.65+a*.12,.83,n.z-.22);const s=xi(i.o)[0];s&&Jf(e,t,s.x,s.z,.8+i.grow.garden*.06)},3:()=>{},4:(e,t,n)=>{const i=.04+e.style.pictureZ;e.add(e.style.box(1.7,.95,.05),e.mat("#8a5a3c"),t,n.x,1.05,i),e.add(e.style.box(1.55,.8,.02),e.mat("#2b3a2f"),t,n.x,1.05,i+.03);const s=Fs(ze("slate"));for(let a=0;a<4;a++)e.add(e.style.box(.4+s()*.6,.04,.01),e.mat("#fffaf0"),t,n.x-.3+s()*.2,1.3-a*.16,i+.05)},5:(e,t,n)=>{const i=.02+e.style.pictureZ;e.add(e.style.box(3.6,.8,.02),e.mat("#f3e2b8"),t,n.x,1.2,i),e.add(e.style.ball(.22),e.mat("#9a958c"),t,n.x-.6,1.15,i+.02).scale.set(1.4,.9,.1),e.add(e.style.ball(.12),e.mat("#9a958c"),t,n.x-.25,1.28,i+.02).scale.z=.1;for(let o=0;o<6;o++)e.add(e.style.ball(.07),e.mat(o%2?Je:Fn),t,n.x+.3+o*.22,1.1+o%2*.15,i+.02).scale.z=.2;const a=n.x+2.4;e.add(e.style.box(.55,.22,.3),e.mat("#8a5a3c"),t,a,.11,.3);for(let o=0;o<6;o++)e.add(e.style.box(.07,.02,.1),e.mat(o%2?N.ink:"#fffaf0"),t,a-.2+o*.08,.23,.38)},6:(e,t,n,i)=>{e.add(e.style.cylinder(.22,.03),e.mat("#c9ccd3"),t,n.x+.45,.8,n.z-.15);for(let r=0;r<5;r++)e.add(e.style.cylinder(.05,.04),e.mat([rn,"#7cc26b",Je,"#fffaf0","#a8764a"][r]??rn),t,n.x+.45+Math.cos(r*1.25)*.13,.83,n.z-.15+Math.sin(r*1.25)*.13);const o=i.o.columns.filter(r=>Math.abs(r.z-6)<1e-6).map(r=>r.x);if(o.length>1)for(let r=Math.min(...o);r<Math.max(...o);r+=.16)e.add(e.style.ball(.05),e.mat(Math.round(r*6)%3?Je:rn),t,r,1.5-Math.abs(Math.sin((r-(o[0]??0))*1.85))*.2,6)},7:(e,t,n)=>{for(const[i,s]of[[-.45,-.45],[.45,-.45],[-.45,.45],[.45,.45]])e.add(e.style.cylinder(.06,1.1),e.mat(Es),t,n.x+i,.55,n.z+s);e.add(e.style.box(1.15,.1,1.15),e.mat("#c48f3a"),t,n.x,1.12,n.z),e.add(e.style.cap(.48,.5),e.mat(Es),t,n.x,1.17,n.z),En(e,t,.06,.25,rn,n.x,1.75,n.z)},8:(e,t,n,i)=>{for(const s of xi(i.o).slice(1))Jf(e,t,s.x,s.z,.8+i.grow.garden*.06)},9:(e,t,n)=>{Ul(e,t,n,"#8a5a3c","#efd19c");for(const[i,s]of[[-.35,-.35],[.35,-.35],[-.35,.35],[.35,.35]])e.add(e.style.cylinder(.04,.01),e.mat(N.ink),t,n.x+i,.39,n.z+s);for(let i=0;i<7;i++)e.add(e.style.cylinder(.03,.02),e.mat(i%2?N.ink:"#fffaf0"),t,n.x+Math.cos(i)*.08,.4,n.z+Math.sin(i)*.08)},10:(e,t,n)=>{for(let i=0;i<4;i++)e.add(e.style.box(1.6-i*.35,.06,1.6-i*.35),e.mat(i%2?"#d9b97c":"#c9a66c"),t,n.x,.05-i*.04,n.z);e.add(e.style.box(.5,.02,.5),e.style.material("#5aa9a0",{emissive:"#5aa9a0",ei:.1}),t,n.x,-.1,n.z)},11:(e,t,n)=>{for(const i of[-.8,.8])for(const s of[-.4,.4])e.add(e.style.cylinder(.03,1.2),e.mat("#8a7a68"),t,n.x+i,.6,n.z+s);e.add(e.style.box(1.6,1.1,.8),e.style.material("#fffaf0",{opacity:.25}),t,n.x,.6,n.z);for(let i=0;i<3;i++)e.add(e.style.cylinder(.015,.4),e.mat("#e9d7b0"),t,n.x-.6,.2,n.z-.06+i*.06)},12:(e,t,n)=>{e0(e,t,n,"#5aa9a0","#d9b97c");for(let i=0;i<5;i++)e.add(e.style.cylinder(.14,.01),e.mat("#4f8a3e"),t,n.x-.6+i*.3,.05,n.z+Math.sin(i*2)*.3),i%2===0&&e.add(e.style.ball(.07),e.mat("#fffaf0"),t,n.x-.6+i*.3,.1,n.z+Math.sin(i*2)*.3)},13:(e,t,n)=>{Fc(e,t,n,Je,rn,2.6),Fc(e,t,{x:n.x-1.2,z:n.z+1.4},Fn,"#fffaf0",2.2),Fc(e,t,{x:n.x-.4,z:n.z+2.6},"#7b5fc0",rn,2.9)},14:(e,t,n)=>{Ar(e,t,n,(i,s)=>{e.add(e.style.ball(.16),i,t,n.x,s+.25,n.z).scale.set(1,1.3,.9),e.add(e.style.capsule(.05,.25),i,t,n.x,s+.5,n.z+.05),e.add(e.style.ball(.07),i,t,n.x,s+.68,n.z+.08);for(let a=0;a<7;a++){const o=e.add(e.style.box(.08,.55,.02),i,t,n.x+Math.sin((a-3)*.3)*.25,s+.45,n.z-.2);o.rotation.z=(a-3)*.3}})}};function Uw(e,t,n,i,s,a,o){if(e.add(e.style.box(.26,.3,.02),e.mat(o?N.gold:"#b08a3c"),t,n,i,s),e.add(e.style.box(.2,.24,.01),e.mat(o?"#d8e4ec":[Fn,"#7b5fc0",Je,el][a%4]??Fn),t,n,i,s+.015),o)for(let r=0;r<3;r++)e.add(e.style.box(.05,.05,.01),e.mat(N.gold),t,n-.06+r*.06,i+r%2*.06,s+.02)}const Dx=(e,t)=>_i(e)[Math.min(t,14)]??e.door;function Ow(e){wr(e,e.k.pal.terrace,[Je,"#fffaf0",Fn]),Tr(e,Nw,Dx);const t=_i(e.o)[4]?.x??e.o.x0+e.o.W/2;Er(e,{xa:t+1.1,xb:e.o.x0+e.o.W*.45-.6,y:1},Uw)}function Fw(e){const t=[Je,rn,Fn][ze(e.name)%3]??Je,n=e.add(new mr(.18,.08,8,18),e.mat(t),e.head,0,.13,-.01);n.rotation.x=Math.PI/2,n.scale.set(1.05,1,1.2),e.add(e.style.ball(.17),e.mat(t),e.head,0,.19,-.02).scale.y=.55}const Bw={id:"haveli",pal:Rw,shell:Lw,island:Iw,lounge:Dw,desk:(e,t,n)=>yr(e,t,n,{mat:Ix[ze(n)%4]}),mainDesk:e=>br(e,"#a0673f","#6b4a32"),tree:({k:e},t,n,i,s)=>{Jf(e,t,n,i,s)},growth:Ow,pieceAt:Dx,wear:Fw},s0="#2f7a4a",nl="#5fa84a",Ls="#2f5fa7",dn="#e9c46a",il="#7cc26b",Gw="#5b3a7a",Yh=[["#2a9d8f",dn,"#fffaf0"],[Ls,il,"#fffaf0"],["#f28c28",dn,"#fffaf0"]],Hw=e=>Mr(e?mi:pi,{floor:Gt("#d8d2c6",e,.55),wall:Gt("#e8e4dc",e,.55),wallTop:Gt("#b9b3a8",e),desk:Gt("#8a5a3c",e,.95),deskTop:Gt("#a0673f",e,.95),island:dn,islandTop:Gt("#fffaf0",e,.8),grass:Gt("#7fbf5a",e),dirt:Gt("#8a6a4a",e),terrace:Gt("#f3efe4",e,.55),plant:s0}),Vw=e=>e.o;function Nx(e,t,n,i){e.add(e.style.cylinder(.18,.32),e.mat(dn),t,n,.16,i);for(let s=0;s<6;s++){const a=e.add(e.style.ball(.2),e.mat(s0),t,n+Math.sin(s)*.18,.5+s%2*.15,i+Math.cos(s)*.18);a.scale.set(1.2,.3,.9),a.rotation.y=s}}function Ww(e){const{k:t,root:n}=e,i=Vw(e),{x0:s,W:a,D:o}=i,r=t.pal.pendants;vr(t,n,i,Ci(t,t.pal.floor,a,o,2,(u,h)=>{u.fillStyle=Gt("#cfc8bb",r,.55),u.fillRect(0,0,h,1),u.fillRect(0,0,1,h)}));const c=Ci(t,Gt("#f3efe4",r,.6),a,1,2,(u,h)=>{u.fillStyle="#5c677d",u.beginPath(),u.moveTo(0,h);for(let m=0;m<=h;m+=2)u.lineTo(m,h*.55+Math.sin(m/h*Math.PI*2)*h*.2);u.lineTo(h,h),u.fill()});t.add(t.style.box(a,.02,1),c,n,s+a/2,.03,o-.5),t.add(t.style.box(a+.2,1.7,.2),t.mat(t.pal.wall),n,s+a/2,.85,-.1);const l=Ci(t,Gt("#e8e4dc",r,.55),a,1.6,.8,u=>{u.fillStyle=Gt("#6b8f71",r);for(let h=0;h<2;h++)for(let m=0;m<2;m++)u.beginPath(),u.arc(16+h*32,16+m*32,11,0,7),u.fill()});t.add(t.style.box(a,1.6,.02),l,n,s+a/2,.85,.01),t.add(t.style.box(.2,1,o+.2),t.mat(t.pal.wall),n,s-.1,.5,o/2);const d=Ci(t,"#f3f6fb",o,1,.5,(u,h)=>{u.strokeStyle=Ls,u.lineWidth=4,u.beginPath(),u.moveTo(h/2,6),u.lineTo(h-6,h/2),u.lineTo(h/2,h-6),u.lineTo(6,h/2),u.closePath(),u.stroke()});t.add(t.style.box(.02,.9,o),d,n,s+.01,.5,o/2);const f=i.lounge.map(u=>u.x);if(f.length){const u=Math.min(...f)-.7,h=Math.max(...f)+.7;for(const m of[u,h])t.add(t.style.cylinder(.05,1.95),t.mat("#d8d2c6"),n,m,.97,3);t.add(t.style.box(h-u+.2,.08,3.1),t.mat(Gt("#f3efe4",r,.7)),n,(u+h)/2,1.97,1.5)}for(const u of i.paths)for(let h=1;h<u.length-1;h+=3){const m=u[h];m&&Nx(t,n,m.x+.78,m.z+2.05)}t.add(t.style.ball(.13),t.mat("#fffaf0"),n,i.door.x-.8,.13,o-.6)}function kw(e){const{k:t,root:n,o:i}=e,s=i.island,a=(s.x0+s.x1)/2;Hs(t,n,{x0:s.x0+.05,x1:s.x1-.05,z0:s.z0,z1:s.z1},.62,t.pal.island),Hs(t,n,{x0:s.x0-.05,x1:s.x1+.05,z0:s.z0-.05,z1:s.z1+.05},.07,t.pal.islandTop,.62),t.add(t.style.box(.25,.12,.25),t.mat(N.dark),n,a,.75,s.z0+.5),t.add(t.style.cylinder(.1,.3),t.style.material("#cfe8ee",{opacity:.7}),n,a,.95,s.z0+.5);for(const o of i.islandSpots)t.add(t.style.cylinder(.04,.6),t.mat(N.metal),n,o.x,.3,o.z),t.add(t.style.cylinder(.18,.06),t.mat(Ls),n,o.x,.62,o.z)}function Xw(e){const{k:t}=e;Sr(e,(n,i,s)=>{const a=(i.x0+i.x1)/2,o=(i.z0+i.z1)/2,r=Yh[s%3]??Yh[0];if(s<4){t.add(t.style.cylinder(.01,1.2),t.mat("#b9b3a8"),n,a,1.35,o);const c=t.add(t.style.cap(.32,.5),t.mat(r[0]),n,a,.75,o);c.rotation.x=Math.PI;return}for(const c of[-.45,.45])t.add(t.style.cylinder(.04,1.2),t.mat("#d8d2c6"),n,a,.6,o+c);for(let c=0;c<7;c++){const l=c/6,d=t.add(t.style.box(.5,.04,.14),t.mat(r[c%3]??dn),n,a,.75-Math.sin(l*Math.PI)*.35,o-.4+l*.8);d.rotation.x=-Math.cos(l*Math.PI)*.5}})}function Qf(e,t,n,i,s){const a=new Xt;if(a.position.set(n,0,i),a.scale.setScalar(s),t.add(a),ze(`${n.toFixed(1)}${i.toFixed(1)}`)%2){e.add(e.style.cylinder(.08,1.7),e.mat("#a0673f"),a,0,.85,0);for(let o=0;o<6;o++)e.add(e.style.box(.9,.04,.2),e.mat(nl),a,Math.cos(o)*.3,1.65,Math.sin(o)*.3).rotation.y=o;return}e.add(e.style.cylinder(.1,1.3),e.mat("#8a9a5a"),a,0,.65,0);for(let o=0;o<6;o++)e.add(e.style.box(.25,.03,1),e.mat(nl),a,Math.sin(o)*.35,1.4,Math.cos(o)*.35).rotation.set(.5*Math.cos(o),o,.5*Math.sin(o))}const $w={1:(e,t,n)=>{Nx(e,t,n.x,n.z)},2:(e,t,n,i)=>{for(let a=0;a<3;a++)e.add(e.style.cylinder(.09,.07),e.mat("#fffaf0"),t,n.x,.73,n.z-.5+a*.35),e.add(e.style.ball(.07),e.mat(Gw),t,n.x,.77,n.z-.5+a*.35).scale.y=.4;const s=xi(i.o)[0];s&&Qf(e,t,s.x,s.z,.8+i.grow.garden*.06)},3:()=>{},4:(e,t,n)=>{const i=.05+e.style.pictureZ;e.add(e.style.box(1.7,.95,.05),e.mat("#c9c3b6"),t,n.x,1.05,i),e.add(e.style.box(1.6,.85,.02),e.mat(N.paper),t,n.x,1.05,i+.03);for(let s=0;s<4;s++)e.add(e.style.box(.5+s%3*.2,.04,.01),e.mat(N.board[s]??N.marker),t,n.x-.3,1.3-s*.16,i+.05)},5:(e,t,n)=>{const i=.04+e.style.pictureZ;for(let a=0;a<10;a++)for(let o=0;o<3;o++)e.add(e.style.box(.34,.24,.02),e.mat((a+o)%2?"#f3f6fb":Ls),t,n.x-1.7+a*.36,.95+o*.26,i);const s=n.x+2.3;e.add(e.style.ball(.12),e.mat("#c98a3e"),t,s,.35,.3).scale.set(1,1.2,.4),e.add(e.style.box(.05,.4,.03),e.mat("#6b4a32"),t,s,.62,.3)},6:(e,t,n,i)=>{for(let s=0;s<6;s++)e.add(e.style.ball(.08),e.mat(["#f28c28",dn,il][s%3]??dn),t,n.x-.15+s%3*.15,.76+Math.floor(s/3)*.08,n.z+1.6);for(let s=0;s<6;s++){const a=i.o.x0-.4,o=2+s*(i.o.D/6);e.add(e.style.cylinder(.03,.7),e.mat(nl),t,a,.35,o);for(let r=0;r<3;r++)En(e,t,.06,.18,r%2?dn:"#f28c28",a+.05,.55+r*.12,o).rotation.z=1.2}},7:(e,t,n)=>{e.add(e.style.cylinder(.04,1.8),e.mat("#8a5a3c"),t,n.x,.9,n.z),En(e,t,1,.45,"#d9b86a",n.x,1.9,n.z),Hs(e,t,{x0:n.x+.9,x1:n.x+1.6,z0:n.z-.3,z1:n.z+.3},.8,"#d9b86a");for(let i=0;i<4;i++)e.add(e.style.ball(.1),e.mat(il),t,n.x+1.05+i%2*.3,.9,n.z-.12+Math.floor(i/2)*.24)},8:(e,t,n,i)=>{for(const s of xi(i.o).slice(1))Qf(e,t,s.x,s.z,.8+i.grow.garden*.06)},9:(e,t,n)=>{e.add(e.style.box(2.2,.02,1.3),e.mat("#5fb35a"),t,n.x,.02,n.z),e.add(e.style.box(.03,.01,1.2),e.mat("#fffaf0"),t,n.x,.04,n.z);for(const i of[-1,1]){for(const s of[-.3,.3])e.add(e.style.box(.04,.4,.04),e.mat("#fffaf0"),t,n.x+i*1.05,.2,n.z+s);e.add(e.style.box(.04,.04,.64),e.mat("#fffaf0"),t,n.x+i*1.05,.4,n.z)}e.add(e.style.ball(.09),e.mat("#fffaf0"),t,n.x+.3,.09,n.z+.2)},10:(e,t,n)=>{for(let i=0;i<3;i++){const s=e.add(e.style.cylinder(.55,.04),e.style.material("#6cb4ee",{emissive:"#6cb4ee",ei:.1}),t,n.x+Math.sin(i*2.1)*.35,.02,n.z-.5+i*.5);s.scale.x=1.2}},11:(e,t,n)=>{e.add(e.style.cylinder(.25,.45),e.mat("#c9ccd3"),t,n.x,.23,n.z),e.add(e.style.cylinder(.26,.03),e.mat("#fffaf0"),t,n.x,.47,n.z),e.add(e.style.cylinder(.16,.25),e.mat(Ls),t,n.x+.5,.13,n.z+.2),e.add(e.style.cylinder(.14,.04),e.mat(dn),t,n.x-.45,.3,n.z+.25).rotation.x=1.2},12:(e,t,n)=>{e0(e,t,n,"#5aa9a0","#cfc8bb");for(let i=0;i<4;i++)e.add(e.style.cylinder(.3,.02),e.mat(nl),t,n.x-.5+i*.35,.05,n.z+Math.sin(i*2)*.25)},13:(e,t,n)=>{Fc(e,t,n,"#f28c28",Ls,2.8)},14:(e,t,n)=>{Ar(e,t,n,(i,s)=>{e.add(e.style.cylinder(.12,.1),i,t,n.x,s+.05,n.z),e.add(e.style.cylinder(.04,.3),i,t,n.x,s+.25,n.z),e.add(e.style.cap(.22,.5),i,t,n.x,s+.42,n.z).rotation.x=Math.PI;for(const a of[-1,1])e.add(e.style.box(.05,.2,.05),i,t,n.x+a*.25,s+.55,n.z)})}};function qw(e,t,n,i,s,a,o){e.add(e.style.box(.28,.28,.02),e.mat(o?N.gold:["#2a9d8f",dn,Ls,"#f28c28"][a%4]??dn),t,n,i,s);const r=e.add(e.style.cylinder(.1,.01),e.mat(o?N.gold:N.dark),t,n+.06,i,s+.015);r.rotation.x=Math.PI/2}const Ux=(e,t)=>_i(e)[Math.min(t,14)]??e.door;function Yw(e){wr(e,e.k.pal.terrace,["#2a9d8f",dn,"#fffaf0"]),Tr(e,$w,Ux);const t=_i(e.o)[4]?.x??e.o.x0+e.o.W/2,n=Math.min(...e.o.lounge.map(i=>i.x));Er(e,{xa:t+1.1,xb:n-1,y:1.45},qw)}function Zw(e){for(const t of e.legs)e.add(e.style.box(.15,.06,.24),e.mat(il),t,0,-.29,.04),e.add(e.style.box(.16,.02,.25),e.mat(dn),t,0,-.32,.04)}const Kw={id:"tropical",pal:Hw,shell:Ww,island:kw,lounge:Xw,desk:(e,t,n)=>yr(e,t,n,{thing:(i,s,a)=>{a%4===1&&t0(i,s,-.5,.4,dn,s0,.2)}}),mainDesk:e=>br(e,"#a0673f","#6b4a32"),tree:({k:e},t,n,i,s)=>{Qf(e,t,n,i,s)},growth:Yw,pieceAt:Ux,wear:Zw},Ge="#2f5fa7",De="#fbfaf6",a0="#8a9a6a",Zh="#c9a66c",Jw="#6b9f3a",jf="#3d8fd1",Qw=e=>Mr(e?mi:pi,{floor:Gt("#e8e2d4",e,.55),wall:Gt(De,e,.55),wallTop:Gt("#e8e4dc",e,.55),desk:Gt(Ge,e,.9),deskTop:Gt(De,e,.75),island:Ge,islandTop:Gt(De,e,.75),grass:Gt("#d8c9a0",e),dirt:Gt("#b39a72",e),terrace:Gt("#ece6d8",e,.6),plant:a0}),Ox=e=>e.o;function jw(e,t,n,i,s,a){const o=e.mat(e.pal.wall),r=e.mat(Gt(Ge,e.pal.pendants)),c=s/2,l=i-.55;e.add(e.style.box(s+.1,.02,2.6),e.mat(Gt("#f7f4ec",e.pal.pendants,.6)),t,n,.035,i+.65),e.add(e.style.box(s+.1,1.5,.22),o,t,n,.75,l),e.add(e.style.box(.22,1.2,2.4),o,t,n-c-.05,.6,i+.65),e.add(e.style.box(.5,.45,.04),r,t,n+c-.6,1,l+.12),e.add(e.style.box(.04,.85,.5),r,t,n-c+.08,.45,i+1.3),a&&(e.add(e.style.cylinder(.55,.35),o,t,n-c+.8,1.65,l),e.add(e.style.cap(.55,.5),r,t,n-c+.8,1.82,l),e.add(e.style.box(.05,.3,.05),e.mat("#e9c46a"),t,n-c+.8,2.5,l))}function t3(e){const{k:t,root:n}=e,i=Ox(e),{x0:s,W:a,D:o}=i,r=t.pal.pendants,c=t.add(t.style.box(90,.02,90),t.style.material(r?"#16304a":jf),n,s+a/2,-1.4,o/2);c.receiveShadow=!1,vr(t,n,i,Ci(t,t.pal.floor,a,o,1.5,(d,f)=>{for(let u=0;u<40;u++)d.fillStyle=u%3?Gt(De,r,.6):"#5c677d",d.beginPath(),d.ellipse(u*37%f,u*53%f,4,2.5,u,0,7),d.fill()})),t.add(t.style.box(a+.2,.8,.25),t.mat(t.pal.wall),n,s+a/2,.4,-.12),t.add(t.style.box(.25,.8,o+.2),t.mat(t.pal.wall),n,s-.12,.4,o/2),i.cubes.forEach((d,f)=>{jw(t,n,d.x,d.z,d.w,f===0)});const l=[...i.desks.values()].sort((d,f)=>d.z-f.z||d.x-f.x)[0];l&&(t.add(t.style.ball(.16),t.mat("#e9a65c"),n,l.x+.45,.62,l.z+.75).scale.set(1.4,.6,1),t.add(t.style.ball(.08),t.mat("#e9a65c"),n,l.x+.65,.66,l.z+.75));for(const d of[-.6,.6])t.add(t.style.box(.12,.9,.12),t.mat(t.pal.wall),n,i.door.x+d,.45,o-.05)}function e3(e){const{k:t,root:n}=e,i=Ox(e);for(const r of i.posts)t.add(t.style.cylinder(.07,2.1),t.mat(De),n,r.x,1.05,r.z);const s=i.posts.map(r=>r.x),a=i.posts.map(r=>r.z),o=(Math.min(...s)+Math.max(...s))/2;for(let r=Math.min(...a);r<=Math.max(...a);r+=.18)t.add(t.style.box(2.4,.03,.08),t.mat(Zh),n,o,2.12,r);for(const r of i.tables){const c=(r.x0+r.x1)/2,l=(r.z0+r.z1)/2;t.add(t.style.cylinder(.42,.05),t.mat(De),n,c,.55,l),t.add(t.style.cylinder(.05,.55),t.mat(N.dark),n,c,.27,l)}for(const r of i.islandSpots){const c=new Xt;c.position.set(r.x,0,r.z),c.rotation.y=r.face,n.add(c),t.add(t.style.box(.38,.06,.38),t.mat(Zh),c,0,.32,0),t.add(t.style.box(.38,.4,.05),t.mat(Ge),c,0,.52,-.18);for(const l of[-.16,.16])for(const d of[-.16,.16])t.add(t.style.box(.04,.3,.04),t.mat(Ge),c,l,.15,d)}}function n3(e){const{k:t,o:n}=e,i=n.lounge.map(a=>a.x),s=e.stage(3);if(s&&i.length){const a=Math.min(...i)-.5,o=Math.max(...i)+.5;t.add(t.style.box(o-a,.3,.45),t.mat(t.pal.wall),s,(a+o)/2,.15,.3)}Sr(e,(a,o)=>{t.add(t.style.box(.7,.12,.5),t.mat(Ge),a,(o.x0+o.x1)/2,.08,(o.z0+o.z1)/2),t.add(t.style.box(.5,.2,.1),t.mat(De),a,(o.x0+o.x1)/2,.22,o.z0+.05)})}function tu(e,t,n,i,s){const a=new Xt;a.position.set(n,0,i),a.scale.setScalar(s),t.add(a);const o=(ze(`${n.toFixed(1)}${i.toFixed(1)}`)%9-4)*.05;e.add(e.style.cylinder(.1,.8),e.mat("#6b5a48"),a,0,.4,0).rotation.z=o,e.add(e.style.ball(.55),e.mat(a0),a,o*.6,1.1,0).scale.set(1.2,.7,1)}const i3={1:(e,t,n)=>{t0(e,t,n.x,n.z,De,"#5fb35a",.3)},2:(e,t,n,i)=>{e.add(e.style.box(.2,.08,.14),e.mat(De),t,n.x-.1,.62,n.z);for(let a=0;a<5;a++)e.add(e.style.ball(.035),e.mat("#4b3f2a"),t,n.x+.12+a%3*.06,.6,n.z-.05+Math.floor(a/3)*.08);const s=xi(i.o)[0];s&&tu(e,t,s.x,s.z,.8+i.grow.garden*.06)},3:()=>{},4:(e,t,n)=>{const i=.13+e.style.pictureZ;e.add(e.style.box(1.7,.6,.05),e.mat(Ge),t,n.x,.5,i),e.add(e.style.box(1.55,.48,.02),e.mat(De),t,n.x,.5,i+.03);for(let s=0;s<3;s++)e.add(e.style.box(.5+s*.25,.04,.01),e.mat(N.board[s]??Ge),t,n.x-.3,.65-s*.13,i+.05)},5:(e,t,n)=>{for(let a=0;a<12;a++)e.add(e.style.box(.18,.04,.02),e.mat(Ge),t,n.x-2+a*.36,.72,.02),e.add(e.style.box(.04,.14,.02),e.mat(Ge),t,n.x-1.93+a*.36,.66,.02);const s=n.x+2.4;e.add(e.style.ball(.14),e.mat("#c98a3e"),t,s,.3,.3).scale.set(1,1.2,.5),e.add(e.style.box(.05,.55,.03),e.mat("#6b4a32"),t,s,.7,.3)},6:(e,t,n,i)=>{for(let a=0;a<4;a++)e.add(e.style.ball(.06),e.mat("#5b3a7a"),t,n.x+Math.cos(a*1.6)*.1,.6,n.z+2.1+Math.sin(a*1.6)*.1);const s=i.o;for(let a=0;a<14;a++)e.add(e.style.ball(.05),e.mat(a%3?"#fffaf0":"#7cc26b"),t,s.x0+.5+a*(s.W/14),.82,-.05)},7:(e,t,n,i)=>{const s=i.o,a=s.posts.map(c=>c.x),o=s.posts.map(c=>c.z),r=(Math.min(...a)+Math.max(...a))/2;for(let c=0;c<9;c++)e.add(e.style.ball(.22),e.mat(Jw),t,r-.9+c%3*.9,2.2,Math.min(...o)+.4+Math.floor(c/3)*1.4).scale.y=.5;for(let c=0;c<4;c++)e.add(e.style.ball(.05),e.mat("#5b3a7a"),t,r-.6+c*.4,2.05,Math.min(...o)+1.2+c*.5)},8:(e,t,n,i)=>{e.add(e.style.box(1,.9,1),e.mat(i.k.pal.wall),t,n.x,.45,n.z),e.add(e.style.box(.3,.5,.02),e.mat(Ge),t,n.x,.25,n.z+.51);for(const s of xi(i.o).slice(1))tu(e,t,s.x,s.z,.8+i.grow.garden*.06)},9:(e,t,n)=>{Ul(e,t,n,"#8a5a3c","#e8d6b0");for(let i=0;i<6;i++)En(e,t,.04,.2,i%2?De:N.dark,n.x-.25+i*.1,.39,n.z-.2).rotation.x=Math.PI/2},10:(e,t,n)=>{e.add(e.style.cylinder(.45,.6),e.mat(De),t,n.x,.3,n.z),e.add(e.style.cylinder(.4,.05),e.mat(Ge),t,n.x,.62,n.z)},11:(e,t,n,i)=>{e.add(e.style.box(1.4,1,1.2),e.mat(i.k.pal.wall),t,n.x,.5,n.z),e.add(e.style.box(1,.8,.9),e.mat(i.k.pal.wall),t,n.x+.1,1.4,n.z-.05),e.add(e.style.box(.3,.45,.02),e.mat(Ge),t,n.x+.1,1.3,n.z+.41);for(let s=0;s<5;s++)e.add(e.style.box(.35,.2,.2),e.mat(De),t,n.x-.85,.1+s*.2,n.z+.5-s*.2)},12:(e,t,n)=>{e.add(e.style.box(1.8,.08,.4),e.mat("#c49a6c"),t,n.x,.05,n.z),e.add(e.style.box(1.2,.25,.45),e.mat(Ge),t,n.x-.2,.15,n.z+.6).scale.set(1,1,1),e.add(e.style.box(1.1,.06,.4),e.mat(De),t,n.x-.2,.3,n.z+.6),e.add(e.style.box(.04,.6,.04),e.mat("#6b4a32"),t,n.x-.1,.6,n.z+.6)},13:(e,t,n)=>{e.add(e.style.cylinder(.5,1.6),e.mat(De),t,n.x,.8,n.z),En(e,t,.6,.45,"#a8764a",n.x,1.82,n.z);const i=new Xt;i.position.set(n.x,1.7,n.z+.55),t.add(i);for(let s=0;s<6;s++){const a=new Xt;a.rotation.z=s*Math.PI/3,i.add(a),e.add(e.style.box(.06,.9,.02),e.mat("#6b4a32"),a,0,.45,0),e.add(e.style.box(.22,.5,.01),e.mat(De),a,.12,.6,0)}},14:(e,t,n)=>{Ar(e,t,n,(i,s)=>{e.add(e.style.ball(.22),i,t,n.x,s+.3,n.z).scale.set(1,1.3,1),e.add(e.style.cylinder(.07,.25),i,t,n.x,s+.65,n.z);for(const a of[-1,1])e.add(e.style.box(.04,.2,.04),i,t,n.x+a*.12,s+.62,n.z)})}};function s3(e,t,n,i,s,a,o){e.add(e.style.box(.28,.24,.02),e.mat(o?N.gold:Ge),t,n,i,s),e.add(e.style.box(.2,.16,.01),e.mat(o?"#e9c46a":[jf,"#e9c46a",a0,De][a%4]??jf),t,n,i,s+.015)}const Fx=(e,t)=>{const n=_i(e);if(t===2||t===6){const i=e.tables[0];if(i)return{x:(i.x0+i.x1)/2,z:(i.z0+i.z1)/2}}return n[Math.min(t,14)]??e.door};function a3(e){wr(e,e.k.pal.terrace,[Ge,De]),Tr(e,i3,Fx);const t=_i(e.o)[4]?.x??e.o.x0+e.o.W/2;Er(e,{xa:t+1.1,xb:e.o.mainDesk.x-.6,y:.95},s3)}function o3(e){e.add(e.style.cylinder(.21,.12),e.mat("#2b3a67"),e.head,0,.2,0),e.add(e.style.box(.24,.025,.12),e.mat("#1d1a17"),e.head,0,.15,.2)}const r3={id:"cyclades",pal:Qw,shell:t3,island:e3,lounge:n3,desk:(e,t,n)=>yr(e,t,n,{chair:Ge}),mainDesk:e=>br(e,De,Ge),tree:({k:e},t,n,i,s)=>{tu(e,t,n,i,s)},growth:a3,pieceAt:Fx,wear:o3},Vs="#d9b86a",Ke="#6b4a32",eu="#9a8a78",Bx="#7a9a4a",nu=[["#2a9d8f","#e9c46a"],["#f28c28","#2f5fa7"],["#7b5fc0","#e9c46a"]],iu=["#2a9d8f","#f28c28","#e9c46a","#7b5fc0"],c3=e=>Mr(e?mi:pi,{floor:Gt("#dfaa72",e,.62),wall:Gt("#c98a4e",e),wallTop:Gt("#b07a42",e),desk:Gt(Ke,e,1.2),deskTop:Gt("#8a5a3c",e,1.2),island:Ke,islandTop:"#8a5a3c",grass:Gt("#c9a35a",e),dirt:Gt("#9a6a3e",e),terrace:Gt("#d9b07a",e),plant:Bx}),Gx=e=>e.o;function o0(e,t,n,i,s,a,o){for(let r=0;r<5;r++)e.add(e.style.box(s,.02,a/5),e.mat(r%2?o:Vs),t,n,.035,i-a/2+(r+.5)*(a/5))}function Hx(e,t,n,i,s,a){for(const o of[n,i])for(const r of[s,a])e.add(e.style.cylinder(.08,2),e.mat(Ke),t,o,1,r);for(let o=s;o<=a+.01;o+=1.8)e.add(e.style.cylinder(.018,i-n+.4),e.mat("#b08a5a"),t,(n+i)/2,2.02,o).rotation.z=Math.PI/2;for(let o=0;o<3;o++)e.add(e.style.box(i-n,.03,.4),e.mat(Vs),t,(n+i)/2,2.06,s+.5+o*(a-s-1)/2)}function Kh(e,t){const n=e.lounge.find(i=>Math.abs(i.x-t)<.6);return n?n.x+(t>=n.x?1:-1)*Math.abs(n.ax-n.x):t}function l3(e){const{k:t,root:n}=e,i=Gx(e),{x0:s,W:a,D:o,hangar:r}=i,c=t.pal.pendants;vr(t,n,i,Ci(t,t.pal.floor,a,o,2,(h,m)=>{h.fillStyle=Gt("#d39a62",c,.62);for(let _=0;_<9;_++)h.fillRect(_*23%m,_*41%m,6,3)}));const l=t.mat(t.pal.wall);t.add(t.style.box(a+.2,1.5,.4),l,n,s+a/2,.75,-.2),t.add(t.style.box(.4,1.2,o+.2),l,n,s-.2,.6,o/2);for(let h=s+.6;h<s+a;h+=.9)t.add(t.style.cylinder(.035,.5),t.mat(Ke),n,h,1.2,.05).rotation.x=Math.PI/2;for(let h=s;h<=s+a+.01;h+=a/4)t.add(t.style.box(.55,1.8,.6),l,n,Kh(i,h),.9,-.15),En(t,n,.25,.5,t.pal.wall,Kh(i,h),2.05,-.15);Hx(t,n,r.x0,r.x1,r.z0,r.z1);for(const h of i.desks.values())o0(t,n,h.x,h.z+.3,1.6,1.4,iu[ze(`${h.x}`)%4]??Vs);for(const[h,m]of[[s+a-.9,5],[s+a-.9,6.3]])t.add(t.style.cylinder(.4,1),l,n,h,.5,m),En(t,n,.55,.55,Vs,h,1.27,m);for(let h=0;h<3;h++)t.add(t.style.ball(.2),t.mat("#a8764a"),n,i.door.x+.8+h*.45,.2,o-.25).scale.y=1.1;const d=i.tree.x-1.8,f=i.tree.x+1.8,u=4.6;for(const h of[d,f])t.add(t.style.cylinder(.04,1.6),t.mat(Ke),n,h,.8,u);t.add(t.style.cylinder(.008,f-d),t.mat(N.dark),n,(d+f)/2,1.55,u).rotation.z=Math.PI/2,nu.forEach(([h,m],_)=>{t.add(t.style.box(.9,.7,.01),t.mat(h),n,d+.75+_*1.1,1.15,u);for(let x=0;x<4;x++)t.add(t.style.box(.12,.12,.01),t.mat(m),n,d+.55+_*1.1+x%2*.4,1+Math.floor(x/2)*.3,u+.01)})}function d3(e){const{k:t,root:n}=e,i=Gx(e),{x:s,z:a}=i.tree,o=e.grow.stage>=8;t.add(t.style.cylinder(o?.7:.55,2),t.mat(eu),n,s,1,a);for(let l=0;l<5;l++){const d=l*1.3;t.add(t.style.cylinder(.1,1.1),t.mat(eu),n,s+Math.sin(d)*.5,2.3,a+Math.cos(d)*.5).rotation.set(Math.cos(d)*.7,0,-Math.sin(d)*.7);const u=e.grow.garden>=3?"#6b9f3a":"#8a9a5a";t.add(t.style.ball(o?.45:.35),t.mat(u),n,s+Math.sin(d)*1,2.75,a+Math.cos(d)*1).scale.y=.55}const r=s+.55,c=a+.55;t.add(t.style.cylinder(.14,.2),t.mat(N.dark),n,r,.1,c),t.add(t.style.cylinder(.11,.03),ju(t,"#f28c28",1.6),n,r,.21,c),t.add(t.style.ball(.08),t.mat("#5c677d"),n,r,.3,c);for(const l of i.islandSpots)t.add(t.style.cylinder(.15,.2),t.mat(Ke),n,l.x+Math.sin(l.face)*.05,.1,l.z+Math.cos(l.face)*.05)}function f3(e){const{k:t}=e;Sr(e,(n,i,s)=>{const a=(i.x0+i.x1)/2,o=(i.z0+i.z1)/2;o0(t,n,a,o,.75,.6,iu[s%4]??Vs),t.add(t.style.capsule(.07,.4),t.mat(iu[(s+1)%4]??Vs),n,a,.1,i.z0+.05).rotation.z=Math.PI/2})}function su(e,t,n,i,s){const a=new Xt;if(a.position.set(n,0,i),a.scale.setScalar(s),t.add(a),ze(`${n.toFixed(1)}${i.toFixed(1)}`)%2){e.add(e.style.cylinder(.3,1.1),e.mat(eu),a,0,.55,0),e.add(e.style.ball(.45),e.mat("#8a9a5a"),a,0,1.35,0).scale.y=.5;return}e.add(e.style.cylinder(.06,1),e.mat(Ke),a,0,.5,0),e.add(e.style.ball(.6),e.mat(Bx),a,0,1.15,0).scale.set(1.3,.3,1.3)}const u3={1:(e,t,n)=>{e.add(e.style.cap(.22,.6),e.mat("#c98a3e"),t,n.x,.25,n.z).rotation.x=Math.PI;for(let i=0;i<5;i++)e.add(e.style.ball(.08),e.mat("#5fb35a"),t,n.x+Math.cos(i*1.3)*.1,.3,n.z+Math.sin(i*1.3)*.1)},2:(e,t,n,i)=>{const{x:s,z:a}=i.o.tree;e.add(e.style.cylinder(.22,.05),e.mat(Vs),t,s-.5,.05,a+.55);for(let r=0;r<4;r++)e.add(e.style.ball(.07),e.mat(r%2?"#e9c46a":"#f28c28"),t,s-.5+Math.cos(r*1.6)*.1,.11,a+.55+Math.sin(r*1.6)*.1).scale.set(1.2,.9,.9);const o=xi(i.o)[0];o&&su(e,t,o.x,o.z,.8+i.grow.garden*.06)},3:()=>{},4:(e,t,n)=>{const i=e.add(e.style.box(1.4,.9,.05),e.mat("#2b3a2f"),t,n.x,.45,.3);i.rotation.x=-.15,e.add(e.style.box(1.5,.06,.08),e.mat(Ke),t,n.x,.03,.36)},5:(e,t,n)=>{const i=.03+e.style.pictureZ;e.add(e.style.box(2.6,1,.02),e.mat("#6b4a32"),t,n.x,1,i);for(let a=0;a<12;a++)e.add(e.style.box(.14,.14,.01),e.mat("#e8d6b0"),t,n.x-1.1+a%6*.44,.75+Math.floor(a/6)*.5,i+.015);const s=n.x+2.4;e.add(e.style.ball(.22),e.mat("#c98a3e"),t,s,.25,.4).scale.z=.6,e.add(e.style.cylinder(.025,1.1),e.mat(Ke),t,s,.8,.35).rotation.x=-.2},6:(e,t,n,i)=>{const{x:s,z:a}=i.o.tree;e.add(e.style.box(.4,.04,.25),e.mat("#b08a3c"),t,s+.95,.2,a+.3);for(let o=0;o<3;o++)e.add(e.style.cylinder(.025,.07),e.style.material("#cfe8c3",{opacity:.8}),t,s+.83+o*.12,.26,a+.3)},7:(e,t,n)=>{Hx(e,t,n.x-1,n.x+1,n.z-.6,n.z+.6),o0(e,t,n.x,n.z,1.6,1,"#2a9d8f")},8:(e,t,n,i)=>{for(const s of xi(i.o).slice(1))su(e,t,s.x,s.z,.8+i.grow.garden*.06)},9:(e,t,n)=>{e.add(e.style.box(1,.12,.35),e.mat(Ke),t,n.x,.06,n.z);for(let i=0;i<12;i++){const s=n.x-.4+i%6*.16,a=n.z-.08+Math.floor(i/6)*.16;e.add(e.style.cylinder(.05,.02),e.mat("#3b2a1e"),t,s,.13,a),e.add(e.style.ball(.02),e.mat("#e8d6b0"),t,s,.15,a)}},10:(e,t,n)=>{e.add(e.style.cylinder(.45,.55),e.mat("#c98a4e"),t,n.x,.27,n.z),e.add(e.style.cylinder(.32,.02),e.mat("#2b3a4a"),t,n.x,.56,n.z);for(const i of[-1,1])e.add(e.style.cylinder(.04,1.2),e.mat(Ke),t,n.x+i*.45,.6,n.z);e.add(e.style.cylinder(.03,1),e.mat(Ke),t,n.x,1.2,n.z).rotation.z=Math.PI/2,e.add(e.style.cylinder(.1,.06),e.mat(N.metal),t,n.x,1.15,n.z).rotation.x=Math.PI/2},11:(e,t,n)=>{Ul(e,t,n,Ke,"#8a5a3c"),e.add(e.style.box(.35,.18,.15),e.mat(N.dark),t,n.x-.1,.48,n.z),e.add(e.style.box(.08,.12,.12),e.mat(N.dark),t,n.x+.12,.62,n.z),e.add(e.style.cylinder(.08,.5),e.mat("#2a9d8f"),t,n.x+.25,.47,n.z+.25).rotation.z=Math.PI/2},12:(e,t,n)=>{const i=e.add(e.style.box(3.2,.03,.9),e.style.material("#5aa9a0",{emissive:"#5aa9a0",ei:.1}),t,n.x,.02,n.z);i.rotation.y=.3;const s=e.add(e.style.capsule(.14,.9),e.mat(Ke),t,n.x+.2,.1,n.z);s.rotation.z=Math.PI/2,s.scale.y=1,s.rotation.y=.3},13:(e,t,n)=>{for(let i=0;i<3;i++){const s=n.x-i*.7,a=2.6+i*.25,o=n.z+i*.6;e.add(e.style.capsule(.06,.25),e.mat("#fffaf0"),t,s,a,o).rotation.z=Math.PI/2;for(const r of[-1,1])e.add(e.style.box(.05,.02,.35),e.mat(N.dark),t,s,a+.03,o+r*.2);e.add(e.style.box(.12,.02,.02),e.mat("#f28c28"),t,s+.25,a,o)}},14:(e,t,n)=>{Ar(e,t,n,(i,s)=>{e.add(e.style.cylinder(.1,.25),i,t,n.x,s+.12,n.z),e.add(e.style.cap(.22,.55),i,t,n.x,s+.25,n.z).rotation.x=Math.PI,e.add(e.style.cylinder(.22,.25),i,t,n.x,s+.42,n.z)})}};function h3(e,t,n,i,s,a,o){e.add(e.style.box(.26,.32,.02),e.mat(o?N.gold:N.dark),t,n,i,s),e.add(e.style.box(.2,.26,.01),e.mat(a%2?"#d8d2c6":"#9a958c"),t,n,i,s+.015),e.add(e.style.ball(.05),e.mat(a%2?"#3a3530":"#1d1a17"),t,n,i+.04,s+.02).scale.z=.2,e.add(e.style.box(.1,.08,.01),e.mat(a%2?"#3a3530":"#1d1a17"),t,n,i-.06,s+.02)}const Vx=(e,t)=>{const n=e.tree;return t===2||t===6?n:t===9?{x:n.x,z:n.z-2.4}:_i(e)[Math.min(t,14)]??e.door};function p3(e){wr(e,e.k.pal.terrace,["#2a9d8f","#e9c46a","#f28c28"]),Tr(e,u3,Vx);const t=_i(e.o)[4]?.x??e.o.x0+e.o.W/2;Er(e,{xa:t+1.1,xb:e.o.mainDesk.x-.6,y:1.25},h3)}function m3(e){const t=ze(e.name),[n,i]=nu[t%3]??nu[0];e.add(e.style.capsule(.06,.3),e.mat(n),e.body,0,.74,.12).rotation.z=Math.PI/2;for(let s=0;s<3;s++)e.add(e.style.ball(.03),e.mat(i),e.body,-.12+s*.12,.76,.18)}const x3={id:"sahel",pal:c3,shell:l3,island:d3,lounge:f3,desk:(e,t,n)=>yr(e,t,n,{chair:Ke}),mainDesk:e=>br(e,"#8a5a3c",Ke),tree:({k:e},t,n,i,s)=>{su(e,t,n,i,s)},growth:p3,pieceAt:Vx,wear:m3},Jn={flat:0,funbox:0,qp:0,curb:3,rail:5,ramp:7,stairs:9,ledge:9,bowl:11,vert:13},Oa=(e,t)=>Jn[t]<=e&&!(t==="qp"&&e>=Jn.vert),r0=(e,t)=>t>=Jn.vert?e.qp.r13:e.qp.r,au=(e,t)=>{const n=Math.max(0,Math.min(t,e));return t-Math.sqrt(Math.max(0,t*t-n*n))};function sl(e,t){const{xa:n,xb:i,r:s}=e.ramp;return t<n+s?au(n+s-t,s):t>i-s?au(t-(i-s),s):0}function Ol(e,t,n){const i=Math.abs(t-e.x)-(e.hw-e.rc),s=Math.abs(n-e.z)-(e.hd-e.rc);return e.rc-Math.hypot(Math.max(i,0),Math.max(s,0))-Math.min(Math.max(i,s),0)}function Wx(e,t){if(t<=0)return 0;if(t>=e.depth)return-e.depth;const n=e.depth-t;return-Math.sqrt(e.depth*e.depth-n*n)}function al(e,t,n){const i=Math.cos(n),s=Math.sin(n);let a=0,o=Math.max(e.hw,e.hd);for(let r=0;r<24;r++){const c=(a+o)/2;Ol(e,e.x+i*c,e.z+s*c)>t?a=c:o=c}return{x:e.x+i*a,z:e.z+s*a}}const mo=(e,t)=>({box:e,top:t,flat:!1}),xo=(e,t)=>({box:e,top:()=>t,flat:!0}),kx=.55,ou={curb:.35,rail:.05,ledge:.6};function g3(e,t){const n=[];for(const o of e.poles)n.push(xo({x0:o.x-.05,x1:o.x+.05,z0:o.z-.05,z1:o.z+.05},3));for(const o of e.benches)n.push(xo(o,.35));const i=e.funbox;n.push(mo({x0:i.x-i.hw-i.run,x1:i.x+i.hw+i.run,z0:i.z-i.hd,z1:i.z+i.hd},o=>{const r=Math.abs(o-i.x);return r<=i.hw?i.h:i.h*Math.max(0,1-(r-i.hw)/i.run)}));const s=e.qp,a=r0(e,t);n.push(mo({x0:s.x0,x1:s.x1,z0:s.zLip-kx,z1:s.zLip+a},(o,r)=>r<=s.zLip?a:au(s.zLip+a-r,a)));for(const o of["curb","rail","ledge"]){if(!Oa(t,o))continue;const r=e[o];n.push(xo({x0:r.x0,x1:r.x1,z0:r.z-ou[o]/2,z1:r.z+ou[o]/2},r.h))}if(Oa(t,"ramp")){const o=e.ramp;n.push(mo({x0:o.xa-.6,x1:o.xb+.6,z0:o.z0,z1:o.z1},r=>r<=o.xa||r>=o.xb?o.r:sl(e,r)))}if(Oa(t,"stairs")){const o=e.stairs;n.push(xo({x0:o.x0,x1:o.bankX0,z0:o.z0,z1:o.z1},o.h)),n.push(mo({x0:o.bankX0,x1:o.xTop,z0:o.z0,z1:o.bankZ},(l,d)=>d<=o.z1?o.h:o.h*(o.bankZ-d)/(o.bankZ-o.z1)));const r=(o.xBottom-o.xTop)/4;for(let l=0;l<4;l++)n.push(xo({x0:o.xTop+r*l,x1:o.xTop+r*(l+1),z0:o.z0,z1:o.z1},o.h-(l+1)*(o.h/5)));const c=Xx(o);n.push(mo({x0:o.xTop,x1:o.xBottom,z0:o.railZ-.03,z1:o.railZ+.03},l=>c.top+(c.low-c.top)*(l-o.xTop)/(o.xBottom-o.xTop)))}return n}const Xx=e=>({top:e.h+.4,low:.55}),Jh=(e,t,n)=>Math.max(t,Math.min(n,e));function $x(e,t,n,i,s){let a=Oa(t,"bowl")?Wx(e.bowl,Ol(e.bowl,n,i)):0;for(const o of Qx(e,t)){const r=o.box;n<r.x0-s||n>r.x1+s||i<r.z0-s||i>r.z1+s||(a=Math.max(a,o.top(Jh(n,r.x0,r.x1),Jh(i,r.z0,r.z1))))}return a}const Qn=(e,t,n,i)=>$x(e,t,n,i,0);function cc(e,t,n,i){let s=Oa(t,"bowl")?Wx(e.bowl,Ol(e.bowl,n,i)):0;for(const a of Qx(e,t)){const o=a.box;a.flat||n<o.x0||n>o.x1||i<o.z0||i>o.z1||(s=Math.max(s,a.top(n,i)))}return s}const _3=.35,fr=e=>(e%2===0?-1:1)*_3,v3=.45,wa=.45,qx=(e,t)=>e[t].z-ou[t]/2-v3,c0=e=>(e.z0+e.z1)/2-.2,Yx=(e,t)=>({x:(e.ramp.xa+e.ramp.xb)/2+fr(t)*.6,z:e.ramp.z1+.6}),Zx=(e,t,n)=>({x:(e.qp.x0+e.qp.x1)/2+fr(n),z:e.qp.zLip+r0(e,t)+2.2});function Ws(e,t,n,i,s){switch(n){case"flat":{const a=e.flat;return{x:i===1?a.x0:a.x1,z:a.z+fr(s)}}case"curb":case"rail":case"ledge":{const a=e[n];return{x:i===1?a.x0-wa:a.x1+wa,z:qx(e,n)}}case"stairs":{const a=e.stairs;return{x:(a.bankX0+a.xTop)/2,z:a.bankZ+.5}}case"funbox":{const a=e.funbox,o=a.hw+a.run+.6;return{x:i===1?a.x-o:a.x+o,z:a.z+fr(s)*.6}}case"ramp":return Yx(e,s);case"qp":case"vert":return Zx(e,t,s);case"bowl":return{x:e.bowl.x-e.bowl.hw-.5,z:e.bowl.z-.6}}}function ur(e,t,n,i,s){switch(n){case"flat":case"curb":case"rail":case"ledge":case"funbox":return Ws(e,t,n,i===1?-1:1,s);case"stairs":{const a=e.stairs;return{x:a.xBottom+1.35,z:c0(a)}}case"bowl":return{x:e.bowl.x-e.bowl.hw-.5,z:e.bowl.z+.6};case"ramp":case"qp":case"vert":return Ws(e,t,n,i,s)}}const M3=e=>e==="ramp"?4.5:e==="bowl"?2:0;function l0(e){const t=e.stairs,n=(t.bankX0+t.xTop)/2,i=c0(t),s=[{x:n,z:t.bankZ+.5}];for(let a=0;a<=6;a++){const o=a/6,r=1-o;s.push({x:r*r*n+2*r*o*n+o*o*(t.xTop-.5),z:r*r*(i+.5)+2*r*o*i+o*o*i})}return s}const y3=(e,t)=>t==="stairs"?d0(l0(e)):0,Pi=.1,Qh=.35,lc=.25,b3=new Map,S3=new Map,Kx=(e,t)=>{const n=e.area;return`${String(n.x0)},${String(n.x1)},${String(n.z0)},${String(n.z1)}|${String(t)}`};function Jx(e,t,n){const i=e.get(t);if(i!==void 0)return i;const s=n();return e.set(t,s),e.size>2&&e.delete(e.keys().next().value),s}function Qx(e,t){return Jx(S3,Kx(e,t),()=>g3(e,t))}function w3(e,t){return Jx(b3,Kx(e,t),()=>{const n=e.area,i=Math.ceil((n.x1-n.x0)/Pi),s=Math.ceil((n.z1-n.z0)/Pi),a=new Uint8Array(i*s),o=Oa(t,"bowl");for(let r=0;r<s;r++)for(let c=0;c<i;c++){const l=n.x0+(c+.5)*Pi,d=n.z0+(r+.5)*Pi,f=l>n.x0+lc&&l<n.x1-lc&&d>n.z0+lc&&d<n.z1-lc,u=o&&Ol(e.bowl,l,d)>-Qh;a[r*i+c]=f&&!u&&$x(e,t,l,d,Qh)<=.001?1:0}return{x0:n.x0,z0:n.z0,nx:i,nz:s,free:a,paths:new Map}})}const jx=(e,t)=>[Math.floor((t.x-e.x0)/Pi),Math.floor((t.z-e.z0)/Pi)],Wo=(e,t,n)=>t>=0&&n>=0&&t<e.nx&&n<e.nz&&e.free[n*e.nx+t]===1,tg=(e,t,n)=>({x:e.x0+(t+.5)*Pi,z:e.z0+(n+.5)*Pi});function jh(e,t){const[n,i]=jx(e,t);for(let s=0;s<12;s++){let a=null,o=1/0;for(let r=i-s;r<=i+s;r++)for(let c=n-s;c<=n+s;c++){if(Math.max(Math.abs(c-n),Math.abs(r-i))!==s||!Wo(e,c,r))continue;const l=tg(e,c,r),d=Math.hypot(l.x-t.x,l.z-t.z);d<o&&(o=d,a=[c,r])}if(a)return a}return null}function E3(e,t,n){const i=e.nx*e.nz,s=new Float64Array(i).fill(1/0),a=new Int32Array(i).fill(-1),o=new Uint8Array(i),r=[],c=(m,_)=>{r.push([m,_]);let x=r.length-1;for(;x>0;){const p=x-1>>1;if(r[p][0]<=m)break;[r[p],r[x]]=[r[x],r[p]],x=p}},l=()=>{const m=r[0],_=r.pop();if(r.length>0&&_){r[0]=_;let x=0;for(;;){const p=x*2+1,v=p+1;let y=x;if(p<r.length&&r[p][0]<r[y][0]&&(y=p),v<r.length&&r[v][0]<r[y][0]&&(y=v),y===x)break;[r[y],r[x]]=[r[x],r[y]],x=y}}return m},d=(m,_)=>{const x=Math.abs(m-n[0]),p=Math.abs(_-n[1]);return Math.max(x,p)+(Math.SQRT2-1)*Math.min(x,p)},f=t[1]*e.nx+t[0],u=n[1]*e.nx+n[0];for(s[f]=0,c(d(t[0],t[1]),f);;){const m=l();if(!m)return null;const _=m[1];if(o[_]===1)continue;if(o[_]=1,_===u)break;const x=_%e.nx,p=(_-x)/e.nx;for(let v=-1;v<=1;v++)for(let y=-1;y<=1;y++){if(y===0&&v===0)continue;const g=x+y,b=p+v;if(!Wo(e,g,b)||y!==0&&v!==0&&(!Wo(e,x+y,p)||!Wo(e,x,p+v)))continue;const S=b*e.nx+g,T=(s[_]??0)+(y!==0&&v!==0?Math.SQRT2:1);T<(s[S]??1/0)&&(s[S]=T,a[S]=_,c(T+d(g,b),S))}}const h=[];for(let m=u;m!==-1;m=a[m]??-1){const _=m%e.nx;h.push(tg(e,_,(m-_)/e.nx))}return h.reverse()}function T3(e,t,n){const i=Math.ceil(Math.hypot(n.x-t.x,n.z-t.z)/(Pi/2));for(let s=0;s<=i;s++){const[a,o]=jx(e,{x:t.x+(n.x-t.x)*s/Math.max(1,i),z:t.z+(n.z-t.z)*s/Math.max(1,i)});if(!Wo(e,a,o))return!1}return!0}function A3(e,t){const n=[];let i=0;const s=t[0];if(!s)return n;for(n.push(s);i<t.length-1;){let a=t.length-1;for(;a>i+1&&!T3(e,t[i],t[a]);)a--;n.push(t[a]),i=a}return n}const z3=.4;function R3(e){if(e.length<3)return[...e];const t=[e[0]];for(let n=1;n<e.length-1;n++){const i=e[n-1],s=e[n],a=e[n+1],o=Math.hypot(s.x-i.x,s.z-i.z),r=Math.hypot(a.x-s.x,a.z-s.z),c=Math.min(z3,o/2,r/2),l={x:s.x+(i.x-s.x)*c/o,z:s.z+(i.z-s.z)*c/o},d={x:s.x+(a.x-s.x)*c/r,z:s.z+(a.z-s.z)*c/r};for(let f=0;f<=4;f++){const u=f/4,h=1-u;t.push({x:h*h*l.x+2*h*u*s.x+u*u*d.x,z:h*h*l.z+2*h*u*s.z+u*u*d.z})}}return t.push(e[e.length-1]),t}function eg(e,t,n,i){const s=w3(e,t),a=`${n.x.toFixed(3)},${n.z.toFixed(3)}>${i.x.toFixed(3)},${i.z.toFixed(3)}`,o=s.paths.get(a);if(o)return o;const r=jh(s,n),c=jh(s,i),l=r&&c?E3(s,r,c):null,d=l?R3(A3(s,[n,...l,i])):[n,i];return s.paths.set(a,d),d}const d0=e=>{let t=0;for(let n=1;n<e.length;n++)t+=Math.hypot(e[n].x-e[n-1].x,e[n].z-e[n-1].z);return t};function Rd(e,t){let n=Math.max(0,t);for(let i=1;i<e.length;i++){const s=e[i-1],a=e[i],o=Math.hypot(a.x-s.x,a.z-s.z);if(n<=o||i===e.length-1){const r=o>0?Math.min(1,n/o):1;return{x:s.x+(a.x-s.x)*r,z:s.z+(a.z-s.z)*r}}n-=o}return e[0]??{x:0,z:0}}const C3=10*6e4,P3=240,L3=181,I3=30,D3=61;function Fl(e){let t=2166136261;for(let n=0;n<e.length;n++)t=Math.imul(t^e.charCodeAt(n),16777619);return t>>>0}function N3(e,t){return I3+Fl(`${e}#${String(t)}`)%D3}function U3(e,t){const n=Fl(e),i=P3+n%L3,s=t+n%i,a=Math.floor(s/i);return s-a*i<N3(e,a)?{k:"snack",at:"island",key:a,fruit:(n+a)%3}:{k:"nap",at:"lounge"}}function O3(e,t,n){const i=e.main?"main":"desk";if(e.phase==="stopped")return{k:"stopped",at:i};if(e.status==="done")return{k:"done",at:"terrace"};if(e.status==="failed")return{k:"failed",at:i};const s=t.cards.filter(o=>o.agent===e.name);if(e.waits>0||e.waiting_on?.who==="you"||s.length>0)return s.some(o=>o.urgent)?{k:"asks",at:i,urgent:!0}:{k:"asks",at:i};if(!e.main){const o=t.places.find(r=>r.id===e.place_id)?.landing;if(o!=null&&o>0)return{k:"landing",at:"queue",rank:o}}if(e.phase==="starting")return{k:"starting",at:e.main?"main":"door"};const a=e.doing?.kind;return e.main?e.status==="working"?tp({k:"main",at:"main"},a,!1):{k:"mainidle",at:"main"}:e.status==="working"?tp((e.turn_ms??0)>C3?{k:"hot",at:"desk"}:{k:"work",at:"desk"},a,!0):e.status==="blocked"?{k:"blocked",at:"desk"}:e.waiting_on?.who==="agent"?{k:"waitagent",at:"desk",on:e.waiting_on.name}:a==="build"?{k:"work",at:"desk",doing:a}:e.status==="waiting"||e.watching.length>0?{k:"sleep",at:"desk"}:U3(e.name,n)}function tp(e,t,n){return t===void 0?e:{...e,doing:t,...t==="think"&&n?{at:"board"}:{}}}function F3(e,t){const n=new Map;for(const i of e.agents)i.archived||n.set(i.name,O3(i,e,t));return n}const ep=14,Cd={drop_in:.9,pump:1.1,rock_to_fakie:1.1,axle_stall:1.1,fs_180:1.1,bs_180:1.1,ollie:.7,kickflip:.8,heelflip:.8,shove_it:.8,tre_flip:.9,fifty:1.1,five_o:1.1,boardslide:1.1,nosegrind:1.1,manual:1.3,no_comply:.8,carve:1.5,fs_air:1.1,nine:1.8},Pd=1.5,np={flat:["manual","no_comply","ollie","kickflip","heelflip","shove_it"],funbox:["ollie","manual","kickflip"],qp:["fs_air","axle_stall"],curb:["fifty","five_o","nosegrind"],rail:["fifty","boardslide"],ledge:["fifty","five_o","boardslide","nosegrind"],stairs:["ollie","kickflip","heelflip","shove_it"],ramp:["fs_air","fs_180","bs_180","axle_stall","rock_to_fakie","fifty","fs_air","pump"],bowl:["carve","carve","fs_air"],vert:["fs_air","axle_stall"]},B3=new Set(["drop_in","pump","carve","manual"]),dc=8,Ld=12,Id=24,Fa=2,G3=2,H3=600,V3=900,W3=1.5,k3=3.2,X3=.6;function $3(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let n=t;return n=Math.imul(n^n>>>15,n|1),n^=n+Math.imul(n^n>>>7,n|61),((n^n>>>14)>>>0)/4294967296}}const ru=(e,t)=>e[Math.min(e.length-1,Math.floor(t*e.length))];function q3(e){return Object.keys(Jn).filter(t=>Jn[t]<=e&&!(t==="qp"&&e>=Jn.vert))}function Y3(e){return e.dow===0&&e.stage>=Jn.bowl&&Math.floor((e.day+4)/7)%4===0}const Z3=(e,t,n)=>Math.floor(Date.UTC(e,t-1,n)/864e5);function K3(e,t,n,i){const s=new Map,a=t.park;if(!i||i.reduced||!a||a.spots.length===0)return s;const o=Y3(i),r=Math.floor(n/H3),c=[...e].filter(([,u])=>u.k==="nap"||u.k==="snack").map(([u])=>u),l=o?a.spots.length:Math.min(G3,a.spots.length),d=c.map(u=>({name:u,h:Fl(`${u}|${String(r)}`)})).sort((u,h)=>u.h-h.h||(u.name<h.name?-1:1)).slice(0,l).map(u=>u.name).sort(),f=i.jobs===V3&&i.stage>=Jn.vert;return d.forEach((u,h)=>s.set(u,{kind:"skate",slot:h,pool:o,nine:f&&h===0,stage:i.stage})),s}function J3(e,t,n){if(e==="ramp"){const i=2+Math.floor(t()*2);return["drop_in",...Array.from({length:i},()=>ru(np.ramp,t()))]}return e==="bowl"?["carve","carve",t()<.5?"fs_air":"carve"]:e==="stairs"&&n?["tre_flip"]:[ru(np[e],t())]}function Q3(e,t,n,i){const s=$3(Fl(`${e}|line|${String(t)}`)),a=dc+s()*(Ld-dc),o=n.pool?["bowl"]:q3(n.stage),r=[];let c=0;const l=i.spots[n.slot]??i.spots[0]??{x:i.area.x0,z:i.area.z0};let d=l,f=null;const u=(x,p,v,y)=>Math.max(X3,(M3(p)+d0(eg(i,n.stage,x,v))+y3(i,y))/k3),h=(x,p,v,y,g)=>{r.push({trick:x,on:p,t0:c,dur:v,bail:y,side:g}),c+=v};if(n.nine&&t%3===0&&o.includes("vert")){h("roll","vert",u(d,null,Ws(i,n.stage,"vert",1,n.slot),"vert"),!1,1);const x=t%2===1;h("nine","vert",Cd.nine*Pd+(x?Fa:0),x,1),d=ur(i,n.stage,"vert",1,n.slot),f="vert"}let m=f;for(let x=0;x<12;x++){const p=o.filter(D=>D!==m||o.length===1).flatMap(D=>D==="bowl"&&o.length>1?[D,D]:[D]),v=ru(p,s()),y=s()<1/8,g=J3(v,s,y),b=s()<.5?1:-1,S=u(d,f,Ws(i,n.stage,v,b,n.slot),v),T=ur(i,n.stage,v,b,n.slot),M=u(T,v,l,null),E=g.map(D=>({k:D,bail:!B3.has(D)&&s()<.1})),A=E.reduce((D,O)=>D+Cd[O.k]*Pd+(O.bail?Fa:0),0);if(c+S+A+M>Ld){if(c+u(d,f,l,null)>=dc)break;continue}h("roll",v,S,!1,b);let R=b;for(const D of E)h(D.k,v,Cd[D.k]*Pd+(D.bail?Fa:0),D.bail,R),v==="ramp"&&(R=R===1?-1:1);if(m=v,d=T,f=v,c+M>=a)break}const _=u(d,f,l,null);return h("roll",null,Math.min(Ld-c,Math.max(_,dc-c)),!1,1),{moves:r,len:c}}function ng(e,t,n,i){const s=Math.max(0,n),a=Math.floor(s/Id),o=s-a*Id,r=Q3(e,a,t,i);if(o>=r.len)return{n:a,line:r,move:null,f:0,into:0,restLeft:Id-o};const c=r.moves.find(d=>o<d.t0+d.dur)??null,l=c?o-c.t0:0;return{n:a,line:r,move:c,f:c&&c.dur>0?l/c.dur:0,into:l,restLeft:0}}function ig(e){const t=e.seg;return e.since-(t.path.len>.01?t.path.len/t.speed:0)}function j3(e,t,n){const i=t.seg.pastime;if(!i||t.moving||!n)return null;const s=ng(e,i,ig(t),n),a=s.move;return!a||a.trick==="roll"||s.into>=W3?null:a.trick}const tE={...pi,floor:"#efe6d6",wall:"#fbf6ec",wallTop:"#e4d6bf",desk:"#c49a6c",deskTop:"#e2c18f",island:"#6cb4ee",islandTop:"#fffaf0",grass:"#e8d3a8",dirt:"#b08a5a",terrace:"#ece2cf",rug:"#ffd166",islandRug:"#f3ecdf"},eE={...mi,floor:"#7d6a55",wall:"#5a4c40",wallTop:"#6a5a4b",desk:"#a77f55",deskTop:"#bf9a6c",island:"#3d78a8",islandTop:"#e8dfcc",grass:"#8a7552",dirt:"#5e4a33",terrace:"#6d5d47",islandRug:"#6b5b4a"},ka={day:"#d8d4cc",night:"#8d8a84"},ip={day:"#c9c4ba",night:"#7c7973"},ks="#8e9399",f0="#5c677d",sp={day:"#9fd68a",night:"#4f7a45"},ap={day:"#e8d3a8",night:"#8a7552"},op={day:"#5fa84a",night:"#3f7a35"},nE=["#ffd166","#f4a259","#f39a4c","#9b8fe0","#6cb4ee"],iE=["#6cb4ee","#ffd166","#2a9d8f"],Bl=e=>e.pal.pendants,u0=e=>e;function Dd(e,t,n,i,s,a,o,r,c){const l=new cs;l.moveTo(0,0),l.absarc(0,a,a,-Math.PI/2,0,!1),l.lineTo(a+o,a),l.lineTo(a+o,0),l.lineTo(0,0);const d=new Zs(l,{depth:s,bevelEnabled:!1,curveSegments:16});d.translate(0,0,-s/2),d.rotateY(Math.PI);const f=new Xt;f.position.set(n,0,i),f.rotation.y=r,t.add(f),e.add(d,c,f,0,0,0);const u=e.add(e.style.cylinder(.05,s),e.mat(ks),f,-a,a,0);return u.rotation.x=Math.PI/2,f}function ol(e,t,n,i,s){const a=new Xt;a.position.set(n,0,i),a.scale.setScalar(s),t.add(a),e.add(e.style.cylinder(.08,2.6),e.mat(N.palmTrunk),a,0,1.3,0);for(let o=0;o<7;o++)e.add(e.style.box(.18,.03,.9),e.mat(o%2?N.leaf[0]:N.leaf[1]),a,Math.sin(o)*.3,2.6,Math.cos(o)*.3).rotation.set(.5*Math.cos(o),o,.5*Math.sin(o))}function sE(e){const{k:t,root:n,o:i}=e,s=u0(i),{style:a,pal:o}=t,{x0:r,D:c,roomX1:l}=s,d=Bl(t),f=l-r,u=t.add(a.box(f,.14,c),a.floor(o.floor,f,c),n,r+f/2,-.05,c/2);u.receiveShadow=!0,t.add(a.box(f+.2,1.9,.2),t.mat(o.wall),n,r+f/2,.95,-.1),t.add(a.box(.2,1.1,c+.2),t.mat(o.wall),n,r-.1,.55,c/2),aE(t,n,r+.3,r+4.5,d),iE.forEach((x,p)=>{const v=t.add(a.box(.08,1.6,.42,.04),t.mat(x),n,r+.12,.8,c-4+p*.6);v.rotation.z=-.15}),hn(t,n,On({x:s.door.x,z:c-.15,hw:.55,hd:.25}),.04,.03,N.mat);const h=t.mat(d?op.night:op.day);for(let x=.2;x<c-.3;x+=.7){if(Math.abs(x-s.pathZ)<.75)continue;t.add(a.ball(.32),h,n,l+.2,.25,x).scale.set(1,.8,1.1)}const m=l,_=s.parkX0;t.add(a.box(_-m,.06,c),t.mat(d?sp.night:sp.day),n,(m+_)/2,0,c/2),t.add(a.box(_-m+.6,.07,1.1),t.mat(d?ap.night:ap.day),n,(m+_)/2,.01,s.pathZ);for(const x of[1.5,c*.55])ol(t,n,(m+_)/2+(x<2?.5:-.5),x,1);oE(t,n,s.park,d,e.grow.stage>=Jn.bowl)}function aE(e,t,n,i,s){const{style:a}=e,o=.01+a.pictureZ,r=i-n,c=1.75,l=.28;nE.forEach((f,u)=>e.add(a.box(r,l,.02),e.mat(s?sg(f):f),t,(n+i)/2,c-l/2-u*l,o));const d=e.add(a.cylinder(.32,.03),e.mat("#fff3c4"),t,n+r*.62,c-3.2*l,o+.02);d.rotation.x=Math.PI/2,d.scale.y=1;for(const f of[.12,.3,.85]){const u=n+r*f;e.add(a.box(.05,.9,.02),e.mat(N.dark),t,u,c-.95,o+.03);for(let h=0;h<5;h++){const m=e.add(a.box(.3,.05,.02),e.mat(N.dark),t,u,c-.5,o+.03);m.rotation.z=(h-2)*.45}}}function sg(e){const t=parseInt(e.slice(1),16),n=i=>Math.round((t>>i&255)*.7).toString(16).padStart(2,"0");return`#${n(16)}${n(8)}${n(0)}`}function oE(e,t,n,i,s){const{style:a}=e,o=n.area,r=e.mat(i?ka.night:ka.day),c=e.mat(i?ip.night:ip.day),l=o.x1-o.x0;e.add(dE(e,n,s),r,t,(o.x0+o.x1)/2,0,(o.z0+o.z1)/2),e.add(a.box(l+.2,.3,.2),c,t,(o.x0+o.x1)/2,.15,o.z0-.1);const d=n.bowl;for(let f=o.z0+2;f<o.z1;f+=2){const h=s&&Math.abs(f-d.z)<d.hd+.4?[[o.x0,d.x-d.hw-.4],[d.x+d.hw+.4,o.x1]]:[[o.x0,o.x1]];for(const[m,_]of h)_-m>.05&&e.add(a.box(_-m,.005,.03),e.mat("#b9b4ab"),t,(m+_)/2,.045,f)}for(const{x:f,z:u}of n.poles)if(e.add(a.cylinder(.045,3),e.mat(f0),t,f,1.5,u),e.add(a.box(.4,.2,.22),a.material("#fff3c4",{emissive:"#fff3c4",ei:i?1.5:.1}),t,f,3,u),i){const h=new ku("#fff3c4",6,9,1.4);h.position.set(f,2.8,u),t.add(h)}for(const f of n.benches)e.add(a.box(f.x1-f.x0,.35,f.z1-f.z0,.05),e.mat("#c49a6c"),t,(f.x0+f.x1)/2,.18,(f.z0+f.z1)/2);rE(e,t,n,r)}function rE(e,t,n,i){const s=n.funbox;e.add(e.style.box(s.hw*2,s.h,s.hd*2),i,t,s.x,s.h/2,s.z);const a=Math.hypot(s.run,s.h);for(const o of[-1,1]){const r=e.add(e.style.box(a,.08,s.hd*2),i,t,s.x+o*(s.hw+s.run/2),s.h/2,s.z);r.rotation.z=-o*Math.atan2(s.h,s.run)}e.add(e.style.box(s.hw*2,.03,.04),e.mat(ks),t,s.x,s.h+.01,s.z-s.hd)}function Nd(e,t,n,i,s){const{style:a}=e,o=n.x1-n.x0,r=(n.x0+n.x1)/2;if(i==="rail"){e.add(a.box(o,.04,.05),e.mat(ks),t,r,n.h,n.z);for(const l of[n.x0+.3,n.x1-.3])e.add(a.box(.05,n.h,.05),e.mat(f0),t,l,n.h/2,n.z);return}const c=i==="curb"?.35:.6;e.add(a.box(o,n.h,c),s,t,r,n.h/2,n.z),e.add(a.box(o,.03,.04),e.mat(ks),t,r,n.h+.01,n.z-c/2)}function cE(e,t,n,i){const s=n.stairs,a=s.z1-s.z0,o=(s.z0+s.z1)/2;e.add(e.style.box(s.xTop-s.x0,s.h,a),i,t,(s.x0+s.xTop)/2,s.h/2,o);const r=(s.xBottom-s.xTop)/4;for(let v=0;v<4;v++){const y=s.h-(v+1)*(s.h/5);e.add(e.style.box(r,y,a),i,t,s.xTop+r*(v+.5),y/2,o)}const c=new cs;c.moveTo(0,0),c.lineTo(s.bankZ-s.z1,0),c.lineTo(0,s.h),c.lineTo(0,0);const l=s.xTop-s.bankX0,d=new Zs(c,{depth:l,bevelEnabled:!1});d.rotateY(-Math.PI/2),e.add(d,i,t,s.xTop,0,s.z1);const{top:f,low:u}=Xx(s),h=s.xBottom-s.xTop,m=Math.hypot(h,f-u),_=e.add(e.style.cylinder(.03,m+.06),e.mat(ks),t,s.xTop+h/2,(f+u)/2,s.railZ);_.rotation.z=Math.PI/2-Math.atan2(f-u,h);const x=s.h,p=s.h/5;for(const[v,y,g]of[[s.xTop+.03,f,x],[s.xBottom-.03,u,p]])e.add(e.style.cylinder(.025,y-g),e.mat(ks),t,v,(y+g)/2,s.railZ)}const go=.04,rp=10,cp=10;function Co(e,t){const n=Math.max(.001,e.rc-t),i=[];return[[1,1],[-1,1],[-1,-1],[1,-1]].forEach(([a,o],r)=>{const c=e.x+a*(e.hw-e.rc),l=e.z+o*(e.hd-e.rc);for(let d=0;d<=rp;d++){const f=r*Math.PI/2+d/rp*(Math.PI/2);i.push({x:c+Math.cos(f)*n,z:l+Math.sin(f)*n})}}),i}function fc(e,t){const n=[],i=(a,o,r)=>{const c=(o[0]??0)-(a[0]??0),l=(o[1]??0)-(a[1]??0),d=(o[2]??0)-(a[2]??0),f=(r[0]??0)-(a[0]??0),u=(r[1]??0)-(a[1]??0),h=(r[2]??0)-(a[2]??0),m=[l*h-d*u,d*f-c*h,c*u-l*f],_=[t[0]-(a[0]??0),t[1]-(a[1]??0),t[2]-(a[2]??0)],x=(m[0]??0)*(_[0]??0)+(m[1]??0)*(_[1]??0)+(m[2]??0)*(_[2]??0)<0;for(const p of x?[a,r,o]:[a,o,r])n.push(p[0]??0,p[1]??0,p[2]??0)};for(let a=0;a+1<e.length;a++){const o=e[a]??[],r=e[a+1]??[];for(let c=0;c<o.length;c++){const l=(c+1)%o.length,d=o[c],f=o[l],u=r[c],h=r[l];!d||!f||!u||!h||(i(d,f,u),i(f,h,u))}}const s=new Le;return s.setAttribute("position",new le(n,3)),s.computeVertexNormals(),s}function lE(e,t,n,i){const s=n.bowl,a=v=>e.mat(i?sg(v):v),o=v=>{const y=s.depth*(1-Math.cos(v)),g=go-s.depth*Math.sin(v);return Co(s,y).map(b=>[b.x,g,b.z])},r=Array.from({length:cp+1},(v,y)=>y/cp*(Math.PI/2)),c=[s.x,go,s.z],l=2;e.add(fc(r.slice(0,l+1).map(o),c),a("#3d6fb6"),t,0,0,0),e.add(fc(r.slice(l).map(o),c),a("#b9bdc3"),t,0,0,0);const d=go-s.depth,f=o(Math.PI/2),u=f.map(([v,,y])=>[s.x+(v-s.x)*.55,d,s.z+(y-s.z)*.55]),h=[s.x,d+1,s.z];e.add(fc([f,u],h),a("#9a9fa6"),t,0,0,0),e.add(fc([u,u.map(()=>[s.x,d,s.z])],h),a("#80858d"),t,0,0,0);const m=Co(s,-.03).map(v=>new q(v.x,go+.02,v.z));e.add(new Vu(new Vm(m,!0),m.length*2,.05,6,!0),e.mat(ks),t,0,0,0);const _=new cs(Co({...s,hw:s.hw+.35,hd:s.hd+.35,rc:s.rc+.35},0).map(v=>new Ct(v.x-s.x,-(v.z-s.z))));_.holes.push(new ar(Co(s,0).map(v=>new Ct(v.x-s.x,-(v.z-s.z)))));const x=new Hu(_,4);x.rotateX(-Math.PI/2);const p=e.add(x,a("#ece8e0"),t,s.x,go+.005,s.z);p.castShadow=!1}function dE(e,t,n){const i=t.area,s=i.x1-i.x0,a=i.z1-i.z0;if(!n)return e.style.box(s,.08,a);const o=(i.x0+i.x1)/2,r=(i.z0+i.z1)/2,c=new cs;c.moveTo(-s/2,-a/2),c.lineTo(s/2,-a/2),c.lineTo(s/2,a/2),c.lineTo(-s/2,a/2),c.lineTo(-s/2,-a/2),c.holes.push(new ar(Co(t.bowl,0).map(d=>new Ct(d.x-o,-(d.z-r)))));const l=new Zs(c,{depth:.08,bevelEnabled:!1});return l.rotateX(-Math.PI/2),l.translate(0,-.04,0),l}function fE(e,t){const{k:n}=e,i=Bl(n),s=n.mat(i?ka.night:ka.day),a=_=>e.stage(Jn[_]),o=a("vert"),r=t.qp,c=o?r.r13:r.r,l=o??a("qp");if(l){const _=kx,x=Dd(n,l,(r.x0+r.x1)/2,r.zLip+c,r.x1-r.x0,c,_,-Math.PI/2,s);o&&n.add(n.style.box(.04,.5,r.x1-r.x0),n.mat(f0),x,-(c+_-.05),c+.25,0)}const d=a("curb");d&&Nd(n,d,t.curb,"curb",s);const f=a("rail");f&&Nd(n,f,t.rail,"rail",s);const u=a("ramp");if(u){const _=t.ramp,x=_.z1-_.z0,p=(_.z0+_.z1)/2;Dd(n,u,_.xa+_.r,p,x,_.r,.6,0,s),Dd(n,u,_.xb-_.r,p,x,_.r,.6,Math.PI,s)}const h=a("stairs");h&&(cE(n,h,t,s),Nd(n,h,t.ledge,"ledge",s));const m=a("bowl");m&&lE(n,m,t,i)}function uE({k:e,root:t,o:n}){const{style:i,pal:s}=e,a=n.island,o=(a.x0+a.x1)/2,r=(a.z0+a.z1)/2,c=a.x1-a.x0,l=a.z1-a.z0;e.add(i.box(c,1.3,l,.12),e.mat(s.island),t,o,.85,r),e.add(i.box(c+.05,.25,l+.05,.08),e.mat(s.islandTop),t,o,1.55,r),e.add(i.box(c*.55,.5,.05),i.material("#fff3c4",{emissive:"#fff3c4",ei:Bl(e)?.8:.1}),t,o,1.05,a.z0-.01),e.add(i.box(c*.6,.05,.3),e.mat(s.islandTop),t,o,.8,a.z0-.12);for(const d of[-c/3,c/3]){const f=e.add(i.cylinder(.22,.15),e.mat(N.dark),t,o+d,.22,a.z0+.05);f.rotation.x=Math.PI/2}if(["#ffd166","#7cc26b","#f28c28"].forEach((d,f)=>e.add(i.box(.22,.06,.14),e.mat(d),t,o-.5+f*.5,.86,a.z0-.15)),s.pendants){const d=new ku("#ffcf8a",3.2,4.5,1.6);d.position.set(o,1.6,a.z0-.8),t.add(d)}}function Ti(e,t){const n=u0(e),i=n.park,s=(n.roomX1+n.parkX0)/2,a=n.island,o=[n.door,{x:n.x0+.5,z:n.D-.6},{x:a.x1+.5,z:a.z0+.3},{x:(i.curb.x0+i.curb.x1)/2,z:i.curb.z},{x:(n.boardSpots[2]??n.door).x,z:.9},{x:(i.rail.x0+i.rail.x1)/2,z:i.rail.z},{x:n.roomX1-.6,z:n.D*.5},{x:(i.ramp.xa+i.ramp.xb)/2,z:(i.ramp.z0+i.ramp.z1)/2},{x:s,z:n.D*.3},{x:(i.stairs.xTop+i.stairs.xBottom)/2,z:(i.stairs.z0+i.stairs.z1)/2},{x:s,z:n.pathZ+1.6},{x:i.bowl.x,z:i.bowl.z},{x:n.x0-1.9,z:n.D*.55},{x:(i.qp.x0+i.qp.x1)/2,z:i.qp.zLip+.8},{x:s,z:n.pathZ-1.4}];return o[Math.min(t,o.length-1)]??n.door}function hE(e){const{k:t,o:n,grow:i}=e,s=u0(n),{style:a,pal:o}=t,r=e.stage(0);if(!r)return;const c=T=>e.stage(T);fE(e,s.park);const l=(s.roomX1+s.parkX0)/2,d=c(1);d&&hn(t,d,{x0:s.x0+.4,x1:s.x0+5.2,z0:s.D+.3,z1:s.D+4.4},.08,0,o.terrace);const f=s.furniture.filter(T=>T.of!==void 0&&s.terrace.some(M=>M.x===T.of?.x&&M.z===T.of.z)),u=[0,1,1,1,2,2,2,4,4,4,8][Math.min(i.stage,10)]??8;f.forEach((T,M)=>{if(M>=u)return;const E=[1,4,7,7,10,10,10,10][M]??0;Dl(t,c(E)??r,T,M%2?"#ffd166":"#6cb4ee")});const h=c(1);if(h){const T=Ti(s,1);t.add(a.cylinder(.2,.34),t.mat(N.pot),h,T.x,.17,T.z);for(let M=0;M<6;M++)t.add(a.box(.07,.5,.12),t.mat("#6fa88a"),h,T.x,.55,T.z).rotation.set(Math.cos(M)*.6,M*1.05,Math.sin(M)*.6)}const m=c(2);if(m){const T=Ti(s,2);t.add(a.box(.5,.3,.4),t.mat(N.crate),m,T.x,.15,T.z);for(let M=0;M<6;M++)t.add(a.ball(.07),t.mat(M%2?"#7cc26b":N.orange),m,T.x-.15+M%3*.15,.34,T.z-.08+Math.floor(M/3)*.16);ol(t,m,l+.5,s.D*.8,.9)}const _=c(4);if(_){const T=Ti(s,4).x,M=a.pictureZ;t.add(a.box(1.8,.95,.05),t.mat("#c49a6c"),_,T,1.05,.02+M),t.add(a.box(1.68,.83,.02),t.mat("#2f4a3a"),_,T,1.05,.05+M);for(let E=0;E<5;E++){const A=.4+ze(`chalk${String(E)}`)%50/100;t.add(a.box(A,.04,.01),t.mat(["#fffaf0","#ffd166","#8fd3ff"][E%3]??"#fffaf0"),_,T-.7+A/2,1.35-E*.14,.065+M)}}const x=c(5);if(x){const T=s.island,M=T.z0+xr(s,i.stage)-.6;t.add(a.box(.55,.28,.2),t.mat(N.dark),x,(T.x0+T.x1)/2,1.8,M)}const p=c(6);if(p){const T=Ti(s,6);t.add(a.box(.5,.35,.35,.05),t.mat("#6cb4ee"),p,T.x-.4,.18,T.z),t.add(a.box(.52,.06,.37),t.mat("#fffaf0"),p,T.x-.4,.38,T.z);for(let M=.8;M<s.D-.6;M+=1.3)Math.abs(M-s.pathZ)<.8||t.add(a.box(.14,.14,.14),t.mat(M%2.6<1.3?N.orange:"#9b8fe0"),p,s.roomX1+.55,.35,M)}const v=c(7);if(v){const T=s.x0+5.6,M=s.D+1.9;t.add(a.cylinder(.03,1.8),t.mat(o.ink),v,T,.9,M),t.add(a.cap(.75,.35),t.mat("#ffd166"),v,T,1.75,M)}const y=c(8);if(y)for(const T of[s.D*.3,s.D-1])ol(t,y,l-.6,T,1.05);const g=c(10);if(g){const T=Ti(s,10);t.add(a.box(.7,.05,.7),t.mat("#c49a6c"),g,T.x,.05,T.z),t.add(a.cylinder(.04,2),t.mat(N.metal),g,T.x-.25,1,T.z),t.add(a.box(.3,.04,.12),t.mat(N.metal),g,T.x-.12,2,T.z)}const b=c(12);if(b){const T=Ti(s,12),M=t.add(a.cylinder(1,.04),t.mat("#6cb4ee"),b,T.x,0,T.z);M.scale.z=.7;const E=t.add(a.box(.08,1.4,.4,.04),t.mat("#ffd166"),b,T.x+.9,.6,T.z-.6);E.rotation.z=.2}const S=c(ep);if(S){const T=Ti(s,ep),M=a.material(N.gold,{emissive:N.gold,ei:.15});t.add(a.box(.7,.5,.5),t.mat(pE(t)),S,T.x,.25,T.z);const E=t.add(a.box(.28,.04,.95,.03),M,S,T.x,1,T.z);E.rotation.x=Math.PI/2-.25,js(t,S,T.x,1,T.z+.05,t.pal.ink,.04)}Ll(t,r,s,i),mE(t,r,s,i),i.building&&i.stage<14&&Il(t,r,Ti(s,i.stage+1))}const pE=e=>Bl(e)?ka.night:ka.day;function mE(e,t,n,i){if(i.frames===0)return;const{style:s}=e,a=(n.boardSpots[2]?.x??n.x0+5.5)+1.1,o=n.mainDesk.x-.6,r=.3,c=Math.max(1,Math.floor((o-a)/r));for(let l=0;l<i.frames;l++){const d=l%c,u=1.3-Math.floor(l/c)*.62;if(u<.5)break;const h=i.golden&&l===0?N.gold:N.mural[l%N.mural.length]??N.paper;e.add(s.box(.2,.58,.03,.06),e.mat(h),t,a+r/2+d*r,u,.03+s.pictureZ)}}const xE={id:"california",pal:e=>e?eE:tE,shell:sE,island:uE,lounge:gr,desk:(e,t,n)=>kf.desk(e,t,n),mainDesk:(e,t)=>kf.mainDesk(e,t),tree:({k:e},t,n,i,s)=>{ol(e,t,n,i,s)},growth:hE,pieceAt:Ti,pits:(e,t)=>t>=Jn.bowl&&e.park?[gE(e.park.bowl)]:[]};function gE(e){return{x0:e.x-e.hw-.1,x1:e.x+e.hw+.1,z0:e.z-e.hd-.1,z1:e.z+e.hd+.1}}const _E={loft:kf,greenhouse:OS,campus:VS,workshop:qS,kyoto:QS,riad:ew,nordic:dw,patio:zw,haveli:Bw,tropical:Kw,cyclades:r3,sahel:x3,california:xE},cu=e=>_E[e],vE=(e,t,n)=>new Ja(Math.max(.01,e),Math.max(.01,t),Math.max(.01,n));function ME(e){const t=document.createElement("canvas");t.width=4,t.height=32;const n=t.getContext("2d"),i=new ee(e);n&&(n.fillStyle="#"+i.getHexString(),n.fillRect(0,0,4,32),n.fillStyle="#"+i.clone().multiplyScalar(.93).getHexString(),n.fillRect(0,0,4,1));const s=new Gm(t);return s.magFilter=s.minFilter=We,s.colorSpace=ln,s.wrapS=s.wrapT=tr,s}function yE(e,t,n,i){const s=Math.max(.004,Math.min(i,e/2-.001,n/2-.001,t/2)),a=new cs,o=-e/2,r=-n/2;a.moveTo(o+s,r),a.lineTo(o+e-s,r),a.quadraticCurveTo(o+e,r,o+e,r+s),a.lineTo(o+e,r+n-s),a.quadraticCurveTo(o+e,r+n,o+e-s,r+n),a.lineTo(o+s,r+n),a.quadraticCurveTo(o,r+n,o,r+n-s),a.lineTo(o,r+s),a.quadraticCurveTo(o,r,o+s,r);const c=new Zs(a,{depth:Math.max(.01,t-s),bevelEnabled:!0,bevelThickness:s/2,bevelSize:s*.4,bevelSegments:3,curveSegments:6});return c.rotateX(-Math.PI/2),c.translate(0,-t/2+s/4,0),c.computeVertexNormals(),c}const _o=20,bE={name:"clay",shadows:!0,antialias:!0,pictureZ:.09,maxPixelRatio:2,material(e,t={}){const n=t.opacity!==void 0;return t.flat?new wl({color:new ee(e),transparent:n,opacity:t.opacity??1}):new lr({color:new ee(e),roughness:.95,metalness:0,emissive:new ee(t.emissive??"#000000"),emissiveIntensity:t.ei??(t.emissive?1:0),transparent:n,opacity:t.opacity??1})},floor(e,t,n){const i=ME(e);return i.repeat.set(t/2,n*2),new lr({color:16777215,map:i,roughness:.95,metalness:0})},box:(e,t,n,i)=>{const s=Math.max(.01,e),a=Math.max(.01,t),o=Math.max(.01,n);return Math.min(s,a,o)<.03?vE(s,a,o):yE(s,a,o,i??Math.min(s,a,o)*.22)},ball:e=>new Jc(e,_o,_o-4),cap:(e,t)=>new Jc(e,_o,_o-4,0,Math.PI*2,0,Math.PI*Math.min(1,t)),capsule:(e,t)=>new Ou(e,t,4,12),cylinder:(e,t)=>new El(e,e,t,_o)},vn=bE;function SE(e,t=!1){const n=e[0].index!==null,i=new Set(Object.keys(e[0].attributes)),s=new Set(Object.keys(e[0].morphAttributes)),a={},o={},r=e[0].morphTargetsRelative,c=new Le;let l=0;for(let d=0;d<e.length;++d){const f=e[d];let u=0;if(n!==(f.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+d+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const h in f.attributes){if(!i.has(h))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+d+'. All geometries must have compatible attributes; make sure "'+h+'" attribute exists among all geometries, or in none of them.'),null;a[h]===void 0&&(a[h]=[]),a[h].push(f.attributes[h]),u++}if(u!==i.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+d+". Make sure all geometries have the same number of attributes."),null;if(r!==f.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+d+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const h in f.morphAttributes){if(!s.has(h))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+d+".  .morphAttributes must be consistent throughout all geometries."),null;o[h]===void 0&&(o[h]=[]),o[h].push(f.morphAttributes[h])}if(t){let h;if(n)h=f.index.count;else if(f.attributes.position!==void 0)h=f.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+d+". The geometry must have either an index or a position attribute"),null;c.addGroup(l,h,d),l+=h}}if(n){let d=0;const f=[];for(let u=0;u<e.length;++u){const h=e[u].index;for(let m=0;m<h.count;++m)f.push(h.getX(m)+d);d+=e[u].attributes.position.count}c.setIndex(f)}for(const d in a){const f=lp(a[d]);if(!f)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+d+" attribute."),null;c.setAttribute(d,f)}for(const d in o){const f=o[d][0].length;if(f!==0){c.morphAttributes=c.morphAttributes||{},c.morphAttributes[d]=[];for(let u=0;u<f;++u){const h=[];for(let _=0;_<o[d].length;++_)h.push(o[d][_][u]);const m=lp(h);if(!m)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+d+" morphAttribute."),null;c.morphAttributes[d].push(m)}}}return c}function lp(e){let t,n,i,s=-1,a=0;for(let l=0;l<e.length;++l){const d=e[l];if(t===void 0&&(t=d.array.constructor),t!==d.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(n===void 0&&(n=d.itemSize),n!==d.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(i===void 0&&(i=d.normalized),i!==d.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(s===-1&&(s=d.gpuType),s!==d.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;a+=d.count*n}const o=new t(a),r=new un(o,n,i);let c=0;for(let l=0;l<e.length;++l){const d=e[l];if(d.isInterleavedBufferAttribute){const f=c/n;for(let u=0,h=d.count;u<h;u++)for(let m=0;m<n;m++){const _=d.getComponent(u,m);r.setComponent(u+f,m,_)}}else o.set(d.array,c);c+=d.count*n}return s!==void 0&&(r.gpuType=s),r}function wE(e){return!(e instanceof lr||e instanceof jm)||e.userData.live===!0||e.transparent||e.map!==null?!1:e.emissiveIntensity===0||e.emissive.r===0&&e.emissive.g===0&&e.emissive.b===0}function dp(e,t,n){const i=e.index!==null?e.toNonIndexed():e.clone();i.applyMatrix4(t);for(const s of Object.keys(i.attributes))s!=="position"&&s!=="normal"&&!(n&&s==="uv")&&i.deleteAttribute(s);return i.hasAttribute("normal")||i.computeVertexNormals(),n&&!i.hasAttribute("uv")&&i.setAttribute("uv",new un(new Float32Array(i.getAttribute("position").count*2),2)),i.morphAttributes={},i}function EE(e,t,n,i){const s=e.getAttribute("position").count,a=new Float32Array(s*3);for(let o=0;o<s;o++)a[o*3]=t,a[o*3+1]=n,a[o*3+2]=i;return e.setAttribute("color",new un(a,3)),e}function TE(e){return e.name==="clay"?new lr({vertexColors:!0,roughness:.95,metalness:0}):new jm({vertexColors:!0})}function Ud(e,t,n){e.updateMatrixWorld(!0);const i=[],s=new Map;let a=0;e.traverseVisible(d=>{if(!(d instanceof Se))return;const f=d.geometry,u=d.material;if(Array.isArray(u))return;if(a++,wE(u)){i.push(EE(dp(f,d.matrixWorld,!1),u.color.r,u.color.g,u.color.b));return}const h="map"in u&&u.map!==null&&u.map!==void 0,m=s.get(u)??[];m.push(dp(f,d.matrixWorld,h)),s.set(u,m)});const o=new Xt,r=[];let c=null;const l=(d,f)=>{const h=(d.length===1?d[0]:void 0)??SE(d,!1);for(const _ of d)_!==h&&_.dispose();if(h===null)return;r.push(h);const m=new Se(h,f);m.castShadow=n,m.receiveShadow=n,o.add(m)};i.length>0&&(c=TE(t),l(i,c));for(const[d,f]of s)l(f,d);return{group:o,baked:c,from:a,to:o.children.length,dispose(){for(const d of r)d.dispose();c?.dispose()}}}const AE=new ee(N.grey),zE=.25;function ag(e,t,n,i,s){const a=i??ux(e,t),o=new Map,r=new Map,c=(Q,St=0)=>{const Pt=`${Q}|${St}`;let yt=o.get(Pt);return yt||(yt=n.material(Q,St>0?{emissive:Q,ei:St}:{}),o.set(Pt,yt),r.set(yt,yt.color.clone())),yt},l=(Q,St,Pt,yt,j,L)=>{const xt=new Se(Q,St);return xt.position.set(yt,j,L),Pt.add(xt),xt},d=new Xt,f=new Xt,u=t?1.18:1;f.scale.setScalar(u),d.add(f),l(n.capsule(.21,.22),c(a.hoodie),f,0,.5,0);const h=new Xt;h.position.set(0,dS,0),f.add(h),l(n.ball(.22),c(a.skin),h,0,0,0);const m=[-.075,.075].map(Q=>l(n.box(.07,.08,.02),c(rc),h,Q,.03,.205)),_=[-.08,.08].map(Q=>l(n.box(.065,.014,.006),c(rc),h,Q,.01,.214)),x=l(n.box(.12,.03,.02),c(rc),h,0,-.05,.205),p=l(n.box(.12,.06,.02),c(xS),h,0,-.06,.207),v=l(n.box(.06,.06,.02),c(rc),h,0,-.08,.205);for(const Q of[-.135,.135])l(n.box(.06,.04,.02),c(gS),h,Q,-.05,.205);const y=Q=>{l(n.cap(.225,.48),c(a.hatColor),h,0,.03,0),l(n.box(.22,.03,.2),c(a.hatColor),h,0,.07,Q?-.22:.21)};switch(a.hat){case"cap":y(!1);break;case"capback":y(!0);break;case"beanie":l(n.cap(.232,.5),c(a.hatColor),h,0,.04,0),l(n.ball(.06),c(N.paper),h,0,.28,0);break;case"afro":{l(n.ball(.27),c(a.hair),h,0,.1,-.05).scale.set(1.05,.85,1);break}case"bun":l(n.cap(.226,.42),c(a.hair),h,0,.02,-.01),l(n.ball(.09),c(a.hair),h,0,.24,-.08);break;case"hair":l(n.cap(.228,.4),c(a.hair),h,0,.02,-.02);break;case"headphones":{l(n.cap(.226,.4),c(a.hair),h,0,.02,-.02);const Q=c(N.dark),St=.262,Pt=7,yt=1.3,j=2*yt/Pt;for(let w=0;w<Pt;w++){const X=-yt+j*(w+.5),K=l(n.box(St*j*1.15,.034,.06,.012),Q,h,St*Math.sin(X),St*Math.cos(X),-.01);K.rotation.z=-X}for(const w of[-1,1]){l(n.box(.03,.07,.035,.01),Q,h,w*.258,.07,-.01);const X=l(n.cylinder(.078,.03),Q,h,w*.222,-.01,-.01);X.rotation.z=Math.PI/2;const K=l(n.cylinder(.086,.055),c(a.hatColor),h,w*.258,-.01,-.01);K.rotation.z=Math.PI/2;const ot=l(n.cylinder(.05,.012),Q,h,w*.288,-.01,-.01);ot.rotation.z=Math.PI/2}const L=new q(-.27,-.05,.03),xt=new q(-.12,-.1,.19),bt=xt.clone().sub(L);l(n.box(.018,.018,bt.length(),.006),Q,h,(L.x+xt.x)/2,(L.y+xt.y)/2,(L.z+xt.z)/2).quaternion.setFromUnitVectors(new q(0,0,1),bt.normalize()),l(n.ball(.026),Q,h,xt.x,xt.y,xt.z);break}case"main":{l(n.cap(.228,.4),c(a.hair),h,0,.02,-.02);const Q=c(N.wheel,.3);l(n.box(.05,.05,.02),Q,f,-.06,.58,.215),l(n.box(.05,.05,.02),Q,f,-.06,.47,.215);for(let St=0;St<3;St++){const Pt=l(n.box(.11,.025,.02),Q,f,.05,.525,.215);Pt.rotation.z=St*Math.PI/3}l(n.box(.3,.03,.03),c(N.gold,.2),f,0,.7,.2);break}}const g=[],b=[];for(const Q of[-1,1]){const St=new Xt;St.position.set(Q*.24,.66,0),f.add(St),l(n.capsule(.065,.2),c(a.hoodie),St,0,-.15,0),l(n.ball(.065),c(a.skin),St,0,-.3,0),g.push(St);const Pt=new Xt;Pt.position.set(Q*.1,.3,0),f.add(Pt),l(n.capsule(.075,.14),c(a.pants),Pt,0,-.12,0),l(n.box(.15,.08,.24),c(N.paper),Pt,0,-.27,.04),b.push(Pt)}const[S,T]=g,[M,E]=b;s?.({style:n,name:e,head:h,body:f,arms:g,legs:b,mat:c,add:l});const A=l(n.box(.4,.3,.3),c(N.crate),f,0,.62,.3);l(n.box(.41,.04,.12),c(N.tape),A,0,.15,0);const R=new Xt;R.position.set(0,-.33,.04),T.add(R);const D=l(n.cylinder(.055,.11),c(N.paper),R,0,0,0),O=l(n.ball(.08),c(N.orange),R,0,0,.02),P=new Xt;R.add(P);const F=l(n.ball(.08),c(N.pineapple),P,0,0,.03);F.scale.y=1.4;const V=c(N.gold,.6),U=F.material,B=l(n.cylinder(.09,.025),c(N.gold,.4),d,0,1.4,0);B.rotation.x=Math.PI/2,l(n.box(.06,.12,.06),c(N.pineLeaf),P,0,.16,.03);const I=new Xt;R.add(I),l(n.box(.2,.01,.14),c(N.paper),I,0,.02,.06);const G=l(n.box(.3,.38,.015),c(N.paper),f,0,.58,.32);G.rotation.x=-.35;const $=new Xt;d.add($),l(n.box(.28,.04,.85),c(N.skate),$,0,.15,0);for(const Q of[-.27,.27]){l(n.box(.38,.04,.07),c(N.truck),$,0,.11,Q);for(const St of[-.21,.21]){const Pt=l(n.cylinder(.065,.08),c(N.wheel),$,St,.065,Q);Pt.rotation.z=Math.PI/2}}const J=l(n.box(.26,.06,.03),c(N.sunglasses),h,0,.04,.215),it=new Xt;d.add(it);for(const[Q,St,Pt]of[[-.12,0,.12],[.06,.04,.15],[.2,-.01,.1]])l(n.ball(Pt),c(N.cloud),it,Q,St,0);it.position.set(0,1.05,.47);const Tt=l(n.box(.04,.16,.04),c(N.marker),R,0,-.02,.03),H=new Xt;f.add(H),H.position.set(0,.62,.34),H.rotation.x=-.3,l(n.box(.46,.32,.015),c(N.paper),H,0,0,0);for(let Q=0;Q<4;Q++)l(n.box(.36,.025,.005),c(N.ink),H,0,.1-Q*.065,.01);const tt=new Xt;R.add(tt),l(n.box(.03,.12,.03),c(N.trunk),tt,0,.06,.05),l(n.box(.16,.16,.025),c(N.glass,.25),tt,0,.19,.05);const k=new Xt;f.add(k),k.position.set(0,1.25,.12),l(n.box(.62,.44,.015),c(N.paper),k,0,0,0),N.mural.slice(0,3).forEach((Q,St)=>l(n.box(.16,.16,.005),c(Q),k,-.18+St*.18,.04,.01));const W=new Xt;d.add(W),W.position.set(-.3,0,.55),l(n.box(.06,.8,.06),c(N.dark),W,0,.4,0),l(n.box(.75,.48,.05),c(N.dark),W,0,1,0),l(n.box(.68,.41,.01),c(N.glass,.6),W,0,1,-.03);const at=new Xt;d.add(at),at.position.set(0,0,.4),l(n.box(.36,.42,.26),c(N.dark),at,0,.21,0);const ht=l(n.box(.24,.3,.012),c(N.paper),at,0,.5,0),dt=new Xt;d.add(dt),l(n.box(.62,.1,.03),c(N.dark),dt,0,0,0);const gt=l(n.box(.58,.06,.035),c(N.bar,.3),dt,0,0,.005),Kt=[0,1,2].map(()=>l(n.box(.06,.09,.04),c(N.sweat,.3),h,0,0,0)),ct=[0,1,2].map(()=>l(n.ball(.08),c(N.steam),d,0,0,0)),ut=(Q,St)=>{Q.rotation.set(St[0],St[1],St[2])};let vt=-1,_t=-1;return{name:e,main:t,outfit:a,group:d,apply(Q){d.visible=Q.opacity>.001,d.position.set(Q.x,Q.lift??0,Q.z),d.rotation.set(Q.tilt?.[0]??0,Q.dir,Q.tilt?.[1]??0,"YXZ");const St=Q.board;$.position.set(St?.x??0,St?St.y-.08:0,St?.z??0),$.rotation.set(St?.rot[0]??0,St?.rot[1]??0,St?.rot[2]??0,"YXZ"),f.position.set(0,Q.y,0),ut(f,Q.body),ut(h,Q.head),ut(S,Q.armL),ut(T,Q.armR),M.rotation.set(Q.legL,0,0),E.rotation.set(Q.legR,0,0);const Pt=Q.eyes<zE;for(const L of m)L.visible=!Pt,L.scale.y=Q.eyes;for(const L of _)L.visible=Pt;x.visible=Q.mouth==="smile",p.visible=Q.mouth==="laugh",v.visible=Q.mouth==="oh";const yt=Q.props;A.visible=yt.crate,A.position.set(0,yt.crateUp?1.62*u:.62,yt.crateUp?0:.3),F.material=yt.golden?V:U,B.visible=yt.coin!==null,yt.coin!==null&&(B.position.y=1.5*u+Q.y+yt.coin*.5),D.visible=yt.mug,O.visible=yt.orange,P.visible=yt.pine;const j=Math.max(.15,1-yt.eaten*.85);if(O.scale.setScalar(j),P.scale.setScalar(j),I.visible=yt.plane,G.visible=yt.sheet,$.visible=yt.skate,J.visible=yt.glasses,Tt.visible=yt.marker,H.visible=yt.newspaper,tt.visible=yt.magnifier,k.visible=yt.poster,W.visible=yt.bigScreen,at.visible=yt.shredder!==null,yt.shredder!==null&&(ht.position.y=.5-yt.shredder*.32),dt.visible=yt.progress!==null,yt.progress!==null){const L=Math.max(.02,yt.progress);gt.scale.x=L,gt.position.x=-.29*(1-L),dt.position.set(0,1.62*u+Q.y,0)}if(it.visible=yt.cloud>.02,it.scale.setScalar(Math.max(.01,yt.cloud)),Kt.forEach((L,xt)=>{if(L.visible=yt.hot!==null,yt.hot===null)return;const bt=(yt.hot+xt/3)%1;L.position.set((xt-1)*.17,.16-bt*.4,.16),L.scale.setScalar(1-bt*.6)}),ct.forEach((L,xt)=>{if(L.visible=yt.hot!==null,yt.hot===null)return;const bt=(yt.hot*.66+xt/3)%1;L.position.set(Math.sin(bt*6+xt)*.1,1.28*u+bt*.9,0),L.scale.setScalar(.6+bt)}),Q.grey!==vt){vt=Q.grey;for(const[L,xt]of r)L.color.copy(xt).lerp(AE,Q.grey*.85)}if(Q.opacity!==_t){const L=_t>=1||_t<0;_t=Q.opacity;const xt=Q.opacity>=1;for(const bt of r.keys())bt.opacity=Q.opacity,(bt.transparent===xt||L!==xt)&&(bt.transparent=!xt,bt.needsUpdate=!0)}},headTop(Q){return h.getWorldPosition(Q),Q.y+=.3*u,Q},feet(Q){return Q.set(d.position.x,0,d.position.z)},dispose(){d.traverse(Q=>{Q instanceof Se&&Q.geometry.dispose()});for(const Q of r.keys())Q.dispose()}}}const Ze={crate:!1,mug:!1,orange:!1,pine:!1,sheet:!1,plane:!1,skate:!1,glasses:!1,cloud:0,hot:null,marker:!1,newspaper:!1,bigScreen:!1,magnifier:!1,poster:!1,shredder:null,progress:null,coin:null,golden:!1,crateUp:!1,eaten:0},Ts=[0,0,0],ue={y:0,body:Ts,head:Ts,armL:Ts,armR:Ts,legL:0,legR:0,eyes:1,mouth:"smile",props:Ze,screen:0,lamp:!0,grey:0,dx:0,dz:0,face:null},Li={y:-.05,legL:-1.45,legR:-1.45},og=new Set(["work","hot","main"]),RE=(e,t)=>t?0:e,CE=new Set(["think","computer","compact","build","edit","tool","unknown"]);function PE(e,t,n,i){const s=e==="hot",a={...Ze,hot:s?(n*.9+i)%1:null},o=s?"oh":"smile";switch(t.doing){case"think":return t.at==="board"?{...ue,mouth:o,armL:[-.3,0,0],head:[-.15,0,0],armR:[-2.4+Math.sin(n*6+i)*.2,0,.2+Math.sin(n*3+i)*.25],props:{...a,marker:!0}}:{...ue,...Li,mouth:o,armR:[-2.2,0,-.5],armL:[-1.2,0,0],head:[-.25,.2+Math.sin(n*1.5+i)*.1,0],screen:.6,props:a};case"search":return{...ue,...Li,mouth:o,armL:[-1.3,0,.35],armR:[-1.3,0,-.35],head:[.2,0,0],screen:.5,props:{...a,newspaper:!0}};case"computer":return{...ue,dx:-.75,dz:.1,face:0,mouth:o,head:[.05,-.5,0],armR:[-1+Math.sin(n*4+i)*.08,0,Math.sin(n*3+i)*.1],armL:Ts,screen:.4,props:{...a,bigScreen:!0}};case"image":return{...ue,...Li,mouth:"oh",armR:[-2,0,-.3],armL:[-1.2,0,0],head:[.1,0,0],screen:.9,props:{...a,magnifier:!0}};case"publish":return{...ue,mouth:"laugh",eyes:.3,armL:[-2.6,0,.2],armR:[-2.6,0,-.2],props:{...a,poster:!0}};case"compact":return{...ue,dx:.6,face:0,mouth:o,armL:[-1.1,0,0],armR:[-1.1,0,0],head:[.35,0,0],screen:.4,props:{...a,shredder:(n*.8+i)%1}};case"build":return{...ue,dz:-.15,mouth:o,armL:[-1.2,0,.9],armR:[-1.2,0,-.9],head:[.1,0,0],screen:.9,props:{...a,progress:(n+i*3)%12/12}};case"edit":case"tool":case"unknown":case void 0:{const r=s?22:12;return{...ue,...Li,armL:[-1.2+Math.sin(n*r+i)*.18,0,0],armR:[-1.2+Math.sin(n*r+i+2)*.18,0,0],head:[.15+Math.sin(n*2+i)*.04,Math.sin(n*.7+i)*.15,0],body:s?[0,0,Math.sin(n*30)*.015]:Ts,mouth:o,screen:.9,props:a}}}}function LE(e){return e.doing===void 0||CE.has(e.doing)||e.k==="hot"}const IE={...ue,y:.22,dz:.15,body:[-.9,0,0],legL:-.4,legR:-.4,armL:[0,0,-.5],armR:[0,0,.5],eyes:.15,mouth:"oh",face:0},fp={...ue,...Li,body:[.3,0,0],head:[.6,0,0],armL:[-1.4,0,0],armR:[-1.4,0,0],eyes:.15,mouth:"oh"},Ea=1.6,rl=2.6,lu=4,up=Ea+lu*rl,uc=(e,t,n)=>[e[0]+(t[0]-e[0])*n,e[1]+(t[1]-e[1])*n,e[2]+(t[2]-e[2])*n],vo=[-1.3,0,-.2],Od=[-2.25,0,-.45],hp=[-.75,0,.1];function DE(e,t,n){const i=Math.floor(t/up),s=t-i*up,a=e===2,o=a?2:(e+i)%2,r=(h,m)=>({...Ze,pine:m&&o===0,orange:m&&o===1,mug:m&&a,eaten:a?0:h});if(s<Ea){const h=s/Ea,m=h<.5?es(h*2):1-es((h-.5)*2);return{...ue,body:[.22*m,0,0],head:[.1+.3*m,0,0],armR:h<.5?uc(vo,hp,es(h*2)):uc(hp,vo,es((h-.5)*2)),armL:[-.15,0,0],mouth:"smile",props:r(0,h>=.5)}}const c=Math.floor((s-Ea)/rl),l=s-Ea-c*rl,d=c/lu,f=(c+1)/lu;if(l<.5)return{...ue,armR:uc(vo,Od,es(l/.5)),head:[-.05,0,0],mouth:"oh",props:r(d,!0)};if(l<.75)return{...ue,armR:Od,head:[.15,0,0],mouth:"smile",eyes:.6,props:r(f,f<1)};if(l<1.15)return{...ue,armR:uc(Od,vo,es((l-.75)/.4)),head:[.05,0,0],mouth:"smile",props:r(f,f<1)};const u=Math.sin((l-1.15)*Math.PI*6+n);return{...ue,armR:vo,head:[.04+u*.04,0,Math.sin((l-1.15)*2+n)*.05],mouth:u>0?"oh":"smile",eyes:.4,props:r(f,f<1)}}function pp(e,t,n,i=t){const s=e.k,a=e.urgent===!0,o=e.fruit??0;switch(s){case"work":case"main":case"hot":return PE(s,e,t,n);case"starting":return{...ue,head:[0,.35,0],armR:[0,0,2.4],face:Math.PI};case"nap":return e.at==="desk"?fp:IE;case"sleep":case"waitagent":return fp;case"snack":return DE(o,i,n);case"asks":return{...ue,dx:.65,dz:.15,face:0,y:Math.abs(Math.sin(t*(a?5.2:2.6)+n))*.08,armR:[0,0,2.7+Math.sin(t*5+n)*.25],armL:a?[-1.3,0,0]:Ts,mouth:"oh",screen:.6,props:a?{...Ze,sheet:!0}:Ze};case"blocked":return{...ue,...Li,armL:[-1.2,0,.9],armR:[-1.2,0,-.9],head:[.25,0,0],mouth:"oh",screen:.4};case"failed":return{...ue,...Li,body:[.35,0,0],head:[.7,0,0],armL:[-.2,0,0],armR:[-.2,0,0],eyes:.3,mouth:"oh",props:{...Ze,cloud:1}};case"landing":return{...ue,armL:[-1.3,0,0],armR:[-1.3,0,0],props:{...Ze,crate:!0}};case"done":return{...ue,y:.26,dz:.33,body:[-1,0,0],legL:-.2,legR:-.2,armL:[0,0,-2.6],armR:[0,0,2.6],props:{...Ze,glasses:!0}};case"stopped":return{...ue,...Li,armL:[-.9,0,0],armR:[-.9,0,0],head:[.1,0,0],lamp:!1,grey:1};case"mainidle":return{...ue,...Li,armL:[-1.3,0,.35],armR:[-1.3,0,-.35],head:[.25,0,0],props:{...Ze,sheet:!0}};case"coffee":return{...ue,armR:[-1.5,0,0],head:[-.1,0,.06],mouth:"laugh",eyes:.3,props:{...Ze,mug:!0}};case"visit":return{...ue,armR:[-1.2,0,-.3],head:[.1,0,0]};case"report":return{...ue,armL:[-1.3,0,0],armR:[-1.3,0,0],props:{...Ze,sheet:!0}}}}function NE(e,t){return e===null||e===t?0:t==="sleep"||t==="waitagent"?1.5:t==="failed"?1.2:t==="stopped"?.5:e==="sleep"||e==="waitagent"||e==="failed"||e==="stopped"?1:.6}const Gl=1.5,rg=2,es=e=>e<=0?0:e>=1?1:e*e*(3-2*e),Cn=(e,t,n)=>e+(t-e)*n,hc=(e,t,n)=>[Cn(e[0],t[0],n),Cn(e[1],t[1],n),Cn(e[2],t[2],n)];function cg(e,t,n){const i=n>=.5;return{y:Cn(e.y,t.y,n),body:hc(e.body,t.body,n),head:hc(e.head,t.head,n),armL:hc(e.armL,t.armL,n),armR:hc(e.armR,t.armR,n),legL:Cn(e.legL,t.legL,n),legR:Cn(e.legR,t.legR,n),eyes:Cn(e.eyes,t.eyes,n),mouth:i?t.mouth:e.mouth,props:{...i?t.props:e.props,cloud:Cn(e.props.cloud,t.props.cloud,n)},screen:Cn(e.screen,t.screen,n),lamp:i?t.lamp:e.lamp,grey:Cn(e.grey,t.grey,n),dx:Cn(e.dx,t.dx,n),dz:Cn(e.dz,t.dz,n),face:i?t.face:e.face}}function UE(e,t){if(e==="done")return{...ue,y:.1,legL:.2,legR:-.3,armL:[0,0,-1.1],armR:[0,0,1.1],body:[0,.5,0],mouth:"laugh",eyes:.3,props:{...Ze,skate:!0,glasses:!0}};const n=t*9,i=e==="landing";return{...ue,y:Math.abs(Math.sin(n))*.05,legL:Math.sin(n)*.6,legR:-Math.sin(n)*.6,armL:[i?-1.3:-Math.sin(n)*.5,0,0],armR:[i?-1.3:Math.sin(n)*.5,0,0],props:i?{...Ze,crate:!0}:Ze}}function OE(e,t,n,i){const s=Math.sin(Math.PI*n);return(t==="sleep"||t==="waitagent")&&n<.6?{...i,armL:[0,0,-2.6*s],armR:[0,0,2.6*s],mouth:"oh",eyes:.6}:(e==="sleep"||e==="waitagent")&&og.has(t)?{...i,y:i.y+.18*s,eyes:1}:t==="failed"?{...i,armL:[-2.4*s,0,.4],armR:[-2.4*s,0,-.4]}:e==="stopped"?{...i,armL:[0,0,-2.2*s],armR:[0,0,2.2*s]}:i}function FE(e,t){const n=t-Gl;return n<0||n>rg?e:n<.4?{...e,armR:[0,0,2.6],eyes:1,mouth:"smile",screen:Math.max(e.screen,.4)}:n<1.3?{...e,armR:[-1.4,0,-.3],head:[.35,0,0],props:{...e.props,plane:!0},eyes:1,mouth:"smile"}:n<1.7?{...e,armR:[-.4,0,2.2],mouth:"laugh",eyes:.3}:cg({...e,armR:[-.4,0,2.2]},e,es((n-1.7)/.3))}const lg=.8;function BE(e,t){const{path:n}=e.seg;if(!t||n.len<.01||e.seg.from===null)return{x:e.x,z:e.z,opacity:1,fading:!1};const i=Math.min(lg,n.len/e.seg.speed),s=e.since,a=n.pts[0],o=n.pts[n.pts.length-1];return!a||!o?{x:e.x,z:e.z,opacity:1,fading:!1}:s<i/2?{x:a.x,z:a.z,opacity:1-s/(i/2),fading:!0}:s<i?{x:o.x,z:o.z,opacity:(s-i/2)/(i/2),fading:!0}:{x:o.x,z:o.z,opacity:1,fading:!1}}function dg(e){const{pose:t,t:n,phase:i,reduced:s}=e,{seg:a}=t,o=a.act,r=o.k,c=RE(n,s),l=BE(t,s),d=a.path.len>.01&&a.from!==null?a.path.len/a.speed:0,f=s?!l.fading:!t.moving,u=s?0:NE(a.from,r),h=t.since-(s?Math.min(lg,d):d),m=pp(o,c,i,s?Ea+rl-.2:Math.max(0,h-u));let _,x;if(!f&&!s)_=UE(r,n),x="walk";else if(!f)_=m,x="walk";else if(h<u){const M=d>0?ue:a.from===null?m:pp({k:a.from,at:o.at},c,i),E=es(h/u);_=OE(a.from,r,h/u,cg(M,m,E)),x="walk"}else _=m,x=!s&&(og.has(r)&&LE(o)||r==="asks"||r==="snack")?"loop":"still";if(t.plane&&!s){const M=t.plane.since;M<Gl+rg&&(x="walk"),f&&(_=FE(_,M))}const p=_.face??t.dir,v=Math.cos(p),y=Math.sin(p),g=l.x+_.dx*v+_.dz*y,b=l.z-_.dx*y+_.dz*v,S={x:g,z:b,dir:p,y:_.y,body:_.body,head:_.head,armL:_.armL,armR:_.armR,legL:_.legL,legR:_.legR,eyes:_.eyes,mouth:_.mouth,props:_.props,screen:_.screen,lamp:_.lamp,grey:_.grey,opacity:l.opacity,motion:x};return!f&&!s&&(a.pastime!==void 0||a.fromSkate===!0)?HE(S,a.fromSkate===!0?t.since:1/0):S}const GE=.4;function HE(e,t){const n={x:.3,y:.62,z:.05,rot:[0,0,Math.PI/2]},i=t/GE,s=i<1?{x:n.x*i,y:.08+(n.y-.08)*i,z:.35*(1-i),rot:[Math.PI*2*i,0,Math.PI/2*i]}:n;return{...e,armR:[-.4,0,.35],props:{...e.props,skate:!0},board:s}}function VE(e,t){return e==="walk"||t==="walk"?"walk":e==="skate"||t==="skate"?"skate":e==="loop"||t==="loop"?"loop":"still"}function WE(e,t,n,i=!1){const s=Math.min(1,Math.max(0,n/Gl)),a=1-(1-s)*(1-s),o=(1-a)*1.6,r=Math.sin(s*Math.PI*3)*.12*(1-s),c={x:e.x-Pn.x*o+r,y:e.y+t*(1-a),z:e.z-Pn.z*o},l={x:Pn.x*1.6*2*(1-s),y:-t*2*(1-s)-.01,z:Pn.z*1.6*2*(1-s)};if(i&&s>.2&&s<.6){const d=(s-.2)/.4*Math.PI*2,f=.45;return{p:{x:c.x+Pn.x*Math.sin(d)*f,y:c.y+(1-Math.cos(d))*f,z:c.z+Pn.z*Math.sin(d)*f},heading:{x:Pn.x*Math.cos(d),y:Math.sin(d),z:Pn.z*Math.cos(d)},roll:0}}return{p:c,heading:l,roll:Math.sin(s*Math.PI*2)*.35}}function kE(e){const t=new Xt,n=e.material(N.paper,{flat:!0}),i=e.material(N.paperShade,{flat:!0}),s=new Se(e.box(.16,.012,.42),n);s.position.set(-.08,0,0),s.rotation.z=.25;const a=new Se(e.box(.16,.012,.42),n);a.position.set(.08,0,0),a.rotation.z=-.25;const o=new Se(e.box(.02,.07,.38),i);return o.position.set(0,-.035,-.01),t.add(s,a,o),t.scale.setScalar(1.3),{group:t,dispose(){for(const r of[s,a,o])r.geometry.dispose();n.dispose(),i.dispose()}}}const Ee={knees:.5,arms:1,up:0,lean:0,spin:0,board:[0,0,0],boardUp:0,mouth:"smile",eyes:1,sit:!1},XE=.17,He=e=>e<=0?0:e>=1?1:e*e*(3-2*e),Ne=(e,t,n)=>e+(t-e)*n,di=e=>Math.max(0,Math.min(1,e)),wn=(e,t)=>e<=0||e>=1?0:4*t*e*(1-e),$E=(e,t)=>Math.atan2(e,t),ko=(e,t)=>t===1?e.ramp.xb:e.ramp.xa,fg=(e,t)=>(e.ramp.z0+e.ramp.z1)/2+fr(t)*.8,cl=.9,qE=(e,t,n)=>fg(t,n)+(e.trick==="fifty"?e.side===1?-cl:cl:0),ug=e=>e?.75:.6,Ta=.45,Po=.7,Aa=.3,hg=e=>{const t=e.line.moves[e.i-1];return t&&t.trick!=="roll"?t:null},pg=e=>{let t=0;for(let n=e.i-1;n>=0&&e.line.moves[n]?.trick!=="roll";n--)t++;return t};function YE(e,t,n){const{park:i,slot:s}=t,{r:a}=i.ramp,o=e.side,r=ko(i,o),c=fg(i,s),l=$E(o,0),d=hg(t),f=ug(d===null);if(n<f){if(d===null){const p=Yx(i,s),v=n/f;if(v<.4){const g=v/.4,b=1-g,S=b*b*p.x+2*b*g*p.x+g*g*(p.x+o*1),T=b*b*p.z+2*b*g*c+g*g*c;return{x:S,z:T,ys:Qn(i,t.stage,S,T),air:0}}const y=Ne(p.x+o*1,r,He((v-.4)/.6));return{x:y,z:c,ys:sl(i,y),air:0,dir:l}}const m=d.bail?ko(i,d.side)-d.side*a:ko(i,d.side),_=He(n/f),x=Ne(m,r,_);return{x,z:Ne(qE(d,i,s),c,_),ys:sl(i,x),air:0,dir:l}}const u=(n-f)/(1-f),h=m=>({x:r+o*m*di(Math.min(u,1-u)*6),z:c,ys:a,air:0,dir:l});switch(e.trick){case"fs_air":return{x:r,z:c,ys:a,air:wn(u,1),dir:l};case"fs_180":case"bs_180":return{x:r,z:c,ys:a,air:wn(u,.6),dir:l};case"pump":return{x:r,z:c,ys:a,air:wn(u,.15),dir:l};case"fifty":return{x:r,z:c+(o===1?-cl:cl)*He(u),ys:a,air:0,dir:l};case"rock_to_fakie":return h(.12);default:return h(.18)}}function ZE(e,t,n){const{park:i,stage:s,slot:a}=t,o=i.qp,r=r0(i,s),c=Zx(i,s,a),l=Math.PI,d=c.x;if(n<Ta){const u=Ne(c.z,o.zLip,He(n/Ta));return{x:d,z:u,ys:Qn(i,s,d,u),air:0,dir:l}}if(n>Po){const u=Ne(o.zLip,c.z,He((n-Po)/(1-Po)));return{x:d,z:u,ys:Qn(i,s,d,u),air:0,dir:l}}const f=(n-Ta)/(Po-Ta);return e.trick==="axle_stall"?{x:d,z:o.zLip-.15*di(Math.min(f,1-f)*6),ys:r,air:0,dir:l}:{x:d,z:o.zLip,ys:r,air:wn(f,e.trick==="nine"?1.4:.85),dir:l}}const mp=(e,t)=>e?.75-.72*Math.sin(Math.PI*t):.75-.45*Math.sin(Math.PI*t),KE=(e,t)=>Math.PI+e.slot*.9+t*Math.PI;function JE(e,t,n){const{park:i,stage:s}=t,a=i.bowl,o=pg(t),r=o===0,c=KE(t,o);if(r&&n<Aa){const u=Ws(i,s,"bowl",e.side,t.slot),h=al(a,mp(!1,0),c),m=n/Aa,_=Ne(u.x,h.x,m),x=Ne(u.z,h.z,m);return{x:_,z:x,ys:Qn(i,s,_,x),air:0}}const l=r?(n-Aa)/(1-Aa):n,d=e.trick==="fs_air",f=al(a,mp(d,l),c+Math.PI*l);return{x:f.x,z:f.z,ys:Qn(i,s,f.x,f.z),air:d?wn((l-.35)/.3,.8):0}}function vs(e,t,n){const{park:i,stage:s,slot:a}=t;switch(e.on){case"flat":case"funbox":{const o=Ws(i,s,e.on,e.side,a),r=ur(i,s,e.on,e.side,a),c=Ne(o.x,r.x,n);return{x:c,z:o.z,ys:Qn(i,s,c,o.z),air:0}}case"curb":case"rail":case"ledge":{const o=i[e.on],r=qx(i,e.on),[c,l]=e.side===1?[o.x0-wa,o.x1+wa]:[o.x1+wa,o.x0-wa],d=Ne(c,l,n);if(n<.2){const f=n/.2;return{x:d,z:Ne(r,o.z,He((f-.3)/.7)),ys:0,air:o.h*He(f/.5)+wn(f,.15)}}if(n>.8){const f=(n-.8)/.2;return{x:d,z:Ne(o.z,r,He(f/.7)),ys:0,air:o.h*(1-He((f-.5)/.5))+wn(f,.12)}}return{x:d,z:o.z,ys:o.h,air:0}}case"stairs":{const o=i.stairs,r=c0(o),c=l0(i),l=c[c.length-1]??{x:o.xTop-.5},d=o.xBottom+.5;if(n<.2)return{x:Ne(l.x,o.xTop,n/.2),z:r,ys:o.h,air:0};if(n<.8){const f=(n-.2)/.6;return{x:Ne(o.xTop,d,f),z:r,ys:0,air:o.h*(1-f*f)+wn(f,.3)}}return{x:Ne(d,ur(i,s,"stairs",1,a).x,(n-.8)/.2),z:r,ys:0,air:0}}case"ramp":return YE(e,t,n);case"qp":case"vert":return ZE(e,t,n);case"bowl":return JE(e,t,n);case null:return{x:i.area.x0,z:i.area.z0,ys:0,air:0}}}function QE(e,t){const n=vs(e,t,1);return e.on==="ramp"&&e.bail?{x:ko(t.park,e.side)-e.side*t.park.ramp.r,z:n.z}:{x:n.x,z:n.z}}function jE(e,t,n){const i=vs(e,t,1);if(e.on!=="ramp")return{...i,ys:Qn(t.park,t.stage,i.x,i.z),air:0};const s=ko(t.park,e.side),a=Ne(s,s-e.side*t.park.ramp.r,He(n/.3));return{x:a,z:i.z,ys:sl(t.park,a),air:0,dir:i.dir}}function tT(e,t){const{park:n,stage:i,slot:s,line:a,i:o}=e,r=a.moves[o-1],c=a.moves[o],l=[];let d=t;if(r&&r.on){const u=QE(r,{...e,i:o-1});if(d=ur(n,i,r.on,r.side,s),r.on==="ramp"){const{xa:h,xb:m,r:_}=n.ramp,x=Math.max(h+_+.3,Math.min(m-_-.3,u.x));l.push(u,{x,z:u.z},{x:d.x,z:u.z})}else if(r.on==="bowl"){const h=n.bowl,m=Math.atan2(d.z-h.z,d.x-h.x);l.push(u,al(h,.45,m),al(h,0,m))}}const f=c.on?Ws(n,i,c.on,c.side,s):t;return l.push(...eg(n,i,d,f)),c.on==="stairs"&&l.push(...l0(n).slice(1)),l}function eT(e,t,n){const i=e.trick,s=r=>{if(t<.25)return{...Ee,knees:Ne(.5,1.1,t/.25)};if(t<.75){const c=(t-.25)/.5,l=He(Math.min(1,c/.85));return{...Ee,knees:1.1,arms:1.4,up:wn(c,.12),boardUp:wn(c,.22),board:[r[0]*l,r[1]*l,r[2]*l]}}return{...Ee,knees:Ne(1,.5,(t-.75)/.25)}},a=(r,c,l)=>r*He((n-c)/(l-c)),o=r=>({...Ee,knees:n>.1&&n<.9?1.3:.6,arms:n>.15&&n<.85?1.9:1.1,spin:r*He(n)});switch(i){case"ollie":return s([0,0,0]);case"kickflip":return s([0,0,Math.PI*2]);case"heelflip":return s([0,0,-Math.PI*2]);case"shove_it":return s([0,Math.PI,0]);case"tre_flip":return s([0,Math.PI*2,Math.PI*2]);case"no_comply":{const r=di((t-.2)/.6);return{...Ee,knees:.8,arms:1.3,boardUp:wn(r,.25),board:[wn(r,.7),0,0]}}case"manual":return{...Ee,knees:.6,arms:1.5,lean:-.25,board:[-.28*di(Math.min(t,1-t)*6),0,0]};case"fifty":if(e.on==="ramp"){const r=n<.15?Math.PI/2*He(n/.15):n<.85?Math.PI/2:Math.PI/2+Math.PI/2*He((n-.85)/.15);return{...Ee,knees:.75,arms:1.4,spin:r}}return{...Ee,knees:.7,arms:1.3};case"five_o":return{...Ee,knees:.6,arms:1.4,lean:-.15,board:[-.22,0,0]};case"nosegrind":return{...Ee,knees:.8,arms:1.3,lean:.15,board:[.22,0,0]};case"boardslide":return{...Ee,knees:.75,arms:1.4,board:[0,Math.PI/2,0],spin:t>.2&&t<.8?Math.PI/2:0};case"drop_in":case"axle_stall":return{...Ee,knees:.8,arms:1.2,spin:a(Math.PI,.3,.8)};case"pump":return{...Ee,knees:.5+Math.abs(Math.sin(t*Math.PI*2))*.5,spin:a(Math.PI,.1,.9)};case"rock_to_fakie":return{...Ee,knees:.8,arms:1.2,board:[-.5*wn(di(n/.5),1),0,0],spin:a(Math.PI,.45,.95)};case"fs_180":return{...Ee,knees:1,arms:1.3,spin:Math.PI*He(n)};case"bs_180":return{...Ee,knees:1,arms:1.3,spin:-Math.PI*He(n)};case"carve":return{...Ee,knees:.75,arms:1.1};case"fs_air":return o(e.on==="bowl"?Math.PI*2:Math.PI);case"nine":return o(Math.PI*5);case"roll":return Ee}}function nT(e,t,n){switch(e.on){case"ramp":{const i=ug(hg(t)===null);return di((n-i)/(1-i))}case"qp":case"vert":return di((n-Ta)/(Po-Ta));case"bowl":{const i=pg(t)===0?(n-Aa)/(1-Aa):n;return di((i-.35)/.3)}default:return n}}const Fd=(e,t,n)=>Math.hypot(t.x-e.x,t.z-e.z)<1e-4?n:Math.atan2(t.x-e.x,t.z-e.z),Xo=.42;function iT(e,t,n,i){const s=Math.sin(i),a=Math.cos(i),o=y=>[Qn(e,t,n.x+s*y,n.z+a*y),Qn(e,t,n.x-s*y,n.z-a*y)];let r=0,c=Xo;for(let y=0;y<14;y++){const g=(r+c)/2,[b,S]=o(g);Math.hypot(g*2,b-S)>2*Xo?c=g:r=g}const l=r,[d,f]=o(l),u=.04,h=(cc(e,t,n.x+u,n.z)-cc(e,t,n.x-u,n.z))/(2*u),m=(cc(e,t,n.x,n.z+u)-cc(e,t,n.x,n.z-u))/(2*u),_=h*a-m*s,x=di(1-n.air/.3),p=y=>Math.max(-1.35,Math.min(1.35,y));return{base:Math.max(n.ys,Ne(n.ys,(d+f)/2,x)),tilt:[p(-Math.atan2(d-f,2*l))*x,p(Math.atan(_))*x]}}function sT(e,t,n,i){const s=t.seg.pastime;if(!s||t.moving)return null;const a=n.spots[s.slot]??n.spots[0];if(!a)return null;const o=ng(e,s,ig(t),n),r=o.move;if(!r)return rT(a.x,a.z,a.face);const c={park:n,stage:s.stage,slot:s.slot,line:o.line,i:o.line.moves.indexOf(r)},l=r.bail?Math.max(.01,r.dur-Fa):r.dur,d=di(o.into/l);let f,u,h;if(r.trick==="roll"){const E=tT(c,a),A=d0(E),R=He(d)*A,D=Rd(E,R);f={x:D.x,z:D.z,ys:Qn(n,s.stage,D.x,D.z),air:0},u=R>.05?Rd(E,R-.05):D;const O=Rd(E,R+.05);h=r.on===null&&d>=.98?a.face:Fd(u,O,a.face)}else{f=r.bail&&o.into>l?jE(r,c,(o.into-l)/Fa):vs(r,c,d);const A=vs(r,c,Math.max(0,d-.02));u=d<.02&&c.i>0?vs(r,c,0):A,h=f.dir??Fd(u,f,Fd(vs(r,c,d),vs(r,c,Math.min(1,d+.02)),a.face))}const m=r.bail&&o.into>l,_=r.trick==="roll"?aT(d,o.into,i):eT(r,d,nT(r,c,d)),x=m?oT((o.into-l)/Fa):_,p=h+x.spin,v=iT(n,s.stage,f,p),y=v.tilt,g=y[0],b=Math.sin(p)*Math.cos(g)*Xo,S=Math.cos(p)*Math.cos(g)*Xo,T=-Math.sin(g)*Xo;let M=v.base+f.air;for(const E of[1,-1])M=Math.max(M,Qn(n,s.stage,f.x+E*b,f.z+E*S)-E*T);return mg(f.x,f.z,p,M,y,x,"skate")}function aT(e,t,n){const i=Math.sin((t+n)*5);return{...Ee,knees:.45,arms:.9,up:e<.6&&i>.6?-.02:0}}function oT(e){return e<.15?{...Ee,knees:1.2,arms:2.2,mouth:"oh",eyes:1,board:[0,0,Math.PI*.6*(e/.15)]}:e<.8?{...Ee,sit:!0,mouth:"laugh",eyes:.3}:{...Ee,knees:Ne(1.2,.5,(e-.8)/.2),mouth:"laugh",eyes:.3}}function rT(e,t,n){return{...mg(e,t,n,0,[0,0],{...Ee,knees:0,arms:.2},"still"),y:0,legL:0,legR:-.35,body:[0,0,0],head:[0,0,0],board:{x:.3,y:.08,z:.3,rot:[0,.3,0]}}}function mg(e,t,n,i,s,a,o){const r=a.knees,c={x:0,y:.08+a.boardUp,z:0,rot:a.board};return a.sit?{x:e,z:t,dir:n,y:-.12,body:[-.5,0,0],head:[-.2,0,0],armL:[0,0,-.6],armR:[0,0,.6],legL:-1.45,legR:-1.45,eyes:a.eyes,mouth:a.mouth,props:{...Ze,skate:!0},screen:0,lamp:!0,grey:0,opacity:1,motion:o,lift:i,tilt:s,board:{x:.2,y:.08,z:.7,rot:[0,.5,Math.PI]}}:{x:e,z:t,dir:n,y:XE+a.up-r*.08,body:[a.lean,1.25,0],head:[0,-1,0],armL:[0,0,-a.arms],armR:[0,0,a.arms],legL:r,legR:-r*.6,eyes:a.eyes,mouth:a.mouth,props:{...Ze,skate:!0},screen:0,lamp:!0,grey:0,opacity:1,motion:o,lift:i,tilt:s,board:c}}const xp=e=>e<.5?2*e*e:1-(-2*e+2)**2/2,Bd=(e,t)=>[e[0]+t[0],e[1]+t[1],e[2]+t[2]];function cT(e,t){if(t===null)return e;const n=Number.isFinite(t.dur)?Math.min(1,Math.max(0,t.since/t.dur)):0,i=t.since,s=Number.isFinite(t.dur),a=(()=>{switch(t.kind){case"salto":return{...e,y:e.y+Math.sin(Math.PI*n)*.7,body:Bd(e.body,[-2*Math.PI*xp(n),0,0]),mouth:"laugh"};case"hop":return{...e,y:e.y+Math.sin(Math.PI*n)*.35,props:{...e.props,coin:n}};case"kickflip":return{...e,y:e.y+Math.sin(Math.PI*n)*.3,body:Bd(e.body,[0,2*Math.PI*xp(n),0]),props:{...e.props,skate:!0},mouth:"laugh"};case"moonwalk":return{...e,dir:e.dir+Math.PI};case"itemget":return{...e,armL:[-Math.PI*.95,0,.2],armR:[-Math.PI*.95,0,-.2],props:{...e.props,crate:!0,crateUp:!0},mouth:"oh"};case"tap":return{...e,armR:[-1.3+Math.sin(i*18)*.25,0,0]};case"clap":{const o=.35+Math.sin(i*14)*.3;return{...e,armL:[-1.3,0,o],armR:[-1.3,0,-o],mouth:"laugh"}}case"dance":return{...e,armL:[-1.5,0,0],armR:[-1.5,0,0],body:Bd(e.body,[0,0,Math.sin(i*6)*.2]),y:e.y+Math.abs(Math.sin(i*6))*.08};case"lookup":return{...e,head:[-.6,e.head[1],e.head[2]],mouth:"oh"};case"golden":return{...e,props:{...e.props,pine:!0,golden:!0}};case"shades":return{...e,props:{...e.props,glasses:!0}};case"speedrun":case"combo":case"stare":case"tetris":case"loop":return e}})();return s&&t.kind!=="moonwalk"?{...a,motion:"walk"}:a}function lT(e,t,n=0){const i=new Xt,s=[],a=(A,R=0)=>{const D=t.material(A,R>0?{emissive:A,ei:R}:{});return s.push(D),D},o=(A,R,D,O,P,F)=>{const V=new Se(A,R);return V.position.set(O,P,F),D.add(V),V},r=new Xt,c=a(N.paper,.35);o(t.capsule(.22,.3),c,r,0,0,0),o(t.ball(.035),a(N.ink),r,-.08,.12,.2),o(t.ball(.035),a(N.ink),r,.08,.12,.2),r.visible=!1,i.add(r);const l=e.lounge.length?e.lounge:[e.mainDesk],d=l.reduce((A,R)=>A+R.x,0)/l.length,f=l.reduce((A,R)=>A+R.z,0)/l.length,u=new Xt,h=a(N.pineLeaf);o(t.cylinder(.06,.25),a(N.crate),u,0,.12,0);for(const[A,R]of[.42,.32,.22].entries())o(t.cylinder(R,.3),h,u,0,.35+A*.25,0).scale.set(1,1,1);o(t.ball(.07),a(N.gold,.6),u,0,1.2,0),u.position.set(d,0,f-.6),u.visible=!1,i.add(u);const m=new Xt,_=a(N.paper);o(t.cylinder(.4,.22),_,m,0,.11,0),o(t.cylinder(.3,.18),_,m,0,.31,0),o(t.cylinder(.03,.18),a(N.pineapple),m,0,.49,0),o(t.ball(.045),a(N.gold,.9),m,0,.61,0),m.position.set((e.island.x0+e.island.x1)/2,.66,e.island.z1-.6),m.visible=!1,i.add(m);const x=new Xt,p=e.boardSpots.length?e.boardSpots.reduce((A,R)=>A+R.x,0)/e.boardSpots.length:0,v=.08+t.pictureZ;o(t.box(1.7,.85,.01),a(N.paper),x,p,1.05,v-.005);const y=a(N.marker);for(const A of[-.13,.13])o(t.box(.025,.7,.01),y,x,p+A,1.05,v);for(const A of[-.12,.12])o(t.box(.75,.025,.01),y,x,p,1.05+A,v);const g=a(N.board[0]);for(const[A,R]of[[-.26,.24],[0,0],[.26,-.24]])o(t.box(.16,.025,.01),g,x,p+A,1.05+R,v+.003).rotation.z=Math.PI/4,o(t.box(.16,.025,.01),g,x,p+A,1.05+R,v+.003).rotation.z=-Math.PI/4;x.visible=!1,i.add(x);const b=new Xt,S=a(N.ink);for(const[A,[R,D]]of[[-.22,.25],[.02,.42],[.26,.3]].entries()){const O=new Xt;O.position.set(R??0,D??0,0),O.rotation.z=(A-1)*.25,o(t.ball(.055),S,O,0,0,0).scale.set(1.25,.9,.6),o(t.box(.022,.2,.022),S,O,.05,.1,0),b.add(O)}b.position.set((e.island.x0+e.island.x1)/2,.95,e.island.z0+xr(e,n)-.6),b.visible=!1,i.add(b);const T=e.x0-.5,M=e.x0+e.W+.5,E=(e.island.z0+e.island.z1)/2;return{root:i,update(A){const R=A?.ghost??null;return r.visible=R!==null,R!==null&&r.position.set(T+(M-T)*R,1.7+Math.sin(R*Math.PI*6)*.08,E),u.visible=A?.tree===!0,m.visible=A?.cake===!0,x.visible=A?.doodle===!0,b.visible=A?.music===!0,R!==null},dispose(){i.traverse(A=>{A instanceof Se&&A.geometry.dispose()});for(const A of s)A.dispose()}}}function ll(e,t,n,i,s,a,o,r){const c=r.filter(m=>m.x0>a-t/2&&m.x1<a+t/2&&m.z0>o-i/2&&m.z1<o+i/2);if(c.length===0)return e.box(t,n,i,s);const l=new cs,d=-t/2,f=-i/2,u=Math.min(s,t/2,i/2);l.moveTo(d+u,f),l.lineTo(d+t-u,f),l.quadraticCurveTo(d+t,f,d+t,f+u),l.lineTo(d+t,f+i-u),l.quadraticCurveTo(d+t,f+i,d+t-u,f+i),l.lineTo(d+u,f+i),l.quadraticCurveTo(d,f+i,d,f+i-u),l.lineTo(d,f+u),l.quadraticCurveTo(d,f,d+u,f);for(const m of c){const _=new ar,[x,p]=[m.x0-a,m.x1-a],[v,y]=[-(m.z1-o),-(m.z0-o)];_.moveTo(x,v),_.lineTo(x,y),_.lineTo(p,y),_.lineTo(p,v),_.lineTo(x,v),l.holes.push(_)}const h=new Zs(l,{depth:n,bevelEnabled:!1,curveSegments:6});return h.rotateX(-Math.PI/2),h.translate(0,-n/2,0),h}const dT=e=>e.pendants?1.1:.55;function h0(e){e.traverse(t=>{t instanceof Se&&(t.castShadow=!0,t.receiveShadow=!0)})}function fT(e,t,n,i,s,a=os,o=!0){const r=i.pal(s),c=hx(n,r),l=new Xt,d=mm(e,a),f=d.x1-d.x0,u=d.z1-d.z0,h=(d.x0+d.x1)/2,m=(d.z0+d.z1)/2,_=i.pits?.(e,a.stage)??[];o&&(c.add(ll(n,f,1.2,u,.45,h,m,_),c.mat(r.dirt),l,h,-.75,m),c.add(ll(n,f,.16,u,0,h,m,_),c.mat(r.grass),l,h,-.1,m));const x=new Map,p={k:c,root:l,o:e,grow:a,stage(g){if(g>a.stage)return null;let b=x.get(g);return b||(b=new Xt,x.set(g,b),l.add(b)),b}};p.stage(0),i.shell(p),i.island(p),i.lounge(p);const v=new Map;for(const[g,b]of e.desks)v.set(g,i.desk(p,b,g));const y=i.mainDesk(p,t);return v.set(t,y),i.growth(p),n.shadows&&h0(l),{root:l,desks:v,mainDesk:y,pal:r,pieces:x,dispose(){l.traverse(g=>{if(g instanceof Se){g.geometry.dispose();const b=g.material;for(const S of Array.isArray(b)?b:[b]){const T=S.map;T&&T.dispose(),S.dispose()}}})}}}function uT(e,t,n,i){e.screen.emissiveIntensity=n,e.screen.color.set(n>.05?t.screenOn:t.screenOff);const s=i&&t.pendants;e.lamp.emissiveIntensity=s?dT(t):0,e.lamp.color.set(s?t.lampOn:t.lamp)}const dl=1e-6,gp=new WeakMap;function xg(e,t,n){if(Xs(t,n))return Lo([t]);const i=hT(e),s=_p(i,t),a=_p(i,n);if(mT(s,a))return Lo([t,n]);const o=i.nodes.length,r=new Array(o).fill(1/0),c=new Array(o).fill(-1),l=new Array(o).fill(!1);for(const h of s.ends)r[h.node]=Math.min(ve(r,h.node),h.w);for(;;){let h=-1;for(let m=0;m<o;m++)!ve(l,m)&&ve(r,m)<1/0&&(h<0||ve(r,m)<ve(r,h))&&(h=m);if(h<0)break;l[h]=!0;for(const{to:m,w:_}of ve(i.adj,h))ve(r,h)+_<ve(r,m)-dl&&(r[m]=ve(r,h)+_,c[m]=h)}let d=-1,f=1/0;for(const h of a.ends){const m=ve(r,h.node)+h.w;m<f-dl&&(f=m,d=h.node)}if(d<0)return Lo([t,n]);const u=[];for(let h=d;h>=0;h=ve(c,h))u.unshift(ve(i.nodes,h));return Lo([t,s.at,...u,n])}function Lo(e){const t=xT(e),n=[];let i=0;for(let s=1;s<t.length;s++){const a=Ii(ve(t,s-1),ve(t,s));n.push(a),i+=a}return{pts:t,seg:n,len:i}}function gg(e,t){const n=ve(e.pts,0);let i=Math.max(0,t);for(let s=0;s<e.seg.length;s++){const a=ve(e.seg,s);if(i<=a||s===e.seg.length-1){const o=a>0?Math.min(1,i/a):1,r=ve(e.pts,s),c=ve(e.pts,s+1);return{x:r.x+(c.x-r.x)*o,z:r.z+(c.z-r.z)*o,dir:Math.atan2(c.x-r.x,c.z-r.z)}}i-=a}return{x:n.x,z:n.z,dir:0}}function hT(e){let t=gp.get(e);return t||(t=pT(e),gp.set(e,t)),t}function pT(e){const n=e.walks.filter(([l,d])=>!Xs(l,d)),i=[],s=new Map,a=l=>{const d=_T(l);let f=s.get(d);return f===void 0&&(f=i.length,i.push(l),s.set(d,f)),f};for(const[l,d]of n)a(l),a(d);const o=[],r=i.map(()=>[]),c=new Set;for(const l of n){const d=i.filter(f=>_g(l,f)).sort((f,u)=>Ii(l[0],f)-Ii(l[0],u));for(let f=1;f<d.length;f++){const u=ve(d,f-1),h=ve(d,f),m=a(u),_=a(h);if(m===_)continue;const x=m<_?`${String(m)}-${String(_)}`:`${String(_)}-${String(m)}`;if(c.has(x))continue;c.add(x);const p=Ii(u,h);o.push([u,h]),ve(r,m).push({to:_,w:p}),ve(r,_).push({to:m,w:p})}}return{legs:o,nodes:i,adj:r}}function _p(e,t){const n=e.nodes.findIndex(o=>Xs(o,t));if(n>=0)return{at:ve(e.nodes,n),leg:-1,ends:[{node:n,w:0}]};const i=o=>e.nodes.findIndex(r=>Xs(r,o)),s=e.legs.findIndex(o=>_g(o,t));if(s>=0){const[o,r]=ve(e.legs,s);return{at:t,leg:s,ends:[{node:i(o),w:Ii(t,o)},{node:i(r),w:Ii(t,r)}]}}let a=0;return e.nodes.forEach((o,r)=>{Ii(o,t)<Ii(ve(e.nodes,a),t)&&(a=r)}),{at:ve(e.nodes,a),leg:-1,ends:[{node:a,w:0}]}}function mT(e,t){return e.leg>=0&&t.leg>=0?e.leg===t.leg:e.leg>=0?t.ends.some(n=>e.ends.some(i=>i.node===n.node)):t.leg>=0?e.ends.some(n=>t.ends.some(i=>i.node===n.node)):!1}function _g([e,t],n){const i=t.x-e.x,s=t.z-e.z,a=i*i+s*s;if(a<dl*dl)return Xs(e,n);const o=((n.x-e.x)*i+(n.z-e.z)*s)/a;return o<-1e-4||o>1+1e-4?!1:Math.abs((n.x-e.x)*s-(n.z-e.z)*i)/Math.sqrt(a)<1e-4}function xT(e){const t=[],n=i=>ve(t,t.length-i);for(const i of e)if(!(t.length&&Xs(n(1),i)))for(t.push({x:i.x,z:i.z});t.length>=3&&gT(n(3),n(2),n(1));)t.splice(t.length-2,1),t.length>=2&&Xs(n(2),n(1))&&t.pop();return t}function gT(e,t,n){const i=(t.x-e.x)*(n.z-t.z)-(t.z-e.z)*(n.x-t.x),s=(t.x-e.x)*(n.x-t.x)+(t.z-e.z)*(n.z-t.z);return Math.abs(i)<1e-6&&s>=0}const Ii=(e,t)=>Math.hypot(e.x-t.x,e.z-t.z),Xs=(e,t)=>Ii(e,t)<1e-4;function ve(e,t){const n=e[t];if(n===void 0)throw new Error(`bims paths: index ${String(t)} out of ${String(e.length)}`);return n}const _T=e=>`${String(Math.round(e.x*1e4))},${String(Math.round(e.z*1e4))}`,vT=.35,MT=.4;function yT(e,t){const n=[],i=()=>{if(n.length===0)for(const a of["crew-a","crew-b"]){const o=ag(a,!1,t);t.shadows&&h0(o.group),o.group.visible=!1,e.add(o.group),n.push(o)}return n},s=()=>{for(const a of n)a.group.visible=!1};return{update(a,o,r,c,l,d){if(!r)return s(),c&&c.scale.setScalar(1),!1;const f=a-r.at,u=Rc+um;if(l||f>=u||f<0)return s(),c&&(c.visible=!0,c.scale.setScalar(1)),!1;if(c){const S=(f-Rc)/MT;c.visible=S>0;const T=Math.min(1,Math.max(.01,S));c.scale.setScalar(T)}const h=d.pieceAt(o,r.stage),m=xg(o,o.door,h),_=Math.max(.5,m.len/Rc),x={k:"landing",at:"queue"},p={x:h.x,z:h.z,wz:h.z,ax:h.x,face:0},v={t:r.at,act:x,sig:"unlock",spot:p,path:m,speed:_,from:"starting"},y=Math.min(m.len,f*_),g=gg(m,y),b=y<m.len;return i().forEach((S,T)=>{const M=(T===0?-1:1)*vT,E={x:g.x+Math.cos(g.dir)*M,z:g.z-Math.sin(g.dir)*M,dir:g.dir,moving:b,since:f,seg:v},A=dg({pose:E,t:a,phase:T*.5,reduced:!1}),R=Math.min(1,Math.max(0,u-f));S.apply({...A,opacity:Math.min(A.opacity,R)}),S.group.visible=!0}),!0},dispose(){for(const a of n)e.remove(a.group),a.dispose();n.length=0}}}const bT=.42,ST=12,wT=1.25,ET=.45,ga={inner:.34,outer:.5,alpha:.28,day:"#1d1a17",night:"#f3ede4"};function TT(e,t={}){const n=t.ground??!0,i=new Xt;let s=null,a=[],o=null,r=null,c=!1,l=null,d=!1,f=os,u=No(os);const h=yT(i,e),m=new Map,_=new Map,x=new Map,p=new Gu(ga.inner,ga.outer,40);p.rotateX(-Math.PI/2);const v=new wl({color:ga.day,transparent:!0,opacity:ga.alpha,depthWrite:!1}),y=new Map;function g(){return cu(s?.map??"loft")}function b(){return a.find(P=>P.main)?.name??"main"}function S(P){if(o&&(i.remove(o.root),o.dispose(),o=null),r=P,!s)return;const F=cu(s.map);c=!1,o=fT(s,b(),e,F,P,f,n),i.add(o.root),l&&(i.remove(l.root),l.dispose()),l=lT(s,e,f.stage),i.add(l.root)}function T(P,F){if(!d||F)return;const V=a.filter(G=>!G.main).map(G=>G.name),U=V.indexOf(P),B=V[(U+1)%V.length]??P,I=ux(B,!1);return U===0?{...I,hoodie:fx}:I}function M(){for(const P of m.values())i.remove(P.group),P.dispose();m.clear(),_.clear()}function E(){const P=new Set(a.map(F=>F.name));for(const[F,V]of m)P.has(F)||(i.remove(V.group),V.dispose(),m.delete(F),_.delete(F));for(const F of a)A(F.name,F.main)}function A(P,F){let V=m.get(P);if(!V){const U=g();V=ag(P,F,e,T(P,F),F?void 0:B=>U.wear?.(B)),e.shadows&&h0(V.group),V.group.visible=!1,m.set(P,V),i.add(V.group)}return V}function R(P,F){const V=new Set;for(const U of P){const B=U.pose.plane?.since;if(B===void 0||B<0||B>=Gl)continue;const I=_.get(U.name);if(!I)continue;V.add(U.name);let G=x.get(U.name);G||(G=kE(e),x.set(U.name,G),i.add(G.group));const $={x:I.x,y:1,z:I.z},J=WE($,c1(F,$),B,U.egg?.kind==="loop");G.group.visible=!0,G.group.scale.setScalar(Math.max(1,ST*wT*F.scale/bT)),G.group.position.set(J.p.x,J.p.y,J.p.z),G.group.lookAt(J.p.x+J.heading.x,J.p.y+J.heading.y,J.p.z+J.heading.z),G.group.rotateZ(J.roll)}for(const[U,B]of x)V.has(U)||(i.remove(B.group),B.dispose(),x.delete(U));return V.size>0}function D(P,F){v.color.set(F?ga.night:ga.day);const V=new Set;for(const U of P){const B=_.get(U.name);if(U.lit!==!0||!B)continue;V.add(U.name);let I=y.get(U.name);I||(I=new Se(p,v),I.renderOrder=1,y.set(U.name,I),i.add(I)),I.position.set(B.x,.02,B.z),I.visible=B.opacity>.05}for(const[U,B]of y)V.has(U)||(i.remove(B),y.delete(U))}const O=P=>{const F=m.get(P);return F&&F.group.visible?F:null};return{root:i,setOffice(P,F){s&&s.map!==P.map&&M(),s=P,a=F,S(r??!1),E()},prepare(P){if(!s)return!1;const F=P.grow??os;let V=!1;No(F)!==u?(f=F,u=No(F),S(P.night),V=!0):r!==P.night&&S(P.night),c=P.eggs?.eclipse===!0;const U=P.eggs?.april===!0;return U!==d&&(d=U,M()),V},frame(P,F,V,U,B){if(!s||!o)return null;const I=o.pal;let G="still";const $=new Set;_.clear();for(const J of F){const it=A(J.name,J.main),Tt=s.park,H=Tt&&!V.reduced?sT(J.name,J.pose,Tt,it.outfit.phase):null,tt=cT(H??dg({pose:J.pose,t:P,main:J.main,phase:it.outfit.phase,reduced:V.reduced}),J.egg??null);it.apply(tt),_.set(J.name,tt),$.add(J.name),G=VE(G,tt.motion),B?.(J,tt,H!==null)}for(const[J,it]of m)$.has(J)||(it.group.visible=!1);D(F,V.night);for(const[J,it]of o.desks){const Tt=_.get(J);uT(it,I,Tt?.screen??0,Tt?Tt.lamp:J!==b())}return!V.reduced&&R(F,U)&&(G="walk"),l?.update(V.eggs)===!0&&(G="walk"),h.update(P,s,V.unlock,V.unlock?o.pieces.get(V.unlock.stage):void 0,V.reduced,g())&&(G="walk"),G},sky(){return o?c?new ee(o.pal.bg).lerp(new ee(N.eclipse),ET):o.pal.bg:null},pal:()=>o?.pal??null,office:()=>s,headTop(P,F){return O(P)?.headTop(F)??null},feet(P,F){return O(P)?.feet(F)??null},names:()=>[...m.keys()],body:P=>m.get(P)?.group??null,desk:P=>o?.desks.get(P),pieceAt(P){return s?g().pieceAt(s,P):null},world:()=>o?.root??null,dispose(){o&&(i.remove(o.root),o.dispose(),o=null),l&&(l.dispose(),l=null),h.dispose();for(const P of m.values())P.dispose();m.clear();for(const P of x.values())P.dispose();x.clear();for(const P of y.values())i.remove(P);y.clear(),p.dispose(),v.dispose()}}}function AT(e,t){const n=new rS({canvas:e,antialias:vn.antialias,alpha:!1,powerPreference:"low-power"});n.shadowMap.enabled=vn.shadows,n.shadowMap.type=Uo,n.shadowMap.autoUpdate=t.shadowAuto;const i=new r_,s=new zl(-1,1,1,-1,.1,Ur*3),a=new sv,o=new rv;i.add(a,o,o.target);let r=!1,c=null;const l=[],d=f=>{f.preventDefault(),r=!0;for(const u of l)u()};return e.addEventListener("webglcontextlost",d),{renderer:n,scene:i,camera:s,hemi:a,sun:o,look(f){const u=f.target;s.position.set(u.x+La.x*Ur,u.y+La.y*Ur,u.z+La.z*Ur),s.up.set(0,1,0),s.lookAt(u.x,u.y,u.z),s.left=f.left,s.right=f.right,s.top=f.top,s.bottom=f.bottom,s.updateProjectionMatrix()},size(f){n.setPixelRatio(Math.min(window.devicePixelRatio||1,vn.maxPixelRatio)),n.setSize(f.widthPx,f.heightPx,!1)},sky(f){c!==null&&typeof f!="object"&&c===f||(c=f,n.setClearColor(f))},tint(f){a.color.set(f.hemi[0]),a.groundColor.set(f.hemi[1]),a.intensity=f.hemi[2],o.color.set(f.sun[0]),o.intensity=f.sun[1]},render(){n.render(i,s)},copyTo(f){n.render(i,s),f.getContext("2d")?.drawImage(e,0,0,f.width,f.height)},lost:()=>r,onLost(f){l.push(f)},dispose(){e.removeEventListener("webglcontextlost",d),n.dispose()}}}const zT=14;function RT(e,t,n){const i=n.x-t.x,s=n.y-t.y,a=i*i+s*s,o=a===0?0:Math.max(0,Math.min(1,((e.x-t.x)*i+(e.y-t.y)*s)/a));return Math.hypot(e.x-(t.x+i*o),e.y-(t.y+s*o))}function CT(e,t,n){const i={x:t,y:n};let s=null,a=zT;for(const c of e){if(!c.head||!c.feet)continue;const l=RT(i,c.head,c.feet);l<a&&(a=l,s=c.name)}if(s!==null)return s;let o=null,r=1/0;for(const c of e){if(!c.desk)continue;const l=Math.hypot(t-c.desk.x,n-c.desk.y);l<c.desk.r&&l<r&&(r=l,o=c.name)}return o}const As=1.25,vg=1.5,Is=1.8,za=11,Mg=.5,PT=As+.3,LT=Is-.2,IT=7,pc=2.5,DT=12;function NT(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let n=t;return n=Math.imul(n^n>>>15,n|1),n^=n+Math.imul(n^n>>>7,n|61),((n^n>>>14)>>>0)/4294967296}}function UT(e){let t=2166136261;for(let n=0;n<e.length;n++)t=Math.imul(t^e.charCodeAt(n),16777619);return t>>>0}function OT(e){return e<=3?Math.min(2,Math.max(1,e)):Math.ceil(Math.sqrt(e*1.3))}function FT(e,t,n){const i=[];let s=e;for(;s>0;){const a=t<=2?t:t+(n()<.3?-1:n()<.45?1:0),o=s-a===1&&t>2?s:Math.min(s,Math.max(1,a));i.push(o),s-=o}return i}const fl=(e,t)=>Math.hypot(e.x-t.x,e.z-t.z);function vp(e,t){const n=e[0];if(n===void 0)return[];const i=[n];let s=0;for(let o=1;o<e.length;o++){const r=e[o-1]??n,c=e[o]??r,l=fl(r,c);let d=t-s;for(;d<=l;){const f=d/l;i.push({x:r.x+(c.x-r.x)*f,z:r.z+(c.z-r.z)*f}),d+=t}s=l-(d-t)}const a=e[e.length-1]??n;return fl(i[i.length-1]??n,a)>1e-6&&i.push(a),i}function BT(e,t){let n=e;for(let i=0;i<t;i++){if(n.length<3)return[...n];const s=[n[0]??{x:0,z:0}];for(let a=0;a<n.length-1;a++){const o=n[a]??{x:0,z:0},r=n[a+1]??o;s.push({x:.75*o.x+.25*r.x,z:.75*o.z+.25*r.z},{x:.25*o.x+.75*r.x,z:.25*o.z+.75*r.z})}s.push(n[n.length-1]??{x:0,z:0}),n=s}return[...n]}function Mp(e,t){return vp(BT(vp(e,t),4),Mg)}function du(e,t,n,i){return e.some(s=>t>s.fp.x0-i&&t<s.fp.x1+i&&n>s.fp.z0-i&&n<s.fp.z1+i)}function yg(e){return{road:e.road.filter(t=>du(e.offices,t.x,t.z,PT)).length,river:e.river.filter(t=>du(e.offices,t.x,t.z,LT)).length}}const bg=8,yp=7;function GT(e,t,n,i){const s=[],a=[];let o=0,r=0;return e.forEach((c,l)=>{const d=l>0&&l-1===t,f=c.home===!0||e[l-1]?.home===!0;let u=l===0?0:d?za:f?IT:3+n()*4;l>0&&!d&&!f&&i.since>=i.next&&(u=bg+2+n()*2,a.push(o+u/2),i.since=0,i.next=4+Math.floor(n()*2)),i.since++,d&&(r=o+za/2);const h=o+u-c.fp.x0;s.push(h),o=h+c.fp.x1}),t>=e.length-1&&(r=o+za/2,o+=za),{xs:s,riverX:r,width:o,squares:a}}function bp(e,t){const n=NT(t),i=e.find(U=>U.home===!0),s=e.filter(U=>U.home!==!0),a=[];let o=0;for(const U of FT(s.length,OT(e.length),n))a.push(s.slice(o,o+U)),o+=U;if(i!==void 0){const U=a[Math.floor(a.length/2)];U===void 0?a.push([i]):U.splice(Math.ceil(U.length/2),0,i)}const r=[],c=[],l={since:0,next:4+Math.floor(n()*2)};let d=0;for(const[U,B]of a.entries()){const I=B.length===1?0:Math.min(B.length-2,Math.max(0,Math.floor(B.length/2)-1+U%2)),G=GT(B,I,n,l),$=r[U-1],J=$===void 0?-G.width/2:$.riverX+(n()-.5)*6-G.riverX,it=B.map((dt,gt)=>{const Kt=(G.xs[gt]??0)+J,ct=d+n()*5-dt.fp.z0;return{id:dt.id,x:Kt,z:ct,fp:{x0:Kt+dt.fp.x0,x1:Kt+dt.fp.x1,z0:ct+dt.fp.z0,z1:ct+dt.fp.z1},door:{x:Kt+dt.doorX,z:ct+dt.fp.z1}}}),Tt=Math.max(...it.map(dt=>dt.fp.z1)),H=Math.min(...it.map(dt=>dt.fp.z0)),tt=it.map(dt=>dt.fp.z1+2+n()*6),k=[];it.forEach((dt,gt)=>{const Kt=tt[gt]??dt.fp.z1+3;k.push({x:dt.door.x,z:Kt});const ct=it[gt+1],ut=tt[gt+1];ct!==void 0&&ut!==void 0&&k.push({x:(dt.fp.x1+ct.fp.x0)/2,z:Math.max(Kt,ut)+n()*1.2})});for(const dt of G.squares)c.push({x:dt+J,z:d+1+yp/2,w:bg,d:yp});const W=G.riverX+J,at=Math.min(J,...it.map(dt=>dt.fp.x0),W-za/2),ht=Math.max(J+G.width,...it.map(dt=>dt.fp.x1),W+za/2);r.push({offices:it,riverX:W,back:H,front:Tt,x0:at,x1:ht,stops:k}),d=Math.max(...k.map(dt=>dt.z))+As+4+n()*2.5}const f=r.flatMap(U=>U.offices),u=Math.min(...r.map(U=>U.x0)),h=Math.max(...r.map(U=>U.x1)),m=Math.min(...r.map(U=>U.back)),_=Math.max(...r.map(U=>Math.max(...U.stops.map(B=>B.z)))),x=[],p=r[0]?.stops[0]??{z:0};x.push({x:u-40,z:p.z-3},{x:u-8,z:p.z}),r.forEach((U,B)=>{const I=B%2===0,G=I?U.stops:[...U.stops].reverse();x.push(...G);const $=r[B+1],J=G[G.length-1]??p;if($===void 0){x.push({x:I?h+8:u-8,z:J.z},{x:I?h+40:u-40,z:J.z+3});return}const Tt=(I?[...$.stops].reverse():$.stops)[0]??J,H=I?Math.max(U.x1,$.x1)+6+n()*2:Math.min(U.x0,$.x0)-6-n()*2,tt=I?3:-3;x.push({x:H,z:J.z},{x:H+tt,z:(J.z+Tt.z)/2},{x:H,z:Tt.z})});const v=Mp(x,2.5),y=[];if(f.length>1){const U=[],B=r[0];B!==void 0&&U.push({x:B.riverX-3,z:m-16},{x:B.riverX+1,z:m-8}),r.forEach((I,G)=>{U.push({x:I.riverX,z:I.back-3},{x:I.riverX,z:I.front+Is+.6});const $=r[G+1];$!==void 0?U.push({x:$.riverX,z:$.back-Is-.6}):U.push({x:I.riverX+2,z:_+8},{x:I.riverX-2,z:_+18})}),y.push(...Mp(U,1.2))}const g={x0:u-12,x1:h+14,z0:m-10,z1:_+10},b=i===void 0?void 0:f.find(U=>U.id===i.id),S=b===void 0?null:{x0:b.fp.x0-pc,x1:b.fp.x1+pc,z0:b.fp.z0-pc,z1:b.fp.z1+pc},T=(U,B)=>U>g.x0&&U<g.x1&&B>g.z0&&B<g.z1,M=[];for(let U=0;U<v.length-1;U++){const B=v[U],I=v[U+1];B===void 0||I===void 0||!T(B.x,B.z)||M.some(G=>fl(G,B)<6)||y.some(G=>fl(G,B)<Mg)&&M.push({x:B.x,z:B.z,ang:Math.atan2(I.x-B.x,I.z-B.z)})}const E=[],A=[];for(const U of f){let B=1/0;for(let $=0;$<v.length-1;$++){const J=v[$],it=v[$+1];if(J===void 0||it===void 0||(J.x-U.door.x)*(it.x-U.door.x)>0||J.x===it.x)continue;const Tt=J.z+(it.z-J.z)*(U.door.x-J.x)/(it.x-J.x);Tt>U.door.z&&Tt<B&&(B=Tt)}if(!Number.isFinite(B))continue;const I={x:U.door.x,z0:U.door.z,z1:B};E.push(I);const G=y.filter($=>Math.abs($.x-I.x)<vg&&$.z>I.z0&&$.z<I.z1-As);G.length>0&&A.push({x:I.x,z:G.reduce(($,J)=>$+J.z,0)/G.length})}const R=(U,B,I,G)=>U.some($=>Math.abs($.x-B)<G&&Math.abs($.z-I)<G&&Math.hypot($.x-B,$.z-I)<G),D=(U,B,I)=>T(U,B)&&(S===null||U<S.x0-I||U>S.x1+I||B<S.z0-I||B>S.z1+I)&&!c.some(G=>Math.abs(G.x-U)<G.w/2+I+.4&&Math.abs(G.z-B)<G.d/2+I+.4)&&!du(f,U,B,1.2+I)&&!R(v,U,B,As+1.2+I)&&!R(y,U,B,Is+.6+I)&&E.every(G=>Math.abs(G.x-U)>1.2+I||B<G.z0||B>G.z1),O=[],P=Math.min(10,3+f.length);for(let U=0;U<400&&O.length<P&&v.length>1;U++){const B=Math.floor(n()*(v.length-1)),I=v[B],G=v[B+1];if(I===void 0||G===void 0)continue;const $=Math.atan2(G.x-I.x,G.z-I.z),J=n()<.5?-1:1,it=As+2.6,Tt=I.x+Math.cos($)*it*J,H=I.z-Math.sin($)*it*J;!D(Tt,H,1.4)||R(O,Tt,H,4)||O.push({x:Tt,z:H,ang:$,w:1.7+n()*.8,d:1.7+n()*.8,tone:O.length})}const F=[],V=30+f.length*8;for(let U=0;U<900&&F.length<V;U++){const B=g.x0+n()*(g.x1-g.x0),I=g.z0+n()*(g.z1-g.z0);if(!D(B,I,.6))continue;const G=1+Math.floor(n()*5);for(let $=0;$<G;$++){const J=B+(n()-.5)*3,it=I+(n()-.5)*3;D(J,it,0)&&!R(O,J,it,2.2)&&!R(F,J,it,.7)&&F.push({x:J,z:it,size:.75+n()*.5})}}return{offices:f,road:v,river:y,bridges:M,paths:E,footbridges:A,houses:O,trees:F,squares:c,heart:S,lawn:g,seed:t}}function HT(e,t){let n=null;for(let i=0;i<DT;i++){const s=bp(e,t+i*7919>>>0),a=yg(s),o=a.road+a.river;if(o===0)return s;(n===null||o<n.hits)&&(n={plan:s,hits:o})}return n?.plan??bp(e,t)}const VT={water:"#7cc3e8",bank:"#d9cf9c",road:"#9a9590",dash:"#f4f0e8",path:"#e2c79a",wood:"#c49a6c",rail:"#a0673f",trunk:"#a0673f",leaves:["#5fb35a","#7cc26b","#4e9a48"],walls:["#f3d5b5","#bfe1f2","#fffaf0","#ffe3a3","#cfe8c3"],roofs:["#ef8354","#5c677d","#2a9d8f"],stone:"#e4dccd"},WT={water:"#1d3b52",bank:"#3c5a3a",road:"#3a3d44",dash:"#8d8a84",path:"#5c4b3e",wood:"#6b5440",rail:"#5c4b3e",trunk:"#6e4a31",leaves:["#3f8a3e","#4f9a4a","#356f33"],walls:["#8a7663","#5e7686","#9a9284","#9a8455","#6f8466"],roofs:["#8a4a33","#3c4350","#1f6a62"],stone:"#6f685f"},ge=-.06;function mc(e,t,n,i){const s=[];for(let r=0;r<e.length-1;r++){const c=e[r],l=e[r+1];if(c===void 0||l===void 0||!i(c)||!i(l))continue;const d=e[r-1]??c,f=e[r+2]??l,u=Sp(l.x-d.x,l.z-d.z),h=Sp(f.x-c.x,f.z-c.z),m=[c.x+u.x*t,n,c.z+u.z*t],_=[c.x-u.x*t,n,c.z-u.z*t],x=[l.x+h.x*t,n,l.z+h.z*t],p=[l.x-h.x*t,n,l.z-h.z*t];s.push(...m,...x,..._,..._,...x,...p)}const a=new Le;a.setAttribute("position",new un(new Float32Array(s),3));const o=new Float32Array(s.length);for(let r=1;r<o.length;r+=3)o[r]=1;return a.setAttribute("normal",new un(o,3)),a}function Sp(e,t){const n=Math.hypot(e,t)||1;return{x:-t/n,z:e/n}}function kT(e,t,n,i,s=[]){const a=hx(t,n),o=new Xt,{lawn:r}=e,c=v=>v.x>r.x0&&v.x<r.x1&&v.z>r.z0&&v.z<r.z1,l=r.x1-r.x0,d=r.z1-r.z0,f=(r.x0+r.x1)/2,u=(r.z0+r.z1)/2;a.add(ll(t,l,1.2,d,.45,f,u,s),a.mat(n.dirt),o,f,ge-.08-.6-.01,u),a.add(ll(t,l,.16,d,.05,f,u,s),a.mat(n.grass),o,f,ge-.08,u);const h=(v,y)=>{const g=new Se(v,a.mat(y));o.add(g)};e.river.length>1&&(h(mc(e.river,Is,ge+.005,c),i.bank),h(mc(e.river,vg,ge+.012,c),i.water)),h(mc(e.road,As,ge+.02,c),i.road);const m=[];for(let v=0;v+2<e.road.length;v+=5){const y=e.road[v],g=e.road[v+2];y!==void 0&&g!==void 0&&m.push([y,g])}for(const v of m)h(mc(v,.06,ge+.03,c),i.dash);for(const v of e.paths){const y=v.z1-v.z0;y>0&&a.add(t.box(1,.04,y,.01),a.mat(i.path),o,v.x,ge+0,v.z0+y/2)}const _=(v,y,g,b,S)=>{const T=new Xt;T.position.set(v,0,y),T.rotation.y=g,o.add(T),a.add(t.box(b*2+.6,.14,S),a.mat(i.wood),T,0,ge+.1,0);for(const M of[-1,1]){a.add(t.box(.12,.12,S),a.mat(i.rail),T,M*(b+.25),ge+.45,0);for(const E of[-S/2+.2,0,S/2-.2])a.add(t.box(.14,.42,.14),a.mat(i.rail),T,M*(b+.25),ge+.3,E)}};for(const v of e.bridges)_(v.x,v.z,v.ang,As,Is*2+1);for(const v of e.footbridges)_(v.x,v.z,0,.5,Is*2+.6);for(const v of e.houses){const y=new Xt;y.position.set(v.x,0,v.z),y.rotation.y=v.ang,o.add(y),a.add(t.box(v.w,1.2,v.d,.2),a.mat(i.walls[v.tone%i.walls.length]??n.wall),y,0,ge+.6,0);const g=a.add(new Tl(Math.max(v.w,v.d)*.78,.9,4),a.mat(i.roofs[v.tone%i.roofs.length]??n.wallTop),y,0,ge+1.65,0);g.rotation.y=Math.PI/4}for(const v of e.squares){a.add(t.box(v.w-1,.05,v.d-1,.3),a.mat(i.stone),o,v.x,ge+.01,v.z),a.add(t.cylinder(1.1,.36),a.mat(i.stone),o,v.x,ge+.2,v.z),a.add(t.cylinder(.92,.06),a.mat(i.water),o,v.x,ge+.38,v.z),a.add(t.cylinder(.16,.7),a.mat(i.stone),o,v.x,ge+.5,v.z);for(const y of[-1,1]){a.add(t.box(1.3,.1,.4),a.mat(i.wood),o,v.x,ge+.32,v.z+y*2.1);for(const g of[-.5,.5])a.add(t.box(.1,.3,.3),a.mat(i.rail),o,v.x+g,ge+.15,v.z+y*2.1)}for(const[y,g]of[[-1,-1],[1,-1],[-1,1],[1,1]])p(v.x+y*(v.w/2-1.1),v.z+g*(v.d/2-1.1),.8)}const x=e.heart;if(x!==null){const v=(x.x0+x.x1)/2,y=(x.z0+x.z1)/2;a.add(t.box(x.x1-x.x0,.05,x.z1-x.z0,.3),a.mat(i.stone),o,v,ge+.01,y);for(const[g,b]of[[-1,-1],[1,-1],[-1,1],[1,1]]){const S=g<0?x.x0+.9:x.x1-.9,T=b<0?x.z0+.9:x.z1-.9;p(S,T,1);const M=S-g*1.6;a.add(t.box(1.1,.4,.7,.08),a.mat(i.stone),o,M,ge+.2,T),a.add(t.ball(.42),a.mat(i.leaves[1]),o,M,ge+.55,T)}for(const g of[-1,1]){const b=g<0?x.x0+.5:x.x1-.5,S=new Xt;S.position.set(b,0,y),S.rotation.y=Math.PI/2,o.add(S),a.add(t.box(1.3,.1,.4),a.mat(i.wood),S,0,ge+.32,0);for(const T of[-.5,.5])a.add(t.box(.1,.3,.3),a.mat(i.rail),S,T,ge+.15,0)}}for(const v of e.trees)p(v.x,v.z,v.size);return o;function p(v,y,g){const b={x:v,z:y};a.add(t.cylinder(.14*g,1.2*g),a.mat(i.trunk),o,b.x,ge+.6*g,b.z),a.add(t.ball(.55*g),a.mat(i.leaves[0]),o,b.x,ge+1.5*g,b.z),a.add(t.ball(.38*g),a.mat(i.leaves[1]),o,b.x+.32*g,ge+1.25*g,b.z+.2*g),a.add(t.ball(.34*g),a.mat(i.leaves[2]),o,b.x-.3*g,ge+1.3*g,b.z-.15*g)}}const XT=480;function wp(e){return{...e.lawn,yLow:-1.35,yHigh:3}}function $T(e,t,n,i=!1){return i?o1(wp(e),t,n):Su(wp(e),t,n)}function qT(e,t,n){const i=n>=XT?a1(t):bl(t);return{...i,x0:i.x0+e.x,x1:i.x1+e.x,z0:i.z0+e.z,z1:i.z1+e.z}}function YT(e,t,n){return Su(qT(e,t,n),n,4e3)}const Ep=1.15;function ZT(e,t,n,i=!1){const s=mm(t,n);if(!i)return{id:e,fp:{x0:s.x0,x1:s.x1,z0:s.z0,z1:s.z1},doorX:t.door.x};const a=(s.x0+s.x1)/2,o=(s.z0+s.z1)/2,r=(s.x1-s.x0)*Ep/2,c=(s.z1-s.z0)*Ep/2;return{id:e,fp:{x0:a-r,x1:a+r,z0:o-c,z1:o+c},doorX:t.door.x,home:!0}}const KT=e=>UT(e.join("\0")),JT=2.6,QT=1.6,jT=4,tA=()=>window.bise?.test===!0;function eA(e){const t=e.agents.map(n=>`${n.name}:${n.status}${n.main?"*":""}`).join(";");return`${e.office.map}|${e.office.size}|${[...e.office.desks.keys()].join(",")}|${No(e.look.grow??os)}|${e.look.night?"n":"d"}|${t}`}const Tp=e=>`${e.office.map}|${e.office.size}|${e.agents.map(t=>`${t.name}${t.main?"*":""}`).join(",")}`,nA=(e,t={})=>{const n=AT(e,{shadowAuto:!1}),{renderer:i,scene:s,sun:a}=n;let o=null,r="",c=[],l=null,d={w:0,maxH:0},f=null,u=null,h=cS,m=!0,_="";const x=new Map;let p=null,v=t.entry===!0;const y=new q,g=tA()?{frames:0,calls:0,ms:0,offices:0,merged:{from:0,to:0},live:[],recent:[],check:{road:0,river:0},heads:[]}:null;g&&(window.__biseTown=g);const b=H=>o?.offices.find(tt=>tt.id===H);function S(H){let tt=x.get(H);return tt||(tt={scene:TT(vn,{ground:!1}),shape:"",bake:null,live:!1,walls:null},x.set(H,tt)),tt}function T(H){H.bake&&(s.remove(H.bake.holder),H.bake.merged.dispose(),H.bake=null)}function M(H){if(!H.walls)return;H.scene.root.remove(H.walls.merged.group),H.walls.merged.dispose(),H.walls=null;const tt=H.scene.world();tt&&(tt.visible=!0)}function E(H,tt){const k=H.scene.world();if(!k)return;const W=`${H.shape}|${No(tt.look.grow??os)}|${tt.look.night?"n":"d"}|${String(k.id)}`;if(H.walls?.sig===W)return;M(H);const at=H.scene.root.position.clone();H.scene.root.position.set(0,0,0),H.scene.root.updateMatrixWorld(!0),k.visible=!0;const ht=Ud(k,vn,vn.shadows);H.scene.root.position.copy(at),H.scene.root.updateMatrixWorld(!0);for(const dt of ht.group.children){const gt=dt.material;gt!==ht.baked&&gt.userData.live!==!0&&(dt.material=gt.clone())}k.visible=v,ht.group.visible=!v,H.scene.root.add(ht.group),H.walls={sig:W,merged:ht}}function A(H){const tt=x.get(H);tt&&(M(tt),T(tt),s.remove(tt.scene.root),tt.scene.dispose(),x.delete(H))}function R(H,tt,k){(tt.reshaped||H.shape!==Tp(tt))&&(H.shape=Tp(tt),H.scene.setOffice(tt.office,tt.agents)),H.scene.prepare(tt.look);const W=G();return W?H.scene.frame(k,tt.played,tt.look,W):null}function D(){for(const[H,tt]of x){const k=b(H);k&&(tt.scene.root.position.set(k.x,0,k.z),tt.bake&&tt.bake.holder.position.set(k.x,0,k.z),tt.bake&&(tt.bake.holder.visible=!tt.live))}m=!0}function O(H){H.traverse(tt=>{tt.geometry?.dispose()})}function P(H){H.loose&&(s.remove(H.loose),O(H.loose),H.loose=null,H.merged.group.visible=!0)}function F(H){if(!o)return;const tt=c.flatMap(dt=>{const gt=b(dt.id),Kt=cu(dt.office.map).pits?.(dt.office,dt.grow.stage)??[];return gt?Kt.map(ct=>({x0:ct.x0+gt.x,x1:ct.x1+gt.x,z0:ct.z0+gt.z,z1:ct.z1+gt.z})):[]}),k=`${String(o.seed)}|${JSON.stringify(o.lawn)}|${String(o.road.length)}|${String(o.trees.length)}|${String(o.offices.length)}|${H?"n":"d"}|${JSON.stringify(tt)}`;if(p?.sig===k)return;p&&(s.remove(p.merged.group),p.merged.dispose(),P(p));const at=kT(o,vn,H?mi:pi,H?WT:VT,tt),ht=Ud(at,vn,vn.shadows);s.add(ht.group),v?(ht.group.visible=!1,s.add(at),p={sig:k,merged:ht,loose:at}):(O(at),p={sig:k,merged:ht,loose:null}),U(H),m=!0}function V(){if(!g)return;g.offices=x.size;let H=p?.merged.from??0,tt=p?.merged.to??0;for(const k of x.values())k.bake&&(H+=k.bake.merged.from,tt+=k.bake.merged.to);g.merged={from:H,to:tt}}function U(H){if(!o)return;const tt=H?mi:pi;n.tint(tt),H&&t.nightLift!==void 0&&(n.hemi.intensity*=t.nightLift,a.intensity*=t.nightLift),n.sky(t.sky?H?t.sky.night:t.sky.day:tt.bg),vn.shadows&&(a.castShadow=!0,a.shadow.mapSize.set(2048,2048),a.shadow.radius=4,a.shadow.bias=-8e-4),_="",B(G())}function B(H){if(!o)return;const{lawn:tt}=o,k=Math.max(tt.x1-tt.x0,tt.z1-tt.z0)*.62+2;let W=(tt.x0+tt.x1)/2,at=(tt.z0+tt.z1)/2,ht=k;if(H&&H!==f&&f){const gt=[J(H,0,0,0),J(H,H.widthPx,0,0),J(H,0,H.heightPx,0),J(H,H.widthPx,H.heightPx,0)],Kt=gt.map(Pt=>Pt.x),ct=gt.map(Pt=>Pt.z),ut=Math.min(...Kt),vt=Math.max(...Kt),_t=Math.min(...ct),Q=Math.max(...ct),St=Math.max(vt-ut,Q-_t)*.62+4;St<k&&(W=(ut+vt)/2,at=(_t+Q)/2,ht=St)}const dt=`${W.toFixed(2)}|${at.toFixed(2)}|${ht.toFixed(2)}`;if(dt!==_&&(_=dt,a.position.set(W-15,42,at-3),a.target.position.set(W,0,at),a.target.updateMatrixWorld(),vn.shadows)){const gt=a.shadow.camera;gt.left=-ht,gt.right=ht,gt.top=ht,gt.bottom=-ht,gt.near=1,gt.far=140,gt.updateProjectionMatrix(),m=!0}}function I(){!o||d.w<=0||(f=$T(o,d.w,d.maxH,t.box===!0),$())}const G=()=>u??(f&&!lS(h)?r1(f,h):f);function $(){const H=G();H&&(n.look(H),n.size(H),B(H))}function J(H,tt,k,W){const at=tt*H.scale+H.left,ht=H.top-k*H.scale,dt=(W-H.target.y-ht*Pa.y)/La.y;return{x:H.target.x+at*Pn.x+ht*Pa.x+dt*La.x,z:H.target.z+at*Pn.z+ht*Pa.z+dt*La.z}}function it(H,tt){const k=[{x:tt.fp.x0,z:tt.fp.z0},{x:tt.fp.x1,z:tt.fp.z0},{x:tt.fp.x0,z:tt.fp.z1},{x:tt.fp.x1,z:tt.fp.z1}].map(gt=>Qi(H,{x:gt.x,y:0,z:gt.z})),W=Math.min(...k.map(gt=>gt.x)),at=Math.max(...k.map(gt=>gt.x)),ht=Math.min(...k.map(gt=>gt.y))-3/H.scale,dt=Math.max(...k.map(gt=>gt.y));return at>0&&W<H.widthPx&&dt>0&&ht<H.heightPx}const Tt={setTown(H){const tt=H.map(W=>`${W.id}:${W.office.map}:${W.office.size}:${String(W.grow.stage)}:${String(W.grow.garden)}:${W.home===!0?"h":""}`).join("|");(o===null||tt!==r)&&(r=tt,o=HT(H.map(W=>ZT(W.id,W.office,W.grow,W.home===!0)),KT(H.map(W=>W.id))),g&&(g.check={...yg(o)})),c=H;const k=new Set(H.map(W=>W.id));for(const W of[...x.keys()])k.has(W)||A(W);for(const W of H)S(W.id);F(l??!1),D(),I(),V()},still(H,tt){const k=b(H);if(!k)return!1;const W=S(H),at=eA(tt);if(W.bake?.sig===at||R(W,tt,tt.frames[0]?.pose.since??0)===null&&!W.scene.office())return!1;W.scene.root.position.set(0,0,0);const ht=Ud(W.scene.root,vn,vn.shadows);for(const gt of ht.group.children){const Kt=gt.material;Kt!==ht.baked&&(gt.material=Kt.clone())}W.scene.root.position.set(k.x,0,k.z),T(W);const dt=new Xt;return dt.add(ht.group),dt.position.set(k.x,0,k.z),dt.visible=!W.live,s.add(dt),W.bake={sig:at,merged:ht,holder:dt},m=!0,V(),!0},live(H,tt,k){const W=x.get(H);if(!W)return"still";const at=R(W,tt,k);return E(W,tt),m=!0,at??"still"},liveIds(){const H=G();if(!H||!f||!o)return[];if(t.allLive===!0)return o.offices.map(W=>W.id);if((f.right-f.left)/(H.right-H.left)<QT)return[];const tt=H.widthPx/2,k=H.heightPx/2;return o.offices.filter(W=>it(H,W)).map(W=>{const at=Qi(H,{x:(W.fp.x0+W.fp.x1)/2,y:0,z:(W.fp.z0+W.fp.z1)/2});return{id:W.id,d:Math.hypot(at.x-tt,at.y-k)}}).sort((W,at)=>W.d-at.d).slice(0,jT).map(W=>W.id)},setSize(H,tt){return d={w:Math.round(H),maxH:Math.round(tt)},I(),f?.heightPx??0},townFit:()=>f,shownFit:G,diveFit(H,tt){const k=b(H),W=x.get(H)?.scene.office();return k&&W?YT(k,W,tt):null},setView(H){u=H,$()},setCam(H){h=H,$()},frame(H){if(n.lost()||!o)return;l!==H&&(l=H,F(H),U(H));const tt=new Set(Tt.liveIds());for(const[W,at]of x){const ht=tt.has(W)&&at.scene.office()!==null;ht!==at.live&&(at.live=ht,ht?s.add(at.scene.root):(s.remove(at.scene.root),M(at)),at.bake&&(at.bake.holder.visible=!ht),m=!0)}const k=performance.now();(m||v)&&(i.shadowMap.needsUpdate=!0,m=!1),n.render(),g&&(g.frames++,g.ms=performance.now()-k,g.recent=[...g.recent.slice(-29),g.ms],g.calls=i.info.render.calls,g.live=[...x].filter(([,W])=>W.live).map(([W])=>W),g.heads=g.live.flatMap(W=>(x.get(W)?.scene.names()??[]).flatMap(at=>{const ht=Tt.headOf(W,at);return ht?[{id:W,name:at,...ht}]:[]})))},signAt(H){const tt=G(),k=b(H),W=x.get(H)?.scene.office()??c.find(ht=>ht.id===H)?.office;if(!tt||!k||!W)return null;y.set(k.x+W.x0+W.W/2,JT,k.z-.3);const at=Qi(tt,y);return at.x<0||at.x>tt.widthPx||at.y<0||at.y>tt.heightPx?null:at},pick(H,tt){const k=G();if(!k||!o)return null;for(let W=2.6;W>=0;W-=.2){const at=J(k,H,tt,W),ht=o.offices.find(dt=>at.x>dt.fp.x0&&at.x<dt.fp.x1&&at.z>dt.fp.z0&&at.z<dt.fp.z1);if(ht)return ht.id}return null},headOf(H,tt){const k=G(),W=x.get(H);if(!k||!W?.live)return null;const at=W.scene.headTop(tt,y);if(!at)return null;const ht=Qi(k,at);if(ht.x<0||ht.y<-20||ht.x>k.widthPx||ht.y>k.heightPx)return null;const dt=W.scene.feet(tt,y);return{...ht,feet:dt?Qi(k,dt).y:ht.y}},placedOf:H=>b(H)??null,pickBim(H,tt){const k=G();if(!k)return null;for(const[W,at]of x){if(!at.live)continue;const ht=at.scene.names().map(gt=>{const Kt=at.scene.headTop(gt,y),ct=Kt?Qi(k,Kt):null,ut=at.scene.feet(gt,y);return{name:gt,head:ct,feet:ut?Qi(k,ut):null,desk:null}}),dt=CT(ht,H,tt);if(dt!==null)return{id:W,name:dt}}return null},copyTo(H){n.copyTo(H)},onLost(H){n.onLost(H)},entry:{parts(){if(!o)return null;const{lawn:H}=o;return{scape:p?.loose??null,centre:{x:(H.x0+H.x1)/2,z:(H.z0+H.z1)/2},offices:[...x].flatMap(([tt,k])=>{const W=k.scene.office();if(!W||!k.live)return[];const at=v?k.scene.world():null,ht=k.scene.names().flatMap(dt=>{const gt=k.scene.body(dt);return gt?[{name:dt,body:gt}]:[]});return[{id:tt,root:k.scene.root,world:at,width:W.W,bims:ht}]})}},warm(){i.compileAsync(s,n.camera).catch(()=>{})},settle(){if(v){v=!1,p&&P(p);for(const H of x.values()){if(!H.walls)continue;const tt=H.scene.world();tt&&(tt.visible=!1),H.walls.merged.group.visible=!0}m=!0}}},dispose(){for(const H of[...x.keys()])A(H);p&&(s.remove(p.merged.group),p.merged.dispose(),P(p),p=null),n.dispose(),g&&delete window.__biseTown}};return Tt},Sg="loft",Hl=.5,ls=e=>e.filter(t=>!t.main&&!t.archived).map(t=>t.name);function Qt(e,t,n,i,s){return{x0:e-n/2,x1:e+n/2,z0:t-i/2,z1:t+i/2,...s?{of:s}:{}}}function Vl(e){const t={x:e.x,z:e.wz},n={x:e.ax,z:e.wz};return[[e,t],[t,n]].filter(([i,s])=>Math.hypot(i.x-s.x,i.z-s.z)>1e-6)}function iA(e){return[...e.desks.values(),e.mainDesk,...e.islandSpots,...e.lounge,...e.boardSpots,...e.queue,e.door,...e.terrace,e.exit,...e.park?.spots??[]]}const p0=2.4,ul=2.3,Ms=1.4,hl=1,$o=4.3,sA=16,aA=10,oA=6,rA=12,xc=1.15,cA=.8,Ap=2.5;function lA(e,t){const n=ls(e),i=t?.side===3||n.length>sA?3:2,s=i*2,a=xA(n,i,t),o=Math.max(0,...[...a.values()].map(J=>J+1)),r=Math.max(3,Math.ceil(o/s),t?.side===i?t.rows:0),c=2*(Ms/2+hl+i*p0)+.2,l=-c/2,d=$o+r*ul+1,f=Ms/2+hl/2,u=$o-.25,h=d-.5,m=new Map;for(const J of n){const it=pA(a.get(J)??0,i);m.set(J,{x:it.x,z:it.z,wz:it.z-.65,ax:Math.sign(it.x)*f,face:0})}const _=$o+.2,x={x0:-Ms/2,x1:Ms/2,z0:_,z1:_+Math.max(r*ul-1,3.5)},p=[];for(let J=0;J<12;J++){const it=J%2?1:-1,Tt=x.z0+1.2+Math.floor(J/2)*.85;if(Tt>x.z1-.3)break;p.push({x:it*(Ms/2+.32),z:Tt,wz:Tt,ax:it*f,face:it<0?Math.PI/2:-Math.PI/2})}const v=c*.4,y=(v-.9)/3,g=[];for(let J=0;J<aA;J++){const it=J%4,Tt=l+.65+it*y,H=1+Math.floor(J/4)*1.05;g.push({x:Tt,z:H,wz:H,ax:it<3?Tt+y/2:Tt-y/2,face:0})}const b=l+v+1.15,S=[-.45,.45,0].map(J=>({x:b+J,z:.75,wz:u,ax:b+J,face:Math.PI})),T=c/2-1.55,M=T-1.45,E={x:T,z:1.25,wz:.8,ax:M,face:0},A=[];for(let J=0;J<oA;J++)A.push({x:M,z:1.3+J*Hl,wz:u,ax:M,face:Math.PI/2});const R={x:-f,z:d+.2,wz:h,ax:-f,face:Math.PI},D=[];for(let J=0;J<rA;J++){const it=J%4,Tt=l+1+it*xc,H=d+1.5+Math.floor(J/4)*xc;D.push({x:Tt,z:H,wz:H,ax:it<3?Tt+xc/2:Tt-xc/2,face:0})}const O=d+cA,P={x:l-Ap,z:O,wz:O,ax:l-Ap,face:-Math.PI/2},F={desks:m,mainDesk:E,islandSpots:p,lounge:g,boardSpots:S,queue:A,door:R,terrace:D,exit:P},V={map:"loft",size:`${String(i)}x${String(r)}`,W:c,D:d,x0:l,island:x,...F},U=hA(V),B=fA({...V,crossBack:u,crossFront:h,ax:f,tw:O}),I=A[0]?.x??T,G=Math.min(...B[0].map(J=>J.x)),$=[{x:I,z:u},{x:Math.min(I,Math.max(G,l+1.5)),z:u}];return{...V,side:i,rows:r,crossBack:u,crossFront:h,ax:f,walks:B,furniture:U,queueMore:$}}const dA={id:"loft",ready:!0,layout:lA};function fA(e){const{crossBack:t,crossFront:n,ax:i,tw:s,exit:a}=e,o=[...e.desks.values(),e.mainDesk,...e.islandSpots,...e.lounge,...e.boardSpots,...e.queue,e.door,...e.terrace,a],r=o.filter(f=>f.wz<=t+1e-6).map(f=>f.ax),c=[[{x:Math.min(-i,...r),z:t},{x:Math.max(i,...r),z:t}],[{x:-i,z:n},{x:i,z:n}],[{x:-i,z:t},{x:-i,z:n}],[{x:i,z:t},{x:i,z:n}],[{x:-i,z:n},{x:-i,z:s}],[{x:a.x,z:s},{x:-i,z:s}]],l=f=>c.some(([u,h])=>uA(u,h,f)),d=[c[0],...c.slice(1)];for(const f of o){d.push(...Vl(f));const u={x:f.ax,z:f.wz};l(u)||d.push([u,{x:f.ax,z:f.wz<t?t:s}])}return d}function uA(e,t,n){return Math.abs(e.x-t.x)<1e-6?Math.abs(n.x-e.x)<1e-4&&n.z>=Math.min(e.z,t.z)-1e-4&&n.z<=Math.max(e.z,t.z)+1e-4:Math.abs(e.z-t.z)<1e-6?Math.abs(n.z-e.z)<1e-4&&n.x>=Math.min(e.x,t.x)-1e-4&&n.x<=Math.max(e.x,t.x)+1e-4:!1}function hA(e){const t=Qt,n=[];for(const s of e.desks.values())n.push(t(s.x,s.z+.5,1.6,.78));n.push(t(e.mainDesk.x,e.mainDesk.z+.6,2.3,1));const i=(e.island.z0+e.island.z1)/2;n.push(t((e.island.x0+e.island.x1)/2,i,e.island.x1-e.island.x0+.1,e.island.z1-e.island.z0+.15));for(const s of e.lounge)n.push(t(s.x,s.z-.05,.72,.72,s));for(const s of e.terrace)n.push(t(s.x,s.z+.05,.5,.95,s));return n}function pA(e,t){const n=t*2,i=e%n,s=Math.floor(e/n),a=i<t,o=a?t-1-i:i-t;return{x:(a?-1:1)*(Ms/2+hl+p0*(o+.5)),z:$o+.55+ul*s}}function mA(e,t){const n=Math.round((Math.abs(e.x)-Ms/2-hl)/p0-.5),i=e.x<0?t-1-n:t+n;return Math.round((e.z-$o-.55)/ul)*t*2+i}function xA(e,t,n){const i=new Map,s=new Set;if(n?.side===t)for(const o of e){const r=n.desks.get(o);if(!r)continue;const c=mA(r,t);i.set(o,c),s.add(c)}let a=0;for(const o of e)if(!i.has(o)){for(;s.has(a);)a++;i.set(o,a),s.add(a)}return i}const zp=(e,t)=>Math.hypot(e.x-t.x,e.z-t.z)<1e-6;function io(e,t){const n=e.filter(([i,s])=>!zp(i,s));for(const i of t){n.push(...Vl(i.s));const s={x:i.s.ax,z:i.s.wz};i.to&&!zp(s,i.to)&&n.push([s,i.to])}return n}function $s(e,t,n=[]){const i=[...t.filter(s=>s.to&&Math.abs(s.to.z-e)<1e-6).map(s=>s.to?.x??0),...n];return[{x:Math.min(...i),z:e},{x:Math.max(...i),z:e}]}function so(e,t){const n=ls(e),i=new Map,s=new Set;for(const o of n){const r=t?.get(o);r!==void 0&&(i.set(o,r),s.add(r))}let a=0;for(const o of n)if(!i.has(o)){for(;s.has(a);)a++;i.set(o,a),s.add(a)}return{names:n,slots:i,used:Math.max(0,...[...i.values()].map(o=>o+1))}}const fu=6;function zr(e,t,n,i={}){const s=i.lx0??e+.65,a=i.lw??t*.4-.9,o=i.n??10,r=i.bed??.72,c=a/3,l=[],d=[],f=[];for(let v=0;v<o;v++){const y=v%4,g=s+y*c,b=1+Math.floor(v/4)*1.05;if(b+r/2>n-.2)break;const S={x:g,z:b,wz:b,ax:y<3?g+c/2:g-c/2,face:0};l.push(S),f.push(Qt(g,b-.05,r,r,S)),d.push({s:S,to:{x:S.ax,z:n}})}const u=s+a+1.6,h=[-.45,.45,0].map(v=>({x:u+v,z:.75,wz:n,ax:u+v,face:Math.PI}));for(const v of h)d.push({s:v});const m=e+t-1.55,_=m-1.45,x={x:m,z:1.25,wz:.8,ax:_,face:0};d.push({s:x,to:{x:_,z:n}}),f.push(Qt(m,x.z+.6,2.3,1));const p=[];for(let v=0;v<fu;v++){const y=1.3+v*.5;if(y>n-.2)break;p.push({x:_,z:y,wz:n,ax:_,face:Math.PI/2})}for(const v of p)d.push({s:v});return{lounge:l,boardSpots:h,mainDesk:x,queue:p,furniture:f,ways:d,boardX:u}}const gA=12,gc=1.15;function ao(e,t,n,i){const s=t+.8,a={x:n,z:t+.2,wz:i,ax:n,face:Math.PI},o=[],r=[],c=[];for(let u=0;u<gA;u++){const h=u%4,m=e+1+h*gc,_=t+1.5+Math.floor(u/4)*gc,x={x:m,z:_,wz:_,ax:h<3?m+gc/2:m-gc/2,face:0};o.push(x),r.push(Qt(m,_+.05,.5,.95,x)),c.push({s:x,to:{x:x.ax,z:s}})}const l={x:e-2.5,z:s,wz:s,ax:e-2.5,face:-Math.PI/2},d=Math.max(n,...c.map(u=>u.to?.x??n)),f=[[{x:n,z:i},{x:n,z:s}],[{x:l.x,z:s},{x:d,z:s}]];return c.push({s:a}),{door:a,terrace:o,exit:l,furniture:r,ways:c,trunk:f,tw:s}}function oo(e,t,n,i){const s=e[0]?.x??t.x,a=Math.min(n[0].x,n[1].x),o=n[0].z;return[{x:s,z:o},{x:Math.min(s,Math.max(a,i+1.5)),z:o}]}const m0={1:pt.stage_1,2:pt.stage_fruit,3:pt.stage_3,4:pt.stage_4,5:pt.stage_5,6:pt.stage_more_fruit,7:pt.stage_7,8:pt.stage_8,9:pt.stage_9,10:pt.stage_10,11:pt.stage_11,12:pt.stage_12,13:pt.stage_13,14:pt.stage_14},_c=4.05,Gd=1.25,vc=1.9,Rp=1.1,Cp=.55,_A=.5,wi=(e,t,n,i)=>({x:e+n*Math.sin(i),z:t+n*Math.cos(i)});function vA(e,t,n){const i=Math.abs(Math.cos(t)),s=Math.abs(Math.sin(t));return Qt(e.x,e.z,Rp*i+Cp*s,Rp*s+Cp*i,n)}function MA(e,t){const{names:n,slots:i,used:s}=so(e,t?.slots),a=Math.max(6,s,t?.cap??0),o=a+a%2,r=Math.max(3.4,o*1.9/(2*Math.PI)),c=r+.9,l=Math.max(11,2*c+2.6),d=-l/2,f=0,u=_c+c,h=u+c,m=h+.7,_=zr(d,l,_c),x=ao(d,m,f,h),p=[..._.ways,...x.ways],v=[..._.furniture,...x.furniture],y=new Map;for(const R of n){const D=(2*(i.get(R)??0)+1)*Math.PI/o,O=wi(f,u,r,D),P={...O,wz:O.z,ax:O.x,face:D+Math.PI};y.set(R,P),v.push(vA(wi(f,u,r-_A,D),D,P)),p.push({s:P,to:wi(f,u,c,D)})}const g=Qt(f,u,2*Gd,2*Gd);v.push(g);const b=[];for(let R=0;R<8;R++){const D=R*Math.PI/4,O=wi(f,u,vc,D);b.push({...O,wz:O.z,ax:O.x,face:D+Math.PI})}const S=(R,D)=>{const O=Array.from({length:D},(P,F)=>wi(f,u,R,F*2*Math.PI/D));return O.map((P,F)=>[P,O[(F+1)%D]??P])},T=$s(_c,p,[f]),M=[T,...x.trunk,...S(vc,8),...S(c,2*o),[wi(f,u,vc,Math.PI),wi(f,u,c,Math.PI)],[wi(f,u,vc,0),wi(f,u,c,0)]],E=io(M,p),A={desks:y,mainDesk:_.mainDesk,islandSpots:b,lounge:_.lounge,boardSpots:_.boardSpots,queue:_.queue,door:x.door,terrace:x.terrace,exit:x.exit};return{map:"greenhouse",size:`ring${String(o)}`,W:l,D:m,x0:d,island:g,...A,walks:E,furniture:v,queueMore:oo(_.queue,_.mainDesk,T,d),slots:i,cap:o,crossBack:_c,cx:f,cz:u,R:r,Ro:c,tableR:Gd}}const yA={id:"greenhouse",ready:!0,layout:MA,things:m0},xn=4.05,Pp=5.2,Zi=4.6,bA=4.2,Lp=[0,.25,-.2,.15,-.1,.3];function SA(e,t){const{names:n,slots:i,used:s}=so(e,t?.slots),a=Math.max(2,Math.ceil(Math.max(s,t?.cap??0)/4)),o=a*4,r=a>4?3:2,c=Math.ceil(a/r),l=r*Pp+2.4,d=-l/2,f=d+1.45,u=xn+c*Zi,h=u+.6,m=zr(d,l,xn),_=ao(d,h,f,u),x=[...m.ways,..._.ways],p=[...m.furniture,..._.furniture],v=[];for(let O=0;O<a;O++){const P=O%r,F=Math.floor(O/r);v.push({x:d+bA+P*Pp+F%2*.6,z:xn+Zi/2+F*Zi+(Lp[O%Lp.length]??0)})}const y=new Map;for(const O of n){const P=i.get(O)??0,F=Math.floor(P/4),V=P%4,U=v[F]??{x:0,z:xn+Zi/2},B=Math.floor(F/r),I=U.x+(V%2?.8:-.8),G=V<2,$=U.z+(G?-1.05:1.05),J=xn+(G?B:B+1)*Zi,it={x:I,z:$,wz:J,ax:I,face:G?0:Math.PI};y.set(O,it),p.push(Qt(I,$+(G?.5:-.5),1.6,.78)),x.push({s:it})}const g=Math.min(6,c*Zi-1),b={x0:d+.2,x1:d+1.1,z0:xn+.55,z1:xn+.55+g};p.push(b);const S=[];for(let O=b.z0+.6;O<b.z1-.2;O+=.85)S.push({x:f,z:O,wz:O,ax:f,face:-Math.PI/2});const T=Math.max(f,...[...y.values()].map(O=>O.x)),M=[];for(let O=1;O<=c;O++)M.push([{x:f,z:xn+O*Zi},{x:T,z:xn+O*Zi}]);const E=$s(xn,x,[f,T,...[...y.values()].filter(O=>O.wz===xn).map(O=>O.x)]),A=[E,..._.trunk,...M,[{x:f,z:xn},{x:f,z:u}]],R=io(A,x),D={desks:y,mainDesk:m.mainDesk,islandSpots:S,lounge:m.lounge,boardSpots:m.boardSpots,queue:m.queue,door:_.door,terrace:_.terrace,exit:_.exit};return{map:"campus",size:`pods${String(a)}`,W:l,D:h,x0:d,island:b,...D,walks:R,furniture:p,queueMore:oo(m.queue,m.mainDesk,E,d),slots:i,cap:o,crossBack:xn,pods:v,aisle:f}}const wA={id:"campus",ready:!0,layout:SA,things:m0},ii=1.9,Mc=1.8,yc=1.1,EA=e=>e%3===2?{back:!1,i:Math.floor(e/3)}:{back:!0,i:Math.floor(e/3)*2+e%3};function TA(e,t){const{names:n,slots:i,used:s}=so(e,t?.slots),a=Math.max(6,s,t?.cap??0),o=Math.floor(a/3),r=a-o,c=Math.max(12.5,(r-1)*Mc+7.55),l=Math.max(8.6,o*Mc+3.3),d=-c/2,f=d+c,u=d+1.9,h=l-.5,m=[],_=[],x=new Map;for(const B of n){const I=EA(i.get(B)??0);let G;if(I.back){const $=d+3.2+I.i*Mc;G={x:$,z:yc,wz:ii,ax:$,face:Math.PI},_.push(Qt($,yc-.5,1.6,.78))}else{const $=3+I.i*Mc;G={x:d+yc,z:$,wz:$,ax:u,face:-Math.PI/2},_.push(Qt(d+yc-.5,$,.78,1.6))}x.set(B,G),m.push({s:G})}const p=f-1.8,v=f-3.25,y={x:p,z:3,wz:3,ax:v,face:0};_.push(Qt(p,3.6,2.3,1)),m.push({s:y});const g=[];for(let B=0;B<fu;B++)g.push({x:v,z:2.6+B*.5,wz:ii,ax:v,face:Math.PI/2});for(const B of g)m.push({s:B});const b=f-1.6,S=[-.45,.45,0].map(B=>({x:b+B,z:.75,wz:ii,ax:b+B,face:Math.PI}));for(const B of S)m.push({s:B});const T=u+1.9,M=ii+1.45,E=Qt(T,M,2.6,.9);_.push(E);const A=[];for(const B of[-1.1,-.35,.4,1.15])A.push({x:T+B,z:M-.75,wz:M-.75,ax:T+B,face:0}),A.push({x:T+B,z:M+.75,wz:M+.75,ax:T+B,face:Math.PI});const R=Qt(T+3.4,M,2.6,1.5);_.push(R);const D=[];for(let B=0;B<8;B++){const I=B%4,G=f-3.9+I*.95,$=l-3+Math.floor(B/4)*1.05,J={x:G,z:$,wz:$,ax:I<3?G+.475:G-.475,face:0};D.push(J),_.push(Qt(G,$-.05,.62,.62,J)),m.push({s:J,to:{x:J.ax,z:h}})}const O=ao(d,l,u,h);m.push(...O.ways),_.push(...O.furniture);const P=$s(ii,[...m,...S.map(B=>({s:B,to:{x:B.x,z:ii}}))],[u,v,...[...x.values()].filter(B=>B.wz===ii).map(B=>B.x)]),F=[M-.75,M+.75].map(B=>[{x:u,z:B},{x:T+1.15,z:B}]),V=[P,...O.trunk,[{x:u,z:ii},{x:u,z:h}],$s(h,m,[u]),[{x:v,z:ii},{x:v,z:2.6+(fu-1)*.5}],...F],U=io(V,m);return{map:"workshop",size:`walls${String(a)}`,W:c,D:l,x0:d,island:E,desks:x,mainDesk:y,islandSpots:A,lounge:D,boardSpots:S,queue:g,door:O.door,terrace:O.terrace,exit:O.exit,walks:U,furniture:_,queueMore:oo(g,y,P,d),slots:i,cap:a,crossBack:ii,pingpong:R,aisle:u,crossFront:h}}const AA={id:"workshop",ready:!0,layout:TA,things:m0},_a=4.05,bc=12.5,Hd=2.1,zA=[3.4,5.8];function RA(e,t){const{names:n,slots:i,used:s}=so(e,t?.slots),a=Math.max(3,Math.ceil(Math.max(s,t?.cap??0)/2)),o=a*2,r=4.4+a*Hd+1.2,c=-bc/2,l=c+1.85,d=c+4.6,f=r-.5,u=zr(c,bc,_a,{n:0,lw:3.4}),h=[...u.ways],m=[...u.furniture],_=c+2.6,x=Qt(_,1.75,2.8,.7);m.push(x);const p=[],v=c+.7;for(const R of[0,1])for(const D of[-1.2,-.4,.4,1.2]){const O=_+D,P=R===0?{x:O,z:1,wz:.45,ax:v,face:0}:{x:O,z:2.5,wz:2.5,ax:O,face:Math.PI};p.push(P),m.push(Qt(O,P.z,.55,.55,P)),h.push({s:P,to:{x:P.ax,z:_a}})}p.push(...p.splice(0,4));const y=new Map;for(const R of n){const D=i.get(R)??0,O=D%2,P=c+(zA[O]??3.4),F=4.95+Math.floor(D/2)*Hd,V={x:P,z:F,wz:F-.65,ax:O===0?l:d,face:0};y.set(R,V),m.push(Qt(P,F+.5,1.6,.78)),h.push({s:V})}const g={x0:c+.55,x1:c+1.45,z0:4.8,z1:4.8+Math.min(4.5,a*Hd-.6)};m.push(g);const b=[];for(let R=g.z0+.5;R<g.z1-.2;R+=.85)b.push({x:l,z:R,wz:R,ax:l,face:-Math.PI/2});const S=ao(c,r,l,f);h.push(...S.ways),m.push(...S.furniture);const T={x0:c+7.4,x1:c+bc-.3,z0:4.6,z1:r-1.4},M=$s(_a,h,[l,d]),E=[M,...S.trunk,[{x:l,z:_a},{x:l,z:f}],[{x:d,z:_a},{x:d,z:f}],[{x:l,z:f},{x:d,z:f}]],A=io(E,h);return{map:"kyoto",size:`rows${String(a)}`,W:bc,D:r,x0:c,island:g,desks:y,mainDesk:u.mainDesk,islandSpots:b,lounge:p,boardSpots:u.boardSpots,queue:u.queue,door:S.door,terrace:S.terrace,exit:S.exit,walks:A,furniture:m,queueMore:oo(u.queue,u.mainDesk,M,c),slots:i,cap:o,crossBack:_a,garden:T,kotatsu:x,rows:a}}const CA={1:pt.stage_kyoto_1,2:pt.stage_kyoto_2,3:pt.stage_kyoto_3,4:pt.stage_kyoto_4,5:pt.stage_kyoto_5,6:pt.stage_kyoto_6,7:pt.stage_kyoto_7,8:pt.stage_kyoto_8,9:pt.stage_kyoto_9,10:pt.stage_kyoto_10,11:pt.stage_kyoto_11,12:pt.stage_kyoto_12,13:pt.stage_kyoto_13,14:pt.stage_kyoto_14},PA={id:"kyoto",ready:!0,layout:RA,things:CA},Ki=4.05,xs=1.9,Ip=1.75,Dp=1.4;function LA(e,t){const{names:n,slots:i,used:s}=so(e,t?.slots),a=Math.max(3,Math.ceil(Math.max(s,t?.cap??0)/3)),o=a*3,r=Math.max(5.6,a*xs+.4),c=r+5.4,l=-c/2,d=l+c,f=Ki+2.15,u={x0:l+2.7,x1:d-2.7,z0:f,z1:f+r},h=l+2.25,m=d-2.25,_=u.z1+.6,x=_+.6,p=zr(l,c,Ki),v=ao(l,x,h,_),y=[...p.ways,...v.ways],g=[...p.furniture,...v.furniture],b=new Map,S=(r-a*xs)/2;for(const V of n){const U=i.get(V)??0,B=Math.floor(U/3),I=U%3;let G;if(I===1){const $=u.x0+S+xs/2+B*xs;G={x:$,z:Ki+.65,wz:Ki,ax:$,face:0},g.push(Qt($,G.z+.5,Dp,.78))}else{const $=f+xs/2+B*xs,J=I===0,it=J?l+.9:d-.9;G={x:it,z:$,wz:$+xs/2,ax:J?h:m,face:J?Math.PI/2:-Math.PI/2},g.push(Qt(it+(J?.5:-.5),$,.78,Dp))}b.set(V,G),y.push({s:G})}const T=(u.x0+u.x1)/2,M=(u.z0+u.z1)/2,E=Qt(T,M,2.2,2.2);g.push(E);const A=V=>({x:T+Ip*Math.sin(V),z:M+Ip*Math.cos(V)}),R=[];for(let V=0;V<8;V++){const U=V*Math.PI/4;R.push({...A(U),wz:A(U).z,ax:A(U).x,face:U+Math.PI})}const D=$s(Ki,y,[h,m]),O=R.map((V,U)=>[V,R[(U+1)%8]??V]),P=[D,...v.trunk,[{x:h,z:Ki},{x:h,z:_}],[{x:m,z:Ki},{x:m,z:_}],[{x:h,z:_},{x:m,z:_}],...O,[A(0),{x:T,z:_}]],F=io(P,y);return{map:"riad",size:`galleries${String(a)}`,W:c,D:x,x0:l,island:E,desks:b,mainDesk:p.mainDesk,islandSpots:R,lounge:p.lounge,boardSpots:p.boardSpots,queue:p.queue,door:v.door,terrace:v.terrace,exit:v.exit,walks:F,furniture:g,queueMore:oo(p.queue,p.mainDesk,D,l),slots:i,cap:o,crossBack:Ki,patio:u,fx:T,fz:M}}const IA={1:pt.stage_riad_1,2:pt.stage_riad_2,3:pt.stage_riad_3,4:pt.stage_riad_4,5:pt.stage_riad_5,6:pt.stage_riad_6,7:pt.stage_riad_7,8:pt.stage_riad_8,9:pt.stage_riad_9,10:pt.stage_riad_10,11:pt.stage_riad_11,12:pt.stage_riad_12,13:pt.stage_riad_13,14:pt.stage_riad_14},DA={id:"riad",ready:!0,layout:LA,things:IA},Ji=4.05,Vd=10,Mo=1.6,NA=1.5,UA=1.05,Wn=1.85;function OA(e,t){const{names:n,slots:i,used:s}=so(e,t?.slots),a=Math.max(3,Math.ceil(Math.max(s,t?.cap??0)/2)),o=a*2,r=Ji+.45,c=Qt(0,r+a*Mo/2,NA,a*Mo),l=c.z1+1.4,d=l-.5,f=-Vd/2,u=zr(f,Vd,Ji,{lx0:f+1.4,lw:3,n:8,bed:.8}),h=ao(f,l,-Wn,d),m=[...u.ways,...h.ways],_=[...u.furniture,...h.furniture,c],x=new Map;for(const S of n){const T=i.get(S)??0,M=T%2?1:-1,E=r+Mo/2+Math.floor(T/2)*Mo,A={x:M*UA,z:E,wz:E,ax:M*Wn,face:M<0?Math.PI/2:-Math.PI/2};x.set(S,A),m.push({s:A})}const p={x0:f+.15,x1:f+1.05,z0:Ji+.55,z1:Ji+.55+Math.min(4,a*Mo-.4)};_.push(p);const v=[];for(let S=p.z0+.5;S<p.z1-.2;S+=.85)v.push({x:f+1.4,z:S,wz:S,ax:-Wn,face:-Math.PI/2});for(const S of v)m.push({s:S});const y=$s(Ji,m,[-Wn,Wn]),g=[y,...h.trunk,[{x:-Wn,z:Ji},{x:-Wn,z:d}],[{x:Wn,z:Ji},{x:Wn,z:d}],[{x:-Wn,z:d},{x:Wn,z:d}]],b=io(g,m);return{map:"nordic",size:`table${String(a)}`,W:Vd,D:l,x0:f,island:p,desks:x,mainDesk:u.mainDesk,islandSpots:v,lounge:u.lounge,boardSpots:u.boardSpots,queue:u.queue,door:h.door,terrace:h.terrace,exit:h.exit,walks:b,furniture:_,queueMore:oo(u.queue,u.mainDesk,y,f),slots:i,cap:o,crossBack:Ji,table:c}}const FA={1:pt.stage_nordic_1,2:pt.stage_nordic_2,3:pt.stage_nordic_3,4:pt.stage_nordic_4,5:pt.stage_nordic_5,6:pt.stage_nordic_6,7:pt.stage_nordic_7,8:pt.stage_nordic_8,9:pt.stage_nordic_9,10:pt.stage_nordic_10,11:pt.stage_nordic_11,12:pt.stage_nordic_12,13:pt.stage_nordic_13,14:pt.stage_nordic_14},BA={id:"nordic",ready:!0,layout:OA,things:FA},GA=4.3,Nn=4,HA=6,VA=12,Sc=1.15,Np=2.5;function Rr(e){const{x0:t,W:n}=e,i=e.main==="right"?1:-1,s=g=>i===1?t+g:t+n-g,a=1.3,[o,r]=e.bed??[.72,.72],c=[],l=[];for(let g=0;g<(e.beds??8);g++){const b=g%4,S=.9+b*a,T=1+Math.floor(g/4)*1.2,M={x:s(S),z:T,wz:T,ax:s(b<3?S+a/2:S-a/2),face:0};c.push(M),l.push(Qt(M.x,M.z,o,r,M))}const d=s(.9+3*a+1.9),f=[-.45,.45,0].map(g=>({x:d+g,z:.75,wz:Nn,ax:d+g,face:Math.PI})),u=s(n-1.55),h=s(n-3),m={x:u,z:1.25,wz:.8,ax:h,face:0};l.push(Qt(u,1.85,2.3,1));const _=[];for(let g=0;g<HA;g++)_.push({x:h,z:1.3+g*Hl,wz:Nn,ax:h,face:i*Math.PI/2});const x=[...c.map(g=>g.ax),...f.map(g=>g.x),h,...e.reach??[]],p=[{x:Math.min(...x),z:Nn},{x:Math.max(...x),z:Nn}],v=i===1?p[0].x:p[1].x,y=[{x:h,z:Nn},{x:i===1?Math.min(h,Math.max(v,t+1.5)):Math.max(h,Math.min(v,t+n-1.5)),z:Nn}];return{lounge:c,boardSpots:f,mainDesk:m,queue:_,furniture:l,corridor:p,queueMore:y}}function Cr(e){const{x0:t,W:n,D:i,doorX:s}=e,a=i-.5,o=i+.8,r={x:s,z:i+.2,wz:a,ax:s,face:Math.PI},c=[],l=[];for(let _=0;_<VA;_++){const x=_%4,p=t+e.terraceU+x*Sc,v=i+1.5+Math.floor(_/4)*Sc,y={x:p,z:v,wz:v,ax:x<3?p+Sc/2:p-Sc/2,face:0};c.push(y),l.push(Qt(p,v+.05,.5,.95,y))}const d=e.out==="left",f=d?t-Np:t+n+Np,u={x:f,z:o,wz:o,ax:f,face:d?-Math.PI/2:Math.PI/2},h=[s,...c.map(_=>_.ax)],m=d?[{x:f,z:o},{x:Math.max(...h),z:o}]:[{x:Math.min(...h),z:o},{x:f,z:o}];return{door:r,terrace:c,exit:u,furniture:l,legs:[[{x:s,z:a},{x:s,z:o}],m],crossFront:a,tw:o}}const x0=(e,t)=>Math.hypot(e.x-t.x,e.z-t.z)<1e-4;function WA([e,t],n){const i=t.x-e.x,s=t.z-e.z,a=i*i+s*s,o=a>0?((n.x-e.x)*i+(n.z-e.z)*s)/a:0;return o<-1e-4||o>1+1e-4?!1:x0({x:e.x+i*o,z:e.z+s*o},n)}function kA([e,t],n){const i=Math.max(2,Math.ceil(Math.hypot(t.x-e.x,t.z-e.z)/.02)),s=1e-6;for(let a=1;a<i;a++){const o=e.x+(t.x-e.x)*a/i,r=e.z+(t.z-e.z)*a/i;if(o>n.x0+s&&o<n.x1-s&&r>n.z0+s&&r<n.z1-s)return!0}return!1}function Pr(e,t){const n=t[0];if(n===void 0)throw new Error(`${e.map}: no trunk`);const i=[n,...t.slice(1)],s=t.filter(([a,o])=>Math.abs(a.z-o.z)<1e-6);for(const a of iA({...e,queueMore:[n[0],n[0]]})){i.push(...Vl(a));const o={x:a.ax,z:a.wz};if(t.some(l=>WA(l,o)))continue;const c=s.filter(([l,d])=>o.x>=Math.min(l.x,d.x)-1e-6&&o.x<=Math.max(l.x,d.x)+1e-6).map(([l])=>[o,{x:o.x,z:l.z}]).filter(l=>!e.furniture.some(d=>kA(l,d))).sort((l,d)=>Math.abs(l[1].z-o.z)-Math.abs(d[1].z-o.z))[0];if(c===void 0)throw new Error(`${e.map}: no way from (${String(o.x)}, ${String(o.z)})`);x0(c[0],c[1])||i.push(c)}return i}function Xa(e,t,n){const i=new Map,s=new Set;for(const o of e){const r=t?.get(o);if(r){for(let c=0;c<96;c++)if(!s.has(c)&&x0(n(c),r)){i.set(o,c),s.add(c);break}}}let a=0;for(const o of e)if(!i.has(o)){for(;s.has(a);)a++;i.set(o,a),s.add(a)}return i}const Lr=e=>Math.max(0,...[...e.values()].map(t=>t+1)),qo=14.4,Yo=-qo/2,wc=[Yo+.6,0,Yo+qo-.6],Bc=[-3.5,3.5],Ra=3,XA=1.6,$A=2.7,qA=1.1,YA=4.7,Up=5,Io=e=>YA+Math.floor(e/2)*$A+e%2*qA,uu=e=>Bc[e%2]??0;function Op(e){const t=Math.floor(e/Ra);return{x:uu(t)+(e%Ra-1)*XA,z:Io(t)+1.05}}function ZA(e,t){const n=ls(e),i=Xa(n,t?.desks,Op),s=Math.max(1,Math.ceil(Math.ceil(Lr(i)/Ra)/2),t?.rows??0),[a,o,r]=wc,c=new Map,l=[];for(const S of n){const T=i.get(S)??0,M=Math.floor(T/Ra),E=T%Ra,A=Op(T),R=M%2===0?E===0?a:o:E===Ra-1?r:o;c.set(S,{x:A.x,z:A.z,wz:Io(M)+.5,ax:R,face:0}),l.push(Qt(A.x,A.z+.5,1.4,.76))}const d=[];for(let S=0;S<s*2;S++)d.push({x:uu(S),z:Io(S),w:Up,c:S%5}),l.push(Qt(uu(S),Io(S),Up,.24));const u=Io(s*2-1)+1.05+.89+1.35,h=Qt(Bc[0],u,4.4,.9),m=Qt(Bc[1],u,4.2,.7);l.push(h,m);const _=[];for(const S of[-1,1])for(const T of[-1.5,-.5,.5,1.5]){const M=u+S*.8;_.push({x:Bc[0]+T,z:M,wz:M,ax:o,face:S<0?0:Math.PI})}const x=u+1.55,p=x+.5,v=Rr({x0:Yo,W:qo,main:"right",bed:[.6,.9],reach:wc}),y=Cr({x0:Yo,W:qo,D:p,doorX:o,terraceU:1,out:"left"});l.push(...v.furniture,...y.furniture);const g=[v.corridor,[{x:a,z:x},{x:r,z:x}],...wc.map(S=>[{x:S,z:Nn},{x:S,z:x}]),...y.legs],b={map:"patio",size:`patio-${String(s)}`,W:qo,D:p,x0:Yo,island:h,desks:c,islandSpots:_,mainDesk:v.mainDesk,lounge:v.lounge,boardSpots:v.boardSpots,queue:v.queue,door:y.door,terrace:y.terrace,exit:y.exit,furniture:l};return{...b,walks:Pr(b,g),queueMore:v.queueMore,rows:s,slabs:d,trough:m,aisles:wc}}const KA={id:"patio",ready:!0,layout:ZA},Ln=-7,Ca=6.2,zs=1.9,hr=1.7,hu=Ln+3.3,Wd=e=>Math.max(12.6,6.5+(e-1)*hr);function kd(e,t){const n=Math.floor(e/3),i=Ln+t;switch(e%3){case 0:return{x:Ln+1,z:Ca+n*zs,wz:Ca+n*zs,ax:Ln+.45,face:Math.PI/2};case 1:return{x:hu+n*hr,z:GA+.55,wz:Nn,ax:hu+n*hr,face:0};default:return{x:i-1,z:Ca+n*zs,wz:Ca+n*zs,ax:i-.45,face:-Math.PI/2}}}function JA(e){return e.face===0?Qt(e.x,e.z+.5,1.4,.76):Qt(e.x+Math.sign(Math.sin(e.face))*.5,e.z,.76,1.4)}function QA(e,t){const n=ls(e),i=Xa(n,t?.desks,E=>kd(E,Wd(t?.k??3))),s=Math.max(3,Math.ceil(Lr(i)/3),t?.k??0),a=Wd(s),o=a===Wd(t?.k??3)?i:Xa(n,t?.desks,E=>kd(E,a)),r=Ln+a,c=new Map,l=[];for(const E of n){const A=kd(o.get(E)??0,a);c.set(E,A),l.push(JA(A))}const d=Ca+(s-1)*zs+.7,f={x0:Ln+2.4,x1:r-2.4,z0:6,z1:d},u=[];for(let E=Ca-zs/2;E<=d+.01;E+=zs)u.push({x:Ln+2.2,z:E},{x:r-2.2,z:E});for(let E=hu-hr/2;E<=r-2.2;E+=hr)u.push({x:E,z:6});for(const E of u)l.push(Qt(E.x,E.z,.24,.24));const h=Ln+a/2,m=(6.3+d)/2,_=Qt(h,m,1.8,.9);l.push(_);const x=m+1,p=[...[-1.05,-.35,.35,1.05].map(E=>({x:h+E,z:x,wz:x,ax:h,face:Math.PI})),{x:h-1.35,z:m,wz:x,ax:h,face:Math.PI/2},{x:h+1.35,z:m,wz:x,ax:h,face:-Math.PI/2}],v=d+1.6,y=v-.5,g=[Ln+.45,r-.45],b=Rr({x0:Ln,W:a,main:"right",bed:[.62,.62],reach:g}),S=Cr({x0:Ln,W:a,D:v,doorX:h,terraceU:1,out:"left"});l.push(...b.furniture,...S.furniture);const T=[b.corridor,[{x:g[0],z:y},{x:g[1],z:y}],...g.map(E=>[{x:E,z:Nn},{x:E,z:y}]),[{x:h,z:x},{x:h,z:y}],...S.legs],M={map:"haveli",size:`haveli-${String(s)}`,W:a,D:v,x0:Ln,island:_,desks:c,islandSpots:p,mainDesk:b.mainDesk,lounge:b.lounge,boardSpots:b.boardSpots,queue:b.queue,door:S.door,terrace:S.terrace,exit:S.exit,furniture:l};return{...M,walks:Pr(M,T),queueMore:b.queueMore,k:s,yard:f,columns:u}}const jA={id:"haveli",ready:!0,layout:QA},Do=16.6,ss=-Do/2,as=8,tz=1.55,wg=2.7,pu=5.4,Eg=.75,Ec=[ss+.6,ss+14.3];function Xd(e){const t=Math.floor(e/as),n=e%as;return{x:ss+2+n*tz,z:pu+t*wg+Eg*Math.sin(n/(as-1)*1.5*Math.PI)}}function ez(e,t){const n=ls(e),i=Xa(n,t?.desks,Xd),s=Math.max(2,Math.ceil(Lr(i)/as),t?.curves??0),[a,o]=Ec,r=new Map,c=[];for(const g of n){const b=Xd(i.get(g)??0);r.set(g,{x:b.x,z:b.z,wz:b.z-.6,ax:b.x,face:0}),c.push(Qt(b.x,b.z+.5,1.3,.76))}const l=[],d=[];for(let g=0;g<s;g++){const b=Array.from({length:as},(M,E)=>{const A=Xd(g*as+E);return{x:A.x,z:A.z-.6}});l.push(b);const S=b[0],T=b[as-1];d.push([{x:a,z:S.z},S],[T,{x:o,z:T.z}]);for(let M=1;M<as;M++)d.push([b[M-1],b[M]])}const f=pu+1.6,u=Qt(ss+15.75,f,.9,3.2);c.push(u);const h=[-1.2,-.4,.4,1.2].map(g=>({x:ss+14.95,z:f+g,wz:f+g,ax:o,face:Math.PI/2})),m=Math.max(pu+(s-1)*wg+Eg+.88+1.2,f+2.4),_=m+.5,x=Rr({x0:ss,W:Do,main:"left",bed:[.6,.9],reach:Ec}),p=Cr({x0:ss,W:Do,D:_,doorX:o,terraceU:Do-4.6,out:"right"});c.push(...x.furniture,...p.furniture);const v=[x.corridor,[{x:a,z:m},{x:o,z:m}],...Ec.map(g=>[{x:g,z:Nn},{x:g,z:m}]),...d,...p.legs],y={map:"tropical",size:`tropical-${String(s)}`,W:Do,D:_,x0:ss,island:u,desks:r,islandSpots:h,mainDesk:x.mainDesk,lounge:x.lounge,boardSpots:x.boardSpots,queue:x.queue,door:p.door,terrace:p.terrace,exit:p.exit,furniture:c};return{...y,walks:Pr(y,v),queueMore:x.queueMore,curves:s,paths:l,aisles:Ec}}const nz={id:"tropical",ready:!0,layout:ez},Gc=16.4,Di=-Gc/2,pl=3,iz=1.5,$d=4.8,Tc=[Di+6.45,Di+12.9,Di+16],sz=[Di+3.3,Di+9.7],az=e=>((e*7+3)%3-1)*.3,Tg=e=>(sz[e%2]??0)+az(e),Hc=e=>5.2+Math.floor(e/2)*3.6+e%2*1.3;function Fp(e){const t=Math.floor(e/pl);return{x:Tg(t)+(e%pl-1)*iz,z:Hc(t)+.45}}function oz(e,t){const n=ls(e),i=Xa(n,t?.desks,Fp),s=Math.max(1,Math.ceil(Math.ceil(Lr(i)/pl)/2),t?.rows??0),[a,o,r]=Tc,c=new Map,l=[];for(const T of n){const M=i.get(T)??0,E=Math.floor(M/pl),A=Fp(M);c.set(T,{x:A.x,z:A.z,wz:Hc(E)-.1,ax:E%2===0?a:o,face:0}),l.push(Qt(A.x,A.z+.5,1.3,.76))}const d=[];for(let T=0;T<s*2;T++){const M=Tg(T),E=Hc(T);d.push({x:M,z:E,w:$d}),l.push(Qt(M,E-.55,$d+.1,.22),Qt(M-$d/2-.05,E+.65,.22,2.4))}const f=Di+14.6,u=4.8,h=[Qt(f,u+1,.9,.9),Qt(f,u+2.6,.9,.9)],m=[{x:f-1.1,z:u-.2},{x:f+1.1,z:u-.2},{x:f-1.1,z:u+3.9},{x:f+1.1,z:u+3.9}];l.push(...h,...m.map(T=>Qt(T.x,T.z,.16,.16)));const _=[];for(const T of[u+1,u+2.6])_.push({x:f-.75,z:T,wz:T,ax:o,face:Math.PI/2},{x:f+.75,z:T,wz:T,ax:r,face:-Math.PI/2});_.push({x:f,z:u+.25,wz:u+.25,ax:o,face:0},{x:f,z:u+3.35,wz:u+3.35,ax:o,face:Math.PI});const x=h[1],p=Math.max(Hc(s*2-1)+.45+.89+1.3,u+4.6),v=p+.5,y=Rr({x0:Di,W:Gc,main:"right",bed:[.8,.6],reach:Tc}),g=Cr({x0:Di,W:Gc,D:v,doorX:a,terraceU:1,out:"left"});l.push(...y.furniture,...g.furniture);const b=[y.corridor,[{x:a,z:p},{x:r,z:p}],...Tc.map(T=>[{x:T,z:Nn},{x:T,z:p}]),...g.legs],S={map:"cyclades",size:`cyclades-${String(s)}`,W:Gc,D:v,x0:Di,island:x,desks:c,islandSpots:_,mainDesk:y.mainDesk,lounge:y.lounge,boardSpots:y.boardSpots,queue:y.queue,door:g.door,terrace:g.terrace,exit:g.exit,furniture:l};return{...S,walks:Pr(S,b),queueMore:y.queueMore,rows:s,cubes:d,tables:h,posts:m,lanes:Tc}}const rz={id:"cyclades",ready:!0,layout:oz},Vc=15.6,ys=-Vc/2,mu=4,va=ys+9.9,Ac=1.6;function Bp(e){const t=Math.floor(e/mu);return{x:ys+1.6+e%mu*2.1+t%2*.5,z:5+t*2}}function cz(e,t){const n=ls(e),i=Xa(n,t?.desks,Bp),s=Math.max(3,Math.ceil(Lr(i)/mu),t?.rows??0),a=new Map,o=[];for(const y of n){const g=Bp(i.get(y)??0);a.set(y,{x:g.x,z:g.z,wz:g.z-.6,ax:va,face:0}),o.push(Qt(g.x,g.z+.5,1.4,.76))}const r=5+(s-1)*2,c={x0:ys+.5,x1:va-.45,z0:4.25,z1:r+1.3};for(const y of[c.x0,c.x1])for(const g of[c.z0,c.z1])o.push(Qt(y,g,.2,.2));const l={x:ys+12.9,z:5+s-.5},d=Qt(l.x,l.z,1.5,1.5);o.push(d);const f=Array.from({length:8},(y,g)=>{const b=g/8*Math.PI*2,S=l.x+Ac*Math.sin(b),T=l.z+Ac*Math.cos(b);return{x:S,z:T,wz:T,ax:S,face:Math.atan2(l.x-S,l.z-T)}}),u=f.map((y,g)=>[y,f[(g+1)%8]]),h=Math.max(r+.88+1.2,l.z+Ac+.9),m=h+.5,_=Rr({x0:ys,W:Vc,main:"right",bed:[.7,.5],reach:[va]}),x=Cr({x0:ys,W:Vc,D:m,doorX:l.x,terraceU:1,out:"left"});o.push(..._.furniture,...x.furniture);const p=[_.corridor,[{x:va,z:Nn},{x:va,z:h}],[{x:va,z:h},{x:l.x,z:h}],[{x:l.x,z:l.z+Ac},{x:l.x,z:h}],...u,...x.legs],v={map:"sahel",size:`sahel-${String(s)}`,W:Vc,D:m,x0:ys,island:d,desks:a,islandSpots:f,mainDesk:_.mainDesk,lounge:_.lounge,boardSpots:_.boardSpots,queue:_.queue,door:x.door,terrace:x.terrace,exit:x.exit,furniture:o};return{...v,walks:Pr(v,p),queueMore:_.queueMore,rows:s,hangar:c,tree:l}}const lz={id:"sahel",ready:!0,layout:cz},Gp=11,Hp=3.4,dz=13.5,Wc=3,Ag=2.05,xu=1.95,ml=4.4,fz=ml-.5,uz=16,hz=10,Vp=4.4,pz=6,mz=12,Ma=1.15,xz=.8,Wp=2.5,kp={w:3,d:1.2},gz=6;function _z(e,t){const n=ls(e),i=wz(n,t),s=Math.max(0,...[...i.values()].map(it=>it+1)),a=Math.max(3,Math.ceil(s/Wc),t?.rows??0),o=Gp+Hp+dz,r=Math.max(uz,ml-.2+a*xu+2.6),c=-o/2,l=c+Gp,d=l+Hp,f=c+7.5,u=fz,h=r-2.4,m=new Map;for(const it of n){const Tt=i.get(it)??0,H=c+1.9+Tt%Wc*Ag,tt=ml+Math.floor(Tt/Wc)*xu;m.set(it,{x:H,z:tt,wz:tt-.5,ax:f,face:0})}const _=c+3.9,x=r-1.4,p=Qt(_,x,kp.w,kp.d),v=[-1.2,-.4,.4,1.2].map(it=>({x:_+it,z:h,wz:h,ax:_+it,face:0})),y=(Vp-.9)/3,g=[];for(let it=0;it<hz;it++){const Tt=it%4,H=c+.65+Tt*y,tt=1+Math.floor(it/4)*1.05;g.push({x:H,z:tt,wz:tt,ax:Tt<3?H+y/2:H-y/2,face:0})}const b=c+Vp+1.15,S=[-.45,.45,0].map(it=>({x:b+it,z:.75,wz:u,ax:b+it,face:Math.PI})),T=l-1.6,M=T-1.45,E={x:T,z:1.25,wz:.8,ax:M,face:0},A=[];for(let it=0;it<pz;it++)A.push({x:M,z:1.3+it*Hl,wz:u,ax:M,face:Math.PI/2});const R={x:c+1+Ma/2,z:r+.2,wz:h,ax:c+1+Ma/2,face:Math.PI},D=[];for(let it=0;it<mz;it++){const Tt=it%4,H=c+1+Tt*Ma,tt=r+1.5+Math.floor(it/4)*Ma;D.push({x:H,z:tt,wz:tt,ax:Tt<3?H+Ma/2:H-Ma/2,face:0})}const O=r+xz,P={x:c-Wp,z:O,wz:O,ax:c-Wp,face:-Math.PI/2},F=Mz(d,c+o-.2,.4,r-.2),V=F.flat.z,U={desks:m,mainDesk:E,islandSpots:v,lounge:g,boardSpots:S,queue:A,door:R,terrace:D,exit:P},B={map:"california",size:String(a),W:o,D:r,x0:c,island:p,...U,park:F},I=Sz(B),G=yz({...B,crossBack:u,crossFront:h,aisle:f,tw:O,pathZ:V}),$=Math.min(...G[0].map(it=>it.x)),J=[{x:M,z:u},{x:Math.max($,c+1.5),z:u}];return{...B,rows:a,roomX1:l,parkX0:d,crossBack:u,crossFront:h,aisle:f,pathZ:V,walks:G,furniture:I,queueMore:J}}const vz={id:"california",ready:!0,layout:_z};function Mz(e,t,n,i){const s=(n+7.6+(i-4))/2,a=[],o=e+1.4;for(const c of[.45,1.45])a.push({x:o,z:s+c,wz:s,ax:o,face:Math.PI/2});for(let c=0;c<gz;c++){const l=e+2.6+c*.7;a.push({x:l,z:s+1.45,wz:s,ax:l,face:Math.PI/2})}const r=(c,l,d,f)=>({x0:c,x1:l,z:d,h:f});return{area:{x0:e,x1:t,z0:n,z1:i},spots:a,flat:r(e+2.6,e+7.2,s,0),curb:r(e+5.5,e+7,i-3.4,.2),rail:r(e+.9,e+4.9,i-1.6,.42),ledge:r(e+.8,e+4.8,i-3.4,.45),stairs:{x0:e,xTop:e+2.4,xBottom:e+2.4+4*.42,z0:n+4.8,z1:n+7.2,h:.8,railZ:n+6.95,bankX0:e+.8,bankZ:n+8.6},ramp:{xa:e+1,xb:e+1+1.2+3+1.2,r:1.2,z0:n+.2,z1:n+3.6},qp:{x0:t-3.8,x1:t-.6,zLip:n+.6,r:1,r13:1.7},funbox:{x:e+8.6,z:n+7.2,hw:1,hd:1.1,h:.5,run:1.35},bowl:{x:t-3,z:i-3.4,hw:2.3,hd:2.5,rc:1.4,depth:.95},benches:[{x0:e+.125,x1:e+.575,z0:s-1.9,z1:s-.4},{x0:t-.575,x1:t-.125,z0:n+5.3,z1:n+6.8}],poles:[{x:e+.15,z:n+.15},{x:t-.15,z:n+.15},{x:e+.15,z:n+4.3},{x:e+.15,z:i-.15},{x:(e+t)/2+1,z:n+.15}]}}function yz(e){const{crossBack:t,crossFront:n,aisle:i,tw:s,exit:a,door:o,pathZ:r,park:c}=e,l=[...e.desks.values(),e.mainDesk,...e.islandSpots,...e.lounge,...e.boardSpots,...e.queue,o,...e.terrace,a,...c.spots],d=l.filter(_=>_.wz<=t+1e-6).map(_=>_.ax),f=c.spots.map(_=>_.ax),u=[[{x:Math.min(i,...d),z:t},{x:Math.max(i,...d),z:t}],[{x:i,z:t},{x:i,z:n}],[{x:o.ax,z:n},{x:i,z:n}],[{x:i,z:r},{x:Math.max(...f),z:r}],[{x:o.ax,z:n},{x:o.ax,z:s}],[{x:a.x,z:s},{x:Math.max(o.ax,...e.terrace.map(_=>_.ax)),z:s}]],h=_=>u.some(([x,p])=>bz(x,p,_)),m=[u[0],...u.slice(1)];for(const _ of l){m.push(...Vl(_));const x={x:_.ax,z:_.wz};h(x)||m.push([x,{x:_.ax,z:_.wz<t?t:s}])}return m}function bz(e,t,n){return Math.abs(e.x-t.x)<1e-6?Math.abs(n.x-e.x)<1e-4&&n.z>=Math.min(e.z,t.z)-1e-4&&n.z<=Math.max(e.z,t.z)+1e-4:Math.abs(e.z-t.z)<1e-6?Math.abs(n.z-e.z)<1e-4&&n.x>=Math.min(e.x,t.x)-1e-4&&n.x<=Math.max(e.x,t.x)+1e-4:!1}function Sz(e){const t=[];for(const i of e.desks.values())t.push(Qt(i.x,i.z+.5,1.6,.78));t.push(Qt(e.mainDesk.x,e.mainDesk.z+.6,2.3,1));const n=e.island;t.push({x0:n.x0-.05,x1:n.x1+.05,z0:n.z0-.05,z1:n.z1+.05});for(const i of e.lounge)t.push(Qt(i.x,i.z-.05,.72,.72,i));for(const i of e.terrace)t.push(Qt(i.x,i.z+.05,.5,.95,i));return t}function wz(e,t){const n=new Map,i=new Set;if(t){const a=t.x0;for(const o of e){const r=t.desks.get(o);if(!r)continue;const c=Math.round((r.z-ml)/xu)*Wc+Math.round((r.x-a-1.9)/Ag);n.set(o,c),i.add(c)}}let s=0;for(const a of e)if(!n.has(a)){for(;i.has(s);)s++;n.set(a,s),i.add(s)}return n}const Xp={loft:dA,greenhouse:yA,campus:wA,workshop:AA,kyoto:PA,riad:DA,nordic:BA,patio:KA,haveli:jA,tropical:nz,cyclades:rz,sahel:lz,california:vz};function Ez(e){const t=Xp[e];return t.ready?t:Xp[Sg]}function zg(e,t=Sg,n){const i=Ez(t);return i.layout(e,n?.map===i.id?n:void 0)}const Tz=new Set(["sleep","waitagent"]);function Az(e){return e.filter(t=>Tz.has(t.pose.seg.act.k)&&!t.pose.moving).map(t=>t.name)}function zz(e,t){const n=new Set;for(const[i,s]of t){n.add(i);let a=e.querySelector(`:scope > [data-bim="${CSS.escape(i)}"]`);if(a===null){a=document.createElement("div"),a.className="bims-zzz",a.dataset.bim=i,a.dataset.testid=`app.right.bims.zzz.${i}`,a.setAttribute("aria-hidden","true");for(const o of["z","z","Z"]){const r=document.createElement("span");r.textContent=o,a.append(r)}e.append(a)}a.style.transform=`translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`}for(const i of[...e.children])i instanceof HTMLElement&&!n.has(i.dataset.bim??"")&&i.remove()}const Rg={eclipse:!1,ghost:null,tree:!1,cake:!1,april:!1,doodle:!1,music:!1},Rz=4,Cz=5,Pz=5;function Lz(e){return{y:e.getFullYear(),mo:e.getMonth()+1,d:e.getDate(),dow:e.getDay(),s:e.getHours()*3600+e.getMinutes()*60+e.getSeconds()}}const Cg=e=>`${String(e.y)}-${String(e.mo)}-${String(e.d)}`,Iz=2,Pg=.9,Lg=.6,Ig=1.2,Ba=3,Dz=30,$p=20,xl=10,gu=1.4,Nz=new Set(["salto","hop","moonwalk","itemget","kickflip","tap","golden","speedrun","combo","loop"]),_u=new Set(["nap","snack","done","mainidle"]);function g0(e){let t=2166136261;for(let n=0;n<e.length;n++)t^=e.charCodeAt(n),t=Math.imul(t,16777619)>>>0;return t>>>0}const ns=(e,t,n)=>g0(`${e}|${t}`)%n===0,Uz=e=>{const t=Math.max(0,Math.round(e/1e3));return`${String(Math.floor(t/60))}:${String(t%60).padStart(2,"0")}`};function Oz(e,t,n){const i=Cg(n),s=e.day===i?[...e.lands]:[];for(const a of t){const o=a.pose.seg;o.from!=="landing"||o.act.k!=="done"||s.some(r=>r.name===a.name&&r.t===o.t)||s.push({name:a.name,t:o.t})}return s.sort((a,o)=>a.t-o.t),s.length===e.lands.length&&i===e.day?e:{day:i,lands:s}}function Dg(e,t){const{local:n}=e,i=Cg(n),s=10*3600+g0(`eclipse-at|${i}`)%(8*3600),a=ns("eclipse",i,100)&&n.s>=s&&n.s<s+Dz,o=e.night&&n.s<$p?n.s/$p:null,r=e.agents.reduce((m,_)=>_.created_ms===void 0||_.created_ms===null?m:m===null?_.created_ms:Math.min(m,_.created_ms),null),c=r===null?null:new Date(r),l=c!==null&&c.getMonth()+1===n.mo&&c.getDate()===n.d&&c.getFullYear()<n.y,d=e.stage??0,f=e.agents.filter(m=>!m.archived&&m.status==="working").length,u=n.dow===5&&n.s>=17*3600,h=d>=Cz&&(f>=Pz||u);return{eclipse:a,ghost:o,tree:n.mo===12&&(n.d===24||n.d===25),cake:l,april:n.mo===4&&n.d===1,doodle:t&&d>=Rz,music:h}}function Fz(e,t,n,i,s){const{t:a}=t,{pose:o}=e,r=o.seg,c=r.act.k,l=`${e.name}@${r.t.toFixed(3)}`,d=a-r.t,f=r.path.len>.01&&r.from!==null?r.path.len/r.speed:0,u=(h,m,_,x="")=>a>=m&&a<m+_?{kind:h,since:a-m,dur:_,label:x}:null;if(t.konami!==null&&a-t.konami<gu&&a>=t.konami)return{kind:"salto",since:a-t.konami,dur:gu,label:e.main?"+30":""};if(e.main&&s!==null)return u("clap",s,Ba,"");if(e.main){const h=t.lands[3];if(h!==void 0)return u("tetris",h.t,Ba,"line clear")}if(c==="done"&&r.from!==null&&r.from!=="done"){const h=t.lands[0];if(r.from==="landing"&&h!==void 0&&h.name===e.name&&h.t===r.t)return u("itemget",r.t,2.5,"♪ ♪ ♪");const m=n.get(e.name),_=m?.created_ms;if(_!=null&&r.t*1e3-_<12e4&&r.t*1e3>=_)return u("speedrun",r.t,4,Uz(r.t*1e3-_));const x=m?.place_id;if(x!==void 0&&x!==""&&x!=="shared"&&t.frames.some(v=>v.name!==e.name&&v.pose.seg.act.k==="done"&&v.pose.seg.t<r.t&&n.get(v.name)?.place_id===x))return u("combo",r.t,Ba,"combo ×2");if(ns("salto",l,10))return u("salto",r.t,Pg)}if(c==="done"&&!o.moving&&r.act.at==="terrace"){const h=Math.floor(a/3600),m=h*3600+g0(`kickflip|${e.name}|${String(h)}`)%3600;if(m>r.t+f){const _=u("kickflip",m,Ig,"kickflip +500");if(_!==null)return _}}if(i.eclipse&&_u.has(c))return{kind:"lookup",since:0,dur:1/0,label:""};if(t.local.mo===10&&t.local.d===31&&t.local.s<xl&&_u.has(c))return{kind:"dance",since:t.local.s,dur:xl,label:""};if(o.moving&&f>4&&ns("hop",l,40))return u("hop",r.t+f/2,Lg);if(o.moving&&r.from==="coffee"&&ns("moonwalk",l,50))return u("moonwalk",r.t,f);if(c==="coffee"&&!o.moving&&ns("tap",l,200))return u("tap",r.t+f,.8);if(c==="snack"&&r.act.fruit===0&&ns("golden",l,500))return{kind:"golden",since:d,dur:1/0,label:""};if(o.plane!==void 0&&ns("loop",`${e.name}@${(a-o.plane.since).toFixed(1)}`,50))return{kind:"loop",since:o.plane.since,dur:1/0,label:""};if(c==="waitagent"){const h=r.act.on,m=h===void 0?void 0:n.get(h)?.waiting_on;if(m?.who==="agent"&&m.name===e.name)return{kind:"stare",since:d,dur:1/0,label:"!"}}return t.local.dow===5&&t.local.s>=17*3600&&(c==="nap"||c==="snack")?{kind:"shades",since:0,dur:1/0,label:""}:null}function Bz(e,t){const n=e.filter(i=>!i.main);return t>0||n.length===0||!n.every(i=>_u.has(i.pose.seg.act.k))||!n.some(i=>i.pose.seg.act.k==="done")?null:Math.max(...e.map(i=>i.pose.seg.t))}function Gz(e){if(e.reduced)return{bims:new Map,office:Rg};const t=new Map(e.agents.map(c=>[c.name,c])),n=e.frames.some(c=>c.pose.seg.act.at==="board"&&!c.pose.moving&&ns("doodle",`${c.name}@${c.pose.seg.t.toFixed(3)}`,10)),i=Dg(e,n),s=Bz(e.frames,e.cards),a=[];for(const c of e.frames){const l=Fz(c,e,t,i,s);l!==null&&a.push([c.name,l])}const o=a.filter(([,c])=>Nz.has(c.kind)&&!(e.konami!==null&&c.dur===gu)).sort(([c,l],[d,f])=>l.since-f.since||(c<d?-1:1)),r=new Set(o.slice(Iz).map(([c])=>c));return{bims:new Map(a.filter(([c])=>!r.has(c))),office:i}}const Hz={bims:new Map,office:Rg};function qp(e,t,n){const i=Dg({local:e,night:t,agents:n},!1),s=e.dow===5&&e.s>=17*3600,a=e.mo===10&&e.d===31&&e.s<xl;return`${JSON.stringify({...i,ghost:i.ghost===null?null:Math.round(i.ghost*40)})}|${String(s)}|${String(a)}`}function Vz(e,t){if(t==null)return e;const n=new Map(e.bims);for(const[i,s]of Object.entries(t.bims??{}))n.set(i,{kind:s.kind,since:s.since,dur:Wz[s.kind]??1/0,label:kz[s.kind]??""});return{bims:n,office:{...e.office,...t.office}}}const Wz={salto:Pg,hop:Lg,kickflip:Ig,itemget:2.5,tap:.8,clap:Ba,dance:xl,speedrun:4,combo:Ba,tetris:Ba},kz={speedrun:"1:47",combo:"combo ×2",stare:"!",itemget:"♪ ♪ ♪",kickflip:"kickflip +500",tetris:"line clear"};function Xz(e){const t=new Map;for(const[n,i]of e.bims)i.label!==""&&t.set(n,i.label);return t}const zc={walk:2.4,hurry:3.5,skate:3.4,carry:1.8},_0=6,Ng=1.5,Yp=3.5,Zp=8,Kp=6,$z=3,qz=3,Yz=10,Zz=new Set(["work","hot","nap","snack","done"]);function Kz(){const e=new Map;let t=null;const n=new Set,i=(o,r)=>o.segs.findLast(c=>c.t<=r)??null,s=(o,r)=>{if(o.leaving&&r>=o.outAt)return null;const c=i(o,r);if(!c)return null;const l=(r-c.t)*c.speed,d=l<c.path.len-1e-9,f=d?gg(c.path,l):{x:c.spot.x,z:c.spot.z,dir:c.spot.face},u=o.planes.findLast(h=>h<=r&&r-h<Yp);return{x:f.x,z:f.z,dir:f.dir,moving:d,since:r-c.t,seg:c,...u===void 0?{}:{plane:{since:r-u}}}},a=(o,r)=>{o.segs.push(r),o.segs.length>Zp&&o.segs.splice(0,o.segs.length-Zp)};return{update(o,r,c,l,d,f){const u=t===null,h=t!==null&&(t.map!==r.map||t.size!==r.size);t=r;const m=new Map;for(const[p,v]of e)v.key&&!v.leaving&&m.set(v.key,p);e5(e,o,l,c,n);for(const p of e.values())p.over&&c>=p.over.until&&(p.over=null);const _=new Map([...o].filter(([p])=>e.get(p)?.over==null)),x=K3(_,r,c,f);for(const[p,v]of o){let y=e.get(p);const g=jz(y?.over?.act??v,y?.key??null,m,r.lounge.length,d),b=y?.over?void 0:x.get(p),S=b?r.park?.spots[b.slot]:void 0,T=b&&S?`skate|${String(b.slot)}|${b.pool?"pool":""}|${b.nine?"900":""}|${String(b.stage)}`:Jz(g),M=y?.segs.at(-1),E=S??Qz(r,p,g);if(y&&M&&!y.leaving&&M.sig===T&&(S!==void 0||M.act.at===g.at)&&!h&&(!E||n5(E,M.spot)))continue;y?.key&&m.delete(y.key);const A=E?null:t5(r,g.at,m,y?.pref),R=E??A?.spot??r.door,D=A?.key??null;if(D&&m.set(D,p),y&&A?.ix!==void 0&&y.pref.set(g.at,A.ix),!y){y={segs:[],key:D,leaving:!1,outAt:1/0,pref:new Map,planes:[],over:null},A?.ix!==void 0&&y.pref.set(g.at,A.ix),e.set(p,y);const F=u?R:r.door;a(y,qd(Yd(r,c,g,T,F,R,null),b,void 0));continue}if(y.key=D,y.leaving=!1,y.outAt=1/0,h&&M){a(y,qd({...M,act:g,sig:T,spot:R,path:Lo([R]),t:M.sig===T?M.t:c},b,void 0));continue}const O=s(y,c),P=qd(Yd(r,c,g,T,O??R,R,M?M.act.k:null),b,M);a(y,P),y.over&&y.over.act===g&&(y.over.until=c+P.path.len/P.speed+y.over.stay)}for(const p of e.values())p.over&&p.over.until===1/0&&(p.over.until=c+_0+p.over.stay);for(const[p,v]of e){if(o.has(p)||v.leaving)continue;const y=v.segs.at(-1);v.key&&m.delete(v.key),v.key=null,v.leaving=!0;const g={k:"done",at:"terrace"},b=h?null:s(v,c),S=Yd(r,c,g,"gone",b??r.exit,r.exit,y?.act.k??null);a(v,S),v.outAt=c+S.path.len/S.speed}for(const[p,v]of e)v.leaving&&v.outAt<c&&e.delete(p);for(const p of l){if(p.kind!=="message"||p.from.who!=="you"||p.to.who!=="agent")continue;const v=e.get(p.to.name);!v||v.planes.includes(p.t)||(v.planes.push(p.t),v.planes.sort((y,g)=>y-g))}for(const p of e.values())p.planes=p.planes.filter(v=>v>c-Yp-60)},poseAt(o,r){const c=e.get(o);return c?s(c,r):null},names(o){return[...e].filter(([,r])=>s(r,o)!==null).map(([r])=>r)},moving(o){for(const r of e.values()){const c=s(r,o);if(!c)continue;if(c.moving||c.plane||r.over)return!0;const l=c.seg;if(l.from!==null&&o<l.t+l.path.len/l.speed+Ng)return!0}return!1}}}function qd(e,t,n){return{...{t:e.t,act:e.act,sig:e.sig,spot:e.spot,path:e.path,speed:e.speed,from:e.from},...t?{pastime:t}:{},...!t&&n?.pastime?{fromSkate:!0}:{}}}function Jz(e){return`${e.k}|${e.rank===void 0?"":String(e.rank)}|${e.key===void 0?"":String(e.key)}|${e.with??""}`}function Yd(e,t,n,i,s,a,o){const r=xg(e,s,a),c=i==="gone"||n.k==="done"?zc.skate:n.k==="landing"?zc.carry:n.urgent?zc.hurry:zc.walk;return{t,act:n,sig:i,spot:a,path:r,speed:Math.max(c,r.len/_0),from:o}}function Qz(e,t,n){switch(n.at){case"desk":return n.k==="visit"&&n.with!==void 0?Jp(e.desks.get(n.with)??e.mainDesk):e.desks.get(t)??e.door;case"main":return n.k==="report"?Jp(e.mainDesk):e.mainDesk;case"door":return e.door;case"queue":{const i=Math.max(1,n.rank??1),s=e.queue[i-1];if(s)return s;const[a,o]=e.queueMore,r=Math.hypot(o.x-a.x,o.z-a.z),c=r>0?Math.min(1,Hl*(i-e.queue.length)/r):0,l=a.x+(o.x-a.x)*c,d=a.z+(o.z-a.z)*c;return{x:l,z:d,wz:d,ax:l,face:e.queue.at(-1)?.face??Math.PI/2}}default:return null}}function jz(e,t,n,i,s){if(e.k!=="nap"||e.at!=="lounge")return e;const a=Math.min(i,s??i),o=r=>{const c=`lounge:${String(r)}`;return c===t||!n.has(c)};for(let r=0;r<a;r++)if(o(r))return e;return{...e,at:"desk"}}function t5(e,t,n,i){const s=t==="lounge"?e.lounge:t==="island"?e.islandSpots:t==="board"?e.boardSpots:e.terrace,a=f=>!n.has(`${t}:${String(f)}`),o=i?.get(t),r=o!==void 0&&o<s.length&&a(o)?o:s.findIndex((f,u)=>a(u)),c=s[r];if(c)return{spot:c,key:`${t}:${String(r)}`,ix:r};let l=0;for(;n.has(`${t}:+${String(l)}`);)l++;const d=s[l%s.length];return d?{spot:{x:d.ax,z:d.wz,wz:d.wz,ax:d.ax,face:d.face},key:`${t}:+${String(l)}`}:null}const Jp=e=>({x:e.x,z:e.wz,wz:e.wz,ax:e.ax,face:e.face});function e5(e,t,n,i,s){const a=o=>{const r=e.get(o),c=r?.over?.act.k??t.get(o)?.k;return r&&!r.leaving&&r.over===null&&c!==void 0&&Zz.has(c)?r:null};for(const o of[...n].sort((r,c)=>r.t-c.t)){const r=o.kind==="report"?`r|${o.agent}|${String(o.t)}`:`m|${JSON.stringify(o.from)}|${JSON.stringify(o.to)}|${String(o.t)}`;if(s.has(r)||o.t>i||i-o.t>Yz)continue;if(s.add(r),o.kind==="report"){const u=t.get(o.agent)?.k==="main"?null:a(o.agent);u&&(u.over={act:{k:"report",at:"main"},stay:qz,until:1/0});continue}if(o.from.who!=="agent"||o.to.who!=="agent"||o.from.name===o.to.name)continue;const c=a(o.from.name);if(!c||t.get(o.from.name)?.k==="main")continue;const l=t.get(o.to.name)?.k,f=l==="nap"||l==="snack"?a(o.to.name):null;f?(c.over={act:{k:"coffee",at:"island",with:o.to.name},stay:Kp,until:1/0},f.over={act:{k:"coffee",at:"island",with:o.from.name},stay:Kp,until:1/0}):o.mode!=="unknown"&&l!==void 0&&(c.over={act:{k:"visit",at:"desk",with:o.to.name,mode:o.mode},stay:$z,until:1/0})}if(s.size>500)for(const o of[...s].slice(0,s.size-500))s.delete(o)}const n5=(e,t)=>Math.hypot(e.x-t.x,e.z-t.z)<1e-4,$a={hover:null,held:!1,lit:null,follow:null},i5=(e,t)=>`${t}|${e.map(n=>`${n.name}${n.main?"*":""}`).join(",")}`,s5=_0+Ng+1;function a5(e){const t=e.newTimeline();let n=null,i=[],s=null,a=!0,o=[],r=null,c="",l=os,d=null,f,u={day:"",lands:[]},h=null,m="",_="";return{rows(v,y,g){n=v,i=y,s=g,a=!0},grow(v,y){l=v;const g=n1(d,v);g!==null&&(f={stage:g,at:y}),d=v,a=!0},event(v){o.push(v),a=!0},konami(v){h=v},step(v,y){const g=x(v);return g===null?null:p(g.office,g.reshaped,v,y)},still(v){const y=x(v);return y===null?null:p(y.office,y.reshaped,{...v,t:v.t+s5,reduced:!0,forced:{bims:{}}},$a,!0)},stale(v){if(n===null)return!1;const y=qp(v.local,v.night,i)!==_||JSON.stringify([...e.activities(n,v.t)])!==m;return y&&(a=!0),y}};function x(v){if(n===null||s===null)return null;const{t:y,local:g,reduced:b}=v;let S=!1;if(a){a=!1;const T=i5(i,s);(r===null||T!==c)&&(c=T,r=e.layoutOf(i,s),S=!0);const M=e.activities(n,y);m=JSON.stringify([...M]),t.update(M,r,y,o,yl(l.stage),{stage:l.stage,jobs:l.jobs,dow:g.dow,day:Z3(g.y,g.mo,g.d),reduced:b}),o=[]}return r===null?null:{office:r,reshaped:S}}function p(v,y,g,b,S=!1){const{t:T,local:M,night:E,reduced:A}=g,R=new Set(i.filter(B=>B.main).map(B=>B.name)),D=[];for(const B of t.names(T)){const I=t.poseAt(B,T);I!==null&&D.push({name:B,main:R.has(B),pose:I})}u=Oz(u,D,M);const O=g.forced!==void 0?Vz(Hz,g.forced):Gz({t:T,frames:D,agents:i,cards:n?.cards.length??0,local:M,night:E,reduced:A,lands:u.lands,konami:h,stage:l.stage});_=qp(M,E,i);const P=D.map(B=>{const I=O.bims.get(B.name),G=B.name===b.lit||B.name===b.follow;return I===void 0?G?{...B,lit:G}:B:{...B,egg:I,...G?{lit:G}:{}}}),F=S?void 0:f,V={night:E,reduced:A,eggs:O.office,grow:l,...F?{unlock:F}:{}};F&&T-F.at>Rc+um&&(f=void 0);const U=e.labelsOf(P,{t:T,hover:b.hover,held:b.held,agents:i,eggs:Xz(O),follow:b.follow,park:v.park});return{office:v,agents:i,want:s??v.map,reshaped:y,frames:D,played:P,look:V,labels:U,moving:t.moving(T)}}}const qs=300,zt=(e,t)=>e*60+t,gn={k:"work",doing:"edit"},Zd={k:"work",doing:"think"},si={k:"gone"},gs={k:"idle"},yo={k:"done"},Ie="harness",Mn="bise.dev",Yn="acme-web",Zo=[{id:Ie,name:"harness",map:"loft",stage:13,bims:[{name:"main",main:!0,life:[[0,{k:"mainidle"}],[zt(0,12),{k:"main"}],[zt(3,50),{k:"mainidle"}]]},{name:"signup-flow",life:[[0,si],[zt(0,20),gn],[zt(3,36),{k:"landing",rank:1}],[zt(3,42),yo],[zt(4,31),si]]},{name:"dark-mode",life:[[0,si],[zt(0,24),gn],[zt(2,30),Zd],[zt(2,50),gn],[zt(3,2),{k:"landing",rank:1}],[zt(3,11),yo],[zt(4,33),si]]},{name:"fix-flaky-test",life:[[0,gn],[zt(1,16),{k:"failed"}],[zt(1,40),gn]]},{name:"docs-sync",life:[[0,gs],[zt(2,0),{k:"snack",fruit:1,trip:1}],[zt(2,8),{k:"snack",fruit:0,trip:2}],[zt(2,16),gs]]},{name:"perf-audit",life:[[0,{k:"sleep"}]]}]},{id:Mn,name:"bise.dev",map:"california",stage:11,bims:[{name:"main",main:!0,life:[[0,{k:"main"}],[zt(4,4),{k:"mainidle"}]]},{name:"pricing-page",life:[[0,si],[zt(0,58),gn],[zt(1,6),{k:"asks"}],[zt(1,26),gn],[zt(3,58),{k:"landing",rank:1}],[zt(4,3),yo],[zt(4,32),si]]},{name:"og-images",life:[[0,si],[zt(1,20),gn],[zt(3,12),{k:"landing",rank:1}],[zt(3,16),yo],[zt(3,52),si]]},{name:"seo-meta",life:[[0,gs],[zt(1,40),Zd],[zt(1,46),gs]]},{name:"i18n",life:[[0,gs],[zt(4,44),Zd],[zt(4,50),gs]]}]},{id:Yn,name:"acme-web",map:"riad",stage:9,bims:[{name:"main",main:!0,life:[[0,{k:"main"}]]},{name:"api-tests",life:[[0,gn],[zt(2,12),{k:"wait",on:"checkout"}],[zt(2,23),gn]]},{name:"checkout",life:[[0,gn],[zt(2,12),{k:"wait",on:"api-tests"}],[zt(2,23),gs],[zt(2,26),gn]]},{name:"invoice-pdf",life:[[0,si],[zt(0,58),gn],[zt(3,22),{k:"landing",rank:1}],[zt(3,28),yo],[zt(4,46),si]]}]}],Ug=[{at:zt(0,11),office:Ie,from:"you",to:"main"},{at:zt(1,24),office:Mn,from:"you",to:"pricing-page"},{at:zt(2,24),office:Yn,from:"api-tests",to:"checkout"}],o5=[{at:zt(1,24),dur:3.5,office:Mn,bim:"pricing-page",kind:"loop"},{at:zt(1,.5),dur:.6,office:Yn,bim:"invoice-pdf",kind:"hop"},{at:zt(2,8),dur:8,office:Ie,bim:"docs-sync",kind:"golden"},{at:zt(2,12.5),dur:10.5,office:Yn,bim:"api-tests",kind:"stare"},{at:zt(2,12.5),dur:10.5,office:Yn,bim:"checkout",kind:"stare"},{at:zt(2,31),dur:.8,office:Yn,bim:"checkout",kind:"tap"},{at:zt(2,36),dur:6,office:Yn,bim:"checkout",kind:"moonwalk"},{at:zt(3,8),dur:2.5,office:Ie,bim:"dark-mode",kind:"itemget"},{at:zt(3,16),dur:4,office:Mn,bim:"og-images",kind:"speedrun"},{at:zt(3,42),dur:3,office:Ie,bim:"main",kind:"tetris"},{at:zt(3,42),dur:3,office:Ie,bim:"dark-mode",kind:"combo"},{at:zt(3,42),dur:3,office:Ie,bim:"signup-flow",kind:"combo"},{at:zt(4,5),dur:3,office:Mn,bim:"main",kind:"clap"},{at:zt(4,20),dur:1.2,office:Ie,bim:"dark-mode",kind:"kickflip"},{at:zt(4,30),dur:.9,office:Ie,bim:"signup-flow",kind:"salto"}],Ye=(e,t)=>({k:"bim",office:e,name:t}),_n=[{at:0,size:"wide",subject:{k:"town"}},{at:zt(0,10),size:"office",subject:{k:"office",office:Ie}},{at:zt(0,20),size:"follow",subject:Ye(Ie,"signup-flow")},{at:zt(0,34),size:"office",subject:{k:"office",office:Ie}},{at:zt(0,44),size:"close",subject:Ye(Mn,"i18n")},{at:zt(0,58),size:"wide",subject:{k:"town"}},{at:zt(1,6),size:"follow",subject:Ye(Mn,"pricing-page")},{at:zt(1,16),size:"follow",subject:Ye(Ie,"fix-flaky-test")},{at:zt(1,24),size:"office",subject:{k:"office",office:Mn}},{at:zt(1,40),size:"office",subject:{k:"office",office:Ie}},{at:zt(1,52),size:"wide",subject:{k:"town"}},{at:zt(2,2),size:"close",subject:Ye(Ie,"docs-sync")},{at:zt(2,14),size:"follow",subject:{k:"pair",office:Yn,names:["api-tests","checkout"]}},{at:zt(2,24),size:"follow",subject:Ye(Yn,"checkout")},{at:zt(2,34),size:"close",subject:Ye(Yn,"checkout")},{at:zt(2,42),size:"follow",subject:Ye(Mn,"seo-meta")},{at:zt(2,56),size:"wide",subject:{k:"town"}},{at:zt(3,4),size:"follow",subject:Ye(Ie,"dark-mode")},{at:zt(3,16),size:"close",subject:Ye(Mn,"og-images")},{at:zt(3,26),size:"office",subject:{k:"office",office:Yn}},{at:zt(3,38),size:"close",subject:Ye(Ie,"main")},{at:zt(3,52),size:"follow",subject:Ye(Mn,"og-images")},{at:zt(3,56),size:"wide",subject:{k:"town"}},{at:zt(4,2),size:"closest",subject:Ye(Mn,"main")},{at:zt(4,8),size:"close",subject:Ye(Mn,"main")},{at:zt(4,16),size:"follow",subject:Ye(Ie,"dark-mode")},{at:zt(4,30),size:"follow",subject:Ye(Ie,"signup-flow")},{at:zt(4,44),size:"wide",subject:{k:"town"}}],Qp=1.5,r5=1.6,c5=2.4,jp=.6,l5=4,d5=20,tm=2.4,f5=14,gl={x:.575,y:.5},u5={x0:.27,x1:.89,y0:.11,y1:.89},Og={x0:.3,x1:.85,y0:.1,y1:.9},h5=1.3,p5={tight:1.4,follow:2.2,close:3.2,closest:4},Ko=(e,t,n)=>Math.min(n,Math.max(t,e)),Fg=1.001,m5=.2;function rs(e){const t=Ko(Number.isFinite(e.zoom)?e.zoom:1,Fg,f5),n=.5/t,i=m5/t,s=Math.min(n,1-n)-i,a=Math.max(n,1-n)+i;return{zoom:t,u:Ko(e.u,s,a),v:Ko(e.v,s,a)}}function vu(e,t){const n=(t.x1-t.x0)/Math.max(1e-6,e.u1-e.u0),i=(t.y1-t.y0)/Math.max(1e-6,e.v1-e.v0),s=Math.max(Fg,Math.min(n,i)),a=(e.u0+e.u1)/2,o=(e.v0+e.v1)/2,r=(t.x0+t.x1)/2,c=(t.y0+t.y1)/2;return rs({zoom:s,u:a-(r-.5)/s,v:o-(c-.5)/s})}function Mu(e,t,n=gl.x,i=gl.y){return rs({zoom:t,u:e.u-(n-.5)/t,v:e.v-(i-.5)/t})}const _l=e=>e.k==="town"?null:e.office;function bo(e,t){const n=e.subject;if(e.size==="wide"||n.k==="town"){const o=t.town();return o?vu(o,u5):null}const i=t.office(n.office);if(!i)return null;const s=vu(i,Og);let a;switch(n.k){case"office":a=null;break;case"spot":a=t.spot(n.office,n.spot);break;case"bim":a=t.bim(n.office,n.name);break;case"pair":{const o=t.bim(n.office,n.names[0]),r=t.bim(n.office,n.names[1]);a=o&&r?{u:(o.u+r.u)/2,v:(o.v+r.v)/2}:o??r;break}}if(e.size==="office"){const o=a??{u:s.u+(gl.x-.5)/s.zoom,v:s.v+(gl.y-.5)/s.zoom};return Mu(o,s.zoom*h5)}return a===null?s:Mu(a,s.zoom*p5[e.size])}function So(e,t){const n=e[0];if(n!==void 0&&t>=n.at-Qp+qs)return 0;let i=e.length-1;for(let s=0;s<e.length;s++){const a=e[s];a!==void 0&&a.at-Qp<=t&&(i=s)}return i}function x5(e,t){const n=e===null?null:_l(e.subject),i=_l(t.subject),s=e!==null&&n!==i&&n!==null&&i!==null;return{dur:Math.max(jp,e===null?jp:n===i?r5:c5),across:s}}const g5=e=>{const t=Ko(e,0,1);return t*t*t*(t*(t*6-15)+10)};function em(e,t,n,i){const s=g5(n),a=Math.log(e.zoom),o=Math.log(t.zoom);let r=a+(o-a)*s;if(i!==null){const c=(a+o)/2,l=Math.max(0,c-Math.log(Math.max(1,i)));r-=l*4*s*(1-s)}return rs({zoom:Math.exp(r),u:e.u+(t.u-e.u)*s,v:e.v+(t.v-e.v)*s})}const ya=e=>({cam:e,vz:0,vu:0,vv:0});function _5(e,t,n){const i=Ko(n,0,.1),s=l5,a=(u,h,m)=>{const _=u-m,x=Math.exp(-s*i),p=h+s*_;return[m+(_+p*i)*x,(h-s*p*i)*x]},[o,r]=a(Math.log(e.cam.zoom),e.vz,Math.log(t.zoom)),[c,l]=a(e.cam.u,e.vu,t.u),[d,f]=a(e.cam.v,e.vv,t.v);return{cam:rs({zoom:Math.exp(o),u:c,v:d}),vz:r,vu:l,vv:f}}function v5(e,t,n){return e.k==="visitor"&&!n&&t-e.last>=d5}const _e={slab:{from:0,to:400},edge:{from:200,to:400},roads:{from:200,to:1400},things:{from:400,span:1400,jitter:40},drop:240,furniture:180,pop:200,bims:{from:1800,gap:30,pop:150},words:{from:2250,to:2400},built:2400,cam:{from:2400,to:2800},done:2800},M5=16,nm=.92,yu=1e-4,bu=e=>Math.min(1,Math.max(0,e));function y5(e,t,n,i){const s=(o,r,c)=>3*o*c*(1-c)**2+3*r*c*c*(1-c)+c**3,a=(o,r,c)=>3*o*(1-c)**2+6*(r-o)*c*(1-c)+3*(1-r)*c*c;return o=>{const r=bu(o);let c=r;for(let l=0;l<8;l++){const d=a(e,n,c);if(Math.abs(d)<1e-6)break;c=bu(c-(s(e,n,c)-r)/d)}return s(t,i,c)}}const pr=y5(.65,0,.35,1);function Bg(e){const n=bu(e)-1;return 1+(1.04+1)*n**3+1.04*n*n}function b5(e,t){const n=Math.sin(Math.floor(e/2)*12.9898+Math.floor(t/2)*78.233)*43758.5453;return(n-Math.floor(n))*2-1}function im(e,t,n,i){const{from:s,span:a,jitter:o}=_e.things;return s+a*pr(t>0?e/t:0)+o*b5(n,i)}function Kd(e,t,n){return e<t?yu:Math.max(yu,Bg((e-t)/n))}function S5(e){return pr((e-_e.roads.from)/(_e.roads.to-_e.roads.from))}const zn=new Za,Ei=new q,wo=new q;function w5(){const e=new WeakMap,t=new WeakMap,n=[],i={c:{value:{x:0,y:0}},r:{value:0}};let s=0;const a=new Map,o=new Map;function r(f){const u=f.clone();return u.onBeforeCompile=h=>{h.uniforms.uRevealC=i.c,h.uniforms.uRevealR=i.r,h.vertexShader=h.vertexShader.replace("#include <common>",`#include <common>
varying vec2 vRevealXZ;`).replace("#include <project_vertex>",`#include <project_vertex>
vRevealXZ = (modelMatrix * vec4(transformed, 1.0)).xz;`),h.fragmentShader=h.fragmentShader.replace("#include <common>",`#include <common>
varying vec2 vRevealXZ;
uniform vec2 uRevealC;
uniform float uRevealR;`).replace("#include <clipping_planes_fragment>",`if (distance(vRevealXZ, uRevealC) > uRevealR) discard;
#include <clipping_planes_fragment>`)},u.customProgramCacheKey=()=>"bims-hero-reveal",n.push(u),u}function c(f,u){const h=e.get(f);if(h)return h;const m=[],_=[];let x=0,p=0;f.updateMatrixWorld(!0);for(const g of f.children)zn.setFromObject(g),zn.getSize(Ei),p=Math.max(p,Ei.x);for(const g of f.children){zn.setFromObject(g),zn.getSize(Ei),zn.getCenter(wo);const b=g instanceof Se?g:null;if(b&&Ei.x>=p*.9&&!Array.isArray(b.material)){const S=b.material.clone();S.transparent=!0,n.push(S),b.material=S,m.push({mesh:b,mat:S,edge:Ei.y>.5});continue}if(b&&Ei.y<.1&&!Array.isArray(b.material)){b.material=r(b.material),x=Math.max(x,...[zn.min.x,zn.max.x].flatMap(S=>[zn.min.z,zn.max.z].map(T=>Math.hypot(S-u.x,T-u.z))));continue}_.push({o:g,d:Math.hypot(wo.x-u.x,wo.z-u.z),x:wo.x,z:wo.z})}s=Math.max(s,..._.map(g=>g.d));const v=_.map(g=>({o:g.o,base:g.o.scale.clone(),start:im(g.d,s,g.x,g.z),dur:_e.pop})),y={slab:m,pops:v,reach:x};return e.set(f,y),y}function l(f,u,h){const m=t.get(f);if(m)return m;const _=[];f.updateMatrixWorld(!0);let x=0;for(const v of f.children)v.visible&&(zn.setFromObject(v),!zn.isEmpty()&&(zn.getSize(Ei),!(Math.max(Ei.x,Ei.z)>=u*.45)&&_.push({o:v,base:v.scale.clone(),start:h+_e.drop+x++%6*12,dur:_e.furniture})));const p={pops:_};return t.set(f,p),p}const d=(f,u)=>{f.o.scale.set(f.base.x*u,f.base.y*u,f.base.z*u)};return{apply(f,u,h){const m=u.centre;if(u.scape){const p=c(u.scape,m),v=pr((f-_e.slab.from)/(_e.slab.to-_e.slab.from));for(const y of p.slab)y.mesh.scale.setScalar(nm+(1-nm)*v),y.mat.opacity=y.edge?pr((f-_e.edge.from)/(_e.edge.to-_e.edge.from)):v;i.c.value={x:m.x,y:m.z},i.r.value=p.reach*S5(f)+.001;for(const y of p.pops)d(y,Kd(f,y.start,y.dur))}const _=M5*h*1.25,x=[];for(const p of u.offices){let v=a.get(p.root);if(!v){const b=Math.hypot(p.root.position.x-m.x,p.root.position.z-m.z);v={y:p.root.position.y,start:im(b,Math.max(s,b),p.root.position.x,p.root.position.z)},a.set(p.root,v)}const y=(f-v.start)/_e.drop;if(p.root.scale.setScalar(f<v.start?yu:1),p.root.position.y=v.y+_*(1-Bg(y)),p.world)for(const b of l(p.world,p.width,v.start).pops)d(b,Kd(f,b.start,b.dur));const g=Math.hypot(p.root.position.x-m.x,p.root.position.z-m.z);for(const b of p.bims)x.push({body:b.body,d:g,name:b.name})}x.sort((p,v)=>p.d-v.d||p.name.localeCompare(v.name)),x.forEach((p,v)=>{let y=o.get(p.body);y||(y=p.body.scale.clone(),o.set(p.body,y));const g=Kd(f,_e.bims.from+v*_e.bims.gap,_e.bims.pop);p.body.scale.set(y.x*g,y.y*g,y.z*g)})},finish(f){for(const u of f?.offices??[]){const h=a.get(u.root);if(u.root.scale.setScalar(1),h&&(u.root.position.y=h.y),u.world)for(const m of t.get(u.world)?.pops??[])d(m,1)}for(const[u,h]of o)u.scale.copy(h);o.clear(),a.clear();for(const u of n.splice(0))u.dispose()}}}function E5(e){return pr((e-_e.words.from)/(_e.words.to-_e.words.from))}const T5=4,A5=.01;function Jd(e,t,n,i){const s=e.zoom*t,a=e.u+(n-.5)/e.zoom,o=e.v+(i-.5)/e.zoom,r=rs({zoom:s,u:a-(n-.5)/s,v:o-(i-.5)/s});return rs({zoom:r.zoom,u:a-(n-.5)/r.zoom,v:o-(i-.5)/r.zoom})}function sm(e,t,n){return rs({zoom:e.zoom,u:e.u-t/e.zoom,v:e.v-n/e.zoom})}function z5(e,t){let n=null,i=null;const s=()=>e.getBoundingClientRect(),a=g=>{const b=s();return{x:g.clientX-b.left,y:g.clientY-b.top,w:Math.max(1,b.width),h:Math.max(1,b.height)}},o=g=>{e.style.cursor=g};o("grab");const r=g=>{g.pointerType==="touch"||g.button!==0||g.target?.closest("button, a")==null&&(e.setPointerCapture(g.pointerId),n={id:g.pointerId,x:g.clientX,y:g.clientY,lx:g.clientX,ly:g.clientY,moved:!1})},c=g=>{if(g.pointerType==="touch")return;const b=a(g);if(n===null||n.id!==g.pointerId){const S=t.pick(b.x,b.y);o(S===null?"grab":"pointer"),t.hover(S);return}!n.moved&&Math.hypot(g.clientX-n.x,g.clientY-n.y)<T5||(n.moved||o("grabbing"),n.moved=!0,t.take(sm(t.cam(),(g.clientX-n.lx)/b.w,(g.clientY-n.ly)/b.h)),n.lx=g.clientX,n.ly=g.clientY)},l=g=>{if(n===null||n.id!==g.pointerId)return;const b=n;if(n=null,o("grab"),b.moved||g.type==="pointercancel")return;const S=a(g),T=t.pick(S.x,S.y);T!==null&&t.follow({office:T.id,name:T.name})},d=g=>{const b=g[0],S=g[1];return!b||!S?null:{mx:(b.clientX+S.clientX)/2,my:(b.clientY+S.clientY)/2,d:Math.hypot(b.clientX-S.clientX,b.clientY-S.clientY)}},f=g=>{if(g.touches.length!==2){i=null;return}g.preventDefault();const b=d(g.touches);if(b!==null){if(i!==null&&g.type==="touchmove"){const S=s(),T=Math.max(1,S.width),M=Math.max(1,S.height);let E=sm(t.cam(),(b.mx-i.mx)/T,(b.my-i.my)/M);i.d>0&&b.d>0&&(E=Jd(E,b.d/i.d,(b.mx-S.left)/T,(b.my-S.top)/M)),t.take(E)}i=b}},u=g=>{if(g.pointerType!=="touch")return;const b=a(g),S=t.pick(b.x,b.y);S!==null&&t.follow({office:S.id,name:S.name})},h=g=>{if(!g.ctrlKey&&!g.metaKey)return;g.preventDefault();const b=a(g),S=g.deltaMode===1?g.deltaY*16:g.deltaY;t.take(Jd(t.cam(),Math.exp(-S*A5),b.x/b.w,b.y/b.h))},m=g=>{g.preventDefault(),t.wide()};let _=!1;const y=[[e,"pointerdown",r],[e,"pointermove",c],[e,"pointerup",l],[e,"pointercancel",l],[e,"touchstart",f,{passive:!1}],[e,"touchmove",f,{passive:!1}],[e,"touchend",f],[e,"click",u],[e,"wheel",h,{passive:!1}],[e,"dblclick",m],[e,"pointerenter",()=>{_=!0,t.inside(!0)}],[e,"pointerleave",()=>{_=!1,t.inside(!1),t.hover(null)}],[window,"keydown",g=>{g.key==="Escape"&&_&&t.wide()}]];for(const[g,b,S,T]of y)g.addEventListener(b,S,T);return{zoomBy(g){t.take(Jd(t.cam(),g,.575,.5))},dispose(){for(const[g,b,S]of y)g.removeEventListener(b,S);e.style.cursor=""}}}const vl=4;function am(e,t,n){const i=e-t/2;return n<=0?i:Math.max(vl,Math.min(i,n-vl-t))}const R5=(e,t)=>e.left<t.left+t.w&&t.left<e.left+e.w&&e.top<t.top+t.h&&t.top<e.top+e.h;function C5(e,t,n){const i=[...e].sort((l,d)=>l.rank-d.rank),s=[...i.filter(l=>l.pill),...i.filter(l=>!l.pill)],a=[],o=new Map;let r=0;const c=l=>n<=0||l.top>=0&&l.top+l.h<=n;for(const l of s){const d=am(l.x,l.w,t),f={left:d,top:l.y-l.h,w:l.w,h:l.h};if(l.pill){const _=n<=0?f.top:Math.max(vl,Math.min(f.top,n-vl-l.h));a.push({...f,top:_}),o.set(l.name,{left:d,top:_,lead:!1});continue}const u=_=>({...f,left:am(l.x+_,l.w,t)}),m=[f,...[-1,1,-2,2].map(_=>({...f,top:f.top+_*l.h})),u(-l.w/2),u(l.w/2)].find(_=>c(_)&&!a.some(x=>R5(x,_)));if(m===void 0){r++;continue}a.push(m),o.set(l.name,{left:m.left,top:m.top,lead:m.top!==f.top||Math.abs(m.left-f.left)>.5})}return{at:o,left:r}}function P5(e){return e.replaceAll("!","…").replaceAll("?","…").replaceAll("✗","…")}const L5={asks:"?",failed:"✗"};function om(e){return e.mode==="egg"?e.words:e.words===""?e.name:`${e.name} · ${e.words}`}function I5(e){const t=document.createElement("div");t.className="bh-overlay",t.setAttribute("aria-hidden","true");const n=document.createElement("div");n.className="bims-zzzs";const i=document.createElement("div");i.className="bh-tags",t.append(n,i),e.append(t);const s=new Map;return{root:t,labels(a){const o=new Set,r=[];for(const{key:l,label:d,head:f,rank:u}of a){o.add(l);let h=s.get(l);const m=`${d.mode}|${d.pill??""}|${om(d)}`;if(h===void 0&&(h=document.createElement("div"),h.className="bh-tag",i.append(h),s.set(l,h)),h.dataset.sig!==m){if(h.dataset.sig=m,h.dataset.mode=d.mode,h.replaceChildren(),d.pill!==null){const x=document.createElement("span");x.className=`bh-pill ${d.pill}`,x.textContent=L5[d.pill],h.append(x)}const _=d.mode==="pill"?"":om(d);if(_!==""){const x=document.createElement("span");x.className="bh-label",x.textContent=_,h.append(x)}}h.style.visibility=f===null?"hidden":"",f!==null&&r.push({name:l,x:f.x,y:f.y,w:h.offsetWidth,h:h.offsetHeight,pill:d.mode==="pill",rank:u})}for(const[l,d]of s)o.has(l)||(d.remove(),s.delete(l));const{at:c}=C5(r,e.clientWidth,e.clientHeight);for(const l of r){const d=s.get(l.name),f=c.get(l.name);d!==void 0&&(d.style.visibility=f===void 0?"hidden":"",f!==void 0&&(d.style.transform=`translate(${f.left.toFixed(1)}px, ${f.top.toFixed(1)}px)`))}},zzz(a){zz(n,a)},dispose(){t.remove()}}}function D5(e){const t=e%100>=11&&e%100<=13?"th":e%10===1?"st":e%10===2?"nd":e%10===3?"rd":"th";return`${String(e)}${t}`}function N5(e){const t=Math.floor(Math.max(0,e)/6e4);if(t<1)return"now";if(t<60)return`${String(t)} min`;const n=Math.floor(t/60);return n<24?`${String(n)} h`:`${String(Math.floor(n/24))} d`}const rm=3,U5=3,O5=new Set(["nap","snack","coffee","visit","report"]),cm=new Set(["main","mainidle"]);function F5(e){const t=e.act.k;return e.from===null?t==="starting":O5.has(t)||cm.has(t)&&cm.has(e.from)?!1:t===e.from?t==="landing"&&e.act.rank===1:!0}function B5(e,t){switch(e.k){case"starting":return pt.ev_started;case"work":case"main":return pt.working;case"hot":return pt.ev_running_hot;case"sleep":return pt.waiting;case"waitagent":return pt.ev_waits_on({agent:e.on??""});case"asks":return pt.asks_you;case"landing":return e.rank===1?pt.landing:pt.ev_in_line;case"done":return t==="landing"?pt.ev_landed:pt.done;case"failed":return pt.failed;case"blocked":return pt.blocked;case"stopped":return pt.ev_stopped;case"mainidle":return pt.idle;case"nap":case"snack":case"coffee":case"visit":case"report":return""}}function G5(e,t=""){switch(e.k){case"work":case"main":return pt.working;case"hot":return pt.state_hot;case"sleep":return t?pt.state_waiting_for({what:t}):pt.waiting;case"waitagent":return pt.state_waits_on({agent:e.on??""});case"nap":case"snack":case"mainidle":return pt.idle;case"asks":return e.urgent?pt.state_urgent:pt.asks_you;case"blocked":return pt.blocked;case"failed":return pt.failed;case"landing":return e.rank===1||e.rank==null?pt.landing:pt.state_in_line({nth:D5(e.rank)});case"done":return pt.done;case"stopped":return pt.state_stopped;case"starting":return pt.state_starting;case"coffee":case"visit":case"report":return pt.working}}function H5(e){return{drop_in:pt.trick_drop_in,pump:pt.trick_pump,rock_to_fakie:pt.trick_rock_to_fakie,axle_stall:pt.trick_axle_stall,fs_180:pt.trick_fs_180,bs_180:pt.trick_bs_180,ollie:pt.trick_ollie,kickflip:pt.trick_kickflip,heelflip:pt.trick_heelflip,shove_it:pt.trick_shove_it,tre_flip:pt.trick_tre_flip,fifty:pt.trick_fifty,five_o:pt.trick_five_o,boardslide:pt.trick_boardslide,nosegrind:pt.trick_nosegrind,manual:pt.trick_manual,no_comply:pt.trick_no_comply,carve:pt.trick_carve,fs_air:pt.trick_fs_air,nine:pt.trick_nine}[e]}function V5(e){return e.k==="asks"?"asks":e.k==="failed"?"failed":null}function W5(e,t){const n=e.filter(a=>a.pose.seg.t<=t&&F5(a.pose.seg)).map(a=>({name:a.name,at:a.pose.seg.t})).sort((a,o)=>o.at-a.at||(a.name<o.name?-1:a.name>o.name?1:0)),i=Array.from({length:U5},()=>-1/0),s=new Set;for(const a of n){let o=0;for(let c=1;c<i.length;c++)(i[c]??0)<(i[o]??0)&&(o=c);const r=Math.max(a.at,i[o]??-1/0);i[o]=r+rm,r<=t&&t<r+rm&&s.add(a.name)}return s}const k5=(e,t)=>{const n=new Map(t.agents.map(a=>[a.name,a])),i=W5(e,t.t),s=new Map;for(const a of e){const{act:o,from:r}=a.pose.seg,c=V5(o),l=(f,u,h="")=>{s.set(a.name,{name:a.name,mode:f,words:u,title:h,pill:c})},d=t.follow===a.name?j3(a.name,a.pose,t.park):null;if(t.hover===a.name){const f=n.get(a.name),u=a.pose.seg.pastime&&f?pt.state_skating({dur:N5(t.t*1e3-f.since_ms)}):G5(o,f?.watching[0]?.what??"");l("hover",u,f?.title??"")}else i.has(a.name)?l("event",B5(o,r)):d!==null?l("egg",H5(d)):t.eggs?.has(a.name)===!0?l("egg",t.eggs.get(a.name)??""):t.held||a.pose.moving&&!a.main?l("name",""):c&&l("pill","")}return s},ea=18e8;function Xn(e){const t=(e-ea)%qs;return t<0?t+qs:t}const Ml=e=>Math.floor((e-ea)/qs);function v0(e,t){let n=null;for(const[i,s]of e.life)i<=t&&(n=s);return n??e.life[e.life.length-1]?.[1]??{k:"gone"}}function Gg(e){return{jobs_done:Jo[e.stage]??0,days_used:jd[Math.min(jd.length-1,Math.floor(e.stage/2))]??0,artifacts_made:e.stage*12}}const Qd=ea*1e3;function X5(e,t){const n={name:e.name,main:e.main===!0,status:"idle",phase:null,archived:!1,title:"",purpose:"",since_ms:Qd,waits:0,dir:e.name,watching:[],waiting_on:null,turn_ms:null,place_id:e.main===!0?"":`wt:${e.name}`},i=s=>({...n,...s});switch(t.k){case"work":return i({status:"working",...t.doing?{doing:{kind:t.doing,since_ms:Qd}}:{}});case"main":return i({status:"working"});case"sleep":return i({status:"waiting",watching:[{id:1,kind:"bg",what:"bench",since_ms:Qd,resumes:!0}]});case"asks":return i({status:"waiting",waits:1,waiting_on:{who:"you"}});case"failed":return i({status:"failed"});case"wait":return i({status:"waiting",waiting_on:{who:"agent",name:t.on}});case"done":return i({status:"done"});default:return n}}function Hg(e,t){const n=[],i=[],s=[];for(const a of e.bims){const o=v0(a,t),r=X5(a,o);i.push(r),o.k!=="gone"&&(n.push(r),o.k==="landing"&&s.push({id:`wt:${a.name}`,branch:`sb/${a.name}`,agents:[a.name],landing:o.rank}))}return{snap:{agents:n,cards:[],places:s},agents:i}}function $5(e,t){return e.bims.map(n=>`${n.name}:${JSON.stringify(v0(n,t))}`).join("|")}function q5(e,t){const n=new Map(e.bims.map(i=>[i.name,i]));return(i,s)=>{const a=new Map(F3(i,s));for(const[o,r]of a){if(r.k!=="nap"&&r.k!=="snack")continue;const c=n.get(o);if(!c)continue;const l=v0(c,t(s)),d=l.k==="snack"?{k:"snack",at:"island",key:l.trip,fruit:l.fruit}:{k:"nap",at:"lounge"};a.set(o,d)}return a}}function Vg(e,t){const n={};for(const i of o5)i.office!==e||t<i.at||t>=i.at+i.dur||(n[i.bim]={kind:i.kind,since:t-i.at});return{bims:n}}function Y5(e,t,n){const i=[];if(n<=t)return i;for(let s=Ml(t);s<=Ml(n);s++)for(const a of Ug){if(a.office!==e)continue;const o=ea+s*qs+a.at;o<=t||o>n||i.push({kind:"message",from:a.from==="you"?{who:"you"}:{who:"agent",name:a.from},to:{who:"agent",name:a.to},mode:"queued",expectsReply:!1,t:o})}return i}function Z5(e){const t=Zo.find(i=>i.id===e),n=new Set;for(const i of t?.bims??[])for(const[s]of i.life)n.add(s);for(const i of Ug)i.office===e&&n.add(i.at);return[...n].sort((i,s)=>i-s)}const K5=1;function J5(e,t,n){if(n<=t)return[];const i=new Set,s=Z5(e);for(let a=Ml(t);a<=Ml(n);a++){const o=ea+a*qs;for(const r of s){const c=o+r;c>t&&c<=n&&i.add(c)}for(let r=0;r<qs;r+=K5){const c=o+r;c>t&&c<=n&&i.add(c)}}return[...i].sort((a,o)=>a-o)}const Q5=201,j5=ea-Q5,tR=Lz(new Date(2026,9,14,11,0,0));function M0(e,t,n,i){return{t,local:tR,night:n,reduced:i,forced:i?{bims:{}}:Vg(e,Xn(t))}}function Wg(e,t,n=!1){const i=$5(e.cast,Xn(t));if(i===e.sig&&!n)return;e.sig=i;const{snap:s,agents:a}=Hg(e.cast,Xn(t));e.driver.rows(s,a,e.cast.map)}function eR(e,t){const n=a5({activities:q5(e,Xn),layoutOf:zg,newTimeline:Kz,labelsOf:k5}),i={cast:e,driver:n,sig:"",at:t};return Wg(i,t),n.grow(pm(Gg(e)),t),n.step(M0(e.id,t,!1,!1),$a),i}const nR=(e=j5)=>Zo.map(t=>eR(t,e));function lm(e,t,n,i){if(t<=e.at)return;const s=Y5(e.cast.id,e.at,t);for(const a of J5(e.cast.id,e.at,t)){Wg(e,a,!0);for(const o of s)o.t===a&&e.driver.event(o);e.driver.step(M0(e.cast.id,a,n,i),$a)}e.at=t}const iR=(e,t,n,i=$a)=>e.driver.step(M0(e.cast.id,e.at,t,n),i),sR={light:"#f2ede2",dark:"#171513"},aR=1e3/30,oR=1.25,dm={x0:.3,x1:.85},rR=2,fm=.9,cR=2.6;function lR(e,t={}){let n=t.theme==="dark";const i=()=>n,s=t.reduced===!0,a=t.on??(()=>{}),o=t.ground??sR,r=document.createElement("canvas");r.className="bh-canvas",e.append(r);let c=!s&&t.startT===void 0;const l=w5();let d=-1,f=!1;const u=nA(r,{allLive:!0,box:!0,sky:{day:o.light,night:o.dark},nightLift:oR,entry:c}),h=I5(e),m=Zo.map(j=>({id:j.id,office:zg(Hg(j,0).agents,j.map),grow:pm(Gg(j))}));u.setTown(m);const _=nR();let x=ea+Math.max(0,t.startT??0);for(const j of _)lm(j,x,i(),s);const p=t.probe===!0?{frames:0,ms:[],T:0,hands:"film",shot:0,cam:{zoom:1,u:.5,v:.5},phases:[],offices:[]}:null;p&&(window.__bimsHero=p);const v=new Map,y=()=>u.townFit(),g=(j,L,xt,bt)=>{const C=Qi(j,{x:L,y:xt,z:bt});return{u:C.x/j.widthPx,v:C.y/j.heightPx}},b=j=>{const L=y(),xt=u.placedOf(j),bt=v.get(j)?.office;if(!L||!xt||!bt)return null;const C=bl(bt),w=[C.x0,C.x1].flatMap(X=>[C.z0,C.z1].flatMap(K=>[0,cR].map(ot=>g(L,xt.x+X,ot,xt.z+K))));return{u0:Math.min(...w.map(X=>X.u)),u1:Math.max(...w.map(X=>X.u)),v0:Math.min(...w.map(X=>X.v)),v1:Math.max(...w.map(X=>X.v))}},S=j=>{const L=y(),xt=u.placedOf(j),bt=v.get(j)?.office.park;if(!L||!xt||!bt||bt.spots.length===0)return null;const C=bt.spots.map(X=>g(L,xt.x+X.x,0,xt.z+X.z)),w=.01;return{u0:Math.min(...C.map(X=>X.u))-w,u1:Math.max(...C.map(X=>X.u))+w,v0:Math.min(...C.map(X=>X.v))-w,v1:Math.max(...C.map(X=>X.v))+w}},T={town(){const j=Zo.flatMap(L=>[b(L.id),S(L.id)]).filter(L=>L!==null);return j.length===0?null:{u0:Math.min(...j.map(L=>L.u0)),u1:Math.max(...j.map(L=>L.u1)),v0:Math.min(...j.map(L=>L.v0)),v1:Math.max(...j.map(L=>L.v1))}},office:b,spot(j,L){const xt=y(),bt=u.placedOf(j),C=v.get(j)?.office;if(!xt||!bt||!C)return null;const w=L==="island"?C.islandSpots:L==="lounge"?C.lounge:L==="park"?C.park?.spots??[]:[C.mainDesk];if(w.length===0)return null;const X=w.reduce((ot,wt)=>ot+wt.x,0)/w.length,K=w.reduce((ot,wt)=>ot+wt.z,0)/w.length;return g(xt,bt.x+X,fm,bt.z+K)},bim(j,L){const xt=y(),bt=u.placedOf(j),C=v.get(j)?.frames.find(w=>w.name===L);return!xt||!bt||!C?null:g(xt,bt.x+C.pose.x,fm,bt.z+C.pose.z)}},M=j=>{if(j===null)return null;const L=b(j);return L?vu(L,Og).zoom:null};let E=s?{k:"visitor",last:1/0,follow:null}:{k:"film"},A=-1,R=null,D=ya({zoom:1,u:.5,v:.5}),O=null,P=!1,F=-1/0;const V=()=>performance.now()/1e3,U=j=>{const L=E.k;E=j,L!==j.k&&(e.dataset.hands=j.k,a(j.k==="film"?"film":"control"))},B=()=>{const j=_n[0];return j?bo(j,T):null};function I(j){const L=Xn(x),xt=So(_n,L),bt=_n[xt];if(!bt)return;if(xt!==A){const w=A>=0?_n[A]??null:null,X=x5(w,bt),K=X.across?Math.min(M(_l(w?.subject??{k:"town"}))??1,M(_l(bt.subject))??1):null;A>=0&&(R={from:D.cam,start:x,dur:X.dur,rise:K,to:null}),A=xt}const C=bo(bt,T)??D.cam;G(C,j)}function G(j,L){if(R!==null){const xt=s?1:(x-R.start)/R.dur,bt=R.to?.()??j;D=ya(em(R.from,bt,Math.min(1,xt),R.rise)),xt>=1&&(R=null);return}D=s?ya(j):_5(D,j,L)}function $(j,L){if(E.k!=="visitor")return;if(!s&&v5(E,L,P)){J();return}const xt=E.follow;if(xt!==null){const bt=T.bim(xt.office,xt.name);bt!==null&&G(Mu(bt,D.cam.zoom,.5,.5),j);return}R!==null&&G(D.cam,j)}function J(){U({k:"film"});const j=_n[So(_n,Xn(x))];A=So(_n,Xn(x)),R=j?{from:D.cam,start:x,dur:tm,rise:null,to:()=>bo(j,T)}:null,ct()}const it=z5(e,{cam:()=>D.cam,take(j,L){R=null,D=ya(rs(j)),F=V(),U({k:"visitor",last:V(),follow:L??null}),ct()},pick:(j,L)=>u.pickBim(j,L),hover(j){const L=j?.id===O?.id&&j?.name===O?.name;O=j,E.k==="visitor"&&j!==null&&U({...E,last:V()}),L||ct()},inside(j){P=j,E.k==="visitor"&&U({...E,last:V()})},follow(j){F=V(),U({k:"visitor",last:V(),follow:j}),ct()},wide(){const j=B();j!==null&&(R={from:D.cam,start:x,dur:s?0:tm,rise:null,to:null},U({k:"visitor",last:V(),follow:null}),R.to=()=>j,ct())}});let Tt=0,H=0,tt=!1,k=0,W=!1;const at=()=>!W&&tt&&!document.hidden;function ht(j){if(Tt=0,!at())return;const L=performance.now(),xt=H===0?0:Math.min(.1,Math.max(0,(j-H)/1e3));H=j,c&&d<0&&(d=j);const bt=c?t.entryAt??j-d:_e.done;!s&&bt>=_e.done&&(x+=xt);const C=i();for(const Mt of _){lm(Mt,x,C,s);const rt=iR(Mt,C,s,vt(Mt));rt&&v.set(Mt.cast.id,rt)}if(c&&E.k==="film"?dt(bt):E.k==="film"?I(xt):$(xt,V()),!c&&(p?.frames===0||u.shownFit()===null)){const Mt=_n[So(_n,Xn(x))],rt=E.k==="film"&&Mt!==void 0?bo(Mt,T):B();rt&&(D=ya(rt))}u.setCam(D.cam);const w=performance.now(),X=u.liveIds();for(const Mt of c?X.slice(0,k):X){const rt=v.get(Mt);rt&&u.live(Mt,rt,x)}c&&gt(bt,X.length);const K=performance.now();u.frame(C);const ot=performance.now();c&&(h.root.style.opacity=String(E5(bt))),Q();const wt=performance.now();if(c&&bt>=_e.done&&(c=!1,h.root.style.opacity=""),k++,e.dataset.ready!=="true"&&(e.dataset.ready="true",a("ready")),p){p.frames++,p.ms=[...p.ms.slice(-299),performance.now()-L],p.phases=[...p.phases.slice(-299),{brain:w-L,pose:K-w,draw:ot-K,words:wt-ot}],p.T=Xn(x),p.hands=E.k,p.shot=A,p.cam=D.cam;const Mt=new Set(u.liveIds());p.offices=Zo.map(rt=>({id:rt.id,live:Mt.has(rt.id),bims:(v.get(rt.id)?.played??[]).map(st=>({name:st.name,k:st.pose.seg.act.k,x:st.pose.x,z:st.pose.z,head:u.headOf(rt.id,st.name)!==null}))}))}(!s||R!==null)&&Kt()}function dt(j){const L=B();if(L===null)return;const xt=Xn(x);A=So(_n,xt);const bt=_n[A],C=bt?bo(bt,T):null,w=(j-_e.cam.from)/(_e.cam.to-_e.cam.from);D=ya(C===null||w<=0?L:em(L,C,Math.min(1,w),null))}function gt(j,L){const xt=u.entry.parts();if(xt!==null){if(!f&&xt.offices.length>=L&&(f=!0,u.entry.warm()),j<_e.built){l.apply(j,xt,u.shownFit()?.scale??.05);return}(xt.scape!==null||xt.offices.some(bt=>bt.world!==null))&&(l.finish(xt),u.entry.settle())}}function Kt(){if(c||R!==null||V()-F<1){Tt=requestAnimationFrame(ht);return}const L=H,xt=bt=>{if(Tt=0,!!at()){if(bt-L<aR-2&&R===null&&V()-F>=1){Tt=requestAnimationFrame(xt);return}ht(bt)}};Tt=requestAnimationFrame(xt)}function ct(){Tt!==0||!at()||(Tt=requestAnimationFrame(ht))}function ut(){if(O!==null)return O;if(E.k==="visitor")return E.follow?{id:E.follow.office,name:E.follow.name}:null;const j=_n[A];return!j||j.subject.k!=="bim"||j.size!=="follow"&&j.size!=="close"&&j.size!=="closest"?null:{id:j.subject.office,name:j.subject.name}}function vt(j){const L=ut();return L===null||L.id!==j.cast.id?$a:{...$a,hover:O?.id===j.cast.id?O.name:null,follow:L.name}}function _t(){const j=new Set,L=ut();L!==null&&j.add(`${L.id}\0${L.name}`);const xt=E.k==="film"?_n[A]:void 0;if(xt?.subject.k==="pair")for(const bt of xt.subject.names)j.add(`${xt.subject.office}\0${bt}`);return j}function Q(){const j=ut(),L=_t(),xt=Math.max(1,e.clientWidth),bt=st=>st!==null&&st.x/xt>=dm.x0&&st.x/xt<=dm.x1,C=!(E.k==="film"&&R!==null),w=[],X=new Map,K=[],ot=[],wt=Xn(x);for(const st of u.liveIds()){const At=v.get(st);if(!At)continue;const Ht=Vg(st,wt).bims??{};for(const Et of At.labels.values()){const Rt=`${st}\0${Et.name}`,Vt=u.headOf(st,Et.name);if(Et.mode==="egg"){const Zt={...Et,words:P5(Et.words)},jt=Ht[Et.name]?.since??1/0;L.has(Rt)?bt(Vt)&&K.push({key:Rt,label:Zt,head:Vt,rank:0}):jt<rR&&ot.push({key:Rt,label:Zt,head:Vt,since:jt,near:j?.id===st?0:1});continue}(Et.mode==="pill"||Et.pill!==null)&&w.push({key:Rt,label:{...Et,mode:"pill",words:""},head:Vt,rank:2})}if(!s)for(const Et of Az(At.frames)){const Rt=u.headOf(st,Et);Rt&&X.set(`${st}/${Et}`,Rt)}}if(j!==null&&C){const st=`${j.id}\0${j.name}`,At=u.headOf(j.id,j.name);if(!K.some(Ht=>Ht.key===st)&&bt(At)&&v.get(j.id)?.frames.some(Ht=>Ht.name===j.name)===!0){const Ht=w.find(Et=>Et.key===st)?.label.pill??null;K.push({key:st,label:{name:j.name,mode:"name",words:"",title:"",pill:Ht},head:At,rank:0})}}const Mt=K.length>0?void 0:ot.filter(st=>st.head!==null).sort((st,At)=>st.near-At.near||st.since-At.since)[0];Mt!==void 0&&K.push({key:Mt.key,label:Mt.label,head:Mt.head,rank:1});const rt=new Set(K.map(st=>st.key));h.labels([...w.filter(st=>!rt.has(st.key)),...K]),h.zzz(X)}const St=new ResizeObserver(()=>{const j=e.clientWidth,L=e.clientHeight;j<=0||L<=0||(u.setSize(j,L),ct())});St.observe(e);const Pt=new IntersectionObserver(j=>{tt=j.some(L=>L.isIntersecting),H=0,ct()});Pt.observe(e);const yt=()=>{H=0,ct()};return document.addEventListener("visibilitychange",yt),u.onLost(()=>{e.dataset.lost="true",a("lost")}),{setTheme(j){n=j==="dark",e.dataset.theme=j,ct()},resumeFilm(){s||J()},zoomBy(j){it.zoomBy(j)},dispose(){W=!0,Tt!==0&&cancelAnimationFrame(Tt),St.disconnect(),Pt.disconnect(),document.removeEventListener("visibilitychange",yt),it.dispose(),h.dispose(),u.dispose(),r.remove(),p&&delete window.__bimsHero}}}export{lR as playFilm};
