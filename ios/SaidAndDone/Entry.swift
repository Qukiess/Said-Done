import Foundation
import SwiftData

@Model
final class Entry {
    var text: String
    var createdAt: Date
    var isVoice: Bool

    init(text: String, createdAt: Date = .now, isVoice: Bool = false) {
        self.text = text
        self.createdAt = createdAt
        self.isVoice = isVoice
    }
}
