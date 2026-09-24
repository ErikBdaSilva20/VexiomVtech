import { requireSuperAdmin } from "@/lib/auth/require-super-admin"
import { decryptContractFile } from "@/lib/contracts/decrypt-contract-file"
import { fetchContract } from "@/lib/contracts/fetch-contract"
import { logContractAccess } from "@/lib/contracts/log-contract-access"
import { createClient } from "@/lib/supabase/server"

const BUCKET = "contracts"
const ROLE_DENIED_MESSAGE = "Apenas super_admin pode baixar contratos."

/**
 * Streams a contract's decrypted PDF back to the caller and records the
 * access. Backend-only per the spec — no UI here, Codex wires a
 * download link/button to this route.
 *
 * Order matters for the "no storage/DB read at all" requirement on a
 * non-super_admin caller: `requireSuperAdmin` runs before any `fetchContract`
 * or storage call.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSuperAdmin(ROLE_DENIED_MESSAGE)
    if (!auth.ok) {
      return new Response(auth.error, { status: 403 })
    }

    const { id } = await params
    const supabase = await createClient()

    const contract = await fetchContract(supabase, id)
    if (!contract || !contract.file_object_path) {
      return new Response("Contrato ou arquivo não encontrado.", { status: 404 })
    }

    const { data: encryptedBlob, error: downloadError } = await supabase.storage
      .from(BUCKET)
      .download(contract.file_object_path)

    if (downloadError || !encryptedBlob) {
      console.error("GET /painel-8f2k/contratos/[id]/download: failed to download file", id, downloadError)
      return new Response("Não foi possível recuperar o arquivo do contrato.", { status: 500 })
    }

    let plaintext: Buffer
    try {
      const encryptedBuffer = Buffer.from(await encryptedBlob.arrayBuffer())
      plaintext = decryptContractFile(encryptedBuffer)
    } catch (error) {
      console.error("GET /painel-8f2k/contratos/[id]/download: failed to decrypt file", id, error)
      return new Response("Não foi possível recuperar o arquivo do contrato.", { status: 500 })
    }

    try {
      await logContractAccess(supabase, id, auth.admin.id)
    } catch (error) {
      // Fail-open per the spec: a lost audit row never blocks a legitimate
      // super_admin from a contract they're authorized to read.
      console.error("GET /painel-8f2k/contratos/[id]/download: failed to log access", id, error)
    }

    return new Response(new Uint8Array(plaintext), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="contrato-${id}.pdf"`,
        // Never let the decrypted plaintext be cached anywhere (browser,
        // proxy, CDN) — same "in memory only, for this request" guarantee
        // as never writing it to disk.
        "Cache-Control": "no-store, private",
      },
    })
  } catch (error) {
    console.error("GET /painel-8f2k/contratos/[id]/download: unexpected failure", error)
    return new Response("Não foi possível processar o download do contrato.", { status: 500 })
  }
}
