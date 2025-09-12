import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

// Helper function to validate allowed diagnostic commands
function isValidDiagnosticCommand(command: string): boolean {
  // Only allow alphanumeric, dashes, underscores, spaces, and a few safe commands (e.g., 'uptime', 'df', 'free', 'top', 'ps', 'whoami', 'uname', 'ls', 'cat /proc/cpuinfo', etc.)
  // Disallow any command chaining, pipes, semicolons, or redirection
  // You can expand the allowed commands as needed
  const allowedCommands = [
    "uptime",
    "df",
    "free",
    "top",
    "ps",
    "whoami",
    "uname",
    "ls",
    "cat /proc/cpuinfo",
    "cat /proc/meminfo",
    "cat /etc/os-release"
  ];
  // Trim and normalize whitespace
  const normalized = command.trim().replace(/\s+/g, ' ');
  // Check for dangerous characters
  if (/[^a-zA-Z0-9_\-\/\. ]/.test(normalized)) {
    return false;
  }
  // Only allow exact matches to allowed commands
  return allowedCommands.includes(normalized);
}

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();

    if (!command) {
      return NextResponse.json(
        { error: "Command parameter required" },
        { status: 400 }
      );
    }

    if (!isValidDiagnosticCommand(command)) {
      return NextResponse.json(
        { error: "Invalid or unsupported command. Only specific diagnostic commands are allowed." },
        { status: 400 }
      );
    }

    // Split command and args if needed (e.g., for 'cat /proc/cpuinfo')
    const [cmd, ...args] = command.trim().replace(/\s+/g, ' ').split(' ');

    // Only allow commands from the whitelist, with fixed arguments
    const child = spawn(cmd, args);

    let output = '';
    let errorOutput = '';
    for await (const chunk of child.stdout) {
      output += chunk;
    }
    for await (const chunk of child.stderr) {
      errorOutput += chunk;
    }

    const exitCode = await new Promise((resolve) => {
      child.on('close', resolve);
    });

    if (exitCode !== 0) {
      return NextResponse.json({ error: errorOutput || "Command failed" }, { status: 500 });
    }

    return NextResponse.json({
      command: command,
      result: output,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Diagnostics error:", error);
    return NextResponse.json(
      { error: "Diagnostic command failed" },
      { status: 500 }
    );
  }
}
