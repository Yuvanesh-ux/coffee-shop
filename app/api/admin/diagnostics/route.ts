import { NextRequest, NextResponse } from "next/server";

// Define a whitelist of allowed diagnostic commands
const ALLOWED_COMMANDS = [
  "ping",
  "uptime",
  "status"
];

function runDiagnosticCommand(command: string): string {
  switch (command) {
    case "ping":
      return "pong";
    case "uptime":
      return `${process.uptime()}s`;
    case "status":
      return "OK";
    default:
      throw new Error("Invalid command");
  }
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

    if (!ALLOWED_COMMANDS.includes(command)) {
      return NextResponse.json(
        { error: "Invalid command" },
        { status: 400 }
      );
    }

    const result = runDiagnosticCommand(command);

    return NextResponse.json({
      command: command,
      result: result,
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
