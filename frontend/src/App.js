import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [devices, setDevices] = useState([]);
    const [file, setFile] = useState(null);
    const [commandOutput, setCommandOutput] = useState('');
    const [pingOutput, setPingOutput] = useState(''); // New state for ping output
    const [error, setError] = useState('');
    const [printerIP, setPrinterIP] = useState(''); // New state for IP input

    useEffect(() => {
        // Fetch available devices from the backend
        axios.get('http://localhost:8080/devices')
            .then(response => {
                console.log('Response data:', response.data); // Log response for debugging
                setDevices(response.data.devices);
                setCommandOutput(response.data.commandOutput);

                // Trigger alert if no devices found
                if (response.data.devices.length === 0) {
                    alert('No printers found.');
                }
            })
            .catch(error => {
                console.error('Error fetching devices:', error);
                setError('Error fetching devices');
            });

        // Create falling binary code effect
        const interval = setInterval(() => {
            createFallingBinary();
        }, 200); // Add binary numbers every 200ms

        // Cleanup the interval when the component unmounts
        return () => clearInterval(interval);
    }, []);

    const handlePrint = async () => {
        if (!file || !printerIP) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('ip', printerIP); // Append the IP address

        await axios.post('http://localhost:8080/print/ip', formData)
            .then(() => alert('File sent to printer!'))
            .catch(error => console.error('Error sending file:', error));
    };

    const handlePing = (ip) => {
        axios.get(`http://localhost:8080/ping/${ip}`)
            .then(response => {
                setPingOutput(response.data.output); // Update ping output
            })
            .catch(error => {
                console.error('Error pinging the printer:', error);
                setError('Error pinging the printer');
            });
    };

    const createFallingBinary = () => {
        const binaryDigit = Math.random() < 0.5 ? '0' : '1';
        const binaryElement = document.createElement('div');
        binaryElement.className = 'falling';
        binaryElement.innerText = binaryDigit;
        binaryElement.style.left = `${Math.random() * 100}%`;
        document.body.appendChild(binaryElement);

        // Remove binary element after animation completes
        setTimeout(() => {
            binaryElement.remove();
        }, 10000);
    };

    return (
        <div className="app">
            <div className="header">
                <h1>Printer & Scanner Drop</h1>
            </div>

            <div className="terminal">
                <div className="terminal-header">Terminal</div>
                <div className="terminal-content">
                    <p>Running command: <code>arp -a</code></p>
                    <p>{commandOutput ? commandOutput : 'Waiting for command output...'}</p>
                    <p>Ping Result: <code>ping {printerIP}</code></p>
                    <p>{pingOutput ? pingOutput : 'No ping result yet.'}</p>
                </div>
            </div>

            <div className="ip-input-section">
                <h3>Or Enter Printer IP Address</h3>
                <input
                    type="text"
                    placeholder="Enter Printer IP"
                    value={printerIP}
                    onChange={e => setPrinterIP(e.target.value)}
                    className="ip-input"
                />
                <button onClick={() => handlePing(printerIP)} className="ping-button">
                    Ping Printer
                </button>
            </div>

            <div className="upload-section">
                <input
                    type="file"
                    onChange={e => setFile(e.target.files[0])}
                    className="file-input"
                />
            </div>

            <button
                onClick={handlePrint}
                disabled={!file || !printerIP} // Check only for printerIP and file
                className="print-button"
            >
                Print
            </button>

            {error && <p className="error">{error}</p>}
        </div>
    );
}

export default App;
