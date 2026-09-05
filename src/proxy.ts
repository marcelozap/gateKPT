import { NextResponse } from "next/server";

const maintenancePage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Under construction</title>
    <meta name="description" content="This site is under construction.">
    <style>
      * { box-sizing: border-box; }
      html { color-scheme: dark; }
      body {
        margin: 0;
        min-height: 100svh;
        display: grid;
        place-items: center;
        padding: 32px;
        background: #070a10;
        color: #f3f4f6;
        font-family: Arial, Helvetica, sans-serif;
      }
      main { text-align: center; }
      h1 {
        margin: 0;
        font-size: clamp(32px, 7vw, 72px);
        font-weight: 500;
        line-height: 1.15;
        text-wrap: balance;
      }
    </style>
  </head>
  <body><main><h1>Under construction</h1></main></body>
</html>`;

// Keep the previous site saved while every public route is offline.
// Remove this proxy when the replacement site is ready to launch.
export function proxy() {
  return new NextResponse(maintenancePage, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Retry-After": "3600",
    },
  });
}
