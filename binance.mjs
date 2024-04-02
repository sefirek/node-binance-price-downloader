import axios from "axios";

export async function fetchMarketData(market = "BTCUSDT", tickInterval = "1h", log = false, firstDate = null) {
  let date = new Date();
  const NUMBER_OF_PARALLEL_REQUESTS = 100;
  const startDate = firstDate || await getFirstDate(market);
  const times = [];
  do {
    let endTime = date.getTime();
    switch (tickInterval) {
      case "1m": {
        date.setMinutes(date.getMinutes() - 1000);
        break;
      }
      case "3m": {
        date.setMinutes(date.getMinutes() - 3 * 1000);
        break;
      }
      case "5m": {
        date.setMinutes(date.getMinutes() - 5 * 1000);
        break;
      }
      case "15m": {
        date.setMinutes(date.getMinutes() - 15 * 1000);
        break;
      }
      case "30m": {
        date.setMinutes(date.getMinutes() - 30 * 1000);
        break;
      }
      case "1h": {
        date.setHours(date.getHours() - 1000);
        break;
      }
      case "2h": {
        date.setHours(date.getHours() - 2 * 1000);
        break;
      }
      case "4h": {
        date.setHours(date.getHours() - 4 * 1000);
        break;
      }
      case "6h": {
        date.setHours(date.getHours() - 6 * 1000);
        break;
      }
      case "12h": {
        date.setHours(date.getHours() - 12 * 1000);
        break;
      }
      case "1d": {
        date.setDate(date.getDate() - 1000);
        break;
      }
      case "3d": {
        date.setDate(date.getDate() - 3 * 1000);
        break;
      }
      case "1w": {
        date.setDate(date.getDate() - 7 * 1000);
        break;
      }
      case "1M": {
        date.setMonth(date.getMonth() - 1000);
        break;
      }
      default:
        break;
    }

    let startTime = date.getTime();
    if (startTime < startDate.getTime()) {
      times.push({ startTime: startDate.getTime(), endTime });
      break;
    }
    times.push({ startTime, endTime });
  } while (true);
  times.reverse();
  const promises = times.map(({ startTime, endTime }) => {
    return () =>
      new Promise(async (res, rej) => {
        const url =
          "https://api.binance.com/api/v3/klines?symbol=" +
          market +
          "&interval=" +
          tickInterval +
          "&startTime=" +
          startTime +
          "&endTime=" +
          endTime +
          "&limit=" +
          1000;
        try {
          const response = await axios.get(url);
          res(response.data);
        } catch (e) {
          rej(false);
        }
      });
  });

  const parallelRequestTable = [];
  for (
    let i = 0;
    i < Math.ceil(promises.length / NUMBER_OF_PARALLEL_REQUESTS);
    i += 1
  ) {
    parallelRequestTable.push(
      promises.slice(
        i * NUMBER_OF_PARALLEL_REQUESTS,
        (i + 1) * NUMBER_OF_PARALLEL_REQUESTS
      )
    );
  }
  const downloadedData = [];
  const PARALLEL_REQUEST_LENGTH = parallelRequestTable.length;
  let i = 0;
  do {
    try {
      for await (const parallelRequest of parallelRequestTable) {
        try {
          log && process.stdout.write(
            "\r" + ((i / PARALLEL_REQUEST_LENGTH) * 100).toFixed(2) + "%"
          );
          const responses = await Promise.all(
            parallelRequest.map((gen) => gen())
          );
          const response = responses.flat();
          downloadedData.push(response);
          i += 1;
          parallelRequestTable.shift();
        } catch (e) {
          throw e;
        }
      }
    } catch (e) { }
  } while (parallelRequestTable.length > 0);
  log && process.stdout.write("\n");
  return downloadedData.flat().sort(([dateA], [dateB]) => dateA - dateB);;
}

export async function getFirstDate(market = "BTCUSDT") {
  const startDate = new Date(2010, 0, 1);
  try {
    const url =
      "https://api.binance.com/api/v3/klines?symbol=" +
      market +
      "&interval=" +
      "1M" +
      "&startTime=" +
      startDate.getTime() +
      "&endTime=" +
      Date.now() +
      "&limit=" +
      1000;
    const response = await axios.get(url);
    return new Date(response.data[0][0]);
  } catch (e) {
    return startDate;
  }
}

export async function checkMarket(market = "BTCUSDT", tickInterval = "5m") {
  const url =
    "https://api.binance.com/api/v3/klines?symbol=" +
    market +
    "&interval=" +
    tickInterval +
    "&limit=" +
    1;
  try {
    await axios.get(url);
    return true;
  } catch (e) {
    return false;
  }
}
