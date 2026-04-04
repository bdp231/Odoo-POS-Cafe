import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Download, FileSpreadsheet, Filter } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate, formatTime, getTimeAgo } from '../../data/seedData';
import AnimatedCounter from '../../components/ui/AnimatedCounter';
import StatusBadge from '../../components/shared/StatusBadge';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const COLORS = ['#C45C26', '#F4A547', '#2D8B4E', '#2980B9', '#8E44AD', '#E74C3C', '#1ABC9C', '#E67E22'];

export default function Reports() {
  const { state } = useApp();
  const [period, setPeriod] = useState('today');

  const filteredOrders = useMemo(() => {
    const now = new Date();
    return state.orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      if (period === 'today') return orderDate.toDateString() === now.toDateString();
      if (period === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return orderDate >= weekAgo;
      }
      return true; // 'all'
    });
  }, [state.orders, period]);

  const paidOrders = filteredOrders.filter(o => o.paymentStatus === 'paid');

  const totalRevenue = paidOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  // Sales by day chart data
  const salesByDay = useMemo(() => {
    const days = {};
    paidOrders.forEach(o => {
      const day = new Date(o.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      days[day] = (days[day] || 0) + o.total;
    });
    return Object.entries(days).map(([name, sales]) => ({ name, sales: parseFloat(sales.toFixed(2)) }));
  }, [paidOrders]);

  // Payment method breakdown
  const paymentBreakdown = useMemo(() => {
    const methods = {};
    paidOrders.forEach(o => {
      const m = o.paymentMethod || 'Unknown';
      methods[m] = (methods[m] || 0) + 1;
    });
    return Object.entries(methods).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [paidOrders]);

  // Orders over time
  const ordersOverTime = useMemo(() => {
    const hours = {};
    filteredOrders.forEach(o => {
      const hour = new Date(o.createdAt).getHours();
      const label = `${hour}:00`;
      hours[label] = (hours[label] || 0) + 1;
    });
    return Object.entries(hours)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([time, count]) => ({ time, orders: count }));
  }, [filteredOrders]);

  // Most selling products
  const mostSellingProducts = useMemo(() => {
    const productCounts = {};
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const key = item.name;
        if (!productCounts[key]) {
          productCounts[key] = { name: key, qty: 0, revenue: 0, emoji: item.emoji || '🍽️' };
        }
        productCounts[key].qty += item.qty;
        productCounts[key].revenue += (item.price || 0) * item.qty;
      });
    });
    return Object.values(productCounts)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  }, [filteredOrders]);

  const getPeriodLabel = () => {
    if (period === 'today') return 'Today';
    if (period === 'week') return 'This Week';
    return 'All Time';
  };

  // Helper: format currency with Rs. prefix for PDF (avoids non-ASCII issues)
  const pdfCurrency = (amount) => `Rs. ${Number(amount).toFixed(2)}`;

  // Helper: clean status text
  const cleanStatus = (status) => {
    return (status || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const exportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    // ========== HEADER ==========
    doc.setFillColor(44, 24, 16);
    doc.rect(0, 0, pageWidth, 32, 'F');
    doc.setFillColor(196, 92, 38);
    doc.rect(0, 32, pageWidth, 2.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('Odoo POS Cafe', margin, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Sales Report', margin, 24);

    doc.setFontSize(9);
    const genDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    doc.text('Generated: ' + genDate, pageWidth - margin, 16, { align: 'right' });
    doc.text('Period: ' + getPeriodLabel(), pageWidth - margin, 24, { align: 'right' });

    // ========== SUMMARY SECTION ==========
    let curY = 44;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(44, 24, 16);
    doc.text('SUMMARY', margin, curY);
    curY += 3;

    // Draw 3 summary boxes
    const boxGap = 5;
    const boxW = (contentWidth - boxGap * 2) / 3;
    const boxH = 20;
    const summaryItems = [
      { label: 'Total Revenue', val: pdfCurrency(totalRevenue) },
      { label: 'Total Orders', val: String(totalOrders) },
      { label: 'Avg Order Value', val: pdfCurrency(avgOrderValue) },
    ];

    summaryItems.forEach((item, i) => {
      const bx = margin + i * (boxW + boxGap);
      const by = curY;

      // Background
      doc.setFillColor(255, 248, 240);
      doc.roundedRect(bx, by, boxW, boxH, 2, 2, 'F');
      // Border
      doc.setDrawColor(196, 92, 38);
      doc.setLineWidth(0.4);
      doc.roundedRect(bx, by, boxW, boxH, 2, 2, 'S');

      // Label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(130, 110, 100);
      doc.text(item.label, bx + boxW / 2, by + 8, { align: 'center' });

      // Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(196, 92, 38);
      doc.text(item.val, bx + boxW / 2, by + 16, { align: 'center' });
    });

    curY += boxH + 8;

    // ========== TOP SELLING PRODUCTS ==========
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(44, 24, 16);
    doc.text('TOP SELLING PRODUCTS', margin, curY);
    curY += 2;

    if (mostSellingProducts.length > 0) {
      autoTable(doc, {
        startY: curY,
        head: [['Rank', 'Product Name', 'Qty Sold', 'Revenue (Rs.)']],
        body: mostSellingProducts.map((p, i) => [
          String(i + 1),
          p.name,
          String(p.qty),
          pdfCurrency(p.revenue),
        ]),
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 4,
          textColor: [44, 24, 16],
          lineColor: [210, 200, 190],
          lineWidth: 0.25,
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [196, 92, 38],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
        },
        alternateRowStyles: {
          fillColor: [255, 248, 240],
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 16 },
          1: { halign: 'left', cellWidth: 70 },
          2: { halign: 'center', cellWidth: 28 },
          3: { halign: 'right', cellWidth: 40 },
        },
        margin: { left: margin, right: margin },
      });
      curY = doc.lastAutoTable.finalY + 10;
    } else {
      curY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(140, 130, 120);
      doc.text('No product data available for this period.', margin, curY);
      curY += 12;
    }

    // ========== ORDER DETAILS ==========
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(44, 24, 16);
    doc.text('ORDER DETAILS', margin, curY);
    curY += 2;

    if (filteredOrders.length > 0) {
      const orderRows = filteredOrders.map(o => {
        const table = state.floors.flatMap(f => f.tables).find(t => t.id === o.tableId);
        return [
          '#' + o.id.slice(-6),
          'Table ' + (table?.number || '-'),
          String(o.items.length),
          pdfCurrency(o.total),
          cleanStatus(o.paymentMethod || 'Pending'),
          cleanStatus(o.status),
          formatDate(o.createdAt),
        ];
      });

      autoTable(doc, {
        startY: curY,
        head: [['Order #', 'Table', 'Items', 'Amount (Rs.)', 'Payment', 'Status', 'Date']],
        body: orderRows,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 8,
          cellPadding: 3,
          textColor: [44, 24, 16],
          lineColor: [210, 200, 190],
          lineWidth: 0.25,
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [196, 92, 38],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
        },
        alternateRowStyles: {
          fillColor: [255, 248, 240],
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 22 },
          1: { halign: 'center', cellWidth: 20 },
          2: { halign: 'center', cellWidth: 16 },
          3: { halign: 'right', fontStyle: 'bold', cellWidth: 28 },
          4: { halign: 'center', cellWidth: 24 },
          5: { halign: 'center', cellWidth: 30 },
          6: { halign: 'center', cellWidth: 30 },
        },
        margin: { left: margin, right: margin },
        didDrawPage: () => {
          // Re-draw header on new pages
          doc.setFillColor(44, 24, 16);
          doc.rect(0, 0, pageWidth, 12, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);
          doc.text('Odoo POS Cafe - Sales Report (contd.)', margin, 8);
        },
      });
    } else {
      curY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(140, 130, 120);
      doc.text('No orders for this period.', margin, curY);
    }

    // ========== FOOTER ON ALL PAGES ==========
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageH = doc.internal.pageSize.getHeight();

      // Footer bar
      doc.setFillColor(44, 24, 16);
      doc.rect(0, pageH - 12, pageWidth, 12, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(200, 190, 180);
      doc.text('Odoo POS Cafe - Confidential', margin, pageH - 4);
      doc.text('Page ' + i + ' of ' + pageCount, pageWidth - margin, pageH - 4, { align: 'right' });
    }

    doc.save('pos-report.pdf');
    toast.success('PDF exported successfully!');
  };

  const exportXLS = () => {
    try {
      const wb = XLSX.utils.book_new();

      // --- Sheet 1: Summary ---
      const summaryData = [
        ['Odoo POS Cafe - Sales Report'],
        ['Period', getPeriodLabel()],
        ['Generated', new Date().toLocaleString('en-IN')],
        [],
        ['Metric', 'Value'],
        ['Total Revenue (Rs.)', Number(totalRevenue.toFixed(2))],
        ['Total Orders', totalOrders],
        ['Avg Order Value (Rs.)', Number(avgOrderValue.toFixed(2))],
        ['Paid Orders', paidOrders.length],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 24 }, { wch: 20 }];
      // Merge title row
      summarySheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      // --- Sheet 2: Orders ---
      const ordersHeader = ['Order #', 'Table', 'Items', 'Item Details', 'Total (Rs.)', 'Payment Method', 'Payment Status', 'Order Status', 'Date', 'Time'];
      const ordersRows = filteredOrders.map(o => {
        const table = state.floors.flatMap(f => f.tables).find(t => t.id === o.tableId);
        const itemDetails = o.items.map(it => `${it.name} x${it.qty}`).join(', ');
        return [
          '#' + o.id.slice(-6),
          'Table ' + (table?.number || '-'),
          o.items.length,
          itemDetails,
          Number(o.total.toFixed(2)),
          cleanStatus(o.paymentMethod || 'N/A'),
          cleanStatus(o.paymentStatus || 'Pending'),
          cleanStatus(o.status),
          formatDate(o.createdAt),
          formatTime(o.createdAt),
        ];
      });
      const ordersSheet = XLSX.utils.aoa_to_sheet([ordersHeader, ...ordersRows]);
      ordersSheet['!cols'] = [
        { wch: 12 }, { wch: 10 }, { wch: 7 }, { wch: 40 }, { wch: 14 },
        { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 10 },
      ];
      XLSX.utils.book_append_sheet(wb, ordersSheet, 'Orders');

      // --- Sheet 3: Top Products ---
      const productsHeader = ['Rank', 'Product Name', 'Quantity Sold', 'Revenue (Rs.)'];
      const productsRows = mostSellingProducts.map((p, i) => [
        i + 1,
        p.name,
        p.qty,
        Number(p.revenue.toFixed(2)),
      ]);
      const productsSheet = XLSX.utils.aoa_to_sheet([productsHeader, ...productsRows]);
      productsSheet['!cols'] = [{ wch: 8 }, { wch: 28 }, { wch: 16 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(wb, productsSheet, 'Top Products');

      // Download
      XLSX.writeFile(wb, `pos-report-${period}.xlsx`);
      toast.success('XLS exported successfully!');
    } catch (err) {
      console.error('XLS export error:', err);
      toast.error('Failed to export XLS');
    }
  };

  // Custom tooltip for most selling products bar chart
  const ProductTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'var(--dark)',
          color: '#fff',
          padding: '0.5rem 0.75rem',
          borderRadius: '8px',
          fontSize: '0.8rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          <div style={{ fontWeight: 600 }}>{data.emoji} {data.name}</div>
          <div>Qty sold: <strong>{data.qty}</strong></div>
          <div>Revenue: <strong>{formatCurrency(data.revenue)}</strong></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Reports & Analytics</h1>
        <p className="admin-page-subtitle">Insights into your restaurant performance</p>
      </div>

      {/* Filters */}
      <div className="reports-filters">
        <Filter size={18} style={{ color: 'var(--text-muted)' }} />
        <div className="pill-group">
          {[
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'all', label: 'All Time' },
          ].map(p => (
            <button
              key={p.value}
              className={`pill-btn ${period === p.value ? 'active' : ''}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary btn-sm" onClick={exportPDF}>
            <Download size={14} /> Export PDF
          </button>
          <button className="btn btn-outline btn-sm" onClick={exportXLS}>
            <FileSpreadsheet size={14} /> Export XLS
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-icon primary">💰</div>
          <div className="stat-card-value">
            <AnimatedCounter value={totalRevenue} prefix="₹" decimals={2} />
          </div>
          <div className="stat-card-label">Total Revenue</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-card-icon accent">📦</div>
          <div className="stat-card-value">
            <AnimatedCounter value={totalOrders} />
          </div>
          <div className="stat-card-label">Total Orders</div>
        </div>
        <div className="stat-card success">
          <div className="stat-card-icon success">📊</div>
          <div className="stat-card-value">
            <AnimatedCounter value={avgOrderValue} prefix="₹" decimals={2} />
          </div>
          <div className="stat-card-label">Avg Order Value</div>
        </div>
      </div>

      {/* Charts Row 1: Sales by Day + Payment Methods */}
      <div className="charts-grid">
        <div className="chart-container">
          <div className="chart-title">Sales by Day</div>
          {salesByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val) => formatCurrency(val)} />
                <Bar dataKey="sales" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No data for this period</div>
          )}
        </div>

        <div className="chart-container">
          <div className="chart-title">Payment Methods</div>
          {paymentBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={paymentBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {paymentBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No data for this period</div>
          )}
        </div>
      </div>

      {/* Most Selling Products Chart */}
      <motion.div
        className="chart-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="chart-title">🏆 Most Selling Products</div>
        {mostSellingProducts.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(280, mostSellingProducts.length * 44)}>
            <BarChart
              data={mostSellingProducts}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fontSize: 12 }}
                tickFormatter={(name) => {
                  const product = mostSellingProducts.find(p => p.name === name);
                  return product ? `${product.emoji} ${name}` : name;
                }}
              />
              <Tooltip content={<ProductTooltip />} />
              <Bar dataKey="qty" name="Quantity Sold" radius={[0, 6, 6, 0]}>
                {mostSellingProducts.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No product data for this period</div>
        )}
      </motion.div>

      {/* Orders Over Time */}
      <div className="chart-container">
        <div className="chart-title">Orders Over Time</div>
        {ordersOverTime.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={ordersOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No data for this period</div>
        )}
      </div>
    </div>
  );
}
