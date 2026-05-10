import SwiftUI

struct QuizPlaceholderView: View {
    var body: some View {
        ContentUnavailableView(
            "Quiz Coming Next",
            systemImage: "checklist",
            description: Text("This screen is reserved for the TOPIK multiple-choice quiz flow.")
        )
        .navigationTitle("Quiz")
    }
}
