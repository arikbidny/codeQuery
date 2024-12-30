"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import MDEditor from "@uiw/react-md-editor";
import useProject from "@/features/projects/hooks/use-project";
import { askQuestion } from "@/features/questions/actions/actions";
import { readStreamableValue } from "ai/rsc";
import Image from "next/image";

import { useState } from "react";
import CodeReferences from "./code-references";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import useRefetch from "@/hooks/use-refetch";

const AskQuestionCard = () => {
  const { project } = useProject();
  const [question, setQuestion] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCodeReferences, setShowCodeReferences] = useState(false);
  const [filesReferences, setFilesReferences] = useState<
    { fileName: string; sourceCode: string; summary: string }[]
  >([]);
  const [answer, setAnswer] = useState("");
  const saveAnswer = api.project.saveAnswer.useMutation();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setAnswer("");
    setFilesReferences([]);
    e.preventDefault();
    if (!project?.id) return;
    setLoading(true);

    // const res = await askQuestion(question, project.id);
    // console.log(res);
    try {
      const res = await askQuestion(question, project.id);
      setOpen(true);
      if ("filesReferences" in res) {
        const { output, filesReferences } = res;
        console.log(output, filesReferences);
        setFilesReferences(filesReferences);

        for await (const delta of readStreamableValue(output)) {
          if (delta) {
            setAnswer((ans) => ans + delta);
            setShowCodeReferences(true);
          }
        }
        setLoading(false);
      } else {
        // handle streaming case or other return type
        console.log("Streaming output:", res);
      }
    } catch (error) {
      console.error(error);
    }
    // const { output, filesReferences } = await askQuestion(question, project.id);
  };

  const refetch = useRefetch();

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="!max-h-[80vh] sm:max-w-[80vw]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>
                <Image
                  src="/logo.png"
                  alt="codeQuery"
                  width={130}
                  height={130}
                />
              </DialogTitle>
              <Button
                variant={"outline"}
                disabled={saveAnswer.isPending}
                onClick={() => {
                  saveAnswer.mutate(
                    {
                      projectId: project?.id!,
                      question,
                      answer,
                      filesReferences,
                    },
                    {
                      onSuccess: () => {
                        toast.success("Answer saved successfully");
                        refetch();
                      },
                      onError: () => {
                        toast.error("Failed to save answer");
                      },
                    },
                  );
                }}
              >
                Save Answer
              </Button>
            </div>
          </DialogHeader>

          <div
            data-color-mode="light"
            className="!h-full max-h-[70vh] max-w-[85vw] overflow-scroll"
          >
            <MDEditor.Markdown source={answer} />

            <div className="h-4"></div>
            {showCodeReferences && (
              <CodeReferences fileReferences={filesReferences} />
            )}
          </div>

          <Button
            type="button"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
      <Card className="">
        <CardHeader>
          <CardTitle>Ask a question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <Textarea
              placeholder="Which file should I edit to change the home page?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className="h-4"></div>
            <Button type="submit">Ask CodeQuery!</Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default AskQuestionCard;
