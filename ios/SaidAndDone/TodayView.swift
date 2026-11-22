import SwiftUI
import SwiftData

struct TodayView: View {
    @Environment(\.modelContext) private var context
    @State private var draft = ""
    @State private var justSaved = false
    @FocusState private var writing: Bool

    private var greeting: String {
        switch Calendar.current.component(.hour, from: .now) {
        case 5..<12: return "Good morning"
        case 12..<18: return "Good afternoon"
        default: return "Good evening"
        }
    }

    private var canSave: Bool {
        !draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Theme.ground.ignoresSafeArea()
            Circle()
                .fill(Theme.peach)
                .frame(width: 230, height: 230)
                .offset(x: 70, y: -110)
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(Date.now.formatted(.dateTime.weekday(.wide).day().month(.wide)))
                        .font(Theme.rounded(14, .semibold))
                        .foregroundStyle(Theme.muted)
                    Text(greeting)
                        .font(Theme.rounded(34, .heavy))
                        .foregroundStyle(Theme.ink)
                }
                .padding(.top, 8)

                VStack(alignment: .leading, spacing: 10) {
                    Text("What's on your mind?")
                        .font(Theme.rounded(18, .bold))
                        .foregroundStyle(Theme.ink)
                    TextEditor(text: $draft)
                        .font(Theme.rounded(18))
                        .foregroundStyle(Theme.ink)
                        .scrollContentBackground(.hidden)
                        .focused($writing)
                        .overlay(alignment: .topLeading) {
                            if draft.isEmpty {
                                Text("Write as much or as little as you like")
                                    .font(Theme.rounded(18))
                                    .foregroundStyle(Theme.muted)
                                    .padding(.top, 8)
                                    .padding(.leading, 5)
                                    .allowsHitTesting(false)
                            }
                        }
                }
                .padding(22)
                .background(Theme.card, in: RoundedRectangle(cornerRadius: 28, style: .continuous))
                .shadow(color: .black.opacity(0.06), radius: 12, y: 4)

                Button(action: save) {
                    Text(justSaved ? "Saved" : "Save entry")
                        .font(Theme.rounded(17, .heavy))
                        .foregroundStyle(Theme.ink)
                        .frame(maxWidth: .infinity, minHeight: 58)
                        .background(Theme.marigold, in: Capsule())
                }
                .disabled(!canSave)
                .opacity(canSave || justSaved ? 1 : 0.5)

                Label("Only you can read this", systemImage: "lock.fill")
                    .font(Theme.rounded(13, .semibold))
                    .foregroundStyle(Theme.muted)
                    .frame(maxWidth: .infinity)
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 12)
        }
    }

    private func save() {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        context.insert(Entry(text: text))
        draft = ""
        writing = false
        justSaved = true
        Task {
            try? await Task.sleep(for: .seconds(1.5))
            justSaved = false
        }
    }
}
