import React, { useState } from 'react';
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

${report.language === 'Tamil' ? 'தற்போதைய ஆபத்து நிலை' : 'Current Risk Level'}: ${report.risk_level}
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `Health_Report_${user.full_name}_${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getRiskStyle = (level) => {
    if (level === 'High') return { bg: 'var(--danger-light)', border: 'var(--danger-border)', color: 'var(--danger)' };
    if (level === 'Medium') return { bg: 'var(--warning-light)', border: 'var(--warning-border)', color: 'var(--warning)' };
    return { bg: 'var(--success-light)', border: 'var(--success-border)', color: 'var(--success)' };
  };

  return (
    <div>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: 700 }}>
          {language === 'Tamil' ? 'சுகாதார அறிக்கை' : 'Clinical Health Summary Report'}
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {language === 'Tamil' ? 'உங்கள் சுகாதார அறிக்கை உருவாக்கவும் மற்றும் பதிவிறக்கவும்' : 'Generate structured clinical summaries for medical records'}
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.75rem', alignItems: 'start' }}>
        {/* Controls Panel */}
        <div className="card">
          <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 600 }}>
            {language === 'Tamil' ? 'அறிக்கை அமைப்புகள்' : 'Report Configuration'}
          </h3>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <Globe size={15} color="var(--primary)" />
              {language === 'Tamil' ? 'மொழி' : 'Document Language'}
            </label>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setReport(null);
              }}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                marginBottom: 0
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
              padding: '0.7rem 1rem',
              background: loading ? 'var(--primary-hover)' : 'var(--primary)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            <FileText size={17} />
            {loading 
              ? (language === 'Tamil' ? 'உருவாக்குகிறது...' : 'Generating Report...')
              : (language === 'Tamil' ? 'அறிக்கை உருவாக்கவும்' : 'Generate Summary')
            }
          </button>

          {report && (
            <button
              onClick={downloadPDF}
              style={{
                width: '100%',
                marginTop: '0.75rem',
                padding: '0.7rem 1rem',
                background: 'var(--teal)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              <Download size={17} />
              {language === 'Tamil' ? 'பதிவிறக்கவும்' : 'Download Document'}
            </button>
          )}

          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'var(--danger-light)',
              border: '1px solid var(--danger-border)',
              borderRadius: '0.5rem',
              color: 'var(--danger)',
              fontSize: '0.85rem'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Report Display Document View */}
        <div>
          {report ? (
            <div className="card" style={{ padding: '2.25rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.75rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--primary)', fontWeight: 700 }}>
                    {report.title}
                  </h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Rural Healthcare Portal &bull; Medical Records Output
                  </p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <strong>{language === 'Tamil' ? 'தேதி' : 'Date'}:</strong> {report.report_date}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
                marginBottom: '1.75rem',
                paddingBottom: '1.5rem',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {language === 'Tamil' ? 'நோயாளி தகவல்' : 'Patient Demographic Info'}
                  </h4>
                  <p style={{ margin: '0.35rem 0', fontSize: '0.9rem' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>{language === 'Tamil' ? 'பெயர்' : 'Patient Name'}:</strong> {report.patient.name}
                  </p>
                  <p style={{ margin: '0.35rem 0', fontSize: '0.9rem' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>{language === 'Tamil' ? 'ID' : 'Patient ID'}:</strong> {report.patient.id.slice(0, 8)}...
                  </p>
                </div>
                
                <div>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {language === 'Tamil' ? 'ஆபத்து நிலை' : 'Current Risk Status'}
                  </h4>
                  {(() => {
                    const style = getRiskStyle(report.risk_level);
                    return (
                      <div style={{
                        padding: '0.85rem 1rem',
                        background: style.bg,
                        borderRadius: '0.5rem',
                        borderLeft: `4px solid ${style.color}`,
                        border: `1px solid ${style.border}`
                      }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>
                          {language === 'Tamil' ? 'தற்போதைய நிலை' : 'Classification'}
                        </p>
                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '1.25rem', fontWeight: 700, color: style.color }}>
                          {report.risk_level} Risk
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Latest Reading */}
              <div style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ marginBottom: '0.85rem', fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 700 }}>
                  {language === 'Tamil' ? 'சமீபத்திய வாசிப்பு' : 'Most Recent Vital Telemetry'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem' }}>
                  {Object.entries(report.latest_reading).map(([key, value]) => (
                    <div key={key} style={{
                      padding: '0.85rem 1rem',
                      background: 'var(--primary-subtle)',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--primary-light)',
                      borderLeft: '3px solid var(--primary)'
                    }}>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {key}
                      </p>
                      <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7-Day Average */}
              <div>
                <h3 style={{ marginBottom: '0.85rem', fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 700 }}>
                  {language === 'Tamil' ? '7 நாள் சராசரி' : '7-Day Longitudinal Averages'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem' }}>
                  {Object.entries(report.average_7_days).map(([key, value]) => (
                    <div key={key} style={{
                      padding: '0.85rem 1rem',
                      background: 'var(--teal-light)',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(13, 148, 136, 0.2)',
                      borderLeft: '3px solid var(--teal)'
                    }}>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: 'var(--teal-hover)', fontWeight: 600 }}>
                        {key}
                      </p>
                      <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileText size={44} style={{ color: 'var(--primary)', opacity: 0.4, marginBottom: '0.75rem', margin: '0 auto 0.75rem' }} />
              <p style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1rem', margin: '0 0 0.35rem 0' }}>
                {language === 'Tamil' ? 'அறிக்கை தயாராக இல்லை' : 'No Report Generated Yet'}
              </p>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>
                {language === 'Tamil' ? 'அறிக்கை உருவாக்க "அறிக்கை உருவாக்கவும்" பொத்தானைக் கிளிக் செய்க.' : 'Select your desired language and click "Generate Summary" to view the report preview.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportGeneration;
