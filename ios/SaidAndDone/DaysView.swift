import SwiftUI
import SwiftData

struct DaysView: View {
    @Query(sort: \Entry.createdAt, order: .reverse) private var entries: [Entry]

    var body: some View {
        ZStack {
            Theme.ground.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 10) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(entries.count == 1 ? "1 entry so far" : "\(entries.count) entries so far")
                            .font(Theme.rounded(14, .semibold))
                            .foregroundStyle(Theme.muted)
                        Text("Your days")
                            .font(Theme.rounded(34, .heavy))
                            .foregroundStyle(Theme.ink)
                    }
                    .padding(.top, 8)
                    .padding(.bottom, 8)

                    if entries.isEmpty {
                        Text("Your entries will appear here once you save your first one.")
                            .font(Theme.rounded(16))
                            .foregroundStyle(Theme.muted)
                            .padding(22)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Theme.card, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
                    }

                    ForEach(entries) { entry in
                        HStack(alignment: .top, spacing: 14) {
                            VStack(spacing: 0) {
                                Text(entry.createdAt.formatted(.dateTime.day()))
                                    .font(Theme.rounded(18, .heavy))
                                Text(entry.createdAt.formatted(.dateTime.weekday(.abbreviated)))
                                    .font(Theme.rounded(11, .bold))
                            }
                            .foregroundStyle(Theme.ink)
                            .frame(width: 48, height: 52)
                            .background(Theme.peach, in: RoundedRectangle(cornerRadius: 16, style: .continuous))

                            Text(entry.text)
                                .font(Theme.rounded(15))
                                .foregroundStyle(Theme.ink)
                                .lineLimit(3)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .padding(14)
                        .background(Theme.card, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
        }
    }
}
