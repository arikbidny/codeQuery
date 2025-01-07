import { db } from "@/server/db";
import axios from "axios";
import { get } from "http";

const GITLAB_API_URL = "https://gitlab.com/api/v4";
const PERSONAL_ACCESS_TOKEN = process.env.GITLAB_TOKEN;

type Response = {
  commitHash: string;
  commitMessage: string;
  commitAuthorName: string;
  commitAuthorAvatar: string;
  commitDate: string;
};

export const getGitLabCommits = async (
  gitlabUrl: string,
): Promise<Response[] | undefined> => {
  console.log("Running getGitLabCommits function");
  //   const projectId = "arikbi/gitlab-test";

  const gitlabProjectId = gitlabUrl.split("/").slice(-2).join("/");

  const commitsEndpoint = `${GITLAB_API_URL}/projects/${encodeURIComponent(gitlabProjectId)}/repository/commits`;

  try {
    const response = await axios.get(commitsEndpoint, {
      headers: {
        "Private-Token": PERSONAL_ACCESS_TOKEN, // Authorization header
      },
      params: {
        per_page: 100, // Number of commits per page (max: 100)
        page: 1, // Starting page
      },
    });

    const commits = response.data;

    const sortedCommits = commits.sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    console.log("Commits:", sortedCommits);

    return sortedCommits.slice(0, 10).map((commit: any) => ({
      commitHash: commit.id as string,
      commitMessage: commit.message ?? "",
      commitAuthorName: commit.author_name ?? "",
      commitAuthorAvatar: commit.author_avatar_url ?? "",
      commitDate: commit.created_at ?? "",
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error:", error.response?.data || error.message);
    } else {
      console.error("Unexpected error:", error);
      return [];
    }
  }
};

console.log(await getGitLabCommits("arikbi/gitlab-test"));

export const pollGitLabCommits = async (projectId: string) => {
  const { project, repositoryUrl } = await fetchProjectGithubUrl(projectId);
  const commitHashes = await getGitLabCommits(projectId);
  if (!commitHashes) {
    throw new Error("Failed to fetch commit hashes");
  }
  const unprocessedCommits = await filterUnprocessedCommits(
    projectId,
    commitHashes,
  );
};

// UTILS
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
