interface CoinbaseResponse {
  data: {
    amount: string;
    base: string;
    currency: string;
  };
}

export async function getLatestPrice(symbol: string): Promise<number> {
  try {
    const pair = symbol.toUpperCase().replace(/(USDT|USD)$/, "") + "-USDT";

    const response = await fetch(
      `https://api.coinbase.com/v2/prices/${pair}/spot`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error status: ${response.status}`);
    }

    const { data } = (await response.json()) as CoinbaseResponse;
    console.log(parseFloat(data.amount));
    return parseFloat(data.amount);
  } catch (error) {
    throw new Error(
      `Failed to fetch latest price: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}