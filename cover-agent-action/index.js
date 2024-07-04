const core = require('@actions/core');
const github = require('@actions/github');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
const { spawn, spawnSync } = require("child_process");
async function run() {
  try {

    // TODO: install cover-agent cli on ga runner using code
    // TODO: need to export the azure open ai env too
    const directory = core.getInput('sourceDir');
    const desiredCoverage = parseFloat(core.getInput('desiredCoverage'));
    const maxIterations = parseInt(core.getInput('maxIterations'));
    const modelName = core.getInput('modelName');
    const apiEndpoint = core.getInput('apiEndpoint');
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

    runTestGen({
      baseDir: directory,
      desiredCoverage: desiredCoverage,
      maxIterations: maxIterations,
      modelName: modelName,
      apiEndpoint: apiEndpoint,
      baseSha: baseSha,
      headSha: headSha
    })
    // Output the list of changed files
    // core.setOutput('changes', JSON.stringify(changes));
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function runTestGen(opts) {
  console.log(opts)

  const git = simpleGit(opts.baseDir);
  const diffSummary = await git.diffSummary([`${opts.baseSha}..${opts.headSha}`]);

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
    absltSrcPath = path.resolve(srcFile)
    parsedPath = path.parse(absltSrcPath)
    relatedTestFile = path.join(parsedPath.dir, `${parsedPath.name}_test.go`)
    testFileExists = fs.existsSync(relatedTestFile)
    return { srcFile: absltSrcPath, relatedTestFile: relatedTestFile, testFileExists: testFileExists, dir: parsedPath.dir }
  })

  console.log(sourceFilesWithTest);

  sourceFilesWithTest.forEach(detail => {
    cmdOpts = []
    cmdOpts.push("--source-file-path")
    cmdOpts.push(`"${detail.srcFile}"`)
    cmdOpts.push("--test-file-path")
    cmdOpts.push(`"${detail.relatedTestFile}"`)
    cmdOpts.push("--test-command")
    cmdOpts.push(`"go test -coverprofile=/tmp/coverage.out && gocov convert /tmp/coverage.out | gocov-xml > /tmp/coverage.xml"`)
    cmdOpts.push("--code-coverage-report-path")
    cmdOpts.push("/tmp/coverage.xml")
    cmdOpts.push("--test-command-dir")
    cmdOpts.push(`"${detail.dir}"`)
    cmdOpts.push("--coverage-type")
    cmdOpts.push("cobertura")
    cmdOpts.push("--desired-coverage")
    cmdOpts.push(opts.desiredCoverage)
    cmdOpts.push("--max-iterations")
    cmdOpts.push(opts.maxIterations)
    cmdOpts.push("--model")
    cmdOpts.push(opts.modelName)
    if (cmdOpts.hasOwnProperty("apiEndpoint")) {
      cmdOpts.push("--api-base")
      cmdOpts.push(`"${opts.apiEndpoint}"`)
    }
    runCoverAgent(cmdOpts)
  });

}

async function runCoverAgent(cmdOpts) {
  // console.log(cmdOpts)
  console.log(`cover-agent ${cmdOpts.join(" ")}`)
  // const res = spawnSync("cover-agent", cmdOpts, {
  //   encoding: 'utf8',
  //   shell: true,
  // });
  // console.log(res.stdout)
  // console.log(res.stderr)
  // console.log(res.error)
  // console.log(res.status)

  const cmd = spawn("cover-agent", cmdOpts);
  cmd.stdout.on("data", data => {
    process.stdout.write(data)
  });

  cmd.stderr.on("data", data => {
    process.stderr.write(data)
  });

  cmd.on('error', (error) => {
    console.log(`error: ${error.message}`);
  });

  await new Promise((resolve) => {
    cmd.on("close", code => {
      console.log(`cover-agent exited with code ${code}`);
    });
  })
}

runTestGen({
  baseDir: ".",
  desiredCoverage: 70,
  maxIterations: 1,
  modelName: "azure/DevProdEnhancers",
  apiEndpoint: "https://devprodenhancers.openai.azure.com/",
  baseSha: "01516762d7725bed80736af21fe3d1c6eb70d05a",
  headSha: "0ed0f72119096cecfcc5510e5f1ddb581117a7be"
})

// run();
