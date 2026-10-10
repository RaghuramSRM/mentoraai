import sys
from pathlib import Path
from PIL import Image, ImageDraw

source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("tmp/pdf-pages")
output = sys.argv[2] if len(sys.argv) > 2 else "tmp/project-session-contact-sheet.png"
paths = sorted(source.glob("*.png"))
thumbs = []
for path in paths:
    image = Image.open(path).convert("RGB")
    image.thumbnail((240, 180))
    thumbs.append((path, image.copy()))

sheet = Image.new("RGB", (960, ((len(thumbs) + 3) // 4) * 220), "white")
draw = ImageDraw.Draw(sheet)
for index, (path, image) in enumerate(thumbs):
    x = (index % 4) * 240
    y = (index // 4) * 220
    sheet.paste(image, (x, y + 20))
    draw.text((x + 8, y + 4), path.stem, fill="black")
sheet.save(output)
