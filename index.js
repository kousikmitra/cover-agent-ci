const core = require('@actions/core');
const github = require('@actions/github');
const simpleGit = require('simple-git');

async function run() {
  try {
    const directory = core.getInput('directory');
    const context = github.context;
    const { owner, repo } = context.repo;

    if (!context.payload.pull_request) {
      core.setFailed('This action can only run on pull requests.');
      return;
    }

    const prNumber = context.payload.pull_request.number;
    const token = core.getInput('github-token');
    const octokit = github.getOctokit(token);

    // Fetch the PR details
    const { data: pr } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    const baseSha = pr.base.sha;
    const headSha = pr.head.sha;

    const git = simpleGit();

    // Fetch the changes between the base and head of the PR
    const diffSummary = await git.diffSummary([`${baseSha}..${headSha}`]);

    // Filter the changes to only include files in the specified directory
    const changes = diffSummary.files.filter(file => file.file.startsWith(directory));

    // Output the list of changed files
    core.setOutput('changes', JSON.stringify(changes));
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
