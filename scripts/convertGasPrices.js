// scripts/convertGasPrices.js

const axios = require('axios');
const apiKey = process.env.COINMARKETCAP_API_KEY; // Replace with your actual API key

async function getCurrencyPrice() {
  try {
    const response = await axios.get(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?CMC_PRO_API_KEY=${apiKey}`
    );
    const usdPrice = response.data.data[0].quote.USD.price; // Assuming the first result is in JPY
    return usdPrice;
  } catch (error) {
    console.error('Error fetching currency price:', error.message);
    process.exit(1);
  }
}

async function main() {
  const usdPrice = await getCurrencyPrice();
  console.log(`Current USD Price: ${usdPrice}`);
}

main();
