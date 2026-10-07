import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { hasValidSession } from "../lib/auth.js";

const compressedDataset = gzipSync(
  readFileSync(
    new URL("../private-data/porto_alegre_votos.json", import.meta.url),
  ),
);

export default function handler(request, response) {
  response.setHeader("Cache-Control", "private, no-store");

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).end();
    return;
  }

  try {
    if (!hasValidSession(request)) {
      response.status(401).json({
        error: "Autenticação necessária.",
      });
      return;
    }

    response.setHeader("Content-Type", "application/json; charset=utf-8");

    response.setHeader("Content-Encoding", "gzip");

    response.setHeader("Content-Length", compressedDataset.length);

    response.status(200).send(compressedDataset);
  } catch (error) {
    console.error("Porto Alegre map data access error:", error);

    response.status(500).json({
      error: "Não foi possível carregar os dados de Porto Alegre.",
    });
  }
}
