// 
// 
// 
// 
// 
// Storage
// 
// 
// 
// 
// 
const store = {
    key: "song",
    get: key => {
        let storageString = localStorage.getItem("storage_" + store.key) ? localStorage.getItem("storage_" + store.key) : "{}"
        let val = ""
        try {
            let json = JSON.parse(storageString)
            val = json[key]
        } 
        catch (error) { 
            console.error(error)
        }
        if (val !== undefined) {
            return val
        }
        else {
            return null
        }
    },
    set: (key, val, cb) => {
        let storageString = localStorage.getItem("storage_" + store.key) ? localStorage.getItem("storage_" + store.key) : "{}"
        try {
            let json = JSON.parse(storageString)
            json[key] = val
            localStorage.setItem("storage_" + store.key, JSON.stringify(json))
        } catch (error) { 
            return false
        }
        if (cb) cb()
        try {
            updateState()
        }
        catch (error) { }
    },
    safety: (key, val) => {
        let res = store.get(key)
        if (!res) {
            store.set(key, val)
        }
    }
}