import { createProjectSchema } from "@/features/projects/schemas";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const projectRouter = createTRPCRouter({
  createProject: protectedProcedure
    .input(createProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.create({
        data: {
          githubUrl: input.repoUrl,
          name: input.projectName,
          usersToProjects: {
            create: {
              accountId: ctx.user.userId!,
            },
          },
        },
      });

      return project;
    }),
  getProjects: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.userId) {
      throw new Error("User ID is not defined");
    }
    console.log("GET PROJECT FUNCTIONNNNNNNNNNNNNNNNNNN");
    console.log(ctx.user.userId);
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
});
