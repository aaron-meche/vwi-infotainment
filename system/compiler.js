
import path from 'path'
import fs from 'fs'

export function getBaseJS(__dirname, liveBool) {
    let jsArr = [
        fs.readFileSync(path.join(__dirname, 'system/state.js'), 'utf-8'),
        fs.readFileSync(path.join(__dirname, 'system/store.js'), 'utf-8'),
    ];
    if (liveBool) {
        jsArr.push(fs.readFileSync(path.join(__dirname, 'system/live.js'), 'utf-8'));
    }
    return jsArr.join("\n");
}

export function getBaseHeadHTML(__dirname) {
    let htmlArr = [
        fs.readFileSync(path.join(__dirname, 'system/meta.html'), 'utf-8'),
    ];
    return htmlArr.join("\n");
}

export function getBaseCSS(__dirname) {
    let cssArr = [
        fs.readFileSync(path.join(__dirname, 'system/structures.css'), 'utf-8'),
    ];
    return cssArr.join("\n");
}

// Main compiler class
export class View {
    filePath = "" // main file path for file
    directory = null // directory for FS reading
    raw = "" // raw and unprocessed string of code
    rawLineSplit = [] // array of code split by line
    rawLineIndex = 0 // current position within rawLineSplit
    rawLineOffset = 0 // necessary because of closes
    customStructs = {} // defined structure library
    jsImports = [] // array of .js import calls
    cssImports = [] // array of .js import calls
    head = [] // Main HTML Head
    html = [] // Main HTML Body
    js = [] // Main JS Store
    css = [] // Main CSS Store

    // Takes in file content
    constructor(txt, callback, directory) {
        this.raw = txt
        this.directory = directory
        this.compile(DOM => {
            if (callback) callback(DOM)
        })
    }

    // Splits raw code and processes each line
    compile(callback) {
        this.rawLineSplit = this.raw.split("\n")

        for (let i = 0; i < this.rawLineSplit.length + this.rawLineOffset; i++) {
            let line = this.rawLineSplit[this.rawLineIndex]
            if (line == undefined) break
            this.processLine(line)
            this.rawLineIndex++
        }

        callback({
            head: this.head.join("\n"), 
            html: this.html.join("\n"), 
            js: this.js.join("\n"),
            css: this.css.join("\n"), 
        })
    }

    // Processes and understands 1 line at a time
    processLine(line) {
        line = line.toString()?.trim()
        let lineSplit = line?.split(" ")
        let firstKey = lineSplit[0]?.trim()
        let secondKey = lineSplit[1]?.trim()
        let thirdKey = lineSplit[2]?.trim()

        // Custom Javascript
        if (firstKey == "{") {
            let contents = []
            let ignoreLineCount = 0
            for (let i = this.rawLineIndex + 1; i < this.rawLineSplit.length; i++) {
                ignoreLineCount++
                let line = this.rawLineSplit[i]?.trim()
                if (line == "}" && this.rawLineSplit[i]?.match(/^\s*/)[0].length == 0) {
                    break
                }
                contents.push(line)
            }
            this.js.push(contents.join("\n"))
            this.rawLineIndex += ignoreLineCount
        }
        // Call Structure
        else if (/^[A-Z]/.test(firstKey)) {
            if (Object.keys(this.structures).includes(firstKey.replace(":", ""))) {
                this.structures[firstKey.replace(":", "")](line)
            }
            else {
                this.structures?.["Custom Structure"](line)
            }
        }
        // Declare Structure
        else if (firstKey == "[]") {
            this.structures?.["Declare Structure"](line)
        }
        // Define Style Class
        else if (firstKey[0] == ".") {
            this.css.push(`${line?.trim()} { ${this.gatherAttributes()} }`)
        }
        // Close Div
        else if (firstKey == "/div") {
            this.html.push("</div>")
        }
        // Close Div
        else if (firstKey == "/span") {
            this.html.push("</span>")
        }
        // Close CSS
        else if (firstKey == "/css") {
            this.css.push("}")
        }
        // Custom HTML
        else if (firstKey == ">>>") {
            this.html.push(line.split(">>>")[1])
        }
        // Span
        else if (firstKey.includes('"') || firstKey.includes("'")) {
            this.structures?.["Span"](line)
        }
    }

    // Collects all proceeding attributes for structs
    gatherAttributes(rawReponseBool) {
        let attrStr = ""
        let styleVal = ""
        let callAlt = this.rawLineSplit[this.rawLineIndex]?.match(/^\s*/)[0].length
        let attrAlt = this.rawLineSplit[this.rawLineIndex + 1]?.match(/^\s*/)[0].length
        for (let i = this.rawLineIndex + 1; i < this.rawLineSplit.length; i++) {
            let currAlr = this.rawLineSplit[i]?.match(/^\s*/)[0].length
            let line = this.rawLineSplit[i].trim()
            let key = line.split(":")[0]?.trim()
            let value = line.substring(line.indexOf(":") + 1)?.split("*")[0]?.trim()
            if (this.rawLineSplit[i]?.replaceAll(" ", "").length == 0) continue
            if (this.rawLineSplit[i]?.trim().charAt(0) == "/") {
                continue
            }
            else if (this.rawLineSplit[i].trim().charAt(0) == "@") {
                if (line.includes(":")) {
                    attrStr +=  key.replace("@", "") + "="
                    attrStr += "'" + value + "' "
                }
                else {
                    attrStr += key.replace("@", "") + " "
                }
            }
            else if (currAlr < attrAlt || !(/^[a-z]/.test(this.rawLineSplit[i].trim().charAt(0)))) {
                break
            }
            else {
                key = attributes.translate(key)
                styleVal += `${key}:${value.replaceAll("[", "var(--").replaceAll("]", ")")};`
            }
        }
    
        if (rawReponseBool) {
            return attrStr + (styleVal.length > 0 ? `style="${styleVal}"` : "")
        }
        else {
            return styleVal
        }
    }
    
    // Sends a close call for a wrapper structure
    sendClose(code) {
        let startAlr = this.rawLineSplit[this.rawLineIndex].match(/^\s*/)[0].length
        let insertIndex = this.rawLineSplit.length
        for (let i = this.rawLineIndex + 1; i < this.rawLineSplit.length; i++) {
            let currAlr = this.rawLineSplit[i].match(/^\s*/)[0].length
            if (currAlr <= startAlr && this.rawLineSplit[i].replaceAll(" ", "").length > 0) {
                insertIndex = i
                break
            } 
        }
        this.rawLineSplit.splice(insertIndex, 0, code)
        this.rawLineOffset += 1
    }

    // Structure Library
    structures = {
        build: {
            struct: (name, text, attr, type, bypassLiveState)  => {
                if (bypassLiveState) {
                    this.html.push(`<${type ? type : "div"} ${this.gatherAttributes(true)} ${attr ? attr : ""} ui="${name?.trim()}">`)
                    this.html.push(text ? text : "")
                }
                else {
                    this.html.push(liveStateCheck(
                        `${type ? type : "div"} ${this.gatherAttributes(true)} ${attr ? attr : ""} ui="${name?.trim()}"`,
                        text ? text : ""
                    ))
                }
                this.sendClose("/div")
            },
            eachStack: (name)  => {
                let line = this.rawLineSplit[this.rawLineIndex]
                let valWorlSplit = line.split(":")[1].trim().split(" ")
                this.html.push(liveStateCheck(
                    `div ${this.gatherAttributes(true)} ui="${name}" each call="${valWorlSplit[0]}" nick="${valWorlSplit[2]}"`,
                    null
                ))
                this.sendClose("/div")
            },
            text: (name, text, attr, type)  => {
                let line = this.rawLineSplit[this.rawLineIndex]
                let content = text ? text : line.substring(line.indexOf(":") + 1)?.split("*")[0]?.trim()
                this.html.push(liveStateCheck(
                    `${type ? type : "div"} ${attr ? attr : this.gatherAttributes(true)} ui="${name}"`,
                    content
                ))
                this.html.push(`</${type ? type : "div"}>`)
            },
        },
        // Declare Structure
        "Declare Structure": line => {
            let structName = line?.split("]")[1]?.trim()?.split(":")[0]
            let structInputs = line?.split(":")[1]?.trim()
            this.structures.build.struct(structName, null, `custom_struct inputs="${structInputs}"`)
            this.customStructs[structName] = {
                inputs: structInputs
            }
        },
        // Call Custom Structure
        "Custom Structure": line => { this.structures.build.struct(line?.trim(), null, "custom_struct_call") },
        // General Stacks
        "VStack": line => { this.structures.build.struct("v-stack") },
        "HStack": line => { this.structures.build.struct("h-stack") },
        // Push Stacks
        "VPushStack": line => { this.structures.build.struct("v-push-stack") },
        "HPushStack": line => { this.structures.build.struct("h-push-stack") },
        // Pull Stacks
        "VPullStack": line => { this.structures.build.struct("v-pull-stack") },
        "HPullStack": line => { this.structures.build.struct("h-pull-stack") },
        // Each Stacks
        "GridEachStack": line => { this.structures.build.eachStack("grid") },
        "VEachStack": line => { this.structures.build.eachStack("v-stack") },
        "HEachStack": line => { this.structures.build.eachStack("h-stack") },
        // Other Views
        "View": line => { this.structures.build.struct("view") },
        "Grid": line => { this.structures.build.struct("grid") },
        // Imports
        "Import": line => {
            let filename = line?.split(":")[1]?.trim()
            let filecontent = fs.readFileSync(path.join(this.directory, `src/${filename}.vwi`), 'utf-8')
            new View(filecontent, resDOM => {
                this.structures.build.struct("Import", resDOM.html, null, null, true)
                this.head.push(resDOM.head)
                this.js.push(resDOM.js)
                this.css.push(resDOM.css)
            }, this.directory)
        },
        "ImportJS": line => {
            let val = line.split(":")[1].trim()
            this.head.push(`<script ${this.gatherAttributes(true)} src="${val}.js"></script>`)
        },
        "ImportJSURL": line => {
            let val = line.split(":")[1].trim()
            this.head.push(`<script ${this.gatherAttributes(true)} src="https://${val}"></script>`)
        },
        "ImportCSS": line => {
            let val = line.split(":")[1].trim()
            this.head.push(`<link rel="stylesheet" href="${val}.css">`)
        },
        "ImportCSSURL": line => {
            let val = line.split(":")[1].trim()
            this.head.push(`<link ref="stylesheet" ${this.gatherAttributes(true)} href="https://${val}">`)
        },
        "ImportFA": line => {
            this.head.push(`<script src="https://kit.fontawesome.com/5cf062dc93.js"></script>`)
        },
        // General HTML Elements
        "Image": line => {
            this.html.push(`<img ${this.gatherAttributes(true)} src='./static/${evalString(line.split(":")[1].trim())}'>`)
        },
        // Blocks
        "Block": line => { this.structures.build.struct("block") },
        "Wrapper": line => { this.structures.build.struct("block") },
        "Div": line => { this.structures.build.struct("block") },
        "Element": line => { this.structures.build.struct("block") },
        // Text
        "Text": line => { this.structures.build.text("text") },
        "TextStack": line => { this.structures.build.span("text-stack") },
        "Link": line => { this.structures.build.text("text", null, null, "a") },
        "Button": line => { this.structures.build.struct("button", null ,null ,"button") },
        "Span": line => { this.structures.build.text("span", null, null, "span") },
        // Other HTML Elements
        "Audio": line => { this.structures.build.struct("audio", null, null, "audio") },
        "PageTitle": line => {
            const title = line.split(":")[1]?.trim();
            this.head.push(`
                <title>${title}</title>
                <meta name="apple-mobile-web-app-title" content="${title}">
                <meta name="application-name" content="${title}">
            `)
        },
        "PageIcon": line => { 
            let iconPath = line.split(":")[1]?.trim()
            this.head.push(`
                <link rel="apple-touch-icon" sizes="180x180" href="${iconPath}">
                <link rel="icon" type="image/png" sizes="32x32" href="${iconPath}">
                <link rel="icon" type="image/png" sizes="16x16" href="${iconPath}">
            `);
        },
        // Text Style
        "Title": line => { this.structures.build.text("title") },
        "Subtitle": line => { this.structures.build.text("subtitle") },
        // Code Displays
        "Code": line => { this.structures.build.text("code") },
        "CodeStack": line => { this.structures.build.struct("code-stack") },
    }
}

// Convert string of text to evaluated text
function evalString(string) {
    let res = string
    if (res.includes("{")) {
        let callStack = []
        let callCount = res.split("{").length - 1
        for (let i = 0; i < callCount; i ++) {
            let index = res.indexOf("{")
            let evalStr = ""
            for (let j = index + 1; j < res.length; j++) {
                if (res.charAt(j) == "}") {
                    break
                }
                else {
                    evalStr += res.charAt(j)
                }
            }
            try {
                callStack.push([`+${evalStr}}`, eval(evalStr)])
                res = res.replace("{","+")
            }
            catch (error) { }
            callStack.forEach(call => {
                res = res.replace(call[0], call[1])
            })
        }
    }
    try {
        res = eval(res)
    }
    catch (error) { }
    return res
}

// Shorthand Attribute Dictionary
const attributes = {
    dictionary: {
        "align": "text-align",
        "size": "font-size",
        "weight": "font-weight",
        "spacing": "letter-spacing",
        "grid-row": "grid-template-rows",
        "grid-row-span": "grid-row",
        "grid-column": "grid-template-columns",
        "grid-column-span": "grid-column",
        "ratio": "aspect-ratio",
    },
    translate: (key) => {
        if (Object.keys(attributes.dictionary).includes(key)) {
            return attributes.dictionary[key]
        }
        else {
            return key
        }
    }
}

function liveStateCheck(open, inside) {
    open = open ? open : "div"
    inside = inside ? inside : ""
    let fullStr = `${open} ${inside}`
    if (fullStr.split("").includes("{") && fullStr.split("").includes("}")) {
        open += " live='true' "
    }

    return `<${open}>${inside}`
}

let encodeHTMLElements = [
    ['"', '&doubleQuote'],
    ["'", "&singleQuote"],
    ["(", "&openParenthesis"],
    [")", "&closeParenthesis"],
    ["[", "&openBracket"],
    ["]", "&closeBracket"],
    ["{", "&openBrace"],
    ["}", "&closeBrace"],
    ["<", "&openHTML"],
    [">", "&closeHTML"],
]
function encodeHTML(html) {
    encodeHTMLElements.forEach(charArr => {
        html = html.replaceAll(charArr[0], charArr[1])
    })
    return html
}
function decodeHTML(html) {
    encodeHTMLElements.forEach(charArr => {
        html = html.replaceAll(charArr[1], charArr[0])
    })
    return html
}