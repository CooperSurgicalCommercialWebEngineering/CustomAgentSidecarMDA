#!/usr/bin/env python3
"""Set or rotate the token broker's Dataverse Secure Configuration.

The Direct Line secret is read from the controlling terminal with echo disabled.
It is never accepted as a command-line argument, written to disk, or printed.
"""

from __future__ import annotations

import getpass
import os
import platform
import subprocess
import sys
from typing import Any

from auth import get_client, load_env


STEP_NAME = (
    "HRAgentSidecar.TokenBroker.DirectLineTokenBroker: "
    "maftagsc_GetDirectLineToken of any Entity"
)
STEP_TABLE = "sdkmessageprocessingstep"
SECURE_CONFIG_TABLE = "sdkmessageprocessingstepsecureconfig"
SECURE_CONFIG_LOOKUP = "_sdkmessageprocessingstepsecureconfigid_value"
SECURE_CONFIG_NAVIGATION = "sdkmessageprocessingstepsecureconfigid"


class SafeError(Exception):
    """An error message that is known not to contain secret material."""


def _find_step(client: Any) -> dict[str, Any]:
    result = client.records.list(
        STEP_TABLE,
        filter=f"name eq '{STEP_NAME}'",
        select=[
            "sdkmessageprocessingstepid",
            "name",
            SECURE_CONFIG_LOOKUP,
        ],
        top=2,
    )
    steps = [
        record.data if hasattr(record, "data") else record
        for record in result
    ]

    if not steps:
        raise SafeError(
            "The HR Agent Sidecar token-broker step was not found in this environment."
        )
    if len(steps) > 1:
        raise SafeError(
            "Multiple token-broker steps matched; refusing to choose one automatically."
        )

    return steps[0]


def _macos_hidden_prompt(prompt: str) -> str:
    apple_script = (
        'display dialog "' + prompt + '" '
        'default answer "" with hidden answer '
        'buttons {"Cancel", "Continue"} default button "Continue" '
        'cancel button "Cancel" with title "HR Agent Sidecar"\n'
        'return text returned of result'
    )
    try:
        result = subprocess.run(
            ["/usr/bin/osascript", "-e", apple_script],
            check=True,
            capture_output=True,
            text=True,
        )
    except subprocess.CalledProcessError as error:
        # Do not include subprocess output; it may contain sensitive material.
        raise SafeError("Secret entry was cancelled.") from error

    return result.stdout.rstrip("\r\n")


def _read_secret() -> str:
    if platform.system() == "Darwin":
        secret = _macos_hidden_prompt("Enter the Copilot Studio Direct Line secret.")
        confirmation = _macos_hidden_prompt("Enter the same secret again to confirm.")
    else:
        secret = getpass.getpass("Direct Line secret (input hidden): ")
        confirmation = getpass.getpass("Confirm Direct Line secret: ")

    if not secret:
        raise SafeError("The Direct Line secret cannot be empty.")
    if secret != secret.strip():
        raise SafeError("The Direct Line secret cannot begin or end with whitespace.")
    if secret != confirmation:
        raise SafeError("The two secret values did not match.")

    return secret


def main() -> int:
    load_env()
    environment_url = os.environ.get("DATAVERSE_URL", "").rstrip("/")
    if not environment_url:
        print("ERROR: DATAVERSE_URL is not configured.", file=sys.stderr)
        return 1

    print(f"Target environment: {environment_url}")
    confirmation = input("Type SET to continue: ").strip()
    if confirmation != "SET":
        print("Cancelled; no changes were made.")
        return 1

    client = get_client("dv-data")
    step = _find_step(client)
    step_id = step["sdkmessageprocessingstepid"]
    existing_config_id = step.get(SECURE_CONFIG_LOOKUP)
    secret = _read_secret()

    try:
        if existing_config_id:
            client.records.update(
                SECURE_CONFIG_TABLE,
                existing_config_id,
                {"secureconfig": secret},
            )
            action = "rotated"
        else:
            created_config_id = client.records.create(
                SECURE_CONFIG_TABLE,
                {"secureconfig": secret},
            )
            try:
                client.records.update(
                    STEP_TABLE,
                    step_id,
                    {
                        f"{SECURE_CONFIG_NAVIGATION}@odata.bind": (
                            f"/sdkmessageprocessingstepsecureconfigs({created_config_id})"
                        )
                    },
                )
            except Exception:
                # Do not leave an unattached secure-configuration record behind.
                client.records.delete(SECURE_CONFIG_TABLE, created_config_id)
                raise
            action = "attached"

            verified_step = _find_step(client)
            if not verified_step.get(SECURE_CONFIG_LOOKUP):
                raise SafeError("Secure Configuration could not be verified on the token-broker step.")
    finally:
        # Avoid retaining references longer than necessary. Python cannot guarantee
        # in-place erasure of immutable strings, so the process exits immediately.
        secret = ""

    print(f"Secure Configuration {action} successfully.")
    print("The secret was not printed or written to disk.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (EOFError, KeyboardInterrupt):
        print("\nCancelled; no changes were made.", file=sys.stderr)
        raise SystemExit(1)
    except SafeError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
    except Exception:
        # SDK exceptions can include request details. Never print them after a
        # secret-bearing operation, because that could disclose Secure Configuration.
        print(
            "ERROR: Secure Configuration could not be updated. "
            "No request details were printed.",
            file=sys.stderr,
        )
        raise SystemExit(1)
