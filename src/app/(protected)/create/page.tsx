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

// type FormInput = {
//   repoUrl: string;
//   projectName: string;
//   githubToken?: string;
// };

const CreateProjectPage = () => {
  //   const { register, handleSubmit, reset } = useForm<FormInput>();

  //   function onSubmit(data: FormInput) {
  //     window.alert(JSON.stringify(data, null, 2));
  //     return true;
  //   }

  const form = useForm<z.infer<typeof createProjectSchema>>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      projectName: "",
      repoUrl: "",
      githubToken: "",
    },
  });

  const onSubmit = (values: z.infer<typeof createProjectSchema>) => {
    // print the values
    console.log(values);
  };

  return (
    <div className="flex h-full items-center justify-center gap-12">
      <img
        src="/github-octocat-svgrepo-com.svg"
        alt="GitHub Octocat"
        className="h-72 w-auto"
      />
      {/* <Image
        src="/github-octocat-svgrepo-com.svg"
        alt="GitHub Octocat"
        width={56}
        height={56}
        style={{ width: "auto" }}
      /> */}
      <div>
        <div>
          <h1 className="text-2xl font-semibold">
            Link your GitHub Repository
          </h1>
          <p className="text-muted-foreground text-sm">
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
                <Button type="submit" className="mt-4">
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
