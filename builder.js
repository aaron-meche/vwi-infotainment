import fs from 'fs';
import path from 'path';
import { View, getBaseJS, getBaseHeadHTML, getBaseCSS } from './system/compiler.js'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourcePath = path.join(__dirname, "src")
const outputPath = path.join(__dirname, "dist")
const publicPath = path.join(__dirname, "public")

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

copyFiles(publicPath, outputPath);

const viewFiles = findViewFiles(sourcePath);

// console.log('View files found:', viewFiles);

// fs.writeFileSync(path.join(outputDir, 'viewFiles.json'), JSON.stringify(viewFiles, null, 2));

viewFiles.forEach(file => {
    const fileContent = fs.readFileSync(file.fullPath, 'utf-8');
    new View(fileContent, DOM => {
        const head = [getBaseHeadHTML(__dirname), DOM.head].join("\n");
        const style = "<style>" + [getBaseCSS(__dirname), DOM.css].join("\n") + "</style>"
        const script = "<script>" + [getBaseJS(__dirname), DOM.js].join("\n") + "</script>";
        const htmlFileContent = head + DOM.html + style + script
        const htmlFilePath = path.join(outputPath, file.relativePath, "index.html")
        // fs.mkdirSync(htmlFilePath, { recursive: true });
        fs.writeFileSync(htmlFilePath, htmlFileContent, 'utf-8');
    }, __dirname);
})