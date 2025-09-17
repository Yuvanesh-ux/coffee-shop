import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();

    if (!command) {
      return NextResponse.json(
        { error: "Command parameter required" },
        { status: 400 }
      );
    }

    // Only allow a fixed set of diagnostic commands (example: 'ping', 'status')
    const allowedCommands = {
      ping: () => 'pong',
      status: () => 'ok',
    };

    if (!(typeof command === 'string' && command in allowedCommands)) {
      return NextResponse.json(
        { error: "Invalid or unauthorized command" },
        { status: 400 }
      );
    }

    const result = allowedCommands[command]();

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
