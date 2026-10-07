import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FieldProtocolSchema, ObservationSchema } from "@/lib/schemas";
import { createReport } from "@/lib/ai/debrief";

const DebriefInputSchema = z.object({
  protocol: FieldProtocolSchema,
  observations: z.array(ObservationSchema),
  photos: z
    .array(
      z.object({
        id: z.string().min(1),
        dataUrl: z.string().min(1),
      })
    )
    .optional()
    .default([]),
});

export async function POST(req: NextRequest) {
  const reqStart = performance.now();
  console.log(`[OpenField] debrief request started`);

  try {
    const body = await req.json();
    const parseResult = DebriefInputSchema.safeParse(body);

    if (!parseResult.success) {
      console.log(`[OpenField] debrief input validation failed: 400 Bad Request`);
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid debrief input parameters.",
            details: parseResult.error.issues.map((i) => i.message).join(", "),
          },
        },
        { status: 400 }
      );
    }

    const result = await createReport(parseResult.data);
    const totalRequestTime = Math.round(performance.now() - reqStart);

    if (!result.success) {
      console.log(
        `[OpenField] debrief request failed (${result.error.code}) in ${totalRequestTime}ms`
      );
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

    console.log(`[OpenField] debrief total request time: ${totalRequestTime}ms`);
    return NextResponse.json({ report: result.report }, { status: 200 });
  } catch (err) {
    const totalRequestTime = Math.round(performance.now() - reqStart);
    console.log(`[OpenField] debrief request threw unhandled error in ${totalRequestTime}ms`);
    return NextResponse.json(
      {
        error: {
          code: "INVALID_MODEL_OUTPUT",
          message: "Internal server error while processing debrief request.",
          details: err instanceof Error ? err.message : String(err),
        },
      },
      { status: 500 }
    );
  }
}
