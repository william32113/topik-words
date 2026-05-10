import Foundation

protocol VocabularyRepository {
    func loadVocabulary() -> [VocabularyEntry]
}

struct LocalVocabularyRepository: VocabularyRepository {
    func loadVocabulary() -> [VocabularyEntry] {
        guard let url = Bundle.main.url(forResource: "sample_topik_vocab", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let words = try? JSONDecoder().decode([VocabularyEntry].self, from: data) else {
            return []
        }

        return words
    }
}
