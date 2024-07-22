import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import compression from 'compression';
import serveStatic from 'serve-static';
import { View } from './system/compiler.js';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __port = 3000;

const privateKey = fs.readFileSync(path.join(__dirname, 'https/key.pem'), 'utf-8');
const certificate = fs.readFileSync(path.join(__dirname, 'https/cert.pem'), 'utf-8');
const credentials = { key: privateKey, cert: certificate };

const __version = { version: Date.now() };
const __systemCSS = fs.readFileSync(path.join(__dirname, 'system/structures.css'), 'utf-8');
const __stateJS = fs.readFileSync(path.join(__dirname, 'system/state.js'), 'utf-8');
const __storeJS = fs.readFileSync(path.join(__dirname, 'system/store.js'), 'utf-8');
const __liveServerJS = fs.readFileSync(path.join(__dirname, 'system/live.js'), 'utf-8');
const __iosWebApp = `<meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black"><meta name ="viewport" content="initial-scale=1.0, user-scalable=no">`;

const app = express();

app.use(compression());
app.use(serveStatic(path.join(__dirname, 'public')));

app.get('/version', (req, res) => res.json(__version));
app.get('/iosapp', (req, res) => res.send(__iosWebApp + "<iframe src='/' style='height:100vh;width:100vw;position:fixed;top:0;left:0;border:none;outline:none;' /> <style>body{margin:0;}</style>"));

app.get('/', (req, res) => openPage(req, res, path.join(__dirname, 'src/View.vwi')));
app.get('/:filename', (req, res) => processPageCall(req, res));

function processPageCall(req, res) {
    const filename = req.params.filename;
    const routePath = path.join(__dirname, 'src', filename, 'View.vwi');
    openPage(req, res, routePath);
}

function openPage(req, res, routePath) {
    try {
        const fileContent = fs.readFileSync(routePath, 'utf-8');
        new View(fileContent, DOM => {
            const script = "<script>" + DOM.js + "</script><script defer>" + __liveServerJS + __storeJS + __stateJS + "</script>";
            const style = "<style>" + __systemCSS + DOM.css + "</style>";
            const head = script + style + DOM.head;
            res.send(DOM.html + head);
        }, __dirname);
    } catch (error) {
        res.status(404).send('File not found');
    }
}

// Create HTTPS server
const httpsServer = https.createServer(credentials, app);

// Start the HTTPS server
httpsServer.listen(__port, () => {
    console.log('HTTPS Server running on https://localhost:' + __port);
});
