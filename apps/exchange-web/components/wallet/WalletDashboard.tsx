'use client';

import { api } from '@/lib/axios';
import axios from 'axios';
import { useEffect, useState } from 'react';
import TradingViewTickerTape from './TradingViewTickerTape';
import TradingViewMarketSummary from './TradingViewMarketSummary';
import { WalletAsset } from '@/lib/types';

export default function WalletDashboard() {
  const [assets, setAssets] = useState<WalletAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWalletAssets = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/api/wallet/getallwallets');
        const data = res.data.data;
        setAssets(data.wallets);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || 'Failed to load wallet assets');
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWalletAssets();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#080810] text-white flex items-center justify-center">Loading wallet...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-[#080810] text-white flex items-center justify-center">Error: {error}</div>;
  }

  const firstAsset = assets[0];

  return (
    <>
      <TradingViewTickerTape
        symbols="BINANCE:BTCUSDT,BINANCE:ETHUSDT,BINANCE:XRPUSDT,BINANCE:DOGEUSDT,BINANCE:BNBUSDT,BINANCE:LINKUSDT,BINANCE:AVAXUSDT"
        hideChart={true}
        itemSize="compact"
        theme="dark"
      />
      <div className="bg-[#080810] text-white px-5 py-5 min-h-screen">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-[70%]">
            <div className="border p-6 rounded-sm border-gray-700 h-full">
              <h1 className="text-lg font-medium">Total Wallet Balance</h1>
              {firstAsset ? (
                <>
                  <h2 className="text-2xl mt-4">{firstAsset.asset}</h2>
                  <h2 className="text-6xl sm:text-7xl md:text-8xl font-bold">${firstAsset.balance.toFixed(3)}</h2>
                </>
              ) : (
                <div className="flex items-center justify-center h-48">
                  <p className="text-gray-400">No wallet assets found.</p>
                </div>
              )}
              <hr className='mt-5 border-gray-700' />

              <h1 className="text-xl font-bold text-gray-400 mt-5">Portfolio</h1>
              <div className="overflow-x-auto mt-5">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="text-slate-400 text-xs">
                      <th className="px-3 py-2 text-left font-medium border-b border-gray-700">
                        Asset
                      </th>
                      <th className="px-3 py-2 text-right font-medium border-b border-gray-700">
                        Wallet Balance
                      </th>
                      <th className="px-3 py-2 text-right font-medium border-b border-gray-700">
                        Price In USDT
                      </th>
                      <th className="px-3 py-2 text-right font-medium border-b border-gray-700">
                        Lock in
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((d, index) => (
                      <tr key={index} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-3 py-4 text-slate-50 font-medium text-left border-b border-gray-700 text-sm">
                          {d.asset}
                        </td>
                        <td className="px-3 py-4 text-slate-50 font-medium text-right border-b border-gray-700 text-sm">
                          {d.balance.toFixed(3)}
                        </td>
                        <td className="px-3 py-4 text-slate-50 font-medium text-right border-b border-gray-700 text-sm">
                          {d.balance.toFixed(3)}
                        </td>
                        <td className="px-3 py-4 text-slate-50 font-medium text-right border-b border-gray-700 text-sm">
                          0
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[30%]">
            <TradingViewMarketSummary
              showTimeRange={true}
              direction="vertical"
              assetsType="crypto"
              itemSize="compact"
              theme="dark"
            />
          </div>
        </div>
      </div>
    </>
  );
}
