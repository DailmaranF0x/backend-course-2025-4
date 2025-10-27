// server.js
import http from "http";
import fs from "fs/promises";
import { XMLBuilder } from "fast-xml-parser";
import { Command } from "commander";

const program = new Command();

program
  .requiredOption("-i, --input <path>", "path to JSON file for reading")
  .requiredOption("-h, --host <host>", "server host address")
  .requiredOption("-p, --port <port>", "server port number");

program.parse(process.argv);

const { input, host, port } = program.opts();

async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    const lines = data.trim().split("\n").map(JSON.parse);
    return lines;
  } catch (err) {
    console.error("Cannot find input file");
    process.exit(1);
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${host}:${port}`);
    const varietyParam = url.searchParams.get("variety");
    const minPetalLength = parseFloat(url.searchParams.get("min_petal_length"));

    let jsonData = await readJsonFile(input);

    // Фільтрація за petal.length
    if (!isNaN(minPetalLength)) {
      jsonData = jsonData.filter((f) => f["petal.length"] > minPetalLength);
    }

    // Формування об’єктів для XML
    const flowers = jsonData.map((f) => {
      const obj = {
        petal_length: f["petal.length"],
        petal_width: f["petal.width"],
      };
      if (varietyParam === "true") {
        obj.variety = f.variety;
      }
      return obj;
    });

    const xmlBuilder = new XMLBuilder({ format: true });
    const xmlData = xmlBuilder.build({ irises: { flower: flowers } });

    res.writeHead(200, { "Content-Type": "application/xml" });
    res.end(xmlData);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Server error: " + err.message);
  }
});

server.listen(port, host, () => {
  console.log(`✅ Server running at http://${host}:${port}`);
});
