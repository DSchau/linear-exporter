const { stripIndent } = require('common-tags');

const getIssueType = issue => {
  const lookup = {
    Bug: `bug`,
    Feature: `feature`,
    fallback: `chore`
  };
  if (!issue.labels || !issue.labels.nodes) {
    return fallback;
  }
  const type = issue.labels.nodes.find(label => {
    return lookup[label.name];
  });
  return lookup[type] || lookup.fallback;
};

const sanitize = (str = ``) => `"${str.replace(/"/g, `'`)}"`;

const getProjectId = issue => {
  const lookup = {
    'Cloud Platform': 3,
    'Core Team': 4,
    'Design': 677,
    'Learning': 2,
    'SS CMS': 138,
    'SS Off by One': 136,
    'Boaty McBuildFace': 137,
    fallback: 74
  };

  return lookup[issue.team.name] || lookup.fallback;
};

module.exports = issues =>
  stripIndent(`
project_id,name,story_type,description
${issues
  .map(issue =>
    [
      getProjectId(issue), // Automated import project
      sanitize(issue.title),
      getIssueType(issue),
      sanitize(issue.description || ``)
    ].join(',')
  )
  .join('\n')}
`);
