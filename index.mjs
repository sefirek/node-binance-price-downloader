import fs from "fs";
import path from "path";
import { checkMarket, fetchMarketData, getFirstDate } from "./binance.mjs";
(async () => console.log(await getFirstDate()))();
const args = process.argv.slice(2) || [];
if (args.join(" ").includes("help") || args.length < 3) {
  console.log("Format: node index.mjs [market] [interval] [file format]");
  console.log("Terminal example: node index.mjs BTCUSDT 5m csv");
}

if (args.length === 3) {
  const [symbol, interval, fileFormat] = args;
  (async () => {
    const checkSymbol = await checkMarket(symbol);
    if (checkSymbol === false) {
      console.log("Symbol " + symbol + " is incorrect.");
      return;
    }
    const checkInterval = await checkMarket(symbol, interval);
    if (checkInterval === false) {
      console.log("Interval " + interval + " is incorrect.");
      console.log(
        "Available intervals: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d, 3d, 1w, 1M"
      );
      return;
    }
    // const FILE_FORMATS = ["csv", "json"]
    const FILE_FORMATS = ["csv"];
    const ff = fileFormat.toLowerCase();
    if (!FILE_FORMATS.includes(ff.toLocaleLowerCase())) {
      console.log("File format " + fileFormat + " is incorrect.");
      console.log("Available formats: " + FILE_FORMATS.join(", ") + ".");
      return;
    }
    const data = await fetchMarketData(symbol, interval);
    console.log("ok");
    const downloadDirectory = path.join(process.cwd(), "downloads");
    const filePath = path.join(
      downloadDirectory,
      symbol + "_" + interval + "." + ff
    );
    if (!fs.existsSync(downloadDirectory)) {
      fs.mkdirSync(downloadDirectory);
    }
    console.log("Writing to file.");
    if (ff === "json") {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
    if (ff === "csv") {
      const CSV_HEADER =
        "date,open,high,low,close,volume,kline close,quote asset,number of trades,taker buy base,taker buy quote,unused";
      fs.writeFileSync(filePath, CSV_HEADER + "\n");
      const csv = data
        .reduce(
          (prev, curr, index) => {
            console.log((((index + 1) / data.length) * 100).toFixed(4) + "%");
            fs.appendFileSync(filePath, curr.join(",") + "\n");
            return prev;
          },
          [CSV_HEADER]
        )
        .join("\n");
      console.log("Done");
    }
  })();
}
