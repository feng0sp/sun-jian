"""Generate the anonymous, illustrated game-design brief for 榫间."""
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'artifacts/python-packages'))
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader

OUT = ROOT / 'output/pdf/榫间_游戏设计说明.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
ART = ROOT / 'artifacts/report-art'
pdfmetrics.registerFont(TTFont('CN', 'C:/Windows/Fonts/msyh.ttc', subfontIndex=0))
pdfmetrics.registerFont(TTFont('SerifCN', 'C:/Windows/Fonts/simsun.ttc', subfontIndex=0))
W, H, M = 595.276, 841.89, 44
CW = W - M * 2
INK, MUTED, COPPER, PAPER, LINE = map(HexColor, ['#29382f','#7d8674','#a55b36','#f6f3eb','#d9ddce'])
c = canvas.Canvas(str(OUT), pagesize=(W, H))
c.setTitle('榫间 - 榫卯解谜游戏设计说明')
c.setAuthor('榫间')
c.setSubject('榫卯结构、空间解谜、文化体验与游戏原型')

def text(s, x, y, size=10, font='CN', color=INK):
    c.setFillColor(color); c.setFont(font, size); c.drawString(x, y, s)

def para(s, x, y, width=CW, size=10, leading=18, font='CN', color=MUTED):
    lines=[]; line=''
    for char in s:
        if char=='\n': lines.append(line); line=''; continue
        if pdfmetrics.stringWidth(line+char,font,size)>width and line:
            lines.append(line);line=char
        else: line+=char
    if line: lines.append(line)
    for row in lines:text(row,x,y,size,font,color);y-=leading
    return y

def rule(y):
    c.setStrokeColor(LINE);c.setLineWidth(.6);c.line(M,y,W-M,y)

def image(filename,x,top,width,height=None):
    reader=ImageReader(str(filename));iw,ih=reader.getSize()
    if height is None:height=width*ih/iw
    c.drawImage(reader,x,top-height,width=width,height=height,mask='auto')
    return top-height

def begin(page,tag,title):
    c.setFillColor(PAPER);c.rect(0,0,W,H,fill=1,stroke=0)
    text('榫间',M,H-39,15,'SerifCN')
    text('THE ART OF JOINING',M+49,H-37,6.5,'Helvetica',MUTED)
    c.setFont('Helvetica',8);c.setFillColor(COPPER);c.drawRightString(W-M,H-38,tag)
    rule(H-53)
    if title:text(title,M,H-96,25,'SerifCN')

def end(page):
    rule(46);text('榫间 / 榫卯解谜游戏原型',M,30,7.5,color=MUTED)
    c.setFillColor(MUTED);c.setFont('Helvetica',7.5);c.drawRightString(W-M,30,f'{page:02d} / 07')
    c.showPage()

def box(x,top,w,h,fill='#eeede2',stroke=LINE):
    c.setFillColor(HexColor(fill));c.setStrokeColor(stroke);c.setLineWidth(.5);c.roundRect(x,top-h,w,h,3,fill=1,stroke=1)

def link(label,url,x,y,size=8):
    text(label,x,y,size,color=COPPER);width=pdfmetrics.stringWidth(label,'CN',size)
    c.linkURL(url,(x,y-2,x+width,y+size+2),relative=0,thickness=0)

# 01 / Concept cover
begin(1,'GAME DESIGN / 2026','')
text('榫间',M,744,49,'SerifCN')
text('榫卯结构 × 空间解谜',M,709,14,color=MUTED)
text('观察 / 推理 / 解构 / 归位',M,685,8.5,color=COPPER)
image(ART/'hero.png',M,656,CW,320)
text('实际游戏模型：无钉滑盖木匣',M,321,8,color=MUTED)
para('把木作的结构逻辑，变成玩家可以亲手解开的谜题。',M,280,size=21,leading=31,font='SerifCN',color=INK)
para('玩家不只观看传统结构，而是通过旋转、选木、辨向与拆装，理解木与木为何能相互嵌合，又为何必须按一定顺序松开。',M,212,size=10,leading=19)
for i,(n,label) in enumerate([('6','组基础关卡'),('2','种拆装模式'),('3','类结构约束')]):
    x=M+i*(CW+12)/3;ww=(CW-24)/3;box(x,147,ww,67)
    text(n,x+15,106,28,'Helvetica',INK);text(label,x+50,113,9,color=MUTED)
end(1)

# 02 / Structure becomes mechanics
begin(2,'01 / MECHANICS','把榫卯，转成游戏规则')
para('榫头是凸出的部分，卯眼或卯槽容纳它。游戏把构件之间的边界与嵌合关系，转化为玩家可操作、可验证的空间问题。[2]',M,709,size=10,leading=18)
headers=[('木作中的关系',94),('游戏中的规则',130),('玩家需要做什么',CW-224)]
yy=647;xx=M;c.setFillColor(INK);c.rect(M,yy-28,CW,28,fill=1,stroke=0)
for label,width in headers:text(label,xx+12,yy-18,9,color=PAPER);xx+=width
rows=[('方向约束','开口决定退出轴线','观察卯眼的开口；选择构件能通过的方向。'),('形状约束','斜面阻止直接上拔','识别燕尾的宽窄关系；沿槽轴滑动。'),('顺序约束','小件锁住主构件','辨认穿销与木钥；先解除限制，再移动主件。')]
yy-=28
for index,row in enumerate(rows):
    c.setFillColor(HexColor('#eeede2') if index%2==0 else PAPER);c.rect(M,yy-67,CW,67,fill=1,stroke=0)
    xx=M
    for value,(_,width) in zip(row,headers):para(value,xx+12,yy-23,width-24,9.5,16,color=INK if xx==M else MUTED);xx+=width
    yy-=67
rule(yy)
text('核心体验循环',M,383,13,'SerifCN')
flow=['观察','推理','操作','反馈','理解'];fw=(CW-48)/5
for i,label in enumerate(flow):
    x=M+i*(fw+12);box(x,359,fw,41,fill='#e8ecde');text(label,x+21,333,11)
    if i<4:text('›',x+fw+4,333,12,'Helvetica',COPPER)
figw=(CW-15)/2
image(ART/'pin-xray.png',M,287,figw,161)
image(ART/'dovetail-arrow.png',M+figw+15,287,figw,161)
text('透视：看见藏在内部的穿销',M,109,9,color=INK)
text('方向预览：把抽象坐标变成可见动作',M+figw+15,109,9,color=INK)
para('碰撞反馈指出阻挡构件；提示逐步揭示线索。玩家可以撤销，不以错误次数惩罚探索。',M,83,CW,8.5,14)
end(2)

# 03 / Six-level learning progression
begin(3,'02 / LEVELS','从一处接点，走向一件木器')
para('六个主关卡逐步引入开口、搭接、锁销、斜面与约束链，每关都可以拆开与合回；独立的借位实验进一步引入局部移动。',M,710,size=10)
levels=[('straight','01  初识 · 直榫','观察开口，沿长轴退出。'),('lap','02  交叠 · 半榫','各让半厚，允许不同拆解顺序。'),('pinned','03  解锁 · 穿销','先抽木销，再抽榫头。'),('dovetail','04  循轨 · 燕尾','先移木钥，再沿卯槽滑动。'),('double-pin','05  套锁 · 双销','小销、主销与榫头形成约束链。'),('wooden-box','06  匣间 · 合木','滑盖、侧板与端板共同决定拆装。')]
cardw=(CW-15)/2;cardh=195
for i,(name,title,desc) in enumerate(levels):
    x=M+(i%2)*(cardw+15);top=681-(i//2)*(cardh+14);box(x,top,cardw,cardh)
    image(ART/(name+'.png'),x+(cardw-190)/2,top-8,190)
    text(title,x+15,top-cardh+32,12,'SerifCN')
    text(desc,x+15,top-cardh+15,8.5,color=MUTED)
end(3)

# 04 / Interaction and feedback
begin(4,'03 / EXPERIENCE','安静的工作台，清楚的操作')
para('视觉采用纸色、木色与深绿，像一份可以动手的木作手记。界面围绕“选木 → 辨向 → 移动”组织。',M,710,size=10)
interface=ART/'interface.png'
if not interface.exists():interface=ROOT/'artifacts/desktop.png'
image(interface,M,667,CW,345)
text('实际运行界面；结构图像、右侧操作与即时反馈共同支持推理。',M,306,8.5)
items=[('01','读懂形状','拖动旋转、缩放与透视。选中木件时描边；方向按钮显示对应的三维箭头。'),('02','理解反馈','错误方向会标出阻挡构件。提示从线索到动作逐步展开，帮助继续观察。'),('03','验证顺序','合回模式逆向验证结构。过早装入锁销可能形成锁定，撤销后可重新安排。')]
iw=(CW-26)/3
for i,(n,title,body) in enumerate(items):
    x=M+i*(iw+13);box(x,276,iw,139,fill='#eeede2');text(n,x+12,252,10,'Helvetica',COPPER);text(title,x+12,226,13,'SerifCN');para(body,x+12,203,iw-24,9,16)
text('可达性与操作',M,108,12,'SerifCN')
para('支持按钮与键盘、减少动态效果偏好、可开关音效。鼠标用于旋转与缩放；触屏采用单指旋转、双指缩放。',M,85,CW,9,16)
end(4)

# 05 / Evidence and limits
begin(5,'04 / VALIDATION','让规则与画面，相互印证')
para('木件的渲染与碰撞使用同一组几何。移动采用连续检测，避免跳过薄木销；拆装规则通过状态与浏览器操作验证。',M,709,size=10)
metrics=[('24','可达拆解状态'),('12','完整拆装流程'),('0','浏览器脚本错误')]
for i,(n,label) in enumerate(metrics):
    x=M+i*(CW+12)/3;ww=(CW-24)/3;box(x,654,ww,68,fill='#e8ecde');text(n,x+15,611,28,'Helvetica');text(label,x+15,595,8.5,color=MUTED)
checks=[('初始几何','六关与实验木件无互相穿透；正确移动方向由几何决定。'),('拆解与归位','所有可达拆解状态可完成；六关归位路径均可完成。'),('错误与恢复','错误方向保留状态；过早锁定与局部移动均可撤销。'),('三维交互','实际点击选木、旋转复位、方向预览与可选音效均已检查。'),('适配与离线','320-1440px 布局无横向溢出；模拟触屏与本地文件运行。'),('桌面包与降级','Windows 包完成六关双模式及实验；图形异常时保留规则操作。')]
yy=555;c.setFillColor(INK);c.rect(M,yy-27,CW,27,fill=1,stroke=0);text('检查项目',M+12,yy-18,9,color=PAPER);text('已验证的行为',M+141,yy-18,9,color=PAPER);yy-=27
for i,(name,body) in enumerate(checks):
    c.setFillColor(HexColor('#eeede2') if i%2==0 else PAPER);c.rect(M,yy-51,CW,51,fill=1,stroke=0);text(name,M+12,yy-24,9.5);para(body,M+141,yy-21,CW-155,9,16);yy-=51
rule(yy)
text('当前验证边界',M,183,12,'SerifCN')
para('本轮验证属于自动化规则检查、桌面浏览器和模拟触屏测试，尚未进行真实玩家研究或多款实体手机测试。组合关卡是为游戏教学设计的简化模型，不作为传统构造的标准复刻或工程受力分析。',M,159,CW,9.5,18)
end(5)

# 06 / Partial movement experiment
begin(6,'05 / BORROWING SPACE','先借出一格，再解开互锁')
para('借位实验把位置变化加入谜题。木钥挡住滑木的出口，滑木的木帽又限制木钥完全退出；需要先让出一点空间。',M,709,size=10,leading=18)
gap=13;fw=(CW-gap*2)/3
stages=[('ex-initial','01  相互限制','两件木都不能完整抽出。'),('ex-shifted','02  抬钥一格','木钥仍在模型中，出口已经释放。'),('ex-open','03  滑木退出','木帽移开，木钥可以完整取出。')]
for i,(filename,title,body) in enumerate(stages):
    x=M+i*(fw+gap);image(ART/(filename+'.png'),x,661,fw,130);text(title,x,512,11,'SerifCN');para(body,x,490,fw,8.5,15)
rule(451)
text('从“是否存在”，走向“位置关系”',M,418,16,'SerifCN')
para('六个主关卡主要通过取下木件改变约束；这个实验保留木件，用一格移动改变出口的占用关系。同一件木的不同位置，会产生不同的可行操作。',M,384,CW,10,19)
items=[('局部移动','动作完成后，木钥仍可见；已拆计数不增加。'),('路径释放','移动后的几何参与后续碰撞，滑木获得退出路线。'),('位置撤销','撤销恢复准确位置，能逐步回到原始互锁状态。')]
yy=301
for n,(title,body) in enumerate(items):
    box(M,yy,CW,57,fill='#eeede2');text(f'0{n+1}',M+13,yy-31,12,'Helvetica',COPPER);text(title,M+45,yy-23,11,'SerifCN');para(body,M+45,yy-43,CW-60,9,15);yy-=70
para('这是独立的拆解实验，进度不计入六关主卷。结构为面向游戏机制设计的组合模型；当前不提供实验的合回模式或木件自身旋转。',M,83,CW,8,14)
end(6)

# 07 / Deliverables, iteration and sources
begin(7,'06 / NEXT STEPS','把体验，带进参赛作品')
para('可对应华灿奖数字媒体设计中的游戏方向。提交材料应清楚展示核心玩法、美术风格、交互操作与适配平台，并以最新官方细则为准。[1]',M,709,size=10,leading=18)
text('交付结构',M,652,13,'SerifCN')
deliveries=[('浏览器试玩','同一入口持续更新，支持桌面与触屏。'),('离线游戏包','网页离线包与 Windows x64 可执行游戏包。'),('演示与说明','真实操作录屏、设计说明及可继续编辑的源代码。')]
yy=622
for title,body in deliveries:
    text(title,M,yy,10,color=INK);para(body,M+95,yy,CW-95,9.5,16);yy-=35
rule(yy+9)
text('下一轮值得验证的三件事',M,500,13,'SerifCN')
nexts=[('真实结构校核','对照可靠图纸与木工意见，确认结构名称、比例和构造表达。'),('玩家学习效果','邀请目标玩家观察试玩，记录方向误解、提示使用与顺序推理过程。'),('更深的移动谜题','借位实验已经提供局部位移；后续研究旋转、更多互锁组合与难度递进。')]
yy=470
for i,(title,body) in enumerate(nexts):
    text(f'0{i+1}',M,yy,11,'Helvetica',COPPER);text(title,M+31,yy,11);para(body,M+31,yy-21,CW-31,9,16);yy-=69
text('参考与查阅',M,243,13,'SerifCN')
references=[
    ('[1] 辽宁工业大学：2026 华灿奖通知及作品要求','https://cxcy.lnut.edu.cn/info/14428/186218.htm'),
    ('[2] Smithsonian：House Clues / Mortise and Tenon','https://americanhistory.si.edu/explore/exhibitions/within-these-walls/online/house-clues'),
    ('[3] Smithsonian：Dovetail Joint 馆藏条目','https://americanhistory.si.edu/collections/object/nmah_864077')
]
for i,(label,url) in enumerate(references):link(label,url,M,217-i*27,8)
link('试玩入口 · 榫间', 'https://sun-jian-wood-puzzle.beige-acorn-8677.chatgpt.site',M,111,10)
para('2026-10-13 / 设计原型。作品未提交赛事；参赛时应补充真实作者信息至报名材料，并核对作品匿名要求。',M,83,CW,8,14)
end(7)
c.save()
reader=PdfReader(str(OUT));assert len(reader.pages)==7
for page in reader.pages:assert len(page.extract_text())>80
print(f'Created {OUT} / 7 pages / {OUT.stat().st_size:,} bytes')
