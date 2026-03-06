import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/strava";

export async function GET() {
  return NextResponse.redirect(getAuthUrl());
}
