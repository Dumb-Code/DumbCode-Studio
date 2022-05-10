import { NextApiRequest, NextApiResponse } from "next"

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const code = req.query.code
  if (code === undefined) {
    return res.status(400).json({ error: "Missing Code" })
  }
  const github = await fetch(`https://github.com/login/oauth/access_token?client_id=6df7dd9f54d48a6ab3a2&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=${code}`)
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
  // console.log(`'${authUser.login}' just logged in, id:${authUser.id}`)


  res.status(200).json({ github_token: accessToken })
}

export default handler