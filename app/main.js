const net = require("net");
const fs = require('fs');
const zlib = require('zlib');

console.log("Logs from your program will appear here!");

const acceptedFormats= ["gzip"]

const serverCreator = (socket) => {
    socket.on("data", (data) => {
        const request = data.toString();
        console.log(request);
        const headers = request.split('\r\n');
        console.log("headers", headers);
        if (request.startsWith('GET /')) {
            if(request.startsWith('GET / ')) socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 11\r\n\r\nrawan cutie`);
            else if(request.startsWith('GET /echo')) {
                const regex = /\/echo\/([^\/]*)(?= HTTP)/; //extracts the text after /echo
                const match = request.match(regex);
                if (match !== null) {
                    let accpetEncoding = headers.find(header => header.startsWith('Accept-Encoding: ')); //check if encoding exists
                    if (accpetEncoding) {
                        encoding = accpetEncoding.split('User-Agent: ')[1];
                        encoding = accpetEncoding.split(': ')[1];
                        const str = match[1];
                        for (let i = 0; i < acceptedFormats.length; i++) { //go through all the accepted formats that we can compress and use the first one you find
                            if (encoding.includes(acceptedFormats[i])) {
                                console.log("encoding type", acceptedFormats[i]);
                                const bodyEncoded = zlib.gzipSync(str);
                                const bodyEncodedLength = bodyEncoded.length;
                                response = `HTTP/1.1 200 OK\r\nContent-Encoding: ${acceptedFormats[i]}\r\nContent-Type: text/plain\r\nContent-Length: ${bodyEncodedLength}\r\n\r\n`;
                                socket.write(response);
                                socket.write(bodyEncoded);
                                socket.end();
                                return;
                            }
                        }
                    }
                    const str = match[1]; //reply normally if fails
                    socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${str.length}\r\n\r\n${str}`);
                } 
                else socket.write(`HTTP/1.1 404 Not Found\r\n\r\n`);
            }
            else if(request.startsWith('GET /user-agent')) {
                let userAgent = headers.find(header => header.startsWith('User-Agent: '));
                if (userAgent) {
                    userAgent = userAgent.split('User-Agent: ')[1];
                    console.log(userAgent);
                    socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`);
                } else {
                    socket.write(`HTTP/1.1 404 Not Found\r\n\r\n`);
                }
            }
            else if(request.startsWith('GET /files')) {
                const file_name= request.split(" ")[1].split("files/")[1];
                const directory = process.argv[3];
                const file_path = `${directory}/${file_name}`
                try {
                    const data = fs.readFileSync(file_path, 'utf8');
                    socket.write(`HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${data.length}\r\n\r\n${data}!`);
                } catch (err) {
                    socket.write(`HTTP/1.1 404 Not Found\r\n\r\n`);
                }
            }
            else socket.write(`HTTP/1.1 404 Not Found\r\n\r\n`);
        }
        else if(request.startsWith('POST /')) {
            if(request.startsWith('POST /files')) {
                const file_details= request.split('\r\n');
                const file_name= request.split(' ')[1].split('files/')[1];
                const content= file_details[file_details.length -1];
                const directory = process.argv[3];

                fs.mkdir(directory, { recursive: true }, (err) => {
                    if (err) {
                        return console.error(`Error creating directory: ${err.message}`);
                    }
                    
                    fs.writeFile(`${directory}/${file_name}`, content, (err) => {
                        if (err) {
                            return console.error(`Error writing file: ${err.message}`);
                        }
                        socket.write(`HTTP/1.1 201 Created\r\n\r\n`);
                    });
                });
                
            }
            else socket.write(`HTTP/1.1 404 Not Found\r\n\r\n`);
        }
        else socket.write(`HTTP/1.1 404 Not Found\r\n\r\n`);
    });

    socket.on("close", () => {
        console.log("Client disconnected");
    });
}


const serverip4 = net.createServer(serverCreator);
const serverip6 = net.createServer(serverCreator);

serverip4.listen(4221, "127.0.0.1");
serverip6.listen(4221, "localhost");

const shutdown = () => {
    console.log("Shutting down servers...");
    serverip4.close(() => {
        console.log("IPv4 server closed");
    });
    serverip6.close(() => {
        console.log("IPv6 server closed");
    });
};

// Handle process termination signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);