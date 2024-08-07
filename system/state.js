

window.addEventListener("DOMContentLoaded", () => {
    processCustomStructs()
    liveState.process()
    updateState()
})

function updateState() {
    liveState.updateAttr()
    liveState.updateText()
    buildEachStacks()
    buildCustomStructs()
}


let live_state = []
const liveState = {
    process: () => {
        document.querySelectorAll(`[live]`).forEach((elem, index) => {
            elem.setAttribute("live_id", index);
            let attributes = [];
            Array.from(elem.attributes).forEach(attr => {
                attributes.push([attr.name, attr.value]);
            });
    
            live_state[index] = {
                wrapper: elem.getAttribute("wrapper"),
                content: elem.getAttribute("content"),
                attributes: attributes
            };
        })
    },
    updateAttr: () => {
        document.querySelectorAll(`[live]`).forEach(elem => {
            let liveId = elem.getAttribute('live_id');
            let target = live_state[liveId];

            let excluded_attr = ["wrapper", "content", "live", "live_id"]
            let rawAttr = target.attributes.filter(attr => !excluded_attr.includes(attr[0]));
            let copyAttr = rawAttr.map(attr => [...attr])
            copyAttr.forEach(attrPair => {
                attrPair[0] = evalString(decodeHTML(attrPair[0]))
                attrPair[1] = evalString(decodeHTML(attrPair[1]))
                elem.setAttribute(attrPair[0], attrPair[1])
            })
        })
    },
    updateText: () => {
        document.querySelectorAll(`[live]`).forEach(elem => {
            let liveId = elem.getAttribute('live_id');
            let target = live_state[liveId];
            
            let rawContent = decodeHTML(target.content)
            if (rawContent.includes("{") || rawContent.includes("}")) {
                elem.innerHTML = evalString(rawContent)
            }
        })
    }
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
    if (string.includes("{") && string.includes("}")) {
        let callCount = string.split("{").length - 1;
        
        for (let i = 0; i < callCount; i++) {
            let openIndex = string.indexOf("{");
            let closeIndex = string.indexOf("}");
            let evalString = string.substring(openIndex + 1, closeIndex);

            try {
                let evaluatedValue = eval(evalString);
                string = string.replace(`{${evalString}}`, evaluatedValue);
            } catch (error) {
            }
        }
    }
    return string;
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
        html = html?.replaceAll(charArr[1], charArr[0])
    })
    return html
}