import { api } from "@/trpc/react";
import { useLocalStorage } from "usehooks-ts";

const useProject = () => {
  const { data: projects } = api.project.getProjects.useQuery();
  console.log("projects");
  console.log(projects);

  const [projectId, setProjectId] = useLocalStorage("codequery-projectId", "");

  const project = projects?.find((project) => project.id === projectId);

  return {
    projects,
    project,
    projectId,
    setProjectId,
  };
};

export default useProject;
