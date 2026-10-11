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

  const getRiskBadge = (level) => {
    if (level === 'High') return { label: 'High Risk', class: 'badge-danger' };
    if (level === 'Medium') return { label: 'Medium Risk', class: 'badge-warning' };
    return { label: 'Low Risk', class: 'badge-success' };
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {language === 'Tamil' ? 'சுகாதார அறிக்கை' : 'Clinical Health Summary Report'}
          </h1>
          <p className="page-subtitle">
            {language === 'Tamil' ? 'உங்கள் சுகாதார அறிக்கை உருவாக்கவும் மற்றும் பதிவிறக்கவும்' : 'Generate structured clinical telemetry summaries for medical records'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 320px) minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Controls Panel */}
        <div className="card">
          <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {language === 'Tamil' ? 'அறிக்கை அமைப்புகள்' : 'Report Configuration'}
          </h3>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <Globe size={14} color="var(--primary-deep)" />
              {language === 'Tamil' ? 'மொழி' : 'Document Language'}
            </label>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setReport(null);
              }}
              style={{ marginBottom: 0 }}
            >
              <option value="English">English</option>
              <option value="Tamil">Tamil (தமிழ்)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={generateReport}
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '0.7rem 1rem' }}
          >
            <FileText size={16} />
            {loading 
              ? (language === 'Tamil' ? 'உருவாக்குகிறது...' : 'Generating Report...')
              : (language === 'Tamil' ? 'அறிக்கை உருவாக்கவும்' : 'Generate Summary')
            }
          </button>

          {report && (
            <button
              type="button"
              onClick={downloadPDF}
              className="btn-secondary"
              style={{ width: '100%', marginTop: '0.75rem', padding: '0.7rem 1rem' }}
            >
              <Download size={16} />
              {language === 'Tamil' ? 'பதிவிறக்கவும்' : 'Download Document'}
            </button>
          )}

          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'var(--danger-light)',
              border: '1px solid var(--danger-border)',
              borderRadius: '6px',
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
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--primary-deep)', fontWeight: 700 }}>
                    {report.title}
                  </h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Rural Healthcare Portal &bull; Medical Records Output
                  </p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <strong>{language === 'Tamil' ? 'தேதி' : 'Date'}:</strong> {report.report_date}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
                marginBottom: '1.5rem',
                paddingBottom: '1.5rem',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {language === 'Tamil' ? 'நோயாளி தகவல்' : 'Patient Demographic Info'}
                  </h4>
                  <p style={{ margin: '0.3rem 0', fontSize: '0.9rem' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>{language === 'Tamil' ? 'பெயர்' : 'Patient Name'}:</strong> {report.patient.name}
                  </p>
                  <p style={{ margin: '0.3rem 0', fontSize: '0.9rem' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>{language === 'Tamil' ? 'ID' : 'Patient ID'}:</strong> <span style={{ fontFamily: 'monospace' }}>{report.patient.id.slice(0, 10)}</span>
                  </p>
                </div>
                
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {language === 'Tamil' ? 'ஆபத்து நிலை' : 'Current Risk Status'}
                  </h4>
                  {(() => {
                    const badge = getRiskBadge(report.risk_level);
                    return (
                      <div style={{
                        padding: '0.85rem 1rem',
                        background: 'var(--bg-body)',
                        borderRadius: '8px',
                        border: '1px solid var(--border)'
                      }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>
                          {language === 'Tamil' ? 'தற்போதைய நிலை' : 'Classification'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {report.risk_level} Risk
                          </span>
                          <span className={`badge ${badge.class}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Latest Reading */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>
                  {language === 'Tamil' ? 'சமீபத்திய வாசிப்பு' : 'Most Recent Vital Telemetry'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  {Object.entries(report.latest_reading).map(([key, value]) => (
                    <div key={key} style={{
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-body)',
                      borderRadius: '8px',
                      border: '1px solid var(--border)'
                    }}>
                      <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'capitalize' }}>
                        {key.replace('_', ' ')}
                      </p>
                      <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7-Day Average */}
              <div>
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>
                  {language === 'Tamil' ? '7 நாள் சராசரி' : '7-Day Longitudinal Averages'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  {Object.entries(report.average_7_days).map(([key, value]) => (
                    <div key={key} style={{
                      padding: '0.75rem 1rem',
                      background: 'var(--primary-subtle)',
                      borderRadius: '8px',
                      border: '1px solid var(--border)'
                    }}>
                      <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.75rem', color: 'var(--primary-deep)', fontWeight: 600, textTransform: 'capitalize' }}>
                        {key.replace('_', ' ')}
                      </p>
                      <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileText size={36} style={{ color: 'var(--primary-deep)', opacity: 0.5, margin: '0 auto 0.75rem' }} />
              <p style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.98rem', margin: '0 0 0.25rem 0' }}>
                {language === 'Tamil' ? 'அறிக்கை தயாராக இல்லை' : 'No Report Generated Yet'}
              </p>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
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
