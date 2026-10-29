import { Metadata } from "next";
import { SecretManager } from "@/components/hermes/SecretManager";

export const metadata: Metadata = {
  title: "Secret Vault | GlyteOS Hermes",
  description: "In-UI credential vault managing ~/.hermes/.env with OpenClaw security patterns",
};

export default function SecretsPage() {
  return <SecretManager />;
}
