import Foundation

final class AppState: ObservableObject {
    @Published var selectedLevel: TopikLevel = .topik1
    @Published var favorites: Set<String> = []

    func toggleFavorite(for wordID: String) {
        if favorites.contains(wordID) {
            favorites.remove(wordID)
        } else {
            favorites.insert(wordID)
        }
    }

    func isFavorite(_ wordID: String) -> Bool {
        favorites.contains(wordID)
    }
}
