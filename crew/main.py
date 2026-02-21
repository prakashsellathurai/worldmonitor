import os
import sys
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process
from crewai_tools import DirectoryReadTool, FileReadTool, SerperDevTool
from langchain_groq import ChatGroq

# Load environment variables from the root .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

# Configuration for LLM
# Priority: GROQ_API_KEY -> OPENAI_API_KEY
llm = None
if os.getenv("GROQ_API_KEY"):
    print("Using Groq API for Agents")
    llm = ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model="llama3-70b-8192" # Using a capable model available on Groq
    )
elif os.getenv("OPENAI_API_KEY"):
    print("Using OpenAI API for Agents")
    model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-4-turbo")
    # CrewAI defaults to OpenAI if llm is not specified, but we can be explicit
else:
    print("WARNING: No GROQ_API_KEY or OPENAI_API_KEY found in .env. Please set one.")

# Tools
# Give agents access to the project files
directory_read_tool = DirectoryReadTool(directory='../src')
file_read_tool = FileReadTool()

# define search tool if key exists
search_tool = None
if os.getenv("SERPER_API_KEY"):
    search_tool = SerperDevTool()

tools = [directory_read_tool, file_read_tool]
if search_tool:
    tools.append(search_tool)

# Agents

# 1. Senior Software Engineer
senior_engineer = Agent(
    role='Senior Software Engineer',
    goal='Create high-quality, efficient, and scalable code solutions.',
    backstory="""You are a seasoned software engineer with extensive experience in TypeScript, React, and Node.js. 
    You understand design patterns, clean code principles, and performance optimization.
    You are working on the 'World Monitor' project.""",
    verbose=True,
    allow_delegation=False,
    tools=tools,
    llm=llm
)

# 2. Tech Lead / Architect
tech_lead = Agent(
    role='Tech Lead',
    goal='Ensure the technical architecture is sound and aligns with project goals.',
    backstory="""You are the technical visionary for the project. You review architectural decisions, 
    ensure scalability, and guide the development team. You are detail-oriented and catch potential issues early.""",
    verbose=True,
    allow_delegation=True,
    tools=tools,
    llm=llm
)

# 3. Code Reviewer / QA
code_reviewer = Agent(
    role='Code Reviewer',
    goal='Maintain code quality standards and ensure bug-free delivery.',
    backstory="""You are a meticulous code reviewer. You look for logic errors, security vulnerabilities, 
    and maintainability issues. You ensure that the code follows the project's style guide.""",
    verbose=True,
    allow_delegation=False,
    tools=tools,
    llm=llm
)

# Tasks

# Task 1: Analyze current project structure (Sample task to verify agents act on the codebase)
task1 = Task(
    description="""Analyze the current source code structure in the 'src' directory. 
    Identify the main components and services. 
    Provide a summary of the architecture and suggest 3 key improvements based on modern practices.""",
    expected_output="A markdown report summarizing the architecture and 3 improvement suggestions.",
    agent=tech_lead
)

# Task 2: Propose a new feature implementation (Example)
task2 = Task(
    description="""Based on the architecture analysis, draft a technical plan for adding a 'User Preferences' module. 
    This module should allow users to save their dashboard layout settings. 
    Outline the necessary files, data structures, and API modifications.""",
    expected_output="A technical specification document for the User Preferences module.",
    agent=senior_engineer,
    context=[task1]
)

# Task 3: Review the plan
task3 = Task(
    description="""Review the technical plan for the 'User Preferences' module. 
    Check for potential edge cases, security implications (e.g., input validation), and integration challenges. 
    Provide constructive feedback.""",
    expected_output="A review report with approval or requested changes.",
    agent=code_reviewer,
    context=[task2]
)

# Instantiate your crew with a sequential process
project_crew = Crew(
    agents=[tech_lead, senior_engineer, code_reviewer],
    tasks=[task1, task2, task3],
    verbose=True, # You can set it to 1 or 2 to different logging levels
    process=Process.sequential
)

if __name__ == "__main__":
    print("Starting Job Monitor Engineering Crew...")
    result = project_crew.kickoff()
    print("######################")
    print(result)
