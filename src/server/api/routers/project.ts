import { createProjectSchema } from "@/features/projects/schemas";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { pollCommits } from "@/lib/github";
import { z } from "zod";
import { indexGithubRepo } from "@/lib/github-loader";

export const projectRouter = createTRPCRouter({
  createProject: protectedProcedure
    .input(createProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.create({
        data: {
          repositoryUrl: input.repoUrl,
          repositoryName: input.repositoryName,
          name: input.projectName,
          usersToProjects: {
            create: {
              accountId: ctx.user.userId!,
            },
          },
        },
      });

      await indexGithubRepo(project.id, input.repoUrl, input.githubToken);
      await pollCommits(project.id);
      return project;
    }),
  getProjects: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.userId) {
      throw new Error("User ID is not defined");
    }

    return await ctx.db.project.findMany({
      where: {
        usersToProjects: {
          some: {
            accountId: ctx.user.userId!,
          },
        },
        deletedAt: null,
      },
    });
  }),
  getCommits: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      pollCommits(input.projectId).then().catch(console.error);
      return await ctx.db.commit.findMany({
        where: {
          projectId: input.projectId,
        },
      });
    }),
  saveAnswer: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        question: z.string(),
        answer: z.string(),
        filesReferences: z.any(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.question.create({
        data: {
          answer: input.answer,
          filesReferences: input.filesReferences,
          projectId: input.projectId,
          question: input.question,
          accountId: ctx.user.userId!,
        },
      });
    }),
  getQuestions: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.question.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          account: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),
});
