import SwiftUI

struct VocabularyDetailView: View {
    let word: VocabularyEntry
    private let speechService = SpeechService()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(word.korean)
                        .font(.system(size: 34, weight: .bold))
                    Text(word.romanization)
                        .foregroundStyle(.secondary)
                    Text(word.chineseMeaning)
                        .font(.title3)
                    Text(word.partOfSpeech)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Button("Play Pronunciation") {
                    speechService.speak(word.korean)
                }
                .buttonStyle(.borderedProminent)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Example Sentence")
                        .font(.headline)
                    Text(word.exampleKorean)
                    Text(word.exampleChinese)
                        .foregroundStyle(.secondary)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Tags")
                        .font(.headline)
                    Text(word.tags.joined(separator: ", "))
                        .foregroundStyle(.secondary)
                }
            }
            .padding()
        }
        .navigationTitle(word.korean)
        .navigationBarTitleDisplayMode(.inline)
    }
}
