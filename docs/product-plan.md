# Product Plan

## Target User

Chinese-speaking learners who want to study Korean vocabulary progressively for the TOPIK exam without feeling overwhelmed.

## Key Screens

### 1. Home

- choose TOPIK level
- see progress
- jump into flashcards or quiz

### 2. Vocabulary List

- filter by level
- search Korean or Chinese meaning
- mark favorite

### 3. Vocabulary Detail

- Korean word
- romanization
- part of speech
- Chinese meaning
- example sentence in Korean
- sentence Chinese translation
- pronunciation button

### 4. Flashcards

- swipe or tap through words
- show meaning after reveal
- rate difficulty

### 5. Quiz

- multiple choice meaning quiz
- short review summary

## Data Structure

Each vocabulary item should include:

- `id`
- `level`
- `korean`
- `romanization`
- `chineseMeaning`
- `partOfSpeech`
- `exampleKorean`
- `exampleChinese`
- `tags`
- `isFavorite`

## MVP Technical Notes

- start with local JSON data
- use `AVSpeechSynthesizer` for pronunciation
- persist favorites locally
- keep UI bright, clean, and large-text friendly

## Content Strategy

- organize vocabulary by `TOPIK 1` to `TOPIK 6`
- begin with 100 to 300 words per level
- later split by topic: food, travel, school, work, emotions

## Monetization Ideas

- free basic levels
- premium advanced levels
- premium mock quizzes
- premium review analytics
