"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProjectSchema } from "@/features/projects/schemas";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import useRefetch from "@/hooks/use-refetch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CreateProjectPage = () => {
  const [repositoryName, setRepositoryName] = React.useState("github");
  const createProject = api.project.createProject.useMutation();
  const refetch = useRefetch();

  const form = useForm<z.infer<typeof createProjectSchema>>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      projectName: "",
      repositoryName: "github",
      repoUrl: "",
      githubToken: "",
    },
  });

  const onSubmit = (values: z.infer<typeof createProjectSchema>) => {
    console.log(values);
    // createProject.mutate(
    //   {
    //     projectName: values.projectName,
    //     repositoryName: values.repositoryName,
    //     repoUrl: values.repoUrl,
    //     githubToken: values.githubToken,
    //   },
    //   {
    //     onSuccess: () => {
    //       toast.success("Project created successfully");
    //       refetch();
    //       form.reset();
    //     },
    //     onError: (error) => {
    //       toast.error("Failed to create project");
    //     },
    //   },
    // );
  };

  return (
    <div className="flex h-full items-center justify-center gap-12">
      {/* select the image depenends on repository name if github so select imaage of github if gitlab select image of gitlab */}
      {repositoryName === "github" ? (
        <img
          src="/github-octocat-svgrepo-com.svg"
          alt="GitHub Octocat"
          className="h-72 w-auto"
        />
      ) : repositoryName === "gitlab" ? (
        <img src="/gitlab.png" alt="GitLab" className="h-72 w-auto" />
      ) : (
        <img
          src="/github-octocat-svgrepo-com.svg"
          alt="GitHub Octocat"
          className="h-72 w-auto"
        />
      )}

      {/* <Image
        src="/github-octocat-svgrepo-com.svg"
        alt="GitHub Octocat"
        width={56}
        height={56}
        style={{ width: "auto" }}
      /> */}
      <div>
        <div>
          <h1 className="text-2xl font-semibold">Link your Code Repository</h1>
          <p className="text-sm text-muted-foreground">
            Enter the URL of your Repository to link it to CodeQuery
          </p>
        </div>
        <div className="h-4"></div>
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-y-2">
                <FormField
                  control={form.control}
                  name="repositoryName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setRepositoryName(value);
                          }}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="repositoryName" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="github">GitHub</SelectItem>
                            <SelectItem value="gitlab">GitLab</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder="Project Name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="repoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder="Repository Url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {repositoryName === "github" && (
                  <FormField
                    control={form.control}
                    name="githubToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="GitHub Token ( Optional )"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {repositoryName === "gitlab" && (
                  <FormField
                    control={form.control}
                    name="githubToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="GitLab Token ( Optional )"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button
                  type="submit"
                  className="mt-4"
                  disabled={createProject.isPending}
                >
                  Create Project
                </Button>
              </div>
            </form>
          </Form>
          {/* <form onSubmit={handleSubmit(onSubmit)}>
            <Input
              {...register("projectName", { required: true })}
              placeholder="Project Name"
              required
            />
            <div className="h-2"></div>
            <Input
              {...register("repoUrl", { required: true })}
              placeholder="Repository URL"
              required
              type="url"
            />
            <div className="h-2"></div>
            <Input
              {...register("githubToken")}
              placeholder="GitHub Token ( Optional )"
            />
            <div className="h-4"></div>
            <Button type="submit">Create Project</Button>
          </form> */}
        </div>
      </div>
    </div>
  );
};

export default CreateProjectPage;
