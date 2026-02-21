# CrewAI Setup for World Monitor

This folder contains a Python-based multi-agent system using [CrewAI](https://github.com/crewAIInc/crewAI) to assist with development tasks.

## Agents

The crew consists of:
1.  **Tech Lead**: Analyzes architecture and ensures technical decisions are sound.
2.  **Senior Software Engineer**: Drafts implementation plans and writes code.
3.  **Code Reviewer (QA)**: Reviews proposals for bugs, security issues, and best practices.

## Setup

1.  **Install Python**: Ensure you have Python 3.10+ installed.
2.  **Create a Virtual Environment** (Recommended):
    ```bash
    cd crew
    python -m venv .venv
    # Windows:
    .venv\Scripts\activate
    # Mac/Linux:
    source .venv/bin/activate
    ```
3.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Configure Environment Variables**:
    - The script reads from the root `.env` file.
    - Make sure you have `GROQ_API_KEY` or `OPENAI_API_KEY` set in your `.env`.
    - If using OpenAI, `OPENAI_MODEL_NAME` can be set (defaults to `gpt-4-turbo`).

## Running the Crew

To run the default analysis task:

```bash
python main.py
```

## Customizing Tasks

Modify `main.py` to change the tasks or add new agents. You can ask the crew to:
- Refactor specific components.
- Write tests for a module.
- Plan a complex feature implementation.
