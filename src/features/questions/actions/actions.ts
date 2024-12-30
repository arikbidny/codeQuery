"use server";
import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";
import { createAzure } from "@ai-sdk/azure";
import { generateEmbedding } from "@/lib/openai";
import { db } from "@/server/db";

const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_INSTANCE_NAME,
  apiKey: process.env.AZURE_OPENAI_KEY,
});

// Function that receives question & projectId and returns a streamable value,
// searches in vector postgresql db store for the question and returns the answer
export async function askQuestion(question: string, projectId: string) {
  const stream = createStreamableValue();

  const queryVector = await generateEmbedding(question);

  if (!queryVector) {
    stream.error("Error generating query vector");
    return stream;
  }
  const vectorQuery = `[${queryVector.join(",")}]`;

  const result = (await db.$queryRaw`
        SELECT "fileName", "sourceCode", "summary",
        1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
        FROM "SourceCodeEmbedding"
        WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > .5
        AND "projectId" = ${projectId}
        ORDER BY similarity DESC
        LIMIT 10
    `) as { fileName: string; sourceCode: string; summary: string }[];

  let context = "";

  for (const doc of result) {
    context += `source: ${doc.fileName}\ncode content: ${doc.sourceCode}\n summary of file: ${doc.summary}\n\n`;
  }

  (async () => {
    const { textStream } = await streamText({
      model: azure("gpt-4o"),
      prompt: `
        You are an ai code assistant who answers questions about the codebase. Your target audience is a technical intern who is new to the codebase.
        The traits of AI include experts knowledge, helpfulness, cleverness, and articulateness.
        AI is a well-behaved and well-mannered individual.
        AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
        AI has the sum of all knowledge in their brain, and is able to accurately answer nearly and question about any topic in the world of code.
        If the question is asking about code or a specific file, AI will provide the detailed answer, giving step by step instructions if necessary.
        START CONTEXT BLOCK
        ${context}
        END CONTEXT BLOCK

        START QUESTION
        ${question}
        END OF QUESTION
        AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
        If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, I don't have enough information to answer that question."
        AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
        AI assistant will not invent anything that is not drawn directly from the context.
        Answer in markdown syntax, with code snippets if needed. Be as detailed as possible when answering, make sure there is no ambiguity in the response.
       `,
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }

    stream.done();
  })();

  return {
    output: stream.value,
    filesReferences: result,
  };
}
