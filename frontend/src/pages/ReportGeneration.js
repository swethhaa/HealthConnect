import React, { useState } from 'react';
import api from '../api';
import { useUser } from '../context/UserContext';
import { Printer, FileText, Globe } from 'lucide-react';

const ReportGeneration = () => {
  const { user } = useUser();
  const [language, setLanguage] = useState('English');
  const [period, setPeriod] = useState('7 Days');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/generate-report', {
        params: { patient_id: user.id, language, period },
      });
      setReport(res.data);
    } catch (err) {
      setError('Error generating report. Please try again.');
      console.error(err);
    }
    setLoading(false);
  };

  const downloadPDF = () => {
    if (report) window.print();
  };

  const getRiskBadge = (level) => {
    if (level === 'High') return { label: 'High Risk', class: 'badge-danger' };
    if (level === 'Medium') return { label: 'Medium Risk', class: 'badge-warning' };
    return { label: 'Low Risk', class: 'badge-success' };
  };

  return (
    <div className="report-print-area" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
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
        <div className="card" data-print-hide="true">
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

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {language === 'Tamil' ? 'அறிக்கை காலம்' : 'Report Period'}
            </label>
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                setReport(null);
              }}
              style={{ marginBottom: 0 }}
            >
              <option value="Today">{language === 'Tamil' ? 'இன்று' : 'Today'}</option>
              <option value="7 Days">{language === 'Tamil' ? '7 நாட்கள்' : '7 Days'}</option>
              <option value="30 Days">{language === 'Tamil' ? '30 நாட்கள்' : '30 Days'}</option>
            </select>
          </div>

          <button
            type="button"
            onClick={generateReport}
            disabled={loading}
            data-print-hide="true"
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
              data-print-hide="true"
              style={{ width: '100%', marginTop: '0.75rem', padding: '0.7rem 1rem' }}
            >
              <Printer size={16} />
              {language === 'Tamil' ? 'PDF ஆக அச்சிடு / சேமி' : 'Print / Save as PDF'}
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
                    {language === 'Tamil' ? 'செயற்கைத் தரவுகள் இருக்கலாம்' : 'Synthetic demonstration data may be included'}
                  </p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <strong>{language === 'Tamil' ? 'தேதி' : 'Date'}:</strong> {report.report_date}
                </div>
              </div>

              {report.contains_simulated_data && (
                <div style={{
                  padding: '0.8rem 1rem',
                  marginBottom: '1.25rem',
                  border: '1px solid var(--warning-border)',
                  borderRadius: '8px',
                  background: 'var(--warning-light)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}>
                  {language === 'Tamil'
                    ? 'செயற்கை உருவகப்படுத்தப்பட்ட தரவுகள் அடங்கும் — மருத்துவ அளவீடோ அல்லது நோயறிதலோ அல்ல.'
                    : `Contains synthetic simulation data (${report.simulated_reading_count} reading(s) in the selected period${report.latest_reading_simulated ? ', including the latest reading' : ''}). These are not medical measurements or diagnoses.`}
                </div>
              )}
              {report.contains_unverified_data && (
                <div style={{ padding: '0.8rem 1rem', marginBottom: '1.25rem', border: '1px solid var(--warning-border)', borderRadius: '8px', background: 'var(--warning-light)', fontSize: '0.85rem' }}>
                  {language === 'Tamil'
                    ? 'சில பழைய பதிவுகளின் மூலம் தெரியவில்லை; அவை உறுதிப்படுத்தப்பட்ட உடல் அளவீடுகளாகக் கருதப்படக்கூடாது.'
                    : 'Some legacy readings have no recorded origin and cannot be verified as physical measurements.'}
                </div>
              )}

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
                    <strong style={{ color: 'var(--text-secondary)' }}>{language === 'Tamil' ? 'ID' : 'Patient ID'}:</strong> <span style={{ fontFamily: 'monospace' }}>{report.patient.id}</span>
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
                  {language === 'Tamil' ? 'சமீபத்திய வாசிப்பு' : 'Latest Reading'}
                </h3>
                <p style={{ margin: '0 0 0.75rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {report.latest_reading_timestamp
                    ? `${language === 'Tamil' ? 'நேரம்' : 'Timestamp'}: ${report.latest_reading_timestamp}`
                    : (language === 'Tamil' ? 'இதுவரை வாசிப்புகள் இல்லை' : 'No readings recorded yet')}
                  {report.latest_reading_simulated && ` · ${language === 'Tamil' ? 'செயற்கை' : 'Synthetic'} (${report.latest_simulation_mode})`}
                </p>
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
                        {value === null ? '--' : value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected-period averages */}
              <div>
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>
                  {language === 'Tamil' ? `தேர்ந்தெடுத்த கால சராசரி (${period})` : `Average for ${report.average_period}`}
                </h3>
                <p style={{ margin: '0 0 0.75rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {language === 'Tamil'
                    ? `${report.period_start} முதல் ${report.period_end} வரை · ${report.reading_count} வாசிப்புகள்`
                    : `${report.period_start} to ${report.period_end} · ${report.reading_count} reading(s)`}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  {Object.entries(report.averages).map(([key, value]) => (
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
                        {value === null ? '--' : value}
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
