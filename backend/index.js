const express = require('express');
const multer = require('multer');
const cors = require('cors');
const dnssd = require('dnssd');
const { exec } = require('child_process'); // For executing system commands
const path = require('path');
const fs = require('fs'); // For file system operations

const app = express();
app.use(cors());
const upload = multer({ dest: 'uploads/' });

// Discover printers and scanners
let devices = [];
const browser = dnssd.Browser(dnssd.ServiceType.tcp('ipp'));

browser.on('serviceUp', service => {
    devices.push({
        name: service.name,
        address: service.addresses[0],
    });
    console.log(`Found device: ${service.name} at ${service.addresses[0]}`);
});

browser.on('serviceDown', service => {
    devices = devices.filter(device => device.name !== service.name);
    console.log(`Device went offline: ${service.name}`);
});

// Start device discovery
browser.start();

// Execute system command to discover printers (simulate `arp -a`)
const runCommand = (command, callback) => {
    exec(command, (error, stdout, stderr) => {
        if (error || stderr) {
            callback(`Error executing command: ${stderr || error.message}`);
        } else {
            callback(stdout);
        }
    });
};

// API to get available devices and run the discovery command
app.get('/devices', (req, res) => {
    runCommand('arp -a', (output) => {
        if (devices.length === 0) {
            return res.status(404).json({
                message: 'No printers found.',
                commandOutput: output,
            });
        }

        // Return both the devices and the command output
        res.json({
            devices: devices, // Array of devices found
            commandOutput: output // Include the output of the command
        });
    });
});

// API to ping a printer IP and get the result
app.get('/ping/:ip', (req, res) => {
    const printerIP = req.params.ip;

    exec(`ping -c 4 ${printerIP}`, (error, stdout, stderr) => {
        if (error || stderr) {
            res.status(500).json({
                message: 'Error executing ping',
                error: stderr || error.message,
            });
        } else {
            res.json({
                message: `Ping successful for IP: ${printerIP}`,
                output: stdout,
            });
        }
    });
});

// API to upload file for printing by IP address
app.post('/print/ip', upload.single('file'), (req, res) => {
    const printerIP = req.body.ip;
    const file = req.file;

    // Ensure the IP is provided
    if (!printerIP) {
        return res.status(400).send('Printer IP address is required');
    }

    // Check if the file is of a valid type (txt, docx, pdf)
    const fileType = path.extname(file.originalname).toLowerCase();
    if (!['.txt', '.docx', '.pdf'].includes(fileType)) {
        return res.status(400).send('Unsupported file type. Only .txt, .docx, and .pdf are allowed.');
    }

    // Simulate sending the file to the printer (you can add actual printing logic here)
    console.log(`Sending file ${file.filename} to printer with IP: ${printerIP}`);
    
    // Example: save the file temporarily before printing
    fs.renameSync(file.path, `uploads/${file.originalname}`);

    res.send(`File sent to printer at ${printerIP}`);
});

// Start server
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
