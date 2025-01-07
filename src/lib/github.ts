import { db } from "@/server/db";
import { Octokit } from "octokit";
import axios from "axios";
import { aiSummarizeCommit } from "./openai";

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const repositoryUrl = "https://github.com/docker/genai-stack";

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
 * @param repositoryUrl - The URL of the GitHub repository.
 * @returns A promise that resolves to an array of the latest 10 commit details, each containing:
 *  - `commitHash`: The SHA hash of the commit.
 *  - `commitMessage`: The commit message.
 *  - `commitAuthorName`: The name of the commit author.
 *  - `commitAuthorAvatar`: The URL of the commit author's avatar.
 *  - `commitDate`: The date of the commit.
 */
export const getCommitHashes = async (
  repositoryUrl: string,
): Promise<Response[]> => {
  const [owner, repo] = repositoryUrl.split("/").slice(-2);

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

console.log(await getCommitHashes(repositoryUrl));
// // getCommitHashes(githubUrl);

/**
 * Polls the commits for a given project, summarizes them, and stores the summaries in the database.
 *
 * @param {string} projectId - The ID of the project to poll commits for.
 * @returns {Promise<any>} A promise that resolves to the created commits.
 *
 * This function performs the following steps:
 * 1. Fetches the GitHub URL for the given project ID.
 * 2. Retrieves the commit hashes from the GitHub repository.
 * 3. Filters out the commits that have already been processed.
 * 4. Summarizes the unprocessed commits.
 * 5. Stores the summarized commits in the database.
 */
export const pollCommits = async (projectId: string) => {
  const { project, repositoryUrl } = await fetchProjectGithubUrl(projectId);
  const commitHashes = await getCommitHashes(repositoryUrl);
  const unprocessedCommits = await filterUnprocessedCommits(
    projectId,
    commitHashes,
  );

  const summaryResponses = await Promise.allSettled(
    unprocessedCommits.map((commit) => {
      return summarizeCommit(repositoryUrl, commit.commitHash);
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
      console.log(`processing commit ${index}`);
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
async function summarizeCommit(repositoryUrl: string, commitHash: string) {
  // get the diff, then summarize it with ai
  const { data } = await axios.get(
    `${repositoryUrl}/commit/${commitHash}.diff`,
    {
      headers: {
        Accept: "application/vnd.github.v3.diff",
      },
    },
  );

  return (await aiSummarizeCommit(data)) || "";
}

/**
 * Fetches the GitHub URL of a project by its ID.
 *
 * @param {string} projectId - The ID of the project to fetch the GitHub URL for.
 * @returns {Promise<{ project: { repositoryUrl: string }, repositoryUrl: string }>}
 *          An object containing the project and its GitHub URL.
 * @throws {Error} If the project is not found or if the project has no GitHub URL.
 */
async function fetchProjectGithubUrl(projectId: string) {
  const project = await db.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      repositoryUrl: true,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }
  if (!project.repositoryUrl) {
    throw new Error("Project has no GitHub URL");
  }

  return {
    project,
    repositoryUrl: project.repositoryUrl,
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
