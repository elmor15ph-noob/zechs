from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from pydantic import BaseModel
from fastapi.responses import FileResponse
import os
import tempfile

from api.analysis_engine import generate_alignment_report_content, create_pdf_report, generate_mermaid_diagram, query_knowledge_base

app = FastAPI(title="SAPS4HANA JEDI API")

class DiagramRequest(BaseModel):
    process_description: str

class ChatRequest(BaseModel):
    query: str

def remove_file(path: str):
    try:
        os.remove(path)
    except Exception as e:
        print(f"Error removing file {path}: {e}")

@app.get("/")
def read_root():
    return {"message": "Welcome to the SAPS4HANA JEDI", "status": "ok"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/analyze_workshop")
async def analyze_workshop(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """Accepts a markdown file, generates an alignment report via Ollama, and returns a PDF."""
    content = await file.read()
    notes = content.decode("utf-8")

    # Generate content using Ollama
    report_text = generate_alignment_report_content(notes)

    # Create temp file for PDF
    fd, pdf_path = tempfile.mkstemp(suffix=".pdf", prefix="report_")
    os.close(fd) # Close file descriptor, fpdf will open it

    create_pdf_report(report_text, output_path=pdf_path)

    background_tasks.add_task(remove_file, pdf_path)

    return FileResponse(pdf_path, media_type='application/pdf', filename="Standard_Alignment_Report.pdf")

@app.post("/generate_diagram")
def generate_diagram(request: DiagramRequest):
    """Generates a Mermaid.js diagram code based on a process description."""
    mermaid_code = generate_mermaid_diagram(request.process_description)
    return {"mermaid_code": mermaid_code}

@app.post("/chat")
def chat_expert(request: ChatRequest):
    """Queries the ChromaDB knowledge base."""
    answer = query_knowledge_base(request.query)
    return {"answer": answer}
