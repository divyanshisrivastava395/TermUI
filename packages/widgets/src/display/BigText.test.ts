import { describe, expect, it } from "vitest"
import { BigText } from "./BigText.js"
import { Screen } from '@termuijs/core'

describe("BigText", () => {
    it("renders A and B", () => {
        const widget = new BigText("AB")
        const screen = new Screen(20, 5)
        widget.updateRect({ x: 0, y: 0, width: 20, height: 5 })
        widget.render(screen)

        const rows = screen.back.map(row => row.map(c => c.char).join(''))
        // A is " # " -> " █ "
        expect(rows[0]).toContain(' █ ')
        // A's middle is "###" -> "███"
        expect(rows[2]).toContain('███')
        
        // B is "## " -> "██ "
        expect(rows[0]).toContain('██ ')
    })

    it("setText updates text", () => {
        const widget = new BigText("A")
        const screen = new Screen(20, 5)
        widget.updateRect({ x: 0, y: 0, width: 20, height: 5 })
        widget.render(screen)
        
        widget.setText("B")
        widget.render(screen)
        
        const rows = screen.back.map(row => row.map(c => c.char).join(''))
        expect(rows[0]).toContain('██ ')
    })

    it("handles fallback character", () => {
        const widget = new BigText("~")
        const screen = new Screen(20, 5)
        widget.updateRect({ x: 0, y: 0, width: 20, height: 5 })
        widget.render(screen)
        
        const rows = screen.back.map(row => row.map(c => c.char).join(''))
        // Fallback is ['# #', '# #', '# #', '# #', '# #'] -> '█ █'
        expect(rows[0]).toContain('█ █')
    })
})
