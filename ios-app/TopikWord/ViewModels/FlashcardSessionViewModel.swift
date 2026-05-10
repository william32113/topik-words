import Foundation

final class FlashcardSessionViewModel: ObservableObject {
    @Published private(set) var words: [VocabularyEntry]
    @Published private(set) var currentIndex = 0
    @Published var isMeaningRevealed = false

    init(words: [VocabularyEntry]) {
        self.words = words.shuffled()
    }

    var currentWord: VocabularyEntry? {
        guard words.indices.contains(currentIndex) else { return nil }
        return words[currentIndex]
    }

    func revealMeaning() {
        isMeaningRevealed = true
    }

    func moveNext() {
        guard currentIndex + 1 < words.count else { return }
        currentIndex += 1
        isMeaningRevealed = false
    }
}
