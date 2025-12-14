import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const host = request.headers.get("host") || "localhost:5555";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const card = {
    name: "Chef Agent",
    description: "Kitchen Display System and Kitchen Management Agent",
    version: "1.0.0",
    homepage: `${baseUrl}/kitchen`,
    capabilities: [
      {
        type: "protocol",
        name: "a2a",
        version: "1.0",
        endpoints: [
          {
            type: "http",
            url: `${baseUrl}/api/a2a`,
            method: "POST"
          }
        ]
      },
      {
        type: "feature",
        name: "kitchen-display",
        description: "Real-time order management for kitchen staff"
      }
    ],
    authors: ["Charan Chatakondu"],
    license: "MIT"
  };

  return NextResponse.json(card);
}
