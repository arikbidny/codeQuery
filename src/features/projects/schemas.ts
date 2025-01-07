import { z } from "zod";

export const createProjectSchema = z.object({
  projectName: z.string().trim().nonempty("Project name is required"),
  repositoryName: z.string().trim().nonempty("Repository name is required"),
  repoUrl: z
    .string()
    .trim()
    .nonempty("Repository URL is required")
    .url("Invalid URL"),
  githubToken: z.string().trim().optional(),
});
