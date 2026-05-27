// =============================================================================
//  Vercel API — /api/check-update
//  Menjadi perantara antara Electron Launcher dan GitHub private repo.
//
//  Flow:
//    Launcher → POST /api/check-update  (kirim x-secret-key)
//             → Vercel cek env LAUNCHER_SECRET_KEY
//             → Vercel fetch version.json dari GitHub (pakai GITHUB_TOKEN)
//             → Return { version, notes, changes, downloadToken }
//
//  Env vars yang harus di-set di Vercel Dashboard:
//    LAUNCHER_SECRET_KEY  — secret yang disimpan di launcher (bukan GitHub token)
//    GITHUB_TOKEN         — token akun bot (read-only, kolaborator repo private)
//    GITHUB_USER          — username akun utama (pemilik repo)
//    GITHUB_REPO          — nama repo private
// =============================================================================

export default async function handler(req, res) {
  // Hanya terima GET dan POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── Auth: cek secret key dari header atau body ────────────────────────────
  const secretKey =
    req.headers['x-secret-key'] ||
    (req.body && req.body.secretKey) ||
    null

  if (!secretKey || secretKey !== process.env.LAUNCHER_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // ── Ambil env vars ────────────────────────────────────────────────────────
  const githubToken = process.env.GITHUB_TOKEN
  const githubUser  = process.env.GITHUB_USER
  const githubRepo  = process.env.GITHUB_REPO

  if (!githubToken || !githubUser || !githubRepo) {
    console.error('[check-update] Missing env vars')
    return res.status(500).json({ error: 'Server misconfigured' })
  }

  // ── Fetch version.json dari GitHub raw content ───────────────────────────
  const versionUrl = `https://raw.githubusercontent.com/${githubUser}/${githubRepo}/main/version.json`

  let versionData
  try {
    const ghRes = await fetch(versionUrl, {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'User-Agent':    'PerpusApp-VercelProxy/1.0',
        'Accept':        'application/vnd.github.v3.raw',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!ghRes.ok) {
      console.error(`[check-update] GitHub responded ${ghRes.status}`)
      return res.status(502).json({
        error: `GitHub responded with ${ghRes.status}`,
      })
    }

    versionData = await ghRes.json()
  } catch (err) {
    console.error('[check-update] Fetch error:', err.message)
    return res.status(502).json({ error: `Failed to reach GitHub: ${err.message}` })
  }

  // ── Return data ke launcher ───────────────────────────────────────────────
  // downloadToken = GitHub token yang dipakai update.ps1 untuk download zip.
  // Token ini hanya dikirim ke launcher yang sudah terauthentikasi via secretKey.
  return res.status(200).json({
    version:       versionData.version   || '0.0.0',
    updated_at:    versionData.updated_at || '',
    notes:         versionData.notes      || '',
    changes:       versionData.changes    || { frontend: true, backend: true },
    downloadToken: githubToken,           // bot token, hanya untuk download ZIP
    repoZipUrl:    `https://github.com/${githubUser}/${githubRepo}/archive/refs/heads/main.zip`,
  })
}
