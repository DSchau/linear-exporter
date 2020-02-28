const { stripIndent } = require('common-tags')

const getIssueType = issue => {
  const lookup = {
    Bug: `bug`,
    Feature: `feature`,
    fallback: `chore`
  }
  if (!issue.labels || !issue.labels.nodes) {
    return fallback
  }
  const type = issue.labels.nodes.find(label => {
    return lookup[label.name]
  })
  return lookup[type] || lookup.fallback
}

const sanitize = (str = ``) => `"${str.replace(/"/g, `'`).replace(/\n/g, '\\n')}"`

const getProjectId = issue => {
  const lookup = {
    'Cloud Platform': 3,
    'SS CMS': 4,
    'SS Off By One': 4,
    'Boaty McBuildFace': 4,
    fallback: 74
  }

  return lookup[issue.team.name] || lookup.fallback
}

module.exports = issues => stripIndent(`
project_id,name,story_type,description
${issues.map(issue => [
  74, // getProjectId(issue), // Automated import project
  sanitize(issue.title),
  getIssueType(issue),
  sanitize(issue.description || ``)
].join(',')).join('\n')}
`)
