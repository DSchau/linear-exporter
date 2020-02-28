require('dotenv').config();
const axios = require('axios');
const fs = require('fs-extra');
const limax = require('limax')
const path = require('path')

const template = require('./template');

async function exportDataFromLinear() {
  const issueFragment = `
    id
    title
    priority
    estimate
    createdAt
    updatedAt
    description
    team {
      name
    }
    creator {
      name
      email
    }
    state {
      name
    }
    project {
      name
    }
    labels {
      nodes {
        name
      }
    }
  `;
  let after = {};
  let issues = [];

  while (true) {
    const { data: postData } = await axios.post(
      `https://api.linear.app/graphql`,
      {
        query: `
    {
      issues(first: 50${after.id ? `, after: "${after.id}"` : ``}) {
        nodes {
          ${issueFragment}
          children {
            nodes {
              # note, we're not really using these yet
              ${issueFragment}
            }
          }
        }
      }
    }
    `
      },
      {
        headers: {
          Authorization: process.env.API_KEY
        }
      }
    );

    issues = issues.concat(postData.data ? postData.data.issues.nodes : []);
    const latestAfter = postData.data
      ? postData.data.issues.nodes.slice(-1).pop()
      : null;

    /*
     * I think Linear's API has a bug
     * It "loops" on the last id with first: 50
     * so when we see the same one twice, we're done
     */
    if (latestAfter.id === after.id || !latestAfter) {
      break;
    }

    after = latestAfter;
  }

  const teams = issues
  .reduce((merged, issue) => {
    const teamName = limax(issue.team.name)
    const projectName = limax(issue.project ? issue.project.name : `unassigned`)
    if (!merged[teamName]) {
      merged[teamName] = {}
    }

    if (!merged[teamName][projectName]) {
      merged[teamName][projectName] = []
    }

    if (issue.state.name !== `Done` && issue.state.name !== `Cancelled`) {
      merged[teamName][projectName].push(Object.assign({}, issue, {
        project: Object.assign(issue.project || {}, {
          name: projectName
        })
      }))
    }

    return merged
  }, {})

  await Promise.all(
    Object.keys(teams)
      .map(teamName => {
        const projects = teams[teamName]

        return Promise.all(
          Object.keys(projects)
            .map(projectName => {
              const project = projects[projectName]
              return fs.mkdirp(path.join('data', teamName))
                .then(() => {
                  return fs.writeFile(
                    path.join('data', teamName, `${projectName}.csv`),
                    template(project, 'utf8')
                  )
                })
            })
        )
      })
  )
}

exportDataFromLinear();
