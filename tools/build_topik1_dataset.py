from __future__ import annotations

import csv
import json
import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import requests
from bs4 import BeautifulSoup
from deep_translator import GoogleTranslator


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "data" / "sample_topik_vocab.json"
REFERENCE_TSV_PATH = ROOT / "results.tsv"
REFERENCE_TSV_URL = "https://raw.githubusercontent.com/julienshim/combined_korean_vocabulary_list/master/results.tsv"
HEADERS = {"User-Agent": "Mozilla/5.0"}

LEVEL_CONFIGS = {
    "topik1": {
        "index_url": "https://www.koreantopik.com/2024/05/topik-1-vocabulary-list-1850-for.html",
        "total_lessons": 18,
    },
    "topik2": {
        "index_url": "https://www.koreantopik.com/2024/09/complete-topik-2-vocabulary-list-3900.html",
        "total_lessons": 39,
        "regex": r"https://www\\.koreantopik\\.com/\\d{4}/\\d{2}/(?:the-|3900-vocabulary-words-for-topik-2-with)[^\"\\s<]+",
    },
}

CHOSEONG = [
    "ㄱ",
    "ㄲ",
    "ㄴ",
    "ㄷ",
    "ㄸ",
    "ㄹ",
    "ㅁ",
    "ㅂ",
    "ㅃ",
    "ㅅ",
    "ㅆ",
    "ㅇ",
    "ㅈ",
    "ㅉ",
    "ㅊ",
    "ㅋ",
    "ㅌ",
    "ㅍ",
    "ㅎ",
]
JUNGSEONG = [
    "ㅏ",
    "ㅐ",
    "ㅑ",
    "ㅒ",
    "ㅓ",
    "ㅔ",
    "ㅕ",
    "ㅖ",
    "ㅗ",
    "ㅘ",
    "ㅙ",
    "ㅚ",
    "ㅛ",
    "ㅜ",
    "ㅝ",
    "ㅞ",
    "ㅟ",
    "ㅠ",
    "ㅡ",
    "ㅢ",
    "ㅣ",
]
JONGSEONG = [
    "",
    "ㄱ",
    "ㄲ",
    "ㄳ",
    "ㄴ",
    "ㄵ",
    "ㄶ",
    "ㄷ",
    "ㄹ",
    "ㄺ",
    "ㄻ",
    "ㄼ",
    "ㄽ",
    "ㄾ",
    "ㄿ",
    "ㅀ",
    "ㅁ",
    "ㅂ",
    "ㅄ",
    "ㅅ",
    "ㅆ",
    "ㅇ",
    "ㅈ",
    "ㅊ",
    "ㅋ",
    "ㅌ",
    "ㅍ",
    "ㅎ",
]
CODA_TO_ONSET = {
    "ㄱ": "ㄱ",
    "ㄲ": "ㄲ",
    "ㄴ": "ㄴ",
    "ㄷ": "ㄷ",
    "ㄹ": "ㄹ",
    "ㅁ": "ㅁ",
    "ㅂ": "ㅂ",
    "ㅅ": "ㅅ",
    "ㅆ": "ㅆ",
    "ㅇ": "ㅇ",
    "ㅈ": "ㅈ",
    "ㅊ": "ㅊ",
    "ㅋ": "ㅋ",
    "ㅌ": "ㅌ",
    "ㅍ": "ㅍ",
    "ㅎ": "ㅎ",
}
COMPLEX_FINAL_SPLIT = {
    "ㄳ": ("ㄱ", "ㅅ"),
    "ㄵ": ("ㄴ", "ㅈ"),
    "ㄶ": ("ㄴ", "ㅎ"),
    "ㄺ": ("ㄹ", "ㄱ"),
    "ㄻ": ("ㄹ", "ㅁ"),
    "ㄼ": ("ㄹ", "ㅂ"),
    "ㄽ": ("ㄹ", "ㅅ"),
    "ㄾ": ("ㄹ", "ㅌ"),
    "ㄿ": ("ㄹ", "ㅍ"),
    "ㅀ": ("ㄹ", "ㅎ"),
    "ㅄ": ("ㅂ", "ㅅ"),
}
NEUTRAL_CODA = {
    "": "",
    "ㄱ": "ㄱ",
    "ㄲ": "ㄱ",
    "ㅋ": "ㄱ",
    "ㄳ": "ㄱ",
    "ㄺ": "ㄱ",
    "ㄴ": "ㄴ",
    "ㄵ": "ㄴ",
    "ㄶ": "ㄴ",
    "ㄷ": "ㄷ",
    "ㅅ": "ㄷ",
    "ㅆ": "ㄷ",
    "ㅈ": "ㄷ",
    "ㅊ": "ㄷ",
    "ㅌ": "ㄷ",
    "ㅎ": "ㄷ",
    "ㄹ": "ㄹ",
    "ㄻ": "ㅁ",
    "ㅁ": "ㅁ",
    "ㅂ": "ㅂ",
    "ㅍ": "ㅂ",
    "ㅄ": "ㅂ",
    "ㄼ": "ㅂ",
    "ㅇ": "ㅇ",
    "ㄽ": "ㄹ",
    "ㄾ": "ㄹ",
    "ㄿ": "ㅂ",
    "ㅀ": "ㄹ",
}
TENSE_MAP = {"ㄱ": "ㄲ", "ㄷ": "ㄸ", "ㅂ": "ㅃ", "ㅅ": "ㅆ", "ㅈ": "ㅉ"}
TENSE_TRIGGER_CODAS = {"ㄱ", "ㄲ", "ㅋ", "ㄳ", "ㄺ", "ㄷ", "ㅅ", "ㅆ", "ㅈ", "ㅊ", "ㅌ", "ㅎ", "ㅂ", "ㅍ", "ㅄ", "ㄼ"}
NASAL_MAP = {
    "ㄱ": "ㅇ",
    "ㄲ": "ㅇ",
    "ㅋ": "ㅇ",
    "ㄳ": "ㅇ",
    "ㄺ": "ㅇ",
    "ㄷ": "ㄴ",
    "ㅅ": "ㄴ",
    "ㅆ": "ㄴ",
    "ㅈ": "ㄴ",
    "ㅊ": "ㄴ",
    "ㅌ": "ㄴ",
    "ㅎ": "ㄴ",
    "ㅂ": "ㅁ",
    "ㅍ": "ㅁ",
    "ㅄ": "ㅁ",
    "ㄼ": "ㅁ",
}
ASPIRATE_MAP = {"ㄱ": "ㅋ", "ㄷ": "ㅌ", "ㅈ": "ㅊ", "ㅅ": "ㅆ"}
PRONUNCIATION_OVERRIDES = {
    "학교": "학꾜",
    "같이": "가치",
    "좋다": "조타",
    "국밥": "국빱",
    "읽다": "익따",
    "없다": "업따",
    "앉다": "안따",
    "걷다": "걷따",
    "밟다": "밥따",
    "값": "갑",
    "꽃": "꼳",
    "못하다": "모타다",
    "몇": "멷",
}
PART_OF_SPEECH_MAP = {
    "명사": "名詞",
    "동사": "動詞",
    "형용사": "形容詞",
    "부사": "副詞",
    "관형사": "冠形詞",
    "대명사": "代名詞",
    "수사": "數詞",
    "조사": "助詞",
    "감탄사": "感嘆詞",
    "접사": "接辭",
    "의존 명사": "依存名詞",
    "보조 용언": "補助用言",
}
KOREAN_MEANING_OVERRIDES = {
    "topik1": {
        "가깝다": "近",
        "감기": "感冒",
        "가볍다": "輕",
        "걷다": "走",
        "가리키다": "指",
        "갈아입다": "換",
        "갈아타다": "轉乘",
        "거실": "客廳",
        "거울": "鏡子",
        "경치": "景色",
        "경기": "比賽",
        "결혼식": "婚禮",
        "걸리다": "掛住",
        "가운데": "中間",
        "가요": "歌謠",
        "가위": "剪刀",
        "가을": "秋天",
        "각각": "各自",
        "간식": "點心",
        "간장": "醬油",
        "갈색": "棕色",
        "감사": "感謝",
        "값": "價格",
        "강": "江",
        "강아지": "小狗",
        "같이": "一起",
        "거의": "幾乎",
        "거짓말": "謊話",
        "건강": "健康",
        "건물": "建築物",
        "검정": "黑色",
        "것": "東西",
        "게임": "遊戲",
        "겨울": "冬天",
        "계란": "雞蛋",
        "계속": "持續",
        "계절": "季節",
    }
}


@dataclass
class Syllable:
    onset: str
    vowel: str
    coda: str


def fetch_html(url: str) -> str:
    response = requests.get(url, timeout=40, headers=HEADERS)
    response.raise_for_status()
    return response.text


def ensure_reference_tsv() -> None:
    if REFERENCE_TSV_PATH.exists():
        return
    response = requests.get(REFERENCE_TSV_URL, timeout=60, headers=HEADERS)
    response.raise_for_status()
    REFERENCE_TSV_PATH.write_bytes(response.content)


def normalize_whitespace(text: str) -> str:
    return " ".join(text.replace("\xa0", " ").split())


def normalize_korean_word(text: str) -> str:
    return re.sub(r"\s+", "", normalize_whitespace(text))


def chunked(values: list[str], size: int) -> Iterable[list[str]]:
    for index in range(0, len(values), size):
        yield values[index : index + size]


def translate_batch(values: list[str], translator: GoogleTranslator) -> list[str]:
    results: list[str] = []
    separator = "\n@@\n"
    for batch in chunked(values, 60):
        payload = separator.join(batch)
        translated = translator.translate(payload)
        parts = [part.strip() for part in translated.split(separator)]
        if len(parts) != len(batch):
            parts = translator.translate_batch(batch)
        results.extend(parts)
        time.sleep(0.35)
    return results


def translate_unique(values: list[str], translator: GoogleTranslator) -> list[str]:
    lookup: dict[str, str] = {}
    unique_values = [value for value in dict.fromkeys(values) if value]
    translated_unique = translate_batch(unique_values, translator)
    for source, translated in zip(unique_values, translated_unique):
        lookup[source] = translated
    return [lookup.get(value, value) for value in values]


def lesson_urls_topik1() -> list[str]:
    soup = BeautifulSoup(fetch_html(LEVEL_CONFIGS["topik1"]["index_url"]), "html5lib")
    urls: list[str] = []
    for anchor in soup.find_all("a", href=True):
        text = anchor.get_text(" ", strip=True)
        href = anchor["href"]
        if "From " in text and "TOPIK 1" not in text and href.startswith("https://www.koreantopik.com/"):
            urls.append(href)

    deduped: list[str] = []
    seen = set()
    for url in urls:
        if url not in seen:
            deduped.append(url)
            seen.add(url)
    return deduped[: LEVEL_CONFIGS["topik1"]["total_lessons"]]


def lesson_urls_topik2() -> list[str]:
    config = LEVEL_CONFIGS["topik2"]
    html = fetch_html(config["index_url"])
    urls = sorted(set(re.findall(config["regex"], html)))
    return urls[: config["total_lessons"]]


def lesson_urls(level: str) -> list[str]:
    if level == "topik1":
        return lesson_urls_topik1()
    if level == "topik2":
        return lesson_urls_topik2()
    raise ValueError(f"Unsupported level: {level}")


def parse_lesson(url: str) -> list[dict[str, str]]:
    soup = BeautifulSoup(fetch_html(url), "html5lib")
    table = soup.find("table")
    if table is None:
        raise RuntimeError(f"No table found in {url}")

    rows: list[dict[str, str]] = []
    for tr in table.find_all("tr")[1:]:
        cells = [td.get_text(" ", strip=True) for td in tr.find_all("td", recursive=False)]
        if len(cells) != 5:
            continue
        rows.append(
            {
                "rank": cells[0],
                "korean": normalize_korean_word(cells[1]),
                "meaning_en": normalize_whitespace(cells[2]),
                "example_korean": normalize_whitespace(cells[3]),
                "example_en": normalize_whitespace(cells[4]),
            }
        )
    return rows


def load_reference_entries() -> dict[str, list[dict[str, str]]]:
    ensure_reference_tsv()
    matches: dict[str, list[dict[str, str]]] = {}
    with REFERENCE_TSV_PATH.open(encoding="utf-8") as handle:
        reader = csv.DictReader(handle, delimiter="\t")
        for row in reader:
            word = normalize_korean_word(row["word"])
            if not word:
                continue
            matches.setdefault(word, []).append(
                {
                    "part_of_speech": normalize_whitespace(row["part_of_speech"]),
                    "explanation": normalize_whitespace(row["explanation"]),
                    "topik_level": normalize_whitespace(row["topik_level"]),
                }
            )
    return matches


def choose_part_of_speech(korean_word: str, reference_entries: dict[str, list[dict[str, str]]]) -> str:
    entries = reference_entries.get(korean_word, [])
    pos_candidates = {entry["part_of_speech"] for entry in entries if entry["part_of_speech"]}
    if not pos_candidates:
        return ""
    preferred = sorted(pos_candidates, key=lambda value: 0 if value in PART_OF_SPEECH_MAP else 1)[0]
    return PART_OF_SPEECH_MAP.get(preferred, preferred)


def decompose_char(char: str) -> Syllable | None:
    code = ord(char)
    if not (0xAC00 <= code <= 0xD7A3):
        return None
    index = code - 0xAC00
    onset = CHOSEONG[index // 588]
    vowel = JUNGSEONG[(index % 588) // 28]
    coda = JONGSEONG[index % 28]
    return Syllable(onset, vowel, coda)


def compose_syllable(syllable: Syllable) -> str:
    onset_index = CHOSEONG.index(syllable.onset)
    vowel_index = JUNGSEONG.index(syllable.vowel)
    coda_index = JONGSEONG.index(syllable.coda)
    return chr(0xAC00 + onset_index * 588 + vowel_index * 28 + coda_index)


def pronunciation(word: str) -> str:
    if word in PRONUNCIATION_OVERRIDES:
        return PRONUNCIATION_OVERRIDES[word]

    syllables: list[Syllable | str] = []
    for char in word:
        syllables.append(decompose_char(char) or char)

    hangul_indices = [idx for idx, syllable in enumerate(syllables) if isinstance(syllable, Syllable)]

    for pos, current_index in enumerate(hangul_indices[:-1]):
        next_index = hangul_indices[pos + 1]
        current = syllables[current_index]
        nxt = syllables[next_index]
        assert isinstance(current, Syllable)
        assert isinstance(nxt, Syllable)

        if current.coda and nxt.onset == "ㅇ" and nxt.vowel == "ㅣ" and current.coda in {"ㄷ", "ㅌ"}:
            nxt.onset = "ㅈ" if current.coda == "ㄷ" else "ㅊ"
            current.coda = ""
            continue

        if current.coda in {"ㅎ", "ㄶ", "ㅀ"} and nxt.onset in ASPIRATE_MAP:
            nxt.onset = ASPIRATE_MAP[nxt.onset]
            current.coda = "ㄴ" if current.coda == "ㄶ" else "ㄹ" if current.coda == "ㅀ" else ""
            continue

        rep_coda = NEUTRAL_CODA.get(current.coda, current.coda)

        if rep_coda == "ㄴ" and nxt.onset == "ㄹ":
            current.coda = "ㄹ"
            nxt.onset = "ㄹ"
            continue
        if rep_coda == "ㄹ" and nxt.onset == "ㄴ":
            nxt.onset = "ㄹ"
            continue

        if nxt.onset in {"ㄴ", "ㅁ"} and rep_coda in NASAL_MAP:
            current.coda = NASAL_MAP[rep_coda]
            continue

        if nxt.onset == "ㅇ" and current.coda:
            if current.coda in COMPLEX_FINAL_SPLIT:
                first, second = COMPLEX_FINAL_SPLIT[current.coda]
                current.coda = first
                nxt.onset = second
            else:
                nxt.onset = CODA_TO_ONSET.get(current.coda, nxt.onset)
                current.coda = ""
            continue

        if rep_coda in TENSE_TRIGGER_CODAS and nxt.onset in TENSE_MAP:
            nxt.onset = TENSE_MAP[nxt.onset]

    output: list[str] = []
    for pos, syllable in enumerate(syllables):
        if not isinstance(syllable, Syllable):
            output.append(syllable)
            continue

        next_hangul: Syllable | None = None
        for later in syllables[pos + 1 :]:
            if isinstance(later, Syllable):
                next_hangul = later
                break

        if syllable.coda and not (next_hangul and next_hangul.onset == "ㅇ"):
            syllable.coda = NEUTRAL_CODA.get(syllable.coda, syllable.coda)

        output.append(compose_syllable(syllable))

    return "".join(output)


def refine_chinese_meaning(level: str, korean: str, meaning_en: str, meaning_zh: str, example_en: str) -> str:
    if korean in KOREAN_MEANING_OVERRIDES.get(level, {}):
        return KOREAN_MEANING_OVERRIDES[level][korean]

    meaning = meaning_en.lower().strip()
    example = example_en.lower().strip()

    if meaning == "close" and "distance" in example:
        return "近"
    if meaning == "cold" and ("catch a cold" in example or "cold medicine" in example):
        return "感冒"
    if meaning == "cold" and ("weather" in example or "chilly" in example):
        return "冷"
    if meaning == "light" and ("load" in example or "weight" in example):
        return "輕"
    if meaning == "change" and "clothes" in example:
        return "換"
    if meaning == "change" and "train" in example:
        return "轉乘"
    if meaning == "point" and "finger" in example:
        return "指"
    if meaning == "walk" and "school" in example:
        return "走"
    if meaning in {"view", "scenery , view"}:
        return "景色"
    if meaning == "match":
        return "比賽"
    if meaning == "song":
        return "歌曲"
    if meaning == "chest":
        return "胸部"
    if meaning == "full":
        return "滿"

    return meaning_zh


def build_entries_for_level(level: str, reference_entries: dict[str, list[dict[str, str]]]) -> list[dict[str, object]]:
    urls = lesson_urls(level)
    expected = LEVEL_CONFIGS[level]["total_lessons"]
    if len(urls) != expected:
        raise RuntimeError(f"{level} expected {expected} lesson links, found {len(urls)}")

    rows: list[dict[str, str]] = []
    for url in urls:
        rows.extend(parse_lesson(url))
        time.sleep(0.2)

    translator = GoogleTranslator(source="en", target="zh-TW")
    chinese_meanings = translate_unique([row["meaning_en"] for row in rows], translator)
    example_chinese = translate_unique([row["example_en"] for row in rows], translator)

    entries: list[dict[str, object]] = []
    for index, (row, meaning_zh, example_zh) in enumerate(zip(rows, chinese_meanings, example_chinese), start=1):
        korean_word = row["korean"]
        entries.append(
            {
                "id": f"{level}-{index:04d}",
                "level": level,
                "korean": korean_word,
                "pronunciation": f"[{pronunciation(korean_word)}]",
                "chineseMeaning": refine_chinese_meaning(level, korean_word, row["meaning_en"], meaning_zh, row["example_en"]),
                "partOfSpeech": choose_part_of_speech(korean_word, reference_entries),
                "exampleKorean": row["example_korean"],
                "exampleChinese": example_chinese if isinstance(example_chinese, str) else example_zh,
                "tags": [level],
                "sourceMeaningEnglish": row["meaning_en"],
                "sourceTranslationEnglish": row["example_en"],
            }
        )

    return entries


def build_all_entries() -> list[dict[str, object]]:
    reference_entries = load_reference_entries()
    entries: list[dict[str, object]] = []
    for level in ("topik1", "topik2"):
        level_entries = build_entries_for_level(level, reference_entries)
        entries.extend(level_entries)
    return entries


def main() -> None:
    entries = build_all_entries()
    OUTPUT_PATH.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(entries)} entries to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
