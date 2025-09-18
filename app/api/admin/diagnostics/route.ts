import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware";

// Allowed commands whitelist for diagnostics
const allowedCommands = new Set([
  "Date.now()",
  "new Date().toISOString()",
  "Math.random()",
  "process.version",
  "process.platform",
]);

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const { command } = await request.json();

    if (!command) {
      return NextResponse.json(
        { error: "Command parameter required" },
        { status: 400 }
      );
    }

    // Validate command against whitelist
    if (!allowedCommands.has(command)) {
      return NextResponse.json(
        { error: "Invalid or unauthorized command" },
        { status: 403 }
      );
    }

    // Execute the allowed command safely
    let result;
    switch (command) {
      case "Date.now()":
        result = Date.now();
        break;
      case "new Date().toISOString()":
        result = new Date().toISOString();
        break;
      case "Math.random()":
        result = Math.random();
        break;
      case "process.version":
        result = process.version;
        break;
      case "process.platform":
        result = process.platform;
        break;
      default:
        // Should never reach here due to whitelist check
        return NextResponse.json(
          { error: "Command execution error" },
          { status: 500 }
        );
    }

    return NextResponse.json({
      command: command,
      result: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Admin access required")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("Diagnostics error:", error);
    return NextResponse.json(
      { error: "Diagnostic command failed" },
      { status: 500 }
    );
  }
}
