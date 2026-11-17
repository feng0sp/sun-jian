"""Package the existing painted cels and ImageGen's two exposed lap components.

This only registers and masks artwork. It never renders a 3D sample into a scene.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'dist/assets/campaign-2d'
OUT = ART / 'sample-layers'
OUT.mkdir(exist_ok=True)
GEN = Path('C:/Users/13412/.codex/generated_images/01a1ae64-41d7-7a92-953a-3237caed8628')

def image(name):
    return Image.open(ART / name).convert('RGBA').resize((1920,1080),Image.Resampling.LANCZOS)

def matte(src, points):
    mask=Image.new('L',src.size)
    ImageDraw.Draw(mask).polygon(points,fill=255)
    mask=mask.filter(ImageFilter.GaussianBlur(.45))
    result=src.copy()
    result.putalpha(mask)
    return result.crop(mask.getbbox())

def save(name, sprite, rect):
    target=OUT/(name+'.webp')
    sprite.save(target,format='WEBP',lossless=True)
    x,y,w,h=rect
    return {'path':'assets/campaign-2d/sample-layers/'+target.name,'placement':[x/1920,y/1080,w/1920,h/1080]}

near0,near1,near3=image('workbench-0.webp'),image('workbench-1.webp'),image('workbench-3.webp')
wide0,wide3=image('room-table-night-0.webp'),image('room-table-night-3.webp')

straight=matte(near0,[(249,409),(305,392),(305,373),(348,359),(348,206),(454,189),(491,201),(491,382),(531,382),(576,408),(576,577),(385,619),(249,565)])
straight_base=matte(near1,[(249,408),(426,347),(575,388),(575,566),(385,619),(249,565)])
pin_full=matte(near0,[(1333,602),(1433,570),(1433,351),(1548,330),(1577,343),(1577,574),(1682,608),(1681,790),(1488,847),(1333,758)])
pin_base=matte(near3,[(1332,602),(1526,521),(1682,570),(1682,789),(1489,848),(1332,758)])
stem=matte(near0,[(1434,351),(1547,330),(1576,343),(1576,582),(1501,610),(1434,589)])
lap=matte(near0,[(732,420),(835,385),(1030,452),(1102,391),(1208,426),(1208,499),(1265,573),(1265,625),(1193,682),(1030,611),(811,685),(702,638),(702,566),(884,504),(732,464)])
loose=matte(near1,[(100,185),(235,146),(239,132),(269,121),(313,134),(313,205),(145,236),(101,217)])
key=matte(near3,[(293,152),(317,147),(340,156),(340,182),(316,192),(293,180)])
installed_key=matte(near0,[(1392,709),(1426,695),(1451,706),(1451,748),(1425,760),(1392,743)])

lower_source=Image.open(GEN/'exec-a6a14572-183f-4c97-85ec-2a502405c1dd.png').convert('RGBA')
lower=matte(lower_source,[(156,148),(404,55),(789,214),(789,273),(1005,348),(1062,329),(1595,548),(1593,772),(1392,869),(157,308)])
upper_source=Image.open(GEN/'exec-b2d1fd93-3304-46c7-bb7b-612c5026d9c1.png').convert('RGBA')
upper=matte(upper_source,[(75,548),(1179,70),(1456,154),(1456,371),(1066,543),(1066,406),(720,558),(720,723),(348,867),(75,720)])

upper_stored=ImageEnhance.Brightness(lower).enhance(1.08)

def make_close(day=False):
    return {
      'straight':[
        [save('close-straight',straight,(245,185,340,435))],
        [save('close-straight-base',straight_base,(245,343,340,277)),save('close-tray-straight',loose,(75,139,170,84))]],
      'lap':[
        [save('close-lap',lap,(700,384,565,302))],
        [save('close-lap-upper',upper,(720,390,535,299)),save('close-box-lower',lower,(1705,245,160,75))],
        [save('close-lap-lower',lower,(730,389,535,299)),save('close-box-upper',upper_stored,(1765,258,150,70))],
        [save('close-box-lower',lower,(1705,245,160,75)),save('close-box-upper',upper_stored,(1765,258,150,70))]],
      'pinned':[
        [save('close-pinned',pin_full,(1330,328,355,522))],
        [save('close-pinned-base',pin_base,(1330,519,355,331)),save('close-pinned-stem',stem,(1433,330,145,282)),save('close-box-key',key,(401,156,33,27))],
        [save('close-pinned-base',pin_base,(1330,519,355,331)),save('close-tray-pinned',loose,(244,120,150,74)),save('close-box-key',key,(401,156,33,27))],
        [save('close-pinned-base',pin_base,(1330,519,355,331)),save('close-installed-key',installed_key,(1392,695,60,67)),save('close-tray-pinned',loose,(244,120,150,74))]]
    }

# The wide view takes its standing samples from its own painting, preserving perspective.
wstraight=matte(wide0,[(741,531),(762,523),(764,515),(777,513),(777,458),(808,450),(828,456),(829,516),(845,522),(861,529),(861,588),(792,609),(741,586)])
wbase=matte(wide3,[(742,532),(811,510),(882,529),(880,591),(799,617),(742,589)])
wpin=matte(wide0,[(1183,616),(1225,600),(1225,534),(1251,524),(1278,531),(1278,607),(1317,624),(1317,687),(1246,716),(1182,691)])
wpbase=matte(wide3,[(1193,616),(1262,589),(1337,609),(1337,683),(1260,715),(1193,690)])
wstem=matte(wide0,[(1225,534),(1251,524),(1278,531),(1278,607),(1250,618),(1225,610)])
wlap=matte(wide0,[(927,552),(960,535),(1030,558),(1074,542),(1113,554),(1113,580),(1137,601),(1137,623),(1104,640),(1026,608),(948,635),(915,619),(915,597),(977,577),(927,572)])
empty_box=matte(wide0,[(1368,533),(1446,511),(1582,542),(1579,608),(1509,636),(1369,599)])

def make_wide(light):
    def tone(im):
        if light=='night':return im
        rgb=ImageEnhance.Color(im.convert('RGB')).enhance(.86)
        rgb=ImageEnhance.Brightness(rgb).enhance(1.04)
        rgb=rgb.convert('RGBA');rgb.putalpha(im.getchannel('A'));return rgb
    def patch(n,im,rect):return save(light+'-'+n,tone(im),rect)
    return {
      'straight':[
        [patch('straight',wstraight,(741,450,123,160))],
        [patch('straight-base',wbase,(741,510,141,108)),patch('tray-straight',loose,(591,457,73,31))]],
      'lap':[
        [patch('lap',wlap,(914,535,225,106))],
        [patch('lap-upper',upper,(923,543,210,110)),patch('box-lower',lower,(1421,534,80,38))],
        [patch('lap-lower',lower,(923,542,210,110)),patch('box-upper',upper_stored,(1480,532,80,38))],
        [patch('box-lower',lower,(1421,534,80,38)),patch('box-upper',upper_stored,(1480,532,80,38))]],
      'pinned':[
        [patch('pinned',wpin,(1182,524,138,193))],
        [patch('pinned-base',wpbase,(1189,589,148,128)),patch('pinned-stem',wstem,(1225,524,54,96)),patch('box-key',key,(716,452,14,13))],
        [patch('pinned-base',wpbase,(1189,589,148,128)),patch('tray-pinned',loose,(656,447,63,29)),patch('box-key',key,(716,452,14,13))],
        [patch('pinned-base',wpbase,(1189,589,148,128)),patch('installed-key',installed_key,(1205,646,22,23)),patch('tray-pinned',loose,(656,447,63,29))]]
    }

day_table=Image.open(GEN/'exec-dc5420ae-96d9-437b-b458-6f56f0004af3.png').convert('RGB').resize((1920,1080),Image.Resampling.LANCZOS)
day_table.save(ART/'puzzle-table-day-0139.webp',format='WEBP',quality=91)
close={'base':'assets/campaign-2d/puzzle-table.webp','dayBase':'assets/campaign-2d/puzzle-table-day-0139.webp','layers':make_close()}
wide={'nightBase':'assets/campaign-2d/room-night.webp','dayBase':'assets/campaign-2d/room-day.webp','emptyBase':'assets/campaign-2d/room-day-empty.webp',
      'box':[save('wide-empty-box',empty_box,(1368,511,216,126))],
      'layers':{'night':make_wide('night'),'day':make_wide('day')}}
wide['layers']['empty']=wide['layers']['day']
for name,value in [('sample-close-art',close),('sample-wide-art',wide)]:
    global_name='SampleCloseArt' if name=='sample-close-art' else 'SampleWideArt'
    (ROOT/'dist'/f'{name}.js').write_text('/* Registered painted cels. */\nwindow.'+global_name+'='+json.dumps(value,separators=(',',':'))+';\n',encoding='utf8')
    (ROOT/'docs'/f'{name}-0139.json').write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf8')

meta={'purpose':'Registered transparent artwork preparation for the physical sample inventory.','partialLapSources':[str(GEN/'exec-a6a14572-183f-4c97-85ec-2a502405c1dd.png'),str(GEN/'exec-b2d1fd93-3304-46c7-bb7b-612c5026d9c1.png')],'sourceTool':'built-in ImageGen edits commissioned by context_geometry139','otherSources':'Existing game paintings workbench-0/1/3 and room-table-night-0/3','dayTreatment':'Mild desaturation and exposure adjustment of the same painted sample silhouettes; scene lighting remains in the original day backdrop.'}
(ROOT/'docs/sample-painting-0139.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf8')
print('Packed painted sample states and both scene atlases.')
