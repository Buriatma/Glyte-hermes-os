export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Hermes OS Client runtime initialized
    const gatewayUrl = process.env.HERMES_GATEWAY_URL || "ws://localhost:9119";
    console.log(`[Hermes OS] Native Client initialized. Gateway target: ${gatewayUrl}`);
  }
}
