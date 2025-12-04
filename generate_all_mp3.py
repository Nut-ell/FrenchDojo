from pathlib import Path
import re
import asyncio
import edge_tts

INPUT_FILE = "sentences_1-504_numbered.txt"
OUTPUT_DIR = "public/audio"
VOICE = "fr-FR-DeniseNeural"
SPEED = "-10%"

def make_filename(num: int, sentence: str) -> str:
    s = sentence.strip()
    end_period = s.endswith(".")
    if end_period:
        s_core = s[:-1]
    else:
        s_core = s
    
    # 記号処理
    s_core = s_core.replace(".", "").replace("?", "")
    s_core = re.sub(r"[,:;]", "_", s_core)
    s_core = s_core.replace(" ", "_")
    s_core = re.sub(r"_+", "_", s_core).strip("_")
    
    if end_period:
        s_core += "."
    
    # MP3 extension
    return f"{num:03d}_{s_core}.mp3"

async def generate(sentence: str, out_path: Path):
    communicate = edge_tts.Communicate(sentence, VOICE, rate=SPEED)
    await communicate.save(str(out_path))

async def main():
    in_path = Path(INPUT_FILE)
    out_dir = Path(OUTPUT_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)
    
    lines = in_path.read_text(encoding="utf-8").splitlines()
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        m = re.match(r"^(\d+)\.\s*(.+)$", line)
        if not m:
            print(f"スキップ: {line}")
            continue
        
        num = int(m.group(1))
        sentence = m.group(2)
        
        filename = make_filename(num, sentence)
        out_path = out_dir / filename
        
        # Skip if already exists
        if out_path.exists():
            print(f"{num}: Already exists, skipping")
            continue
        
        print(f"{num}: {sentence} -> {filename}")
        await generate(sentence, out_path)

if __name__ == "__main__":
    asyncio.run(main())
