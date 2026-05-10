import Foundation

struct VocabularyEntry: Identifiable, Codable, Hashable {
    let id: String
    let level: TopikLevel
    let korean: String
    let romanization: String
    let chineseMeaning: String
    let partOfSpeech: String
    let exampleKorean: String
    let exampleChinese: String
    let tags: [String]
}
