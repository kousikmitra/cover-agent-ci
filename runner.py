import subprocess
import time


class Runner:
    @staticmethod
    def run_command(command, cwd=None):
        # Ensure the command is executed with shell=True for string commands
        result = subprocess.run(
            command, shell=True, cwd=cwd, text=True, capture_output=True
        )

        return result.stdout, result.stderr, result.returncode
