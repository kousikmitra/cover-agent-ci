const core = require('@actions/core');
const github = require('@actions/github');
const simpleGit = require('simple-git');
const path = require('path')
const fs = require('fs')

async function run() {
  try {
    const directory = core.getInput('sourceDir');
    console.log(directory)
    const context = github.context;
    const { owner, repo } = context.repo;

    if (!context.payload.pull_request) {
      core.setFailed('This action can only run on pull requests.');
      return;
    }

    const prNumber = context.payload.pull_request.number;
    const token = core.getInput('githubToken');
    const octokit = github.getOctokit(token);


    // Fetch the PR details
    const { data: pr } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    const baseSha = pr.base.sha;
    const headSha = pr.head.sha;

    runCoverAgent(baseSha, headSha)
    // Output the list of changed files
    core.setOutput('changes', JSON.stringify(changes));
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function runCoverAgent(baseSha, headSha) {
  const git = simpleGit();
  const diffSummary = await git.diffSummary([`${baseSha}..${headSha}`]);

  const changes = diffSummary.files.filter(change => {
    ext = path.extname(change.file)
    if (ext !== ".go") {
      return false
    }
    if (change.file.endsWith("_test.go")) {
      return false
    }
    return true
  });

  const sourceFiles = changes.map(change => change.file)

  sourceFilesWithTest = sourceFiles.map(srcFile => {
    parsedPath = path.parse(srcFile)
    relatedTestFile = path.join(parsedPath.dir, `${parsedPath.name}_test.go`)
    testFileExists = fs.existsSync(relatedTestFile)
    return { srcFile: srcFile, relatedTestFile: relatedTestFile, testFileExists: testFileExists }
  })

  console.log(sourceFilesWithTest);
}

runCoverAgent("f79ee5726d944f6a6c5007bad24262abc4aa3b83", "52b990cf12bfb73f2d51750c2fbcda6d589fed41")

// run();
