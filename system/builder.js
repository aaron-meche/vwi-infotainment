import fs from 'fs';
import path from 'path';
import { View, getBaseJS, getBaseHeadHTML, getBaseCSS } from './compiler.js'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __systemDir = path.dirname(__filename);
const __projectDir = path.join(__systemDir, "..")
const __publicDir = path.join(__projectDir, "public")
const __srcDir = path.join(__projectDir, "src")

const __outputDir = path.join(__projectDir, "docs")

// Copies files from srcDir to destDir
function copyFiles(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyFiles(srcPath, destPath)
        }
        else {
            fs.copyFileSync(srcPath, destPath)
        }
    }
}

// Finds View.vwi files and pushes to viewFiles
function findViewFiles(dir, basePath = "/") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const viewFiles = [];

    entries.forEach(entry => {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            viewFiles.push(...findViewFiles(fullPath, basePath));
        } 
        else if (entry.name === 'View.vwi') {
            viewFiles.push({ fullPath: fullPath, relativePath: basePath });
        }
    })

    return viewFiles;
}


console.log("(*   ) Copying public files")

copyFiles(__publicDir, __outputDir);
const viewFiles = findViewFiles(__srcDir);

console.log(`(**  ) Compiling ${viewFiles.length} view file${viewFiles.length > 1 ? "s" : ""}`)

viewFiles.forEach(file => {
    const fileContent = fs.readFileSync(file.fullPath, 'utf-8');
    new View(fileContent, DOM => {
        const head = [getBaseHeadHTML(__systemDir), DOM.head].join("\n");
        const style = "<style>" + [getBaseCSS(__systemDir), DOM.css].join("\n") + "</style>"
        const script = "<script>" + [getBaseJS(__systemDir), DOM.js].join("\n") + "</script>";
        const htmlFileContent = head + DOM.html + style + script + DOM.endHtml
        const htmlFilePath = path.join(__outputDir, file.relativePath, "index.html")
        fs.mkdirSync(file.relativePath, { recursive: true });
        fs.writeFileSync(htmlFilePath, htmlFileContent, 'utf-8');
    }, __srcDir);
})

console.log("(*** ) Finished compiling")
console.log("(****) Build complete! \n")