// src/services/atsService.js
/**
 * ATS service: run checks on resume data and return a report.
 */

/**
 * Perform ATS compatibility checks on resume data.
 * @param {Object} data - Resume JSON structure
 * @returns {Object} report with scores and feedback
 */
export function runChecks(data) {
  // Example implementation: check for required sections
  const requiredSections = ['experience', 'education', 'skills'];
  const report = {
    scores: {},
    missingSections: [],
    recommendations: [],
  };

  requiredSections.forEach(section => {
    if (!data[section] || (Array.isArray(data[section]) && data[section].length === 0)) {
      report.scores[section] = 0;
      report.missingSections.push(section);
      report.recommendations.push(`Add a valid ${section} section.`);
    } else {
      report.scores[section] = 1;
    }
  });

  // Overall score
  const total = Object.values(report.scores).reduce((sum, v) => sum + v, 0);
  report.overallScore = (total / requiredSections.length) * 100;

  return report;
}
export default { runChecks };