from fastapi import FastAPI

app = FastAPI(title="Backend API")

@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI Backend", "status": "ok"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
