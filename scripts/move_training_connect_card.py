from pathlib import Path
import re

path = Path("apps/web/src/pages/TrainingLabPage.tsx")
text = path.read_text()
pattern = re.compile(r'\n        <section className=\{`training-profile training-profile--\$\{identityState\.status\}`\} aria-label="Discord 서버 계정 연결 상태">.*?\n        </section>\n', re.S)
match = pattern.search(text)
if match is None:
    raise SystemExit("training profile section not found")
section = match.group(0)
text = pattern.sub("\n", text, count=1)
marker = '\n        <section className="training-lab-intro">'
if marker not in text:
    raise SystemExit("intro marker not found")
text = text.replace(marker, section + marker, 1)
path.write_text(text)
