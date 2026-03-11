import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, Search, Trash2, FileText } from 'lucide-react';
import nepalify from 'nepalify';
import { AuthContext } from '../context/AuthContext';

const Reports = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);


  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState(currentYear.toString());
  const [filterMonth, setFilterMonth] = useState('All');

  const months = ["All", "जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन", "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"];
  const years = ["2020", "2021", "2022", "2023", "2024", "2025", "2026", "2027", "2028", "2029", "2030"];

  useEffect(() => {
    // No auto-fetch on mount
  }, []);
  const fetchData = async () => {
    if (!filterMonth) {
      alert("Please select a month or 'All' first.");
      return;
    }
    setLoading(true);
    try {
      let url = `http://localhost:5000/api/donations?year=${filterYear}&month=${filterMonth}`;

      const res = await axios.get(url);
      if (res.data.success) {
        setData(res.data.data);
        setHasSearched(true);
        setSelectedIds([]); // Reset selection on new fetch
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // No auto-fetch — only fetch when Filter button is clicked

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        const res = await axios.delete(`http://localhost:5000/api/donations/${id}`);
        if (res.data.success) {
          fetchData();
        }
      } catch (err) {
        console.error(err);
        alert('Failed to delete record');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected records?`)) {
      try {
        const res = await axios.post('http://localhost:5000/api/donations/bulk-delete', { ids: selectedIds });
        if (res.data.success) {
          fetchData();
          setSelectedIds([]);
        }
      } catch (err) {
        console.error(err);
        alert('Failed to delete selected records');
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map(item => item.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };


  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.map((item, index) => ({
      "S.No": index + 1,
      ID: item.id,
      "Member Name (Nepali)": item.name,
      "Member Name (English)": item.name_en || '',
      Amount: Math.floor(Number(item.amount)),
      Year: item.year,
      Month: item.month,
      Date: new Date(item.created_at).toLocaleDateString()
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tithes");
    XLSX.writeFile(wb, `FGT_Tithes_${filterYear}_${filterMonth}.xlsx`);
  };

  // PDF — Current filtered view (serial wise)
  const exportPDFCurrent = () => {
    const doc = new jsPDF();
    const title = `FGT Church — Tithe Report (${filterMonth === 'All' ? 'All Months' : filterMonth}, ${filterYear})`;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FGT Church', 14, 15);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tithe Report — ${filterMonth === 'All' ? 'All Months' : filterMonth} ${filterYear}`, 14, 23);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()}  |  Total Records: ${data.length}`, 14, 30);

    const total = data.reduce((sum, item) => sum + Number(item.amount), 0);

    autoTable(doc, {
      startY: 36,
      head: [['S.No', 'Nepali Name', 'English Name', 'Amount (Rs)', 'Year', 'Month', 'Date Logged']],
      body: data.map((item, idx) => [
        idx + 1,
        item.name,
        item.name_en || '',
        Math.floor(Number(item.amount)).toLocaleString(),
        item.year,
        item.month,
        new Date(item.created_at).toLocaleDateString()
      ]),
      foot: [['', 'TOTAL', '', Math.floor(total).toLocaleString(), '', '', '']],
      headStyles: { fillColor: [13, 59, 52], textColor: 255, fontStyle: 'bold' },
      footStyles: { fillColor: [240, 240, 240], textColor: 50, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 251] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 2: { halign: 'right' } }
    });

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  // PDF — All months of selected year, grouped by month
  const exportPDFAllMonths = async () => {
    try {
      let url = `http://localhost:5000/api/donations?year=${filterYear}&month=All`;
      const res = await axios.get(url);
      if (!res.data.success) return;
      const allData = res.data.data;

      const doc = new jsPDF();
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('Nepalgunj FGT Church - Monthly Tithe Report', 14, 15);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
        doc.text(`Nepalgunj FGT Church - Annual Tithe Statement (${filterYear})`, 14, 15);
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleDateString()}  |  Total Records: ${allData.length}`, 14, 30);

      // Group by month in Nepali order
      const monthOrder = ["जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन", "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"];
      const grouped = {};
      allData.forEach(item => {
        if (!grouped[item.month]) grouped[item.month] = [];
        grouped[item.month].push(item);
      });

      let startY = 36;
      let grandTotal = 0;

      // Sort months by order
      const sortedMonths = Object.keys(grouped).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

      sortedMonths.forEach((month, mIdx) => {
        const monthData = grouped[month];
        const monthTotal = monthData.reduce((sum, item) => sum + Number(item.amount), 0);
        grandTotal += monthTotal;

        // Section header
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(13, 59, 52);
        if (startY > 250) { doc.addPage(); startY = 15; }
        doc.text(`${month} ${filterYear}`, 14, startY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);

        autoTable(doc, {
          startY: startY + 4,
          head: [['S.No', 'Nepali Name', 'English Name', 'Amount (Rs)', 'Date']],
          body: monthData.map((item, idx) => [
            idx + 1,
            item.name,
            item.name_en || '',
            Math.floor(Number(item.amount)).toLocaleString(),
            new Date(item.created_at).toLocaleDateString()
          ]),
          foot: [['', '', `${month} Total`, Math.floor(monthTotal).toLocaleString(), '']],
          headStyles: { fillColor: [13, 59, 52], textColor: 255, fontStyle: 'bold', fontSize: 8 },
          footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', fontSize: 8 },
          alternateRowStyles: { fillColor: [248, 250, 251] },
          styles: { fontSize: 8.5, cellPadding: 2.5 },
          columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 2: { halign: 'right' } },
          margin: { bottom: 15 }
        });

        startY = doc.lastAutoTable.finalY + 10;
      });

      // Grand total
      if (startY > 260) { doc.addPage(); startY = 15; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(13, 59, 52);
      doc.text(`Grand Total (${filterYear}): Rs. ${Math.floor(grandTotal).toLocaleString()}`, 14, startY + 5);

      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Tithe Reports</h2>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ marginBottom: 0, minWidth: '150px' }}>
          <label>Filter Year</label>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            {years.map(y => <option key={y} value={y}>{nepalify.format(y)}</option>)}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0, minWidth: '180px' }}>
          <label>Filter Month</label>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            <option value="" disabled>-- Select --</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <button className="btn btn-sm" onClick={fetchData}>
          <Search size={16} /> Filter
        </button>

        {/* Export and Bulk Delete Buttons */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn btn-sm" style={{ backgroundColor: 'var(--success-color)' }} onClick={exportExcel} disabled={data.length === 0}>
            <Download size={14} /> Excel
          </button>
          <button className="btn btn-sm" style={{ backgroundColor: '#e53e3e' }} onClick={exportPDFCurrent} disabled={data.length === 0}>
            <FileText size={14} /> PDF Preview
          </button>
          <button className="btn btn-sm" style={{ backgroundColor: '#744210' }} onClick={exportPDFAllMonths}>
            <FileText size={14} /> Year Report
          </button>
        </div>
      </div>


      <div className="glass-panel table-container">
        {loading ? (
          <p>Loading records...</p>
        ) : !hasSearched ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>Please select filters and click <strong>Filter</strong> to view records.</p>
          </div>
        ) : data.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No tithes found for the selected period.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={data.length > 0 && selectedIds.length === data.length} 
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th style={{ width: '60px' }}>S.No</th>
                  <th>Member Name (Nepali / English)</th>
                  <th>Amount (Rs)</th>
                  <th style={{ textAlign: 'center' }}>Year</th>
                  <th style={{ textAlign: 'center' }}>Month</th>
                  <th>Date Logged</th>
                  <th style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      {selectedIds.length > 0 && (
                        <button 
                          className="btn btn-danger btn-sm" 
                          style={{ padding: '2px 4px', width: '100%', marginBottom: '4px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }} 
                          onClick={handleBulkDelete}
                          title="Delete Items"
                        >
                          <Trash2 size={10} /> Delete Item
                        </button>
                      )}
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={item.id} style={{ backgroundColor: selectedIds.includes(item.id) ? 'rgba(var(--accent-rgb), 0.05)' : 'transparent' }}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(item.id)} 
                        onChange={() => toggleSelect(item.id)}
                      />
                    </td>
                    <td>{index + 1}</td>

                    <td style={{ fontWeight: 500 }}>
                      <div>{item.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {item.name_en || ''}
                      </div>
                    </td>
                    <td style={{ color: 'var(--success-color)' }}>{nepalify.format(Math.floor(Number(item.amount)).toLocaleString())}</td>
                    <td style={{ textAlign: 'center' }}>{nepalify.format(item.year.toString())}</td>
                    <td style={{ textAlign: 'center' }}>{item.month}</td>
                    <td>{new Date(item.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                        onClick={() => handleDelete(item.id)}
                        title="Delete Record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} style={{ fontWeight: 700, textAlign: 'right', paddingRight: '1rem' }}>Total:</td>
                  <td style={{ fontWeight: 700, color: 'var(--success-color)' }}>
                    {nepalify.format(Math.floor(data.reduce((s, i) => s + Number(i.amount), 0)).toLocaleString())}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
