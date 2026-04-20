import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { Download, FileText, Globe } from 'lucide-react';

const ReportGeneration = () => {
  const { user } = useUser();
  const [language, setLanguage] = useState('English');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`http://localhost:5001/generate-report?patient_id=${user.id}&language=${language}`);
      setReport(res.data);
    } catch (err) {
      setError('Error generating report. Please try again.');
      console.error(err);
    }
    setLoading(false);
  };

  const downloadPDF = () => {
    if (!report) return;
    
    // Create a simple PDF content (you can use a library like jsPDF for better formatting)
    const content = `
${report.title}
${'='.repeat(40)}

${report.language === 'Tamil' ? 'நோயாளியின் பெயர்' : 'Patient Name'}: ${report.patient.name}
${report.language === 'Tamil' ? 'நோயாளி ID' : 'Patient ID'}: ${report.patient.id}
${report.language === 'Tamil' ? 'அறிக்கை தேதி' : 'Report Date'}: ${report.report_date}

${report.language === 'Tamil' ? 'சமீபத்திய வாசிப்பு' : 'Latest Reading'}:
${Object.entries(report.latest_reading).map(([key, value]) => `${key}: ${value}`).join('\n')}

${report.language === 'Tamil' ? '7 நாள் சராசரி' : '7-Day Average'}:
${Object.entries(report.average_7_days).map(([key, value]) => `${key}: ${value}`).join('\n')}

${report.language === 'Tamil' ? 'தற்போதைய ஝ுக்கம் நிலை' : 'Current Risk Level'}: ${report.risk_level}
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `Health_Report_${user.full_name}_${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 className="gradient-text" style={{ margin: 0, fontSize: '2rem' }}>
          {language === 'Tamil' ? 'சுகாதார அறிக்கை' : 'Health Report'}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {language === 'Tamil' ? 'உங்கள் சுகாதார பதிவு உருவாக்கவும் மற்றும் பதிவிறக்கவும்' : 'Generate and download your health report'}
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        {/* Controls */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>
            {language === 'Tamil' ? 'அறிக்கை அமைப்புகள்' : 'Report Settings'}
          </h3>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              <Globe size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              {language === 'Tamil' ? 'மொழி' : 'Language'}
            </label>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setReport(null);
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.3)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              <option value="English">English</option>
              <option value="Tamil">Tamil (தமிழ்)</option>
            </select>
          </div>

          <button
            onClick={generateReport}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: loading ? 'var(--primary-dark)' : 'var(--primary)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <FileText size={18} />
            {loading 
              ? (language === 'Tamil' ? 'உருவாக்குகிறது...' : 'Generating...')
              : (language === 'Tamil' ? 'அறிக்கை உருவாக்கவும்' : 'Generate Report')
            }
          </button>

          {report && (
            <button
              onClick={downloadPDF}
              style={{
                width: '100%',
                marginTop: '0.75rem',
                padding: '0.75rem 1rem',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Download size={18} />
              {language === 'Tamil' ? 'பதிவிறக்கவும்' : 'Download'}
            </button>
          )}

          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0.5rem',
              color: '#fca5a5'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Report Display */}
        <div>
          {report ? (
            <div className="glass-card">
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', textAlign: 'center' }}>
                {report.title}
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
                marginBottom: '2rem',
                paddingBottom: '2rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 1rem 0', opacity: 0.7 }}>
                    {language === 'Tamil' ? 'நோயாளி தகவல்' : 'Patient Information'}
                  </h4>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>{language === 'Tamil' ? 'பெயர்' : 'Name'}:</strong> {report.patient.name}
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>{language === 'Tamil' ? 'ID' : 'ID'}:</strong> {report.patient.id.slice(0, 8)}...
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>{language === 'Tamil' ? 'தேதி' : 'Date'}:</strong> {report.report_date}
                  </p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 1rem 0', opacity: 0.7 }}>
                    {language === 'Tamil' ? '஝ுக்கம் நிலை' : 'Risk Assessment'}
                  </h4>
                  <div style={{
                    padding: '1rem',
                    background: `rgba(${report.risk_level === 'High' ? '239, 68, 68' : report.risk_level === 'Medium' ? '245, 158, 11' : '16, 185, 129'}, 0.1)`,
                    borderRadius: '0.5rem',
                    borderLeft: `4px solid ${report.risk_level === 'High' ? '#ef4444' : report.risk_level === 'Medium' ? '#f59e0b' : '#10b981'}`
                  }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7 }}>
                      {language === 'Tamil' ? 'தற்போதைய நிலை' : 'Current Status'}
                    </p>
                    <p style={{
                      margin: '0.5rem 0 0 0',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: report.risk_level === 'High' ? '#ef4444' : report.risk_level === 'Medium' ? '#f59e0b' : '#10b981'
                    }}>
                      {report.risk_level}
                    </p>
                  </div>
                </div>
              </div>

              {/* Latest Reading */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', opacity: 0.9 }}>
                  {language === 'Tamil' ? 'சமீபத்திய வாசிப்பு' : 'Latest Reading'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  {Object.entries(report.latest_reading).map(([key, value]) => (
                    <div key={key} style={{
                      padding: '1rem',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '0.5rem',
                      borderLeft: '3px solid var(--primary)'
                    }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7, marginBottom: '0.5rem' }}>
                        {key}
                      </p>
                      <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7-Day Average */}
              <div>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', opacity: 0.9 }}>
                  {language === 'Tamil' ? '7 நாள் சராசரி' : '7-Day Average'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  {Object.entries(report.average_7_days).map(([key, value]) => (
                    <div key={key} style={{
                      padding: '1rem',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '0.5rem',
                      borderLeft: '3px solid var(--accent)'
                    }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7, marginBottom: '0.5rem' }}>
                        {key}
                      </p>
                      <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
              <FileText size={48} style={{ opacity: 0.5, marginBottom: '1rem', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)', marginBottom: 0 }}>
                {language === 'Tamil' ? 'உங்கள் அறிக்கை இங்கே தோன்றும்' : 'Your report will appear here'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportGeneration;
