






function originalFunc() {
    for (let i = 0; i < callCount; i ++) {
        let index = string.indexOf("{")
        let evalStr = ""
        for (let j = index + 1; j < string.length; j++) {
            if (string.charAt(j) == "{") {
                layers++
            }
            else if (string.charAt(j) == "}") {
                if (layers > 0) {
                    layers--
                    i++
                }
                else {
                    break
                }
            }
            evalStr += string.charAt(j)
        }
        try {
            callStack.push([`+${evalStr}}`, eval(evalStr?.replaceAll("&quot;", '"'))])
            string = string.replace("{","+")
        }
        catch (error) { }
    }
    callStack.forEach(call => {
        string = string.replace(call[0], call[1])
    })
    try {
        string = eval(string)
    }
    catch (error) { }
    return string
}














function updatedFunc(string) {
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