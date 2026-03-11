import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Download, Settings, Image as ImageIcon, X, Trash2 } from 'lucide-react';
import nepalify from 'nepalify';

const GenerateCard = () => {
  const [data, setData] = useState([]);
  const [templateUrl, setTemplateUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState(currentYear.toString());
  const [filterMonth, setFilterMonth] = useState('All');

  // Custom coordinates state
  const [coords, setCoords] = useState({
    body: {
      x: 960, y: 700,
      fontSize: 40, color: '#000000',
      maxWidth: 1200, lineHeight: 70,
      isBold: true, isItalic: false, isUnderline: false
    },
    recipient: {
      x: 1600, y: 250,
      fontSize: 55, color: '#000000', // Member name color
      secondaryColor: '#ff0000', // "TO," color
      maxWidth: 400, lineHeight: 70,
      isBold: true, isItalic: false, isUnderline: false,
      drawCircle: true,
      circleColor: '#00d5ff',
      circleRadius: 150
    }
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const saveTimeoutRef = useRef(null);
  const isLoadedRef = useRef(false); // Track if settings fetched from DB

  const [showConfig, setShowConfig] = useState(false);
  const [previewDonor, setPreviewDonor] = useState(null);
  const [previewDataUrl, setPreviewDataUrl] = useState('');

  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const months = ["All", "जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन", "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"];
  const years = Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());

  useEffect(() => {
    // No auto-fetch on mount
  }, []);
  
  const fetchTemplate = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/template');
      if (res.data.success && res.data.path) {
        setTemplateUrl(`http://localhost:5000${res.data.path}?t=${new Date().getTime()}`);
      }
    } catch (err) { }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/settings/card-coords');
      if (res.data.success && res.data.data) {
        setCoords(prev => ({
          ...prev,
          ...res.data.data,
          body: { ...prev.body, ...res.data.data.body },
          recipient: { ...prev.recipient, ...res.data.data.recipient }
        }));
      }
    } catch (err) {
    } finally {
      isLoadedRef.current = true; // Mark as loaded even if error (to allow future saves)
    }
  };


  useEffect(() => {
    fetchTemplate();
    fetchSettings();
  }, []);

  const saveConfig = async (currentCoords) => {
    if (!isLoadedRef.current) return; // Never save if we haven't even tried to load yet
    setAutoSaveStatus('saving');
    try {
      const res = await axios.post('http://localhost:5000/api/settings/card-coords', { coords: currentCoords || coords });
      if (res.data.success) {
        setAutoSaveStatus('saved');
      }
    } catch (err) {
      console.error(err);
      setAutoSaveStatus('error');
    }
  };

  // Auto-save logic with debounce
  useEffect(() => {
    if (previewDonor && imgRef.current) {
      generateSingleCard(previewDonor).then(url => setPreviewDataUrl(url));
    }

    // Debounced Save - Only if settings have been loaded from DB at least once
    if (isLoadedRef.current) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      saveTimeoutRef.current = setTimeout(() => {
        saveConfig(coords);
      }, 1500);
    }

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
    // eslint-disable-next-line
  }, [coords]);

  // No auto-fetch — only fetch when Load button is clicked

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

  // 2. Generate Single Card (Download or Preview)
  const generateSingleCard = async (donor) => {
    if (!canvasRef.current || !imgRef.current) return '';

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Draw background
    ctx.drawImage(img, 0, 0);

    // Helper for wrapped text
    const wrapAndDrawText = (text, x, y, maxWidth, lineHeight, field) => {
      ctx.font = `${coords[field].isBold ? 'bold ' : ''}${coords[field].isItalic ? 'italic ' : ''}${coords[field].fontSize}px "Noto Sans", sans-serif`;
      ctx.fillStyle = coords[field].color;
      ctx.textAlign = 'center';
      
      const words = text.split(' ');
      let line = '';
      let currentY = y;

      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, x, currentY);
          if (coords[field].isUnderline) {
            const underlineWidth = ctx.measureText(line).width;
            ctx.fillRect(x - underlineWidth / 2, currentY + 5, underlineWidth, 2);
          }
          line = words[n] + ' ';
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
      if (coords[field].isUnderline) {
        const underlineWidth = ctx.measureText(line.trim()).width;
        ctx.fillRect(x - underlineWidth / 2, currentY + 5, underlineWidth, 2);
      }
    };

    // 1. Recipient Block (Circle + English Name on the right side)
    const rc = coords.recipient || {};
    // Prioritize English name, fallback to Nepali only if English is completely empty
    const nameEn = donor.name_en ? donor.name_en : donor.name;
    
    // Explicit Defaults (ensure they are on the canvas)
    let rX = rc.x || (canvas.width - 250); 
    let rY = rc.y || 250; 
    const rRadius = rc.circleRadius || 180; 
    const rColor = rc.circleColor || '#00d5ff'; 

    // Safety: Clamp to canvas boundaries if they are off
    if (rX > canvas.width) rX = canvas.width - rRadius - 50;
    if (rY > canvas.height) rY = canvas.height - rRadius - 50;
    if (rX < 0) rX = rRadius + 50;
    if (rY < 0) rY = rRadius + 50;

    ctx.save();
    // Draw Circle Background - default to true if not explicitly false
    if (rc.drawCircle !== false) {
      ctx.beginPath();
      ctx.arc(rX, rY, rRadius, 0, Math.PI * 2);
      ctx.fillStyle = rColor;
      ctx.fill();
    }

    // Draw text inside circle
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const baseFontSize = rc.fontSize || 55;
    const lh = rc.lineHeight || 70; // Use dynamic line height

    // A. Draw "TO," in its secondary color (Red)
    ctx.font = `bold ${baseFontSize}px Arial, sans-serif`;
    ctx.fillStyle = rc.secondaryColor || '#ff0000'; 
    ctx.fillText("TO,", rX, rY - (lh / 2)); // Dynamic offset up

    // B. Draw Member Name in its primary color (Black)
    ctx.font = `bold ${baseFontSize - 5}px Arial, sans-serif`;
    ctx.fillStyle = rc.color || '#000000'; 
    ctx.fillText(nameEn, rX, rY + (lh / 2)); // Dynamic offset down
    
    ctx.restore();
    ctx.textBaseline = 'alphabetic'; // Reset baseline for other drawings

    // 2. Draw Main Message with Nepali Name (Body)
    const amountVal = Math.floor(Number(donor.amount));
    const amountFormat = amountVal.toLocaleString();
    const nepaliYear = nepalify.format(donor.year.toString());
    const nepaliAmount = nepalify.format(amountFormat);

    const message = `${donor.name} ज्यू हजुरले दिनु भएको दशांश रु. ${nepaliAmount} चर्चले प्राप्त गरेको जानकारी गराउँदै उक्त रकम ${nepaliYear} ${donor.month} महिनाको दशांशमा समावेश गरेका छौं र चर्च परिवारले हजुर र हजुरको परिवारको निम्ति निरन्तर प्रार्थना गरिरहेको पनि जानकारी गराउँदछौं ।`;
    
    if (coords.body) {
      wrapAndDrawText(message, coords.body.x, coords.body.y, coords.body.maxWidth || 1100, coords.body.lineHeight || 70, 'body');
    }

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const showPreview = async (donor) => {
    if (!templateUrl || !imgRef.current) {
      alert('Please ensure a template is uploaded first.');
      return;
    }
    setPreviewDonor(donor);
    const url = await generateSingleCard(donor);
    setPreviewDataUrl(url);
  };

  const downloadSingleCard = () => {
    if (!previewDonor || !previewDataUrl) return;
    const link = document.createElement('a');
    link.download = `ThankYou_${previewDonor.name.replace(/\s+/g, '_')}_${previewDonor.month}_${previewDonor.year}.jpg`;
    link.href = previewDataUrl;
    link.click();
  };

  const handleBatchDownload = async () => {
    if (!templateUrl) return alert("Please upload a template in the Photo page first.");
    const downloadList = selectedIds.length > 0 
      ? data.filter(item => selectedIds.includes(item.id)) 
      : data;

    if (downloadList.length === 0) return alert("No records selected or loaded.");
    if (!imgRef.current) return;

    for (let i = 0; i < downloadList.length; i++) {
      const donor = downloadList[i];
      setGenerating(`Generating for... ${donor.name} (${i + 1}/${downloadList.length})`);

      const dataUrl = await generateSingleCard(donor);

      const link = document.createElement('a');
      link.download = `ThankYou_${donor.name.replace(/\s+/g, '_')}_${donor.month}_${donor.year}.jpg`;
      link.href = dataUrl;
      link.click();

      // Slight delay to process downloads
      await new Promise(r => setTimeout(r, 600));
    }
    setGenerating('Done!');
    setSelectedIds([]); // Clear selection after download
    setTimeout(() => setGenerating(''), 3000);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Generate Thank You Cards</h2>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ marginBottom: 0, minWidth: '150px' }}>
          <label>Select Year</label>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            {years.map(y => <option key={y} value={y}>{nepalify.format(y)}</option>)}
          </select>
        </div>
        
        <div className="form-group" style={{ marginBottom: 0, minWidth: '180px' }}>
          <label>Select Month</label>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            <option value="" disabled>-- Select --</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <button className="btn btn-sm" onClick={fetchData}>
          <Search size={16} /> Filter
        </button>

        <button className="btn btn-sm" style={{ marginLeft: 'auto', backgroundColor: '#6b46c1' }} onClick={() => setShowConfig(true)}>
          <Settings size={16} /> Adjust Settings
        </button>
      </div>
        <button
          className="btn"
          style={{ 
            backgroundColor: selectedIds.length > 0 ? 'var(--success-color)' : 'rgba(72, 187, 120, 0.4)', 
            marginLeft: 'auto',
            color: selectedIds.length > 0 ? '#fff' : 'rgba(255,255,255,0.6)',
            boxShadow: selectedIds.length > 0 ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
            cursor: (selectedIds.length > 0 && generating === '') ? 'pointer' : 'default'
          }}
          onClick={handleBatchDownload}
          disabled={selectedIds.length === 0 || !templateUrl || generating !== ''}
        >
          <Download size={18} /> {generating !== '' ? generating : 
            selectedIds.length > 0 
              ? `Download Selected Card${selectedIds.length > 1 ? 's' : ''} (${selectedIds.length})` 
              : `Download Selected Card`
          }
        </button>

      {templateUrl && (
        <img
          ref={imgRef}
          src={templateUrl}
          crossOrigin='anonymous'
          alt="hidden template"
          style={{ display: 'none' }}
        />
      )}

      {/* Hidden canvas for generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

      {showConfig && (
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h3 style={{ margin: 0 }}>Coordinate Mapping</h3>
              <span style={{ 
                fontSize: '0.75rem', 
                padding: '4px 10px', 
                borderRadius: '20px',
                background: autoSaveStatus === 'saving' ? 'rgba(255, 204, 0, 0.2)' : 
                            autoSaveStatus === 'error' ? 'rgba(255, 59, 48, 0.2)' : 'rgba(52, 199, 89, 0.2)',
                color: autoSaveStatus === 'saving' ? '#ffcc00' : 
                       autoSaveStatus === 'error' ? '#ff3b30' : '#34c759',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{ 
                  width: '6px', 
                  height: '6px', 
                  borderRadius: '50%', 
                  background: 'currentColor',
                  animation: autoSaveStatus === 'saving' ? 'pulse 1s infinite' : 'none'
                }}></span>
                {autoSaveStatus === 'saving' ? 'Saving changes...' : 
                 autoSaveStatus === 'error' ? 'Save failed' : 'All changes saved'}
              </span>
              <button 
                className="btn" 
                onClick={() => saveConfig(coords)} 
                style={{ 
                  padding: '4px 12px', 
                  fontSize: '0.75rem', 
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                disabled={autoSaveStatus === 'saving'}
              >
                {autoSaveStatus === 'saving' ? 'Saving...' : 'Save Mapping'}
              </button>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => setShowConfig(false)}><X size={16} /></button>

          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Adjust X, Y coordinates, Font Size, and Color. X=0, Y=0 is the top-left corner of the template.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {Object.keys(coords).map(field => (
              <div key={field} style={{ flex: '1 1 200px', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ textTransform: 'capitalize', color: 'var(--accent-color)', marginBottom: '0.5rem' }}>{field.replace(/([A-Z])/g, ' $1').trim()}</h4>

                {field === 'recipient' && (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={coords[field].drawCircle ?? true}
                          onChange={e => setCoords({ ...coords, [field]: { ...coords[field], drawCircle: e.target.checked } })}
                        /> Draw Circle Background
                      </label>
                    </div>
                    {coords[field].drawCircle !== false && (
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                          <label>Circle Color</label>
                          <input type="color" value={coords[field].circleColor || '#00CED1'} onChange={e => setCoords({ ...coords, [field]: { ...coords[field], circleColor: e.target.value } })} style={{ height: '40px', padding: 0 }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                          <label>TO, Color</label>
                          <input type="color" value={coords[field].secondaryColor || '#ff0000'} onChange={e => setCoords({ ...coords, [field]: { ...coords[field], secondaryColor: e.target.value } })} style={{ height: '40px', padding: 0 }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                          <label>Circle Radius</label>
                          <input type="number" value={coords[field].circleRadius || 100} onChange={e => setCoords({ ...coords, [field]: { ...coords[field], circleRadius: parseInt(e.target.value) } })} />
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label>X Position</label>
                  <input type="number" value={coords[field].x} onChange={e => setCoords({ ...coords, [field]: { ...coords[field], x: parseInt(e.target.value) } })} />
                </div>
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label>Y Position</label>
                  <input type="number" value={coords[field].y} onChange={e => setCoords({ ...coords, [field]: { ...coords[field], y: parseInt(e.target.value) } })} />
                </div>
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label>Max Width</label>
                  <input type="number" value={coords[field].maxWidth || 800} onChange={e => setCoords({ ...coords, [field]: { ...coords[field], maxWidth: parseInt(e.target.value) } })} />
                </div>
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label>Line Height</label>
                  <input type="number" value={coords[field].lineHeight || 60} onChange={e => setCoords({ ...coords, [field]: { ...coords[field], lineHeight: parseInt(e.target.value) } })} />
                </div>
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label>Font Size</label>
                  <input type="number" value={coords[field].fontSize} onChange={e => setCoords({ ...coords, [field]: { ...coords[field], fontSize: parseInt(e.target.value) } })} />
                </div>
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label>Color</label>
                  <input type="color" value={coords[field].color} onChange={e => setCoords({ ...coords, [field]: { ...coords[field], color: e.target.value } })} style={{ height: '40px', padding: 0 }} />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={coords[field].isBold}
                      onChange={e => setCoords({ ...coords, [field]: { ...coords[field], isBold: e.target.checked } })}
                    /> Bold
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={coords[field].isItalic}
                      onChange={e => setCoords({ ...coords, [field]: { ...coords[field], isItalic: e.target.checked } })}
                    /> Italic
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={coords[field].isUnderline}
                      onChange={e => setCoords({ ...coords, [field]: { ...coords[field], isUnderline: e.target.checked } })}
                    /> Underline
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area: Table List or Preview */}
      {previewDonor ? (
        <div className="glass-panel text-center">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Card Preview: {previewDonor.name}</h3>
            <div>
              <button className="btn btn-sm" style={{ marginRight: '1rem' }} onClick={() => setPreviewDonor(null)}>Back to List</button>
              <button className="btn btn-sm" style={{ backgroundColor: 'var(--success-color)' }} onClick={downloadSingleCard}>
                <Download size={14} /> Download Card
              </button>
            </div>
          </div>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', display: 'inline-block' }}>
            {previewDataUrl ? (
              <img src={previewDataUrl} alt="Card Preview" style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block' }} />
            ) : (
              <p style={{ padding: '3rem' }}>Generating preview...</p>
            )}
          </div>
        </div>
      ) : (
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
                  <th>S.No</th>
                  <th>Member Name</th>
                  <th>Amount (Rs)</th>
                  <th>Year</th>
                  <th>Month</th>
                  <th>Date Logged</th>
                  <th style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      {selectedIds.length > 0 && (
                        <button 
                          className="btn btn-danger btn-sm" 
                          style={{ padding: '2px 4px', width: '100%', marginBottom: '4px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }} 
                          onClick={handleBulkDelete}
                          title="Delete Selected"
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
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.name_en || ''}</div>
                    </td>
                    <td style={{ color: 'var(--success-color)' }}>{nepalify.format(Math.floor(Number(item.amount)).toLocaleString())}</td>
                    <td>{nepalify.format(item.year.toString())}</td>
                    <td>{item.month}</td>
                    <td>{new Date(item.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-sm" onClick={() => showPreview(item)} title="Preview Card">
                          <ImageIcon size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(item.id)}
                          title="Delete Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default GenerateCard;
