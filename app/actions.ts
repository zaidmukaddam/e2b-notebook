'use server'

import { Sandbox, Result } from '@e2b/code-interpreter';
import { google } from '@ai-sdk/google';
import { CoreMessage, generateText, ImagePart } from 'ai';

// Helper function to serialize results
function serializeResult(result: Result) {
  return {
    text: result.text,
    html: result.html,
    markdown: result.markdown,
    svg: result.svg,
    png: result.png,
    jpeg: result.jpeg,
    pdf: result.pdf,
    latex: result.latex,
    json: result.json,
    javascript: result.javascript,
    raw: result.raw,
    data: result.data,
    chart: result.chart ? JSON.parse(JSON.stringify(result.chart)) : undefined,
    extra: result.extra ? JSON.parse(JSON.stringify(result.extra)) : undefined
  };
}

let sandbox: Sandbox | null = null;
let sandboxCreatedAt: number | null = null;
const SANDBOX_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds

async function initializeSandbox() {
  if (!sandbox) {
    sandbox = await Sandbox.create({
      apiKey: process.env.E2B_API_KEY
    });
    sandbox.setTimeout(SANDBOX_TIMEOUT);
    sandboxCreatedAt = Date.now();
  }
  return { sandbox, createdAt: sandboxCreatedAt };
}

export async function getSandboxTimeRemaining(): Promise<number> {
  if (!sandboxCreatedAt) return 0;
  const elapsed = Date.now() - sandboxCreatedAt;
  return Math.max(0, SANDBOX_TIMEOUT - elapsed);
}

export type SerializedResult = ReturnType<typeof serializeResult>;

export async function executeCode(code: string): Promise<{ 
  success: boolean;
  output?: string;
  error?: string;
  results?: SerializedResult[];
}> {
  try {
    const { sandbox } = await initializeSandbox();
    if (!sandbox) {
      throw new Error('Failed to initialize sandbox');
    }

    const execution = await sandbox.runCode(code);
    
    return {
      success: true,
      output: execution.text || execution.error?.traceback || 'No output',
      results: execution.results?.map(serializeResult)
    };
  } catch (error) {
    console.error('Execution error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      results: []
    };
  }
}

async function preProcessFile(file: File, options?: { cutOff?: number }) {
  const content = await file.text();

  if ((file.type === 'text/csv' || file.name.endsWith('.csv')) && options?.cutOff) {
    const lines = content.split('\n');
    return lines.slice(0, options.cutOff).join('\n');
  }

  return content;
}

export async function generateCode(prompt: string) {
  try {
    const { text } = await generateText({
      model: google('gemini-2.0-pro-exp-02-05'),
      system: `\
      - you are a Python code generator. 
      - generate only the code without any explanations. 
      - the code should be clean, efficient, and well-commented. 
      - do not use if __name__ == '__main__': or print statement as this a jupyter notebook like environment.`,
      prompt: prompt,
    });

    const codeMatch = text.match(/```python\s*\n([\s\S]*?)\n?```/);
    const cleanedCode = codeMatch ? codeMatch[1].trim() : text.trim();

    return {
      success: true,
      code: cleanedCode,
    };
  } catch (error) {
    console.error('Code generation error:', error);
    return {
      success: false,
      error: 'Failed to generate code',
    };
  }
}

export async function generateCodeWithFiles(prompt: string, files: File[]) {
  try {
    const {sandbox} = await initializeSandbox();
    if (!sandbox) {
      throw new Error('Failed to initialize sandbox');
    }

    // Process and upload files
    const filePromises = files.map(async (file) => {
      const content = await file.text();
      await sandbox.files.write(file.name, content);
      return file.name;
    });

    const uploadedFiles = await Promise.all(filePromises);

    const enhancedPrompt = `
Files available:
${uploadedFiles.map(name => `- ${name}`).join('\n')}

User prompt:
${prompt}

Generate Python code that:
1. Reads the CSV files using pandas
2. Processes the data as requested
3. Creates visualizations if needed
4. Uses proper error handling for file operations
    `;

    const { text } = await generateText({
      model: google('gemini-2.0-pro-exp-02-05'),
      system: `\
      - you are a Python code generator. 
      - generate only the code without any explanations. 
      - the code should be clean, efficient, and well-commented. 
      - do not use if __name__ == '__main__': or print function as this a jupyter notebook like environment so just put the output variable in the last line of the code.
      - use pandas to read CSV files from the current directory
      - do not overcomplicate the code, just use pandas to read the files and process the data as requested
      - include error handling for file operations`,
      prompt: enhancedPrompt,
    });

    const codeMatch = text.match(/```python\s*\n([\s\S]*?)\n?```/);
    const cleanedCode = codeMatch ? codeMatch[1].trim() : text.trim();

    return {
      success: true,
      code: cleanedCode,
    };
  } catch (error) {
    console.error('Code generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate code',
    };
  }
}

export async function analyzeOutput(output: string, results?: SerializedResult[]) {
  try {
    const messages: CoreMessage[] = [
      {
        role: 'system',
        content: `You are a data analysis expert. Provide clear, technical insights about code outputs and results.
Provide a clear, concise analysis of:
1. What the output shows
2. Key findings or patterns
3. Any potential issues or anomalies
4. Suggestions for further analysis
5. Do not use any markdown formatting
6. Explain in 3-4 sentences`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this Python code output:\n\n${output}`
          },
          // Add images from results if they exist
          ...(results?.flatMap(result => {
            const images: ImagePart[] = [];
            
            // Handle PNG images
            if (result.png) {
              images.push({
                type: 'image',
                image: `data:image/png;base64,${result.png}`,
                mimeType: 'image/png'
              });
            }
            
            // Handle SVG images
            if (result.svg) {
              images.push({
                type: 'image',
                image: `data:image/svg+xml;base64,${Buffer.from(result.svg).toString('base64')}`,
                mimeType: 'image/svg+xml'
              });
            }
            
            // Handle JPEG images
            if (result.jpeg) {
              images.push({
                type: 'image',
                image: `data:image/jpeg;base64,${result.jpeg}`,
                mimeType: 'image/jpeg'
              });
            }

            return images;
          }) || [])
        ]
      }
    ];

    const { text } = await generateText({
      model: google('gemini-2.0-pro-exp-02-05'),
      messages
    });

    return {
      success: true,
      analysis: text,
    };
  } catch (error) {
    console.error('Analysis error:', error);
    return {
      success: false,
      error: 'Failed to analyze output',
    };
  }
}

export async function fixCode(code: string, error: string) {
  try {
    const { text } = await generateText({
      model: google('gemini-2.0-pro-exp-02-05'),
      system: `You are a Python debugging expert. Fix the code while maintaining its original functionality.`,
      prompt: `
Fix this Python code that produced an error:

Code:
${code}

Error:
${error}

Requirements:
1. Keep the original functionality
2. Fix the error
3. Return only the fixed code without explanations
4. Use the same style and comments as the original
`,
    });

    const codeMatch = text.match(/```python\s*\n([\s\S]*?)\n?```/);
    const cleanedCode = codeMatch ? codeMatch[1].trim() : text.trim();

    return {
      success: true,
      code: cleanedCode,
    };
  } catch (error) {
    console.error('Fix error:', error);
    return {
      success: false,
      error: 'Failed to fix code',
    };
  }
} 