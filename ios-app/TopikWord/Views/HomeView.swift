import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var viewModel = VocabularyListViewModel()

    var body: some View {
        NavigationStack {
            List {
                Section("TOPIK Levels") {
                    ForEach(TopikLevel.allCases) { level in
                        NavigationLink {
                            VocabularyListView(level: level, viewModel: viewModel)
                        } label: {
                            HStack {
                                Text(level.title)
                                Spacer()
                                Text("\(viewModel.words(for: level).count) words")
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }

                Section("Quick Start") {
                    NavigationLink("Flashcards") {
                        FlashcardView(words: viewModel.words(for: appState.selectedLevel))
                    }

                    NavigationLink("Quiz") {
                        QuizPlaceholderView()
                    }
                }
            }
            .navigationTitle("Learn Korean")
        }
    }
}
