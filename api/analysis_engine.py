import re
import os
from fpdf import FPDF
from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate

# Configure Ollama (Assumes default local port)
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3") # Example model, easily configurable

llm = Ollama(model=OLLAMA_MODEL, base_url=OLLAMA_BASE_URL)

def generate_alignment_report_content(workshop_notes: str) -> str:
    """Uses Ollama to map keywords to SAP Best Practice IDs."""
    prompt = PromptTemplate(
        input_variables=["notes"],
        template="""You are an SAP S/4HANA Enterprise Architect following SAP Activate methodology.
Analyze the following workshop notes. Identify key business processes (e.g., 'Order-to-Cash', 'Intercompany Billing')
and map them to standard SAP S/4HANA Best Practice Scope Item IDs (e.g., BD9, 1RO).
Provide a clear, structured Gap-Analysis report against SAP standards.

Workshop Notes:
{notes}

Standard Alignment Report:"""
    )

    chain = prompt | llm
    return chain.invoke({"notes": workshop_notes})

def create_pdf_report(report_text: str, output_path: str = "Alignment_Report.pdf"):
    """Generates a PDF using fpdf2."""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", size=12)

    # Add Title
    pdf.set_font("Helvetica", style="B", size=16)
    pdf.cell(0, 10, "SAP S/4HANA Standard Alignment Report", new_x="LMARGIN", new_y="NEXT", align='C')
    pdf.ln(10)

    # Add Content (MultiCell handles line breaks)
    pdf.set_font("Helvetica", size=11)

    # fpdf2 might have issues with some Unicode characters from LLMs, encoding to latin-1 and replacing is safe fallback
    safe_text = report_text.encode('latin-1', 'replace').decode('latin-1')
    pdf.multi_cell(0, 8, safe_text)

    pdf.output(output_path)
    return output_path

def generate_mermaid_diagram(business_process: str) -> str:
    """Uses Ollama to generate a Mermaid.js flowchart adhering to SAP standards."""
    prompt = PromptTemplate(
        input_variables=["process"],
        template="""You are an SAP S/4HANA Enterprise Architect.
Generate a Mermaid.js flowchart for the following business process.
You MUST follow SAP standard swimlane conventions using three swimlanes exactly:
1. Customer
2. SAP S/4HANA
3. External System

Do NOT wrap the output in markdown code blocks (```mermaid). Output ONLY the raw Mermaid syntax starting with 'graph TD' or 'sequenceDiagram' etc.

Business Process Description:
{process}

Mermaid Flowchart:"""
    )

    chain = prompt | llm
    response = chain.invoke({"process": business_process})

    # Clean up output just in case the LLM still wraps it
    response = response.replace("```mermaid", "").replace("```", "").strip()
    return response

# --- Expert Q&A Logic ---
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "chroma_db")
COLLECTION_NAME = "sap_s4hana_docs"

# Initialize Chroma and Embeddings for Retrieval
try:
    embeddings = OpenAIEmbeddings()
    vector_store = Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings,
        persist_directory=CHROMA_DB_DIR
    )
    retriever = vector_store.as_retriever(search_kwargs={"k": 4})
except Exception as e:
    print(f"Warning: Could not initialize Chroma DB. Make sure the scraper/indexer ran. Error: {e}")
    retriever = None

def query_knowledge_base(query: str) -> str:
    """Queries the ChromaDB vector store and answers using Ollama."""
    if not retriever:
        return "Vector store is not initialized. Please run the indexer first."

    system_prompt = (
        "You are an SAP S/4HANA Enterprise Architect expert. "
        "Use the following pieces of retrieved context to answer the user's question about SAP S/4HANA. "
        "If you don't know the answer based on the context, say that you don't know. "
        "Prioritize SAP Activate methodology and SAP Best Practices.\n\n"
        "Context:\n{context}"
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}"),
    ])

    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    qa_chain = create_retrieval_chain(retriever, question_answer_chain)

    response = qa_chain.invoke({"input": query})
    return response["answer"]
