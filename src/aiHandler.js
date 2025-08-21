import OpenAI from "openai";
import { TOOL_MAP } from "./tools.js";
import inquirer from "inquirer";

const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export async function runAgent() {
  const { query } = await inquirer.prompt([
    {
      type: "input",
      name: "query",
      message: "How Can I Help You?",
    },
  ]);
  const SYSTEM_PROMPT = `
    You are an expert AI assistant and frontend developer. Your job is to answer user queries effectively and if asked, clone the UI of any website provided by the user, using a structured approach and the tools available to you.

    **Workflow Format:**  
    Always follow this sequence for each user request:  
    **START → THINK (multiple steps) → TOOL (if needed) → THINK (observe results) → OUTPUT**

    **General Instructions:**
    - Think carefully and explain your reasoning before taking any action.
    - Use the available tools only when needed, and always wait for the tool’s OBSERVATION (result) before proceeding.
    - Perform only one step at a time and output a single JSON object per step.
    - Always check your work before giving the final OUTPUT.
    - If any part of the cloned UI is missing or incorrect, iterate and fix it before OUTPUT.
    - All files and folders should be created inside a dedicated project folder.
    - Do not download assets; use their URLs in the HTML/CSS.
    - The cloned page must visually match the original, including scrollable content and asset references.

    **Available Tools:**
    - \`writeToFile([filename: string, content: string])\`: Creates or overwrites a file with the given content.
    - \`scrape(urlAndFolder: object{ url: string, outputFolder: string })\`: Scrapes the given URL and writes the HTML and a other assets inside the outputFolder.
    - \`downloadAsset(url: string, outputFolder: string)\`: Downloads an asset from the URL to the specified folder.

    **Rules:**
    - Always output a single JSON object per step, strictly following this format:  
      \`{ "step": "START | THINK | TOOL | OUTPUT", "content": "string", "tool_name": "string", "input": "STRING" }\`
    - Use multiple THINK steps to plan and verify before TOOL or OUTPUT.
    - Use TOOL steps only when you need to perform an action (scrape, write, download).
    - After each TOOL, observe and THINK about the result before proceeding.
    - OUTPUT only when the clone is complete and correct.

    **Example:**
    User: Clone the website https://www.example.com into folder "cloned-site"
    ASSISTANT: { "step": "START", "content": "User requested to clone https://www.example.com into 'cloned-site'." }
    ASSISTANT: { "step": "THINK", "content": "I need to scrape the website to get its HTML and assets. i see their is a tool named scrape which scrapes the html and asset of the url and writes automatically to the output folder" }
    ASSISTANT: { "step": "TOOL", "tool_name": "scrape", "input": {url:"https://www.example.com", outputFolder:"cloned-site"} }
    ASSISTANT: { "step": "THINK", "content": "the result from tool call is success" }
    ASSISTANT: { "step": "OUTPUT", "content": "Cloning complete. The UI of https://www.example.com is ready in 'cloned-site'." }

    **Remember:**  
    - Always use the tools effectively and only as needed.
    - Think and verify at every step.
    - Output one single json at a time strictly!

    `;

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: query },
  ];

  while (true) {
    const response = await client.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: messages,
      // extra_body: { google: { thinking_config: { thinking_budget: 1000 } } },
      // response_format: { type: "json_schema" },
      response_format: { type: "json_object" },
    });

    let raw = response.choices[0].message?.content || "";

    const parsedContent = JSON.parse(raw);

    messages.push({
      role: "assistant",
      content: JSON.stringify(parsedContent),
    });

    if (parsedContent.step === "START") {
      console.log(`🔥`, parsedContent.content);
      continue;
    }

    if (parsedContent.step === "THINK") {
      console.log(`\t🧠`, parsedContent.content);
      continue;
    }

    if (parsedContent.step === "TOOL") {
      const toolToCall = parsedContent.tool_name;
      if (!TOOL_MAP[toolToCall]) {
        messages.push({
          role: "developer",
          content: `There is no such tool as ${toolToCall}`,
        });
        continue;
      }
      const responseFromTool = await TOOL_MAP[toolToCall](parsedContent.input);
      console.log(
        `🛠️: ${toolToCall}(${parsedContent.input}) =`,
        responseFromTool
      );
      // messages.push({
      //   role: "Assistant",
      //   content: JSON.stringify({
      //     content: `the result from tool call is ${responseFromTool}`,
      //   }),
      // });
      continue;
    }

    if (parsedContent.step === "OUTPUT") {
      console.log(`🤖`, parsedContent.content);

      const { continueChat } = await inquirer.prompt([
        {
          name: "continueChat",
          type: "confirm",
          message: "Do You Want To Continue Chat?",
          default: true,
        },
      ]);

      if (continueChat) {
        const { followUpQuery } = await inquirer.prompt([
          {
            type: "input",
            name: "followUpQuery",
            message: "How Can I Help You?",
          },
        ]);

        messages.push({
          role: "user",
          content: followUpQuery,
        });
      } else {
        break;
      }
    }
  }
}
