import Foundation

enum TopikLevel: String, CaseIterable, Codable, Identifiable {
    case topik1
    case topik2
    case topik3
    case topik4
    case topik5
    case topik6

    var id: String { rawValue }

    var title: String {
        switch self {
        case .topik1: return "TOPIK 1"
        case .topik2: return "TOPIK 2"
        case .topik3: return "TOPIK 3"
        case .topik4: return "TOPIK 4"
        case .topik5: return "TOPIK 5"
        case .topik6: return "TOPIK 6"
        }
    }
}
