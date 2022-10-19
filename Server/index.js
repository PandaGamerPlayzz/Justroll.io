const http = require("http");

// PORT
const PORT = 5000;

// server create
const server = http.createServer((req, res) => {
   if (req.url === "/" || req.url === "/home") {
      res.write("This is home page.");
      res.end();
   } else {
      res.write("Not Found!");
      res.end();
   }
});

// server listen port
server.listen(PORT);

console.log(`Server is running on PORT: ${PORT}`);