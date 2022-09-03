import { NextApiRequest, NextApiResponse } from "next"

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const code = req.query.code
  if (code === undefined) {
    return res.status(400).json({ error: "Missing Code" })
  }
  const github = await fetch(`https://github.com/login/oauth/access_token?client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=${code}`)
    .then(r => r.text())
    .then(t => new URLSearchParams(t))

  if (github.has("error")) {
    return res.status(400).json({ error: github.get("error"), error_description: github.get("error_description") })
  }

  const accessToken = github.get("access_token")
  if (accessToken === null) {
    return res.status(400).json({ error: "Missing Access Token" })
  }

  // const authUser = await fetch(`https://api.github.com/user`, { headers: { "Authorization": `token ${accessToken}` } })
  //   .then(r => r.json())
  // if (authUser.id === undefined) {
  //   return res.status(500).json({ error: "Error Authenticating User" })
  // }
  // authUser.id
  res.status(200).json({ token: accessToken })
}

export default handler