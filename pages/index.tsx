import type { InferGetStaticPropsType } from 'next'
import Head from 'next/head'
import StudioContainer from '../src/containers/StudioContainer'
import ServersideContext from '../src/contexts/ServersideContext'


const Home = ({ githubClientId, commitAuthor, commitMessage, commitSha }: InferGetStaticPropsType<typeof getStaticProps>) => {
  const gitCommitMessage = `${commitMessage} - ${commitAuthor} (${commitSha})`
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no" />
        <meta name="description" content="A full stack blocky asset creation tool." />
        <meta name="theme-color" content="#262626" />
        <title>Dumbcode Studio</title>
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-icon.png"></link>
      </Head>
      <ServersideContext githubClientId={githubClientId} gitCommitMessage={gitCommitMessage} >
        <StudioContainer />
      </ServersideContext>
    </>
  )
}

export const getStaticProps = async () => {
  return {
    props: {
      githubClientId: process.env.GITHUB_CLIENT_ID ?? '',
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? '<unknown>',
      commitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? '',
      commitAuthor: process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME ?? '',
    },
  }
}

export default Home
