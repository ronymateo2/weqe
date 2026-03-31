import { NextResponse } from "next/server";
import { getDropTypesAction } from "@/lib/actions/drops";

export async function GET() {
  const result = await getDropTypesAction();
  const statusCode = result.ok ? 200 : result.message.includes("iniciar sesion") ? 401 : 500;

  return NextResponse.json(
    {
      ok: result.ok,
      message: result.message,
      dropTypes: result.dropTypes
    },
    { status: statusCode }
  );
}
