from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.docstore.document import Document
import math

embedding_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def calculate_dynamic_chunks(video_duration_minutes):
    """
    Calculate number of chunks as:
    number_of_chunks = 2 * number_of_hours (rounded up)
    """
    hours = video_duration_minutes / 60
    return max(1, math.ceil(hours * 2))  # Ensure at least 1 chunk
def force_exact_chunks(text, num_chunks):
    """
    Manually split the text into exactly `num_chunks` parts
    """
    text_length = len(text)
    avg_chunk_size = math.ceil(text_length / num_chunks)

    chunks = []
    for i in range(num_chunks):
        start = i * avg_chunk_size
        end = start + avg_chunk_size
        chunk_text = text[start:end].strip()
        if chunk_text:
            chunks.append(Document(page_content=chunk_text))
    
    print(f"✅ Manually created {len(chunks)} chunks (target was {num_chunks})")
    return chunks


def split_transcript_text_dynamic(text, video_duration_minutes):
    """
    Split transcript based on video duration using exact chunk count
    """
    target_chunks = calculate_dynamic_chunks(video_duration_minutes)
    
    print(f"📊 Video: {video_duration_minutes:.2f} min → {target_chunks} chunks (forced)")
    
    documents = force_exact_chunks(text, target_chunks)
    return documents
    

def split_transcript_text(text, chunk_size=1000, chunk_overlap=100):
    """Keep original function for backward compatibility"""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", "!", "?", " ", ""]
    )
    return splitter.create_documents([text])

def store_chunks_in_chroma(documents, persist_directory="chroma_db"):
    vectordb = Chroma.from_documents(
        documents=documents,
        embedding=embedding_model,
        persist_directory=persist_directory
    )
    vectordb.persist()
    return vectordb