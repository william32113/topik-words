import SwiftUI

struct VocabularyListView: View {
    let level: TopikLevel
    @ObservedObject var viewModel: VocabularyListViewModel

    var body: some View {
        List(viewModel.words(for: level)) { word in
            NavigationLink {
                VocabularyDetailView(word: word)
            } label: {
                VStack(alignment: .leading, spacing: 4) {
                    Text(word.korean)
                        .font(.headline)
                    Text(word.chineseMeaning)
                        .foregroundStyle(.secondary)
                    Text(word.romanization)
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
            }
        }
        .navigationTitle(level.title)
        .searchable(text: $viewModel.searchText, prompt: "Search Korean or Chinese")
    }
}
