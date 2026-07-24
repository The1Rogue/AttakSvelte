

enum BoardStyle {
    Blank = 0,
    DiamondsS = -1,
    DiamondsM = -2,
    DiamondsL = -3,
    GridS = 1,
    GridM = 2,
    GridL = 3
}

type Theme = {
    id: string,
    boardStyle: BoardStyle,
    boardChecker: boolean,
    // fromCenter: boolean,
    rings: number,
    ringOpacity: number,
    stoneborder: number,
    // vars?
    colors: {
        primary: string,
        secondary: string,
        ui: string,
        accent: string,
        panel: string

        board1: string,
        board2: string,
        board3: string,

        player1: string,
        player1road: string,
        player1flat: string,
        player1special: string,
        player1border: string,

        player2: string,
        player2road: string,
        player2flat: string,
        player2special: string,
        player2border: string,

        ring1: string,
        ring2: string,
        ring3: string,
        ring4: string,

        textLight: string,
        textDark: string,
        umbra: string,
    }
}

const defaultTheme: Theme = {
    id: "Attak",
    boardStyle: BoardStyle.GridS,
    boardChecker: false,
    rings: 0,
    ringOpacity: 0,
    stoneborder: 2,

    colors: {
        primary: "#4988b3",
        secondary: "#16171a",
        ui: "#292b2f",
        accent: "#202225",
        panel: "#40444bcc",
        
        board1: "#806e66",
        board2: "#5e5148",
        board3: "#685953",

        player1: "#d6d6d6",
        player1road: "#d6d6d6",
        player1flat: "#cbcbcb",
        player1special: "#c1c1c1",
        player1border: "#363434",

        player2: "#080808",
        player2road: "#2d2d2d",
        player2flat: "#404040",
        player2special: "#333333",
        player2border: "#000000",

        ring1: "#0000",
        ring2: "#0000",
        ring3: "#0000",
        ring4: "#0000",
        
        textLight: "#fafafac0",
        textDark: "#212121cd",
        umbra: "#00000033"
    }
}

const attak = '{"id":"attak","boardStyle":"grid1","boardChecker":false,"rings":0,"vars":{"piece-border-width":2,"rings-opacity":0.25},"colors":{"primary":"#4988b3","secondary":"#16171a","ui":"#292b2f","accent":"#202225","panel":"#40444bcc","board1":"#806e66","board2":"#5e5148","board3":"#685953","player1":"#d6d6d6","player1road":"#d6d6d6","player1flat":"#cbcbcb","player1special":"#c1c1c1","player1border":"#363434","player2":"#080808","player2road":"#2d2d2d","player2flat":"#404040","player2special":"#333333","player2border":"#000000","ring1":"#ffffff38","ring2":"#ffffff88","ring3":"#ffffffcc","ring4":"#ffffffff","textLight":"#fafafac0","textDark":"#212121cd","umbra":"#00000033"},"fromCenter":false,"name":"Attak","board3Dark":true}'
const attakClassic = '{"id":"attak-classic","boardStyle":"grid2","boardChecker":false,"rings":0,"vars":{"piece-border-width":1,"rings-opacity":0.25},"colors":{"primary":"#44b383","secondary":"#222a61","ui":"#2a2a2a","accent":"#394d9e","panel":"#0000007F","board1":"#3f50a6","board2":"#949494","board3":"#222a61","player1":"#d4d4d4","player1road":"#d4d4d4","player1flat":"#d4d4d4","player1special":"#d4d4d4","player1border":"#999999","player2":"#2a2a2a","player2road":"#2a2a2a","player2flat":"#555555","player2special":"#555555","player2border":"#2a2a2a","ring1":"#ffffff38","ring2":"#ffffff88","ring3":"#ffffffcc","ring4":"#ffffffff","textLight":"#fafafac0","textDark":"#212121cd","umbra":"#0000007F"},"fromCenter":false,"name":"AttakClassic","board3Dark":true}'

const ptnNinja = '{"id":"PtnNinja","boardStyle":"blank","boardChecker":true,"vars":{"piece-border-width":1,"rings-opacity":0.25},"colors":{"primary":"#8bc34a","secondary":"#607d8b","ui":"#263238","accent":"#202a2f","panel":"#78909cc0","board1":"#90a4ae","board2":"#8a9faa","board3":"#78909c","player1":"#cfd8dc","player1road":"#cfd8dc","player1flat":"#cfd8dc","player1special":"#eceff1","player1border":"#546e7a","player2":"#263238","player2road":"#455a64","player2flat":"#546e7a","player2special":"#455a64","player2border":"#263238","textLight":"#fafafacd","textDark":"#212121cd","umbra":"#00000033","ring1":"#ffffff44","ring2":"#ffffff88","ring3":"#ffffffcc","ring4":"#ffffffff"},"isBuiltIn":true,"fromCenter":false,"rings":0,"name":"PtnNinja","board3Dark":true}'
const discord = '{"id":"Discord","boardStyle":"grid1","boardChecker":false,"rings":0,"vars":{"piece-border-width":2,"rings-opacity":0.25},"colors":{"primary":"#d1a362","secondary":"#313338","ui":"#292b2f","accent":"#202225","panel":"#40444bcc","board1":"#65676b","board2":"#5b5e63","board3":"#54575c","player1":"#d6d6d6","player1road":"#d6d6d6","player1flat":"#cbcbcb","player1special":"#c1c1c1","player1border":"#363434","player2":"#080808","player2road":"#2d2d2d","player2flat":"#404040","player2special":"#333333","player2border":"#000000","ring1":"#ffffff38","ring2":"#ffffff88","ring3":"#ffffffcc","ring4":"#ffffffff","textLight":"#fafafac0","textDark":"#212121cd","umbra":"#00000033"},"isBuiltIn":true,"fromCenter":false,"name":"Discord","board3Dark":true}'

const walnut_bak = '{"id":"walnut","boardStyle":"blank","boardChecker":true,"vars":{"piece-border-width":2,"rings-opacity":1},"colors":{"primary":"#79a65d","secondary":"#332525","ui":"#5e3a20","accent":"#452915","panel":"#876b55cc","board1":"#734e32","board2":"#66452c","board3":"#734e3257","player1":"#ffffff","player1road":"#ffffff","player1flat":"#ffffff","player1special":"#ffffff","player1border":"#3b3b3b","player2":"#121212","player2road":"#1a1a1a","player2flat":"#3d3d3d","player2special":"#3d3d3d","player2border":"#141414","textLight":"#ffffffcc","textDark":"#171717cc","umbra":"#00000033","bg":"#332525ff","panelOpaque":"#876b55ff","panelOpaqueHover":"#9d8674ff","panelClear":"#876b5500","panelClearHover":"#9d867400","player1clear":"#ffffff00","player2clear":"#12121200","ring1":"#70564c47","ring2":"#694c3687","ring3":"#785f4c57","ring4":"#ffffffff"},"primaryDark":true,"secondaryDark":true,"board1Dark":true,"board2Dark":true,"isDark":true,"accentDark":true,"panelDark":true,"player1Dark":false,"player2Dark":true,"fromCenter":false,"rings":0,"name":"Walnut"}'
const walnut = '{"id":"walnut","boardStyle":"blank","boardChecker":true,"vars":{"piece-border-width":2,"rings-opacity":1},"colors":{"primary":"#79a65d","secondary":"#332525","ui":"#5e3a20","accent":"#452915","panel":"#876b557c","board1":"#734e32","board2":"#66452c","board3":"#734e3257","player1":"#ffffff","player1road":"#ffffff","player1flat":"#ffffff","player1special":"#ffffff","player1border":"#3b3b3b","player2":"#121212","player2road":"#1a1a1a","player2flat":"#3d3d3d","player2special":"#3d3d3d","player2border":"#141414","textLight":"#ffffffcc","textDark":"#171717cc","umbra":"#00000033","bg":"#332525ff","panelOpaque":"#876b55ff","panelOpaqueHover":"#9d8674ff","panelClear":"#876b5500","panelClearHover":"#9d867400","player1clear":"#ffffff00","player2clear":"#12121200","ring1":"#70564c47","ring2":"#694c3687","ring3":"#785f4c57","ring4":"#ffffffff"},"primaryDark":true,"secondaryDark":true,"board1Dark":true,"board2Dark":true,"isDark":true,"accentDark":true,"panelDark":true,"player1Dark":false,"player2Dark":true,"fromCenter":false,"rings":0,"name":"Walnut"}'
const playtak = '{"id":"playtak","boardStyle":"grid2","boardChecker":false,"rings":0,"vars":{"piece-border-width":2,"rings-opacity":0.25},"colors":{"primary":"#35455e","secondary":"#453A3A","ui":"#191f25","accent":"#2f2e2e","panel":"#191f257f","board1":"#ebd3a4","board2":"#c39364","board3":"#332117","player1":"#ebe9d8","player1road":"#c1c0b1","player1flat":"#ebe9d8","player1special":"#ebe9d8","player1border":"#555754","player2":"#050708","player2road":"#081016","player2flat":"#050708","player2special":"#050708","player2border":"#747370","ring1":"#ffffff38","ring2":"#ffffff88","ring3":"#ffffffcc","ring4":"#ffffffff","textLight":"#cccccc","textDark":"#000000","umbra":"#00000033"},"fromCenter":false,"name":"Playtak","board3Dark":true}'
export const builtInThemes = [["Attak", attak], ["Attak Classic", attakClassic], ["ptnNinja", ptnNinja], ["Discord", discord], ["PlayTak", playtak], ["Walnut", walnut]]


const boardTypeStrings: Array<string> = ["diamonds3","diamonds2","diamonds1","blank","grid1","grid2","grid3"]
export function applyThemeString(input: string) {
    let obj
    try {
        obj = JSON.parse(input)
    } catch {
        return
    }

    currentTheme.id = obj.name ?? currentTheme.id
    currentTheme.boardStyle = boardTypeStrings.indexOf(obj.boardStyle ?? "blank") - 3
    currentTheme.boardChecker = obj.boardChecker ?? "true"
    currentTheme.rings = obj.rings ?? 0
    if (obj.vars) {
        currentTheme.ringOpacity = (obj.vars["rings-opacity"] ?? 0) * 100;
        currentTheme.stoneborder = obj.vars["piece-border-width"] ?? 1
    }
    if (obj.colors) {
        for (let [name, color] of Object.entries(currentTheme.colors)) {
            currentTheme.colors[name as keyof typeof currentTheme.colors] = obj.colors[name] ?? color
        }
    }
}



// export function reloadTheme() {
//     console.log("reloaded")
//     currentTheme = parseThemeString(localStorage.getItem("theme") ?? '')
// }

export let currentTheme: Theme = $state(defaultTheme)
applyThemeString(localStorage.getItem("theme") ?? "")

export let animationSpeed: {speed: number} = $state({speed: 150})