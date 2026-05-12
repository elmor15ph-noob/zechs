import streamlit as st
import requests
from streamlit_mermaid import st_mermaid

st.set_page_config(page_title="SAP S/4HANA Architect", layout="wide")

API_BASE = "http://127.0.0.1:8000"

st.sidebar.title("SAP S/4HANA Architect")
mode = st.sidebar.radio("Select Mode", ["Expert Q&A", "Solution Architect"])

# Backend Health Check
try:
    response = requests.get(f"{API_BASE}/health")
    if response.status_code == 200:
        st.sidebar.success("Backend API: Online")
    else:
        st.sidebar.warning("Backend API: Error")
except requests.exceptions.ConnectionError:
    st.sidebar.error("Backend API: Offline")

if mode == "Expert Q&A":
    st.title("Expert Q&A (ChromaDB Vector Store)")
    st.write("Ask questions about help.sap.com content.")

    # Initialize chat history
    if "messages" not in st.session_state:
        st.session_state.messages = []

    # Display chat messages from history on app rerun
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    user_query = st.chat_input("What is the process for Intercompany Billing in S/4HANA?")

    if user_query:
        # Display user message in chat message container
        st.chat_message("user").markdown(user_query)
        # Add user message to chat history
        st.session_state.messages.append({"role": "user", "content": user_query})

        # Display assistant response in chat message container
        with st.chat_message("assistant"):
            message_placeholder = st.empty()
            message_placeholder.markdown("Thinking...")

            # Hit Backend
            try:
                res = requests.post(f"{API_BASE}/chat", json={"query": user_query})
                if res.status_code == 200:
                    answer = res.json().get("answer", "No answer received.")
                else:
                    answer = f"Error: API returned status code {res.status_code}"
            except Exception as e:
                answer = f"Error communicating with backend: {e}"

            message_placeholder.markdown(answer)

        # Add assistant response to chat history
        st.session_state.messages.append({"role": "assistant", "content": answer})

elif mode == "Solution Architect":
    st.title("Solution Architect Tools")

    tab1, tab2 = st.tabs(["Workshop Gap Analysis", "Diagram-as-Code"])

    with tab1:
        st.header("Upload Workshop Notes")
        st.write("Upload markdown notes to generate an SAP Standard Alignment Report (PDF).")
        uploaded_file = st.file_uploader("Choose a Markdown file", type="md")

        if uploaded_file is not None:
            if st.button("Generate Alignment Report"):
                with st.spinner("Analyzing workshop notes via local LLM..."):
                    files = {"file": (uploaded_file.name, uploaded_file.getvalue(), "text/markdown")}
                    res = requests.post(f"{API_BASE}/analyze_workshop", files=files)

                    if res.status_code == 200:
                        st.success("Report Generated Successfully!")
                        st.download_button(
                            label="Download PDF Report",
                            data=res.content,
                            file_name=f"Standard_Alignment_{uploaded_file.name}.pdf",
                            mime="application/pdf"
                        )
                    else:
                        st.error("Error generating report.")

    with tab2:
        st.header("Generate SAP Standard Flowchart")
        process_desc = st.text_area("Describe the business process (e.g., 'Customer places an order, SAP S/4HANA creates a sales order, External 3PL system handles logistics.')")

        if st.button("Generate Diagram"):
            if process_desc:
                with st.spinner("Generating Mermaid.js diagram..."):
                    res = requests.post(f"{API_BASE}/generate_diagram", json={"process_description": process_desc})
                    if res.status_code == 200:
                        mermaid_code = res.json().get("mermaid_code", "")
                        st.subheader("Generated Flowchart")
                        st_mermaid(mermaid_code, height=500)

                        with st.expander("View Mermaid Code"):
                            st.code(mermaid_code, language="mermaid")
                    else:
                        st.error("Error generating diagram.")
            else:
                st.warning("Please enter a business process description.")
