from __future__ import annotations

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
INDEX_URL = "https://www.koreantopik.com/2024/05/topik-1-vocabulary-list-1850-for.html"
HEADERS = {"User-Agent": "Mozilla/5.0"}
LEVEL = "topik1"

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
ONSETS = set(CHOSEONG)

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


@dataclass
class Syllable:
    onset: str
    vowel: str
    coda: str


def fetch_html(url: str) -> str:
    response = requests.get(url, timeout=40, headers=HEADERS)
    response.raise_for_status()
    return response.text


def lesson_urls() -> list[str]:
    soup = BeautifulSoup(fetch_html(INDEX_URL), "html5lib")
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
    return deduped[:18]


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


def normalize_korean_word(text: str) -> str:
    text = normalize_whitespace(text)
    return re.sub(r"\s+", "", text)


def normalize_whitespace(text: str) -> str:
    return " ".join(text.replace("\xa0", " ").split())


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
            fallback_parts = translator.translate_batch(batch)
            results.extend(fallback_parts)
        else:
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


def build_entries() -> list[dict[str, object]]:
    urls = lesson_urls()
    if len(urls) != 18:
        raise RuntimeError(f"Expected 18 lesson links, found {len(urls)}")

    rows: list[dict[str, str]] = []
    for url in urls:
        rows.extend(parse_lesson(url))
        time.sleep(0.25)

    translator = GoogleTranslator(source="en", target="zh-TW")
    chinese_meanings = translate_unique([row["meaning_en"] for row in rows], translator)
    example_chinese = translate_unique([row["example_en"] for row in rows], translator)

    entries: list[dict[str, object]] = []
    for index, (row, meaning_zh, example_zh) in enumerate(zip(rows, chinese_meanings, example_chinese), start=1):
        korean_word = row["korean"]
        refined_meaning = refine_chinese_meaning(
            korean_word,
            row["meaning_en"],
            meaning_zh,
            row["example_en"],
        )
        entries.append(
            {
                "id": f"topik1-{index:04d}",
                "level": LEVEL,
                "korean": korean_word,
                "pronunciation": f"[{pronunciation(korean_word)}]",
                "chineseMeaning": refined_meaning,
                "partOfSpeech": "",
                "exampleKorean": row["example_korean"],
                "exampleChinese": example_zh,
                "tags": ["topik1"],
                "sourceMeaningEnglish": row["meaning_en"],
                "sourceTranslationEnglish": row["example_en"],
            }
        )
    return entries


def refine_chinese_meaning(korean: str, meaning_en: str, meaning_zh: str, example_en: str) -> str:
    meaning = meaning_en.lower().strip()
    example = example_en.lower().strip()

    korean_overrides = {
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
        "걸리다": "被掛住",
    }
    if korean in korean_overrides:
        return korean_overrides[korean]

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
    if meaning == "view" or meaning == "scenery , view":
        return "景色"
    if meaning == "match":
        return "比賽"

    return meaning_zh


def main() -> None:
    entries = build_entries()
    OUTPUT_PATH.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(entries)} entries to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
