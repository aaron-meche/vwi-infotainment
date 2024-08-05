

window.addEventListener("DOMContentLoaded", () => {
    processCustomStructs()
    processLiveText()
    updateState()
})

function updateState() {
    buildLiveText()
    buildEachStacks()
    buildCustomStructs()
}


let live_state = []
function processLiveText() {
    document.querySelectorAll(`[live]`).forEach(elem => {
        elem.setAttribute("live_state_index", live_state.length)
        live_state.push({
            elem: elem,
            wrapper: elem.getAttribute("wrapper"),
            outer: elem.outerHTML,
        })
    })
}
function buildLiveText() {
    document.querySelectorAll(`[live]`).forEach(elem => {
        let target = live_state[elem.getAttribute("live_state_index")]
        let outerHTML = target.outer
        let closingBracketIndex = outerHTML.indexOf('>')
        let innerContent = outerHTML.substring(closingBracketIndex + 1)
        let newOpeningTag = `<${decodeHTML(target.wrapper)}>`
        let newElement = `${newOpeningTag}${innerContent}`
        target.elem.outerHTML = evalString(newElement)
    })
}

let each_stacks = []
function buildEachStacks() {
    document.querySelectorAll(`[each]`).forEach(elem => {
        let contents = []
        if (!elem.getAttribute("storage_index")) {
            let obj_html = elem.innerHTML
            let obj = {
                call: elem.getAttribute("call"),
                html: obj_html,
                evals: extractEvalStrings(obj_html)
            }
            elem.setAttribute("storage_index", each_stacks.length)
            elem.style.display = "none"
            each_stacks.push(obj)
        }
        let obj = each_stacks[elem.getAttribute("storage_index")]
        try {
            let call = eval(obj.call)
            let html = obj.html
            for (let i = 0; i < call.length; i++) {
                let itemHTML = html
                let evalCalls = new Set(obj.evals)
                evalCalls.forEach(evalCall => {
                    let call = elem.getAttribute("call")
                    let nick = elem.getAttribute("nick")
                    itemHTML = itemHTML.replaceAll(nick, call + `[${i}]`)
                })
                contents.push(evalString(itemHTML))
            }
        }
        catch (error) {  }
        elem.innerHTML = contents.join("\n")
        elem.style = ""
    })
}

let custom_structs = []
function processCustomStructs() {
    document.querySelectorAll(`[custom_struct]`).forEach(elem => {
        custom_structs.push({
            elem: elem,
            name: elem.getAttribute("ui"),
            inputs: elem.getAttribute("inputs"),
            content: elem.innerHTML,
        })
    })
} 
function buildCustomStructs() {
    document.querySelectorAll(`[custom_struct_call]`).forEach(elem => {
        let struct = custom_structs.find(struct => struct.name == elem.getAttribute("ui"))
        let inputs = struct?.inputs ? struct.inputs.split(",") : []
        let content = struct?.content
        inputs.forEach(input => {
            input = input?.trim()
            content = content.replaceAll(`$${input}`, elem.getAttribute(input))
        })
        elem.innerHTML = content
    })
}

function evalString(string) {
    let res = string
    let layers = 0
    if (res.includes("{")) {
        let callStack = []
        let callCount = res.split("{").length - 1
        for (let i = 0; i < callCount; i ++) {
            let index = res.indexOf("{")
            let evalStr = ""
            for (let j = index + 1; j < res.length; j++) {
                if (res.charAt(j) == "{") {
                    layers++
                }
                else if (res.charAt(j) == "}") {
                    if (layers > 0) {
                        layers--
                        i++
                    }
                    else {
                        break
                    }
                }
                evalStr += res.charAt(j)
            }
            try {
                callStack.push([`+${evalStr}}`, eval(evalStr?.replaceAll("&quot;", '"'))])
                res = res.replace("{","+")
            }
            catch (error) { }
        }
        callStack.forEach(call => {
            res = res.replace(call[0], call[1])
        })
    }
    try {
        res = eval(res)
    }
    catch (error) { }
    return res
}

function extractEvalStrings(string) {
    let res = string
    let strings = []
    let layers = 0
    if (res.includes("{")) {
        let callCount = res.split("{").length - 1
        for (let i = 0; i < callCount; i ++) {
            let index = res.indexOf("{")
            let evalStr = ""
            for (let j = index + 1; j < res.length; j++) {
                if (res.charAt(j) == "{") {
                    layers++
                }
                else if (res.charAt(j) == "}") {
                    if (layers > 0) {
                        layers--
                        i++
                    }
                    else {
                        break
                    }
                }
                evalStr += res.charAt(j)
            }
            strings.push(evalStr)
        }
    }
    return strings
}

// 
// 
// 
// 
// 
// Library
// 
// 
// 
// 
// 
function Icon(icon) {
    return "<i class='fa-solid fa-" + icon + "'></i>"
    // <i class="fa-solid fa-arrow-left"></i>
}

let encodeHTMLElements = [
    ['"', '&dQuote'],
    ["'", "&sQuote"],
    ["(", "&oParen"],
    [")", "&cParen"],
    ["[", "&oBrack"],
    ["]", "&cBrack"],
    ["{", "&oBrace"],
    ["}", "&cBrace"],
    ["<", "&oHTML"],
    [">", "&cHTML"],
]
function encodeHTML(html) {
    encodeHTMLElements.forEach(charArr => {
        html = html?.replaceAll(charArr[0], charArr[1])
    })
    return html
}
function decodeHTML(html) {
    encodeHTMLElements.forEach(charArr => {
        html = html.replaceAll(charArr[1], charArr[0])
    })
    return html
}