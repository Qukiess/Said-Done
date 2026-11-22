import SwiftUI
import SwiftData

@main
struct SaidAndDoneApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
        }
        .modelContainer(for: Entry.self)
    }
}

struct RootView: View {
    var body: some View {
        TabView {
            TodayView()
                .tabItem { Label("Today", systemImage: "pencil") }
            DaysView()
                .tabItem { Label("Timeline", systemImage: "calendar") }
        }
        .tint(Theme.ink)
    }
}
