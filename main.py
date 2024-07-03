import os

from git import Repo


def main():
    source_dir = os.curdir
    if "INPUT_SOURCEDIR" in os.environ:
        source_dir = os.environ["INPUT_SOURCEDIR"]
    print(f"Executing in {source_dir} directory")

    # get changed files
    files_changed = get_changed_files(source_dir)
    print(files_changed)


def get_changed_files(source_dir):
    repo = Repo(source_dir)
    diff = repo.head.commit.diff("main")

    files_changed = []

    for diff_item in diff:
        if diff_item.a_blob and diff_item.b_blob:  # Check if the blob exists
            file_path = diff_item.a_blob.path  # Path to the file
            change_type = diff_item.change_type

            files_changed.append((file_path, change_type))
    return files_changed


def set_github_action_output(output_name, output_value):
    f = open(os.path.abspath(os.environ["GITHUB_OUTPUT"]), "a")
    f.write(f"{output_name}={output_value}")
    f.close()


if __name__ == "__main__":
    main()
