import { NextRequest, NextResponse } from "next/server";
import { StudyInputSchema } from "@/lib/schemas";
import { createProtocol } from "@/lib/ai/protocol";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = StudyInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid study input parameters.",
            details: parseResult.error.issues.map((i) => i.message).join(", "),
          },
        },
        { status: 400 }
      );
    }

    const result = await createProtocol(parseResult.data);

    if (!result.success) {
      const statusCode =
        result.error.code === "OLLAMA_UNREACHABLE"
          ? 503
          : result.error.code === "MODEL_NOT_FOUND"
          ? 404
          : result.error.code === "TIMEOUT"
          ? 504
          : 502;

      return NextResponse.json({ error: result.error }, { status: statusCode });
    }

    return NextResponse.json({ protocol: result.protocol }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_MODEL_OUTPUT",
          message: "Internal server error while processing study request.",
          details: err instanceof Error ? err.message : String(err),
        },
      },
      { status: 500 }
    );
  }
}
