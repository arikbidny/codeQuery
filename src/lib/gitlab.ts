import axios from "axios";

const GITLAB_API_URL = "https://gitlab.com/api/v4";
const PERSONAL_ACCESS_TOKEN = process.env.GITLAB_TOKEN;

export const getGitLabCommits = async (gitlabProjectId: string) => {
  console.log("Running getGitLabCommits function");
  //   const projectId = "arikbi/gitlab-test";

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

    const slicedCommits = sortedCommits.slice(0, 10).map((commit: any) => ({
      commitHash: commit.id,
      commitMessage: commit.message,
      commitAuthorName: commit.author_name,
      commitAuthorAvatar: commit.author_avatar_url ?? "",
      commitDate: commit.created_at,
    }));

    console.log("Sliced commits:", slicedCommits);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error:", error.response?.data || error.message);
    } else {
      console.error("Unexpected error:", error);
    }
  }
};

getGitLabCommits("arikbi/gitlab-test");
