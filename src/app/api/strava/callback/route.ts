import { NextRequest, NextResponse } from "next/server";
import { exchangeToken, fetchAllActivities } from "@/lib/strava";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  try {
    // Exchange code for token
    const tokenData = await exchangeToken(code);
    console.log(`Authenticated as: ${tokenData.athlete.firstname} ${tokenData.athlete.lastname}`);

    // Fetch all activities
    console.log("Fetching all activities...");
    const allActivities = await fetchAllActivities(tokenData.access_token);
    console.log(`Total activities: ${allActivities.length}`);

    console.log(`Total activities: ${allActivities.length}`);

    const dataDir = path.join(process.cwd(), "data");
    await mkdir(dataDir, { recursive: true });

    await writeFile(
      path.join(dataDir, "activities.json"),
      JSON.stringify(allActivities, null, 2)
    );

    await writeFile(
      path.join(dataDir, "athlete.json"),
      JSON.stringify(tokenData.athlete, null, 2)
    );

    // Also save refresh token for future updates
    await writeFile(
      path.join(dataDir, ".tokens.json"),
      JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
      })
    );

    return NextResponse.json({
      success: true,
      athlete: `${tokenData.athlete.firstname} ${tokenData.athlete.lastname}`,
      totalActivities: allActivities.length,
      message: `Saved ${allActivities.length} activities to data/activities.json`,
    });
  } catch (error) {
    console.error("Strava callback error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
