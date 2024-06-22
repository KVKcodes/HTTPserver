const net = require("net");

const client = new net.Socket();
client.connect(4221, "127.0.0.1", () => {
  console.log("Connected to server");
  client.write("Hello, server!");
});

client.on("data", (data) => {
  console.log("Received:", data.toString());
  client.destroy(); // Close the connection after receiving the data
});

client.on("close", () => {
  console.log("Connection closed");
});

client.on("error", (err) => {
  console.error("Client error:", err);
});
