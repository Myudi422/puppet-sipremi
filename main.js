const express = require('express');
const cors = require('cors');
const { importCookie } = require('./handle');
const http = require("http");

const app = express();
const port = process.env.PORT || 3000; // Gunakan PORT Heroku atau default 3000

let isProcessing = false; // Status untuk melacak apakah ada request yang sedang diproses

app.use(express.json());
app.use(cors());

app.post('/import-cookie', async (req, res) => {
    if (isProcessing) {
        return res.status(429).json({
            status: "error",
            message: "Another request is currently being processed. Please try again later.",
        });
    }

    isProcessing = true; // Tandai bahwa ada request yang sedang diproses
    const { platform } = req.body;

    try {
        const importResult = await importCookie(platform);
        res.json({ status: "success", message: importResult });
    } catch (error) {
        console.error('Error importing cookie:', error);
        res.status(500).json({ status: "error", message: "Error importing cookie." });
    } finally {
        isProcessing = false; // Reset status setelah selesai memproses request
    }
});

// Create HTTP server
const server = http.createServer(app);

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
