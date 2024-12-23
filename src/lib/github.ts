import { db } from "@/server/db";
import { Octokit } from "octokit";
import axios from "axios";
import { aiSummarizeCommit } from "./openai";

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const githubUrl = "https://github.com/docker/genai-stack";

type Response = {
  commitHash: string;
  commitMessage: string;
  commitAuthorName: string;
  commitAuthorAvatar: string;
  commitDate: string;
};

/**
 * Fetches the latest commit hashes from a specified GitHub repository.
 *
 * @param githubUrl - The URL of the GitHub repository.
 * @returns A promise that resolves to an array of the latest 10 commit details, each containing:
 *  - `commitHash`: The SHA hash of the commit.
 *  - `commitMessage`: The commit message.
 *  - `commitAuthorName`: The name of the commit author.
 *  - `commitAuthorAvatar`: The URL of the commit author's avatar.
 *  - `commitDate`: The date of the commit.
 */
export const getCommitHashes = async (
  githubUrl: string,
): Promise<Response[]> => {
  const [owner, repo] = githubUrl.split("/").slice(-2);

  if (!owner || !repo) {
    throw new Error("Invalid GitHub URL");
  }
  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
  });

  const sortedCommits = data.sort(
    (a: any, b: any) =>
      new Date(b.commit.author.date).getTime() -
      new Date(a.commit.author.date).getTime(),
  ) as any[];

  return sortedCommits.slice(0, 10).map((commit: any) => ({
    commitHash: commit.sha as string,
    commitMessage: commit.commit.message ?? "",
    commitAuthorName: commit.commit?.author?.name ?? "",
    commitAuthorAvatar: commit?.author?.avatar_url ?? "",
    commitDate: commit.commit?.author?.date ?? "",
  }));
};

// console.log(await getCommitHashes(githubUrl));
// // getCommitHashes(githubUrl);

export const pollCommits = async (projectId: string) => {
  const { project, githubUrl } = await fetchProjectGithubUrl(projectId);
  const commitHashes = await getCommitHashes(githubUrl);
  const unprocessedCommits = await filterUnprocessedCommits(
    projectId,
    commitHashes,
  );

  const summaryResponses = await Promise.allSettled(
    unprocessedCommits.map((commit) => {
      return summarizeCommit(githubUrl, commit.commitHash);
    }),
  );

  const summaries = summaryResponses.map((response) => {
    if (response.status === "fulfilled") {
      return response.value as string;
    }
    return "";
  });

  const commits = await db.commit.createMany({
    data: summaries.map((summary, index) => {
      return {
        projectId: projectId,
        commitHash: unprocessedCommits[index]!.commitHash,
        commitMessage: unprocessedCommits[index]!.commitMessage,
        commitAuthorName: unprocessedCommits[index]!.commitAuthorName,
        commitAuthorAvatar: unprocessedCommits[index]!.commitAuthorAvatar,
        commitDate: unprocessedCommits[index]!.commitDate,
        summary,
      };
    }),
  });

  return commits;
};

/**
 * Summarizes a specific commit from a GitHub repository.
 *
 * @param {string} githubUrl - The URL of the GitHub repository.
 * @param {string} commitHash - The hash of the commit to summarize.
 * @returns {Promise<string>} A promise that resolves to the summary of the commit.
 *
 * @throws {Error} If the request to GitHub fails or if the AI summarization fails.
 */
async function summarizeCommit(githubUrl: string, commitHash: string) {
  // get the diff, then summarize it with ai
  const { data } = await axios.get(`${githubUrl}/commit/${commitHash}.diff`, {
    headers: {
      Accept: "application/vnd.github.v3.diff",
    },
  });

  return (await aiSummarizeCommit(data)) || "";
}

/**
 * Fetches the GitHub URL of a project by its ID.
 *
 * @param {string} projectId - The ID of the project to fetch the GitHub URL for.
 * @returns {Promise<{ project: { githubUrl: string }, githubUrl: string }>}
 *          An object containing the project and its GitHub URL.
 * @throws {Error} If the project is not found or if the project has no GitHub URL.
 */
async function fetchProjectGithubUrl(projectId: string) {
  const project = await db.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      githubUrl: true,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }
  if (!project.githubUrl) {
    throw new Error("Project has no GitHub URL");
  }

  return {
    project,
    githubUrl: project.githubUrl,
  };
}

/**
 * Filters out the commits that have already been processed for a given project.
 * Leave only the unprocessed commits.
 * @param projectId - The ID of the project for which to filter commits.
 * @param commitHashes - An array of commit objects to be filtered.
 * @returns A promise that resolves to an array of unprocessed commit objects.
 */
async function filterUnprocessedCommits(
  projectId: string,
  commitHashes: Response[],
) {
  const processedCommits = await db.commit.findMany({
    where: {
      projectId,
    },
  });

  const unprocessedCommits = commitHashes.filter(
    (commit) =>
      !processedCommits.some(
        (processedCommit) => processedCommit.commitHash === commit.commitHash,
      ),
  );

  return unprocessedCommits;
}
