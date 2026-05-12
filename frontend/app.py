import streamlit as st
import requests

st.set_page_config(page_title="SAP S/4HANA Knowledge Base", layout="wide")

st.title("SAP S/4HANA Assistant")

st.sidebar.header("Backend Status")
try:
    response = requests.get("http://127.0.0.1:8000/health")
    if response.status_code == 200:
        st.sidebar.success("API is connected and healthy")
    else:
        st.sidebar.warning(f"API returned status code: {response.status_code}")
except requests.exceptions.ConnectionError:
    st.sidebar.error("Could not connect to the backend API. Is it running?")

st.write("Welcome to the SAP S/4HANA Knowledge Base. Chat interface coming soon!")
