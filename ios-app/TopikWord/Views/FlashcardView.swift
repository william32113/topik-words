import SwiftUI

struct FlashcardView: View {
    @StateObject private var viewModel: FlashcardSessionViewModel

    init(words: [VocabularyEntry]) {
        _viewModel = StateObject(wrappedValue: FlashcardSessionViewModel(words: words))
    }

    var body: some View {
        VStack(spacing: 24) {
            if let word = viewModel.currentWord {
                Spacer()

                VStack(spacing: 16) {
                    Text(word.korean)
                        .font(.system(size: 36, weight: .bold))
                    Text(word.romanization)
                        .foregroundStyle(.secondary)

                    if viewModel.isMeaningRevealed {
                        Text(word.chineseMeaning)
                            .font(.title2)
                    } else {
                        Text("Tap reveal to check the meaning")
                            .foregroundStyle(.secondary)
                    }
                }
                .frame(maxWidth: .infinity, minHeight: 280)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 24))
                .padding(.horizontal)

                if viewModel.isMeaningRevealed {
                    Button("Next Card") {
                        viewModel.moveNext()
                    }
                    .buttonStyle(.borderedProminent)
                } else {
                    Button("Reveal Meaning") {
                        viewModel.revealMeaning()
                    }
                    .buttonStyle(.borderedProminent)
                }

                Spacer()
            } else {
                ContentUnavailableView("No Words", systemImage: "text.book.closed")
            }
        }
        .padding(.vertical)
        .navigationTitle("Flashcards")
    }
}
