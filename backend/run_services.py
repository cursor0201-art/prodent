import subprocess
import signal
import sys
import time


def stop_processes(processes):
    for name, process in reversed(processes):
        if process.poll() is None:
            print(f"Stopping {name}...", flush=True)
            process.terminate()

    for _, process in reversed(processes):
        if process.poll() is None:
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()


def main():
    def handle_shutdown(_signum, _frame):
        raise KeyboardInterrupt

    signal.signal(signal.SIGTERM, handle_shutdown)
    signal.signal(signal.SIGINT, handle_shutdown)

    processes = []
    try:
        redis = subprocess.Popen(
            ["redis-server", "--daemonize", "no", "--save", "", "--appendonly", "no"]
        )
        processes.append(("redis", redis))

        deadline = time.monotonic() + 30
        while time.monotonic() < deadline:
            if redis.poll() is not None:
                raise RuntimeError(f"Redis exited with status {redis.returncode}")
            ping = subprocess.run(
                ["redis-cli", "ping"], capture_output=True, text=True, check=False
            )
            if ping.returncode == 0 and ping.stdout.strip() == "PONG":
                break
            time.sleep(0.25)
        else:
            raise RuntimeError("Redis did not become ready within 30 seconds")

        subprocess.run([sys.executable, "manage.py", "migrate", "--noinput"], check=True)
        subprocess.run([sys.executable, "manage.py", "seed_data"], check=True)

        services = [
            (
                "celery-worker-and-beat",
                [
                    "celery", "-A", "core", "worker", "--beat",
                    "--pool=solo", "--concurrency=1",
                    "--without-gossip", "--without-mingle", "--without-heartbeat",
                    "--loglevel=info",
                ],
            ),
            (
                "gunicorn",
                ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "1"],
            ),
        ]
        for name, command in services:
            process = subprocess.Popen(command)
            processes.append((name, process))
            print(f"Started {name} (pid={process.pid})", flush=True)

        while True:
            for name, process in processes:
                exit_code = process.poll()
                if exit_code is not None:
                    raise RuntimeError(f"{name} exited with status {exit_code}")
            time.sleep(1)
    except KeyboardInterrupt:
        return 0
    except (RuntimeError, subprocess.CalledProcessError) as error:
        print(f"Service startup/runtime failure: {error}", file=sys.stderr, flush=True)
        return 1
    finally:
        stop_processes(processes)


if __name__ == "__main__":
    sys.exit(main())