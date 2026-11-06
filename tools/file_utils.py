from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def write(path,text):
    p=ROOT/path
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(text.strip()+'\n',encoding='utf8')
