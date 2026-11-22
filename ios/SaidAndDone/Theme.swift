import SwiftUI

enum Theme {
    static let ground = Color(red: 1.0, green: 0.965, blue: 0.933)      // #FFF6EE
    static let ink = Color(red: 0.180, green: 0.141, blue: 0.200)       // #2E2433
    static let muted = Color(red: 0.420, green: 0.361, blue: 0.400)     // #6B5C66
    static let peach = Color(red: 1.0, green: 0.882, blue: 0.812)       // #FFE1CF
    static let marigold = Color(red: 1.0, green: 0.714, blue: 0.153)    // #FFB627
    static let coral = Color(red: 0.851, green: 0.314, blue: 0.165)     // #D9502A
    static let card = Color.white

    static func rounded(_ size: CGFloat, _ weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .rounded)
    }
}
