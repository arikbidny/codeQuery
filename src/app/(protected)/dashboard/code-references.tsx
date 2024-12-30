"use client";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  lucario,
  atomDark,
  darcula,
  dracula,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Props = {
  fileReferences: { fileName: string; sourceCode: string; summary: string }[];
};

const CodeReferences = ({ fileReferences }: Props) => {
  const [tab, setTab] = useState(fileReferences[0]?.fileName);
  if (fileReferences.length === 0) return null;

  return (
    <div className="max-w-[80vw]">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex gap-2 overflow-scroll rounded-md bg-gray-200 p-1">
          {fileReferences.map((file) => (
            <button
              key={file.fileName}
              onClick={() => setTab(file.fileName)}
              className={cn(
                "m-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted",
                {
                  "bg-[#365486] text-primary-foreground hover:bg-[#365486]/90":
                    tab === file.fileName,
                },
              )}
            >
              {file.fileName}
            </button>
          ))}
        </div>
        {fileReferences.map((file) => (
          <TabsContent
            key={file.fileName}
            value={file.fileName}
            className="mb-2 max-h-[40vh] max-w-[85vw] overflow-scroll"
          >
            <SyntaxHighlighter style={dracula} language="typescript">
              {file.sourceCode}
            </SyntaxHighlighter>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default CodeReferences;
