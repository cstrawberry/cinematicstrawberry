# Converts out/slideNN.png to the three JPG sizes used by the article's slide deck.
import os
from PIL import Image
here=os.path.dirname(os.path.abspath(__file__))
dst=os.path.join(here,'..','..','images','slideshow','liar')
for i in range(1,13):
    im=Image.open(os.path.join(here,'out',f'slide{i:02d}.png')).convert('RGB')
    if im.size!=(1600,900): im=im.crop((0,0,1600,900)) if im.size[0]>=1600 and im.size[1]>=900 else im.resize((1600,900),Image.LANCZOS)
    im.save(os.path.join(dst,f'liar_slide_{i:02d}-desktop.jpg'),quality=88,optimize=True)
    if i==1:
        im.resize((800,450),Image.LANCZOS).save(os.path.join(dst,'liar_slide_01-800.jpg'),quality=86,optimize=True)
        im.resize((480,270),Image.LANCZOS).save(os.path.join(dst,'liar_slide_01-480.jpg'),quality=84,optimize=True)
print('jpgs written to',os.path.abspath(dst))
