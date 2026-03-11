import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalDonations: 0, thisMonth: 0 });
  const [chartData, setChartData] = useState([]);

  const nepaliMonths = [
    "जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन",
    "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"
  ];

  const currentYear = new Date().getFullYear().toString();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/donations');
        if (res.data.success) {
          const list = res.data.data;

          const currentMonthNepali = nepaliMonths[new Date().getMonth()];

          let total = 0;
          let monthTotal = 0;

          let chartMap = nepaliMonths.map(m => ({ name: m, amount: 0 }));

          list.forEach(item => {
            const amt = parseFloat(item.amount);
            total += amt;

            // This month calculation
            if (item.year === currentYear && item.month === currentMonthNepali) {
              monthTotal += amt;
            }

            // Chart calculation for current year
            if (item.year === currentYear) {
              const mIndex = nepaliMonths.indexOf(item.month);
              if (mIndex !== -1) {
                chartMap[mIndex].amount += amt;
              }
            }
          });

          setStats({ totalDonations: total, thisMonth: monthTotal });
          setChartData(chartMap);
        }
      } catch (e) {
        console.error("Dashboard error", e);
      }
    };
    loadStats();
  }, [currentYear]);

  return (
    <div style={{ width: '100%', margin: '0' }}>
      <div className="page-header" style={{ justifyContent: 'center', textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ textAlign: 'center', width: '100%', fontSize: '1.5rem' }}>Dashboard Overview</h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        justifyContent: 'center'
      }}>
        <div className="glass-panel text-center" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '0.7rem' }}>Total Tithe Received</h3>
          <p className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.8rem 0' }}>
            Rs. {stats.totalDonations.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="glass-panel text-center" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '0.7rem' }}>This Month ({nepaliMonths[new Date().getMonth()]})</h3>
          <p className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.8rem 0' }}>
            Rs. {stats.thisMonth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ marginTop: '2rem', padding: '2rem' }}>
        <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.1rem' }}>
          Monthly Tithe Bar Chart ({currentYear})
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' }}>
          Monthly collections for the current year.
        </p>
        <div style={{ height: '500px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 60, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
              <XAxis
                dataKey="name"
                type="category"
                stroke="var(--text-secondary)"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-45}
                textAnchor="end"
              />
              <YAxis
                type="number"
                stroke="var(--text-secondary)"
                tickFormatter={(val) => `Rs.${val}`}
                ticks={[
                  0, 10000, 20000, 30000, 40000, 50000,
                  60000, 70000, 80000, 90000, 100000,
                  110000, 120000, 130000, 140000, 150000,
                  160000, 170000, 180000, 190000, 200000
                ]}
                domain={[0, 200000]}
                allowDataOverflow={true}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{
                  backgroundColor: '#1a1f2c',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                itemStyle={{ color: 'var(--success-color)' }}
                formatter={(value) => [`Rs. ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Amount']}
              />
              <Bar
                dataKey="amount"
                fill="var(--success-color)"
                radius={[4, 4, 0, 0]}
                barSize={30}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
