import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import serveStatic from 'serve-static';
import { View, getBaseJS, getBaseHeadHTML, getBaseCSS } from './compiler.js';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __systemDir = path.dirname(__filename);
const __projectDir = path.join(__systemDir, "..")
const __publicDir = path.join(__projectDir, "public")
const __srcDir = path.join(__projectDir, "src")
const __port = 3000;

// HTTP Config
const privateKey = fs.readFileSync(path.join(__systemDir, 'https/key.pem'), 'utf-8');
const certificate = fs.readFileSync(path.join(__systemDir, 'https/cert.pem'), 'utf-8');
const credentials = { key: privateKey, cert: certificate };

// Version Control (Live Updates)
const __version = { version: Date.now() };

const app = express();

app.use(serveStatic(path.join(__projectDir, 'public')));

app.get('/version', (req, res) => res.json(__version));
app.get('/iosapp', (req, res) => res.send(__iosWebApp + "<iframe src='/' style='height:100vh;width:100vw;position:fixed;top:0;left:0;border:none;outline:none;' /> <style>body{margin:0;}</style>"));

app.get('/', (req, res) => openPage(req, res, path.join(__srcDir, "View.vwi")));

app.get('/:filename', (req, res) => processPageCall(req, res));

function processPageCall(req, res) {
    const filePath = req.params.filename;
    const routePath = path.join(__srcDir, filePath, 'View.vwi');
    openPage(req, res, routePath);
}

function openPage(req, res, routePath) {
    try {
        const fileContent = fs.readFileSync(routePath, 'utf-8');
        new View(fileContent, DOM => {
            res.send(`
                <head>${[getBaseHeadHTML(__systemDir), DOM.head].join("\n")}</head>
                <body>
                    ${DOM.html}
                    <style>${[getBaseCSS(__systemDir), DOM.css].join("\n")}</style>
                    <script>${[getBaseJS(__systemDir, true), DOM.js].join("\n")}</script>
                    ${DOM.endHtml}
                </body>
            `)
        }, __srcDir);
    } catch (error) {
        res.status(404).send('File not found' + getBaseJS(null, true) + "<style>body{background:black;color:white;}</style>");
    }
}

// Create HTTPS server
const httpsServer = https.createServer(credentials, app);

// Start the HTTPS server
httpsServer.listen(__port, () => {
    console.log('HTTPS Server running on https://localhost:' + __port);
});
