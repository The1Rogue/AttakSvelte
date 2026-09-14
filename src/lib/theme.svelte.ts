import { json } from "@sveltejs/kit"


enum BoardStyle {
    Blank = 0,
    DiamondsS = -1,
    DiamondsM = -2,
    DiamondsL = -3,
    GridS = 1,
    GridM = 2,
    GridL = 3
}

type Color = [number, number, number, number]
export function colorString(color: Color) {
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]/255})`
}


type Theme = {
    name: String,

    ui: {
        primary: Color,
        secondary: Color,
        ui: Color,
        accent: Color,
        panel: Color,
        text_light: Color,
        text_dark: Color,
    }

    pieces: {
        border_width: number,
        white: Color,
        white_border: Color,
        black: Color,
        black_border: Color,
        shadow: Color,
    }

    board: {
        style: BoardStyle,
        checker: boolean,
        light: Color,
        dark: Color,
        reserves: Color,

        rings: number,
        ring1: Color,
        ring2: Color,
        ring3: Color,
        ring4: Color,
        ring_opacity: number
    }
}

type Settings = {
    animation_speed: number //ms
    fast_moves: boolean
}


const defaultTheme: Theme = {
    name: "Attak",
    ui: {
        primary: [0x49,0x88,0xb3,0xFF],
        secondary: [0x16,0x17,0x1a,0xFF],
        ui: [0x29,0x2b,0x2f,0xFF],
        accent: [0x20,0x22,0x25,0xFF],
        panel: [0x40,0x44,0x4b,0xcc],
        text_light: [0xfa,0xfa,0xfa,0xFF],
        text_dark: [0x21,0x21,0x21,0xFF],
    },

    pieces: {
        border_width: 2,
        white: [0xd6,0xd6,0xd6,0xFF],
        white_border: [0x36,0x34,0x34,0xFF],
        black: [0x40,0x40,0x40,0xFF],
        black_border: [0x00,0x00,0x00,0xFF],
        shadow: [0x00,0x00,0x00,0x33]
    },

    board: {
        style: BoardStyle.GridS,
        checker: false,
        light: [0x80,0x6e,0x66,0xFF],
        dark: [0x5e,0x51,0x48,0xFF],
        reserves: [0x68,0x59,0x53,0xFF],

        rings: 0,
        ring1: [0x0,0x0,0x0,0x0],
        ring2: [0x0,0x0,0x0,0x0],
        ring3: [0x0,0x0,0x0,0x0],
        ring4: [0x0,0x0,0x0,0x0],
        ring_opacity: 0,
    }
}

const themeNinja: Theme = {
    name: "PTN Ninja",
    ui: {
        primary: [0x8B,0xC3,0x4A,0xFF],
        secondary: [0x60,0x7D,0x8B,0xFF],
        ui: [0x26,0x32,0x38,0xFF],
        accent: [0x20,0x2A,0x2F,0xFF],
        panel: [0x78,0x90,0x9C,0xC0],
        text_light: [0xfa,0xfa,0xfa,0xCD],
        text_dark: [0x21,0x21,0x21,0xCD],
    },

    pieces: {
        border_width: 1,
        white: [0xCF,0xD8,0xDC,0xFF],
        white_border: [0x54,0x6E,0x7A,0xFF],
        black: [0x54,0x6E,0x7A,0xFF],
        black_border: [0x26,0x32,0x38,0xFF],
        shadow: [0x00,0x00,0x00,0x33]
    },

    board: {
        style: BoardStyle.Blank,
        checker: true,
        light: [0x90,0xA4,0xAE,0xFF],
        dark: [0x8A,0x9F,0xAA,0xFF],
        reserves: [0x78,0x90,0x9C,0xFF],

        rings: 0,
        ring1: [0x0,0x0,0x0,0x0],
        ring2: [0x0,0x0,0x0,0x0],
        ring3: [0x0,0x0,0x0,0x0],
        ring4: [0x0,0x0,0x0,0x0],
        ring_opacity: 0,
    }
}

const themeDiscord: Theme = {
    name: "Discord",
    ui: {
        primary: [0xD1,0xA3, 0x62, 0xFF],
        secondary: [0x31, 0x33, 0x38, 0xFF],
        ui: [0x29, 0x2B, 0x2F, 0xFF],
        accent: [0x20, 0x22, 0x25, 0xFF],
        panel: [0x40, 0x44, 0x4b, 0xCC],
        text_light: [0xFA,0xFA,0xFA,0xCD],
        text_dark: [0x21,0x21,0x21,0xCD],

    },
    pieces: {
        border_width: 2,
        white: [0xCB,0xCB,0xCB,0xFF],
        white_border: [0x36,0x34,0x34,0xFF],
        black: [0x40,0x40,0x40,0xFF],
        black_border: [0x00,0x00,0x00,0xFF],
        shadow: [0x00,0x00,0x00,0x33]
    },
    board: {
        style: BoardStyle.GridS,
        checker: false,
        light: [0x65,0x67,0x6B,0xFF],
        dark: [0x5B,0x5E,0x63,0xFF],
        reserves: [0x54,0x57,0x5C,0xFF],

        rings: 0,
        ring1: [0x0,0x0,0x0,0x0],
        ring2: [0x0,0x0,0x0,0x0],
        ring3: [0x0,0x0,0x0,0x0],
        ring4: [0x0,0x0,0x0,0x0],
        ring_opacity: 0,
    }
}

const themePlayTak: Theme = {
    name: "PlayTak",
    ui: {
        primary: [0x35,0x45,0x5e,0xFF],
        secondary: [0x45,0x3A,0x3A,0xFF],
        ui: [0x19,0x1F,0x25,0xFF],
        accent: [0x2F,0x2E,0x2E,0xFF],
        panel: [0x19,0x1F,0x25,0x7F],
        text_light: [0xCC,0xCC,0xCC,0xFF],
        text_dark: [0x00,0x00,0x00,0xFF],

    },
    pieces: {
        border_width: 2,
        white: [0xEB,0xE9,0xD8,0xFF],
        white_border: [0x55,0x57,0x54,0xFF],
        black: [0x05,0x07,0x08,0xFF],
        black_border: [0x74,0x73,0x70,0xFF],
        shadow: [0x00,0x00,0x00,0x33]
    },
    board: {
        style: BoardStyle.GridM,
        checker: false,
        light: [0xEB,0xD3,0xA4,0xFF],
        dark: [0xC3,0x93,0x64,0xFF],
        reserves: [0x33,0x21,0x17,0xFF],

        rings: 0,
        ring1: [0x0,0x0,0x0,0x0],
        ring2: [0x0,0x0,0x0,0x0],
        ring3: [0x0,0x0,0x0,0x0],
        ring4: [0x0,0x0,0x0,0x0],
        ring_opacity: 0,
    }
}

const themeWalnut: Theme = {
    name: "Walnut",
    ui: {
        primary: [0x79,0xA6,0x5D,0xFF],
        secondary: [0x33,0x25,0x25,0xFF],
        ui: [0x5E,0x3A,0x20,0xFF],
        accent: [0x45,0x29,0x15,0xFF],
        panel: [0x87,0x6B,0x55,0x7C],
        text_light: [0xFF,0xFF,0xFF,0xCC],
        text_dark: [0x17,0x17,0x17,0xCC],

    },
    pieces: {
        border_width: 2,
        white: [0xFF,0xFF,0xFF,0xFF],
        white_border: [0x3B,0x3B,0x3B,0xFF],
        black: [0x3D,0x3D,0x3D,0xFF],
        black_border: [0x14,0x14,0x14,0xFF],
        shadow: [0x00,0x00,0x00,0x33]
    },
    board: {
        style: BoardStyle.Blank,
        checker: true,
        light: [0x73,0x4E,0x32,0xFF],
        dark: [0x66,0x45,0x2C,0xFF],
        reserves: [0x48,0x33,0x29,0xFF],

        rings: 0,
        ring1: [0x0,0x0,0x0,0x0],
        ring2: [0x0,0x0,0x0,0x0],
        ring3: [0x0,0x0,0x0,0x0],
        ring4: [0x0,0x0,0x0,0x0],
        ring_opacity: 0,
    }
}


const defaultSettings: Settings = {
    animation_speed: 150,
    fast_moves: false,
}



// const attakClassic = '{"id":"attak-classic","boardStyle":"grid2","boardChecker":false,"rings":0,"vars":{"piece-border-width":1,"rings-opacity":0.25},"colors":{"primary":"#44b383","secondary":"#222a61","ui":"#2a2a2a","accent":"#394d9e","panel":"#0000007F","board1":"#3f50a6","board2":"#949494","board3":"#222a61","player1":"#d4d4d4","player1road":"#d4d4d4","player1flat":"#d4d4d4","player1special":"#d4d4d4","player1border":"#999999","player2":"#2a2a2a","player2road":"#2a2a2a","player2flat":"#555555","player2special":"#555555","player2border":"#2a2a2a","ring1":"#ffffff38","ring2":"#ffffff88","ring3":"#ffffffcc","ring4":"#ffffffff","textLight":"#fafafac0","textDark":"#212121cd","umbra":"#0000007F"},"fromCenter":false,"name":"AttakClassic","board3Dark":true}'
// const walnut_bak = '{"id":"walnut","boardStyle":"blank","boardChecker":true,"vars":{"piece-border-width":2,"rings-opacity":1},"colors":{"primary":"#79a65d","secondary":"#332525","ui":"#5e3a20","accent":"#452915","panel":"#876b55cc","board1":"#734e32","board2":"#66452c","board3":"#734e3257","player1":"#ffffff","player1road":"#ffffff","player1flat":"#ffffff","player1special":"#ffffff","player1border":"#3b3b3b","player2":"#121212","player2road":"#1a1a1a","player2flat":"#3d3d3d","player2special":"#3d3d3d","player2border":"#141414","textLight":"#ffffffcc","textDark":"#171717cc","umbra":"#00000033","bg":"#332525ff","panelOpaque":"#876b55ff","panelOpaqueHover":"#9d8674ff","panelClear":"#876b5500","panelClearHover":"#9d867400","player1clear":"#ffffff00","player2clear":"#12121200","ring1":"#70564c47","ring2":"#694c3687","ring3":"#785f4c57","ring4":"#ffffffff"},"primaryDark":true,"secondaryDark":true,"board1Dark":true,"board2Dark":true,"isDark":true,"accentDark":true,"panelDark":true,"player1Dark":false,"player2Dark":true,"fromCenter":false,"rings":0,"name":"Walnut"}'
export const builtInThemes: Array<Theme> = [defaultTheme, themeNinja, themeDiscord, themePlayTak, themeWalnut]

export let theme: Theme = $state(defaultTheme)
export let settings: Settings = $state(defaultSettings)


let t = localStorage.getItem("theme")
if (t != null) {
    Object.assign(theme, JSON.parse(t))
} else {
    localStorage.setItem("theme", JSON.stringify(theme))
}

t = localStorage.getItem("settings")
if (t != null) {
    Object.assign(settings, JSON.parse(t))
} else {
    localStorage.setItem("settings", JSON.stringify(defaultSettings))
}

