import Foundation

final class VocabularyListViewModel: ObservableObject {
    @Published private(set) var allWords: [VocabularyEntry] = []
    @Published var searchText = ""

    private let repository: VocabularyRepository

    init(repository: VocabularyRepository = LocalVocabularyRepository()) {
        self.repository = repository
        self.allWords = repository.loadVocabulary()
    }

    func words(for level: TopikLevel) -> [VocabularyEntry] {
        let levelWords = allWords.filter { $0.level == level }

        guard !searchText.isEmpty else {
            return levelWords
        }

        return levelWords.filter {
            $0.korean.localizedCaseInsensitiveContains(searchText) ||
            $0.chineseMeaning.localizedCaseInsensitiveContains(searchText) ||
            $0.romanization.localizedCaseInsensitiveContains(searchText)
        }
    }
}
