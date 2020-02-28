require('dotenv').config()
const axios = require('axios')
const fs = require('fs-extra')

const template = require('./template')

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
  `
  let after = {}
  let issues = []
  while (true) {
    const { data: postData } = await axios.post(`https://api.linear.app/graphql`, { "query": `
    {
      issues(first: 50${after.id ? `, after: "${after.id}"` : ``}) {
        nodes {
          ${issueFragment}
          children {
            nodes {
              ${issueFragment}
            }
          }
        }
      }
    }
    ` }, {
      headers: {
        Authorization: process.env.API_KEY
      } 
    })

    issues = issues.concat(postData.data ? postData.data.issues.nodes.filter(node => node.state.name !== `Done`) : [])
    const latestAfter = postData.data ? postData.data.issues.nodes.slice(-1).pop() : null

    /*
     * I think Linear's API has a bug
     * It "loops" on the last id with first: 50
     * so when we see the same one twice, we're done
     */
    if (latestAfter.id === after.id || !latestAfter) {
      break
    }

    after = latestAfter
  }

  const csv = template(issues)
  
  await fs.writeFile(`data.csv`, csv, 'utf8')
}

exportDataFromLinear()
