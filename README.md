# ✶ E2B Notebook

An interactive Python notebook environment powered by E2B and GENAI, designed for data analysis and visualization.

## Features

### 🔄 Code Execution
- Real-time Python code execution in an isolated sandbox environment
- Support for data analysis libraries (pandas, matplotlib, etc.)
- Cell-based execution with individual outputs
- Run all cells sequentially with state preservation

### 🤖 AI Integration
- AI-powered code generation from natural language prompts
- Smart error fixing suggestions for code errors
- Intelligent output analysis with visual context understanding
- AI-generated code safety warnings and review prompts

### 📊 Data Handling
- CSV file upload and processing
- Drag-and-drop file support
- File management sidebar with quick navigation
- Multiple file handling in a single cell

### 📈 Visualization
- Rich output display for charts and plots
- Support for multiple visualization formats:
  - PNG images
  - SVG graphics
  - JPEG images
  - Interactive charts
- Multi-column layout for multiple visualizations

### 💻 Code Editor
- Syntax highlighting for Python
- Auto-completion support
- Dark/Light theme support
- Dynamic editor sizing
- Code formatting

### 📝 Notebook Management
- Add/Delete cells
- Clear all cells
- Cell navigation
- Individual cell controls:
  - Run
  - Upload files
  - Generate code
  - Delete
  - Analyze output
  - Fix errors

### 🎨 User Interface
- Clean, modern design
- Responsive layout
- Collapsible file sidebar
- Loading states and progress indicators
- Tooltips for better usability
- Dark/Light mode support

### 🔍 Analysis Tools
- Output analysis with AI insights
- Error detection and fixing
- Visual data analysis
- Pattern recognition in outputs

### 🛡️ Safety Features
- Isolated code execution environment
- AI-generated code review prompts
- Error handling and recovery
- Secure file processing

## Environment Variables

```env
E2B_API_KEY=your_e2b_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- E2B Code Interpreter
- Gemini AI
- Monaco Editor
- Shadcn/ui Components
