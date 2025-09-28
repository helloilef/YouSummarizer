from langchain.schema import Document
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain_community.llms import HuggingFacePipeline
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from transformers import pipeline

# Prompt template
prompt_template = """
You are an AI tutor. Use the following transcript excerpts to answer the question.

Transcript context:
{context}

Question:
{question}

Guidelines:
1. If the answer is found in the transcript, base your reply mainly on that.
2. If the transcript does not fully answer the question, use your own general knowledge.
3. Clearly indicate if you are adding knowledge beyond the transcript (e.g., "From outside knowledge: ...").
4. Keep the answer clear, concise, and student-friendly.
"""
qa_prompt = PromptTemplate(template=prompt_template, input_variables=["context", "question"])

# Embeddings & LLM
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
generator = pipeline("text-generation", model="google/flan-t5-base", max_length=512, temperature=0)
llm = HuggingFacePipeline(pipeline=generator)

# Convert transcript to chunks
def transcript_to_docs(transcript_text):
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = splitter.split_text(transcript_text)
    return [Document(page_content=c) for c in chunks]

# Build RAG chain directly from transcript using FAISS in-memory
def answer_query(query, transcript_text):
    docs = transcript_to_docs(transcript_text)
    vectorstore = FAISS.from_documents(docs, embeddings)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

    chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        chain_type="stuff",
        return_source_documents=True,
        chain_type_kwargs={"prompt": qa_prompt}
    )

    result = chain({"query": query})
    return result["result"], result["source_documents"]
