from PIL import Image, ImageDraw, ImageFont
import math
W,H=660,400
GROUND=(0xfd,0xfb,0xf7); FAINT=(0x7d,0x76,0x6c); DIM=(0x6b,0x64,0x5a)
def render(scale):
    S=scale*4  # supersample
    im=Image.new("RGB",(W*S,H*S),GROUND); d=ImageDraw.Draw(im)
    # gust arrow: one soft wave from x 262 to 398 at y 200
    x0,x1,y=262,396,200
    pts=[]
    for i in range(201):
        t=i/200; x=x0+(x1-x0)*t
        yy=y+5*math.sin(t*2*math.pi)*(1-t)**0.6
        pts.append((x*S,yy*S))
    w=int(2*S)
    d.line(pts,fill=FAINT,width=w,joint="curve")
    for p in (pts[0],pts[-1]):
        r=w/2; d.ellipse([p[0]-r,p[1]-r,p[0]+r,p[1]+r],fill=FAINT)
    # open chevron head
    hx,hy=pts[-1]; L=9*S
    for a in (math.radians(150),math.radians(210)):
        ex,ey=hx+L*math.cos(a),hy+L*math.sin(a)
        d.line([(hx,hy),(ex,ey)],fill=FAINT,width=w)
        r=w/2; d.ellipse([ex-r,ey-r,ex+r,ey+r],fill=FAINT)
    # words
    f=ImageFont.truetype("/System/Library/Fonts/SFNS.ttf",int(13*S))
    txt="drag bise to Applications"
    tw=d.textlength(txt,font=f)
    d.text(((W*S-tw)/2,336*S),txt,font=f,fill=DIM)
    return im.resize((W*scale,H*scale),Image.LANCZOS)
render(1).save("background.png",dpi=(72,72))
render(2).save("background@2x.png",dpi=(144,144))
# preview with fake icons
p=render(2); d=ImageDraw.Draw(p)
icon=Image.open("/Users/gabrielvergnaud/lab/bend-lab/harness/apps/desktop/resources/icon.png").convert("RGBA").resize((256,256))
p.paste(icon,(360-128,400-128),icon)
d.rounded_rectangle([960-110,400-110,960+110,400+110],radius=30,outline=(0xcf,0xc8,0xbd),width=4)
f=ImageFont.truetype("/System/Library/Fonts/SFNS.ttf",26)
for cx,t in((360,"bise"),(960,"Applications")):
    tw=d.textlength(t,font=f); d.text((cx-tw/2,540),t,font=f,fill=(0x1b,0x19,0x17))
p.save("preview@2x.png")
