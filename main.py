import os

from git import Repo


def main():
    source_dir = os.curdir
    if "INPUT_SOURCEDIR" in os.environ:
        source_dir = os.environ["INPUT_SOURCEDIR"]
    # print(f"Executing in {source_dir} directory")

    # get changed files
    repo = Repo(source_dir)
    print(repo.head.commit.diff("main"))


def set_github_action_output(output_name, output_value):
    f = open(os.path.abspath(os.environ["GITHUB_OUTPUT"]), "a")
    f.write(f"{output_name}={output_value}")
    f.close()


if __name__ == "__main__":
    main()
