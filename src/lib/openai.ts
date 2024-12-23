import { AzureOpenAI } from "openai";

const client = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_KEY,
  apiVersion: "2024-10-01-preview",
  deployment: "gpt-4o",
});

/**
 * Summarizes a git diff using OpenAI's GPT-4o model.
 *
 * @param {string} diff - The git diff string to be summarized.
 * @returns {Promise<string>} - A promise that resolves to the summary of the git diff.
 * @throws {Error} - Throws an error if the response content is undefined or null, or if there is an issue with the API request.
 *
 * @example
 * const diff = `diff --git a/lib/index.js b/lib/index.js
 * index aadf691..bfef603 100644
 * --- a/lib/index.js
 * +++ b/lib/index.js
 * +console.log('Hello, world!');`;
 *
 * summariseCommit(diff).then(summary => {
 *   console.log(summary);
 * }).catch(error => {
 *   console.error("Error summarizing commit:", error);
 * });
 */
export const aiSummarizeCommit = async (diff: string) => {
  const systemPrompt = `You are an expert programmer, and you are trying to summarize a git diff.
    Reminders about the git diff format:
    For every file, there are a few metadata lines, like (for example):
    \`\`\`
    diff --git a/lib/index.js b/lib/index.js
    index aadf691..bfef603 100644
    --- a/lib/index.js
    +++ b/lib/index.js
    \`\`\`
    This means that \`lib/index.js\` was modified in this commit. Note that this is only an example.
    Then there is a specifier of the lines that were modified.
    A line starting with \`+\` means it was added.
    A line that starting with \`-\` means that line was deleted.
    A line that starts with neither \`+\` nor \`-\` is code given for context and better understanding.
    It is not a part of the diff.
    [...]
    EXAMPLE SUMMARY COMMENTS:
    \`\`\`
    * Raised the amount of returned recordings from \`10\` to \`100\` [packages/server/recordings_api.ts], [packages/server/constants.ts]
    * Fixed a type in the github action name [.github/workflows/gpt-commit-summarizer.yml]
    * Moved the \`octokit\` initialization to a separate file [src/octokit.ts], [src/index.ts]
    * Added an OpenAI API for completions [packages/utils/apis/openai.ts]
    * Lowered numeric tolerance for test files
    \`\`\`
    Most commits will have less comments that this example list.
    The last comment does not include the file names,
    because there ware more that two relevant files in the hypothetical commit.
    Do not include parts of the example in your summary.
    It is given only as an example of appropriate comments.
    `;

  const userPrompt = `Summarize the following git diff file: \n\n${diff}`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const content = response?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("The response content is undefined or null.");
    }

    console.log(content);
    return content;
  } catch (error) {
    console.error("Error summarizing commit:", error);
    throw error;
  }
};
